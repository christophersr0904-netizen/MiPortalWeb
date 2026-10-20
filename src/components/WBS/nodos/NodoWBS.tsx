import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodoCalculadoCPM } from '../../../types';
import { Clock, CheckCircle2, Circle, Flame, Gem, BarChart2 } from 'lucide-react';

export interface NodoWBSProps {
  data: {
    nodo: NodoCalculadoCPM;
    direccion: 'TB' | 'LR';
    mostrarGastos?: boolean;
    gastoTotal?: number;
    tareasCount?: number;
    notasCount?: number;
  };
}

export const NodoWBS: React.FC<NodoWBSProps> = memo(({ data }) => {
  const { nodo, direccion, gastoTotal = 0, tareasCount = 0 } = data;
  const esHorizontal = direccion === 'LR';

  const esHito = nodo.tipo === 'HITO_MARCADOR';
  const esCritico = nodo.esCritico || (nodo.holguraTotal !== undefined && nodo.holguraTotal <= 0.0001);
  const esEnCurso = nodo.estado === '02_En_Progreso';
  const esCompletado = nodo.estado === '03_Completado';

  const getSemanticBorder = () => {
    if (esCritico) {
      return 'border-rose-500/70 shadow-md border-t-4 border-t-rose-500 bg-rose-950/25';
    }
    if (esHito) {
      return 'border-purple-500/60 shadow-md border-t-4 border-t-indigo-500 bg-purple-950/25';
    }
    if (esEnCurso) {
      return 'border-sky-500/70 shadow-md border-t-4 border-t-sky-500 bg-sky-950/20';
    }
    if (esCompletado) {
      return 'border-emerald-500/60 shadow-md border-t-4 border-t-emerald-500 bg-emerald-950/20';
    }
    return 'border-slate-700/60 hover:border-slate-600 shadow-md border-t-4 border-t-slate-600 bg-[#0D1526]/95';
  };

  const getEstadoBadge = () => {
    if (esCritico) {
      return (
        <span className="flex items-center gap-0.5 text-[9px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/40">
          <Flame className="w-2.5 h-2.5 text-rose-400" /> Crítico
        </span>
      );
    }
    if (esCompletado) {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          <CheckCircle2 className="w-2.5 h-2.5" /> Hecho
        </span>
      );
    }
    if (esEnCurso) {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
          <Clock className="w-2.5 h-2.5" /> En Curso
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
        <Circle className="w-2.5 h-2.5" /> Pendiente
      </span>
    );
  };

  return (
    <div
      className={`relative w-[240px] h-[120px] rounded-xl backdrop-blur-md transition-all duration-200 border p-2.5 select-none flex flex-col justify-between overflow-hidden ${getSemanticBorder()}`}
    >
      {/* Handle Target (Superior en TB) */}
      <Handle
        type="target"
        id="wbs-top"
        position={esHorizontal ? Position.Left : Position.Top}
        className={`!w-3 !h-3 !border-2 ${
          esCritico ? '!bg-amber-400 !border-slate-950' : '!bg-sky-400 !border-slate-950'
        }`}
      />

      {/* Header: Código WBS + Código Legado + Badge Semántico */}
      <div className="flex items-center justify-between gap-1 border-b border-slate-800/80 pb-1">
        <div className="flex items-center gap-1">
          <span
            className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              esHito
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
            }`}
          >
            {esHito ? <Gem className="w-2.5 h-2.5" /> : null}
            WBS {nodo.wbsCode || '—'}
          </span>
          <span className="text-[10px] font-mono text-slate-400 font-semibold">{nodo.codigo}</span>
        </div>

        {getEstadoBadge()}
      </div>

      {/* Título del Elemento (1-2 líneas truncadas con ellipsis) */}
      <div className="my-0.5 flex-1 flex flex-col justify-center">
        <h4
          className="text-xs font-bold text-slate-100 line-clamp-2 leading-tight"
          title={nodo.nombre}
        >
          {nodo.nombre}
        </h4>
      </div>

      {/* Footer: Progreso %, Duración y Costo Acumulado */}
      <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9.5px] font-mono tabular-nums leading-none">
        <div className="flex items-center gap-1 text-slate-400">
          <BarChart2 className="w-3 h-3 text-sky-400 shrink-0" />
          <span className="text-slate-200 font-bold">{Math.round(nodo.pesoPct * 100)}%</span>
          <span>•</span>
          <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
          <span>{esHito ? '0d' : `${nodo.duracion}d`}</span>
          {tareasCount > 0 && <span className="text-slate-400">({tareasCount}t)</span>}
        </div>

        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          PEN {Number(gastoTotal).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>

      {/* Handle Source (Inferior en TB) */}
      <Handle
        type="source"
        id="wbs-bottom"
        position={esHorizontal ? Position.Right : Position.Bottom}
        className={`!w-3 !h-3 !border-2 ${
          esCritico ? '!bg-amber-400 !border-slate-950' : '!bg-sky-400 !border-slate-950'
        }`}
      />
    </div>
  );
});
