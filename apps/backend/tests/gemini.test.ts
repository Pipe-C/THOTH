import { describe, it, expect } from 'vitest';
import { getGeminiClient, pingGemini, buildDocumentPrompt } from '../lib/gemini.js';

describe('Gemini Client Helper', () => {
  it('debe arrojar error si GEMINI_API_KEY no está definida', () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    expect(() => getGeminiClient()).toThrow(/GEMINI_API_KEY no está definida/);

    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  });

  it('pingGemini() debe retornar false cuando falla la inicialización o conexión', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const alive = await pingGemini();
    expect(alive).toBe(false);

    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  });

  describe('buildDocumentPrompt()', () => {
    it('debe generar prompt para ensayo con conteo de palabras y asignatura', () => {
      const p = buildDocumentPrompt('ensayo', 'Estructuras de datos', 500, 'Programación II');
      expect(p).toContain('Escribe un ensayo académico');
      expect(p).toContain('500 palabras');
      expect(p).toContain('Programación II');
    });

    it('debe generar prompt para informe de laboratorio', () => {
      const p = buildDocumentPrompt('informe_laboratorio', 'Circuitos RLC');
      expect(p).toContain('Redacta un informe de laboratorio');
    });

    it('debe generar prompt para guia de clase', () => {
      const p = buildDocumentPrompt('guia_clase', 'Matrices y determinantes');
      expect(p).toContain('Genera una guía de clase');
    });

    it('debe generar prompt para articulo academico', () => {
      const p = buildDocumentPrompt('articulo', 'Computación cuántica');
      expect(p).toContain('Redacta un artículo académico corto');
    });

    it('debe generar prompt para resumen estructurado', () => {
      const p = buildDocumentPrompt('resumen', 'Historia del Pascual Bravo');
      expect(p).toContain('Elabora un resumen estructurado');
    });

    it('debe retornar el prompt tal cual para tipos desconocidos', () => {
      const p = buildDocumentPrompt('otro' as any, 'Texto libre');
      expect(p).toBe('Texto libre');
    });
  });
});
