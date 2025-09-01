'use client';

import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFideData } from '@/hooks/useFideData';

export interface FidePlayer {
  fideId: string;
  name: string;
  title: string;
  trainerTitle: string;
  federation: string;
  standard: string;
  rapid: string;
  blitz: string;
  birthYear: string;
}

interface FideSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (player: FidePlayer) => void;
  placeholder?: string;
  className?: string;
}

export default function FideSearchInput({
  onChange,
  onSelect,
  placeholder = "Search FIDE players...",
  className = ""
}: FideSearchInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 500);
  const { fideData, loading, search } = useFideData('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Trigger search when debounced search term changes
  useEffect(() => {
    if (debouncedSearch && showDropdown) {
      search(debouncedSearch);
    }
  }, [debouncedSearch, showDropdown, search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setShowDropdown(true);
  };

  const handleSelectPlayer = (player: FidePlayer) => {
    setSearchTerm(player.name);
    onChange(player.name);
    onSelect(player);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    setShowDropdown(false);
  };

  const handleFocus = () => {
    if (searchTerm) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          placeholder={placeholder}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          )}
          <FaSearch className="text-gray-400 w-4 h-4" />
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (searchTerm || fideData.length > 0) && (
        <div className="absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
          {loading ? (
            <div className="p-3 text-gray-500 text-center">Searching...</div>
          ) : fideData.length > 0 ? (
            fideData.map((player) => (
              <button
                key={player.fideId + player.name}
                className="w-full text-left px-4 py-3 hover:bg-blue-100 focus:bg-blue-200 focus:outline-none border-b border-gray-100 last:border-b-0"
                onClick={() => handleSelectPlayer(player)}
                type="button"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{player.name}</div>
                    <div className="text-sm text-gray-600">
                      {player.title && `${player.title} • `}
                      {player.federation}
                      {player.birthYear && ` • ${player.birthYear}`}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 ml-4">
                    <div>Std: {player.standard || '—'}</div>
                    <div>Rapid: {player.rapid || '—'}</div>
                    <div>Blitz: {player.blitz || '—'}</div>
                  </div>
                </div>
              </button>
            ))
          ) : searchTerm ? (
            <div className="p-3 text-gray-500 text-center">No players found</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
