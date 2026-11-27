/**
 * ============================================================================
 * ARCHIVO: src/components/Views/ViewCalendario.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FEAT-CAL-01 / CAL-02 / CAL-03 / REQ-UX-CAL-04
 * DESCRIPCIÓN: Vista dedicada de Calendario Maestro con toolbar unificada de
 *              1 línea, selector de Capas (Notion/Linear), Time-Blocking Pro,
 *              espejo solo-lectura Google Calendar y motor Pomodoro integrado.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  X,
  Timer,
  Plus,
  Clock,
  CheckSquare,
  Activity,
  RefreshCw,
  Layers,
  Flame,
  Flag,
  Wallet,
  Calendar,
  PanelRight,
  Check,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  Undo2
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
import type { ActividadPersonal, GastoRecord, IngresoRecord } from '../../types';
import type { VistaGlobal } from '../Layout/HeaderMaestro';
import {
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
import { CalendarDatePickerPopover } from '../Calendario/CalendarDatePickerPopover';

export interface ViewCalendarioProps {
  onAbrirTarea?: (tareaId: string) => void;
  onCrearTareaConDetalles?: (prefill: {
    titulo?: string;
    fecha: string;
    horaInicio?: string;
  }) => void;
  onAbrirActividad?: (actividad: ActividadPersonal) => void;
  onCrearActividadConDetalles?: () => void;
  onAbrirGasto?: (gasto?: GastoRecord | null) => void;
  onAbrirIngreso?: (ingreso?: IngresoRecord | null) => void;
  onNavegarVista?: (vista: VistaGlobal) => void;
}

type LayerKey = 'tarea' | 'actividad' | 'habito' | 'hito' | 'finanzas' | 'externo_gcal';

interface LayerDefinition {
  key: LayerKey;
  label: string;
  entities: CalendarEntityType[];
  iconColorClass: string;
}

const CAPAS_CALENDARIO: LayerDefinition[] = [
  { key: 'tarea', label: 'Tareas', entities: ['tarea'], iconColorClass: 'text-sky-400' },
  { key: 'actividad', label: 'Actividades', entities: ['actividad'], iconColorClass: 'text-indigo-300' },
  { key: 'habito', label: 'Hábitos', entities: ['habito'], iconColorClass: 'text-teal-400' },
  { key: 'hito', label: 'Hitos WBS', entities: ['hito'], iconColorClass: 'text-violet-300' },
  { key: 'finanzas', label: 'Finanzas', entities: ['gasto', 'ingreso'], iconColorClass: 'text-amber-300/90' },
  { key: 'externo_gcal', label: 'Google Calendar', entities: ['externo_gcal'], iconColorClass: 'text-slate-400' }
];

const ENTIDADES_ENFOQUE: ReadonlySet<CalendarEntityType> = new Set([
  'tarea',
  'actividad',
  'habito'
]);

function renderIconoCapa(key: LayerKey, colorClass: string) {
  const cls = `w-3.5 h-3.5 shrink-0 ${colorClass}`;
  switch (key) {
    case 'tarea':
      return <CheckSquare className={cls} strokeWidth={1.75} />;
    case 'actividad':
      return <Activity className={cls} strokeWidth={1.75} />;
    case 'habito':
      return <Flame className={cls} strokeWidth={1.75} />;
    case 'hito':
      return <Flag className={cls} strokeWidth={1.75} />;
    case 'finanzas':
      return <Wallet className={cls} strokeWidth={1.75} />;
    case 'externo_gcal':
      return <Calendar className={cls} strokeWidth={1.75} />;
  }
}

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
  onCrearTareaConDetalles,
  onAbrirActividad,
  onCrearActividadConDetalles,
  onAbrirGasto,
  onAbrirIngreso,
  onNavegarVista
}) => {
  const {
    fechaAncla,
    vista,
    setVista,
    rango,
    filtrosEntidad,
    toggleFiltroEntidad,
    resetFiltros,
    irAHoy,
    irAnterior,
    irSiguiente,
    irAFecha,
    seleccionarFecha,
    todosEventos,
    eventosPorFecha,
    tareasPorAgendar,
    tareasVencidasReprogramar,
    tareasSinHora,
    cargaDiariaPorFecha,
    gcalExternoEstado,
    recargarEventosExternos,
    puedeDeshacer,
    deshacerUltimaAccion,
    toggleCompletarEvento,
    reprogramarEvento,
    agendarTareaDesdeBacklog,
    devolverTareaABacklog,
    crearEventoRapido
  } = useCalendarEngine('semana');

  const [esMovil, setEsMovil] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Panel lateral "Por Agendar"
  const [panelBacklogAbierto, setPanelBacklogAbierto] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : true
  );
  const [activeDragPayload, setActiveDragPayload] = useState<CalendarDragPayload | null>(null);

  // Popover de Capas (Notion / Linear style) y Mini-Calendario Mes/Año
  const [capasAbierto, setCapasAbierto] = useState(false);
  const [datePickerAbierto, setDatePickerAbierto] = useState(false);
  const capasRef = useRef<HTMLDivElement>(null);

  // Popover de evento seleccionado
  const [eventoActivo, setEventoActivo] = useState<CalendarEventItem | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<PopoverAnchorPosition | null>(null);
  const [procesandoCompletado, setProcesandoCompletado] = useState(false);

  // Mini-Popover de creación al vuelo de las 4 entidades (Click-and-Drag o botón +)
  const [slotNuevo, setSlotNuevo] = useState<EmptySlotSelection | null>(null);
  const [tipoNuevoEvento, setTipoNuevoEvento] = useState<'tarea' | 'actividad' | 'gasto' | 'ingreso'>('tarea');
  const [tituloNuevoEvento, setTituloNuevoEvento] = useState('');
  const [montoNuevoEvento, setMontoNuevoEvento] = useState('');
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

  // Cierre por clic fuera / Escape para popover de Capas
  useEffect(() => {
    if (!capasAbierto) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (capasRef.current && !capasRef.current.contains(e.target as Node)) {
        setCapasAbierto(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setCapasAbierto(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [capasAbierto]);

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

  // Motor Pomodoro integrado
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

  const mapaEventosPorId = useMemo(() => {
    const map = new Map<string, CalendarEventItem>();
    for (const ev of todosEventos) {
      map.set(ev.id, ev);
    }
    return map;
  }, [todosEventos]);

  const handleDeshacer = useCallback(async () => {
    const res = await deshacerUltimaAccion();
    if (res.ok) {
      mostrarToastCobalt(`Deshecho: ${res.mensaje || 'último cambio'}`, 'info');
    }
  }, [deshacerUltimaAccion]);

  // Atajos de teclado contextuales: Ctrl/Cmd+Z (Deshacer), D (Día), W (Semana), M (Mes), T (Hoy)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const esInput = Boolean(
        target &&
          (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
            target.isContentEditable ||
            target.getAttribute('contenteditable') === 'true')
      );
      if (esInput) return;

      // Ctrl + Z / Cmd + Z: Deshacer última edición en el calendario (REQ-FEAT-CAL-07)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z') {
        const hayModalBloqueante =
          typeof document !== 'undefined' &&
          document.querySelectorAll('[aria-modal="true"]').length > 0;
        if (hayModalBloqueante || !puedeDeshacer) return;
        e.preventDefault();
        void handleDeshacer();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

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
  }, [setVista, irAHoy, puedeDeshacer, handleDeshacer]);

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
        const [, m1] = fIni.split('-').map(Number);
        const [, m2] = fFin.split('-').map(Number);
        if (m1 === m2) {
          return `${mes} ${anio}`;
        }
        return `${MESES_ES[m1 - 1]?.slice(0, 3)} – ${MESES_ES[m2 - 1]?.slice(0, 3)} ${anio}`;
      }
    }
    return `${mes} ${anio}`;
  }, [fechaAncla, fechaAnclaIso, vista, rango.fechas, esMovil]);

  // Contadores y estado de las 6 capas lógicas
  const conteoPorCapa = useMemo(() => {
    const map: Record<LayerKey, number> = {
      tarea: 0,
      actividad: 0,
      habito: 0,
      hito: 0,
      finanzas: 0,
      externo_gcal: 0
    };
    for (const ev of todosEventos) {
      if (ev.entidad === 'gasto' || ev.entidad === 'ingreso') {
        map.finanzas += 1;
      } else {
        map[ev.entidad] += 1;
      }
    }
    return map;
  }, [todosEventos]);

  const estaCapaActiva = useCallback(
    (layer: LayerDefinition): boolean =>
      layer.entities.some((ent) => filtrosEntidad[ent]),
    [filtrosEntidad]
  );

  const capasActivasCount = useMemo(
    () => CAPAS_CALENDARIO.filter((layer) => estaCapaActiva(layer)).length,
    [estaCapaActiva]
  );

  const esPresetTodo = capasActivasCount === CAPAS_CALENDARIO.length;
  const esPresetEnfoque = useMemo(
    () =>
      filtrosEntidad.tarea &&
      filtrosEntidad.actividad &&
      filtrosEntidad.habito &&
      !filtrosEntidad.hito &&
      !filtrosEntidad.gasto &&
      !filtrosEntidad.ingreso &&
      !filtrosEntidad.externo_gcal,
    [filtrosEntidad]
  );

  const handleToggleCapa = useCallback(
    (layer: LayerDefinition) => {
      const actualmenteActiva = layer.entities.some((ent) => filtrosEntidad[ent]);
      const objetivo = !actualmenteActiva;
      for (const ent of layer.entities) {
        if (filtrosEntidad[ent] !== objetivo) {
          toggleFiltroEntidad(ent);
        }
      }
    },
    [filtrosEntidad, toggleFiltroEntidad]
  );

  const handleAplicarPresetEnfoque = useCallback(() => {
    const todasEntidades: CalendarEntityType[] = [
      'tarea',
      'actividad',
      'habito',
      'hito',
      'gasto',
      'ingreso',
      'externo_gcal'
    ];
    for (const ent of todasEntidades) {
      const debeEstarActiva = ENTIDADES_ENFOQUE.has(ent);
      if (filtrosEntidad[ent] !== debeEstarActiva) {
        toggleFiltroEntidad(ent);
      }
    }
  }, [filtrosEntidad, toggleFiltroEntidad]);

  const handleSeleccionarEvento = useCallback(
    (ev: CalendarEventItem, anchor: PopoverAnchorPosition) => {
      setSlotNuevo(null);
      setCapasAbierto(false);
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
    setCapasAbierto(false);
    setDatePickerAbierto(false);
    setTituloNuevoEvento('');
    setMontoNuevoEvento('');
    setTipoNuevoEvento('tarea');
    setSlotNuevo(slot);
  }, []);

  const handleAbrirNuevoEnDia = useCallback(
    (fechaIso: string, anchor: PopoverAnchorPosition) => {
      const now = new Date();
      const horaSig = Math.min(21, Math.max(8, now.getHours() + 1));
      const horaInicio = `${String(horaSig).padStart(2, '0')}:00`;
      const horaFin = `${String(Math.min(22, horaSig + 1)).padStart(2, '0')}:00`;
      handleSelectEmptySlot({
        fecha: fechaIso,
        horaInicio,
        horaFin,
        duracionMinutos: 60,
        anchor
      });
    },
    [handleSelectEmptySlot]
  );

  const handleAbrirNuevoDesdeToolbar = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      handleAbrirNuevoEnDia(fechaAnclaIso, {
        x: rect.left - 240,
        y: rect.bottom + 4
      });
    },
    [fechaAnclaIso, handleAbrirNuevoEnDia]
  );

  const handleConfirmarCrearRapido = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!slotNuevo || !tituloNuevoEvento.trim() || creandoEvento) return;
      setCreandoEvento(true);

      let ok = false;
      if (tipoNuevoEvento === 'tarea' || tipoNuevoEvento === 'actividad') {
        ok = await crearEventoRapido({
          tipo: tipoNuevoEvento,
          titulo: tituloNuevoEvento,
          fecha: slotNuevo.fecha,
          horaInicio: slotNuevo.horaInicio,
          duracionMinutos: slotNuevo.duracionMinutos
        });
      } else {
        const montoNum = parseFloat(montoNuevoEvento.replace(',', '.')) || 0;
        ok = await crearEventoRapido({
          tipo: tipoNuevoEvento,
          titulo: tituloNuevoEvento,
          fecha: slotNuevo.fecha,
          monto: montoNum,
          moneda: 'PEN'
        });
      }

      setCreandoEvento(false);
      if (ok) {
        const label =
          tipoNuevoEvento === 'tarea'
            ? 'Tarea agendada'
            : tipoNuevoEvento === 'actividad'
            ? 'Actividad agendada'
            : tipoNuevoEvento === 'gasto'
            ? 'Gasto registrado'
            : 'Ingreso registrado';
        const detalle =
          tipoNuevoEvento === 'tarea' || tipoNuevoEvento === 'actividad'
            ? ` (${slotNuevo.horaInicio}–${slotNuevo.horaFin})`
            : ` (${formatearFechaCortaEs(slotNuevo.fecha)})`;
        mostrarToastCobalt(`${label}${detalle}`, 'success');
        setSlotNuevo(null);
        setTituloNuevoEvento('');
        setMontoNuevoEvento('');
      } else {
        mostrarToastCobalt('No se pudo crear el registro en el calendario', 'error');
      }
    },
    [slotNuevo, tituloNuevoEvento, montoNuevoEvento, creandoEvento, crearEventoRapido, tipoNuevoEvento]
  );

  const handleAbrirMasDetalles = useCallback(() => {
    if (!slotNuevo) return;
    const snapSlot = slotNuevo;
    const snapTitulo = tituloNuevoEvento.trim();
    const snapTipo = tipoNuevoEvento;
    setSlotNuevo(null);

    if (snapTipo === 'tarea') {
      if (onCrearTareaConDetalles) {
        onCrearTareaConDetalles({
          titulo: snapTitulo,
          fecha: snapSlot.fecha,
          horaInicio: snapSlot.horaInicio
        });
      }
      return;
    }

    if (snapTipo === 'actividad') {
      if (onCrearActividadConDetalles) {
        onCrearActividadConDetalles();
      } else if (onNavegarVista) {
        onNavegarVista('habitos');
      }
      return;
    }

    if (snapTipo === 'gasto') {
      if (onAbrirGasto) {
        onAbrirGasto(null);
      } else if (onNavegarVista) {
        onNavegarVista('financiero');
      }
      return;
    }

    if (snapTipo === 'ingreso') {
      if (onAbrirIngreso) {
        onAbrirIngreso(null);
      } else if (onNavegarVista) {
        onNavegarVista('financiero');
      }
    }
  }, [
    slotNuevo,
    tituloNuevoEvento,
    tipoNuevoEvento,
    onCrearTareaConDetalles,
    onCrearActividadConDetalles,
    onAbrirGasto,
    onAbrirIngreso,
    onNavegarVista
  ]);

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

  const handleDevolverABacklog = useCallback(
    async (ev: CalendarEventItem) => {
      if (ev.rawRef.kind !== 'tarea') return;
      const ok = await devolverTareaABacklog(ev.sourceId);
      handleCerrarPopover();
      if (ok) {
        mostrarToastCobalt('Tarea devuelta a Por Agendar', 'info');
      } else {
        mostrarToastCobalt('No se pudo devolver la tarea', 'error');
      }
    },
    [devolverTareaABacklog, handleCerrarPopover]
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
        if (onAbrirIngreso) {
          onAbrirIngreso(ev.rawRef.record);
        } else if (onNavegarVista) {
          onNavegarVista('financiero');
        }
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
    [handleCerrarPopover, onAbrirTarea, onAbrirActividad, onAbrirGasto, onAbrirIngreso, onNavegarVista]
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

  const quickCreatePosition = useMemo(() => {
    if (!slotNuevo) return null;
    const width = 324;
    const height = 260;
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
    <div className="h-full w-full flex flex-col bg-[#040711] text-slate-200 px-3 sm:px-5 pt-2.5 pb-3.5 gap-2.5 overflow-hidden select-none">
      {/* 1. TOOLBAR EJECUTIVA DE ALTA PRECISIÓN EN 3 ZONAS (REQ-UX-CAL-08) */}
      <div
        role="toolbar"
        aria-label="Barra de herramientas del calendario"
        className="h-11 sm:h-12 flex items-center justify-between gap-2 shrink-0 relative border-b border-white/[0.06]"
      >
        {/* Zona Izquierda: Grupo [ < | Hoy | > ] + Título Periodo */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            role="group"
            aria-label="Navegación temporal"
            className="inline-flex items-center rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5 shrink-0"
          >
            <button
              type="button"
              onClick={irAnterior}
              className="h-7 w-7 rounded-md text-slate-400 hover:text-sky-300 hover:bg-white/[0.05] flex items-center justify-center transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70"
              aria-label="Periodo anterior"
              title="Anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={irAHoy}
              className="h-7 px-2.5 rounded-md text-xs font-medium text-slate-300 hover:text-sky-300 hover:bg-white/[0.05] transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70"
              title="Ir a Hoy (Atajo: T)"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={irSiguiente}
              className="h-7 w-7 rounded-md text-slate-400 hover:text-sky-300 hover:bg-white/[0.05] flex items-center justify-center transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70"
              aria-label="Periodo siguiente"
              title="Siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => {
                setCapasAbierto(false);
                setDatePickerAbierto((prev) => !prev);
              }}
              aria-expanded={datePickerAbierto}
              className="px-2 py-1 rounded-lg hover:bg-white/[0.05] text-sm font-semibold tracking-tight text-slate-100 hover:text-sky-200 transition cursor-pointer inline-flex items-center gap-1 max-w-full capitalize focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70"
              title="Seleccionar mes, año o fecha rápida"
            >
              <span className="truncate">{tituloPeriodo}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                  datePickerAbierto ? 'rotate-180 opacity-100 text-sky-400' : 'opacity-60'
                }`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>

            <CalendarDatePickerPopover
              isOpen={datePickerAbierto}
              fechaAncla={fechaAncla}
              hoyIso={hoyIso}
              onSelectDate={irAFecha}
              onIrAHoy={irAHoy}
              onClose={() => setDatePickerAbierto(false)}
            />
          </div>
        </div>

        {/* Zona Centro: Selector de Vista Compacto Estilo Linear [ Día | Semana | Mes ] */}
        <div
          role="group"
          aria-label="Selector de vista"
          className="hidden md:flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.06] p-0.5 rounded-lg lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        >
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
                aria-pressed={activo}
                className={`h-7 px-2.5 rounded-md text-xs font-medium transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70 ${
                  activo
                    ? 'bg-white/[0.09] text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
                title={`Vista ${opt.label} (Atajo: ${opt.k})`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Zona Derecha: Utilidades Ghost (Undo, Capas, Por Agendar, GCal) + Acción Primaria Única (+ Nuevo) */}
        <div className="flex items-center gap-1 shrink-0">
          {puedeDeshacer && (
            <>
              <button
                type="button"
                onClick={() => void handleDeshacer()}
                className="h-7 w-7 rounded-lg text-slate-400 hover:text-sky-300 bg-transparent hover:bg-white/[0.06] flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70"
                title="Deshacer (Ctrl+Z)"
                aria-label="Deshacer"
              >
                <Undo2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              </button>
              <span
                role="separator"
                aria-orientation="vertical"
                className="w-px h-4 bg-white/[0.08] mx-0.5 shrink-0"
              />
            </>
          )}

          {/* Utilidades Ghost: Capas + Por Agendar + Google Calendar */}
          <div role="group" aria-label="Utilidades del calendario" className="flex items-center gap-1">
            {/* Botón Capas (Popover flotante Notion/Linear) */}
            <div ref={capasRef} className="relative">
              <button
                type="button"
                onClick={() => setCapasAbierto((prev) => !prev)}
                aria-expanded={capasAbierto}
                aria-label="Capas y filtros"
                className={`h-7 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition cursor-pointer border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70 ${
                  capasActivasCount < CAPAS_CALENDARIO.length ? 'px-2' : 'w-7'
                } ${
                  capasAbierto || capasActivasCount < CAPAS_CALENDARIO.length
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-transparent hover:bg-white/[0.06] border-transparent'
                }`}
                title="Capas y filtros"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {capasActivasCount < CAPAS_CALENDARIO.length && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" aria-hidden="true" />
                    <span className="font-mono tabular-nums text-[10px] font-medium leading-none">
                      {capasActivasCount}/{CAPAS_CALENDARIO.length}
                    </span>
                  </>
                )}
              </button>

              {capasAbierto && (
                <div
                  role="dialog"
                  aria-label="Selector de capas del calendario"
                  className="absolute right-0 top-full mt-1.5 w-64 rounded-2xl bg-[#0D1526] border border-slate-800/80 shadow-[0_14px_35px_-5px_rgba(2,6,23,0.92),0_8px_15px_-6px_rgba(30,58,138,0.28)] p-2.5 z-[9990]"
                >
                  {/* Presets rápidos: Todo / Enfoque */}
                  <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-slate-800/70">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 pl-1">
                      Capas
                    </span>
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={resetFiltros}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                          esPresetTodo
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent'
                        }`}
                      >
                        Todo
                      </button>
                      <button
                        type="button"
                        onClick={handleAplicarPresetEnfoque}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                          esPresetEnfoque
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent'
                        }`}
                        title="Mostrar solo Tareas, Actividades y Hábitos"
                      >
                        Enfoque
                      </button>
                    </div>
                  </div>

                  {/* Lista vertical con iconos Lucide y check táctil */}
                  <div className="space-y-0.5">
                    {CAPAS_CALENDARIO.map((layer) => {
                      const activa = estaCapaActiva(layer);
                      const count = conteoPorCapa[layer.key] || 0;
                      return (
                        <button
                          key={layer.key}
                          type="button"
                          onClick={() => handleToggleCapa(layer)}
                          className={`w-full px-2 py-1.5 rounded-xl flex items-center justify-between gap-2 text-left transition cursor-pointer ${
                            activa
                              ? 'text-slate-200 hover:bg-white/[0.05]'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={activa ? 'opacity-100' : 'opacity-40'}>
                              {renderIconoCapa(layer.key, layer.iconColorClass)}
                            </span>
                            <span className="text-xs font-medium truncate">{layer.label}</span>
                            {count > 0 && (
                              <span className="font-mono tabular-nums text-[10px] text-slate-500">
                                {count}
                              </span>
                            )}
                          </div>
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ${
                              activa
                                ? 'bg-sky-500/25 border-sky-400/60 text-sky-300'
                                : 'bg-transparent border-slate-700/80 text-transparent'
                            }`}
                          >
                            <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Botón Por Agendar (Escritorio — Icono + Pill Numérico Compacto) */}
            <button
              type="button"
              onClick={() => setPanelBacklogAbierto((prev) => !prev)}
              aria-pressed={panelBacklogAbierto}
              aria-label="Por Agendar (Time-Blocking)"
              className={`hidden md:inline-flex h-7 rounded-lg text-xs font-medium items-center justify-center gap-1.5 transition cursor-pointer border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70 ${
                tareasPorAgendar.length > 0 ? 'px-2' : 'w-7'
              } ${
                panelBacklogAbierto
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-transparent hover:bg-white/[0.06] border-transparent'
              }`}
              title="Por Agendar (Time-Blocking)"
            >
              <PanelRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              {tareasPorAgendar.length > 0 && (
                <span
                  className={`font-mono tabular-nums text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none ${
                    panelBacklogAbierto
                      ? 'bg-sky-500/20 text-sky-200'
                      : 'bg-white/[0.07] text-slate-300'
                  }`}
                >
                  {tareasPorAgendar.length}
                </span>
              )}
            </button>

            {/* Indicador / Botón Ghost de Estado Google Calendar */}
            <button
              type="button"
              onClick={recargarEventosExternos}
              className="relative h-7 w-7 rounded-lg text-slate-400 hover:text-slate-200 bg-transparent hover:bg-white/[0.06] flex items-center justify-center transition cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70"
              title={
                gcalExternoEstado === 'connected'
                  ? 'Google Calendar conectado · Clic para refrescar eventos externos'
                  : gcalExternoEstado === 'loading'
                  ? 'Sincronizando eventos de Google Calendar...'
                  : 'Google Calendar sin sesión activa · Clic para reintentar'
              }
              aria-label="Sincronizar Google Calendar"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${gcalExternoEstado === 'loading' ? 'animate-spin text-sky-400' : ''}`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span
                aria-hidden="true"
                className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                  gcalExternoEstado === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]'
                    : gcalExternoEstado === 'loading'
                    ? 'bg-sky-400 animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
            </button>
          </div>

          <span
            role="separator"
            aria-orientation="vertical"
            className="w-px h-4 bg-white/[0.08] mx-0.5 shrink-0"
          />

          {/* Acción Primaria Única (+ Nuevo: Tarea, Actividad, Gasto, Ingreso) */}
          <button
            type="button"
            onClick={handleAbrirNuevoDesdeToolbar}
            className="h-7 px-2 sm:px-2.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-medium inline-flex items-center justify-center gap-1 transition cursor-pointer active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70"
            title="Nuevo registro en Calendario (Tarea, Actividad, Gasto o Ingreso)"
            aria-label="Crear nuevo registro en calendario"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>

      {/* 2. ÁREA PRINCIPAL DEL CALENDARIO + PANEL LATERAL "POR AGENDAR" */}
      <div className="flex-1 flex min-h-0 gap-3">
        {!esMovil && panelBacklogAbierto && (
          <CalendarBacklogPanel
            tareasVencidas={tareasVencidasReprogramar}
            tareasSinHora={tareasSinHora}
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
            onToggleCompletar={handleToggleCompletar}
            onCrearEnDia={handleAbrirNuevoEnDia}
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
            onToggleCompletar={handleToggleCompletar}
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
        onDevolverABacklog={handleDevolverABacklog}
        procesandoCompletado={procesandoCompletado}
      />

      {/* 4. MINI-POPOVER DE CREACIÓN AL VUELO DE 4 ENTIDADES (UNIFICADO REQ-UX-CAL-10) */}
      {slotNuevo && quickCreatePosition && (
        <div
          ref={quickCreateRef}
          role="dialog"
          aria-label="Crear registro rápido en calendario"
          style={{
            top: quickCreatePosition.top,
            left: quickCreatePosition.left,
            width: 328
          }}
          className="fixed z-[9995] bg-[#0B1221]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 p-3.5 text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-slate-400 min-w-0">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="truncate">{formatearFechaCortaEs(slotNuevo.fecha)}</span>
              {(tipoNuevoEvento === 'tarea' || tipoNuevoEvento === 'actividad') && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="shrink-0">
                    {slotNuevo.horaInicio}–{slotNuevo.horaFin}
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSlotNuevo(null)}
              className="h-6 w-6 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] flex items-center justify-center transition cursor-pointer shrink-0"
              aria-label="Cerrar creación rápida"
              title="Cerrar (Esc)"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleConfirmarCrearRapido} className="space-y-3">
            {/* Selector Segmentado Compacto de 4 Entidades */}
            <div className="grid grid-cols-4 gap-0.5 bg-white/[0.03] border border-white/[0.06] p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setTipoNuevoEvento('tarea')}
                aria-pressed={tipoNuevoEvento === 'tarea'}
                className={`py-1.5 px-1 rounded-md text-[10px] font-medium flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${
                  tipoNuevoEvento === 'tarea'
                    ? 'bg-sky-500/15 text-sky-300 border-sky-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border-transparent'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} aria-hidden="true" />
                <span>Tarea</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoNuevoEvento('actividad')}
                aria-pressed={tipoNuevoEvento === 'actividad'}
                className={`py-1.5 px-1 rounded-md text-[10px] font-medium flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${
                  tipoNuevoEvento === 'actividad'
                    ? 'bg-indigo-500/15 text-indigo-200 border-indigo-300/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border-transparent'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-indigo-300" strokeWidth={1.75} aria-hidden="true" />
                <span>Activ.</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoNuevoEvento('gasto')}
                aria-pressed={tipoNuevoEvento === 'gasto'}
                className={`py-1.5 px-1 rounded-md text-[10px] font-medium flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${
                  tipoNuevoEvento === 'gasto'
                    ? 'bg-amber-500/15 text-amber-200 border-amber-300/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border-transparent'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-amber-300/90" strokeWidth={1.75} aria-hidden="true" />
                <span>Gasto</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoNuevoEvento('ingreso')}
                aria-pressed={tipoNuevoEvento === 'ingreso'}
                className={`py-1.5 px-1 rounded-md text-[10px] font-medium flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${
                  tipoNuevoEvento === 'ingreso'
                    ? 'bg-teal-500/15 text-teal-200 border-teal-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border-transparent'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" strokeWidth={1.75} aria-hidden="true" />
                <span>Ingreso</span>
              </button>
            </div>

            {/* Concepto + Monto fluido en la misma fila para Gasto / Ingreso */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                value={tituloNuevoEvento}
                onChange={(e) => setTituloNuevoEvento(e.target.value)}
                placeholder={
                  tipoNuevoEvento === 'tarea'
                    ? 'Título de la tarea...'
                    : tipoNuevoEvento === 'actividad'
                    ? 'Nombre de la actividad...'
                    : tipoNuevoEvento === 'gasto'
                    ? 'Concepto del gasto...'
                    : 'Concepto del ingreso...'
                }
                className="flex-1 min-w-0 h-8 bg-white/[0.03] border border-white/[0.08] focus:border-sky-500/60 rounded-lg px-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition"
              />

              {(tipoNuevoEvento === 'gasto' || tipoNuevoEvento === 'ingreso') && (
                <div className="relative w-24 shrink-0 flex items-center">
                  <span className="absolute left-2 font-mono tabular-nums text-[11px] text-slate-400 pointer-events-none">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoNuevoEvento}
                    onChange={(e) => setMontoNuevoEvento(e.target.value)}
                    placeholder="0.00"
                    aria-label="Monto en soles"
                    className="w-full h-8 bg-white/[0.03] border border-white/[0.08] focus:border-amber-400/60 rounded-lg pl-6 pr-2 text-xs font-mono tabular-nums text-slate-100 placeholder-slate-500 focus:outline-none transition"
                  />
                </div>
              )}
            </div>

            {/* Pie unificado: Más detalles + Crear ↵ */}
            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handleAbrirMasDetalles}
                className="text-[11px] font-medium text-slate-400 hover:text-sky-300 inline-flex items-center gap-1.5 transition cursor-pointer"
                title="Abrir formulario completo con más campos"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Más detalles</span>
              </button>

              <button
                type="submit"
                disabled={creandoEvento || !tituloNuevoEvento.trim()}
                className="h-7 px-2.5 rounded-lg text-xs font-medium text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-45"
              >
                <span>{creandoEvento ? 'Creando...' : 'Crear'}</span>
                <kbd className="font-mono text-[10px] text-sky-300/75 leading-none">↵</kbd>
              </button>
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
