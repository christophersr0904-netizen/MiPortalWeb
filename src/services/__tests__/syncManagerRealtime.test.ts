import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncManager } from '../syncManager';

describe('REQ-SYS-010-REALTIME: Supabase Realtime, Filtro Anti-Eco y Debounce', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (syncManager as any).tablasPendientesRealtime.clear();
    (syncManager as any).recentlyPushedIds.clear();
  });

  afterEach(() => {
    (syncManager as any).destroyRealtimeSubscriptions();
    vi.restoreAllMocks();
  });

  describe('1. Caché Anti-Eco (TTL 10 segundos)', () => {
    it('reconoce IDs empujados localmente dentro de la ventana de 10s y los marca como eco', () => {
      syncManager.registrarPushedId('PRO-LOCAL-01', 10000);

      expect(syncManager.esEcoLocal('PRO-LOCAL-01')).toBe(true);
      expect(syncManager.esEcoLocal('PRO-REMOTO-99')).toBe(false);
      expect(syncManager.esEcoLocal(null)).toBe(false);
      expect(syncManager.esEcoLocal(undefined)).toBe(false);
    });

    it('expira los IDs anti-eco una vez superado el umbral TTL', () => {
      const ahora = Date.now();
      // Registrar un ID con timestamp en el pasado
      (syncManager as any).recentlyPushedIds.set('TAR-EXPIRED', ahora - 500);

      expect(syncManager.esEcoLocal('TAR-EXPIRED')).toBe(false);
      // Debe haberse purgado del Map
      expect((syncManager as any).recentlyPushedIds.has('TAR-EXPIRED')).toBe(false);
    });
  });

  describe('2. Manejo de Eventos Realtime y Debounce (handleRealtimeChange)', () => {
    it('ignora silenciosamente eventos entrantes de registros empujados por el mismo cliente (Anti-Eco)', () => {
      vi.useFakeTimers();
      syncManager.registrarPushedId('TAR-ECO-123', 10000);

      const pullSpy = vi.spyOn(syncManager, 'descargarDatosSelectivos').mockResolvedValue({ descargados: 0, fallidos: 0 });

      syncManager.handleRealtimeChange('tareas', {
        eventType: 'UPDATE',
        table: 'tareas',
        new: { id: 'TAR-ECO-123', nombre_tarea_actividad: 'Cambio Propio' }
      });

      // Avanzar timers más allá del debounce
      vi.advanceTimersByTime(1000);

      expect(pullSpy).not.toHaveBeenCalled();
      expect((syncManager as any).tablasPendientesRealtime.size).toBe(0);

      vi.useRealTimers();
    });

    it('agrupa múltiples eventos remotos concurrentes y ejecuta un único pull selectivo tras 800ms (Trailing-Edge Debounce)', async () => {
      vi.useFakeTimers();
      const pullSpy = vi.spyOn(syncManager, 'descargarDatosSelectivos').mockResolvedValue({ descargados: 2, fallidos: 0 });

      // Disparar 3 eventos rápidos de tareas y gastos
      syncManager.handleRealtimeChange('tareas', {
        eventType: 'UPDATE',
        table: 'tareas',
        new: { id: 'TAR-REMOTO-1' }
      });

      vi.advanceTimersByTime(300);

      syncManager.handleRealtimeChange('tareas', {
        eventType: 'INSERT',
        table: 'tareas',
        new: { id: 'TAR-REMOTO-2' }
      });

      vi.advanceTimersByTime(200);

      syncManager.handleRealtimeChange('gastos', {
        eventType: 'INSERT',
        table: 'gastos',
        new: { id: 'GAS-REMOTO-1' }
      });

      // Todavía no debe haberse ejecutado el pull (solo han pasado 500ms desde el primer evento)
      expect(pullSpy).not.toHaveBeenCalled();

      // Completar los 800ms de inactividad
      vi.advanceTimersByTime(800);
      await Promise.resolve();

      expect(pullSpy).toHaveBeenCalledTimes(1);
      expect(pullSpy).toHaveBeenCalledWith(expect.arrayContaining(['tareas', 'gastos']));

      vi.useRealTimers();
    });

    it('REQ-SYNC-PROD-11-FIX: inyecta inmediatamente en Dexie ante eventos INSERT/UPDATE (Zero-Delay) antes del debounce', async () => {
      const dbPutSpy = vi.fn().mockResolvedValue('NOT-REMOTO-999');
      (syncManager as any).supabase = { from: vi.fn() };

      const { db } = await import('../../db/db');
      const realPut = db.notas.put;
      (db.notas as any).put = dbPutSpy;

      try {
        syncManager.handleRealtimeChange('notas', {
          eventType: 'INSERT',
          table: 'notas',
          new: {
            id: 'NOT-REMOTO-999',
            titulo: 'Nota Inmediata WebSocket',
            contenido_markdown: 'Cero Latencia',
            block_nombre: 'General'
          }
        });

        // La inyección en Dexie debe haberse ejecutado inmediatamente (0ms)
        expect(dbPutSpy).toHaveBeenCalledTimes(1);
        expect(dbPutSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'NOT-REMOTO-999',
            titulo: 'Nota Inmediata WebSocket',
            sync_status: 'synced'
          })
        );
      } finally {
        (db.notas as any).put = realPut;
      }
    });

    it('REQ-SYNC-PROD-11-FIX: inyecta inmediatamente configuracion_usuario ante eventos UPDATE', async () => {
      const { db } = await import('../../db/db');
      const dbPutSpy = vi.fn().mockResolvedValue('pmo_notas_cuadernos_meta');
      const realPut = db.configuracion_usuario.put;
      (db.configuracion_usuario as any).put = dbPutSpy;

      try {
        syncManager.handleRealtimeChange('configuracion_usuario', {
          eventType: 'UPDATE',
          table: 'configuracion_usuario',
          new: {
            id: 'pmo_notas_cuadernos_meta',
            valor: { 'Nuevo Cuaderno': { nombre: 'Nuevo Cuaderno', color: 'blue' } },
            updated_at: '2026-11-17T15:00:00.000Z'
          }
        });

        expect(dbPutSpy).toHaveBeenCalledTimes(1);
        expect(dbPutSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'pmo_notas_cuadernos_meta',
            codigo_legado: 'pmo_notas_cuadernos_meta',
            valor: { 'Nuevo Cuaderno': { nombre: 'Nuevo Cuaderno', color: 'blue' } },
            sync_status: 'synced'
          })
        );
      } finally {
        (db.configuracion_usuario as any).put = realPut;
      }
    });

    it('REQ-SYNC-PROD-14-FIX: bypass absoluto de auth retorna síncronamente el UUID dummy sin invocar getSession', async () => {
      const getSessionMock = vi.fn().mockResolvedValue({
        data: { session: { user: { id: '00000000-0000-0000-0000-000000000001' } } }
      });
      (syncManager as any).supabase = {
        auth: { getSession: getSessionMock }
      };

      const userId = await syncManager.resolverUsuarioActivo();
      expect(userId).toBe('00000000-0000-0000-0000-000000000001');
      expect((syncManager as any).currentUserUUID).toBe('00000000-0000-0000-0000-000000000001');
      expect((syncManager as any).authResuelto).toBe(true);
      // Cero llamadas de red a Supabase Auth
      expect(getSessionMock).not.toHaveBeenCalled();
    });

    it('REQ-SYNC-PROD-14-FIX: sincronizarMetasPlanes ejecuta upsert incondicionalmente con UUID dummy sin omitir por auth', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      const fromMock = vi.fn().mockReturnValue({
        upsert: upsertMock
      });
      (syncManager as any).supabase = { from: fromMock };
      (syncManager as any).currentUserId = '00000000-0000-0000-0000-000000000001';

      const { db } = await import('../../db/db');
      vi.spyOn(syncManager as any, 'obtenerRegistrosPendientes').mockResolvedValue([
        { id: 'meta-uuid-1', codigo_legado: 'MET-001', titulo: 'Meta Test', sync_status: 'pending' }
      ]);
      vi.spyOn(db.metas_planes, 'update').mockResolvedValue(1);

      const res = await syncManager.sincronizarMetasPlanes();
      expect(res.success).toBe(1);
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          codigo_legado: 'MET-001',
          user_id: '00000000-0000-0000-0000-000000000001'
        }),
        expect.anything()
      );
    });
  });

  describe('3. Telemetría de Conexión Realtime (handleRealtimeStatusChange)', () => {
    it('degrada el estado visual a reconnecting ante CHANNEL_ERROR, CLOSED o TIMED_OUT', () => {
      (syncManager as any).isSyncing = false;
      const stateListener = vi.fn();
      const unsubscribe = syncManager.subscribe(stateListener);

      syncManager.handleRealtimeStatusChange('CHANNEL_ERROR');
      expect(syncManager.getStatus()).toBe('reconnecting');

      syncManager.handleRealtimeStatusChange('CLOSED');
      expect(syncManager.getStatus()).toBe('reconnecting');

      syncManager.handleRealtimeStatusChange('TIMED_OUT');
      expect(syncManager.getStatus()).toBe('reconnecting');

      unsubscribe();
    });

    it('restaura el estado a synced al conectarse satisfactoriamente (SUBSCRIBED)', () => {
      (syncManager as any).syncState = 'reconnecting';

      syncManager.handleRealtimeStatusChange('SUBSCRIBED');
      expect(syncManager.getStatus()).toBe('synced');
    });
  });

  describe('4. Suscripción y Canales (setupRealtimeSubscriptions)', () => {
    it('crea el canal pmo-realtime-channel y suscribe listeners postgres_changes en las 5 tablas clave', () => {
      const onMock = vi.fn().mockReturnThis();
      const subscribeMock = vi.fn().mockImplementation((cb: (s: string) => void) => {
        cb('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      });
      const channelMock = vi.fn().mockReturnValue({
        on: onMock,
        subscribe: subscribeMock
      });

      (syncManager as any).supabase = {
        channel: channelMock
      };

      syncManager.setupRealtimeSubscriptions();

      expect(channelMock).toHaveBeenCalledWith('pmo-realtime-channel');
      // REQ-SYNC-41-EXEC / REQ-SYNC-PROD-07-FIX: Debe suscribirse a las 13 tablas operativas en Realtime (incluyendo configuracion_usuario)
      expect(onMock).toHaveBeenCalledTimes(13);
      expect(onMock).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ table: 'tareas' }),
        expect.any(Function)
      );
      expect(onMock).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ table: 'proyectos' }),
        expect.any(Function)
      );
      expect(onMock).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ table: 'configuracion_usuario' }),
        expect.any(Function)
      );
      expect(subscribeMock).toHaveBeenCalled();
      expect(syncManager.getStatus()).toBe('synced');
    });
  });

  describe('5. Reconexión Móvil Proactiva (reconectarRealtimeSiEsNecesario)', () => {
    it('reconecta el canal si realtimeChannel es nulo o su estado no es joined', () => {
      const destroySpy = vi.spyOn(syncManager, 'destroyRealtimeSubscriptions');
      const setupSpy = vi.spyOn(syncManager, 'setupRealtimeSubscriptions');

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        state: 'closed'
      };
      (syncManager as any).supabase = { channel: vi.fn().mockReturnValue(mockChannel) };
      (syncManager as any).realtimeChannel = mockChannel;

      syncManager.reconectarRealtimeSiEsNecesario();

      expect(destroySpy).toHaveBeenCalledTimes(1);
      expect(setupSpy).toHaveBeenCalledTimes(1);
    });

    it('no reconecta innecesariamente si el canal ya se encuentra en estado joined', () => {
      const destroySpy = vi.spyOn(syncManager, 'destroyRealtimeSubscriptions');
      const setupSpy = vi.spyOn(syncManager, 'setupRealtimeSubscriptions');

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        state: 'joined'
      };
      (syncManager as any).supabase = { channel: vi.fn().mockReturnValue(mockChannel) };
      (syncManager as any).realtimeChannel = mockChannel;

      syncManager.reconectarRealtimeSiEsNecesario();

      expect(destroySpy).not.toHaveBeenCalled();
      expect(setupSpy).not.toHaveBeenCalled();
    });
  });
});

