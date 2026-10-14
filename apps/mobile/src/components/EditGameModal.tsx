import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { GameResult, Result } from '@fide-calculator/shared';
import {
  calculateRatingChange,
  getRatingMonthFromDate,
  getResultRatingMonth,
  isValidRatingMonth,
} from '@fide-calculator/shared';
import { useTheme } from '../contexts/ThemeContext';
import DatePickerModal from './DatePickerModal';
import TacticalCard from './ui/TacticalCard';
import WinDrawLossSelector from './ui/WinDrawLossSelector';
import ChessInsignia from './ui/ChessInsignia';

type Props = {
  open: boolean;
  game: Result | null;
  onClose: () => void;
  onSave: (updates: Partial<Result>) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
};

export default function EditGameModal({ open, game, onClose, onSave, onDelete }: Props) {
  const { colors, radii, borderWidth, typography, touchTargets } = useTheme();
  const [opponentName, setOpponentName] = useState('');
  const [opponentRating, setOpponentRating] = useState(1400);
  const [kFactor, setKFactor] = useState(20);
  const [result, setResult] = useState<GameResult>('win');
  const [date, setDate] = useState(''); // YYYY-MM-DD preferred
  const [ratingMonth, setRatingMonth] = useState('');
  const [moving, setMoving] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!game) return;
    setOpponentName(game.opponentName ?? '');
    setOpponentRating(game.opponentRating ?? 1400);
    setKFactor(game.kFactor ?? 20);
    setResult(game.result ?? 'win');
    setDate(game.date ?? '');
    setRatingMonth(getResultRatingMonth(game));
  }, [game]);

  const isValidRating = (n: number) => n >= 100 && n <= 3500;

  const isFormValid = useMemo(() => {
    if (!game) return false;
    try {
      getRatingMonthFromDate(date);
    } catch {
      return false;
    }
    return (
      isValidRating(game.playerRating) &&
      isValidRating(opponentRating) &&
      isValidRatingMonth(ratingMonth)
    );
  }, [game, opponentRating, date, ratingMonth]);

  const newDelta = useMemo(() => {
    if (!game) return null;
    if (!isValidRating(game.playerRating) || !isValidRating(opponentRating)) return null;
    return calculateRatingChange(game.playerRating, opponentRating, result, kFactor);
  }, [game, opponentRating, result, kFactor]);

  const handleSave = async () => {
    if (!game) return;
    if (moving || !isFormValid || newDelta === null) return;
    setMoving(true);
    try {
      await onSave({
        opponentName,
        opponentRating,
        kFactor,
        result,
        date,
        ratingMonth,
        ratingChange: newDelta,
      });
      onClose();
    } catch (error) {
      Alert.alert('Unable to save game', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setMoving(false);
    }
  };

  const handleMoveToCurrentMonth = async () => {
    if (!game || moving) return;
    setMoving(true);
    try {
      await onSave({ ratingMonth: getRatingMonthFromDate(new Date()) });
      onClose();
    } catch (error) {
      Alert.alert('Unable to move game', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setMoving(false);
    }
  };

  const canDelete =
    !!game &&
    !!onDelete &&
    getResultRatingMonth(game) === getRatingMonthFromDate(new Date());

  const handleDelete = () => {
    if (!canDelete || moving) return;
    Alert.alert(
      'Delete game',
      `Remove this game vs ${game?.opponentName || 'Opponent'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!onDelete || moving) return;
            setMoving(true);
            try {
              await onDelete();
              onClose();
            } catch (error) {
              Alert.alert(
                'Unable to delete game',
                error instanceof Error ? error.message : 'Please try again.',
              );
            } finally {
              setMoving(false);
            }
          },
        },
      ],
    );
  };

  const hasIonicons = typeof Ionicons === 'function';

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* Backdrop touchable to dismiss when tapping above sheet */}
          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close edit game modal"
          />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.canvas,
                borderColor: colors.border,
                borderTopLeftRadius: radii.xl,
                borderTopRightRadius: radii.xl,
                borderWidth: borderWidth.heavy,
              },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.sheetHandleContainer}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            </View>

            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderBottomColor: colors.border,
                  borderBottomWidth: borderWidth.medium,
                },
              ]}
            >
              <View style={styles.headerTitleRow}>
                <ChessInsignia piece="knight" size={18} color={colors.primary} />
                <View>
                  <Text style={[styles.headerTag, { color: colors.primary }]}>
                    [ MATCH TELEMETRY // REVISION ]
                  </Text>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>Edit game</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: borderWidth.thin,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close edit game modal"
              >
                {hasIonicons ? (
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                ) : (
                  <Text style={[styles.closeIconText, { color: colors.textPrimary }]}>✕</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={true}
              scrollEventThrottle={16}
            >
              {!game ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No game selected.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Precision Scoreboard Card */}
                  <View
                    style={[
                      styles.estimateCard,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.primary,
                        borderWidth: borderWidth.medium,
                        borderRadius: radii.card,
                      },
                    ]}
                  >
                    <View style={styles.estimateRow}>
                      <View style={styles.estimateCol}>
                        <Text style={[styles.estimateLabel, { color: colors.textMuted }]}>
                          CURRENT RATING
                        </Text>
                        <Text
                          style={[
                            styles.estimateBaseValue,
                            { color: colors.textPrimary, ...typography.mono },
                          ]}
                        >
                          {game.playerRating}
                        </Text>
                      </View>

                      <View style={[styles.estimateCol, styles.estimateColRight]}>
                        <Text style={[styles.estimateLabel, { color: colors.textMuted }]}>
                          PROJECTED DELTA
                        </Text>
                        <View
                          style={[
                            styles.changeBadge,
                            {
                              backgroundColor:
                                newDelta !== null && newDelta > 0
                                  ? colors.positiveBg
                                  : newDelta !== null && newDelta < 0
                                    ? colors.negativeBg
                                    : colors.surfaceMuted,
                              borderColor:
                                newDelta !== null && newDelta > 0
                                  ? colors.positive
                                  : newDelta !== null && newDelta < 0
                                    ? colors.negative
                                    : colors.border,
                              borderWidth: borderWidth.thin,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.changeBadgeText,
                              {
                                color:
                                  newDelta !== null && newDelta > 0
                                    ? colors.positiveText
                                    : newDelta !== null && newDelta < 0
                                      ? colors.negativeText
                                      : colors.textSecondary,
                                ...typography.mono,
                              },
                            ]}
                          >
                            {newDelta === null
                              ? '—'
                              : `${newDelta > 0 ? '+' : ''}${newDelta}`}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.projectedFooter,
                        {
                          borderTopColor: colors.borderSubtle,
                          borderTopWidth: borderWidth.thin,
                        },
                      ]}
                    >
                      <Text style={[styles.estimateProjected, { color: colors.textSecondary }]}>
                        New rating projection:{' '}
                        <Text
                          style={[
                            styles.estimateHighlight,
                            { color: colors.primary, ...typography.mono },
                          ]}
                        >
                          {newDelta !== null
                            ? Math.round((game.playerRating + newDelta) * 10) / 10
                            : '—'}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  {/* Group 1: Opponent & Match */}
                  <TacticalCard
                    title="MATCH PARAMETERS"
                    badge={result.toUpperCase()}
                    variant="default"
                  >
                    <View style={styles.fieldSpacing}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>OPPONENT NAME</Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            color: colors.textPrimary,
                            borderWidth: borderWidth.thin,
                            borderRadius: radii.sm,
                          },
                        ]}
                        value={opponentName}
                        onChangeText={setOpponentName}
                        placeholder="Opponent name"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>

                    <View style={styles.fieldGrid}>
                      <View style={styles.fieldCol}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>
                          OPPONENT RATING
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                              color: colors.textPrimary,
                              borderWidth: borderWidth.thin,
                              borderRadius: radii.sm,
                              ...typography.mono,
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
                        />
                      </View>

                      <View style={styles.fieldCol}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>K-FACTOR</Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                              color: colors.textPrimary,
                              borderWidth: borderWidth.thin,
                              borderRadius: radii.sm,
                              ...typography.mono,
                            },
                          ]}
                          value={String(kFactor)}
                          keyboardType="numeric"
                          placeholder="20"
                          placeholderTextColor={colors.textMuted}
                          onChangeText={(text) => {
                            const n = Number(text.replace(/[^0-9]/g, ''));
                            setKFactor(Number.isNaN(n) ? 0 : n);
                          }}
                        />
                      </View>
                    </View>

                    <View style={styles.fieldSpacing}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>
                        MATCH OUTCOME
                      </Text>
                      <WinDrawLossSelector
                        value={result === 'win' ? 1 : result === 'draw' ? 0.5 : 0}
                        onChange={(val) => {
                          setResult(val === 1 ? 'win' : val === 0.5 ? 'draw' : 'loss');
                        }}
                      />
                    </View>
                  </TacticalCard>

                  {/* Group 2: Date & Rating Period */}
                  <TacticalCard
                    title="TEMPORAL AUDIT"
                    badge={ratingMonth || 'CURRENT'}
                    variant="default"
                  >
                    <View style={styles.fieldGrid}>
                      <View style={styles.fieldCol}>
                        <Text
                          style={[styles.label, { color: colors.textMuted }]}
                          numberOfLines={1}
                        >
                          GAME DATE
                        </Text>
                        <View style={styles.dateInputWrapper}>
                          <TextInput
                            style={[
                              styles.dateInput,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                color: colors.textPrimary,
                                borderWidth: borderWidth.thin,
                                borderRadius: radii.sm,
                                ...typography.mono,
                              },
                            ]}
                            value={date}
                            onChangeText={setDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                            accessibilityLabel="Game date"
                          />
                          <TouchableOpacity
                            style={[
                              styles.calendarIconButton,
                              {
                                backgroundColor: colors.surfaceMuted,
                                borderColor: colors.border,
                                borderWidth: borderWidth.thin,
                                borderRadius: radii.sm,
                              },
                            ]}
                            onPress={() => setDatePickerOpen(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Calendar date picker"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={{ fontSize: 16 }}>📅</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.fieldCol}>
                        <Text
                          style={[styles.label, { color: colors.textMuted }]}
                          numberOfLines={1}
                        >
                          RATING MONTH
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                              color: colors.textPrimary,
                              borderWidth: borderWidth.thin,
                              borderRadius: radii.sm,
                              ...typography.mono,
                            },
                          ]}
                          value={ratingMonth}
                          onChangeText={setRatingMonth}
                          placeholder="YYYY-MM"
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="none"
                          accessibilityLabel="Rating month"
                        />
                      </View>
                    </View>

                    {/* Quick Date Shortcuts */}
                    <View style={styles.quickDateRow}>
                      <TouchableOpacity
                        style={[
                          styles.quickDateChip,
                          {
                            backgroundColor: colors.surfaceMuted,
                            borderColor: colors.borderSubtle,
                            borderWidth: borderWidth.thin,
                            borderRadius: radii.sm,
                          },
                        ]}
                        onPress={() => {
                          const now = new Date();
                          const y = now.getFullYear();
                          const m = String(now.getMonth() + 1).padStart(2, '0');
                          const d = String(now.getDate()).padStart(2, '0');
                          setDate(`${y}-${m}-${d}`);
                        }}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.quickDateChipText, { color: colors.textPrimary }]}>
                          [ TODAY ]
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.quickDateChip,
                          {
                            backgroundColor: colors.surfaceMuted,
                            borderColor: colors.borderSubtle,
                            borderWidth: borderWidth.thin,
                            borderRadius: radii.sm,
                          },
                        ]}
                        onPress={() => {
                          const yest = new Date();
                          yest.setDate(yest.getDate() - 1);
                          const y = yest.getFullYear();
                          const m = String(yest.getMonth() + 1).padStart(2, '0');
                          const d = String(yest.getDate()).padStart(2, '0');
                          setDate(`${y}-${m}-${d}`);
                        }}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.quickDateChipText, { color: colors.textPrimary }]}>
                          [ YESTERDAY ]
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TacticalCard>

                  {!isFormValid ? (
                    <View
                      style={[
                        styles.validationBox,
                        {
                          backgroundColor: colors.negativeBg,
                          borderColor: colors.negative,
                          borderWidth: borderWidth.thin,
                          borderRadius: radii.sm,
                        },
                      ]}
                    >
                      <Text style={[styles.validationIcon, { color: colors.negativeText }]}>⚠</Text>
                      <Text style={[styles.validationText, { color: colors.negativeText }]}>
                        Please enter valid ratings, a game date and a rating month (YYYY-MM).
                      </Text>
                    </View>
                  ) : null}

                  {/* Secondary Actions Section inside ScrollView */}
                  <View style={styles.secondaryActionsContainer}>
                    {/* Move to Current Month */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Move to Current Month"
                      style={[
                        styles.secondaryMoveButton,
                        {
                          backgroundColor: colors.surfaceMuted,
                          borderColor: colors.border,
                          borderWidth: borderWidth.medium,
                          borderRadius: radii.sm,
                        },
                        moving && styles.buttonDisabled,
                      ]}
                      onPress={handleMoveToCurrentMonth}
                      disabled={moving}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.secondaryMoveButtonText, { color: colors.textPrimary }]}>
                        Move to Current Month
                      </Text>
                    </TouchableOpacity>

                    {/* Restrained Delete Game Button */}
                    {canDelete ? (
                      <View style={styles.deleteSection}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Delete game"
                          style={[
                            styles.deleteButton,
                            {
                              backgroundColor: colors.negativeBg,
                              borderColor: colors.negative,
                              borderWidth: borderWidth.medium,
                              borderRadius: radii.sm,
                            },
                            moving && styles.buttonDisabled,
                          ]}
                          onPress={handleDelete}
                          disabled={moving}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.deleteButtonText, { color: colors.negativeText }]}>
                            Delete game
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Pinned Sticky Save Button Footer */}
            {game ? (
              <View
                style={[
                  styles.stickyFooter,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderTopColor: colors.border,
                    borderTopWidth: borderWidth.medium,
                    paddingBottom: Math.max(insets.bottom, 16),
                  },
                ]}
              >
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Save changes"
                  style={[
                    styles.primarySaveButton,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.border,
                      borderWidth: borderWidth.medium,
                      borderRadius: radii.sm,
                      minHeight: touchTargets.primaryControl,
                    },
                    (moving || !isFormValid || newDelta === null) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={moving || !isFormValid || newDelta === null}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primarySaveButtonText, { color: colors.primaryText }]}>
                    Save changes
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Date Picker Modal */}
            <DatePickerModal
              open={datePickerOpen}
              value={date}
              onClose={() => setDatePickerOpen(false)}
              onSelect={(selected) => {
                setDate(selected);
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '94%',
    overflow: 'hidden',
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  closeIconText: {
    fontSize: 16,
    fontWeight: '900',
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Estimate Summary Card
  estimateCard: {
    padding: 16,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimateCol: {
    flex: 1,
  },
  estimateColRight: {
    alignItems: 'flex-end',
  },
  estimateLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  estimateBaseValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  changeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  changeBadgeText: {
    fontSize: 18,
    fontWeight: '900',
  },
  projectedFooter: {
    marginTop: 12,
    paddingTop: 10,
  },
  estimateProjected: {
    fontSize: 13,
    fontWeight: '700',
  },
  estimateHighlight: {
    fontWeight: '900',
    fontSize: 16,
  },

  fieldSpacing: {
    marginTop: 10,
  },
  fieldGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  fieldCol: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  calendarIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickDateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickDateChipText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  validationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  validationIcon: {
    fontSize: 14,
    fontWeight: '900',
  },
  validationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },

  secondaryActionsContainer: {
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  secondaryMoveButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryMoveButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  deleteSection: {
    marginTop: 4,
  },
  deleteButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  stickyFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  primarySaveButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySaveButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
