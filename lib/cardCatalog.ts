export type CatalogCard = {
  name: string;
  set: string;
  number: string;
  rarity: string;
  marketValue: number;
};

export const CARD_CATALOG: CatalogCard[] = [
  { name: 'Charizard', set: 'Base Set', number: '4/102', rarity: 'Holo Rare', marketValue: 320 },
  { name: 'Blastoise', set: 'Base Set', number: '2/102', rarity: 'Holo Rare', marketValue: 145 },
  { name: 'Venusaur', set: 'Base Set', number: '15/102', rarity: 'Holo Rare', marketValue: 110 },
  { name: 'Mewtwo', set: 'Base Set', number: '10/102', rarity: 'Holo Rare', marketValue: 95 },
  { name: 'Pikachu', set: 'Base Set', number: '58/102', rarity: 'Common', marketValue: 12 },
  { name: 'Alakazam', set: 'Base Set', number: '1/102', rarity: 'Holo Rare', marketValue: 52 },
  { name: 'Gyarados', set: 'Base Set', number: '6/102', rarity: 'Holo Rare', marketValue: 48 },
  { name: 'Umbreon VMAX', set: 'Evolving Skies', number: '215/203', rarity: 'Secret Rare', marketValue: 280 },
  { name: 'Rayquaza VMAX', set: 'Evolving Skies', number: '218/203', rarity: 'Secret Rare', marketValue: 190 },
  { name: 'Dragonite V', set: 'Evolving Skies', number: '192/203', rarity: 'Alt Art', marketValue: 85 },
  { name: 'Lugia V', set: 'Silver Tempest', number: '186/195', rarity: 'Alt Art', marketValue: 78 },
  { name: 'Pikachu VMAX', set: 'Vivid Voltage', number: '188/185', rarity: 'Secret Rare', marketValue: 65 },
  { name: 'Gengar VMAX', set: 'Fusion Strike', number: '271/264', rarity: 'Secret Rare', marketValue: 120 },
  { name: 'Mew VMAX', set: 'Fusion Strike', number: '269/264', rarity: 'Secret Rare', marketValue: 95 },
  { name: 'Charizard VSTAR', set: 'Brilliant Stars', number: '174/172', rarity: 'Secret Rare', marketValue: 140 },
  { name: 'Arceus VSTAR', set: 'Brilliant Stars', number: '184/172', rarity: 'Secret Rare', marketValue: 72 },
  { name: 'Pikachu Illustrator', set: 'Promo', number: 'PROMO', rarity: 'Promo', marketValue: 5000 },
  { name: 'Umbreon', set: 'Neo Discovery', number: '13/75', rarity: 'Holo Rare', marketValue: 220 },
  { name: 'Espeon', set: 'Neo Discovery', number: '20/75', rarity: 'Holo Rare', marketValue: 180 },
  { name: 'Lugia', set: 'Neo Genesis', number: '9/111', rarity: 'Holo Rare', marketValue: 260 },
  { name: 'Ho-Oh', set: 'Neo Revelation', number: '7/64', rarity: 'Holo Rare', marketValue: 130 },
  { name: 'Mew', set: 'Legendary Collection', number: '8/110', rarity: 'Holo Rare', marketValue: 88 },
  { name: 'Suicune', set: 'Neo Revelation', number: '14/64', rarity: 'Holo Rare', marketValue: 175 },
];

export function searchCards(query: string): CatalogCard[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  return CARD_CATALOG.filter((card) => {
    const haystack = `${card.name} ${card.set} ${card.number} ${card.rarity}`.toLowerCase();
    return haystack.includes(trimmed);
  });
}

export function wishlistKey(name: string, set: string): string {
  return `${name.trim()}|${set.trim()}`;
}
