/**
 * ============================================================================
 * ARCHIVO: src/components/Habitos/Dashboard/GraficoDesfaseEsfuerzo.tsx
 * SISTEMA: PMO Personal & Life OS
 * REQUISITO: REQ-METRICS-EXECUTION-03
 * DESCRIPCIÓN: Panel visual de Desfase Temporal (Mora/Adelanto) y Rendimiento de
 *              Esfuerzo Real bajo el estándar Cobalt Aerodynamic A.2.2.
 *              Incluye KPIs de puntualidad y gráfico divergente SVG nativo.
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Target,
  Layers,
  CalendarClock
} from 'lucide-react';
import type { ActividadPersonal, HabitoLogRecord, MetaPlanRecord, HabitoMetaVinculo } from '../../../types';
import { CATEGORIAS_VIDA_MAP } from '../../../types';
import { SelectIconicoCobalt, type OpcionSelectCobalt } from '../../UI/SelectIconicoCobalt';
import { clasificarDesfase, calcularDesviacionEsfuerzo } from '../../../utils/metricasEjecucionHelpers';

export interface GraficoDesfaseEsfuerzoProps {
  actividades: ActividadPersonal[];
  logs: HabitoLogRecord[];
  metas?: MetaPlanRecord[];
  vinculos?: HabitoMetaVinculo[];
}

export const GraficoDesfaseEsfuerzo: React.FC<GraficoDesfaseEsfuerzoProps> = ({
  actividades,
  logs,
  metas = [],
  vinculos = []
}) => {
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroMetaId, setFiltroMetaId] = useState<string>('TODAS');

  // Mapa rápido de actividad por ID
  const mapActividades = useMemo(() => {
    const map = new Map<string, ActividadPersonal>();
    for (const a of actividades) {
      map.set(a.id, a);
    }
    return map;
  }, [actividades]);

  // Mapa de hábitos vinculados a cada meta
  const habitosPorMeta = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const v of vinculos) {
      if (!map.has(v.meta_id)) map.set(v.meta_id, new Set());
      map.get(v.meta_id)!.add(v.habito_id);
    }
    for (const m of metas) {
      if (!map.has(m.id)) map.set(m.id, new Set());
      if (m.habitoId) map.get(m.id)!.add(m.habitoId);
      if (m.habito_id) map.get(m.id)!.add(m.habito_id);
      if (Array.isArray(m.habitoIds)) m.habitoIds.forEach((h) => map.get(m.id)!.add(h));
      if (Array.isArray(m.habito_ids)) m.habito_ids.forEach((h) => map.get(m.id)!.add(h));
    }
    return map;
  }, [metas, vinculos]);

  // Opciones de selector de categorías
  const opcionesCategorias: OpcionSelectCobalt[] = useMemo(() => {
    const base: OpcionSelectCobalt[] = [
      { valor: 'TODAS', etiqueta: 'Todas las categorías', icono: Layers }
    ];
    for (const [clave, conf] of Object.entries(CATEGORIAS_VIDA_MAP)) {
      base.push({
        valor: clave,
        etiqueta: conf.nombre
      });
    }
    return base;
  }, []);

  // Opciones de selector de metas
  const opcionesMetas: OpcionSelectCobalt[] = useMemo(() => {
    const base: OpcionSelectCobalt[] = [
      { valor: 'TODAS', etiqueta: 'Todas las metas', icono: Target }
    ];
    for (const m of metas) {
      base.push({
        valor: m.id,
        etiqueta: m.nombre_meta || (m as any).titulo || 'Meta sin nombre'
      });
    }
    return base;
  }, [metas]);

  // Filtrado reactivo de logs con desfase registrado
  const logsFiltrados = useMemo(() => {
    return logs
      .filter((l) => {
        if (!l.completado) return false;
        if (l.dias_desfase === undefined || l.dias_desfase === null) return false;

        const act = mapActividades.get(l.habito_id);

        // Filtro por Categoría / Pilar
        if (filtroCategoria !== 'TODAS' && act && act.categoria_vida !== filtroCategoria) {
          return false;
        }

        // Filtro por Meta Macro
        if (filtroMetaId !== 'TODAS') {
          const habitosValidos = habitosPorMeta.get(filtroMetaId);
          if (!habitosValidos || !habitosValidos.has(l.habito_id)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (b.fecha_registro || '').localeCompare(a.fecha_registro || ''));
  }, [logs, mapActividades, filtroCategoria, filtroMetaId, habitosPorMeta]);

  // Métricas agregadas de los logs filtrados
  const metricas = useMemo(() => {
    const total = logsFiltrados.length;
    if (total === 0) {
      return {
        total: 0,
        desfasePromedio: null,
        tasaPuntualidad: null,
        desviacionEsfuerzo: calcularDesviacionEsfuerzo(0, 0)
      };
    }

    const sumaDesfase = logsFiltrados.reduce((acc, l) => acc + (l.dias_desfase || 0), 0);
    const desfasePromedio = Number((sumaDesfase / total).toFixed(1));

    const completadosATiempoOAdelanto = logsFiltrados.filter((l) => (l.dias_desfase || 0) <= 0).length;
    const tasaPuntualidad = Math.round((completadosATiempoOAdelanto / total) * 100);

    const sumEst = logsFiltrados.reduce((acc, l) => acc + (l.duracion_estimada_horas || 0), 0);
    const sumReal = logsFiltrados.reduce((acc, l) => acc + (l.duracion_real_horas || 0), 0);
    const desviacionEsfuerzo = calcularDesviacionEsfuerzo(sumEst, sumReal);

    return {
      total,
      desfasePromedio,
      tasaPuntualidad,
      desviacionEsfuerzo
    };
  }, [logsFiltrados]);

  // Logs para la cuadrícula visual divergente (máx. últimos 14)
  const itemsVisuales = useMemo(() => {
    return logsFiltrados.slice(0, 14);
  }, [logsFiltrados]);

  // Rango máximo para escala del gráfico divergente
  const maxDiasEscala = useMemo(() => {
    if (itemsVisuales.length === 0) return 5;
    const maxVal = Math.max(...itemsVisuales.map((l) => Math.abs(l.dias_desfase || 0)));
    return Math.max(4, Math.min(20, maxVal));
  }, [itemsVisuales]);

  return (
    <div className="portal-surface bg-[#0D1526] p-4 lg:p-5 rounded-2xl border border-slate-800/60 shadow-cobalt-1 space-y-4">
      {/* 1. CABECERA: TÍTULO Y SELECTORES DE FILTRO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-sky-950/60 border border-sky-800/40 flex items-center justify-center text-sky-400 shrink-0">
            <CalendarClock className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Trazabilidad de Desfase y Esfuerzo Real</span>
              <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/50 border border-sky-800/40 px-2 py-0.5 rounded-full">
                Lead / Lag Realtime
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Mora o adelanto en días respecto a la fecha original programada y horas reales invertidas.
            </p>
          </div>
        </div>

        {/* Filtros Dropdown Cobalt */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-48">
            <SelectIconicoCobalt
              valor={filtroCategoria}
              onChange={setFiltroCategoria}
              opciones={opcionesCategorias}
            />
          </div>
          {metas.length > 0 && (
            <div className="w-48">
              <SelectIconicoCobalt
                valor={filtroMetaId}
                onChange={setFiltroMetaId}
                opciones={opcionesMetas}
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. KPIS MICRO-CARDS (3 TARJETAS COBALT CON TABULAR-NUMS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI 1: DESFASE PROMEDIO */}
        <div className="bg-[#090E1A]/80 p-3 rounded-xl border border-slate-800/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Desfase Promedio
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-black font-mono tabular-nums ${
                metricas.desfasePromedio === null
                  ? 'text-slate-500'
                  : metricas.desfasePromedio <= 0
                  ? 'text-emerald-400'
                  : metricas.desfasePromedio <= 2
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {metricas.desfasePromedio === null
                ? '—'
                : metricas.desfasePromedio > 0
                ? `+${metricas.desfasePromedio}d`
                : `${metricas.desfasePromedio}d`}
            </span>
            {metricas.desfasePromedio !== null && (
              <span className="text-[10.5px] font-semibold text-slate-400">
                {metricas.desfasePromedio < 0
                  ? 'Adelanto promedio'
                  : metricas.desfasePromedio === 0
                  ? 'Exacto a tiempo'
                  : 'Mora acumulada'}
              </span>
            )}
          </div>
          <span className="text-[9.5px] text-slate-500 block">
            {metricas.total} ejecuciones auditadas
          </span>
        </div>

        {/* KPI 2: TASA DE PUNTUALIDAD */}
        <div className="bg-[#090E1A]/80 p-3 rounded-xl border border-slate-800/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Tasa de Puntualidad
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-black font-mono tabular-nums ${
                metricas.tasaPuntualidad === null
                  ? 'text-slate-500'
                  : metricas.tasaPuntualidad >= 80
                  ? 'text-emerald-400'
                  : metricas.tasaPuntualidad >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {metricas.tasaPuntualidad === null ? '—' : `${metricas.tasaPuntualidad}%`}
            </span>
            {metricas.tasaPuntualidad !== null && (
              <span className="text-[10.5px] font-semibold text-slate-400">
                a tiempo o antes
              </span>
            )}
          </div>
          <span className="text-[9.5px] text-slate-500 block">
            Sin arrastre de mora
          </span>
        </div>

        {/* KPI 3: ESFUERZO REAL VS ESTIMADO */}
        <div className="bg-[#090E1A]/80 p-3 rounded-xl border border-slate-800/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Esfuerzo Real / Plan
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black font-mono tabular-nums text-slate-100">
              {metricas.desviacionEsfuerzo.real.toFixed(1)}h
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              / {metricas.desviacionEsfuerzo.estimado.toFixed(1)}h
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9.5px] font-mono tabular-nums">
            {metricas.desviacionEsfuerzo.deltaHoras !== 0 ? (
              <span
                className={
                  metricas.desviacionEsfuerzo.deltaHoras > 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }
              >
                {metricas.desviacionEsfuerzo.deltaHoras > 0 ? '+' : ''}
                {metricas.desviacionEsfuerzo.deltaHoras.toFixed(1)}h{' '}
                {metricas.desviacionEsfuerzo.deltaHoras > 0 ? 'sobrecosto' : 'ahorro'}
              </span>
            ) : (
              <span className="text-sky-400">Sin variación de esfuerzo</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. GRÁFICO DIVERGENTE SVG NATIVO O ESTADO VACÍO */}
      {itemsVisuales.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#080D1A]/60 border border-slate-800/40 space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" strokeWidth={1.5} />
          <h4 className="text-xs font-bold text-slate-300">
            Sin registros de ejecución para el filtro seleccionado
          </h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Completa actividades o hábitos para comenzar a medir automáticamente tu desfase temporal y horas invertidas.
          </p>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              ← Adelanto (-días)
            </span>
            <span className="font-bold text-sky-400">Línea Base: A Tiempo (0d)</span>
            <span className="flex items-center gap-1 text-rose-400">
              Mora (+días) →
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            </span>
          </div>

          {/* Lista de Barras Divergentes SVG */}
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {itemsVisuales.map((log) => {
              const act = mapActividades.get(log.habito_id);
              const nombre = act?.nombre_actividad || (act as any)?.nombre || 'Actividad';
              const dias = log.dias_desfase ?? 0;
              const clasif = clasificarDesfase(dias);
              const durReal = log.duracion_real_horas ?? 0;
              const durEst = log.duracion_estimada_horas ?? 0;

              // Porcentaje sobre la mitad del gráfico (50%)
              const pctBarra = Math.min(50, Math.round((Math.abs(dias) / maxDiasEscala) * 48));

              return (
                <div
                  key={log.id}
                  className="group relative flex items-center gap-2 p-1.5 rounded-lg bg-[#080D1A]/70 hover:bg-[#0D1526] border border-slate-800/50 hover:border-slate-700/80 transition-colors text-xs"
                >
                  {/* Fecha y Título */}
                  <div className="w-36 sm:w-48 shrink-0 min-w-0">
                    <span className="text-[10px] font-mono text-slate-500 block truncate">
                      {log.fecha_registro}
                    </span>
                    <span
                      className="font-medium text-slate-200 group-hover:text-sky-300 transition-colors block truncate text-[11px]"
                      title={nombre}
                    >
                      {nombre}
                    </span>
                  </div>

                  {/* Canvas SVG Divergente */}
                  <div className="flex-1 h-5 relative flex items-center">
                    {/* Eje central en 50% */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-slate-700/80 -translate-x-1/2 z-10" />

                    {/* Barra de Adelanto (Izquierda de 50%) */}
                    {dias < 0 && (
                      <div
                        className="absolute right-1/2 h-3.5 bg-gradient-to-l from-emerald-500 to-teal-400 rounded-l-sm transition-[width] duration-300"
                        style={{ width: `${pctBarra}%` }}
                        title={`Adelanto: ${dias} días`}
                      />
                    )}

                    {/* Indicador Central: A Tiempo (0d) */}
                    {dias === 0 && (
                      <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)] z-20"
                        title="Completado a tiempo (0d)"
                      />
                    )}

                    {/* Barra de Mora (Derecha de 50%) */}
                    {dias > 0 && (
                      <div
                        className="absolute left-1/2 h-3.5 bg-gradient-to-r from-amber-500 to-rose-500 rounded-r-sm transition-[width] duration-300"
                        style={{ width: `${pctBarra}%` }}
                        title={`Mora: +${dias} días`}
                      />
                    )}
                  </div>

                  {/* Badge numérico de desfase y esfuerzo */}
                  <div className="w-24 shrink-0 text-right font-mono tabular-nums text-[10.5px]">
                    <span
                      className={`inline-block font-bold ${
                        dias < 0
                          ? 'text-emerald-400'
                          : dias === 0
                          ? 'text-sky-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {clasif.etiqueta}
                    </span>
                    <span className="text-slate-500 text-[9.5px] block">
                      {durReal}h / {durEst}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
