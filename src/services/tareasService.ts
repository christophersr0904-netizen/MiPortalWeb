/**
 * ============================================================================
 * ARCHIVO: src/services/tareasService.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-44-EXEC
 * DESCRIPCIÓN: Servicio de negocio centralizado para el ciclo de vida de Tareas,
 *              subtareas asociadas, omni-sincronización en tiempo real hacia
 *              Supabase y Google Calendar API v3 polimórfico.
 * ============================================================================
 */

import { db } from '../db/db';
import type { TareaRecord, SubtareaPaso } from '../types';
import { syncManager } from './syncManager';
import {
  sincronizarTareaCalendar,
  type ResultadoCalendarSync
} from './calendarSyncService';
import { generarCodigoCorrelativoSeguro } from '../utils/entityNormalizer';

export interface OpcionesCrearTarea extends Partial<TareaRecord> {
  subtareas?: Array<{ descripcion_paso: string; completado?: boolean }>;
}

export interface ResultadoOperacionTarea {
  tarea: TareaRecord;
  calendarResult?: ResultadoCalendarSync;
}

/**
 * 1. CREAR TAREA
 * Persiste en Dexie con `sync_status = 'pending'`, vincula subtareas, sincroniza
 * con Google Calendar si está agendada y dispara `syncManager.syncPendingRecords()` instantáneamente.
 */
export async function crearTarea(
  datos: OpcionesCrearTarea
): Promise<ResultadoOperacionTarea> {
  const nowIso = new Date().toISOString();
  const codigoLegadoFinal =
    datos.codigo_legado || (await generarCodigoCorrelativoSeguro(db.tareas, 'TAR', 3));
  const idFinal =
    datos.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tar_${Date.now()}`);

  const tareaPayload: TareaRecord = {
    id: idFinal,
    user_id: datos.user_id || '00000000-0000-0000-0000-000000000001',
    codigo_legado: codigoLegadoFinal,
    proyecto_codigo: datos.proyecto_codigo || 'PRO-001',
    hito_codigo: datos.hito_codigo || undefined,
    id_dependencia: datos.id_dependencia || undefined,
    nombre_tarea_actividad: (datos.nombre_tarea_actividad || 'Nueva Tarea').trim(),
    estado_tarea: datos.estado_tarea || '02_Por_Hacer',
    prioridad_eisenhower: datos.prioridad_eisenhower || '02_P2_Media',
    nivel_energia_requerido: datos.nivel_energia_requerido || 'Media_Operativa',
    horas_estimadas: Math.max(0, Number(datos.horas_estimadas) || 1),
    horas_reales: Math.max(0, Number(datos.horas_reales) || 0),
    fecha_programada: datos.fecha_programada || nowIso.split('T')[0],
    hora_inicio: datos.hora_inicio?.trim() || '09:00',
    agendado_calendar: datos.agendado_calendar === 'No' ? 'No' : 'Sí',
    es_mav: Boolean(datos.es_mav),
    costo_real_pen: Math.max(0, Number(datos.costo_real_pen) || 0),
    responsable_ejecutor: datos.responsable_ejecutor?.trim() || 'Christopher',
    notas_impedimentos: datos.notas_impedimentos?.trim() || undefined,
    updated_at: nowIso,
    sync_status: 'pending'
  };

  await db.tareas.add(tareaPayload);

  // Persistir subtareas asociadas si se proporcionaron
  if (datos.subtareas && datos.subtareas.length > 0) {
    let subIndex = await db.subtareas_pasos.count();
    for (let i = 0; i < datos.subtareas.length; i++) {
      const item = datos.subtareas[i];
      subIndex++;
      const subPayload: SubtareaPaso = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sub_${Date.now()}_${i}`,
        user_id: tareaPayload.user_id,
        codigo_legado: `SUB-${String(subIndex).padStart(3, '0')}`,
        id_padre_vinculado: codigoLegadoFinal,
        tipo_padre: 'TAREA',
        numero_paso: i + 1,
        descripcion_paso: item.descripcion_paso.trim(),
        completado: Boolean(item.completado),
        version: 1,
        updated_at: nowIso,
        sync_status: 'pending'
      };
      await db.subtareas_pasos.add(subPayload);
    }
  }

  // Sincronización polimórfica hacia Google Calendar API v3
  let calendarResult: ResultadoCalendarSync | undefined;
  if (tareaPayload.agendado_calendar === 'Sí') {
    calendarResult = await sincronizarTareaCalendar(tareaPayload, 'UPSERT').catch((err) => {
      console.warn('[tareasService] Error al sincronizar creación en Google Calendar:', err);
      return undefined;
    });
  }

  // Disparo inmediato de Omni-Sincronización hacia Supabase Realtime
  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[tareasService] Error en syncManager.syncPendingRecords tras crear tarea:', err);
  });

  return { tarea: tareaPayload, calendarResult };
}

