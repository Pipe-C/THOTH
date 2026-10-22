// ─────────────────────────────────────────────────────────────
// lib/services/authService.ts — Lógica de registro e inicio de sesión
// ─────────────────────────────────────────────────────────────
// Encapsula las reglas de negocio de autenticación (dominio
// institucional, perfil y longitud de contraseña) y delega la
// persistencia al userRepository en Supabase. No conoce HTTP.
// ─────────────────────────────────────────────────────────────

import { ALLOWED_DOMAIN, MIN_PASSWORD_LENGTH } from '../config.js';
import { ErrorCode, requireFields } from '../response.js';
import * as userRepository from '../repositories/userRepository.js';
import type { LoginRequest, RegisterRequest, UserProfile } from '../types.js';
import { failure, success, type ServiceResult } from './serviceResult.js';

/** Usuario devuelto tras un registro exitoso. */
export interface RegisteredUser {
  uid: string;
  email: string;
  displayName: string;
  profile: UserProfile;
  createdAt: string;
}

/** Sesión devuelta tras un inicio de sesión exitoso. */
export interface LoggedUser {
  uid: string;
  email: string;
  idToken: string;
  expiresIn: number;
  profile: UserProfile;
}

const VALID_PROFILES: UserProfile[] = ['estudiante', 'docente'];

function isValidInstitutionalEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

/**
 * Registra un usuario validando dominio institucional, perfil y
 * contraseña. Persiste en Supabase mediante el userRepository.
 */
export async function register(
  payload: Partial<RegisterRequest>,
): Promise<ServiceResult<RegisteredUser>> {
  const missing = requireFields(payload as RegisterRequest, [
    'email',
    'password',
    'displayName',
    'profile',
  ]);

  if (missing.length > 0) {
    return failure(
      400,
      ErrorCode.MISSING_FIELDS,
      `Campos requeridos faltantes: ${missing.join(', ')}`,
    );
  }

  const { email, password, displayName, profile } = payload as RegisterRequest;

  if (!isValidInstitutionalEmail(email)) {
    return failure(
      400,
      ErrorCode.INVALID_DOMAIN,
      `Solo se permiten correos del dominio @${ALLOWED_DOMAIN}. Recibido: ${email}`,
    );
  }

  if (!VALID_PROFILES.includes(profile)) {
    return failure(
      400,
      ErrorCode.VALIDATION_ERROR,
      `El campo "profile" debe ser "estudiante" o "docente". Recibido: "${profile}"`,
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return failure(
      400,
      ErrorCode.VALIDATION_ERROR,
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }

  const normalized = email.trim().toLowerCase();
  const existing = await userRepository.findByEmail(normalized);

  if (existing) {
    return failure(
      400,
      ErrorCode.VALIDATION_ERROR,
      'El correo electrónico ya se encuentra registrado.',
    );
  }

  const stored = await userRepository.save({
    email: normalized,
    password,
    displayName,
    profile,
  });

  return success({
    uid: stored.uid,
    email: stored.email,
    displayName: stored.displayName,
    profile: stored.profile,
    createdAt: stored.createdAt,
  });
}

/**
 * Autentica un usuario institucional consultando las credenciales en Supabase.
 */
export async function login(
  payload: Partial<LoginRequest>,
): Promise<ServiceResult<LoggedUser>> {
  const missing = requireFields(payload as LoginRequest, ['email', 'password']);
  if (missing.length > 0) {
    return failure(
      400,
      ErrorCode.MISSING_FIELDS,
      `Campos requeridos faltantes: ${missing.join(', ')}`,
    );
  }

  const { email, password } = payload as LoginRequest;
  const normalized = email.trim().toLowerCase();

  if (!isValidInstitutionalEmail(normalized)) {
    return failure(
      400,
      ErrorCode.INVALID_DOMAIN,
      `Solo se permiten correos del dominio @${ALLOWED_DOMAIN}.`,
    );
  }

  if (!password || password.length < 1) {
    return failure(400, ErrorCode.MISSING_FIELDS, 'La contraseña es requerida.');
  }

  const user = await userRepository.verifyCredentials(normalized, password);

  if (!user) {
    return failure(
      400,
      ErrorCode.UNAUTHORIZED,
      'Credenciales inválidas. Verifica tu correo y contraseña.',
    );
  }

  return success({
    uid: user.uid,
    email: user.email,
    idToken: 'MOCK_ID_TOKEN_REPLACE_IN_PHASE_4',
    expiresIn: 3600,
    profile: user.profile,
  });
}
