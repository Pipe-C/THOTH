/**
 * TOTH Type Definitions
 */

export type UserProfileRole = 'estudiante' | 'docente';

export interface User {
  uid: string;
  email: string; // Restringido a @pascualbravo.edu.co
  displayName: string;
  photoURL?: string;
  activeProfile: UserProfileRole;
}

export type DocumentType = 
  | 'ensayo' 
  | 'guia_clase' 
  | 'informe_laboratorio' 
  | 'articulo_investigacion' 
  | 'consulta_libre';

export type SourceType = 'institutional' | 'web';

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
