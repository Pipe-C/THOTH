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
const SECURE_TOKEN_BASE = 'https://securetoken.googleapis.com/v1';

// AsyncStorage keys
const KEY_ID_TOKEN = '@toth/idToken';
const KEY_REFRESH_TOKEN = '@toth/refreshToken';
const KEY_EXPIRES_AT = '@toth/expiresAt';
const KEY_UID = '@toth/uid';
const KEY_EMAIL = '@toth/email';
const KEY_PROFILE = '@toth/profile';

// ─── Types ────────────────────────────────────────────────────

export interface AuthSession {
  uid: string;
  email: string;
  idToken: string;
  refreshToken?: string;
  expiresAt?: number;
  profile: UserProfileRole;
  /** True for the local demo session: history stays on the device. */
  isGuest?: boolean;
}

interface FirebaseAuthResponse {
  localId: string;
  idToken: string;
  refreshToken?: string;
  expiresIn?: string;
  email: string;
  displayName?: string;
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
    case 'USER_NOT_FOUND':
      return 'La cuenta ya no existe. Inicia sesión de nuevo.';
    case 'TOKEN_EXPIRED':
    case 'INVALID_REFRESH_TOKEN':
      return 'La sesión expiró. Inicia sesión de nuevo.';
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

function toSession(
  data: FirebaseAuthResponse,
  profile: UserProfileRole,
): AuthSession {
  const expiresIn = Number(data.expiresIn ?? 3600);
  return {
    uid: data.localId,
    email: data.email,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    profile,
  };
}

async function persistSession(session: AuthSession): Promise<void> {
  await AsyncStorage.multiSet([
    [KEY_ID_TOKEN, session.idToken],
    [KEY_UID, session.uid],
    [KEY_EMAIL, session.email],
    [KEY_PROFILE, session.profile],
    [KEY_REFRESH_TOKEN, session.refreshToken ?? ''],
    [KEY_EXPIRES_AT, session.expiresAt ? String(session.expiresAt) : ''],
  ]);
}

/** Retrieves the saved session from AsyncStorage. Returns null if not found. */
export async function getStoredSession(): Promise<AuthSession | null> {
  const values = await AsyncStorage.multiGet([
    KEY_ID_TOKEN,
    KEY_UID,
    KEY_EMAIL,
    KEY_PROFILE,
    KEY_REFRESH_TOKEN,
    KEY_EXPIRES_AT,
  ]);
  const map = Object.fromEntries(values.map(([k, v]) => [k, v]));

  const idToken = map[KEY_ID_TOKEN];
  const uid = map[KEY_UID];
  const email = map[KEY_EMAIL];
  const profile = map[KEY_PROFILE] as UserProfileRole | null;
  const refreshToken = map[KEY_REFRESH_TOKEN] || undefined;
  const expiresAt = map[KEY_EXPIRES_AT]
    ? Number(map[KEY_EXPIRES_AT])
    : undefined;

  if (!idToken || !uid || !email || !profile) return null;
  return { idToken, uid, email, refreshToken, expiresAt, profile };
}

/** Clears the persisted session (sign-out). */
export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEY_ID_TOKEN,
    KEY_REFRESH_TOKEN,
    KEY_EXPIRES_AT,
    KEY_UID,
    KEY_EMAIL,
    KEY_PROFILE,
  ]);
}

/** Persists the active academic profile so it survives app restarts. */
export async function updateStoredProfile(
  profile: UserProfileRole,
): Promise<void> {
  await AsyncStorage.setItem(KEY_PROFILE, profile);
}

/**
 * Exchanges the refresh token for a fresh ID token. Returns the same
 * session when it still has more than one minute of validity or when
 * the stored session predates refresh-token support.
 */
export async function refreshSession(
  session: AuthSession,
  force = false,
): Promise<AuthSession> {
  if (!session.refreshToken) return session;
  if (
    !force &&
    session.expiresAt !== undefined &&
    session.expiresAt - Date.now() > 60_000
  ) {
    return session;
  }

  let response: Response;
  try {
    response = await fetch(
      `${SECURE_TOKEN_BASE}/token?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(
          session.refreshToken,
        )}`,
      },
    );
  } catch {
    throw new AuthError(
      'NETWORK_ERROR',
      'No se pudo renovar la sesión. Verifica tu conexión.',
    );
  }

  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const rawMessage = data['error'];
    const code =
      typeof rawMessage === 'string' ? rawMessage : 'REFRESH_TOKEN_ERROR';
    throw new AuthError(code, translateFirebaseError(code));
  }

  const expiresIn = Number(data['expires_in'] ?? 3600);
  const next: AuthSession = {
    ...session,
    uid: typeof data['user_id'] === 'string' ? data['user_id'] : session.uid,
    idToken: String(data['id_token'] ?? session.idToken),
    refreshToken:
      typeof data['refresh_token'] === 'string'
        ? data['refresh_token']
        : session.refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  await persistSession(next);
  return next;
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

  const signUpData = await firebasePost<FirebaseAuthResponse>(
    'accounts:signUp',
    { email, password },
  );

  let data = signUpData;
  try {
    const updated = await firebasePost<FirebaseAuthResponse>(
      'accounts:update',
      { idToken: signUpData.idToken, displayName },
    );
    data = { ...signUpData, ...updated, email: updated.email || signUpData.email };
  } catch {
    // The account already exists and is usable even if the display-name
    // update fails; do not turn a successful registration into an error.
  }

  const session = toSession(data, profile);
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

  const data = await firebasePost<FirebaseAuthResponse>(
    'accounts:signInWithPassword',
    { email, password },
  );

  const session = toSession(data, profileFallback);
  await persistSession(session);
  return session;
}
