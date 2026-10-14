import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';

export interface ThemeToggleProps {
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = true, style }) => {
  const { themeMode, isDark, toggleTheme, setThemeMode, colors, radii, touchTargets } = useTheme();

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (themeMode) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      case 'system':
      default:
        return 'phone-portrait-outline';
    }
  };

  const getLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
      default:
        return 'System';
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        testID="theme-toggle-compact"
        onPress={toggleTheme}
        style={[
          styles.compactButton,
          {
            width: touchTargets.min,
            height: touchTargets.min,
            borderRadius: radii.control,
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Theme: ${getLabel()}. Tap to switch theme.`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name={getIconName()} size={18} color={isDark ? colors.accent : colors.primary} />
      </TouchableOpacity>
    );
  }

  // Expanded multi-option pill selector for settings/menu
  const modes: ThemeMode[] = ['dark', 'light', 'system'];

  return (
    <View
      style={[
        styles.expandedContainer,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
          borderRadius: radii.control,
        },
        style,
      ]}
      accessibilityRole="radiogroup"
    >
      {modes.map((mode) => {
        const active = themeMode === mode;
        const icon: keyof typeof Ionicons.glyphMap =
          mode === 'dark' ? 'moon' : mode === 'light' ? 'sunny' : 'phone-portrait-outline';
        const title = mode.charAt(0).toUpperCase() + mode.slice(1);

        return (
          <TouchableOpacity
            key={mode}
            testID={`theme-option-${mode}`}
            onPress={() => setThemeMode(mode)}
            style={[
              styles.optionTab,
              {
                borderRadius: radii.control - 2,
                backgroundColor: active ? colors.surfaceElevated : 'transparent',
                borderColor: active ? colors.borderAccent : 'transparent',
                borderWidth: active ? 1 : 0,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Ionicons
              name={icon}
              size={16}
              color={active ? colors.primary : colors.textSecondary}
              style={styles.optionIcon}
            />
            <Text
              style={[
                styles.optionLabel,
                {
                  color: active ? colors.textPrimary : colors.textSecondary,
                  fontWeight: active ? '700' : '500',
                },
              ]}
            >
              {title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  compactButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  expandedContainer: {
    flexDirection: 'row',
    padding: 3,
    borderWidth: 1,
  },
  optionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 38,
  },
  optionIcon: {
    marginRight: 6,
  },
  optionLabel: {
    fontSize: 12,
  },
});

export default ThemeToggle;
