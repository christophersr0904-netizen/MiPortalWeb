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

export type SubFiltroRapido = 'FIJADAS' | 'ADJUNTOS' | 'VINCULADAS' | 'CHECKLIST' | 'WISHLIST';

export interface SidebarCuadernosProps {
  blockActivo: string | null;
  setBlockActivo: (block: string | null) => void;
  bloquesUnicos: string[];
  conteoPorBlock: Record<string, number>;
  subFiltros?: SubFiltroRapido[];
  onToggleSubFiltro?: (filtro: SubFiltroRapido) => void;
  subFiltro?: SubFiltroRapido | '' | SubFiltroRapido[];
  setSubFiltro?: (filtro: any) => void;
  cuadernosMeta: Record<string, CuadernoMeta>;
  onAbrirModalCrear: () => void;
  onEliminarCuaderno?: (nombreBlock: string) => void;
  onMoverNotaACuaderno?: (notaId: string, destinoBlock: string) => Promise<void> | void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SidebarCuadernos: React.FC<SidebarCuadernosProps> = ({
  blockActivo,
  setBlockActivo,
  bloquesUnicos,
  conteoPorBlock,
  subFiltros,
  onToggleSubFiltro,
  subFiltro,
  setSubFiltro,
  cuadernosMeta,
  onAbrirModalCrear,
  onEliminarCuaderno,
  onMoverNotaACuaderno,
  isCollapsed: propIsCollapsed,
  onToggleCollapse
}) => {
  const filtrosActivos: SubFiltroRapido[] = Array.isArray(subFiltros)
    ? subFiltros
    : Array.isArray(subFiltro)
    ? (subFiltro as SubFiltroRapido[])
    : subFiltro && (subFiltro as unknown as string) !== ''
    ? [subFiltro as SubFiltroRapido]
    : [];

  const handleToggleFiltro = (filtro: SubFiltroRapido) => {
    if (onToggleSubFiltro) {
      onToggleSubFiltro(filtro);
    } else if (setSubFiltro) {
      if (filtrosActivos.includes(filtro)) {
        setSubFiltro('');
      } else {
        setSubFiltro(filtro);
      }
    }
  };
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

  // Estado y manejadores de Drag and Drop para soltar notas en cuadernos
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    if (
      e.dataTransfer.types.includes('application/x-miportal-nota-id') ||
      e.dataTransfer.types.includes('text/plain')
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverTarget !== targetId) {
        setDragOverTarget(targetId);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      if (dragOverTarget === targetId) {
        setDragOverTarget(null);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, destinoBlock: string) => {
    e.preventDefault();
    setDragOverTarget(null);
    const notaId =
      e.dataTransfer.getData('application/x-miportal-nota-id') ||
      e.dataTransfer.getData('text/plain');
    if (!notaId) return;

    if (onMoverNotaACuaderno) {
      await onMoverNotaACuaderno(notaId, destinoBlock);
    }
  };

  return (
    <aside
      id="sidebar-blocks-notas"
      className={`hidden md:flex flex-col shrink-0 h-full bg-[#080D1A] border-r border-slate-800/60 justify-between overflow-y-auto custom-scrollbar select-none spring-sidebar ${
        isCollapsed ? 'w-16 p-2' : 'w-64 p-3'
      }`}
    >
      <div className="space-y-4">
        {/* Cabecera de Blocks & Control de Colapso */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 min-w-0">
                <BookOpen className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
                <span className="truncate whitespace-nowrap transition-opacity duration-150">Blocks & Cuadernos</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  id="btn-crear-nuevo-block"
                  onClick={onAbrirModalCrear}
                  className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 transition-all duration-150 active:scale-90 cursor-pointer"
                  title="Crear Nuevo Cuaderno"
                >
                  <FolderPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  id="btn-colapsar-sidebar"
                  onClick={toggleCollapse}
                  className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-all duration-150 active:scale-90 cursor-pointer"
                  title="Colapsar menú lateral"
                >
                  <ChevronLeft className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] rotate-0" strokeWidth={1.75} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full">
              <button
                type="button"
                id="btn-expandir-sidebar"
                onClick={toggleCollapse}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 border border-slate-700/60 transition-all duration-150 active:scale-90 cursor-pointer"
                title="Expandir menú lateral"
              >
                <ChevronLeft className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] rotate-180" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={onAbrirModalCrear}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 transition-all duration-150 active:scale-90 cursor-pointer"
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
            } rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer ${
              blockActivo === null
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'min-w-0'}`}>
              <Layers className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
              {!isCollapsed && <span className="truncate whitespace-nowrap transition-opacity duration-150">Todas las Notas</span>}
            </div>
            {!isCollapsed && (
              <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 shrink-0">
                {conteoPorBlock.__todas__ || 0}
              </span>
            )}
          </button>

          {/* Notas Sueltas */}
          <button
            type="button"
            onClick={() => setBlockActivo('__sin_block__')}
            onDragOver={(e) => handleDragOver(e, '__sin_block__')}
            onDragLeave={(e) => handleDragLeave(e, '__sin_block__')}
            onDrop={(e) => handleDrop(e, '__sin_block__')}
            title={isCollapsed ? `Notas Sueltas (${conteoPorBlock.__sin_block__ || 0})` : undefined}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer relative ${
              dragOverTarget === '__sin_block__'
                ? 'bg-sky-950/70 border-2 border-sky-400 border-dashed scale-[1.03] shadow-[0_0_20px_rgba(56,189,248,0.45)] ring-2 ring-sky-400/50 text-sky-200'
                : blockActivo === '__sin_block__'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <div className={`flex items-center gap-2.5 pointer-events-none ${isCollapsed ? 'justify-center' : 'min-w-0'}`}>
              <FileText className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
              {!isCollapsed && <span className="truncate whitespace-nowrap transition-opacity duration-150">Notas Sueltas</span>}
            </div>
            {!isCollapsed && (
              <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 shrink-0 pointer-events-none">
                {conteoPorBlock.__sin_block__ || 0}
              </span>
            )}
            {/* Tooltip Bento flotante al arrastrar en modo colapsado */}
            {isCollapsed && dragOverTarget === '__sin_block__' && (
              <div className="absolute left-full ml-2.5 px-3 py-1.5 rounded-xl bg-[#0D1526] border border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.35)] text-xs text-sky-200 font-bold whitespace-nowrap z-50 pointer-events-none flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                <span>Mover a Notas Sueltas</span>
              </div>
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
              const isDragOver = dragOverTarget === block;
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
                  onDragOver={(e) => handleDragOver(e, block)}
                  onDragLeave={(e) => handleDragLeave(e, block)}
                  onDrop={(e) => handleDrop(e, block)}
                  title={tooltipTexto}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-1.5'
                  } rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer group relative ${
                    isDragOver
                      ? 'bg-sky-950/80 border-2 border-sky-400 border-dashed scale-[1.03] shadow-[0_0_20px_rgba(56,189,248,0.5)] ring-2 ring-sky-400/50 z-20 text-sky-200'
                      : activo
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40 shadow-xs font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-sky-400 before:rounded-r before:shadow-[0_0_12px_#38bdf8]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className={`flex items-center gap-2 pointer-events-none ${isCollapsed ? 'justify-center' : 'min-w-0'}`}>
                    <IconoComponent
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                        isDragOver ? 'scale-125 text-sky-300' : activo ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'
                      }`}
                      strokeWidth={1.75}
                    />
                    {!isCollapsed && <span className="truncate whitespace-nowrap transition-opacity duration-150">{block}</span>}
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`font-mono tabular-nums text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-900/80 text-slate-400 pointer-events-none ${
                          onEliminarCuaderno && !isDragOver ? 'group-hover:hidden' : ''
                        }`}
                      >
                        {total}
                      </span>
                      {onEliminarCuaderno && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEliminarCuaderno(block);
                          }}
                          title={`Eliminar cuaderno "${block}"`}
                          className="hidden group-hover:flex items-center justify-center p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer pointer-events-auto not-draggable"
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  )}
                  {/* Tooltip Bento flotante al arrastrar en modo colapsado */}
                  {isCollapsed && isDragOver && (
                    <div className="absolute left-full ml-2.5 px-3 py-1.5 rounded-xl bg-[#0D1526] border border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.35)] text-xs text-sky-200 font-bold whitespace-nowrap z-50 pointer-events-none flex items-center gap-1.5">
                      <IconoComponent className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                      <span>Mover a {block}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Flanco Inferior: Accesos Rápidos Elásticos Multi-Select */}
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
            onClick={() => handleToggleFiltro('FIJADAS')}
            title="Fijadas"
            className={`p-2 rounded-xl text-left border flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/50 hover:border-slate-700/60 transition-all duration-150 active:scale-95 ${
              isCollapsed ? 'justify-center w-full' : ''
            } ${
              filtrosActivos.includes('FIJADAS')
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pin className="w-3.5 h-3.5 rotate-45 text-amber-400 shrink-0" strokeWidth={1.75} />
            {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-150">Fijadas</span>}
          </button>

          {/* 2. Tareas */}
          <button
            type="button"
            onClick={() => handleToggleFiltro('CHECKLIST')}
            title="Tareas"
            className={`p-2 rounded-xl text-left border flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/50 hover:border-slate-700/60 transition-all duration-150 active:scale-95 ${
              isCollapsed ? 'justify-center w-full' : ''
            } ${
              filtrosActivos.includes('CHECKLIST')
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
            {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-150">Tareas</span>}
          </button>

          {/* 3. Deseos */}
          <button
            type="button"
            onClick={() => handleToggleFiltro('WISHLIST')}
            title="Deseos"
            className={`p-2 rounded-xl text-left border flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/50 hover:border-slate-700/60 transition-all duration-150 active:scale-95 ${
              isCollapsed ? 'justify-center w-full' : ''
            } ${
              filtrosActivos.includes('WISHLIST')
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-purple-400 shrink-0" strokeWidth={1.75} />
            {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-150">Deseos</span>}
          </button>

          {/* 4. Vínculos */}
          <button
            type="button"
            onClick={() => handleToggleFiltro('VINCULADAS')}
            title="Vínculos"
            className={`p-2 rounded-xl text-left border flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/50 hover:border-slate-700/60 transition-all duration-150 active:scale-95 ${
              isCollapsed ? 'justify-center w-full' : ''
            } ${
              filtrosActivos.includes('VINCULADAS')
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.75} />
            {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-150">Vínculos</span>}
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
    <div className="md:hidden shrink-0 bg-[#0D1526] border-b border-slate-800/40 px-2.5 py-1 flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden snap-x select-none overscroll-contain h-9">
      <button
        type="button"
        onClick={() => setBlockActivo(null)}
        className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 snap-start ${
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
        className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 snap-start ${
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
            className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 snap-start ${
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
        className="h-7 px-2 rounded-lg text-[11px] font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0 snap-start"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Block</span>
      </button>
    </div>
  );
};

