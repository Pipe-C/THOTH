// ─────────────────────────────────────────────────────────────
// lib/services/ragService.ts — Resolución de contexto RAG híbrido
// ─────────────────────────────────────────────────────────────
// Decide el contexto final combinando la búsqueda institucional
// (Supabase pgvector) con la búsqueda web (Tavily) como fallback.
// Principio: la web nunca reemplaza al fondo institucional.
// ─────────────────────────────────────────────────────────────

import { DEFAULT_TOP_K } from '../config.js';
import {
  findSimilarChunks,
  SIMILARITY_THRESHOLD,
} from '../repositories/documentRepository.js';
import type { ContextSource } from '../types.js';

export interface HybridContextResult {
  institutionalContext: string;
  webContext: string;
  sourcesUsed: ContextSource[];
}

/**
 * Obtiene contexto web (Tavily) como complemento. Si no hay API key
 * configurada o la llamada falla, degrada silenciosamente a cadena vacía.
 */
async function fetchWebContext(query: string): Promise<string> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) return '';

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tavilyKey}`,
      },
      body: JSON.stringify({
        query,
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
      parts.push(...data.results.map((r) => `Fuente: ${r.url}\n${r.content}`));
    }
    return parts.join('\n\n');
  } catch {
    return '';
  }
}

/**
 * Determina si hace falta complementar con web: cuando no hay
 * fragmentos institucionales relevantes o el tema exige vigencia.
 */
function shouldFetchWebContext(
  prompt: string,
  hasHighQualityChunks: boolean,
): boolean {
  if (!hasHighQualityChunks) return true;
  const lower = prompt.toLowerCase();
  return (
    lower.includes('actual') ||
    lower.includes('reciente') ||
    lower.includes('hoy')
  );
}

/** Resuelve el contexto combinado institucional + web para un prompt. */
export async function resolveHybridContext(
  prompt: string,
): Promise<HybridContextResult> {
  let institutionalContext = '';
  const sourcesUsed: ContextSource[] = [];

  const vectorResults = await findSimilarChunks(prompt, DEFAULT_TOP_K);
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
