import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PunchScreen from '../screens/PunchScreen';
import { colors } from '../theme/colors';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Dashboard" component={HomeScreen} options={{ title: 'MATRIX Attendance' }} />
      <Stack.Screen name="Punch" component={PunchScreen} options={{ title: 'Mark Punch' }} />
    </Stack.Navigator>
  );
}
