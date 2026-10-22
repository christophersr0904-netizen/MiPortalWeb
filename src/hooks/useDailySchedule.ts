/**
 * ============================================================================
 * ARCHIVO: src/hooks/useDailySchedule.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-DAILY-HUD-COCKPIT-EXEC-38
 * DESCRIPCIÓN: Hook reactivo unificado para alimentar la Cápsula Diaria Flotante,
 *              Cockpit de ejecución (Hoy/Mañana/Semana) y cálculo de ritmo horario.
 * ============================================================================
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { completarActividadPersonalLocal } from '../services/habitosService';
import type { TareaRecord, ActividadPersonal, GastoRecord, CuotaRecord } from '../types';

export type HorizonteAgenda = 'HOY' | 'MANANA' | 'SEMANA';
export type TipoItemAgenda = 'TAREA' | 'HABITO' | 'GASTO' | 'CUOTA';
export type EstadoRitmoItem = 'VENCIDO_PASADO' | 'FOCUS_ACTUAL' | 'PROXIMO_EN_ESPERA';

export interface DailyScheduleItem {
  id: string;
  tipo: TipoItemAgenda;
  codigoLegado: string;
  titulo: string;
  subtitulo: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  duracionMinutos: number;
  completado: boolean;
  categoria?: string;
  prioridad?: string;
  nivelEnergia?: string;
  monto?: number;
  moneda?: string;
  estadoRitmo: EstadoRitmoItem;
  raw: TareaRecord | ActividadPersonal | GastoRecord | CuotaRecord;
}

export interface MetricRitmoHorario {
  totalProgramadoHastaAhora: number;
  completadasHastaAhora: number;
  porcentajeRitmo: number;
  totalItems: number;
  completadasTotal: number;
  porcentajeTotal: number;
  siguienteItem: DailyScheduleItem | null;
  itemEnFocus: DailyScheduleItem | null;
}

/**
 * Suma minutos a una cadena horaria 'HH:mm' y devuelve 'HH:mm'
 */
export function sumarMinutosAHora(horaStr: string, minutos: number): string {
  if (!horaStr || !horaStr.includes(':')) return '23:59';
  const [hStr, mStr] = horaStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const totalMinutos = h * 60 + m + Math.max(0, minutos);
  const finH = Math.min(23, Math.floor(totalMinutos / 60));
  const finM = totalMinutos % 60;
  return `${String(finH).padStart(2, '0')}:${String(finM).padStart(2, '0')}`;
}

/**
 * Formatea una fecha Date a 'YYYY-MM-DD' en hora local
 */
export function formatFechaIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Obtiene la lista de fechas según el horizonte solicitado
 */
export function obtenerFechasHorizonte(horizonte: HorizonteAgenda, baseDate: Date = new Date()): string[] {
  const hoyStr = formatFechaIsoLocal(baseDate);

  if (horizonte === 'HOY') {
    return [hoyStr];
  }

  if (horizonte === 'MANANA') {
    const manana = new Date(baseDate);
    manana.setDate(manana.getDate() + 1);
    return [formatFechaIsoLocal(manana)];
  }

  // SEMANA: 7 días corridos a partir de hoy
  const fechas: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    fechas.push(formatFechaIsoLocal(d));
  }
  return fechas;
}

