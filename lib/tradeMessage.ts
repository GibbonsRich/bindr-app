import type { CollectorListing } from '@/types/card';

export function buildTradeMessage(
  listing: CollectorListing,
  formatPrice: (amountUsd: number) => string
): string {
  return (
    `Hi ${listing.collectorName}, I saw your ${listing.cardName} (${listing.set}) ` +
    `listed in ${listing.condition} condition for ${formatPrice(listing.askingPrice)}. ` +
    `Would you be open to a trade? I have cards in my Bindr portfolio I'd be happy to swap.`
  );
}
