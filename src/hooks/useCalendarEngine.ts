/**
 * ============================================================================
 * ARCHIVO: src/hooks/useCalendarEngine.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-01 (Motor Unificado de Calendario Maestro)
 * DESCRIPCIÓN: Hook reactivo que unifica Tareas, Actividades, Hábitos, Hitos WBS,
 *              Gastos e Ingresos desde Dexie acotado al rango visible, con
 *              proyección de recurrencias RFC-5545 y layout de solapamientos.
 * ============================================================================
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { syncManager } from '../services/syncManager';
import { completarActividadPersonalLocal } from '../services/habitosService';
import { crearTarea } from '../services/tareasService';
import { crearGasto } from '../services/gastosService';
import { crearIngreso } from '../services/ingresosService';
import {
  listarEventosExternosGoogleCalendar,
  obtenerEstadoConexionGoogleCalendar,
  obtenerTokenGoogleCalendar,
  sincronizarActividadCalendar,
  sincronizarTareaCalendar,
  suscribirEstadoGoogleCalendar,
  type GoogleCalendarExternalEvent
} from '../services/calendarSyncService';
import { esElementoArchivado, generarCodigoCorrelativoSeguro } from '../utils/entityNormalizer';
import { generateSafeUUID } from '../utils/uuidGenerator';
import {
  evaluarOcurrenciaEnFecha,
  normalizarFechaIso,
  normalizarHora24
} from '../utils/recurrenceEngine';
import { formatFechaIsoLocal } from '../utils/timeFormatters';
import { formatearMontoMoneda, sumarMinutosAHora } from './useDailySchedule';
import type {
  TareaRecord,
  ActividadPersonal,
  HitoWbsRecord,
  GastoRecord,
  IngresoRecord
} from '../types';

export type CalendarEntityType =
  | 'tarea'
  | 'actividad'
  | 'habito'
  | 'hito'
  | 'gasto'
  | 'ingreso'
  | 'externo_gcal';

export type CalendarViewMode = 'semana' | 'dia' | 'mes';

export type CalendarRawRef =
  | { kind: 'tarea'; record: TareaRecord }
  | { kind: 'actividad'; record: ActividadPersonal }
  | { kind: 'habito'; record: ActividadPersonal }
  | { kind: 'hito'; record: HitoWbsRecord }
  | { kind: 'gasto'; record: GastoRecord }
  | { kind: 'ingreso'; record: IngresoRecord }
  | { kind: 'externo_gcal'; record: GoogleCalendarExternalEvent };

export type GcalExternoEstado = 'idle' | 'loading' | 'connected' | 'disconnected';

export interface CargaDiariaInfo {
  horasComprometidas: number;
  capacidadHoras: number;
  porcentaje: number;
  nivel: 'normal' | 'alta' | 'sobrecarga';
}

export type QuickCreateCalendarParams =
  | {
      tipo: 'tarea';
      titulo: string;
      fecha: string;
      horaInicio: string;
      duracionMinutos: number;
    }
  | {
      tipo: 'actividad';
      titulo: string;
      fecha: string;
      horaInicio: string;
      duracionMinutos: number;
    }
  | {
      tipo: 'gasto';
      titulo: string;
      fecha: string;
      monto: number;
      moneda?: 'PEN' | 'USD' | 'EUR';
    }
  | {
      tipo: 'ingreso';
      titulo: string;
      fecha: string;
      monto: number;
      moneda?: 'PEN' | 'USD' | 'EUR';
    };

export interface TareaUndoSnapshot {
  fecha_programada?: string;
  hora_inicio?: string;
  horas_estimadas?: number;
  estado_tarea: TareaRecord['estado_tarea'];
  fecha_completado?: string;
}

export interface ActividadUndoSnapshot {
  fecha_programada: string;
  hora_inicio?: string;
  duracion_horas: number;
  estado: ActividadPersonal['estado'];
  racha_actual: number;
  ultima_fecha_completado?: string;
  proxima_fecha_programada?: string;
  historial_fechas?: string[];
}

export type CalendarUndoEntry =
  | {
      entidad: 'tarea';
      id: string;
      etiqueta: string;
      snapshot: TareaUndoSnapshot;
    }
  | {
      entidad: 'actividad' | 'habito';
      id: string;
      etiqueta: string;
      snapshot: ActividadUndoSnapshot;
    };

const MAX_UNDO_STACK = 20;

export interface CalendarEventItem {
  id: string;
  sourceId: string;
  entidad: CalendarEntityType;
  codigoLegado: string;
  titulo: string;
  subtitulo?: string;
  fecha: string; // YYYY-MM-DD
  horaInicio?: string; // HH:mm
  horaFin?: string; // HH:mm
  duracionMinutos?: number;
  allDay: boolean;
  completado: boolean;
  prioridad?: string;
  estado?: string;
  agendadoCalendar?: boolean;
  rawRef: CalendarRawRef;
}

export interface PositionedCalendarEvent extends CalendarEventItem {
  startMinutes: number;
  endMinutes: number;
  columnIndex: number;
  totalColumns: number;
}

export interface VisibleDateRange {
  inicioIso: string;
  finIso: string;
  fechas: string[];
}

export type CalendarEntityFilters = Record<CalendarEntityType, boolean>;

export const DEFAULT_ENTITY_FILTERS: CalendarEntityFilters = {
  tarea: true,
  actividad: true,
  habito: true,
  hito: true,
  gasto: true,
  ingreso: true,
  externo_gcal: true
};

/**
 * Crea una fecha local al mediodía (12:00) para evitar desfases DST/UTC.
 */
export function crearFechaMediodia(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}

/**
 * Obtiene el lunes de la semana correspondiente a `fecha`.
 */
export function obtenerLunesDeSemana(fecha: Date): Date {
  const base = crearFechaMediodia(fecha);
  const diaSemana = base.getDay(); // 0 = Domingo, 1 = Lunes, ...
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana;
  base.setDate(base.getDate() + offset);
  return base;
}

/**
 * Calcula el rango de fechas ISO visibles para la vista actual (Día, Semana o Mes).
 */
