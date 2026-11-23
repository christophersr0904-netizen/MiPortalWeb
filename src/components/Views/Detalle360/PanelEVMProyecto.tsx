/**
 * ============================================================================
 * ARCHIVO: src/components/Views/Detalle360/PanelEVMProyecto.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-REFACTOR-P1-01 (Desacoplamiento Modular de Pestaña EVM)
 * DESCRIPCIÓN: Panel de Valor Ganado (EVM), Curva S vectorial SVG y Varianzas
 *              físicas y temporales bajo estándar visual Cobalt Aerodynamic (A.2.2).
 * ============================================================================
 */

import React from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';

export interface EsfuerzoDesviacionProyecto {
  real: number;
  estimado: number;
  deltaHoras: number;
}

export interface PanelEVMProyectoProps {
  bac: number;
  pv: number;
  pctTiempo: number;
  ev: number;
  ac: number;
  cc: number;
  eac: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  desfasePromedioTareas: number | null;
  conteoTareasConDesfase: number;
  esfuerzoDesviacionProyecto: EsfuerzoDesviacionProyecto;
  dictamenPmo: string;
  vac: number;
}

export const PanelEVMProyecto: React.FC<PanelEVMProyectoProps> = ({
  bac,
  pv,
  pctTiempo,
  ev,
  ac,
  cc,
  eac,
  cv,
  sv,
  cpi,
  spi,
  desfasePromedioTareas,
  conteoTareasConDesfase,
  esfuerzoDesviacionProyecto,
  dictamenPmo,
  vac
}) => {
  return (
    <div className="space-y-6">
      <div className="portal-surface bg-[#0D1526] p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <h2 className="text-base font-black text-slate-100">
              Gestión de Valor Ganado (EVM) en Tiempo Real
            </h2>
            <span className="text-[10px] bg-emerald-950/60 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
              PMBOK 7th Ed.
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Evaluación continua de costo, cronograma, índice de desempeño y proyecciones a la conclusión.
          </p>
        </div>
      </div>

      {/* Bento Grid de Métricas Principales EVM (6 Tarjetas) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">BAC (Presupuesto)</span>
          <div className="text-sm font-black font-mono tabular-nums text-slate-100">
            PEN {bac.toLocaleString('es-PE')}
          </div>
          <span className="text-[9.5px] text-slate-400 block">Línea base total</span>
        </div>

        <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PV (Planificado)</span>
          <div className="text-sm font-black font-mono tabular-nums text-sky-400">
            PEN {pv.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[9.5px] text-slate-400 block">{pctTiempo}% de cronograma</span>
        </div>

        <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">EV (Valor Ganado)</span>
          <div className="text-sm font-black font-mono tabular-nums text-emerald-400">
            PEN {ev.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[9.5px] text-slate-400 block">% Físico × BAC</span>
        </div>

        <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AC (Costo Real)</span>
          <div className="text-sm font-black font-mono tabular-nums text-rose-400">
            PEN {ac.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[9.5px] text-slate-400 block">Egresos pagados</span>
        </div>

        <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CC (Comprometido)</span>
          <div className="text-sm font-black font-mono tabular-nums text-amber-400">
            PEN {cc.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[9.5px] text-slate-400 block">Pendiente de pago</span>
        </div>

        <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">EAC (Proyección)</span>
          <div className="text-sm font-black font-mono tabular-nums text-purple-400">
            PEN {eac.toLocaleString('es-PE')}
          </div>
          <span className="text-[9.5px] text-slate-400 block">BAC / CPI</span>
        </div>
      </div>

      {/* Varianzas e Índices & Desfase Físico (REQ-METRICS-EXECUTION-03) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Variación Costo (CV)</span>
            <span className="font-mono text-slate-400">EV - AC</span>
          </div>
          <div className={`text-lg font-black font-mono tabular-nums ${cv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            PEN {cv.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-400">
            {cv >= 0 ? 'En presupuesto favorable.' : 'Sobrecosto detectado.'}
          </p>
        </div>

        <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Variación Plazo (SV)</span>
            <span className="font-mono text-slate-400">EV - PV</span>
          </div>
          <div className={`text-lg font-black font-mono tabular-nums ${sv >= 0 ? 'text-sky-400' : 'text-amber-400'}`}>
            PEN {sv.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-400">
            {sv >= 0 ? 'Alineado al cronograma.' : 'Desfase de plazos.'}
          </p>
        </div>

        <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Índice Costo (CPI)</span>
            <span className="font-mono text-slate-400">EV / AC</span>
          </div>
          <div className={`text-lg font-black font-mono tabular-nums ${cpi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {cpi.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400">{cpi >= 1 ? 'Eficiencia en costos.' : 'Baja eficiencia.'}</p>
        </div>

        <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Índice Plazo (SPI)</span>
            <span className="font-mono text-slate-400">EV / PV</span>
          </div>
          <div className={`text-lg font-black font-mono tabular-nums ${spi >= 1 ? 'text-sky-400' : 'text-amber-400'}`}>
            {spi.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400">{spi >= 1 ? 'Ritmo acelerado.' : 'Retraso de ejecución.'}</p>
        </div>

        {/* Tarjeta 5: Desfase Físico (Lead/Lag) */}
        <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Desfase Físico</span>
            <span className="font-mono text-slate-400">Lead/Lag</span>
          </div>
          <div
            className={`text-lg font-black font-mono tabular-nums ${
              desfasePromedioTareas === null
                ? 'text-slate-500'
                : desfasePromedioTareas > 0
                ? 'text-rose-400'
                : desfasePromedioTareas < 0
                ? 'text-emerald-400'
                : 'text-sky-400'
            }`}
          >
            {desfasePromedioTareas === null
              ? '—'
              : desfasePromedioTareas > 0
              ? `+${desfasePromedioTareas}d mora`
              : desfasePromedioTareas < 0
              ? `${desfasePromedioTareas}d adelanto`
              : '0d a tiempo'}
          </div>
          <p className="text-[11px] text-slate-400">
            {conteoTareasConDesfase > 0
              ? `${conteoTareasConDesfase} tareas auditadas.`
              : 'Sin tareas completadas.'}
          </p>
        </div>

        {/* Tarjeta 6: Esfuerzo Real / Plan */}
        <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Esfuerzo Real</span>
            <span className="font-mono text-slate-400">Real / Plan</span>
          </div>
          <div className="text-lg font-black font-mono tabular-nums text-slate-100">
            {esfuerzoDesviacionProyecto.real.toFixed(1)}h{' '}
            <span className="text-xs text-slate-400 font-normal">
              / {esfuerzoDesviacionProyecto.estimado.toFixed(1)}h
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono tabular-nums">
            {esfuerzoDesviacionProyecto.deltaHoras !== 0 ? (
              <span className={esfuerzoDesviacionProyecto.deltaHoras > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {esfuerzoDesviacionProyecto.deltaHoras > 0 ? '+' : ''}
                {esfuerzoDesviacionProyecto.deltaHoras.toFixed(1)}h{' '}
                {esfuerzoDesviacionProyecto.deltaHoras > 0 ? 'sobrecosto' : 'ahorro'}
              </span>
            ) : (
              'Alineado al plan.'
            )}
          </p>
        </div>
      </div>

      {/* Curva S Vectorial y Diagnóstico Ejecutivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Curva S Vectorial SVG */}
        <div className="portal-surface bg-[#0D1526] p-5 rounded-2xl space-y-3 lg:col-span-2 border border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" strokeWidth={1.75} />
              <span>Curva S: Proyección de Desempeño Acumulado</span>
            </h3>
            <div className="flex items-center gap-3 text-[10.5px] font-mono">
              <span className="flex items-center gap-1 text-sky-400 font-semibold">
                <span className="w-2.5 h-1 bg-sky-500 rounded-full inline-block" /> PV (Plan)
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2.5 h-1 bg-emerald-500 rounded-full inline-block" /> EV (Ganado)
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <span className="w-2.5 h-1 bg-rose-500 rounded-full inline-block" /> AC (Costo)
              </span>
            </div>
          </div>

          {/* Canvas SVG Reactivo Curva S */}
          <div className="w-full h-56 bg-slate-950/70 rounded-xl p-3 border border-slate-800 relative flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
              {/* Ejes y líneas guía */}
              <line x1="40" y1="20" x2="40" y2="150" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="40" y1="150" x2="480" y2="150" stroke="#475569" strokeWidth="1.5" />

              {/* Curva PV (Planificada) - Curva Sigmoide S Completa */}
              <path
                d="M 40 150 C 180 145, 260 70, 480 25"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Línea de corte actual */}
              {(() => {
                const statusX = 40 + (Math.min(100, pctTiempo) / 100) * 440;
                const evRatio = bac > 0 ? Math.min(1.2, ev / bac) : 0;
                const acRatio = bac > 0 ? Math.min(1.2, ac / bac) : 0;
                const targetEvY = 150 - evRatio * 125;
                const targetAcY = 150 - acRatio * 125;

                return (
                  <>
                    <line
                      x1={statusX}
                      y1="20"
                      x2={statusX}
                      y2="150"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                    {/* Curva EV (Ganado) hasta fecha de corte */}
                    <path
                      d={`M 40 150 Q ${(40 + statusX) / 2} ${(150 + targetEvY) / 2 + 10} ${statusX} ${targetEvY}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Curva AC (Costo Real) hasta fecha de corte */}
                    <path
                      d={`M 40 150 Q ${(40 + statusX) / 2} ${(150 + targetAcY) / 2 + 15} ${statusX} ${targetAcY}`}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx={statusX} cy={targetEvY} r="4" fill="#10b981" />
                    <circle cx={statusX} cy={targetAcY} r="4" fill="#f43f5e" />
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tabular-nums">
            <span>0% Tiempo (Inicio)</span>
            <span>Línea de Corte Actual ({pctTiempo}%)</span>
            <span>100% Tiempo (Fin Contractual)</span>
          </div>
        </div>

        {/* Diagnóstico PMO */}
        <div className="portal-surface bg-[#0D1526] p-5 rounded-2xl space-y-3 border border-slate-800 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Dictamen Ejecutivo PMO
              </h3>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              {dictamenPmo}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800 text-[11px] font-mono tabular-nums">
            <div className="flex justify-between items-center text-slate-400">
              <span>Varianza a la Conclusión (VAC):</span>
              <b className={vac >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                PEN {vac.toLocaleString('es-PE')}
              </b>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Costo Comprometido (CC):</span>
              <b className="text-amber-400">PEN {cc.toLocaleString('es-PE')}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
