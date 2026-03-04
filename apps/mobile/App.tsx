/**
 * FIDE Calculator Mobile App
 * Main entry point for the Expo application
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { useLocalStorage } from './src/hooks/useLocalStorage';
import { StorageModeProvider } from './src/contexts/StorageModeContext';
import AuthModal from './src/components/AuthModal';
import LocalStorageModal from './src/components/LocalStorageModal';
import ForgotPasswordModal from './src/components/ForgotPasswordModal';
import MainTabs from './src/navigation/MainTabs';

function AppContent() {
  const { user, loading, profiles, activeProfile, signOut } = useAuth();
  const {
    activeProfile: localActiveProfile,
    createProfile,
  } = useLocalStorage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLocalStorageModal, setShowLocalStorageModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [storageMode, setStorageMode] = useState<'cloud' | 'local' | null>(null);

  // Detect storage mode on mount and when user changes
  useEffect(() => {
    const checkStorageMode = async () => {
      try {
        const mode = await AsyncStorage.getItem('fide-calculator-mode');
        if (mode === 'local') {
          setStorageMode('local');
        } else if (user) {
          setStorageMode('cloud');
        } else {
          setStorageMode(null);
        }
      } catch (error) {
        console.error('Error checking storage mode:', error);
      }
    };
    checkStorageMode();
  }, [user]);

  if (loading && storageMode === null) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <StatusBar style="auto" />
      </View>
    );
  }

  // Main app with bottom tabs (local with profile, or cloud when signed in)
  if ((storageMode === 'local' && localActiveProfile) || (storageMode === 'cloud' && user)) {
    const mode = storageMode as 'local' | 'cloud';
    return (
      <StorageModeProvider mode={mode}>
        <MainTabs />
        <StatusBar style="auto" />
      </StorageModeProvider>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.authScrollContent}
          style={styles.authScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.landingDeco} />
          <View style={styles.authContent}>
            <View style={styles.authHeader}>
              <Text style={styles.authTitle}>
                FIDE Rating{'\n'}Calculator
              </Text>
              <Text style={styles.authSubtitle}>
                Track your professional chess rating progress and manage your games with precision.
              </Text>
            </View>

            <View style={styles.authButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setShowLocalStorageModal(true)}
              >
                <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Get Started (Local)</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.orText}>OR</Text>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowAuthModal(true)}
              >
                <Ionicons name="person-outline" size={20} color="#2563eb" />
                <Text style={styles.secondaryButtonText}>Sign In / Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={() => setShowForgotPasswordModal(true)}
              >
                <Text style={styles.forgotPasswordLinkText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.storageSection}>
              <View style={styles.storageCard}>
                <View style={styles.storageIconCloud}>
                  <Ionicons name="cloud-done" size={24} color="#fff" />
                </View>
                <View style={styles.storageCardText}>
                  <Text style={styles.storageCardTitle}>Cloud Storage</Text>
                  <Text style={styles.storageCardDesc}>
                    Perfect for sync between your phone, tablet, and web.
                  </Text>
                </View>
              </View>
              <View style={styles.storageCard}>
                <View style={styles.storageIconLocal}>
                  <Ionicons name="lock-closed" size={22} color="#fff" />
                </View>
                <View style={styles.storageCardText}>
                  <Text style={styles.storageCardTitle}>Local Only</Text>
                  <Text style={styles.storageCardDesc}>
                    Private storage on this device only. No account needed.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <AuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setStorageMode('cloud');
          }}
        />

        <ForgotPasswordModal
          open={showForgotPasswordModal}
          onClose={() => setShowForgotPasswordModal(false)}
        />

        <LocalStorageModal
          open={showLocalStorageModal}
          onClose={() => setShowLocalStorageModal(false)}
          onSuccess={async (profileData) => {
            // Create the local profile
            createProfile(profileData);
            await AsyncStorage.setItem('fide-calculator-mode', 'local');
            setStorageMode('local');
            setShowLocalStorageModal(false);
          }}
        />

        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'stretch',
  },
  contentFullScreen: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  welcomeContent: {
    width: '100%',
  },
  authScroll: {
    flex: 1,
  },
  authScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  landingDeco: {
    position: 'absolute',
    top: -140,
    left: -100,
    width: 420,
    height: 340,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 320,
    borderBottomLeftRadius: 280,
    borderBottomRightRadius: 300,
    backgroundColor: '#2563eb',
    opacity: 0.95,
  },
  authContent: {
    width: '100%',
  },
  authHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 34,
  },
  authSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
    marginTop: 64,
  },
  authButtons: {
    gap: 14,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  forgotPasswordLinkText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  storageSection: {
    gap: 16,
  },
  storageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  storageIconCloud: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  storageIconLocal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  storageCardText: {
    flex: 1,
  },
  storageCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  storageCardDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  welcomeSection: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  createProfileButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  createProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    padding: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  profileInfo: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  modeIndicator: {
    marginTop: 16,
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
});
