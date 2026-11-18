<script lang="ts">
  // Conta e sincronização com o backend.
  import Icon from '../components/Icon.svelte';
  import { app } from '../lib/app.svelte';
  import { api, ApiError } from '../lib/api';
  import { formatCodeInput, isCompleteCode } from '../lib/accountCode';

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const devLogin = import.meta.env.DEV || import.meta.env.VITE_DEV_LOGIN === 'true';

  let name = $state('');
  let code = $state('');
  /** Mostra o aviso para guardar o código logo depois de criar a conta. */
  let justCreated = $state(false);
  let copied = $state(false);
  let busy = $state(false);
  let error = $state('');
  let googleButton = $state<HTMLDivElement>();

  async function run(task: () => Promise<void>) {
    busy = true;
    error = '';
    try {
      await task();
    } catch (failure) {
      error = failure instanceof ApiError || failure instanceof Error ? failure.message : 'Algo deu errado';
    } finally {
      busy = false;
    }
  }

  function createAccount() {
    void run(async () => {
      const account = await api.createCodeAccount();
      justCreated = true;
      await app.signIn(account);
    });
  }

  function signInWithCode(event: SubmitEvent) {
    event.preventDefault();
    if (!isCompleteCode(code)) return;
    const typed = formatCodeInput(code);
    void run(async () => {
      const session = await api.loginCode(typed);
      await app.signIn({ ...session, code: typed });
      code = '';
    });
  }

  async function copyCode() {
    if (!app.session?.code) return;
    await navigator.clipboard.writeText(app.session.code).catch(() => undefined);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  function signInDev(event: SubmitEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    void run(async () => app.signIn(await api.loginDev(name.trim())));
  }

  function deleteAccount() {
    const ok = confirm('Excluir a conta apaga todos os seus dados no servidor e neste navegador. Não dá para desfazer. Continuar?');
    if (ok) void run(() => app.deleteAccount());
  }

  // Botão "Entrar com Google", carregado só quando há um client ID configurado.
  $effect(() => {
    if (!googleClientId || app.session || !googleButton) return;
    const target = googleButton;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const google = (window as unknown as { google?: any }).google;
      google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: { credential: string }) =>
          void run(async () => app.signIn(await api.loginGoogle(response.credential))),
      });
      google?.accounts.id.renderButton(target, { theme: 'outline', size: 'large', locale: 'pt-BR' });
    };
    document.head.append(script);
    return () => script.remove();
  });

  const statusText: Record<string, string> = {
    offline: 'Só neste navegador',
    syncing: 'Sincronizando...',
    ok: 'Sincronizado',
    error: 'Não sincronizou',
  };
</script>

<div class="page">
  <section class="card">
    <h3>Sincronização</h3>
    <div class="row">
      <span>Situação</span>
      <strong class:expense={app.syncStatus === 'error'}>{statusText[app.syncStatus]}</strong>
    </div>
    {#if app.syncMessage}<p class="hint">{app.syncMessage}</p>{/if}
    {#if app.session}
      <div class="buttons">
        <button type="button" onclick={() => void app.syncNow()} disabled={app.syncStatus === 'syncing'}><Icon name="refresh" /> Sincronizar agora</button>
        <button
          type="button"
          class="secondary"
          onclick={() => {
            justCreated = false;
            void run(() => app.signOut());
          }}>Sair</button>
      </div>
    {:else}
      <p class="hint">Entre para guardar seus dados na nuvem e usar o mesmo bichinho no celular, no Mac e aqui.</p>
    {/if}
  </section>

  {#if app.session?.code}
    <section class="card code-card" class:highlight={justCreated}>
      <h3><Icon name="key" /> Seu código de acesso</h3>
      <div class="code-row">
        <code class="code">{app.session.code}</code>
        <button type="button" class="secondary small" onclick={() => void copyCode()}>
          <Icon name={copied ? 'check' : 'copy'} /> {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <p class="hint">
        {#if justCreated}
          <strong>Guarde este código agora.</strong> Ele é a única forma de entrar na sua conta em outro aparelho, e não
          dá para recuperá-lo se você perder.
        {:else}
          Use este código para entrar em outro aparelho. Não compartilhe: quem tiver o código vê seus dados.
        {/if}
      </p>
    </section>
  {/if}

  {#if !app.session}
    <section class="card">
      <h3>Primeira vez aqui?</h3>
      <p class="hint">Crie uma conta e receba um código para usar o mesmo bichinho em todos os seus aparelhos.</p>
      <button type="button" onclick={createAccount} disabled={busy}><Icon name="sparkles" /> Criar minha conta</button>
    </section>

    <section class="card">
      <h3>Já tenho um código</h3>
      <form class="form" onsubmit={signInWithCode}>
        <label class="field">
          <span class="label">Código de acesso</span>
          <input
            class="code-input"
            type="text"
            value={code}
            oninput={(event) => (code = event.currentTarget.value = formatCodeInput(event.currentTarget.value))}
            placeholder="XXXX-XXXX-XXXX"
            maxlength="14"
            autocomplete="one-time-code"
            autocapitalize="characters"
            spellcheck="false"
          />
        </label>
        <button type="submit" disabled={busy || !isCompleteCode(code)}><Icon name="key" /> Entrar</button>
      </form>
    </section>

    {#if googleClientId || devLogin}
      <section class="card">
        <h3>Outras formas de entrar</h3>
        {#if googleClientId}
          <div bind:this={googleButton}></div>
        {/if}
        {#if devLogin}
          <form class="form" onsubmit={signInDev}>
            <label class="field">
              <span class="label">Nome (login de desenvolvimento)</span>
              <input type="text" bind:value={name} maxlength="100" autocomplete="username" />
            </label>
            <button type="submit" disabled={busy || !name.trim()}>Entrar</button>
          </form>
        {/if}
      </section>
    {/if}
  {:else}
    <section class="card danger">
      <h3>Excluir conta</h3>
      <p class="hint">Apaga para sempre seus dados no servidor e neste navegador.</p>
      <button type="button" class="danger-button" onclick={deleteAccount} disabled={busy}>Excluir minha conta</button>
    </section>
  {/if}

  {#if error}<p class="expense" role="alert">{error}</p>{/if}
</div>

<style>
  .code-card.highlight {
    outline: 2px solid var(--accent);
  }
  .code-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .code {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }
  .code-input {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 1.2rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .buttons {
    display: flex;
    gap: 10px;
    margin-top: 8px;
  }
</style>
