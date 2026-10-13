import React, { useState, useEffect, useRef } from 'react';
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
import { refreshFidePlayer, type UserProfile } from '@fide-calculator/shared';
import type { LocalProfile } from '@/hooks/useLocalStorage';
import FideSearchInput from './FideSearchInput';
import type { FidePlayer } from '@/hooks/useFideData';
import { colors, radii, spacing, typography, touchTargets, shadows } from '../theme/tokens';

type ProfileLike = {
  id?: string;
  name: string;
  fideId?: string;
  title?: string;
  federation?: string;
  birthYear?: number;
  standardRating: number;
  rapidRating: number;
  blitzRating: number;
};

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile: ProfileLike | null;
  isLocal: boolean;
  onSave: (updates: Partial<UserProfile> | Partial<LocalProfile>) => void | Promise<void>;
}

const setNum = (setter: (n: number) => void, text: string) => {
  const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
  setter(Number.isNaN(n) ? 0 : n);
};

export default function EditProfileModal({
  open,
  onClose,
  onSuccess,
  profile,
  isLocal,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState('');
  const [fideId, setFideId] = useState('');
  const [standardRating, setStandardRating] = useState(1500);
  const [rapidRating, setRapidRating] = useState(1500);
  const [blitzRating, setBlitzRating] = useState(1500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<{ title?: string; federation?: string; birthYear?: number }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState('');
  const refreshRequest = useRef(0);
  const profileIdentity = `${isLocal}:${profile?.id ?? ''}:${profile?.fideId ?? ''}:${profile?.name ?? ''}`;

  useEffect(() => {
    refreshRequest.current += 1;
    setRefreshing(false);
    setRefreshStatus('');
    setError('');
    return () => {
      refreshRequest.current += 1;
    };
  }, [open, profileIdentity]);

  useEffect(() => {
    if (profile) {
      setMetadata({
        title: profile.title,
        federation: profile.federation,
        birthYear: profile.birthYear,
      });
      setName(profile.name);
      setFideId(profile.fideId ?? '');
      setStandardRating(profile.standardRating);
      setRapidRating(profile.rapidRating);
      setBlitzRating(profile.blitzRating);
    }
  }, [profile, open]);

  const handleFideSelect = (player: FidePlayer) => {
    setMetadata({
      title: player.title || undefined,
      federation: player.federation || undefined,
      birthYear: parseInt(player.birthYear, 10) || undefined,
    });
    setName(player.name);
    setFideId(player.fideId ?? '');
    if (player.standard && player.standard !== '-')
      setStandardRating(parseInt(player.standard, 10) || 1500);
    if (player.rapid && player.rapid !== '-')
      setRapidRating(parseInt(player.rapid, 10) || 1500);
    if (player.blitz && player.blitz !== '-')
      setBlitzRating(parseInt(player.blitz, 10) || 1500);
  };

  const handleRefresh = async () => {
    if (refreshing || loading) return;
    const request = ++refreshRequest.current;
    setRefreshing(true);
    setError('');
    setRefreshStatus('');
    try {
      const player = await refreshFidePlayer({ fideId: fideId.trim() || undefined, name });
      if (request !== refreshRequest.current) return;
      handleFideSelect(player);
      setRefreshStatus('FIDE data refreshed. Save to apply these changes.');
    } catch (err) {
      if (request === refreshRequest.current)
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to refresh FIDE data. Please try again.',
        );
    } finally {
      if (request === refreshRequest.current) setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (loading || refreshing) return;
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await Promise.resolve(
        onSave({
          ...metadata,
          name: name.trim(),
          fideId: fideId.trim() || undefined,
          standardRating,
          rapidRating,
          blitzRating,
        }),
      );
      onSuccess();
      onClose();
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

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
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerMotif}>♟</Text>
                <Text style={styles.title}>Edit profile</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close edit profile modal"
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.hintBox}>
                <Text style={styles.hintIcon}>ℹ</Text>
                <Text style={styles.hintText}>
                  Search by name to fill from FIDE and update ratings.
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Refresh FIDE data"
                style={[
                  styles.refreshBtn,
                  (refreshing || loading) && styles.buttonDisabled,
                ]}
                onPress={handleRefresh}
                disabled={refreshing || loading || (!name.trim() && !fideId.trim())}
                activeOpacity={0.8}
              >
                {refreshing && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
                <Text style={styles.refreshBtnText}>
                  {refreshing ? 'Refreshing FIDE data...' : 'Refresh FIDE data'}
                </Text>
              </TouchableOpacity>

              {refreshStatus ? (
                <Text accessibilityLiveRegion="polite" style={styles.refreshStatusText}>
                  {refreshStatus}
                </Text>
              ) : null}

              {/* Group: Player Details */}
              <View style={styles.groupCard}>
                <Text style={styles.groupHeader}>Player Details</Text>

                <View style={styles.fieldSpacing}>
                  <Text style={styles.label}>Name *</Text>
                  {refreshing || loading ? (
                    <TextInput
                      style={styles.input}
                      value={name}
                      editable={false}
                    />
                  ) : (
                    <FideSearchInput
                      value={name}
                      onChange={setName}
                      onSelect={handleFideSelect}
                      placeholder="Search FIDE or enter name"
                    />
                  )}
                </View>

                <View style={styles.fieldSpacing}>
                  <Text style={styles.label}>FIDE ID</Text>
                  <TextInput
                    editable={!refreshing && !loading}
                    style={styles.input}
                    value={fideId}
                    onChangeText={setFideId}
                    placeholder="e.g. 12345678"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Group: Ratings */}
              <View style={styles.groupCard}>
                <Text style={styles.groupHeader}>Ratings</Text>

                <View style={styles.fieldSpacing}>
                  <Text style={styles.label}>Standard rating</Text>
                  <TextInput
                    editable={!refreshing && !loading}
                    style={styles.input}
                    value={String(standardRating)}
                    onChangeText={(t) => setNum(setStandardRating, t)}
                    keyboardType="number-pad"
                    placeholder="1500"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.fieldSpacing}>
                  <Text style={styles.label}>Rapid rating</Text>
                  <TextInput
                    editable={!refreshing && !loading}
                    style={styles.input}
                    value={String(rapidRating)}
                    onChangeText={(t) => setNum(setRapidRating, t)}
                    keyboardType="number-pad"
                    placeholder="1500"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.fieldSpacing}>
                  <Text style={styles.label}>Blitz rating</Text>
                  <TextInput
                    editable={!refreshing && !loading}
                    style={styles.input}
                    value={String(blitzRating)}
                    onChangeText={(t) => setNum(setBlitzRating, t)}
                    keyboardType="number-pad"
                    placeholder="1500"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (loading || refreshing) && styles.buttonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading || refreshing}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.primaryText} />
                  ) : (
                    <Text style={styles.submitBtnText}>Save</Text>
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
  closeText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: 16,
    color: colors.negativeText,
  },
  hintIcon: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
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
    backgroundColor: colors.surfaceMuted,
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
    color: colors.textSecondary,
  },
  refreshBtn: {
    minHeight: 44,
    backgroundColor: colors.surfaceSelected,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  refreshBtnText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '700',
  },
  refreshStatusText: {
    ...typography.caption,
    color: colors.positiveText,
    fontWeight: '600',
  },
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
