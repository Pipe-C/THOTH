// ─────────────────────────────────────────────────────────────
// api/v1/auth/login.ts — Endpoint 3: Login de Usuario
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────
// Autentica a un usuario con email y contraseña.
// En esta fase devuelve un mock estructurado con validaciones
// de dominio real. En Fase 4 se conecta Firebase Auth REST API.
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

// ─── Constantes ───────────────────────────────────────────────

const ALLOWED_DOMAIN = 'pascualbravo.edu.co';

// ─── Handler ──────────────────────────────────────────────────

export default function handler(
  req: VercelRequest,
  res: VercelResponse,
): void {
  if (!requireMethod(req, res, 'POST')) return;

  const body = req.body as Partial<LoginRequest>;

  // 1. Validar campos requeridos
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

  // 2. Validar dominio (previene intentos con cuentas externas)
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

  // 3. Validar que la contraseña no esté vacía
  if (!password || password.length < 1) {
    sendError(res, 400, ErrorCode.MISSING_FIELDS, 'La contraseña es requerida.');
    return;
  }

  // 4. Autenticación (Fase 4: Firebase Auth REST API)
  //    En Fase 4 se reemplaza por:
  //    const result = await signInWithEmailAndPassword(auth, email, password);
  //    const idToken = await result.user.getIdToken();
  //    Luego se verifica idToken en el servidor con admin.auth().verifyIdToken(idToken).
  //
  //    MOCK TEMPORAL:
  //    - Devuelve "no autorizado" para cualquier contraseña vacía (ya validado arriba).
  //    - Simula un login exitoso con un token placeholder.
  //    - En producción NUNCA devolver datos reales de usuario sin verificar Firebase.

  // Simular que el usuario existe en el sistema (Fase 4: validar contra Firebase)
  const mockUid = `mock_user_${normalized.split('@')[0]}`;

  sendSuccess(res, {
    uid: mockUid,
    email: normalized,
    // En Fase 4: idToken y refreshToken de Firebase
    idToken: 'MOCK_ID_TOKEN_REPLACE_IN_PHASE_4',
    expiresIn: 3600,
    profile: 'estudiante', // En Fase 4: leer desde Firestore users/{uid}.profile
  });
}
