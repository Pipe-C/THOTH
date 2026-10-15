// ─────────────────────────────────────────────────────────────
// api/v1/health.ts — Endpoint 1: Health Check
// GET /api/v1/health
// ─────────────────────────────────────────────────────────────
// Delegated route: delegates in the health controller.
// ─────────────────────────────────────────────────────────────

import { defineRoute } from '../../lib/routes/defineRoute.js';
import { handleHealth } from '../../lib/controllers/healthController.js';

export default defineRoute('GET', handleHealth);
