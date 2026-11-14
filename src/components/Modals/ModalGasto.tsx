/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalGasto.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-F1-P1.2b
 * DESCRIPCIÓN: Modal interactivo de registro y edición de egresos (Modo Dual:
 *              Real vs Programado) con paridad 1:1 de Modal_Finanzas.html,
 *              cascada WBS de 3 niveles, createPortal y elevación canónica z-[10000].
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import type { GastoRecord } from '../../types';
import { formatFechaIsoLocal } from '../../utils/timeFormatters';
import {
  X,
  Clock,
  Briefcase,
  User,
  Trash2,
  Save,
  FolderKanban,
  Milestone,
  CheckSquare,
  CornerDownRight,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import { crearGasto, actualizarGasto, eliminarGasto } from '../../services/gastosService';
import { SwitchCobalt } from '../UI/SwitchCobalt';
import { SelectIconicoCobalt } from '../UI/SelectIconicoCobalt';
import {
  OPCIONES_MONEDA_COBALT,
  OPCIONES_CATEGORIA_GASTO_COBALT,
  OPCIONES_METODO_PAGO_COBALT,
  OPCIONES_FRECUENCIA_COBALT
} from '../../constants/uiMappers';

export interface ModalGastoProps {
  isOpen: boolean;
  onClose: () => void;
  gastoEditar?: GastoRecord | null;
  onGuardadoExitoso?: (gasto: GastoRecord) => void;
  proyectoPreseleccionadoId?: string;
  tareaPreseleccionadaId?: string;
}

export const ModalGasto: React.FC<ModalGastoProps> = ({
  isOpen,
  onClose,
  gastoEditar,
  onGuardadoExitoso,
  proyectoPreseleccionadoId,
  tareaPreseleccionadaId
}) => {
  useBodyScrollLock(isOpen);
  const { programarEliminacion } = useUndoDelete();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modo Dual: Real vs Programado
  const [modoDual, setModoDual] = useState<'REAL' | 'PROGRAMADO'>('REAL');

  // Form fields
  const [descripcion, setDescripcion] = useState('');
  const [tipoOrigen, setTipoOrigen] = useState<'Actividad Personal' | 'Tarea Proyecto' | 'Libre Corriente'>('Actividad Personal');
  const [categoriaGasto, setCategoriaGasto] = useState('Materiales');
  const [montoOriginal, setMontoOriginal] = useState<string>('');
  const [moneda, setMoneda] = useState<'PEN' | 'USD' | 'EUR'>('PEN');
  const [tipoCambio, setTipoCambio] = useState<number>(1.0);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('09:00');
  const [frecuencia, setFrecuencia] = useState<'UNICA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'>('UNICA');
  const [agendarCalendar, setAgendarCalendar] = useState(true);
  const [metodoPago, setMetodoPago] = useState('Transferencia Bancaria');

  // Cálculos numéricos derivados
  const montoNum = parseFloat(montoOriginal) || 0;
  const montoPEN = Number((montoNum * tipoCambio).toFixed(2));

  // Cascada WBS 3 Niveles
  const [selectedProyecto, setSelectedProyecto] = useState<string>('');
  const [selectedHito, setSelectedHito] = useState<string>('');
  const [selectedTarea, setSelectedTarea] = useState<string>('');

  // Consultas reactivas en Dexie
  const listaProyectos = useLiveQuery(() => db.proyectos.toArray()) || [];
  const listaGastos = useLiveQuery(() => db.gastos.toArray()) || [];

  const listaHitos = useLiveQuery(async () => {
    if (!selectedProyecto) return db.hitos_wbs.toArray();
    return db.hitos_wbs
      .filter((h) => h.proyecto_id === selectedProyecto || h.proyecto_codigo === selectedProyecto)
      .toArray();
  }, [selectedProyecto]) || [];

  const listaTareas = useLiveQuery(async () => {
    if (!selectedProyecto) return db.tareas.toArray();
    return db.tareas
      .filter((t) => {
        const matchProy = t.proyecto_codigo === selectedProyecto || t.proyecto_id === selectedProyecto;
        if (!matchProy) return false;
        if (selectedHito) {
          return t.hito_codigo === selectedHito || (t as any).hito_id === selectedHito;
        }
        return true;
      })
      .toArray();
  }, [selectedProyecto, selectedHito]) || [];

  const proyectoSeleccionado = useMemo(() => {
    if (!selectedProyecto) return null;
    return listaProyectos.find((p) => p.codigo_legado === selectedProyecto || p.id === selectedProyecto) || null;
  }, [listaProyectos, selectedProyecto]);

  const hitoSeleccionado = useMemo(() => {
    if (!selectedHito) return null;
    return listaHitos.find((h) => h.codigo_legado === selectedHito || h.id === selectedHito) || null;
  }, [listaHitos, selectedHito]);

  // Inteligencia EVM reactiva sobre el hito seleccionado
  const metricasEVMHito = useMemo(() => {
    if (!hitoSeleccionado) return null;

    const presupuestoTecho = Number(hitoSeleccionado.presupuesto_asignado || (hitoSeleccionado as any).presupuesto || 0);
    const hitoKey = (hitoSeleccionado.codigo_legado || hitoSeleccionado.id).toUpperCase();

    // Tareas que pertenecen a este hito
    const tareasDelHitoKeys = new Set(
      listaTareas
        .filter((t) => t.hito_codigo === hitoSeleccionado.codigo_legado || (t as any).hito_id === hitoSeleccionado.id)
        .map((t) => (t.codigo_legado || t.id).toUpperCase())
    );

    // Gastos acumulados previos vinculados al hito o a sus tareas
    const gastoPrevioPEN = listaGastos
      .filter((g) => {
        if (gastoEditar && g.id === gastoEditar.id) return false;
        const idVinculado = String(g.id_origen_vinculado || '').toUpperCase();
        return idVinculado === hitoKey || tareasDelHitoKeys.has(idVinculado);
      })
      .reduce((sum, g) => sum + (Number(g.monto_pen) || 0), 0);

    const gastoTotalConActualPEN = gastoPrevioPEN + montoPEN;
    const saldoRestantePEN = Math.max(0, presupuestoTecho - gastoTotalConActualPEN);
    const excedePresupuesto = presupuestoTecho > 0 && gastoTotalConActualPEN > presupuestoTecho;
    const montoExcesoPEN = excedePresupuesto ? gastoTotalConActualPEN - presupuestoTecho : 0;
    const pctConsumo = presupuestoTecho > 0
      ? Math.min(100, Math.round((gastoTotalConActualPEN / presupuestoTecho) * 100))
      : 0;

    return {
      presupuestoTecho,
      gastoPrevioPEN,
      gastoTotalConActualPEN,
      saldoRestantePEN,
      excedePresupuesto,
      montoExcesoPEN,
      pctConsumo
    };
  }, [hitoSeleccionado, listaTareas, listaGastos, gastoEditar, montoPEN]);

  const opcionesProyectos = useMemo(() => [
    { valor: '', etiqueta: '-- Seleccionar Proyecto --' },
    ...listaProyectos.map((p) => ({
      valor: p.codigo_legado || p.id,
      etiqueta: p.nombre_proyecto,
      subtitulo: p.codigo_legado,
      badge: p.codigo_legado,
      colorBadge: 'bg-sky-950/60 text-sky-300 border-sky-500/40 font-mono font-bold',
      icono: FolderKanban
    }))
  ], [listaProyectos]);

  const opcionesHitos = useMemo(() => [
    { valor: '', etiqueta: '-- Seleccionar Hito WBS --' },
    ...listaHitos.map((h) => ({
      valor: h.codigo_legado || h.id,
      etiqueta: h.nombre_elemento || h.nombre_hito || h.codigo_legado,
      subtitulo: h.wbs_code ? `WBS: ${h.wbs_code}` : h.codigo_legado,
      badge: h.codigo_legado,
      colorBadge: 'bg-purple-950/60 text-purple-300 border-purple-500/40 font-mono font-bold',
      icono: Milestone
    }))
  ], [listaHitos]);

  const opcionesTareas = useMemo(() => [
    { valor: '', etiqueta: 'Sin tarea específica' },
    ...listaTareas.map((t) => ({
      valor: t.codigo_legado || t.id,
      etiqueta: t.nombre_tarea_actividad,
      subtitulo: t.codigo_legado,
      badge: t.codigo_legado,
      colorBadge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 font-mono font-bold',
      icono: CheckSquare
    }))
  ], [listaTareas]);

  // Actualizar tipo de cambio según moneda
  useEffect(() => {
    if (moneda === 'PEN') setTipoCambio(1.0);
    else if (moneda === 'USD') setTipoCambio(3.75);
    else if (moneda === 'EUR') setTipoCambio(4.10);
  }, [moneda]);

  // Carga o reset
  useEffect(() => {
    if (!isOpen) return;

    if (gastoEditar) {
      setDescripcion(gastoEditar.descripcion_gasto || '');
      setMontoOriginal(String(gastoEditar.monto_original || ''));
      setMoneda(gastoEditar.moneda_original || 'PEN');
      setTipoCambio(gastoEditar.tipo_cambio || 1.0);
      setCategoriaGasto(gastoEditar.categoria_gasto || 'Materiales');
      setFecha(gastoEditar.fecha_gasto || '');
      setMetodoPago(gastoEditar.metodo_pago || 'Transferencia Bancaria');
      setModoDual(gastoEditar.estado_pago === 'PENDIENTE' || gastoEditar.estado_pago === 'PROGRAMADO' ? 'PROGRAMADO' : 'REAL');

      if (gastoEditar.tipo_origen === 'TAREA_PROYECTO') {
        setTipoOrigen('Tarea Proyecto');
        setSelectedTarea(gastoEditar.id_origen_vinculado || '');
      } else {
        setTipoOrigen('Actividad Personal');
      }
    } else {
      setDescripcion('');
      setMontoOriginal('');
      setMoneda('PEN');
      setTipoCambio(1.0);
      setCategoriaGasto('Materiales');
      const hoy = formatFechaIsoLocal(new Date());
      setFecha(hoy);
      setHora('09:00');
      setFrecuencia('UNICA');
      setAgendarCalendar(true);
      setMetodoPago('Transferencia Bancaria');
      setModoDual('REAL');

      if (proyectoPreseleccionadoId) {
        setTipoOrigen('Tarea Proyecto');
        setSelectedProyecto(proyectoPreseleccionadoId);
        if (tareaPreseleccionadaId) setSelectedTarea(tareaPreseleccionadaId);
      } else {
        setTipoOrigen('Actividad Personal');
        setSelectedProyecto('');
        setSelectedHito('');
        setSelectedTarea('');
      }
    }
  }, [isOpen, gastoEditar, proyectoPreseleccionadoId, tareaPreseleccionadaId]);

  // Autoconmutar a PROGRAMADO si la fecha es futura
  const handleFechaChange = (nuevaFecha: string) => {
    setFecha(nuevaFecha);
    const hoy = formatFechaIsoLocal(new Date());
    if (nuevaFecha > hoy) {
      setModoDual('PROGRAMADO');
    }
  };

  const handleGuardar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!descripcion.trim() || montoNum <= 0) {
      setErrorMsg('Ingresa una descripción válida y un monto mayor a 0');
      return;
    }

    const payloadDatos: Partial<GastoRecord> = {
      tipo_origen: tipoOrigen === 'Tarea Proyecto' ? 'TAREA_PROYECTO' : 'ACTIVIDAD_PERSONAL',
      id_origen_vinculado:
        tipoOrigen === 'Tarea Proyecto'
          ? selectedTarea || selectedHito || selectedProyecto || undefined
          : undefined,
      categoria_gasto: categoriaGasto,
      fecha_gasto: fecha || formatFechaIsoLocal(new Date()),
      descripcion_gasto: descripcion.trim(),
      moneda_original: moneda,
      monto_original: montoNum,
      tipo_cambio: tipoCambio,
      monto_pen: montoPEN,
      metodo_pago: metodoPago,
      estado_pago: modoDual === 'REAL' ? 'PAGADO' : 'PENDIENTE'
    };

    let resultado: GastoRecord;
    if (gastoEditar) {
      resultado = await actualizarGasto(gastoEditar.id, payloadDatos);
    } else {
      resultado = await crearGasto(payloadDatos);
    }

    if (onGuardadoExitoso) onGuardadoExitoso(resultado);
    onClose();
  };

  // Listener de Teclado (Escape y Ctrl+Enter / Cmd+Enter)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGuardar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleGuardar]);

  const handleEliminar = () => {
    if (!gastoEditar) return;
    const targetId = gastoEditar.id;
    const desc = gastoEditar.descripcion_gasto || gastoEditar.codigo_legado || 'Gasto';
    programarEliminacion({
      tabla: 'gastos',
      id: targetId,
      etiqueta: desc,
      tipo: 'GASTO',
      commit: async () => {
        await eliminarGasto(targetId);
      }
    });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      id="modal-gasto"
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-gasto-card"
        className="portal-surface elevation-3 w-full max-w-2xl max-h-[92dvh] rounded-t-3xl sm:rounded-2xl bg-[#0D1526] border-t sm:border border-slate-700/60 flex flex-col shadow-[0_20px_50px_rgba(2,6,23,0.9),0_0_30px_rgba(56,189,248,0.12)] relative text-slate-100 overflow-hidden"
      >
        {/* Drag handle móvil */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* Cabecera Dinámica */}
        <div
          id="modal-gasto-header"
          className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-800 flex justify-between items-center bg-[#0D1526]/80 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            <span
              id="badge-gasto-header-dot"
              className={`w-3 h-3 rounded-full shadow-sm ${
                modoDual === 'REAL' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <div>
              <h3 id="txt-modal-gasto-titulo" className="font-bold text-sm text-slate-100 leading-tight">
                {gastoEditar
                  ? `Modificar Gasto (${gastoEditar.codigo_legado})`
                  : modoDual === 'REAL'
                  ? 'Registrar Gasto Inmediato'
                  : 'Registrar Gasto Programado'}
              </h3>
              <span className="text-[10px] text-slate-400">Control de salidas y compromisos financieros</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              id="badge-gasto-modo"
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                modoDual === 'REAL'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'bg-amber-950 text-amber-300 border border-amber-800/60'
              }`}
            >
              {modoDual === 'REAL' ? 'Real / Inmediato' : 'Programado / Futuro'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Micro-banner de Error de Validación Inline con Altura Reservada Anti-CLS */}
        <div className="mx-5 min-h-[24px] mt-2 flex items-center">
          <div
            className={`w-full px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between transition-opacity duration-200 ${
              errorMsg ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <span>{errorMsg || ''}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="p-0.5 text-rose-400 hover:text-rose-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Selector Segmentado: Modo Dual */}
        <div className="px-5 pt-3 pb-2 bg-slate-900/40 border-b border-slate-800">
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-xl gap-1 text-xs border border-slate-800/60">
            <button
              type="button"
              id="btn-modo-gasto-real"
              onClick={() => setModoDual('REAL')}
              className={`py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                modoDual === 'REAL'
                  ? 'bg-slate-800 text-emerald-300 shadow-xs border border-emerald-800/50'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span>Movimiento Real / Inmediato</span>
            </button>
            <button
              type="button"
              id="btn-modo-gasto-prog"
              onClick={() => setModoDual('PROGRAMADO')}
              className={`py-1.5 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                modoDual === 'PROGRAMADO'
                  ? 'bg-slate-800 text-amber-300 shadow-xs border border-amber-800/50 font-bold'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <span>Movimiento Programado / Futuro</span>
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:py-5 min-h-0 space-y-4 sm:space-y-4.5 custom-scrollbar text-xs">
            {/* Monto Hero en Tope (Mobile-First) */}
            <div className="p-3.5 rounded-2xl bg-[#040711]/90 border border-slate-800/80 shadow-inner">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label
                  htmlFor="input-monto-gasto"
                  className="font-semibold text-[11px] uppercase tracking-wider text-slate-400"
                >
                  Monto del Gasto
                </label>
                <div className="w-36 shrink-0">
                  <SelectIconicoCobalt<'PEN' | 'USD' | 'EUR'>
                    valor={moneda}
                    onChange={(nuevaMoneda) => setMoneda(nuevaMoneda)}
                    opciones={OPCIONES_MONEDA_COBALT}
                  />
                </div>
              </div>
              <input
                id="input-monto-gasto"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                required
                value={montoOriginal}
                onChange={(e) => setMontoOriginal(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0D1526] border border-slate-800/80 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/50 rounded-xl px-3 text-3xl font-mono tabular-nums font-bold text-center py-2 text-slate-100 placeholder-slate-600 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
              />
              {moneda !== 'PEN' && (
                <div className="mt-1.5 text-center text-[11px] font-mono tabular-nums font-bold text-emerald-400">
                  ≈ S/ {montoPEN}
                </div>
              )}
            </div>

            {/* Concepto */}
            <div>
              <label className="block font-semibold mb-1 text-slate-300">
                Descripción / Concepto Comercial
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                placeholder="Ej: Compra de insumos, Suscripción Figma, Almuerzo cliente..."
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 rounded-xl p-2.5 outline-none font-medium"
              />
            </div>

            {/* Clasificación / Origen */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Origen / Clasificación del Gasto
              </label>
              <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-xl gap-1 text-xs border border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setTipoOrigen('Actividad Personal')}
                  className={`py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    tipoOrigen === 'Actividad Personal'
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Actividad Personal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoOrigen('Tarea Proyecto')}
                  className={`py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    tipoOrigen === 'Tarea Proyecto'
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-sky-300'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Tarea Proyecto</span>
                </button>
              </div>
            </div>

            {/* WBS Árbol Jerárquico Vertical 100% Ancho con Integración EVM */}
            {tipoOrigen === 'Tarea Proyecto' && (
              <div className="p-4 rounded-2xl bg-[#040711]/85 border border-slate-800/80 shadow-inner space-y-4">
                {/* Cabecera del Bloque WBS */}
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-xs text-slate-200">
                      Imputación Jerárquica WBS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Estructura de Desglose de Trabajo
                  </span>
                </div>

                {/* Nivel 1: Proyecto Raíz (100% de Ancho) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                    <label className="flex items-center gap-1.5 text-sky-300">
                      <span>1. Proyecto Raíz</span>
                    </label>
                    {proyectoSeleccionado && (
                      <span className="text-[10px] font-mono text-slate-400">
                        Tope Proyecto:{' '}
                        <strong className="text-slate-200">
                          S/ {proyectoSeleccionado.presupuesto_tope?.toLocaleString()}
                        </strong>
                      </span>
                    )}
                  </div>
                  <SelectIconicoCobalt
                    valor={selectedProyecto}
                    onChange={(cod) => {
                      setSelectedProyecto(cod);
                      setSelectedHito('');
                      setSelectedTarea('');
                    }}
                    opciones={opcionesProyectos}
                    placeholder="-- Seleccionar Proyecto --"
                  />
                </div>

                {/* Nivel 2: Hito / Entregable WBS (Subordinado con Guía de Rama) */}
                <div className="relative pl-3.5 sm:pl-5 border-l-2 border-purple-500/30 ml-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                    <label className="flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>2. Hito / Entregable WBS</span>
                    </label>
                    {selectedHito && hitoSeleccionado && (
                      <span className="text-[10px] font-mono text-purple-300/80">
                        {hitoSeleccionado.wbs_code
                          ? `WBS: ${hitoSeleccionado.wbs_code}`
                          : hitoSeleccionado.codigo_legado}
                      </span>
                    )}
                  </div>
                  <SelectIconicoCobalt
                    valor={selectedHito}
                    onChange={(cod) => {
                      setSelectedHito(cod);
                      setSelectedTarea('');
                    }}
                    opciones={opcionesHitos}
                    disabled={!selectedProyecto}
                    placeholder={
                      selectedProyecto ? '-- Seleccionar Hito WBS --' : 'Primero selecciona un proyecto'
                    }
                  />

                  {/* Micro-Indicador de Presupuesto Restante (EVM) */}
                  {selectedHito && metricasEVMHito && metricasEVMHito.presupuestoTecho > 0 && (
                    <div className="mt-2 p-3 rounded-xl bg-[#080D1A] border border-slate-800/80 shadow-xs space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          Presupuesto EVM del Hito
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums text-slate-300 text-[10px]">
                            Tope:{' '}
                            <strong className="text-slate-100 font-bold">
                              S/{' '}
                              {metricasEVMHito.presupuestoTecho.toLocaleString('es-PE', {
                                minimumFractionDigits: 2
                              })}
                            </strong>
                          </span>
                          <span
                            className={`font-mono tabular-nums font-bold px-1.5 py-0.5 rounded text-[10px] border ${
                              metricasEVMHito.excedePresupuesto
                                ? 'bg-rose-950/80 text-rose-300 border-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
                                : metricasEVMHito.pctConsumo > 80
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/70'
                                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70'
                            }`}
                          >
                            {metricasEVMHito.pctConsumo}% consumido
                          </span>
                        </div>
                      </div>

                      {/* Micro-Barra de Progreso EVM */}
                      <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            metricasEVMHito.excedePresupuesto
                              ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                              : metricasEVMHito.pctConsumo > 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${metricasEVMHito.pctConsumo}%` }}
                        />
                      </div>

                      {/* Resumen de Saldo / Alerta */}
                      <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
                        <span className="text-slate-400">
                          Ejecutado previo: S/ {metricasEVMHito.gastoPrevioPEN.toFixed(2)}
                        </span>
                        {metricasEVMHito.excedePresupuesto ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                            Excede tope por S/ {metricasEVMHito.montoExcesoPEN.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold">
                            Disponible restante: S/ {metricasEVMHito.saldoRestantePEN.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Nivel 3: Tarea Operativa Específica (Subordinado de 2do Grado) */}
                <div className="relative pl-3.5 sm:pl-5 border-l-2 border-emerald-500/30 ml-5 sm:ml-7 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-300">
                    <label className="flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>3. Tarea Operativa Específica</span>
                      <span className="text-[10px] text-slate-500 font-normal">(Opcional)</span>
                    </label>
                  </div>
                  <SelectIconicoCobalt
                    valor={selectedTarea}
                    onChange={(cod) => setSelectedTarea(cod)}
                    opciones={opcionesTareas}
                    disabled={!selectedProyecto}
                    placeholder={
                      selectedProyecto
                        ? '-- Imputar al Hito general o seleccionar Tarea --'
                        : 'Primero selecciona un proyecto'
                    }
                  />
                </div>
              </div>
            )}

            {/* Bento Grid Paritario 1: Categoría del Gasto + Método de Pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <SelectIconicoCobalt
                  label="Categoría del Gasto"
                  valor={categoriaGasto}
                  onChange={(nuevaCat) => setCategoriaGasto(nuevaCat)}
                  opciones={OPCIONES_CATEGORIA_GASTO_COBALT}
                />
              </div>
              <div>
                <SelectIconicoCobalt
                  label={modoDual === 'REAL' ? 'Método de Pago (Efectuado)' : 'Método de Débito Previsto'}
                  valor={metodoPago}
                  onChange={(nuevoMetodo) => setMetodoPago(nuevoMetodo)}
                  opciones={OPCIONES_METODO_PAGO_COBALT}
                />
              </div>
            </div>

            {/* Bento Grid Paritario 2: Fecha + Tipo de Cambio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {modoDual === 'REAL' ? 'Fecha de Pago / Desembolso' : 'Fecha Programada de Vencimiento'}
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  required
                  className="w-full min-h-[42px] bg-slate-900/60 border border-slate-800 text-slate-100 font-medium outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 rounded-xl px-3 py-2 font-mono tabular-nums"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300">Tipo de Cambio</label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1 font-mono">
                    TC: {tipoCambio.toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={tipoCambio}
                    readOnly
                    className="w-full min-h-[42px] bg-[#040711] border border-slate-800 text-slate-400 rounded-xl px-3 py-2 font-mono tabular-nums font-bold select-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {moneda !== 'PEN' && (
                    <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">
                      ≈ S/ {montoPEN}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* BLOQUE EXCLUSIVO PARA MOVIMIENTOS PROGRAMADOS */}
            {modoDual === 'PROGRAMADO' && (
              <div
                id="bloque-gasto-programado"
                className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/60 space-y-3 transform-gpu transition-opacity duration-200"
              >
                <div className="flex items-center gap-2 text-amber-200 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Parámetros de Compromiso Futuro</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-300">
                      Hora de Vencimiento
                    </label>
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 font-mono text-xs outline-none rounded-lg p-2 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <SelectIconicoCobalt
                      label="Recurrencia / Frecuencia"
                      valor={frecuencia}
                      onChange={(nuevaFrec) => setFrecuencia(nuevaFrec as any)}
                      opciones={OPCIONES_FRECUENCIA_COBALT}
                    />
                  </div>
                </div>

                <div className="pt-1 border-t border-amber-800/40">
                  <SwitchCobalt
                    id="switch-gasto-calendar"
                    checked={agendarCalendar}
                    onChange={setAgendarCalendar}
                    label="Agendar en Google Calendar"
                    sublabel="Recordatorio financiero sincronizado"
                    size="sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer de Acciones */}
          <div className="shrink-0 sticky bottom-0 bg-[#0D1526]/95 backdrop-blur-md p-3 border-t border-slate-800/80 sm:px-6 z-10 flex items-center justify-between gap-2.5 shadow-lg pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {gastoEditar ? (
              <button
                type="button"
                onClick={handleEliminar}
                className="h-11 px-3.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-xs active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-11 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>
                  {gastoEditar
                    ? 'Guardar Cambios'
                    : modoDual === 'REAL'
                    ? 'Registrar Gasto Real'
                    : 'Guardar Gasto Programado'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
