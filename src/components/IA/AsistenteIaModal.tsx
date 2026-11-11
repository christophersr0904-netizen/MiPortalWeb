import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useGeminiStream, type GeminiAction } from '../../hooks/useGeminiStream';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { db } from '../../db/db';
import {
  Sparkles,
  X,
  Send,
  StopCircle,
  Lightbulb,
  GitFork,
  BookmarkPlus,
  AlertCircle
} from 'lucide-react';
import { mostrarToastCobalt } from '../../utils/toastCobalt';

interface AsistenteIaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AsistenteIaModal: React.FC<AsistenteIaModalProps> = ({
  isOpen,
  onClose
}) => {
  useBodyScrollLock(isOpen);

  const [modo, setModo] = useState<GeminiAction>('clarificar_idea');

  // Campos para Clarificar Idea
  const [enunciadoIdea, setEnunciadoIdea] = useState('');
  const [detalleIdea, setDetalleIdea] = useState('');
  const [dudaIdea, setDudaIdea] = useState('');

  // Campos para Desglosar WBS
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [descripcionProyecto, setDescripcionProyecto] = useState('');
  const [presupuestoProyecto, setPresupuestoProyecto] = useState('');
  const [plazoProyecto, setPlazoProyecto] = useState('30 días');

  const { streamedText, status, error, startStream, abortStream, reset } =
    useGeminiStream();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === 'clarificar_idea') {
      if (!enunciadoIdea.trim()) return;
      await startStream('clarificar_idea', {
        enunciado: enunciadoIdea,
        detalle: detalleIdea,
        preguntaUsuario: dudaIdea
      });
    } else {
      if (!nombreProyecto.trim()) return;
      await startStream('desglosar_wbs', {
        nombreProyecto,
        descripcion: descripcionProyecto,
        presupuesto: presupuestoProyecto,
        diasEstimados: plazoProyecto
      });
    }
  };

  // Guardar resultado como Nota Inteligente en Dexie (latencia 0 ms)
  const handleGuardarComoNota = async () => {
    if (!streamedText) return;
    const nowIso = new Date().toISOString();
    const count = await db.notas.count();
    const codigoCorrelativo = `NOT-${String(count + 1).padStart(5, '0')}`;
    const titulo =
      modo === 'clarificar_idea'
        ? `Análisis IA: ${enunciadoIdea || 'Idea Clarificada'}`
        : `Desglose WBS IA: ${nombreProyecto || 'Estructura WBS'}`;

    await db.notas.add({
      id: crypto.randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: codigoCorrelativo,
      titulo,
      contenido_markdown: streamedText,
      tipo_nota: 'TEXTO',
      color_tema: modo === 'clarificar_idea' ? 'amber' : 'sky',
      es_fijada: true,
      checklists_json: [],
      adjuntos_drive_json: [],
      enlaces_entidades_json: [],
      etiquetas: ['asistente-ia', modo === 'clarificar_idea' ? 'ideas' : 'wbs'],
      created_at: nowIso,
      updated_at: nowIso,
      version: 1,
      sync_status: 'pending'
    });

    mostrarToastCobalt('Guardado en Notas con éxito', 'success');
  };

  // Insertar Paquete de Trabajo en WBS directamente en Dexie
  const handleInsertarEnWBS = async () => {
    if (!streamedText) return;
    const nowIso = new Date().toISOString();
    const count = await db.hitos_wbs.count();
    const codigoCorrelativo = `WP-${String(count + 1).padStart(3, '0')}`;

    await db.hitos_wbs.add({
      id: crypto.randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: codigoCorrelativo,
      proyecto_id: 'PRO-001',
      tipo_elemento_wbs: 'PAQUETE_TRABAJO',
      wbs_code: `1.${count + 1}`,
      fase_asociada: '01_INICIACION',
      nombre_elemento: nombreProyecto || 'Iniciativa generada con IA',
      estado: '01_Pendiente',
      peso_pct: 0.5,
      fecha_limite: '2026-11-30',
      presupuesto_asignado: parseFloat(presupuestoProyecto) || 1500,
      duracion_estimada_dias: 7,
      criterio_dod: 'Entregables definidos mediante Asistente Gemini',
      updated_at: nowIso,
      version: 1,
      sync_status: 'pending'
    });

    mostrarToastCobalt('Paquete WBS insertado en el Grafo', 'success');
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[92dvh] rounded-t-3xl sm:rounded-2xl bg-[#0D1526] border-t sm:border border-slate-700/60 shadow-cobalt-3 overflow-hidden flex flex-col">
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2 sm:hidden flex-shrink-0" />

        {/* Header Modal */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Asistente Estratégico Gemini
                <span className="text-[10px] font-mono font-normal text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                  SSE Streaming
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Orquestador nativo para refinamiento de ideas y descomposición WBS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selector de Modo */}
        <div className="flex border-b border-slate-800/80 bg-[#020617]/50 px-4 sm:px-5 pt-2.5 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setModo('clarificar_idea');
              reset();
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              modo === 'clarificar_idea'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Clarificar & Evaluar Idea
          </button>

          <button
            type="button"
            onClick={() => {
              setModo('desglosar_wbs');
              reset();
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              modo === 'desglosar_wbs'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-sky-400" />
            Desglosar WBS de Proyecto
          </button>
        </div>

        {/* Cuerpo Principal Dividido (Formulario a la Izquierda / Streaming a la Derecha) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden custom-scrollbar">
          {/* Panel Izquierdo: Inputs */}
          <form
            id="form-asistente-ia"
            onSubmit={handleSubmit}
            className="lg:col-span-5 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-800/80 lg:overflow-y-auto space-y-4 bg-[#0D1526]/50"
          >
            {modo === 'clarificar_idea' ? (
              <>
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">
                    Enunciado de la Idea *:
                  </label>
                  <input
                    type="text"
                    required
                    value={enunciadoIdea}
                    onChange={(e) => setEnunciadoIdea(e.target.value)}
                    placeholder="ej. Crear sistema de suscripción SaaS local-first..."
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">
                    Detalle / Contexto Adicional:
                  </label>
                  <textarea
                    rows={4}
                    value={detalleIdea}
                    onChange={(e) => setDetalleIdea(e.target.value)}
                    placeholder="Explica qué problema resuelve, qué recursos tienes y a quién va dirigido..."
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-sky-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">
                    Duda Específica (Opcional):
                  </label>
                  <input
                    type="text"
                    value={dudaIdea}
                    onChange={(e) => setDudaIdea(e.target.value)}
                    placeholder="ej. ¿Es viable como proyecto o mejor como tarea puntual?"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">
                    Nombre del Proyecto *:
                  </label>
                  <input
                    type="text"
                    required
                    value={nombreProyecto}
                    onChange={(e) => setNombreProyecto(e.target.value)}
                    placeholder="ej. Portal Web PMO Modular v2..."
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">
                    Alcance & Objetivos Clave:
                  </label>
                  <textarea
                    rows={4}
                    value={descripcionProyecto}
                    onChange={(e) => setDescripcionProyecto(e.target.value)}
                    placeholder="Objetivo central, restricciones técnicas y principales entregables requeridos..."
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-sky-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-300 block mb-1">
                      Presupuesto Tope:
                    </label>
                    <input
                      type="text"
                      value={presupuestoProyecto}
                      onChange={(e) => setPresupuestoProyecto(e.target.value)}
                      placeholder="ej. S/ 3,500"
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-300 block mb-1">
                      Plazo Estimado:
                    </label>
                    <input
                      type="text"
                      value={plazoProyecto}
                      onChange={(e) => setPlazoProyecto(e.target.value)}
                      placeholder="ej. 45 días"
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Botones de Envío / Control de Stream (visible en Desktop dentro del panel) */}
            <div className="hidden lg:block pt-2">
              {status === 'streaming' ? (
                <button
                  type="button"
                  onClick={abortStream}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors cursor-pointer"
                >
                  <StopCircle className="w-4 h-4 animate-spin text-rose-400" />
                  Detener Generación
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-cobalt-1 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {status === 'completed' ? 'Regenerar con IA' : 'Ejecutar Inferencia IA'}
                </button>
              )}
            </div>
          </form>

          {/* Panel Derecho: Visualizador de Streaming en Vivo */}
          <div className="lg:col-span-7 flex flex-col bg-[#020617] min-h-[220px] lg:min-h-0 lg:overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  ESTADO:{' '}
                  {status === 'streaming' && (
                    <span className="text-sky-400 font-bold animate-pulse">STREAMING EN VIVO...</span>
                  )}
                  {status === 'completed' && (
                    <span className="text-emerald-400 font-bold">GENERACIÓN COMPLETADA</span>
                  )}
                  {status === 'error' && (
                    <span className="text-rose-400 font-bold">ERROR</span>
                  )}
                  {status === 'idle' && (
                    <span className="text-slate-500 font-bold">ESPERANDO INSTRUCCIÓN</span>
                  )}
                </span>
              </div>

              {streamedText && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGuardarComoNota}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    title="Guardar como Nota en Dexie"
                  >
                    <BookmarkPlus className="w-3 h-3 text-sky-400" />
                    Guardar Nota
                  </button>

                  {modo === 'desglosar_wbs' && (
                    <button
                      onClick={handleInsertarEnWBS}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors"
                      title="Insertar elemento en el Grafo WBS"
                    >
                      <GitFork className="w-3 h-3 text-sky-400" />
                      Insertar en WBS
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Contenido Renderizado Markdown */}
            <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-200">
              {error && (
                <div className="p-3 mb-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {streamedText ? (
                <div className="prose prose-invert prose-sky max-w-none text-xs leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                    {streamedText}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-600 space-y-3">
                  <Sparkles className="w-10 h-10 stroke-1 text-slate-700" />
                  <p className="text-xs max-w-xs text-slate-500">
                    Ingresa los parámetros y haz clic en &quot;Ejecutar Inferencia IA&quot; para iniciar la transmisión continua de tokens en tiempo real.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Acciones Inferior Fija (Mobile-First Thumb Zone) */}
        <div className="sticky bottom-0 shrink-0 bg-[#0D1526]/95 backdrop-blur-md p-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            {status === 'streaming' ? (
              <button
                type="button"
                onClick={abortStream}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors cursor-pointer"
              >
                <StopCircle className="w-4 h-4 animate-spin text-rose-400" />
                Detener
              </button>
            ) : (
              <button
                type="submit"
                form="form-asistente-ia"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-cobalt-1 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {status === 'completed' ? 'Regenerar' : 'Ejecutar IA'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
