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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { UserProfile } from '@fide-calculator/shared';
import { useAuth } from '@/contexts/AuthContext';
import type { LocalProfile } from '@/hooks/useLocalStorage';
import type { FidePlayer } from '@/hooks/useFideData';
import FideSearchInput from './FideSearchInput';
import { colors, radii, spacing, typography, touchTargets, shadows } from '../theme/tokens';

interface CreateProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isLocal: boolean;
  localCreateProfile?: (data: Omit<LocalProfile, 'id'>) => LocalProfile;
}

const defaultRatings = { standard: 1500, rapid: 1500, blitz: 1500 };
const TITLES = ['', 'GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM'];

export default function CreateProfileModal({
  open,
  onClose,
  onSuccess,
  isLocal,
  localCreateProfile,
}: CreateProfileModalProps) {
  const { createProfile: cloudCreateProfile } = useAuth();
  const [name, setName] = useState('');
  const [fideId, setFideId] = useState('');
  const [title, setTitle] = useState('');
  const [federation, setFederation] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [standardRating, setStandardRating] = useState(defaultRatings.standard);
  const [rapidRating, setRapidRating] = useState(defaultRatings.rapid);
  const [blitzRating, setBlitzRating] = useState(defaultRatings.blitz);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setFideId('');
    setTitle('');
    setFederation('');
    setBirthYear('');
    setStandardRating(defaultRatings.standard);
    setRapidRating(defaultRatings.rapid);
    setBlitzRating(defaultRatings.blitz);
    setError('');
  };

  const handleFideSelect = (player: FidePlayer) => {
    setName(player.name);
    setFideId(player.fideId ?? '');
    setTitle(player.title ?? '');
    setFederation(player.federation ?? '');
    setBirthYear(player.birthYear ?? '');
    if (player.standard && player.standard !== '-') {
      setStandardRating(parseInt(player.standard, 10) || 1500);
    }
    if (player.rapid && player.rapid !== '-') {
      setRapidRating(parseInt(player.rapid, 10) || 1500);
    }
    if (player.blitz && player.blitz !== '-') {
      setBlitzRating(parseInt(player.blitz, 10) || 1500);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Player name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const birthYearNum = birthYear.trim() ? parseInt(birthYear.trim(), 10) : undefined;
      if (isLocal && localCreateProfile) {
        localCreateProfile({
          name: name.trim(),
          fideId: fideId.trim() || undefined,
          title: title.trim() || undefined,
          federation: federation.trim().toUpperCase().slice(0, 3) || undefined,
          birthYear: birthYearNum,
          standardRating,
          rapidRating,
          blitzRating,
          isLocal: true,
        });
        reset();
        onSuccess();
        onClose();
      } else {
        const profileData: Partial<UserProfile> = {
          name: name.trim(),
          fideId: fideId.trim() || undefined,
          title: title.trim() || undefined,
          federation: federation.trim().toUpperCase().slice(0, 3) || undefined,
          birthYear: birthYearNum,
          standardRating,
          rapidRating,
          blitzRating,
        };
        const { error: err } = await cloudCreateProfile(profileData);
        if (err) {
          setError(err.message || 'Failed to create profile');
        } else {
          reset();
          onSuccess();
          onClose();
        }
      }
    } catch {
      setError('Something went wrong creating this profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const setNum = (setter: (n: number) => void, text: string) => {
    const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setter(Number.isNaN(n) ? 0 : n);
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
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerMotif}>♟</Text>
                <Text style={styles.title}>New Profile</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close new profile modal"
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.negativeText} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.hintBox}>
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                <Text style={styles.hintText}>
                  Search your FIDE record or enter manually to autofill ratings.
                </Text>
              </View>

              {/* Group 1: Player Identity */}
              <View style={styles.groupCard}>
                <Text style={styles.groupHeader}>Player</Text>

                <View style={styles.fieldSpacing}>
                  <Text style={styles.label}>Player name *</Text>
                  <FideSearchInput
                    value={name}
                    onChange={setName}
                    onSelect={handleFideSelect}
                    placeholder="Search FIDE players or type name..."
                  />
                </View>

                <View style={styles.fieldSpacing}>
                  <Text style={styles.label}>FIDE ID</Text>
                  <TextInput
                    style={styles.input}
                    value={fideId}
                    onChangeText={setFideId}
                    placeholder="e.g. 12345678"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    accessibilityLabel="FIDE ID"
                  />
                </View>
              </View>

              {/* Group 2: Player Details */}
              <View style={styles.groupCard}>
                <Text style={styles.groupHeader}>Details</Text>

                <View style={styles.fieldSpacing}>
                  <Text style={styles.label}>Title</Text>
                  <View style={styles.titleRow}>
                    {TITLES.map((t) => {
                      const isSelected = t === title;
                      return (
                        <TouchableOpacity
                          key={t || 'none'}
                          style={[
                            styles.titleChip,
                            isSelected && styles.titleChipActive,
                          ]}
                          onPress={() => setTitle(t)}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          accessibilityLabel={`Title ${t || 'None'}`}
                        >
                          <Text
                            style={[
                              styles.titleChipText,
                              isSelected && styles.titleChipTextActive,
                            ]}
                          >
                            {t || 'None'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.fieldGrid}>
                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>Federation</Text>
                    <TextInput
                      style={styles.input}
                      value={federation}
                      onChangeText={(text) =>
                        setFederation(text.toUpperCase().slice(0, 3))
                      }
                      placeholder="e.g. USA"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="characters"
                      maxLength={3}
                      accessibilityLabel="Federation 3-letter code"
                    />
                  </View>

                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>Birth year</Text>
                    <TextInput
                      style={styles.input}
                      value={birthYear}
                      onChangeText={setBirthYear}
                      placeholder="e.g. 1995"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      accessibilityLabel="Birth year"
                    />
                  </View>
                </View>
              </View>

              {/* Group 3: Current Ratings */}
              <View style={styles.groupCard}>
                <Text style={styles.groupHeader}>Ratings</Text>
                <Text style={styles.groupSubhead}>
                  Starting official or initial estimates
                </Text>

                <View style={styles.ratingGrid}>
                  <View style={styles.ratingCol}>
                    <Text style={styles.label}>Standard</Text>
                    <TextInput
                      style={styles.input}
                      value={String(standardRating)}
                      onChangeText={(t) => setNum(setStandardRating, t)}
                      keyboardType="number-pad"
                      placeholder="1500"
                      placeholderTextColor={colors.textMuted}
                      accessibilityLabel="Standard starting rating"
                    />
                  </View>

                  <View style={styles.ratingCol}>
                    <Text style={styles.label}>Rapid</Text>
                    <TextInput
                      style={styles.input}
                      value={String(rapidRating)}
                      onChangeText={(t) => setNum(setRapidRating, t)}
                      keyboardType="number-pad"
                      placeholder="1500"
                      placeholderTextColor={colors.textMuted}
                      accessibilityLabel="Rapid starting rating"
                    />
                  </View>

                  <View style={styles.ratingCol}>
                    <Text style={styles.label}>Blitz</Text>
                    <TextInput
                      style={styles.input}
                      value={String(blitzRating)}
                      onChangeText={(t) => setNum(setBlitzRating, t)}
                      keyboardType="number-pad"
                      placeholder="1500"
                      placeholderTextColor={colors.textMuted}
                      accessibilityLabel="Blitz starting rating"
                    />
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel creating profile"
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Create profile"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.primaryText} />
                  ) : (
                    <Text style={styles.submitBtnText}>Create Profile</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  modal: {
    maxHeight: '90%',
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
  scrollContent: {
    paddingHorizontal: spacing.screenInset,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.negativeBg,
    padding: spacing.md,
    borderRadius: radii.control,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    ...typography.caption,
    color: colors.negativeText,
    fontWeight: '700',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSelected,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.control,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hintText: {
    flex: 1,
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
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
  groupSubhead: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fieldSpacing: {
    marginTop: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
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
  },
  fieldGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  fieldCol: {
    flex: 1,
  },

  // Title Chips
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  titleChip: {
    minWidth: 44,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleChipActive: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.primary,
  },
  titleChipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  titleChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Rating Grid
  ratingGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingCol: {
    flex: 1,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    minHeight: touchTargets.primaryControl,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    minHeight: touchTargets.primaryControl,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    ...typography.bodyBold,
    color: colors.primaryText,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
