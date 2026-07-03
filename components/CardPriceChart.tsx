import { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View as RNView,
} from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  buildCardPriceHistory,
  CHART_RANGES,
  ChartRange,
  type ChartPoint,
  getPeriodChange,
} from '@/lib/portfolioHistory';
import type { PokemonCard } from '@/types/card';

type Props = {
  card: PokemonCard;
  formatMoney: (amountUsd: number) => string;
};

const CHART_HEIGHT = 160;
const PADDING = 8;

type ChartCoord = ChartPoint & {
  x: number;
  y: number;
  index: number;
};

function formatChartHoverDate(timestamp: number, range: ChartRange): string {
  const date = new Date(timestamp);

  if (range === '1D') {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: range === 'ALL' || range === '6M' ? 'numeric' : undefined,
  });
}

function indexFromX(x: number, width: number, pointCount: number): number {
  const innerW = Math.max(width - PADDING * 2, 1);
  const relativeX = Math.max(0, Math.min(innerW, x - PADDING));
  const ratio = relativeX / innerW;
  return Math.round(ratio * (pointCount - 1));
}

function percentChange(from: number, to: number): number {
  if (from === 0) return to > 0 ? 100 : 0;
  return ((to - from) / from) * 100;
}

export default function CardPriceChart({ card, formatMoney }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const [range, setRange] = useState<ChartRange>('1M');
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const points = useMemo(() => buildCardPriceHistory(card, range), [card, range]);

  const { percent } = useMemo(() => getPeriodChange(points), [points]);
  const isUp = percent >= 0;
  const lineColor = isUp ? theme.chartUp : theme.chartDown;

  const chart = useMemo(() => {
    if (width <= 0 || points.length < 2) {
      return { linePath: '', areaPath: '', coords: [] as ChartCoord[] };
    }

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const innerW = width - PADDING * 2;
    const innerH = CHART_HEIGHT - PADDING * 2;

    const coords: ChartCoord[] = points.map((point, index) => {
      const x = PADDING + (index / (points.length - 1)) * innerW;
      const y = PADDING + innerH - ((point.value - min) / span) * innerH;
      return { ...point, x, y, index };
    });

    const line = coords
      .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`)
      .join(' ');
    const area = `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${(PADDING + innerH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(PADDING + innerH).toFixed(1)} Z`;

    return { linePath: line, areaPath: area, coords };
  }, [points, width]);

  const displayIndex = activeIndex ?? points.length - 1;
  const displayPoint = points[displayIndex] ?? points[points.length - 1];
  const activeCoord = chart.coords[displayIndex];
  const isScrubbing = activeIndex !== null;
  const scrubPercent = percentChange(points[0]?.value ?? 0, displayPoint?.value ?? 0);
  const scrubIsUp = scrubPercent >= 0;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => Platform.OS !== 'web',
        onMoveShouldSetPanResponder: () => Platform.OS !== 'web',
        onPanResponderGrant: (event) => {
          if (width <= 0 || points.length < 2) return;
          setActiveIndex(indexFromX(event.nativeEvent.locationX, width, points.length));
        },
        onPanResponderMove: (event) => {
          if (width <= 0 || points.length < 2) return;
          setActiveIndex(indexFromX(event.nativeEvent.locationX, width, points.length));
        },
        onPanResponderRelease: () => setActiveIndex(null),
        onPanResponderTerminate: () => setActiveIndex(null),
      }),
    [width, points.length]
  );

  function scrubAt(x: number) {
    if (width <= 0 || points.length < 2) return;
    setActiveIndex(indexFromX(x, width, points.length));
  }

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  function changeRange(next: ChartRange) {
    setActiveIndex(null);
    setRange(next);
  }

  const headerLabel = isScrubbing
    ? formatChartHoverDate(displayPoint.timestamp, range)
    : 'Market value';
  const headerValue = formatMoney(displayPoint?.value ?? card.estimatedValue);
  const headerChange = isScrubbing ? scrubPercent : percent;
  const headerChangeUp = isScrubbing ? scrubIsUp : isUp;

  return (
    <View style={styles.container} lightColor={theme.surface} darkColor={theme.surface}>
      <View style={styles.valueRow} lightColor="transparent" darkColor="transparent">
        <View lightColor="transparent" darkColor="transparent">
          <Text style={styles.label}>{headerLabel}</Text>
          <Text style={styles.value}>{headerValue}</Text>
        </View>
        <Text style={[styles.change, { color: headerChangeUp ? lineColor : theme.chartDown }]}>
          {headerChangeUp ? '+' : ''}
          {headerChange.toFixed(1)}%
        </Text>
      </View>

      <RNView
        style={styles.chartWrap}
        onLayout={onLayout}
        {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
        {...(Platform.OS === 'web'
          ? {
              onPointerMove: (event: { nativeEvent: { offsetX?: number; locationX?: number } }) => {
                scrubAt(event.nativeEvent.offsetX ?? event.nativeEvent.locationX ?? 0);
              },
              onPointerLeave: () => setActiveIndex(null),
            }
          : {})}>
        {width > 0 && chart.linePath ? (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id={`cardAreaFill-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity="0.35" />
                <Stop offset="1" stopColor={lineColor} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>
            <Path d={chart.areaPath} fill={`url(#cardAreaFill-${card.id})`} />
            <Path d={chart.linePath} stroke={lineColor} strokeWidth={2.5} fill="none" />
            {isScrubbing && activeCoord ? (
              <>
                <Line
                  x1={activeCoord.x}
                  x2={activeCoord.x}
                  y1={PADDING}
                  y2={CHART_HEIGHT - PADDING}
                  stroke={theme.border}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.8}
                />
                <Circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r={5}
                  fill={lineColor}
                  stroke={theme.background}
                  strokeWidth={2}
                />
              </>
            ) : null}
          </Svg>
        ) : null}

        {isScrubbing && activeCoord ? (
          <RNView
            pointerEvents="none"
            style={[
              styles.tooltip,
              {
                left: Math.max(8, Math.min(width - 128, activeCoord.x - 64)),
                top: Math.max(8, activeCoord.y - 44),
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
              },
            ]}>
            <Text style={styles.tooltipDate}>
              {formatChartHoverDate(displayPoint.timestamp, range)}
            </Text>
            <Text style={styles.tooltipPrice}>{formatMoney(displayPoint.value)}</Text>
          </RNView>
        ) : null}
      </RNView>

      <View style={styles.rangeRow} lightColor="transparent" darkColor="transparent">
        {CHART_RANGES.map((option) => {
          const active = range === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => changeRange(option.key)}
              style={[styles.rangeChip, active && { backgroundColor: theme.action }]}>
              <Text
                style={[styles.rangeText, active && { color: theme.actionText, opacity: 1 }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.demoNote}>Demo price history for prototyping</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginTop: 14,
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
    position: 'relative',
    width: '100%',
  },
  tooltip: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 108,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
  },
  tooltipDate: {
    fontSize: 11,
    opacity: 0.7,
  },
  tooltipPrice: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
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
  demoNote: {
    fontSize: 11,
    marginTop: 10,
    opacity: 0.5,
    textAlign: 'center',
  },
});
