/**
 * ============================================================================
 * ARCHIVO: src/components/Views/ViewCalendario.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-01 & REQ-FEAT-CAL-02
 * DESCRIPCIÓN: Vista dedicada de Calendario Maestro (Semana, Día, Mes y Agenda
 *              Móvil) con Time-Blocking Pro: Panel "Por Agendar", Drag & Drop
 *              (snap 15m), Resize inferior, Click-and-Drag y Popover Pomodoro.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  X,
  Timer,
  Inbox,
  Plus,
  Clock,
  CheckSquare,
  Activity,
  RefreshCw
} from 'lucide-react';
import {
  useCalendarEngine,
  obtenerRangoVisible,
  type CalendarEntityType,
  type CalendarEventItem,
  type CalendarViewMode
} from '../../hooks/useCalendarEngine';
import { useCockpitPomodoro } from '../../hooks/useCockpitPomodoro';
import type { DailyScheduleItem } from '../../hooks/useDailySchedule';
import { formatFechaIsoLocal } from '../../utils/timeFormatters';
import { mostrarToastCobalt } from '../../utils/toastCobalt';
import type { ActividadPersonal, GastoRecord } from '../../types';
import type { VistaGlobal } from '../Layout/HeaderMaestro';
import {
  CALENDAR_ENTITY_STYLES,
  MESES_ES,
  formatearFechaCortaEs
} from '../Calendario/calendarStyles';
import {
  CalendarEventPopover,
  type PopoverAnchorPosition
} from '../Calendario/CalendarEventPopover';
import {
  CalendarTimeGrid,
  type EmptySlotSelection
} from '../Calendario/CalendarTimeGrid';
import { CalendarMonthGrid } from '../Calendario/CalendarMonthGrid';
import { CalendarMobileAgenda } from '../Calendario/CalendarMobileAgenda';
import {
  CalendarBacklogPanel,
  type CalendarDragPayload
} from '../Calendario/CalendarBacklogPanel';

export interface ViewCalendarioProps {
  onAbrirTarea?: (tareaId: string) => void;
  onAbrirActividad?: (actividad: ActividadPersonal) => void;
  onAbrirGasto?: (gasto: GastoRecord) => void;
  onNavegarVista?: (vista: VistaGlobal) => void;
}

const ENTIDADES_FILTRO: CalendarEntityType[] = [
  'tarea',
  'actividad',
  'habito',
  'hito',
  'gasto',
  'ingreso',
  'externo_gcal'
];

function convertirEventoAItemFoco(ev: CalendarEventItem): DailyScheduleItem | null {
  if (ev.rawRef.kind !== 'tarea' && ev.rawRef.kind !== 'actividad' && ev.rawRef.kind !== 'habito') {
    return null;
  }
  return {
    id: ev.sourceId,
    tipo: ev.rawRef.kind === 'tarea' ? 'TAREA' : 'HABITO',
    codigoLegado: ev.codigoLegado,
    titulo: ev.titulo,
    subtitulo: ev.subtitulo || '',
    fecha: ev.fecha,
    horaInicio: ev.horaInicio || '09:00',
    horaFin: ev.horaFin || '09:30',
    duracionMinutos: ev.duracionMinutos || 25,
    completado: ev.completado,
    prioridad: ev.prioridad,
    estadoEntidad: ev.estado,
    estadoRitmo: 'FOCUS_ACTUAL',
    raw: ev.rawRef.record
  };
}

export const ViewCalendario: React.FC<ViewCalendarioProps> = ({
  onAbrirTarea,
  onAbrirActividad,
  onAbrirGasto,
  onNavegarVista
}) => {
  const {
    fechaAncla,
    vista,
    setVista,
    rango,
    filtrosEntidad,
    toggleFiltroEntidad,
    irAHoy,
    irAnterior,
    irSiguiente,
    seleccionarFecha,
    todosEventos,
    eventosPorFecha,
    tareasPorAgendar,
    cargaDiariaPorFecha,
    gcalExternoEstado,
    recargarEventosExternos,
    toggleCompletarEvento,
    reprogramarEvento,
    agendarTareaDesdeBacklog,
    crearEventoRapido
  } = useCalendarEngine('semana');

  const [esMovil, setEsMovil] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Panel lateral "Por Agendar" (abierto por defecto en pantallas anchas >= 1280px)
  const [panelBacklogAbierto, setPanelBacklogAbierto] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : true
  );
  const [activeDragPayload, setActiveDragPayload] = useState<CalendarDragPayload | null>(null);

  // Estado del Popover de evento seleccionado
  const [eventoActivo, setEventoActivo] = useState<CalendarEventItem | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<PopoverAnchorPosition | null>(null);
  const [procesandoCompletado, setProcesandoCompletado] = useState(false);

  // Estado del Mini-Popover de creación al vuelo (Click-and-Drag)
  const [slotNuevo, setSlotNuevo] = useState<EmptySlotSelection | null>(null);
  const [tipoNuevoEvento, setTipoNuevoEvento] = useState<'tarea' | 'actividad'>('tarea');
  const [tituloNuevoEvento, setTituloNuevoEvento] = useState('');
  const [creandoEvento, setCreandoEvento] = useState(false);
  const quickCreateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const actualizar = () => setEsMovil(mq.matches);
    actualizar();
    mq.addEventListener('change', actualizar);
    return () => mq.removeEventListener('change', actualizar);
  }, []);

  // Cierre por clic fuera / Escape para mini-popover de creación rápida
  useEffect(() => {
    if (!slotNuevo) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target as Node)) {
        setSlotNuevo(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setSlotNuevo(null);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [slotNuevo]);

  // Estado del motor Pomodoro integrado para eventos del Calendario
  const [focoEvento, setFocoEvento] = useState<CalendarEventItem | null>(null);
  const itemFocoPomodoro = useMemo(
    () => (focoEvento ? convertirEventoAItemFoco(focoEvento) : null),
    [focoEvento]
  );

  const {
    pomodoroCorriendo,
    tiempoPomodoroStr,
    pctPomodoro,
    handleTogglePomodoro,
    handleResetPomodoro
  } = useCockpitPomodoro({
    esWidgetNativo: false,
    itemFocoActivo: itemFocoPomodoro
  });

  const hoyIso = useMemo(() => formatFechaIsoLocal(new Date()), []);
  const fechaAnclaIso = useMemo(() => formatFechaIsoLocal(fechaAncla), [fechaAncla]);

  const fechasSemanaMovil = useMemo(
    () => obtenerRangoVisible(fechaAncla, 'semana').fechas,
    [fechaAncla]
  );

  // Mapa rápido id -> CalendarEventItem para resolver drops de eventos existentes
  const mapaEventosPorId = useMemo(() => {
    const map = new Map<string, CalendarEventItem>();
    for (const ev of todosEventos) {
      map.set(ev.id, ev);
    }
    return map;
  }, [todosEventos]);

  // Atajos de teclado contextuales: D (Día), W (Semana), M (Mes), T (Hoy)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const esInput = Boolean(
        target &&
          (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
            target.isContentEditable ||
            target.getAttribute('contenteditable') === 'true')
      );
      if (esInput) return;

      const hayModalAbierto =
        typeof document !== 'undefined' &&
        document.querySelectorAll('[role="dialog"], [aria-modal="true"]').length > 0;
      if (hayModalAbierto) return;

      const k = e.key.toLowerCase();
      if (k === 'd') {
        e.preventDefault();
        setVista('dia');
      } else if (k === 'w') {
        e.preventDefault();
        setVista('semana');
      } else if (k === 'm') {
        e.preventDefault();
        setVista('mes');
      } else if (k === 't') {
        e.preventDefault();
        irAHoy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setVista, irAHoy]);

  // Título legible del periodo actual
  const tituloPeriodo = useMemo(() => {
    const mes = MESES_ES[fechaAncla.getMonth()] || '';
    const anio = fechaAncla.getFullYear();
    if (vista === 'dia' || esMovil) {
      return `${formatearFechaCortaEs(fechaAnclaIso)} ${anio}`;
    }
    if (vista === 'semana') {
      const fIni = rango.fechas[0];
      const fFin = rango.fechas[rango.fechas.length - 1];
      if (fIni && fFin) {
        const [, m1, d1] = fIni.split('-').map(Number);
        const [, m2, d2] = fFin.split('-').map(Number);
        if (m1 === m2) {
          return `${String(d1).padStart(2, '0')} – ${String(d2).padStart(2, '0')} ${mes} ${anio}`;
        }
        return `${String(d1).padStart(2, '0')} ${MESES_ES[m1 - 1]?.slice(0, 3)} – ${String(d2).padStart(2, '0')} ${MESES_ES[m2 - 1]?.slice(0, 3)} ${anio}`;
      }
    }
    return `${mes} ${anio}`;
  }, [fechaAncla, fechaAnclaIso, vista, rango.fechas, esMovil]);

  // Contadores por entidad en el rango visible
  const conteoPorEntidad = useMemo(() => {
    const map: Record<CalendarEntityType, number> = {
      tarea: 0,
      actividad: 0,
      habito: 0,
      hito: 0,
      gasto: 0,
      ingreso: 0,
      externo_gcal: 0
    };
    for (const ev of todosEventos) {
      map[ev.entidad] = (map[ev.entidad] || 0) + 1;
    }
    return map;
  }, [todosEventos]);

  const handleSeleccionarEvento = useCallback(
    (ev: CalendarEventItem, anchor: PopoverAnchorPosition) => {
      setSlotNuevo(null);
      setEventoActivo(ev);
      setPopoverAnchor(anchor);
    },
    []
  );

  const handleCerrarPopover = useCallback(() => {
    setEventoActivo(null);
    setPopoverAnchor(null);
  }, []);

  const handleDropItem = useCallback(
    async (payload: CalendarDragPayload, nuevaFecha: string, nuevaHoraInicio: string) => {
      if (payload.kind === 'backlog-tarea') {
        const ok = await agendarTareaDesdeBacklog(
          payload.id,
          nuevaFecha,
          nuevaHoraInicio,
          payload.duracionMinutos
        );
        if (ok) {
          mostrarToastCobalt(
            `Tarea agendada: ${formatearFechaCortaEs(nuevaFecha)} · ${nuevaHoraInicio}`,
            'success'
          );
        }
        return;
      }

      const evExistente = mapaEventosPorId.get(payload.id);
      if (!evExistente) return;

      const ok = await reprogramarEvento(
        evExistente,
        nuevaFecha,
        nuevaHoraInicio,
        payload.duracionMinutos
      );
      if (ok) {
        mostrarToastCobalt(
          `Reprogramado: ${formatearFechaCortaEs(nuevaFecha)} · ${nuevaHoraInicio}`,
          'success'
        );
      }
    },
    [agendarTareaDesdeBacklog, mapaEventosPorId, reprogramarEvento]
  );

  const handleResizeEvent = useCallback(
    async (evento: CalendarEventItem, nuevaDuracionMinutos: number) => {
      const ok = await reprogramarEvento(
        evento,
        evento.fecha,
        evento.horaInicio || '09:00',
        nuevaDuracionMinutos
      );
      if (ok) {
        mostrarToastCobalt(`Duración ajustada a ${nuevaDuracionMinutos} min`, 'info');
      }
    },
    [reprogramarEvento]
  );

  const handleSelectEmptySlot = useCallback((slot: EmptySlotSelection) => {
    setEventoActivo(null);
    setPopoverAnchor(null);
    setTituloNuevoEvento('');
    setTipoNuevoEvento('tarea');
    setSlotNuevo(slot);
  }, []);

  const handleConfirmarCrearRapido = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!slotNuevo || !tituloNuevoEvento.trim() || creandoEvento) return;
      setCreandoEvento(true);
      const ok = await crearEventoRapido({
        tipo: tipoNuevoEvento,
        titulo: tituloNuevoEvento,
        fecha: slotNuevo.fecha,
        horaInicio: slotNuevo.horaInicio,
        duracionMinutos: slotNuevo.duracionMinutos
      });
      setCreandoEvento(false);
      if (ok) {
        mostrarToastCobalt(
          `${tipoNuevoEvento === 'tarea' ? 'Tarea' : 'Actividad'} agendada (${slotNuevo.horaInicio}–${slotNuevo.horaFin})`,
          'success'
        );
        setSlotNuevo(null);
        setTituloNuevoEvento('');
      } else {
        mostrarToastCobalt('No se pudo crear el bloque en el calendario', 'error');
      }
    },
    [slotNuevo, tituloNuevoEvento, creandoEvento, crearEventoRapido, tipoNuevoEvento]
  );

  const handleIniciarPomodoro = useCallback(
    (ev: CalendarEventItem) => {
      setFocoEvento(ev);
      handleCerrarPopover();

      if (pomodoroCorriendo) {
        handleResetPomodoro();
        setTimeout(() => {
          handleTogglePomodoro();
        }, 40);
      } else {
        handleTogglePomodoro();
      }

      try {
        const ch = new BroadcastChannel('pmo_hud_bus');
        ch.postMessage({
          type: 'START_POMODORO_FROM_CALENDAR',
          sourceId: ev.sourceId,
          entidad: ev.entidad,
          titulo: ev.titulo
        });
        ch.close();
      } catch {
        // BroadcastChannel no soportado en algunos entornos
      }

      mostrarToastCobalt(`Pomodoro iniciado: ${ev.titulo}`, 'success');
    },
    [handleCerrarPopover, pomodoroCorriendo, handleResetPomodoro, handleTogglePomodoro]
  );

  const handleToggleCompletar = useCallback(
    async (ev: CalendarEventItem) => {
      setProcesandoCompletado(true);
      const ok = await toggleCompletarEvento(ev);
      setProcesandoCompletado(false);
      if (ok) {
        mostrarToastCobalt(
          ev.completado ? 'Evento reabierto' : 'Evento marcado como completado',
          'success'
        );
        handleCerrarPopover();
      } else {
        mostrarToastCobalt('No se pudo actualizar el estado del evento', 'error');
      }
    },
    [toggleCompletarEvento, handleCerrarPopover]
  );

  const handleVerEditar = useCallback(
    (ev: CalendarEventItem) => {
      handleCerrarPopover();

      if (ev.rawRef.kind === 'tarea') {
        if (onAbrirTarea) {
          onAbrirTarea(ev.sourceId);
        } else {
          window.dispatchEvent(
            new CustomEvent('pmo:abrir-entidad', {
              detail: { tipo: 'TAREA', codigo: ev.sourceId, titulo: ev.titulo }
            })
          );
        }
        return;
      }

      if (ev.rawRef.kind === 'actividad' || ev.rawRef.kind === 'habito') {
        if (onAbrirActividad) {
          onAbrirActividad(ev.rawRef.record);
        } else if (onNavegarVista) {
          onNavegarVista('habitos');
        }
        return;
      }

      if (ev.rawRef.kind === 'gasto') {
        if (onAbrirGasto) {
          onAbrirGasto(ev.rawRef.record);
        } else if (onNavegarVista) {
          onNavegarVista('financiero');
        }
        return;
      }

      if (ev.rawRef.kind === 'ingreso') {
        if (onNavegarVista) onNavegarVista('financiero');
        return;
      }

      if (ev.rawRef.kind === 'hito') {
        const proyCodigo = ev.rawRef.record.proyecto_codigo || ev.rawRef.record.ID_Proyecto;
        if (proyCodigo) {
          window.dispatchEvent(
            new CustomEvent('pmo:abrir-entidad', {
              detail: { tipo: 'PROYECTO', codigo: proyCodigo, titulo: ev.titulo }
            })
          );
        } else if (onNavegarVista) {
          onNavegarVista('portafolio');
        }
      }
    },
    [handleCerrarPopover, onAbrirTarea, onAbrirActividad, onAbrirGasto, onNavegarVista]
  );

  const handleSeleccionarDiaDesdeMes = useCallback(
    (fechaIso: string) => {
      seleccionarFecha(fechaIso);
      if (!esMovil) {
        setVista('dia');
      }
    },
    [seleccionarFecha, esMovil, setVista]
  );

  // Coordenadas seguras para el mini-popover de creación al vuelo
  const quickCreatePosition = useMemo(() => {
    if (!slotNuevo) return null;
    const width = 300;
    const height = 210;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      left: Math.max(12, Math.min(slotNuevo.anchor.x + 10, vw - width - 12)),
      top:
        slotNuevo.anchor.y + height + 16 > vh
          ? Math.max(12, slotNuevo.anchor.y - height - 8)
          : Math.max(12, slotNuevo.anchor.y + 8)
    };
  }, [slotNuevo]);

  return (
    <div className="h-full w-full flex flex-col bg-[#040711] text-slate-200 px-3 sm:px-5 pt-3 pb-4 gap-3 overflow-hidden select-none">
      {/* 1. CABECERA EJECUTIVA COBALT AERODYNAMIC */}
      <div className="flex flex-col gap-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Izquierda: Identidad + Navegación Temporal */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0D1526] border border-slate-800/70 flex items-center justify-center text-sky-400 shrink-0 shadow-xs">
              <CalendarDays className="w-4.5 h-4.5" strokeWidth={1.75} />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={irAHoy}
                className="px-2.5 py-1.5 rounded-xl bg-[#0D1526] hover:bg-sky-950/40 border border-slate-800/70 hover:border-sky-500/40 text-xs font-semibold text-slate-300 hover:text-sky-300 transition cursor-pointer active:scale-95"
                title="Ir a Hoy (Atajo: T)"
              >
                Hoy
              </button>

              <div className="inline-flex items-center rounded-xl bg-[#0D1526] border border-slate-800/70 p-0.5">
                <button
                  type="button"
                  onClick={irAnterior}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-white/[0.05] transition cursor-pointer"
                  aria-label="Periodo anterior"
                  title="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={irSiguiente}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-white/[0.05] transition cursor-pointer"
                  aria-label="Periodo siguiente"
                  title="Siguiente"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <h2 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight truncate capitalize">
              {tituloPeriodo}
            </h2>
          </div>

          {/* Derecha: Estado GCal + Toggle "Por Agendar" + Selector de Vista Ghost (Escritorio) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={recargarEventosExternos}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-slate-400 hover:text-sky-300 bg-transparent hover:bg-white/[0.04] border border-slate-800/60 flex items-center gap-1.5 transition cursor-pointer"
              title={
                gcalExternoEstado === 'connected'
                  ? 'Google Calendar conectado · Clic para refrescar eventos externos'
                  : gcalExternoEstado === 'loading'
                  ? 'Sincronizando eventos de Google Calendar...'
                  : 'Google Calendar sin sesión activa · Conéctalo desde Configuración o clic para reintentar'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  gcalExternoEstado === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                    : gcalExternoEstado === 'loading'
                    ? 'bg-sky-400 animate-pulse'
                    : 'bg-slate-600'
                }`}
              />
              <span>GCal</span>
              <RefreshCw
                className={`w-3 h-3 ${gcalExternoEstado === 'loading' ? 'animate-spin text-sky-400' : ''}`}
                strokeWidth={1.75}
              />
            </button>

            <button
              type="button"
              onClick={() => setPanelBacklogAbierto((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                panelBacklogAbierto
                  ? 'text-sky-300 bg-sky-950/40 border-sky-700/50'
                  : 'text-slate-400 hover:text-sky-300 bg-transparent hover:bg-white/[0.04] border-slate-800/60'
              }`}
              title="Mostrar/ocultar panel lateral Por Agendar"
            >
              <Inbox className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Por Agendar</span>
              <span className="font-mono tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-950/70 text-sky-300 border border-sky-800/50">
                {tareasPorAgendar.length}
              </span>
            </button>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#0D1526] border border-slate-800/60">
              {(
                [
                  { id: 'dia', label: 'Día', k: 'D' },
                  { id: 'semana', label: 'Semana', k: 'W' },
                  { id: 'mes', label: 'Mes', k: 'M' }
                ] as Array<{ id: CalendarViewMode; label: string; k: string }>
              ).map((opt) => {
                const activo = vista === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setVista(opt.id)}
                    className={`relative px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activo
                        ? 'text-sky-300 bg-sky-950/40'
                        : 'text-slate-400 hover:text-sky-300 hover:bg-white/[0.03]'
                    }`}
                    title={`Vista ${opt.label} (Atajo: ${opt.k})`}
                  >
                    <span>{opt.label}</span>
                    {activo && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-sky-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Barra de Filtros Ghost por Entidad */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
          {ENTIDADES_FILTRO.map((entidad) => {
            const activo = filtrosEntidad[entidad];
            const style = CALENDAR_ENTITY_STYLES[entidad];
            const count = conteoPorEntidad[entidad] || 0;

            return (
              <button
                key={entidad}
                type="button"
                onClick={() => toggleFiltroEntidad(entidad)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                  activo
                    ? 'text-slate-200 bg-white/[0.05] hover:bg-white/[0.08]'
                    : 'text-slate-500 hover:text-slate-300 bg-transparent opacity-60'
                }`}
                title={`${activo ? 'Ocultar' : 'Mostrar'} ${style.label}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${style.dotClass} ${
                    activo ? 'opacity-100' : 'opacity-35'
                  }`}
                />
                <span>{style.label}</span>
                {count > 0 && (
                  <span className="font-mono tabular-nums text-[10px] text-slate-400">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ÁREA PRINCIPAL DEL CALENDARIO + PANEL LATERAL "POR AGENDAR" */}
      <div className="flex-1 flex min-h-0 gap-3">
        {!esMovil && panelBacklogAbierto && (
          <CalendarBacklogPanel
            tareas={tareasPorAgendar}
            onClose={() => setPanelBacklogAbierto(false)}
            onDragStartItem={setActiveDragPayload}
            onDragEndItem={() => setActiveDragPayload(null)}
            onAbrirTarea={onAbrirTarea}
          />
        )}

        {esMovil ? (
          <CalendarMobileAgenda
            fechasSemana={fechasSemanaMovil}
            fechaSeleccionada={fechaAnclaIso}
            hoyIso={hoyIso}
            eventosPorFecha={eventosPorFecha}
            onSelectDay={seleccionarFecha}
            onSelectEvent={handleSeleccionarEvento}
          />
        ) : vista === 'mes' ? (
          <CalendarMonthGrid
            fechas={rango.fechas}
            mesActivo={fechaAncla.getMonth()}
            hoyIso={hoyIso}
            eventosPorFecha={eventosPorFecha}
            onSelectEvent={handleSeleccionarEvento}
            onSelectDay={handleSeleccionarDiaDesdeMes}
          />
        ) : (
          <CalendarTimeGrid
            fechas={rango.fechas}
            hoyIso={hoyIso}
            eventosPorFecha={eventosPorFecha}
            cargaDiariaPorFecha={cargaDiariaPorFecha}
            activeDragPayload={activeDragPayload}
            onDragStartEvent={setActiveDragPayload}
            onDragEndEvent={() => setActiveDragPayload(null)}
            onDropItem={handleDropItem}
            onResizeEvent={handleResizeEvent}
            onSelectEmptySlot={handleSelectEmptySlot}
            onSelectEvent={handleSeleccionarEvento}
            onSelectDay={(f) => {
              seleccionarFecha(f);
              if (vista === 'semana') setVista('dia');
            }}
          />
        )}
      </div>

      {/* 3. POPOVER LIGERO DE ACCIÓN RÁPIDA EN EVENTO */}
      <CalendarEventPopover
        evento={eventoActivo}
        anchor={popoverAnchor}
        onClose={handleCerrarPopover}
        onIniciarPomodoro={handleIniciarPomodoro}
        onToggleCompletar={handleToggleCompletar}
        onVerEditar={handleVerEditar}
        procesandoCompletado={procesandoCompletado}
      />

      {/* 4. MINI-POPOVER DE CREACIÓN AL VUELO (CLICK-AND-DRAG EN ESPACIO VACÍO) */}
      {slotNuevo && quickCreatePosition && (
        <div
          ref={quickCreateRef}
          role="dialog"
          aria-label="Crear bloque rápido en calendario"
          style={{
            top: quickCreatePosition.top,
            left: quickCreatePosition.left,
            width: 300
          }}
          className="fixed z-[9995] rounded-2xl bg-[#0D1526] border border-sky-500/40 ring-1 ring-sky-500/20 shadow-[0_14px_35px_-5px_rgba(2,6,23,0.92),0_8px_15px_-6px_rgba(30,58,138,0.28)] p-3.5 text-slate-200"
        >
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-sky-300">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{formatearFechaCortaEs(slotNuevo.fecha)}</span>
              <span className="text-slate-500">·</span>
              <span>
                {slotNuevo.horaInicio}–{slotNuevo.horaFin}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSlotNuevo(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition cursor-pointer"
              aria-label="Cerrar creación rápida"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>

          <form onSubmit={handleConfirmarCrearRapido} className="space-y-2.5">
            {/* Selector Tarea vs Actividad */}
            <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl bg-[#040711] border border-slate-800/80">
              <button
                type="button"
                onClick={() => setTipoNuevoEvento('tarea')}
                className={`py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tipoNuevoEvento === 'tarea'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Tarea</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoNuevoEvento('actividad')}
                className={`py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tipoNuevoEvento === 'actividad'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Activity className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Actividad</span>
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={tituloNuevoEvento}
              onChange={(e) => setTituloNuevoEvento(e.target.value)}
              placeholder={
                tipoNuevoEvento === 'tarea'
                  ? 'Título de la tarea...'
                  : 'Nombre de la actividad...'
              }
              className="w-full bg-[#040711] border border-slate-700/70 focus:border-sky-500/70 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition"
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="font-mono tabular-nums text-[10px] text-slate-500">
                {slotNuevo.duracionMinutos} min
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSlotNuevo(null)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoEvento || !tituloNuevoEvento.trim()}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-sky-600 hover:bg-sky-500 border border-sky-400/30 flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{creandoEvento ? 'Guardando...' : 'Agendar'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 5. CÁPSULA FLOTANTE POMODORO ACTIVO */}
      {focoEvento && (
        <div
          id="calendario-pomodoro-pill"
          className="fixed bottom-20 right-4 md:bottom-5 md:right-20 z-[9985] max-w-xs w-full sm:w-auto rounded-2xl bg-[#0D1526]/95 backdrop-blur-xl border border-sky-500/40 shadow-[0_10px_25px_-5px_rgba(2,6,23,0.85),0_0_18px_rgba(56,189,248,0.2)] px-3.5 py-2.5 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Timer
              className={`w-4 h-4 ${pomodoroCorriendo ? 'animate-pulse' : ''}`}
              strokeWidth={1.75}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-100 truncate max-w-[140px]">
                {focoEvento.titulo}
              </span>
              <span className="font-mono tabular-nums text-xs font-bold text-sky-300 shrink-0">
                {tiempoPomodoroStr}
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-slate-800 mt-1.5 overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, pctPomodoro))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleTogglePomodoro}
              className="p-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 transition cursor-pointer"
              title={pomodoroCorriendo ? 'Pausar Pomodoro' : 'Reanudar Pomodoro'}
              aria-label={pomodoroCorriendo ? 'Pausar Pomodoro' : 'Reanudar Pomodoro'}
            >
              {pomodoroCorriendo ? (
                <Pause className="w-3.5 h-3.5" strokeWidth={1.75} />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" strokeWidth={1.75} />
              )}
            </button>
            <button
              type="button"
              onClick={handleResetPomodoro}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition cursor-pointer"
              title="Reiniciar temporizador"
              aria-label="Reiniciar temporizador"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => {
                handleResetPomodoro();
                setFocoEvento(null);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
              title="Cerrar sesión Pomodoro"
              aria-label="Cerrar sesión Pomodoro"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewCalendario;
