/**
 * ============================================================================
 * ARCHIVO: src/components/Calendario/calendarStyles.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-01 / REQ-UX-CAL-04 / REQ-UX-CAL-05
 * DESCRIPCIÓN: Paleta Editorial / Tonos Sobrios (Linear/Cron) para el
 *              Calendario Maestro: fondos oscuros homogéneos con micro-tinte
 *              mineral y acento cromático reservado al borde izquierdo e icono.
 * ============================================================================
 */

import type { CSSProperties } from 'react';
import type { CalendarEntityType, CalendarEventItem } from '../../hooks/useCalendarEngine';

/**
 * Patrón diagonal ultra-fino para diferenciar eventos externos de Google Calendar
 * (solo-lectura) de los bloques propios de MiPortalWeb sin subir saturación (REQ-UX-CAL-09).
 */
export const EXTERNAL_GCAL_STRIPE_STYLE: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(148,163,184,0.045) 6px, rgba(148,163,184,0.045) 12px)'
};

export interface CalendarEntityVisualStyle {
  label: string;
  shortLabel: string;
  bgClass: string;
  hoverBgClass: string;
  borderClass: string;
  textClass: string;
  iconColorClass: string;
  dotClass: string;
  badgeClass: string;
  defaultLeftBorderClass: string;
}

export const CALENDAR_ENTITY_STYLES: Record<CalendarEntityType, CalendarEntityVisualStyle> = {
  tarea: {
    label: 'Tareas',
    shortLabel: 'Tarea',
    bgClass: 'bg-slate-900/85 bg-gradient-to-r from-sky-500/[0.08] via-sky-500/[0.03] to-transparent',
    hoverBgClass: 'hover:bg-slate-800/90 hover:border-white/[0.11]',
    borderClass: 'border-white/[0.06]',
    textClass: 'text-slate-100',
    iconColorClass: 'text-sky-400',
    dotClass: 'bg-sky-400',
    badgeClass: 'bg-sky-500/[0.10] text-sky-300 border-sky-400/25',
    defaultLeftBorderClass: 'border-l-sky-400/85'
  },
  actividad: {
    label: 'Actividades',
    shortLabel: 'Actividad',
    bgClass: 'bg-slate-900/85 bg-gradient-to-r from-indigo-500/[0.08] via-indigo-500/[0.03] to-transparent',
    hoverBgClass: 'hover:bg-slate-800/90 hover:border-white/[0.11]',
    borderClass: 'border-white/[0.06]',
    textClass: 'text-slate-100',
    iconColorClass: 'text-indigo-300',
    dotClass: 'bg-indigo-300',
    badgeClass: 'bg-indigo-500/[0.10] text-indigo-200 border-indigo-300/25',
    defaultLeftBorderClass: 'border-l-indigo-300/80'
  },
  habito: {
    label: 'Hábitos',
    shortLabel: 'Hábito',
    bgClass: 'bg-slate-900/85 bg-gradient-to-r from-teal-500/[0.08] via-teal-500/[0.03] to-transparent',
    hoverBgClass: 'hover:bg-slate-800/90 hover:border-white/[0.11]',
    borderClass: 'border-white/[0.06]',
    textClass: 'text-slate-100',
    iconColorClass: 'text-teal-400',
    dotClass: 'bg-teal-400',
    badgeClass: 'bg-teal-500/[0.10] text-teal-300 border-teal-400/25',
    defaultLeftBorderClass: 'border-l-teal-400/80'
  },
  hito: {
    label: 'Hitos WBS',
    shortLabel: 'Hito WBS',
    bgClass: 'bg-slate-900/85 bg-gradient-to-r from-violet-500/[0.08] via-violet-500/[0.03] to-transparent',
    hoverBgClass: 'hover:bg-slate-800/90 hover:border-white/[0.11]',
    borderClass: 'border-white/[0.06]',
    textClass: 'text-slate-100',
    iconColorClass: 'text-violet-300',
    dotClass: 'bg-violet-300',
    badgeClass: 'bg-violet-500/[0.10] text-violet-200 border-violet-300/25',
    defaultLeftBorderClass: 'border-l-violet-300/80'
  },
  gasto: {
    label: 'Gastos',
    shortLabel: 'Gasto',
    bgClass: 'bg-slate-900/85 bg-gradient-to-r from-amber-500/[0.07] via-amber-500/[0.02] to-transparent',
    hoverBgClass: 'hover:bg-slate-800/90 hover:border-white/[0.11]',
    borderClass: 'border-white/[0.06]',
    textClass: 'text-slate-100',
    iconColorClass: 'text-amber-300/90',
    dotClass: 'bg-amber-300',
    badgeClass: 'bg-amber-500/[0.09] text-amber-200 border-amber-300/25',
    defaultLeftBorderClass: 'border-l-amber-300/75'
  },
  ingreso: {
    label: 'Ingresos',
    shortLabel: 'Ingreso',
    bgClass: 'bg-slate-900/85 bg-gradient-to-r from-amber-500/[0.07] via-amber-500/[0.02] to-transparent',
    hoverBgClass: 'hover:bg-slate-800/90 hover:border-white/[0.11]',
    borderClass: 'border-white/[0.06]',
    textClass: 'text-slate-100',
    iconColorClass: 'text-amber-300/90',
    dotClass: 'bg-amber-300',
    badgeClass: 'bg-amber-500/[0.09] text-amber-200 border-amber-300/25',
    defaultLeftBorderClass: 'border-l-amber-300/75'
  },
  externo_gcal: {
    label: 'Google Calendar',
    shortLabel: 'GCal',
    bgClass: 'bg-slate-900/50',
    hoverBgClass: 'hover:bg-slate-800/65',
    borderClass: 'border-slate-600/40 border-dashed',
    textClass: 'text-slate-300',
    iconColorClass: 'text-slate-400',
    dotClass: 'bg-slate-500',
    badgeClass: 'bg-slate-800/70 text-slate-300 border-slate-600/40',
    defaultLeftBorderClass: 'border-l-slate-500/80'
  }
};

/**
 * Resuelve el borde izquierdo mineral de 2.5px–3px basado en estado / prioridad.
 */
export function resolverBordeEstadoEvento(item: CalendarEventItem): string {
  if (item.completado) return 'border-l-teal-500/50';
  const prio = (item.prioridad || '').toUpperCase();
  if (prio.includes('Q1') || prio.includes('P1') || prio.includes('CRITIC') || prio.includes('URGENTE')) {
    return 'border-l-rose-400/90';
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
