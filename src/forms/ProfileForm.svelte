<script lang="ts">
  // Perfil do jogador: onboarding (sem perfil) e edição.
  import Icon from '../components/Icon.svelte';
  import Pet from '../components/Pet.svelte';
  import CurrencyInput from '../components/CurrencyInput.svelte';
  import { app } from '../lib/app.svelte';
  import { DEFAULT_PET_NAME, profileLimits, saveProfile } from '../lib/actions';
  import { catalog } from '../lib/game';
  import { brl } from '../lib/money';
  import { petColors } from '../lib/pet';

  interface Props {
    onsaved?: () => void;
    oncancel?: () => void;
  }

  let { onsaved, oncancel }: Props = $props();

  const current = app.store.profile?.data;
  const isNew = !current;

  let monthlyCost = $state(current?.monthlyEssentialCostCents ?? 0);
  let targetMonths = $state(current?.targetMonths ?? profileLimits.targetMonths.default);
  let investPercent = $state(current?.investPercent ?? profileLimits.investPercent.default);
  let petName = $state(current?.petName ?? DEFAULT_PET_NAME);
  let petColor = $state(current?.petColor ?? 'green');

  const goal = $derived(monthlyCost * targetMonths);

  function save(event: SubmitEvent) {
    event.preventDefault();
    if (monthlyCost <= 0) return;
    saveProfile(app.store, { monthlyEssentialCostCents: monthlyCost, targetMonths, investPercent, petName, petColor });
    onsaved?.();
  }

  const step = (value: number, delta: number, min: number, max: number) => Math.min(Math.max(value + delta, min), max);
</script>

<form class="profile" onsubmit={save}>
  <section class="card">
    <h3>Seu bichinho</h3>
    <div class="center"><Pet stage="baby" mood="happy" color={petColor} size={120} /></div>
    <label class="field">
      <span class="label">Nome do bichinho</span>
      <input type="text" bind:value={petName} maxlength="40" />
    </label>
    <div class="colors" role="radiogroup" aria-label="Cor do bichinho">
      {#each catalog().petColors as option (option.id)}
        <button
          type="button"
          role="radio"
          aria-checked={option.id === petColor}
          aria-label={option.title}
          class="swatch"
          style="background: {petColors[option.id]}"
          onclick={() => (petColor = option.id)}
        >
          {#if option.id === petColor}<Icon name="check" />{/if}
        </button>
      {/each}
    </div>
    <p class="hint">Ele cresce e fica feliz conforme você cuida bem do seu dinheiro.</p>
  </section>

  <section class="card">
    <h3>Quanto você gasta por mês com o essencial?</h3>
    <CurrencyInput label="Custo de vida mensal" bind:value={monthlyCost} />
    <p class="hint">Some moradia, alimentação, transporte, saúde e contas fixas.</p>
  </section>

  <section class="card">
    <h3>Nível 1: Reserva de emergência</h3>
    <div class="stepper">
      <span>{targetMonths} meses de reserva</span>
      <div>
        <button type="button" class="secondary" aria-label="Menos meses"
          onclick={() => (targetMonths = step(targetMonths, -1, profileLimits.targetMonths.min, profileLimits.targetMonths.max))}>−</button>
        <button type="button" class="secondary" aria-label="Mais meses"
          onclick={() => (targetMonths = step(targetMonths, 1, profileLimits.targetMonths.min, profileLimits.targetMonths.max))}>+</button>
      </div>
    </div>
    <div class="row"><span>Meta do Nível 1</span><strong>{brl(goal)}</strong></div>
    <p class="hint">O recomendado é entre 6 e 12 meses do seu custo de vida.</p>
  </section>

  <section class="card">
    <h3>Nível 2: Investimentos</h3>
    <div class="stepper">
      <span>Investir {investPercent}% das entradas</span>
      <div>
        <button type="button" class="secondary" aria-label="Menos"
          onclick={() => (investPercent = step(investPercent, -profileLimits.investPercent.step, profileLimits.investPercent.min, profileLimits.investPercent.max))}>−</button>
        <button type="button" class="secondary" aria-label="Mais"
          onclick={() => (investPercent = step(investPercent, profileLimits.investPercent.step, profileLimits.investPercent.min, profileLimits.investPercent.max))}>+</button>
      </div>
    </div>
    <p class="hint">Liberado quando a reserva estiver completa.</p>
  </section>

  <div class="buttons">
    {#if oncancel}<button type="button" class="secondary" onclick={oncancel}>Cancelar</button>{/if}
    <button type="submit" disabled={monthlyCost <= 0}>{isNew ? 'Começar' : 'Salvar'}</button>
  </div>
</form>

<style>
  .profile {
    display: grid;
    gap: 14px;
  }
  h3 {
    margin: 0 0 10px;
    font-size: 1rem;
  }
  .center {
    display: flex;
    justify-content: center;
  }
  .colors {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }
  .swatch {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    padding: 0;
    color: white;
    font-weight: 800;
  }
  .stepper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .stepper div {
    display: flex;
    gap: 6px;
  }
  .stepper button {
    width: 40px;
    padding: 6px 0;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
</style>
