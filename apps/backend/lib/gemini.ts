// ─────────────────────────────────────────────────────────────
// lib/gemini.ts — Cliente Gemini 3.8 Flash para TOTH
// ─────────────────────────────────────────────────────────────
// Responsabilidad: construir el prompt final combinando el system
// prompt de identidad, el negative prompt anti-cliché, el perfil
// de usuario y el contexto RAG híbrido; luego invocar a Gemini.
// ─────────────────────────────────────────────────────────────

import { GoogleGenAI } from '@google/genai';
import type { UserProfile, DocumentType, ContextSource } from './types.js';

// ─── Configuración ────────────────────────────────────────────

const MODEL_ID = 'gemini-2.0-flash';

let _ai: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('[Gemini] GEMINI_API_KEY no está definida en .env');
    }
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

// ─── Prompts del sistema (ver COMPORTAMIENTO_DEL_ASISTENTE.md) ──

const SYSTEM_PROMPT_BASE = `Eres TOTH, un asistente académico de generación de contenido para la comunidad de la I.U. Pascual Bravo. Tu nombre honra a Thot, deidad egipcia de la escritura y la sabiduría: tu tarea es producir conocimiento claro, riguroso y con voz propia — no texto reciclado.

Reglas fundamentales:
- Escribe como escribiría un experto humano en la materia, con variación natural de longitud de párrafo y sin fórmulas repetitivas.
- Prioriza siempre el CONTEXTO INSTITUCIONAL entregado (pénsum, syllabus, reglamentos, guías del Pascual Bravo) sobre conocimiento general.
- Si el CONTEXTO INSTITUCIONAL no cubre la pregunta o el tema requiere información vigente, usa el CONTEXTO WEB entregado como complemento, nunca como reemplazo silencioso.
- Nunca inventes datos, citas, normas o fuentes que no estén en el contexto entregado.
- Ajusta densidad, tono y estructura según el PERFIL DE USUARIO indicado.`;

const NEGATIVE_PROMPT = `
PROHIBIDO usar las siguientes muletillas, conectores y frases de relleno típicas de IA:
- "En conclusión", "En resumen", "A modo de cierre", "Para finalizar"
- "Es importante destacar que", "Cabe resaltar que", "Vale la pena mencionar"
- "Un aspecto clave / fundamental / crucial es"
- "Juega un papel crucial / fundamental / vital"
- "Profundizar en el tema", "Ahondar en este aspecto"
- "Esto pone de relieve", "Esto evidencia", "Esto resalta la importancia de"
- "En el mundo actual", "En la era digital", "En un mundo cada vez más..."
- "No cabe duda de que", "Sin lugar a dudas"
- Listas de tres adjetivos encadenados automáticamente cuando no aportan información nueva.

Reglas de estilo adicionales:
- Varía la longitud de los párrafos: evita que todos midan lo mismo.
- Evita comenzar dos párrafos consecutivos con la misma estructura sintáctica.
- No uses encabezados ni bullets salvo que el tipo de documento lo exija.
- Prefiere conectores naturales de transición sobre fórmulas de manual.`;

const PROFILE_PROMPTS: Record<UserProfile, string> = {
  estudiante: `
PERFIL ACTIVO: ESTUDIANTE
- Tono: explicativo y pedagógico, como una monitoría bien dada.
- Estructura: desarrollo conceptual paso a paso; introduce cada idea antes de usarla.
- Nivel: asume conocimiento de base del semestre correspondiente, no conocimiento experto.
- Formato apto para: entregas de laboratorio, informes de proyecto, resúmenes de estudio.`,
  docente: `
PERFIL ACTIVO: DOCENTE
- Tono: analítico, evaluativo, de alta densidad académica.
- Estructura: asume dominio experto del tema; no expliques conceptos básicos del área.
- Formato apto para: guías de clase, rúbricas, artículos cortos, material de evaluación.
- Prioriza precisión terminológica y referencias al material institucional.`,
};

