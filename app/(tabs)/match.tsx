import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import ConditionBadge from '@/components/ConditionBadge';
import { Text, View } from '@/components/Themed';
import { findMatchesForWishlist } from '@/lib/collectors';
import { loadWishlist } from '@/lib/storage';
import type { CollectorListing, WishlistItem } from '@/types/card';

const RADIUS_OPTIONS = [5, 10, 25, 50];

export default function MatchScreen() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const items = await loadWishlist();
      setWishlist(items);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E3350D" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Wishlist Match</Text>
      <Text style={styles.subtitle}>
        Cross-reference your wishlist with nearby collectors.
      </Text>
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
        {wishlist.map((item) => (
          <View key={item.id} style={styles.wishlistItem} lightColor="#f8fafc" darkColor="#111827">
            <Text style={styles.wishlistName}>{item.name}</Text>
            <Text style={styles.wishlistMeta}>
              {item.set}
              {item.maxPrice ? ` · max $${item.maxPrice}` : ''}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        {matches.length} match{matches.length === 1 ? '' : 'es'} within {radius} mi
      </Text>

      {grouped.length === 0 ? (
        <View style={styles.empty} lightColor="#fef2f2" darkColor="#1f2937">
          <Text style={styles.emptyTitle}>No matches nearby</Text>
          <Text style={styles.emptySubtitle}>
            Try increasing the radius or add more cards to your wishlist.
          </Text>
        </View>
      ) : (
        grouped.map(([key, listings]) => {
          const [cardName, setName] = key.split('|');
          return (
            <View key={key} style={styles.matchGroup} lightColor="#fef2f2" darkColor="#1f2937">
              <Text style={styles.matchCardName}>{cardName}</Text>
              <Text style={styles.matchSet}>{setName}</Text>
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
                    <Text style={styles.price}>${listing.askingPrice}</Text>
                  </View>
                </View>
              ))}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    opacity: 0.7,
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
    borderColor: '#E3350D',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  radiusChipActive: {
    backgroundColor: '#E3350D',
  },
  radiusText: {
    color: '#E3350D',
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
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
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
  matchGroup: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
  },
  matchCardName: {
    fontSize: 18,
    fontWeight: '800',
  },
  matchSet: {
    fontSize: 13,
    marginBottom: 10,
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
