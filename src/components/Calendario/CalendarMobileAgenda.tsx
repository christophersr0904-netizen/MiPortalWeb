/**
 * ============================================================================
 * ARCHIVO: src/components/Calendario/CalendarMobileAgenda.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-01 (Vista Móvil Automática: Agenda + Tira Semanal Táctil)
 * ============================================================================
 */

import React from 'react';
import { Clock, Check, CalendarDays, Plus } from 'lucide-react';
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
  onToggleCompletar?: (evento: CalendarEventItem) => void;
  onCrearEnDia?: (fechaIso: string, anchor: PopoverAnchorPosition) => void;
}

function esCompletableEnAgenda(ev: CalendarEventItem): boolean {
  return ev.entidad === 'tarea' || ev.entidad === 'habito';
}

function obtenerPuntosDensidad(eventos: CalendarEventItem[]): string[] {
  if (eventos.length === 0) return [];
  const vistos = new Set<string>();
  const unicos: CalendarEventItem[] = [];
  const resto: CalendarEventItem[] = [];
  for (const ev of eventos) {
    if (!vistos.has(ev.entidad)) {
      vistos.add(ev.entidad);
      unicos.push(ev);
    } else {
      resto.push(ev);
    }
  }
  return [...unicos, ...resto]
    .slice(0, 3)
    .map((ev) => CALENDAR_ENTITY_STYLES[ev.entidad].dotClass);
}

