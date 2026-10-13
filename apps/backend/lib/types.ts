// ─────────────────────────────────────────────────────────────
// lib/types.ts — Shared types from THOTH backend
// ─────────────────────────────────────────────────────────────

/** Supported user profiles in THOTH */
export type UserProfile = 'estudiante' | 'docente';

/** Types of available academic releases */
export type DocumentType =
  | 'ensayo'
  | 'informe_laboratorio'
  | 'guia_clase'
  | 'articulo'
  | 'resumen';

/** Possible context sources that the RAG can use */
export type ContextSource = 'institutional' | 'web' | 'none';

// ─── Payload entry for /api/v1/generate ────────────────

export interface GenerateRequest {
  /** User message or instruction */
  prompt: string;
  /** Active profile: Student or teacher*/
  profile: UserProfile;
  /** Document type to generate */
  documentType: DocumentType;
  /** Firebase User ID (Traceability motives) */
  userId: string;
  /** Approximated extension in words (optional) */
  wordCount?: number;
  /** Tema or topic (optional, flourish the context) */
  subject?: string;
}

// ─── Payload entry for /api/v1/vector-search ───────────

export interface VectorSearchRequest {
  /** Consult text for semantic search */
  query: string;
  /** Max number of results (default: 5) */
  topK?: number;
}

// ─── Individual result individual of vectorial search ───────────────

export interface VectorSearchResult {
  /** Chunk ID of Supabase */
  id: string;
  /** Content of documental fragment */
  content: string;
  /** Metadata of source document */
  metadata: {
    source: string;
    document_type: string;
    created_at?: string;
  };
  /** Score of cosen similarity (0–1) */
  similarity: number;
}

// ─── Payload user register ──────────────────────────

export interface RegisterRequest {
  email: string;
  /** Has to be @pascualbravo.edu.co */
  password: string;
  displayName: string;
  profile: UserProfile;
}

// ─── Payload login ─────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Generation response ──────────────────────────────────

export interface GenerateResponse {
  /** Generated text sanitized */
  text: string;
  /** Sources that contributed to the response */
  sources_used: ContextSource[];
  /** Metadata of traceability */
  metadata: {
    model: string;
    profile: UserProfile;
    documentType: DocumentType;
    regenerated: boolean;
    processingTimeMs: number;
    userId?: string;
  };
}
