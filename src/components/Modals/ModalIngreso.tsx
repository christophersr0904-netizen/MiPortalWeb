/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalIngreso.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-F1-P1.2b
 * DESCRIPCIÓN: Modal interactivo de registro y edición de ingresos (Modo Dual:
 *              Real vs Programado) con paridad 1:1 de Modal_Finanzas.html,
 *              createPortal y elevación canónica z-[10000].
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import type { IngresoRecord } from '../../types';
import {
  X,
  Clock,
  Save,
  Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';

export interface ModalIngresoProps {
  isOpen: boolean;
  onClose: () => void;
  ingresoEditar?: IngresoRecord | null;
  onGuardadoExitoso?: (ingreso: IngresoRecord) => void;
}

export const ModalIngreso: React.FC<ModalIngresoProps> = ({
  isOpen,
  onClose,
  ingresoEditar,
  onGuardadoExitoso
}) => {
  useBodyScrollLock(isOpen);

  // Modo Dual: Real vs Programado
  const [modoDual, setModoDual] = useState<'REAL' | 'PROGRAMADO'>('REAL');

  // Form fields
  const [descripcion, setDescripcion] = useState('');
  const [categoriaIngreso, setCategoriaIngreso] = useState('Sueldo_Nomina');
  const [proyectoAsociado, setProyectoAsociado] = useState('PERSONAL');
  const [montoOriginal, setMontoOriginal] = useState<string>('');
  const [moneda, setMoneda] = useState<'PEN' | 'USD' | 'EUR'>('PEN');
  const [tipoCambio, setTipoCambio] = useState<number>(1.0);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('09:00');
  const [frecuencia, setFrecuencia] = useState<'UNICA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'>('UNICA');
  const [agendarCalendar, setAgendarCalendar] = useState(true);
  const [cuentaDestino, setCuentaDestino] = useState('BCP');

  // Proyectos disponibles en Dexie
  const listaProyectos = useLiveQuery(() => db.proyectos.toArray()) || [];

  // Actualizar tipo de cambio según moneda
  useEffect(() => {
    if (moneda === 'PEN') setTipoCambio(1.0);
    else if (moneda === 'USD') setTipoCambio(3.75);
    else if (moneda === 'EUR') setTipoCambio(4.10);
  }, [moneda]);

  // Carga o reset
  useEffect(() => {
    if (!isOpen) return;

    if (ingresoEditar) {
      setDescripcion(ingresoEditar.descripcion_ingreso || '');
      setMontoOriginal(String(ingresoEditar.monto_original || ''));
      setMoneda(ingresoEditar.moneda_original || 'PEN');
      setTipoCambio(ingresoEditar.tipo_cambio || 1.0);
      setCategoriaIngreso(ingresoEditar.categoria_ingreso || 'Sueldo_Nomina');
      setFecha(ingresoEditar.fecha_ingreso || '');
      setCuentaDestino(ingresoEditar.cuenta_destino || 'BCP');
      setModoDual(ingresoEditar.estado_cobro === 'PENDIENTE' ? 'PROGRAMADO' : 'REAL');
    } else {
      setDescripcion('');
      setMontoOriginal('');
      setMoneda('PEN');
      setTipoCambio(1.0);
      setCategoriaIngreso('Sueldo_Nomina');
      setProyectoAsociado('PERSONAL');
      const hoy = new Date().toISOString().split('T')[0];
      setFecha(hoy);
      setHora('09:00');
      setFrecuencia('UNICA');
      setAgendarCalendar(true);
      setCuentaDestino('BCP');
      setModoDual('REAL');
    }
  }, [isOpen, ingresoEditar]);

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
    let codigoLegado = ingresoEditar?.codigo_legado;
    let idIngreso = ingresoEditar?.id;

    if (!ingresoEditar) {
      idIngreso = crypto.randomUUID();
      const count = await db.ingresos.count();
      codigoLegado = `ING-${String(count + 1).padStart(3, '0')}`;
    }

    const payload: IngresoRecord = {
      id: idIngreso!,
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: codigoLegado!,
      tipo_origen: proyectoAsociado === 'PERSONAL' ? 'LIBRE_CORRIENTE' : 'PROYECTO',
      categoria_ingreso: categoriaIngreso,
      fecha_ingreso: fecha || nowIso.split('T')[0],
      descripcion_ingreso: descripcion.trim(),
      moneda_original: moneda,
      monto_original: montoNum,
      tipo_cambio: tipoCambio,
      monto_pen: montoPEN,
      cuenta_destino: cuentaDestino,
      estado_cobro: modoDual === 'REAL' ? 'COBRADO' : 'PENDIENTE',
      updated_at: nowIso,
      sync_status: 'pending'
    };

    await db.ingresos.put(payload);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: ingresoEditar ? 'Ingreso modificado' : modoDual === 'REAL' ? 'Ingreso registrado en Tesorería' : 'Cobro proyectado guardado',
      showConfirmButton: false,
      timer: 2000,
      background: '#0D1526',
      color: '#f8fafc'
    });

    if (onGuardadoExitoso) onGuardadoExitoso(payload);
    onClose();
  };

  const handleEliminar = async () => {
    if (!ingresoEditar) return;
    const result = await Swal.fire({
      title: '¿Eliminar registro de ingreso?',
      text: `Se borrará "${ingresoEditar.descripcion_ingreso}" (${ingresoEditar.codigo_legado}).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e11d48',
      background: '#0D1526',
      color: '#f8fafc'
    });

    if (result.isConfirmed) {
      await db.ingresos.delete(ingresoEditar.id);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Ingreso eliminado',
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
      id="modal-ingreso"
      className="fixed inset-0 z-[10000] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-ingreso-card"
        className="portal-surface elevation-3 w-full max-w-xl max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative bg-white dark:bg-[#0D1526] text-slate-800 dark:text-slate-100"
      >
        {/* Drag handle móvil */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* Cabecera */}
        <div
          id="modal-ingreso-header"
          className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/30 backdrop-blur-xs"
        >
          <div className="flex items-center gap-2">
            <span
              id="badge-ingreso-header-dot"
              className={`w-3 h-3 rounded-full shadow-xs ${modoDual === 'REAL' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
            />
            <div>
              <h3 id="txt-modal-ingreso-titulo" className="font-bold text-sm text-emerald-900 dark:text-emerald-300 leading-tight">
                {ingresoEditar
                  ? `Modificar Ingreso (${ingresoEditar.codigo_legado})`
                  : modoDual === 'REAL'
                    ? 'Registrar Ingreso Inmediato'
                    : 'Registrar Ingreso Programado'}
              </h3>
              <span className="text-[10px] text-slate-400">Inyección de liquidez y cobros proyectados</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              id="badge-ingreso-modo"
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${modoDual === 'REAL'
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
              onClick={() => setModoDual('REAL')}
              className={`py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${modoDual === 'REAL'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-emerald-200/60 dark:border-emerald-800/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
            >
              <span>Movimiento Real / Inmediato</span>
            </button>
            <button
              type="button"
              onClick={() => setModoDual('PROGRAMADO')}
              className={`py-1.5 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${modoDual === 'PROGRAMADO'
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
            {/* Descripción */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Descripción / Concepto Comercial
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                placeholder="Ej. Pago de cliente ABC, Sueldo mensual, Cobro de factura..."
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Origen y Proyecto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Origen / Fuente
                </label>
                <select
                  value={categoriaIngreso}
                  onChange={(e) => setCategoriaIngreso(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none font-medium"
                >
                  <option value="Sueldo_Nomina">Sueldo / Nómina</option>
                  <option value="Honorarios_Freelance">Honorarios / Freelance</option>
                  <option value="Negocio_Emprendimiento">Negocio / Emprendimiento</option>
                  <option value="Inversiones_Rendimientos">Inversiones / Rendimientos</option>
                  <option value="Obsequio_Monetario">Obsequio / Donación</option>
                  <option value="Ventas_Activos">Venta de Activos</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Proyecto Asociado
                </label>
                <select
                  value={proyectoAsociado}
                  onChange={(e) => setProyectoAsociado(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none font-medium"
                >
                  <option value="PERSONAL">-- Ingreso Personal / Libre --</option>
                  {listaProyectos.map((p) => (
                    <option key={p.id} value={p.codigo_legado}>
                      {p.codigo_legado} - {p.nombre_proyecto}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Moneda y Monto */}
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

            {/* Fecha y TC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {modoDual === 'REAL' ? 'Fecha de Cobro / Depósito' : 'Fecha Prevista de Cobro'}
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
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

            {/* BLOQUE EXCLUSIVO PARA INGRESOS PROGRAMADOS */}
            {modoDual === 'PROGRAMADO' && (
              <div
                id="bloque-ingreso-programado"
                className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-3 animate-fadeIn"
              >
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Parámetros de Cobro Proyectado</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Hora Prevista de Cobro
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
                      Crea el evento en &quot;PMO - Ingresos Programados&quot;
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Cuenta Destino */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {modoDual === 'REAL' ? 'Cuenta Destino (Depositado)' : 'Cuenta Destino Prevista'}
              </label>
              <select
                value={cuentaDestino}
                onChange={(e) => setCuentaDestino(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium outline-none"
              >
                <option value="BCP">BCP</option>
                <option value="IBK">IBK (Interbank)</option>
                <option value="BBVA">BBVA</option>
                <option value="SCTBK">Scotiabank</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-2.5">
            {ingresoEditar ? (
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
                className={`px-4 py-2 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${modoDual === 'REAL' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {ingresoEditar
                    ? 'Guardar Cambios'
                    : modoDual === 'REAL'
                      ? 'Registrar Ingreso Real'
                      : 'Guardar Cobro Programado'}
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
