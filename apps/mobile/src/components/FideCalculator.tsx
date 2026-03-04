import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { GameResult, RatingType, Result, FidePlayer } from '@fide-calculator/shared';
import { calculateRatingChange } from '@fide-calculator/shared';
import FideSearchInput from './FideSearchInput';
import WinDrawLossBar from '@/components/WinDrawLossBar';
import EditGameModal from '@/components/EditGameModal';

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

function parseMonthKeyToDate(monthKey: string): Date | null {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  if (!Number.isFinite(year) || !monthRaw) return null;

  const monthTrimmed = monthRaw.trim();
  const numericMonth = Number(monthTrimmed);
  if (Number.isFinite(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
    return new Date(year, numericMonth - 1, 1);
  }

  const monthToken = monthTrimmed.slice(0, 3).toLowerCase();
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const idx = monthNames.indexOf(monthToken);
  if (idx === -1) return null;
  return new Date(year, idx, 1);
}

function isCurrentMonthForMonthKey(monthKey: string, now: Date): boolean {
  const d = parseMonthKeyToDate(monthKey);
  if (!d) return false;
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function FideCalculatorMobile({
  mode,
  ratingType,
  onChangeRatingType,
  profile,
  results,
  addResult,
  updateResult,
}: FideCalculatorProps) {
  const [playerRating, setPlayerRating] = useState<number>(
    profile ? getProfileRatingForType(profile, ratingType) : 1500,
  );
  const [playerRatingManuallyChanged, setPlayerRatingManuallyChanged] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [opponentRating, setOpponentRating] = useState(1400);
  const [kFactor, setKFactor] = useState(getDefaultK(ratingType));
  const [gameResult, setGameResult] = useState<GameResult>('win');
  const [currentChange, setCurrentChange] = useState<number | null>(null);
  const [editingGame, setEditingGame] = useState<Result | null>(null);

  // When rating type or profile changes, reset defaults
  useEffect(() => {
    setPlayerRatingManuallyChanged(false);
    if (profile && !playerRatingManuallyChanged) {
      setPlayerRating(getProfileRatingForType(profile, ratingType));
    }
    setKFactor(getDefaultK(ratingType));
    setCurrentChange(null);
  }, [profile, ratingType]);

  const typeResults = useMemo(
    () => results.filter((r) => r.ratingType === ratingType),
    [results, ratingType],
  );

  const currentMonthResults = useMemo(() => {
    const now = new Date();
    return typeResults.filter((r) => {
      if (r.monthKey) {
        return isCurrentMonthForMonthKey(r.monthKey, now);
      }
      if (!r.date) return false;
      const d = new Date(r.date);
      return Number.isFinite(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
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

  const isFormValid = isValidRating(playerRating) && isValidRating(opponentRating);

  // If user already calculated once, keep it live-updated when inputs change
  useEffect(() => {
    if (currentChange === null) return;
    if (!isFormValid) return;
    const delta = calculateRatingChange(playerRating, opponentRating, gameResult, kFactor);
    setCurrentChange(delta);
  }, [currentChange, playerRating, opponentRating, gameResult, kFactor, isFormValid]);

  const handleCalculate = () => {
    if (!isFormValid) return;
    const delta = calculateRatingChange(playerRating, opponentRating, gameResult, kFactor);
    setCurrentChange(delta);
  };

  const handleTrackGame = async () => {
    if (!isFormValid) return;
    const delta = calculateRatingChange(playerRating, opponentRating, gameResult, kFactor);
    setCurrentChange(delta);

    const now = new Date();
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const monthKey = `${now.getFullYear()}-${now.toLocaleDateString('en-US', {
      month: 'short',
    })}`;

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
      monthKey,
    };

    await Promise.resolve(addResult(newResult));

    // Keep player rating as the base (official) rating like web.
    // Live Rating will reflect the current-month progress.
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

  const liveColor =
    currentMonthChange > 0 ? '#059669' : currentMonthChange < 0 ? '#b91c1c' : '#374151';

  return (
    <View style={styles.container}>
      <View style={[styles.section, styles.sectionTop]}>
        <View style={styles.ratingTypeRow}>
          {ratingTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.ratingTypeButton,
                ratingType === type && styles.ratingTypeButtonActive,
              ]}
              onPress={() => onChangeRatingType(type)}
            >
              <Text
                style={[
                  styles.ratingTypeText,
                  ratingType === type && styles.ratingTypeTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.topCards}>
        <View style={styles.topCard}>
          <Text style={styles.topCardLabel}>Rating change</Text>
          <View style={styles.topCardValueRow}>
            {currentChange !== null ? (
              <Ionicons
                name={currentChange > 0 ? 'arrow-up' : currentChange < 0 ? 'arrow-down' : 'remove'}
                size={18}
                color={currentChange > 0 ? '#059669' : currentChange < 0 ? '#b91c1c' : '#9ca3af'}
              />
            ) : null}
            <Text
              style={[
                styles.topCardValue,
                currentChange !== null && currentChange > 0
                  ? styles.positive
                  : currentChange !== null && currentChange < 0
                    ? styles.negative
                    : null,
              ]}
            >
              {currentChange === null ? '—' : `${currentChange > 0 ? '+' : ''}${currentChange}`}
            </Text>
          </View>
          <Text style={styles.topCardSubtext}>
            {currentChange === null ? 'Tap Calculate' : `New rating: ${playerRating + currentChange}`}
          </Text>
        </View>

        <View style={styles.topCard}>
          <Text style={styles.topCardLabel}>Live rating</Text>
          <View style={styles.topCardValueRow}>
            <Ionicons
              name={currentMonthChange > 0 ? 'arrow-up' : currentMonthChange < 0 ? 'arrow-down' : 'remove'}
              size={18}
              color={liveColor}
            />
            <Text style={[styles.topCardValue, { color: liveColor }]}>{liveRating}</Text>
          </View>
          <Text style={[styles.topCardSubtext, { color: liveColor }]}>
            {currentMonthChange >= 0 ? '+' : ''}
            {currentMonthChange} this month
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>This month</Text>
        <WinDrawLossBar wins={wdl.wins} draws={wdl.draws} losses={wdl.losses} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Your rating</Text>
        <TextInput
          style={styles.input}
          value={String(playerRating)}
          keyboardType="numeric"
          onChangeText={(text) => {
            const n = Number(text.replace(/[^0-9]/g, ''));
            setPlayerRating(Number.isNaN(n) ? 0 : n);
            setPlayerRatingManuallyChanged(true);
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Opponent</Text>
        <FideSearchInput
          value={opponentName}
          onChange={setOpponentName}
          onSelect={handleSelectOpponent}
          placeholder="Search FIDE players or type name..."
        />
        <Text style={[styles.label, styles.subLabel]}>Opponent rating</Text>
        <TextInput
          style={styles.input}
          value={String(opponentRating)}
          keyboardType="numeric"
          onChangeText={(text) => {
            const n = Number(text.replace(/[^0-9]/g, ''));
            setOpponentRating(Number.isNaN(n) ? 0 : n);
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Game result</Text>
        <View style={styles.resultRow}>
          {(['win', 'draw', 'loss'] as GameResult[]).map((res) => (
            <TouchableOpacity
              key={res}
              style={[
                styles.resultButton,
                gameResult === res && styles.resultButtonActive,
              ]}
              onPress={() => setGameResult(res)}
            >
              <Text
                style={[
                  styles.resultText,
                  gameResult === res && styles.resultTextActive,
                ]}
              >
                {res === 'win' ? 'Win' : res === 'draw' ? 'Draw' : 'Loss'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>K-factor</Text>
        <TextInput
          style={styles.input}
          value={String(kFactor)}
          keyboardType="numeric"
          onChangeText={(text) => {
            const n = Number(text.replace(/[^0-9]/g, ''));
            setKFactor(Number.isNaN(n) ? getDefaultK(ratingType) : n);
          }}
        />
      </View>

      {!isFormValid && (
        <Text style={styles.validationText}>
          Ratings should be between 100 and 3500.
        </Text>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.primaryButton, !isFormValid && styles.buttonDisabled]}
          onPress={handleCalculate}
          disabled={!isFormValid}
        >
          <Text style={styles.primaryButtonText}>Calculate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, !isFormValid && styles.buttonDisabled]}
          onPress={handleTrackGame}
          disabled={!isFormValid}
        >
          <Text style={styles.secondaryButtonText}>Track game</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>This month games ({currentMonthResults.length})</Text>
        {currentMonthResults.length === 0 ? (
          <Text style={styles.emptyText}>No games tracked yet.</Text>
        ) : (
          <>
            {currentMonthResults
              .slice()
              .reverse()
              .slice(0, 5)
              .map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.gameRow}
                  activeOpacity={0.7}
                  onPress={() => updateResult && setEditingGame(r)}
                  disabled={!updateResult}
                >
                  <View style={styles.gameMain}>
                    <Text style={styles.gameOpponent}>{r.opponentName || 'Opponent'}</Text>
                    <Text style={styles.gameMeta}>
                      {r.date} • {r.result.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.gameChange,
                      r.ratingChange > 0
                        ? styles.gameChangePositive
                        : r.ratingChange < 0
                        ? styles.gameChangeNegative
                        : null,
                    ]}
                  >
                    {r.ratingChange > 0 ? '+' : ''}
                    {r.ratingChange}
                  </Text>
                  {updateResult ? (
                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" style={{ marginLeft: 8 }} />
                  ) : null}
                </TouchableOpacity>
              ))}
            <Text style={styles.summaryText}>
              This month total: {currentMonthChange > 0 ? '+' : ''}
              {currentMonthChange}
            </Text>
          </>
        )}
      </View>

      {updateResult ? (
        <EditGameModal
          open={editingGame !== null}
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSave={async (updates) => {
            if (!editingGame) return;
            const idx = results.findIndex((r) => r.id === editingGame.id);
            if (idx !== -1) await Promise.resolve(updateResult(idx, updates));
            setEditingGame(null);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 0,
    padding: 0,
    backgroundColor: 'transparent',
  },
  topCards: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 0,
  },
  topCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  topCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  topCardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topCardValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  topCardSubtext: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#b91c1c',
  },
  section: {
    marginTop: 12,
  },
  sectionTop: {
    marginTop: 0,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  subLabel: {
    marginTop: 8,
  },
  ratingTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  ratingTypeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  ratingTypeText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  ratingTypeTextActive: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  resultRow: {
    flexDirection: 'row',
    gap: 8,
  },
  resultButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  resultButtonActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  resultText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  resultTextActive: {
    color: '#ecfdf5',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  validationText: {
    marginTop: 8,
    fontSize: 12,
    color: '#b91c1c',
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  gameMain: {
    flex: 1,
    marginRight: 8,
  },
  gameOpponent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  gameMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  gameChange: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  gameChangePositive: {
    color: '#059669',
  },
  gameChangeNegative: {
    color: '#b91c1c',
  },
  summaryText: {
    marginTop: 6,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
});

