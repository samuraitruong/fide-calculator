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
              paddingTop: insets.top + 8,
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
              <Text style={styles.title}>Menu</Text>
              <TouchableOpacity
                onPress={closeMenu}
                hitSlop={12}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#374151" />
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
});