// ─── Plantillas de prompt por tipo de documento ──────────────

function buildDocumentPrompt(
  type: DocumentType,
  userPrompt: string,
  wordCount?: number,
  subject?: string,
): string {
  const ext = wordCount ? `Extensión aproximada: ${wordCount} palabras.` : '';
  const sub = subject ? `Curso / asignatura: ${subject}.` : '';

  switch (type) {
    case 'ensayo':
      return `Escribe un ensayo académico sobre: ${userPrompt}\n${ext}\n${sub}\nUsa el contexto institucional entregado para fundamentar los argumentos cuando aplique. No uses subtítulos salvo que el tema lo requiera.`;
    case 'informe_laboratorio':
      return `Redacta un informe de laboratorio/proyecto sobre: ${userPrompt}\n${sub}\nMantén rigurosidad técnica con tono explicativo apto para evaluación docente.`;
    case 'guia_clase':
      return `Genera una guía de clase sobre: ${userPrompt}\n${sub}\nIncluye, si es pertinente, actividades evaluativas breves alineadas al microcurrículo.`;
    case 'articulo':
      return `Redacta un artículo académico corto sobre: ${userPrompt}\nPúblico objetivo: pares académicos / evaluadores. Prioriza precisión conceptual.`;
    case 'resumen':
      return `Elabora un resumen estructurado sobre: ${userPrompt}\n${sub}\n${ext}`;
    default:
      return userPrompt;
  }
}

// ─── Función principal de generación ─────────────────────────

export interface GeminiGenerateParams {
  prompt: string;
  profile: UserProfile;
  documentType: DocumentType;
  institutionalContext: string;
  webContext: string;
  wordCount?: number;
  subject?: string;
}

export interface GeminiGenerateResult {
  text: string;
  sourcesUsed: ContextSource[];
}

export async function generateContent(
  params: GeminiGenerateParams,
): Promise<GeminiGenerateResult> {
  const {
    prompt,
    profile,
    documentType,
    institutionalContext,
    webContext,
    wordCount,
    subject,
  } = params;

  const ai = getGeminiClient();

  // Determinar fuentes usadas
  const sourcesUsed: ContextSource[] = [];
  if (institutionalContext.trim()) sourcesUsed.push('institutional');
  if (webContext.trim()) sourcesUsed.push('web');
  if (sourcesUsed.length === 0) sourcesUsed.push('none');

  // Construir system instruction
  const systemInstruction = [
    SYSTEM_PROMPT_BASE,
    NEGATIVE_PROMPT,
    PROFILE_PROMPTS[profile],
  ].join('\n\n');

  // Construir el mensaje usuario con el contexto RAG
  const contextBlock = `CONTEXTO INSTITUCIONAL (Pascual Bravo — prioridad alta):
${institutionalContext || 'Sin contexto institucional disponible para esta consulta.'}

CONTEXTO WEB (complemento / actualidad — usar solo si es necesario):
${webContext || 'Sin contexto web disponible.'}

INSTRUCCIÓN DE USO DE CONTEXTO:
- Responde primero con base en el CONTEXTO INSTITUCIONAL.
- Usa el CONTEXTO WEB únicamente para llenar vacíos o actualizar datos temporales.
- Si ningún contexto responde la pregunta, dilo explícitamente en vez de inventar contenido.

PETICIÓN:
${buildDocumentPrompt(documentType, prompt, wordCount, subject)}`;

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    config: { systemInstruction },
    contents: [{ role: 'user', parts: [{ text: contextBlock }] }],
  });

  const text =
    response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text) {
    throw new Error('[Gemini] La respuesta llegó vacía desde el modelo.');
  }

  return { text, sourcesUsed };
}

/** Verifica conectividad con Gemini (genera un token mínimo). */
export async function pingGemini(): Promise<boolean> {
  try {
    const ai = getGeminiClient();
    const r = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
    });
    return !!r.candidates?.[0];
  } catch {
    return false;
  }
}
