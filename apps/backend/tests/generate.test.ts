import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock de servicios externos con rutas relativas correctas
vi.mock('../lib/gemini.js', () => ({
  generateContent: vi.fn(),
}));

vi.mock('../lib/supabase.js', () => ({
  searchDocuments: vi.fn().mockResolvedValue([]),
  SIMILARITY_THRESHOLD: 0.75,
}));

import generateHandler from '../api/v1/generate.js';
import { generateContent } from '../lib/gemini.js';

function createMockHttp(method: string, body: Record<string, unknown> = {}) {
  const req = { method, body } as unknown as VercelRequest;
  const state = { statusCode: 200, body: null as any };
  const res = {
    status: vi.fn((code: number) => {
      state.statusCode = code;
      return res;
    }),
    setHeader: vi.fn(),
    json: vi.fn((data: unknown) => {
      state.body = data;
      return res;
    }),
  } as unknown as VercelResponse;

  return { req, res, state };
}

describe('Generate Endpoint (POST /api/v1/generate)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe rechazar métodos distintos a POST con 405', async () => {
    const { req, res, state } = createMockHttp('GET');
    await generateHandler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('debe rechazar solicitudes con campos incompletos con 400', async () => {
    const { req, res, state } = createMockHttp('POST', { prompt: 'Explicar herencia' });
    await generateHandler(req, res);

    expect(state.statusCode).toBe(400);
    expect(state.body.error.code).toBe('MISSING_FIELDS');
  });

  it('debe rechazar perfiles inválidos con 400', async () => {
    const { req, res, state } = createMockHttp('POST', {
      prompt: 'Explicar recursión',
      profile: 'rector',
      documentType: 'ensayo',
      userId: 'usr_1',
    });
    await generateHandler(req, res);

    expect(state.statusCode).toBe(400);
    expect(state.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('debe rechazar tipos de documentos inválidos con 400', async () => {
    const { req, res, state } = createMockHttp('POST', {
      prompt: 'Explicar recursión',
      profile: 'estudiante',
      documentType: 'novela',
      userId: 'usr_1',
    });
    await generateHandler(req, res);

    expect(state.statusCode).toBe(400);
    expect(state.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('debe orquestar exitosamente la generación y filtro anti-cliché con 200', async () => {
    vi.mocked(generateContent).mockResolvedValue({
      text: 'La encapsulación en programación orientada a objetos oculta el estado interno.',
      sourcesUsed: ['institutional'],
    });

    const { req, res, state } = createMockHttp('POST', {
      prompt: 'Explica el concepto de encapsulamiento',
      profile: 'estudiante',
      documentType: 'ensayo',
      userId: 'usr_felipe_123',
    });

    await generateHandler(req, res);

    expect(state.statusCode).toBe(200);
    expect(state.body.ok).toBe(true);
    expect(state.body.data.text).toContain('encapsulación');
    expect(state.body.data.sources_used).toBeDefined();
    expect(state.body.data.metadata.profile).toBe('estudiante');
  });

  it('debe regenerar el texto si el primer intento contiene muletillas de IA', async () => {
    vi.mocked(generateContent)
      .mockResolvedValueOnce({
        text: 'En conclusión, el polimorfismo permite múltiples formas.',
        sourcesUsed: ['institutional'],
      })
      .mockResolvedValueOnce({
        text: 'El polimorfismo permite despachar métodos dinámicamente según el subtipo.',
        sourcesUsed: ['institutional'],
      });

    const { req, res, state } = createMockHttp('POST', {
      prompt: 'Explica el polimorfismo',
      profile: 'docente',
      documentType: 'guia_clase',
      userId: 'usr_docente_456',
    });

    await generateHandler(req, res);

    expect(state.statusCode).toBe(200);
    expect(state.body.ok).toBe(true);
    expect(state.body.data.metadata.regenerated).toBe(true);
    expect(state.body.data.text).not.toContain('En conclusión');
  });

  describe('Manejo de errores', () => {
    it('debe responder 502 LLM_ERROR si Gemini falla con prefijo [Gemini]', async () => {
      vi.mocked(generateContent).mockRejectedValue(new Error('[Gemini] Quota exceeded'));

      const { req, res, state } = createMockHttp('POST', {
        prompt: 'Prueba error',
        profile: 'estudiante',
        documentType: 'resumen',
        userId: 'u1',
      });

      await generateHandler(req, res);

      expect(state.statusCode).toBe(502);
      expect(state.body.error.code).toBe('LLM_ERROR');
    });

    it('debe responder 500 INTERNAL_ERROR ante errores inesperados', async () => {
      vi.mocked(generateContent).mockRejectedValue(new Error('Fallo general del servidor'));

      const { req, res, state } = createMockHttp('POST', {
        prompt: 'Prueba error',
        profile: 'estudiante',
        documentType: 'resumen',
        userId: 'u1',
      });

      await generateHandler(req, res);

      expect(state.statusCode).toBe(500);
      expect(state.body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
