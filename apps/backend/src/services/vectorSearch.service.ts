import { vectorRepository, IVectorRepository } from '../repositories/vector.repository.js';
import { SIMILARITY_THRESHOLD } from '../../lib/supabase.js';
import type { VectorSearchResult } from '../../lib/types.js';

const MAX_TOP_K = 20;
const DEFAULT_TOP_K = 5;

export interface VectorSearchServiceResult {
  results: VectorSearchResult[];
  meta: {
    query: string;
    topK: number;
    totalFound: number;
    similarityThreshold: number;
    latencyMs: number;
  };
}

export class VectorSearchService {
  constructor(private vectorRepo: IVectorRepository = vectorRepository) {}

  async search(query: string, rawTopK?: number): Promise<VectorSearchServiceResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new Error('El campo "query" no puede estar vacío.');
    }

    const topK = rawTopK !== undefined
      ? Math.min(Math.max(1, rawTopK), MAX_TOP_K)
      : DEFAULT_TOP_K;

    const startTime = Date.now();
    const results = await this.vectorRepo.searchDocuments(trimmed, topK);
    const latencyMs = Date.now() - startTime;

    return {
      results,
      meta: {
        query: trimmed,
        topK,
        totalFound: results.length,
        similarityThreshold: SIMILARITY_THRESHOLD,
        latencyMs,
      },
    };
  }
}

export const vectorSearchService = new VectorSearchService();
