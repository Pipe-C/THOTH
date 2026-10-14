-- ─────────────────────────────────────────────────────────────
-- 0001_init_vector_store.sql — Fondo documental vectorial de TOTH
-- ─────────────────────────────────────────────────────────────
-- Habilita pgvector, crea la tabla de fragmentos institucionales y
-- la función RPC `match_document_chunks` que consume
-- lib/supabase.ts (búsqueda por similitud coseno).
--
-- Modelo de embeddings: gte-small (384 dimensiones), el modelo
-- por defecto de la Edge Function `embed` (ver supabase/functions/embed).
-- ─────────────────────────────────────────────────────────────

-- 1. Extensión pgvector.
create extension if not exists vector;

-- 2. Tabla de fragmentos institucionales.
create table if not exists public.document_chunks (
  id         uuid primary key default gen_random_uuid(),
  content    text not null,
  metadata   jsonb not null default '{}'::jsonb,
  embedding  vector(384) not null,
  created_at timestamptz not null default now()
);

-- 3. Seguridad: solo el backend (service_role) accede a esta tabla.
--    El service_role omite RLS, por lo que no se definen políticas públicas.
alter table public.document_chunks enable row level security;

-- 4. Índice vectorial para acelerar la similitud coseno.
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 5. Función RPC de búsqueda por similitud coseno.
--    Contrato consumido por lib/supabase.ts:
--      params : query_embedding, match_threshold, match_count
--      columnas: id, content, metadata, similarity
create or replace function public.match_document_chunks (
  query_embedding vector(384),
  match_threshold double precision,
  match_count     integer
)
returns table (
  id         uuid,
  content    text,
  metadata   jsonb,
  similarity double precision
)
language sql
stable
as $$
  select
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- 6. Permisos de ejecución para el rol de servicio.
grant execute on function
  public.match_document_chunks(vector, double precision, integer)
  to service_role;
