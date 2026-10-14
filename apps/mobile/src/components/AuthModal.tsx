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
import { useTheme } from '../contexts/ThemeContext';
import ChessInsignia from './ui/ChessInsignia';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onForgotPassword?: () => void;
}

export default function AuthModal({ open, onClose, onSuccess, onForgotPassword }: AuthModalProps) {
  const { colors, radii, borderWidth, touchTargets } = useTheme();
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

  const hasIonicons = typeof Ionicons === 'function';

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
            keyboardShouldPersistTaps="handled"
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
              <View style={styles.headerTitleRow}>
                <ChessInsignia piece="knight" size={18} color={colors.primary} />
                <View>
                  <Text style={[styles.headerTag, { color: colors.primary }]}>
                    [ ACCESS AUTHENTICATION ]
                  </Text>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
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
                accessibilityLabel="Close sign in modal"
              >
                {hasIonicons ? (
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                ) : (
                  <Text style={[styles.closeIconText, { color: colors.textPrimary }]}>✕</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  EMAIL IDENTIFIER
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
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (error) setError('');
                  }}
                  placeholder="player@fide.org"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  ACCESS PASSWORD
                </Text>
                <View
                  style={[
                    styles.passwordContainer,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: error ? colors.negative : colors.border,
                      borderWidth: borderWidth.thin,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordInput, { color: colors.textPrimary }]}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (error) setError('');
                    }}
                    placeholder={isSignUp ? 'Create strong password' : 'Enter access key'}
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
                    {hasIonicons ? (
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    ) : (
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    )}
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
                  <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                    Reset forgotten credentials →
                  </Text>
                </TouchableOpacity>
              ) : null}

              {isSignUp ? (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    CONFIRM PASSWORD
                  </Text>
                  <View
                    style={[
                      styles.passwordContainer,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: error ? colors.negative : colors.border,
                        borderWidth: borderWidth.thin,
                        borderRadius: radii.sm,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.passwordInput, { color: colors.textPrimary }]}
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        if (error) setError('');
                      }}
                      placeholder="Repeat password"
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
                      {hasIonicons ? (
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={colors.textSecondary}
                        />
                      ) : (
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

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
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={isSignUp ? 'Create account' : 'Sign in'}
              >
                {loading ? (
                  typeof ActivityIndicator === 'function' ? (
                    <ActivityIndicator color={colors.primaryText} />
                  ) : (
                    <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>
                      Processing...
                    </Text>
                  )
                ) : (
                  <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>
                    {isSignUp ? '[ CREATE ACCOUNT ]' : '[ SIGN IN ]'}
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
                <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
                  {isSignUp ? 'Already registered? ' : "Need an account? "}
                </Text>
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  {isSignUp ? 'Sign in' : 'Create profile'}
                </Text>
              </TouchableOpacity>
            </View>

            {isSignUp ? (
              <Text style={[styles.termsText, { color: colors.textMuted }]}>
                By creating an account, your chess games and ratings sync securely to cloud telemetry storage.
              </Text>
            ) : null}

            <View
              style={[
                styles.branding,
                {
                  borderTopColor: colors.borderSubtle,
                  borderTopWidth: borderWidth.thin,
                },
              ]}
            >
              <Text style={[styles.brandingMotif, { color: colors.primary }]}>♞</Text>
              <Text style={[styles.brandingText, { color: colors.textMuted }]}>
                PRECISION CHESS ENGINE
              </Text>
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
    maxWidth: 420,
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
    marginBottom: 20,
    paddingBottom: 12,
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
  closeIconText: {
    fontSize: 16,
    fontWeight: '900',
  },
  form: {
    gap: 14,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
  },
  passwordInput: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  eyeButton: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-start',
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '700',
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
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 18,
    alignItems: 'center',
  },
  footerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingTop: 12,
  },
  brandingMotif: {
    fontSize: 16,
  },
  brandingText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
