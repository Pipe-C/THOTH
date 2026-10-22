// ─────────────────────────────────────────────────────────────
// lib/services/generationService.ts — Generación + filtro anti-cliché
// ─────────────────────────────────────────────────────────────
// Invoca el LLM a través del llmRepository y aplica el filtro
// anti-cliché: si detecta muletillas, reintenta la generación con
// un prompt de corrección (lógica determinística, sin gasto extra
// de cuota más allá de los reintentos acotados).
// Ver: COMPORTAMIENTO_DEL_ASISTENTE.md, secciones 3 y 8.
// ─────────────────────────────────────────────────────────────

import { analyzeText, buildRegenerationPrompt } from '../antiClicheFilter.js';
import { MAX_REGENERATION_ATTEMPTS } from '../config.js';
import {
  complete,
  type GroqGenerateParams,
} from '../repositories/llmRepository.js';

/** Parámetros de entrada del pipeline de generación con calidad. */
export type GenerationQualityParams = GroqGenerateParams;

export interface GenerationQualityResult {
  text: string;
  regenerated: boolean;
}

/**
 * Genera contenido y lo re-genera tantas veces (hasta el máximo) como
 * sea necesario hasta que pase el filtro anti-cliché.
 */
export async function generateWithQualityFilter(
  params: GenerationQualityParams,
): Promise<GenerationQualityResult> {
  if (params.antiClicheEnabled === false) {
    const result = await complete(params);
    return { text: result.text, regenerated: false };
  }

  let generatedText = '';
  let regenerated = false;
  let currentPrompt = params.prompt;

  for (let attempt = 0; attempt <= MAX_REGENERATION_ATTEMPTS; attempt++) {
    const result = await complete({ ...params, prompt: currentPrompt });

    generatedText = result.text;
    const filterResult = analyzeText(generatedText);

    if (filterResult.passed) break;

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
