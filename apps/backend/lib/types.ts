// ─────────────────────────────────────────────────────────────
// lib/types.ts — Tipos compartidos del backend TOTH
// ─────────────────────────────────────────────────────────────

/** Perfiles de usuario soportados por TOTH */
export type UserProfile = 'estudiante' | 'docente';

/** Tipos de entregable académico disponibles */
export type DocumentType =
  | 'ensayo'
  | 'informe_laboratorio'
  | 'guia_clase'
  | 'articulo'
  | 'resumen';

/** Fuentes de contexto que puede usar el RAG */
export type ContextSource = 'institutional' | 'web' | 'none';

// ─── Payload de entrada para /api/v1/generate ────────────────

export interface GenerateRequest {
  /** Mensaje o instrucción del usuario */
  prompt: string;
  /** Perfil activo: estudiante o docente */
  profile: UserProfile;
  /** Tipo de documento a generar */
  documentType: DocumentType;
  /** ID de usuario Firebase (para trazabilidad) */
  userId: string;
  /** Extensión aproximada en palabras (opcional) */
  wordCount?: number;
  /** Tema o asignatura (opcional, enriquece el contexto) */
  subject?: string;
}

// ─── Payload de entrada para /api/v1/vector-search ───────────

export interface VectorSearchRequest {
  /** Texto de consulta para búsqueda semántica */
  query: string;
  /** Número máximo de resultados (default: 5) */
  topK?: number;
}

// ─── Resultado individual de búsqueda vectorial ───────────────

export interface VectorSearchResult {
  /** ID del chunk en Supabase */
  id: string;
  /** Contenido del fragmento documental */
  content: string;
  /** Metadatos del documento fuente */
  metadata: {
    source: string;
    document_type: string;
    created_at?: string;
  };
  /** Puntuación de similitud coseno (0–1) */
  similarity: number;
}

// ─── Payload de registro de usuario ──────────────────────────

export interface RegisterRequest {
  email: string;
  /** Debe ser @pascualbravo.edu.co */
  password: string;
  displayName: string;
  profile: UserProfile;
}

// ─── Payload de login ─────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Respuesta de generación ──────────────────────────────────

export interface GenerateResponse {
  /** Texto generado y sanitizado */
  text: string;
  /** Fuentes que contribuyeron a la respuesta */
  sources_used: ContextSource[];
  /** Metadatos de trazabilidad */
  metadata: {
    model: string;
    profile: UserProfile;
    documentType: DocumentType;
    regenerated: boolean;
    processingTimeMs: number;
  };
}
