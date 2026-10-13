import type { Request, Response } from 'express';
import { healthService, HealthService } from '../services/health.service.js';
import { sendSuccess, sendError, ErrorCode } from '../../lib/response.js';

export class HealthController {
  constructor(private service: HealthService = healthService) {}

  checkHealth = async (_req: Request, res: Response): Promise<void> => {
    try {
      const report = await this.service.checkStatus();
      const statusCode = report.status === 'healthy' ? 200 : 503;
      sendSuccess(res as any, report, statusCode);
    } catch (err) {
      sendError(
        res as any,
        500,
        ErrorCode.INTERNAL_ERROR,
        'Error al verificar el estado del sistema.',
        err instanceof Error ? err.message : String(err),
      );
    }
  };
}

export const healthController = new HealthController();
