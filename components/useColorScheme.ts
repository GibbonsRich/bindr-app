import { useThemePreference } from '@/hooks/useThemePreference';

export function useColorScheme() {
  return useThemePreference().colorScheme;
}
