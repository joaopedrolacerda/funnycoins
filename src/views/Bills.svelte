<script lang="ts">
  // Contas fixas mensais com a situação do mês atual.
  import Icon from '../components/Icon.svelte';
  import Bar from '../components/Bar.svelte';
  import { app } from '../lib/app.svelte';
  import { payBill } from '../lib/actions';
  import type { Snapshot } from '../lib/game';
  import { brl } from '../lib/money';

  let { snapshot, onadd }: { snapshot: Snapshot; onadd: () => void } = $props();

  // A situação vem das regras, na mesma ordem de `store.active('bill')`.
  const bills = $derived(
    app.store
      .active('bill')
      .map((bill, index) => ({ bill, status: snapshot.billStatus[index] ?? { isPaid: false, isOverdue: false } }))
      .toSorted((a, b) => a.bill.data.dueDay - b.bill.data.dueDay),
  );
  const monthTotal = $derived(bills.reduce((sum, { bill }) => sum + bill.data.amountCents, 0));
  const paidTotal = $derived(
    bills.filter(({ status }) => status.isPaid).reduce((sum, { bill }) => sum + bill.data.amountCents, 0),
  );
</script>

<div class="page">
  <div class="toolbar">
    <button type="button" onclick={onadd}><Icon name="plus" /> Nova conta</button>
  </div>

  {#if bills.length > 0}
    <section class="card">
      <div class="row"><span>Total do mês</span><strong>{brl(monthTotal)}</strong></div>
      <div class="row"><span>Já pago</span><span>{brl(paidTotal)}</span></div>
      <Bar value={monthTotal > 0 ? paidTotal / monthTotal : 0} color="var(--green)" label="Contas pagas" />
    </section>
  {/if}

  <section class="card">
    <h3>Contas fixas</h3>
    {#if bills.length === 0}
      <p class="hint">Cadastre aluguel, luz, internet e outras contas. Pagar em dia rende XP.</p>
    {/if}
    <ul class="list">
      {#each bills as { bill, status } (bill.id)}
        <li>
          <div class="grow">
            <div>{bill.data.name}</div>
            <small class="hint">{brl(bill.data.amountCents)}</small>
          </div>
          {#if status.isPaid}
            <span class="income"><Icon name="checkCircle" /> Paga</span>
          {:else}
            <div class="due">
              <small class:expense={status.isOverdue} class:hint={!status.isOverdue}>
                {status.isOverdue ? 'Atrasada' : `Vence dia ${bill.data.dueDay}`}
              </small>
              <button type="button" class="small" onclick={() => payBill(app.store, bill.id)}>Pagar</button>
            </div>
          {/if}
          <button type="button" class="icon-button" aria-label="Apagar {bill.data.name}" onclick={() => app.store.softDelete(bill.id)}><Icon name="trash" /></button>
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .due {
    display: grid;
    justify-items: end;
    gap: 4px;
  }
</style>
