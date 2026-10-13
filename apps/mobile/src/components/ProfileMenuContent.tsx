import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStorageMode } from '@/contexts/StorageModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { LocalProfile } from '@/hooks/useLocalStorage';
import ChangePasswordModal from './ChangePasswordModal';
import CreateProfileModal from './CreateProfileModal';
import EditProfileModal from './EditProfileModal';
import { colors, radii, spacing, typography, touchTargets, shadows } from '../theme/tokens';

export default function ProfileMenuContent() {
  const storageMode = useStorageMode();
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
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileHeaderText}>
            <Text style={styles.profileTitle} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>
                {isLocal ? '📱 Local Storage Mode' : email || '☁ Cloud Account'}
              </Text>
            </View>
          </View>
        </View>

        {/* Active Profile Summary Card */}
        {activeProfile ? (
          <View style={styles.activeCard}>
            <View style={styles.activeCardHeader}>
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={styles.activeBadgeText}>ACTIVE PROFILE</Text>
              </View>

              <TouchableOpacity
                style={styles.editIconButton}
                onPress={() => setShowEditProfile(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Edit active profile details"
              >
                <Ionicons name="pencil-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.activeName}>{activeProfile.name}</Text>
            <View style={styles.ratingsRow}>
              <View style={styles.ratingChip}>
                <Text style={styles.ratingChipLabel}>STD</Text>
                <Text style={styles.ratingChipVal}>{activeProfile.standardRating}</Text>
              </View>
              <View style={styles.ratingChip}>
                <Text style={styles.ratingChipLabel}>RAPID</Text>
                <Text style={styles.ratingChipVal}>{activeProfile.rapidRating}</Text>
              </View>
              <View style={styles.ratingChip}>
                <Text style={styles.ratingChipLabel}>BLITZ</Text>
                <Text style={styles.ratingChipVal}>{activeProfile.blitzRating}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Switch Profiles List */}
        {profiles && profiles.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SWITCH PROFILES</Text>
            <View style={styles.profileList}>
              {profiles.map((p) => {
                const isActive = activeProfile?.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.profileRow,
                      isActive && styles.profileRowActive,
                    ]}
                    onPress={() => handleSwitchProfile(p)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`Switch to ${p.name}`}
                  >
                    <Ionicons
                      name={isActive ? 'person-circle' : 'person-circle-outline'}
                      size={22}
                      color={isActive ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.profileName,
                        isActive && styles.profileNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    {isActive ? (
                      <View style={styles.activeDot}>
                        <Text style={styles.activeDotText}>Active</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Secondary Action: Create Profile */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateProfile(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create a new profile"
        >
          <Ionicons name="person-add-outline" size={18} color={colors.primary} />
          <Text style={styles.createButtonText}>Create New Profile</Text>
        </TouchableOpacity>

        {/* Quieter Secondary Actions */}
        <View style={styles.quieterActions}>
          {!isLocal ? (
            <TouchableOpacity
              style={styles.quietButton}
              onPress={() => setShowChangePassword(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Change password"
            >
              <Ionicons name="key-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.quietButtonText}>Change Password</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.quietButton, styles.signOutButton]}
            onPress={handleSignOut}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isLocal ? 'Switch to cloud mode' : 'Sign out'}
          >
            <Ionicons
              name={isLocal ? 'cloud-upload-outline' : 'log-out-outline'}
              size={16}
              color={colors.negativeText}
            />
            <Text style={styles.signOutButtonText}>
              {isLocal ? 'Switch to Cloud Sign In' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>♟ Friendly Chess Club</Text>
          <Text style={styles.footerSubtext}>
            FIDE Rating Tracker & Game Calculator
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
    backgroundColor: colors.canvas,
  },
  content: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.xl,
    gap: spacing.lg,
  },

  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surfaceSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryText,
  },
  profileHeaderText: {
    flex: 1,
  },
  profileTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  modeBadge: {
    marginTop: spacing.xs,
  },
  modeBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Active Profile Card
  activeCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.lg,
    ...shadows.card,
  },
  activeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSelected,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    gap: 4,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  editIconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeName: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  ratingChip: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  ratingChipVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },

  // Section
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  profileList: {
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  profileRowActive: {
    backgroundColor: colors.surfaceSelected,
  },
  profileName: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  profileNameActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  activeDot: {
    backgroundColor: colors.positiveBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  activeDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.positiveText,
  },

  // Buttons
  createButton: {
    minHeight: touchTargets.primaryControl,
    backgroundColor: colors.surfaceSelected,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  createButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
  },

  // Quieter Actions
  quieterActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  quietButton: {
    minHeight: 44,
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  quietButtonText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  signOutButton: {
    borderColor: colors.negativeBg,
    backgroundColor: colors.negativeBg,
  },
  signOutButtonText: {
    ...typography.label,
    color: colors.negativeText,
    fontWeight: '700',
  },

  // Footer
  footer: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerBrand: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  footerSubtext: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
