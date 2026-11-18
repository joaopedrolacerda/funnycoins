<script lang="ts">
  // Jornada em slides: Nível 1 → Nível 2 → Conquistas.
  import Icon from '../components/Icon.svelte';
  import { onMount } from 'svelte';
  import Pet from '../components/Pet.svelte';
  import Bar from '../components/Bar.svelte';
  import Ring from '../components/Ring.svelte';
  import StepDots from '../components/StepDots.svelte';
  import type { Snapshot } from '../lib/game';
  import { catalog } from '../lib/game';
  import { brl, oneDecimal } from '../lib/money';
  import { achievementIcon, modalityIcon } from '../lib/icons';

  interface Props {
    snapshot: Snapshot;
    petColor: string;
    targetMonths: number;
    investPercent: number;
    ongain: () => void;
    onreserve: (isDeposit: boolean) => void;
  }

  let { snapshot, petColor, targetMonths, investPercent, ongain, onreserve }: Props = $props();

  let slides: HTMLDivElement;
  let page = $state(0);

  // Abre no slide do nível em que a pessoa está.
  onMount(() => {
    page = snapshot.currentLevel - 1;
    slides.scrollTo({ left: slides.clientWidth * page, behavior: 'instant' });
  });

  function go(index: number) {
    slides.scrollTo({ left: slides.clientWidth * index, behavior: 'smooth' });
  }

  function onScroll() {
    page = Math.round(slides.scrollLeft / Math.max(slides.clientWidth, 1));
  }

  const modalityTitle = (id: string) => catalog().modalities.find((item) => item.id === id)?.title ?? id;
  const unlocked = $derived(snapshot.achievements.filter((a) => a.isUnlocked).length);
</script>

