import React from 'react';
import { 
  FolderKanban, 
  Sparkles, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { CanonicalProyecto } from '../../utils/entityNormalizer';

export interface HeaderProyectoActivoProps {
  proyecto: CanonicalProyecto;
  avanceReal: number;
  contadoresTareas?: { total: number; activas: number; completadas: number };
  progresoTemporal?: number | null;
  onDeseleccionar: () => void;
  onVerDetalle360?: (proyectoId: string) => void;
}

export const HeaderProyectoActivo: React.FC<HeaderProyectoActivoProps> = ({
  proyecto,
  avanceReal,
  contadoresTareas,
  progresoTemporal: _progresoTemporal,
  onDeseleccionar,
  onVerDetalle360,
}) => {
  const cpi = typeof proyecto.cpi === 'number' && !isNaN(proyecto.cpi) ? proyecto.cpi : 1.0;
  const spi = typeof proyecto.spi === 'number' && !isNaN(proyecto.spi) ? proyecto.spi : 1.0;

  // Semáforo CPI (Costo: Eficiencia >= 1.0, Riesgo 0.85-0.99, Crítico < 0.85)
  const cpiOptimo = cpi >= 1.0;
  const cpiRiesgo = cpi >= 0.85 && cpi < 1.0;
  const cpiColor = cpiOptimo
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : cpiRiesgo
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  // Semáforo SPI (Cronograma: Adelantado/A tiempo >= 1.0, Desfase 0.85-0.99, Retraso < 0.85)
  const spiOptimo = spi >= 1.0;
  const spiRiesgo = spi >= 0.85 && spi < 1.0;
  const spiColor = spiOptimo
    ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
    : spiRiesgo
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  // Micro-glow superior según salud general
  const saludCritica = (!cpiOptimo && !cpiRiesgo) || (!spiOptimo && !spiRiesgo);
  const saludAlerta = cpiRiesgo || spiRiesgo;
  const acentoGlow = saludCritica
    ? 'from-rose-500/50 via-rose-500/20 to-transparent'
    : saludAlerta
      ? 'from-amber-500/50 via-amber-500/20 to-transparent'
      : 'from-sky-500/40 via-emerald-500/30 to-transparent';

  const tareasActivas = contadoresTareas?.activas ?? 0;
  const tareasTotales = contadoresTareas?.total ?? 0;

  return (
    <div
      id="hud-proyecto-activo"
      className="relative overflow-hidden h-9 px-2.5 rounded-lg bg-[#0D1526]/90 backdrop-blur-xl border border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(2,6,23,0.8),0_0_12px_rgba(56,189,248,0.08)] inline-flex items-center gap-2 shrink-0 transition-colors"
    >
      {/* Micro-glow superior */}
      <div className={`absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r ${acentoGlow}`} />

      {/* BLOQUE IZQUIERDO: Deselección, Ícono, Código y Nombre */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Botón Deseleccionar */}
        <button
          type="button"
          onClick={onDeseleccionar}
          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer active:scale-95 shrink-0"
          title="Deseleccionar proyecto (volver a Vista Global)"
          aria-label="Cerrar filtro de proyecto activo"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>

        {/* Ícono temático */}
        <FolderKanban className="w-3.5 h-3.5 text-sky-400 shrink-0 opacity-90" strokeWidth={1.75} />

        {/* Código Legado */}
        <span className="font-mono font-bold tracking-tight text-[10px] text-sky-300 bg-sky-950/60 border border-sky-500/30 px-1.5 py-0.5 rounded shrink-0 select-none">
          {proyecto.codigo_legado}
        </span>

        {/* Nombre del Proyecto */}
        <span
          className="font-semibold text-slate-100 text-xs tracking-tight truncate max-w-[130px] lg:max-w-[200px]"
          title={proyecto.nombre}
        >
          {proyecto.nombre}
        </span>

        {/* Botón Vista 360° */}
        {onVerDetalle360 && (
          <button
            type="button"
            onClick={() => onVerDetalle360(proyecto.id)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-500/50 transition-colors cursor-pointer active:scale-95 shrink-0 ml-0.5"
            title="Abrir Vista 360° del Proyecto"
          >
            <Sparkles className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
            <span className="hidden sm:inline">360°</span>
          </button>
        )}
      </div>

      {/* Separador vertical sutil */}
      <div className="h-4 w-px bg-slate-800/80 shrink-0" />

      {/* BLOQUE DERECHO: Progreso Físico, CPI y SPI */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Micro-Gauge de Avance Físico */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800/80 text-[10px]"
          title={`Avance físico: ${avanceReal}% · Tareas: ${tareasActivas} activas / ${tareasTotales} totales`}
        >
          <span className="text-slate-400 text-[9px] font-medium">Avance</span>
          <span className="font-mono tabular-nums font-bold text-sky-300">
            {avanceReal}%
          </span>
          <div className="w-10 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shrink-0">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, avanceReal))}%` }}
            />
          </div>
        </div>

        {/* Badge CPI (Cost Performance Index) */}
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono tabular-nums text-[10px] border transition-colors ${cpiColor}`}
          title={`Índice de Rendimiento de Costos (CPI = EV/AC): ${cpi.toFixed(2)}. ${cpiOptimo ? 'Eficiencia favorable' : 'Sobrecosto detectado'}`}
        >
          <span className="text-[9px] text-slate-400 font-bold uppercase">CPI</span>
          <span className="font-bold">{cpi.toFixed(2)}</span>
          {cpiOptimo ? (
            <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" strokeWidth={2} />
          ) : (
            <TrendingDown className="w-3 h-3 text-rose-400 shrink-0" strokeWidth={2} />
          )}
        </div>

        {/* Badge SPI (Schedule Performance Index) */}
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono tabular-nums text-[10px] border transition-colors ${spiColor}`}
          title={`Índice de Rendimiento del Cronograma (SPI = EV/PV): ${spi.toFixed(2)}. ${spiOptimo ? 'A tiempo o adelantado' : 'Retraso en cronograma'}`}
        >
          <span className="text-[9px] text-slate-400 font-bold uppercase">SPI</span>
          <span className="font-bold">{spi.toFixed(2)}</span>
          {spiOptimo ? (
            <Clock className="w-3 h-3 text-sky-400 shrink-0" strokeWidth={2} />
          ) : (
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" strokeWidth={2} />
          )}
        </div>
      </div>
    </div>
  );
};

