/**
 * ============================================================================
 * ARCHIVO: src/services/__tests__/proyectosService.test.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-AUDIT-03-FIX
 * DESCRIPCIÓN: Pruebas unitarias para proyectosService.eliminarProyecto
 *              validando la eliminación en cascada atómica y el registro
 *              estricto de lápidas (tombstones) por cada entidad subordinada.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProyectoRecord, HitoWbsRecord, TareaRecord, SubtareaPaso, GastoRecord } from '../../types';

const memoryProyectos = new Map<string, ProyectoRecord>();
const memoryHitos = new Map<string, HitoWbsRecord>();
const memoryTareas = new Map<string, TareaRecord>();
const memorySubtareas = new Map<string, SubtareaPaso>();
const memoryGastos = new Map<string, GastoRecord>();
const memoryTombstones: Array<{ tabla: string; id: string }> = [];

vi.mock('../../db/db', () => ({
  db: {
    proyectos: {
      get: vi.fn(async (id: string) => memoryProyectos.get(id)),
      delete: vi.fn(async (id: string) => {
        memoryProyectos.delete(id);
      }),
      put: vi.fn(async (item: any) => {
        memoryProyectos.set(item.id, item);
        return item.id;
      }),
      update: vi.fn(async (id: string, ch: any) => {
        const ex = memoryProyectos.get(id);
        if (ex) memoryProyectos.set(id, { ...ex, ...ch });
      })
    },
    hitos_wbs: {
      where: vi.fn((field: string) => ({
        anyOf: vi.fn((refs: string[]) => ({
          toArray: vi.fn(async () =>
            Array.from(memoryHitos.values()).filter((h) => refs.includes((h as any)[field]))
          )
        }))
      })),
      delete: vi.fn(async (id: string) => {
        memoryHitos.delete(id);
      })
    },
    tareas: {
      where: vi.fn((field: string) => ({
        anyOf: vi.fn((refs: string[]) => ({
          toArray: vi.fn(async () =>
            Array.from(memoryTareas.values()).filter((t) => refs.includes((t as any)[field]))
          )
        }))
      })),
      delete: vi.fn(async (id: string) => {
        memoryTareas.delete(id);
      })
    },
    subtareas_pasos: {
      where: vi.fn((field: string) => ({
        anyOf: vi.fn((refs: string[]) => ({
          toArray: vi.fn(async () =>
            Array.from(memorySubtareas.values()).filter((s) => refs.includes((s as any)[field]))
          )
        }))
      })),
      delete: vi.fn(async (id: string) => {
        memorySubtareas.delete(id);
      })
    },
    gastos: {
      where: vi.fn((field: string) => ({
        anyOf: vi.fn((refs: string[]) => ({
          toArray: vi.fn(async () =>
            Array.from(memoryGastos.values()).filter((g) => refs.includes((g as any)[field]))
          )
        }))
      })),
      delete: vi.fn(async (id: string) => {
        memoryGastos.delete(id);
      })
    },
    tombstones: {
      put: vi.fn(async (t: any) => {
        memoryTombstones.push({ tabla: t.tabla, id: t.id });
        return t.id;
      })
    },
    sync_deletions: {
      put: vi.fn(async () => 'ok')
    },
    transaction: vi.fn(async (_mode: string, _tables: any[], callback: () => Promise<void>) => {
      await callback();
    })
  },
  registrarTombstone: vi.fn(async (tabla: string, id: string) => {
    memoryTombstones.push({ tabla, id });
  })
}));

vi.mock('../syncManager', () => ({
  syncManager: {
    syncPendingRecords: vi.fn().mockResolvedValue(undefined)
  }
}));

import { eliminarProyecto } from '../proyectosService';
import { syncManager } from '../syncManager';

describe('REQ-SYNC-AUDIT-03-FIX: proyectosService.eliminarProyecto', () => {
  beforeEach(() => {
    memoryProyectos.clear();
    memoryHitos.clear();
    memoryTareas.clear();
    memorySubtareas.clear();
    memoryGastos.clear();
    memoryTombstones.length = 0;
    vi.clearAllMocks();
  });

  it('Elimina en cascada exhaustiva un proyecto y registra 1 tombstone por cada entidad hija (hitos, tareas, subtareas, gastos)', async () => {
    const proyId = 'proy-uuid-001';
    const proyCod = 'PRO-001';

    // 1. Sembrar Proyecto raíz
    memoryProyectos.set(proyId, {
      id: proyId,
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: proyCod,
      nombre_proyecto: 'Proyecto de Prueba Cascada',
      tipo_iniciativa: 'Personal',
      estado_proyecto: '03_En_Ejecucion',
      avance_real_pct: 20,
      presupuesto_tope: 5000,
      costo_ejecutado_real_pen: 1200,
      updated_at: new Date().toISOString(),
      sync_status: 'synced'
    } as ProyectoRecord);

    // 2. Sembrar 2 Hitos WBS
    memoryHitos.set('hito-1', {
      id: 'hito-1',
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: 'HIT-001',
      proyecto_id: proyCod,
      nombre_elemento: 'Hito 1',
      tipo_elemento_wbs: 'PAQUETE_TRABAJO',
      wbs_code: '1.1',
      fase_asociada: '01_INICIACION',
      estado: '01_Pendiente',
      peso_pct: 50,
      updated_at: new Date().toISOString(),
      sync_status: 'synced'
    } as unknown as HitoWbsRecord);
    memoryHitos.set('hito-2', {
      id: 'hito-2',
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: 'HIT-002',
      proyecto_id: proyId,
      nombre_elemento: 'Hito 2',
      tipo_elemento_wbs: 'PAQUETE_TRABAJO',
      wbs_code: '1.2',
      fase_asociada: '02_PLANIFICACION',
      estado: '01_Pendiente',
      peso_pct: 50,
      updated_at: new Date().toISOString(),
      sync_status: 'synced'
    } as unknown as HitoWbsRecord);

    // 3. Sembrar 2 Tareas vinculadas al proyecto
    memoryTareas.set('tar-1', {
      id: 'tar-1',
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: 'TAR-001',
      proyecto_codigo: proyCod,
      hito_codigo: 'HIT-001',
      nombre_tarea_actividad: 'Tarea Operativa 1',
      estado_tarea: '02_Por_Hacer',
      prioridad_eisenhower: '01_P1_Alta',
      horas_estimadas: 4,
      horas_reales: 0,
      updated_at: new Date().toISOString(),
      sync_status: 'synced'
    });
    memoryTareas.set('tar-2', {
      id: 'tar-2',
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: 'TAR-002',
      proyecto_codigo: proyId,
      hito_codigo: 'HIT-002',
      nombre_tarea_actividad: 'Tarea Operativa 2',
      estado_tarea: '02_Por_Hacer',
      prioridad_eisenhower: '02_P2_Media',
      horas_estimadas: 6,
      horas_reales: 0,
      updated_at: new Date().toISOString(),
      sync_status: 'synced'
    });

    // 4. Sembrar 2 Subtareas subordinadas
    memorySubtareas.set('sub-1', {
      id: 'sub-1',
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: 'SUB-001',
      id_padre_vinculado: 'TAR-001',
      tipo_padre: 'TAREA',
      numero_paso: 1,
      descripcion_paso: 'Paso 1 de Tarea 1',
      completado: false,
      version: 1,
      updated_at: new Date().toISOString(),
      sync_status: 'synced'
    });
    memorySubtareas.set('sub-2', {
      id: 'sub-2',
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: 'SUB-002',
      id_padre_vinculado: 'tar-2',
      tipo_padre: 'TAREA',
      numero_paso: 1,
      descripcion_paso: 'Paso 1 de Tarea 2 por UUID',
      completado: false,
      version: 1,
      updated_at: new Date().toISOString(),
      sync_status: 'synced'
    });

    // 5. Sembrar 1 Gasto vinculado al proyecto
    memoryGastos.set('gas-1', {
      id: 'gas-1',
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: 'GAS-001',
      id_proyecto: proyCod,
      tipo_origen: 'PROYECTO',
      categoria_gasto: 'Materiales & Equipos',
      fecha_gasto: '2026-11-16',
      descripcion_gasto: 'Servidor VPS',
      moneda_original: 'USD',
      monto_original: 50,
      tipo_cambio: 3.75,
      monto_pen: 187.5,
      metodo_pago: 'Tarjeta',
      estado_pago: 'PAGADO',
      updated_at: new Date().toISOString(),
      sync_status: 'synced'
    });

    // Ejecutar eliminación en cascada
    const resultado = await eliminarProyecto(proyId, proyCod);

    expect(resultado.success).toBe(true);
    expect(resultado.eliminados.proyectoId).toBe(proyId);
    expect(resultado.eliminados.hitos).toBe(2);
    expect(resultado.eliminados.tareas).toBe(2);
    expect(resultado.eliminados.subtareas).toBe(2);
    expect(resultado.eliminados.gastos).toBe(1);

    // Verificar que todas las entidades fueron eliminadas en memoria
    expect(memoryProyectos.has(proyId)).toBe(false);
    expect(memoryHitos.has('hito-1')).toBe(false);
    expect(memoryHitos.has('hito-2')).toBe(false);
    expect(memoryTareas.has('tar-1')).toBe(false);
    expect(memoryTareas.has('tar-2')).toBe(false);
    expect(memorySubtareas.has('sub-1')).toBe(false);
    expect(memorySubtareas.has('sub-2')).toBe(false);
    expect(memoryGastos.has('gas-1')).toBe(false);

    // Verificar que se registró exactamente 1 tombstone por cada entidad eliminada (total 8)
    expect(memoryTombstones).toHaveLength(8);
    expect(memoryTombstones).toContainEqual({ tabla: 'proyectos', id: proyId });
    expect(memoryTombstones).toContainEqual({ tabla: 'hitos_wbs', id: 'hito-1' });
    expect(memoryTombstones).toContainEqual({ tabla: 'hitos_wbs', id: 'hito-2' });
    expect(memoryTombstones).toContainEqual({ tabla: 'tareas', id: 'tar-1' });
    expect(memoryTombstones).toContainEqual({ tabla: 'tareas', id: 'tar-2' });
    expect(memoryTombstones).toContainEqual({ tabla: 'subtareas_pasos', id: 'sub-1' });
    expect(memoryTombstones).toContainEqual({ tabla: 'subtareas_pasos', id: 'sub-2' });
    expect(memoryTombstones).toContainEqual({ tabla: 'gastos', id: 'gas-1' });

    // Verificar que se disparó la sincronización con Supabase
    expect(syncManager.syncPendingRecords).toHaveBeenCalled();
  });
});
