import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ChessInsignia from './ui/ChessInsignia';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { colors, radii, borderWidth, touchTargets } = useTheme();
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: err } = await updatePassword(newPassword);
    setLoading(false);
    if (err) {
      setError(err.message || 'Failed to update password');
    } else {
      setSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(onClose, 1200);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
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
              <View style={styles.headerTitleRow}>
                <ChessInsignia piece="knight" size={18} color={colors.primary} />
                <View>
                  <Text style={[styles.headerTag, { color: colors.primary }]}>
                    [ CIPHER UPDATE ]
                  </Text>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>Change Password</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
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
                accessibilityLabel="Close change password modal"
              >
                <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
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

              {success ? (
                <View
                  style={[
                    styles.successContainer,
                    {
                      backgroundColor: colors.positiveBg,
                      borderColor: colors.positive,
                      borderWidth: borderWidth.thin,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text style={[styles.successIcon, { color: colors.positiveText }]}>✓</Text>
                  <Text style={[styles.successText, { color: colors.positiveText }]}>{success}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  NEW PASSWORD
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: error ? colors.negative : colors.border,
                      borderWidth: borderWidth.thin,
                      borderRadius: radii.sm,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    if (error) setError('');
                  }}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="New password"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  CONFIRM NEW PASSWORD
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: error ? colors.negative : colors.border,
                      borderWidth: borderWidth.thin,
                      borderRadius: radii.sm,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (error) setError('');
                  }}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Confirm new password"
                />
              </View>

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
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
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
                  accessibilityLabel="Update password"
                >
                  {loading ? (
                    typeof ActivityIndicator === 'function' ? (
                      <ActivityIndicator color={colors.primaryText} />
                    ) : (
                      <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>Updating...</Text>
                    )
                  ) : (
                    <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    width: '100%',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitleRow: {
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
  content: {
    padding: 20,
    gap: 14,
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  successIcon: {
    fontSize: 14,
    fontWeight: '900',
  },
  successText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
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
