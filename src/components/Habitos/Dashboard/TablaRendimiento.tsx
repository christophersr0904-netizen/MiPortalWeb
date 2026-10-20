import React, { useState, useMemo } from 'react';
import type { ActividadPersonal } from '../../../types';
import { CATEGORIAS_VIDA_MAP, type CategoriaVida } from '../../../types';
import {
  ListFilter,
  Search,
  Flame,
  CheckCircle2,
  Clock,
  Repeat,
  Target
} from 'lucide-react';

interface TablaRendimientoProps {
  actividades: ActividadPersonal[];
}

type OrdenColumna = 'RACHA' | 'NOMBRE' | 'CATEGORIA' | 'FECHA';

export const TablaRendimiento: React.FC<TablaRendimientoProps> = ({ actividades }) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaVida | 'TODOS'>('TODOS');
  const [orden, setOrden] = useState<OrdenColumna>('RACHA');

  const hoyStr = new Date().toISOString().split('T')[0];

  const actividadesFiltradas = useMemo(() => {
    return actividades
      .filter((a) => {
        if (filtroCategoria !== 'TODOS' && a.categoria_vida !== filtroCategoria) return false;
        if (busqueda.trim()) {
          const q = busqueda.toLowerCase();
          const n = a.nombre_actividad.toLowerCase();
          const m = (a.meta_macro_nombre || '').toLowerCase();
          if (!n.includes(q) && !m.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (orden === 'RACHA') {
          return (b.racha_actual || 0) - (a.racha_actual || 0);
        }
        if (orden === 'NOMBRE') {
          return a.nombre_actividad.localeCompare(b.nombre_actividad);
        }
        if (orden === 'CATEGORIA') {
          return a.categoria_vida.localeCompare(b.categoria_vida);
        }
        if (orden === 'FECHA') {
          return (a.fecha_programada || '').localeCompare(b.fecha_programada || '');
        }
        return 0;
      });
  }, [actividades, filtroCategoria, busqueda, orden]);

  return (
    <div className="portal-surface bg-white dark:bg-[#0D1526] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between">
      {/* CABECERA WIDGET Y CONTROLES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-400">
            <ListFilter className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Desglose Analítico por Hábito
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Rendimiento individual y estado de racha
            </p>
          </div>
        </div>

        {/* BUSCADOR Y FILTROS RÁPIDOS */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Input de Búsqueda */}
          <div className="relative">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar hábito..."
              className="w-32 sm:w-40 h-8 pl-8 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
          </div>

          {/* Selector de Categoría */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value as CategoriaVida | 'TODOS')}
            className="h-8 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
          >
            <option value="TODOS">Todas las Dimensiones</option>
            {Object.entries(CATEGORIAS_VIDA_MAP).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.nombre}
              </option>
            ))}
          </select>

          {/* Selector de Orden */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setOrden('RACHA')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                orden === 'RACHA'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              Racha
            </button>
            <button
              type="button"
              onClick={() => setOrden('NOMBRE')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                orden === 'NOMBRE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              Nombre
            </button>
          </div>
        </div>
      </div>

      {/* TABLA DE RENDIMIENTO */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/80 text-[10.5px] uppercase font-bold text-slate-400 dark:text-slate-500">
              <th className="py-2.5 px-3">Hábito / Compromiso</th>
              <th className="py-2.5 px-3">Dimensión</th>
              <th className="py-2.5 px-3">Tipo</th>
              <th className="py-2.5 px-3 text-center">Racha Actual</th>
              <th className="py-2.5 px-3">Próx. Programación</th>
              <th className="py-2.5 px-3 text-right">Estado Hoy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
            {actividadesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  No se encontraron hábitos con los criterios de búsqueda.
                </td>
              </tr>
            ) : (
              actividadesFiltradas.map((a) => {
                const cfg = CATEGORIAS_VIDA_MAP[a.categoria_vida];
                const racha = a.racha_actual || 0;
                const completadaHoy =
                  a.estado === '04_Completado' ||
                  a.ultima_fecha_completado === hoyStr ||
                  (a.tipo_compromiso === 'HABITUAL' && a.fecha_programada > hoyStr && racha > 0);

                return (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group"
                  >
                    {/* HÁBITO */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-400 transition-colors truncate max-w-[220px]">
                          {a.nombre_actividad}
                        </span>
                        {a.meta_macro_nombre && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                            {a.meta_macro_nombre}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* DIMENSIÓN */}
                    <td className="py-2.5 px-3">
                      {cfg ? (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.badgeClase}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.colorBarra}`} />
                          <span>{cfg.nombre.split(' ')[0]}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">{a.categoria_vida}</span>
                      )}
                    </td>

                    {/* TIPO */}
                    <td className="py-2.5 px-3">
                      {a.tipo_compromiso === 'HABITUAL' ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-indigo-400 font-medium">
                          <Repeat className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                          <span>{a.frecuencia_ciclo || 'Diario'}</span>
                        </span>
                      ) : a.tipo_compromiso === 'META' ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-teal-400 font-medium">
                          <Target className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                          <span>Meta</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10.5px]">Puntual</span>
                      )}
                    </td>

                    {/* RACHA ACTUAL */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1 font-mono tabular-nums font-bold text-xs">
                        {racha > 0 ? (
                          <>
                            <Flame className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                            <span className="text-amber-500">{racha}d</span>
                          </>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-normal">0d</span>
                        )}
                      </div>
                    </td>

                    {/* PRÓXIMA PROGRAMACIÓN */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500 shrink-0" strokeWidth={1.75} />
                        <span>{a.fecha_programada}</span>
                        {a.hora_inicio && <span className="text-slate-500">({a.hora_inicio})</span>}
                      </div>
                    </td>

                    {/* ESTADO HOY */}
                    <td className="py-2.5 px-3 text-right">
                      {completadaHoy ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={1.75} />
                          <span>Cumplido</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 text-[10px] font-medium">
                          <span>Pendiente</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
