/**
 * ============================================================================
 * ARCHIVO: src/services/notasService.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-44-EXEC
 * DESCRIPCIÓN: Servicio de negocio para Notas con omni-sincronización instantánea.
 * ============================================================================
 */

import { db } from '../db/db';
import type { NotaRecord } from '../types';
import { syncManager } from './syncManager';
import { generarCodigoCorrelativoSeguro } from '../utils/entityNormalizer';

export async function crearNota(datos: Partial<NotaRecord>): Promise<NotaRecord> {
  const nowIso = new Date().toISOString();
  const codigoLegado = datos.codigo_legado || (await generarCodigoCorrelativoSeguro(db.notas, 'NOT', 5));
  const idFinal = datos.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `not_${Date.now()}`);

  const payload: NotaRecord = {
    id: idFinal,
    user_id: datos.user_id || '00000000-0000-0000-0000-000000000001',
    codigo_legado: codigoLegado,
    titulo: (datos.titulo || 'Nueva Nota').trim(),
    contenido_markdown: datos.contenido_markdown || '',
    tipo_nota: datos.tipo_nota || 'MODULAR',
    block_nombre: datos.block_nombre || 'Inbox',
    color_tema: datos.color_tema || 'slate',
    es_fijada: Boolean(datos.es_fijada),
    checklists_json: datos.checklists_json || [],
    wishlist_json: datos.wishlist_json,
    adjuntos_drive_json: datos.adjuntos_drive_json || [],
    enlaces_entidades_json: datos.enlaces_entidades_json || [],
    etiquetas: datos.etiquetas || [],
    created_at: nowIso,
    updated_at: nowIso,
    version: 1,
    sync_status: 'pending'
  };

  await db.notas.add(payload);

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[notasService] Error en syncManager.syncPendingRecords tras crear nota:', err);
  });

  return payload;
}

export async function actualizarNota(id: string, cambios: Partial<NotaRecord>): Promise<NotaRecord> {
  const actual = await db.notas.get(id);
  const nowIso = new Date().toISOString();
  const versionActual = Math.max(1, Number((actual as any)?.version) || 1);

  const updates: Partial<NotaRecord> & { version: number; sync_status: 'pending'; updated_at: string } = {
    ...cambios,
    version: versionActual + 1,
    updated_at: nowIso,
    sync_status: 'pending'
  };

  await db.notas.update(id, updates);

  const actualizada = { ...(actual || {}), ...updates } as NotaRecord;

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[notasService] Error en syncManager.syncPendingRecords tras actualizar nota:', err);
  });

  return actualizada;
}

export async function eliminarNota(id: string): Promise<boolean> {
  const nowIso = new Date().toISOString();

  if (db.tombstones && typeof db.tombstones.put === 'function') {
    await db.tombstones.put({
      id,
      tabla: 'notas',
      fecha_eliminacion: nowIso,
      sync_status: 'pending'
    } as any).catch(() => {});
  }

  await db.notas.delete(id);

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[notasService] Error en syncManager.syncPendingRecords tras eliminar nota:', err);
  });

  return true;
}

