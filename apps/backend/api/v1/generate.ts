// ─────────────────────────────────────────────────────────────
// api/v1/generate.ts — Endpoint 5: Orquestador RAG + Gemini
// POST /api/v1/generate
// ─────────────────────────────────────────────────────────────
// Flujo completo:
//  1. Valida el payload de entrada.
//  2. Busca contexto institucional en Supabase (vector search).
//  3. Si la similitud es baja o el tema requiere vigencia,
//     complementa con búsqueda web (Tavily — Fase 3 completa).
//  4. Invoca a Gemini con el contexto combinado y los prompts
//     definidos en COMPORTAMIENTO_DEL_ASISTENTE.md.
//  5. Aplica el filtro anti-cliché; regenera si hay muletillas.
//  6. Devuelve la respuesta sanitizada con metadata de fuentes.
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  sendSuccess,
  sendError,
  requireMethod,
  requireFields,
  ErrorCode,
} from '../../lib/response.js';
import { searchDocuments, SIMILARITY_THRESHOLD } from '../../lib/supabase.js';
import { generateContent } from '../../lib/gemini.js';
import { analyzeText, buildRegenerationPrompt } from '../../lib/antiClicheFilter.js';
import type { GenerateRequest, ContextSource } from '../../lib/types.js';

// ─── Constantes ───────────────────────────────────────────────

/** Máximo de intentos de regeneración por filtro anti-cliché */
const MAX_REGENERATION_ATTEMPTS = 2;

/** Número de chunks institucionales a recuperar por defecto */
const DEFAULT_TOP_K = 5;

