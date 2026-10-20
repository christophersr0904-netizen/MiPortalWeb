-- ============================================================================
-- ARCHIVO GENERADO AUTOMÁTICAMENTE POR PIPELINE ETL
-- FECHA: 2026-10-16T11:12:49.802Z
-- USUARIO POR DEFECTO: 00000000-0000-0000-0000-000000000001
-- ============================================================================
BEGIN;

-- 1. INSERCIÓN DE PROYECTOS (NIVEL 0)
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-001',
  'Certificación PMP y Diplomatura',
  'Profesional',
  'Heavy',
  '4_Carrera',
  '03_En_Ejecucion',
  '🔴 Crítico',
  65.00,
  'Certificado Oficial PMP y Diploma de Graduación',
  'Obtener credencial internacional de gestión de proyectos',
  '100% de módulos aprobados y examen PMP rendido con resultado apto',
  '2026-10-10'::date,
  '2026-03-01'::date,
  '2026-11-30'::date,
  'PEN',
  12500.00,
  1563.75,
  0.00,
  'CENTRUM PUCP, PMI',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-002',
  'Portafolio Renta Variable y Fondos',
  'Inversiones',
  'Medium',
  '3_Activo',
  '03_En_Ejecucion',
  '🔴 Crítico',
  40.00,
  'Dashboard de seguimiento y cuenta de inversión fondeada',
  'Generar rentabilidad anualizada mínima de 9% neto',
  'Estrategia de asignación ejecutada y aportes mensuales automatizados',
  '2026-10-10'::date,
  '2026-01-15'::date,
  '2026-12-31'::date,
  'USD',
  5000.00,
  0.00,
  2100.00,
  'Interfondos SAF',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-003',
  'Habilitación Eléctrica e Inmueble',
  'Personal',
  'Medium',
  '1_Infraestructura',
  '02_Planificado',
  '🔴 Crítico',
  15.00,
  'Medidor instalado y acta de conformidad técnica',
  'Garantizar suministro formal y saneamiento del predio',
  'Aprobación de inspección técnica municipal y contrato vigente con distribuidora',
  '2026-10-10'::date,
  '2026-08-01'::date,
  '2026-12-15'::date,
  'PEN',
  4500.00,
  856.00,
  0.00,
  'Hidrandina, Municipalidad',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-004',
  'Programa Acondicionamiento 10K',
  'Personal',
  'Light',
  '5_Evento',
  '03_En_Ejecucion',
  '🔴 Crítico',
  50.00,
  'Registro de tiempos oficial y dorsal de carrera',
  'Completar circuito 10K en menos de 50 minutos',
  'Plan de entrenamiento cumplido al 90% y tiempo objetivo validado',
  '2026-10-10'::date,
  '2026-07-01'::date,
  '2026-11-20'::date,
  'PEN',
  800.00,
  320.00,
  0.00,
  'Ninguno',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-005',
  'Renovación Equipamiento Estación Trabajo',
  'Profesional',
  'Light',
  '3_Activo',
  '01_Backlog',
  '🟢 Saludable',
  0.00,
  'Estación de trabajo ergonómica y hardware configurado',
  'Mejorar ergonomía y rendimiento en jornadas remotas',
  'Hardware recepcionado, periféricos instalados y pruebas de estrés superadas',
  '2026-10-10'::date,
  '2026-11-01'::date,
  '2026-12-10'::date,
  'USD',
  1800.00,
  0.00,
  0.00,
  'Ninguno',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-006',
  'Constitución Empresa Corretaje Inmobiliario',
  'Inversiones',
  'Medium',
  '2_Venture',
  '03_En_Ejecucion',
  '🔴 Crítico',
  30.00,
  'RUC 20 activo y registro Agente MVCS',
  'Lanzar corretaje y firmar 3 propiedades en exclusiva',
  'Inscripción SUNARP conforme y código de agente MVCS emitido',
  '2026-10-10'::date,
  '2026-09-01'::date,
  '2027-02-28'::date,
  'PEN',
  3500.00,
  1336.00,
  0.00,
  'SUNARP, SUNAT, MVCS',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-007',
  'Importación y Venta Accesorios Espresso 58mm',
  'Inversiones',
  'Medium',
  '2_Venture',
  '03_En_Ejecucion',
  '🔴 Crítico',
  55.00,
  'Lote de 30 portafiltros comercializado y liquidado',
  'Lograr margen neto >= 45% con rotación completa de stock',
  'Desaduanaje técnico aprobado y retorno de capital verificado',
  '2026-10-10'::date,
  '2026-09-01'::date,
  '2026-10-31'::date,
  'USD',
  2000.00,
  1090.00,
  1080.00,
  'DHL, SUNAT',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-008',
  'Framework Gobierno Ágil y Dashboard PMO',
  'Profesional',
  'Medium',
  '1_Infraestructura',
  '03_En_Ejecucion',
  '🔴 Crítico',
  70.00,
  'Dashboard de portafolio Looker/Jira y cadencia de sprints',
  'Optimizar visibilidad de delivery y gobernanza de squads',
  'Validación de Dirección Corporativa y squads operando rituales',
  '2026-10-10'::date,
  '2026-08-01'::date,
  '2026-12-31'::date,
  'USD',
  4000.00,
  3982.50,
  1162.00,
  'Jira, Miro',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-009',
  'Manual Operativo y Estandarización PMO',
  'Profesional',
  'Medium',
  '3_Activo',
  '03_En_Ejecucion',
  '🔴 Crítico',
  60.00,
  'Manual de procesos ágiles y talleres de liderazgo',
  'Alcanzar satisfacción NPS >= 9 en líderes capacitados',
  'Manual firmado por stakeholders y métricas NPS consolidadas',
  '2026-10-10'::date,
  '2026-08-01'::date,
  '2026-11-30'::date,
  'PEN',
  4000.00,
  260.00,
  128.00,
  'Ninguno',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-010',
  'Lanzamiento Marca Café Especialidad y Tienda Digital',
  'Inversiones',
  'Medium',
  '2_Venture',
  '02_Planificado',
  '🔴 Crítico',
  20.00,
  'Registro Sanitario DIGESA y tienda Shopify operativa',
  'Conseguir los primeros 100 pedidos de bolsas 250g',
  'Resolución sanitaria emitida, packaging impreso y pasarela activa',
  '2026-10-10'::date,
  '2026-09-01'::date,
  '2027-03-31'::date,
  'PEN',
  6000.00,
  2130.00,
  310.00,
  'DIGESA, Shopify',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-011',
  'Automatización OCR Facturas y Conciliación Flujo Caja',
  'Profesional',
  'Light',
  '3_Activo',
  '03_En_Ejecucion',
  '🔴 Crítico',
  65.00,
  'Pipeline OCR Cloud Vision y webhook de conciliación bancaria',
  'Automatizar el 90% del procesamiento de comprobantes y alertas',
  'Integración Make/GAS en producción y reporte semanal enviado',
  '2026-10-10'::date,
  '2026-08-01'::date,
  '2026-10-31'::date,
  'USD',
  600.00,
  314.81,
  193.95,
  'Make.com, SendGrid',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-012',
  'Programa Mentoría Emprendimientos Comunitarios',
  'Personal',
  'Light',
  '5_Evento',
  '02_Planificado',
  '🔴 Crítico',
  15.00,
  '5 planes de negocio operativos y certificados de graduación',
  'Fortalecer capacidades de gestión y finanzas en líderes barriales',
  '10 sesiones formativas completadas y pitch final evaluado',
  '2026-10-10'::date,
  '2026-09-01'::date,
  '2026-12-15'::date,
  'PEN',
  1000.00,
  285.00,
  0.00,
  'ONG Aliada',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();
