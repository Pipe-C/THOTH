// ─────────────────────────────────────────────────────────────
// api/v1/vector-search.ts — Endpoint 4: Búsqueda Vectorial RAG
// POST /api/v1/vector-search
// ─────────────────────────────────────────────────────────────
// Realiza una búsqueda semántica (similitud coseno) sobre el
// fondo documental institucional del Pascual Bravo almacenado
// en Supabase pgvector.
//
// Uso principal: consultado internamente por generate.ts, pero
// expuesto como endpoint independiente para depuración y para
// que el cliente mobile pueda mostrar "fuentes consultadas".
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  sendSuccess,
  sendError,
  requireMethod,
  requireFields,
  ErrorCode,
} from '../../lib/response.js';
import { searchDocuments, SIMILARITY_THRESHOLD } from '../../lib/supabase.js';
import type { VectorSearchRequest } from '../../lib/types.js';

// ─── Límites ──────────────────────────────────────────────────

const MAX_TOP_K = 20;
const DEFAULT_TOP_K = 5;

// ─── Handler ──────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!requireMethod(req, res, 'POST')) return;

  const body = req.body as Partial<VectorSearchRequest>;

  // 1. Validar campo requerido
  const missing = requireFields(body as VectorSearchRequest, ['query']);
  if (missing.length > 0) {
    sendError(
      res,
      400,
      ErrorCode.MISSING_FIELDS,
      'El campo "query" es requerido.',
    );
    return;
  }

  const { query, topK: rawTopK } = body as VectorSearchRequest;

  // 2. Validar query no vacía
  if (!query.trim()) {
    sendError(
      res,
      400,
      ErrorCode.VALIDATION_ERROR,
      'El campo "query" no puede estar vacío.',
    );
    return;
  }

  // 3. Validar topK
  const topK = rawTopK !== undefined
    ? Math.min(Math.max(1, rawTopK), MAX_TOP_K)
    : DEFAULT_TOP_K;

  // 4. Ejecutar búsqueda vectorial
  try {
    const startTime = Date.now();
    const results = await searchDocuments(query.trim(), topK);
    const latencyMs = Date.now() - startTime;

    sendSuccess(res, {
      results,
      meta: {
        query: query.trim(),
        topK,
        totalFound: results.length,
        similarityThreshold: SIMILARITY_THRESHOLD,
        latencyMs,
      },
    });
  } catch (err) {
    sendError(
      res,
      500,
      ErrorCode.DB_ERROR,
      'Error al realizar la búsqueda en la base de datos vectorial.',
      err instanceof Error ? err.message : String(err),
    );
  }
}
