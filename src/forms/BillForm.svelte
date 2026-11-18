<script lang="ts">
  // Nova conta fixa mensal.
  import Modal from '../components/Modal.svelte';
  import CurrencyInput from '../components/CurrencyInput.svelte';
  import { app } from '../lib/app.svelte';
  import { addBill } from '../lib/actions';

  let { onclose }: { onclose: () => void } = $props();

  let name = $state('');
  let amount = $state(0);
  let dueDay = $state(10);

  const valid = $derived(name.trim() !== '' && amount > 0);

  function save() {
    if (!valid) return;
    addBill(app.store, { name, amountCents: amount, dueDay });
    onclose();
  }
</script>

<Modal title="Nova conta fixa" {onclose}>
  <div class="form">
    <label class="field">
      <span class="label">Nome (ex: Aluguel, Internet)</span>
      <input type="text" bind:value={name} maxlength="60" />
    </label>
    <CurrencyInput label="Valor mensal" bind:value={amount} />
    <label class="field">
      <span class="label">Vence todo dia {dueDay}</span>
      <input type="range" min="1" max="31" bind:value={dueDay} />
    </label>
  </div>
  {#snippet actions()}
    <button type="button" class="secondary" onclick={onclose}>Cancelar</button>
    <button type="button" onclick={save} disabled={!valid}>Salvar</button>
  {/snippet}
</Modal>
