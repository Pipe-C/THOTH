import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/repositories/llmRepository.js', () => ({
  complete: vi.fn(),
}));

import { generateWithQualityFilter } from '../../lib/services/generationService.js';
import { complete } from '../../lib/repositories/llmRepository.js';

const baseParams = {
  prompt: 'Explica el polimorfismo',
  profile: 'estudiante' as const,
  documentType: 'ensayo' as const,
  institutionalContext: 'ctx',
  webContext: '',
};

describe('generationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna el texto sin regenerar cuando pasa el filtro', async () => {
    vi.mocked(complete).mockResolvedValue({
      text: 'El polimorfismo permite despachar métodos según el subtipo.',
      sourcesUsed: ['institutional'],
    });

    const result = await generateWithQualityFilter(baseParams);

    expect(result.regenerated).toBe(false);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('regenera cuando detecta muletillas y usa el prompt de corrección', async () => {
    vi.mocked(complete)
      .mockResolvedValueOnce({
        text: 'En conclusión, el polimorfismo es clave.',
        sourcesUsed: ['institutional'],
      })
      .mockResolvedValueOnce({
        text: 'El polimorfismo permite despachar métodos en tiempo de ejecución.',
        sourcesUsed: ['institutional'],
      });

    const result = await generateWithQualityFilter(baseParams);

    expect(result.regenerated).toBe(true);
    expect(result.text).not.toContain('En conclusión');
    expect(complete).toHaveBeenCalledTimes(2);
    expect(vi.mocked(complete).mock.calls[1][0].prompt).toContain('reescritura');
  });

  it('se detiene tras el máximo de intentos si sigue con muletillas', async () => {
    vi.mocked(complete).mockResolvedValue({
      text: 'Cabe resaltar que el sistema funciona.',
      sourcesUsed: ['institutional'],
    });

    const result = await generateWithQualityFilter(baseParams);

    // 1 intento inicial + MAX_REGENERATION_ATTEMPTS (2) = 3 llamadas
    expect(complete).toHaveBeenCalledTimes(3);
    expect(result.regenerated).toBe(true);
  });
});
