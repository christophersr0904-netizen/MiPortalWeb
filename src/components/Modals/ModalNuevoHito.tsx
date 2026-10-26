/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalNuevoHito.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-V360-GRAFOS-ROUTING-MODAL-EXEC-54
 * DESCRIPCIÓN: Modal Bento Canónico Cobalt Aerodynamic para creación de
 *              Paquetes de Trabajo (WP) e Hitos Marcadores (HIT) con validación
 *              de fase, código WBS, cálculo de correlativo, métricas CPM,
 *              definición de Definition of Done (DoD) y persistencia Local-First.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  X,
  Plus,
  Layers,
  Flag,
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  Percent,
  GitBranch,
  FileCheck
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { mostrarToastCobalt } from '../../utils/toastCobalt';
import type { TipoElementoWBS, HitoWbsRecord } from '../../types';

export interface ModalNuevoHitoProps {
  isOpen?: boolean;
  abierto?: boolean;
  onClose?: () => void;
  onCerrar?: () => void;
  proyectoId: string;
  proyectoCodigo?: string;
  faseSugerida?: string;
  fasesDisponibles?: string[];
  onHitoCreado?: () => void;
}

const FASES_DEFAULT = [
  '01_INICIACION',
  '02_PLANIFICACION',
  '03_EJECUCION',
  '04_CONTROL',
  '05_CIERRE'
];

