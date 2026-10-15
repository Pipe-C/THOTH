// ─────────────────────────────────────────────────────────────
// api/v1/generate.ts — Endpoint 5: Hybrid RAG orchestrator + Groq
// POST /api/v1/generate
// ─────────────────────────────────────────────────────────────
// delegated route: delegates in the generate controller.
// The hybrid RAG flow lives in lib/services (ragService,
// generationService) and controller validation.
// ─────────────────────────────────────────────────────────────

import { defineRoute } from '../../lib/routes/defineRoute.js';
import { handleGenerate } from '../../lib/controllers/generateController.js';

export default defineRoute('POST', handleGenerate);
