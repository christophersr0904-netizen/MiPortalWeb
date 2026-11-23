/**
 * ============================================================================
 * ARCHIVO: src/services/proyectosService.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-AUDIT-03-FIX (Borrado en Cascada y Tombstones Exhaustivos)
 * DESCRIPCIÓN: Servicio de negocio para Proyectos con eliminación en cascada
 *              atómica de hitos WBS, tareas operativas, subtareas y gastos vinculados,
 *              garantizando el registro estricto de lápidas (tombstones) para replicación.
 * ============================================================================
 */

import { db, registrarTombstone } from '../db/db';
import type { ProyectoRecord, HitoWbsRecord, TareaRecord, SubtareaPaso, GastoRecord } from '../types';
import { syncManager } from './syncManager';
import { generarCodigoCorrelativoSeguro } from '../utils/entityNormalizer';
import { generateSafeUUID } from '../utils/uuidGenerator';

export interface ResultadoEliminacionCascadaProyecto {
  success: boolean;
  eliminados: {
    proyectoId: string;
    hitos: number;
    tareas: number;
    subtareas: number;
    gastos: number;
  };
}

/**
 * Crea un nuevo proyecto en Dexie y programa su sincronización.
 */
export async function crearProyecto(datos: Partial<ProyectoRecord>): Promise<ProyectoRecord> {
  const nowIso = new Date().toISOString();
  const codigoLegado = datos.codigo_legado || (await generarCodigoCorrelativoSeguro(db.proyectos, 'PRO', 3));
  const idFinal = datos.id || generateSafeUUID();

  const payload: ProyectoRecord = {
    id: idFinal,
    user_id: datos.user_id || '00000000-0000-0000-0000-000000000001',
    codigo_legado: codigoLegado,
    nombre_proyecto: (datos.nombre_proyecto || 'Nuevo Proyecto').trim(),
    tipo_iniciativa: datos.tipo_iniciativa || 'Personal',
    arquetipo_proyecto: datos.arquetipo_proyecto || '1_Infraestructura',
    estado_proyecto: datos.estado_proyecto || '01_Ideacion',
    health_status: datos.health_status || 'Verde',
    avance_real_pct: datos.avance_real_pct ?? 0,
    moneda_base: datos.moneda_base || 'PEN',
    presupuesto_tope: Number(datos.presupuesto_tope) || 0,
    costo_ejecutado_real_pen: Number(datos.costo_ejecutado_real_pen) || 0,
    costo_ejecutado_real_usd: Number(datos.costo_ejecutado_real_usd) || 0,
    north_star_okr: datos.north_star_okr || '',
    criterios_aceptacion_dod: datos.criterios_aceptacion_dod || '',
    updated_at: nowIso,
    sync_status: 'pending'
  };

  await db.proyectos.put(payload);

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[proyectosService] Error en syncManager.syncPendingRecords tras crear proyecto:', err);
  });

  return payload;
}

/**
 * Actualiza un proyecto existente en Dexie y dispara sincronización.
 */
export async function actualizarProyecto(id: string, cambios: Partial<ProyectoRecord>): Promise<ProyectoRecord | undefined> {
  const actual = await db.proyectos.get(id);
  if (!actual) return undefined;

  const nowIso = new Date().toISOString();
  const updates: Partial<ProyectoRecord> = {
    ...cambios,
    updated_at: nowIso,
    sync_status: 'pending'
  };

  await db.proyectos.update(id, updates);

  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[proyectosService] Error en syncManager.syncPendingRecords tras actualizar proyecto:', err);
  });

  return { ...actual, ...updates };
}

/**
 * Elimina un proyecto en cascada exhaustiva atómica:
 * 1. Resuelve todos los hitos WBS del proyecto.
 * 2. Resuelve todas las tareas operativas asociadas.
 * 3. Resuelve todas las subtareas subordinadas a las tareas del proyecto.
 * 4. Resuelve todos los gastos vinculados al proyecto o sus tareas/hitos.
 * 5. Ejecuta una transacción Dexie eliminando y registrando tombstones individuales para cada entidad.
 * 6. Dispara la sincronización inmediata de lápidas hacia Supabase.
 */
