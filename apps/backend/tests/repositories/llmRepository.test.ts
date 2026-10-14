import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/groq.js', () => ({
  generateContent: vi.fn(),
  pingGroq: vi.fn(),
}));

import { complete, isReachable } from '../../lib/repositories/llmRepository.js';
import { generateContent, pingGroq } from '../../lib/groq.js';

describe('llmRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('complete() delega en generateContent y retorna el resultado', async () => {
    vi.mocked(generateContent).mockResolvedValue({
      text: 'Texto generado',
      sourcesUsed: ['institutional'],
    });

    const params = {
      prompt: 'Explica recursión',
      profile: 'estudiante' as const,
      documentType: 'ensayo' as const,
      institutionalContext: 'ctx',
      webContext: '',
    };

    const result = await complete(params);

    expect(generateContent).toHaveBeenCalledWith(params);
    expect(result.text).toBe('Texto generado');
  });

  it('isReachable() delega en pingGroq', async () => {
    vi.mocked(pingGroq).mockResolvedValue(true);

    await expect(isReachable()).resolves.toBe(true);
    expect(pingGroq).toHaveBeenCalledTimes(1);
  });
});
