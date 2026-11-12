import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Play,
  Pause,
  Archive,
  Activity,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  XOctagon,
  ChevronDown,
  type LucideIcon
} from 'lucide-react';

export interface FiltrosPortafolioProps {
  filtroEstado: string;
  setFiltroEstado: (estado: string) => void;
  filtroSalud: string;
  setFiltroSalud: (salud: string) => void;
  filtroOrden: string;
  setFiltroOrden: (orden: string) => void;
}

interface EstadoConfig {
  key: string;
  label: string;
  tooltip: string;
  icon: LucideIcon;
}

interface SaludConfig {
  key: string;
  label: string;
  tooltip: string;
  icon: LucideIcon;
  led: string;
  ring: string;
  ledHex: string;
  text?: string;
}

interface OrdenConfig {
  key: string;
  label: string;
  tooltip: string;
  icon: LucideIcon;
}

const ESTADOS: EstadoConfig[] = [
  { key: '', label: 'Todos', tooltip: 'Ver todos los proyectos', icon: Layers },
  { key: '03_En_Ejecucion', label: 'En Curso', tooltip: 'Proyectos en curso / ejecución', icon: Play },
  { key: '02_Planificado', label: 'Planif.', tooltip: 'Proyectos planificados', icon: Calendar },
  { key: '01_Backlog', label: 'Backlog', tooltip: 'Proyectos en backlog', icon: Archive },
  { key: '04_En_Pausa', label: 'Pausa', tooltip: 'Proyectos en pausa', icon: Pause },
  { key: '06_Cerrado', label: 'Cerrado', tooltip: 'Proyectos cerrados', icon: CheckCircle2 }
];

const OPCIONES_SALUD: SaludConfig[] = [
  {
    key: '',
    label: 'Todas',
    tooltip: 'Todas las condiciones de salud',
    icon: Activity,
    led: 'bg-slate-400',
    ring: 'ring-slate-400/20',
    ledHex: '#94a3b8'
  },
  {
    key: 'En Rango',
    label: 'Saludable',
    tooltip: 'Saludable (En Rango)',
    icon: CheckCircle2,
    led: 'bg-emerald-500',
    ring: 'ring-emerald-500/30',
    ledHex: '#10b981',
    text: 'text-emerald-400'
  },
  {
    key: 'En Riesgo',
    label: 'En Riesgo',
    tooltip: 'En Riesgo / Alerta',
    icon: AlertTriangle,
    led: 'bg-amber-500',
    ring: 'ring-amber-500/30',
    ledHex: '#f59e0b',
    text: 'text-amber-400'
  },
  {
    key: 'Bloqueado',
    label: 'Crítico',
    tooltip: 'Crítico / Bloqueado',
    icon: XOctagon,
    led: 'bg-rose-500',
    ring: 'ring-rose-500/30',
    ledHex: '#f43f5e',
    text: 'text-rose-400'
  }
];

const OPCIONES_ORDEN: OrdenConfig[] = [
  { key: 'avance_desc', label: 'Mayor Avance', tooltip: 'Ordenar por Mayor Avance', icon: TrendingUp },
  { key: 'avance_asc', label: 'Menor Avance', tooltip: 'Ordenar por Menor Avance', icon: TrendingUp },
  { key: 'fecha_asc', label: 'Fecha Fin', tooltip: 'Ordenar por Fecha Fin', icon: Calendar },
  { key: 'presupuesto_desc', label: 'Presupuesto', tooltip: 'Ordenar por Presupuesto Planificado', icon: DollarSign },
  { key: 'gasto_desc', label: 'Gasto AC', tooltip: 'Ordenar por Gasto Real Acumulado', icon: DollarSign },
  { key: 'nombre_asc', label: 'Nombre (A-Z)', tooltip: 'Ordenar por Nombre Alfabético', icon: Layers }
];

