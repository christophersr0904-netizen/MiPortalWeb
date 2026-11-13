import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X
} from 'lucide-react';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import type { ToastCobaltPayload } from '../../utils/toastCobalt';
import { ToastDeshacer } from './ToastDeshacer';

const obtenerIconoToast = (tipo: ToastCobaltPayload['tipo']) => {
  switch (tipo) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={1.75} />;
    case 'error':
      return <XCircle className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.75} />;
    case 'info':
    default:
      return <Info className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />;
  }
};

export const UndoToastContainer: React.FC = () => {
  const { pendingList, deshacer, pausar, reanudar, forzarCommit } = useUndoDelete();
  const [activeToasts, setActiveToasts] = useState<ToastCobaltPayload[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastCobaltPayload>;
      if (!customEvent.detail) return;
      const toast = customEvent.detail;
      setActiveToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duracionMs || 2500);
    };

    window.addEventListener('pmo:toast', handleToast);
    return () => window.removeEventListener('pmo:toast', handleToast);
  }, []);

  const totalActivos = (pendingList?.length || 0) + activeToasts.length;
  if (totalActivos === 0) return null;

  return (
    <div
      id="undo-toast-container"
      className="fixed top-14 left-3 right-3 sm:top-auto sm:bottom-4 sm:right-4 sm:left-auto z-[10010] flex flex-col gap-2 pointer-events-none select-none"
    >
      {/* 1. Toasts Declarativos Cobalt */}
      {activeToasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-[#0D1526]/95 backdrop-blur-xl border border-slate-800/80 shadow-[0_10px_35px_-5px_rgba(2,6,23,0.8),0_0_20px_rgba(56,189,248,0.15)] rounded-xl p-3 w-full sm:w-auto sm:min-w-[320px] sm:max-w-[380px] overflow-hidden relative flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              {obtenerIconoToast(t.tipo)}
            </div>
            <span className="text-xs text-slate-200 font-medium leading-tight">
              {t.mensaje}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>

          {/* Micro-indicador de vida */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-[2px] animate-shrink-width ${
              t.tipo === 'success'
                ? 'bg-emerald-400'
                : t.tipo === 'warning'
                ? 'bg-amber-400'
                : t.tipo === 'error'
                ? 'bg-rose-400'
                : 'bg-sky-400'
            }`}
            style={{ animationDuration: `${t.duracionMs || 2500}ms` }}
          />
        </div>
      ))}

      {/* 2. Búfer de Deshacer Eliminación React Bits (ToastDeshacer) */}
      {pendingList?.map((item) => (
        <ToastDeshacer
          key={item.key}
          item={item}
          onDeshacer={deshacer}
          onPausar={pausar}
          onReanudar={reanudar}
          onForzarCommit={forzarCommit}
        />
      ))}
    </div>
  );
};
