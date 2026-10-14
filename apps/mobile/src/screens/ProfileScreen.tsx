import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStorageMode } from '@/contexts/StorageModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { LocalProfile } from '@/hooks/useLocalStorage';
import { useTheme } from '../contexts/ThemeContext';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import CreateProfileModal from '@/components/CreateProfileModal';
import TacticalCard from '@/components/ui/TacticalCard';
import TacticalButton from '@/components/ui/TacticalButton';
import ThemeToggle from '@/components/ui/ThemeToggle';
import ChessInsignia from '@/components/ui/ChessInsignia';

export default function ProfileScreen() {
  const storageMode = useStorageMode();
  const { colors, radii } = useTheme();
  const {
    user,
    profiles: cloudProfiles,
    activeProfile: cloudActiveProfile,
    setActiveProfile: setCloudActiveProfile,
    signOut: cloudSignOut,
  } = useAuth();
  const {
    profiles: localProfiles,
    activeProfile: localActiveProfile,
    setActiveProfile: setLocalActiveProfile,
    createProfile: localCreateProfile,
    signOut: localSignOut,
  } = useLocalStorage();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);

  const isLocal = storageMode === 'local';
  const profiles = isLocal ? localProfiles : cloudProfiles;
  const activeProfile = isLocal ? localActiveProfile : cloudActiveProfile;

  const handleSwitchProfile = (profile: { id: string } & { name: string }) => {
    if (isLocal) {
      setLocalActiveProfile(profile as LocalProfile);
    } else {
      setCloudActiveProfile(profile.id);
    }
  };

  const handleSignOut = () => {
    const message = isLocal
      ? 'Switch to cloud sign-in? Local data will stay on this device.'
      : 'Sign out of your account?';
    Alert.alert(
      isLocal ? 'Switch to Cloud' : 'Sign Out',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isLocal ? 'Switch' : 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            if (isLocal) {
              await AsyncStorage.removeItem('fide-calculator-mode');
              await localSignOut();
              return;
            }
            await cloudSignOut();
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.canvas }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Player Identity Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <ChessInsignia piece="knight" size={24} badgeSize={48} color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>PLAYER PROFILE</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Official FIDE credentials & account synchronization.
            </Text>
          </View>
        </View>
      </View>

      {/* Active Player Card with Ratings */}
      {activeProfile ? (
        <TacticalCard variant="default" hasOffsetShadow={true} cornerAccents={true} tag="ACTIVE TOURNAMENT PROFILE">
          <View style={styles.playerInfoRow}>
            <View style={[styles.avatarBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {activeProfile.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.playerMeta}>
              <Text style={[styles.activeName, { color: colors.textPrimary }]}>{activeProfile.name}</Text>
              <View style={[styles.modePill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <Ionicons
                  name={isLocal ? 'phone-portrait-outline' : 'cloud-done-outline'}
                  size={12}
                  color={colors.accent}
                />
                <Text style={[styles.modePillText, { color: colors.accent }]}>
                  {isLocal ? 'DEVICE VAULT' : user?.email ?? 'CLOUD SYNC'}
                </Text>
              </View>
            </View>
          </View>

          {/* Rating Tiers Grid */}
          <View style={styles.ratingsGrid}>
            <View style={[styles.ratingTile, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.ratingTileLabel, { color: colors.textSecondary }]}>STANDARD</Text>
              <Text style={[styles.ratingTileVal, { color: colors.textPrimary }]}>{activeProfile.standardRating}</Text>
            </View>
            <View style={[styles.ratingTile, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.ratingTileLabel, { color: colors.textSecondary }]}>RAPID</Text>
              <Text style={[styles.ratingTileVal, { color: colors.textPrimary }]}>{activeProfile.rapidRating}</Text>
            </View>
            <View style={[styles.ratingTile, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.ratingTileLabel, { color: colors.textSecondary }]}>BLITZ</Text>
              <Text style={[styles.ratingTileVal, { color: colors.textPrimary }]}>{activeProfile.blitzRating}</Text>
            </View>
          </View>
        </TacticalCard>
      ) : null}

      {/* Interface Theme Switcher Card */}
      <TacticalCard variant="elevated" hasOffsetShadow={false}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>APPEARANCE & THEME</Text>
        <ThemeToggle compact={false} style={{ marginTop: 8 }} />
      </TacticalCard>

      {/* Profile Switcher Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          SAVED PROFILES ({profiles?.length ?? 0})
        </Text>
      </View>

      {profiles && profiles.length > 0 && (
        <View style={styles.profileList}>
          {profiles.map((profile) => {
            const isActive = activeProfile?.id === profile.id;
            return (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.profileRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isActive ? colors.borderAccent : colors.border,
                    borderRadius: radii.control,
                    borderWidth: isActive ? 2 : 1,
                  },
                  isActive && { backgroundColor: colors.surfaceSelected },
                ]}
                onPress={() => handleSwitchProfile(profile)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Select profile ${profile.name}`}
              >
                <ChessInsignia
                  piece="knight"
                  size={16}
                  badgeSize={30}
                  color={isActive ? colors.primary : colors.textSecondary}
                  badgeBg={colors.surfaceMuted}
                />
                <Text
                  style={[
                    styles.profileName,
                    {
                      color: isActive ? colors.primary : colors.textPrimary,
                      fontWeight: isActive ? '800' : '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {profile.name}
                </Text>
                {isActive ? (
                  <View style={[styles.activeBadge, { backgroundColor: colors.winBg, borderColor: colors.win }]}>
                    <Text style={[styles.activeBadgeText, { color: colors.win }]}>ACTIVE</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Primary Actions */}
      <View style={styles.actionsGroup}>
        <TacticalButton
          title="Create New Profile"
          onPress={() => setShowCreateProfile(true)}
          variant="primary"
          size="lg"
          icon={<Ionicons name="person-add" size={18} color={colors.primaryText} />}
        />

        {!isLocal && (
          <TacticalButton
            title="Change Password"
            onPress={() => setShowChangePassword(true)}
            variant="secondary"
            size="md"
            icon={<Ionicons name="key-outline" size={16} color={colors.textSecondary} />}
          />
        )}

        <TacticalButton
          title={isLocal ? 'Switch to Cloud Mode' : 'Sign Out'}
          onPress={handleSignOut}
          variant="danger"
          size="md"
          icon={<Ionicons name={isLocal ? 'cloud-upload-outline' : 'log-out-outline'} size={16} color={colors.loss} />}
        />
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          ♞ FIDE CALCULATOR // PRECISION ENGINE
        </Text>
        <Text style={[styles.footerSubtext, { color: colors.textMuted }]}>
          DGT Spec Tournament Elo & Performance System
        </Text>
      </View>

      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      <CreateProfileModal
        open={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        onSuccess={() => {}}
        isLocal={isLocal}
        localCreateProfile={isLocal ? localCreateProfile : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  playerMeta: {
    flex: 1,
  },
  activeName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ratingsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  ratingTileLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  ratingTileVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  profileList: {
    gap: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingHorizontal: 12,
    gap: 10,
  },
  profileName: {
    flex: 1,
    fontSize: 14,
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionsGroup: {
    gap: 10,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 4,
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  footerSubtext: {
    fontSize: 10,
    fontWeight: '600',
  },
});
