'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';

import ProfileModal from './ProfileModal';
import { FaHdd, FaCloud, FaUser, FaSignOutAlt, FaBars, FaTimes, FaEdit, FaKey, FaEnvelope, FaChevronDown, FaPlus } from 'react-icons/fa';

export default function Navbar() {

  const pathname = usePathname();
  const { user, profiles, activeProfile, signOut, setActiveProfile } = useAuth();
  const { profiles: localProfiles, activeProfile: localActiveProfile, signOut: localSignOut, setActiveProfile: setLocalActiveProfile } = useLocalStorage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Determine storage mode and current profile
  const isLocalMode = localStorage.getItem('fide-calculator-mode') === 'local';
  const currentProfile = isLocalMode ? localActiveProfile : activeProfile;
  const currentProfiles = isLocalMode ? localProfiles : profiles;
  const currentSetActiveProfile = isLocalMode ? setLocalActiveProfile : setActiveProfile;
  const currentSignOut = isLocalMode ? localSignOut : signOut;

  const navigation = [
    { name: 'Standard', href: '/standard', type: 'standard' },
    { name: 'Rapid', href: '/rapid', type: 'rapid' },
    { name: 'Blitz', href: '/blitz', type: 'blitz' },
  ];

  const handleSignOut = () => {
    currentSignOut();
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const handleEditProfile = () => {
    setShowProfileModal(true);
    setUserMenuOpen(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const isActiveRoute = (href: string) => {
    return pathname === href;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">♔</span>
              </div>
              <span className="hidden md:block text-xl font-bold text-gray-900">FIDE Calculator</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Navigation Links */}
            <div className="flex h-full">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 text-sm font-medium transition-colors border-b-2 ${
                    isActiveRoute(item.href)
                      ? 'text-blue-700 border-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Current Profile Display */}
            <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
              {isLocalMode ? (
                <FaHdd className="w-4 h-4 text-green-600" />
              ) : (
                <FaCloud className="w-4 h-4 text-blue-600" />
              )}
              <span className="font-medium text-gray-900">
                {isLocalMode ? localActiveProfile?.name : activeProfile?.name || user?.email}
              </span>
            </div>

            {/* User Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {isLocalMode 
                    ? (localActiveProfile?.name?.charAt(0) || 'U').toUpperCase()
                    : (user?.email?.charAt(0) || 'U').toUpperCase()
                  }
                </div>
                <FaChevronDown className="w-3 h-3" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <FaEnvelope className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {isLocalMode ? localActiveProfile?.name : user?.email}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {isLocalMode ? 'Local Storage' : 'Cloud Storage'}
                      </div>
                    </div>

                    {/* Account Settings */}
                    {!isLocalMode && (
                      <div className="py-1">
                        <button
                          onClick={() => {
                            // TODO: Implement change password
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FaKey className="w-4 h-4" />
                          <span>Change Password</span>
                        </button>
                      </div>
                    )}

                    {/* Profiles Section */}
                    {currentProfiles && currentProfiles.length > 0 && (
                      <div className="py-1 border-t border-gray-100">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Profiles
                        </div>
                        
                        {currentProfiles.map((profile) => (
                          <div
                            key={profile.id}
                            className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                              currentProfile?.id === profile.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <button
                              onClick={() => {
                                currentSetActiveProfile(profile);
                                setUserMenuOpen(false);
                              }}
                              className="flex items-center space-x-3 flex-1"
                            >
                              <FaUser className="w-4 h-4" />
                              <span className="text-left">{profile.name}</span>
                              {currentProfile?.id === profile.id && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProfile();
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title={`Edit ${profile.name}`}
                            >
                              <FaEdit className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => {
                            setShowProfileModal(true);
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <FaPlus className="w-4 h-4" />
                          <span>Create New Profile</span>
                        </button>
                      </div>
                    )}

                    {/* Sign Out */}
                    <div className="py-1 border-t border-gray-100">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FaSignOutAlt className="w-4 h-4" />
                        <span>{isLocalMode ? "Switch to Cloud" : "Sign Out"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation - Main Menu Items */}
          <div className="md:hidden flex h-full">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 text-sm font-medium transition-colors border-b-2 ${
                  isActiveRoute(item.href)
                    ? 'text-blue-700 border-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent hover:border-gray-300'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              {mobileMenuOpen ? (
                <FaTimes className="w-5 h-5" />
              ) : (
                <FaBars className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Profile Name Display */}
      <div className="md:hidden border-b border-gray-200 bg-gray-50">
        <div className="px-4 py-2">
          <div className="flex items-center space-x-2">
            {isLocalMode ? (
              <FaHdd className="w-4 h-4 text-green-600" />
            ) : (
              <FaCloud className="w-4 h-4 text-blue-600" />
            )}
            <span className="text-sm font-medium text-gray-900">
              {isLocalMode ? localActiveProfile?.name : activeProfile?.name || user?.email}
            </span>
            <span className="text-xs text-gray-500">
              ({isLocalMode ? 'Local Storage' : 'Cloud Storage'})
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            {/* Mobile Navigation Links - Removed since they're now in the top bar */}

            {/* Mobile User Info */}
            <div className="border-t border-gray-200 pt-3">
              {/* User Info */}
              <div className="flex items-center space-x-2 mb-3">
                <FaEnvelope className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {isLocalMode ? localActiveProfile?.name : user?.email}
                </span>
                <span className="text-xs text-gray-400">
                  ({isLocalMode ? 'Local' : 'Cloud'})
                </span>
              </div>

              {/* Account Settings */}
              {!isLocalMode && (
                <div className="space-y-1 mb-3">
                  <button
                    onClick={() => {
                      // TODO: Implement change password
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <FaKey className="w-4 h-4" />
                    <span>Change Password</span>
                  </button>
                </div>
              )}

              {/* Profiles Section */}
              {currentProfiles && currentProfiles.length > 0 && (
                <div className="space-y-1 mb-3">
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Profiles
                  </div>
                  
                  {currentProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                        currentProfile?.id === profile.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <button
                        onClick={() => {
                          currentSetActiveProfile(profile);
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 flex-1"
                      >
                        <FaUser className="w-4 h-4" />
                        <span className="text-left">{profile.name}</span>
                        {currentProfile?.id === profile.id && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProfile();
                          setMobileMenuOpen(false);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={`Edit ${profile.name}`}
                      >
                        <FaEdit className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <FaPlus className="w-4 h-4" />
                    <span>Create New Profile</span>
                  </button>
                </div>
              )}

              {/* Sign Out */}
              <div className="border-t border-gray-200 pt-3">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  <span>{isLocalMode ? "Switch to Cloud" : "Sign Out"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSuccess={() => {
          // Profile updated successfully
        }}
        isLocalMode={isLocalMode}
        localProfile={localActiveProfile}
      />
    </nav>
  );
}
