import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export interface TacticalCardProps {
  children?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'accent' | 'positive' | 'negative' | 'muted';
  hasOffsetShadow?: boolean;
  cornerAccents?: boolean;
  tag?: string;
  title?: string;
  badge?: string;
  headerRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export const TacticalCard: React.FC<TacticalCardProps> = ({
  children,
  variant = 'default',
  hasOffsetShadow = false,
  cornerAccents = false,
  tag,
  title,
  badge,
  headerRight,
  style,
  contentStyle,
  onPress,
  accessibilityLabel,
}) => {
  const { colors, radii, borderWidth, shadows } = useTheme();

  const activeTag = tag || title;
  const activeHeaderRight = headerRight || (badge ? (
    <View
      style={[
        styles.badgeTag,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
        {badge}
      </Text>
    </View>
  ) : null);

  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return colors.surfaceElevated;
      case 'muted':
        return colors.surfaceMuted;
      case 'accent':
        return colors.surfaceSelected;
      case 'positive':
        return colors.winBg;
      case 'negative':
        return colors.lossBg;
      case 'default':
      default:
        return colors.surface;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'accent':
        return colors.borderAccent;
      case 'positive':
        return colors.win;
      case 'negative':
        return colors.loss;
      default:
        return colors.border;
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderColor: getBorderColor(),
    borderWidth: borderWidth.default,
    borderRadius: radii.card,
    overflow: 'hidden',
    ...(hasOffsetShadow ? shadows.tactileOffset : shadows.card),
  };

  const content = (
    <>
      {(activeTag || activeHeaderRight) && (
        <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
          {activeTag ? (
            <View style={[styles.tagBadge, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>{activeTag}</Text>
            </View>
          ) : (
            <View />
          )}
          {activeHeaderRight}
        </View>
      )}

      {cornerAccents && (
        <>
          <View style={[styles.cornerTopLeft, { borderColor: colors.border }]} />
          <View style={[styles.cornerBottomRight, { borderColor: colors.border }]} />
        </>
      )}

      <View style={[styles.body, contentStyle]}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[cardStyle, style]}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]} accessibilityLabel={accessibilityLabel}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    zIndex: 1,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 8,
    height: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    zIndex: 1,
  },
  body: {
    padding: 16,
  },
});

export default TacticalCard;
