-- ─────────────────────────────────────────────────────────────
-- 0002_fix_vector_index.sql — Corrige el recall de la búsqueda vectorial
-- ─────────────────────────────────────────────────────────────
-- Motivo: el índice `ivfflat` de 0001 se creó con `lists = 100` sobre
-- un fondo documental muy pequeño. Con `ivfflat.probes = 1` (por defecto)
-- y tan pocas filas repartidas en tantas listas, la búsqueda aproximada
-- devolvía 0 resultados para consultas que sí tienen alta similitud real
-- (p. ej. "polimorfismo en POO" ≈ 0.85 contra el syllabus de POO).
--
-- HNSW no requiere tuning de `lists`/`probes` y da recall casi perfecto
-- incluso con pocos vectores, por lo que se reemplaza el índice ivfflat.
-- ─────────────────────────────────────────────────────────────

-- 1. Eliminar el índice ivfflat defectuoso.
drop index if exists public.document_chunks_embedding_idx;

-- 2. Crear el índice HNSW (similitud coseno).
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);
