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
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Milestone,
  Flame,
  ArrowUpDown,
  HeartPulse,
  GraduationCap,
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
  Archive,
  Trash2,
  CornerDownRight
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
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
import { BadgeNotasVinculadas } from '../Notas/BadgeNotasVinculadas';

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

  // Hover timers con buffer de delay (280ms) para evitar cierre prematuro al mover el cursor hacia el menú
  const leaveTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const handlePopoverMouseEnter = (name: string, openSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (leaveTimers.current[name]) {
      clearTimeout(leaveTimers.current[name]);
      delete leaveTimers.current[name];
    }
    openSetter(true);
  };

  const handlePopoverMouseLeave = (name: string, openSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (leaveTimers.current[name]) {
      clearTimeout(leaveTimers.current[name]);
    }
    leaveTimers.current[name] = setTimeout(() => {
      openSetter(false);
      delete leaveTimers.current[name];
    }, 280);
  };

  const closeAllPopovers = () => {
    setDropdownTiempoAbierto(false);
    setPopoverHitoAbierto(false);
    setPopoverPrioAbierto(false);
    setPopoverEnergiaAbierto(false);
    setPopoverPlazoAbierto(false);
    setPopoverDepAbierto(false);
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
      Object.values(leaveTimers.current).forEach(clearTimeout);
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

  // Live queries reactivas desde Dexie
  const rawProyectosLive = useLiveQuery(() => db.proyectos.toArray(), []);
  const rawTareasLive = useLiveQuery(() => db.tareas.toArray(), []);
  const rawSubtareasLive = useLiveQuery(() => db.subtareas_pasos.toArray(), []);
  const rawHitosLive = useLiveQuery(() => db.hitos_wbs.toArray(), []);
  const rawGastosLive = useLiveQuery(() => db.gastos.toArray(), []);

  const cargandoDatosIniciales = rawTareasLive === undefined || rawProyectosLive === undefined;

  const rawProyectos = rawProyectosLive ?? [];
  const rawTareas = rawTareasLive ?? [];
  const rawSubtareas = rawSubtareasLive ?? [];
  const rawHitos = rawHitosLive ?? [];
  const rawGastos = rawGastosLive ?? [];

  const proyectos: CanonicalProyecto[] = useMemo(() => rawProyectos.map(normalizeProyecto), [rawProyectos]);
  const tareas: CanonicalTarea[] = useMemo(() => rawTareas.map(normalizeTarea), [rawTareas]);

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

  // Transición de estado con validación Definition of Done (DoD)
  const moverTareaAEstado = async (tarea: CanonicalTarea, nuevoEstado: string) => {
    if (tarea.estado === nuevoEstado) return;

    // Validación Definition of Done (DoD) al intentar mover a '04_Completado'
    if (nuevoEstado === '04_Completado') {
      const dod = validarDoDSubtareas(tarea.codigo_legado, rawSubtareas);
      if (!dod.valido) {
        const confirmar = window.confirm(
          `[DoD] Definition of Done:\nEsta tarea tiene ${dod.pendientes} de ${dod.total} subtareas pendientes.\n¿Deseas marcarla como Completada de todos modos?`
        );
        if (!confirmar) return;
      }
    }

    await db.tareas.update(tarea.id, {
      estado_tarea: nuevoEstado,
      updated_at: new Date().toISOString()
    });
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

  return (
    <div id="vista-kanban-wrapper" className="flex-1 flex h-full w-full overflow-y-auto md:overflow-hidden">
      {/* =================================================================== */}
      {/* 1. SIDEBAR DE PROYECTOS CANÓNICO                                    */}
      {/* =================================================================== */}
      <aside
        id="sidebar-portafolio"
        className={`${
          sidebarColapsado ? 'sidebar-collapsed w-16' : 'sidebar-expanded w-72 lg:w-80'
        } hidden md:flex flex-col bg-slate-900 text-white border-r border-slate-800 shrink-0 h-full z-40 transition-all duration-300`}
      >
        {/* Cabecera del Sidebar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className={`flex items-center ${sidebarColapsado ? 'justify-center' : 'justify-between'} gap-2`}>
            {!sidebarColapsado && (
              <div className="flex items-center gap-2 min-w-0">
                <FolderKanban className="w-4 h-4 text-indigo-400 shrink-0" />
                <h1 className="text-xs font-black tracking-wider uppercase text-slate-100 truncate">Proyectos</h1>
                <span
                  id="badge-total-proyectos-sidebar"
                  className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0"
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
              className="p-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-indigo-500/50 hover:shadow-[0_0_10px_rgba(99,102,241,0.25)] shadow-xs transition-all duration-200 shrink-0 flex items-center justify-center cursor-pointer"
            >
              {sidebarColapsado ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {!sidebarColapsado && (
            <>
              {/* Buscador de proyectos en vivo */}
              <div className="mt-2.5 relative">
                <Search className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 w-4 h-4 top-2" />
                <input
                  type="text"
                  id="sidebar-search-proyectos"
                  value={busquedaProyecto}
                  onChange={(e) => setBusquedaProyecto(e.target.value)}
                  placeholder="Buscar por nombre o PRO-..."
                  className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-400 text-xs rounded-lg border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 pl-8 pr-7 py-1.5 transition outline-none"
                />
                {busquedaProyecto && (
                  <button
                    type="button"
                    onClick={() => setBusquedaProyecto('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
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
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
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
                <div key={i} className="animate-pulse bg-slate-800/40 rounded-xl border border-slate-800/40 h-16 p-2.5 space-y-2">
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
                title={sidebarColapsado ? `${proy.codigo_legado} · ${proy.nombre} (${healthLabel} - ${pct}%)` : undefined}
                className={`group relative ${
                  sidebarColapsado ? 'p-2 flex flex-col items-center justify-center gap-1.5' : 'p-2.5'
                } rounded-xl border transition-all duration-200 cursor-pointer ${
                  isActivo
                    ? 'bg-indigo-950/70 border-indigo-500/80 border-l-4 border-l-indigo-400 shadow-md ring-1 ring-indigo-500/40 text-white'
                    : 'bg-slate-800/40 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:translate-x-0.5'
                }`}
              >
                {!sidebarColapsado ? (
                  <>
                    {/* 1. Cabecera con código PRO-XXX, píldora de categoría y botón rápido 360° */}
                    <div className="flex items-center justify-between gap-1 mb-1.5 text-[10px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                          {proy.codigo_legado}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 font-semibold text-[9px] truncate">
                          {proy.tipo_iniciativa || 'General'}
                        </span>
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-xs border border-indigo-400/40 flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-200" />
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
                        <span className="text-slate-400">Avance: <b className="text-indigo-300 font-bold">{pct}%</b></span>
                        <span className="text-amber-300/90 font-medium">Meta: {metaPct}%</span>
                      </div>

                      {/* 4. Barra de progreso horizontal de doble tonalidad */}
                      <div className="w-full bg-slate-700/70 h-1.5 rounded-full overflow-hidden relative">
                        <div
                          className="bg-indigo-400/40 h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                          style={{ width: `${metaPct}%` }}
                        />
                        <div
                          className="bg-indigo-500 h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                    <FolderKanban className="w-5 h-5 mx-auto text-slate-400 group-hover:text-sky-300 transition-colors duration-150" />
                    <span className="relative flex h-2.5 w-2.5">
                      {healthLabel === 'Bloqueado' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${healthDot}`} />
                    </span>
                  </div>
                )}
              </div>
            );
          }))}
        </div>

        {/* Footer Sidebar: Botón Canónico "Nuevo Proyecto" */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onNuevoProyecto) {
                onNuevoProyecto();
              } else {
                setModalNuevoProyectoAbierto(true);
              }
            }}
            className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-indigo-900/30 flex items-center justify-center gap-2 transition duration-150 border border-indigo-400/30 cursor-pointer"
            title="Crear nuevo proyecto"
          >
            <Plus className="w-4 h-4 text-indigo-200 shrink-0" />
            {!sidebarColapsado && <span className="whitespace-nowrap font-semibold">Nuevo Proyecto</span>}
          </button>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* 2. ÁREA CENTRAL DEL TABLERO KANBAN                                 */}
      {/* =================================================================== */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto md:overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-200">
        {/* ================================================================= */}
        {/* HEADER MULTI-FILA CANÓNICO (L81-546 de View_Kanban.html)          */}
        {/* ================================================================= */}
        <header className="bg-white dark:bg-[#080E1C] border-b border-slate-200 dark:border-slate-800/60 px-4 py-2 shrink-0 flex flex-col gap-2 shadow-2xs transition-colors overflow-visible relative">
          {/* =============================================================== */}
          {/* FILA 1: CONTEXTO DE PROYECTO, CRONOGRAMA & GASTO GLOBAL          */}
          {/* =============================================================== */}
          <div className="flex items-center justify-between gap-3 min-h-[38px] overflow-visible relative w-full flex-wrap pb-1 border-b border-slate-200/60 dark:border-slate-800/40">
            {/* Lado Izquierdo: Título y Píldora de Estado (Vista Global o Proyecto Activo) */}
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base flex items-center gap-2 shrink-0">
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
                className="relative kanban-popover-container group/timefilter shrink-0"
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

                {dropdownTiempoAbierto && (
                  <div
                    id="popover-time-filter"
                    className="absolute right-0 top-full mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[160px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
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
                )}
              </div>

              {/* Bloque de Gasto Acumulado / Presupuesto Global */}
              <div
                id="kanban-gasto-presupuesto-box"
                className="flex items-center gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 font-medium shrink-0"
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {proyectoActivo ? 'Gasto Proyecto:' : 'Gasto Global:'}
                </span>
                <b className="text-slate-900 dark:text-slate-100 font-bold font-mono tabular-nums">
                  PEN {gastoContextualPen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </b>
                {presupuestoContextualPen > 0 && (
                  <>
                    <span className="text-slate-400 dark:text-slate-600">/</span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400" title="Presupuesto Tope">
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
          <div className="portal-surface p-2 rounded-xl flex items-center gap-2 text-xs overflow-visible relative flex-wrap bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/70">
            {/* Buscador de Tareas Compacto */}
            <div className="relative w-36 md:w-44 shrink-0">
              <Search className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 w-3.5 h-3.5 top-2" strokeWidth={1.75} />
              <input
                type="text"
                id="filter-buscar-tarea"
                value={busquedaTarea}
                onChange={(e) => setBusquedaTarea(e.target.value)}
                placeholder="Buscar tarea..."
                className="w-full bg-white dark:bg-slate-900/70 hover:dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 text-[11px] rounded-lg border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 pl-7 pr-6 py-1.5 outline-none transition font-medium"
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
                    ? 'opacity-40 cursor-not-allowed border border-slate-300 dark:border-slate-800/40 bg-slate-200/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500'
                    : filtroHito
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.12)] font-medium cursor-pointer'
                    : 'bg-white dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80 cursor-pointer'
                }`}
                title={
                  !proyectoSeleccionadoCodigo
                    ? 'Selecciona un proyecto para filtrar por Paquete de Trabajo'
                    : 'Filtrar por Paquete de Trabajo'
                }
              >
                <Milestone className={`w-3.5 h-3.5 shrink-0 ${!proyectoSeleccionadoCodigo ? 'text-slate-400 dark:text-slate-600' : filtroHito ? 'text-sky-400' : 'text-purple-400'}`} strokeWidth={1.75} />
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

              {proyectoSeleccionadoCodigo && popoverHitoAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[220px] max-h-60 overflow-y-auto custom-scrollbar space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
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
              )}
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
                    : 'bg-white dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80'
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

              {popoverPrioAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[190px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
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
              )}
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
                    : 'bg-white dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80'
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

              {popoverEnergiaAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[180px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
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
              )}
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
                    : 'bg-white dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 shrink-0 ${filtroPlazo ? 'text-sky-400' : 'text-indigo-400'}`} strokeWidth={1.75} />
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

              {popoverPlazoAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[180px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
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
              )}
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
                    : 'bg-white dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80'
                }`}
              >
                <Link2 className={`w-3.5 h-3.5 shrink-0 ${filtroDependencia ? 'text-sky-400' : 'text-purple-400'}`} strokeWidth={1.75} />
                <span>
                  {filtroDependencia === 'con_dep'
                    ? 'Bloqueadas'
                    : filtroDependencia === 'sin_dep'
                    ? 'Libres'
                    : 'Bloqueos'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" strokeWidth={1.75} />
              </button>

              {popoverDepAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[190px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
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
              )}
            </div>

            {/* Indicador reactivo y botón Limpiar Filtros */}
            {hayFiltrosActivos && (
              <div className="ml-auto flex items-center gap-2 shrink-0">
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
        </header>

        {/* ================================================================= */}
        {/* 3. CHASIS DE 4 COLUMNAS KANBAN Y DRAG-AND-DROP NATIVO HTML5       */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-x-auto p-3 md:p-4 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[320px] md:min-w-[1050px] h-full items-start">
            {columnas.map((col) => {
              const tareasColumna = ordenarTareas(tareasFiltradas.filter((t) => t.estado === col.id));
              const isOverThisCol = dragOverColId === col.id;

              return (
                <div
                  key={col.id}
                  id={col.domId}
                  data-state={col.id}
                  className={`kanban-col-container flex flex-col rounded-2xl border p-3.5 h-full max-h-[calc(100vh-175px)] transition-all duration-150 shadow-2xs ${
                    isOverThisCol
                      ? 'kanban-dropzone-active bg-indigo-50/40 dark:bg-slate-800/40 border-2 border-dashed border-indigo-400'
                      : 'portal-surface bg-slate-200/50 dark:bg-[#0D1526]/80 border-slate-300/60 dark:border-slate-800/40'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                    setDragOverColId(col.id);
                  }}
                  onDragLeave={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    if (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom) {
                      setDragOverColId(null);
                    }
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOverColId(null);
                    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                    if (!taskId) return;
                    const tareaArrastrada = tareas.find((t) => t.id === taskId);
                    if (tareaArrastrada) {
                      await moverTareaAEstado(tareaArrastrada, col.id);
                    }
                  }}
                >
                  {/* Cabecera de Columna */}
                  <div className="mb-2.5 space-y-2 shrink-0">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold ${col.iconoColor}`}>
                          {col.headerGlow && (
                            <span className="animate-ping absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500 opacity-75"></span>
                          )}
                          {col.id === '01_Backlog' && <Layers className="w-3.5 h-3.5 text-slate-300" />}
                          {col.id === '02_Por_Hacer' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                          {col.id === '03_En_Proceso' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                          {col.id === '04_Completado' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${col.tituloColor}`}>
                          {col.titulo}
                        </span>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono tabular-nums ${col.badgeColor}`}>
                        {cargandoDatosIniciales ? (
                          <span className="inline-block w-4 h-3 bg-slate-700/60 rounded animate-pulse" />
                        ) : (
                          tareasColumna.length
                        )}
                      </span>
                    </div>

                    {/* Botón "+ Añadir Tarea" Canónico */}
                    <button
                      type="button"
                      onClick={() => {
                        setTareaSeleccionadaId(null);
                        setColumnaNuevaTarea(col.id);
                        setModalTareaFlowAbierto(true);
                      }}
                      className="w-full py-1.5 px-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Añadir Tarea</span>
                    </button>
                  </div>

                  {/* Lista de Tarjetas Scrollable */}
                  <div
                    id={`body-${col.domId}`}
                    className="kanban-col-body flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar pb-6"
                  >
                    {cargandoDatosIniciales ? (
                      <div className="space-y-2.5">
                        <div className="animate-pulse bg-slate-800/40 rounded-xl border border-slate-800/40 h-28 p-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="h-3 w-1/3 bg-slate-700/50 rounded"></div>
                            <div className="h-4 w-4/5 bg-slate-700/70 rounded"></div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-800/30">
                            <div className="h-3 w-16 bg-slate-700/40 rounded"></div>
                            <div className="h-3 w-12 bg-slate-700/40 rounded"></div>
                          </div>
                        </div>
                        <div className="animate-pulse bg-slate-800/40 rounded-xl border border-slate-800/40 h-28 p-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="h-3 w-1/4 bg-slate-700/50 rounded"></div>
                            <div className="h-4 w-3/4 bg-slate-700/70 rounded"></div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-800/30">
                            <div className="h-3 w-20 bg-slate-700/40 rounded"></div>
                            <div className="h-3 w-10 bg-slate-700/40 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ) : tareasColumna.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-600 italic">
                        Columna vacía
                      </div>
                    ) : (
                      tareasColumna.map((tar) => {
                        // Subtareas asociadas para checklist widget (O(1))
                        const subsTarea = subtareasPorTarea.get(tar.codigo_legado) || [];
                        const totalSubs = subsTarea.length;
                        const completadasSubs = subsTarea.filter((s) => s.completado).length;
                        const pctSubs = totalSubs > 0 ? Math.round((completadasSubs / totalSubs) * 100) : 0;

                        // 1. Franja lateral continua de prioridad (Canónico legacy_gas/JS_Kanban.html L488-L505 & L780-L782)
                        let colorBarraPrioridad = 'bg-slate-600';
                        const prioStr = String(tar.prioridad || tar.raw?.Prioridad_Eisenhower || '').toLowerCase();
                        if (prioStr.includes('01') || prioStr.includes('p1') || prioStr.includes('alta') || prioStr.includes('urgente')) {
                          colorBarraPrioridad = 'bg-rose-500';
                        } else if (prioStr.includes('02') || prioStr.includes('p2') || prioStr.includes('media')) {
                          colorBarraPrioridad = 'bg-amber-400';
                        } else if (prioStr.includes('03') || prioStr.includes('p3') || prioStr.includes('baja')) {
                          colorBarraPrioridad = 'bg-emerald-400';
                        } else if (prioStr.includes('04') || prioStr.includes('p4')) {
                          colorBarraPrioridad = 'bg-slate-600';
                        }

                        // Vencimiento y fecha DD/MM/YYYY
                        const hoyIso = new Date().toISOString().split('T')[0];
                        const estaVencida = Boolean(tar.fecha_programada && tar.fecha_programada.split('T')[0] < hoyIso && tar.estado !== '04_Completado');
                        const formatFechaDDMMYYYY = (fechaIso?: string) => {
                          if (!fechaIso) return 'Sin fecha';
                          const clean = fechaIso.split('T')[0];
                          const partes = clean.split('-');
                          if (partes.length === 3) {
                            return `${partes[2]}/${partes[1]}/${partes[0]}`;
                          }
                          return clean;
                        };

                        // Dependencia y Costo PEN (O(1))
                        const rawDep = String(tar.raw?.id_dependencia || tar.raw?.ID_Dependencia || '').trim();
                        const tieneDep = Boolean(rawDep && !rawDep.includes('@google.com'));

                        const costoGasto = gastosPorTarea.get(tar.codigo_legado.toUpperCase()) || 0;
                        const costoTotalPen = costoGasto > 0 ? costoGasto : (tar.costo_real || Number(tar.raw?.costo_real_pen || tar.raw?.Costo_Real_PEN || 0));

                        // Breadcrumb WBS (O(1))
                        const proyAsoc = tar.proyecto_codigo ? proyectosMap.get(tar.proyecto_codigo) : undefined;
                        const nombreProyecto = proyAsoc?.nombre || tar.proyecto_codigo || 'General';
                        const hitoAsoc = tar.hito_codigo ? hitosMap.get(tar.hito_codigo) : undefined;
                        const nombreHito = (hitoAsoc as any)?.nombre || (hitoAsoc as any)?.nombre_hito || (hitoAsoc as any)?.nombre_elemento || tar.hito_codigo || 'Hito Principal';

                        // Relaciones de dependencias para hover y atenuación
                        const isHovered = hoveredTaskId === tar.codigo_legado;
                        const isPredecesora = predecesorasHover.has(tar.codigo_legado.toUpperCase());
                        const isSucesora = sucesorasHover.has(tar.codigo_legado.toUpperCase());
                        const isRelacionada = isHovered || isPredecesora || isSucesora;
                        const atenuar = hoveredTaskId !== null && !isRelacionada;

                        return (
                          <div
                            key={tar.id}
                            id={`kanban-card-${tar.codigo_legado}`}
                            data-id-tarea={tar.codigo_legado}
                            data-task-id={tar.id}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', tar.id);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedTaskId(tar.id);
                            }}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                              setDragOverColId(null);
                            }}
                            onMouseEnter={() => setHoveredTaskId(tar.codigo_legado)}
                            onMouseLeave={() => setHoveredTaskId(null)}
                            onClick={() => {
                              setTareaSeleccionadaId(tar.id);
                              setColumnaNuevaTarea(tar.estado);
                              setModalTareaFlowAbierto(true);
                            }}
                            className={`kanban-card group relative p-3.5 pl-4 rounded-xl border border-slate-800/80 bg-[#0D1526]/90 hover:bg-[#0D1526] hover:border-slate-700 hover:shadow-[0_8px_25px_rgba(2,6,23,0.7),0_0_15px_rgba(56,189,248,0.08)] hover:-translate-y-0.5 active:scale-[0.985] transition-[transform,box-shadow,border-color,background-color] duration-150 ease-out cursor-grab active:cursor-grabbing select-none text-xs space-y-2.5 overflow-hidden ${
                              draggedTaskId === tar.id ? 'opacity-30 scale-95 border-dashed border-sky-400/80 ring-1 ring-sky-500/50' : ''
                            } ${
                              atenuar ? 'kanban-card-atenuada opacity-60' : ''
                            } ${
                              isPredecesora ? 'kanban-card-predecesora' : ''
                            } ${
                              isSucesora ? 'kanban-card-sucesora' : ''
                            }`}
                          >
                            {/* Franja lateral izquierda continua de prioridad (Canónico 1:1 legacy_gas/JS_Kanban.html L780-L782) */}
                            <div 
                              className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorBarraPrioridad} rounded-l-xl transition-transform duration-150 ease-out origin-left group-hover:scale-x-125 pointer-events-none`} 
                            />

                            {/* Renderizado de Badges canónicos extraídos literalmente de legacy_gas/JS_Kanban.html */}
                            {isPredecesora && (
                              <div className="kanban-etiqueta-relacion flex items-center justify-between text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 bg-amber-500 text-white shadow-xs pointer-events-none transition-all duration-200">
                                <span className="inline-flex items-center gap-1">
                                  <Zap className="w-2.5 h-2.5 shrink-0" />
                                  <span>Predecesora</span>
                                </span>
                                <span className="text-[9px] opacity-90 uppercase tracking-wider font-mono tabular-nums">{tar.codigo_legado}</span>
                              </div>
                            )}
                            {isSucesora && (
                              <div className="kanban-etiqueta-relacion flex items-center justify-between text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 bg-emerald-600 text-white shadow-xs pointer-events-none transition-all duration-200">
                                <span className="inline-flex items-center gap-1">
                                  <CornerDownRight className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                                  <span>Sucesora</span>
                                </span>
                                <span className="text-[9px] opacity-90 uppercase tracking-wider font-mono tabular-nums">{tar.codigo_legado}</span>
                              </div>
                            )}
                            {/* Alerta discreta para Predecesoras o Sucesoras Ocultas por Filtro/Archivo */}
                            {isHovered && (predecesorasOcultas.length > 0 || sucesorasOcultas.length > 0) && (
                              <div className="whitespace-normal bg-slate-800/90 text-slate-300 text-[9px] px-2 py-1 rounded-md border border-slate-700 shadow-xs pointer-events-none flex flex-col gap-0.5 animate-fadeIn">
                                {predecesorasOcultas.length > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                    <span>Predecesora [{predecesorasOcultas.join(', ')}] oculta por filtros</span>
                                  </span>
                                )}
                                {sucesorasOcultas.length > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <span>Sucesora [{sucesorasOcultas.join(', ')}] oculta por filtros</span>
                                  </span>
                                )}
                              </div>
                            )}
                            {/* 2. Cabecera Minimalista Canónica: Código de tarea (TAR-XXX) y Micro-icono compacto sin textos redundantes */}
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono text-xs text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/60 font-medium shrink-0">
                                  {tar.codigo_legado}
                                </span>

                                {/* Micro-icono canónico compacto según Nivel_Energia / Tipo */}
                                {(() => {
                                  const eStr = String(tar.nivel_energia || '').toLowerCase();
                                  const tipoRaw = String(tar.raw?.Tipo_Tarea || tar.raw?.tipo_tarea || (tar as any).tipo || '').toLowerCase();
                                  const esHabito = tar.codigo_legado.startsWith('ACT-') || tipoRaw.includes('habito') || tipoRaw.includes('rutina') || tipoRaw.includes('personal');
                                  const esEstudio = tipoRaw.includes('aprendizaje') || tipoRaw.includes('estudio') || /pmp|curso|tesis|cert/i.test(tar.nombre);

                                  if (esHabito) {
                                    return (
                                      <span title="Tipo: Personal / Hábito" className="inline-flex items-center text-pink-400 shrink-0">
                                        <HeartPulse className="w-3.5 h-3.5" />
                                      </span>
                                    );
                                  }
                                  if (esEstudio) {
                                    return (
                                      <span title="Tipo: Aprendizaje / Estudio" className="inline-flex items-center text-indigo-400 shrink-0">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                      </span>
                                    );
                                  }
                                  if (eStr.includes('alta') || eStr.includes('deepwork') || eStr.includes('creativa') || eStr.includes('estrategica')) {
                                    return (
                                      <span title="Tipo de Trabajo: Alta Cognitiva DeepWork" className="inline-flex items-center text-amber-400 shrink-0">
                                        <Zap className="w-3.5 h-3.5" />
                                      </span>
                                    );
                                  }
                                  if (eStr.includes('baja') || eStr.includes('automatica') || eStr.includes('mecanica') || eStr.includes('admin')) {
                                    return (
                                      <span title="Tipo de Trabajo: Baja Mecánica" className="inline-flex items-center text-emerald-400 shrink-0">
                                        <Coffee className="w-3.5 h-3.5" />
                                      </span>
                                    );
                                  }
                                  return (
                                    <span title="Tipo de Trabajo: Media Operativa" className="inline-flex items-center text-sky-400 shrink-0">
                                      <Activity className="w-3.5 h-3.5" />
                                    </span>
                                  );
                                })()}

                                <BadgeNotasVinculadas
                                  codigo={tar.codigo_legado}
                                  tipo="TAREA"
                                  tituloEntidad={tar.nombre}
                                />
                              </div>

                              {/* Acciones Fantasma con Transición Fluida */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`¿Deseas archivar la tarea ${tar.codigo_legado}?`)) {
                                      db.tareas.update(tar.id, {
                                        estado_tarea: '05_Archivado',
                                        archivado: true,
                                        updated_at: new Date().toISOString()
                                      });
                                    }
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition-colors duration-100 cursor-pointer"
                                  title="Archivar tarea"
                                >
                                  <Archive className="w-3.5 h-3.5" strokeWidth={1.75} />
                                </button>
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (onEliminarTarea) {
                                      onEliminarTarea(tar.id, tar.nombre);
                                    } else {
                                      if (window.confirm(`¿Deseas eliminar definitivamente la tarea "${tar.nombre}"?`)) {
                                        await db.tareas.delete(tar.id);
                                      }
                                    }
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors duration-100 cursor-pointer"
                                  title="Eliminar tarea"
                                >
                                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                                </button>
                              </div>
                            </div>

                            {/* 3. Título de la tarea en text-sm font-semibold text-slate-100 line-clamp-2 mt-1 */}
                            <h4
                              className={`text-sm font-semibold text-slate-100 line-clamp-2 mt-1 cursor-pointer hover:text-indigo-300 transition ${
                                tar.estado === '04_Completado' ? 'line-through text-slate-400' : ''
                              }`}
                              title={tar.nombre}
                            >
                              {tar.nombre}
                            </h4>

                            {/* 4. Fila de metadatos 1 (Dependencias de alto contraste y Costo) */}
                            {(tieneDep || costoTotalPen > 0) && (
                              <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                                {tieneDep && (
                                  <span
                                    className="px-2 py-0.5 text-[11px] font-mono tabular-nums font-medium rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-2xs truncate max-w-[150px]"
                                    title={`Requiere: ${rawDep}`}
                                  >
                                    <Lock className="w-3 h-3 text-amber-400 shrink-0" strokeWidth={1.75} />
                                    <span className="truncate">{rawDep}</span>
                                  </span>
                                )}
                                {costoTotalPen > 0 && (
                                  <span className="px-2 py-0.5 text-[11px] font-mono tabular-nums font-medium text-emerald-400 bg-emerald-500/10 rounded-md border border-emerald-500/25">
                                    S/ {costoTotalPen.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* 5. Fila de metadatos 2 (Subtareas y Tiempos con píldoras marcadas) */}
                            <div className="space-y-1.5 pt-1">
                              {totalSubs > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
                                      <span>{completadasSubs}/{totalSubs} pasos ({pctSubs}%)</span>
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                                      style={{ width: `${pctSubs}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-1 text-[11px] font-mono tabular-nums pt-0.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 text-[11px] font-mono tabular-nums rounded-md flex items-center gap-1 border ${
                                    estaVencida
                                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 font-semibold'
                                      : 'bg-slate-800/70 text-slate-300 border-slate-700/50'
                                  }`}
                                  title={estaVencida ? 'Tarea vencida' : 'Fecha límite programada'}
                                >
                                  <Calendar className={`w-3 h-3 ${estaVencida ? 'text-rose-400' : 'text-slate-400'}`} strokeWidth={1.75} />
                                  <span>{formatFechaDDMMYYYY(tar.fecha_programada)}</span>
                                </span>

                                <span
                                  className="bg-slate-800/80 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono tabular-nums"
                                  title={`Horas Reales: ${tar.horas_reales ?? 0}h / Horas Estimadas: ${tar.horas_estimadas ?? 0}h`}
                                >
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" strokeWidth={1.75} />
                                  <span>{tar.horas_reales ?? 0}h / {tar.horas_estimadas ?? 0}h</span>
                                </span>
                              </div>
                            </div>

                            {/* 6. Pie de tarjeta (Breadcrumb WBS) */}
                            <div
                              className="text-xs text-slate-400 truncate pt-1.5 border-t border-slate-800/70"
                              title={`${nombreProyecto} • ${nombreHito}`}
                            >
                              {nombreProyecto} • {nombreHito}
                            </div>

                            {/* 7. Botonera canónica bidireccional al pie */}
                            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                              {col.id === '01_Backlog' && (
                                <button
                                  type="button"
                                  onClick={() => moverTareaAEstado(tar, '02_Por_Hacer')}
                                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-indigo-950/40 text-indigo-300 border border-slate-700/60 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                  title="Mover a Por Hacer"
                                >
                                  <span className="tracking-wide">A Por Hacer</span>
                                  <span className="font-bold">→</span>
                                </button>
                              )}

                              {col.id === '02_Por_Hacer' && (
                                <div className="flex items-center justify-between gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => moverTareaAEstado(tar, '01_Backlog')}
                                    className="h-7 px-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/40 text-xs font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer"
                                    title="Retroceder a Backlog"
                                  >
                                    <span>←</span>
                                    <span>Backlog</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moverTareaAEstado(tar, '03_En_Proceso')}
                                    className="h-7 flex-1 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                                    title="Iniciar tarea (Mover a En Proceso)"
                                  >
                                    <span className="tracking-wide">Iniciar</span>
                                    <Zap className="w-3 h-3 text-amber-300" />
                                    <span className="font-bold">→</span>
                                  </button>
                                </div>
                              )}

                              {col.id === '03_En_Proceso' && (
                                <div className="flex items-center justify-between gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => moverTareaAEstado(tar, '02_Por_Hacer')}
                                    className="h-7 px-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/40 text-xs font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer"
                                    title="Retroceder a Por Hacer"
                                  >
                                    <span>←</span>
                                    <span>Por Hacer</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moverTareaAEstado(tar, '04_Completado')}
                                    className="h-7 flex-1 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                                    title="Finalizar tarea (Mover a Completado)"
                                  >
                                    <span className="tracking-wide">Completar</span>
                                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                                  </button>
                                </div>
                              )}

                              {col.id === '04_Completado' && (
                                <button
                                  type="button"
                                  onClick={() => moverTareaAEstado(tar, '03_En_Proceso')}
                                  className="w-full h-7 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 text-slate-400 hover:text-amber-300 border border-slate-700/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                                  title="Reabrir tarea a En Proceso"
                                >
                                  <RotateCcw className="w-3 h-3 text-slate-500" />
                                  <span>Reabrir tarea a En Proceso</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
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
    </div>
  );
};
