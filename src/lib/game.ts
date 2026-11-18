// Ponte com as regras do jogo em Rust (rust/rules), compiladas para WebAssembly.
// O site não reimplementa regra nenhuma: tudo vem do mesmo código testado com rules-fixtures.json.

import init, {
  catalog as wasmCatalog,
  gainPlan as wasmGainPlan,
  initSync,
  snapshot as wasmSnapshot,
} from './rules/pkg/rules.js';
import { civilDate } from './dates';
import type { RecordStore } from './store.svelte';

export type PetStage = 'egg' | 'baby' | 'young' | 'adult' | 'legend';
export type PetMood = 'happy' | 'ok' | 'sad' | 'hungry' | 'sick';

export interface Achievement {
  id: string;
  title: string;
  detail: string;
  isUnlocked: boolean;
}

export interface Snapshot {
  reserveBalanceCents: number;
  reserveGoalCents: number;
  reserveProgress: number;
  reserveMissingCents: number;
  monthsCovered: number;
  isLevel1Complete: boolean;
  currentLevel: 1 | 2;
  monthIncomeCents: number;
  monthExpenseCents: number;
  freeBalanceCents: number;
  pendingBills: string[];
  overdueBills: string[];
  /** Situação de cada conta, na ordem de `store.active('bill')`. */
  billStatus: { isPaid: boolean; isOverdue: boolean }[];
  investedTotalCents: number;
  investedThisMonthCents: number;
  monthlyInvestTargetCents: number;
  monthlyInvestProgress: number;
  allocation: { modality: string; amountCents: number }[];
  achievements: Achievement[];
  xp: number;
  rank: string;
  nextRankXp: number | null;
  rankProgress: number;
  daysSinceLastEntry: number | null;
  petNeeds: { hunger: number; protection: number; joy: number };
  petMood: PetMood;
  petStage: PetStage;
  nextEvolutionHint: string | null;
  petMessage: string;
}

export interface GainPlan {
  splitCents: number;
  freeCents: number;
  destination: 'reserve' | 'investment';
  earnedXp: number;
  unlocksLevel2: boolean;
}

export interface Catalog {
  categories: { id: string; title: string; kind: 'income' | 'expense' }[];
  modalities: { id: string; title: string; risk: number; riskTitle: string }[];
  petColors: { id: string; title: string }[];
  tips: string[];
}

/** Carrega o WASM no navegador. Chame uma vez antes de montar as telas. */
export async function loadRules(): Promise<void> {
  await init();
}

/** Carrega o WASM a partir dos bytes. Usado nos testes, fora do navegador. */
export function loadRulesSync(bytes: BufferSource): void {
  initSync({ module: bytes });
}

/** Entrada das regras: mesmo formato dos casos de rules-fixtures.json. */
export interface GameInput {
  now: string;
  profile: { monthlyEssentialCostCents: number; targetMonths: number; investPercent: number };
  entries: { category: string; kind: string; amountCents: number; date: string }[];
  bills: { name: string; amountCents: number; dueDay: number; paidMonths: string[] }[];
  reserveMovements: { amountCents: number; date: string }[];
  investments: { modality: string; amountCents: number; date: string }[];
}

/** Monta a entrada das regras a partir dos registros ativos. Devolve null antes de existir perfil. */
export function gameInput(store: RecordStore, now: number): GameInput | null {
  const profile = store.profile?.data;
  if (!profile) return null;
  return {
    now: civilDate(now),
    profile: {
      monthlyEssentialCostCents: profile.monthlyEssentialCostCents,
      targetMonths: profile.targetMonths,
      investPercent: profile.investPercent,
    },
    entries: store.active('cashEntry').map(({ data }) => ({
      category: data.category,
      kind: data.kind,
      amountCents: data.amountCents,
      date: civilDate(data.date),
    })),
    bills: store.active('bill').map(({ data }) => ({
      name: data.name,
      amountCents: data.amountCents,
      dueDay: data.dueDay,
      paidMonths: data.paidMonths,
    })),
    reserveMovements: store.active('reserveMovement').map(({ data }) => ({
      amountCents: data.amountCents,
      date: civilDate(data.date),
    })),
    investments: store.active('investment').map(({ data }) => ({
      modality: data.modality,
      amountCents: data.amountCents,
      date: civilDate(data.date),
    })),
  };
}

export function computeSnapshot(input: GameInput): Snapshot {
  return JSON.parse(wasmSnapshot(JSON.stringify(input)));
}

export function computeGainPlan(input: GameInput, amountCents: number, percent: number): GainPlan {
  return JSON.parse(wasmGainPlan(JSON.stringify(input), BigInt(amountCents), BigInt(percent)));
}

let cachedCatalog: Catalog | undefined;

export function catalog(): Catalog {
  cachedCatalog ??= JSON.parse(wasmCatalog()) as Catalog;
  return cachedCatalog;
}
