// ─────────────────────────────────────────────────────────────
// api/v1/vector-search.ts — Endpoint 4: RAG Vectorial search
// POST /api/v1/vector-search
// ─────────────────────────────────────────────────────────────
// Makes a semantic search (cosen similarity) based on
// documented institutional sources of Pascual Bravo stated on
// supabase pgvector.
// Principal use: internal consult by generate,ts, but
// exposed as an independent endpoint for depuration and show
// mobile client "consulted sources".

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

// ─── Limits ──────────────────────────────────────────────────

const MAX_TOP_K = 20;
const DEFAULT_TOP_K = 5;

// ─── Handler ──────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!requireMethod(req, res, 'POST')) return;

  const body = req.body as Partial<VectorSearchRequest>;

  // 1. Validate required camp
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

  // 2. Validate empty query
  if (!query.trim()) {
    sendError(
      res,
      400,
      ErrorCode.VALIDATION_ERROR,
      'El campo "query" no puede estar vacío.',
    );
    return;
  }

  // 3. Validate topK
  const topK = rawTopK !== undefined
    ? Math.min(Math.max(1, rawTopK), MAX_TOP_K)
    : DEFAULT_TOP_K;

  // 4. Execute vectorial search
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
