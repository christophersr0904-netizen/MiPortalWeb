/**
 * ============================================================================
 * ARCHIVO: src/services/gastosService.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-44-EXEC
 * DESCRIPCIÓN: Servicio de negocio para Gastos con omni-sincronización instantánea.
 * ============================================================================
 */

import { db, registrarTombstone } from '../db/db';
import type { GastoRecord } from '../types';
import { syncManager } from './syncManager';
import { generarCodigoCorrelativoSeguro } from '../utils/entityNormalizer';
import { generateSafeUUID } from '../utils/uuidGenerator';
import { sincronizarGastoCalendar } from './calendarSyncService';
import { formatFechaIsoLocal } from '../utils/timeFormatters';

export async function crearGasto(datos: Partial<GastoRecord>): Promise<GastoRecord> {
  const nowIso = new Date().toISOString();
  const codigoLegado = datos.codigo_legado || (await generarCodigoCorrelativoSeguro(db.gastos, 'GAS', 3));
  const idFinal = datos.id || generateSafeUUID();
  const estadoPagoNorm = (datos.estado_pago || 'PAGADO').toUpperCase();
  const esPagado = estadoPagoNorm === 'PAGADO';
  const fechaReal = datos.fecha_ejecucion_real || (esPagado ? (datos.fecha_gasto || formatFechaIsoLocal(new Date())) : undefined);

  const payload: GastoRecord = {
    id: idFinal,
    user_id: datos.user_id || '00000000-0000-0000-0000-000000000001',
    codigo_legado: codigoLegado,
    id_proyecto: datos.id_proyecto || undefined,
    id_tarea: datos.id_tarea || undefined,
    tipo_origen: datos.tipo_origen || 'Personal',
    id_origen_vinculado: datos.id_origen_vinculado || undefined,
    categoria_gasto: datos.categoria_gasto || 'General',
    fecha_gasto: datos.fecha_gasto || nowIso.split('T')[0],
    fecha_ejecucion_real: fechaReal,
    descripcion_gasto: (datos.descripcion_gasto || 'Gasto').trim(),
    moneda_original: datos.moneda_original || 'PEN',
    monto_original: Math.max(0, Number(datos.monto_original) || 0),
    tipo_cambio: Number(datos.tipo_cambio) || 1.0,
    monto_pen: Math.max(0, Number(datos.monto_pen) || 0),
    metodo_pago: datos.metodo_pago || 'Efectivo',
    estado_pago: datos.estado_pago || 'PAGADO',
    agendar_calendar: datos.agendar_calendar,
    agendado_calendar: datos.agendado_calendar || (datos.agendar_calendar !== false ? 'Sí' : 'No'),
    updated_at: nowIso,
    sync_status: 'pending'
  };

  await db.gastos.put(payload);

  if (datos.agendar_calendar !== false && datos.agendado_calendar !== 'No') {
    sincronizarGastoCalendar(payload, 'UPSERT').catch((err) => {
      console.warn('[gastosService] Error al sincronizar gasto con Google Calendar:', err);
    });
  }

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[gastosService] Error en syncManager.syncPendingRecords tras crear gasto:', err);
  });

  return payload;
}

export async function actualizarGasto(id: string, cambios: Partial<GastoRecord>): Promise<GastoRecord> {
  const actual = await db.gastos.get(id);
  const nowIso = new Date().toISOString();

  const updates: Partial<GastoRecord> = {
    ...cambios,
    updated_at: nowIso,
    sync_status: 'pending'
  };

  const estadoFinal = (cambios.estado_pago || actual?.estado_pago || '').toUpperCase();
  const esPagado = estadoFinal === 'PAGADO';
  if (esPagado && !cambios.fecha_ejecucion_real && !actual?.fecha_ejecucion_real) {
    updates.fecha_ejecucion_real = cambios.fecha_gasto || actual?.fecha_gasto || formatFechaIsoLocal(new Date());
  } else if (!esPagado && cambios.estado_pago !== undefined && cambios.fecha_ejecucion_real === undefined) {
    updates.fecha_ejecucion_real = '';
  }

  await db.gastos.update(id, updates);

  const actualizado = { ...(actual || {}), ...updates } as GastoRecord;

  if (cambios.agendar_calendar !== false && cambios.agendado_calendar !== 'No') {
    sincronizarGastoCalendar(actualizado, 'UPSERT').catch((err) => {
      console.warn('[gastosService] Error al sincronizar actualización de gasto con Google Calendar:', err);
    });
  }

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[gastosService] Error en syncManager.syncPendingRecords tras actualizar gasto:', err);
  });

  return actualizado;
}

export async function eliminarGasto(id: string): Promise<boolean> {
  const actual = await db.gastos.get(id);
  await registrarTombstone('gastos', id);
  await db.gastos.delete(id);

  if (actual) {
    sincronizarGastoCalendar(actual, 'DELETE').catch((err) => {
      console.warn('[gastosService] Error al eliminar gasto en Google Calendar:', err);
    });
  }

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[gastosService] Error en syncManager.syncPendingRecords tras eliminar gasto:', err);
  });

  return true;
}

