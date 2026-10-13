import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFunctionsInvoke = vi.fn();
const mockRpc = vi.fn();
const mockLimit = vi.fn();
const mockSelect = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    functions: { invoke: mockFunctionsInvoke },
    rpc: mockRpc,
    from: mockFrom,
  })),
}));

import {
  getSupabaseClient,
  resetSupabaseClient,
  searchDocuments,
  pingSupabase,
  SIMILARITY_THRESHOLD,
} from '../lib/supabase.js';

describe('Supabase Client and Vector Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseClient();
    process.env.SUPABASE_URL = 'https://fake-supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-key-123';
  });

  it('debe arrojar error si SUPABASE_URL o KEY no están definidas', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => getSupabaseClient()).toThrow(/SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('debe tener un SIMILARITY_THRESHOLD numérico válido por defecto', () => {
    expect(typeof SIMILARITY_THRESHOLD).toBe('number');
    expect(SIMILARITY_THRESHOLD).toBeGreaterThanOrEqual(0);
    expect(SIMILARITY_THRESHOLD).toBeLessThanOrEqual(1);
  });

  it('debe inicializar el cliente correctamente con credenciales', () => {
    const client = getSupabaseClient();
    expect(client).toBeDefined();
  });

  describe('searchDocuments()', () => {
    it('debe generar embedding y mapear resultados vectoriales exitosamente', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: { embedding: [0.12, 0.45, 0.78] },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: [
          {
            id: 'doc_1',
            content: 'Texto del pensum',
            metadata: { source: 'Pensum 2026', document_type: 'pensum' },
            similarity: 0.92,
          },
        ],
        error: null,
      });

      const results = await searchDocuments('ingenieria de software', 3);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('doc_1');
      expect(results[0].metadata.source).toBe('Pensum 2026');
      expect(results[0].similarity).toBe(0.92);
      expect(mockRpc).toHaveBeenCalledWith('match_document_chunks', {
        query_embedding: [0.12, 0.45, 0.78],
        match_threshold: SIMILARITY_THRESHOLD,
        match_count: 3,
      });
    });

    it('debe arrojar error si falla la generación de embedding', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Fallo al invocar Edge Function' },
      });

      await expect(searchDocuments('consulta fallida')).rejects.toThrow(
        /Error generando embedding/,
      );
    });

    it('debe arrojar error si falla la función RPC de búsqueda', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: { embedding: [0.1] },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Timeout en consulta pgvector' },
      });

      await expect(searchDocuments('consulta fallida')).rejects.toThrow(
        /Error en búsqueda vectorial/,
      );
    });
  });

  describe('pingSupabase()', () => {
    it('debe retornar true cuando la consulta limit(1) es exitosa', async () => {
      mockLimit.mockResolvedValue({ data: [{ id: '1' }], error: null });

      const alive = await pingSupabase();
      expect(alive).toBe(true);
    });

    it('debe retornar false cuando la consulta a la tabla falla', async () => {
      mockLimit.mockResolvedValue({ data: null, error: { message: 'Tabla inaccesible' } });

      const alive = await pingSupabase();
      expect(alive).toBe(false);
    });
  });
});
