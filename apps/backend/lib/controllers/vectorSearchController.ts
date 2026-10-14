// ─────────────────────────────────────────────────────────────
// lib/controllers/vectorSearchController.ts — Controlador búsqueda vectorial
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DEFAULT_TOP_K, MAX_TOP_K } from '../config.js';
import { ErrorCode, requireFields, sendError, sendSuccess } from '../response.js';
import { SIMILARITY_THRESHOLD } from '../repositories/documentRepository.js';
import { performVectorSearch } from '../services/vectorSearchService.js';
import type { VectorSearchRequest } from '../types.js';

/** POST /api/v1/vector-search — búsqueda semántica institucional. */
export async function handleVectorSearch(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const body = req.body as Partial<VectorSearchRequest>;

  // 1. Validar campo obligatorio.
  const missing = requireFields(body as VectorSearchRequest, ['query']);
  if (missing.length > 0) {
    sendError(res, 400, ErrorCode.MISSING_FIELDS, 'El campo "query" es requerido.');
    return;
  }

  const { query, topK: rawTopK } = body as VectorSearchRequest;

  // 2. Validar que la consulta no venga vacía.
  if (!query.trim()) {
    sendError(
      res,
      400,
      ErrorCode.VALIDATION_ERROR,
      'El campo "query" no puede estar vacío.',
    );
    return;
  }

  // 3. Normalizar topK dentro de los límites permitidos.
  const topK =
    rawTopK !== undefined
      ? Math.min(Math.max(1, rawTopK), MAX_TOP_K)
      : DEFAULT_TOP_K;

  // 4. Ejecutar la búsqueda semántica.
  try {
    const startTime = Date.now();
    const results = await performVectorSearch(query.trim(), topK);

    sendSuccess(res, {
      results,
      meta: {
        query: query.trim(),
        topK,
        totalFound: results.length,
        similarityThreshold: SIMILARITY_THRESHOLD,
        latencyMs: Date.now() - startTime,
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
