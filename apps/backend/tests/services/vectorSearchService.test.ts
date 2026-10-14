import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/repositories/documentRepository.js', () => ({
  findSimilarChunks: vi.fn(),
}));

import { performVectorSearch } from '../../lib/services/vectorSearchService.js';
import { findSimilarChunks } from '../../lib/repositories/documentRepository.js';

describe('vectorSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delega en findSimilarChunks con query y topK', async () => {
    vi.mocked(findSimilarChunks).mockResolvedValue([]);

    await performVectorSearch('requisitos de grado', 3);

    expect(findSimilarChunks).toHaveBeenCalledWith('requisitos de grado', 3);
  });

  it('propaga el error del repositorio', async () => {
    vi.mocked(findSimilarChunks).mockRejectedValue(new Error('[Supabase] caído'));

    await expect(performVectorSearch('x', 1)).rejects.toThrow('[Supabase] caído');
  });
});
