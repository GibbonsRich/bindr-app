import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CurrencyCode } from '@/lib/currency';
import { isCurrencyCode } from '@/lib/currency';
import type { PokemonCard, WishlistItem } from '@/types/card';

const PORTFOLIO_KEY = '@bindr/portfolio';
const WISHLIST_KEY = '@bindr/wishlist';
const CURRENCY_KEY = '@bindr/currency';

export async function loadPortfolio(): Promise<PokemonCard[]> {
  const raw = await AsyncStorage.getItem(PORTFOLIO_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getPortfolioCard(id: string): Promise<PokemonCard | null> {
  const portfolio = await loadPortfolio();
  return portfolio.find((card) => card.id === id) ?? null;
}

export async function savePortfolio(cards: PokemonCard[]): Promise<void> {
  await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(cards));
}

export async function addToPortfolio(card: PokemonCard): Promise<PokemonCard[]> {
  const portfolio = await loadPortfolio();
  const existing = portfolio.find(
    (item) => item.name === card.name && item.set === card.set && item.condition === card.condition
  );

  if (existing) {
    existing.quantity += card.quantity;
    existing.estimatedValue = card.estimatedValue;
    if (card.imageUri) existing.imageUri = card.imageUri;
    if (card.backImageUri) existing.backImageUri = card.backImageUri;
  } else {
    portfolio.unshift(card);
  }

  await savePortfolio(portfolio);
  return portfolio;
}

export async function removeFromPortfolio(id: string): Promise<PokemonCard[]> {
  const portfolio = (await loadPortfolio()).filter((card) => card.id !== id);
  await savePortfolio(portfolio);
  return portfolio;
}

export async function loadWishlist(): Promise<WishlistItem[]> {
  const raw = await AsyncStorage.getItem(WISHLIST_KEY);
  if (raw) return JSON.parse(raw);

  const seed: WishlistItem[] = [
    { id: 'w1', name: 'Charizard', set: 'Base Set', maxPrice: 350, priority: 'high' },
    { id: 'w2', name: 'Umbreon VMAX', set: 'Evolving Skies', maxPrice: 280, priority: 'high' },
    { id: 'w3', name: 'Pikachu Illustrator', set: 'Promo', maxPrice: 5000, priority: 'low' },
  ];
  await saveWishlist(seed);
  return seed;
}

export async function saveWishlist(items: WishlistItem[]): Promise<void> {
  await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

export async function addToWishlist(item: WishlistItem): Promise<WishlistItem[]> {
  const wishlist = await loadWishlist();
  const exists = wishlist.some(
    (existing) => existing.name === item.name && existing.set === item.set
  );
  if (exists) return wishlist;

  wishlist.unshift(item);
  await saveWishlist(wishlist);
  return wishlist;
}

export async function removeFromWishlist(id: string): Promise<WishlistItem[]> {
  const wishlist = (await loadWishlist()).filter((item) => item.id !== id);
  await saveWishlist(wishlist);
  return wishlist;
}

export async function loadCurrency(): Promise<CurrencyCode> {
  const raw = await AsyncStorage.getItem(CURRENCY_KEY);
  if (raw && isCurrencyCode(raw)) return raw;
  return 'USD';
}

export async function saveCurrency(code: CurrencyCode): Promise<void> {
  await AsyncStorage.setItem(CURRENCY_KEY, code);
}
