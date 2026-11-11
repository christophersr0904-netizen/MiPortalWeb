/**
 * ============================================================================
 * ARCHIVO: src/components/Finanzas/DashboardFinanciero.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYS-001-F5
 * DESCRIPCIÓN: Submódulo memoizado de Dashboard Financiero Bento Grid, KPIs
 *              decisionales y widget de próximos vencimientos con Silencio Visual.
 * ============================================================================
 */

import React, { memo, useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  PieChart,
  Clock,
  Flame,
  Check,
  Target,
  ChevronDown
} from 'lucide-react';

export interface DashboardFinancieroProps {
  saldoEnManoReal: number;
  realIngresos: number;
  realGastos: number;
  saldoProyectadoFinMes: number;
  totalCompromisosPendientes: number;
  cuotasPendientesCount: number;
  montoCuotasPendientes: number;
  otrosGastosPendientes: number;
  posicionBimonetaria: { totalPEN: number; totalUSD: number };
  tipoCambioSunat: number;
  diasCobertura: number;
  semaforoStatus: { badge: string; color: string; dot: string; barWidth: string; desc: string };
  gastosHormiga: number;
  pctGastosHormiga: number;
  capacidadAhorro: number;
  ratioAhorroPct: number;
  ratioEndeudamientoCuotas: number;
  radarCategorias: Array<{ categoria: string; total: number }>;
  proximosVencimientos: Array<{
    id: string;
    tipo: 'CUOTA' | 'GASTO';
    codigo: string;
    concepto: string;
    entidad?: string;
    fecha: string;
    diasRestantes: number;
    montoPen: number;
    raw: any;
  }>;
  optimisticConciliados?: Record<string, boolean>;
  onIrAPresupuesto: () => void;
  onIrATransaccionesProgramadas: () => void;
  onToggleConciliarCuota: (cuotaId: string, estadoActual: string) => void;
  onToggleConciliarGasto: (gastoId: string) => void;
}

