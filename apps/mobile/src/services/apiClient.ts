// -----------------------------------------------------------------
// src/services/apiClient.ts - HTTP client to the TOTH backend
// -----------------------------------------------------------------
// Thin wrapper over fetch() that targets the TOTH backend deployed
// on Vercel. All calls go through here so the base URL, timeouts
// and error handling live in one place.
// -----------------------------------------------------------------

import type {
  GenerateApiRequest,
  GenerateApiResponse,
} from '../types';

declare const process: {
  env: Record<string, string | undefined>;
};

const DEFAULT_BACKEND_URL = 'https://thoth-backend.vercel.app';
const REQUEST_TIMEOUT_MS = 45_000;

function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') {
    end -= 1;
  }
  return value.slice(0, end);
}

const BACKEND_URL = trimTrailingSlashes(
  process.env.API_BASE_URL || DEFAULT_BACKEND_URL,
);

export interface TothApiError {
  status: number;
  code: string;
  message: string;
}

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

export interface VectorSearchResponse {
  results: VectorSearchResult[];
  meta: {
    query: string;
    topK: number;
    totalFound: number;
    similarityThreshold: number;
    latencyMs: number;
  };
}

function toApiError(
  status: number,
  code: string,
  message: string,
): TothApiError {
  return { status, code, message };
}

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

async function request<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw toApiError(
      0,
      aborted ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
      aborted
        ? 'El servidor tardó demasiado en responder. Intenta de nuevo.'
        : 'No se pudo conectar con el servidor. Verifica tu conexión.',
    );
  } finally {
    clearTimeout(timer);
  }

  let body: Record<string, unknown>;
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    throw toApiError(
      response.status,
      'PARSE_ERROR',
      'La respuesta del servidor no tiene un formato válido.',
    );
  }

  if (!response.ok || body['ok'] === false) {
    const err = (body['error'] as Record<string, unknown> | undefined) ?? {};
    throw toApiError(
      response.status,
      typeof err['code'] === 'string' ? err['code'] : 'API_ERROR',
      typeof err['message'] === 'string'
        ? err['message']
        : 'Error desconocido en el servidor.',
    );
  }

  return body['data'] as T;
}

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
  ): Promise<VectorSearchResponse> {
    return request<VectorSearchResponse>('/api/v1/vector-search', {
      method: 'POST',
      body: JSON.stringify({ query, topK }),
    });
  },
};

export function isTothApiError(err: unknown): err is TothApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err
  );
}

export { BACKEND_URL };
