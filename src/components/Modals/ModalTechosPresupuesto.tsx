/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalTechosPresupuesto.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYS-001-F8 (Motor Real de Techos Presupuestales)
 * DISEÑO: Cobalt Aerodynamic Bento (#0D1526, border-slate-800/80, font-mono tabular-nums)
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Target, X, Plus, Trash2, RotateCcw, Save } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { mostrarToastCobalt } from '../../utils/toastCobalt';

export interface TechoPresupuestoItem {
  categoria: string;
  asignado: number;
}

export const STORAGE_KEY_TECHOS = 'pmo_techos_presupuesto';
export const EVENT_TECHOS_UPDATED = 'pmo:techos-updated';

export const DEFAULT_TECHOS_PRESUPUESTO: TechoPresupuestoItem[] = [
  { categoria: 'Vivienda & Servicios', asignado: 850 },
  { categoria: 'Alimentación & Supermercado', asignado: 700 },
  { categoria: 'Educación, Certificaciones & Libros', asignado: 600 },
  { categoria: 'Transporte & Movilidad', asignado: 250 },
  { categoria: 'Salud, Gimnasio & Cuidado Personal', asignado: 350 },
  { categoria: 'Ocio, Restaurantes & Suscripciones', asignado: 300 },
  { categoria: 'Materiales & Equipos', asignado: 500 },
  { categoria: 'Licencias / Software', asignado: 200 }
];

export function obtenerTechosConfigurados(): TechoPresupuestoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TECHOS);
    if (!raw) return DEFAULT_TECHOS_PRESUPUESTO;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Error al leer techos de presupuesto:', e);
  }
  return DEFAULT_TECHOS_PRESUPUESTO;
}

interface ModalTechosPresupuestoProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardado?: () => void;
}

export const ModalTechosPresupuesto: React.FC<ModalTechosPresupuestoProps> = ({
  isOpen,
  onClose,
  onGuardado
}) => {
  useBodyScrollLock(isOpen);

  const [techos, setTechos] = useState<TechoPresupuestoItem[]>([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTechos(obtenerTechosConfigurados());
      setNuevaCategoria('');
      setNuevoMonto('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleModificarMonto = (index: number, valorStr: string) => {
    const num = Math.max(0, parseFloat(valorStr) || 0);
    setTechos((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, asignado: num } : item))
    );
  };

  const handleEliminarItem = (index: number) => {
    setTechos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAgregarCategoria = () => {
    const nombre = nuevaCategoria.trim();
    if (!nombre) {
      mostrarToastCobalt('Ingresa un nombre para la categoría', 'warning');
      return;
    }
    if (techos.some((t) => t.categoria.toLowerCase() === nombre.toLowerCase())) {
      mostrarToastCobalt('Esa categoría ya existe en la lista', 'warning');
      return;
    }
    const monto = Math.max(0, parseFloat(nuevoMonto) || 100);
    setTechos((prev) => [...prev, { categoria: nombre, asignado: monto }]);
    setNuevaCategoria('');
    setNuevoMonto('');
  };

  const handleRestablecerDefault = () => {
    setTechos(DEFAULT_TECHOS_PRESUPUESTO);
    mostrarToastCobalt('Techos restablecidos a valores por defecto', 'info');
  };

  const handleGuardar = () => {
    try {
      localStorage.setItem(STORAGE_KEY_TECHOS, JSON.stringify(techos));
      window.dispatchEvent(new CustomEvent(EVENT_TECHOS_UPDATED));
      mostrarToastCobalt('Techos presupuestales guardados correctamente', 'success');
      if (onGuardado) onGuardado();
      onClose();
    } catch (e) {
      console.error('Error al guardar techos:', e);
      mostrarToastCobalt('Error al persistir la configuración de techos', 'error');
    }
  };

  const totalAsignado = techos.reduce((acc, t) => acc + (t.asignado || 0), 0);

  return createPortal(
    <div
      id="modal-techos-backdrop"
      className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-[10001] animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-techos-container"
        className="w-full max-w-2xl bg-[#0D1526] border border-slate-800/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
        style={{
          boxShadow: '0 20px 40px -10px rgba(2, 6, 23, 0.9), 0 10px 20px -5px rgba(30, 58, 138, 0.25)'
        }}
      >
        {/* HEADER BENTO */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60 bg-[#090D1A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Target className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                <span>Configuración de Techos Presupuestales</span>
              </h2>
              <p className="text-xs text-slate-400">
                Define el límite de gasto mensual permitido por categoría (Moneda Base: PEN)
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-cerrar-modal-techos"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar modal (Esc)"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* LISTADO DE CATEGORÍAS */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {/* BARRA DE TOTALIZACIÓN */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Presupuesto Mensual Total Tope:</span>
            <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
              S/ {totalAsignado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="space-y-2">
            {techos.map((item, idx) => (
              <div
                key={`${item.categoria}-${idx}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-slate-200 block truncate">
                    {item.categoria}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs text-slate-500 font-mono">S/</span>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={item.asignado}
                      onChange={(e) => handleModificarMonto(idx, e.target.value)}
                      className="w-28 pl-7 pr-2.5 py-1.5 bg-[#090D1A] border border-slate-700/80 focus:border-emerald-500 rounded-lg text-xs font-mono tabular-nums text-slate-100 outline-none text-right"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminarItem(idx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Eliminar categoría"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* AGREGAR NUEVA CATEGORÍA */}
          <div className="p-3.5 rounded-xl bg-slate-900/30 border border-dashed border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="text"
              placeholder="Nueva categoría (ej. Mascotas, Seguros)..."
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              className="flex-1 w-full px-3 py-1.5 bg-[#090D1A] border border-slate-700/80 focus:border-indigo-500 rounded-lg text-xs text-slate-100 outline-none placeholder:text-slate-500"
            />
            <div className="relative flex items-center w-full sm:w-auto">
              <span className="absolute left-2.5 text-xs text-slate-500 font-mono">S/</span>
              <input
                type="number"
                placeholder="0.00"
                step="10"
                min="0"
                value={nuevoMonto}
                onChange={(e) => setNuevoMonto(e.target.value)}
                className="w-full sm:w-28 pl-7 pr-2.5 py-1.5 bg-[#090D1A] border border-slate-700/80 focus:border-indigo-500 rounded-lg text-xs font-mono tabular-nums text-slate-100 outline-none text-right"
              />
            </div>
            <button
              type="button"
              onClick={handleAgregarCategoria}
              className="w-full sm:w-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Añadir</span>
            </button>
          </div>
        </div>

        {/* FOOTER ACCIONES */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800/60 bg-[#090D1A]">
          <button
            type="button"
            onClick={handleRestablecerDefault}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Restablecer</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-guardar-techos-modal"
              onClick={handleGuardar}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Guardar Techos</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

