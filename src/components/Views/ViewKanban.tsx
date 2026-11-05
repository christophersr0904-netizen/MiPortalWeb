import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  Layers,
  Calendar,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Milestone,
  Flame,
  ArrowUpDown,
  Activity,
  Coffee,
  AlertTriangle,
  CalendarDays,
  CalendarOff,
  CalendarRange,
  CalendarCheck,
  Lock,
  Unlock,
  Link2,
  ArrowDownCircle,
  CheckSquare,
  Check,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import {
  normalizeProyecto,
  normalizeTarea,
  type CanonicalProyecto,
  type CanonicalTarea,
  validarDoDSubtareas,
  evaluarFiltroTemporal,
  evaluarFiltroPlazo,
  calcularAvancesProyectoCanonica
} from '../../utils/entityNormalizer';
import { ModalTareaFlow } from '../Modals/ModalTareaFlow';
import { ModalNuevoProyecto } from '../Modals/ModalNuevoProyecto';
import { ModalDoDAdvertencia } from '../Modals/ModalDoDAdvertencia';
import { ColumnaKanban } from '../PMO/ColumnaKanban';

interface ViewKanbanProps {
  onSeleccionarProyecto?: (proyectoId: string) => void;
  onVerDetalle360?: (proyectoId: string) => void;
  onNuevoProyecto?: () => void;
  onEliminarTarea?: (tareaId: string, nombreTarea: string) => void;
}

type TimeFilter = 'TODO' | 'HOY' | 'SEMANA' | 'MES';
type SortFilter = 'PRIORITY' | 'DATE' | 'ENERGY' | 'HOURS' | 'ALPHA';

