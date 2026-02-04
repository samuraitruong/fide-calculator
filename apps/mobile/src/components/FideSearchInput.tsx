import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
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

  const renderPlayerItem = ({ item }: { item: FidePlayer }) => (
    <TouchableOpacity
      style={styles.playerItem}
      onPress={() => handleSelectPlayer(item)}
    >
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        <Text style={styles.playerDetails}>
          {item.title && `${item.title} • `}
          {item.federation}
          {item.birthYear && ` • ${item.birthYear}`}
        </Text>
      </View>
      <View style={styles.playerRatings}>
        <Text style={styles.ratingText}>Std: {item.standard || '—'}</Text>
        <Text style={styles.ratingText}>Rapid: {item.rapid || '—'}</Text>
        <Text style={styles.ratingText}>Blitz: {item.blitz || '—'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={searchTerm}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onFocus={() => {
            if (searchTerm) {
              setShowDropdown(true);
            }
          }}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
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
            <FlatList
              data={fideData}
              renderItem={renderPlayerItem}
              keyExtractor={(item) => item.fideId + item.name}
              style={styles.list}
            />
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
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  list: {
    maxHeight: 240,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  playerDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  playerRatings: {
    marginLeft: 16,
    alignItems: 'flex-end',
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
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

