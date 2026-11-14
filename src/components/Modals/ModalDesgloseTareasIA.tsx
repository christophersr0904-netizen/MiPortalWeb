/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalDesgloseTareasIA.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-OP-58-EXEC (Construcción del Generador WBS IA y Staging Area)
 * DESCRIPCIÓN: Modal Bento Staging Area con diseño Cobalt Glassmorphism para
 *              la generación de tareas operativas desglosadas con Gemini IA.
 *              Permite previsualizar, editar en línea, cambiar prioridades,
 *              ajustar horas estimadas y aprobar lotes de tareas antes de persistir.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Bot,
  Sparkles,
  X,
  Check,
  Plus,
  Trash2,
  Clock,
  RotateCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useGeminiStream } from '../../hooks/useGeminiStream';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import type { OpcionSelectCobalt } from '../UI/SelectIconicoCobalt';
import type { HitoWbsRecord, ProyectoRecord } from '../../types';

export interface TareaPropuestaIA {
  id: string;
  nombre: string;
  prioridad: '01_P1_Alta' | '02_P2_Media' | '03_P3_Baja';
  horasEstimadas: number;
  seleccionada: boolean;
  criterioDoD?: string;
}

export interface ModalDesgloseTareasIAProps {
  isOpen: boolean;
  onClose: () => void;
  paquetePadre: HitoWbsRecord | any | null;
  proyecto: ProyectoRecord | any | null;
  onAprobarTareas: (tareas: TareaPropuestaIA[]) => Promise<void> | void;
}

export const OPCIONES_PRIORIDAD_COBALT: OpcionSelectCobalt<'01_P1_Alta' | '02_P2_Media' | '03_P3_Baja'>[] = [
  {
    valor: '01_P1_Alta',
    etiqueta: 'P1 - Alta',
    badge: 'P1',
    colorBadge: 'bg-rose-950/80 text-rose-300 border-rose-500/70 shadow-[0_0_14px_rgba(244,63,94,0.45)] font-mono font-extrabold rounded-full px-2',
    icono: (props) => <AlertCircle {...props} className="w-4 h-4 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
  },
  {
    valor: '02_P2_Media',
    etiqueta: 'P2 - Media',
    badge: 'P2',
    colorBadge: 'bg-amber-950/80 text-amber-300 border-amber-500/70 shadow-[0_0_14px_rgba(245,158,11,0.4)] font-mono font-extrabold rounded-full px-2',
    icono: (props) => <Clock {...props} className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
  },
  {
    valor: '03_P3_Baja',
    etiqueta: 'P3 - Baja',
    badge: 'P3',
    colorBadge: 'bg-sky-950/80 text-sky-300 border-sky-500/70 shadow-[0_0_12px_rgba(56,189,248,0.35)] font-mono font-extrabold rounded-full px-2',
    icono: (props) => <CheckCircle2 {...props} className="w-4 h-4 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
  }
];

