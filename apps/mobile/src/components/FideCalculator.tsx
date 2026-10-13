import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from '../types/navigation';
import type { GameResult, RatingType, Result, FidePlayer } from '@fide-calculator/shared';
import { calculateRatingChange, getRatingMonthFromDate, getResultRatingMonth, isValidRatingMonth } from '@fide-calculator/shared';
import FideSearchInput from './FideSearchInput';
import WinDrawLossBar from './WinDrawLossBar';
import EditGameModal from './EditGameModal';
import { colors, radii, spacing, typography, touchTargets, shadows } from '../theme/tokens';

type Mode = 'local' | 'cloud';

interface ProfileLike {
  name: string;
  standardRating: number;
  rapidRating: number;
  blitzRating: number;
}

interface FideCalculatorProps {
  mode: Mode;
  ratingType: RatingType;
  onChangeRatingType: (type: RatingType) => void;
  profile: ProfileLike | null;
  results: Result[];
  addResult: (result: Result) => void | Promise<void>;
  updateResult?: (index: number, updates: Partial<Result>) => void | Promise<void>;
  removeResult?: (index: number) => void | Promise<void>;
}

function getProfileRatingForType(profile: ProfileLike, type: RatingType): number {
  if (type === 'standard') return profile.standardRating;
  if (type === 'rapid') return profile.rapidRating;
  return profile.blitzRating;
}

function getPlayerRatingForType(player: FidePlayer, type: RatingType): string {
  let rating = '';
  if (type === 'standard') {
    rating = player.standard;
  } else if (type === 'blitz') {
    rating = player.blitz;
  } else if (type === 'rapid') {
    rating = player.rapid;
  }
  if (!rating || rating === '-') {
    rating = player.standard || player.rapid || player.blitz || '';
  }
  return rating && rating !== '-' ? rating : '';
}

const getDefaultK = (type: RatingType) => (type === 'standard' ? 40 : 20);

const isValidRating = (rating: number) => rating >= 100 && rating <= 3500;

