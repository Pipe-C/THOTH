// ─────────────────────────────────────────────────────────────
// lib/controllers/healthController.ts — health-check controller
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ErrorCode, sendError, sendSuccess } from '../response.js';
import { getSystemHealth } from '../services/healthService.js';

/** GET /api/v1/health — reports state of Supabase and Groq. */
export async function handleHealth(
  _req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const health = await getSystemHealth();
    sendSuccess(res, health, health.status === 'healthy' ? 200 : 503);
  } catch (err) {
    sendError(
      res,
      500,
      ErrorCode.INTERNAL_ERROR,
      'Error al verificar el estado del sistema.',
      err instanceof Error ? err.message : String(err),
    );
  }
}