INSERT INTO proyectos (
  user_id, codigo_legado, nombre_proyecto, tipo_iniciativa, magnitud_complejidad,
  arquetipo_proyecto, estado_proyecto, health_status, avance_real_pct,
  entregable_tangible_objeto, north_star_okr, criterios_aceptacion_dod,
  ultima_revision, fecha_inicio_plan, fecha_fin_plan, moneda_base,
  presupuesto_tope, costo_ejecutado_real_pen, costo_ejecutado_real_usd,
  terceros_involucrados, alcance_detallado_url_drive, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PRO-013',
  'Titulacion de Ingeniero Industrial',
  'Profesional',
  'Medium',
  '4_Carrera',
  '02_Planificado',
  '🔴 Crítico',
  0.00,
  'Carton de Titulo y Numero de Colegiatura',
  'Realizar el trabajo de tesis y sustentar',
  '1. numero de Colegiatura',
  '2026-10-13'::date,
  '2026-10-13'::date,
  '2027-04-09'::date,
  'PEN',
  10000.00,
  0.00,
  0.00,
  'Modalidad: Ejecutor Directo | Recursos: Bachiller, Tesis, Asesor, Empresa, Tema | Partida: Cero Absoluto (Greenfield) | Restricciones: Tiempo de respuesta de aceptacion de Titulo.',
  'https://drive.google.com/drive/folders/1UpouoJFZ_Dpv_rECGrSl3qubNvMsnirf',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_proyecto = EXCLUDED.nombre_proyecto,
  estado_proyecto = EXCLUDED.estado_proyecto,
  avance_real_pct = EXCLUDED.avance_real_pct,
  presupuesto_tope = EXCLUDED.presupuesto_tope,
  costo_ejecutado_real_pen = EXCLUDED.costo_ejecutado_real_pen,
  costo_ejecutado_real_usd = EXCLUDED.costo_ejecutado_real_usd,
  updated_at = now();

-- 2. INSERCIÓN DE HITOS WBS (PASADA 1: CREACIÓN CON FK PROYECTO)
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-001',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-001'),
  'PAQUETE_TRABAJO',
  '1.1',
  'Iniciacion',
  'Diagnóstico y alineamiento curricular',
  '03_Completado',
  0.15,
  '2026-03-31'::date,
  '2026-03-28'::date,
  1500.00,
  'Plan de estudios y cronograma aprobados',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-002',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-001'),
  'PAQUETE_TRABAJO',
  '1.2',
  'Ejecucion',
  'Desarrollo de módulos formativos y 35 PDUs',
  '03_Completado',
  0.35,
  '2026-08-31'::date,
  '2026-08-25'::date,
  4500.00,
  'Certificado de horas de contacto emitido',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-003',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-001'),
  'PAQUETE_TRABAJO',
  '1.3',
  'Ejecucion',
  'Simulación de examen y preparación intensiva',
  '02_En_Progreso',
  0.30,
  '2026-10-31'::date,
  NULL,
  3500.00,
  'Score promedio >= 80% en simulador',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-001',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-001'),
  'HITO_MARCADOR',
  '1.4',
  'Cierre',
  'Obtención de Certificación PMP y Grado',
  '01_Pendiente',
  0.20,
  '2026-11-30'::date,
  NULL,
  0.00,
  'Credencial oficial emitida por PMI',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-004',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-002'),
  'PAQUETE_TRABAJO',
  '2.1',
  'Planificacion',
  'Diseño de portafolio y política de inversión',
  '03_Completado',
  0.20,
  '2026-02-28'::date,
  '2026-02-20'::date,
  500.00,
  'Matriz de diversificación y activos definida',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-005',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-002'),
  'PAQUETE_TRABAJO',
  '2.2',
  'Ejecucion',
  'Apertura, fondeo y compra inicial de ETFs',
  '03_Completado',
  0.40,
  '2026-06-30'::date,
  '2026-06-15'::date,
  2500.00,
  'Órdenes de compra ejecutadas en broker',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-006',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-002'),
  'PAQUETE_TRABAJO',
  '2.3',
  'Control',
  'Aportes periódicos y rebalanceo semestral',
  '02_En_Progreso',
  0.30,
  '2026-11-30'::date,
  NULL,
  1500.00,
  'Aportes mensuales automatizados y registrados',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-002',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-002'),
  'HITO_MARCADOR',
  '2.4',
  'Cierre',
  'Rendimiento anual auditado y consolidado',
  '01_Pendiente',
  0.10,
  '2026-12-31'::date,
  NULL,
  0.00,
  'Dashboard cerrado con rentabilidad >= 9%',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-007',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-003'),
  'PAQUETE_TRABAJO',
  '3.1',
  'Planificacion',
  'Expediente técnico y solicitud municipal',
  '03_Completado',
  0.25,
  '2026-08-31'::date,
  '2026-08-28'::date,
  800.00,
  'Copia literal y planos visados ingresados',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-008',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-003'),
  'PAQUETE_TRABAJO',
  '3.2',
  'Ejecucion',
  'Instalación de murete y acometida técnica',
  '02_En_Progreso',
  0.40,
  '2026-10-31'::date,
  NULL,
  2500.00,
  'Inspección técnica aprobada por concesionaria',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-009',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-003'),
  'PAQUETE_TRABAJO',
  '3.3',
  'Control',
  'Instalación de medidor y pruebas de carga',
  '01_Pendiente',
  0.25,
  '2026-11-30'::date,
  NULL,
  1200.00,
  'Prueba de tensión y puesta a tierra conforme',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-003',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-003'),
  'HITO_MARCADOR',
  '3.4',
  'Cierre',
  'Acta de conformidad y suministro activo',
  '01_Pendiente',
  0.10,
  '2026-12-15'::date,
  NULL,
  0.00,
  'Contrato definitivo y suministro energizado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-010',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-004'),
  'PAQUETE_TRABAJO',
  '4.1',
  'Iniciacion',
  'Evaluación médica y plan nutricional base',
  '03_Completado',
  0.20,
  '2026-07-31'::date,
  '2026-07-28'::date,
  300.00,
  'Certificado médico deportivo emitido',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-011',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-004'),
  'PAQUETE_TRABAJO',
  '4.2',
  'Ejecucion',
  'Periodización de carrera y fortalecimiento',
  '02_En_Progreso',
  0.50,
  '2026-10-31'::date,
  NULL,
  400.00,
  'Registro semanal >= 25 km completado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-004',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-004'),
  'HITO_MARCADOR',
  '4.3',
  'Cierre',
  'Competencia 10K completada sub-50 min',
  '01_Pendiente',
  0.30,
  '2026-11-20'::date,
  NULL,
  0.00,
  'Tiempo oficial de chip validado < 50 min',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-012',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-005'),
  'PAQUETE_TRABAJO',
  '5.1',
  'Planificacion',
  'Especificaciones de hardware y cotizaciones',
  '01_Pendiente',
  0.30,
  '2026-11-10'::date,
  NULL,
  300.00,
  'Cuadro comparativo y orden confirmada',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-013',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-005'),
  'PAQUETE_TRABAJO',
  '5.2',
  'Ejecucion',
  'Compra, ensamblaje y setup ergonómico',
  '01_Pendiente',
  0.50,
  '2026-11-30'::date,
  NULL,
  1200.00,
  'Hardware montado y cableado gestionado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-005',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-005'),
  'HITO_MARCADOR',
  '5.3',
  'Cierre',
  'Estación operativa y pruebas de rendimiento',
  '01_Pendiente',
  0.20,
  '2026-12-10'::date,
  NULL,
  0.00,
  'Benchmark aprobado y ergonomía validada',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-014',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-006'),
  'PAQUETE_TRABAJO',
  '6.1',
  'Iniciacion',
  'Constitución notarial de empresa y trámite SUNARP',
  '03_Completado',
  0.25,
  '2026-09-30'::date,
  '2026-09-28'::date,
  900.00,
  'Escritura pública y títulos registrales ingresados',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-015',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-006'),
  'PAQUETE_TRABAJO',
  '6.2',
  'Planificacion',
  'Acreditación y registro de Agente Inmobiliario MVCS',
  '02_En_Progreso',
  0.35,
  '2026-12-31'::date,
  NULL,
  500.00,
  'Expediente TUPA ingresado y subsanado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-016',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-006'),
  'PAQUETE_TRABAJO',
  '6.3',
  'Ejecucion',
  'Prospección, captación y firma de exclusivas',
  '01_Pendiente',
  0.25,
  '2027-01-31'::date,
  NULL,
  1200.00,
  '3 contratos de mandato en exclusiva suscritos',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-006',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-006'),
  'HITO_MARCADOR',
  '6.4',
  'Cierre',
  'Primera operación cerrada y cobro de comisión',
  '01_Pendiente',
  0.15,
  '2027-02-28'::date,
  NULL,
  0.00,
  'Acta notarial de compraventa y comisión cobrada',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-017',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-007'),
  'PAQUETE_TRABAJO',
  '7.1',
  'Ejecucion',
  'Desaduanaje e inspección técnica de portafiltros',
  '03_Completado',
  0.40,
  '2026-10-15'::date,
  '2026-10-10'::date,
  1200.00,
  'Levante aduanero y control dimensional 58mm',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-018',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-007'),
  'PAQUETE_TRABAJO',
  '7.2',
  'Ejecucion',
  'Campaña comercial, distribución y despacho',
  '02_En_Progreso',
  0.40,
  '2026-10-25'::date,
  NULL,
  500.00,
  'Catálogo publicado y 100% de stock enviado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-007',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-007'),
  'HITO_MARCADOR',
  '7.3',
  'Cierre',
  'Liquidación de ventas y retorno íntegro de capital',
  '01_Pendiente',
  0.20,
  '2026-10-31'::date,
  NULL,
  0.00,
  'Margen neto >= 45% y balance comercial auditado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-019',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-008'),
  'PAQUETE_TRABAJO',
  '8.1',
  'Planificacion',
  'Diseño y despliegue del framework de gobierno ágil',
  '03_Completado',
  0.30,
  '2026-08-31'::date,
  '2026-08-25'::date,
  1500.00,
  'Gobernanza aprobada en comité ejecutivo',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-020',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-008'),
  'PAQUETE_TRABAJO',
  '8.2',
  'Ejecucion',
  'Implementación de dashboard ejecutivo de portafolio',
  '03_Completado',
  0.45,
  '2026-09-30'::date,
  '2026-09-20'::date,
  1800.00,
  'Pipeline Looker/Jira funcional en producción',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-008',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-008'),
  'HITO_MARCADOR',
  '8.3',
  'Cierre',
  'Cadencia de sprints institucionalizada en squads',
  '02_En_Progreso',
  0.25,
  '2026-12-31'::date,
  NULL,
  0.00,
  'Rituales y refinamiento operando al 100%',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-021',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-009'),
  'PAQUETE_TRABAJO',
  '9.1',
  'Planificacion',
  'Elaboración del manual operativo y guías PMO',
  '03_Completado',
  0.50,
  '2026-09-30'::date,
  '2026-09-28'::date,
  1200.00,
  'Manual operativo firmado por stakeholders',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-022',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-009'),
  'PAQUETE_TRABAJO',
  '9.2',
  'Ejecucion',
  'Talleres de formación y medición de adopción NPS',
  '02_En_Progreso',
  0.35,
  '2026-11-30'::date,
  NULL,
  800.00,
  'Talleres concluidos y score NPS >= 9 alcanzado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-009',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-009'),
  'HITO_MARCADOR',
  '9.3',
  'Cierre',
  'Aprobación final y despliegue corporativo',
  '01_Pendiente',
  0.15,
  '2026-11-30'::date,
  NULL,
  0.00,
  'Reporte final de adopción validado por gerencia',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-023',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-010'),
  'PAQUETE_TRABAJO',
  '10.1',
  'Planificacion',
  'Gestión de Registro Sanitario DIGESA y empaques',
  '02_En_Progreso',
  0.40,
  '2026-12-15'::date,
  NULL,
  1800.00,
  'Expediente bromatológico y bolsas trilaminadas',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-024',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-010'),
  'PAQUETE_TRABAJO',
  '10.2',
  'Ejecucion',
  'Desarrollo de tienda Shopify y catálogo digital',
  '01_Pendiente',
  0.40,
  '2027-01-31'::date,
  NULL,
  1200.00,
  'Tienda online con pasarela Culqi/MercadoPago',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-010',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-010'),
  'HITO_MARCADOR',
  '10.3',
  'Cierre',
  'Consecución de los primeros 100 pedidos',
  '01_Pendiente',
  0.20,
  '2027-03-31'::date,
  NULL,
  0.00,
  '100 órdenes entregadas y facturadas conforme',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-025',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-011'),
  'PAQUETE_TRABAJO',
  '11.1',
  'Planificacion',
  'Desarrollo de webhook OCR y extracción de tickets',
  '03_Completado',
  0.45,
  '2026-09-15'::date,
  '2026-09-12'::date,
  350.00,
  'Endpoint OCR procesando boletas y facturas',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-026',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-011'),
  'PAQUETE_TRABAJO',
  '11.2',
  'Ejecucion',
  'Script de conciliación bancaria y reportería',
  '02_En_Progreso',
  0.40,
  '2026-10-25'::date,
  NULL,
  200.00,
  'Conciliación automática y reportes por correo',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-011',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-011'),
  'HITO_MARCADOR',
  '11.3',
  'Cierre',
  'Flujo de caja automatizado en producción',
  '01_Pendiente',
  0.15,
  '2026-10-31'::date,
  NULL,
  0.00,
  '90% de movimientos conciliados sin error manual',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-027',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-012'),
  'PAQUETE_TRABAJO',
  '12.1',
  'Planificacion',
  'Convenio institucional y selección de proyectos',
  '02_En_Progreso',
  0.30,
  '2026-10-20'::date,
  NULL,
  300.00,
  '5 planes comunitarios seleccionados con acta',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-028',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-012'),
  'PAQUETE_TRABAJO',
  '12.2',
  'Ejecucion',
  'Ciclo de 10 mentorías de gestión y finanzas',
  '01_Pendiente',
  0.50,
  '2026-11-30'::date,
  NULL,
  500.00,
  '10 sesiones realizadas y asistencia > 85%',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-012',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-012'),
  'HITO_MARCADOR',
  '12.3',
  'Cierre',
  'Jornada de pitch y graduación de emprendedores',
  '01_Pendiente',
  0.20,
  '2026-12-15'::date,
  NULL,
  0.00,
  'Planes de negocio entregados y diplomas emitidos',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HIT-013',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-001'),
  'HITO_MARCADOR',
  NULL,
  'Planificacion',
  'ejemplo1',
  '01_Pendiente',
  0.25,
  '2026-10-13'::date,
  NULL,
  0.00,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-029',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-001'),
  'PAQUETE_TRABAJO',
  NULL,
  'Ejecucion',
  'PAQUETE_TRABAJO',
  '01_Pendiente',
  0.15,
  NULL,
  NULL,
  0.00,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-030',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-013'),
  'PAQUETE_TRABAJO',
  NULL,
  'Ejecucion',
  'PAQUETE_TRABAJO',
  '01_Pendiente',
  0.15,
  NULL,
  NULL,
  0.00,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-031',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-013'),
  'PAQUETE_TRABAJO',
  NULL,
  'Ejecucion',
  'PAQUETE_TRABAJO',
  '01_Pendiente',
  0.15,
  NULL,
  NULL,
  0.00,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-032',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-005'),
  'PAQUETE_TRABAJO',
  NULL,
  'Ejecucion',
  'PAQUETE_TRABAJO',
  '01_Pendiente',
  0.15,
  NULL,
  NULL,
  0.00,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-034',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-006'),
  'PAQUETE_TRABAJO',
  NULL,
  'Ejecucion',
  'Prueba de Entregable',
  '01_Pendiente',
  0.20,
  '2027-02-01'::date,
  NULL,
  2000.00,
  'Ninguno',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();
INSERT INTO hitos_wbs (
  user_id, codigo_legado, proyecto_id, tipo_elemento_wbs, wbs_code,
  fase_asociada, nombre_elemento, estado, peso_ponderado_pct,
  fecha_limite_plan, fecha_real_fin, presupuesto_asignado,
  criterio_aceptacion_dod, entregable_verificable_link, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WP-035',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-006'),
  'PAQUETE_TRABAJO',
  NULL,
  'Ejecucion',
  'Prueba de Entregable 2',
  '01_Pendiente',
  10.20,
  '2030-01-01'::date,
  NULL,
  12000.00,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_elemento = EXCLUDED.nombre_elemento,
  estado = EXCLUDED.estado,
  presupuesto_asignado = EXCLUDED.presupuesto_asignado,
  peso_ponderado_pct = EXCLUDED.peso_ponderado_pct,
  updated_at = now();

