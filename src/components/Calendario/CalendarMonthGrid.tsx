/**
 * ============================================================================
 * ARCHIVO: src/components/Calendario/CalendarMonthGrid.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-01 (Matriz Mensual Cobalt Aerodynamic con +N más)
 * ============================================================================
 */

import React from 'react';
import type {
  CalendarEventItem,
  PositionedCalendarEvent
} from '../../hooks/useCalendarEngine';
import {
  CALENDAR_ENTITY_STYLES,
  DIAS_SEMANA_CORTOS,
  resolverBordeEstadoEvento
} from './calendarStyles';
import type { PopoverAnchorPosition } from './CalendarEventPopover';

const MAX_PILLS_POR_CELDA = 3;

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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#040711] rounded-2xl border border-slate-800/50 overflow-hidden shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8)]">
      {/* Cabecera Lunes - Domingo */}
      <div className="grid grid-cols-7 border-b border-slate-800/70 bg-[#0D1526]/90 shrink-0">
        {DIAS_SEMANA_CORTOS.map((dia) => (
          <div
            key={dia}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 border-r last:border-r-0 border-slate-800/40"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Celdas del Mes */}
      <div
        className="flex-1 grid grid-cols-7 min-h-0"
        style={{ gridTemplateRows: `repeat(${numSemanas}, minmax(0, 1fr))` }}
      >
        {fechas.map((fechaIso) => {
          const [, m, d] = fechaIso.split('-').map(Number);
          const esMesActual = m - 1 === mesActivo;
          const esHoy = fechaIso === hoyIso;

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
              className={`border-r border-b border-slate-800/40 p-1.5 flex flex-col gap-1 min-h-0 overflow-hidden transition-colors cursor-pointer ${
                esHoy
                  ? 'bg-sky-950/20'
                  : esMesActual
                  ? 'bg-[#040711] hover:bg-white/[0.02]'
                  : 'bg-[#02050C]/70 opacity-50 hover:opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono tabular-nums text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    esHoy
                      ? 'bg-sky-500 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                      : esMesActual
                      ? 'text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  {d}
                </span>
                {todosDia.length > 0 && (
                  <span className="font-mono tabular-nums text-[9px] text-slate-500">
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
                      className={`w-full text-left px-1.5 py-0.5 rounded border border-l-[3px] ${style.bgClass} ${style.hoverBgClass} ${style.borderClass} ${bordeEstado} flex items-center gap-1 min-w-0 cursor-pointer transition ${
                        ev.completado ? 'opacity-45' : ''
                      }`}
                      title={`${ev.horaInicio ? `${ev.horaInicio} · ` : ''}${ev.titulo}`}
                    >
                      {ev.horaInicio && (
                        <span className="font-mono tabular-nums text-[9px] text-slate-400 shrink-0">
                          {ev.horaInicio}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-medium truncate ${style.textClass} ${
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
                      onSelectDay(fechaIso);
                    }}
                    className="text-[10px] font-mono tabular-nums font-semibold text-sky-400 hover:text-sky-300 text-left px-1 pt-0.5 cursor-pointer"
                  >
                    +{restantes} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
