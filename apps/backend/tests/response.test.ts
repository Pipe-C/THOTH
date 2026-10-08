import { describe, it, expect, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  sendSuccess,
  sendError,
  requireMethod,
  requireFields,
  ErrorCode,
} from '../lib/response.js';

function createMockResponse(): {
  res: VercelResponse;
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
} {
  const state = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as unknown,
  };

  const res = {
    status: vi.fn((code: number) => {
      state.statusCode = code;
      return res;
    }),
    setHeader: vi.fn((key: string, value: string) => {
      state.headers[key] = value;
      return res;
    }),
    json: vi.fn((data: unknown) => {
      state.body = data;
      return res;
    }),
  } as unknown as VercelResponse;

  return { res, ...state, get statusCode() { return state.statusCode; }, get body() { return state.body; } };
}

describe('response standard', () => {
  describe('sendSuccess()', () => {
    it('debe estructurar la respuesta con ok: true, version v1 y metadata', () => {
      const mock = createMockResponse();
      const testData = { userId: '123', name: 'Estudiante Prueba' };

      sendSuccess(mock.res, testData, 201);

      expect(mock.statusCode).toBe(201);
      const body = mock.body as any;
      expect(body.ok).toBe(true);
      expect(body.version).toBe('v1');
      expect(body.data).toEqual(testData);
      expect(body.meta).toBeDefined();
      expect(body.meta.requestId).toMatch(/^toth-\d+-[a-f0-9-]+$/);
      expect(body.meta.timestamp).toBeDefined();
    });
  });

  describe('sendError()', () => {
    it('debe estructurar el error con ok: false y códigos estandarizados', () => {
      const mock = createMockResponse();

      sendError(mock.res, 400, ErrorCode.VALIDATION_ERROR, 'Dato inválido', 'detalle técnico');

      expect(mock.statusCode).toBe(400);
      const body = mock.body as any;
      expect(body.ok).toBe(false);
      expect(body.version).toBe('v1');
      expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(body.error.message).toBe('Dato inválido');
      expect(body.error.detail).toBe('detalle técnico');
      expect(body.meta.requestId).toBeDefined();
    });
  });

  describe('requireMethod()', () => {
    it('debe retornar true si el método HTTP coincide', () => {
      const req = { method: 'POST' } as VercelRequest;
      const mock = createMockResponse();

      const valid = requireMethod(req, mock.res, 'POST');

      expect(valid).toBe(true);
      expect(mock.statusCode).toBe(200);
    });

    it('debe rechazar con 405 si el método no coincide', () => {
      const req = { method: 'GET' } as VercelRequest;
      const mock = createMockResponse();

      const valid = requireMethod(req, mock.res, 'POST');

      expect(valid).toBe(false);
      expect(mock.statusCode).toBe(405);
      const body = mock.body as any;
      expect(body.error.code).toBe(ErrorCode.METHOD_NOT_ALLOWED);
    });
  });

  describe('requireFields()', () => {
    it('debe identificar campos requeridos faltantes', () => {
      const payload = { email: 'test@pascualbravo.edu.co' };
      const missing = requireFields(payload as any, ['email', 'password', 'displayName']);

      expect(missing).toEqual(['password', 'displayName']);
    });

    it('debe devolver arreglo vacío si todos los campos están presentes', () => {
      const payload = { email: 'a@b.com', password: '123' };
      const missing = requireFields(payload, ['email', 'password']);

      expect(missing).toHaveLength(0);
    });
  });
});
