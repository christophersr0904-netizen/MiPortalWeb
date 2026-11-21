/**
 * ============================================================================
 * ARCHIVO: src/components/Notas/EditorNotaModal.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-NOTAS-A2-FIX: Corrección de Flujo Continuo, Herramientas Sutiles e Inline Wishlist
 * ESTÁNDAR VISUAL: Cobalt Aerodynamic A.2.2 (#040711, #0D1526, border-slate-800/80)
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import ShinyText from '../ShinyText';
import type { NotaRecord, ChecklistItem, WishlistMeta, VinculoEntidad } from '../../types';
import { crearNota, actualizarNota } from '../../services/notasService';
import { serializarNotaATextoPlano } from '../../utils/entityNormalizer';
import { toastCobalt } from '../../utils/toastCobalt';
import { generateSafeUUID } from '../../utils/uuidGenerator';
import { ModalVincularEntidades } from './ModalVincularEntidades';
import {
  X,
  Pin,
  Eye,
  Edit3,
  BookOpen,
  CheckSquare,
  DollarSign,
  Square,
  Plus,
  Trash2,
  Link2,
  ChevronDown,
  Copy,
  Check,
  Bold,
  Italic,
  Code,
  List,
  Palette,
  Globe
} from 'lucide-react';

interface EditorNotaModalProps {
  nota: NotaRecord | null;
  isOpen: boolean;
  onClose: () => void;
  initialBlock?: string;
  blocksDisponibles?: string[];
  etiquetasDisponibles?: string[];
}

const PALETA_COLORES_CANONICA = [
  { id: 'default', label: 'Pizarra', dot: 'bg-slate-400', border: 'border-slate-500', hex: '#64748b' },
  { id: 'sky', label: 'Cielo', dot: 'bg-sky-400', border: 'border-sky-400', hex: '#38bdf8' },
  { id: 'emerald', label: 'Esmeralda', dot: 'bg-emerald-400', border: 'border-emerald-400', hex: '#34d399' },
  { id: 'indigo', label: 'Índigo', dot: 'bg-indigo-400', border: 'border-indigo-400', hex: '#818cf8' },
  { id: 'amber', label: 'Ámbar', dot: 'bg-amber-400', border: 'border-amber-400', hex: '#fbbf24' },
  { id: 'purple', label: 'Púrpura', dot: 'bg-purple-400', border: 'border-purple-400', hex: '#c084fc' },
  { id: 'rose', label: 'Rosa', dot: 'bg-rose-400', border: 'border-rose-400', hex: '#fb7185' }
] as const;

export const EditorNotaModal: React.FC<EditorNotaModalProps> = ({
  nota,
  isOpen,
  onClose,
  initialBlock,
  blocksDisponibles = [],
  etiquetasDisponibles = []
}) => {
  // Referencias para foco y auto-ajuste de altura
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nuevoItemInputRef = useRef<HTMLInputElement>(null);

  // Estados Base
  const [titulo, setTitulo] = useState('');
  const [contenidoMarkdown, setContenidoMarkdown] = useState('');
  const [blockNombre, setBlockNombre] = useState('');
  const [colorTema, setColorTema] = useState('default');
  const [esFijada, setEsFijada] = useState(false);
  const [etiquetasLista, setEtiquetasLista] = useState<string[]>([]);
  const [nuevoTagInput, setNuevoTagInput] = useState('');
  const [modoPreview, setModoPreview] = useState(false);

  // Estados de Toggles Modulares
  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const [mostrarWishlist, setMostrarWishlist] = useState(false);
  const [mostrarDetalleWishlist, setMostrarDetalleWishlist] = useState(false);

  // Checklists State & Edición In-line
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [nuevoItemTexto, setNuevoItemTexto] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);

  // Wishlist State
  const [costoEstimado, setCostoEstimado] = useState(0);
  const [montoRealGastado, setMontoRealGastado] = useState(0);
  const [moneda, setMoneda] = useState<'PEN' | 'USD'>('PEN');
  const [prioridad, setPrioridad] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('MEDIA');
  const [urlReferencia, setUrlReferencia] = useState('');
  const [tienda, setTienda] = useState('');

  // Enlaces de Entidades State
  const [enlacesEntidades, setEnlacesEntidades] = useState<VinculoEntidad[]>([]);
  const [modalVincularAbierto, setModalVincularAbierto] = useState(false);

  // Estado del portapapeles
  const [copiado, setCopiado] = useState(false);

  // Estados de Menús Desplegables Cobalt
  const [menuCuadernoAbierto, setMenuCuadernoAbierto] = useState(false);
  const [menuColorAbierto, setMenuColorAbierto] = useState(false);
  const [menuMonedaAbierto, setMenuMonedaAbierto] = useState(false);
  const [menuPrioridadAbierto, setMenuPrioridadAbierto] = useState(false);
  const [busquedaCuaderno, setBusquedaCuaderno] = useState('');

  // Dropup de Etiquetas y Autocompletado
  const [tagInputEnfocado, setTagInputEnfocado] = useState(false);
  const [sugerenciaActivaIdx, setSugerenciaActivaIdx] = useState<number>(-1);

  const refDropdownCuaderno = useRef<HTMLDivElement>(null);
  const refDropdownColor = useRef<HTMLDivElement>(null);
  const refDropdownMoneda = useRef<HTMLDivElement>(null);
  const refDropdownPrioridad = useRef<HTMLDivElement>(null);
  const refDropupTags = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Auto-ajuste de altura del Textarea (cero hueco entre texto y checklist)
  const ajustarAlturaTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(48, el.scrollHeight)}px`;
  };

  useEffect(() => {
    if (!modoPreview && isOpen) {
      ajustarAlturaTextarea();
    }
  }, [contenidoMarkdown, modoPreview, isOpen]);

  // Cierre de dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      const target = e.target as Node;
      if (refDropdownCuaderno.current && !refDropdownCuaderno.current.contains(target)) {
        setMenuCuadernoAbierto(false);
      }
      if (refDropdownColor.current && !refDropdownColor.current.contains(target)) {
        setMenuColorAbierto(false);
      }
      if (refDropdownMoneda.current && !refDropdownMoneda.current.contains(target)) {
        setMenuMonedaAbierto(false);
      }
      if (refDropdownPrioridad.current && !refDropdownPrioridad.current.contains(target)) {
        setMenuPrioridadAbierto(false);
      }
      if (refDropupTags.current && !refDropupTags.current.contains(target)) {
        setTagInputEnfocado(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  // Inicialización de Estados
  useEffect(() => {
    if (nota) {
      setTitulo(nota.titulo || '');
      setContenidoMarkdown(nota.contenido_markdown || '');
      setBlockNombre(nota.block_nombre || '');
      setColorTema(nota.color_tema || 'default');
      setEsFijada(Boolean(nota.es_fijada));
      setEtiquetasLista(Array.isArray(nota.etiquetas) ? [...nota.etiquetas] : []);
      setChecklists(nota.checklists_json || []);
      setEnlacesEntidades(nota.enlaces_entidades_json || []);

      const hayChecklists = (nota.checklists_json || []).length > 0;
      setMostrarChecklist(hayChecklists);

      if (nota.wishlist_json && typeof nota.wishlist_json === 'object') {
        const costo = Number(nota.wishlist_json.costoEstimado || 0);
        const hayWishlistData = costo > 0 || Boolean(nota.wishlist_json.urlReferencia) || Boolean(nota.wishlist_json.tienda);
        setMostrarWishlist(hayWishlistData);
        setCostoEstimado(costo);
        setMontoRealGastado(Number(nota.wishlist_json.montoRealGastado || 0));
        setMoneda(nota.wishlist_json.moneda === 'USD' ? 'USD' : 'PEN');
        setPrioridad((nota.wishlist_json.prioridad as any) || 'MEDIA');
        const urlRef = nota.wishlist_json.urlReferencia || nota.wishlist_json.enlaceReferencia || '';
        const tiendaRef = nota.wishlist_json.tienda || '';
        setUrlReferencia(urlRef);
        setTienda(tiendaRef);
        setMostrarDetalleWishlist(Boolean(urlRef || tiendaRef));
      } else {
        setMostrarWishlist(false);
        setMostrarDetalleWishlist(false);
        setCostoEstimado(0);
        setMontoRealGastado(0);
        setMoneda('PEN');
        setPrioridad('MEDIA');
        setUrlReferencia('');
        setTienda('');
      }
    } else {
      setTitulo('');
      setContenidoMarkdown('');
      setBlockNombre(initialBlock || '');
      setColorTema('default');
      setEsFijada(false);
      setEtiquetasLista([]);
      setChecklists([]);
      setEnlacesEntidades([]);
      setMostrarChecklist(false);
      setMostrarWishlist(false);
      setMostrarDetalleWishlist(false);
      setCostoEstimado(0);
      setMontoRealGastado(0);
      setMoneda('PEN');
      setPrioridad('MEDIA');
      setUrlReferencia('');
      setTienda('');
    }
    setNuevoTagInput('');
    setNuevoItemTexto('');
    setEditingChecklistId(null);
    setModoPreview(false);
    setMenuCuadernoAbierto(false);
    setMenuColorAbierto(false);
    setMenuMonedaAbierto(false);
    setMenuPrioridadAbierto(false);
    setTagInputEnfocado(false);
    setSugerenciaActivaIdx(-1);
  }, [nota, isOpen, initialBlock]);

  // Listener para ESC global con cierre LIFO
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();

        // Si hay algún dropdown Cobalt abierto, cerrar solo el dropdown
        if (menuCuadernoAbierto || menuColorAbierto || menuMonedaAbierto || menuPrioridadAbierto || tagInputEnfocado) {
          setMenuCuadernoAbierto(false);
          setMenuColorAbierto(false);
          setMenuMonedaAbierto(false);
          setMenuPrioridadAbierto(false);
          setTagInputEnfocado(false);
          setSugerenciaActivaIdx(-1);
          return;
        }

        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, menuCuadernoAbierto, menuColorAbierto, menuMonedaAbierto, menuPrioridadAbierto, tagInputEnfocado]);

  // Copiado omnicanal al portapapeles
  const handleCopiar = () => {
    const notaParaCopiar: any = {
      titulo,
      contenido_markdown: contenidoMarkdown,
      checklists_json: checklists,
      wishlist_json: mostrarWishlist
        ? {
            costoEstimado,
            montoRealGastado,
            moneda,
            prioridad,
            urlReferencia,
            tienda
          }
        : undefined,
      etiquetas: etiquetasLista
    };

    const texto = serializarNotaATextoPlano(notaParaCopiar);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(texto);
    }
    setCopiado(true);
    toastCobalt.exito('Nota copiada al portapapeles');
    setTimeout(() => setCopiado(false), 1500);
  };

  // Inserción de Formato Markdown en Textarea
  const insertarFormatoMarkdown = (tipo: 'bold' | 'italic' | 'code' | 'list') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoActual = contenidoMarkdown;
    const seleccion = textoActual.substring(start, end);

    let reemplazo = '';
    let cursorOffset = 0;

    switch (tipo) {
      case 'bold':
        reemplazo = `**${seleccion || 'texto en negrita'}**`;
        cursorOffset = seleccion ? reemplazo.length : 2;
        break;
      case 'italic':
        reemplazo = `*${seleccion || 'texto en cursiva'}*`;
        cursorOffset = seleccion ? reemplazo.length : 1;
        break;
      case 'code':
        reemplazo = `\`${seleccion || 'código'}\``;
        cursorOffset = seleccion ? reemplazo.length : 1;
        break;
      case 'list':
        reemplazo = `\n- ${seleccion || 'elemento de lista'}`;
        cursorOffset = reemplazo.length;
        break;
    }

    const nuevoTexto = textoActual.substring(0, start) + reemplazo + textoActual.substring(end);
    setContenidoMarkdown(nuevoTexto);

    setTimeout(() => {
      textarea.focus();
      const nuevaPos = seleccion ? start + reemplazo.length : start + cursorOffset;
      textarea.setSelectionRange(nuevaPos, nuevaPos);
      ajustarAlturaTextarea();
    }, 0);
  };

  // Manejo de Checklist
  const handleAgregarChecklistItem = () => {
    if (!nuevoItemTexto.trim()) return;
    setChecklists((prev) => [
      ...prev,
      {
        id: generateSafeUUID(),
        texto: nuevoItemTexto.trim(),
        completado: false
      }
    ]);
    setNuevoItemTexto('');
    setTimeout(() => {
      nuevoItemInputRef.current?.focus();
    }, 0);
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklists((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completado: !c.completado } : c))
    );
  };

  const handleEditarChecklistItem = (id: string, nuevoTexto: string) => {
    setChecklists((prev) =>
      prev.map((c) => (c.id === id ? { ...c, texto: nuevoTexto } : c))
    );
  };

  const handleEliminarChecklistItem = (id: string) => {
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  };

  // Manejo de Etiquetas y Autocompletado Cobalt
  const queryTagLimpia = nuevoTagInput.trim().toLowerCase().replace(/^#+/, '');

  const sugerenciasTags = useMemo(() => {
    return etiquetasDisponibles
      .filter((t) => {
        const tLower = t.toLowerCase();
        return (
          (!queryTagLimpia || tLower.includes(queryTagLimpia)) &&
          !etiquetasLista.map((x) => x.toLowerCase()).includes(tLower)
        );
      })
      .slice(0, 15);
  }, [etiquetasDisponibles, queryTagLimpia, etiquetasLista]);

  const handleSeleccionarEtiqueta = (tag: string) => {
    const limpia = tag.trim().toLowerCase().replace(/^#+/, '');
    if (limpia && !etiquetasLista.includes(limpia)) {
      setEtiquetasLista((prev) => [...prev, limpia]);
    }
    setNuevoTagInput('');
    setSugerenciaActivaIdx(-1);
    setTagInputEnfocado(false);
    tagInputRef.current?.focus();
  };

  const handleAgregarEtiqueta = () => {
    if (queryTagLimpia && !etiquetasLista.includes(queryTagLimpia)) {
      setEtiquetasLista((prev) => [...prev, queryTagLimpia]);
    }
    setNuevoTagInput('');
    setSugerenciaActivaIdx(-1);
  };

  const handleEliminarEtiqueta = (tag: string) => {
    setEtiquetasLista((prev) => prev.filter((t) => t !== tag));
  };

  // Guardado Atómico Normalizado
  const handleGuardar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!titulo.trim() && !contenidoMarkdown.trim() && checklists.length === 0) {
      onClose();
      return;
    }

    const blockAsignado = blockNombre.trim() || undefined;

    let wishlistPayload: WishlistMeta | undefined = undefined;
    if (mostrarWishlist && (costoEstimado > 0 || urlReferencia.trim() || tienda.trim())) {
      wishlistPayload = {
        costoEstimado,
        montoRealGastado,
        moneda,
        prioridad,
        comprado: montoRealGastado > 0 && montoRealGastado >= costoEstimado,
        urlReferencia: urlReferencia.trim() || undefined,
        tienda: tienda.trim() || undefined,
        estado: montoRealGastado >= costoEstimado && costoEstimado > 0 ? 'CONSEGUIDO' : 'DESEADO'
      };
    }

    if (nota) {
      await actualizarNota(nota.id, {
        titulo: titulo.trim() || 'Nota sin título',
        contenido_markdown: contenidoMarkdown,
        block_nombre: blockAsignado,
        color_tema: colorTema,
        es_fijada: esFijada,
        etiquetas: etiquetasLista,
        checklists_json: checklists,
        wishlist_json: wishlistPayload,
        enlaces_entidades_json: enlacesEntidades,
        version: (nota.version || 1) + 1
      });
    } else {
      await crearNota({
        titulo: titulo.trim() || 'Nueva Nota',
        contenido_markdown: contenidoMarkdown,
        tipo_nota: 'MODULAR',
        block_nombre: blockAsignado,
        color_tema: colorTema,
        es_fijada: esFijada,
        checklists_json: checklists,
        wishlist_json: wishlistPayload,
        adjuntos_drive_json: [],
        enlaces_entidades_json: enlacesEntidades,
        etiquetas: etiquetasLista
      });
    }

    onClose();
  };

  // Cuadernos filtrados para el selector Cobalt
  const cuadernosFiltrados = useMemo(() => {
    const lista = blocksDisponibles.filter(Boolean);
    if (!busquedaCuaderno.trim()) return lista;
    const q = busquedaCuaderno.toLowerCase().trim();
    return lista.filter((b) => b.toLowerCase().includes(q));
  }, [blocksDisponibles, busquedaCuaderno]);

  if (!isOpen) return null;

  return typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="w-full max-w-4xl max-h-[92dvh] h-[90dvh] sm:h-auto sm:max-h-[88dvh] sm:min-h-[540px] rounded-t-3xl sm:rounded-2xl bg-[#0D1526] border-t-2 sm:border border-slate-800/80 shadow-[0_20px_50px_rgba(2,6,23,0.9),0_0_25px_rgba(56,189,248,0.08)] overflow-hidden flex flex-col"
            style={{
              borderTopColor: PALETA_COLORES_CANONICA.find((c) => c.id === colorTema)?.hex || '#38bdf8'
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleGuardar();
              }
            }}
          >
            {/* Tirador táctil móvil */}
            <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2 sm:hidden flex-shrink-0" />

            {/* 1. HEADER SUPERIOR COMPACTO (COBALT A.2.2) */}
            <div className="px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between bg-[#040711]/90 shrink-0 gap-2 select-none relative z-30">
              {/* Flanco Izquierdo: Código + Selector de Cuaderno Cobalt + Selector de Color Cobalt */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[11px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20 font-bold tabular-nums shrink-0">
                  <ShinyText
                    text={nota?.codigo_legado || 'NUEVA NOTA'}
                    color="#38bdf8"
                    shineColor="#e0f2fe"
                    speed={3}
                    className="font-mono text-[11px] font-bold tabular-nums"
                  />
                </span>

                {/* SELECTOR DE CUADERNO COBALT */}
                <div className="relative shrink-0" ref={refDropdownCuaderno}>
                  <button
                    type="button"
                    onClick={() => setMenuCuadernoAbierto((prev) => !prev)}
                    className="h-7 px-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
                    title="Asignar cuaderno temático"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                    <span className="max-w-[120px] sm:max-w-[160px] truncate">
                      {blockNombre || 'Sin Cuaderno'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" strokeWidth={1.75} />
                  </button>

                  {menuCuadernoAbierto && (
                    <div className="absolute top-[calc(100%+6px)] left-0 z-[200] w-64 p-2 rounded-xl bg-[#0D1526] border border-slate-700 shadow-[0_16px_36px_-6px_rgba(2,6,23,0.95),0_0_20px_rgba(56,189,248,0.12)] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
                      <div className="p-1">
                        <input
                          type="text"
                          value={busquedaCuaderno}
                          onChange={(e) => setBusquedaCuaderno(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && busquedaCuaderno.trim()) {
                              e.preventDefault();
                              setBlockNombre(busquedaCuaderno.trim());
                              setBusquedaCuaderno('');
                              setMenuCuadernoAbierto(false);
                            }
                          }}
                          placeholder="Buscar o crear cuaderno..."
                          autoFocus
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="max-h-44 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setBlockNombre('');
                            setMenuCuadernoAbierto(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            !blockNombre
                              ? 'bg-sky-500/20 text-sky-300 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <span className="italic text-slate-400">Sin Cuaderno (General)</span>
                          {!blockNombre && <Check className="w-3.5 h-3.5 text-sky-400" strokeWidth={2} />}
                        </button>

                        {cuadernosFiltrados.map((b) => {
                          const esActivo = blockNombre === b;
                          return (
                            <button
                              key={b}
                              type="button"
                              onClick={() => {
                                setBlockNombre(b);
                                setMenuCuadernoAbierto(false);
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                esActivo
                                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                              }`}
                            >
                              <span className="truncate">{b}</span>
                              {esActivo && <Check className="w-3.5 h-3.5 text-sky-400" strokeWidth={2} />}
                            </button>
                          );
                        })}

                        {busquedaCuaderno.trim() && !cuadernosFiltrados.includes(busquedaCuaderno.trim()) && (
                          <button
                            type="button"
                            onClick={() => {
                              setBlockNombre(busquedaCuaderno.trim());
                              setBusquedaCuaderno('');
                              setMenuCuadernoAbierto(false);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Crear &quot;{busquedaCuaderno.trim()}&quot;</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* SELECTOR DE COLOR DE TEMA COBALT */}
                <div className="relative shrink-0" ref={refDropdownColor}>
                  <button
                    type="button"
                    onClick={() => setMenuColorAbierto((prev) => !prev)}
                    className="h-7 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
                    title="Tono y acento de tarjeta"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full ${
                        PALETA_COLORES_CANONICA.find((c) => c.id === colorTema)?.dot || 'bg-slate-400'
                      }`}
                    />
                    <Palette className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
                  </button>

                  {menuColorAbierto && (
                    <div className="absolute top-[calc(100%+6px)] left-0 z-[200] p-2 rounded-xl bg-[#0D1526] border border-slate-700 shadow-[0_16px_36px_-6px_rgba(2,6,23,0.95),0_0_20px_rgba(56,189,248,0.12)] flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                      {PALETA_COLORES_CANONICA.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => {
                            setColorTema(col.id);
                            setMenuColorAbierto(false);
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-150 cursor-pointer hover:scale-110 active:scale-95 ${col.dot} ${
                            colorTema === col.id
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0D1526] scale-110'
                              : 'opacity-80 hover:opacity-100'
                          }`}
                          title={col.label}
                        >
                          {colorTema === col.id && (
                            <Check className="w-3 h-3 text-slate-950 font-bold" strokeWidth={2.5} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Flanco Derecho: Copiar + Pin + Cerrar */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopiar}
                  className="min-w-[32px] min-h-[32px] w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-sky-300 hover:border-sky-500/40 flex items-center justify-center transition-colors duration-150 cursor-pointer"
                  title="Copiar texto plano al portapapeles"
                >
                  {copiado ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                  ) : (
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setEsFijada(!esFijada)}
                  className={`min-w-[32px] min-h-[32px] w-8 h-8 rounded-lg border flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                    esFijada
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/40'
                  }`}
                  title={esFijada ? 'Desfijar de la cabecera' : 'Fijar arriba'}
                >
                  <Pin className={`w-3.5 h-3.5 ${esFijada ? 'fill-amber-400 rotate-45' : ''}`} strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="min-w-[32px] min-h-[32px] w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 flex items-center justify-center transition-colors duration-150 cursor-pointer"
                  title="Cerrar modal (Esc)"
                >
                  <X className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* FORMULARIO EDITORIAL CONTINUO */}
            <form onSubmit={handleGuardar} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* 2. TÍTULO SPOTLIGHT */}
              <div className="px-5 pt-3.5 pb-1 shrink-0">
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Título de la nota..."
                  className="w-full bg-transparent text-lg sm:text-xl font-bold text-slate-100 placeholder:text-slate-600 outline-none transition-colors border-none p-0 focus:ring-0 leading-tight"
                />
              </div>

              {/* 3. MICRO-BARRA DE HERRAMIENTAS EDITORIAL DISCRETA (h-8, 32px) */}
              <div className="h-8 border-y border-slate-800/70 flex items-center justify-between gap-1 px-4 my-1 select-none shrink-0 bg-slate-950/40">
                {/* Herramientas de Formato Rápido Markdown */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => insertarFormatoMarkdown('bold')}
                    className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition cursor-pointer"
                    title="Negrita (**texto**)"
                  >
                    <Bold className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertarFormatoMarkdown('italic')}
                    className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition cursor-pointer"
                    title="Cursiva (*texto*)"
                  >
                    <Italic className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertarFormatoMarkdown('code')}
                    className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition cursor-pointer"
                    title="Código en línea (`código`)"
                  >
                    <Code className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertarFormatoMarkdown('list')}
                    className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition cursor-pointer"
                    title="Lista con viñetas (- ítem)"
                  >
                    <List className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>

                {/* Toggles Modulares como Iconos Sutiles de Herramienta */}
                <div className="flex items-center gap-1">
                  {/* Toggle Checklist */}
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarChecklist((prev) => {
                        const next = !prev;
                        if (next) {
                          setTimeout(() => nuevoItemInputRef.current?.focus(), 50);
                        }
                        return next;
                      });
                    }}
                    className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                      mostrarChecklist || checklists.length > 0
                        ? 'text-sky-400 bg-sky-500/10'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title="Alternar bloque de tareas y pasos interactivos"
                  >
                    <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {checklists.length > 0 && (
                      <span className="font-mono tabular-nums text-[10px]">
                        {checklists.filter((c) => c.completado).length}/{checklists.length}
                      </span>
                    )}
                  </button>

                  {/* Toggle Wishlist */}
                  <button
                    type="button"
                    onClick={() => setMostrarWishlist((prev) => !prev)}
                    className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                      mostrarWishlist || costoEstimado > 0
                        ? 'text-violet-400 bg-violet-500/10'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title="Alternar módulo de deseos, compras y presupuesto"
                  >
                    <DollarSign className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {costoEstimado > 0 && (
                      <span className="font-mono tabular-nums text-[10px]">
                        {moneda === 'USD' ? '$' : 'S/'}
                        {costoEstimado.toFixed(0)}
                      </span>
                    )}
                  </button>

                  {/* Toggle Vínculos */}
                  <button
                    type="button"
                    onClick={() => setModalVincularAbierto(true)}
                    className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                      enlacesEntidades.length > 0
                        ? 'text-indigo-400 bg-indigo-500/10'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title="Gestionar vínculos a proyectos, tareas y gastos"
                  >
                    <Link2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {enlacesEntidades.length > 0 && (
                      <span className="font-mono tabular-nums text-[10px]">
                        {enlacesEntidades.length}
                      </span>
                    )}
                  </button>

                  <div className="w-px h-3.5 bg-slate-800 mx-0.5" />

                  {/* Toggle Vista Previa */}
                  <button
                    type="button"
                    onClick={() => setModoPreview((prev) => !prev)}
                    className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                      modoPreview
                        ? 'text-sky-400 bg-sky-500/10'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title={modoPreview ? 'Volver al editor' : 'Ver Markdown formateado'}
                  >
                    {modoPreview ? (
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              {/* Píldoras de Vínculos a Entidades (si existen) */}
              {enlacesEntidades.length > 0 && (
                <div className="px-5 py-1.5 flex items-center gap-1.5 flex-wrap shrink-0 border-b border-slate-800/40 bg-slate-950/20">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-indigo-400" />
                    <span>Vinculado:</span>
                  </span>
                  {enlacesEntidades.map((v) => (
                    <span
                      key={v.codigo}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-indigo-950/50 text-indigo-300 border border-indigo-800/50 shadow-2xs"
                    >
                      <span>{v.codigo}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEnlacesEntidades(enlacesEntidades.filter((e) => e.codigo !== v.codigo))
                        }
                        className="hover:text-rose-400 transition cursor-pointer ml-0.5"
                        title={`Quitar vínculo con ${v.codigo}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* 4. LIENZO CONTINUO ÚNICO (SCROLL UNIFICADO SIN CAJAS INTERNAS) */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2 space-y-2 custom-scrollbar">
                {/* FLUJO DE TEXTO / MARKDOWN AUTO-AJUSTABLE */}
                {!modoPreview ? (
                  <textarea
                    ref={textareaRef}
                    value={contenidoMarkdown}
                    onChange={(e) => {
                      setContenidoMarkdown(e.target.value);
                      ajustarAlturaTextarea();
                    }}
                    placeholder="Redacta en Markdown... usa @PROY-XXX o @TAR-XXX para vincular con proyectos y tareas..."
                    className="w-full bg-transparent border-0 outline-none resize-none text-sm text-slate-200 placeholder:text-slate-600 leading-relaxed min-h-[48px] overflow-hidden focus:ring-0 p-0 font-sans"
                  />
                ) : (
                  <div className="min-h-[48px] max-h-[300px] overflow-y-auto bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 prose prose-invert prose-sky max-w-none text-sm leading-relaxed custom-scrollbar">
                    {contenidoMarkdown ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                        {contenidoMarkdown}
                      </ReactMarkdown>
                    ) : (
                      <span className="text-slate-500 italic text-xs">
                        No hay contenido Markdown para previsualizar.
                      </span>
                    )}
                  </div>
                )}

                {/* FLUJO DE CHECKLIST CONTINUO (SIN ENCABEZADO DE SECCIÓN NI BORDE TOSCO) */}
                <AnimatePresence>
                  {(mostrarChecklist || checklists.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="pt-1 space-y-0.5"
                    >
                      {/* Lista de Ítems */}
                      {checklists.map((chk) => (
                        <div
                          key={chk.id}
                          className="flex items-center justify-between gap-2 py-0.5 px-1 rounded-md group/item hover:bg-slate-900/40 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleChecklistItem(chk.id)}
                              className="text-left shrink-0 cursor-pointer focus:outline-none p-0.5"
                              title={chk.completado ? 'Marcar pendiente' : 'Marcar completado'}
                            >
                              {chk.completado ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400 fill-emerald-500/20" strokeWidth={1.75} />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" strokeWidth={1.75} />
                              )}
                            </button>

                            {editingChecklistId === chk.id ? (
                              <input
                                type="text"
                                value={chk.texto}
                                autoFocus
                                onChange={(e) => handleEditarChecklistItem(chk.id, e.target.value)}
                                onBlur={() => setEditingChecklistId(null)}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === 'Enter' || e.key === 'Escape') {
                                    e.preventDefault();
                                    setEditingChecklistId(null);
                                  }
                                }}
                                className="flex-1 bg-slate-950 border border-sky-500/60 rounded px-1.5 py-0.5 text-xs text-slate-100 focus:outline-none"
                              />
                            ) : (
                              <span
                                onDoubleClick={() => setEditingChecklistId(chk.id)}
                                title="Doble clic para editar texto"
                                className={`text-xs cursor-text truncate select-none flex-1 leading-snug ${
                                  chk.completado ? 'line-through text-slate-500' : 'text-slate-200 hover:text-sky-200'
                                }`}
                              >
                                {chk.texto}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleEliminarChecklistItem(chk.id)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 opacity-0 group-hover/item:opacity-100 transition cursor-pointer shrink-0"
                            title="Eliminar paso"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                      ))}

                      {/* Input fantasma de agregar ítem */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <Plus className="w-3.5 h-3.5 text-slate-600 shrink-0 ml-1" />
                        <input
                          ref={nuevoItemInputRef}
                          type="text"
                          value={nuevoItemTexto}
                          onChange={(e) => setNuevoItemTexto(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAgregarChecklistItem();
                            }
                          }}
                          placeholder="+ Agregar paso... (Enter)"
                          className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-300 placeholder:text-slate-600 focus:ring-0 py-0.5 font-sans"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* FLUJO DE WISHLIST COMO FRANJA INLINE MINIMALISTA */}
                <AnimatePresence>
                  {(mostrarWishlist || costoEstimado > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="mt-2 pt-2 border-t border-slate-800/50 flex flex-col gap-1.5 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-violet-400 shrink-0" strokeWidth={1.75} />

                        {/* Selector de Moneda Cobalt Dropup */}
                        <div className="relative shrink-0" ref={refDropdownMoneda}>
                          <button
                            type="button"
                            onClick={() => setMenuMonedaAbierto((prev) => !prev)}
                            className="h-7 px-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 text-slate-200 font-mono text-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            <span>{moneda === 'USD' ? '$ USD' : 'S/ PEN'}</span>
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          </button>

                          {menuMonedaAbierto && (
                            <div className="absolute bottom-[calc(100%+6px)] top-auto left-0 z-[150] p-1 rounded-xl bg-[#0D1526] border border-slate-700 shadow-[0_16px_36px_-6px_rgba(2,6,23,0.95)] flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setMoneda('PEN');
                                  setMenuMonedaAbierto(false);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-left text-xs font-mono flex items-center justify-between gap-2 cursor-pointer ${
                                  moneda === 'PEN'
                                    ? 'bg-violet-500/20 text-violet-300 font-bold'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <span>S/ PEN</span>
                                {moneda === 'PEN' && <Check className="w-3 h-3 text-violet-400" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMoneda('USD');
                                  setMenuMonedaAbierto(false);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-left text-xs font-mono flex items-center justify-between gap-2 cursor-pointer ${
                                  moneda === 'USD'
                                    ? 'bg-violet-500/20 text-violet-300 font-bold'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <span>$ USD</span>
                                {moneda === 'USD' && <Check className="w-3 h-3 text-violet-400" />}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Input Costo Estimado sin spinners */}
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={costoEstimado || ''}
                          onChange={(e) => setCostoEstimado(parseFloat(e.target.value) || 0)}
                          placeholder="Estimado"
                          className="w-28 h-7 bg-slate-900/70 border border-slate-800 rounded-lg px-2 font-mono text-xs text-slate-100 tabular-nums focus:outline-none focus:border-violet-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          title="Costo Estimado"
                        />

                        {/* Input Gasto Real sin spinners */}
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={montoRealGastado || ''}
                          onChange={(e) => setMontoRealGastado(parseFloat(e.target.value) || 0)}
                          placeholder="Gastado"
                          className="w-28 h-7 bg-slate-900/70 border border-slate-800 rounded-lg px-2 font-mono text-xs text-slate-100 tabular-nums focus:outline-none focus:border-violet-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          title="Gasto Real Acumulado"
                        />

                        {/* Selector de Prioridad Cobalt Dropup */}
                        <div className="relative shrink-0" ref={refDropdownPrioridad}>
                          <button
                            type="button"
                            onClick={() => setMenuPrioridadAbierto((prev) => !prev)}
                            className="h-7 px-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 text-slate-200 text-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                prioridad === 'ALTA'
                                  ? 'bg-rose-400'
                                  : prioridad === 'MEDIA'
                                  ? 'bg-amber-400'
                                  : 'bg-sky-400'
                              }`}
                            />
                            <span>{prioridad === 'ALTA' ? 'Alta' : prioridad === 'MEDIA' ? 'Media' : 'Baja'}</span>
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          </button>

                          {menuPrioridadAbierto && (
                            <div className="absolute bottom-[calc(100%+6px)] top-auto left-0 z-[150] p-1 rounded-xl bg-[#0D1526] border border-slate-700 shadow-[0_16px_36px_-6px_rgba(2,6,23,0.95)] flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                              {(
                                [
                                  { id: 'ALTA', label: 'Alta', dot: 'bg-rose-400' },
                                  { id: 'MEDIA', label: 'Media', dot: 'bg-amber-400' },
                                  { id: 'BAJA', label: 'Baja', dot: 'bg-sky-400' }
                                ] as const
                              ).map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setPrioridad(p.id);
                                    setMenuPrioridadAbierto(false);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-left text-xs flex items-center justify-between gap-3 cursor-pointer ${
                                    prioridad === p.id
                                      ? 'bg-violet-500/20 text-violet-300 font-bold'
                                      : 'text-slate-300 hover:bg-slate-800'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                                    <span>{p.label}</span>
                                  </span>
                                  {prioridad === p.id && <Check className="w-3 h-3 text-violet-400" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Botón sutil para desplegar Tienda / URL */}
                        <button
                          type="button"
                          onClick={() => setMostrarDetalleWishlist((prev) => !prev)}
                          className={`h-7 px-2 rounded-lg border text-xs flex items-center gap-1 transition cursor-pointer ${
                            mostrarDetalleWishlist || tienda || urlReferencia
                              ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                          title="Tienda y URL de referencia"
                        >
                          <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span className="text-[11px]">Enlace/Tienda</span>
                        </button>

                        {/* Botón X discreto para limpiar/ocultar Wishlist */}
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarWishlist(false);
                            setCostoEstimado(0);
                            setMontoRealGastado(0);
                            setUrlReferencia('');
                            setTienda('');
                            setMostrarDetalleWishlist(false);
                          }}
                          className="ml-auto p-1 rounded-md text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Quitar Wishlist"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </div>

                      {/* Micro-barra de progreso de 2px cuando costoEstimado > 0 */}
                      {costoEstimado > 0 && (
                        <div className="w-full mt-0.5 space-y-1">
                          <div className="w-full h-0.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-sky-400 transition-[width] duration-300 ease-out rounded-full"
                              style={{
                                width: `${Math.min(100, Math.round((montoRealGastado / costoEstimado) * 100))}%`
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>
                              {Math.min(100, Math.round((montoRealGastado / costoEstimado) * 100))}% cubierto
                            </span>
                            <span>
                              {moneda === 'USD' ? '$' : 'S/'} {montoRealGastado.toFixed(2)} / {costoEstimado.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Segunda línea compacta si mostrarDetalleWishlist está activo o hay tienda/url */}
                      {(mostrarDetalleWishlist || tienda || urlReferencia) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-100">
                          <input
                            type="text"
                            value={tienda}
                            onChange={(e) => setTienda(e.target.value)}
                            placeholder="Tienda / Proveedor (ej. Amazon)"
                            className="flex-1 min-w-[140px] h-7 bg-slate-900/70 border border-slate-800 rounded-lg px-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                          />
                          <input
                            type="url"
                            value={urlReferencia}
                            onChange={(e) => setUrlReferencia(e.target.value)}
                            placeholder="URL de referencia (https://...)"
                            className="flex-1 min-w-[160px] h-7 bg-slate-900/70 border border-slate-800 rounded-lg px-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 font-mono text-[11px]"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 5. FOOTER UNIFICADO */}
              <div className="shrink-0 bg-[#040711]/95 backdrop-blur-md px-5 py-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                {/* Gestión de Etiquetas (#tags) */}
                <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                  {etiquetasLista.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleEliminarEtiqueta(tag)}
                        className="hover:text-rose-400 transition cursor-pointer"
                        title={`Eliminar #${tag}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}

                  <div className="relative inline-flex items-center gap-1" ref={refDropupTags}>
                    <span className="text-slate-500 font-mono text-xs">#</span>
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={nuevoTagInput}
                      onFocus={() => {
                        setTagInputEnfocado(true);
                        setSugerenciaActivaIdx(-1);
                      }}
                      onChange={(e) => {
                        setNuevoTagInput(e.target.value);
                        setTagInputEnfocado(true);
                        setSugerenciaActivaIdx(-1);
                      }}
                      onKeyDown={(e) => {
                        const tieneOpcionCrear = queryTagLimpia && !sugerenciasTags.includes(queryTagLimpia);
                        const totalOpciones = sugerenciasTags.length + (tieneOpcionCrear ? 1 : 0);

                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          if (totalOpciones > 0) {
                            setSugerenciaActivaIdx((prev) => (prev + 1) % totalOpciones);
                          }
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          if (totalOpciones > 0) {
                            setSugerenciaActivaIdx((prev) => (prev <= 0 ? totalOpciones - 1 : prev - 1));
                          }
                        } else if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          if (sugerenciaActivaIdx >= 0 && sugerenciaActivaIdx < sugerenciasTags.length) {
                            handleSeleccionarEtiqueta(sugerenciasTags[sugerenciaActivaIdx]);
                          } else if (tieneOpcionCrear && sugerenciaActivaIdx === sugerenciasTags.length) {
                            handleSeleccionarEtiqueta(queryTagLimpia);
                          } else {
                            handleAgregarEtiqueta();
                            setTagInputEnfocado(false);
                          }
                        } else if (e.key === 'Escape') {
                          if (tagInputEnfocado) {
                            e.preventDefault();
                            e.stopPropagation();
                            setTagInputEnfocado(false);
                            setSugerenciaActivaIdx(-1);
                          }
                        }
                      }}
                      placeholder="etiqueta (Enter)"
                      className="w-24 sm:w-28 bg-transparent border-0 outline-none text-xs text-slate-300 placeholder:text-slate-600 focus:ring-0 p-0 font-mono"
                    />

                    {/* Dropup Cobalt de Sugerencias de Etiquetas */}
                    {tagInputEnfocado && (sugerenciasTags.length > 0 || queryTagLimpia) && (
                      <div className="absolute bottom-[calc(100%+8px)] left-0 z-[200] w-56 max-h-44 overflow-y-auto p-1 rounded-xl bg-[#0D1526] border border-slate-700 shadow-[0_16px_36px_-6px_rgba(2,6,23,0.95)] custom-scrollbar flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                        {sugerenciasTags.map((tag, idx) => {
                          const esActiva = idx === sugerenciaActivaIdx;
                          return (
                            <button
                              key={tag}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSeleccionarEtiqueta(tag);
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                                esActiva
                                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                              }`}
                            >
                              <span className="truncate">#{tag}</span>
                              <span className="text-[10px] text-slate-500 font-sans">existente</span>
                            </button>
                          );
                        })}

                        {queryTagLimpia && !sugerenciasTags.includes(queryTagLimpia) && (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSeleccionarEtiqueta(queryTagLimpia);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono flex items-center gap-1.5 transition cursor-pointer ${
                              sugerenciaActivaIdx === sugerenciasTags.length
                                ? 'bg-sky-500/30 text-sky-200 font-bold'
                                : 'text-sky-300 bg-sky-950/40 hover:bg-sky-900/50'
                            }`}
                          >
                            <Plus className="w-3 h-3 shrink-0" />
                            <span className="truncate">Crear &quot;#{queryTagLimpia}&quot;</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-[transform,colors] duration-150 active:scale-95 cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-cobalt-1 transition-[transform,box-shadow] duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5"
                    title="Guardar nota (Ctrl+Enter)"
                  >
                    <span>{nota ? 'Guardar Cambios' : 'Crear Nota'}</span>
                    <span className="text-[10px] opacity-60 font-mono hidden sm:inline">Ctrl+↵</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>

          {/* Modal de Gestión de Vínculos de Entidades */}
          <ModalVincularEntidades
            isOpen={modalVincularAbierto}
            onClose={() => setModalVincularAbierto(false)}
            enlacesActuales={enlacesEntidades}
            onGuardarEnlaces={(nuevos) => setEnlacesEntidades(nuevos)}
          />
        </div>,
        document.body
      )
    : null;
};
