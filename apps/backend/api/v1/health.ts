// ─────────────────────────────────────────────────────────────
// api/v1/health.ts — Endpoint 1: Health Check
// GET /api/v1/health
// ─────────────────────────────────────────────────────────────
// Verifica el estado de todos los servicios externos (Supabase,
// Gemini) y devuelve un resumen de salud del sistema.
// No requiere autenticación.
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendSuccess, sendError, requireMethod, ErrorCode } from '../../lib/response.js';
import { pingSupabase } from '../../lib/supabase.js';
import { pingGemini } from '../../lib/gemini.js';

// ─── Handler ──────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!requireMethod(req, res, 'GET')) return;

  try {
    const startTime = Date.now();

    // Verificar servicios en paralelo para minimizar latencia
    const [supabaseOk, geminiOk] = await Promise.allSettled([
      pingSupabase(),
      pingGemini(),
    ]);

    const services = {
      supabase: supabaseOk.status === 'fulfilled' ? supabaseOk.value : false,
      gemini: geminiOk.status === 'fulfilled' ? geminiOk.value : false,
    };

    const allHealthy = Object.values(services).every(Boolean);
    const latencyMs = Date.now() - startTime;

    sendSuccess(
      res,
      {
        status: allHealthy ? 'healthy' : 'degraded',
        version: 'v1',
        services,
        latencyMs,
        environment: process.env.NODE_ENV ?? 'development',
      },
      allHealthy ? 200 : 503,
    );
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
