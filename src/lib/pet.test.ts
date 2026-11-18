import { describe, expect, it } from 'vitest';
import { appearance, babyAppearance, eggSpikes, featureCount, maxSpikeAngle, mix } from './pet';
import type { PetStage } from './game';

describe('formas do bichinho', () => {
  it('cada evolução ganha mais partes que a anterior', () => {
    const stages: PetStage[] = ['baby', 'young', 'adult', 'legend'];
    const counts = stages.map((stage) => featureCount(appearance(stage) ?? babyAppearance));
    for (let index = 1; index < counts.length; index++) {
      expect(counts[index]).toBeGreaterThan(counts[index - 1]);
    }
  });

  it('Filhote continua a bolinha aprovada, igual ao app', () => {
    expect(appearance('baby')).toEqual(babyAppearance);
    expect(babyAppearance).toMatchObject({ bodyWidth: 0.78, bodyHeight: 0.7, cornerRatio: 0.36 });
    expect(featureCount(babyAppearance)).toBe(0);
  });

  it('o ovo não tem forma de criatura', () => {
    expect(appearance('egg')).toBeNull();
  });

  it('ovo tem 7 espinhos simétricos e nenhum embaixo', () => {
    expect(eggSpikes).toHaveLength(7);
    for (const spike of eggSpikes) {
      expect(Math.abs(spike.angle)).toBeLessThanOrEqual(maxSpikeAngle);
      if (spike.angle !== 0) {
        expect(eggSpikes.some((other) => other.angle === -spike.angle && other.length === spike.length)).toBe(true);
      }
    }
  });

  it('mistura cores', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#34c759', '#000000', 0)).toBe('#34c759');
  });
});
