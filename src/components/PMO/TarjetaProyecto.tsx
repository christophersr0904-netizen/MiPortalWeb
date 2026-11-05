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
    const varianza = bac > 0 ? bac - ac : 0;

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
        className="portfolio-card portal-surface bg-[#0D1526] rounded-2xl p-4 pl-4.5 border border-slate-800/40 hover:border-slate-700/60 hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5 active:scale-[0.98] active:brightness-105 transform-gpu transition-all duration-200 ease-out flex flex-col justify-between min-h-[320px] relative group overflow-hidden select-none cursor-pointer"
      >
        {/* Barra lateral de salud dinámica */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorBarra} transition-all duration-150 group-hover:w-2`}
        />

        <div>
          {/* Fila superior: ID, Tipo y Badge de Salud */}
          <div className="flex items-center justify-between gap-1.5 mb-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="font-mono font-bold text-[10px] bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                {p.codigo_legado}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-800/80 text-slate-300">
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
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 duration-1000 ${healthBeacon.halo}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${healthBeacon.solid} shadow-[0_0_8px_currentColor]`}
              />
            </div>
          </div>

          {/* Título de Proyecto */}
          <h3
            className="font-bold text-slate-100 text-sm md:text-base leading-snug mb-1 hover:text-sky-300 transition cursor-pointer line-clamp-2"
            title={p.nombre}
          >
            {p.nombre}
          </h3>

          {/* North Star OKR con reserva de altura para prevenir CLS */}
          <div className="min-h-[20px] mb-2.5">
            {p.north_star_okr ? (
              <p className="text-[11px] text-slate-400 italic line-clamp-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{p.north_star_okr}</span>
              </p>
            ) : null}
          </div>

          {/* Doble Barra de Progreso (Meta Proyectada vs Real) */}
          <div className="space-y-1 my-3">
            <div className="flex justify-between items-center text-xs font-mono tabular-nums">
              <span className="text-slate-400 flex items-center gap-2">
                <span>
                  Avance Real:{' '}
                  <b className="text-slate-100 font-bold">{avReal}%</b>
                </span>
              </span>
              <span className="text-[11px] text-slate-400">Proyectado: {avPlan}%</span>
            </div>
            <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden relative shadow-inner">
              <div
                className="bg-sky-950/60 border border-sky-800/40 h-full rounded-full absolute left-0 top-0"
                style={{ width: `${avPlan}%` }}
              />
              <div
                className={`bg-gradient-to-r ${progGradient} h-full rounded-full absolute left-0 top-0 transition-all duration-500 ease-out`}
                style={{ width: `${avReal}%` }}
              />
            </div>
          </div>

          {/* Fila de Metadatos de Tareas y Plazo */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400 font-medium mb-3 pt-2 border-t border-slate-800/80">
            <span
              className="inline-flex items-center gap-1.5 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800/60 text-xs font-mono tabular-nums text-slate-300"
              title="Tareas completadas vs totales"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
              <span>
                <b className="text-slate-100">{tComp}</b>/{tTotal}
              </span>
            </span>

            {p.fecha_fin && (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono tabular-nums bg-slate-900/60 border border-slate-800/60 text-slate-300"
                title="Fecha límite"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
                <span>{p.fecha_fin}</span>
              </span>
            )}

            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold ml-auto bg-slate-900/80 border border-slate-800 text-slate-400">
              {p.estado ? p.estado.replace(/^\d+_/, '').replace(/_/g, ' ') : 'Activo'}
            </span>
          </div>

          {/* Bloque Financiero BAC vs AC y Burn Rate */}
          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 text-xs font-mono tabular-nums mb-4">
            <div className="flex justify-between items-center text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
                <span>
                  BAC:{' '}
                  <b className="text-slate-200">
                    PEN{' '}
                    {bac.toLocaleString('es-PE', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1
                    })}
                  </b>
                </span>
              </span>
              <span
                className={
                  ac > bac
                    ? 'text-rose-400 font-black'
                    : 'text-slate-200 font-bold'
                }
              >
                Real: PEN{' '}
                {ac.toLocaleString('es-PE', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1
                })}
              </span>
            </div>
            <div className="w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden relative">
              <div
                className={`${
                  burn > 100 ? 'bg-rose-500' : burn > 85 ? 'bg-amber-500' : 'bg-emerald-400'
                } h-full rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(burn, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 flex-wrap gap-1">
              <span>
                Consumo:{' '}
                <b
                  className={
                    burn > 100
                      ? 'text-rose-400 font-bold'
                      : burn > 85
                      ? 'text-amber-400 font-bold'
                      : 'text-emerald-400 font-bold'
                  }
                >
                  {burn}%
                </b>
              </span>
              <span>
                Varianza:{' '}
                <b
                  className={
                    varianza >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }
                >
                  {bac > 0
                    ? varianza >= 0
                      ? `+S/ ${varianza.toFixed(1)}`
                      : `-S/ ${Math.abs(varianza).toFixed(1)}`
                    : 'Sin Tope'}
                </b>
              </span>
              <span>
                Saldo: PEN{' '}
                {Math.max(0, bac - ac).toLocaleString('es-PE', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Botonera Inferior Canónica */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSeleccionarProyecto(p.id);
            }}
            className="flex-1 py-1.5 px-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold shadow-xs shadow-sky-950/40 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Ver Detalle 360°</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAñadirTarea(p.codigo_legado || p.id);
            }}
            className="p-2 text-emerald-400 hover:bg-emerald-950/60 rounded-xl border border-emerald-800/60 transition shadow-2xs active:scale-95 shrink-0 cursor-pointer"
            title="Añadir Tarea"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditarProyecto(p.id);
            }}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl border border-slate-800 transition shadow-2xs active:scale-95 shrink-0 cursor-pointer"
            title="Editar Proyecto"
          >
            <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEliminarProyecto(p);
            }}
            className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition shadow-2xs shrink-0 cursor-pointer"
            title="Eliminar Proyecto en Cascada"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    );
  }
);

TarjetaProyecto.displayName = 'TarjetaProyecto';

