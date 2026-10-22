// -----------------------------------------------------------------
// src/services/AuthContext.tsx — Global auth state
// -----------------------------------------------------------------
// React context that holds the current user session and exposes
// login / register / logout actions. Screens read from here instead
// of calling authClient directly, keeping auth logic centralised.
// -----------------------------------------------------------------

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import {
  signIn,
  signUp,
  clearSession,
  getStoredSession,
  refreshSession,
  updateStoredProfile,
  type AuthSession,
} from './authClient';
import type { UserProfileRole } from '../types';

// ─── Context type ─────────────────────────────────────────────

interface AuthContextValue {
  /** Current session or null when unauthenticated */
  session: AuthSession | null;
  /** True while the stored session is being restored on app launch */
  isLoading: boolean;
  /** Signs in an existing institutional user */
  login: (
    email: string,
    password: string,
    profile?: UserProfileRole,
  ) => Promise<AuthSession>;
  /** Registers a new institutional user and signs them in */
  register: (
    email: string,
    password: string,
    displayName: string,
    profile: UserProfileRole,
  ) => Promise<AuthSession>;
  /** Updates the active academic profile and persists it locally */
  updateProfile: (profile: UserProfileRole) => Promise<void>;
  /** Clears the session and redirects to Login */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore persisted session on app launch and refresh an expired token.
  useEffect(() => {
    let isActive = true;

    void (async () => {
      const stored = await getStoredSession();
      if (!stored) {
        if (isActive) {
          setSession(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const fresh = await refreshSession(stored, true);
        if (isActive) setSession(fresh);
      } catch {
        if (isActive) setSession(stored);
      } finally {
        if (isActive) setIsLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  // Refresh when the app returns to the foreground after being suspended.
  useEffect(() => {
    if (!session?.refreshToken) return undefined;

    let isActive = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void refreshSession(session)
        .then((next) => {
          if (isActive) setSession(next);
        })
        .catch(() => undefined);
    });

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [session]);

  // Keep the ID token valid while the app stays open.
  useEffect(() => {
    if (!session?.refreshToken) return undefined;

    let isActive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (current: AuthSession) => {
      const refreshAt = (current.expiresAt ?? 0) - 5 * 60_000;
      const delay = Math.max(60_000, refreshAt - Date.now());
      timer = setTimeout(() => {
        void refreshSession(current)
          .then((next) => {
            if (!isActive) return;
            setSession(next);
            schedule(next);
          })
          .catch(() => {
            if (isActive) schedule(current);
          });
      }, delay);
    };

    schedule(session);

    return () => {
      isActive = false;
      if (timer) clearTimeout(timer);
    };
  }, [session]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      profile: UserProfileRole = 'estudiante',
    ): Promise<AuthSession> => {
      const newSession = await signIn(email, password, profile);
      setSession(newSession);
      return newSession;
    },
    [],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      profile: UserProfileRole,
    ): Promise<AuthSession> => {
      const newSession = await signUp(email, password, displayName, profile);
      setSession(newSession);
      return newSession;
    },
    [],
  );

  const updateProfile = useCallback(
    async (profile: UserProfileRole): Promise<void> => {
      if (!session) return;
      await updateStoredProfile(profile);
      setSession({ ...session, profile });
    },
    [session],
  );

  const logout = useCallback(async (): Promise<void> => {
    await clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, isLoading, login, register, updateProfile, logout }),
    [session, isLoading, login, register, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


/**
 * Returns the current auth context.
 * Must be used inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export { isAuthError } from './authClient';
export type { AuthError } from './authClient';
export type { AuthSession };
