/**
 * ============================================================================
 * ARCHIVO: src/services/syncPayloadSanitizer.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-02 (Sanitizador Puro de Payloads PostgreSQL / Supabase)
 * DESCRIPCIÓN: Mapeadores y sanitizadores de datos puros y desacoplados de red.
 *              Garantiza compatibilidad estricta con restricciones NOT NULL,
 *              tipos DATE, checks de enums, claves foráneas UUID y omisión de
 *              campos virtuales o locales no persistidos en Supabase.
 * ============================================================================
 */

import type {
  ProyectoRecord,
  HitoWbsRecord,
  TareaRecord,
  NotaRecord,
  ActividadPersonal,
  SubtareaPaso
} from '../types';

export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export function isUuid(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

export function sanitizeDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (trimmed === '') return null;
  const clean = trimmed.split('T')[0].split(' ')[0];
  // Validar formato YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : null;
}

export function sanitizeTimestamp(tsStr?: string | null): string | null {
  if (!tsStr || typeof tsStr !== 'string') return null;
  const trimmed = tsStr.trim();
  if (trimmed === '') return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Normaliza fase WBS al conjunto canónico de PostgreSQL:
 * ('Iniciacion', 'Planificacion', 'Ejecucion', 'Control', 'Cierre')
 */
export function normalizarFaseAsociada(faseRaw?: string | null): 'Iniciacion' | 'Planificacion' | 'Ejecucion' | 'Control' | 'Cierre' {
  const f = String(faseRaw || '').toUpperCase();
  if (f.includes('INICIACION') || f.includes('INICIO')) return 'Iniciacion';
  if (f.includes('PLANIFICACION') || f.includes('PLAN')) return 'Planificacion';
  if (f.includes('EJECUCION')) return 'Ejecucion';
  if (f.includes('CONTROL')) return 'Control';
  if (f.includes('CIERRE')) return 'Cierre';
  return 'Planificacion';
}

/**
 * Normaliza tipo de iniciativa del proyecto:
 * ('Profesional', 'Inversiones', 'Personal')
 */
export function normalizarTipoIniciativa(tipoRaw?: string | null): 'Profesional' | 'Inversiones' | 'Personal' {
  const t = String(tipoRaw || '').trim().toLowerCase();
  if (t.includes('profesional')) return 'Profesional';
  if (t.includes('inversion')) return 'Inversiones';
  return 'Personal';
}

/**
 * Normaliza estado del proyecto:
 * ('01_Backlog', '02_Planificado', '03_En_Ejecucion', '04_En_Pausa', '05_Cancelado', '06_Cerrado')
 */
export function normalizarEstadoProyecto(estadoRaw?: string | null): string {
  const st = String(estadoRaw || '').trim();
  if (st === '04_Cerrado' || st === '05_Archivado' || st === '06_Cerrado' || st.includes('Cerrado')) {
    return '06_Cerrado';
  }
  if (st === '04_En_Pausa' || st.includes('Pausa')) return '04_En_Pausa';
  if (st === '05_Cancelado' || st.includes('Cancelado')) return '05_Cancelado';
  if (st === '03_En_Ejecucion' || st.includes('Ejecucion')) return '03_En_Ejecucion';
  if (st === '02_Planificado' || st.includes('Plan')) return '02_Planificado';
  return '01_Backlog';
}

/**
 * Normaliza magnitud de complejidad:
 * ('Light', 'Medium', 'Heavy')
 */
export function normalizarMagnitud(magRaw?: string | null): 'Light' | 'Medium' | 'Heavy' {
  const m = String(magRaw || '').toUpperCase();
  if (m.includes('LIGHT') || m.includes('S-LIGHT')) return 'Light';
  if (m.includes('HEAVY') || m.includes('L-HEAVY')) return 'Heavy';
  return 'Medium';
}

/**
 * Normaliza arquetipo de proyecto:
 * ('1_Infraestructura', '2_Venture', '3_Activo', '4_Carrera', '5_Evento')
 */
export function normalizarArquetipo(arqRaw?: string | null): string {
  const a = String(arqRaw || '').trim();
  if (a.includes('2_') || a.toLowerCase().includes('venture')) return '2_Venture';
  if (a.includes('3_') || a.toLowerCase().includes('activo')) return '3_Activo';
  if (a.includes('4_') || a.toLowerCase().includes('carrera')) return '4_Carrera';
  if (a.includes('5_') || a.toLowerCase().includes('evento')) return '5_Evento';
  return '1_Infraestructura';
}

/**
 * Normaliza estado de tarea:
 * ('01_Backlog', '02_Por_Hacer', '03_En_Proceso', '04_Completado', '05_Archivado')
 */
export function normalizarEstadoTarea(estadoRaw?: string | null): string {
  const st = String(estadoRaw || '').trim();
  if (st === '03_En_Curso') return '03_En_Proceso';
  if (['01_Backlog', '02_Por_Hacer', '03_En_Proceso', '04_Completado', '05_Archivado'].includes(st)) {
    return st;
  }
  if (st.includes('Completado')) return '04_Completado';
  if (st.includes('Proceso') || st.includes('Curso')) return '03_En_Proceso';
  if (st.includes('Hacer')) return '02_Por_Hacer';
  return '01_Backlog';
}

// ============================================================================
// 1. SANITIZADOR DE PROYECTOS
// ============================================================================

export function sanitizarProyectoPayload(raw: ProyectoRecord, userId: string = DEFAULT_USER_ID) {
  const rawAvance = Number(raw.avance_real_pct ?? 0);
  const avance_real_pct = rawAvance > 0 && rawAvance <= 1.0 ? Math.round(rawAvance * 100) : Math.round(rawAvance);
  const clampedAvance = Math.min(Math.max(avance_real_pct, 0), 100);

  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: isUuid(raw.user_id) ? raw.user_id : userId,
    codigo_legado: raw.codigo_legado,
    nombre_proyecto: raw.nombre_proyecto || 'Proyecto sin nombre',
    tipo_iniciativa: normalizarTipoIniciativa(raw.tipo_iniciativa),
    magnitud_complejidad: normalizarMagnitud(raw.magnitud_complejidad || raw.categoria_tshirt),
    arquetipo_proyecto: normalizarArquetipo(raw.arquetipo_proyecto),
    estado_proyecto: normalizarEstadoProyecto(raw.estado_proyecto),
    health_status: raw.health_status
      ? String(raw.health_status).replace(/[\u{1F300}-\u{1F9FF}|🔴|🟢|🟡]/gu, '').trim() || 'Saludable'
      : 'Saludable',
    avance_real_pct: clampedAvance,
    entregable_tangible_objeto: raw.entregable_tangible_objeto?.trim() || null,
    north_star_okr: raw.north_star_okr?.trim() || null,
    criterios_aceptacion_dod: raw.criterios_aceptacion_dod?.trim() || null,
    ultima_revision: sanitizeDate(raw.ultima_revision),
    fecha_inicio_plan: sanitizeDate(raw.fecha_inicio_plan),
    fecha_fin_plan: sanitizeDate(raw.fecha_fin_plan),
    moneda_base: raw.moneda_base === 'USD' ? 'USD' : 'PEN',
    presupuesto_tope: Math.max(0, Number(raw.presupuesto_tope) || 0),
    costo_ejecutado_real_pen: Math.max(0, Number(raw.costo_ejecutado_real_pen) || 0),
    costo_ejecutado_real_usd: Math.max(0, Number(raw.costo_ejecutado_real_usd) || 0),
    terceros_involucrados: raw.terceros_involucrados?.trim() || null,
    alcance_detallado_url_drive: raw.alcance_detallado_url_drive?.trim() || null,
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

// ============================================================================
// 2. SANITIZADOR DE HITOS WBS
// ============================================================================

export function sanitizarHitoPayload(
  raw: HitoWbsRecord,
  proyectoUuidMap: Map<string, string>,
  userId: string = DEFAULT_USER_ID
) {
  // Resolución de FK proyecto_id
  let resolvedProyectoUuid: string | null = null;
  if (raw.proyecto_id) {
    if (proyectoUuidMap.has(raw.proyecto_id)) {
      resolvedProyectoUuid = proyectoUuidMap.get(raw.proyecto_id)!;
    } else if (isUuid(raw.proyecto_id)) {
      resolvedProyectoUuid = raw.proyecto_id;
    }
  }

  const rawPeso = Number(raw.peso_pct ?? 0);
  const peso_ponderado_pct = rawPeso > 0 && rawPeso <= 1.0 ? Number((rawPeso * 100).toFixed(2)) : Number(rawPeso.toFixed(2));
  const clampedPeso = Math.min(Math.max(peso_ponderado_pct, 0), 100);

  const esMarcador = raw.tipo_elemento_wbs === 'HITO_MARCADOR';
  const presupuesto_asignado = esMarcador ? 0.00 : Math.max(0, Number(raw.presupuesto_asignado) || 0);

  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: isUuid(raw.user_id) ? raw.user_id : userId,
    codigo_legado: raw.codigo_legado,
    proyecto_id: resolvedProyectoUuid,
    tipo_elemento_wbs: esMarcador ? 'HITO_MARCADOR' : 'PAQUETE_TRABAJO',
    wbs_code: raw.wbs_code || '1.1',
    fase_asociada: normalizarFaseAsociada(raw.fase_asociada),
    nombre_elemento: raw.nombre_elemento || 'Elemento sin nombre',
    estado: raw.estado || '01_Pendiente',
    peso_ponderado_pct: clampedPeso,
    fecha_limite_plan: sanitizeDate(raw.fecha_limite),
    fecha_real_fin: sanitizeDate(raw.fecha_real_fin),
    presupuesto_asignado,
    criterio_aceptacion_dod: raw.criterio_dod?.trim() || null,
    dependencia_hito_id: isUuid(raw.dependencia_hito_id) ? raw.dependencia_hito_id : null,
    entregable_verificable_link: raw.entregable_link?.trim() || null,
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

// ============================================================================
// 3. SANITIZADOR DE TAREAS WBS
// ============================================================================

export function sanitizarTareaPayload(
  raw: TareaRecord,
  proyectoUuidMap: Map<string, string>,
  hitoUuidMap: Map<string, string>,
  userId: string = DEFAULT_USER_ID
) {
  let resolvedProyectoUuid: string | null = null;
  if (raw.proyecto_codigo) {
    if (proyectoUuidMap.has(raw.proyecto_codigo)) {
      resolvedProyectoUuid = proyectoUuidMap.get(raw.proyecto_codigo)!;
    } else if (isUuid(raw.proyecto_codigo)) {
      resolvedProyectoUuid = raw.proyecto_codigo;
    }
  }

  let resolvedHitoUuid: string | null = null;
  if (raw.hito_codigo) {
    if (hitoUuidMap.has(raw.hito_codigo)) {
      resolvedHitoUuid = hitoUuidMap.get(raw.hito_codigo)!;
    } else if (isUuid(raw.hito_codigo)) {
      resolvedHitoUuid = raw.hito_codigo;
    }
  }

  const prioridadNorm = ['01_P1_Alta', '02_P2_Media', '03_P3_Baja', '04_P4_Delegable'].includes(raw.prioridad_eisenhower || '')
    ? raw.prioridad_eisenhower!
    : '02_P2_Media';

  const energiaNorm = ['Alta_Cognitiva_DeepWork', 'Media_Operativa', 'Baja_Administrativa'].includes(raw.nivel_energia_requerido || '')
    ? raw.nivel_energia_requerido!
    : 'Media_Operativa';

  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: isUuid(raw.user_id) ? raw.user_id : userId,
    codigo_legado: raw.codigo_legado,
    proyecto_id: resolvedProyectoUuid,
    hito_id: resolvedHitoUuid,
    nombre_tarea_actividad: raw.nombre_tarea_actividad || 'Tarea sin nombre',
    estado_tarea: normalizarEstadoTarea(raw.estado_tarea),
    prioridad_eisenhower: prioridadNorm,
    nivel_energia_requerido: energiaNorm,
    horas_estimadas: Math.max(0, Number(raw.horas_estimadas) || 1.00),
    horas_reales: Math.max(0, Number(raw.horas_reales) || 0.00),
    fecha_programada: sanitizeDate(raw.fecha_programada),
    agendado_en_calendar: raw.agendado_calendar === 'Sí' ? 'Sí' : 'No',
    dependencia_tarea_id: isUuid(raw.id_dependencia) ? raw.id_dependencia : null,
    responsable_ejecutor: raw.responsable_ejecutor?.trim() || 'Christopher',
    notas_impedimentos: raw.notas_impedimentos?.trim() || null,
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

// ============================================================================
// 4. SANITIZADOR DE NOTAS
// ============================================================================

export function sanitizarNotaPayload(raw: NotaRecord, userId: string = DEFAULT_USER_ID) {
  const checklists = Array.isArray(raw.checklists_json) ? raw.checklists_json : [];
  const wishlist = raw.wishlist_json && typeof raw.wishlist_json === 'object' ? raw.wishlist_json : {};
  const adjuntos = Array.isArray(raw.adjuntos_drive_json) ? raw.adjuntos_drive_json : [];
  const enlaces = Array.isArray(raw.enlaces_entidades_json) ? raw.enlaces_entidades_json : [];
  const etiquetas = Array.isArray(raw.etiquetas) ? raw.etiquetas : [];

  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: isUuid(raw.user_id) ? raw.user_id : userId,
    codigo_legado: raw.codigo_legado,
    titulo: raw.titulo?.trim() || 'Sin Título',
    contenido_markdown: raw.contenido_markdown ?? '',
    checklists_json: checklists,
    wishlist_json: wishlist,
    color_tema: raw.color_tema || 'default',
    es_fijada: Boolean(raw.es_fijada),
    adjuntos_drive_json: adjuntos,
    enlaces_entidades_json: enlaces,
    etiquetas: etiquetas,
    fecha_creacion: sanitizeTimestamp(raw.created_at) || new Date().toISOString(),
    fecha_actualizacion: sanitizeTimestamp(raw.updated_at) || new Date().toISOString(),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

// ============================================================================
// 5. SANITIZADOR DE ACTIVIDADES PERSONALES (HÁBITOS)
// ============================================================================

export function sanitizarActividadPayload(raw: ActividadPersonal, userId: string = DEFAULT_USER_ID) {
  const tipoRegistroNormalizado = (item: any): 'HABITUAL' | 'PUNTUAL' | 'META' => {
    const t = String(item.tipo_registro || item.tipo_compromiso || item.Tipo_Registro || '').toUpperCase();
    if (t.includes('META') || t.includes('CHECKLIST')) return 'META';
    if (t.includes('PUNTUAL')) return 'PUNTUAL';
    return 'HABITUAL';
  };

  const estadoNormalizado = (st?: string): string => {
    if (st === '03_En_Curso') return '03_En_Proceso';
    return st || '02_Por_Hacer';
  };

  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: isUuid(raw.user_id) ? raw.user_id : userId,
    codigo_legado: raw.codigo_legado,
    nombre: raw.nombre_actividad || (raw as any).nombre || 'Actividad sin nombre',
    tipo_registro: tipoRegistroNormalizado(raw),
    categoria_vida: raw.categoria_vida,
    meta_macro_nombre: raw.meta_macro_nombre?.trim() || null,
    unidad_medida: raw.unidad_medida?.trim() || null,
    meta_objetivo_total: Math.max(0, Number(raw.meta_objetivo_total) || 0),
    valor_acumulado_actual: Math.max(0, Number(raw.valor_acumulado_actual) || 0),
    meta_diaria_estandar: Math.max(0, Number(raw.meta_diaria_estandar) || 0),
    nivel_rescate_minimo: Math.max(0, Number(raw.nivel_rescate_minimo) || 0),
    estado: estadoNormalizado(raw.estado),
    racha_actual: Math.max(0, Number(raw.racha_actual) || 0),
    fecha_programada: sanitizeDate(raw.fecha_programada),
    hora_inicio: raw.hora_inicio?.trim() || '08:00',
    duracion_horas: Math.max(0, Number(raw.duracion_horas) || 1.00),
    agendado_calendar: raw.agendado_calendar || 'No',
    id_evento_calendar: raw.id_evento_calendar?.trim() || null,
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

// ============================================================================
// 6. SANITIZADOR DE SUBTAREAS / PASOS
// ============================================================================

export function sanitizarSubtareaPayload(
  raw: SubtareaPaso,
  tareaUuidMap: Map<string, string>,
  actividadUuidMap: Map<string, string>,
  userId: string = DEFAULT_USER_ID
) {
  let resolvedTareaUuid: string | null = null;
  let resolvedActividadUuid: string | null = null;

  const idPadre = raw.id_padre_vinculado || '';

  if (raw.tipo_padre === 'TAREA' || idPadre.startsWith('TAR-')) {
    if (tareaUuidMap.has(idPadre)) {
      resolvedTareaUuid = tareaUuidMap.get(idPadre)!;
    } else if (isUuid(idPadre)) {
      resolvedTareaUuid = idPadre;
    }
  } else if (raw.tipo_padre === 'ACTIVIDAD' || idPadre.startsWith('ACT-')) {
    if (actividadUuidMap.has(idPadre)) {
      resolvedActividadUuid = actividadUuidMap.get(idPadre)!;
    } else if (isUuid(idPadre)) {
      resolvedActividadUuid = idPadre;
    }
  }

  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: isUuid(raw.user_id) ? raw.user_id : userId,
    codigo_legado: raw.codigo_legado,
    tarea_id: resolvedTareaUuid,
    actividad_id: resolvedActividadUuid,
    numero_paso: Math.max(1, Number(raw.numero_paso) || 1),
    descripcion_paso: raw.descripcion_paso || 'Paso sin descripción',
    completado: Boolean(raw.completado),
    fecha_completado: sanitizeTimestamp(raw.fecha_completado),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}
