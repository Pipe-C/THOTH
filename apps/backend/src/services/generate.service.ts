import { vectorRepository, IVectorRepository } from '../repositories/vector.repository.js';
import { webSearchRepository, IWebSearchRepository } from '../repositories/webSearch.repository.js';
import { aiRepository, IAIRepository } from '../repositories/ai.repository.js';
import { SIMILARITY_THRESHOLD } from '../../lib/supabase.js';
import { analyzeText, buildRegenerationPrompt } from '../../lib/antiClicheFilter.js';
import type { GenerateRequest, ContextSource, GenerateResponse } from '../../lib/types.js';

const MAX_REGENERATION_ATTEMPTS = 2;
const DEFAULT_TOP_K = 5;

const VALID_DOC_TYPES = [
  'ensayo',
  'informe_laboratorio',
  'guia_clase',
  'articulo',
  'resumen',
];

export class GenerateService {
  constructor(
    private vectorRepo: IVectorRepository = vectorRepository,
    private webSearchRepo: IWebSearchRepository = webSearchRepository,
    private aiRepo: IAIRepository = aiRepository,
  ) {}

  validatePayload(body: GenerateRequest): void {
    const { profile, documentType } = body;

    if (!['estudiante', 'docente'].includes(profile)) {
      throw new Error(
        `El campo "profile" debe ser "estudiante" o "docente". Recibido: "${profile}"`,
      );
    }

    if (!VALID_DOC_TYPES.includes(documentType)) {
      throw new Error(
        `El campo "documentType" debe ser uno de: ${VALID_DOC_TYPES.join(', ')}. Recibido: "${documentType}"`,
      );
    }
  }

  private shouldFetchWebContext(prompt: string, hasHighQualityChunks: boolean): boolean {
    if (!hasHighQualityChunks) return true;
    const lower = prompt.toLowerCase();
    return lower.includes('actual') || lower.includes('reciente') || lower.includes('hoy');
  }

  private async resolveHybridContext(prompt: string) {
    let institutionalContext = '';
    const sourcesUsed: ContextSource[] = [];

    const vectorResults = await this.vectorRepo.searchDocuments(prompt, DEFAULT_TOP_K);
    const highQualityChunks = vectorResults.filter(
      (r) => r.similarity >= SIMILARITY_THRESHOLD,
    );

    if (highQualityChunks.length > 0) {
      institutionalContext = highQualityChunks
        .map(
          (chunk, i) =>
            `[Fragmento ${i + 1} — ${chunk.metadata.source}]\n${chunk.content}`,
        )
        .join('\n\n');
      sourcesUsed.push('institutional');
    }

    let webContext = '';
    if (this.shouldFetchWebContext(prompt, highQualityChunks.length > 0)) {
      webContext = await this.webSearchRepo.searchWeb(prompt);
      if (webContext) sourcesUsed.push('web');
    }

    if (sourcesUsed.length === 0) {
      sourcesUsed.push('none');
    }

    return { institutionalContext, webContext, sourcesUsed };
  }

  async generateDocument(data: GenerateRequest): Promise<GenerateResponse> {
    this.validatePayload(data);

    const { prompt, profile, documentType, userId, wordCount, subject } = data;
    const startTime = Date.now();

    const { institutionalContext, webContext, sourcesUsed } =
      await this.resolveHybridContext(prompt);

    let generatedText = '';
    let regenerated = false;
    let currentPrompt = prompt;

    for (let attempt = 0; attempt <= MAX_REGENERATION_ATTEMPTS; attempt++) {
      const result = await this.aiRepo.generateContent({
        prompt: currentPrompt,
        profile,
        documentType,
        institutionalContext,
        webContext,
        wordCount,
        subject,
      });

      generatedText = result.text;
      const filterResult = analyzeText(generatedText);

      if (filterResult.passed) {
        break;
      }

      if (attempt < MAX_REGENERATION_ATTEMPTS) {
        currentPrompt = buildRegenerationPrompt(
          generatedText,
          filterResult.detected,
        );
        regenerated = true;
      }
    }

    return {
      text: generatedText,
      sources_used: sourcesUsed,
      metadata: {
        model: 'gemini-2.0-flash',
        profile,
        documentType,
        regenerated,
        processingTimeMs: Date.now() - startTime,
        userId,
      },
    };
  }
}

export const generateService = new GenerateService();
