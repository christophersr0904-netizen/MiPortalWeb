import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Layers,
  Calendar
} from 'lucide-react';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import { ModalAlcanceRecurrencia } from '../Modals/ModalAlcanceRecurrencia';
import { ModalRegistroAvanceHabito } from '../Modals/ModalRegistroAvanceHabito';
import { recalcularProgresoMetaLocal } from '../../services/metasService';
import { esActividadCompletadaHoy } from '../../services/habitosService';
import {
  autorizarGoogleCalendarOAuth,
  limpiarTokenGoogleCalendar,
  obtenerEstadoConexionGoogleCalendar,
  suscribirEstadoGoogleCalendar,
  type EstadoConexionGoogleCalendar
} from '../../services/calendarSyncService';
import { formatFechaIsoLocal } from '../../utils/timeFormatters';
import { evaluarOcurrenciaEnFecha } from '../../utils/recurrenceEngine';
import { mostrarToastCobalt } from '../../utils/toastCobalt';

const EMPTY_ARRAY: any[] = [];

interface ColumnaHabitosData {
  pendientes: ActividadPersonal[];
  completadas: ActividadPersonal[];
  total: number;
  pctCompletado: number;
  horasHoy: number;
  horasPlanificadas: number;
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

type ModoOrden = 'TIME' | 'GOAL' | 'ALPHA' | 'STREAK' | 'PRIORITY';
type FiltroCompromiso = 'TODOS' | 'HABITUAL' | 'UNICO' | 'RACHA';
type FiltroTemporal = 'HOY' | 'SEMANA' | 'TODOS';

export const TIPOS_HABITO_INCLUSIVOS = [
  'HABITUAL',
  'HABITO_MANTENIMIENTO',
  'HABITO_ACUMULATIVO',
  'CHECKLIST_META'
] as const;

export function esTipoHabitoRecurrente(tipo?: string): boolean {
  if (!tipo) return false;
  return (TIPOS_HABITO_INCLUSIVOS as readonly string[]).includes(tipo);
}

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
    filtroTexto,
    setFiltroTexto,
    toggleCompletar,
    registrarAvance,
    toggleSubtarea,
    eliminarConAlcance,
    cargando
  } = useHabitos();

  const { programarEliminacion, estaOculto, hiddenIdsSet } = useUndoDelete();

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
  const [showTemporalPopover, setShowTemporalPopover] = useState(false);
  const [gcalEstado, setGcalEstado] = useState<EstadoConexionGoogleCalendar>(() => obtenerEstadoConexionGoogleCalendar());

  useEffect(() => {
    setGcalEstado(obtenerEstadoConexionGoogleCalendar());
    return suscribirEstadoGoogleCalendar(setGcalEstado);
  }, []);

  // Cerrar popovers de toolbar con Escape (respetando prioridad de modales superiores)
  useEffect(() => {
    if (!showSortPopover && !showTemporalPopover) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSortPopover(false);
        setShowTemporalPopover(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSortPopover, showTemporalPopover]);

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
    const actsMeta = actividades.filter((a) => {
      const tieneRec = Boolean(
        (a.frecuencia_ciclo && a.frecuencia_ciclo !== 'NINGUNA') ||
        (a.regla_repeticion && a.regla_repeticion.trim() !== '')
      );
      const esRec = esTipoHabitoRecurrente(a.tipo_compromiso) || tieneRec;
      if (esRec ? a.estado === '05_Archivado' : esElementoArchivado(a, 'actividades')) return false;
      return filtroMetaId === 'TODAS' || evaluarFiltroMeta(a, filtroMetaId, metasPorHabitoId, metasPlanes);
    });

    const res = {
      total: actsMeta.length,
      countHabitual: 0,
      countUnico: 0,
      countRacha: 0,
      maxRacha: 0,
      completadosHoy: 0,
      horasInvertidas: 0,
      gastoTotal: 0,
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
      if (esTipoHabitoRecurrente(a.tipo_compromiso)) res.countHabitual++;
      else res.countUnico++;

      const racha = a.racha_actual || 0;
      if (racha > 0) res.countRacha++;
      if (racha > res.maxRacha) res.maxRacha = racha;

      if (a.categoria_vida in res.pilarCounts) {
        res.pilarCounts[a.categoria_vida]++;
      }

      if (typeof a.monto_gasto_asociado === 'number' && a.monto_gasto_asociado > 0) {
        res.gastoTotal += a.monto_gasto_asociado;
      }

      if (esActividadCompletadaHoy(a, hoyStr)) {
        res.completadosHoy++;
        res.horasInvertidas += a.duracion_horas || 0;
      }
    }

    return res;
  }, [filtroMetaId, actividades, metasPorHabitoId, metasPlanes, hoyStr]);

  const pctCumplimiento = kpisTablero.total > 0 ? Math.round((kpisTablero.completadosHoy / kpisTablero.total) * 100) : 0;
  const pilaresActivos = Object.values(kpisTablero.pilarCounts).filter((c) => c > 0).length;

  const diasSemanaActual = useMemo(() => {
    const base = new Date(`${hoyStr}T12:00:00`);
    const day = base.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const lunes = new Date(base);
    lunes.setDate(base.getDate() + diffToMon);
    const arr: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      arr.push(formatFechaIsoLocal(d));
    }
    return arr;
  }, [hoyStr]);

  // Filtrado y ordenamiento de actividades con exclusión de archivados (+10 días), meta y horizonte temporal
  const actividadesProcesadas = useMemo(() => {
    let list = actividades.filter((a) => {
      // 1. Exclusión obligatoria de Bóveda de Archivados (+10 días desde su fecha terminal)
      // Para elementos de tipo hábito/recurrente, evitar que esElementoArchivado los oculte por desfase de fecha semilla si están activos (estado !== '05_Archivado').
      const tieneRec = Boolean(
        (a.frecuencia_ciclo && a.frecuencia_ciclo !== 'NINGUNA') ||
        (a.regla_repeticion && a.regla_repeticion.trim() !== '')
      );
      const esRecurrente = esTipoHabitoRecurrente(a.tipo_compromiso) || tieneRec;
      if (esRecurrente ? a.estado === '05_Archivado' : esElementoArchivado(a, 'actividades')) {
        return false;
      }

      // 2. Filtro por meta estratégica (REQ-HABITS-FILTER-BY-META-16)
      if (!evaluarFiltroMeta(a, filtroMetaId, metasPorHabitoId, metasPlanes)) {
        return false;
      }

      // 3. Filtro por tipo de compromiso flexibilizado (REQ-FIX-01)
      if (filtroCompromiso === 'HABITUAL' && !esTipoHabitoRecurrente(a.tipo_compromiso)) return false;
      if (filtroCompromiso === 'UNICO' && esTipoHabitoRecurrente(a.tipo_compromiso)) return false;
      if (filtroCompromiso === 'RACHA' && (!a.racha_actual || a.racha_actual <= 0)) return false;

      // 4. Filtro Temporal Canónico ('HOY' | 'SEMANA' | 'TODOS')
      if (filtroTemporal !== 'TODOS') {
        const esRutinaria = esRecurrente;

        if (filtroTemporal === 'HOY') {
          const fProgLimpia = (a.fecha_programada || '').split(/[\sT]/)[0];
          const completadaHoy = esActividadCompletadaHoy(a, hoyStr);
          const estaEnMora = fProgLimpia < hoyStr && !completadaHoy && (!a.fecha_fin || fProgLimpia <= a.fecha_fin);
          if (esRutinaria) {
            const agendadaHoy = fProgLimpia === hoyStr;
            const aplicaPorRecurrenciaHoy = evaluarOcurrenciaEnFecha(a, hoyStr);
            if (!agendadaHoy && !estaEnMora && !completadaHoy && !aplicaPorRecurrenciaHoy) return false;
          } else {
            if (!evaluarFiltroTemporal(a.fecha_programada, 'HOY') && !estaEnMora && !completadaHoy) return false;
          }
        } else if (filtroTemporal === 'SEMANA') {
          if (esRutinaria) {
            const aplicaSemana =
              evaluarFiltroTemporal(a.fecha_programada, 'SEMANA') ||
              diasSemanaActual.some((fDia) => evaluarOcurrenciaEnFecha(a, fDia));
            if (!aplicaSemana) return false;
          } else {
            if (!evaluarFiltroTemporal(a.fecha_programada, 'SEMANA')) return false;
          }
        }
      }

      return true;
    });

    list.sort((a, b) => {
      // 1. Caso 'TIME' (Orden Cronológico por hora_inicio canónica con desempate alfabético)
      if (modoOrden === 'TIME') {
        const hA = a.hora_inicio?.trim() || '99:99';
        const hB = b.hora_inicio?.trim() || '99:99';
        const diff = hA.localeCompare(hB);
        return diff !== 0 ? diff : (a.nombre_actividad || '').localeCompare(b.nombre_actividad || '');
      }

      // 2. Caso 'GOAL' (Orden por Meta Estratégica vinculada con desempate por hora)
      if (modoOrden === 'GOAL') {
        const mA = a.metaVinculada?.codigo_legado || a.meta_macro_nombre || 'ZZZ';
        const mB = b.metaVinculada?.codigo_legado || b.meta_macro_nombre || 'ZZZ';
        const diff = mA.localeCompare(mB);
        if (diff !== 0) return diff;
        const hA = a.hora_inicio?.trim() || '99:99';
        const hB = b.hora_inicio?.trim() || '99:99';
        return hA.localeCompare(hB);
      }

      // 3. Caso 'STREAK' (Mayor Racha consecutiva)
      if (modoOrden === 'STREAK') {
        return (b.racha_actual || 0) - (a.racha_actual || 0);
      }

      // 4. Caso 'ALPHA' (Alfabético A-Z)
      if (modoOrden === 'ALPHA') {
        const nomA = a.nombre_actividad || (a as any).nombre || (a as any).Nombre_Actividad || (a as any).Nombre || (a as any).titulo || '';
        const nomB = b.nombre_actividad || (b as any).nombre || (b as any).Nombre_Actividad || (b as any).Nombre || (b as any).titulo || '';
        return nomA.localeCompare(nomB);
      }

      // 5. Caso 'PRIORITY' (Matriz Eisenhower: Alta/P1 -> Media/P2 -> Baja/P3 -> P4)
      if (modoOrden === 'PRIORITY') {
        const mapearPrio = (prio?: string): number => {
          if (!prio) return 99;
          const p = String(prio).toUpperCase().trim();
          if (p.includes('DO_FIRST') || p.includes('01_P1') || p.includes('ALTA') || p.includes('P1')) return 1;
          if (p.includes('SCHEDULE') || p.includes('02_P2') || p.includes('MEDIA') || p.includes('P2')) return 2;
          if (p.includes('DELEGATE') || p.includes('03_P3') || p.includes('BAJA') || p.includes('P3')) return 3;
          if (p.includes('DONT_DO') || p.includes('04_P4') || p.includes('DELEGABLE') || p.includes('P4')) return 4;
          return 99;
        };
        const pA = mapearPrio((a as any).prioridad_eisenhower || (a as any).Prioridad_Eisenhower);
        const pB = mapearPrio((b as any).prioridad_eisenhower || (b as any).Prioridad_Eisenhower);
        if (pA !== pB) return pA - pB;
        const hA = a.hora_inicio?.trim() || '99:99';
        const hB = b.hora_inicio?.trim() || '99:99';
        return hA.localeCompare(hB);
      }

      // Fallback por defecto: Cronológico
      const hA = a.hora_inicio?.trim() || '99:99';
      const hB = b.hora_inicio?.trim() || '99:99';
      const diff = hA.localeCompare(hB);
      return diff !== 0 ? diff : (a.nombre_actividad || '').localeCompare(b.nombre_actividad || '');
    });

    return list;
  }, [actividades, filtroMetaId, metasPorHabitoId, metasPlanes, filtroCompromiso, filtroTemporal, modoOrden, hoyStr, diasSemanaActual]);

  // Pre-cálculo O(N) por Categoría para erradicar re-cálculos anidados en el render (REQ-SYS-005-HABITOS)
  const actividadesPorCategoria = useMemo<Record<CategoriaVida, ColumnaHabitosData>>(() => {
    const mapa: Record<CategoriaVida, ColumnaHabitosData> = {
      SALUD_DEPORTE: { pendientes: [], completadas: [], total: 0, pctCompletado: 0, horasHoy: 0, horasPlanificadas: 0 },
      DESARROLLO_ESTUDIO: { pendientes: [], completadas: [], total: 0, pctCompletado: 0, horasHoy: 0, horasPlanificadas: 0 },
      LABORAL_HONORARIO: { pendientes: [], completadas: [], total: 0, pctCompletado: 0, horasHoy: 0, horasPlanificadas: 0 },
      FINANZAS_TRAMITES: { pendientes: [], completadas: [], total: 0, pctCompletado: 0, horasHoy: 0, horasPlanificadas: 0 },
      SOCIAL_FAMILIA: { pendientes: [], completadas: [], total: 0, pctCompletado: 0, horasHoy: 0, horasPlanificadas: 0 },
      PERSONAL_DESCANSO: { pendientes: [], completadas: [], total: 0, pctCompletado: 0, horasHoy: 0, horasPlanificadas: 0 }
    };

    for (const act of actividadesProcesadas) {
      if (estaOculto(act.id) || hiddenIdsSet.has(act.id) || (act.codigo_legado && hiddenIdsSet.has(act.codigo_legado))) continue;

      const rawCat = (act.categoria_vida || '').toUpperCase().trim() as CategoriaVida;
      const catFinal: CategoriaVida = CATEGORIAS_CANONICAS.includes(rawCat) ? rawCat : 'SALUD_DEPORTE';

      const completada =
        optimisticCompletados[act.id] !== undefined
          ? optimisticCompletados[act.id]
          : esActividadCompletadaHoy(act, hoyStr);

      const dur = Number(act.duracion_horas || 0) || 0;
      mapa[catFinal].horasPlanificadas += dur;

      if (completada) {
        mapa[catFinal].completadas.push(act);
        mapa[catFinal].horasHoy += dur;
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
  }, [actividadesProcesadas, hiddenIdsSet, estaOculto, optimisticCompletados, hoyStr]);

  const handleCrearActividad = useCallback((categoriaPrevia?: CategoriaVida) => {
    setActividadEditar(null);
    setAlcanceEdicion('ALL');
    setCategoriaSeleccionada(categoriaPrevia || 'SALUD_DEPORTE');
    setModalActividadAbierto(true);
  }, []);

  // Abrir siempre el modal de edición directamente; el alcance se pregunta solo al guardar con cambios reales
  const handleEditarActividad = useCallback((act: ActividadPersonal) => {
    setActividadEditar(act);
    setAlcanceEdicion('ALL');
    setCategoriaSeleccionada(act.categoria_vida);
    setModalActividadAbierto(true);
  }, []);

  const ejecutarEliminacionActividad = useCallback((act: ActividadPersonal, alcance: AlcanceRecurrencia) => {
    programarEliminacion({
      tabla: 'actividades_personales',
      id: act.id,
      etiqueta: act.nombre_actividad || 'Hábito',
      tipo: 'ACTIVIDAD',
      commit: async () => {
        const res = await eliminarConAlcance(act.id, alcance, act.fecha_programada);
        if (res?.calendarResult) {
          if (res.calendarResult.success && res.calendarResult.mode === 'API_V3') {
            mostrarToastCobalt(res.calendarResult.message || 'Eliminado en Google Calendar', 'info');
          } else if (res.calendarResult.requiereAuth) {
            mostrarToastCobalt('Eliminado localmente · Conecta Google Calendar para sync automático', 'info', 3000);
          }
        }
      }
    });
  }, [programarEliminacion, eliminarConAlcance]);

  const handleSolicitarEliminarActividad = useCallback((act: ActividadPersonal) => {
    const tieneRecurrencia = Boolean(
      (act.frecuencia_ciclo && act.frecuencia_ciclo !== 'NINGUNA') ||
      (act.regla_repeticion && act.regla_repeticion.trim() !== '') ||
      esTipoHabitoRecurrente(act.tipo_compromiso)
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

  // Reconciliación automática: libera cada estado optimista apenas useLiveQuery refleje el nuevo registro en Dexie
  useEffect(() => {
    setOptimisticCompletados((prev) => {
      const keys = Object.keys(prev);
      if (keys.length === 0) return prev;
      let changed = false;
      const next = { ...prev };
      const mapAct = new Map(actividades.map((a) => [a.id, a]));
      for (const id of keys) {
        const act = mapAct.get(id);
        if (!act || esActividadCompletadaHoy(act, hoyStr) === prev[id]) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [actividades, hoyStr]);

  // Toggle de completado con UI Optimista persistente hasta la emisión reactiva de useLiveQuery
  const handleToggleCompletar = useCallback(async (act: ActividadPersonal, completadoDeseado: boolean) => {
    setOptimisticCompletados((prev) => ({ ...prev, [act.id]: completadoDeseado }));
    try {
      return await toggleCompletar(act, completadoDeseado);
    } catch (err) {
      setOptimisticCompletados((prev) => {
        if (!(act.id in prev)) return prev;
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
            <div className="p-2 sm:p-2.5 bg-[#0B132B] text-sky-400 border border-slate-800/80 rounded-xl shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-black text-slate-100 leading-tight">
                  Hábitos & Vida Modular
                </h2>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/60">
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
              className="h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
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
      <div className="flex flex-row overflow-x-auto [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 mb-2 sm:mb-2.5 shrink-0 snap-x overscroll-contain select-none">
        {/* BENTO 1: RACHA ACTIVA & CONSISTENCIA */}
        <div className="min-w-[130px] sm:min-w-0 snap-start shrink-0 portal-surface bg-[#0D1526] p-2 sm:p-2.5 rounded-xl border border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Racha Activa
            </span>
            <span className="w-5 h-5 rounded-md bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={1.75} />
            </span>
          </div>
          <div className="my-0.5 sm:my-1">
            <span className="text-sm sm:text-base font-bold text-white tracking-tight font-mono tabular-nums" id="kpi-mayor-racha">
              {kpisTablero.maxRacha} días
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[9.5px] text-slate-400 truncate">
            <span id="kpi-racha-subtexto" className="truncate font-medium font-mono tabular-nums">
              {kpisTablero.countRacha > 0 ? `${kpisTablero.countRacha} en racha` : 'Sin racha activa'}
            </span>
          </div>
        </div>

        {/* BENTO 2: TASA DE CUMPLIMIENTO DIARIO */}
        <div className="min-w-[140px] sm:min-w-0 snap-start shrink-0 portal-surface bg-[#0D1526] p-2 sm:p-2.5 rounded-xl border border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cumplimiento
            </span>
            <span className="w-5 h-5 rounded-md bg-sky-950/60 border border-sky-800/40 flex items-center justify-center text-sky-400">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={1.75} />
            </span>
          </div>
          <div className="my-0.5 sm:my-1 flex items-baseline justify-between">
            <span className="text-sm sm:text-base font-bold text-white tracking-tight font-mono tabular-nums" id="kpi-habitos-hoy-ratio">
              {kpisTablero.completadosHoy} / {kpisTablero.total}
            </span>
            <span className="text-[11px] font-bold font-mono tabular-nums text-emerald-400" id="kpi-habitos-global-cumplimiento">
              {pctCumplimiento}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              id="kpi-habitos-hoy-bar"
              className={`h-full rounded-full transition-all duration-300 ${pctCumplimiento >= 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
              style={{ width: `${pctCumplimiento}%` }}
            />
          </div>
        </div>

        {/* BENTO 3: BALANCE DE PILARES DE VIDA */}
        <div className="min-w-[130px] sm:min-w-0 snap-start shrink-0 portal-surface bg-[#0D1526] p-2 sm:p-2.5 rounded-xl border border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Balance Vida
            </span>
            <span className="w-5 h-5 rounded-md bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-sky-400">
              <PieChart className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={1.75} />
            </span>
          </div>
          <div className="my-0.5 sm:my-1">
            <span className="text-sm sm:text-base font-bold text-white tracking-tight font-mono tabular-nums" id="kpi-balance-pilares">
              {pilaresActivos} / 6 pilares
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[9.5px] text-slate-400 truncate">
            <span id="kpi-balance-subtexto" className="truncate font-medium font-mono tabular-nums">
              {pilaresActivos === 6 ? 'Cobertura total' : `${6 - pilaresActivos} sin asignar`}
            </span>
          </div>
        </div>

        {/* BENTO 4: RADAR DE HÁBITOS & CONTROL */}
        <div className="min-w-[130px] sm:min-w-0 snap-start shrink-0 portal-surface bg-[#0D1526] p-2 sm:p-2.5 rounded-xl border border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Radar Control
            </span>
            <span className="w-5 h-5 rounded-md bg-sky-950/60 border border-sky-800/40 flex items-center justify-center text-sky-400">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={1.75} />
            </span>
          </div>
          <div className="my-0.5 sm:my-1">
            <span className="text-sm sm:text-base font-bold text-white tracking-tight font-mono tabular-nums" id="kpi-radar-habitos">
              {kpisTablero.total} en foco
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[9.5px] text-slate-400 truncate">
            <span id="kpi-radar-subtexto" className="truncate font-medium font-mono tabular-nums">
              {kpisTablero.countHabitual} hábitos · {kpisTablero.countUnico} puntuales
            </span>
          </div>
        </div>

        {/* BENTO 5: INVERSIÓN FINANCIERA EN BIENESTAR */}
        <div
          className="min-w-[145px] sm:min-w-0 snap-start shrink-0 col-span-2 sm:col-span-1 portal-surface bg-[#0D1526] p-2 sm:p-2.5 rounded-xl border border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition-all select-none"
          title={`Inversión acumulada: S/ ${kpisTablero.gastoTotal.toFixed(2)} | ${kpisTablero.horasInvertidas.toFixed(1)}h completadas hoy.`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Bienestar
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="w-5 h-5 rounded-md bg-sky-950/60 border border-sky-800/40 flex items-center justify-center text-sky-400">
                <Wallet className="w-3 h-3" strokeWidth={1.75} />
              </span>
            </div>
          </div>
          <div className="my-0.5 sm:my-1">
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono tabular-nums tracking-tight" id="kpi-gasto-vida">
              S/ {kpisTablero.gastoTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[9.5px] text-slate-400 truncate pt-0.5 border-t border-slate-800/60">
            <span id="kpi-habitos-global-horas" className="font-mono tabular-nums">
              {kpisTablero.horasInvertidas.toFixed(1)}h hoy
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PÍLDORAS BENTO DE FILTRO Y BÚSQUEDA RÁPIDA (h-9 DARK COBALT)      */}
      {/* ================================================================= */}
      <div className="portal-surface bg-[#0D1526] p-1.5 sm:p-2 my-1.5 rounded-xl border border-slate-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-2 shrink-0 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs select-none overflow-x-auto [&::-webkit-scrollbar]:hidden overscroll-contain w-full lg:w-auto shrink-0 pb-0.5 lg:pb-0">
          <button
            type="button"
            onClick={() => setFiltroCompromiso('TODOS')}
            className={`h-9 px-3 rounded-lg border font-mono text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              filtroCompromiso === 'TODOS'
                ? 'bg-sky-950/30 text-sky-300 border-sky-500/40 font-semibold'
                : 'bg-[#040711]/60 border-slate-800/60 text-slate-400 hover:text-sky-300'
            }`}
          >
            <span>Todos</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
              filtroCompromiso === 'TODOS' ? 'bg-sky-900/50 text-sky-200 border border-sky-700/40' : 'bg-slate-800/80 text-slate-400'
            }`}>{kpisTablero.total}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCompromiso('HABITUAL')}
            className={`h-9 px-3 rounded-lg border font-mono text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              filtroCompromiso === 'HABITUAL'
                ? 'bg-sky-950/30 text-sky-300 border-sky-500/40 font-semibold'
                : 'bg-[#040711]/60 border-slate-800/60 text-slate-400 hover:text-sky-300'
            }`}
          >
            <Repeat className={`w-3.5 h-3.5 ${filtroCompromiso === 'HABITUAL' ? 'text-sky-400' : 'text-slate-400'}`} strokeWidth={1.75} />
            <span>Hábitos</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
              filtroCompromiso === 'HABITUAL' ? 'bg-sky-900/50 text-sky-200 border border-sky-700/40' : 'bg-slate-800/80 text-slate-400'
            }`}>{kpisTablero.countHabitual}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCompromiso('UNICO')}
            className={`h-9 px-3 rounded-lg border font-mono text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              filtroCompromiso === 'UNICO'
                ? 'bg-sky-950/30 text-sky-300 border-sky-500/40 font-semibold'
                : 'bg-[#040711]/60 border-slate-800/60 text-slate-400 hover:text-sky-300'
            }`}
          >
            <Target className={`w-3.5 h-3.5 ${filtroCompromiso === 'UNICO' ? 'text-sky-400' : 'text-slate-400'}`} strokeWidth={1.75} />
            <span>Puntuales</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
              filtroCompromiso === 'UNICO' ? 'bg-sky-900/50 text-sky-200 border border-sky-700/40' : 'bg-slate-800/80 text-slate-400'
            }`}>{kpisTablero.countUnico}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCompromiso('RACHA')}
            className={`h-9 px-3 rounded-lg border font-mono text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              filtroCompromiso === 'RACHA'
                ? 'bg-sky-950/30 text-sky-300 border-sky-500/40 font-semibold'
                : 'bg-[#040711]/60 border-slate-800/60 text-slate-400 hover:text-sky-300'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${filtroCompromiso === 'RACHA' ? 'text-amber-400' : 'text-slate-400'}`} strokeWidth={1.75} />
            <span>Con Racha</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
              filtroCompromiso === 'RACHA' ? 'bg-sky-900/50 text-sky-200 border border-sky-700/40' : 'bg-slate-800/80 text-slate-400'
            }`}>{kpisTablero.countRacha}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap w-full lg:w-auto shrink-0">
          {/* Selector de Filtro por Meta (REQ-HABITS-FILTER-BY-META-16) */}
          <div className="h-9 bg-[#040711]/60 border border-slate-800/60 rounded-lg px-2.5 flex items-center gap-1.5 shadow-xs shrink-0">
            <Target className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
            <select
              id="filtro-meta-select"
              value={filtroMetaId}
              onChange={(e) => setFiltroMetaId(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
            >
              <option value="TODAS" className="bg-[#0D1526] text-slate-200">Todas las Metas</option>
              <option value="__SIN_META__" className="bg-[#0D1526] text-slate-200">Rutina Base (Sin meta)</option>
              {metasPlanesOrdenadas.length > 0 && (
                <optgroup label="Metas y Planes Activos" className="bg-[#0D1526] text-sky-400 font-bold">
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
                className="px-1.5 py-0.5 rounded bg-sky-950/60 hover:bg-sky-500 text-sky-300 hover:text-slate-950 border border-sky-800/60 text-[10px] font-bold flex items-center gap-0.5 transition cursor-pointer shrink-0 font-mono"
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
              onClick={() => {
                setShowTemporalPopover(false);
                setShowSortPopover((prev) => !prev);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-800/60 bg-[#040711]/60 text-slate-300 hover:text-sky-300 flex items-center gap-1.5 text-xs font-medium transition cursor-pointer font-mono"
              title="Opciones de Ordenamiento"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
              <span>
                {modoOrden === 'TIME' && 'Hora'}
                {modoOrden === 'GOAL' && 'Metas'}
                {modoOrden === 'ALPHA' && 'A-Z'}
                {modoOrden === 'PRIORITY' && 'Prio'}
                {modoOrden === 'STREAK' && 'Racha'}
              </span>
            </button>

            {showSortPopover && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSortPopover(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-50 flex flex-col gap-1 p-1.5 min-w-[150px] bg-[#080D1A] border border-slate-800/80 rounded-xl shadow-xl backdrop-blur-md">
                  {[
                    { key: 'TIME', label: 'Por Hora' },
                    { key: 'GOAL', label: 'Por Metas' },
                    { key: 'ALPHA', label: 'Alfabético (A-Z)' },
                    { key: 'PRIORITY', label: 'Por Prioridad' },
                    { key: 'STREAK', label: 'Mayor Racha' }
                  ].map((m) => {
                    const activo = modoOrden === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setModoOrden(m.key as ModoOrden);
                          setShowSortPopover(false);
                        }}
                        className={`font-mono text-xs px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer flex items-center justify-between ${
                          activo
                            ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 font-semibold shadow-xs'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <span>{m.label}</span>
                        {activo && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Buscador Rápido */}
          <div className="relative shrink-0 flex-1 sm:flex-initial">
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar..."
              className="text-xs h-9 bg-[#040711]/60 border border-slate-800/60 rounded-lg pl-8 pr-7 py-1 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/40 w-full sm:w-44 transition-all"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            </span>
            {filtroTexto && (
              <button
                type="button"
                onClick={() => setFiltroTexto('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            )}
          </div>

          {/* Filtro Temporal Táctil (Click + Clic fuera + Escape) */}
          <div className="relative inline-flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowSortPopover(false);
                setShowTemporalPopover((prev) => !prev);
              }}
              aria-expanded={showTemporalPopover}
              className="h-9 px-2.5 rounded-lg border border-slate-800/60 bg-[#040711]/60 text-sky-300 hover:border-sky-500/40 flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
              title="Horizonte Temporal"
            >
              <IconoActivo className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
              <span>{opcionActiva.label}</span>
            </button>

            {showTemporalPopover && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTemporalPopover(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-50 flex flex-col gap-1 p-1.5 min-w-[135px] bg-[#080D1A] border border-slate-800/80 rounded-xl shadow-2xl backdrop-blur-md">
                  {OPCIONES_FILTRO_TEMPORAL.map(({ key, label, Icon }) => {
                    const activo = filtroTemporal === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setFiltroTemporal(key);
                          setShowTemporalPopover(false);
                        }}
                        className={`flex items-center justify-between gap-2 cursor-pointer transition-colors px-2.5 py-1.5 text-xs rounded-lg ${
                          activo
                            ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>{label}</span>
                        </span>
                        {activo && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Estado y Conexión Google Calendar API v3 (1 clic) */}
          <button
            type="button"
            id="btn-gcal-status-habitos"
            onClick={async () => {
              if (gcalEstado.conectado) {
                limpiarTokenGoogleCalendar();
                mostrarToastCobalt('Sesión de Google Calendar desconectada', 'info');
                return;
              }
              const res = await autorizarGoogleCalendarOAuth();
              if (res.success) {
                mostrarToastCobalt('Google Calendar conectado para sync automático', 'success');
              } else {
                mostrarToastCobalt(res.error || 'No se pudo conectar Google Calendar', 'warning', 3500);
              }
            }}
            className={`h-9 px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap ${
              gcalEstado.conectado
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/50'
                : 'bg-[#040711]/60 border-slate-800/60 text-slate-300 hover:border-sky-500/40 hover:text-sky-300'
            }`}
            title={
              gcalEstado.conectado
                ? 'Google Calendar conectado (clic para desconectar)'
                : 'Conectar Google Calendar para sincronización automática Create/Update/Delete'
            }
          >
            <Calendar className={`w-3.5 h-3.5 shrink-0 ${gcalEstado.conectado ? 'text-emerald-400' : 'text-sky-400'}`} strokeWidth={1.75} />
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${gcalEstado.conectado ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className="hidden xl:inline">{gcalEstado.conectado ? 'Calendar Conectado' : 'Conectar Calendar'}</span>
          </button>
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
              className={`h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                esActiva
                  ? 'bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-xs'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-slate-800/60'
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-full ${
                  esActiva ? 'bg-sky-500/20 text-sky-200' : 'bg-slate-800/80 text-slate-400'
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
            completadas: EMPTY_ARRAY,
            pendientes: EMPTY_ARRAY,
            total: 0,
            pctCompletado: 0,
            horasHoy: 0,
            horasPlanificadas: 0
          };
          const { completadas, pendientes, total, pctCompletado, horasHoy, horasPlanificadas } = colData;
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
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-6 h-6 rounded-lg border ${cfg.badgeClase} flex items-center justify-center text-xs shadow-2xs font-semibold shrink-0`}>
                      {renderIconoCategoriaVida(cfg.icono, "w-3.5 h-3.5")}
                    </span>
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-wide truncate">
                      {cfg.nombre}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums font-bold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-800/60 shrink-0">
                    {ratioTxt}
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`${pctCol >= 100 ? 'bg-emerald-500' : 'bg-sky-500'} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${pctCol}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono tabular-nums">
                  <span title={`${horasHoy.toFixed(1)}h completadas de ${horasPlanificadas.toFixed(1)}h planificadas`}>
                    {horasHoy.toFixed(1)}h hoy
                  </span>
                  <span className={`font-bold ${pctCol >= 100 ? 'text-emerald-400' : 'text-sky-400'}`}>{pctCol}%</span>
                </div>

                {/* Botón Añadir Compacto */}
                <button
                  type="button"
                  onClick={() => handleCrearActividad(catKey)}
                  className="mt-2 h-8 w-full px-2.5 border border-dashed border-slate-700/70 hover:border-sky-500/50 hover:bg-sky-950/20 text-slate-400 hover:text-sky-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-150 group cursor-pointer"
                  title={`Añadir actividad en ${cfg.nombre}`}
                >
                  <Plus className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                  <span>Añadir</span>
                </button>
              </div>

              {/* Cuerpo de Tarjetas con Scroll Vertical Fluido (Pendientes + Completadas Separadas) */}
              <div className="kanban-col-body flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 md:p-3 pb-28 md:pb-4 space-y-2.5 md:space-y-3 custom-scrollbar [&::-webkit-scrollbar]:hidden">
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
                          <div className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover/empty:text-sky-400 transition-colors">
                            {renderIconoCategoriaVida(cfg.icono, "w-3.5 h-3.5")}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">Sin hábitos en {cfg.nombre.split(' ')[0]}</span>
                          <button
                            type="button"
                            onClick={() => handleCrearActividad(catKey)}
                            className="text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                          >
                            + Crear primer hábito
                          </button>
                        </div>
                      ) : (
                        <AnimatePresence mode="popLayout" initial={false}>
                          {pendientes.map((act) => (
                            <motion.div
                              key={act.id}
                              layout="position"
                              initial={{ opacity: 1, scale: 1 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{
                                opacity: 0,
                                scale: 0.92,
                                height: 0,
                                marginTop: 0,
                                marginBottom: 0,
                                paddingTop: 0,
                                paddingBottom: 0,
                                transition: {
                                  type: 'spring',
                                  stiffness: 500,
                                  damping: 40,
                                  mass: 1
                                }
                              }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <TarjetaHabito
                                actividad={act}
                                subtareas={subtareasPorPadre.get(act.codigo_legado) || subtareasPorPadre.get(act.id) || EMPTY_ARRAY}
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
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>

                    {/* Sección de Completadas */}
                    {completadas.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/60 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1 font-mono tabular-nums">
                          {filtroTemporal === 'HOY' ? 'Completadas Hoy' : 'Completadas'} ({completadas.length})
                        </span>
                        <AnimatePresence mode="popLayout" initial={false}>
                          {completadas.map((act) => (
                            <motion.div
                              key={act.id}
                              layout="position"
                              initial={{ opacity: 1, scale: 1 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{
                                opacity: 0,
                                scale: 0.92,
                                height: 0,
                                marginTop: 0,
                                marginBottom: 0,
                                paddingTop: 0,
                                paddingBottom: 0,
                                transition: {
                                  type: 'spring',
                                  stiffness: 500,
                                  damping: 40,
                                  mass: 1
                                }
                              }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <TarjetaHabito
                                actividad={act}
                                subtareas={subtareasPorPadre.get(act.codigo_legado) || subtareasPorPadre.get(act.id) || EMPTY_ARRAY}
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
                            </motion.div>
                          ))}
                        </AnimatePresence>
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
