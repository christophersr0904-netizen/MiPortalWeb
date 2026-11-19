-- ============================================================================
-- MIGRACIÓN: 20261120000001_gcal_oauth_offline.sql
-- SISTEMA: PMO Personal Modular & Life OS
-- REQUISITO: REQ-GCAL-BACKEND-02
-- DESCRIPCIÓN: Esquema para soporte de Google Calendar OAuth 2.0 Offline
--              (Refresh Token multi-dispositivo) y paridad de tareas en Calendar.
-- ============================================================================

-- 1. Paridad de columna id_evento_calendar en tabla tareas
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS id_evento_calendar TEXT;

-- 2. Tabla segura de integración OAuth multi-dispositivo
CREATE TABLE IF NOT EXISTS public.google_calendar_integrations (
    user_id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    refresh_token TEXT NOT NULL,
    access_token TEXT,
    expires_at TIMESTAMPTZ,
    google_email TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Habilitar Row Level Security (RLS) sin políticas públicas.
-- Acceso exclusivo reservado para 'service_role' desde Supabase Edge Functions.
ALTER TABLE public.google_calendar_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.google_calendar_integrations IS 'Almacén seguro de tokens OAuth 2.0 Offline para Google Calendar API v3 multi-dispositivo.';
