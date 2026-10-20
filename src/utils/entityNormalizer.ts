/**
 * ============================================================================
 * ARCHIVO: src/utils/entityNormalizer.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-1TO1-001 (Adaptador Universal Coalescente Canónico)
 * DESCRIPCIÓN: Mapeador polimórfico tolerante a fallos para armonizar
 *              las propiedades legacy (PascalCase / ID_*) y canónicas (snake_case)
 * ============================================================================
 */

import type { NotaRecord, ChecklistItem, WishlistMeta, AdjuntoDrive, VinculoEntidad } from '../types';

/**
 * Extractor tolerante a fallos multillave
 */
export function getProp<T = any>(obj: any, ...keys: string[]): T {
  if (!obj || typeof obj !== 'object') return undefined as any;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
      return obj[k] as T;
    }
  }
  return undefined as any;
}

// ============================================================================
// CONTRATOS E INTERFACES CANÓNICAS
// ============================================================================

export interface CanonicalProyecto {
  id: string;
  codigo_legado: string;
  nombre: string;
  tipo_iniciativa: string;
  arquetipo: string;
  estado: string;
  avance_pct: number; // Escala unificada 0 a 100 entero (ej. 65)
  presupuesto: number;
  costo_real: number;
  costo_real_usd: number;
  health_status: string;
  health_motivo?: string;
  spi: number;
  cpi: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  ultima_revision?: string;
  north_star_okr?: string;
  criterios_dod?: string;
  raw: any;
}

export interface CanonicalTarea {
  id: string;
  codigo_legado: string;
  nombre: string;
  estado: '01_Backlog' | '02_Por_Hacer' | '03_En_Proceso' | '04_Completado' | string;
  estado_label: string;
  prioridad: string;
  proyecto_codigo: string;
  hito_codigo?: string;
  nivel_energia?: string;
  horas_estimadas: number;
  horas_reales: number;
  fecha_programada?: string;
  es_mav: boolean;
  costo_real: number;
  responsable?: string;
  notas?: string;
  raw: any;
}

export interface CanonicalHito {
  id: string;
  codigo_legado: string;
  proyecto_id: string;
  nombre: string;
  tipo_wbs: string;
  wbs_code: string;
  fase: string;
  estado: string;
  peso_pct: number;
  fecha_limite: string;
  fecha_real_fin?: string;
  presupuesto: number;
  duracion_dias: number;
  criterio_dod?: string;
  dependencia_hito_id?: string;
  entregable_link?: string;
  raw: any;
}

export interface CanonicalActividad {
  id: string;
  codigo_legado: string;
  nombre: string;
  tipo_compromiso: string;
  categoria_vida: string;
  racha_actual: number;
  valor_acumulado: number;
  meta_diaria: number;
  meta_objetivo_total: number;
  nivel_rescate_minimo: number;
  estado: string;
  fecha_programada: string;
  hora_inicio?: string;
  duracion_horas: number;
  agendado_calendar: string;
  monto_gasto: number;
  raw: any;
}

// ============================================================================
// FUNCIONES NORMALIZADORAS COALESCENTES
// ============================================================================

/**
 * Normaliza cualquier objeto de Proyecto (legacy Sheets o IndexedDB snake_case)
 */
