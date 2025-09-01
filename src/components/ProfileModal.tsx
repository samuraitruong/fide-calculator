'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FaTimes, FaSave, FaUser } from 'react-icons/fa';
import FideSearchInput, { type FidePlayer } from './FideSearchInput';


interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isLocalMode?: boolean;
  localProfile?: { id: string; name: string; fideId?: string; title?: string; federation?: string; birthYear?: number; standardRating: number; rapidRating: number; blitzRating: number; isLocal: boolean } | null;
}

export default function ProfileModal({ open, onClose, onSuccess, isLocalMode = false, localProfile }: ProfileModalProps) {
  const { user, activeProfile, createProfile, updateProfile, refreshSession, loading: authLoading } = useAuth();
  const { createProfile: createLocalProfile, updateProfile: updateLocalProfile } = useLocalStorage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug logging
  useEffect(() => {
    if (open) {
      console.log('ProfileModal: Modal opened');
      console.log('ProfileModal: User state:', !!user, 'User ID:', user?.id);
      console.log('ProfileModal: Profile state:', !!activeProfile, 'Profile ID:', activeProfile?.id);
      console.log('ProfileModal: Auth loading:', authLoading);
    }
  }, [open, user, activeProfile, authLoading]);
  
  // Form state
  const [name, setName] = useState('');
  const [fideId, setFideId] = useState('');
  const [title, setTitle] = useState('');
  const [federation, setFederation] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [standardRating, setStandardRating] = useState(1888);
  const [rapidRating, setRapidRating] = useState(1888);
  const [blitzRating, setBlitzRating] = useState(1888);

  // Handle FIDE player selection
  const handleFidePlayerSelect = (player: FidePlayer) => {
    setName(player.name);
    setFideId(player.fideId);
    setTitle(player.title);
    setFederation(player.federation);
    setBirthYear(player.birthYear);
    
    // Set ratings if available
    if (player.standard && player.standard !== '-') {
      setStandardRating(parseInt(player.standard) || 1888);
    }
    if (player.rapid && player.rapid !== '-') {
      setRapidRating(parseInt(player.rapid) || 1888);
    }
    if (player.blitz && player.blitz !== '-') {
      setBlitzRating(parseInt(player.blitz) || 1888);
    }
  };

  // Initialize form with existing profile data
  useEffect(() => {
    const profile = isLocalMode ? localProfile : activeProfile;
    if (profile) {
      setName(profile.name);
      setFideId(profile.fideId || '');
      setTitle(profile.title || '');
      setFederation(profile.federation || '');
      setBirthYear(profile.birthYear?.toString() || '');
      setStandardRating(profile.standardRating);
      setRapidRating(profile.rapidRating);
      setBlitzRating(profile.blitzRating);
    }
  }, [activeProfile, localProfile, isLocalMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('ProfileModal: Submitting profile data:', { name, fideId, title, federation, birthYear, standardRating, rapidRating, blitzRating });
      console.log('ProfileModal: Local mode:', isLocalMode);
      
      // Skip user check for local mode
      if (!isLocalMode && !user) {
        setError('You are not logged in. Please sign in again.');
        return;
      }

      const profileData = {
        name,
        fideId: fideId || undefined,
        title: title || undefined,
        federation: federation || undefined,
        birthYear: birthYear ? parseInt(birthYear) : undefined,
        standardRating,
        rapidRating,
        blitzRating,
      };

      if (isLocalMode) {
        // Handle local profile creation/update
        const currentProfile = localProfile;
        if (currentProfile) {
          updateLocalProfile(profileData);
        } else {
          createLocalProfile(profileData);
        }
        console.log('ProfileModal: Local profile saved successfully');
      } else {
        // Handle cloud profile creation/update
        const { error: profileError } = activeProfile
          ? await updateProfile(profileData)
          : await createProfile(profileData);

        if (profileError) {
          console.error('ProfileModal: Profile error:', profileError);
          setError(profileError.message);
          return;
        }
        console.log('ProfileModal: Cloud profile saved successfully');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('ProfileModal: Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaUser className="w-6 h-6" />
            {isLocalMode ? 'Local Profile' : 'Cloud Profile'} - {isLocalMode ? (localProfile ? 'Edit' : 'Create') : (activeProfile ? 'Edit' : 'Create')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLocalMode ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm">
                ✅ Local Storage Mode - Data stays on this device
              </p>
              {!localProfile && (
                <p className="text-green-600 text-xs mt-1">
                  Creating new local profile...
                </p>
              )}
            </div>
          ) : (
            <>
              {user && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm">
                    ✅ Logged in as: {user.email}
                  </p>
                  {!activeProfile && (
                    <p className="text-green-600 text-xs mt-1">
                      Creating new profile...
                    </p>
                  )}
                </div>
              )}
              
              {authLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-700 text-sm">
                    🔄 Loading authentication state...
                  </p>
                </div>
              )}
              
              {!authLoading && !user && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm mb-3">
                    ⚠️ You are not logged in. Please sign in again to create a profile.
                  </p>
                  <div className="text-xs text-red-600 mb-2">
                    Debug: User ID: {user ? (user as { id?: string; email?: string })?.id || 'null' : 'null'}, Email: {user ? (user as { id?: string; email?: string })?.email || 'null' : 'null'}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const { error } = await refreshSession();
                      if (error) {
                        setError('Failed to refresh session. Please sign in again.');
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Refresh Session
                  </button>
                </div>
              )}
            </>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Player Name *
              </label>
              <FideSearchInput
                value={name}
                onChange={setName}
                onSelect={handleFidePlayerSelect}
                placeholder="Search FIDE players or enter your name"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="fideId" className="block text-sm font-medium text-gray-700 mb-1">
                FIDE ID
              </label>
                              <input
                  id="fideId"
                  type="text"
                  value={fideId}
                  onChange={(e) => setFideId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="e.g., 12345678"
                />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
                              <select
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                <option value="">No title</option>
                <option value="GM">Grandmaster (GM)</option>
                <option value="IM">International Master (IM)</option>
                <option value="FM">FIDE Master (FM)</option>
                <option value="CM">Candidate Master (CM)</option>
                <option value="WGM">Woman Grandmaster (WGM)</option>
                <option value="WIM">Woman International Master (WIM)</option>
                <option value="WFM">Woman FIDE Master (WFM)</option>
                <option value="WCM">Woman Candidate Master (WCM)</option>
              </select>
            </div>

            <div>
              <label htmlFor="federation" className="block text-sm font-medium text-gray-700 mb-1">
                Federation
              </label>
                              <input
                  id="federation"
                  type="text"
                  value={federation}
                  onChange={(e) => setFederation(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="e.g., USA, GER, FRA"
                  maxLength={3}
                />
            </div>

            <div>
              <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 mb-1">
                Birth Year
              </label>
                              <input
                  id="birthYear"
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="e.g., 1990"
                  min="1900"
                  max={new Date().getFullYear()}
                />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Ratings</h3>
            <p className="text-sm text-gray-600 mb-4">
              💡 <strong>Tip:</strong> Start typing your name in the Player Name field to search FIDE database and auto-fill your information!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="standardRating" className="block text-sm font-medium text-gray-700 mb-1">
                  Standard Rating
                </label>
                <input
                  id="standardRating"
                  type="number"
                  value={standardRating}
                  onChange={(e) => setStandardRating(parseInt(e.target.value) || 1888)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  min="1400"
                  max="3500"
                  required
                />
              </div>

              <div>
                <label htmlFor="rapidRating" className="block text-sm font-medium text-gray-700 mb-1">
                  Rapid Rating
                </label>
                <input
                  id="rapidRating"
                  type="number"
                  value={rapidRating}
                  onChange={(e) => setRapidRating(parseInt(e.target.value) || 1888)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  min="1400"
                  max="3500"
                  required
                />
              </div>

              <div>
                <label htmlFor="blitzRating" className="block text-sm font-medium text-gray-700 mb-1">
                  Blitz Rating
                </label>
                <input
                  id="blitzRating"
                  type="number"
                  value={blitzRating}
                  onChange={(e) => setBlitzRating(parseInt(e.target.value) || 1888)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  min="1400"
                  max="3500"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || authLoading || !user}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <FaSave className="w-4 h-4" />
              {loading ? 'Saving...' : (activeProfile ? 'Update Profile' : 'Create Profile')}
            </button>
            {!authLoading && !user && (
              <p className="text-red-600 text-xs mt-1">
                You must be logged in to create a profile
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
