import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { EmployeeInfo } from '../types';
import { configureApiClient, setAccessToken } from '../api/client';
import * as authApi from '../api/auth';
import { deleteSecureItem, getSecureItem, setSecureItem } from '../utils/storage';
import { STORAGE_KEYS } from '../api/config';

interface AuthContextValue {
  employee: EmployeeInfo | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setAccessToken(null);
    setEmployee(null);
    await Promise.all([
      deleteSecureItem(STORAGE_KEYS.accessToken),
      deleteSecureItem(STORAGE_KEYS.refreshToken),
      deleteSecureItem(STORAGE_KEYS.employee),
    ]);
  }, []);

  useEffect(() => {
    configureApiClient({
      onRefresh: async () => {
        const storedRefresh = await getSecureItem(STORAGE_KEYS.refreshToken);
        if (!storedRefresh) return null;
        try {
          const result = await authApi.refreshToken(storedRefresh);
          setAccessToken(result.accessToken);
          await setSecureItem(STORAGE_KEYS.accessToken, result.accessToken);
          await setSecureItem(STORAGE_KEYS.refreshToken, result.refreshToken);
          return result.accessToken;
        } catch {
          return null;
        }
      },
      onSessionExpired: () => {
        clearSession();
      },
    });
  }, [clearSession]);

  useEffect(() => {
    (async () => {
      const [storedAccess, storedEmployee] = await Promise.all([
        getSecureItem(STORAGE_KEYS.accessToken),
        getSecureItem(STORAGE_KEYS.employee),
      ]);
      if (storedAccess && storedEmployee) {
        setAccessToken(storedAccess);
        setEmployee(JSON.parse(storedEmployee));
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setAccessToken(result.accessToken);
    setEmployee(result.employee);
    await Promise.all([
      setSecureItem(STORAGE_KEYS.accessToken, result.accessToken),
      setSecureItem(STORAGE_KEYS.refreshToken, result.refreshToken),
      setSecureItem(STORAGE_KEYS.employee, JSON.stringify(result.employee)),
    ]);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort server revoke; proceed with local logout regardless
    }
    await clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ employee, isLoading, login, logout }),
    [employee, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
