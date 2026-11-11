import React, { memo, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import type { NotaRecord, VinculoEntidad } from '../../types';
import { db } from '../../db/db';
import { serializarNotaATextoPlano } from '../../utils/entityNormalizer';
import { toastCobalt } from '../../utils/toastCobalt';
import {
  Pin,
  CheckSquare,
  Square,
  DollarSign,
  Link2,
  Trash2,
  Edit3,
  ExternalLink,
  ArrowUpRight,
  BookOpen,
  Activity,
  Briefcase,
  Copy,
  Check,
  Clock
} from 'lucide-react';

export interface TarjetaNotaProps {
  nota: NotaRecord;
  onEditar: (nota: NotaRecord) => void;
  onEliminar: (id: string) => void;
  onAbrirEntidad?: (vinculo: VinculoEntidad) => void;
  onConvertirEnGasto?: (nota: NotaRecord) => void;
  modoVista?: 'masonry' | 'lista';
}

// 16 Tonos Tailwind Canónicos
const PALETA_COLORES: Record<string, { card: string; border: string; badge: string; dot: string }> = {
  slate: {
    card: 'bg-slate-900/80 hover:bg-slate-900',
    border: 'border-slate-700/80 hover:border-slate-600',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    dot: 'bg-slate-500'
  },
  red: {
    card: 'bg-red-950/25 hover:bg-red-950/40',
    border: 'border-red-500/40 hover:border-red-500/60',
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
    dot: 'bg-red-500'
  },
  orange: {
    card: 'bg-orange-950/25 hover:bg-orange-950/40',
    border: 'border-orange-500/40 hover:border-orange-500/60',
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dot: 'bg-orange-500'
  },
  amber: {
    card: 'bg-amber-950/25 hover:bg-amber-950/40',
    border: 'border-amber-500/40 hover:border-amber-500/60',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500'
  },
  yellow: {
    card: 'bg-yellow-950/25 hover:bg-yellow-950/40',
    border: 'border-yellow-500/40 hover:border-yellow-500/60',
    badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    dot: 'bg-yellow-400'
  },
  lime: {
    card: 'bg-lime-950/25 hover:bg-lime-950/40',
    border: 'border-lime-500/40 hover:border-lime-500/60',
    badge: 'bg-lime-500/15 text-lime-300 border-lime-500/30',
    dot: 'bg-lime-500'
  },
  green: {
    card: 'bg-green-950/25 hover:bg-green-950/40',
    border: 'border-green-500/40 hover:border-green-500/60',
    badge: 'bg-green-500/15 text-green-300 border-green-500/30',
    dot: 'bg-green-500'
  },
  emerald: {
    card: 'bg-emerald-950/25 hover:bg-emerald-950/40',
    border: 'border-emerald-500/40 hover:border-emerald-500/60',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-500'
  },
  teal: {
    card: 'bg-teal-950/25 hover:bg-teal-950/40',
    border: 'border-teal-500/40 hover:border-teal-500/60',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    dot: 'bg-teal-500'
  },
  cyan: {
    card: 'bg-cyan-950/25 hover:bg-cyan-950/40',
    border: 'border-cyan-500/40 hover:border-cyan-500/60',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    dot: 'bg-cyan-400'
  },
  sky: {
    card: 'bg-sky-950/25 hover:bg-sky-950/40',
    border: 'border-sky-500/40 hover:border-sky-500/60',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dot: 'bg-sky-500'
  },
  blue: {
    card: 'bg-blue-950/25 hover:bg-blue-950/40',
    border: 'border-blue-500/40 hover:border-blue-500/60',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-500'
  },
  indigo: {
    card: 'bg-indigo-950/25 hover:bg-indigo-950/40',
    border: 'border-indigo-500/40 hover:border-indigo-500/60',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    dot: 'bg-indigo-500'
  },
  violet: {
    card: 'bg-violet-950/25 hover:bg-violet-950/40',
    border: 'border-violet-500/40 hover:border-violet-500/60',
    badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    dot: 'bg-purple-500'
  },
  purple: {
    card: 'bg-purple-950/25 hover:bg-purple-950/40',
    border: 'border-purple-500/40 hover:border-purple-500/60',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-600'
  },
  rose: {
    card: 'bg-rose-950/25 hover:bg-rose-950/40',
    border: 'border-rose-500/40 hover:border-rose-500/60',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-500'
  },
  default: {
    card: 'bg-[#0D1526]/90',
    border: 'border-slate-800/60 hover:border-sky-500/30',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    dot: 'bg-slate-400'
  }
};

// Acento vertical izquierdo Bento según color de nota/cuaderno (REQ-UI-28)
const COLOR_BORDE_ACENTO: Record<string, string> = {
  slate: 'border-l-slate-400',
  red: 'border-l-red-500',
  orange: 'border-l-orange-500',
  amber: 'border-l-amber-500',
  yellow: 'border-l-yellow-500',
  lime: 'border-l-lime-500',
  green: 'border-l-green-500',
  emerald: 'border-l-emerald-500',
  teal: 'border-l-teal-500',
  cyan: 'border-l-cyan-500',
  sky: 'border-l-sky-500',
  blue: 'border-l-blue-500',
  indigo: 'border-l-indigo-500',
  violet: 'border-l-violet-500',
  purple: 'border-l-purple-500',
  rose: 'border-l-rose-500'
};

/** Formatea ISO a fecha compacta DD/MM para ahorrar anchura cognitiva en Bento móvil. */
const formatearFechaCortaNota = (fechaIso?: string): string => {
  if (!fechaIso) return '--/--';
  const d = new Date(fechaIso);
  if (Number.isNaN(d.getTime())) return '--/--';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}`;
};

const TarjetaNotaComponent: React.FC<TarjetaNotaProps> = ({
  nota,
  onEditar,
  onEliminar,
  onAbrirEntidad,
  onConvertirEnGasto,
  modoVista = 'masonry'
}) => {
  const temaColor = nota.color_tema || nota.color || 'default';
  const estilo = PALETA_COLORES[temaColor] || PALETA_COLORES.default;
  const bordeAcentoIzquierdo =
    COLOR_BORDE_ACENTO[temaColor] ||
    (nota.block_nombre ? 'border-l-sky-500/70' : 'border-l-slate-700');

  const [copiado, setCopiado] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Manejadores Drag and Drop Nativo (Arrastrar nota hacia Cuadernos Temáticos)
  const handleDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    // Inhibir si el arrastre se origina en botones, enlaces, inputs o zonas no arrastrables
    if (target.closest('button, a, input, textarea, [role="button"], .not-draggable')) {
      e.preventDefault();
      return;
    }
    // Inhibir si el usuario está seleccionando texto
    if (typeof window !== 'undefined' && window.getSelection()?.toString().trim()) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/x-miportal-nota-id', nota.id);
    e.dataTransfer.setData('text/plain', nota.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Copiado omnicanal al portapapeles con serializador canónico
  const handleCopiarNota = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textoPlano = serializarNotaATextoPlano(nota);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textoPlano);
    }
    setCopiado(true);
    toastCobalt.exito('Nota copiada al portapapeles');
    setTimeout(() => setCopiado(false), 1500);
  };

  // Toggle de fijado/pin optimista en Dexie
  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowIso = new Date().toISOString();
    await db.notas.update(nota.id, {
      es_fijada: !nota.es_fijada,
      updated_at: nowIso,
      version: (nota.version || 1) + 1,
      sync_status: 'pending'
    });
  };

  // Toggle de checkbox interactivo en checklists_json y en markdown
  const handleToggleChecklist = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChecklist = (nota.checklists_json || []).map((c) =>
      c.id === itemId ? { ...c, completado: !c.completado } : c
    );

    let nuevoMarkdown = nota.contenido_markdown || '';
    const targetItem = (nota.checklists_json || []).find((c) => c.id === itemId);
    if (targetItem) {
      const regexOld = targetItem.completado
        ? new RegExp(`- \\[x\\]\\s*${escapeRegExp(targetItem.texto)}`, 'i')
        : new RegExp(`- \\[ \\]\\s*${escapeRegExp(targetItem.texto)}`, 'i');
      const replacement = targetItem.completado
        ? `- [ ] ${targetItem.texto}`
        : `- [x] ${targetItem.texto}`;
      nuevoMarkdown = nuevoMarkdown.replace(regexOld, replacement);
    }

    const nowIso = new Date().toISOString();
    await db.notas.update(nota.id, {
      checklists_json: updatedChecklist,
      contenido_markdown: nuevoMarkdown,
      updated_at: nowIso,
      version: (nota.version || 1) + 1,
      sync_status: 'pending'
    });
  };

  // Despacho de conversión de Wishlist al modal elevado de VisorNotas
  const handleAbrirConvertirGasto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConvertirEnGasto) {
      onConvertirEnGasto(nota);
    }
  };

  // Eliminación directa con UndoDelete (despacho sin Swal)
  const handleEliminarDirecto = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEliminar(nota.id);
  };

  // Renderizado del contenido con menciones contextuales formateadas (@PROY-, @TAR-, @GAS-)
  const renderContenidoMenciones = (texto: string) => {
    if (!texto) return null;

    // Detectar menciones @PROY-XXX, @TAR-XXX, @GAS-XXX
    const partes = texto.split(/(@(?:PROY|TAR|GAS|ACT)-\w+)/g);
    return partes.map((parte, i) => {
      if (parte.startsWith('@PROY-') || parte.startsWith('@TAR-') || parte.startsWith('@GAS-') || parte.startsWith('@ACT-')) {
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-slate-400 text-xs font-mono font-medium mx-0.5"
          >
            <Link2 className="w-2.5 h-2.5 shrink-0 text-slate-500" />
            <span>{parte}</span>
          </span>
        );
      }
      return parte;
    });
  };

  // Memoización del AST Markdown para evitar recálculos en filtros de búsqueda
  const markdownRendered = useMemo(() => {
    if (!nota.contenido_markdown || !nota.contenido_markdown.trim()) return null;
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {nota.contenido_markdown}
      </ReactMarkdown>
    );
  }, [nota.contenido_markdown]);

  // Cálculos de porcentaje de checklist
  const totalItems = (nota.checklists_json || []).length;
  const itemsCompletados = (nota.checklists_json || []).filter((c) => c.completado).length;
  const pctChecklist = totalItems > 0 ? Math.round((itemsCompletados / totalItems) * 100) : 0;

  // Cálculos seguros de porcentaje de wishlist
  const metaWishlist = Number(nota.wishlist_json?.costoEstimado || 0);
  const gastadoWishlist = Number(nota.wishlist_json?.montoRealGastado || 0);
  const pctWishlist = metaWishlist > 0 ? Math.min(Math.round((gastadoWishlist / metaWishlist) * 100), 100) : 0;
  const tieneWishlistValido = metaWishlist > 0;

  const tieneTexto = Boolean(nota.contenido_markdown && nota.contenido_markdown.trim() !== '');
  const tieneChecklist = totalItems > 0;

  // Renderizado optimizado para Vista de Lista Compacta Bento (Cero scroll infinito por AST Markdown)
  if (modoVista === 'lista') {
    return (
      <div
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => onEditar(nota)}
        className={`h-12 w-full px-3.5 py-1.5 flex items-center justify-between gap-3 rounded-xl border border-slate-800/60 border-l-4 ${bordeAcentoIzquierdo} bg-[#0D1526]/90 hover:border-sky-500/30 kinetic-card-lista cursor-grab active:cursor-grabbing group select-none shadow-sm ${
          isDragging ? 'opacity-40 scale-[0.98] border-dashed border-sky-500/50' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="font-mono tabular-nums text-[10px] text-slate-500 font-bold shrink-0">
            {nota.codigo_legado}
          </span>
          {nota.block_nombre && (
            <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-slate-800/80 text-sky-300 border border-slate-700/60 shrink-0">
              {nota.block_nombre}
            </span>
          )}
          <span className="text-xs font-bold text-slate-200 truncate">
            {nota.titulo}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {tieneChecklist && (
            <span className="font-mono tabular-nums text-[10px] text-sky-400 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/50">
              {itemsCompletados}/{totalItems}
            </span>
          )}
          {tieneWishlistValido && (
            <span className="font-mono tabular-nums text-[10px] text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/50">
              {nota.wishlist_json?.moneda || 'PEN'} {metaWishlist.toFixed(0)}
            </span>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 font-mono tabular-nums text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
            {formatearFechaCortaNota(nota.updated_at)}
          </span>
          <button
            type="button"
            onClick={handleCopiarNota}
            title="Copiar texto plano al portapapeles"
            aria-label="Copiar texto plano"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-sky-300 rounded-lg transition-all duration-150 active:scale-90 cursor-pointer"
          >
            {copiado ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 kinetic-pop-bounce" strokeWidth={1.75} />
            ) : (
              <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
          </button>
          <button
            type="button"
            onClick={handleEliminarDirecto}
            title="Eliminar Nota"
            aria-label="Eliminar Nota"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-lg transition-all duration-150 active:scale-90 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEditar(nota)}
      className={`nota-card ${nota.es_fijada ? 'nota-card-pinned' : ''} break-inside-avoid mb-3 sm:mb-4 p-3 sm:p-4 flex flex-col justify-between rounded-xl sm:rounded-2xl kinetic-card-mosaico cursor-grab active:cursor-grabbing bg-[#0D1526]/90 ${estilo.card} border border-slate-800/60 ${estilo.border} border-l-4 ${bordeAcentoIzquierdo} shadow-sm hover:border-sky-500/30 group relative ${
        isDragging ? 'opacity-40 scale-[0.98] border-dashed border-sky-500/50' : ''
      }`}
    >
      {/* Botón Pin Flotante Canónico */}
      <button
        type="button"
        id="btn-pin-nota"
        onClick={handleTogglePin}
        title={nota.es_fijada ? 'Desfijar nota' : 'Fijar nota en la parte superior'}
        className={`absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 rounded-xl sm:rounded-lg transition-all duration-200 active:scale-90 cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center ${
          nota.es_fijada
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 opacity-100 shadow-sm'
            : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800 opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
        }`}
      >
        <Pin className={`w-3.5 h-3.5 transition-transform duration-200 ease-out hover:-rotate-12 ${nota.es_fijada ? 'fill-amber-400 rotate-45' : ''}`} strokeWidth={1.75} />
      </button>

      {/* Header: Código Legado + Block Badge + Badges de Tipo */}
      <div className="pr-11 sm:pr-9 mb-2">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <span className="font-mono text-[10px] text-slate-400 font-bold block">
            {nota.codigo_legado}
          </span>
          {nota.block_nombre && (
            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-800/80 text-sky-300 border border-slate-700/60 inline-flex items-center gap-1">
              <BookOpen className="w-2.5 h-2.5 text-sky-400" />
              {nota.block_nombre}
            </span>
          )}
          {tieneChecklist && (
            <span
              title={`Checklist: ${itemsCompletados}/${totalItems} completados`}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 inline-flex items-center gap-1"
            >
              <CheckSquare className="w-2.5 h-2.5" />
              <span className="font-mono tabular-nums">{itemsCompletados}/{totalItems}</span>
            </span>
          )}
          {tieneWishlistValido && (
            <span
              title={`Wishlist: ${nota.wishlist_json?.moneda === 'USD' ? '$' : 'S/'} ${metaWishlist.toFixed(2)}`}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 inline-flex items-center gap-1"
            >
              <DollarSign className="w-2.5 h-2.5" />
              <span className="font-mono tabular-nums">{pctWishlist}%</span>
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
          {nota.titulo}
        </h3>
      </div>

      {/* DOCUMENTO MODULAR INTEGRADO: Texto + Checklists + Wishlist (No Excluyentes) */}
      <div className="space-y-2.5 my-1">
        {/* 1. Sección Texto / Markdown si existe */}
        {tieneTexto && (
          <div className="text-xs text-slate-700 dark:text-slate-300 prose prose-invert prose-sky max-w-none line-clamp-6 font-normal leading-relaxed overflow-hidden">
            {markdownRendered}
            {/@(?:PROY|TAR|GAS|ACT)-\w+/.test(nota.contenido_markdown) && (
              <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-1 not-prose">
                {renderContenidoMenciones(nota.contenido_markdown)}
              </div>
            )}
          </div>
        )}

        {/* 2. Sección Checklist Interactiva si contiene items */}
        {tieneChecklist && (
          <div className="space-y-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 not-draggable">
            {/* Barra de progreso de subtareas */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>Progreso</span>
              <span className="tabular-nums">{pctChecklist}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mb-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${pctChecklist}%` }}
              />
            </div>

            {nota.checklists_json.map((chk) => (
              <div
                key={chk.id}
                onClick={(e) => handleToggleChecklist(chk.id, e)}
                className="flex items-start gap-2 text-xs cursor-pointer group/item hover:bg-slate-900/60 p-1 rounded-md transition-colors"
              >
                <div className="mt-0.5 text-sky-400 shrink-0">
                  {chk.completado ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 fill-emerald-500/20 kinetic-pop-bounce" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 group-hover/item:text-slate-300 transition-colors" />
                  )}
                </div>
                <span
                  className={`leading-relaxed text-[11.5px] ${
                    chk.completado
                      ? 'line-through text-slate-500 decoration-slate-600'
                      : 'text-slate-200'
                  }`}
                >
                  {chk.texto}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 3. Bloque Wishlist Canónico Blindado */}
        {tieneWishlistValido && nota.wishlist_json && (
          <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 space-y-2 text-xs font-mono not-draggable">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-purple-300 flex items-center gap-1 font-sans font-bold">
                <DollarSign className="w-3.5 h-3.5" /> Meta de Ahorro:
              </span>
              <span className="font-bold text-slate-100 tabular-nums">
                {nota.wishlist_json.moneda === 'USD' ? '$' : 'S/'}{' '}
                {metaWishlist.toFixed(2)}
              </span>
            </div>

            {/* Barra de progreso de ahorro/gasto */}
            <div className="w-full bg-purple-950/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${pctWishlist}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Acumulado: {nota.wishlist_json.moneda === 'USD' ? '$' : 'S/'} <b className="tabular-nums">{gastadoWishlist.toFixed(2)}</b></span>
              <span className="tabular-nums font-bold">{pctWishlist}%</span>
            </div>

            {/* Acciones de Wishlist */}
            <div className="flex items-center justify-between pt-1.5 border-t border-purple-900/50 gap-2">
              {nota.wishlist_json.urlReferencia ? (
                <a
                  href={nota.wishlist_json.urlReferencia}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 underline font-sans"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ver Enlace</span>
                </a>
              ) : <div />}

              <button
                type="button"
                onClick={handleAbrirConvertirGasto}
                className="ml-auto px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition cursor-pointer font-sans flex items-center gap-1"
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>Convertir en Gasto</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enlaces y Menciones a Entidades con Navegación Inversa */}
      {nota.enlaces_entidades_json && nota.enlaces_entidades_json.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {nota.enlaces_entidades_json.map((v, i) => {
            const t = (v.tipo || 'PROYECTO').toUpperCase();
            const badgeColor =
              t === 'TAREA'
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20 hover:border-sky-400'
                : t === 'HABITO' || t === 'ACTIVIDAD'
                ? 'bg-pink-500/10 text-pink-400 border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-400'
                : t === 'PROYECTO'
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-400'
                : t === 'GASTO' || t === 'INGRESO' || t === 'FINANZAS'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400';

            const renderIcono = () => {
              if (t === 'TAREA') return <CheckSquare className="w-3 h-3 shrink-0" strokeWidth={1.75} />;
              if (t === 'HABITO' || t === 'ACTIVIDAD') return <Activity className="w-3 h-3 shrink-0" strokeWidth={1.75} />;
              if (t === 'PROYECTO') return <Briefcase className="w-3 h-3 shrink-0" strokeWidth={1.75} />;
              if (t === 'GASTO' || t === 'INGRESO' || t === 'FINANZAS') return <DollarSign className="w-3 h-3 shrink-0" strokeWidth={1.75} />;
              return <Link2 className="w-3 h-3 shrink-0" strokeWidth={1.75} />;
            };

            const handleClickChip = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (onAbrirEntidad) {
                onAbrirEntidad(v);
              }
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('pmo:abrir-entidad', { detail: v })
                );
              }
            };

            return (
              <button
                type="button"
                key={`${v.codigo}-${i}`}
                onClick={handleClickChip}
                title={`Ir a ${v.tipo}: ${v.titulo || v.codigo} (Clic para abrir)`}
                className={`inline-flex items-center gap-1.5 text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full border transition active:scale-95 cursor-pointer max-w-full ${badgeColor}`}
              >
                {renderIcono()}
                <span className="font-bold">{v.codigo}</span>
                {v.titulo && v.titulo.trim() !== v.codigo.trim() && (
                  <span className="hidden sm:inline font-sans font-normal truncate max-w-[110px] opacity-80 text-[9.5px]">
                    · {v.titulo}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Etiquetas / Tags */}
      {nota.etiquetas && nota.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {nota.etiquetas.map((tag) => (
            <span
              key={tag}
              className={`text-[9.5px] font-medium px-1.5 py-0.5 rounded-md border ${estilo.badge}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer de Tarjeta con revelación suave en Hover (Ley de Silencio Visual) */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[11px] text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
          {formatearFechaCortaNota(nota.updated_at)}
        </span>
        <div className="flex items-center gap-0.5 sm:gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={handleCopiarNota}
            title="Copiar texto plano al portapapeles"
            aria-label="Copiar texto plano"
            className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center hover:text-sky-300 rounded-lg transition-all duration-150 active:scale-90 cursor-pointer"
          >
            {copiado ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 kinetic-pop-bounce" strokeWidth={1.75} />
            ) : (
              <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditar(nota);
            }}
            title="Editar Nota"
            aria-label="Editar Nota"
            className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center hover:text-sky-400 rounded-lg transition-all duration-150 active:scale-90 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={handleEliminarDirecto}
            title="Eliminar Nota"
            aria-label="Eliminar Nota"
            className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center hover:text-rose-400 rounded-lg transition-all duration-150 active:scale-90 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

    </div>
  );
};

export function arePropsEqual(prevProps: TarjetaNotaProps, nextProps: TarjetaNotaProps): boolean {
  return (
    prevProps.nota.id === nextProps.nota.id &&
    prevProps.nota.updated_at === nextProps.nota.updated_at &&
    prevProps.modoVista === nextProps.modoVista
  );
}

export const TarjetaNota = memo(TarjetaNotaComponent, arePropsEqual);

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
