'use client';

import { useState } from 'react';
import { FaUser, FaPlus, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import ProfileModal from './ProfileModal';

export default function ProfileSelector() {
  const { profiles, activeProfile, setActiveProfile } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
        >
          <FaPlus className="w-3 h-3" />
          Create Profile
        </button>
        
        <ProfileModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
      >
        <FaUser className="w-4 h-4 text-gray-600" />
        <span className="font-medium text-gray-900">
          {activeProfile?.name || 'Select Profile'}
        </span>
        <FaChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  setActiveProfile(profile.id);
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                  activeProfile?.id === profile.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="font-medium">{profile.name}</div>
                {profile.fideId && (
                  <div className="text-xs text-gray-500">FIDE ID: {profile.fideId}</div>
                )}
              </button>
            ))}
            
            <div className="border-t border-gray-200 mt-1 pt-1">
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-blue-600 flex items-center gap-2"
              >
                <FaPlus className="w-3 h-3" />
                Create New Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfileModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </div>
  );
}
