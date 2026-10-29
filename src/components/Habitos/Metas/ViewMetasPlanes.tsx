import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import {
  Target,
  Plus,
  Layers,
  Activity,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Flame,
  CheckSquare,
  Square,
  ShieldCheck,
  Compass
} from 'lucide-react';
import {
  deduplicarPorCodigoCanonico,
  deduplicarMetasPlanes,
  deduplicarHitosPlan,
  deduplicarVinculosMeta
} from '../../../utils/entityNormalizer';
import { ModalDetalleMeta360 } from './ModalDetalleMeta360';
import { HistogramaSeguimientoTemporal } from '../HistogramaSeguimientoTemporal';
import {
  CATEGORIAS_VIDA_MAP,
  type CategoriaVida,
  type MetaPlanRecord,
  type HitoPlanRecord,
  type HabitoMetaVinculo,
  type ActividadPersonal,
  type HabitoLogRecord
} from '../../../types';
import {
  conmutarHitoPlanLocal,
  eliminarMetaPlanLocal,
  calcularProgresoBimodal,
  sincronizarMetasInternasHaciaPlanesLocal,
  calcularProyeccionMeta,
  type MetaConDetalle
} from '../../../services/metasService';
import { ModalMetaPlanFlow } from '../../Modals/ModalMetaPlanFlow';
import Swal from 'sweetalert2';

interface ViewMetasPlanesProps {
  onCrearMeta?: () => void;
}

