// ─────────────────────────────────────────────────────────────
// scripts/create-firebase-users.mjs — Crea cuentas demo en Firebase Auth
// ─────────────────────────────────────────────────────────────
// Usa la Firebase REST API para crear las cuentas de demostración
// del proyecto TOTH sin necesidad del Firebase Admin SDK.
//
// Requisitos:
//   - FIREBASE_API_KEY en el .env del backend o en la variable de entorno
//     (usar la misma que apps/mobile/.env → FIREBASE_API_KEY).
//
// Uso (desde apps/backend):
//   node scripts/create-firebase-users.mjs
//
// Las credenciales creadas son las mismas que aparecen en LoginScreen.tsx:
//   - estudiante.demo@pascualbravo.edu.co / estudiante2026
//   - docente.investigador@pascualbravo.edu.co / docente2026
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';

if (!FIREBASE_API_KEY) {
  console.error('[create-firebase-users] Falta FIREBASE_API_KEY en el entorno.');
  console.error('  Agrega FIREBASE_API_KEY=<tu-api-key> al archivo .env del backend.');
  console.error('  Puedes copiarla desde apps/mobile/.env');
  process.exit(1);
}

/** Usuarios demo para pruebas de la aplicación TOTH */
const DEMO_USERS = [
  {
    email: 'estudiante.demo@pascualbravo.edu.co',
    password: 'estudiante2026',
    displayName: 'Estudiante Demo TOTH',
    role: 'estudiante',
  },
  {
    email: 'docente.investigador@pascualbravo.edu.co',
    password: 'docente2026',
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
    // 2. Si el registro fue exitoso, actualizar el displayName
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

  // 3. Si falló el registro, verificar si es porque ya existe
  const errorCode = signUpData?.error?.message ?? '';

  if (errorCode === 'EMAIL_EXISTS') {
    console.log(`    ⚠ La cuenta ya existe. Verificando credenciales...`);

    const { ok: signInOk, data: signInData } = await firebasePost(
      'accounts:signInWithPassword',
      { email: user.email, password: user.password },
    );

    if (signInOk) {
      console.log(`    ✓ Cuenta existente validada correctamente.`);
      console.log(`      Email: ${user.email}`);
      console.log(`      UID: ${signInData.localId}`);
      return true;
    } else {
      const signInError = signInData?.error?.message ?? 'Error desconocido';
      console.error(`    ✗ La cuenta existe pero las credenciales no coinciden: ${signInError}`);
      console.error(`      Puede que la contraseña se haya cambiado en la consola de Firebase.`);
      console.error(`      Solución: ir a https://console.firebase.google.com → Authentication`);
      console.error(`      → Users → ${user.email} → Reset password.`);
      return false;
    }
  }

  // 4. Otro error
  console.error(`    ✗ Error inesperado al crear la cuenta: ${errorCode}`);
  if (errorCode.includes('API_KEY')) {
    console.error('      La FIREBASE_API_KEY puede ser incorrecta o no tener permisos de Auth.');
    console.error('      Verifica en Firebase Console → Project Settings → Web API Key.');
  }
  return false;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  TOTH — Creación de Usuarios Demo en Firebase Auth');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Proyecto: ${process.env.FIREBASE_PROJECT_ID ?? '(no definido en .env)'}`);
  console.log('');

  let created = 0;
  let failed = 0;

  for (const user of DEMO_USERS) {
    const ok = await ensureUser(user);
    if (ok) created++;
    else failed++;
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Resultado: ${created}/${DEMO_USERS.length} usuarios OK`);
  if (failed > 0) {
    console.log(`  Fallos: ${failed}. Revisar los mensajes de error anteriores.`);
  }
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('  Credenciales para usar en la app:');
  for (const u of DEMO_USERS) {
    console.log(`  • ${u.role.padEnd(12)} → ${u.email} / ${u.password}`);
  }
  console.log('');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('[create-firebase-users] Error inesperado:', err);
  process.exit(1);
});

