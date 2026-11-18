<script lang="ts">
  // Folha que abre por cima da tela, como os sheets do app.
  import Icon from './Icon.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    onclose: () => void;
    children: Snippet;
    actions?: Snippet;
  }

  let { title, onclose, children, actions }: Props = $props();
  let dialog: HTMLDialogElement;

  $effect(() => {
    dialog.showModal();
    return () => dialog.close();
  });
</script>

<dialog
  bind:this={dialog}
  oncancel={(event) => {
    event.preventDefault();
    onclose();
  }}
  onclick={(event) => {
    if (event.target === dialog) onclose();
  }}
>
  <div class="sheet">
    <header>
      <h2>{title}</h2>
      <button class="icon" type="button" onclick={onclose} aria-label="Fechar"><Icon name="close" /></button>
    </header>
    <div class="content">{@render children()}</div>
    {#if actions}
      <footer>{@render actions()}</footer>
    {/if}
  </div>
</dialog>

<style>
  dialog {
    border: none;
    padding: 0;
    border-radius: 24px;
    width: min(560px, calc(100vw - 24px));
    max-height: calc(100dvh - 24px);
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 20px 60px rgb(0 0 0 / 0.25);
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.35);
  }
  .sheet {
    display: flex;
    flex-direction: column;
    max-height: calc(100dvh - 24px);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 8px;
  }
  h2 {
    margin: 0;
    font-size: 1.2rem;
  }
  .content {
    padding: 8px 20px 16px;
    overflow: auto;
  }
  footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 12px 20px 20px;
  }
</style>
