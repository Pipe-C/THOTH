// ─────────────────────────────────────────────────────────────
// scripts/ingest.mjs — Carga del fondo documental institucional
// ─────────────────────────────────────────────────────────────
// Recorre una carpeta de documentos (pénsum, reglamentos, syllabus,
// guías...), extrae el texto, lo fragmenta (chunks), genera el
// embedding de cada fragmento con la Edge Function `embed` y lo
// inserta en `public.document_chunks`.
//
// Requisitos:
//   1. Migraciones aplicadas (0001 + 0002) y Edge Function `embed`
//      desplegada.
//   2. Variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.
//
// Uso (desde apps/backend):
//   npm run ingest                    # procesa ./documents
//   npm run ingest -- ./mi-carpeta    # otra carpeta
//   npm run ingest -- --reset         # vacía document_chunks antes de cargar
//   npm run ingest -- --type=reglamento
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// ─── Configuración ───────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = resolve(__dirname, '..', 'documents');

const SUPPORTED_EXT = new Set(['.txt', '.md', '.pdf', '.docx']);
const EMBEDDING_DIM = 384; // gte-small (debe coincidir con la columna vector(384))
const MAX_CHARS = 1000; // longitud máxima de cada chunk
const OVERLAP_CHARS = 150; // solapamiento entre chunks contiguos
const CONCURRENCY = 5; // embeddings/inserts en paralelo

// ─── CLI ─────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = { dir: DEFAULT_DIR, type: null, reset: false };
  for (const arg of argv) {
    if (arg === '--reset') opts.reset = true;
    else if (arg.startsWith('--type=')) opts.type = arg.slice('--type='.length);
    else if (arg.startsWith('--dir=')) opts.dir = resolve(arg.slice('--dir='.length));
    else if (!arg.startsWith('--')) opts.dir = resolve(arg);
  }
  return opts;
}

// ─── Extracción de texto ─────────────────────────────────────

async function extractText(filePath) {
  const ext = extname(filePath).toLowerCase();

  if (ext === '.txt' || ext === '.md') {
    return readFile(filePath, 'utf8');
  }

  if (ext === '.pdf') {
    const { extractText: pdfExtract, getDocumentProxy } = await import('unpdf');
    const buffer = await readFile(filePath);
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await pdfExtract(pdf, { mergePages: true });
    return text;
  }

  if (ext === '.docx') {
    const mammoth = (await import('mammoth')).default;
    const { value } = await mammoth.extractRawText({ path: filePath });
    return value;
  }

  throw new Error(`Formato no soportado: ${ext}`);
}

// ─── Fragmentación (chunking) ────────────────────────────────

function normalize(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chunkText(text, maxChars = MAX_CHARS, overlap = OVERLAP_CHARS) {
  const clean = normalize(text).replace(/\s+/g, ' ');
  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + maxChars, clean.length);

    if (end < clean.length) {
      const window = clean.slice(start, end);
      const lastPeriod = window.lastIndexOf('. ');
      if (lastPeriod > maxChars * 0.5) end = start + lastPeriod + 1;
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

// ─── Metadatos ───────────────────────────────────────────────

function inferDocumentType(name) {
  const n = name.toLowerCase();
  if (n.includes('pensum')) return 'pensum';
  if (n.includes('microcurriculo') || n.includes('microcurr')) return 'microcurriculo';
  if (n.includes('syllabus')) return 'syllabus';
  if (n.includes('reglamento')) return 'reglamento';
  if (n.includes('acuerdo')) return 'acuerdo';
  if (n.includes('resolucion') || n.includes('resolucin')) return 'resolucion';
  if (n.includes('guia') || n.includes('gua')) return 'guia';
  return 'documento';
}

// ─── Utilidades ──────────────────────────────────────────────

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, acc);
    else if (SUPPORTED_EXT.has(extname(entry.name).toLowerCase())) acc.push(full);
  }
  return acc;
}

