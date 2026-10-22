// ─────────────────────────────────────────────────────────────
// api/v1/auth/register.ts — Endpoint 2: Register
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────────
// Delegated route: delegates to authentication controller.
// ─────────────────────────────────────────────────────────────

import { defineRoute } from '../../../lib/routes/defineRoute.js';
import { handleRegister } from '../../../lib/controllers/authController.js';

export default defineRoute('POST', handleRegister);
