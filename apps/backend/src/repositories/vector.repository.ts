import { searchDocuments, pingSupabase } from '../../lib/supabase.js';
import type { VectorSearchResult } from '../../lib/types.js';

export interface IVectorRepository {
  searchDocuments(query: string, topK?: number): Promise<VectorSearchResult[]>;
  ping(): Promise<boolean>;
}

export class VectorRepository implements IVectorRepository {
  async searchDocuments(query: string, topK = 5): Promise<VectorSearchResult[]> {
    return searchDocuments(query, topK);
  }

  async ping(): Promise<boolean> {
    return pingSupabase();
  }
}

export const vectorRepository = new VectorRepository();
