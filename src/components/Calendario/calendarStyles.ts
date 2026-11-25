/**
 * ============================================================================
 * ARCHIVO: src/components/Calendario/calendarStyles.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-01 (Tokens Cobalt Aerodynamic A.2.2 para Calendario)
 * ============================================================================
 */

import type { CalendarEntityType, CalendarEventItem } from '../../hooks/useCalendarEngine';

export interface CalendarEntityVisualStyle {
  label: string;
  shortLabel: string;
  bgClass: string;
  hoverBgClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
  badgeClass: string;
  defaultLeftBorderClass: string;
}

export const CALENDAR_ENTITY_STYLES: Record<CalendarEntityType, CalendarEntityVisualStyle> = {
  tarea: {
    label: 'Tareas',
    shortLabel: 'Tarea',
    bgClass: 'bg-sky-500/12',
    hoverBgClass: 'hover:bg-sky-500/20',
    borderClass: 'border-sky-500/25',
    textClass: 'text-sky-200',
    dotClass: 'bg-sky-500',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    defaultLeftBorderClass: 'border-l-sky-500'
  },
  actividad: {
    label: 'Actividades',
    shortLabel: 'Actividad',
    bgClass: 'bg-indigo-500/12',
    hoverBgClass: 'hover:bg-indigo-500/20',
    borderClass: 'border-indigo-400/25',
    textClass: 'text-indigo-200',
    dotClass: 'bg-indigo-400',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
    defaultLeftBorderClass: 'border-l-indigo-400'
  },
  habito: {
    label: 'Hábitos',
    shortLabel: 'Hábito',
    bgClass: 'bg-emerald-500/12',
    hoverBgClass: 'hover:bg-emerald-500/20',
    borderClass: 'border-emerald-500/25',
    textClass: 'text-emerald-200',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    defaultLeftBorderClass: 'border-l-emerald-500'
  },
  hito: {
    label: 'Hitos WBS',
    shortLabel: 'Hito WBS',
    bgClass: 'bg-purple-500/12',
    hoverBgClass: 'hover:bg-purple-500/20',
    borderClass: 'border-purple-400/25',
    textClass: 'text-purple-200',
    dotClass: 'bg-purple-400',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
    defaultLeftBorderClass: 'border-l-purple-400'
  },
  gasto: {
    label: 'Gastos',
    shortLabel: 'Gasto',
    bgClass: 'bg-amber-500/12',
    hoverBgClass: 'hover:bg-amber-500/20',
    borderClass: 'border-amber-400/25',
    textClass: 'text-amber-200',
    dotClass: 'bg-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    defaultLeftBorderClass: 'border-l-amber-400'
  },
  ingreso: {
    label: 'Ingresos',
    shortLabel: 'Ingreso',
    bgClass: 'bg-amber-500/10',
    hoverBgClass: 'hover:bg-amber-500/18',
    borderClass: 'border-amber-400/25',
    textClass: 'text-amber-200',
    dotClass: 'bg-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    defaultLeftBorderClass: 'border-l-amber-400'
  },
  externo_gcal: {
    label: 'GCal',
    shortLabel: 'GCal',
    bgClass: 'bg-slate-800/45',
    hoverBgClass: 'hover:bg-slate-800/65',
    borderClass: 'border-slate-600/50 border-dashed',
    textClass: 'text-slate-300',
    dotClass: 'bg-slate-400',
    badgeClass: 'bg-slate-800/70 text-slate-300 border-slate-600/50',
    defaultLeftBorderClass: 'border-l-slate-500'
  }
};

/**
 * Resuelve el borde izquierdo de 3px basado en prioridad / estado del evento.
 */
export function resolverBordeEstadoEvento(item: CalendarEventItem): string {
  if (item.completado) return 'border-l-emerald-500/60';
  const prio = (item.prioridad || '').toUpperCase();
  if (prio.includes('Q1') || prio.includes('CRITIC') || prio.includes('URGENTE')) {
    return 'border-l-rose-500';
  }
  if (prio.includes('Q2') || prio.includes('ALTA')) {
    return 'border-l-amber-400';
  }
  if (item.estado === '03_En_Proceso' || item.estado === '03_En_Curso' || item.estado === '02_En_Progreso') {
    return 'border-l-sky-400';
  }
  return CALENDAR_ENTITY_STYLES[item.entidad].defaultLeftBorderClass;
}

export const DIAS_SEMANA_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
export const MESES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
] as const;

/**
 * Formatea una fecha ISO 'YYYY-MM-DD' a etiqueta legible 'Mar 25 Nov'.
 */
export function formatearFechaCortaEs(fechaIso: string): string {
  const [y, m, d] = fechaIso.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return fechaIso;
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  const idxLun = (dt.getDay() + 6) % 7;
  const mesCorto = MESES_ES[m - 1]?.slice(0, 3) || '';
  return `${DIAS_SEMANA_CORTOS[idxLun]} ${String(d).padStart(2, '0')} ${mesCorto}`;
}
