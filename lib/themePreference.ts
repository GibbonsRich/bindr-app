import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_MODE_KEY = '@bindr/dark-mode';

export async function loadDarkMode(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(DARK_MODE_KEY);
  return raw === 'true';
}

export async function saveDarkMode(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(DARK_MODE_KEY, enabled ? 'true' : 'false');
}
