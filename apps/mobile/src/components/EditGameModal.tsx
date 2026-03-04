import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { calculateRatingChange } from '@fide-calculator/shared';

type Props = {
  open: boolean;
  game: Result | null;
  onClose: () => void;
  onSave: (updates: Partial<Result>) => Promise<void> | void;
};

function monthKeyFromDate(dateStr: string): string | undefined {
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return undefined;
  const monthKey = `${d.getFullYear()}-${d.toLocaleDateString('en-US', { month: 'short' })}`;
  return monthKey;
}

export default function EditGameModal({ open, game, onClose, onSave }: Props) {
  const [opponentName, setOpponentName] = useState('');
  const [opponentRating, setOpponentRating] = useState(1400);
  const [kFactor, setKFactor] = useState(20);
  const [result, setResult] = useState<GameResult>('win');
  const [date, setDate] = useState(''); // YYYY-MM-DD preferred
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!game) return;
    setOpponentName(game.opponentName ?? '');
    setOpponentRating(game.opponentRating ?? 1400);
    setKFactor(game.kFactor ?? 20);
    setResult(game.result ?? 'win');
    setDate(game.date ?? '');
  }, [game]);

  const isValidRating = (n: number) => n >= 100 && n <= 3500;

  const isFormValid = useMemo(() => {
    if (!game) return false;
    return isValidRating(game.playerRating) && isValidRating(opponentRating) && !!date;
  }, [game, opponentRating, date]);

  const newDelta = useMemo(() => {
    if (!game) return null;
    if (!isValidRating(game.playerRating) || !isValidRating(opponentRating)) return null;
    return calculateRatingChange(game.playerRating, opponentRating, result, kFactor);
  }, [game, opponentRating, result, kFactor]);

  const handleSave = async () => {
    if (!game) return;
    if (!isFormValid || newDelta === null) return;
    const monthKey = monthKeyFromDate(date);
    await Promise.resolve(
      onSave({
        opponentName,
        opponentRating,
        kFactor,
        result,
        date,
        monthKey,
        ratingChange: newDelta,
      }),
    );
    onClose();
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Edit game</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={26} color="#374151" />
            </TouchableOpacity>
          </View>

          {!game ? (
            <Text style={styles.muted}>No game selected.</Text>
          ) : (
            <>
              <View style={styles.metaRow}>
                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>Your rating</Text>
                  <Text style={styles.metaValue}>{game.playerRating}</Text>
                </View>
                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>New change</Text>
                  <Text
                    style={[
                      styles.metaValue,
                      newDelta !== null && newDelta > 0
                        ? styles.positive
                        : newDelta !== null && newDelta < 0
                          ? styles.negative
                          : null,
                    ]}
                  >
                    {newDelta === null ? '—' : `${newDelta > 0 ? '+' : ''}${newDelta}`}
                  </Text>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Opponent</Text>
                <TextInput
                  style={styles.input}
                  value={opponentName}
                  onChangeText={setOpponentName}
                  placeholder="Opponent name"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Opponent rating</Text>
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

              <View style={styles.field}>
                <Text style={styles.label}>Result</Text>
                <View style={styles.pills}>
                  {(['win', 'draw', 'loss'] as GameResult[]).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.pill, r === result && styles.pillActive]}
                      onPress={() => setResult(r)}
                    >
                      <Text style={[styles.pillText, r === result && styles.pillTextActive]}>
                        {r === 'win' ? 'Win' : r === 'draw' ? 'Draw' : 'Loss'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>K-factor</Text>
                <TextInput
                  style={styles.input}
                  value={String(kFactor)}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const n = Number(text.replace(/[^0-9]/g, ''));
                    setKFactor(Number.isNaN(n) ? 0 : n);
                  }}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="2026-03-04"
                  autoCapitalize="none"
                />
              </View>

              {!isFormValid ? (
                <Text style={styles.validation}>Please enter a valid date and ratings.</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.saveButton, (!isFormValid || newDelta === null) && styles.disabled]}
                onPress={handleSave}
                disabled={!isFormValid || newDelta === null}
              >
                <Text style={styles.saveButtonText}>Save changes</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  muted: {
    color: '#6b7280',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  metaValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  positive: { color: '#059669' },
  negative: { color: '#b91c1c' },
  field: {
    marginTop: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pillActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4b5563',
  },
  pillTextActive: {
    color: '#ecfdf5',
  },
  validation: {
    marginTop: 10,
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 14,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});

