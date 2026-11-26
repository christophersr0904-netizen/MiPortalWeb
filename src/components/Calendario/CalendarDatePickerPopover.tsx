/**
 * ============================================================================
 * ARCHIVO: src/components/Calendario/CalendarDatePickerPopover.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-UX-CAL-05 (Popover Mini-Calendario y Selector Mes/Año)
 * DESCRIPCIÓN: Popover compacto Cobalt Aerodynamic con vista de Días y vista
 *              rápida de Meses/Años (grilla 3×4) para saltar en 2 clics.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  obtenerRangoVisible,
  crearFechaMediodia
} from '../../hooks/useCalendarEngine';
import { formatFechaIsoLocal } from '../../utils/timeFormatters';
import { MESES_ES } from './calendarStyles';

const LETRAS_DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr',
  'May', 'Jun', 'Jul', 'Ago',
  'Sep', 'Oct', 'Nov', 'Dic'
] as const;

interface CalendarDatePickerPopoverProps {
  isOpen: boolean;
  fechaAncla: Date;
  hoyIso: string;
  onSelectDate: (fechaIso: string) => void;
  onIrAHoy: () => void;
  onClose: () => void;
}

export const CalendarDatePickerPopover: React.FC<CalendarDatePickerPopoverProps> = ({
  isOpen,
  fechaAncla,
  hoyIso,
  onSelectDate,
  onIrAHoy,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modo, setModo] = useState<'dias' | 'meses'>('dias');
  const [cursorMes, setCursorMes] = useState<Date>(() =>
    new Date(fechaAncla.getFullYear(), fechaAncla.getMonth(), 1, 12, 0, 0)
  );

  // Sincronizar cursor interno al abrir el popover
  useEffect(() => {
    if (isOpen) {
      setModo('dias');
      setCursorMes(new Date(fechaAncla.getFullYear(), fechaAncla.getMonth(), 1, 12, 0, 0));
    }
  }, [isOpen, fechaAncla]);

  // Cierre por clic fuera o tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  const fechasGrid = useMemo(
    () => obtenerRangoVisible(cursorMes, 'mes').fechas,
    [cursorMes]
  );

  if (!isOpen) return null;

  const fechaAnclaIso = formatFechaIsoLocal(fechaAncla);
  const anioCursor = cursorMes.getFullYear();
  const mesCursor = cursorMes.getMonth();

  const navegarMes = (delta: number) => {
    setCursorMes((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1, 12, 0, 0));
  };

  const navegarAnio = (delta: number) => {
    setCursorMes((prev) => new Date(prev.getFullYear() + delta, prev.getMonth(), 1, 12, 0, 0));
  };

  const handleSeleccionarMes = (mesIdx: number) => {
    // Mantener día actual acotado al último día del mes destino
    const ultimoDiaMesDestino = new Date(anioCursor, mesIdx + 1, 0).getDate();
    const diaObjetivo = Math.min(fechaAncla.getDate(), ultimoDiaMesDestino);
    const nuevaFecha = crearFechaMediodia(new Date(anioCursor, mesIdx, diaObjetivo, 12, 0, 0));
    onSelectDate(formatFechaIsoLocal(nuevaFecha));
    onClose();
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Selector rápido de fecha, mes y año"
      className="absolute left-0 top-full mt-1.5 w-[272px] rounded-2xl bg-[#0D1526] border border-slate-800/80 shadow-[0_14px_35px_-5px_rgba(2,6,23,0.92),0_8px_15px_-6px_rgba(30,58,138,0.28)] p-3 z-[9990] text-slate-200 select-none"
    >
      {/* Cabecera de navegación interna */}
      <div className="flex items-center justify-between gap-1 mb-2.5">
        <button
          type="button"
          onClick={() => (modo === 'dias' ? navegarMes(-1) : navegarAnio(-1))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-white/[0.06] transition cursor-pointer"
          aria-label={modo === 'dias' ? 'Mes anterior' : 'Año anterior'}
        >
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={() => setModo((prev) => (prev === 'dias' ? 'meses' : 'dias'))}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-100 hover:text-sky-300 hover:bg-white/[0.05] transition cursor-pointer font-mono tabular-nums"
          title={
            modo === 'dias'
              ? 'Cambiar a selector rápido de Mes y Año'
              : 'Volver al mini-calendario de días'
          }
        >
          {modo === 'dias' ? `${MESES_ES[mesCursor]} ${anioCursor}` : `${anioCursor}`}
        </button>

        <button
          type="button"
          onClick={() => (modo === 'dias' ? navegarMes(1) : navegarAnio(1))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-white/[0.06] transition cursor-pointer"
          aria-label={modo === 'dias' ? 'Mes siguiente' : 'Año siguiente'}
        >
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Cuerpo: Vista Días vs Vista Meses/Años */}
      {modo === 'dias' ? (
        <div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {LETRAS_DIAS.map((letra) => (
              <div
                key={letra}
                className="text-center text-[10px] font-mono font-medium text-slate-500 py-0.5"
              >
                {letra}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {fechasGrid.map((fIso) => {
              const [, m, d] = fIso.split('-').map(Number);
              const esDelMes = m - 1 === mesCursor;
              const esHoy = fIso === hoyIso;
              const esSeleccionado = fIso === fechaAnclaIso;

              return (
                <button
                  key={fIso}
                  type="button"
                  onClick={() => {
                    onSelectDate(fIso);
                    onClose();
                  }}
                  className={`h-7 rounded-lg font-mono tabular-nums text-[11px] flex items-center justify-center transition cursor-pointer ${
                    esSeleccionado
                      ? 'bg-sky-500 text-white font-bold shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                      : esHoy
                      ? 'ring-1 ring-sky-400/70 bg-sky-500/12 text-sky-300 font-semibold hover:bg-sky-500/20'
                      : esDelMes
                      ? 'text-slate-200 hover:bg-white/[0.07]'
                      : 'text-slate-600 hover:text-slate-400 hover:bg-white/[0.03]'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 py-1">
          {MESES_CORTOS.map((mesLabel, idx) => {
            const esMesAncla =
              anioCursor === fechaAncla.getFullYear() && idx === fechaAncla.getMonth();
            return (
              <button
                key={mesLabel}
                type="button"
                onClick={() => handleSeleccionarMes(idx)}
                className={`py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  esMesAncla
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                    : 'text-slate-300 hover:text-sky-200 hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                {mesLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Pie: Ir a Hoy */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-500">
          {modo === 'dias' ? 'Clic en mes para cambiar año' : 'Selecciona un mes'}
        </span>
        <button
          type="button"
          onClick={() => {
            onIrAHoy();
            onClose();
          }}
          className="px-2 py-1 rounded-lg text-[11px] font-medium text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 inline-flex items-center gap-1 transition cursor-pointer"
        >
          <Calendar className="w-3 h-3" strokeWidth={1.75} />
          <span>Ir a Hoy</span>
        </button>
      </div>
    </div>
  );
};
