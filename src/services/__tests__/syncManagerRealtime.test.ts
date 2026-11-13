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
      // REQ-SYNC-41-EXEC: Debe suscribirse a las 12 tablas operativas en Realtime
      expect(onMock).toHaveBeenCalledTimes(12);
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

