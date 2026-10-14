// ─────────────────────────────────────────────────────────────
// scripts/seed.mjs — Carga de documentos institucionales de prueba
// ─────────────────────────────────────────────────────────────
// Inserta fragmentos de ejemplo en document_chunks para poder
// probar /api/v1/vector-search y /api/v1/generate contra datos reales.
//
// Requisitos:
//   1. Haber aplicado supabase/migrations/0001_init_vector_store.sql.
//   2. Haber desplegado la Edge Function `embed` (supabase functions deploy embed).
//   3. Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
//
// Uso: npm run seed  (desde apps/backend)
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    '[seed] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.',
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

/** Documentos de ejemplo (fondo documental ficticio para pruebas). */
const DOCUMENTS = [
  {
    content:
      'El programa de Ingeniería de Software del Pascual Bravo exige 160 créditos académicos para optar al título, incluyendo un trabajo de grado.',
    metadata: { source: 'Pensum Ingeniería de Software 2026', document_type: 'pensum' },
  },
  {
    content:
      'El reglamento estudiantil establece que la asistencia mínima a clases es del 80% para no perder el derecho a la evaluación final.',
    metadata: { source: 'Reglamento Estudiantil Art. 45', document_type: 'reglamento' },
  },
  {
    content:
      'El syllabus de Programación Orientada a Objetos cubre encapsulación, herencia, polimorfismo y principios SOLID durante el cuarto semestre.',
    metadata: { source: 'Syllabus POO - Semestre 4', document_type: 'syllabus' },
  },
];

async function main() {
  console.log(`[seed] Cargando ${DOCUMENTS.length} documentos...`);

  let inserted = 0;

  for (const doc of DOCUMENTS) {
    const { data, error } = await supabase.functions.invoke('embed', {
      body: { input: doc.content },
    });

    if (error || !data?.embedding) {
      console.error(
        `[seed] Error generando embedding para "${doc.metadata.source}":`,
        error?.message ?? 'sin embedding',
      );
      continue;
    }

    const { error: insertError } = await supabase.from('document_chunks').insert({
      content: doc.content,
      metadata: { ...doc.metadata, created_at: new Date().toISOString() },
      embedding: data.embedding,
    });

    if (insertError) {
      console.error(`[seed] Error insertando "${doc.metadata.source}":`, insertError.message);
      continue;
    }

    inserted += 1;
    console.log(`[seed] OK: ${doc.metadata.source}`);
  }

  console.log(`[seed] Completado: ${inserted}/${DOCUMENTS.length} documentos insertados.`);
}

main().catch((err) => {
  console.error('[seed] Error inesperado:', err);
  process.exit(1);
});
