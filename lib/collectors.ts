import type { CollectorListing, WishlistItem } from '@/types/card';

const NEARBY_COLLECTORS: Omit<CollectorListing, 'cardName' | 'set' | 'condition' | 'askingPrice'>[] = [
  { collectorId: 'c1', collectorName: 'Ash K.', distanceMiles: 1.2 },
  { collectorId: 'c2', collectorName: 'Misty W.', distanceMiles: 2.8 },
  { collectorId: 'c3', collectorName: 'Brock H.', distanceMiles: 4.5 },
  { collectorId: 'c4', collectorName: 'Gary O.', distanceMiles: 6.1 },
  { collectorId: 'c5', collectorName: 'Serena L.', distanceMiles: 8.3 },
];

const INVENTORY: Record<string, { set: string; condition: CollectorListing['condition']; price: number }[]> = {
  Charizard: [
    { set: 'Base Set', condition: 'Near Mint', price: 320 },
    { set: 'Base Set', condition: 'Excellent', price: 210 },
  ],
  'Umbreon VMAX': [{ set: 'Evolving Skies', condition: 'Mint', price: 295 }],
  'Pikachu Illustrator': [{ set: 'Promo', condition: 'Good', price: 4800 }],
  Blastoise: [{ set: 'Base Set', condition: 'Near Mint', price: 145 }],
  Mewtwo: [{ set: 'Base Set', condition: 'Excellent', price: 95 }],
  'Lugia V': [{ set: 'Silver Tempest', condition: 'Near Mint', price: 78 }],
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function findMatchesForWishlist(
  wishlist: WishlistItem[],
  radiusMiles = 10
): CollectorListing[] {
  const matches: CollectorListing[] = [];

  for (const item of wishlist) {
    const listings = INVENTORY[item.name];
    if (!listings) continue;

    for (const listing of listings) {
      if (normalize(listing.set) !== normalize(item.set)) continue;
      if (item.maxPrice && listing.price > item.maxPrice) continue;

      for (const collector of NEARBY_COLLECTORS) {
        if (collector.distanceMiles > radiusMiles) continue;

        matches.push({
          ...collector,
          cardName: item.name,
          set: listing.set,
          condition: listing.condition,
          askingPrice: listing.price,
        });
      }
    }
  }

  return matches.sort((a, b) => a.distanceMiles - b.distanceMiles);
}
