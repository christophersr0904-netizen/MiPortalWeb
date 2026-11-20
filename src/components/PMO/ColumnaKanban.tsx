import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CanonicalTarea } from '../../utils/entityNormalizer';
import type { SubtareaPaso } from '../../types';
import { TarjetaTareaKanban } from './TarjetaTareaKanban';
import { Layers, CheckCircle2, Zap, Plus } from 'lucide-react';

export interface ColumnaConfig {
  id: string;
  domId: string;
  titulo: string;
  iconoColor: string;
  tituloColor: string;
  badgeColor: string;
  headerGlow?: boolean;
}

export interface ColumnaKanbanProps {
  col: ColumnaConfig;
  isActivaMovil?: boolean;
  tareasColumna: CanonicalTarea[];
  isOverThisCol: boolean;
  cargandoDatosIniciales: boolean;
  draggedTaskId: string | null;
  hoveredTaskId: string | null;
  predecesorasHover: Set<string>;
  sucesorasHover: Set<string>;
  predecesorasOcultas: string[];
  sucesorasOcultas: string[];
  subtareasPorTarea: Map<string, SubtareaPaso[]>;
  proyectosMap: Map<string, any>;
  hitosMap: Map<string, any>;
  gastosPorTarea: Map<string, number>;
  tareasLookupMap?: Map<string, { codigo: string; nombre: string }>;
  onDragOver: (e: React.DragEvent, colId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, colId: string) => void;
  onDragStartTask: (e: React.DragEvent, taskId: string) => void;
  onDragEndTask: () => void;
  onMouseEnterTask: (codigo: string) => void;
  onMouseLeaveTask: () => void;
  onSeleccionarTarea: (id: string, estado: string) => void;
  onMoverTareaAEstado: (tar: CanonicalTarea, nuevoEstado: string) => void;
  onArchivarTarea: (tar: CanonicalTarea) => void;
  onEliminarTarea: (id: string, nombre: string) => void;
  onAbrirModalNuevaTarea: (colId: string) => void;
}

