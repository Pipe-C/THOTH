import type { Request, Response } from 'express';
import { vectorSearchService, VectorSearchService } from '../services/vectorSearch.service.js';
import { sendSuccess, sendError, requireFields, ErrorCode } from '../../lib/response.js';
import type { VectorSearchRequest } from '../../lib/types.js';

export class VectorSearchController {
  constructor(private service: VectorSearchService = vectorSearchService) {}

  search = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as Partial<VectorSearchRequest>;

    const missing = requireFields(body as VectorSearchRequest, ['query']);
    if (missing.length > 0) {
      sendError(
        res as any,
        400,
        ErrorCode.MISSING_FIELDS,
        'El campo "query" es requerido.',
      );
      return;
    }

    const { query, topK } = body as VectorSearchRequest;

    if (!query || !query.trim()) {
      sendError(
        res as any,
        400,
        ErrorCode.VALIDATION_ERROR,
        'El campo "query" no puede estar vacío.',
      );
      return;
    }

    try {
      const searchResult = await this.service.search(query, topK);
      sendSuccess(res as any, searchResult, 200);
    } catch (err) {
      sendError(
        res as any,
        500,
        ErrorCode.DB_ERROR,
        'Error al realizar la búsqueda en la base de datos vectorial.',
        err instanceof Error ? err.message : String(err),
      );
    }
  };
}

export const vectorSearchController = new VectorSearchController();
