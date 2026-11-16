import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const TAB_ITEMS = [
  { name: 'index', title: 'Maçlar', activeIcon: 'football', inactiveIcon: 'football-outline' },
  { name: 'leagues', title: 'Ligler', activeIcon: 'trophy', inactiveIcon: 'trophy-outline' },
  { name: 'create', title: 'Oluştur', activeIcon: 'add-circle', inactiveIcon: 'add-circle-outline' },
  { name: 'market', title: 'Pazar', activeIcon: 'pricetag', inactiveIcon: 'pricetag-outline' },
  { name: 'profile', title: 'Profil', activeIcon: 'person', inactiveIcon: 'person-outline' },
] as const;

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.inactiveIcon}
                size={22}
                color={typeof color === 'string' ? color : undefined}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
