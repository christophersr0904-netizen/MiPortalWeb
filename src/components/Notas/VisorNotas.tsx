import React, { useState, useMemo, useDeferredValue, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { NotaRecord, WishlistMeta, CuadernoMeta } from '../../types';
import { SidebarCuadernos, CarruselCuadernosMovil, type SubFiltroRapido } from './SidebarCuadernos';
import { ModalCrearCuaderno } from './ModalCrearCuaderno';
import { ModalConvertirWishlistGasto } from '../Modals/ModalConvertirWishlistGasto';
import { normalizeNota } from '../../utils/entityNormalizer';
import { mostrarToastCobalt } from '../../utils/toastCobalt';
import { TarjetaNota } from './TarjetaNota';
import { EditorNotaModal } from './EditorNotaModal';
import {
  FileText,
  Search,
  Pin,
  CheckSquare,
  DollarSign,
  Tag,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  BookOpen,
  Plus,
  SlidersHorizontal
} from 'lucide-react';
import { useUndoDelete } from '../../hooks/useUndoDelete';

type ModoVista = 'masonry' | 'lista';

const TONOS_16 = [
  { id: '', label: 'Todos los tonos', dot: 'bg-white border border-slate-400' },
  { id: 'slate', label: 'Slate / Pizarra', dot: 'bg-slate-600' },
  { id: 'red', label: 'Red / Rojo', dot: 'bg-red-500' },
  { id: 'orange', label: 'Orange / Naranja', dot: 'bg-orange-500' },
  { id: 'amber', label: 'Amber / Ámbar', dot: 'bg-amber-500' },
  { id: 'yellow', label: 'Yellow / Amarillo', dot: 'bg-yellow-400' },
  { id: 'lime', label: 'Lime / Lima', dot: 'bg-lime-500' },
  { id: 'green', label: 'Green / Verde', dot: 'bg-green-500' },
  { id: 'emerald', label: 'Emerald / Esmeralda', dot: 'bg-emerald-500' },
  { id: 'teal', label: 'Teal / Turquesa', dot: 'bg-teal-500' },
  { id: 'cyan', label: 'Cyan / Cian', dot: 'bg-cyan-400' },
  { id: 'sky', label: 'Sky / Cielo', dot: 'bg-sky-500' },
  { id: 'blue', label: 'Blue / Azul', dot: 'bg-blue-500' },
  { id: 'indigo', label: 'Indigo / Índigo', dot: 'bg-indigo-500' },
  { id: 'violet', label: 'Violet / Violeta', dot: 'bg-purple-500' },
  { id: 'purple', label: 'Purple / Púrpura', dot: 'bg-purple-600' },
  { id: 'rose', label: 'Rose / Rosa', dot: 'bg-rose-500' }
];

export const VisorNotas: React.FC = () => {
  const [modoVista, setModoVista] = useState<ModoVista>('masonry');
  const [busqueda, setBusqueda] = useState('');
  const [subFiltro, setSubFiltro] = useState<SubFiltroRapido>('');
  const [tagsSeleccionados, setTagsSeleccionados] = useState<string[]>([]);
  const [colorFiltro, setColorFiltro] = useState<string>('');
  const [filtrosNotasAbiertos, setFiltrosNotasAbiertos] = useState(false);

  // Blocks Dinámicos
  const [blockActivo, setBlockActivo] = useState<string | null>(null); // null = todas, '__sin_block__' = sueltas
  const [blocksLocales, setBlocksLocales] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pmo_notas_blocks_custom');
      return saved ? JSON.parse(saved) : ['General', 'Proyectos', 'Personal', 'Ideas'];
    } catch {
      return ['General', 'Proyectos', 'Personal', 'Ideas'];
    }
  });

  const [cuadernosMeta, setCuadernosMeta] = useState<Record<string, CuadernoMeta>>(() => {
    try {
      const saved = localStorage.getItem('pmo_notas_cuadernos_meta');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [modalCrearCuadernoAbierto, setModalCrearCuadernoAbierto] = useState(false);

  // Control de colapso Sidebar Desktop con persistencia
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pmo_notas_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pmo_notas_sidebar_collapsed', String(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  }, []);

  // Dropdowns UI
  const [dropdownTagsAbierto, setDropdownTagsAbierto] = useState(false);
  const [dropdownColorAbierto, setDropdownColorAbierto] = useState(false);
  const [busquedaTagDropdown, setBusquedaTagDropdown] = useState('');

  // Quick Note Box State (Google Keep style)
  const [quickExpanded, setQuickExpanded] = useState(false);
  const [quickTitulo, setQuickTitulo] = useState('');
  const [quickContenido, setQuickContenido] = useState('');
  const [quickTipo, setQuickTipo] = useState<'texto' | 'checklist' | 'wishlist'>('texto');
  const [quickEsFijada, setQuickEsFijada] = useState(false);
  const [quickColor, setQuickColor] = useState('default');
  const [quickColorPickerAbierto, setQuickColorPickerAbierto] = useState(false);
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [quickNuevoTag, setQuickNuevoTag] = useState('');
  const [quickChecklistItems, setQuickChecklistItems] = useState<Array<{ id: string; texto: string; completado: boolean }>>([]);
  const [quickNuevoCheckItem, setQuickNuevoCheckItem] = useState('');
  const [quickWishlistMoneda, setQuickWishlistMoneda] = useState<'PEN' | 'USD'>('PEN');
  const [quickWishlistCosto, setQuickWishlistCosto] = useState<number>(0);
  const [quickWishlistNivel, setQuickWishlistNivel] = useState<string>('Media');
  const [quickWishlistEnlace, setQuickWishlistEnlace] = useState<string>('');

  // Wishlist Conseguidos Colapsable
  const [mostrarConseguidos, setMostrarConseguidos] = useState(false);

  // Modal 360°
  const [modalAbierto, setModalAbierto] = useState(false);
  const [notaEnEdicion, setNotaEnEdicion] = useState<NotaRecord | null>(null);

  // Single Instance Modal para Wishlist
  const [notaParaConvertirGasto, setNotaParaConvertirGasto] = useState<NotaRecord | null>(null);

  // Concurrencia de Búsqueda React 19 (Zero Frame Drops)
  const deferredBusqueda = useDeferredValue(busqueda);

  // UndoDelete Integration y Toast Reactivo
  const { programarEliminacion, estaOculto } = useUndoDelete();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Carga reactiva de notas con normalizador tolerante a fallos y filtro de exclusión reactiva UndoDelete
  const rawList = useLiveQuery(() => db.notas.toArray(), []) ?? [];
  const notasRaw = useMemo(() => {
    return rawList
      .filter((n) => !estaOculto(n.id) && !estaOculto(n.codigo_legado))
      .map((n) => normalizeNota(n));
  }, [rawList, estaOculto]);

  // Callbacks memoizados para erradicar re-evaluación en cascada de tarjetas
  const handleEditar = useCallback((n: NotaRecord) => {
    setNotaEnEdicion(n);
    setModalAbierto(true);
  }, []);

  const handleEliminarNota = useCallback((id: string) => {
    const nota = notasRaw.find((n) => n.id === id);
    const titulo = nota?.titulo || 'Nota';
    programarEliminacion({
      tabla: 'notas',
      id,
      etiqueta: `Nota: ${titulo}`,
      tipo: 'NOTA',
      commit: async () => {
        await db.notas.delete(id);
      }
    });
  }, [notasRaw, programarEliminacion]);

  const handleAbrirConvertirGasto = useCallback((nota: NotaRecord) => {
    const costoEstimado = Number(nota.wishlist_json?.costoEstimado || 0);
    if (!nota.wishlist_json || costoEstimado <= 0) return;
    setNotaParaConvertirGasto(nota);
  }, []);

  const handleConfirmarConvertirGasto = useCallback(async () => {
    if (!notaParaConvertirGasto) return;
    const costoEstimado = Number(notaParaConvertirGasto.wishlist_json?.costoEstimado || 0);
    const moneda = notaParaConvertirGasto.wishlist_json?.moneda || 'PEN';
    const nowIso = new Date().toISOString();
    const count = await db.gastos.count();
    const montoPen = moneda === 'USD' ? costoEstimado * 3.75 : costoEstimado;

    await db.gastos.add({
      id: crypto.randomUUID ? crypto.randomUUID() : `gas_${Date.now()}`,
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: `GAS-${String(count + 1).padStart(3, '0')}`,
      tipo_origen: 'Personal',
      categoria_gasto: 'Deseos / Wishlist',
      fecha_gasto: nowIso.split('T')[0],
      descripcion_gasto: `Wishlist: ${notaParaConvertirGasto.titulo}`,
      moneda_original: moneda,
      monto_original: costoEstimado,
      tipo_cambio: 3.75,
      monto_pen: montoPen,
      estado_pago: 'PAGADO',
      updated_at: nowIso,
      sync_status: 'pending'
    });

    await db.notas.update(notaParaConvertirGasto.id, {
      wishlist_json: {
        ...notaParaConvertirGasto.wishlist_json,
        montoRealGastado: costoEstimado,
        estado: 'CONSEGUIDO'
      },
      updated_at: nowIso
    });

    setNotaParaConvertirGasto(null);
  }, [notaParaConvertirGasto]);

  // Catálogo unificado de blocks únicos
  const bloquesUnicos = useMemo(() => {
    const set = new Set<string>(blocksLocales);
    notasRaw.forEach((n) => {
      if (n.block_nombre && n.block_nombre.trim()) {
        set.add(n.block_nombre.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notasRaw, blocksLocales]);

  // Asegurar que cada block único tenga representación en cuadernosMeta con fallback resiliente
  const catalogoCuadernosMeta = useMemo(() => {
    const resultado: Record<string, CuadernoMeta> = { ...cuadernosMeta };
    bloquesUnicos.forEach((block) => {
      if (!resultado[block]) {
        resultado[block] = {
          id: 'cua_legacy_' + encodeURIComponent(block),
          nombre: block,
          descripcion: '',
          icono: 'Folder',
          created_at: new Date(0).toISOString()
        };
      }
    });
    return resultado;
  }, [bloquesUnicos, cuadernosMeta]);

  // Conteo reactivo de notas por block
  const conteoPorBlock = useMemo(() => {
    const mapa: Record<string, number> = {
      __todas__: notasRaw.length,
      __sin_block__: 0
    };
    bloquesUnicos.forEach((b) => {
      mapa[b] = 0;
    });
    notasRaw.forEach((n) => {
      const b = (n.block_nombre || '').trim();
      if (!b) {
        mapa.__sin_block__ = (mapa.__sin_block__ || 0) + 1;
      } else {
        mapa[b] = (mapa[b] || 0) + 1;
      }
    });
    return mapa;
  }, [notasRaw, bloquesUnicos]);

  // Catálogo completo de etiquetas
  const catalogoEtiquetas = useMemo(() => {
    const set = new Set<string>();
    notasRaw.forEach((n) => {
      (n.etiquetas || []).forEach((t) => {
        if (t && typeof t === 'string') set.add(t.toLowerCase());
      });
    });
    return Array.from(set).sort();
  }, [notasRaw]);

  // Creación dinámica de nuevo block mediante modal declarativo
  const handleGuardarCuaderno = ({
    nombre,
    descripcion,
    icono,
    color
  }: {
    nombre: string;
    descripcion: string;
    icono: string;
    color?: string;
  }) => {
    const nuevoMeta: CuadernoMeta = {
      id: 'cua_' + Date.now().toString(36),
      nombre,
      descripcion,
      icono,
      color,
      created_at: new Date().toISOString()
    };
    const actualizadosMeta = {
      ...cuadernosMeta,
      [nombre]: nuevoMeta
    };
    setCuadernosMeta(actualizadosMeta);
    try {
      localStorage.setItem('pmo_notas_cuadernos_meta', JSON.stringify(actualizadosMeta));
    } catch {
      // ignore storage error
    }
    if (!blocksLocales.includes(nombre)) {
      const actualizados = [...blocksLocales, nombre];
      setBlocksLocales(actualizados);
      try {
        localStorage.setItem('pmo_notas_blocks_custom', JSON.stringify(actualizados));
      } catch {
        // ignore storage error
      }
    }
    setBlockActivo(nombre);
  };

  // Eliminación de cuaderno y desvinculación atómica en Dexie para notas huérfanas
  const handleEliminarCuaderno = useCallback(
    async (nombreBlock: string) => {
      try {
        const nowIso = new Date().toISOString();
        // 1. Desvincular en Dexie para evitar resurrección de notas huérfanas en bloquesUnicos
        await db.notas.where('block_nombre').equals(nombreBlock).modify({
          block_nombre: '',
          updated_at: nowIso,
          sync_status: 'pending'
        });

        // 2. Limpiar de blocksLocales
        const nuevosBlocks = blocksLocales.filter((b) => b !== nombreBlock);
        setBlocksLocales(nuevosBlocks);
        try {
          localStorage.setItem('pmo_notas_blocks_custom', JSON.stringify(nuevosBlocks));
        } catch {
          // ignore storage error
        }

        // 3. Limpiar de cuadernosMeta
        const nuevosMeta = { ...cuadernosMeta };
        delete nuevosMeta[nombreBlock];
        setCuadernosMeta(nuevosMeta);
        try {
          localStorage.setItem('pmo_notas_cuadernos_meta', JSON.stringify(nuevosMeta));
        } catch {
          // ignore storage error
        }

        if (blockActivo === nombreBlock) {
          setBlockActivo(null);
        }

        mostrarToastCobalt(`Cuaderno "${nombreBlock}" eliminado. Sus notas pasaron a Sueltas.`, 'success');
      } catch (err) {
        console.error('Error al eliminar cuaderno:', err);
        mostrarToastCobalt('Error al eliminar el cuaderno', 'error');
      }
    },
    [blocksLocales, cuadernosMeta, blockActivo]
  );

  // Filtrado reactivo de notas
  const { notasFijadas, notasOtras, notasConseguidasWishlist } = useMemo(() => {
    let resultado = [...notasRaw];

    // 1. Filtro por Block Dinámico
    if (blockActivo === '__sin_block__') {
      resultado = resultado.filter((n) => !n.block_nombre || n.block_nombre.trim() === '');
    } else if (blockActivo) {
      resultado = resultado.filter((n) => n.block_nombre === blockActivo);
    }

    // 2. Subfiltros Rápidos
    if (subFiltro === 'FIJADAS') {
      resultado = resultado.filter((n) => n.es_fijada);
    } else if (subFiltro === 'ADJUNTOS') {
      resultado = resultado.filter((n) => n.adjuntos_drive_json && n.adjuntos_drive_json.length > 0);
    } else if (subFiltro === 'VINCULADAS') {
      resultado = resultado.filter(
        (n) => (n.enlaces_entidades_json && n.enlaces_entidades_json.length > 0) || (n.contenido_markdown || '').includes('@')
      );
    } else if (subFiltro === 'CHECKLIST') {
      resultado = resultado.filter(
        (n) => n.tipo_nota === 'CHECKLIST' || (n.checklists_json && n.checklists_json.length > 0)
      );
    } else if (subFiltro === 'WISHLIST') {
      resultado = resultado.filter((n) => n.tipo_nota === 'WISHLIST' || (n.wishlist_json && (n.wishlist_json.costoEstimado || 0) > 0));
    }

    // 3. Filtro por Color
    if (colorFiltro) {
      resultado = resultado.filter((n) => n.color_tema === colorFiltro);
    }

    // 4. Filtro Multi-Tag
    if (tagsSeleccionados.length > 0) {
      resultado = resultado.filter((n) => {
        const misTags = (n.etiquetas || []).map((t) => (t || '').toLowerCase());
        return tagsSeleccionados.every((sel) => misTags.includes(sel.toLowerCase()));
      });
    }

    // 5. Búsqueda en vivo concurrente tolerante a nulls vinculada a deferredBusqueda
    if (deferredBusqueda.trim()) {
      const q = deferredBusqueda.toLowerCase();
      resultado = resultado.filter(
        (n) =>
          (n.titulo || '').toLowerCase().includes(q) ||
          (n.contenido_markdown || '').toLowerCase().includes(q) ||
          (n.etiquetas || []).some((t) => (t || '').toLowerCase().includes(q))
      );
    }

    // 6. Ordenar por updated_at descendente (comparación lexicográfica ISO ultraligera sin new Date)
    resultado.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));

    // Separar deseos conseguidos/archivados
    const conseguidos = resultado.filter(
      (n) => n.wishlist_json?.estado === 'CONSEGUIDO' || n.wishlist_json?.estado === 'ARCHIVADO'
    );
    const activos = resultado.filter(
      (n) => n.wishlist_json?.estado !== 'CONSEGUIDO' && n.wishlist_json?.estado !== 'ARCHIVADO'
    );

    return {
      notasFijadas: activos.filter((n) => n.es_fijada),
      notasOtras: activos.filter((n) => !n.es_fijada),
      notasConseguidasWishlist: conseguidos
    };
  }, [notasRaw, blockActivo, subFiltro, colorFiltro, tagsSeleccionados, deferredBusqueda]);

  // Manejo de Quick Note (Inyecta blockActivo automáticamente)
  const handleGuardarQuickNota = async () => {
    if (!quickTitulo.trim() && !quickContenido.trim() && quickChecklistItems.length === 0) {
      setQuickExpanded(false);
      return;
    }

    const nowIso = new Date().toISOString();
    const count = await db.notas.count();
    const codigoLegado = `NOT-${String(count + 1).padStart(3, '0')}`;

    let wishlistPayload: WishlistMeta | undefined = undefined;
    if (quickTipo === 'wishlist' && quickWishlistCosto > 0) {
      wishlistPayload = {
        costoEstimado: quickWishlistCosto,
        montoRealGastado: 0,
        moneda: quickWishlistMoneda,
        prioridad: 'MEDIA',
        comprado: false,
        urlReferencia: quickWishlistEnlace,
        estado: 'DESEADO'
      };
    }

    const blockAsignado = blockActivo && blockActivo !== '__sin_block__' ? blockActivo : undefined;

    await db.notas.add({
      id: crypto.randomUUID ? crypto.randomUUID() : `not_${Date.now()}`,
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: codigoLegado,
      titulo: quickTitulo.trim() || 'Nota Rápida',
      contenido_markdown: quickContenido.trim(),
      tipo_nota: quickTipo === 'wishlist' ? 'WISHLIST' : quickTipo === 'checklist' ? 'CHECKLIST' : 'TEXTO',
      checklists_json: quickChecklistItems,
      wishlist_json: wishlistPayload,
      color_tema: quickColor,
      es_fijada: quickEsFijada,
      block_nombre: blockAsignado,
      adjuntos_drive_json: [],
      enlaces_entidades_json: [],
      etiquetas: quickTags,
      created_at: nowIso,
      updated_at: nowIso,
      version: 1,
      sync_status: 'pending'
    });

    // Reset formulario
    setQuickTitulo('');
    setQuickContenido('');
    setQuickTipo('texto');
    setQuickEsFijada(false);
    setQuickColor('default');
    setQuickTags([]);
    setQuickChecklistItems([]);
    setQuickWishlistCosto(0);
    setQuickWishlistEnlace('');
    setQuickExpanded(false);

    setToastMsg('Nota guardada en ' + (blockAsignado ? `"${blockAsignado}"` : 'Notas'));
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  const handleAgregarCheckItem = () => {
    if (!quickNuevoCheckItem.trim()) return;
    setQuickChecklistItems([
      ...quickChecklistItems,
      { id: `chk_${Date.now()}_${Math.random()}`, texto: quickNuevoCheckItem.trim(), completado: false }
    ]);
    setQuickNuevoCheckItem('');
  };

  const handleAgregarTagQuick = (tagText: string) => {
    const t = tagText.trim().replace(/^#/, '').toLowerCase();
    if (t && !quickTags.includes(t)) {
      setQuickTags([...quickTags, t]);
    }
    setQuickNuevoTag('');
  };

  const limpiarTodosLosFiltros = () => {
    setBusqueda('');
    setSubFiltro('');
    setTagsSeleccionados([]);
    setColorFiltro('');
    setBlockActivo(null);
  };

  const hayFiltrosActivos = busqueda || subFiltro || tagsSeleccionados.length > 0 || colorFiltro || blockActivo !== null;

  return (
    <div
      id="visor-notas-main"
      className={`grid grid-cols-1 ${
        isSidebarCollapsed ? 'md:grid-cols-[64px_1fr]' : 'md:grid-cols-[256px_1fr]'
      } transition-[grid-template-columns] duration-300 ease-out w-full h-full flex-1 min-h-0 bg-[#040711] text-slate-100 relative select-none overflow-hidden`}
    >
      {/* ===================================================================== */}
      {/* 1. SIDEBAR DE BLOCKS (CUADERNOS) - DESKTOP                           */}
      {/* ===================================================================== */}
      <SidebarCuadernos
        blockActivo={blockActivo}
        setBlockActivo={setBlockActivo}
        bloquesUnicos={bloquesUnicos}
        conteoPorBlock={conteoPorBlock}
        subFiltro={subFiltro}
        setSubFiltro={setSubFiltro}
        cuadernosMeta={catalogoCuadernosMeta}
        onAbrirModalCrear={() => setModalCrearCuadernoAbierto(true)}
        onEliminarCuaderno={handleEliminarCuaderno}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* ===================================================================== */}
      {/* 2. ÁREA CENTRAL: CANVAS DE NOTAS, HERRAMIENTAS Y QUICK NOTE           */}
      {/* ===================================================================== */}
      <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
        {/* BARRA SUPERIOR DE HERRAMIENTAS */}
        <div className="shrink-0 bg-[#0D1526]/85 backdrop-blur-md border-b border-slate-800/40 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 shadow-cobalt-1 z-10 h-10 sm:h-auto">
          {/* Lado Izquierdo: Título y Block Activo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-orange-500 flex items-center justify-center font-bold text-white shadow-md shadow-amber-500/20 ring-1 ring-white/20 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-100 leading-none truncate max-w-[120px] sm:max-w-none">
                  {blockActivo === '__sin_block__'
                    ? 'Notas Sueltas'
                    : blockActivo
                    ? `Block: ${blockActivo}`
                    : 'Notas'}
                </h2>
                <span
                  id="badge-total-notas"
                  className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono tabular-nums font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30 shrink-0"
                >
                  {notasRaw.length}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 mt-0.5">
                {blockActivo ? `Filtrando por cuaderno "${blockActivo}"` : 'Modular Compuesto: Texto + Checklists + Wishlist'}
              </p>
            </div>
          </div>

          {/* Lado Derecho: Conmutador de Vistas y Botón '+ Nueva Nota' */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
            {/* Conmutador de Vista (Desktop) */}
            <div className="hidden sm:flex items-center p-0.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
              <button
                type="button"
                id="btn-vista-notas-masonry"
                onClick={() => setModoVista('masonry')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  modoVista === 'masonry'
                    ? 'text-sky-300 bg-sky-950/40 border border-sky-500/30 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vista Mosaico Dinámico (Masonry Grid)"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                type="button"
                id="btn-vista-notas-lista"
                onClick={() => setModoVista('lista')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  modoVista === 'lista'
                    ? 'text-sky-300 bg-sky-950/40 border border-sky-500/30 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vista Lista Compacta"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>

            {/* Botón Crear Nota Modal 360° */}
            <button
              type="button"
              id="btn-nueva-nota-principal"
              onClick={() => {
                setNotaEnEdicion(null);
                setModalAbierto(true);
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 transition shadow-sm shadow-amber-500/20 cursor-pointer h-7 sm:h-auto"
              title="Crear nota detallada con modal 360°"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-[11px] sm:text-xs">Nueva Nota</span>
            </button>
          </div>
        </div>

        {/* NIVEL SECUNDARIO: Búsqueda Rápida y Filtros de Refinamiento */}
        <div className="shrink-0 bg-[#0D1526]/50 backdrop-blur-xs border-b border-slate-800/40 px-3 sm:px-6 py-1.5 sm:py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 z-10">
          {/* Fila compacta de búsqueda + botón de filtros móvil */}
          <div className="flex items-center gap-2 w-full md:max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="input-busqueda-notas"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar notas, checklists o #tags..."
                className="w-full h-8 pl-8 pr-7 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-sky-500 focus:border-sky-500/60 transition-all outline-none"
              />
              {busqueda && (
                <button
                  type="button"
                  id="btn-limpiar-busqueda-notas"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFiltrosNotasAbiertos(!filtrosNotasAbiertos)}
              className={`h-8 px-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer shrink-0 md:hidden ${
                (tagsSeleccionados.length > 0 || colorFiltro) || filtrosNotasAbiertos
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Filtros</span>
              {(tagsSeleccionados.length > 0 || colorFiltro) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Refinamiento: Tags, Color y Limpieza (Desplegable en móvil, visible en md:) */}
          <div className={`${filtrosNotasAbiertos ? 'flex' : 'hidden md:flex'} flex-wrap items-center gap-1.5 justify-start md:justify-end pt-1 md:pt-0 border-t md:border-t-0 border-slate-800/40`}>
            {/* Conmutador de vista en móvil cuando se abren filtros */}
            <div className="flex sm:hidden items-center p-0.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => setModoVista('masonry')}
                className={`p-1 rounded-lg transition ${
                  modoVista === 'masonry' ? 'text-sky-300 bg-sky-950/40' : 'text-slate-400'
                }`}
                title="Vista Mosaico"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setModoVista('lista')}
                className={`p-1 rounded-lg transition ${
                  modoVista === 'lista' ? 'text-sky-300 bg-sky-950/40' : 'text-slate-400'
                }`}
                title="Vista Lista"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Selector de Filtro de Etiquetas */}
            <div className="relative inline-block" id="dropdown-filtro-etiquetas-notas-wrap">
              <button
                type="button"
                id="btn-filtro-etiquetas-notas"
                onClick={() => setDropdownTagsAbierto(!dropdownTagsAbierto)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 bg-slate-900/80 border border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                title="Filtrar por etiqueta"
              >
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span id="label-filtro-etiqueta-activa" className="hidden sm:inline">Tags</span>
                {tagsSeleccionados.length > 0 && (
                  <span id="badge-filtro-etiqueta-activa" className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500 text-slate-950">
                    {tagsSeleccionados.length}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Dropdown flotante de etiquetas con buscador */}
              {dropdownTagsAbierto && (
                <div
                  id="dropdown-etiquetas-notas-menu"
                  className="absolute right-0 mt-1 w-64 bg-[#0D1526] rounded-2xl shadow-xl border border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center justify-between">
                    <span>Filtrar por Tags</span>
                    <button
                      type="button"
                      onClick={() => setTagsSeleccionados([])}
                      className="text-amber-400 hover:underline text-[9px] font-bold normal-case cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="px-1 py-1">
                    <input
                      type="text"
                      id="input-buscar-crear-filtro-tag"
                      placeholder="Buscar etiqueta..."
                      value={busquedaTagDropdown}
                      onChange={(e) => setBusquedaTagDropdown(e.target.value)}
                      className="w-full text-xs px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div id="lista-etiquetas-filtro-dropdown" className="space-y-0.5 mt-1 max-h-56 overflow-y-auto custom-scrollbar">
                    {catalogoEtiquetas
                      .filter((t) => t.includes(busquedaTagDropdown.toLowerCase()))
                      .map((t) => {
                        const sel = tagsSeleccionados.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              if (sel) setTagsSeleccionados(tagsSeleccionados.filter((x) => x !== t));
                              else setTagsSeleccionados([...tagsSeleccionados, t]);
                            }}
                            className={`w-full text-left px-2 py-1 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                              sel ? 'bg-amber-500/15 text-amber-300' : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <span>#{t}</span>
                            {sel && <CheckSquare className="w-3.5 h-3.5 text-amber-500" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Filtro de Color Sutil */}
            <div className="relative inline-block" id="dropdown-filtro-color-notas-wrap">
              <button
                type="button"
                id="btn-filtro-color-notas"
                onClick={() => setDropdownColorAbierto(!dropdownColorAbierto)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 bg-slate-900/80 border border-slate-800 transition cursor-pointer"
                title="Filtrar por color / tono"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400 inline-block"></span>
              </button>

              {dropdownColorAbierto && (
                <div
                  id="dropdown-color-notas-menu"
                  className="absolute right-0 mt-1 w-56 max-h-80 overflow-y-auto custom-scrollbar bg-[#0D1526] rounded-2xl shadow-xl border border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Filtrar por Tono
                  </div>
                  {TONOS_16.map((tono) => (
                    <button
                      key={tono.id}
                      type="button"
                      onClick={() => {
                        setColorFiltro(tono.id);
                        setDropdownColorAbierto(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                        colorFiltro === tono.id
                          ? 'bg-amber-500/15 text-amber-300 font-bold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${tono.dot}`}></span>
                      <span>{tono.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botón Limpiar Filtros */}
            {hayFiltrosActivos && (
              <button
                type="button"
                id="btn-limpiar-filtros-notas"
                onClick={limpiarTodosLosFiltros}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition flex items-center gap-1 active:scale-95 cursor-pointer"
                title="Restablecer todos los filtros"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Carrusel Deslizable de Blocks para Móviles (< md) */}
        <CarruselCuadernosMovil
          blockActivo={blockActivo}
          setBlockActivo={setBlockActivo}
          bloquesUnicos={bloquesUnicos}
          conteoPorBlock={conteoPorBlock}
          cuadernosMeta={catalogoCuadernosMeta}
          onAbrirModalCrear={() => setModalCrearCuadernoAbierto(true)}
        />

        {/* DISPARADOR MÓVIL DE CREACIÓN RÁPIDA (H-8) */}
        <div className="md:hidden shrink-0 px-3 pt-1.5 pb-0.5">
          <button
            type="button"
            onClick={() => {
              setNotaEnEdicion(null);
              setModalAbierto(true);
            }}
            className="w-full h-8 text-xs text-slate-400 border border-dashed border-slate-800 hover:border-amber-500/50 hover:text-amber-300 rounded-xl px-3 flex items-center justify-between bg-[#0D1526]/60 active:scale-[0.98] transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">
                {blockActivo && blockActivo !== '__sin_block__'
                  ? `Tomar nota en "${blockActivo}"...`
                  : 'Tomar nota rápida...'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <CheckSquare className="w-3.5 h-3.5" />
              <DollarSign className="w-3.5 h-3.5" />
              <Plus className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </button>
        </div>

        {/* CONTENEDOR EXPANDIBLE DE CREACIÓN RÁPIDA (GOOGLE KEEP STYLE - DESKTOP) */}
        <div className="hidden md:block shrink-0 w-full max-w-2xl mx-auto px-4 pt-3 pb-1 z-10 min-h-[4rem]">
          <div
            id="quick-note-box"
            className={`bg-[#0D1526] rounded-2xl border border-slate-800/80 shadow-cobalt-1 relative overflow-hidden group ${
              quickExpanded ? 'max-h-[700px]' : 'max-h-14'
            }`}
          >
            {/* ESTADO COLAPSADO */}
            {!quickExpanded ? (
              <div
                id="quick-note-collapsed"
                onClick={() => setQuickExpanded(true)}
                className="p-3 flex items-center justify-between gap-3 cursor-text"
              >
                <div className="flex items-center gap-2.5 text-slate-400 text-xs font-medium flex-1">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    {blockActivo && blockActivo !== '__sin_block__'
                      ? `Tomar nota en Block "${blockActivo}"...`
                      : 'Tomar una nota rápida, checklist o escribe @...'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickTipo('checklist');
                      setQuickExpanded(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer"
                    title="Nueva lista de verificación"
                  >
                    <CheckSquare className="w-4 h-4 text-sky-400" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickTipo('wishlist');
                      setQuickExpanded(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer"
                    title="Nuevo deseo / wishlist"
                  >
                    <DollarSign className="w-4 h-4 text-purple-400" />
                  </button>
                </div>
              </div>
            ) : (
              /* ESTADO EXPANDIDO */
              <div id="quick-note-expanded" className="flex flex-col p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    id="quick-note-title"
                    placeholder="Título de la nota..."
                    value={quickTitulo}
                    onChange={(e) => setQuickTitulo(e.target.value)}
                    className="w-full text-sm font-bold text-slate-100 placeholder-slate-500 bg-transparent border-none outline-none focus:ring-0 p-0"
                  />
                  <button
                    type="button"
                    id="quick-note-pin-btn"
                    onClick={() => setQuickEsFijada(!quickEsFijada)}
                    className={`p-1.5 rounded-xl transition active:scale-90 cursor-pointer ${
                      quickEsFijada
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                    }`}
                    title="Fijar nota en la parte superior"
                  >
                    <Pin className={`w-3.5 h-3.5 ${quickEsFijada ? 'fill-amber-400 rotate-45' : ''}`} />
                  </button>
                </div>

                {/* Badges de Modo & Block */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="quick-mode-text-btn"
                      onClick={() => setQuickTipo('texto')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                        quickTipo === 'texto'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nota</span>
                    </button>
                    <button
                      type="button"
                      id="quick-mode-check-btn"
                      onClick={() => setQuickTipo('checklist')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition inline-flex items-center gap-1.5 cursor-pointer ${
                        quickTipo === 'checklist'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                      <span>Checklist</span>
                    </button>
                    <button
                      type="button"
                      id="quick-mode-wishlist-btn"
                      onClick={() => setQuickTipo('wishlist')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition inline-flex items-center gap-1.5 cursor-pointer ${
                        quickTipo === 'wishlist'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                      <span>WishList</span>
                    </button>
                  </div>

                  {blockActivo && blockActivo !== '__sin_block__' && (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-sky-400" />
                      <span>{blockActivo}</span>
                    </span>
                  )}
                </div>

                {/* Campos Wishlist */}
                {quickTipo === 'wishlist' && (
                  <div
                    id="quick-note-wishlist-fields"
                    className="flex flex-col space-y-2 p-2.5 rounded-xl bg-purple-950/20 border border-purple-900/40 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                          Costo Estimado
                        </label>
                        <div className="flex items-center gap-1">
                          <select
                            id="quick-wishlist-moneda"
                            value={quickWishlistMoneda}
                            onChange={(e) => setQuickWishlistMoneda(e.target.value as 'PEN' | 'USD')}
                            className="text-xs font-bold rounded-lg bg-slate-900 border border-purple-700/60 px-2 py-1 text-slate-100 outline-none"
                          >
                            <option value="PEN">S/</option>
                            <option value="USD">$</option>
                          </select>
                          <input
                            type="number"
                            id="quick-wishlist-costo"
                            step="0.01"
                            min="0"
                            value={quickWishlistCosto || ''}
                            onChange={(e) => setQuickWishlistCosto(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full text-xs font-mono font-bold rounded-lg bg-slate-900 border border-purple-700/60 px-2.5 py-1 text-slate-100 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                          Nivel de Deseo
                        </label>
                        <select
                          id="quick-wishlist-nivel"
                          value={quickWishlistNivel}
                          onChange={(e) => setQuickWishlistNivel(e.target.value)}
                          className="w-full text-xs font-semibold rounded-lg bg-slate-900 border border-purple-700/60 px-2 py-1 text-slate-100 outline-none"
                        >
                          <option value="Alta">Alta Prioridad</option>
                          <option value="Media">Media</option>
                          <option value="Baja">Baja / Capricho</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                          Enlace de Referencia
                        </label>
                        <input
                          type="url"
                          id="quick-wishlist-enlace"
                          placeholder="https://..."
                          value={quickWishlistEnlace}
                          onChange={(e) => setQuickWishlistEnlace(e.target.value)}
                          className="w-full text-xs rounded-lg bg-slate-900 border border-purple-700/60 px-2.5 py-1 text-slate-100 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Área de Texto Libre */}
                <div id="quick-note-text-container">
                  <textarea
                    id="quick-note-content"
                    rows={3}
                    value={quickContenido}
                    onChange={(e) => setQuickContenido(e.target.value)}
                    placeholder="Escribe tus notas, reflexiones o detalles... Escribe @ para vincular con Proyectos o Tareas..."
                    className="w-full text-xs text-slate-200 placeholder-slate-500 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none custom-scrollbar leading-relaxed"
                  />
                </div>

                {/* Área de Checklist Dinámica */}
                {quickTipo === 'checklist' && (
                  <div id="quick-note-checklist-container" className="flex flex-col space-y-2">
                    <div id="quick-note-checklist-list" className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                      {quickChecklistItems.map((chk, idx) => (
                        <div key={chk.id} className="flex items-center gap-2 text-xs">
                          <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                          <span className="text-slate-200 flex-1">{chk.texto}</span>
                          <button
                            type="button"
                            onClick={() => setQuickChecklistItems(quickChecklistItems.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 flex items-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-slate-500 text-xs">＋</span>
                      <input
                        type="text"
                        id="quick-note-new-item-input"
                        value={quickNuevoCheckItem}
                        onChange={(e) => setQuickNuevoCheckItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAgregarCheckItem();
                          }
                        }}
                        placeholder="Elemento de lista... (Presiona Enter)"
                        className="w-full text-xs text-slate-200 placeholder-slate-500 bg-transparent border-none outline-none focus:ring-0 p-0"
                      />
                      <button
                        type="button"
                        onClick={handleAgregarCheckItem}
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}

                {/* Fila de Etiquetas Rápidas */}
                <div id="quick-note-tags-container" className="relative pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>Tags:</span>
                    </span>
                    <div id="quick-note-tags-list" className="flex flex-wrap items-center gap-1.5">
                      {quickTags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => setQuickTags(quickTags.filter((x) => x !== t))}
                            className="hover:text-rose-400 cursor-pointer flex items-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="relative inline-block flex-1 min-w-[140px]">
                      <input
                        type="text"
                        id="quick-note-new-tag-input"
                        value={quickNuevoTag}
                        onChange={(e) => setQuickNuevoTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAgregarTagQuick(quickNuevoTag);
                          }
                        }}
                        placeholder="+ Añadir etiqueta (Enter)..."
                        className="w-full text-xs text-slate-200 placeholder-slate-500 bg-transparent border-none outline-none focus:ring-0 p-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Barra Inferior de Acciones y Paleta de Colores */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="relative inline-block" id="quick-note-color-picker-wrap">
                    <button
                      type="button"
                      id="quick-note-btn-palette"
                      onClick={() => setQuickColorPickerAbierto(!quickColorPickerAbierto)}
                      className="p-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 transition shadow-2xs flex items-center gap-1.5 text-slate-300 cursor-pointer"
                      title="Seleccionar tono de nota"
                    >
                      <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400 inline-block shadow-2xs"></span>
                      <span id="quick-note-color-label" className="text-[11px] font-semibold hidden sm:inline">Color</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {quickColorPickerAbierto && (
                      <div
                        id="quick-note-color-picker-popover"
                        className="absolute left-0 bottom-full mb-2 w-48 bg-[#0D1526] rounded-2xl shadow-xl border border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Tono de Nota</div>
                        <div className="grid grid-cols-4 gap-1.5 p-1">
                          {['default', 'emerald', 'indigo', 'amber', 'rose', 'sky', 'violet', 'slate'].map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => {
                                setQuickColor(col);
                                setQuickColorPickerAbierto(false);
                              }}
                              className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                            >
                              <span className={`w-5 h-5 rounded-full border border-slate-600 ${col === 'default' ? 'bg-slate-900' : `bg-${col}-500`}`} />
                              <span className="text-[9px] text-slate-400 capitalize">{col.slice(0, 4)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickExpanded(false)}
                      className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      onClick={handleGuardarQuickNota}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 shadow-sm transition cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENEDOR DE SCROLL: NOTAS FIJADAS Y OTRAS NOTAS */}
        <div id="contenedor-scroll-notas" className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-2.5 sm:px-6 pt-2 sm:pt-3 pb-24 sm:pb-32 space-y-3.5 sm:space-y-6">
          {/* SECCIÓN: NOTAS FIJADAS */}
          {notasFijadas.length > 0 && (
            <div id="seccion-notas-fijadas" className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45" />
                  Fijadas
                </span>
                <span
                  id="badge-count-fijadas"
                  className="px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30"
                >
                  {notasFijadas.length}
                </span>
              </div>

              <div
                id="grid-notas-fijadas"
                className={modoVista === 'masonry' ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-2.5 sm:gap-4 space-y-2.5 sm:space-y-4' : 'flex flex-col gap-2'}
              >
                {notasFijadas.map((nota) => (
                  <TarjetaNota
                    key={nota.id}
                    nota={nota}
                    modoVista={modoVista}
                    onEditar={handleEditar}
                    onEliminar={handleEliminarNota}
                    onConvertirEnGasto={handleAbrirConvertirGasto}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN: OTRAS NOTAS */}
          {notasOtras.length > 0 && (
            <div id="seccion-notas-otras" className="space-y-3">
              {notasFijadas.length > 0 && (
                <div id="header-notas-otras" className="flex items-center gap-2 px-1">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Otras Notas
                  </span>
                  <span
                    id="badge-count-otras"
                    className="px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums font-bold bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    {notasOtras.length}
                  </span>
                </div>
              )}

              <div
                id="grid-notas-otras"
                className={modoVista === 'masonry' ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-2.5 sm:gap-4 space-y-2.5 sm:space-y-4' : 'flex flex-col gap-2'}
              >
                {notasOtras.map((nota) => (
                  <TarjetaNota
                    key={nota.id}
                    nota={nota}
                    modoVista={modoVista}
                    onEditar={handleEditar}
                    onEliminar={handleEliminarNota}
                    onConvertirEnGasto={handleAbrirConvertirGasto}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN COLAPSABLE: WISHLIST CONSEGUIDOS / ARCHIVADOS */}
          {notasConseguidasWishlist.length > 0 && (
            <div id="wrapper-conseguidos-wishlist" className="space-y-3 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setMostrarConseguidos(!mostrarConseguidos)}
                className="flex items-center justify-between w-full py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/50 transition border border-slate-800 text-xs font-bold text-slate-300 active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center text-[11px] font-black border border-emerald-500/30">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>Deseos Conseguidos / Archivados</span>
                  <span
                    id="badge-count-conseguidos-wishlist"
                    className="px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums font-bold bg-emerald-900/40 text-emerald-300"
                  >
                    {notasConseguidasWishlist.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-[11px] font-normal hidden sm:inline" id="label-toggle-conseguidos-wishlist">
                    {mostrarConseguidos ? 'Ocultar' : 'Mostrar'}
                  </span>
                  <span id="chevron-conseguidos-wishlist">
                    {mostrarConseguidos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
              </button>

              {mostrarConseguidos && (
                <div
                  id="grid-conseguidos-wishlist"
                  className={modoVista === 'masonry' ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 pt-1' : 'flex flex-col gap-2 pt-1'}
                >
                  {notasConseguidasWishlist.map((nota) => (
                    <TarjetaNota
                      key={nota.id}
                      nota={nota}
                      modoVista={modoVista}
                      onEditar={handleEditar}
                      onEliminar={handleEliminarNota}
                      onConvertirEnGasto={handleAbrirConvertirGasto}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ESTADO VACÍO */}
          {notasFijadas.length === 0 && notasOtras.length === 0 && notasConseguidasWishlist.length === 0 && (
            <div id="notas-empty-state" className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0D1526] border border-slate-800 text-slate-400 flex items-center justify-center mb-3 shadow-2xs">
                <FileText className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                {blockActivo ? `No hay notas en "${blockActivo}"` : 'Tu espacio de notas está vacío'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 font-normal">
                {blockActivo
                  ? 'Usa la barra superior para capturar tu primera nota dentro de este cuaderno.'
                  : 'Captura ideas rápidas, listas de tareas y archivos vinculados a tus proyectos.'}
              </p>
              <button
                type="button"
                onClick={() => setQuickExpanded(true)}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear primera nota</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Declarativo Bento Único para Transacción de Deseo (Single Instance) */}
      {notaParaConvertirGasto && (
        <ModalConvertirWishlistGasto
          isOpen={true}
          onClose={() => setNotaParaConvertirGasto(null)}
          onConfirmar={handleConfirmarConvertirGasto}
          notaTitulo={notaParaConvertirGasto.titulo}
          costoEstimado={Number(notaParaConvertirGasto.wishlist_json?.costoEstimado || 0)}
          moneda={notaParaConvertirGasto.wishlist_json?.moneda || 'PEN'}
        />
      )}

      {/* Modal 360° Completo */}
      <EditorNotaModal
        isOpen={modalAbierto}
        nota={notaEnEdicion}
        initialBlock={blockActivo && blockActivo !== '__sin_block__' ? blockActivo : undefined}
        blocksDisponibles={bloquesUnicos}
        onClose={() => {
          setModalAbierto(false);
          setNotaEnEdicion(null);
        }}
      />

      {/* Modal Declarativo de Creación de Cuadernos */}
      <ModalCrearCuaderno
        isOpen={modalCrearCuadernoAbierto}
        onClose={() => setModalCrearCuadernoAbierto(false)}
        onGuardar={handleGuardarCuaderno}
        nombresExistentes={bloquesUnicos}
      />

      {/* Toast Notificación Reactiva Local-First */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0D1526]/95 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
