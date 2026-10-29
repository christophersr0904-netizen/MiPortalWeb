import React, { useState } from 'react';
import type { ActividadPersonal, MetaPlanRecord } from '../../../types';
import { CATEGORIAS_VIDA_MAP } from '../../../types';
import { Target, Plus, ShieldCheck, ChevronRight, Compass } from 'lucide-react';
import Swal from 'sweetalert2';

interface MetasCuantitativasProps {
  actividades: ActividadPersonal[];
  metas?: MetaPlanRecord[];
  onRegistrarAvance: (act: any, valor: number) => Promise<unknown>;
  onCrearMeta?: () => void;
  onAbrirMeta360?: (metaId: string) => void;
}

interface ItemMetaCuantitativa {
  id: string;
  nombre: string;
  categoria_vida: any;
  meta_macro_nombre?: string;
  unidad_medida: string;
  valor_acumulado_actual: number;
  meta_objetivo_total: number;
  nivel_rescate_minimo: number;
  targetRef: ActividadPersonal | MetaPlanRecord;
}

export const MetasCuantitativas: React.FC<MetasCuantitativasProps> = ({
  actividades,
  metas,
  onRegistrarAvance,
  onCrearMeta,
  onAbrirMeta360
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Mapear desde metas_planes si existen registros, o fallback transparente a actividades_personales
  const itemsMetas: ItemMetaCuantitativa[] = (metas && metas.length > 0)
    ? metas.map((m) => ({
        id: m.id,
        nombre: m.nombre_meta,
        categoria_vida: m.categoria_vida,
        meta_macro_nombre: m.descripcion,
        unidad_medida: m.unidad_medida || 'unidades',
        valor_acumulado_actual: m.valor_acumulado_actual || 0,
        meta_objetivo_total: m.meta_objetivo_total || 1,
        nivel_rescate_minimo: m.nivel_rescate_minimo || 0,
        targetRef: m
      }))
    : actividades
        .filter(
          (a) => a.tipo_compromiso === 'META' || (a.meta_objetivo_total && a.meta_objetivo_total > 0)
        )
        .map((a) => ({
          id: a.id,
          nombre: a.nombre_actividad,
          categoria_vida: a.categoria_vida,
          meta_macro_nombre: a.meta_macro_nombre,
          unidad_medida: a.unidad_medida || 'unidades',
          valor_acumulado_actual: a.valor_acumulado_actual || 0,
          meta_objetivo_total: a.meta_objetivo_total || 1,
          nivel_rescate_minimo: a.nivel_rescate_minimo || 0,
          targetRef: a
        }));

  const handleSumarAvance = async (item: ItemMetaCuantitativa, incremento: number) => {
    try {
      setLoadingId(item.id);
      const actual = item.valor_acumulado_actual;
      const nuevoTotal = actual + incremento;
      await onRegistrarAvance(item.targetRef, nuevoTotal);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `+${incremento} ${item.unidad_medida} registrado`,
        showConfirmButton: false,
        timer: 1500,
        background: '#0D1526',
        color: '#f8fafc'
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handlePromptAvance = async (item: ItemMetaCuantitativa) => {
    const { value: cantidad } = await Swal.fire({
      title: `Registrar avance en ${item.nombre}`,
      input: 'number',
      inputLabel: `Cantidad a sumar (${item.unidad_medida})`,
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
      await handleSumarAvance(item, Number(cantidad));
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
          {itemsMetas.length} en seguimiento
        </span>
      </div>

      {/* LISTA DE METAS CUANTITATIVAS */}
      {itemsMetas.length === 0 ? (
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
          {itemsMetas.map((m) => {
            const actual = m.valor_acumulado_actual || 0;
            const total = m.meta_objetivo_total || 1;
            const unidad = m.unidad_medida || 'unidades';
            const pct = Math.min(100, Math.round((actual / total) * 100));
            const cfg = CATEGORIAS_VIDA_MAP[m.categoria_vida as keyof typeof CATEGORIAS_VIDA_MAP];

            // Porcentaje del nivel de rescate mínimo
            const rescate = m.nivel_rescate_minimo || 0;
            const rescatePct = rescate > 0 ? Math.min(100, Math.round((rescate / total) * 100)) : null;

            return (
              <div
                key={m.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between hover:border-teal-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      onClick={() => {
                        if (onAbrirMeta360) onAbrirMeta360(m.id);
                      }}
                      className={`text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-400 transition-colors ${
                        onAbrirMeta360 ? 'cursor-pointer hover:underline' : ''
                      }`}
                      title="Clic para abrir la Vista Detallada 360°"
                    >
                      {m.nombre}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onAbrirMeta360 && (
                        <button
                          type="button"
                          onClick={() => onAbrirMeta360(m.id)}
                          className="px-1.5 py-0.5 rounded-md bg-sky-950/60 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-800/60 text-[9.5px] font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Abrir Vista Detallada 360°"
                        >
                          <Compass className="w-3 h-3" strokeWidth={1.75} />
                          <span>360°</span>
                        </button>
                      )}
                      {cfg && (
                        <span className={`text-[9.5px] font-bold px-2 py-0.2 rounded-md border ${cfg.badgeClase} truncate`}>
                          {cfg.nombre.split(' ')[0]}
                        </span>
                      )}
                    </div>
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
