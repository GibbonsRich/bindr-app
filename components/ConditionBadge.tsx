import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { Pokemon } from '@/constants/Colors';
import type { CardCondition } from '@/types/card';

const COLORS: Record<CardCondition, string> = {
  Mint: Pokemon.gbLight,
  'Near Mint': '#8BAC0F',
  Excellent: Pokemon.yellow,
  Good: '#E8985E',
  Played: Pokemon.red,
  Poor: Pokemon.gbMid,
};

const TEXT_COLORS: Partial<Record<CardCondition, string>> = {
  Excellent: Pokemon.navy,
  Mint: Pokemon.gbDark,
  'Near Mint': Pokemon.gbDark,
};

type Props = {
  condition: CardCondition;
};

export default function ConditionBadge({ condition }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: COLORS[condition] }]}>
      <Text style={[styles.text, TEXT_COLORS[condition] ? { color: TEXT_COLORS[condition] } : null]}>
        {condition}
      </Text>
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
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
