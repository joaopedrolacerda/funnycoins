import { describe, expect, it } from 'vitest';
import { RecordStore } from './store.svelte';
import { SyncState, syncOnce, type SyncRequest, type SyncResponse } from './sync';
import type { SyncRecord } from './records';
import { testStore } from './test-support';

const entryData = (title: string) => ({ title, amountCents: 1000, date: 1, kind: 'income' as const, category: 'salary' });

describe('RecordStore', () => {
  it('excluir só marca deletedAt e esconde das telas', () => {
    const { store, advance } = testStore();
    const record = store.insert('cashEntry', entryData('Salário'));
    advance(1000);
    store.softDelete(record.id);

    expect(store.active('cashEntry')).toEqual([]);
    const saved = store.get(record.id);
    expect(saved?.deletedAt).toBe(saved?.updatedAt);
    expect(saved?.updatedAt).toBeGreaterThan(record.updatedAt);
  });

  it('editar avança updatedAt mesmo se o relógio voltar', () => {
    const { store, advance } = testStore();
    const record = store.insert('cashEntry', entryData('A'));
    advance(-5000);
    store.update<'cashEntry'>(record.id, (data) => ({ ...data, title: 'B' }));
    expect(store.get(record.id)?.updatedAt).toBe(record.updatedAt + 1);
  });

  it('guarda e recarrega do armazenamento', () => {
    const { store, storage } = testStore();
    store.insert('cashEntry', entryData('Salário'));
    const reloaded = new RecordStore({ storage });
    expect(reloaded.active('cashEntry')).toHaveLength(1);
  });

  it('usa o perfil mais antigo quando houver dois', () => {
    const { store } = testStore();
    const base = { monthlyEssentialCostCents: 1, targetMonths: 6, investPercent: 10, petColor: 'green' };
    store.insert('profile', { ...base, petName: 'Novo', createdAt: 200 });
    store.insert('profile', { ...base, petName: 'Antigo', createdAt: 100 });
    expect(store.profile?.data.petName).toBe('Antigo');
  });

  it('merge: vence o mais recente e o empate fica com o local', () => {
    const { store } = testStore();
    const local = store.insert('cashEntry', entryData('Local'));
    const remote = (title: string, updatedAt: number): SyncRecord => ({
      id: local.id,
      kind: 'cashEntry',
      updatedAt,
      data: entryData(title),
    });

    expect(store.merge([remote('Antigo', local.updatedAt - 1), remote('Empate', local.updatedAt)])).toBe(0);
    expect(store.get(local.id)?.data).toMatchObject({ title: 'Local' });

    expect(store.merge([remote('Novo', local.updatedAt + 1)])).toBe(1);
    expect(store.get(local.id)?.data).toMatchObject({ title: 'Novo' });
    expect(store.get(local.id)?.deletedAt).toBeNull();
  });
});

describe('sincronização', () => {
  /** Servidor falso com as regras de shared/API.md. */
  function fakeServer() {
    const rows = new Map<string, SyncRecord & { seq: number }>();
    let seq = 0;
    const requests: SyncRequest[] = [];
    const transport = async (request: SyncRequest): Promise<SyncResponse> => {
      requests.push(structuredClone(request));
      for (const record of request.changes) {
        const saved = rows.get(record.id);
        if (!saved || record.updatedAt > saved.updatedAt) rows.set(record.id, { ...record, seq: ++seq });
      }
      const cursor = request.cursor ?? 0;
      const changes = [...rows.values()]
        .filter((row) => row.seq > cursor)
        .sort((a, b) => a.seq - b.seq)
        .map(({ seq: _seq, ...record }) => record);
      return { cursor: seq, changes };
    };
    return { transport, requests };
  }

  it('envia só o que mudou desde a última vez', async () => {
    const { store, storage, advance, now } = testStore();
    const server = fakeServer();
    const state = new SyncState(storage);
    store.insert('cashEntry', entryData('Salário'));
    advance(1);

    const first = await syncOnce(store, state, server.transport, now + 1);
    expect(first.pushed).toBe(1);
    expect(state.cursor).toBe(1);

    advance(10);
    const second = await syncOnce(store, state, server.transport, now + 11);
    expect(second.pushed).toBe(0);
    expect(server.requests[1].cursor).toBe(1);
  });

  it('não manda deletedAt para registros ativos e manda nas exclusões', async () => {
    const { store, storage, advance } = testStore();
    const server = fakeServer();
    const active = store.insert('cashEntry', entryData('Ativo'));
    const removed = store.insert('cashEntry', entryData('Excluído'));
    advance(5);
    store.softDelete(removed.id);

    await syncOnce(store, new SyncState(storage), server.transport);
    const sent = server.requests[0].changes;
    expect(sent.find((r) => r.id === active.id)).not.toHaveProperty('deletedAt');
    expect(sent.find((r) => r.id === removed.id)?.deletedAt).toBeTypeOf('number');
  });

  it('dois aparelhos convergem', async () => {
    const server = fakeServer();
    const phone = testStore();
    const laptop = testStore();
    const phoneState = new SyncState(phone.storage);
    const laptopState = new SyncState(laptop.storage);

    phone.store.insert('cashEntry', entryData('Do celular'));
    phone.advance(1);
    await syncOnce(phone.store, phoneState, server.transport, phone.now);
    await syncOnce(laptop.store, laptopState, server.transport, laptop.now);
    expect(laptop.store.active('cashEntry').map((r) => r.data.title)).toEqual(['Do celular']);

    // O laptop exclui; o celular recebe a exclusão.
    laptop.advance(100);
    const [record] = laptop.store.active('cashEntry');
    laptop.store.softDelete(record.id);
    laptop.advance(1);
    await syncOnce(laptop.store, laptopState, server.transport, laptop.now);
    await syncOnce(phone.store, phoneState, server.transport, phone.now + 1000);
    expect(phone.store.active('cashEntry')).toEqual([]);
  });

  it('falha no servidor não avança o estado', async () => {
    const { store, storage } = testStore();
    const state = new SyncState(storage);
    store.insert('cashEntry', entryData('Salário'));
    await expect(syncOnce(store, state, async () => Promise.reject(new Error('offline')))).rejects.toThrow();
    expect(state.cursor).toBeNull();
    expect(state.lastSyncedAt).toBeNull();
  });

  it('reset faz a próxima sincronização mandar tudo', () => {
    const { storage } = testStore();
    const state = new SyncState(storage);
    state.save(10, 1234);
    expect(new SyncState(storage).cursor).toBe(10);
    state.reset();
    expect(new SyncState(storage).cursor).toBeNull();
  });
});
