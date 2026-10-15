// ─────────────────────────────────────────────────────────────
// lib/repositories/userRepository.ts — Almacén de usuarios
// ─────────────────────────────────────────────────────────────
// Persistencia de usuarios en Supabase (`users` table).
// ─────────────────────────────────────────────────────────────

import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { getSupabaseClient } from '../supabase.js';
import type { UserProfile } from '../types.js';

export interface StoredUser {
  uid: string;
  email: string;
  displayName: string;
  profile: UserProfile;
  createdAt: string;
  passwordHash?: string;
}

export interface CreateUserData {
  email: string;
  password?: string;
  displayName: string;
  profile: UserProfile;
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

/** Genera un hash seguro de la contraseña utilizando scrypt con salt aleatorio. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

/** Compara una contraseña con el hash almacenado en formato salt:key. */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, keyHex] = storedHash.split(':');
    if (!salt || !keyHex) return false;
    const keyBuffer = Buffer.from(keyHex, 'hex');
    const derivedBuffer = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

/** Mapea una fila de la tabla `users` de Supabase al tipo StoredUser. */
function mapUserRow(row: {
  id: string;
  email: string;
  display_name: string;
  profile: string;
  created_at: string;
  password_hash?: string;
}): StoredUser {
  return {
    uid: row.id,
    email: row.email,
    displayName: row.display_name,
    profile: row.profile as UserProfile,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
  };
}

/** Busca un usuario por su correo electrónico normalizado en Supabase. */
export async function findByEmail(email: string): Promise<StoredUser | undefined> {
  const normalizedEmail = normalize(email);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, profile, created_at, password_hash')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error || !data) {
    return undefined;
  }

  return mapUserRow(data);
}

/** Persiste un usuario en la tabla `users` de Supabase y lo retorna. */
export async function save(user: CreateUserData): Promise<StoredUser> {
  const normalizedEmail = normalize(user.email);
  const supabase = getSupabaseClient();
  const passwordHash = user.password ? hashPassword(user.password) : '';

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: normalizedEmail,
      password_hash: passwordHash,
      display_name: user.displayName,
      profile: user.profile,
    })
    .select('id, email, display_name, profile, created_at, password_hash')
    .single();

  if (error || !data) {
    throw new Error(`[Supabase] Error al guardar usuario: ${error?.message ?? 'respuesta vacía'}`);
  }

  return mapUserRow(data);
}

/** Verifica las credenciales del usuario (correo y contraseña). */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<StoredUser | undefined> {
  const user = await findByEmail(email);
  if (!user || !user.passwordHash) return undefined;

  const matches = verifyPassword(password, user.passwordHash);
  return matches ? user : undefined;
}

/** Genera un identificador reproducible en caso de auxilio. */
export function createUid(email: string): string {
  return `usr_${normalize(email).split('@')[0]}`;
}

/** Elimina todos los usuarios (uso exclusivo en pruebas). */
export async function reset(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
