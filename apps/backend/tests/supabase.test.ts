import { describe, it, expect } from 'vitest';
import { getSupabaseClient, pingSupabase, SIMILARITY_THRESHOLD } from '../lib/supabase.js';

describe('Supabase Client Helper', () => {
  it('debe tener un SIMILARITY_THRESHOLD numérico válido por defecto', () => {
    expect(typeof SIMILARITY_THRESHOLD).toBe('number');
    expect(SIMILARITY_THRESHOLD).toBeGreaterThanOrEqual(0);
    expect(SIMILARITY_THRESHOLD).toBeLessThanOrEqual(1);
  });

  it('debe arrojar error si SUPABASE_URL o KEY no están definidas', () => {
    const origUrl = process.env.SUPABASE_URL;
    const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => getSupabaseClient()).toThrow(/SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY/);

    if (origUrl) process.env.SUPABASE_URL = origUrl;
    if (origKey) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
  });

  it('pingSupabase() debe retornar false cuando las credenciales no están configuradas', async () => {
    const origUrl = process.env.SUPABASE_URL;
    delete process.env.SUPABASE_URL;

    const alive = await pingSupabase();
    expect(alive).toBe(false);

    if (origUrl) process.env.SUPABASE_URL = origUrl;
  });
});
