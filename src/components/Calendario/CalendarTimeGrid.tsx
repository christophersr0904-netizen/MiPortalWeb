/**
 * ============================================================================
 * ARCHIVO: src/components/Calendario/CalendarTimeGrid.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-01 & REQ-FEAT-CAL-02
 * DESCRIPCIÓN: Grilla Horaria 05:00-23:00 (Semana/Día) con Franja All-Day,
 *              Drag & Drop con snap 15 min, Resize inferior y Click-and-Drag
 *              para creación al vuelo.
 * ============================================================================
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import {
  snapMinutos15,
  minutosAHoraStr,
  type CalendarEventItem,
  type PositionedCalendarEvent,
  type CargaDiariaInfo
} from '../../hooks/useCalendarEngine';
import {
  CALENDAR_ENTITY_STYLES,
  DIAS_SEMANA_CORTOS,
  resolverBordeEstadoEvento
} from './calendarStyles';
import type { PopoverAnchorPosition } from './CalendarEventPopover';
import {
  CALENDAR_DRAG_MIME,
  type CalendarDragPayload
} from './CalendarBacklogPanel';

const HORA_INICIO_GRID = 5; // 05:00
const HORA_FIN_GRID = 23; // 23:00
const TOTAL_HORAS = HORA_FIN_GRID - HORA_INICIO_GRID + 1; // 19 slots (05:00..23:59)
const PIXELS_POR_HORA = 60; // 1px = 1 minuto

const HORAS_LIST = Array.from({ length: TOTAL_HORAS }, (_, i) => HORA_INICIO_GRID + i);

export interface EmptySlotSelection {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  anchor: PopoverAnchorPosition;
}

interface DropPreviewState {
  fechaIso: string;
  startMinutes: number;
  duracionMinutos: number;
  titulo: string;
}

interface ResizeState {
  evento: PositionedCalendarEvent;
  startY: number;
  initialDuration: number;
  currentDuration: number;
}

interface CreateDragState {
  fechaIso: string;
  anchorMin: number;
  currentMin: number;
  startY: number;
  hasDragged: boolean;
}

interface CalendarTimeGridProps {
  fechas: string[];
  hoyIso: string;
  eventosPorFecha: Map<
    string,
    { allDay: CalendarEventItem[]; timed: PositionedCalendarEvent[] }
  >;
  cargaDiariaPorFecha: Record<string, CargaDiariaInfo>;
  activeDragPayload: CalendarDragPayload | null;
  onDragStartEvent: (payload: CalendarDragPayload) => void;
  onDragEndEvent: () => void;
  onDropItem: (
    payload: CalendarDragPayload,
    nuevaFecha: string,
    nuevaHoraInicio: string
  ) => void;
  onResizeEvent: (evento: CalendarEventItem, nuevaDuracionMinutos: number) => void;
  onSelectEmptySlot: (slot: EmptySlotSelection) => void;
  onSelectEvent: (evento: CalendarEventItem, anchor: PopoverAnchorPosition) => void;
  onSelectDay?: (fechaIso: string) => void;
}

function esEventoEditableEnGrilla(ev: CalendarEventItem): boolean {
  return ev.entidad === 'tarea' || ev.entidad === 'actividad' || ev.entidad === 'habito';
}

export const CalendarTimeGrid: React.FC<CalendarTimeGridProps> = ({
  fechas,
  hoyIso,
  eventosPorFecha,
  cargaDiariaPorFecha,
  activeDragPayload,
  onDragStartEvent,
  onDragEndEvent,
  onDropItem,
  onResizeEvent,
  onSelectEmptySlot,
  onSelectEvent,
  onSelectDay
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const suppressNextClickRef = useRef(false);

  const [allDayExpandido, setAllDayExpandido] = useState(true);
  const [dropPreview, setDropPreview] = useState<DropPreviewState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [createDrag, setCreateDrag] = useState<CreateDragState | null>(null);

  const [minutosAhora, setMinutosAhora] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Actualizar línea de hora actual en vivo cada 60 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setMinutosAhora(now.getHours() * 60 + now.getMinutes());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Scroll inicial automático a la hora actual
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const minDesdeInicio = Math.max(0, minutosAhora - HORA_INICIO_GRID * 60 - 60);
    el.scrollTop = minDesdeInicio;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpiar preview cuando termina el drag externo/interno
  useEffect(() => {
    if (!activeDragPayload) {
      setDropPreview(null);
    }
  }, [activeDragPayload]);

  // Listeners globales para Resize inferior (snap 15m, mínimo 15m)
  useEffect(() => {
    if (!resizeState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaMin = e.clientY - resizeState.startY;
      const maxDur = 24 * 60 - resizeState.evento.startMinutes;
      const snappedDur = snapMinutos15(
        resizeState.initialDuration + deltaMin,
        15,
        Math.max(15, maxDur)
      );
      setResizeState((prev) =>
        prev ? { ...prev, currentDuration: snappedDur } : null
      );
    };

    const handlePointerUp = () => {
      suppressNextClickRef.current = true;
      setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 150);

      if (resizeState.currentDuration !== resizeState.initialDuration) {
        onResizeEvent(resizeState.evento, resizeState.currentDuration);
      }
      setResizeState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [resizeState, onResizeEvent]);

  // Listeners globales para Click-and-Drag en espacio vacío (Creación al vuelo)
  useEffect(() => {
    if (!createDrag) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaY = e.clientY - createDrag.startY;
      const hasDragged = createDrag.hasDragged || Math.abs(deltaY) >= 6;
      const nextMin = snapMinutos15(
        createDrag.anchorMin + deltaY,
        HORA_INICIO_GRID * 60,
        24 * 60
      );
      setCreateDrag((prev) =>
        prev ? { ...prev, currentMin: nextMin, hasDragged } : null
      );
    };

    const handlePointerUp = (e: PointerEvent) => {
      const startMin = Math.min(createDrag.anchorMin, createDrag.currentMin);
      const rawEnd = Math.max(createDrag.anchorMin, createDrag.currentMin);
      const endMin = Math.min(
        24 * 60,
        rawEnd - startMin < 15 ? startMin + 30 : rawEnd
      );
      const duracionMinutos = Math.max(15, endMin - startMin);

      if (createDrag.hasDragged) {
        onSelectEmptySlot({
          fecha: createDrag.fechaIso,
          horaInicio: minutosAHoraStr(startMin),
          horaFin: endMin >= 24 * 60 ? '23:59' : minutosAHoraStr(endMin),
          duracionMinutos,
          anchor: { x: e.clientX, y: e.clientY }
        });
      }
      setCreateDrag(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [createDrag, onSelectEmptySlot]);

  const totalAllDay = fechas.reduce(
    (acc, f) => acc + (eventosPorFecha.get(f)?.allDay.length ?? 0),
    0
  );

  const esVistaDia = fechas.length === 1;
  const lineaAhoraTop = minutosAhora - HORA_INICIO_GRID * 60;
  const mostrarLineaAhora =
    lineaAhoraTop >= 0 && lineaAhoraTop <= TOTAL_HORAS * PIXELS_POR_HORA;

  const calcularMinutosDesdeEvento = (
    e: React.DragEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>
  ): number => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = Math.max(0, e.clientY - rect.top);
    return snapMinutos15(HORA_INICIO_GRID * 60 + offsetY, HORA_INICIO_GRID * 60, 23 * 60 + 45);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#040711] rounded-2xl border border-slate-800/50 overflow-hidden shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8)]">
      {/* 1. Cabecera de Días */}
      <div
        className="grid border-b border-slate-800/70 bg-[#0D1526]/90 shrink-0"
        style={{ gridTemplateColumns: `60px repeat(${fechas.length}, minmax(0, 1fr))` }}
      >
        <div className="flex items-center justify-center border-r border-slate-800/60 text-[10px] font-mono text-slate-500">
          GMT-5
        </div>
        {fechas.map((fechaIso) => {
          const [y, m, d] = fechaIso.split('-').map(Number);
          const dt = new Date(y, m - 1, d, 12, 0, 0);
          const idxLun = (dt.getDay() + 6) % 7;
          const esHoy = fechaIso === hoyIso;
          const totalDia =
            (eventosPorFecha.get(fechaIso)?.allDay.length ?? 0) +
            (eventosPorFecha.get(fechaIso)?.timed.length ?? 0);
          const carga = cargaDiariaPorFecha[fechaIso];
          const barColor =
            carga?.nivel === 'sobrecarga'
              ? 'bg-rose-400'
              : carga?.nivel === 'alta'
              ? 'bg-amber-400'
              : 'bg-sky-400';
          const textCargaColor =
            carga?.nivel === 'sobrecarga'
              ? 'text-rose-400'
              : carga?.nivel === 'alta'
              ? 'text-amber-300'
              : 'text-slate-400';

          return (
            <button
              key={fechaIso}
              type="button"
              onClick={() => onSelectDay?.(fechaIso)}
              className={`py-2 px-2 border-r last:border-r-0 border-slate-800/50 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                esHoy ? 'bg-sky-950/25' : 'hover:bg-white/[0.02]'
              }`}
              title={
                carga
                  ? `Carga diaria: ${carga.horasComprometidas}h / ${carga.capacidadHoras}h (${carga.porcentaje}%)`
                  : undefined
              }
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  esHoy ? 'text-sky-400' : 'text-slate-400'
                }`}
              >
                {DIAS_SEMANA_CORTOS[idxLun]}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono tabular-nums text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center ${
                    esHoy
                      ? 'bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.45)]'
                      : 'text-slate-200'
                  }`}
                >
                  {String(d).padStart(2, '0')}
                </span>
                {esVistaDia && totalDia > 0 && (
                  <span className="text-[10px] font-mono tabular-nums text-slate-400">
                    ({totalDia} eventos)
                  </span>
                )}
              </div>

              {/* Indicador compacto de Carga Diaria (REQ-FEAT-CAL-03) */}
              {carga && (
                <div className="w-full max-w-[92px] flex flex-col items-center gap-0.5 mt-0.5">
                  <span className={`font-mono tabular-nums text-[9px] leading-none ${textCargaColor}`}>
                    {carga.horasComprometidas}h / {carga.capacidadHoras}h
                  </span>
                  <div className="w-full h-[2px] rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, carga.porcentaje))}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Franja Superior Colapsable: All-Day / Hitos / Finanzas */}
      <div className="border-b border-slate-800/70 bg-[#080E1C] shrink-0">
        <div
          className="grid"
          style={{ gridTemplateColumns: `60px repeat(${fechas.length}, minmax(0, 1fr))` }}
        >
          <button
            type="button"
            onClick={() => setAllDayExpandido((prev) => !prev)}
            className="flex flex-col items-center justify-center gap-0.5 py-2 border-r border-slate-800/60 text-[10px] font-mono text-slate-400 hover:text-sky-300 hover:bg-white/[0.03] transition cursor-pointer"
            title={
              allDayExpandido
                ? 'Colapsar franja Todo el día / Hitos'
                : 'Expandir franja Todo el día / Hitos'
            }
          >
            <div className="flex items-center gap-0.5">
              {allDayExpandido ? (
                <ChevronDown className="w-3 h-3" strokeWidth={1.75} />
              ) : (
                <ChevronRight className="w-3 h-3" strokeWidth={1.75} />
              )}
              <span>Día</span>
            </div>
            {totalAllDay > 0 && (
              <span className="text-[9px] font-mono tabular-nums px-1.5 rounded-full bg-slate-800 text-sky-300">
                {totalAllDay}
              </span>
            )}
          </button>

          {fechas.map((fechaIso) => {
            const listaAllDay = eventosPorFecha.get(fechaIso)?.allDay ?? [];
            const esHoy = fechaIso === hoyIso;
            const visibles = allDayExpandido ? listaAllDay : listaAllDay.slice(0, 1);
            const ocultos = listaAllDay.length - visibles.length;

            return (
              <div
                key={`allday-${fechaIso}`}
                className={`p-1.5 border-r last:border-r-0 border-slate-800/40 flex flex-col gap-1 min-h-[38px] max-h-[120px] overflow-y-auto custom-scrollbar ${
                  esHoy ? 'bg-sky-950/10' : ''
                }`}
              >
                {visibles.map((ev) => {
                  const style = CALENDAR_ENTITY_STYLES[ev.entidad];
                  const bordeEstado = resolverBordeEstadoEvento(ev);
                  const editable = esEventoEditableEnGrilla(ev);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      draggable={editable}
                      onDragStart={(e) => {
                        if (!editable) return;
                        const payload: CalendarDragPayload = {
                          kind: 'existing-event',
                          id: ev.id,
                          titulo: ev.titulo,
                          duracionMinutos: ev.duracionMinutos ?? 60
                        };
                        e.dataTransfer.setData(CALENDAR_DRAG_MIME, JSON.stringify(payload));
                        e.dataTransfer.setData('text/plain', ev.titulo);
                        e.dataTransfer.effectAllowed = 'move';
                        onDragStartEvent(payload);
                      }}
                      onDragEnd={onDragEndEvent}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev, { x: e.clientX, y: e.clientY });
                      }}
                      className={`w-full text-left px-1.5 py-1 rounded-md border border-l-[3px] ${style.bgClass} ${style.hoverBgClass} ${style.borderClass} ${bordeEstado} transition cursor-pointer flex items-center gap-1 min-w-0 ${
                        ev.completado ? 'opacity-50' : ''
                      }`}
                      title={`${ev.titulo}${ev.subtitulo ? ` — ${ev.subtitulo}` : ''}`}
                    >
                      {ev.completado && (
                        <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" strokeWidth={2.5} />
                      )}
                      <span
                        className={`text-[10px] font-semibold truncate ${style.textClass} ${
                          ev.completado ? 'line-through' : ''
                        }`}
                      >
                        {ev.titulo}
                      </span>
                    </button>
                  );
                })}
                {!allDayExpandido && ocultos > 0 && (
                  <button
                    type="button"
                    onClick={() => setAllDayExpandido(true)}
                    className="text-[10px] font-mono tabular-nums text-sky-400 hover:text-sky-300 text-left px-1 cursor-pointer"
                  >
                    +{ocultos} más
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Cuerpo Horario con Scroll (05:00 - 23:00) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar relative"
      >
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `60px repeat(${fechas.length}, minmax(0, 1fr))`,
            height: `${TOTAL_HORAS * PIXELS_POR_HORA}px`
          }}
        >
          {/* Columna de Etiquetas Horarias */}
          <div className="border-r border-slate-800/60 bg-[#060B17] relative select-none">
            {HORAS_LIST.map((hora, idx) => (
              <div
                key={hora}
                style={{ top: `${idx * PIXELS_POR_HORA}px`, height: `${PIXELS_POR_HORA}px` }}
                className="absolute inset-x-0 flex justify-end pr-2 pt-0.5"
              >
                <span className="font-mono tabular-nums text-[10px] text-slate-500 -translate-y-2">
                  {String(hora).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Columnas de Días (Drop Zones + Click-and-Drag) */}
          {fechas.map((fechaIso) => {
            const eventosDia = eventosPorFecha.get(fechaIso)?.timed ?? [];
            const esHoy = fechaIso === hoyIso;
            const previewEnEstaColumna =
              dropPreview && dropPreview.fechaIso === fechaIso ? dropPreview : null;
            const createEnEstaColumna =
              createDrag && createDrag.fechaIso === fechaIso && createDrag.hasDragged
                ? createDrag
                : null;

            return (
              <div
                key={`col-${fechaIso}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  const snappedMin = calcularMinutosDesdeEvento(e);
                  const dur = activeDragPayload?.duracionMinutos ?? 60;
                  const titulo = activeDragPayload?.titulo ?? 'Agendar aquí';
                  setDropPreview((prev) =>
                    prev &&
                    prev.fechaIso === fechaIso &&
                    prev.startMinutes === snappedMin
                      ? prev
                      : { fechaIso, startMinutes: snappedMin, duracionMinutos: dur, titulo }
                  );
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setDropPreview((prev) => (prev?.fechaIso === fechaIso ? null : prev));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const snappedMin = calcularMinutosDesdeEvento(e);
                  const horaInicio = minutosAHoraStr(snappedMin);
                  setDropPreview(null);

                  let parsed: CalendarDragPayload | null = activeDragPayload;
                  const rawJson = e.dataTransfer.getData(CALENDAR_DRAG_MIME);
                  if (rawJson) {
                    try {
                      const obj = JSON.parse(rawJson) as Partial<CalendarDragPayload>;
                      if (
                        (obj.kind === 'backlog-tarea' || obj.kind === 'existing-event') &&
                        typeof obj.id === 'string'
                      ) {
                        parsed = {
                          kind: obj.kind,
                          id: obj.id,
                          titulo: typeof obj.titulo === 'string' ? obj.titulo : '',
                          duracionMinutos:
                            typeof obj.duracionMinutos === 'number' ? obj.duracionMinutos : 60
                        };
                      }
                    } catch {
                      // Usar activeDragPayload como respaldo
                    }
                  }

                  if (parsed) {
                    onDropItem(parsed, fechaIso, horaInicio);
                  }
                  onDragEndEvent();
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  if ((e.target as HTMLElement).closest('[data-calendar-event="true"]')) return;
                  const anchorMin = calcularMinutosDesdeEvento(e);
                  setCreateDrag({
                    fechaIso,
                    anchorMin,
                    currentMin: anchorMin + 30,
                    startY: e.clientY,
                    hasDragged: false
                  });
                }}
                className={`relative border-r last:border-r-0 border-slate-800/40 ${
                  esHoy ? 'bg-sky-950/[0.07]' : ''
                }`}
              >
                {/* Líneas horizontales horarias y de media hora */}
                {HORAS_LIST.map((hora, idx) => (
                  <div
                    key={`line-${fechaIso}-${hora}`}
                    style={{ top: `${idx * PIXELS_POR_HORA}px`, height: `${PIXELS_POR_HORA}px` }}
                    className="absolute inset-x-0 border-t border-slate-800/45 pointer-events-none"
                  >
                    <div className="w-full h-1/2 border-b border-slate-800/20 border-dashed" />
                  </div>
                ))}

                {/* Indicador Fantasma (Drop Preview Cobalt con hora exacta) */}
                {previewEnEstaColumna && (
                  <div
                    style={{
                      top: `${Math.max(0, previewEnEstaColumna.startMinutes - HORA_INICIO_GRID * 60)}px`,
                      height: `${Math.max(24, previewEnEstaColumna.duracionMinutos)}px`
                    }}
                    className="absolute inset-x-1 z-30 rounded-lg bg-sky-500/20 border border-dashed border-sky-400/80 shadow-[0_0_16px_rgba(56,189,248,0.22)] px-2 py-1 pointer-events-none flex flex-col justify-start"
                  >
                    <span className="font-mono tabular-nums text-[10px] font-bold text-sky-300">
                      {minutosAHoraStr(previewEnEstaColumna.startMinutes)} –{' '}
                      {minutosAHoraStr(
                        Math.min(
                          23 * 60 + 59,
                          previewEnEstaColumna.startMinutes + previewEnEstaColumna.duracionMinutos
                        )
                      )}
                    </span>
                    <span className="text-[10px] font-semibold text-sky-100 truncate">
                      {previewEnEstaColumna.titulo}
                    </span>
                  </div>
                )}

                {/* Bloque de Selección en Vivo (Click-and-Drag creación al vuelo) */}
                {createEnEstaColumna && (() => {
                  const sMin = Math.min(createEnEstaColumna.anchorMin, createEnEstaColumna.currentMin);
                  const eMinRaw = Math.max(createEnEstaColumna.anchorMin, createEnEstaColumna.currentMin);
                  const eMin = Math.min(24 * 60, eMinRaw - sMin < 15 ? sMin + 30 : eMinRaw);
                  const topPx = Math.max(0, sMin - HORA_INICIO_GRID * 60);
                  const heightPx = Math.max(22, eMin - sMin);

                  return (
                    <div
                      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                      className="absolute inset-x-1 z-30 rounded-lg bg-sky-500/20 border border-sky-400/80 shadow-[0_0_18px_rgba(56,189,248,0.25)] px-2 py-1 pointer-events-none flex flex-col justify-start"
                    >
                      <span className="font-mono tabular-nums text-[10px] font-bold text-sky-200">
                        {minutosAHoraStr(sMin)} – {eMin >= 24 * 60 ? '23:59' : minutosAHoraStr(eMin)}
                      </span>
                      <span className="text-[10px] text-sky-300/90">
                        Nuevo bloque ({eMin - sMin} min)
                      </span>
                    </div>
                  );
                })()}

                {/* Línea de Hora Actual en Vivo */}
                {esHoy && mostrarLineaAhora && (
                  <div
                    style={{ top: `${lineaAhoraTop}px` }}
                    className="absolute inset-x-0 z-20 pointer-events-none flex items-center"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shadow-[0_0_8px_rgba(244,63,94,0.85)]" />
                    <div className="flex-1 h-[1.5px] bg-rose-500/85 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                  </div>
                )}

                {/* Eventos Posicionados con Resolución de Solapamiento + DnD + Resize */}
                {eventosDia.map((ev) => {
                  const estaRedimensionando = resizeState?.evento.id === ev.id;
                  const minInicioVisible = HORA_INICIO_GRID * 60;
                  const minFinVisible = (HORA_FIN_GRID + 1) * 60;
                  const effectiveEnd = estaRedimensionando
                    ? Math.min(24 * 60, ev.startMinutes + resizeState.currentDuration)
                    : ev.endMinutes;

                  const topClamped = Math.max(0, ev.startMinutes - minInicioVisible);
                  const endClamped = Math.min(minFinVisible, effectiveEnd);
                  const heightPx = Math.max(
                    24,
                    endClamped - Math.max(minInicioVisible, ev.startMinutes)
                  );

                  const widthPct = 100 / ev.totalColumns;
                  const leftPct = ev.columnIndex * widthPct;

                  const style = CALENDAR_ENTITY_STYLES[ev.entidad];
                  const bordeEstado = resolverBordeEstadoEvento(ev);
                  const editable = esEventoEditableEnGrilla(ev);
                  const compacto = heightPx < 44;

                  const horaFinMostrada = estaRedimensionando
                    ? effectiveEnd >= 24 * 60
                      ? '23:59'
                      : minutosAHoraStr(effectiveEnd)
                    : ev.horaFin;

                  return (
                    <div
                      key={ev.id}
                      data-calendar-event="true"
                      role="button"
                      tabIndex={0}
                      draggable={editable && !estaRedimensionando}
                      onDragStart={(e) => {
                        if (!editable || estaRedimensionando) {
                          e.preventDefault();
                          return;
                        }
                        const payload: CalendarDragPayload = {
                          kind: 'existing-event',
                          id: ev.id,
                          titulo: ev.titulo,
                          duracionMinutos: ev.duracionMinutos ?? Math.max(30, ev.endMinutes - ev.startMinutes)
                        };
                        e.dataTransfer.setData(CALENDAR_DRAG_MIME, JSON.stringify(payload));
                        e.dataTransfer.setData('text/plain', ev.titulo);
                        e.dataTransfer.effectAllowed = 'move';
                        onDragStartEvent(payload);
                      }}
                      onDragEnd={onDragEndEvent}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (suppressNextClickRef.current) return;
                        onSelectEvent(ev, { x: e.clientX, y: e.clientY });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          onSelectEvent(ev, { x: rect.left + 12, y: rect.top + 12 });
                        }
                      }}
                      style={{
                        top: `${topClamped}px`,
                        height: `${heightPx}px`,
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`
                      }}
                      className={`group/ev absolute rounded-lg border border-l-[3px] px-2 py-1 text-left overflow-hidden transition-[background-color,opacity,box-shadow] duration-100 flex flex-col justify-start select-none ${
                        estaRedimensionando
                          ? 'z-40 ring-1 ring-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.3)]'
                          : 'z-10'
                      } ${style.bgClass} ${style.hoverBgClass} ${style.borderClass} ${bordeEstado} ${
                        editable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                      } ${ev.completado ? 'opacity-50' : 'shadow-xs'}`}
                      title={`${ev.horaInicio}–${horaFinMostrada} · ${ev.titulo}`}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-mono tabular-nums text-[9px] text-slate-400 shrink-0">
                          {estaRedimensionando
                            ? `${ev.horaInicio}–${horaFinMostrada}`
                            : ev.horaInicio}
                        </span>
                        <span
                          className={`text-[11px] font-bold truncate leading-tight ${style.textClass} ${
                            ev.completado ? 'line-through' : ''
                          }`}
                        >
                          {ev.titulo}
                        </span>
                      </div>
                      {!compacto && ev.subtitulo && (
                        <span className="text-[10px] text-slate-400 truncate mt-0.5">
                          {estaRedimensionando
                            ? `${resizeState.currentDuration} min`
                            : ev.subtitulo}
                        </span>
                      )}

                      {/* Manejador Discreto de Resize Inferior (snap 15 min) */}
                      {editable && (
                        <div
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const initialDuration = Math.max(
                              15,
                              ev.duracionMinutos ?? ev.endMinutes - ev.startMinutes
                            );
                            setResizeState({
                              evento: ev,
                              startY: e.clientY,
                              initialDuration,
                              currentDuration: initialDuration
                            });
                          }}
                          className="absolute bottom-0 inset-x-0 h-2 cursor-ns-resize flex items-end justify-center pb-0.5 opacity-0 group-hover/ev:opacity-100 transition-opacity"
                          title="Arrastra para ajustar duración (snap 15m)"
                        >
                          <span className="w-7 h-[2px] rounded-full bg-sky-300/70" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
