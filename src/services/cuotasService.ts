/**
 * ============================================================================
 * ARCHIVO: src/services/cuotasService.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-44-EXEC
 * DESCRIPCIÓN: Servicio de negocio para Cuotas con omni-sincronización instantánea.
 * ============================================================================
 */

import { db } from '../db/db';
import type { CuotaRecord } from '../types';
import { syncManager } from './syncManager';
import { generarCodigoCorrelativoSeguro } from '../utils/entityNormalizer';

export async function crearCuota(datos: Partial<CuotaRecord>): Promise<CuotaRecord> {
  const nowIso = new Date().toISOString();
  const codigoLegado = datos.codigo_legado || (await generarCodigoCorrelativoSeguro(db.cuotas, 'CUO', 3));
  const idFinal = datos.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cuo_${Date.now()}`);

  const payload: CuotaRecord = {
    id: idFinal,
    user_id: datos.user_id || '00000000-0000-0000-0000-000000000001',
    codigo_legado: codigoLegado,
    entidad_financiera: (datos.entidad_financiera || 'Entidad').trim(),
    numero_cuota: Math.max(1, Number(datos.numero_cuota) || 1),
    total_cuotas: Math.max(1, Number(datos.total_cuotas) || 1),
    monto_cuota: Math.max(0, Number(datos.monto_cuota) || 0),
    moneda: datos.moneda || 'PEN',
    fecha_vencimiento: datos.fecha_vencimiento || nowIso.split('T')[0],
    estado_cuota: datos.estado_cuota || 'PENDIENTE',
    updated_at: nowIso,
    sync_status: 'pending'
  };

  await db.cuotas.add(payload);

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[cuotasService] Error en syncManager.syncPendingRecords tras crear cuota:', err);
  });

  return payload;
}

export async function actualizarCuota(id: string, cambios: Partial<CuotaRecord>): Promise<CuotaRecord> {
  const actual = await db.cuotas.get(id);
  const nowIso = new Date().toISOString();

  const updates: Partial<CuotaRecord> = {
    ...cambios,
    updated_at: nowIso,
    sync_status: 'pending'
  };

  await db.cuotas.update(id, updates);

  const actualizado = { ...(actual || {}), ...updates } as CuotaRecord;

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[cuotasService] Error en syncManager.syncPendingRecords tras actualizar cuota:', err);
  });

  return actualizado;
}

export async function eliminarCuota(id: string): Promise<boolean> {
  const nowIso = new Date().toISOString();

  if (db.tombstones && typeof db.tombstones.put === 'function') {
    await db.tombstones.put({
      id,
      tabla: 'cuotas',
      fecha_eliminacion: nowIso,
      sync_status: 'pending'
    } as any).catch(() => {});
  }

  await db.cuotas.delete(id);

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[cuotasService] Error en syncManager.syncPendingRecords tras eliminar cuota:', err);
  });

  return true;
}

