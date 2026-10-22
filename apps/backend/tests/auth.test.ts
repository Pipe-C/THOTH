import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabase.js', () => ({
  getSupabaseClient: vi.fn(),
  SIMILARITY_THRESHOLD: 0.75,
}));

import registerHandler from '../api/v1/auth/register.js';
import loginHandler from '../api/v1/auth/login.js';
import { createMockHttp } from './helpers/mockHttp.js';
import { getSupabaseClient } from '../lib/supabase.js';
import * as userRepository from '../lib/repositories/userRepository.js';

describe('Auth Endpoints', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'usr_123',
          email: 'felipe.cano131@pascualbravo.edu.co',
          display_name: 'Felipe Cano',
          profile: 'estudiante',
          created_at: '2026-01-01T00:00:00.000Z',
        },
        error: null,
      }),
    };
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  describe('POST /api/v1/auth/register', () => {
    it('debe rechazar métodos distintos a POST con 405', async () => {
      const { req, res, state } = createMockHttp('GET');
      await registerHandler(req, res);

      expect(state.statusCode).toBe(405);
      expect(state.body.error.code).toBe('METHOD_NOT_ALLOWED');
    });

    it('debe rechazar solicitudes con campos incompletos con 400', async () => {
      const { req, res, state } = createMockHttp('POST', { email: 'juan@pascualbravo.edu.co' });
      await registerHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('MISSING_FIELDS');
    });

    it('debe rechazar correos que no pertenezcan al dominio @pascualbravo.edu.co', async () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'usuario@gmail.com',
        password: 'Password123!',
        displayName: 'Usuario Externo',
        profile: 'estudiante',
      });
      await registerHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('INVALID_DOMAIN');
    });

    it('debe rechazar perfiles no soportados', async () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'usuario@pascualbravo.edu.co',
        password: 'Password123!',
        displayName: 'Usuario',
        profile: 'administrador',
      });
      await registerHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe rechazar contraseñas con menos de 8 caracteres', async () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'usuario@pascualbravo.edu.co',
        password: '1234',
        displayName: 'Usuario',
        profile: 'estudiante',
      });
      await registerHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe registrar exitosamente un usuario institucional válido con 201', async () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'felipe.cano131@pascualbravo.edu.co',
        password: 'PasswordSegura2026',
        displayName: 'Felipe Cano',
        profile: 'estudiante',
      });
      await registerHandler(req, res);

      expect(state.statusCode).toBe(201);
      expect(state.body.ok).toBe(true);
      expect(state.body.data.email).toBe('felipe.cano131@pascualbravo.edu.co');
      expect(state.body.data.profile).toBe('estudiante');
      expect(state.body.data.uid).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('debe rechazar si faltan campos obligatorios con 400', async () => {
      const { req, res, state } = createMockHttp('POST', { email: 'felipe@pascualbravo.edu.co' });
      await loginHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('MISSING_FIELDS');
    });

    it('debe rechazar correos no institucionales con 400', async () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'intruso@yahoo.es',
        password: '12345678password',
      });
      await loginHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('INVALID_DOMAIN');
    });

    it('debe rechazar contraseña vacía con 400', async () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'felipe.cano131@pascualbravo.edu.co',
        password: '',
      });
      await loginHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('MISSING_FIELDS');
    });

    it('debe iniciar sesión exitosamente para usuario institucional existente', async () => {
      const passwordHash = userRepository.hashPassword('PasswordSegura2026');
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'usr_123',
          email: 'felipe.cano131@pascualbravo.edu.co',
          display_name: 'Felipe Cano',
          profile: 'estudiante',
          created_at: '2026-01-01T00:00:00.000Z',
          password_hash: passwordHash,
        },
        error: null,
      });

      const { req, res, state } = createMockHttp('POST', {
        email: 'felipe.cano131@pascualbravo.edu.co',
        password: 'PasswordSegura2026',
      });
      await loginHandler(req, res);

      expect(state.statusCode).toBe(200);
      expect(state.body.ok).toBe(true);
      expect(state.body.data.email).toBe('felipe.cano131@pascualbravo.edu.co');
      expect(state.body.data.idToken).toBeDefined();
    });
  });
});
