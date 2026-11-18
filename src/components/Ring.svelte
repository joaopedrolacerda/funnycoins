<script lang="ts">
  // Anel de progresso com a porcentagem no meio.
  import { pct } from '../lib/money';

  interface Props {
    progress: number;
    color: string;
    size?: number;
  }

  let { progress, color, size = 170 }: Props = $props();
  const radius = 42;
  const length = 2 * Math.PI * radius;
  const clamped = $derived(Math.min(Math.max(progress, 0), 1));
</script>

<svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Progresso {pct(clamped)}">
  <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--track)" stroke-width="10" />
  <circle
    cx="50"
    cy="50"
    r={radius}
    fill="none"
    stroke={color}
    stroke-width="10"
    stroke-linecap="round"
    stroke-dasharray={length}
    stroke-dashoffset={length * (1 - clamped)}
    transform="rotate(-90 50 50)"
    style="transition: stroke-dashoffset 0.6s ease"
  />
  <text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-size="18" font-weight="800" fill="currentColor">
    {pct(clamped)}
  </text>
</svg>
