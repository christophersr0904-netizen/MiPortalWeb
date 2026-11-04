import React, { memo } from 'react';
import type { CanonicalTarea } from '../../utils/entityNormalizer';
import type { SubtareaPaso } from '../../types';
import { BadgeNotasVinculadas } from '../Notas/BadgeNotasVinculadas';
import {
  Zap,
  CornerDownRight,
  AlertTriangle,
  Archive,
  Trash2,
  Lock,
  CheckCircle2,
  Calendar,
  Clock,
  RotateCcw,
  Check,
  HeartPulse,
  GraduationCap,
  Coffee,
  Activity
} from 'lucide-react';

export interface TarjetaTareaKanbanProps {
  tar: CanonicalTarea;
  colId: string;
  isDragged: boolean;
  isHovered: boolean;
  isPredecesora: boolean;
  isSucesora: boolean;
  atenuar: boolean;
  predecesorasOcultas: string[];
  sucesorasOcultas: string[];
  subsTarea: SubtareaPaso[];
  nombreProyecto: string;
  nombreHito: string;
  costoGasto: number;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onMouseEnter: (codigo: string) => void;
  onMouseLeave: () => void;
  onClick: (id: string, estado: string) => void;
  onMoverTareaAEstado: (tar: CanonicalTarea, nuevoEstado: string) => void;
  onArchivarTarea: (tar: CanonicalTarea) => void;
  onEliminarTarea: (id: string, nombre: string) => void;
}

