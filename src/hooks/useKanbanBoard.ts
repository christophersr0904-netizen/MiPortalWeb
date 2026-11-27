/**
 * ============================================================================
 * ARCHIVO: src/hooks/useKanbanBoard.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-REFACTOR-P1-07 (Extracción del Motor Kanban)
 * DESCRIPCIÓN: Hook desacoplado de lógica de negocio, consultas Dexie B-Tree,
 *              filtros multidimensionales, ordenamiento, dependencias reactivas,
 *              estados optimistas de drag-and-drop y handlers de mutación.
 * ============================================================================
 */

import { useState, useEffect, useMemo, useRef, useCallback, useDeferredValue, useTransition } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useUndoDelete } from './useUndoDelete';
import {
  normalizeProyecto,
  normalizeTarea,
  type CanonicalProyecto,
  type CanonicalTarea,
  validarDoDSubtareas,
  evaluarFiltroTemporal,
  evaluarFiltroPlazo,
  calcularAvancesProyectoCanonica,
  resolverDependenciasTarea
} from '../utils/entityNormalizer';
import { crearTarea, actualizarTarea, eliminarTarea } from '../services/tareasService';
import { syncManager } from '../services/syncManager';
import { coincideCategoriaIniciativa } from '../components/PMO/IconoCategoriaIniciativa';
import type {
  ProyectoRecord,
  TareaRecord,
  SubtareaPaso,
  HitoWbsRecord,
  GastoRecord
} from '../types';

export type TimeFilter = 'TODO' | 'HOY' | 'SEMANA' | 'MES';
export type SortFilter = 'PRIORITY' | 'DATE' | 'ENERGY' | 'HOURS' | 'ALPHA';
export type EstadoTareaKanban = '01_Backlog' | '02_Por_Hacer' | '03_En_Proceso' | '04_Completado';

export interface KanbanUndoEntry {
  tareaId: string;
  etiqueta: string;
  estadoAnterior: string;
  archivadaAnterior?: boolean;
}

const MAX_KANBAN_UNDO_STACK = 20;

/**
 * Restaura en Dexie el estado previo de una tarea desde el stack Undo del Kanban,
 * marca `sync_status: 'pending'` con `updated_at` actual y dispara sincronización multi-dispositivo.
 */
export async function aplicarUndoKanbanLocal(entry: KanbanUndoEntry): Promise<boolean> {
  if (!entry.tareaId) return false;
  try {
    const nowIso = new Date().toISOString();
    const updates: Partial<TareaRecord> = {
      estado_tarea: entry.estadoAnterior,
      updated_at: nowIso,
      sync_status: 'pending'
    };
    if (entry.archivadaAnterior !== undefined) {
      updates.archivado = entry.archivadaAnterior;
    }
    await db.tareas.update(entry.tareaId, updates);
    void syncManager.sincronizarTodo().catch(() => {});
    return true;
  } catch (err) {
    console.error('[useKanbanBoard] Error al deshacer acción Kanban:', err);
    return false;
  }
}

export interface ColumnaKanbanDef {
  id: string;
  domId: string;
  titulo: string;
  color: string;
  iconoColor: string;
  badgeColor: string;
  tituloColor: string;
  headerGlow: boolean;
}

export interface DoDAdvertenciaState {
  tarea: CanonicalTarea;
  nuevoEstado: string;
  pendientes: number;
  total: number;
}

export interface UseKanbanBoardOptions {
  onEliminarTarea?: (tareaId: string, nombreTarea: string) => void;
}

export const COLUMNAS_KANBAN: ColumnaKanbanDef[] = [
  {
    id: '01_Backlog',
    domId: 'col-backlog',
    titulo: 'Backlog',
    color: 'border-slate-500/40 text-slate-300 bg-slate-900',
    iconoColor: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    badgeColor: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    tituloColor: 'text-slate-300',
    headerGlow: false
  },
  {
    id: '02_Por_Hacer',
    domId: 'col-por-hacer',
    titulo: 'Por Hacer',
    color: 'border-sky-500/40 text-sky-400 bg-slate-900',
    iconoColor: 'bg-sky-500/10 border border-sky-500/25 text-sky-400',
    badgeColor: 'bg-sky-500/10 border border-sky-500/25 text-sky-300',
    tituloColor: 'text-slate-300',
    headerGlow: false
  },
  {
    id: '03_En_Proceso',
    domId: 'col-en-proceso',
    titulo: 'En Proceso',
    color: 'border-amber-500/40 text-amber-400 bg-slate-900',
    iconoColor: 'bg-amber-500/10 border border-amber-500/25 text-amber-400',
    badgeColor: 'bg-amber-500/10 border border-amber-500/25 text-amber-300',
    tituloColor: 'text-slate-300',
    headerGlow: false
  },
  {
    id: '04_Completado',
    domId: 'col-completado',
    titulo: 'Completado',
    color: 'border-emerald-500/40 text-emerald-400 bg-slate-900',
    iconoColor: 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400',
    badgeColor: 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300',
    tituloColor: 'text-slate-300',
    headerGlow: false
  }
];

