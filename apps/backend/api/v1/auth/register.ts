// ─────────────────────────────────────────────────────────────
// api/v1/auth/register.ts — Endpoint 2: Registro de Usuario
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────────
// Registra un nuevo usuario validando que el email pertenezca
// al dominio institucional @pascualbravo.edu.co.
// Guarda el perfil en Firestore (Fase 4); en esta fase devuelve
// un mock estructurado real con validaciones completas.
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  sendSuccess,
  sendError,
  requireMethod,
  requireFields,
  ErrorCode,
} from '../../../lib/response.js';
import type { RegisterRequest } from '../../../lib/types.js';

// ─── Constantes ───────────────────────────────────────────────

const ALLOWED_DOMAIN = 'pascualbravo.edu.co';

/** Longitud mínima de contraseña */
const MIN_PASSWORD_LENGTH = 8;

// ─── Validaciones ─────────────────────────────────────────────

function isValidInstitutionalEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(`@${ALLOWED_DOMAIN}`);
}

function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

// ─── Handler ──────────────────────────────────────────────────

export default function handler(
  req: VercelRequest,
  res: VercelResponse,
): void {
  if (!requireMethod(req, res, 'POST')) return;

  const body = req.body as Partial<RegisterRequest>;

  // 1. Validar campos requeridos
  const missing = requireFields(body as RegisterRequest, [
    'email',
    'password',
    'displayName',
    'profile',
  ]);

  if (missing.length > 0) {
    sendError(
      res,
      400,
      ErrorCode.MISSING_FIELDS,
      `Campos requeridos faltantes: ${missing.join(', ')}`,
    );
    return;
  }

  const { email, password, displayName, profile } = body as RegisterRequest;

  // 2. Validar dominio institucional
  if (!isValidInstitutionalEmail(email)) {
    sendError(
      res,
      400,
      ErrorCode.INVALID_DOMAIN,
      `Solo se permiten correos del dominio @${ALLOWED_DOMAIN}. Recibido: ${email}`,
    );
    return;
  }

  // 3. Validar perfil
  if (!['estudiante', 'docente'].includes(profile)) {
    sendError(
      res,
      400,
      ErrorCode.VALIDATION_ERROR,
      `El campo "profile" debe ser "estudiante" o "docente". Recibido: "${profile}"`,
    );
    return;
  }

  // 4. Validar contraseña
  if (!isValidPassword(password)) {
    sendError(
      res,
      400,
      ErrorCode.VALIDATION_ERROR,
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
    return;
  }

  // 5. Registro (Fase 4: Firebase Auth real)
  //    Por ahora: respuesta estructurada mock con todos los campos reales.
  //    En Fase 4 se reemplaza este bloque por:
  //    const userRecord = await admin.auth().createUser({ email, password, displayName });
  //    await db.collection('users').doc(userRecord.uid).set({ profile, createdAt });

  const mockUid = `mock_${Date.now()}`;

  sendSuccess(
    res,
    {
      uid: mockUid,
      email: email.trim().toLowerCase(),
      displayName,
      profile,
      createdAt: new Date().toISOString(),
      // En Fase 4: token JWT de Firebase para autenticar sesión
      // idToken: '...',
    },
    201,
  );
}
