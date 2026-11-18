<script lang="ts">
  // Indicador de página em bolinhas.
  interface Props {
    count: number;
    current: number;
    onselect?: (index: number) => void;
  }

  let { count, current, onselect }: Props = $props();
</script>

<div class="dots" role="group" aria-label="Página {current + 1} de {count}">
  {#each Array.from({ length: count }, (_, index) => index) as index (index)}
    <button
      type="button"
      class:current={index === current}
      disabled={!onselect}
      onclick={() => onselect?.(index)}
      aria-label="Ir para a página {index + 1}"
    ></button>
  {/each}
</div>

<style>
  .dots {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  button {
    width: 8px;
    height: 8px;
    padding: 0;
    border: none;
    border-radius: 99px;
    background: var(--muted-fill);
    transition: width 0.25s ease;
    cursor: pointer;
  }
  button:disabled {
    cursor: default;
  }
  .current {
    width: 24px;
    background: var(--accent);
  }
</style>
