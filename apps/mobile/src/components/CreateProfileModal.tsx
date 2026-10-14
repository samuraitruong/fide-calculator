import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import type { LocalProfile } from '@/hooks/useLocalStorage';
import type { FidePlayer } from '@/hooks/useFideData';
import { useTheme } from '../contexts/ThemeContext';
import FideSearchInput from './FideSearchInput';
import TacticalCard from './ui/TacticalCard';
import TacticalButton from './ui/TacticalButton';
import ChessInsignia from './ui/ChessInsignia';

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
  const { colors, radii } = useTheme();
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
      } else {
        const { error: err } = await cloudCreateProfile({
          name: name.trim(),
          fideId: fideId.trim() || undefined,
          title: title.trim() || undefined,
          federation: federation.trim().toUpperCase().slice(0, 3) || undefined,
          birthYear: birthYearNum,
          standardRating,
          rapidRating,
          blitzRating,
        });
        if (err) throw err;
      }
      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.canvas }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleRow}>
            <ChessInsignia piece="knight" size={16} badgeSize={28} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>CREATE PLAYER PROFILE</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[styles.closeButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Close create profile modal"
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.lossBg, borderColor: colors.loss }]}>
              <Ionicons name="alert-circle" size={18} color={colors.loss} />
              <Text style={[styles.errorText, { color: colors.loss }]}>{error}</Text>
            </View>
          ) : null}

          {/* FIDE Lookup Card */}
          <TacticalCard variant="elevated" hasOffsetShadow={false}>
            <Text style={[styles.groupHeader, { color: colors.primary }]}>SEARCH FIDE DATABASE</Text>
            <Text style={[styles.groupSubhead, { color: colors.textSecondary }]}>
              Auto-fill official credentials from the FIDE rating records.
            </Text>
            <FideSearchInput
              value={name}
              onChange={setName}
              onSelect={handleFideSelect}
              placeholder="Search by player name..."
            />
          </TacticalCard>

          {/* Personal Info Card */}
          <TacticalCard variant="default" hasOffsetShadow={true} cornerAccents={true} tag="PLAYER CREDENTIALS">
            <View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>FULL NAME *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.borderInput,
                    color: colors.textPrimary,
                    borderRadius: radii.control,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Magnus Carlsen"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Player full name"
              />
            </View>

            <View style={styles.fieldGrid}>
              <View style={styles.fieldCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>FIDE ID</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.borderInput,
                      color: colors.textPrimary,
                      borderRadius: radii.control,
                    },
                  ]}
                  value={fideId}
                  onChangeText={setFideId}
                  placeholder="1503014"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  accessibilityLabel="FIDE ID"
                />
              </View>

              <View style={styles.fieldCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>FEDERATION</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.borderInput,
                      color: colors.textPrimary,
                      borderRadius: radii.control,
                    },
                  ]}
                  value={federation}
                  onChangeText={(val) => setFederation(val.toUpperCase())}
                  placeholder="NOR"
                  placeholderTextColor={colors.textMuted}
                  maxLength={3}
                  autoCapitalize="characters"
                  accessibilityLabel="Federation code"
                />
              </View>
            </View>

            {/* Title Selection */}
            <View style={styles.fieldSpacing}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>OFFICIAL TITLE</Text>
              <View style={styles.titleRow}>
                {TITLES.map((t) => {
                  const active = title === t;
                  return (
                    <TouchableOpacity
                      key={t || 'none'}
                      style={[
                        styles.titleChip,
                        {
                          backgroundColor: active ? colors.surfaceSelected : colors.surfaceElevated,
                          borderColor: active ? colors.primary : colors.borderInput,
                          borderRadius: radii.control - 2,
                        },
                      ]}
                      onPress={() => setTitle(t)}
                    >
                      <Text
                        style={[
                          styles.titleChipText,
                          {
                            color: active ? colors.primary : colors.textSecondary,
                            fontWeight: active ? '800' : '600',
                          },
                        ]}
                      >
                        {t || 'NONE'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TacticalCard>

          {/* Starting Ratings Card */}
          <TacticalCard variant="default" hasOffsetShadow={true} cornerAccents={true} tag="STARTING RATINGS">
            <View style={styles.ratingGrid}>
              <View style={styles.ratingCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>STANDARD</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.borderInput,
                      color: colors.textPrimary,
                      borderRadius: radii.control,
                    },
                  ]}
                  value={String(standardRating)}
                  onChangeText={(v) => setStandardRating(parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)}
                  keyboardType="numeric"
                  accessibilityLabel="Standard rating"
                />
              </View>
              <View style={styles.ratingCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>RAPID</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.borderInput,
                      color: colors.textPrimary,
                      borderRadius: radii.control,
                    },
                  ]}
                  value={String(rapidRating)}
                  onChangeText={(v) => setRapidRating(parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)}
                  keyboardType="numeric"
                  accessibilityLabel="Rapid rating"
                />
              </View>
              <View style={styles.ratingCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>BLITZ</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.borderInput,
                      color: colors.textPrimary,
                      borderRadius: radii.control,
                    },
                  ]}
                  value={String(blitzRating)}
                  onChangeText={(v) => setBlitzRating(parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)}
                  keyboardType="numeric"
                  accessibilityLabel="Blitz rating"
                />
              </View>
            </View>
          </TacticalCard>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TacticalButton
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <TacticalButton
              title={loading ? 'Creating…' : 'Create Profile'}
              onPress={handleSubmit}
              disabled={loading || !name.trim()}
              loading={loading}
              variant="primary"
              style={{ flex: 2 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  groupSubhead: {
    fontSize: 11,
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    minHeight: 46,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  fieldCol: {
    flex: 1,
  },
  fieldSpacing: {
    marginTop: 12,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  titleChip: {
    minWidth: 46,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleChipText: {
    fontSize: 11,
  },
  ratingGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingCol: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 24,
  },
});
