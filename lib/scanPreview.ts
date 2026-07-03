import type { PokemonCard } from '@/types/card';

const previews = new Map<string, PokemonCard>();

export function setScanPreviewCard(id: string, card: PokemonCard): void {
  previews.set(id, card);
}

export function getScanPreviewCard(id: string): PokemonCard | null {
  return previews.get(id) ?? null;
}

export function clearScanPreviewCard(id: string): void {
  previews.delete(id);
}

export function createScanPreviewId(): string {
  return `scan-${Date.now()}`;
}
