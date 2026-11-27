import React, { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CanonicalProyecto, CanonicalTarea } from '../../utils/entityNormalizer';
import type { HitoWbsRecord, SubtareaPaso } from '../../types';
import { TarjetaTareaKanban } from './TarjetaTareaKanban';
import { Layers, CheckCircle2, Zap, Plus, X, ExternalLink } from 'lucide-react';

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
  proyectosMap: Map<string, CanonicalProyecto>;
  hitosMap: Map<string, HitoWbsRecord>;
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
  onCrearTareaRapida?: (titulo: string, estadoColumna: string) => Promise<boolean>;
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
  onAbrirModalNuevaTarea,
  onCrearTareaRapida
}) => {
  // Estado de captura rápida inline en la parte superior de la columna (REQ-UX-KANBAN-03)
  const [creacionInlineAbierta, setCreacionInlineAbierta] = useState(false);
  const [tituloRapido, setTituloRapido] = useState('');
  const [guardandoRapido, setGuardandoRapido] = useState(false);
  const inputRapidoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creacionInlineAbierta) {
      inputRapidoRef.current?.focus();
    }
  }, [creacionInlineAbierta]);

  const abrirCapturaColumna = () => {
    if (onCrearTareaRapida) {
      setCreacionInlineAbierta(true);
    } else {
      onAbrirModalNuevaTarea(col.id);
    }
  };

  const cerrarCapturaInline = () => {
    setCreacionInlineAbierta(false);
    setTituloRapido('');
  };

  const handleSubmitRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCrearTareaRapida || !tituloRapido.trim() || guardandoRapido) return;
    setGuardandoRapido(true);
    const ok = await onCrearTareaRapida(tituloRapido, col.id);
    setGuardandoRapido(false);
    if (ok) {
      setTituloRapido('');
      setCreacionInlineAbierta(false);
    }
  };

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
        } flex-col rounded-xl border h-full min-h-0 w-full transition-colors duration-150 select-none ${isOverThisCol
          ? 'kanban-dropzone-active border-sky-400/50 bg-sky-500/[0.04] ring-1 ring-sky-400/20'
          : 'bg-slate-900/55 border-white/[0.10] shadow-sm'
        }`}
      onDragOver={(e) => onDragOver(e, col.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, col.id)}
    >
      {/* Cabecera de Columna con Presencia y Franja Superior Definida (REQ-UX-KANBAN-02B) */}
      <div className="px-3.5 py-2.5 bg-white/[0.03] border-b border-white/[0.08] rounded-t-xl shrink-0">
        <div className="hidden md:flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {col.id === '01_Backlog' && (
              <Layers className="w-4 h-4 text-slate-300 shrink-0" strokeWidth={1.9} aria-hidden="true" />
            )}
            {col.id === '02_Por_Hacer' && (
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.9} aria-hidden="true" />
            )}
            {col.id === '03_En_Proceso' && (
              <Zap className="w-4 h-4 text-amber-300 shrink-0" strokeWidth={1.9} aria-hidden="true" />
            )}
            {col.id === '04_Completado' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.9} aria-hidden="true" />
            )}

            <span className="text-[13px] font-semibold tracking-tight text-slate-100 truncate">
              {col.titulo}
            </span>

            <span className="bg-white/[0.08] text-slate-200 border border-white/[0.08] px-2 py-0.5 rounded-md font-mono tabular-nums text-[11px] font-medium leading-none shrink-0">
              {cargandoDatosIniciales ? (
                <span className="inline-block w-3 h-2.5 bg-slate-700/60 rounded animate-pulse" />
              ) : (
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={tareasColumna.length}
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                    transition={{ duration: 0.12 }}
                    className="inline-block font-mono tabular-nums"
                  >
                    {tareasColumna.length}
                  </motion.span>
                </AnimatePresence>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {totalHorasStr && (
              <span
                className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0"
                title={`Esfuerzo total estimado: ${totalHorasStr}`}
              >
                {totalHorasStr}
              </span>
            )}
            <button
              type="button"
              onClick={abrirCapturaColumna}
              className="h-6 w-6 rounded-md text-slate-300 hover:text-sky-300 hover:bg-sky-500/15 flex items-center justify-center transition-colors cursor-pointer"
              title={`Añadir tarea rápida a ${col.titulo}`}
              aria-label={`Añadir tarea a ${col.titulo}`}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.9} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Botón "+ Añadir" Compacto solo en móvil (REQ-UI-27) */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={abrirCapturaColumna}
            className="w-full h-9 py-1 px-3 border border-dashed border-white/[0.12] hover:border-sky-400/50 hover:bg-sky-500/10 text-slate-200 hover:text-sky-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
            aria-label={`Añadir tarea a ${col.titulo}`}
          >
            <Plus className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.9} aria-hidden="true" />
            <span>Añadir a {col.titulo}</span>
          </button>
        </div>
      </div>

      {/* Lista de Tarjetas Scrollable con Aire Vertical (space-y-3 p-3) */}
      <div
        id={`body-${col.domId}`}
        className="kanban-col-body flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3 custom-scrollbar pb-28 md:pb-8 [&::-webkit-scrollbar]:hidden"
      >
        {/* Tarjeta de Captura Rápida Inline (REQ-UX-KANBAN-03) */}
        {creacionInlineAbierta && (
          <form
            onSubmit={handleSubmitRapido}
            className="bg-[#151F32] border border-sky-500/40 rounded-xl p-2.5 shadow-md space-y-2"
          >
            <input
              ref={inputRapidoRef}
              type="text"
              autoFocus
              value={tituloRapido}
              onChange={(e) => setTituloRapido(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  cerrarCapturaInline();
                }
              }}
              placeholder="Título de la tarea..."
              className="w-full h-8 bg-white/[0.04] border border-white/[0.08] focus:border-sky-500/60 rounded-lg px-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
            />
            <div className="flex items-center justify-between gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  cerrarCapturaInline();
                  onAbrirModalNuevaTarea(col.id);
                }}
                className="text-[11px] font-medium text-slate-400 hover:text-sky-300 inline-flex items-center gap-1 transition cursor-pointer"
                title="Abrir formulario completo con más campos"
              >
                <ExternalLink className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                <span>Más detalles</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={cerrarCapturaInline}
                  className="h-6 w-6 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] flex items-center justify-center transition cursor-pointer"
                  aria-label="Cancelar captura rápida"
                  title="Cancelar (Esc)"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button
                  type="submit"
                  disabled={guardandoRapido || !tituloRapido.trim()}
                  className="h-6 px-2 rounded-md bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-medium inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-45"
                >
                  <span>{guardandoRapido ? 'Creando...' : 'Crear'}</span>
                  <kbd className="font-mono text-[10px] text-sky-300/75 leading-none">↵</kbd>
                </button>
              </div>
            </div>
          </form>
        )}

        {cargandoDatosIniciales ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-[#151F32]/70 rounded-xl border border-white/[0.07] h-28 p-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-2.5 w-1/3 bg-slate-700/60 rounded"></div>
                <div className="h-3.5 w-4/5 bg-slate-700/80 rounded"></div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                <div className="h-2.5 w-16 bg-slate-700/50 rounded"></div>
                <div className="h-2.5 w-12 bg-slate-700/50 rounded"></div>
              </div>
            </div>
            <div className="animate-pulse bg-[#151F32]/70 rounded-xl border border-white/[0.07] h-28 p-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-2.5 w-1/4 bg-slate-700/60 rounded"></div>
                <div className="h-3.5 w-3/4 bg-slate-700/80 rounded"></div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                <div className="h-2.5 w-20 bg-slate-700/50 rounded"></div>
                <div className="h-2.5 w-10 bg-slate-700/50 rounded"></div>
              </div>
            </div>
          </div>
        ) : tareasColumna.length === 0 && !creacionInlineAbierta ? (
          <div className="py-8 px-4 text-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.015]">
            {col.id === '01_Backlog' && (
              <Layers className="w-5 h-5 text-slate-600 mx-auto mb-2" strokeWidth={1.75} aria-hidden="true" />
            )}
            {col.id === '02_Por_Hacer' && (
              <CheckCircle2 className="w-5 h-5 text-slate-600 mx-auto mb-2" strokeWidth={1.75} aria-hidden="true" />
            )}
            {col.id === '03_En_Proceso' && (
              <Zap className="w-5 h-5 text-slate-600 mx-auto mb-2" strokeWidth={1.75} aria-hidden="true" />
            )}
            {col.id === '04_Completado' && (
              <CheckCircle2 className="w-5 h-5 text-slate-600 mx-auto mb-2" strokeWidth={1.75} aria-hidden="true" />
            )}
            <p className="text-xs text-slate-400">Sin tareas aquí</p>
            <button
              type="button"
              onClick={abrirCapturaColumna}
              className="mt-2.5 text-[11px] font-medium text-sky-300/90 hover:text-sky-200 hover:bg-sky-500/10 px-2.5 py-1 rounded-md inline-flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
              <span>Nueva tarea</span>
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {tareasColumna.map((tar) => {
              const subsTarea = subtareasPorTarea.get(tar.codigo_legado) || [];
              const proyectoIdRaw = typeof tar.raw?.proyecto_id === 'string' ? tar.raw.proyecto_id : undefined;
              const proyAsoc =
                (tar.proyecto_codigo ? proyectosMap.get(tar.proyecto_codigo) : undefined) ||
                (proyectoIdRaw ? proyectosMap.get(proyectoIdRaw) : undefined);
              const nombreProyecto = proyAsoc?.nombre || tar.proyecto_codigo || 'General';

              const hitoIdRaw = typeof tar.raw?.hito_id === 'string' ? tar.raw.hito_id : undefined;
              const hitoAsoc =
                (tar.hito_codigo ? hitosMap.get(tar.hito_codigo) : undefined) ||
                (hitoIdRaw ? hitosMap.get(hitoIdRaw) : undefined);
              const hitoExtra = hitoAsoc as (HitoWbsRecord & { nombre?: string; nombre_hito?: string }) | undefined;
              const nombreHito =
                hitoExtra?.nombre ||
                hitoExtra?.nombre_hito ||
                hitoExtra?.nombre_elemento ||
                tar.hito_codigo ||
                'Hito Principal';

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
