import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  Target,
  X,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Activity,
  Flame,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckSquare
} from 'lucide-react';
import {
  CATEGORIAS_VIDA_MAP,
  type CategoriaVida,
  type MetaPlanRecord,
  type ModoComputoVinculo
} from '../../types';
import { guardarMetaPlanLocal } from '../../services/metasService';
import Swal from 'sweetalert2';

interface ModalMetaPlanFlowProps {
  isOpen: boolean;
  onClose: () => void;
  metaParaEditar?: MetaPlanRecord | null;
  onGuardado?: () => void;
}

interface HitoLocalState {
  id?: string;
  codigo_legado?: string;
  titulo_hito: string;
  orden_secuencia: number;
  fecha_objetivo?: string;
  peso_relativo: number;
  completado: boolean;
}

interface VinculoLocalState {
  id?: string;
  habito_id: string;
  modo_computo: ModoComputoVinculo;
  factor_conversion: number;
  peso_contribucion_pct: number;
  meta_volumen_esperada: number;
}

export const ModalMetaPlanFlow: React.FC<ModalMetaPlanFlowProps> = ({
  isOpen,
  onClose,
  metaParaEditar,
  onGuardado
}) => {
  useBodyScrollLock(isOpen);

  const [tabActiva, setTabActiva] = useState<'datos' | 'hitos' | 'habitos'>('datos');

  // Estado del Formulario - Tab 1: Datos
  const [nombreMeta, setNombreMeta] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaVida, setCategoriaVida] = useState<CategoriaVida>('DESARROLLO_ESTUDIO');
  const [tipoMeta, setTipoMeta] = useState<'CUANTITATIVA' | 'CUALITATIVA' | 'PROYECTO_ASOCIADO'>('CUANTITATIVA');
  const [unidadMedida, setUnidadMedida] = useState('unidades');
  const [metaObjetivoTotal, setMetaObjetivoTotal] = useState<number>(100);
  const [valorAcumuladoActual, setValorAcumuladoActual] = useState<number>(0);
  const [nivelRescateMinimo, setNivelRescateMinimo] = useState<number>(20);
  const [pesoHitosPct, setPesoHitosPct] = useState<number>(50);
  const [pesoHabitosPct, setPesoHabitosPct] = useState<number>(50);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState('');
  const [estado, setEstado] = useState('02_En_Progreso');

  // Estado de Hitos - Tab 2
  const [hitos, setHitos] = useState<HitoLocalState[]>([]);
  const [nuevoHitoTitulo, setNuevoHitoTitulo] = useState('');
  const [nuevoHitoFecha, setNuevoHitoFecha] = useState('');
  const [nuevoHitoPeso, setNuevoHitoPeso] = useState<number>(1.0);

  // Estado de Vínculos de Hábitos - Tab 3
  const [vinculos, setVinculos] = useState<VinculoLocalState[]>([]);
  const [habitoSeleccionadoId, setHabitoSeleccionadoId] = useState('');
  const [modoComputoSel, setModoComputoSel] = useState<ModoComputoVinculo>('VOLUMEN_DIRECTO');
  const [factorConvSel, setFactorConvSel] = useState<number>(1.0);
  const [metaVolumenSel, setMetaVolumenSel] = useState<number>(50);
  const [pesoContribSel, setPesoContribSel] = useState<number>(100);

  // Hábitos disponibles en Dexie
  const actividadesDisponibles = useLiveQuery(() => db.actividades_personales.toArray(), [], []);

  // Cargar datos si se recibe metaParaEditar
  useEffect(() => {
    if (metaParaEditar) {
      setNombreMeta(metaParaEditar.nombre_meta || '');
      setDescripcion(metaParaEditar.descripcion || '');
      setCategoriaVida(metaParaEditar.categoria_vida || 'DESARROLLO_ESTUDIO');
      setTipoMeta((metaParaEditar.tipo_meta as any) || 'CUANTITATIVA');
      setUnidadMedida(metaParaEditar.unidad_medida || 'unidades');
      setMetaObjetivoTotal(metaParaEditar.meta_objetivo_total || 0);
      setValorAcumuladoActual(metaParaEditar.valor_acumulado_actual || 0);
      setNivelRescateMinimo(metaParaEditar.nivel_rescate_minimo || 0);
      setPesoHitosPct(metaParaEditar.peso_hitos_pct ?? 50);
      setPesoHabitosPct(metaParaEditar.peso_habitos_pct ?? 50);
      setFechaInicio(metaParaEditar.fecha_inicio || new Date().toISOString().split('T')[0]);
      setFechaFin(metaParaEditar.fecha_fin || '');
      setEstado(metaParaEditar.estado || '02_En_Progreso');

      // Cargar hitos y vínculos existentes
      db.planes_accion_hitos
        .where('meta_id')
        .equals(metaParaEditar.id)
        .toArray()
        .then((items) => {
          setHitos(
            items.map((h) => ({
              id: h.id,
              codigo_legado: h.codigo_legado,
              titulo_hito: h.titulo_hito,
              orden_secuencia: h.orden_secuencia,
              fecha_objetivo: h.fecha_objetivo,
              peso_relativo: h.peso_relativo,
              completado: h.completado
            }))
          );
        });

      db.habitos_metas_vinculos
        .where('meta_id')
        .equals(metaParaEditar.id)
        .toArray()
        .then((items) => {
          setVinculos(
            items.map((v) => ({
              id: v.id,
              habito_id: v.habito_id,
              modo_computo: v.modo_computo as ModoComputoVinculo,
              factor_conversion: v.factor_conversion,
              peso_contribucion_pct: v.peso_contribucion_pct,
              meta_volumen_esperada: v.meta_volumen_esperada
            }))
          );
        });
    } else {
      // Valores por defecto para nueva meta
      setNombreMeta('');
      setDescripcion('');
      setCategoriaVida('DESARROLLO_ESTUDIO');
      setTipoMeta('CUANTITATIVA');
      setUnidadMedida('unidades');
      setMetaObjetivoTotal(100);
      setValorAcumuladoActual(0);
      setNivelRescateMinimo(20);
      setPesoHitosPct(50);
      setPesoHabitosPct(50);
      setFechaInicio(new Date().toISOString().split('T')[0]);
      setFechaFin('');
      setEstado('02_En_Progreso');
      setHitos([]);
      setVinculos([]);
    }
    setTabActiva('datos');
  }, [metaParaEditar, isOpen]);

  // Manejo de teclado Escape respetando gobernanza LIFO
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement;
        if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
          target.blur();
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Acciones en Hitos
  const handleAgregarHito = () => {
    if (!nuevoHitoTitulo.trim()) return;
    const nuevo: HitoLocalState = {
      titulo_hito: nuevoHitoTitulo.trim(),
      orden_secuencia: hitos.length + 1,
      fecha_objetivo: nuevoHitoFecha || undefined,
      peso_relativo: nuevoHitoPeso > 0 ? nuevoHitoPeso : 1.0,
      completado: false
    };
    setHitos([...hitos, nuevo]);
    setNuevoHitoTitulo('');
    setNuevoHitoFecha('');
    setNuevoHitoPeso(1.0);
  };

  const handleEliminarHito = (index: number) => {
    setHitos(hitos.filter((_, i) => i !== index));
  };

  const handleToggleHitoCheck = (index: number) => {
    setHitos(
      hitos.map((h, i) => (i === index ? { ...h, completado: !h.completado } : h))
    );
  };

  // Acciones en Vínculos de Hábitos
  const handleAgregarVinculo = () => {
    if (!habitoSeleccionadoId) return;
    // Evitar duplicados
    if (vinculos.some((v) => v.habito_id === habitoSeleccionadoId)) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Este hábito ya se encuentra vinculado a la meta',
        showConfirmButton: false,
        timer: 2000,
        background: '#0D1526',
        color: '#f8fafc'
      });
      return;
    }

    const nuevoV: VinculoLocalState = {
      habito_id: habitoSeleccionadoId,
      modo_computo: modoComputoSel,
      factor_conversion: factorConvSel > 0 ? factorConvSel : 1.0,
      peso_contribucion_pct: pesoContribSel > 0 ? pesoContribSel : 100,
      meta_volumen_esperada: metaVolumenSel > 0 ? metaVolumenSel : 0
    };
    setVinculos([...vinculos, nuevoV]);
    setHabitoSeleccionadoId('');
  };

  const handleEliminarVinculo = (index: number) => {
    setVinculos(vinculos.filter((_, i) => i !== index));
  };

  // Guardado Final Atómico
  const handleGuardar = async () => {
    if (!nombreMeta.trim()) {
      Swal.fire({
        title: 'Título requerido',
        text: 'Por favor asigna un título o nombre descriptivo a la meta.',
        icon: 'info',
        confirmButtonText: 'Entendido',
        background: '#0D1526',
        color: '#f8fafc'
      });
      setTabActiva('datos');
      return;
    }

    try {
      await guardarMetaPlanLocal(
        {
          id: metaParaEditar?.id,
          codigo_legado: metaParaEditar?.codigo_legado,
          nombre_meta: nombreMeta.trim(),
          descripcion: descripcion.trim(),
          categoria_vida: categoriaVida,
          tipo_meta: tipoMeta,
          unidad_medida: unidadMedida.trim() || 'unidades',
          meta_objetivo_total: metaObjetivoTotal,
          valor_acumulado_actual: valorAcumuladoActual,
          nivel_rescate_minimo: nivelRescateMinimo,
          peso_hitos_pct: pesoHitosPct,
          peso_habitos_pct: pesoHabitosPct,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin || undefined,
          estado: estado
        },
        hitos,
        vinculos
      );

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: metaParaEditar ? 'Meta actualizada con éxito' : 'Nueva Meta & Plan creados',
        showConfirmButton: false,
        timer: 2000,
        background: '#0D1526',
        color: '#f8fafc'
      });

      if (onGuardado) onGuardado();
      onClose();
    } catch (error) {
      console.error('Error al guardar meta:', error);
      Swal.fire({
        title: 'Error de persistencia',
        text: 'No se pudo guardar la meta en Dexie Local-First.',
        icon: 'error',
        background: '#0D1526',
        color: '#f8fafc'
      });
    }
  };

  return createPortal(
    <div
      id="modal-meta-plan-backdrop"
      className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-[10001] animate-in fade-in duration-200"
    >
      <div
        id="modal-meta-plan-container"
        className="w-full max-w-3xl bg-[#0D1526] border border-slate-800/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
        style={{
          boxShadow: '0 20px 40px -10px rgba(2, 6, 23, 0.9), 0 10px 20px -5px rgba(30, 58, 138, 0.25)'
        }}
      >
        {/* CABECERA MODAL BENTO */}
        <div className="px-5 py-4 border-b border-slate-800/70 flex items-center justify-between shrink-0 bg-[#090E1A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Target className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{metaParaEditar ? 'Editar Meta & Plan' : 'Configurador de Meta & Plan Estratégico'}</span>
                {metaParaEditar && (
                  <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-teal-400 border border-slate-700">
                    {metaParaEditar.codigo_legado}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Despliegue bimodal: Hitos de ejecución + Hábitos motores continuos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar modal (Esc)"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* SELECTOR DE PESTAÑAS (COBALT TABS) */}
        <div className="px-5 py-2.5 bg-[#0A101D] border-b border-slate-800/60 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTabActiva('datos')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                tabActiva === 'datos'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Target className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>1. Datos & Alcance</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('hitos')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                tabActiva === 'hitos'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>2. Hitos del Plan ({hitos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('habitos')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                tabActiva === 'habitos'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>3. Hábitos Motores ({vinculos.length})</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            Bimodal: <span className="text-teal-400 font-bold">{pesoHitosPct}%</span> hitos /{' '}
            <span className="text-emerald-400 font-bold">{pesoHabitosPct}%</span> hábitos
          </div>
        </div>

        {/* CONTENIDO DEL CUERPO CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {/* TAB 1: DATOS GENERALES */}
          {tabActiva === 'datos' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Título de la Meta */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre de la Meta / Objetivo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={nombreMeta}
                  onChange={(e) => setNombreMeta(e.target.value)}
                  placeholder="Ej: Correr Media Maratón (21 km), Aprender Alemán B1..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  autoFocus
                />
              </div>

              {/* Selector de Categoría de Vida (6 Pilares) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Categoría de Vida / Pilar
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(CATEGORIAS_VIDA_MAP) as CategoriaVida[]).map((catKey) => {
                    const cfg = CATEGORIAS_VIDA_MAP[catKey];
                    const seleccionada = categoriaVida === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategoriaVida(catKey)}
                        className={`p-2 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                          seleccionada
                            ? `${cfg.badgeClase} border-teal-500/70 shadow-xs ring-1 ring-teal-500/40`
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold truncate">{cfg.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descripción / Macro objetivo */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Descripción / Contexto Estratégico
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="¿Por qué es crucial esta meta? ¿Qué entregable o transformación persigue?"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition resize-none"
                />
              </div>

              {/* Parámetros Cuantitativos */}
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3">
                <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Métricas y Metas de Volumen</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Unidad de Medida
                    </label>
                    <input
                      type="text"
                      value={unidadMedida}
                      onChange={(e) => setUnidadMedida(e.target.value)}
                      placeholder="km, páginas, horas..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Meta Objetivo Total
                    </label>
                    <input
                      type="number"
                      value={metaObjetivoTotal}
                      onChange={(e) => setMetaObjetivoTotal(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono tabular-nums text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Nivel de Rescate Mínimo
                    </label>
                    <input
                      type="number"
                      value={nivelRescateMinimo}
                      onChange={(e) => setNivelRescateMinimo(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono tabular-nums text-amber-400"
                    />
                  </div>
                </div>

                {/* Balance Bimodal Ponderado */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-300">Ponderación de Progreso:</span>
                    <span className="font-mono text-[11px] text-teal-400">
                      Hitos: {pesoHitosPct}% | Hábitos: {pesoHabitosPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={pesoHitosPct}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPesoHitosPct(val);
                      setPesoHabitosPct(100 - val);
                    }}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Fechas de Cronograma y Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Fecha Límite / Cierre</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Estado Operativo</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white"
                  >
                    <option value="01_Backlog">01 Backlog</option>
                    <option value="02_En_Progreso">02 En Progreso</option>
                    <option value="03_Completado">03 Completado</option>
                    <option value="04_En_Pausa">04 En Pausa</option>
                    <option value="05_Archivado">05 Archivado</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HITOS DEL PLAN */}
          {tabActiva === 'hitos' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                Los hitos representan etapas verificables y secuenciales para consolidar el plan.
              </div>

              {/* Formulario rápido para añadir hito */}
              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
                <input
                  type="text"
                  value={nuevoHitoTitulo}
                  onChange={(e) => setNuevoHitoTitulo(e.target.value)}
                  placeholder="Título del hito (ej: Completar fase de pre-entrenamiento 10K)"
                  className="flex-1 w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAgregarHito();
                    }
                  }}
                />
                <input
                  type="date"
                  value={nuevoHitoFecha}
                  onChange={(e) => setNuevoHitoFecha(e.target.value)}
                  className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  title="Fecha objetivo del hito"
                />
                <input
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={nuevoHitoPeso}
                  onChange={(e) => setNuevoHitoPeso(Number(e.target.value))}
                  className="w-full sm:w-20 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                  title="Peso relativo del hito (ej: 1.0)"
                />
                <button
                  type="button"
                  onClick={handleAgregarHito}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Añadir Hito</span>
                </button>
              </div>

              {/* Lista de Hitos Configurados */}
              {hitos.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Aún no has agregado hitos. Registra al menos un hito clave para el plan.
                </div>
              ) : (
                <div className="space-y-2">
                  {hitos.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleHitoCheck(idx)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition cursor-pointer shrink-0 ${
                            h.completado
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-teal-500'
                          }`}
                        >
                          <CheckSquare className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                        <span className="text-[11px] font-mono text-slate-500 shrink-0">#{idx + 1}</span>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold truncate ${
                              h.completado ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {h.titulo_hito}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            {h.fecha_objetivo && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
                                {h.fecha_objetivo}
                              </span>
                            )}
                            <span>Peso: {h.peso_relativo}x</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEliminarHito(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 transition cursor-pointer"
                        title="Eliminar hito"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HÁBITOS MOTORES */}
          {tabActiva === 'habitos' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                Vincula hábitos existentes para que cada sesión o repetición sume automáticamente al avance de la meta.
              </div>

              {/* Formulario de vinculación */}
              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Seleccionar Hábito de Vida
                    </label>
                    <select
                      value={habitoSeleccionadoId}
                      onChange={(e) => setHabitoSeleccionadoId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      <option value="">-- Elige un hábito registrado --</option>
                      {(actividadesDisponibles || []).map((act) => (
                        <option key={act.id} value={act.id}>
                          {act.nombre_actividad} ({act.categoria_vida})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Modo de Cómputo
                    </label>
                    <select
                      value={modoComputoSel}
                      onChange={(e) => setModoComputoSel(e.target.value as ModoComputoVinculo)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      <option value="VOLUMEN_DIRECTO">Volumen Directo (Suma Unidades)</option>
                      <option value="TASA_CONVERSION">Tasa de Conversión (Multiplicador)</option>
                      <option value="CHECK_BINARIO">Check Binario (Compleción Sí/No)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Factor Conversión
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      value={factorConvSel}
                      onChange={(e) => setFactorConvSel(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Volumen Esperado
                    </label>
                    <input
                      type="number"
                      value={metaVolumenSel}
                      onChange={(e) => setMetaVolumenSel(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Contribución %
                    </label>
                    <input
                      type="number"
                      value={pesoContribSel}
                      onChange={(e) => setPesoContribSel(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAgregarVinculo}
                  disabled={!habitoSeleccionadoId}
                  className="w-full px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Vincular Hábito Motor a la Meta</span>
                </button>
              </div>

              {/* Lista de vínculos */}
              {vinculos.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Sin hábitos motores vinculados aún. Puedes conectar hábitos de lectura, running, estudio, etc.
                </div>
              ) : (
                <div className="space-y-2">
                  {vinculos.map((v, idx) => {
                    const habito = (actividadesDisponibles || []).find((a) => a.id === v.habito_id);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                            <Activity className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {habito?.nombre_actividad || 'Hábito vinculado'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Modo: {v.modo_computo} | Factor: {v.factor_conversion}x | Peso: {v.peso_contribucion_pct}%
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEliminarVinculo(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 transition cursor-pointer"
                          title="Desvincular hábito"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PIE DEL MODAL DE ACCIONES */}
        <div className="px-5 py-3.5 border-t border-slate-800/80 bg-[#090E1A] flex items-center justify-between shrink-0">
          <div>
            {tabActiva !== 'datos' ? (
              <button
                type="button"
                onClick={() => setTabActiva(tabActiva === 'habitos' ? 'hitos' : 'datos')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {tabActiva !== 'habitos' ? (
              <button
                type="button"
                onClick={() => setTabActiva(tabActiva === 'datos' ? 'hitos' : 'habitos')}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleGuardar}
              className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-teal-900/40 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Guardar Meta & Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
