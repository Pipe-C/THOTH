// ─────────────────────────────────────────────────────────────
// api/v1/vector-search.ts — Endpoint 4: Búsqueda vectorial RAG
// POST /api/v1/vector-search
// ─────────────────────────────────────────────────────────────
// Ruta delgada: delega en el controlador de búsqueda vectorial.
// ─────────────────────────────────────────────────────────────

import { defineRoute } from '../../lib/routes/defineRoute.js';
import { handleVectorSearch } from '../../lib/controllers/vectorSearchController.js';

export default defineRoute('POST', handleVectorSearch);
