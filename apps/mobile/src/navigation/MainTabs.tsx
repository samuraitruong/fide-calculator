import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MenuProvider, useMenu } from '@/contexts/MenuContext';
import MenuModal from '@/components/MenuModal';
import HomeScreen from '@/screens/HomeScreen';
import HistoryScreen from '@/screens/HistoryScreen';

export type MainTabsParamList = {
  Home: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

function HeaderMenuButton() {
  const { openMenu } = useMenu();
  return (
    <TouchableOpacity onPress={openMenu} style={{ marginLeft: 12 }} hitSlop={12}>
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
          headerLeft: () => <HeaderMenuButton />,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Calculator',
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
