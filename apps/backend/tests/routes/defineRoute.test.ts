import { describe, it, expect, vi } from 'vitest';
import { defineRoute } from '../../lib/routes/defineRoute.js';
import { createMockHttp } from '../helpers/mockHttp.js';

describe('defineRoute', () => {
  it('invoca el controlador cuando el método coincide', async () => {
    const handler = vi.fn();
    const route = defineRoute('POST', handler);

    const { req, res, state } = createMockHttp('POST');
    await route(req, res);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(state.statusCode).toBe(200);
  });

  it('responde 405 y no invoca el controlador con método incorrecto', async () => {
    const handler = vi.fn();
    const route = defineRoute('GET', handler);

    const { req, res, state } = createMockHttp('POST');
    await route(req, res);

    expect(handler).not.toHaveBeenCalled();
    expect(state.statusCode).toBe(405);
    expect(state.body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('acepta múltiples métodos permitidos', async () => {
    const handler = vi.fn();
    const route = defineRoute(['GET', 'POST'], handler);

    const { req, res } = createMockHttp('GET');
    await route(req, res);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
