// ─────────────────────────────────────────────────────────────
// lib/controllers/authController.ts — Auth controllers.
// ─────────────────────────────────────────────────────────────
// Translates the result of authService to a standard HTTP response.
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendError, sendSuccess } from '../response.js';
import { login, register } from '../services/authService.js';
import type { LoginRequest, RegisterRequest } from '../types.js';

/** POST /api/v1/auth/register — institutional register. */
export async function handleRegister(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const result = await register(req.body as Partial<RegisterRequest>);

  if (!result.ok) {
    sendError(res, result.status, result.code, result.message);
    return;
  }

  sendSuccess(res, result.data, 201);
}

/** POST /api/v1/auth/login — institutional login. */
export async function handleLogin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const result = await login(req.body as Partial<LoginRequest>);

  if (!result.ok) {
    sendError(res, result.status, result.code, result.message);
    return;
  }

  sendSuccess(res, result.data);
}