export interface PildoraPrioridadNeonProps {
  prioridad: '01_P1_Alta' | '02_P2_Media' | '03_P3_Baja';
  onChange?: (nuevaPrio: '01_P1_Alta' | '02_P2_Media' | '03_P3_Baja') => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Píldora Neón Aerodinámica Cobalt para visualización y cambio rápido de prioridad
 */
export const PildoraPrioridadNeon: React.FC<PildoraPrioridadNeonProps> = ({
  prioridad,
  onChange,
  className = '',
  disabled = false
}) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    };
    if (menuAbierto) {
      document.addEventListener('mousedown', handleClickFuera);
    }
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [menuAbierto]);

  const cfg = {
    '01_P1_Alta': {
      codigo: 'P1',
      etiqueta: 'Alta',
      clases: 'bg-rose-950/80 text-rose-300 border-rose-500/70 shadow-[0_0_12px_rgba(244,63,94,0.4)] hover:shadow-[0_0_16px_rgba(244,63,94,0.6)]',
      dot: 'bg-rose-400 shadow-[0_0_6px_#f43f5e]'
    },
    '02_P2_Media': {
      codigo: 'P2',
      etiqueta: 'Media',
      clases: 'bg-amber-950/80 text-amber-300 border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.35)] hover:shadow-[0_0_16px_rgba(245,158,11,0.55)]',
      dot: 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
    },
    '03_P3_Baja': {
      codigo: 'P3',
      etiqueta: 'Baja',
      clases: 'bg-sky-950/80 text-sky-300 border-sky-500/70 shadow-[0_0_10px_rgba(56,189,248,0.3)] hover:shadow-[0_0_14px_rgba(56,189,248,0.5)]',
      dot: 'bg-sky-400 shadow-[0_0_6px_#38bdf8]'
    }
  }[prioridad] || {
    codigo: 'P2',
    etiqueta: 'Media',
    clases: 'bg-slate-900 text-slate-300 border-slate-700',
    dot: 'bg-slate-400'
  };

  const opciones: Array<{ valor: '01_P1_Alta' | '02_P2_Media' | '03_P3_Baja'; codigo: string; etiqueta: string; dot: string; text: string }> = [
    { valor: '01_P1_Alta', codigo: 'P1', etiqueta: 'P1 - Alta', dot: 'bg-rose-400 shadow-[0_0_6px_#f43f5e]', text: 'text-rose-300' },
    { valor: '02_P2_Media', codigo: 'P2', etiqueta: 'P2 - Media', dot: 'bg-amber-400 shadow-[0_0_6px_#f59e0b]', text: 'text-amber-300' },
    { valor: '03_P3_Baja', codigo: 'P3', etiqueta: 'P3 - Baja', dot: 'bg-sky-400 shadow-[0_0_6px_#38bdf8]', text: 'text-sky-300' }
  ];

  const handlePillClick = () => {
    if (disabled || !onChange) return;
    setMenuAbierto((prev) => !prev);
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={handlePillClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono tabular-nums font-extrabold transition-all duration-200 select-none cursor-pointer active:scale-95 ${cfg.clases} ${className}`}
        title="Cambiar prioridad (P1/P2/P3)"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        <span>{cfg.codigo}</span>
        <span className="opacity-80 font-sans font-semibold text-[10px] hidden sm:inline">{cfg.etiqueta}</span>
      </button>

      {menuAbierto && onChange && (
        <div className="absolute left-0 mt-1.5 z-50 p-1 rounded-xl bg-[#0D1526] border border-slate-700/80 shadow-[0_10px_25px_rgba(2,6,23,0.9)] flex flex-col gap-1 min-w-[130px] animate-in fade-in zoom-in-95 duration-150">
          {opciones.map((op) => (
            <button
              key={op.valor}
              type="button"
              onClick={() => {
                onChange(op.valor);
                setMenuAbierto(false);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-left cursor-pointer hover:bg-slate-800/80 ${
                prioridad === op.valor ? `${op.text} bg-slate-800` : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${op.dot}`} />
              <span>{op.etiqueta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export function extraerTareasDeTexto(texto: string): TareaPropuestaIA[] {
  if (!texto || !texto.trim()) return [];

  // 1. Intentar capturar bloque ```json ... ```
  const jsonMatch =
    texto.match(/```json\s*([\s\S]*?)\s*```/i) ||
    texto.match(/```\s*([\s\S]*?)\s*```/);
  const rawJson = jsonMatch ? jsonMatch[1].trim() : texto.trim();

  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        id: `ia_${Date.now()}_${idx}`,
        nombre: String(item.nombre || item.titulo || item.descripcion || `Tarea ${idx + 1}`).trim(),
        prioridad: String(item.prioridad || '').includes('P1')
          ? '01_P1_Alta'
          : String(item.prioridad || '').includes('P3')
            ? '03_P3_Baja'
            : '02_P2_Media',
        horasEstimadas: Math.max(1, Number(item.horasEstimadas || item.horas || 4)),
        criterioDoD: item.criterioDoD ? String(item.criterioDoD).trim() : undefined,
        seleccionada: true
      }));
    }
  } catch {
    // Si aún está en streaming o no es JSON puro, proceder a fallback
  }

  // 2. Fallback de extracción línea por línea si el texto es formato Markdown
  const lineas = texto.split('\n');
  const tareasRegex: TareaPropuestaIA[] = [];
  let contador = 0;

  for (const linea of lineas) {
    const limpia = linea.replace(/^[-*•]\s*(\[[ xX]?\])?\s*/, '').trim();
    if (
      !limpia ||
      limpia.startsWith('#') ||
      limpia.startsWith('|') ||
      limpia.startsWith('```') ||
      limpia.startsWith('{') ||
      limpia.startsWith('}')
    ) {
      continue;
    }

    const horasMatch = limpia.match(/(\d+(\.\d+)?)\s*h(oras)?/i);
    const horas = horasMatch ? parseFloat(horasMatch[1]) : 4;
    const nombreLimpio = limpia
      .replace(/\s*\([^)]*h(oras)?[^)]*\)/gi, '')
      .replace(/\s*\(\d+(\.\d+)?\s*h(oras)?\)/gi, '')
      .trim();

    if (nombreLimpio.length > 3) {
      contador++;
      const esP1 = /P1|Alta|Urgente/i.test(limpia);
      const esP3 = /P3|Baja/i.test(limpia);
      tareasRegex.push({
        id: `ia_line_${Date.now()}_${contador}`,
        nombre: nombreLimpio,
        prioridad: esP1 ? '01_P1_Alta' : esP3 ? '03_P3_Baja' : '02_P2_Media',
        horasEstimadas: horas,
        seleccionada: true
      });
    }
  }

  return tareasRegex;
}

