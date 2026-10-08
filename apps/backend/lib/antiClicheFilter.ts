// ─────────────────────────────────────────────────────────────
// lib/antiClicheFilter.ts — Filtro post-generación TOTH
// ─────────────────────────────────────────────────────────────
// Escanea la respuesta de Gemini y detecta muletillas prohibidas.
// Si las encuentra, marca el texto para regeneración.
// Ver: COMPORTAMIENTO_DEL_ASISTENTE.md, sección 3 y 8.
// ─────────────────────────────────────────────────────────────

// ─── Lista de muletillas prohibidas ──────────────────────────

const CLICHE_PATTERNS: RegExp[] = [
  /en conclusi[oó]n/gi,
  /en resumen/gi,
  /a modo de cierre/gi,
  /para finalizar/gi,
  /es importante destacar que/gi,
  /cabe resaltar que/gi,
  /vale la pena mencionar/gi,
  /un aspecto (clave|fundamental|crucial) es/gi,
  /juega un papel (crucial|fundamental|vital)/gi,
  /profundizar en el tema/gi,
  /ahondar en este aspecto/gi,
  /esto pone de relieve/gi,
  /esto evidencia/gi,
  /esto resalta la importancia de/gi,
  /en el mundo actual/gi,
  /en la era digital/gi,
  /en un mundo cada vez m[aá]s/gi,
  /no cabe duda de que/gi,
  /sin lugar a dudas/gi,
];

// ─── Resultado del análisis ───────────────────────────────────

export interface FilterResult {
  /** El texto pasó el filtro sin muletillas */
  passed: boolean;
  /** Lista de coincidencias encontradas */
  detected: string[];
  /** Texto original sin modificar */
  originalText: string;
}

// ─── Función de análisis ──────────────────────────────────────

/**
 * Escanea `text` contra la lista de muletillas prohibidas.
 * No modifica el texto; solo reporta qué se encontró.
 *
 * @param text Texto generado por Gemini a analizar.
 * @returns    Objeto FilterResult con el veredicto y las coincidencias.
 */
export function analyzeText(text: string): FilterResult {
  const detected: string[] = [];

  for (const pattern of CLICHE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null = pattern.exec(text);
    while (match !== null) {
      detected.push(match[0].toLowerCase());
      match = pattern.exec(text);
    }
  }

  return {
    passed: detected.length === 0,
    detected: [...new Set(detected)], // elimina duplicados
    originalText: text,
  };
}

// ─── Prompt de corrección ─────────────────────────────────────

/**
 * Genera el prompt de corrección para pedir a Gemini que regenere
 * el texto eliminando las muletillas detectadas.
 *
 * @param originalText Texto que falló el filtro.
 * @param detected     Lista de muletillas encontradas.
 * @returns            Prompt de regeneración listo para inyectar.
 */
export function buildRegenerationPrompt(
  originalText: string,
  detected: string[],
): string {
  const formattedDetected = detected.map((d) => `"${d}"`).join(', ');

  return `El siguiente texto contiene muletillas o frases de relleno de IA que deben eliminarse. Reescríbelo manteniendo exactamente el mismo contenido académico, pero sin usar estas expresiones detectadas: ${formattedDetected}.

Texto a reescribir:
${originalText}

Instrucciones de reescritura:
- No elimines ni cambies el contenido informativo.
- Reemplaza las muletillas por transiciones naturales o simplemente elimínalas si el párrafo fluye sin ellas.
- Mantén el tono y perfil académico del texto original.`;
}
