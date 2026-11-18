<script lang="ts">
  // Ícone de linha do site. Herda a cor e o tamanho do texto ao redor.
  import { iconPaths, type IconName } from '../lib/icons';

  interface Props {
    name: IconName;
    /** Tamanho em CSS. O padrão acompanha a fonte. */
    size?: string;
    /** Nome lido pelo leitor de tela. Sem ele, o ícone é só decoração. */
    label?: string;
  }

  let { name, size = '1.15em', label }: Props = $props();
</script>

<svg
  class="icon-svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <!-- Os desenhos são constantes de lib/icons.ts, nunca texto vindo de fora. -->
  {@html iconPaths[name]}
</svg>

<style>
  .icon-svg {
    display: inline-block;
    flex-shrink: 0;
    vertical-align: -0.18em;
  }
</style>
