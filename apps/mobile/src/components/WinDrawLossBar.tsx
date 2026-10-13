import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = {
  wins: number;
  draws: number;
  losses: number;
  showLegend?: boolean;
};

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  if (value <= 0) return null;
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>
        {label}: {value}
      </Text>
    </View>
  );
}

export default function WinDrawLossBar({ wins, draws, losses, showLegend = true }: Props) {
  const total = wins + draws + losses;

  const parts = useMemo(
    () => [
      { key: 'win', value: wins, color: colors.positiveText },
      { key: 'draw', value: draws, color: colors.textSecondary },
      { key: 'loss', value: losses, color: colors.negativeText },
    ],
    [wins, draws, losses],
  );

  if (total === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>♟ No games tracked this month yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
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
                  borderTopLeftRadius: idx === 0 ? radii.sm : 0,
                  borderBottomLeftRadius: idx === 0 ? radii.sm : 0,
                  borderTopRightRadius: idx === arr.length - 1 ? radii.sm : 0,
                  borderBottomRightRadius: idx === arr.length - 1 ? radii.sm : 0,
                },
              ]}
            />
          ))}
      </View>

      {showLegend ? (
        <View style={styles.legend}>
          <LegendItem color={colors.positiveText} label="Wins" value={wins} />
          <LegendItem color={colors.textSecondary} label="Draws" value={draws} />
          <LegendItem color={colors.negativeText} label="Losses" value={losses} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  bar: {
    height: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    height: 12,
  },
  legend: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
