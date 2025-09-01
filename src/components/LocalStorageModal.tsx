'use client';

import { useState } from 'react';
import { FaHdd, FaSave, FaTimes } from 'react-icons/fa';
import FideSearchInput from './FideSearchInput';

interface LocalStorageModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (profileData: { name: string; fideId?: string; title?: string; federation?: string; birthYear?: number; standardRating: number; rapidRating: number; blitzRating: number; isLocal: boolean }) => void;
}

export default function LocalStorageModal({ open, onClose, onSuccess }: LocalStorageModalProps) {
  const [name, setName] = useState('');
  const [fideId, setFideId] = useState('');
  const [title, setTitle] = useState('');
  const [federation, setFederation] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFidePlayerSelect = (player: { name: string; fideId: string; federation: string; title?: string; birthYear?: string; standardRating?: number; rapidRating?: number; blitzRating?: number }) => {
    setName(player.name || '');
    setFideId(player.fideId || '');
    setTitle(player.title || '');
    setFederation(player.federation || '');
    if (player.birthYear) {
      setBirthYear(player.birthYear);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Player name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create local profile
      const profile = {
        name: name.trim(),
        fideId: fideId.trim() || undefined,
        title: title.trim() || undefined,
        federation: federation.trim() || undefined,
        birthYear: birthYear ? parseInt(birthYear) : undefined,
        standardRating: 1500, // Default rating
        rapidRating: 1500,    // Default rating
        blitzRating: 1500,    // Default rating
        isLocal: true,
      };

      // Store in localStorage using the hook's createProfile function
      // This will be handled by the parent component
      onSuccess(profile);
    } catch (err) {
      console.error('Error creating local profile:', err);
      setError('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaHdd className="w-6 h-6 text-green-600" />
              Local Storage Mode
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-sm font-medium text-green-800 mb-2">Local Storage Benefits:</h3>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Data stays on this device only</li>
              <li>• No account required</li>
              <li>• Works offline</li>
              <li>• Fast and private</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player Name *
              </label>
              <FideSearchInput
                value={name}
                onChange={setName}
                onSelect={handleFidePlayerSelect}
                placeholder="Search for a FIDE player or enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                Search for a FIDE player to auto-fill details, or type your name manually
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FIDE ID (optional)
                </label>
                <input
                  type="text"
                  value={fideId}
                  onChange={(e) => setFideId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-base"
                  placeholder="e.g., 12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-base"
                  placeholder="e.g., FM, IM, GM"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Federation (optional)
                </label>
                <input
                  type="text"
                  value={federation}
                  onChange={(e) => setFederation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-base"
                  placeholder="e.g., USA, ENG"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Year (optional)
                </label>
                <input
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-base"
                  placeholder="e.g., 1990"
                  min="1900"
                  max="2030"
                />
              </div>
            </div>





            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    Create Local Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
