import type { CardCondition, CardGrade } from '@/types/card';

const BASE_SCORES: Record<CardCondition, number> = {
  Mint: 9.8,
  'Near Mint': 8.5,
  Excellent: 7.2,
  Good: 5.5,
  Played: 3.8,
  Poor: 2.0,
};

export function gradeFor(condition: CardCondition): CardGrade {
  const base = BASE_SCORES[condition];
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

export function estimateGradeFromCondition(condition: CardCondition): CardGrade {
  const base = BASE_SCORES[condition];

  return {
    overall: condition,
    centering: Math.round((base - 0.2) * 10) / 10,
    corners: base,
    edges: Math.round((base - 0.1) * 10) / 10,
    surface: Math.round((base - 0.3) * 10) / 10,
    notes: ['Grade estimated from overall condition — scan the card for a full assessment.'],
  };
}

export function getCardGrade(card: { condition: CardCondition; grade?: CardGrade }): CardGrade {
  return card.grade ?? estimateGradeFromCondition(card.condition);
}
