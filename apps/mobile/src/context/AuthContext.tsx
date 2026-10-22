// -----------------------------------------------------------------
// src/services/AuthContext.tsx — Global auth state
// -----------------------------------------------------------------
// React context that holds the current user session and exposes
// login / register / logout actions. Screens read from here instead
// of calling authClient directly, keeping auth logic centralised.
// -----------------------------------------------------------------

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  signIn,
  signUp,
  clearSession,
  getStoredSession,
  isAuthError,
  type AuthSession,
  type AuthError,
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
  ) => Promise<AuthSession>;
  /** Registers a new institutional user and signs them in */
  register: (
    email: string,
    password: string,
    displayName: string,
    profile: UserProfileRole,
  ) => Promise<AuthSession>;
  /** Clears the session and redirects to Login */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore persisted session on app launch
  useEffect(() => {
    void getStoredSession().then((stored) => {
      setSession(stored);
      setIsLoading(false);
    });
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthSession> => {
    const newSession = await signIn(email, password);
    setSession(newSession);
    return newSession;
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    profile: UserProfileRole,
  ): Promise<AuthSession> => {
    const newSession = await signUp(email, password, displayName, profile);
    setSession(newSession);
    return newSession;
  };

  const logout = async (): Promise<void> => {
    await clearSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
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

export { isAuthError };
export type { AuthSession, AuthError };