export function useDailySchedule(horizonte: HorizonteAgenda = 'HOY') {
  // 1. Reloj reactivo de pared desacoplado (intervalo 30s)
  const [horaActual, setHoraActual] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const [fechaActual, setFechaActual] = useState(() => formatFechaIsoLocal(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setHoraActual(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setFechaActual(formatFechaIsoLocal(now));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fechas del horizonte solicitado
  const fechasHorizonte = useMemo(() => {
    return obtenerFechasHorizonte(horizonte, new Date(fechaActual + 'T12:00:00'));
  }, [horizonte, fechaActual]);

  const fechasSet = useMemo(() => new Set(fechasHorizonte), [fechasHorizonte]);

  // 2. Consulta reactiva unificada a Dexie
  const datosDexie = useLiveQuery(async () => {
    const [actividades, tareas, gastos, cuotas] = await Promise.all([
      db.actividades_personales.toArray(),
      db.tareas.toArray(),
      db.gastos.toArray(),
      db.cuotas.toArray()
    ]);

    return { actividades, tareas, gastos, cuotas };
  }, []);

  // 3. Normalización y Ritmo Dinámico
  const items = useMemo(() => {
    if (!datosDexie) return [];
    const list: DailyScheduleItem[] = [];

    // --- A. TAREAS WBS ---
    for (const t of datosDexie.tareas) {
      if (t.estado_tarea === '05_Archivado') continue;
      const fProg = t.fecha_programada ? t.fecha_programada.split('T')[0] : '';
      if (!fProg || !fechasSet.has(fProg)) continue;

      const horaIni = t.hora_inicio?.trim() || '09:00';
      const durMin = Math.round((t.horas_estimadas || 1) * 60);
      const horaFin = sumarMinutosAHora(horaIni, durMin);
      const completado = t.estado_tarea === '04_Completado';

      // Estado del ritmo
      let estadoRitmo: EstadoRitmoItem = 'PROXIMO_EN_ESPERA';
      if (fProg < fechaActual || (fProg === fechaActual && horaFin < horaActual)) {
        estadoRitmo = 'VENCIDO_PASADO';
      } else if (fProg === fechaActual && horaIni <= horaActual && horaFin >= horaActual) {
        estadoRitmo = 'FOCUS_ACTUAL';
      }

      list.push({
        id: t.id,
        tipo: 'TAREA',
        codigoLegado: t.codigo_legado,
        titulo: t.nombre_tarea_actividad,
        subtitulo: `${t.codigo_legado} · ${t.proyecto_codigo || 'General'}`,
        fecha: fProg,
        horaInicio: horaIni,
        horaFin: horaFin,
        duracionMinutos: durMin,
        completado,
        categoria: t.proyecto_codigo || 'Proyecto',
        prioridad: t.prioridad_eisenhower || '02_P2_Media',
        nivelEnergia: t.nivel_energia_requerido || 'Media_Operativa',
        estadoRitmo,
        raw: t
      });
    }

    // --- B. ACTIVIDADES PERSONALES / HÁBITOS ---
    for (const a of datosDexie.actividades) {
      if (a.estado === '05_Archivado') continue;
      const fProg = a.fecha_programada ? a.fecha_programada.split('T')[0] : '';
      if (!fProg || !fechasSet.has(fProg)) continue;

      const horaIni = a.hora_inicio?.trim() || '07:00';
      const durMin = Math.round((a.duracion_horas || 0.5) * 60);
      const horaFin = sumarMinutosAHora(horaIni, durMin);
      const completado = a.estado === '04_Completado';

      let estadoRitmo: EstadoRitmoItem = 'PROXIMO_EN_ESPERA';
      if (fProg < fechaActual || (fProg === fechaActual && horaFin < horaActual)) {
        estadoRitmo = 'VENCIDO_PASADO';
      } else if (fProg === fechaActual && horaIni <= horaActual && horaFin >= horaActual) {
        estadoRitmo = 'FOCUS_ACTUAL';
      }

      list.push({
        id: a.id,
        tipo: 'HABITO',
        codigoLegado: a.codigo_legado,
        titulo: a.nombre_actividad,
        subtitulo: `${a.codigo_legado} · ${a.categoria_vida || 'Hábito'}`,
        fecha: fProg,
        horaInicio: horaIni,
        horaFin: horaFin,
        duracionMinutos: durMin,
        completado,
        categoria: a.categoria_vida,
        estadoRitmo,
        raw: a
      });
    }

    // --- C. GASTOS COMPROMETIDOS ---
    for (const g of datosDexie.gastos) {
      const fGasto = g.fecha_gasto ? g.fecha_gasto.split('T')[0] : '';
      if (!fGasto || !fechasSet.has(fGasto)) continue;
      // Excluir si ya fue pagado
      if (g.estado_pago === 'PAGADO') continue;

      const horaIni = '08:00'; // Slot contable diurno
      const horaFin = '08:30';
      const completado = false;

      let estadoRitmo: EstadoRitmoItem = 'PROXIMO_EN_ESPERA';
      if (fGasto < fechaActual || (fGasto === fechaActual && horaFin < horaActual)) {
        estadoRitmo = 'VENCIDO_PASADO';
      } else if (fGasto === fechaActual && horaIni <= horaActual && horaFin >= horaActual) {
        estadoRitmo = 'FOCUS_ACTUAL';
      }

      list.push({
        id: g.id,
        tipo: 'GASTO',
        codigoLegado: g.codigo_legado,
        titulo: g.descripcion_gasto || 'Pago Programado',
        subtitulo: `${g.codigo_legado} · S/ ${(g.monto_pen || 0).toFixed(2)}`,
        fecha: fGasto,
        horaInicio: horaIni,
        horaFin: horaFin,
        duracionMinutos: 30,
        completado,
        categoria: g.categoria_gasto || 'Finanzas',
        monto: g.monto_pen,
        moneda: g.moneda_original || 'PEN',
        estadoRitmo,
        raw: g
      });
    }

    // --- D. CUOTAS FINANCIERAS ---
    for (const c of datosDexie.cuotas) {
      const fVenc = c.fecha_vencimiento ? c.fecha_vencimiento.split('T')[0] : '';
      if (!fVenc || !fechasSet.has(fVenc)) continue;
      if (c.estado_cuota === 'PAGADO') continue;

      const horaIni = '08:30';
      const horaFin = '09:00';
      const completado = false;

      let estadoRitmo: EstadoRitmoItem = 'PROXIMO_EN_ESPERA';
      if (fVenc < fechaActual || (fVenc === fechaActual && horaFin < horaActual)) {
        estadoRitmo = 'VENCIDO_PASADO';
      } else if (fVenc === fechaActual && horaIni <= horaActual && horaFin >= horaActual) {
        estadoRitmo = 'FOCUS_ACTUAL';
      }

      list.push({
        id: c.id,
        tipo: 'CUOTA',
        codigoLegado: c.codigo_legado,
        titulo: `Cuota ${c.numero_cuota}/${c.total_cuotas} · ${c.entidad_financiera}`,
        subtitulo: `${c.codigo_legado} · ${c.moneda} ${(c.monto_cuota || 0).toFixed(2)}`,
        fecha: fVenc,
        horaInicio: horaIni,
        horaFin: horaFin,
        duracionMinutos: 30,
        completado,
        categoria: 'Cuota Crédito',
        monto: c.monto_cuota,
        moneda: c.moneda,
        estadoRitmo,
        raw: c
      });
    }

    // Ordenar cronológicamente: primero por fecha, luego por horaInicio
    return list.sort((a, b) => {
      const cmpFecha = a.fecha.localeCompare(b.fecha);
      if (cmpFecha !== 0) return cmpFecha;
      return a.horaInicio.localeCompare(b.horaInicio);
    });
  }, [datosDexie, fechasSet, fechaActual, horaActual]);

  // 4. Métricas de Ritmo Horario
  const metricas: MetricRitmoHorario = useMemo(() => {
    const totalItems = items.length;
    const completadasTotal = items.filter((i) => i.completado).length;
    const porcentajeTotal = totalItems > 0 ? Math.round((completadasTotal / totalItems) * 100) : 0;

    // Entidades programadas hasta el momento presente de hoy
    const itemsHoyHastaAhora = items.filter((i) => {
      if (i.fecha < fechaActual) return true;
      if (i.fecha === fechaActual) return i.horaInicio <= horaActual;
      return false;
    });

    const totalProgramadoHastaAhora = itemsHoyHastaAhora.length;
    const completadasHastaAhora = itemsHoyHastaAhora.filter((i) => i.completado).length;

    const porcentajeRitmo =
      totalProgramadoHastaAhora > 0
        ? Math.round((completadasHastaAhora / totalProgramadoHastaAhora) * 100)
        : 100;

    // Item actualmente en focus
    const itemEnFocus =
      items.find((i) => !i.completado && i.fecha === fechaActual && i.estadoRitmo === 'FOCUS_ACTUAL') || null;

    // Siguiente item pendiente
    const siguienteItem =
      itemEnFocus ||
      items.find((i) => !i.completado && (i.fecha > fechaActual || (i.fecha === fechaActual && i.horaInicio >= horaActual))) ||
      items.find((i) => !i.completado) ||
      null;

    return {
      totalProgramadoHastaAhora,
      completadasHastaAhora,
      porcentajeRitmo,
      totalItems,
      completadasTotal,
      porcentajeTotal,
      siguienteItem,
      itemEnFocus
    };
  }, [items, fechaActual, horaActual]);

  // 5. Toggle de completado rápido Local-First
  const toggleCompletar = useCallback(async (item: DailyScheduleItem) => {
    const nowIso = new Date().toISOString();
    const marcarCompletado = !item.completado;

    if (item.tipo === 'TAREA') {
      const nuevoEstado = marcarCompletado ? '04_Completado' : '02_Por_Hacer';
      await db.tareas.update(item.id, {
        estado_tarea: nuevoEstado,
        updated_at: nowIso
      });
    } else if (item.tipo === 'HABITO') {
      await completarActividadPersonalLocal(item.raw as ActividadPersonal, marcarCompletado);
    } else if (item.tipo === 'GASTO') {
      const nuevoEstado = marcarCompletado ? 'PAGADO' : 'PENDIENTE';
      await db.gastos.update(item.id, {
        estado_pago: nuevoEstado,
        updated_at: nowIso
      });
    } else if (item.tipo === 'CUOTA') {
      const nuevoEstado = marcarCompletado ? 'PAGADO' : 'PENDIENTE';
      await db.cuotas.update(item.id, {
        estado_cuota: nuevoEstado,
        updated_at: nowIso
      });
    }
  }, []);

  return {
    items,
    metricas,
    horaActual,
    fechaActual,
    toggleCompletar,
    cargando: datosDexie === undefined
  };
}
