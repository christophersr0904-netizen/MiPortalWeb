import React, { memo } from 'react';
import { Check, Edit3, Trash2 } from 'lucide-react';
import { formatearFechaDdMmYyyy } from '../../utils/timeFormatters';

export interface TransaccionUnificada {
  id: string;
  tipo: 'INGRESO' | 'GASTO';
  codigo: string;
  fecha: string;
  descripcion: string;
  categoria: string;
  montoPen: number;
  estado: string;
  esConciliado: boolean;
  raw: any;
}

export interface TarjetaTransaccionProps {
  trx: TransaccionUnificada;
  onToggleConciliar: (trx: TransaccionUnificada) => void;
  onEditar?: (trx: TransaccionUnificada) => void;
  onEliminar?: (trx: TransaccionUnificada) => void;
}

const TarjetaTransaccionComponent: React.FC<TarjetaTransaccionProps> = ({
  trx,
  onToggleConciliar,
  onEditar,
  onEliminar
}) => {
  const esIngreso = trx.tipo === 'INGRESO';

  return (
    <div
      id={`tarjeta-trx-${trx.id}`}
      className="p-4 rounded-2xl bg-[#0D1526] border border-slate-800/60 hover:border-slate-700/80 shadow-cobalt-1 flex flex-col justify-between transform-gpu transition-[transform,opacity,border-color] duration-150 will-change-[transform,opacity] hover:translate-y-[-2px] group relative text-slate-100"
    >
      <div>
        {/* Cabecera: Micro-píldora de código, fecha y Micro-LED de Estado (Ley del Silencio Visual) */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-md border ${
                esIngreso
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {trx.codigo}
            </span>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums">
              {formatearFechaDdMmYyyy(trx.fecha)}
            </span>
          </div>

          {/* Micro-LED Orgánico con Tooltip Nativo (Sin texto invasivo) */}
          <div className="flex items-center gap-2">
            <span
              title={`Estado: ${trx.estado} (${trx.esConciliado ? 'Conciliado en Tesorería' : 'Pendiente / Programado'})`}
              className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                trx.esConciliado
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                  : 'bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse'
              }`}
            />
          </div>
        </div>

        {/* Descripción & Categoría */}
        <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-relaxed">
          {trx.descripcion}
        </h4>
        <span className="text-[11px] text-slate-400 mt-1 block font-medium">
          {trx.categoria}
        </span>
      </div>

      {/* Footer: Importe con font-mono tabular-nums y Acciones */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
        <div
          className={`font-mono tabular-nums font-black text-sm tracking-tight ${
            esIngreso ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {esIngreso ? '+' : '-'}S/ {trx.montoPen.toFixed(2)}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Botones secundarios revelados en hover suave */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {onEditar && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditar(trx);
                }}
                title="Editar movimiento"
                className="p-1 text-slate-400 hover:text-sky-400 rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            )}
            {onEliminar && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminar(trx);
                }}
                title="Eliminar movimiento (Deshacer disponible)"
                className="p-1 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            )}
          </div>

          {/* Botón de Conciliación en 1 clic */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleConciliar(trx);
            }}
            title={trx.esConciliado ? 'Marcar como pendiente' : 'Conciliar movimiento'}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95 ${
              trx.esConciliado
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
            }`}
          >
            <Check className="w-3 h-3" strokeWidth={1.75} />
            <span className="text-[11px] font-mono">{trx.esConciliado ? 'Conciliado' : 'Conciliar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function areTrxPropsEqual(
  prevProps: TarjetaTransaccionProps,
  nextProps: TarjetaTransaccionProps
): boolean {
  return (
    prevProps.trx.id === nextProps.trx.id &&
    prevProps.trx.montoPen === nextProps.trx.montoPen &&
    prevProps.trx.esConciliado === nextProps.trx.esConciliado &&
    prevProps.trx.estado === nextProps.trx.estado &&
    prevProps.trx.fecha === nextProps.trx.fecha &&
    prevProps.trx.descripcion === nextProps.trx.descripcion &&
    prevProps.trx.categoria === nextProps.trx.categoria &&
    prevProps.trx.tipo === nextProps.trx.tipo
  );
}

export const TarjetaTransaccion = memo(TarjetaTransaccionComponent, areTrxPropsEqual);

