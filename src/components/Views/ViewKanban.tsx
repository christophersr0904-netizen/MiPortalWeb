import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderKanban,
  Search,
  FolderPlus,
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
  SlidersHorizontal,
  Plus,
  Undo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ModalTareaFlow } from '../Modals/ModalTareaFlow';
import { ModalNuevoProyecto } from '../Modals/ModalNuevoProyecto';
import { ModalDoDAdvertencia } from '../Modals/ModalDoDAdvertencia';
import { ColumnaKanban } from '../PMO/ColumnaKanban';
import { IconoCategoriaIniciativa } from '../PMO/IconoCategoriaIniciativa';
import { HeaderProyectoActivo } from '../PMO/HeaderProyectoActivo';
import AnimatedContent from '../AnimatedContent';
import { useKanbanBoard, type ColumnaKanbanDef, type TimeFilter } from '../../hooks/useKanbanBoard';
import { mostrarToastCobalt } from '../../utils/toastCobalt';

interface ViewKanbanProps {
  onSeleccionarProyecto?: (proyectoId: string) => void;
  onVerDetalle360?: (proyectoId: string) => void;
  onNuevoProyecto?: () => void;
  onEliminarTarea?: (tareaId: string, nombreTarea: string) => void;
}

export const ViewKanban: React.FC<ViewKanbanProps> = ({
  onSeleccionarProyecto,
  onVerDetalle360,
  onNuevoProyecto,
  onEliminarTarea
}) => {
  const {
    // Sidebar & Selección
    sidebarColapsado,
    setSidebarColapsado,
    busquedaProyecto,
    setBusquedaProyecto,
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
    handlePopoverMouseEnter,
    handlePopoverMouseLeave,
    hayFiltrosActivos,
    totalFiltrosActivosCount,
    limpiarTodosLosFiltros,

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
    puedeDeshacerKanban,
    deshacerUltimaAccionKanban,
    crearTareaRapidaEnColumna,

    // Modales
    modalTareaFlowAbierto,
    setModalTareaFlowAbierto,
    tareaSeleccionadaId,
    setTareaSeleccionadaId,
    columnaNuevaTarea,
    modalNuevoProyectoAbierto,
    setModalNuevoProyectoAbierto,
    dodAdvertencia,
    setDodAdvertencia,
    abrirModalNuevaTarea,
    abrirModalEditarTarea,

    // Columnas
    columnas
  } = useKanbanBoard({ onEliminarTarea });

  // Popover unificado de filtros multidimensionales en Desktop (REQ-UX-KANBAN-01)
  const [filtrosPopoverAbierto, setFiltrosPopoverAbierto] = useState(false);
  const filtrosPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtrosPopoverAbierto) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        filtrosPopoverRef.current &&
        !filtrosPopoverRef.current.contains(e.target as Node)
      ) {
        setFiltrosPopoverAbierto(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setFiltrosPopoverAbierto(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [filtrosPopoverAbierto]);

  const filtrosSecundariosActivosCount = [
    Boolean(filtroHito),
    Boolean(filtroPrioridad),
    Boolean(filtroEnergia),
    Boolean(filtroPlazo),
    Boolean(filtroDependencia)
  ].filter(Boolean).length;

  const handleDeshacerKanban = useCallback(async () => {
    const res = await deshacerUltimaAccionKanban();
    if (res.ok) {
      mostrarToastCobalt(`Deshecho: ${res.mensaje || 'último cambio'}`, 'info');
    }
  }, [deshacerUltimaAccionKanban]);

  // Atajo blindado Ctrl + Z / Cmd + Z para Deshacer en Kanban (REQ-UX-KANBAN-03)
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

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z') {
        const hayModalAbierto =
          typeof document !== 'undefined' &&
          document.querySelectorAll('[aria-modal="true"]').length > 0;
        if (hayModalAbierto || !puedeDeshacerKanban) return;
        e.preventDefault();
        void handleDeshacerKanban();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [puedeDeshacerKanban, handleDeshacerKanban]);

  const renderColumnaKanban = (col: ColumnaKanbanDef, isActivaMovil: boolean) => (
    <ColumnaKanban
      key={col.id}
      col={col}
      isActivaMovil={isActivaMovil}
      tareasColumna={tareasAgrupadasPorColumna[col.id] || []}
      isOverThisCol={dragOverColId === col.id}
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
      tareasLookupMap={tareasLookupMap}
      onDragOver={handleDragOverCol}
      onDragLeave={handleDragLeaveCol}
      onDrop={handleDropCol}
      onDragStartTask={handleDragStartTask}
      onDragEndTask={handleDragEndTask}
      onMouseEnterTask={setHoveredTaskId}
      onMouseLeaveTask={() => setHoveredTaskId(null)}
      onSeleccionarTarea={abrirModalEditarTarea}
      onMoverTareaAEstado={moverTareaAEstado}
      onArchivarTarea={handleArchivarTarea}
      onEliminarTarea={handleEliminarTarea}
      onAbrirModalNuevaTarea={abrirModalNuevaTarea}
      onCrearTareaRapida={crearTareaRapidaEnColumna}
    />
  );

  return (
    <div
      id="vista-kanban-wrapper"
      className={`flex-1 h-full w-full overflow-y-auto md:overflow-hidden grid grid-cols-1 ${sidebarColapsado ? 'md:grid-cols-[64px_1fr]' : 'md:grid-cols-[288px_1fr] lg:grid-cols-[320px_1fr]'
        } transition-[grid-template-columns] duration-300 ease-out`}
    >
      {/* =================================================================== */}
      {/* 1. SIDEBAR DE PROYECTOS CANÓNICO                                    */}
      {/* =================================================================== */}
      <aside
        id="sidebar-portafolio"
        className={`${sidebarColapsado ? 'sidebar-collapsed' : 'sidebar-expanded'
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
              className="p-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-sky-500/50 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            >
              {sidebarColapsado ? <ChevronRight className="w-4 h-4" strokeWidth={1.75} /> : <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />}
            </button>
          </div>

          {!sidebarColapsado && (
            <>
              {/* Buscador de proyectos en vivo */}
              <div className="mt-2.5 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-3.5 h-3.5" strokeWidth={1.75} />
                <input
                  type="text"
                  id="sidebar-search-proyectos"
                  value={busquedaProyecto}
                  onChange={(e) => setBusquedaProyecto(e.target.value)}
                  placeholder="Buscar por nombre o PRO-..."
                  className="w-full h-9 bg-[#0D1526] text-slate-100 placeholder-slate-400 text-xs rounded-lg border border-slate-800/80 focus:border-sky-500/60 pl-8 pr-7 transition-colors outline-none"
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
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition cursor-pointer ${filtroTipoProyecto === tipo
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
                healthBadgeClass = 'bg-rose-950/60 text-rose-300 border border-rose-500/50';
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
                    startKanbanTransition(() => {
                      if (isActivo) {
                        setProyectoSeleccionadoCodigo(null);
                      } else {
                        setProyectoSeleccionadoCodigo(proy.codigo_legado);
                      }
                    });
                  }}
                  title={sidebarColapsado ? `${proy.codigo_legado} · ${proy.nombre} (${healthLabel} - ${pct}%) · ${contadores.activas}/${contadores.total} tareas` : undefined}
                  className={`group relative overflow-hidden transition-colors duration-150 cursor-pointer ${sidebarColapsado ? 'p-2 flex flex-col items-center justify-center gap-1.5' : 'p-2.5'
                    } rounded-xl border ${isActivo
                      ? 'bg-[#0A101C] border-sky-500/50 text-white before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-sky-400 before:transition-transform before:scale-y-100 before:rounded-l-xl'
                      : 'bg-[#0D1526]/50 hover:bg-[#0D1526]/90 border-slate-800/40 hover:border-slate-700/80 text-slate-300 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-transparent before:scale-y-0 before:transition-transform'
                    }`}
                >
                  {!sidebarColapsado ? (
                    <>
                      {/* 1. Cabecera con código PRO-XXX, micro-icono de categoría, cápsula O(1) de tareas y salud */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5 text-[10px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono font-bold text-slate-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800/80 shrink-0">
                            {proy.codigo_legado}
                          </span>
                          <IconoCategoriaIniciativa categoria={proy.tipo_iniciativa} />
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
                            className="opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-600/90 hover:bg-sky-500 text-white shadow-xs border border-sky-400/40 flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
                          >
                            <Sparkles className="w-3 h-3 text-sky-200" strokeWidth={1.75} />
                            <span>360°</span>
                          </button>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 ${healthBadgeClass}`}>
                            <span className={`inline-flex rounded-full h-2 w-2 shrink-0 ${healthDot}`} />
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
                            className="bg-sky-400/25 h-full rounded-full absolute left-0 top-0 transition-[width] duration-500 ease-out"
                            style={{ width: `${metaPct}%` }}
                          />
                          <div
                            className="bg-sky-500 h-full rounded-full absolute left-0 top-0 transition-[width] duration-500 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                      <FolderKanban className="w-5 h-5 mx-auto text-slate-400 group-hover:text-sky-300 transition-colors duration-150" strokeWidth={1.75} />
                      <span className={`inline-flex rounded-full h-2.5 w-2.5 ${healthDot}`} />
                      {contadores.total > 0 && (
                        <span className="font-mono tabular-nums text-[9px] text-sky-400 bg-sky-950/40 px-1 py-0.5 rounded border border-sky-800/50">
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

        {/* Footer Sidebar: Botón Canónico "Nuevo Proyecto" con Elevación Cobalt */}
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
            className="w-full h-10 px-3 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 border border-sky-300/30 shadow-[0_0_18px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-[transform,box-shadow] duration-200 active:scale-95 cursor-pointer select-none group"
            title="Crear nuevo proyecto"
          >
            <FolderPlus className="w-4 h-4 shrink-0 text-slate-950 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
            {!sidebarColapsado && <span className="whitespace-nowrap tracking-tight">Nuevo Proyecto</span>}
          </button>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* 2. ÁREA CENTRAL DEL TABLERO KANBAN                                 */}
      {/* =================================================================== */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#040711] transition-colors duration-200">
        {/* ================================================================= */}
        {/* BARRA ÚNICA COMPACTA MÓVIL (md:hidden) - REQ-UI-24 / REQ-UX-KANBAN-01 */}
        {/* Proyecto Dropdown | Tabs Columnas | Filtros | + Nueva             */}
        {/* ================================================================= */}
        <div
          id="carrusel-proyectos-movil"
          role="toolbar"
          aria-label="Barra de herramientas móvil del tablero Kanban"
          className="md:hidden shrink-0 h-11 min-h-[44px] bg-[#040711] border-b border-white/[0.06] px-2 flex items-center gap-1.5 select-none"
        >
          {/* 1. Botón Compacto Selector de Proyecto -> Bottom Sheet */}
          <button
            type="button"
            id="btn-selector-proyecto-movil"
            onClick={() => setSelectorProyectosMovilAbierto(true)}
            className={`h-8 max-w-[100px] px-2 rounded-lg text-[11px] font-medium flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition border ${proyectoSeleccionadoCodigo
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              : 'bg-white/[0.03] text-slate-300 border-white/[0.07] hover:text-white'
              }`}
            title={proyectoActivo ? `${proyectoActivo.codigo_legado} · ${proyectoActivo.nombre}` : 'Seleccionar proyecto'}
          >
            <FolderKanban className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate font-mono tabular-nums">
              {proyectoActivo ? proyectoActivo.codigo_legado : 'Todos'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          </button>

          {/* 2. Selector Segmentado Horizontal de Columnas en Móvil (REQ-UX-KANBAN-04) */}
          <div
            id="selector-columnas-kanban-movil"
            role="tablist"
            aria-label="Selector de columnas Kanban"
            className="flex-1 min-w-0 flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] p-1 rounded-xl overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden overscroll-contain"
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
                  onClick={() => startKanbanTransition(() => setColumnaMovilActiva(col.id))}
                  className={`snap-start shrink-0 h-7 px-2.5 rounded-lg text-[11px] font-medium transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 border ${isActiva
                    ? 'bg-sky-500/15 text-sky-200 border-sky-500/30 shadow-sm'
                    : 'text-slate-400 bg-transparent border-transparent hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                >
                  <span>{col.titulo.replace(/^\d+\.\s*/, '')}</span>
                  <span
                    className={`font-mono tabular-nums text-[10px] px-1.5 py-0.5 leading-none rounded ${isActiva ? 'bg-sky-400/20 text-sky-200 font-semibold' : 'bg-white/[0.05] text-slate-400'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3. Botón Compacto de Filtros & Búsqueda -> Bottom Sheet */}
          <button
            type="button"
            id="btn-toggle-filtros-movil"
            onClick={() => setDrawerFiltrosMovilAbierto(true)}
            aria-expanded={drawerFiltrosMovilAbierto}
            aria-label="Abrir búsqueda y filtros Kanban"
            title="Buscar y Filtrar"
            className={`h-8 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0 border ${totalFiltrosActivosCount > 0 ? 'px-2' : 'w-8'} ${totalFiltrosActivosCount > 0 || drawerFiltrosMovilAbierto
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              : 'text-slate-400 bg-transparent border-transparent hover:bg-white/[0.06] hover:text-slate-200'
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {totalFiltrosActivosCount > 0 && (
              <span className="font-mono tabular-nums text-[10px] font-semibold leading-none">
                {totalFiltrosActivosCount}
              </span>
            )}
          </button>

          {/* 4. Botón Primario Rápido + Nueva Tarea en Móvil */}
          <button
            type="button"
            onClick={() => abrirModalNuevaTarea(columnaMovilActiva || '01_Backlog')}
            className="h-8 w-8 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
            aria-label="Crear nueva tarea"
            title="Nueva tarea"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* TOOLBAR EJECUTIVA DESKTOP (md:flex) — PARIDAD VIEWCALENDARIO      */}
        {/* ================================================================= */}
        <header className="hidden md:flex flex-col shrink-0 overflow-visible relative z-30 bg-[#040711]">
          {/* FILA PRINCIPAL: Toolbar Unificada de Alta Precisión */}
          <div
            role="toolbar"
            aria-label="Barra de herramientas del tablero Kanban"
            className="min-h-[44px] sm:h-12 px-4 border-b border-white/[0.06] flex items-center justify-between gap-2 overflow-visible relative"
          >
            {/* Zona Izquierda: Contexto de Vista / Proyecto + Gasto Global (cuando aplica) */}
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-slate-100 shrink-0">
                Tablero
              </h2>

              {proyectoActivo ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
                  <span className="text-slate-600">/</span>
                  <span className="font-mono tabular-nums text-[11px] font-medium text-sky-300 shrink-0">
                    {proyectoActivo.codigo_legado}
                  </span>
                </span>
              ) : (
                <>
                  <div
                    id="label-proyecto-activo"
                    className="h-7 px-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-slate-400 text-[11px] font-medium inline-flex items-center gap-1.5 shrink-0 select-none"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <span className="hidden lg:inline">Vista Global</span>
                  </div>

                  {/* Gasto Global / Presupuesto integrado en línea única */}
                  <div
                    id="kanban-gasto-presupuesto-box"
                    className="hidden lg:inline-flex h-7 items-center gap-1.5 px-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[11px] font-medium shrink-0"
                    title="Gasto Global acumulado vs. Presupuesto total"
                  >
                    <span className="hidden xl:inline text-slate-500">Gasto:</span>
                    <b className="text-slate-200 font-semibold font-mono tabular-nums">
                      PEN {gastoContextualPen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </b>
                    {presupuestoContextualPen > 0 && (
                      <>
                        <span className="hidden xl:inline text-slate-600">/</span>
                        <span className="hidden xl:inline font-mono tabular-nums text-slate-400" title="Presupuesto Tope">
                          {presupuestoContextualPen.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span
                          className={`font-mono tabular-nums text-[10px] px-1.5 py-0.5 leading-none rounded border ${gastoContextualPen > presupuestoContextualPen
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                            }`}
                          title="Consumo presupuestal"
                        >
                          {Math.round((gastoContextualPen / presupuestoContextualPen) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Zona Derecha: Buscador Ghost | Horizonte | Orden | Filtros (Popover) | Reset | + Nueva */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* 1. Buscador Compacto Ghost (h-7) */}
              <div className="relative w-36 lg:w-44 shrink-0 flex items-center bg-white/[0.03] border border-white/[0.07] focus-within:border-sky-500/40 rounded-lg h-7 transition-colors">
                <Search
                  className="absolute left-2 pointer-events-none text-slate-500 w-3.5 h-3.5"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  id="filter-buscar-tarea"
                  value={busquedaTarea}
                  onChange={(e) => setBusquedaTarea(e.target.value)}
                  placeholder="Buscar tarea..."
                  className="w-full h-full bg-transparent text-slate-200 placeholder-slate-500 text-xs pl-7 pr-6 outline-none"
                />
                {busquedaTarea && (
                  <button
                    type="button"
                    onClick={() => setBusquedaTarea('')}
                    className="h-5 w-5 rounded flex items-center justify-center absolute right-1 text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition cursor-pointer"
                    title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                )}
              </div>

              <span
                role="separator"
                aria-orientation="vertical"
                className="w-px h-4 bg-white/[0.08] mx-0.5 shrink-0"
              />

              {/* 2. Horizonte Temporal (Ghost Dropdown Unificado) */}
              <div
                className="relative kanban-popover-container shrink-0"
                id="container-time-filter"
                onMouseEnter={() => handlePopoverMouseEnter('tiempo', setDropdownTiempoAbierto)}
                onMouseLeave={() => handlePopoverMouseLeave('tiempo', setDropdownTiempoAbierto)}
              >
                <button
                  type="button"
                  id="btn-time-capsule"
                  onClick={() => {
                    setFiltrosPopoverAbierto(false);
                    setDropdownTiempoAbierto(!dropdownTiempoAbierto);
                  }}
                  aria-expanded={dropdownTiempoAbierto}
                  className={`h-7 px-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70 ${filtroTemporal !== 'TODO' || dropdownTiempoAbierto
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-transparent hover:bg-white/[0.06] border-transparent'
                    }`}
                  title="Filtro de horizonte temporal"
                >
                  {filtroTemporal === 'TODO' && <CalendarRange className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
                  {filtroTemporal === 'HOY' && <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
                  {filtroTemporal === 'SEMANA' && <CalendarDays className="w-3.5 h-3.5 text-sky-300 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
                  {filtroTemporal === 'MES' && <CalendarCheck className="w-3.5 h-3.5 text-violet-300 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
                  <span className="hidden xl:inline">
                    {filtroTemporal === 'TODO' && 'Todo'}
                    {filtroTemporal === 'HOY' && 'Hoy'}
                    {filtroTemporal === 'SEMANA' && 'Semana'}
                    {filtroTemporal === 'MES' && 'Mes'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                </button>

                <AnimatePresence>
                  {dropdownTiempoAbierto && (
                    <motion.div
                      id="popover-time-filter"
                      role="dialog"
                      aria-label="Filtro de horizonte temporal"
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                      className="absolute right-0 top-full mt-1.5 z-[9990] bg-[#0B1221]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 p-1.5 min-w-[168px] space-y-0.5 text-xs transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
                    >
                      {[
                        { id: 'TODO', label: 'Todo', icon: <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                        { id: 'HOY', label: 'Hoy', icon: <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                        { id: 'SEMANA', label: 'Esta Semana', icon: <CalendarDays className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                        { id: 'MES', label: 'Este Mes', icon: <CalendarCheck className="w-3.5 h-3.5 text-violet-300 shrink-0" strokeWidth={1.75} aria-hidden="true" /> }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setFiltroTemporal(opt.id as TimeFilter);
                            setDropdownTiempoAbierto(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${filtroTemporal === opt.id
                            ? 'bg-sky-500/15 text-sky-300'
                            : 'text-slate-300 hover:bg-white/[0.06] hover:text-slate-100'
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            {opt.icon}
                            <span>{opt.label}</span>
                          </span>
                          {filtroTemporal === opt.id && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Micro-Riel Compacto de Ordenamiento Kanban (Estilo Linear h-7) */}
              <div
                className="h-7 inline-flex items-center p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] gap-0.5 shrink-0"
                role="group"
                aria-label="Criterio de Ordenamiento"
              >
                {(
                  [
                    { id: 'PRIORITY', title: 'Ordenar por Prioridad (Eisenhower)', icon: <Flame className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" /> },
                    { id: 'DATE', title: 'Ordenar por Fecha / Vencimiento', icon: <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" /> },
                    { id: 'ENERGY', title: 'Ordenar por Nivel de Energía', icon: <Zap className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" /> },
                    { id: 'HOURS', title: 'Ordenar por Horas Estimadas', icon: <Clock className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" /> },
                    { id: 'ALPHA', title: 'Ordenar Alfabético (A-Z)', icon: <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" /> }
                  ] as const
                ).map((ord) => {
                  const activo = criterioOrden === ord.id;
                  return (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setCriterioOrden(ord.id)}
                      aria-pressed={activo}
                      aria-label={ord.title}
                      title={ord.title}
                      className={`h-6 w-6 rounded-md flex items-center justify-center transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70 ${activo
                        ? 'bg-white/[0.09] text-slate-100 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                        }`}
                    >
                      {ord.icon}
                    </button>
                  );
                })}
              </div>

              {/* 4. Popover Unificado de Filtros Multidimensionales (Prioridad, Energía, Plazo, Bloqueos, Paquetes WBS) */}
              <div ref={filtrosPopoverRef} className="relative kanban-popover-container shrink-0">
                <button
                  type="button"
                  id="btn-filtros-kanban-desktop"
                  onClick={() => {
                    setDropdownTiempoAbierto(false);
                    setFiltrosPopoverAbierto((prev) => !prev);
                  }}
                  aria-expanded={filtrosPopoverAbierto}
                  aria-label="Filtros avanzados del tablero"
                  title="Filtros (Prioridad, Energía, Plazo, Bloqueos y Paquetes WBS)"
                  className={`h-7 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition cursor-pointer border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70 ${filtrosSecundariosActivosCount > 0 ? 'px-2' : 'w-7'} ${filtrosPopoverAbierto || filtrosSecundariosActivosCount > 0
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-transparent hover:bg-white/[0.06] border-transparent'
                    }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {filtrosSecundariosActivosCount > 0 && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" aria-hidden="true" />
                      <span className="font-mono tabular-nums text-[10px] font-medium leading-none">
                        {filtrosSecundariosActivosCount}
                      </span>
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {filtrosPopoverAbierto && (
                    <motion.div
                      id="popover-filtros-unificados-kanban"
                      role="dialog"
                      aria-label="Filtros del tablero Kanban"
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                      className="absolute right-0 top-full mt-1.5 z-[9990] w-[352px] max-w-[calc(100vw-24px)] bg-[#0B1221]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 p-3.5 text-slate-200 select-none transform-gpu origin-top-right"
                    >
                      {/* Cabecera del Popover */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2 min-w-0">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                          <span className="text-xs font-semibold text-slate-100">Filtros</span>
                          <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 leading-none">
                            {tareasFiltradas.length}/{tareas.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {hayFiltrosActivos && (
                            <button
                              type="button"
                              onClick={limpiarTodosLosFiltros}
                              className="h-6 px-2 rounded-md text-[11px] font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 inline-flex items-center gap-1 transition cursor-pointer"
                              title="Limpiar todos los filtros (Atajo: X)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                              <span>Limpiar</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setFiltrosPopoverAbierto(false)}
                            className="h-6 w-6 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] flex items-center justify-center transition cursor-pointer"
                            aria-label="Cerrar filtros"
                            title="Cerrar (Esc)"
                          >
                            <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar pr-0.5">
                        {/* 1. Prioridad Eisenhower */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-rose-400/90" strokeWidth={1.75} aria-hidden="true" />
                            <span>Prioridad Eisenhower</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { id: '', label: 'Todas', icon: <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: '01_P1_Alta', label: 'P1 Alta', icon: <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: '02_P2_Media', label: 'P2 Media', icon: <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: '03_P3_Baja', label: 'P3 Baja', icon: <ArrowDownCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: '04_P4', label: 'P4', icon: <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> }
                            ].map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setFiltroPrioridad(p.id)}
                                className={`h-7 px-2 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5 transition cursor-pointer border ${filtroPrioridad === p.id
                                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                  : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border-white/[0.06]'
                                  }`}
                              >
                                {p.icon}
                                <span>{p.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Nivel de Energía */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-300/90" strokeWidth={1.75} aria-hidden="true" />
                            <span>Nivel de Energía</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { id: '', label: 'Todos', icon: <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: 'Alta_DeepWork', label: 'DeepWork', icon: <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: 'Media_Operativa', label: 'Operativa', icon: <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: 'Baja_Automatica', label: 'Mecánica', icon: <Coffee className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> }
                            ].map((e) => (
                              <button
                                key={e.id}
                                type="button"
                                onClick={() => setFiltroEnergia(e.id)}
                                className={`h-7 px-2 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5 transition cursor-pointer border ${filtroEnergia === e.id
                                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                  : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border-white/[0.06]'
                                  }`}
                              >
                                {e.icon}
                                <span>{e.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Plazo / Vencimiento */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-400/90" strokeWidth={1.75} aria-hidden="true" />
                            <span>Plazo / Vencimiento</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { id: '', label: 'Cualquiera', icon: <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: 'vencidas', label: 'Vencidas', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: 'hoy', label: 'Hoy', icon: <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: '7dias', label: 'Próximos 7d', icon: <CalendarDays className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: 'sin_fecha', label: 'Sin fecha', icon: <CalendarOff className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> }
                            ].map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setFiltroPlazo(p.id)}
                                className={`h-7 px-2 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5 transition cursor-pointer border ${filtroPlazo === p.id
                                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                  : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border-white/[0.06]'
                                  }`}
                              >
                                {p.icon}
                                <span>{p.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 4. Dependencias / Bloqueos */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} aria-hidden="true" />
                            <span>Dependencias / Bloqueos</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { id: '', label: 'Todos', icon: <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: 'con_dep', label: 'Bloqueadas', icon: <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> },
                              { id: 'sin_dep', label: 'Libres', icon: <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.75} aria-hidden="true" /> }
                            ].map((d) => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => setFiltroDependencia(d.id)}
                                className={`h-7 px-2 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5 transition cursor-pointer border ${filtroDependencia === d.id
                                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                  : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border-white/[0.06]'
                                  }`}
                              >
                                {d.icon}
                                <span>{d.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 5. Paquete de Trabajo WBS */}
                        <div className="space-y-1.5 pt-2.5 border-t border-white/[0.06]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Milestone className="w-3.5 h-3.5 text-violet-300/90" strokeWidth={1.75} aria-hidden="true" />
                              <span>Paquete de Trabajo WBS</span>
                            </span>
                            {proyectoSeleccionadoCodigo && hitosDisponibles.length > 0 && (
                              <span className="font-mono tabular-nums text-[10px] text-slate-500">
                                {hitosDisponibles.length}
                              </span>
                            )}
                          </div>

                          {!proyectoSeleccionadoCodigo ? (
                            <p className="text-[11px] text-slate-500 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                              Selecciona un proyecto en el panel izquierdo para filtrar por paquete WBS.
                            </p>
                          ) : hitosDisponibles.length === 0 ? (
                            <p className="text-[11px] text-slate-500 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                              Este proyecto aún no tiene paquetes WBS registrados.
                            </p>
                          ) : (
                            <div className="space-y-0.5 max-h-36 overflow-y-auto custom-scrollbar">
                              <button
                                type="button"
                                onClick={() => setFiltroHito('')}
                                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${!filtroHito
                                  ? 'bg-sky-500/15 text-sky-300'
                                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-slate-100'
                                  }`}
                              >
                                <span className="flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                                  <span>Todos los Paquetes</span>
                                </span>
                                {!filtroHito && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
                              </button>
                              {hitosDisponibles.map((h) => (
                                <button
                                  key={h.id}
                                  type="button"
                                  onClick={() => setFiltroHito(h.codigo_legado)}
                                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between gap-2 transition cursor-pointer text-xs font-medium ${filtroHito === h.codigo_legado
                                    ? 'bg-sky-500/15 text-sky-300'
                                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-slate-100'
                                    }`}
                                >
                                  <span className="flex items-center gap-2 min-w-0">
                                    <Milestone className="w-3.5 h-3.5 text-violet-300 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                                    <span className="truncate font-mono tabular-nums text-[10px] text-slate-400 shrink-0">
                                      {h.codigo_legado}
                                    </span>
                                    <span className="truncate">{h.nombre_elemento}</span>
                                  </span>
                                  {filtroHito === h.codigo_legado && (
                                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 5. Indicador de Tareas Filtradas y Limpiar Rápido (X) */}
              {hayFiltrosActivos && (
                <>
                  <span
                    id="badge-filtro-activo-resumen"
                    className="h-7 px-2 rounded-lg bg-amber-500/10 border border-amber-400/25 text-amber-300 font-mono tabular-nums text-[10px] font-medium inline-flex items-center whitespace-nowrap shrink-0"
                    title={`Mostrando ${tareasFiltradas.length} de ${tareas.length} tareas`}
                  >
                    {tareasFiltradas.length}/{tareas.length}
                  </span>

                  <button
                    type="button"
                    id="btn-limpiar-filtros-kanban"
                    onClick={limpiarTodosLosFiltros}
                    className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-300 bg-transparent hover:bg-rose-500/10 flex items-center justify-center transition cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70"
                    title="Restablecer filtros (Atajo: X)"
                    aria-label="Restablecer todos los filtros"
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </>
              )}

              {/* 5b. Botón Ghost Discreto Deshacer (Ctrl+Z) cuando hay historial Kanban */}
              {puedeDeshacerKanban && (
                <button
                  type="button"
                  id="btn-undo-kanban-toolbar"
                  onClick={() => void handleDeshacerKanban()}
                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-sky-300 bg-transparent hover:bg-white/[0.06] flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70"
                  title="Deshacer (Ctrl+Z)"
                  aria-label="Deshacer"
                >
                  <Undo2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              )}

              <span
                role="separator"
                aria-orientation="vertical"
                className="w-px h-4 bg-white/[0.08] mx-0.5 shrink-0"
              />

              {/* 6. Acción Primaria Única (+ Nueva Tarea en acento Cobalt) */}
              <button
                type="button"
                id="btn-nueva-tarea-kanban-toolbar"
                onClick={() => abrirModalNuevaTarea('01_Backlog')}
                className="h-7 px-2.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/70"
                title="Crear nueva tarea en el tablero"
                aria-label="Crear nueva tarea"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="hidden lg:inline">Nueva</span>
              </button>
            </div>
          </div>

          {/* CINTA CONTEXTUAL DE PROYECTO ACTIVO (solo cuando hay proyecto seleccionado) */}
          {proyectoActivo && (
            <div className="flex items-center justify-between gap-2 px-4 py-1.5 border-b border-white/[0.05] bg-[#070C18]/75 overflow-visible flex-wrap">
              <HeaderProyectoActivo
                proyecto={proyectoActivo}
                avanceReal={avancesPorProyecto.get(proyectoActivo.codigo_legado || proyectoActivo.id)?.avanceReal ?? proyectoActivo.avance_pct ?? 0}
                contadoresTareas={
                  contadoresTareasPorProyecto.get(proyectoActivo.codigo_legado?.trim().toUpperCase()) ||
                  contadoresTareasPorProyecto.get(proyectoActivo.id?.trim().toUpperCase()) ||
                  { total: 0, activas: 0, completadas: 0 }
                }
                progresoTemporal={progresoTemporalProyecto}
                onDeseleccionar={() => {
                  setProyectoSeleccionadoCodigo('');
                  setFiltroHito('');
                }}
                onVerDetalle360={onVerDetalle360 || onSeleccionarProyecto}
              />

              <div className="flex items-center gap-2 shrink-0 ml-auto">
                {/* Cronograma del Proyecto Activo */}
                {(proyectoActivo.fecha_inicio || proyectoActivo.fecha_fin) && (
                  <div
                    id="kanban-cronograma-proyecto"
                    className="hidden lg:flex h-7 items-center gap-1.5 px-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[11px] font-medium text-slate-300 shrink-0"
                    title="Cronograma del proyecto"
                  >
                    <CalendarRange className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <span className="font-mono tabular-nums text-[10px]">
                      {formatearFechaSimple(proyectoActivo.fecha_inicio) || 'Inicio s/f'} → {formatearFechaSimple(proyectoActivo.fecha_fin) || 'Fin s/f'}
                    </span>
                    {progresoTemporalProyecto !== null && (
                      <span
                        className="font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/25 leading-none"
                        title="Progreso temporal transcurrido"
                      >
                        {progresoTemporalProyecto}% t
                      </span>
                    )}
                  </div>
                )}

                {/* Gasto / Presupuesto del Proyecto Activo */}
                <div
                  id="kanban-gasto-presupuesto-box"
                  className="inline-flex h-7 items-center gap-1.5 px-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[11px] font-medium shrink-0"
                >
                  <span className="hidden xl:inline text-slate-500">Gasto Proyecto:</span>
                  <b className="text-slate-100 font-semibold font-mono tabular-nums">
                    PEN {gastoContextualPen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </b>
                  {presupuestoContextualPen > 0 && (
                    <>
                      <span className="text-slate-600">/</span>
                      <span className="font-mono tabular-nums text-slate-400" title="Presupuesto Tope">
                        PEN {presupuestoContextualPen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span
                        className={`font-mono tabular-nums text-[10px] px-1.5 py-0.5 leading-none rounded border ${gastoContextualPen > presupuestoContextualPen
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
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
          )}
        </header>

        {/* ================================================================= */}
        {/* 3. CHASIS DE 4 COLUMNAS KANBAN Y DRAG-AND-DROP NATIVO HTML5       */}
        {/* ================================================================= */}
        <div
          id="board-kanban-container"
          className="flex-1 min-h-0 overflow-x-hidden md:overflow-x-auto overflow-y-hidden px-2 pt-1.5 pb-2 md:p-4 custom-scrollbar [&::-webkit-scrollbar]:hidden flex flex-col"
        >
          {/* Vista móvil de columna única con transición horizontal React Bits AnimatedContent (REQ-UI-27) */}
          {columnaMovilSeleccionada && (
            <AnimatedContent
              key={columnaMovilSeleccionada.id}
              trigger="mount"
              distance={40}
              direction="horizontal"
              reverse={false}
              duration={0.28}
              ease="power3.out"
              className="md:hidden flex-1 min-h-0 w-full h-full flex flex-col"
            >
              {renderColumnaKanban(columnaMovilSeleccionada, true)}
            </AnimatedContent>
          )}

          {/* Chasis Desktop de 4 Columnas Simultáneas */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-4 flex-1 min-h-0 w-full md:min-w-[1050px] h-full items-start">
            {columnas.map((col) => renderColumnaKanban(col, true))}
          </div>
        </div>

        {/* FAB Flotante Cobalt para Nueva Tarea en Móvil (REQ-UX-KANBAN-04) */}
        <button
          type="button"
          id="fab-nueva-tarea-kanban-movil"
          onClick={() => abrirModalNuevaTarea(columnaMovilActiva || '01_Backlog')}
          className="fixed bottom-20 right-4 z-30 w-11 h-11 rounded-full bg-sky-500/90 hover:bg-sky-400 active:scale-95 text-white border border-sky-300/30 shadow-lg shadow-sky-500/25 flex items-center justify-center transition cursor-pointer md:hidden"
          aria-label="Nueva tarea"
          title="Nueva tarea"
        >
          <Plus className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </main>

      {/* =================================================================== */}
      {/* 4. MODAL CANÓNICO TAREAFLOW BENTO                                   */}
      {/* =================================================================== */}
      <ModalTareaFlow
        isOpen={modalTareaFlowAbierto}
        onClose={() => setModalTareaFlowAbierto(false)}
        tareaId={tareaSeleccionadaId}
        initialColumna={columnaNuevaTarea}
        estadoInicial={columnaNuevaTarea}
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

      {/* =================================================================== */}
      {/* 7. BOTTOM SHEET MÓVIL: SELECTOR DE PROYECTO (md:hidden) - REQ-UI-24 */}
      {/* =================================================================== */}
      {selectorProyectosMovilAbierto && typeof document !== 'undefined' && createPortal(
        <div
          id="bottom-sheet-proyectos-kanban-movil"
          role="dialog"
          aria-modal="true"
          aria-label="Seleccionar proyecto en tablero"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectorProyectosMovilAbierto(false);
          }}
          className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-0 md:hidden transition-opacity duration-200"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-h-[85dvh] rounded-t-3xl bg-[#0D1526] border-t border-slate-700/60 shadow-2xl flex flex-col overflow-hidden transform-gpu text-slate-100"
          >
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />
            <div className="px-4 pb-3 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
                <h3 className="text-sm font-bold text-slate-100">Proyectos en Tablero</h3>
                <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                  {proyectos.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectorProyectosMovilAbierto(false);
                    if (onNuevoProyecto) onNuevoProyecto();
                    else setModalNuevoProyectoAbierto(true);
                  }}
                  className="min-h-[44px] px-3.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-sky-500 to-cyan-400 border border-sky-300/40 shadow-sm shadow-sky-950/40 flex items-center gap-1.5 cursor-pointer active:scale-95 group transition-[transform,box-shadow] duration-150"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-slate-950 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
                  <span>Nuevo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectorProyectosMovilAbierto(false)}
                  className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 flex items-center justify-center cursor-pointer"
                  aria-label="Cerrar selector de proyectos"
                >
                  <X className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar pb-6">
              <button
                type="button"
                onClick={() => {
                  setProyectoSeleccionadoCodigo(null);
                  setSelectorProyectosMovilAbierto(false);
                }}
                className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer active:scale-[0.99] transition-[colors,transform] ${!proyectoSeleccionadoCodigo
                  ? 'bg-sky-950/50 border-sky-500/50 text-sky-200'
                  : 'bg-slate-900/60 border-slate-800/70 text-slate-300 hover:bg-slate-800/70'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
                  <span>Vista Global (Todos los proyectos)</span>
                </span>
                {!proyectoSeleccionadoCodigo && <Check className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={2} />}
              </button>

              {proyectos.map((proy) => {
                const isActivo = proyectoSeleccionadoCodigo === proy.codigo_legado;
                const avances = avancesPorProyecto.get(proy.codigo_legado || proy.id) || { avanceReal: 0, avanceTotalProyectado: 0 };
                const contadores =
                  contadoresTareasPorProyecto.get(proy.codigo_legado?.trim().toUpperCase()) ||
                  contadoresTareasPorProyecto.get(proy.id?.trim().toUpperCase()) ||
                  { total: 0, activas: 0, completadas: 0 };
                return (
                  <button
                    key={proy.id}
                    type="button"
                    onClick={() => {
                      startKanbanTransition(() => {
                        setProyectoSeleccionadoCodigo(isActivo ? null : proy.codigo_legado);
                      });
                      setSelectorProyectosMovilAbierto(false);
                    }}
                    className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] transition-[colors,transform] ${isActivo
                      ? 'bg-sky-950/50 border-sky-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800/70 text-slate-300 hover:bg-slate-800/70'
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono tabular-nums text-[10px] font-bold text-sky-400 shrink-0">
                          {proy.codigo_legado}
                        </span>
                        <span className="text-xs font-semibold truncate">{proy.nombre}</span>
                      </div>
                      <div className="text-[10px] font-mono tabular-nums text-slate-400 mt-0.5">
                        {contadores.activas} activas · {avances.avanceReal}% avance
                      </div>
                    </div>
                    {isActivo && <Check className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* =================================================================== */}
      {/* 8. BOTTOM SHEET MÓVIL: BÚSQUEDA & FILTROS KANBAN (md:hidden)         */}
      {/* =================================================================== */}
      {drawerFiltrosMovilAbierto && typeof document !== 'undefined' && createPortal(
        <div
          id="bottom-sheet-filtros-kanban-movil"
          role="dialog"
          aria-modal="true"
          aria-label="Buscar y filtrar tareas Kanban"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerFiltrosMovilAbierto(false);
          }}
          className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-0 md:hidden transition-opacity duration-200"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-h-[90dvh] rounded-t-3xl bg-[#0D1526] border-t border-slate-700/60 shadow-2xl flex flex-col overflow-hidden transform-gpu text-slate-100"
          >
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />
            <div className="px-4 pb-3 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
                <h3 className="text-sm font-bold text-slate-100">Buscar y Filtrar</h3>
                {totalFiltrosActivosCount > 0 && (
                  <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                    {totalFiltrosActivosCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {hayFiltrosActivos && (
                  <button
                    type="button"
                    id="btn-limpiar-filtros-movil"
                    onClick={limpiarTodosLosFiltros}
                    className="min-h-[44px] px-3 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Limpiar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDrawerFiltrosMovilAbierto(false)}
                  className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 flex items-center justify-center cursor-pointer"
                  aria-label="Cerrar panel de filtros"
                >
                  <X className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {/* Búsqueda de Tareas */}
              <div>
                <label htmlFor="filter-buscar-tarea-mobile" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Buscar tarea
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" strokeWidth={1.75} />
                  <input
                    type="text"
                    id="filter-buscar-tarea-mobile"
                    value={busquedaTarea}
                    onChange={(e) => setBusquedaTarea(e.target.value)}
                    placeholder="Nombre, código o etiqueta..."
                    className="w-full h-11 bg-[#040711]/70 text-slate-100 placeholder-slate-500 text-xs rounded-xl border border-slate-800 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 pl-9 pr-11 outline-none font-medium"
                  />
                  {busquedaTarea && (
                    <button
                      type="button"
                      onClick={() => setBusquedaTarea('')}
                      className="absolute inset-y-0 right-0 min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </div>

              {/* Ordenamiento */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ordenar por
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'PRIORITY', label: 'Prioridad' },
                      { id: 'DATE', label: 'Fecha' },
                      { id: 'ENERGY', label: 'Energía' },
                      { id: 'HOURS', label: 'Horas' },
                      { id: 'ALPHA', label: 'A-Z' }
                    ] as const
                  ).map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setCriterioOrden(ord.id)}
                      className={`h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-[transform,colors] ${criterioOrden === ord.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-900/70 text-slate-300 border border-slate-800'
                        }`}
                    >
                      {ord.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizonte Temporal */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Horizonte Temporal
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'TODO', label: 'Todo' },
                      { id: 'HOY', label: 'Hoy' },
                      { id: 'SEMANA', label: 'Esta Semana' },
                      { id: 'MES', label: 'Este Mes' }
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFiltroTemporal(opt.id)}
                      className={`h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-[transform,colors] ${filtroTemporal === opt.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-900/70 text-slate-300 border border-slate-800'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paquete WBS (solo si hay proyecto activo con hitos) */}
              {proyectoSeleccionadoCodigo && hitosDisponibles.length > 0 && (
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Paquete de Trabajo WBS
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFiltroHito('')}
                      className={`h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${!filtroHito
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-900/70 text-slate-300 border border-slate-800'
                        }`}
                    >
                      Todos
                    </button>
                    {hitosDisponibles.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setFiltroHito(filtroHito === h.codigo_legado ? '' : h.codigo_legado)}
                        className={`h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 max-w-full truncate ${filtroHito === h.codigo_legado
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'bg-slate-900/70 text-slate-300 border border-slate-800'
                          }`}
                      >
                        {h.codigo_legado} · {h.nombre_elemento}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prioridad */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Prioridad Eisenhower
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: '', label: 'Todas' },
                    { id: '01_P1_Alta', label: 'P1: Alta' },
                    { id: '02_P2_Media', label: 'P2: Media' },
                    { id: '03_P3_Baja', label: 'P3: Baja' },
                    { id: '04_P4', label: 'P4' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFiltroPrioridad(p.id)}
                      className={`h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${filtroPrioridad === p.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-900/70 text-slate-300 border border-slate-800'
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energía */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nivel de Energía
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: '', label: 'Todos' },
                    { id: 'Alta_DeepWork', label: 'DeepWork' },
                    { id: 'Media_Operativa', label: 'Operativa' },
                    { id: 'Baja_Automatica', label: 'Mecánica' }
                  ].map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setFiltroEnergia(e.id)}
                      className={`h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${filtroEnergia === e.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-900/70 text-slate-300 border border-slate-800'
                        }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plazo & Bloqueos */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Plazo / Vencimiento
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: '', label: 'Cualquier fecha' },
                      { id: 'vencidas', label: 'Vencidas' },
                      { id: 'hoy', label: 'Hoy' },
                      { id: '7dias', label: 'Próximos 7d' },
                      { id: 'sin_fecha', label: 'Sin fecha' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFiltroPlazo(p.id)}
                        className={`h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${filtroPlazo === p.id
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'bg-slate-900/70 text-slate-300 border border-slate-800'
                          }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Dependencias / Bloqueos
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: '', label: 'Todos' },
                      { id: 'con_dep', label: 'Bloqueadas' },
                      { id: 'sin_dep', label: 'Libres' }
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setFiltroDependencia(d.id)}
                        className={`h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${filtroDependencia === d.id
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'bg-slate-900/70 text-slate-300 border border-slate-800'
                          }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#0D1526]/95 backdrop-blur-md p-3 border-t border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
              <span className="text-xs font-mono tabular-nums text-slate-400">
                Mostrando <b className="text-slate-100">{tareasFiltradas.length}</b>/{tareas.length}
              </span>
              <button
                type="button"
                onClick={() => setDrawerFiltrosMovilAbierto(false)}
                className="min-h-[44px] px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer active:scale-95"
              >
                Ver Tablero
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};