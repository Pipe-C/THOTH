// ─────────────────────────────────────────────────────────────
// lib/controllers/vectorSearchController.ts — Vectorial search controller
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DEFAULT_TOP_K, MAX_TOP_K } from '../config.js';
import { ErrorCode, requireFields, sendError, sendSuccess } from '../response.js';
import { SIMILARITY_THRESHOLD } from '../repositories/documentRepository.js';
import { performVectorSearch } from '../services/vectorSearchService.js';
import type { VectorSearchRequest } from '../types.js';

/** POST /api/v1/vector-search — institutional semantic search . */
export async function handleVectorSearch(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const body = req.body as Partial<VectorSearchRequest>;

  // 1. Validates required camps.
  const missing = requireFields(body as VectorSearchRequest, ['query']);
  if (missing.length > 0) {
    sendError(res, 400, ErrorCode.MISSING_FIELDS, 'El campo "query" es requerido.');
    return;
  }

  const { query, topK: rawTopK } = body as VectorSearchRequest;

  // 2. Validates that consults does not come empty.
  if (!query.trim()) {
    sendError(
      res,
      400,
      ErrorCode.VALIDATION_ERROR,
      'El campo "query" no puede estar vacío.',
    );
    return;
  }

  // 3. Normalizes topK within stated limits.
  const topK =
    rawTopK !== undefined
      ? Math.min(Math.max(1, rawTopK), MAX_TOP_K)
      : DEFAULT_TOP_K;

  // 4. Executes semantic search.
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
