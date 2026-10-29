import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Target,
  Layers,
  Flame,
  Calendar,
  ShieldCheck,
  Edit3,
  Save,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  GitFork,
  TrendingUp,
  Clock,
  Link2
} from 'lucide-react';
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
  type MetaConDetalle,
  calcularProyeccionMeta,
  conmutarHitoPlanLocal,
  vincularHabitoAMetaLocal,
  desvincularHabitoLocal,
  recalcularProgresoMetaLocal,
  generarSiguienteCodigoHitoPlan
} from '../../../services/metasService';
import {
  completarActividadPersonalLocal,
  registrarAvanceCuantitativoLocal
} from '../../../services/habitosService';
import { db } from '../../../db/db';
import { syncManager } from '../../../services/syncManager';
import { mostrarToastCobalt } from '../../../utils/toastCobalt';
import { HistogramaSeguimientoTemporal } from '../HistogramaSeguimientoTemporal';

export interface ModalDetalleMeta360Props {
  meta: MetaConDetalle;
  todasLasActividades: ActividadPersonal[];
  todosLosVinculos: HabitoMetaVinculo[];
  logs: HabitoLogRecord[];
  onClose: () => void;
  onAbrirModalEdicionCompleta?: (meta: MetaPlanRecord) => void;
}

export const ModalDetalleMeta360: React.FC<ModalDetalleMeta360Props> = ({
  meta,
  todasLasActividades,
  todosLosVinculos,
  logs,
  onClose
}) => {
  // Estado del Editor Táctico
  const [nombreMeta, setNombreMeta] = useState(meta.nombre_meta || '');
  const [categoriaVida, setCategoriaVida] = useState<CategoriaVida>(meta.categoria_vida);
  const [estadoMeta, setEstadoMeta] = useState<string>(meta.estado || '02_En_Progreso');
  const [unidadMedida, setUnidadMedida] = useState(meta.unidad_medida || 'unidades');
  const [metaObjetivoTotal, setMetaObjetivoTotal] = useState<number>(Number(meta.meta_objetivo_total || 0));
  const [valorAcumuladoActual, setValorAcumuladoActual] = useState<number>(Number(meta.valor_acumulado_actual || 0));
  const [nivelRescateMinimo, setNivelRescateMinimo] = useState<number>(Number(meta.nivel_rescate_minimo || 0));
  const [pesoHitosPct, setPesoHitosPct] = useState<number>(Number(meta.peso_hitos_pct ?? 50));
  const [pesoHabitosPct, setPesoHabitosPct] = useState<number>(Number(meta.peso_habitos_pct ?? 50));
  const [fechaInicio, setFechaInicio] = useState(meta.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(meta.fecha_fin || '');
  const [descripcion, setDescripcion] = useState(meta.descripcion || '');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Estado para agregar nuevo hito rápido en la EDT de la meta
  const [nuevoHitoTitulo, setNuevoHitoTitulo] = useState('');
  const [nuevoHitoFecha, setNuevoHitoFecha] = useState('');
  const [nuevoHitoPeso, setNuevoHitoPeso] = useState<number>(1);

  // Estado para vincular un hábito existente a la EDT de la meta
  const [habitoAVincularId, setHabitoAVincularId] = useState('');
  const [pesoNuevoVinculo, setPesoNuevoVinculo] = useState<number>(100);
  const [factorNuevoVinculo, setFactorNuevoVinculo] = useState<number>(1);

  // Sincronizar campos cuando cambia la meta reactiva en Dexie
  useEffect(() => {
    setNombreMeta(meta.nombre_meta || '');
    setCategoriaVida(meta.categoria_vida);
    setEstadoMeta(meta.estado || '02_En_Progreso');
    setUnidadMedida(meta.unidad_medida || 'unidades');
    setMetaObjetivoTotal(Number(meta.meta_objetivo_total || 0));
    setValorAcumuladoActual(Number(meta.valor_acumulado_actual || 0));
    setNivelRescateMinimo(Number(meta.nivel_rescate_minimo || 0));
    setPesoHitosPct(Number(meta.peso_hitos_pct ?? 50));
    setPesoHabitosPct(Number(meta.peso_habitos_pct ?? 50));
    setFechaInicio(meta.fecha_inicio || '');
    setFechaFin(meta.fecha_fin || '');
    setDescripcion(meta.descripcion || '');
  }, [meta]);

  // Cierre con Escape respetando inhibición en campos editables (Regla Transversal LIFO)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const hoyStr = new Date().toISOString().split('T')[0];

  // Cálculo de métricas de Avance Planificado vs Real, Racha y Proyección
  const metricas360 = useMemo(() => {
    // 1. % Planificado según calendario
    let avancePlanificadoPct = 0;
    if (meta.fecha_inicio && meta.fecha_fin) {
      const tIni = new Date(meta.fecha_inicio).getTime();
      const tFin = new Date(meta.fecha_fin).getTime();
      const tHoy = new Date(hoyStr).getTime();
      if (tFin > tIni) {
        avancePlanificadoPct = Math.min(100, Math.max(0, Math.round(((tHoy - tIni) / (tFin - tIni)) * 100)));
      }
    } else {
      avancePlanificadoPct = meta.progresoGlobalPct;
    }

    // 2. Racha actual y máxima de los hábitos motores vinculados
    let rachaActualCombinada = 0;
    let rachaMaxima = 0;
    for (const v of meta.vinculos) {
      const r = Number(v.habito?.racha_actual || 0);
      rachaActualCombinada += r;
      if (r > rachaMaxima) rachaMaxima = r;
    }

    // 3. Logs de los hábitos vinculados para proyección
    const idsHabitos = new Set(meta.vinculos.map((v) => v.habito_id));
    const logsMeta = logs.filter((l) => idsHabitos.has(l.habito_id));
    const proyeccion = calcularProyeccionMeta(meta, logsMeta, meta.hitos, hoyStr);

    const hitosCompletados = meta.hitos.filter((h) => h.completado).length;
    const totalHitos = meta.hitos.length;

    return {
      avancePlanificadoPct,
      rachaActualCombinada,
      rachaMaxima,
      proyeccion,
      hitosCompletados,
      totalHitos
    };
  }, [meta, logs, hoyStr]);

  // Hábitos disponibles para vincular (que no estén ya vinculados)
  const habitosDisponiblesParaVincular = useMemo(() => {
    const yaVinculados = new Set(meta.vinculos.map((v) => v.habito_id));
    return todasLasActividades.filter((a) => !yaVinculados.has(a.id));
  }, [todasLasActividades, meta.vinculos]);

  const handleGuardarParametrosMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardandoEdicion(true);
      const nowIso = new Date().toISOString();
      await db.metas_planes.update(meta.id, {
        nombre_meta: nombreMeta.trim() || meta.nombre_meta,
        categoria_vida: categoriaVida,
        estado: estadoMeta,
        unidad_medida: unidadMedida.trim() || 'unidades',
        meta_objetivo_total: Number(metaObjetivoTotal || 0),
        valor_acumulado_actual: Number(valorAcumuladoActual || 0),
        nivel_rescate_minimo: Number(nivelRescateMinimo || 0),
        peso_hitos_pct: Number(pesoHitosPct ?? 50),
        peso_habitos_pct: Number(pesoHabitosPct ?? 50),
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        descripcion: descripcion.trim(),
        updated_at: nowIso,
        sync_status: 'pending'
      });
      await recalcularProgresoMetaLocal(meta.id);
      syncManager.syncPendingRecords();
      mostrarToastCobalt('Parámetros de la meta actualizados', 'success');
    } catch (err) {
      console.error('Error al actualizar meta:', err);
      mostrarToastCobalt('No se pudo actualizar la meta', 'error');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleSumarVolumenDirectoMeta = async (incremento: number) => {
    const nuevoAcum = Math.max(0, Number(meta.valor_acumulado_actual || 0) + incremento);
    setValorAcumuladoActual(nuevoAcum);
    await db.metas_planes.update(meta.id, {
      valor_acumulado_actual: nuevoAcum,
      updated_at: new Date().toISOString(),
      sync_status: 'pending'
    });
    await recalcularProgresoMetaLocal(meta.id);
    syncManager.syncPendingRecords();
    mostrarToastCobalt(`+${incremento} ${meta.unidad_medida || 'unid'} registrados en la meta`, 'success');
  };

  const handleAgregarHitoRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoHitoTitulo.trim()) return;

    const codigoHito = await generarSiguienteCodigoHitoPlan();
    const nowIso = new Date().toISOString();
    const nuevoHito: HitoPlanRecord = {
      id: crypto.randomUUID(),
      user_id: meta.user_id || '00000000-0000-0000-0000-000000000001',
      codigo_legado: codigoHito,
      meta_id: meta.id,
      titulo_hito: nuevoHitoTitulo.trim(),
      orden_secuencia: meta.hitos.length + 1,
      fecha_objetivo: nuevoHitoFecha || undefined,
      completado: false,
      peso_relativo: Number(nuevoHitoPeso || 1),
      created_at: nowIso,
      updated_at: nowIso,
      version: 1,
      sync_status: 'pending'
    };

    await db.planes_accion_hitos.put(nuevoHito);
    await recalcularProgresoMetaLocal(meta.id);
    setNuevoHitoTitulo('');
    setNuevoHitoFecha('');
    setNuevoHitoPeso(1);
    mostrarToastCobalt(`Hito ${codigoHito} agregado al plan`, 'success');
  };

  const handleEliminarHitoPlan = async (hitoId: string) => {
    await db.planes_accion_hitos.delete(hitoId);
    await recalcularProgresoMetaLocal(meta.id);
    mostrarToastCobalt('Hito eliminado del plan', 'info');
  };

  const handleVincularHabito = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitoAVincularId) return;
    await vincularHabitoAMetaLocal(
      habitoAVincularId,
      meta.id,
      'VOLUMEN_DIRECTO',
      Number(factorNuevoVinculo || 1),
      Number(pesoNuevoVinculo || 100),
      Number(meta.meta_objetivo_total || 100)
    );
    setHabitoAVincularId('');
    mostrarToastCobalt('Hábito motor vinculado a la EDT de la meta', 'success');
  };

  const handleRegistrarAvanceHabitoVinculado = async (habito: ActividadPersonal, incremento: number) => {
    const nuevoValor = Number(habito.valor_acumulado_actual || 0) + incremento;
    await registrarAvanceCuantitativoLocal(habito, nuevoValor);
    // Sincronizar también el acumulado de la meta
    const nuevoTotalMeta = Number(meta.valor_acumulado_actual || 0) + incremento;
    await db.metas_planes.update(meta.id, {
      valor_acumulado_actual: nuevoTotalMeta,
      updated_at: new Date().toISOString(),
      sync_status: 'pending'
    });
    await recalcularProgresoMetaLocal(meta.id);
    mostrarToastCobalt(`+${incremento} ${habito.unidad_medida || meta.unidad_medida || 'unid'} en ${habito.nombre_actividad}`, 'success');
  };

  const cfgCat = CATEGORIAS_VIDA_MAP[meta.categoria_vida];

  const modalContent = (
    <div
      id="modal-detalle-meta-360"
      role="dialog"
      aria-modal="true"
      aria-label={`Vista Detallada 360° de ${meta.nombre_meta}`}
      className="fixed inset-0 z-[120] bg-[#070C18]/95 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* ================================================================= */}
        {/* 1. CABECERA TÁCTICA (TÍTULO, CATEGORÍA, CÓDIGO, ESTADO, CIERRE)   */}
        {/* ================================================================= */}
        <div
          className="portal-surface bg-[#0D1526] p-4 lg:p-5 rounded-2xl border border-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{
            boxShadow: '0 10px 25px -5px rgba(2, 6, 23, 0.8), 0 8px 10px -6px rgba(30, 58, 138, 0.18)'
          }}
        >
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-600 to-sky-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-teal-900/30 ring-1 ring-white/20">
              <Target className="w-5 h-5" strokeWidth={1.75} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono tabular-nums text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-900 text-sky-300 border border-slate-800">
                  {meta.codigo_legado}
                </span>
                {cfgCat && (
                  <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-md border ${cfgCat.badgeClase}`}>
                    {cfgCat.nombre}
                  </span>
                )}
                <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-teal-950/60 text-teal-300 border border-teal-800/60">
                  {String(meta.estado).replace(/^\d+_/, '').replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                  <span>Objetivo: <b className="text-slate-200">{meta.fecha_fin || 'Continuo'}</b></span>
                </span>
              </div>

              <h2 className="text-lg lg:text-xl font-black text-slate-100 truncate">
                {meta.nombre_meta}
              </h2>
              {meta.descripcion && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                  {meta.descripcion}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#040711] border border-slate-800/80 text-[10px] font-mono text-slate-400">
              <span>ESC para cerrar</span>
            </span>
            <button
              type="button"
              id="btn-cerrar-meta-360"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Cerrar Vista Detallada 360° (Esc)"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
              <span>Cerrar 360°</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. KPI CARDS TÁCTICAS (4 TARJETAS MAESTRAS ELEVADAS)              */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: % Avance Real vs. Planificado */}
          <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl border border-slate-800/40 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Avance Real vs Plan
              </span>
              <TrendingUp className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-2xl font-black font-mono tabular-nums text-emerald-400">
                  {meta.progresoGlobalPct}%
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  Plan: <b className="text-sky-300">{metricas360.avancePlanificadoPct}%</b>
                </span>
              </div>

              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-1.5 relative">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${meta.progresoGlobalPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-400">
                <span>Hitos: <b className="text-slate-200">{meta.avanceHitosPct}%</b> ({meta.peso_hitos_pct}%)</span>
                <span>Hábitos: <b className="text-slate-200">{meta.avanceHabitosPct}%</b> ({meta.peso_habitos_pct}%)</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Racha Actual / Máxima y Ritmo */}
          <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl border border-slate-800/40 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Racha Actual / Máxima
              </span>
              <Flame className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono tabular-nums text-amber-400">
                  {metricas360.rachaActualCombinada}d
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  / Máx: <b className="text-slate-200">{metricas360.rachaMaxima}d</b>
                </span>
              </div>
              <p className="text-[11px] font-mono tabular-nums text-slate-400 mt-1">
                Velocidad: <b className="text-sky-300">{metricas360.proyeccion.velocidadDiaria.toFixed(1)} {meta.unidad_medida || 'unid'}/día</b>
              </p>
            </div>
          </div>

          {/* KPI 3: Volumen Acumulado e Incremento Rápido */}
          <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl border border-slate-800/40 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Volumen Acumulado
              </span>
              <ShieldCheck className="w-4 h-4 text-sky-400" strokeWidth={1.75} />
            </div>

            <div>
              <div className="text-xl font-black font-mono tabular-nums text-slate-100">
                {(meta.valor_acumulado_actual || 0).toLocaleString('es-PE')}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / {(meta.meta_objetivo_total || 0).toLocaleString('es-PE')} {meta.unidad_medida || 'unid'}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                <span className="text-[10px] font-mono tabular-nums text-amber-400">
                  Rescate: {meta.nivel_rescate_minimo || 0} {meta.unidad_medida}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSumarVolumenDirectoMeta(1)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-600 text-slate-200 hover:text-white text-[10px] font-mono font-bold transition cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSumarVolumenDirectoMeta(5)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-600 text-slate-200 hover:text-white text-[10px] font-mono font-bold transition cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* KPI 4: Ejecución EDT y Proyección */}
          <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl border border-slate-800/40 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Estructura EDT / Cierre
              </span>
              <Clock className="w-4 h-4 text-indigo-400" strokeWidth={1.75} />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black font-mono tabular-nums text-indigo-300">
                  {metricas360.hitosCompletados}/{metricas360.totalHitos} Hitos
                </span>
                <span className="text-xs font-mono tabular-nums text-emerald-400 font-bold">
                  {meta.vinculos.length} Hábitos
                </span>
              </div>
              <p className="text-[11px] font-mono tabular-nums text-slate-400 mt-1">
                Cierre est.: <b className="text-slate-200">{metricas360.proyeccion.fechaProyectada || 'En evaluación'}</b>
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. HISTOGRAMA TEMPORAL DE SEGUIMIENTO INTERACTIVO                 */}
        {/* ================================================================= */}
        <HistogramaSeguimientoTemporal
          metaFija={meta}
          actividades={todasLasActividades}
          vinculos={todosLosVinculos}
          logs={logs}
        />

        {/* ================================================================= */}
        {/* 4. DESGLOSE JERÁRQUICO EDT / WBS + EDITOR TÁCTICO DE LA META      */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA (7 cols): DESGLOSE JERÁRQUICO EDT / WBS (META -> HÁBITOS & HITOS) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 4.A Árbol EDT de Hábitos y Actividades Motores Vinculados */}
            <div className="portal-surface bg-[#0D1526] p-4 lg:p-5 rounded-2xl border border-slate-800/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <GitFork className="w-4 h-4 text-emerald-400" strokeWidth={1.75} />
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                      EDT Nivel 1 · Hábitos y Actividades Motores ({meta.vinculos.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Rutinas recurrentes y actividades que alimentan el volumen de la meta (Peso: <span className="font-mono tabular-nums text-emerald-400 font-bold">{meta.peso_habitos_pct}%</span>)
                    </p>
                  </div>
                </div>
              </div>

              {meta.vinculos.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#040711]/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                  No hay hábitos vinculados aún. Usa el selector inferior para asociar hábitos motores a esta meta.
                </div>
              ) : (
                <div className="space-y-3">
                  {meta.vinculos.map((v) => {
                    const hab = v.habito;
                    const factor = Number(v.factor_conversion || 1);
                    const peso = Number(v.peso_contribucion_pct || 100);
                    const acumHab = Number(hab?.valor_acumulado_actual || 0) * factor;
                    const metaEsp = Number(v.meta_volumen_esperada || meta.meta_objetivo_total || 100);
                    const pctHab = metaEsp > 0 ? Math.min(100, Math.round((acumHab / metaEsp) * 100)) : 0;
                    const completadoHoy =
                      hab?.estado === '04_Completado' || hab?.ultima_fecha_completado === hoyStr;

                    return (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-xl bg-[#040711]/80 border border-slate-800/60 hover:border-emerald-500/40 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {hab && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await completarActividadPersonalLocal(hab, !completadoHoy);
                                  await recalcularProgresoMetaLocal(meta.id);
                                }}
                                className={`mt-0.5 w-4 h-4 rounded-sm flex items-center justify-center shrink-0 cursor-pointer transition ${
                                  completadoHoy
                                    ? 'bg-emerald-500 text-white'
                                    : 'border border-slate-600 text-slate-400 hover:border-emerald-400'
                                }`}
                                title={completadoHoy ? 'Completado hoy' : 'Marcar hábito como completado hoy'}
                              >
                                {completadoHoy ? (
                                  <CheckSquare className="w-3.5 h-3.5" strokeWidth={2} />
                                ) : (
                                  <Square className="w-3.5 h-3.5" strokeWidth={1.75} />
                                )}
                              </button>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className="font-mono tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-800">
                                  {hab?.codigo_legado || 'ACT'}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-950/40 text-sky-300 border border-sky-800/40">
                                  {hab?.frecuencia_ciclo || 'DIARIA'}
                                </span>
                                <span className="text-[10px] font-mono tabular-nums font-semibold px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
                                  Peso: {peso}% · Factor: {factor}x
                                </span>
                                <span className="text-[10px] font-mono tabular-nums text-amber-400 font-bold flex items-center gap-0.5">
                                  <Flame className="w-3 h-3" strokeWidth={1.75} />
                                  {hab?.racha_actual || 0}d
                                </span>
                              </div>

                              <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                                {hab?.nombre_actividad || 'Hábito vinculado'}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {hab && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRegistrarAvanceHabitoVinculado(
                                      hab,
                                      Number(hab.meta_diaria_estandar || 1)
                                    )
                                  }
                                  className="px-2 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-800/50 text-[10px] font-mono tabular-nums font-bold transition cursor-pointer"
                                  title="Sumar meta diaria estándar del hábito"
                                >
                                  +{hab.meta_diaria_estandar || 1} {hab.unidad_medida || meta.unidad_medida}
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => desvincularHabitoLocal(v.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                              title="Desvincular hábito de esta meta"
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>
                          </div>
                        </div>

                        {/* Barra de progreso del hábito dentro de la EDT de la meta */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-400">
                            <span>
                              Aporte acumulado: <b className="text-slate-200">{acumHab.toLocaleString('es-PE')}</b> / {metaEsp.toLocaleString('es-PE')} {meta.unidad_medida || 'unid'}
                            </span>
                            <span className="text-emerald-400 font-bold">{pctHab}%</span>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pctHab}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selector para vincular otro hábito existente del catálogo */}
              {habitosDisponiblesParaVincular.length > 0 && (
                <form
                  onSubmit={handleVincularHabito}
                  className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <div className="flex items-center gap-1.5 flex-1">
                    <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
                    <select
                      value={habitoAVincularId}
                      onChange={(e) => setHabitoAVincularId(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-xl bg-[#040711] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="">+ Vincular otro hábito motor del catálogo...</option>
                      {habitosDisponiblesParaVincular.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.codigo_legado} · {h.nombre_actividad} ({h.frecuencia_ciclo || 'DIARIA'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={pesoNuevoVinculo}
                      onChange={(e) => setPesoNuevoVinculo(Number(e.target.value))}
                      className="w-16 px-2 py-1.5 rounded-xl bg-[#040711] border border-slate-800 text-xs font-mono tabular-nums text-slate-200"
                      title="Peso de contribución (%)"
                      placeholder="Peso %"
                    />
                    <input
                      type="number"
                      step="0.1"
                      min={0.1}
                      value={factorNuevoVinculo}
                      onChange={(e) => setFactorNuevoVinculo(Number(e.target.value))}
                      className="w-14 px-2 py-1.5 rounded-xl bg-[#040711] border border-slate-800 text-xs font-mono tabular-nums text-slate-200"
                      title="Factor de conversión"
                      placeholder="1.0x"
                    />
                    <button
                      type="submit"
                      disabled={!habitoAVincularId}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Vincular</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 4.B Árbol EDT de Hitos Secuenciales del Plan de Acción */}
            <div className="portal-surface bg-[#0D1526] p-4 lg:p-5 rounded-2xl border border-slate-800/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-indigo-400" strokeWidth={1.75} />
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                      EDT Nivel 2 · Hitos del Plan de Acción ({metricas360.hitosCompletados}/{metricas360.totalHitos})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Entregables de control secuencial de la meta (Peso: <span className="font-mono tabular-nums text-indigo-300 font-bold">{meta.peso_hitos_pct}%</span>)
                    </p>
                  </div>
                </div>
              </div>

              {meta.hitos.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No hay hitos secuenciales registrados en este plan. Agrega entregables debajo.
                </p>
              ) : (
                <div className="space-y-2">
                  {meta.hitos.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 rounded-xl bg-[#040711]/80 border border-slate-800/60 flex items-center justify-between gap-3 hover:border-indigo-500/40 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => conmutarHitoPlanLocal(h.id, !h.completado)}
                          className={`w-4 h-4 rounded-sm flex items-center justify-center shrink-0 cursor-pointer transition ${
                            h.completado
                              ? 'bg-emerald-500 text-white'
                              : 'border border-slate-600 text-slate-400 hover:border-indigo-400'
                          }`}
                        >
                          {h.completado ? (
                            <CheckSquare className="w-3.5 h-3.5" strokeWidth={2} />
                          ) : (
                            <Square className="w-3.5 h-3.5" strokeWidth={1.75} />
                          )}
                        </button>
                        <span className="font-mono tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800 shrink-0">
                          {h.codigo_legado}
                        </span>
                        <span
                          className={`text-xs font-medium truncate ${
                            h.completado ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {h.titulo_hito}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono tabular-nums text-slate-400">
                        <span>Peso: {h.peso_relativo || 1}</span>
                        {h.fecha_objetivo && (
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {h.fecha_objetivo}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEliminarHitoPlan(h.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Eliminar hito"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario rápido para añadir un hito secuencial */}
              <form
                onSubmit={handleAgregarHitoRapido}
                className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <input
                  type="text"
                  value={nuevoHitoTitulo}
                  onChange={(e) => setNuevoHitoTitulo(e.target.value)}
                  placeholder="Nuevo hito o entregable del plan..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#040711] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="date"
                  value={nuevoHitoFecha}
                  onChange={(e) => setNuevoHitoFecha(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#040711] border border-slate-800 text-xs font-mono tabular-nums text-slate-300"
                />
                <button
                  type="submit"
                  disabled={!nuevoHitoTitulo.trim()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Añadir Hito</span>
                </button>
              </form>
            </div>
          </div>

          {/* COLUMNA DERECHA (5 cols): EDITOR TÁCTICO DE PARÁMETROS DE LA META */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleGuardarParametrosMeta}
              className="portal-surface bg-[#0D1526] p-4 lg:p-5 rounded-2xl border border-slate-800/40 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-sky-400" strokeWidth={1.75} />
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                    Editor Táctico de la Meta
                  </h3>
                </div>
                <span className="font-mono tabular-nums text-[10px] text-slate-400">
                  {meta.codigo_legado}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Título de la Meta / Plan
                  </label>
                  <input
                    type="text"
                    value={nombreMeta}
                    onChange={(e) => setNombreMeta(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs font-semibold text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Categoría de Vida
                    </label>
                    <select
                      value={categoriaVida}
                      onChange={(e) => setCategoriaVida(e.target.value as CategoriaVida)}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      {(Object.keys(CATEGORIAS_VIDA_MAP) as CategoriaVida[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORIAS_VIDA_MAP[cat].nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Estado
                    </label>
                    <select
                      value={estadoMeta}
                      onChange={(e) => setEstadoMeta(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="01_Pendiente">01 · Pendiente</option>
                      <option value="02_En_Progreso">02 · En Progreso</option>
                      <option value="03_Completado">03 · Completado</option>
                      <option value="04_Pausado">04 · Pausado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Unidad Medida
                    </label>
                    <input
                      type="text"
                      value={unidadMedida}
                      onChange={(e) => setUnidadMedida(e.target.value)}
                      placeholder="km, horas, pag..."
                      className="w-full px-2.5 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Objetivo Total
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={metaObjetivoTotal}
                      onChange={(e) => setMetaObjetivoTotal(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Acumulado Real
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={valorAcumuladoActual}
                      onChange={(e) => setValorAcumuladoActual(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs font-mono tabular-nums text-emerald-300 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Rescate Mín.
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={nivelRescateMinimo}
                      onChange={(e) => setNivelRescateMinimo(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs font-mono tabular-nums text-amber-300 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Peso Hitos %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pesoHitosPct}
                      onChange={(e) => {
                        const v = Math.min(100, Math.max(0, Number(e.target.value)));
                        setPesoHitosPct(v);
                        setPesoHabitosPct(100 - v);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs font-mono tabular-nums text-indigo-300 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Peso Hábitos %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pesoHabitosPct}
                      onChange={(e) => {
                        const v = Math.min(100, Math.max(0, Number(e.target.value)));
                        setPesoHabitosPct(v);
                        setPesoHitosPct(100 - v);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs font-mono tabular-nums text-emerald-300 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs font-mono tabular-nums text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Fecha Objetivo (Límite)
                    </label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs font-mono tabular-nums text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Notas Estratégicas y Criterios de Éxito
                  </label>
                  <textarea
                    rows={3}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe el propósito, métricas o notas clave de esta meta..."
                    className="w-full px-3 py-2 rounded-xl bg-[#040711] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={guardandoEdicion}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-950/50 transition cursor-pointer"
              >
                <Save className="w-4 h-4" strokeWidth={1.75} />
                <span>{guardandoEdicion ? 'Guardando cambios...' : 'Guardar Parámetros de la Meta'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
