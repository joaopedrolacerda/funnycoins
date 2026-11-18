<script lang="ts">
  // Entradas e saídas de dinheiro.
  import Icon from '../components/Icon.svelte';
  import { app } from '../lib/app.svelte';
  import type { Snapshot } from '../lib/game';
  import { catalog } from '../lib/game';
  import { brl } from '../lib/money';
  import { formatDate } from '../lib/dates';
  import { categoryIcon } from '../lib/icons';

  let { snapshot, ongain, onexpense }: { snapshot: Snapshot; ongain: () => void; onexpense: () => void } = $props();

  const entries = $derived(app.store.active('cashEntry').toSorted((a, b) => b.data.date - a.data.date));
  const categoryTitle = (id: string) => catalog().categories.find((item) => item.id === id)?.title ?? id;
</script>

<div class="page">
  <div class="toolbar">
    <button type="button" class="green-button" onclick={ongain}><Icon name="arrowDown" /> Novo ganho</button>
    <button type="button" class="secondary" onclick={onexpense}><Icon name="arrowUp" /> Novo gasto</button>
  </div>

  <section class="card">
    <h3>Este mês</h3>
    <div class="row"><span>Entradas</span><span class="income">{brl(snapshot.monthIncomeCents)}</span></div>
    <div class="row"><span>Saídas</span><span class="expense">{brl(snapshot.monthExpenseCents)}</span></div>
    <div class="row"><span>Resultado</span><strong>{brl(snapshot.monthIncomeCents - snapshot.monthExpenseCents)}</strong></div>
    <div class="row"><span>Saldo livre</span><span>{brl(snapshot.freeBalanceCents)}</span></div>
  </section>

  <section class="card">
    <h3>Lançamentos</h3>
    {#if entries.length === 0}
      <p class="hint">Nenhum lançamento ainda. Registre um ganho ou um gasto.</p>
    {/if}
    <ul class="list">
      {#each entries as entry (entry.id)}
        <li>
          <span class="icon"><Icon name={categoryIcon[entry.data.category] ?? 'circle'} /></span>
          <div class="grow">
            <div>{entry.data.title}</div>
            <small class="hint">{categoryTitle(entry.data.category)} • {formatDate(entry.data.date)}</small>
          </div>
          <span class="number" class:income={entry.data.kind === 'income'}>
            {brl(entry.data.kind === 'income' ? entry.data.amountCents : -entry.data.amountCents)}
          </span>
          <button type="button" class="icon-button" aria-label="Apagar {entry.data.title}" onclick={() => app.store.softDelete(entry.id)}><Icon name="trash" /></button>
        </li>
      {/each}
    </ul>
  </section>
</div>
