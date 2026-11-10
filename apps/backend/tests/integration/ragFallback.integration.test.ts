import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { analyzeText } from '../../lib/antiClicheFilter.js';
import { resolveHybridContext } from '../../lib/services/ragService.js';
import { generateWithQualityFilter } from '../../lib/services/generationService.js';

const runLive = process.env.RUN_LIVE_TESTS === '1';

describe.skipIf(!runLive)('RAG híbrido con servicios reales', () => {
  it(
    'responde con web cuando el fondo institucional no está disponible',
    async () => {
      const prompt =
        '¿Cuáles son las noticias tecnológicas más recientes de hoy en Colombia?';

      const context = await resolveHybridContext(prompt);

      expect(context.sourcesUsed).toContain('web');
      expect(context.webContext.length).toBeGreaterThan(0);

      const result = await generateWithQualityFilter({
        prompt,
        profile: 'estudiante',
        documentType: 'resumen',
        institutionalContext: context.institutionalContext,
        webContext: context.webContext,
        antiClicheEnabled: true,
      });

      expect(result.text.length).toBeGreaterThan(0);
      expect(analyzeText(result.text).passed).toBe(true);
    },
    120_000,
  );
});
