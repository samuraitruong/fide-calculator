import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export interface TacticalButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}) => {
  const { colors, radii, borderWidth, touchTargets } = useTheme();

  const getButtonColors = () => {
    if (disabled) {
      return {
        bg: colors.surfaceMuted,
        border: colors.border,
        text: colors.textMuted,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          bg: colors.primary,
          border: colors.primaryHover,
          text: colors.primaryText,
        };
      case 'accent':
        return {
          bg: colors.accent,
          border: colors.accentHover,
          text: colors.accentText,
        };
      case 'danger':
        return {
          bg: colors.lossBg,
          border: colors.loss,
          text: colors.loss,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          border: 'transparent',
          text: colors.textSecondary,
        };
      case 'secondary':
      default:
        return {
          bg: colors.surfaceElevated,
          border: colors.border,
          text: colors.textPrimary,
        };
    }
  };

  const palette = getButtonColors();

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { minHeight: 38, paddingHorizontal: 12, fontSize: 13 };
      case 'lg':
        return { minHeight: 52, paddingHorizontal: 20, fontSize: 15 };
      case 'md':
      default:
        return { minHeight: touchTargets.min, paddingHorizontal: 16, fontSize: 14 };
    }
  };

  const dims = getDimensions();
  const hasActivityIndicator = typeof ActivityIndicator === 'function';

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      style={[
        styles.buttonBase,
        {
          minHeight: dims.minHeight,
          paddingHorizontal: dims.paddingHorizontal,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === 'ghost' ? 0 : borderWidth.heavy,
          borderRadius: radii.control,
        },
        style,
      ]}
    >
      {loading ? (
        hasActivityIndicator ? (
          <ActivityIndicator size="small" color={palette.text} />
        ) : (
          <Text style={[styles.buttonText, { fontSize: dims.fontSize, color: palette.text }]}>
            ...
          </Text>
        )
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.buttonText,
              {
                fontSize: dims.fontSize,
                color: palette.text,
              },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default TacticalButton;
