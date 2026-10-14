import { describe, it, expect, beforeEach } from 'vitest';
import * as userRepository from '../../lib/repositories/userRepository.js';

describe('userRepository', () => {
  beforeEach(() => {
    userRepository.reset();
  });

  it('save() persiste y retorna el usuario', () => {
    const user = userRepository.save({
      uid: 'u1',
      email: 'Ana@pascualbravo.edu.co',
      displayName: 'Ana',
      profile: 'estudiante',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(user.uid).toBe('u1');
    expect(userRepository.findByEmail('ana@pascualbravo.edu.co')?.uid).toBe('u1');
  });

  it('findByEmail() normaliza mayúsculas y espacios', () => {
    userRepository.save({
      uid: 'u2',
      email: '  Luis@pascualbravo.edu.co ',
      displayName: 'Luis',
      profile: 'docente',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(userRepository.findByEmail('LUIS@pascualbravo.edu.co')?.uid).toBe('u2');
  });

  it('findByEmail() retorna undefined si no existe', () => {
    expect(userRepository.findByEmail('nadie@pascualbravo.edu.co')).toBeUndefined();
  });

  it('createUid() genera un id reproducible a partir del correo', () => {
    expect(userRepository.createUid('Felipe.Cano@pascualbravo.edu.co')).toBe(
      'mock_felipe.cano',
    );
  });

  it('reset() limpia el almacén', () => {
    userRepository.save({
      uid: 'u3',
      email: 'tmp@pascualbravo.edu.co',
      displayName: 'Tmp',
      profile: 'estudiante',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    userRepository.reset();

    expect(userRepository.findByEmail('tmp@pascualbravo.edu.co')).toBeUndefined();
  });
});
