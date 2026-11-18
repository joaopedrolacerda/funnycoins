<script lang="ts">
  // Novo lançamento (entrada ou saída).
  import Modal from '../components/Modal.svelte';
  import CurrencyInput from '../components/CurrencyInput.svelte';
  import { app } from '../lib/app.svelte';
  import { addEntry } from '../lib/actions';
  import { catalog } from '../lib/game';
  import { civilDate, msFromCivil } from '../lib/dates';

  let { onclose }: { onclose: () => void } = $props();

  let kind = $state<'income' | 'expense'>('expense');
  let title = $state('');
  let amount = $state(0);
  let category = $state('food');
  let date = $state(civilDate(Date.now()));

  const categories = $derived(catalog().categories.filter((item) => item.kind === kind));
  const dateMs = $derived(msFromCivil(date));

  function setKind(value: 'income' | 'expense') {
    kind = value;
    category = catalog().categories.find((item) => item.kind === value)?.id ?? 'otherExpense';
  }

  function save() {
    if (amount <= 0 || dateMs == null) return;
    const categoryTitle = categories.find((item) => item.id === category)?.title ?? '';
    addEntry(app.store, { title, categoryTitle, amountCents: amount, date: dateMs, category, kind });
    onclose();
  }
</script>

<Modal title="Novo lançamento" {onclose}>
  <div class="form">
    <div class="segmented" role="radiogroup" aria-label="Tipo">
      <button type="button" role="radio" aria-checked={kind === 'income'} class:selected={kind === 'income'} onclick={() => setKind('income')}>Entrada</button>
      <button type="button" role="radio" aria-checked={kind === 'expense'} class:selected={kind === 'expense'} onclick={() => setKind('expense')}>Saída</button>
    </div>
    <label class="field">
      <span class="label">Descrição</span>
      <input type="text" bind:value={title} maxlength="80" />
    </label>
    <CurrencyInput label="Valor" bind:value={amount} />
    <label class="field">
      <span class="label">Categoria</span>
      <select bind:value={category}>
        {#each categories as item (item.id)}
          <option value={item.id}>{item.title}</option>
        {/each}
      </select>
    </label>
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
