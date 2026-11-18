/**
 * ============================================================================
 * ARCHIVO: src/hooks/useGastoForm.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-ARCH-01-EXEC (Desacoplamiento de Cerebro / Clean Architecture)
 * DESCRIPCIÓN: Custom Hook que encapsula el estado, consultas reactivas a Dexie,
 *              inteligencia EVM, atajos de teclado y persistencia para ModalGasto.
 * ============================================================================
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useBodyScrollLock } from './useBodyScrollLock';
import { useUndoDelete } from './useUndoDelete';
import { crearGasto, actualizarGasto, eliminarGasto } from '../services/gastosService';
import { formatFechaIsoLocal } from '../utils/timeFormatters';
import { FolderKanban, Milestone, CheckSquare } from 'lucide-react';
import type { GastoRecord } from '../types';

export interface UseGastoFormProps {
  isOpen: boolean;
  onClose: () => void;
  gastoEditar?: GastoRecord | null;
  onGuardadoExitoso?: (gasto: GastoRecord) => void;
  proyectoPreseleccionadoId?: string;
  tareaPreseleccionadaId?: string;
}

export function useGastoForm({
  isOpen,
  onClose,
  gastoEditar,
  onGuardadoExitoso,
  proyectoPreseleccionadoId,
  tareaPreseleccionadaId
}: UseGastoFormProps) {
  useBodyScrollLock(isOpen);
  const { programarEliminacion } = useUndoDelete();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modo Dual: Real vs Programado
  const [modoDual, setModoDual] = useState<'REAL' | 'PROGRAMADO'>('REAL');

  // Form Fields
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

    const tareasDelHitoKeys = new Set(
      listaTareas
        .filter((t) => t.hito_codigo === hitoSeleccionado.codigo_legado || (t as any).hito_id === hitoSeleccionado.id)
        .map((t) => (t.codigo_legado || t.id).toUpperCase())
    );

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

  // Mapeo de Opciones para Selectores
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

  // Hidratación y Reset
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

  // Conmutador automático de fecha
  const handleFechaChange = (nuevaFecha: string) => {
    setFecha(nuevaFecha);
    const hoy = formatFechaIsoLocal(new Date());
    if (nuevaFecha > hoy) {
      setModoDual('PROGRAMADO');
    }
  };

  // Handlers WBS Cascada
  const handleSelectProyecto = (cod: string) => {
    setSelectedProyecto(cod);
    setSelectedHito('');
    setSelectedTarea('');
  };

  const handleSelectHito = (cod: string) => {
    setSelectedHito(cod);
    setSelectedTarea('');
  };

  const handleSelectTarea = (cod: string) => {
    setSelectedTarea(cod);
  };

  // Guardado Asíncrono
  const handleGuardar = useCallback(async (e?: React.FormEvent) => {
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
      estado_pago: modoDual === 'REAL' ? 'PAGADO' : 'PENDIENTE',
      agendar_calendar: agendarCalendar,
      agendado_calendar: agendarCalendar ? 'Sí' : 'No'
    };

    let resultado: GastoRecord;
    if (gastoEditar) {
      resultado = await actualizarGasto(gastoEditar.id, payloadDatos);
    } else {
      resultado = await crearGasto(payloadDatos);
    }

    if (onGuardadoExitoso) onGuardadoExitoso(resultado);
    onClose();
  }, [
    descripcion,
    montoNum,
    tipoOrigen,
    selectedTarea,
    selectedHito,
    selectedProyecto,
    categoriaGasto,
    fecha,
    moneda,
    tipoCambio,
    montoPEN,
    metodoPago,
    modoDual,
    agendarCalendar,
    gastoEditar,
    onGuardadoExitoso,
    onClose
  ]);

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

  // Eliminación con Búfer Undo
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

  return {
    isOpen,
    onClose,
    gastoEditar,
    errorMsg,
    setErrorMsg,
    modoDual,
    setModoDual,
    descripcion,
    setDescripcion,
    tipoOrigen,
    setTipoOrigen,
    categoriaGasto,
    setCategoriaGasto,
    montoOriginal,
    setMontoOriginal,
    moneda,
    setMoneda,
    tipoCambio,
    fecha,
    hora,
    setHora,
    frecuencia,
    setFrecuencia,
    agendarCalendar,
    setAgendarCalendar,
    metodoPago,
    setMetodoPago,
    montoPEN,
    selectedProyecto,
    selectedHito,
    selectedTarea,
    handleSelectProyecto,
    handleSelectHito,
    handleSelectTarea,
    proyectoSeleccionado,
    hitoSeleccionado,
    metricasEVMHito,
    opcionesProyectos,
    opcionesHitos,
    opcionesTareas,
    handleFechaChange,
    handleGuardar,
    handleEliminar
  };
}

