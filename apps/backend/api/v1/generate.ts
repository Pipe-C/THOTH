// ─────────────────────────────────────────────────────────────
// api/v1/generate.ts — Endpoint 5: Orquestador RAG híbrido + Groq
// POST /api/v1/generate
// ─────────────────────────────────────────────────────────────
// Ruta delgada: delega en el controlador de generación.
// El flujo RAG híbrido vive en lib/services (ragService,
// generationService) y la validación en el controlador.
// ─────────────────────────────────────────────────────────────

import { defineRoute } from '../../lib/routes/defineRoute.js';
import { handleGenerate } from '../../lib/controllers/generateController.js';

export default defineRoute('POST', handleGenerate);