-- 2B. HITOS WBS (PASADA 2: ENLAZAR PREDECESORAS CPM)
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-001')
WHERE codigo_legado = 'WP-002';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-002')
WHERE codigo_legado = 'WP-003';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-003')
WHERE codigo_legado = 'HIT-001';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-004')
WHERE codigo_legado = 'WP-005';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-005')
WHERE codigo_legado = 'WP-006';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-006')
WHERE codigo_legado = 'HIT-002';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-007')
WHERE codigo_legado = 'WP-008';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-008')
WHERE codigo_legado = 'WP-009';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-009')
WHERE codigo_legado = 'HIT-003';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-010')
WHERE codigo_legado = 'WP-011';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-011')
WHERE codigo_legado = 'HIT-004';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-012')
WHERE codigo_legado = 'WP-013';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-013')
WHERE codigo_legado = 'HIT-005';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-014')
WHERE codigo_legado = 'WP-015';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-015')
WHERE codigo_legado = 'WP-016';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-016')
WHERE codigo_legado = 'HIT-006';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-017')
WHERE codigo_legado = 'WP-018';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-018')
WHERE codigo_legado = 'HIT-007';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-019')
WHERE codigo_legado = 'WP-020';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-020')
WHERE codigo_legado = 'HIT-008';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-021')
WHERE codigo_legado = 'WP-022';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-022')
WHERE codigo_legado = 'HIT-009';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-023')
WHERE codigo_legado = 'WP-024';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-024')
WHERE codigo_legado = 'HIT-010';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-025')
WHERE codigo_legado = 'WP-026';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-026')
WHERE codigo_legado = 'HIT-011';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-027')
WHERE codigo_legado = 'WP-028';
UPDATE hitos_wbs
SET dependencia_hito_id = (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-028')
WHERE codigo_legado = 'HIT-012';

-- 3. INSERCIÓN DE TAREAS (PASADA 1: CREACIÓN CON FK HITO Y PROYECTO)
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-001',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-001'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-001'),
  'Revisar temario oficial y bibliografía PMP',
  '04_Completado',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  4.00,
  4.00,
  '2026-03-04'::date,
  'No',
  'Alineamiento curricular verificado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-002',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-001'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-001'),
  'Estructurar cronograma de estudio por dominios',
  '04_Completado',
  '02_P2_Media',
  'Media_Operativa',
  3.00,
  3.00,
  '2026-03-12'::date,
  'No',
  'Christopher',
  'Distribución semanal aprobada',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-003',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-002'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-002'),
  'Completar módulos de enfoque predictivo e híbrido',
  '04_Completado',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  35.00,
  35.00,
  '2026-05-20'::date,
  'No',
  'Christopher',
  '35 PDUs formativas acumuladas',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-004',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-002'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-002'),
  'Resolver casos prácticos de gestión de valor ganado',
  '04_Completado',
  '02_P2_Media',
  'Alta_Cognitiva_DeepWork',
  8.00,
  8.00,
  '2026-08-15'::date,
  'No',
  'Christopher',
  'Ejercicios EVM superados al 100%',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-005',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-003'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-003'),
  'Ejecutar simulacro completo Study Hall 180 preguntas',
  '03_En_Proceso',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  4.00,
  2.00,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Meta: alcanzar más de 80% de aciertos',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-006',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-003'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-003'),
  'Analizar brechas de respuestas incorrectas en simulación',
  '02_Por_Hacer',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  5.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Refuerzo en marco adaptativo y personas',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-007',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-004'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-004'),
  'Definir matriz de asignación de activos indexados',
  '04_Completado',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  4.50,
  4.50,
  '2026-10-12'::date,
  'No',
  'Pesos fijados para ETFs y renta fija',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-008',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-004'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-004'),
  'Redactar política de rebalanceo y aportes periódicos',
  '04_Completado',
  '02_P2_Media',
  'Media_Operativa',
  2.50,
  2.50,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Umbral de tolerancia fijado en 5%',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-009',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-005'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-005'),
  'Ejecutar transferencia de fondeo inicial al bróker',
  '04_Completado',
  '01_P1_Alta',
  'Baja_Administrativa',
  1.50,
  1.50,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Fondos acreditados en cuenta internacional',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-010',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-005'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-005'),
  'Colocar órdenes límite de compra para ETFs VOO y QQQ',
  '04_Completado',
  '01_P1_Alta',
  'Media_Operativa',
  2.00,
  2.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Órdenes ejecutadas a precio objetivo',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-011',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-006'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-006'),
  'Auditar balance mensual y ejecutar aportación recurrente',
  '03_En_Proceso',
  '02_P2_Media',
  'Media_Operativa',
  2.00,
  1.00,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Revisión de correlación de activos',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-012',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-006'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-006'),
  'Calcular desviación porcentual respecto a pesos objetivo',
  '02_Por_Hacer',
  '03_P3_Baja',
  'Alta_Cognitiva_DeepWork',
  3.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Evaluación de rebalanceo semestral',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-013',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-007'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-007'),
  'Tramitar copia literal actualizada del predio en SUNARP',
  '04_Completado',
  '02_P2_Media',
  'Baja_Administrativa',
  2.50,
  2.50,
  '2026-10-12'::date,
  'No',
  'Partida registral saneada',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-014',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-007'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-007'),
  'Elaborar plano eléctrico y memoria descriptiva visada',
  '04_Completado',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  6.00,
  6.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Firma de ingeniero colegiado obtenida',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-015',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-008'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-008'),
  'Construir murete reglamentario e instalar caja toma',
  '03_En_Proceso',
  '01_P1_Alta',
  'Media_Operativa',
  8.00,
  4.50,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Encofrado y canalización completados',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-016',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-008'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-008'),
  'Instalar varilla de puesta a tierra y pozo de descarga',
  '02_Por_Hacer',
  '01_P1_Alta',
  'Media_Operativa',
  5.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Medición de resistencia pendiente < 25 ohm',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-017',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-009'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-009'),
  'Ingresar solicitud de inspección técnica ante distribuidora',
  '01_Backlog',
  '02_P2_Media',
  'Baja_Administrativa',
  2.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Pago de derechos TUPA de inspección',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-018',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-010'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-010'),
  'Realizar análisis bioquímico y test de esfuerzo',
  '04_Completado',
  '01_P1_Alta',
  'Baja_Administrativa',
  3.00,
  3.00,
  '2026-10-12'::date,
  'No',
  'Apto cardiológico validado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-019',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-010'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-010'),
  'Estructurar plan de macronutrientes para alta demanda',
  '04_Completado',
  '02_P2_Media',
  'Alta_Cognitiva_DeepWork',
  2.00,
  2.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Distribución de calorías y proteína fijada',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-020',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-011'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-011'),
  'Ejecutar bloque de series de velocidad 8x400m en pista',
  '03_En_Proceso',
  '01_P1_Alta',
  'Media_Operativa',
  2.00,
  1.00,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Ritmo objetivo: sub-4:20 min/km',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-021',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-011'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-011'),
  'Realizar fondo aeróbico controlado de 12K',
  '02_Por_Hacer',
  '02_P2_Media',
  'Media_Operativa',
  2.50,
  0.00,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Monitoreo de frecuencia cardíaca zona 3',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-022',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-012'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-012'),
  'Comparar modelos y motores de standing desks disponibles',
  '01_Backlog',
  '02_P2_Media',
  'Alta_Cognitiva_DeepWork',
  3.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Priorizar doble motor con memoria digital',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-023',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-012'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-012'),
  'Seleccionar brazo articulado ergonómico para doble pantalla',
  '01_Backlog',
  '03_P3_Baja',
  'Media_Operativa',
  2.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Validar capacidad de carga VESA 100x100',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-024',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-013'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-013'),
  'Ensamblar estructura metálica del escritorio y tablero',
  '01_Backlog',
  '02_P2_Media',
  'Media_Operativa',
  4.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Nivelación y fijación de controladores',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-025',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-013'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-013'),
  'Instalar organizadores de cableado y regleta de poder',
  '01_Backlog',
  '03_P3_Baja',
  'Media_Operativa',
  2.50,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Enrutamiento oculto bajo superficie',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-026',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-014'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-014'),
  'Gestionar reserva de denominación social en portal SUNARP',
  '04_Completado',
  '02_P2_Media',
  'Baja_Administrativa',
  1.50,
  1.50,
  '2026-10-12'::date,
  'No',
  'Reserva aprobada con vigencia registral',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-027',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-014'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-014'),
  'Elaborar minuta de constitución de empresa y elevar a escritura pública',
  '03_En_Proceso',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  4.00,
  1.50,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Firma en notaría y presentación a SUNARP',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-028',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-014'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-014'),
  'Gestionar activación de RUC 20 en SUNAT y clave SOL corporativa',
  '02_Por_Hacer',
  '01_P1_Alta',
  'Media_Operativa',
  3.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Alta de tributos de 3ra categoría',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-029',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-014'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-014'),
  'Tramitar apertura de cuenta corriente bancaria comercial',
  '02_Por_Hacer',
  '02_P2_Media',
  'Baja_Administrativa',
  2.50,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Cuentas operativas en PEN y USD',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-030',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-015'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-015'),
  'Recopilar certificados y antecedentes para expediente de agente MVCS',
  '02_Por_Hacer',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  5.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Curso de especialización acreditado',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-031',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-015'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-015'),
  'Ingresar solicitud y abonar tasa TUPA en mesa de partes MVCS',
  '02_Por_Hacer',
  '02_P2_Media',
  'Media_Operativa',
  2.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Seguimiento de código de expediente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-032',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-016'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-016'),
  'Diseñar dossier corporativo y contrato modelo de exclusividad',
  '01_Backlog',
  '02_P2_Media',
  'Alta_Cognitiva_DeepWork',
  6.00,
  0.00,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Cláusula de comisión estándar 4-5%',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-033',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-016'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-016'),
  'Realizar prospección directa y visitas comerciales a propietarios',
  '01_Backlog',
  '02_P2_Media',
  'Media_Operativa',
  8.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Enfoque en San Isidro, Miraflores y Surco',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-034',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-016'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-016'),
  'Suscribir primeros 3 mandatos de corretaje exclusivo y sesión de fotos',
  '02_Por_Hacer',
  '01_P1_Alta',
  'Media_Operativa',
  6.00,
  0.00,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Producción audiovisual y fichas técnicas',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-035',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-017'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-017'),
  'Monitorear arribo aéreo y liquidar impuestos de importación SUNAT',
  '03_En_Proceso',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  4.50,
  2.00,
  '2026-10-12'::date,
  'Sí',
  'Agenciamiento aduanero courier DHL',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-036',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-017'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-017'),
  'Recepción física e inspección dimensional de portafiltros 58mm',
  '02_Por_Hacer',
  '02_P2_Media',
  'Media_Operativa',
  3.50,
  0.00,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Control de calibres, peso y tolerancias',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-037',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-017'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-017'),
  'Ejecutar pruebas hidráulicas de extracción y sellado en cafetera',
  '02_Por_Hacer',
  '02_P2_Media',
  'Media_Operativa',
  4.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Prueba con café de calibración y flujo',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-038',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-018'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-018'),
  'Preparar empaque individual y rotulado con código de control',
  '02_Por_Hacer',
  '03_P3_Baja',
  'Baja_Administrativa',
  2.50,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Lote de 30 unidades para entrega',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-039',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-018'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-018'),
  'Publicar catálogo comercial en redes sociales y canales especializados',
  '02_Por_Hacer',
  '02_P2_Media',
  'Media_Operativa',
  3.50,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Segmentación dirigida a baristas',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-040',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-018'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-018'),
  'Gestionar órdenes de despacho y envíos locales vía courier',
  '01_Backlog',
  '02_P2_Media',
  'Media_Operativa',
  6.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Distribución en Lima Metropolitana',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-041',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-019'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-019'),
  'Mapear flujos de valor actuales y roles del framework ágil',
  '04_Completado',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  12.00,
  12.00,
  '2026-10-12'::date,
  'Sí',
  'Entrevistas con Tech Leads concluidas',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-042',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-019'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-019'),
  'Presentar modelo de gobernanza para validación de dirección',
  '04_Completado',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  6.00,
  5.50,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Aprobación formal del comité ejecutivo',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-043',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-020'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-020'),
  'Diseñar pipeline de datos y estructura de dashboard en Looker Studio',
  '04_Completado',
  '02_P2_Media',
  'Alta_Cognitiva_DeepWork',
  10.00,
  9.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Conexión con fuentes de datos activa',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-044',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-020'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-020'),
  'Desplegar cadencia de reuniones de sprint y refinamiento en squads',
  '03_En_Proceso',
  '01_P1_Alta',
  'Media_Operativa',
  8.00,
  4.00,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Acompañamiento a ceremonias de 4 squads',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-045',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-021'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-021'),
  'Redactar manual de procesos y definición de Done (DoD) corporativo',
  '04_Completado',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  14.00,
  13.50,
  '2026-10-12'::date,
  'No',
  'Guías estándar y plantillas completas',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-046',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-021'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-021'),
  'Gestionar revisión final y firma de conformidad de stakeholders',
  '04_Completado',
  '01_P1_Alta',
  'Media_Operativa',
  3.00,
  2.50,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Acta de conformidad aprobada',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-047',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-022'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-022'),
  'Facilitar talleres prácticos de adopción ágil para gerentes',
  '03_En_Proceso',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  12.00,
  6.00,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  '4 módulos presenciales programados',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-048',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-022'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-022'),
  'Consolidar encuestas de satisfacción y calcular índice NPS final',
  '02_Por_Hacer',
  '02_P2_Media',
  'Media_Operativa',
  4.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Meta contractual NPS >= 9',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-049',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-023'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-023'),
  'Elaborar expediente técnico bromatológico para registro sanitario',
  '02_Por_Hacer',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  8.00,
  0.00,
  '2026-10-12'::date,
  'Sí',
  'Ensayos fisicoquímicos y microbiológicos',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-050',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-023'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-023'),
  'Diseñar empaque con válvula desgasificadora y coordinar imprenta',
  '02_Por_Hacer',
  '02_P2_Media',
  'Media_Operativa',
  6.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Bolsas pouch trilaminadas 250g',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-051',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-024'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-024'),
  'Configurar tienda digital en Shopify y pasarelas de pago',
  '01_Backlog',
  '02_P2_Media',
  'Alta_Cognitiva_DeepWork',
  10.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Integración de pasarela de pago y logística',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-052',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-024'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-024'),
  'Implementar campañas publicitarias en Meta Ads para prospección',
  '01_Backlog',
  '01_P1_Alta',
  'Media_Operativa',
  8.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Pauta enfocada en café de especialidad',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-053',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-025'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-025'),
  'Crear endpoint en Google Apps Script para captura OCR de boletas',
  '04_Completado',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  6.00,
  6.00,
  '2026-10-12'::date,
  'No',
  'Integración con API Vision completada',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-054',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-025'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-025'),
  'Estructurar mapeo de datos hacia hoja BBDD_Finanzas_Gastos',
  '04_Completado',
  '02_P2_Media',
  'Alta_Cognitiva_DeepWork',
  4.00,
  3.50,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Validación de columnas y tipos de cambio',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-055',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-026'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-026'),
  'Programar algoritmo de conciliación entre cuentas bancarias y flujo',
  '03_En_Proceso',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  8.00,
  5.00,
  '2026-10-12'::date,
  'Sí',
  'Christopher',
  'Reglas de coincidencia por fecha e importe',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-056',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-026'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-026'),
  'Configurar envío programado de reporte financiero semanal por correo',
  '02_Por_Hacer',
  '02_P2_Media',
  'Media_Operativa',
  3.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Alertas de desvío y resumen de caja',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-057',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-027'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-027'),
  'Suscribir acuerdo de cooperación institucional con ONG aliada',
  '02_Por_Hacer',
  '02_P2_Media',
  'Media_Operativa',
  4.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Definición de alcance de mentorías',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-058',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-027'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-027'),
  'Evaluar postulaciones y seleccionar 5 emprendimientos beneficiarios',
  '02_Por_Hacer',
  '01_P1_Alta',
  'Alta_Cognitiva_DeepWork',
  5.00,
  0.00,
  '2026-10-12'::date,
  'No',
  'Christopher',
  'Firma de compromisos de participación',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();
