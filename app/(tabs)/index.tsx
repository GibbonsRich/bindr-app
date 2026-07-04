import { Link, useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';

import AppHeading from '@/components/AppHeading';
import CardImage from '@/components/CardImage';
import PageHeader from '@/components/PageHeader';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCurrency } from '@/hooks/useCurrency';
import { showAlert } from '@/lib/alert';
import { loadPortfolio, loadWishlist } from '@/lib/storage';
import type { PokemonCard } from '@/types/card';

type IconName = {
  ios: string;
  android: string;
  web: string;
};

const QUICK_ACTIONS: {
  title: string;
  subtitle: string;
  href: '/search' | '/scan' | '/portfolio' | '/match';
  icon: IconName;
}[] = [
  {
    title: 'Search',
    subtitle: 'Find cards',
    href: '/search',
    icon: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  },
  {
    title: 'Scan',
    subtitle: 'Grade & value',
    href: '/scan',
    icon: { ios: 'camera.viewfinder', android: 'camera', web: 'camera' },
  },
  {
    title: 'Portfolio',
    subtitle: 'Your collection',
    href: '/portfolio',
    icon: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' },
  },
  {
    title: 'Trade',
    subtitle: 'Nearby swaps',
    href: '/match',
    icon: { ios: 'location.fill', android: 'location_on', web: 'location_on' },
  },
];

const HIGHLIGHTS = [
  {
    title: 'Scan & grade',
    body: 'Photograph front and back — get condition scores, market value, and save to your binder.',
    icon: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' } as IconName,
  },
  {
    title: 'Live portfolio charts',
    body: 'Track collection value over time with stock-style graphs on every card.',
    icon: { ios: 'chart.xyaxis.line', android: 'show_chart', web: 'show_chart' } as IconName,
  },
  {
    title: 'Wishlist → trade',
    body: 'Match your want list with collectors near you and message about trades in-app.',
    icon: { ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' } as IconName,
  },
];

const PLUS_FEATURES = [
  'Unlimited card scans & condition grading',
  'Price alerts when wishlist cards dip',
  'Extended trade radius & priority listings',
  'Full price history on every card',
  'Export portfolio reports',
];

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { formatMoney } = useCurrency();
  const [cardCount, setCardCount] = useState(0);
  const [collectionValue, setCollectionValue] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [topCard, setTopCard] = useState<PokemonCard | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const [portfolio, wishlist] = await Promise.all([loadPortfolio(), loadWishlist()]);
        if (!active) return;

        setCardCount(portfolio.reduce((sum, card) => sum + card.quantity, 0));
        setCollectionValue(
          portfolio.reduce((sum, card) => sum + card.estimatedValue * card.quantity, 0)
        );
        setWishlistCount(wishlist.length);
        setTopCard(
          portfolio.reduce<PokemonCard | null>((best, card) => {
            if (!best || card.estimatedValue > best.estimatedValue) return card;
            return best;
          }, null)
        );
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  function handlePlusPress() {
    showAlert(
      'Bindr Plus',
      'Subscriptions are coming soon. You are previewing Plus features in this demo build.'
    );
  }

  const hasCollection = cardCount > 0;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <PageHeader
        title="Bindr"
        tagline="what's in your bindr?"
        description="Scan, track, and trade Pokemon cards — all from your pocket."
      />

      <View style={styles.hero} lightColor={theme.surface} darkColor={theme.surface}>
        <RNView style={styles.heroRow}>
          <Pressable
            onPress={() => router.push(hasCollection ? '/portfolio' : '/scan')}
            style={({ pressed }) => [styles.heroCopy, pressed && styles.pressed]}>
            <RNView style={[styles.heroBadge, { backgroundColor: theme.actionMuted }]}>
              <Text style={[styles.heroBadgeText, { color: theme.actionMutedText }]}>
                {hasCollection ? 'Your collection' : 'Get started'}
              </Text>
            </RNView>
            <AppHeading style={styles.heroTitle}>
              {hasCollection ? formatMoney(collectionValue) : 'Build your digital binder'}
            </AppHeading>
            <Text style={styles.heroSubtitle}>
              {hasCollection
                ? `${cardCount} card${cardCount === 1 ? '' : 's'} tracked · ${wishlistCount} on wishlist`
                : 'Scan a card to grade condition, estimate value, and add it to your portfolio.'}
            </Text>
            <RNView style={[styles.heroCta, { backgroundColor: theme.action }]}>
              <Text style={[styles.heroCtaText, { color: theme.actionText }]}>
                {hasCollection ? 'Open portfolio' : 'Scan your first card'}
              </Text>
              <SymbolView
                name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                tintColor={theme.actionText}
                size={16}
              />
            </RNView>
          </Pressable>

          {hasCollection && topCard ? (
            <Pressable
              onPress={() => router.push(`/portfolio/${topCard.id}`)}
              style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`View ${topCard.name}, top card in your portfolio`}>
              <CardImage
                name={topCard.name}
                set={topCard.set}
                imageUri={topCard.imageUri}
                size="md"
              />
              <Text style={styles.heroCardName} numberOfLines={1}>
                {topCard.name}
              </Text>
              <Text style={styles.heroCardValue}>{formatMoney(topCard.estimatedValue)}</Text>
            </Pressable>
          ) : null}
        </RNView>
      </View>

      <Text style={[styles.sectionLabel, styles.quickSectionLabel]}>Quick actions</Text>
      <View style={styles.quickGrid} lightColor="transparent" darkColor="transparent">
        <RNView style={styles.quickRow}>
          {QUICK_ACTIONS.slice(0, 2).map((action) => (
            <QuickActionTile key={action.href} action={action} theme={theme} />
          ))}
        </RNView>
        <RNView style={styles.quickRow}>
          {QUICK_ACTIONS.slice(2, 4).map((action) => (
            <QuickActionTile key={action.href} action={action} theme={theme} />
          ))}
        </RNView>
      </View>

      <Text style={styles.sectionLabel}>Why Bindr</Text>
      {HIGHLIGHTS.map((item) => (
        <View
          key={item.title}
          style={styles.highlightRow}
          lightColor={theme.surface}
          darkColor={theme.surface}>
          <RNView style={[styles.highlightIcon, { backgroundColor: theme.surfaceAlt }]}>
            <SymbolView name={item.icon} tintColor={theme.tint} size={20} />
          </RNView>
          <View style={styles.highlightText} lightColor="transparent" darkColor="transparent">
            <Text style={styles.highlightTitle}>{item.title}</Text>
            <Text style={styles.highlightBody}>{item.body}</Text>
          </View>
        </View>
      ))}

      <View style={styles.plusCard} lightColor={theme.surfaceAlt} darkColor={theme.surfaceAlt}>
        <RNView style={styles.plusHeader}>
          <RNView style={[styles.plusPill, { backgroundColor: theme.action }]}>
            <Text style={[styles.plusPillText, { color: theme.actionText }]}>Bindr Plus</Text>
          </RNView>
          <Text style={styles.plusPrice}>£4.99/mo</Text>
        </RNView>
        <Text style={styles.plusLead}>
          Go beyond the free demo — unlock pro tools for serious collectors and traders.
        </Text>
        {PLUS_FEATURES.map((feature) => (
          <RNView key={feature} style={styles.plusFeatureRow}>
            <SymbolView
              name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
              tintColor={theme.tint}
              size={18}
            />
            <Text style={styles.plusFeatureText}>{feature}</Text>
          </RNView>
        ))}
        <Pressable
          onPress={handlePlusPress}
          style={({ pressed }) => [
            styles.plusButton,
            { backgroundColor: theme.action, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.plusButtonText, { color: theme.actionText }]}>
            Preview Plus features
          </Text>
        </Pressable>
        <Text style={styles.plusFootnote}>Demo build — no payment required</Text>
      </View>
    </ScrollView>
  );
}

