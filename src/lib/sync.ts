// Motor de sincronização do site. Mesmo algoritmo de SyncEngine.swift.

import type { SyncRecord } from './records';
import type { KeyValueStorage, RecordStore } from './store.svelte';

export interface SyncRequest {
  cursor: number | null;
  changes: SyncRecord[];
}

export interface SyncResponse {
  cursor: number;
  changes: SyncRecord[];
}

export type SyncTransport = (request: SyncRequest) => Promise<SyncResponse>;

export interface SyncSummary {
  pushed: number;
  applied: number;
  ignored: number;
}

/** Progresso da sincronização guardado entre uma vez e outra. */
export class SyncState {
  cursor: number | null = null;
  lastSyncedAt: number | null = null;

  constructor(
    private storage: KeyValueStorage,
    private key = 'myapp.sync',
  ) {
    try {
      const saved = JSON.parse(storage.getItem(key) ?? '{}');
      this.cursor = typeof saved.cursor === 'number' ? saved.cursor : null;
      this.lastSyncedAt = typeof saved.lastSyncedAt === 'number' ? saved.lastSyncedAt : null;
    } catch {
      // Estado corrompido: começa do zero, o que só reenvia tudo.
    }
  }

  save(cursor: number, lastSyncedAt: number) {
    this.cursor = cursor;
    this.lastSyncedAt = lastSyncedAt;
    this.storage.setItem(this.key, JSON.stringify({ cursor, lastSyncedAt }));
  }

  /** Esquece o progresso: a próxima sincronização envia e recebe tudo. */
  reset() {
    this.cursor = null;
    this.lastSyncedAt = null;
    this.storage.removeItem(this.key);
  }
}

export async function syncOnce(
  store: RecordStore,
  state: SyncState,
  transport: SyncTransport,
  now: number = Date.now(),
): Promise<SyncSummary> {
  // Marca o início: alterações feitas durante a sincronização vão na próxima.
  const startedAt = now;
  const changes = store.changedSince(state.lastSyncedAt).map(toWire);

  const response = await transport({ cursor: state.cursor, changes });
  const applied = store.merge(response.changes);

  // Só avança o estado depois de tudo aplicado.
  state.save(response.cursor, startedAt);
  return { pushed: changes.length, applied, ignored: response.changes.length - applied };
}

/** No contrato, `deletedAt` é omitido quando o registro está ativo. */
function toWire(record: SyncRecord): SyncRecord {
  const { deletedAt, ...rest } = record;
  return deletedAt == null ? rest : { ...rest, deletedAt };
}
