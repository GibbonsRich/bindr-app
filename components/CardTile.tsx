import { Pressable, StyleSheet, View as RNView } from 'react-native';

import CardImage from '@/components/CardImage';
import ConditionBadge from '@/components/ConditionBadge';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import type { PokemonCard } from '@/types/card';

type Props = {
  card: PokemonCard;
  onPress?: () => void;
  trailing?: React.ReactNode;
  valueText?: string;
};

export default function CardTile({ card, onPress, trailing, valueText }: Props) {
  return (
    <RNView style={styles.wrapper}>
      <View style={styles.tile} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
        <View style={styles.row}>
          {onPress ? (
            <Pressable
              onPress={onPress}
              style={({ pressed }) => [styles.imagePress, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`View details for ${card.name}`}>
              <CardImage
                name={card.name}
                set={card.set}
                imageUri={card.imageUri}
                size="md"
              />
            </Pressable>
          ) : (
            <CardImage
              name={card.name}
              set={card.set}
              imageUri={card.imageUri}
              size="md"
            />
          )}
          <View style={styles.content}>
            <View style={styles.header}>
              {onPress ? (
                <Pressable
                  onPress={onPress}
                  style={({ pressed }) => [styles.meta, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${card.name}`}>
                  <CardMeta card={card} />
                </Pressable>
              ) : (
                <View style={styles.meta}>
                  <CardMeta card={card} />
                </View>
              )}
              {trailing}
            </View>
            {onPress ? (
              <Pressable
                onPress={onPress}
                style={({ pressed }) => [pressed && styles.pressed]}
                accessibilityRole="button">
                <View style={styles.footer}>
                  <ConditionBadge condition={card.condition} />
                  <Text style={styles.value}>{valueText ?? `$${card.estimatedValue}`}</Text>
                  {card.quantity > 1 ? <Text style={styles.qty}>×{card.quantity}</Text> : null}
                </View>
              </Pressable>
            ) : (
              <View style={styles.footer}>
                <ConditionBadge condition={card.condition} />
                <Text style={styles.value}>{valueText ?? `$${card.estimatedValue}`}</Text>
                {card.quantity > 1 ? <Text style={styles.qty}>×{card.quantity}</Text> : null}
              </View>
            )}
          </View>
        </View>
      </View>
    </RNView>
  );
}

function CardMeta({ card }: { card: PokemonCard }) {
  return (
    <>
      <Text style={styles.name}>{card.name}</Text>
      <Text style={styles.subtitle}>
        {card.set} · #{card.number} · {card.rarity}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  tile: {
    borderRadius: 16,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePress: {
    borderRadius: 8,
  },
  content: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  meta: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  qty: {
    fontSize: 13,
    opacity: 0.7,
  },
});
