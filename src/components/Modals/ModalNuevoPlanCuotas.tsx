/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalNuevoPlanCuotas.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYS-001-F5
 * DESCRIPCIÓN: Modal Bento Cobalt Aerodynamic para creación de planes de crédito
 *              bancarios y compromisos a plazos con createPortal y z-[10000].
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building, Calendar, DollarSign, Layers } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { crearCuota } from '../../services/cuotasService';
import { formatFechaIsoLocal } from '../../utils/timeFormatters';

export interface ModalNuevoPlanCuotasProps {
  isOpen: boolean;
  onClose: () => void;
  onCreadoExitoso?: () => void;
}

export const ModalNuevoPlanCuotas: React.FC<ModalNuevoPlanCuotasProps> = ({
  isOpen,
  onClose,
  onCreadoExitoso
}) => {
  useBodyScrollLock(isOpen);

  const [entidad, setEntidad] = useState('');
  const [totalCuotas, setTotalCuotas] = useState<number>(12);
  const [montoCuota, setMontoCuota] = useState<number>(0);
  const [moneda, setMoneda] = useState<'PEN' | 'USD'>('PEN');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset y fecha por defecto
  useEffect(() => {
    if (!isOpen) return;
    setEntidad('');
    setTotalCuotas(12);
    setMontoCuota(0);
    setMoneda('PEN');
    setFechaVencimiento(formatFechaIsoLocal(new Date()));
    setErrorMsg(null);
  }, [isOpen]);

  // Listener de Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entidad.trim() || montoCuota <= 0 || totalCuotas <= 0) {
      setErrorMsg('Ingresa una entidad válida, monto y número de cuotas mayor a cero.');
      return;
    }
    setErrorMsg(null);

    await crearCuota({
      entidad_financiera: entidad.trim(),
      numero_cuota: 1,
      total_cuotas: totalCuotas,
      monto_cuota: montoCuota,
      moneda: moneda,
      fecha_vencimiento: fechaVencimiento || formatFechaIsoLocal(new Date()),
      estado_cuota: 'PENDIENTE'
    });

    if (onCreadoExitoso) onCreadoExitoso();
    onClose();
  };

  return createPortal(
    <div
      id="modal-nuevo-plan-cuotas"
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-plan-cuotas-card"
        className="w-full max-w-md max-h-[92dvh] flex flex-col bg-[#0D1526] rounded-t-3xl sm:rounded-2xl border border-slate-800/80 shadow-2xl p-4 sm:p-5 text-slate-100 transform-gpu transition-[transform,opacity] duration-150 overflow-hidden"
      >
        {/* Cabecera Bento Cobalt */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6]" />
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-violet-400" strokeWidth={1.75} />
                Nuevo Plan de Crédito & Deudas
              </h3>
              <p className="text-[10px] text-slate-400">Gobernanza de pasivos y cuotas a plazos</p>
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

        {/* Micro-banner de Error Inline */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between transition-opacity duration-150">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-rose-200 text-xs ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleGuardar} className="flex-1 overflow-y-auto overscroll-contain space-y-3.5 text-xs custom-scrollbar">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Entidad Financiera / Banco</label>
            <input
              type="text"
              required
              value={entidad}
              onChange={(e) => setEntidad(e.target.value)}
              placeholder="Ej. BCP, BBVA, Interbank, Tarjeta..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-violet-500 font-medium transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                N° de Cuotas
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalCuotas || ''}
                onChange={(e) => setTotalCuotas(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 outline-none focus:ring-1 focus:ring-violet-500 font-mono tabular-nums font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                Monto por Cuota
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={montoCuota || ''}
                onChange={(e) => setMontoCuota(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 outline-none focus:ring-1 focus:ring-violet-500 font-mono tabular-nums font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Moneda</label>
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as 'PEN' | 'USD')}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 outline-none focus:ring-1 focus:ring-violet-500 font-mono tabular-nums"
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                Fecha 1ra Cuota
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 outline-none focus:ring-1 focus:ring-violet-500 font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 sticky bottom-0 bg-[#0D1526] z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition shadow-xs cursor-pointer active:scale-95 text-xs"
            >
              Registrar Plan
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

