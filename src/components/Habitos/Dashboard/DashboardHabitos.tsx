import React from 'react';
import { useHabitos } from '../../../hooks/useHabitos';
import { BentoMetricasHero } from './BentoMetricasHero';
import { RadarBalanceVida } from './RadarBalanceVida';
import { HeatmapConsistencia } from './HeatmapConsistencia';
import { MetasCuantitativas } from './MetasCuantitativas';
import { TablaRendimiento } from './TablaRendimiento';

interface DashboardHabitosProps {
  onCrearActividad?: () => void;
}

export const DashboardHabitos: React.FC<DashboardHabitosProps> = ({ onCrearActividad }) => {
  const { actividades, kpis, registrarAvance } = useHabitos();

  return (
    <div
      id="dashboard-habitos-container"
      className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 lg:p-6 bg-slate-100 dark:bg-slate-950 transition-colors duration-200 space-y-4 lg:space-y-5 scrollbar-thin scrollbar-thumb-slate-800"
    >
      {/* 1. HERO BENTO CARDS (4 KPIS DE ALTO RENDIMIENTO) */}
      <BentoMetricasHero kpis={kpis} actividades={actividades} />

      {/* 2. GRID PRINCIPAL: HEATMAP (16 SEMANAS) & RADAR POLIGONAL DE BALANCE DE VIDA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* Heatmap de Consistencia ocupa 7 columnas en desktop */}
        <div className="lg:col-span-7 flex flex-col">
          <HeatmapConsistencia actividades={actividades} />
        </div>

        {/* Radar Poligonal de 6 Dimensiones ocupa 5 columnas en desktop */}
        <div className="lg:col-span-5 flex flex-col">
          <RadarBalanceVida pilarCounts={kpis.pilarCounts} />
        </div>
      </div>

      {/* 3. MONITOR DE METAS CUANTITATIVAS & NIVEL DE RESCATE */}
      <MetasCuantitativas
        actividades={actividades}
        onRegistrarAvance={registrarAvance}
        onCrearMeta={onCrearActividad}
      />

      {/* 4. TABLA DE RENDIMIENTO Y ESTADO INDIVIDUAL POR HÁBITO */}
      <TablaRendimiento actividades={actividades} />
    </div>
  );
};
