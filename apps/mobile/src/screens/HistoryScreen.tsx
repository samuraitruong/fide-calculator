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
import EditGameModal from '@/components/EditGameModal';
import { generatePdfBase64, type BackupData } from '@/util/pdfGenerator';
import { colors, radii, spacing, typography, touchTargets, shadows } from '../theme/tokens';

const RATING_TYPES: { key: RatingType; label: string }[] = [
  { key: 'standard', label: 'Standard' },
  { key: 'rapid', label: 'Rapid' },
  { key: 'blitz', label: 'Blitz' },
];

export default function HistoryScreen() {
  const storageMode = useStorageMode();
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading rating history…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>♜ Game History</Text>
        <Text style={styles.subtitle}>
          Browse your monthly performance records and export FIDE reports.
        </Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.tabs}>
        {RATING_TYPES.map(({ key, label }) => {
          const isActive = ratingType === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setRatingType(key)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${label} history`}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Monthly Cards List */}
      {monthlyData.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="flag-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyText}>No games recorded yet</Text>
          <Text style={styles.emptyHint}>
            Track your matches in the Calculator tab to view monthly rating breakdowns.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {monthlyData.map((month) => {
            const expanded = isExpanded(month.monthKey);
            const isPositive = month.totalChange > 0;
            const isNegative = month.totalChange < 0;

            return (
              <View key={month.monthKey} style={styles.monthCard}>
                {/* Header (Accordion Toggle) */}
                <TouchableOpacity
                  style={styles.monthHeader}
                  onPress={() => toggleMonth(month.monthKey)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${month.month}, ${month.gameCount} games, change ${month.totalChange >= 0 ? '+' : ''}${month.totalChange}`}
                >
                  <View style={styles.monthTitleRow}>
                    <View style={styles.monthTitleLeft}>
                      <Text style={styles.monthTitle}>{month.month}</Text>
                      <View style={styles.monthMetaRow}>
                        <Text style={styles.gamesLabel}>
                          {month.gameCount} {month.gameCount === 1 ? 'GAME' : 'GAMES'}
                        </Text>
                        <View
                          style={[
                            styles.totalChangeBadge,
                            isPositive
                              ? styles.badgePositive
                              : isNegative
                                ? styles.badgeNegative
                                : styles.badgeZero,
                          ]}
                        >
                          <Ionicons
                            name={
                              isPositive
                                ? 'arrow-up'
                                : isNegative
                                  ? 'arrow-down'
                                  : 'remove'
                            }
                            size={12}
                            color={
                              isPositive
                                ? colors.positiveText
                                : isNegative
                                  ? colors.negativeText
                                  : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.totalChangeBadgeText,
                              isPositive
                                ? styles.textPositive
                                : isNegative
                                  ? styles.textNegative
                                  : styles.textZero,
                            ]}
                          >
                            {month.totalChange >= 0 ? '+' : ''}
                            {month.totalChange}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Right side: Separate PDF export button + Accordion Chevron */}
                    <View style={styles.monthHeaderActions}>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={(ev) => {
                          ev.stopPropagation();
                          handleDownloadPdf(month);
                        }}
                        style={styles.pdfIconButton}
                        disabled={exportingPdfMonthKey !== null}
                        accessibilityRole="button"
                        accessibilityLabel={`Export PDF report for ${month.month}`}
                      >
                        {exportingPdfMonthKey === month.monthKey ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Ionicons
                            name="download-outline"
                            size={20}
                            color={colors.primary}
                          />
                        )}
                      </TouchableOpacity>

                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color={colors.textSecondary}
                        style={styles.chevron}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded Content */}
                {expanded ? (
                  <View style={styles.expandedContent}>
                    <TouchableOpacity
                      style={styles.downloadReportButton}
                      onPress={() => handleDownloadPdf(month)}
                      disabled={exportingPdfMonthKey !== null}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Download full PDF report"
                    >
                      {exportingPdfMonthKey === month.monthKey ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <Ionicons
                            name="document-text-outline"
                            size={18}
                            color={colors.primary}
                          />
                          <Text style={styles.downloadReportButtonText}>
                            EXPORT MONTHLY REPORT (PDF)
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <View style={styles.gameList}>
                      {month.results.map((item) => {
                        const gamePos = item.ratingChange > 0;
                        const gameNeg = item.ratingChange < 0;

                        return (
                          <TouchableOpacity
                            key={
                              item.id ??
                              `${item.date}-${item.opponentName}-${item.ratingChange}`
                            }
                            style={styles.gameRow}
                            activeOpacity={0.7}
                            onPress={() => openEdit(item)}
                            accessibilityRole="button"
                            accessibilityLabel={`Game vs ${item.opponentName || 'Opponent'}`}
                          >
                            <View style={styles.gameIconWrap}>
                              <Ionicons
                                name="person-outline"
                                size={18}
                                color={colors.primary}
                              />
                            </View>

                            <View style={styles.gameMain}>
                              <Text style={styles.gameOpponent} numberOfLines={1}>
                                {item.opponentName || 'Opponent'}
                              </Text>
                              <Text style={styles.gameMeta}>
                                {item.ratingType?.toUpperCase() ?? 'STANDARD'} · {item.date}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.gameChangeBadge,
                                gamePos
                                  ? styles.badgePositive
                                  : gameNeg
                                    ? styles.badgeNegative
                                    : styles.badgeZero,
                              ]}
                            >
                              <Ionicons
                                name={
                                  gamePos
                                    ? 'arrow-up'
                                    : gameNeg
                                      ? 'arrow-down'
                                      : 'arrow-forward'
                                }
                                size={12}
                                color={
                                  gamePos
                                    ? colors.positiveText
                                    : gameNeg
                                      ? colors.negativeText
                                      : colors.textSecondary
                                }
                              />
                              <Text
                                style={[
                                  styles.gameChangeBadgeText,
                                  gamePos
                                    ? styles.textPositive
                                    : gameNeg
                                      ? styles.textNegative
                                      : styles.textZero,
                                ]}
                              >
                                {item.ratingChange === 0
                                  ? '0.0'
                                  : `${item.ratingChange > 0 ? '+' : ''}${item.ratingChange}`}
                              </Text>
                            </View>

                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={colors.textMuted}
                              style={styles.gameRowChevron}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>
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
    backgroundColor: colors.canvas,
  },
  content: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.screenInset,
    paddingBottom: spacing.xxxl + spacing.xl,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Header
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Segmented Tabs
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control - 2,
  },
  tabActive: {
    backgroundColor: colors.surfaceSelected,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  tabTextActive: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '700',
  },

  // Empty State
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.xxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyHint: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Monthly Cards List
  list: {
    gap: spacing.md,
  },
  monthCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  monthHeader: {
    padding: spacing.lg,
  },
  monthTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitleLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  monthTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  monthMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
    gap: spacing.sm,
  },
  gamesLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  monthHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pdfIconButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    marginLeft: spacing.xs,
  },

  // Total Change Badges
  totalChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    gap: 2,
  },
  totalChangeBadgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  badgePositive: {
    backgroundColor: colors.positiveBg,
  },
  badgeNegative: {
    backgroundColor: colors.negativeBg,
  },
  badgeZero: {
    backgroundColor: colors.neutralBg,
  },
  textPositive: {
    color: colors.positiveText,
  },
  textNegative: {
    color: colors.negativeText,
  },
  textZero: {
    color: colors.textSecondary,
  },

  // Expanded Content
  expandedContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  downloadReportButton: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    minHeight: touchTargets.min,
    backgroundColor: colors.surfaceSelected,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  downloadReportButtonText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '700',
  },
  gameList: {
    gap: spacing.xs + 2,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargets.min,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  gameIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSelected,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  gameMain: {
    flex: 1,
    marginRight: spacing.sm,
  },
  gameOpponent: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  gameMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gameChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    gap: 2,
  },
  gameChangeBadgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  gameRowChevron: {
    marginLeft: spacing.xs,
  },
});
