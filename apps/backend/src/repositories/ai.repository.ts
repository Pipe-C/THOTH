import { generateContent, pingGemini } from '../../lib/gemini.js';
import type { GeminiGenerateParams, GeminiGenerateResult } from '../../lib/gemini.js';

export interface IAIRepository {
  generateContent(params: GeminiGenerateParams): Promise<GeminiGenerateResult>;
  ping(): Promise<boolean>;
}

export class AIRepository implements IAIRepository {
  async generateContent(params: GeminiGenerateParams): Promise<GeminiGenerateResult> {
    return generateContent(params);
  }

  async ping(): Promise<boolean> {
    return pingGemini();
  }
}

export const aiRepository = new AIRepository();