export function useKanbanBoard(options: UseKanbanBoardOptions = {}) {
  const { onEliminarTarea } = options;

  // Sidebar State
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  const [busquedaProyecto, setBusquedaProyecto] = useState('');
  const deferredBusquedaProyecto = useDeferredValue(busquedaProyecto);
  const [filtroTipoProyecto, setFiltroTipoProyecto] = useState<string>('');
  const [proyectoSeleccionadoCodigo, setProyectoSeleccionadoCodigo] = useState<string | null>(null);
  const [, startKanbanTransition] = useTransition();

  // Filtro Temporal
  const [filtroTemporal, setFiltroTemporal] = useState<TimeFilter>('TODO');
  const [dropdownTiempoAbierto, setDropdownTiempoAbierto] = useState(false);

  // Fila 2 State: Filtros Multidimensionales y Ordenamiento
  const [criterioOrden, setCriterioOrden] = useState<SortFilter>('PRIORITY');
  const [busquedaTarea, setBusquedaTarea] = useState('');
  const deferredBusquedaTarea = useDeferredValue(busquedaTarea);
  const [filtroHito, setFiltroHito] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroEnergia, setFiltroEnergia] = useState('');
  const [filtroPlazo, setFiltroPlazo] = useState('');
  const [filtroDependencia, setFiltroDependencia] = useState('');

  // Dropdowns UI de la barra de filtros
  const [popoverHitoAbierto, setPopoverHitoAbierto] = useState(false);
  const [popoverPrioAbierto, setPopoverPrioAbierto] = useState(false);
  const [popoverEnergiaAbierto, setPopoverEnergiaAbierto] = useState(false);
  const [popoverPlazoAbierto, setPopoverPlazoAbierto] = useState(false);
  const [popoverDepAbierto, setPopoverDepAbierto] = useState(false);

  // Estados para vistas y ergonomía móvil (REQ-PWA-04 / REQ-OPS-22B / REQ-UI-24)
  const [columnaMovilActiva, setColumnaMovilActiva] = useState<string>('01_Backlog');
  const [drawerFiltrosMovilAbierto, setDrawerFiltrosMovilAbierto] = useState<boolean>(false);
  const [selectorProyectosMovilAbierto, setSelectorProyectosMovilAbierto] = useState<boolean>(false);

  // Hover timers con buffer de delay (140ms) optimizado para evitar fricción háptica (REQ-SYS-003-KANBAN)
  const leaveTimers = useRef<Record<string, number | null>>({});

  const closeAllPopoversExcept = (exceptName?: string) => {
    if (exceptName !== 'tiempo') setDropdownTiempoAbierto(false);
    if (exceptName !== 'hito') setPopoverHitoAbierto(false);
    if (exceptName !== 'prio') setPopoverPrioAbierto(false);
    if (exceptName !== 'energia') setPopoverEnergiaAbierto(false);
    if (exceptName !== 'plazo') setPopoverPlazoAbierto(false);
    if (exceptName !== 'dep') setPopoverDepAbierto(false);
  };

  const closeAllPopovers = () => {
    closeAllPopoversExcept();
  };

  const clearAllLeaveTimers = () => {
    Object.keys(leaveTimers.current).forEach((key) => {
      const timer = leaveTimers.current[key];
      if (timer) {
        window.clearTimeout(timer);
        leaveTimers.current[key] = null;
      }
    });
  };

  const handlePopoverMouseEnter = (name: string, openSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    // Blindaje táctil: evitar apertura fantasma por hover sintético en dispositivos móviles/táctiles (REQ-UI-24)
    if (typeof window !== 'undefined' && (window.innerWidth < 768 || !window.matchMedia('(hover: hover)').matches)) {
      return;
    }
    // 1. Limpiar todos los timers activos en vuelo
    clearAllLeaveTimers();
    // 2. Cerrar popovers hermanos para evitar superposiciones no deseadas
    closeAllPopoversExcept(name);
    // 3. Abrir el popover objetivo
    openSetter(true);
  };

  const handlePopoverMouseLeave = (name: string, openSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (leaveTimers.current[name]) {
      window.clearTimeout(leaveTimers.current[name]!);
    }
    leaveTimers.current[name] = window.setTimeout(() => {
      openSetter(false);
      leaveTimers.current[name] = null;
    }, 140);
  };

  // Listener global para cerrar popovers y Bottom Sheets al hacer clic fuera, redimensionar a móvil o presionar Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.kanban-popover-container')) {
        closeAllPopovers();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllPopovers();
        setDrawerFiltrosMovilAbierto(false);
        setSelectorProyectosMovilAbierto(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth < 768) {
        closeAllPopovers();
      } else {
        setDrawerFiltrosMovilAbierto(false);
        setSelectorProyectosMovilAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      clearAllLeaveTimers();
    };
  }, []);

  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Estado de hover/foco para trazabilidad relacional bidireccional de dependencias
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // Modal TareaFlow State
  const [modalTareaFlowAbierto, setModalTareaFlowAbierto] = useState(false);
  const [tareaSeleccionadaId, setTareaSeleccionadaId] = useState<string | null>(null);
  const [columnaNuevaTarea, setColumnaNuevaTarea] = useState('01_Backlog');

  // Modal Canónico de Nuevo Proyecto
  const [modalNuevoProyectoAbierto, setModalNuevoProyectoAbierto] = useState(false);

  // Estados Optimistas para Transición Inmediata de Drag-and-Drop (Zero Latency)
  const [estadosOptimistas, setEstadosOptimistas] = useState<Map<string, string>>(new Map());

  // Stack de Historial Deshacer (Ctrl+Z) en memoria (máx 20 operaciones - REQ-UX-KANBAN-03)
  const undoStackRef = useRef<KanbanUndoEntry[]>([]);
  const [undoStackSize, setUndoStackSize] = useState(0);

  const pushUndoKanban = useCallback((entry: KanbanUndoEntry) => {
    const next = [...undoStackRef.current, entry];
    if (next.length > MAX_KANBAN_UNDO_STACK) {
      next.splice(0, next.length - MAX_KANBAN_UNDO_STACK);
    }
    undoStackRef.current = next;
    setUndoStackSize(next.length);
  }, []);

  // Modal Declarativo Bento para Advertencia Definition of Done (DoD)
  const [dodAdvertencia, setDodAdvertencia] = useState<DoDAdvertenciaState | null>(null);

  const { programarEliminacion, estaOculto, hiddenIdsSet } = useUndoDelete();

  // Live queries optimizados con índices Dexie (REQ-PERF-P2-02 / REQ-PERF-FLUIDITY-04)
  // Gastos acotados a registros vinculados a proyectos/tareas usando el índice id_proyecto
  // Tareas ordenadas/indexadas por fecha_programada en Dexie para acelerar la hidratación de columnas
  const rawProyectosLive = useLiveQuery(() => db.proyectos.toArray(), []);
  const rawTareasLive = useLiveQuery(() => db.tareas.orderBy('fecha_programada').toArray(), []);
  const rawSubtareasLive = useLiveQuery(() => db.subtareas_pasos.toArray(), []);
  const rawHitosLive = useLiveQuery(() => db.hitos_wbs.toArray(), []);
  const rawGastosLive = useLiveQuery(
    () => db.gastos.where('id_proyecto').notEqual('').toArray(),
    []
  );

  const cargandoDatosIniciales =
    rawProyectosLive === undefined ||
    rawTareasLive === undefined ||
    rawSubtareasLive === undefined ||
    rawHitosLive === undefined ||
    rawGastosLive === undefined;

  const rawProyectos = useMemo<ProyectoRecord[]>(
    () =>
      (rawProyectosLive ?? []).filter(
        (p) =>
          !hiddenIdsSet.has(p.id) &&
          !hiddenIdsSet.has(p.codigo_legado) &&
          !estaOculto(p.id) &&
          !estaOculto(p.codigo_legado)
      ),
    [rawProyectosLive, hiddenIdsSet, estaOculto]
  );

  const rawTareas = useMemo<TareaRecord[]>(
    () =>
      (rawTareasLive ?? []).filter(
        (t) =>
          !hiddenIdsSet.has(t.id) &&
          !hiddenIdsSet.has(t.codigo_legado) &&
          !hiddenIdsSet.has(t.proyecto_codigo || '') &&
          !hiddenIdsSet.has(t.proyecto_id || '') &&
          !estaOculto(t.id) &&
          !estaOculto(t.codigo_legado)
      ),
    [rawTareasLive, hiddenIdsSet, estaOculto]
  );

  const tareasLookupMap = useMemo(() => {
    const map = new Map<string, { codigo: string; nombre: string }>();
    rawTareas.forEach((t) => {
      const codigo = String(t.codigo_legado || t.id || '').trim().toUpperCase();
      const nombre = String(t.nombre_tarea_actividad || 'Tarea sin nombre').trim();
      const entry = { codigo, nombre };
      if (codigo) {
        map.set(codigo, entry);
      }
      if (t.id) {
        const idStr = String(t.id).trim();
        if (idStr) {
          map.set(idStr.toLowerCase(), entry);
          map.set(idStr.toUpperCase(), entry);
        }
      }
    });
    return map;
  }, [rawTareas]);

  const rawSubtareas = useMemo<SubtareaPaso[]>(
    () =>
      (rawSubtareasLive ?? []).filter(
        (s) =>
          !hiddenIdsSet.has(s.id) &&
          !hiddenIdsSet.has(s.codigo_legado || '') &&
          !hiddenIdsSet.has(s.id_padre_vinculado || '') &&
          !estaOculto(s.id)
      ),
    [rawSubtareasLive, hiddenIdsSet, estaOculto]
  );

  const rawHitos = useMemo<HitoWbsRecord[]>(
    () =>
      (rawHitosLive ?? []).filter(
        (h) =>
          !hiddenIdsSet.has(h.id) &&
          !hiddenIdsSet.has(h.codigo_legado) &&
          !hiddenIdsSet.has(h.proyecto_id || '') &&
          !estaOculto(h.id)
      ),
    [rawHitosLive, hiddenIdsSet, estaOculto]
  );

  const rawGastos = useMemo<GastoRecord[]>(
    () =>
      (rawGastosLive ?? []).filter(
        (g) =>
          !hiddenIdsSet.has(g.id) &&
          !hiddenIdsSet.has(g.codigo_legado) &&
          !hiddenIdsSet.has(g.id_origen_vinculado || '') &&
          !hiddenIdsSet.has(g.id_proyecto || '') &&
          !estaOculto(g.id)
      ),
    [rawGastosLive, hiddenIdsSet, estaOculto]
  );

  // Limpieza automática de estados optimistas cuando Dexie persiste
  useEffect(() => {
    if (estadosOptimistas.size === 0) return;
    setEstadosOptimistas((prev) => {
      let changed = false;
      const next = new Map(prev);
      rawTareas.forEach((t) => {
        const persisted = t.estado_tarea;
        if (next.has(t.id) && next.get(t.id) === persisted) {
          next.delete(t.id);
          changed = true;
        }
        if (t.codigo_legado && next.has(t.codigo_legado) && next.get(t.codigo_legado) === persisted) {
          next.delete(t.codigo_legado);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [rawTareas, estadosOptimistas.size]);

  const proyectos: CanonicalProyecto[] = useMemo(() => rawProyectos.map(normalizeProyecto), [rawProyectos]);

  const tareas: CanonicalTarea[] = useMemo(() => {
    return rawTareas.map((t) => {
      const normalizada = normalizeTarea(t);
      const opt = estadosOptimistas.get(normalizada.id) || (normalizada.codigo_legado ? estadosOptimistas.get(normalizada.codigo_legado) : undefined);
      if (opt && opt !== normalizada.estado) {
        return { ...normalizada, estado: opt };
      }
      return normalizada;
    });
  }, [rawTareas, estadosOptimistas]);

  // Índices y Mapas de Acceso O(1) canónicos para máximo rendimiento
  const proyectosMap = useMemo(() => {
    const map = new Map<string, CanonicalProyecto>();
    proyectos.forEach((p) => {
      if (p.codigo_legado) map.set(p.codigo_legado, p);
      if (p.id) map.set(p.id, p);
    });
    return map;
  }, [proyectos]);

  const hitosMap = useMemo(() => {
    const map = new Map<string, HitoWbsRecord>();
    rawHitos.forEach((h) => {
      if (h.codigo_legado) map.set(h.codigo_legado, h);
      if (h.id) map.set(h.id, h);
    });
    return map;
  }, [rawHitos]);

  const gastosPorTarea = useMemo(() => {
    const map = new Map<string, number>();
    rawGastos.forEach((g) => {
      const cod = String(g.id_origen_vinculado || g.ID_Entidad_Vinculada || g.id_tarea || '').toUpperCase();
      if (cod) {
        const monto = Number(g.monto_pen || g.monto_original || 0);
        map.set(cod, (map.get(cod) || 0) + monto);
      }
    });
    return map;
  }, [rawGastos]);

  const subtareasPorTarea = useMemo(() => {
    const map = new Map<string, SubtareaPaso[]>();
    rawSubtareas.forEach((s) => {
      const parentId = s.id_padre_vinculado;
      if (parentId) {
        if (!map.has(parentId)) map.set(parentId, []);
        map.get(parentId)!.push(s);
      }
    });
    return map;
  }, [rawSubtareas]);

  // Pre-cálculo memoizado de avances de proyectos en sidebar O(P) (REQ-FIX-08)
  const avancesPorProyecto = useMemo(() => {
    const map = new Map<string, { avanceReal: number; avanceTotalProyectado: number }>();
    if (cargandoDatosIniciales) return map;
    proyectos.forEach((proy) => {
      const key = proy.codigo_legado || proy.id;
      if (key) {
        map.set(key, calcularAvancesProyectoCanonica(proy, rawHitos, tareas));
      }
    });
    return map;
  }, [cargandoDatosIniciales, proyectos, rawHitos, tareas]);

  // Diccionario de Contadores O(1) por proyecto (REQ-SYS-002-KANBAN)
  const contadoresTareasPorProyecto = useMemo(() => {
    const map = new Map<string, { total: number; activas: number; completadas: number }>();
    const registrar = (key: string, completada: boolean) => {
      const k = key.trim().toUpperCase();
      if (!k) return;
      const curr = map.get(k) || { total: 0, activas: 0, completadas: 0 };
      map.set(k, {
        total: curr.total + 1,
        activas: curr.activas + (completada ? 0 : 1),
        completadas: curr.completadas + (completada ? 1 : 0),
      });
    };

    tareas.forEach((t) => {
      const completada = t.estado === '04_Completado' || (t.raw as Record<string, unknown> | undefined)?.estado === '05_Archivado';
      if (t.proyecto_codigo) registrar(t.proyecto_codigo, completada);
      const rawPid = t.raw?.proyecto_id || (t.raw as Record<string, unknown> | undefined)?.id_proyecto;
      if (rawPid && String(rawPid).trim().toUpperCase() !== t.proyecto_codigo?.trim().toUpperCase()) {
        registrar(String(rawPid), completada);
      }
    });

    return map;
  }, [tareas]);

  // Telemetría de Alta Precisión (REQ-PERF-02)
  const telemetriaReportadaRef = useRef(false);

  useEffect(() => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('t3_kanban_mount');
    }
    return () => {
      if (typeof performance !== 'undefined' && performance.clearMarks) {
        performance.clearMarks('t3_kanban_mount');
        performance.clearMarks('t4_kanban_cards_painted');
      }
    };
  }, []);

  useEffect(() => {
    if (!cargandoDatosIniciales && rawTareas.length > 0 && !telemetriaReportadaRef.current) {
      telemetriaReportadaRef.current = true;
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('t4_kanban_cards_painted');

        const getMarkTime = (name: string) => {
          const entries = performance.getEntriesByName(name, 'mark');
          return entries.length > 0 ? entries[entries.length - 1].startTime : null;
        };

        const t0 = getMarkTime('t0_bootstrap') ?? 0;
        const t1 = getMarkTime('t1_dexie_start') ?? t0;
        const t2 = getMarkTime('t2_dexie_resolved') ?? t1;
        const t3 = getMarkTime('t3_kanban_mount') ?? t2;
        const t4 = performance.now();

        const bootstrapMs = (t1 - t0).toFixed(2);
        const dexieMs = (t2 - t1).toFixed(2);
        const kanbanMs = (t4 - t3).toFixed(2);
        const totalMs = (t4 - t0).toFixed(2);

        if (import.meta.env.DEV) {
          console.log(
            `%c[Telemetría PMO]%c Bootstrap: ${bootstrapMs}ms | Dexie I/O: ${dexieMs}ms | Kanban Render: ${kanbanMs}ms | Total: ${totalMs}ms`,
            'color: #38bdf8; font-weight: bold; background: #0D1526; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.4);',
            'color: #94a3b8; font-weight: normal; font-family: monospace;'
          );
        }

        if (typeof window !== 'undefined') {
          interface TelemetriaWindow extends Window {
            __PMO_TELEMETRIA__?: Record<string, unknown>;
          }
          (window as TelemetriaWindow).__PMO_TELEMETRIA__ = {
            t0_bootstrap: t0,
            t1_dexie_start: t1,
            t2_dexie_resolved: t2,
            t3_kanban_mount: t3,
            t4_kanban_cards_painted: t4,
            bootstrapMs: Number(bootstrapMs),
            dexieMs: Number(dexieMs),
            kanbanMs: Number(kanbanMs),
            totalMs: Number(totalMs),
            timestamp: new Date().toISOString()
          };
        }
      }
    }
  }, [cargandoDatosIniciales, rawTareas.length]);

  // Listener para evento custom global 'pmo:clear-filters' (tecla X o botón Limpiar)
  useEffect(() => {
    const handleClearFilters = () => {
      limpiarTodosLosFiltros();
    };
    window.addEventListener('pmo:clear-filters', handleClearFilters);
    return () => {
      window.removeEventListener('pmo:clear-filters', handleClearFilters);
    };
  }, []);

  const limpiarTodosLosFiltros = () => {
    setProyectoSeleccionadoCodigo('');
    setFiltroHito('');
    setBusquedaTarea('');
    setFiltroPrioridad('');
    setFiltroEnergia('');
    setFiltroPlazo('');
    setFiltroDependencia('');
    setFiltroTemporal('TODO');
  };

  // Verificar si hay algún filtro activo de la barra Fila 2 o proyecto seleccionado
  const hayFiltrosActivos = useMemo(() => {
    return Boolean(
      proyectoSeleccionadoCodigo ||
      busquedaTarea.trim() ||
      filtroHito ||
      filtroPrioridad ||
      filtroEnergia ||
      filtroPlazo ||
      filtroDependencia ||
      filtroTemporal !== 'TODO'
    );
  }, [proyectoSeleccionadoCodigo, busquedaTarea, filtroHito, filtroPrioridad, filtroEnergia, filtroPlazo, filtroDependencia, filtroTemporal]);

  // Conteo de filtros activos para badge móvil (REQ-PWA-04)
  const totalFiltrosActivosCount = useMemo(() => {
    let count = 0;
    if (busquedaTarea.trim()) count++;
    if (filtroHito) count++;
    if (filtroPrioridad) count++;
    if (filtroEnergia) count++;
    if (filtroPlazo) count++;
    if (filtroDependencia) count++;
    if (filtroTemporal !== 'TODO') count++;
    return count;
  }, [busquedaTarea, filtroHito, filtroPrioridad, filtroEnergia, filtroPlazo, filtroDependencia, filtroTemporal]);

  // Proyectos filtrados en el sidebar
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      const coincideTipo = coincideCategoriaIniciativa(p.tipo_iniciativa, filtroTipoProyecto);
      const coincideBusqueda =
        !deferredBusquedaProyecto ||
        p.nombre.toLowerCase().includes(deferredBusquedaProyecto.toLowerCase()) ||
        p.codigo_legado.toLowerCase().includes(deferredBusquedaProyecto.toLowerCase());
      return coincideTipo && coincideBusqueda;
    });
  }, [proyectos, filtroTipoProyecto, deferredBusquedaProyecto]);

  // Proyecto activo seleccionado
  const proyectoActivo = proyectos.find((p) => p.codigo_legado === proyectoSeleccionadoCodigo);

  // Hitos disponibles para el filtro (del proyecto activo si existe)
  const hitosDisponibles = useMemo(() => {
    if (!proyectoSeleccionadoCodigo) return rawHitos;
    return rawHitos.filter((h) => {
      const pCode = h.proyecto_codigo || h.proyecto_id;
      return pCode === proyectoSeleccionadoCodigo;
    });
  }, [rawHitos, proyectoSeleccionadoCodigo]);

  // Gasto contextual calculado en PEN
  const gastoContextualPen = useMemo(() => {
    let gastosAptos = rawGastos;
    if (proyectoSeleccionadoCodigo) {
      gastosAptos = rawGastos.filter(
        (g) =>
          g.id_origen_vinculado === proyectoSeleccionadoCodigo ||
          g.id_proyecto === proyectoSeleccionadoCodigo ||
          (g as unknown as Record<string, unknown>).proyecto_codigo === proyectoSeleccionadoCodigo
      );
    }
    return gastosAptos.reduce((acc, curr) => acc + (curr.monto_pen || 0), 0);
  }, [rawGastos, proyectoSeleccionadoCodigo]);

  // Presupuesto total del proyecto o suma global si no hay proyecto filtrado
  const presupuestoContextualPen = useMemo(() => {
    if (proyectoActivo) {
      return proyectoActivo.presupuesto || 0;
    }
    return proyectos.reduce((acc, p) => acc + (p.presupuesto || 0), 0);
  }, [proyectoActivo, proyectos]);

  // Formato simple de fecha DD/MM/YYYY
  const formatearFechaSimple = (fechaIso?: string) => {
    if (!fechaIso) return null;
    const clean = fechaIso.split('T')[0];
    const partes = clean.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return clean;
  };

  // Progreso temporal del proyecto seleccionado (% transcurrido entre inicio y fin)
  const progresoTemporalProyecto = useMemo(() => {
    if (!proyectoActivo?.fecha_inicio || !proyectoActivo?.fecha_fin) return null;
    const inicio = new Date(proyectoActivo.fecha_inicio).getTime();
    const fin = new Date(proyectoActivo.fecha_fin).getTime();
    const hoy = Date.now();
    if (isNaN(inicio) || isNaN(fin) || fin <= inicio) return null;
    return Math.min(100, Math.max(0, Math.round(((hoy - inicio) / (fin - inicio)) * 100)));
  }, [proyectoActivo]);

  // Filtrado multidimensional de tareas
  const tareasFiltradas = useMemo(() => {
    return tareas.filter((t) => {
      // 1. Filtro por Proyecto del sidebar
      if (proyectoSeleccionadoCodigo) {
        if (t.proyecto_codigo !== proyectoSeleccionadoCodigo) return false;
      }

      // 2. Filtro Temporal (TODO, HOY, SEMANA, MES)
      if (filtroTemporal !== 'TODO') {
        if (!evaluarFiltroTemporal(t.fecha_programada, filtroTemporal)) return false;
      }

      // 3. Buscador libre
      if (deferredBusquedaTarea.trim()) {
        const query = deferredBusquedaTarea.toLowerCase();
        const coincideNombre = t.nombre.toLowerCase().includes(query);
        const coincideCodigo = t.codigo_legado.toLowerCase().includes(query);
        const coincideResp = t.responsable ? t.responsable.toLowerCase().includes(query) : false;
        if (!coincideNombre && !coincideCodigo && !coincideResp) return false;
      }

      // 4. Filtro por Paquete de Trabajo / Hito
      if (filtroHito) {
        if (t.hito_codigo !== filtroHito) return false;
      }

      // 5. Filtro por Prioridad Eisenhower (Matching inclusivo resiliente idéntico a legacy_gas/JS_Kanban.html L2714-L2727)
      if (filtroPrioridad) {
        const pNorm = String(t.prioridad || (t.raw as Record<string, unknown> | undefined)?.Prioridad_Eisenhower || '').toLowerCase();
        const fNorm = filtroPrioridad.toLowerCase();
        if (fNorm.includes('01') || fNorm.includes('p1') || fNorm.includes('alta')) {
          if (!pNorm.includes('01') && !pNorm.includes('p1') && !pNorm.includes('alta') && !pNorm.includes('urgente')) return false;
        } else if (fNorm.includes('02') || fNorm.includes('p2') || fNorm.includes('media')) {
          if (!pNorm.includes('02') && !pNorm.includes('p2') && !pNorm.includes('media')) return false;
        } else if (fNorm.includes('03') || fNorm.includes('p3') || fNorm.includes('baja')) {
          if (!pNorm.includes('03') && !pNorm.includes('p3') && !pNorm.includes('baja')) return false;
        } else if (fNorm.includes('04') || fNorm.includes('p4')) {
          if (!pNorm.includes('04') && !pNorm.includes('p4')) return false;
        } else if (!pNorm.includes(fNorm) && t.prioridad !== filtroPrioridad) {
          return false;
        }
      }

      // 6. Filtro por Nivel de Energía
      if (filtroEnergia) {
        const eStr = String(t.nivel_energia || (t.raw as Record<string, unknown> | undefined)?.Nivel_Energia_Requerido || '').toLowerCase();
        if (filtroEnergia === 'Alta_DeepWork') {
          if (!eStr.includes('alta') && !eStr.includes('deepwork') && !eStr.includes('estrategica')) return false;
        } else if (filtroEnergia === 'Media_Operativa') {
          if (!eStr.includes('media') && !eStr.includes('operativa')) return false;
        } else if (filtroEnergia === 'Baja_Automatica') {
          if (!eStr.includes('baja') && !eStr.includes('automatica') && !eStr.includes('mecanica') && !eStr.includes('admin')) return false;
        } else if (t.nivel_energia !== filtroEnergia) {
          return false;
        }
      }

      // 7. Filtro por Plazo / Vencimiento
      if (filtroPlazo) {
        if (!evaluarFiltroPlazo(t.fecha_programada, filtroPlazo, t.estado)) return false;
      }

      // 8. Filtro por Dependencias
      if (filtroDependencia) {
        const rawDep =
          t.id_dependencia ||
          (t.raw as Record<string, unknown> | undefined)?.id_dependencia ||
          (t.raw as Record<string, unknown> | undefined)?.ID_Dependencia ||
          (t.raw as Record<string, unknown> | undefined)?.dependencia_tarea_id;
        const depsResueltas = resolverDependenciasTarea(
          typeof rawDep === 'string' ? rawDep : undefined,
          tareasLookupMap
        );
        const tieneDep = depsResueltas.length > 0;
        if (filtroDependencia === 'con_dep' && !tieneDep) return false;
        if (filtroDependencia === 'sin_dep' && tieneDep) return false;
      }

      return true;
    });
  }, [
    tareas,
    proyectoSeleccionadoCodigo,
    filtroTemporal,
    deferredBusquedaTarea,
    filtroHito,
    filtroPrioridad,
    filtroEnergia,
    filtroPlazo,
    filtroDependencia,
    tareasLookupMap
  ]);

  // Motor de dependencias reactivo: predecesoras, sucesoras y detección de tareas ocultas
  const { predecesorasHover, sucesorasHover, predecesorasOcultas, sucesorasOcultas } = useMemo(() => {
    if (!hoveredTaskId) {
      return {
        predecesorasHover: new Set<string>(),
        sucesorasHover: new Set<string>(),
        predecesorasOcultas: [] as string[],
        sucesorasOcultas: [] as string[]
      };
    }

    const idNorm = hoveredTaskId.trim().toUpperCase();

    // Mapeo completo de dependencias desde Dexie (todas las tareas registradas)
    const depMap = new Map<string, string[]>();
    rawTareas.forEach((t) => {
      const tCode = String(t.codigo_legado || t.id || '').trim().toUpperCase();
      const rawDep = String(
        t.id_dependencia ||
        (t as unknown as Record<string, unknown>).dependencia_tarea_id ||
        ''
      ).trim();
      if (tCode) {
        const resueltas = resolverDependenciasTarea(rawDep, tareasLookupMap);
        depMap.set(tCode, resueltas.map((d) => d.codigo));
      }
    });

    // 1. Cadena de Predecesoras recursiva (hacia atrás)
    const predSet = new Set<string>();
    const buscarPredecesoras = (targetId: string) => {
      const deps = depMap.get(targetId) || [];
      deps.forEach((pId) => {
        if (pId && !predSet.has(pId)) {
          predSet.add(pId);
          buscarPredecesoras(pId);
        }
      });
    };
    buscarPredecesoras(idNorm);

    // 2. Cadena de Sucesoras recursiva (hacia adelante)
    const sucSet = new Set<string>();
    const buscarSucesoras = (targetId: string) => {
      depMap.forEach((deps, candidateId) => {
        if (deps.includes(targetId) && !sucSet.has(candidateId)) {
          sucSet.add(candidateId);
          buscarSucesoras(candidateId);
        }
      });
    };
    buscarSucesoras(idNorm);

    // Códigos de tareas visibles en pantalla según los filtros actuales
    const visiblesSet = new Set(tareasFiltradas.map((t) => t.codigo_legado.toUpperCase()));

    const predOcultas: string[] = [];
    predSet.forEach((pId) => {
      if (!visiblesSet.has(pId)) {
        predOcultas.push(pId);
      }
    });

    const sucOcultas: string[] = [];
    sucSet.forEach((sId) => {
      if (!visiblesSet.has(sId)) {
        sucOcultas.push(sId);
      }
    });

    return {
      predecesorasHover: predSet,
      sucesorasHover: sucSet,
      predecesorasOcultas: predOcultas,
      sucesorasOcultas: sucOcultas
    };
  }, [hoveredTaskId, rawTareas, tareasFiltradas, tareasLookupMap]);

  // Estilo de botones triggers de filtros
  const getFiltroTriggerClass = (activo: boolean, disabled = false, hClass = 'h-8') =>
    `${hClass} px-2.5 rounded-lg text-xs font-medium tracking-wide transition-colors inline-flex items-center gap-1.5 shrink-0 select-none border ${disabled
      ? 'opacity-40 cursor-not-allowed border-slate-800/60 bg-[#0D1526]/60 text-slate-500'
      : activo
        ? 'bg-sky-950/40 text-sky-300 border-sky-500/50 cursor-pointer'
        : 'bg-[#0D1526] border-slate-800/80 hover:border-sky-500/40 text-slate-300 hover:text-slate-100 cursor-pointer'
    }`;

  // Ejecución física de mutación en base de datos con rollback ante fallos y registro Undo
  const ejecutarMoverTarea = async (tarea: CanonicalTarea, nuevoEstado: string) => {
    const estadoAnterior = tarea.estado;
    // 1. Inyección de Estado Optimista (Cero latencia visual)
    setEstadosOptimistas((prev) => new Map(prev).set(tarea.id, nuevoEstado));

    try {
      await actualizarTarea(tarea.id, {
        estado_tarea: nuevoEstado,
        updated_at: new Date().toISOString()
      });
      if (estadoAnterior !== nuevoEstado) {
        pushUndoKanban({
          tareaId: tarea.id,
          etiqueta: `Movimiento de ${tarea.codigo_legado}`,
          estadoAnterior
        });
      }
      void syncManager.sincronizarTodo().catch(() => {});
    } catch (err) {
      console.error('Error al persistir estado de tarea en Dexie:', err);
      // Revertir optimistic UI en caso de error
      setEstadosOptimistas((prev) => {
        const next = new Map(prev);
        next.delete(tarea.id);
        return next;
      });
    }
  };

  // Transición de estado con validación Definition of Done (DoD) declarativa
  const moverTareaAEstado = async (tarea: CanonicalTarea, nuevoEstado: string) => {
    if (tarea.estado === nuevoEstado) return;

    // Validación Definition of Done (DoD) al intentar mover a '04_Completado'
    if (nuevoEstado === '04_Completado') {
      const dod = validarDoDSubtareas(tarea.codigo_legado, rawSubtareas);
      if (!dod.valido) {
        setDodAdvertencia({
          tarea,
          nuevoEstado,
          pendientes: dod.pendientes,
          total: dod.total
        });
        return;
      }
    }

    await ejecutarMoverTarea(tarea, nuevoEstado);
  };

  const handleDragOverCol = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeaveCol = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom) {
      setDragOverColId(null);
    }
  };

  const handleDropCol = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;
    const tareaArrastrada = tareas.find((t) => t.id === taskId);
    if (tareaArrastrada) {
      await moverTareaAEstado(tareaArrastrada, colId);
    }
  };

  const handleDragStartTask = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEndTask = () => {
    setDraggedTaskId(null);
    setDragOverColId(null);
  };

  const handleArchivarTarea = (tar: CanonicalTarea) => {
    const estadoPrevio = tar.estado;
    programarEliminacion({
      tabla: 'tareas',
      id: tar.id,
      etiqueta: `Archivar ${tar.codigo_legado} - ${tar.nombre}`,
      tipo: 'TAREA',
      commit: async () => {
        await db.tareas.update(tar.id, {
          estado_tarea: '05_Archivado',
          archivado: true,
          updated_at: new Date().toISOString(),
          sync_status: 'pending'
        });
        pushUndoKanban({
          tareaId: tar.id,
          etiqueta: `Archivado de ${tar.codigo_legado}`,
          estadoAnterior: estadoPrevio,
          archivadaAnterior: false
        });
        void syncManager.sincronizarTodo().catch(() => {});
      }
    });
  };

  // Deshacer última acción del tablero (Ctrl+Z / Botón Toolbar - REQ-UX-KANBAN-03)
  const deshacerUltimaAccionKanban = useCallback(async (): Promise<{
    ok: boolean;
    mensaje?: string;
  }> => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return { ok: false };

    const entry = stack[stack.length - 1];
    undoStackRef.current = stack.slice(0, -1);
    setUndoStackSize(undoStackRef.current.length);

    setEstadosOptimistas((prev) => new Map(prev).set(entry.tareaId, entry.estadoAnterior));
    const ok = await aplicarUndoKanbanLocal(entry);
    if (!ok) {
      setEstadosOptimistas((prev) => {
        const next = new Map(prev);
        next.delete(entry.tareaId);
        return next;
      });
      return { ok: false };
    }
    return { ok: true, mensaje: entry.etiqueta };
  }, []);

  // Creación rápida inline en una columna respetando Time-Blocking real (hora_inicio: '')
  const crearTareaRapidaEnColumna = useCallback(
    async (titulo: string, estadoColumna: EstadoTareaKanban | string): Promise<boolean> => {
      const tituloLimpio = titulo.trim();
      if (!tituloLimpio) return false;
      try {
        await crearTarea({
          nombre_tarea_actividad: tituloLimpio,
          estado_tarea: estadoColumna,
          proyecto_codigo: proyectoSeleccionadoCodigo || 'PRO-001',
          hito_codigo: filtroHito || undefined,
          hora_inicio: '',
          agendado_calendar: 'No'
        });
        void syncManager.sincronizarTodo().catch(() => {});
        return true;
      } catch (err) {
        console.error('[useKanbanBoard] Error en creación rápida inline de tarea:', err);
        return false;
      }
    },
    [proyectoSeleccionadoCodigo, filtroHito]
  );

  const handleEliminarTarea = (id: string, nombre: string) => {
    if (onEliminarTarea) {
      onEliminarTarea(id, nombre);
    } else {
      programarEliminacion({
        tabla: 'tareas',
        id,
        etiqueta: nombre || 'Tarea',
        tipo: 'TAREA',
        commit: async () => {
          const tar = rawTareasLive?.find((t) => t.id === id);
          await eliminarTarea(id, tar?.codigo_legado);
        }
      });
    }
  };

  // Ordenamiento determinista de tareas según criterio seleccionado
  const ordenarTareas = (taskList: CanonicalTarea[]) => {
    return [...taskList].sort((a, b) => {
      if (criterioOrden === 'PRIORITY') {
        const mapPrio: Record<string, number> = {
          '01_P1_Alta': 1,
          '02_P2_Media': 2,
          '03_P3_Baja': 3,
          '04_P4': 4
        };
        const pA = mapPrio[a.prioridad] || 99;
        const pB = mapPrio[b.prioridad] || 99;
        return pA - pB;
      }
      if (criterioOrden === 'DATE') {
        if (!a.fecha_programada) return 1;
        if (!b.fecha_programada) return -1;
        return a.fecha_programada.localeCompare(b.fecha_programada);
      }
      if (criterioOrden === 'ENERGY') {
        const mapE: Record<string, number> = {
          'Alta_DeepWork': 1,
          'Media_Operativa': 2,
          'Baja_Automatica': 3
        };
        const eA = mapE[a.nivel_energia || ''] || 99;
        const eB = mapE[b.nivel_energia || ''] || 99;
        return eA - eB;
      }
      if (criterioOrden === 'HOURS') {
        return (b.horas_estimadas || 0) - (a.horas_estimadas || 0);
      }
      if (criterioOrden === 'ALPHA') {
        return a.nombre.localeCompare(b.nombre);
      }
      return 0;
    });
  };

  // Memoización de Tareas Agrupadas por Columna (REQ-SYS-003-KANBAN)
  const tareasAgrupadasPorColumna = useMemo<Record<string, CanonicalTarea[]>>(() => {
    const grupos: Record<string, CanonicalTarea[]> = {
      '01_Backlog': [],
      '02_Por_Hacer': [],
      '03_En_Proceso': [],
      '04_Completado': []
    };

    tareasFiltradas.forEach((t) => {
      if (grupos[t.estado]) {
        grupos[t.estado].push(t);
      } else {
        grupos['01_Backlog'].push(t);
      }
    });

    return {
      '01_Backlog': ordenarTareas(grupos['01_Backlog']),
      '02_Por_Hacer': ordenarTareas(grupos['02_Por_Hacer']),
      '03_En_Proceso': ordenarTareas(grupos['03_En_Proceso']),
      '04_Completado': ordenarTareas(grupos['04_Completado'])
    };
  }, [tareasFiltradas, criterioOrden]);

  const columnaMovilSeleccionada =
    COLUMNAS_KANBAN.find((c) => c.id === columnaMovilActiva) ?? COLUMNAS_KANBAN[0];

  const abrirModalNuevaTarea = (colId: string) => {
    setTareaSeleccionadaId(null);
    setColumnaNuevaTarea(colId);
    setModalTareaFlowAbierto(true);
  };

  const abrirModalEditarTarea = (id: string, estado: string) => {
    setTareaSeleccionadaId(id);
    setColumnaNuevaTarea(estado);
    setModalTareaFlowAbierto(true);
  };

  return {
    // Sidebar & Selección
    sidebarColapsado,
    setSidebarColapsado,
    busquedaProyecto,
    setBusquedaProyecto,
    deferredBusquedaProyecto,
    filtroTipoProyecto,
    setFiltroTipoProyecto,
    proyectoSeleccionadoCodigo,
    setProyectoSeleccionadoCodigo,
    startKanbanTransition,
    proyectoActivo,
    proyectosFiltrados,
    avancesPorProyecto,
    contadoresTareasPorProyecto,

    // Filtros & Ordenamiento
    filtroTemporal,
    setFiltroTemporal,
    dropdownTiempoAbierto,
    setDropdownTiempoAbierto,
    criterioOrden,
    setCriterioOrden,
    busquedaTarea,
    setBusquedaTarea,
    deferredBusquedaTarea,
    filtroHito,
    setFiltroHito,
    filtroPrioridad,
    setFiltroPrioridad,
    filtroEnergia,
    setFiltroEnergia,
    filtroPlazo,
    setFiltroPlazo,
    filtroDependencia,
    setFiltroDependencia,
    popoverHitoAbierto,
    setPopoverHitoAbierto,
    popoverPrioAbierto,
    setPopoverPrioAbierto,
    popoverEnergiaAbierto,
    setPopoverEnergiaAbierto,
    popoverPlazoAbierto,
    setPopoverPlazoAbierto,
    popoverDepAbierto,
    setPopoverDepAbierto,
    closeAllPopovers,
    closeAllPopoversExcept,
    handlePopoverMouseEnter,
    handlePopoverMouseLeave,
    hayFiltrosActivos,
    totalFiltrosActivosCount,
    limpiarTodosLosFiltros,
    getFiltroTriggerClass,

    // Ergonomía Móvil
    columnaMovilActiva,
    setColumnaMovilActiva,
    drawerFiltrosMovilAbierto,
    setDrawerFiltrosMovilAbierto,
    selectorProyectosMovilAbierto,
    setSelectorProyectosMovilAbierto,
    columnaMovilSeleccionada,

    // Datos & Métricas
    cargandoDatosIniciales,
    proyectos,
    tareas,
    tareasFiltradas,
    tareasAgrupadasPorColumna,
    hitosDisponibles,
    gastoContextualPen,
    presupuestoContextualPen,
    progresoTemporalProyecto,
    formatearFechaSimple,

    // Mapas O(1)
    proyectosMap,
    hitosMap,
    gastosPorTarea,
    subtareasPorTarea,
    tareasLookupMap,

    // Drag & Drop y Dependencias
    draggedTaskId,
    dragOverColId,
    hoveredTaskId,
    setHoveredTaskId,
    predecesorasHover,
    sucesorasHover,
    predecesorasOcultas,
    sucesorasOcultas,
    handleDragOverCol,
    handleDragLeaveCol,
    handleDropCol,
    handleDragStartTask,
    handleDragEndTask,

    // Mutaciones & Acciones
    ejecutarMoverTarea,
    moverTareaAEstado,
    handleArchivarTarea,
    handleEliminarTarea,
    puedeDeshacerKanban: undoStackSize > 0,
    deshacerUltimaAccionKanban,
    crearTareaRapidaEnColumna,

    // Modales
    modalTareaFlowAbierto,
    setModalTareaFlowAbierto,
    tareaSeleccionadaId,
    setTareaSeleccionadaId,
    columnaNuevaTarea,
    setColumnaNuevaTarea,
    modalNuevoProyectoAbierto,
    setModalNuevoProyectoAbierto,
    dodAdvertencia,
    setDodAdvertencia,
    abrirModalNuevaTarea,
    abrirModalEditarTarea,

    // Columnas
    columnas: COLUMNAS_KANBAN
  };
}
