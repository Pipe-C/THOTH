// ─────────────────────────────────────────────────────────────
// lib/config.ts — Constantes de configuración de TOTH
// ─────────────────────────────────────────────────────────────
// Fuente única de verdad para valores compartidos por rutas,
// controladores, servicios y repositorios. Evita "magic strings"
// repetidos por el código (ej. el id del modelo LLM o los límites
// de paginación de la búsqueda vectorial).
// ─────────────────────────────────────────────────────────────

/** Versión de la API embebida en cada respuesta. */
export const API_VERSION = 'v1' as const;

/** Id del modelo Groq (OpenAI GPT-OSS) usado por la capa LLM. */
export const LLM_MODEL_ID = 'openai/gpt-oss-120b';

/** Número por defecto de fragmentos institucionales recuperados por el RAG. */
export const DEFAULT_TOP_K = 5;

/** Tope máximo para el parámetro `topK` del endpoint de búsqueda vectorial. */
export const MAX_TOP_K = 20;

/** Intentos máximos de regeneración del filtro anti-cliché. */
export const MAX_REGENERATION_ATTEMPTS = 2;

/** Dominio de correo institucional permitido en registro/login. */
export const ALLOWED_DOMAIN = 'pascualbravo.edu.co';

/** Longitud mínima aceptada para la contraseña. */
export const MIN_PASSWORD_LENGTH = 8;
