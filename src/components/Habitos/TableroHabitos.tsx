import React, { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useHabitos } from '../../hooks/useHabitos';
import { TarjetaHabito, renderIconoCategoriaVida } from './TarjetaHabito';
import { ModalActividadFlow } from '../Modals/ModalActividadFlow';
import { ModalDetalleMeta360 } from './Metas/ModalDetalleMeta360';
import { calcularProgresoBimodal, type MetaConDetalle } from '../../services/metasService';
import { CATEGORIAS_VIDA_MAP, type CategoriaVida, type ActividadPersonal, type AlcanceRecurrencia } from '../../types';
import {
  esElementoArchivado,
  evaluarFiltroTemporal,
  evaluarFiltroMeta,
  deduplicarHitosPlan,
  deduplicarVinculosMeta
} from '../../utils/entityNormalizer';
import {
  Flame,
  CheckCircle2,
  PieChart,
  Search,
  Sparkles,
  Plus,
  Activity,
  SlidersHorizontal,
  X,
  Wallet,
  Repeat,
  Target,
  Sun,
  CalendarRange,
  Layers
} from 'lucide-react';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import { ModalAlcanceRecurrencia } from '../Modals/ModalAlcanceRecurrencia';
import { ModalRegistroAvanceHabito } from '../Modals/ModalRegistroAvanceHabito';
import { recalcularProgresoMetaLocal } from '../../services/metasService';
import { formatFechaIsoLocal } from '../../utils/timeFormatters';

const EMPTY_ARRAY: any[] = [];

interface ColumnaHabitosData {
  pendientes: ActividadPersonal[];
  completadas: ActividadPersonal[];
  total: number;
  pctCompletado: number;
}

const OPCIONES_FILTRO_TEMPORAL = [
  { key: 'HOY', label: 'Hoy', tooltip: 'Filtrar por hoy', Icon: Sun },
  { key: 'SEMANA', label: 'Semana', tooltip: 'Filtrar por esta semana', Icon: CalendarRange },
  { key: 'TODOS', label: 'Todo', tooltip: 'Ver todas las actividades', Icon: Layers }
] as const;

const CATEGORIAS_CANONICAS: CategoriaVida[] = [
  'SALUD_DEPORTE',
  'DESARROLLO_ESTUDIO',
  'LABORAL_HONORARIO',
  'FINANZAS_TRAMITES',
  'SOCIAL_FAMILIA',
  'PERSONAL_DESCANSO'
];

type ModoOrden = 'TIME' | 'STREAK' | 'ALPHA' | 'PRIORITY';
type FiltroCompromiso = 'TODOS' | 'HABITUAL' | 'UNICO' | 'RACHA';
type FiltroTemporal = 'HOY' | 'SEMANA' | 'TODOS';

export interface TableroHabitosProps {
  ocultarHeader?: boolean;
}

