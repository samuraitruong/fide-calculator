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
import { colors, radii, spacing, typography, touchTargets, shadows } from '../theme/tokens';

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
      <View
        style={[
          styles.inputContainer,
          (isFocused || showDropdown) && styles.inputContainerFocused,
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={isFocused ? colors.primary : colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
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
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showDropdown && (searchTerm || fideData.length > 0) && (
        <View style={styles.dropdown}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Searching FIDE database...</Text>
            </View>
          ) : fideData.length > 0 ? (
            <View style={styles.list}>
              {fideData.slice(0, 15).map((item) => (
                <TouchableOpacity
                  key={item.fideId + item.name}
                  style={styles.playerItem}
                  onPress={() => handleSelectPlayer(item)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Select player ${item.name}`}
                >
                  <View style={styles.playerAvatar}>
                    <Ionicons name="person" size={16} color={colors.primary} />
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
              <Text style={styles.emptyText}>No players found matching "{searchTerm}"</Text>
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
    minHeight: touchTargets.min,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  inputContainerFocused: {
    borderColor: colors.borderFocus,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: touchTargets.min,
    paddingVertical: spacing.md - 2,
    ...typography.body,
    color: colors.textPrimary,
  },
  clearButton: {
    padding: spacing.xs,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    marginTop: spacing.xs + 2,
    ...shadows.sheet,
    zIndex: 1000,
    overflow: 'hidden',
  },
  list: {
    maxHeight: 250,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargets.min,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  playerId: {
    marginTop: 2,
    ...typography.caption,
    color: colors.textSecondary,
  },
  playerRatingRight: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  ratingLabel: {
    marginTop: 2,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
