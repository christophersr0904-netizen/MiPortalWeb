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

import { db, registrarTombstone } from '../db/db';
import type { TareaRecord, SubtareaPaso } from '../types';
import { syncManager } from './syncManager';
import {
  sincronizarTareaCalendar,
  type ResultadoCalendarSync
} from './calendarSyncService';
import { generarCodigoCorrelativoSeguro } from '../utils/entityNormalizer';
import { generateSafeUUID } from '../utils/uuidGenerator';
import { formatFechaIsoLocal } from '../utils/timeFormatters';

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
  const esCompletadaInicial = String(datos.estado_tarea || '').includes('04_') || String(datos.estado_tarea || '').toLowerCase().includes('completad');
  const fechaCompletadoInicial = datos.fecha_completado || (esCompletadaInicial ? formatFechaIsoLocal(new Date()) : undefined);
  const codigoLegadoFinal =
    datos.codigo_legado || (await generarCodigoCorrelativoSeguro(db.tareas, 'TAR', 3));
  const idFinal = datos.id || generateSafeUUID();

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
    fecha_completado: fechaCompletadoInicial,
    hora_inicio: datos.hora_inicio?.trim() || undefined,
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
        id: generateSafeUUID(),
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

  // REQ-METRICS-EXECUTION-02: Gestión automática de fecha_completado al cambiar estado
  if (cambios.estado_tarea !== undefined) {
    const st = String(cambios.estado_tarea).toLowerCase();
    const esComp = st.includes('04_') || st.includes('completad') || st === 'hecho' || st === 'terminado';
    if (esComp && !cambios.fecha_completado && !tareaActual?.fecha_completado) {
      updates.fecha_completado = formatFechaIsoLocal(new Date());
    } else if (!esComp && cambios.fecha_completado === undefined) {
      updates.fecha_completado = '';
    }
  }

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
  const padresRef = Array.from(new Set([codLegado, tareaId].filter(Boolean) as string[]));

  // Limpiar subtareas vinculadas (soporta búsqueda por código legado y por UUID)
  if (padresRef.length > 0 && db.subtareas_pasos && typeof db.subtareas_pasos.where === 'function') {
    try {
      const whereClause: any = db.subtareas_pasos.where('id_padre_vinculado');
      const subs = await (typeof whereClause.anyOf === 'function'
        ? whereClause.anyOf(padresRef)
        : whereClause.equals(codLegado || tareaId)
      )
        .toArray()
        .catch(() => []);
      for (const sub of subs) {
        await registrarTombstone('subtareas_pasos', sub.id);
        await db.subtareas_pasos.delete(sub.id).catch(() => {});
      }
    } catch (err) {
      console.warn('[tareasService] Error al limpiar subtareas vinculadas:', err);
    }
  }

  // Desvincular gastos vinculados a la tarea (en paridad con Postgres ON DELETE SET NULL)
  if (padresRef.length > 0 && db.gastos && typeof db.gastos.where === 'function') {
    try {
      const whereClauseGasto: any = db.gastos.where('id_origen_vinculado');
      const gastosVinculados = await (typeof whereClauseGasto.anyOf === 'function'
        ? whereClauseGasto.anyOf(padresRef)
        : whereClauseGasto.equals(codLegado || tareaId)
      )
        .toArray()
        .catch(() => []);

      for (const gasto of gastosVinculados) {
        if (gasto.tipo_origen === 'TAREA') {
          await db.gastos.update(gasto.id, {
            id_origen_vinculado: undefined,
            tipo_origen: undefined,
            updated_at: new Date().toISOString(),
            sync_status: 'pending'
          });
        }
      }
    } catch (err) {
      console.warn('[tareasService] Error al desvincular gastos de tarea eliminada:', err);
    }
  }

  // Registrar tombstone / sync_deletions de la tarea principal
  await registrarTombstone('tareas', tareaId);

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