export const CalendarMobileAgenda: React.FC<CalendarMobileAgendaProps> = ({
  fechasSemana,
  fechaSeleccionada,
  hoyIso,
  eventosPorFecha,
  onSelectDay,
  onSelectEvent,
  onToggleCompletar,
  onCrearEnDia
}) => {
  const bucket = eventosPorFecha.get(fechaSeleccionada);
  const allDayEvents = bucket?.allDay ?? [];
  const timedEvents = bucket?.timed ?? [];
  const sinEventos = allDayEvents.length === 0 && timedEvents.length === 0;

  const renderCheckTactil = (ev: CalendarEventItem) => {
    if (!onToggleCompletar || !esCompletableEnAgenda(ev)) return null;
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={ev.completado}
        aria-label={ev.completado ? `Reabrir ${ev.titulo}` : `Completar ${ev.titulo}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCompletar(ev);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
          }
        }}
        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition active:scale-90 cursor-pointer ${
          ev.completado
            ? 'bg-sky-500/25 border-sky-400/60 text-sky-300'
            : 'border-white/30 bg-transparent hover:border-sky-400 hover:bg-sky-500/15 text-transparent'
        }`}
      >
        {ev.completado && (
          <Check className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
        )}
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3 relative">
      {/* Tira Semanal Táctil Superior con Indicadores de Densidad (hasta 3 micro-puntos) */}
      <div className="grid grid-cols-7 gap-1 p-1.5 rounded-2xl bg-[#0D1526] border border-white/[0.06] shrink-0">
        {fechasSemana.map((fechaIso) => {
          const [y, m, d] = fechaIso.split('-').map(Number);
          const dt = new Date(y, m - 1, d, 12, 0, 0);
          const idxLun = (dt.getDay() + 6) % 7;
          const esSeleccionado = fechaIso === fechaSeleccionada;
          const esHoy = fechaIso === hoyIso;
          const b = eventosPorFecha.get(fechaIso);
          const todosDia = [...(b?.allDay ?? []), ...(b?.timed ?? [])];
          const puntos = obtenerPuntosDensidad(todosDia);

          return (
            <button
              key={`mob-${fechaIso}`}
              type="button"
              onClick={() => onSelectDay(fechaIso)}
              className={`min-h-[56px] py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                esSeleccionado
                  ? 'bg-sky-500/20 border border-sky-500/45 text-sky-200'
                  : esHoy
                  ? 'bg-sky-950/30 border border-sky-800/40 text-sky-300'
                  : 'border border-transparent text-slate-400 hover:bg-white/[0.03]'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {DIAS_SEMANA_CORTOS[idxLun]}
              </span>
              <span className="font-mono tabular-nums text-sm font-semibold">
                {String(d).padStart(2, '0')}
              </span>
              <div className="flex items-center justify-center gap-0.5 h-1.5 mt-0.5">
                {puntos.map((dotClass, idx) => (
                  <span
                    key={`${fechaIso}-dot-${idx}`}
                    className={`w-1 h-1 rounded-full ${dotClass}`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Lista Cronológica del Día Seleccionado */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pb-20">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {formatearFechaCortaEs(fechaSeleccionada)}
          </h3>
          <span className="font-mono tabular-nums text-[11px] text-slate-500">
            {allDayEvents.length + timedEvents.length} compromisos
          </span>
        </div>

        {sinEventos ? (
          <div className="py-12 px-4 rounded-2xl bg-[#0D1526]/60 border border-white/[0.06] flex flex-col items-center justify-center text-center gap-2">
            <CalendarDays className="w-7 h-7 text-slate-600" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-xs font-semibold text-slate-400">
              Agenda despejada para este día
            </p>
            <p className="text-[11px] text-slate-500">
              Toca otro día en la tira superior o pulsa + para agendar.
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
                    <div
                      key={ev.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) =>
                        onSelectEvent(ev, { x: e.clientX, y: e.clientY })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          onSelectEvent(ev, { x: rect.left + 12, y: rect.top + 12 });
                        }
                      }}
                      style={
                        ev.entidad === 'externo_gcal' ? EXTERNAL_GCAL_STRIPE_STYLE : undefined
                      }
                      className={`w-full p-3 rounded-xl border border-l-[3px] ${style.bgClass} ${style.hoverBgClass} ${style.borderClass} ${bordeEstado} flex items-center gap-2.5 text-left active:scale-[0.99] transition cursor-pointer ${
                        ev.completado ? 'opacity-50' : ''
                      }`}
                    >
                      {renderCheckTactil(ev)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold uppercase ${style.badgeClass}`}
                          >
                            {style.shortLabel}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 truncate">
                            {ev.codigoLegado}
                          </span>
                        </div>
                        <p
                          className={`text-xs font-semibold truncate ${
                            ev.completado
                              ? 'line-through text-slate-400'
                              : style.textClass
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
                    </div>
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
                    <div
                      key={ev.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) =>
                        onSelectEvent(ev, { x: e.clientX, y: e.clientY })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          onSelectEvent(ev, { x: rect.left + 12, y: rect.top + 12 });
                        }
                      }}
                      style={
                        ev.entidad === 'externo_gcal' ? EXTERNAL_GCAL_STRIPE_STYLE : undefined
                      }
                      className={`w-full p-3 rounded-xl border border-l-[3px] ${style.bgClass} ${style.hoverBgClass} ${style.borderClass} ${bordeEstado} flex items-start gap-2.5 text-left active:scale-[0.99] transition cursor-pointer ${
                        ev.completado ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex flex-col items-end shrink-0 w-11 pt-0.5">
                        <span className="font-mono tabular-nums text-xs font-semibold text-sky-300">
                          {ev.horaInicio}
                        </span>
                        <span className="font-mono tabular-nums text-[10px] text-slate-500">
                          {ev.horaFin}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold uppercase ${style.badgeClass}`}
                          >
                            {style.shortLabel}
                          </span>
                          <span className="inline-flex items-center gap-0.5 font-mono tabular-nums text-[10px] text-slate-500">
                            <Clock className="w-2.5 h-2.5" strokeWidth={1.75} aria-hidden="true" />
                            {ev.duracionMinutos}m
                          </span>
                        </div>
                        <p
                          className={`text-xs font-semibold leading-snug ${
                            ev.completado
                              ? 'line-through text-slate-400'
                              : style.textClass
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

                      <div className="pt-0.5 shrink-0">{renderCheckTactil(ev)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB Flotante Cobalt para Quick-Create de las 4 Entidades en Móvil (REQ-UX-CAL-11) */}
      {onCrearEnDia && (
        <button
          type="button"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onCrearEnDia(fechaSeleccionada, {
              x: Math.max(12, rect.left - 280),
              y: Math.max(72, rect.top - 260)
            });
          }}
          className="fixed bottom-20 right-4 z-[9980] w-11 h-11 rounded-full bg-sky-500/90 hover:bg-sky-400 active:scale-95 text-white border border-sky-300/30 shadow-lg shadow-sky-500/25 flex items-center justify-center transition cursor-pointer"
          aria-label={`Nuevo registro para ${formatearFechaCortaEs(fechaSeleccionada)}`}
          title="Nuevo registro en este día"
        >
          <Plus className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
