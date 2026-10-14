// ─────────────────────────────────────────────────────────────
// lib/controllers/authController.ts — Controladores de autenticación
// ─────────────────────────────────────────────────────────────
// Traduce el resultado de authService a una respuesta HTTP estándar.
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendError, sendSuccess } from '../response.js';
import { login, register } from '../services/authService.js';
import type { LoginRequest, RegisterRequest } from '../types.js';

/** POST /api/v1/auth/register — registro institucional. */
export function handleRegister(req: VercelRequest, res: VercelResponse): void {
  const result = register(req.body as Partial<RegisterRequest>);

  if (!result.ok) {
    sendError(res, result.status, result.code, result.message);
    return;
  }

  sendSuccess(res, result.data, 201);
}

/** POST /api/v1/auth/login — inicio de sesión institucional. */
export function handleLogin(req: VercelRequest, res: VercelResponse): void {
  const result = login(req.body as Partial<LoginRequest>);

  if (!result.ok) {
    sendError(res, result.status, result.code, result.message);
    return;
  }

  sendSuccess(res, result.data);
}
