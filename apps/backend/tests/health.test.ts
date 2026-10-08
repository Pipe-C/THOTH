import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock de servicios externos con la ruta relativa correcta desde /tests
vi.mock('../lib/supabase.js', () => ({
  pingSupabase: vi.fn(),
  SIMILARITY_THRESHOLD: 0.75,
}));

vi.mock('../lib/gemini.js', () => ({
  pingGemini: vi.fn(),
}));

import healthHandler from '../api/v1/health.js';
import { pingSupabase } from '../lib/supabase.js';
import { pingGemini } from '../lib/gemini.js';

function createMockHttp(method: string) {
  const req = { method } as unknown as VercelRequest;
  const state = { statusCode: 200, body: null as any };
  const res = {
    status: vi.fn((code: number) => {
      state.statusCode = code;
      return res;
    }),
    setHeader: vi.fn(),
    json: vi.fn((data: unknown) => {
      state.body = data;
      return res;
    }),
  } as unknown as VercelResponse;

  return { req, res, state };
}

describe('Health Endpoint (GET /api/v1/health)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe rechazar métodos distintos a GET con 405', async () => {
    const { req, res, state } = createMockHttp('POST');
    await healthHandler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('debe responder 200 y status healthy cuando todos los servicios responden OK', async () => {
    vi.mocked(pingSupabase).mockResolvedValue(true);
    vi.mocked(pingGemini).mockResolvedValue(true);

    const { req, res, state } = createMockHttp('GET');
    await healthHandler(req, res);

    expect(state.statusCode).toBe(200);
    expect(state.body.ok).toBe(true);
    expect(state.body.data.status).toBe('healthy');
    expect(state.body.data.services.supabase).toBe(true);
    expect(state.body.data.services.gemini).toBe(true);
  });

  it('debe responder 503 y status degraded cuando algún servicio no está disponible', async () => {
    vi.mocked(pingSupabase).mockResolvedValue(false);
    vi.mocked(pingGemini).mockResolvedValue(true);

    const { req, res, state } = createMockHttp('GET');
    await healthHandler(req, res);

    expect(state.statusCode).toBe(503);
    expect(state.body.ok).toBe(true);
    expect(state.body.data.status).toBe('degraded');
    expect(state.body.data.services.supabase).toBe(false);
  });
});
