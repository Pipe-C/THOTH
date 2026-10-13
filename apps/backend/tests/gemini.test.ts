import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

import {
  getGeminiClient,
  resetGeminiClient,
  pingGemini,
  generateContent,
  buildDocumentPrompt,
} from '../lib/gemini.js';

describe('Gemini Client Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGeminiClient();
    process.env.GEMINI_API_KEY = 'test-gemini-key-12345';
  });

  it('debe arrojar error si GEMINI_API_KEY no está definida', () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => getGeminiClient()).toThrow(/GEMINI_API_KEY no está definida/);
  });

  it('debe inicializar el cliente cuando GEMINI_API_KEY está definida', () => {
    const client = getGeminiClient();
    expect(client).toBeDefined();
  });

  it('pingGemini() debe retornar true cuando la API responde con candidatos', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: 'pong' }] } }],
    });

    const alive = await pingGemini();
    expect(alive).toBe(true);
  });

  it('pingGemini() debe retornar false cuando la llamada falla', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Quota limit reached'));

    const alive = await pingGemini();
    expect(alive).toBe(false);
  });

  describe('generateContent()', () => {
    it('debe generar contenido e identificar las fuentes utilizadas', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'Texto académico generado por Gemini sin clichés.' }],
            },
          },
        ],
      });

      const res = await generateContent({
        prompt: 'Explicar recursión',
        profile: 'estudiante',
        documentType: 'ensayo',
        institutionalContext: 'Contexto del Pascual Bravo',
        webContext: 'Contexto de la web',
        wordCount: 300,
        subject: 'Algoritmos',
      });

      expect(res.text).toBe('Texto académico generado por Gemini sin clichés.');
      expect(res.sourcesUsed).toEqual(['institutional', 'web']);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('debe registrar sources_used como none si no hay contextos disponibles', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{ content: { parts: [{ text: 'Respuesta sin contexto previo.' }] } }],
      });

      const res = await generateContent({
        prompt: 'Pregunta general',
        profile: 'docente',
        documentType: 'resumen',
        institutionalContext: '',
        webContext: '',
      });

      expect(res.sourcesUsed).toEqual(['none']);
    });

    it('debe arrojar error si el modelo devuelve una respuesta vacía', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{ content: { parts: [{ text: '' }] } }],
      });

      await expect(
        generateContent({
          prompt: 'Pregunta',
          profile: 'estudiante',
          documentType: 'ensayo',
          institutionalContext: '',
          webContext: '',
        }),
      ).rejects.toThrow(/La respuesta llegó vacía/);
    });
  });

  describe('buildDocumentPrompt()', () => {
    it('debe generar prompt para ensayo con conteo de palabras y asignatura', () => {
      const p = buildDocumentPrompt('ensayo', 'Estructuras de datos', 500, 'Programación II');
      expect(p).toContain('Escribe un ensayo académico');
      expect(p).toContain('500 palabras');
      expect(p).toContain('Programación II');
    });

    it('debe generar prompt para informe de laboratorio', () => {
      const p = buildDocumentPrompt('informe_laboratorio', 'Circuitos RLC');
      expect(p).toContain('Redacta un informe de laboratorio');
    });

    it('debe generar prompt para guia de clase', () => {
      const p = buildDocumentPrompt('guia_clase', 'Matrices y determinantes');
      expect(p).toContain('Genera una guía de clase');
    });

    it('debe generar prompt para articulo academico', () => {
      const p = buildDocumentPrompt('articulo', 'Computación cuántica');
      expect(p).toContain('Redacta un artículo académico corto');
    });

    it('debe generar prompt para resumen estructurado', () => {
      const p = buildDocumentPrompt('resumen', 'Historia del Pascual Bravo');
      expect(p).toContain('Elabora un resumen estructurado');
    });

    it('debe retornar el prompt tal cual para tipos desconocidos', () => {
      const p = buildDocumentPrompt('otro' as any, 'Texto libre');
      expect(p).toBe('Texto libre');
    });
  });
});
