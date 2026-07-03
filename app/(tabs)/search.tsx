import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import AppHeading from '@/components/AppHeading';
import CardImage from '@/components/CardImage';
import PageHeader from '@/components/PageHeader';
import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useCurrency } from '@/hooks/useCurrency';
import { showSuccess } from '@/lib/alert';
import { searchCards, wishlistKey, type CatalogCard } from '@/lib/cardCatalog';
import { addToWishlist, loadWishlist } from '@/lib/storage';

export default function SearchScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { formatMoney } = useCurrency();
  const [query, setQuery] = useState('');
  const [wishlistKeys, setWishlistKeys] = useState<Set<string>>(new Set());
  const [addingKey, setAddingKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const wishlist = await loadWishlist();
        if (!active) return;
        setWishlistKeys(new Set(wishlist.map((item) => wishlistKey(item.name, item.set))));
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  const results = useMemo(() => searchCards(query), [query]);

  async function handleAddToWishlist(card: CatalogCard) {
    const key = wishlistKey(card.name, card.set);
    if (wishlistKeys.has(key)) return;

    setAddingKey(key);
    try {
      await addToWishlist({
        id: `w-${Date.now()}`,
        name: card.name,
        set: card.set,
        maxPrice: card.marketValue,
        priority: 'medium',
      });
      setWishlistKeys((current) => new Set([...current, key]));
      showSuccess('Added to wishlist', `${card.name} (${card.set}) was added to your wishlist.`);
    } finally {
      setAddingKey(null);
    }
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Search"
        description="Find Pokemon cards and add them to your wishlist for trading with nearby collectors."
      />

      <View
        style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.surface }]}
        lightColor={theme.surface}
        darkColor={theme.surface}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, set, or rarity…"
          placeholderTextColor={scheme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(29,45,94,0.45)'}
          style={[styles.searchInput, { color: theme.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {query.trim().length === 0 ? (
        <View style={styles.empty} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
          <AppHeading style={styles.emptyTitle}>Search the catalog</AppHeading>
          <Text style={styles.emptySubtitle}>
            Try Charizard, Evolving Skies, or Secret Rare to find cards to wish for.
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
          <AppHeading style={styles.emptyTitle}>No cards found</AppHeading>
          <Text style={styles.emptySubtitle}>Try a different name or set.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => wishlistKey(item.name, item.set)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const key = wishlistKey(item.name, item.set);
            const onWishlist = wishlistKeys.has(key);
            const adding = addingKey === key;

            return (
              <View style={styles.resultRow} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
                <CardImage name={item.name} set={item.set} size="md" />
                <View style={styles.resultMeta} lightColor="transparent" darkColor="transparent">
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultSet}>
                    {item.set} · #{item.number} · {item.rarity}
                  </Text>
                  <Text style={styles.resultValue}>Market ~ {formatMoney(item.marketValue)}</Text>
                </View>
                <Pressable
                  style={[
                    styles.addButton,
                    onWishlist && styles.addButtonDone,
                    adding && styles.disabled,
                  ]}
                  onPress={() => handleAddToWishlist(item)}
                  disabled={onWishlist || adding}
                  accessibilityRole="button"
                  accessibilityLabel={
                    onWishlist ? `${item.name} already on wishlist` : `Add ${item.name} to wishlist`
                  }>
                  <Text style={[styles.addButtonText, onWishlist && styles.addButtonTextDone]}>
                    {onWishlist ? 'Added' : adding ? '…' : 'Add'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBar: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  searchIcon: {
    fontSize: 20,
    fontWeight: '700',
    opacity: 0.55,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  list: {
    paddingBottom: 24,
  },
  resultRow: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    padding: 12,
  },
  resultMeta: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultSet: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.65,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  addButton: {
    backgroundColor: Pokemon.blue,
    borderRadius: 10,
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonDone: {
    backgroundColor: Pokemon.gbLight,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  addButtonTextDone: {
    color: Pokemon.gbDark,
  },
  disabled: {
    opacity: 0.6,
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
    lineHeight: 19,
    marginTop: 6,
    opacity: 0.65,
  },
});
