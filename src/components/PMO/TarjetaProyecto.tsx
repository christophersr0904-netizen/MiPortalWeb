import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Wallet,
  ExternalLink,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import type { CanonicalProyecto } from '../../utils/entityNormalizer';
import { BadgeNotasVinculadas } from '../Notas/BadgeNotasVinculadas';

export interface TarjetaProyectoProps {
  proyecto: CanonicalProyecto;
  resumenTareas: { total: number; completadas: number };
  onSeleccionarProyecto: (id: string) => void;
  onAñadirTarea: (proyectoCodigo: string) => void;
  onEditarProyecto: (id: string) => void;
  onEliminarProyecto: (proyecto: CanonicalProyecto) => void;
}

/** Formatea ISO YYYY-MM-DD a DD/MM compacto para rango de fechas en Bento móvil. */
const formatearFechaDDMM = (fechaIso?: string): string => {
  if (!fechaIso) return '';
  const clean = fechaIso.split('T')[0];
  const partes = clean.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}`;
  }
  return clean;
};

/** Abrevia importes grandes en móvil (< sm) para chips presupuestarios compactos. */
const formatearMontoCompacto = (valor: number): string => {
  if (!Number.isFinite(valor)) return '0';
  if (Math.abs(valor) >= 1000) {
    return `${(valor / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(Math.round(valor));
};

export const TarjetaProyecto: React.FC<TarjetaProyectoProps> = React.memo(
  ({
    proyecto: p,
    resumenTareas,
    onSeleccionarProyecto,
    onAñadirTarea,
    onEditarProyecto,
    onEliminarProyecto
  }) => {
    const tTotal = resumenTareas.total;
    const tComp = resumenTareas.completadas;

    const avReal = p.avance_pct || 0;
    const avPlan = 60; // Proyectado referencial estándar

    const bac = p.presupuesto || 0;
    const ac = p.costo_real || 0;
    const burn = bac > 0 ? Math.round((ac / bac) * 100) : 0;

    const fechaInicioCorta = formatearFechaDDMM(p.fecha_inicio);
    const fechaFinCorta = formatearFechaDDMM(p.fecha_fin);
    const rangoFechasCompacto =
      fechaInicioCorta && fechaFinCorta
        ? `${fechaInicioCorta} - ${fechaFinCorta}`
        : fechaFinCorta || fechaInicioCorta;

    const h = String(p.health_status || '').toLowerCase();
    const isCrit = h.includes('bloqueado') || h.includes('crítico') || h.includes('critico');
    const isRiesgo = h.includes('riesgo') || h.includes('alerta');

    const healthClean = (p.health_status || 'En Rango').replace(/^[^\p{L}\p{N}]+/u, '').trim();

    const colorBarra = isCrit ? 'bg-rose-500' : isRiesgo ? 'bg-amber-500' : 'bg-emerald-400';
    const healthBeacon = isCrit
      ? { halo: 'bg-rose-500', solid: 'bg-rose-500 text-rose-500' }
      : isRiesgo
      ? { halo: 'bg-amber-400', solid: 'bg-amber-400 text-amber-400' }
      : { halo: 'bg-emerald-400', solid: 'bg-emerald-400 text-emerald-400' };

    let progGradient = 'from-sky-500 to-indigo-500';
    if (isCrit) progGradient = 'from-rose-500 to-amber-500';
    else if (isRiesgo) progGradient = 'from-amber-400 to-yellow-500';
    else if (avReal >= 80) progGradient = 'from-teal-400 to-emerald-400';
    else if (avReal >= 50) progGradient = 'from-sky-400 to-teal-400';

    return (
      <div
        onClick={() => onSeleccionarProyecto(p.codigo_legado || p.id)}
        className="portfolio-card portal-surface bg-[#0D1526]/90 border border-slate-800/60 rounded-xl p-3 sm:p-4 pl-3.5 sm:pl-4.5 shadow-sm hover:border-sky-500/30 hover:-translate-y-0.5 active:scale-[0.98] transform-gpu transition-all duration-200 ease-out flex flex-col justify-between relative group overflow-hidden select-none cursor-pointer"
      >
        {/* Barra lateral de salud dinámica */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${colorBarra} transition-[width] duration-150 group-hover:w-1.5`}
        />

        <div>
          {/* Cabecera limpia: Código Violet/Cobalt, Tipo/Notas y Semáforo */}
          <div className="flex items-center justify-between gap-1.5 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[11px] font-mono font-bold bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded border border-violet-500/30">
                {p.codigo_legado}
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-800/80 text-slate-300">
                {p.tipo_iniciativa || 'General'}
              </span>
              <BadgeNotasVinculadas
                codigo={p.codigo_legado}
                tipo="PROYECTO"
                tituloEntidad={p.nombre}
              />
            </div>
            <div
              className="relative flex items-center justify-center w-4 h-4 shrink-0 cursor-help"
              title={healthClean}
              aria-label={`Salud: ${healthClean}`}
            >
              {isCrit && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 duration-1000 ${healthBeacon.halo}`}
                />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${healthBeacon.solid} shadow-[0_0_8px_currentColor]`}
              />
            </div>
          </div>

          {/* Título de Proyecto limitado a 2 líneas */}
          <h3
            className="text-sm sm:text-base font-semibold text-slate-100 leading-snug mb-1.5 hover:text-sky-300 transition-colors cursor-pointer line-clamp-2"
            title={p.nombre}
          >
            {p.nombre}
          </h3>

          {/* North Star OKR compacto en desktop */}
          {p.north_star_okr && (
            <p className="hidden sm:flex text-[11px] text-slate-400 italic line-clamp-1 items-center gap-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{p.north_star_okr}</span>
            </p>
          )}

          {/* Barra de Progreso Delgada + Porcentaje Tabular */}
          <div className="space-y-1.5 my-2.5">
            <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
              <span className="font-semibold text-sky-400">{avReal}%</span>
              <span className="hidden sm:inline text-[11px] text-slate-400">
                Meta {avPlan}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="bg-sky-950/60 h-full rounded-full absolute left-0 top-0"
                style={{ width: `${avPlan}%` }}
              />
              <div
                className={`bg-gradient-to-r ${progGradient} h-full rounded-full absolute left-0 top-0 transition-all duration-500 ease-out`}
                style={{ width: `${avReal}%` }}
              />
            </div>
          </div>

          {/* Fila de Metadatos Compactos: Tareas + Rango DD/MM - DD/MM */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 font-mono tabular-nums mb-2.5 pt-2 border-t border-slate-800/60">
            <span
              className="inline-flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800/60 text-slate-300"
              title="Tareas completadas vs totales"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
              <span>
                <b className="text-slate-100">{tComp}</b>/{tTotal}
              </span>
            </span>

            {rangoFechasCompacto && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/60 border border-slate-800/60 text-slate-400"
                title={`Plazo: ${p.fecha_inicio || 'S/I'} a ${p.fecha_fin || 'S/F'}`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
                <span>{rangoFechasCompacto}</span>
              </span>
            )}

            <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold ml-auto bg-slate-900/80 border border-slate-800 text-slate-400">
              {p.estado ? p.estado.replace(/^\d+_/, '').replace(/_/g, ' ') : 'Activo'}
            </span>
          </div>

          {/* Chip Único Presupuestario Compacto (PEN gasto / presupuesto) */}
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs font-mono tabular-nums mb-3">
            <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
              <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
              <span className={ac > bac ? 'text-rose-400 font-bold truncate' : 'text-slate-200 font-semibold truncate'}>
                PEN{' '}
                <span className="sm:hidden">
                  {formatearMontoCompacto(ac)} / {formatearMontoCompacto(bac)}
                </span>
                <span className="hidden sm:inline">
                  {ac.toLocaleString('es-PE', { maximumFractionDigits: 1 })} /{' '}
                  {bac.toLocaleString('es-PE', { maximumFractionDigits: 1 })}
                </span>
              </span>
            </span>
            <span
              className={`text-[11px] font-bold shrink-0 ${
                burn > 100
                  ? 'text-rose-400'
                  : burn > 85
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {burn}%
            </span>
          </div>
        </div>

        {/* Botonera Táctica Ergonómica (40px-44px targets) */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSeleccionarProyecto(p.id);
            }}
            className="flex-1 h-10 text-xs font-medium px-3 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 hover:border-sky-500/40 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
            <span>Ver Detalle 360°</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAñadirTarea(p.codigo_legado || p.id);
            }}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 active:scale-95 transition shrink-0 cursor-pointer"
            title="Añadir Tarea"
            aria-label="Añadir Tarea"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditarProyecto(p.id);
            }}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 active:scale-95 transition shrink-0 cursor-pointer"
            title="Editar Proyecto"
            aria-label="Editar Proyecto"
          >
            <Edit3 className="w-4 h-4" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEliminarProyecto(p);
            }}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 active:scale-95 transition shrink-0 cursor-pointer"
            title="Eliminar Proyecto en Cascada"
            aria-label="Eliminar Proyecto"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    );
  }
);

TarjetaProyecto.displayName = 'TarjetaProyecto';