const ColumnaKanbanComponent: React.FC<ColumnaKanbanProps> = ({
  col,
  isActivaMovil = true,
  tareasColumna,
  isOverThisCol,
  cargandoDatosIniciales,
  draggedTaskId,
  hoveredTaskId,
  predecesorasHover,
  sucesorasHover,
  predecesorasOcultas,
  sucesorasOcultas,
  subtareasPorTarea,
  proyectosMap,
  hitosMap,
  gastosPorTarea,
  tareasLookupMap,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStartTask,
  onDragEndTask,
  onMouseEnterTask,
  onMouseLeaveTask,
  onSeleccionarTarea,
  onMoverTareaAEstado,
  onArchivarTarea,
  onEliminarTarea,
  onAbrirModalNuevaTarea
}) => {
  // Esfuerzo horario total estimado de la columna
  const totalHorasColumna = tareasColumna.reduce((acc, t) => acc + (Number(t.horas_estimadas) || 0), 0);
  const totalHorasStr = totalHorasColumna > 0
    ? `${totalHorasColumna % 1 === 0 ? totalHorasColumna : totalHorasColumna.toFixed(1)}h`
    : null;

  return (
    <div
      id={col.domId}
      data-state={col.id}
      className={`kanban-col-container ${isActivaMovil === false ? 'hidden md:flex' : 'flex'
        } flex-col rounded-2xl border p-2.5 md:p-3.5 h-full min-h-0 w-full transition-colors duration-150 select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${isOverThisCol
          ? 'kanban-dropzone-active bg-sky-950/20 border-sky-500/50 shadow-sm'
          : 'bg-[#0A101F]/90 border-slate-800/75 shadow-sm'
        }`}
      onDragOver={(e) => onDragOver(e, col.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, col.id)}
    >
      {/* Cabecera de Columna (Elevación Bento Cobalt con micro-botón y horas) */}
      <div className="pb-2.5 mb-2.5 border-b border-slate-800/60 shrink-0">
        <div className="hidden md:flex justify-between items-center px-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-center relative shrink-0">
              {col.headerGlow && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]"></span>
              )}
              {col.id === '01_Backlog' && <Layers className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.75} />}
              {col.id === '02_Por_Hacer' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />}
              {col.id === '03_En_Proceso' && <Zap className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />}
              {col.id === '04_Completado' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />}
            </span>
            <span className="text-[13.5px] md:text-sm font-semibold tracking-tight text-slate-100 truncate">
              {col.titulo}
            </span>
            {totalHorasStr && (
              <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0" title={`Esfuerzo total estimado: ${totalHorasStr}`}>
                · {totalHorasStr}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-mono tabular-nums font-bold bg-slate-800/70 px-2 py-0.5 rounded-full text-slate-300 border border-slate-700/50">
              {cargandoDatosIniciales ? (
                <span className="inline-block w-4 h-3 bg-slate-700/60 rounded animate-pulse" />
              ) : (
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={tareasColumna.length}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="inline-block font-mono tabular-nums"
                  >
                    {tareasColumna.length}
                  </motion.span>
                </AnimatePresence>
              )}
            </span>
            <button
              type="button"
              onClick={() => onAbrirModalNuevaTarea(col.id)}
              className="w-7 h-7 rounded-lg hover:bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-700/60"
              title={`Añadir tarea a ${col.titulo}`}
              aria-label={`Añadir tarea a ${col.titulo}`}
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Botón "+ Añadir" Compacto solo en móvil (REQ-UI-27) */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => onAbrirModalNuevaTarea(col.id)}
            className="w-full h-9 md:h-7 py-1 px-3 border border-dashed border-slate-700/80 hover:border-sky-500/50 hover:bg-slate-800/70 text-slate-300 hover:text-sky-300 rounded-xl md:rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-[transform,colors,border-color] shadow-sm cursor-pointer active:scale-95"
            aria-label={`Añadir tarea a ${col.titulo}`}
          >
            <Plus className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
            <span>Añadir</span>
          </button>
        </div>
      </div>

      {/* Lista de Tarjetas Scrollable */}
      <div
        id={`body-${col.domId}`}
        className="kanban-col-body flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2.5 px-1.5 pt-1 -mx-1.5 custom-scrollbar pb-28 md:pb-8 [&::-webkit-scrollbar]:hidden"
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
          <button
            type="button"
            onClick={() => onAbrirModalNuevaTarea(col.id)}
            className="w-full py-8 px-4 rounded-xl border border-dashed border-slate-800/80 hover:border-sky-500/40 bg-slate-950/20 hover:bg-slate-900/40 flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-sky-300 transition-colors cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" strokeWidth={1.75} />
            <span className="text-[11px] font-medium">Sin tareas · Añadir</span>
          </button>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {tareasColumna.map((tar) => {
              const subsTarea = subtareasPorTarea.get(tar.codigo_legado) || [];
              const proyAsoc = (tar.proyecto_codigo ? proyectosMap.get(tar.proyecto_codigo) : undefined) ||
                (tar.raw?.proyecto_id ? proyectosMap.get(tar.raw.proyecto_id) : undefined);
              const nombreProyecto = proyAsoc?.nombre || tar.proyecto_codigo || 'General';
              const hitoAsoc = (tar.hito_codigo ? hitosMap.get(tar.hito_codigo) : undefined) ||
                (tar.raw?.hito_id ? hitosMap.get(tar.raw.hito_id) : undefined);
              const nombreHito = (hitoAsoc as any)?.nombre || (hitoAsoc as any)?.nombre_hito || (hitoAsoc as any)?.nombre_elemento || tar.hito_codigo || 'Hito Principal';

              const isHovered = hoveredTaskId === tar.codigo_legado;
              const isPredecesora = predecesorasHover.has(tar.codigo_legado.toUpperCase());
              const isSucesora = sucesorasHover.has(tar.codigo_legado.toUpperCase());
              const isRelacionada = isHovered || isPredecesora || isSucesora;
              const atenuar = hoveredTaskId !== null && !isRelacionada;

              const predOcultas = isHovered ? predecesorasOcultas : [];
              const sucOcultas = isHovered ? sucesorasOcultas : [];

              const costoGasto = gastosPorTarea.get(tar.codigo_legado.toUpperCase()) || 0;

              return (
                <motion.div
                  key={tar.id}
                  layout={draggedTaskId === tar.id ? false : 'position'}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ type: 'spring', stiffness: 550, damping: 45, mass: 0.75 }}
                  className="overflow-visible"
                >
                  <TarjetaTareaKanban
                    tar={tar}
                    colId={col.id}
                    isDragged={draggedTaskId === tar.id}
                    isHovered={isHovered}
                    isPredecesora={isPredecesora}
                    isSucesora={isSucesora}
                    atenuar={atenuar}
                    predecesorasOcultas={predOcultas}
                    sucesorasOcultas={sucOcultas}
                    subsTarea={subsTarea}
                    nombreProyecto={nombreProyecto}
                    nombreHito={nombreHito}
                    costoGasto={costoGasto}
                    tareasLookupMap={tareasLookupMap}
                    onDragStart={onDragStartTask}
                    onDragEnd={onDragEndTask}
                    onMouseEnter={onMouseEnterTask}
                    onMouseLeave={onMouseLeaveTask}
                    onClick={onSeleccionarTarea}
                    onMoverTareaAEstado={onMoverTareaAEstado}
                    onArchivarTarea={onArchivarTarea}
                    onEliminarTarea={onEliminarTarea}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export const ColumnaKanban = memo(ColumnaKanbanComponent);
