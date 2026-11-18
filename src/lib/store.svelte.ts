import { isActive, type DataByKind, type SyncKind, type SyncRecord } from './records';

/** O que o store precisa para guardar os dados. No navegador é o localStorage. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStorage(): KeyValueStorage {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
}

export interface StoreOptions {
  storage?: KeyValueStorage;
  key?: string;
  clock?: () => number;
  newId?: () => string;
}

/**
 * Todos os registros do aparelho, incluindo os excluídos (que precisam chegar aos outros aparelhos).
 * Regras iguais às do app:
 * - editar sempre avança `updatedAt` (o `touch()` do app);
 * - excluir só preenche `deletedAt` (o `softDelete()` do app);
 * - as telas usam `active`, que esconde os excluídos.
 */
export class RecordStore {
  #records = $state.raw<SyncRecord[]>([]);
  #storage: KeyValueStorage;
  #key: string;
  #clock: () => number;
  #newId: () => string;
  #listeners = new Set<() => void>();

  constructor(options: StoreOptions = {}) {
    this.#storage = options.storage ?? memoryStorage();
    this.#key = options.key ?? 'myapp.records';
    this.#clock = options.clock ?? (() => Date.now());
    this.#newId = options.newId ?? (() => crypto.randomUUID());
    this.#records = this.#load();
  }

  #load(): SyncRecord[] {
    try {
      const parsed = JSON.parse(this.#storage.getItem(this.#key) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  #save(records: SyncRecord[]) {
    this.#records = records;
    this.#storage.setItem(this.#key, JSON.stringify(records));
    for (const listener of this.#listeners) listener();
  }

  /** Avisa a cada alteração. Devolve a função para parar de ouvir. */
  onChange(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  get all(): SyncRecord[] {
    return this.#records;
  }

  get(id: string): SyncRecord | undefined {
    return this.#records.find((record) => record.id === id);
  }

  active<K extends SyncKind>(kind: K): SyncRecord<K>[] {
    return this.#records.filter((record) => record.kind === kind && isActive(record)) as SyncRecord<K>[];
  }

  /** Perfil em uso: o mais antigo, como no app, caso dois aparelhos tenham criado um cada. */
  get profile(): SyncRecord<'profile'> | undefined {
    return this.active('profile').toSorted((a, b) => a.data.createdAt - b.data.createdAt)[0];
  }

  insert<K extends SyncKind>(kind: K, data: DataByKind[K]): SyncRecord<K> {
    const record: SyncRecord<K> = { id: this.#newId(), kind, updatedAt: this.#clock(), deletedAt: null, data };
    this.#save([...this.#records, record]);
    return record;
  }

  /** Data de alteração sempre maior que a anterior, mesmo se o relógio voltar. */
  #nextUpdatedAt(record: SyncRecord): number {
    return Math.max(this.#clock(), record.updatedAt + 1);
  }

  update<K extends SyncKind>(id: string, change: (data: DataByKind[K]) => DataByKind[K]): void {
    this.#save(
      this.#records.map((record) =>
        record.id === id
          ? { ...record, data: change(record.data as DataByKind[K]), updatedAt: this.#nextUpdatedAt(record) }
          : record,
      ),
    );
  }

  softDelete(id: string): void {
    this.#save(
      this.#records.map((record) => {
        if (record.id !== id) return record;
        const at = this.#nextUpdatedAt(record);
        return { ...record, deletedAt: at, updatedAt: at };
      }),
    );
  }

  /** Registros alterados depois de `since` (ou todos, se for null), incluindo exclusões. */
  changedSince(since: number | null): SyncRecord[] {
    return this.#records.filter((record) => since == null || record.updatedAt > since);
  }

  /**
   * Aplica registros vindos do servidor. Vence o `updatedAt` mais recente; em empate, fica a versão local.
   * Devolve quantos foram aplicados.
   */
  merge(incoming: SyncRecord[]): number {
    const byId = new Map(this.#records.map((record) => [record.id, record]));
    let applied = 0;
    for (const record of incoming) {
      const local = byId.get(record.id);
      if (local && record.updatedAt <= local.updatedAt) continue;
      byId.set(record.id, { ...record, deletedAt: record.deletedAt ?? null });
      applied += 1;
    }
    if (applied > 0) this.#save([...byId.values()]);
    return applied;
  }

  /** Apaga tudo deste aparelho. Usado depois de excluir a conta. */
  clear(): void {
    this.#save([]);
  }
}
