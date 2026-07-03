/** Public Pokemon TCG images for demo cards (no API key required). */
const CARD_ART: Record<string, string> = {
  'Charizard|Base Set': 'https://images.pokemontcg.io/base1/4_hires.png',
  'Blastoise|Base Set': 'https://images.pokemontcg.io/base1/2_hires.png',
  'Mewtwo|Base Set': 'https://images.pokemontcg.io/base1/10_hires.png',
  'Umbreon VMAX|Evolving Skies': 'https://images.pokemontcg.io/swsh7/215_hires.png',
  'Lugia V|Silver Tempest': 'https://images.pokemontcg.io/swsh12/186_hires.png',
  'Pikachu VMAX|Vivid Voltage': 'https://images.pokemontcg.io/swsh4/188_hires.png',
  'Pikachu Illustrator|Promo': 'https://images.pokemontcg.io/base1/58_hires.png',
};

/** Standard Pokemon TCG card back for demo portfolio views. */
export const POKEMON_CARD_BACK = 'https://images.pokemontcg.io/back.png';

function lookupKey(name: string, set: string) {
  return `${name.trim()}|${set.trim()}`;
}

export function getCardImageUri(name: string, set: string, imageUri?: string): string | undefined {
  if (imageUri) return imageUri;
  return CARD_ART[lookupKey(name, set)];
}

export function getCardBackImageUri(backImageUri?: string): string {
  return backImageUri ?? POKEMON_CARD_BACK;
}
