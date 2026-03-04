import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMenu } from '@/contexts/MenuContext';
import ProfileMenuContent from '@/components/ProfileMenuContent';

export default function MenuModal() {
  const { open, closeMenu } = useMenu();
  const insets = useSafeAreaInsets();

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={closeMenu}
    >
      <Pressable style={styles.overlay} onPress={closeMenu}>
        <Pressable style={[styles.drawer, { paddingTop: insets.top + 8 }]} onPress={(e) => e.stopPropagation()}>
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
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#f9fafb',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
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
