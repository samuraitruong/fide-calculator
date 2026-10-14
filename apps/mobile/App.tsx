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
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AuthModal from './src/components/AuthModal';
import LocalStorageModal from './src/components/LocalStorageModal';
import ForgotPasswordModal from './src/components/ForgotPasswordModal';
import MainTabs from './src/navigation/MainTabs';
import ChessInsignia from './src/components/ui/ChessInsignia';
import TacticalButton from './src/components/ui/TacticalButton';
import TacticalCard from './src/components/ui/TacticalCard';

function AppContent() {
  const { user, loading } = useAuth();
  const { isDark, colors } = useTheme();
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
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <View style={styles.loadingContainer}>
          <ChessInsignia piece="knight" size={32} badgeSize={64} color={colors.primary} />
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Initializing Engine...</Text>
        </View>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  // Main app with bottom tabs (local with profile, or cloud when signed in)
  if ((storageMode === 'local' && localActiveProfile) || (storageMode === 'cloud' && user)) {
    const mode = storageMode as 'local' | 'cloud';
    return (
      <StorageModeProvider mode={mode}>
        <MainTabs />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </StorageModeProvider>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.canvas }]} edges={['bottom', 'top']}>
        <ScrollView
          contentContainerStyle={styles.authScrollContent}
          style={styles.authScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Tournament Header Graphic Banner */}
          <View style={styles.authContent}>
            <View style={styles.authHeader}>
              <View style={[styles.badgeCluster, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
                <ChessInsignia piece="knight" size={28} badgeSize={52} color={colors.primary} />
                <View style={styles.badgeClusterText}>
                  <Text style={[styles.kTag, { color: colors.accent }]}>[ FIDE TOURNAMENT ENGINE ]</Text>
                  <Text style={[styles.sysVer, { color: colors.textMuted }]}>v0.1 // DGT CLOCK SPEC</Text>
                </View>
              </View>

              <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
                FIDE RATING{'\n'}CALCULATOR
              </Text>
              <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
                Precision Elo calculation, tournament performance rating tracking, and game logging.
              </Text>
            </View>

            {/* Tactical Action Buttons */}
            <View style={styles.authButtons}>
              <TacticalButton
                title="Get Started (Local Storage)"
                onPress={() => setShowLocalStorageModal(true)}
                variant="primary"
                size="lg"
                icon={<Ionicons name="phone-portrait-outline" size={20} color={colors.primaryText} />}
              />

              <View style={styles.orRow}>
                <View style={[styles.orLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.orText, { color: colors.textMuted }]}>OR CONNECT</Text>
                <View style={[styles.orLine, { backgroundColor: colors.border }]} />
              </View>

              <TacticalButton
                title="Sign In / Create Account"
                onPress={() => setShowAuthModal(true)}
                variant="secondary"
                size="lg"
                icon={<Ionicons name="cloud-outline" size={20} color={colors.primary} />}
              />

              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={() => setShowForgotPasswordModal(true)}
              >
                <Text style={[styles.forgotPasswordLinkText, { color: colors.textSecondary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Storage Feature Breakdown Cards */}
            <View style={styles.storageSection}>
              <TacticalCard variant="elevated" hasOffsetShadow={false} style={styles.storageCard}>
                <View style={styles.storageCardInner}>
                  <View style={[styles.storageIcon, { backgroundColor: colors.surfaceMuted, borderColor: colors.primary }]}>
                    <Ionicons name="cloud-done-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.storageCardText}>
                    <Text style={[styles.storageCardTitle, { color: colors.textPrimary }]}>Cloud Sync Profile</Text>
                    <Text style={[styles.storageCardDesc, { color: colors.textSecondary }]}>
                      Multi-device synchronization between web, tablet, and mobile.
                    </Text>
                  </View>
                </View>
              </TacticalCard>

              <TacticalCard variant="elevated" hasOffsetShadow={false} style={styles.storageCard}>
                <View style={styles.storageCardInner}>
                  <View style={[styles.storageIcon, { backgroundColor: colors.surfaceMuted, borderColor: colors.accent }]}>
                    <Ionicons name="lock-closed-outline" size={22} color={colors.accent} />
                  </View>
                  <View style={styles.storageCardText}>
                    <Text style={[styles.storageCardTitle, { color: colors.textPrimary }]}>Local Device Vault</Text>
                    <Text style={[styles.storageCardDesc, { color: colors.textSecondary }]}>
                      Zero account required. Fast, private calculation stored strictly on device.
                    </Text>
                  </View>
                </View>
              </TacticalCard>
            </View>
          </View>
        </ScrollView>

        <AuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onForgotPassword={() => {
            setShowAuthModal(false);
            setShowForgotPasswordModal(true);
          }}
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

        <StatusBar style={isDark ? 'light' : 'dark'} />
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
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  authScroll: {
    flex: 1,
  },
  authScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  authContent: {
    width: '100%',
  },
  authHeader: {
    marginBottom: 28,
    alignItems: 'center',
  },
  badgeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    marginBottom: 20,
    gap: 12,
  },
  badgeClusterText: {
    justifyContent: 'center',
  },
  kTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sysVer: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  authTitle: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  authSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  authButtons: {
    gap: 12,
    marginBottom: 28,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: 12,
  },
  forgotPasswordLink: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  forgotPasswordLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  storageSection: {
    gap: 12,
  },
  storageCard: {
    padding: 0,
  },
  storageCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  storageIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageCardText: {
    flex: 1,
  },
  storageCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  storageCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
