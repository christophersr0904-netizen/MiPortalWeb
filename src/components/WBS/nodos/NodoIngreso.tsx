import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { TrendingUp, CheckCircle2, Clock, Landmark } from 'lucide-react';
import type { IngresoRecord } from '../../../types';

export interface NodoIngresoProps {
  data: {
    ingreso: IngresoRecord;
    direccion: 'TB' | 'LR';
  };
}

export const NodoIngreso: React.FC<NodoIngresoProps> = memo(({ data }) => {
  const { ingreso, direccion } = data;
  const esHorizontal = direccion === 'LR';

  const monto = ingreso.monto_pen || ingreso.monto_original || 0;
  const esCobrado = String(ingreso.estado_cobro || '').toUpperCase().includes('COBRADO');

  return (
    <div className="relative w-[180px] rounded-xl bg-[#0D1526]/95 backdrop-blur-md border border-slate-700/60 border-t-4 border-t-emerald-500 p-2.5 select-none shadow-md">
      {/* Target handle superior (desde Proyecto) */}
      <Handle
        type="target"
        id="ingreso-top"
        position={esHorizontal ? Position.Left : Position.Top}
        className="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-slate-950"
      />

      {/* Header: Código + Monto PEN */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="font-mono text-[9px] font-bold bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20">
          {ingreso.codigo_legado || ingreso.id}
        </span>
        <span className="font-mono tabular-nums text-[10.5px] font-bold text-emerald-300 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          +PEN {Number(monto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Descripción del Ingreso */}
      <div
        className="font-medium text-slate-200 text-[11px] leading-tight line-clamp-1 mb-1.5"
        title={ingreso.descripcion_ingreso}
      >
        {ingreso.descripcion_ingreso || 'Ingreso / Facturación'}
      </div>

      {/* Footer: Categoría / Cuenta + Estado */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[9px] text-slate-400">
        <span className="flex items-center gap-1 truncate max-w-[120px]">
          <Landmark className="w-2.5 h-2.5 text-slate-500" />
          {ingreso.categoria_ingreso || 'Honorarios'}
        </span>

        <span
          className={`flex items-center gap-0.5 px-1 py-0.2 rounded font-semibold ${
            esCobrado
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
          }`}
        >
          {esCobrado ? <CheckCircle2 className="w-2 h-2" /> : <Clock className="w-2 h-2" />}
          {esCobrado ? 'Cobrado' : 'Pendiente'}
        </span>
      </div>
    </div>
  );
});
