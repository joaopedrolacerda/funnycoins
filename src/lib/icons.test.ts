import { beforeAll, describe, expect, it } from 'vitest';
import { catalog, computeSnapshot, gameInput } from './game';
import { saveProfile } from './actions';
import { achievementIcon, categoryIcon, iconPaths, modalityIcon, moodIcon, type IconName } from './icons';
import { loadRulesForTests, testStore } from './test-support';

beforeAll(loadRulesForTests);

describe('ícones', () => {
  it('toda categoria e modalidade do jogo tem ícone', () => {
    for (const item of catalog().categories) expect(categoryIcon[item.id], item.id).toBeDefined();
    for (const item of catalog().modalities) expect(modalityIcon[item.id], item.id).toBeDefined();
  });

  it('todo humor e conquista tem ícone', () => {
    for (const mood of ['happy', 'ok', 'sad', 'hungry', 'sick']) expect(moodIcon[mood], mood).toBeDefined();
    const { store, now } = testStore();
    saveProfile(store, { monthlyEssentialCostCents: 300000, targetMonths: 6, investPercent: 10, petName: 'Bolota', petColor: 'green' }, now);
    const input = gameInput(store, now);
    expect(input).toBeTruthy();
    for (const achievement of computeSnapshot(input!).achievements) {
      expect(achievementIcon[achievement.id], achievement.id).toBeDefined();
    }
  });

  it('os mapas só apontam para ícones que existem', () => {
    const maps: Record<string, IconName>[] = [categoryIcon, modalityIcon, achievementIcon, moodIcon];
    for (const name of maps.flatMap((map) => Object.values(map))) {
      expect(iconPaths[name], name).toBeDefined();
    }
  });

  it('os desenhos são só traço, sem emoji e sem cor fixa', () => {
    for (const [name, markup] of Object.entries(iconPaths)) {
      expect(markup, name).toMatch(/^<(path|circle|rect) /);
      expect(markup, name).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(markup, name).not.toMatch(/fill="(?!currentColor)/);
      expect(markup, name).not.toMatch(/<script|on\w+=/i);
    }
  });
});
