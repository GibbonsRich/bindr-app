import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function GlassTabBarBackground() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const theme = Colors[scheme];

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.rounded,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.82)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : `${theme.border}66`,
          },
        ]}
      />
    );
  }

  return (
    <BlurView
      intensity={isDark ? 55 : 72}
      tint={isDark ? 'dark' : 'light'}
      style={[StyleSheet.absoluteFill, styles.rounded, !isDark && { borderColor: `${theme.border}66`, borderWidth: 1 }]}
    />
  );
}

const styles = StyleSheet.create({
  rounded: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
