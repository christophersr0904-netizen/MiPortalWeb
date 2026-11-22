/**
 * ============================================================================
 * ARCHIVO: src/services/ingresosService.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-44-EXEC
 * DESCRIPCIÓN: Servicio de negocio para Ingresos con omni-sincronización instantánea.
 * ============================================================================
 */

import { db, registrarTombstone } from '../db/db';
import type { IngresoRecord } from '../types';
import { syncManager } from './syncManager';
import { generarCodigoCorrelativoSeguro } from '../utils/entityNormalizer';
import { generateSafeUUID } from '../utils/uuidGenerator';
import { sincronizarIngresoCalendar } from './calendarSyncService';
import { formatFechaIsoLocal } from '../utils/timeFormatters';

export async function crearIngreso(datos: Partial<IngresoRecord>): Promise<IngresoRecord> {
  const nowIso = new Date().toISOString();
  const codigoLegado = datos.codigo_legado || (await generarCodigoCorrelativoSeguro(db.ingresos, 'ING', 3));
  const idFinal = datos.id || generateSafeUUID();
  const estadoCobroNorm = (datos.estado_cobro || 'COBRADO').toUpperCase();
  const esCobrado = estadoCobroNorm === 'COBRADO';
  const fechaReal = datos.fecha_ejecucion_real || (esCobrado ? (datos.fecha_ingreso || formatFechaIsoLocal(new Date())) : undefined);

  const payload: IngresoRecord = {
    id: idFinal,
    user_id: datos.user_id || '00000000-0000-0000-0000-000000000001',
    codigo_legado: codigoLegado,
    tipo_origen: datos.tipo_origen || 'Honorario',
    categoria_ingreso: datos.categoria_ingreso || 'Principal',
    fecha_ingreso: datos.fecha_ingreso || nowIso.split('T')[0],
    fecha_ejecucion_real: fechaReal,
    descripcion_ingreso: (datos.descripcion_ingreso || 'Ingreso').trim(),
    moneda_original: datos.moneda_original || 'PEN',
    monto_original: Math.max(0, Number(datos.monto_original) || 0),
    tipo_cambio: Number(datos.tipo_cambio) || 1.0,
    monto_pen: Math.max(0, Number(datos.monto_pen) || 0),
    cuenta_destino: datos.cuenta_destino || 'Principal',
    estado_cobro: datos.estado_cobro || 'COBRADO',
    agendar_calendar: datos.agendar_calendar,
    agendado_calendar: datos.agendado_calendar || (datos.agendar_calendar !== false ? 'Sí' : 'No'),
    updated_at: nowIso,
    sync_status: 'pending'
  };

  await db.ingresos.put(payload);

  if (datos.agendar_calendar !== false && datos.agendado_calendar !== 'No') {
    sincronizarIngresoCalendar(payload, 'UPSERT').catch((err) => {
      console.warn('[ingresosService] Error al sincronizar ingreso con Google Calendar:', err);
    });
  }

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[ingresosService] Error en syncManager.syncPendingRecords tras crear ingreso:', err);
  });

  return payload;
}

export async function actualizarIngreso(id: string, cambios: Partial<IngresoRecord>): Promise<IngresoRecord> {
  const actual = await db.ingresos.get(id);
  const nowIso = new Date().toISOString();

  const updates: Partial<IngresoRecord> = {
    ...cambios,
    updated_at: nowIso,
    sync_status: 'pending'
  };

  const estadoFinal = (cambios.estado_cobro || actual?.estado_cobro || '').toUpperCase();
  const esCobrado = estadoFinal === 'COBRADO';
  if (esCobrado && !cambios.fecha_ejecucion_real && !actual?.fecha_ejecucion_real) {
    updates.fecha_ejecucion_real = cambios.fecha_ingreso || actual?.fecha_ingreso || formatFechaIsoLocal(new Date());
  } else if (!esCobrado && cambios.estado_cobro !== undefined && cambios.fecha_ejecucion_real === undefined) {
    updates.fecha_ejecucion_real = '';
  }

  await db.ingresos.update(id, updates);

  const actualizado = { ...(actual || {}), ...updates } as IngresoRecord;

  if (cambios.agendar_calendar !== false && cambios.agendado_calendar !== 'No') {
    sincronizarIngresoCalendar(actualizado, 'UPSERT').catch((err) => {
      console.warn('[ingresosService] Error al sincronizar actualización de ingreso con Google Calendar:', err);
    });
  }

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[ingresosService] Error en syncManager.syncPendingRecords tras actualizar ingreso:', err);
  });

  return actualizado;
}

export async function eliminarIngreso(id: string): Promise<boolean> {
  const actual = await db.ingresos.get(id);
  await registrarTombstone('ingresos', id);
  await db.ingresos.delete(id);

  if (actual) {
    sincronizarIngresoCalendar(actual, 'DELETE').catch((err) => {
      console.warn('[ingresosService] Error al eliminar ingreso en Google Calendar:', err);
    });
  }

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[ingresosService] Error en syncManager.syncPendingRecords tras eliminar ingreso:', err);
  });

  return true;
}

