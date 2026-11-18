<script lang="ts">
  // Campo de dinheiro no formato brasileiro. Os dígitos enchem os centavos, como nas maquininhas.
  import { brl, centsFromTyping } from '../lib/money';

  interface Props {
    /** Valor em centavos. */
    value: number;
    label: string;
    large?: boolean;
    autofocus?: boolean;
  }

  let { value = $bindable(0), label, large = false, autofocus = false }: Props = $props();

  function onInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    value = centsFromTyping(input.value);
    // Reescreve já formatado e mantém o cursor no fim.
    input.value = brl(value);
    input.setSelectionRange(input.value.length, input.value.length);
  }
</script>

<label class="field" class:large>
  <span class="label">{label}</span>
  <!-- svelte-ignore a11y_autofocus -->
  <input type="text" inputmode="numeric" value={brl(value)} oninput={onInput} {autofocus} aria-label={label} />
</label>

<style>
  .large input {
    font-size: 2.6rem;
    font-weight: 800;
    text-align: center;
    border: none;
    background: transparent;
    font-variant-numeric: tabular-nums;
  }
  .large .label {
    text-align: center;
  }
</style>