INSERT INTO tareas (
  user_id, codigo_legado, hito_id, proyecto_id, nombre_tarea_actividad,
  estado_tarea, prioridad_eisenhower, nivel_energia_requerido,
  horas_estimadas, horas_reales, fecha_programada, agendado_en_calendar,
  responsable_ejecutor, notas_impedimentos, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TAR-059',
  (SELECT id FROM hitos_wbs WHERE codigo_legado = 'WP-001'),
  (SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = 'WP-001'),
  '1',
  '02_Por_Hacer',
  '02_P2_Media',
  'Media_Operativa',
  1.00,
  0.00,
  '2026-10-16'::date,
  'Sí',
  'Christopher',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre_tarea_actividad = EXCLUDED.nombre_tarea_actividad,
  estado_tarea = EXCLUDED.estado_tarea,
  horas_reales = EXCLUDED.horas_reales,
  updated_at = now();

-- 3B. TAREAS (PASADA 2: ENLAZAR PREDECESORAS OPERATIVAS)
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-001')
WHERE codigo_legado = 'TAR-002';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-002')
WHERE codigo_legado = 'TAR-003';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-003')
WHERE codigo_legado = 'TAR-004';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-004')
WHERE codigo_legado = 'TAR-005';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-005')
WHERE codigo_legado = 'TAR-006';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-007')
WHERE codigo_legado = 'TAR-008';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-008')
WHERE codigo_legado = 'TAR-009';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-009')
WHERE codigo_legado = 'TAR-010';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-010')
WHERE codigo_legado = 'TAR-011';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-011')
WHERE codigo_legado = 'TAR-012';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-013')
WHERE codigo_legado = 'TAR-014';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-014')
WHERE codigo_legado = 'TAR-015';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-015')
WHERE codigo_legado = 'TAR-016';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-016')
WHERE codigo_legado = 'TAR-017';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-018')
WHERE codigo_legado = 'TAR-019';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-019')
WHERE codigo_legado = 'TAR-020';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-020')
WHERE codigo_legado = 'TAR-021';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-022')
WHERE codigo_legado = 'TAR-023';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-023')
WHERE codigo_legado = 'TAR-024';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-024')
WHERE codigo_legado = 'TAR-025';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-026')
WHERE codigo_legado = 'TAR-027';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-027')
WHERE codigo_legado = 'TAR-028';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-028')
WHERE codigo_legado = 'TAR-029';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-028')
WHERE codigo_legado = 'TAR-030';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-030')
WHERE codigo_legado = 'TAR-031';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-031')
WHERE codigo_legado = 'TAR-032';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-032')
WHERE codigo_legado = 'TAR-033';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-033')
WHERE codigo_legado = 'TAR-034';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-035')
WHERE codigo_legado = 'TAR-036';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-036')
WHERE codigo_legado = 'TAR-037';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-037')
WHERE codigo_legado = 'TAR-038';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-038')
WHERE codigo_legado = 'TAR-039';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-039')
WHERE codigo_legado = 'TAR-040';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-041')
WHERE codigo_legado = 'TAR-042';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-042')
WHERE codigo_legado = 'TAR-043';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-043')
WHERE codigo_legado = 'TAR-044';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-045')
WHERE codigo_legado = 'TAR-046';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-046')
WHERE codigo_legado = 'TAR-047';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-047')
WHERE codigo_legado = 'TAR-048';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-049')
WHERE codigo_legado = 'TAR-050';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-050')
WHERE codigo_legado = 'TAR-051';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-051')
WHERE codigo_legado = 'TAR-052';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-053')
WHERE codigo_legado = 'TAR-054';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-054')
WHERE codigo_legado = 'TAR-055';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-055')
WHERE codigo_legado = 'TAR-056';
UPDATE tareas
SET dependencia_tarea_id = (SELECT id FROM tareas WHERE codigo_legado = 'TAR-057')
WHERE codigo_legado = 'TAR-058';

-- 4. INSERCIÓN DE ACTIVIDADES PERSONALES / HÁBITOS (LIFE OS)
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-001',
  'Entrenamiento de fuerza en gimnasio',
  'HABITUAL',
  'SALUD_DEPORTE',
  'Acondicionamiento Físico y Fuerza',
  'sesiones',
  0.00,
  78.00,
  1.00,
  1.00,
  '03_En_Proceso',
  4,
  '2026-10-11'::date,
  '06:30',
  1.00,
  'Sí',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-002',
  'Sesión de carrera continua y series',
  'HABITUAL',
  'SALUD_DEPORTE',
  'Meta 10K Sub-50 min',
  'km',
  500.00,
  285.00,
  8.00,
  3.00,
  '03_En_Proceso',
  2,
  '2026-10-12'::date,
  '06:00',
  1.00,
  'Sí',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-003',
  'Estudio intensivo y simuladores PMP',
  'HABITUAL',
  'DESARROLLO_ESTUDIO',
  'Certificación Profesional PMP',
  'minutos',
  6000.00,
  3850.00,
  60.00,
  20.00,
  '03_En_Proceso',
  5,
  '2026-10-11'::date,
  '07:30',
  1.00,
  'Sí',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-004',
  'Lectura técnica y desarrollo personal',
  'HABITUAL',
  'DESARROLLO_ESTUDIO',
  'Lectura Anual 12 Libros',
  'paginas',
  3600.00,
  2100.00,
  20.00,
  5.00,
  '03_En_Proceso',
  12,
  '2026-10-11'::date,
  '10:00',
  1.00,
  'No',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-005',
  'Conciliación de gastos diarios y flujo',
  'HABITUAL',
  'FINANZAS_TRAMITES',
  'Control Financiero Personal',
  'check',
  0.00,
  240.00,
  1.00,
  1.00,
  '03_En_Proceso',
  18,
  '2026-10-11'::date,
  '09:30',
  1.00,
  'No',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-006',
  'Revisión de portafolio y dividendos',
  'HABITUAL',
  'FINANZAS_TRAMITES',
  'Gestión de Inversiones SAF e IBKR',
  'check',
  0.00,
  38.00,
  1.00,
  1.00,
  '03_En_Proceso',
  3,
  '2026-10-15'::date,
  '06:00',
  1.00,
  'Sí',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-007',
  'Cena y tiempo de calidad en pareja',
  'HABITUAL',
  'SOCIAL_FAMILIA',
  'Vínculo y Bienestar Personal',
  'sesiones',
  0.00,
  45.00,
  1.00,
  1.00,
  '03_En_Proceso',
  1,
  '2026-10-11'::date,
  '08:30',
  1.00,
  'No',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-008',
  'Rutina de sueño 7.5 horas e higiene nocturna',
  'HABITUAL',
  'PERSONAL_DESCANSO',
  'Recuperación y Salud Integral',
  'minutos',
  0.00,
  2800.00,
  450.00,
  420.00,
  '03_En_Proceso',
  6,
  '2026-10-11'::date,
  '11:00',
  1.00,
  'No',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-009',
  'Desconexión digital y caminata al aire libre',
  'HABITUAL',
  'PERSONAL_DESCANSO',
  'Salud Mental y Manejo de Estrés',
  'minutos',
  0.00,
  960.00,
  45.00,
  15.00,
  '03_En_Proceso',
  2,
  '2026-10-12'::date,
  '05:30',
  1.00,
  'No',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-010',
  'Práctica conversacional de inglés',
  'HABITUAL',
  'DESARROLLO_ESTUDIO',
  'Fluidez Profesional Avanzada',
  'minutos',
  4000.00,
  1850.00,
  30.00,
  10.00,
  '03_En_Proceso',
  4,
  '2026-10-13'::date,
  '08:00',
  1.00,
  'Sí',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-011',
  'Planificación semanal y alineamiento PMO',
  'META',
  'LABORAL_HONORARIO',
  'Gobernanza de Proyectos y Delivery',
  'check',
  52.00,
  40.00,
  1.00,
  1.00,
  '02_Por_Hacer',
  8,
  '2026-10-11'::date,
  '06:30',
  1.00,
  'Sí',
  '1idvbn236d8e68skkj7hjduos8@google.com',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-012',
  'Seguimiento de trámite predial y suministros',
  'PUNTUAL',
  'FINANZAS_TRAMITES',
  'Saneamiento Inmobiliario Laredo',
  'check',
  1.00,
  0.00,
  1.00,
  1.00,
  '02_Por_Hacer',
  0,
  '2026-10-14'::date,
  '10:00',
  1.00,
  'Sí',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();
INSERT INTO actividades_personales (
  user_id, codigo_legado, nombre, tipo_registro, categoria_vida,
  meta_macro_nombre, unidad_medida, meta_objetivo_total, valor_acumulado_actual,
  meta_diaria_estandar, nivel_rescate_minimo, estado, racha_actual,
  fecha_programada, hora_inicio, duracion_horas, agendado_calendar,
  id_evento_calendar, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ACT-013',
  'Correr',
  'HABITUAL',
  'LABORAL_HONORARIO',
  NULL,
  NULL,
  0.00,
  0.00,
  0.00,
  0.00,
  '02_Por_Hacer',
  0,
  '2026-10-12'::date,
  '08:00',
  1.00,
  'Sí',
  '2sjrsmmafmqvqf75okkaacoruc@google.com',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  estado = EXCLUDED.estado,
  racha_actual = EXCLUDED.racha_actual,
  valor_acumulado_actual = EXCLUDED.valor_acumulado_actual,
  updated_at = now();

-- 5. INSERCIÓN DE SUBTAREAS / PASOS PROCEDURALES (DESGLOSE POLIMÓRFICO NORMALIZADO)
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-001',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-002'),
  NULL,
  1,
  'Configurar entorno de simulación sin interrupciones y cronómetro en 230 min',
  true,
  '2026-09-10T08:30:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-002',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-002'),
  NULL,
  2,
  'Completar bloque 1 de 60 preguntas y revisión de respuestas dudosas',
  true,
  '2026-09-10T09:45:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-003',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-002'),
  NULL,
  3,
  'Completar bloques 2 y 3 de simulación con pausas reglamentarias',
  true,
  '2026-09-10T12:15:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-004',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-002'),
  NULL,
  4,
  'Analizar matriz de fallos por área de conocimiento y registrar lecciones',
  true,
  '2026-09-10T14:00:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-008',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-001'),
  NULL,
  1,
  'Leer Cap 1: Guía de los Fundamentos y marco conceptual de proyectos',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-009',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-001'),
  NULL,
  2,
  'Sintetizar conceptos de entornos de proyectos y roles del director (Cap 2-3)',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-010',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-001'),
  NULL,
  3,
  'Resolver banco de preguntas de autoevaluación de capítulos 1 a 3',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-017',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-046'),
  NULL,
  1,
  'averiguar si existe  versiones anteriores',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-018',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-046'),
  NULL,
  2,
  'icar cual comprar',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-019',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-046'),
  NULL,
  3,
  '3',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-020',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-016'),
  NULL,
  1,
  'paso1',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-021',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-016'),
  NULL,
  2,
  'paso2',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-022',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-016'),
  NULL,
  3,
  'paso3',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-038',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  1,
  '1',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-039',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  2,
  '2',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-040',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  1,
  'buscar todas las anternativas',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-041',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  1,
  'validar que alternativa es la mejor',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-042',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  2,
  'buscar todas las alternativas',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-043',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  3,
  'IA, APP, PAGA O DONDE',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-044',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  4,
  'Establecer horarios',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-045',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  2,
  'IA, APP , buscar otras alternativas',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-046',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  3,
  'buscar en todos los metodos y las versioens gratis y de paga',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-047',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-003'),
  NULL,
  1,
  'Revisar estructura analítica del proyecto (EDT/WBS) y paquetes de trabajo',
  true,
  '2026-10-10T20:30:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-048',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-003'),
  NULL,
  2,
  'Definir entregables clave y criterios de aceptación con stakeholders',
  true,
  '2026-10-10T21:45:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-049',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-003'),
  NULL,
  3,
  'Validar asignación de recursos y estimación de tiempos de la ruta crítica',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-050',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-004'),
  NULL,
  1,
  'Consolidar matriz de riesgos y evaluar impacto cualitativo y cuantitativo',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-051',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-004'),
  NULL,
  2,
  'Diseñar estrategias de respuesta a riesgos y planes de contingencia',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-052',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  1,
  'Registrar métricas de peso, series y repeticiones del entrenamiento matutino',
  true,
  '2026-10-11T13:15:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-053',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  2,
  'Realizar sesión de estiramiento y movilidad articular posterior',
  true,
  '2026-10-11T13:35:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-054',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  1,
  'Descargar comprobantes de servicios del mes y conciliar consumos',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-055',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  2,
  'Efectuar pago en banca móvil y archivar constancia digital',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-056',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-005'),
  NULL,
  1,
  'Elaborar informe de avance semanal para el comité de dirección',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();
