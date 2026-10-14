// ─────────────────────────────────────────────────────────────
// lib/routes/defineRoute.ts — Fábrica de rutas
// ─────────────────────────────────────────────────────────────
// Envuelve un controlador con la verificación de método HTTP.
// Los archivos de api/v1 usan esta fábrica, de modo que la ruta
// queda declarativa y el controlador se enfoca en la lógica.
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireMethod } from '../response.js';

export type RouteHandler = (
  req: VercelRequest,
  res: VercelResponse,
) => void | Promise<void>;

/**
 * Crea el handler exportable de una ruta, validando el método.
 *
 * @param allowed Método(s) HTTP admitidos.
 * @param handler Controlador que produce la respuesta.
 */
export function defineRoute(
  allowed: string | string[],
  handler: RouteHandler,
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  return async function route(
    req: VercelRequest,
    res: VercelResponse,
  ): Promise<void> {
    if (!requireMethod(req, res, allowed)) return;
    await handler(req, res);
  };
}
