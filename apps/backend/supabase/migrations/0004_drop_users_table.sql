-- -----------------------------------------------------------------
-- 0004_drop_users_table.sql — Retira la tabla de auth de Supabase
-- -----------------------------------------------------------------
-- La autenticación de TOTH vive en Firebase Auth; Supabase queda
-- exclusivamente como almacén vectorial (public.document_chunks).
-- La migración es idempotente para instalaciones nuevas.
-- -----------------------------------------------------------------

drop table if exists public.users;
