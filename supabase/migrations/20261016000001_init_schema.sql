-- ============================================================================
-- MIGRATION: 20261016000001_init_schema.sql
-- PROYECTO: PMO Personal Modular & Life OS
-- REQUISITO: REQ-MIG-001 (Módulo 1: Cimientos Relacionales PostgreSQL / Supabase)
-- DESCRIPCIÓN: DDL de las 10 tablas canónicas, claves UUID, preservación de
--              códigos legados, secuencias nativas, triggers, RLS e índices JSONB.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. SECUENCIAS NATIVAS PARA CÓDIGOS CORRELATIVOS LEGADOS
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS seq_codigo_proyectos START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_wp START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_hit START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_tareas START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_actividades START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_subtareas START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_gastos START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_ingresos START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_notas START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_decisiones START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_ideas START 1;

-- ============================================================================
-- 2. FUNCIONES TRIGGER REUTILIZABLES (TIMESTAMP Y GENERACIÓN DE CORRELATIVOS)
-- ============================================================================

-- 2.1. Actualizador automático de updated_at
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2.2. Generador autónomo de código legado (elimina dependencia de LockService)
CREATE OR REPLACE FUNCTION fn_generar_codigo_legado()
RETURNS TRIGGER AS $$
DECLARE
    v_fecha_hoy TEXT;
