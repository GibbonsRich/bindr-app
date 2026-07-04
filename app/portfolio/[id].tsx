import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import AppHeading from '@/components/AppHeading';
import CardDetailView from '@/components/CardDetailView';
import HeaderActions from '@/components/HeaderActions';
import ScreenNotifications from '@/components/ScreenNotifications';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useCurrency } from '@/hooks/useCurrency';
import { getCardMarketData } from '@/lib/cardMarket';
import { getScanPreviewCard } from '@/lib/scanPreview';
import { getPortfolioCard } from '@/lib/storage';
import type { PokemonCard } from '@/types/card';

export default function PortfolioCardDetailScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { formatMoney } = useCurrency();
  const [card, setCard] = useState<PokemonCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      if (!id) {
        if (active) {
          setCard(null);
          setLoading(false);
        }
        return;
      }

      const portfolioCard = await getPortfolioCard(id);
      const previewCard = getScanPreviewCard(id);
      const found = portfolioCard ?? previewCard;

      if (active) {
        setCard(found);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  const market = useMemo(() => (card ? getCardMarketData(card) : null), [card]);
  const backLabel = from === 'scan' ? '← Scan' : '← Portfolio';

  if (loading) {
    return (
      <ScreenNotifications>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.spinner} />
        </View>
      </ScreenNotifications>
    );
  }

  if (!card || !market) {
    return (
      <ScreenNotifications>
        <View style={styles.centered}>
          <AppHeading style={styles.emptyTitle}>Card not found</AppHeading>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.action }]}>
            <Text style={[styles.backButtonText, { color: theme.actionText }]}>Go back</Text>
          </Pressable>
        </View>
      </ScreenNotifications>
    );
  }

  return (
    <CardDetailView
      card={card}
      market={market}
      formatMoney={formatMoney}
      backLabel={backLabel}
      onBack={() => router.back()}
      headerRight={<HeaderActions />}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    fontWeight: '700',
  },
});
