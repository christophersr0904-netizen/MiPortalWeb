import React from 'react';
import { CATEGORIAS_VIDA_MAP, type CategoriaVida } from '../../../types';
import { PieChart } from 'lucide-react';

interface RadarBalanceVidaProps {
  pilarCounts: Record<CategoriaVida, number>;
}

const ORDEN_PILARES: CategoriaVida[] = [
  'SALUD_DEPORTE',
  'DESARROLLO_ESTUDIO',
  'LABORAL_HONORARIO',
  'FINANZAS_TRAMITES',
  'SOCIAL_FAMILIA',
  'PERSONAL_DESCANSO'
];

export const RadarBalanceVida: React.FC<RadarBalanceVidaProps> = ({ pilarCounts }) => {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  // Parámetros geométricos SVG
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 95;
  const totalVertices = ORDEN_PILARES.length;

  // Encontrar valor máximo para normalización
  const countsArray = ORDEN_PILARES.map((cat) => pilarCounts[cat] || 0);
  const maxVal = Math.max(1, ...countsArray);

  // Coordenadas angulares: 6 vértices a 60 grados iniciando en la cúspide (-90 deg / -PI/2)
  const getCoordinates = (index: number, radius: number) => {
    const angle = (index * (2 * Math.PI)) / totalVertices - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  };

  // Puntos del polígono de datos
  const dataPoints = ORDEN_PILARES.map((cat, idx) => {
    const val = pilarCounts[cat] || 0;
    // Ratio mínimo de 0.15 para que sea visible incluso con 0
    const ratio = Math.max(0.12, val / maxVal);
    return getCoordinates(idx, ratio * maxR);
  });

  const polygonPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  // Niveles concéntricos de referencia (25%, 50%, 75%, 100%)
  const niveles = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="portal-surface bg-white dark:bg-[#0D1526] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between h-full">
      {/* CABECERA WIDGET */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-400">
            <PieChart className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Balance de Vida (6 Dimensiones)
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Distribución holística del desarrollo personal
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono tabular-nums">
          {Object.values(pilarCounts).filter((c) => c > 0).length} / 6 activas
        </span>
      </div>

      {/* CANVAS RADAR SVG INTERACTIVO */}
      <div className="flex-1 flex items-center justify-center relative py-2">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[280px] sm:max-w-[310px] h-auto overflow-visible"
        >
          <defs>
            <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* Grillas poligonales concéntricas */}
          {niveles.map((lvl) => {
            const nivelPts = ORDEN_PILARES.map((_, i) => getCoordinates(i, lvl * maxR));
            const path = nivelPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
            return (
              <path
                key={lvl}
                d={path}
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-800/80"
                strokeWidth="1"
                strokeDasharray={lvl === 1.0 ? 'none' : '3,3'}
              />
            );
          })}

          {/* Ejes radiales desde el centro */}
          {ORDEN_PILARES.map((_, idx) => {
            const end = getCoordinates(idx, maxR);
            return (
              <line
                key={idx}
                x1={cx}
                y1={cy}
                x2={end.x}
                y2={end.y}
                className="stroke-slate-200 dark:stroke-slate-800/80"
                strokeWidth="1"
              />
            );
          })}

          {/* Polígono de datos del usuario */}
          <path
            d={polygonPath}
            fill="url(#radarFillGrad)"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />

          {/* Vértices interactivos y etiquetas */}
          {ORDEN_PILARES.map((cat, idx) => {
            const pt = dataPoints[idx];
            const cfg = CATEGORIAS_VIDA_MAP[cat];
            const count = pilarCounts[cat] || 0;
            const isHovered = hoveredIdx === idx;
            // Coordenada para el texto exterior
            const labelCoord = getCoordinates(idx, maxR + 24);

            return (
              <g
                key={cat}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Punto en el polígono */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  className="fill-emerald-400 stroke-[#0D1526] transition-all duration-200"
                  strokeWidth="2"
                />

                {/* Micro-etiqueta exterior */}
                <text
                  x={labelCoord.x}
                  y={labelCoord.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-[9.5px] font-semibold transition-colors duration-200 ${
                    isHovered
                      ? 'fill-sky-300 font-bold'
                      : 'fill-slate-600 dark:fill-slate-400'
                  }`}
                >
                  {cfg ? cfg.nombre.split(' ')[0] : cat}
                </text>
                <text
                  x={labelCoord.x}
                  y={labelCoord.y + 11}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[8.5px] font-mono font-bold fill-slate-400 dark:fill-slate-500"
                >
                  ({count})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* LEYENDA INFERIOR DE 6 PILARES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60 shrink-0">
        {ORDEN_PILARES.map((cat) => {
          const cfg = CATEGORIAS_VIDA_MAP[cat];
          const count = pilarCounts[cat] || 0;
          return (
            <div
              key={cat}
              className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/40 text-[10.5px]"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className={`w-2 h-2 rounded-full shrink-0 ${cfg ? cfg.colorBarra : 'bg-slate-400'}`} />
                <span className="text-slate-600 dark:text-slate-300 truncate font-medium">
                  {cfg ? cfg.nombre : cat}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums ml-1">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
