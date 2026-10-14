// ─────────────────────────────────────────────────────────────
// lib/repositories/userRepository.ts — Almacén de usuarios
// ─────────────────────────────────────────────────────────────
// Implementación en memoria para la Fase 3. En la Fase 4 se
// reemplaza el cuerpo por llamadas a Firebase Auth + Firestore,
// manteniendo exactamente esta interfaz para no tocar los servicios.
// ─────────────────────────────────────────────────────────────

import type { UserProfile } from '../types.js';

export interface StoredUser {
  uid: string;
  email: string;
  displayName: string;
  profile: UserProfile;
  createdAt: string;
}

/** Almacén en memoria (reemplazable por Firestore en la Fase 4). */
const users = new Map<string, StoredUser>();

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

/** Busca un usuario por su correo institucional normalizado. */
export function findByEmail(email: string): StoredUser | undefined {
  return users.get(normalize(email));
}

/** Persiste un usuario y lo retorna. */
export function save(user: StoredUser): StoredUser {
  users.set(normalize(user.email), user);
  return user;
}

/** Genera un identificador reproducible para el modo mock. */
export function createUid(email: string): string {
  return `mock_${normalize(email).split('@')[0]}`;
}

/** Limpia el almacén (uso en pruebas). */
export function reset(): void {
  users.clear();
}
