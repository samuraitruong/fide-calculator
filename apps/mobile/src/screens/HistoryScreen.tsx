import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RatingType, Result } from '@fide-calculator/shared';
import { useStorageMode } from '@/contexts/StorageModeContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabaseRatingList } from '@/hooks/useSupabaseRatingList';
import EditGameModal from '@/components/EditGameModal';

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
                <Text style={styles.monthTitle}>{month.month}</Text>
                <View style={styles.monthBadges}>
                  <Text style={styles.badgeText}>{month.gameCount} games</Text>
                  <Text
                    style={[
                      styles.totalChange,
                      month.totalChange >= 0
                        ? styles.totalChangePositive
                        : styles.totalChangeNegative,
                    ]}
                  >
                    {month.totalChange >= 0 ? '+' : ''}
                    {month.totalChange}
                  </Text>
                  <Ionicons
                    name={isExpanded(month.monthKey) ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6b7280"
                  />
                </View>
              </TouchableOpacity>

              {isExpanded(month.monthKey) ? (
                <View style={styles.gameList}>
                  {month.results.map((item) => (
                    <TouchableOpacity
                      key={item.id ?? `${item.date}-${item.opponentName}-${item.ratingChange}`}
                      style={styles.gameRow}
                      activeOpacity={0.7}
                      onPress={() => openEdit(item)}
                    >
                      <View style={styles.gameMain}>
                        <Text style={styles.gameOpponent} numberOfLines={1}>
                          {item.opponentName || 'Opponent'}
                        </Text>
                        <Text style={styles.gameMeta}>
                          {item.date} · {item.result.toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.gameChange,
                          item.ratingChange > 0
                            ? styles.gameChangePositive
                            : item.ratingChange < 0
                              ? styles.gameChangeNegative
                              : null,
                        ]}
                      >
                        {item.ratingChange > 0 ? '+' : ''}
                        {item.ratingChange}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#9ca3af"
                        style={{ marginLeft: 8 }}
                      />
                    </TouchableOpacity>
                  ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  monthBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeText: {
    fontSize: 13,
    color: '#6b7280',
  },
  totalChange: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalChangePositive: {
    color: '#059669',
  },
  totalChangeNegative: {
    color: '#b91c1c',
  },
  gameList: {
    marginTop: 4,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  gameChange: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 56,
    textAlign: 'right',
  },
  gameChangePositive: {
    color: '#059669',
  },
  gameChangeNegative: {
    color: '#b91c1c',
  },
});