async function mapPool(items, limit, worker) {
  let cursor = 0;
  let ok = 0;
  let failed = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        await worker(items[index], index);
        ok += 1;
      } catch (error) {
        failed += 1;
        console.error(`    [error] chunk ${index + 1}: ${error.message}`);
      }
    }
  });

  await Promise.all(runners);
  return { ok, failed };
}

// ─── Programa principal ──────────────────────────────────────

async function main() {
  const { dir, type, reset } = parseArgs(process.argv.slice(2));

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[ingest] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
    process.exit(1);
  }
  if (!existsSync(dir)) {
    console.error(`[ingest] La carpeta no existe: ${dir}`);
    console.error('         Crea la carpeta y coloca allí los documentos (PDF, DOCX, MD, TXT).');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  if (reset) {
    const { error } = await supabase
      .from('document_chunks')
      .delete()
      .not('id', 'is', null);
    if (error) {
      console.error('[ingest] Error vaciando document_chunks:', error.message);
      process.exit(1);
    }
    console.log('[ingest] Tabla document_chunks vaciada (--reset).');
  }

  const files = await walk(dir);
  if (files.length === 0) {
    console.log(`[ingest] No se encontraron documentos en ${dir}`);
    console.log(`         Formatos soportados: ${[...SUPPORTED_EXT].join(', ')}`);
    return;
  }

  console.log(`[ingest] ${files.length} documento(s) encontrados en ${dir}\n`);

  const summary = { files: 0, chunks: 0, failed: 0 };

  for (const file of files) {
    const rel = relative(dir, file);
    const source = basename(file, extname(file));
    const docType = type ?? inferDocumentType(source);

    let text;
    try {
      text = await extractText(file);
    } catch (error) {
      console.error(`[ingest] ✗ ${rel}: no se pudo extraer texto (${error.message})`);
      summary.failed += 1;
      continue;
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      console.error(`[ingest] ✗ ${rel}: sin texto aprovechable`);
      summary.failed += 1;
      continue;
    }

    console.log(`[ingest] → ${rel}  (tipo: ${docType}, ${chunks.length} chunks)`);

    // Re-ingesta idempotente: elimina fragmentos previos de la misma fuente.
    const { error: delError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('metadata->>source', source);
    if (delError) {
      console.error(`[ingest] ✗ ${rel}: error limpiando versión previa (${delError.message})`);
      summary.failed += 1;
      continue;
    }

    const { ok, failed } = await mapPool(chunks, CONCURRENCY, async (chunk, index) => {
      const { data, error } = await supabase.functions.invoke('embed', {
        body: { input: chunk },
      });
      if (error || !data?.embedding) {
        throw new Error(error?.message ?? 'embedding vacío');
      }
      if (data.embedding.length !== EMBEDDING_DIM) {
        console.warn(
          `    [warn] dimensión ${data.embedding.length} ≠ ${EMBEDDING_DIM} esperada`,
        );
      }

      const { error: insertError } = await supabase.from('document_chunks').insert({
        content: chunk,
        metadata: {
          source,
          document_type: docType,
          chunk_index: index,
          total_chunks: chunks.length,
          file: rel,
          created_at: new Date().toISOString(),
        },
        embedding: data.embedding,
      });
      if (insertError) throw new Error(insertError.message);
    });

    summary.files += 1;
    summary.chunks += ok;
    summary.failed += failed;
    console.log(`    ${ok}/${chunks.length} chunks insertados`);
  }

  console.log('\n[ingest] ─── Resumen ───');
  console.log(`  Documentos procesados: ${summary.files}/${files.length}`);
  console.log(`  Fragmentos insertados: ${summary.chunks}`);
  if (summary.failed > 0) console.log(`  Errores:               ${summary.failed}`);
}

main().catch((error) => {
  console.error('[ingest] Error inesperado:', error);
  process.exit(1);
});
