import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type ChessPieceType = 'knight' | 'rook' | 'king' | 'queen' | 'bishop' | 'pawn';

export interface ChessInsigniaProps {
  piece?: ChessPieceType;
  size?: number;
  badgeSize?: number;
  color?: string;
  badgeBg?: string;
  badgeBorder?: string;
  hasBorder?: boolean;
  style?: StyleProp<ViewStyle>;
}

const unicodePieces: Record<ChessPieceType, string> = {
  knight: '♞',
  rook: '♜',
  king: '♚',
  queen: '♛',
  bishop: '♝',
  pawn: '♟',
};

// Safe conditional loader for @expo/vector-icons so node/jest test environments without mock don't fail
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MaterialCommunityIconsComponent: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vectorIcons = require('@expo/vector-icons');
  MaterialCommunityIconsComponent = vectorIcons?.MaterialCommunityIcons || null;
} catch {
  MaterialCommunityIconsComponent = null;
}

export const ChessInsignia: React.FC<ChessInsigniaProps> = ({
  piece = 'knight',
  size = 20,
  badgeSize,
  color,
  badgeBg,
  badgeBorder,
  hasBorder = true,
  style,
}) => {
  const { colors, radii, borderWidth } = useTheme();

  const getIconName = (): string => {
    switch (piece) {
      case 'rook':
        return 'chess-rook';
      case 'king':
        return 'chess-king';
      case 'queen':
        return 'chess-queen';
      case 'bishop':
        return 'chess-bishop';
      case 'pawn':
        return 'chess-pawn';
      case 'knight':
      default:
        return 'chess-knight';
    }
  };

  const calculatedBadgeSize = badgeSize || size + 16;
  const iconColor = color || colors.primary;
  const containerBg = badgeBg || colors.surfaceElevated;
  const containerBorder = badgeBorder || colors.border;

  const hasVectorIcon = typeof MaterialCommunityIconsComponent === 'function';

  return (
    <View
      style={[
        styles.badge,
        {
          width: calculatedBadgeSize,
          height: calculatedBadgeSize,
          borderRadius: radii.sm + 2,
          backgroundColor: containerBg,
          borderColor: containerBorder,
          borderWidth: hasBorder ? borderWidth.default : 0,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Chess ${piece} insignia`}
    >
      {hasVectorIcon ? (
        <MaterialCommunityIconsComponent name={getIconName()} size={size} color={iconColor} />
      ) : (
        <Text style={{ fontSize: size, color: iconColor }}>{unicodePieces[piece] || '♞'}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChessInsignia;
