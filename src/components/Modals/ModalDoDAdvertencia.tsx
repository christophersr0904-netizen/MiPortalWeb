import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ModalDoDAdvertenciaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: () => void;
  tareaCodigo: string;
  tareaNombre: string;
  pendientes: number;
  total: number;
}

export const ModalDoDAdvertencia: React.FC<ModalDoDAdvertenciaProps> = ({
  isOpen,
  onClose,
  onConfirmar,
  tareaCodigo,
  tareaNombre,
  pendientes,
  total
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        onConfirmar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirmar]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-dod-advertencia-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-150"
    >
      <div
        id="modal-dod-advertencia-card"
        className="w-full max-w-md bg-[#0D1526] border border-amber-500/40 rounded-t-3xl sm:rounded-2xl p-5 shadow-[0_10px_35px_-5px_rgba(2,6,23,0.9),0_0_20px_rgba(245,158,11,0.15)] transform-gpu transition-[transform,opacity] duration-150 space-y-4 text-slate-100 relative select-none"
      >
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-1 mb-2 block sm:hidden shrink-0" />
        {/* Cabecera con Ícono Semántico */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="font-bold text-sm text-white">Definition of Done (DoD)</h3>
              <span className="text-[11px] font-mono tabular-nums text-amber-300 font-semibold">
                {tareaCodigo}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-2 sm:p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Mensaje Contextual */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs text-slate-300">
          <p className="font-medium text-slate-200 line-clamp-2">
            {tareaNombre}
          </p>
          <p className="text-slate-400">
            Esta tarea tiene <b className="text-amber-400 font-mono tabular-nums">{pendientes}</b> de{' '}
            <b className="text-white font-mono tabular-nums">{total}</b> subtareas pendientes de ejecución.
          </p>
        </div>

        <p className="text-xs text-slate-400">
          ¿Deseas marcarla como <b>Completada</b> omitiendo las subtareas restantes?
        </p>

        {/* Botonera de Acción */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Completar de todos modos</span>
          </button>
        </div>
      </div>
    </div>
  );
};

