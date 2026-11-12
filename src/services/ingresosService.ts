/**
 * ============================================================================
 * ARCHIVO: src/services/ingresosService.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-44-EXEC
 * DESCRIPCIÓN: Servicio de negocio para Ingresos con omni-sincronización instantánea.
 * ============================================================================
 */

import { db } from '../db/db';
import type { IngresoRecord } from '../types';
import { syncManager } from './syncManager';
import { generarCodigoCorrelativoSeguro } from '../utils/entityNormalizer';

export async function crearIngreso(datos: Partial<IngresoRecord>): Promise<IngresoRecord> {
  const nowIso = new Date().toISOString();
  const codigoLegado = datos.codigo_legado || (await generarCodigoCorrelativoSeguro(db.ingresos, 'ING', 3));
  const idFinal = datos.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ing_${Date.now()}`);

  const payload: IngresoRecord = {
    id: idFinal,
    user_id: datos.user_id || '00000000-0000-0000-0000-000000000001',
    codigo_legado: codigoLegado,
    tipo_origen: datos.tipo_origen || 'Honorario',
    categoria_ingreso: datos.categoria_ingreso || 'Principal',
    fecha_ingreso: datos.fecha_ingreso || nowIso.split('T')[0],
    descripcion_ingreso: (datos.descripcion_ingreso || 'Ingreso').trim(),
    moneda_original: datos.moneda_original || 'PEN',
    monto_original: Math.max(0, Number(datos.monto_original) || 0),
    tipo_cambio: Number(datos.tipo_cambio) || 1.0,
    monto_pen: Math.max(0, Number(datos.monto_pen) || 0),
    cuenta_destino: datos.cuenta_destino || 'Principal',
    estado_cobro: datos.estado_cobro || 'COBRADO',
    updated_at: nowIso,
    sync_status: 'pending'
  };

  await db.ingresos.put(payload);

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

  await db.ingresos.update(id, updates);

  const actualizado = { ...(actual || {}), ...updates } as IngresoRecord;

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[ingresosService] Error en syncManager.syncPendingRecords tras actualizar ingreso:', err);
  });

  return actualizado;
}

export async function eliminarIngreso(id: string): Promise<boolean> {
  const nowIso = new Date().toISOString();

  if (db.tombstones && typeof db.tombstones.put === 'function') {
    await db.tombstones.put({
      id,
      tabla: 'ingresos',
      fecha_eliminacion: nowIso,
      sync_status: 'pending'
    } as any).catch(() => {});
  }

  await db.ingresos.delete(id);

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[ingresosService] Error en syncManager.syncPendingRecords tras eliminar ingreso:', err);
  });

  return true;
}

