import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Crown, Calendar, ShieldCheck, AlertTriangle, AlertOctagon, FileText, TrendingUp } from 'lucide-react';
import type { ProyectoRecord } from '../../../types';

export interface NodoProyectoProps {
  data: {
    proyecto: ProyectoRecord;
    direccion: 'TB' | 'LR';
    notasCount?: number;
    ingresosTotal?: number;
    pctAvance?: number;
  };
}

export const NodoProyecto: React.FC<NodoProyectoProps> = memo(({ data }) => {
  const { proyecto, direccion, notasCount = 0, ingresosTotal = 0, pctAvance = 0 } = data;
  const esHorizontal = direccion === 'LR';

  const fIni = proyecto.fecha_inicio_plan ? String(proyecto.fecha_inicio_plan).split('T')[0] : '—';
  const fFin = proyecto.fecha_fin_plan ? String(proyecto.fecha_fin_plan).split('T')[0] : '—';
  const rangoFechas = `${fIni} → ${fFin}`;

  // Health status con Lucide
  const rawHealth = String(proyecto.health_status || '').toLowerCase();
  const esRiesgo = rawHealth.includes('amarillo') || rawHealth.includes('riesgo') || rawHealth.includes('warning');
  const esCritico = rawHealth.includes('rojo') || rawHealth.includes('critico') || rawHealth.includes('critical');

  const getHealthBadge = () => {
    if (esCritico) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
          <AlertOctagon className="w-3 h-3 text-rose-400" /> Crítico
        </span>
      );
    }
    if (esRiesgo) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 text-amber-400" /> Riesgo
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
        <ShieldCheck className="w-3 h-3 text-emerald-400" /> En Tiempo
      </span>
    );
  };

  return (
    <div className="relative w-[320px] h-[120px] rounded-2xl bg-[#0D1526]/95 backdrop-blur-md border border-slate-700/60 shadow-lg border-t-4 border-t-indigo-500 p-3 select-none flex flex-col justify-between overflow-hidden">
      {/* Target handle superior (para grafos recursivos) */}
      <Handle
        type="target"
        id="proy-top"
        position={esHorizontal ? Position.Left : Position.Top}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-slate-950"
      />

      {/* Header: Código + Corona + Salud */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9.5px] font-extrabold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
            {proyecto.codigo_legado || proyecto.id}
          </span>
          <span className="text-[9.5px] font-bold text-amber-400 flex items-center gap-1">
            <Crown className="w-3 h-3" /> PROYECTO MATRIZ
          </span>
        </div>
        {getHealthBadge()}
      </div>

      {/* Nombre del Proyecto */}
      <h3
        className="font-black text-slate-100 text-xs leading-snug truncate"
        title={proyecto.nombre_proyecto}
      >
        {proyecto.nombre_proyecto}
      </h3>

      {/* Fechas y Progreso */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800 text-[10.5px]">
        <div className="flex items-center gap-1 text-slate-400">
          <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="font-mono text-[9.5px] tabular-nums">{rangoFechas}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {notasCount > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20"
              title={`${notasCount} notas vinculadas`}
            >
              <FileText className="w-2.5 h-2.5 text-purple-400" />
              <span className="font-mono tabular-nums">{notasCount}</span>
            </span>
          )}

          {ingresosTotal > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono tabular-nums"
              title={`Ingresos: PEN ${ingresosTotal.toLocaleString()}`}
            >
              <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
              <span>PEN {ingresosTotal.toLocaleString()}</span>
            </span>
          )}

          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, pctAvance))}%` }}
              />
            </div>
            <span className="font-mono font-bold text-indigo-400 text-[11px] tabular-nums">
              {pctAvance}%
            </span>
          </div>
        </div>
      </div>

      {/* Source handle inferior */}
      <Handle
        type="source"
        id="proy-bottom"
        position={esHorizontal ? Position.Right : Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-slate-950"
      />
    </div>
  );
});
