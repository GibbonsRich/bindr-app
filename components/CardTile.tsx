import { Pressable, StyleSheet, View as RNView } from 'react-native';

import CardImage from '@/components/CardImage';
import ConditionBadge from '@/components/ConditionBadge';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { PokemonCard } from '@/types/card';

const CARD_IMAGE_HEIGHT = 100;

type Props = {
  card: PokemonCard;
  onPress?: () => void;
  trailing?: React.ReactNode;
  valueText?: string;
};

export default function CardTile({ card, onPress, trailing, valueText }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  return (
    <RNView style={styles.wrapper}>
      <View
        style={[styles.tile, { borderColor: theme.border }]}
        lightColor={Colors.light.surface}
        darkColor={Colors.dark.surface}>
        <RNView style={styles.row}>
          <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={({ pressed }) => [styles.imagePress, pressed && onPress && styles.pressed]}
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityLabel={onPress ? `View details for ${card.name}` : undefined}>
            <CardImage
              name={card.name}
              set={card.set}
              imageUri={card.imageUri}
              size="md"
            />
          </Pressable>

          <RNView style={styles.content}>
            <RNView style={styles.topRow}>
              <Pressable
                onPress={onPress}
                disabled={!onPress}
                style={({ pressed }) => [
                  styles.titlePress,
                  pressed && onPress && styles.pressed,
                ]}>
                <Text style={styles.name} numberOfLines={1}>
                  {card.name}
                </Text>
              </Pressable>
              {trailing ? <RNView style={styles.trailing}>{trailing}</RNView> : null}
            </RNView>

            <Pressable
              onPress={onPress}
              disabled={!onPress}
              style={({ pressed }) => [pressed && onPress && styles.pressed]}>
              <Text style={styles.subtitle} numberOfLines={2}>
                {card.set} · #{card.number} · {card.rarity}
              </Text>
            </Pressable>

            <RNView style={styles.bottomRow}>
              <Pressable
                onPress={onPress}
                disabled={!onPress}
                style={({ pressed }) => [pressed && onPress && styles.pressed]}>
                <ConditionBadge condition={card.condition} />
              </Pressable>
              <RNView style={styles.priceGroup}>
                <Text style={styles.value}>{valueText ?? `$${card.estimatedValue}`}</Text>
                {card.quantity > 1 ? <Text style={styles.qty}>×{card.quantity}</Text> : null}
              </RNView>
            </RNView>
          </RNView>
        </RNView>
      </View>
    </RNView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  pressed: {
    opacity: 0.85,
  },
  tile: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  imagePress: {
    borderRadius: 8,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 6,
    justifyContent: 'space-between',
    minHeight: CARD_IMAGE_HEIGHT,
    minWidth: 0,
    paddingVertical: 2,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  titlePress: {
    flex: 1,
    minWidth: 0,
  },
  trailing: {
    flexShrink: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.65,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 6,
    marginLeft: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  qty: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.65,
  },
});
