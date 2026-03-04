import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useFideData, FidePlayer } from '../hooks/useFideData';

interface FideSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (player: FidePlayer) => void;
  placeholder?: string;
}

export default function FideSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = "Search FIDE players...",
}: FideSearchInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedSearch = useDebouncedValue(searchTerm, 500);
  const { fideData, loading, search } = useFideData('');

  // Trigger search when debounced search term changes
  useEffect(() => {
    if (debouncedSearch && showDropdown) {
      search(debouncedSearch);
    }
  }, [debouncedSearch, showDropdown, search]);

  // Sync value prop with internal state
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleInputChange = (text: string) => {
    setSearchTerm(text);
    onChange(text);
    setShowDropdown(true);
  };

  const handleSelectPlayer = (player: FidePlayer) => {
    setSearchTerm(player.name);
    onChange(player.name);
    onSelect(player);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    setShowDropdown(false);
  };

  const getPrimaryRating = (player: FidePlayer) => {
    const rating = player.standard || player.rapid || player.blitz || '';
    if (!rating || rating === '-') return '—';
    return rating;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, (isFocused || showDropdown) && styles.inputContainerFocused]}>
        <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={searchTerm}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          onFocus={() => {
            setIsFocused(true);
            setShowDropdown(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      {showDropdown && (searchTerm || fideData.length > 0) && (
        <View style={styles.dropdown}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : fideData.length > 0 ? (
            <View style={styles.list}>
              {fideData.slice(0, 15).map((item) => (
                <TouchableOpacity
                  key={item.fideId + item.name}
                  style={styles.playerItem}
                  onPress={() => handleSelectPlayer(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.playerAvatar}>
                    <Ionicons name="person" size={16} color="#6b7280" />
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.playerId} numberOfLines={1}>
                      FIDE ID: {item.fideId || '—'}
                    </Text>
                  </View>
                  <View style={styles.playerRatingRight}>
                    <Text style={styles.ratingNumber}>{getPrimaryRating(item)}</Text>
                    <Text style={styles.ratingLabel}>RATING</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : searchTerm ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No players found</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  inputContainerFocused: {
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    padding: 8,
    marginRight: -4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1000,
    overflow: 'hidden',
  },
  list: {
    maxHeight: 240,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  playerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  playerId: {
    marginTop: 2,
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  playerRatingRight: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
  },
  ratingLabel: {
    marginTop: 2,
    fontSize: 10,
    letterSpacing: 0.6,
    color: '#9ca3af',
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
});

