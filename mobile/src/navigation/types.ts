import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type HomeStackParamList = {
  Dashboard: undefined;
  Punch: undefined;
};

export type MainTabParamList = {
  HomeStack: undefined;
  Attendance: undefined;
  Visitors: undefined;
  Team: undefined;
  Profile: undefined;
};

export type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export type PunchScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Punch'>;
