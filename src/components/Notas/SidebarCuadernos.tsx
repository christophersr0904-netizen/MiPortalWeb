import React, { useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Code,
  Sparkles,
  Heart,
  Bookmark,
  Compass,
  Folder,
  Terminal,
  Coffee,
  Target,
  Archive,
  Layers,
  FileText,
  Pin,
  CheckSquare,
  DollarSign,
  Link2,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  type LucideIcon
} from 'lucide-react';
import type { CuadernoMeta } from '../../types';

// Diccionario de resolución de íconos Lucide para Cuadernos
export const MAPA_ICONOS_CUADERNO: Record<string, LucideIcon> = {
  Folder,
  BookOpen,
  Briefcase,
  Code,
  Terminal,
  Sparkles,
  Target,
  Bookmark,
  Compass,
  Heart,
  Coffee,
  Archive
};

export function resolverIconoCuaderno(nombreIcono?: string): LucideIcon {
  if (!nombreIcono) return Folder;
  return MAPA_ICONOS_CUADERNO[nombreIcono] || Folder;
}

export type SubFiltroRapido = '' | 'FIJADAS' | 'ADJUNTOS' | 'VINCULADAS' | 'CHECKLIST' | 'WISHLIST';

export interface SidebarCuadernosProps {
  blockActivo: string | null;
  setBlockActivo: (block: string | null) => void;
  bloquesUnicos: string[];
  conteoPorBlock: Record<string, number>;
  subFiltro: SubFiltroRapido;
  setSubFiltro: (filtro: SubFiltroRapido) => void;
  cuadernosMeta: Record<string, CuadernoMeta>;
  onAbrirModalCrear: () => void;
  onEliminarCuaderno?: (nombreBlock: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SidebarCuadernos: React.FC<SidebarCuadernosProps> = ({
  blockActivo,
  setBlockActivo,
  bloquesUnicos,
  conteoPorBlock,
  subFiltro,
  setSubFiltro,
  cuadernosMeta,
  onAbrirModalCrear,
  onEliminarCuaderno,
  isCollapsed: propIsCollapsed,
  onToggleCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pmo_notas_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('pmo_notas_sidebar_collapsed', String(next));
        } catch {
          // ignore storage error
        }
        return next;
      });
    }
  };

  return (
    <aside
      id="sidebar-blocks-notas"
      className="hidden md:flex flex-col shrink-0 w-full h-full bg-[#0D1526]/90 border-r border-slate-800/40 p-3 justify-between overflow-y-auto custom-scrollbar select-none"
    >
      <div className="space-y-4">
        {/* Cabecera de Blocks & Control de Colapso */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <BookOpen className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
                <span className="truncate">Blocks & Cuadernos</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="btn-crear-nuevo-block"
                  onClick={onAbrirModalCrear}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 transition cursor-pointer"
                  title="Crear Nuevo Cuaderno"
                >
                  <FolderPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  id="btn-colapsar-sidebar"
                  onClick={toggleCollapse}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition cursor-pointer"
                  title="Colapsar menú lateral"
                >
                  <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full">
              <button
                type="button"
                id="btn-expandir-sidebar"
                onClick={toggleCollapse}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 border border-slate-700/60 transition cursor-pointer"
                title="Expandir menú lateral"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={onAbrirModalCrear}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 transition cursor-pointer"
                title="Crear Nuevo Cuaderno"
              >
                <FolderPlus className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          )}
        </div>

        {/* Navegación Canónica (Todas las Notas / Notas Sueltas) */}
        <nav className="space-y-1">
          {/* Todas las Notas */}
          <button
            type="button"
            onClick={() => setBlockActivo(null)}
            title={isCollapsed ? `Todas las Notas (${conteoPorBlock.__todas__ || 0})` : undefined}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } rounded-xl text-xs font-semibold transition cursor-pointer ${
              blockActivo === null
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
              <Layers className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
              {!isCollapsed && <span className="truncate">Todas las Notas</span>}
            </div>
            {!isCollapsed && (
              <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {conteoPorBlock.__todas__ || 0}
              </span>
            )}
          </button>

          {/* Notas Sueltas */}
          <button
            type="button"
            onClick={() => setBlockActivo('__sin_block__')}
            title={isCollapsed ? `Notas Sueltas (${conteoPorBlock.__sin_block__ || 0})` : undefined}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } rounded-xl text-xs font-semibold transition cursor-pointer ${
              blockActivo === '__sin_block__'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
              <FileText className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={1.75} />
              {!isCollapsed && <span className="truncate">Notas Sueltas</span>}
            </div>
            {!isCollapsed && (
              <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {conteoPorBlock.__sin_block__ || 0}
              </span>
            )}
          </button>
        </nav>

        {/* Lista de Cuadernos Temáticos */}
        <div className="pt-2 border-t border-slate-800/60 space-y-1">
          {!isCollapsed && (
            <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Cuadernos Temáticos</span>
              <span className="font-mono">{bloquesUnicos.length}</span>
            </div>
          )}

          <div
            className={`space-y-0.5 overflow-y-auto custom-scrollbar ${
              isCollapsed ? 'max-h-80 pr-0' : 'max-h-56 pr-1'
            }`}
          >
            {bloquesUnicos.map((block) => {
              const activo = blockActivo === block;
              const total = conteoPorBlock[block] || 0;
              const meta = cuadernosMeta[block];
              const IconoComponent = resolverIconoCuaderno(meta?.icono);
              const tooltipTexto = `${block} (${total})${meta?.descripcion ? ` • ${meta.descripcion}` : ''}`;

              return (
                <div
                  key={block}
                  role="button"
                  tabIndex={0}
                  onClick={() => setBlockActivo(activo ? null : block)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setBlockActivo(activo ? null : block);
                    }
                  }}
                  title={tooltipTexto}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-1.5'
                  } rounded-xl text-xs font-medium transition cursor-pointer group relative ${
                    activo
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40 shadow-xs font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-sky-400 before:rounded-r before:shadow-[0_0_12px_#38bdf8]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'truncate'}`}>
                    <IconoComponent
                      className={`w-3.5 h-3.5 shrink-0 ${
                        activo ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                      strokeWidth={1.75}
                    />
                    {!isCollapsed && <span className="truncate">{block}</span>}
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`font-mono tabular-nums text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-900/80 text-slate-400 ${
                          onEliminarCuaderno ? 'group-hover:hidden' : ''
                        }`}
                      >
                        {total}
                      </span>
                      {onEliminarCuaderno && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Eliminar el cuaderno "${block}"? Las notas pasarán a Notas Sueltas.`)) {
                              onEliminarCuaderno(block);
                            }
                          }}
                          title={`Eliminar cuaderno "${block}"`}
                          className="hidden group-hover:flex items-center justify-center p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Flanco Inferior: Accesos Rápidos Elásticos */}
      <div className="pt-3 border-t border-slate-800/60 space-y-2">
        {!isCollapsed && (
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Accesos Rápidos
          </span>
        )}
        <div
          className={`${
            isCollapsed ? 'flex flex-col items-center gap-1.5' : 'grid grid-cols-2 gap-1.5'
          } text-xs`}
        >
          {/* 1. Fijadas */}
          <button
            type="button"
            onClick={() => setSubFiltro(subFiltro === 'FIJADAS' ? '' : 'FIJADAS')}
            title="Fijadas"
            className={`p-2 rounded-xl text-left border flex items-center gap-1.5 cursor-pointer active:scale-[0.96] hover:scale-[1.02] hover:bg-slate-800/50 hover:border-slate-700/60 transition-all duration-200 ${
              isCollapsed ? 'justify-center w-full' : ''
            } ${
              subFiltro === 'FIJADAS'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pin className="w-3.5 h-3.5 rotate-45 text-amber-400 shrink-0" strokeWidth={1.75} />
            {!isCollapsed && <span>Fijadas</span>}
          </button>

          {/* 2. Tareas */}
          <button
            type="button"
            onClick={() => setSubFiltro(subFiltro === 'CHECKLIST' ? '' : 'CHECKLIST')}
            title="Tareas"
            className={`p-2 rounded-xl text-left border flex items-center gap-1.5 cursor-pointer active:scale-[0.96] hover:scale-[1.02] hover:bg-slate-800/50 hover:border-slate-700/60 transition-all duration-200 ${
              isCollapsed ? 'justify-center w-full' : ''
            } ${
              subFiltro === 'CHECKLIST'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
            {!isCollapsed && <span>Tareas</span>}
          </button>

          {/* 3. Deseos */}
          <button
            type="button"
            onClick={() => setSubFiltro(subFiltro === 'WISHLIST' ? '' : 'WISHLIST')}
            title="Deseos"
            className={`p-2 rounded-xl text-left border flex items-center gap-1.5 cursor-pointer active:scale-[0.96] hover:scale-[1.02] hover:bg-slate-800/50 hover:border-slate-700/60 transition-all duration-200 ${
              isCollapsed ? 'justify-center w-full' : ''
            } ${
              subFiltro === 'WISHLIST'
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-purple-400 shrink-0" strokeWidth={1.75} />
            {!isCollapsed && <span>Deseos</span>}
          </button>

          {/* 4. Vínculos */}
          <button
            type="button"
            onClick={() => setSubFiltro(subFiltro === 'VINCULADAS' ? '' : 'VINCULADAS')}
            title="Vínculos"
            className={`p-2 rounded-xl text-left border flex items-center gap-1.5 cursor-pointer active:scale-[0.96] hover:scale-[1.02] hover:bg-slate-800/50 hover:border-slate-700/60 transition-all duration-200 ${
              isCollapsed ? 'justify-center w-full' : ''
            } ${
              subFiltro === 'VINCULADAS'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.75} />
            {!isCollapsed && <span>Vínculos</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export interface CarruselCuadernosMovilProps {
  blockActivo: string | null;
  setBlockActivo: (block: string | null) => void;
  bloquesUnicos: string[];
  conteoPorBlock: Record<string, number>;
  cuadernosMeta: Record<string, CuadernoMeta>;
  onAbrirModalCrear: () => void;
}

export const CarruselCuadernosMovil: React.FC<CarruselCuadernosMovilProps> = ({
  blockActivo,
  setBlockActivo,
  bloquesUnicos,
  conteoPorBlock,
  cuadernosMeta,
  onAbrirModalCrear
}) => {
  return (
    <div className="md:hidden shrink-0 bg-[#0D1526] border-b border-slate-800/40 px-3 py-2 flex items-center gap-1.5 overflow-x-auto custom-scrollbar select-none">
      <button
        type="button"
        onClick={() => setBlockActivo(null)}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
          blockActivo === null
            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
            : 'text-slate-400 bg-slate-900 border border-slate-800'
        }`}
      >
        <Layers className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Todas</span>
      </button>
      <button
        type="button"
        onClick={() => setBlockActivo('__sin_block__')}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
          blockActivo === '__sin_block__'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : 'text-slate-400 bg-slate-900 border border-slate-800'
        }`}
      >
        <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Sueltas</span>
      </button>
      {bloquesUnicos.map((b) => {
        const meta = cuadernosMeta[b];
        const IconoComponent = resolverIconoCuaderno(meta?.icono);
        const activo = blockActivo === b;
        return (
          <button
            key={b}
            type="button"
            onClick={() => setBlockActivo(activo ? null : b)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activo
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 bg-slate-900 border border-slate-800'
            }`}
          >
            <IconoComponent className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{b}</span>
            <span className="font-mono text-[10px] text-slate-500">
              ({conteoPorBlock[b] || 0})
            </span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAbrirModalCrear}
        className="px-2 py-1 rounded-lg text-xs font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 whitespace-nowrap flex items-center gap-1 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Block</span>
      </button>
    </div>
  );
};

