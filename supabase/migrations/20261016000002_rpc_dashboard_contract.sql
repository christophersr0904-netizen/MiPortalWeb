-- ============================================================================
-- MIGRATION: 20261016000002_rpc_dashboard_contract.sql
-- PROYECTO: PMO Personal Modular & Life OS
-- REQUISITO: REQ-MIG-001 (Módulo 1: RPC Contract para compatibilidad directa con Frontend)
-- DESCRIPCIÓN: Implementa get_dashboard_data(p_user_id UUID) en PostgreSQL que
--              entrega la misma estructura JSONB esperada por DashboardService y JS_Core.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
    v_proyectos JSONB := '[]'::jsonb;
    v_hitos JSONB := '[]'::jsonb;
    v_tareas JSONB := '[]'::jsonb;
    v_actividades JSONB := '[]'::jsonb;
    v_subtareas JSONB := '[]'::jsonb;
    v_gastos JSONB := '[]'::jsonb;
    v_ingresos JSONB := '[]'::jsonb;
    v_notas JSONB := '[]'::jsonb;
    v_ideas JSONB := '[]'::jsonb;
    v_cuotas JSONB := '[]'::jsonb;
    v_cash_flow_neto JSONB := '{}'::jsonb;
    v_telemetria JSONB := '{}'::jsonb;

    v_total_ing_cobrados NUMERIC(15,2) := 0.00;
    v_total_ing_pendientes NUMERIC(15,2) := 0.00;
    v_total_gas_pagados NUMERIC(15,2) := 0.00;
    v_total_gas_pendientes NUMERIC(15,2) := 0.00;
    v_flujo_neto NUMERIC(15,2) := 0.00;
    v_flujo_proyectado NUMERIC(15,2) := 0.00;

    v_conteo_heavy INT := 0;
    v_conteo_medium INT := 0;
    v_alerta_sobrecarga BOOLEAN := false;
    v_mensaje_alerta TEXT := 'Carga de proyectos dentro del umbral operativo.';
