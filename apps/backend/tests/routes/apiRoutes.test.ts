import { describe, it, expect } from 'vitest';
import { API_ROUTES, findRoute } from '../../lib/routes/apiRoutes.js';

describe('apiRoutes registry', () => {
  it('registra los 5 endpoints de la API v1', () => {
    expect(API_ROUTES).toHaveLength(5);
    expect(API_ROUTES.map((r) => r.path)).toEqual([
      '/api/v1/health',
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/vector-search',
      '/api/v1/generate',
    ]);
  });

  it('cada ruta declara método, entrada y controlador', () => {
    for (const route of API_ROUTES) {
      expect(route.method).toMatch(/^(GET|POST)$/);
      expect(route.entry).toMatch(/^api\/v1\/.+\.ts$/);
      expect(route.controller).toMatch(/^controllers\/.+\.ts$/);
    }
  });

  it('findRoute() retorna la definición por path y undefined si no existe', () => {
    expect(findRoute('/api/v1/generate')?.method).toBe('POST');
    expect(findRoute('/api/v1/inexistente')).toBeUndefined();
  });
});
