import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import Colors from '@/constants/Colors';
import { loadDarkMode, saveDarkMode } from '@/lib/themePreference';

type ColorScheme = 'light' | 'dark';

type ThemePreferenceContextValue = {
  darkMode: boolean;
  colorScheme: ColorScheme;
  ready: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const saved = await loadDarkMode();
      if (active) {
        setDarkModeState(saved);
        setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const colorScheme: ColorScheme = darkMode ? 'dark' : 'light';

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.body.style.backgroundColor = Colors[colorScheme].background;
    document.documentElement.style.colorScheme = colorScheme;
  }, [colorScheme]);

  const setDarkMode = useCallback((enabled: boolean) => {
    setDarkModeState(enabled);
    void saveDarkMode(enabled);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkModeState((current) => {
      const next = !current;
      void saveDarkMode(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      darkMode,
      colorScheme,
      ready,
      setDarkMode,
      toggleDarkMode,
    }),
    [darkMode, colorScheme, ready, setDarkMode, toggleDarkMode]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  }
  return context;
}
