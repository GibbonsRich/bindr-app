import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';

export default function GlassTabBarBackground() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.rounded,
          {
            backgroundColor: isDark ? 'rgba(15, 56, 15, 0.78)' : 'rgba(255, 248, 231, 0.82)',
            borderColor: isDark ? 'rgba(155, 188, 15, 0.4)' : 'rgba(59, 76, 202, 0.28)',
          },
        ]}
      />
    );
  }

  return (
    <BlurView
      intensity={isDark ? 55 : 72}
      tint={isDark ? 'dark' : 'light'}
      style={[StyleSheet.absoluteFill, styles.rounded]}
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
