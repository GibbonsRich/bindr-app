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

const POINT_COUNTS: Record<ChartRange, number> = {
  '1D': 24,
  '7D': 28,
  '1M': 30,
  '3M': 42,
  '6M': 48,
  ALL: 56,
};

/** Per-step return volatility — higher on longer windows. */
const STEP_VOLATILITY: Record<ChartRange, number> = {
  '1D': 0.006,
  '7D': 0.012,
  '1M': 0.018,
  '3M': 0.024,
  '6M': 0.028,
  ALL: 0.032,
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

/** Seeded approximate normal in [-1, 1]. */
function normalish(seed: number, index: number): number {
  const a = noise(seed, index * 3) * 2 - 1;
  const b = noise(seed, index * 3 + 1) * 2 - 1;
  const c = noise(seed, index * 3 + 2) * 2 - 1;
  return (a + b + c) / 3;
}

function roundPrice(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
}

function buildRealisticSeries(
  seed: number,
  range: ChartRange,
  startTime: number,
  endTime: number,
  targetValue: number
): ChartPoint[] {
  const pointCount = POINT_COUNTS[range];
  const vol = STEP_VOLATILITY[range];
  const span = Math.max(endTime - startTime, MS.hour);

  const startRatio = 0.62 + noise(seed, 1) * 0.38;
  const startValue = Math.max(1, roundPrice(targetValue * startRatio));
  const values: number[] = [startValue];

  let price = startValue;

  for (let i = 1; i < pointCount - 1; i++) {
    const progress = i / (pointCount - 1);
    const trendAnchor = startValue + (targetValue - startValue) * progress;

    const drift = (trendAnchor / price - 1) * 0.12;
    const shock = normalish(seed, i + 10) * vol;
    const cycle =
      Math.sin(progress * Math.PI * (2.4 + noise(seed, 50) * 1.6) + seed * 0.01) *
      vol *
      0.55;

    let event = 0;
    const eventRoll = noise(seed, i + 200);
    if (eventRoll > 0.94) {
      event = normalish(seed, i + 300) * vol * 2.8;
    } else if (eventRoll < 0.04) {
      event = normalish(seed, i + 400) * vol * 2.2;
    }

    price = price * (1 + drift + shock + cycle + event);
    price = price * 0.82 + trendAnchor * 0.18;

    const floor = targetValue * (0.42 + noise(seed, 2) * 0.12);
    const ceiling = targetValue * (1.35 + noise(seed, 3) * 0.2);
    price = Math.min(ceiling, Math.max(floor, price));

    values.push(roundPrice(price));
  }

  values.push(roundPrice(targetValue));

  return values.map((value, index) => ({
    timestamp: startTime + (span * index) / (pointCount - 1),
    value: index === pointCount - 1 ? roundPrice(targetValue) : value,
  }));
}

export function buildPortfolioHistory(
  totalValue: number,
  cards: PokemonCard[],
  range: ChartRange
): ChartPoint[] {
  const now = Date.now();
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

  const pointCount = POINT_COUNTS[range];

  if (cards.length === 0 || totalValue <= 0) {
    return Array.from({ length: pointCount }, (_, i) => ({
      timestamp: start + ((now - start) * i) / (pointCount - 1),
      value: 0,
    }));
  }

  return buildRealisticSeries(seed, range, start, now, totalValue);
}

export function buildCardPriceHistory(card: PokemonCard, range: ChartRange): ChartPoint[] {
  const seed = hashSeed(`${card.id}|${card.name}|${card.set}|${card.condition}`);
  const now = Date.now();

  const addedAt = new Date(card.addedAt).getTime();
  let start = now - RANGE_MS[range];
  if (range === 'ALL') {
    start = Math.min(addedAt, now - RANGE_MS['6M']);
  } else {
    start = Math.max(start, addedAt - MS.day * 3);
  }

  return buildRealisticSeries(seed, range, start, now, card.estimatedValue);
}

export function getPeriodChange(points: ChartPoint[]): { delta: number; percent: number } {
  if (points.length < 2) return { delta: 0, percent: 0 };
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const delta = last - first;
  const percent = first === 0 ? (last > 0 ? 100 : 0) : (delta / first) * 100;
  return { delta, percent };
}
