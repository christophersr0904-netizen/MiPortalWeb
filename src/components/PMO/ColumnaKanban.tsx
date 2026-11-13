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
  // Borde superior acentuado de 2px según fase canónica
  const borderTopColor =
    col.id === '01_Backlog'
      ? 'border-t-slate-500'
      : col.id === '02_Por_Hacer'
      ? 'border-t-sky-500'
      : col.id === '03_En_Proceso'
      ? 'border-t-amber-500'
      : col.id === '04_Completado'
      ? 'border-t-emerald-500'
      : 'border-t-slate-600';

  // Esfuerzo horario total estimado de la columna
  const totalHorasColumna = tareasColumna.reduce((acc, t) => acc + (Number(t.horas_estimadas) || 0), 0);
  const totalHorasStr = totalHorasColumna > 0
    ? `${totalHorasColumna % 1 === 0 ? totalHorasColumna : totalHorasColumna.toFixed(1)}h`
    : null;

  return (
    <div
      id={col.domId}
      data-state={col.id}
      className={`kanban-col-container ${
        isActivaMovil === false ? 'hidden md:flex' : 'flex'
      } flex-col rounded-xl md:rounded-2xl border border-t-2 ${borderTopColor} p-2 md:p-3 h-full min-h-0 w-full transition-[transform,opacity,border-color,box-shadow] duration-200 ease-out transform-gpu shadow-sm select-none ${
        isOverThisCol
          ? 'kanban-dropzone-active bg-sky-950/20 border-sky-500/40 shadow-[0_0_20px_rgba(56,189,248,0.15)] ring-1 ring-sky-400/30'
          : 'portal-surface bg-slate-200/50 dark:bg-[#0D1526]/80 border-slate-300/60 dark:border-slate-800/40'
      }`}
      onDragOver={(e) => onDragOver(e, col.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, col.id)}
    >
      {/* Cabecera de Columna (Elevación Bento Cobalt con micro-botón y horas) */}
      <div className="mb-2 shrink-0">
        <div className="hidden md:flex justify-between items-center px-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold ${col.iconoColor} relative shrink-0`}>
              {col.headerGlow && (
                <span className="animate-ping absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500 opacity-75"></span>
              )}
              {col.id === '01_Backlog' && <Layers className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.75} />}
              {col.id === '02_Por_Hacer' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />}
              {col.id === '03_En_Proceso' && <Zap className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />}
              {col.id === '04_Completado' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />}
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider truncate ${col.tituloColor}`}>
              {col.titulo}
            </span>
            {totalHorasStr && (
              <span className="font-mono tabular-nums text-[10px] text-slate-400 shrink-0" title={`Esfuerzo total estimado: ${totalHorasStr}`}>
                · {totalHorasStr}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-mono tabular-nums font-bold bg-slate-800/70 px-2 py-0.5 rounded-full text-slate-300 border border-slate-700/50">
              {cargandoDatosIniciales ? (
                <span className="inline-block w-4 h-3 bg-slate-700/60 rounded animate-pulse" />
              ) : (
                tareasColumna.length
              )}
            </span>
            <button
              type="button"
              onClick={() => onAbrirModalNuevaTarea(col.id)}
              className="w-6 h-6 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-700/60"
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
        className="kanban-col-body flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2 md:space-y-3 pr-1 custom-scrollbar pb-28 md:pb-8 [&::-webkit-scrollbar]:hidden"
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
                  layout="position"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.92,
                    height: 0,
                    marginTop: 0,
                    marginBottom: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    transition: {
                      type: 'spring',
                      stiffness: 500,
                      damping: 40,
                      mass: 1
                    }
                  }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="overflow-hidden"
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
