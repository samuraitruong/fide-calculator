import React, { useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import {
  cacheDirectory,
  documentDirectory,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { RatingType, Result } from '@fide-calculator/shared';
import { getResultRatingMonth, getRatingMonthFromDate } from '@fide-calculator/shared';
import { useStorageMode } from '@/contexts/StorageModeContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabaseRatingList } from '@/hooks/useSupabaseRatingList';
import { useTheme } from '../contexts/ThemeContext';
import EditGameModal from '@/components/EditGameModal';
import { generatePdfBase64, type BackupData } from '@/util/pdfGenerator';
import TacticalCard from '@/components/ui/TacticalCard';
import TacticalButton from '@/components/ui/TacticalButton';
import ChessInsignia from '@/components/ui/ChessInsignia';

const RATING_TYPES: { key: RatingType; label: string }[] = [
  { key: 'standard', label: 'STANDARD' },
  { key: 'rapid', label: 'RAPID' },
  { key: 'blitz', label: 'BLITZ' },
];

export default function HistoryScreen() {
  const storageMode = useStorageMode();
  const { colors, radii, borderWidth, touchTargets, shadows } = useTheme();
  const [ratingType, setRatingType] = useState<RatingType>('standard');
  const [expandedByMonthKey, setExpandedByMonthKey] = useState<Record<string, boolean>>({});
  const [editingGame, setEditingGame] = useState<Result | null>(null);
  const [exportingPdfMonthKey, setExportingPdfMonthKey] = useState<string | null>(null);

  const {
    results: localResults,
    generateMonthlyData,
    updateResult: localUpdateResult,
    removeResult: localRemoveResult,
  } = useLocalStorage();
  const {
    results: cloudResults,
    monthlyData: cloudMonthlyData,
    loading: cloudLoading,
    updateResult: cloudUpdateResult,
    removeResult: cloudRemoveResult,
  } = useSupabaseRatingList(ratingType);

  const isLocal = storageMode === 'local';
  const results = isLocal ? localResults : cloudResults;
  const latestResults = useRef(results);
  latestResults.current = results;
  const monthlyData = isLocal
    ? generateMonthlyData(ratingType)
    : cloudMonthlyData;
  const loading = !isLocal && cloudLoading;

  const typeResults = useMemo(
    () => results.filter((r) => r.ratingType === ratingType),
    [results, ratingType],
  );

  // Career telemetry stats
  const careerStats = useMemo(() => {
    let peak = 0;
    let current = 0;
    if (typeResults.length > 0) {
      current = typeResults[0]?.playerRating || 1500;
      for (const r of typeResults) {
        if (r.playerRating > peak) peak = r.playerRating;
        const projected = r.playerRating + r.ratingChange;
        if (projected > peak) peak = projected;
      }
    }
    return {
      totalGames: typeResults.length,
      peakRating: Math.round(peak || current || 1500),
      currentRating: Math.round(current || 1500),
    };
  }, [typeResults]);

  const expandedDefaultMonthKey = useMemo(() => monthlyData[0]?.monthKey ?? null, [monthlyData]);
  const isExpanded = (monthKey: string) =>
    expandedByMonthKey[monthKey] ?? monthKey === expandedDefaultMonthKey;

  const toggleMonth = (monthKey: string) => {
    setExpandedByMonthKey((prev) => ({ ...prev, [monthKey]: !isExpanded(monthKey) }));
  };

  const openEdit = (game: Result) => {
    const idx = game.id ? results.findIndex((r) => r.id === game.id) : results.indexOf(game);
    if (idx === -1) return;
    setEditingGame(game);
  };

  const getEditingIndex = () => {
    if (!editingGame) throw new Error('No game selected.');
    const index = editingGame.id
      ? latestResults.current.findIndex((r) => r.id === editingGame.id)
      : latestResults.current.indexOf(editingGame);
    if (index < 0) throw new Error('Game no longer exists.');
    return index;
  };

  const handleSaveEdits = async (updates: Partial<Result>) => {
    const index = getEditingIndex();
    if (isLocal) await localUpdateResult(index, updates);
    else await cloudUpdateResult(index, updates);
  };

  const handleDelete = async () => {
    const index = getEditingIndex();
    if (
      getResultRatingMonth(latestResults.current[index]) !==
      getRatingMonthFromDate(new Date())
    )
      throw new Error('Only current rating-month games can be deleted.');
    if (isLocal) await localRemoveResult(index);
    else await cloudRemoveResult(index);
  };

  const handleDownloadPdf = async (month: (typeof monthlyData)[0]) => {
    setExportingPdfMonthKey(month.monthKey);
    try {
      const backup: BackupData = {
        id: month.monthKey,
        month: month.month,
        data: month.results,
        gameCount: month.gameCount,
        totalChange: month.totalChange,
        createdAt: new Date().toISOString(),
        type: ratingType,
      };
      const base64 = generatePdfBase64(backup);
      const filename = `FIDE-${month.month.replace(/\s/g, '-')}.pdf`;

      if (Platform.OS === 'android') {
        try {
          const permissions =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (!permissions.granted) {
            Alert.alert(
              'Permission needed',
              'Please choose a folder so we can save the PDF report.',
            );
            return;
          }

          const uri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            filename,
            'application/pdf',
          );

          await FileSystem.writeAsStringAsync(uri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          Alert.alert(
            'PDF saved',
            'Your report has been saved to the folder you selected.',
          );
          return;
        } catch {
          // Fall back to sharing below if SAF has issues
        }
      }

      const dir = cacheDirectory ?? documentDirectory;
      if (!dir) {
        Alert.alert('Error', 'Could not access file system.');
        return;
      }
      const fileUri = `${dir}${filename}`;
      await writeAsStringAsync(fileUri, base64, {
        encoding: EncodingType.Base64,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${month.month} report`,
        });
      } else {
        Alert.alert(
          'PDF ready',
          `PDF saved to cache. Sharing is not available on this device. Filename: ${filename}`,
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to generate PDF';
      Alert.alert('Export failed', message);
    } finally {
      setExportingPdfMonthKey(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.canvas }]}>
        <ChessInsignia piece="rook" size={32} badgeSize={64} color={colors.primary} />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Tournament History…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.canvas }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <ChessInsignia piece="rook" size={18} badgeSize={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>TOURNAMENT HISTORY</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Career game logs, monthly rating shift timelines, and PDF export reports.
        </Text>
      </View>

      {/* Career Telemetry Stats Banner */}
      <View
        style={[
          styles.careerCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: borderWidth.default,
            borderRadius: radii.card,
            ...shadows.tactileOffset,
          },
        ]}
      >
        <View style={styles.careerStatCol}>
          <Text style={[styles.careerLabel, { color: colors.textSecondary }]}>CAREER PEAK</Text>
          <Text style={[styles.careerVal, { color: colors.accent }]}>{careerStats.peakRating}</Text>
        </View>
        <View style={[styles.careerDivider, { backgroundColor: colors.border }]} />
        <View style={styles.careerStatCol}>
          <Text style={[styles.careerLabel, { color: colors.textSecondary }]}>TOTAL LOGGED</Text>
          <Text style={[styles.careerVal, { color: colors.textPrimary }]}>{careerStats.totalGames}</Text>
        </View>
        <View style={[styles.careerDivider, { backgroundColor: colors.border }]} />
        <View style={styles.careerStatCol}>
          <Text style={[styles.careerLabel, { color: colors.textSecondary }]}>MODE</Text>
          <Text style={[styles.careerVal, { color: colors.primary }]}>{ratingType.toUpperCase()}</Text>
        </View>
      </View>

      {/* Segmented Control */}
      <View
        style={[
          styles.tabs,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            borderWidth: borderWidth.default,
            borderRadius: radii.control,
          },
        ]}
      >
        {RATING_TYPES.map(({ key, label }) => {
          const isActive = ratingType === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.tab,
                {
                  minHeight: touchTargets.min - 6,
                  borderRadius: radii.control - 2,
                  backgroundColor: isActive ? colors.surface : 'transparent',
                  borderColor: isActive ? colors.borderAccent : 'transparent',
                  borderWidth: isActive ? 1.5 : 0,
                },
              ]}
              onPress={() => setRatingType(key)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${label} history`}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? colors.primary : colors.textSecondary,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Monthly Cards List */}
      {monthlyData.length === 0 ? (
        <TacticalCard variant="elevated" hasOffsetShadow={false} style={styles.emptyCard}>
          <ChessInsignia piece="knight" size={32} badgeSize={56} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No Matches Logged</Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            Log your rated tournament games in the Calculator tab to generate monthly breakdown timelines.
          </Text>
        </TacticalCard>
      ) : (
        <View style={styles.list}>
          {monthlyData.map((month) => {
            const expanded = isExpanded(month.monthKey);
            const isPositive = month.totalChange > 0;
            const isNegative = month.totalChange < 0;

            return (
              <TacticalCard
                key={month.monthKey}
                variant="default"
                hasOffsetShadow={true}
                contentStyle={{ padding: 0 }}
                style={styles.monthCard}
              >
                {/* Header (Accordion Toggle) */}
                <TouchableOpacity
                  style={[styles.monthHeader, { backgroundColor: colors.surface }]}
                  onPress={() => toggleMonth(month.monthKey)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${month.month}, ${month.gameCount} games, change ${month.totalChange >= 0 ? '+' : ''}${month.totalChange}`}
                >
                  <View style={styles.monthTitleRow}>
                    <View style={styles.monthTitleLeft}>
                      <View style={styles.monthBadgeTitleWrap}>
                        <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>{month.month.toUpperCase()}</Text>
                        <View style={[styles.gamesCountChip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                          <Text style={[styles.gamesLabel, { color: colors.textSecondary }]}>
                            {month.gameCount} {month.gameCount === 1 ? 'GAME' : 'GAMES'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.monthMetaRow}>
                        <View
                          style={[
                            styles.totalChangeBadge,
                            {
                              backgroundColor: isPositive ? colors.winBg : isNegative ? colors.lossBg : colors.surfaceMuted,
                              borderColor: isPositive ? colors.win : isNegative ? colors.loss : colors.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name={isPositive ? 'arrow-up' : isNegative ? 'arrow-down' : 'remove'}
                            size={12}
                            color={isPositive ? colors.win : isNegative ? colors.loss : colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.totalChangeBadgeText,
                              {
                                color: isPositive ? colors.win : isNegative ? colors.loss : colors.textSecondary,
                              },
                            ]}
                          >
                            {month.totalChange >= 0 ? '+' : ''}
                            {month.totalChange} pts
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Right side: PDF quick action + Chevron */}
                    <View style={styles.monthHeaderActions}>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={(ev) => {
                          ev.stopPropagation();
                          handleDownloadPdf(month);
                        }}
                        style={[styles.pdfIconButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                        disabled={exportingPdfMonthKey !== null}
                        accessibilityRole="button"
                        accessibilityLabel={`Export PDF report for ${month.month}`}
                      >
                        {exportingPdfMonthKey === month.monthKey ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Ionicons
                            name="download-outline"
                            size={18}
                            color={colors.primary}
                          />
                        )}
                      </TouchableOpacity>

                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.textSecondary}
                        style={styles.chevron}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded Content */}
                {expanded ? (
                  <View style={[styles.expandedContent, { borderTopColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
                    <TacticalButton
                      title={exportingPdfMonthKey === month.monthKey ? 'Exporting PDF…' : 'Export Monthly PDF Report'}
                      onPress={() => handleDownloadPdf(month)}
                      disabled={exportingPdfMonthKey !== null}
                      variant="secondary"
                      size="sm"
                      style={styles.downloadReportButton}
                      icon={<Ionicons name="document-text-outline" size={16} color={colors.primary} />}
                    />

                    <View style={styles.gameList}>
                      {month.results.map((item, roundIdx) => {
                        const gamePos = item.ratingChange > 0;
                        const gameNeg = item.ratingChange < 0;

                        return (
                          <TouchableOpacity
                            key={
                              item.id ??
                              `${item.date}-${item.opponentName}-${item.ratingChange}`
                            }
                            style={[
                              styles.gameRow,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                borderRadius: radii.control,
                              },
                            ]}
                            activeOpacity={0.7}
                            onPress={() => openEdit(item)}
                            accessibilityRole="button"
                            accessibilityLabel={`Game vs ${item.opponentName || 'Opponent'}`}
                          >
                            <View style={[styles.roundChip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                              <Text style={[styles.roundChipText, { color: colors.accent }]}>
                                #{month.results.length - roundIdx}
                              </Text>
                            </View>

                            <View style={styles.gameMain}>
                              <Text style={[styles.gameOpponent, { color: colors.textPrimary }]} numberOfLines={1}>
                                {item.opponentName || 'Opponent'} ({item.opponentRating})
                              </Text>
                              <Text style={[styles.gameMeta, { color: colors.textSecondary }]}>
                                {item.result?.toUpperCase()} · K={item.kFactor} · {item.date}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.gameChangeBadge,
                                {
                                  backgroundColor: gamePos ? colors.winBg : gameNeg ? colors.lossBg : colors.surfaceMuted,
                                  borderColor: gamePos ? colors.win : gameNeg ? colors.loss : colors.border,
                                },
                              ]}
                            >
                              <Ionicons
                                name={gamePos ? 'arrow-up' : gameNeg ? 'arrow-down' : 'remove'}
                                size={11}
                                color={gamePos ? colors.win : gameNeg ? colors.loss : colors.textSecondary}
                              />
                              <Text
                                style={[
                                  styles.gameChangeBadgeText,
                                  {
                                    color: gamePos ? colors.win : gameNeg ? colors.loss : colors.textSecondary,
                                  },
                                ]}
                              >
                                {item.ratingChange === 0
                                  ? '0.0'
                                  : `${item.ratingChange > 0 ? '+' : ''}${item.ratingChange}`}
                              </Text>
                            </View>

                            <Ionicons
                              name="chevron-forward"
                              size={15}
                              color={colors.textMuted}
                              style={styles.gameRowChevron}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </TacticalCard>
            );
          })}
        </View>
      )}

      {/* Edit Game Modal */}
      <EditGameModal
        open={editingGame !== null}
        game={editingGame}
        onClose={() => {
          setEditingGame(null);
        }}
        onSave={handleSaveEdits}
        onDelete={handleDelete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  header: {
    gap: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  careerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  careerStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  careerLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  careerVal: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  careerDivider: {
    width: 1,
    height: 24,
  },
  tabs: {
    flexDirection: 'row',
    padding: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 11,
    letterSpacing: 0.6,
  },
  emptyCard: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  list: {
    gap: 14,
  },
  monthCard: {
    overflow: 'hidden',
  },
  monthHeader: {
    padding: 14,
  },
  monthTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitleLeft: {
    flex: 1,
    marginRight: 12,
  },
  monthBadgeTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  gamesCountChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  gamesLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  monthMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  monthHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pdfIconButton: {
    width: 38,
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    marginLeft: 2,
  },
  totalChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    gap: 3,
  },
  totalChangeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  expandedContent: {
    padding: 12,
    borderTopWidth: 1,
  },
  downloadReportButton: {
    marginBottom: 10,
  },
  gameList: {
    gap: 8,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  roundChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  roundChipText: {
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  gameMain: {
    flex: 1,
    marginRight: 6,
  },
  gameOpponent: {
    fontSize: 13,
    fontWeight: '700',
  },
  gameMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  gameChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    gap: 2,
  },
  gameChangeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  gameRowChevron: {
    marginLeft: 2,
  },
});
