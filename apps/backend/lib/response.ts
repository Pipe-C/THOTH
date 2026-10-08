// ─────────────────────────────────────────────────────────────
// lib/response.ts — Estándar de respuestas y errores de TOTH
// ─────────────────────────────────────────────────────────────
// Todos los endpoints deben usar estas funciones para garantizar
// una forma consistente de respuesta en toda la API.
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Códigos de error internos ────────────────────────────────

export const ErrorCode = {
  // 400
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_DOMAIN: 'INVALID_DOMAIN',
  MISSING_FIELDS: 'MISSING_FIELDS',
  // 401
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  // 403
  FORBIDDEN: 'FORBIDDEN',
  // 404
  NOT_FOUND: 'NOT_FOUND',
  // 405
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  // 429
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  // 500
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  LLM_ERROR: 'LLM_ERROR',
  DB_ERROR: 'DB_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── Forma canónica de respuesta exitosa ──────────────────────

export interface ApiSuccess<T = unknown> {
  ok: true;
  version: 'v1';
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

// ─── Forma canónica de respuesta de error ─────────────────────

export interface ApiError {
  ok: false;
  version: 'v1';
  error: {
    code: ErrorCodeType;
    message: string;
    /** Detalle técnico visible solo en desarrollo */
    detail?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

// ─── Generador de ID de solicitud ────────────────────────────

function generateRequestId(): string {
  return `toth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Helper: respuesta exitosa ────────────────────────────────

export function sendSuccess<T>(
  res: VercelResponse,
  data: T,
  httpStatus = 200,
): void {
  const payload: ApiSuccess<T> = {
    ok: true,
    version: 'v1',
    data,
    meta: {
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.status(httpStatus).json(payload);
}

// ─── Helper: respuesta de error ───────────────────────────────

export function sendError(
  res: VercelResponse,
  httpStatus: number,
  code: ErrorCodeType,
  message: string,
  detail?: string,
): void {
  const payload: ApiError = {
    ok: false,
    version: 'v1',
    error: {
      code,
      message,
      ...(process.env.NODE_ENV !== 'production' && detail
        ? { detail }
        : {}),
    },
    meta: {
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.status(httpStatus).json(payload);
}

// ─── Helper: validar método HTTP ─────────────────────────────

export function requireMethod(
  req: VercelRequest,
  res: VercelResponse,
  allowed: string | string[],
): boolean {
  const methods = Array.isArray(allowed) ? allowed : [allowed];
  if (!methods.includes(req.method ?? '')) {
    res.setHeader('Allow', methods.join(', '));
    sendError(
      res,
      405,
      ErrorCode.METHOD_NOT_ALLOWED,
      `Método ${req.method} no permitido. Usa: ${methods.join(', ')}`,
    );
    return false;
  }
  return true;
}

// ─── Helper: verificar campos requeridos ──────────────────────

export function requireFields<T extends object>(
  body: T,
  fields: (keyof T)[],
): string[] {
  return fields.filter(
    (f) => body[f] === undefined || body[f] === null || body[f] === '',
  ) as string[];
}
