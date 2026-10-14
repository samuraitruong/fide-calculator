import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  wins: number;
  draws: number;
  losses: number;
  showLegend?: boolean;
};

function LegendItem({
  color,
  label,
  value,
  textColor,
}: {
  color: string;
  label: string;
  value: number;
  textColor: string;
}) {
  if (value <= 0) return null;
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: textColor }]}>
        {label}: <Text style={[styles.legendValue, { color }]}>{value}</Text>
      </Text>
    </View>
  );
}

export default function WinDrawLossBar({ wins, draws, losses, showLegend = true }: Props) {
  const { colors, radii, borderWidth } = useTheme();
  const total = wins + draws + losses;

  const parts = useMemo(
    () => [
      { key: 'win', value: wins, color: colors.win },
      { key: 'draw', value: draws, color: colors.draw },
      { key: 'loss', value: losses, color: colors.loss },
    ],
    [wins, draws, losses, colors],
  );

  if (total === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          [ NO TOURNAMENT GAMES LOGGED YET ]
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor: colors.border,
            borderWidth: borderWidth.thin,
            borderRadius: radii.xs + 2,
          },
        ]}
      >
        {parts
          .filter((p) => p.value > 0)
          .map((p, idx, arr) => (
            <View
              key={p.key}
              style={[
                styles.segment,
                {
                  backgroundColor: p.color,
                  flex: p.value,
                  borderTopLeftRadius: idx === 0 ? radii.xs : 0,
                  borderBottomLeftRadius: idx === 0 ? radii.xs : 0,
                  borderTopRightRadius: idx === arr.length - 1 ? radii.xs : 0,
                  borderBottomRightRadius: idx === arr.length - 1 ? radii.xs : 0,
                },
              ]}
            />
          ))}
      </View>

      {showLegend ? (
        <View style={styles.legend}>
          <LegendItem color={colors.win} label="Wins" value={wins} textColor={colors.textSecondary} />
          <LegendItem color={colors.draw} label="Draws" value={draws} textColor={colors.textSecondary} />
          <LegendItem color={colors.loss} label="Losses" value={losses} textColor={colors.textSecondary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  bar: {
    height: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    height: 10,
  },
  legend: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  legendValue: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  empty: {
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
