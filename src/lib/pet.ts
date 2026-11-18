// Forma do bichinho em cada estágio. Mesmas medidas de PetStage.appearance e EggDesign no app.
// Medidas são frações do tamanho do desenho.

import type { PetStage } from './game';

export type PetEars = 'none' | 'pointy' | 'long';
export type PetHeadAccessory = 'none' | 'leaf' | 'crown';

export interface PetAppearance {
  bodyWidth: number;
  bodyHeight: number;
  cornerRatio: number;
  ears: PetEars;
  hasArms: boolean;
  hasTail: boolean;
  hasWings: boolean;
  hasAura: boolean;
  bellyEmblem: 'shield' | 'star' | null;
  headAccessory: PetHeadAccessory;
}

const plain: Omit<PetAppearance, 'bodyWidth' | 'bodyHeight' | 'cornerRatio'> = {
  ears: 'none',
  hasArms: false,
  hasTail: false,
  hasWings: false,
  hasAura: false,
  bellyEmblem: null,
  headAccessory: 'none',
};

/** Filhote: bolinha redonda sem partes extras. Aprovada pelo usuário, não alterar. */
export const babyAppearance: PetAppearance = { ...plain, bodyWidth: 0.78, bodyHeight: 0.7, cornerRatio: 0.36 };

/** Forma de cada estágio. O ovo é desenhado à parte. */
export function appearance(stage: PetStage): PetAppearance | null {
  switch (stage) {
    case 'egg':
      return null;
    case 'baby':
      return babyAppearance;
    case 'young':
      return { ...plain, bodyWidth: 0.7, bodyHeight: 0.76, cornerRatio: 0.32, ears: 'pointy', hasArms: true, headAccessory: 'leaf' };
    case 'adult':
      return {
        ...plain,
        bodyWidth: 0.8,
        bodyHeight: 0.78,
        cornerRatio: 0.3,
        ears: 'long',
        hasArms: true,
        hasTail: true,
        bellyEmblem: 'shield',
      };
    case 'legend':
      return {
        bodyWidth: 0.82,
        bodyHeight: 0.8,
        cornerRatio: 0.3,
        ears: 'long',
        hasArms: true,
        hasTail: true,
        hasWings: true,
        hasAura: true,
        bellyEmblem: 'star',
        headAccessory: 'crown',
      };
  }
}

/** Quantidade de partes extras: cresce a cada evolução. */
export function featureCount(look: PetAppearance): number {
  return [
    look.ears !== 'none',
    look.hasArms,
    look.hasTail,
    look.hasWings,
    look.hasAura,
    look.bellyEmblem !== null,
    look.headAccessory !== 'none',
  ].filter(Boolean).length;
}

/** Tamanho relativo: o bichinho cresce ao evoluir. */
export const stageScale: Record<PetStage, number> = { egg: 0.8, baby: 0.75, young: 0.85, adult: 0.95, legend: 1 };

export const stageTitle: Record<PetStage, string> = {
  egg: 'Ovo',
  baby: 'Filhote',
  young: 'Jovem',
  adult: 'Adulto',
  legend: 'Lendário',
};

export const moodTitle: Record<string, string> = {
  happy: 'Feliz',
  ok: 'Tranquilo',
  sad: 'Triste',
  hungry: 'Com fome',
  sick: 'Doente',
};


/** Curvatura da boca: 1 sorriso, -1 tristeza. */
export const mouthCurve: Record<string, number> = { happy: 1, ok: 0.4, sad: -0.7, hungry: 0, sick: -0.4 };

/** Espinho na casca: ângulo em graus a partir do topo (negativo à esquerda) e comprimento. */
export interface EggSpike {
  angle: number;
  length: number;
}

/** Sete espinhos simétricos, nenhum embaixo, onde o ovo se apoia. */
export const eggSpikes: EggSpike[] = [
  { angle: 0, length: 0.14 },
  { angle: -35, length: 0.12 },
  { angle: 35, length: 0.12 },
  { angle: -75, length: 0.13 },
  { angle: 75, length: 0.13 },
  { angle: -115, length: 0.1 },
  { angle: 115, length: 0.1 },
];

/** Passou disso, o espinho encostaria no chão. */
export const maxSpikeAngle = 130;

// Cores do sistema da Apple, para o bichinho ficar igual no app e no site.
export const petColors: Record<string, string> = {
  green: '#34c759',
  blue: '#007aff',
  pink: '#ff2d55',
  orange: '#ff9500',
  purple: '#af52de',
};

export const systemColors = { yellow: '#ffcc00', orange: '#ff9500', gray: '#8e8e93', pink: '#ff2d55', green: '#34c759' };

/** Mistura duas cores em hexadecimal, como `Color.mix(with:by:)`. */
export function mix(from: string, to: string, amount: number): string {
  const parse = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const a = parse(from);
  const b = parse(to);
  const channels = a.map((value, index) => Math.round(value + (b[index] - value) * amount));
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}
