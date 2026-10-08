import { describe, it, expect } from 'vitest';
import registerHandler from '../api/v1/auth/register.js';
import loginHandler from '../api/v1/auth/login.js';
import { createMockHttp } from './helpers/mockHttp.js';

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('debe rechazar métodos distintos a POST con 405', () => {
      const { req, res, state } = createMockHttp('GET');
      registerHandler(req, res);

      expect(state.statusCode).toBe(405);
      expect(state.body.error.code).toBe('METHOD_NOT_ALLOWED');
    });

    it('debe rechazar solicitudes con campos incompletos con 400', () => {
      const { req, res, state } = createMockHttp('POST', { email: 'juan@pascualbravo.edu.co' });
      registerHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('MISSING_FIELDS');
    });

    it('debe rechazar correos que no pertenezcan al dominio @pascualbravo.edu.co', () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'usuario@gmail.com',
        password: 'Password123!',
        displayName: 'Usuario Externo',
        profile: 'estudiante',
      });
      registerHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('INVALID_DOMAIN');
    });

    it('debe rechazar perfiles no soportados', () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'usuario@pascualbravo.edu.co',
        password: 'Password123!',
        displayName: 'Usuario',
        profile: 'administrador',
      });
      registerHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe rechazar contraseñas con menos de 8 caracteres', () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'usuario@pascualbravo.edu.co',
        password: '1234',
        displayName: 'Usuario',
        profile: 'estudiante',
      });
      registerHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe registrar exitosamente un usuario institucional válido con 201', () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'felipe.cano131@pascualbravo.edu.co',
        password: 'PasswordSegura2026',
        displayName: 'Felipe Cano',
        profile: 'estudiante',
      });
      registerHandler(req, res);

      expect(state.statusCode).toBe(201);
      expect(state.body.ok).toBe(true);
      expect(state.body.data.email).toBe('felipe.cano131@pascualbravo.edu.co');
      expect(state.body.data.profile).toBe('estudiante');
      expect(state.body.data.uid).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('debe rechazar si faltan campos obligatorios con 400', () => {
      const { req, res, state } = createMockHttp('POST', { email: 'felipe@pascualbravo.edu.co' });
      loginHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('MISSING_FIELDS');
    });

    it('debe rechazar correos no institucionales con 400', () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'intruso@yahoo.es',
        password: '12345678password',
      });
      loginHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('INVALID_DOMAIN');
    });

    it('debe rechazar contraseña vacía con 400', () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'felipe.cano131@pascualbravo.edu.co',
        password: '',
      });
      loginHandler(req, res);

      expect(state.statusCode).toBe(400);
      expect(state.body.error.code).toBe('MISSING_FIELDS');
    });

    it('debe iniciar sesión exitosamente para usuario institucional', () => {
      const { req, res, state } = createMockHttp('POST', {
        email: 'felipe.cano131@pascualbravo.edu.co',
        password: 'PasswordSegura2026',
      });
      loginHandler(req, res);

      expect(state.statusCode).toBe(200);
      expect(state.body.ok).toBe(true);
      expect(state.body.data.email).toBe('felipe.cano131@pascualbravo.edu.co');
      expect(state.body.data.idToken).toBeDefined();
    });
  });
});
