import React from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Crown,
  Gem,
  ExternalLink,
  AlertOctagon
} from 'lucide-react';

export interface TooltipGridItem {
  label: string;
  valor: string;
  icono?: string;
}

export interface TooltipInfo {
  x: number;
  y: number;
  tipo: 'PROYECTO' | 'FASE' | 'WBS' | 'TAREA' | 'GASTO' | 'INGRESO';
  id: string;
  codigo?: string;
  titulo: string;
  descripcion?: string;
  esCritica?: boolean;
  salud?: {
    texto: string;
    esVencida?: boolean;
    esOk?: boolean;
    esRiesgo?: boolean;
    esCritico?: boolean;
  };
  gridItems?: TooltipGridItem[];
  predecesora?: string;
  badgeExtra?: string;
  comprobanteUrl?: string;
}

export interface TooltipFlotanteWBSProps {
  info: TooltipInfo | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const TooltipFlotanteWBS: React.FC<TooltipFlotanteWBSProps> = ({
  info,
  onMouseEnter,
  onMouseLeave
}) => {
  if (!info) return null;

  const {
    x,
    y,
    tipo,
    id,
    codigo = id,
    titulo,
    descripcion,
    esCritica,
    salud,
    gridItems = [],
    predecesora,
    badgeExtra,
    comprobanteUrl
  } = info;

  // Prevenir desborde del tooltip respecto a los límites de la pantalla/canvas
  const tooltipWidth = 320;
  const tooltipHeight = 240;
  let posX = x + 16;
  let posY = y + 16;

  if (typeof window !== 'undefined') {
    if (posX + tooltipWidth > window.innerWidth - 24) {
      posX = Math.max(12, x - tooltipWidth - 16);
    }
    if (posY + tooltipHeight > window.innerHeight - 24) {
      posY = Math.max(12, y - tooltipHeight - 16);
    }
  }

  return (
    <div
      style={{ left: `${posX}px`, top: `${posY}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute z-[9999] pointer-events-auto transition-all duration-150 transform max-w-sm w-80 bg-[#0D1526]/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-3.5 text-xs text-slate-200 select-none animate-in fade-in zoom-in-95"
    >
      <div className="space-y-2.5">
        {/* Encabezado: Badge ID + Badges Semánticos + Estado de Salud */}
        <div className="flex items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[10px] font-extrabold bg-slate-950 text-white px-2 py-0.5 rounded border border-slate-800 shadow-2xs">
              {codigo}
            </span>

            {tipo === 'PROYECTO' && (
              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> Matriz
              </span>
            )}

            {tipo === 'FASE' && (
              <span className="text-[9px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Layers className="w-2.5 h-2.5" /> Fase
              </span>
            )}

            {tipo === 'WBS' && (
              <span className="text-[9px] font-bold text-sky-300 bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Gem className="w-2.5 h-2.5 text-sky-400" /> Entregable
              </span>
            )}

            {esCritica && (
              <span className="text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/50 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Crítica
              </span>
            )}

            {badgeExtra && (
              <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                {badgeExtra}
              </span>
            )}
          </div>

          {/* Badge de salud semafórico */}
          {salud && (
            <div className="shrink-0">
              {salud.esVencida && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-rose-500/15 text-rose-300 border-rose-500/40 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-rose-400" /> {salud.texto || 'Vencida'}
                </span>
              )}
              {salud.esOk && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> {salud.texto || 'A tiempo'}
                </span>
              )}
              {salud.esRiesgo && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/40 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400" /> {salud.texto || 'Riesgo'}
                </span>
              )}
              {salud.esCritico && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-rose-500/20 text-rose-300 border-rose-500/50 flex items-center gap-1">
                  <AlertOctagon className="w-2.5 h-2.5 text-rose-400" /> {salud.texto || 'Crítico'}
                </span>
              )}
              {!salud.esVencida && !salud.esOk && !salud.esRiesgo && !salud.esCritico && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                  {salud.texto}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Título */}
        <h4
          className="font-bold text-sm text-slate-100 leading-snug line-clamp-2"
          title={titulo}
        >
          {titulo}
        </h4>

        {/* Descripción en cursiva */}
        {descripcion && (
          <p className="text-xs text-slate-400 italic leading-snug line-clamp-2">
            {descripcion}
          </p>
        )}

        {/* Cuadrícula 2x2 en container oscuro */}
        {gridItems.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-[10.5px] bg-[#070C18]/90 p-2.5 rounded-xl border border-slate-800/80 shadow-inner">
            {gridItems.map((item, i) => (
              <div key={i} className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold truncate mb-0.5">
                  {item.icono ? `${item.icono} ` : ''}{item.label}
                </span>
                <span className="font-mono text-slate-200 font-bold tabular-nums text-xs truncate">
                  {item.valor}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Píldora inferior de predecesoras */}
        {predecesora && (
          <div className="text-[9.5px] text-indigo-300 font-mono font-bold bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/60 flex items-center gap-1.5 truncate">
            <span className="shrink-0">⛓️ Predecesora:</span>
            <span className="text-indigo-200 truncate">{predecesora}</span>
          </div>
        )}

        {/* Enlace de comprobante si existe */}
        {comprobanteUrl && (
          <div className="pt-0.5">
            <a
              href={comprobanteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition shadow-2xs"
            >
              <ExternalLink className="w-2.5 h-2.5" /> Abrir Recibo en Google Drive
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
