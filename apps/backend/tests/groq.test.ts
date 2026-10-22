import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('groq-sdk', () => ({
  default: class {
    chat = {
      completions: {
        create: mockCreate,
      },
    };
  },
}));

import {
  getGroqClient,
  resetGroqClient,
  pingGroq,
  generateContent,
  buildDocumentPrompt,
} from '../lib/groq.js';

describe('Groq Client Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGroqClient();
    process.env.GROQ_API_KEY = 'gsk_test-groq-key-12345';
  });

  it('debe arrojar error si GROQ_API_KEY no está definida', () => {
    delete process.env.GROQ_API_KEY;
    expect(() => getGroqClient()).toThrow(/GROQ_API_KEY no está definida/);
  });

  it('debe inicializar el cliente cuando GROQ_API_KEY está definida', () => {
    const client = getGroqClient();
    expect(client).toBeDefined();
  });

  it('pingGroq() debe retornar true cuando la API responde con opciones', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'pong' } }],
    });

    const alive = await pingGroq();
    expect(alive).toBe(true);
  });

  it('pingGroq() debe retornar false cuando la llamada falla', async () => {
    mockCreate.mockRejectedValue(new Error('Quota limit reached'));

    const alive = await pingGroq();
    expect(alive).toBe(false);
  });

  describe('generateContent()', () => {
    it('debe generar contenido e identificar las fuentes utilizadas', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Texto académico generado por Groq sin clichés.',
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

      expect(res.text).toBe('Texto académico generado por Groq sin clichés.');
      expect(res.sourcesUsed).toEqual(['institutional', 'web']);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('debe registrar sources_used como none si no hay contextos disponibles', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Respuesta sin contexto previo.' } }],
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

    it('omite el negative prompt cuando antiClicheEnabled es false', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Respuesta sin filtro.' } }],
      });

      await generateContent({
        prompt: 'Pregunta',
        profile: 'estudiante',
        documentType: 'ensayo',
        institutionalContext: '',
        webContext: '',
        antiClicheEnabled: false,
      });

      const systemMessage = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemMessage).not.toContain('PROHIBIDO usar las siguientes muletillas');
      expect(systemMessage).toContain('PERFIL ACTIVO: ESTUDIANTE');
    });

    it('debe arrojar error si el modelo devuelve una respuesta vacía', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '' } }],
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
