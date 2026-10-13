// ─────────────────────────────────────────────────────────────
// api/v1/auth/login.ts — Endpoint 3: UserLogin
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────
// Authenticates a user with email and password.
// In this phase returns structured mock with validations
// of real domain. In Phase 4 connects Firebase Auth REST API.
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  sendSuccess,
  sendError,
  requireMethod,
  requireFields,
  ErrorCode,
} from '../../../lib/response.js';
import type { LoginRequest } from '../../../lib/types.js';

// ─── Constants ───────────────────────────────────────────────

const ALLOWED_DOMAIN = 'pascualbravo.edu.co';

// ─── Handler ──────────────────────────────────────────────────

export default function handler(
  req: VercelRequest,
  res: VercelResponse,
): void {
  if (!requireMethod(req, res, 'POST')) return;

  const body = req.body as Partial<LoginRequest>;

  // 1. Validate required camps
  const missing = requireFields(body as LoginRequest, ['email', 'password']);
  if (missing.length > 0) {
    sendError(
      res,
      400,
      ErrorCode.MISSING_FIELDS,
      `Campos requeridos faltantes: ${missing.join(', ')}`,
    );
    return;
  }

  const { email, password } = body as LoginRequest;

  // 2. Validate domain (prevents attempts with external accounts)
  const normalized = email.trim().toLowerCase();
  if (!normalized.endsWith(`@${ALLOWED_DOMAIN}`)) {
    sendError(
      res,
      400,
      ErrorCode.INVALID_DOMAIN,
      `Solo se permiten correos del dominio @${ALLOWED_DOMAIN}.`,
    );
    return;
  }

  // 3. Validate password to not be empty
  if (!password || password.length < 1) {
    sendError(res, 400, ErrorCode.MISSING_FIELDS, 'La contraseña es requerida.');
    return;
  }

  // 4. Authentication (Phase 4: Firebase Auth REST API)
  //    In Phase 4 replace for:
  //    const result = await signInWithEmailAndPassword(auth, email, password);
  //    const idToken = await result.user.getIdToken();
  //    after verify idToken in server with admin.auth().verifyIdToken(idToken).
  //
  //    TEMPORAL MOCK:
  //    - Returns "not authorized" to any empty password (already validated).
  //    - Simulate a success login with a placeholder token.
  //    - In production NEVER return real user data without verifying Firebase.

  // Simulate that user exists in the system (Phase 4: validate against Firebase)
  const mockUid = `mock_user_${normalized.split('@')[0]}`;

  sendSuccess(res, {
    uid: mockUid,
    email: normalized,
    // In phase 4: idToken y refreshToken of Firebase
    idToken: 'MOCK_ID_TOKEN_REPLACE_IN_PHASE_4',
    expiresIn: 3600,
    profile: 'estudiante', // In Phase 4: read from Firestore users/{uid}.profile
  });
}
