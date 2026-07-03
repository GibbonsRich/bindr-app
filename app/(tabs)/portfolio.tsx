import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import AppHeading from '@/components/AppHeading';
import CardTile from '@/components/CardTile';
import PageHeader from '@/components/PageHeader';
import PortfolioChart from '@/components/PortfolioChart';
import ScreenNotifications from '@/components/ScreenNotifications';
import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { useCurrency } from '@/hooks/useCurrency';
import { confirmAction } from '@/lib/alert';
import { loadPortfolio, removeFromPortfolio } from '@/lib/storage';
import type { PokemonCard } from '@/types/card';

export default function PortfolioScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency, setCurrency, formatMoney } = useCurrency();

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
    confirmAction('Remove card', `Remove ${card.name} from your portfolio?`, 'Remove', () => {
      void handleRemove(card);
    });
  }

  if (loading) {
    return (
      <ScreenNotifications>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Pokemon.red} />
        </View>
      </ScreenNotifications>
    );
  }

  const listHeader = (
    <>
      <PageHeader
        title="Portfolio"
        description="Your personal card collection. Track cards, conditions, copies, and estimated total value."
      />
      <PortfolioChart
        totalValue={totalValue}
        cards={cards}
        currency={currency}
        onCurrencyChange={setCurrency}
        formatMoney={formatMoney}
      />
      <View style={styles.statsRow}>
        <StatBox label="Unique cards" value={String(cards.length)} />
        <StatBox label="Total copies" value={String(totalCards)} />
        <StatBox label="Est. value" value={formatMoney(totalValue)} />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {cards.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {listHeader}
              <View style={styles.empty}>
                <AppHeading style={styles.emptyTitle}>No cards yet</AppHeading>
                <Text style={styles.emptySubtitle}>
                  Scan a card on the Scan tab to start building your portfolio.
                </Text>
              </View>
            </>
          }
        />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <CardTile
              card={item}
              valueText={formatMoney(item.estimatedValue)}
              onPress={() => router.push(`/portfolio/${item.id}`)}
              trailing={
                <Pressable
                  onPress={() => confirmRemove(item)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name}`}>
                  <Text style={styles.remove}>Remove</Text>
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
    <View style={styles.statBox} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
    color: Pokemon.red,
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  emptyTitle: {
    marginBottom: 0,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.6,
    textAlign: 'center',
  },
});
