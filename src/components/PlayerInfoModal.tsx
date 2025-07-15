import React, { useState, useRef, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import type { FidePlayer } from '@/hooks/usePlayerInfo';
import { useFideData } from '@/hooks/useFideData';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface PlayerInfoModalProps {
  open: boolean;
  onClose: () => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  playerInfo: FidePlayer | null;
  loading: boolean;
  error: string;
  onSave: () => void;
}

export default function PlayerInfoModal({ open, onClose, playerName, setPlayerName, playerInfo, loading, error, onSave }: PlayerInfoModalProps) {
  const [search, setSearch] = useState(playerName);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 500);
  const { fideData, loading: fideLoading, search: fideSearch } = useFideData('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Trigger FIDE search on debounced input
  useEffect(() => {
    if (debouncedSearch && showDropdown) {
      fideSearch(debouncedSearch);
    }
  }, [debouncedSearch, showDropdown, fideSearch]);

  // When modal opens, reset search to playerName
  useEffect(() => {
    if (open) setSearch(playerName);
  }, [open, playerName]);

  const handleSelect = (name: string) => {
    setPlayerName(name);
    setSearch(name);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button
          type="button"
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
          onClick={onClose}
          aria-label="Close info"
        >
          ×
        </button>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
          <FaUser className="inline w-6 h-6 text-blue-500" /> Player Info
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              autoComplete="off"
              disabled={loading}
            />
            {showDropdown && search && (
              <div className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                {fideLoading ? (
                  <div className="p-3 text-gray-500 text-center">Loading...</div>
                ) : (
                  fideData.length > 0 ? (
                    fideData.map((player) => (
                      <button
                        key={player.fideId + player.name}
                        className="w-full text-left px-4 py-2 hover:bg-blue-100 focus:bg-blue-200 focus:outline-none flex justify-between items-center text-black"
                        onClick={() => handleSelect(player.name)}
                        type="button"
                      >
                        <span className="text-black">{player.name} ({player.federation})</span>
                        <span className="text-gray-500 ml-2">{player.standard || '—'}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-center">No players found</div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
        {loading ? (
          <div className="text-gray-700 text-center mb-2">Loading...</div>
        ) : playerInfo ? (
          <div className="mb-4">
            <div className="flex w-full justify-between gap-4 text-center">
              <div className="flex-1 bg-blue-50 rounded-lg p-3 mx-1 flex flex-col items-center shadow-sm">
                <div className="text-base font-bold text-gray-700 mb-1">Standard</div>
                <div className="font-bold text-2xl text-blue-800">{playerInfo.standard || '—'}</div>
              </div>
              <div className="flex-1 bg-yellow-50 rounded-lg p-3 mx-1 flex flex-col items-center shadow-sm">
                <div className="text-base font-bold text-gray-700 mb-1">Rapid</div>
                <div className="font-bold text-2xl text-yellow-800">{playerInfo.rapid || '—'}</div>
              </div>
              <div className="flex-1 bg-pink-50 rounded-lg p-3 mx-1 flex flex-col items-center shadow-sm">
                <div className="text-base font-bold text-gray-700 mb-1">Blitz</div>
                <div className="font-bold text-2xl text-pink-800">{playerInfo.blitz || '—'}</div>
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-4 text-gray-900">
              <div><span className="font-medium">Federation:</span> <span className="font-bold">{playerInfo.federation || '—'}</span></div>
              <div>
                <span className="font-medium">FIDE ID:</span> {playerInfo.fideId ? (
                  <a
                    href={`https://ratings.fide.com/profile/${playerInfo.fideId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono underline text-blue-700 hover:text-blue-900"
                  >
                    {playerInfo.fideId}
                  </a>
                ) : (
                  <span className="font-mono">—</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-red-600 text-center mb-2">{error || 'No player info found.'}</div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={onClose}
            disabled={loading}
          >Cancel</button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={onSave}
            disabled={loading || !playerInfo}
          >Save</button>
        </div>
      </div>
    </div>
  );
} 