import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  authApi,
  SESSION_EXPIRED_EVENT,
  sessionTokens,
  userApi,
} from '@shared/http/apiClient';
import {
  can as hasPermission,
  normalizePermissions,
  normalizeRoles,
  type AuthorizationContext,
} from '@shared/config/authorization';

export type AuthSession = AuthorizationContext & {
  userId?: string;
  fullName?: string;
  email?: string;
  preferences?: { language?: string; currency?: string };
};

type LoginCredentials = { login: string; password: string };

type RegistrationPayload = {
  username: string;
  email: string;
  password: string;
  fullName: string;
  documentType: 'CC' | 'CE';
  documentNumber: string;
};

type AuthContextValue = {
  session: AuthSession | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  can: (permission: string) => boolean;
  refreshSession: () => Promise<AuthSession>;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  register: (payload: RegistrationPayload) => Promise<AuthSession>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => ReturnType<typeof authApi.requestPasswordReset>;
  resetPassword: (payload: { token: string; password: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();

  const clearLocalSession = useCallback(() => {
    sessionTokens.clear();
    queryClient.clear();
    setSession(null);
  }, [queryClient]);

  const refreshSession = useCallback(async () => {
    const response = await userApi.me();
    const data = response.data as Partial<AuthSession>;
    const nextSession: AuthSession = {
      ...data,
      roles: normalizeRoles(data.roles),
      permissions: normalizePermissions(data.permissions),
    };
    setSession(nextSession);
    if (nextSession.preferences?.language) {
      await i18n.changeLanguage(nextSession.preferences.language);
    }
    return nextSession;
  }, [i18n]);

  const login = useCallback(
    async ({ login: identifier, password }: LoginCredentials) => {
      const response = await authApi.login(identifier, password);
      sessionTokens.save(response.data);
      return refreshSession();
    },
    [refreshSession]
  );

  const register = useCallback(
    async (payload: RegistrationPayload) => {
      const response = await authApi.register(payload);
      sessionTokens.save(response.data);
      return refreshSession();
    },
    [refreshSession]
  );

  const logout = useCallback(async () => {
    const refreshToken = sessionTokens.refreshToken;
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      clearLocalSession();
    }
  }, [clearLocalSession]);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        if (sessionTokens.accessToken) {
          await refreshSession();
        } else if (sessionTokens.refreshToken) {
          const refreshed = await authApi.refresh(sessionTokens.refreshToken);
          sessionTokens.save(refreshed.data);
          await refreshSession();
        }
      } catch {
        clearLocalSession();
      } finally {
        if (active) setIsInitializing(false);
      }
    };
    initialize();
    return () => {
      active = false;
    };
  }, [clearLocalSession, refreshSession]);

  useEffect(() => {
    const handleExpiredSession = () => clearLocalSession();
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession);
  }, [clearLocalSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isInitializing,
      isAuthenticated: Boolean(session),
      can: (permission) => hasPermission(session?.permissions, permission),
      refreshSession,
      login,
      register,
      logout,
      requestPasswordReset: authApi.requestPasswordReset,
      resetPassword: async ({ token, password }) => {
        await authApi.resetPassword(token, password);
      },
    }),
    [isInitializing, login, logout, refreshSession, register, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  return context;
}
