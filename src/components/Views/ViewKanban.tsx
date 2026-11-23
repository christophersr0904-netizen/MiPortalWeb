import React from 'react';
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
  SlidersHorizontal
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
        {/* ================================================================= */}
        {/* BARRA ÚNICA COMPACTA MÓVIL (md:hidden) - REQ-UI-24                */}
        {/* Proyecto Dropdown | Tabs Columnas (Backlog primero) | Filtros     */}
        {/* ================================================================= */}
        <div
          id="carrusel-proyectos-movil"
          className="md:hidden shrink-0 h-11 min-h-[44px] bg-[#080E1C] border-b border-slate-800/70 px-2 flex items-center gap-1.5 select-none"
        >
          {/* 1. Botón Compacto Selector de Proyecto -> Bottom Sheet */}
          <button
            type="button"
            id="btn-selector-proyecto-movil"
            onClick={() => setSelectorProyectosMovilAbierto(true)}
            className={`h-9 min-w-[44px] max-w-[104px] px-2 rounded-xl text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-[transform,colors] ${proyectoSeleccionadoCodigo
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:text-white'
              }`}
            title={proyectoActivo ? `${proyectoActivo.codigo_legado} · ${proyectoActivo.nombre}` : 'Seleccionar proyecto'}
          >
            <FolderKanban className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
            <span className="truncate font-mono tabular-nums">
              {proyectoActivo ? proyectoActivo.codigo_legado : 'Todos'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60 shrink-0" strokeWidth={1.75} />
          </button>

          {/* 2. Selector / Tabs Horizontales de Columnas en la misma barra */}
          <div
            id="selector-columnas-kanban-movil"
            role="tablist"
            aria-label="Selector de columnas Kanban"
            className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden overscroll-contain"
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
                  className={`snap-start shrink-0 h-9 px-2.5 rounded-xl text-[11px] font-semibold transition-[transform,colors] flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap active:scale-95 ${isActiva
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm'
                    : 'text-slate-400 bg-slate-900/60 border border-slate-800/80 hover:text-slate-200'
                    }`}
                >
                  <span>{col.titulo.replace(/^\d+\.\s*/, '')}</span>
                  <span
                    className={`font-mono tabular-nums text-[10px] px-1.5 py-0.5 leading-none rounded-full ${isActiva ? 'bg-sky-400/20 text-sky-200 font-bold' : 'bg-slate-800 text-slate-400'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3. Botón Único Compacto de Filtros & Búsqueda -> Bottom Sheet */}
          <button
            type="button"
            id="btn-toggle-filtros-movil"
            onClick={() => setDrawerFiltrosMovilAbierto(true)}
            aria-expanded={drawerFiltrosMovilAbierto}
            aria-label="Abrir búsqueda y filtros Kanban"
            title="Buscar y Filtrar"
            className={`min-w-[40px] h-9 px-2 rounded-xl text-xs font-semibold transition-[transform,colors] flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0 ${totalFiltrosActivosCount > 0 || drawerFiltrosMovilAbierto
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-300 bg-slate-900/90 border border-slate-800 hover:text-white'
              }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
            {totalFiltrosActivosCount > 0 && (
              <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded-full bg-sky-400 text-slate-950 font-black leading-none">
                {totalFiltrosActivosCount}
              </span>
            )}
          </button>
        </div>
        {/* ================================================================= */}
        {/* HEADER MULTI-FILA DESKTOP (md:flex)                               */}
        {/* ================================================================= */}
        <header className="hidden md:flex bg-[#080E1C] border-b border-slate-800/80 md:px-4 md:py-2 shrink-0 flex-col gap-2 transition-colors overflow-visible relative">
          {/* =============================================================== */}
          {/* FILA 1: CONTEXTO DE PROYECTO, CRONOGRAMA & GASTO GLOBAL          */}
          {/* =============================================================== */}
          <div className="hidden md:flex items-center justify-between gap-3 min-h-[38px] overflow-visible relative w-full flex-wrap pb-1 border-b border-slate-800/60">
            {/* Lado Izquierdo: Título y Píldora de Estado (Vista Global o Proyecto Activo) */}
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <h2 className="hidden sm:flex font-bold text-slate-100 text-sm md:text-base items-center gap-2 shrink-0">
                <span>Tablero Kanban</span>
              </h2>

              {/* Píldora de Estado: Proyecto Seleccionado o Vista Global */}
              {proyectoActivo ? (
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
              ) : (
                <div
                  id="label-proyecto-activo"
                  className="h-9 inline-flex text-[11px] font-medium px-2.5 rounded-lg border border-slate-800/80 bg-[#0D1526] text-slate-300 items-center gap-1.5 shrink-0 select-none"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                  <span className="font-semibold text-slate-200">Vista Global</span>
                </div>
              )}
            </div>

            {/* Lado Derecho: Cronograma, Filtro Temporal y Bloque de Gasto / Presupuesto */}
            <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
              {/* Cronograma / Fechas del proyecto activo con progreso temporal */}
              {proyectoActivo && (proyectoActivo.fecha_inicio || proyectoActivo.fecha_fin) && (
                <div
                  id="kanban-cronograma-proyecto"
                  className="hidden lg:flex h-9 items-center gap-1.5 px-2.5 rounded-lg bg-[#0D1526] border border-slate-800/80 text-[11px] font-medium text-slate-300 shrink-0"
                  title="Cronograma del proyecto"
                >
                  <CalendarRange className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                  <span className="font-mono tabular-nums text-[10px]">
                    {formatearFechaSimple(proyectoActivo.fecha_inicio) || 'Inicio s/f'} → {formatearFechaSimple(proyectoActivo.fecha_fin) || 'Fin s/f'}
                  </span>
                  {progresoTemporalProyecto !== null && (
                    <span
                      className="font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30"
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
                  className={getFiltroTriggerClass(filtroTemporal !== 'TODO', false, 'h-9')}
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

                <AnimatePresence>
                  {dropdownTiempoAbierto && (
                    <motion.div
                      id="popover-time-filter"
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                      className="absolute right-0 top-full mt-1.5 z-50 bg-[#0D1526] border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[160px] max-w-[calc(100vw-20px)] space-y-0.5 text-xs transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
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
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${filtroTemporal === opt.id
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bloque de Gasto Acumulado / Presupuesto Global (Solo Desktop md+ per REQ-UI-24) */}
              <div
                id="kanban-gasto-presupuesto-box"
                className="hidden md:inline-flex h-9 items-center gap-1.5 text-[11px] bg-[#0D1526] px-2.5 rounded-lg border border-slate-800/80 font-medium shrink-0"
              >
                <span className="text-slate-400">
                  {proyectoActivo ? 'Gasto Proyecto:' : 'Gasto Global:'}
                </span>
                <b className="text-slate-100 font-bold font-mono tabular-nums">
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
          {/* FILA 2: BARRA DE FILTROS OPERATIVOS KANBAN (Desktop md+)        */}
          {/* =============================================================== */}
          <div className="hidden md:flex items-center justify-between gap-2 flex-wrap pt-0.5 text-xs overflow-visible relative w-full">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Buscador de Tareas Desktop (h-8 Dark Cobalt) */}
              <div className="hidden md:block relative w-40 md:w-48 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-3.5 h-3.5" strokeWidth={1.75} />
                <input
                  type="text"
                  id="filter-buscar-tarea"
                  value={busquedaTarea}
                  onChange={(e) => setBusquedaTarea(e.target.value)}
                  placeholder="Buscar tarea..."
                  className="w-full h-8 bg-[#0D1526] hover:border-sky-500/40 focus:border-sky-500/60 text-slate-200 placeholder-slate-400 text-xs rounded-lg border border-slate-800/80 pl-8 pr-7 outline-none transition-colors font-medium"
                />
                {busquedaTarea && (
                  <button
                    type="button"
                    onClick={() => setBusquedaTarea('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>

              {/* Micro-divisor 1 */}
              <div className="hidden sm:block w-px h-4 bg-slate-800/90 mx-0.5" />

              {/* Micro-Riel Compacto de Ordenamiento Kanban (h-8) */}
              <div
                className="h-8 inline-flex items-center p-0.5 rounded-lg bg-[#0D1526] border border-slate-800/80 gap-0.5 shrink-0"
                role="group"
                aria-label="Criterio de Ordenamiento"
              >
                <button
                  type="button"
                  onClick={() => setCriterioOrden('PRIORITY')}
                  className={`h-full w-8 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${criterioOrden === 'PRIORITY'
                    ? 'bg-sky-950/50 text-sky-300 border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
                    }`}
                  title="Ordenar por Prioridad (Eisenhower)"
                >
                  <Flame className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  onClick={() => setCriterioOrden('DATE')}
                  className={`h-full w-8 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${criterioOrden === 'DATE'
                    ? 'bg-sky-950/50 text-sky-300 border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
                    }`}
                  title="Ordenar por Fecha / Vencimiento"
                >
                  <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  onClick={() => setCriterioOrden('ENERGY')}
                  className={`h-full w-8 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${criterioOrden === 'ENERGY'
                    ? 'bg-sky-950/50 text-sky-300 border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
                    }`}
                  title="Ordenar por Nivel de Energía"
                >
                  <Zap className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  onClick={() => setCriterioOrden('HOURS')}
                  className={`h-full w-8 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${criterioOrden === 'HOURS'
                    ? 'bg-sky-950/50 text-sky-300 border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
                    }`}
                  title="Ordenar por Horas Estimadas"
                >
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  onClick={() => setCriterioOrden('ALPHA')}
                  className={`h-full w-8 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${criterioOrden === 'ALPHA'
                    ? 'bg-sky-950/50 text-sky-300 border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
                    }`}
                  title="Ordenar Alfabético (A-Z)"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>

              {/* Micro-divisor 2 */}
              <div className="hidden sm:block w-px h-4 bg-slate-800/90 mx-0.5" />

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
                  className={getFiltroTriggerClass(Boolean(filtroHito), !proyectoSeleccionadoCodigo)}
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

                <AnimatePresence>
                  {proyectoSeleccionadoCodigo && popoverHitoAbierto && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                      className="absolute top-full left-0 mt-1.5 z-50 bg-[#0D1526] border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[220px] max-w-[calc(100vw-20px)] max-h-60 overflow-y-auto custom-scrollbar space-y-0.5 text-xs transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
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
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${!filtroHito ? 'bg-sky-950/50 text-sky-300 font-bold' : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
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
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between truncate transition cursor-pointer text-xs font-medium ${filtroHito === h.codigo_legado
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
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  className={getFiltroTriggerClass(Boolean(filtroPrioridad))}
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

                <AnimatePresence>
                  {popoverPrioAbierto && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                      className="absolute top-full left-0 mt-1.5 z-50 bg-[#0D1526] border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[190px] max-w-[calc(100vw-20px)] space-y-0.5 text-xs transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
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
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${filtroPrioridad === p.id
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
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  className={getFiltroTriggerClass(Boolean(filtroEnergia))}
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

                <AnimatePresence>
                  {popoverEnergiaAbierto && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                      className="absolute top-full left-0 mt-1.5 z-50 bg-[#0D1526] border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[180px] max-w-[calc(100vw-20px)] space-y-0.5 text-xs transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
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
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${filtroEnergia === e.id
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
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  className={getFiltroTriggerClass(Boolean(filtroPlazo))}
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

                <AnimatePresence>
                  {popoverPlazoAbierto && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                      className="absolute top-full left-0 mt-1.5 z-50 bg-[#0D1526] border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[180px] max-w-[calc(100vw-20px)] space-y-0.5 text-xs transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
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
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${filtroPlazo === p.id
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
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  className={getFiltroTriggerClass(Boolean(filtroDependencia))}
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

                <AnimatePresence>
                  {popoverDepAbierto && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                      className="absolute top-full left-0 mt-1.5 z-50 bg-[#0D1526] border border-slate-800/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)] p-1.5 min-w-[190px] max-w-[calc(100vw-20px)] space-y-0.5 text-xs transform-gpu origin-top before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
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
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer text-xs font-medium ${filtroDependencia === d.id
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Indicador reactivo y botón Limpiar Filtros (h-8 Dark Cobalt) */}
            {hayFiltrosActivos && (
              <div className="ml-auto hidden md:flex items-center gap-2 shrink-0">
                <span
                  id="badge-filtro-activo-resumen"
                  className="h-8 px-2.5 rounded-lg bg-[#0D1526] border border-amber-500/35 text-amber-300 font-mono tabular-nums text-xs inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>{tareasFiltradas.length}/{tareas.length} tareas</span>
                </span>

                <button
                  type="button"
                  id="btn-limpiar-filtros-kanban"
                  onClick={limpiarTodosLosFiltros}
                  className="filter-ghost-btn h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-[#0D1526] text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800/80 hover:border-rose-500/40 transition-colors cursor-pointer"
                  title="Restablecer filtros (X)"
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Limpiar (X)</span>
                </button>
              </div>
            )}
          </div>
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