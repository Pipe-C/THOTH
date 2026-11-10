/**
 * TOTH Type Definitions
 */

export type UserProfileRole = 'estudiante' | 'docente';

export interface User {
  uid: string;
  email: string; // Restricted to @pascualbravo.edu.co
  displayName: string;
  photoURL?: string;
  activeProfile: UserProfileRole;
}

// ─── Document types ───────────────────────────────────────────

/**
 * UI-level document type. Includes aliases used only in the mobile
 * layer for labelling / filtering purposes.
 * - 'consulta_libre'       → maps to 'resumen' when calling the API
 * - 'articulo_investigacion' → maps to 'articulo' when calling the API
 */
export type DocumentType =
  | 'ensayo'
  | 'guia_clase'
  | 'informe_laboratorio'
  | 'articulo_investigacion'
  | 'consulta_libre';

/**
 * Backend-accepted document types (mirrors backend lib/types.ts
 * DocumentType). Use this when building payloads for /api/v1/generate.
 */
export type ApiDocumentType =
  | 'ensayo'
  | 'guia_clase'
  | 'informe_laboratorio'
  | 'articulo'
  | 'resumen';

/**
 * Converts a UI DocumentType to the ApiDocumentType the backend accepts.
 * UI-only aliases: 'consulta_libre' → 'resumen', 'articulo_investigacion' → 'articulo'.
 */
export function toApiDocumentType(type: DocumentType): ApiDocumentType {
  switch (type) {
    case 'consulta_libre':
      return 'resumen';
    case 'articulo_investigacion':
      return 'articulo';
    default:
      return type;
  }
}

// ─── Source / grounding ────────────────────────────────────────

export type SourceType = 'institutional' | 'web' | 'none';

// ─── API contracts (mirrors backend lib/types.ts) ─────────────

/** Payload sent to POST /api/v1/generate */
export interface GenerateApiRequest {
  prompt: string;
  profile: UserProfileRole;
  documentType: ApiDocumentType;
  userId: string;
  wordCount?: number;
  subject?: string;
}

/** Successful response from POST /api/v1/generate */
export interface GenerateApiResponse {
  text: string;
  sources_used: SourceType[];
  metadata: {
    model: string;
    profile: UserProfileRole;
    documentType: ApiDocumentType;
    regenerated: boolean;
    processingTimeMs: number;
    userId: string;
  };
}

// ─── Legacy UI interfaces ─────────────────────────────────────

export interface PromptPayload {
  prompt: string;
  profile: UserProfileRole;
  documentType: DocumentType;
  antiClicheEnabled: boolean;
  academicParams?: {
    course?: string;
    targetWords?: number;
    depthLevel?: string;
    sections?: string[];
  };
}

export interface GroundingSource {
  title: string;
  uri?: string;
  type: SourceType;
  similarityScore?: number;
  snippet?: string;
}

export interface GenerationResponse {
  id: string;
  content: string;
  profileUsed: UserProfileRole;
  sourcesUsed: SourceType[];
  groundingSources: GroundingSource[];
  antiClicheApplied: boolean;
  tokensUsed?: number;
  createdAt: string;
}

export interface DocumentHistoryItem {
  id: string;
  title: string;
  preview: string;
  documentType: DocumentType;
  profile: UserProfileRole;
  sourcesUsed: SourceType[];
  createdAt: number;
}

export * from './navigation';