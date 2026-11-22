/**
 * ============================================================================
 * ARCHIVO: src/components/UI/SelectIconicoCobalt.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-UI-52-EXEC (Despliegue de Selectores Cobalt, Iconografía y Micro-interacciones)
 * DESCRIPCIÓN: Selector desplegable interactivo fluido estilo React Bits / Shadcn con
 *              soporte de íconos Lucide, subtítulos contextuales, atajos de
 *              teclado, clic exterior y tokens canónicos Cobalt Aerodynamic (A.2.2).
 * ============================================================================
 */

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface OpcionSelectCobalt<T extends string = string> {
  valor: T;
  etiqueta: string;
  subtitulo?: string;
  icono?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string;
  colorBadge?: string;
}

export interface SelectIconicoCobaltProps<T extends string = string> {
  id?: string;
  valor: T;
  onChange: (valor: T) => void;
  opciones: OpcionSelectCobalt<T>[];
  label?: string;
  sublabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface CoordsDropdown {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  openUpward: boolean;
}

export function SelectIconicoCobalt<T extends string = string>({
  id,
  valor,
  onChange,
  opciones,
  label,
  sublabel,
  placeholder = 'Seleccionar opción...',
  disabled = false,
  className = ''
}: SelectIconicoCobaltProps<T>) {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<CoordsDropdown | null>(null);

  const opcionSeleccionada = opciones.find((op) => op.valor === valor);

  const calcularCoordenadas = useCallback((): CoordsDropdown | null => {
    if (!contenedorRef.current) return null;
    const rect = contenedorRef.current.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const espacioArriba = rect.top;
    const openUpward = espacioAbajo < 250 && espacioArriba > espacioAbajo;

    return {
      left: rect.left,
      width: Math.max(rect.width, 200),
      openUpward,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 })
    };
  }, []);

  const cerrar = useCallback(() => {
    setEstaAbierto(false);
    setCoords(null);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!estaAbierto) {
      // 1. Cálculo síncrono antes del primer pintado en DOM para erradicar aparición en (0,0)
      const pos = calcularCoordenadas();
      if (pos) {
        setCoords(pos);
      }
      setEstaAbierto(true);
    } else {
      cerrar();
    }
  };

  // useLayoutEffect refuerza la sincronización geométrica antes del render en pantalla y reposiciona en scroll/resize
  useLayoutEffect(() => {
    if (estaAbierto) {
      const pos = calcularCoordenadas();
      if (pos) setCoords(pos);

      const handleScrollResize = (e: Event) => {
        // Ignorar eventos de scroll originados dentro del propio listbox
        if (menuRef.current && menuRef.current.contains(e.target as Node)) {
          return;
        }
        const updated = calcularCoordenadas();
        if (updated) setCoords(updated);
      };

      window.addEventListener('resize', handleScrollResize);
      window.addEventListener('scroll', handleScrollResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollResize);
        window.removeEventListener('scroll', handleScrollResize, true);
      };
    } else {
      setCoords(null);
    }
  }, [estaAbierto, calcularCoordenadas]);

  // Cierre al hacer clic fuera (validando contenedor y portal)
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        cerrar();
      }
    };
    if (estaAbierto) {
      document.addEventListener('mousedown', handleClickFuera);
    }
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [estaAbierto, cerrar]);

  // Cierre con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && estaAbierto) {
        cerrar();
      }
    };
    if (estaAbierto) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [estaAbierto, cerrar]);

  return (
    <div className={`relative flex flex-col gap-1.5 ${estaAbierto ? 'z-[100]' : 'z-10'} ${className}`} ref={contenedorRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            {label}
          </label>
          {sublabel && (
            <span className="text-[10px] text-slate-500 font-normal">
              {sublabel}
            </span>
          )}
        </div>
      )}

      {/* Botón Disparador del Selector */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={estaAbierto}
        className={`w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#0D1526] border text-left transition-[transform,border-color,box-shadow] duration-150 flex items-center justify-between gap-2.5 cursor-pointer select-none active:scale-[0.99] ${
          estaAbierto
            ? 'border-sky-500/80 shadow-[0_0_15px_rgba(56,189,248,0.18)] ring-1 ring-sky-500/50'
            : 'border-slate-800/90 hover:border-slate-700 hover:bg-[#101b30]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {opcionSeleccionada?.icono ? (
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
              <opcionSeleccionada.icono className="w-4 h-4" strokeWidth={1.75} />
            </div>
          ) : null}

          <div className="flex flex-col min-w-0 flex-1">
            <span className={`text-xs font-bold truncate ${opcionSeleccionada ? 'text-slate-100' : 'text-slate-500'}`}>
              {opcionSeleccionada ? opcionSeleccionada.etiqueta : placeholder}
            </span>
            {opcionSeleccionada?.subtitulo && (
              <span className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                {opcionSeleccionada.subtitulo}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {opcionSeleccionada?.badge && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                opcionSeleccionada.colorBadge || 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {opcionSeleccionada.badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              estaAbierto ? 'rotate-180 text-sky-400' : ''
            }`}
            strokeWidth={1.75}
          />
        </div>
      </button>

      {/* Menú Desplegable Flotante en Portal (Sin recortes por overflow y sin saltos desde 0,0) */}
      {estaAbierto && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: 'fixed',
            left: coords.left,
            width: coords.width,
            zIndex: 99999,
            transformOrigin: coords.openUpward ? 'bottom' : 'top',
            ...(coords.openUpward ? { bottom: coords.bottom } : { top: coords.top })
          }}
          className="p-1.5 rounded-2xl bg-[#0D1526] border border-slate-700 shadow-[0_16px_36px_-6px_rgba(2,6,23,0.95),0_0_20px_rgba(56,189,248,0.12)] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-120"
        >
          {opciones.map((op) => {
            const esActivo = op.valor === valor;
            const Icono = op.icono;

            return (
              <div
                key={op.valor}
                role="option"
                aria-selected={esActivo}
                onClick={() => {
                  onChange(op.valor);
                  cerrar();
                }}
                className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-colors duration-150 ${
                  esActivo
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold shadow-xs'
                    : 'hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {Icono && (
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        esActivo
                          ? 'bg-sky-500/25 text-sky-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icono className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold truncate leading-tight">
                      {op.etiqueta}
                    </span>
                    {op.subtitulo && (
                      <span className="text-[10px] text-slate-400 truncate mt-0.5">
                        {op.subtitulo}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {op.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${
                        op.colorBadge || 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {op.badge}
                    </span>
                  )}
                  {esActivo && (
                    <Check className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={2.2} />
                  )}
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

