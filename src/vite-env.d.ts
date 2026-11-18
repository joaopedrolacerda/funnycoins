/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço do backend. Vazio usa o mesmo endereço do site (proxy do Vite em desenvolvimento). */
  readonly VITE_API_URL?: string;
  /** Client ID OAuth do Google para o botão "Entrar com Google". */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Mostra o login só pelo nome fora do modo de desenvolvimento. */
  readonly VITE_DEV_LOGIN?: string;
}
