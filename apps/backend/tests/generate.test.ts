import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../lib/gemini.js', () => ({
  generateContent: vi.fn(),
}));

vi.mock('../lib/supabase.js', () => ({
  searchDocuments: vi.fn().mockResolvedValue([]),
  SIMILARITY_THRESHOLD: 0.75,
}));

import app from '../src/app.js';
import { generateContent } from '../lib/gemini.js';
import { searchDocuments } from '../lib/supabase.js';

describe('Generate Endpoint (POST /api/v1/generate)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe rechazar solicitudes con campos incompletos con 400', async () => {
    const response = await request(app)
      .post('/api/v1/generate')
      .send({ prompt: 'Explicar herencia' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('MISSING_FIELDS');
  });

  it('debe rechazar perfiles inválidos con 400', async () => {
    const response = await request(app)
      .post('/api/v1/generate')
      .send({
        prompt: 'Explicar recursión',
        profile: 'rector',
        documentType: 'ensayo',
        userId: 'usr_1',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('debe rechazar tipos de documentos inválidos con 400', async () => {
    const response = await request(app)
      .post('/api/v1/generate')
      .send({
        prompt: 'Explicar recursión',
        profile: 'estudiante',
        documentType: 'novela',
        userId: 'usr_1',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('debe orquestar exitosamente la generación y filtro anti-cliché con 200', async () => {
    vi.mocked(generateContent).mockResolvedValue({
      text: 'La encapsulación en programación orientada a objetos oculta el estado interno.',
      sourcesUsed: ['institutional'],
    });

    const response = await request(app)
      .post('/api/v1/generate')
      .send({
        prompt: 'Explica el concepto de encapsulamiento',
        profile: 'estudiante',
        documentType: 'ensayo',
        userId: 'usr_felipe_123',
      });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.text).toContain('encapsulación');
    expect(response.body.data.sources_used).toBeDefined();
    expect(response.body.data.metadata.profile).toBe('estudiante');
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

    const response = await request(app)
      .post('/api/v1/generate')
      .send({
        prompt: 'Explica el polimorfismo',
        profile: 'docente',
        documentType: 'guia_clase',
        userId: 'usr_docente_456',
      });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.metadata.regenerated).toBe(true);
    expect(response.body.data.text).not.toContain('En conclusión');
  });

  describe('Manejo de errores', () => {
    it('debe responder 502 LLM_ERROR si Gemini falla con prefijo [Gemini]', async () => {
      vi.mocked(generateContent).mockRejectedValue(new Error('[Gemini] Quota exceeded'));

      const response = await request(app)
        .post('/api/v1/generate')
        .send({
          prompt: 'Prueba error',
          profile: 'estudiante',
          documentType: 'resumen',
          userId: 'u1',
        });

      expect(response.status).toBe(502);
      expect(response.body.error.code).toBe('LLM_ERROR');
    });

    it('debe incluir contexto institucional si hay chunks por encima del umbral', async () => {
      vi.mocked(searchDocuments).mockResolvedValueOnce([
        {
          id: 'chunk_1',
          content: 'Contenido relevante del pensum',
          similarity: 0.85,
          metadata: { source: 'pensum.pdf', document_type: 'pensum' },
        },
      ]);
      vi.mocked(generateContent).mockResolvedValueOnce({
        text: 'Respuesta basada en el pensum.',
        sourcesUsed: ['institutional'],
      });

      const response = await request(app)
        .post('/api/v1/generate')
        .send({
          prompt: 'Requisitos actuales de graduacion',
          profile: 'estudiante',
          documentType: 'resumen',
          userId: 'u1',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.sources_used).toContain('institutional');
    });

    it('debe responder 502 DB_ERROR si la base vectorial falla con prefijo [Supabase]', async () => {
      vi.mocked(searchDocuments).mockRejectedValueOnce(
        new Error('[Supabase] Conexión perdida con pgvector'),
      );

      const response = await request(app)
        .post('/api/v1/generate')
        .send({
          prompt: 'Prueba supabase error',
          profile: 'estudiante',
          documentType: 'resumen',
          userId: 'u1',
        });

      expect(response.status).toBe(502);
      expect(response.body.error.code).toBe('DB_ERROR');
    });

    it('debe responder 500 INTERNAL_ERROR ante errores inesperados', async () => {
      vi.mocked(generateContent).mockRejectedValue(new Error('Fallo general del servidor'));

      const response = await request(app)
        .post('/api/v1/generate')
        .send({
          prompt: 'Prueba error',
          profile: 'estudiante',
          documentType: 'resumen',
          userId: 'u1',
        });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
