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
import { useTheme } from '../contexts/ThemeContext';
import TacticalCard from './ui/TacticalCard';
import ChessInsignia from './ui/ChessInsignia';

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
  const { colors, radii, borderWidth, typography, touchTargets } = useTheme();
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
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.modal,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderTopLeftRadius: radii.xl,
                borderTopRightRadius: radii.xl,
                borderWidth: borderWidth.heavy,
              },
            ]}
          >
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
                <ChessInsignia piece="rook" size={18} color={colors.primary} />
                <View>
                  <Text style={[styles.titleTag, { color: colors.primary }]}>
                    [ PROFILE MAINTENANCE ]
                  </Text>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>Edit Profile</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.closeButton,
                  {
                    borderColor: colors.border,
                    borderWidth: borderWidth.thin,
                    backgroundColor: colors.surface,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close edit profile modal"
              >
                <Text style={[styles.closeText, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {error ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: colors.negativeBg,
                      borderColor: colors.negative,
                      borderWidth: borderWidth.thin,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text style={[styles.errorIcon, { color: colors.negativeText }]}>⚠</Text>
                  <Text style={[styles.errorText, { color: colors.negativeText }]}>{error}</Text>
                </View>
              ) : null}

              <View
                style={[
                  styles.hintBox,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.borderSubtle,
                    borderWidth: borderWidth.thin,
                    borderRadius: radii.sm,
                  },
                ]}
              >
                <Text style={[styles.hintIcon, { color: colors.primary }]}>ℹ</Text>
                <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                  Search by name to fill from official FIDE database and sync active ratings.
                </Text>
              </View>

              {/* Refresh Button */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Refresh FIDE data"
                style={[
                  styles.refreshBtn,
                  {
                    backgroundColor: colors.accentMuted,
                    borderColor: colors.accent,
                    borderWidth: borderWidth.medium,
                    borderRadius: radii.sm,
                  },
                  (refreshing || loading) && styles.buttonDisabled,
                ]}
                onPress={handleRefresh}
                disabled={refreshing || loading || (!name.trim() && !fideId.trim())}
                activeOpacity={0.8}
              >
                {refreshing && (
                  typeof ActivityIndicator === 'function' ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Text style={{ color: colors.accent, marginRight: 6 }}>⟳</Text>
                  )
                )}
                <Text style={[styles.refreshBtnText, { color: colors.accent }]}>
                  {refreshing ? 'Refreshing FIDE data...' : 'Refresh FIDE data'}
                </Text>
              </TouchableOpacity>

              {refreshStatus ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.refreshStatusText, { color: colors.positiveText }]}
                >
                  {refreshStatus}
                </Text>
              ) : null}

              {/* Group: Player Details */}
              <TacticalCard
                title="PLAYER DOSSIER"
                badge={isLocal ? 'LOCAL STORAGE' : 'CLOUD SYNC'}
                variant="default"
              >
                <View style={styles.fieldSpacing}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>PLAYER NAME *</Text>
                  {refreshing || loading ? (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceMuted,
                          borderColor: colors.borderSubtle,
                          color: colors.textPrimary,
                          borderWidth: borderWidth.thin,
                          borderRadius: radii.sm,
                        },
                      ]}
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
                  <Text style={[styles.label, { color: colors.textMuted }]}>FIDE ID</Text>
                  <TextInput
                    editable={!refreshing && !loading}
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
                    value={fideId}
                    onChangeText={setFideId}
                    placeholder="e.g. 12345678"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
              </TacticalCard>

              {/* Group: Ratings */}
              <TacticalCard
                title="OFFICIAL RATINGS"
                badge="ELO SPEC"
                variant="default"
              >
                <View style={styles.fieldSpacing}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>STANDARD RATING</Text>
                  <TextInput
                    editable={!refreshing && !loading}
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
                    value={String(standardRating)}
                    onChangeText={(t) => setNum(setStandardRating, t)}
                    keyboardType="number-pad"
                    placeholder="1500"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.fieldSpacing}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>RAPID RATING</Text>
                  <TextInput
                    editable={!refreshing && !loading}
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
                    value={String(rapidRating)}
                    onChangeText={(t) => setNum(setRapidRating, t)}
                    keyboardType="number-pad"
                    placeholder="1500"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.fieldSpacing}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>BLITZ RATING</Text>
                  <TextInput
                    editable={!refreshing && !loading}
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
                    value={String(blitzRating)}
                    onChangeText={(t) => setNum(setBlitzRating, t)}
                    keyboardType="number-pad"
                    placeholder="1500"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </TacticalCard>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
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
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Save"
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.border,
                      borderWidth: borderWidth.medium,
                      borderRadius: radii.sm,
                      minHeight: touchTargets.primaryControl,
                    },
                    (loading || refreshing) && styles.buttonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading || refreshing}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    typeof ActivityIndicator === 'function' ? (
                      <ActivityIndicator size="small" color={colors.primaryText} />
                    ) : (
                      <Text style={[styles.submitBtnText, { color: colors.primaryText }]}>
                        Saving...
                      </Text>
                    )
                  ) : (
                    <Text style={[styles.submitBtnText, { color: colors.primaryText }]}>
                      Save
                    </Text>
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
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    maxHeight: '92%',
    overflow: 'hidden',
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
  titleTag: {
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
  closeText: {
    fontSize: 16,
    fontWeight: '900',
  },
  errorIcon: {
    fontSize: 14,
    fontWeight: '900',
  },
  hintIcon: {
    fontSize: 14,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  refreshBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  refreshStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fieldSpacing: {
    marginTop: 10,
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  submitBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
