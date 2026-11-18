<script lang="ts">
  // Barra de progresso simples.
  interface Props {
    value: number;
    color: string;
    label?: string;
  }

  let { value, color, label }: Props = $props();
  const clamped = $derived(Math.min(Math.max(value, 0), 1));
</script>

<div
  class="bar"
  role="progressbar"
  aria-label={label}
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow={Math.round(clamped * 100)}
>
  <div class="fill" style="width: {clamped * 100}%; background: {color}"></div>
</div>

<style>
  .bar {
    height: 8px;
    border-radius: 99px;
    background: var(--track);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.5s ease;
  }
</style>
