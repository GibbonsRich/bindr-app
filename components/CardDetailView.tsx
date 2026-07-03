import { Pressable, ScrollView, StyleSheet } from 'react-native';

import AppHeading from '@/components/AppHeading';
import CardGradePanel from '@/components/CardGradePanel';
import CardImage from '@/components/CardImage';
import CardPriceChart from '@/components/CardPriceChart';
import ConditionBadge from '@/components/ConditionBadge';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getCardGrade } from '@/lib/cardGrade';
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
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const grade = getCardGrade(card);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow} lightColor="transparent" darkColor="transparent">
        <Pressable onPress={onBack} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: theme.link }]}>{backLabel}</Text>
        </Pressable>
        {headerRight}
      </View>

      <AppHeading style={styles.title}>{card.name}</AppHeading>
      <Text style={styles.subtitle}>
        {card.set} · #{card.number} · {card.rarity}
      </Text>

      <View style={styles.photoRow} lightColor="transparent" darkColor="transparent">
        <PhotoSlot label="Front" card={card} variant="front" />
        <PhotoSlot label="Back" card={card} variant="back" />
      </View>

      <CardPriceChart card={card} formatMoney={formatMoney} />

      <AppHeading style={styles.sectionTitle}>Condition grade</AppHeading>
      <View style={styles.gradePanel} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
        <View style={styles.gradeHeader} lightColor="transparent" darkColor="transparent">
          <ConditionBadge condition={card.condition} />
          {!card.grade ? <Text style={styles.estimatedTag}>Estimated from condition</Text> : null}
        </View>
        <CardGradePanel grade={grade} />
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
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  return (
    <View
      style={[styles.tableRow, highlight && styles.tableRowHighlight]}
      lightColor={highlight ? Colors.light.surfaceAlt : 'transparent'}
      darkColor={highlight ? Colors.dark.surfaceAlt : 'transparent'}>
      <ConditionBadge condition={condition} />
      <Text style={styles.tablePrice}>{price}</Text>
      {highlight ? <Text style={[styles.yoursTag, { color: theme.link }]}>Yours</Text> : null}
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
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    marginBottom: 0,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
    opacity: 0.88,
  },
  gradePanel: {
    borderRadius: 16,
    padding: 14,
  },
  gradeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  estimatedTag: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.65,
  },
  sectionTitle: {
    marginBottom: 10,
    marginTop: 22,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
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