export const ViewKanban: React.FC<ViewKanbanProps> = ({
  onSeleccionarProyecto,
  onVerDetalle360,
  onNuevoProyecto,
  onEliminarTarea
}) => {
  // Sidebar State
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  const [busquedaProyecto, setBusquedaProyecto] = useState('');
  const [filtroTipoProyecto, setFiltroTipoProyecto] = useState<string>('');
  const [proyectoSeleccionadoCodigo, setProyectoSeleccionadoCodigo] = useState<string | null>(null);

  // Filtro Temporal
  const [filtroTemporal, setFiltroTemporal] = useState<TimeFilter>('TODO');
  const [dropdownTiempoAbierto, setDropdownTiempoAbierto] = useState(false);

  // Fila 2 State: Filtros Multidimensionales y Ordenamiento
  const [criterioOrden, setCriterioOrden] = useState<SortFilter>('PRIORITY');
  const [busquedaTarea, setBusquedaTarea] = useState('');
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

  // Estados para vistas y ergonomía móvil (REQ-PWA-04)
  const [columnaMovilActiva, setColumnaMovilActiva] = useState<string>('02_Por_Hacer');
  const [drawerFiltrosMovilAbierto, setDrawerFiltrosMovilAbierto] = useState<boolean>(false);

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

  // Listener global para cerrar popovers al hacer clic fuera o presionar Escape
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
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

  // Modal Declarativo Bento para Advertencia Definition of Done (DoD)
  const [dodAdvertencia, setDodAdvertencia] = useState<{
    tarea: CanonicalTarea;
    nuevoEstado: string;
    pendientes: number;
    total: number;
  } | null>(null);

  const { programarEliminacion, estaOculto } = useUndoDelete();

  // Live queries reactivas desde Dexie filtradas con el búfer de deshacer
  const rawProyectosLive = useLiveQuery(() => db.proyectos.toArray(), []);
  const rawTareasLive = useLiveQuery(() => db.tareas.toArray(), []);
  const rawSubtareasLive = useLiveQuery(() => db.subtareas_pasos.toArray(), []);
  const rawHitosLive = useLiveQuery(() => db.hitos_wbs.toArray(), []);
  const rawGastosLive = useLiveQuery(() => db.gastos.toArray(), []);

  const cargandoDatosIniciales = rawTareasLive === undefined || rawProyectosLive === undefined;

  const rawProyectos = useMemo(
    () => (rawProyectosLive ?? []).filter((p: any) => !estaOculto(p.id) && !estaOculto(p.codigo_legado)),
    [rawProyectosLive, estaOculto]
  );
  const rawTareas = useMemo(
    () => (rawTareasLive ?? []).filter((t: any) => !estaOculto(t.id) && !estaOculto(t.codigo_legado) && !estaOculto(t.proyecto_codigo) && !estaOculto(t.proyecto_id)),
    [rawTareasLive, estaOculto]
  );
  const rawSubtareas = useMemo(
    () => (rawSubtareasLive ?? []).filter((s: any) => !estaOculto(s.id) && !estaOculto(s.codigo_legado) && !estaOculto(s.id_padre_vinculado)),
    [rawSubtareasLive, estaOculto]
  );
  const rawHitos = useMemo(
    () => (rawHitosLive ?? []).filter((h: any) => !estaOculto(h.id) && !estaOculto(h.codigo_legado) && !estaOculto(h.proyecto_id)),
    [rawHitosLive, estaOculto]
  );
  const rawGastos = useMemo(
    () => (rawGastosLive ?? []).filter((g: any) => !estaOculto(g.id) && !estaOculto(g.codigo_legado) && !estaOculto(g.id_origen_vinculado) && !estaOculto(g.ID_Proyecto)),
    [rawGastosLive, estaOculto]
  );

  // Limpieza automática de estados optimistas cuando Dexie persiste
  useEffect(() => {
    if (estadosOptimistas.size === 0) return;
    setEstadosOptimistas((prev) => {
      let changed = false;
      const next = new Map(prev);
      rawTareas.forEach((t: any) => {
        const persisted = t.estado_tarea || t.estado || t.Estado_Tarea;
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
    const map = new Map<string, any>();
    rawHitos.forEach((h: any) => {
      if (h.codigo_legado) map.set(h.codigo_legado, h);
      if (h.id_hito) map.set(h.id_hito, h);
      if (h.ID_Hito) map.set(h.ID_Hito, h);
      if (h.id) map.set(h.id, h);
    });
    return map;
  }, [rawHitos]);

  const gastosPorTarea = useMemo(() => {
    const map = new Map<string, number>();
    rawGastos.forEach((g: any) => {
      const cod = String(g.id_entidad_vinculada || g.id_tarea || g.ID_Entidad_Vinculada || g.ID_Tarea || '').toUpperCase();
      if (cod) {
        const monto = Number(g.monto_pen || g.monto_original || g.Monto_PEN || g.Monto_Original || 0);
        map.set(cod, (map.get(cod) || 0) + monto);
      }
    });
    return map;
  }, [rawGastos]);

  const subtareasPorTarea = useMemo(() => {
    const map = new Map<string, typeof rawSubtareas>();
    rawSubtareas.forEach((s) => {
      const parentId = s.id_padre_vinculado;
      if (parentId) {
        if (!map.has(parentId)) map.set(parentId, []);
        map.get(parentId)!.push(s);
      }
    });
    return map;
  }, [rawSubtareas]);

  // Pre-cálculo memoizado de avances de proyectos en sidebar O(P)
  const avancesPorProyecto = useMemo(() => {
    const map = new Map<string, { avanceReal: number; avanceTotalProyectado: number }>();
    proyectos.forEach((proy) => {
      const key = proy.codigo_legado || proy.id;
      if (key) {
        map.set(key, calcularAvancesProyectoCanonica(proy, rawHitos, rawTareas));
      }
    });
    return map;
  }, [proyectos, rawHitos, rawTareas]);

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
      const completada = t.estado === '04_Completado' || (t as any).estado === '05_Archivado';
      if (t.proyecto_codigo) registrar(t.proyecto_codigo, completada);
      const rawPid = t.raw?.proyecto_id || t.raw?.ID_Proyecto || t.raw?.id_proyecto;
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
  }, []);

  useEffect(() => {
    if (!cargandoDatosIniciales && rawTareas.length > 0 && !telemetriaReportadaRef.current) {
      telemetriaReportadaRef.current = true;
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('t4_kanban_cards_painted');

        const getMarkTime = (name: string) => {
          const entries = performance.getEntriesByName(name, 'mark');
          return entries.length > 0 ? entries[0].startTime : null;
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

        console.log(
          `%c[Telemetría PMO]%c Bootstrap: ${bootstrapMs}ms | Dexie I/O: ${dexieMs}ms | Kanban Render: ${kanbanMs}ms | Total: ${totalMs}ms`,
          'color: #38bdf8; font-weight: bold; background: #0D1526; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.4);',
          'color: #94a3b8; font-weight: normal; font-family: monospace;'
        );

        if (typeof window !== 'undefined') {
          (window as any).__PMO_TELEMETRIA__ = {
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
      const coincideTipo = !filtroTipoProyecto || p.tipo_iniciativa?.toLowerCase() === filtroTipoProyecto.toLowerCase();
      const coincideBusqueda =
        !busquedaProyecto ||
        p.nombre.toLowerCase().includes(busquedaProyecto.toLowerCase()) ||
        p.codigo_legado.toLowerCase().includes(busquedaProyecto.toLowerCase());
      return coincideTipo && coincideBusqueda;
    });
  }, [proyectos, filtroTipoProyecto, busquedaProyecto]);

  // Proyecto activo seleccionado
  const proyectoActivo = proyectos.find((p) => p.codigo_legado === proyectoSeleccionadoCodigo);

  // Hitos disponibles para el filtro (del proyecto activo si existe)
  const hitosDisponibles = useMemo(() => {
    if (!proyectoSeleccionadoCodigo) return rawHitos;
    return rawHitos.filter((h) => {
      const pCode = (h as any).proyecto_codigo || h.proyecto_id;
      return pCode === proyectoSeleccionadoCodigo;
    });
  }, [rawHitos, proyectoSeleccionadoCodigo]);

  // Gasto contextual calculado en PEN
  const gastoContextualPen = useMemo(() => {
    let gastosAptos = rawGastos;
    if (proyectoSeleccionadoCodigo) {
      gastosAptos = rawGastos.filter(
        (g) => g.id_origen_vinculado === proyectoSeleccionadoCodigo || (g as any).proyecto_codigo === proyectoSeleccionadoCodigo
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
      if (busquedaTarea.trim()) {
        const query = busquedaTarea.toLowerCase();
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
        const pNorm = String(t.prioridad || t.raw?.Prioridad_Eisenhower || '').toLowerCase();
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
        const eStr = String(t.nivel_energia || t.raw?.Nivel_Energia_Requerido || '').toLowerCase();
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
        const tieneDep = Boolean(t.raw?.id_dependencia || t.raw?.ID_Dependencia);
        if (filtroDependencia === 'con_dep' && !tieneDep) return false;
        if (filtroDependencia === 'sin_dep' && tieneDep) return false;
      }

      return true;
    });
  }, [
    tareas,
    proyectoSeleccionadoCodigo,
    filtroTemporal,
    busquedaTarea,
    filtroHito,
    filtroPrioridad,
    filtroEnergia,
    filtroPlazo,
    filtroDependencia,
    proyectos
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
    rawTareas.forEach((t: any) => {
      const tCode = String(t.codigo_legado || t.id_tarea || t.ID_Tarea || '').trim().toUpperCase();
      const rawDep = String(t.id_dependencia || t.ID_Dependencia || t.raw?.id_dependencia || t.raw?.ID_Dependencia || '').trim().toUpperCase();
      if (tCode) {
        if (rawDep && !rawDep.includes('@GOOGLE.COM')) {
          const parts = rawDep.split(/[,;]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);
          depMap.set(tCode, parts);
        } else {
          depMap.set(tCode, []);
        }
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
  }, [hoveredTaskId, rawTareas, tareasFiltradas]);

  // Columnas Kanban Canónicas
  const columnas = [
    {
      id: '01_Backlog',
      domId: 'col-backlog',
      titulo: 'Backlog',
      color: 'border-slate-500/40 text-slate-300 bg-slate-100/70 dark:bg-slate-900',
      iconoColor: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/70 dark:border-slate-700 shadow-2xs',
      badgeColor: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/70 dark:border-slate-700',
      tituloColor: 'text-slate-700 dark:text-slate-200',
      headerGlow: false
    },
    {
      id: '02_Por_Hacer',
      domId: 'col-por-hacer',
      titulo: 'Por Hacer',
      color: 'border-sky-500/40 text-sky-400 bg-blue-50/20 dark:bg-slate-900',
      iconoColor: 'bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-2xs',
      badgeColor: 'bg-sky-500/10 border border-sky-500/30 text-sky-300',
      tituloColor: 'text-sky-400',
      headerGlow: false
    },
    {
      id: '03_En_Proceso',
      domId: 'col-en-proceso',
      titulo: 'En Proceso',
      color: 'border-amber-500/40 text-amber-400 bg-amber-50/20 dark:bg-slate-900',
      iconoColor: 'relative bg-amber-500/15 border border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      badgeColor: 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      tituloColor: 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]',
      headerGlow: true
    },
    {
      id: '04_Completado',
      domId: 'col-completado',
      titulo: 'Completado',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-50/20 dark:bg-slate-900',
      iconoColor: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-2xs',
      badgeColor: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300',
      tituloColor: 'text-emerald-400',
      headerGlow: false
    }
  ];

  // Ejecución física de mutación en base de datos con rollback ante fallos
  const ejecutarMoverTarea = async (tarea: CanonicalTarea, nuevoEstado: string) => {
    // 1. Inyección de Estado Optimista (Cero latencia visual)
    setEstadosOptimistas((prev) => new Map(prev).set(tarea.id, nuevoEstado));

    try {
      await db.tareas.update(tarea.id, {
        estado_tarea: nuevoEstado,
        updated_at: new Date().toISOString()
      });
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
    programarEliminacion({
      tabla: 'tareas',
      id: tar.id,
      etiqueta: `Archivar ${tar.codigo_legado} - ${tar.nombre}`,
      tipo: 'TAREA',
      commit: async () => {
        await db.tareas.update(tar.id, {
          estado_tarea: '05_Archivado',
          archivado: true,
          updated_at: new Date().toISOString()
        });
      }
    });
  };

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
          await db.tareas.delete(id);
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
  // Desacopla la distribución de columnas del renderizado de popovers y chasis Kanban
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

  return (
    <div
      id="vista-kanban-wrapper"
      className={`flex-1 h-full w-full overflow-y-auto md:overflow-hidden grid grid-cols-1 ${
        sidebarColapsado ? 'md:grid-cols-[64px_1fr]' : 'md:grid-cols-[288px_1fr] lg:grid-cols-[320px_1fr]'
      } transition-[grid-template-columns] duration-300 ease-out`}
    >
      {/* =================================================================== */}
      {/* 1. SIDEBAR DE PROYECTOS CANÓNICO                                    */}
      {/* =================================================================== */}
      <aside
        id="sidebar-portafolio"
        className={`${
          sidebarColapsado ? 'sidebar-collapsed' : 'sidebar-expanded'
        } hidden md:flex flex-col bg-[#070C18] text-slate-100 border-r border-slate-800/80 w-full h-full z-40 overflow-hidden select-none transition-colors duration-200`}
      >
        {/* Cabecera del Sidebar */}
        <div className="p-3 border-b border-slate-800/80 bg-[#070C18] shrink-0">
          <div className={`flex items-center ${sidebarColapsado ? 'justify-center' : 'justify-between'} gap-2`}>
            {!sidebarColapsado && (
              <div className="flex items-center gap-2 min-w-0">
                <FolderKanban className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
                <h1 className="text-xs font-black tracking-wider uppercase text-slate-100 truncate">Proyectos</h1>
                <span
                  id="badge-total-proyectos-sidebar"
                  className="px-2 py-0.5 text-[10px] font-mono tabular-nums font-bold rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 shrink-0"
                >
                  {proyectosFiltrados.length}
                </span>
              </div>
            )}
            <button
              type="button"
              id="btn-toggle-sidebar-header"
              onClick={() => setSidebarColapsado(!sidebarColapsado)}
              title={sidebarColapsado ? 'Expandir panel lateral' : 'Contraer panel lateral'}
              className="p-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-sky-500/50 hover:shadow-[0_0_10px_rgba(56,189,248,0.25)] shadow-xs transition-all duration-200 shrink-0 flex items-center justify-center cursor-pointer"
            >
              {sidebarColapsado ? <ChevronRight className="w-4 h-4" strokeWidth={1.75} /> : <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />}
            </button>
          </div>

          {!sidebarColapsado && (
            <>
              {/* Buscador de proyectos en vivo */}
              <div className="mt-2.5 relative">
                <Search className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 w-4 h-4 top-2" strokeWidth={1.75} />
                <input
                  type="text"
                  id="sidebar-search-proyectos"
                  value={busquedaProyecto}
                  onChange={(e) => setBusquedaProyecto(e.target.value)}
                  placeholder="Buscar por nombre o PRO-..."
                  className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-400 text-xs rounded-lg border border-slate-700/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 pl-8 pr-7 py-1.5 transition outline-none"
                />
                {busquedaProyecto && (
                  <button
                    type="button"
                    onClick={() => setBusquedaProyecto('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>

              {/* Filtros rápidos por Cartera */}
              <div className="flex items-center gap-1 flex-wrap mt-2 pt-2 border-t border-slate-800/60">
                {['', 'Personal', 'Profesional', 'Inversiones', 'Social'].map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFiltroTipoProyecto(tipo)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition cursor-pointer ${
                      filtroTipoProyecto === tipo
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tipo || 'Todos'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Listado de Proyectos */}
        <div id="lista-proyectos-sidebar" className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
          {cargandoDatosIniciales ? (
            <div className="space-y-2 p-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse bg-[#0D1526]/40 rounded-xl border border-slate-800/40 h-16 p-2.5 space-y-2">
                  <div className="h-3.5 w-3/4 bg-slate-700/60 rounded"></div>
                  <div className="h-2 w-1/2 bg-slate-700/40 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            proyectosFiltrados.map((proy) => {
              const isActivo = proyectoSeleccionadoCodigo === proy.codigo_legado;
              const avances = avancesPorProyecto.get(proy.codigo_legado || proy.id) || { avanceReal: 0, avanceTotalProyectado: 0 };
              const pct = avances.avanceReal;
              const metaPct = avances.avanceTotalProyectado;

              // Acceso O(1) instantáneo a contadores de tareas
              const contadores =
                contadoresTareasPorProyecto.get(proy.codigo_legado?.trim().toUpperCase()) ||
                contadoresTareasPorProyecto.get(proy.id?.trim().toUpperCase()) ||
                { total: 0, activas: 0, completadas: 0 };

              // Salud semántica determinista
              const rawHealth = String(proy.health_status || proy.raw?.Health_Status || 'En Rango');
              let healthLabel = 'En Rango';
              let healthBadgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
              let healthDot = 'bg-emerald-400';

              if (/bloqueado|cr[ií]tico|danger|rojo/i.test(rawHealth)) {
                healthLabel = 'Bloqueado';
                healthBadgeClass = 'bg-rose-600/20 text-rose-300 border border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse';
                healthDot = 'bg-rose-500';
              } else if (/riesgo|alerta|warning|amarillo/i.test(rawHealth)) {
                healthLabel = 'En Riesgo';
                healthBadgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
                healthDot = 'bg-amber-400';
              }

              return (
                <div
                  key={proy.id}
                  onClick={() => {
                    if (isActivo) {
                      setProyectoSeleccionadoCodigo(null);
                    } else {
                      setProyectoSeleccionadoCodigo(proy.codigo_legado);
                    }
                  }}
                  title={sidebarColapsado ? `${proy.codigo_legado} · ${proy.nombre} (${healthLabel} - ${pct}%) · ${contadores.activas}/${contadores.total} tareas` : undefined}
                  className={`group relative overflow-hidden transition-all duration-200 cursor-pointer ${
                    sidebarColapsado ? 'p-2 flex flex-col items-center justify-center gap-1.5' : 'p-2.5'
                  } rounded-xl border ${
                    isActivo
                      ? 'bg-[#0A101C] border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.12)] text-white before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-sky-400 before:shadow-[0_0_12px_#38bdf8] before:transition-transform before:scale-y-100 before:rounded-l-xl'
                      : 'bg-[#0D1526]/50 hover:bg-[#0D1526]/90 border-slate-800/40 hover:border-slate-700/80 text-slate-300 hover:translate-x-0.5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-transparent before:scale-y-0 before:transition-transform'
                  }`}
                >
                  {!sidebarColapsado ? (
                    <>
                      {/* 1. Cabecera con código PRO-XXX, cápsula O(1) de tareas, tipo y botón 360° */}
                      <div className="flex items-center justify-between gap-1 mb-1.5 text-[10px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono font-bold text-slate-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800/80 shrink-0">
                            {proy.codigo_legado}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 font-semibold text-[9px] truncate">
                            {proy.tipo_iniciativa || 'General'}
                          </span>
                          {/* Cápsula de conteo O(1) en font-mono tabular-nums */}
                          <div
                            className="flex items-center gap-1 font-mono tabular-nums text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/80 shrink-0"
                            title={`${contadores.activas} activas de ${contadores.total} tareas totales (${contadores.completadas} completadas)`}
                          >
                            <CheckSquare className="w-2.5 h-2.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                            <span>{contadores.activas}/{contadores.total}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetId = proy.codigo_legado || proy.id;
                              if (onVerDetalle360) {
                                onVerDetalle360(targetId);
                              } else if (onSeleccionarProyecto) {
                                onSeleccionarProyecto(targetId);
                              }
                            }}
                            title="Ver Detalle 360°"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-600/90 hover:bg-sky-500 text-white shadow-xs border border-sky-400/40 flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-sky-200" strokeWidth={1.75} />
                            <span>360°</span>
                          </button>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${healthBadgeClass}`}>
                            <span className="relative flex h-2 w-2 shrink-0">
                              {healthLabel === 'Bloqueado' && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              )}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${healthDot}`} />
                            </span>
                            <span>{healthLabel}</span>
                          </span>
                        </div>
                      </div>

                      {/* 2. Título del proyecto */}
                      <div className="text-sm font-medium text-slate-200 truncate mb-1.5" title={proy.nombre}>
                        {proy.nombre}
                      </div>

                      {/* 3. Doble métrica textual de progreso: Avance vs Meta canónica */}
                      <div className="space-y-1.5 mt-2 pt-1 border-t border-slate-700/40">
                        <div className="flex justify-between text-[11px] font-mono tabular-nums leading-none">
                          <span className="text-slate-400">Avance: <b className="text-sky-300 font-bold">{pct}%</b></span>
                          <span className="text-amber-300/90 font-medium">Meta: {metaPct}%</span>
                        </div>

                        {/* 4. Barra de progreso horizontal de doble tonalidad */}
                        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden relative">
                          <div
                            className="bg-sky-400/25 h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                            style={{ width: `${metaPct}%` }}
                          />
                          <div
                            className="bg-sky-500 h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                      <FolderKanban className="w-5 h-5 mx-auto text-slate-400 group-hover:text-sky-300 transition-colors duration-150" strokeWidth={1.75} />
                      <span className="relative flex h-2.5 w-2.5">
                        {healthLabel === 'Bloqueado' && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${healthDot}`} />
                      </span>
                      {contadores.total > 0 && (
                        <span className="font-mono tabular-nums text-[9px] text-sky-400 bg-sky-950/40 px-1 py-0.2 rounded border border-sky-800/50">
                          {contadores.activas}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Sidebar: Botón Canónico "Nuevo Proyecto" */}
        <div className="p-2.5 border-t border-slate-800/80 bg-[#070C18] shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onNuevoProyecto) {
                onNuevoProyecto();
              } else {
                setModalNuevoProyectoAbierto(true);
              }
            }}
            className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-sky-950/40 flex items-center justify-center gap-2 transition duration-150 border border-sky-400/30 cursor-pointer"
            title="Crear nuevo proyecto"
          >
            <Plus className="w-4 h-4 text-sky-200 shrink-0" strokeWidth={1.75} />
            {!sidebarColapsado && <span className="whitespace-nowrap font-semibold">Nuevo Proyecto</span>}
          </button>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* 2. ÁREA CENTRAL DEL TABLERO KANBAN                                 */}
      {/* =================================================================== */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-100 dark:bg-[#040711] transition-colors duration-200">
        {/* ================================================================= */}
        {/* SELECTOR / CARRUSEL MÓVIL DE PROYECTOS & GASTO (md:hidden)        */}
        {/* ================================================================= */}
        <div
          id="carrusel-proyectos-movil"
          className="md:hidden shrink-0 h-9 bg-slate-100/95 dark:bg-[#070C18]/95 border-b border-slate-200 dark:border-slate-800/60 px-2.5 py-1 flex items-center justify-between gap-2 select-none"
        >
          {/* Carrusel horizontal de chips de proyecto (Paso 1) */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden overscroll-contain min-w-0">
            <button
              type="button"
              onClick={() => setProyectoSeleccionadoCodigo(null)}
              className={`h-7 px-2.5 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 ${
                proyectoSeleccionadoCodigo === null
                  ? 'bg-sky-500/20 text-sky-400 dark:text-sky-300 border border-sky-500/40 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderKanban className="w-3 h-3 shrink-0" strokeWidth={1.75} />
              <span>Todos</span>
              <span className="font-mono tabular-nums text-[10px] opacity-75">
                ({proyectos.length})
              </span>
            </button>
            {proyectos.map((proy) => {
              const isActivo = proyectoSeleccionadoCodigo === proy.codigo_legado;
              return (
                <button
                  key={proy.id}
                  type="button"
                  onClick={() => setProyectoSeleccionadoCodigo(isActivo ? null : proy.codigo_legado)}
                  className={`h-7 px-2.5 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 ${
                    isActivo
                      ? 'bg-sky-500/20 text-sky-400 dark:text-sky-300 border border-sky-500/40 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={proy.nombre}
                >
                  <span className="font-mono tabular-nums text-[10px] font-bold text-sky-400">
                    {proy.codigo_legado}
                  </span>
                  <span className="max-w-[110px] truncate">{proy.nombre}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                if (onNuevoProyecto) onNuevoProyecto();
                else setModalNuevoProyectoAbierto(true);
              }}
              className="h-7 px-2 py-0.5 rounded-lg text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-500/30 whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
              title="Crear Nuevo Proyecto"
            >
              <Plus className="w-3 h-3" strokeWidth={1.75} />
              <span>Proyecto</span>
            </button>
          </div>

          {/* Micro-Badge Integrado de Gasto Contextual en Móvil (REQ-PWA-05) */}
          <div
            id="kanban-gasto-presupuesto-box-movil"
            className="shrink-0 flex items-center gap-1 text-[10px] bg-white/80 dark:bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 font-medium"
            title={proyectoActivo ? `Gasto ${proyectoActivo.codigo_legado}` : 'Gasto Global'}
          >
            <span className="text-slate-400 font-mono text-[9px]">PEN</span>
            <b className="text-slate-800 dark:text-slate-200 font-bold font-mono tabular-nums text-[10.5px]">
              {gastoContextualPen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </b>
          </div>
        </div>
        {/* ================================================================= */}
        {/* HEADER MULTI-FILA CANÓNICO (L81-546 de View_Kanban.html)          */}
        {/* ================================================================= */}
        <header className="bg-white dark:bg-[#080E1C] border-b border-slate-200 dark:border-slate-800/60 px-2.5 py-1.5 md:px-4 md:py-2 shrink-0 flex flex-col gap-1.5 md:gap-2 shadow-2xs transition-colors overflow-visible relative">
          {/* =============================================================== */}
          {/* FILA 1: CONTEXTO DE PROYECTO, CRONOGRAMA & GASTO GLOBAL          */}
          {/* =============================================================== */}
          <div className="hidden md:flex items-center justify-between gap-3 min-h-[38px] overflow-visible relative w-full flex-wrap pb-1 border-b border-slate-200/60 dark:border-slate-800/40">
            {/* Lado Izquierdo: Título y Píldora de Estado (Vista Global o Proyecto Activo) */}
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <h2 className="hidden md:flex font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base items-center gap-2 shrink-0">
                <span>Tablero Kanban</span>
              </h2>

              {/* Píldora de Estado: Proyecto Seleccionado o Vista Global */}
              {proyectoActivo ? (
                (() => {
                  const healthStatus = (proyectoActivo.health_status || (proyectoActivo as any).estado_salud || 'Saludable').toLowerCase();
                  const esCritico = healthStatus.includes('crit') || healthStatus.includes('rojo') || (proyectoActivo.cpi !== undefined && proyectoActivo.cpi < 0.85);
                  const esRiesgo = healthStatus.includes('riesgo') || healthStatus.includes('amarillo') || healthStatus.includes('warn') || (proyectoActivo.cpi !== undefined && proyectoActivo.cpi < 1.0);
                  const estiloSalud = esCritico
                    ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                    : esRiesgo
                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300';

                  return (
                    <div
                      id="label-proyecto-activo"
                      className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1.5 shrink-0 shadow-xs transition-all ${estiloSalud}`}
                    >
                      <FolderKanban className="w-3.5 h-3.5 shrink-0 opacity-90" strokeWidth={1.75} />
                      <span className="font-mono font-bold tracking-tight">[{proyectoActivo.codigo_legado}]</span>
                      <span className="truncate max-w-[140px] md:max-w-[220px]" title={proyectoActivo.nombre}>
                        {proyectoActivo.nombre}
                      </span>
                      {proyectoActivo.cpi !== undefined && (
                        <span className="font-mono tabular-nums text-[10px] px-1 py-0.2 rounded bg-black/30 border border-white/10" title="CPI">
                          CPI {proyectoActivo.cpi.toFixed(2)}
                        </span>
                      )}
                      {(onVerDetalle360 || onSeleccionarProyecto) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onVerDetalle360) onVerDetalle360(proyectoActivo.id);
                            else if (onSeleccionarProyecto) onSeleccionarProyecto(proyectoActivo.id);
                          }}
                          className="hover:bg-white/10 rounded-md p-0.5 transition cursor-pointer text-current opacity-80 hover:opacity-100 ml-0.5"
                          title="Abrir Vista 360°"
                        >
                          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setProyectoSeleccionadoCodigo('');
                          setFiltroHito('');
                        }}
                        className="hover:bg-white/10 rounded-md p-0.5 transition cursor-pointer text-current opacity-70 hover:opacity-100 hover:text-rose-400"
                        title="Deseleccionar proyecto (volver a Vista Global)"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div
                  id="label-proyecto-activo"
                  className="inline-flex text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 items-center gap-1.5 shrink-0 select-none shadow-xs"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Vista Global</span>
                </div>
              )}
            </div>

            {/* Lado Derecho: Cronograma, Filtro Temporal y Bloque de Gasto / Presupuesto */}
            <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
              {/* Cronograma / Fechas del proyecto activo con progreso temporal */}
              {proyectoActivo && (proyectoActivo.fecha_inicio || proyectoActivo.fecha_fin) && (
                <div
                  id="kanban-cronograma-proyecto"
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/60 text-[11px] font-medium text-slate-600 dark:text-slate-300 shrink-0"
                  title="Cronograma del proyecto"
                >
                  <CalendarRange className="w-3.5 h-3.5 text-indigo-400 shrink-0" strokeWidth={1.75} />
                  <span className="font-mono tabular-nums text-[10px]">
                    {formatearFechaSimple(proyectoActivo.fecha_inicio) || 'Inicio s/f'} → {formatearFechaSimple(proyectoActivo.fecha_fin) || 'Fin s/f'}
                  </span>
                  {progresoTemporalProyecto !== null && (
                    <span
                      className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                      title="Progreso temporal transcurrido"
                    >
                      {progresoTemporalProyecto}% t
                    </span>
                  )}
                </div>
              )}

              {/* Cápsula Compacta Filtro Temporal */}
              <div
                className="hidden sm:block relative kanban-popover-container group/timefilter shrink-0"
                id="container-time-filter"
                onMouseEnter={() => handlePopoverMouseEnter('tiempo', setDropdownTiempoAbierto)}
                onMouseLeave={() => handlePopoverMouseLeave('tiempo', setDropdownTiempoAbierto)}
              >
                <button
                  type="button"
                  id="btn-time-capsule"
                  onClick={() => setDropdownTiempoAbierto(!dropdownTiempoAbierto)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-[0.98] ${
                    filtroTemporal !== 'TODO'
                      ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.12)]'
                      : 'bg-slate-100 dark:bg-slate-900/70 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80'
                  }`}
                  title="Filtro de horizonte temporal"
                >
                  {filtroTemporal === 'TODO' && <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />}
                  {filtroTemporal === 'HOY' && <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.75} />}
                  {filtroTemporal === 'SEMANA' && <CalendarDays className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />}
                  {filtroTemporal === 'MES' && <CalendarCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" strokeWidth={1.75} />}
                  <span>
                    {filtroTemporal === 'TODO' && 'Todo'}
                    {filtroTemporal === 'HOY' && 'Hoy'}
                    {filtroTemporal === 'SEMANA' && 'Semana'}
                    {filtroTemporal === 'MES' && 'Mes'}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" strokeWidth={1.75} />
                </button>

                <div
                  id="popover-time-filter"
                  className={`absolute right-0 top-full mt-1.5 z-50 bg-[#0D1526] backdrop-blur-md border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[160px] space-y-0.5 text-xs transition-all duration-150 ease-out transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 ${
                    dropdownTiempoAbierto
                      ? 'opacity-100 scale-100 pointer-events-auto visible'
                      : 'opacity-0 scale-95 pointer-events-none invisible'
                  }`}
                >
                  {[
                    { id: 'TODO', label: 'Todo', icon: <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} /> },
                    { id: 'HOY', label: 'Hoy', icon: <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.75} /> },
                    { id: 'SEMANA', label: 'Esta Semana', icon: <CalendarDays className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} /> },
                    { id: 'MES', label: 'Este Mes', icon: <CalendarCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" strokeWidth={1.75} /> }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFiltroTemporal(opt.id as TimeFilter);
                        setDropdownTiempoAbierto(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${
                        filtroTemporal === opt.id
                          ? 'bg-sky-950/50 text-sky-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {opt.icon}
                        <span>{opt.label}</span>
                      </span>
                      {filtroTemporal === opt.id && <Check className="w-3.5 h-3.5 text-sky-400 font-bold shrink-0" strokeWidth={1.75} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bloque de Gasto Acumulado / Presupuesto Global (Micro-línea compacta) */}
              <div
                id="kanban-gasto-presupuesto-box"
                className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] bg-slate-50 dark:bg-slate-900/70 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 font-medium shrink-0"
              >
                <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {proyectoActivo ? 'Gasto Proyecto:' : 'Gasto Global:'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 sm:hidden">
                  Gasto:
                </span>
                <b className="text-slate-900 dark:text-slate-100 font-bold font-mono tabular-nums">
                  PEN {gastoContextualPen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </b>
                {presupuestoContextualPen > 0 && (
                  <>
                    <span className="hidden sm:inline text-slate-400 dark:text-slate-600">/</span>
                    <span className="hidden sm:inline font-mono tabular-nums text-slate-500 dark:text-slate-400" title="Presupuesto Tope">
                      PEN {presupuestoContextualPen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded border ${
                        gastoContextualPen > presupuestoContextualPen
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                      title="Consumo presupuestal"
                    >
                      {Math.round((gastoContextualPen / presupuestoContextualPen) * 100)}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* FILA 2: BARRA DE FILTROS OPERATIVOS KANBAN                       */}
          {/* =============================================================== */}
          <div className="portal-surface p-1.5 md:p-2 rounded-xl flex flex-col gap-1.5 md:gap-2 text-xs overflow-visible relative bg-slate-50/70 dark:bg-[#080E1C]/90 border border-slate-200/80 dark:border-slate-800/70">
            {/* 1. FILA COMPACTA MÓVIL (< md) - REQ-PWA-05 (h-8 y padding compacto) */}
            <div className="md:hidden flex items-center gap-1.5 w-full">
              {/* Buscador de Tareas Móvil */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2.5 top-2 pointer-events-none text-slate-400 w-3.5 h-3.5" strokeWidth={1.75} />
                <input
                  type="text"
                  id="filter-buscar-tarea-mobile"
                  value={busquedaTarea}
                  onChange={(e) => setBusquedaTarea(e.target.value)}
                  placeholder="Buscar tarea..."
                  className="w-full h-8 bg-slate-100 dark:bg-[#0D1526]/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 text-xs rounded-lg border border-slate-200 dark:border-slate-800 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 pl-7 pr-6 py-1 outline-none font-medium"
                />
                {busquedaTarea && (
                  <button
                    type="button"
                    onClick={() => setBusquedaTarea('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>

              {/* Botón Desplegable de Filtros Móvil Compacto (h-8) */}
              <button
                type="button"
                id="btn-toggle-filtros-movil"
                onClick={() => setDrawerFiltrosMovilAbierto(!drawerFiltrosMovilAbierto)}
                className={`h-8 px-2 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer active:scale-95 shrink-0 ${
                  totalFiltrosActivosCount > 0 || drawerFiltrosMovilAbierto
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                    : 'text-slate-300 bg-slate-900 border border-slate-800 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                <span>Filtros</span>
                {totalFiltrosActivosCount > 0 && (
                  <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-full bg-sky-400 text-slate-950 font-black">
                    {totalFiltrosActivosCount}
                  </span>
                )}
              </button>

              {hayFiltrosActivos && (
                <button
                  type="button"
                  id="btn-limpiar-filtros-movil"
                  onClick={limpiarTodosLosFiltros}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition shrink-0 cursor-pointer active:scale-95"
                  title="Limpiar todos los filtros"
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* 2. CONTENEDOR DESKTOP & DESPLEGABLE MÓVIL DE FILTROS */}
            <div className={`${drawerFiltrosMovilAbierto ? 'flex' : 'hidden'} md:flex items-center gap-2 text-xs overflow-visible relative flex-wrap w-full`}>
              {/* Buscador de Tareas Desktop */}
              <div className="hidden md:block relative w-36 md:w-44 shrink-0">
                <Search className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 w-3.5 h-3.5 top-2" strokeWidth={1.75} />
                <input
                  type="text"
                  id="filter-buscar-tarea"
                  value={busquedaTarea}
                  onChange={(e) => setBusquedaTarea(e.target.value)}
                  placeholder="Buscar tarea..."
                  className="w-full bg-slate-100 dark:bg-[#0D1526]/60 hover:dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 text-[11px] rounded-lg border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 pl-7 pr-6 py-1.5 outline-none transition font-medium"
                />
                {busquedaTarea && (
                  <button
                    type="button"
                    onClick={() => setBusquedaTarea('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>

            {/* Micro-Riel Compacto de Ordenamiento Kanban */}
            <div
              className="inline-flex items-center p-0.5 rounded-lg bg-slate-900/70 border border-slate-800/60 gap-0.5 shrink-0 shadow-xs"
              role="group"
              aria-label="Criterio de Ordenamiento"
            >
              <button
                type="button"
                onClick={() => setCriterioOrden('PRIORITY')}
                className={`h-7 w-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  criterioOrden === 'PRIORITY'
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title="Ordenar por Prioridad (Eisenhower)"
              >
                <Flame className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>

              <button
                type="button"
                onClick={() => setCriterioOrden('DATE')}
                className={`h-7 w-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  criterioOrden === 'DATE'
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title="Ordenar por Fecha / Vencimiento"
              >
                <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>

              <button
                type="button"
                onClick={() => setCriterioOrden('ENERGY')}
                className={`h-7 w-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  criterioOrden === 'ENERGY'
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title="Ordenar por Nivel de Energía"
              >
                <Zap className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>

              <button
                type="button"
                onClick={() => setCriterioOrden('HOURS')}
                className={`h-7 w-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  criterioOrden === 'HOURS'
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title="Ordenar por Horas Estimadas"
              >
                <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>

              <button
                type="button"
                onClick={() => setCriterioOrden('ALPHA')}
                className={`h-7 w-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  criterioOrden === 'ALPHA'
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title="Ordenar Alfabético (A-Z)"
              >
                <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>

            {/* Selector de Paquetes de Trabajo WBS */}
            <div
              className="relative shrink-0 kanban-popover-container group/filter-hito"
              onMouseEnter={() => proyectoSeleccionadoCodigo && handlePopoverMouseEnter('hito', setPopoverHitoAbierto)}
              onMouseLeave={() => proyectoSeleccionadoCodigo && handlePopoverMouseLeave('hito', setPopoverHitoAbierto)}
            >
              <button
                type="button"
                id="btn-hito-capsule"
                disabled={!proyectoSeleccionadoCodigo}
                onClick={() => proyectoSeleccionadoCodigo && setPopoverHitoAbierto(!popoverHitoAbierto)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition-all inline-flex items-center gap-1.5 shrink-0 select-none active:scale-[0.98] ${
                  !proyectoSeleccionadoCodigo
                    ? 'opacity-40 cursor-not-allowed border border-slate-300 dark:border-slate-800/40 bg-slate-200/50 dark:bg-[#0D1526]/40 text-slate-400 dark:text-slate-500'
                    : filtroHito
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.12)] font-medium cursor-pointer'
                    : 'bg-slate-100 dark:bg-[#0D1526]/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80 cursor-pointer'
                }`}
                title={
                  !proyectoSeleccionadoCodigo
                    ? 'Selecciona un proyecto para filtrar por Paquete de Trabajo'
                    : 'Filtrar por Paquete de Trabajo'
                }
              >
                <Milestone className={`w-3.5 h-3.5 shrink-0 ${!proyectoSeleccionadoCodigo ? 'text-slate-400 dark:text-slate-600' : filtroHito ? 'text-sky-400' : 'text-slate-400'}`} strokeWidth={1.75} />
                <span className="truncate max-w-[130px]">
                  {!proyectoSeleccionadoCodigo
                    ? 'Paquetes'
                    : filtroHito
                    ? `Paquete: ${hitosDisponibles.find((h) => h.codigo_legado === filtroHito)?.codigo_legado || filtroHito}`
                    : hitosDisponibles.length > 0
                    ? `Paquetes (${hitosDisponibles.length})`
                    : 'Paquetes'}
                </span>
                {filtroHito ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiltroHito('');
                    }}
                    className="hover:text-rose-400 p-0.5 rounded-md transition ml-0.5 cursor-pointer"
                    title="Quitar filtro de paquete de trabajo"
                  >
                    <X className="w-3 h-3" strokeWidth={2} />
                  </span>
                ) : (
                  <ChevronDown className="w-3 h-3 opacity-60" strokeWidth={1.75} />
                )}
              </button>

              <div
                className={`absolute top-full left-0 mt-1.5 z-50 bg-[#0D1526] backdrop-blur-md border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[220px] max-h-60 overflow-y-auto custom-scrollbar space-y-0.5 text-xs transition-all duration-150 ease-out transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 ${
                  proyectoSeleccionadoCodigo && popoverHitoAbierto
                    ? 'opacity-100 scale-100 pointer-events-auto visible'
                    : 'opacity-0 scale-95 pointer-events-none invisible'
                }`}
              >
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-800/60 mb-1">
                  Filtrar por Paquete de Trabajo
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroHito('');
                    setPopoverHitoAbierto(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${
                    !filtroHito ? 'bg-sky-950/50 text-sky-300 font-bold' : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
                    <span>Todos los Paquetes</span>
                  </span>
                  {!filtroHito && <Check className="w-3.5 h-3.5 text-sky-400 font-bold shrink-0" strokeWidth={1.75} />}
                </button>
                {hitosDisponibles.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setFiltroHito(h.codigo_legado);
                      setPopoverHitoAbierto(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between truncate transition cursor-pointer text-xs font-medium ${
                      filtroHito === h.codigo_legado
                        ? 'bg-sky-950/50 text-sky-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Milestone className="w-3.5 h-3.5 text-purple-400 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{h.codigo_legado} · {h.nombre_elemento}</span>
                    </span>
                    {filtroHito === h.codigo_legado && <Check className="w-3.5 h-3.5 text-sky-400 font-bold shrink-0 ml-1" strokeWidth={1.75} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Prioridad Eisenhower */}
            <div
              className="relative shrink-0 kanban-popover-container group/filter-prio"
              onMouseEnter={() => handlePopoverMouseEnter('prio', setPopoverPrioAbierto)}
              onMouseLeave={() => handlePopoverMouseLeave('prio', setPopoverPrioAbierto)}
            >
              <button
                type="button"
                onClick={() => setPopoverPrioAbierto(!popoverPrioAbierto)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 select-none active:scale-[0.98] ${
                  filtroPrioridad
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.12)] font-medium'
                    : 'bg-slate-100 dark:bg-[#0D1526]/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 shrink-0 ${filtroPrioridad ? 'text-sky-400' : 'text-rose-400'}`} strokeWidth={1.75} />
                <span>
                  {filtroPrioridad
                    ? filtroPrioridad
                        .replace('01_P1_Alta', 'P1: Alta')
                        .replace('02_P2_Media', 'P2: Media')
                        .replace('03_P3_Baja', 'P3: Baja')
                        .replace('04_P4', 'P4')
                    : 'Prioridad'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" strokeWidth={1.75} />
              </button>

              <div
                className={`absolute top-full left-0 mt-1.5 z-50 bg-[#0D1526] backdrop-blur-md border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[190px] space-y-0.5 text-xs transition-all duration-150 ease-out transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 ${
                  popoverPrioAbierto
                    ? 'opacity-100 scale-100 pointer-events-auto visible'
                    : 'opacity-0 scale-95 pointer-events-none invisible'
                }`}
              >
                {[
                  { id: '', label: 'Todas', icon: <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} /> },
                  { id: '01_P1_Alta', label: 'P1: Alta', icon: <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" strokeWidth={1.75} /> },
                  { id: '02_P2_Media', label: 'P2: Media', icon: <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.75} /> },
                  { id: '03_P3_Baja', label: 'P3: Baja', icon: <ArrowDownCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} /> },
                  { id: '04_P4', label: 'P4: Sin prioridad', icon: <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} /> }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setFiltroPrioridad(p.id);
                      setPopoverPrioAbierto(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${
                      filtroPrioridad === p.id
                        ? 'bg-sky-950/50 text-sky-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {p.icon}
                      <span>{p.label}</span>
                    </span>
                    {filtroPrioridad === p.id && <Check className="w-3.5 h-3.5 text-sky-400 font-bold shrink-0" strokeWidth={1.75} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Nivel de Energía */}
            <div
              className="relative shrink-0 kanban-popover-container group/filter-energia"
              onMouseEnter={() => handlePopoverMouseEnter('energia', setPopoverEnergiaAbierto)}
              onMouseLeave={() => handlePopoverMouseLeave('energia', setPopoverEnergiaAbierto)}
            >
              <button
                type="button"
                onClick={() => setPopoverEnergiaAbierto(!popoverEnergiaAbierto)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 select-none active:scale-[0.98] ${
                  filtroEnergia
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.12)] font-medium'
                    : 'bg-slate-100 dark:bg-[#0D1526]/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 shrink-0 ${filtroEnergia ? 'text-sky-400' : 'text-amber-400'}`} strokeWidth={1.75} />
                <span>
                  {filtroEnergia === 'Alta_DeepWork'
                    ? 'DeepWork'
                    : filtroEnergia === 'Media_Operativa'
                    ? 'Operativa'
                    : filtroEnergia === 'Baja_Automatica'
                    ? 'Mecánica'
                    : 'Energía'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" strokeWidth={1.75} />
              </button>

              <div
                className={`absolute top-full left-0 mt-1.5 z-50 bg-[#0D1526] backdrop-blur-md border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[180px] space-y-0.5 text-xs transition-all duration-150 ease-out transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 ${
                  popoverEnergiaAbierto
                    ? 'opacity-100 scale-100 pointer-events-auto visible'
                    : 'opacity-0 scale-95 pointer-events-none invisible'
                }`}
              >
                {[
                  { id: '', label: 'Todos', icon: <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} /> },
                  { id: 'Alta_DeepWork', label: 'DeepWork', icon: <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.75} /> },
                  { id: 'Media_Operativa', label: 'Operativa', icon: <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} /> },
                  { id: 'Baja_Automatica', label: 'Mecánica', icon: <Coffee className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.75} /> }
                ].map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setFiltroEnergia(e.id);
                      setPopoverEnergiaAbierto(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${
                      filtroEnergia === e.id
                        ? 'bg-sky-950/50 text-sky-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {e.icon}
                      <span>{e.label}</span>
                    </span>
                    {filtroEnergia === e.id && <Check className="w-3.5 h-3.5 text-sky-400 font-bold shrink-0" strokeWidth={1.75} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Plazo / Vencimiento */}
            <div
              className="relative shrink-0 kanban-popover-container group/filter-plazo"
              onMouseEnter={() => handlePopoverMouseEnter('plazo', setPopoverPlazoAbierto)}
              onMouseLeave={() => handlePopoverMouseLeave('plazo', setPopoverPlazoAbierto)}
            >
              <button
                type="button"
                onClick={() => setPopoverPlazoAbierto(!popoverPlazoAbierto)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 select-none active:scale-[0.98] ${
                  filtroPlazo
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.12)] font-medium'
                    : 'bg-slate-100 dark:bg-[#0D1526]/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 shrink-0 ${filtroPlazo ? 'text-sky-400' : 'text-slate-400'}`} strokeWidth={1.75} />
                <span>
                  {filtroPlazo === 'vencidas'
                    ? 'Vencidas'
                    : filtroPlazo === 'hoy'
                    ? 'Hoy'
                    : filtroPlazo === '7dias'
                    ? 'Próximos 7d'
                    : filtroPlazo === 'sin_fecha'
                    ? 'Sin fecha'
                    : 'Plazo'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" strokeWidth={1.75} />
              </button>

              <div
                className={`absolute top-full left-0 mt-1.5 z-50 bg-[#0D1526] backdrop-blur-md border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[180px] space-y-0.5 text-xs transition-all duration-150 ease-out transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 ${
                  popoverPlazoAbierto
                    ? 'opacity-100 scale-100 pointer-events-auto visible'
                    : 'opacity-0 scale-95 pointer-events-none invisible'
                }`}
              >
                {[
                  { id: '', label: 'Cualquier fecha', icon: <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} /> },
                  { id: 'vencidas', label: 'Vencidas', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" strokeWidth={1.75} /> },
                  { id: 'hoy', label: 'Hoy', icon: <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.75} /> },
                  { id: '7dias', label: 'Próximos 7d', icon: <CalendarDays className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} /> },
                  { id: 'sin_fecha', label: 'Sin fecha', icon: <CalendarOff className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} /> }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setFiltroPlazo(p.id);
                      setPopoverPlazoAbierto(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${
                      filtroPlazo === p.id
                        ? 'bg-sky-950/50 text-sky-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {p.icon}
                      <span>{p.label}</span>
                    </span>
                    {filtroPlazo === p.id && <Check className="w-3.5 h-3.5 text-sky-400 font-bold shrink-0" strokeWidth={1.75} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Dependencias / Bloqueos */}
            <div
              className="relative shrink-0 kanban-popover-container group/filter-dep"
              onMouseEnter={() => handlePopoverMouseEnter('dep', setPopoverDepAbierto)}
              onMouseLeave={() => handlePopoverMouseLeave('dep', setPopoverDepAbierto)}
            >
              <button
                type="button"
                onClick={() => setPopoverDepAbierto(!popoverDepAbierto)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 select-none active:scale-[0.98] ${
                  filtroDependencia
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.12)] font-medium'
                    : 'bg-slate-100 dark:bg-[#0D1526]/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80'
                }`}
              >
                <Link2 className={`w-3.5 h-3.5 shrink-0 ${filtroDependencia ? 'text-sky-400' : 'text-slate-400'}`} strokeWidth={1.75} />
                <span>
                  {filtroDependencia === 'con_dep'
                    ? 'Bloqueadas'
                    : filtroDependencia === 'sin_dep'
                    ? 'Libres'
                    : 'Bloqueos'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" strokeWidth={1.75} />
              </button>

              <div
                className={`absolute top-full left-0 mt-1.5 z-50 bg-[#0D1526] backdrop-blur-md border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[190px] space-y-0.5 text-xs transition-all duration-150 ease-out transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 ${
                  popoverDepAbierto
                    ? 'opacity-100 scale-100 pointer-events-auto visible'
                    : 'opacity-0 scale-95 pointer-events-none invisible'
                }`}
              >
                {[
                  { id: '', label: 'Todos', icon: <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} /> },
                  { id: 'con_dep', label: 'Bloqueadas', icon: <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" strokeWidth={1.75} /> },
                  { id: 'sin_dep', label: 'Libres', icon: <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.75} /> }
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setFiltroDependencia(d.id);
                      setPopoverDepAbierto(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${
                      filtroDependencia === d.id
                        ? 'bg-sky-950/50 text-sky-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {d.icon}
                      <span>{d.label}</span>
                    </span>
                    {filtroDependencia === d.id && <Check className="w-3.5 h-3.5 text-sky-400 font-bold shrink-0" strokeWidth={1.75} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Indicador reactivo y botón Limpiar Filtros */}
            {hayFiltrosActivos && (
              <div className="ml-auto hidden md:flex items-center gap-2 shrink-0">
                <span
                  id="badge-filtro-activo-resumen"
                  className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono tabular-nums text-[11px] px-2 py-1 rounded-lg flex items-center gap-1 shadow-2xs whitespace-nowrap"
                >
                  <span>{tareasFiltradas.length}/{tareas.length} tareas</span>
                </span>

                <button
                  type="button"
                  id="btn-limpiar-filtros-kanban"
                  onClick={limpiarTodosLosFiltros}
                  className="filter-ghost-btn text-[11px] font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800/60 hover:border-rose-500/30 transition cursor-pointer active:scale-[0.98]"
                  title="Restablecer filtros (X)"
                >
                  <RotateCcw className="w-3 h-3" strokeWidth={1.75} />
                  <span>Limpiar (X)</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </header>

        {/* ================================================================= */}
        {/* SELECTOR / TABS HORIZONTALES DE COLUMNAS EN MÓVIL (md:hidden)    */}
        {/* ================================================================= */}
        <div
          id="selector-columnas-kanban-movil"
          role="tablist"
          aria-label="Selector de columnas Kanban"
          className="md:hidden shrink-0 bg-[#080E1C] border-b border-slate-800/80 px-2 py-1 flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden select-none overscroll-contain"
        >
          {columnas.map((col) => {
            const count = (tareasAgrupadasPorColumna[col.id] || []).length;
            const isActiva = columnaMovilActiva === col.id;
            return (
              <button
                key={col.id}
                role="tab"
                id={`tab-col-movil-${col.id}`}
                aria-selected={isActiva}
                type="button"
                onClick={() => setColumnaMovilActiva(col.id)}
                className={`flex-1 min-w-[68px] h-7 px-1.5 py-0.5 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap active:scale-95 ${
                  isActiva
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-xs'
                    : 'text-slate-400 bg-slate-900/60 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="truncate">{col.titulo.replace(/^\d+\.\s*/, '')}</span>
                <span className={`font-mono tabular-nums text-[10px] px-1 py-0.2 rounded-full ${isActiva ? 'bg-sky-400/20 text-sky-200 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* 3. CHASIS DE 4 COLUMNAS KANBAN Y DRAG-AND-DROP NATIVO HTML5       */}
        {/* ================================================================= */}
        <div
          id="board-kanban-container"
          className="flex-1 min-h-0 overflow-x-hidden md:overflow-x-auto overflow-y-hidden p-2 md:p-4 custom-scrollbar [&::-webkit-scrollbar]:hidden flex flex-col"
        >
          <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-4 md:gap-4 w-full md:min-w-[1050px] h-full items-start">
            {columnas.map((col) => {
              const tareasColumna = tareasAgrupadasPorColumna[col.id] || [];
              const isOverThisCol = dragOverColId === col.id;
              const isActivaMovil = columnaMovilActiva === col.id;

              return (
                <ColumnaKanban
                  key={col.id}
                  col={col}
                  isActivaMovil={isActivaMovil}
                  tareasColumna={tareasColumna}
                  isOverThisCol={isOverThisCol}
                  cargandoDatosIniciales={cargandoDatosIniciales}
                  draggedTaskId={draggedTaskId}
                  hoveredTaskId={hoveredTaskId}
                  predecesorasHover={predecesorasHover}
                  sucesorasHover={sucesorasHover}
                  predecesorasOcultas={predecesorasOcultas}
                  sucesorasOcultas={sucesorasOcultas}
                  subtareasPorTarea={subtareasPorTarea}
                  proyectosMap={proyectosMap}
                  hitosMap={hitosMap}
                  gastosPorTarea={gastosPorTarea}
                  onDragOver={handleDragOverCol}
                  onDragLeave={handleDragLeaveCol}
                  onDrop={handleDropCol}
                  onDragStartTask={handleDragStartTask}
                  onDragEndTask={handleDragEndTask}
                  onMouseEnterTask={setHoveredTaskId}
                  onMouseLeaveTask={() => setHoveredTaskId(null)}
                  onSeleccionarTarea={(id, estado) => {
                    setTareaSeleccionadaId(id);
                    setColumnaNuevaTarea(estado);
                    setModalTareaFlowAbierto(true);
                  }}
                  onMoverTareaAEstado={moverTareaAEstado}
                  onArchivarTarea={handleArchivarTarea}
                  onEliminarTarea={handleEliminarTarea}
                  onAbrirModalNuevaTarea={(colId) => {
                    setTareaSeleccionadaId(null);
                    setColumnaNuevaTarea(colId);
                    setModalTareaFlowAbierto(true);
                  }}
                />
              );
            })}
          </div>
        </div>
      </main>

      {/* =================================================================== */}
      {/* 4. MODAL CANÓNICO TAREAFLOW BENTO                                   */}
      {/* =================================================================== */}
      <ModalTareaFlow
        isOpen={modalTareaFlowAbierto}
        onClose={() => setModalTareaFlowAbierto(false)}
        tareaId={tareaSeleccionadaId}
        initialColumna={columnaNuevaTarea}
        initialProyectoCodigo={proyectoSeleccionadoCodigo}
        onGuardado={() => {
          setModalTareaFlowAbierto(false);
          setTareaSeleccionadaId(null);
        }}
      />

      {/* =================================================================== */}
      {/* 5. MODAL CANÓNICO DE NUEVO PROYECTO 1:1                             */}
      {/* =================================================================== */}
      <ModalNuevoProyecto
        abierto={modalNuevoProyectoAbierto}
        onCerrar={() => setModalNuevoProyectoAbierto(false)}
        onProyectoCreado={(cod) => {
          setProyectoSeleccionadoCodigo(cod);
        }}
      />
      {/* =================================================================== */}
      {/* 6. MODAL DECLARATIVO BENTO PARA ADVERTENCIA DEFINITION OF DONE (DoD) */}
      {/* =================================================================== */}
      <ModalDoDAdvertencia
        isOpen={Boolean(dodAdvertencia)}
        onClose={() => setDodAdvertencia(null)}
        onConfirmar={async () => {
          if (!dodAdvertencia) return;
          const { tarea, nuevoEstado } = dodAdvertencia;
          setDodAdvertencia(null);
          await ejecutarMoverTarea(tarea, nuevoEstado);
        }}
        tareaCodigo={dodAdvertencia?.tarea.codigo_legado || ''}
        tareaNombre={dodAdvertencia?.tarea.nombre || ''}
        pendientes={dodAdvertencia?.pendientes || 0}
        total={dodAdvertencia?.total || 0}
      />
    </div>
  );
};