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
import { completarActividadPersonalLocal, calcularProximaFechaValida } from '../services/habitosService';
import { syncManager } from '../services/syncManager';
import { esElementoArchivado, getProp } from '../utils/entityNormalizer';
import type { TareaRecord, ActividadPersonal, GastoRecord, IngresoRecord, CuotaRecord } from '../types';

export type HorizonteAgenda = 'HOY' | 'MANANA' | 'SEMANA';
export type TipoItemAgenda = 'TAREA' | 'HABITO' | 'GASTO' | 'INGRESO' | 'CUOTA';
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
  proyectoCodigo?: string;
  monto?: number;
  moneda?: string;
  montoFormateado?: string;
  estadoEntidad?: string;
  estadoRitmo: EstadoRitmoItem;
  raw: TareaRecord | ActividadPersonal | GastoRecord | IngresoRecord | CuotaRecord;
}

export function formatearMontoMoneda(monto: number, moneda: string = 'PEN'): string {
  const mNorm = (moneda || 'PEN').toUpperCase();
  const simbolo = mNorm === 'USD' ? '$' : mNorm === 'EUR' ? '€' : 'S/';
  return `${simbolo} ${(Number(monto) || 0).toFixed(2)}`;
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
    const [actividades, tareas, gastos, ingresos, cuotas] = await Promise.all([
      db.actividades_personales.toArray(),
      db.tareas.toArray(),
      db.gastos.toArray(),
      db.ingresos.toArray(),
      db.cuotas.toArray()
    ]);

    return { actividades, tareas, gastos, ingresos, cuotas };
  }, []);

  // 3. Normalización y Ritmo Dinámico
  const items = useMemo(() => {
    if (!datosDexie) return [];
    const list: DailyScheduleItem[] = [];

    // --- A. TAREAS WBS ---
    for (const t of datosDexie.tareas) {
      const estadoRaw = String(getProp(t, 'estado_tarea', 'Estado_Tarea', 'estado', 'Estado') ?? '02_Por_Hacer');
      if (estadoRaw === '05_Archivado' || esElementoArchivado(t, 'tareas')) continue;
      const fProgRaw = String(getProp(t, 'fecha_programada', 'Fecha_Programada') ?? '');
      const fProg = fProgRaw ? fProgRaw.split('T')[0] : '';
      if (!fProg) continue;

      const completado = estadoRaw === '04_Completado' || estadoRaw.includes('Completad');
      const estaEnMora = fProg < fechaActual && !completado;
      const fechaCompTarea = String(getProp(t, 'fecha_completado', 'Fecha_Completado') ?? '');
      const completadoHoy =
        completado &&
        (fProg === fechaActual ||
          Boolean(fechaCompTarea && fechaCompTarea.startsWith(fechaActual)) ||
          Boolean(t.updated_at && t.updated_at.startsWith(fechaActual)));

      const incluirEnHoy = fechasSet.has(fechaActual) && (fProg === fechaActual || estaEnMora || completadoHoy);
      const incluirEnHorizonte = fechasSet.has(fProg) || incluirEnHoy;
      if (!incluirEnHorizonte) continue;

      const fechaEfectiva = incluirEnHoy && !fechasSet.has(fProg) ? fechaActual : fProg;
      const horaIni = String(getProp(t, 'hora_inicio', 'Hora_Inicio') ?? '09:00').trim() || '09:00';
      const horasEst = Number(getProp(t, 'horas_estimadas', 'Horas_Estimadas') ?? 1) || 1;
      const durMin = Math.max(15, Math.round(horasEst * 60));
      const horaFin = sumarMinutosAHora(horaIni, durMin);

      // Estado del ritmo
      let estadoRitmo: EstadoRitmoItem = 'PROXIMO_EN_ESPERA';
      if (fProg < fechaActual || (fechaEfectiva === fechaActual && horaFin < horaActual)) {
        estadoRitmo = 'VENCIDO_PASADO';
      } else if (fechaEfectiva === fechaActual && horaIni <= horaActual && horaFin >= horaActual) {
        estadoRitmo = 'FOCUS_ACTUAL';
      }

      const codigoLegado = String(getProp(t, 'codigo_legado', 'ID_Tarea', 'idTarea') ?? 'TAR-000');
      const nombreTarea = String(
        getProp(t, 'nombre_tarea_actividad', 'Nombre_Tarea_Actividad', 'nombre_tarea', 'nombre') ?? 'Tarea de Proyecto'
      );
      const proyCod = String(getProp(t, 'proyecto_codigo', 'ID_Proyecto', 'idProyecto') ?? 'General');
      const prioRaw = String(getProp(t, 'prioridad_eisenhower', 'Prioridad_Eisenhower', 'prioridad') ?? '02_P2_Media');
      const prioLimpia = prioRaw.replace(/^\d+_/, '').replace(/_/g, ' ');

      list.push({
        id: t.id,
        tipo: 'TAREA',
        codigoLegado,
        titulo: nombreTarea,
        subtitulo: `${codigoLegado} · ${proyCod} · ${prioLimpia}`,
        fecha: fechaEfectiva,
        horaInicio: horaIni,
        horaFin: horaFin,
        duracionMinutos: durMin,
        completado,
        categoria: proyCod,
        proyectoCodigo: proyCod,
        prioridad: prioLimpia,
        nivelEnergia: String(getProp(t, 'nivel_energia_requerido', 'Nivel_Energia_Requerido') ?? 'Media_Operativa'),
        estadoEntidad: completado ? 'COMPLETADA' : 'PENDIENTE',
        estadoRitmo,
        raw: t
      });
    }

    // --- B. ACTIVIDADES PERSONALES / HÁBITOS ---
    for (const a of datosDexie.actividades) {
      const estadoAct = String(getProp(a, 'estado', 'Estado') ?? '02_Por_Hacer');
      if (estadoAct === '05_Archivado' || esElementoArchivado(a, 'actividades')) continue;
      const fProgRaw = String(getProp(a, 'fecha_programada', 'Fecha_Programada') ?? '');
      const fProg = fProgRaw ? fProgRaw.split('T')[0] : '';

      const tieneRecurrencia = Boolean(
        (a.frecuencia_ciclo && a.frecuencia_ciclo !== 'NINGUNA') ||
        (a.regla_repeticion && a.regla_repeticion.trim() !== '')
      );
      const esRutinaria = a.tipo_compromiso !== 'PUNTUAL' || tieneRecurrencia;

      const completadoHoy =
        a.ultima_fecha_completado === fechaActual ||
        Boolean(Array.isArray(a.historial_fechas) && a.historial_fechas.includes(fechaActual)) ||
        (estadoAct === '04_Completado' && fProg === fechaActual);

      const estaEnMora = Boolean(fProg && fProg < fechaActual && estadoAct !== '04_Completado' && !completadoHoy);

      // Determinar en qué fechas del horizonte seleccionado debe aparecer este hábito
      const fechasAplicables: string[] = [];

      for (const fHorizonte of fechasHorizonte) {
        if (fHorizonte === fechaActual) {
          const aplicaPorRecurrenciaHoy =
            esRutinaria &&
            calcularProximaFechaValida(fHorizonte, a.frecuencia_ciclo, a.regla_repeticion) === fHorizonte;

          if (fProg === fechaActual || estaEnMora || completadoHoy || aplicaPorRecurrenciaHoy) {
            fechasAplicables.push(fHorizonte);
          }
        } else {
          const aplicaPorRecurrenciaFutura =
            esRutinaria &&
            a.frecuencia_ciclo &&
            a.frecuencia_ciclo !== 'NINGUNA' &&
            calcularProximaFechaValida(fHorizonte, a.frecuencia_ciclo, a.regla_repeticion) === fHorizonte;

          if (fProg === fHorizonte || aplicaPorRecurrenciaFutura) {
            fechasAplicables.push(fHorizonte);
          }
        }
      }

      if (fechasAplicables.length === 0) continue;

      const horaIni = String(getProp(a, 'hora_inicio', 'Hora_Inicio') ?? '07:00').trim() || '07:00';
      const durHoras = Number(getProp(a, 'duracion_horas', 'Duracion_Horas') ?? 0.5) || 0.5;
      const durMin = Math.round(durHoras * 60);
      const horaFin = sumarMinutosAHora(horaIni, durMin);
      const codigoLegado = String(getProp(a, 'codigo_legado', 'ID_Actividad') ?? 'ACT-000');
      const nombreHabito = String(
        getProp(a, 'nombre_actividad', 'Nombre_Actividad', 'Nombre', 'nombre') ?? 'Hábito Personal'
      );
      const catVida = String(getProp(a, 'categoria_vida', 'Categoria_Vida') ?? 'SALUD_DEPORTE');
      const catVidaLimpia = catVida.replace(/_/g, ' ');

      for (const fechaItem of fechasAplicables) {
        const completadoEnFecha =
          estadoAct === '04_Completado' ||
          (fechaItem === fechaActual && completadoHoy) ||
          Boolean(Array.isArray(a.historial_fechas) && a.historial_fechas.includes(fechaItem));

        let estadoRitmo: EstadoRitmoItem = 'PROXIMO_EN_ESPERA';
        if (
          (fechaItem === fechaActual && estaEnMora && horaFin < horaActual) ||
          (fechaItem === fechaActual && horaFin < horaActual && !completadoEnFecha)
        ) {
          estadoRitmo = 'VENCIDO_PASADO';
        } else if (fechaItem === fechaActual && horaIni <= horaActual && horaFin >= horaActual) {
          estadoRitmo = 'FOCUS_ACTUAL';
        }

        list.push({
          id: fechasAplicables.length > 1 ? `${a.id}_${fechaItem}` : a.id,
          tipo: 'HABITO',
          codigoLegado,
          titulo: nombreHabito,
          subtitulo: `${codigoLegado} · ${catVidaLimpia} · ${durMin} min`,
          fecha: fechaItem,
          horaInicio: horaIni,
          horaFin: horaFin,
          duracionMinutos: durMin,
          completado: completadoEnFecha,
          categoria: catVidaLimpia,
          estadoEntidad: completadoEnFecha ? 'CUMPLIDO' : 'PENDIENTE',
          estadoRitmo,
          raw: a
        });
      }
    }

    // --- C. GASTOS COMPROMETIDOS ---
    for (const g of datosDexie.gastos) {
      if (esElementoArchivado(g, 'gastos')) continue;
      const fGastoRaw = String(getProp(g, 'fecha_gasto', 'Fecha_Gasto', 'fecha_registro', 'Fecha_Registro') ?? '');
      const fGasto = fGastoRaw ? fGastoRaw.split('T')[0] : '';
      if (!fGasto) continue;

      const estadoRaw = String(
        getProp(g, 'estado_pago', 'Estado_Pago', 'estado', 'Estado', 'modalidad', 'Modalidad') ?? 'PENDIENTE'
      ).toUpperCase();
      const completado = estadoRaw === 'PAGADO';
      const estaEnMora = fGasto < fechaActual && !completado;
      const completadoHoy =
        completado &&
        (fGasto === fechaActual || Boolean(g.updated_at && g.updated_at.startsWith(fechaActual)));

      const incluirEnHoy = fechasSet.has(fechaActual) && (fGasto === fechaActual || estaEnMora || completadoHoy);
      const incluirEnHorizonte = fechasSet.has(fGasto) || incluirEnHoy;
      if (!incluirEnHorizonte) continue;

      const fechaEfectiva = incluirEnHoy && !fechasSet.has(fGasto) ? fechaActual : fGasto;
      const horaIni = '08:00'; // Slot contable diurno gastos
      const horaFin = '08:30';

      let estadoRitmo: EstadoRitmoItem = 'PROXIMO_EN_ESPERA';
      if (fGasto < fechaActual || (fechaEfectiva === fechaActual && horaFin < horaActual)) {
        estadoRitmo = 'VENCIDO_PASADO';
      } else if (fechaEfectiva === fechaActual && horaIni <= horaActual && horaFin >= horaActual) {
        estadoRitmo = 'FOCUS_ACTUAL';
      }

      const codigoLegado = String(getProp(g, 'codigo_legado', 'ID_Gasto', 'ID_Transaccion') ?? 'GAS-000');
      const concepto = String(
        getProp(g, 'descripcion_gasto', 'Descripcion_Gasto', 'concepto', 'Concepto', 'descripcion', 'Descripcion', 'nombre_gasto') ??
          'Gasto Programado'
      );
      const categoriaGasto = String(
        getProp(g, 'categoria_gasto', 'Categoria_Gasto', 'categoria', 'Categoria') ?? 'Finanzas'
      ).replace(/_/g, ' ');
      const moneda = String(getProp(g, 'moneda_original', 'Moneda_Original', 'moneda') ?? 'PEN').toUpperCase();
      const montoOrig = Number(getProp(g, 'monto_original', 'Monto_Original') ?? 0);
      const montoPen = Number(getProp(g, 'monto_pen', 'Monto_PEN', 'Monto_Moneda_Base') ?? 0);
      const montoEfectivo = moneda === 'USD' && montoOrig > 0 ? montoOrig : montoPen > 0 ? montoPen : montoOrig;
      const montoFormateado = formatearMontoMoneda(montoEfectivo, moneda);
      const estadoEntidad = completado ? 'PAGADO' : 'PENDIENTE';

      list.push({
        id: g.id,
        tipo: 'GASTO',
        codigoLegado,
        titulo: concepto,
        subtitulo: `${categoriaGasto} · ${montoFormateado} · ${estadoEntidad}`,
        fecha: fechaEfectiva,
        horaInicio: horaIni,
        horaFin: horaFin,
        duracionMinutos: 30,
        completado,
        categoria: categoriaGasto,
        monto: montoEfectivo,
        moneda,
        montoFormateado,
        estadoEntidad,
        estadoRitmo,
        raw: g
      });
    }

    // --- D. INGRESOS PROGRAMADOS / POR COBRAR ---
    for (const ing of datosDexie.ingresos) {
      if (esElementoArchivado(ing, 'ingresos')) continue;
      const fIngRaw = String(getProp(ing, 'fecha_ingreso', 'Fecha_Ingreso', 'fecha_registro', 'Fecha_Registro') ?? '');
      const fIngreso = fIngRaw ? fIngRaw.split('T')[0] : '';
      if (!fIngreso) continue;

      const estadoRaw = String(
        getProp(ing, 'estado_cobro', 'Estado_Cobro', 'estado_pago', 'Estado_Pago', 'estado', 'Estado', 'modalidad', 'Modalidad') ??
          'PENDIENTE'
      ).toUpperCase();
      const completado = estadoRaw === 'COBRADO' || estadoRaw === 'PAGADO';
      const estaEnMora = fIngreso < fechaActual && !completado;
      const completadoHoy =
        completado &&
        (fIngreso === fechaActual || Boolean(ing.updated_at && ing.updated_at.startsWith(fechaActual)));

      const incluirEnHoy = fechasSet.has(fechaActual) && (fIngreso === fechaActual || estaEnMora || completadoHoy);
      const incluirEnHorizonte = fechasSet.has(fIngreso) || incluirEnHoy;
      if (!incluirEnHorizonte) continue;

      const fechaEfectiva = incluirEnHoy && !fechasSet.has(fIngreso) ? fechaActual : fIngreso;
      const horaIni = '10:00'; // Slot contable diurno ingresos
      const horaFin = '10:30';

      let estadoRitmo: EstadoRitmoItem = 'PROXIMO_EN_ESPERA';
      if (fIngreso < fechaActual || (fechaEfectiva === fechaActual && horaFin < horaActual)) {
        estadoRitmo = 'VENCIDO_PASADO';
      } else if (fechaEfectiva === fechaActual && horaIni <= horaActual && horaFin >= horaActual) {
        estadoRitmo = 'FOCUS_ACTUAL';
      }

      const codigoLegado = String(getProp(ing, 'codigo_legado', 'ID_Ingreso', 'ID_Transaccion') ?? 'ING-000');
      const concepto = String(
        getProp(
          ing,
          'descripcion_ingreso',
          'Descripcion_Ingreso',
          'concepto',
          'Concepto',
          'descripcion',
          'Descripcion',
          'fuente_cliente',
          'Origen_Fuente'
        ) ?? 'Ingreso Programado'
      );
      const categoriaIngreso = String(
        getProp(ing, 'categoria_ingreso', 'Categoria_Ingreso', 'categoria', 'Categoria', 'origen_fuente', 'Origen_Fuente') ??
          'Ingresos'
      ).replace(/_/g, ' ');
      const moneda = String(getProp(ing, 'moneda_original', 'Moneda_Original', 'moneda') ?? 'PEN').toUpperCase();
      const montoOrig = Number(getProp(ing, 'monto_original', 'Monto_Original') ?? 0);
      const montoPen = Number(getProp(ing, 'monto_pen', 'Monto_PEN', 'Monto_Moneda_Base') ?? 0);
      const montoEfectivo = moneda === 'USD' && montoOrig > 0 ? montoOrig : montoPen > 0 ? montoPen : montoOrig;
      const montoFormateado = formatearMontoMoneda(montoEfectivo, moneda);
      const estadoEntidad = completado ? 'COBRADO' : 'PENDIENTE';

      list.push({
        id: ing.id,
        tipo: 'INGRESO',
        codigoLegado,
        titulo: concepto,
        subtitulo: `${categoriaIngreso} · ${montoFormateado} · ${estadoEntidad}`,
        fecha: fechaEfectiva,
        horaInicio: horaIni,
        horaFin: horaFin,
        duracionMinutos: 30,
        completado,
        categoria: categoriaIngreso,
        monto: montoEfectivo,
        moneda,
        montoFormateado,
        estadoEntidad,
        estadoRitmo,
        raw: ing
      });
    }

    // --- E. CUOTAS FINANCIERAS ---
    for (const c of datosDexie.cuotas) {
      const fVencRaw = String(getProp(c, 'fecha_vencimiento', 'Fecha_Vencimiento') ?? '');
      const fVenc = fVencRaw ? fVencRaw.split('T')[0] : '';
      if (!fVenc) continue;

      const estadoRaw = String(getProp(c, 'estado_cuota', 'Estado_Cuota', 'estado', 'Estado') ?? 'PENDIENTE').toUpperCase();
      const completado = estadoRaw === 'PAGADO';
      const estaEnMora = fVenc < fechaActual && !completado;
      const completadoHoy =
        completado &&
        (fVenc === fechaActual || Boolean(c.updated_at && c.updated_at.startsWith(fechaActual)));

      const incluirEnHoy = fechasSet.has(fechaActual) && (fVenc === fechaActual || estaEnMora || completadoHoy);
      const incluirEnHorizonte = fechasSet.has(fVenc) || incluirEnHoy;
      if (!incluirEnHorizonte) continue;

      const fechaEfectiva = incluirEnHoy && !fechasSet.has(fVenc) ? fechaActual : fVenc;
      const horaIni = '08:30';
      const horaFin = '09:00';

      let estadoRitmo: EstadoRitmoItem = 'PROXIMO_EN_ESPERA';
      if (fVenc < fechaActual || (fechaEfectiva === fechaActual && horaFin < horaActual)) {
        estadoRitmo = 'VENCIDO_PASADO';
      } else if (fechaEfectiva === fechaActual && horaIni <= horaActual && horaFin >= horaActual) {
        estadoRitmo = 'FOCUS_ACTUAL';
      }

      const codigoLegado = String(getProp(c, 'codigo_legado', 'ID_Cuota') ?? 'CUO-000');
      const numCuota = Number(getProp(c, 'numero_cuota', 'Numero_Cuota') ?? 1);
      const totCuotas = Number(getProp(c, 'total_cuotas', 'Total_Cuotas') ?? 1);
      const entidad = String(getProp(c, 'entidad_financiera', 'Entidad_Financiera') ?? 'Entidad');
      const moneda = String(getProp(c, 'moneda', 'Moneda') ?? 'PEN').toUpperCase();
      const montoCuota = Number(getProp(c, 'monto_cuota', 'Monto_Cuota') ?? 0);
      const montoFormateado = formatearMontoMoneda(montoCuota, moneda);
      const estadoEntidad = completado ? 'PAGADO' : 'PENDIENTE';

      list.push({
        id: c.id,
        tipo: 'CUOTA',
        codigoLegado,
        titulo: `Cuota ${numCuota}/${totCuotas} · ${entidad}`,
        subtitulo: `Cuota Crédito · ${montoFormateado} · ${estadoEntidad}`,
        fecha: fechaEfectiva,
        horaInicio: horaIni,
        horaFin: horaFin,
        duracionMinutos: 30,
        completado,
        categoria: 'Cuota Crédito',
        monto: montoCuota,
        moneda,
        montoFormateado,
        estadoEntidad,
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
  }, [datosDexie, fechasHorizonte, fechasSet, fechaActual, horaActual]);

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

  // 5. Toggle de completado rápido Local-First para cualquier tipo de ente
  const toggleCompletar = useCallback(async (item: DailyScheduleItem) => {
    const nowIso = new Date().toISOString();
    const marcarCompletado = !item.completado;
    const realId = (item.raw as any)?.id || item.id.split('_')[0];

    if (item.tipo === 'TAREA') {
      const nuevoEstado = marcarCompletado ? '04_Completado' : '02_Por_Hacer';
      await db.tareas.update(realId, {
        estado_tarea: nuevoEstado,
        Estado_Tarea: nuevoEstado,
        fecha_completado: marcarCompletado ? fechaActual : '',
        sync_status: 'pending',
        updated_at: nowIso
      } as any);
    } else if (item.tipo === 'HABITO') {
      const actRaw = (await db.actividades_personales.get(realId)) || (item.raw as ActividadPersonal);
      const res = await completarActividadPersonalLocal(actRaw, marcarCompletado);
      const fechaTarget = item.fecha || fechaActual;
      const histActual = Array.isArray(res.actividadActualizada.historial_fechas)
        ? [...res.actividadActualizada.historial_fechas]
        : [];
      const nuevoHist = marcarCompletado
        ? histActual.includes(fechaTarget)
          ? histActual
          : [...histActual, fechaTarget]
        : histActual.filter((f) => f !== fechaTarget);

      await db.actividades_personales.update(realId, {
        historial_fechas: nuevoHist,
        ultima_fecha_completado:
          marcarCompletado
            ? fechaTarget === fechaActual
              ? fechaActual
              : res.actividadActualizada.ultima_fecha_completado || fechaTarget
            : fechaTarget === fechaActual
            ? ''
            : res.actividadActualizada.ultima_fecha_completado,
        Estado: res.actividadActualizada.estado,
        sync_status: 'pending',
        updated_at: nowIso
      } as any);
    } else if (item.tipo === 'GASTO') {
      const nuevoEstado = marcarCompletado ? 'PAGADO' : 'PENDIENTE';
      await db.gastos.update(realId, {
        estado_pago: nuevoEstado,
        Estado_Pago: nuevoEstado,
        estado: nuevoEstado,
        Estado: nuevoEstado,
        modalidad: nuevoEstado,
        Modalidad: nuevoEstado,
        sync_status: 'pending',
        updated_at: nowIso
      } as any);
    } else if (item.tipo === 'INGRESO') {
      const nuevoEstado = marcarCompletado ? 'COBRADO' : 'PENDIENTE';
      await db.ingresos.update(realId, {
        estado_cobro: nuevoEstado,
        Estado_Cobro: nuevoEstado,
        estado: nuevoEstado,
        Estado: nuevoEstado,
        modalidad: nuevoEstado,
        Modalidad: nuevoEstado,
        sync_status: 'pending',
        updated_at: nowIso
      } as any);
    } else if (item.tipo === 'CUOTA') {
      const nuevoEstado = marcarCompletado ? 'PAGADO' : 'PENDIENTE';
      await db.cuotas.update(realId, {
        estado_cuota: nuevoEstado,
        Estado_Cuota: nuevoEstado,
        estado: nuevoEstado,
        Estado: nuevoEstado,
        sync_status: 'pending',
        updated_at: nowIso
      } as any);
    }

    syncManager.syncPendingRecords().catch(() => {});
    syncManager.guardarSnapshotEnPuenteLocal().catch(() => {});
  }, [fechaActual]);

  return {
    items,
    metricas,
    horaActual,
    fechaActual,
    toggleCompletar,
    cargando: datosDexie === undefined
  };
}
