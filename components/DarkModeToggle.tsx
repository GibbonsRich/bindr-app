import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useThemePreference } from '@/hooks/useThemePreference';

export default function DarkModeToggle() {
  const scheme = useColorScheme();
  const { darkMode, toggleDarkMode } = useThemePreference();
  const tint = Colors[scheme].tint;

  return (
    <Pressable
      onPress={toggleDarkMode}
      style={styles.button}
      accessibilityRole="switch"
      accessibilityState={{ checked: darkMode }}
      accessibilityLabel={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
      <SymbolView
        name={{
          ios: darkMode ? 'sun.max.fill' : 'moon.fill',
          android: darkMode ? 'light_mode' : 'dark_mode',
          web: darkMode ? 'light_mode' : 'dark_mode',
        }}
        tintColor={tint}
        size={24}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
