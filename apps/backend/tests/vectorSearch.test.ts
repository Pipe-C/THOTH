import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

vi.mock('../lib/supabase.js', () => ({
  searchDocuments: vi.fn(),
  SIMILARITY_THRESHOLD: 0.75,
}));

import vectorSearchHandler from '../api/v1/vector-search.js';
import { searchDocuments } from '../lib/supabase.js';
import { createMockHttp } from './helpers/mockHttp.js';

describe('Vector Search Endpoint (POST /api/v1/vector-search)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe rechazar métodos distintos a POST con 405', async () => {
    const { req, res, state } = createMockHttp('GET');
    await vectorSearchHandler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('debe rechazar si falta el campo query con 400', async () => {
    const { req, res, state } = createMockHttp('POST', {});
    await vectorSearchHandler(req, res);

    expect(state.statusCode).toBe(400);
    expect(state.body.error.code).toBe('MISSING_FIELDS');
  });

  it('debe rechazar consultas vacías con 400', async () => {
    const { req, res, state } = createMockHttp('POST', { query: '   ' });
    await vectorSearchHandler(req, res);

    expect(state.statusCode).toBe(400);
    expect(state.body.error.code).toBe('VALIDATION_ERROR');
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

    const { req, res, state } = createMockHttp('POST', {
      query: 'requisitos de grado en ingenieria de software',
      topK: 3,
    });
    await vectorSearchHandler(req, res);

    expect(state.statusCode).toBe(200);
    expect(state.body.ok).toBe(true);
    expect(Array.isArray(state.body.data.results)).toBe(true);
    expect(state.body.data.results.length).toBe(1);
    expect(state.body.data.meta.query).toBe('requisitos de grado en ingenieria de software');
  });
});
