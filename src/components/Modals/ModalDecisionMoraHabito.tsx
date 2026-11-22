/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalDecisionMoraHabito.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-HABITOS-FIX-02 (Modal de Decisión de Mora en Hábitos Recurrentes)
 * DESCRIPCIÓN: Modal interactivo Cobalt Aerodynamic A.2.2 para decidir si
 *              completar la mora secuencialmente (1 paso) o saltar al ciclo
 *              actual de hoy al completar una actividad recurrente vencida.
 * ============================================================================
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarClock,
  X,
  CheckCircle2,
  FastForward,
  AlertCircle,
  Calendar
} from 'lucide-react';
import type { ActividadPersonal } from '../../types';
import {
  calcularSiguienteFechaCiclo,
  formatFechaIsoLocal,
  type ModoResolucionMora
} from '../../services/habitosService';
import { formatearFechaHumana } from '../UI/InputFechaCobalt';

export interface ModalDecisionMoraHabitoProps {
  isOpen: boolean;
  onClose: () => void;
  actividad: ActividadPersonal | null;
  onElegirModo: (modo: ModoResolucionMora) => void;
}

export const ModalDecisionMoraHabito: React.FC<ModalDecisionMoraHabitoProps> = ({
  isOpen,
  onClose,
  actividad,
  onElegirModo
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !actividad) return null;

  const hoyStr = formatFechaIsoLocal();
  const fProg = (actividad.fecha_programada || '').split(/[\sT]/)[0];

  // Cálculo de días de mora
  const diferenciaEnDias = (fHoy: string, fP?: string): number => {
    if (!fP || fP >= fHoy) return 0;
    const pProg = fP.split('-');
    const pHoy = fHoy.split('-');
    if (pProg.length !== 3 || pHoy.length !== 3) return 0;
    const dProg = new Date(parseInt(pProg[0], 10), parseInt(pProg[1], 10) - 1, parseInt(pProg[2], 10), 12, 0, 0);
    const dHoy = new Date(parseInt(pHoy[0], 10), parseInt(pHoy[1], 10) - 1, parseInt(pHoy[2], 10), 12, 0, 0);
    return Math.max(0, Math.floor((dHoy.getTime() - dProg.getTime()) / 86400000));
  };
  const diasMora = diferenciaEnDias(hoyStr, fProg);

  // Fechas proyectadas según cada estrategia
  const proxSaltoHoy = calcularSiguienteFechaCiclo(
    hoyStr,
    actividad.frecuencia_ciclo,
    actividad.regla_repeticion
  );

  const proxUnPaso = calcularSiguienteFechaCiclo(
    fProg || hoyStr,
    actividad.frecuencia_ciclo,
    actividad.regla_repeticion
  );

  return createPortal(
    <div
      id="modal-decision-mora"
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-decision-mora-card"
        className="portal-surface elevation-3 w-full max-w-lg rounded-2xl bg-[#0D1526] border border-slate-700/60 flex flex-col shadow-[0_20px_50px_rgba(2,6,23,0.9),0_0_30px_rgba(56,189,248,0.12)] relative text-slate-100 overflow-hidden"
      >
        {/* Cabecera Ejecutiva Cobalt */}
        <div
          id="modal-decision-mora-header"
          className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-800/80 flex justify-between items-center bg-[#0A101D]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-amber-950/60 text-amber-400 border-amber-500/30 shadow-[0_0_14px_rgba(245,158,11,0.18)]">
              <CalendarClock className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 id="txt-modal-decision-mora-titulo" className="font-bold text-sm text-slate-100 leading-tight">
                Hábito Pendiente con Mora
              </h3>
              <span className="text-[10px] text-slate-400">
                Selecciona cómo registrar este cumplimiento
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] p-2 rounded-lg text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Tarjeta de Resumen de Actividad y Estado de Mora */}
          <div className="p-3.5 rounded-xl bg-[#040711]/90 border border-slate-800/80 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="font-bold text-sm text-slate-100 line-clamp-2">
                {actividad.nombre_actividad}
              </span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums font-bold text-[11px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 shrink-0">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                {diasMora} {diasMora === 1 ? 'día' : 'días'} en mora
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-[11px] font-mono tabular-nums pt-1 border-t border-slate-800/50">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400/80" strokeWidth={1.75} />
                <span>Programado: <strong className="text-amber-200">{formatearFechaHumana(fProg)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400/80" strokeWidth={1.75} />
                <span>Fecha actual: <strong className="text-sky-200">{formatearFechaHumana(hoyStr)}</strong></span>
              </div>
            </div>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed">
            Esta actividad tenía fecha pendiente en el pasado. Elige si deseas registrar el cumplimiento hoy y sincronizar la recurrencia al presente, o avanzar solo el ciclo vencido:
          </p>

          {/* Opciones de Decisión */}
          <div className="space-y-3">
            {/* Opción A: Saltar a Hoy (Recomendado) */}
            <button
              type="button"
              id="btn-mora-salto-hoy"
              onClick={() => onElegirModo('SALTO_A_HOY')}
              className="w-full p-4 rounded-xl border border-sky-500/40 bg-sky-950/20 hover:bg-sky-900/30 text-left transition duration-150 active:scale-[0.99] cursor-pointer group flex items-start gap-3.5 shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-900/50 border border-sky-500/40 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4 h-4 text-sky-300" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-xs text-sky-200 group-hover:text-sky-100">
                    Completar hoy y ponerse al día
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/60 uppercase tracking-wider font-mono">
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Registra el cumplimiento con la fecha de hoy, mantiene el ritmo actual y programa el próximo ciclo para el{' '}
                  <strong className="text-sky-300 font-mono">{formatearFechaHumana(proxSaltoHoy)}</strong>.
                </p>
              </div>
            </button>

            {/* Opción B: Avanzar Un Paso */}
            <button
              type="button"
              id="btn-mora-avanzar-paso"
              onClick={() => onElegirModo('AVANZAR_UN_PASO')}
              className="w-full p-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-800/40 text-left transition duration-150 active:scale-[0.99] cursor-pointer group flex items-start gap-3.5"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <FastForward className="w-4 h-4 text-slate-300" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-xs text-slate-200 group-hover:text-white">
                    Completar solo el día vencido
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Secuencial
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Avanza un único paso desde la fecha vencida y deja la actividad reprogramada para el{' '}
                  <strong className="text-slate-300 font-mono">{formatearFechaHumana(proxUnPaso)}</strong>.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:px-6 border-t border-slate-800/80 bg-[#0A101D] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