INSERT INTO subtareas_pasos (
  user_id, codigo_legado, tarea_id, actividad_id, numero_paso,
  descripcion_paso, completado, fecha_completado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'SUB-057',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-005'),
  NULL,
  2,
  'Actualizar línea base y porcentaje de avance real vs planificado',
  false,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_paso = EXCLUDED.descripcion_paso,
  completado = EXCLUDED.completado,
  fecha_completado = EXCLUDED.fecha_completado,
  updated_at = now();

-- 6. INSERCIÓN DE GASTOS FINANCIEROS (CON ENLACE RELACIONAL Y CUOTAS)
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-001',
  'TAREA_PROYECTO',
  'TAR-013',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-013'),
  NULL,
  'CUO-001',
  '2026-08-10'::date,
  'Copia literal y gravamen predial SUNARP',
  'Servicios',
  'PEN',
  26.00,
  1.00,
  26.00,
  'Tarjeta_Debito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-002',
  'TAREA_PROYECTO',
  'TAR-014',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-014'),
  NULL,
  NULL,
  '2026-08-22'::date,
  'Memoria descriptiva y plano visado ingeniería',
  'Servicios',
  'PEN',
  450.00,
  1.00,
  450.00,
  'Transferencia',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-003',
  'TAREA_PROYECTO',
  'TAR-015',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-015'),
  NULL,
  NULL,
  '2026-09-05'::date,
  'Cemento, ladrillo y caja de toma eléctrica',
  'Materiales',
  'PEN',
  380.00,
  1.00,
  380.00,
  'Efectivo',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-004',
  'TAREA_PROYECTO',
  'TAR-035',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-035'),
  NULL,
  NULL,
  '2026-09-18'::date,
  'Flete aéreo courier DHL accesorios café',
  'Transporte',
  'USD',
  180.00,
  3.75,
  675.00,
  'Tarjeta_Credito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-005',
  'TAREA_PROYECTO',
  'TAR-035',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-035'),
  NULL,
  NULL,
  '2026-09-22'::date,
  'Agenciamiento e impuestos aduaneros SUNAT',
  'Servicios',
  'PEN',
  320.00,
  1.00,
  320.00,
  'Transferencia',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-006',
  'TAREA_PROYECTO',
  'TAR-037',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-037'),
  NULL,
  NULL,
  '2026-09-26'::date,
  'Café de especialidad para calibración de flujo',
  'Materiales',
  'PEN',
  95.00,
  1.00,
  95.00,
  'Transferencia',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-007',
  'TAREA_PROYECTO',
  'TAR-026',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-026'),
  NULL,
  NULL,
  '2026-09-16'::date,
  'Reserva preferencial de razón social SUNARP',
  'Servicios',
  'PEN',
  26.00,
  1.00,
  26.00,
  'Tarjeta_Debito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-008',
  'TAREA_PROYECTO',
  'TAR-027',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-027'),
  NULL,
  NULL,
  '2026-09-20'::date,
  'Gastos notariales elaboración de minuta SAC',
  'Servicios',
  'PEN',
  650.00,
  1.00,
  650.00,
  'Transferencia',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-009',
  'TAREA_PROYECTO',
  'TAR-027',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-027'),
  NULL,
  NULL,
  '2026-09-23'::date,
  'Derechos registrales de inscripción societaria',
  'Servicios',
  'PEN',
  210.00,
  1.00,
  210.00,
  'Transferencia',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-010',
  'TAREA_PROYECTO',
  'TAR-031',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-031'),
  NULL,
  NULL,
  '2026-09-25'::date,
  'Tasa TUPA registro de agente inmobiliario MVCS',
  'Servicios',
  'PEN',
  450.00,
  1.00,
  450.00,
  'Transferencia',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-011',
  'TAREA_PROYECTO',
  'TAR-043',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-043'),
  NULL,
  NULL,
  '2026-08-05'::date,
  'Licencia anual Jira y Confluence Cloud',
  'Software',
  'USD',
  850.00,
  3.75,
  3187.50,
  'Tarjeta_Credito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-012',
  'TAREA_PROYECTO',
  'TAR-043',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-043'),
  NULL,
  NULL,
  '2026-08-15'::date,
  'Suscripción anual Miro Business para flujos',
  'Software',
  'USD',
  192.00,
  3.75,
  720.00,
  'Tarjeta_Credito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-013',
  'TAREA_PROYECTO',
  'TAR-044',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-044'),
  NULL,
  NULL,
  '2026-09-02'::date,
  'Licencia mensual Power BI Pro analítica',
  'Software',
  'USD',
  20.00,
  3.75,
  75.00,
  'Tarjeta_Credito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-014',
  'TAREA_PROYECTO',
  'TAR-045',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-045'),
  NULL,
  NULL,
  '2026-08-25'::date,
  'Impresión y encuadernado de manuales de PMO',
  'Materiales',
  'PEN',
  260.00,
  1.00,
  260.00,
  'Tarjeta_Debito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-015',
  'TAREA_PROYECTO',
  'TAR-003',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-003'),
  NULL,
  NULL,
  '2026-08-10'::date,
  'Curso oficial preparatorio 35 PDUs examen PMP',
  'Servicios',
  'USD',
  199.00,
  3.75,
  746.25,
  'Tarjeta_Credito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-016',
  'TAREA_PROYECTO',
  'TAR-005',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-005'),
  NULL,
  NULL,
  '2026-09-01'::date,
  'Suscripción trimestral simulador PMI Study Hall',
  'Software',
  'USD',
  79.00,
  3.75,
  296.25,
  'Tarjeta_Credito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-017',
  'TAREA_PROYECTO',
  'TAR-005',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-005'),
  NULL,
  NULL,
  '2026-09-25'::date,
  'Membresía profesional anual Project Management Institute',
  'Software',
  'USD',
  139.00,
  3.75,
  521.25,
  'Tarjeta_Credito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-018',
  'TAREA_PROYECTO',
  'TAR-006',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-006'),
  NULL,
  'CUO-002',
  '2026-10-15'::date,
  'Derecho de examen de certificación internacional PMP',
  'Servicios',
  'USD',
  405.00,
  3.75,
  1518.75,
  'Tarjeta_Credito',
  'Pendiente',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-019',
  'ACTIVIDAD_PERSONAL',
  'ACT-001',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-001'),
  NULL,
  '2026-08-01'::date,
  'Membresía mensual entrenamiento y gimnasio',
  'Salud',
  'PEN',
  180.00,
  1.00,
  180.00,
  'Tarjeta_Debito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-020',
  'ACTIVIDAD_PERSONAL',
  'ACT-002',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-002'),
  NULL,
  '2026-08-25'::date,
  'Zapatillas running competición 10K placa carbono',
  'Materiales',
  'PEN',
  520.00,
  1.00,
  520.00,
  'Tarjeta_Credito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-021',
  'ACTIVIDAD_PERSONAL',
  'ACT-004',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-004'),
  NULL,
  '2026-09-08'::date,
  'Libros técnicos de arquitectura ágil y liderazgo',
  'Materiales',
  'PEN',
  145.00,
  1.00,
  145.00,
  'Tarjeta_Debito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-022',
  'ACTIVIDAD_PERSONAL',
  'ACT-006',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-006'),
  NULL,
  '2026-09-15'::date,
  'Comisión bancaria por transferencia internacional SWIFT',
  'Servicios',
  'USD',
  45.00,
  3.75,
  168.75,
  'Transferencia',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-023',
  'TAREA_PROYECTO',
  'TAR-053',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-053'),
  NULL,
  NULL,
  '2026-08-15'::date,
  'Consumo de API créditos Google Cloud Vision OCR',
  'Software',
  'USD',
  35.00,
  3.75,
  131.25,
  'Tarjeta_Credito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-024',
  'TAREA_PROYECTO',
  'TAR-054',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-054'),
  NULL,
  NULL,
  '2026-09-02'::date,
  'Suscripción mensual plataforma Make Core',
  'Software',
  'USD',
  29.00,
  3.75,
  108.75,
  'Tarjeta_Credito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-025',
  'TAREA_PROYECTO',
  'TAR-056',
  (SELECT id FROM tareas WHERE codigo_legado = 'TAR-056'),
  NULL,
  NULL,
  '2026-09-26'::date,
  'Servicio transaccional de correos SendGrid',
  'Software',
  'USD',
  19.95,
  3.75,
  74.81,
  'Tarjeta_Credito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-026',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  NULL,
  '2026-10-02'::date,
  'Compras supermercado insumos semanales',
  'Alimentacion',
  'PEN',
  342.50,
  1.00,
  342.50,
  'Tarjeta_Debito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-027',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  NULL,
  '2026-10-06'::date,
  'Recarga de saldo tarjeta transporte metropolitano',
  'Transporte',
  'PEN',
  50.00,
  1.00,
  50.00,
  'Efectivo',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();
INSERT INTO finanzas_gastos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  tarea_id, actividad_id, id_cuota_legado, fecha_gasto,
  descripcion_gasto, categoria_gasto, moneda_original, monto_original,
  tipo_cambio, monto_pen, metodo_pago, estado_pago, comprobante_url, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'GAS-028',
  'ACTIVIDAD_PERSONAL',
  'ACT-008',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-008'),
  NULL,
  '2026-10-08'::date,
  'Suplemento de magnesio y complejo multivitamínico',
  'Salud',
  'PEN',
  85.00,
  1.00,
  85.00,
  'Tarjeta_Debito',
  'Pagado',
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_gasto = EXCLUDED.descripcion_gasto,
  monto_pen = EXCLUDED.monto_pen,
  estado_pago = EXCLUDED.estado_pago,
  updated_at = now();

-- 7. INSERCIÓN DE INGRESOS FINANCIEROS (TESORERÍA Y PROYECTOS)
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-032',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-04-28'::date,
  'Remuneración mensual abril 2027 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-033',
  'PROYECTO',
  'PRO-001',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-001'),
  NULL,
  '2027-02-28'::date,
  'Comisión mercantil cierre primera operación corretaje',
  'Honorarios_Freelance',
  'USD',
  3500.00,
  3.75,
  13125.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-034',
  'PROYECTO',
  'PRO-002',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-002'),
  NULL,
  '2026-10-31'::date,
  'Liquidación final ventas lote portafiltros bottomless',
  'Ventas_Proyecto',
  'PEN',
  4850.00,
  1.00,
  4850.00,
  'Plin_Yape',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-035',
  'PROYECTO',
  'PRO-008',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-008'),
  NULL,
  '2026-12-15'::date,
  'Dividendos y rendimientos trimestrales ETFs globales',
  'Rendimientos_Inversion',
  'USD',
  185.00,
  3.75,
  693.75,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-036',
  'PROYECTO',
  'PRO-009',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-009'),
  NULL,
  '2027-01-15'::date,
  'Ventas directas catálogo tienda digital Shopify café',
  'Ventas_Proyecto',
  'PEN',
  3200.00,
  1.00,
  3200.00,
  'Pasarela_Pago',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-037',
  'PROYECTO',
  'PRO-009',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-009'),
  NULL,
  '2027-02-15'::date,
  'Suscripciones mensuales recurrentes café de origen',
  'Ventas_Proyecto',
  'PEN',
  2800.00,
  1.00,
  2800.00,
  'Pasarela_Pago',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-038',
  'PROYECTO',
  'PRO-004',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-004'),
  NULL,
  '2026-11-30'::date,
  'Honorarios consultoría finalización manual y adopción PMO',
  'Honorarios_Freelance',
  'PEN',
  4500.00,
  1.00,
  4500.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-039',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2026-11-05'::date,
  'Devolución de retenciones de cuarta categoría SUNAT',
  'Otros',
  'PEN',
  1420.00,
  1.00,
  1420.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-040',
  'ACTIVIDAD_PERSONAL',
  'ACT-006',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-006'),
  '2026-11-20'::date,
  'Rendimientos y rescate parcial fondos mutuos locales',
  'Rendimientos_Inversion',
  'PEN',
  950.00,
  1.00,
  950.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-041',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2026-12-20'::date,
  'Bono extraordinario por cumplimiento anual de OKRs',
  'Sueldo_Nomina',
  'PEN',
  6000.00,
  1.00,
  6000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-042',
  'PROYECTO',
  'PRO-001',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-001'),
  NULL,
  '2027-03-31'::date,
  'Comisión de intermediación segundo contrato exclusivo',
  'Honorarios_Freelance',
  'USD',
  2800.00,
  3.75,
  10500.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-043',
  'PROYECTO',
  'PRO-009',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-009'),
  NULL,
  '2027-03-25'::date,
  'Ventas corporativas lote mayorista café especialidad',
  'Ventas_Proyecto',
  'PEN',
  5600.00,
  1.00,
  5600.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-044',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-05-28'::date,
  'Remuneración mensual mayo 2027 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-045',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-06-28'::date,
  'Remuneración mensual junio 2027 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-046',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-07-15'::date,
  'Gratificación ordinaria Fiestas Patrias - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-047',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-07-28'::date,
  'Remuneración mensual julio 2027 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-048',
  'PROYECTO',
  'PRO-001',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-001'),
  NULL,
  '2027-04-30'::date,
  'Comisión corretaje cierre de alquiler corporativo exclusivo',
  'Honorarios_Freelance',
  'USD',
  1800.00,
  3.75,
  6750.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-049',
  'PROYECTO',
  'PRO-008',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-008'),
  NULL,
  '2027-03-15'::date,
  'Dividendos y rendimientos trimestrales ETFs globales',
  'Rendimientos_Inversion',
  'USD',
  210.00,
  3.75,
  787.50,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-050',
  'PROYECTO',
  'PRO-008',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-008'),
  NULL,
  '2027-06-15'::date,
  'Dividendos y rendimientos trimestrales ETFs globales',
  'Rendimientos_Inversion',
  'USD',
  235.00,
  3.75,
  881.25,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-051',
  'PROYECTO',
  'PRO-009',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-009'),
  NULL,
  '2027-04-15'::date,
  'Suscripciones mensuales recurrentes café de especialidad',
  'Ventas_Proyecto',
  'PEN',
  3100.00,
  1.00,
  3100.00,
  'Pasarela_Pago',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-052',
  'PROYECTO',
  'PRO-009',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-009'),
  NULL,
  '2027-05-15'::date,
  'Ventas directas canal e-commerce café y accesorios',
  'Ventas_Proyecto',
  'PEN',
  3650.00,
  1.00,
  3650.00,
  'Pasarela_Pago',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-053',
  'PROYECTO',
  'PRO-009',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-009'),
  NULL,
  '2027-06-20'::date,
  'Ventas corporativas coffee breaks y packs ejecutivos',
  'Ventas_Proyecto',
  'PEN',
  4200.00,
  1.00,
  4200.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-054',
  'PROYECTO',
  'PRO-003',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-003'),
  NULL,
  '2027-01-20'::date,
  'Honorarios asesoría especializada en arquitectura ágil',
  'Honorarios_Freelance',
  'USD',
  1500.00,
  3.75,
  5625.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-055',
  'PROYECTO',
  'PRO-003',
  (SELECT id FROM proyectos WHERE codigo_legado = 'PRO-003'),
  NULL,
  '2027-04-10'::date,
  'Auditoría post-implementación de gobernanza y KPIs',
  'Honorarios_Freelance',
  'USD',
  1200.00,
  3.75,
  4500.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-056',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-08-28'::date,
  'Remuneración mensual agosto 2027 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-057',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-09-28'::date,
  'Remuneración mensual setiembre 2027 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-058',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-10-28'::date,
  'Remuneración mensual octubre 2027 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-059',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-11-28'::date,
  'Remuneración mensual noviembre 2027 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-060',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-12-15'::date,
  'Gratificación ordinaria Navidad - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-061',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-12-28'::date,
  'Remuneración mensual diciembre 2027 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-062',
  'PROYECTO',
  'INV-M-I-17',
  NULL,
  NULL,
  '2027-05-15'::date,
  'Comisión corretaje venta exclusiva departamento Surco',
  'Honorarios_Freelance',
  'USD',
  3200.00,
  3.75,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-063',
  'PROYECTO',
  'INV-M-I-17',
  NULL,
  NULL,
  '2027-06-30'::date,
  'Comisión corretaje alquiler comercial San Isidro',
  'Honorarios_Freelance',
  'USD',
  1500.00,
  3.75,
  5625.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-064',
  'PROYECTO',
  'INV-M-I-15',
  NULL,
  NULL,
  '2027-04-20'::date,
  'Venta mayorista accesorios espresso lote complementario',
  'Negocio_Emprendimiento',
  'PEN',
  3800.00,
  1.00,
  3800.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-065',
  'PROYECTO',
  'INV-M-I-15',
  NULL,
  NULL,
  '2027-05-30'::date,
  'Ventas online liquidación final filtros y portafiltros',
  'Negocio_Emprendimiento',
  'PEN',
  2400.00,
  1.00,
  2400.00,
  'Plin_Yape',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-066',
  'PROYECTO',
  'INV-M-K-07',
  NULL,
  NULL,
  '2027-07-15'::date,
  'Suscripciones mensuales café especialidad julio 2027',
  'Negocio_Emprendimiento',
  'PEN',
  3900.00,
  1.00,
  3900.00,
  'Pasarela_Pago',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-067',
  'PROYECTO',
  'INV-M-K-07',
  NULL,
  NULL,
  '2027-08-15'::date,
  'Suscripciones mensuales café especialidad agosto 2027',
  'Negocio_Emprendimiento',
  'PEN',
  4100.00,
  1.00,
  4100.00,
  'Pasarela_Pago',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-068',
  'PROYECTO',
  'INV-M-K-07',
  NULL,
  NULL,
  '2027-09-20'::date,
  'Venta institucional café corporativo tercer trimestre',
  'Negocio_Emprendimiento',
  'PEN',
  5200.00,
  1.00,
  5200.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-069',
  'PROYECTO',
  'INV-H-I-06',
  NULL,
  NULL,
  '2027-09-15'::date,
  'Dividendos y rendimientos trimestrales ETFs globales',
  'Inversiones_Rendimientos',
  'USD',
  260.00,
  3.75,
  975.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-070',
  'PROYECTO',
  'INV-H-I-06',
  NULL,
  NULL,
  '2027-12-15'::date,
  'Dividendos y rendimientos trimestrales ETFs globales',
  'Inversiones_Rendimientos',
  'USD',
  290.00,
  3.75,
  1087.50,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-071',
  'ACTIVIDAD_PERSONAL',
  'ACT-006',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-006'),
  '2027-06-30'::date,
  'Rendimientos semestrales fondo mutuo liquidez soles',
  'Inversiones_Rendimientos',
  'PEN',
  1150.00,
  1.00,
  1150.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-072',
  'ACTIVIDAD_PERSONAL',
  'ACT-006',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-006'),
  '2027-12-20'::date,
  'Rendimientos semestrales fondo mutuo liquidez soles',
  'Inversiones_Rendimientos',
  'PEN',
  1280.00,
  1.00,
  1280.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-073',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-10-31'::date,
  'Venta de equipo tecnológico menor tras upgrade',
  'Ventas_Activos',
  'PEN',
  850.00,
  1.00,
  850.00,
  'Plin_Yape',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-074',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-12-24'::date,
  'Aguinaldo / Bono extraordinario cierre de año',
  'Obsequio_Monetario',
  'PEN',
  2000.00,
  1.00,
  2000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-075',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-01-28'::date,
  'Remuneración mensual enero 2028 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-076',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2027-02-28'::date,
  'Remuneración mensual febrero 2028 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-077',
  'PROYECTO',
  'INV-M-I-17',
  NULL,
  NULL,
  '2027-07-25'::date,
  'Comisión corretaje venta departamento Miraflores',
  'Honorarios_Freelance',
  'USD',
  3800.00,
  3.75,
  14250.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-078',
  'PROYECTO',
  'INV-M-I-17',
  NULL,
  NULL,
  '2027-08-30'::date,
  'Comisión corretaje cierre oficina empresarial Surco',
  'Honorarios_Freelance',
  'USD',
  2100.00,
  3.75,
  7875.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-079',
  'PROYECTO',
  'INV-M-K-07',
  NULL,
  NULL,
  '2027-10-15'::date,
  'Suscripciones mensuales café especialidad octubre 2027',
  'Negocio_Emprendimiento',
  'PEN',
  4300.00,
  1.00,
  4300.00,
  'Pasarela_Pago',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-080',
  'PROYECTO',
  'INV-M-K-07',
  NULL,
  NULL,
  '2027-11-15'::date,
  'Suscripciones mensuales café especialidad noviembre 2027',
  'Negocio_Emprendimiento',
  'PEN',
  4500.00,
  1.00,
  4500.00,
  'Pasarela_Pago',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-081',
  'PROYECTO',
  'INV-M-K-07',
  NULL,
  NULL,
  '2027-12-10'::date,
  'Campaña navideña packs corporativos café de origen',
  'Negocio_Emprendimiento',
  'PEN',
  6800.00,
  1.00,
  6800.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-082',
  'PROYECTO',
  'INV-H-I-06',
  NULL,
  NULL,
  '2028-03-15'::date,
  'Dividendos y rendimientos trimestrales ETFs globales',
  'Inversiones_Rendimientos',
  'USD',
  310.00,
  3.75,
  1162.50,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-083',
  'PROYECTO',
  'INV-H-I-06',
  NULL,
  NULL,
  '2028-06-15'::date,
  'Dividendos y rendimientos trimestrales ETFs globales',
  'Inversiones_Rendimientos',
  'USD',
  330.00,
  3.75,
  1237.50,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-084',
  'ACTIVIDAD_PERSONAL',
  'ACT-006',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-006'),
  '2028-06-30'::date,
  'Rendimientos semestrales fondo mutuo liquidez soles',
  'Inversiones_Rendimientos',
  'PEN',
  1350.00,
  1.00,
  1350.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-085',
  'ACTIVIDAD_PERSONAL',
  'ACT-006',
  NULL,
  (SELECT id FROM actividades_personales WHERE codigo_legado = 'ACT-006'),
  '2028-12-20'::date,
  'Rendimientos semestrales fondo mutuo liquidez soles',
  'Inversiones_Rendimientos',
  'PEN',
  1420.00,
  1.00,
  1420.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-086',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2028-04-15'::date,
  'Devolución de oficio IRPF cuarta y quinta categoría SUNAT',
  'Otros',
  'PEN',
  1650.00,
  1.00,
  1650.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-087',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2028-07-28'::date,
  'Gratificación Fiestas Patrias 2028 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();
INSERT INTO finanzas_ingresos (
  user_id, codigo_legado, tipo_origen, id_origen_vinculado_legado,
  proyecto_id, actividad_id, fecha_ingreso, descripcion_ingreso,
  categoria_ingreso, moneda_original, monto_original, tipo_cambio,
  monto_pen, metodo_cobro, estado_cobro, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ING-088',
  'LIBRE_CORRIENTE',
  'NINGUNO',
  NULL,
  NULL,
  '2028-12-15'::date,
  'Gratificación Navidad 2028 - PMO Lead',
  'Sueldo_Nomina',
  'PEN',
  12000.00,
  1.00,
  12000.00,
  'Transferencia_Bancaria',
  'Pendiente',
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  descripcion_ingreso = EXCLUDED.descripcion_ingreso,
  monto_pen = EXCLUDED.monto_pen,
  estado_cobro = EXCLUDED.estado_cobro,
  updated_at = now();

-- 8. INSERCIÓN DE NOTAS INTELIGENTES (CAMPOS JSONB)
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00001',
  'Principios de Gestión de Proyectos y Enfoque Ágil',
  '# Marco de Trabajo Ágil\n- Enfoque iterativo e incremental.\n- Gestión visual mediante tableros Kanban y sprints bisemanales.\n- Priorización orientada al valor del entregable.',
  '[{"texto":"Definir criterios de aceptación","completado":true,"id":"c1"},{"completado":false,"id":"c2","texto":"Mapear riesgos clave"}]'::jsonb,
  '{"estadoDeseo":"Pendiente","fechaConseguido":null,"nivelDeseo":"","costoEstimado":10,"enlaceReferencia":"","moneda":"PEN"}'::jsonb,
  'indigo',
  false,
  '[]'::jsonb,
  '[{"tipo":"PROYECTO","codigo":"PRO-001","titulo":"PRO-001"},{"tipo":"ACTIVIDAD","codigo":"ACT-002","titulo":"Sesión de carrera continua y series"},{"tipo":"TAREA","codigo":"TAR-017","titulo":"Ingresar solicitud de inspección técnica ante distribuidora"}]'::jsonb,
  '["proyectos","agile","gestion"]'::jsonb,
  '2026-10-12T08:00:00.000Z'::timestamptz,
  '2026-10-13T18:17:11.091Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00002',
  'Setup Estación de Trabajo y Ergonomía',
  '# Optimización del Espacio\n- Monitor a la altura de los ojos.\n- Soporte lumbar regulable.\n- Teclado mecánico con reposamuñecas.',
  '[{"id":"c1","texto":"Ajustar altura de escritorio","completado":true},{"completado":false,"texto":"Organizar cableado canalizado","id":"c2"}]'::jsonb,
  '{"enlaceReferencia":"","urlReferencia":"","nivelDeseo":"Alta","estadoDeseo":"Pendiente","moneda":"PEN","fechaConseguido":null,"costoEstimado":320}'::jsonb,
  '#95ac3e',
  false,
  '[]'::jsonb,
  '[]'::jsonb,
  '["ergonomia","workspace","compras"]'::jsonb,
  '2026-10-12T08:45:00.000Z'::timestamptz,
  '2026-10-13T00:20:41.750Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00003',
  'Rutina de Fuerza y Resistencia Semanal',
  '# Planificación Física\n- **Día 1**: Tren superior e hipertrofia.\n- **Día 2**: Movilidad activa y core.\n- **Día 3**: Tren inferior y fuerza explosiva.\n- **Fin de semana**: Carrera de fondo en zona 2 (45 min).',
  '[{"id":"c1","texto":"Calentamiento dinámico articular","completado":false},{"id":"c2","texto":"Registro de marcas y RPE","completado":false}]'::jsonb,
  '{}'::jsonb,
  'emerald',
  false,
  '[]'::jsonb,
  '[]'::jsonb,
  '["#salud","#fitness","#rutina"]'::jsonb,
  '2026-10-12T09:15:00.000Z'::timestamptz,
  '2026-10-12T09:15:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00005',
  'Renovación de Audio para Movilidad',
  '# Especificaciones Clave\n- Cancelación activa de ruido (ANC).\n- Batería mínima de 30 horas totales con estuche.\n- Conectividad multipunto Bluetooth 5.3.',
  '[]'::jsonb,
  '{"costoEstimado":450,"moneda":"PEN","nivelDeseo":"Media","urlReferencia":""}'::jsonb,
  'sky',
  false,
  '[]'::jsonb,
  '[]'::jsonb,
  '["#audio","#wishlist","#tecnologia"]'::jsonb,
  '2026-10-12T10:05:00.000Z'::timestamptz,
  '2026-10-12T10:05:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00006',
  'Revisión de Contratos y Suministros Básicos',
  '# Gestión de Suministros\n- Cotejar número de suministro y tarifa contratada.\n- Verificar historial de consumos y lecturas de medidor.\n- Programar pago mensual antes de la fecha límite para evitar recargos.',
  '[{"id":"c1","texto":"Verificar último recibo emitido","completado":true},{"id":"c2","texto":"Archivar comprobante de pago","completado":false}]'::jsonb,
  '{}'::jsonb,
  'teal',
  false,
  '[]'::jsonb,
  '[]'::jsonb,
  '["#suministros","#servicios","#administracion"]'::jsonb,
  '2026-10-12T10:15:00.000Z'::timestamptz,
  '2026-10-12T10:15:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00007',
  'Seguimiento de Trámites y Arbitrios Municipales',
  '# Documentación Municipal\n- Revisar calendario de vencimiento tributario anual.\n- Tramitar constancia de no adeudo y actualización de predio.\n- Conservar copias digitales de resoluciones y declaraciones juradas.',
  '[{"id":"c1","texto":"Descargar estado de cuenta predial","completado":false},{"id":"c2","texto":"Validar montos con tesorería municipal","completado":false}]'::jsonb,
  '{}'::jsonb,
  'cyan',
  false,
  '[]'::jsonb,
  '[{"tipo":"PROYECTO","codigo":"ADM-002"}]'::jsonb,
  '["#legal","#tributos","#tramites"]'::jsonb,
  '2026-10-12T10:20:00.000Z'::timestamptz,
  '2026-10-12T10:20:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00008',
  'Planificación de Viaje y Checklist de Equipaje',
  '# Logística de Salida\n- Check-in de vuelo con 24 horas de anticipación.\n- Revisar vigencia de documentos de identidad.\n- Equipaje de mano: cargadores, adaptadores, kit básico y muda de emergencia.',
  '[{"id":"c1","texto":"Realizar check-in online","completado":false},{"id":"c2","texto":"Verificar reserva de alojamiento","completado":true},{"id":"c3","texto":"Preparar botiquín personal","completado":false}]'::jsonb,
  '{}'::jsonb,
  'violet',
  false,
  '[]'::jsonb,
  '[]'::jsonb,
  '["#viajes","#logistica","#checklist"]'::jsonb,
  '2026-10-12T10:30:00.000Z'::timestamptz,
  '2026-10-13T18:17:14.162Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00009',
  'Ruta de Aprendizaje y Certificaciones Profesionales',
  '# Plan de Estudio Trimestral\n- Dedicar 45 minutos diarios de lectura técnica.\n- Resolver bancos de preguntas y simuladores cada fin de semana.\n- Sistematizar resúmenes de lecciones en mapas conceptuales.',
  '[{"id":"c1","texto":"Completar módulo 3 del curso","completado":false},{"id":"c2","texto":"Rendir simulacro de examen","completado":false}]'::jsonb,
  '{}'::jsonb,
  'purple',
  false,
  '[]'::jsonb,
  '[{"tipo":"PROYECTO","codigo":"EDU-001"}]'::jsonb,
  '["#educacion","#estudio","#certificaciones"]'::jsonb,
  '2026-10-12T10:50:00.000Z'::timestamptz,
  '2026-10-13T18:17:13.402Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00010',
  'Lista de Reposición y Despensa del Hogar',
  '# Abastecimiento Semanal\n- Comprar insumos secos al por mayor para optimizar costos.\n- Priorizar proteínas magras, verduras frescas y frutas de estación.\n- Verificar fechas de caducidad antes de almacenar.',
  '[{"id":"c1","texto":"Revisar inventario de refrigerador","completado":true},{"id":"c2","texto":"Actualizar lista de mercado","completado":true}]'::jsonb,
  '{"costoEstimado":180,"moneda":"PEN","nivelDeseo":"Alta","urlReferencia":""}'::jsonb,
  'lime',
  false,
  '[]'::jsonb,
  '[]'::jsonb,
  '["#compras","#hogar","#despensa"]'::jsonb,
  '2026-10-12T11:05:00.000Z'::timestamptz,
  '2026-10-12T11:10:00.000Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00011',
  'Programa',
  '',
  '[{"completado":false,"id":"chk_1791904454341_228","texto":"MS Project"},{"texto":"Power Automate","completado":false,"id":"chk_1791904630380_994"},{"id":"chk_1791904864582_356","texto":"SQL","completado":false},{"id":"chk_1791904868820_455","texto":"POWER BI","completado":false},{"completado":false,"id":"chk_1791905223761_968","texto":"Python"}]'::jsonb,
  '{}'::jsonb,
  'default',
  true,
  '[]'::jsonb,
  '[]'::jsonb,
  '["educacion","estudio"]'::jsonb,
  '2026-10-13T15:13:44.867Z'::timestamptz,
  '2026-10-14T16:53:52.400Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00012',
  'MEJORAR',
  '',
  '[{"texto":"Perfil de LINKEDIN","completado":false,"id":"chk_1791905243102"},{"texto":"CV","id":"chk_1791905247293","completado":false}]'::jsonb,
  '{}'::jsonb,
  'default',
  true,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-13T15:27:25.882Z'::timestamptz,
  '2026-10-14T16:53:49.408Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00013',
  'Fallas Vista 360',
  '#certificados',
  '[{"completado":false,"id":"chk_1791915397413","texto":"La columna Healft estatus genera el status \"🟢 Saludable\" con el icono de mas."},{"completado":false,"texto":"Agregar la opcion de completar con IA una vez creado el proyecto.","id":"chk_1791915521632_817"}]'::jsonb,
  '{}'::jsonb,
  'default',
  true,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-13T18:16:39.346Z'::timestamptz,
  '2026-10-15T07:38:34.179Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00014',
  'COMO APRENDER',
  'Averiguar t odo lo que se pueda de NOTEBKLM',
  '[]'::jsonb,
  '{}'::jsonb,
  'default',
  true,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-14T16:59:17.324Z'::timestamptz,
  '2026-10-14T16:59:26.472Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00015',
  'Fallas Notas',
  '',
  '[{"texto":"Cuando se crea una nota, y se fija, este se cancela y debes hacerlo por 2da vez","completado":false,"id":"chk_1791997257433_55"},{"texto":"Hablar sobre una vista donde se pueda gestionar todas las notas que se puedan ovnertir en actvidiades, tarea,s proyectos.","id":"chk_1792009907817_632","completado":false},{"id":"chk_1792009922046_993","texto":"hacerlo en una vista amplia y general","completado":false},{"texto":"Mejorar la tabla detallada de las notas y la vista general de notas.","completado":false,"id":"chk_1792010021646_30"}]'::jsonb,
  '{}'::jsonb,
  'default',
  true,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-14T17:00:06.960Z'::timestamptz,
  '2026-10-14T20:33:45.376Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00016',
  'Fallas Kanban',
  '',
  '[{"id":"chk_1791999125348","texto":"Mejorar la linea de ruta de la tarea, Proyecto - Fase - Paquete, reducirlo de manera estrategiaca","completado":false}]'::jsonb,
  '{}'::jsonb,
  'default',
  true,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-14T17:32:20.474Z'::timestamptz,
  '2026-10-14T17:32:29.492Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00017',
  'Fallas habitos',
  '',
  '[{"completado":false,"id":"chk_1792001690855","texto":"Poder ver las metas o planes de los habitos, es decir un historico o un seguimiento atravez del tiempo de estas actvidiades."}]'::jsonb,
  '{}'::jsonb,
  'default',
  true,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-14T18:14:55.774Z'::timestamptz,
  '2026-10-14T18:23:52.493Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00018',
  'Revisar Calendar',
  '',
  '[{"id":"chk_1792002131189","completado":false,"texto":"Agregar todas las actividades de habtios y proyectos"}]'::jsonb,
  '{}'::jsonb,
  'default',
  true,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-14T18:22:18.673Z'::timestamptz,
  '2026-10-14T18:23:51.009Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00019',
  'Fallas General',
  '',
  '[{"id":"chk_1792002285710_862","texto":"Integrar reportes de avances de Proyectos, Habitos, de Finanzas y uno integral total sobre mi persona.","completado":false},{"id":"chk_1792011575639_506","texto":"VALIDAR QUE EL  CTRL SEA UN CANCELAR GENERAL SIEMPRE.","completado":false}]'::jsonb,
  '{}'::jsonb,
  'default',
  true,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-14T18:24:50.089Z'::timestamptz,
  '2026-10-14T20:59:39.418Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00020',
  'Teclado de Tablet',
  'Wilson',
  '[]'::jsonb,
  '{"nivelDeseo":"Media","estadoDeseo":"Pendiente","fechaConseguido":null,"costoEstimado":0,"moneda":"PEN","montoRealGastado":0,"idGastoVinculado":null,"enlaceReferencia":"https://simple.ripley.com.pe/teclado-magnetico-con-touch-galaxy-tab-s9-fe-plus-x610-pmp20000754168?srsltid=AU7gw4VKb2mzMPQiI10C3jCwai1YIK6wHtpUOZLxu7MkQaPGQtX7WM3O&color_80=Negro","urlReferencia":"https://simple.ripley.com.pe/teclado-magnetico-con-touch-galaxy-tab-s9-fe-plus-x610-pmp20000754168?srsltid=AU7gw4VKb2mzMPQiI10C3jCwai1YIK6wHtpUOZLxu7MkQaPGQtX7WM3O&color_80=Negro"}'::jsonb,
  'default',
  false,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-14T18:42:11.359Z'::timestamptz,
  '2026-10-14T18:58:51.968Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00021',
  'Averiguar clases de Ingles',
  '',
  '[{"id":"chk_1792009703956","texto":"Validar si un curso, ia o app apra aprender ingles","completado":false}]'::jsonb,
  '{}'::jsonb,
  'default',
  true,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-14T20:28:28.973Z'::timestamptz,
  '2026-10-14T20:31:14.623Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00022',
  'Revisar lo de carreras.',
  '',
  '[{"id":"chk_1792016552947_499","completado":false,"texto":"ver todas las fechas que hay carreras, marathones y eventos gratis y de paags que avlen la pena"}]'::jsonb,
  '{}'::jsonb,
  'default',
  true,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-14T20:31:12.069Z'::timestamptz,
  '2026-10-14T22:22:36.743Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00023',
  'Comprar Baterias/Pilas recargables',
  '',
  '[]'::jsonb,
  '{"idGastoVinculado":null,"enlaceReferencia":"","moneda":"PEN","costoEstimado":0,"fechaConseguido":null,"montoRealGastado":0,"estadoDeseo":"Pendiente","nivelDeseo":"Media"}'::jsonb,
  'default',
  false,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-14T20:58:36.177Z'::timestamptz,
  '2026-10-14T20:58:36.177Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();
INSERT INTO notas (
  user_id, codigo_legado, titulo, contenido_markdown, checklists_json,
  wishlist_json, color_tema, es_fijada, adjuntos_drive_json,
  enlaces_entidades_json, etiquetas, fecha_creacion, fecha_actualizacion, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NOT-00024',
  'VALENTINA',
  '',
  '[{"texto":"Pedir flyer de mapamundi","id":"chk_1792011947867","completado":false}]'::jsonb,
  '{}'::jsonb,
  'default',
  false,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '2026-10-14T21:06:02.834Z'::timestamptz,
  '2026-10-14T21:06:02.834Z'::timestamptz,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  contenido_markdown = EXCLUDED.contenido_markdown,
  checklists_json = EXCLUDED.checklists_json,
  wishlist_json = EXCLUDED.wishlist_json,
  enlaces_entidades_json = EXCLUDED.enlaces_entidades_json,
  etiquetas = EXCLUDED.etiquetas,
  updated_at = now();

-- 9. INSERCIÓN DE DECISIONES TRADE-OFF (MATRICES MULTICRITERIO PMO)

-- 10. INSERCIÓN DE IDEAS RÁPIDAS Y TRIAJE MULTIMODAL
INSERT INTO ideas (
  user_id, codigo_legado, enunciado_idea, detalle_contexto, tipo_captura,
  url_adjunto_drive, transcripcion_texto, clarificacion_ia, estado,
  entidad_convertida, id_entidad_destino_legado, fecha_captura,
  fecha_procesada, fecha_archivado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'IDE-20261015-009',
  'Verificar como hacer para jugar juegos de PS4 Y 5 EN LA PC.',
  '',
  'TEXTO',
  NULL,
  NULL,
  '{}'::jsonb,
  'Inbox',
  NULL,
  NULL,
  '2026-10-15T22:19:22.592Z'::timestamptz,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  enunciado_idea = EXCLUDED.enunciado_idea,
  estado = EXCLUDED.estado,
  clarificacion_ia = EXCLUDED.clarificacion_ia,
  updated_at = now();
INSERT INTO ideas (
  user_id, codigo_legado, enunciado_idea, detalle_contexto, tipo_captura,
  url_adjunto_drive, transcripcion_texto, clarificacion_ia, estado,
  entidad_convertida, id_entidad_destino_legado, fecha_captura,
  fecha_procesada, fecha_archivado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'IDE-20261015-008',
  'pr ueb a 2 #falla',
  '#falla',
  'TEXTO',
  NULL,
  NULL,
  '{}'::jsonb,
  'Inbox',
  NULL,
  NULL,
  '2026-10-15T08:00:50.824Z'::timestamptz,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  enunciado_idea = EXCLUDED.enunciado_idea,
  estado = EXCLUDED.estado,
  clarificacion_ia = EXCLUDED.clarificacion_ia,
  updated_at = now();
INSERT INTO ideas (
  user_id, codigo_legado, enunciado_idea, detalle_contexto, tipo_captura,
  url_adjunto_drive, transcripcion_texto, clarificacion_ia, estado,
  entidad_convertida, id_entidad_destino_legado, fecha_captura,
  fecha_procesada, fecha_archivado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'IDE-20261015-007',
  '#falla prueba',
  '#falla',
  'TEXTO',
  NULL,
  NULL,
  '{}'::jsonb,
  'Inbox',
  NULL,
  NULL,
  '2026-10-15T08:00:36.375Z'::timestamptz,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  enunciado_idea = EXCLUDED.enunciado_idea,
  estado = EXCLUDED.estado,
  clarificacion_ia = EXCLUDED.clarificacion_ia,
  updated_at = now();
INSERT INTO ideas (
  user_id, codigo_legado, enunciado_idea, detalle_contexto, tipo_captura,
  url_adjunto_drive, transcripcion_texto, clarificacion_ia, estado,
  entidad_convertida, id_entidad_destino_legado, fecha_captura,
  fecha_procesada, fecha_archivado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'IDE-20261015-006',
  'Prueba #falla',
  '#falla',
  'TEXTO',
  NULL,
  NULL,
  '{}'::jsonb,
  'Incubacion',
  NULL,
  NULL,
  '2026-10-15T07:42:30.022Z'::timestamptz,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  enunciado_idea = EXCLUDED.enunciado_idea,
  estado = EXCLUDED.estado,
  clarificacion_ia = EXCLUDED.clarificacion_ia,
  updated_at = now();
INSERT INTO ideas (
  user_id, codigo_legado, enunciado_idea, detalle_contexto, tipo_captura,
  url_adjunto_drive, transcripcion_texto, clarificacion_ia, estado,
  entidad_convertida, id_entidad_destino_legado, fecha_captura,
  fecha_procesada, fecha_archivado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'IDE-20261015-005',
  'Mejorar el portal por horarios',
  '',
  'TEXTO',
  NULL,
  NULL,
  '{}'::jsonb,
  'Incubacion',
  NULL,
  NULL,
  '2026-10-15T07:40:23.391Z'::timestamptz,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  enunciado_idea = EXCLUDED.enunciado_idea,
  estado = EXCLUDED.estado,
  clarificacion_ia = EXCLUDED.clarificacion_ia,
  updated_at = now();
INSERT INTO ideas (
  user_id, codigo_legado, enunciado_idea, detalle_contexto, tipo_captura,
  url_adjunto_drive, transcripcion_texto, clarificacion_ia, estado,
  entidad_convertida, id_entidad_destino_legado, fecha_captura,
  fecha_procesada, fecha_archivado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'IDE-20261015-004',
  'Ejemplo 1',
  '',
  'TEXTO',
  NULL,
  NULL,
  '{}'::jsonb,
  'Inbox',
  NULL,
  NULL,
  '2026-10-15T07:28:50.381Z'::timestamptz,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  enunciado_idea = EXCLUDED.enunciado_idea,
  estado = EXCLUDED.estado,
  clarificacion_ia = EXCLUDED.clarificacion_ia,
  updated_at = now();
INSERT INTO ideas (
  user_id, codigo_legado, enunciado_idea, detalle_contexto, tipo_captura,
  url_adjunto_drive, transcripcion_texto, clarificacion_ia, estado,
  entidad_convertida, id_entidad_destino_legado, fecha_captura,
  fecha_procesada, fecha_archivado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'IDE-20261015-003',
  'aea',
  '',
  'FOTO',
  'https://drive.google.com/file/d/1YqEhvuNN4Pue36ymmBLzauLIfgoYmkTX/view?usp=drivesdk',
  NULL,
  '{}'::jsonb,
  'Inbox',
  NULL,
  NULL,
  '2026-10-15T07:28:42.905Z'::timestamptz,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  enunciado_idea = EXCLUDED.enunciado_idea,
  estado = EXCLUDED.estado,
  clarificacion_ia = EXCLUDED.clarificacion_ia,
  updated_at = now();
INSERT INTO ideas (
  user_id, codigo_legado, enunciado_idea, detalle_contexto, tipo_captura,
  url_adjunto_drive, transcripcion_texto, clarificacion_ia, estado,
  entidad_convertida, id_entidad_destino_legado, fecha_captura,
  fecha_procesada, fecha_archivado, sync_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'IDE-20261015-002',
  'Sacar Visa de EEUU',
  '',
  'TEXTO',
  NULL,
  NULL,
  '{}'::jsonb,
  'Inbox',
  NULL,
  NULL,
  '2026-10-15T07:01:05.773Z'::timestamptz,
  NULL,
  NULL,
  'synced'
)
ON CONFLICT (codigo_legado) DO UPDATE SET
  enunciado_idea = EXCLUDED.enunciado_idea,
  estado = EXCLUDED.estado,
  clarificacion_ia = EXCLUDED.clarificacion_ia,
  updated_at = now();

-- 11. AJUSTE DE SECUENCIAS CORRELATIVAS AL MÁXIMO VALOR CARGADO
SELECT setval('seq_codigo_proyectos', COALESCE((SELECT MAX(SUBSTRING(codigo_legado FROM 5)::bigint) FROM proyectos WHERE codigo_legado ~ '^PRO-[0-9]+$'), 1));
SELECT setval('seq_codigo_wp', COALESCE((SELECT MAX(SUBSTRING(codigo_legado FROM 4)::bigint) FROM hitos_wbs WHERE codigo_legado ~ '^WP-[0-9]+$'), 1));
SELECT setval('seq_codigo_hit', COALESCE((SELECT MAX(SUBSTRING(codigo_legado FROM 5)::bigint) FROM hitos_wbs WHERE codigo_legado ~ '^HIT-[0-9]+$'), 1));
SELECT setval('seq_codigo_tareas', COALESCE((SELECT MAX(SUBSTRING(codigo_legado FROM 5)::bigint) FROM tareas WHERE codigo_legado ~ '^TAR-[0-9]+$'), 1));
SELECT setval('seq_codigo_actividades', COALESCE((SELECT MAX(SUBSTRING(codigo_legado FROM 5)::bigint) FROM actividades_personales WHERE codigo_legado ~ '^ACT-[0-9]+$'), 1));
SELECT setval('seq_codigo_subtareas', COALESCE((SELECT MAX(SUBSTRING(codigo_legado FROM 5)::bigint) FROM subtareas_pasos WHERE codigo_legado ~ '^SUB-[0-9]+$'), 1));
SELECT setval('seq_codigo_gastos', COALESCE((SELECT MAX(SUBSTRING(codigo_legado FROM 5)::bigint) FROM finanzas_gastos WHERE codigo_legado ~ '^GAS-[0-9]+$'), 1));
SELECT setval('seq_codigo_ingresos', COALESCE((SELECT MAX(SUBSTRING(codigo_legado FROM 5)::bigint) FROM finanzas_ingresos WHERE codigo_legado ~ '^ING-[0-9]+$'), 1));
SELECT setval('seq_codigo_notas', COALESCE((SELECT MAX(SUBSTRING(codigo_legado FROM 5)::bigint) FROM notas WHERE codigo_legado ~ '^NOT-[0-9]+$'), 1));
SELECT setval('seq_codigo_decisiones', COALESCE((SELECT MAX(SUBSTRING(codigo_legado FROM 5)::bigint) FROM decisiones_tradeoff WHERE codigo_legado ~ '^DEC-[0-9]+$'), 1));

COMMIT;