<script lang="ts">
  // Novo aporte no Nível 2.
  import Modal from '../components/Modal.svelte';
  import CurrencyInput from '../components/CurrencyInput.svelte';
  import { app } from '../lib/app.svelte';
  import { addInvestment } from '../lib/actions';
  import { catalog } from '../lib/game';
  import { civilDate, msFromCivil } from '../lib/dates';

  let { onclose }: { onclose: () => void } = $props();

  let modality = $state('tesouroSelic');
  let name = $state('');
  let amount = $state(0);
  let date = $state(civilDate(Date.now()));

  const info = $derived(catalog().modalities.find((item) => item.id === modality));
  const dateMs = $derived(msFromCivil(date));

  function save() {
    if (amount <= 0 || dateMs == null) return;
    addInvestment(app.store, { name, modality, modalityTitle: info?.title ?? '', amountCents: amount, date: dateMs });
    onclose();
  }
</script>

<Modal title="Novo aporte" {onclose}>
  <div class="form">
    <label class="field">
      <span class="label">Modalidade</span>
      <select bind:value={modality}>
        {#each catalog().modalities as item (item.id)}
          <option value={item.id}>{item.title}</option>
        {/each}
      </select>
    </label>
    <div class="row"><span>Perfil</span><strong>{info?.riskTitle}</strong></div>
    <label class="field">
      <span class="label">Onde? (ex: banco, corretora, ativo)</span>
      <input type="text" bind:value={name} maxlength="80" />
    </label>
    <CurrencyInput label="Valor" bind:value={amount} />
    <label class="field">
      <span class="label">Data</span>
      <input type="date" bind:value={date} />
    </label>
  </div>
  {#snippet actions()}
    <button type="button" class="secondary" onclick={onclose}>Cancelar</button>
    <button type="button" onclick={save} disabled={amount <= 0 || dateMs == null}>Salvar</button>
  {/snippet}
</Modal>
