/**
 * FIDE Calculator Mobile App
 * Main entry point for the Expo application
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.authScrollContent}
          style={styles.authScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authContent}>
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
    paddingTop: 32,
    paddingBottom: 40,
    justifyContent: 'center',
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
