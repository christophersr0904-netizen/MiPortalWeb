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
  SubtareaPaso,
  GastoRecord,
  IngresoRecord,
  CuotaRecord,
  MetaPlanRecord,
  HitoPlanRecord,
  HabitoMetaVinculo,
  HabitoLogRecord,
  IdeaRecord
} from '../types';

export type RemoteRow = Record<string, unknown>;

export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export function isUuid(val?: unknown): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

export function sanitizeDate(dateStr?: unknown): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (trimmed === '') return null;
  const clean = trimmed.split('T')[0].split(' ')[0];
  // Validar formato YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : null;
}

export function sanitizeTimestamp(tsStr?: unknown): string | null {
  if (!tsStr || typeof tsStr !== 'string') return null;
  const trimmed = tsStr.trim();
  if (trimmed === '') return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * REQ-OPT-46-EXEC: Trunca cadenas de texto para prevenir DoS por payloads sobredimensionados
 * en PostgREST / Supabase y agotar memoria en la serialización JSON.
 */
export function truncar(str?: unknown, maxLen: number = 255): string {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

/**
 * Normaliza fase WBS al conjunto canónico de PostgreSQL:
 * ('Iniciacion', 'Planificacion', 'Ejecucion', 'Control', 'Cierre')
 */
export function normalizarFaseAsociada(faseRaw?: unknown): 'Iniciacion' | 'Planificacion' | 'Ejecucion' | 'Control' | 'Cierre' {
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
export function normalizarTipoIniciativa(tipoRaw?: unknown): 'Profesional' | 'Inversiones' | 'Personal' {
  const t = String(tipoRaw || '').trim().toLowerCase();
  if (t.includes('profesional')) return 'Profesional';
  if (t.includes('inversion')) return 'Inversiones';
  return 'Personal';
}

/**
 * Normaliza estado del proyecto:
 * ('01_Backlog', '02_Planificado', '03_En_Ejecucion', '04_En_Pausa', '05_Cancelado', '06_Cerrado')
 */
export function normalizarEstadoProyecto(estadoRaw?: unknown): string {
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
export function normalizarEstadoTarea(estadoRaw?: unknown): string {
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

/**
 * Normalizador inverso Inbound para hitos_wbs (Supabase -> Dexie)
 * Resuelve y preserva proyecto_codigo cruzando proyecto_id con mapas en memoria
 * o localPrevio, armonizando atributos de peso, fecha y criterios DoD.
 */
export function sanitizarHitoInbound(
  remoto: RemoteRow,
  localPrevio?: RemoteRow | null,
  proyUuidToCod?: Map<string, string>,
  proyCodToUuid?: Map<string, string>
): HitoWbsRecord {
  let proyUuid = remoto.proyecto_id ? String(remoto.proyecto_id) : (localPrevio?.proyecto_id ? String(localPrevio.proyecto_id) : undefined);
  const resolvedProyCod =
    (localPrevio?.proyecto_codigo ? String(localPrevio.proyecto_codigo) : undefined) ||
    (proyUuid && proyUuidToCod
      ? proyUuidToCod.get(String(proyUuid).toUpperCase()) || proyUuidToCod.get(String(proyUuid))
      : undefined) ||
    (remoto.proyecto_codigo ? String(remoto.proyecto_codigo) : '') ||
    '';

  // REQ-BUGFIX-72-EXEC: Resolución O(1) en memoria si falta el UUID de proyecto_id
  if ((!proyUuid || !isUuid(proyUuid)) && resolvedProyCod && proyCodToUuid) {
    const resUuid = proyCodToUuid.get(resolvedProyCod) || proyCodToUuid.get(resolvedProyCod.toUpperCase());
    if (resUuid && isUuid(resUuid)) {
      proyUuid = resUuid;
    }
  }

  const rawPeso =
    remoto.peso_pct !== undefined
      ? Number(remoto.peso_pct)
      : remoto.peso_ponderado_pct !== undefined
        ? Number(remoto.peso_ponderado_pct)
        : Number(localPrevio?.peso_pct ?? localPrevio?.peso_ponderado_pct ?? 0);
  const peso_pct = rawPeso > 1 ? Number((rawPeso / 100).toFixed(4)) : Number(rawPeso.toFixed(4));

  const esMarcador = (remoto.tipo_elemento_wbs || localPrevio?.tipo_elemento_wbs) === 'HITO_MARCADOR';

  const criterioDodStr = typeof remoto.criterio_dod === 'string'
    ? remoto.criterio_dod.trim()
    : typeof remoto.criterio_aceptacion_dod === 'string'
      ? remoto.criterio_aceptacion_dod.trim()
      : typeof localPrevio?.criterio_dod === 'string'
        ? localPrevio.criterio_dod.trim()
        : null;

  const entregableLinkStr = typeof remoto.entregable_link === 'string'
    ? remoto.entregable_link.trim()
    : typeof remoto.entregable_verificable_link === 'string'
      ? remoto.entregable_verificable_link.trim()
      : typeof localPrevio?.entregable_link === 'string'
        ? localPrevio.entregable_link.trim()
        : null;

  return {
    ...localPrevio,
    ...remoto,
    id: String(remoto.id || localPrevio?.id || ''),
    user_id: String(remoto.user_id || localPrevio?.user_id || DEFAULT_USER_ID),
    codigo_legado: String(remoto.codigo_legado || localPrevio?.codigo_legado || ''),
    proyecto_id: proyUuid || '',
    proyecto_codigo: resolvedProyCod,
    tipo_elemento_wbs: esMarcador ? 'HITO_MARCADOR' : 'PAQUETE_TRABAJO',
    wbs_code: String(remoto.wbs_code || localPrevio?.wbs_code || '1.1'),
    fase_asociada: normalizarFaseAsociada(remoto.fase_asociada || localPrevio?.fase_asociada),
    nombre_elemento: String(
      remoto.nombre_elemento ||
      remoto.nombre_hito ||
      localPrevio?.nombre_elemento ||
      localPrevio?.nombre_hito ||
      'Elemento sin nombre'
    ),
    nombre_hito: String(
      remoto.nombre_hito ||
      remoto.nombre_elemento ||
      localPrevio?.nombre_hito ||
      localPrevio?.nombre_elemento ||
      'Elemento sin nombre'
    ),
    estado: String(remoto.estado || localPrevio?.estado || '01_Pendiente'),
    peso_pct,
    peso_ponderado_pct: remoto.peso_ponderado_pct !== undefined ? Number(remoto.peso_ponderado_pct) : (peso_pct > 0 && peso_pct <= 1 ? peso_pct * 100 : peso_pct),
    fecha_limite:
      sanitizeDate(remoto.fecha_limite) ||
      sanitizeDate(remoto.fecha_limite_plan) ||
      sanitizeDate(localPrevio?.fecha_limite) ||
      '',
    fecha_limite_plan:
      sanitizeDate(remoto.fecha_limite_plan) ||
      sanitizeDate(remoto.fecha_limite) ||
      sanitizeDate(localPrevio?.fecha_limite_plan) ||
      null,
    fecha_real_fin: sanitizeDate(remoto.fecha_real_fin) || sanitizeDate(localPrevio?.fecha_real_fin) || null,
    presupuesto_asignado: esMarcador
      ? 0.00
      : Math.max(0, Number(remoto.presupuesto_asignado ?? localPrevio?.presupuesto_asignado ?? 0)),
    criterio_dod: criterioDodStr,
    dependencia_hito_id: (remoto.dependencia_hito_id ? String(remoto.dependencia_hito_id) : (localPrevio?.dependencia_hito_id ? String(localPrevio.dependencia_hito_id) : null)),
    entregable_link: entregableLinkStr,
    duracion_estimada_dias: Math.max(0, Number(remoto.duracion_estimada_dias ?? localPrevio?.duracion_estimada_dias ?? 0)),
    version: Math.max(1, Number(remoto.version ?? localPrevio?.version ?? 1)),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(remoto.updated_at) || sanitizeTimestamp(localPrevio?.updated_at) || new Date().toISOString()
  } as unknown as HitoWbsRecord;
}

// ============================================================================
// 3. SANITIZADOR DE TAREAS WBS
// ============================================================================

export function sanitizarTareaPayload(
  raw: TareaRecord,
  proyectoUuidMap: Map<string, string>,
  hitoUuidMap: Map<string, string>,
  userId: string = DEFAULT_USER_ID,
  tareaUuidMap?: Map<string, string>
) {
  let resolvedProyectoUuid: string | null = null;
  if (raw.proyecto_codigo) {
    if (proyectoUuidMap.has(raw.proyecto_codigo)) {
      resolvedProyectoUuid = proyectoUuidMap.get(raw.proyecto_codigo)!;
    } else if (isUuid(raw.proyecto_codigo)) {
      resolvedProyectoUuid = raw.proyecto_codigo;
    }
  }
  if (!resolvedProyectoUuid && proyectoUuidMap.size > 0) {
    resolvedProyectoUuid =
      proyectoUuidMap.get('PRO-001') ||
      proyectoUuidMap.get('pro-001') ||
      Array.from(proyectoUuidMap.values())[0] ||
      null;
  }

  let resolvedHitoUuid: string | null = null;
  if (raw.hito_codigo) {
    if (hitoUuidMap.has(raw.hito_codigo)) {
      resolvedHitoUuid = hitoUuidMap.get(raw.hito_codigo)!;
    } else if (isUuid(raw.hito_codigo)) {
      resolvedHitoUuid = raw.hito_codigo;
    }
  }
  if (!resolvedHitoUuid && hitoUuidMap.size > 0) {
    resolvedHitoUuid =
      hitoUuidMap.get('HIT-001') ||
      hitoUuidMap.get('hit-001') ||
      hitoUuidMap.get('WP-001') ||
      hitoUuidMap.get('wp-001') ||
      Array.from(hitoUuidMap.values())[0] ||
      null;
  }

  let resolvedDependenciaUuid: string | null = null;
  const rawDepToken = String(raw.id_dependencia || '').split(/[,;|]+/)[0]?.trim() || '';
  if (rawDepToken) {
    if (isUuid(rawDepToken)) {
      resolvedDependenciaUuid = rawDepToken;
    } else if (tareaUuidMap) {
      const depCandidate = tareaUuidMap.get(rawDepToken) || tareaUuidMap.get(rawDepToken.toUpperCase());
      if (depCandidate && isUuid(depCandidate)) {
        resolvedDependenciaUuid = depCandidate;
      }
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
    nombre_tarea_actividad: truncar(raw.nombre_tarea_actividad, 255) || 'Tarea sin nombre',
    estado_tarea: normalizarEstadoTarea(raw.estado_tarea),
    prioridad_eisenhower: prioridadNorm,
    nivel_energia_requerido: energiaNorm,
    horas_estimadas: Math.max(0, Number(raw.horas_estimadas) || 1.00),
    horas_reales: Math.max(0, Number(raw.horas_reales) || 0.00),
    fecha_programada: sanitizeDate(raw.fecha_programada),
    fecha_completado: sanitizeDate(raw.fecha_completado || ((raw as unknown as Record<string, unknown>).Fecha_Completado as string)) || null,
    agendado_en_calendar: raw.agendado_calendar === 'Sí' ? 'Sí' : 'No',
    id_evento_calendar: raw.id_evento_calendar?.trim() || null,
    dependencia_tarea_id: resolvedDependenciaUuid,
    responsable_ejecutor: raw.responsable_ejecutor?.trim() || 'Christopher',
    notas_impedimentos: raw.notas_impedimentos ? truncar(raw.notas_impedimentos, 4000) : null,
    es_mav: Boolean(raw.es_mav),
    costo_real_pen: Math.max(0, Number(raw.costo_real_pen) || 0),
    archivado: Boolean(raw.archivado),
    hora_inicio: raw.hora_inicio?.trim() || null,
    version: Math.max(1, Number((raw as unknown as Record<string, unknown>).version) || 1),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

/**
 * Normalizador inverso Inbound para tareas (Supabase -> Dexie)
 * Resuelve y preserva obligatoriamente proyecto_codigo, hito_codigo e id_dependencia (TAR-XXX)
 * a partir de mapas en memoria o localPrevio, evitando UUIDs crudos o campos vacíos.
 */
export function sanitizarTareaInbound(
  remoto: RemoteRow,
  localPrevio?: RemoteRow | null,
  proyUuidToCod?: Map<string, string>,
  hitoUuidToCod?: Map<string, string>,
  tareaUuidToCod?: Map<string, string>,
  proyCodToUuid?: Map<string, string>,
  hitoCodToUuid?: Map<string, string>
): TareaRecord {
  let proyUuid = remoto.proyecto_id || localPrevio?.proyecto_id;
  let hitoUuid = remoto.hito_id || localPrevio?.hito_id;

  const resolvedProyCod = String(
    localPrevio?.proyecto_codigo ||
    (proyUuid && proyUuidToCod
      ? proyUuidToCod.get(String(proyUuid).toUpperCase()) || proyUuidToCod.get(String(proyUuid))
      : undefined) ||
    remoto.proyecto_codigo ||
    ''
  );

  const resolvedHitoCod = String(
    localPrevio?.hito_codigo ||
    (hitoUuid && hitoUuidToCod
      ? hitoUuidToCod.get(String(hitoUuid).toUpperCase()) || hitoUuidToCod.get(String(hitoUuid))
      : undefined) ||
    remoto.hito_codigo ||
    ''
  );

  // REQ-BUGFIX-72-EXEC: Resolución O(1) en memoria para proyecto_id e hito_id si faltan UUIDs
  if ((!proyUuid || !isUuid(proyUuid)) && resolvedProyCod && proyCodToUuid) {
    const resUuid = proyCodToUuid.get(resolvedProyCod) || proyCodToUuid.get(resolvedProyCod.toUpperCase());
    if (resUuid && isUuid(resUuid)) {
      proyUuid = resUuid;
    }
  }

  if ((!hitoUuid || !isUuid(hitoUuid)) && resolvedHitoCod && hitoCodToUuid) {
    const resUuid = hitoCodToUuid.get(resolvedHitoCod) || hitoCodToUuid.get(resolvedHitoCod.toUpperCase());
    if (resUuid && isUuid(resUuid)) {
      hitoUuid = resUuid;
    }
  }

  const rawDepEntrada =
    remoto.id_dependencia ||
    remoto.dependencia_tarea_id ||
    localPrevio?.id_dependencia ||
    null;

  const NOISE_DEP_TOKENS = new Set(['', 'NINGUNO', 'NINGUNA', '0', '-', '—', 'N/A', 'NA', 'NULL', 'UNDEFINED', 'NONE']);
  let resolvedIdDependencia: string | null = null;
  if (rawDepEntrada) {
    const tokens = String(rawDepEntrada)
      .split(/[,;|]+/)
      .map((t) => t.trim())
      .filter((t) => Boolean(t) && !t.includes('@') && !NOISE_DEP_TOKENS.has(t.toUpperCase()));
    const traducidos = tokens
      .map((token) => {
        if (isUuid(token)) {
          if (tareaUuidToCod) {
            const cod =
              tareaUuidToCod.get(token) ||
              tareaUuidToCod.get(token.toLowerCase()) ||
              tareaUuidToCod.get(token.toUpperCase());
            if (cod) return cod.trim().toUpperCase();
          }
          if (localPrevio?.id_dependencia && !isUuid(String(localPrevio.id_dependencia))) {
            return String(localPrevio.id_dependencia).trim().toUpperCase();
          }
          return null;
        }
        return token.toUpperCase();
      })
      .filter((t): t is string => Boolean(t));
    resolvedIdDependencia = traducidos.length > 0 ? Array.from(new Set(traducidos)).join(', ') : null;
  }

  return {
    ...localPrevio,
    ...remoto,
    id: remoto.id || localPrevio?.id,
    user_id: remoto.user_id || localPrevio?.user_id || DEFAULT_USER_ID,
    codigo_legado: remoto.codigo_legado || localPrevio?.codigo_legado || '',
    proyecto_id: proyUuid || '',
    hito_id: hitoUuid || '',
    proyecto_codigo: resolvedProyCod,
    hito_codigo: resolvedHitoCod,
    nombre_tarea_actividad:
      remoto.nombre_tarea_actividad ||
      remoto.nombre_tarea ||
      localPrevio?.nombre_tarea_actividad ||
      'Tarea sin nombre',
    estado_tarea: normalizarEstadoTarea(remoto.estado_tarea || localPrevio?.estado_tarea),
    prioridad_eisenhower: remoto.prioridad_eisenhower || localPrevio?.prioridad_eisenhower || '02_P2_Media',
    nivel_energia_requerido: remoto.nivel_energia_requerido || localPrevio?.nivel_energia_requerido || 'Media_Operativa',
    horas_estimadas: Math.max(0, Number(remoto.horas_estimadas ?? localPrevio?.horas_estimadas ?? 1.0)),
    horas_reales: Math.max(0, Number(remoto.horas_reales ?? localPrevio?.horas_reales ?? 0.0)),
    fecha_programada: sanitizeDate(remoto.fecha_programada) || sanitizeDate(localPrevio?.fecha_programada) || null,
    fecha_completado: sanitizeDate(remoto.fecha_completado || remoto.Fecha_Completado) || sanitizeDate(localPrevio?.fecha_completado) || undefined,
    hora_inicio: remoto.hora_inicio || localPrevio?.hora_inicio || null,
    agendado_calendar:
      remoto.agendado_calendar ||
      (remoto.agendado_en_calendar === 'Sí' ? 'Sí' : 'No') ||
      localPrevio?.agendado_calendar ||
      'No',
    id_evento_calendar: (remoto.id_evento_calendar ?? localPrevio?.id_evento_calendar) || undefined,
    id_dependencia: resolvedIdDependencia ?? undefined,
    responsable_ejecutor:
      (typeof remoto.responsable_ejecutor === 'string' ? remoto.responsable_ejecutor.trim() : '') ||
      (typeof localPrevio?.responsable_ejecutor === 'string' ? localPrevio.responsable_ejecutor.trim() : '') ||
      'Christopher',
    notas_impedimentos:
      (typeof remoto.notas_impedimentos === 'string' ? remoto.notas_impedimentos.trim() : '') ||
      (typeof localPrevio?.notas_impedimentos === 'string' ? localPrevio.notas_impedimentos.trim() : null),
    es_mav: Boolean(remoto.es_mav ?? localPrevio?.es_mav ?? false),
    costo_real_pen: Math.max(0, Number(remoto.costo_real_pen ?? localPrevio?.costo_real_pen ?? 0)),
    archivado: Boolean(remoto.archivado ?? localPrevio?.archivado ?? false),
    version: Math.max(1, Number(remoto.version ?? localPrevio?.version ?? 1)),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(remoto.updated_at) || localPrevio?.updated_at || new Date().toISOString()
  } as unknown as TareaRecord;
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
    titulo: truncar(raw.titulo, 255) || 'Sin Título',
    contenido_markdown: truncar(raw.contenido_markdown ?? '', 65535),
    checklists_json: checklists,
    wishlist_json: wishlist,
    color_tema: raw.color_tema || 'default',
    es_fijada: Boolean(raw.es_fijada),
    tipo_nota: raw.tipo_nota || 'GENERAL',
    block_nombre: typeof raw.block_nombre === 'string' ? raw.block_nombre.trim() : '',
    version: Math.max(1, Number(raw.version) || 1),
    adjuntos_drive_json: adjuntos,
    enlaces_entidades_json: enlaces,
    etiquetas: etiquetas,
    fecha_creacion: sanitizeTimestamp(raw.created_at) || new Date().toISOString(),
    fecha_actualizacion: sanitizeTimestamp(raw.updated_at) || new Date().toISOString(),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

/**
 * Normalizador inverso Inbound para notas (Supabase -> Dexie)
 * Protege contra la degradación de esquemas y preserva cuadernos (block_nombre) y checklists.
 */
export function sanitizarNotaInbound(
  remoto: RemoteRow,
  localPrevio?: RemoteRow | null
): NotaRecord {
  const checklists = Array.isArray(remoto.checklists_json)
    ? remoto.checklists_json
    : Array.isArray(localPrevio?.checklists_json)
    ? localPrevio.checklists_json
    : [];
  const wishlist =
    remoto.wishlist_json && typeof remoto.wishlist_json === 'object'
      ? remoto.wishlist_json
      : localPrevio?.wishlist_json || {};
  const adjuntos = Array.isArray(remoto.adjuntos_drive_json)
    ? remoto.adjuntos_drive_json
    : Array.isArray(localPrevio?.adjuntos_drive_json)
    ? localPrevio.adjuntos_drive_json
    : [];
  const enlaces = Array.isArray(remoto.enlaces_entidades_json)
    ? remoto.enlaces_entidades_json
    : Array.isArray(localPrevio?.enlaces_entidades_json)
    ? localPrevio.enlaces_entidades_json
    : [];
  const etiquetas = Array.isArray(remoto.etiquetas)
    ? remoto.etiquetas
    : Array.isArray(localPrevio?.etiquetas)
    ? localPrevio.etiquetas
    : [];

  return {
    ...localPrevio,
    ...remoto,
    id: remoto.id || localPrevio?.id,
    user_id: remoto.user_id || localPrevio?.user_id || DEFAULT_USER_ID,
    codigo_legado: remoto.codigo_legado || localPrevio?.codigo_legado || '',
    titulo: (typeof remoto.titulo === 'string' ? remoto.titulo.trim() : '') || (typeof localPrevio?.titulo === 'string' ? localPrevio.titulo.trim() : 'Sin Título'),
    contenido_markdown: typeof remoto.contenido_markdown === 'string' ? remoto.contenido_markdown : (typeof localPrevio?.contenido_markdown === 'string' ? localPrevio.contenido_markdown : ''),
    tipo_nota: String(remoto.tipo_nota || localPrevio?.tipo_nota || 'GENERAL'),
    block_nombre: typeof remoto.block_nombre === 'string' ? remoto.block_nombre.trim() : (localPrevio?.block_nombre ?? ''),
    checklists_json: checklists,
    wishlist_json: wishlist,
    color_tema: remoto.color_tema || localPrevio?.color_tema || 'default',
    color: remoto.color || localPrevio?.color || remoto.color_tema || localPrevio?.color_tema || 'default',
    es_fijada: Boolean(remoto.es_fijada ?? localPrevio?.es_fijada ?? false),
    fijada: Boolean(remoto.es_fijada ?? localPrevio?.es_fijada ?? false),
    adjuntos_drive_json: adjuntos,
    enlaces_entidades_json: enlaces,
    etiquetas: etiquetas,
    created_at: sanitizeTimestamp(remoto.created_at || remoto.fecha_creacion) || localPrevio?.created_at || new Date().toISOString(),
    version: Math.max(1, Number(remoto.version ?? localPrevio?.version ?? 1)),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(remoto.updated_at || remoto.fecha_actualizacion) || localPrevio?.updated_at || new Date().toISOString()
  } as unknown as NotaRecord;
}

// ============================================================================
// 5. SANITIZADOR DE ACTIVIDADES PERSONALES (HÁBITOS)
// ============================================================================

export function sanitizarActividadPayload(raw: ActividadPersonal, userId: string = DEFAULT_USER_ID) {
  const tipoRegistroNormalizado = (item: Record<string, unknown> | ActividadPersonal): 'HABITUAL' | 'PUNTUAL' | 'META' => {
    const itemRec = item as unknown as Record<string, unknown>;
    const t = String(itemRec.tipo_registro || itemRec.tipo_compromiso || itemRec.Tipo_Registro || '').toUpperCase();
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
    nombre: truncar(raw.nombre_actividad || ((raw as unknown as Record<string, unknown>).nombre as string), 255) || 'Actividad sin nombre',
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
    duracion_horas: raw.duracion_horas !== undefined && raw.duracion_horas !== null && !Number.isNaN(Number(raw.duracion_horas))
      ? Math.max(0, Number(raw.duracion_horas))
      : 1.00,
    agendado_calendar: raw.agendado_calendar || 'No',
    id_evento_calendar: raw.id_evento_calendar?.trim() || null,
    frecuencia_ciclo: raw.frecuencia_ciclo || 'DIARIA',
    regla_repeticion: raw.regla_repeticion || '',
    fecha_fin: sanitizeDate(raw.fecha_fin),
    excepciones_fechas: Array.isArray(raw.excepciones_fechas) ? raw.excepciones_fechas : [],
    ultima_fecha_completado: sanitizeDate(raw.ultima_fecha_completado),
    proxima_fecha_programada: sanitizeDate(raw.proxima_fecha_programada),
    historial_fechas: Array.isArray(raw.historial_fechas) ? raw.historial_fechas : [],
    actividad_padre_id: isUuid(raw.actividad_padre_id) ? raw.actividad_padre_id : null,
    notas_checklist: raw.notas_checklist ? truncar(raw.notas_checklist, 4000) : '',
    monto_gasto_asociado: Math.max(0, Number(raw.monto_gasto_asociado) || 0),
    version: Math.max(1, Number(raw.version) || 1),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

/**
 * Normalizador inverso Inbound para actividades_personales (Supabase -> Dexie)
 * Protege contra la degradación de esquemas y preserva campos locales críticos.
 */
export function sanitizarActividadInbound(
  remoto: RemoteRow,
  localPrevio?: RemoteRow | null
): ActividadPersonal {
  const nombreAct = remoto.nombre_actividad || remoto.nombre || localPrevio?.nombre_actividad || localPrevio?.nombre || 'Actividad';

  // Si localPrevio ya tenía un subtipo específico (ej. 'HABITO_MANTENIMIENTO', 'HABITO_ACUMULATIVO', 'CHECKLIST_META'),
  // preservarlo en lugar de sobreescribir con 'HABITUAL'.
  let tipoComp: string | undefined = (localPrevio as Record<string, unknown> | undefined)?.tipo_compromiso as string || (localPrevio as Record<string, unknown> | undefined)?.tipo_registro as string;
  if (!tipoComp || tipoComp === 'HABITUAL') {
    const tr = String(remoto.tipo_compromiso || remoto.tipo_registro || '').toUpperCase();
    if (tr.includes('META') || tr.includes('CHECKLIST')) tipoComp = 'CHECKLIST_META';
    else if (tr.includes('PUNTUAL')) tipoComp = 'PUNTUAL';
    else if (tr.includes('ACUMULATIVO')) tipoComp = 'HABITO_ACUMULATIVO';
    else if (tr.includes('MANTENIMIENTO')) tipoComp = 'HABITO_MANTENIMIENTO';
    else tipoComp = String(remoto.tipo_compromiso || remoto.tipo_registro || 'HABITUAL');
  }

  return {
    ...localPrevio,
    ...remoto,
    id: remoto.id || localPrevio?.id,
    user_id: remoto.user_id || localPrevio?.user_id || DEFAULT_USER_ID,
    codigo_legado: remoto.codigo_legado || localPrevio?.codigo_legado || '',
    nombre_actividad: nombreAct,
    tipo_compromiso: tipoComp,
    categoria_vida: remoto.categoria_vida || localPrevio?.categoria_vida || 'SALUD_DEPORTE',
    meta_macro_nombre: remoto.meta_macro_nombre ?? localPrevio?.meta_macro_nombre,
    unidad_medida: remoto.unidad_medida ?? localPrevio?.unidad_medida,
    meta_objetivo_total: Math.max(0, Number(remoto.meta_objetivo_total ?? localPrevio?.meta_objetivo_total ?? 0)),
    valor_acumulado_actual: Math.max(0, Number(remoto.valor_acumulado_actual ?? localPrevio?.valor_acumulado_actual ?? 0)),
    meta_diaria_estandar: Math.max(0, Number(remoto.meta_diaria_estandar ?? localPrevio?.meta_diaria_estandar ?? 0)),
    nivel_rescate_minimo: Math.max(0, Number(remoto.nivel_rescate_minimo ?? localPrevio?.nivel_rescate_minimo ?? 0)),
    estado: remoto.estado || localPrevio?.estado || '02_Por_Hacer',
    racha_actual: Math.max(0, Number(remoto.racha_actual ?? localPrevio?.racha_actual ?? 0)),
    fecha_programada: sanitizeDate(remoto.fecha_programada) || sanitizeDate(localPrevio?.fecha_programada) || new Date().toISOString().split('T')[0],
    fecha_fin: sanitizeDate(remoto.fecha_fin) ?? localPrevio?.fecha_fin,
    hora_inicio: (typeof remoto.hora_inicio === 'string' ? remoto.hora_inicio.trim() : '') || (typeof localPrevio?.hora_inicio === 'string' ? localPrevio.hora_inicio.trim() : '08:00'),
    duracion_horas: remoto.duracion_horas !== undefined && remoto.duracion_horas !== null && !Number.isNaN(Number(remoto.duracion_horas))
      ? Math.max(0, Number(remoto.duracion_horas))
      : (localPrevio?.duracion_horas !== undefined && localPrevio?.duracion_horas !== null && !Number.isNaN(Number(localPrevio.duracion_horas))
          ? Math.max(0, Number(localPrevio.duracion_horas))
          : 1),
    agendado_calendar: remoto.agendado_calendar || localPrevio?.agendado_calendar || 'No',
    id_evento_calendar: remoto.id_evento_calendar ?? localPrevio?.id_evento_calendar ?? null,
    // Preservación inquebrantable de campos locales que no existen en Supabase
    frecuencia_ciclo: remoto.frecuencia_ciclo ?? localPrevio?.frecuencia_ciclo ?? 'DIARIA',
    regla_repeticion: remoto.regla_repeticion ?? localPrevio?.regla_repeticion ?? '',
    notas_checklist: remoto.notas_checklist ?? localPrevio?.notas_checklist ?? '',
    icono: ((remoto as Record<string, unknown>).icono ?? (localPrevio as Record<string, unknown>)?.icono) as string | undefined,
    monto_gasto_asociado: Number(remoto.monto_gasto_asociado ?? localPrevio?.monto_gasto_asociado ?? 0),
    actividad_padre_id: remoto.actividad_padre_id ?? localPrevio?.actividad_padre_id,
    ultima_fecha_completado: remoto.ultima_fecha_completado ?? localPrevio?.ultima_fecha_completado,
    excepciones_fechas: remoto.excepciones_fechas ?? localPrevio?.excepciones_fechas,
    historial_fechas: remoto.historial_fechas ?? localPrevio?.historial_fechas,
    version: remoto.version ?? localPrevio?.version ?? 1,
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(remoto.updated_at) || localPrevio?.updated_at || new Date().toISOString()
  } as unknown as ActividadPersonal;
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

/**
 * Normalizador inverso Inbound para subtareas_pasos (Supabase -> Dexie)
 * Reconstruye id_padre_vinculado y tipo_padre a partir de tarea_id o actividad_id,
 * resolviendo UUIDs hacia códigos legados canónicos (TAR-XXX / ACT-XXX) mediante mapas en memoria.
 */
export function sanitizarSubtareaInbound(
  remoto: RemoteRow,
  localPrevio?: RemoteRow | null,
  tareaUuidToCod?: Map<string, string>,
  actividadUuidToCod?: Map<string, string>
): SubtareaPaso {
  let tipoPadre: 'TAREA' | 'ACTIVIDAD' = (localPrevio?.tipo_padre as 'TAREA' | 'ACTIVIDAD') || 'TAREA';
  let idPadre: string = String(localPrevio?.id_padre_vinculado || '');

  if (remoto.tarea_id) {
    tipoPadre = 'TAREA';
    const tareaIdStr = String(remoto.tarea_id);
    const resCod =
      tareaUuidToCod?.get(tareaIdStr) ||
      tareaUuidToCod?.get(tareaIdStr.toUpperCase()) ||
      tareaUuidToCod?.get(tareaIdStr.toLowerCase());
    idPadre = resCod || (localPrevio?.id_padre_vinculado && !isUuid(localPrevio.id_padre_vinculado) ? String(localPrevio.id_padre_vinculado) : tareaIdStr);
  } else if (remoto.actividad_id) {
    tipoPadre = 'ACTIVIDAD';
    const actIdStr = String(remoto.actividad_id);
    const resCod =
      actividadUuidToCod?.get(actIdStr) ||
      actividadUuidToCod?.get(actIdStr.toUpperCase()) ||
      actividadUuidToCod?.get(actIdStr.toLowerCase());
    idPadre = resCod || (localPrevio?.id_padre_vinculado && !isUuid(localPrevio.id_padre_vinculado) ? String(localPrevio.id_padre_vinculado) : actIdStr);
  } else if (remoto.tipo_padre) {
    tipoPadre = String(remoto.tipo_padre) as 'TAREA' | 'ACTIVIDAD';
    if (remoto.id_padre_vinculado) {
      idPadre = String(remoto.id_padre_vinculado);
    }
  }

  return {
    ...localPrevio,
    ...remoto,
    id: (remoto.id ? String(remoto.id) : (localPrevio?.id ? String(localPrevio.id) : '')),
    user_id: String(remoto.user_id || localPrevio?.user_id || DEFAULT_USER_ID),
    codigo_legado: String(remoto.codigo_legado || localPrevio?.codigo_legado || ''),
    id_padre_vinculado: idPadre,
    tipo_padre: tipoPadre,
    numero_paso: Math.max(1, Number(remoto.numero_paso ?? localPrevio?.numero_paso ?? 1)),
    descripcion_paso: String(remoto.descripcion_paso || localPrevio?.descripcion_paso || 'Paso sin descripción'),
    completado: typeof remoto.completado === 'boolean' ? remoto.completado : Boolean(localPrevio?.completado),
    fecha_completado: sanitizeTimestamp(remoto.fecha_completado) ?? (localPrevio?.fecha_completado ? String(localPrevio.fecha_completado) : null),
    version: Math.max(1, Number(remoto.version ?? localPrevio?.version ?? 1)),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(remoto.updated_at) || sanitizeTimestamp(localPrevio?.updated_at) || new Date().toISOString()
  } as unknown as SubtareaPaso;
}

// ============================================================================
// 7. SANITIZADOR DE GASTOS
// ============================================================================

export function sanitizarGastoPayload(raw: GastoRecord, userId: string = DEFAULT_USER_ID) {
  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: isUuid(raw.user_id) ? raw.user_id : userId,
    codigo_legado: raw.codigo_legado,
    tipo_origen: raw.tipo_origen || 'PERSONAL',
    id_origen_vinculado: raw.id_origen_vinculado || null,
    categoria_gasto: raw.categoria_gasto || 'General',
    fecha_gasto: sanitizeDate(raw.fecha_gasto) || new Date().toISOString().split('T')[0],
    fecha_ejecucion_real: sanitizeDate(raw.fecha_ejecucion_real || ((raw as unknown as Record<string, unknown>).Fecha_Ejecucion_Real as string)) || null,
    descripcion_gasto: raw.descripcion_gasto?.trim() || 'Gasto sin descripción',
    moneda_original: raw.moneda_original || 'PEN',
    monto_original: Math.max(0, Number(raw.monto_original) || 0),
    tipo_cambio: Number(raw.tipo_cambio) || 1.0,
    monto_pen: Math.max(0, Number(raw.monto_pen) || 0),
    modalidad: raw.modalidad || 'CONTADO',
    metodo_pago: raw.metodo_pago || 'EFECTIVO',
    estado_pago: raw.estado_pago || 'PAGADO',
    comprobante_url: raw.comprobante_url || null,
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

// ============================================================================
// 8. SANITIZADOR DE INGRESOS
// ============================================================================

export function sanitizarIngresoPayload(raw: IngresoRecord, userId: string = DEFAULT_USER_ID) {
  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: isUuid(raw.user_id) ? raw.user_id : userId,
    codigo_legado: raw.codigo_legado,
    tipo_origen: raw.tipo_origen || 'HONORARIO',
    categoria_ingreso: raw.categoria_ingreso || 'General',
    fecha_ingreso: sanitizeDate(raw.fecha_ingreso) || new Date().toISOString().split('T')[0],
    fecha_ejecucion_real: sanitizeDate(raw.fecha_ejecucion_real || ((raw as unknown as Record<string, unknown>).Fecha_Ejecucion_Real as string)) || null,
    descripcion_ingreso: raw.descripcion_ingreso?.trim() || 'Ingreso sin descripción',
    moneda_original: raw.moneda_original || 'PEN',
    monto_original: Math.max(0, Number(raw.monto_original) || 0),
    tipo_cambio: Number(raw.tipo_cambio) || 1.0,
    monto_pen: Math.max(0, Number(raw.monto_pen) || 0),
    metodo_cobro: raw.metodo_cobro || 'TRANSFERENCIA',
    cuenta_destino: raw.cuenta_destino || 'Principal',
    estado_cobro: raw.estado_cobro || 'COBRADO',
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

// ============================================================================
// 9. SANITIZADOR DE CUOTAS
// ============================================================================

export function sanitizarCuotaPayload(raw: CuotaRecord, userId: string = DEFAULT_USER_ID) {
  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: isUuid(raw.user_id) ? raw.user_id : userId,
    codigo_legado: raw.codigo_legado,
    id_credito_padre: raw.id_credito_padre || null,
    entidad_financiera: raw.entidad_financiera || 'Banco',
    numero_cuota: Math.max(1, Number(raw.numero_cuota) || 1),
    total_cuotas: Math.max(1, Number(raw.total_cuotas) || 1),
    monto_cuota: Math.max(0, Number(raw.monto_cuota) || 0),
    moneda: raw.moneda || 'PEN',
    fecha_vencimiento: sanitizeDate(raw.fecha_vencimiento) || new Date().toISOString().split('T')[0],
    estado_cuota: raw.estado_cuota || 'PENDIENTE',
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

// ============================================================================
// 10. SANITIZADOR DE METAS Y PLANES
// ============================================================================

/**
 * REQ-SYNC-40-EXEC: Resuelve el user_id para entidades con restricción Foreign Key hacia auth.users.
 * Si se dispone de un userId de sesión autenticada real (distinto de DEFAULT_USER_ID),
 * éste sustituye de forma segura cualquier user_id sintético o nulo preexistente en local.
 */
export function resolverUserIdSeguro(rawUserId?: string | null, fallbackUserId: string = DEFAULT_USER_ID): string {
  if (fallbackUserId && fallbackUserId !== DEFAULT_USER_ID && isUuid(fallbackUserId)) {
    if (!rawUserId || rawUserId === DEFAULT_USER_ID || !isUuid(rawUserId)) {
      return fallbackUserId;
    }
    return rawUserId;
  }
  return isUuid(rawUserId) ? (rawUserId as string) : fallbackUserId;
}

export function sanitizarMetaPlanPayload(raw: MetaPlanRecord, userId: string = DEFAULT_USER_ID) {
  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: resolverUserIdSeguro(raw.user_id, userId),
    codigo_legado: raw.codigo_legado,
    nombre_meta: raw.nombre_meta?.trim() || 'Meta sin nombre',
    descripcion: raw.descripcion?.trim() || null,
    categoria_vida: raw.categoria_vida || 'SALUD_DEPORTE',
    tipo_meta: raw.tipo_meta || 'CUANTITATIVA',
    unidad_medida: raw.unidad_medida?.trim() || 'unidades',
    meta_objetivo_total: Math.max(0, Number(raw.meta_objetivo_total) || 0),
    valor_acumulado_actual: Math.max(0, Number(raw.valor_acumulado_actual) || 0),
    nivel_rescate_minimo: Math.max(0, Number(raw.nivel_rescate_minimo) || 0),
    peso_hitos_pct: Math.max(0, Number(raw.peso_hitos_pct) || 50),
    peso_habitos_pct: Math.max(0, Number(raw.peso_habitos_pct) || 50),
    fecha_inicio: sanitizeDate(raw.fecha_inicio),
    fecha_fin: sanitizeDate(raw.fecha_fin),
    estado: raw.estado || '01_Backlog',
    proyecto_id: isUuid(raw.proyecto_id) ? raw.proyecto_id : null,
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

// ============================================================================
// 11. SANITIZADOR DE HITOS DEL PLAN DE ACCIÓN
// ============================================================================

export function sanitizarHitoPlanPayload(
  raw: HitoPlanRecord,
  metaUuidMap: Map<string, string>,
  userId: string = DEFAULT_USER_ID
) {
  let resolvedMetaUuid: string | null = null;
  const metaId = raw.meta_id || '';
  if (metaUuidMap.has(metaId)) {
    resolvedMetaUuid = metaUuidMap.get(metaId)!;
  } else if (isUuid(metaId)) {
    resolvedMetaUuid = metaId;
  }

  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: resolverUserIdSeguro(raw.user_id, userId),
    codigo_legado: raw.codigo_legado,
    meta_id: resolvedMetaUuid,
    titulo_hito: raw.titulo_hito?.trim() || 'Hito sin título',
    orden_secuencia: Math.max(1, Number(raw.orden_secuencia) || 1),
    fecha_objetivo: sanitizeDate(raw.fecha_objetivo),
    completado: Boolean(raw.completado),
    fecha_completado: sanitizeDate(raw.fecha_completado),
    peso_relativo: Math.max(1, Number(raw.peso_relativo) || 1),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

// ============================================================================
// 12. SANITIZADOR DE VÍNCULOS HÁBITO-META
// ============================================================================

export function sanitizarVinculoPayload(
  raw: HabitoMetaVinculo,
  habitoUuidMap: Map<string, string>,
  metaUuidMap: Map<string, string>,
  userId: string = DEFAULT_USER_ID
) {
  let resolvedHabitoUuid: string | null = null;
  const habId = raw.habito_id || '';
  if (habitoUuidMap.has(habId)) {
    resolvedHabitoUuid = habitoUuidMap.get(habId)!;
  } else if (isUuid(habId)) {
    resolvedHabitoUuid = habId;
  }

  let resolvedMetaUuid: string | null = null;
  const metaId = raw.meta_id || '';
  if (metaUuidMap.has(metaId)) {
    resolvedMetaUuid = metaUuidMap.get(metaId)!;
  } else if (isUuid(metaId)) {
    resolvedMetaUuid = metaId;
  }

  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: resolverUserIdSeguro(raw.user_id, userId),
    habito_id: resolvedHabitoUuid,
    meta_id: resolvedMetaUuid,
    modo_computo: raw.modo_computo || 'VOLUMEN_DIRECTO',
    factor_conversion: Number(raw.factor_conversion) || 1.0,
    peso_contribucion_pct: Math.max(0, Number(raw.peso_contribucion_pct) || 100),
    meta_volumen_esperada: Math.max(0, Number(raw.meta_volumen_esperada) || 0),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

// ============================================================================
// 13. SANITIZADOR DE LOGS DE CUMPLIMIENTO DE HÁBITOS
// ============================================================================

export function sanitizarHabitoLogPayload(raw: HabitoLogRecord, userId: string = DEFAULT_USER_ID) {
  return {
    id: isUuid(raw.id) ? raw.id : undefined,
    user_id: isUuid(raw.user_id) ? raw.user_id : userId,
    habito_id: isUuid(raw.habito_id) ? raw.habito_id : raw.habito_id,
    fecha_registro: sanitizeDate(raw.fecha_registro) || new Date().toISOString().split('T')[0],
    hora_registro: raw.hora_registro?.trim() || null,
    completado: Boolean(raw.completado),
    valor_cuantitativo_sumado: Number(raw.valor_cuantitativo_sumado) || 0,
    es_rescate: Boolean(raw.es_rescate),
    nota_contexto: raw.nota_contexto?.trim() || null,
    fecha_programada_original: sanitizeDate(raw.fecha_programada_original) || null,
    dias_desfase: raw.dias_desfase !== undefined && raw.dias_desfase !== null && !isNaN(Number(raw.dias_desfase))
      ? Number(raw.dias_desfase)
      : null,
    duracion_estimada_horas: raw.duracion_estimada_horas !== undefined && raw.duracion_estimada_horas !== null
      ? Math.max(0, Number(raw.duracion_estimada_horas) || 0)
      : null,
    duracion_real_horas: raw.duracion_real_horas !== undefined && raw.duracion_real_horas !== null
      ? Math.max(0, Number(raw.duracion_real_horas) || 0)
      : null,
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(raw.updated_at) || new Date().toISOString()
  };
}

export function sanitizarHabitoLogInbound(
  remoto: RemoteRow,
  localPrevio?: RemoteRow | null
): HabitoLogRecord {
  return {
    ...localPrevio,
    ...remoto,
    id: (remoto.id ? String(remoto.id) : (localPrevio?.id ? String(localPrevio.id) : '')),
    user_id: String(remoto.user_id || localPrevio?.user_id || DEFAULT_USER_ID),
    habito_id: String(remoto.habito_id || localPrevio?.habito_id || ''),
    fecha_registro: sanitizeDate(remoto.fecha_registro) || sanitizeDate(localPrevio?.fecha_registro) || new Date().toISOString().split('T')[0],
    hora_registro: typeof remoto.hora_registro === 'string' ? remoto.hora_registro.trim() : (typeof localPrevio?.hora_registro === 'string' ? localPrevio.hora_registro.trim() : undefined),
    completado: Boolean(remoto.completado ?? localPrevio?.completado ?? true),
    valor_cuantitativo_sumado: Number(remoto.valor_cuantitativo_sumado ?? localPrevio?.valor_cuantitativo_sumado ?? 0),
    es_rescate: Boolean(remoto.es_rescate ?? localPrevio?.es_rescate ?? false),
    nota_contexto: typeof remoto.nota_contexto === 'string' ? remoto.nota_contexto.trim() : (typeof localPrevio?.nota_contexto === 'string' ? localPrevio.nota_contexto.trim() : undefined),
    fecha_programada_original: sanitizeDate(remoto.fecha_programada_original || localPrevio?.fecha_programada_original) || undefined,
    dias_desfase: remoto.dias_desfase !== undefined && remoto.dias_desfase !== null
      ? Number(remoto.dias_desfase)
      : (localPrevio?.dias_desfase !== undefined && localPrevio?.dias_desfase !== null ? Number(localPrevio.dias_desfase) : undefined),
    duracion_estimada_horas: remoto.duracion_estimada_horas !== undefined && remoto.duracion_estimada_horas !== null
      ? Number(remoto.duracion_estimada_horas)
      : (localPrevio?.duracion_estimada_horas !== undefined && localPrevio?.duracion_estimada_horas !== null ? Number(localPrevio.duracion_estimada_horas) : undefined),
    duracion_real_horas: remoto.duracion_real_horas !== undefined && remoto.duracion_real_horas !== null
      ? Number(remoto.duracion_real_horas)
      : (localPrevio?.duracion_real_horas !== undefined && localPrevio?.duracion_real_horas !== null ? Number(localPrevio.duracion_real_horas) : undefined),
    sync_status: 'synced',
    updated_at: sanitizeTimestamp(remoto.updated_at) || sanitizeTimestamp(localPrevio?.updated_at) || new Date().toISOString()
  } as unknown as HabitoLogRecord;
}

/**
 * ============================================================================
 * SANITIZADORES PARA TABLA: IDEAS (BBDD_Ideas)
 * ============================================================================
 */

export function sanitizarIdeaPayload(idea: IdeaRecord, fallbackUserId?: string): RemoteRow {
  let tipoCaptura = 'TEXTO';
  const tc = String(idea.tipo_captura || '').toUpperCase();
  if (tc === 'AUDIO' || tc === 'VOZ') {
    tipoCaptura = 'AUDIO';
  } else if (tc === 'FOTO') {
    tipoCaptura = 'FOTO';
  }

  let estado = 'Inbox';
  const est = String(idea.estado || '').toUpperCase();
  if (est === 'INCUBACION' || est === 'INCUBANDO') {
    estado = 'Incubacion';
  } else if (est === 'PROCESADA' || est === 'CONVERTIDA') {
    estado = 'Procesada';
  } else if (est === 'ARCHIVADA') {
    estado = 'Archivada';
  }

  let urlAdjunto: string | null = idea.url_adjunto_drive || null;
  if (urlAdjunto && urlAdjunto.startsWith('data:') && urlAdjunto.length > 500 * 1024) {
    console.warn(`[SyncSanitizer] url_adjunto_drive en idea ${idea.codigo_legado} supera 500KB; omitido de sync remoto para prevenir 413 Payload Too Large`);
    urlAdjunto = null;
  }

  let clarifObj: Record<string, unknown> = {};
  if (idea.clarificacion_ia) {
    if (typeof idea.clarificacion_ia === 'object') {
      clarifObj = idea.clarificacion_ia as Record<string, unknown>;
    } else {
      try {
        const parsed = JSON.parse(idea.clarificacion_ia);
        clarifObj = typeof parsed === 'object' && parsed !== null ? parsed : { raw: idea.clarificacion_ia };
      } catch {
        clarifObj = { raw: idea.clarificacion_ia };
      }
    }
  }

  let entidadConvertida: string | null = null;
  if (idea.entidad_convertida) {
    const ecUpper = idea.entidad_convertida.trim().toUpperCase();
    if (ecUpper === 'TAREA') entidadConvertida = 'TAREA';
    else if (ecUpper === 'PROYECTO') entidadConvertida = 'PROYECTO';
    else if (ecUpper === 'HABITO' || ecUpper === 'HÁBITO') entidadConvertida = 'HABITO';
    else if (ecUpper === 'NOTA') entidadConvertida = 'NOTA';
  }

  const nowIso = new Date().toISOString();
  const fechaCaptura = sanitizeTimestamp(idea.fecha_captura) || nowIso;
  const updatedAt = sanitizeTimestamp(idea.updated_at) || nowIso;

  return {
    id: idea.id,
    user_id: isUuid(idea.user_id) ? idea.user_id : (fallbackUserId && isUuid(fallbackUserId) ? fallbackUserId : DEFAULT_USER_ID),
    codigo_legado: idea.codigo_legado,
    enunciado_idea: idea.enunciado_idea || 'Idea sin título',
    detalle_contexto: idea.detalle_contexto || '',
    tipo_captura: tipoCaptura,
    url_adjunto_drive: urlAdjunto,
    transcripcion_texto: idea.transcripcion_texto || null,
    clarificacion_ia: clarifObj,
    estado,
    entidad_convertida: entidadConvertida,
    id_entidad_destino_legado: idea.id_entidad_destino || null,
    fecha_captura: fechaCaptura,
    fecha_procesada: estado === 'Procesada' ? updatedAt : null,
    fecha_archivado: estado === 'Archivada' ? updatedAt : null,
    sync_status: 'synced',
    updated_at: updatedAt
  };
}

export const sanitizarIdeaOutbound = sanitizarIdeaPayload;

export function sanitizarIdeaInbound(
  remoto: RemoteRow,
  localPrevio?: RemoteRow | null
): IdeaRecord {
  const tcRaw = String(remoto.tipo_captura || localPrevio?.tipo_captura || 'TEXTO').toUpperCase();
  const tipoCaptura = tcRaw === 'AUDIO' ? 'VOZ' : tcRaw;

  const estRaw = String(remoto.estado || localPrevio?.estado || 'Inbox');
  let estado = 'CAPTURA';
  if (estRaw === 'Incubacion' || estRaw === 'INCUBANDO') {
    estado = 'INCUBANDO';
  } else if (estRaw === 'Procesada' || estRaw === 'CONVERTIDA') {
    estado = 'CONVERTIDA';
  } else if (estRaw === 'Archivada' || estRaw === 'ARCHIVADA') {
    estado = 'ARCHIVADA';
  }

  let clarifStr = '';
  if (remoto.clarificacion_ia !== undefined && remoto.clarificacion_ia !== null) {
    clarifStr = typeof remoto.clarificacion_ia === 'string'
      ? remoto.clarificacion_ia
      : JSON.stringify(remoto.clarificacion_ia);
  } else if (localPrevio?.clarificacion_ia) {
    clarifStr = typeof localPrevio.clarificacion_ia === 'string'
      ? localPrevio.clarificacion_ia
      : JSON.stringify(localPrevio.clarificacion_ia);
  }

  const nowIso = new Date().toISOString();
  return {
    ...localPrevio,
    ...remoto,
    id: (remoto.id ? String(remoto.id) : (localPrevio?.id ? String(localPrevio.id) : '')),
    user_id: String(remoto.user_id || localPrevio?.user_id || DEFAULT_USER_ID),
    codigo_legado: String(remoto.codigo_legado || localPrevio?.codigo_legado || ''),
    enunciado_idea: String(remoto.enunciado_idea || localPrevio?.enunciado_idea || 'Idea sin título'),
    detalle_contexto: String(remoto.detalle_contexto ?? localPrevio?.detalle_contexto ?? ''),
    tipo_captura: tipoCaptura,
    url_adjunto_drive: typeof remoto.url_adjunto_drive === 'string'
      ? remoto.url_adjunto_drive
      : (typeof localPrevio?.url_adjunto_drive === 'string' ? localPrevio.url_adjunto_drive : undefined),
    transcripcion_texto: typeof remoto.transcripcion_texto === 'string'
      ? remoto.transcripcion_texto
      : (typeof localPrevio?.transcripcion_texto === 'string' ? localPrevio.transcripcion_texto : undefined),
    clarificacion_ia: clarifStr || undefined,
    estado,
    entidad_convertida: typeof remoto.entidad_convertida === 'string'
      ? remoto.entidad_convertida
      : (typeof localPrevio?.entidad_convertida === 'string' ? localPrevio.entidad_convertida : undefined),
    id_entidad_destino: typeof remoto.id_entidad_destino_legado === 'string'
      ? remoto.id_entidad_destino_legado
      : (typeof localPrevio?.id_entidad_destino === 'string' ? localPrevio.id_entidad_destino : undefined),
    fecha_captura: String(remoto.fecha_captura || localPrevio?.fecha_captura || nowIso),
    updated_at: sanitizeTimestamp(remoto.updated_at) || sanitizeTimestamp(localPrevio?.updated_at) || nowIso,
    sync_status: 'synced'
  } as unknown as IdeaRecord;
}
