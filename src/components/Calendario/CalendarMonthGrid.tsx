/**
 * ============================================================================
 * ARCHIVO: src/components/Calendario/CalendarMonthGrid.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-01 (Matriz Mensual Cobalt Aerodynamic con +N más)
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type {
  CalendarEventItem,
  PositionedCalendarEvent
} from '../../hooks/useCalendarEngine';
import {
  CALENDAR_ENTITY_STYLES,
  DIAS_SEMANA_CORTOS,
  EXTERNAL_GCAL_STRIPE_STYLE,
  formatearFechaCortaEs,
  resolverBordeEstadoEvento
} from './calendarStyles';
import type { PopoverAnchorPosition } from './CalendarEventPopover';

const MAX_PILLS_POR_CELDA = 3;

interface OverflowDayState {
  fechaIso: string;
  anchor: PopoverAnchorPosition;
}

interface CalendarMonthGridProps {
  fechas: string[];
  mesActivo: number; // 0-11
  hoyIso: string;
  eventosPorFecha: Map<
    string,
    { allDay: CalendarEventItem[]; timed: PositionedCalendarEvent[] }
  >;
  onSelectEvent: (evento: CalendarEventItem, anchor: PopoverAnchorPosition) => void;
  onSelectDay: (fechaIso: string) => void;
}

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  fechas,
  mesActivo,
  hoyIso,
  eventosPorFecha,
  onSelectEvent,
  onSelectDay
}) => {
  const numSemanas = Math.max(4, Math.ceil(fechas.length / 7));
  const [diaExpandido, setDiaExpandido] = useState<OverflowDayState | null>(null);
  const overflowPopoverRef = useRef<HTMLDivElement>(null);

  // Cierre por clic fuera o Escape para popover +N más
  useEffect(() => {
    if (!diaExpandido) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        overflowPopoverRef.current &&
        !overflowPopoverRef.current.contains(e.target as Node)
      ) {
        setDiaExpandido(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setDiaExpandido(null);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [diaExpandido]);

  const eventosDiaExpandido: CalendarEventItem[] = diaExpandido
    ? [
        ...(eventosPorFecha.get(diaExpandido.fechaIso)?.allDay ?? []),
        ...(eventosPorFecha.get(diaExpandido.fechaIso)?.timed ?? [])
      ]
    : [];

  const popoverCoords = (() => {
    if (!diaExpandido) return null;
    const width = 280;
    const estHeight = Math.min(300, 68 + eventosDiaExpandido.length * 30);
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      left: Math.max(12, Math.min(diaExpandido.anchor.x, vw - width - 12)),
      top:
        diaExpandido.anchor.y + estHeight + 16 > vh
          ? Math.max(12, diaExpandido.anchor.y - estHeight - 10)
          : Math.max(12, diaExpandido.anchor.y)
    };
  })();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#040711] rounded-2xl border border-slate-800/50 overflow-hidden shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8)]">
      {/* Cabecera Lunes - Domingo */}
      <div className="grid grid-cols-7 border-b border-white/[0.06] bg-[#0D1526]/90 shrink-0">
        {DIAS_SEMANA_CORTOS.map((dia, idx) => {
          const esFinDeSemana = idx >= 5;
          return (
            <div
              key={dia}
              className={`py-2 text-center text-[10px] font-semibold uppercase tracking-wider border-r last:border-r-0 border-white/[0.05] ${
                esFinDeSemana ? 'bg-white/[0.015] text-slate-500' : 'text-slate-400'
              }`}
            >
              {dia}
            </div>
          );
        })}
      </div>

      {/* Celdas del Mes */}
      <div
        className="flex-1 grid grid-cols-7 min-h-0"
        style={{ gridTemplateRows: `repeat(${numSemanas}, minmax(0, 1fr))` }}
      >
        {fechas.map((fechaIso, idx) => {
          const [, m, d] = fechaIso.split('-').map(Number);
          const esMesActual = m - 1 === mesActivo;
          const esHoy = fechaIso === hoyIso;
          const esFinDeSemana = idx % 7 >= 5;

          const bucket = eventosPorFecha.get(fechaIso);
          const todosDia: CalendarEventItem[] = [
            ...(bucket?.allDay ?? []),
            ...(bucket?.timed ?? [])
          ];
          const visibles = todosDia.slice(0, MAX_PILLS_POR_CELDA);
          const restantes = todosDia.length - visibles.length;

          return (
            <div
              key={fechaIso}
              onClick={() => onSelectDay(fechaIso)}
              className={`border-r border-b border-white/[0.05] p-1.5 flex flex-col gap-1 min-h-0 overflow-hidden transition-colors cursor-pointer ${
                esHoy
                  ? 'bg-sky-500/[0.05]'
                  : !esMesActual
                  ? `${esFinDeSemana ? 'bg-white/[0.015]' : 'bg-[#02050C]/60'} opacity-45 hover:opacity-75`
                  : esFinDeSemana
                  ? 'bg-white/[0.015] hover:bg-white/[0.03]'
                  : 'bg-[#040711] hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono tabular-nums text-xs w-6 h-6 rounded-full flex items-center justify-center ${
                    esHoy
                      ? 'bg-sky-500 text-white font-semibold shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                      : esMesActual
                      ? 'text-slate-200 font-medium'
                      : 'text-slate-500 font-medium'
                  }`}
                >
                  {d}
                </span>
                {todosDia.length > 0 && (
                  <span className="font-mono tabular-nums text-[10px] text-slate-500">
                    {todosDia.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 min-h-0">
                {visibles.map((ev) => {
                  const style = CALENDAR_ENTITY_STYLES[ev.entidad];
                  const bordeEstado = resolverBordeEstadoEvento(ev);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev, { x: e.clientX, y: e.clientY });
                      }}
                      style={
                        ev.entidad === 'externo_gcal' ? EXTERNAL_GCAL_STRIPE_STYLE : undefined
                      }
                      className={`w-full h-5 px-1.5 rounded text-left text-[11px] border border-l-2 ${style.bgClass} ${style.hoverBgClass} ${style.borderClass} ${bordeEstado} flex items-center gap-1 min-w-0 cursor-pointer transition ${
                        ev.completado ? 'opacity-45' : ''
                      }`}
                      title={`${!ev.allDay && ev.horaInicio ? `${ev.horaInicio} · ` : ''}${ev.titulo}`}
                    >
                      {!ev.allDay && ev.horaInicio && (
                        <span className="font-mono tabular-nums text-[10px] opacity-70 text-slate-300 shrink-0">
                          {ev.horaInicio}
                        </span>
                      )}
                      <span
                        className={`font-medium truncate leading-none ${style.textClass} ${
                          ev.completado ? 'line-through' : ''
                        }`}
                      >
                        {ev.titulo}
                      </span>
                    </button>
                  );
                })}

                {restantes > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDiaExpandido({
                        fechaIso,
                        anchor: { x: rect.left, y: rect.bottom + 4 }
                      });
                    }}
                    className="text-[10px] font-mono tabular-nums font-medium text-slate-400 hover:text-sky-300 text-left px-1 pt-0.5 transition cursor-pointer"
                  >
                    +{restantes} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Popover Flotante Unificado para +N más (REQ-UX-CAL-11) */}
      {diaExpandido && popoverCoords && (
        <div
          ref={overflowPopoverRef}
          role="dialog"
          aria-label={`Eventos del ${formatearFechaCortaEs(diaExpandido.fechaIso)}`}
          style={{
            top: popoverCoords.top,
            left: popoverCoords.left,
            width: 280
          }}
          className="fixed z-[9990] bg-[#0B1221]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 p-3 text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                const target = diaExpandido.fechaIso;
                setDiaExpandido(null);
                onSelectDay(target);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-100 hover:text-sky-300 transition cursor-pointer min-w-0"
              title="Abrir vista Día"
            >
              <span className="truncate capitalize">
                {formatearFechaCortaEs(diaExpandido.fechaIso)}
              </span>
              <span className="font-mono tabular-nums text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 leading-none shrink-0">
                {eventosDiaExpandido.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDiaExpandido(null)}
              className="h-6 w-6 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] flex items-center justify-center transition cursor-pointer shrink-0"
              aria-label="Cerrar lista de eventos del día"
              title="Cerrar (Esc)"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[220px] overflow-y-auto custom-scrollbar space-y-1">
            {eventosDiaExpandido.map((ev) => {
              const style = CALENDAR_ENTITY_STYLES[ev.entidad];
              const bordeEstado = resolverBordeEstadoEvento(ev);
              return (
                <button
                  key={`ov-${ev.id}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const anchor = { x: e.clientX, y: e.clientY };
                    setDiaExpandido(null);
                    onSelectEvent(ev, anchor);
                  }}
                  style={
                    ev.entidad === 'externo_gcal' ? EXTERNAL_GCAL_STRIPE_STYLE : undefined
                  }
                  className={`w-full h-6 px-2 rounded-md text-left text-[11px] border border-l-2 ${style.bgClass} ${style.hoverBgClass} ${style.borderClass} ${bordeEstado} flex items-center gap-1.5 min-w-0 cursor-pointer transition ${
                    ev.completado ? 'opacity-45' : ''
                  }`}
                  title={`${!ev.allDay && ev.horaInicio ? `${ev.horaInicio} · ` : ''}${ev.titulo}`}
                >
                  {!ev.allDay && ev.horaInicio && (
                    <span className="font-mono tabular-nums text-[10px] opacity-70 text-slate-300 shrink-0">
                      {ev.horaInicio}
                    </span>
                  )}
                  <span
                    className={`font-medium truncate leading-none ${style.textClass} ${
                      ev.completado ? 'line-through' : ''
                    }`}
                  >
                    {ev.titulo}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
