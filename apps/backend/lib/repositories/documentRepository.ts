// ─────────────────────────────────────────────────────────────
// lib/repositories/documentRepository.ts — Acceso al fondo documental
// ─────────────────────────────────────────────────────────────
// Capa de repositorio: aísla a los servicios de los detalles del
// cliente de Supabase (pgvector). Si más adelante cambia el motor
// vectorial, solo se reescribe este archivo.
// ─────────────────────────────────────────────────────────────

import {
  searchDocuments,
  pingSupabase,
  SIMILARITY_THRESHOLD,
} from '../supabase.js';
import type { VectorSearchResult } from '../types.js';

/** Re-exporta el umbral de similitud para no filtrar el SDK a los servicios. */
export { SIMILARITY_THRESHOLD };

/**
 * Recupera los fragmentos institucionales más similares a `query`.
 *
 * @param query Texto de la consulta del usuario.
 * @param topK  Número máximo de fragmentos a recuperar.
 */
export async function findSimilarChunks(
  query: string,
  topK: number,
): Promise<VectorSearchResult[]> {
  return searchDocuments(query, topK);
}

/** Verifica que la base vectorial esté accesible (usado en health-check). */
export async function isReachable(): Promise<boolean> {
  return pingSupabase();
}
