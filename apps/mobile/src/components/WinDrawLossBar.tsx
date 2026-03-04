import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
      { key: 'win', value: wins, color: '#10b981' },
      { key: 'draw', value: draws, color: '#6b7280' },
      { key: 'loss', value: losses, color: '#ef4444' },
    ],
    [wins, draws, losses],
  );

  if (total === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No games this month yet.</Text>
      </View>
    );
  }

  return (
    <View>
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
                  borderTopLeftRadius: idx === 0 ? 10 : 0,
                  borderBottomLeftRadius: idx === 0 ? 10 : 0,
                  borderTopRightRadius: idx === arr.length - 1 ? 10 : 0,
                  borderBottomRightRadius: idx === arr.length - 1 ? 10 : 0,
                },
              ]}
            />
          ))}
      </View>

      {showLegend ? (
        <View style={styles.legend}>
          <LegendItem color="#10b981" label="Wins" value={wins} />
          <LegendItem color="#6b7280" label="Draws" value={draws} />
          <LegendItem color="#ef4444" label="Losses" value={losses} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 12,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    height: 12,
  },
  legend: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
  },
});

