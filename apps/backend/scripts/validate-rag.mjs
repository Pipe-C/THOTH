#!/usr/bin/env node

// Validación de Fase 5 contra un backend desplegado o local.
// Uso: npm run validate:rag [-- --base-url=http://localhost:3000]

const DEFAULT_BASE_URL = 'https://thoth-backend.vercel.app';
const REQUEST_TIMEOUT_MS = 120_000;

const CLICHE_PATTERNS = [
  /en conclusi[oó]n/gi,
  /en resumen/gi,
  /a modo de cierre/gi,
  /para finalizar/gi,
  /es importante destacar que/gi,
  /cabe resaltar que/gi,
  /vale la pena mencionar/gi,
  /juega un papel (crucial|fundamental|vital)/gi,
  /profundizar en el tema/gi,
  /en la era digital/gi,
  /no cabe duda de que/gi,
  /sin lugar a dudas/gi,
];

const CASES = [
  {
    id: 'institucional',
    description: 'Consulta cubierta por el fondo documental',
    prompt:
      '¿Cuántos créditos académicos exige el programa de Ingeniería de Software del Pascual Bravo para optar al título?',
    expected: ['institutional'],
    forbidden: ['web'],
  },
  {
    id: 'web',
    description: 'Consulta sin cobertura institucional (fallback web)',
    prompt:
      '¿Cuáles son las noticias tecnológicas más recientes de hoy en Colombia?',
    expected: ['web'],
    forbidden: ['institutional'],
  },
  {
    id: 'mixto',
    description: 'Consulta que combina pénsum institucional y vigencia',
    prompt:
      '¿Cuántos créditos exige hoy el pénsum de Ingeniería de Software y qué tendencias actuales están transformando la educación superior en Colombia?',
    expected: ['institutional', 'web'],
    forbidden: [],
  },
];

function parseBaseUrl(argv) {
  const flag = argv.find((arg) => arg.startsWith('--base-url='));
  return (flag ? flag.slice('--base-url='.length) : DEFAULT_BASE_URL).replace(
    /\/+$/,
    '',
  );
}

function findCliches(text) {
  const found = new Set();
  for (const pattern of CLICHE_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) found.add(match[0].toLowerCase());
  }
  return [...found];
}

async function postJson(baseUrl, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.ok === false) {
      const detail = payload?.error?.message ?? `HTTP ${response.status}`;
      throw new Error(detail);
    }

    return payload;
  } finally {
    clearTimeout(timer);
  }
}

async function runCase(baseUrl, testCase) {
  const startedAt = Date.now();
  const payload = await postJson(baseUrl, '/api/v1/generate', {
    prompt: testCase.prompt,
    profile: 'estudiante',
    documentType: 'resumen',
    userId: `fase5-validation-${testCase.id}`,
    antiClicheEnabled: true,
  });

  const data = payload.data ?? {};
  const sources = Array.isArray(data.sources_used) ? data.sources_used : [];
  const cliches = findCliches(data.text ?? '');
  const missing = testCase.expected.filter((source) => !sources.includes(source));
  const forbidden = testCase.forbidden.filter((source) => sources.includes(source));

  return {
    id: testCase.id,
    description: testCase.description,
    passed: missing.length === 0 && forbidden.length === 0 && cliches.length === 0,
    sources,
    missing,
    forbidden,
    cliches,
    regenerated: Boolean(data.metadata?.regenerated),
    processingTimeMs: data.metadata?.processingTimeMs ?? Date.now() - startedAt,
    chars: (data.text ?? '').length,
  };
}

async function main() {
  const baseUrl = parseBaseUrl(process.argv.slice(2));

  console.log(`[fase5] Backend: ${baseUrl}`);
  console.log('[fase5] Validando RAG híbrido y filtro anti-cliché...\n');

  const results = [];

  for (const testCase of CASES) {
    try {
      const result = await runCase(baseUrl, testCase);
      results.push(result);

      const status = result.passed ? 'PASS' : 'FAIL';
      console.log(`[${status}] ${result.id} — ${result.description}`);
      console.log(`        sources_used: ${result.sources.join(', ') || '(vacío)'}`);
      console.log(
        `        regenerated: ${result.regenerated} | ${result.processingTimeMs} ms | ${result.chars} chars`,
      );
      if (result.missing.length > 0) {
        console.log(`        faltan fuentes: ${result.missing.join(', ')}`);
      }
      if (result.forbidden.length > 0) {
        console.log(`        fuentes no esperadas: ${result.forbidden.join(', ')}`);
      }
      if (result.cliches.length > 0) {
        console.log(`        clichés detectados: ${result.cliches.join(', ')}`);
      }
      console.log('');
    } catch (error) {
      results.push({ id: testCase.id, passed: false, error: error.message });
      console.log(`[FAIL] ${testCase.id} — ${error.message}\n`);
    }
  }

  const failed = results.filter((result) => !result.passed);

  if (failed.length > 0) {
    console.error(`[fase5] ${failed.length}/${results.length} casos fallaron.`);
    process.exit(1);
  }

  console.log(`[fase5] ${results.length}/${results.length} casos OK.`);
}

main();