export default function FideCalculatorMobile({
  ratingType,
  onChangeRatingType,
  profile,
  results,
  addResult,
  updateResult,
  removeResult,
}: FideCalculatorProps) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabsParamList>>();
  const latestResults = useRef(results);
  latestResults.current = results;
  const [playerRating, setPlayerRating] = useState<number>(
    profile ? getProfileRatingForType(profile, ratingType) : 1500,
  );
  const [playerRatingManuallyChanged, setPlayerRatingManuallyChanged] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [opponentRating, setOpponentRating] = useState(1400);
  const [kFactor, setKFactor] = useState(getDefaultK(ratingType));
  const [gameResult, setGameResult] = useState<GameResult>('win');
  const [currentChange, setCurrentChange] = useState<number | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${getRatingMonthFromDate(now)}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [ratingMonth, setRatingMonth] = useState(() => getRatingMonthFromDate(new Date()));
  const [monthManuallyChanged, setMonthManuallyChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingGame, setEditingGame] = useState<Result | null>(null);

  // When rating type or profile changes, reset defaults
  useEffect(() => {
    setPlayerRatingManuallyChanged(false);
    if (profile && !playerRatingManuallyChanged) {
      setPlayerRating(getProfileRatingForType(profile, ratingType));
    }
    setKFactor(getDefaultK(ratingType));
    setCurrentChange(null);
    setHasCalculated(false);
  }, [profile, ratingType]);

  const typeResults = useMemo(
    () => results.filter((r) => r.ratingType === ratingType),
    [results, ratingType],
  );

  const currentMonthResults = useMemo(() => {
    const currentMonth = getRatingMonthFromDate(new Date());
    return typeResults.filter((r) => getResultRatingMonth(r) === currentMonth);
  }, [typeResults]);

  const currentMonthChange = useMemo(
    () =>
      Math.round(
        10 * currentMonthResults.reduce((sum, r) => sum + r.ratingChange, 0),
      ) / 10,
    [currentMonthResults],
  );

  const wdl = useMemo(() => {
    let wins = 0;
    let draws = 0;
    let losses = 0;
    for (const r of currentMonthResults) {
      if (r.result === 'win') wins += 1;
      else if (r.result === 'draw') draws += 1;
      else losses += 1;
    }
    return { wins, draws, losses };
  }, [currentMonthResults]);

  const isDateValid = useMemo(() => {
    try {
      getRatingMonthFromDate(date);
      return true;
    } catch {
      return false;
    }
  }, [date]);

  const isFormValid =
    isValidRating(playerRating) &&
    isValidRating(opponentRating) &&
    isDateValid &&
    isValidRatingMonth(ratingMonth);

  // After user calculates once, keep the entry's rating change live-updated
  useEffect(() => {
    if (!hasCalculated) return;
    if (!isFormValid) {
      setCurrentChange(null);
      return;
    }
    const delta = calculateRatingChange(playerRating, opponentRating, gameResult, kFactor);
    setCurrentChange(delta);
  }, [hasCalculated, playerRating, opponentRating, gameResult, kFactor, isFormValid]);

  const handleCalculate = () => {
    if (!isFormValid) return;
    const delta = calculateRatingChange(playerRating, opponentRating, gameResult, kFactor);
    setCurrentChange(delta);
    setHasCalculated(true);
  };

  const handleTrackGame = async () => {
    if (!isFormValid) return;
    const delta = calculateRatingChange(playerRating, opponentRating, gameResult, kFactor);
    setCurrentChange(delta);
    setHasCalculated(true);

    const newResult: Result = {
      id: Date.now().toString() + Math.random().toString().slice(2),
      playerRating,
      opponentName,
      opponentRating,
      kFactor,
      result: gameResult,
      ratingChange: delta,
      ratingType,
      date,
      ratingMonth,
      monthKey: ratingMonth,
    };

    if (saving) return;
    setSaving(true);
    try {
      await addResult(newResult);
    } catch (error) {
      Alert.alert('Unable to track game', error instanceof Error ? error.message : 'Please try again.');
      return;
    } finally {
      setSaving(false);
    }

    if (profile) {
      setPlayerRating(getProfileRatingForType(profile, ratingType));
      setPlayerRatingManuallyChanged(false);
    }
    setOpponentName('');
    setOpponentRating(1400);
    setGameResult('win');
  };

  const handleSelectOpponent = (player: FidePlayer) => {
    const rating = getPlayerRatingForType(player, ratingType);
    setOpponentName(player.name);
    setOpponentRating(Number(rating) || 1400);
  };

  const ratingTypes: RatingType[] = ['standard', 'rapid', 'blitz'];

  const liveRating = useMemo(() => {
    return Math.round(playerRating + currentMonthChange);
  }, [playerRating, currentMonthChange]);

  const showingEntryChange = hasCalculated && currentChange !== null;

  return (
    <View style={styles.container}>
      {/* 1. Rating Type Segmented Control */}
      <View style={styles.segmentContainer}>
        {ratingTypes.map((type) => {
          const isActive = ratingType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.segmentTab, isActive && styles.segmentTabActive]}
              onPress={() => onChangeRatingType(type)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${type} rating mode`}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Live Rating & Monthly Progress Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>♞ Rating Progress (Estimate)</Text>
          <View style={styles.badgePeach}>
            <Text style={styles.badgePeachText}>Current Month</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>ESTIMATED LIVE RATING</Text>
            <Text style={styles.heroNumber}>{liveRating}</Text>
            <Text style={styles.statSubtext}>Base: {playerRating}</Text>
          </View>

          <View style={[styles.statCol, styles.statColRight]}>
            <Text style={styles.statLabel}>MONTH CHANGE</Text>
            <View
              style={[
                styles.changeBadge,
                currentMonthChange > 0
                  ? styles.changeBadgePositive
                  : currentMonthChange < 0
                    ? styles.changeBadgeNegative
                    : styles.changeBadgeZero,
              ]}
            >
              <Ionicons
                name={
                  currentMonthChange > 0
                    ? 'arrow-up'
                    : currentMonthChange < 0
                      ? 'arrow-down'
                      : 'remove'
                }
                size={16}
                color={
                  currentMonthChange > 0
                    ? colors.positiveText
                    : currentMonthChange < 0
                      ? colors.negativeText
                      : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.changeBadgeText,
                  currentMonthChange > 0
                    ? styles.changeTextPositive
                    : currentMonthChange < 0
                      ? styles.changeTextNegative
                      : styles.changeTextZero,
                ]}
              >
                {currentMonthChange > 0 ? '+' : ''}
                {currentMonthChange}
              </Text>
            </View>
            <Text style={styles.statSubtext}>
              {currentMonthResults.length} {currentMonthResults.length === 1 ? 'game' : 'games'} played
            </Text>
          </View>
        </View>

        <View style={styles.wdlSection}>
          <View style={styles.wdlHeader}>
            <Text style={styles.statLabel}>RECORD</Text>
            <Text style={styles.wdlCounts}>
              W: {wdl.wins}  ·  D: {wdl.draws}  ·  L: {wdl.losses}
            </Text>
          </View>
          <WinDrawLossBar wins={wdl.wins} draws={wdl.draws} losses={wdl.losses} showLegend={false} />
        </View>
      </View>

      {/* 3. Grouped Player & Opponent Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>♟ Player & Opponent</Text>
        </View>

        <View style={styles.fieldGrid}>
          <View style={styles.fieldCol}>
            <Text style={styles.inputLabel}>Your rating</Text>
            <TextInput
              style={styles.textInput}
              value={String(playerRating)}
              keyboardType="numeric"
              placeholder="1500"
              placeholderTextColor={colors.textMuted}
              onChangeText={(text) => {
                const n = Number(text.replace(/[^0-9]/g, ''));
                setPlayerRating(Number.isNaN(n) ? 0 : n);
                setPlayerRatingManuallyChanged(true);
              }}
              accessibilityLabel="Your rating"
            />
          </View>

          <View style={styles.fieldCol}>
            <Text style={styles.inputLabel}>K-factor</Text>
            <TextInput
              style={styles.textInput}
              value={String(kFactor)}
              keyboardType="numeric"
              placeholder="20"
              placeholderTextColor={colors.textMuted}
              onChangeText={(text) => {
                const n = Number(text.replace(/[^0-9]/g, ''));
                setKFactor(Number.isNaN(n) ? getDefaultK(ratingType) : n);
              }}
              accessibilityLabel="K-factor"
            />
          </View>
        </View>

        <View style={styles.formSpacing}>
          <Text style={styles.inputLabel}>Opponent</Text>
          <FideSearchInput
            value={opponentName}
            onChange={setOpponentName}
            onSelect={handleSelectOpponent}
            placeholder="Search FIDE players or type name..."
          />
        </View>

        <View style={styles.formSpacing}>
          <Text style={styles.inputLabel}>Opponent rating</Text>
          <TextInput
            style={styles.textInput}
            value={String(opponentRating)}
            keyboardType="numeric"
            placeholder="1400"
            placeholderTextColor={colors.textMuted}
            onChangeText={(text) => {
              const n = Number(text.replace(/[^0-9]/g, ''));
              setOpponentRating(Number.isNaN(n) ? 0 : n);
            }}
            accessibilityLabel="Opponent rating"
          />
        </View>
      </View>

      {/* 4. Grouped Game Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>⚔ Match Details</Text>
        </View>

        <View style={styles.formSpacing}>
          <Text style={styles.inputLabel}>Result</Text>
          <View style={styles.resultRow}>
            {(['win', 'draw', 'loss'] as GameResult[]).map((res) => {
              const isWin = res === 'win';
              const isDraw = res === 'draw';
              const isLoss = res === 'loss';
              const isSelected = gameResult === res;
              return (
                <TouchableOpacity
                  key={res}
                  style={[
                    styles.resultButton,
                    isSelected && isWin && styles.resultButtonWinActive,
                    isSelected && isDraw && styles.resultButtonDrawActive,
                    isSelected && isLoss && styles.resultButtonLossActive,
                  ]}
                  onPress={() => setGameResult(res)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Game result ${res}`}
                >
                  <Text
                    style={[
                      styles.resultButtonText,
                      isSelected && isWin && styles.resultTextWinActive,
                      isSelected && isDraw && styles.resultTextDrawActive,
                      isSelected && isLoss && styles.resultTextLossActive,
                    ]}
                  >
                    {res === 'win' ? 'Win 1-0' : res === 'draw' ? 'Draw ½-½' : 'Loss 0-1'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGrid}>
          <View style={styles.fieldCol}>
            <Text style={styles.inputLabel}>Game date</Text>
            <TextInput
              style={styles.textInput}
              value={date}
              autoCapitalize="none"
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              onChangeText={(value) => {
                setDate(value);
                if (!monthManuallyChanged) {
                  try {
                    setRatingMonth(getRatingMonthFromDate(value));
                  } catch {
                    /* Keep last valid default while typing */
                  }
                }
              }}
              accessibilityLabel="Game date in YYYY-MM-DD format"
            />
          </View>

          <View style={styles.fieldCol}>
            <Text style={styles.inputLabel}>Rating month</Text>
            <TextInput
              style={styles.textInput}
              value={ratingMonth}
              autoCapitalize="none"
              placeholder="YYYY-MM"
              placeholderTextColor={colors.textMuted}
              onChangeText={(value) => {
                setMonthManuallyChanged(true);
                setRatingMonth(value);
              }}
              accessibilityLabel="Rating month in YYYY-MM format"
            />
          </View>
        </View>
      </View>

      {/* 5. Prominent Calculated Estimate & Action Section */}
      <View style={[styles.card, styles.estimateCard]}>
        <View style={styles.estimateHeader}>
          <Text style={styles.estimateTitle}>Calculated Estimate</Text>
          <Text style={styles.estimateNotice}>Unofficial FIDE Projection</Text>
        </View>

        <View style={styles.estimateValueContainer}>
          {showingEntryChange ? (
            <View style={styles.estimateRow}>
              <View
                style={[
                  styles.changeBadgeLarge,
                  (currentChange ?? 0) > 0
                    ? styles.changeBadgePositive
                    : (currentChange ?? 0) < 0
                      ? styles.changeBadgeNegative
                      : styles.changeBadgeZero,
                ]}
              >
                <Ionicons
                  name={
                    (currentChange ?? 0) > 0
                      ? 'arrow-up'
                      : (currentChange ?? 0) < 0
                        ? 'arrow-down'
                        : 'remove'
                  }
                  size={20}
                  color={
                    (currentChange ?? 0) > 0
                      ? colors.positiveText
                      : (currentChange ?? 0) < 0
                        ? colors.negativeText
                        : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.estimateNumber,
                    (currentChange ?? 0) > 0
                      ? styles.changeTextPositive
                      : (currentChange ?? 0) < 0
                        ? styles.changeTextNegative
                        : styles.changeTextZero,
                  ]}
                >
                  {(currentChange ?? 0) > 0 ? '+' : ''}
                  {currentChange}
                </Text>
              </View>

              <View style={styles.estimateSubDetails}>
                <Text style={styles.estimateNewRating}>
                  New Estimated Rating:{' '}
                  <Text style={styles.estimateHighlight}>
                    {Math.round((playerRating + (currentChange ?? 0)) * 10) / 10}
                  </Text>
                </Text>
                <Text style={styles.estimateSubMeta}>
                  Opponent: {opponentName || 'Opponent'} ({opponentRating})
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.estimatePlaceholder}>
              Tap <Text style={styles.boldText}>Calculate</Text> to preview rating change projection.
            </Text>
          )}
        </View>

        {!isFormValid && (
          <View style={styles.validationBanner}>
            <Ionicons name="information-circle-outline" size={18} color={colors.negativeText} />
            <Text style={styles.validationText}>
              Enter ratings between 100 and 3500, a game date (YYYY-MM-DD), and rating month (YYYY-MM).
            </Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryButton, !isFormValid && styles.buttonDisabled]}
            onPress={handleCalculate}
            disabled={!isFormValid}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Calculate rating change estimate"
          >
            <Ionicons name="calculator-outline" size={20} color={colors.primaryText} />
            <Text style={styles.primaryButtonText}>Calculate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (!isFormValid || saving) && styles.buttonDisabled,
            ]}
            onPress={handleTrackGame}
            disabled={saving || !isFormValid}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Track game to rating history"
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>
              {saving ? 'Saving…' : 'Track Game'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. This Month's Games List Card */}
      <View style={styles.card}>
        <View style={styles.gamesHeaderRow}>
          <Text style={styles.cardTitle}>
            ♜ This Month's Games ({currentMonthResults.length})
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('History')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.viewAllButton}
            accessibilityRole="button"
            accessibilityLabel="View all games in history"
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {currentMonthResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No games tracked for this month yet.</Text>
            <Text style={styles.emptySubtext}>
              Calculate and tap "Track Game" above to start logging.
            </Text>
          </View>
        ) : (
          <View style={styles.gamesList}>
            {currentMonthResults
              .slice()
              .reverse()
              .slice(0, 5)
              .map((r) => {
                const fullIndex = r.id
                  ? results.findIndex((x) => x.id === r.id)
                  : results.indexOf(r);
                const canDelete = removeResult != null && fullIndex !== -1;
                const isPositive = r.ratingChange > 0;
                const isNegative = r.ratingChange < 0;

                return (
                  <View key={r.id} style={styles.gameRow}>
                    <TouchableOpacity
                      style={styles.gameRowTouchable}
                      activeOpacity={0.7}
                      onPress={() => updateResult && setEditingGame(r)}
                      disabled={!updateResult}
                      accessibilityRole="button"
                      accessibilityLabel={`Game vs ${r.opponentName || 'Opponent'}`}
                    >
                      <View style={styles.gameAvatar}>
                        <Ionicons name="person" size={16} color={colors.primary} />
                      </View>
                      <View style={styles.gameMain}>
                        <Text style={styles.gameOpponent} numberOfLines={1}>
                          {r.opponentName || 'Opponent'} ({r.opponentRating})
                        </Text>
                        <Text style={styles.gameMeta}>
                          {r.date} · {r.result.toUpperCase()} · K={r.kFactor}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.gameChangeBadge,
                          isPositive
                            ? styles.changeBadgePositive
                            : isNegative
                              ? styles.changeBadgeNegative
                              : styles.changeBadgeZero,
                        ]}
                      >
                        <Text
                          style={[
                            styles.gameChangeText,
                            isPositive
                              ? styles.changeTextPositive
                              : isNegative
                                ? styles.changeTextNegative
                                : styles.changeTextZero,
                          ]}
                        >
                          {isPositive ? '+' : ''}
                          {r.ratingChange}
                        </Text>
                      </View>

                      {updateResult ? (
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.textMuted}
                          style={styles.chevronIcon}
                        />
                      ) : null}
                    </TouchableOpacity>

                    {canDelete ? (
                      <TouchableOpacity
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        onPress={() => {
                          Alert.alert(
                            'Delete game',
                            `Remove this game vs ${r.opponentName || 'Opponent'}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    const index = r.id
                                      ? latestResults.current.findIndex(
                                          (item) => item.id === r.id,
                                        )
                                      : latestResults.current.indexOf(r);
                                    if (index < 0)
                                      throw new Error('Game no longer exists.');
                                    if (
                                      getResultRatingMonth(
                                        latestResults.current[index],
                                      ) !== getRatingMonthFromDate(new Date())
                                    )
                                      throw new Error(
                                        'Only current rating-month games can be deleted.',
                                      );
                                    await removeResult(index);
                                  } catch (error) {
                                    Alert.alert(
                                      'Unable to delete game',
                                      error instanceof Error
                                        ? error.message
                                        : 'Please try again.',
                                    );
                                  }
                                },
                              },
                            ],
                          );
                        }}
                        style={styles.deleteButton}
                        accessibilityRole="button"
                        accessibilityLabel="Delete game"
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.negativeText} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}

            <View style={styles.summaryFooter}>
              <Text style={styles.summaryFooterText}>
                Month Net Change:{' '}
                <Text style={styles.summaryFooterHighlight}>
                  {currentMonthChange > 0 ? '+' : ''}
                  {currentMonthChange}
                </Text>
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Edit Game Modal */}
      {updateResult ? (
        <EditGameModal
          open={editingGame !== null}
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSave={async (updates) => {
            if (!editingGame) return;
            const index = editingGame.id
              ? latestResults.current.findIndex((r) => r.id === editingGame.id)
              : latestResults.current.indexOf(editingGame);
            if (index < 0) return;
            await updateResult(index, updates);
          }}
          onDelete={
            removeResult
              ? async () => {
                  if (!editingGame) return;
                  const index = editingGame.id
                    ? latestResults.current.findIndex(
                        (r) => r.id === editingGame.id,
                      )
                    : latestResults.current.indexOf(editingGame);
                  if (index < 0) return;
                  await removeResult(index);
                }
              : undefined
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },

  // Rating Type Tabs
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentTab: {
    flex: 1,
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control - 2,
  },
  segmentTabActive: {
    backgroundColor: colors.surfaceSelected,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  segmentText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '700',
  },

  // Base Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },

  // Badges
  badgePeach: {
    backgroundColor: colors.peach,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  badgePeachText: {
    ...typography.caption,
    color: colors.peachText,
    fontWeight: '700',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  statCol: {
    flex: 1,
  },
  statColRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    ...typography.caption,
    letterSpacing: 0.6,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  heroNumber: {
    ...typography.heroNumber,
    color: colors.textPrimary,
  },
  statSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Change Badges
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    gap: 2,
  },
  changeBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.control,
    gap: spacing.xs,
  },
  changeBadgePositive: {
    backgroundColor: colors.positiveBg,
  },
  changeBadgeNegative: {
    backgroundColor: colors.negativeBg,
  },
  changeBadgeZero: {
    backgroundColor: colors.neutralBg,
  },
  changeBadgeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  changeTextPositive: {
    color: colors.positiveText,
  },
  changeTextNegative: {
    color: colors.negativeText,
  },
  changeTextZero: {
    color: colors.textSecondary,
  },

  // WDL
  wdlSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  wdlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  wdlCounts: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Form Fields
  fieldGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldCol: {
    flex: 1,
  },
  formSpacing: {
    marginTop: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
  },
  textInput: {
    minHeight: touchTargets.min,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    ...typography.body,
    color: colors.textPrimary,
  },

  // Game Result Selector
  resultRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resultButton: {
    flex: 1,
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
  },
  resultButtonWinActive: {
    backgroundColor: colors.positiveBg,
    borderColor: colors.positiveText,
  },
  resultButtonDrawActive: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.primary,
  },
  resultButtonLossActive: {
    backgroundColor: colors.negativeBg,
    borderColor: colors.negativeText,
  },
  resultButtonText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  resultTextWinActive: {
    color: colors.positiveText,
    fontWeight: '700',
  },
  resultTextDrawActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  resultTextLossActive: {
    color: colors.negativeText,
    fontWeight: '700',
  },

  // Estimate Card & Actions
  estimateCard: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  estimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  estimateTitle: {
    ...typography.subheading,
    color: colors.primary,
  },
  estimateNotice: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  estimateValueContainer: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  estimateNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  estimateSubDetails: {
    flex: 1,
  },
  estimateNewRating: {
    ...typography.body,
    color: colors.textPrimary,
  },
  estimateHighlight: {
    fontWeight: '700',
    color: colors.primary,
  },
  estimateSubMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  estimatePlaceholder: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  boldText: {
    fontWeight: '700',
    color: colors.primary,
  },
  validationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.negativeBg,
    padding: spacing.md,
    borderRadius: radii.control,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  validationText: {
    flex: 1,
    ...typography.caption,
    color: colors.negativeText,
    fontWeight: '600',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1,
    minHeight: touchTargets.primaryControl,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: colors.primaryText,
  },
  secondaryButton: {
    flex: 1,
    minHeight: touchTargets.primaryControl,
    backgroundColor: colors.surfaceSelected,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  secondaryButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.45,
  },

  // Games List
  gamesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  viewAllText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  gamesList: {
    gap: spacing.sm,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  gameRowTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargets.min,
    gap: spacing.md,
  },
  gameAvatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameMain: {
    flex: 1,
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
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  gameChangeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  chevronIcon: {
    marginLeft: spacing.xs,
  },
  deleteButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
    minWidth: 40,
  },
  summaryFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  summaryFooterText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryFooterHighlight: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
