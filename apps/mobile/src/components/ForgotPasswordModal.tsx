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
import { colors, radii, spacing, typography, touchTargets, shadows } from '../theme/tokens';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const { error: resetError } = await requestPasswordReset(email.trim());
    setLoading(false);
    if (resetError) {
      setError(resetError.message || 'Failed to send reset email');
    } else {
      setSuccess('Reset email sent. Please check your inbox.');
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setEmail('');
    onClose();
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerMotif}>♟</Text>
                <Text style={styles.title}>Forgot Password</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close forgot password modal"
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text style={styles.subtitle}>
                Enter the email address registered with your chess account and we&apos;ll send you a password reset link.
              </Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {success ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.successText}>{success}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, Boolean(error) && styles.inputError]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email address"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
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
                  accessibilityLabel="Send reset link"
                >
                  {loading ? (
                    <ActivityIndicator color={colors.primaryText} />
                  ) : (
                    <Text style={styles.submitButtonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Branding badge */}
              <View style={styles.branding}>
                <Text style={styles.brandingMotif}>♞</Text>
                <Text style={styles.brandingText}>FRIENDLY CHESS CLUB</Text>
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
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    ...shadows.sheet,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerMotif: {
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
  content: {
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  inputGroup: {
    gap: spacing.xs + 2,
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
  inputError: {
    borderColor: colors.negativeText,
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.positiveBg,
    borderRadius: radii.control,
    padding: spacing.md,
    gap: spacing.sm,
  },
  successIcon: {
    fontSize: 16,
    color: colors.positiveText,
    fontWeight: '700',
  },
  successText: {
    flex: 1,
    ...typography.caption,
    color: colors.positiveText,
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
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  brandingMotif: {
    fontSize: 16,
    color: colors.primary,
  },
  brandingText: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
});