const DashboardFinancieroComponent: React.FC<DashboardFinancieroProps> = ({
  saldoEnManoReal,
  realIngresos,
  realGastos,
  saldoProyectadoFinMes,
  totalCompromisosPendientes,
  cuotasPendientesCount,
  montoCuotasPendientes,
  otrosGastosPendientes,
  posicionBimonetaria,
  tipoCambioSunat,
  diasCobertura,
  semaforoStatus,
  gastosHormiga,
  pctGastosHormiga,
  capacidadAhorro,
  ratioAhorroPct,
  ratioEndeudamientoCuotas,
  radarCategorias,
  proximosVencimientos,
  optimisticConciliados = {},
  onIrAPresupuesto,
  onIrATransaccionesProgramadas,
  onToggleConciliarCuota,
  onToggleConciliarGasto
}) => {
  const [kpisExpandidosMovil, setKpisExpandidosMovil] = useState(false);

  return (
    <div id="vista-fin-tab-general" className="tab-fin-view p-2.5 sm:p-4 md:p-6 space-y-3 sm:space-y-5 flex-1">
      {/* 1. RESUMEN TOP: SALDO EN MANO HOY VS PROYECCIÓN FIN DE MES (2X2 EN MÓVIL) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 select-none">
        {/* Card 1: Saldo en Mano Real Hoy */}
        <div
          title="Liquidez disponible y consolidada en cuentas bancarias"
          className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0D1526]/90 border border-slate-800/60 shadow-sm relative overflow-hidden flex flex-col justify-between transform-gpu hover:translate-y-[-2px] transition duration-150"
        >
          <div className="flex items-center justify-between text-slate-400 mb-0.5 sm:mb-1 gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider truncate">Dinero Real Hoy</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0" title="Liquidez Real Activa" />
          </div>
          <div>
            <div id="kpi-saldo-en-mano" className="text-base sm:text-2xl font-bold font-mono tabular-nums text-emerald-400 truncate tracking-tight">
              S/ {saldoEnManoReal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono tabular-nums pt-1 border-t border-slate-800">
              <span>
                Cobrado: <strong id="kpi-sub-ing-real" className="text-emerald-400 font-mono tabular-nums">S/ {realIngresos.toFixed(2)}</strong>
              </span>
              <span>
                Pagado: <strong id="kpi-sub-gas-real" className="text-rose-400 font-mono tabular-nums">S/ {realGastos.toFixed(2)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Saldo Proyectado a Fin de Mes */}
        <div
          title="Saldo proyectado deduciendo compromisos y cuotas pendientes del mes"
          className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0D1526]/90 border border-slate-800/60 shadow-sm relative overflow-hidden flex flex-col justify-between transform-gpu hover:translate-y-[-2px] transition duration-150"
        >
          <div className="flex items-center justify-between text-slate-400 mb-0.5 sm:mb-1 gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider truncate">Saldo Proyectado</span>
            <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4] shrink-0" title="Estimación a Fin de Mes" />
          </div>
          <div>
            <div id="kpi-saldo-proyectado-fin-mes" className="text-base sm:text-2xl font-bold font-mono tabular-nums text-cyan-400 truncate tracking-tight">
              S/ {saldoProyectadoFinMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="hidden sm:flex text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800 font-mono tabular-nums items-center justify-between">
              <span>Cobertura Estimada:</span>
              <strong className="text-cyan-300">{diasCobertura} días</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Compromisos y Cuotas Pendientes del Mes */}
        <div
          title="Obligaciones financieras programadas pendientes de liquidación en el periodo"
          className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0D1526]/90 border border-slate-800/60 shadow-sm flex flex-col justify-between transform-gpu hover:translate-y-[-2px] transition duration-150"
        >
          <div className="flex items-center justify-between text-slate-400 mb-0.5 sm:mb-1 gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider truncate">Compromisos</span>
            <span className="text-[9px] sm:text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              {cuotasPendientesCount + (otrosGastosPendientes > 0 ? 1 : 0)}
            </span>
          </div>
          <div>
            <div id="kpi-total-compromisos-pendientes" className="text-base sm:text-2xl font-bold font-mono tabular-nums text-amber-400 truncate tracking-tight">
              S/ {totalCompromisosPendientes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono tabular-nums pt-1 border-t border-slate-800">
              <span>
                Cuotas: <strong id="kpi-sub-cuotas-pend" className="text-violet-400 font-mono tabular-nums">S/ {montoCuotasPendientes.toFixed(2)}</strong>
              </span>
              <span>
                Otros: <strong id="kpi-sub-otros-pend" className="text-slate-300 font-mono tabular-nums">S/ {otrosGastosPendientes.toFixed(2)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Posición Bimonetaria y TC */}
        <div
          title="Distribución de fondos en Soles (PEN) y Dólares (USD)"
          className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0D1526]/90 border border-slate-800/60 shadow-sm flex flex-col justify-between transform-gpu hover:translate-y-[-2px] transition duration-150"
        >
          <div className="flex items-center justify-between text-slate-400 mb-0.5 sm:mb-1 gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider truncate">Bimoneda</span>
            <span className="text-[9px] sm:text-[10px] font-bold font-mono text-slate-400 shrink-0">PEN / USD</span>
          </div>
          <div>
            <div className="flex items-baseline justify-between font-mono tabular-nums text-[11px] sm:text-xs">
              <span className="text-slate-400">PEN:</span>
              <span id="kpi-fin-bimon-pen" className="font-bold text-slate-100 text-xs sm:text-sm font-mono tabular-nums">
                S/ {posicionBimonetaria.totalPEN.toFixed(2)}
              </span>
            </div>
            <div className="flex items-baseline justify-between font-mono tabular-nums text-[11px] sm:text-xs mt-0.5">
              <span className="text-slate-400">USD:</span>
              <span id="kpi-fin-bimon-usd" className="font-bold text-emerald-400 text-xs sm:text-sm font-mono tabular-nums">
                $ {posicionBimonetaria.totalUSD.toFixed(2)}
              </span>
            </div>
            <div className="hidden sm:flex mt-1 pt-1 border-t border-slate-800 items-center justify-between text-[10px] text-slate-400">
              <span>TC SUNAT:</span>
              <span id="kpi-fin-tc-val" className="font-mono tabular-nums font-bold text-slate-300">
                {tipoCambioSunat.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BENTO GRID: LOS 5 KPIS DE IMPACTO DECISIONAL (LEY DEL SILENCIO VISUAL) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
            <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider">
              Indicadores de Salud Financiera
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] font-mono text-slate-400">
              Ingresos, gastos y pasivos en tiempo real
            </span>
            <button
              type="button"
              onClick={() => setKpisExpandidosMovil(!kpisExpandidosMovil)}
              className="md:hidden flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/50 px-2 py-0.5 rounded-lg transition active:scale-95 cursor-pointer"
            >
              <span>{kpisExpandidosMovil ? 'Ocultar' : 'Ver 5 KPIs'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${kpisExpandidosMovil ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mini cápsulas métricas compactas para móvil cuando está colapsado */}
        {!kpisExpandidosMovil && (
          <div className="md:hidden flex flex-row overflow-x-auto [&::-webkit-scrollbar]:hidden gap-1.5 py-0.5 snap-x overscroll-contain select-none">
            <div className="shrink-0 snap-start px-2.5 py-1 rounded-lg bg-[#0D1526] border border-slate-800/60 text-[10px] font-mono flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${semaforoStatus.dot}`} />
              <span className="text-slate-300 font-bold">{semaforoStatus.badge}</span>
              <span className="text-emerald-400">({diasCobertura}d)</span>
            </div>
            <div className="shrink-0 snap-start px-2.5 py-1 rounded-lg bg-[#0D1526] border border-slate-800/60 text-[10px] font-mono flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-slate-400">Hormiga:</span>
              <span className="text-amber-400 font-bold">{pctGastosHormiga}%</span>
            </div>
            <div className="shrink-0 snap-start px-2.5 py-1 rounded-lg bg-[#0D1526] border border-slate-800/60 text-[10px] font-mono flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Ahorro:</span>
              <span className="text-emerald-400 font-bold">{ratioAhorroPct}%</span>
            </div>
            <div className="shrink-0 snap-start px-2.5 py-1 rounded-lg bg-[#0D1526] border border-slate-800/60 text-[10px] font-mono flex items-center gap-1.5">
              <CreditCard className="w-3 h-3 text-violet-400 shrink-0" />
              <span className="text-slate-400">Deuda:</span>
              <span className="text-violet-400 font-bold">{ratioEndeudamientoCuotas}%</span>
            </div>
            <div className="shrink-0 snap-start px-2.5 py-1 rounded-lg bg-[#0D1526] border border-slate-800/60 text-[10px] font-mono flex items-center gap-1.5">
              <PieChart className="w-3 h-3 text-sky-400 shrink-0" />
              <span className="text-slate-300 truncate max-w-[110px]">{radarCategorias[0]?.categoria || 'Sin gastos'}</span>
            </div>
          </div>
        )}

        <div className={`${kpisExpandidosMovil ? 'grid' : 'hidden md:grid'} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4`}>
          {/* KPI 1: SEMÁFORO DE LIQUIDEZ */}
          <div
            id="card-semaforo-liquidez"
            title={semaforoStatus.desc}
            className="p-4 rounded-2xl bg-[#0D1526] border border-slate-800/60 shadow-cobalt-1 flex flex-col justify-between transform-gpu hover:translate-y-[-2px] transition duration-150"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${semaforoStatus.dot} shadow-[0_0_8px_#10b981]`} id="dot-semaforo-liquidez" />
                  <span className="text-xs font-bold text-slate-100">1. Semáforo de Liquidez</span>
                </div>
                <span id="badge-semaforo-liquidez" className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {semaforoStatus.badge} ({diasCobertura}d)
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400">Liquidez Neta Estimada (Fin de Mes):</div>
                <div id="val-semaforo-liquidez" className="text-xl font-black font-mono tabular-nums text-emerald-400">
                  S/ {saldoProyectadoFinMes.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden mt-3 shadow-inner">
              <div id="bar-semaforo-liquidez" className="bg-emerald-500 shadow-[0_0_8px_#10b981] h-full rounded-full transition-all duration-500" style={{ width: semaforoStatus.barWidth }} />
            </div>
          </div>

          {/* KPI 2: ALERTA DE FUGA / GASTOS HORMIGA */}
          <div
            id="card-gastos-hormiga"
            title={`Compras menores no esenciales del mes (<= S/ 300). Representa el ${pctGastosHormiga}% de tus egresos.`}
            className="p-4 rounded-2xl bg-[#0D1526] border border-slate-800/60 shadow-cobalt-1 flex flex-col justify-between transform-gpu hover:translate-y-[-2px] transition duration-150"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-slate-100">2. Alerta Fuga / Gastos Hormiga</span>
                </div>
                <span id="badge-gastos-hormiga" className={`text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-full border ${gastosHormiga <= 300 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {pctGastosHormiga}% Egresos
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400">Consumo hormiga acumulado:</div>
                <div id="val-gastos-hormiga" className="text-xl font-black font-mono tabular-nums text-amber-400">
                  S/ {gastosHormiga.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden mt-3 shadow-inner">
              <div id="bar-gastos-hormiga" className="bg-amber-500 shadow-[0_0_8px_#f59e0b] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pctGastosHormiga * 3, 100)}%` }} />
            </div>
          </div>

          {/* KPI 3: CAPACIDAD DE AHORRO / SUPERÁVIT MENSUAL */}
          <div
            id="card-capacidad-ahorro"
            title={`Dinero libre para ahorro e inversión. Tasa calculada: ${ratioAhorroPct}% (Meta recomendada >= 20%).`}
            className="p-4 rounded-2xl bg-[#0D1526] border border-slate-800/60 shadow-cobalt-1 flex flex-col justify-between transform-gpu hover:translate-y-[-2px] transition duration-150"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-slate-100">3. Capacidad de Ahorro</span>
                </div>
                <span id="badge-capacidad-ahorro" className={`text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-full border ${ratioAhorroPct >= 20 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                  Tasa: {ratioAhorroPct}%
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400">Superávit Proyectado:</div>
                <div id="val-capacidad-ahorro" className="text-xl font-black font-mono tabular-nums text-emerald-400">
                  S/ {capacidadAhorro.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden mt-3 shadow-inner">
              <div id="bar-capacidad-ahorro" className="bg-emerald-500 shadow-[0_0_8px_#10b981] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(ratioAhorroPct, 100)}%` }} />
            </div>
          </div>

          {/* KPI 4: NIVEL DE ENDEUDAMIENTO EN CUOTAS */}
          <div
            id="card-endeudamiento-cuotas"
            title={`Porcentaje del ingreso comprometido en cuotas bancarias. Compromiso mensual: S/ ${montoCuotasPendientes.toFixed(2)} (Límite seguro <= 30%).`}
            className="p-4 rounded-2xl bg-[#0D1526] border border-slate-800/60 shadow-cobalt-1 flex flex-col justify-between transform-gpu hover:translate-y-[-2px] transition duration-150"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-violet-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-slate-100">4. Nivel de Endeudamiento</span>
                </div>
                <span id="badge-endeudamiento-cuotas" className={`text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-full border ${ratioEndeudamientoCuotas <= 30 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {ratioEndeudamientoCuotas}% Ingresos
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400">Compromiso Mensual de Cuotas:</div>
                <div id="val-endeudamiento-cuotas" className="text-xl font-black font-mono tabular-nums text-violet-400">
                  S/ {montoCuotasPendientes.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden mt-3 shadow-inner">
              <div id="bar-endeudamiento-cuotas" className="bg-violet-500 shadow-[0_0_8px_#8b5cf6] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(ratioEndeudamientoCuotas, 100)}%` }} />
            </div>
          </div>

          {/* KPI 5: RADAR DE CATEGORÍAS CRÍTICAS */}
          <div
            id="card-radar-categorias-criticas"
            title="Categorías con mayor presión presupuestal o consumo acelerado este periodo"
            className="p-4 rounded-2xl bg-[#0D1526] border border-slate-800/60 shadow-cobalt-1 md:col-span-2 flex flex-col justify-between transform-gpu hover:translate-y-[-2px] transition duration-150"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-slate-100">5. Radar de Categorías Críticas</span>
                </div>
                <button
                  type="button"
                  onClick={onIrAPresupuesto}
                  className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Ver Techos Presupuestales &rarr;
                </button>
              </div>

              <div id="lista-radar-categorias-criticas" className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {radarCategorias.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center col-span-full">
                    Sin gastos imputados en el periodo
                  </div>
                ) : (
                  radarCategorias.map((c) => (
                    <div key={c.categoria} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 truncate mr-2">{c.categoria}</span>
                      <span className="font-mono tabular-nums text-xs font-bold text-slate-100 shrink-0">S/ {c.total.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRÓXIMOS VENCIMIENTOS Y CUOTAS (WIDGET ACCIONABLE CON UI OPTIMISTA) */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0D1526] border border-slate-800/60 shadow-cobalt-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              Próximos Vencimientos y Cuotas (15 Días)
            </h3>
          </div>
          <button
            type="button"
            onClick={onIrATransaccionesProgramadas}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
          >
            Ver Todas las Programadas &rarr;
          </button>
        </div>

        <div id="lista-proximos-vencimientos-dashboard" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {proximosVencimientos.length === 0 ? (
            <div className="min-h-[100px] text-xs text-slate-400 p-6 text-center border border-dashed border-slate-700/50 bg-slate-900/30 rounded-xl col-span-full flex flex-col items-center justify-center space-y-1.5">
              <Clock className="w-5 h-5 text-slate-500" strokeWidth={1.75} />
              <span className="font-semibold text-slate-300">Sin compromisos pendientes</span>
              <span className="text-[11px] text-slate-500">No hay pagos ni cuotas programadas en los próximos 15 días</span>
            </div>
          ) : (
            proximosVencimientos.map((item) => {
              const esConciliado = optimisticConciliados[item.id] !== undefined
                ? optimisticConciliados[item.id]
                : false;

              return (
                <div
                  key={`${item.tipo}-${item.id}`}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono tabular-nums border ${
                        item.tipo === 'CUOTA'
                          ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {item.codigo}
                      </span>
                      <span className={`text-[10px] font-bold ${item.diasRestantes <= 1 ? 'text-rose-400 font-extrabold' : 'text-amber-400'}`}>
                        {item.diasRestantes <= 0 ? 'Vence hoy' : `En ${item.diasRestantes}d`}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate">{item.concepto}</div>
                    <div className="text-[10px] text-slate-400 font-mono tabular-nums mt-0.5">F. Límite: {item.fecha}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono tabular-nums text-xs font-black text-slate-100">
                      S/ {item.montoPen.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.tipo === 'CUOTA') {
                          onToggleConciliarCuota(item.id, 'PENDIENTE');
                        } else {
                          onToggleConciliarGasto(item.id);
                        }
                      }}
                      className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                        esConciliado
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                      }`}
                    >
                      <Check className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
                      <span>{esConciliado ? 'Liquidada' : 'Conciliar'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export const DashboardFinanciero = memo(DashboardFinancieroComponent);

