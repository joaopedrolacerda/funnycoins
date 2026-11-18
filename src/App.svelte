<script lang="ts">
  // Raiz do site: onboarding até existir um perfil, depois as abas.
  import { app } from './lib/app.svelte';
  import PetHome from './views/PetHome.svelte';
  import Journey from './views/Journey.svelte';
  import CashFlow from './views/CashFlow.svelte';
  import Bills from './views/Bills.svelte';
  import Investments from './views/Investments.svelte';
  import Account from './views/Account.svelte';
  import ProfileForm from './forms/ProfileForm.svelte';
  import GainWizard from './forms/GainWizard.svelte';
  import EntryForm from './forms/EntryForm.svelte';
  import BillForm from './forms/BillForm.svelte';
  import ReserveForm from './forms/ReserveForm.svelte';
  import InvestmentForm from './forms/InvestmentForm.svelte';
  import Modal from './components/Modal.svelte';
  import Icon from './components/Icon.svelte';
  import type { IconName } from './lib/icons';

  type Tab = 'pet' | 'journey' | 'flow' | 'bills' | 'investments' | 'account';
  type Sheet = 'gain' | 'expense' | 'bill' | 'deposit' | 'withdraw' | 'investment' | 'profile' | null;

  let tab = $state<Tab>('pet');
  let sheet = $state<Sheet>(null);

  const profile = $derived(app.store.profile?.data);
  const snapshot = $derived(app.snapshot);
  const close = () => (sheet = null);

  const tabs = $derived<{ id: Tab; icon: IconName; title: string; badge?: string | number }[]>([
    {
      id: 'pet',
      icon: 'paw',
      title: profile?.petName ?? 'Bichinho',
      // Avisa na aba quando o bichinho precisa de cuidado.
      badge: snapshot?.petMood === 'hungry' || snapshot?.petMood === 'sick' ? '!' : undefined,
    },
    { id: 'journey', icon: 'map', title: 'Jornada' },
    { id: 'flow', icon: 'arrowLeftRight', title: 'Fluxo' },
    { id: 'bills', icon: 'receipt', title: 'Contas', badge: snapshot?.pendingBills.length || undefined },
    { id: 'investments', icon: snapshot?.isLevel1Complete ? 'trendingUp' : 'lock', title: 'Investimentos' },
    { id: 'account', icon: app.syncStatus === 'error' ? 'alert' : 'cloud', title: 'Conta' },
  ]);
</script>

{#if !profile || !snapshot}
  <main class="onboarding">
    <h1>Comece sua jornada</h1>
    <p class="hint">Primeiro a reserva de emergência, depois os investimentos. Seu bichinho cresce junto.</p>
    <ProfileForm />
  </main>
{:else}
  <div class="shell">
    <nav aria-label="Abas">
      {#each tabs as item (item.id)}
        <button
          type="button"
          class="tab"
          class:active={tab === item.id}
          aria-current={tab === item.id ? 'page' : undefined}
          onclick={() => (tab = item.id)}
        >
          <span class="tab-icon"><Icon name={item.icon} /></span>
          <span class="tab-title">{item.title}</span>
          {#if item.badge}<span class="tab-badge">{item.badge}</span>{/if}
        </button>
      {/each}
    </nav>

    <main>
      <h1>{tabs.find((item) => item.id === tab)?.title}</h1>
      {#if tab === 'pet'}
        <PetHome
          {snapshot}
          petColor={profile.petColor}
          onfeed={() => (sheet = 'gain')}
          onprotect={() => (sheet = 'deposit')}
          oncustomize={() => (sheet = 'profile')}
        />
      {:else if tab === 'journey'}
        <Journey
          {snapshot}
          petColor={profile.petColor}
          targetMonths={profile.targetMonths}
          investPercent={profile.investPercent}
          ongain={() => (sheet = 'gain')}
          onreserve={(isDeposit) => (sheet = isDeposit ? 'deposit' : 'withdraw')}
        />
      {:else if tab === 'flow'}
        <CashFlow {snapshot} ongain={() => (sheet = 'gain')} onexpense={() => (sheet = 'expense')} />
      {:else if tab === 'bills'}
        <Bills {snapshot} onadd={() => (sheet = 'bill')} />
      {:else if tab === 'investments'}
        <Investments {snapshot} investPercent={profile.investPercent} onadd={() => (sheet = 'investment')} />
      {:else}
        <Account />
      {/if}
    </main>
  </div>

  {#if sheet === 'gain'}
    <GainWizard onclose={close} />
  {:else if sheet === 'expense'}
    <EntryForm onclose={close} />
  {:else if sheet === 'bill'}
    <BillForm onclose={close} />
  {:else if sheet === 'deposit' || sheet === 'withdraw'}
    <ReserveForm isDeposit={sheet === 'deposit'} onclose={close} />
  {:else if sheet === 'investment'}
    <InvestmentForm onclose={close} />
  {:else if sheet === 'profile'}
    <Modal title="Editar perfil" onclose={close}>
      <ProfileForm onsaved={close} oncancel={close} />
    </Modal>
  {/if}
{/if}

<style>
  .onboarding {
    max-width: 600px;
    margin: 0 auto;
    padding: 24px 16px 48px;
  }
  .shell {
    display: flex;
    flex-direction: column-reverse;
    min-height: 100dvh;
  }
  main {
    flex: 1;
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 16px 16px 24px;
    box-sizing: border-box;
  }
  h1 {
    font-size: 2rem;
    margin: 8px 0 16px;
  }
  nav {
    position: sticky;
    bottom: 0;
    display: flex;
    justify-content: space-around;
    padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
    background: color-mix(in srgb, var(--surface) 88%, transparent);
    backdrop-filter: blur(16px);
    border-top: 1px solid var(--border);
    z-index: 1;
  }
  .tab {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 2px;
    flex: 1;
    max-width: 120px;
    padding: 6px 2px;
    background: none;
    color: var(--muted);
    font-size: 0.7rem;
    font-weight: 600;
    border-radius: 12px;
  }
  .tab.active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
  .tab-icon {
    font-size: 1.3rem;
  }
  .tab-title {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tab-badge {
    position: absolute;
    top: 2px;
    right: calc(50% - 22px);
    min-width: 16px;
    padding: 1px 4px;
    border-radius: 99px;
    background: var(--red);
    color: white;
    font-size: 0.65rem;
    line-height: 14px;
  }
  /* Em telas largas, as abas vão para o topo, como no iPad e no Mac. */
  @media (min-width: 800px) {
    .shell {
      flex-direction: column;
    }
    nav {
      top: 0;
      bottom: auto;
      justify-content: center;
      gap: 8px;
      border-top: none;
      border-bottom: 1px solid var(--border);
    }
    .tab {
      grid-auto-flow: column;
      gap: 6px;
      font-size: 0.9rem;
      padding: 8px 14px;
      max-width: none;
      flex: 0 0 auto;
    }
    .tab-icon {
      font-size: 1rem;
    }
    .tab-badge {
      position: static;
    }
  }
</style>
