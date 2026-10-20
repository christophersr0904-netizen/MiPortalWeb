import React, { useMemo, useState } from 'react';
import type { ActividadPersonal } from '../../../types';
import { Calendar, Flame } from 'lucide-react';

interface HeatmapConsistenciaProps {
  actividades: ActividadPersonal[];
}

const DIAS_SEMANA_CORTO = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const HeatmapConsistencia: React.FC<HeatmapConsistenciaProps> = ({ actividades }) => {
  const [hoveredCell, setHoveredCell] = useState<{
    fecha: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Generar la matriz de 16 semanas (112 días) finalizando el próximo domingo
  const { matrizSemanas, conteoFechas } = useMemo(() => {
    const mapaConteo: Record<string, number> = {};
    const hoy = new Date();

    // 1. Mapear compleciones reales de todas las actividades
    for (const act of actividades) {
      // Fuente A: historial_fechas persistido
      if (Array.isArray(act.historial_fechas)) {
        for (const f of act.historial_fechas) {
          mapaConteo[f] = (mapaConteo[f] || 0) + 1;
        }
      }

      // Fuente B: última fecha completado directa
      if (act.ultima_fecha_completado) {
        if (!mapaConteo[act.ultima_fecha_completado]) {
          mapaConteo[act.ultima_fecha_completado] = 1;
        }
      }

      // Fuente C: Proyección de racha activa hacia atrás desde última fecha completada o hoy
      const racha = act.racha_actual || 0;
      if (racha > 1 && (act.ultima_fecha_completado || act.estado === '04_Completado')) {
        const fechaBaseStr = act.ultima_fecha_completado || act.fecha_programada;
        const [y, m, d] = fechaBaseStr.split('-').map(Number);
        if (y && m && d) {
          const fechaRef = new Date(y, m - 1, d);
          for (let i = 1; i < Math.min(racha, 30); i++) {
            const fechaAnt = new Date(fechaRef);
            fechaAnt.setDate(fechaRef.getDate() - i);
            const iso = fechaAnt.toISOString().split('T')[0];
            // Solo proyectar si no estaba explícitamente ya registrado
            if (!act.historial_fechas || !act.historial_fechas.includes(iso)) {
              mapaConteo[iso] = (mapaConteo[iso] || 0) + 1;
            }
          }
        }
      }
    }

    // 2. Construir matriz de 16 columnas x 7 filas (Lunes a Domingo)
    // Encontrar el último domingo que cierre la semana en curso
    const diaHoySemana = hoy.getDay(); // 0 es Domingo, 1 es Lunes...
    const diasHastaDomingo = diaHoySemana === 0 ? 0 : 7 - diaHoySemana;
    const finSemana = new Date(hoy);
    finSemana.setDate(hoy.getDate() + diasHastaDomingo);

    const totalDias = 16 * 7; // 112 días
    const inicio = new Date(finSemana);
    inicio.setDate(finSemana.getDate() - totalDias + 1);

    const semanas: Array<Array<{ fecha: string; count: number; esHoy: boolean; enFuturo: boolean }>> = [];
    const hoyIso = hoy.toISOString().split('T')[0];

    let cursor = new Date(inicio);
    let maxNum = 1;

    for (let w = 0; w < 16; w++) {
      const semanaCol: Array<{ fecha: string; count: number; esHoy: boolean; enFuturo: boolean }> = [];
      for (let d = 0; d < 7; d++) {
        const iso = cursor.toISOString().split('T')[0];
        const count = mapaConteo[iso] || 0;
        if (count > maxNum) maxNum = count;
        const esHoy = iso === hoyIso;
        const enFuturo = iso > hoyIso;

        semanaCol.push({
          fecha: iso,
          count: enFuturo ? 0 : count,
          esHoy,
          enFuturo
        });

        cursor.setDate(cursor.getDate() + 1);
      }
      semanas.push(semanaCol);
    }

    return {
      matrizSemanas: semanas,
      conteoFechas: mapaConteo,
      maxCompletados: maxNum
    };
  }, [actividades]);

  // Obtener clase de intensidad para cada celda
  const getIntensidadClase = (count: number, enFuturo: boolean, esHoy: boolean) => {
    if (enFuturo) return 'bg-slate-900/30 border border-slate-800/20 opacity-30';
    if (count === 0) {
      return esHoy
        ? 'bg-slate-800/80 border border-emerald-500/50'
        : 'bg-slate-900/80 border border-slate-800/60 hover:border-slate-600';
    }
    if (count === 1) return 'bg-emerald-950/80 border border-emerald-800/60 hover:border-emerald-500';
    if (count === 2) return 'bg-emerald-800 border border-emerald-600/80 hover:border-emerald-400';
    if (count === 3) return 'bg-emerald-600 border border-emerald-400/80 hover:border-emerald-300';
    return 'bg-teal-400 border border-teal-300 text-slate-950 shadow-xs shadow-teal-500/30';
  };

  const formatearFechaTooltip = (fechaIso: string) => {
    const [y, m, d] = fechaIso.split('-').map(Number);
    if (!y || !m || !d) return fechaIso;
    const fecha = new Date(y, m - 1, d);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalCompletadosPeriodo = useMemo(() => {
    return Object.values(conteoFechas).reduce((acc, c) => acc + c, 0);
  }, [conteoFechas]);

  return (
    <div className="portal-surface bg-white dark:bg-[#0D1526] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden">
      {/* CABECERA WIDGET */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-400">
            <Calendar className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Mapa de Consistencia (Heatmap)</span>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                16 semanas
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Trazabilidad continua de hábitos y rutinas completadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-mono tabular-nums flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
            <span>{totalCompletadosPeriodo} completados</span>
          </span>
        </div>
      </div>

      {/* MATRIZ VISUAL DE CALOR */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="min-w-[580px] flex gap-2">
          {/* Etiquetas días de la semana (L, M, X, J, V, S, D) */}
          <div className="flex flex-col gap-1.5 text-[9.5px] font-bold text-slate-400 dark:text-slate-600 pt-0.5 select-none shrink-0 w-3">
            {DIAS_SEMANA_CORTO.map((d, i) => (
              <div key={i} className="h-3 flex items-center justify-center">
                {d}
              </div>
            ))}
          </div>

          {/* Columnas de Semanas (16 semanas) */}
          <div className="flex gap-1.5 flex-1">
            {matrizSemanas.map((semana, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5 flex-1">
                {semana.map((dia) => (
                  <div
                    key={dia.fecha}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredCell({
                        fecha: dia.fecha,
                        count: dia.count,
                        x: rect.left + rect.width / 2,
                        y: rect.top
                      });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`h-3 w-full rounded-[3px] transition-all duration-150 cursor-pointer ${getIntensidadClase(
                      dia.count,
                      dia.enFuturo,
                      dia.esHoy
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LEYENDA INFERIOR DE INTENSIDAD */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-2 text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
        <span>Menos activo</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2.5px] bg-slate-900 border border-slate-800" title="0 hábitos" />
          <span className="w-2.5 h-2.5 rounded-[2.5px] bg-emerald-950 border border-emerald-800" title="1 hábito" />
          <span className="w-2.5 h-2.5 rounded-[2.5px] bg-emerald-800" title="2 hábitos" />
          <span className="w-2.5 h-2.5 rounded-[2.5px] bg-emerald-600" title="3 hábitos" />
          <span className="w-2.5 h-2.5 rounded-[2.5px] bg-teal-400" title="4+ hábitos" />
        </div>
        <span>Más activo</span>
      </div>

      {/* TOOLTIP REACTIVO FLOTANTE */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-[#040711] text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-xl border border-slate-700/80 whitespace-nowrap"
          style={{ left: hoveredCell.x, top: hoveredCell.y - 6 }}
        >
          <div className="font-bold text-slate-200">{formatearFechaTooltip(hoveredCell.fecha)}</div>
          <div className="text-emerald-400 font-mono font-medium">
            {hoveredCell.count === 0 ? 'Sin actividades completadas' : `${hoveredCell.count} actividad${hoveredCell.count > 1 ? 'es' : ''} completada${hoveredCell.count > 1 ? 's' : ''}`}
          </div>
        </div>
      )}
    </div>
  );
};
