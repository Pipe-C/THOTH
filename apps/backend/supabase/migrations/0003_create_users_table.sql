-- ─────────────────────────────────────────────────────────────
-- 0003_create_users_table.sql — Tabla de usuarios de THOTH
-- ─────────────────────────────────────────────────────────────
-- Almacena perfiles de usuarios e información de autenticación.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    profile TEXT NOT NULL CHECK (profile IN ('estudiante', 'docente')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) para proteger los datos de usuario
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Índice para búsquedas rápidas por correo electrónico
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- Trigger para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
