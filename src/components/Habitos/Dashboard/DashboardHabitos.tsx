import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { deduplicarHitosPlan, deduplicarVinculosMeta } from '../../../utils/entityNormalizer';
import { calcularProgresoBimodal, type MetaConDetalle } from '../../../services/metasService';
import { useHabitos } from '../../../hooks/useHabitos';
import { BentoMetricasHero } from './BentoMetricasHero';
import { RadarBalanceVida } from './RadarBalanceVida';
import { HeatmapConsistencia } from './HeatmapConsistencia';
import { MetasCuantitativas } from './MetasCuantitativas';
import { TablaRendimiento } from './TablaRendimiento';
import { HistogramaSeguimientoTemporal } from '../HistogramaSeguimientoTemporal';
import { ModalDetalleMeta360 } from '../Metas/ModalDetalleMeta360';

interface DashboardHabitosProps {
  onCrearActividad?: () => void;
}

export const DashboardHabitos: React.FC<DashboardHabitosProps> = ({ onCrearActividad }) => {
  const { actividades, todasLasActividades, metasPlanes, kpis, registrarAvance } = useHabitos();
  const [meta360Id, setMeta360Id] = useState<string | null>(null);

  const hitosRaw = useLiveQuery(() => db.planes_accion_hitos.toArray(), []) || [];
  const hitos = React.useMemo(() => deduplicarHitosPlan(hitosRaw), [hitosRaw]);
  const vinculosRaw = useLiveQuery(() => db.habitos_metas_vinculos.toArray(), []) || [];
  const vinculos = React.useMemo(() => deduplicarVinculosMeta(vinculosRaw), [vinculosRaw]);
  const logs = useLiveQuery(() => db.habito_cumplimiento_logs.toArray(), []) || [];

  const meta360Seleccionada: MetaConDetalle | null = React.useMemo(() => {
    if (!meta360Id) return null;
    const base = metasPlanes.find((m) => m.id === meta360Id);
    if (!base) return null;
    const mapAct = new Map(todasLasActividades.map((a) => [a.id, a]));
    const hitosMeta = hitos
      .filter((h) => h.meta_id === base.id)
      .sort((a, b) => (a.orden_secuencia || 0) - (b.orden_secuencia || 0));
    const vinculosMeta = vinculos
      .filter((v) => v.meta_id === base.id)
      .map((v) => ({ ...v, habito: mapAct.get(v.habito_id) }));
    const calculo = calcularProgresoBimodal(base, hitosMeta, vinculosMeta);
    return {
      ...base,
      hitos: hitosMeta,
      vinculos: vinculosMeta,
      ...calculo
    };
  }, [meta360Id, metasPlanes, todasLasActividades, hitos, vinculos]);

  return (
    <div
      id="dashboard-habitos-container"
      className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 lg:p-6 bg-[#040711] transition-colors duration-200 space-y-4 lg:space-y-5 scrollbar-thin scrollbar-thumb-slate-800"
    >
      {/* 1. HERO BENTO CARDS (4 KPIS DE ALTO RENDIMIENTO) */}
      <BentoMetricasHero kpis={kpis} actividades={actividades} />

      {/* 2. HISTOGRAMA TEMPORAL DE SEGUIMIENTO POR META Y UNIDAD DE MEDIDA */}
      <HistogramaSeguimientoTemporal
        metasDisponibles={metasPlanes}
        actividades={todasLasActividades}
        vinculos={vinculos}
        logs={logs}
        onAbrirMeta360={(meta) => setMeta360Id(meta.id)}
      />

      {/* 3. GRID PRINCIPAL: HEATMAP (16 SEMANAS) & RADAR POLIGONAL DE BALANCE DE VIDA */}
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

      {/* 4. MONITOR DE METAS CUANTITATIVAS & NIVEL DE RESCATE */}
      <MetasCuantitativas
        actividades={actividades}
        metas={metasPlanes}
        onRegistrarAvance={registrarAvance}
        onCrearMeta={onCrearActividad}
        onAbrirMeta360={(metaId) => setMeta360Id(metaId)}
      />

      {/* 5. TABLA DE RENDIMIENTO Y ESTADO INDIVIDUAL POR HÁBITO */}
      <TablaRendimiento actividades={actividades} />

      {/* 6. MODAL VISTA DETALLADA 360° DE META / PLAN */}
      {meta360Seleccionada && (
        <ModalDetalleMeta360
          meta={meta360Seleccionada}
          todasLasActividades={todasLasActividades}
          todosLosVinculos={vinculos}
          logs={logs}
          onClose={() => setMeta360Id(null)}
        />
      )}
    </div>
  );
};
