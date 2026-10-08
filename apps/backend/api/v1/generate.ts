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

// ─── Handler ──────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!requireMethod(req, res, 'POST')) return;

  const body = req.body as Partial<GenerateRequest>;

  // 1. Validar campos requeridos
  const missing = requireFields(body as GenerateRequest, [
    'prompt',
    'profile',
    'documentType',
    'userId',
  ]);

  if (missing.length > 0) {
    sendError(
      res,
      400,
      ErrorCode.MISSING_FIELDS,
      `Campos requeridos faltantes: ${missing.join(', ')}`,
    );
    return;
  }

  const { prompt, profile, documentType, userId, wordCount, subject } =
    body as GenerateRequest;

  // 2. Validar enum de perfil
  if (!['estudiante', 'docente'].includes(profile)) {
    sendError(
      res,
      400,
      ErrorCode.VALIDATION_ERROR,
      `El campo "profile" debe ser "estudiante" o "docente". Recibido: "${profile}"`,
    );
    return;
  }

  // 3. Validar enum de tipo de documento
  const validDocTypes = [
    'ensayo',
    'informe_laboratorio',
    'guia_clase',
    'articulo',
    'resumen',
  ];
  if (!validDocTypes.includes(documentType)) {
    sendError(
      res,
      400,
      ErrorCode.VALIDATION_ERROR,
      `El campo "documentType" debe ser uno de: ${validDocTypes.join(', ')}. Recibido: "${documentType}"`,
    );
    return;
  }

  const startTime = Date.now();

  try {
    // ── PASO 1: Búsqueda vectorial institucional ──────────────
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

    // ── PASO 2: Contexto web (fallback o complemento) ─────────
    let webContext = '';
    const needsWebContext =
      highQualityChunks.length === 0 || // No hay contexto institucional suficiente
      prompt.toLowerCase().includes('actual') || // El usuario pide vigencia
      prompt.toLowerCase().includes('reciente') ||
      prompt.toLowerCase().includes('hoy');

    if (needsWebContext) {
      webContext = await fetchWebContext(prompt);
      if (webContext) sourcesUsed.push('web');
    }

    if (sourcesUsed.length === 0) sourcesUsed.push('none');

    // ── PASO 3: Generación con Gemini ─────────────────────────
    let generatedText = '';
    let regenerated = false;

    let attempt = 0;
    let currentPrompt = prompt;

    while (attempt <= MAX_REGENERATION_ATTEMPTS) {
      const result = await generateContent({
        prompt: currentPrompt,
        profile,
        documentType,
        institutionalContext,
        webContext,
        wordCount,
        subject,
      });

      generatedText = result.text;

      // ── PASO 4: Filtro anti-cliché ────────────────────────
      const filterResult = analyzeText(generatedText);

      if (filterResult.passed) {
        break; // El texto pasó el filtro; salir del bucle
      }

      if (attempt < MAX_REGENERATION_ATTEMPTS) {
        // Preparar prompt de regeneración para el siguiente intento
        currentPrompt = buildRegenerationPrompt(
          generatedText,
          filterResult.detected,
        );
        regenerated = true;
      }

      attempt++;
    }

    // ── PASO 5: Respuesta final ───────────────────────────────
    const processingTimeMs = Date.now() - startTime;

    sendSuccess(res, {
      text: generatedText,
      sources_used: sourcesUsed,
      metadata: {
        model: 'gemini-2.0-flash',
        profile,
        documentType,
        regenerated,
        processingTimeMs,
        userId,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Distinguir errores de Gemini vs. Supabase para el cliente
    if (message.includes('[Gemini]')) {
      sendError(
        res,
        502,
        ErrorCode.LLM_ERROR,
        'Error al comunicarse con el modelo de lenguaje.',
        message,
      );
    } else if (message.includes('[Supabase]')) {
      sendError(
        res,
        502,
        ErrorCode.DB_ERROR,
        'Error al acceder a la base de datos vectorial.',
        message,
      );
    } else {
      sendError(
        res,
        500,
        ErrorCode.INTERNAL_ERROR,
        'Error interno del servidor al procesar la solicitud.',
        message,
      );
    }
  }
}
