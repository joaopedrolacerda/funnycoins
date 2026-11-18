// Estado global do site: dados locais, sessão, sincronização e o jogo calculado.

import { api, ApiError, type Session } from './api';
import { computeSnapshot, gameInput, type Snapshot } from './game';
import { RecordStore } from './store.svelte';
import { SyncState, syncOnce } from './sync';

const SESSION_KEY = 'myapp.session';

function loadSession(): Session | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
    return saved?.token ? saved : null;
  } catch {
    return null;
  }
}

export type SyncStatus = 'offline' | 'syncing' | 'ok' | 'error';

class AppState {
  readonly store = new RecordStore({ storage: localStorage });
  readonly syncState = new SyncState(localStorage);

  session = $state<Session | null>(loadSession());
  syncStatus = $state<SyncStatus>('offline');
  syncMessage = $state('');
  lastSyncAt = $state<number | null>(null);

  /** Hoje. Atualiza a cada minuto para a fome e as contas virarem o dia sozinhas. */
  now = $state(Date.now());

  readonly input = $derived(gameInput(this.store, this.now));
  /** Calculado a cada mudança, nunca salvo: XP, conquistas e humor vêm dos dados. */
  readonly snapshot = $derived<Snapshot | null>(this.input ? computeSnapshot(this.input) : null);

  #timer: ReturnType<typeof setTimeout> | undefined;
  #syncing = false;

  start() {
    setInterval(() => {
      this.now = Date.now();
      if (this.session) void this.syncNow();
    }, 60_000);
    this.store.onChange(() => this.scheduleSync());
    window.addEventListener('online', () => void this.syncNow());
    window.addEventListener('focus', () => void this.syncNow());
    if (this.session) void this.syncNow();
  }

  /** Espera um pouco depois da última alteração para mandar tudo junto. */
  scheduleSync() {
    if (!this.session || this.#syncing) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => void this.syncNow(), 1500);
  }

  async syncNow() {
    const session = this.session;
    if (!session || this.#syncing) return;
    this.#syncing = true;
    this.syncStatus = 'syncing';
    try {
      const summary = await syncOnce(this.store, this.syncState, (body) => api.sync(session.token, body));
      this.syncStatus = 'ok';
      this.lastSyncAt = Date.now();
      this.syncMessage =
        summary.pushed + summary.applied > 0
          ? `Enviados ${summary.pushed}, recebidos ${summary.applied}`
          : 'Tudo em dia';
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.#setSession(null);
        this.syncStatus = 'offline';
        this.syncMessage = 'Sua sessão expirou. Entre de novo para sincronizar.';
      } else {
        this.syncStatus = 'error';
        this.syncMessage = error instanceof Error ? error.message : 'Não deu para sincronizar';
      }
    } finally {
      this.#syncing = false;
    }
  }

  #setSession(session: Session | null) {
    this.session = session;
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }

  /** Entra numa conta. Outra conta começa do zero no servidor, então tudo daqui é enviado. */
  async signIn(session: Session) {
    if (this.session?.userId !== session.userId) this.syncState.reset();
    this.#setSession(session);
    await this.syncNow();
  }

  /** Sai da conta. Os dados continuam neste aparelho. */
  async signOut() {
    const session = this.session;
    this.#setSession(null);
    this.syncState.reset();
    this.syncStatus = 'offline';
    this.syncMessage = '';
    if (session) await api.logout(session.token).catch(() => undefined);
  }

  /** Apaga a conta no servidor e os dados deste aparelho. */
  async deleteAccount() {
    const session = this.session;
    if (!session) return;
    await api.deleteAccount(session.token);
    this.#setSession(null);
    this.syncState.reset();
    this.store.clear();
    this.syncStatus = 'offline';
    this.syncMessage = 'Conta excluída.';
  }
}

export const app = new AppState();
