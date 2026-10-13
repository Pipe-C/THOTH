import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('debe rechazar solicitudes con campos incompletos con 400', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'juan@pascualbravo.edu.co' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    it('debe rechazar correos que no pertenezcan al dominio @pascualbravo.edu.co', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'usuario@gmail.com',
          password: 'Password123!',
          displayName: 'Usuario Externo',
          profile: 'estudiante',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_DOMAIN');
    });

    it('debe rechazar perfiles no soportados', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'usuario@pascualbravo.edu.co',
          password: 'Password123!',
          displayName: 'Usuario',
          profile: 'administrador',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe rechazar contraseñas con menos de 8 caracteres', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'usuario@pascualbravo.edu.co',
          password: '1234',
          displayName: 'Usuario',
          profile: 'estudiante',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe registrar exitosamente un usuario institucional válido con 201', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'felipe.cano131@pascualbravo.edu.co',
          password: 'PasswordSegura2026',
          displayName: 'Felipe Cano',
          profile: 'estudiante',
        });

      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.email).toBe('felipe.cano131@pascualbravo.edu.co');
      expect(response.body.data.profile).toBe('estudiante');
      expect(response.body.data.uid).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('debe rechazar si faltan campos obligatorios con 400', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'felipe@pascualbravo.edu.co' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    it('debe rechazar correos no institucionales con 400', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'intruso@yahoo.es',
          password: '12345678password',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_DOMAIN');
    });

    it('debe rechazar contraseña vacía con 400', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'felipe.cano131@pascualbravo.edu.co',
          password: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    it('debe iniciar sesión exitosamente para usuario institucional', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'felipe.cano131@pascualbravo.edu.co',
          password: 'PasswordSegura2026',
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.email).toBe('felipe.cano131@pascualbravo.edu.co');
      expect(response.body.data.idToken).toBeDefined();
    });
  });
});
