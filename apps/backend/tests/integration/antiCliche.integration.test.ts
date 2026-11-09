import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import {
  analyzeText,
  buildRegenerationPrompt,
} from '../../lib/antiClicheFilter.js';
import { generateContent, getGroqClient } from '../../lib/groq.js';

const runLive = process.env.RUN_LIVE_TESTS === '1';

describe.skipIf(!runLive)('anti-cliché con Groq real', () => {
  it(
    'detecta muletillas en una salida real y las elimina al regenerar',
    async () => {
      const client = getGroqClient();
      const clicheResponse = await client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content:
              'Eres un generador de texto académico. Sigue literalmente las instrucciones del usuario.',
          },
          {
            role: 'user',
            content:
              'Escribe un párrafo académico breve (80-120 palabras) sobre la importancia de la programación. Debes incluir literalmente estas tres frases: "En conclusión", "Cabe resaltar que" y "En la era digital". No omitas ninguna.',
          },
        ],
        temperature: 0.7,
        max_completion_tokens: 2048,
        reasoning_effort: 'low',
      });

      const clicheText = clicheResponse.choices[0]?.message?.content ?? '';
      expect(clicheText.length).toBeGreaterThan(0);

      const analysis = analyzeText(clicheText);
      expect(analysis.passed).toBe(false);
      expect(analysis.detected.length).toBeGreaterThan(0);

      const regenerated = await generateContent({
        prompt: buildRegenerationPrompt(clicheText, analysis.detected),
        profile: 'estudiante',
        documentType: 'resumen',
        institutionalContext: '',
        webContext: '',
        antiClicheEnabled: true,
      });

      const regeneratedAnalysis = analyzeText(regenerated.text);
      expect(regeneratedAnalysis.passed).toBe(true);
      expect(regeneratedAnalysis.detected).toEqual([]);
    },
    120_000,
  );
});
