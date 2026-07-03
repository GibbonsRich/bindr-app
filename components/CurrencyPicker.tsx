import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Pokemon } from '@/constants/Colors';
import { CURRENCIES, CurrencyCode } from '@/lib/currency';

type Props = {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
};

export default function CurrencyPicker({ value, onChange }: Props) {
  return (
    <View style={styles.wrap} lightColor="transparent" darkColor="transparent">
      <Text style={styles.label}>Currency</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {CURRENCIES.map((option) => {
          const active = value === option.code;
          return (
            <Pressable
              key={option.code}
              onPress={() => onChange(option.code)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${option.label}, ${option.code}`}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.code}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    opacity: 0.55,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 4,
  },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: Pokemon.blue,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.65,
  },
  chipTextActive: {
    color: '#fff',
    opacity: 1,
  },
});
