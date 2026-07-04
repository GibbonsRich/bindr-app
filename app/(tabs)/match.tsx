import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';

import Accordion from '@/components/Accordion';
import AppHeading from '@/components/AppHeading';
import CardImage from '@/components/CardImage';
import ConditionBadge from '@/components/ConditionBadge';
import PageHeader from '@/components/PageHeader';
import ScreenNotifications from '@/components/ScreenNotifications';
import TradeMessageModal from '@/components/TradeMessageModal';
import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { confirmAction, pickFromList } from '@/lib/alert';
import { findMatchesForWishlist } from '@/lib/collectors';
import { loadWishlist, removeFromWishlist } from '@/lib/storage';
import {
  loadTradeLocation,
  saveTradeLocation,
  TRADE_LOCATIONS,
} from '@/lib/tradeLocation';
import { useCurrency } from '@/hooks/useCurrency';
import { useMessages } from '@/hooks/useMessages';
import type { CollectorListing, WishlistItem } from '@/types/card';

const RADIUS_OPTIONS = [5, 10, 25, 50];

export default function MatchScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { formatMoney } = useCurrency();
  const { sendTradeMessage } = useMessages();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState('Plymouth, UK');
  const [messageTarget, setMessageTarget] = useState<CollectorListing | null>(null);
  const [sentKeys, setSentKeys] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const items = await loadWishlist();
        if (active) setWishlist(items);
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    (async () => {
      const saved = await loadTradeLocation();
      setLocationLabel(saved);
      setLoading(false);
    })();
  }, []);

  function changeLocation() {
    pickFromList('Change location', [...TRADE_LOCATIONS], (index) => {
      const location = TRADE_LOCATIONS[index];
      setLocationLabel(location);
      void saveTradeLocation(location);
    });
  }

  const matches = useMemo(
    () => findMatchesForWishlist(wishlist, radius),
    [wishlist, radius]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, CollectorListing[]>();
    for (const match of matches) {
      const key = `${match.cardName}|${match.set}`;
      const group = map.get(key) ?? [];
      group.push(match);
      map.set(key, group);
    }
    return Array.from(map.entries());
  }, [matches]);

  async function handleRemove(item: WishlistItem) {
    const updated = await removeFromWishlist(item.id);
    setWishlist(updated);
  }

  function confirmRemove(item: WishlistItem) {
    confirmAction(
      'Remove from wishlist',
      `Remove ${item.name} from your wishlist?`,
      'Remove',
      () => {
        void handleRemove(item);
      }
    );
  }

  async function handleSendMessage(listing: CollectorListing, message: string) {
    const key = `${listing.collectorId}|${listing.cardName}|${listing.set}`;
    setSentKeys((current) => new Set([...current, key]));
    setMessageTarget(null);
    await sendTradeMessage(message, {
      collectorId: listing.collectorId,
      collectorName: listing.collectorName,
      cardName: listing.cardName,
      set: listing.set,
    });
  }

  if (loading) {
    return (
      <ScreenNotifications>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.spinner} />
        </View>
      </ScreenNotifications>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
      <PageHeader
        title="Trade"
        description="See which nearby collectors have cards on your wishlist. Filter by distance and compare asking prices."
      />
      <RNView style={styles.locationRow}>
        <Text style={styles.location}>{locationLabel}</Text>
        <Pressable onPress={changeLocation} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.changeLocation, { color: theme.link }]}>change location</Text>
        </Pressable>
      </RNView>

      <View style={styles.radiusRow}>
        {RADIUS_OPTIONS.map((option) => {
          const active = radius === option;
          return (
          <Pressable
            key={option}
            style={[
              styles.radiusChip,
              { borderColor: active ? theme.action : theme.accent },
              active && { backgroundColor: theme.action },
            ]}
            onPress={() => setRadius(option)}>
            <Text
              style={[
                styles.radiusText,
                { color: active ? theme.actionText : theme.accent },
              ]}>
              {option} mi
            </Text>
          </Pressable>
          );
        })}
      </View>

      <View style={styles.wishlistSection}>
      <Accordion title="Your wishlist" count={wishlist.length} defaultOpen={false}>
        {wishlist.length === 0 ? (
          <View style={styles.wishlistEmpty} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
            <Text style={styles.wishlistEmptyText}>
              No cards on your wishlist yet. Use Search to find cards to track.
            </Text>
          </View>
        ) : (
          wishlist.map((item) => (
            <View key={item.id} style={styles.wishlistItem} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
              <CardImage name={item.name} set={item.set} size="sm" />
              <View style={styles.wishlistText} lightColor="transparent" darkColor="transparent">
                <Text style={styles.wishlistName}>{item.name}</Text>
                <Text style={styles.wishlistMeta}>
                  {item.set}
                  {item.maxPrice ? ` · max ${formatMoney(item.maxPrice)}` : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => confirmRemove(item)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name} from wishlist`}>
                <Text style={[styles.remove, { color: theme.link }]}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
      </Accordion>
      </View>

      <AppHeading style={styles.sectionTitle}>
        {matches.length} trade{matches.length === 1 ? '' : 's'} within {radius} mi
      </AppHeading>

      {grouped.length === 0 ? (
        <View style={styles.empty} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
          <AppHeading style={styles.emptyTitle}>No trades nearby</AppHeading>
          <Text style={styles.emptySubtitle}>
            Try increasing the radius or add more cards to your wishlist.
          </Text>
        </View>
      ) : (
        grouped.map(([key, listings]) => {
          const [cardName, setName] = key.split('|');
          const prices = listings.map((listing) => listing.askingPrice);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const priceRange =
            minPrice === maxPrice
              ? formatMoney(minPrice)
              : `${formatMoney(minPrice)} – ${formatMoney(maxPrice)}`;

          return (
            <View key={key} style={styles.matchGroup} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
              <Accordion
                title={cardName}
                subtitle={setName}
                count={listings.length}
                defaultOpen={false}
                leading={<CardImage name={cardName} set={setName} size="sm" />}
                headerTrailing={
                  <Text style={styles.priceRange} numberOfLines={2}>
                    {priceRange}
                  </Text>
                }>
                {listings.map((listing, index) => {
                  const sent = sentKeys.has(
                    `${listing.collectorId}|${listing.cardName}|${listing.set}`
                  );

                  return (
                    <View
                      key={`${listing.collectorId}-${index}`}
                      style={[
                        styles.listingRow,
                        index > 0 && { borderTopColor: theme.border, ...styles.listingRowDivider },
                      ]}
                      lightColor="transparent"
                      darkColor="transparent">
                      <View style={styles.listingMeta}>
                        <Text style={styles.collectorName}>{listing.collectorName}</Text>
                        <Text style={styles.distance}>{listing.distanceMiles} mi away</Text>
                      </View>
                      <View style={styles.listingFooter}>
                        <ConditionBadge condition={listing.condition} />
                        <Text style={styles.price}>{formatMoney(listing.askingPrice)}</Text>
                        <Pressable
                          style={[
                            styles.messageButton,
                            {
                              backgroundColor: sent ? theme.actionMuted : theme.action,
                              borderColor: sent ? theme.border : 'transparent',
                            },
                          ]}
                          onPress={() => setMessageTarget(listing)}
                          accessibilityRole="button"
                          accessibilityLabel={`Message ${listing.collectorName} about a trade`}>
                          <Text
                            style={[
                              styles.messageButtonText,
                              { color: sent ? theme.actionMutedText : theme.actionText },
                            ]}>
                            {sent ? 'Sent' : 'Message'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </Accordion>
            </View>
          );
        })
      )}
      </ScrollView>

      <TradeMessageModal
        listing={messageTarget}
        formatPrice={formatMoney}
        onClose={() => setMessageTarget(null)}
        onSend={handleSendMessage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    paddingTop: 16,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  location: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.75,
  },
  changeLocation: {
    color: Pokemon.blue,
    fontSize: 13,
    fontWeight: '700',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  radiusChip: {
    borderColor: Pokemon.blue,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  radiusChipActive: {
    backgroundColor: Pokemon.blue,
  },
  radiusText: {
    color: Pokemon.blue,
    fontSize: 13,
    fontWeight: '600',
  },
  radiusTextActive: {
    color: '#fff',
  },
  wishlistSection: {
    marginTop: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    marginTop: 8,
  },
  wishlistItem: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    padding: 12,
  },
  wishlistText: {
    flex: 1,
  },
  wishlistName: {
    fontSize: 15,
    fontWeight: '700',
  },
  wishlistMeta: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.6,
  },
  remove: {
    color: Pokemon.red,
    fontSize: 13,
    fontWeight: '600',
  },
  wishlistEmpty: {
    borderRadius: 12,
    padding: 14,
  },
  wishlistEmptyText: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.7,
    textAlign: 'center',
  },
  matchGroup: {
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
  },
  priceRange: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  listingRow: {
    paddingTop: 0,
  },
  listingRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 12,
  },
  listingMeta: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  collectorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  distance: {
    fontSize: 12,
    opacity: 0.55,
  },
  listingFooter: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 8,
  },
  price: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
  },
  messageButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minWidth: 76,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  messageButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    borderRadius: 16,
    padding: 20,
  },
  emptyTitle: {
    marginBottom: 0,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
    opacity: 0.6,
  },
});
