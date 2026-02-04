/**
 * FIDE Calculator Mobile App
 * Main entry point for the Expo application
 */

import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { useLocalStorage } from './src/hooks/useLocalStorage';
import AuthModal from './src/components/AuthModal';
import LocalStorageModal from './src/components/LocalStorageModal';
import ForgotPasswordModal from './src/components/ForgotPasswordModal';

function AppContent() {
  const { user, loading, profiles, activeProfile, signOut } = useAuth();
  const { activeProfile: localActiveProfile, createProfile } = useLocalStorage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLocalStorageModal, setShowLocalStorageModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [storageMode, setStorageMode] = useState<'cloud' | 'local' | null>(null);

  // Detect storage mode on mount
  useEffect(() => {
    const checkStorageMode = async () => {
      try {
        const mode = await AsyncStorage.getItem('fide-calculator-mode');
        if (mode === 'local') {
          setStorageMode('local');
        } else if (user) {
          setStorageMode('cloud');
        }
      } catch (error) {
        console.error('Error checking storage mode:', error);
      }
    };
    checkStorageMode();
  }, [user]);

  if (loading && !storageMode) {
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

  // Handle local storage mode
  if (storageMode === 'local' && localActiveProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>FIDE Calculator</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{localActiveProfile.name}</Text>
            <Text>Standard: {localActiveProfile.standardRating}</Text>
            <Text>Rapid: {localActiveProfile.rapidRating}</Text>
            <Text>Blitz: {localActiveProfile.blitzRating}</Text>
          </View>
          <Text style={styles.modeIndicator}>Local Storage Mode</Text>
        </ScrollView>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.authContainer}>
          <View style={styles.authCard}>
            <View style={styles.authHeader}>
              <Text style={styles.authTitle}>FIDE Rating Calculator</Text>
              <Text style={styles.authSubtitle}>
                Track your chess rating changes and manage your games
              </Text>
            </View>

            <View style={styles.authButtons}>
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => setShowAuthModal(true)}
              >
                <Text style={styles.signInButtonText}>🔐 Sign In / Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => setShowForgotPasswordModal(true)}
              >
                <Text style={styles.forgotPasswordButtonText}>📧 Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.localStorageButton}
                onPress={() => setShowLocalStorageModal(true)}
              >
                <Text style={styles.localStorageButtonText}>💾 Store on My Local</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Cloud Storage:</Text> Sign in to sync across devices
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Local Storage:</Text> Data stays on this device only
              </Text>
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

  if (!profiles || profiles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.authCard}>
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <Text style={styles.welcomeSubtitle}>
              Please create your chess player profile to get started
            </Text>
            <TouchableOpacity
              style={styles.createProfileButton}
              onPress={() => {
                // TODO: Show profile creation modal
              }}
            >
              <Text style={styles.createProfileButtonText}>👤 Create Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={signOut}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>FIDE Calculator</Text>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome, {user.email}</Text>
          {activeProfile && (
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{activeProfile.name}</Text>
              <Text>Standard: {activeProfile.standardRating}</Text>
              <Text>Rapid: {activeProfile.rapidRating}</Text>
              <Text>Blitz: {activeProfile.blitzRating}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
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
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  authHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  authButtons: {
    gap: 12,
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  forgotPasswordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  localStorageButton: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  localStorageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoBold: {
    fontWeight: '600',
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
    maxWidth: 400,
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
