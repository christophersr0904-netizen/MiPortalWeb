import React, { useMemo } from 'react';
import type { ActividadPersonal, SubtareaPaso, AlcanceRecurrencia, MetaPlanRecord } from '../../types';
import { CATEGORIAS_VIDA_MAP } from '../../types';
import { ListaSubtareas } from '../Subtareas/ListaSubtareas';
import {
  Check, Flame, Calendar, Clock, DollarSign, PlusCircle, Pencil, Trash2,
  HeartPulse, BookOpen, Briefcase, Wallet, Users, Coffee, AlertTriangle,
  Target, ListTodo, ArrowUpRight
} from 'lucide-react';
import { BadgeNotasVinculadas } from '../Notas/BadgeNotasVinculadas';
import { formatFechaIsoLocal } from '../../utils/timeFormatters';

/** Formatea ISO YYYY-MM-DD a DD/MM compacto para reducir texto en tarjetas móviles. */
const formatearFechaCortaHabito = (fechaIso?: string): string => {
  if (!fechaIso) return 'S/F';
  const clean = fechaIso.split(/[\sT]/)[0];
  const partes = clean.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}`;
  }
  return clean;
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

  const updatedLocalStr = actividad.updated_at
    ? formatFechaIsoLocal(new Date(actividad.updated_at))
    : '';
  const fProgLimpia = (actividad.fecha_programada || '').split(/[\sT]/)[0];

  const esCumplidoHoy = (diasMora === 0 || actividad.estado === '04_Completado') && (
    actividad.estado === '04_Completado' ||
    actividad.ultima_fecha_completado === hoyStr ||
    (updatedLocalStr === hoyStr && (actividad.racha_actual || 0) > 0 && fProgLimpia >= hoyStr) ||
    (esRutinaria && fProgLimpia > hoyStr && (actividad.racha_actual || 0) > 0)
  );

  // UI Optimista de completado (0ms) con fallback a la evaluación calculada
  const esCompletada = optimisticCompletado !== undefined ? optimisticCompletado : esCumplidoHoy;
  const esHabitual = actividad.tipo_compromiso === 'HABITUAL';
  const racha = actividad.racha_actual || 0;

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

  // Toggle de check-in con respuesta reactiva optimista instantánea
  const handleToggleCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nuevoEstadoDeseado = !esCompletada;
    await onToggleCompletar(actividad, nuevoEstadoDeseado);
  };

  const metaAsociada = metaVinculada || actividad.metaVinculada;
  const actividadesAsociadas = actividadesVinculadas || actividad.actividadesVinculadas || [];

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
      className={`group portal-surface p-3 pl-3.5 space-y-2 transition-all duration-150 ease-out border rounded-xl relative overflow-hidden will-change-[transform,opacity] shadow-sm ${
        esCompletada
          ? 'opacity-70 border-slate-800/40 bg-[#070B14]/90'
          : 'bg-[#0D1526]/90 border-slate-800/60 hover:border-sky-500/30 hover:-translate-y-0.5'
      }`}
    >
      {/* Micro-franja lateral de acento semántico por categoría */}
      <div
        className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full ${catConfig.colorBarra} opacity-80`}
        title={`Categoría: ${catConfig.nombre}`}
      />

      {/* FILA 1: Metadatos superiores, Racha y Acciones */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Badge de código canónico */}
          {codigoHabito ? (
            <span
              className="font-mono tabular-nums text-[10px] font-medium text-sky-400 bg-sky-950/60 border border-sky-800/40 px-1.5 py-0.5 rounded select-none shrink-0"
              title={`Código: ${codigoHabito}`}
            >
              {codigoHabito}
            </span>
          ) : null}

          {/* Icono de categoría sutil con tooltip */}
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded border ${catConfig.badgeClase} shrink-0`}
            title={`Categoría: ${catConfig.nombre}`}
          >
            {renderIconoCategoriaVida(catConfig.icono, 'w-3 h-3')}
          </span>

          {/* Cápsula compacta de mora */}
          {diasMora > 0 && !esCompletada && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-mono tabular-nums font-semibold shrink-0"
              title={`Retraso acumulado: ${diasMora} día(s)`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" strokeWidth={1.75} />
              <span>+{diasMora}d</span>
            </span>
          )}

          {esHabitual && actividad.frecuencia_ciclo && actividad.frecuencia_ciclo !== 'DIARIA' && (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60 font-mono shrink-0">
              {actividad.frecuencia_ciclo}
            </span>
          )}
        </div>

        {/* Racha con Icono Flame + Botones de acción rápida */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {racha > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-mono tabular-nums border px-2 py-0.5 rounded-full shrink-0 ${
                racha >= 7
                  ? 'text-amber-300 bg-amber-950/40 border-amber-800/40 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
              }`}
              title={`Racha consecutiva: ${racha} días`}
            >
              <Flame
                className={`w-3.5 h-3.5 ${racha >= 7 ? 'text-amber-400 fill-amber-400' : 'text-amber-400/80'}`}
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

      {/* FILA 2: Botón Check Táctil 44px + Título Táctico */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleToggleCheck}
          aria-label={esCompletada ? 'Marcar como pendiente' : 'Completar avance diario'}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border active:scale-95 transition-all duration-150 shrink-0 cursor-pointer ${
            esCompletada
              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
          }`}
          title={esCompletada ? 'Marcar como pendiente' : 'Marcar como completado'}
        >
          <Check
            className={`w-4 h-4 transition-transform duration-150 ${
              esCompletada ? 'scale-110 opacity-100' : 'scale-95 opacity-55'
            }`}
            strokeWidth={2.25}
          />
        </button>

        <h4
          onClick={handleSolicitarEditar}
          className={`text-xs sm:text-[13px] font-medium leading-snug break-words flex-1 select-none transition-colors line-clamp-2 mb-0 ${
            esCompletada ? 'line-through text-slate-500' : 'text-slate-100'
          } ${onEditar ? 'cursor-pointer hover:text-emerald-300' : ''}`}
          title={onEditar ? `${tituloHabito} (Click para editar)` : tituloHabito}
        >
          {tituloHabito}
        </h4>
      </div>

      {/* Indicador de Meta Vinculada (Icono Target + Título + %) */}
      {(metaAsociada || (actividad.meta_macro_nombre && actividad.meta_macro_nombre.trim() !== '')) && (
        <div
          onClick={(e) => {
            if (metaAsociada && onAbrirMeta360) {
              e.stopPropagation();
              onAbrirMeta360(metaAsociada);
            }
          }}
          className={`flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/25 border border-sky-800/35 text-xs transition-all duration-150 ${
            metaAsociada && onAbrirMeta360 ? 'cursor-pointer hover:bg-sky-950/50 hover:border-sky-700/60' : ''
          }`}
          title={metaAsociada ? `Objetivo: ${metaAsociada.nombre_meta}` : `Objetivo: ${actividad.meta_macro_nombre}`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Target className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
            <span className="font-semibold text-sky-200 truncate text-[11px]">
              {metaAsociada?.nombre_meta || actividad.meta_macro_nombre}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {progresoMetaCalculado !== null ? (
              <span className="font-mono tabular-nums text-xs font-bold text-sky-300 bg-sky-900/50 px-1.5 py-0.5 rounded border border-sky-700/50">
                {progresoMetaCalculado}%
              </span>
            ) : metaAsociada?.estado ? (
              <span className="text-[10px] font-mono text-sky-300/80 uppercase">
                {metaAsociada.estado.replace(/^\d+_/, '')}
              </span>
            ) : null}
            {metaAsociada && onAbrirMeta360 && (
              <ArrowUpRight className="w-3 h-3 text-sky-400 opacity-75 shrink-0" strokeWidth={1.75} />
            )}
          </div>
        </div>
      )}

      {/* Resumen / Conteo Compacto de Subtareas */}
      {actividadesAsociadas.length > 0 && (
        <div className="space-y-1 p-2 rounded-lg bg-sky-950/15 border border-sky-800/30 text-[10px]">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 text-sky-300">
              <ListTodo className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
              <span className="font-semibold hidden sm:inline">Pasos</span>
            </div>
            <span className="font-mono tabular-nums text-xs font-bold px-1.5 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/60">
              {actividadesAsociadas.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 pt-0.5">
            {actividadesAsociadas.slice(0, 3).map((actItem: any, idx: number) => {
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
            {actividadesAsociadas.length > 3 && (
              <span className="text-[10px] text-slate-400 font-mono tabular-nums self-center px-0.5">
                +{actividadesAsociadas.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Subtareas / Checklist Procedural */}
      {subtareas && subtareas.length > 0 && (
        <ListaSubtareas
          idPadre={actividad.codigo_legado}
          pasos={subtareas}
          onTogglePaso={onToggleSubtarea}
        />
      )}

      {/* Barra de Avance Cuantitativo Desaturada */}
      {(metaTotal > 0 || valorAcum > 0 || actividad.meta_macro_nombre || Boolean(metaAsociada)) && (
        <div className="space-y-1.5 p-2 rounded-lg bg-cyan-950/20 border border-cyan-800/30 text-xs">
          <div className="flex items-center justify-between gap-1.5 font-mono tabular-nums">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" strokeWidth={1.75} />
              <span
                onClick={(e) => {
                  if (metaAsociada && onAbrirMeta360) {
                    e.stopPropagation();
                    onAbrirMeta360(metaAsociada);
                  }
                }}
                className={`font-semibold text-cyan-200 truncate text-[11px] font-sans ${
                  metaAsociada && onAbrirMeta360 ? 'cursor-pointer hover:text-sky-300 hover:underline' : ''
                }`}
                title={metaAsociada ? `${metaEfectiva.titulo} (Clic para Vista 360°)` : metaEfectiva.titulo}
              >
                {metaEfectiva.titulo}
              </span>
              {metaAsociada && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAbrirMeta360) onAbrirMeta360(metaAsociada);
                  }}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/30 font-mono font-bold shrink-0 transition cursor-pointer"
                  title="Abrir Vista Detallada 360° de la Meta"
                >
                  360°
                </button>
              )}
            </div>
            <span className="font-bold text-cyan-300 font-mono tabular-nums text-xs shrink-0">
              {valorAcum}{metaTotal > 0 ? `/${metaTotal}` : ''} {uMed}
            </span>
          </div>

          {metaTotal > 0 && (
            <div className="w-full bg-cyan-950/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-teal-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${pctAvance}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            {rescateMin > 0 && (
              <span
                className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 font-semibold font-mono tabular-nums"
                title={`Nivel mínimo de rescate: ${rescateMin} ${uMed}`}
              >
                ≥ {rescateMin} {uMed}
              </span>
            )}

            <button
              type="button"
              onClick={handleAbrirAvanceModal}
              className="ml-auto min-h-[40px] sm:min-h-[30px] px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs font-mono transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              title="Registrar avance cuantitativo"
            >
              <PlusCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Avance</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Compacto de Tarjeta (Iconos + DD/MM) */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1.5 border-t border-slate-800/40 text-xs font-mono tabular-nums text-slate-400">
        <div className="flex items-center gap-2">
          {esCompletada ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono tabular-nums"
              title={`Próxima ejecución: ${actividad.proxima_fecha_programada || 'Mañana'}`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.75} />
              <span>{actividad.proxima_fecha_programada ? formatearFechaCortaHabito(actividad.proxima_fecha_programada) : 'OK'}</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 font-mono tabular-nums text-xs text-slate-400"
              title={`Fecha programada: ${actividad.proxima_fecha_programada || actividad.fecha_programada || 'Sin fecha'}`}
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
        </div>

        {typeof actividad.monto_gasto_asociado === 'number' && actividad.monto_gasto_asociado > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 font-mono tabular-nums font-bold text-xs">
            <DollarSign className="w-3 h-3" strokeWidth={1.75} />
            <span>S/ {actividad.monto_gasto_asociado.toFixed(0)}</span>
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
    prev.actividad.ultima_fecha_completado === next.actividad.ultima_fecha_completado &&
    prev.optimisticCompletado === next.optimisticCompletado &&
    prev.subtareas?.length === next.subtareas?.length &&
    prev.metaVinculada?.id === next.metaVinculada?.id &&
    (prev.metaVinculada?.valor_acumulado_actual ?? (prev.metaVinculada as any)?.valor_acumulado) ===
      (next.metaVinculada?.valor_acumulado_actual ?? (next.metaVinculada as any)?.valor_acumulado)
  );
};

export const TarjetaHabito = React.memo(TarjetaHabitoComponent, areHabitoPropsEqual);
