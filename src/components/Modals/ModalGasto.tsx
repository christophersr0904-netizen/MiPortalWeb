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

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import type { GastoRecord } from '../../types';
import {
  X,
  Clock,
  Briefcase,
  User,
  Trash2,
  Save
} from 'lucide-react';
import Swal from 'sweetalert2';

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

  // Cascada WBS 3 Niveles
  const [selectedProyecto, setSelectedProyecto] = useState<string>('');
  const [selectedHito, setSelectedHito] = useState<string>('');
  const [selectedTarea, setSelectedTarea] = useState<string>('');

  // Consultas reactivas en Dexie
  const listaProyectos = useLiveQuery(() => db.proyectos.toArray()) || [];
  const listaHitos = useLiveQuery(() =>
    selectedProyecto
      ? db.hitos_wbs.where('proyecto_id').equals(selectedProyecto).toArray()
      : db.hitos_wbs.toArray()
  ) || [];
  const listaTareas = useLiveQuery(() =>
    selectedProyecto
      ? db.tareas.where('proyecto_codigo').equals(selectedProyecto).toArray()
      : db.tareas.toArray()
  ) || [];

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
      const hoy = new Date().toISOString().split('T')[0];
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
    const hoy = new Date().toISOString().split('T')[0];
    if (nuevaFecha > hoy) {
      setModoDual('PROGRAMADO');
    }
  };

  // Listener de Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const montoNum = parseFloat(montoOriginal) || 0;
  const montoPEN = Number((montoNum * tipoCambio).toFixed(2));

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim() || montoNum <= 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Ingresa una descripción y monto válido',
        showConfirmButton: false,
        timer: 2000,
        background: '#0D1526',
        color: '#f8fafc'
      });
      return;
    }

    const nowIso = new Date().toISOString();
    let codigoLegado = gastoEditar?.codigo_legado;
    let idGasto = gastoEditar?.id;

    if (!gastoEditar) {
      idGasto = crypto.randomUUID();
      const count = await db.gastos.count();
      codigoLegado = `GAS-${String(count + 1).padStart(3, '0')}`;
    }

    const payload: GastoRecord = {
      id: idGasto!,
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: codigoLegado!,
      tipo_origen: tipoOrigen === 'Tarea Proyecto' ? 'TAREA_PROYECTO' : 'ACTIVIDAD_PERSONAL',
      id_origen_vinculado: tipoOrigen === 'Tarea Proyecto' ? selectedTarea || undefined : undefined,
      categoria_gasto: categoriaGasto,
      fecha_gasto: fecha || nowIso.split('T')[0],
      descripcion_gasto: descripcion.trim(),
      moneda_original: moneda,
      monto_original: montoNum,
      tipo_cambio: tipoCambio,
      monto_pen: montoPEN,
      metodo_pago: metodoPago,
      estado_pago: modoDual === 'REAL' ? 'PAGADO' : 'PENDIENTE',
      updated_at: nowIso,
      sync_status: 'pending'
    };

    await db.gastos.put(payload);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: gastoEditar ? 'Gasto modificado' : modoDual === 'REAL' ? 'Gasto registrado (Real)' : 'Compromiso programado en Finanzas',
      showConfirmButton: false,
      timer: 2000,
      background: '#0D1526',
      color: '#f8fafc'
    });

    if (onGuardadoExitoso) onGuardadoExitoso(payload);
    onClose();
  };

  const handleEliminar = async () => {
    if (!gastoEditar) return;
    const result = await Swal.fire({
      title: '¿Eliminar registro de gasto?',
      text: `Se eliminará "${gastoEditar.descripcion_gasto}" (${gastoEditar.codigo_legado}).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e11d48',
      background: '#0D1526',
      color: '#f8fafc'
    });

    if (result.isConfirmed) {
      await db.gastos.delete(gastoEditar.id);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Gasto eliminado',
        showConfirmButton: false,
        timer: 2000,
        background: '#0D1526',
        color: '#f8fafc'
      });
      onClose();
    }
  };

  return createPortal(
    <div
      id="modal-gasto"
      className="fixed inset-0 z-[10000] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-gasto-card"
        className="portal-surface elevation-3 w-full max-w-xl max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative bg-white dark:bg-[#0D1526] text-slate-800 dark:text-slate-100"
      >
        {/* Drag handle móvil */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* Cabecera Dinámica */}
        <div
          id="modal-gasto-header"
          className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="flex items-center gap-2">
            <span
              id="badge-gasto-header-dot"
              className={`w-3 h-3 rounded-full shadow-xs ${
                modoDual === 'REAL' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <div>
              <h3 id="txt-modal-gasto-titulo" className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">
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
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {modoDual === 'REAL' ? 'Real / Inmediato' : 'Programado / Futuro'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selector Segmentado: Modo Dual */}
        <div className="px-5 pt-3 pb-2 bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-200/60 dark:border-slate-800">
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 dark:bg-slate-900/90 rounded-xl gap-1 text-xs">
            <button
              type="button"
              id="btn-modo-gasto-real"
              onClick={() => setModoDual('REAL')}
              className={`py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                modoDual === 'REAL'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-emerald-200/60 dark:border-emerald-800/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
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
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-xs border border-amber-200/60 dark:border-amber-800/50 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              <span>Movimiento Programado / Futuro</span>
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-3.5 custom-scrollbar text-xs">
            {/* Concepto */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Descripción / Concepto Comercial
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                placeholder="Ej: Compra de insumos, Suscripción Figma, Almuerzo cliente..."
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Clasificación / Origen */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Origen / Clasificación del Gasto
              </label>
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTipoOrigen('Actividad Personal')}
                  className={`py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    tipoOrigen === 'Actividad Personal'
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
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
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Tarea Proyecto</span>
                </button>
              </div>
            </div>

            {/* WBS Cascada de 3 niveles si es Tarea Proyecto */}
            {tipoOrigen === 'Tarea Proyecto' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-[10px]">
                    1. Proyecto
                  </label>
                  <select
                    value={selectedProyecto}
                    onChange={(e) => {
                      setSelectedProyecto(e.target.value);
                      setSelectedHito('');
                      setSelectedTarea('');
                    }}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="">-- Seleccionar --</option>
                    {listaProyectos.map((p) => (
                      <option key={p.id} value={p.codigo_legado}>
                        {p.codigo_legado} - {p.nombre_proyecto}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-[10px]">
                    2. Hito WBS
                  </label>
                  <select
                    value={selectedHito}
                    onChange={(e) => setSelectedHito(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="">-- Seleccionar --</option>
                    {listaHitos.map((h) => (
                      <option key={h.id} value={h.codigo_legado}>
                        {h.codigo_legado} ({h.wbs_code}) {h.nombre_elemento}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-[10px]">
                    3. Tarea Operativa
                  </label>
                  <select
                    value={selectedTarea}
                    onChange={(e) => setSelectedTarea(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 text-xs font-mono"
                  >
                    <option value="">Sin tarea específica</option>
                    {listaTareas.map((t) => (
                      <option key={t.id} value={t.codigo_legado}>
                        {t.codigo_legado} - {t.nombre_tarea_actividad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Categoría y Monto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Categoría del Gasto
                </label>
                <select
                  value={categoriaGasto}
                  onChange={(e) => setCategoriaGasto(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none font-medium"
                >
                  <option value="Materiales">Materiales</option>
                  <option value="Servicios Profesionales">Servicios Profesionales</option>
                  <option value="Licencias / Software">Licencias / Software</option>
                  <option value="Marketing / Publicidad">Marketing / Publicidad</option>
                  <option value="Logística / Transporte">Logística / Transporte</option>
                  <option value="Equipos / Hardware">Equipos / Hardware</option>
                  <option value="Cuota_Credito">Cuota de Crédito</option>
                  <option value="Alquiler / Servicios">Alquiler / Servicios</option>
                  <option value="Alimentación">Alimentación</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Monto Original
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={montoOriginal}
                  onChange={(e) => setMontoOriginal(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono font-bold text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Moneda y Tipo de Cambio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                  Moneda
                </label>
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as 'PEN' | 'USD' | 'EUR')}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none font-medium"
                >
                  <option value="PEN">PEN (S/)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-200">Tipo de Cambio</label>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center gap-1 font-mono">
                    TC: {tipoCambio.toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={tipoCambio}
                    readOnly
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-500 select-none outline-none"
                  />
                  {moneda !== 'PEN' && (
                    <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      ≈ S/ {montoPEN}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {modoDual === 'REAL' ? 'Fecha de Pago / Desembolso' : 'Fecha Programada de Vencimiento'}
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => handleFechaChange(e.target.value)}
                required
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* BLOQUE EXCLUSIVO PARA MOVIMIENTOS PROGRAMADOS */}
            {modoDual === 'PROGRAMADO' && (
              <div
                id="bloque-gasto-programado"
                className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-3 animate-fadeIn"
              >
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Parámetros de Compromiso Futuro</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Hora de Vencimiento
                    </label>
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Recurrencia / Frecuencia
                    </label>
                    <select
                      value={frecuencia}
                      onChange={(e) => setFrecuencia(e.target.value as any)}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs outline-none font-medium"
                    >
                      <option value="UNICA">Única / Puntual</option>
                      <option value="SEMANAL">Semanal</option>
                      <option value="QUINCENAL">Quincenal</option>
                      <option value="MENSUAL">Mensual</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agendarCalendar}
                    onChange={(e) => setAgendarCalendar(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                      Agendar recordatorio en Google Calendar
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Crea el evento en &quot;PMO - Gastos Programados&quot;
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Método de Pago */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {modoDual === 'REAL' ? 'Método de Pago (Efectuado)' : 'Método de Débito Previsto'}
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none font-medium"
              >
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Billetera Digital (Yape/Plin)">Yape / Plin</option>
                <option value="Débito Automático">Débito Automático</option>
              </select>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-2.5">
            {gastoEditar ? (
              <button
                type="button"
                onClick={handleEliminar}
                className="px-3.5 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold flex items-center gap-1.5 transition text-xs active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  modoDual === 'REAL' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
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
