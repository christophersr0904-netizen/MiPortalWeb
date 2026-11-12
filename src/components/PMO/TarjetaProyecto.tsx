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
import { IconoCategoriaIniciativa } from './IconoCategoriaIniciativa';

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
    const healthBeaconSolid = isCrit
      ? 'bg-rose-500'
      : isRiesgo
        ? 'bg-amber-400'
        : 'bg-emerald-400';

    let progFill = 'bg-sky-500';
    if (isCrit) progFill = 'bg-rose-500';
    else if (isRiesgo) progFill = 'bg-amber-400';
    else if (avReal >= 80) progFill = 'bg-emerald-400';

    return (
      <div
        onClick={() => onSeleccionarProyecto(p.codigo_legado || p.id)}
        className="portfolio-card shrink-0 h-auto portal-surface bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 rounded-xl p-3.5 sm:p-4 pl-4 sm:pl-4.5 transition-colors duration-200 flex flex-col justify-between relative group select-none cursor-pointer"
      >
        {/* Barra lateral de salud dinámica */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${colorBarra} pointer-events-none`}
        />

        <div>
          {/* 1. Cabecera: código PRO-XXX, icono de categoría, badge de notas y punto de salud */}
          <div className="flex items-center justify-between gap-1.5 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[11px] font-mono tabular-nums font-bold bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded border border-violet-500/30">
                {p.codigo_legado}
              </span>
              <IconoCategoriaIniciativa categoria={p.tipo_iniciativa} />
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
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${healthBeaconSolid}`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${healthBeaconSolid}`}
                />
              </span>
            </div>
          </div>

          {/* 2. Título completo del proyecto */}
          <h3
            className="text-sm sm:text-base font-bold text-slate-100 leading-snug mb-1.5 hover:text-sky-300 transition-colors cursor-pointer break-words"
            title={p.nombre}
          >
            {p.nombre}
          </h3>

          {/* 3. Objetivo estratégico / North Star OKR completo */}
          {p.north_star_okr && (
            <div className="flex items-start gap-1.5 text-[11px] text-slate-400 italic leading-relaxed mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="break-words whitespace-normal">{p.north_star_okr}</p>
            </div>
          )}

          {/* 4a. Doble Barra de Progreso (Proyectado vs Avance Real) */}
          <div className="space-y-1.5 my-2.5">
            <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
              <span className="text-slate-400">
                Avance Real: <b className="text-sky-400 font-bold">{avReal}%</b>
              </span>
              <span className="text-[11px] text-slate-400">
                Meta: {avPlan}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800/70 rounded-full overflow-hidden relative">
              <div
                className="bg-sky-950/60 border border-sky-800/40 h-full rounded-full absolute left-0 top-0"
                style={{ width: `${avPlan}%` }}
              />
              <div
                className={`${progFill} h-full rounded-full absolute left-0 top-0 transition-all duration-500 ease-out`}
                style={{ width: `${avReal}%` }}
              />
            </div>
          </div>

          {/* 4b. Fila de Metadatos: Conteo de tareas, Fecha límite y Estado */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400 font-mono tabular-nums mb-3 pt-2 border-t border-slate-800/80">
            <span
              className="inline-flex items-center gap-1.5 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800/60 text-slate-300"
              title="Tareas completadas vs totales"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
              <span>
                <b className="text-slate-100">{tComp}</b>/{tTotal}
              </span>
            </span>

            {(p.fecha_fin || p.fecha_inicio) && (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/60 border border-slate-800/60 text-slate-300"
                title={`Plazo: ${p.fecha_inicio || 'S/I'} a ${p.fecha_fin || 'S/F'}`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
                <span>{p.fecha_fin || p.fecha_inicio}</span>
              </span>
            )}

            <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold ml-auto bg-slate-900/80 border border-slate-800 text-slate-400">
              {p.estado ? p.estado.replace(/^\d+_/, '').replace(/_/g, ' ') : 'Activo'}
            </span>
          </div>

          {/* 4c. Bloque Financiero Completo (BAC vs AC, Barra Burn Rate, Consumo, Varianza y Saldo) */}
          <div className="bg-[#040711]/60 p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono tabular-nums mb-3.5">
            <div className="flex justify-between items-center gap-2 flex-wrap text-slate-400 mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
                <span>
                  BAC:{' '}
                  <b className="text-slate-200">
                    S/ {bac.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </b>
                </span>
              </span>
              <span className={ac > bac ? 'text-rose-400 font-bold' : 'text-slate-200 font-semibold'}>
                Real: S/ {ac.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
            </div>

            <div className="w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden relative">
              <div
                className={`${burn > 100 ? 'bg-rose-500' : burn > 85 ? 'bg-amber-500' : 'bg-emerald-400'
                  } h-full rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(burn, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 flex-wrap gap-1.5">
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
                <b className={varianza >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {bac > 0
                    ? varianza >= 0
                      ? `+S/ ${varianza.toFixed(1)}`
                      : `-S/ ${Math.abs(varianza).toFixed(1)}`
                    : 'Sin Tope'}
                </b>
              </span>
              <span>
                Saldo: S/ {Math.max(0, bac - ac).toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Pie de tarjeta con acciones y acceso a Vista 360° */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSeleccionarProyecto(p.id);
            }}
            className="flex-1 h-10 text-xs font-semibold px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-slate-800/80 bg-[#040711]/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors shrink-0 cursor-pointer"
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
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-slate-800/80 bg-[#040711]/50 text-slate-400 hover:text-slate-200 hover:border-sky-500/40 transition-colors shrink-0 cursor-pointer"
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
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-slate-800/80 bg-[#040711]/50 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
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

