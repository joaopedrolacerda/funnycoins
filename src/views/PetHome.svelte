<script lang="ts">
  // Casa do bichinho, estilo Tamagotchi: ele reage ao que você faz com o dinheiro.
  import Icon from '../components/Icon.svelte';
  import Pet from '../components/Pet.svelte';
  import Bar from '../components/Bar.svelte';
  import type { Snapshot } from '../lib/game';
  import { catalog } from '../lib/game';
  import { pct } from '../lib/money';
  import { moodTitle, petColors, stageTitle } from '../lib/pet';
  import { moodIcon } from '../lib/icons';

  interface Props {
    snapshot: Snapshot;
    petColor: string;
    onfeed: () => void;
    onprotect: () => void;
    oncustomize: () => void;
  }

  let { snapshot, petColor, onfeed, onprotect, oncustomize }: Props = $props();

  let tip = $state<string | null>(null);
  let jumps = $state(0);

  function poke() {
    jumps += 1;
    const tips = catalog().tips.filter((item) => item !== tip);
    tip = tips[Math.floor(Math.random() * tips.length)] ?? null;
  }

  const hungerDetail = $derived.by(() => {
    const days = snapshot.daysSinceLastEntry;
    if (days == null) return 'Ainda não comeu nada';
    if (days === 0) return 'Comeu hoje';
    if (days === 1) return 'Último registro foi ontem';
    return `Último registro há ${days} dias`;
  });

  const needs = $derived([
    { title: 'Fome', icon: 'utensils' as const, value: snapshot.petNeeds.hunger, color: 'var(--orange)', detail: hungerDetail },
    { title: 'Proteção', icon: 'shield' as const, value: snapshot.petNeeds.protection, color: 'var(--green)', detail: 'Cresce com a reserva de emergência' },
    { title: 'Alegria', icon: 'heart' as const, value: snapshot.petNeeds.joy, color: 'var(--pink)', detail: 'Contas em dia e guardar dinheiro no mês' },
  ]);
</script>

<div class="page">
  <div class="header">
    <span class="badge" style="background: color-mix(in srgb, {petColors[petColor]} 20%, transparent)"><Icon name="sparkles" /> {stageTitle[snapshot.petStage]}</span>
    <span class="mood"><Icon name={moodIcon[snapshot.petMood] ?? 'smile'} /> {moodTitle[snapshot.petMood]}</span>
    <button type="button" class="secondary small" onclick={oncustomize}><Icon name="palette" /> Personalizar</button>
  </div>

  {#key tip}
    <p class="bubble" aria-live="polite">{tip ?? snapshot.petMessage}</p>
  {/key}

  <button type="button" class="pet-button" onclick={poke} aria-label="Toque para ouvir uma dica">
    {#key jumps}
      <div class:jump={jumps > 0}>
        <Pet stage={snapshot.petStage} mood={snapshot.petMood} color={petColor} size={230} />
      </div>
    {/key}
  </button>

  <section class="card needs">
    {#each needs as need (need.title)}
      <div class="need">
        <div class="row">
          <strong style="color: {need.color}"><Icon name={need.icon} /> {need.title}</strong>
          <span class="number">{pct(need.value)}</span>
        </div>
        <Bar value={need.value} color={need.value < 0.3 ? 'var(--red)' : need.color} label={need.title} />
        <span class="hint">{need.detail}</span>
      </div>
    {/each}
    {#if snapshot.nextEvolutionHint}
      <strong class="evolution" style="color: {petColors[petColor]}"><Icon name="arrowUp" /> {snapshot.nextEvolutionHint}</strong>
    {/if}
  </section>

  <div class="actions">
    <button type="button" class="action" style="--tint: var(--orange)" onclick={onfeed}>
      <span class="emoji"><Icon name="utensils" /></span>
      <strong>{snapshot.petStage === 'egg' ? 'Chocar' : 'Alimentar'}</strong>
      <small>Registrar ganho</small>
    </button>
    {#if !snapshot.isLevel1Complete}
      <button type="button" class="action" style="--tint: var(--green)" onclick={onprotect}>
        <span class="emoji"><Icon name="shield" /></span>
        <strong>Proteger</strong>
        <small>Guardar na reserva</small>
      </button>
    {/if}
  </div>
</div>

<style>
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .badge {
    padding: 6px 12px;
    border-radius: 99px;
    font-weight: 700;
    font-size: 0.9rem;
  }
  .mood {
    flex: 1;
    font-weight: 700;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .bubble {
    position: relative;
    margin: 0;
    padding: 14px;
    border-radius: 18px;
    background: var(--surface-2);
    text-align: center;
    animation: fade 0.3s ease;
  }
  .bubble::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -9px;
    translate: -50% 0;
    border: 10px solid transparent;
    border-bottom: 0;
    border-top-color: var(--surface-2);
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  .pet-button {
    display: flex;
    justify-content: center;
    background: none;
    padding: 0;
    /* Orelhas e coroa passam do quadro do desenho: espaço para não encostar no balão. */
    margin: 28px auto 0;
  }
  .jump {
    animation: jump 0.58s;
  }
  @keyframes jump {
    30% {
      transform: translateY(-36px);
      animation-timing-function: cubic-bezier(0.3, 1.6, 0.5, 1);
    }
  }
  .needs {
    display: grid;
    gap: 14px;
  }
  .need {
    display: grid;
    gap: 4px;
  }
  .number {
    font-variant-numeric: tabular-nums;
  }
  .evolution {
    margin-top: 4px;
  }
  .actions {
    display: flex;
    gap: 12px;
  }
  .action {
    flex: 1;
    display: grid;
    gap: 4px;
    justify-items: center;
    padding: 14px;
    border-radius: 18px;
    color: white;
    background: linear-gradient(color-mix(in srgb, var(--tint) 80%, white), var(--tint));
  }
  .emoji {
    font-size: 1.5rem;
  }
  small {
    opacity: 0.85;
  }
  @media (prefers-reduced-motion: reduce) {
    .jump,
    .bubble {
      animation: none;
    }
  }
</style>
