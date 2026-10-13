import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MenuProvider, useMenu } from '@/contexts/MenuContext';
import MenuModal from '@/components/MenuModal';
import HomeScreen from '@/screens/HomeScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import appIcon from '../../assets/rating-knight-icon.png';
import { colors, radii, spacing, typography, touchTargets } from '../theme/tokens';

import type { MainTabsParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabsParamList>();

function HeaderBrand() {
  return (
    <View style={styles.brand}>
      <Image
        source={appIcon}
        style={styles.icon}
        resizeMode="contain"
        accessible={false}
      />
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        FIDE Calculator
      </Text>
    </View>
  );
}

function HeaderMenuButton() {
  const { openMenu } = useMenu();
  return (
    <TouchableOpacity
      onPress={openMenu}
      style={styles.menuButton}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="menu" size={26} color={colors.textPrimary} />
    </TouchableOpacity>
  );
}

export default function MainTabs() {
  return (
    <MenuProvider>
      <MenuModal />
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.canvas,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitle: () => <HeaderBrand />,
          headerTitleAlign: 'left',
          headerRight: () => <HeaderMenuButton />,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
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
    gap: spacing.sm + 2,
    flexShrink: 1,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  menuButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
