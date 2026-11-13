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
import { useUndoDelete } from '../../hooks/useUndoDelete';
import { crearIngreso, actualizarIngreso, eliminarIngreso } from '../../services/ingresosService';
import { formatFechaIsoLocal } from '../../utils/timeFormatters';
import { SwitchCobalt } from '../UI/SwitchCobalt';

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
  const { programarEliminacion } = useUndoDelete();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setErrorMsg(null);

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
      const hoy = formatFechaIsoLocal(new Date());
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
    const hoy = formatFechaIsoLocal(new Date());
    if (nuevaFecha > hoy) {
      setModoDual('PROGRAMADO');
    }
  };

  if (!isOpen) return null;

  const montoNum = parseFloat(montoOriginal) || 0;
  const montoPEN = Number((montoNum * tipoCambio).toFixed(2));

  const handleGuardar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!descripcion.trim() || montoNum <= 0) {
      setErrorMsg('Ingresa una descripción y monto válido');
      return;
    }
    setErrorMsg(null);

    const payloadDatos: Partial<IngresoRecord> = {
      tipo_origen: proyectoAsociado === 'PERSONAL' ? 'LIBRE_CORRIENTE' : 'PROYECTO',
      categoria_ingreso: categoriaIngreso,
      fecha_ingreso: fecha || formatFechaIsoLocal(new Date()),
      descripcion_ingreso: descripcion.trim(),
      moneda_original: moneda,
      monto_original: montoNum,
      tipo_cambio: tipoCambio,
      monto_pen: montoPEN,
      cuenta_destino: cuentaDestino,
      estado_cobro: modoDual === 'REAL' ? 'COBRADO' : 'PENDIENTE'
    };

    let resultado: IngresoRecord;
    if (ingresoEditar) {
      resultado = await actualizarIngreso(ingresoEditar.id, payloadDatos);
    } else {
      resultado = await crearIngreso(payloadDatos);
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
    if (!ingresoEditar) return;
    const targetId = ingresoEditar.id;
    const desc = ingresoEditar.descripcion_ingreso || ingresoEditar.codigo_legado || 'Ingreso';
    programarEliminacion({
      tabla: 'ingresos',
      id: targetId,
      etiqueta: desc,
      tipo: 'INGRESO',
      commit: async () => {
        await eliminarIngreso(targetId);
      }
    });
    onClose();
  };

  return createPortal(
    <div
      id="modal-ingreso"
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-ingreso-card"
        className="portal-surface elevation-3 w-full max-w-xl max-h-[92dvh] rounded-t-3xl sm:rounded-2xl bg-[#0D1526] border-t sm:border border-slate-700/60 flex flex-col shadow-cobalt-2 relative text-slate-100 overflow-hidden"
      >
        {/* Drag handle móvil */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* Cabecera */}
        <div
          id="modal-ingreso-header"
          className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-800 flex justify-between items-center bg-[#0D1526]/80 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            <span
              id="badge-ingreso-header-dot"
              className={`w-3 h-3 rounded-full shadow-sm ${
                modoDual === 'REAL' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <div>
              <h3 id="txt-modal-ingreso-titulo" className="font-bold text-sm text-emerald-400 leading-tight">
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
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:py-4 min-h-0 space-y-3.5 custom-scrollbar text-xs">
            {/* Monto Hero en Tope (Mobile-First) */}
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="input-monto-ingreso"
                  className="font-semibold text-[11px] uppercase tracking-wider text-slate-400"
                >
                  Monto del Ingreso ({moneda})
                </label>
                <select
                  aria-label="Moneda del ingreso"
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as 'PEN' | 'USD' | 'EUR')}
                  className="bg-slate-950/80 border border-slate-700/70 text-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="PEN">PEN (S/)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <input
                id="input-monto-ingreso"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                required
                value={montoOriginal}
                onChange={(e) => setMontoOriginal(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950/60 border border-slate-800/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 rounded-xl px-3 text-2xl font-mono tabular-nums font-bold text-center py-2 text-slate-100 placeholder-slate-600 outline-none"
              />
              {moneda !== 'PEN' && (
                <div className="mt-1.5 text-center text-[11px] font-mono tabular-nums font-bold text-emerald-400">
                  ≈ S/ {montoPEN}
                </div>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block font-semibold mb-1 text-slate-300">
                Descripción / Concepto Comercial
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                placeholder="Ej. Pago de cliente ABC, Sueldo mensual, Cobro de factura..."
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 rounded-xl p-2.5 outline-none font-medium"
              />
            </div>

            {/* Origen y Proyecto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Origen / Fuente
                </label>
                <select
                  value={categoriaIngreso}
                  onChange={(e) => setCategoriaIngreso(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 outline-none font-medium rounded-xl p-2 focus:border-sky-500"
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
                <label className="block font-semibold mb-1 text-slate-300">
                  Proyecto Asociado
                </label>
                <select
                  value={proyectoAsociado}
                  onChange={(e) => setProyectoAsociado(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 outline-none font-medium rounded-xl p-2 focus:border-sky-500"
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

            {/* Fecha y TC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {modoDual === 'REAL' ? 'Fecha de Cobro / Depósito' : 'Fecha Prevista de Cobro'}
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  required
                  className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 font-medium outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 rounded-xl p-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-200">Tipo de Cambio</label>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1 font-mono">
                    TC: {tipoCambio.toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={tipoCambio}
                    readOnly
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl p-2 font-mono select-none outline-none"
                  />
                  {moneda !== 'PEN' && (
                    <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">
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
                className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/60 space-y-3 transform-gpu transition-opacity duration-200"
              >
                <div className="flex items-center gap-2 text-amber-200 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Parámetros de Cobro Proyectado</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-300">
                      Hora Prevista de Cobro
                    </label>
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 font-mono text-xs outline-none rounded-lg p-2 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-300">
                      Recurrencia / Frecuencia
                    </label>
                    <select
                      value={frecuencia}
                      onChange={(e) => setFrecuencia(e.target.value as any)}
                      className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 text-xs outline-none font-medium rounded-lg p-2 focus:border-sky-500"
                    >
                      <option value="UNICA">Única / Puntual</option>
                      <option value="SEMANAL">Semanal</option>
                      <option value="QUINCENAL">Quincenal</option>
                      <option value="MENSUAL">Mensual</option>
                    </select>
                  </div>
                </div>

                <div className="pt-1 border-t border-amber-800/40">
                  <SwitchCobalt
                    id="switch-ingreso-calendar"
                    checked={agendarCalendar}
                    onChange={setAgendarCalendar}
                    label="Agendar en Google Calendar"
                    sublabel="Recordatorio financiero sincronizado"
                    size="sm"
                  />
                </div>
              </div>
            )}

            {/* Cuenta Destino */}
            <div>
              <label className="block font-semibold mb-1 text-slate-300">
                {modoDual === 'REAL' ? 'Cuenta Destino (Depositado)' : 'Cuenta Destino Prevista'}
              </label>
              <select
                value={cuentaDestino}
                onChange={(e) => setCuentaDestino(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 font-medium outline-none rounded-xl p-2 focus:border-sky-500"
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
          <div className="shrink-0 sticky bottom-0 bg-[#0D1526]/95 backdrop-blur-md p-3 border-t border-slate-800/80 sm:px-6 z-10 flex items-center justify-between gap-2.5 shadow-lg pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {ingresoEditar ? (
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
                className="h-11 px-4 text-white rounded-xl font-bold text-xs shadow-md shadow-sky-950/50 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 bg-sky-500 hover:bg-sky-400"
              >
                <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
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
