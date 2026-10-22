// ─────────────────────────────────────────────────────────────
// api/v1/auth/login.ts — Endpoint 3: Login
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────
// Delegated route: delegates in authentication controller.
// ─────────────────────────────────────────────────────────────

import { defineRoute } from '../../../lib/routes/defineRoute.js';
import { handleLogin } from '../../../lib/controllers/authController.js';

export default defineRoute('POST', handleLogin);
