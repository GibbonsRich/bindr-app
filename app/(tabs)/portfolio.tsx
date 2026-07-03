import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import CardTile from '@/components/CardTile';
import { Text, View } from '@/components/Themed';
import { loadPortfolio, removeFromPortfolio } from '@/lib/storage';
import type { PokemonCard } from '@/types/card';

export default function PortfolioScreen() {
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const portfolio = await loadPortfolio();
        if (active) {
          setCards(portfolio);
          setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
  const totalValue = cards.reduce(
    (sum, card) => sum + card.estimatedValue * card.quantity,
    0
  );

  async function handleRemove(card: PokemonCard) {
    const updated = await removeFromPortfolio(card.id);
    setCards(updated);
  }

  function confirmRemove(card: PokemonCard) {
    const message = `Remove ${card.name} from your portfolio?`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        void handleRemove(card);
      }
      return;
    }

    Alert.alert('Remove card', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void handleRemove(card);
        },
      },
    ]);
  }
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E3350D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <StatBox label="Unique cards" value={String(cards.length)} />
        <StatBox label="Total copies" value={String(totalCards)} />
        <StatBox label="Est. value" value={`$${totalValue}`} />
      </View>

      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptySubtitle}>
            Scan a card on the Scan tab to start building your portfolio.
          </Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CardTile
              card={item}
              trailing={
                <Pressable
                  onPress={() => confirmRemove(item)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name}`}>                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              }
            />
          )}
        />
      )}
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox} lightColor="#fef2f2" darkColor="#1f2937">
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    borderRadius: 14,
    flex: 1,
    padding: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
  },
  list: {
    paddingBottom: 24,
  },
  remove: {
    color: '#E3350D',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.6,
    textAlign: 'center',
  },
});