/**
 * 2. ACTUALIZAR TAREA
 * Persiste cambios en Dexie forzando `sync_status = 'pending'`, incrementa versión,
 * sincroniza Google Calendar si corresponde y dispara `syncPendingRecords()`.
 */
export async function actualizarTarea(
  tareaId: string,
  cambios: Partial<TareaRecord>
): Promise<ResultadoOperacionTarea> {
  const tareaActual = await db.tareas.get(tareaId);
  const nowIso = new Date().toISOString();
  const versionActual = Math.max(1, Number((tareaActual as any)?.version) || 1);

  const updates: Partial<TareaRecord> & { version: number; sync_status: 'pending'; updated_at: string } = {
    ...cambios,
    version: versionActual + 1,
    sync_status: 'pending',
    updated_at: nowIso
  };

  await db.tareas.update(tareaId, updates as any);

  const tareaActualizada: TareaRecord = {
    ...(tareaActual || {}),
    ...updates
  } as TareaRecord;

  // Sincronización polimórfica en Google Calendar (Actualizar o Eliminar si desmarcó Calendar)
  let calendarResult: ResultadoCalendarSync | undefined;
  if (
    tareaActualizada.agendado_calendar === 'Sí' ||
    Boolean((tareaActual as any)?.id_evento_calendar)
  ) {
    calendarResult = await sincronizarTareaCalendar(tareaActualizada, 'UPSERT').catch((err) => {
      console.warn('[tareasService] Error al sincronizar actualización en Google Calendar:', err);
      return undefined;
    });
  }

  // Disparo inmediato de Omni-Sincronización hacia Supabase Realtime
  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[tareasService] Error en syncManager.syncPendingRecords tras actualizar tarea:', err);
  });

  return { tarea: tareaActualizada, calendarResult };
}

/**
 * 3. ELIMINAR TAREA
 * Registra tombstone, limpia subtareas, elimina de Google Calendar y propaga a la nube.
 */
export async function eliminarTarea(
  tareaId: string,
  codigoLegado?: string
): Promise<{ success: boolean; calendarResult?: ResultadoCalendarSync }> {
  const tareaActual = await db.tareas.get(tareaId);
  const codLegado = codigoLegado || tareaActual?.codigo_legado;
  const nowIso = new Date().toISOString();

  // Limpiar subtareas vinculadas
  if (codLegado) {
    const subs = await db.subtareas_pasos
      .where('id_padre_vinculado')
      .equals(codLegado)
      .toArray()
      .catch(() => []);
    for (const sub of subs) {
      if (db.tombstones && typeof db.tombstones.put === 'function') {
        await db.tombstones.put({
          id: sub.id,
          tabla: 'subtareas_pasos',
          tabla_afectada: 'subtareas_pasos',
          fecha_eliminacion: nowIso,
          sync_status: 'pending'
        } as any).catch(() => {});
      }
      await db.subtareas_pasos.delete(sub.id).catch(() => {});
    }
  }

  // Registrar tombstone de la tarea principal
  if (db.tombstones && typeof db.tombstones.put === 'function') {
    await db.tombstones.put({
      id: tareaId,
      tabla: 'tareas',
      tabla_afectada: 'tareas',
      fecha_eliminacion: nowIso,
      sync_status: 'pending'
    } as any).catch(() => {});
  }

  await db.tareas.delete(tareaId);

  // Sincronización de eliminación en Google Calendar
  let calendarResult: ResultadoCalendarSync | undefined;
  if (
    tareaActual &&
    (tareaActual.agendado_calendar === 'Sí' || Boolean((tareaActual as any).id_evento_calendar))
  ) {
    calendarResult = await sincronizarTareaCalendar(tareaActual, 'DELETE').catch((err) => {
      console.warn('[tareasService] Error al sincronizar eliminación en Google Calendar:', err);
      return undefined;
    });
  }

  // Disparo inmediato de Omni-Sincronización hacia Supabase Realtime
  syncManager.syncPendingRecords().catch((err) => {
    console.warn('[tareasService] Error en syncManager.syncPendingRecords tras eliminar tarea:', err);
  });

  return { success: true, calendarResult };
}
