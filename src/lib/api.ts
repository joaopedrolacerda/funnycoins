// Cliente HTTP da API (shared/API.md).

import type { SyncRequest, SyncResponse } from './sync';

/** Em desenvolvimento fica vazio e o Vite repassa para o backend. */
const base = import.meta.env.VITE_API_URL ?? '';

export interface Session {
  token: string;
  userId: string;
  /** Código da conta, guardado neste navegador para a pessoa poder ver de novo. */
  code?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Sem conexão com o servidor', 0);
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new ApiError(detail?.error ?? `Erro ${response.status}`, response.status);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export const api = {
  /** Cria uma conta nova. O código vem só nesta resposta: o servidor guarda apenas o hash. */
  createCodeAccount: () => request<Session & { code: string }>('POST', '/v1/auth/code/new'),
  loginCode: (code: string) => request<Session>('POST', '/v1/auth/code', { code }),
  loginDev: (name: string) => request<Session>('POST', '/v1/auth/dev', { name }),
  loginGoogle: (identityToken: string) => request<Session>('POST', '/v1/auth/google', { identityToken }),
  logout: (token: string) => request<void>('POST', '/v1/auth/logout', undefined, token),
  deleteAccount: (token: string) => request<void>('DELETE', '/v1/account', undefined, token),
  sync: (token: string, body: SyncRequest) => request<SyncResponse>('POST', '/v1/sync', body, token),
};
