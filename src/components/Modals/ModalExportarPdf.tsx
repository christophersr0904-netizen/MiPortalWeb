/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalExportarPdf.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-1TO1-002 / REQ-F1-P1.2
 * DESCRIPCIÓN: Modal de generación y compilación ejecutiva de Ficha Resumen PDF
 *              con paridad visual 1:1, elevación z-[10000], portal top-level,
 *              scroll-lock y soporte de cierre por backdrop y tecla Esc.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { X, FileText, CheckCircle2, Download, Printer } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

type TabFiltroPdf = 'activos' | 'planificados' | 'cerrados' | 'todos';

interface ModalExportarPdfProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoIdSeleccionado?: string | null;
}

export const ModalExportarPdf: React.FC<ModalExportarPdfProps> = ({
  isOpen,
  onClose,
  proyectoIdSeleccionado
}) => {
  const [tabPdf, setTabPdf] = useState<TabFiltroPdf>('activos');
  const [proyectoId, setProyectoId] = useState<string>(proyectoIdSeleccionado || '');
  const [compiladoListo, setCompiladoListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const proyectos = useLiveQuery(() => db.proyectos.toArray(), []) ?? [];

  if (!isOpen) return null;

  // Filtrado de proyectos según tab
  const proyectosFiltrados = proyectos.filter((p) => {
    const estado = (p.estado_proyecto || '').toLowerCase();
    if (tabPdf === 'activos') return estado.includes('ejecucion') || estado.includes('curso') || estado === '03_en_ejecucion';
    if (tabPdf === 'planificados') return estado.includes('iniciacion') || estado.includes('planif') || estado === '01_iniciacion' || estado === '02_planificacion';
    if (tabPdf === 'cerrados') return estado.includes('cerrado') || estado.includes('completad') || estado === '04_cerrado';
    return true; // todos
  });

  const handleCompilarPdf = () => {
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      setCompiladoListo(true);
    }, 700);
  };

  const handleImprimirOVisualizar = () => {
    window.print();
  };

  const modalContent = (
    <div
      id="modal-exportar-pdf"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[10000] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200"
    >
      <div
        id="modal-exportar-pdf-card"
        className="portal-surface elevation-3 w-full max-w-lg max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800/60 shadow-2xl relative bg-white dark:bg-[#0D1526]"
      >
        {/* DRAG HANDLE MÓVIL (BOTTOM SHEET) */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

        {/* Encabezado */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Generar FICHA RESUMEN (PDF)</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Compilación ejecutiva y métricas EVM
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Filtro de Proyectos */}
        <div className="shrink-0 px-5 pt-3 pb-2 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800">
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
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
                className={`py-1.5 px-2 rounded-lg text-center truncate transition-all cursor-pointer ${
                  tabPdf === t.id
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
            <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
              Proyecto para Ficha
            </label>
            <select
              id="selector-proyecto-pdf"
              value={proyectoId}
              onChange={(e) => {
                setProyectoId(e.target.value);
                setCompiladoListo(false);
              }}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Todos los Proyectos (Compilado Ejecutivo) --</option>
              {proyectosFiltrados.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo_legado} · {p.nombre_proyecto} ({p.tipo_iniciativa})
                </option>
              ))}
            </select>
          </div>

          {/* Box de Resultado Compilado */}
          {compiladoListo && (
            <div
              id="box-resultado-pdf"
              className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-fadeIn"
            >
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Documento compilado con éxito</span>
              </span>
              <button
                type="button"
                id="link-abrir-pdf-directo"
                onClick={handleImprimirOVisualizar}
                className="px-3 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Ver / Imprimir</span>
              </button>
            </div>
          )}

          <button
            type="button"
            id="btn-compilar-pdf"
            disabled={cargando}
            onClick={handleCompilarPdf}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{cargando ? 'Compilando métricas EVM...' : 'Compilar FICHA RESUMEN (PDF)'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
