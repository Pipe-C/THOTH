import { describe, it, expect } from 'vitest';
import { analyzeText, buildRegenerationPrompt } from '../lib/antiClicheFilter.js';

describe('antiClicheFilter', () => {
  describe('analyzeText()', () => {
    it('debe aprobar un texto académico limpio sin muletillas', () => {
      const cleanText =
        'El algoritmo de Dijkstra calcula las rutas más cortas entre nodos de un grafo ponderado. ' +
        'Su complejidad temporal utilizando una cola de prioridad basada en montículo binario es O((V + E) log V).';

      const result = analyzeText(cleanText);

      expect(result.passed).toBe(true);
      expect(result.detected).toHaveLength(0);
      expect(result.originalText).toBe(cleanText);
    });

    it('debe detectar la muletilla "en conclusión"', () => {
      const text = 'En conclusión, el modelo de datos relacional ofrece integridad referencial.';
      const result = analyzeText(text);

      expect(result.passed).toBe(false);
      expect(result.detected).toContain('en conclusión');
    });

    it('debe detectar variaciones sin tilde como "en conclusion"', () => {
      const text = 'En conclusion, se verificaron los resultados experimentales.';
      const result = analyzeText(text);

      expect(result.passed).toBe(false);
      expect(result.detected.some((d) => d.startsWith('en conclusi'))).toBe(true);
    });

    it('debe detectar frases típicas como "cabe resaltar que" y "en la era digital"', () => {
      const text =
        'Cabe resaltar que la base de datos se normalizó hasta 3FN. ' +
        'En la era digital, la seguridad de datos es indispensable.';

      const result = analyzeText(text);

      expect(result.passed).toBe(false);
      expect(result.detected).toContain('cabe resaltar que');
      expect(result.detected).toContain('en la era digital');
    });

    it('debe eliminar duplicados en el arreglo detected', () => {
      const text =
        'Vale la pena mencionar el primer punto. Posteriormente, vale la pena mencionar el segundo punto.';

      const result = analyzeText(text);

      expect(result.passed).toBe(false);
      expect(result.detected.filter((d) => d === 'vale la pena mencionar')).toHaveLength(1);
    });

    it('debe detectar patrones insensibles a mayúsculas y minúsculas', () => {
      const text = 'JUEGA UN PAPEL CRUCIAL en la escalabilidad del sistema distribuido.';
      const result = analyzeText(text);

      expect(result.passed).toBe(false);
      expect(result.detected).toContain('juega un papel crucial');
    });
  });

  describe('buildRegenerationPrompt()', () => {
    it('debe formatear las muletillas detectadas y conservar el texto original', () => {
      const original = 'En resumen, el sistema responde en menos de 200 milisegundos.';
      const detected = ['en resumen'];

      const prompt = buildRegenerationPrompt(original, detected);

      expect(prompt).toContain('"en resumen"');
      expect(prompt).toContain(original);
      expect(prompt).toContain('Instrucciones de reescritura:');
    });
  });
});