export function normalizeProyecto(raw: any): CanonicalProyecto {
  if (!raw) {
    return {
      id: '',
      codigo_legado: '',
      nombre: 'Sin Proyecto',
      tipo_iniciativa: 'Personal',
      arquetipo: '1_Infraestructura',
      estado: '03_En_Ejecucion',
      avance_pct: 0,
      presupuesto: 0,
      costo_real: 0,
      costo_real_usd: 0,
      health_status: 'Saludable',
      spi: 1.0,
      cpi: 1.0,
      raw: {}
    };
  }

  const rawAvance = Number(getProp(raw, 'avance_real_pct', 'Avance_Real_Pct', 'avance_pct') ?? 0);
  // Escalar si viene en rango decimal 0.0 - 1.0
  const avance_pct = rawAvance <= 1.0 && rawAvance > 0 ? Math.round(rawAvance * 100) : Math.round(rawAvance);

  return {
    id: String(getProp(raw, 'id', 'ID_Proyecto', 'codigo_legado') ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p${Date.now()}`)),
    codigo_legado: String(getProp(raw, 'codigo_legado', 'ID_Proyecto') ?? ''),
    nombre: String(getProp(raw, 'nombre_proyecto', 'Nombre_Proyecto', 'nombre') ?? 'Proyecto Sin Nombre'),
    tipo_iniciativa: String(getProp(raw, 'tipo_iniciativa', 'Tipo_Iniciativa') ?? 'Personal'),
    arquetipo: String(getProp(raw, 'arquetipo_proyecto', 'Arquetipo_Proyecto', 'arquetipo') ?? '1_Infraestructura'),
    estado: String(getProp(raw, 'estado_proyecto', 'Estado_Proyecto', 'estado') ?? '03_En_Ejecucion'),
    avance_pct,
    presupuesto: Number(getProp(raw, 'presupuesto_tope', 'Presupuesto_Tope', 'presupuesto_total', 'presupuesto') ?? 0),
    costo_real: Number(getProp(raw, 'costo_ejecutado_real_pen', 'Costo_Ejecutado_Real_PEN', 'costo_real_pen', 'costo_real') ?? 0),
    costo_real_usd: Number(getProp(raw, 'costo_ejecutado_real_usd', 'Costo_Ejecutado_Real_USD') ?? 0),
    health_status: String(getProp(raw, 'health_status', 'Health_Status') ?? 'Saludable'),
    health_motivo: getProp(raw, 'health_motivo', 'Health_Motivo'),
    spi: Number(getProp(raw, 'spi', 'SPI') ?? 1.0),
    cpi: Number(getProp(raw, 'cpi', 'CPI') ?? 1.0),
    fecha_inicio: getProp(raw, 'fecha_inicio_plan', 'Fecha_Inicio_Plan'),
    fecha_fin: getProp(raw, 'fecha_fin_plan', 'Fecha_Fin_Plan'),
    ultima_revision: getProp(raw, 'ultima_revision', 'Ultima_Revision'),
    north_star_okr: getProp(raw, 'north_star_okr', 'North_Star_OKR'),
    criterios_dod: getProp(raw, 'criterios_aceptacion_dod', 'Criterios_Aceptacion_DoD', 'Criterios_DoD'),
    raw
  };
}

/**
 * Normaliza cualquier objeto de Tarea (legacy Sheets o IndexedDB snake_case)
 */
export function normalizeTarea(raw: any): CanonicalTarea {
  if (!raw) {
    return {
      id: '',
      codigo_legado: '',
      nombre: 'Sin Tarea',
      estado: '01_Backlog',
      estado_label: 'Backlog',
      prioridad: '02_P2_Media',
      proyecto_codigo: 'PRO-001',
      horas_estimadas: 0,
      horas_reales: 0,
      es_mav: false,
      costo_real: 0,
      raw: {}
    };
  }

  const rawEstado = String(getProp(raw, 'estado_tarea', 'Estado_Tarea', 'estado') ?? '01_Backlog').trim();
  let estado: '01_Backlog' | '02_Por_Hacer' | '03_En_Proceso' | '04_Completado' = '01_Backlog';
  let estado_label = 'Backlog';

  if (rawEstado.includes('Completado') || rawEstado.includes('Terminado') || rawEstado === '04_Completado') {
    estado = '04_Completado';
    estado_label = 'Completado';
  } else if (rawEstado.includes('Proceso') || rawEstado.includes('Curso') || rawEstado === '03_En_Proceso') {
    estado = '03_En_Proceso';
    estado_label = 'En Proceso';
  } else if (rawEstado.includes('Hacer') || rawEstado.includes('Planificado') || rawEstado === '02_Por_Hacer') {
    estado = '02_Por_Hacer';
    estado_label = 'Por Hacer';
  } else {
    estado = '01_Backlog';
    estado_label = 'Backlog';
  }

  return {
    id: String(getProp(raw, 'id', 'ID_Tarea', 'idTarea', 'codigo_legado') ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `t${Date.now()}`)),
    codigo_legado: String(getProp(raw, 'codigo_legado', 'ID_Tarea', 'idTarea') ?? ''),
    nombre: String(getProp(raw, 'nombre_tarea_actividad', 'Nombre_Tarea_Actividad', 'nombre_tarea', 'nombre') ?? 'Tarea Sin Nombre'),
    estado,
    estado_label,
    prioridad: String(getProp(raw, 'prioridad_eisenhower', 'Prioridad_Eisenhower', 'prioridad') ?? '02_P2_Media'),
    proyecto_codigo: String(getProp(raw, 'proyecto_codigo', 'ID_Proyecto', 'idProyecto') ?? ''),
    hito_codigo: getProp(raw, 'hito_codigo', 'ID_Hito', 'idHito'),
    nivel_energia: getProp(raw, 'nivel_energia_requerido', 'Nivel_Energia_Requerido'),
    horas_estimadas: Number(getProp(raw, 'horas_estimadas', 'Horas_Estimadas') ?? 0),
    horas_reales: Number(getProp(raw, 'horas_reales', 'Horas_Reales') ?? 0),
    fecha_programada: getProp(raw, 'fecha_programada', 'Fecha_Programada'),
    es_mav: Boolean(getProp(raw, 'es_mav', 'Es_MAV')),
    costo_real: Number(getProp(raw, 'costo_real_pen', 'Costo_Real_PEN') ?? 0),
    responsable: getProp(raw, 'responsable_ejecutor', 'Responsable_Ejecutor'),
    notas: getProp(raw, 'notas_impedimentos', 'Notas_Impedimentos'),
    raw
  };
}

/**
 * Normaliza cualquier objeto de Hito/WBS (legacy Sheets o IndexedDB snake_case)
 */
export function normalizeHito(raw: any): CanonicalHito {
  if (!raw) {
    return {
      id: '',
      codigo_legado: '',
      proyecto_id: '',
      nombre: 'Sin Hito',
      tipo_wbs: 'PAQUETE_TRABAJO',
      wbs_code: '1.1',
      fase: '01_INICIACION',
      estado: '01_Pendiente',
      peso_pct: 0,
      fecha_limite: '',
      presupuesto: 0,
      duracion_dias: 0,
      raw: {}
    };
  }

  const rawPeso = Number(getProp(raw, 'peso_pct', 'Peso_Ponderado_Pct', 'pesoPonderadoPct') ?? 0);
  const peso_pct = rawPeso <= 1.0 ? rawPeso : rawPeso / 100;

  return {
    id: String(getProp(raw, 'id', 'ID_Hito', 'ID_Elemento_WBS', 'idHito') ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `h${Date.now()}`)),
    codigo_legado: String(getProp(raw, 'codigo_legado', 'ID_Hito', 'ID_Elemento_WBS', 'idHito') ?? ''),
    proyecto_id: String(getProp(raw, 'proyecto_id', 'ID_Proyecto', 'idProyecto') ?? ''),
    nombre: String(getProp(raw, 'nombre_elemento', 'Nombre_Elemento', 'Nombre_Hito', 'nombre_hito') ?? 'Hito Sin Nombre'),
    tipo_wbs: String(getProp(raw, 'tipo_elemento_wbs', 'Tipo_Elemento_WBS', 'tipoElementoWbs') ?? 'PAQUETE_TRABAJO'),
    wbs_code: String(getProp(raw, 'wbs_code', 'WBS_Code', 'wbsCode') ?? '1.1'),
    fase: String(getProp(raw, 'fase_asociada', 'Fase_Asociada', 'faseAsociada') ?? '01_INICIACION'),
    estado: String(getProp(raw, 'estado', 'Estado', 'Estado_Hito', 'estadoHito') ?? '01_Pendiente'),
    peso_pct,
    fecha_limite: String(getProp(raw, 'fecha_limite', 'Fecha_Limite_Plan', 'Fecha_Limite', 'fechaLimite') ?? ''),
    fecha_real_fin: getProp(raw, 'fecha_real_fin', 'Fecha_Real_Fin', 'fechaRealFin'),
    presupuesto: Number(getProp(raw, 'presupuesto_asignado', 'Presupuesto_Asignado', 'presupuestoAsignado') ?? 0),
    duracion_dias: Number(getProp(raw, 'duracion_estimada_dias', 'Duracion_Dias', 'duracionDias') ?? 0),
    criterio_dod: getProp(raw, 'criterio_dod', 'Criterio_Aceptacion_DoD', 'Criterios_DoD', 'criterioDod'),
    dependencia_hito_id: getProp(raw, 'dependencia_hito_id', 'Dependencia_Predecesora', 'Dependencia_ID_Hito'),
    entregable_link: getProp(raw, 'entregable_link', 'Entregable_Link', 'Entregable_Verificable_Link'),
    raw
  };
}

/**
 * Normaliza cualquier objeto de Actividad / Hábito (legacy Sheets o IndexedDB snake_case)
 */
export function normalizeActividad(raw: any): CanonicalActividad {
  if (!raw) {
    return {
      id: '',
      codigo_legado: '',
      nombre: 'Sin Actividad',
      tipo_compromiso: 'HABITUAL',
      categoria_vida: 'SALUD_DEPORTE',
      racha_actual: 0,
      valor_acumulado: 0,
      meta_diaria: 1,
      meta_objetivo_total: 0,
      nivel_rescate_minimo: 1,
      estado: '02_Por_Hacer',
      fecha_programada: '',
      duracion_horas: 1,
      agendado_calendar: 'No',
      monto_gasto: 0,
      raw: {}
    };
  }

  return {
    id: String(getProp(raw, 'id', 'ID_Actividad', 'codigo_legado') ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `a${Date.now()}`)),
    codigo_legado: String(getProp(raw, 'codigo_legado', 'ID_Actividad') ?? ''),
    nombre: String(getProp(raw, 'nombre_actividad', 'Nombre_Actividad', 'Nombre', 'nombre') ?? 'Actividad Sin Nombre'),
    tipo_compromiso: String(getProp(raw, 'tipo_compromiso', 'Tipo_Compromiso', 'Tipo_Registro') ?? 'HABITUAL'),
    categoria_vida: String(getProp(raw, 'categoria_vida', 'Categoria_Vida') ?? 'SALUD_DEPORTE'),
    racha_actual: Number(getProp(raw, 'racha_actual', 'Racha_Actual') ?? 0),
    valor_acumulado: Number(getProp(raw, 'valor_acumulado_actual', 'valor_acumulado', 'Valor_Acumulado_Actual') ?? 0),
    meta_diaria: Number(getProp(raw, 'meta_diaria_estandar', 'meta_diaria', 'Meta_Diaria_Estandar') ?? 1),
    meta_objetivo_total: Number(getProp(raw, 'meta_objetivo_total', 'Meta_Objetivo_Total') ?? 0),
    nivel_rescate_minimo: Number(getProp(raw, 'nivel_rescate_minimo', 'Nivel_Rescate_Minimo') ?? 1),
    estado: String(getProp(raw, 'estado', 'Estado') ?? '02_Por_Hacer'),
    fecha_programada: String(getProp(raw, 'fecha_programada', 'Fecha_Programada') ?? ''),
    hora_inicio: getProp(raw, 'hora_inicio', 'Hora_Inicio'),
    duracion_horas: Number(getProp(raw, 'duracion_horas', 'Duracion_Horas') ?? 1),
    agendado_calendar: String(getProp(raw, 'agendado_calendar', 'Agendado_Calendar') ?? 'No'),
    monto_gasto: Number(getProp(raw, 'monto_gasto_asociado', 'Monto_Gasto_Asociado') ?? 0),
    raw
  };
}

// ============================================================================
// REGLA DE NEGOCIO CANÓNICA: BÓVEDA DE ARCHIVADOS (+10 DÍAS)
// ============================================================================

/**
 * Calcula la antigüedad en días transcurridos desde la fecha del evento terminal
 * hasta la fecha de referencia (por defecto: medianoche de hoy).
 */
export function calcularDiasArchivado(param: any, fechaReferencia?: Date): number {
  if (!param) return 0;
  if (typeof param === 'object' && param._desarchivado === true) return 0;

  try {
    let fVal: any = null;
    if (typeof param === 'string' || param instanceof Date) {
      fVal = param;
    } else if (typeof param === 'object') {
      fVal = getProp(
        param,
        'fecha_completado',
        'Fecha_Completado',
        'fecha_conciliacion',
        'Fecha_Conciliacion',
        'fecha_fin_real',
        'Fecha_Fin_Real',
        'fecha_gasto',
        'Fecha_Gasto',
        'fecha_ingreso',
        'Fecha_Ingreso',
        'fecha_programada',
        'Fecha_Programada',
        'fecha_fin_plan',
        'Fecha_Fin_Plan',
        'fecha_actualizacion',
        'Fecha_Actualizacion',
        'updated_at',
        'fecha',
        'Fecha'
      );
    }

    if (!fVal) return 0;

    let d: Date;
    if (fVal instanceof Date) {
      d = new Date(fVal.getFullYear(), fVal.getMonth(), fVal.getDate());
    } else {
      const clean = String(fVal).split('T')[0].split(' ')[0].trim();
      const parts = clean.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(fVal);
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }

    if (isNaN(d.getTime())) return 0;

    const ref = fechaReferencia ? new Date(fechaReferencia) : new Date();
    const refMedianoche = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    const diffMs = refMedianoche.getTime() - d.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

/**
 * Evalúa si una entidad cumple estrictamente con el criterio canónico para ingresar a la
 * Bóveda de Archivados:
 * 1. Pertenecer a un estado terminal/completado/conciliado/archivado según su tipo.
 * 2. Tener una antigüedad mayor a 10 días desde su fecha terminal (diffDias > 10).
 * 3. No haber sido reactivada en caliente mediante la bandera _desarchivado === true.
 */
export function esElementoArchivado(
  item: any,
  coleccion?: 'tareas' | 'proyectos' | 'actividades' | 'gastos' | 'ingresos' | 'ideas' | string,
  fechaReferencia?: Date
): boolean {
  if (!item || typeof item !== 'object') return false;
  if (item._desarchivado === true) return false;

  let esTerminal = false;

  // Detección automática de colección si no viene explícita
  const col = coleccion?.toLowerCase() || (
    item.estado_tarea !== undefined || item.ID_Tarea !== undefined ? 'tareas' :
    item.estado_proyecto !== undefined || item.ID_Proyecto !== undefined ? 'proyectos' :
    item.tipo_compromiso !== undefined || item.ID_Actividad !== undefined ? 'actividades' :
    item.estado_pago !== undefined || item.ID_Gasto !== undefined ? 'gastos' :
    item.estado_cobro !== undefined || item.ID_Ingreso !== undefined ? 'ingresos' :
    item.ID_Idea !== undefined ? 'ideas' : 'desconocido'
  );

  switch (col) {
    case 'tareas': {
      const est = String(getProp(item, 'estado_tarea', 'Estado_Tarea', 'estado', 'Estado') ?? '').trim();
      esTerminal =
        est === '04_Completado' ||
        est === '05_Archivado' ||
        est === '04_Hecho' ||
        est.includes('04_Completad') ||
        item.completado === true ||
        item.Completado === true;
      break;
    }

    case 'proyectos': {
      const est = String(getProp(item, 'estado_proyecto', 'Estado_Proyecto', 'estado', 'Estado') ?? '').trim();
      const avance = Number(getProp(item, 'avance_real_pct', 'avance_pct', 'Avance_Real_Pct') ?? 0);
      const avanceNormalizado = avance <= 1 && avance > 0 ? avance * 100 : avance;
      esTerminal =
        est === '04_Cerrado' ||
        est === '05_Archivado' ||
        est === '06_Cerrado' ||
        est === '04_Completado' ||
        avanceNormalizado >= 100;
      break;
    }

    case 'actividades': {
      const est = String(getProp(item, 'estado', 'Estado', 'estado_actividad') ?? '').trim();
      esTerminal =
        est === '04_Completado' ||
        est === '05_Archivado' ||
        est === '04_Hecho' ||
        est === 'Completado';
      break;
    }

    case 'gastos': {
      const est = String(getProp(item, 'estado_pago', 'Estado_Pago', 'estado') ?? '').toUpperCase();
      const conc = getProp(item, 'conciliado', 'Conciliado');
      esTerminal = est === 'PAGADO' || est === '05_ARCHIVADO' || conc === true;
      break;
    }

    case 'ingresos': {
      const est = String(getProp(item, 'estado_cobro', 'Estado_Cobro', 'estado') ?? '').toUpperCase();
      const conc = getProp(item, 'conciliado', 'Conciliado');
      esTerminal = est === 'COBRADO' || est === '05_ARCHIVADO' || conc === true;
      break;
    }

    case 'ideas': {
      const est = String(getProp(item, 'estado', 'Estado') ?? '').toUpperCase();
      esTerminal = est === 'PROCESADA' || est === 'ARCHIVADA';
      break;
    }

    default: {
      const estGen = String(getProp(item, 'estado_tarea', 'estado_proyecto', 'estado', 'Estado') ?? '').trim();
      esTerminal =
        estGen === '04_Completado' ||
        estGen === '05_Archivado' ||
        estGen === '04_Cerrado' ||
        item.completado === true;
    }
  }

  if (!esTerminal) return false;

  const dias = calcularDiasArchivado(item, fechaReferencia);
  return dias > 10;
}

/**
 * REQ-1TO1-003: Validación Definition of Done (DoD) de Subtareas
 * Verifica si todas las subtareas asociadas a un elemento padre están completas.
 */
export function validarDoDSubtareas(
  idPadre: string,
  subtareas: any[]
): { valido: boolean; total: number; completadas: number; pendientes: number } {
  if (!idPadre || !Array.isArray(subtareas)) return { valido: true, total: 0, completadas: 0, pendientes: 0 };
  const idNorm = String(idPadre).trim().toUpperCase();
  const items = subtareas.filter((s) => {
    const idP = String(
      getProp(s, 'id_padre_vinculado', 'ID_Padre_Vinculado', 'id_padre', 'ID_Padre', 'idPadre') ?? ''
    ).trim().toUpperCase();
    return idP === idNorm;
  });

  if (items.length === 0) return { valido: true, total: 0, completadas: 0, pendientes: 0 };

  const completadas = items.filter((s) => {
    const comp = getProp(s, 'completado', 'Completado');
    return comp === true || comp === 1 || String(comp).toLowerCase() === 'true' || String(comp).toLowerCase() === 'sí';
  }).length;

  const pendientes = items.length - completadas;
  return {
    valido: pendientes === 0,
    total: items.length,
    completadas,
    pendientes
  };
}

/**
 * REQ-1TO1-003: Evaluación de horizonte temporal (TODO, HOY, SEMANA, MES)
 */
export function evaluarFiltroTemporal(
  fechaIso: string | undefined | null,
  filtro: 'TODO' | 'HOY' | 'SEMANA' | 'MES',
  fechaRef: Date = new Date()
): boolean {
  if (filtro === 'TODO' || !filtro) return true;
  if (!fechaIso) return false;

  const fechaLimpia = String(fechaIso).split('T')[0].split(' ')[0];
  const refIso = fechaRef.toISOString().split('T')[0];

  if (filtro === 'HOY') {
    return fechaLimpia === refIso;
  }

  if (filtro === 'MES') {
    return fechaLimpia.substring(0, 7) === refIso.substring(0, 7);
  }

  if (filtro === 'SEMANA') {
    const d = new Date(fechaRef);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const targetDate = new Date(`${fechaLimpia}T12:00:00`);
    return targetDate >= monday && targetDate <= sunday;
  }

  return true;
}

/**
 * REQ-HABITS-FILTER-BY-META-16: Evaluación de filtro por meta estratégica en actividades
 */
export function evaluarFiltroMeta(
  actividad: { id: string; meta_macro_nombre?: string | null },
  filtroMetaId: string,
  metasPorHabitoId: Map<string, { id: string; nombre_meta?: string }>,
  metasPlanes: Array<{ id: string; nombre_meta?: string }> = []
): boolean {
  if (filtroMetaId === 'TODAS' || !filtroMetaId) return true;

  if (filtroMetaId === '__SIN_META__') {
    return !metasPorHabitoId.has(actividad.id) && (!actividad.meta_macro_nombre || actividad.meta_macro_nombre.trim() === '');
  }

  const metaAsociada = metasPorHabitoId.get(actividad.id);
  if (metaAsociada?.id === filtroMetaId) {
    return true;
  }

  if (actividad.meta_macro_nombre && actividad.meta_macro_nombre.trim() !== '') {
    const metaElegida = metasPlanes.find((m) => m.id === filtroMetaId);
    if (
      metaElegida &&
      metaElegida.nombre_meta &&
      actividad.meta_macro_nombre.trim().toLowerCase() === metaElegida.nombre_meta.trim().toLowerCase()
    ) {
      return true;
    }
  }

  return false;
}

/**
 * REQ-1TO1-003: Evaluación de filtro de plazo y vencimiento
 */
export function evaluarFiltroPlazo(
  fechaIso: string | undefined | null,
  plazo: string,
  estado?: string,
  fechaRef: Date = new Date()
): boolean {
  if (!plazo) return true;
  if (plazo === 'sin_fecha') return !fechaIso;
  if (!fechaIso) return false;

  const fechaLimpia = String(fechaIso).split('T')[0].split(' ')[0];
  const refIso = fechaRef.toISOString().split('T')[0];

  if (plazo === 'hoy') {
    return fechaLimpia === refIso;
  }

  if (plazo === 'vencidas') {
    const esCompletado = estado && (estado.includes('Completado') || estado === '04_Completado');
    return fechaLimpia < refIso && !esCompletado;
  }

  if (plazo === '7dias') {
    const dRef = new Date(`${refIso}T00:00:00`);
    const dMax = new Date(dRef);
    dMax.setDate(dRef.getDate() + 7);
    const target = new Date(`${fechaLimpia}T12:00:00`);
    return target >= dRef && target <= dMax;
  }

  return true;
}

/**
 * REQ-1TO1-003E: Motor Jerárquico Canónico de Avance Real y % Meta (EVM Proyectado)
 * Pondera Paquetes de Trabajo (WP) e Hitos WBS según su peso (Peso_Ponderado_Pct)
 * o esfuerzo (horas estimadas) o cronograma planificado (Fecha_Inicio_Plan a Fecha_Fin_Plan).
 */
export function calcularAvancesProyectoCanonica(
  proyecto: CanonicalProyecto | any,
  hitos: any[] = [],
  tareas: any[] = []
): { avanceReal: number; avanceTotalProyectado: number } {
  if (!proyecto) return { avanceReal: 0, avanceTotalProyectado: 0 };
  const proyCode = String(proyecto.codigo_legado || proyecto.id || proyecto.ID_Proyecto || '').trim().toUpperCase();

  // Filtrar hitos del proyecto
  const hitosProy = hitos.filter((h) => {
    const pCode = String(h.proyecto_codigo || h.proyecto_id || h.id_proyecto || h.ID_Proyecto || '').trim().toUpperCase();
    return pCode === proyCode;
  });

  const hitosIds = new Set(hitosProy.map((h) => String(h.codigo_legado || h.id || h.ID_Hito || '').trim().toUpperCase()));

  // Filtrar tareas del proyecto
  const tareasProy = tareas.filter((t) => {
    const tProy = String(t.proyecto_codigo || t.proyecto_id || t.id_proyecto || t.ID_Proyecto || '').trim().toUpperCase();
    const tHito = String(t.hito_codigo || t.id_hito || t.ID_Hito || '').trim().toUpperCase();
    return tProy === proyCode || hitosIds.has(tHito) || (tHito && tHito.startsWith(proyCode));
  });

  // Caso 1: Proyecto con Hitos WBS
  if (hitosProy.length > 0) {
    // 1. Determinar pesos de hitos
    let totalManual = 0;
    let hasManual = false;
    const manualWeights: Record<string, number> = {};

    hitosProy.forEach((h) => {
      const hId = String(h.codigo_legado || h.id || h.ID_Hito || '').trim();
      const val = parseFloat(h.peso_pct || h.peso_ponderado_pct || h.Peso_Ponderado_Pct || 0);
      if (!isNaN(val) && val > 0) {
        manualWeights[hId] = val;
        totalManual += val;
        hasManual = true;
      } else {
        manualWeights[hId] = 0;
      }
    });

    const pesos: Record<string, number> = {};
    if (hasManual && totalManual > 0) {
      hitosProy.forEach((h) => {
        const hId = String(h.codigo_legado || h.id || h.ID_Hito || '').trim();
        pesos[hId] = manualWeights[hId] / totalManual;
      });
    } else {
      // Criterio A: Por esfuerzo de tareas asociadas
      const horasPorHito: Record<string, number> = {};
      let totalHoras = 0;
      hitosProy.forEach((h) => {
        const hId = String(h.codigo_legado || h.id || h.ID_Hito || '').trim();
        const tareasHito = tareasProy.filter((t) => {
          const tH = String(t.hito_codigo || t.id_hito || t.ID_Hito || '').trim();
          return tH === hId;
        });
        const sumHoras = tareasHito.reduce((acc, t) => {
          const hEst = parseFloat(t.horas_estimadas || t.Horas_Estimadas || 0);
          return acc + (!isNaN(hEst) && hEst > 0 ? hEst : 0);
        }, 0);
        horasPorHito[hId] = sumHoras;
        totalHoras += sumHoras;
      });

      if (totalHoras > 0) {
        hitosProy.forEach((h) => {
          const hId = String(h.codigo_legado || h.id || h.ID_Hito || '').trim();
          pesos[hId] = horasPorHito[hId] / totalHoras;
        });
      } else {
        // Criterio B: Equitativo 1 / N
        const pesoEq = 1 / hitosProy.length;
        hitosProy.forEach((h) => {
          const hId = String(h.codigo_legado || h.id || h.ID_Hito || '').trim();
          pesos[hId] = pesoEq;
        });
      }
    }

    let avanceRealSuma = 0;
    let pesoCompletados = 0;
    let hitoActivo: { hito: any; peso: number; avance: number } | null = null;

    hitosProy.forEach((h) => {
      const hId = String(h.codigo_legado || h.id || h.ID_Hito || '').trim();
      const pesoH = pesos[hId] || 0;

      // Avance del hito
      const tareasHito = tareasProy.filter((t) => {
        const tH = String(t.hito_codigo || t.id_hito || t.ID_Hito || '').trim();
        return tH === hId;
      });

      let avH = 0;
      if (h.estado === '04_Completado' || h.estado === 'Completado' || h.Estado === '04_Completado') {
        avH = 100;
      } else if (tareasHito.length > 0) {
        const sumTar = tareasHito.reduce((acc, t) => {
          const isComp = t.estado === '04_Completado' || t.estado_tarea === '04_Completado';
          return acc + (isComp ? 100 : (t.estado === '03_En_Proceso' ? 50 : 0));
        }, 0);
        avH = Math.round(sumTar / tareasHito.length);
      } else {
        avH = parseFloat(h.avance_real_pct || h.Avance_Real_Pct || 0);
        if (avH > 0 && avH <= 1) avH *= 100;
      }

      avanceRealSuma += (avH * pesoH);

      if (avH >= 100) {
        pesoCompletados += (pesoH * 100);
      } else if (!hitoActivo) {
        hitoActivo = { hito: h, peso: pesoH, avance: avH };
      }
    });

    let metaCalculada = 0;
    const activeHito = hitoActivo as { hito: any; peso: number; avance: number } | null;
    if (!activeHito) {
      metaCalculada = 100;
    } else {
      metaCalculada = pesoCompletados + (activeHito.peso * 100);
    }

    const avRealFinal = Math.min(Math.max(Math.round(avanceRealSuma), 0), 100);
    const avMetaFinal = Math.min(Math.max(Math.round(metaCalculada), avRealFinal), 100);

    return {
      avanceReal: avRealFinal,
      avanceTotalProyectado: avMetaFinal
    };
  }

  // Caso 2: Sin Hitos pero con Tareas directas
  if (tareasProy.length > 0) {
    const tareasComp = tareasProy.filter((t) => t.estado === '04_Completado' || t.estado_tarea === '04_Completado').length;
    const tareasProc = tareasProy.filter((t) => t.estado === '03_En_Proceso' || t.estado_tarea === '03_En_Proceso').length;
    const sumaTar = (tareasComp * 100) + (tareasProc * 50);
    const avTarReal = Math.round(sumaTar / tareasProy.length);
    const metaTasks = (tareasComp === tareasProy.length)
      ? 100
      : Math.round(((tareasComp + 1) / tareasProy.length) * 100);

    const realFinal = Math.min(Math.max(avTarReal, 0), 100);
    const metaFinal = Math.min(Math.max(metaTasks, realFinal), 100);

    return {
      avanceReal: realFinal,
      avanceTotalProyectado: metaFinal
    };
  }

  // Caso 3: Sin hitos ni tareas - Proyección según cronograma planificado (Fecha_Inicio_Plan a Fecha_Fin_Plan)
  const fIni = proyecto.fecha_inicio || proyecto.Fecha_Inicio_Plan;
  const fFin = proyecto.fecha_fin || proyecto.Fecha_Fin_Plan;
  let metaCronograma = 0;
  if (fIni && fFin) {
    const tIni = new Date(fIni).getTime();
    const tFin = new Date(fFin).getTime();
    const tNow = Date.now();
    if (!isNaN(tIni) && !isNaN(tFin) && tFin > tIni) {
      const diasTotales = tFin - tIni;
      const diasPasados = Math.max(0, Math.min(tNow - tIni, diasTotales));
      metaCronograma = Math.round((diasPasados / diasTotales) * 100);
    }
  }

  const rawAvance = parseFloat(proyecto.avance_pct || proyecto.Avance_Real_Pct || 0);
  const avDirecto = Math.min(Math.max(Math.round(rawAvance > 1 ? rawAvance : rawAvance * 100), 0), 100);
  const metaFinal = Math.min(Math.max(metaCronograma || avDirecto, avDirecto), 100);

  return {
    avanceReal: avDirecto,
    avanceTotalProyectado: metaFinal
  };
}

/**
 * Normaliza cualquier objeto de Nota (legacy Sheets o IndexedDB snake_case)
 * Garantiza nota modular compuesta (texto + checklist + wishlist simultáneos),
 * soporte de blocks dinámicos y tolerancia a fallos en strings JSON.
 */
export function normalizeNota(raw: any): NotaRecord {
  if (!raw || typeof raw !== 'object') {
    const now = new Date().toISOString();
    return {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `not_${Date.now()}`,
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: 'NOT-00000',
      titulo: 'Nota sin título',
      contenido_markdown: '',
      tipo_nota: 'TEXTO',
      checklists_json: [],
      color_tema: 'default',
      es_fijada: false,
      block_nombre: undefined,
      adjuntos_drive_json: [],
      enlaces_entidades_json: [],
      etiquetas: [],
      created_at: now,
      updated_at: now,
      version: 1,
      sync_status: 'synced'
    };
  }

  // Deserializador seguro de arrays
  const parseArray = <T>(val: any): T[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Checklists
  const rawChecklists = parseArray<any>(
    getProp(raw, 'checklists_json', 'Checklists_JSON', 'checklistsJson', 'Checklist', 'checklist')
  );
  const checklists_json: ChecklistItem[] = rawChecklists.map((c, idx) => ({
    id: String(c.id || `chk_${idx + 1}`),
    texto: String(c.texto || c.text || c.nombre || '').trim(),
    completado: Boolean(c.completado || c.completed || c.done)
  }));

  // Wishlist Meta
  let rawWishlist = getProp(raw, 'wishlist_json', 'Wishlist_JSON', 'wishlistJson', 'WishlistMeta', 'wishlistMeta');
  if (typeof rawWishlist === 'string' && rawWishlist.trim().startsWith('{')) {
    try {
      rawWishlist = JSON.parse(rawWishlist);
    } catch {
      rawWishlist = undefined;
    }
  }

  let wishlist_json: WishlistMeta | undefined = undefined;
  if (rawWishlist && typeof rawWishlist === 'object') {
    const costoEstimado = Number(
      rawWishlist.costoEstimado ?? rawWishlist.costo_estimado ?? rawWishlist.Costo_Estimado ?? 0
    );
    const montoRealGastado = Number(
      rawWishlist.montoRealGastado ?? rawWishlist.monto_real_gastado ?? rawWishlist.Monto_Real_Gastado ?? 0
    );
    const tienePropiedadesRelevantes =
      costoEstimado > 0 ||
      montoRealGastado > 0 ||
      Boolean(rawWishlist.urlReferencia || rawWishlist.enlaceReferencia) ||
      Boolean(rawWishlist.estado || rawWishlist.estadoDeseo);

    if (tienePropiedadesRelevantes) {
      wishlist_json = {
        costoEstimado: isNaN(costoEstimado) ? 0 : costoEstimado,
        montoRealGastado: isNaN(montoRealGastado) ? 0 : montoRealGastado,
        moneda: (rawWishlist.moneda === 'USD' ? 'USD' : 'PEN') as 'PEN' | 'USD',
        prioridad: String(rawWishlist.prioridad || rawWishlist.nivelDeseo || 'MEDIA').toUpperCase() as any,
        comprado: Boolean(rawWishlist.comprado || rawWishlist.comprada || (montoRealGastado > 0 && montoRealGastado >= costoEstimado)),
        urlReferencia: rawWishlist.urlReferencia || rawWishlist.enlaceReferencia || rawWishlist.url_referencia || '',
        tienda: rawWishlist.tienda || '',
        estado: rawWishlist.estado || rawWishlist.estadoDeseo || 'DESEADO',
        estadoDeseo: rawWishlist.estadoDeseo || rawWishlist.estado || 'DESEADO'
      };
    }
  }

  // Adjuntos Drive
  const rawAdjuntos = parseArray<any>(
    getProp(raw, 'adjuntos_drive_json', 'Adjuntos_Drive_JSON', 'adjuntosDriveJson', 'Adjuntos', 'adjuntos')
  );
  const adjuntos_drive_json: AdjuntoDrive[] = rawAdjuntos.map((a, idx) => ({
    id: String(a.id || `adj_${idx + 1}`),
    nombre: String(a.nombre || a.name || 'Archivo Adjunto'),
    url: String(a.url || a.link || ''),
    mimeType: String(a.mimeType || a.tipo || 'application/octet-stream')
  }));

  // Enlaces a entidades
  const rawEnlaces = parseArray<any>(
    getProp(raw, 'enlaces_entidades_json', 'Enlaces_Entidades_JSON', 'enlacesEntidadesJson', 'Vinculos_JSON', 'Vinculos', 'vinculos')
  );
  const enlaces_entidades_json: VinculoEntidad[] = rawEnlaces
    .map((e): VinculoEntidad | null => {
      if (!e || typeof e !== 'object') return null;
      const rawTipo = String(e.tipo || 'PROYECTO').toUpperCase();
      const tipo = (['PROYECTO', 'HITO', 'TAREA', 'ACTIVIDAD', 'HABITO', 'GASTO', 'INGRESO', 'IDEA', 'FINANZAS'].includes(rawTipo)
        ? rawTipo
        : 'PROYECTO') as any;
      const codigo = String(e.codigo || e.code || '').trim();
      const titulo = String(e.titulo || e.title || e.nombre || codigo || 'Sin Título').trim();
      const id_entidad = e.id_entidad ? String(e.id_entidad) : undefined;
      return codigo ? { tipo, codigo, titulo, id_entidad } : null;
    })
    .filter((e): e is VinculoEntidad => e !== null);

  // Etiquetas
  let rawEtiquetas = getProp(raw, 'etiquetas', 'Etiquetas', 'etiquetasJson', 'Etiquetas_JSON', 'tags', 'Tags');
  if (typeof rawEtiquetas === 'string') {
    try {
      const parsed = JSON.parse(rawEtiquetas);
      rawEtiquetas = Array.isArray(parsed) ? parsed : rawEtiquetas.split(',');
    } catch {
      rawEtiquetas = rawEtiquetas.split(',');
    }
  }
  const etiquetas: string[] = parseArray<string>(rawEtiquetas)
    .map((t) => String(t).trim().toLowerCase().replace(/^#+/, ''))
    .filter((t) => t.length > 0);

  // Block / Cuaderno agrupador (usuario o inferencia limpia)
  let block_nombre: string | undefined = getProp(raw, 'block_nombre', 'Block_Nombre', 'cuaderno', 'categoria');
  if (typeof block_nombre === 'string') {
    block_nombre = block_nombre.trim() || undefined;
  }

  const nowIso = new Date().toISOString();
  const id = String(getProp(raw, 'id', 'ID_Nota', 'idNota', 'codigo_legado') ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `not_${Date.now()}`));
  const codigo_legado = String(getProp(raw, 'codigo_legado', 'ID_Nota', 'idNota') ?? 'NOT-00000');
  const titulo = String(getProp(raw, 'titulo', 'Titulo') ?? 'Nota sin título').trim() || 'Nota sin título';
  const contenido_markdown = String(getProp(raw, 'contenido_markdown', 'Contenido_Markdown', 'contenido', 'contenidoMarkdown') ?? '');
  const tipo_nota = String(getProp(raw, 'tipo_nota', 'Tipo_Nota', 'tipoNota') ?? 'TEXTO');
  const color_tema = String(getProp(raw, 'color_tema', 'Color_Tema', 'colorTema', 'color', 'Color') ?? 'default');
  const es_fijada = Boolean(getProp(raw, 'es_fijada', 'Es_Fijada', 'esFijada', 'fijada', 'Fijada'));
  const user_id = String(getProp(raw, 'user_id', 'user_Id', 'userId') ?? '00000000-0000-0000-0000-000000000001');
  const created_at = String(getProp(raw, 'created_at', 'Fecha_Creacion', 'fecha_creacion') ?? nowIso);
  const updated_at = String(getProp(raw, 'updated_at', 'Fecha_Actualizacion', 'fecha_actualizacion') ?? nowIso);
  const version = Number(getProp(raw, 'version', 'Version') ?? 1);
  const sync_status = (getProp(raw, 'sync_status', 'Sync_Status') ?? 'synced') as any;

  return {
    id,
    user_id,
    codigo_legado,
    titulo,
    contenido_markdown,
    tipo_nota,
    checklists_json,
    wishlist_json,
    color_tema,
    color: color_tema,
    es_fijada,
    fijada: es_fijada,
    block_nombre,
    adjuntos_drive_json,
    enlaces_entidades_json,
    etiquetas,
    created_at,
    updated_at,
    version,
    sync_status
  };
}