<div class="page">
  <div class="rank">
    <Pet stage={snapshot.petStage} mood={snapshot.petMood} color={petColor} size={48} animated={false} />
    <div class="grow">
      <div class="row">
        <strong>{snapshot.rank}</strong>
        <span class="hint number">{snapshot.xp} XP</span>
      </div>
      <Bar value={snapshot.rankProgress} color="var(--yellow)" label="Progresso da patente" />
    </div>
  </div>

  <div class="slides" bind:this={slides} onscroll={onScroll}>
    <section class="slide">
      <header>
        <span class="level" class:done={snapshot.isLevel1Complete}>NÍVEL 1 {#if snapshot.isLevel1Complete}<Icon name="check" />{/if}</span>
        <h2>Reserva de emergência</h2>
        <p class="hint">Sua base de proteção: {targetMonths} meses do seu custo de vida guardados.</p>
      </header>
      <Ring progress={snapshot.reserveProgress} color="var(--green)" />
      <div class="center">
        <strong class="value">{brl(snapshot.reserveBalanceCents)}</strong>
        <div class="hint">de {brl(snapshot.reserveGoalCents)}</div>
        <small class="hint">Cobre {oneDecimal(snapshot.monthsCovered)} meses</small>
      </div>
      {#if snapshot.isLevel1Complete}
        <strong class="green">Reserva completa! Deslize para o Nível 2 →</strong>
      {:else}
        <p class="center">Faltam {brl(snapshot.reserveMissingCents)} para desbloquear o Nível 2</p>
      {/if}
      <div class="buttons">
        <button type="button" class="green-button" onclick={() => onreserve(true)}><Icon name="arrowDown" /> Depositar</button>
        <button type="button" class="secondary" onclick={() => onreserve(false)} disabled={snapshot.reserveBalanceCents <= 0}>
          <Icon name="arrowUp" /> Retirar
        </button>
      </div>
    </section>

    <section class="slide">
      <header>
        <span class="level">NÍVEL 2</span>
        <h2>Investimentos</h2>
        <p class="hint">
          {snapshot.isLevel1Complete
            ? `Separe ${investPercent}% de cada ganho e invista onde quiser.`
            : 'Bloqueado até você completar a reserva de emergência.'}
        </p>
      </header>
      {#if snapshot.isLevel1Complete}
        <Ring progress={snapshot.monthlyInvestProgress} color="var(--blue)" />
        <div class="center">
          <strong class="value">{brl(snapshot.investedThisMonthCents)}</strong>
          <div class="hint">de {brl(snapshot.monthlyInvestTargetCents)} neste mês</div>
          <small class="hint">Total investido: {brl(snapshot.investedTotalCents)}</small>
        </div>
        {#if snapshot.allocation.length === 0}
          <p class="center">Adicione um ganho e escolha onde investir uma parte.</p>
        {:else}
          <div class="list">
            {#each snapshot.allocation.slice(0, 3) as item (item.modality)}
              <div class="row">
                <span><Icon name={modalityIcon[item.modality] ?? 'star'} /> {modalityTitle(item.modality)}</span>
                <span class="number">{brl(item.amountCents)}</span>
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <div class="lock"><Icon name="lock" /></div>
        <strong class="center">Você está a {brl(snapshot.reserveMissingCents)} de desbloquear</strong>
        <small class="hint">O que te espera aqui:</small>
        <div class="preview">
          {#each catalog().modalities as item (item.id)}
            <span title={item.title}><Icon name={modalityIcon[item.id] ?? 'star'} label={item.title} /></span>
          {/each}
        </div>
      {/if}
    </section>

    <section class="slide">
      <header>
        <span class="level" class:done={unlocked === snapshot.achievements.length}>TROFÉUS</span>
        <h2>Conquistas</h2>
        <p class="hint">{unlocked} de {snapshot.achievements.length} desbloqueadas</p>
      </header>
      <div class="trophies">
        {#each snapshot.achievements as achievement (achievement.id)}
          <div class="trophy" class:locked={!achievement.isUnlocked} aria-label="{achievement.title}: {achievement.isUnlocked ? 'Desbloqueada' : 'Bloqueada'}">
            <span class="emoji"><Icon name={achievementIcon[achievement.id] ?? 'trophy'} /></span>
            <strong>{achievement.title}</strong>
            <small class="hint">{achievement.detail}</small>
          </div>
        {/each}
      </div>
    </section>
  </div>

  <StepDots count={3} current={page} onselect={go} />

  <button type="button" class="green-button wide" onclick={ongain}><Icon name="plus" /> Adicionar ganho</button>
</div>

<style>
  .rank {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .grow {
    flex: 1;
    display: grid;
    gap: 6px;
  }
  .slides {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  .slides::-webkit-scrollbar {
    display: none;
  }
  .slide {
    flex: 0 0 100%;
    box-sizing: border-box;
    scroll-snap-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    padding: 20px;
    border-radius: 28px;
    background: var(--surface-2);
    border: 6px solid var(--bg);
  }
  header {
    text-align: center;
  }
  h2 {
    margin: 8px 0 4px;
    font-size: 1.6rem;
  }
  .level {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 800;
    background: color-mix(in srgb, var(--accent) 15%, transparent);
  }
  .level.done {
    background: color-mix(in srgb, var(--green) 20%, transparent);
  }
  .center {
    text-align: center;
  }
  .value {
    font-size: 1.5rem;
  }
  .green {
    color: var(--green-text);
  }
  .buttons {
    display: flex;
    gap: 10px;
  }
  .list {
    width: 100%;
    display: grid;
    gap: 8px;
  }
  .lock {
    font-size: 5rem;
    height: 170px;
    display: grid;
    place-items: center;
    opacity: 0.6;
  }
  .preview {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    font-size: 1.4rem;
    opacity: 0.6;
  }
  .trophies {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px;
  }
  .trophy {
    display: grid;
    gap: 4px;
    justify-items: center;
    text-align: center;
    padding: 12px 8px;
    min-height: 110px;
    border-radius: 14px;
    background: var(--surface-3);
  }
  .trophy.locked {
    opacity: 0.5;
    filter: grayscale(1);
  }
  .emoji {
    font-size: 1.8rem;
  }
  .wide {
    width: 100%;
  }
  .number {
    font-variant-numeric: tabular-nums;
  }
</style>
