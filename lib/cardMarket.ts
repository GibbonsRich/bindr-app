import type { CardCondition, PokemonCard } from '@/types/card';

export type ConditionAverageSale = {
  condition: CardCondition;
  averageSold: number;
};

export type LastCardSale = {
  price: number;
  condition: CardCondition;
  soldAt: string;
};

export type CardMarketData = {
  averageByCondition: ConditionAverageSale[];
  lastSale: LastCardSale;
};

const ALL_CONDITIONS: CardCondition[] = [
  'Mint',
  'Near Mint',
  'Excellent',
  'Good',
  'Played',
  'Poor',
];

const CONDITION_MULTIPLIERS: Record<CardCondition, number> = {
  Mint: 1.15,
  'Near Mint': 1,
  Excellent: 0.78,
  Good: 0.58,
  Played: 0.38,
  Poor: 0.2,
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function noise(seed: number, index: number): number {
  const x = Math.sin(seed * 0.23 + index * 1.07) * 10000;
  return x - Math.floor(x);
}

function nearMintBase(card: Pick<PokemonCard, 'estimatedValue' | 'condition'>): number {
  return Math.round(card.estimatedValue / CONDITION_MULTIPLIERS[card.condition]);
}

function priceForCondition(baseNearMint: number, condition: CardCondition): number {
  return Math.round(baseNearMint * CONDITION_MULTIPLIERS[condition]);
}

/** Demo market stats derived from the card's estimated value. */
export function getCardMarketData(card: PokemonCard): CardMarketData {
  const seed = hashSeed(`${card.id}|${card.name}|${card.set}`);
  const base = nearMintBase(card);

  const averageByCondition = ALL_CONDITIONS.map((condition, index) => {
    const core = priceForCondition(base, condition);
    const wiggle = Math.round((noise(seed, index) - 0.5) * core * 0.06);
    return {
      condition,
      averageSold: Math.max(1, core + wiggle),
    };
  });

  const lastCondition = ALL_CONDITIONS[Math.floor(noise(seed, 9) * ALL_CONDITIONS.length)];
  const lastCore = priceForCondition(base, lastCondition);
  const lastWiggle = Math.round((noise(seed, 10) - 0.5) * lastCore * 0.04);
  const daysAgo = 1 + Math.floor(noise(seed, 11) * 12);
  const soldAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  return {
    averageByCondition,
    lastSale: {
      condition: lastCondition,
      price: Math.max(1, lastCore + lastWiggle),
      soldAt,
    },
  };
}

export function formatSaleDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
