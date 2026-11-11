import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Target,
  CheckSquare,
  ListTodo,
  DollarSign,
  TrendingUp,
  Calendar,
  Award,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
  BookOpen
} from 'lucide-react';
import { useUndoDelete, type TipoEntidadUndo } from '../../hooks/useUndoDelete';
import type { ToastCobaltPayload } from '../../utils/toastCobalt';

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
  const { pendingList, deshacer } = useUndoDelete();
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

      {/* 2. Búfer de Deshacer Eliminación (UndoDelete) */}
      {pendingList?.map((item) => (
        <div
          key={item.key}
          className="pointer-events-auto bg-[#0D1526]/95 backdrop-blur-xl border border-slate-800/80 shadow-[0_10px_35px_-5px_rgba(2,6,23,0.8),0_0_20px_rgba(56,189,248,0.15)] rounded-xl p-3 w-full sm:w-auto sm:min-w-[320px] sm:max-w-[380px] overflow-hidden relative flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              {obtenerIconoTipo(item.tipo)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                Eliminando {item.tipo.toLowerCase()}...
              </span>
              <span className="text-xs text-slate-200 font-medium truncate" title={item.etiqueta}>
                {item.etiqueta}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => deshacer(item.key)}
            className="px-3 py-1 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Deshacer
          </button>

          {/* Barra de progreso regresiva CSS */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-sky-400 origin-left animate-shrink-width"
            style={{ animationDuration: `${item.tiempoRestanteMs || 4000}ms` }}
          />
        </div>
      ))}
    </div>
  );
};
