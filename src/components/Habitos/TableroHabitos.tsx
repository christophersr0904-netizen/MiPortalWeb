import React, { useState, useMemo } from 'react';
import { useHabitos } from '../../hooks/useHabitos';
import { TarjetaHabito, renderIconoCategoriaVida } from './TarjetaHabito';
import { ModalActividadFlow } from '../Modals/ModalActividadFlow';
import { CATEGORIAS_VIDA_MAP, type CategoriaVida, type ActividadPersonal, type AlcanceRecurrencia } from '../../types';
import { esElementoArchivado, evaluarFiltroTemporal } from '../../utils/entityNormalizer';
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
import Swal from 'sweetalert2';

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
    subtareasPorPadre,
    kpis,
    filtroTexto,
    setFiltroTexto,
    toggleCompletar,
    registrarAvance,
    toggleSubtarea,
    eliminarConAlcance
  } = useHabitos();

  const [filtroCompromiso, setFiltroCompromiso] = useState<FiltroCompromiso>('TODOS');
  const [filtroTemporal, setFiltroTemporal] = useState<FiltroTemporal>('TODOS');
  const [modoOrden, setModoOrden] = useState<ModoOrden>('TIME');
  const [showSortPopover, setShowSortPopover] = useState(false);

  // Estados Modal Canónico ActividadFlow
  const [modalActividadAbierto, setModalActividadAbierto] = useState(false);
  const [actividadEditar, setActividadEditar] = useState<ActividadPersonal | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaVida>('SALUD_DEPORTE');
  const [alcanceEdicion, setAlcanceEdicion] = useState<AlcanceRecurrencia>('ALL');

  const pctCumplimiento = kpis.total > 0 ? Math.round((kpis.completadosHoy / kpis.total) * 100) : 0;
  const pilaresActivos = Object.values(kpis.pilarCounts).filter((c) => c > 0).length;

  const hoyStr = new Date().toISOString().split('T')[0];

  // Filtrado y ordenamiento de actividades con exclusión de archivados (+10 días) y horizonte temporal
  const actividadesProcesadas = useMemo(() => {
    let list = actividades.filter((a) => {
      // 1. Exclusión obligatoria de Bóveda de Archivados (+10 días desde su fecha terminal)
      if (esElementoArchivado(a, 'actividades')) {
        return false;
      }

      // 2. Filtro por tipo de compromiso
      if (filtroCompromiso === 'HABITUAL' && a.tipo_compromiso !== 'HABITUAL') return false;
      if (filtroCompromiso === 'UNICO' && a.tipo_compromiso === 'HABITUAL') return false;
      if (filtroCompromiso === 'RACHA' && (!a.racha_actual || a.racha_actual <= 0)) return false;

      // 3. Filtro Temporal Canónico ('HOY' | 'SEMANA' | 'TODOS')
      if (filtroTemporal !== 'TODOS') {
        const tieneRec = Boolean(
          (a.frecuencia_ciclo && a.frecuencia_ciclo !== 'NINGUNA') ||
          (a.regla_repeticion && a.regla_repeticion.trim() !== '')
        );
        const esRutinaria = a.tipo_compromiso === 'HABITUAL' || tieneRec;

        if (filtroTemporal === 'HOY') {
          const estaEnMora = a.fecha_programada < hoyStr && a.estado !== '04_Completado';
          const completadaHoy = !estaEnMora && (
            a.estado === '04_Completado' || 
            a.ultima_fecha_completado === hoyStr ||
            (Boolean(a.updated_at && a.updated_at.startsWith(hoyStr)) && (a.racha_actual || 0) > 0)
          );
          if (esRutinaria) {
            const agendadaHoy = a.fecha_programada === hoyStr;
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
        return (a.nombre_actividad || '').localeCompare(b.nombre_actividad || '');
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
  }, [actividades, filtroCompromiso, filtroTemporal, modoOrden, hoyStr]);

  const handleCrearActividad = (categoriaPrevia?: CategoriaVida) => {
    setActividadEditar(null);
    setAlcanceEdicion('ALL');
    setCategoriaSeleccionada(categoriaPrevia || 'SALUD_DEPORTE');
    setModalActividadAbierto(true);
  };

  const handleEditarActividad = (act: ActividadPersonal) => {
    setActividadEditar(act);
    setCategoriaSeleccionada(act.categoria_vida);
    setModalActividadAbierto(true);
  };

  const handleEliminarActividad = async (act: ActividadPersonal, alcance?: AlcanceRecurrencia) => {
    const alcanceFinal = alcance || 'ALL';
    const res = await eliminarConAlcance(act.id, alcanceFinal, act.fecha_programada);
    if (res.success) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: alcanceFinal === 'SINGLE'
          ? 'Ocurrencia eliminada'
          : alcanceFinal === 'FUTURE'
          ? 'Serie detenida desde esta fecha'
          : 'Serie eliminada por completo',
        showConfirmButton: false,
        timer: 2000,
        background: '#0D1526',
        color: '#f8fafc'
      });
    }
  };

  const opcionActiva = OPCIONES_FILTRO_TEMPORAL.find((o) => o.key === filtroTemporal) || OPCIONES_FILTRO_TEMPORAL[2];
  const IconoActivo = opcionActiva.Icon;

  return (
    <div
      id="vista-habitos-wrapper"
      className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 lg:p-6 bg-slate-100 dark:bg-slate-950 transition-colors duration-200"
    >
      {/* BARRA DE CONTROL SUPERIOR */}
      {!ocultarHeader && (
        <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-2xl shadow-md shadow-emerald-500/20 ring-1 ring-white/20 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
                  Hábitos & Vida Modular
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                  SaaS Personal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Gestión integral de hábitos, consistencia y desarrollo personal
              </p>
            </div>
          </div>

          {/* ACCIONES RÁPIDAS SUPERIORES */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => handleCrearActividad()}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all duration-200 active:scale-95 cursor-pointer"
              title="Registrar nuevo hábito o compromiso personal"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Hábito / Actividad</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* BARRA DE KPIS RELEVANTES DE IMPACTO PERSONAL (BENTO BAR - 5 CARDS) */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3.5 shrink-0">
        {/* BENTO 1: RACHA ACTIVA & CONSISTENCIA */}
        <div className="portal-surface bg-white dark:bg-[#0D1526] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-amber-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Racha Activa
            </span>
            <span className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-500">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono tabular-nums" id="kpi-mayor-racha">
              {kpis.maxRacha} días
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
            <span id="kpi-racha-subtexto" className="truncate font-medium">
              {kpis.maxRacha >= 7 ? 'Consistencia de alto rendimiento' : 'Construyendo hábito diario'}
            </span>
          </div>
        </div>

        {/* BENTO 2: TASA DE CUMPLIMIENTO DIARIO */}
        <div className="portal-surface bg-white dark:bg-[#0D1526] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Cumplimiento Hoy
            </span>
            <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono tabular-nums" id="kpi-habitos-hoy-ratio">
              {kpis.completadosHoy} / {kpis.total}
            </span>
            <span className="text-xs font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400" id="kpi-habitos-global-cumplimiento">
              {pctCumplimiento}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              id="kpi-habitos-hoy-bar"
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${pctCumplimiento}%` }}
            />
          </div>
        </div>

        {/* BENTO 3: BALANCE DE PILARES DE VIDA */}
        <div className="portal-surface bg-white dark:bg-[#0D1526] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Balance de Vida
            </span>
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <PieChart className="w-4 h-4" />
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono tabular-nums" id="kpi-balance-pilares">
              {pilaresActivos} / 6 pilares
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
            <span id="kpi-balance-subtexto" className="truncate font-medium">Equilibrio activo</span>
          </div>
        </div>

        {/* BENTO 4: RADAR DE HÁBITOS & CONTROL */}
        <div className="portal-surface bg-white dark:bg-[#0D1526] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-teal-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Radar de Control
            </span>
            <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-500">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono tabular-nums" id="kpi-radar-habitos">
              {kpis.total} en foco
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
            <span id="kpi-radar-subtexto" className="truncate font-medium">100% hábitos constructivos</span>
          </div>
        </div>

        {/* BENTO 5: INVERSIÓN FINANCIERA EN BIENESTAR */}
        <div
          onClick={() => Swal.fire({ title: 'Desglose de Bienestar', text: `${kpis.horasInvertidas.toFixed(1)} horas invertidas hoy en desarrollo personal y salud.`, icon: 'info', background: '#0D1526', color: '#f8fafc' })}
          className="col-span-2 sm:col-span-1 portal-surface bg-white dark:bg-[#0D1526] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all"
          title="Clic para ver desglose detallado de inversión por tipo de hábito"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Inversión Bienestar
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-md group-hover:scale-105 transition-all">
                Desglose
              </span>
              <span className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-500">
                <Wallet className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
          <div className="my-1">
            <div className="flex items-baseline justify-between">
              <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums tracking-tight" id="kpi-gasto-vida">
                S/ 0.00
              </span>
            </div>
            <div id="kpi-gasto-vida-microbadges" className="flex items-center gap-1 flex-wrap mt-1">
              <span className="text-[9.5px] text-slate-400 italic">6 dimensiones activas</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 truncate pt-1 border-t border-slate-100 dark:border-slate-800/60">
            <span id="kpi-habitos-global-horas" className="font-mono tabular-nums">
              {kpis.horasInvertidas.toFixed(1)}h invertidas hoy
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PÍLDORAS BENTO DE FILTRO Y BÚSQUEDA RÁPIDA                        */}
      {/* ================================================================= */}
      <div className="portal-surface bg-white dark:bg-[#0D1526] p-2.5 my-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 flex items-center justify-between gap-2 shrink-0 flex-wrap shadow-xs">
        <div className="inline-flex items-center gap-1 text-xs select-none flex-wrap">
          <button
            type="button"
            onClick={() => setFiltroCompromiso('TODOS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs cursor-pointer ${
              filtroCompromiso === 'TODOS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-black font-mono tabular-nums">{kpis.total}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCompromiso('HABITUAL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs cursor-pointer ${
              filtroCompromiso === 'HABITUAL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Hábitos Recurrentes</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold font-mono tabular-nums">{kpis.countHabitual}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCompromiso('UNICO')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs cursor-pointer ${
              filtroCompromiso === 'UNICO'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Metas Puntuales</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold font-mono tabular-nums">{kpis.countUnico}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCompromiso('RACHA')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs cursor-pointer ${
              filtroCompromiso === 'RACHA'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Con Racha Activa</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold font-mono tabular-nums">{kpis.countRacha}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Popover de Ordenamiento */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortPopover(!showSortPopover)}
              className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition cursor-pointer"
              title="Opciones de Ordenamiento"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {modoOrden === 'TIME' && 'Hora'}
                {modoOrden === 'STREAK' && 'Racha'}
                {modoOrden === 'ALPHA' && 'A-Z'}
                {modoOrden === 'PRIORITY' && 'Prioridad'}
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
                        ? 'bg-indigo-600 text-white font-bold'
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
          <div className="relative">
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar hábito o tarea..."
              className="text-xs bg-slate-100/75 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl pl-8 pr-7 py-1.5 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 shadow-2xs w-44 sm:w-52 transition-all"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-3.5 h-3.5 text-slate-400" />
            </span>
            {filtroTexto && (
              <button
                type="button"
                onClick={() => setFiltroTexto('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro Temporal Desplegable Horizontal hacia la Izquierda por Hover */}
          <div className="relative group inline-flex items-center">
            {/* Botón en reposo */}
            <button
              type="button"
              className="h-8 px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0D1526] text-slate-700 dark:text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shadow-xs"
              title="Horizonte Temporal (Posa el cursor para cambiar)"
            >
              <IconoActivo className="w-[15px] h-[15px] text-blue-400 shrink-0" strokeWidth={1.75} />
              <span className="font-semibold text-blue-400">{opcionActiva.label}</span>
            </button>

            {/* Menú Desplegable Horizontal hacia la Izquierda por Hover */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto flex items-center gap-1.5 p-1 bg-[#0D1526]/90 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl transition-all duration-150 whitespace-nowrap origin-right">
              {OPCIONES_FILTRO_TEMPORAL.map(({ key, label, Icon }) => {
                const activo = filtroTemporal === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFiltroTemporal(key)}
                    className={`flex items-center gap-1.5 cursor-pointer transition-all duration-150 whitespace-nowrap ${
                      activo
                        ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30 font-semibold px-2.5 py-1 text-xs rounded-lg'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 px-2.5 py-1 text-xs rounded-lg border border-transparent'
                    }`}
                  >
                    <Icon className="w-[15px] h-[15px]" strokeWidth={1.75} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TABLERO KANBAN HORIZONTAL DE 6 COLUMNAS CANÓNICAS (HÁBITOS & VIDA) */}
      {/* ================================================================= */}
      <div className="w-full flex-1 overflow-x-auto pb-2 flex gap-5 min-h-0 h-full custom-scrollbar items-stretch">
        {CATEGORIAS_CANONICAS.map((catKey) => {
          const cfg = CATEGORIAS_VIDA_MAP[catKey];
          const itemsColumna = actividadesProcesadas.filter((a) => a.categoria_vida === catKey);

          const esCompletadaHoy = (act: ActividadPersonal) => {
            if (act.fecha_programada < hoyStr && act.estado !== '04_Completado') {
              return false;
            }
            return act.estado === '04_Completado' || 
                   act.ultima_fecha_completado === hoyStr ||
                   (Boolean(act.updated_at && act.updated_at.startsWith(hoyStr)) && (act.racha_actual || 0) > 0);
          };

          const completadas = itemsColumna.filter(esCompletadaHoy);
          const pendientes = itemsColumna.filter((a) => !esCompletadaHoy(a));

          const ratioTxt = `${completadas.length}/${itemsColumna.length}`;
          const pctCol = itemsColumna.length > 0 ? Math.round((completadas.length / itemsColumna.length) * 100) : 0;

          return (
            <div
              key={catKey}
              className="w-80 flex-shrink-0 flex flex-col portal-surface bg-white dark:bg-[#0D1526] rounded-2xl border border-slate-200/80 dark:border-slate-800/40 h-full min-h-0 overflow-hidden transition-all duration-150 shadow-xs relative"
              data-categoria={catKey}
            >
              {/* Encabezado Sticky de Categoría */}
              <div className="p-3.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-800/40 shrink-0 sticky top-0 z-10 bg-slate-50/95 dark:bg-[#0D1526]/95 backdrop-blur-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs shadow-2xs font-semibold">
                      {renderIconoCategoriaVida(cfg.icono, "w-3.5 h-3.5")}
                    </span>
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      {cfg.nombre}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
                    {ratioTxt}
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${pctCol}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono tabular-nums">
                  <span>0.0h hoy</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{pctCol}%</span>
                </div>

                {/* Botón Añadir con Estilo Dashed Tailwind */}
                <button
                  type="button"
                  onClick={() => handleCrearActividad(catKey)}
                  className="mt-2.5 w-full py-1.5 px-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-150 shadow-2xs group cursor-pointer"
                >
                  <span className="text-sm font-bold transition-transform group-hover:scale-110 text-emerald-500">+</span>
                  <span>Añadir Hábito / Tarea</span>
                </button>
              </div>

              {/* Cuerpo de Tarjetas con Scroll Vertical Fluido (Pendientes + Completadas Separadas) */}
              <div className="kanban-col-body flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {/* Lista de Pendientes */}
                <div className="space-y-2.5 min-h-[24px]">
                  {pendientes.length === 0 && completadas.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 italic">
                      Sin hábitos en esta categoría
                    </div>
                  ) : (
                    pendientes.map((act) => (
                      <TarjetaHabito
                        key={act.id}
                        actividad={act}
                        subtareas={subtareasPorPadre.get(act.codigo_legado) || []}
                        onToggleCompletar={toggleCompletar}
                        onRegistrarAvance={registrarAvance}
                        onToggleSubtarea={toggleSubtarea}
                        onEditar={handleEditarActividad}
                        onEliminar={handleEliminarActividad}
                      />
                    ))
                  )}
                </div>

                {/* Sección de Completadas del Día */}
                {completadas.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                      Completadas Hoy ({completadas.length})
                    </span>
                    {completadas.map((act) => (
                      <TarjetaHabito
                        key={act.id}
                        actividad={act}
                        subtareas={subtareasPorPadre.get(act.codigo_legado) || []}
                        onToggleCompletar={toggleCompletar}
                        onRegistrarAvance={registrarAvance}
                        onToggleSubtarea={toggleSubtarea}
                        onEditar={handleEditarActividad}
                        onEliminar={handleEliminarActividad}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Canónico ActividadFlow */}
      <ModalActividadFlow
        isOpen={modalActividadAbierto}
        onClose={() => setModalActividadAbierto(false)}
        actividadEditar={actividadEditar}
        categoriaInicial={categoriaSeleccionada}
        alcanceEdicion={alcanceEdicion}
      />
    </div>
  );
};
