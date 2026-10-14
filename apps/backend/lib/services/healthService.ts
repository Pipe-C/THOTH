// ─────────────────────────────────────────────────────────────
// lib/services/healthService.ts — Estado de los servicios externos
// ─────────────────────────────────────────────────────────────
// Consulta en paralelo Supabase y Groq con timeout, y arma el
// reporte de salud del sistema consumido por el health-check.
// ─────────────────────────────────────────────────────────────

import { API_VERSION } from '../config.js';
import { isReachable as isDocumentStoreReachable } from '../repositories/documentRepository.js';
import { isReachable as isLlmReachable } from '../repositories/llmRepository.js';

const TIMEOUT_MS = 8_000;

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  version: typeof API_VERSION;
  services: { supabase: boolean; groq: boolean };
  latencyMs: number;
  environment: string;
}

/** Ejecuta un ping con límite de tiempo para no colgar el health-check. */
async function withTimeout(
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

/** Arma el reporte de salud agregando Supabase y Groq. */
export async function getSystemHealth(): Promise<SystemHealth> {
  const startTime = Date.now();

  const [supabase, groq] = await Promise.all([
    withTimeout('Supabase', isDocumentStoreReachable),
    withTimeout('Groq', isLlmReachable),
  ]);

  const services = { supabase, groq };
  const allHealthy = Object.values(services).every(Boolean);

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    version: API_VERSION,
    services,
    latencyMs: Date.now() - startTime,
    environment: process.env.NODE_ENV ?? 'development',
  };
}
