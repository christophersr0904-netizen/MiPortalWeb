/**
 * ============================================================================
 * ARCHIVO: src/services/gastosService.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-44-EXEC
 * DESCRIPCIÓN: Servicio de negocio para Gastos con omni-sincronización instantánea.
 * ============================================================================
 */

import { db } from '../db/db';
import type { GastoRecord } from '../types';
import { syncManager } from './syncManager';
import { generarCodigoCorrelativoSeguro } from '../utils/entityNormalizer';

export async function crearGasto(datos: Partial<GastoRecord>): Promise<GastoRecord> {
  const nowIso = new Date().toISOString();
  const codigoLegado = datos.codigo_legado || (await generarCodigoCorrelativoSeguro(db.gastos, 'GAS', 3));
  const idFinal = datos.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gas_${Date.now()}`);

  const payload: GastoRecord = {
    id: idFinal,
    user_id: datos.user_id || '00000000-0000-0000-0000-000000000001',
    codigo_legado: codigoLegado,
    tipo_origen: datos.tipo_origen || 'Personal',
    id_origen_vinculado: datos.id_origen_vinculado || undefined,
    categoria_gasto: datos.categoria_gasto || 'General',
    fecha_gasto: datos.fecha_gasto || nowIso.split('T')[0],
    descripcion_gasto: (datos.descripcion_gasto || 'Gasto').trim(),
    moneda_original: datos.moneda_original || 'PEN',
    monto_original: Math.max(0, Number(datos.monto_original) || 0),
    tipo_cambio: Number(datos.tipo_cambio) || 1.0,
    monto_pen: Math.max(0, Number(datos.monto_pen) || 0),
    metodo_pago: datos.metodo_pago || 'Efectivo',
    estado_pago: datos.estado_pago || 'PAGADO',
    updated_at: nowIso,
    sync_status: 'pending'
  };

  await db.gastos.put(payload);

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

  await db.gastos.update(id, updates);

  const actualizado = { ...(actual || {}), ...updates } as GastoRecord;

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[gastosService] Error en syncManager.syncPendingRecords tras actualizar gasto:', err);
  });

  return actualizado;
}

export async function eliminarGasto(id: string): Promise<boolean> {
  const nowIso = new Date().toISOString();

  if (db.tombstones && typeof db.tombstones.put === 'function') {
    await db.tombstones.put({
      id,
      tabla: 'gastos',
      fecha_eliminacion: nowIso,
      sync_status: 'pending'
    } as any).catch(() => {});
  }

  await db.gastos.delete(id);

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[gastosService] Error en syncManager.syncPendingRecords tras eliminar gasto:', err);
  });

  return true;
}

