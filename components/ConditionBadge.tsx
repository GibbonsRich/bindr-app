import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { CardCondition } from '@/types/card';

const COLORS: Record<CardCondition, string> = {
  Mint: '#22c55e',
  'Near Mint': '#84cc16',
  Excellent: '#eab308',
  Good: '#f97316',
  Played: '#ef4444',
  Poor: '#991b1b',
};

type Props = {
  condition: CardCondition;
};

export default function ConditionBadge({ condition }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: COLORS[condition] }]}>
      <Text style={styles.text}>{condition}</Text>
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
