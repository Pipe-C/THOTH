// -----------------------------------------------------------------
// src/services/apiClient.ts — HTTP client → Vercel backend
// -----------------------------------------------------------------
// Thin wrapper over fetch() that targets the TOTH backend
// deployed on Vercel. All calls go through here so the base
// URL and error-handling logic live in one place.
//
// Usage (Phase 4 integration):
//   import { apiClient } from '../services/apiClient';
//   const result = await apiClient.generate({ ... });
// -----------------------------------------------------------------

import type {
  GenerateApiRequest,
  GenerateApiResponse,
} from '../types';

// ─── Base URL ─────────────────────────────────────────────────

/**
 * Production backend URL.
 * For local development point this to http://10.0.2.2:3000
 * (the Android emulator loopback alias for the host machine).
 */
const BACKEND_URL = 'https://thoth-backend.vercel.app';

// ─── Error type ───────────────────────────────────────────────

export interface TothApiError {
  /** HTTP status code (0 = network failure) */
  status: number;
  /** Machine-readable error code from the backend */
  code: string;
  /** Human-readable error message */
  message: string;
}

// ─── Internal helpers ─────────────────────────────────────────

/**
 * Generic fetch wrapper. Parses the backend standard envelope
 * ({ success: true, data } | { success: false, error }) and
 * throws a TothApiError on any failure.
 */
async function request<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw {
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor. Verifica tu conexion.',
    } as TothApiError;
  }

  let body: Record<string, unknown>;
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    throw {
      status: response.status,
      code: 'PARSE_ERROR',
      message: 'La respuesta del servidor no tiene un formato valido.',
    } as TothApiError;
  }

  if (!response.ok || body['success'] === false) {
    const err = (body['error'] as Record<string, string> | undefined) ?? {};
    throw {
      status: response.status,
      code: err['code'] ?? 'API_ERROR',
      message: err['message'] ?? 'Error desconocido en el servidor.',
    } as TothApiError;
  }

  return body['data'] as T;
}

// ─── Vector search result (mirrors backend types) ─────────────

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata: {
    source: string;
    document_type: string;
    created_at?: string;
  };
  similarity: number;
}

// ─── Public API ───────────────────────────────────────────────

export const apiClient = {
  /**
   * POST /api/v1/generate
   * Sends a generation request through the hybrid RAG + Groq pipeline.
   * The backend applies the anti-cliche filter before returning.
   */
  async generate(payload: GenerateApiRequest): Promise<GenerateApiResponse> {
    return request<GenerateApiResponse>('/api/v1/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /api/v1/vector-search
   * Runs a cosine-similarity search against the institutional
   * document store (Supabase pgvector).
   */
  async vectorSearch(
    query: string,
    topK = 5,
  ): Promise<VectorSearchResult[]> {
    return request<VectorSearchResult[]>('/api/v1/vector-search', {
      method: 'POST',
      body: JSON.stringify({ query, topK }),
    });
  },
};

/**
 * Type guard — returns true when err is a TothApiError.
 * Useful for narrowing catch-blocks in screens.
 *
 * Example:
 *   try { ... }
 *   catch (err) {
 *     if (isTothApiError(err)) setError(err.message);
 *   }
 */
export function isTothApiError(err: unknown): err is TothApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err
  );
}