export const ModalNuevoHito: React.FC<ModalNuevoHitoProps> = ({
  isOpen,
  abierto,
  onClose,
  onCerrar,
  proyectoId,
  proyectoCodigo,
  faseSugerida,
  fasesDisponibles = [],
  onHitoCreado
}) => {
  const visible = abierto ?? isOpen ?? false;
  const cerrar = onCerrar ?? onClose ?? (() => {});

  useBodyScrollLock(visible);

  // Consulta de hitos existentes para precedencias y conteo correlativo
  const hitosExistentes = useLiveQuery(
    async () => {
      if (!proyectoId) return [];
      return db.hitos_wbs
        .filter((h) => h.proyecto_id === proyectoId || (h as any).proyecto_codigo === proyectoCodigo)
        .toArray();
    },
    [proyectoId, proyectoCodigo]
  ) ?? [];

  // Form states
  const [tipoElemento, setTipoElemento] = useState<TipoElementoWBS>('PAQUETE_TRABAJO');
  const [nombre, setNombre] = useState('');
  const [faseAsociada, setFaseAsociada] = useState('');
  const [wbsCode, setWbsCode] = useState('');
  const [pesoPct, setPesoPct] = useState<number>(10);
  const [duracionDias, setDuracionDias] = useState<number>(5);
  const [presupuesto, setPresupuesto] = useState<number>(0);
  const [fechaLimite, setFechaLimite] = useState('');
  const [criterioDod, setCriterioDod] = useState('');
  const [dependenciaHitoId, setDependenciaHitoId] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Lista unificada de fases disponibles
  const listaFases = Array.from(
    new Set([
      ...(faseSugerida ? [faseSugerida] : []),
      ...fasesDisponibles,
      ...FASES_DEFAULT
    ])
  ).filter(Boolean);

  // Sincronizar defaults al abrir
  useEffect(() => {
    if (visible) {
      setNombre('');
      setTipoElemento('PAQUETE_TRABAJO');
      setFaseAsociada(faseSugerida || fasesDisponibles[0] || FASES_DEFAULT[0]);
      setPesoPct(10);
      setDuracionDias(5);
      setPresupuesto(0);
      setCriterioDod('');
      setDependenciaHitoId('');
      setErrorValidacion(null);
      setGuardando(false);

      // Fecha límite sugerida: hoy + 14 días
      const hoy = new Date();
      hoy.setDate(hoy.getDate() + 14);
      setFechaLimite(hoy.toISOString().split('T')[0]);

      // Sugerir código WBS
      const totalExistentes = hitosExistentes.length;
      setWbsCode(`1.${totalExistentes + 1}`);
    }
  }, [visible, faseSugerida, fasesDisponibles, hitosExistentes.length]);

  // Manejo de ESC
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

  if (!visible) return null;

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorValidacion('El nombre del hito o entregable es obligatorio.');
      return;
    }

    setGuardando(true);
    setErrorValidacion(null);

    try {
      // Calcular correlativo según tipo
      const prefijo = tipoElemento === 'HITO_MARCADOR' ? 'HIT' : 'WP';
      const elementosMismoTipo = hitosExistentes.filter((h) =>
        (h.tipo_elemento_wbs || '').toUpperCase() === tipoElemento.toUpperCase() ||
        (h.codigo_legado || '').startsWith(prefijo)
      );
      const correlativoNum = elementosMismoTipo.length + 1;
      const nuevoCodigo = `${prefijo}-${String(correlativoNum).padStart(3, '0')}`;

      const pesoNormalizado = Number((pesoPct / 100).toFixed(4));
      const duracionReal = tipoElemento === 'HITO_MARCADOR' ? 0 : Math.max(0, duracionDias);
      const presupuestoReal = tipoElemento === 'HITO_MARCADOR' ? 0 : Math.max(0, presupuesto);

      const nuevoHito: HitoWbsRecord = {
        id: `hito-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: nuevoCodigo,
        proyecto_id: proyectoId,
        tipo_elemento_wbs: tipoElemento,
        wbs_code: wbsCode.trim() || `1.${correlativoNum}`,
        fase_asociada: faseAsociada || 'Fase General',
        nombre_elemento: nombre.trim(),
        estado: '01_Pendiente',
        peso_pct: pesoNormalizado,
        fecha_limite: fechaLimite || new Date().toISOString().split('T')[0],
        presupuesto_asignado: presupuestoReal,
        duracion_estimada_dias: duracionReal,
        criterio_dod: criterioDod.trim() || undefined,
        dependencia_hito_id: dependenciaHitoId || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
        sync_status: 'pending'
      };

      // Compatibilidad bivalente con campos de render legacy de ViewDetalle360
      const hitoCompat = {
        ...nuevoHito,
        proyecto_codigo: proyectoCodigo,
        nombre_hito: nuevoHito.nombre_elemento,
        peso_ponderado_pct: nuevoHito.peso_pct,
        fecha_limite_plan: nuevoHito.fecha_limite,
        duracion_dias: nuevoHito.duracion_estimada_dias
      };

      await db.hitos_wbs.add(hitoCompat as any);

      mostrarToastCobalt(
        `Hito ${nuevoCodigo} (${nuevoHito.nombre_elemento}) registrado con éxito`,
        'success',
        2500
      );

      onHitoCreado?.();
      cerrar();
    } catch (err: any) {
      console.error('[ModalNuevoHito] Error al registrar hito:', err);
      setErrorValidacion('Error al guardar el entregable en Dexie: ' + (err?.message || 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-nuevo-hito-titulo"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0D1526] border border-slate-800/80 shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(30,58,138,0.18)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Bento */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Layers className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2
                id="modal-nuevo-hito-titulo"
                className="text-base font-bold text-slate-100 flex items-center gap-2 truncate"
              >
                <span>Nuevo Hito / Entregable WBS</span>
                {proyectoCodigo && (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                    {proyectoCodigo}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Estructuración de paquetes de trabajo, checkpoints DoD y cotas CPM
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrar}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Formulario Bento con Scroll Interno */}
        <form onSubmit={handleGuardar} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorValidacion && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {errorValidacion}
            </div>
          )}

          {/* Tarjeta Bento 1: Tipo de Elemento WBS */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Tipo de Elemento WBS
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoElemento('PAQUETE_TRABAJO')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  tipoElemento === 'PAQUETE_TRABAJO'
                    ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_15px_rgba(56,189,248,0.15)] ring-1 ring-sky-500/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    tipoElemento === 'PAQUETE_TRABAJO'
                      ? 'bg-sky-500/20 text-sky-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Briefcase className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <div
                    className={`text-xs font-bold ${
                      tipoElemento === 'PAQUETE_TRABAJO' ? 'text-sky-300' : 'text-slate-300'
                    }`}
                  >
                    Paquete de Trabajo (WP)
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Entregable con desglose de tareas, presupuesto y asignación.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoElemento('HITO_MARCADOR');
                  setPresupuesto(0);
                  setDuracionDias(0);
                }}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  tipoElemento === 'HITO_MARCADOR'
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    tipoElemento === 'HITO_MARCADOR'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Flag className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <div
                    className={`text-xs font-bold ${
                      tipoElemento === 'HITO_MARCADOR' ? 'text-amber-300' : 'text-slate-300'
                    }`}
                  >
                    Hito Marcador (HIT)
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Checkpoint clave de control / DoD sin coste directo (duración 0).
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Tarjeta Bento 2: Jerarquía y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Fase Padre Asociada
              </label>
              <select
                value={faseAsociada}
                onChange={(e) => setFaseAsociada(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition"
              >
                {listaFases.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Código WBS
              </label>
              <input
                type="text"
                value={wbsCode}
                onChange={(e) => setWbsCode(e.target.value)}
                placeholder="1.1"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          {/* Tarjeta Bento 3: Nombre y Criterio DoD */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Nombre del Entregable / Hito <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Arquitectura del Modelo de Datos y Esquemas Dexie"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                  <span>Criterio de Aceptación / Definition of Done (DoD)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
              </label>
              <textarea
                rows={2}
                value={criterioDod}
                onChange={(e) => setCriterioDod(e.target.value)}
                placeholder="Condiciones específicas requeridas para dar por aprobado este hito..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition resize-none"
              />
            </div>
          </div>

          {/* Tarjeta Bento 4: Métricas Numéricas CPM & Finanzas */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Ponderación */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
                  <span>Ponderación</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={pesoPct}
                    onChange={(e) => setPesoPct(Math.max(1, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 pr-7 text-xs text-slate-100 font-mono tabular-nums focus:outline-none focus:border-sky-500 transition"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500 font-mono">%</span>
                </div>
              </div>

              {/* Duración Días */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" strokeWidth={1.75} />
                  <span>Duración (CPM)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={365}
                    disabled={tipoElemento === 'HITO_MARCADOR'}
                    value={duracionDias}
                    onChange={(e) => setDuracionDias(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 pr-10 text-xs text-slate-100 font-mono tabular-nums disabled:opacity-50 disabled:bg-slate-950 focus:outline-none focus:border-sky-500 transition"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500 font-mono">días</span>
                </div>
              </div>

              {/* Presupuesto */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
                  <span>Presupuesto</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={10}
                    disabled={tipoElemento === 'HITO_MARCADOR'}
                    value={presupuesto}
                    onChange={(e) => setPresupuesto(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 pr-9 text-xs text-slate-100 font-mono tabular-nums disabled:opacity-50 disabled:bg-slate-950 focus:outline-none focus:border-sky-500 transition"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500 font-mono">PEN</span>
                </div>
              </div>

              {/* Fecha Límite */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" strokeWidth={1.75} />
                  <span>Fecha Límite</span>
                </label>
                <input
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono tabular-nums focus:outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>

            {/* Selector de Predecesor CPM */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <GitBranch className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
                <span>Predecesor Directo (Cálculo de Red de Dependencias CPM)</span>
              </label>
              <select
                value={dependenciaHitoId}
                onChange={(e) => setDependenciaHitoId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition"
              >
                <option value="">Sin predecesor (Inicio paralelo o independiente)</option>
                {hitosExistentes.map((h) => (
                  <option key={h.id} value={h.codigo_legado || h.id}>
                    {h.codigo_legado || h.id} - {h.nombre_elemento || (h as any).nombre_hito}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Bento */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={cerrar}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800/60 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>{guardando ? 'Guardando...' : 'Crear Hito WBS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
