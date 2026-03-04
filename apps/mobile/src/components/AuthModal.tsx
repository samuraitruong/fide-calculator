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

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
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
      setError('Please fill in all fields');
      return;
    }
    if (isSignUp) {
      if (!confirmPassword.trim()) {
        setError('Please confirm your password');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
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
      setError('An unexpected error occurred');
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
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, error && styles.labelError]}>Email</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, error && styles.labelError]}>Password</Text>
                <View style={[styles.passwordContainer, error && styles.inputError]}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={(t) => { setPassword(t); if (error) setError(''); }}
                    placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {isSignUp ? (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, error && styles.labelError]}>Confirm Password</Text>
                  <View style={[styles.passwordContainer, error && styles.inputError]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={(t) => { setConfirmPassword(t); if (error) setError(''); }}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#9ca3af"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#dc2626" style={styles.errorIcon} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
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
              >
                <Text style={styles.footerLabel}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </Text>
                <Text style={styles.footerLink}>
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </Text>
              </TouchableOpacity>
            </View>

            {isSignUp && (
              <>
                <Text style={styles.termsText}>
                  By creating an account, you agree to our terms of service and privacy policy.
                </Text>
                <View style={styles.branding}>
                  <Ionicons name="trophy-outline" size={14} color="#9ca3af" />
                  <Text style={styles.brandingText}>FIDE RATING CALCULATOR</Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  labelError: {
    color: '#dc2626',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc2626',
    borderWidth: 1.5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    paddingRight: 8,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    padding: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 14,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  footerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  termsText: {
    marginTop: 16,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  brandingText: {
    fontSize: 11,
    color: '#9ca3af',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});

