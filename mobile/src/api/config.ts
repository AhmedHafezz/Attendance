import { Platform } from 'react-native';

/**
 * Update this to your machine's LAN IP when testing on a physical device
 * (e.g. "http://192.168.1.50:5000/api/v1"). "localhost" only works for
 * iOS simulator; Android emulator needs 10.0.2.2 to reach the host machine.
 */
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${DEV_HOST}:5000/api/v1`;

export const STORAGE_KEYS = {
  accessToken: 'matrix_access_token',
  refreshToken: 'matrix_refresh_token',
  employee: 'matrix_employee',
} as const;