export const FiltrosPortafolio: React.FC<FiltrosPortafolioProps> = ({
  filtroEstado,
  setFiltroEstado,
  filtroSalud,
  setFiltroSalud,
  filtroOrden,
  setFiltroOrden
}) => {
  // Estados de popovers animados
  const [openSalud, setOpenSalud] = useState(false);
  const [openOrden, setOpenOrden] = useState(false);

  // Referencias para popovers (click-outside)
  const saludRef = useRef<HTMLDivElement>(null);
  const ordenRef = useRef<HTMLDivElement>(null);

  // Referencias para la pastilla deslizante (Patrón A - Sliding Pill)
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  const activeIndex = Math.max(
    0,
    ESTADOS.findIndex((e) => e.key === filtroEstado)
  );

  // Sincronización milimétrica de la pastilla activa
  useEffect(() => {
    const updatePill = () => {
      const el = itemRefs.current[activeIndex];
      if (el) {
        setPillStyle({
          left: el.offsetLeft,
          width: el.offsetWidth
        });
      }
    };

    updatePill();
    const frameId = requestAnimationFrame(updatePill);

    const observer =
      typeof ResizeObserver !== 'undefined' && containerRef.current
        ? new ResizeObserver(updatePill)
        : null;

    if (observer && containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', updatePill);
    return () => {
      cancelAnimationFrame(frameId);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updatePill);
    };
  }, [activeIndex, filtroEstado]);

  // Manejo de Click Outside para Popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (saludRef.current && !saludRef.current.contains(e.target as Node)) {
        setOpenSalud(false);
      }
      if (ordenRef.current && !ordenRef.current.contains(e.target as Node)) {
        setOpenOrden(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const itemActualSalud =
    OPCIONES_SALUD.find((s) => s.key === filtroSalud) || OPCIONES_SALUD[0];

  const itemActualOrden =
    OPCIONES_ORDEN.find((o) => o.key === filtroOrden) || OPCIONES_ORDEN[0];
  const IconOrden = itemActualOrden.icon;

  return (
    <div className="flex items-center gap-2 flex-wrap" id="filtros-portafolio-container">
      {/* PATRÓN A: SLIDING PILL (ESTADO) */}
      <div className="flex items-center overflow-x-auto no-scrollbar max-w-full py-0.5">
        <div
          ref={containerRef}
          className="h-9 flex items-center rounded-xl bg-[#040711]/70 border border-slate-800/80 p-0.5 relative shrink-0"
          id="sliding-pill-track-estado"
        >
          {/* Pastilla deslizante animada */}
          <div
            className={`absolute top-0.5 bottom-0.5 rounded-lg bg-sky-500/20 border border-sky-500/40 transition-all duration-300 ease-out pointer-events-none ${pillStyle.width > 0 ? 'opacity-100' : 'opacity-0'
              }`}
            style={{
              transform: `translateX(${pillStyle.left}px)`,
              width: `${pillStyle.width}px`
            }}
          />

          {ESTADOS.map((item, idx) => {
            const isSelected =
              (item.key === '' && !filtroEstado) || filtroEstado === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                type="button"
                title={item.tooltip}
                onClick={() => setFiltroEstado(item.key)}
                className={`relative z-10 h-full px-2.5 text-xs font-semibold rounded-lg transition-colors duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none group ${isSelected
                    ? 'text-sky-300'
                    : 'text-slate-400 hover:text-sky-200'
                  }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                <span className="hidden sm:inline-block">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PATRÓN B: ANIMATED POPOVER (SALUD) */}
      <div className="relative" ref={saludRef} id="popover-filtro-salud">
        <button
          type="button"
          onClick={() => setOpenSalud(!openSalud)}
          title={itemActualSalud.tooltip}
          className="h-9 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer bg-[#040711]/70 border border-slate-800/80 text-slate-300 hover:border-sky-500/40 hover:text-white group"
        >
          <span
            className={`w-2 h-2 rounded-full inline-block shrink-0 ${!filtroSalud
                ? 'bg-slate-400'
                : itemActualSalud.led
              }`}
          />
          <span className="hidden sm:inline-block">
            {itemActualSalud.label}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${openSalud ? 'rotate-180' : ''
              }`}
            strokeWidth={1.75}
          />
        </button>

        {openSalud && (
          <div
            className="absolute left-0 top-full mt-1.5 z-50 w-52 max-w-[calc(100vw-24px)] p-1.5 rounded-xl bg-[#0D1526] border border-slate-800/80 backdrop-blur-md shadow-[0_10px_25px_-5px_rgba(2,6,23,0.85)] space-y-1 transition-opacity duration-150 origin-top"
          >
            {OPCIONES_SALUD.map((item) => {
              const isSelected = filtroSalud === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  title={item.tooltip}
                  onClick={() => {
                    setFiltroSalud(item.key);
                    setOpenSalud(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${isSelected
                      ? 'bg-slate-800/80 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${item.led} shrink-0 ${isSelected
                          ? `${item.ring} ring-2`
                          : ''
                        }`}
                    />
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.text || 'text-slate-400'}`} strokeWidth={1.75} />
                    <span className={item.text || ''}>{item.label}</span>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* PATRÓN C: SPRING-BITE (ALCANCE / ORDEN) */}
      <div className="relative" ref={ordenRef} id="popover-filtro-orden">
        <button
          type="button"
          onClick={() => setOpenOrden(!openOrden)}
          title={itemActualOrden.tooltip}
          className="h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-[#040711]/70 border border-slate-800/80 text-slate-300 hover:border-sky-500/40 hover:text-white transition-colors group"
        >
          <IconOrden className="w-3.5 h-3.5 text-sky-400 group-hover:text-sky-300 shrink-0" strokeWidth={1.75} />
          <span className="hidden sm:inline-block">{itemActualOrden.label}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${openOrden ? 'rotate-180' : ''
              }`}
            strokeWidth={1.75}
          />
        </button>

        {openOrden && (
          <div
            className="absolute left-0 top-full mt-1.5 z-50 w-48 max-w-[calc(100vw-24px)] p-1.5 rounded-xl bg-[#0D1526] border border-slate-800/80 backdrop-blur-md shadow-[0_10px_25px_-5px_rgba(2,6,23,0.85)] space-y-1 transition-opacity duration-150 origin-top"
          >
            {OPCIONES_ORDEN.map((o) => {
              const isSelected = filtroOrden === o.key;
              const Icon = o.icon;
              return (
                <button
                  key={o.key}
                  type="button"
                  title={o.tooltip}
                  onClick={() => {
                    setFiltroOrden(o.key);
                    setOpenOrden(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${isSelected
                      ? 'bg-slate-800/80 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                    <span>{o.label}</span>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
