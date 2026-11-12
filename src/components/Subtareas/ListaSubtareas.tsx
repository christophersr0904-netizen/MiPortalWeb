import React, { useState } from 'react';
import type { SubtareaPaso } from '../../types';
import { Check, Lock, ChevronDown, ListChecks, AlertTriangle } from 'lucide-react';

interface ListaSubtareasProps {
  idPadre: string;
  pasos: SubtareaPaso[];
  onTogglePaso: (idSubtarea: string, deseado?: boolean) => Promise<{ success: boolean; error?: string }>;
}

export const ListaSubtareas: React.FC<ListaSubtareasProps> = ({
  pasos,
  onTogglePaso
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  if (!pasos || pasos.length === 0) return null;

  const total = pasos.length;
  const completados = pasos.filter((p) => p.completado).length;
  const pct = Math.round((completados / total) * 100);
  const esTotal = completados === total;

  const colorPill = esTotal
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : completados > 0
    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
    : 'bg-slate-800/60 text-slate-400 border-slate-700/60';

  const colorBarra = esTotal ? 'bg-emerald-500' : 'bg-sky-500';

  const handleToggle = async (p: SubtareaPaso, e: React.MouseEvent) => {
    e.stopPropagation();
    if (togglingId === p.id) return;

    // Validar bloqueo en cliente antes de mutar
    if (!p.completado) {
      const idx = pasos.findIndex((item) => item.id === p.id);
      if (idx > 0 && !pasos[idx - 1].completado) {
        setErrorLocal(`Debes completar primero el Paso ${pasos[idx - 1].numero_paso} ("${pasos[idx - 1].descripcion_paso}")`);
        setTimeout(() => setErrorLocal(null), 3500);
        return;
      }
    }

    setTogglingId(p.id);
    try {
      const res = await onTogglePaso(p.id, !p.completado);
      if (!res.success && res.error) {
        setErrorLocal(res.error);
        setTimeout(() => setErrorLocal(null), 3500);
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="pt-1.5" onClick={(e) => e.stopPropagation()}>
      {/* Botón Píldora de Pasos Procedurales */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 cursor-pointer select-none py-1 group/pill"
        title="Clic para ver/ocultar pasos procedurales"
      >
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs transition-transform group-hover/pill:scale-[1.02] ${colorPill}`}>
            <ListChecks className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums">{completados}/{total} pasos</span>
            <span className="font-mono tabular-nums text-[9px] opacity-75">({pct}%)</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
            <div
              className={`${colorBarra} h-full rounded-full transition-all duration-300`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Cajón Procedural Colapsable */}
      {isOpen && (
        <div className="mt-1 bg-slate-900/60 rounded-xl p-1.5 border border-slate-800/80 shadow-xs space-y-1">
          {errorLocal && (
            <div className="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] flex items-center justify-between gap-1.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 truncate">
                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">{errorLocal}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorLocal(null)}
                className="text-rose-400 hover:text-white text-xs font-bold shrink-0 ml-1 leading-none"
              >
                ×
              </button>
            </div>
          )}
          {pasos.map((p, idx) => {
            const isDone = p.completado;
            const prevDone = idx === 0 || pasos[idx - 1].completado;
            const estaBloqueado = !isDone && !prevDone;

            return (
              <div
                key={p.id}
                onClick={(e) => !estaBloqueado && togglingId !== p.id && handleToggle(p, e)}
                className={`flex items-center gap-2 py-1 px-1.5 rounded-lg transition-colors group/step ${
                  estaBloqueado || togglingId === p.id
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-slate-800/60 cursor-pointer'
                }`}
              >
                {/* Checkbox o Candado de Bloqueo */}
                <button
                  type="button"
                  disabled={estaBloqueado || togglingId === p.id}
                  onClick={(e) => handleToggle(p, e)}
                  className="shrink-0 p-0.5 rounded transition active:scale-95 focus:outline-none flex items-center justify-center disabled:opacity-60"
                  title={
                    estaBloqueado
                      ? `Bloqueado: Completa el Paso ${pasos[idx - 1].numero_paso} primero`
                      : isDone
                      ? 'Marcar como pendiente (desmarca en cascada posteriores)'
                      : `Completar paso ${p.numero_paso}`
                  }
                >
                  {isDone ? (
                    <span className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </span>
                  ) : estaBloqueado ? (
                    <span className="w-4 h-4 rounded border border-slate-700 bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded border border-slate-600 hover:border-sky-400 bg-slate-800/80 shrink-0 transition-colors" />
                  )}
                </button>

                <span className="font-mono tabular-nums text-[9px] font-bold text-slate-400 shrink-0">
                  P{p.numero_paso}
                </span>

                <span
                  className={`text-[11px] truncate select-none flex-1 ${
                    isDone
                      ? 'line-through text-slate-500'
                      : estaBloqueado
                      ? 'text-slate-500'
                      : 'text-slate-200'
                  }`}
                  title={p.descripcion_paso}
                >
                  {p.descripcion_paso}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
