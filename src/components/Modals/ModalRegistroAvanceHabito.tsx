import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, PlusCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export interface ModalRegistroAvanceHabitoProps {
  isOpen: boolean;
  titulo: string;
  unidadMedida?: string;
  valorActual?: number;
  metaTotal?: number;
  rescateMinimo?: number;
  onRegistrar: (cantidad: number) => Promise<void>;
  onClose: () => void;
}

export const ModalRegistroAvanceHabito: React.FC<ModalRegistroAvanceHabitoProps> = ({
  isOpen,
  titulo,
  unidadMedida = 'unidades',
  valorActual = 0,
  metaTotal = 0,
  rescateMinimo = 0,
  onRegistrar,
  onClose
}) => {
  useBodyScrollLock(isOpen);

  const [cantidad, setCantidad] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCantidad('');
      setErrorLocal(null);
      setGuardando(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Listener para atajo Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseFloat(cantidad);
    if (isNaN(val) || val <= 0) {
      setErrorLocal('Ingresa una cantidad numérica mayor a 0');
      return;
    }

    try {
      setGuardando(true);
      setErrorLocal(null);
      await onRegistrar(val);
      onClose();
    } catch (err: any) {
      setErrorLocal(err?.message || 'Error al registrar el avance');
    } finally {
      setGuardando(false);
    }
  };

  const aplicarIncrementoRapido = (inc: number) => {
    const act = parseFloat(cantidad) || 0;
    setCantidad(String(act + inc));
    setErrorLocal(null);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-avance-titulo"
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[92dvh] rounded-t-3xl sm:rounded-2xl bg-[#0D1526] border-t sm:border border-slate-700/60 shadow-[0_10px_35px_-5px_rgba(2,6,23,0.8),0_0_20px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2 sm:hidden flex-shrink-0" />

        {/* Header Bento */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <PlusCircle className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 id="modal-avance-titulo" className="text-sm font-bold text-slate-100 truncate max-w-[260px]">
                Registrar Avance
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
                {titulo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Micro-banner de Error */}
          {errorLocal && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorLocal}</span>
            </div>
          )}

          {/* Métricas actuales */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">Acumulado Actual</span>
              <span className="text-sm font-bold text-cyan-300 font-mono tabular-nums">
                {valorActual} {unidadMedida}
              </span>
              {metaTotal > 0 && (
                <span className="text-[10px] text-slate-500 block">de {metaTotal} {unidadMedida}</span>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">Rescate Mínimo</span>
              <span className="text-sm font-bold text-amber-300 font-mono tabular-nums">
                {rescateMinimo > 0 ? `≥ ${rescateMinimo} ${unidadMedida}` : 'Sin umbral'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {rescateMinimo > 0 ? 'Salva racha diaria' : 'Suma regular'}
              </span>
            </div>
          </div>

          {/* Campo de Entrada Numérica */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cantidad a Sumar ({unidadMedida})
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                step="any"
                min="0.01"
                value={cantidad}
                onChange={(e) => {
                  setCantidad(e.target.value);
                  setErrorLocal(null);
                }}
                placeholder={`0.00 ${unidadMedida}`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040711] border border-slate-700/80 text-white font-mono tabular-nums font-bold text-base focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-3 text-xs font-mono font-bold text-slate-400 select-none">
                {unidadMedida}
              </span>
            </div>
          </div>

          {/* Atajos de Incremento Rápido */}
          <div>
            <span className="text-[10.5px] font-medium text-slate-400 block mb-1.5">Incrementos rápidos:</span>
            <div className="flex items-center gap-2">
              {[1, 5, 10, 25].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => aplicarIncrementoRapido(inc)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-mono tabular-nums font-semibold transition active:scale-95 cursor-pointer"
                >
                  +{inc}
                </button>
              ))}
              {rescateMinimo > 0 && (
                <button
                  type="button"
                  onClick={() => setCantidad(String(rescateMinimo))}
                  className="ml-auto px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 text-xs font-mono tabular-nums font-bold transition active:scale-95 flex items-center gap-1 cursor-pointer"
                  title={`Fijar avance al mínimo de rescate (${rescateMinimo})`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Rescate ({rescateMinimo})</span>
                </button>
              )}
            </div>
          </div>

          </div>

          {/* Acciones */}
          <div className="sticky bottom-0 shrink-0 bg-[#0D1526]/95 backdrop-blur-md p-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-500 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{guardando ? 'Guardando...' : 'Registrar Avance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

