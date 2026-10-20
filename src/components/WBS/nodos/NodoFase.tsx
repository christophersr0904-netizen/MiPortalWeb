import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Layers, CheckSquare } from 'lucide-react';

export interface NodoFaseProps {
  data: {
    id: string;
    nombreFase: string;
    pesoPct: number;
    numWP: number;
    numMarcadores: number;
    numTareasTotal: number;
    direccion: 'TB' | 'LR';
  };
}

export const NodoFase: React.FC<NodoFaseProps> = memo(({ data }) => {
  const { nombreFase, pesoPct = 0, numWP = 0, numMarcadores = 0, numTareasTotal = 0, direccion } = data;
  const esHorizontal = direccion === 'LR';

  return (
    <div className="relative w-[220px] h-[80px] rounded-2xl bg-[#0D1526]/95 backdrop-blur-md border border-slate-700/60 shadow-md border-t-4 border-t-violet-500 p-2 select-none flex flex-col justify-between overflow-hidden">
      {/* Target handle de entrada superior (N0 Proyecto -> N1 Fase en TB) */}
      <Handle
        type="target"
        id="fase-top"
        position={esHorizontal ? Position.Left : Position.Top}
        className="!w-3 !h-3 !bg-violet-400 !border-2 !border-slate-950"
      />

      {/* Handles laterales para secuencia horizontal inter-fases (punteada) */}
      <Handle
        type="target"
        id="fase-left"
        position={Position.Left}
        className="!w-2 !h-2 !bg-violet-400 !border-2 !border-slate-950"
      />
      <Handle
        type="source"
        id="fase-right"
        position={Position.Right}
        className="!w-2 !h-2 !bg-violet-400 !border-2 !border-slate-950"
      />

      {/* Header: Nivel 1 • Fase + Ponderación */}
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[8.5px] font-extrabold uppercase px-1 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
          <Layers className="w-2.5 h-2.5" /> Nivel 1 • Fase
        </span>
        <span className="text-[9.5px] font-mono tabular-nums font-bold text-violet-300 bg-violet-500/10 px-1 py-0.2 rounded border border-violet-500/20">
          {pesoPct}%
        </span>
      </div>

      {/* Nombre de la Fase */}
      <h4
        className="font-black text-slate-100 text-xs leading-none truncate"
        title={nombreFase}
      >
        {nombreFase}
      </h4>

      {/* Footer: Métricas consolidadas */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[9.5px] text-slate-400 leading-none">
        <span className="font-mono tabular-nums">
          {numWP} WP • {numMarcadores} Hitos
        </span>
        <span className="font-bold text-violet-400 font-mono tabular-nums flex items-center gap-0.5">
          <CheckSquare className="w-2.5 h-2.5" />
          {numTareasTotal} {numTareasTotal === 1 ? 'tar' : 'tars'}
        </span>
      </div>

      {/* Source handle de salida inferior (N1 Fase -> N2 WP en TB) */}
      <Handle
        type="source"
        id="fase-bottom"
        position={esHorizontal ? Position.Right : Position.Bottom}
        className="!w-3 !h-3 !bg-violet-400 !border-2 !border-slate-950"
      />
    </div>
  );
});
