/**
 * ============================================================================
 * ARCHIVO: src/components/Finanzas/TabControlCuotas.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYS-001-F5
 * DESCRIPCIÓN: Submódulo memoizado de Gobernanza de Cuotas y Créditos Bancarios
 *              con acumulación O(N) centralizada y soporte UI Optimista.
 * ============================================================================
 */

import React, { memo, useMemo } from 'react';
import { Building, Wrench, Check, CreditCard } from 'lucide-react';

export interface TabControlCuotasProps {
  cuotasRaw: any[];
  montoCuotasPendientes: number;
  optimisticConciliados?: Record<string, boolean>;
  onSanearCuotas: () => void;
  onAbrirModalNuevaCuota: () => void;
  onToggleConciliarCuota: (cuotaId: string, estadoActual: string) => void;
}

const TabControlCuotasComponent: React.FC<TabControlCuotasProps> = ({
  cuotasRaw,
  montoCuotasPendientes,
  optimisticConciliados = {},
  onSanearCuotas,
  onAbrirModalNuevaCuota,
  onToggleConciliarCuota
}) => {
  // Acumulación O(N) única en lugar de doble filter-reduce inline en JSX
  const kpisCuotas = useMemo(() => {
    let amortizado = 0;
    let deuda = 0;

    for (const c of cuotasRaw) {
      const estadoReal = (c.estado_cuota || '').toUpperCase() === 'PAGADO';
      const esPagado = optimisticConciliados[c.id] !== undefined
        ? optimisticConciliados[c.id]
        : estadoReal;
      const monto = Number(c.monto_cuota || 0);

      if (esPagado) {
        amortizado += monto;
      } else {
        deuda += monto;
      }
    }

    return { amortizado, deuda };
  }, [cuotasRaw, optimisticConciliados]);

  return (
    <div id="vista-fin-tab-cuotas" className="tab-fin-view p-4 md:p-6 space-y-4 flex-1 animate-in fade-in duration-150">
      {/* HEADER CONTROL DE CUOTAS */}
      <div className="p-4 rounded-xl bg-[#0D1526]/90 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            Gobernanza de Compromisos a Plazos & Deudas Bancarias
          </h3>
          <p className="text-xs text-slate-400">
            Registrado con la cuota exacta emitida por tu banco. Concilia cuotas individuales y monitorea el avance del capital.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={onSanearCuotas}
            className="h-9 px-3 bg-[#0D1526] hover:bg-slate-800/60 text-slate-200 border border-slate-800/80 hover:border-sky-500/40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Auditar y realinear columnas de cuotas desfasadas"
          >
            <Wrench className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            <span>Sanear Cuotas</span>
          </button>
          <button
            type="button"
            onClick={onAbrirModalNuevaCuota}
            className="h-10 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Nuevo Plan de Crédito</span>
          </button>
        </div>
      </div>

      {/* KPIS RÁPIDOS DE CUOTAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 transition-colors">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Planes de Crédito Activos</div>
          <div id="kpi-cuotas-activas" className="text-xl font-black font-mono tabular-nums text-violet-400">
            {cuotasRaw.length}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 transition-colors">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Compromiso Bancario Mensual</div>
          <div id="kpi-cuotas-mensual" className="text-xl font-black font-mono tabular-nums text-rose-400">
            S/ {montoCuotasPendientes.toFixed(2)}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 transition-colors">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Capital Amortizado Acumulado</div>
          <div id="kpi-cuotas-amortizado" className="text-xl font-black font-mono tabular-nums text-emerald-400">
            S/ {kpisCuotas.amortizado.toFixed(2)}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 transition-colors">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Saldo Pendiente Total</div>
          <div id="kpi-cuotas-deuda" className="text-xl font-black font-mono tabular-nums text-amber-400">
            S/ {kpisCuotas.deuda.toFixed(2)}
          </div>
        </div>
      </div>

      {/* LISTA DE PLANES DE CRÉDITO Y CUOTAS */}
      <div id="lista-planes-cuotas" className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        {cuotasRaw.length === 0 ? (
          <div className="col-span-full min-h-[140px] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/80 bg-[#0D1526]/50 text-slate-400 p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-800/40 flex items-center justify-center text-sky-400">
              <CreditCard className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="text-xs font-semibold text-slate-300">
              Sin planes de cuotas registrados
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm">
              Registra un plan de crédito bancario para amortizar capital y monitorear cuotas mensuales.
            </p>
            <button
              type="button"
              onClick={onAbrirModalNuevaCuota}
              className="mt-1 h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              + Nuevo Plan de Crédito
            </button>
          </div>
        ) : (
          cuotasRaw.map((c) => {
            const avancePct = Math.round((c.numero_cuota / c.total_cuotas) * 100);
            const estadoReal = (c.estado_cuota || '').toUpperCase() === 'PAGADO';
            const esPagado = optimisticConciliados[c.id] !== undefined
              ? optimisticConciliados[c.id]
              : estadoReal;

            return (
              <div
                key={c.id}
                className="p-5 rounded-xl bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 space-y-3 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-violet-400" strokeWidth={1.75} />
                      <h4 className="text-sm font-bold text-slate-100">{c.entidad_financiera}</h4>
                    </div>
                    <span className="text-xs font-black font-mono tabular-nums text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-xl border border-violet-500/20">
                      Cuota {c.numero_cuota} de {c.total_cuotas}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs text-slate-400">Monto de Cuota:</span>
                    <span className="text-lg font-black font-mono tabular-nums text-slate-100">
                      {c.moneda} {Number(c.monto_cuota || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Progreso de Amortización */}
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                      <span>Avance Capital</span>
                      <span>{avancePct}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="bg-violet-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${avancePct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <div>
                    <span>Vencimiento: </span>
                    <span className="font-mono tabular-nums font-bold text-slate-200">{c.fecha_vencimiento}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleConciliarCuota(c.id, c.estado_cuota)}
                    className={`h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      esPagado
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Check className="w-3 h-3" strokeWidth={1.75} />
                    <span>{esPagado ? 'Liquidada' : 'Liquidar Cuota'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const TabControlCuotas = memo(TabControlCuotasComponent);

