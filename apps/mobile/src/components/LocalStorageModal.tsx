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
import { useTheme } from '../contexts/ThemeContext';
import TacticalCard from './ui/TacticalCard';
import ChessInsignia from './ui/ChessInsignia';

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
  const { colors, radii, borderWidth, typography, touchTargets } = useTheme();
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
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: borderWidth.heavy,
              borderRadius: radii.xl,
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: borderWidth.medium,
                },
              ]}
            >
              <View style={styles.titleContainer}>
                <ChessInsignia piece="rook" size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.headerTag, { color: colors.accent }]}>
                    [ AIR-GAPPED // LOCAL DEVICE ]
                  </Text>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>
                    Local Storage Mode
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                    borderWidth: borderWidth.thin,
                    borderRadius: radii.sm,
                  },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close local storage modal"
              >
                <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tactical Info Box */}
            <TacticalCard
              title="OFFLINE ADVANTAGES"
              badge="PRIVATE"
              variant="accent"
              style={{ marginBottom: 16 }}
            >
              <Text style={[styles.infoItem, { color: colors.textPrimary }]}>
                • Data stored exclusively on this physical device
              </Text>
              <Text style={[styles.infoItem, { color: colors.textPrimary }]}>
                • Zero account or network sign-in required
              </Text>
              <Text style={[styles.infoItem, { color: colors.textPrimary }]}>
                • Instant offline calculation and match tracking
              </Text>
              <Text style={[styles.infoItem, { color: colors.textPrimary }]}>
                • Full privacy and air-gapped tournament reliability
              </Text>
            </TacticalCard>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  PLAYER NAME *
                </Text>
                <FideSearchInput
                  value={name}
                  onChange={(val) => {
                    setName(val);
                    if (error) setError('');
                  }}
                  onSelect={handleFidePlayerSelect}
                  placeholder="Search for a FIDE player or enter name"
                />
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                  Search for a FIDE player to auto-fill details, or type your name manually.
                </Text>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    FIDE ID (OPTIONAL)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                        borderWidth: borderWidth.thin,
                        borderRadius: radii.sm,
                        color: colors.textPrimary,
                        ...typography.mono,
                      },
                    ]}
                    value={fideId}
                    onChangeText={setFideId}
                    placeholder="e.g. 12345678"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    accessibilityLabel="FIDE ID"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    TITLE (OPTIONAL)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                        borderWidth: borderWidth.thin,
                        borderRadius: radii.sm,
                        color: colors.textPrimary,
                      },
                    ]}
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
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    FEDERATION
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                        borderWidth: borderWidth.thin,
                        borderRadius: radii.sm,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={federation}
                    onChangeText={setFederation}
                    placeholder="e.g. USA, ENG"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    accessibilityLabel="Federation"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    BIRTH YEAR
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                        borderWidth: borderWidth.thin,
                        borderRadius: radii.sm,
                        color: colors.textPrimary,
                        ...typography.mono,
                      },
                    ]}
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
                <View
                  style={[
                    styles.errorContainer,
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

              <View style={styles.buttonRow}>
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
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.border,
                      borderWidth: borderWidth.medium,
                      borderRadius: radii.sm,
                      minHeight: touchTargets.primaryControl,
                    },
                    loading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Create Local Profile"
                >
                  {loading ? (
                    typeof ActivityIndicator === 'function' ? (
                      <ActivityIndicator color={colors.primaryText} />
                    ) : (
                      <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>
                        Creating...
                      </Text>
                    )
                  ) : (
                    <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>
                      Create Local Profile
                    </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
  },
  titleContainer: {
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
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '900',
  },
  infoItem: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  form: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  hint: {
    fontSize: 11,
    lineHeight: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
    fontWeight: '900',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
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
  submitButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
