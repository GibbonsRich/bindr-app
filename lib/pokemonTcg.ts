import { getPokemonTcgApiKey } from '@/lib/config';
import type { CardCondition } from '@/types/card';

type TcgPriceBucket = {
  market?: number;
  mid?: number;
  low?: number;
};

type TcgCard = {
  id: string;
  name: string;
  number: string;
  rarity: string;
  set: { name: string };
  tcgplayer?: {
    prices?: Record<string, TcgPriceBucket>;
  };
};

type TcgSearchResponse = {
  data: TcgCard[];
};

export type VerifiedCard = {
  name: string;
  set: string;
  number: string;
  rarity: string;
  marketPrice: number | null;
  tcgId: string | null;
  verified: boolean;
};

const CONDITION_MULTIPLIER: Record<CardCondition, number> = {
  Mint: 1.15,
  'Near Mint': 1,
  Excellent: 0.78,
  Good: 0.58,
  Played: 0.38,
  Poor: 0.2,
};

function escapeQuery(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function headers(): HeadersInit {
  const apiKey = getPokemonTcgApiKey();
  return apiKey ? { 'X-Api-Key': apiKey } : {};
}

function pickMarketPrice(card: TcgCard): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  for (const bucket of Object.values(prices)) {
    if (typeof bucket.market === 'number') return bucket.market;
    if (typeof bucket.mid === 'number') return bucket.mid;
    if (typeof bucket.low === 'number') return bucket.low;
  }

  return null;
}

function conformNumber(visionNumber: string, apiNumber: string): boolean {
  const normalize = (value: string) => value.replace(/\s/g, '').toLowerCase();
  const vision = normalize(visionNumber);
  const api = normalize(apiNumber);

  if (vision === api) return true;
  const visionHead = vision.split('/')[0];
  const apiHead = api.split('/')[0];
  return Boolean(visionHead && apiHead && visionHead === apiHead);
}

async function searchCards(query: string): Promise<TcgCard[]> {
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=20`;

  const response = await fetch(url, { headers: headers() });
  if (!response.ok) {
    console.warn('Pokemon TCG API lookup failed', response.status);
    return [];
  }

  const payload = (await response.json()) as TcgSearchResponse;
  return payload.data ?? [];
}

function scoreCandidate(card: TcgCard, name: string, set: string, number: string): number {
  let score = 0;
  if (card.name.toLowerCase() === name.toLowerCase()) score += 4;
  else if (card.name.toLowerCase().includes(name.toLowerCase())) score += 2;

  if (card.set.name.toLowerCase() === set.toLowerCase()) score += 3;
  else if (card.set.name.toLowerCase().includes(set.toLowerCase())) score += 1;

  if (conformNumber(number, card.number)) score += 3;

  return score;
}

export async function verifyCardWithTcgApi(
  name: string,
  set: string,
  number: string
): Promise<VerifiedCard> {
  const fallback: VerifiedCard = {
    name,
    set,
    number,
    rarity: 'Unknown',
    marketPrice: null,
    tcgId: null,
    verified: false,
  };

  try {
    let results = await searchCards(`name:"${escapeQuery(name)}" set.name:"${escapeQuery(set)}"`);

    if (results.length === 0) {
      results = await searchCards(`name:"${escapeQuery(name)}"`);
    }

    if (results.length === 0) return fallback;

    const best = [...results].sort(
      (a, b) => scoreCandidate(b, name, set, number) - scoreCandidate(a, name, set, number)
    )[0];

    const verified = scoreCandidate(best, name, set, number) >= 5;

    return {
      name: best.name,
      set: best.set.name,
      number: best.number,
      rarity: best.rarity ?? 'Unknown',
      marketPrice: pickMarketPrice(best),
      tcgId: best.id,
      verified,
    };
  } catch (error) {
    console.warn('Pokemon TCG API error', error);
    return fallback;
  }
}

export function estimateValueFromMarket(
  marketPrice: number | null,
  condition: CardCondition,
  fallbackName: string
): number {
  const base =
    marketPrice ??
    (fallbackName.toLowerCase().includes('charizard')
      ? 250
      : fallbackName.toLowerCase().includes('umbreon')
        ? 180
        : 45);

  return Math.max(1, Math.round(base * CONDITION_MULTIPLIER[condition]));
}
