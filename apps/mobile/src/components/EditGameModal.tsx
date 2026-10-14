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
import { colors, radii, spacing, typography, touchTargets, shadows } from '../theme/tokens';
import DatePickerModal from './DatePickerModal';

type Props = {
  open: boolean;
  game: Result | null;
  onClose: () => void;
  onSave: (updates: Partial<Result>) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
};

export default function EditGameModal({ open, game, onClose, onSave, onDelete }: Props) {
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

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
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

          <View style={styles.sheet}>
            <View style={styles.sheetHandleContainer}>
              <View style={styles.sheetHandle} />
            </View>

            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerMotif}>⚔</Text>
                <Text style={styles.title}>Edit game</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close edit game modal"
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
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
                  <Text style={styles.emptyText}>No game selected.</Text>
                </View>
              ) : (
                <>
                  {/* Estimate Summary Card */}
                  <View style={styles.estimateCard}>
                    <View style={styles.estimateRow}>
                      <View style={styles.estimateCol}>
                        <Text style={styles.estimateLabel}>YOUR RATING</Text>
                        <Text style={styles.estimateBaseValue}>{game.playerRating}</Text>
                      </View>

                      <View style={[styles.estimateCol, styles.estimateColRight]}>
                        <Text style={styles.estimateLabel}>PROJECTED CHANGE</Text>
                        <View
                          style={[
                            styles.changeBadge,
                            newDelta !== null && newDelta > 0
                              ? styles.badgePositive
                              : newDelta !== null && newDelta < 0
                                ? styles.badgeNegative
                                : styles.badgeZero,
                          ]}
                        >
                          <Ionicons
                            name={
                              newDelta !== null && newDelta > 0
                                ? 'arrow-up'
                                : newDelta !== null && newDelta < 0
                                  ? 'arrow-down'
                                  : 'remove'
                            }
                            size={16}
                            color={
                              newDelta !== null && newDelta > 0
                                ? colors.positiveText
                                : newDelta !== null && newDelta < 0
                                  ? colors.negativeText
                                  : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.changeBadgeText,
                              newDelta !== null && newDelta > 0
                                ? styles.textPositive
                                : newDelta !== null && newDelta < 0
                                  ? styles.textNegative
                                  : styles.textZero,
                            ]}
                          >
                            {newDelta === null
                              ? '—'
                              : `${newDelta > 0 ? '+' : ''}${newDelta}`}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.estimateProjected}>
                      New rating projection:{' '}
                      <Text style={styles.estimateHighlight}>
                        {newDelta !== null
                          ? Math.round((game.playerRating + newDelta) * 10) / 10
                          : '—'}
                      </Text>
                    </Text>
                  </View>

                  {/* Group 1: Opponent & Result */}
                  <View style={styles.groupCard}>
                    <Text style={styles.groupHeader}>♟ Opponent & Match</Text>

                    <View style={styles.fieldSpacing}>
                      <Text style={styles.label}>Opponent</Text>
                      <TextInput
                        style={styles.input}
                        value={opponentName}
                        onChangeText={setOpponentName}
                        placeholder="Opponent name"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>

                    <View style={styles.fieldGrid}>
                      <View style={styles.fieldCol}>
                        <Text style={styles.label}>Opponent rating</Text>
                        <TextInput
                          style={styles.input}
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
                        <Text style={styles.label}>K-factor</Text>
                        <TextInput
                          style={styles.input}
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
                      <Text style={styles.label}>Result</Text>
                      <View style={styles.resultRow}>
                        {(['win', 'draw', 'loss'] as GameResult[]).map((r) => {
                          const isSelected = r === result;
                          const isWin = r === 'win';
                          const isDraw = r === 'draw';
                          const isLoss = r === 'loss';
                          return (
                            <TouchableOpacity
                              key={r}
                              style={[
                                styles.resultPill,
                                isSelected && isWin && styles.pillWinActive,
                                isSelected && isDraw && styles.pillDrawActive,
                                isSelected && isLoss && styles.pillLossActive,
                              ]}
                              onPress={() => setResult(r)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.resultPillText,
                                  isSelected && isWin && styles.textWinActive,
                                  isSelected && isDraw && styles.textDrawActive,
                                  isSelected && isLoss && styles.textLossActive,
                                ]}
                              >
                                {r === 'win'
                                  ? 'Win'
                                  : r === 'draw'
                                    ? 'Draw'
                                    : 'Loss'}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>

                  {/* Group 2: Date & Rating Period */}
                  <View style={styles.groupCard}>
                    <View style={styles.groupHeaderRow}>
                      <Text style={styles.groupHeader}>📅 Date & Period</Text>
                      <TouchableOpacity
                        style={styles.openPickerQuickButton}
                        onPress={() => setDatePickerOpen(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Open calendar date picker"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                        <Text style={styles.openPickerQuickText}>Pick date</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.fieldGrid}>
                      <View style={styles.fieldCol}>
                        <Text style={styles.label} numberOfLines={1}>Game date</Text>
                        <View style={styles.dateInputWrapper}>
                          <TextInput
                            style={styles.dateInput}
                            value={date}
                            onChangeText={setDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                            accessibilityLabel="Game date"
                          />
                          <TouchableOpacity
                            style={styles.calendarIconButton}
                            onPress={() => setDatePickerOpen(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Calendar date picker"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.fieldCol}>
                        <Text style={styles.label} numberOfLines={1}>Rating month</Text>
                        <TextInput
                          style={styles.input}
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
                        style={styles.quickDateChip}
                        onPress={() => {
                          const now = new Date();
                          const y = now.getFullYear();
                          const m = String(now.getMonth() + 1).padStart(2, '0');
                          const d = String(now.getDate()).padStart(2, '0');
                          setDate(`${y}-${m}-${d}`);
                        }}
                        accessibilityRole="button"
                      >
                        <Text style={styles.quickDateChipText}>Today</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.quickDateChip}
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
                        <Text style={styles.quickDateChipText}>Yesterday</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {!isFormValid ? (
                    <View style={styles.validationBox}>
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color={colors.negativeText}
                      />
                      <Text style={styles.validationText}>
                        Please enter valid ratings, a game date and a rating month (YYYY-MM).
                      </Text>
                    </View>
                  ) : null}

                  {/* Secondary Actions Section inside ScrollView */}
                  <View style={styles.secondaryActionsContainer}>
                    {/* Secondary Move to Current Month */}
                    <TouchableOpacity
                      style={[
                        styles.secondaryMoveButton,
                        moving && styles.buttonDisabled,
                      ]}
                      onPress={handleMoveToCurrentMonth}
                      disabled={moving}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.secondaryMoveButtonText}>
                        Move to Current Month
                      </Text>
                    </TouchableOpacity>

                    {/* Restrained, Separated Delete Game */}
                    {canDelete ? (
                      <View style={styles.deleteSection}>
                        <TouchableOpacity
                          style={[
                            styles.deleteButton,
                            moving && styles.buttonDisabled,
                          ]}
                          onPress={handleDelete}
                          disabled={moving}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.deleteButtonText}>Delete game</Text>
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
                  { paddingBottom: Math.max(insets.bottom, spacing.md) },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.primarySaveButton,
                    (moving || !isFormValid || newDelta === null) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={moving || !isFormValid || newDelta === null}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primarySaveButtonText}>Save changes</Text>
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
    backgroundColor: colors.overlay,
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
    maxHeight: '92%',
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderTopWidth: 1,
    borderColor: colors.border,
    ...shadows.sheet,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerMotif: {
    fontSize: 20,
    color: colors.primary,
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  closeButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenInset,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  emptyContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Estimate Summary Card
  estimateCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.lg,
    ...shadows.card,
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
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  estimateBaseValue: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    gap: 2,
  },
  changeBadgeText: {
    fontSize: 16,
    fontWeight: '800',
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
  estimateProjected: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  estimateHighlight: {
    fontWeight: '700',
    color: colors.primary,
  },

  // Grouped Cards
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  groupHeader: {
    ...typography.subheading,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  fieldSpacing: {
    marginTop: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
    minHeight: 20,
  },
  input: {
    minHeight: touchTargets.min,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    ...typography.body,
    color: colors.textPrimary,
    ...(Platform.OS === 'web' ? ({ touchAction: 'pan-y' } as Record<string, unknown>) : {}),
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  openPickerQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSelected,
    borderWidth: 1,
    borderColor: colors.border,
  },
  openPickerQuickText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  dateInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  dateInput: {
    minHeight: touchTargets.min,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md,
    paddingRight: 42,
    paddingVertical: spacing.md - 2,
    ...typography.body,
    color: colors.textPrimary,
    ...(Platform.OS === 'web' ? ({ touchAction: 'pan-y' } as Record<string, unknown>) : {}),
  },
  calendarIconButton: {
    position: 'absolute',
    right: spacing.xs,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickDateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSelected,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickDateChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  fieldGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  fieldCol: {
    flex: 1,
  },

  // Result Pills
  resultRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resultPill: {
    flex: 1,
    minHeight: touchTargets.min,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  pillWinActive: {
    backgroundColor: colors.positiveBg,
    borderColor: colors.positiveText,
  },
  pillDrawActive: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.primary,
  },
  pillLossActive: {
    backgroundColor: colors.negativeBg,
    borderColor: colors.negativeText,
  },
  resultPillText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  textWinActive: {
    color: colors.positiveText,
    fontWeight: '700',
  },
  textDrawActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  textLossActive: {
    color: colors.negativeText,
    fontWeight: '700',
  },

  // Validation
  validationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.negativeBg,
    padding: spacing.md,
    borderRadius: radii.control,
    gap: spacing.sm,
  },
  validationText: {
    flex: 1,
    ...typography.caption,
    color: colors.negativeText,
    fontWeight: '600',
  },

  // Actions
  secondaryActionsContainer: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  stickyFooter: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.screenInset,
    paddingTop: spacing.md,
  },
  primarySaveButton: {
    minHeight: touchTargets.primaryControl,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySaveButtonText: {
    ...typography.bodyBold,
    color: colors.primaryText,
  },
  secondaryMoveButton: {
    minHeight: touchTargets.primaryControl,
    backgroundColor: colors.surfaceSelected,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryMoveButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  deleteSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteButton: {
    minHeight: 48,
    backgroundColor: colors.negativeBg,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.negativeText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    ...typography.label,
    color: colors.negativeText,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
