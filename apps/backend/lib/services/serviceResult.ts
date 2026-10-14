// ─────────────────────────────────────────────────────────────
// lib/services/serviceResult.ts — Resultado de servicio tipado
// ─────────────────────────────────────────────────────────────
// Permite que los servicios devuelvan errores de validación/negocio
// sin acoplarse a Express/Vercel: el controlador traduce a HTTP.
// ─────────────────────────────────────────────────────────────

import type { ErrorCodeType } from '../response.js';

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: ErrorCodeType; message: string };

/** Construye un resultado exitoso. */
export function success<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

/** Construye un resultado de error de negocio con su status HTTP sugerido. */
export function failure(
  status: number,
  code: ErrorCodeType,
  message: string,
): ServiceResult<never> {
  return { ok: false, status, code, message };
}
