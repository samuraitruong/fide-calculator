import React, { useMemo, useState } from 'react';
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
import * as FileSystem from 'expo-file-system';
import {
  cacheDirectory,
  documentDirectory,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { RatingType, Result } from '@fide-calculator/shared';
import { useStorageMode } from '@/contexts/StorageModeContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabaseRatingList } from '@/hooks/useSupabaseRatingList';
import EditGameModal from '@/components/EditGameModal';
import { generatePdfBase64, type BackupData } from '@/util/pdfGenerator';

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [exportingPdfMonthKey, setExportingPdfMonthKey] = useState<string | null>(null);

  const {
    results: localResults,
    generateMonthlyData,
    updateResult: localUpdateResult,
  } = useLocalStorage();
  const {
    results: cloudResults,
    monthlyData: cloudMonthlyData,
    loading: cloudLoading,
    updateResult: cloudUpdateResult,
  } =
    useSupabaseRatingList(ratingType);

  const isLocal = storageMode === 'local';
  const results = isLocal ? localResults : cloudResults;
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
    const idx =
      game.id
        ? results.findIndex((r) => r.id === game.id)
        : results.findIndex(
            (r) =>
              r.date === game.date &&
              r.opponentName === game.opponentName &&
              r.opponentRating === game.opponentRating &&
              r.kFactor === game.kFactor &&
              r.result === game.result &&
              r.ratingChange === game.ratingChange,
          );
    if (idx === -1) return;
    setEditingGame(game);
    setEditingIndex(idx);
  };

  const handleSaveEdits = async (updates: Partial<Result>) => {
    if (editingIndex === null) return;
    if (isLocal) {
      localUpdateResult(editingIndex, updates);
      return;
    }
    await cloudUpdateResult(editingIndex, updates);
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

      // On Android, prefer saving via Storage Access Framework so the user
      // explicitly grants a folder and we avoid storage permission issues.
      if (Platform.OS === 'android') {
        try {
          const permissions =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (!permissions.granted) {
            Alert.alert(
              'Permission needed',
              'Please choose a folder so we can save the PDF report.'
            );
            return;
          }

          const uri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            filename,
            'application/pdf'
          );

          await FileSystem.writeAsStringAsync(uri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          Alert.alert('PDF saved', 'Your report has been saved to the folder you selected.');
          return;
        } catch (androidError) {
          // If anything goes wrong with SAF, fall back to the generic sharing flow below.
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
          `PDF saved to cache. Sharing is not available on this device. Filename: ${filename}`
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
        <Text style={styles.loadingText}>Loading history…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Game History</Text>
      <View style={styles.tabs}>
        {RATING_TYPES.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, ratingType === key && styles.tabActive]}
            onPress={() => setRatingType(key)}
          >
            <Text
              style={[
                styles.tabText,
                ratingType === key && styles.tabTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {monthlyData.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No games recorded yet.</Text>
          <Text style={styles.emptyHint}>
            Track games from the Calculator tab.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {monthlyData.map((month) => (
            <View key={month.monthKey} style={styles.monthCard}>
              <TouchableOpacity
                style={styles.monthHeader}
                onPress={() => toggleMonth(month.monthKey)}
                activeOpacity={0.8}
              >
                <View style={styles.monthTitleRow}>
                  <Text style={styles.monthTitle}>{month.month}</Text>
                  <Ionicons
                    name={isExpanded(month.monthKey) ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color="#6b7280"
                  />
                </View>
                <View style={styles.monthSubRow}>
                  <View style={styles.monthLeft}>
                    <Text style={styles.gamesLabel}>{month.gameCount} GAMES</Text>
                    <View
                      style={[
                        styles.totalChangeBadge,
                        month.totalChange > 0
                          ? styles.totalChangeBadgePositive
                          : month.totalChange < 0
                            ? styles.totalChangeBadgeNegative
                            : styles.totalChangeBadgeZero,
                      ]}
                    >
                      <Ionicons
                        name={
                          month.totalChange > 0
                            ? 'arrow-up'
                            : month.totalChange < 0
                              ? 'arrow-down'
                              : 'remove'
                        }
                        size={14}
                        color="#fff"
                      />
                      <Text style={styles.totalChangeBadgeText}>
                        {month.totalChange >= 0 ? '+' : ''}
                        {month.totalChange}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    hitSlop={8}
                    onPress={(ev) => {
                      ev.stopPropagation();
                      handleDownloadPdf(month);
                    }}
                    style={styles.pdfIconButton}
                    disabled={exportingPdfMonthKey !== null}
                  >
                    {exportingPdfMonthKey === month.monthKey ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                      <Ionicons name="download-outline" size={18} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {isExpanded(month.monthKey) ? (
                <View style={styles.expandedContent}>
                  <TouchableOpacity
                    style={styles.downloadReportButton}
                    onPress={() => handleDownloadPdf(month)}
                    disabled={exportingPdfMonthKey !== null}
                  >
                    {exportingPdfMonthKey === month.monthKey ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                      <>
                        <Text style={styles.downloadReportButtonText}>DOWNLOAD REPORT</Text>
                        <Ionicons name="download-outline" size={20} color="#2563eb" />
                      </>
                    )}
                  </TouchableOpacity>
                  <View style={styles.gameList}>
                    {month.results.map((item) => (
                      <TouchableOpacity
                        key={item.id ?? `${item.date}-${item.opponentName}-${item.ratingChange}`}
                        style={styles.gameRow}
                        activeOpacity={0.7}
                        onPress={() => openEdit(item)}
                      >
                        <View style={styles.gameIconWrap}>
                          <Ionicons name="flag-outline" size={20} color="#9ca3af" />
                        </View>
                        <View style={styles.gameMain}>
                          <Text style={styles.gameOpponent} numberOfLines={1}>
                            {item.opponentName || 'Opponent'}
                          </Text>
                          <Text style={styles.gameMeta}>
                            {item.ratingType?.toUpperCase() ?? 'STANDARD'} • {item.date}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.gameChangeBadge,
                            item.ratingChange > 0
                              ? styles.gameChangeBadgePositive
                              : item.ratingChange < 0
                                ? styles.gameChangeBadgeNegative
                                : styles.gameChangeBadgeZero,
                          ]}
                        >
                          <Ionicons
                            name={
                              item.ratingChange > 0
                                ? 'arrow-up'
                                : item.ratingChange < 0
                                  ? 'arrow-down'
                                  : 'arrow-forward'
                            }
                            size={12}
                            color={
                              item.ratingChange > 0
                                ? '#166534'
                                : item.ratingChange < 0
                                  ? '#b91c1c'
                                  : '#6b7280'
                            }
                          />
                          <Text
                            style={[
                              styles.gameChangeBadgeText,
                              item.ratingChange > 0
                                ? styles.gameChangeBadgeTextPositive
                                : item.ratingChange < 0
                                  ? styles.gameChangeBadgeTextNegative
                                  : styles.gameChangeBadgeTextZero,
                            ]}
                          >
                            {item.ratingChange === 0
                              ? '→ 0.0'
                              : `${item.ratingChange > 0 ? '+' : ''}${item.ratingChange}`}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="#9ca3af"
                          style={styles.gameRowChevron}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <EditGameModal
        open={editingGame !== null}
        game={editingGame}
        onClose={() => {
          setEditingGame(null);
          setEditingIndex(null);
        }}
        onSave={handleSaveEdits}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#1f2937',
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9ca3af',
  },
  list: {
    gap: 16,
  },
  monthCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  monthHeader: {
    paddingVertical: 2,
  },
  monthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  monthSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gamesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 0.5,
  },
  totalChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalChangeBadgePositive: {
    backgroundColor: '#059669',
  },
  totalChangeBadgeNegative: {
    backgroundColor: '#b91c1c',
  },
  totalChangeBadgeZero: {
    backgroundColor: '#6b7280',
  },
  totalChangeBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  pdfIconButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  downloadReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  downloadReportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  gameList: {
    gap: 0,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  gameIconWrap: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gameMain: {
    flex: 1,
    marginRight: 12,
  },
  gameOpponent: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  gameMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  gameChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  gameChangeBadgePositive: {
    backgroundColor: '#dcfce7',
  },
  gameChangeBadgeNegative: {
    backgroundColor: '#fee2e2',
  },
  gameChangeBadgeZero: {
    backgroundColor: '#f3f4f6',
  },
  gameChangeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gameChangeBadgeTextPositive: {
    color: '#166534',
  },
  gameChangeBadgeTextNegative: {
    color: '#b91c1c',
  },
  gameChangeBadgeTextZero: {
    color: '#6b7280',
  },
  gameRowChevron: {
    marginLeft: 4,
  },
});
