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
import type { UserProfile } from '@fide-calculator/shared';
import { useAuth } from '@/contexts/AuthContext';
import type { LocalProfile } from '@/hooks/useLocalStorage';
import type { FidePlayer } from '@/hooks/useFideData';
import FideSearchInput from './FideSearchInput';

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
      setError('Name is required.');
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
    } catch (e) {
      setError('Something went wrong.');
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
            <View style={styles.header}>
              <Text style={styles.title}>New Profile</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Text style={styles.hint}>
                Search FIDE players or enter your name to auto-fill ratings.
              </Text>

              <Text style={styles.label}>Player name *</Text>
              <FideSearchInput
                value={name}
                onChange={setName}
                onSelect={handleFideSelect}
                placeholder="Search FIDE players or enter your name"
              />

              <Text style={styles.label}>FIDE ID</Text>
              <TextInput
                style={styles.input}
                value={fideId}
                onChangeText={setFideId}
                placeholder="e.g. 12345678"
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Title</Text>
              <View style={styles.titleRow}>
                {TITLES.map((t) => (
                  <TouchableOpacity
                    key={t || 'none'}
                    style={[styles.titleChip, t === title && styles.titleChipActive]}
                    onPress={() => setTitle(t)}
                  >
                    <Text style={[styles.titleChipText, t === title && styles.titleChipTextActive]}>
                      {t || 'None'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Federation</Text>
              <TextInput
                style={styles.input}
                value={federation}
                onChangeText={(text) => setFederation(text.toUpperCase().slice(0, 3))}
                placeholder="e.g. USA, GER"
                autoCapitalize="characters"
                maxLength={3}
              />

              <Text style={styles.label}>Birth year</Text>
              <TextInput
                style={styles.input}
                value={birthYear}
                onChangeText={setBirthYear}
                placeholder="e.g. 1990"
                keyboardType="number-pad"
              />

              <Text style={styles.sectionLabel}>Current ratings</Text>
              <Text style={styles.label}>Standard</Text>
              <TextInput
                style={styles.input}
                value={String(standardRating)}
                onChangeText={(t) => setNum(setStandardRating, t)}
                keyboardType="number-pad"
                placeholder="1500"
              />
              <Text style={styles.label}>Rapid</Text>
              <TextInput
                style={styles.input}
                value={String(rapidRating)}
                onChangeText={(t) => setNum(setRapidRating, t)}
                keyboardType="number-pad"
                placeholder="1500"
              />
              <Text style={styles.label}>Blitz</Text>
              <TextInput
                style={styles.input}
                value={String(blitzRating)}
                onChangeText={(t) => setNum(setBlitzRating, t)}
                keyboardType="number-pad"
                placeholder="1500"
              />

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    maxHeight: '90%',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeText: {
    fontSize: 22,
    color: '#6b7280',
    padding: 4,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  titleChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  titleChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  titleChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  titleChipTextActive: {
    color: '#fff',
  },
  error: {
    fontSize: 14,
    color: '#b91c1c',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
