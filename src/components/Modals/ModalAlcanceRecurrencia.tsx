import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, CalendarRange, Layers, X, AlertTriangle } from 'lucide-react';
import type { AlcanceRecurrencia } from '../../types';

export interface ModalAlcanceRecurrenciaProps {
  isOpen: boolean;
  accion: 'editar' | 'eliminar';
  tituloActividad: string;
  fechaActual: string;
  onSeleccionarAlcance: (alcance: AlcanceRecurrencia) => void;
  onClose: () => void;
}

export const ModalAlcanceRecurrencia: React.FC<ModalAlcanceRecurrenciaProps> = ({
  isOpen,
  accion,
  tituloActividad,
  fechaActual,
  onSeleccionarAlcance,
  onClose
}) => {
  // Manejo de atajo Escape para cerrar modal
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

  const esEliminar = accion === 'eliminar';

  const opciones: Array<{
    alcance: AlcanceRecurrencia;
    titulo: string;
    descripcion: string;
    Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }> = [
    {
      alcance: 'SINGLE',
      titulo: 'Solo esta ocurrencia',
      descripcion: esEliminar
        ? 'Elimina únicamente la actividad programada para esta fecha.'
        : 'Modifica únicamente la actividad programada para esta fecha.',
      Icon: Calendar
    },
    {
      alcance: 'FUTURE',
      titulo: 'Esta y las siguientes',
      descripcion: esEliminar
        ? 'Detiene la serie a partir de esta fecha, preservando el historial anterior.'
        : 'Aplica a partir de esta fecha hacia el futuro, manteniendo el historial anterior.',
      Icon: CalendarRange
    },
    {
      alcance: 'ALL',
      titulo: 'Todas las ocurrencias',
      descripcion: esEliminar
        ? 'Elimina toda la serie recurrente e historial sin excepción.'
        : 'Afecta a toda la serie recurrente sin excepción.',
      Icon: Layers
    }
  ];

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-alcance-titulo"
      className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0D1526] border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden p-5 flex flex-col gap-4 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                esEliminar
                  ? 'bg-rose-950/40 border-rose-800/50 text-rose-400'
                  : 'bg-blue-950/40 border-blue-800/50 text-blue-400'
              }`}
            >
              {esEliminar ? (
                <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
              ) : (
                <CalendarRange className="w-5 h-5" strokeWidth={1.75} />
              )}
            </span>
            <div>
              <h3 id="modal-alcance-titulo" className="text-sm font-bold text-white leading-tight">
                {esEliminar ? '¿Cómo deseas eliminar esta actividad?' : '¿Cómo deseas aplicar los cambios?'}
              </h3>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[280px]">
                {tituloActividad} {fechaActual ? `· ${fechaActual}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Lista de 3 Opciones de Alcance */}
        <div className="flex flex-col gap-2.5">
          {opciones.map(({ alcance, titulo, descripcion, Icon }) => (
            <button
              key={alcance}
              type="button"
              onClick={() => onSeleccionarAlcance(alcance)}
              className={`w-full p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3.5 text-left cursor-pointer group ${
                esEliminar
                  ? 'border-slate-800/80 bg-slate-900/40 hover:border-rose-500/50 hover:bg-rose-950/20 text-slate-200'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-blue-500/50 hover:bg-blue-950/20 text-slate-200'
              }`}
            >
              <span
                className={`p-2 rounded-lg border transition-colors shrink-0 ${
                  esEliminar
                    ? 'bg-slate-800/60 border-slate-700/60 text-slate-400 group-hover:bg-rose-950/60 group-hover:border-rose-700/60 group-hover:text-rose-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 group-hover:bg-blue-950/60 group-hover:border-blue-700/60 group-hover:text-blue-300'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-xs font-bold block transition-colors ${
                    esEliminar
                      ? 'text-white group-hover:text-rose-300'
                      : 'text-white group-hover:text-blue-300'
                  }`}
                >
                  {titulo}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">
                  {descripcion}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer / Cancelar */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
