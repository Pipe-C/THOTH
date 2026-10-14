import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/repositories/documentRepository.js', () => ({
  isReachable: vi.fn(),
}));

vi.mock('../../lib/repositories/llmRepository.js', () => ({
  isReachable: vi.fn(),
}));

import { getSystemHealth } from '../../lib/services/healthService.js';
import { isReachable as isDocumentStoreReachable } from '../../lib/repositories/documentRepository.js';
import { isReachable as isLlmReachable } from '../../lib/repositories/llmRepository.js';

describe('healthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reporta healthy cuando ambos servicios responden', async () => {
    vi.mocked(isDocumentStoreReachable).mockResolvedValue(true);
    vi.mocked(isLlmReachable).mockResolvedValue(true);

    const health = await getSystemHealth();

    expect(health.status).toBe('healthy');
    expect(health.services).toEqual({ supabase: true, groq: true });
    expect(health.version).toBe('v1');
    expect(typeof health.latencyMs).toBe('number');
  });

  it('reporta degraded cuando un servicio falla', async () => {
    vi.mocked(isDocumentStoreReachable).mockResolvedValue(false);
    vi.mocked(isLlmReachable).mockResolvedValue(true);

    const health = await getSystemHealth();

    expect(health.status).toBe('degraded');
    expect(health.services.supabase).toBe(false);
  });
});
