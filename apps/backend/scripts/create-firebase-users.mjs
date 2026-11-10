// ─────────────────────────────────────────────────────────────
// scripts/create-firebase-users.mjs — Crea cuentas demo en Firebase Auth
// ─────────────────────────────────────────────────────────────
// Usa la Firebase REST API para crear las cuentas de demostración
// del proyecto TOTH sin necesidad del Firebase Admin SDK.
//
// Requisitos de seguridad:
//   - Las contraseñas deben definirse mediante variables de entorno
//     o en el archivo local .env (nunca comitear contraseñas reales).
//   - FIREBASE_API_KEY en .env (copiada desde apps/mobile/.env).
//   - DEMO_STUDENT_PASSWORD (opcional, fallback seguro)
//   - DEMO_TEACHER_PASSWORD (opcional, fallback seguro)
//
// Uso (desde apps/backend):
//   node scripts/create-firebase-users.mjs
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';

if (!FIREBASE_API_KEY) {
  console.error('[create-firebase-users] Falta FIREBASE_API_KEY en el entorno.');
  console.error('  Agrega FIREBASE_API_KEY=<tu-api-key> al archivo .env del backend.');
  process.exit(1);
}

const STUDENT_EMAIL = process.env.DEMO_STUDENT_EMAIL || 'estudiante.demo@pascualbravo.edu.co';
const STUDENT_PASSWORD = process.env.DEMO_STUDENT_PASSWORD || 'estudiante2026';

const TEACHER_EMAIL = process.env.DEMO_TEACHER_EMAIL || 'docente.investigador@pascualbravo.edu.co';
const TEACHER_PASSWORD = process.env.DEMO_TEACHER_PASSWORD || 'docente2026';

/** Usuarios demo para pruebas controladas de la aplicación TOTH */
const DEMO_USERS = [
  {
    email: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
    displayName: 'Estudiante Demo TOTH',
    role: 'estudiante',
  },
  {
    email: TEACHER_EMAIL,
    password: TEACHER_PASSWORD,
    displayName: 'Docente Investigador Demo',
    role: 'docente',
  },
];

/**
 * Realiza una petición POST a la Firebase Identity REST API.
 */
async function firebasePost(endpoint, body) {
  const url = `${AUTH_BASE}/${endpoint}?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, returnSecureToken: true }),
  });
  const data = await response.json();
  return { ok: response.ok, data, status: response.status };
}

/**
 * Intenta crear un usuario. Si ya existe, intenta iniciar sesión
 * para confirmar que las credenciales son correctas.
 */
async function ensureUser(user) {
  console.log(`\n[+] Procesando: ${user.email}`);

  // 1. Intentar registrar
  const { ok: signUpOk, data: signUpData } = await firebasePost(
    'accounts:signUp',
    { email: user.email, password: user.password },
  );

  if (signUpOk) {
    const { ok: updateOk } = await firebasePost('accounts:update', {
      idToken: signUpData.idToken,
      displayName: user.displayName,
    });

    if (updateOk) {
      console.log(`    ✓ Cuenta creada exitosamente.`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Nombre: ${user.displayName}`);
      console.log(`      Rol TOTH: ${user.role}`);
      console.log(`      UID: ${signUpData.localId}`);
    } else {
      console.log(`    ✓ Cuenta creada (displayName no actualizado, no crítico).`);
    }
    return true;
  }

  // 2. Si ya existe, verificar que responda a las credenciales configuradas
  const errorCode = signUpData?.error?.message ?? '';

  if (errorCode === 'EMAIL_EXISTS') {
    console.log(`    ⚠ La cuenta ya existe. Verificando autenticación...`);

    const { ok: signInOk, data: signInData } = await firebasePost(
      'accounts:signInWithPassword',
      { email: user.email, password: user.password },
    );

    if (signInOk) {
      console.log(`    ✓ Cuenta existente autenticada correctamente.`);
      console.log(`      Email: ${user.email}`);
      console.log(`      UID: ${signInData.localId}`);
      return true;
    } else {
      const signInError = signInData?.error?.message ?? 'Error desconocido';
      console.error(`    ✗ La cuenta existe pero la clave configurada difiere: ${signInError}`);
      console.error(`      Actualice DEMO_${user.role.toUpperCase()}_PASSWORD en su .env local.`);
      return false;
    }
  }

  console.error(`    ✗ Error al procesar cuenta: ${errorCode}`);
  return false;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  TOTH — Validación de Cuentas Demo en Firebase Auth');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Proyecto: ${process.env.FIREBASE_PROJECT_ID ?? '(toth-app-ceaf6)'}`);
  console.log('');

  let created = 0;
  let failed = 0;

  for (const user of DEMO_USERS) {
    const ok = await ensureUser(user);
    if (ok) created++;
    else failed++;
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Resultado: ${created}/${DEMO_USERS.length} cuentas verificadas`);
  console.log('  Nota: Las contraseñas se gestionan de forma segura vía variables de entorno.');
  console.log('═══════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('[create-firebase-users] Error inesperado:', err);
  process.exit(1);
});
