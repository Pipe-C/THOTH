import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../lib/repositories/documentRepository.js', () => ({
  findSimilarChunks: vi.fn(),
  SIMILARITY_THRESHOLD: 0.75,
}));

import { resolveHybridContext } from '../../lib/services/ragService.js';
import { findSimilarChunks } from '../../lib/repositories/documentRepository.js';

function chunk(similarity: number, content = 'Contenido institucional') {
  return {
    id: 'c1',
    content,
    similarity,
    metadata: { source: 'pensum.pdf', document_type: 'pensum' },
  };
}

describe('ragService', () => {
  const originalTavily = process.env.TAVILY_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TAVILY_API_KEY;
  });

  afterEach(() => {
    if (originalTavily === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = originalTavily;
    vi.unstubAllGlobals();
  });

  it('usa solo contexto institucional cuando hay chunks relevantes', async () => {
    vi.mocked(findSimilarChunks).mockResolvedValue([chunk(0.9)]);

    const result = await resolveHybridContext('explica el pensum');

    expect(result.institutionalContext).toContain('Contenido institucional');
    expect(result.sourcesUsed).toEqual(['institutional']);
  });

  it('descarta chunks por debajo del umbral y sin web key marca none', async () => {
    vi.mocked(findSimilarChunks).mockResolvedValue([chunk(0.4)]);

    const result = await resolveHybridContext('tema general');

    expect(result.institutionalContext).toBe('');
    expect(result.sourcesUsed).toEqual(['none']);
  });

  it('complementa con web cuando el tema exige vigencia', async () => {
    process.env.TAVILY_API_KEY = 'tvly-test';
    vi.mocked(findSimilarChunks).mockResolvedValue([chunk(0.9)]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          answer: 'Respuesta web actual',
          results: [{ url: 'https://x.co', content: 'detalle' }],
        }),
      }),
    );

    const result = await resolveHybridContext('normativa actual 2026');

    expect(result.sourcesUsed).toEqual(['institutional', 'web']);
    expect(result.webContext).toContain('Respuesta web actual');
  });

  it('degrada a cadena vacía si la búsqueda web falla', async () => {
    process.env.TAVILY_API_KEY = 'tvly-test';
    vi.mocked(findSimilarChunks).mockResolvedValue([]);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const result = await resolveHybridContext('consulta');

    expect(result.webContext).toBe('');
    expect(result.sourcesUsed).toEqual(['none']);
  });
});
