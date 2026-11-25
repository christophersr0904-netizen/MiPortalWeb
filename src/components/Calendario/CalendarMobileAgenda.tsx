/**
 * ============================================================================
 * ARCHIVO: src/components/Calendario/CalendarMobileAgenda.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-01 (Vista Móvil Automática: Agenda + Tira Semanal Táctil)
 * ============================================================================
 */

import React from 'react';
import { Clock, CheckCircle2, CalendarDays } from 'lucide-react';
import type {
  CalendarEventItem,
  PositionedCalendarEvent
} from '../../hooks/useCalendarEngine';
import {
  CALENDAR_ENTITY_STYLES,
  DIAS_SEMANA_CORTOS,
  formatearFechaCortaEs,
  resolverBordeEstadoEvento
} from './calendarStyles';
import type { PopoverAnchorPosition } from './CalendarEventPopover';

interface CalendarMobileAgendaProps {
  fechasSemana: string[];
  fechaSeleccionada: string;
  hoyIso: string;
  eventosPorFecha: Map<
    string,
    { allDay: CalendarEventItem[]; timed: PositionedCalendarEvent[] }
  >;
  onSelectDay: (fechaIso: string) => void;
  onSelectEvent: (evento: CalendarEventItem, anchor: PopoverAnchorPosition) => void;
}

export const CalendarMobileAgenda: React.FC<CalendarMobileAgendaProps> = ({
  fechasSemana,
  fechaSeleccionada,
  hoyIso,
  eventosPorFecha,
  onSelectDay,
  onSelectEvent
}) => {
  const bucket = eventosPorFecha.get(fechaSeleccionada);
  const allDayEvents = bucket?.allDay ?? [];
  const timedEvents = bucket?.timed ?? [];
  const sinEventos = allDayEvents.length === 0 && timedEvents.length === 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3">
      {/* Tira Semanal Táctil Superior */}
      <div className="grid grid-cols-7 gap-1 p-1.5 rounded-2xl bg-[#0D1526] border border-slate-800/60 shrink-0">
        {fechasSemana.map((fechaIso) => {
          const [y, m, d] = fechaIso.split('-').map(Number);
          const dt = new Date(y, m - 1, d, 12, 0, 0);
          const idxLun = (dt.getDay() + 6) % 7;
          const esSeleccionado = fechaIso === fechaSeleccionada;
          const esHoy = fechaIso === hoyIso;
          const b = eventosPorFecha.get(fechaIso);
          const count = (b?.allDay.length ?? 0) + (b?.timed.length ?? 0);

          return (
            <button
              key={`mob-${fechaIso}`}
              type="button"
              onClick={() => onSelectDay(fechaIso)}
              className={`min-h-[54px] py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                esSeleccionado
                  ? 'bg-sky-500/20 border border-sky-500/50 text-sky-200'
                  : esHoy
                  ? 'bg-sky-950/30 border border-sky-800/40 text-sky-300'
                  : 'border border-transparent text-slate-400 hover:bg-white/[0.03]'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {DIAS_SEMANA_CORTOS[idxLun]}
              </span>
              <span className="font-mono tabular-nums text-sm font-bold">
                {String(d).padStart(2, '0')}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  count > 0 ? 'bg-sky-400' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Lista Cronológica del Día Seleccionado */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pb-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {formatearFechaCortaEs(fechaSeleccionada)}
          </h3>
          <span className="font-mono tabular-nums text-[11px] text-slate-500">
            {allDayEvents.length + timedEvents.length} compromisos
          </span>
        </div>

        {sinEventos ? (
          <div className="py-12 px-4 rounded-2xl bg-[#0D1526]/60 border border-slate-800/50 flex flex-col items-center justify-center text-center gap-2">
            <CalendarDays className="w-7 h-7 text-slate-600" strokeWidth={1.75} />
            <p className="text-xs font-semibold text-slate-400">
              Agenda despejada para este día
            </p>
            <p className="text-[11px] text-slate-500">
              Toca otro día en la tira superior para revisar tu semana.
            </p>
          </div>
        ) : (
          <>
            {allDayEvents.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-1">
                  Todo el día · Hitos y Finanzas
                </div>
                {allDayEvents.map((ev) => {
                  const style = CALENDAR_ENTITY_STYLES[ev.entidad];
                  const bordeEstado = resolverBordeEstadoEvento(ev);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) =>
                        onSelectEvent(ev, { x: e.clientX, y: e.clientY })
                      }
                      className={`w-full p-3 rounded-xl bg-[#0D1526] border border-slate-800/60 border-l-[3px] ${bordeEstado} flex items-center justify-between gap-2 text-left active:scale-[0.99] transition cursor-pointer ${
                        ev.completado ? 'opacity-55' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${style.badgeClass}`}
                          >
                            {style.shortLabel}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {ev.codigoLegado}
                          </span>
                        </div>
                        <p
                          className={`text-xs font-bold truncate ${
                            ev.completado
                              ? 'line-through text-slate-400'
                              : 'text-slate-100'
                          }`}
                        >
                          {ev.titulo}
                        </p>
                        {ev.subtitulo && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {ev.subtitulo}
                          </p>
                        )}
                      </div>
                      {ev.completado && (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-400 shrink-0"
                          strokeWidth={1.75}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {timedEvents.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-1">
                  Bloques Horarios
                </div>
                {timedEvents.map((ev) => {
                  const style = CALENDAR_ENTITY_STYLES[ev.entidad];
                  const bordeEstado = resolverBordeEstadoEvento(ev);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) =>
                        onSelectEvent(ev, { x: e.clientX, y: e.clientY })
                      }
                      className={`w-full p-3 rounded-xl bg-[#0D1526] border border-slate-800/60 border-l-[3px] ${bordeEstado} flex items-start gap-3 text-left active:scale-[0.99] transition cursor-pointer ${
                        ev.completado ? 'opacity-55' : ''
                      }`}
                    >
                      <div className="flex flex-col items-end shrink-0 w-12 pt-0.5">
                        <span className="font-mono tabular-nums text-xs font-bold text-sky-300">
                          {ev.horaInicio}
                        </span>
                        <span className="font-mono tabular-nums text-[10px] text-slate-500">
                          {ev.horaFin}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${style.badgeClass}`}
                          >
                            {style.shortLabel}
                          </span>
                          <span className="inline-flex items-center gap-0.5 font-mono tabular-nums text-[10px] text-slate-500">
                            <Clock className="w-2.5 h-2.5" strokeWidth={1.75} />
                            {ev.duracionMinutos}m
                          </span>
                        </div>
                        <p
                          className={`text-xs font-bold leading-snug ${
                            ev.completado
                              ? 'line-through text-slate-400'
                              : 'text-slate-100'
                          }`}
                        >
                          {ev.titulo}
                        </p>
                        {ev.subtitulo && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {ev.subtitulo}
                          </p>
                        )}
                      </div>
                      {ev.completado && (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                          strokeWidth={1.75}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
