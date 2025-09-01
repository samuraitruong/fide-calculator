'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import AuthModal from './AuthModal';
import ProfileModal from './ProfileModal';

import LocalStorageModal from './LocalStorageModal';
import { FaSignInAlt, FaUser, FaSignOutAlt, FaHdd } from 'react-icons/fa';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, profiles, loading, signOut } = useAuth();
  const { activeProfile: localActiveProfile, createProfile } = useLocalStorage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLocalStorageModal, setShowLocalStorageModal] = useState(false);
  const [storageMode, setStorageMode] = useState<'cloud' | 'local' | null>(null);

  // Detect storage mode on mount
  useEffect(() => {
    const mode = localStorage.getItem('fide-calculator-mode');
    if (mode === 'local') {
      setStorageMode('local');
    } else if (user) {
      setStorageMode('cloud');
    }
  }, [user]);

  if (loading && !storageMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Loading...</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Handle local storage mode
  if (storageMode === 'local' && localActiveProfile) {
    return (
      <>
        {children}
        
        <ProfileModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSuccess={() => {
            // Profile updated successfully
          }}
          isLocalMode={true}
          localProfile={localActiveProfile}
        />
      </>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              FIDE Rating Calculator
            </h1>
            <p className="text-gray-600">
              Track your chess rating changes and manage your games
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <FaSignInAlt className="w-4 h-4" />
              Sign In / Create Account
            </button>

            <div className="text-center text-sm text-gray-500">
              or
            </div>

            <button
              onClick={() => setShowLocalStorageModal(true)}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <FaHdd className="w-4 h-4" />
              Store on My Local
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            <p><strong>Cloud Storage:</strong> Sign in to sync across devices</p>
            <p><strong>Local Storage:</strong> Data stays on this device only</p>
          </div>
        </div>

        <AuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            // Auth success - profile modal will be shown if needed
          }}
        />
        
        <LocalStorageModal
          open={showLocalStorageModal}
          onClose={() => setShowLocalStorageModal(false)}
          onSuccess={(profileData) => {
            // Create the local profile
            createProfile(profileData);
            setStorageMode('local');
            setShowLocalStorageModal(false);
          }}
        />
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome!
            </h1>
            <p className="text-gray-600">
              Please create your chess player profile to get started
            </p>
          </div>

          <button
            onClick={() => setShowProfileModal(true)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
          >
            <FaUser className="w-4 h-4" />
            Create Profile
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={signOut}
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mx-auto"
            >
              <FaSignOutAlt className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        </div>

        <ProfileModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSuccess={() => {
            // Profile created successfully
          }}
        />
      </div>
    );
  }

  return (
    <>
      {children}
      


      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSuccess={() => {
          // Profile updated successfully
        }}
      />
    </>
  );
}
