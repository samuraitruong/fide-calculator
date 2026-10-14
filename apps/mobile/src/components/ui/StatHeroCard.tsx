import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import ChessInsignia from './ChessInsignia';

export interface StatHeroCardProps {
  currentRating: number;
  projectedRating: number;
  delta: number;
  gamesCount: number;
  performanceRating?: number | null;
  kFactor?: number;
  ratingType?: string;
  style?: StyleProp<ViewStyle>;
}

export const StatHeroCard: React.FC<StatHeroCardProps> = ({
  currentRating,
  projectedRating,
  delta,
  gamesCount,
  performanceRating,
  kFactor = 20,
  ratingType = 'Standard',
  style,
}) => {
  const { colors, radii, borderWidth, shadows } = useTheme();

  const isPositive = delta > 0;
  const isNegative = delta < 0;

  const deltaColor = isPositive ? colors.win : isNegative ? colors.loss : colors.textSecondary;
  const deltaBg = isPositive ? colors.winBg : isNegative ? colors.lossBg : colors.surfaceMuted;
  const deltaBorder = isPositive ? colors.win : isNegative ? colors.loss : colors.border;
  const deltaIcon: keyof typeof Ionicons.glyphMap = isPositive
    ? 'arrow-up'
    : isNegative
    ? 'arrow-down'
    : 'remove';

  const formattedDelta = `${isPositive ? '+' : ''}${delta.toFixed(1)}`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: borderWidth.heavy,
          borderRadius: radii.card,
          ...shadows.tactileOffset,
        },
        style,
      ]}
    >
      {/* Decorative Technical Corner Accents */}
      <View style={[styles.cornerTopLeft, { borderColor: colors.primary }]} />
      <View style={[styles.cornerTopRight, { borderColor: colors.accent }]} />

      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <ChessInsignia piece="knight" size={14} badgeSize={24} color={colors.primary} />
          <Text style={[styles.engineTag, { color: colors.textSecondary }]}>
            DGT CLOCK READOUT
          </Text>
        </View>

        <View style={styles.headerChips}>
          <View style={[styles.kChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.kChipText, { color: colors.accent }]}>K = {kFactor}</Text>
          </View>
          <View style={[styles.kChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.kChipText, { color: colors.textSecondary }]}>
              {ratingType.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Scoreboard Dual Display */}
      <View style={[styles.scoreboardSection, { backgroundColor: colors.surfaceElevated }]}>
        <View style={styles.ratingColumn}>
          <Text style={[styles.columnLabel, { color: colors.textSecondary }]}>CURRENT</Text>
          <Text style={[styles.ratingNumber, { color: colors.textPrimary }]}>
            {Math.round(currentRating)}
          </Text>
        </View>

        <View style={styles.centerArrow}>
          <Ionicons name="arrow-forward" size={20} color={colors.accent} />
          <View style={[styles.deltaBadge, { backgroundColor: deltaBg, borderColor: deltaBorder }]}>
            <Ionicons name={deltaIcon} size={13} color={deltaColor} />
            <Text style={[styles.deltaText, { color: deltaColor }]}>{formattedDelta}</Text>
          </View>
        </View>

        <View style={[styles.ratingColumn, styles.rightColumn]}>
          <Text style={[styles.columnLabel, { color: colors.textSecondary }]}>PROJECTED</Text>
          <Text
            style={[
              styles.ratingNumber,
              { color: isPositive ? colors.primary : isNegative ? colors.loss : colors.accent },
            ]}
          >
            {Math.round(projectedRating)}
          </Text>
        </View>
      </View>

      {/* Stats Footer Row */}
      <View style={[styles.footerBar, { borderTopColor: colors.border }]}>
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>LOGGED GAMES</Text>
          <Text style={[styles.footerValue, { color: colors.textPrimary }]}>{gamesCount}</Text>
        </View>

        <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />

        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>PERF RATING (TPR)</Text>
          <Text style={[styles.footerValue, { color: performanceRating ? colors.accent : colors.textMuted }]}>
            {performanceRating ? Math.round(performanceRating) : '—'}
          </Text>
        </View>

        <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />

        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>NET SHIFT</Text>
          <Text style={[styles.footerValue, { color: deltaColor }]}>
            {formattedDelta} pts
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    zIndex: 10,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    zIndex: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engineTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerChips: {
    flexDirection: 'row',
    gap: 6,
  },
  kChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  kChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scoreboardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  ratingColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  centerArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    gap: 2,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
  },
  footerDivider: {
    width: 1,
    height: 20,
  },
  footerLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});

export default StatHeroCard;
