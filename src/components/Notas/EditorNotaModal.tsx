import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import type { NotaRecord, ChecklistItem, WishlistMeta, VinculoEntidad } from '../../types';
import { db } from '../../db/db';
import { ModalVincularEntidades } from './ModalVincularEntidades';
import {
  X,
  Pin,
  Eye,
  Edit3,
  Tag,
  BookOpen,
  CheckSquare,
  DollarSign,
  Square,
  Plus,
  Trash2,
  Link2
} from 'lucide-react';

interface EditorNotaModalProps {
  nota: NotaRecord | null;
  isOpen: boolean;
  onClose: () => void;
  initialBlock?: string;
  blocksDisponibles?: string[];
}

type TabEditor = 'texto' | 'checklist' | 'wishlist';

export const EditorNotaModal: React.FC<EditorNotaModalProps> = ({
  nota,
  isOpen,
  onClose,
  initialBlock,
  blocksDisponibles = []
}) => {
  const [tabActiva, setTabActiva] = useState<TabEditor>('texto');
  const [titulo, setTitulo] = useState('');
  const [contenidoMarkdown, setContenidoMarkdown] = useState('');
  const [blockNombre, setBlockNombre] = useState('');
  const [colorTema, setColorTema] = useState('default');
  const [esFijada, setEsFijada] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [modoPreview, setModoPreview] = useState(false);

  // Checklists State
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [nuevoItemTexto, setNuevoItemTexto] = useState('');

  // Wishlist State
  const [tieneWishlist, setTieneWishlist] = useState(false);
  const [costoEstimado, setCostoEstimado] = useState(0);
  const [montoRealGastado, setMontoRealGastado] = useState(0);
  const [moneda, setMoneda] = useState<'PEN' | 'USD'>('PEN');
  const [prioridad, setPrioridad] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('MEDIA');
  const [urlReferencia, setUrlReferencia] = useState('');
  const [tienda, setTienda] = useState('');

  // Enlaces de Entidades State
  const [enlacesEntidades, setEnlacesEntidades] = useState<VinculoEntidad[]>([]);
  const [modalVincularAbierto, setModalVincularAbierto] = useState(false);

  useEffect(() => {
    if (nota) {
      setTitulo(nota.titulo || '');
      setContenidoMarkdown(nota.contenido_markdown || '');
      setBlockNombre(nota.block_nombre || '');
      setColorTema(nota.color_tema || 'default');
      setEsFijada(Boolean(nota.es_fijada));
      setTagsInput(nota.etiquetas ? nota.etiquetas.join(', ') : '');
      setChecklists(nota.checklists_json || []);
      setEnlacesEntidades(nota.enlaces_entidades_json || []);

      if (nota.wishlist_json && typeof nota.wishlist_json === 'object') {
        const costo = Number(nota.wishlist_json.costoEstimado || 0);
        setTieneWishlist(costo > 0 || Boolean(nota.wishlist_json.urlReferencia));
        setCostoEstimado(costo);
        setMontoRealGastado(Number(nota.wishlist_json.montoRealGastado || 0));
        setMoneda(nota.wishlist_json.moneda === 'USD' ? 'USD' : 'PEN');
        setPrioridad((nota.wishlist_json.prioridad as any) || 'MEDIA');
        setUrlReferencia(nota.wishlist_json.urlReferencia || nota.wishlist_json.enlaceReferencia || '');
        setTienda(nota.wishlist_json.tienda || '');
      } else {
        setTieneWishlist(false);
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
      setTagsInput('');
      setChecklists([]);
      setEnlacesEntidades([]);
      setTieneWishlist(false);
      setCostoEstimado(0);
      setMontoRealGastado(0);
      setMoneda('PEN');
      setPrioridad('MEDIA');
      setUrlReferencia('');
      setTienda('');
    }
    setTabActiva('texto');
    setModoPreview(false);
  }, [nota, isOpen, initialBlock]);

  if (!isOpen) return null;

  // Manejo de Checklist
  const handleAgregarChecklistItem = () => {
    if (!nuevoItemTexto.trim()) return;
    setChecklists([
      ...checklists,
      {
        id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        texto: nuevoItemTexto.trim(),
        completado: false
      }
    ]);
    setNuevoItemTexto('');
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklists(
      checklists.map((c) => (c.id === id ? { ...c, completado: !c.completado } : c))
    );
  };

  const handleEliminarChecklistItem = (id: string) => {
    setChecklists(checklists.filter((c) => c.id !== id));
  };

  // Guardado Atómico Normalizado
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() && !contenidoMarkdown.trim() && checklists.length === 0) {
      onClose();
      return;
    }

    const nowIso = new Date().toISOString();
    const etiquetas = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#+/, ''))
      .filter((t) => t.length > 0);

    const blockAsignado = blockNombre.trim() || undefined;

    let wishlistPayload: WishlistMeta | undefined = undefined;
    if (tieneWishlist && costoEstimado > 0) {
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
      // Edición existente
      await db.notas.put({
        ...nota,
        titulo: titulo.trim() || 'Nota sin título',
        contenido_markdown: contenidoMarkdown,
        block_nombre: blockAsignado,
        color_tema: colorTema,
        es_fijada: esFijada,
        etiquetas,
        checklists_json: checklists,
        wishlist_json: wishlistPayload,
        enlaces_entidades_json: enlacesEntidades,
        updated_at: nowIso,
        version: (nota.version || 1) + 1,
        sync_status: 'pending'
      });
    } else {
      // Creación nueva
      const count = await db.notas.count();
      const codigoCorrelativo = `NOT-${String(count + 1).padStart(5, '0')}`;
      const nuevoId = crypto.randomUUID ? crypto.randomUUID() : `not_${Date.now()}`;

      await db.notas.add({
        id: nuevoId,
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: codigoCorrelativo,
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
        etiquetas,
        created_at: nowIso,
        updated_at: nowIso,
        version: 1,
        sync_status: 'pending'
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0D1526] border border-slate-800/80 rounded-2xl shadow-cobalt-3 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado del Modal */}
        <div className="px-5 py-3.5 border-b border-slate-800/60 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20 font-bold">
              {nota ? nota.codigo_legado : 'NUEVA NOTA'}
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Nota Modular Compuesta
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEsFijada(!esFijada)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                esFijada
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={esFijada ? 'Desfijar' : 'Fijar arriba'}
            >
              <Pin className={`w-4 h-4 ${esFijada ? 'fill-amber-400 rotate-45' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Título de la Nota */}
          <div>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título de la nota..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 font-bold text-base focus:outline-none focus:border-sky-500/60 transition-colors"
            />
          </div>

          {/* Fila de Metadatos: Asignación de Block + Selector de Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
            {/* Block / Cuaderno */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>Asignar a Block / Cuaderno:</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  list="lista-blocks-disponibles"
                  value={blockNombre}
                  onChange={(e) => setBlockNombre(e.target.value)}
                  placeholder="Ej. General, Proyectos, Personal..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
                />
                <datalist id="lista-blocks-disponibles">
                  {blocksDisponibles.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Tema de Color */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">
                Tono / Color de Tarjeta:
              </label>
              <div className="flex items-center gap-1.5 pt-0.5">
                {(['default', 'sky', 'emerald', 'indigo', 'amber', 'purple', 'rose'] as const).map(
                  (col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColorTema(col)}
                      className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                        colorTema === col ? 'scale-125 ring-2 ring-white/40' : 'opacity-70 hover:opacity-100'
                      } ${
                        col === 'sky'
                          ? 'bg-sky-500 border-sky-400'
                          : col === 'emerald'
                          ? 'bg-emerald-500 border-emerald-400'
                          : col === 'indigo'
                          ? 'bg-indigo-500 border-indigo-400'
                          : col === 'amber'
                          ? 'bg-amber-500 border-amber-400'
                          : col === 'purple'
                          ? 'bg-purple-500 border-purple-400'
                          : col === 'rose'
                          ? 'bg-rose-500 border-rose-400'
                          : 'bg-slate-800 border-slate-600'
                      }`}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Fila de Entidades Vinculadas */}
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Vínculos:</span>
              </span>
              {enlacesEntidades.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic">Sin entidades vinculadas</span>
              ) : (
                enlacesEntidades.map((v) => (
                  <span
                    key={v.codigo}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-sky-950/50 text-sky-300 border border-sky-800/50"
                  >
                    <span>{v.codigo}</span>
                    <button
                      type="button"
                      onClick={() => setEnlacesEntidades(enlacesEntidades.filter((e) => e.codigo !== v.codigo))}
                      className="hover:text-rose-400 transition cursor-pointer"
                      title={`Quitar vínculo con ${v.codigo}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalVincularAbierto(true)}
              className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10.5px] font-semibold transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>Gestionar Vínculos</span>
            </button>
          </div>

          {/* Pestañas Modulares del Contenido (Texto + Checklist + Wishlist) */}
          <div className="border-b border-slate-800 flex items-center justify-between pb-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTabActiva('texto')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tabActiva === 'texto'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Texto & Markdown</span>
              </button>

              <button
                type="button"
                onClick={() => setTabActiva('checklist')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tabActiva === 'checklist'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>Checklist</span>
                {checklists.length > 0 && (
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-sky-300">
                    {checklists.filter((c) => c.completado).length}/{checklists.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTabActiva('wishlist')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tabActiva === 'wishlist'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                <span>Wishlist</span>
                {tieneWishlist && (
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                )}
              </button>
            </div>

            {tabActiva === 'texto' && (
              <button
                type="button"
                onClick={() => setModoPreview(!modoPreview)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1 cursor-pointer ${
                  modoPreview
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{modoPreview ? 'Editor' : 'Vista Previa'}</span>
              </button>
            )}
          </div>

          {/* CONTENIDO DE PESTAÑA: 1. TEXTO / MARKDOWN */}
          {tabActiva === 'texto' && (
            <div>
              {!modoPreview ? (
                <textarea
                  rows={9}
                  value={contenidoMarkdown}
                  onChange={(e) => setContenidoMarkdown(e.target.value)}
                  placeholder="Redacta en Markdown... usa @PROY-XXX o @TAR-XXX para vincular con proyectos y tareas..."
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-sky-500/60 resize-none transition-colors custom-scrollbar"
                />
              ) : (
                <div className="min-h-[200px] max-h-[320px] overflow-y-auto bg-slate-950/50 border border-slate-800 rounded-xl p-4 prose prose-invert prose-sky max-w-none text-xs leading-relaxed custom-scrollbar">
                  {contenidoMarkdown ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {contenidoMarkdown}
                    </ReactMarkdown>
                  ) : (
                    <span className="text-slate-500 italic">No hay contenido Markdown para previsualizar.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO DE PESTAÑA: 2. CHECKLIST */}
          {tabActiva === 'checklist' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nuevoItemTexto}
                  onChange={(e) => setNuevoItemTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAgregarChecklistItem();
                    }
                  }}
                  placeholder="Nuevo elemento de lista... (Presiona Enter)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleAgregarChecklistItem}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {checklists.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 italic">
                    No hay subtareas ni pasos en el checklist aún.
                  </div>
                ) : (
                  checklists.map((chk) => (
                    <div
                      key={chk.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 group"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleChecklistItem(chk.id)}
                        className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                      >
                        {chk.completado ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 fill-emerald-500/20 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
                        )}
                        <span
                          className={`text-xs ${
                            chk.completado ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {chk.texto}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEliminarChecklistItem(chk.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                        title="Eliminar ítem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CONTENIDO DE PESTAÑA: 3. WISHLIST / PRESUPUESTO */}
          {tabActiva === 'wishlist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-900/40">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Habilitar módulo de Deseo / Compra
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Permite presupuestar costo estimado y registrar conversión a gasto financiero.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={tieneWishlist}
                  onChange={(e) => setTieneWishlist(e.target.checked)}
                  className="w-4 h-4 text-purple-500 rounded border-slate-700 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {tieneWishlist && (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Costo Estimado:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={moneda}
                          onChange={(e) => setMoneda(e.target.value as 'PEN' | 'USD')}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-100 font-bold"
                        >
                          <option value="PEN">S/</option>
                          <option value="USD">$</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={costoEstimado || ''}
                          onChange={(e) => setCostoEstimado(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Gasto Real Acumulado:
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={montoRealGastado || ''}
                        onChange={(e) => setMontoRealGastado(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Prioridad de Compra:
                      </label>
                      <select
                        value={prioridad}
                        onChange={(e) => setPrioridad(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                      >
                        <option value="ALTA">Alta Prioridad</option>
                        <option value="MEDIA">Media</option>
                        <option value="BAJA">Baja / Opcional</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        URL de Referencia / Enlace:
                      </label>
                      <input
                        type="url"
                        value={urlReferencia}
                        onChange={(e) => setUrlReferencia(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Tienda / Proveedor:
                      </label>
                      <input
                        type="text"
                        value={tienda}
                        onChange={(e) => setTienda(e.target.value)}
                        placeholder="Ej. Amazon, MercadoLibre, Falabella..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Etiquetas */}
          <div className="pt-1">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Etiquetas (separadas por coma):</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ej. arquitectura, roadmap, compras, personal..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500/60 transition-colors"
            />
          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-cobalt-1 transition-all active:scale-95 cursor-pointer"
            >
              {nota ? 'Guardar Cambios' : 'Crear Nota'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Gestión de Vínculos de Entidades */}
      <ModalVincularEntidades
        isOpen={modalVincularAbierto}
        onClose={() => setModalVincularAbierto(false)}
        enlacesActuales={enlacesEntidades}
        onGuardarEnlaces={(nuevos) => setEnlacesEntidades(nuevos)}
      />
    </div>
  );
};
