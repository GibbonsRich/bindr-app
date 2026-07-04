import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CURRENCIES, CurrencyCode } from '@/lib/currency';

type Props = {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
};

export default function CurrencyPicker({ value, onChange }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

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
              style={[
                styles.chip,
                { borderColor: theme.border, borderWidth: active ? 0 : 1 },
                active && { backgroundColor: theme.action },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${option.label}, ${option.code}`}>
              <Text
                style={[
                  styles.chipText,
                  active && { color: theme.actionText, opacity: 1 },
                ]}>
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
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.65,
  },
});
