import type { PokemonCard } from '@/types/card';

export type ChartRange = '1D' | '7D' | '1M' | '3M' | '6M' | 'ALL';

export type ChartPoint = {
  timestamp: number;
  value: number;
};

export const CHART_RANGES: { key: ChartRange; label: string }[] = [
  { key: '1D', label: '1D' },
  { key: '7D', label: '7D' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: 'ALL', label: 'All' },
];

const MS = {
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
};

const RANGE_MS: Record<ChartRange, number> = {
  '1D': MS.day,
  '7D': 7 * MS.day,
  '1M': 30 * MS.day,
  '3M': 90 * MS.day,
  '6M': 180 * MS.day,
  ALL: 365 * MS.day,
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
  const x = Math.sin(seed * 0.17 + index * 1.31) * 10000;
  return x - Math.floor(x);
}

export function buildPortfolioHistory(
  totalValue: number,
  cards: PokemonCard[],
  range: ChartRange
): ChartPoint[] {
  const now = Date.now();
  const pointCount = range === '1D' ? 24 : range === '7D' ? 28 : 40;
  const seed = hashSeed(cards.map((c) => c.id).join('|') || 'empty');

  const earliestCard = cards.reduce((min, card) => {
    const t = new Date(card.addedAt).getTime();
    return t < min ? t : min;
  }, now);

  let start = now - RANGE_MS[range];
  if (range === 'ALL') {
    start = Math.min(earliestCard, now - RANGE_MS['6M']);
  } else {
    start = Math.max(start, earliestCard - MS.day);
  }

  if (cards.length === 0) {
    return Array.from({ length: pointCount }, (_, i) => ({
      timestamp: start + ((now - start) * i) / (pointCount - 1),
      value: 0,
    }));
  }

  const startValue = Math.max(12, Math.round(totalValue * (0.55 + noise(seed, 1) * 0.25)));
  const points: ChartPoint[] = [];

  for (let i = 0; i < pointCount; i++) {
    const t = start + ((now - start) * i) / (pointCount - 1);
    const progress = i / (pointCount - 1);
    const trend = startValue + (totalValue - startValue) * Math.pow(progress, 0.85);
    const wiggle = (noise(seed, i + 2) - 0.5) * totalValue * 0.08 * (1 - progress * 0.5);
    const value = i === pointCount - 1 ? totalValue : Math.max(0, Math.round(trend + wiggle));
    points.push({ timestamp: t, value });
  }

  return points;
}

export function getPeriodChange(points: ChartPoint[]): { delta: number; percent: number } {
  if (points.length < 2) return { delta: 0, percent: 0 };
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const delta = last - first;
  const percent = first === 0 ? (last > 0 ? 100 : 0) : (delta / first) * 100;
  return { delta, percent };
}
