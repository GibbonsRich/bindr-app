import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_TRADE_LOCATION = 'Plymouth, UK';

export const TRADE_LOCATIONS = [
  'Plymouth, UK',
  'London, UK',
  'Manchester, UK',
  'Bristol, UK',
  'Edinburgh, UK',
] as const;

const TRADE_LOCATION_KEY = '@bindr/trade-location';

export async function loadTradeLocation(): Promise<string> {
  const saved = await AsyncStorage.getItem(TRADE_LOCATION_KEY);
  if (saved && TRADE_LOCATIONS.includes(saved as (typeof TRADE_LOCATIONS)[number])) {
    return saved;
  }
  return DEFAULT_TRADE_LOCATION;
}

export async function saveTradeLocation(location: string): Promise<void> {
  await AsyncStorage.setItem(TRADE_LOCATION_KEY, location);
}
