-- ============================================================================
-- MIGRATION: 20261019000001_metas_planes_hitos_schema.sql
-- PROYECTO: PMO Personal Modular & Life OS
-- REQUISITO: REQ-PLANES-METAS-EXEC-11: Creación de Entidades Metas, Planes, Hitos y Vínculos N:M
-- DESCRIPCIÓN: DDL canónico de metas_planes, planes_accion_hitos, habitos_metas_vinculos,
--              y habito_cumplimiento_logs con RLS, triggers y secuencias.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. SECUENCIAS NATIVAS PARA CÓDIGOS CORRELATIVOS
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS seq_codigo_metas START 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_hit_plan START 1;

-- ============================================================================
-- 2. TABLA 1: metas_planes
-- ============================================================================
CREATE TABLE IF NOT EXISTS metas_planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    codigo_legado VARCHAR(32) UNIQUE,
    nombre_meta TEXT NOT NULL,
    descripcion TEXT,
    categoria_vida VARCHAR(50) NOT NULL,
    tipo_meta VARCHAR(30) DEFAULT 'CUANTITATIVA',
    unidad_medida VARCHAR(50),
    meta_objetivo_total NUMERIC(12,2) DEFAULT 0,
    valor_acumulado_actual NUMERIC(12,2) DEFAULT 0,
    nivel_rescate_minimo NUMERIC(12,2) DEFAULT 0,
    peso_hitos_pct NUMERIC(5,2) DEFAULT 50.0,
    peso_habitos_pct NUMERIC(5,2) DEFAULT 50.0,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(30) DEFAULT '02_En_Progreso',
    proyecto_id UUID NULL REFERENCES proyectos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    sync_status VARCHAR(20) DEFAULT 'synced'
);

-- ============================================================================
-- 3. TABLA 2: planes_accion_hitos
-- ============================================================================
CREATE TABLE IF NOT EXISTS planes_accion_hitos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    codigo_legado VARCHAR(32) UNIQUE,
    meta_id UUID NOT NULL REFERENCES metas_planes(id) ON DELETE CASCADE,
    titulo_hito TEXT NOT NULL,
    orden_secuencia INTEGER DEFAULT 1,
    fecha_objetivo DATE,
    completado BOOLEAN DEFAULT FALSE,
    fecha_completado DATE,
    peso_relativo NUMERIC(5,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    sync_status VARCHAR(20) DEFAULT 'synced'
);

-- ============================================================================
-- 4. TABLA 3: habitos_metas_vinculos
-- ============================================================================
CREATE TABLE IF NOT EXISTS habitos_metas_vinculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    habito_id UUID NOT NULL REFERENCES actividades_personales(id) ON DELETE CASCADE,
    meta_id UUID NOT NULL REFERENCES metas_planes(id) ON DELETE CASCADE,
    modo_computo VARCHAR(30) DEFAULT 'VOLUMEN_DIRECTO',
    factor_conversion NUMERIC(8,4) DEFAULT 1.0,
    peso_contribucion_pct NUMERIC(5,2) DEFAULT 100.0,
    meta_volumen_esperada NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'synced',
    CONSTRAINT uq_habito_meta UNIQUE (habito_id, meta_id)
);

-- ============================================================================
-- 5. TABLA 4: habito_cumplimiento_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS habito_cumplimiento_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    habito_id UUID NOT NULL REFERENCES actividades_personales(id) ON DELETE CASCADE,
    fecha_registro DATE NOT NULL,
    hora_registro VARCHAR(10),
    completado BOOLEAN DEFAULT TRUE,
    valor_cuantitativo_sumado NUMERIC(12,2) DEFAULT 1.0,
    es_rescate BOOLEAN DEFAULT FALSE,
    nota_contexto TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'synced'
);

-- ============================================================================
-- 6. GENERADOR DE CÓDIGO LEGADO
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_generar_codigo_metas_planes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_legado IS NOT NULL AND btrim(NEW.codigo_legado) <> '' THEN
        RETURN NEW;
    END IF;

    CASE TG_TABLE_NAME
        WHEN 'metas_planes' THEN
            NEW.codigo_legado := 'MET-' || lpad(nextval('seq_codigo_metas')::TEXT, 3, '0');
        WHEN 'planes_accion_hitos' THEN
            NEW.codigo_legado := 'HIT-PLN-' || lpad(nextval('seq_codigo_hit_plan')::TEXT, 3, '0');
        ELSE
            NEW.codigo_legado := 'ENT-' || lpad(floor(random() * 900 + 100)::TEXT, 3, '0');
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_metas_planes_codigo
    BEFORE INSERT ON metas_planes
    FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_metas_planes();

CREATE TRIGGER trg_planes_accion_hitos_codigo
    BEFORE INSERT ON planes_accion_hitos
    FOR EACH ROW EXECUTE FUNCTION fn_generar_codigo_metas_planes();

-- ============================================================================
-- 7. TRIGGERS DE ACTUALIZACIÓN DE TIMESTAMP
-- ============================================================================
CREATE TRIGGER trg_metas_planes_updated
    BEFORE UPDATE ON metas_planes
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_planes_accion_hitos_updated
    BEFORE UPDATE ON planes_accion_hitos
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_habitos_metas_vinculos_updated
    BEFORE UPDATE ON habitos_metas_vinculos
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_habito_cumplimiento_logs_updated
    BEFORE UPDATE ON habito_cumplimiento_logs
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 8. POLÍTICAS DE SEGURIDAD BASADAS EN FILAS (ROW LEVEL SECURITY - RLS)
-- ============================================================================
ALTER TABLE metas_planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes_accion_hitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitos_metas_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE habito_cumplimiento_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_metas_planes_user ON metas_planes FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_planes_accion_hitos_user ON planes_accion_hitos FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_habitos_metas_vinculos_user ON habitos_metas_vinculos FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY policy_habito_cumplimiento_logs_user ON habito_cumplimiento_logs FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- ============================================================================
-- 9. ÍNDICES DE RENDIMIENTO (B-TREE)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_metas_planes_user ON metas_planes(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_planes_codigo ON metas_planes(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_metas_planes_categoria ON metas_planes(categoria_vida);
CREATE INDEX IF NOT EXISTS idx_metas_planes_estado ON metas_planes(estado);
CREATE INDEX IF NOT EXISTS idx_metas_planes_proyecto ON metas_planes(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_planes_hitos_user ON planes_accion_hitos(user_id);
CREATE INDEX IF NOT EXISTS idx_planes_hitos_meta ON planes_accion_hitos(meta_id);
CREATE INDEX IF NOT EXISTS idx_planes_hitos_codigo ON planes_accion_hitos(codigo_legado);
CREATE INDEX IF NOT EXISTS idx_planes_hitos_orden ON planes_accion_hitos(orden_secuencia);

CREATE INDEX IF NOT EXISTS idx_habitos_vinculos_user ON habitos_metas_vinculos(user_id);
CREATE INDEX IF NOT EXISTS idx_habitos_vinculos_habito ON habitos_metas_vinculos(habito_id);
CREATE INDEX IF NOT EXISTS idx_habitos_vinculos_meta ON habitos_metas_vinculos(meta_id);

CREATE INDEX IF NOT EXISTS idx_habito_logs_user ON habito_cumplimiento_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habito_logs_habito ON habito_cumplimiento_logs(habito_id);
CREATE INDEX IF NOT EXISTS idx_habito_logs_fecha ON habito_cumplimiento_logs(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_habito_logs_habito_fecha ON habito_cumplimiento_logs(habito_id, fecha_registro);
