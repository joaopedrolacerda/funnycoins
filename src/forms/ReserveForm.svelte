<script lang="ts">
  // Depósito ou retirada da reserva de emergência.
  import Modal from '../components/Modal.svelte';
  import CurrencyInput from '../components/CurrencyInput.svelte';
  import { app } from '../lib/app.svelte';
  import { moveReserve } from '../lib/actions';
  import { brl } from '../lib/money';

  let { isDeposit, onclose }: { isDeposit: boolean; onclose: () => void } = $props();

  let amount = $state(0);
  let note = $state('');

  const balance = $derived(app.snapshot?.reserveBalanceCents ?? 0);
  const valid = $derived(amount > 0 && (isDeposit || amount <= balance));

  function save() {
    if (moveReserve(app.store, { isDeposit, amountCents: amount, note, balanceCents: balance })) onclose();
  }
</script>

<Modal title={isDeposit ? 'Depositar na reserva' : 'Retirar da reserva'} {onclose}>
  <div class="form">
    <CurrencyInput label="Valor" bind:value={amount} autofocus />
    <label class="field">
      <span class="label">{isDeposit ? 'Observação (opcional)' : 'Qual foi a emergência?'}</span>
      <input type="text" bind:value={note} maxlength="80" />
    </label>
    <p class="hint">
      {#if isDeposit}
        Cada depósito rende XP e aproxima você do Nível 2.
      {:else}
        Use a reserva só em emergências reais. Saldo atual: {brl(balance)}
      {/if}
    </p>
  </div>
  {#snippet actions()}
    <button type="button" class="secondary" onclick={onclose}>Cancelar</button>
    <button type="button" onclick={save} disabled={!valid}>Confirmar</button>
  {/snippet}
</Modal>
