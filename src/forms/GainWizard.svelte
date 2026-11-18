<script lang="ts">
  // Passo a passo para registrar um ganho: origem → valor → quanto separar → comemoração.
  import Icon from '../components/Icon.svelte';
  import Modal from '../components/Modal.svelte';
  import StepDots from '../components/StepDots.svelte';
  import CurrencyInput from '../components/CurrencyInput.svelte';
  import { app } from '../lib/app.svelte';
  import { saveGain } from '../lib/actions';
  import { catalog, computeGainPlan, type GainPlan } from '../lib/game';
  import { brl } from '../lib/money';
  import { categoryIcon } from '../lib/icons';

  let { onclose }: { onclose: () => void } = $props();

  type Step = 'source' | 'amount' | 'split' | 'done';
  const steps: Step[] = ['source', 'amount', 'split', 'done'];

  const snapshot = app.snapshot;
  const profile = app.store.profile?.data;
  /** No Nível 1 a parte separada vai para a reserva; no Nível 2, para investimentos. */
  const isInvesting = snapshot?.isLevel1Complete ?? false;
  const investPercent = profile?.investPercent ?? 10;

  let step = $state<Step>('source');
  let category = $state('salary');
  let amount = $state(0);
  let note = $state('');
  let percent = $state(isInvesting ? investPercent : 20);
  let modality = $state('tesouroSelic');
  /** Resultado congelado ao salvar, porque o jogo muda logo depois. */
  let saved = $state<GainPlan | null>(null);

  const incomeCategories = catalog().categories.filter((item) => item.kind === 'income');
  const categoryTitle = $derived(incomeCategories.find((item) => item.id === category)?.title ?? '');
  const modalityTitle = $derived(catalog().modalities.find((item) => item.id === modality)?.title ?? '');
  const percentOptions = isInvesting
    ? [...new Set([0, 10, 20, 30, 50, investPercent])].sort((a, b) => a - b)
    : [0, 10, 20, 30, 50];
  const plan = $derived(app.input && amount > 0 ? computeGainPlan(app.input, amount, percent) : null);

  function save() {
    saved = saveGain(app.store, { category, categoryTitle, amountCents: amount, note, percent, modality, modalityTitle });
    if (saved) step = 'done';
  }
</script>

