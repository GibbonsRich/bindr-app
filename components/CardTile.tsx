import { Pressable, StyleSheet, View as RNView } from 'react-native';

import ConditionBadge from '@/components/ConditionBadge';
import { Text, View } from '@/components/Themed';
import type { PokemonCard } from '@/types/card';

type Props = {
  card: PokemonCard;
  onPress?: () => void;
  trailing?: React.ReactNode;
};

export default function CardTile({ card, onPress, trailing }: Props) {
  return (
    <RNView style={styles.wrapper}>
      <View style={styles.tile} lightColor="#f8fafc" darkColor="#111827">
        <View style={styles.header}>
          {onPress ? (
            <Pressable
              onPress={onPress}
              style={({ pressed }) => [styles.meta, pressed && styles.pressed]}>
              <CardMeta card={card} />
            </Pressable>
          ) : (
            <View style={styles.meta}>
              <CardMeta card={card} />
            </View>
          )}
          {trailing}
        </View>
        <View style={styles.footer}>
          <ConditionBadge condition={card.condition} />
          <Text style={styles.value}>${card.estimatedValue}</Text>
          {card.quantity > 1 ? <Text style={styles.qty}>×{card.quantity}</Text> : null}
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  meta: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
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