export const TableroHabitos: React.FC<TableroHabitosProps> = ({ ocultarHeader = false }) => {
  const {
    actividades,
    todasLasActividades,
    subtareasPorPadre,
    metasPorHabitoId,
    actividadesPorHabitoId,
    metasPlanes,
    kpis,
    filtroTexto,
    setFiltroTexto,
    toggleCompletar,
    registrarAvance,
    toggleSubtarea,
    eliminarConAlcance,
    cargando
  } = useHabitos();

  const { programarEliminacion, estaOculto } = useUndoDelete();

  // UI Optimista de check-in (0ms de latencia)
  const [optimisticCompletados, setOptimisticCompletados] = useState<Record<string, boolean>>({});

  // Modales elevados (Single Instance Modal Pattern)
  const [modalAlcance, setModalAlcance] = useState<{
    isOpen: boolean;
    accion: 'editar' | 'eliminar';
    actividad: ActividadPersonal;
  } | null>(null);

  const [modalAvance, setModalAvance] = useState<{
    isOpen: boolean;
    actividad: ActividadPersonal;
  } | null>(null);

  const [filtroMetaId, setFiltroMetaId] = useState<string>('TODAS');
  const [meta360Id, setMeta360Id] = useState<string | null>(null);
  const [filtroCompromiso, setFiltroCompromiso] = useState<FiltroCompromiso>('TODOS');
  const [filtroTemporal, setFiltroTemporal] = useState<FiltroTemporal>('TODOS');
  const [modoOrden, setModoOrden] = useState<ModoOrden>('TIME');
  const [showSortPopover, setShowSortPopover] = useState(false);

  const hitosRaw = useLiveQuery(() => db.planes_accion_hitos.toArray(), []) || [];
  const hitosPlan = useMemo(() => deduplicarHitosPlan(hitosRaw), [hitosRaw]);
  const vinculosRaw = useLiveQuery(() => db.habitos_metas_vinculos.toArray(), []) || [];
  const vinculosPlan = useMemo(() => deduplicarVinculosMeta(vinculosRaw), [vinculosRaw]);
  const logsCumplimiento = useLiveQuery(() => db.habito_cumplimiento_logs.toArray(), []) || [];

  const metaActiva360: MetaConDetalle | null = useMemo(() => {
    if (!meta360Id) return null;
    const base = (metasPlanes || []).find((m) => m.id === meta360Id);
    if (!base) return null;
    const mapAct = new Map((todasLasActividades || actividades).map((a) => [a.id, a]));
    const hitosMeta = hitosPlan
      .filter((h) => h.meta_id === base.id)
      .sort((a, b) => (a.orden_secuencia || 0) - (b.orden_secuencia || 0));
    const vinculosMeta = vinculosPlan
      .filter((v) => v.meta_id === base.id)
      .map((v) => ({ ...v, habito: mapAct.get(v.habito_id) }));
    const calculo = calcularProgresoBimodal(base, hitosMeta, vinculosMeta);
    return {
      ...base,
      hitos: hitosMeta,
      vinculos: vinculosMeta,
      ...calculo
    };
  }, [meta360Id, metasPlanes, todasLasActividades, actividades, hitosPlan, vinculosPlan]);

  // Estados Modal Canónico ActividadFlow
  const [modalActividadAbierto, setModalActividadAbierto] = useState(false);
  const [actividadEditar, setActividadEditar] = useState<ActividadPersonal | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaVida>('SALUD_DEPORTE');
  const [alcanceEdicion, setAlcanceEdicion] = useState<AlcanceRecurrencia>('ALL');
  // Selector de categoría activa en móvil (REQ-PWA-07)
  const [categoriaMovilActiva, setCategoriaMovilActiva] = useState<CategoriaVida>('SALUD_DEPORTE');

  const hoyStr = formatFechaIsoLocal();

  // Metas ordenadas alfabéticamente para el selector
  const metasPlanesOrdenadas = useMemo(() => {
    return [...(metasPlanes || [])].sort((a, b) =>
      (a.nombre_meta || '').localeCompare(b.nombre_meta || '')
    );
  }, [metasPlanes]);

  // Contextual KPIs y Contadores para el Tablero según filtroMetaId (REQ-HABITS-FILTER-BY-META-16)
  const kpisTablero = useMemo(() => {
    if (filtroMetaId === 'TODAS') {
      return kpis;
    }

    const actsMeta = actividades.filter((a) => {
      if (esElementoArchivado(a, 'actividades')) return false;
      return evaluarFiltroMeta(a, filtroMetaId, metasPorHabitoId, metasPlanes);
    });

    const res = {
      total: actsMeta.length,
      countHabitual: 0,
      countUnico: 0,
      countRacha: 0,
      maxRacha: 0,
      completadosHoy: 0,
      horasInvertidas: 0,
      pilarCounts: {
        SALUD_DEPORTE: 0,
        DESARROLLO_ESTUDIO: 0,
        LABORAL_HONORARIO: 0,
        FINANZAS_TRAMITES: 0,
        SOCIAL_FAMILIA: 0,
        PERSONAL_DESCANSO: 0
      } as Record<CategoriaVida, number>
    };

    for (const a of actsMeta) {
      if (a.tipo_compromiso === 'HABITUAL') res.countHabitual++;
      else res.countUnico++;

      const racha = a.racha_actual || 0;
      if (racha > 0) res.countRacha++;
      if (racha > res.maxRacha) res.maxRacha = racha;

      if (a.categoria_vida in res.pilarCounts) {
        res.pilarCounts[a.categoria_vida]++;
      }

      const esCompletado = a.estado === '04_Completado' || a.ultima_fecha_completado === hoyStr;
      if (esCompletado || (a.tipo_compromiso === 'HABITUAL' && a.fecha_programada > hoyStr && racha > 0)) {
        res.completadosHoy++;
        res.horasInvertidas += a.duracion_horas || 0;
      }
    }

    return res;
  }, [filtroMetaId, kpis, actividades, metasPorHabitoId, metasPlanes, hoyStr]);

  const pctCumplimiento = kpisTablero.total > 0 ? Math.round((kpisTablero.completadosHoy / kpisTablero.total) * 100) : 0;
  const pilaresActivos = Object.values(kpisTablero.pilarCounts).filter((c) => c > 0).length;

  // Filtrado y ordenamiento de actividades con exclusión de archivados (+10 días), meta y horizonte temporal
  const actividadesProcesadas = useMemo(() => {
    let list = actividades.filter((a) => {
      // 1. Exclusión obligatoria de Bóveda de Archivados (+10 días desde su fecha terminal)
      if (esElementoArchivado(a, 'actividades')) {
        return false;
      }

      // 2. Filtro por meta estratégica (REQ-HABITS-FILTER-BY-META-16)
      if (!evaluarFiltroMeta(a, filtroMetaId, metasPorHabitoId, metasPlanes)) {
        return false;
      }

      // 3. Filtro por tipo de compromiso
      if (filtroCompromiso === 'HABITUAL' && a.tipo_compromiso !== 'HABITUAL') return false;
      if (filtroCompromiso === 'UNICO' && a.tipo_compromiso === 'HABITUAL') return false;
      if (filtroCompromiso === 'RACHA' && (!a.racha_actual || a.racha_actual <= 0)) return false;

      // 4. Filtro Temporal Canónico ('HOY' | 'SEMANA' | 'TODOS')
      if (filtroTemporal !== 'TODOS') {
        const tieneRec = Boolean(
          (a.frecuencia_ciclo && a.frecuencia_ciclo !== 'NINGUNA') ||
          (a.regla_repeticion && a.regla_repeticion.trim() !== '')
        );
        const esRutinaria = a.tipo_compromiso === 'HABITUAL' || tieneRec;

        if (filtroTemporal === 'HOY') {
          const fProgLimpia = (a.fecha_programada || '').split(/[\sT]/)[0];
          const estaEnMora = fProgLimpia < hoyStr && a.estado !== '04_Completado';
          const aUpdatedLocal = a.updated_at ? formatFechaIsoLocal(new Date(a.updated_at)) : '';
          const completadaHoy = !estaEnMora && (
            a.estado === '04_Completado' || 
            a.ultima_fecha_completado === hoyStr ||
            (aUpdatedLocal === hoyStr && (a.racha_actual || 0) > 0)
          );
          if (esRutinaria) {
            const agendadaHoy = fProgLimpia === hoyStr;
            if (!agendadaHoy && !estaEnMora && !completadaHoy) return false;
          } else {
            if (!evaluarFiltroTemporal(a.fecha_programada, 'HOY') && !estaEnMora && !completadaHoy) return false;
          }
        } else if (filtroTemporal === 'SEMANA') {
          if (!evaluarFiltroTemporal(a.fecha_programada, 'SEMANA')) return false;
        }
      }

      return true;
    });

    list.sort((a, b) => {
      if (modoOrden === 'STREAK') {
        return (b.racha_actual || 0) - (a.racha_actual || 0);
      }
      if (modoOrden === 'ALPHA') {
        const nomA = a.nombre_actividad || (a as any).nombre || (a as any).Nombre_Actividad || (a as any).Nombre || (a as any).titulo || '';
        const nomB = b.nombre_actividad || (b as any).nombre || (b as any).Nombre_Actividad || (b as any).Nombre || (b as any).titulo || '';
        return nomA.localeCompare(nomB);
      }
      if (modoOrden === 'PRIORITY') {
        const pA = (a as any).prioridad_anual || 0;
        const pB = (b as any).prioridad_anual || 0;
        return pB - pA;
      }
      // Por defecto: TIME (hora_limite_sugerida)
      const hA = (a as any).hora_limite_sugerida || '99:99';
      const hB = (b as any).hora_limite_sugerida || '99:99';
      return hA.localeCompare(hB);
    });

    return list;
  }, [actividades, filtroMetaId, metasPorHabitoId, metasPlanes, filtroCompromiso, filtroTemporal, modoOrden, hoyStr]);

  // Pre-cálculo O(N) por Categoría para erradicar re-cálculos anidados en el render (REQ-SYS-005-HABITOS)
  const actividadesPorCategoria = useMemo<Record<CategoriaVida, ColumnaHabitosData>>(() => {
    const mapa: Record<CategoriaVida, ColumnaHabitosData> = {
      SALUD_DEPORTE: { pendientes: [], completadas: [], total: 0, pctCompletado: 0 },
      DESARROLLO_ESTUDIO: { pendientes: [], completadas: [], total: 0, pctCompletado: 0 },
      LABORAL_HONORARIO: { pendientes: [], completadas: [], total: 0, pctCompletado: 0 },
      FINANZAS_TRAMITES: { pendientes: [], completadas: [], total: 0, pctCompletado: 0 },
      SOCIAL_FAMILIA: { pendientes: [], completadas: [], total: 0, pctCompletado: 0 },
      PERSONAL_DESCANSO: { pendientes: [], completadas: [], total: 0, pctCompletado: 0 }
    };

    for (const act of actividadesProcesadas) {
      if (estaOculto(act.id)) continue;

      const rawCat = (act.categoria_vida || '').toUpperCase().trim() as CategoriaVida;
      const catFinal: CategoriaVida = CATEGORIAS_CANONICAS.includes(rawCat) ? rawCat : 'SALUD_DEPORTE';

      let completada = false;
      if (optimisticCompletados[act.id] !== undefined) {
        completada = optimisticCompletados[act.id];
      } else {
        const fProgLimpia = (act.fecha_programada || '').split(/[\sT]/)[0];
        if (fProgLimpia < hoyStr && act.estado !== '04_Completado') {
          completada = false;
        } else {
          const updatedLocal = act.updated_at ? formatFechaIsoLocal(new Date(act.updated_at)) : '';
          completada =
            act.estado === '04_Completado' ||
            act.ultima_fecha_completado === hoyStr ||
            (Boolean(updatedLocal === hoyStr) && (act.racha_actual || 0) > 0);
        }
      }

      if (completada) {
        mapa[catFinal].completadas.push(act);
      } else {
        mapa[catFinal].pendientes.push(act);
      }
    }

    for (const cat of CATEGORIAS_CANONICAS) {
      const col = mapa[cat];
      col.total = col.pendientes.length + col.completadas.length;
      col.pctCompletado = col.total > 0 ? Math.round((col.completadas.length / col.total) * 100) : 0;
    }

    return mapa;
  }, [actividadesProcesadas, estaOculto, optimisticCompletados, hoyStr]);

  const handleCrearActividad = useCallback((categoriaPrevia?: CategoriaVida) => {
    setActividadEditar(null);
    setAlcanceEdicion('ALL');
    setCategoriaSeleccionada(categoriaPrevia || 'SALUD_DEPORTE');
    setModalActividadAbierto(true);
  }, []);

  const handleEditarActividad = useCallback((act: ActividadPersonal) => {
    const tieneRecurrencia = Boolean(
      (act.frecuencia_ciclo && act.frecuencia_ciclo !== 'NINGUNA') ||
      (act.regla_repeticion && act.regla_repeticion.trim() !== '') ||
      act.tipo_compromiso === 'HABITUAL'
    );
    if (tieneRecurrencia) {
      setModalAlcance({ isOpen: true, accion: 'editar', actividad: act });
    } else {
      setActividadEditar(act);
      setAlcanceEdicion('ALL');
      setCategoriaSeleccionada(act.categoria_vida);
      setModalActividadAbierto(true);
    }
  }, []);

  const ejecutarEliminacionActividad = useCallback((act: ActividadPersonal, alcance: AlcanceRecurrencia) => {
    programarEliminacion({
      tabla: 'actividades_personales',
      id: act.id,
      etiqueta: act.nombre_actividad || 'Hábito',
      tipo: 'ACTIVIDAD',
      commit: async () => {
        await eliminarConAlcance(act.id, alcance, act.fecha_programada);
      }
    });
  }, [programarEliminacion, eliminarConAlcance]);

  const handleSolicitarEliminarActividad = useCallback((act: ActividadPersonal) => {
    const tieneRecurrencia = Boolean(
      (act.frecuencia_ciclo && act.frecuencia_ciclo !== 'NINGUNA') ||
      (act.regla_repeticion && act.regla_repeticion.trim() !== '') ||
      act.tipo_compromiso === 'HABITUAL'
    );
    if (tieneRecurrencia) {
      setModalAlcance({ isOpen: true, accion: 'eliminar', actividad: act });
    } else {
      ejecutarEliminacionActividad(act, 'ALL');
    }
  }, [ejecutarEliminacionActividad]);

  const handleConfirmarAlcance = useCallback((alcance: AlcanceRecurrencia) => {
    if (!modalAlcance) return;
    const { accion, actividad } = modalAlcance;
    setModalAlcance(null);
    if (accion === 'eliminar') {
      ejecutarEliminacionActividad(actividad, alcance);
    } else {
      setActividadEditar(actividad);
      setAlcanceEdicion(alcance);
      setCategoriaSeleccionada(actividad.categoria_vida);
      setModalActividadAbierto(true);
    }
  }, [modalAlcance, ejecutarEliminacionActividad]);

  // Toggle de completado con UI Optimista instantánea (0ms)
  const handleToggleCompletar = useCallback(async (act: ActividadPersonal, completadoDeseado: boolean) => {
    setOptimisticCompletados((prev) => ({ ...prev, [act.id]: completadoDeseado }));
    try {
      return await toggleCompletar(act, completadoDeseado);
    } catch (err) {
      // Rollback defensivo si falla la persistencia
      setOptimisticCompletados((prev) => {
        const rollback = { ...prev };
        delete rollback[act.id];
        return rollback;
      });
      throw err;
    }
  }, [toggleCompletar]);

  const handleAbrirAvance = useCallback((act: ActividadPersonal) => {
    setModalAvance({ isOpen: true, actividad: act });
  }, []);

  const handleAbrirMeta360 = useCallback((m: { id: string }) => {
    setMeta360Id(m.id);
  }, []);

  const handleConfirmarAvance = useCallback(async (valor: number) => {
    if (!modalAvance) return;
    const act = modalAvance.actividad;
    const res = await registrarAvance(act, valor);
    const metaAsociada = metasPorHabitoId.get(String(act.id)) || (act.codigo_legado ? metasPorHabitoId.get(String(act.codigo_legado)) : undefined);
    if (metaAsociada?.id) {
      recalcularProgresoMetaLocal(metaAsociada.id).catch(() => {});
    }
    return res;
  }, [modalAvance, registrarAvance, metasPorHabitoId]);

  const opcionActiva = OPCIONES_FILTRO_TEMPORAL.find((o) => o.key === filtroTemporal) || OPCIONES_FILTRO_TEMPORAL[2];
  const IconoActivo = opcionActiva.Icon;

  return (
    <div
      id="vista-habitos-wrapper"
      className="flex-1 flex flex-col min-h-0 overflow-hidden p-2 sm:p-4 lg:p-6 bg-[#040711] transition-colors duration-200"
    >
      {/* BARRA DE CONTROL SUPERIOR */}
      {!ocultarHeader && (
        <div className="mb-2 sm:mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-emerald-500/20 ring-1 ring-white/20 shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-black text-slate-100 leading-tight">
                  Hábitos & Vida Modular
                </h2>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                  SaaS Personal
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Gestión integral de hábitos, consistencia y desarrollo personal
              </p>
            </div>
          </div>

          {/* ACCIONES RÁPIDAS SUPERIORES */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => handleCrearActividad()}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all duration-200 active:scale-95 cursor-pointer"
              title="Registrar nuevo hábito o compromiso personal"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              <span>Nuevo Hábito / Actividad</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* BARRA DE KPIS RELEVANTES DE IMPACTO PERSONAL (BENTO BAR - 5 CARDS) */}
      {/* ================================================================= */}
      <div className="flex flex-row overflow-x-auto [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-2 sm:mb-3.5 shrink-0 snap-x overscroll-contain select-none">
        {/* BENTO 1: RACHA ACTIVA & CONSISTENCIA */}
        <div className="min-w-[140px] sm:min-w-0 snap-start shrink-0 portal-surface bg-[#0D1526] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-amber-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Racha Activa
            </span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-950/60 flex items-center justify-center text-amber-500">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="my-1 sm:my-1.5">
            <span className="text-sm sm:text-lg font-black text-white tracking-tight font-mono tabular-nums" id="kpi-mayor-racha">
              {kpisTablero.maxRacha} días
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9.5px] sm:text-[10px] text-slate-400 truncate">
            <span id="kpi-racha-subtexto" className="truncate font-medium">
              {kpisTablero.maxRacha >= 7 ? 'Alto rendimiento' : 'Hábito diario'}
            </span>
          </div>
        </div>

        {/* BENTO 2: TASA DE CUMPLIMIENTO DIARIO */}
        <div className="min-w-[150px] sm:min-w-0 snap-start shrink-0 portal-surface bg-[#0D1526] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Cumplimiento
            </span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-sky-950/60 border border-sky-800/40 flex items-center justify-center text-sky-400">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="my-1 sm:my-1.5 flex items-baseline justify-between">
            <span className="text-sm sm:text-lg font-black text-white tracking-tight font-mono tabular-nums" id="kpi-habitos-hoy-ratio">
              {kpisTablero.completadosHoy} / {kpisTablero.total}
            </span>
            <span className="text-xs font-bold font-mono tabular-nums text-emerald-400" id="kpi-habitos-global-cumplimiento">
              {pctCumplimiento}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 sm:h-1.5 rounded-full overflow-hidden">
            <div
              id="kpi-habitos-hoy-bar"
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${pctCumplimiento}%` }}
            />
          </div>
        </div>

        {/* BENTO 3: BALANCE DE PILARES DE VIDA */}
        <div className="min-w-[140px] sm:min-w-0 snap-start shrink-0 portal-surface bg-[#0D1526] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-sky-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Balance Vida
            </span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
              <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="my-1 sm:my-1.5">
            <span className="text-sm sm:text-lg font-black text-white tracking-tight font-mono tabular-nums" id="kpi-balance-pilares">
              {pilaresActivos} / 6 pilares
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9.5px] sm:text-[10px] text-slate-400 truncate">
            <span id="kpi-balance-subtexto" className="truncate font-medium">Equilibrio activo</span>
          </div>
        </div>

        {/* BENTO 4: RADAR DE HÁBITOS & CONTROL */}
        <div className="min-w-[140px] sm:min-w-0 snap-start shrink-0 portal-surface bg-[#0D1526] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-teal-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Radar Control
            </span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-950/60 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="my-1 sm:my-1.5">
            <span className="text-sm sm:text-lg font-black text-white tracking-tight font-mono tabular-nums" id="kpi-radar-habitos">
              {kpisTablero.total} en foco
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9.5px] sm:text-[10px] text-slate-400 truncate">
            <span id="kpi-radar-subtexto" className="truncate font-medium">100% activos</span>
          </div>
        </div>

        {/* BENTO 5: INVERSIÓN FINANCIERA EN BIENESTAR */}
        <div
          className="min-w-[155px] sm:min-w-0 snap-start shrink-0 col-span-2 sm:col-span-1 portal-surface bg-[#0D1526] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/60 transition-all select-none"
          title={`${kpisTablero.horasInvertidas.toFixed(1)} horas invertidas hoy en desarrollo personal y salud.`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Bienestar
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-rose-950/60 flex items-center justify-center text-rose-500">
                <Wallet className="w-3 sm:w-3.5 h-3 sm:h-3.5" strokeWidth={1.75} />
              </span>
            </div>
          </div>
          <div className="my-1">
            <span className="text-sm sm:text-lg font-black text-emerald-400 font-mono tabular-nums tracking-tight" id="kpi-gasto-vida">
              S/ 0.00
            </span>
          </div>
          <div className="flex items-center justify-between text-[9.5px] sm:text-[10px] text-slate-400 truncate pt-0.5 sm:pt-1 border-t border-slate-800/60">
            <span id="kpi-habitos-global-horas" className="font-mono tabular-nums">
              {kpisTablero.horasInvertidas.toFixed(1)}h hoy
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PÍLDORAS BENTO DE FILTRO Y BÚSQUEDA RÁPIDA                        */}
      {/* ================================================================= */}
      <div className="portal-surface bg-[#0D1526] p-1.5 sm:p-2.5 my-1.5 sm:my-2 rounded-xl sm:rounded-2xl border border-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-2 shrink-0 shadow-xs">
        <div className="inline-flex items-center gap-1 text-xs select-none overflow-x-auto [&::-webkit-scrollbar]:hidden overscroll-contain w-full md:w-auto shrink-0 pb-0.5 md:pb-0">
          <button
            type="button"
            onClick={() => setFiltroCompromiso('TODOS')}
            className={`h-7 px-2.5 py-0.5 rounded-lg font-bold transition flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap shrink-0 ${
              filtroCompromiso === 'TODOS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-black font-mono tabular-nums">{kpisTablero.total}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCompromiso('HABITUAL')}
            className={`h-7 px-2.5 py-0.5 rounded-lg font-bold transition flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap shrink-0 ${
              filtroCompromiso === 'HABITUAL'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Hábitos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 font-bold font-mono tabular-nums">{kpisTablero.countHabitual}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCompromiso('UNICO')}
            className={`h-7 px-2.5 py-0.5 rounded-lg font-bold transition flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap shrink-0 ${
              filtroCompromiso === 'UNICO'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Puntuales</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 font-bold font-mono tabular-nums">{kpisTablero.countUnico}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCompromiso('RACHA')}
            className={`h-7 px-2.5 py-0.5 rounded-lg font-bold transition flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap shrink-0 ${
              filtroCompromiso === 'RACHA'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Con Racha</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 font-bold font-mono tabular-nums">{kpisTablero.countRacha}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden overscroll-contain w-full md:w-auto shrink-0 pb-0.5 md:pb-0">
          {/* Selector de Filtro por Meta (REQ-HABITS-FILTER-BY-META-16) */}
          <div className="h-7.5 bg-slate-900/60 border border-slate-800/60 rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-xs shrink-0">
            <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" strokeWidth={1.75} />
            <select
              id="filtro-meta-select"
              value={filtroMetaId}
              onChange={(e) => setFiltroMetaId(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[200px] truncate"
            >
              <option value="TODAS" className="bg-[#0D1526] text-slate-200">Todas las Metas</option>
              <option value="__SIN_META__" className="bg-[#0D1526] text-slate-200">Rutina Base (Sin meta)</option>
              {metasPlanesOrdenadas.length > 0 && (
                <optgroup label="Metas y Planes Activos" className="bg-[#0D1526] text-cyan-400 font-bold">
                  {metasPlanesOrdenadas.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#0D1526] text-slate-200 font-normal">
                      {m.codigo_legado} · {m.nombre_meta}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {filtroMetaId !== 'TODAS' && filtroMetaId !== '__SIN_META__' && (
              <button
                type="button"
                onClick={() => setMeta360Id(filtroMetaId)}
                className="px-1.5 py-0.2 rounded bg-sky-950/60 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-800/60 text-[9.5px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                title="Abrir Vista Detallada 360°"
              >
                <span>360°</span>
              </button>
            )}
            {filtroMetaId !== 'TODAS' && (
              <button
                type="button"
                onClick={() => setFiltroMetaId('TODAS')}
                className="p-0.5 rounded text-slate-400 hover:text-white cursor-pointer"
                title="Restablecer"
              >
                <X className="w-3 h-3" strokeWidth={1.75} />
              </button>
            )}
          </div>

          {/* Popover de Ordenamiento */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowSortPopover(!showSortPopover)}
              className="h-7.5 px-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs font-semibold transition cursor-pointer"
              title="Opciones de Ordenamiento"
            >
              <SlidersHorizontal className="w-3 h-3 text-sky-400" />
              <span>
                {modoOrden === 'TIME' && 'Hora'}
                {modoOrden === 'STREAK' && 'Racha'}
                {modoOrden === 'ALPHA' && 'A-Z'}
                {modoOrden === 'PRIORITY' && 'Prio'}
              </span>
            </button>

            {showSortPopover && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-[#0B1222] border border-slate-700/80 rounded-xl shadow-2xl p-1.5 flex items-center gap-1 min-w-[150px]">
                {[
                  { key: 'TIME', label: 'Por Hora' },
                  { key: 'STREAK', label: 'Mayor Racha' },
                  { key: 'ALPHA', label: 'Alfabético' },
                  { key: 'PRIORITY', label: 'Prioridad' }
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => { setModoOrden(m.key as ModoOrden); setShowSortPopover(false); }}
                    className={`px-2 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      modoOrden === m.key
                        ? 'bg-sky-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buscador Rápido */}
          <div className="relative shrink-0">
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar..."
              className="text-xs h-7.5 bg-slate-900/60 border border-slate-800/80 rounded-lg pl-7 pr-6 py-1 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 shadow-2xs w-32 sm:w-48 transition-all"
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-3 h-3 text-slate-400" />
            </span>
            {filtroTexto && (
              <button
                type="button"
                onClick={() => setFiltroTexto('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filtro Temporal Desplegable */}
          <div className="relative group inline-flex items-center shrink-0">
            <button
              type="button"
              className="h-7.5 px-2 rounded-lg border border-slate-800/80 bg-[#0D1526] text-slate-300 hover:text-white flex items-center gap-1 text-xs font-semibold transition cursor-pointer shadow-xs"
              title="Horizonte Temporal"
            >
              <IconoActivo className="w-3.5 h-3.5 text-blue-400 shrink-0" strokeWidth={1.75} />
              <span className="font-semibold text-blue-400">{opcionActiva.label}</span>
            </button>

            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto flex items-center gap-1 p-1 bg-[#0D1526]/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl transition-all duration-150 whitespace-nowrap origin-right">
              {OPCIONES_FILTRO_TEMPORAL.map(({ key, label, Icon }) => {
                const activo = filtroTemporal === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFiltroTemporal(key)}
                    className={`flex items-center gap-1.5 cursor-pointer transition-all duration-150 whitespace-nowrap ${
                      activo
                        ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30 font-semibold px-2 py-0.5 text-xs rounded-lg'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 px-2 py-0.5 text-xs rounded-lg border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Categoría Móvil (Tabs Ergonómicos Canónicos) */}
      <div
        id="selector-categorias-habitos-movil"
        className="md:hidden flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden py-1 mb-2 shrink-0 select-none overscroll-contain"
      >
        {CATEGORIAS_CANONICAS.map((catKey) => {
          const cfg = CATEGORIAS_VIDA_MAP[catKey];
          const colData = actividadesPorCategoria[catKey] || { total: 0 };
          const esActiva = categoriaMovilActiva === catKey;
          const label = cfg.nombre.split(' ')[0];
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setCategoriaMovilActiva(catKey)}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                esActiva
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-slate-800/60'
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full ${
                  esActiva ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                {colData.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* TABLERO KANBAN HORIZONTAL DE 6 COLUMNAS CANÓNICAS (HÁBITOS & VIDA) */}
      {/* ================================================================= */}
      <div className="w-full flex-1 overflow-x-hidden md:overflow-x-auto pb-2 flex flex-col md:flex-row md:gap-5 min-h-0 h-full custom-scrollbar items-stretch">
        {CATEGORIAS_CANONICAS.map((catKey) => {
          const cfg = CATEGORIAS_VIDA_MAP[catKey];
          const colData = actividadesPorCategoria[catKey] || {
            items: EMPTY_ARRAY,
            completadas: EMPTY_ARRAY,
            pendientes: EMPTY_ARRAY,
            total: 0,
            pctCompletado: 0
          };
          const { completadas, pendientes, total, pctCompletado } = colData;
          const ratioTxt = `${completadas.length}/${total}`;
          const pctCol = pctCompletado;
          const isActivaMovil = categoriaMovilActiva === catKey;

          return (
            <div
              key={catKey}
              className={`w-full md:w-80 md:flex-shrink-0 ${
                isActivaMovil ? 'flex' : 'hidden md:flex'
              } flex-col portal-surface bg-[#0D1526] rounded-xl md:rounded-2xl border border-slate-800/40 h-full min-h-0 overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-cobalt-1 relative`}
              data-categoria={catKey}
            >
              {/* Encabezado Sticky de Categoría */}
              <div className="p-2.5 md:p-3.5 pb-2 md:pb-2.5 border-b border-slate-800/40 shrink-0 sticky top-0 z-10 bg-[#0D1526]/95 backdrop-blur-md">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-950/60 text-emerald-300 flex items-center justify-center text-xs shadow-2xs font-semibold">
                      {renderIconoCategoriaVida(cfg.icono, "w-3.5 h-3.5")}
                    </span>
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-wide">
                      {cfg.nombre}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-900/60">
                    {ratioTxt}
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${pctCol}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono tabular-nums">
                  <span>0.0h hoy</span>
                  <span className="font-bold text-emerald-400">{pctCol}%</span>
                </div>

                {/* Botón Añadir con Estilo Dashed Tailwind */}
                <button
                  type="button"
                  onClick={() => handleCrearActividad(catKey)}
                  className="mt-2 md:mt-2.5 w-full py-1 md:py-1.5 px-2.5 md:px-3 border border-dashed border-slate-700 hover:border-emerald-400/80 hover:bg-emerald-950/20 text-slate-400 hover:text-emerald-300 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-150 shadow-2xs group cursor-pointer"
                >
                  <span className="text-sm font-bold transition-transform group-hover:scale-110 text-emerald-500">+</span>
                  <span>Añadir Hábito / Tarea</span>
                </button>
              </div>

              {/* Cuerpo de Tarjetas con Scroll Vertical Fluido (Pendientes + Completadas Separadas) */}
              <div className="kanban-col-body flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 md:p-3 space-y-2.5 md:space-y-3 custom-scrollbar [&::-webkit-scrollbar]:hidden">
                {cargando ? (
                  /* Skeleton Loader limpio con dimensiones fijas para evitar FOUC y colapso flexbox */
                  <div className="space-y-2.5">
                    <div className="min-h-[140px] rounded-xl bg-slate-900/40 border border-slate-800/40 p-3 space-y-3 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="w-16 h-4 bg-slate-800/60 rounded" />
                        <div className="w-10 h-4 bg-slate-800/60 rounded" />
                      </div>
                      <div className="w-3/4 h-5 bg-slate-800/60 rounded mt-2" />
                      <div className="w-1/2 h-4 bg-slate-800/40 rounded mt-3" />
                    </div>
                    <div className="min-h-[140px] rounded-xl bg-slate-900/40 border border-slate-800/40 p-3 space-y-3 animate-pulse opacity-60">
                      <div className="flex justify-between items-center">
                        <div className="w-16 h-4 bg-slate-800/60 rounded" />
                        <div className="w-10 h-4 bg-slate-800/60 rounded" />
                      </div>
                      <div className="w-2/3 h-5 bg-slate-800/60 rounded mt-2" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Lista de Pendientes */}
                    <div className="space-y-2.5 min-h-[24px]">
                      {total === 0 ? (
                        <div className="min-h-[110px] p-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/50 bg-slate-900/30 text-slate-400 text-center space-y-2 select-none group/empty">
                          <div className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover/empty:text-emerald-400 transition-colors">
                            {renderIconoCategoriaVida(cfg.icono, "w-3.5 h-3.5")}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">Sin hábitos en {cfg.nombre.split(' ')[0]}</span>
                          <button
                            type="button"
                            onClick={() => handleCrearActividad(catKey)}
                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                          >
                            + Crear primer hábito
                          </button>
                        </div>
                      ) : (
                        pendientes.map((act) => (
                          <TarjetaHabito
                            key={act.id}
                            actividad={act}
                            subtareas={subtareasPorPadre.get(act.codigo_legado) || EMPTY_ARRAY}
                            metaVinculada={metasPorHabitoId.get(String(act.id)) || (act.codigo_legado ? metasPorHabitoId.get(String(act.codigo_legado)) : undefined) || (act as any).metaVinculada}
                            actividadesVinculadas={actividadesPorHabitoId?.get(String(act.id)) || (act.codigo_legado ? actividadesPorHabitoId?.get(String(act.codigo_legado)) : undefined) || (act as any).actividadesVinculadas || EMPTY_ARRAY}
                            optimisticCompletado={optimisticCompletados[act.id]}
                            onToggleCompletar={handleToggleCompletar}
                            onAbrirAvance={handleAbrirAvance}
                            onToggleSubtarea={toggleSubtarea}
                            onEditar={handleEditarActividad}
                            onEliminar={handleSolicitarEliminarActividad}
                            onAbrirMeta360={handleAbrirMeta360}
                          />
                        ))
                      )}
                    </div>

                    {/* Sección de Completadas del Día */}
                    {completadas.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/60 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                          Completadas Hoy ({completadas.length})
                        </span>
                        {completadas.map((act) => (
                          <TarjetaHabito
                            key={act.id}
                            actividad={act}
                            subtareas={subtareasPorPadre.get(act.codigo_legado) || EMPTY_ARRAY}
                            metaVinculada={metasPorHabitoId.get(String(act.id)) || (act.codigo_legado ? metasPorHabitoId.get(String(act.codigo_legado)) : undefined) || (act as any).metaVinculada}
                            actividadesVinculadas={actividadesPorHabitoId?.get(String(act.id)) || (act.codigo_legado ? actividadesPorHabitoId?.get(String(act.codigo_legado)) : undefined) || (act as any).actividadesVinculadas || EMPTY_ARRAY}
                            optimisticCompletado={optimisticCompletados[act.id]}
                            onToggleCompletar={handleToggleCompletar}
                            onAbrirAvance={handleAbrirAvance}
                            onToggleSubtarea={toggleSubtarea}
                            onEditar={handleEditarActividad}
                            onEliminar={handleSolicitarEliminarActividad}
                            onAbrirMeta360={handleAbrirMeta360}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Canónico ActividadFlow */}
      <ModalActividadFlow
        isOpen={modalActividadAbierto}
        onClose={() => {
          setModalActividadAbierto(false);
          setActividadEditar(null);
        }}
        actividadEditar={actividadEditar}
        categoriaInicial={categoriaSeleccionada || actividadEditar?.categoria_vida || 'SALUD_DEPORTE'}
        alcanceEdicion={alcanceEdicion}
      />

      {/* Modal Elevado de Alcance de Recurrencia (Single Instance Pattern) */}
      {modalAlcance && (
        <ModalAlcanceRecurrencia
          isOpen={modalAlcance.isOpen}
          accion={modalAlcance.accion}
          tituloActividad={modalAlcance.actividad.nombre_actividad || 'Hábito'}
          fechaActual={modalAlcance.actividad.fecha_programada}
          onSeleccionarAlcance={handleConfirmarAlcance}
          onClose={() => setModalAlcance(null)}
        />
      )}

      {/* Modal Elevado de Registro de Avance Cuantitativo Bento (Zero Swal) */}
      {modalAvance && (
        <ModalRegistroAvanceHabito
          isOpen={modalAvance.isOpen}
          titulo={modalAvance.actividad.nombre_actividad || 'Hábito'}
          unidadMedida={modalAvance.actividad.unidad_medida || 'unidades'}
          valorActual={modalAvance.actividad.valor_acumulado_actual || 0}
          metaTotal={modalAvance.actividad.meta_objetivo_total || 0}
          rescateMinimo={modalAvance.actividad.nivel_rescate_minimo || 0}
          onRegistrar={async (val) => {
            await handleConfirmarAvance(val);
          }}
          onClose={() => setModalAvance(null)}
        />
      )}

      {/* Vista Detallada 360° de Meta / Plan (Pantalla Completa) */}
      {metaActiva360 && (
        <ModalDetalleMeta360
          meta={metaActiva360}
          todasLasActividades={todasLasActividades || actividades}
          todosLosVinculos={vinculosPlan}
          logs={logsCumplimiento}
          onClose={() => setMeta360Id(null)}
        />
      )}
    </div>
  );
};
