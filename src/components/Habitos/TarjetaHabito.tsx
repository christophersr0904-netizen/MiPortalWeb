import React, { useMemo, useState } from 'react';
import type { ActividadPersonal, SubtareaPaso, AlcanceRecurrencia, MetaPlanRecord } from '../../types';
import { CATEGORIAS_VIDA_MAP } from '../../types';
import { ListaSubtareas } from '../Subtareas/ListaSubtareas';
import {
  Check, Flame, Calendar, Clock, CalendarClock, Pencil, Trash2,
  HeartPulse, BookOpen, Briefcase, Wallet, Users, Coffee, AlertTriangle,
  Target, ListTodo, Repeat, TrendingUp
} from 'lucide-react';
import { BadgeNotasVinculadas } from '../Notas/BadgeNotasVinculadas';
import { formatFechaIsoLocal, formatearFechaDdMmYyyy, formatearFechaDdMm } from '../../utils/timeFormatters';
import { esActividadCompletadaHoy } from '../../services/habitosService';
import { abrirGoogleCalendarActividad } from '../../services/calendarSyncService';

/** Traduce el código técnico de recurrencia a etiqueta humana para tooltips. */
const formatearCicloLegible = (frecuencia?: string, regla?: string): string => {
  const f = String(frecuencia || '').toUpperCase().trim();
  const base =
    f === 'DIARIA' ? 'Diario' :
    f === 'DIARIA_LABORAL' ? 'Lunes a Viernes' :
    f === 'FIN_SEMANA' ? 'Fines de semana' :
    f === 'SEMANAL' ? 'Semanal' :
    f === 'QUINCENAL' ? 'Quincenal' :
    f === 'MENSUAL' ? 'Mensual' :
    f === 'PERSONALIZADA' ? 'Personalizada' :
    f ? f.replace(/_/g, ' ').toLowerCase() : 'Recurrente';
  const r = String(regla || '').trim();
  return r ? `${base} (${r.replace(/^DIAS:/i, '')})` : base;
};

/** Formatea ISO YYYY-MM-DD a DD/MM compacto para reducir texto en tarjetas móviles. */
const formatearFechaCortaHabito = (fechaIso?: string): string => {
  return formatearFechaDdMm(fechaIso, 'S/F');
};

export const renderIconoCategoriaVida = (icono: string, className = "w-3 h-3") => {
  switch (icono) {
    case 'HeartPulse': return <HeartPulse className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Briefcase': return <Briefcase className={className} />;
    case 'Wallet': return <Wallet className={className} />;
    case 'Users': return <Users className={className} />;
    case 'Coffee': return <Coffee className={className} />;
    default: return <HeartPulse className={className} />;
  }
};

export interface TarjetaHabitoProps {
  actividad: ActividadPersonal;
  subtareas: SubtareaPaso[];
  metaVinculada?: MetaPlanRecord;
  actividadesVinculadas?: any[];
  optimisticCompletado?: boolean;
  onToggleCompletar: (actividad: ActividadPersonal, completadoDeseado: boolean) => Promise<{ actividadActualizada: ActividadPersonal; esRepetida: boolean; nuevaRacha: number }>;
  onRegistrarAvance?: (actividad: ActividadPersonal, valor: number) => Promise<{ actividadActualizada: ActividadPersonal; rachaRescatada: boolean; metaCompletada: boolean }>;
  onAbrirAvance?: (actividad: ActividadPersonal) => void;
  onToggleSubtarea: (idSubtarea: string, deseado?: boolean) => Promise<{ success: boolean; error?: string }>;
  onEditar?: (actividad: ActividadPersonal, alcance?: AlcanceRecurrencia) => void;
  onVerDetalle?: (actividad: ActividadPersonal) => void;
  onEliminar?: (actividad: ActividadPersonal, alcance?: AlcanceRecurrencia) => void;
  onAbrirMeta360?: (meta: MetaPlanRecord) => void;
}

