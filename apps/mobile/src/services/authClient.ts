// -----------------------------------------------------------------
// src/services/authClient.ts — Firebase Auth REST client
// -----------------------------------------------------------------
// Uses Firebase Identity Platform REST API so no native module is
// required in Phase 4. When/if @react-native-firebase/auth is added,
// replace the fetch calls with the SDK equivalents keeping this file
// as the single integration point.
//
// Variables expected (hardcode dev values for now; in production
// use react-native-config or a similar env solution):
//   FIREBASE_API_KEY   — from Firebase project settings
//   FIREBASE_PROJECT_ID — from Firebase project settings
// -----------------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FIREBASE_CONFIG,
  FIREBASE_CONFIG_ERROR,
} from '../config/firebase';
import type { UserProfileRole } from '../types';

// ─── Constants ────────────────────────────────────────────────

const FIREBASE_API_KEY = FIREBASE_CONFIG.apiKey;
const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';

// AsyncStorage keys
const KEY_ID_TOKEN = '@toth/idToken';
const KEY_UID = '@toth/uid';
const KEY_EMAIL = '@toth/email';
const KEY_PROFILE = '@toth/profile';

// ─── Types ────────────────────────────────────────────────────

export interface AuthSession {
  uid: string;
  email: string;
  idToken: string;
  profile: UserProfileRole;
}

export class AuthError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// ─── Helpers ──────────────────────────────────────────────────

export function isAuthError(err: unknown): err is AuthError {
  return err instanceof AuthError;
}

/**
 * Translate Firebase REST error codes to Spanish user messages.
 */
function translateFirebaseError(code: string): string {
  switch (code) {
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_EMAIL':
      return 'El correo no esta registrado o no es valido.';
    case 'INVALID_PASSWORD':
    case 'INVALID_LOGIN_CREDENTIALS':
      return 'Las credenciales son incorrectas.';
    case 'EMAIL_EXISTS':
      return 'Este correo ya esta registrado.';
    case 'WEAK_PASSWORD : Password should be at least 6 characters':
    case 'WEAK_PASSWORD':
      return 'La contrasena debe tener al menos 6 caracteres.';
    case 'USER_DISABLED':
      return 'Esta cuenta ha sido deshabilitada.';
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return 'Demasiados intentos. Intenta de nuevo mas tarde.';
    case 'API_KEY_INVALID':
    case 'API key not valid. Please pass a valid API key.':
      return 'La API key de Firebase no es válida. Revisa apps/mobile/.env.';
    case 'CONFIGURATION_NOT_FOUND':
      return 'El proyecto de Firebase no está habilitado para Auth.';
    default:
      return 'Error de autenticacion. Intenta de nuevo.';
  }
}

async function firebasePost<T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<T> {
  if (!FIREBASE_CONFIG.isConfigured) {
    throw new AuthError('FIREBASE_NOT_CONFIGURED', FIREBASE_CONFIG_ERROR);
  }

  const url = `${AUTH_BASE}/${endpoint}?key=${FIREBASE_API_KEY}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, returnSecureToken: true }),
    });
  } catch {
    throw new AuthError(
      'NETWORK_ERROR',
      'No se pudo conectar con Firebase. Verifica tu conexion.',
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const err = (data['error'] as Record<string, unknown> | undefined) ?? {};
    const rawMessage = err['message'];
    const code = typeof rawMessage === 'string' ? rawMessage : 'AUTH_ERROR';
    throw new AuthError(code, translateFirebaseError(code));
  }

  return data as T;
}

// ─── Session persistence ──────────────────────────────────────

async function persistSession(session: AuthSession): Promise<void> {
  await AsyncStorage.multiSet([
    [KEY_ID_TOKEN, session.idToken],
    [KEY_UID, session.uid],
    [KEY_EMAIL, session.email],
    [KEY_PROFILE, session.profile],
  ]);
}

/** Retrieves the saved session from AsyncStorage. Returns null if not found. */
export async function getStoredSession(): Promise<AuthSession | null> {
  const values = await AsyncStorage.multiGet([
    KEY_ID_TOKEN,
    KEY_UID,
    KEY_EMAIL,
    KEY_PROFILE,
  ]);
  const map = Object.fromEntries(values.map(([k, v]) => [k, v]));

  const idToken = map[KEY_ID_TOKEN];
  const uid = map[KEY_UID];
  const email = map[KEY_EMAIL];
  const profile = map[KEY_PROFILE] as UserProfileRole | null;

  if (!idToken || !uid || !email || !profile) return null;
  return { idToken, uid, email, profile };
}

/** Clears the persisted session (sign-out). */
export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEY_ID_TOKEN,
    KEY_UID,
    KEY_EMAIL,
    KEY_PROFILE,
  ]);
}

// ─── Public API ───────────────────────────────────────────────

const ALLOWED_DOMAIN = 'pascualbravo.edu.co';

function assertInstitutionalEmail(email: string): void {
  if (!email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
    throw new AuthError(
      'INVALID_DOMAIN',
      `Solo se permiten correos @${ALLOWED_DOMAIN}.`,
    );
  }
}

/**
 * Registers a new institutional user via Firebase Auth REST API.
 * Enforces the @pascualbravo.edu.co domain restriction.
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
  profile: UserProfileRole,
): Promise<AuthSession> {
  assertInstitutionalEmail(email);

  const data = await firebasePost<{
    localId: string;
    idToken: string;
    email: string;
  }>('accounts:signUp', { email, password, displayName });

  const session: AuthSession = {
    uid: data.localId,
    email: data.email,
    idToken: data.idToken,
    profile,
  };
  await persistSession(session);
  return session;
}

/**
 * Signs in an institutional user via Firebase Auth REST API.
 * Enforces the @pascualbravo.edu.co domain restriction.
 */
export async function signIn(
  email: string,
  password: string,
  profileFallback: UserProfileRole = 'estudiante',
): Promise<AuthSession> {
  assertInstitutionalEmail(email);

  const data = await firebasePost<{
    localId: string;
    idToken: string;
    email: string;
  }>('accounts:signInWithPassword', { email, password });

  const session: AuthSession = {
    uid: data.localId,
    email: data.email,
    idToken: data.idToken,
    profile: profileFallback,
  };
  await persistSession(session);
  return session;
}
