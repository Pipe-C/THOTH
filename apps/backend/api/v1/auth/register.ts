// ─────────────────────────────────────────────────────────────
// api/v1/auth/register.ts — Endpoint 2: User Register
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────────
// Registers a new user validating that email is part
// of institutional domain @pascualbravo.edu.co.
// Saves profile in Firestore (Phase 4); in this phase
// returns real structured mock with complete validations.
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

// ─── Constants ───────────────────────────────────────────────

const ALLOWED_DOMAIN = 'pascualbravo.edu.co';

/** Minimum length of password */
const MIN_PASSWORD_LENGTH = 8;

// ─── Validations ─────────────────────────────────────────────

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

  // 1. Validate required camps
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

  // 2. Validate institutional domain
  if (!isValidInstitutionalEmail(email)) {
    sendError(
      res,
      400,
      ErrorCode.INVALID_DOMAIN,
      `Solo se permiten correos del dominio @${ALLOWED_DOMAIN}. Recibido: ${email}`,
    );
    return;
  }

  // 3. Validate profile
  if (!['estudiante', 'docente'].includes(profile)) {
    sendError(
      res,
      400,
      ErrorCode.VALIDATION_ERROR,
      `El campo "profile" debe ser "estudiante" o "docente". Recibido: "${profile}"`,
    );
    return;
  }

  // 4. Validate password
  if (!isValidPassword(password)) {
    sendError(
      res,
      400,
      ErrorCode.VALIDATION_ERROR,
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
    return;
  }

  // 5. Register (Phase 4: Firebase Auth real)
  //    For now: mock structured response with all real camps.
  //    In phase 4 replace for:
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
      // In phase 4: token JWT of Firebase to authenticate session
      // idToken: '...',
    },
    201,
  );
}
