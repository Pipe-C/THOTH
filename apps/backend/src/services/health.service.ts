import { vectorRepository, IVectorRepository } from '../repositories/vector.repository.js';
import { aiRepository, IAIRepository } from '../repositories/ai.repository.js';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded';
  version: string;
  services: {
    supabase: boolean;
    gemini: boolean;
  };
  latencyMs: number;
  environment: string;
}

export class HealthService {
  constructor(
    private vectorRepo: IVectorRepository = vectorRepository,
    private aiRepo: IAIRepository = aiRepository,
  ) {}

  async checkStatus(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    const [supabaseOk, geminiOk] = await Promise.allSettled([
      this.vectorRepo.ping(),
      this.aiRepo.ping(),
    ]);

    const services = {
      supabase: supabaseOk.status === 'fulfilled' ? supabaseOk.value : false,
      gemini: geminiOk.status === 'fulfilled' ? geminiOk.value : false,
    };

    const allHealthy = Object.values(services).every(Boolean);
    const latencyMs = Date.now() - startTime;

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      version: 'v1',
      services,
      latencyMs,
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}

export const healthService = new HealthService();
