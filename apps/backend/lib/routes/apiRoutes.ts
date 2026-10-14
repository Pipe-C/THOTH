// ─────────────────────────────────────────────────────────────
// lib/routes/apiRoutes.ts — Registro de rutas de la API v1
// ─────────────────────────────────────────────────────────────
// Fuente única de verdad del mapa de endpoints. Vercel enruta por
// archivo (ver apps/backend/vercel.json), pero este registro documenta
// y valida la correspondencia ruta ↔ método ↔ controlador.
// ─────────────────────────────────────────────────────────────

export type HttpMethod = 'GET' | 'POST';

export interface ApiRouteDefinition {
  /** Ruta pública. */
  path: string;
  /** Método HTTP admitido. */
  method: HttpMethod;
  /** Archivo serverless que actúa como entrada. */
  entry: string;
  /** Controlador asociado. */
  controller: string;
  /** Breve descripción del endpoint. */
  description: string;
}

export const API_ROUTES: ApiRouteDefinition[] = [
  {
    path: '/api/v1/health',
    method: 'GET',
    entry: 'api/v1/health.ts',
    controller: 'controllers/healthController.ts',
    description: 'Estado de los servicios externos (Supabase, Groq).',
  },
  {
    path: '/api/v1/auth/register',
    method: 'POST',
    entry: 'api/v1/auth/register.ts',
    controller: 'controllers/authController.ts',
    description: 'Registro de usuario institucional.',
  },
  {
    path: '/api/v1/auth/login',
    method: 'POST',
    entry: 'api/v1/auth/login.ts',
    controller: 'controllers/authController.ts',
    description: 'Inicio de sesión institucional.',
  },
  {
    path: '/api/v1/vector-search',
    method: 'POST',
    entry: 'api/v1/vector-search.ts',
    controller: 'controllers/vectorSearchController.ts',
    description: 'Búsqueda semántica sobre el fondo institucional.',
  },
  {
    path: '/api/v1/generate',
    method: 'POST',
    entry: 'api/v1/generate.ts',
    controller: 'controllers/generateController.ts',
    description: 'Orquestador RAG híbrido + generación con anti-cliché.',
  },
];

/** Busca la definición de una ruta por su path. */
export function findRoute(path: string): ApiRouteDefinition | undefined {
  return API_ROUTES.find((route) => route.path === path);
}
