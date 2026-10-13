// ─────────────────────────────────────────────────────────────
// lib/supabase.ts — Supabase client (pgvector) for THOTH
// ─────────────────────────────────────────────────────────────
// Responsibility: initialize supabase client and expose
// Vectorial search function by cosen similarity based on
// documental institutional documentation of Pascual Bravo.
// ─────────────────────────────────────────────────────────────

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VectorSearchResult } from './types.js';

// ─── Configuration ────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * Minimal threshold cosen similarity (0–1) to be guessed a relevant
 * chunk. Below this value the fallback web is activated.
 */
export const SIMILARITY_THRESHOLD = Number.parseFloat(
  process.env.SIMILARITY_THRESHOLD ?? '0.75',
);

/** Name of the table where institutional embeddings are */
const EMBEDDINGS_TABLE = 'document_chunks';

/** Name of supabase RPC function for similarity function */
const MATCH_FUNCTION = 'match_document_chunks';

// ─── Client singleton ────────────────────────────────────

let _supabase: SupabaseClient | null = null;

export function resetSupabaseClient(): void {
  _supabase = null;
}

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;
    if (!url || !key) {
      throw new Error(
        '[Supabase] SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidas en .env',
      );
    }
    _supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _supabase;
}

// ─── Principal function: vectorial search ───────────────────

/**
 * Generates `query` embedding and makes cosen similarity search
 * against institutional documentation.
 *
 * @param query   Text of the user consultation.
 * @param topK    Max number of chunks to recover (default: 5).
 * @returns       List of results by descending similarity order.
 */
export async function searchDocuments(
  query: string,
  topK = 5,
): Promise<VectorSearchResult[]> {
  const supabase = getSupabaseClient();

  // 1. Generate embedding using Supabase Edge Function
  //    (the `embed` function of Supabase uses the same embedding model
  //    to index documents, guaranteeing compatibility).



  const { data: embeddingData, error: embeddingError } =
    await supabase.functions.invoke<{ embedding: number[] }>('embed', {
      body: { input: query },
    });

  if (embeddingError || !embeddingData?.embedding) {
    throw new Error(
      `[Supabase] Error generando embedding: ${embeddingError?.message ?? 'respuesta vacía'}`,
    );
  }

  // 2. Similarity cosen search by RPC function
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

  // 3. Internal type mapping
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

// ─── Utility: Verify connection ────────────────────────────

/**
 * Verify that supabase is accessibility. Use in health check.
 * Does not makes a expensive query; Only checks chunks table.
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