export const ModalDesgloseTareasIA: React.FC<ModalDesgloseTareasIAProps> = ({
  isOpen,
  onClose,
  paquetePadre,
  proyecto,
  onAprobarTareas
}) => {
  useBodyScrollLock(isOpen);

  const [tareasPropuestas, setTareasPropuestas] = useState<TareaPropuestaIA[]>([]);
  const [estaAprobando, setEstaAprobando] = useState(false);
  const [generacionIniciada, setGeneracionIniciada] = useState(false);

  const { streamedText, status, error, startStream, abortStream, reset } =
    useGeminiStream();

  const nombrePaquete = useMemo(() => {
    if (!paquetePadre) return 'Paquete de Trabajo';
    return (
      paquetePadre.nombre_elemento ||
      paquetePadre.Nombre_Elemento ||
      paquetePadre.nombre_hito ||
      paquetePadre.nombre ||
      paquetePadre.codigo_legado ||
      'Paquete sin título'
    );
  }, [paquetePadre]);

  const codigoPaquete = paquetePadre?.codigo_legado || paquetePadre?.id || 'WP-00';
  const nombreProyecto = proyecto?.Nombre_Proyecto || proyecto?.nombre_proyecto || 'Proyecto Activo';

  // Invocación a Gemini
  const handleGenerar = useCallback(async () => {
    if (!paquetePadre) return;
    setTareasPropuestas([]);
    reset();

    await startStream('desglosar_tareas_paquete', {
      nombrePaquete,
      codigoPaquete,
      nombreProyecto,
      criterioDoD: paquetePadre.criterio_dod || '',
      fase: paquetePadre.fase_asociada || '',
      presupuesto: paquetePadre.presupuesto_asignado || 0,
      duracionDias: paquetePadre.duracion_estimada_dias || 7
    });
  }, [paquetePadre, nombrePaquete, codigoPaquete, nombreProyecto, reset, startStream]);

  // Al abrir el modal, resetear y disparar generación automática inicial
  useEffect(() => {
    if (isOpen && paquetePadre && !generacionIniciada) {
      setGeneracionIniciada(true);
      handleGenerar();
    }
    if (!isOpen) {
      setGeneracionIniciada(false);
      setTareasPropuestas([]);
      reset();
    }
  }, [isOpen, paquetePadre, generacionIniciada, handleGenerar, reset]);

  // Parsear texto del stream cuando se complete o contenga JSON
  useEffect(() => {
    if (streamedText && (status === 'completed' || streamedText.includes('```json'))) {
      const extraidas = extraerTareasDeTexto(streamedText);
      if (extraidas.length > 0) {
        setTareasPropuestas(extraidas);
      }
    }
  }, [streamedText, status]);

  // Manejadores de edición en Staging Area
  const toggleSeleccion = (id: string) => {
    setTareasPropuestas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, seleccionada: !t.seleccionada } : t))
    );
  };

  const actualizarCampo = (
    id: string,
    campo: keyof TareaPropuestaIA,
    valor: any
  ) => {
    setTareasPropuestas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [campo]: valor } : t))
    );
  };

  const eliminarTarea = (id: string) => {
    setTareasPropuestas((prev) => prev.filter((t) => t.id !== id));
  };

  const agregarTareaManual = () => {
    const num = tareasPropuestas.length + 1;
    const nueva: TareaPropuestaIA = {
      id: `manual_${Date.now()}_${num}`,
      nombre: `Nueva tarea ${num}`,
      prioridad: '02_P2_Media',
      horasEstimadas: 4,
      seleccionada: true
    };
    setTareasPropuestas((prev) => [...prev, nueva]);
  };

  const handleAprobar = async () => {
    const seleccionadas = tareasPropuestas.filter(
      (t) => t.seleccionada && t.nombre.trim().length > 0
    );
    if (seleccionadas.length === 0) return;

    setEstaAprobando(true);
    try {
      await onAprobarTareas(seleccionadas);
      onClose();
    } finally {
      setEstaAprobando(false);
    }
  };

  // Métricas dinámicas en tiempo real
  const tareasSeleccionadas = useMemo(
    () => tareasPropuestas.filter((t) => t.seleccionada),
    [tareasPropuestas]
  );
  const totalHorasSeleccionadas = useMemo(
    () => tareasSeleccionadas.reduce((acc, t) => acc + (Number(t.horasEstimadas) || 0), 0),
    [tareasSeleccionadas]
  );

  // Atajo de cierre con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        abortStream();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, abortStream]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          abortStream();
          onClose();
        }
      }}
    >
      <div className="w-full max-w-3xl max-h-[92dvh] rounded-2xl bg-[#0D1526]/95 border border-slate-800/80 shadow-[0_20px_50px_rgba(2,6,23,0.9),0_0_30px_rgba(56,189,248,0.12)] flex flex-col overflow-hidden">
        {/* Cabecera Bento con Contexto del Paquete */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Bot className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-extrabold text-slate-100 tracking-tight">
                  Desglose Inteligente WBS (IA)
                </h2>
                <span className="font-mono tabular-nums text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/30">
                  {codigoPaquete}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  {nombreProyecto}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md sm:max-w-lg mt-0.5">
                {nombrePaquete}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              abortStream();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra Informativa de Estado del Motor */}
        {status === 'streaming' && (
          <div className="px-5 py-2.5 bg-sky-950/40 border-b border-sky-500/20 flex items-center justify-between text-xs text-sky-300">
            <div className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>Analizando alcance y sintetizando tareas operativas...</span>
            </div>
            <button
              type="button"
              onClick={abortStream}
              className="text-[11px] font-semibold underline text-sky-400 hover:text-sky-200 cursor-pointer"
            >
              Detener
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="px-5 py-2.5 bg-rose-950/40 border-b border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{error || 'Error al conectar con el orquestador IA.'}</span>
            </div>
            <button
              type="button"
              onClick={handleGenerar}
              className="text-[11px] font-bold underline text-rose-300 hover:text-white cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Zona Central: Staging Area de Tareas Sugeridas */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 min-h-[220px]">
          {tareasPropuestas.length === 0 && status !== 'streaming' ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-[#040711]/60 border border-dashed border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 mx-auto flex items-center justify-center text-sky-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-xs font-bold text-slate-200">
                  Sin tareas propuestas en este momento
                </h3>
                <p className="text-[11px] text-slate-400">
                  Genera una propuesta inteligente basada en el entregable y sus criterios DoD.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerar}
                className="h-9 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generar Desglose con IA</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                <span className="font-semibold text-slate-300">
                  Tareas Sugeridas en Staging ({tareasPropuestas.length})
                </span>
                <span className="text-[11px]">
                  Puedes editar títulos, prioridades y horas antes de insertar
                </span>
              </div>

              {tareasPropuestas.map((t, idx) => (
                <div
                  key={t.id}
                  className={`p-3 rounded-xl border transition-all duration-150 flex items-center gap-3 flex-wrap ${
                    t.seleccionada
                      ? 'bg-[#040711]/90 border-slate-700/80 shadow-xs'
                      : 'bg-[#040711]/40 border-slate-800/50 opacity-60'
                  }`}
                >
                  {/* Checkbox Cobalt */}
                  <button
                    type="button"
                    onClick={() => toggleSeleccion(t.id)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                      t.seleccionada
                        ? 'bg-sky-500 border-sky-400 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                        : 'border-slate-700 hover:border-slate-500 bg-slate-900/60'
                    }`}
                    title={t.seleccionada ? 'Deseleccionar de lote' : 'Seleccionar para insertar'}
                  >
                    {t.seleccionada && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  {/* Número Correlativo de Batch */}
                  <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">
                    #{idx + 1}
                  </span>

                  {/* Input Editable de Título */}
                  <input
                    type="text"
                    value={t.nombre}
                    onChange={(e) => actualizarCampo(t.id, 'nombre', e.target.value)}
                    className="flex-1 min-w-[180px] bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-500 text-xs font-semibold text-slate-100 outline-none transition-colors"
                    placeholder="Título de la tarea..."
                  />

                  {/* Píldora Neón de Prioridad */}
                  <PildoraPrioridadNeon
                    prioridad={t.prioridad}
                    onChange={(nuevaPrio) => actualizarCampo(t.id, 'prioridad', nuevaPrio)}
                  />

                  {/* Input Numérico de Horas (Sin spin-buttons nativos) */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-[#0D1526] px-2 py-1 rounded-xl border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      min="0.5"
                      max="120"
                      step="0.5"
                      value={t.horasEstimadas}
                      onChange={(e) =>
                        actualizarCampo(
                          t.id,
                          'horasEstimadas',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-10 bg-transparent text-center font-mono tabular-nums text-xs font-bold text-sky-300 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[10px] font-mono text-slate-500">h</span>
                  </div>

                  {/* Botón Eliminar Fila del Lote */}
                  <button
                    type="button"
                    onClick={() => eliminarTarea(t.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                    title="Descartar del lote"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Botón Añadir Tarea Manual */}
              <button
                type="button"
                onClick={agregarTareaManual}
                className="w-full py-2 rounded-xl border border-dashed border-slate-800 hover:border-sky-500/40 hover:bg-sky-500/5 text-slate-400 hover:text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir tarea manual al lote</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Bento de Aprobación */}
        <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">
              Lote Validado:
            </span>
            <span className="font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900 text-sky-300 border border-slate-800">
              {tareasSeleccionadas.length} seleccionadas
            </span>
            <span className="font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900 text-emerald-300 border border-slate-800">
              {totalHorasSeleccionadas}h estimadas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={status === 'streaming'}
              onClick={handleGenerar}
              className="h-9 px-3.5 rounded-xl border border-slate-800 bg-[#040711] hover:border-sky-500/40 text-slate-300 hover:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${status === 'streaming' ? 'animate-spin' : ''}`}
              />
              <span>Regenerar</span>
            </button>

            <button
              type="button"
              disabled={tareasSeleccionadas.length === 0 || estaAprobando}
              onClick={handleAprobar}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {estaAprobando ? (
                <RotateCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Check className="w-4 h-4 stroke-[2.2]" />
              )}
              <span>
                {estaAprobando
                  ? 'Insertando...'
                  : `Aprobar e Insertar (${tareasSeleccionadas.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
