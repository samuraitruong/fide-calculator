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
import { useTheme } from '../contexts/ThemeContext';

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
  const { colors, radii, borderWidth, typography, touchTargets } = useTheme();
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

  const hasIonicons = typeof Ionicons === 'function';

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss date picker"
        />

        <View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: borderWidth.heavy,
              borderRadius: radii.xl,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: colors.border,
                borderBottomWidth: borderWidth.thin,
              },
            ]}
          >
            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerMotif, { color: colors.primary }]}>📅</Text>
              <View>
                <Text style={[styles.headerTag, { color: colors.primary }]}>
                  [ TEMPORAL SELECTION ]
                </Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  borderWidth: borderWidth.thin,
                  borderRadius: radii.sm,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close date picker"
            >
              {hasIonicons ? (
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              ) : (
                <Text style={[styles.closeIconText, { color: colors.textPrimary }]}>✕</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Date Chips */}
          <View style={styles.quickChipsRow}>
            <TouchableOpacity
              style={[
                styles.quickChip,
                {
                  backgroundColor: selectedDate === todayStr ? colors.primary : colors.surfaceMuted,
                  borderColor: selectedDate === todayStr ? colors.border : colors.borderSubtle,
                  borderWidth: borderWidth.thin,
                  borderRadius: radii.sm,
                },
              ]}
              onPress={() => handleSelectQuick(0)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.quickChipText,
                  {
                    color: selectedDate === todayStr ? colors.primaryText : colors.textPrimary,
                  },
                ]}
              >
                [ TODAY ]
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickChip,
                (() => {
                  const yest = new Date();
                  yest.setDate(yest.getDate() - 1);
                  const isYest = selectedDate === formatYYYYMMDD(yest.getFullYear(), yest.getMonth(), yest.getDate());
                  return {
                    backgroundColor: isYest ? colors.primary : colors.surfaceMuted,
                    borderColor: isYest ? colors.border : colors.borderSubtle,
                    borderWidth: borderWidth.thin,
                    borderRadius: radii.sm,
                  };
                })(),
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
                    const isYest = selectedDate === formatYYYYMMDD(yest.getFullYear(), yest.getMonth(), yest.getDate());
                    return {
                      color: isYest ? colors.primaryText : colors.textPrimary,
                    };
                  })(),
                ]}
              >
                [ YESTERDAY ]
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigator */}
          <View
            style={[
              styles.navRow,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                borderWidth: borderWidth.thin,
                borderRadius: radii.sm,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.navArrowButton}
              onPress={handlePrevMonth}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              {hasIonicons ? (
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              ) : (
                <Text style={{ fontSize: 18, color: colors.primary, fontWeight: '900' }}>‹</Text>
              )}
            </TouchableOpacity>

            <Text
              style={[
                styles.monthTitle,
                { color: colors.textPrimary, ...typography.mono },
              ]}
            >
              {MONTH_NAMES[viewMonth].toUpperCase()} {viewYear}
            </Text>

            <TouchableOpacity
              style={styles.navArrowButton}
              onPress={handleNextMonth}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              {hasIonicons ? (
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              ) : (
                <Text style={{ fontSize: 18, color: colors.primary, fontWeight: '900' }}>›</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_NAMES.map((name) => (
              <View key={name} style={styles.weekdayCell}>
                <Text style={[styles.weekdayText, { color: colors.textMuted }]}>{name}</Text>
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
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : isCellToday
                          ? colors.accentMuted
                          : 'transparent',
                      borderColor: isSelected
                        ? colors.border
                        : isCellToday
                          ? colors.accent
                          : 'transparent',
                      borderWidth: isSelected || isCellToday ? borderWidth.thin : 0,
                      borderRadius: radii.sm,
                    },
                  ]}
                  onPress={() => {
                    setSelectedDate(cell.dateStr!);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isSelected
                          ? colors.primaryText
                          : isCellToday
                            ? colors.accent
                            : colors.textPrimary,
                        ...typography.mono,
                      },
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
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  borderWidth: borderWidth.medium,
                  borderRadius: radii.sm,
                  minHeight: touchTargets.primaryControl,
                },
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.border,
                  borderWidth: borderWidth.medium,
                  borderRadius: radii.sm,
                  minHeight: touchTargets.primaryControl,
                },
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmButtonText, { color: colors.primaryText }]}>
                {selectedDate ? `Set [ ${selectedDate} ]` : 'Select Date'}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerMotif: {
    fontSize: 20,
  },
  headerTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    fontSize: 16,
    fontWeight: '900',
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  navArrowButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellPlaceholder: {
    width: '14.28%',
    height: 40,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confirmButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
