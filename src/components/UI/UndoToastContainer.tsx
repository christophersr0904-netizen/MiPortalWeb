import React from 'react';
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
  Trash2
} from 'lucide-react';
import { useUndoDelete, type TipoEntidadUndo } from '../../hooks/useUndoDelete';

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
    default:
      return <Trash2 className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />;
  }
};

export const UndoToastContainer: React.FC = () => {
  const { pendingList, deshacer } = useUndoDelete();

  if (!pendingList || pendingList.length === 0) return null;

  return (
    <div
      id="undo-toast-container"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
    >
      {pendingList.map((item) => (
        <div
          key={item.key}
          className="pointer-events-auto bg-[#0D1526]/95 backdrop-blur-xl border border-slate-800/80 shadow-[0_10px_35px_-5px_rgba(2,6,23,0.8),0_0_20px_rgba(56,189,248,0.15)] rounded-xl p-3 min-w-[320px] max-w-[380px] overflow-hidden relative flex items-center justify-between gap-3 animate-fadeIn"
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
