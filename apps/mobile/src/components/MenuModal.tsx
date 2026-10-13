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
import ProfileMenuContent from '@/components/ProfileMenuContent';
import { colors, radii, spacing, typography, touchTargets, shadows } from '../theme/tokens';

export default function MenuModal() {
  const { open, closeMenu } = useMenu();
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
      <Pressable style={styles.overlay} onPress={closeMenu}>
        <Animated.View
          style={[
            styles.drawer,
            {
              paddingTop: insets.top + spacing.sm,
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
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerMotif}>♟</Text>
                <Text style={styles.title}>Account & Profiles</Text>
              </View>
              <TouchableOpacity
                onPress={closeMenu}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close profile menu"
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
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
    backgroundColor: colors.overlay,
  },
  drawer: {
    width: '85%',
    maxWidth: 360,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radii.sheet,
    borderBottomLeftRadius: radii.sheet,
    borderLeftWidth: 1,
    borderColor: colors.border,
    ...shadows.drawer,
    overflow: 'hidden',
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerMotif: {
    fontSize: 20,
    color: colors.primary,
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  closeButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
});
