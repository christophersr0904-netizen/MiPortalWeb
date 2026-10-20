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
  User,
  Briefcase,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Milestone,
  Flame,
  ArrowUpDown,
  HeartPulse,
  AlertOctagon,
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
  X
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
}

type ContextFilter = 'TODOS' | 'PROYECTOS' | 'PERSONAL';
type TimeFilter = 'TODO' | 'HOY' | 'SEMANA' | 'MES';
type SortFilter = 'PRIORITY' | 'DATE' | 'ENERGY' | 'HOURS' | 'ALPHA';

export const ViewKanban: React.FC<ViewKanbanProps> = ({
  onSeleccionarProyecto,
  onVerDetalle360,
  onNuevoProyecto
}) => {
  // Sidebar State
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  const [busquedaProyecto, setBusquedaProyecto] = useState('');
  const [filtroTipoProyecto, setFiltroTipoProyecto] = useState<string>('');
  const [proyectoSeleccionadoCodigo, setProyectoSeleccionadoCodigo] = useState<string | null>(null);

  // Fila 1 State: Contexto & Temporal
  const [contextoFiltro, setContextoFiltro] = useState<ContextFilter>('TODOS');
  const [filtroTemporal, setFiltroTemporal] = useState<TimeFilter>('TODO');
  const [dropdownTiempoAbierto, setDropdownTiempoAbierto] = useState(false);

  // Fila 2 State: Filtros Multidimensionales y Ordenamiento
  const [criterioOrden, setCriterioOrden] = useState<SortFilter>('PRIORITY');
  const [popoverOrdenAbierto, setPopoverOrdenAbierto] = useState(false);
  const [busquedaTarea, setBusquedaTarea] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroHito, setFiltroHito] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroEnergia, setFiltroEnergia] = useState('');
  const [filtroPlazo, setFiltroPlazo] = useState('');
  const [filtroDependencia, setFiltroDependencia] = useState('');

  // Dropdowns UI de la barra de filtros
  const [popoverTipoAbierto, setPopoverTipoAbierto] = useState(false);
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
    setPopoverOrdenAbierto(false);
    setPopoverHitoAbierto(false);
    setPopoverPrioAbierto(false);
    setPopoverTipoAbierto(false);
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
    setBusquedaTarea('');
    setFiltroTipo('TODOS');
    setFiltroHito('');
    setFiltroPrioridad('');
    setFiltroEnergia('');
    setFiltroPlazo('');
    setFiltroDependencia('');
    setFiltroTemporal('TODO');
  };

  // Evaluar filtro de Tipo de Tarea canónico de forma determinista
  const evaluarFiltroTipoTarea = (t: CanonicalTarea, tipo: string): boolean => {
    if (!tipo || tipo === 'TODOS') return true;

    const rawTipo = String(
      (t.raw && (t.raw.Tipo_Tarea || t.raw.tipo_tarea || t.raw.Tipo || t.raw.tipo || t.raw.Tipo_Actividad)) || ''
    ).toUpperCase();
    const nombreNorm = t.nombre.toLowerCase();
    const proy = proyectosMap.get(t.proyecto_codigo);
    const tipoIniciativa = (proy?.tipo_iniciativa || '').toLowerCase();
    const esActividadPersonal = t.codigo_legado.startsWith('ACT-') || t.proyecto_codigo.startsWith('PRO-PER') || tipoIniciativa === 'personal';

    if (tipo === 'TRABAJO_PROFESIONAL') {
      if (rawTipo.includes('TRABAJO') || rawTipo.includes('PROFESIONAL') || rawTipo.includes('PROYECTO')) return true;
      if (tipoIniciativa === 'profesional' || tipoIniciativa === 'laboral' || tipoIniciativa === 'inversiones') return true;
      return Boolean(t.proyecto_codigo && !esActividadPersonal);
    }

    if (tipo === 'PERSONAL_HABITO') {
      if (rawTipo.includes('PERSONAL') || rawTipo.includes('HABITO') || rawTipo.includes('RUTINA')) return true;
      return esActividadPersonal;
    }

    if (tipo === 'URGENTE_CRITICO') {
      if (rawTipo.includes('URGENTE') || rawTipo.includes('CRITICO')) return true;
      const prio = (t.prioridad || '').toLowerCase();
      return prio.includes('01_p1') || prio.includes('alta') || prio.includes('urgente') || Boolean(t.es_mav);
    }

    if (tipo === 'APRENDIZAJE_ESTUDIO') {
      if (rawTipo.includes('ESTUDIO') || rawTipo.includes('APRENDIZAJE') || rawTipo.includes('EDUCACION')) return true;
      const keywords = ['estudio', 'pmp', 'certificación', 'certificacion', 'curso', 'libro', 'lectura', 'aprender', 'examen', 'tesis'];
      if (keywords.some((k) => nombreNorm.includes(k))) return true;
      if (proy && keywords.some((k) => proy.nombre.toLowerCase().includes(k))) return true;
      return false;
    }

    return true;
  };

  // Verificar si hay algún filtro activo de la barra Fila 2
  const hayFiltrosActivos = useMemo(() => {
    return Boolean(
      busquedaTarea.trim() ||
      (filtroTipo && filtroTipo !== 'TODOS') ||
      filtroHito ||
      filtroPrioridad ||
      filtroEnergia ||
      filtroPlazo ||
      filtroDependencia ||
      filtroTemporal !== 'TODO'
    );
  }, [busquedaTarea, filtroTipo, filtroHito, filtroPrioridad, filtroEnergia, filtroPlazo, filtroDependencia, filtroTemporal]);

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

  // Filtrado multidimensional de tareas
  const tareasFiltradas = useMemo(() => {
    return tareas.filter((t) => {
      // 1. Filtro por Proyecto del sidebar
      if (proyectoSeleccionadoCodigo) {
        if (t.proyecto_codigo !== proyectoSeleccionadoCodigo) return false;
      }

      // 2. Filtro de Contexto (Todos, Proyectos, Personal)
      if (contextoFiltro === 'PROYECTOS') {
        if (!t.proyecto_codigo) return false;
      } else if (contextoFiltro === 'PERSONAL') {
        if (t.proyecto_codigo && !t.proyecto_codigo.startsWith('PRO-PER') && !t.proyecto_codigo.startsWith('ACT')) {
          const p = proyectos.find((proj) => proj.codigo_legado === t.proyecto_codigo);
          if (p && p.tipo_iniciativa !== 'Personal') return false;
        }
      }

      // 3. Filtro Temporal (TODO, HOY, SEMANA, MES)
      if (filtroTemporal !== 'TODO') {
        if (!evaluarFiltroTemporal(t.fecha_programada, filtroTemporal)) return false;
      }

      // 4. Buscador libre
      if (busquedaTarea.trim()) {
        const query = busquedaTarea.toLowerCase();
        const coincideNombre = t.nombre.toLowerCase().includes(query);
        const coincideCodigo = t.codigo_legado.toLowerCase().includes(query);
        const coincideResp = t.responsable ? t.responsable.toLowerCase().includes(query) : false;
        if (!coincideNombre && !coincideCodigo && !coincideResp) return false;
      }

      // 5. Filtro por Tipo de Tarea Canónico
      if (filtroTipo && filtroTipo !== 'TODOS') {
        if (!evaluarFiltroTipoTarea(t, filtroTipo)) return false;
      }

      // 6. Filtro por Hito
      if (filtroHito) {
        if (t.hito_codigo !== filtroHito) return false;
      }

      // 7. Filtro por Prioridad Eisenhower (Matching inclusivo resiliente idéntico a legacy_gas/JS_Kanban.html L2714-L2727)
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

      // 8. Filtro por Nivel de Energía
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

      // 9. Filtro por Plazo / Vencimiento
      if (filtroPlazo) {
        if (!evaluarFiltroPlazo(t.fecha_programada, filtroPlazo, t.estado)) return false;
      }

      // 10. Filtro por Dependencias
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
    contextoFiltro,
    filtroTemporal,
    busquedaTarea,
    filtroTipo,
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
          <div className="flex items-center justify-between gap-2">
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
                className={`group relative p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isActivo
                    ? 'bg-indigo-950/70 border-indigo-500/80 border-l-4 border-l-indigo-400 shadow-md ring-1 ring-indigo-500/40 text-white'
                    : 'bg-slate-800/40 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:translate-x-0.5'
                }`}
              >
                {/* 1. Cabecera con código PRO-XXX, píldora de categoría y botón rápido 360° */}
                <div className="flex items-center justify-between gap-1 mb-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                      {proy.codigo_legado}
                    </span>
                    {!sidebarColapsado && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 font-semibold text-[9px] truncate">
                        {proy.tipo_iniciativa || 'General'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!sidebarColapsado && (
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
                    )}
                    {!sidebarColapsado && (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${healthBadgeClass}`}>
                        <span className="relative flex h-2 w-2 shrink-0">
                          {healthLabel === 'Bloqueado' && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${healthDot}`} />
                        </span>
                        <span>{healthLabel}</span>
                      </span>
                    )}
                  </div>
                </div>

                {!sidebarColapsado ? (
                  <>
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
                  <div className="flex justify-center mt-1">
                    <span className="relative flex h-2.5 w-2.5">
                      {healthLabel === 'Bloqueado' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${healthDot}`} title={`${healthLabel} (${pct}%)`} />
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
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 shrink-0 flex flex-col gap-2 shadow-2xs transition-colors overflow-visible relative">
          {/* FILA 1: CONTEXTO, CHIP DE PROYECTO, TEMPORAL & GASTO */}
          <div className="flex items-center justify-between gap-3 min-h-[36px] overflow-visible relative w-full flex-wrap">
            {/* Extremo Izquierdo: Título y Segmented Control */}
            <div className="flex items-center gap-3 shrink-0">
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base flex items-center gap-2 shrink-0">
                <span>Tablero Kanban</span>
              </h2>

              <div className="hidden sm:inline-flex p-0.5 bg-slate-100 dark:bg-slate-950/70 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
                <button
                  type="button"
                  id="btn-context-todos"
                  onClick={() => setContextoFiltro('TODOS')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    contextoFiltro === 'TODOS'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-100 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  title="Ver todas las tareas"
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>Todo</span>
                  <span
                    id="badge-context-todos"
                    className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold"
                  >
                    {tareas.length}
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-context-proyectos"
                  onClick={() => setContextoFiltro('PROYECTOS')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    contextoFiltro === 'PROYECTOS'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-100 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  title="Tareas asociadas a proyectos"
                >
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span>Proyectos</span>
                  <span
                    id="badge-context-proyectos"
                    className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-extrabold"
                  >
                    {tareas.filter((t) => t.proyecto_codigo).length}
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-context-personal"
                  onClick={() => setContextoFiltro('PERSONAL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    contextoFiltro === 'PERSONAL'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-100 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  title="Tareas y compromisos personales"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>Personal</span>
                  <span
                    id="badge-context-personal"
                    className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-extrabold"
                  >
                    {tareas.filter((t) => !t.proyecto_codigo || t.proyecto_codigo.startsWith('PRO-PER')).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Centro: Chip y Metadatos del Proyecto Activo */}
            <div id="label-proyecto-activo-container" className="flex items-center gap-2 min-w-0">
              <span
                id="label-proyecto-activo"
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5"
              >
                <FolderKanban className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate max-w-[200px]">
                  {proyectoActivo ? `${proyectoActivo.codigo_legado} · ${proyectoActivo.nombre}` : 'Vista Global'}
                </span>
                {proyectoActivo && (
                  <button
                    type="button"
                    onClick={() => setProyectoSeleccionadoCodigo(null)}
                    className="hover:text-rose-500 font-bold ml-1 cursor-pointer"
                    title="Quitar filtro de proyecto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>

              {proyectoActivo && (
                <div id="kanban-proy-meta-bar" className="flex items-center gap-1.5 shrink-0 text-xs">
                  {/* Health Badge */}
                  <div
                    id="kanban-proy-health-badge"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block" />
                    <span>{proyectoActivo.health_status || 'Saludable'}</span>
                  </div>

                  {/* CPI Badge */}
                  <div
                    id="kanban-proy-cpi-badge"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  >
                    <span className="text-[9px] text-slate-400 font-sans">CPI</span>
                    <span>{proyectoActivo.cpi?.toFixed(2) || '1.00'}</span>
                  </div>

                  {/* Acceso 360 */}
                  {onSeleccionarProyecto && (
                    <button
                      type="button"
                      onClick={() => onSeleccionarProyecto(proyectoActivo.id)}
                      className="px-2 py-0.5 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                      title="Abrir Vista 360°"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>Vista 360°</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Extremo Derecho: Cápsula Temporal & Gasto Contextual */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {/* Cápsula Compacta Filtro Temporal con Micro-Popover Flotante Glassmorphism */}
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
                  className="border border-slate-700/80 bg-slate-900/90 hover:border-indigo-500/60 rounded-full px-3 py-1 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition cursor-pointer select-none shadow-xs"
                  title="Filtro de horizonte temporal (Pasa el cursor o presiona para cambiar)"
                >
                  {filtroTemporal === 'TODO' && <CalendarRange className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  {filtroTemporal === 'HOY' && <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  {filtroTemporal === 'SEMANA' && <CalendarDays className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                  {filtroTemporal === 'MES' && <CalendarCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                  <span className="text-xs font-semibold">
                    {filtroTemporal === 'TODO' && 'Todo'}
                    {filtroTemporal === 'HOY' && 'Hoy'}
                    {filtroTemporal === 'SEMANA' && 'Semana'}
                    {filtroTemporal === 'MES' && 'Mes'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover/timefilter:rotate-180 transition-transform duration-200" />
                </button>

                {dropdownTiempoAbierto && (
                  <div
                    id="popover-time-filter"
                    className="absolute right-0 top-full mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[160px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
                  >
                    {[
                      { id: 'TODO', label: 'Todo', icon: <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0" /> },
                      { id: 'HOY', label: 'Hoy', icon: <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" /> },
                      { id: 'SEMANA', label: 'Esta Semana', icon: <CalendarDays className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> },
                      { id: 'MES', label: 'Este Mes', icon: <CalendarCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" /> }
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
                            ? 'bg-indigo-950/70 text-indigo-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {opt.icon}
                          <span>{opt.label}</span>
                        </span>
                        {filtroTemporal === opt.id && <Check className="w-3.5 h-3.5 text-indigo-400 font-bold shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Gasto Contextual en PEN */}
              <div className="hidden md:flex items-center text-xs bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium shrink-0">
                <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center">
                  <span>{proyectoSeleccionadoCodigo ? 'Gasto Proyecto:' : 'Gasto Global:'}</span>
                  <b className="text-slate-900 dark:text-slate-100 font-bold font-mono ml-1">
                    PEN {gastoContextualPen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </b>
                </span>
              </div>
            </div>
          </div>

          {/* FILA 2: BARRA DE FILTROS POP-OVERS CANÓNICOS */}
          <div className="portal-surface p-2.5 my-1 rounded-xl flex items-center gap-2 text-xs overflow-visible relative flex-wrap bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/70">
            {/* Buscador de Tareas */}
            <div className="relative min-w-[150px] max-w-[180px] shrink-0">
              <Search className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 w-3.5 h-3.5 top-2" />
              <input
                type="text"
                id="filter-buscar-tarea"
                value={busquedaTarea}
                onChange={(e) => setBusquedaTarea(e.target.value)}
                placeholder="Buscar tarea..."
                className="w-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-xs rounded-xl border border-slate-200/80 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 pl-7 pr-6 py-1 outline-none transition"
              />
              {busquedaTarea && (
                <button
                  type="button"
                  onClick={() => setBusquedaTarea('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Botón y Popover de Ordenamiento Kanban */}
            <div
              className="relative shrink-0 kanban-popover-container group/sort-kanban"
              onMouseEnter={() => handlePopoverMouseEnter('orden', setPopoverOrdenAbierto)}
              onMouseLeave={() => handlePopoverMouseLeave('orden', setPopoverOrdenAbierto)}
            >
              <button
                type="button"
                id="btn-sort-kanban"
                onClick={() => setPopoverOrdenAbierto(!popoverOrdenAbierto)}
                className="h-8 px-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer select-none text-slate-300 hover:text-white hover:border-indigo-500/60 bg-slate-900/90 border border-slate-700/80 gap-1.5 shadow-xs"
                title="Opciones de Ordenamiento"
              >
                {criterioOrden === 'PRIORITY' && <Flame className="w-3.5 h-3.5 text-rose-500" />}
                {criterioOrden === 'DATE' && <Calendar className="w-3.5 h-3.5 text-indigo-400" />}
                {criterioOrden === 'ENERGY' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                {criterioOrden === 'HOURS' && <Clock className="w-3.5 h-3.5 text-teal-400" />}
                {criterioOrden === 'ALPHA' && <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />}
                <span className="text-xs font-medium hidden lg:inline">
                  {criterioOrden === 'PRIORITY' && 'Prioridad'}
                  {criterioOrden === 'DATE' && 'Fecha'}
                  {criterioOrden === 'ENERGY' && 'Energía'}
                  {criterioOrden === 'HOURS' && 'Horas'}
                  {criterioOrden === 'ALPHA' && 'A-Z'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {popoverOrdenAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[210px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
                  {[
                    { id: 'PRIORITY', label: 'Por Prioridad Eisenhower', icon: <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" /> },
                    { id: 'DATE', label: 'Por Vencimiento / Fecha', icon: <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> },
                    { id: 'ENERGY', label: 'Por Nivel de Energía', icon: <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" /> },
                    { id: 'HOURS', label: 'Por Horas Estimadas', icon: <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" /> },
                    { id: 'ALPHA', label: 'Alfabético A-Z', icon: <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 shrink-0" /> }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setCriterioOrden(opt.id as SortFilter);
                        setPopoverOrdenAbierto(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${
                        criterioOrden === opt.id
                          ? 'bg-indigo-950/70 text-indigo-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {opt.icon}
                        <span>{opt.label}</span>
                      </span>
                      {criterioOrden === opt.id && <Check className="w-3.5 h-3.5 text-indigo-400 font-bold shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 1. Popover Hito WBS (Deshabilitado sin proyecto seleccionado) */}
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
                className={`rounded-full px-3 py-1.5 text-xs transition-all inline-flex items-center gap-1.5 shrink-0 select-none ${
                  !proyectoSeleccionadoCodigo
                    ? 'opacity-40 cursor-not-allowed pointer-events-none border border-slate-700/50 bg-slate-900/50 text-slate-500'
                    : filtroHito
                    ? 'border border-indigo-500/80 bg-indigo-950/60 text-indigo-300 font-bold cursor-pointer shadow-xs'
                    : 'border border-slate-700/80 hover:border-indigo-500/60 bg-slate-900/90 text-slate-300 cursor-pointer shadow-xs'
                }`}
                title={
                  !proyectoSeleccionadoCodigo
                    ? 'Filtrar por hito (Requiere seleccionar un proyecto)'
                    : 'Filtrar por hito WBS'
                }
              >
                <Milestone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate max-w-[130px]">
                  {!proyectoSeleccionadoCodigo
                    ? 'Hitos (Selecciona Proyecto)'
                    : filtroHito
                    ? (hitosDisponibles.find((h) => h.codigo_legado === filtroHito)?.nombre_elemento || filtroHito)
                    : 'Hitos'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {proyectoSeleccionadoCodigo && popoverHitoAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[220px] max-h-60 overflow-y-auto custom-scrollbar space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroHito('');
                      setPopoverHitoAbierto(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${
                      !filtroHito ? 'bg-indigo-950/70 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Todos los hitos</span>
                    </span>
                    {!filtroHito && <Check className="w-3.5 h-3.5 text-indigo-400 font-bold shrink-0" />}
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
                          ? 'bg-indigo-950/70 text-indigo-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Milestone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{h.codigo_legado} · {h.nombre_elemento}</span>
                      </span>
                      {filtroHito === h.codigo_legado && <Check className="w-3.5 h-3.5 text-indigo-400 font-bold shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Popover Prioridad Eisenhower */}
            <div
              className="relative shrink-0 kanban-popover-container group/filter-prio"
              onMouseEnter={() => handlePopoverMouseEnter('prio', setPopoverPrioAbierto)}
              onMouseLeave={() => handlePopoverMouseLeave('prio', setPopoverPrioAbierto)}
            >
              <button
                type="button"
                onClick={() => setPopoverPrioAbierto(!popoverPrioAbierto)}
                className={`bg-slate-900/90 border rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 select-none shadow-xs ${
                  filtroPrioridad
                    ? 'border-rose-500/80 bg-rose-950/40 text-rose-300 font-bold'
                    : 'border-slate-700/80 hover:border-indigo-500/60 text-slate-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>
                  {filtroPrioridad
                    ? filtroPrioridad.replace('01_P1_', 'P1: ').replace('02_P2_', 'P2: ').replace('03_P3_', 'P3: ')
                    : 'Prioridad'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {popoverPrioAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[210px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
                  {[
                    { id: '', label: 'Todas las prioridades', icon: <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" /> },
                    { id: '01_P1_Alta', label: 'P1 - Urgente / Alta', icon: <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" /> },
                    { id: '02_P2_Media', label: 'P2 - Importante / Media', icon: <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" /> },
                    { id: '03_P3_Baja', label: 'P3 - Delegable / Baja', icon: <ArrowDownCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" /> },
                    { id: '04_P4', label: 'P4 - Descarte', icon: <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" /> }
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
                          ? 'bg-indigo-950/70 text-indigo-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {p.icon}
                        <span>{p.label}</span>
                      </span>
                      {filtroPrioridad === p.id && <Check className="w-3.5 h-3.5 text-indigo-400 font-bold shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Popover Tipo de Tarea Canónico */}
            <div
              className="relative shrink-0 kanban-popover-container group/filter-tipo"
              onMouseEnter={() => handlePopoverMouseEnter('tipo', setPopoverTipoAbierto)}
              onMouseLeave={() => handlePopoverMouseLeave('tipo', setPopoverTipoAbierto)}
            >
              <button
                type="button"
                onClick={() => setPopoverTipoAbierto(!popoverTipoAbierto)}
                className={`bg-slate-900/90 border rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 select-none shadow-xs ${
                  filtroTipo && filtroTipo !== 'TODOS'
                    ? 'border-indigo-500/80 bg-indigo-950/60 text-indigo-300 font-bold'
                    : 'border-slate-700/80 hover:border-indigo-500/60 text-slate-300'
                }`}
              >
                {filtroTipo === 'TRABAJO_PROFESIONAL' && <Briefcase className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                {filtroTipo === 'PERSONAL_HABITO' && <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                {filtroTipo === 'URGENTE_CRITICO' && <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                {filtroTipo === 'APRENDIZAJE_ESTUDIO' && <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                {(!filtroTipo || filtroTipo === 'TODOS') && <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span>
                  {filtroTipo === 'TRABAJO_PROFESIONAL'
                    ? 'Trabajo / Proy'
                    : filtroTipo === 'PERSONAL_HABITO'
                    ? 'Personal / Hábito'
                    : filtroTipo === 'URGENTE_CRITICO'
                    ? 'Urgente / Crítico'
                    : filtroTipo === 'APRENDIZAJE_ESTUDIO'
                    ? 'Estudio / PMP'
                    : 'Tipo'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {popoverTipoAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[215px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
                  {[
                    { id: 'TODOS', label: 'Todos los Tipos', icon: <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" /> },
                    { id: 'TRABAJO_PROFESIONAL', label: 'Trabajo / Proyecto', icon: <Briefcase className="w-3.5 h-3.5 text-sky-400 shrink-0" /> },
                    { id: 'PERSONAL_HABITO', label: 'Personal / Hábito', icon: <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" /> },
                    { id: 'URGENTE_CRITICO', label: 'Urgente / Crítico', icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" /> },
                    { id: 'APRENDIZAJE_ESTUDIO', label: 'Aprendizaje / Estudio', icon: <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> }
                  ].map((tOpt) => (
                    <button
                      key={tOpt.id}
                      type="button"
                      onClick={() => {
                        setFiltroTipo(tOpt.id);
                        setPopoverTipoAbierto(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${
                        filtroTipo === tOpt.id
                          ? 'bg-indigo-950/70 text-indigo-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {tOpt.icon}
                        <span>{tOpt.label}</span>
                      </span>
                      {filtroTipo === tOpt.id && <Check className="w-3.5 h-3.5 text-indigo-400 font-bold shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Popover Nivel de Energía */}
            <div
              className="relative shrink-0 kanban-popover-container group/filter-energia"
              onMouseEnter={() => handlePopoverMouseEnter('energia', setPopoverEnergiaAbierto)}
              onMouseLeave={() => handlePopoverMouseLeave('energia', setPopoverEnergiaAbierto)}
            >
              <button
                type="button"
                onClick={() => setPopoverEnergiaAbierto(!popoverEnergiaAbierto)}
                className={`bg-slate-900/90 border rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 select-none shadow-xs ${
                  filtroEnergia
                    ? 'border-amber-500/80 bg-amber-950/40 text-amber-300 font-bold'
                    : 'border-slate-700/80 hover:border-indigo-500/60 text-slate-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {filtroEnergia === 'Alta_DeepWork'
                    ? 'Alta (DeepWork)'
                    : filtroEnergia === 'Media_Operativa'
                    ? 'Media (Operativa)'
                    : filtroEnergia === 'Baja_Automatica'
                    ? 'Baja (Mecánica)'
                    : 'Energía'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {popoverEnergiaAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[210px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
                  {[
                    { id: '', label: 'Todos los niveles', icon: <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" /> },
                    { id: 'Alta_DeepWork', label: 'Alta Cognitiva (DeepWork)', icon: <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" /> },
                    { id: 'Media_Operativa', label: 'Media Operativa', icon: <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" /> },
                    { id: 'Baja_Automatica', label: 'Baja Mecánica', icon: <Coffee className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> }
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
                          ? 'bg-indigo-950/70 text-indigo-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {e.icon}
                        <span>{e.label}</span>
                      </span>
                      {filtroEnergia === e.id && <Check className="w-3.5 h-3.5 text-indigo-400 font-bold shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Popover Plazo / Vencimiento */}
            <div
              className="relative shrink-0 kanban-popover-container group/filter-plazo"
              onMouseEnter={() => handlePopoverMouseEnter('plazo', setPopoverPlazoAbierto)}
              onMouseLeave={() => handlePopoverMouseLeave('plazo', setPopoverPlazoAbierto)}
            >
              <button
                type="button"
                onClick={() => setPopoverPlazoAbierto(!popoverPlazoAbierto)}
                className={`bg-slate-900/90 border rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 select-none shadow-xs ${
                  filtroPlazo
                    ? 'border-indigo-500/80 bg-indigo-950/60 text-indigo-300 font-bold'
                    : 'border-slate-700/80 hover:border-indigo-500/60 text-slate-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>
                  {filtroPlazo === 'vencidas'
                    ? 'Vencidas'
                    : filtroPlazo === 'hoy'
                    ? 'Vencen Hoy'
                    : filtroPlazo === '7dias'
                    ? 'Próximos 7d'
                    : filtroPlazo === 'sin_fecha'
                    ? 'Sin Fecha'
                    : 'Vencimiento'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {popoverPlazoAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[200px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
                  {[
                    { id: '', label: 'Cualquier fecha', icon: <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0" /> },
                    { id: 'vencidas', label: 'Vencidas', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" /> },
                    { id: 'hoy', label: 'Vencen Hoy', icon: <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" /> },
                    { id: '7dias', label: 'Próximos 7 días', icon: <CalendarDays className="w-3.5 h-3.5 text-sky-400 shrink-0" /> },
                    { id: 'sin_fecha', label: 'Sin Fecha', icon: <CalendarOff className="w-3.5 h-3.5 text-slate-400 shrink-0" /> }
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
                          ? 'bg-indigo-950/70 text-indigo-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {p.icon}
                        <span>{p.label}</span>
                      </span>
                      {filtroPlazo === p.id && <Check className="w-3.5 h-3.5 text-indigo-400 font-bold shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Popover Dependencias / Bloqueos */}
            <div
              className="relative shrink-0 kanban-popover-container group/filter-dep"
              onMouseEnter={() => handlePopoverMouseEnter('dep', setPopoverDepAbierto)}
              onMouseLeave={() => handlePopoverMouseLeave('dep', setPopoverDepAbierto)}
            >
              <button
                type="button"
                onClick={() => setPopoverDepAbierto(!popoverDepAbierto)}
                className={`bg-slate-900/90 border rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 select-none shadow-xs ${
                  filtroDependencia
                    ? 'border-purple-500/80 bg-purple-950/40 text-purple-300 font-bold'
                    : 'border-slate-700/80 hover:border-indigo-500/60 text-slate-300'
                }`}
              >
                <Link2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>
                  {filtroDependencia === 'con_dep'
                    ? 'Bloqueadas'
                    : filtroDependencia === 'sin_dep'
                    ? 'Sin Bloqueo'
                    : 'Bloqueos'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {popoverDepAbierto && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#0B1222]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl shadow-black/80 p-1.5 min-w-[220px] space-y-0.5 text-xs before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
                  {[
                    { id: '', label: 'Todos los estados', icon: <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> },
                    { id: 'con_dep', label: 'Bloqueadas por Predecesora', icon: <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" /> },
                    { id: 'sin_dep', label: 'Listas para Iniciar / Sin Bloqueo', icon: <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> }
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
                          ? 'bg-indigo-950/70 text-indigo-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {d.icon}
                        <span>{d.label}</span>
                      </span>
                      {filtroDependencia === d.id && <Check className="w-3.5 h-3.5 text-indigo-400 font-bold shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Indicador reactivo y botón Limpiar Filtros */}
            {hayFiltrosActivos && (
              <div className="ml-auto flex items-center gap-2">
                <span
                  id="badge-filtro-activo-resumen"
                  className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-lg text-[10px] items-center gap-1.5 shadow-2xs whitespace-nowrap"
                >
                  Filtro activo: {tareasFiltradas.length} de {tareas.length} tareas
                </span>

                <button
                  type="button"
                  id="btn-limpiar-filtros-kanban"
                  onClick={limpiarTodosLosFiltros}
                  className="filter-ghost-btn text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition cursor-pointer"
                  title="Restablecer filtros (X)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar Filtros (X)</span>
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
                            className={`kanban-card group relative p-3.5 pl-4 rounded-xl border border-slate-800/60 hover:border-slate-700/80 portal-surface bg-white dark:bg-[#0D1526] select-none cursor-grab active:cursor-grabbing text-xs space-y-2.5 duration-150 ease-out overflow-hidden ${
                              atenuar ? 'kanban-card-atenuada opacity-60 transition-opacity duration-200' : 'transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md'
                            } ${
                              isPredecesora ? 'kanban-card-predecesora' : ''
                            } ${
                              isSucesora ? 'kanban-card-sucesora' : ''
                            }`}
                          >
                            {/* Franja lateral izquierda continua de prioridad (Canónico 1:1 legacy_gas/JS_Kanban.html L780-L782) */}
                            <div 
                              className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorBarraPrioridad} rounded-l-xl transition-all duration-150 group-hover:w-2 pointer-events-none`} 
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
                                  <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                    <polyline points="15 10 20 15 15 20" />
                                    <path d="M4 4v7a4 4 0 0 0 4 4h12" />
                                  </svg>
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
                                    className="px-2 py-0.5 text-xs font-mono tabular-nums font-medium rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 shadow-2xs truncate max-w-[180px]"
                                    title={`Requiere: ${rawDep}`}
                                  >
                                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>Req: {rawDep}</span>
                                  </span>
                                )}
                                {costoTotalPen > 0 && (
                                  <span className="text-xs font-mono tabular-nums font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    S/ {costoTotalPen.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* 5. Fila de metadatos 2 (Subtareas y Tiempos con píldoras marcadas) */}
                            <div className="space-y-1.5 pt-1">
                              {totalSubs > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
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

                              <div className="flex items-center justify-between gap-1 text-xs font-mono tabular-nums pt-0.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                                    estaVencida
                                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 font-semibold'
                                      : 'bg-slate-800/60 text-slate-300 border-slate-700/50'
                                  }`}
                                  title={estaVencida ? 'Tarea vencida' : 'Fecha límite programada'}
                                >
                                  <Calendar className={`w-3 h-3 ${estaVencida ? 'text-rose-400' : 'text-slate-400'}`} />
                                  <span>{formatFechaDDMMYYYY(tar.fecha_programada)}</span>
                                </span>

                                <span
                                  className="bg-slate-800/80 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono tabular-nums"
                                  title={`Horas Reales: ${tar.horas_reales ?? 0}h / Horas Estimadas: ${tar.horas_estimadas ?? 0}h`}
                                >
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
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
