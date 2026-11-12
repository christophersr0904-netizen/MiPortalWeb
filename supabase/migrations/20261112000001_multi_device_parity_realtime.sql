-- ============================================================================
-- MIGRACIÓN: 20261112000001_multi_device_parity_realtime.sql
-- SISTEMA: PMO Personal Modular & Life OS
-- REQUISITO: REQ-SYNC-41-EXEC (Paridad de Columnas y Publicación Realtime 12 Tablas)
-- DESCRIPCIÓN: Añade columnas faltantes no destructivas a actividades_personales,
--              notas y tareas, y publica de forma idempotente las 12 tablas
--              operativas en supabase_realtime.
-- ============================================================================

-- 1. PARIDAD DE COLUMNAS EN actividades_personales
ALTER TABLE actividades_personales ADD COLUMN IF NOT EXISTS frecuencia_ciclo VARCHAR(50) DEFAULT 'DIARIA';
ALTER TABLE actividades_personales ADD COLUMN IF NOT EXISTS regla_repeticion TEXT DEFAULT '';
ALTER TABLE actividades_personales ADD COLUMN IF NOT EXISTS fecha_fin DATE;
ALTER TABLE actividades_personales ADD COLUMN IF NOT EXISTS excepciones_fechas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE actividades_personales ADD COLUMN IF NOT EXISTS ultima_fecha_completado DATE;
ALTER TABLE actividades_personales ADD COLUMN IF NOT EXISTS proxima_fecha_programada DATE;
ALTER TABLE actividades_personales ADD COLUMN IF NOT EXISTS historial_fechas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE actividades_personales ADD COLUMN IF NOT EXISTS actividad_padre_id UUID;
ALTER TABLE actividades_personales ADD COLUMN IF NOT EXISTS notas_checklist TEXT DEFAULT '';
ALTER TABLE actividades_personales ADD COLUMN IF NOT EXISTS monto_gasto_asociado NUMERIC(12,2) DEFAULT 0;
ALTER TABLE actividades_personales ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 2. PARIDAD DE COLUMNAS EN notas
ALTER TABLE notas ADD COLUMN IF NOT EXISTS tipo_nota VARCHAR(50) DEFAULT 'GENERAL';
ALTER TABLE notas ADD COLUMN IF NOT EXISTS block_nombre VARCHAR(100) DEFAULT 'General';
ALTER TABLE notas ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 3. PARIDAD DE COLUMNAS EN tareas
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS es_mav BOOLEAN DEFAULT false;
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS costo_real_pen NUMERIC(12,2) DEFAULT 0;
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS archivado BOOLEAN DEFAULT false;
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS hora_inicio VARCHAR(10) DEFAULT '08:00';
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 4. PUBLICACIÓN IDEMPOTENTE EN supabase_realtime PARA TODAS LAS 12 TABLAS
DO $$
DECLARE
  t TEXT;
  tbls TEXT[] := ARRAY[
    'proyectos',
    'hitos_wbs',
    'tareas',
    'actividades_personales',
    'subtareas_pasos',
    'notas',
    'metas_planes',
    'planes_accion_hitos',
    'habitos_metas_vinculos',
    'gastos',
    'ingresos',
    'cuotas'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN NULL;
      WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END $$;

