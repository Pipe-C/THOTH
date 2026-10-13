// ─────────────────────────────────────────────────────────────
// lib/response.ts — Standard response and errors of THOTH
// ─────────────────────────────────────────────────────────────
// All endpoints have to use those functions to guarantee
// a consistent response form in all the API.
// ─────────────────────────────────────────────────────────────

import { randomUUID } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Internal error codes ────────────────────────────────

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

// ─── Canonic form of success response ──────────────────────

export interface ApiSuccess<T = unknown> {
  ok: true;
  version: 'v1';
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

// ─── Canonic form of error answer ─────────────────────

export interface ApiError {
  ok: false;
  version: 'v1';
  error: {
    code: ErrorCodeType;
    message: string;
    /** Technique details, visible only in develop */
    detail?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

// ─── Generated ID request ────────────────────────────

function generateRequestId(): string {
  return `toth-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

// ─── Helper: success request ────────────────────────────────

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

// ─── Helper: error request ───────────────────────────────

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

// ─── Helper: validate HTTP method ─────────────────────────────

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

// ─── Helper: verify required camps ──────────────────────

export function requireFields<T extends object>(
  body: T,
  fields: (keyof T)[],
): string[] {
  return fields.filter(
    (f) => body[f] === undefined || body[f] === null || body[f] === '',
  ) as string[];
}
