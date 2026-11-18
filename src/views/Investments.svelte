<script lang="ts">
  // Nível 2: carteira e aportes. Bloqueado até a reserva estar completa.
  import Icon from '../components/Icon.svelte';
  import Bar from '../components/Bar.svelte';
  import { app } from '../lib/app.svelte';
  import type { Snapshot } from '../lib/game';
  import { catalog } from '../lib/game';
  import { brl, pct } from '../lib/money';
  import { formatDate } from '../lib/dates';
  import { modalityIcon } from '../lib/icons';

  interface Props {
    snapshot: Snapshot;
    investPercent: number;
    onadd: () => void;
  }

  let { snapshot, investPercent, onadd }: Props = $props();

  const investments = $derived(app.store.active('investment').toSorted((a, b) => b.data.date - a.data.date));
  const modality = (id: string) => catalog().modalities.find((item) => item.id === id) ?? catalog().modalities.at(-1);
</script>

<div class="page">
  {#if !snapshot.isLevel1Complete}
    <section class="card locked">
      <div class="lock"><Icon name="lock" /></div>
      <h3>Nível 2 bloqueado</h3>
      <p class="hint">Complete sua reserva de emergência primeiro. Faltam {brl(snapshot.reserveMissingCents)}.</p>
      <div class="progress"><Bar value={snapshot.reserveProgress} color="var(--green)" label="Reserva" /></div>
    </section>
  {:else}
    <div class="toolbar">
      <button type="button" onclick={onadd}><Icon name="plus" /> Novo aporte</button>
    </div>

    <section class="card">
      <h3>Meta do mês</h3>
      <div class="row"><span>Investir {investPercent}% das entradas</span><strong>{brl(snapshot.monthlyInvestTargetCents)}</strong></div>
      <div class="row"><span>Aportado no mês</span><span>{brl(snapshot.investedThisMonthCents)}</span></div>
      <Bar value={snapshot.monthlyInvestProgress} color="var(--blue)" label="Meta do mês" />
    </section>

    {#if snapshot.allocation.length > 0}
      <section class="card">
        <h3>Carteira • {brl(snapshot.investedTotalCents)}</h3>
        <div class="allocation">
          {#each snapshot.allocation as item (item.modality)}
            {@const share = snapshot.investedTotalCents > 0 ? item.amountCents / snapshot.investedTotalCents : 0}
            {@const info = modality(item.modality)}
            <div class="slice">
              <div class="row">
                <span><Icon name={modalityIcon[item.modality] ?? 'star'} /> {info?.title}</span>
                <span class="number">{brl(item.amountCents)}</span>
              </div>
              <Bar value={share} color="var(--accent)" label={info?.title} />
              <small class="hint">{pct(share)} • {info?.riskTitle}</small>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <section class="card">
      <h3>Aportes</h3>
      {#if investments.length === 0}
        <p class="hint">Escolha uma modalidade e registre seu primeiro aporte.</p>
      {/if}
      <ul class="list">
        {#each investments as investment (investment.id)}
          <li>
            <span class="icon"><Icon name={modalityIcon[investment.data.modality] ?? 'star'} /></span>
            <div class="grow">
              <div>{investment.data.name}</div>
              <small class="hint">{modality(investment.data.modality)?.title} • {formatDate(investment.data.date)}</small>
            </div>
            <span class="number">{brl(investment.data.amountCents)}</span>
            <button type="button" class="icon-button" aria-label="Apagar {investment.data.name}" onclick={() => app.store.softDelete(investment.id)}><Icon name="trash" /></button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  .locked {
    text-align: center;
    display: grid;
    justify-items: center;
    padding: 40px 20px;
  }
  .lock {
    font-size: 3.5rem;
  }
  .progress {
    width: min(220px, 100%);
  }
  .allocation {
    display: grid;
    gap: 14px;
  }
  .slice {
    display: grid;
    gap: 4px;
  }
</style>
