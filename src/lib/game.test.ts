import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { catalog, computeSnapshot, gameInput, type GameInput } from './game';
import { addBill, addEntry, addInvestment, moveReserve, payBill, saveGain, saveProfile } from './actions';
import { day, loadRulesForTests, testStore } from './test-support';

beforeAll(loadRulesForTests);

interface FixtureCase extends GameInput {
  name: string;
  expected: {
    reserveGoalCents: number;
    reserveBalanceCents: number;
    reserveProgress: number;
    currentLevel: number;
    xp: number;
    rank: string;
    achievements: string[];
    petStage: string;
    petMood: string;
  };
}

const fixtures: FixtureCase[] = JSON.parse(
  readFileSync(new URL('../../../MyAppTests/Fixtures/rules-fixtures.json', import.meta.url), 'utf8'),
).cases;

describe('regras em WebAssembly', () => {
  it.each(fixtures.map((fixture) => [fixture.name, fixture] as const))('caso compartilhado: %s', (_name, fixture) => {
    const result = computeSnapshot(fixture);
    const expected = fixture.expected;
    expect(result.reserveGoalCents).toBe(expected.reserveGoalCents);
    expect(result.reserveBalanceCents).toBe(expected.reserveBalanceCents);
    expect(result.reserveProgress).toBeCloseTo(expected.reserveProgress, 4);
    expect(result.currentLevel).toBe(expected.currentLevel);
    expect(result.xp).toBe(expected.xp);
    expect(result.rank).toBe(expected.rank);
    expect(result.achievements.filter((a) => a.isUnlocked).map((a) => a.id)).toEqual(expected.achievements);
    expect(result.petStage).toBe(expected.petStage);
    expect(result.petMood).toBe(expected.petMood);
  });

  it('catálogo tem as 11 modalidades, com cursos como investimento em você', () => {
    const modalities = catalog().modalities;
    expect(modalities).toHaveLength(11);
    expect(modalities.find((m) => m.id === 'education')).toMatchObject({
      title: 'Cursos e educação',
      risk: 0,
      riskTitle: 'Investimento em você',
    });
  });
});

const profile = { monthlyEssentialCostCents: 100000, targetMonths: 6, investPercent: 10, petName: '', petColor: 'green' };
const gain = {
  category: 'salary',
  categoryTitle: 'Salário',
  note: '',
  modality: 'cdb',
  modalityTitle: 'CDB',
};