const TarjetaTareaKanbanComponent: React.FC<TarjetaTareaKanbanProps> = ({
  tar,
  colId,
  isDragged,
  isHovered,
  isPredecesora,
  isSucesora,
  atenuar,
  predecesorasOcultas,
  sucesorasOcultas,
  subsTarea,
  nombreProyecto,
  nombreHito,
  costoGasto,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onMoverTareaAEstado,
  onArchivarTarea,
  onEliminarTarea
}) => {
  // Subtareas y porcentaje de avance
  const totalSubs = subsTarea.length;
  const completadasSubs = subsTarea.filter((s) => s.completado).length;
  const pctSubs = totalSubs > 0 ? Math.round((completadasSubs / totalSubs) * 100) : 0;

  // Franja lateral de prioridad
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

  // Vencimiento y formateo
  const hoyIso = new Date().toISOString().split('T')[0];
  const estaVencida = Boolean(
    tar.fecha_programada &&
    tar.fecha_programada.split('T')[0] < hoyIso &&
    tar.estado !== '04_Completado'
  );

  const formatFechaDDMMYYYY = (fechaIso?: string) => {
    if (!fechaIso) return 'Sin fecha';
    const clean = fechaIso.split('T')[0];
    const partes = clean.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return clean;
  };

  const rawDep = String(tar.raw?.id_dependencia || tar.raw?.ID_Dependencia || '').trim();
  const tieneDep = Boolean(rawDep && !rawDep.includes('@google.com'));
  const costoTotalPen = costoGasto > 0 ? costoGasto : (tar.costo_real || Number(tar.raw?.costo_real_pen || tar.raw?.Costo_Real_PEN || 0));

  return (
    <div
      id={`kanban-card-${tar.codigo_legado}`}
      data-id-tarea={tar.codigo_legado}
      data-task-id={tar.id}
      draggable={true}
      onDragStart={(e) => onDragStart(e, tar.id)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => onMouseEnter(tar.codigo_legado)}
      onMouseLeave={onMouseLeave}
      onClick={() => onClick(tar.id, tar.estado)}
      className={`kanban-card group relative p-3.5 pl-4 rounded-xl border border-slate-800/80 bg-[#0D1526]/90 hover:bg-[#0D1526] hover:border-slate-700 hover:shadow-[0_8px_25px_rgba(2,6,23,0.7),0_0_15px_rgba(56,189,248,0.08)] hover:-translate-y-0.5 active:scale-[0.985] transition-[transform,box-shadow,border-color,background-color] duration-150 ease-out cursor-grab active:cursor-grabbing select-none text-xs space-y-2.5 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150 ${
        isDragged
          ? 'opacity-40 scale-[1.02] rotate-1 border-dashed border-sky-400/90 ring-2 ring-sky-500/50 shadow-[0_20px_35px_-10px_rgba(2,6,23,0.9)] cursor-grabbing'
          : ''
      } ${
        atenuar ? 'kanban-card-atenuada opacity-60' : ''
      } ${
        isPredecesora ? 'kanban-card-predecesora' : ''
      } ${
        isSucesora ? 'kanban-card-sucesora' : ''
      }`}
    >
      {/* Franja lateral izquierda continua de prioridad */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorBarraPrioridad} rounded-l-xl transition-transform duration-150 ease-out origin-left group-hover:scale-x-125 pointer-events-none`}
      />

      {/* Badges de relación para dependencias */}
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

      {/* Alerta discreta para Predecesoras o Sucesoras Ocultas por Filtro */}
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

      {/* 2. Cabecera Minimalista: Código TAR-XXX y Micro-icono de energía */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-xs text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/60 font-medium shrink-0">
            {tar.codigo_legado}
          </span>

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
              onArchivarTarea(tar);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition-colors duration-100 cursor-pointer"
            title="Archivar tarea"
          >
            <Archive className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEliminarTarea(tar.id, tar.nombre);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors duration-100 cursor-pointer"
            title="Eliminar tarea"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* 3. Título de la tarea */}
      <h4
        className={`text-sm font-semibold text-slate-100 line-clamp-2 mt-1 cursor-pointer hover:text-indigo-300 transition ${
          tar.estado === '04_Completado' ? 'line-through text-slate-400' : ''
        }`}
        title={tar.nombre}
      >
        {tar.nombre}
      </h4>

      {/* 4. Dependencias y Costo */}
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

      {/* 5. Subtareas y Horas */}
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
        {colId === '01_Backlog' && (
          <button
            type="button"
            onClick={() => onMoverTareaAEstado(tar, '02_Por_Hacer')}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-indigo-950/40 text-indigo-300 border border-slate-700/60 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="Mover a Por Hacer"
          >
            <span className="tracking-wide">A Por Hacer</span>
            <span className="font-bold">→</span>
          </button>
        )}

        {colId === '02_Por_Hacer' && (
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => onMoverTareaAEstado(tar, '01_Backlog')}
              className="h-7 px-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/40 text-xs font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer"
              title="Retroceder a Backlog"
            >
              <span>←</span>
              <span>Backlog</span>
            </button>
            <button
              type="button"
              onClick={() => onMoverTareaAEstado(tar, '03_En_Proceso')}
              className="h-7 flex-1 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Iniciar tarea (Mover a En Proceso)"
            >
              <span className="tracking-wide">Iniciar</span>
              <Zap className="w-3 h-3 text-amber-300" />
              <span className="font-bold">→</span>
            </button>
          </div>
        )}

        {colId === '03_En_Proceso' && (
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => onMoverTareaAEstado(tar, '02_Por_Hacer')}
              className="h-7 px-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/40 text-xs font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer"
              title="Retroceder a Por Hacer"
            >
              <span>←</span>
              <span>Por Hacer</span>
            </button>
            <button
              type="button"
              onClick={() => onMoverTareaAEstado(tar, '04_Completado')}
              className="h-7 flex-1 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Finalizar tarea (Mover a Completado)"
            >
              <span className="tracking-wide">Completar</span>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
            </button>
          </div>
        )}

        {colId === '04_Completado' && (
          <button
            type="button"
            onClick={() => onMoverTareaAEstado(tar, '03_En_Proceso')}
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
};

export const TarjetaTareaKanban = memo(TarjetaTareaKanbanComponent);