// ─── Búsqueda web (Tavily) ────────────────────────────────────
// En Fase 3 completa: conectar con la API de Tavily.
// Por ahora, función stub que devuelve string vacío.
async function fetchWebContext(_query: string): Promise<string> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    // Sin API key: no hay contexto web disponible
    return '';
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tavilyKey}`,
      },
      body: JSON.stringify({
        query: _query,
        search_depth: 'basic',
        max_results: 3,
        include_answer: true,
      }),
    });

    if (!response.ok) return '';

    const data = (await response.json()) as {
      answer?: string;
      results?: Array<{ content: string; url: string }>;
    };

    const parts: string[] = [];
    if (data.answer) parts.push(data.answer);
    if (data.results) {
      parts.push(
        ...data.results.map((r) => `Fuente: ${r.url}\n${r.content}`),
      );
    }
    return parts.join('\n\n');
  } catch {
    return '';
  }
}

// ─── Tipos y validación auxiliar ──────────────────────────────

interface ValidationError {
  status: number;
  code: (typeof ErrorCode)[keyof typeof ErrorCode];
  message: string;
}

interface ValidationResult {
  error?: ValidationError;
  data?: GenerateRequest;
}

const VALID_DOC_TYPES = [
  'ensayo',
  'informe_laboratorio',
  'guia_clase',
  'articulo',
  'resumen',
];

function validateGeneratePayload(body: Partial<GenerateRequest>): ValidationResult {
  const missing = requireFields(body as GenerateRequest, [
    'prompt',
    'profile',
    'documentType',
    'userId',
  ]);

  if (missing.length > 0) {
    return {
      error: {
        status: 400,
        code: ErrorCode.MISSING_FIELDS,
        message: `Campos requeridos faltantes: ${missing.join(', ')}`,
      },
    };
  }

  const { profile, documentType } = body as GenerateRequest;

  if (!['estudiante', 'docente'].includes(profile)) {
    return {
      error: {
        status: 400,
        code: ErrorCode.VALIDATION_ERROR,
        message: `El campo "profile" debe ser "estudiante" o "docente". Recibido: "${profile}"`,
      },
    };
  }

  if (!VALID_DOC_TYPES.includes(documentType)) {
    return {
      error: {
        status: 400,
        code: ErrorCode.VALIDATION_ERROR,
        message: `El campo "documentType" debe ser uno de: ${VALID_DOC_TYPES.join(', ')}. Recibido: "${documentType}"`,
      },
    };
  }

  return { data: body as GenerateRequest };
}

// ─── Resolución de contexto híbrido ───────────────────────────

interface HybridContextResult {
  institutionalContext: string;
  webContext: string;
  sourcesUsed: ContextSource[];
}

function shouldFetchWebContext(prompt: string, hasHighQualityChunks: boolean): boolean {
  if (!hasHighQualityChunks) return true;
  const lower = prompt.toLowerCase();
  return lower.includes('actual') || lower.includes('reciente') || lower.includes('hoy');
}

async function resolveHybridContext(prompt: string): Promise<HybridContextResult> {
  let institutionalContext = '';
  const sourcesUsed: ContextSource[] = [];

  const vectorResults = await searchDocuments(prompt, DEFAULT_TOP_K);
  const highQualityChunks = vectorResults.filter(
    (r) => r.similarity >= SIMILARITY_THRESHOLD,
  );

  if (highQualityChunks.length > 0) {
    institutionalContext = highQualityChunks
      .map(
        (chunk, i) =>
          `[Fragmento ${i + 1} — ${chunk.metadata.source}]\n${chunk.content}`,
      )
      .join('\n\n');
    sourcesUsed.push('institutional');
  }

  let webContext = '';
  if (shouldFetchWebContext(prompt, highQualityChunks.length > 0)) {
    webContext = await fetchWebContext(prompt);
    if (webContext) sourcesUsed.push('web');
  }

  if (sourcesUsed.length === 0) {
    sourcesUsed.push('none');
  }

  return { institutionalContext, webContext, sourcesUsed };
}

// ─── Generación con filtro anti-cliché ────────────────────────

interface GenerationFilterResult {
  text: string;
  regenerated: boolean;
}

interface GenerateQualityParams {
  prompt: string;
  profile: GenerateRequest['profile'];
  documentType: GenerateRequest['documentType'];
  institutionalContext: string;
  webContext: string;
  wordCount?: number;
  subject?: string;
}

async function generateWithQualityFilter(
  params: GenerateQualityParams,
): Promise<GenerationFilterResult> {
  let generatedText = '';
  let regenerated = false;
  let currentPrompt = params.prompt;

  for (let attempt = 0; attempt <= MAX_REGENERATION_ATTEMPTS; attempt++) {
    const result = await generateContent({
      ...params,
      prompt: currentPrompt,
    });

    generatedText = result.text;
    const filterResult = analyzeText(generatedText);

    if (filterResult.passed) {
      break;
    }

    if (attempt < MAX_REGENERATION_ATTEMPTS) {
      currentPrompt = buildRegenerationPrompt(
        generatedText,
        filterResult.detected,
      );
      regenerated = true;
    }
  }

  return { text: generatedText, regenerated };
}

// ─── Manejo de errores de generación ──────────────────────────

function handleGenerateError(res: VercelResponse, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes('[Gemini]')) {
    sendError(
      res,
      502,
      ErrorCode.LLM_ERROR,
      'Error al comunicarse con el modelo de lenguaje.',
      message,
    );
    return;
  }

  if (message.includes('[Supabase]')) {
    sendError(
      res,
      502,
      ErrorCode.DB_ERROR,
      'Error al acceder a la base de datos vectorial.',
      message,
    );
    return;
  }

  sendError(
    res,
    500,
    ErrorCode.INTERNAL_ERROR,
    'Error interno del servidor al procesar la solicitud.',
    message,
  );
}

// ─── Handler ──────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!requireMethod(req, res, 'POST')) return;

  const validation = validateGeneratePayload(req.body as Partial<GenerateRequest>);
  if (validation.error) {
    sendError(
      res,
      validation.error.status,
      validation.error.code,
      validation.error.message,
    );
    return;
  }

  const { prompt, profile, documentType, userId, wordCount, subject } =
    validation.data!;

  const startTime = Date.now();

  try {
    const { institutionalContext, webContext, sourcesUsed } =
      await resolveHybridContext(prompt);

    const { text, regenerated } = await generateWithQualityFilter({
      prompt,
      profile,
      documentType,
      institutionalContext,
      webContext,
      wordCount,
      subject,
    });

    sendSuccess(res, {
      text,
      sources_used: sourcesUsed,
      metadata: {
        model: 'gemini-2.0-flash',
        profile,
        documentType,
        regenerated,
        processingTimeMs: Date.now() - startTime,
        userId,
      },
    });
  } catch (err) {
    handleGenerateError(res, err);
  }
}
