import React from 'react';
import { Flame, CheckCircle2, ShieldCheck, Clock, TrendingUp } from 'lucide-react';
import type { useHabitos } from '../../../hooks/useHabitos';

interface BentoMetricasHeroProps {
  kpis: ReturnType<typeof useHabitos>['kpis'];
  actividades: ReturnType<typeof useHabitos>['actividades'];
}

export const BentoMetricasHero: React.FC<BentoMetricasHeroProps> = ({ kpis, actividades }) => {
  const pctCumplimiento = kpis.total > 0 ? Math.round((kpis.completadosHoy / kpis.total) * 100) : 0;

  // Cálculo de Tasa de Recuperación ("Never miss twice" - Atomic Habits)
  // Mide el porcentaje de hábitos con racha activa o que no tienen racha rota prolongada
  const tasaRecuperacion = React.useMemo(() => {
    const habitosRutinarios = actividades.filter(
      (a) => a.tipo_compromiso === 'HABITUAL' || Boolean(a.frecuencia_ciclo && a.frecuencia_ciclo !== 'NINGUNA')
    );
    if (habitosRutinarios.length === 0) return 100;

    let recuperadosOActivos = 0;
    for (const h of habitosRutinarios) {
      const racha = h.racha_actual || 0;
      // Si la racha es >= 1 o si fue completado recientemente, se considera en resiliencia activa
      if (racha >= 1 || h.estado === '04_Completado') {
        recuperadosOActivos++;
      }
    }
    return Math.round((recuperadosOActivos / habitosRutinarios.length) * 100);
  }, [actividades]);

  // Dimensiones del medidor radial SVG para Tasa de Recuperación
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (tasaRecuperacion / 100) * circumference;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 shrink-0">
      {/* CARD 1: CONSISTENCIA GLOBAL HOY */}
      <div className="portal-surface bg-white dark:bg-[#0D1526] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Consistencia Hoy
          </span>
          <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
          </span>
        </div>
        <div className="my-2 flex items-baseline justify-between">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono tabular-nums">
            {kpis.completadosHoy} / {kpis.total}
          </span>
          <span className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {pctCumplimiento}%
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${pctCumplimiento}%` }}
          />
        </div>
        <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-2 truncate">
          {pctCumplimiento >= 80 ? 'Rendimiento sobresaliente' : 'En progreso de completado diario'}
        </span>
      </div>

      {/* CARD 2: MAYOR RACHA ACTIVA */}
      <div className="portal-surface bg-white dark:bg-[#0D1526] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Mayor Racha Activa
          </span>
          <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-500">
            <Flame className="w-4 h-4" strokeWidth={1.75} />
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono tabular-nums">
            {kpis.maxRacha} días
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10.5px] text-amber-600 dark:text-amber-400/90 font-medium truncate">
          <TrendingUp className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">
            {kpis.maxRacha >= 14 ? 'Identidad consolidada (+2 sem)' : kpis.maxRacha >= 7 ? 'Semana sólida de consistencia' : 'Construyendo inercia inicial'}
          </span>
        </div>
      </div>

      {/* CARD 3: TASA DE RECUPERACIÓN (ATOMIC HABITS) CON MEDIDOR RADIAL SVG */}
      <div className="portal-surface bg-white dark:bg-[#0D1526] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Tasa de Recuperación
          </span>
          <span className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-400">
            <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
          </span>
        </div>
        <div className="my-1.5 flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono tabular-nums">
              {tasaRecuperacion}%
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
              Regla: No fallar 2 veces seguidas
            </p>
          </div>

          {/* Anillo Circular SVG Nativo */}
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 52 52">
              <circle
                cx="26"
                cy="26"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="26"
                cy="26"
                r={radius}
                className="stroke-sky-400 transition-all duration-700 ease-out"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-[9.5px] font-bold font-mono text-sky-500 dark:text-sky-300">
              {tasaRecuperacion}%
            </span>
          </div>
        </div>
        <span className="text-[10.5px] text-sky-600 dark:text-sky-300 font-medium truncate">
          {tasaRecuperacion >= 75 ? 'Alta Resiliencia Operativa' : 'Requiere reactivar hábitos caídos'}
        </span>
      </div>

      {/* CARD 4: HORAS INVERTIDAS EN BIENESTAR */}
      <div className="portal-surface bg-white dark:bg-[#0D1526] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-violet-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Inversión en Bienestar
          </span>
          <span className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-400">
            <Clock className="w-4 h-4" strokeWidth={1.75} />
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono tabular-nums">
            {kpis.horasInvertidas.toFixed(1)} hrs
          </span>
        </div>
        <span className="text-[10.5px] text-violet-600 dark:text-violet-400 font-medium truncate">
          Dedicadas hoy al crecimiento integral
        </span>
      </div>
    </div>
  );
};
