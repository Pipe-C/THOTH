// ─────────────────────────────────────────────────────────────
// lib/supabase.ts — Cliente Supabase (pgvector) para TOTH
// ─────────────────────────────────────────────────────────────
// Responsabilidad: inicializar el cliente Supabase y exponer
// la función de búsqueda vectorial por similitud coseno sobre
// el fondo documental institucional del Pascual Bravo.
// ─────────────────────────────────────────────────────────────

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VectorSearchResult } from './types.js';

// ─── Configuración ────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * Umbral mínimo de similitud coseno (0–1) para considerar un chunk
 * como relevante. Por debajo de este valor se activa el fallback web.
 */
export const SIMILARITY_THRESHOLD = parseFloat(
  process.env.SIMILARITY_THRESHOLD ?? '0.75',
);

/** Nombre de la tabla donde viven los embeddings institucionales */
const EMBEDDINGS_TABLE = 'document_chunks';

/** Nombre de la función RPC de Supabase para búsqueda por similitud */
const MATCH_FUNCTION = 'match_document_chunks';

// ─── Singleton del cliente ────────────────────────────────────

let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error(
        '[Supabase] SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidas en .env',
      );
    }
    _supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _supabase;
}

// ─── Función principal: búsqueda vectorial ───────────────────

/**
 * Genera el embedding de `query` y realiza una búsqueda por similitud
 * coseno contra el fondo documental institucional.
 *
 * @param query   Texto de la consulta del usuario.
 * @param topK    Número máximo de chunks a recuperar (default: 5).
 * @returns       Lista de resultados ordenados por similitud descendente.
 */
export async function searchDocuments(
  query: string,
  topK = 5,
): Promise<VectorSearchResult[]> {
  const supabase = getSupabaseClient();

  // 1. Generar embedding de la consulta usando Supabase Edge Function
  //    (la función `embed` de Supabase usa el mismo modelo de embeddings
  //    que se usó al indexar los documentos, garantizando compatibilidad).
  const { data: embeddingData, error: embeddingError } =
    await supabase.functions.invoke<{ embedding: number[] }>('embed', {
      body: { input: query },
    });

  if (embeddingError || !embeddingData?.embedding) {
    throw new Error(
      `[Supabase] Error generando embedding: ${embeddingError?.message ?? 'respuesta vacía'}`,
    );
  }

  // 2. Búsqueda por similitud coseno vía función RPC
  const { data: chunks, error: searchError } = await supabase.rpc(
    MATCH_FUNCTION,
    {
      query_embedding: embeddingData.embedding,
      match_threshold: SIMILARITY_THRESHOLD,
      match_count: topK,
    },
  );

  if (searchError) {
    throw new Error(
      `[Supabase] Error en búsqueda vectorial: ${searchError.message}`,
    );
  }

  // 3. Mapear al tipo interno
  return (chunks ?? []).map(
    (chunk: {
      id: string;
      content: string;
      metadata: Record<string, string>;
      similarity: number;
    }): VectorSearchResult => ({
      id: chunk.id,
      content: chunk.content,
      metadata: {
        source: chunk.metadata?.source ?? 'unknown',
        document_type: chunk.metadata?.document_type ?? 'unknown',
        created_at: chunk.metadata?.created_at,
      },
      similarity: chunk.similarity,
    }),
  );
}

// ─── Utilidad: verificar conexión ────────────────────────────

/**
 * Verifica que Supabase sea accesible. Se usa en el health check.
 * No hace ninguna query costosa; solo chequea la tabla de chunks.
 */
export async function pingSupabase(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(EMBEDDINGS_TABLE)
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}