export const ViewMetasPlanes: React.FC<ViewMetasPlanesProps> = () => {
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaVida | 'TODAS'>('TODAS');
  const [modalFlowAbierto, setModalFlowAbierto] = useState(false);
  const [metaParaEditar, setMetaParaEditar] = useState<MetaPlanRecord | null>(null);
  const [metaSeleccionada360Id, setMetaSeleccionada360Id] = useState<string | null>(null);
  const [hitosExpandidosMap, setHitosExpandidosMap] = useState<Record<string, boolean>>({});

  // Promoción automática de metas internas preexistentes hacia metas_planes (REQ-HABITS-CREATE-METAS-INLINE-15)
  useEffect(() => {
    sincronizarMetasInternasHaciaPlanesLocal().catch((e) => {
      console.warn('[ViewMetasPlanes] Error al sincronizar metas internas:', e);
    });
  }, []);

  // Consultas reactivas en vivo a Dexie con latencia 0 ms y deduplicación canónica
  const rawTodasLasMetas = useLiveQuery(() => db.metas_planes.toArray(), [], [] as MetaPlanRecord[]);
  const rawTodosLosHitos = useLiveQuery(() => db.planes_accion_hitos.toArray(), [], [] as HitoPlanRecord[]);
  const rawTodosLosVinculos = useLiveQuery(() => db.habitos_metas_vinculos.toArray(), [], [] as HabitoMetaVinculo[]);
  const rawTodasLasActividades = useLiveQuery(() => db.actividades_personales.toArray(), [], [] as ActividadPersonal[]);
  const logs = useLiveQuery(() => db.habito_cumplimiento_logs.toArray(), []) || [];

  const todasLasMetas = useMemo(() => deduplicarMetasPlanes(rawTodasLasMetas), [rawTodasLasMetas]);
  const todosLosHitos = useMemo(() => deduplicarHitosPlan(rawTodosLosHitos), [rawTodosLosHitos]);
  const todosLosVinculos = useMemo(() => deduplicarVinculosMeta(rawTodosLosVinculos), [rawTodosLosVinculos]);
  const todasLasActividades = useMemo(() => deduplicarPorCodigoCanonico(rawTodasLasActividades), [rawTodasLasActividades]);

  // Mapeo en memoria O(1) de logs por habito_id
  const logsPorHabito = useMemo(() => {
    const map = new Map<string, HabitoLogRecord[]>();
    for (const l of logs) {
      if (!map.has(l.habito_id)) {
        map.set(l.habito_id, []);
      }
      map.get(l.habito_id)!.push(l);
    }
    return map;
  }, [logs]);

  // Consolidación en memoria O(N) con cálculo de progreso bimodal
  const metasDetalladas: MetaConDetalle[] = useMemo(() => {
    const mapAct = new Map<string, ActividadPersonal>(todasLasActividades.map((a) => [a.id, a]));
    const mapHitos = new Map<string, HitoPlanRecord[]>();
    for (const h of todosLosHitos) {
      if (!mapHitos.has(h.meta_id)) mapHitos.set(h.meta_id, []);
      mapHitos.get(h.meta_id)!.push(h);
    }

    const mapVin = new Map<string, (HabitoMetaVinculo & { habito?: ActividadPersonal })[]>();
    for (const v of todosLosVinculos) {
      if (!mapVin.has(v.meta_id)) mapVin.set(v.meta_id, []);
      mapVin.get(v.meta_id)!.push({
        ...v,
        habito: mapAct.get(v.habito_id)
      });
    }

    return todasLasMetas.map((m) => {
      const hitosMeta = (mapHitos.get(m.id) || []).sort(
        (a, b) => (a.orden_secuencia || 0) - (b.orden_secuencia || 0)
      );
      const vinculosMeta = mapVin.get(m.id) || [];
      const calculo = calcularProgresoBimodal(m, hitosMeta, vinculosMeta);

      return {
        ...m,
        hitos: hitosMeta,
        vinculos: vinculosMeta,
        ...calculo
      };
    });
  }, [todasLasMetas, todosLosHitos, todosLosVinculos, todasLasActividades]);

  // Filtrado reactivo por categoría
  const metasFiltradas = useMemo(() => {
    if (filtroCategoria === 'TODAS') return metasDetalladas;
    return metasDetalladas.filter((m) => m.categoria_vida === filtroCategoria);
  }, [metasDetalladas, filtroCategoria]);

  // KPIs Bento Globales
  const kpis = useMemo(() => {
    const totalMetas = metasDetalladas.length;
    let totalHitos = 0;
    let hitosCumplidos = 0;
    let sumaProgreso = 0;
    let vinculosActivos = 0;

    for (const m of metasDetalladas) {
      totalHitos += m.hitos.length;
      hitosCumplidos += m.hitos.filter((h) => h.completado).length;
      sumaProgreso += m.progresoGlobalPct;
      vinculosActivos += m.vinculos.length;
    }

    const avancePromedio = totalMetas > 0 ? Math.round(sumaProgreso / totalMetas) : 0;
    const hitosPct = totalHitos > 0 ? Math.round((hitosCumplidos / totalHitos) * 100) : 0;

    return {
      totalMetas,
      totalHitos,
      hitosCumplidos,
      hitosPct,
      avancePromedio,
      vinculosActivos
    };
  }, [metasDetalladas]);

  const toggleExpandirHitos = (metaId: string) => {
    setHitosExpandidosMap((prev) => ({
      ...prev,
      [metaId]: !prev[metaId]
    }));
  };

  const handleToggleHito = async (hito: HitoPlanRecord) => {
    try {
      await conmutarHitoPlanLocal(hito.id, !hito.completado);
    } catch (e) {
      console.error('Error al conmutar hito:', e);
    }
  };

  const handleEditarMeta = (meta: MetaPlanRecord) => {
    setMetaParaEditar(meta);
    setModalFlowAbierto(true);
  };

  const handleEliminarMeta = async (meta: MetaPlanRecord) => {
    const { isConfirmed } = await Swal.fire({
      title: `¿Eliminar "${meta.nombre_meta}"?`,
      text: 'Se eliminarán sus hitos y vínculos asociados en Dexie local.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e11d48',
      background: '#0D1526',
      color: '#f8fafc'
    });

    if (isConfirmed) {
      await eliminarMetaPlanLocal(meta.id);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Meta eliminada',
        showConfirmButton: false,
        timer: 1500,
        background: '#0D1526',
        color: '#f8fafc'
      });
    }
  };

  return (
    <div
      id="view-metas-planes-container"
      className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 lg:p-6 bg-slate-100 dark:bg-slate-950 transition-colors duration-200 space-y-4 lg:space-y-5 scrollbar-thin scrollbar-thumb-slate-800"
    >
      {/* 1. HERO BENTO CARDS DE MÉTRICAS GLOBALES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Card 1: Total Metas */}
        <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-[#0D1526] border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Metas Estratégicas</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-500">
              <Target className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {kpis.totalMetas}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Objetivos macro activos
            </p>
          </div>
        </div>

        {/* Card 2: Hitos Cumplidos */}
        <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-[#0D1526] border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Hitos de Plan</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {kpis.hitosCumplidos} <span className="text-sm font-normal text-slate-400">/ {kpis.totalHitos}</span>
            </div>
            <p className="text-[11px] text-indigo-400 font-semibold font-mono tabular-nums mt-0.5">
              {kpis.hitosPct}% completitud procedural
            </p>
          </div>
        </div>

        {/* Card 3: Avance Global Bimodal */}
        <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-[#0D1526] border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avance Global</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {kpis.avancePromedio}%
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Promedio bimodal consolidado
            </p>
          </div>
        </div>

        {/* Card 4: Hábitos Motores */}
        <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-[#0D1526] border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Hábitos Motores</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-400">
              <Activity className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {kpis.vinculosActivos}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Vínculos N:M con consistencia
            </p>
          </div>
        </div>
      </div>

      {/* 1.5. HISTOGRAMA TEMPORAL DE SEGUIMIENTO POR META Y UNIDAD DE MEDIDA */}
      <HistogramaSeguimientoTemporal
        metasDisponibles={todasLasMetas}
        actividades={todasLasActividades}
        vinculos={todosLosVinculos}
        logs={logs}
        onAbrirMeta360={(m) => setMetaSeleccionada360Id(m.id)}
      />

      {/* 2. BARRA DE CONTROL, FILTROS GHOST Y ACCIÓN PRIMARIA */}
      <div className="portal-surface p-3.5 rounded-2xl bg-white dark:bg-[#0D1526] border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filtros por Categoría de Vida (Ghost Controls) */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          <button
            type="button"
            onClick={() => setFiltroCategoria('TODAS')}
            className={`text-xs transition-colors px-2.5 py-1 rounded-lg cursor-pointer ${
              filtroCategoria === 'TODAS'
                ? 'text-sky-300 font-semibold bg-sky-950/40 border border-sky-800/50 shadow-xs'
                : 'text-slate-400 font-medium hover:text-sky-300'
            }`}
          >
            Todas ({metasDetalladas.length})
          </button>

          {(Object.keys(CATEGORIAS_VIDA_MAP) as CategoriaVida[]).map((catKey) => {
            const cfg = CATEGORIAS_VIDA_MAP[catKey];
            const activa = filtroCategoria === catKey;
            const count = metasDetalladas.filter((m) => m.categoria_vida === catKey).length;
            if (count === 0 && !activa) return null;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setFiltroCategoria(catKey)}
                className={`text-xs transition-colors px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activa
                    ? 'text-sky-300 font-semibold bg-sky-950/40 border border-sky-800/50 shadow-xs'
                    : 'text-slate-400 font-medium hover:text-sky-300'
                }`}
              >
                <span>{cfg.nombre.split(' ')[0]}</span>
                <span className="font-mono text-[10px] text-slate-500">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Botón Primario: Nueva Meta */}
        <button
          type="button"
          onClick={() => {
            setMetaParaEditar(null);
            setModalFlowAbierto(true);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-900/30 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          <span>Nueva Meta & Plan</span>
        </button>
      </div>

      {/* 3. GRID DE TARJETAS DE METAS ESTRATÉGICAS */}
      {metasFiltradas.length === 0 ? (
        <div className="portal-surface p-10 rounded-2xl bg-white dark:bg-[#0D1526] border border-slate-200/80 dark:border-slate-800/40 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-400">
            <Target className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h4 className="text-sm font-bold text-slate-200">No hay metas ni planes configurados</h4>
          <p className="text-xs text-slate-400 max-w-md">
            Crea una meta bimodal para articular objetivos cuantitativos con hitos secuenciales y hábitos motores de vida.
          </p>
          <button
            type="button"
            onClick={() => {
              setMetaParaEditar(null);
              setModalFlowAbierto(true);
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>Crear Primera Meta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metasFiltradas.map((meta) => {
            const cfg = CATEGORIAS_VIDA_MAP[meta.categoria_vida];
            const expandido = Boolean(hitosExpandidosMap[meta.id]);
            const totalHitos = meta.hitos.length;
            const hitosHechos = meta.hitos.filter((h) => h.completado).length;

            const habitosIds = meta.vinculos.map((v) => v.habito_id);
            const logsMeta: HabitoLogRecord[] = [];
            for (const id of habitosIds) {
              const list = logsPorHabito.get(id);
              if (list) logsMeta.push(...list);
            }
            const proyeccion = calcularProyeccionMeta(meta, logsMeta, meta.hitos);

            return (
              <div
                key={meta.id}
                className="portal-surface rounded-2xl bg-white dark:bg-[#0D1526] border border-slate-200/80 dark:border-slate-800/40 p-4 lg:p-5 flex flex-col justify-between hover:translate-y-[-2px] transition-all group"
                style={{
                  boxShadow: '0 10px 25px -5px rgba(2, 6, 23, 0.8), 0 8px 10px -6px rgba(30, 58, 138, 0.18)'
                }}
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {cfg && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.badgeClase}`}>
                          {cfg.nombre}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        {meta.codigo_legado}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60">
                        {meta.estado.replace(/^\d+_/, '').replace(/_/g, ' ')}
                      </span>
                      {/* Badge de Proyección y Velocidad Real */}
                      <span
                        className={`text-[10px] font-semibold font-mono tabular-nums px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          proyeccion.estadoSalud === 'ADELANTADO'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : proyeccion.estadoSalud === 'A_TIEMPO'
                            ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                            : proyeccion.estadoSalud === 'RIESGO'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : proyeccion.estadoSalud === 'CRITICO'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-slate-800/40 text-slate-400 border-slate-700/40'
                        }`}
                        title={`Ritmo: ${proyeccion.velocidadDiaria.toFixed(1)} ${meta.unidad_medida || 'unid'}/día · Proyectado: ${proyeccion.fechaProyectada || 'Indeterminado'}`}
                      >
                        {proyeccion.mensajeBadge}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setMetaSeleccionada360Id(meta.id)}
                        className="px-2 py-1 rounded-lg bg-sky-950/50 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-800/60 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Abrir Vista Detallada 360° de la Meta y Plan"
                      >
                        <Compass className="w-3 h-3" strokeWidth={1.75} />
                        <span>360°</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditarMeta(meta)}
                        className="text-slate-500 hover:text-teal-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
                        title="Editar Meta & Plan"
                      >
                        <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarMeta(meta)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
                        title="Eliminar Meta"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  {/* Título y Descripción */}
                  <h4
                    onClick={() => setMetaSeleccionada360Id(meta.id)}
                    className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-400 transition-colors mb-1 cursor-pointer"
                    title="Clic para abrir la Vista Detallada 360°"
                  >
                    {meta.nombre_meta}
                  </h4>
                  {meta.descripcion && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {meta.descripcion}
                    </p>
                  )}

                  {/* Barra de Progreso Bimodal */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 mb-3.5">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-teal-400" strokeWidth={1.75} />
                        <span>Progreso Bimodal</span>
                      </span>
                      <span className="text-sm font-black font-mono tabular-nums text-teal-400">
                        {meta.progresoGlobalPct}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${meta.progresoGlobalPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Hitos: <strong className="text-slate-200 font-bold">{meta.avanceHitosPct}%</strong> ({meta.peso_hitos_pct}%)</span>
                      <span>Hábitos: <strong className="text-slate-200 font-bold">{meta.avanceHabitosPct}%</strong> ({meta.peso_habitos_pct}%)</span>
                    </div>

                    {/* Línea informativa de ritmo y fecha proyectada */}
                    <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                      <span>
                        Ritmo: <strong className="text-slate-200 font-bold">{proyeccion.velocidadDiaria.toFixed(1)} {meta.unidad_medida || 'unid'}/día</strong>
                      </span>
                      <span>
                        Proyectado: <strong className="text-slate-200 font-bold">{proyeccion.fechaProyectada || 'Indeterminado'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Acumulado Cuantitativo (si aplica) */}
                  {meta.meta_objetivo_total > 0 && (
                    <div className="flex items-center justify-between text-xs mb-3 px-1">
                      <span className="text-slate-400 font-medium">Volumen acumulado:</span>
                      <span className="font-mono tabular-nums text-slate-200 font-bold">
                        {meta.valor_acumulado_actual.toLocaleString('es-PE')} / {meta.meta_objetivo_total.toLocaleString('es-PE')} {meta.unidad_medida}
                      </span>
                    </div>
                  )}

                  {/* Desglose de Hitos del Plan (Acordeón interactivo) */}
                  <div className="border-t border-slate-800/70 pt-2.5">
                    <div
                      onClick={() => toggleExpandirHitos(meta.id)}
                      className="flex items-center justify-between py-1 cursor-pointer select-none text-xs text-slate-300 hover:text-white"
                    >
                      <span className="font-bold flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" strokeWidth={1.75} />
                        <span>Hitos del Plan ({hitosHechos}/{totalHitos})</span>
                      </span>
                      {expandido ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                      )}
                    </div>

                    {/* Lista desplegable de hitos */}
                    {expandido && (
                      <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                        {meta.hitos.length === 0 ? (
                          <p className="text-[11px] text-slate-500 py-1">Sin hitos registrados para este plan.</p>
                        ) : (
                          meta.hitos.map((h) => (
                            <div
                              key={h.id}
                              className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-2 hover:border-slate-700 transition"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleHito(h)}
                                  className={`w-4 h-4 rounded-sm flex items-center justify-center transition cursor-pointer shrink-0 ${
                                    h.completado
                                      ? 'bg-emerald-500 text-white'
                                      : 'border border-slate-600 text-slate-500 hover:border-teal-400'
                                  }`}
                                >
                                  {h.completado ? (
                                    <CheckSquare className="w-3.5 h-3.5" strokeWidth={2} />
                                  ) : (
                                    <Square className="w-3.5 h-3.5" strokeWidth={1.75} />
                                  )}
                                </button>
                                <span
                                  className={`text-xs truncate ${
                                    h.completado ? 'line-through text-slate-500' : 'text-slate-200'
                                  }`}
                                >
                                  {h.titulo_hito}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono shrink-0">
                                {h.fecha_objetivo && (
                                  <span className="flex items-center gap-0.5">
                                    <Calendar className="w-2.5 h-2.5" strokeWidth={1.75} />
                                    {h.fecha_objetivo}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Píldoras de Hábitos Motores Vinculados */}
                  {meta.vinculos.length > 0 && (
                    <div className="border-t border-slate-800/70 pt-2.5 mt-2">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
                        <span>Hábitos Motores Vinculados:</span>
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {meta.vinculos.map((v, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 font-medium"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
                            <span>{v.habito?.nombre_actividad || 'Hábito'}</span>
                            <span className="font-mono text-[9px] text-emerald-400/70">
                              ({v.factor_conversion}x)
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer de Tarjeta con Fechas y Acceso Directo a Vista 360° */}
                <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between gap-2 text-[10.5px] text-slate-500 font-mono">
                  <div className="flex items-center gap-3">
                    <span>Inicio: {meta.fecha_inicio || 'Hoy'}</span>
                    <span>Límite: {meta.fecha_fin || 'Sin límite'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMetaSeleccionada360Id(meta.id)}
                    className="px-2.5 py-1 rounded-lg bg-sky-950/60 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-800/60 font-sans font-bold text-[10.5px] flex items-center gap-1 transition cursor-pointer"
                  >
                    <Compass className="w-3 h-3" strokeWidth={1.75} />
                    <span>Vista Detallada 360°</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Meta & Plan Flow */}
      {modalFlowAbierto && (
        <ModalMetaPlanFlow
          isOpen={modalFlowAbierto}
          onClose={() => {
            setModalFlowAbierto(false);
            setMetaParaEditar(null);
          }}
          metaParaEditar={metaParaEditar}
        />
      )}

      {/* Vista Detallada 360° de Meta / Plan (Pantalla Completa) */}
      {metaSeleccionada360Id && (() => {
        const metaActiva360 = metasDetalladas.find((m) => m.id === metaSeleccionada360Id);
        if (!metaActiva360) return null;
        return (
          <ModalDetalleMeta360
            meta={metaActiva360}
            todasLasActividades={todasLasActividades}
            todosLosVinculos={todosLosVinculos}
            logs={logs}
            onClose={() => setMetaSeleccionada360Id(null)}
            onAbrirModalEdicionCompleta={(m) => {
              setMetaSeleccionada360Id(null);
              handleEditarMeta(m);
            }}
          />
        );
      })()}
    </div>
  );
};
