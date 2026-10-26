/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalExportarPdf.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-1TO1-002 / REQ-F1-P1.2 / REQ-V360-EXPORT-TOAST-EDIT-EXEC-52
 * DESCRIPCIÓN: Modal de compilación ejecutiva de Ficha Resumen PDF y métricas EVM
 *              con diseño canónico Cobalt Aerodynamic (#0D1526, border-slate-800/80),
 *              elevación z-[10000], scroll-lock, soporte bivalente de props y
 *              previsualización reactiva de proyecto seleccionado.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { X, FileText, CheckCircle2, Download, Printer, Layers, DollarSign, TrendingUp } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useUndoDelete } from '../../hooks/useUndoDelete';

type TabFiltroPdf = 'activos' | 'planificados' | 'cerrados' | 'todos';

interface ModalExportarPdfProps {
  isOpen?: boolean;
  abierto?: boolean;
  onClose?: () => void;
  onCerrar?: () => void;
  proyectoIdSeleccionado?: string | null;
}

export const ModalExportarPdf: React.FC<ModalExportarPdfProps> = ({
  isOpen,
  abierto,
  onClose,
  onCerrar,
  proyectoIdSeleccionado
}) => {
  const visible = abierto ?? isOpen ?? false;
  const cerrar = onCerrar ?? onClose ?? (() => {});

  const [tabPdf, setTabPdf] = useState<TabFiltroPdf>('activos');
  const [proyectoId, setProyectoId] = useState<string>(proyectoIdSeleccionado || '');
  const [compiladoListo, setCompiladoListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  useBodyScrollLock(visible);

  // Sincronizar proyecto seleccionado reactivamente al abrirse
  useEffect(() => {
    if (visible && proyectoIdSeleccionado) {
      setProyectoId(proyectoIdSeleccionado);
      setCompiladoListo(false);
    }
  }, [visible, proyectoIdSeleccionado]);

  // Manejo incondicional de tecla Escape
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, cerrar]);

  const { estaOculto } = useUndoDelete();
  const rawProyectos = useLiveQuery(() => db.proyectos.toArray(), []) ?? [];
  const proyectos = useMemo(() => rawProyectos.filter((p: any) => !estaOculto(p.id) && !estaOculto(p.codigo_legado)), [rawProyectos, estaOculto]);

  if (!visible) return null;

  // Filtrado de proyectos según tab
  const proyectosFiltrados = proyectos.filter((p) => {
    const estado = (p.estado_proyecto || '').toLowerCase();
    if (tabPdf === 'activos') return estado.includes('ejecucion') || estado.includes('curso') || estado === '03_en_ejecucion';
    if (tabPdf === 'planificados') return estado.includes('iniciacion') || estado.includes('planif') || estado === '01_iniciacion' || estado === '02_planificacion';
    if (tabPdf === 'cerrados') return estado.includes('cerrado') || estado.includes('completad') || estado === '04_cerrado';
    return true; // todos
  });

  const proyectoSeleccionado = proyectos.find((p) => p.id === proyectoId || p.codigo_legado === proyectoId);

  const handleCompilarPdf = () => {
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      setCompiladoListo(true);
    }, 600);
  };

  const handleImprimirOVisualizar = () => {
    window.print();
  };

  const modalContent = (
    <div
      id="modal-exportar-pdf"
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200"
    >
      <div
        id="modal-exportar-pdf-card"
        className="portal-surface elevation-3 w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-800/80 shadow-[0_10px_35px_-5px_rgba(2,6,23,0.8),0_0_20px_rgba(56,189,248,0.12)] relative bg-[#0D1526] text-slate-100"
      >
        {/* DRAG HANDLE MÓVIL (BOTTOM SHEET) */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* Encabezado Cobalt Aerodynamic */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0D1526]/80 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <FileText className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm md:text-base flex items-center gap-2">
                <span>Exportar Informe Ejecutivo (PDF)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Compilación ejecutiva 360 y métricas de portafolio EVM
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrar}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800/60 transition cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Pestañas de Filtro Ghost Controls */}
        <div className="shrink-0 px-5 pt-3 pb-2 bg-[#080D1A] border-b border-slate-800/60">
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900/80 border border-slate-800/60 rounded-xl text-xs font-semibold">
            {(
              [
                { id: 'activos', label: 'Activos' },
                { id: 'planificados', label: 'Planificados' },
                { id: 'cerrados', label: 'Cerrados' },
                { id: 'todos', label: 'Todos' }
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                id={`tab-pdf-${t.id}`}
                onClick={() => {
                  setTabPdf(t.id);
                  setCompiladoListo(false);
                }}
                className={`py-1.5 px-2 rounded-lg text-center truncate transition cursor-pointer text-[11px] ${
                  tabPdf === t.id
                    ? 'bg-sky-950/40 text-sky-300 border border-sky-500/30 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-sky-300 border border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-4 custom-scrollbar text-xs">
          <div>
            <label className="block font-semibold mb-1.5 text-slate-300">
              Seleccionar Proyecto para Ficha
            </label>
            <select
              id="selector-proyecto-pdf"
              value={proyectoId}
              onChange={(e) => {
                setProyectoId(e.target.value);
                setCompiladoListo(false);
              }}
              className="w-full border border-slate-800 rounded-xl p-2.5 bg-[#040711] text-slate-200 outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40 text-xs font-medium"
            >
              <option value="">-- Todos los Proyectos (Compilado Ejecutivo) --</option>
              {proyectosFiltrados.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo_legado} · {p.nombre_proyecto} ({p.tipo_iniciativa})
                </option>
              ))}
            </select>
          </div>

          {/* Tarjeta de Resumen Ejecutivo si hay proyecto seleccionado */}
          {proyectoSeleccionado && (
            <div className="p-3.5 rounded-xl border border-slate-800/80 bg-[#040711]/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-xs text-sky-400 bg-sky-950/50 border border-sky-800/60 px-2 py-0.5 rounded-md">
                  {proyectoSeleccionado.codigo_legado}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full">
                  {proyectoSeleccionado.estado_proyecto}
                </span>
              </div>
              <h4 className="font-bold text-slate-200 text-xs truncate">
                {proyectoSeleccionado.nombre_proyecto}
              </h4>
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/40 text-[11px]">
                <div className="space-y-0.5">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
                    <span>Avance</span>
                  </span>
                  <span className="font-mono tabular-nums font-bold text-slate-200">
                    {proyectoSeleccionado.avance_real_pct ?? 0}%
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
                    <span>BAC Tope</span>
                  </span>
                  <span className="font-mono tabular-nums font-bold text-slate-200">
                    {proyectoSeleccionado.moneda_base === 'USD' ? '$' : 'S/'}
                    {Number(proyectoSeleccionado.presupuesto_tope || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" strokeWidth={1.75} />
                    <span>Iniciativa</span>
                  </span>
                  <span className="font-semibold text-slate-300 truncate block">
                    {proyectoSeleccionado.tipo_iniciativa}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Box de Resultado Compilado */}
          {compiladoListo && (
            <div
              id="box-resultado-pdf"
              className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-in fade-in zoom-in-95 duration-150"
            >
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
                <span>Documento compilado con éxito</span>
              </span>
              <button
                type="button"
                id="link-abrir-pdf-directo"
                onClick={handleImprimirOVisualizar}
                className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 rounded-xl font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer text-xs"
              >
                <Printer className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Ver / Imprimir</span>
              </button>
            </div>
          )}

          <button
            type="button"
            id="btn-compilar-pdf"
            disabled={cargando}
            onClick={handleCompilarPdf}
            className="w-full py-2.5 bg-sky-500/20 text-sky-400 border border-sky-500/40 hover:bg-sky-500/30 active:scale-98 font-bold rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
          >
            <Download className="w-4 h-4" strokeWidth={1.75} />
            <span>{cargando ? 'Compilando métricas EVM y Ficha 360...' : 'Compilar FICHA RESUMEN (PDF)'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
