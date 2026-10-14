import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMenu } from '@/contexts/MenuContext';
import { useTheme } from '../contexts/ThemeContext';
import ProfileMenuContent from '@/components/ProfileMenuContent';
import ChessInsignia from './ui/ChessInsignia';

export default function MenuModal() {
  const { open, closeMenu } = useMenu();
  const { colors, radii, spacing, touchTargets, shadows, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (open) {
      slideAnim.setValue(1);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [open, slideAnim]);

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={closeMenu}
    >
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={closeMenu}>
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderLeftWidth: borderWidth.default,
              borderTopLeftRadius: radii.sheet,
              borderBottomLeftRadius: radii.sheet,
              paddingTop: insets.top + spacing.sm,
              ...shadows.drawer,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 60],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.drawerContent}>
            <View style={[styles.header, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.border }]}>
              <View style={styles.headerTitleRow}>
                <ChessInsignia piece="knight" size={16} badgeSize={28} color={colors.primary} />
                <Text style={[styles.title, { color: colors.textPrimary }]}>ACCOUNT & SETTINGS</Text>
              </View>
              <TouchableOpacity
                onPress={closeMenu}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.closeButton,
                  {
                    width: touchTargets.min,
                    height: touchTargets.min,
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close profile menu"
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ProfileMenuContent />
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: '85%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
});
