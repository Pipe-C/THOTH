import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/repositories/userRepository.js', () => ({
  findByEmail: vi.fn(),
  save: vi.fn((user) =>
    Promise.resolve({
      uid: 'mock_123',
      email: user.email,
      displayName: user.displayName,
      profile: user.profile,
      createdAt: '2026-01-01T00:00:00.000Z',
    }),
  ),
  verifyCredentials: vi.fn(),
  createUid: vi.fn((email: string) => `mock_${email.split('@')[0]}`),
  reset: vi.fn(),
}));

import { login, register } from '../../lib/services/authService.js';
import * as userRepository from '../../lib/repositories/userRepository.js';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userRepository.save).mockImplementation((user) =>
      Promise.resolve({
        uid: 'mock_123',
        email: user.email,
        displayName: user.displayName,
        profile: user.profile,
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    vi.mocked(userRepository.findByEmail).mockResolvedValue(undefined);
    vi.mocked(userRepository.verifyCredentials).mockResolvedValue(undefined);
  });

  describe('register()', () => {
    it('falla con MISSING_FIELDS si faltan campos', async () => {
      const result = await register({ email: 'a@pascualbravo.edu.co' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.code).toBe('MISSING_FIELDS');
      }
    });

    it('falla con INVALID_DOMAIN para correos externos', async () => {
      const result = await register({
        email: 'x@gmail.com',
        password: 'Password123',
        displayName: 'X',
        profile: 'estudiante',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe('INVALID_DOMAIN');
    });

    it('falla con VALIDATION_ERROR para perfil no soportado', async () => {
      const result = await register({
        email: 'x@pascualbravo.edu.co',
        password: 'Password123',
        displayName: 'X',
        profile: 'rector' as never,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('falla con VALIDATION_ERROR para contraseña corta', async () => {
      const result = await register({
        email: 'x@pascualbravo.edu.co',
        password: '123',
        displayName: 'X',
        profile: 'estudiante',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('registra exitosamente y persiste el usuario', async () => {
      const result = await register({
        email: 'Nuevo@pascualbravo.edu.co',
        password: 'Password123',
        displayName: 'Nuevo',
        profile: 'docente',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.email).toBe('nuevo@pascualbravo.edu.co');
        expect(result.data.profile).toBe('docente');
        expect(result.data.uid).toBeDefined();
      }
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('login()', () => {
    it('falla con MISSING_FIELDS si faltan campos', async () => {
      const result = await login({ email: 'a@pascualbravo.edu.co' });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe('MISSING_FIELDS');
    });

    it('falla con INVALID_DOMAIN para correos externos', async () => {
      const result = await login({ email: 'x@yahoo.com', password: 'Password123' });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe('INVALID_DOMAIN');
    });

    it('falla con MISSING_FIELDS si la contraseña está vacía', async () => {
      const result = await login({ email: 'x@pascualbravo.edu.co', password: '' });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe('MISSING_FIELDS');
    });

    it('falla si las credenciales son inválidas', async () => {
      vi.mocked(userRepository.verifyCredentials).mockResolvedValue(undefined);

      const result = await login({
        email: 'desconocido@pascualbravo.edu.co',
        password: 'Password123',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('UNAUTHORIZED');
      }
    });

    it('inicia sesión exitosamente cuando las credenciales coinciden', async () => {
      vi.mocked(userRepository.verifyCredentials).mockResolvedValue({
        uid: 'uid_existente',
        email: 'conocido@pascualbravo.edu.co',
        displayName: 'Conocido',
        profile: 'docente',
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      const result = await login({
        email: 'conocido@pascualbravo.edu.co',
        password: 'Password123',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.uid).toBe('uid_existente');
        expect(result.data.profile).toBe('docente');
      }
    });
  });
});
