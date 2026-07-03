import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View as RNView } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text, View } from '@/components/Themed';
import CurrencyPicker from '@/components/CurrencyPicker';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import type { CurrencyCode } from '@/lib/currency';
import {
  buildPortfolioHistory,
  CHART_RANGES,
  ChartRange,
  getPeriodChange,
} from '@/lib/portfolioHistory';
import type { PokemonCard } from '@/types/card';

type Props = {
  totalValue: number;
  cards: PokemonCard[];
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  formatMoney: (amountUsd: number) => string;
};

const CHART_HEIGHT = 160;
const PADDING = 8;

export default function PortfolioChart({
  totalValue,
  cards,
  currency,
  onCurrencyChange,
  formatMoney,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const [range, setRange] = useState<ChartRange>('1M');
  const [width, setWidth] = useState(0);

  const points = useMemo(
    () => buildPortfolioHistory(totalValue, cards, range),
    [totalValue, cards, range]
  );

  const { delta, percent } = useMemo(() => getPeriodChange(points), [points]);
  const theme = Colors[scheme];
  const isUp = delta >= 0;
  const lineColor = isUp ? theme.chartUp : theme.chartDown;

  const { linePath, areaPath } = useMemo(() => {
    if (width <= 0 || points.length < 2) {
      return { linePath: '', areaPath: '' };
    }

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const innerW = width - PADDING * 2;
    const innerH = CHART_HEIGHT - PADDING * 2;

    const coords = points.map((point, index) => {
      const x = PADDING + (index / (points.length - 1)) * innerW;
      const y = PADDING + innerH - ((point.value - min) / span) * innerH;
      return { x, y };
    });

    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    const area = `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${(PADDING + innerH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(PADDING + innerH).toFixed(1)} Z`;

    return { linePath: line, areaPath: area };
  }, [points, width]);

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.container} lightColor={theme.surface} darkColor={theme.surface}>
      <View style={styles.valueRow} lightColor="transparent" darkColor="transparent">
        <View lightColor="transparent" darkColor="transparent">
          <Text style={styles.label}>Portfolio value</Text>
          <Text style={styles.value}>{formatMoney(totalValue)}</Text>
        </View>
        <Text style={[styles.change, { color: lineColor }]}>
          {isUp ? '+' : ''}
          {percent.toFixed(1)}%
        </Text>
      </View>

      <RNView style={styles.chartWrap} onLayout={onLayout}>
        {width > 0 && linePath ? (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity="0.35" />
                <Stop offset="1" stopColor={lineColor} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>
            <Path d={areaPath} fill="url(#areaFill)" />
            <Path d={linePath} stroke={lineColor} strokeWidth={2.5} fill="none" />
          </Svg>
        ) : null}
      </RNView>

      <View style={styles.rangeRow} lightColor="transparent" darkColor="transparent">
        {CHART_RANGES.map((option) => {
          const active = range === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => setRange(option.key)}
              style={[
                styles.rangeChip,
                active && { backgroundColor: theme.action },
              ]}>
              <Text
                style={[
                  styles.rangeText,
                  active && { color: theme.actionText, opacity: 1 },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <CurrencyPicker value={currency} onChange={onCurrencyChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 14,
  },
  valueRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    opacity: 0.65,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  change: {
    fontSize: 15,
    fontWeight: '700',
  },
  chartWrap: {
    height: CHART_HEIGHT,
    marginBottom: 12,
    width: '100%',
  },
  rangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  rangeChip: {
    borderRadius: 8,
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.65,
    textAlign: 'center',
  },
});
