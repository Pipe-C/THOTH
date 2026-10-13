import { userRepository, IUserRepository, UserEntity } from '../repositories/user.repository.js';
import type { RegisterRequest, LoginRequest } from '../../lib/types.js';

const ALLOWED_DOMAIN = 'pascualbravo.edu.co';
const MIN_PASSWORD_LENGTH = 8;

export class ServiceValidationError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ServiceValidationError';
  }
}

export class AuthService {
  constructor(private userRepo: IUserRepository = userRepository) {}

  async registerUser(data: RegisterRequest): Promise<UserEntity> {
    const { email, password, displayName, profile } = data;

    // Validate email domain
    const normalized = email.trim().toLowerCase();
    if (!normalized.endsWith(`@${ALLOWED_DOMAIN}`)) {
      throw new ServiceValidationError(
        'INVALID_DOMAIN',
        `Solo se permiten correos del dominio @${ALLOWED_DOMAIN}. Recibido: ${email}`,
      );
    }

    // Validate profile
    if (!['estudiante', 'docente'].includes(profile)) {
      throw new ServiceValidationError(
        'VALIDATION_ERROR',
        `El campo "profile" debe ser "estudiante" o "docente". Recibido: "${profile}"`,
      );
    }

    // Validate password length
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ServiceValidationError(
        'VALIDATION_ERROR',
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
    }

    return this.userRepo.createUser({
      email: normalized,
      displayName,
      profile,
    });
  }

  async loginUser(data: LoginRequest): Promise<UserEntity> {
    const { email, password } = data;

    const normalized = email.trim().toLowerCase();
    if (!normalized.endsWith(`@${ALLOWED_DOMAIN}`)) {
      throw new ServiceValidationError(
        'INVALID_DOMAIN',
        `Solo se permiten correos del dominio @${ALLOWED_DOMAIN}.`,
      );
    }

    if (!password || password.length < 1) {
      throw new ServiceValidationError(
        'MISSING_FIELDS',
        'La contraseña es requerida.',
      );
    }

    return this.userRepo.authenticateUser({ email: normalized });
  }
}

export const authService = new AuthService();
