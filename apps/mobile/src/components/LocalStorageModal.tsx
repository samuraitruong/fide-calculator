import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import FideSearchInput from './FideSearchInput';
import { FidePlayer } from '../hooks/useFideData';
import { colors, radii, spacing, typography, touchTargets, shadows } from '../theme/tokens';

interface LocalStorageModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (profileData: {
    name: string;
    fideId?: string;
    title?: string;
    federation?: string;
    birthYear?: number;
    standardRating: number;
    rapidRating: number;
    blitzRating: number;
    isLocal: boolean;
  }) => void;
}

export default function LocalStorageModal({ open, onClose, onSuccess }: LocalStorageModalProps) {
  const [name, setName] = useState('');
  const [fideId, setFideId] = useState('');
  const [title, setTitle] = useState('');
  const [federation, setFederation] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFidePlayerSelect = (player: FidePlayer) => {
    setName(player.name || '');
    setFideId(player.fideId || '');
    setTitle(player.title || '');
    setFederation(player.federation || '');
    if (player.birthYear) {
      setBirthYear(player.birthYear.toString());
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Player name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profile = {
        name: name.trim(),
        fideId: fideId.trim() || undefined,
        title: title.trim() || undefined,
        federation: federation.trim() || undefined,
        birthYear: birthYear ? parseInt(birthYear, 10) : undefined,
        standardRating: 1500,
        rapidRating: 1500,
        blitzRating: 1500,
        isLocal: true,
      };

      onSuccess(profile);
    } catch (err) {
      console.error('Error creating local profile:', err);
      setError('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.titleIcon}>♟</Text>
                <Text style={styles.title}>Local Storage Mode</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close local storage modal"
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Local Storage Benefits</Text>
              <Text style={styles.infoItem}>• Data stays on this device only</Text>
              <Text style={styles.infoItem}>• No cloud account required</Text>
              <Text style={styles.infoItem}>• Fully offline-capable</Text>
              <Text style={styles.infoItem}>• Fast, private calculation & tracking</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Player Name *</Text>
                <FideSearchInput
                  value={name}
                  onChange={(val) => {
                    setName(val);
                    if (error) setError('');
                  }}
                  onSelect={handleFidePlayerSelect}
                  placeholder="Search for a FIDE player or enter name"
                />
                <Text style={styles.hint}>
                  Search for a FIDE player to auto-fill details, or type your name manually.
                </Text>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>FIDE ID (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={fideId}
                    onChangeText={setFideId}
                    placeholder="e.g. 12345678"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    accessibilityLabel="FIDE ID"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Title (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. FM, IM, GM"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    accessibilityLabel="Chess Title"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Federation (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={federation}
                    onChangeText={setFederation}
                    placeholder="e.g. USA, ENG"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    accessibilityLabel="Federation"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Birth Year (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={birthYear}
                    onChangeText={setBirthYear}
                    placeholder="e.g. 1995"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    accessibilityLabel="Birth Year"
                  />
                </View>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Create Local Profile"
                >
                  {loading ? (
                    <ActivityIndicator color={colors.primaryText} />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Local Profile</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
    padding: spacing.xl,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    ...shadows.sheet,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleIcon: {
    fontSize: 22,
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
  closeButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: colors.surfaceSelected,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  infoTitle: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  infoItem: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
    lineHeight: 18,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs + 2,
  },
  halfWidth: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  input: {
    minHeight: touchTargets.min,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.negativeBg,
    borderRadius: radii.control,
    padding: spacing.md,
    gap: spacing.sm,
  },
  errorIcon: {
    fontSize: 16,
    color: colors.negativeText,
    fontWeight: '700',
  },
  errorText: {
    flex: 1,
    ...typography.caption,
    color: colors.negativeText,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  cancelButton: {
    flex: 1,
    minHeight: touchTargets.primaryControl,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  submitButton: {
    flex: 1.4,
    minHeight: touchTargets.primaryControl,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...typography.bodyBold,
    color: colors.primaryText,
  },
});
