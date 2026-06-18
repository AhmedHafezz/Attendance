import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { EmployeeListItem } from '../types';

export type HomeStackParamList = {
  Dashboard: undefined;
  Punch: undefined;
};

export type TeamStackParamList = {
  Team: undefined;
  Employees: undefined;
  EmployeeForm: { employee?: EmployeeListItem } | undefined;
};

export type MainTabParamList = {
  HomeStack: undefined;
  Attendance: undefined;
  Visitors: undefined;
  TeamStack: undefined;
  Profile: undefined;
};

export type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export type PunchScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Punch'>;

export type TeamScreenNavigationProp = NativeStackNavigationProp<TeamStackParamList, 'Team'>;
export type EmployeesScreenNavigationProp = NativeStackNavigationProp<TeamStackParamList, 'Employees'>;
export type EmployeeFormScreenNavigationProp = NativeStackNavigationProp<TeamStackParamList, 'EmployeeForm'>;
export type EmployeeFormScreenRouteProp = RouteProp<TeamStackParamList, 'EmployeeForm'>;
