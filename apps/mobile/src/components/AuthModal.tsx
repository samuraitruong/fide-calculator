import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, radii, spacing, typography, touchTargets, shadows } from '../theme/tokens';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onForgotPassword?: () => void;
}

export default function AuthModal({ open, onClose, onSuccess, onForgotPassword }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (isSignUp) {
      if (!confirmPassword.trim()) {
        setError('Please confirm your password.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const { error: authError } = isSignUp
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password);

      if (authError) {
        setError(authError.message);
      } else {
        onSuccess();
        onClose();
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerMotif}>♟</Text>
                <Text style={styles.title}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close sign in modal"
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.passwordContainer, error && styles.inputError]}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (error) setError('');
                    }}
                    placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {!isSignUp && onForgotPassword ? (
                <TouchableOpacity
                  onPress={onForgotPassword}
                  style={styles.forgotPasswordButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Forgot password"
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              ) : null}

              {isSignUp ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={[styles.passwordContainer, error && styles.inputError]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        if (error) setError('');
                      }}
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessibilityLabel="Confirm password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color={colors.negativeText} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={isSignUp ? 'Create account' : 'Sign in'}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryText} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setConfirmPassword('');
                  setError('');
                }}
                style={styles.footerTouchable}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.footerLabel}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </Text>
                <Text style={styles.footerLink}>
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </Text>
              </TouchableOpacity>
            </View>

            {isSignUp ? (
              <Text style={styles.termsText}>
                By creating an account, your chess games and ratings sync securely to the cloud.
              </Text>
            ) : null}

            <View style={styles.branding}>
              <Text style={styles.brandingMotif}>♞</Text>
              <Text style={styles.brandingText}>FRIENDLY CHESS CLUB</Text>
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
    maxWidth: 400,
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
  form: {
    gap: spacing.lg,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargets.min,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: spacing.md - 2,
    ...typography.body,
    color: colors.textPrimary,
  },
  eyeButton: {
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
    paddingVertical: spacing.xs,
    minHeight: 36,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.negativeBg,
    borderRadius: radii.control,
    padding: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    ...typography.caption,
    color: colors.negativeText,
    fontWeight: '700',
  },
  submitButton: {
    minHeight: touchTargets.primaryControl,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...typography.bodyBold,
    color: colors.primaryText,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  footerLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  termsText: {
    marginTop: spacing.md,
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.xl,
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
