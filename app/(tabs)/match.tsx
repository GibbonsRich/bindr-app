import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import CardImage from '@/components/CardImage';
import ConditionBadge from '@/components/ConditionBadge';
import PageHeader from '@/components/PageHeader';
import ScreenNotifications from '@/components/ScreenNotifications';
import TradeMessageModal from '@/components/TradeMessageModal';
import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { findMatchesForWishlist } from '@/lib/collectors';
import { loadWishlist, removeFromWishlist } from '@/lib/storage';
import { useCurrency } from '@/hooks/useCurrency';
import { useMessages } from '@/hooks/useMessages';
import type { CollectorListing, WishlistItem } from '@/types/card';

const RADIUS_OPTIONS = [5, 10, 25, 50];

export default function MatchScreen() {
  const { formatMoney } = useCurrency();
  const { sendTradeMessage } = useMessages();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        setLocationStatus(
          `Near ${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`
        );
      } else {
        setLocationStatus('Location off — showing demo matches');
      }

      setLoading(false);
    })();
  }, []);

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
    const message = `Remove ${item.name} from your wishlist?`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        void handleRemove(item);
      }
      return;
    }

    Alert.alert('Remove from wishlist', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void handleRemove(item);
        },
      },
    ]);
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
          <ActivityIndicator size="large" color={Pokemon.red} />
        </View>
      </ScreenNotifications>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
      <PageHeader
        title="Match"
        description="See which nearby collectors have cards on your wishlist. Filter by distance and compare asking prices."
      />
      {locationStatus ? <Text style={styles.location}>{locationStatus}</Text> : null}

      <View style={styles.radiusRow}>
        {RADIUS_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={[styles.radiusChip, radius === option && styles.radiusChipActive]}
            onPress={() => setRadius(option)}>
            <Text
              style={[styles.radiusText, radius === option && styles.radiusTextActive]}>
              {option} mi
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.wishlistSection}>
        <Text style={styles.sectionTitle}>Your wishlist</Text>
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
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>
        {matches.length} match{matches.length === 1 ? '' : 'es'} within {radius} mi
      </Text>

      {grouped.length === 0 ? (
        <View style={styles.empty} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
          <Text style={styles.emptyTitle}>No matches nearby</Text>
          <Text style={styles.emptySubtitle}>
            Try increasing the radius or add more cards to your wishlist.
          </Text>
        </View>
      ) : (
        grouped.map(([key, listings]) => {
          const [cardName, setName] = key.split('|');
          return (
            <View key={key} style={styles.matchGroup} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
              <View style={styles.matchHeader} lightColor="transparent" darkColor="transparent">
                <CardImage name={cardName} set={setName} size="md" />
                <View style={styles.matchHeaderText} lightColor="transparent" darkColor="transparent">
                  <Text style={styles.matchCardName}>{cardName}</Text>
                  <Text style={styles.matchSet}>{setName}</Text>
                </View>
              </View>
              {listings.map((listing, index) => (
                <View
                  key={`${listing.collectorId}-${index}`}
                  style={styles.listingRow}
                  lightColor="transparent"
                  darkColor="transparent">
                  <View style={styles.listingMeta}>
                    <Text style={styles.collectorName}>{listing.collectorName}</Text>
                    <Text style={styles.distance}>{listing.distanceMiles} mi away</Text>
                  </View>
                  <View style={styles.listingFooter}>
                    <ConditionBadge condition={listing.condition} />
                    <Text style={styles.price}>{formatMoney(listing.askingPrice)}</Text>
                  </View>
                  <Pressable
                    style={[
                      styles.messageButton,
                      sentKeys.has(`${listing.collectorId}|${listing.cardName}|${listing.set}`) &&
                        styles.messageButtonSent,
                    ]}
                    onPress={() => setMessageTarget(listing)}
                    accessibilityRole="button"
                    accessibilityLabel={`Message ${listing.collectorName} about a trade`}>
                    <Text
                      style={[
                        styles.messageButtonText,
                        sentKeys.has(`${listing.collectorId}|${listing.cardName}|${listing.set}`) &&
                          styles.messageButtonTextSent,
                      ]}>
                      {sentKeys.has(`${listing.collectorId}|${listing.cardName}|${listing.set}`)
                        ? 'Message sent'
                        : 'Message about trade'}
                    </Text>
                  </Pressable>
                </View>
              ))}
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
  location: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.5,
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
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 12,
    padding: 14,
  },
  matchHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  matchHeaderText: {
    flex: 1,
  },
  matchCardName: {
    fontSize: 18,
    fontWeight: '800',
  },
  matchSet: {
    fontSize: 13,
    opacity: 0.6,
  },
  listingRow: {
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 10,
  },
  listingMeta: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  collectorName: {
    fontSize: 15,
    fontWeight: '600',
  },
  distance: {
    fontSize: 12,
    opacity: 0.6,
  },
  listingFooter: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  messageButton: {
    alignItems: 'center',
    backgroundColor: Pokemon.blue,
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 10,
  },
  messageButtonSent: {
    backgroundColor: Pokemon.gbLight,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  messageButtonTextSent: {
    color: Pokemon.gbDark,
  },
  empty: {
    borderRadius: 16,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
    opacity: 0.6,
  },
});
