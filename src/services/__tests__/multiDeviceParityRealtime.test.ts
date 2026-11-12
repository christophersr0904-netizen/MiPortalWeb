/**
 * ============================================================================
 * ARCHIVO: src/services/__tests__/multiDeviceParityRealtime.test.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-41-EXEC (Certificación Multi-Dispositivo en Tiempo Real)
 * DESCRIPCIÓN: Pruebas unitarias para:
 *              1. Generador de correlativo numérico anti-colisión seguro (MAX + 1).
 *              2. Sanitización Inbound de Subtareas con resolución UUID -> Código Canónico.
 *              3. Paridad completa de esquemas en Actividades Personales y Tareas.
 *              4. Propagación inmediata de eventos Realtime DELETE a Dexie y Tombstones.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generarCodigoCorrelativoSeguro } from '../../utils/entityNormalizer';
import {
  sanitizarSubtareaInbound,
  sanitizarActividadPayload,
  sanitizarTareaPayload,
  sanitizarNotaPayload
} from '../syncPayloadSanitizer';
import { syncManager } from '../syncManager';
import { db } from '../../db/db';

describe('REQ-SYNC-41-EXEC: Blindaje Multi-Dispositivo en Tiempo Real', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Anti-Colisión de Correlativos (generarCodigoCorrelativoSeguro)', () => {
    it('calcula MAX + 1 sobre una colección con huecos numéricos tras borrados', async () => {
      const mockTable = {
        toArray: vi.fn().mockResolvedValue([
          { codigo_legado: 'TAR-001' },
          { codigo_legado: 'TAR-003' } // TAR-002 fue borrado
        ])
      };

      const codigo = await generarCodigoCorrelativoSeguro(mockTable, 'TAR', 3);
      // Con count + 1 habría generado TAR-003 (colisión!). Con MAX + 1 genera TAR-004.
      expect(codigo).toBe('TAR-004');
    });

    it('soporta padding configurable y prefijos alternativos (ACT, NOT, PRJ)', async () => {
      const mockTable = {
        toArray: vi.fn().mockResolvedValue([
          { codigo_legado: 'ACT-009' },
          { codigo_legado: 'ACT-015' }
        ])
      };

      const codigo = await generarCodigoCorrelativoSeguro(mockTable, 'ACT', 3);
      expect(codigo).toBe('ACT-016');
    });

    it('genera el primer correlativo si la tabla está vacía', async () => {
      const mockTable = {
        toArray: vi.fn().mockResolvedValue([])
      };

      const codigo = await generarCodigoCorrelativoSeguro(mockTable, 'TAR', 3);
      expect(codigo).toBe('TAR-001');
    });

    it('tolera fallos en toArray usando fallback count', async () => {
      const mockTable = {
        toArray: vi.fn().mockRejectedValue(new Error('IndexedDB closed')),
        count: vi.fn().mockResolvedValue(5)
      };

      const codigo = await generarCodigoCorrelativoSeguro(mockTable, 'TAR', 3);
      expect(codigo).toBe('TAR-006');
    });
  });

  describe('2. Resolución Inbound de Subtareas UUID -> Código Canónico', () => {
    it('resuelve tarea_id UUID remoto a código legible TAR-XXX usando mapa en memoria', () => {
      const tareaUuidToCod = new Map<string, string>([
        ['550e8400-e29b-41d4-a716-446655440001', 'TAR-001']
      ]);

      const remoto = {
        id: 'sub-uuid-1',
        tarea_id: '550e8400-e29b-41d4-a716-446655440001',
        numero_paso: 1,
        descripcion_paso: 'Paso 1 de desarrollo',
        completado: true
      };

      const res = sanitizarSubtareaInbound(remoto, undefined, tareaUuidToCod);
      expect(res.tipo_padre).toBe('TAREA');
      expect(res.id_padre_vinculado).toBe('TAR-001');
      expect(res.completado).toBe(true);
    });

    it('resuelve actividad_id UUID remoto a código legible ACT-XXX usando mapa en memoria', () => {
      const actividadUuidToCod = new Map<string, string>([
        ['550e8400-e29b-41d4-a716-446655440002', 'ACT-005']
      ]);

      const remoto = {
        id: 'sub-uuid-2',
        actividad_id: '550e8400-e29b-41d4-a716-446655440002',
        numero_paso: 2,
        descripcion_paso: 'Estirar 10 min',
        completado: false
      };

      const res = sanitizarSubtareaInbound(remoto, undefined, undefined, actividadUuidToCod);
      expect(res.tipo_padre).toBe('ACTIVIDAD');
      expect(res.id_padre_vinculado).toBe('ACT-005');
      expect(res.completado).toBe(false);
    });

    it('mantiene id_padre_vinculado de localPrevio si no existe en el mapa', () => {
      const localPrevio = {
        id: 'sub-uuid-3',
        id_padre_vinculado: 'TAR-010',
        tipo_padre: 'TAREA' as const
      };

      const remoto = {
        id: 'sub-uuid-3',
        tarea_id: 'unknown-uuid',
        descripcion_paso: 'Paso actualizado'
      };

      const res = sanitizarSubtareaInbound(remoto, localPrevio);
      expect(res.id_padre_vinculado).toBe('TAR-010');
    });
  });

  describe('3. Paridad de Esquemas en Payloads Outbound', () => {
    it('sanitizarActividadPayload envía recurrencias, notas, presupuesto y version', () => {
      const act = {
        id: '550e8400-e29b-41d4-a716-446655440099',
        codigo_legado: 'ACT-001',
        nombre_actividad: 'Lectura Diaria',
        frecuencia_ciclo: 'DIARIA' as const,
        regla_repeticion: 'FREQ=DAILY;INTERVAL=1',
        fecha_fin: '2026-12-31',
        excepciones_fechas: ['2026-11-20'],
        ultima_fecha_completado: '2026-11-12',
        historial_fechas: ['2026-11-10', '2026-11-11'],
        notas_checklist: 'Capítulo 3',
        monto_gasto_asociado: 25.5,
        version: 2
      };

      const payload = sanitizarActividadPayload(act as any);
      expect(payload.frecuencia_ciclo).toBe('DIARIA');
      expect(payload.regla_repeticion).toBe('FREQ=DAILY;INTERVAL=1');
      expect(payload.fecha_fin).toBe('2026-12-31');
      expect(payload.excepciones_fechas).toEqual(['2026-11-20']);
      expect(payload.ultima_fecha_completado).toBe('2026-11-12');
      expect(payload.historial_fechas).toEqual(['2026-11-10', '2026-11-11']);
      expect(payload.notas_checklist).toBe('Capítulo 3');
      expect(payload.monto_gasto_asociado).toBe(25.5);
      expect(payload.version).toBe(2);
    });

    it('sanitizarTareaPayload envía es_mav, costo_real_pen, archivado, hora_inicio y version', () => {
      const tarea = {
        id: '550e8400-e29b-41d4-a716-446655440088',
        codigo_legado: 'TAR-050',
        nombre_tarea_actividad: 'Revisión Arquitectura',
        es_mav: true,
        costo_real_pen: 120.5,
        archivado: false,
        hora_inicio: '10:00',
        version: 3
      };

      const payload = sanitizarTareaPayload(tarea as any, new Map(), new Map());
      expect(payload.es_mav).toBe(true);
      expect(payload.costo_real_pen).toBe(120.5);
      expect(payload.archivado).toBe(false);
      expect(payload.hora_inicio).toBe('10:00');
      expect(payload.version).toBe(3);
    });

    it('sanitizarNotaPayload envía tipo_nota, block_nombre y version', () => {
      const nota = {
        id: '550e8400-e29b-41d4-a716-446655440077',
        codigo_legado: 'NOT-005',
        titulo: 'Ideas Proyecto',
        tipo_nota: 'PROYECTO',
        block_nombre: 'Ideas 2026',
        version: 4
      };

      const payload = sanitizarNotaPayload(nota as any);
      expect(payload.tipo_nota).toBe('PROYECTO');
      expect(payload.block_nombre).toBe('Ideas 2026');
      expect(payload.version).toBe(4);
    });
  });

  describe('4. Propagación Inmediata de Realtime DELETE hacia Dexie', () => {
    it('elimina físicamente el registro de Dexie y registra tombstone al recibir evento DELETE', async () => {
      const deleteSpy = vi.fn().mockResolvedValue(undefined);
      const tombstonePutSpy = vi.fn().mockResolvedValue(undefined);

      vi.spyOn(db.tareas, 'delete').mockImplementation(deleteSpy);
      if (db.tombstones) {
        vi.spyOn(db.tombstones, 'put').mockImplementation(tombstonePutSpy);
      }

      const payload = {
        eventType: 'DELETE',
        table: 'tareas',
        old: { id: 'tar-deleted-remotely-123' }
      };

      syncManager.handleRealtimeChange('tareas', payload);

      expect(deleteSpy).toHaveBeenCalledWith('tar-deleted-remotely-123');
      if (db.tombstones) {
        expect(tombstonePutSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'tar-deleted-remotely-123',
            tabla_afectada: 'tareas',
            sync_status: 'synced'
          })
        );
      }
    });
  });
});