<Modal title="Novo ganho" {onclose}>
  <div class="wizard">
    <StepDots count={steps.length} current={steps.indexOf(step)} />

    {#key step}
      <div class="step">
        {#if step === 'source'}
          <div class="title">
            <div class="big"><Icon name="wallet" /></div>
            <h3>De onde veio esse dinheiro?</h3>
            <p class="hint">Registre cada ganho separado para enxergar todas as suas fontes de renda.</p>
          </div>
          <div class="grid">
            {#each incomeCategories as item (item.id)}
              <button
                type="button"
                class="tile"
                onclick={() => {
                  category = item.id;
                  step = 'amount';
                }}
              >
                <span class="emoji"><Icon name={categoryIcon[item.id] ?? 'circle'} /></span>
                {item.title}
              </button>
            {/each}
          </div>
        {:else if step === 'amount'}
          <div class="title">
            <div class="big"><Icon name={categoryIcon[category] ?? 'wallet'} /></div>
            <h3>Quanto você recebeu?</h3>
            <p class="hint">{categoryTitle}</p>
          </div>
          <CurrencyInput label="Valor" bind:value={amount} large autofocus />
          <label class="field">
            <span class="label">Descrição (opcional)</span>
            <input type="text" bind:value={note} placeholder="ex: Salário outubro" maxlength="80" />
          </label>
        {:else if step === 'split'}
          <div class="title">
            {#if isInvesting}
              <div class="big"><Icon name="trendingUp" /></div>
              <h3>Hora de investir uma parte!</h3>
              <p class="hint">Sua meta é investir {investPercent}% de cada ganho.</p>
            {:else}
              <div class="big"><Icon name="shield" /></div>
              <h3>Quer guardar uma parte na reserva?</h3>
              <p class="hint">Faltam {brl(snapshot?.reserveMissingCents ?? 0)} para completar o Nível 1.</p>
            {/if}
          </div>
          <div class="chips">
            {#each percentOptions as option (option)}
              <button type="button" class="chip" class:selected={percent === option} onclick={() => (percent = option)}>
                {option === 0 ? 'Agora não' : `${option}%`}
              </button>
            {/each}
          </div>
          {#if plan && plan.splitCents > 0}
            <div class="result">
              <span class="hint">{isInvesting ? 'Vai para investimentos' : 'Vai para a reserva'}</span>
              <strong class="value">{brl(plan.splitCents)}</strong>
              <span class="hint">Fica livre: {brl(plan.freeCents)}</span>
            </div>
            {#if isInvesting}
              <label class="field">
                <span class="label">Onde investir</span>
                <select bind:value={modality}>
                  {#each catalog().modalities as item (item.id)}
                    <option value={item.id}>{item.title}</option>
                  {/each}
                </select>
              </label>
            {/if}
          {/if}
        {:else if saved}
          <div class="title done">
            <div class="big bounce"><Icon name={saved.unlocksLevel2 ? 'unlock' : 'party'} /></div>
            <h3>{saved.unlocksLevel2 ? 'Nível 2 desbloqueado!' : 'Ganho registrado!'}</h3>
            <p class="xp">+{saved.earnedXp} XP</p>
          </div>
          <div class="card">
            <div class="row"><span>{categoryTitle}</span><strong>{brl(amount)}</strong></div>
            {#if saved.splitCents > 0}
              <div class="row">
                <span>{saved.destination === 'investment' ? `Investido em ${modalityTitle}` : 'Guardado na reserva'}</span>
                <strong>{brl(saved.splitCents)}</strong>
              </div>
            {/if}
          </div>
          {#if saved.unlocksLevel2}
            <p class="hint center">Sua reserva está completa. Agora você pode investir onde quiser!</p>
          {/if}
        {/if}
      </div>
    {/key}
  </div>

  {#snippet actions()}
    {#if step === 'amount' || step === 'split'}
      <button type="button" class="secondary" onclick={() => (step = step === 'split' ? 'amount' : 'source')}>Voltar</button>
      <span class="spacer"></span>
    {/if}
    {#if step === 'amount'}
      <button type="button" onclick={() => (step = 'split')} disabled={amount <= 0}>Próximo</button>
    {:else if step === 'split'}
      <button type="button" onclick={save}>Salvar ganho</button>
    {:else if step === 'done'}
      <button type="button" class="wide" onclick={onclose}>Concluir</button>
    {/if}
  {/snippet}
</Modal>

<style>
  .wizard {
    display: grid;
    gap: 20px;
    min-height: 360px;
    align-content: start;
  }
  .step {
    display: grid;
    gap: 18px;
    animation: slide-in 0.25s ease;
  }
  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(24px);
    }
  }
  .title {
    text-align: center;
  }
  .title h3 {
    margin: 6px 0;
    font-size: 1.35rem;
  }
  .big {
    font-size: 3rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 12px;
  }
  .tile {
    display: grid;
    gap: 6px;
    min-height: 90px;
    place-content: center;
    background: color-mix(in srgb, var(--green) 12%, transparent);
    color: var(--green-text);
  }
  .emoji {
    font-size: 1.8rem;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .result {
    display: grid;
    gap: 4px;
    text-align: center;
  }
  .value {
    font-size: 1.8rem;
  }
  .xp {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--orange);
    margin: 0;
  }
  .bounce {
    animation: bounce 0.8s ease;
  }
  @keyframes bounce {
    30% {
      transform: translateY(-18px) scale(1.1);
    }
    60% {
      transform: translateY(0) scale(0.95);
    }
  }
  .center {
    text-align: center;
  }
  .spacer {
    flex: 1;
  }
  .wide {
    flex: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .step,
    .bounce {
      animation: none;
    }
  }
</style>
