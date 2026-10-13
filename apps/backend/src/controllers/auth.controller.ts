import type { Request, Response } from 'express';
import { authService, AuthService, ServiceValidationError } from '../services/auth.service.js';
import { sendSuccess, sendError, requireFields, ErrorCode } from '../../lib/response.js';
import type { RegisterRequest, LoginRequest } from '../../lib/types.js';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as Partial<RegisterRequest>;

    const missing = requireFields(body as RegisterRequest, [
      'email',
      'password',
      'displayName',
      'profile',
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
      const user = await this.service.registerUser(body as RegisterRequest);
      sendSuccess(res as any, user, 201);
    } catch (err) {
      if (err instanceof ServiceValidationError) {
        sendError(
          res as any,
          400,
          err.code as any,
          err.message,
        );
        return;
      }
      sendError(
        res as any,
        500,
        ErrorCode.INTERNAL_ERROR,
        'Error en el proceso de registro.',
        err instanceof Error ? err.message : String(err),
      );
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as Partial<LoginRequest>;

    const missing = requireFields(body as LoginRequest, ['email', 'password']);
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
      const result = await this.service.loginUser(body as LoginRequest);
      sendSuccess(res as any, result, 200);
    } catch (err) {
      if (err instanceof ServiceValidationError) {
        sendError(
          res as any,
          400,
          err.code as any,
          err.message,
        );
        return;
      }
      sendError(
        res as any,
        500,
        ErrorCode.INTERNAL_ERROR,
        'Error en el inicio de sesión.',
        err instanceof Error ? err.message : String(err),
      );
    }
  };
}

export const authController = new AuthController();
