import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import CurrencyPicker from '@/components/CurrencyPicker';
import PageHeader from '@/components/PageHeader';
import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { useCurrency } from '@/hooks/useCurrency';
import { loadPortfolio, loadWishlist } from '@/lib/storage';

export default function ProfileScreen() {
  const { currency, setCurrency, formatMoney } = useCurrency();
  const [uniqueCards, setUniqueCards] = useState(0);
  const [totalCopies, setTotalCopies] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const [portfolio, wishlist] = await Promise.all([loadPortfolio(), loadWishlist()]);
        if (!active) return;

        setUniqueCards(portfolio.length);
        setTotalCopies(portfolio.reduce((sum, card) => sum + card.quantity, 0));
        setTotalValue(
          portfolio.reduce((sum, card) => sum + card.estimatedValue * card.quantity, 0)
        );
        setWishlistCount(wishlist.length);
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PageHeader
        title="Profile"
        description="Your trainer profile, collection stats, and app preferences."
      />

      <View style={styles.profileCard} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
        <View style={styles.avatar} lightColor={Pokemon.red} darkColor={Pokemon.red}>
          <Text style={styles.avatarText}>GB</Text>
        </View>
        <View style={styles.profileMeta} lightColor="transparent" darkColor="transparent">
          <Text style={styles.trainerName}>GibbonsRich</Text>
          <Text style={styles.trainerTag}>Pokemon TCG Collector</Text>
          <Text style={styles.memberSince}>Member since 2026</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Collection</Text>
      <View style={styles.statsRow}>
        <StatBox label="Unique cards" value={String(uniqueCards)} />
        <StatBox label="Total copies" value={String(totalCopies)} />
        <StatBox label="Est. value" value={formatMoney(totalValue)} />
      </View>

      <View style={styles.infoRow} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
        <Text style={styles.infoLabel}>Wishlist cards</Text>
        <Text style={styles.infoValue}>{wishlistCount}</Text>
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.prefsCard} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
        <CurrencyPicker value={currency} onChange={setCurrency} />
      </View>

      <View style={styles.demoBox} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
        <Text style={styles.demoText}>
          Demo profile — sign-in and account settings coming in a future release.
        </Text>
      </View>
    </ScrollView>
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
    padding: 16,
    paddingBottom: 40,
    paddingTop: 16,
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 8,
    padding: 16,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 999,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
  },
  trainerName: {
    fontSize: 22,
    fontWeight: '800',
  },
  trainerTag: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.7,
  },
  memberSince: {
    fontSize: 12,
    marginTop: 6,
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    borderRadius: 14,
    flex: 1,
    padding: 12,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
  },
  infoRow: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 14,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  prefsCard: {
    borderRadius: 16,
    padding: 14,
  },
  demoBox: {
    borderRadius: 12,
    marginTop: 20,
    padding: 12,
  },
  demoText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.75,
    textAlign: 'center',
  },
});