describe('ações do jogador', () => {
  it('sem perfil não há jogo', () => {
    const { store, now } = testStore();
    expect(gameInput(store, now)).toBeNull();
  });

  it('perfil novo usa Moedinha e limita os valores', () => {
    const { store, now } = testStore();
    saveProfile(store, { ...profile, targetMonths: 99, investPercent: 1 });
    const snapshot = computeSnapshot(gameInput(store, now)!);
    expect(store.profile?.data).toMatchObject({ petName: 'Moedinha', targetMonths: 24, investPercent: 5 });
    expect(snapshot.reserveGoalCents).toBe(2400000);
    expect(snapshot.petStage).toBe('egg');

    saveProfile(store, { ...profile, petName: '  Bolota ' });
    expect(store.active('profile')).toHaveLength(1);
    expect(store.profile?.data.petName).toBe('Bolota');
  });

  it('ganho no Nível 1 vai para a reserva, limitado ao que falta', () => {
    const { store, now } = testStore();
    saveProfile(store, profile);
    moveReserve(store, { isDeposit: true, amountCents: 580000, note: '', balanceCents: 0 });

    const plan = saveGain(store, { ...gain, amountCents: 100000, percent: 50 });
    expect(plan).toMatchObject({ splitCents: 20000, destination: 'reserve', earnedXp: 25, unlocksLevel2: true });
    const movements = store.active('reserveMovement');
    expect(movements.at(-1)?.data).toMatchObject({ amountCents: 20000, note: 'Do ganho: Salário' });

    const snapshot = computeSnapshot(gameInput(store, now)!);
    expect(snapshot.isLevel1Complete).toBe(true);
    expect(snapshot.petStage).toBe('adult');
  });

  it('ganho no Nível 2 vira investimento na modalidade escolhida', () => {
    const { store } = testStore();
    saveProfile(store, profile);
    moveReserve(store, { isDeposit: true, amountCents: 600000, note: '', balanceCents: 0 });

    const plan = saveGain(store, { ...gain, amountCents: 300000, percent: 10, note: 'Salário outubro' });
    expect(plan).toMatchObject({ splitCents: 30000, destination: 'investment', earnedXp: 35 });
    expect(store.active('investment')[0].data).toMatchObject({ name: 'CDB', modality: 'cdb', amountCents: 30000 });
    expect(store.active('cashEntry')[0].data.title).toBe('Salário outubro');
  });

  it('ganho sem separar nada só registra a entrada', () => {
    const { store } = testStore();
    saveProfile(store, profile);
    const plan = saveGain(store, { ...gain, amountCents: 5000, percent: 0 });
    expect(plan?.earnedXp).toBe(5);
    expect(store.active('reserveMovement')).toEqual([]);
    expect(saveGain(store, { ...gain, amountCents: 0, percent: 10 })).toBeNull();
  });

  it('pagar conta marca o mês e lança a saída, uma vez só', () => {
    const { store, now } = testStore();
    saveProfile(store, profile);
    addBill(store, { name: 'Internet', amountCents: 10000, dueDay: 10 });
    const [bill] = store.active('bill');

    let snapshot = computeSnapshot(gameInput(store, now)!);
    expect(snapshot.billStatus[0]).toEqual({ isPaid: false, isOverdue: true });

    payBill(store, bill.id, now);
    payBill(store, bill.id, now);
    expect(store.get(bill.id)?.data).toMatchObject({ paidMonths: ['2026-10'] });
    expect(store.active('cashEntry').map((e) => e.data)).toEqual([
      { title: 'Internet', amountCents: 10000, date: now, kind: 'expense', category: 'bills' },
    ]);

    snapshot = computeSnapshot(gameInput(store, now)!);
    expect(snapshot.billStatus[0]).toEqual({ isPaid: true, isOverdue: false });
    expect(snapshot.achievements.find((a) => a.id === 'bills-ok')?.isUnlocked).toBe(true);
  });

  it('retirada não passa do saldo da reserva', () => {
    const { store } = testStore();
    expect(moveReserve(store, { isDeposit: false, amountCents: 100, note: '', balanceCents: 50 })).toBe(false);
    expect(moveReserve(store, { isDeposit: false, amountCents: 50, note: 'Dentista', balanceCents: 50 })).toBe(true);
    expect(store.active('reserveMovement')[0].data.amountCents).toBe(-50);
  });

  it('lançamentos e aportes sem nome usam o título da categoria ou modalidade', () => {
    const { store } = testStore();
    addEntry(store, { title: ' ', categoryTitle: 'Alimentação', amountCents: 2500, date: day(2026, 10, 1), category: 'food', kind: 'expense' });
    addInvestment(store, { name: '', modality: 'fii', modalityTitle: 'Fundos Imobiliários', amountCents: 100, date: day(2026, 10, 1) });
    addEntry(store, { title: 'x', categoryTitle: 'x', amountCents: 0, date: 0, category: 'food', kind: 'expense' });
    expect(store.active('cashEntry').map((e) => e.data.title)).toEqual(['Alimentação']);
    expect(store.active('investment')[0].data.name).toBe('Fundos Imobiliários');
  });

  it('excluídos não entram no jogo', () => {
    const { store, now } = testStore();
    saveProfile(store, profile);
    const deposit = store.insert('reserveMovement', { amountCents: 300000, date: now, note: '' });
    store.softDelete(deposit.id);
    expect(computeSnapshot(gameInput(store, now)!).reserveBalanceCents).toBe(0);
  });
});
