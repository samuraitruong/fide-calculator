import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export type GameResultType = 'win' | 'draw' | 'loss';

export interface WinDrawLossSelectorProps {
  value: number | GameResultType | null;
  onChange: (numericValue: number, resultType: GameResultType) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const WinDrawLossSelector: React.FC<WinDrawLossSelectorProps> = ({
  value,
  onChange,
  style,
  disabled = false,
}) => {
  const { colors, radii, borderWidth, touchTargets } = useTheme();

  const isSelected = (target: GameResultType) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value === target;
    if (target === 'win') return value === 1;
    if (target === 'draw') return value === 0.5;
    if (target === 'loss') return value === 0;
    return false;
  };

  const segments: Array<{
    type: GameResultType;
    score: number;
    scoreLabel: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeBg: string;
    activeText: string;
    activeBorder: string;
  }> = [
    {
      type: 'win',
      score: 1,
      scoreLabel: '1.0',
      label: 'WIN',
      icon: 'trophy',
      activeBg: colors.winBg,
      activeText: colors.win,
      activeBorder: colors.win,
    },
    {
      type: 'draw',
      score: 0.5,
      scoreLabel: '½',
      label: 'DRAW',
      icon: 'git-commit-outline',
      activeBg: colors.drawBg,
      activeText: colors.draw,
      activeBorder: colors.draw,
    },
    {
      type: 'loss',
      score: 0,
      scoreLabel: '0.0',
      label: 'LOSS',
      icon: 'close-circle',
      activeBg: colors.lossBg,
      activeText: colors.loss,
      activeBorder: colors.loss,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          borderWidth: borderWidth.default,
          borderRadius: radii.control,
          backgroundColor: colors.surfaceElevated,
        },
        style,
      ]}
      accessibilityRole="radiogroup"
    >
      {segments.map((seg, idx) => {
        const active = isSelected(seg.type);
        const isFirst = idx === 0;
        const isLast = idx === segments.length - 1;

        return (
          <TouchableOpacity
            key={seg.type}
            onPress={() => onChange(seg.score, seg.type)}
            disabled={disabled}
            activeOpacity={0.8}
            style={[
              styles.segment,
              {
                minHeight: touchTargets.min,
                backgroundColor: active ? seg.activeBg : 'transparent',
                borderColor: active ? seg.activeBorder : colors.border,
                borderLeftWidth: isFirst ? 0 : 1,
                borderTopLeftRadius: isFirst ? radii.control - 2 : 0,
                borderBottomLeftRadius: isFirst ? radii.control - 2 : 0,
                borderTopRightRadius: isLast ? radii.control - 2 : 0,
                borderBottomRightRadius: isLast ? radii.control - 2 : 0,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${seg.label} ${seg.scoreLabel}`}
          >
            <View style={styles.contentWrap}>
              <Ionicons
                name={seg.icon}
                size={16}
                color={active ? seg.activeText : colors.textSecondary}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.scoreText,
                  {
                    color: active ? seg.activeText : colors.textPrimary,
                  },
                ]}
              >
                {seg.scoreLabel}
              </Text>
              <Text
                style={[
                  styles.labelText,
                  {
                    color: active ? seg.activeText : colors.textSecondary,
                  },
                ]}
              >
                {seg.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 2,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 2,
  },
});

export default WinDrawLossSelector;
