import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStorageMode } from '@/contexts/StorageModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { LocalProfile } from '@/hooks/useLocalStorage';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import CreateProfileModal from '@/components/CreateProfileModal';
import EditProfileModal from '@/components/EditProfileModal';

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
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            {isLocal ? 'Storage' : 'Email'}
          </Text>
          <Text style={styles.cardValue} numberOfLines={1}>
            {isLocal ? 'Local (this device only)' : user?.email ?? '—'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Profiles</Text>
        {activeProfile && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Active</Text>
            <Text style={styles.activeName}>{activeProfile.name}</Text>
            <Text style={styles.ratings}>
              Std {activeProfile.standardRating} · Rapid {activeProfile.rapidRating} · Blitz {activeProfile.blitzRating}
            </Text>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => setShowEditProfile(true)}
            >
              <Text style={styles.editProfileButtonText}>Edit profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {profiles && profiles.length > 0 && (
          <View style={styles.profileList}>
            {profiles.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.profileRow,
                  activeProfile?.id === profile.id && styles.profileRowActive,
                ]}
                onPress={() => handleSwitchProfile(profile)}
              >
                <Text style={styles.profileName}>{profile.name}</Text>
                {activeProfile?.id === profile.id ? (
                  <Text style={styles.activeBadge}>Active</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowCreateProfile(true)}
        >
          <Text style={styles.primaryButtonText}>+ Create New Profile</Text>
        </TouchableOpacity>

        {!isLocal && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowChangePassword(true)}
          >
            <Text style={styles.secondaryButtonText}>Change Password</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>
            {isLocal ? 'Switch to Cloud Sign In' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>FIDE Rating Calculator</Text>
          <Text style={styles.footerSubtext}>Track ratings · Standard, Rapid, Blitz</Text>
        </View>
      </ScrollView>

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
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    color: '#1f2937',
  },
  activeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  ratings: {
    fontSize: 14,
    color: '#6b7280',
  },
  editProfileButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  profileList: {
    marginBottom: 16,
    gap: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  profileRowActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  signOutButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b91c1c',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});
