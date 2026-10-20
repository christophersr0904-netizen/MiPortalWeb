import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Tag, ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import type { GastoRecord } from '../../../types';

export interface NodoGastoProps {
  data: {
    gasto: GastoRecord;
    direccion: 'TB' | 'LR';
  };
}

export const NodoGasto: React.FC<NodoGastoProps> = memo(({ data }) => {
  const { gasto, direccion } = data;
  const esHorizontal = direccion === 'LR';

  const monto = gasto.monto_pen || gasto.monto_original || 0;
  const esPagado = String(gasto.estado_pago || '').toUpperCase().includes('PAGADO');

  return (
    <div className="relative w-[180px] h-[60px] rounded-xl bg-[#0D1526]/95 backdrop-blur-md border border-slate-700/60 border-t-2 border-t-amber-500/80 p-1.5 select-none shadow-md flex flex-col justify-between overflow-hidden">
      {/* Target handle superior (desde Tarea o WP) */}
      <Handle
        type="target"
        id="gasto-top"
        position={esHorizontal ? Position.Left : Position.Top}
        className="!w-2 !h-2 !bg-amber-400 !border-2 !border-slate-950"
      />

      {/* Header: Código + Monto PEN */}
      <div className="flex items-center justify-between gap-1 leading-none">
        <span className="font-mono text-[8.5px] font-bold bg-amber-500/10 text-amber-300 px-1 py-0.2 rounded border border-amber-500/20">
          {gasto.codigo_legado || gasto.id}
        </span>
        <span className="font-mono tabular-nums text-[9.5px] font-bold text-emerald-400">
          PEN {Number(monto).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Descripción del Gasto */}
      <div
        className="font-medium text-slate-200 text-[10px] leading-tight truncate my-0.2"
        title={gasto.descripcion_gasto}
      >
        {gasto.descripcion_gasto || 'Gasto Operativo'}
      </div>

      {/* Footer: Categoría + Estado + Comprobante */}
      <div className="flex items-center justify-between pt-0.5 border-t border-slate-800 text-[8.5px] text-slate-400 leading-none">
        <span className="flex items-center gap-0.5 truncate max-w-[100px]">
          <Tag className="w-2 h-2 text-slate-500" />
          {gasto.categoria_gasto || 'General'}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {gasto.comprobante_url && (
            <a
              href={gasto.comprobante_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
              title="Ver comprobante en Google Drive"
            >
              <ExternalLink className="w-2 h-2" />
            </a>
          )}
          <span
            className={`flex items-center gap-0.5 px-1 py-0.2 rounded font-semibold ${
              esPagado
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}
          >
            {esPagado ? <CheckCircle2 className="w-2 h-2" /> : <Clock className="w-2 h-2" />}
            {esPagado ? 'Pag' : 'Pend'}
          </span>
        </div>
      </div>
    </div>
  );
});
