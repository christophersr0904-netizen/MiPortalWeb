/**
 * ============================================================================
 * ARCHIVO: src/components/Calendario/CalendarBacklogPanel.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-02 / REQ-UX-CAL-05
 * DESCRIPCIÓN: Panel lateral colapsable "Por Agendar" (~280px) separado en
 *              "Vencidas por reprogramar" y "Sin hora asignada", con tarjetas
 *              arrastrables hacia cualquier hueco de la grilla horaria.
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  GripVertical,
  Clock,
  Calendar,
  X,
  Inbox,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import type { TareaRecord } from '../../types';
import { normalizarFechaIso } from '../../utils/recurrenceEngine';
import { formatearFechaCortaEs } from './calendarStyles';

export const CALENDAR_DRAG_MIME = 'application/x-pmo-calendar-drag';

export interface CalendarDragPayload {
  kind: 'backlog-tarea' | 'existing-event';
  id: string;
  titulo: string;
  duracionMinutos: number;
}

interface CalendarBacklogPanelProps {
  tareasVencidas: TareaRecord[];
  tareasSinHora: TareaRecord[];
  onClose: () => void;
  onDragStartItem: (payload: CalendarDragPayload) => void;
  onDragEndItem: () => void;
  onAbrirTarea?: (tareaId: string) => void;
}

function resolverBordePrioridad(prioridad?: string, esVencida?: boolean): string {
  const p = (prioridad || '').toUpperCase();
  if (p.includes('Q1') || p.includes('P1') || p.includes('CRITIC') || p.includes('URGENTE')) {
    return 'border-l-rose-400/90';
  }
  if (esVencida) {
    return 'border-l-amber-300/80';
  }
  if (p.includes('Q2') || p.includes('P2') || p.includes('ALTA')) {
    return 'border-l-amber-300/75';
  }
  return 'border-l-sky-400/85';
}

export const CalendarBacklogPanel: React.FC<CalendarBacklogPanelProps> = ({
  tareasVencidas,
  tareasSinHora,
  onClose,
  onDragStartItem,
  onDragEndItem,
  onAbrirTarea
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [vencidasAbierto, setVencidasAbierto] = useState(true);
  const [sinHoraAbierto, setSinHoraAbierto] = useState(true);

  const filtrarLista = (lista: TareaRecord[]) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((t) => {
      const titulo = (t.nombre_tarea_actividad || t.Nombre_Tarea_Actividad || '').toLowerCase();
      const codigo = (t.codigo_legado || '').toLowerCase();
      const proy = (t.proyecto_codigo || '').toLowerCase();
      return titulo.includes(q) || codigo.includes(q) || proy.includes(q);
    });
  };

  const vencidasFiltradas = useMemo(() => filtrarLista(tareasVencidas), [tareasVencidas, busqueda]);
  const sinHoraFiltradas = useMemo(() => filtrarLista(tareasSinHora), [tareasSinHora, busqueda]);
  const totalBacklog = tareasVencidas.length + tareasSinHora.length;
  const totalFiltrado = vencidasFiltradas.length + sinHoraFiltradas.length;

  const renderTarjeta = (t: TareaRecord, esVencida: boolean) => {
    const titulo =
      t.nombre_tarea_actividad || t.Nombre_Tarea_Actividad || 'Tarea sin título';
    const durMin = Math.max(30, Math.round((Number(t.horas_estimadas) || 1) * 60));
    const bordePrio = resolverBordePrioridad(
      t.prioridad_eisenhower || t.Prioridad_Eisenhower,
      esVencida
    );
    const fechaIso = normalizarFechaIso(t.fecha_programada);

    return (
      <div
        key={t.id}
        draggable
        onDragStart={(e) => {
          const payload: CalendarDragPayload = {
            kind: 'backlog-tarea',
            id: t.id,
            titulo,
            duracionMinutos: durMin
          };
          e.dataTransfer.setData(CALENDAR_DRAG_MIME, JSON.stringify(payload));
          e.dataTransfer.setData('text/plain', titulo);
          e.dataTransfer.effectAllowed = 'move';
          onDragStartItem(payload);
        }}
        onDragEnd={onDragEndItem}
        onDoubleClick={() => onAbrirTarea?.(t.id)}
        className={`p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/[0.06] hover:border-white/[0.12] border-l-[3px] ${bordePrio} cursor-grab active:cursor-grabbing transition-[background-color,border-color] duration-150 group select-none`}
        title="Arrastra a la grilla horaria para agendar · Doble clic para editar"
      >
        <div className="flex items-start gap-1.5">
          <GripVertical
            className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 shrink-0 mt-0.5 transition-colors"
            strokeWidth={1.75}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-100 group-hover:text-sky-200 leading-snug line-clamp-2 transition-colors">
              {titulo}
            </p>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 text-[10px] font-mono tabular-nums text-slate-400">
              <span className="text-slate-500">{t.codigo_legado || 'TAR'}</span>
              <span className="inline-flex items-center gap-0.5 text-sky-400/90">
                <Clock className="w-2.5 h-2.5" strokeWidth={1.75} />
                {durMin >= 60
                  ? `${Math.round((durMin / 60) * 10) / 10}h`
                  : `${durMin}m`}
              </span>
              {fechaIso && (
                <span
                  className={`inline-flex items-center gap-0.5 ml-auto ${
                    esVencida ? 'text-amber-300/90' : 'text-slate-500'
                  }`}
                >
                  <Calendar className="w-2.5 h-2.5" strokeWidth={1.75} />
                  {formatearFechaCortaEs(fechaIso)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside
      aria-label="Panel Por Agendar"
      className="hidden md:flex flex-col w-[280px] shrink-0 bg-[#0D1526] border border-slate-800/50 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(30,58,138,0.18)]"
    >
      {/* Cabecera */}
      <div className="px-3.5 py-2.5 border-b border-white/[0.06] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Inbox className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
          <h3 className="text-xs font-semibold text-slate-100 tracking-tight truncate">
            Por Agendar
          </h3>
          <span className="font-mono tabular-nums text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-800/90 text-sky-300 leading-none">
            {totalBacklog}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition cursor-pointer"
          title="Ocultar panel Por Agendar"
          aria-label="Ocultar panel Por Agendar"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Buscador Rápido */}
      <div className="p-2.5 border-b border-white/[0.05] shrink-0">
        <div className="relative">
          <Search
            className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Filtrar pendientes..."
            className="w-full bg-[#040711] border border-slate-800/70 focus:border-sky-500/50 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 cursor-pointer"
              aria-label="Limpiar filtro"
            >
              <X className="w-3 h-3" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Secciones Colapsables: Vencidas por reprogramar & Sin hora asignada */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-3">
        {totalFiltrado === 0 ? (
          <div className="py-10 px-3 text-center flex flex-col items-center gap-2">
            <Inbox className="w-6 h-6 text-slate-600" strokeWidth={1.75} />
            <p className="text-xs font-medium text-slate-400">
              {busqueda
                ? 'Sin coincidencias en pendientes'
                : 'Todas tus tareas están agendadas al día'}
            </p>
          </div>
        ) : (
          <>
            {/* Sección 1: Vencidas por reprogramar */}
            {(vencidasFiltradas.length > 0 || tareasVencidas.length > 0) && (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setVencidasAbierto((prev) => !prev)}
                  className="w-full px-1 py-1 rounded-lg flex items-center justify-between gap-1.5 text-left hover:bg-white/[0.03] transition cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {vencidasAbierto ? (
                      <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" strokeWidth={1.75} />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" strokeWidth={1.75} />
                    )}
                    <AlertCircle className="w-3.5 h-3.5 text-amber-300/90 shrink-0" strokeWidth={1.75} />
                    <span className="text-[11px] font-semibold text-slate-300 truncate">
                      Vencidas por reprogramar
                    </span>
                  </div>
                  {vencidasFiltradas.length > 0 && (
                    <span className="font-mono tabular-nums text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/12 text-amber-300/90 leading-none shrink-0">
                      {vencidasFiltradas.length}
                    </span>
                  )}
                </button>

                {vencidasAbierto && vencidasFiltradas.length > 0 && (
                  <div className="space-y-1.5">
                    {vencidasFiltradas.map((t) => renderTarjeta(t, true))}
                  </div>
                )}
              </div>
            )}

            {/* Sección 2: Sin hora asignada */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setSinHoraAbierto((prev) => !prev)}
                className="w-full px-1 py-1 rounded-lg flex items-center justify-between gap-1.5 text-left hover:bg-white/[0.03] transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {sinHoraAbierto ? (
                    <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" strokeWidth={1.75} />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" strokeWidth={1.75} />
                  )}
                  <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-[11px] font-semibold text-slate-300 truncate">
                    Sin hora asignada
                  </span>
                </div>
                <span className="font-mono tabular-nums text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 leading-none shrink-0">
                  {sinHoraFiltradas.length}
                </span>
              </button>

              {sinHoraAbierto && (
                sinHoraFiltradas.length > 0 ? (
                  <div className="space-y-1.5">
                    {sinHoraFiltradas.map((t) => renderTarjeta(t, false))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 px-2 py-2">
                    Sin tareas pendientes sin hora.
                  </p>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Pie informativo discreto */}
      <div className="px-3 py-2 border-t border-white/[0.05] bg-[#080E1C] text-[10px] font-mono text-slate-500 text-center shrink-0">
        Arrastra a la grilla (snap 15m)
      </div>
    </aside>
  );
};
