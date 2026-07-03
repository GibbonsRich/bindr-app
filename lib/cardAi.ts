import type { CardCondition, ScanResult } from '@/types/card';

const MOCK_CARDS = [
  { name: 'Charizard', set: 'Base Set', number: '4/102', rarity: 'Holo Rare', value: 320 },
  { name: 'Blastoise', set: 'Base Set', number: '2/102', rarity: 'Holo Rare', value: 145 },
  { name: 'Mewtwo', set: 'Base Set', number: '10/102', rarity: 'Holo Rare', value: 95 },
  { name: 'Umbreon VMAX', set: 'Evolving Skies', number: '215/203', rarity: 'Secret Rare', value: 280 },
  { name: 'Lugia V', set: 'Silver Tempest', number: '186/195', rarity: 'Alt Art', value: 78 },
  { name: 'Pikachu VMAX', set: 'Vivid Voltage', number: '188/185', rarity: 'Secret Rare', value: 65 },
];

const CONDITIONS: CardCondition[] = ['Mint', 'Near Mint', 'Excellent', 'Good', 'Played'];

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function gradeFor(condition: CardCondition) {
  const base = {
    Mint: 9.8,
    'Near Mint': 8.5,
    Excellent: 7.2,
    Good: 5.5,
    Played: 3.8,
    Poor: 2.0,
  }[condition];

  const jitter = () => Math.round((base + (Math.random() - 0.5) * 0.8) * 10) / 10;

  return {
    overall: condition,
    centering: jitter(),
    corners: jitter(),
    edges: jitter(),
    surface: jitter(),
    notes: [
      'Demo scan — sample data for prototyping',
      'Centering slightly left-heavy',
      'Minor holo surface scuff visible under light',
    ],
  };
}

function estimateValue(base: number, condition: CardCondition): number {
  const multiplier = {
    Mint: 1.15,
    'Near Mint': 1,
    Excellent: 0.78,
    Good: 0.58,
    Played: 0.38,
    Poor: 0.2,
  }[condition];

  return Math.round(base * multiplier);
}

/** Demo scan — returns sample card data after a short delay. No API keys required. */
export async function analyzeCardImage(imageUri: string): Promise<ScanResult> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const template = randomFrom(MOCK_CARDS);
  const condition = randomFrom(CONDITIONS);
  const grade = gradeFor(condition);

  return {
    confidence: Math.round((0.84 + Math.random() * 0.12) * 100) / 100,
    card: {
      name: template.name,
      set: template.set,
      number: template.number,
      rarity: template.rarity,
      imageUri,
      condition,
      grade,
      estimatedValue: estimateValue(template.value, condition),
    },
  };
}

export class ScanAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScanAnalysisError';
  }
}
