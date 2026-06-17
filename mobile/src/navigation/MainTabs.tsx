import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStackNavigator from './HomeStackNavigator';
import AttendanceScreen from '../screens/AttendanceScreen';
import VisitorsScreen from '../screens/VisitorsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  HomeStack: '🏠',
  Attendance: '🗓️',
  Visitors: '🧑‍🤝‍🧑',
  Profile: '👤',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: () => <Text>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="HomeStack" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Attendance' }} />
      <Tab.Screen name="Visitors" component={VisitorsScreen} options={{ title: 'Visitors' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
