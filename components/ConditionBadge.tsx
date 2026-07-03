import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Pokemon } from '@/constants/Colors';
import type { CardCondition } from '@/types/card';

const LIGHT_COLORS: Record<CardCondition, string> = {
  Mint: Pokemon.gbLight,
  'Near Mint': '#8BAC0F',
  Excellent: Pokemon.yellow,
  Good: '#E8985E',
  Played: Pokemon.red,
  Poor: Pokemon.gbMid,
};

const DARK_COLORS: Record<CardCondition, string> = {
  Mint: '#FFFFFF',
  'Near Mint': '#DDDDDD',
  Excellent: '#CCCCCC',
  Good: '#AAAAAA',
  Played: '#777777',
  Poor: '#555555',
};

const LIGHT_TEXT_COLORS: Partial<Record<CardCondition, string>> = {
  Excellent: Pokemon.navy,
  Mint: Pokemon.gbDark,
  'Near Mint': Pokemon.gbDark,
};

type Props = {
  condition: CardCondition;
};

export default function ConditionBadge({ condition }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const backgroundColor = isDark ? DARK_COLORS[condition] : LIGHT_COLORS[condition];
  const textColor = isDark ? '#000000' : (LIGHT_TEXT_COLORS[condition] ?? '#FFFFFF');

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{condition}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