function QuickActionTile({
  action,
  theme,
}: {
  action: (typeof QUICK_ACTIONS)[number];
  theme: (typeof Colors)['light'];
}) {
  return (
    <RNView style={styles.quickTile}>
      <Link href={action.href} asChild>
        <Pressable style={({ pressed }) => [styles.quickTilePressable, pressed && styles.pressed]}>
          <View style={styles.quickTileInner} lightColor={theme.surface} darkColor={theme.surface}>
            <RNView style={[styles.quickIcon, { backgroundColor: theme.surfaceAlt }]}>
              <SymbolView name={action.icon} tintColor={theme.tint} size={20} />
            </RNView>
            <View style={styles.quickCopy} lightColor="transparent" darkColor="transparent">
              <Text style={styles.quickTitle}>{action.title}</Text>
              <Text style={styles.quickSubtitle}>{action.subtitle}</Text>
            </View>
          </View>
        </Pressable>
      </Link>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 48,
    paddingTop: 16,
  },
  pressed: {
    opacity: 0.88,
  },
  hero: {
    borderRadius: 20,
    marginBottom: 28,
    padding: 20,
  },
  heroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroCard: {
    alignItems: 'center',
    flexShrink: 0,
    maxWidth: 88,
  },
  heroCardName: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    opacity: 0.85,
    textAlign: 'center',
  },
  heroCardValue: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    opacity: 0.72,
    textAlign: 'center',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 28,
    marginBottom: 0,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    opacity: 0.72,
  },
  heroCta: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroCtaText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 12,
    opacity: 0.55,
    textTransform: 'uppercase',
  },
  quickSectionLabel: {
    marginBottom: 14,
  },
  quickGrid: {
    gap: 10,
    marginBottom: 28,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickTile: {
    flex: 1,
  },
  quickTilePressable: {
    flex: 1,
    width: '100%',
  },
  quickTileInner: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  quickIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  quickCopy: {
    flex: 1,
    justifyContent: 'center',
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  quickSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
    opacity: 0.6,
  },
  highlightRow: {
    alignItems: 'flex-start',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
    padding: 14,
  },
  highlightIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  highlightText: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  highlightBody: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    opacity: 0.72,
  },
  plusCard: {
    borderRadius: 20,
    marginTop: 18,
    padding: 18,
  },
  plusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  plusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  plusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  plusPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  plusLead: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
    opacity: 0.8,
  },
  plusFeatureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  plusFeatureText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  plusButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingVertical: 13,
  },
  plusButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  plusFootnote: {
    fontSize: 11,
    marginTop: 10,
    opacity: 0.5,
    textAlign: 'center',
  },
});
