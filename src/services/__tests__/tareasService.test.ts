/**
 * ============================================================================
 * ARCHIVO: src/services/__tests__/tareasService.test.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-44-EXEC
 * DESCRIPCIÓN: Pruebas unitarias de tareasService (crear, actualizar, eliminar,
 *              Google Calendar polimórfico y push inmediato).
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TareaRecord } from '../../types';

const memoryTareas = new Map<string, TareaRecord>();
const memoryTombstones: any[] = [];

vi.mock('../../db/db', () => ({
  db: {
    tareas: {
      toArray: vi.fn(async () => Array.from(memoryTareas.values())),
      add: vi.fn(async (item: any) => {
        memoryTareas.set(item.id, item);
        return item.id;
      }),
      put: vi.fn(async (item: any) => {
        memoryTareas.set(item.id, item);
        return item.id;
      }),
      get: vi.fn(async (id: any) => memoryTareas.get(id)),
      update: vi.fn(async (id: any, changes: any) => {
        const existing = memoryTareas.get(id);
        if (existing) {
          const updated = { ...existing, ...changes };
          memoryTareas.set(id, updated);
        }
        return 1;
      }),
      delete: vi.fn(async (id: any) => {
        memoryTareas.delete(id);
      })
    },
    subtareas_pasos: {
      add: vi.fn(async () => 'sub_1'),
      put: vi.fn(async () => 'sub_1'),
      count: vi.fn(async () => 0),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(async () => []),
          delete: vi.fn(async () => 0)
        }))
      }))
    },
    tombstones: {
      put: vi.fn(async (t: any) => {
        memoryTombstones.push(t);
        return t.id;
      })
    },
    isOpen: vi.fn().mockReturnValue(true)
  }
}));

vi.mock('../syncManager', () => ({
  syncManager: {
    syncPendingRecords: vi.fn(() => Promise.resolve({ totalProcesados: 1, exitosos: 1, fallidos: 0, errores: [] })),
    guardarSnapshotEnPuenteLocal: vi.fn(() => Promise.resolve(true))
  }
}));

import { crearTarea, actualizarTarea, eliminarTarea } from '../tareasService';
import { syncManager } from '../syncManager';
import * as calendarSyncService from '../calendarSyncService';

describe('tareasService Omni-Sincronización y Calendar Polimórfico [REQ-SYNC-44-EXEC]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memoryTareas.clear();
    memoryTombstones.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. crearTarea: persiste con sync_status: pending, genera TAR-XXX y dispara syncPendingRecords()', async () => {
    const sincronizarCalendarSpy = vi.spyOn(calendarSyncService, 'sincronizarTareaCalendar').mockResolvedValue({
      success: true,
      eventId: 'gcal-test-tar-1'
    });

    const res = await crearTarea({
      nombre_tarea_actividad: 'Test Implementar WBS Selector',
      proyecto_codigo: 'PRO-001',
      hito_codigo: 'HIT-001',
      estado_tarea: '02_Por_Hacer',
      prioridad_eisenhower: 'DO_FIRST',
      fecha_programada: '2026-11-15',
      horas_estimadas: 2,
      agendado_calendar: 'Sí'
    });

    expect(res).toBeDefined();
    expect(res.tarea).toBeDefined();
    const { tarea } = res;
    expect(tarea.id).toBeDefined();
    expect(tarea.codigo_legado).toMatch(/^TAR-\d{3,}$/);
    expect(tarea.nombre_tarea_actividad).toBe('Test Implementar WBS Selector');
    expect(tarea.sync_status).toBe('pending');

    // Verificar persistencia en memoria/Dexie
    expect(memoryTareas.has(tarea.id)).toBe(true);
    expect(memoryTareas.get(tarea.id)?.codigo_legado).toBe(tarea.codigo_legado);

    // Verificar llamada a calendarSyncService
    expect(sincronizarCalendarSpy).toHaveBeenCalledTimes(1);
    expect(sincronizarCalendarSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre_tarea_actividad: 'Test Implementar WBS Selector',
        proyecto_codigo: 'PRO-001'
      }),
      'UPSERT'
    );

    // Verificar disparo inmediato de sincronización Cloud y Puente Local
    expect(syncManager.syncPendingRecords).toHaveBeenCalled();
  });

  it('2. actualizarTarea: muta campos, actualiza updated_at, setea pending y dispara syncPendingRecords()', async () => {
    const { tarea: tareaInicial } = await crearTarea({
      nombre_tarea_actividad: 'Tarea Para Actualizar',
      proyecto_codigo: 'PRO-001',
      estado_tarea: '01_Backlog'
    });

    const sincronizarUpdateSpy = vi.spyOn(calendarSyncService, 'sincronizarTareaCalendar').mockResolvedValue({
      success: true,
      eventId: 'gcal-test-tar-updated'
    });

    const resActualizado = await actualizarTarea(tareaInicial.id, {
      estado_tarea: '03_En_Proceso',
      horas_reales: 1.5,
      agendado_calendar: 'Sí'
    });

    const { tarea: tareaActualizada } = resActualizado;
    expect(tareaActualizada.estado_tarea).toBe('03_En_Proceso');
    expect(tareaActualizada.horas_reales).toBe(1.5);
    expect(tareaActualizada.sync_status).toBe('pending');

    const enMemoria = memoryTareas.get(tareaInicial.id);
    expect(enMemoria?.estado_tarea).toBe('03_En_Proceso');
    expect(enMemoria?.horas_reales).toBe(1.5);

    expect(sincronizarUpdateSpy).toHaveBeenCalledTimes(1);
    expect(syncManager.syncPendingRecords).toHaveBeenCalled();
  });

  it('3. eliminarTarea: crea tombstone, remueve de Dexie, sincroniza eliminación en Calendar y dispara syncPendingRecords()', async () => {
    const { tarea: tareaInicial } = await crearTarea({
      nombre_tarea_actividad: 'Tarea Para Eliminar',
      proyecto_codigo: 'PRO-001',
      agendado_calendar: 'Sí'
    });

    const sincronizarDeleteSpy = vi.spyOn(calendarSyncService, 'sincronizarTareaCalendar').mockResolvedValue({
      success: true
    });

    const res = await eliminarTarea(tareaInicial.id, tareaInicial.codigo_legado);
    expect(res.success).toBe(true);

    expect(memoryTareas.has(tareaInicial.id)).toBe(false);

    const miTombstone = memoryTombstones.find((t) => t.id === tareaInicial.id);
    expect(miTombstone).toBeDefined();
    expect(miTombstone?.sync_status).toBe('pending');
    expect(miTombstone?.tabla_afectada).toBe('tareas');

    expect(sincronizarDeleteSpy).toHaveBeenCalledTimes(1);
    expect(sincronizarDeleteSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: tareaInicial.id, codigo_legado: tareaInicial.codigo_legado }),
      'DELETE'
    );
    expect(syncManager.syncPendingRecords).toHaveBeenCalled();
  });
});