export function obtenerRangoVisible(
  fechaAncla: Date,
  vista: CalendarViewMode
): VisibleDateRange {
  const base = crearFechaMediodia(fechaAncla);

  if (vista === 'dia') {
    const iso = formatFechaIsoLocal(base);
    return { inicioIso: iso, finIso: iso, fechas: [iso] };
  }

  if (vista === 'semana') {
    const lunes = obtenerLunesDeSemana(base);
    const fechas: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      fechas.push(formatFechaIsoLocal(d));
    }
    return {
      inicioIso: fechas[0],
      finIso: fechas[fechas.length - 1],
      fechas
    };
  }

  // Vista Mes: matriz completa de lunes a domingo cubriendo todo el mes
  const primerDiaMes = new Date(base.getFullYear(), base.getMonth(), 1, 12, 0, 0);
  const ultimoDiaMes = new Date(base.getFullYear(), base.getMonth() + 1, 0, 12, 0, 0);
  const inicioGrid = obtenerLunesDeSemana(primerDiaMes);
  const finGridBase = obtenerLunesDeSemana(ultimoDiaMes);
  finGridBase.setDate(finGridBase.getDate() + 6);

  const fechas: string[] = [];
  const cursor = new Date(inicioGrid);
  while (cursor <= finGridBase) {
    fechas.push(formatFechaIsoLocal(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    inicioIso: fechas[0],
    finIso: fechas[fechas.length - 1],
    fechas
  };
}

/**
 * Convierte 'HH:mm' a minutos desde las 00:00.
 */
export function horaAMinutos(hora?: string): number {
  if (!hora || !hora.includes(':')) return 8 * 60;
  const [hStr, mStr] = hora.split(':');
  const h = Math.min(23, Math.max(0, parseInt(hStr, 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0));
  return h * 60 + m;
}

/**
 * Valida si una cadena de hora contiene un horario explícito HH:mm.
 */
function tieneHoraExplicita(raw?: string | null): boolean {
  if (!raw) return false;
  return /^\d{1,2}:\d{2}/.test(String(raw).trim());
}

/**
 * Ajusta una cantidad de minutos al múltiplo de 15 minutos más cercano dentro de un rango.
 */
export function snapMinutos15(
  minutos: number,
  minClamp: number = 5 * 60,
  maxClamp: number = 23 * 60 + 45
): number {
  const snapped = Math.round(minutos / 15) * 15;
  return Math.min(maxClamp, Math.max(minClamp, snapped));
}

/**
 * Convierte minutos desde las 00:00 a formato 'HH:mm'.
 */
export function minutosAHoraStr(minutos: number): string {
  const clamped = Math.min(23 * 60 + 59, Math.max(0, Math.round(minutos)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calcula un rango horario reprogramado con snap de 15 minutos y duración mínima de 15 min.
 */
export function calcularRangoReprogramado(
  inicioMinutos: number,
  duracionMinutos: number
): {
  inicioMin: number;
  finMin: number;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  horasDecimal: number;
} {
  const inicioSnapped = snapMinutos15(inicioMinutos, 0, 23 * 60 + 45);
  const durSnapped = Math.max(15, Math.round(duracionMinutos / 15) * 15);
  const finMin = Math.min(24 * 60, inicioSnapped + durSnapped);
  const durReal = Math.max(15, finMin - inicioSnapped);
  const horasDecimal = Math.round((durReal / 60) * 100) / 100;

  return {
    inicioMin: inicioSnapped,
    finMin,
    horaInicio: minutosAHoraStr(inicioSnapped),
    horaFin: finMin >= 24 * 60 ? '23:59' : minutosAHoraStr(finMin),
    duracionMinutos: durReal,
    horasDecimal
  };
}

/**
 * Peso numérico de prioridad para ordenar el panel "Por Agendar".
 */
export function pesoPrioridadTarea(prioridad?: string): number {
  const p = (prioridad || '').toUpperCase();
  if (p.includes('Q1') || p.includes('P1') || p.includes('CRITIC') || p.includes('URGENTE')) return 1;
  if (p.includes('Q2') || p.includes('P2') || p.includes('ALTA')) return 2;
  if (p.includes('Q3') || p.includes('P3') || p.includes('MEDIA')) return 3;
  return 4;
}

/**
 * Clasifica las tareas activas en dos grupos mutuamente excluyentes para el panel "Por Agendar":
 * 1. `tareasVencidasReprogramar`: pendientes/en progreso con fecha programada < `hoyIso`.
 * 2. `tareasSinHora`: pendientes/en progreso sin `hora_inicio` que no están vencidas.
 */
export function clasificarTareasBacklog(
  tareas: TareaRecord[],
  hoyIso: string
): {
  tareasVencidasReprogramar: TareaRecord[];
  tareasSinHora: TareaRecord[];
} {
  const vencidas: TareaRecord[] = [];
  const sinHora: TareaRecord[] = [];

  for (const t of tareas) {
    if (
      t.estado_tarea === '04_Completado' ||
      t.estado_tarea === '05_Archivado' ||
      esElementoArchivado(t, 'tareas')
    ) {
      continue;
    }

    const fIso = normalizarFechaIso(t.fecha_programada);
    if (fIso && fIso < hoyIso) {
      vencidas.push(t);
    } else if (!tieneHoraExplicita(t.hora_inicio)) {
      sinHora.push(t);
    }
  }

  const ordenar = (a: TareaRecord, b: TareaRecord): number => {
    const pA = pesoPrioridadTarea(a.prioridad_eisenhower || a.Prioridad_Eisenhower);
    const pB = pesoPrioridadTarea(b.prioridad_eisenhower || b.Prioridad_Eisenhower);
    if (pA !== pB) return pA - pB;

    const fA = normalizarFechaIso(a.fecha_programada) || '9999-12-31';
    const fB = normalizarFechaIso(b.fecha_programada) || '9999-12-31';
    return fA.localeCompare(fB);
  };

  vencidas.sort(ordenar);
  sinHora.sort(ordenar);

  return {
    tareasVencidasReprogramar: vencidas,
    tareasSinHora: sinHora
  };
}

/**
 * Limpia `hora_inicio` de una tarea en Dexie para devolverla al panel "Por Agendar"
 * y dispara la sincronización bidireccional en segundo plano.
 */
export async function devolverTareaABacklogLocal(tareaId: string): Promise<boolean> {
  if (!tareaId) return false;
  try {
    const nowIso = new Date().toISOString();
    await db.tareas.update(tareaId, {
      hora_inicio: '',
      updated_at: nowIso,
      sync_status: 'pending'
    });
    void syncManager.sincronizarTodo().catch(() => {});
    return true;
  } catch (err) {
    console.error('[useCalendarEngine] Error al devolver tarea a Por Agendar:', err);
    return false;
  }
}

/**
 * Propaga silenciosamente cambios de fecha/hora/duración a Google Calendar API v3
 * solo si la entidad está vinculada (`agendado_calendar === 'Sí'` o `id_evento_calendar`)
 * y existe token OAuth vigente (cero popups, degradación silenciosa offline).
 */
export async function propagarCambioAGoogleCalendar(
  entidad: 'tarea' | 'actividad' | 'habito',
  registro?: TareaRecord | ActividadPersonal | null
): Promise<void> {
  if (!registro) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  const tieneVinculoGcal =
    registro.agendado_calendar === 'Sí' ||
    Boolean(registro.id_evento_calendar && registro.id_evento_calendar.trim() !== '');
  if (!tieneVinculoGcal) return;

  try {
    const token = await obtenerTokenGoogleCalendar();
    if (!token) return;

    if (entidad === 'tarea') {
      await sincronizarTareaCalendar(registro as TareaRecord, 'UPSERT');
    } else {
      await sincronizarActividadCalendar(registro as ActividadPersonal, 'UPSERT');
    }
  } catch {
    // Degradación silenciosa: nunca bloquear la grilla ni mostrar errores intrusivos
  }
}

/**
 * Restaura en Dexie el snapshot previo de un `CalendarUndoEntry`, marca `sync_status: 'pending'`,
 * dispara sincronización multi-dispositivo y propaga la reversión a Google Calendar.
 */
export async function aplicarUndoEntryLocal(entry: CalendarUndoEntry): Promise<boolean> {
  const nowIso = new Date().toISOString();

  try {
    if (entry.entidad === 'tarea') {
      await db.tareas.update(entry.id, {
        fecha_programada: entry.snapshot.fecha_programada,
        hora_inicio: entry.snapshot.hora_inicio,
        horas_estimadas: entry.snapshot.horas_estimadas,
        estado_tarea: entry.snapshot.estado_tarea,
        fecha_completado: entry.snapshot.fecha_completado,
        updated_at: nowIso,
        sync_status: 'pending'
      });

      const tareaRestaurada = await db.tareas.get(entry.id);
      if (tareaRestaurada) {
        void propagarCambioAGoogleCalendar('tarea', tareaRestaurada);
      }
    } else {
      await db.actividades_personales.update(entry.id, {
        fecha_programada: entry.snapshot.fecha_programada,
        hora_inicio: entry.snapshot.hora_inicio,
        duracion_horas: entry.snapshot.duracion_horas,
        estado: entry.snapshot.estado,
        racha_actual: entry.snapshot.racha_actual,
        ultima_fecha_completado: entry.snapshot.ultima_fecha_completado,
        proxima_fecha_programada: entry.snapshot.proxima_fecha_programada,
        historial_fechas: entry.snapshot.historial_fechas,
        updated_at: nowIso,
        sync_status: 'pending'
      });

      const actRestaurada = await db.actividades_personales.get(entry.id);
      if (actRestaurada) {
        void propagarCambioAGoogleCalendar(entry.entidad, actRestaurada);
      }
    }

    void syncManager.sincronizarTodo().catch(() => {});
    return true;
  } catch (err) {
    console.error('[useCalendarEngine] Error al restaurar snapshot Undo:', err);
    return false;
  }
}

/**
 * Calcula la carga horaria diaria comprometida vs capacidad base (default 8h)
 * sumando bloques horarios activos (no all-day) de Tareas, Actividades, Hábitos y GCal externo.
 */
export function calcularCargaDiariaPorFecha(
  fechas: string[],
  eventos: CalendarEventItem[],
  capacidadHoras: number = 8
): Record<string, CargaDiariaInfo> {
  const minutosPorFecha: Record<string, number> = {};
  for (const f of fechas) {
    minutosPorFecha[f] = 0;
  }

  for (const ev of eventos) {
    if (ev.allDay) continue;
    if (
      ev.entidad !== 'tarea' &&
      ev.entidad !== 'actividad' &&
      ev.entidad !== 'habito' &&
      ev.entidad !== 'externo_gcal'
    ) {
      continue;
    }
    if (minutosPorFecha[ev.fecha] === undefined) continue;
    minutosPorFecha[ev.fecha] += Math.max(0, ev.duracionMinutos ?? 60);
  }

  const capSegura = Math.max(1, capacidadHoras);
  const resultado: Record<string, CargaDiariaInfo> = {};

  for (const f of fechas) {
    const horasComprometidas = Math.round(((minutosPorFecha[f] || 0) / 60) * 10) / 10;
    const porcentaje = Math.round((horasComprometidas / capSegura) * 100);
    const nivel: CargaDiariaInfo['nivel'] =
      porcentaje > 100 ? 'sobrecarga' : porcentaje > 75 ? 'alta' : 'normal';

    resultado[f] = {
      horasComprometidas,
      capacidadHoras: capSegura,
      porcentaje,
      nivel
    };
  }

  return resultado;
}

/**
 * Calcula columnas y anchos para eventos horarios solapados dentro de un mismo día.
 * Algoritmo determinista por clusters de solapamiento.
 */
export function calcularLayoutSolapados(
  eventosDia: CalendarEventItem[]
): PositionedCalendarEvent[] {
  const timed = eventosDia
    .filter((ev) => !ev.allDay && ev.horaInicio)
    .map((ev) => {
      const startMinutes = horaAMinutos(ev.horaInicio);
      const dur = Math.max(25, ev.duracionMinutos ?? 60);
      const endMinutes = Math.min(24 * 60, startMinutes + dur);
      return { ev, startMinutes, endMinutes };
    })
    .sort((a, b) => {
      if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
      return b.endMinutes - a.endMinutes;
    });

  const resultado: PositionedCalendarEvent[] = [];
  let cluster: Array<{ ev: CalendarEventItem; startMinutes: number; endMinutes: number }> = [];
  let clusterEnd = -1;

  const procesarCluster = (
    items: Array<{ ev: CalendarEventItem; startMinutes: number; endMinutes: number }>
  ) => {
    if (items.length === 0) return;
    const columnasFin: number[] = [];
    const asignados: Array<{
      ev: CalendarEventItem;
      startMinutes: number;
      endMinutes: number;
      columnIndex: number;
    }> = [];

    for (const item of items) {
      let colIdx = -1;
      for (let c = 0; c < columnasFin.length; c++) {
        if (columnasFin[c] <= item.startMinutes) {
          colIdx = c;
          break;
        }
      }
      if (colIdx === -1) {
        colIdx = columnasFin.length;
        columnasFin.push(item.endMinutes);
      } else {
        columnasFin[colIdx] = item.endMinutes;
      }
      asignados.push({ ...item, columnIndex: colIdx });
    }

    const totalColumns = Math.max(1, columnasFin.length);
    for (const a of asignados) {
      resultado.push({
        ...a.ev,
        startMinutes: a.startMinutes,
        endMinutes: a.endMinutes,
        columnIndex: a.columnIndex,
        totalColumns
      });
    }
  };

  for (const item of timed) {
    if (cluster.length === 0) {
      cluster.push(item);
      clusterEnd = item.endMinutes;
    } else if (item.startMinutes < clusterEnd) {
      cluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMinutes);
    } else {
      procesarCluster(cluster);
      cluster = [item];
      clusterEnd = item.endMinutes;
    }
  }
  procesarCluster(cluster);

  return resultado;
}

export function useCalendarEngine(vistaInicial: CalendarViewMode = 'semana') {
  const [fechaAncla, setFechaAncla] = useState<Date>(() => crearFechaMediodia(new Date()));
  const [vista, setVista] = useState<CalendarViewMode>(vistaInicial);
  const [filtrosEntidad, setFiltrosEntidad] = useState<CalendarEntityFilters>(DEFAULT_ENTITY_FILTERS);

  const rango = useMemo(() => obtenerRangoVisible(fechaAncla, vista), [fechaAncla, vista]);
  const { inicioIso, finIso, fechas } = rango;

  // Controles de navegación temporal
  const irAHoy = useCallback(() => {
    setFechaAncla(crearFechaMediodia(new Date()));
  }, []);

  const irAnterior = useCallback(() => {
    setFechaAncla((prev) => {
      const next = crearFechaMediodia(prev);
      if (vista === 'dia') {
        next.setDate(next.getDate() - 1);
      } else if (vista === 'semana') {
        next.setDate(next.getDate() - 7);
      } else {
        next.setMonth(next.getMonth() - 1);
      }
      return next;
    });
  }, [vista]);

  const irSiguiente = useCallback(() => {
    setFechaAncla((prev) => {
      const next = crearFechaMediodia(prev);
      if (vista === 'dia') {
        next.setDate(next.getDate() + 1);
      } else if (vista === 'semana') {
        next.setDate(next.getDate() + 7);
      } else {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    });
  }, [vista]);

  const seleccionarFecha = useCallback((fechaIso: string) => {
    const norm = normalizarFechaIso(fechaIso);
    if (!norm) return;
    const [y, m, d] = norm.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      setFechaAncla(new Date(y, m - 1, d, 12, 0, 0));
    }
  }, []);

  const toggleFiltroEntidad = useCallback((entidad: CalendarEntityType) => {
    setFiltrosEntidad((prev) => ({ ...prev, [entidad]: !prev[entidad] }));
  }, []);

  const resetFiltros = useCallback(() => {
    setFiltrosEntidad(DEFAULT_ENTITY_FILTERS);
  }, []);

  // ============================================================================
  // CONSULTAS REACTIVAS DEXIE ACOTADAS AL RANGO VISIBLE [inicioIso, finIso]
  // ============================================================================
  const rangoFinUpper = `${finIso}\uffff`;

  const tareasRango = useLiveQuery(
    () =>
      db.tareas
        .where('fecha_programada')
        .between(inicioIso, rangoFinUpper, true, true)
        .filter((t) => !esElementoArchivado(t, 'tareas'))
        .toArray(),
    [inicioIso, rangoFinUpper],
    []
  );

  // Las actividades recurrentes pueden tener fecha_programada anterior al rango visible
  const actividadesActivas = useLiveQuery(
    () =>
      db.actividades_personales
        .where('estado')
        .notEqual('05_Archivado')
        .filter((a) => !esElementoArchivado(a, 'actividades'))
        .toArray(),
    [],
    []
  );

  const logsHabitosRango = useLiveQuery(
    () =>
      db.habito_cumplimiento_logs
        .where('fecha_registro')
        .between(inicioIso, rangoFinUpper, true, true)
        .toArray(),
    [inicioIso, rangoFinUpper],
    []
  );

  const hitosRango = useLiveQuery(
    () =>
      db.hitos_wbs
        .where('fecha_limite')
        .between(inicioIso, rangoFinUpper, true, true)
        .toArray(),
    [inicioIso, rangoFinUpper],
    []
  );

  const gastosRango = useLiveQuery(
    () =>
      db.gastos
        .where('fecha_gasto')
        .between(inicioIso, rangoFinUpper, true, true)
        .filter((g) => !esElementoArchivado(g, 'gastos'))
        .toArray(),
    [inicioIso, rangoFinUpper],
    []
  );

  const ingresosRango = useLiveQuery(
    () =>
      db.ingresos
        .where('fecha_ingreso')
        .between(inicioIso, rangoFinUpper, true, true)
        .filter((i) => !esElementoArchivado(i, 'ingresos'))
        .toArray(),
    [inicioIso, rangoFinUpper],
    []
  );

  // Tareas activas para clasificar el panel "Por Agendar" en Vencidas vs Sin hora (REQ-UX-CAL-05)
  const tareasActivasBacklogRaw = useLiveQuery(
    () =>
      db.tareas
        .filter(
          (t) =>
            t.estado_tarea !== '04_Completado' &&
            t.estado_tarea !== '05_Archivado' &&
            !esElementoArchivado(t, 'tareas')
        )
        .toArray(),
    [],
    []
  );

  const hoyIsoActual = formatFechaIsoLocal(new Date());

  const { tareasVencidasReprogramar, tareasSinHora } = useMemo(
    () => clasificarTareasBacklog(tareasActivasBacklogRaw, hoyIsoActual),
    [tareasActivasBacklogRaw, hoyIsoActual]
  );

  const tareasPorAgendar = useMemo<TareaRecord[]>(
    () => [...tareasVencidasReprogramar, ...tareasSinHora],
    [tareasVencidasReprogramar, tareasSinHora]
  );

  // ============================================================================
  // LECTURA NO BLOQUEANTE DE EVENTOS EXTERNOS GOOGLE CALENDAR (REQ-FEAT-CAL-03 / CAL-06)
  // ============================================================================
  const [eventosExternosGcal, setEventosExternosGcal] = useState<GoogleCalendarExternalEvent[]>([]);
  const [gcalExternoEstado, setGcalExternoEstado] = useState<GcalExternoEstado>('idle');
  const cacheExternosRef = useRef<Map<string, GoogleCalendarExternalEvent[]>>(new Map());
  const inFlightRangeRef = useRef<string | null>(null);
  const manualRefreshPendingRef = useRef<boolean>(false);
  const [refreshTickGcal, setRefreshTickGcal] = useState(0);

  const recargarEventosExternos = useCallback(() => {
    const key = `${inicioIso}::${finIso}`;
    cacheExternosRef.current.delete(key);
    inFlightRangeRef.current = null;
    manualRefreshPendingRef.current = true;
    setRefreshTickGcal((prev) => prev + 1);
  }, [inicioIso, finIso]);

  useEffect(() => {
    return suscribirEstadoGoogleCalendar((estado) => {
      if (estado.conectado) {
        cacheExternosRef.current.clear();
        inFlightRangeRef.current = null;
        setRefreshTickGcal((prev) => prev + 1);
      } else {
        cacheExternosRef.current.clear();
        inFlightRangeRef.current = null;
        setEventosExternosGcal([]);
        setGcalExternoEstado('disconnected');
      }
    });
  }, []);

  useEffect(() => {
    let cancelado = false;
    const rangeKey = `${inicioIso}::${finIso}`;
    const esManual = manualRefreshPendingRef.current;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      manualRefreshPendingRef.current = false;
      setGcalExternoEstado('disconnected');
      return;
    }

    // Evitar disparos duplicados concurrentes del mismo rango
    if (!esManual && inFlightRangeRef.current === rangeKey) {
      return;
    }

    const cached = cacheExternosRef.current.get(rangeKey);
    if (cached && !esManual) {
      setEventosExternosGcal(cached);
      setGcalExternoEstado('connected');
      return;
    }

    // Si no hay sesión activa y no es refresco manual explícito, no spamear requests
    const estadoPrevio = obtenerEstadoConexionGoogleCalendar();
    if (!estadoPrevio.conectado && !esManual) {
      setEventosExternosGcal([]);
      setGcalExternoEstado('disconnected');
      return;
    }

    manualRefreshPendingRef.current = false;
    inFlightRangeRef.current = rangeKey;
    setGcalExternoEstado('loading');

    void listarEventosExternosGoogleCalendar(inicioIso, finIso)
      .then((items) => {
        if (cancelado) return;
        const estadoAuth = obtenerEstadoConexionGoogleCalendar();
        if (estadoAuth.conectado) {
          cacheExternosRef.current.set(rangeKey, items);
          setEventosExternosGcal(items);
          setGcalExternoEstado('connected');
        } else {
          setEventosExternosGcal([]);
          setGcalExternoEstado('disconnected');
        }
      })
      .finally(() => {
        if (inFlightRangeRef.current === rangeKey) {
          inFlightRangeRef.current = null;
        }
      });

    return () => {
      cancelado = true;
    };
  }, [inicioIso, finIso, refreshTickGcal]);

  // Mapa rápido de logs de cumplimiento por habito_id + fecha_registro
  const mapaLogsCumplimiento = useMemo(() => {
    const set = new Set<string>();
    for (const log of logsHabitosRango) {
      if (log.completado && log.habito_id && log.fecha_registro) {
        set.add(`${log.habito_id}::${normalizarFechaIso(log.fecha_registro)}`);
      }
    }
    return set;
  }, [logsHabitosRango]);

  // ============================================================================
  // NORMALIZACIÓN Y UNIFICACIÓN DE EVENTOS EN CalendarEventItem[]
  // ============================================================================
  const todosEventos = useMemo<CalendarEventItem[]>(() => {
    const items: CalendarEventItem[] = [];
    const fechasSet = new Set(fechas);

    // 1. TAREAS (con hora -> grilla horaria; sin hora -> franja All-Day)
    for (const t of tareasRango) {
      const fIso = normalizarFechaIso(t.fecha_programada);
      if (!fIso || !fechasSet.has(fIso)) continue;
      const conHora = tieneHoraExplicita(t.hora_inicio);
      const horaInicio = conHora ? normalizarHora24(t.hora_inicio, '09:00') : undefined;
      const durMin = Math.max(30, Math.round((Number(t.horas_estimadas) || 1) * 60));
      const horaFin = horaInicio ? sumarMinutosAHora(horaInicio, durMin) : undefined;
      const completado = t.estado_tarea === '04_Completado';

      items.push({
        id: `tarea:${t.id}:${fIso}`,
        sourceId: t.id,
        entidad: 'tarea',
        codigoLegado: t.codigo_legado || 'TAR',
        titulo: t.nombre_tarea_actividad || t.Nombre_Tarea_Actividad || 'Tarea sin título',
        subtitulo: t.proyecto_codigo ? `Proyecto ${t.proyecto_codigo}` : 'Tarea Kanban',
        fecha: fIso,
        horaInicio,
        horaFin,
        duracionMinutos: conHora ? durMin : undefined,
        allDay: !conHora,
        completado,
        prioridad: t.prioridad_eisenhower || t.Prioridad_Eisenhower,
        estado: t.estado_tarea,
        agendadoCalendar: t.agendado_calendar === 'Sí',
        rawRef: { kind: 'tarea', record: t }
      });
    }

    // 2. ACTIVIDADES PERSONALES Y HÁBITOS (proyectados por recurrencia RFC-5545)
    for (const act of actividadesActivas) {
      const esHabito =
        act.tipo_compromiso === 'HABITUAL' ||
        (Boolean(act.frecuencia_ciclo) && act.frecuencia_ciclo !== 'NINGUNA');
      const entidad: 'habito' | 'actividad' = esHabito ? 'habito' : 'actividad';
      const conHora = tieneHoraExplicita(act.hora_inicio);
      const horaInicio = conHora ? normalizarHora24(act.hora_inicio, '08:00') : undefined;
      const durMin = Math.max(30, Math.round((Number(act.duracion_horas) || 0.5) * 60));
      const horaFin = horaInicio ? sumarMinutosAHora(horaInicio, durMin) : undefined;
      const historialSet = new Set(
        Array.isArray(act.historial_fechas)
          ? act.historial_fechas.map((f) => normalizarFechaIso(f))
          : []
      );
      const ultimaComp = normalizarFechaIso(act.ultima_fecha_completado);

      for (const fechaIso of fechas) {
        if (!evaluarOcurrenciaEnFecha(act, fechaIso)) continue;

        const completadoEnFecha = esHabito
          ? mapaLogsCumplimiento.has(`${act.id}::${fechaIso}`) ||
            historialSet.has(fechaIso) ||
            ultimaComp === fechaIso
          : act.estado === '04_Completado';

        items.push({
          id: `${entidad}:${act.id}:${fechaIso}`,
          sourceId: act.id,
          entidad,
          codigoLegado: act.codigo_legado || 'ACT',
          titulo: act.nombre_actividad || 'Actividad',
          subtitulo: esHabito
            ? `Hábito · Racha ${act.racha_actual || 0}d`
            : act.categoria_vida?.replace(/_/g, ' ') || 'Actividad Personal',
          fecha: fechaIso,
          horaInicio,
          horaFin,
          duracionMinutos: conHora ? durMin : undefined,
          allDay: !conHora,
          completado: completadoEnFecha,
          prioridad: undefined,
          estado: completadoEnFecha ? '04_Completado' : act.estado,
          agendadoCalendar: act.agendado_calendar === 'Sí',
          rawRef: esHabito
            ? { kind: 'habito', record: act }
            : { kind: 'actividad', record: act }
        });
      }
    }

    // 3. HITOS WBS (Franja All-Day / Hitos)
    for (const h of hitosRango) {
      const fIso = normalizarFechaIso(h.fecha_limite || h.fecha_limite_plan);
      if (!fIso || !fechasSet.has(fIso)) continue;
      const completado = h.estado === '03_Completado';
      items.push({
        id: `hito:${h.id}:${fIso}`,
        sourceId: h.id,
        entidad: 'hito',
        codigoLegado: h.codigo_legado || h.wbs_code || 'HIT',
        titulo: h.nombre_elemento || h.nombre_hito || h.Nombre_Elemento || 'Hito WBS',
        subtitulo: h.proyecto_codigo
          ? `WBS ${h.wbs_code || ''} · ${h.proyecto_codigo}`.trim()
          : `WBS ${h.wbs_code || 'Hito'}`,
        fecha: fIso,
        allDay: true,
        completado,
        estado: h.estado,
        rawRef: { kind: 'hito', record: h }
      });
    }

    // 4. GASTOS (Vencimientos financieros -> All-Day)
    for (const g of gastosRango) {
      const fIso = normalizarFechaIso(g.fecha_gasto);
      if (!fIso || !fechasSet.has(fIso)) continue;
      const completado = g.estado_pago === 'PAGADO';
      const montoTxt = formatearMontoMoneda(
        Number(g.monto_original ?? g.monto_pen ?? 0),
        g.moneda_original || 'PEN'
      );
      items.push({
        id: `gasto:${g.id}:${fIso}`,
        sourceId: g.id,
        entidad: 'gasto',
        codigoLegado: g.codigo_legado || 'GAS',
        titulo: g.descripcion_gasto || g.categoria_gasto || 'Gasto programado',
        subtitulo: `Egreso · ${montoTxt}`,
        fecha: fIso,
        allDay: true,
        completado,
        estado: g.estado_pago,
        agendadoCalendar: g.agendado_calendar === 'Sí' || Boolean(g.agendar_calendar),
        rawRef: { kind: 'gasto', record: g }
      });
    }

    // 5. INGRESOS (Cobros financieros -> All-Day)
    for (const ing of ingresosRango) {
      const fIso = normalizarFechaIso(ing.fecha_ingreso);
      if (!fIso || !fechasSet.has(fIso)) continue;
      const completado = ing.estado_cobro === 'COBRADO';
      const montoTxt = formatearMontoMoneda(
        Number(ing.monto_original ?? ing.monto_pen ?? 0),
        ing.moneda_original || 'PEN'
      );
      items.push({
        id: `ingreso:${ing.id}:${fIso}`,
        sourceId: ing.id,
        entidad: 'ingreso',
        codigoLegado: ing.codigo_legado || 'ING',
        titulo: ing.descripcion_ingreso || ing.categoria_ingreso || 'Ingreso programado',
        subtitulo: `Ingreso · ${montoTxt}`,
        fecha: fIso,
        allDay: true,
        completado,
        estado: ing.estado_cobro,
        agendadoCalendar: ing.agendado_calendar === 'Sí' || Boolean(ing.agendar_calendar),
        rawRef: { kind: 'ingreso', record: ing }
      });
    }

    // 6. EVENTOS EXTERNOS GOOGLE CALENDAR (Solo-Lectura deduplicado)
    for (const ext of eventosExternosGcal) {
      if (!ext.fecha || !fechasSet.has(ext.fecha)) continue;
      items.push({
        id: `externo_gcal:${ext.id}:${ext.fecha}`,
        sourceId: ext.id,
        entidad: 'externo_gcal',
        codigoLegado: 'GCAL',
        titulo: ext.summary,
        subtitulo: ext.location || 'Google Calendar',
        fecha: ext.fecha,
        horaInicio: ext.horaInicio,
        horaFin: ext.horaFin,
        duracionMinutos: ext.duracionMinutos,
        allDay: ext.allDay,
        completado: false,
        estado: ext.status || 'confirmed',
        agendadoCalendar: true,
        rawRef: { kind: 'externo_gcal', record: ext }
      });
    }

    return items;
  }, [
    fechas,
    tareasRango,
    actividadesActivas,
    hitosRango,
    gastosRango,
    ingresosRango,
    mapaLogsCumplimiento,
    eventosExternosGcal
  ]);

  // Aplicar filtros activos por tipo de entidad
  const eventosVisibles = useMemo(
    () => todosEventos.filter((ev) => filtrosEntidad[ev.entidad]),
    [todosEventos, filtrosEntidad]
  );

  // Carga diaria comprometida vs capacidad base (8h) (REQ-FEAT-CAL-03)
  const cargaDiariaPorFecha = useMemo(
    () => calcularCargaDiariaPorFecha(fechas, eventosVisibles, 8),
    [fechas, eventosVisibles]
  );

  // Agrupación por fecha para acceso O(1) en grillas (Semana, Día, Mes y Agenda Móvil)
  const eventosPorFecha = useMemo(() => {
    const mapa = new Map<
      string,
      { allDay: CalendarEventItem[]; timed: PositionedCalendarEvent[] }
    >();
    for (const f of fechas) {
      mapa.set(f, { allDay: [], timed: [] });
    }

    const timedPorDia = new Map<string, CalendarEventItem[]>();
    for (const ev of eventosVisibles) {
      const bucket = mapa.get(ev.fecha);
      if (!bucket) continue;
      if (ev.allDay) {
        bucket.allDay.push(ev);
      } else {
        const list = timedPorDia.get(ev.fecha) || [];
        list.push(ev);
        timedPorDia.set(ev.fecha, list);
      }
    }

    for (const [fechaIso, list] of timedPorDia.entries()) {
      const bucket = mapa.get(fechaIso);
      if (bucket) {
        bucket.timed = calcularLayoutSolapados(list);
      }
    }

    return mapa;
  }, [fechas, eventosVisibles]);

  // ============================================================================
  // STACK DE DESHACER (UNDO CTRL+Z, MÁXIMO 20 OPERACIONES) (REQ-FEAT-CAL-07)
  // ============================================================================
  const undoStackRef = useRef<CalendarUndoEntry[]>([]);
  const [undoStackSize, setUndoStackSize] = useState(0);

  const pushUndoEntry = useCallback((entry: CalendarUndoEntry) => {
    const next = [...undoStackRef.current.slice(-(MAX_UNDO_STACK - 1)), entry];
    undoStackRef.current = next;
    setUndoStackSize(next.length);
  }, []);

  const deshacerUltimaAccion = useCallback(async (): Promise<{
    ok: boolean;
    mensaje?: string;
  }> => {
    if (undoStackRef.current.length === 0) {
      return { ok: false };
    }
    const stackCopia = [...undoStackRef.current];
    const ultimo = stackCopia.pop();
    if (!ultimo) return { ok: false };

    undoStackRef.current = stackCopia;
    setUndoStackSize(stackCopia.length);

    const ok = await aplicarUndoEntryLocal(ultimo);
    return ok ? { ok: true, mensaje: ultimo.etiqueta } : { ok: false };
  }, []);

  // Toggle rápido de completado en Dexie + Undo + sincronización en segundo plano
  const toggleCompletarEvento = useCallback(
    async (item: CalendarEventItem): Promise<boolean> => {
      const nowIso = new Date().toISOString();
      const hoyIso = formatFechaIsoLocal(new Date());

      try {
        if (item.rawRef.kind === 'tarea') {
          const prevRec = (await db.tareas.get(item.sourceId)) ?? item.rawRef.record;
          pushUndoEntry({
            entidad: 'tarea',
            id: item.sourceId,
            etiqueta: `Estado de ${prevRec.codigo_legado || item.codigoLegado}`,
            snapshot: {
              fecha_programada: prevRec.fecha_programada,
              hora_inicio: prevRec.hora_inicio,
              horas_estimadas: prevRec.horas_estimadas,
              estado_tarea: prevRec.estado_tarea,
              fecha_completado: prevRec.fecha_completado
            }
          });

          const nuevoEstado = item.completado ? '02_Por_Hacer' : '04_Completado';
          await db.tareas.update(item.sourceId, {
            estado_tarea: nuevoEstado,
            fecha_completado: nuevoEstado === '04_Completado' ? hoyIso : undefined,
            updated_at: nowIso,
            sync_status: 'pending'
          });
        } else if (item.rawRef.kind === 'habito' || item.rawRef.kind === 'actividad') {
          const prevAct =
            (await db.actividades_personales.get(item.sourceId)) ?? item.rawRef.record;
          pushUndoEntry({
            entidad: item.rawRef.kind,
            id: item.sourceId,
            etiqueta: `Estado de ${prevAct.codigo_legado || item.codigoLegado}`,
            snapshot: {
              fecha_programada: prevAct.fecha_programada,
              hora_inicio: prevAct.hora_inicio,
              duracion_horas: prevAct.duracion_horas,
              estado: prevAct.estado,
              racha_actual: prevAct.racha_actual,
              ultima_fecha_completado: prevAct.ultima_fecha_completado,
              proxima_fecha_programada: prevAct.proxima_fecha_programada,
              historial_fechas: prevAct.historial_fechas ? [...prevAct.historial_fechas] : undefined
            }
          });

          await completarActividadPersonalLocal(item.rawRef.record, !item.completado);
        } else if (item.rawRef.kind === 'hito') {
          const nuevoEstado = item.completado ? '01_Pendiente' : '03_Completado';
          await db.hitos_wbs.update(item.sourceId, {
            estado: nuevoEstado,
            fecha_real_fin: nuevoEstado === '03_Completado' ? hoyIso : undefined,
            updated_at: nowIso,
            sync_status: 'pending'
          });
        } else if (item.rawRef.kind === 'gasto') {
          const nuevoEstado = item.completado ? 'PENDIENTE' : 'PAGADO';
          await db.gastos.update(item.sourceId, {
            estado_pago: nuevoEstado,
            fecha_ejecucion_real: nuevoEstado === 'PAGADO' ? hoyIso : undefined,
            updated_at: nowIso,
            sync_status: 'pending'
          });
        } else if (item.rawRef.kind === 'ingreso') {
          const nuevoEstado = item.completado ? 'PENDIENTE' : 'COBRADO';
          await db.ingresos.update(item.sourceId, {
            estado_cobro: nuevoEstado,
            fecha_ejecucion_real: nuevoEstado === 'COBRADO' ? hoyIso : undefined,
            updated_at: nowIso,
            sync_status: 'pending'
          });
        }

        void syncManager.sincronizarTodo().catch(() => {});
        return true;
      } catch (err) {
        console.error('[useCalendarEngine] Error al actualizar estado del evento:', err);
        return false;
      }
    },
    [pushUndoEntry]
  );

  // Reprogramación optimista en Dexie por Drag & Drop o Resize + Undo + Propagación GCal (REQ-FEAT-CAL-02 / CAL-07)
  const reprogramarEvento = useCallback(
    async (
      evento: CalendarEventItem,
      nuevaFecha: string,
      nuevaHoraInicio: string,
      nuevaDuracionMinutos?: number
    ): Promise<boolean> => {
      const fechaNorm = normalizarFechaIso(nuevaFecha);
      if (!fechaNorm) return false;

      const inicioMin = horaAMinutos(nuevaHoraInicio);
      const durBase = nuevaDuracionMinutos ?? evento.duracionMinutos ?? 60;
      const rangoCalc = calcularRangoReprogramado(inicioMin, durBase);
      const nowIso = new Date().toISOString();
      const esSoloResize =
        fechaNorm === evento.fecha && rangoCalc.horaInicio === evento.horaInicio;

      try {
        if (evento.rawRef.kind === 'tarea') {
          const prevRec = (await db.tareas.get(evento.sourceId)) ?? evento.rawRef.record;
          pushUndoEntry({
            entidad: 'tarea',
            id: evento.sourceId,
            etiqueta: `${esSoloResize ? 'Duración' : 'Reprogramación'} de ${prevRec.codigo_legado || evento.codigoLegado}`,
            snapshot: {
              fecha_programada: prevRec.fecha_programada,
              hora_inicio: prevRec.hora_inicio,
              horas_estimadas: prevRec.horas_estimadas,
              estado_tarea: prevRec.estado_tarea,
              fecha_completado: prevRec.fecha_completado
            }
          });

          await db.tareas.update(evento.sourceId, {
            fecha_programada: fechaNorm,
            hora_inicio: rangoCalc.horaInicio,
            horas_estimadas: rangoCalc.horasDecimal,
            updated_at: nowIso,
            sync_status: 'pending'
          });

          const tareaActualizada: TareaRecord = {
            ...prevRec,
            fecha_programada: fechaNorm,
            hora_inicio: rangoCalc.horaInicio,
            horas_estimadas: rangoCalc.horasDecimal,
            updated_at: nowIso,
            sync_status: 'pending'
          };
          void propagarCambioAGoogleCalendar('tarea', tareaActualizada);
        } else if (evento.rawRef.kind === 'actividad' || evento.rawRef.kind === 'habito') {
          const prevAct =
            (await db.actividades_personales.get(evento.sourceId)) ?? evento.rawRef.record;
          pushUndoEntry({
            entidad: evento.rawRef.kind,
            id: evento.sourceId,
            etiqueta: `${esSoloResize ? 'Duración' : 'Reprogramación'} de ${prevAct.codigo_legado || evento.codigoLegado}`,
            snapshot: {
              fecha_programada: prevAct.fecha_programada,
              hora_inicio: prevAct.hora_inicio,
              duracion_horas: prevAct.duracion_horas,
              estado: prevAct.estado,
              racha_actual: prevAct.racha_actual,
              ultima_fecha_completado: prevAct.ultima_fecha_completado,
              proxima_fecha_programada: prevAct.proxima_fecha_programada,
              historial_fechas: prevAct.historial_fechas ? [...prevAct.historial_fechas] : undefined
            }
          });

          await db.actividades_personales.update(evento.sourceId, {
            fecha_programada: fechaNorm,
            hora_inicio: rangoCalc.horaInicio,
            duracion_horas: rangoCalc.horasDecimal,
            updated_at: nowIso,
            sync_status: 'pending'
          });

          const actActualizada: ActividadPersonal = {
            ...prevAct,
            fecha_programada: fechaNorm,
            hora_inicio: rangoCalc.horaInicio,
            duracion_horas: rangoCalc.horasDecimal,
            updated_at: nowIso,
            sync_status: 'pending'
          };
          void propagarCambioAGoogleCalendar(evento.rawRef.kind, actActualizada);
        } else {
          return false;
        }

        void syncManager.sincronizarTodo().catch(() => {});
        return true;
      } catch (err) {
        console.error('[useCalendarEngine] Error al reprogramar evento:', err);
        return false;
      }
    },
    [pushUndoEntry]
  );

  // Agendar tarea desde el panel lateral "Por Agendar" hacia un bloque horario + Undo + GCal (REQ-FEAT-CAL-02 / CAL-07)
  const agendarTareaDesdeBacklog = useCallback(
    async (
      tareaId: string,
      fecha: string,
      horaInicio: string,
      duracionMinutos?: number
    ): Promise<boolean> => {
      const fechaNorm = normalizarFechaIso(fecha);
      if (!tareaId || !fechaNorm) return false;

      try {
        const tareaActual = await db.tareas.get(tareaId);
        if (!tareaActual) return false;

        pushUndoEntry({
          entidad: 'tarea',
          id: tareaId,
          etiqueta: `Agendar ${tareaActual.codigo_legado || 'tarea'}`,
          snapshot: {
            fecha_programada: tareaActual.fecha_programada,
            hora_inicio: tareaActual.hora_inicio,
            horas_estimadas: tareaActual.horas_estimadas,
            estado_tarea: tareaActual.estado_tarea,
            fecha_completado: tareaActual.fecha_completado
          }
        });

        const duracionBase =
          duracionMinutos ??
          Math.max(30, Math.round((Number(tareaActual.horas_estimadas) || 1) * 60));
        const rangoCalc = calcularRangoReprogramado(horaAMinutos(horaInicio), duracionBase);
        const nowIso = new Date().toISOString();

        await db.tareas.update(tareaId, {
          fecha_programada: fechaNorm,
          hora_inicio: rangoCalc.horaInicio,
          horas_estimadas: rangoCalc.horasDecimal,
          updated_at: nowIso,
          sync_status: 'pending'
        });

        const tareaActualizada: TareaRecord = {
          ...tareaActual,
          fecha_programada: fechaNorm,
          hora_inicio: rangoCalc.horaInicio,
          horas_estimadas: rangoCalc.horasDecimal,
          updated_at: nowIso,
          sync_status: 'pending'
        };
        void propagarCambioAGoogleCalendar('tarea', tareaActualizada);
        void syncManager.sincronizarTodo().catch(() => {});
        return true;
      } catch (err) {
        console.error('[useCalendarEngine] Error al agendar tarea desde backlog:', err);
        return false;
      }
    },
    [pushUndoEntry]
  );

  // Creación rápida de las 4 entidades desde el Calendario (REQ-FEAT-CAL-02 / REQ-FIX-CAL-06)
  const crearEventoRapido = useCallback(
    async (params: QuickCreateCalendarParams): Promise<boolean> => {
      const tituloLimpio = params.titulo.trim();
      const fechaNorm = normalizarFechaIso(params.fecha);
      if (!tituloLimpio || !fechaNorm) return false;

      try {
        if (params.tipo === 'tarea') {
          const rangoCalc = calcularRangoReprogramado(
            horaAMinutos(params.horaInicio),
            params.duracionMinutos
          );
          await crearTarea({
            nombre_tarea_actividad: tituloLimpio,
            fecha_programada: fechaNorm,
            hora_inicio: rangoCalc.horaInicio,
            horas_estimadas: rangoCalc.horasDecimal,
            estado_tarea: '02_Por_Hacer',
            agendado_calendar: 'No'
          });
        } else if (params.tipo === 'actividad') {
          const rangoCalc = calcularRangoReprogramado(
            horaAMinutos(params.horaInicio),
            params.duracionMinutos
          );
          const nowIso = new Date().toISOString();
          const codigoLegado = await generarCodigoCorrelativoSeguro(
            db.actividades_personales,
            'ACT',
            3
          );
          await db.actividades_personales.put({
            id: generateSafeUUID(),
            user_id: '00000000-0000-0000-0000-000000000001',
            codigo_legado: codigoLegado,
            nombre_actividad: tituloLimpio,
            tipo_compromiso: 'PUNTUAL',
            categoria_vida: 'PERSONAL_DESCANSO',
            estado: '02_Por_Hacer',
            racha_actual: 0,
            fecha_programada: fechaNorm,
            hora_inicio: rangoCalc.horaInicio,
            duracion_horas: rangoCalc.horasDecimal,
            agendado_calendar: 'No',
            frecuencia_ciclo: 'NINGUNA',
            created_at: nowIso,
            updated_at: nowIso,
            version: 1,
            sync_status: 'pending'
          });
          void syncManager.sincronizarTodo().catch(() => {});
        } else if (params.tipo === 'gasto') {
          const montoSeguro = Math.max(0, Number(params.monto) || 0);
          await crearGasto({
            descripcion_gasto: tituloLimpio,
            fecha_gasto: fechaNorm,
            monto_original: montoSeguro,
            monto_pen: montoSeguro,
            moneda_original: params.moneda || 'PEN',
            tipo_cambio: 1,
            estado_pago: 'PENDIENTE',
            tipo_origen: 'Personal',
            categoria_gasto: 'General',
            agendar_calendar: false,
            agendado_calendar: 'No'
          });
          void syncManager.sincronizarTodo().catch(() => {});
        } else if (params.tipo === 'ingreso') {
          const montoSeguro = Math.max(0, Number(params.monto) || 0);
          await crearIngreso({
            descripcion_ingreso: tituloLimpio,
            fecha_ingreso: fechaNorm,
            monto_original: montoSeguro,
            monto_pen: montoSeguro,
            moneda_original: params.moneda || 'PEN',
            tipo_cambio: 1,
            estado_cobro: 'PENDIENTE',
            tipo_origen: 'Honorario',
            categoria_ingreso: 'Principal',
            agendar_calendar: false,
            agendado_calendar: 'No'
          });
          void syncManager.sincronizarTodo().catch(() => {});
        }
        return true;
      } catch (err) {
        console.error('[useCalendarEngine] Error al crear evento rápido:', err);
        return false;
      }
    },
    []
  );

  // Devolver tarea agendada a "Por Agendar" limpiando su hora_inicio + Undo (REQ-UX-CAL-05 / CAL-07)
  const devolverTareaABacklog = useCallback(
    async (tareaId: string): Promise<boolean> => {
      if (!tareaId) return false;
      const tareaActual = await db.tareas.get(tareaId);
      if (tareaActual) {
        pushUndoEntry({
          entidad: 'tarea',
          id: tareaId,
          etiqueta: `Devolver ${tareaActual.codigo_legado || 'tarea'} a Por Agendar`,
          snapshot: {
            fecha_programada: tareaActual.fecha_programada,
            hora_inicio: tareaActual.hora_inicio,
            horas_estimadas: tareaActual.horas_estimadas,
            estado_tarea: tareaActual.estado_tarea,
            fecha_completado: tareaActual.fecha_completado
          }
        });
      }
      return devolverTareaABacklogLocal(tareaId);
    },
    [pushUndoEntry]
  );

  return {
    fechaAncla,
    vista,
    setVista,
    rango,
    filtrosEntidad,
    toggleFiltroEntidad,
    resetFiltros,
    irAHoy,
    irAnterior,
    irSiguiente,
    irAFecha: seleccionarFecha,
    seleccionarFecha,
    todosEventos,
    eventosVisibles,
    eventosPorFecha,
    tareasPorAgendar,
    tareasVencidasReprogramar,
    tareasSinHora,
    cargaDiariaPorFecha,
    gcalExternoEstado,
    recargarEventosExternos,
    puedeDeshacer: undoStackSize > 0,
    deshacerUltimaAccion,
    toggleCompletarEvento,
    reprogramarEvento,
    agendarTareaDesdeBacklog,
    devolverTareaABacklog,
    crearEventoRapido
  };
}
