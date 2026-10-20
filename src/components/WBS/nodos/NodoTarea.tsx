import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock, CheckCircle2, Circle, Zap, User, FileText, Archive } from 'lucide-react';
import type { TareaRecord } from '../../../types';

export interface NodoTareaProps {
  data: {
    tarea: TareaRecord;
    esCritica?: boolean;
    isCriticalFocused?: boolean;
    soloRutaCritica?: boolean;
    direccion: 'TB' | 'LR';
    notasCount?: number;
  };
}

export const NodoTarea: React.FC<NodoTareaProps> = memo(({ data }) => {
  const {
    tarea,
    esCritica = false,
    isCriticalFocused = false,
    soloRutaCritica = false,
    direccion,
    notasCount = 0
  } = data;
  const esHorizontal = direccion === 'LR';

  const estado = String(tarea.estado_tarea || '').toLowerCase();
  const esDone = estado.includes('04_') || estado.includes('completad');
  const esArch = estado.includes('05_') || estado.includes('archiv');
  const esProg = estado.includes('03_') || estado.includes('proceso');

  const getBorderTop = () => {
    if (isCriticalFocused) {
      return 'border-2 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.7)] bg-[#0D1526] ring-1 ring-amber-400 z-50';
    }
    if (esCritica) return 'border-t-4 border-t-amber-500 shadow-md ring-1 ring-amber-500/40 bg-amber-950/20';
    if (esDone) return 'border-t-4 border-t-emerald-500 bg-emerald-950/15';
    if (esProg) return 'border-t-4 border-t-sky-500 bg-sky-950/15';
    if (esArch) return 'border-t-4 border-t-slate-600 opacity-75';
    return 'border-t-4 border-t-slate-700';
  };

  const getEstadoBadge = () => {
    if (esArch) {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
          <Archive className="w-2.5 h-2.5" /> Archivado
        </span>
      );
    }
    if (esDone) {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          <CheckCircle2 className="w-2.5 h-2.5" /> Hecho
        </span>
      );
    }
    if (esProg) {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
          <Clock className="w-2.5 h-2.5" /> Proceso
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
        <Circle className="w-2.5 h-2.5" /> Por Hacer
      </span>
    );
  };

  const prio = String(tarea.prioridad_eisenhower || '').toUpperCase();
  const esAltaPrio = prio.includes('P1') || prio.includes('ALTA') || prio.includes('URGENTE');
  const mostrarBadgeCritica = esCritica || isCriticalFocused;

  return (
    <div
      className={`relative w-[220px] h-[90px] rounded-xl p-2 select-none transition-all flex flex-col justify-between overflow-hidden ${
        isCriticalFocused
          ? '!opacity-100 !border-2 !border-sky-400 !shadow-[0_0_25px_rgba(56,189,248,0.7)] bg-[#0D1526] ring-1 ring-amber-400 z-50'
          : soloRutaCritica
          ? '!opacity-20 grayscale pointer-events-none bg-[#0D1526]/90 border border-slate-700/40'
          : `bg-[#0D1526]/95 backdrop-blur-md border border-slate-700/60 ${getBorderTop()}`
      }`}
    >
      {/* Target handle superior (desde WP padre en TB) */}
      <Handle
        type="target"
        id="tar-top"
        position={esHorizontal ? Position.Left : Position.Top}
        className={`!w-2.5 !h-2.5 !border-2 !border-slate-950 ${
          mostrarBadgeCritica ? '!bg-amber-400' : '!bg-slate-400'
        }`}
      />

      {/* Target handle lateral izquierdo (para dependencias horizontales entre tareas) */}
      <Handle
        type="target"
        id="tar-left"
        position={Position.Left}
        className={`!w-2 !h-2 !border-2 !border-slate-950 ${
          mostrarBadgeCritica ? '!bg-amber-400' : '!bg-indigo-400'
        }`}
      />

      {/* Header: Código + Crítica + Estado */}
      <div className="flex items-center justify-between gap-1 leading-none">
        <div className="flex items-center gap-1">
          <span className="font-mono text-[8.5px] font-bold bg-slate-800 text-slate-300 px-1 py-0.2 rounded border border-slate-700">
            {tarea.codigo_legado || tarea.id}
          </span>
          {mostrarBadgeCritica && (
            <span className="flex items-center gap-0.5 text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-xs">
              <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> Crítica
            </span>
          )}
        </div>
        {getEstadoBadge()}
      </div>

      {/* Título de la Tarea (1 línea limpia truncada) */}
      <div
        className="font-semibold text-slate-200 text-[11px] leading-tight truncate my-0.5"
        title={tarea.nombre_tarea_actividad}
      >
        {tarea.nombre_tarea_actividad}
      </div>

      {/* Footer: Responsable, Prioridad, Horas */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[9.5px] text-slate-400 leading-none">
        <div className="flex items-center gap-1 truncate max-w-[125px]">
          <span
            className={`text-[8px] font-bold px-1 py-0.2 rounded border ${
              esAltaPrio
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {esAltaPrio ? 'Alta' : 'Media'}
          </span>
          {tarea.responsable_ejecutor && (
            <span className="flex items-center gap-0.5 truncate text-slate-400 font-mono text-[9px]">
              <User className="w-2.5 h-2.5 text-slate-500" />
              {tarea.responsable_ejecutor}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {notasCount > 0 && (
            <span className="flex items-center gap-0.5 text-[8.5px] font-bold px-1 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono tabular-nums">
              <FileText className="w-2 h-2 text-purple-400" />
              {notasCount}
            </span>
          )}
          <span className="flex items-center gap-0.5 font-mono text-[9px] text-slate-300 tabular-nums">
            <Clock className="w-2.5 h-2.5 text-slate-500" />
            {tarea.horas_estimadas || 1}h
          </span>
        </div>
      </div>

      {/* Source handle lateral derecho (para dependencias horizontales hacia tareas sucesoras) */}
      <Handle
        type="source"
        id="tar-right"
        position={Position.Right}
        className={`!w-2 !h-2 !border-2 !border-slate-950 ${
          esCritica ? '!bg-amber-400' : '!bg-indigo-400'
        }`}
      />

      {/* Source handle inferior (hacia gastos hijos en TB) */}
      <Handle
        type="source"
        id="tar-bottom"
        position={esHorizontal ? Position.Right : Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-slate-950"
      />
    </div>
  );
});