export async function eliminarProyecto(
  proyectoId: string,
  codigoLegado?: string
): Promise<ResultadoEliminacionCascadaProyecto> {
  const proyActual = await db.proyectos.get(proyectoId);
  const codLegado = codigoLegado || proyActual?.codigo_legado;
  const proyRefs = Array.from(new Set([proyectoId, codLegado].filter(Boolean) as string[]));

  // 1. Obtener hitos subordinados
  let hitos: HitoWbsRecord[] = [];
  try {
    hitos = await db.hitos_wbs.where('proyecto_id').anyOf(proyRefs).toArray();
  } catch {
    hitos = [];
  }
  const hitoIds = hitos.map((h) => h.id);
  const hitoCodigos = hitos.map((h) => h.codigo_legado).filter(Boolean) as string[];
  const hitoRefs = Array.from(new Set([...hitoIds, ...hitoCodigos]));

  // 2. Obtener tareas subordinadas
  let tareas: TareaRecord[] = [];
  try {
    tareas = await db.tareas.where('proyecto_codigo').anyOf(proyRefs).toArray();
  } catch {
    tareas = [];
  }
  const tareaIds = tareas.map((t) => t.id);
  const tareaCodigos = tareas.map((t) => t.codigo_legado).filter(Boolean) as string[];
  const tareaRefs = Array.from(new Set([...tareaIds, ...tareaCodigos]));

  // 3. Obtener subtareas vinculadas a las tareas del proyecto
  let subtareas: SubtareaPaso[] = [];
  if (tareaRefs.length > 0) {
    try {
      subtareas = await db.subtareas_pasos.where('id_padre_vinculado').anyOf(tareaRefs).toArray();
    } catch {
      subtareas = [];
    }
  }

  // 4. Obtener gastos vinculados al proyecto o a sus tareas/hitos
  const mapaGastos = new Map<string, GastoRecord>();
  try {
    const gastosProy = await db.gastos.where('id_proyecto').anyOf(proyRefs).toArray();
    gastosProy.forEach((g) => mapaGastos.set(g.id, g));
  } catch {}

  if (proyRefs.length > 0 || tareaRefs.length > 0 || hitoRefs.length > 0) {
    try {
      const gastosOrigen = await db.gastos
        .where('id_origen_vinculado')
        .anyOf([...proyRefs, ...tareaRefs, ...hitoRefs])
        .toArray();
      gastosOrigen.forEach((g) => mapaGastos.set(g.id, g));
    } catch {}
  }
  const gastosAEliminar = Array.from(mapaGastos.values());

  // 5. Ejecutar eliminación atómica en Dexie con registro exhaustivo de lápidas
  const tablasTransaccion = [
    db.proyectos,
    db.hitos_wbs,
    db.tareas,
    db.subtareas_pasos,
    db.gastos,
    db.tombstones
  ];
  if (db.sync_deletions) tablasTransaccion.push(db.sync_deletions);

  await db.transaction('rw', tablasTransaccion, async () => {
    // 5.1. Subtareas
    for (const sub of subtareas) {
      await registrarTombstone('subtareas_pasos', sub.id);
      await db.subtareas_pasos.delete(sub.id).catch(() => {});
    }

    // 5.2. Tareas
    for (const tar of tareas) {
      await registrarTombstone('tareas', tar.id);
      await db.tareas.delete(tar.id).catch(() => {});
    }

    // 5.3. Hitos WBS
    for (const hito of hitos) {
      await registrarTombstone('hitos_wbs', hito.id);
      await db.hitos_wbs.delete(hito.id).catch(() => {});
    }

    // 5.4. Gastos vinculados
    for (const gasto of gastosAEliminar) {
      await registrarTombstone('gastos', gasto.id);
      await db.gastos.delete(gasto.id).catch(() => {});
    }

    // 5.5. Proyecto raíz
    await registrarTombstone('proyectos', proyectoId);
    await db.proyectos.delete(proyectoId);
  });

  console.info(
    `[proyectosService] Proyecto ${proyectoId} eliminado en cascada: ` +
    `${hitos.length} hitos, ${tareas.length} tareas, ${subtareas.length} subtareas, ${gastosAEliminar.length} gastos. Lápidas registradas.`
  );

  // 6. Propagar inmediatamente hacia Supabase
  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[proyectosService] Error en syncPendingRecords tras eliminación en cascada:', err);
  });

  return {
    success: true,
    eliminados: {
      proyectoId,
      hitos: hitos.length,
      tareas: tareas.length,
      subtareas: subtareas.length,
      gastos: gastosAEliminar.length
    }
  };
}

export interface ResultadoEliminacionHitoWBS {
  success: boolean;
  hitoId: string;
  tareasDesvinculadas: number;
}

/**
 * Elimina un paquete de trabajo (Hito WBS) de forma atómica y segura:
 * 1. Resuelve las tareas asignadas a este hito y las desvincula (limpiando hito_id / hito_codigo)
 *    para evitar registros huérfanos.
 * 2. Registra la lápida (tombstone) del hito en IndexedDB para propagar el DELETE a Supabase.
 * 3. Elimina el hito de db.hitos_wbs dentro de una transacción Dexie.
 * 4. Dispara la sincronización inmediata con Supabase.
 */
export async function eliminarHitoWBS(hitoId: string): Promise<ResultadoEliminacionHitoWBS> {
  const hitoActual = await db.hitos_wbs.get(hitoId);
  const codLegado = hitoActual?.codigo_legado;
  const hitoRefs = Array.from(new Set([hitoId, codLegado].filter(Boolean) as string[]));

  // 1. Obtener tareas vinculadas a este hito
  let tareasAsociadas: TareaRecord[] = [];
  try {
    const allTareas = await db.tareas.toArray();
    tareasAsociadas = allTareas.filter((t: any) => {
      const hRef = t.hito_codigo || t.hito_id || t.ID_Hito || t.id_hito;
      return hRef && hitoRefs.includes(hRef);
    });
  } catch {
    tareasAsociadas = [];
  }

  // 2. Transacción atómica
  const tablasTransaccion = [
    db.hitos_wbs,
    db.tareas,
    db.tombstones
  ];
  if (db.sync_deletions) tablasTransaccion.push(db.sync_deletions);

  const nowIso = new Date().toISOString();

  await db.transaction('rw', tablasTransaccion, async () => {
    // 2.1 Desvincular tareas asociadas para evitar referencias huérfanas
    for (const tarea of tareasAsociadas) {
      await db.tareas.update(tarea.id, {
        hito_codigo: undefined,
        hito_id: undefined,
        updated_at: nowIso,
        sync_status: 'pending'
      });
    }

    // 2.2 Registrar lápida (tombstone) del hito
    await registrarTombstone('hitos_wbs', hitoId);

    // 2.3 Eliminar hito de Dexie
    await db.hitos_wbs.delete(hitoId);
  });

  console.info(
    `[proyectosService] Hito WBS ${hitoId} eliminado: ` +
    `${tareasAsociadas.length} tareas desvinculadas. Lápida registrada.`
  );

  // 3. Propagar inmediatamente hacia Supabase
  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[proyectosService] Error en syncPendingRecords tras eliminar hito WBS:', err);
  });

  return {
    success: true,
    hitoId,
    tareasDesvinculadas: tareasAsociadas.length
  };
}
