import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TeamScreen from '../screens/TeamScreen';
import EmployeesScreen from '../screens/EmployeesScreen';
import EmployeeFormScreen from '../screens/EmployeeFormScreen';
import { colors } from '../theme/colors';
import type { TeamStackParamList } from './types';

const Stack = createNativeStackNavigator<TeamStackParamList>();

export default function TeamStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Team" component={TeamScreen} options={{ title: 'Team' }} />
      <Stack.Screen name="Employees" component={EmployeesScreen} options={{ title: 'Manage Employees' }} />
      <Stack.Screen
        name="EmployeeForm"
        component={EmployeeFormScreen}
        options={({ route }) => ({ title: route.params?.employee ? 'Edit Employee' : 'New Employee' })}
      />
    </Stack.Navigator>
  );
}
