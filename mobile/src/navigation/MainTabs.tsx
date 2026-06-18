import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStackNavigator from './HomeStackNavigator';
import AttendanceScreen from '../screens/AttendanceScreen';
import VisitorsScreen from '../screens/VisitorsScreen';
import TeamScreen from '../screens/TeamScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  HomeStack: '🏠',
  Attendance: '🗓️',
  Visitors: '🧑‍🤝‍🧑',
  Team: '📡',
  Profile: '👤',
};

export default function MainTabs() {
  const { employee } = useAuth();
  const canViewTeam = employee?.role === 'Manager' || employee?.role === 'Admin';

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
      {canViewTeam && <Tab.Screen name="Team" component={TeamScreen} options={{ title: 'Team' }} />}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
