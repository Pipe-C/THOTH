import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase.js', () => ({
  searchDocuments: vi.fn(),
  pingSupabase: vi.fn(),
  SIMILARITY_THRESHOLD: 0.75,
}));

import {
  findSimilarChunks,
  isReachable,
  SIMILARITY_THRESHOLD,
} from '../../lib/repositories/documentRepository.js';
import { searchDocuments, pingSupabase } from '../../lib/supabase.js';

describe('documentRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findSimilarChunks() delega en searchDocuments con query y topK', async () => {
    vi.mocked(searchDocuments).mockResolvedValue([
      {
        id: 'c1',
        content: 'Fragmento del pensum',
        similarity: 0.9,
        metadata: { source: 'pensum.pdf', document_type: 'pensum' },
      },
    ]);

    const result = await findSimilarChunks('ingenieria', 4);

    expect(searchDocuments).toHaveBeenCalledWith('ingenieria', 4);
    expect(result).toHaveLength(1);
  });

  it('isReachable() delega en pingSupabase', async () => {
    vi.mocked(pingSupabase).mockResolvedValue(true);

    await expect(isReachable()).resolves.toBe(true);
    expect(pingSupabase).toHaveBeenCalledTimes(1);
  });

  it('reexporta SIMILARITY_THRESHOLD del cliente de Supabase', () => {
    expect(SIMILARITY_THRESHOLD).toBe(0.75);
  });
});
