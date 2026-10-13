import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../lib/supabase.js', () => ({
  searchDocuments: vi.fn(),
  SIMILARITY_THRESHOLD: 0.75,
}));

import app from '../src/app.js';
import { searchDocuments } from '../lib/supabase.js';

describe('Vector Search Endpoint (POST /api/v1/vector-search)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe rechazar si falta el campo query con 400', async () => {
    const response = await request(app)
      .post('/api/v1/vector-search')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('MISSING_FIELDS');
  });

  it('debe rechazar consultas vacías con 400', async () => {
    const response = await request(app)
      .post('/api/v1/vector-search')
      .send({ query: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('debe retornar resultados vectoriales institucionales con 200', async () => {
    vi.mocked(searchDocuments).mockResolvedValue([
      {
        id: 'chunk_1',
        content: 'Requisitos de grado: completar 160 créditos y trabajo de grado.',
        similarity: 0.89,
        metadata: {
          source: 'Reglamento Estudiantil Art. 45',
          document_type: 'reglamento',
        },
      },
    ]);

    const response = await request(app)
      .post('/api/v1/vector-search')
      .send({
        query: 'requisitos de grado en ingenieria de software',
        topK: 3,
      });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(Array.isArray(response.body.data.results)).toBe(true);
    expect(response.body.data.results.length).toBe(1);
    expect(response.body.data.meta.query).toBe('requisitos de grado en ingenieria de software');
  });
});
