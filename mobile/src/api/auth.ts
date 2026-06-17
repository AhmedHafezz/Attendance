import { apiRequest } from './client';
import type { LoginResponse } from '../types';

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    authenticated: false,
  });
}

export function refreshToken(refreshToken: string) {
  return apiRequest<LoginResponse>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    authenticated: false,
  });
}

export function logout() {
  return apiRequest<void>('/auth/logout', { method: 'POST' });
}
