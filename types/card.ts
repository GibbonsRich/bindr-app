export type CardCondition = 'Mint' | 'Near Mint' | 'Excellent' | 'Good' | 'Played' | 'Poor';

export type CardGrade = {
  overall: CardCondition;
  centering: number;
  corners: number;
  edges: number;
  surface: number;
  notes: string[];
};

export type PokemonCard = {
  id: string;
  name: string;
  set: string;
  number: string;
  rarity: string;
  imageUri?: string;
  backImageUri?: string;
  condition: CardCondition;
  grade?: CardGrade;
  estimatedValue: number;
  quantity: number;
  addedAt: string;
  source: 'scan' | 'manual';
};

export type WishlistItem = {
  id: string;
  name: string;
  set: string;
  maxPrice?: number;
  priority: 'high' | 'medium' | 'low';
};

export type CollectorListing = {
  collectorId: string;
  collectorName: string;
  distanceMiles: number;
  cardName: string;
  set: string;
  condition: CardCondition;
  askingPrice: number;
};

export type ScanResult = {
  card: Omit<PokemonCard, 'id' | 'addedAt' | 'quantity' | 'source'>;
  confidence: number;
};
