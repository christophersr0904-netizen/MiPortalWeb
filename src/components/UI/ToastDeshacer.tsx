/**
 * ============================================================================
 * ARCHIVO: src/components/UI/ToastDeshacer.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-UI-50-EXEC (Borrado Optimista Deterministico y Animaciones React Bits)
 * DESCRIPCIÓN: Componente interactivo de notificación de eliminación diferida
 *              estilo React Bits / Shadcn con anillo SVG de progreso,
 *              pausa reactiva al hover y botón táctil Deshacer.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, X, FolderKanban, Target, CheckSquare, ListTodo, DollarSign, TrendingUp, Calendar, Award, FileText, Trash2, BookOpen } from 'lucide-react';
import type { PendingDelete, TipoEntidadUndo } from '../../context/UndoDeleteContext';

export interface ToastDeshacerProps {
  item: PendingDelete;
  onDeshacer: (key: string) => void;
  onPausar?: (key: string) => void;
  onReanudar?: (key: string) => void;
  onForzarCommit?: (key: string) => void;
}

const obtenerIconoTipo = (tipo: TipoEntidadUndo) => {
  switch (tipo) {
    case 'PROYECTO':
      return <FolderKanban className="w-4 h-4 text-indigo-400 shrink-0" strokeWidth={1.75} />;
    case 'HITO':
      return <Target className="w-4 h-4 text-purple-400 shrink-0" strokeWidth={1.75} />;
    case 'TAREA':
      return <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />;
    case 'SUBTAREA':
      return <ListTodo className="w-4 h-4 text-teal-400 shrink-0" strokeWidth={1.75} />;
    case 'GASTO':
      return <DollarSign className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.75} />;
    case 'INGRESO':
      return <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />;
    case 'ACTIVIDAD':
      return <Calendar className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />;
    case 'META':
      return <Award className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={1.75} />;
    case 'NOTA':
      return <FileText className="w-4 h-4 text-cyan-400 shrink-0" strokeWidth={1.75} />;
    case 'CUADERNO':
      return <BookOpen className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />;
    default:
      return <Trash2 className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />;
  }
};

export const ToastDeshacer: React.FC<ToastDeshacerProps> = ({
  item,
  onDeshacer,
  onPausar,
  onReanudar,
  onForzarCommit
}) => {
  const duracionTotal = item.tiempoRestanteMs || 4000;
  const [segundosRestantes, setSegundosRestantes] = useState(Math.ceil(duracionTotal / 1000));
  const [estaPausado, setEstaPausado] = useState(false);

  // Bypass del DOM a 60 FPS (cero render thrashing en React)
  const circuloRef = useRef<SVGCircleElement>(null);
  const barraRef = useRef<HTMLDivElement>(null);
  const tiempoRestanteRef = useRef(duracionTotal);
  const segundosPreviosRef = useRef(Math.ceil(duracionTotal / 1000));
  const tiempoUltimoTickRef = useRef(Date.now());
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    tiempoUltimoTickRef.current = Date.now();

    const loop = () => {
      if (!estaPausado) {
        const ahora = Date.now();
        const delta = ahora - tiempoUltimoTickRef.current;
        tiempoUltimoTickRef.current = ahora;

        tiempoRestanteRef.current = Math.max(0, tiempoRestanteRef.current - delta);
        const pct = Math.max(0, Math.min(100, (tiempoRestanteRef.current / duracionTotal) * 100));

        // Mutación directa al DOM sin re-renderizar árbol React
        if (circuloRef.current) {
          circuloRef.current.style.strokeDashoffset = String(88 - (88 * pct) / 100);
        }
        if (barraRef.current) {
          barraRef.current.style.width = `${pct}%`;
        }

        // Throttling de estado a 1 Hz únicamente para la cifra numérica
        const seg = Math.ceil(tiempoRestanteRef.current / 1000);
        if (seg !== segundosPreviosRef.current) {
          segundosPreviosRef.current = seg;
          setSegundosRestantes(seg);
        }
      } else {
        tiempoUltimoTickRef.current = Date.now();
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [estaPausado, duracionTotal]);

  const handleMouseEnter = () => {
    setEstaPausado(true);
    if (onPausar) onPausar(item.key);
  };

  const handleMouseLeave = () => {
    setEstaPausado(false);
    if (onReanudar) onReanudar(item.key);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="status"
      aria-live="polite"
      className="pointer-events-auto group relative w-full sm:w-[380px] bg-[#0D1526]/95 backdrop-blur-xl border border-slate-800/80 hover:border-slate-700 rounded-2xl p-3 shadow-[0_12px_40px_-5px_rgba(2,6,23,0.85),0_0_20px_rgba(56,189,248,0.12)] transition-all duration-200 overflow-hidden select-none"
    >
      <div className="flex items-center justify-between gap-3 relative z-10">
        {/* Indicador de Tipo con Anillo Circular de Progreso */}
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90 transform-gpu" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="14"
              className="stroke-slate-800/80"
              strokeWidth="2.5"
              fill="transparent"
            />
            <circle
              ref={circuloRef}
              cx="18"
              cy="18"
              r="14"
              className="stroke-sky-400"
              strokeWidth="2.5"
              strokeDasharray={88}
              strokeDashoffset={0}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {obtenerIconoTipo(item.tipo)}
          </div>
        </div>

        {/* Información y Mensaje de Entidad */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono tracking-wider uppercase text-rose-400/90 font-bold">
              Eliminando {item.tipo.toLowerCase()}...
            </span>
            <span className="text-[10px] font-mono tabular-nums text-slate-500">
              ({segundosRestantes}s{estaPausado ? ' · pausado' : ''})
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-200 truncate mt-0.5" title={item.etiqueta}>
            {item.etiqueta}
          </span>
        </div>

        {/* Botón Primario Deshacer */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onDeshacer(item.key)}
            className="min-h-[32px] px-2.5 py-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 hover:border-sky-400 text-sky-300 font-bold text-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm shadow-sky-950/40"
            title="Deshacer eliminación (Restaurar)"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Deshacer</span>
          </button>

          {onForzarCommit && (
            <button
              type="button"
              onClick={() => onForzarCommit(item.key)}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800/50 transition cursor-pointer"
              title="Confirmar eliminación de inmediato"
              aria-label="Confirmar eliminación"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Micro-Barra Inferior React Bits con Efecto Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800/40">
        <div
          ref={barraRef}
          className="h-full bg-gradient-to-r from-sky-500 via-sky-400 to-teal-300 origin-left shadow-[0_0_8px_#38bdf8]"
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

