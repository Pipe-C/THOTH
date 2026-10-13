import type { Request, Response } from 'express';
import { generateService, GenerateService } from '../services/generate.service.js';
import { sendSuccess, sendError, requireFields, ErrorCode } from '../../lib/response.js';
import type { GenerateRequest } from '../../lib/types.js';

export class GenerateController {
  constructor(private service: GenerateService = generateService) {}

  generate = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as Partial<GenerateRequest>;

    const missing = requireFields(body as GenerateRequest, [
      'prompt',
      'profile',
      'documentType',
      'userId',
    ]);

    if (missing.length > 0) {
      sendError(
        res as any,
        400,
        ErrorCode.MISSING_FIELDS,
        `Campos requeridos faltantes: ${missing.join(', ')}`,
      );
      return;
    }

    try {
      const responseData = await this.service.generateDocument(
        body as GenerateRequest,
      );
      sendSuccess(res as any, responseData, 200);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes('El campo "profile"') || message.includes('El campo "documentType"')) {
        sendError(
          res as any,
          400,
          ErrorCode.VALIDATION_ERROR,
          message,
        );
        return;
      }

      if (message.includes('[Gemini]')) {
        sendError(
          res as any,
          502,
          ErrorCode.LLM_ERROR,
          'Error al comunicarse con el modelo de lenguaje.',
          message,
        );
        return;
      }

      if (message.includes('[Supabase]')) {
        sendError(
          res as any,
          502,
          ErrorCode.DB_ERROR,
          'Error al acceder a la base de datos vectorial.',
          message,
        );
        return;
      }

      sendError(
        res as any,
        500,
        ErrorCode.INTERNAL_ERROR,
        'Error interno del servidor al procesar la solicitud.',
        message,
      );
    }
  };
}

export const generateController = new GenerateController();
