import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db, purgarRegistrosLocalesExpirados, registrarTombstone } from '../../db/db';
import { syncManager } from '../syncManager';
import { UndoDeleteManager } from '../../context/UndoDeleteContext';
import type { TareaRecord, GastoRecord, TombstoneRecord } from '../../types';

describe('REQ-SYS-009: Data Lifecycle, Tombstones y Garbage Collection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Captura de Eliminación a Lápida (Tombstones en Dexie)', () => {
    it('UndoDeleteManager registra la lápida en db.tombstones al expirar el tiempo de gracia', async () => {
      vi.useFakeTimers();
      const manager = new UndoDeleteManager();
      const mockCommit = vi.fn().mockResolvedValue(undefined);
      const putSpy = vi.spyOn(db.tombstones, 'put').mockResolvedValue('tar-del-01' as any);

      manager.programarEliminacion({
        tabla: 'tareas',
        id: 'tar-del-01',
        etiqueta: 'Tarea Eliminada',
        tipo: 'TAREA',
        commit: mockCommit,
        duracionMs: 4000
      });

      expect(putSpy).not.toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();

      // Avanzar el timer para gatillar commit
      vi.advanceTimersByTime(4000);
      await Promise.resolve();

      expect(putSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tar-del-01',
          tabla: 'tareas',
          sync_status: 'pending'
        })
      );
      expect(mockCommit).toHaveBeenCalled();

      manager.destroy();
      vi.useRealTimers();
    });

    it('registrarTombstone guarda la lápida con sync_status pending de manera idempotente', async () => {
      const putSpy = vi.spyOn(db.tombstones, 'put').mockResolvedValue('gas-999' as any);
      await registrarTombstone('gastos', 'gas-999');

      expect(putSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'gas-999',
          tabla: 'gastos',
          sync_status: 'pending'
        })
      );
    });
  });

  describe('2. Push de Tombstones a Supabase (sincronizarTombstones)', () => {
    it('despacha eliminación remota .delete().eq("id", tombstone.id) y marca synced', async () => {
      const mockTombstones: TombstoneRecord[] = [
        {
          id: 'tar-rem-01',
          tabla: 'tareas',
          deleted_at: new Date().toISOString(),
          sync_status: 'pending'
        }
      ];

      vi.spyOn(syncManager, 'obtenerRegistrosPendientes').mockResolvedValue(mockTombstones as any);
      const updateSpy = vi.spyOn(db.tombstones, 'update').mockResolvedValue(1);

      const deleteEqSpy = vi.fn().mockResolvedValue({ error: null });
      const deleteSpy = vi.fn().mockReturnValue({ eq: deleteEqSpy });
      const fromSpy = vi.fn().mockReturnValue({ delete: deleteSpy });

      (syncManager as any).supabase = { from: fromSpy };

      const res = await syncManager.sincronizarTombstones();

      expect(res.success).toBe(1);
      expect(res.failed).toBe(0);
      expect(fromSpy).toHaveBeenCalledWith('tareas');
      expect(deleteSpy).toHaveBeenCalled();
      expect(deleteEqSpy).toHaveBeenCalledWith('id', 'tar-rem-01');
      expect(updateSpy).toHaveBeenCalledWith('tar-rem-01', { sync_status: 'synced' });
    });

    it('aísla fallos en Supabase marcando sync_status error para reintento con backoff', async () => {
      const mockTombstones: TombstoneRecord[] = [
        {
          id: 'tar-fail-01',
          tabla: 'tareas',
          deleted_at: new Date().toISOString(),
          sync_status: 'pending'
        }
      ];

      vi.spyOn(syncManager, 'obtenerRegistrosPendientes').mockResolvedValue(mockTombstones as any);
      const updateSpy = vi.spyOn(db.tombstones, 'update').mockResolvedValue(1);

      const deleteEqSpy = vi.fn().mockResolvedValue({ error: { message: 'Network Timeout' } });
      const deleteSpy = vi.fn().mockReturnValue({ eq: deleteEqSpy });
      const fromSpy = vi.fn().mockReturnValue({ delete: deleteSpy });

      (syncManager as any).supabase = { from: fromSpy };

      const res = await syncManager.sincronizarTombstones();

      expect(res.success).toBe(0);
      expect(res.failed).toBe(1);
      expect(updateSpy).toHaveBeenCalledWith('tar-fail-01', { sync_status: 'error' });
    });
  });

  describe('3. Pull Acotado y Filtrado Anti-Resurrección (descargarDatosDescendientes)', () => {
    it('ignora registros remotos que coincidan con IDs de tombstones locales', async () => {
      // Configurar tombstone local para 'tar-deleted-01'
      vi.spyOn(db.tombstones, 'toArray').mockResolvedValue([
        {
          id: 'tar-deleted-01',
          tabla: 'tareas',
          deleted_at: new Date().toISOString(),
          sync_status: 'synced'
        }
      ] as any);

      const mockRemoteTasks = [
        { id: 'tar-deleted-01', nombre_tarea_actividad: 'Tarea que no debe resucitar' },
        { id: 'tar-active-02', nombre_tarea_actividad: 'Tarea Activa' }
      ];

      const fromSpy = vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockResolvedValue({
          data: table === 'tareas' ? mockRemoteTasks : [],
          error: null
        })
      }));
      (syncManager as any).supabase = { from: fromSpy };

      vi.spyOn(db.tareas, 'where').mockReturnValue({
        equals: () => ({ primaryKeys: async () => [] })
      } as any);

      const bulkPutSpy = vi.spyOn(db.tareas, 'bulkPut').mockResolvedValue('tar-active-02' as any);

      const res = await syncManager.descargarDatosDescendientes();

      expect(res.descargados).toBe(1);
      // Se debe haber insertado SOLO la activa, omitiendo la eliminada por la lápida
      expect(bulkPutSpy).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'tar-active-02', sync_status: 'synced' })
      ]);
    });

    it('aplica filtro temporal .gte("created_at", ...) para tablas de alto volumen (gastos/ingresos)', async () => {
      vi.spyOn(db.tombstones, 'toArray').mockResolvedValue([]);

      const gteSpy = vi.fn().mockResolvedValue({ data: [], error: null });
      const selectSpy = vi.fn().mockReturnValue({ gte: gteSpy });
      const fromSpy = vi.fn().mockReturnValue({ select: selectSpy });

      (syncManager as any).supabase = { from: fromSpy };

      await syncManager.descargarDatosDescendientes(['gastos', 'ingresos']);

      expect(fromSpy).toHaveBeenCalledWith('gastos');
      expect(fromSpy).toHaveBeenCalledWith('ingresos');
      expect(gteSpy).toHaveBeenCalledWith('created_at', expect.any(String));
    });
  });

  describe('4. Garbage Collection Local (purgarRegistrosLocalesExpirados)', () => {
    it('elimina registros completados y sincronizados más antiguos que el umbral de retención (90 días)', async () => {
      const ahora = Date.now();
      const hace100Dias = new Date(ahora - 100 * 24 * 60 * 60 * 1000).toISOString();
      const hace10Dias = new Date(ahora - 10 * 24 * 60 * 60 * 1000).toISOString();

      const mockTareas: Partial<TareaRecord>[] = [
        {
          id: 'tar-old-synced',
          estado_tarea: '04_Completado',
          sync_status: 'synced',
          updated_at: hace100Dias
        },
        {
          id: 'tar-recent-synced',
          estado_tarea: '04_Completado',
          sync_status: 'synced',
          updated_at: hace10Dias
        },
        {
          id: 'tar-old-pending',
          estado_tarea: '04_Completado',
          sync_status: 'pending',
          updated_at: hace100Dias
        },
        {
          id: 'tar-in-progress',
          estado_tarea: '03_En_Proceso',
          sync_status: 'synced',
          updated_at: hace100Dias
        }
      ];

      const mockGastos: Partial<GastoRecord>[] = [
        {
          id: 'gas-old-synced',
          fecha_gasto: hace100Dias,
          sync_status: 'synced'
        },
        {
          id: 'gas-recent-synced',
          fecha_gasto: hace10Dias,
          sync_status: 'synced'
        }
      ];

      const mockTombstones: Partial<TombstoneRecord>[] = [
        {
          id: 'tomb-old-synced',
          deleted_at: hace100Dias,
          sync_status: 'synced'
        },
        {
          id: 'tomb-old-pending',
          deleted_at: hace100Dias,
          sync_status: 'pending'
        }
      ];

      vi.spyOn(db.tareas, 'toArray').mockResolvedValue(mockTareas as any);
      const tareasBulkDelete = vi.spyOn(db.tareas, 'bulkDelete').mockResolvedValue(undefined as any);

      vi.spyOn(db.gastos, 'toArray').mockResolvedValue(mockGastos as any);
      const gastosBulkDelete = vi.spyOn(db.gastos, 'bulkDelete').mockResolvedValue(undefined as any);

      vi.spyOn(db.ingresos, 'toArray').mockResolvedValue([] as any);
      vi.spyOn(db.cuotas, 'toArray').mockResolvedValue([] as any);

      vi.spyOn(db.tombstones, 'toArray').mockResolvedValue(mockTombstones as any);
      const tombstonesBulkDelete = vi.spyOn(db.tombstones, 'bulkDelete').mockResolvedValue(undefined as any);

      const purga = await purgarRegistrosLocalesExpirados(90);

      expect(purga.tareasPurgadas).toBe(1);
      expect(tareasBulkDelete).toHaveBeenCalledWith(['tar-old-synced']);

      expect(purga.transaccionesPurgadas).toBe(1);
      expect(gastosBulkDelete).toHaveBeenCalledWith(['gas-old-synced']);

      expect(purga.tombstonesPurgados).toBe(1);
      expect(tombstonesBulkDelete).toHaveBeenCalledWith(['tomb-old-synced']);

      expect(purga.totalPurgados).toBe(3);
    });
  });
});
