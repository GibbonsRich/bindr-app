import type { CardCondition, ScanResult } from '@/types/card';

const MOCK_CARDS = [
  { name: 'Charizard', set: 'Base Set', number: '4/102', rarity: 'Holo Rare' },
  { name: 'Blastoise', set: 'Base Set', number: '2/102', rarity: 'Holo Rare' },
  { name: 'Mewtwo', set: 'Base Set', number: '10/102', rarity: 'Holo Rare' },
  { name: 'Umbreon VMAX', set: 'Evolving Skies', number: '215/203', rarity: 'Secret Rare' },
  { name: 'Lugia V', set: 'Silver Tempest', number: '186/195', rarity: 'Alt Art' },
  { name: 'Pikachu VMAX', set: 'Vivid Voltage', number: '188/185', rarity: 'Secret Rare' },
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
      'Centering slightly left-heavy',
      'Minor print line on holo surface',
      'Back shows light whitening on one corner',
    ].slice(0, Math.floor(Math.random() * 3) + 1),
  };
}

function estimateValue(name: string, condition: CardCondition): number {
  const premium = name.includes('Charizard') ? 420 : name.includes('Umbreon') ? 310 : 85;
  const multiplier = {
    Mint: 1.2,
    'Near Mint': 1,
    Excellent: 0.75,
    Good: 0.5,
    Played: 0.3,
    Poor: 0.15,
  }[condition];

  return Math.round(premium * multiplier);
}

/** Simulates AI vision analysis. Replace with a real model/API in production. */
export async function analyzeCardImage(_imageUri: string): Promise<ScanResult> {
  await new Promise((resolve) => setTimeout(resolve, 1800));

  const template = randomFrom(MOCK_CARDS);
  const condition = randomFrom(CONDITIONS);
  const grade = gradeFor(condition);

  return {
    confidence: Math.round((0.82 + Math.random() * 0.15) * 100) / 100,
    card: {
      name: template.name,
      set: template.set,
      number: template.number,
      rarity: template.rarity,
      imageUri: _imageUri,
      condition,
      grade,
      estimatedValue: estimateValue(template.name, condition),
    },
  };
}
