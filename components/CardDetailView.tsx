import { Pressable, ScrollView, StyleSheet } from 'react-native';

import AppHeading from '@/components/AppHeading';
import CardImage from '@/components/CardImage';
import ConditionBadge from '@/components/ConditionBadge';
import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { formatSaleDate, type CardMarketData } from '@/lib/cardMarket';
import type { CardCondition, PokemonCard } from '@/types/card';

type Props = {
  card: PokemonCard;
  market: CardMarketData;
  formatMoney: (amountUsd: number) => string;
  backLabel: string;
  onBack: () => void;
  headerRight?: React.ReactNode;
};

export default function CardDetailView({
  card,
  market,
  formatMoney,
  backLabel,
  onBack,
  headerRight,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow} lightColor="transparent" darkColor="transparent">
        <Pressable onPress={onBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>{backLabel}</Text>
        </Pressable>
        {headerRight}
      </View>

      <AppHeading style={styles.title}>{card.name}</AppHeading>
      <Text style={styles.subtitle}>
        {card.set} · #{card.number} · {card.rarity}
      </Text>

      <View style={styles.yourCopy} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
        <Text style={styles.yourCopyLabel}>Your copy</Text>
        <View style={styles.yourCopyRow} lightColor="transparent" darkColor="transparent">
          <ConditionBadge condition={card.condition} />
          <Text style={styles.yourCopyValue}>{formatMoney(card.estimatedValue)}</Text>
          {card.quantity > 1 ? <Text style={styles.qty}>×{card.quantity}</Text> : null}
        </View>
      </View>

      <AppHeading style={styles.sectionTitle}>Your photos</AppHeading>
      <View style={styles.photoRow} lightColor="transparent" darkColor="transparent">
        <PhotoSlot label="Front" card={card} variant="front" />
        <PhotoSlot label="Back" card={card} variant="back" />
      </View>

      <AppHeading style={styles.sectionTitle}>Average sold price by condition</AppHeading>
      <View style={styles.table} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
        {market.averageByCondition.map((row) => (
          <ConditionPriceRow
            key={row.condition}
            condition={row.condition}
            price={formatMoney(row.averageSold)}
            highlight={row.condition === card.condition}
          />
        ))}
      </View>

      <AppHeading style={styles.sectionTitle}>Last sold</AppHeading>
      <View style={styles.lastSale} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
        <View style={styles.lastSaleTop} lightColor="transparent" darkColor="transparent">
          <Text style={styles.lastSalePrice}>{formatMoney(market.lastSale.price)}</Text>
          <ConditionBadge condition={market.lastSale.condition} />
        </View>
        <Text style={styles.lastSaleDate}>Sold {formatSaleDate(market.lastSale.soldAt)}</Text>
        <Text style={styles.demoNote}>Demo market data for prototyping</Text>
      </View>
    </ScrollView>
  );
}

function PhotoSlot({
  label,
  card,
  variant,
}: {
  label: string;
  card: PokemonCard;
  variant: 'front' | 'back';
}) {
  return (
    <View style={styles.photoSlot} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
      <Text style={styles.photoLabel}>{label}</Text>
      <CardImage
        name={card.name}
        set={card.set}
        imageUri={card.imageUri}
        backImageUri={card.backImageUri}
        size="xl"
        variant={variant}
      />
    </View>
  );
}

function ConditionPriceRow({
  condition,
  price,
  highlight,
}: {
  condition: CardCondition;
  price: string;
  highlight: boolean;
}) {
  return (
    <View
      style={[styles.tableRow, highlight && styles.tableRowHighlight]}
      lightColor={highlight ? Colors.light.surfaceAlt : 'transparent'}
      darkColor={highlight ? Colors.dark.surfaceAlt : 'transparent'}>
      <ConditionBadge condition={condition} />
      <Text style={styles.tablePrice}>{price}</Text>
      {highlight ? <Text style={styles.yoursTag}>Yours</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    paddingTop: 16,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backLink: {
    alignSelf: 'flex-start',
  },
  backLinkText: {
    color: Pokemon.blue,
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    opacity: 0.7,
  },
  yourCopy: {
    borderRadius: 14,
    marginTop: 16,
    padding: 14,
  },
  yourCopyLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  yourCopyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  yourCopyValue: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 'auto',
  },
  qty: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionTitle: {
    marginBottom: 10,
    marginTop: 22,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoSlot: {
    alignItems: 'center',
    borderRadius: 16,
    flex: 1,
    padding: 12,
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    opacity: 0.65,
  },
  table: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 4,
  },
  tableRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableRowHighlight: {
    borderRadius: 12,
  },
  tablePrice: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  yoursTag: {
    color: Pokemon.blue,
    fontSize: 11,
    fontWeight: '700',
  },
  lastSale: {
    borderRadius: 16,
    padding: 16,
  },
  lastSaleTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  lastSalePrice: {
    fontSize: 24,
    fontWeight: '800',
  },
  lastSaleDate: {
    fontSize: 13,
    marginTop: 8,
    opacity: 0.65,
  },
  demoNote: {
    fontSize: 11,
    marginTop: 10,
    opacity: 0.5,
  },
});
