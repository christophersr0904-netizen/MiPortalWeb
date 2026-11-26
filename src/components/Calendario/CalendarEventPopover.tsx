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
  Inbox
} from 'lucide-react';
import type { CalendarEventItem } from '../../hooks/useCalendarEngine';
import {
  CALENDAR_ENTITY_STYLES,
  formatearFechaCortaEs,
  resolverBordeEstadoEvento
} from './calendarStyles';

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
      className={`fixed z-[9995] rounded-2xl bg-[#0D1526] border border-slate-800/80 border-l-[3px] ${bordeIzq} shadow-[0_14px_35px_-5px_rgba(2,6,23,0.92),0_8px_15px_-6px_rgba(30,58,138,0.28)] p-3.5 text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100`}
    >
      {/* Cabecera: Badge Entidad + Código + Cerrar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider shrink-0 ${estilo.badgeClass}`}
          >
            {estilo.shortLabel}
          </span>
          <span className="font-mono tabular-nums text-[10px] text-slate-400 truncate">
            {evento.codigoLegado}
          </span>
          {evento.agendadoCalendar && (
            <span
              className="text-sky-400 shrink-0"
              title="Sincronizado con Google Calendar"
            >
              <CalendarCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition cursor-pointer shrink-0"
          aria-label="Cerrar detalle"
          title="Cerrar (Esc)"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Título y subtítulo */}
      <h4
        className={`text-sm font-bold leading-snug mb-1.5 ${
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400 pb-3 mb-3 border-b border-slate-800/70">
        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
          <Calendar className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
          {formatearFechaCortaEs(evento.fecha)}
        </span>
        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
          <Clock className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
          {evento.allDay
            ? 'Todo el día'
            : `${evento.horaInicio || '--:--'} – ${evento.horaFin || '--:--'}`}
        </span>
        <span
          className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono ${
            evento.completado
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'bg-slate-800/80 text-slate-300'
          }`}
        >
          {estadoLegible}
        </span>
      </div>

      {/* Acciones Rápidas (Solo-Lectura para externo_gcal vs Acciones PMO) */}
      {evento.rawRef.kind === 'externo_gcal' ? (
        <div className="flex flex-col gap-2">
          {evento.rawRef.record.location && (
            <div className="flex items-start gap-1.5 text-[11px] text-slate-300 bg-[#040711]/70 border border-slate-800/70 rounded-xl px-2.5 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" strokeWidth={1.75} />
              <span className="break-words leading-snug">{evento.rawRef.record.location}</span>
            </div>
          )}

          {evento.rawRef.record.hangoutLink && (
            <a
              href={evento.rawRef.record.hangoutLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Video className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Unirse a la reunión</span>
            </a>
          )}

          {evento.rawRef.record.htmlLink && (
            <a
              href={evento.rawRef.record.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-slate-800/80 text-slate-200 hover:text-sky-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
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
              className="w-full px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 hover:text-sky-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-current" strokeWidth={1.75} />
              <span>Iniciar Pomodoro</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={procesandoCompletado}
              onClick={() => onToggleCompletar(evento)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                evento.completado
                  ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {evento.completado ? (
                <Circle className="w-3.5 h-3.5" strokeWidth={1.75} />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              )}
              <span>{evento.completado ? 'Reabrir' : 'Completar'}</span>
            </button>

            <button
              type="button"
              onClick={() => onVerEditar(evento)}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-slate-800/80 text-slate-300 hover:text-sky-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Ver / Editar</span>
            </button>
          </div>

          {/* Devolver tarea agendada a "Por Agendar" (REQ-UX-CAL-05) */}
          {evento.rawRef.kind === 'tarea' && !evento.allDay && Boolean(evento.horaInicio) && onDevolverABacklog && (
            <button
              type="button"
              onClick={() => onDevolverABacklog(evento)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-transparent hover:bg-white/[0.05] text-slate-400 hover:text-amber-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer mt-0.5"
              title="Quitar horario y devolver esta tarea al panel Por Agendar"
            >
              <Inbox className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Devolver a Por Agendar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
