// ─────────────────────────────────────────────────────────────
// lib/controllers/generateController.ts — RAG Controlller + generation
// POST /api/v1/generate
// ─────────────────────────────────────────────────────────────
// Complete flow:
//  1. Validates payload entry.
//  2. Resolves hybrid context (institutional + web).
//  3. Generates with LLM applying anti-cliche filter.
//  4. Returns a sanitized response with origin metadata.
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LLM_MODEL_ID } from '../config.js';
import { ErrorCode, requireFields, sendError, sendSuccess } from '../response.js';
import { resolveHybridContext } from '../services/ragService.js';
import { generateWithQualityFilter } from '../services/generationService.js';
import type { ErrorCodeType } from '../response.js';
import type { DocumentType, GenerateRequest } from '../types.js';

// ─── Validation ──────────────────────────────────────────────

const VALID_DOC_TYPES: DocumentType[] = [
  'ensayo',
  'informe_laboratorio',
  'guia_clase',
  'articulo',
  'resumen',
];

interface ValidationError {
  status: number;
  code: ErrorCodeType;
  message: string;
}

interface ValidationResult {
  error?: ValidationError;
  data?: GenerateRequest;
}

/** Validates /generate payload: required camps, profile and doc type. */
function validateGeneratePayload(
  body: Partial<GenerateRequest>,
): ValidationResult {
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

// ─── Error handling ───────────────────────────────────────

/** Translates error with prefix of the dependencies to HTTP codes. */
function handleGenerateError(res: VercelResponse, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes('[Groq]')) {
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

/** POST /api/v1/generate — orchestrator hybrid RAG + LLM. */
export async function handleGenerate(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const validation = validateGeneratePayload(
    req.body as Partial<GenerateRequest>,
  );

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
        model: LLM_MODEL_ID,
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
