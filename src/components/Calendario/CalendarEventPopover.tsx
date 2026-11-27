/**
 * ============================================================================
 * ARCHIVO: src/components/Calendario/CalendarEventPopover.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-01 (Popover Ligero de Acción Rápida + Pomodoro)
 * ============================================================================
 */

import React, { useEffect, useRef } from 'react';
import {
  X,
  Clock,
  Calendar,
  Play,
  CheckCircle2,
  Circle,
  ExternalLink,
  CalendarCheck,
  MapPin,
  Video,
  Inbox,
  CheckSquare,
  Activity,
  Flame,
  Flag,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import type { CalendarEntityType, CalendarEventItem } from '../../hooks/useCalendarEngine';
import {
  CALENDAR_ENTITY_STYLES,
  formatearFechaCortaEs,
  resolverBordeEstadoEvento
} from './calendarStyles';

function renderIconoEntidadPopover(entidad: CalendarEntityType, colorClass: string) {
  const cls = `w-3.5 h-3.5 shrink-0 ${colorClass}`;
  switch (entidad) {
    case 'tarea':
      return <CheckSquare className={cls} strokeWidth={1.75} aria-hidden="true" />;
    case 'actividad':
      return <Activity className={cls} strokeWidth={1.75} aria-hidden="true" />;
    case 'habito':
      return <Flame className={cls} strokeWidth={1.75} aria-hidden="true" />;
    case 'hito':
      return <Flag className={cls} strokeWidth={1.75} aria-hidden="true" />;
    case 'gasto':
      return <TrendingDown className={cls} strokeWidth={1.75} aria-hidden="true" />;
    case 'ingreso':
      return <TrendingUp className={cls} strokeWidth={1.75} aria-hidden="true" />;
    case 'externo_gcal':
      return <Calendar className={cls} strokeWidth={1.75} aria-hidden="true" />;
  }
}

export interface PopoverAnchorPosition {
  x: number;
  y: number;
}

interface CalendarEventPopoverProps {
  evento: CalendarEventItem | null;
  anchor: PopoverAnchorPosition | null;
  onClose: () => void;
  onIniciarPomodoro: (evento: CalendarEventItem) => void;
  onToggleCompletar: (evento: CalendarEventItem) => void;
  onVerEditar: (evento: CalendarEventItem) => void;
  onDevolverABacklog?: (evento: CalendarEventItem) => void;
  procesandoCompletado?: boolean;
}

export const CalendarEventPopover: React.FC<CalendarEventPopoverProps> = ({
  evento,
  anchor,
  onClose,
  onIniciarPomodoro,
  onToggleCompletar,
  onVerEditar,
  onDevolverABacklog,
  procesandoCompletado = false
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!evento) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [evento, onClose]);

  if (!evento || !anchor) return null;

  const estilo = CALENDAR_ENTITY_STYLES[evento.entidad];
  const bordeIzq = resolverBordeEstadoEvento(evento);
  const soportaPomodoro =
    evento.entidad === 'tarea' ||
    evento.entidad === 'actividad' ||
    evento.entidad === 'habito';

  // Clamp seguro dentro del viewport para evitar desbordes
  const width = 304;
  const estHeight = 220;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  const left = Math.max(12, Math.min(anchor.x, vw - width - 12));
  const top =
    anchor.y + estHeight + 16 > vh
      ? Math.max(12, anchor.y - estHeight - 10)
      : Math.max(12, anchor.y + 8);

  const estadoLegible = evento.completado
    ? 'Completado'
    : (evento.estado || 'Pendiente').replace(/^\d+_/, '').replace(/_/g, ' ');

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`Detalle de ${evento.titulo}`}
      style={{ top, left, width }}
      className={`fixed z-[9995] bg-[#0B1221]/95 backdrop-blur-xl border border-white/[0.08] border-l-[3px] ${bordeIzq} rounded-xl shadow-2xl shadow-black/50 p-3.5 text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100`}
    >
      {/* Cabecera: Micro-badge editorial de entidad + Código + Cerrar */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300 shrink-0">
            {renderIconoEntidadPopover(evento.entidad, estilo.iconColorClass)}
            <span>{estilo.shortLabel}</span>
          </span>
          {evento.codigoLegado && (
            <>
              <span className="text-slate-600 text-[10px]">·</span>
              <span className="font-mono tabular-nums text-[10px] text-slate-500 truncate">
                {evento.codigoLegado}
              </span>
            </>
          )}
          {evento.agendadoCalendar && (
            <span
              className="text-sky-400 shrink-0"
              title="Sincronizado con Google Calendar"
            >
              <CalendarCheck className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-6 w-6 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] flex items-center justify-center transition cursor-pointer shrink-0"
          aria-label="Cerrar detalle"
          title="Cerrar (Esc)"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      {/* Título y subtítulo */}
      <h4
        className={`text-sm font-semibold leading-snug tracking-tight mb-1 ${
          evento.completado ? 'line-through text-slate-400' : 'text-slate-100'
        }`}
      >
        {evento.titulo}
      </h4>

      {evento.subtitulo && (
        <p className="text-[11px] text-slate-400 mb-2.5 truncate">
          {evento.subtitulo}
        </p>
      )}

      {/* Metadatos de Fecha, Horario y Estado */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400 pb-3 mb-3 border-b border-white/[0.06]">
        <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {formatearFechaCortaEs(evento.fecha)}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {evento.allDay
            ? 'Todo el día'
            : `${evento.horaInicio || '--:--'} – ${evento.horaFin || '--:--'}`}
        </span>
        <span
          className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono ${
            evento.completado
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'bg-white/[0.05] text-slate-300'
          }`}
        >
          {estadoLegible}
        </span>
      </div>

      {/* Acciones Rápidas (Solo-Lectura para externo_gcal vs Acciones PMO Jerarquizadas) */}
      {evento.rawRef.kind === 'externo_gcal' ? (
        <div className="flex flex-col gap-1.5">
          {evento.rawRef.record.location && (
            <div className="flex items-start gap-1.5 text-[11px] text-slate-300 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
              <span className="break-words leading-snug">{evento.rawRef.record.location}</span>
            </div>
          )}

          {evento.rawRef.record.hangoutLink && (
            <a
              href={evento.rawRef.record.hangoutLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-8 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5 transition"
            >
              <Video className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Unirse a la reunión</span>
            </a>
          )}

          {evento.rawRef.record.htmlLink && (
            <a
              href={evento.rawRef.record.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-8 px-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] text-slate-300 hover:text-sky-300 text-xs font-medium flex items-center justify-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Abrir en Google Calendar</span>
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {soportaPomodoro && (
            <button
              type="button"
              onClick={() => onIniciarPomodoro(evento)}
              className="w-full h-8 px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 hover:text-sky-200 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98]"
              title="Iniciar sesión Pomodoro de enfoque para este bloque"
            >
              <Play className="w-3.5 h-3.5 fill-current" strokeWidth={1.75} aria-hidden="true" />
              <span>Iniciar Pomodoro</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              disabled={procesandoCompletado}
              onClick={() => onToggleCompletar(evento)}
              title={evento.completado ? 'Marcar como pendiente' : 'Marcar como completado'}
              className={`h-7 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                evento.completado
                  ? 'bg-transparent hover:bg-white/[0.06] border-transparent hover:border-white/[0.07] text-slate-300'
                  : 'bg-transparent hover:bg-emerald-500/12 border-transparent hover:border-emerald-500/25 text-emerald-300'
              }`}
            >
              {evento.completado ? (
                <Circle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              )}
              <span>{evento.completado ? 'Reabrir' : 'Completar'}</span>
            </button>

            <button
              type="button"
              onClick={() => onVerEditar(evento)}
              title="Abrir ficha completa para ver o editar"
              className="h-7 px-2 rounded-lg bg-transparent hover:bg-white/[0.06] border border-transparent hover:border-white/[0.07] text-slate-300 hover:text-sky-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>Ver / Editar</span>
            </button>
          </div>

          {/* Devolver tarea agendada a "Por Agendar" (REQ-UX-CAL-05) */}
          {evento.rawRef.kind === 'tarea' && !evento.allDay && Boolean(evento.horaInicio) && onDevolverABacklog && (
            <button
              type="button"
              onClick={() => onDevolverABacklog(evento)}
              className="w-full h-7 px-2 rounded-lg bg-transparent hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] text-slate-400 hover:text-amber-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Quitar horario y devolver esta tarea al panel Por Agendar"
            >
              <Inbox className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>Devolver a Por Agendar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