BEGIN
    IF NEW.codigo_legado IS NOT NULL AND btrim(NEW.codigo_legado) <> '' THEN
        RETURN NEW;
    END IF;

    CASE TG_TABLE_NAME
        WHEN 'proyectos' THEN
            NEW.codigo_legado := 'PRO-' || lpad(nextval('seq_codigo_proyectos')::TEXT, 3, '0');
        WHEN 'hitos_wbs' THEN
            IF NEW.tipo_elemento_wbs = 'HITO_MARCADOR' THEN
                NEW.codigo_legado := 'HIT-' || lpad(nextval('seq_codigo_hit')::TEXT, 3, '0');
            ELSE
                NEW.codigo_legado := 'WP-' || lpad(nextval('seq_codigo_wp')::TEXT, 3, '0');
            END IF;
        WHEN 'tareas' THEN
            NEW.codigo_legado := 'TAR-' || lpad(nextval('seq_codigo_tareas')::TEXT, 3, '0');
        WHEN 'actividades_personales' THEN
            NEW.codigo_legado := 'ACT-' || lpad(nextval('seq_codigo_actividades')::TEXT, 3, '0');
        WHEN 'subtareas_pasos' THEN
            NEW.codigo_legado := 'SUB-' || lpad(nextval('seq_codigo_subtareas')::TEXT, 3, '0');
        WHEN 'finanzas_gastos' THEN
            NEW.codigo_legado := 'GAS-' || lpad(nextval('seq_codigo_gastos')::TEXT, 3, '0');
        WHEN 'finanzas_ingresos' THEN
            NEW.codigo_legado := 'ING-' || lpad(nextval('seq_codigo_ingresos')::TEXT, 3, '0');
        WHEN 'notas' THEN
            NEW.codigo_legado := 'NOT-' || lpad(nextval('seq_codigo_notas')::TEXT, 5, '0');
        WHEN 'decisiones_tradeoff' THEN
            NEW.codigo_legado := 'DEC-' || lpad(nextval('seq_codigo_decisiones')::TEXT, 4, '0');
        WHEN 'ideas' THEN
            v_fecha_hoy := to_char(now() AT TIME ZONE 'America/Lima', 'YYYYMMDD');
            NEW.codigo_legado := 'IDE-' || v_fecha_hoy || '-' || lpad(nextval('seq_codigo_ideas')::TEXT, 3, '0');
        ELSE
            NEW.codigo_legado := 'ENT-' || lpad(floor(random() * 900 + 100)::TEXT, 3, '0');
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. DEFINICIÓN DE TABLAS CANÓNICAS (10 ENTIDADES)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA 1: proyectos (BBDD_Proyectos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    codigo_legado VARCHAR(32) NOT NULL UNIQUE,
    nombre_proyecto TEXT NOT NULL,
    tipo_iniciativa VARCHAR(50) NOT NULL CHECK (tipo_iniciativa IN ('Profesional', 'Inversiones', 'Personal')),
    magnitud_complejidad VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (magnitud_complejidad IN ('Light', 'Medium', 'Heavy')),
    arquetipo_proyecto VARCHAR(50) NOT NULL DEFAULT '1_Infraestructura' CHECK (arquetipo_proyecto IN ('1_Infraestructura', '2_Venture', '3_Activo', '4_Carrera', '5_Evento')),
    estado_proyecto VARCHAR(50) NOT NULL DEFAULT '01_Backlog' CHECK (estado_proyecto IN ('01_Backlog', '02_Planificado', '03_En_Ejecucion', '04_En_Pausa', '05_Cancelado', '06_Cerrado')),
    health_status VARCHAR(50) DEFAULT '🟢 Saludable',
    avance_real_pct NUMERIC(5,2) DEFAULT 0.00 CHECK (avance_real_pct >= 0 AND avance_real_pct <= 100),
    entregable_tangible_objeto TEXT,
    north_star_okr TEXT,
    criterios_aceptacion_dod TEXT,
    ultima_revision DATE,
    fecha_inicio_plan DATE,
    fecha_fin_plan DATE,
    moneda_base VARCHAR(10) NOT NULL DEFAULT 'PEN' CHECK (moneda_base IN ('PEN', 'USD', 'EUR')),
    presupuesto_tope NUMERIC(15,2) DEFAULT 0.00 CHECK (presupuesto_tope >= 0),
    costo_ejecutado_real_pen NUMERIC(15,2) DEFAULT 0.00 CHECK (costo_ejecutado_real_pen >= 0),
    costo_ejecutado_real_usd NUMERIC(15,2) DEFAULT 0.00 CHECK (costo_ejecutado_real_usd >= 0),
    terceros_involucrados TEXT,
    alcance_detallado_url_drive TEXT,
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- TABLA 2: hitos_wbs (BBDD_Hitos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hitos_wbs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    codigo_legado VARCHAR(32) NOT NULL UNIQUE,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    tipo_elemento_wbs VARCHAR(30) NOT NULL CHECK (tipo_elemento_wbs IN ('PAQUETE_TRABAJO', 'HITO_MARCADOR')),
    wbs_code VARCHAR(50),
    fase_asociada VARCHAR(50) NOT NULL CHECK (fase_asociada IN ('Iniciacion', 'Planificacion', 'Ejecucion', 'Control', 'Cierre')),
    nombre_elemento TEXT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT '01_Pendiente' CHECK (estado IN ('01_Pendiente', '02_En_Progreso', '03_Completado', '04_Cancelado')),
    peso_ponderado_pct NUMERIC(5,2) DEFAULT 0.00 CHECK (peso_ponderado_pct >= 0 AND peso_ponderado_pct <= 100),
    fecha_limite_plan DATE,
    fecha_real_fin DATE,
    presupuesto_asignado NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (presupuesto_asignado >= 0),
    criterio_aceptacion_dod TEXT,
    dependencia_hito_id UUID REFERENCES hitos_wbs(id) ON DELETE SET NULL,
    entregable_verificable_link TEXT,
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_hito_marcador_presupuesto_cero CHECK (
        tipo_elemento_wbs != 'HITO_MARCADOR' OR presupuesto_asignado = 0.00
    )
);

-- ----------------------------------------------------------------------------
-- TABLA 3: tareas (BBDD_Actividades_Tareas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tareas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    codigo_legado VARCHAR(32) NOT NULL UNIQUE,
    hito_id UUID NOT NULL REFERENCES hitos_wbs(id) ON DELETE CASCADE,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    nombre_tarea_actividad TEXT NOT NULL,
    estado_tarea VARCHAR(50) NOT NULL DEFAULT '01_Backlog' CHECK (estado_tarea IN ('01_Backlog', '02_Por_Hacer', '03_En_Proceso', '04_Completado', '05_Archivado')),
    prioridad_eisenhower VARCHAR(50) DEFAULT '02_P2_Media' CHECK (prioridad_eisenhower IN ('01_P1_Alta', '02_P2_Media', '03_P3_Baja', '04_P4_Delegable')),
    nivel_energia_requerido VARCHAR(50) DEFAULT 'Media_Operativa' CHECK (nivel_energia_requerido IN ('Alta_Cognitiva_DeepWork', 'Media_Operativa', 'Baja_Administrativa')),
    horas_estimadas NUMERIC(6,2) DEFAULT 1.00 CHECK (horas_estimadas >= 0),
    horas_reales NUMERIC(6,2) DEFAULT 0.00 CHECK (horas_reales >= 0),
    fecha_programada DATE,
    agendado_en_calendar VARCHAR(100) DEFAULT 'No',
    dependencia_tarea_id UUID REFERENCES tareas(id) ON DELETE SET NULL,
    responsable_ejecutor VARCHAR(100) DEFAULT 'Christopher',
    notas_impedimentos TEXT,
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- TABLA 4: actividades_personales (BBDD_Actividades_Personales)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actividades_personales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    codigo_legado VARCHAR(32) NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    tipo_registro VARCHAR(30) NOT NULL DEFAULT 'HABITUAL' CHECK (tipo_registro IN ('HABITUAL', 'PUNTUAL', 'META')),
    categoria_vida VARCHAR(50) NOT NULL CHECK (categoria_vida IN ('SALUD_DEPORTE', 'DESARROLLO_ESTUDIO', 'FINANZAS_TRAMITES', 'SOCIAL_FAMILIA', 'PERSONAL_DESCANSO', 'LABORAL_HONORARIO')),
    meta_macro_nombre TEXT,
    unidad_medida VARCHAR(50),
    meta_objetivo_total NUMERIC(12,2) DEFAULT 0.00 CHECK (meta_objetivo_total >= 0),
    valor_acumulado_actual NUMERIC(12,2) DEFAULT 0.00 CHECK (valor_acumulado_actual >= 0),
    meta_diaria_estandar NUMERIC(12,2) DEFAULT 0.00 CHECK (meta_diaria_estandar >= 0),
    nivel_rescate_minimo NUMERIC(12,2) DEFAULT 0.00 CHECK (nivel_rescate_minimo >= 0),
    estado VARCHAR(50) NOT NULL DEFAULT '02_Por_Hacer' CHECK (estado IN ('01_Backlog', '02_Por_Hacer', '03_En_Proceso', '04_Completado', '05_Archivado')),
    racha_actual INTEGER DEFAULT 0 CHECK (racha_actual >= 0),
    fecha_programada DATE,
    hora_inicio VARCHAR(10) DEFAULT '08:00',
    duracion_horas NUMERIC(4,2) DEFAULT 1.00 CHECK (duracion_horas >= 0),
    agendado_calendar VARCHAR(20) DEFAULT 'No',
    id_evento_calendar TEXT,
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- TABLA 5: subtareas_pasos (BBDD_Subtareas_Pasos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subtareas_pasos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    codigo_legado VARCHAR(32) NOT NULL UNIQUE,
    tarea_id UUID REFERENCES tareas(id) ON DELETE CASCADE,
    actividad_id UUID REFERENCES actividades_personales(id) ON DELETE CASCADE,
    numero_paso INTEGER NOT NULL DEFAULT 1 CHECK (numero_paso >= 1),
    descripcion_paso TEXT NOT NULL,
    completado BOOLEAN NOT NULL DEFAULT false,
    fecha_completado TIMESTAMPTZ,
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_subtarea_exclusividad_padre CHECK (
        (tarea_id IS NOT NULL AND actividad_id IS NULL) OR
        (tarea_id IS NULL AND actividad_id IS NOT NULL)
    )
);

-- ----------------------------------------------------------------------------
-- TABLA 6: finanzas_gastos (BBDD_Finanzas_Gastos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finanzas_gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    codigo_legado VARCHAR(32) NOT NULL UNIQUE,
    tipo_origen VARCHAR(30) NOT NULL DEFAULT 'LIBRE_CORRIENTE' CHECK (tipo_origen IN ('TAREA_PROYECTO', 'ACTIVIDAD_PERSONAL', 'LIBRE_CORRIENTE')),
    id_origen_vinculado_legado VARCHAR(32) DEFAULT 'NINGUNO',
    proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
    tarea_id UUID REFERENCES tareas(id) ON DELETE SET NULL,
    actividad_id UUID REFERENCES actividades_personales(id) ON DELETE SET NULL,
    id_cuota_legado VARCHAR(32),
    fecha_gasto DATE NOT NULL,
    descripcion_gasto TEXT NOT NULL,
    categoria_gasto VARCHAR(100) NOT NULL,
    moneda_original VARCHAR(10) NOT NULL DEFAULT 'PEN' CHECK (moneda_original IN ('PEN', 'USD', 'EUR')),
    monto_original NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (monto_original >= 0),
    tipo_cambio NUMERIC(8,4) NOT NULL DEFAULT 1.0000 CHECK (tipo_cambio > 0),
    monto_pen NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (monto_pen >= 0),
    metodo_pago VARCHAR(50) DEFAULT 'Transferencia_Bancaria',
    estado_pago VARCHAR(50) DEFAULT 'Pagado',
    comprobante_url TEXT,
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- TABLA 7: finanzas_ingresos (BBDD_Finanzas_Ingresos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finanzas_ingresos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    codigo_legado VARCHAR(32) NOT NULL UNIQUE,
    tipo_origen VARCHAR(30) NOT NULL DEFAULT 'LIBRE_CORRIENTE' CHECK (tipo_origen IN ('LIBRE_CORRIENTE', 'PROYECTO', 'ACTIVIDAD_PERSONAL')),
    id_origen_vinculado_legado VARCHAR(32) DEFAULT 'NINGUNO',
    proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
    actividad_id UUID REFERENCES actividades_personales(id) ON DELETE SET NULL,
    fecha_ingreso DATE NOT NULL,
    descripcion_ingreso TEXT NOT NULL,
    categoria_ingreso VARCHAR(100) NOT NULL,
    moneda_original VARCHAR(10) NOT NULL DEFAULT 'PEN' CHECK (moneda_original IN ('PEN', 'USD', 'EUR')),
    monto_original NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (monto_original >= 0),
    tipo_cambio NUMERIC(8,4) NOT NULL DEFAULT 1.0000 CHECK (tipo_cambio > 0),
    monto_pen NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (monto_pen >= 0),
    metodo_cobro VARCHAR(50) DEFAULT 'BCP',
    estado_cobro VARCHAR(50) DEFAULT 'Cobrado',
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- TABLA 8: notas (BBDD_Notas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    codigo_legado VARCHAR(32) NOT NULL UNIQUE,
    titulo TEXT NOT NULL,
    contenido_markdown TEXT NOT NULL DEFAULT '',
    checklists_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    wishlist_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    color_tema VARCHAR(50) NOT NULL DEFAULT 'default',
    es_fijada BOOLEAN NOT NULL DEFAULT false,
    adjuntos_drive_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    enlaces_entidades_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    etiquetas JSONB NOT NULL DEFAULT '[]'::jsonb,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- TABLA 9: decisiones_tradeoff (BBDD_Decisiones_TradeOff)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decisiones_tradeoff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    codigo_legado VARCHAR(32) NOT NULL UNIQUE,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    titulo_decision TEXT NOT NULL,
    arquetipo_activo VARCHAR(50),
    criterios_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    alternativas_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    matriz_evaluacion_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    alternativa_recomendada TEXT,
    score_ganador NUMERIC(4,2),
    estado_decision VARCHAR(50) NOT NULL DEFAULT 'Aprobada' CHECK (estado_decision IN ('Aprobada', 'En_Revision', 'Descartada')),
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- TABLA 10: ideas (BBDD_Ideas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    codigo_legado VARCHAR(32) NOT NULL UNIQUE,
    enunciado_idea TEXT NOT NULL,
    detalle_contexto TEXT NOT NULL DEFAULT '',
    tipo_captura VARCHAR(20) NOT NULL DEFAULT 'TEXTO' CHECK (tipo_captura IN ('TEXTO', 'AUDIO', 'FOTO')),
    url_adjunto_drive TEXT,
    transcripcion_texto TEXT,
    clarificacion_ia JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado VARCHAR(30) NOT NULL DEFAULT 'Inbox' CHECK (estado IN ('Inbox', 'Incubacion', 'Procesada', 'Archivada')),
    entidad_convertida VARCHAR(20) CHECK (entidad_convertida IS NULL OR entidad_convertida IN ('TAREA', 'PROYECTO', 'HABITO', 'NOTA')),
    id_entidad_destino_legado VARCHAR(32),
    fecha_captura TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_procesada TIMESTAMPTZ,
    fecha_archivado TIMESTAMPTZ,
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. BINDING DE TRIGGERS EN LAS 10 TABLAS
-- ============================================================================

-- Proyectos
CREATE TRIGGER trg_proyectos_codigo BEFORE INSERT ON proyectos FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_legado();
CREATE TRIGGER trg_proyectos_updated BEFORE UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Hitos WBS
CREATE TRIGGER trg_hitos_codigo BEFORE INSERT ON hitos_wbs FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_legado();
CREATE TRIGGER trg_hitos_updated BEFORE UPDATE ON hitos_wbs FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Tareas
CREATE TRIGGER trg_tareas_codigo BEFORE INSERT ON tareas FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_legado();
CREATE TRIGGER trg_tareas_updated BEFORE UPDATE ON tareas FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Actividades Personales
CREATE TRIGGER trg_actividades_codigo BEFORE INSERT ON actividades_personales FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_legado();
CREATE TRIGGER trg_actividades_updated BEFORE UPDATE ON actividades_personales FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Subtareas / Pasos
CREATE TRIGGER trg_subtareas_codigo BEFORE INSERT ON subtareas_pasos FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_legado();
CREATE TRIGGER trg_subtareas_updated BEFORE UPDATE ON subtareas_pasos FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Gastos
CREATE TRIGGER trg_gastos_codigo BEFORE INSERT ON finanzas_gastos FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_legado();
CREATE TRIGGER trg_gastos_updated BEFORE UPDATE ON finanzas_gastos FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Ingresos
CREATE TRIGGER trg_ingresos_codigo BEFORE INSERT ON finanzas_ingresos FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_legado();
CREATE TRIGGER trg_ingresos_updated BEFORE UPDATE ON finanzas_ingresos FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Notas
CREATE TRIGGER trg_notas_codigo BEFORE INSERT ON notas FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_legado();
CREATE TRIGGER trg_notas_updated BEFORE UPDATE ON notas FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Decisiones Trade-Off
CREATE TRIGGER trg_decisiones_codigo BEFORE INSERT ON decisiones_tradeoff FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_legado();
CREATE TRIGGER trg_decisiones_updated BEFORE UPDATE ON decisiones_tradeoff FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Ideas
CREATE TRIGGER trg_ideas_codigo BEFORE INSERT ON ideas FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_legado();
CREATE TRIGGER trg_ideas_updated BEFORE UPDATE ON ideas FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 5. ÍNDICES DE ALTO RENDIMIENTO (GIN PARA JSONB Y B-TREE PARA FK/ESTADOS)
-- ============================================================================

-- Índices GIN en JSONB
CREATE INDEX IF NOT EXISTS idx_notas_enlaces_gin ON notas USING gin (enlaces_entidades_json);
CREATE INDEX IF NOT EXISTS idx_notas_etiquetas_gin ON notas USING gin (etiquetas);
CREATE INDEX IF NOT EXISTS idx_notas_checklists_gin ON notas USING gin (checklists_json);
CREATE INDEX IF NOT EXISTS idx_notas_wishlist_gin ON notas USING gin (wishlist_json);
CREATE INDEX IF NOT EXISTS idx_decisiones_criterios_gin ON decisiones_tradeoff USING gin (criterios_json);
CREATE INDEX IF NOT EXISTS idx_decisiones_alternativas_gin ON decisiones_tradeoff USING gin (alternativas_json);
CREATE INDEX IF NOT EXISTS idx_ideas_clarificacion_gin ON ideas USING gin (clarificacion_ia);

-- Índices B-Tree en Proyectos
CREATE INDEX IF NOT EXISTS idx_proyectos_codigo ON proyectos(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado_proyecto);
CREATE INDEX IF NOT EXISTS idx_proyectos_user ON proyectos(user_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_updated ON proyectos(updated_at);

-- Índices B-Tree en Hitos WBS
CREATE INDEX IF NOT EXISTS idx_hitos_codigo ON hitos_wbs(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_hitos_proyecto ON hitos_wbs(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_hitos_dependencia ON hitos_wbs(dependencia_hito_id);
CREATE INDEX IF NOT EXISTS idx_hitos_estado ON hitos_wbs(estado);

-- Índices B-Tree en Tareas
CREATE INDEX IF NOT EXISTS idx_tareas_codigo ON tareas(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_tareas_hito ON tareas(hito_id);
CREATE INDEX IF NOT EXISTS idx_tareas_proyecto ON tareas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_tareas_dependencia ON tareas(dependencia_tarea_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado_tarea);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha ON tareas(fecha_programada);

-- Índices B-Tree en Actividades Personales
CREATE INDEX IF NOT EXISTS idx_actividades_codigo ON actividades_personales(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_actividades_estado ON actividades_personales(estado);
CREATE INDEX IF NOT EXISTS idx_actividades_categoria ON actividades_personales(categoria_vida);
CREATE INDEX IF NOT EXISTS idx_actividades_fecha ON actividades_personales(fecha_programada);

-- Índices B-Tree en Subtareas
CREATE INDEX IF NOT EXISTS idx_subtareas_codigo ON subtareas_pasos(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_subtareas_tarea ON subtareas_pasos(tarea_id);
CREATE INDEX IF NOT EXISTS idx_subtareas_actividad ON subtareas_pasos(actividad_id);

-- Índices B-Tree en Finanzas Gastos e Ingresos
CREATE INDEX IF NOT EXISTS idx_gastos_codigo ON finanzas_gastos(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_gastos_proyecto ON finanzas_gastos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_gastos_tarea ON finanzas_gastos(tarea_id);
CREATE INDEX IF NOT EXISTS idx_gastos_actividad ON finanzas_gastos(actividad_id);
CREATE INDEX IF NOT EXISTS idx_gastos_cuota ON finanzas_gastos(id_cuota_legado);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON finanzas_gastos(fecha_gasto);
CREATE INDEX IF NOT EXISTS idx_ingresos_codigo ON finanzas_ingresos(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_ingresos_proyecto ON finanzas_ingresos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON finanzas_ingresos(fecha_ingreso);

-- Índices B-Tree en Notas, Decisiones e Ideas
CREATE INDEX IF NOT EXISTS idx_notas_codigo ON notas(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_notas_es_fijada ON notas(es_fijada);
CREATE INDEX IF NOT EXISTS idx_decisiones_codigo ON decisiones_tradeoff(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_decisiones_proyecto ON decisiones_tradeoff(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ideas_codigo ON ideas(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_ideas_estado ON ideas(estado);

-- ============================================================================
-- 6. POLÍTICAS DE SEGURIDAD BASADAS EN FILAS (ROW LEVEL SECURITY - RLS)
-- ============================================================================

ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitos_wbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades_personales ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtareas_pasos ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisiones_tradeoff ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_proyectos_user ON proyectos FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_hitos_user ON hitos_wbs FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_tareas_user ON tareas FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_actividades_user ON actividades_personales FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_subtareas_user ON subtareas_pasos FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_gastos_user ON finanzas_gastos FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_ingresos_user ON finanzas_ingresos FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_notas_user ON notas FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_decisiones_user ON decisiones_tradeoff FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_ideas_user ON ideas FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
