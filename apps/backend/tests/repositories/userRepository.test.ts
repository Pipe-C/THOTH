import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/supabase.js', () => ({
  getSupabaseClient: vi.fn(),
  SIMILARITY_THRESHOLD: 0.75,
}));

import * as userRepository from '../../lib/repositories/userRepository.js';
import { getSupabaseClient } from '../../lib/supabase.js';

describe('userRepository', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'u1',
          email: 'ana@pascualbravo.edu.co',
          display_name: 'Ana',
          profile: 'estudiante',
          created_at: '2026-01-01T00:00:00.000Z',
        },
        error: null,
      }),
    };
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  it('save() persiste y retorna el usuario', async () => {
    const user = await userRepository.save({
      email: 'Ana@pascualbravo.edu.co',
      password: 'Password123',
      displayName: 'Ana',
      profile: 'estudiante',
    });

    expect(user.uid).toBe('u1');
    expect(user.email).toBe('ana@pascualbravo.edu.co');
    expect(mockSupabase.insert).toHaveBeenCalledTimes(1);
  });

  it('findByEmail() consulta Supabase con correo normalizado', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'u2',
        email: 'luis@pascualbravo.edu.co',
        display_name: 'Luis',
        profile: 'docente',
        created_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    });

    const user = await userRepository.findByEmail('  LUIS@pascualbravo.edu.co ');

    expect(user?.uid).toBe('u2');
    expect(mockSupabase.eq).toHaveBeenCalledWith('email', 'luis@pascualbravo.edu.co');
  });

  it('findByEmail() retorna undefined si no existe', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const user = await userRepository.findByEmail('nadie@pascualbravo.edu.co');
    expect(user).toBeUndefined();
  });

  it('hashPassword() y verifyPassword() funcionan correctamente', () => {
    const hash = userRepository.hashPassword('PasswordSegura123');
    expect(userRepository.verifyPassword('PasswordSegura123', hash)).toBe(true);
    expect(userRepository.verifyPassword('PasswordIncorrecta', hash)).toBe(false);
  });

  it('createUid() genera un id reproducible a partir del correo', () => {
    expect(userRepository.createUid('Felipe.Cano@pascualbravo.edu.co')).toBe(
      'usr_felipe.cano',
    );
  });
});