const TarjetaHabitoComponent: React.FC<TarjetaHabitoProps> = ({
  actividad,
  subtareas,
  metaVinculada,
  actividadesVinculadas,
  optimisticCompletado,
  onToggleCompletar,
  onAbrirAvance,
  onToggleSubtarea,
  onEditar,
  onVerDetalle,
  onEliminar,
  onAbrirMeta360
}) => {
  // FIX-HABITOS-CARD-TITLE-RENDER-106: Resolución defensiva del título y código del hábito
  const tituloHabito =
    actividad.nombre_actividad ||
    (actividad as any).nombre ||
    (actividad as any).Nombre_Actividad ||
    (actividad as any).Nombre ||
    (actividad as any).titulo ||
    (actividad as any).Titulo ||
    (actividad as any).actividad ||
    (actividad as any).descripcion ||
    (actividad as any).nombre_tarea_actividad ||
    'Hábito sin título';

  const codigoHabito =
    actividad.codigo_legado ||
    (actividad as any).codigo ||
    (actividad as any).Codigo ||
    '';

  const catConfig = CATEGORIAS_VIDA_MAP[actividad.categoria_vida] || CATEGORIAS_VIDA_MAP.SALUD_DEPORTE;
  const hoyStr = formatFechaIsoLocal();
  const tieneRecurrencia = Boolean(
    (actividad.frecuencia_ciclo && actividad.frecuencia_ciclo !== 'NINGUNA') ||
    (actividad.regla_repeticion && actividad.regla_repeticion.trim() !== '')
  );
  const esRutinaria = actividad.tipo_compromiso === 'HABITUAL' || tieneRecurrencia;

  // Cálculo de días de mora
  const diferenciaEnDias = (fHoy: string, fProg?: string): number => {
    if (!fProg || fProg >= fHoy) return 0;
    const pProg = fProg.split(/[\sT]/)[0].split('-');
    const pHoy = fHoy.split('-');
    if (pProg.length !== 3 || pHoy.length !== 3) return 0;
    const dProg = new Date(parseInt(pProg[0], 10), parseInt(pProg[1], 10) - 1, parseInt(pProg[2], 10), 12, 0, 0);
    const dHoy = new Date(parseInt(pHoy[0], 10), parseInt(pHoy[1], 10) - 1, parseInt(pHoy[2], 10), 12, 0, 0);
    return Math.max(0, Math.floor((dHoy.getTime() - dProg.getTime()) / 86400000));
  };
  const diasMora = diferenciaEnDias(hoyStr, actividad.fecha_programada);

  const esCumplidoHoy = esActividadCompletadaHoy(actividad, hoyStr);

  // UI Optimista de completado (0ms) con fallback a la evaluación calculada
  const esCompletada = optimisticCompletado !== undefined ? optimisticCompletado : esCumplidoHoy;
  const esHabitual = actividad.tipo_compromiso === 'HABITUAL';
  const racha = actividad.racha_actual || 0;
  const [toggleInFlight, setToggleInFlight] = useState(false);

  // Handlers de acción
  const handleSolicitarEditar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const actConTitulo: ActividadPersonal = {
      ...actividad,
      nombre_actividad: tituloHabito
    };
    if (onEditar) {
      onEditar(actConTitulo);
    } else if (onVerDetalle) {
      onVerDetalle(actConTitulo);
    }
  };

  const handleSolicitarEliminar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onEliminar) return;
    const actConTitulo = { ...actividad, nombre_actividad: tituloHabito };
    onEliminar(actConTitulo);
  };

  // Toggle de check-in con guard anti doble clic rápido
  const handleToggleCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggleInFlight) return;
    setToggleInFlight(true);
    try {
      const nuevoEstadoDeseado = !esCompletada;
      await onToggleCompletar(actividad, nuevoEstadoDeseado);
    } finally {
      setToggleInFlight(false);
    }
  };

  const metaAsociada = metaVinculada || actividad.metaVinculada;
  const actividadesAsociadas = actividadesVinculadas || actividad.actividadesVinculadas || [];

  // Evitar duplicar pasos ya gestionados en ListaSubtareas (db.subtareas_pasos)
  const pasosChecklistExclusivos = useMemo(() => {
    if (!actividadesAsociadas.length) return [];
    const llavesReales = new Set<string>();
    for (const s of subtareas || []) {
      if (s.id) llavesReales.add(String(s.id));
      if (s.codigo_legado) llavesReales.add(String(s.codigo_legado));
      if (s.descripcion_paso) llavesReales.add(s.descripcion_paso.trim().toLowerCase());
    }
    return actividadesAsociadas.filter((actItem: any) => {
      const idIt = String(actItem.id || '');
      const codIt = String(actItem.codigo_legado || '');
      const nomIt = String(actItem.nombre_actividad || actItem.descripcion_paso || actItem.nombre || '').trim().toLowerCase();
      return !llavesReales.has(idIt) && !llavesReales.has(codIt) && !llavesReales.has(nomIt);
    });
  }, [actividadesAsociadas, subtareas]);

  // Normalización unificada de meta
  const metaEfectiva = {
    titulo: metaAsociada?.nombre_meta || actividad.meta_macro_nombre || 'Meta Cuantificable',
    total: metaAsociada?.meta_objetivo_total || actividad.meta_objetivo_total || 0,
    actual: actividad.valor_acumulado_actual || 0,
    unidad: metaAsociada?.unidad_medida || actividad.unidad_medida || 'unidades',
    rescateMin: metaAsociada?.nivel_rescate_minimo || actividad.nivel_rescate_minimo || 0
  };

  const progresoMetaCalculado = useMemo(() => {
    if (!metaAsociada) return null;
    const pct = (metaAsociada as any).porcentaje_completado;
    if (typeof pct === 'number') {
      return pct;
    }
    if (metaAsociada.meta_objetivo_total && metaAsociada.meta_objetivo_total > 0) {
      const act = metaAsociada.valor_acumulado_actual || (metaAsociada as any).valor_acumulado || 0;
      return Math.min(100, Math.round((act / metaAsociada.meta_objetivo_total) * 100));
    }
    if (metaAsociada.estado === '03_Logrado') {
      return 100;
    }
    return null;
  }, [metaAsociada]);

  const metaTotal = metaEfectiva.total;
  const valorAcum = metaEfectiva.actual;
  const pctAvance = metaTotal > 0 ? Math.min(100, Math.round((valorAcum / metaTotal) * 100)) : 0;
  const rescateMin = metaEfectiva.rescateMin;
  const uMed = metaEfectiva.unidad;

  const handleAbrirAvanceModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAbrirAvance) {
      onAbrirAvance(actividad);
    }
  };

  return (
    <div
      style={{ contain: 'layout paint' }}
      className={`group shrink-0 h-auto portal-surface p-3 pl-3.5 space-y-2 transition-all duration-200 ease-out border rounded-2xl relative will-change-[transform,opacity] ${
        esCompletada
          ? 'opacity-70 border-slate-800/40 bg-[#070B14]/90'
          : 'bg-[#0D1526]/90 border-slate-800/70 hover:border-sky-500/40 hover:-translate-y-1 hover:shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(30,58,138,0.18)] shadow-sm'
      }`}
    >
      {/* Micro-franja lateral de acento semántico por categoría con halo sutil */}
      <div
        className={`!mt-0 absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${catConfig.colorBarra} opacity-85 pointer-events-none`}
        title={`Categoría: ${catConfig.nombre}`}
      />

      {/* FILA 1: Metadatos superiores, Racha y Acciones */}
      <div className="!mt-0 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Badge de código canónico */}
          {codigoHabito ? (
            <span
              className="font-mono tabular-nums text-[10px] font-bold text-sky-300 bg-sky-950/60 border border-sky-800/50 px-1.5 py-0.5 rounded-md select-none shrink-0"
              title={`Código: ${codigoHabito}`}
            >
              {codigoHabito}
            </span>
          ) : null}

          {/* Icono de categoría sutil con tooltip */}
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-md border ${catConfig.badgeClase} shrink-0`}
            title={`Categoría: ${catConfig.nombre}`}
          >
            {renderIconoCategoriaVida(catConfig.icono, 'w-3 h-3')}
          </span>

          {/* Cápsula compacta de mora */}
          {diasMora > 0 && !esCompletada && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-mono tabular-nums font-bold shrink-0"
              title={`Retraso acumulado: ${diasMora} día(s)`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" strokeWidth={1.75} />
              <span>+{diasMora}d</span>
            </span>
          )}

          {(esHabitual || tieneRecurrencia) && ((actividad.frecuencia_ciclo && actividad.frecuencia_ciclo !== 'DIARIA' && actividad.frecuencia_ciclo !== 'NINGUNA') || Boolean(actividad.regla_repeticion && actividad.regla_repeticion.trim())) && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-800/70 text-slate-400 border border-slate-700/50 shrink-0"
              title={`Ciclo: ${formatearCicloLegible(actividad.frecuencia_ciclo, actividad.regla_repeticion)}`}
            >
              <Repeat className="w-3 h-3" strokeWidth={1.75} />
            </span>
          )}
        </div>

        {/* Píldora Neón Fuego Viva para Rachas */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {racha > 0 && (
            <span
              className="inline-flex items-center gap-1 text-xs font-mono tabular-nums font-bold px-2 py-0.5 rounded-full shrink-0 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              title={`Racha consecutiva: ${racha} días`}
            >
              <Flame
                className={`w-3.5 h-3.5 text-amber-400 fill-amber-400 ${racha >= 7 ? 'animate-pulse' : ''}`}
                strokeWidth={1.75}
              />
              <span>{racha}d</span>
            </span>
          )}

          <BadgeNotasVinculadas
            codigo={actividad.codigo_legado}
            tipo="HABITO"
            tituloEntidad={tituloHabito}
          />

          {/* Acciones Secundarias ergonómicas (Visibles en móvil, hover suave desktop) */}
          <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 shrink-0">
            {onEditar && (
              <button
                type="button"
                onClick={handleSolicitarEditar}
                aria-label="Editar hábito"
                className="min-w-[40px] min-h-[40px] sm:min-w-[28px] sm:min-h-[28px] flex items-center justify-center text-slate-400 hover:text-sky-300 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Editar hábito"
              >
                <Pencil className="w-3.5 h-3.5 sm:w-3 sm:h-3" strokeWidth={1.75} />
              </button>
            )}

            {onEliminar && (
              <button
                type="button"
                onClick={handleSolicitarEliminar}
                aria-label="Eliminar hábito"
                className="min-w-[40px] min-h-[40px] sm:min-w-[28px] sm:min-h-[28px] flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Eliminar hábito"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NIVEL 2: Checkbox Ergonómico Gema Esmeralda 24x24px + Título */}
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={handleToggleCheck}
          disabled={toggleInFlight}
          aria-busy={toggleInFlight}
          aria-label={esCompletada ? 'Marcar como pendiente' : 'Completar avance diario'}
          className={`group/chk w-6 h-6 min-w-0 min-h-0 shrink-0 rounded-lg flex items-center justify-center mt-0.5 border transition-all duration-200 active:scale-90 ${
            toggleInFlight ? 'opacity-60 cursor-wait' : 'cursor-pointer'
          } ${
            esCompletada
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-300 text-slate-950 shadow-[0_0_14px_rgba(16,185,129,0.55)]'
              : 'border-slate-700/80 bg-slate-900/60 text-transparent hover:border-sky-400/80 hover:bg-sky-500/10 hover:shadow-[0_0_12px_rgba(56,189,248,0.25)]'
          }`}
          title={esCompletada ? 'Completado hoy (clic para desmarcar)' : 'Marcar como completado hoy'}
        >
          <Check
            className={`w-4 h-4 transition-all duration-150 ${
              esCompletada
                ? 'scale-100 opacity-100 text-slate-950'
                : 'scale-90 opacity-0 group-hover/chk:opacity-50 text-slate-400'
            }`}
            strokeWidth={2.75}
          />
        </button>

        <h4
          onClick={handleSolicitarEditar}
          className={`text-xs sm:text-[13px] font-semibold leading-snug break-words flex-1 select-none transition-colors mb-0 ${
            esCompletada ? 'line-through text-slate-500' : 'text-slate-100'
          } ${onEditar ? 'cursor-pointer hover:text-sky-300' : ''}`}
          title={onEditar ? `${tituloHabito} (Click para editar)` : tituloHabito}
        >
          {tituloHabito}
        </h4>
      </div>

      {/* NIVEL 3A: Bloque Unificado de Meta Estratégica & Progreso Cuantitativo 360° */}
      {(metaAsociada || (actividad.meta_macro_nombre && actividad.meta_macro_nombre.trim() !== '') || metaTotal > 0 || valorAcum > 0 || rescateMin > 0) && (
        <div className="bg-[#070C18] border border-slate-800/70 rounded-lg p-2 space-y-1.5 text-xs">
          {/* Fila superior: Icono Target + Nombre único de Meta + % global + Botón 360° */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div
              onClick={(e) => {
                if (metaAsociada && onAbrirMeta360) {
                  e.stopPropagation();
                  onAbrirMeta360(metaAsociada);
                }
              }}
              className={`flex items-center gap-1.5 min-w-0 flex-1 ${
                metaAsociada && onAbrirMeta360 ? 'cursor-pointer group/meta' : ''
              }`}
              title={metaAsociada ? `${metaAsociada.nombre_meta} (Clic para Vista 360°)` : metaEfectiva.titulo}
            >
              <Target className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
              <span className={`font-semibold text-slate-200 truncate text-[11px] ${
                metaAsociada && onAbrirMeta360 ? 'group-hover/meta:text-sky-300 transition-colors' : ''
              }`}>
                {metaAsociada?.nombre_meta || actividad.meta_macro_nombre || metaEfectiva.titulo}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {progresoMetaCalculado !== null ? (
                <span className="font-mono tabular-nums text-[10px] font-semibold text-sky-300 bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-800/50">
                  {progresoMetaCalculado}%
                </span>
              ) : metaAsociada?.estado ? (
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  {metaAsociada.estado.replace(/^\d+_/, '')}
                </span>
              ) : null}

              {metaAsociada && onAbrirMeta360 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAbrirMeta360(metaAsociada);
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500 text-sky-300 hover:text-slate-950 border border-sky-500/30 font-mono font-bold shrink-0 transition cursor-pointer"
                  title="Abrir Vista Detallada 360° de la Meta"
                >
                  360°
                </button>
              )}
            </div>
          </div>

          {/* Fila cuantitativa: Ratio tabular + Barra sólida + Rescate mínimo + Botón + Avance */}
          {(metaTotal > 0 || valorAcum > 0 || rescateMin > 0 || Boolean(onAbrirAvance)) && (
            <div className="space-y-1.5 pt-0.5 border-t border-slate-800/50">
              {metaTotal > 0 && (
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      pctAvance >= 100
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                        : 'bg-gradient-to-r from-sky-500 to-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                    }`}
                    style={{ width: `${pctAvance}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0 font-mono tabular-nums">
                  <span className="font-semibold text-slate-200 text-[11px]">
                    {valorAcum}{metaTotal > 0 ? `/${metaTotal}` : ''} {uMed}
                  </span>
                  {rescateMin > 0 && (
                    <span
                      className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-sky-300 border border-slate-700/60 font-semibold"
                      title={`Nivel mínimo de rescate: ${rescateMin} ${uMed}`}
                    >
                      ≥ {rescateMin} {uMed}
                    </span>
                  )}
                </div>

                {onAbrirAvance && (
                  <button
                    type="button"
                    onClick={handleAbrirAvanceModal}
                    aria-label="Registrar avance"
                    className="ml-auto w-7 h-7 rounded-lg border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500 hover:text-slate-950 text-sky-300 inline-flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
                    title="Registrar avance"
                  >
                    <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NIVEL 3B: Subtareas / Checklist Procedural Unificado (Sin Duplicación) */}
      {subtareas && subtareas.length > 0 && (
        <ListaSubtareas
          idPadre={actividad.codigo_legado}
          pasos={subtareas}
          onTogglePaso={onToggleSubtarea}
        />
      )}

      {pasosChecklistExclusivos.length > 0 && (
        <div className="space-y-1 p-2 rounded-lg bg-[#070C18] border border-slate-800/70 text-[10px]">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 text-sky-300">
              <ListTodo className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
              <span className="font-semibold hidden sm:inline">Checklist</span>
            </div>
            <span className="font-mono tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800/80 text-sky-300 border border-slate-700/60">
              {pasosChecklistExclusivos.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 pt-0.5">
            {pasosChecklistExclusivos.slice(0, 3).map((actItem: any, idx: number) => {
              const nombre = actItem.nombre_actividad || actItem.descripcion_paso || actItem.nombre || `Paso ${idx + 1}`;
              const completado = actItem.estado === '04_Completado' || actItem.completado === true;
              return (
                <span
                  key={actItem.id || idx}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                    completado
                      ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40 line-through opacity-75'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800/80'
                  }`}
                  title={nombre}
                >
                  <span className="truncate max-w-[120px]">{nombre}</span>
                </span>
              );
            })}
            {pasosChecklistExclusivos.length > 3 && (
              <span className="text-[10px] text-slate-400 font-mono tabular-nums self-center px-0.5">
                +{pasosChecklistExclusivos.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* NIVEL 4: Footer Tabular Compacto */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1.5 border-t border-slate-800/40 text-xs font-mono tabular-nums text-slate-400">
        <div className="flex items-center gap-2">
          {esCompletada ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono tabular-nums"
              title={`Próxima ejecución: ${actividad.proxima_fecha_programada ? formatearFechaDdMmYyyy(actividad.proxima_fecha_programada) : 'Mañana'}`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.75} />
              <span>{actividad.proxima_fecha_programada ? formatearFechaCortaHabito(actividad.proxima_fecha_programada) : 'OK'}</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 font-mono tabular-nums text-xs text-slate-400"
              title={`Fecha programada: ${actividad.proxima_fecha_programada ? formatearFechaDdMmYyyy(actividad.proxima_fecha_programada) : (actividad.fecha_programada ? formatearFechaDdMmYyyy(actividad.fecha_programada) : 'Sin fecha')}`}
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
              <span>
                {formatearFechaCortaHabito(
                  esRutinaria && (actividad.proxima_fecha_programada || actividad.fecha_programada > hoyStr)
                    ? actividad.proxima_fecha_programada || actividad.fecha_programada
                    : actividad.fecha_programada
                )}
              </span>
            </span>
          )}

          {actividad.hora_inicio && (
            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
              <span>{actividad.hora_inicio}</span>
            </span>
          )}

          {(actividad.agendado_calendar === 'Sí' || (actividad as any).id_evento_calendar) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                abrirGoogleCalendarActividad(actividad);
              }}
              className="inline-flex items-center justify-center p-0.5 rounded text-sky-400 hover:text-sky-300 hover:bg-sky-500/15 transition cursor-pointer"
              title="Agendado en Google Calendar (clic para abrir)"
              aria-label="Abrir en Google Calendar"
            >
              <CalendarClock className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>

        {typeof actividad.monto_gasto_asociado === 'number' && actividad.monto_gasto_asociado > 0 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 font-mono tabular-nums font-semibold text-xs">
            S/ {actividad.monto_gasto_asociado.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};

// Comparador atómico de props primitivos (60-120 FPS sin regresiones de reconciliación)
export const areHabitoPropsEqual = (prev: TarjetaHabitoProps, next: TarjetaHabitoProps): boolean => {
  return (
    prev.actividad.id === next.actividad.id &&
    prev.actividad.updated_at === next.actividad.updated_at &&
    prev.actividad.estado === next.actividad.estado &&
    prev.actividad.racha_actual === next.actividad.racha_actual &&
    prev.actividad.valor_acumulado_actual === next.actividad.valor_acumulado_actual &&
    prev.actividad.fecha_programada === next.actividad.fecha_programada &&
    prev.actividad.agendado_calendar === next.actividad.agendado_calendar &&
    (prev.actividad as any).id_evento_calendar === (next.actividad as any).id_evento_calendar &&
    prev.actividad.ultima_fecha_completado === next.actividad.ultima_fecha_completado &&
    prev.optimisticCompletado === next.optimisticCompletado &&
    prev.subtareas?.length === next.subtareas?.length &&
    prev.metaVinculada?.id === next.metaVinculada?.id &&
    (prev.metaVinculada?.valor_acumulado_actual ?? (prev.metaVinculada as any)?.valor_acumulado) ===
      (next.metaVinculada?.valor_acumulado_actual ?? (next.metaVinculada as any)?.valor_acumulado)
  );
};

export const TarjetaHabito = React.memo(TarjetaHabitoComponent, areHabitoPropsEqual);
