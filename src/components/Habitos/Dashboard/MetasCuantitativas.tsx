import React, { useState } from 'react';
import type { ActividadPersonal } from '../../../types';
import { CATEGORIAS_VIDA_MAP } from '../../../types';
import { Target, Plus, ShieldCheck, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';

interface MetasCuantitativasProps {
  actividades: ActividadPersonal[];
  onRegistrarAvance: (act: ActividadPersonal, valor: number) => Promise<unknown>;
  onCrearMeta?: () => void;
}

export const MetasCuantitativas: React.FC<MetasCuantitativasProps> = ({
  actividades,
  onRegistrarAvance,
  onCrearMeta
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Filtrar actividades cuantitativas
  const metas = actividades.filter(
    (a) => a.tipo_compromiso === 'META' || (a.meta_objetivo_total && a.meta_objetivo_total > 0)
  );

  const handleSumarAvance = async (act: ActividadPersonal, incremento: number) => {
    try {
      setLoadingId(act.id);
      const actual = act.valor_acumulado_actual || 0;
      const nuevoTotal = actual + incremento;
      await onRegistrarAvance(act, nuevoTotal);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `+${incremento} ${act.unidad_medida || 'unidades'} registrado`,
        showConfirmButton: false,
        timer: 1500,
        background: '#0D1526',
        color: '#f8fafc'
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handlePromptAvance = async (act: ActividadPersonal) => {
    const { value: cantidad } = await Swal.fire({
      title: `Registrar avance en ${act.nombre_actividad}`,
      input: 'number',
      inputLabel: `Cantidad a sumar (${act.unidad_medida || 'unidades'})`,
      inputPlaceholder: 'Ej: 5',
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
      background: '#0D1526',
      color: '#f8fafc',
      inputValidator: (v) => {
        if (!v || isNaN(Number(v)) || Number(v) <= 0) {
          return 'Ingresa una cantidad numérica válida mayor a 0';
        }
        return null;
      }
    });

    if (cantidad) {
      await handleSumarAvance(act, Number(cantidad));
    }
  };

  return (
    <div className="portal-surface bg-white dark:bg-[#0D1526] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between">
      {/* CABECERA WIDGET */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-400">
            <Target className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Monitor de Metas Cuantitativas
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Progreso acumulativo y umbral de rescate mínimo
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 font-mono tabular-nums">
          {metas.length} en seguimiento
        </span>
      </div>

      {/* LISTA DE METAS CUANTITATIVAS */}
      {metas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-2">
            <Target className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <p className="text-xs font-bold text-slate-300">No hay metas cuantitativas activas</p>
          <p className="text-[11px] text-slate-500 max-w-[280px] mt-0.5 mb-3">
            Registra compromisos numéricos con unidades de medida (ej. Leer 500 páginas, Correr 100 km).
          </p>
          {onCrearMeta && (
            <button
              type="button"
              onClick={onCrearMeta}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Crear Meta Cuantitativa</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1">
          {metas.map((m) => {
            const actual = m.valor_acumulado_actual || 0;
            const total = m.meta_objetivo_total || 1;
            const unidad = m.unidad_medida || 'unidades';
            const pct = Math.min(100, Math.round((actual / total) * 100));
            const cfg = CATEGORIAS_VIDA_MAP[m.categoria_vida];

            // Porcentaje del nivel de rescate mínimo
            const rescate = m.nivel_rescate_minimo || 0;
            const rescatePct = rescate > 0 ? Math.min(100, Math.round((rescate / total) * 100)) : null;

            return (
              <div
                key={m.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between hover:border-teal-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-400 transition-colors">
                      {m.nombre_actividad}
                    </span>
                    {cfg && (
                      <span className={`text-[9.5px] font-bold px-2 py-0.2 rounded-md border ${cfg.badgeClase} truncate`}>
                        {cfg.nombre.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {m.meta_macro_nombre && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mb-2">
                      Macro: {m.meta_macro_nombre}
                    </p>
                  )}

                  {/* Números de progreso */}
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm font-black font-mono tabular-nums text-slate-800 dark:text-white">
                      {actual.toLocaleString('es-PE')} <span className="text-[10px] text-slate-400 font-normal">/ {total.toLocaleString('es-PE')} {unidad}</span>
                    </span>
                    <span className="text-xs font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400">
                      {pct}%
                    </span>
                  </div>

                  {/* Barra de progreso con indicador de rescate */}
                  <div className="relative w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                    {rescatePct !== null && rescatePct > 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                        style={{ left: `${rescatePct}%` }}
                        title={`Nivel de Rescate Mínimo: ${rescate} ${unidad}`}
                      />
                    )}
                  </div>

                  {/* Leyenda de rescate */}
                  {rescate > 0 && (
                    <div className="flex items-center gap-1 text-[9.5px] text-slate-400 dark:text-slate-500 font-medium mb-3">
                      <ShieldCheck className="w-3 h-3 text-amber-500 shrink-0" strokeWidth={1.75} />
                      <span>Rescate mínimo: <span className="font-mono font-bold text-amber-500">{rescate} {unidad}</span></span>
                    </div>
                  )}
                </div>

                {/* Acciones rápidas de avance */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/60 mt-1">
                  <span className="text-[10px] text-slate-400">Sumar avance:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={loadingId === m.id}
                      onClick={() => handleSumarAvance(m, 1)}
                      className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-teal-600 hover:text-white text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold transition cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      disabled={loadingId === m.id}
                      onClick={() => handleSumarAvance(m, 5)}
                      className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-teal-600 hover:text-white text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold transition cursor-pointer"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      disabled={loadingId === m.id}
                      onClick={() => handlePromptAvance(m)}
                      className="px-2 py-0.5 rounded-md bg-teal-600/20 text-teal-400 hover:bg-teal-600 hover:text-white text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Otro</span>
                      <ChevronRight className="w-3 h-3" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
