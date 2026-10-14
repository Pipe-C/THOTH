// ─────────────────────────────────────────────────────────────
// lib/repositories/llmRepository.ts — Acceso al modelo de lenguaje
// ─────────────────────────────────────────────────────────────
// Capa de repositorio: aísla a los servicios del SDK de Groq.
// Los servicios piden "completar un prompt" sin conocer el proveedor.
// ─────────────────────────────────────────────────────────────

import {
  generateContent,
  pingGroq,
  type GroqGenerateParams,
  type GroqGenerateResult,
} from '../groq.js';

export type { GroqGenerateParams, GroqGenerateResult };

/**
 * Solicita al modelo la generación de contenido con el prompt y el
 * contexto ya construidos.
 */
export async function complete(
  params: GroqGenerateParams,
): Promise<GroqGenerateResult> {
  return generateContent(params);
}

/** Verifica que el proveedor LLM esté accesible (usado en health-check). */
export async function isReachable(): Promise<boolean> {
  return pingGroq();
}