BEGIN
    -- 1. Proyectos
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'ID_Proyecto', p.codigo_legado,
            'idProyecto', p.codigo_legado,
            'Nombre_Proyecto', p.nombre_proyecto,
            'nombreProyecto', p.nombre_proyecto,
            'Tipo_Iniciativa', p.tipo_iniciativa,
            'tipoIniciativa', p.tipo_iniciativa,
            'Magnitud_Complejidad', p.magnitud_complejidad,
            'magnitudComplejidad', p.magnitud_complejidad,
            'Arquetipo_Proyecto', p.arquetipo_proyecto,
            'arquetipoProyecto', p.arquetipo_proyecto,
            'Estado_Proyecto', p.estado_proyecto,
            'estadoProyecto', p.estado_proyecto,
            'Health_Status', COALESCE(p.health_status, '🟢 Saludable'),
            'Avance_Real_Pct', COALESCE(p.avance_real_pct, 0.00),
            'Entregable_Tangible_Objeto', p.entregable_tangible_objeto,
            'North_Star_OKR', p.north_star_okr,
            'Criterios_Aceptacion_DoD', p.criterios_aceptacion_dod,
            'Ultima_Revision', to_char(p.ultima_revision, 'YYYY-MM-DD'),
            'Fecha_Inicio_Plan', to_char(p.fecha_inicio_plan, 'YYYY-MM-DD'),
            'Fecha_Fin_Plan', to_char(p.fecha_fin_plan, 'YYYY-MM-DD'),
            'Moneda_Base', p.moneda_base,
            'Presupuesto_Tope', COALESCE(p.presupuesto_tope, 0.00),
            'Costo_Ejecutado_Real_PEN', COALESCE(p.costo_ejecutado_real_pen, 0.00),
            'Costo_Ejecutado_Real_USD', COALESCE(p.costo_ejecutado_real_usd, 0.00),
            'Terceros_Involucrados', p.terceros_involucrados,
            'Alcance_Detallado_URL_Drive', p.alcance_detallado_url_drive,
            'featureFlags', jsonb_build_object(
                'arquetipo', p.arquetipo_proyecto,
                'magnitud', p.magnitud_complejidad,
                'flags', jsonb_build_object(
                    'arbolWbsCompleto', (p.magnitud_complejidad <> 'Light'),
                    'rutaCriticaCpm', (p.magnitud_complejidad <> 'Light'),
                    'evmFinanciero', (p.magnitud_complejidad <> 'Light'),
                    'sprintsAgiles', (p.arquetipo_proyecto = '2_Venture'),
                    'tableroHipotesis', (p.arquetipo_proyecto = '2_Venture'),
                    'matrizTradeOff', (p.arquetipo_proyecto IN ('1_Infraestructura', '2_Venture')),
                    'checklistDueDiligence', (p.arquetipo_proyecto = '3_Activo'),
                    'hitosCurriculares', (p.arquetipo_proyecto = '4_Carrera'),
                    'timeBlockingDeepWork', (p.arquetipo_proyecto = '4_Carrera'),
                    'cronogramaTMinus', (p.arquetipo_proyecto = '5_Evento'),
                    'directorioProveedores', (p.arquetipo_proyecto IN ('1_Infraestructura', '5_Evento')),
                    'modoUltraLigero', (p.magnitud_complejidad = 'Light')
                )
            ),
            'Health_Motivo', 'Salud evaluada',
            'SPI', 1.0,
            'CPI', 1.0
        ) ORDER BY p.codigo_legado ASC
    ), '[]'::jsonb)
    INTO v_proyectos
    FROM proyectos p
    WHERE (p_user_id IS NULL OR p.user_id = p_user_id);

    -- 2. Hitos WBS
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', h.id,
            'ID_Elemento_WBS', h.codigo_legado,
            'ID_Hito', h.codigo_legado,
            'idHito', h.codigo_legado,
            'ID_Proyecto', pr.codigo_legado,
            'idProyecto', pr.codigo_legado,
            'proyecto_id', h.proyecto_id,
            'Tipo_Elemento_WBS', h.tipo_elemento_wbs,
            'tipoElementoWbs', h.tipo_elemento_wbs,
            'WBS_Code', h.wbs_code,
            'Fase_Asociada', h.fase_asociada,
            'Nombre_Elemento', h.nombre_elemento,
            'Nombre_Hito', h.nombre_elemento,
            'Estado', h.estado,
            'Estado_Hito', h.estado,
            'Peso_Ponderado_Pct', COALESCE(h.peso_ponderado_pct, 0.00),
            'Fecha_Limite_Plan', to_char(h.fecha_limite_plan, 'YYYY-MM-DD'),
            'Fecha_Real_Fin', to_char(h.fecha_real_fin, 'YYYY-MM-DD'),
            'Presupuesto_Asignado', COALESCE(h.presupuesto_asignado, 0.00),
            'Costo_Asociado_Estimado', COALESCE(h.presupuesto_asignado, 0.00),
            'Criterio_Aceptacion_DoD', h.criterio_aceptacion_dod,
            'Dependencia_Predecesora', dep.codigo_legado,
            'Dependencia_ID_Hito', dep.codigo_legado,
            'Entregable_Verificable_Link', h.entregable_verificable_link
        ) ORDER BY h.wbs_code ASC, h.codigo_legado ASC
    ), '[]'::jsonb)
    INTO v_hitos
    FROM hitos_wbs h
    JOIN proyectos pr ON pr.id = h.proyecto_id
    LEFT JOIN hitos_wbs dep ON dep.id = h.dependencia_hito_id
    WHERE (p_user_id IS NULL OR h.user_id = p_user_id);

    -- 3. Tareas
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', t.id,
            'ID_Tarea', t.codigo_legado,
            'idTarea', t.codigo_legado,
            'ID_Hito', h.codigo_legado,
            'idHito', h.codigo_legado,
            'ID_Proyecto', pr.codigo_legado,
            'idProyecto', pr.codigo_legado,
            'Nombre_Tarea_Actividad', t.nombre_tarea_actividad,
            'Nombre_Tarea', t.nombre_tarea_actividad,
            'Estado_Tarea', t.estado_tarea,
            'Estado', t.estado_tarea,
            'Prioridad_Eisenhower', t.prioridad_eisenhower,
            'Nivel_Energia_Requerido', t.nivel_energia_requerido,
            'Horas_Estimadas', COALESCE(t.horas_estimadas, 1.00),
            'Horas_Reales', COALESCE(t.horas_reales, 0.00),
            'Fecha_Programada', to_char(t.fecha_programada, 'YYYY-MM-DD'),
            'Agendado_En_Calendar', t.agendado_en_calendar,
            'ID_Dependencia', dep_t.codigo_legado,
            'Responsable_Ejecutor', t.responsable_ejecutor,
            'Notas_Impedimentos', t.notas_impedimentos,
            'Notas', t.notas_impedimentos
        ) ORDER BY t.codigo_legado ASC
    ), '[]'::jsonb)
    INTO v_tareas
    FROM tareas t
    JOIN hitos_wbs h ON h.id = t.hito_id
    JOIN proyectos pr ON pr.id = t.proyecto_id
    LEFT JOIN tareas dep_t ON dep_t.id = t.dependencia_tarea_id
    WHERE (p_user_id IS NULL OR t.user_id = p_user_id);

    -- 4. Actividades Personales
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', a.id,
            'ID_Actividad', a.codigo_legado,
            'idActividad', a.codigo_legado,
            'Nombre', a.nombre,
            'Nombre_Actividad', a.nombre,
            'Tipo_Registro', a.tipo_registro,
            'Tipo_Compromiso', a.tipo_registro,
            'Categoria_Vida', a.categoria_vida,
            'Meta_Macro_Nombre', a.meta_macro_nombre,
            'Unidad_Medida', a.unidad_medida,
            'Meta_Objetivo_Total', COALESCE(a.meta_objetivo_total, 0.00),
            'Valor_Acumulado_Actual', COALESCE(a.valor_acumulado_actual, 0.00),
            'Meta_Diaria_Estandar', COALESCE(a.meta_diaria_estandar, 0.00),
            'Nivel_Rescate_Minimo', COALESCE(a.nivel_rescate_minimo, 0.00),
            'Estado', a.estado,
            'Racha_Actual', COALESCE(a.racha_actual, 0),
            'Fecha_Programada', to_char(a.fecha_programada, 'YYYY-MM-DD'),
            'Hora_Inicio', COALESCE(a.hora_inicio, '08:00'),
            'Duracion_Horas', COALESCE(a.duracion_horas, 1.00),
            'Agendado_Calendar', COALESCE(a.agendado_calendar, 'No'),
            'ID_Evento_Calendar', a.id_evento_calendar
        ) ORDER BY a.codigo_legado ASC
    ), '[]'::jsonb)
    INTO v_actividades
    FROM actividades_personales a
    WHERE (p_user_id IS NULL OR a.user_id = p_user_id);

    -- 5. Subtareas / Pasos
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'ID_Subtarea', s.codigo_legado,
            'idSubtarea', s.codigo_legado,
            'ID_Padre_Vinculado', COALESCE(tar.codigo_legado, act.codigo_legado),
            'idPadreVinculado', COALESCE(tar.codigo_legado, act.codigo_legado),
            'ID_Padre', COALESCE(tar.codigo_legado, act.codigo_legado),
            'idPadre', COALESCE(tar.codigo_legado, act.codigo_legado),
            'Tipo_Padre', CASE WHEN s.tarea_id IS NOT NULL THEN 'TAREA' ELSE 'ACTIVIDAD' END,
            'tipoPadre', CASE WHEN s.tarea_id IS NOT NULL THEN 'TAREA' ELSE 'ACTIVIDAD' END,
            'Numero_Paso', s.numero_paso,
            'numeroPaso', s.numero_paso,
            'Descripcion_Paso', s.descripcion_paso,
            'descripcionPaso', s.descripcion_paso,
            'Completado', s.completado,
            'completado', s.completado,
            'Fecha_Completado', to_char(s.fecha_completado, 'YYYY-MM-DD HH24:MI:SS'),
            'fechaCompletado', to_char(s.fecha_completado, 'YYYY-MM-DD HH24:MI:SS')
        ) ORDER BY s.numero_paso ASC, s.codigo_legado ASC
    ), '[]'::jsonb)
    INTO v_subtareas
    FROM subtareas_pasos s
    LEFT JOIN tareas tar ON tar.id = s.tarea_id
    LEFT JOIN actividades_personales act ON act.id = s.actividad_id
    WHERE (p_user_id IS NULL OR s.user_id = p_user_id);

    -- 6. Gastos
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', g.id,
            'ID_Gasto', g.codigo_legado,
            'ID_Transaccion', g.codigo_legado,
            'Tipo_Origen', g.tipo_origen,
            'tipoOrigen', g.tipo_origen,
            'ID_Origen_Vinculado', g.id_origen_vinculado_legado,
            'idOrigenVinculado', g.id_origen_vinculado_legado,
            'ID_Cuota', g.id_cuota_legado,
            'idCuota', g.id_cuota_legado,
            'Fecha_Gasto', to_char(g.fecha_gasto, 'YYYY-MM-DD'),
            'fechaGasto', to_char(g.fecha_gasto, 'YYYY-MM-DD'),
            'Descripcion_Gasto', g.descripcion_gasto,
            'descripcionGasto', g.descripcion_gasto,
            'Descripcion', g.descripcion_gasto,
            'Categoria_Gasto', g.categoria_gasto,
            'categoriaGasto', g.categoria_gasto,
            'Moneda_Original', g.moneda_original,
            'Monto_Original', g.monto_original,
            'Tipo_Cambio', g.tipo_cambio,
            'Monto_PEN', g.monto_pen,
            'montoPEN', g.monto_pen,
            'Metodo_Pago', g.metodo_pago,
            'Estado_Pago', g.estado_pago,
            'Modalidad', CASE WHEN lower(g.estado_pago) LIKE '%pendiente%' OR lower(g.estado_pago) LIKE '%programado%' THEN 'Programado / Proyectado' ELSE 'Real / Ejecutado' END,
            'Comprobante_URL', g.comprobante_url
        ) ORDER BY g.fecha_gasto DESC, g.codigo_legado DESC
    ), '[]'::jsonb)
    INTO v_gastos
    FROM finanzas_gastos g
    WHERE (p_user_id IS NULL OR g.user_id = p_user_id);

    -- 7. Ingresos
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', i.id,
            'ID_Ingreso', i.codigo_legado,
            'Tipo_Origen', i.tipo_origen,
            'tipoOrigen', i.tipo_origen,
            'ID_Origen_Vinculado', i.id_origen_vinculado_legado,
            'Fecha_Ingreso', to_char(i.fecha_ingreso, 'YYYY-MM-DD'),
            'Descripcion_Ingreso', i.descripcion_ingreso,
            'Categoria_Ingreso', i.categoria_ingreso,
            'Moneda_Original', i.moneda_original,
            'Monto_Original', i.monto_original,
            'Tipo_Cambio', i.tipo_cambio,
            'Monto_PEN', i.monto_pen,
            'montoPEN', i.monto_pen,
            'Metodo_Cobro', i.metodo_cobro,
            'Estado_Cobro', i.estado_cobro,
            'Conciliado', (lower(i.estado_cobro) IN ('cobrado', 'ejecutado', 'real / ejecutado'))
        ) ORDER BY i.fecha_ingreso DESC, i.codigo_legado DESC
    ), '[]'::jsonb)
    INTO v_ingresos
    FROM finanzas_ingresos i
    WHERE (p_user_id IS NULL OR i.user_id = p_user_id);

    -- 8. Notas
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', n.id,
            'ID_Nota', n.codigo_legado,
            'idNota', n.codigo_legado,
            'Titulo', n.titulo,
            'Tipo_Nota', CASE
                WHEN n.wishlist_json <> '{}'::jsonb AND n.wishlist_json IS NOT NULL THEN 'WISHLIST'
                WHEN jsonb_array_length(n.checklists_json) > 0 THEN 'CHECKLIST'
                ELSE 'NORMAL'
            END,
            'Contenido_Markdown', n.contenido_markdown,
            'Checklists_JSON', n.checklists_json,
            'Wishlist_JSON', n.wishlist_json,
            'Color_Tema', n.color_tema,
            'Es_Fijada', n.es_fijada,
            'Adjuntos_Drive_JSON', n.adjuntos_drive_json,
            'Enlaces_Entidades_JSON', n.enlaces_entidades_json,
            'Etiquetas', n.etiquetas,
            'Fecha_Creacion', to_char(n.fecha_creacion, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'Fecha_Actualizacion', to_char(n.fecha_actualizacion, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        ) ORDER BY n.es_fijada DESC, n.fecha_actualizacion DESC
    ), '[]'::jsonb)
    INTO v_notas
    FROM notas n
    WHERE (p_user_id IS NULL OR n.user_id = p_user_id);

    -- 9. Ideas
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', d.id,
            'ID_Idea', d.codigo_legado,
            'Enunciado_Idea', d.enunciado_idea,
            'Detalle_Contexto', d.detalle_contexto,
            'Tipo_Captura', d.tipo_captura,
            'URL_Adjunto_Drive', d.url_adjunto_drive,
            'Transcripcion_Texto', d.transcripcion_texto,
            'Clarificacion_IA', d.clarificacion_ia,
            'Estado', d.estado,
            'Entidad_Convertida', d.entidad_convertida,
            'ID_Entidad_Destino', d.id_entidad_destino_legado,
            'Fecha_Captura', to_char(d.fecha_captura, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'Fecha_Procesada', to_char(d.fecha_procesada, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'Fecha_Archivado', to_char(d.fecha_archivado, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        ) ORDER BY d.fecha_captura DESC
    ), '[]'::jsonb)
    INTO v_ideas
    FROM ideas d
    WHERE (p_user_id IS NULL OR d.user_id = p_user_id);

    -- 10. Cuotas Consolidadas en Memoria SQL
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'ID_Cuota', sub.id_cuota_legado,
            'idCuota', sub.id_cuota_legado,
            'idPlan', sub.id_cuota_legado,
            'Nombre_Plan', sub.nombre_plan,
            'Descripcion', sub.nombre_plan || ' (' || sub.total_cuotas || ' cuotas)',
            'Monto_Total', sub.monto_total,
            'Num_Cuotas', sub.total_cuotas,
            'Cuotas_Pagadas', sub.cuotas_pagadas,
            'Cuotas_Pendientes', sub.cuotas_pendientes,
            'Monto_Pagado', sub.monto_pagado,
            'Saldo_Pendiente', GREATEST(0, sub.monto_total - sub.monto_pagado),
            'Estado', CASE WHEN sub.cuotas_pagadas >= sub.total_cuotas OR (sub.monto_total - sub.monto_pagado) <= 0 THEN 'COMPLETADO' ELSE 'ACTIVO' END,
            'Fecha_Inicio', to_char(sub.primera_fecha, 'YYYY-MM-DD')
        )
    ), '[]'::jsonb)
    INTO v_cuotas
    FROM (
        SELECT
            g.id_cuota_legado,
            COALESCE(MAX(g.descripcion_gasto), g.id_cuota_legado) AS nombre_plan,
            COUNT(*) AS total_cuotas,
            COUNT(*) FILTER (WHERE lower(g.estado_pago) IN ('pagado', 'conciliado', 'ejecutado')) AS cuotas_pagadas,
            COUNT(*) FILTER (WHERE lower(g.estado_pago) NOT IN ('pagado', 'conciliado', 'ejecutado')) AS cuotas_pendientes,
            COALESCE(SUM(g.monto_pen), 0.00) AS monto_total,
            COALESCE(SUM(g.monto_pen) FILTER (WHERE lower(g.estado_pago) IN ('pagado', 'conciliado', 'ejecutado')), 0.00) AS monto_pagado,
            MIN(g.fecha_gasto) AS primera_fecha
        FROM finanzas_gastos g
        WHERE g.id_cuota_legado IS NOT NULL AND btrim(g.id_cuota_legado) <> ''
          AND (p_user_id IS NULL OR g.user_id = p_user_id)
        GROUP BY g.id_cuota_legado
    ) sub;

    -- 11. Cálculos de Cash Flow Neto
    SELECT
        COALESCE(SUM(monto_pen) FILTER (WHERE lower(estado_cobro) IN ('cobrado', 'ejecutado', 'real / ejecutado')), 0.00),
        COALESCE(SUM(monto_pen) FILTER (WHERE lower(estado_cobro) NOT IN ('cobrado', 'ejecutado', 'real / ejecutado')), 0.00)
    INTO v_total_ing_cobrados, v_total_ing_pendientes
    FROM finanzas_ingresos
    WHERE (p_user_id IS NULL OR user_id = p_user_id);

    SELECT
        COALESCE(SUM(monto_pen) FILTER (WHERE lower(estado_pago) IN ('pagado', 'conciliado', 'ejecutado')), 0.00),
        COALESCE(SUM(monto_pen) FILTER (WHERE lower(estado_pago) NOT IN ('pagado', 'conciliado', 'ejecutado')), 0.00)
    INTO v_total_gas_pagados, v_total_gas_pendientes
    FROM finanzas_gastos
    WHERE (p_user_id IS NULL OR user_id = p_user_id);

    v_flujo_neto := v_total_ing_cobrados - v_total_gas_pagados;
    v_flujo_proyectado := (v_total_ing_cobrados + v_total_ing_pendientes) - (v_total_gas_pagados + v_total_gas_pendientes);

    v_cash_flow_neto := jsonb_build_object(
        'totalIngresosCobradosPEN', v_total_ing_cobrados,
        'totalIngresosPendientesPEN', v_total_ing_pendientes,
        'totalGastosPagadosPEN', v_total_gas_pagados,
        'totalGastosPendientesPEN', v_total_gas_pendientes,
        'flujoNetoPEN', v_flujo_neto,
        'flujoNetoProyectadoPEN', v_flujo_proyectado
    );

    -- 12. Telemetría de Carga Operativa
    SELECT
        COUNT(*) FILTER (WHERE magnitud_complejidad = 'Heavy' AND estado_proyecto = '03_En_Ejecucion'),
        COUNT(*) FILTER (WHERE magnitud_complejidad = 'Medium' AND estado_proyecto = '03_En_Ejecucion')
    INTO v_conteo_heavy, v_conteo_medium
    FROM proyectos
    WHERE (p_user_id IS NULL OR user_id = p_user_id);

    IF v_conteo_heavy > 1 OR v_conteo_medium > 2 THEN
        v_alerta_sobrecarga := true;
        v_mensaje_alerta := 'Advertencia: Capacidad ejecutiva en riesgo (Proyectos activos: Heavy=' || v_conteo_heavy || ', Medium=' || v_conteo_medium || ').';
    END IF;

    v_telemetria := jsonb_build_object(
        'alertaSobrecarga', v_alerta_sobrecarga,
        'conteoHeavy', v_conteo_heavy,
        'conteoMedium', v_conteo_medium,
        'mensajeAlerta', v_mensaje_alerta
    );

    -- 13. Ensamblado del Payload Final idéntico a DashboardService.getDashboardData
    RETURN jsonb_build_object(
        'success', true,
        'proyectos', v_proyectos,
        'hitos', v_hitos,
        'tareas', v_tareas,
        'gastos', v_gastos,
        'actividades', v_actividades,
        'actividadesPersonales', v_actividades,
        'ingresos', v_ingresos,
        'subtareas', v_subtareas,
        'notas', v_notas,
        'ideas', v_ideas,
        'flujoCaja', '[]'::jsonb,
        'cuotas', v_cuotas,
        'cashFlowNeto', v_cash_flow_neto,
        'resumenFinanciero', v_cash_flow_neto,
        'inversionBienestar', jsonb_build_object(
            'SALUD_DEPORTE', 0.00,
            'DESARROLLO_ESTUDIO', 0.00,
            'FINANZAS_TRAMITES', 0.00,
            'SOCIAL_FAMILIA', 0.00,
            'PERSONAL_DESCANSO', 0.00,
            'LABORAL_HONORARIO', 0.00
        ),
        'telemetriaCarga', v_telemetria
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
