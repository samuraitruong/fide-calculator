import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from '../types/navigation';
import type { GameResult, RatingType, Result, FidePlayer } from '@fide-calculator/shared';
import { calculateRatingChange, getRatingMonthFromDate, getResultRatingMonth, isValidRatingMonth } from '@fide-calculator/shared';
import { useTheme } from '../contexts/ThemeContext';
import FideSearchInput from './FideSearchInput';
import WinDrawLossBar from './WinDrawLossBar';
import EditGameModal from './EditGameModal';
import DatePickerModal from './DatePickerModal';
import StatHeroCard from './ui/StatHeroCard';
import TacticalCard from './ui/TacticalCard';
import TacticalButton from './ui/TacticalButton';
import WinDrawLossSelector from './ui/WinDrawLossSelector';
import ChessInsignia from './ui/ChessInsignia';

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
  const { colors, radii, borderWidth, touchTargets } = useTheme();
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
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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

  // Keep calculation updated once calculated
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
  const liveRating = Math.round(playerRating + currentMonthChange);
  const showingEntryChange = hasCalculated && currentChange !== null;

  return (
    <View style={styles.container}>
      {/* 1. Rating Type Segmented Control */}
      <View
        style={[
          styles.segmentContainer,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            borderWidth: borderWidth.default,
            borderRadius: radii.control,
          },
        ]}
      >
        {ratingTypes.map((type) => {
          const isActive = ratingType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.segmentTab,
                {
                  minHeight: touchTargets.min - 6,
                  borderRadius: radii.control - 2,
                  backgroundColor: isActive ? colors.surface : 'transparent',
                  borderColor: isActive ? colors.borderAccent : 'transparent',
                  borderWidth: isActive ? 1.5 : 0,
                },
              ]}
              onPress={() => onChangeRatingType(type)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${type} rating mode`}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: isActive ? colors.primary : colors.textSecondary,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. DGT Tournament Clock Readout Hero Card */}
      <StatHeroCard
        currentRating={playerRating}
        projectedRating={liveRating}
        delta={currentMonthChange}
        gamesCount={currentMonthResults.length}
        kFactor={kFactor}
        ratingType={ratingType}
      />

      {/* 3. Monthly Record WDL Summary */}
      <TacticalCard variant="elevated" hasOffsetShadow={false} style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <Text style={[styles.cardTitleText, { color: colors.textPrimary }]}>
            MONTHLY RECORD ({currentMonthResults.length} GAMES)
          </Text>
          <View style={[styles.kBadge, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Text style={[styles.kBadgeText, { color: colors.accent }]}>FIDE RATED</Text>
          </View>
        </View>
        <WinDrawLossBar wins={wdl.wins} draws={wdl.draws} losses={wdl.losses} showLegend={true} />
      </TacticalCard>

      {/* 4. Player & Opponent Console Card */}
      <TacticalCard
        variant="default"
        hasOffsetShadow={true}
        cornerAccents={true}
        tag="PLAYER & OPPONENT SETUP"
      >
        <View style={styles.fieldGrid}>
          <View style={styles.fieldCol}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>YOUR RATING</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.borderInput,
                  color: colors.textPrimary,
                  borderRadius: radii.control,
                },
              ]}
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
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>K-FACTOR</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.borderInput,
                  color: colors.textPrimary,
                  borderRadius: radii.control,
                },
              ]}
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
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>OPPONENT FIDE SEARCH</Text>
          <FideSearchInput
            value={opponentName}
            onChange={setOpponentName}
            onSelect={handleSelectOpponent}
            placeholder="Search FIDE players or enter opponent name..."
          />
        </View>

        <View style={styles.formSpacing}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>OPPONENT RATING</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.borderInput,
                color: colors.textPrimary,
                borderRadius: radii.control,
              },
            ]}
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
      </TacticalCard>

      {/* 5. Match Outcome & Game Date Card */}
      <TacticalCard
        variant="default"
        hasOffsetShadow={true}
        cornerAccents={true}
        tag="MATCH OUTCOME & DATE"
      >
        <View style={styles.formSpacingTop}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>RESULT SELECTION</Text>
          <WinDrawLossSelector
            value={gameResult}
            onChange={(_score, type) => setGameResult(type)}
          />
        </View>

        <View style={[styles.fieldGrid, styles.formSpacing]}>
          <View style={styles.fieldCol}>
            <View style={styles.labelWithActionRow}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GAME DATE</Text>
              <TouchableOpacity
                style={[
                  styles.openPickerQuickButton,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                ]}
                onPress={() => setDatePickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Open calendar date picker"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                <Text style={[styles.openPickerQuickText, { color: colors.primary }]}>Pick</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputWrapper}>
              <TextInput
                style={[
                  styles.dateTextInput,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.borderInput,
                    color: colors.textPrimary,
                    borderRadius: radii.control,
                  },
                ]}
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
              <TouchableOpacity
                style={styles.calendarIconButton}
                onPress={() => setDatePickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Calendar date picker"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.calendarEmoji}>📅</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldCol}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>RATING MONTH</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.borderInput,
                  color: colors.textPrimary,
                  borderRadius: radii.control,
                },
              ]}
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
      </TacticalCard>

      {/* 6. Calculated Estimate Display Card */}
      <TacticalCard
        variant="elevated"
        hasOffsetShadow={false}
        style={{ borderColor: colors.borderAccent, borderWidth: borderWidth.heavy }}
      >
        <View style={styles.estimateHeader}>
          <Text style={[styles.estimateTitle, { color: colors.primary }]}>CALCULATED ESTIMATE</Text>
          {showingEntryChange && (
            <View style={[styles.kBadge, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[styles.kBadgeText, { color: colors.textSecondary }]}>LIVE PREVIEW</Text>
            </View>
          )}
        </View>

        <View style={[styles.estimateValueContainer, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          {showingEntryChange ? (
            <View style={styles.estimateRow}>
              <View
                style={[
                  styles.changeBadgeLarge,
                  {
                    backgroundColor: (currentChange ?? 0) > 0 ? colors.winBg : (currentChange ?? 0) < 0 ? colors.lossBg : colors.surfaceElevated,
                    borderColor: (currentChange ?? 0) > 0 ? colors.win : (currentChange ?? 0) < 0 ? colors.loss : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={(currentChange ?? 0) > 0 ? 'arrow-up' : (currentChange ?? 0) < 0 ? 'arrow-down' : 'remove'}
                  size={20}
                  color={(currentChange ?? 0) > 0 ? colors.win : (currentChange ?? 0) < 0 ? colors.loss : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.estimateNumber,
                    {
                      color: (currentChange ?? 0) > 0 ? colors.win : (currentChange ?? 0) < 0 ? colors.loss : colors.textSecondary,
                    },
                  ]}
                >
                  {(currentChange ?? 0) > 0 ? '+' : ''}
                  {currentChange}
                </Text>
              </View>

              <View style={styles.estimateSubDetails}>
                <Text style={[styles.estimateNewRating, { color: colors.textPrimary }]}>
                  Projected Rating:{' '}
                  <Text style={[styles.estimateHighlight, { color: colors.primary }]}>
                    {Math.round((playerRating + (currentChange ?? 0)) * 10) / 10}
                  </Text>
                </Text>
                <Text style={[styles.estimateSubMeta, { color: colors.textSecondary }]}>
                  Opponent: {opponentName || 'Opponent'} ({opponentRating})
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.estimatePlaceholder, { color: colors.textSecondary }]}>
              Tap <Text style={{ color: colors.primary, fontWeight: '700' }}>Calculate</Text> to preview rating change.
            </Text>
          )}
        </View>

        {!isFormValid && (
          <View style={[styles.validationBanner, { backgroundColor: colors.lossBg, borderColor: colors.loss }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.loss} />
            <Text style={[styles.validationText, { color: colors.loss }]}>
              Enter ratings between 100-3500, a game date (YYYY-MM-DD), and rating month (YYYY-MM).
            </Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TacticalButton
            title="Calculate"
            onPress={handleCalculate}
            disabled={!isFormValid}
            variant="accent"
            size="lg"
            style={{ flex: 1 }}
            icon={<Ionicons name="calculator-outline" size={18} color={colors.accentText} />}
          />

          <TacticalButton
            title={saving ? 'Tracking…' : 'Track Game'}
            onPress={handleTrackGame}
            disabled={saving || !isFormValid}
            loading={saving}
            variant="primary"
            size="lg"
            style={{ flex: 1 }}
            icon={<Ionicons name="add-circle-outline" size={18} color={colors.primaryText} />}
          />
        </View>
      </TacticalCard>

      {/* 7. Tournament Games List Card */}
      <TacticalCard variant="default" hasOffsetShadow={true}>
        <View style={styles.gamesHeaderRow}>
          <View style={styles.gamesHeaderLeft}>
            <ChessInsignia piece="rook" size={16} badgeSize={28} color={colors.primary} />
            <Text style={[styles.cardTitleText, { color: colors.textPrimary }]}>
              THIS MONTH'S GAMES ({currentMonthResults.length})
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('History')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.viewAllButton}
            accessibilityRole="button"
            accessibilityLabel="View all games in history"
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>VIEW ALL</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {currentMonthResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ChessInsignia piece="pawn" size={24} badgeSize={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No games tracked for this month yet.</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Calculate and tap "Track Game" above to log tournament matches.
            </Text>
          </View>
        ) : (
          <View style={styles.gamesList}>
            {currentMonthResults
              .slice()
              .reverse()
              .slice(0, 5)
              .map((r, index) => {
                const fullIndex = r.id
                  ? results.findIndex((x) => x.id === r.id)
                  : results.indexOf(r);
                const canDelete = removeResult != null && fullIndex !== -1;
                const isPositive = r.ratingChange > 0;
                const isNegative = r.ratingChange < 0;
                const roundNum = currentMonthResults.length - index;

                return (
                  <View
                    key={r.id}
                    style={[
                      styles.gameRow,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                        borderRadius: radii.card,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.gameRowTouchable}
                      activeOpacity={0.7}
                      onPress={() => updateResult && setEditingGame(r)}
                      disabled={!updateResult}
                      accessibilityRole="button"
                      accessibilityLabel={`Game vs ${r.opponentName || 'Opponent'}`}
                    >
                      {/* Opponent Row */}
                      <View style={styles.gameOpponentRow}>
                        <View style={[styles.roundBadge, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                          <Text style={[styles.roundBadgeText, { color: colors.accent }]}>#{roundNum}</Text>
                        </View>
                        <Text style={[styles.gameOpponent, { color: colors.textPrimary }]} numberOfLines={1}>
                          {r.opponentName || 'Opponent'} ({r.opponentRating})
                        </Text>
                      </View>

                      {/* Meta Row: Date, Result, K, and Delta */}
                      <View style={styles.gameMetaRow}>
                        <Text style={[styles.gameMeta, { color: colors.textSecondary }]}>
                          {r.date} · {r.result.toUpperCase()} · K={r.kFactor}
                        </Text>

                        <View style={styles.gameBadgeAndChevron}>
                          <View
                            style={[
                              styles.gameChangeBadge,
                              {
                                backgroundColor: isPositive ? colors.winBg : isNegative ? colors.lossBg : colors.surfaceMuted,
                                borderColor: isPositive ? colors.win : isNegative ? colors.loss : colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.gameChangeText,
                                {
                                  color: isPositive ? colors.win : isNegative ? colors.loss : colors.textSecondary,
                                },
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
                        </View>
                      </View>
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
                                    const delIndex = r.id
                                      ? latestResults.current.findIndex(
                                        (item) => item.id === r.id,
                                      )
                                      : latestResults.current.indexOf(r);
                                    if (delIndex < 0)
                                      throw new Error('Game no longer exists.');
                                    if (
                                      getResultRatingMonth(
                                        latestResults.current[delIndex],
                                      ) !== getRatingMonthFromDate(new Date())
                                    )
                                      throw new Error(
                                        'Only current rating-month games can be deleted.',
                                      );
                                    await removeResult(delIndex);
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
                        style={[styles.deleteButton, { borderLeftColor: colors.border }]}
                        accessibilityRole="button"
                        accessibilityLabel="Delete game"
                      >
                        <Ionicons name="trash-outline" size={17} color={colors.loss} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}

            <View style={[styles.summaryFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.summaryFooterText, { color: colors.textSecondary }]}>
                Month Net Change:{' '}
                <Text
                  style={[
                    styles.summaryFooterHighlight,
                    {
                      color: currentMonthChange > 0 ? colors.win : currentMonthChange < 0 ? colors.loss : colors.textPrimary,
                    },
                  ]}
                >
                  {currentMonthChange > 0 ? '+' : ''}
                  {currentMonthChange} pts
                </Text>
              </Text>
            </View>
          </View>
        )}
      </TacticalCard>

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

      {/* Date Picker Modal */}
      <DatePickerModal
        open={datePickerOpen}
        value={date}
        onClose={() => setDatePickerOpen(false)}
        onSelect={(selected) => {
          setDate(selected);
          if (!monthManuallyChanged) {
            try {
              setRatingMonth(getRatingMonthFromDate(selected));
            } catch {
              /* Keep last valid default */
            }
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 12,
    letterSpacing: 0.6,
  },
  recordCard: {
    padding: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitleText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  kBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  kBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fieldGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldCol: {
    flex: 1,
  },
  formSpacing: {
    marginTop: 12,
  },
  formSpacingTop: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
    minHeight: 18,
  },
  textInput: {
    minHeight: 48,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    ...(Platform.OS === 'web' ? ({ touchAction: 'pan-y' } as Record<string, unknown>) : {}),
  },
  labelWithActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    minHeight: 18,
  },
  openPickerQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  openPickerQuickText: {
    fontWeight: '700',
    fontSize: 10,
  },
  dateInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  dateTextInput: {
    minHeight: 48,
    borderWidth: 1.5,
    paddingLeft: 12,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    ...(Platform.OS === 'web' ? ({ touchAction: 'pan-y' } as Record<string, unknown>) : {}),
  },
  calendarIconButton: {
    position: 'absolute',
    right: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarEmoji: {
    fontSize: 16,
  },
  estimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  estimateTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  estimateValueContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  changeBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  estimateNumber: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  estimateSubDetails: {
    flex: 1,
  },
  estimateNewRating: {
    fontSize: 14,
    fontWeight: '600',
  },
  estimateHighlight: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  estimateSubMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  estimatePlaceholder: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 6,
  },
  validationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  validationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gamesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gamesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    paddingHorizontal: 4,
    gap: 2,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  gamesList: {
    gap: 8,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  gameRowTouchable: {
    flex: 1,
    flexDirection: 'column',
    gap: 6,
  },
  gameOpponentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  roundBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  roundBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  gameOpponent: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  gameMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  gameMeta: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 8,
  },
  gameBadgeAndChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gameChangeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  gameChangeText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  chevronIcon: {
    marginLeft: 2,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 40,
    borderLeftWidth: 1,
    marginLeft: 4,
  },
  summaryFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  summaryFooterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryFooterHighlight: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
