import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../lib/supabase.js', () => ({
  pingSupabase: vi.fn(),
  SIMILARITY_THRESHOLD: 0.75,
}));

vi.mock('../lib/gemini.js', () => ({
  pingGemini: vi.fn(),
}));

import app from '../src/app.js';
import { pingSupabase } from '../lib/supabase.js';
import { pingGemini } from '../lib/gemini.js';

describe('Health Endpoint (GET /api/v1/health)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe responder 200 y status healthy cuando todos los servicios responden OK', async () => {
    vi.mocked(pingSupabase).mockResolvedValue(true);
    vi.mocked(pingGemini).mockResolvedValue(true);

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.services.supabase).toBe(true);
    expect(response.body.data.services.gemini).toBe(true);
  });

  it('debe responder 503 y status degraded cuando algún servicio no está disponible', async () => {
    vi.mocked(pingSupabase).mockResolvedValue(false);
    vi.mocked(pingGemini).mockResolvedValue(true);

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.status).toBe('degraded');
    expect(response.body.data.services.supabase).toBe(false);
  });
});
