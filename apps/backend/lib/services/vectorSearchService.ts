// ─────────────────────────────────────────────────────────────
// lib/services/vectorSearchService.ts — Búsqueda vectorial
// ─────────────────────────────────────────────────────────────
// Orquesta la búsqueda semántica sobre el fondo institucional.
// ─────────────────────────────────────────────────────────────

import { findSimilarChunks } from '../repositories/documentRepository.js';
import type { VectorSearchResult } from '../types.js';

/**
 * Realiza la búsqueda por similitud coseno y devuelve los fragmentos.
 *
 * @param query Texto ya normalizado por el controlador.
 * @param topK  Número máximo de resultados.
 */
export async function performVectorSearch(
  query: string,
  topK: number,
): Promise<VectorSearchResult[]> {
  return findSimilarChunks(query, topK);
}
