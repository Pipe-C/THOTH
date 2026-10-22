// ─────────────────────────────────────────────────────────────
// api/v1/vector-search.ts — Endpoint 4: RAG vectorial search
// POST /api/v1/vector-search
// ─────────────────────────────────────────────────────────────
// Delegated route: delegates to vectorial search controller.
// ─────────────────────────────────────────────────────────────

import { defineRoute } from '../../lib/routes/defineRoute.js';
import { handleVectorSearch } from '../../lib/controllers/vectorSearchController.js';

export default defineRoute('POST', handleVectorSearch);
