import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MenuProvider, useMenu } from '@/contexts/MenuContext';
import { useTheme } from '../contexts/ThemeContext';
import MenuModal from '@/components/MenuModal';
import HomeScreen from '@/screens/HomeScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import ChessInsignia from '../components/ui/ChessInsignia';
import ThemeToggle from '../components/ui/ThemeToggle';

import type { MainTabsParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabsParamList>();

function HeaderBrand() {
  const { colors } = useTheme();
  return (
    <View style={styles.brand}>
      <ChessInsignia piece="knight" size={18} badgeSize={32} color={colors.primary} />
      <View style={styles.brandTextContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1} accessibilityRole="header">
          FIDE CALCULATOR
        </Text>
        <Text style={[styles.subBrand, { color: colors.accent }]}>DGT ENGINE</Text>
      </View>
    </View>
  );
}

function HeaderRightActions() {
  const { openMenu } = useMenu();
  const { colors, touchTargets } = useTheme();

  return (
    <View style={styles.rightActionsRow}>
      <ThemeToggle compact={true} style={styles.themeToggleBtn} />
      <TouchableOpacity
        onPress={openMenu}
        style={[
          styles.menuButton,
          {
            width: touchTargets.min,
            height: touchTargets.min,
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open profile and settings menu"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="menu" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

export default function MainTabs() {
  const { colors, borderWidth } = useTheme();

  return (
    <MenuProvider>
      <MenuModal />
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            borderBottomWidth: borderWidth.default,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitle: () => <HeaderBrand />,
          headerTitleAlign: 'left',
          headerRight: () => <HeaderRightActions />,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: borderWidth.default,
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Calculator',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'calculator' : 'calculator-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'History',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'time' : 'time-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </MenuProvider>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
    paddingLeft: 4,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subBrand: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  themeToggleBtn: {
    marginRight: 2,
  },
  menuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
  },
});
