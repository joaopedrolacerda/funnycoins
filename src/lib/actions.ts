// Ações do jogador. Ficam fora das telas para poderem ser testadas, como os modelos do app.

import { computeGainPlan, gameInput, type GainPlan } from './game';
import { monthKey } from './dates';
import type { ProfileData } from './records';
import type { RecordStore } from './store.svelte';

export const DEFAULT_PET_NAME = 'Moedinha';

export interface ProfileForm {
  monthlyEssentialCostCents: number;
  targetMonths: number;
  investPercent: number;
  petName: string;
  petColor: string;
}

export const profileLimits = {
  targetMonths: { min: 3, max: 24, default: 6 },
  investPercent: { min: 5, max: 80, step: 5, default: 10 },
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(Math.round(value), min), max);

/** Cria o perfil ou atualiza o atual. Nome vazio vira "Moedinha". */
export function saveProfile(store: RecordStore, form: ProfileForm, now = Date.now()): void {
  const values = {
    monthlyEssentialCostCents: Math.max(0, Math.round(form.monthlyEssentialCostCents)),
    targetMonths: clamp(form.targetMonths, profileLimits.targetMonths.min, profileLimits.targetMonths.max),
    investPercent: clamp(form.investPercent, profileLimits.investPercent.min, profileLimits.investPercent.max),
    petName: form.petName.trim() || DEFAULT_PET_NAME,
    petColor: form.petColor,
  };
  const current = store.profile;
  if (current) {
    store.update<'profile'>(current.id, (data): ProfileData => ({ ...data, ...values }));
  } else {
    store.insert('profile', { ...values, createdAt: now });
  }
}

export function addEntry(
  store: RecordStore,
  entry: { title: string; categoryTitle: string; amountCents: number; date: number; category: string; kind: 'income' | 'expense' },
): void {
  if (entry.amountCents <= 0) return;
  store.insert('cashEntry', {
    title: entry.title.trim() || entry.categoryTitle,
    amountCents: entry.amountCents,
    date: entry.date,
    kind: entry.kind,
    category: entry.category,
  });
}

export function addBill(store: RecordStore, bill: { name: string; amountCents: number; dueDay: number }, now = Date.now()): void {
  const name = bill.name.trim();
  if (!name || bill.amountCents <= 0) return;
  store.insert('bill', { name, amountCents: bill.amountCents, dueDay: clamp(bill.dueDay, 1, 31), paidMonths: [], createdAt: now });
}

/** Marca a conta como paga no mês e registra a saída no fluxo. */
export function payBill(store: RecordStore, billId: string, now = Date.now()): void {
  const bill = store.get(billId);
  if (bill?.kind !== 'bill') return;
  const key = monthKey(now);
  const data = bill.data as { name: string; amountCents: number; paidMonths: string[] };
  if (data.paidMonths.includes(key)) return;
  store.update<'bill'>(billId, (current) => ({ ...current, paidMonths: [...current.paidMonths, key] }));
  store.insert('cashEntry', { title: data.name, amountCents: data.amountCents, date: now, kind: 'expense', category: 'bills' });
}

/** Depósito (positivo) ou retirada (negativo). Retirada não passa do saldo. */
export function moveReserve(
  store: RecordStore,
  move: { isDeposit: boolean; amountCents: number; note: string; balanceCents: number },
  now = Date.now(),
): boolean {
  if (move.amountCents <= 0) return false;
  if (!move.isDeposit && move.amountCents > move.balanceCents) return false;
  store.insert('reserveMovement', {
    amountCents: move.isDeposit ? move.amountCents : -move.amountCents,
    date: now,
    note: move.note.trim(),
  });
  return true;
}

export function addInvestment(
  store: RecordStore,
  investment: { name: string; modality: string; modalityTitle: string; amountCents: number; date: number },
): void {
  if (investment.amountCents <= 0) return;
  store.insert('investment', {
    name: investment.name.trim() || investment.modalityTitle,
    modality: investment.modality,
    amountCents: investment.amountCents,
    date: investment.date,
  });
}

export interface GainForm {
  category: string;
  categoryTitle: string;
  amountCents: number;
  note: string;
  percent: number;
  modality: string;
  modalityTitle: string;
}

/**
 * Registra um ganho do passo a passo: a entrada e, se houver, a parte separada.
 * No Nível 1 a parte vai para a reserva; no Nível 2, para um investimento.
 * Devolve o plano calculado antes de salvar, para a comemoração.
 */
export function saveGain(store: RecordStore, gain: GainForm, now = Date.now()): GainPlan | null {
  const input = gameInput(store, now);
  if (!input || gain.amountCents <= 0) return null;
  const plan = computeGainPlan(input, gain.amountCents, gain.percent);
  const title = gain.note.trim() || gain.categoryTitle;

  store.insert('cashEntry', { title, amountCents: gain.amountCents, date: now, kind: 'income', category: gain.category });
  if (plan.splitCents > 0) {
    if (plan.destination === 'investment') {
      store.insert('investment', { name: gain.modalityTitle, modality: gain.modality, amountCents: plan.splitCents, date: now });
    } else {
      store.insert('reserveMovement', { amountCents: plan.splitCents, date: now, note: `Do ganho: ${title}` });
    }
  }
  return plan;
}
