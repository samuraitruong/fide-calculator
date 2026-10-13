import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MenuProvider, useMenu } from '@/contexts/MenuContext';
import MenuModal from '@/components/MenuModal';
import HomeScreen from '@/screens/HomeScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import appIcon from '../../assets/rating-knight-icon.png';

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
    >
      <Ionicons name="menu" size={28} color="#1f2937" />
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
          headerTitle: () => <HeaderBrand />,
          headerTitleAlign: 'left',
          headerRight: () => <HeaderMenuButton />,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'FIDE Calculator',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'calculator' : 'calculator-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'History',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'time' : 'time-outline'} size={size} color={color} />
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
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flexShrink: 1,
  },
  menuButton: {
    width: 44,
    height: 44,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
