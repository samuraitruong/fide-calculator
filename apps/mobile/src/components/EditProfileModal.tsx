import React, { useState, useEffect } from 'react';
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
import type { LocalProfile } from '@/hooks/useLocalStorage';
import FideSearchInput from './FideSearchInput';
import type { FidePlayer } from '@/hooks/useFideData';

type ProfileLike = {
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

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setFideId(profile.fideId ?? '');
      setStandardRating(profile.standardRating);
      setRapidRating(profile.rapidRating);
      setBlitzRating(profile.blitzRating);
    }
  }, [profile, open]);

  const handleFideSelect = (player: FidePlayer) => {
    setName(player.name);
    setFideId(player.fideId ?? '');
    if (player.standard && player.standard !== '-') setStandardRating(parseInt(player.standard, 10) || 1500);
    if (player.rapid && player.rapid !== '-') setRapidRating(parseInt(player.rapid, 10) || 1500);
    if (player.blitz && player.blitz !== '-') setBlitzRating(parseInt(player.blitz, 10) || 1500);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await Promise.resolve(
        onSave({
          name: name.trim(),
          fideId: fideId.trim() || undefined,
          standardRating,
          rapidRating,
          blitzRating,
        }),
      );
      onSuccess();
      onClose();
    } catch (e) {
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
              <Text style={styles.title}>Edit profile</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Text style={styles.hint}>Search by name to fill from FIDE and update ratings.</Text>
              <Text style={styles.label}>Name *</Text>
              <FideSearchInput
                value={name}
                onChange={setName}
                onSelect={handleFideSelect}
                placeholder="Search FIDE or enter name"
              />
              <Text style={styles.label}>FIDE ID</Text>
              <TextInput
                style={styles.input}
                value={fideId}
                onChangeText={setFideId}
                placeholder="e.g. 12345678"
                keyboardType="number-pad"
              />
              <Text style={styles.label}>Standard rating</Text>
              <TextInput
                style={styles.input}
                value={String(standardRating)}
                onChangeText={(t) => setNum(setStandardRating, t)}
                keyboardType="number-pad"
                placeholder="1500"
              />
              <Text style={styles.label}>Rapid rating</Text>
              <TextInput
                style={styles.input}
                value={String(rapidRating)}
                onChangeText={(t) => setNum(setRapidRating, t)}
                keyboardType="number-pad"
                placeholder="1500"
              />
              <Text style={styles.label}>Blitz rating</Text>
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
