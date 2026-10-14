// ─────────────────────────────────────────────────────────────
// api/v1/auth/login.ts — Endpoint 3: Inicio de sesión
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────
// Ruta delgada: delega en el controlador de autenticación.
// ─────────────────────────────────────────────────────────────

import { defineRoute } from '../../../lib/routes/defineRoute.js';
import { handleLogin } from '../../../lib/controllers/authController.js';

export default defineRoute('POST', handleLogin);
