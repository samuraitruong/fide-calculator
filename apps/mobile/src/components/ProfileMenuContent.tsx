import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStorageMode } from '@/contexts/StorageModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { LocalProfile } from '@/hooks/useLocalStorage';
import { useTheme } from '../contexts/ThemeContext';
import ChangePasswordModal from './ChangePasswordModal';
import CreateProfileModal from './CreateProfileModal';
import EditProfileModal from './EditProfileModal';
import TacticalCard from './ui/TacticalCard';
import TacticalButton from './ui/TacticalButton';
import ThemeToggle from './ui/ThemeToggle';
import ChessInsignia from './ui/ChessInsignia';

export default function ProfileMenuContent() {
  const storageMode = useStorageMode();
  const { colors } = useTheme();
  const {
    user,
    profiles: cloudProfiles,
    activeProfile: cloudActiveProfile,
    setActiveProfile: setCloudActiveProfile,
    updateProfile: cloudUpdateProfile,
    signOut: cloudSignOut,
  } = useAuth();
  const {
    profiles: localProfiles,
    activeProfile: localActiveProfile,
    setActiveProfile: setLocalActiveProfile,
    createProfile: localCreateProfile,
    updateProfile: localUpdateProfile,
    signOut: localSignOut,
  } = useLocalStorage();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const isLocal = storageMode === 'local';
  const profiles = isLocal ? localProfiles : cloudProfiles;
  const activeProfile = isLocal ? localActiveProfile : cloudActiveProfile;

  const displayName = activeProfile?.name ?? user?.email ?? 'Chess Player';
  const email = user?.email;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CP';

  const handleSwitchProfile = (profile: { id: string } & { name: string }) => {
    if (isLocal) {
      setLocalActiveProfile(profile as LocalProfile);
    } else {
      setCloudActiveProfile(profile.id);
    }
  };

  const handleSignOut = () => {
    const message = isLocal
      ? 'Switch to cloud sign-in? Local data will remain saved on this device.'
      : 'Sign out of your account on this device?';
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
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.surface }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={styles.profileHeaderText}>
            <Text style={[styles.profileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={[styles.modeBadge, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[styles.modeBadgeText, { color: colors.accent }]}>
                {isLocal ? '📱 LOCAL STORAGE' : email ? `☁ ${email}` : '☁ CLOUD ACCOUNT'}
              </Text>
            </View>
          </View>
        </View>

        {/* Theme Mode Selector Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>INTERFACE THEME</Text>
          <ThemeToggle compact={false} />
        </View>

        {/* Active Profile Summary Card */}
        {activeProfile ? (
          <TacticalCard variant="elevated" hasOffsetShadow={false} style={styles.activeCard}>
            <View style={styles.activeCardHeader}>
              <View style={[styles.activeBadge, { backgroundColor: colors.winBg, borderColor: colors.win }]}>
                <Ionicons name="checkmark-circle" size={13} color={colors.win} />
                <Text style={[styles.activeBadgeText, { color: colors.win }]}>ACTIVE PROFILE</Text>
              </View>

              <TouchableOpacity
                style={[styles.editIconButton, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                onPress={() => setShowEditProfile(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Edit active profile details"
              >
                <Ionicons name="pencil-sharp" size={15} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.activeName, { color: colors.textPrimary }]}>{activeProfile.name}</Text>
            <View style={styles.ratingsRow}>
              <View style={[styles.ratingChip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <Text style={[styles.ratingChipLabel, { color: colors.textSecondary }]}>STD</Text>
                <Text style={[styles.ratingChipVal, { color: colors.textPrimary }]}>{activeProfile.standardRating}</Text>
              </View>
              <View style={[styles.ratingChip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <Text style={[styles.ratingChipLabel, { color: colors.textSecondary }]}>RAPID</Text>
                <Text style={[styles.ratingChipVal, { color: colors.textPrimary }]}>{activeProfile.rapidRating}</Text>
              </View>
              <View style={[styles.ratingChip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <Text style={[styles.ratingChipLabel, { color: colors.textSecondary }]}>BLITZ</Text>
                <Text style={[styles.ratingChipVal, { color: colors.textPrimary }]}>{activeProfile.blitzRating}</Text>
              </View>
            </View>
          </TacticalCard>
        ) : null}

        {/* Switch Profiles List */}
        {profiles && profiles.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PROFILES ({profiles.length})</Text>
            <View style={[styles.profileList, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              {profiles.map((p) => {
                const isActive = activeProfile?.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.profileRow,
                      { borderBottomColor: colors.border },
                      isActive && { backgroundColor: colors.surfaceSelected },
                    ]}
                    onPress={() => handleSwitchProfile(p)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`Switch to ${p.name}`}
                  >
                    <ChessInsignia
                      piece="knight"
                      size={14}
                      badgeSize={26}
                      color={isActive ? colors.primary : colors.textSecondary}
                      badgeBg={colors.surfaceMuted}
                    />
                    <Text
                      style={[
                        styles.profileRowName,
                        { color: isActive ? colors.primary : colors.textPrimary, fontWeight: isActive ? '800' : '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    {isActive ? (
                      <View style={[styles.activeDot, { backgroundColor: colors.winBg, borderColor: colors.win }]}>
                        <Text style={[styles.activeDotText, { color: colors.win }]}>ACTIVE</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Secondary Action: Create Profile */}
        <TacticalButton
          title="Create New Profile"
          onPress={() => setShowCreateProfile(true)}
          variant="primary"
          icon={<Ionicons name="person-add" size={16} color={colors.primaryText} />}
        />

        {/* Quieter Secondary Actions */}
        <View style={styles.quieterActions}>
          {!isLocal ? (
            <TacticalButton
              title="Change Password"
              onPress={() => setShowChangePassword(true)}
              variant="secondary"
              size="sm"
              icon={<Ionicons name="key-outline" size={15} color={colors.textSecondary} />}
            />
          ) : null}

          <TacticalButton
            title={isLocal ? 'Switch to Cloud Sync' : 'Sign Out'}
            onPress={handleSignOut}
            variant="danger"
            size="sm"
            icon={<Ionicons name={isLocal ? 'cloud-upload-outline' : 'log-out-outline'} size={15} color={colors.loss} />}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerBrand, { color: colors.textSecondary }]}>
            ♞ FIDE CALCULATOR // DGT SPEC
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.textMuted }]}>
            Tournament Rating Engine & Performance Tracking
          </Text>
        </View>
      </ScrollView>

      {/* Sub Modals */}
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
      <EditProfileModal
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSuccess={() => {}}
        profile={activeProfile}
        isLocal={isLocal}
        onSave={async (updates) => {
          if (isLocal) {
            localUpdateProfile(updates);
          } else {
            const { error: err } = await cloudUpdateProfile(updates);
            if (err) throw err;
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileHeaderText: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modeBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeCard: {
    padding: 14,
  },
  activeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    gap: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeName: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  ratingChip: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  ratingChipLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  ratingChipVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  profileList: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  profileRowName: {
    flex: 1,
    fontSize: 13,
  },
  activeDot: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  activeDotText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quieterActions: {
    gap: 8,
    marginTop: 4,
  },
  footer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  footerSubtext: {
    fontSize: 10,
    fontWeight: '600',
  },
});
