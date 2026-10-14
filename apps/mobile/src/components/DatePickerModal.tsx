import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing, touchTargets, typography } from '../theme/tokens';

type Props = {
  open: boolean;
  value?: string; // YYYY-MM-DD
  onClose: () => void;
  onSelect: (dateString: string) => void;
  title?: string;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function formatYYYYMMDD(year: number, monthZeroIndexed: number, day: number): string {
  const y = String(year);
  const m = String(monthZeroIndexed + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYYYYMMDD(str?: string): { year: number; month: number; day: number } | null {
  if (!str) return null;
  const parts = str.trim().split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export default function DatePickerModal({
  open,
  value,
  onClose,
  onSelect,
  title = 'Select Game Date',
}: Props) {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(
    () => formatYYYYMMDD(today.getFullYear(), today.getMonth(), today.getDate()),
    [today],
  );

  const initial = useMemo(() => parseYYYYMMDD(value) || {
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
  }, [value, today]);

  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [selectedDate, setSelectedDate] = useState(value || todayStr);

  // Sync state if initial value changes or modal opens
  React.useEffect(() => {
    if (open) {
      const parsed = parseYYYYMMDD(value);
      if (parsed) {
        setViewYear(parsed.year);
        setViewMonth(parsed.month);
        setSelectedDate(value || todayStr);
      } else {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
        setSelectedDate(value || todayStr);
      }
    }
  }, [open, value, today, todayStr]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectQuick = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const dateStr = formatYYYYMMDD(target.getFullYear(), target.getMonth(), target.getDate());
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setSelectedDate(dateStr);
  };

  const daysInMonth = useMemo(
    () => new Date(viewYear, viewMonth + 1, 0).getDate(),
    [viewYear, viewMonth],
  );

  // Monday = 0, Sunday = 6
  const startDayOffset = useMemo(() => {
    const day = new Date(viewYear, viewMonth, 1).getDay();
    return (day + 6) % 7;
  }, [viewYear, viewMonth]);

  const calendarCells = useMemo(() => {
    const cells: Array<{ day: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < startDayOffset; i++) {
      cells.push({ day: null, dateStr: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        dateStr: formatYYYYMMDD(viewYear, viewMonth, day),
      });
    }
    return cells;
  }, [viewYear, viewMonth, daysInMonth, startDayOffset]);

  const handleConfirm = () => {
    if (selectedDate) {
      onSelect(selectedDate);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss date picker"
        />

        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerMotif}>📅</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close date picker"
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Quick Date Chips */}
          <View style={styles.quickChipsRow}>
            <TouchableOpacity
              style={[
                styles.quickChip,
                selectedDate === todayStr && styles.quickChipActive,
              ]}
              onPress={() => handleSelectQuick(0)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.quickChipText,
                  selectedDate === todayStr && styles.quickChipTextActive,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickChip,
                (() => {
                  const yest = new Date();
                  yest.setDate(yest.getDate() - 1);
                  return selectedDate === formatYYYYMMDD(yest.getFullYear(), yest.getMonth(), yest.getDate());
                })() && styles.quickChipActive,
              ]}
              onPress={() => handleSelectQuick(-1)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.quickChipText,
                  (() => {
                    const yest = new Date();
                    yest.setDate(yest.getDate() - 1);
                    return selectedDate === formatYYYYMMDD(yest.getFullYear(), yest.getMonth(), yest.getDate());
                  })() && styles.quickChipTextActive,
                ]}
              >
                Yesterday
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigator */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.navArrowButton}
              onPress={handlePrevMonth}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              style={styles.navArrowButton}
              onPress={handleNextMonth}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_NAMES.map((name) => (
              <View key={name} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {calendarCells.map((cell, idx) => {
              if (cell.day === null || cell.dateStr === null) {
                return <View key={`blank-${idx}`} style={styles.dayCellPlaceholder} />;
              }
              const isSelected = cell.dateStr === selectedDate;
              const isCellToday = cell.dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={cell.dateStr}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    !isSelected && isCellToday && styles.dayCellToday,
                  ]}
                  onPress={() => {
                    setSelectedDate(cell.dateStr!);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      !isSelected && isCellToday && styles.dayTextToday,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmButtonText}>
                {selectedDate ? `Set ${selectedDate}` : 'Select Date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.canvas,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sheet,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipActive: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.primary,
  },
  quickChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  quickChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  navArrowButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekdayText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  dayCellPlaceholder: {
    width: `${100 / 7}%`,
    height: 40,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: colors.primaryText,
    fontWeight: '800',
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 2,
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    ...typography.label,
    fontWeight: '700',
    color: colors.primaryText,
  },
});
