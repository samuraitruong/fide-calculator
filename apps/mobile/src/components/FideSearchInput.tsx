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
import { useTheme } from '../contexts/ThemeContext';
import ChessInsignia from './ui/ChessInsignia';

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
  placeholder = 'Search FIDE players...',
}: FideSearchInputProps) {
  const { colors, radii, borderWidth, shadows } = useTheme();
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
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: isFocused || showDropdown ? colors.borderAccent : colors.borderInput,
            borderWidth: borderWidth.default,
            borderRadius: radii.control,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={isFocused ? colors.primary : colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
            },
          ]}
          value={searchTerm}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onFocus={() => {
            setIsFocused(true);
            setShowDropdown(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          accessibilityLabel="Search FIDE player name"
        />
        {searchTerm ? (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search text"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showDropdown && (searchTerm || fideData.length > 0) && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: borderWidth.default,
              borderRadius: radii.control,
              ...shadows.sheet,
            },
          ]}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Searching FIDE database...
              </Text>
            </View>
          ) : fideData.length > 0 ? (
            <View style={styles.list}>
              {fideData.slice(0, 15).map((item) => (
                <TouchableOpacity
                  key={item.fideId + item.name}
                  style={[styles.playerItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectPlayer(item)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Select player ${item.name}`}
                >
                  <ChessInsignia piece="pawn" size={14} badgeSize={28} color={colors.primary} badgeBg={colors.surfaceMuted} />
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.playerId, { color: colors.textSecondary }]} numberOfLines={1}>
                      FIDE ID: {item.fideId || '—'}
                    </Text>
                  </View>
                  <View style={styles.playerRatingRight}>
                    <Text style={[styles.ratingNumber, { color: colors.primary }]}>{getPrimaryRating(item)}</Text>
                    <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>RATING</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : searchTerm ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No players found matching "{searchTerm}"
              </Text>
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
    zIndex: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    zIndex: 1000,
    overflow: 'hidden',
  },
  list: {
    maxHeight: 250,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  playerId: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
  },
  playerRatingRight: {
    alignItems: 'flex-end',
    minWidth: 55,
  },
  ratingNumber: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  ratingLabel: {
    marginTop: 2,
    fontSize: 9,
    letterSpacing: 0.6,
    fontWeight: '800',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
