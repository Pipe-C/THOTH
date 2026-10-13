// ─────────────────────────────────────────────────────────────
// api/v1/health.ts — Endpoint 1: Health Check
// GET /api/v1/health
// ─────────────────────────────────────────────────────────────
// Verify state of all external services (Supabase,
// Gemini) and returns a system health report.
// Does not require authentication.
// ─────────────────────────────────────────────────────────────


import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  sendSuccess,
  sendError,
  requireMethod,
  ErrorCode,
} from '../../lib/response.js';
import { pingSupabase } from '../../lib/supabase.js';
import { pingGemini } from '../../lib/gemini.js';

const TIMEOUT_MS = 8_000;

async function checkService(
  name: string,
  ping: () => Promise<boolean>,
): Promise<boolean> {
  const start = Date.now();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const result = await Promise.race([
      ping(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`Timeout después de ${TIMEOUT_MS} ms`)),
          TIMEOUT_MS,
        );
      }),
    ]);

    console.log(`[Health] ${name}: ${Date.now() - start} ms`);

    return result;
  } catch (error) {
    console.error(
      `[Health] ${name}: ${Date.now() - start} ms`,
      error instanceof Error ? error.message : String(error),
    );

    return false;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!requireMethod(req, res, 'GET')) return;

  const startTime = Date.now();

  try {
    const [supabase, gemini] = await Promise.all([
      checkService('Supabase', pingSupabase),
      checkService('Gemini', pingGemini),
    ]);

    const services = { supabase, gemini };
    const allHealthy = Object.values(services).every(Boolean);

    sendSuccess(
      res,
      {
        status: allHealthy ? 'healthy' : 'degraded',
        version: 'v1',
        services,
        latencyMs: Date.now() - startTime,
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
