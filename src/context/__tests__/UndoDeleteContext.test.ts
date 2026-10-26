import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UndoDeleteManager } from '../UndoDeleteContext';

describe('REQ-GLOBAL-SOFT-DELETE-UNDO-BUFFER-EXEC-57: UndoDeleteContext & UndoDeleteManager', () => {
  let manager: UndoDeleteManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new UndoDeleteManager();
  });

  afterEach(() => {
    manager.destroy();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('Paso 1: registra la entidad, la oculta reactivamente y genera el pending item en la lista', () => {
    const mockCommit = vi.fn().mockResolvedValue(undefined);
    const listener = vi.fn();
    manager.subscribe(listener);

    const pending = manager.programarEliminacion({
      tabla: 'tareas',
      id: 'TAR-001',
      etiqueta: 'Preparar balance Q3',
      tipo: 'TAREA',
      commit: mockCommit,
      duracionMs: 4000
    });

    expect(pending.key).toBe('tareas:TAR-001');
    expect(pending.etiqueta).toBe('Preparar balance Q3');
    expect(pending.tipo).toBe('TAREA');

    // Comprobar que está oculta de inmediato
    expect(manager.estaOculto('TAR-001')).toBe(true);
    expect(manager.estaOculto('TAR-002')).toBe(false);
    expect(manager.getHiddenIdsSet().has('TAR-001')).toBe(true);

    // Comprobar que aparece en la lista de pendientes para renderizar toast
    const list = manager.getPendingList();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('TAR-001');

    // Comprobar que se notificó a los suscriptores
    expect(listener).toHaveBeenCalled();

    // El commit NO debe haberse ejecutado aún
    expect(mockCommit).not.toHaveBeenCalled();
  });

  it('Paso 2: deshacer cancela el timeout, restaura visibilidad y remueve el item sin ejecutar commit', () => {
    const mockCommit = vi.fn().mockResolvedValue(undefined);
    const listener = vi.fn();

    manager.programarEliminacion({
      tabla: 'gastos',
      id: 'GAS-500',
      etiqueta: 'Servidor Cloud AWS',
      tipo: 'GASTO',
      commit: mockCommit,
      duracionMs: 4000
    });

    manager.subscribe(listener);

    expect(manager.estaOculto('GAS-500')).toBe(true);
    expect(manager.getPendingList().length).toBe(1);

    // Avanzar 2000ms (la mitad del tiempo)
    vi.advanceTimersByTime(2000);
    expect(mockCommit).not.toHaveBeenCalled();

    // El usuario pulsa Deshacer
    const res = manager.deshacer('gastos:GAS-500');
    expect(res).toBe(true);

    // Debe restaurarse de inmediato la visibilidad
    expect(manager.estaOculto('GAS-500')).toBe(false);
    expect(manager.getHiddenIdsSet().has('GAS-500')).toBe(false);
    expect(manager.getPendingList().length).toBe(0);

    // Avanzar otros 3000ms (completando 5000ms totales)
    vi.advanceTimersByTime(3000);

    // El commit NUNCA debe ejecutarse
    expect(mockCommit).not.toHaveBeenCalled();
  });

  it('Paso 3: tras expirar los 4000ms ejecuta el commit atómico y limpia el búfer', async () => {
    const mockCommit = vi.fn().mockResolvedValue(undefined);

    manager.programarEliminacion({
      tabla: 'proyectos',
      id: 'PRO-100',
      etiqueta: 'Portal Web 2.0',
      tipo: 'PROYECTO',
      commit: mockCommit,
      duracionMs: 4000
    });

    expect(manager.getPendingList().length).toBe(1);
    expect(mockCommit).not.toHaveBeenCalled();

    // Avanzar 3999ms
    vi.advanceTimersByTime(3999);
    expect(mockCommit).not.toHaveBeenCalled();

    // Completar los 4000ms
    vi.advanceTimersByTime(1);
    await vi.runAllTimersAsync();

    // El commit debe haberse ejecutado exactamente una vez
    expect(mockCommit).toHaveBeenCalledTimes(1);

    // Debe haberse removido de pendingList
    expect(manager.getPendingList().length).toBe(0);
    expect(manager.estaOculto('PRO-100')).toBe(false);
  });

  it('Paso 4: flushTodos ejecuta inmediatamente todos los commits pendientes', async () => {
    const mockCommit1 = vi.fn().mockResolvedValue(undefined);
    const mockCommit2 = vi.fn().mockResolvedValue(undefined);

    manager.programarEliminacion({
      tabla: 'tareas',
      id: 'TAR-1',
      etiqueta: 'Tarea 1',
      tipo: 'TAREA',
      commit: mockCommit1
    });

    manager.programarEliminacion({
      tabla: 'ingresos',
      id: 'ING-1',
      etiqueta: 'Ingreso 1',
      tipo: 'INGRESO',
      commit: mockCommit2
    });

    expect(manager.getPendingList().length).toBe(2);

    await manager.flushTodos();

    expect(mockCommit1).toHaveBeenCalledTimes(1);
    expect(mockCommit2).toHaveBeenCalledTimes(1);
    expect(manager.getPendingList().length).toBe(0);
    expect(manager.estaOculto('TAR-1')).toBe(false);
    expect(manager.estaOculto('ING-1')).toBe(false);
  });

  it('Paso 5: soporta apilar múltiples eliminaciones concurrentes manteniendo aislamiento de timers', () => {
    const commit1 = vi.fn().mockResolvedValue(undefined);
    const commit2 = vi.fn().mockResolvedValue(undefined);

    manager.programarEliminacion({
      tabla: 'tareas',
      id: 'T-1',
      etiqueta: 'Tarea A',
      tipo: 'TAREA',
      commit: commit1,
      duracionMs: 4000
    });

    vi.advanceTimersByTime(1000);

    manager.programarEliminacion({
      tabla: 'hitos_wbs',
      id: 'H-1',
      etiqueta: 'Hito B',
      tipo: 'HITO',
      commit: commit2,
      duracionMs: 4000
    });

    expect(manager.getPendingList().length).toBe(2);
    expect(manager.estaOculto('T-1')).toBe(true);
    expect(manager.estaOculto('H-1')).toBe(true);

    // Avanzar 3000ms: T-1 (4000ms) expira, pero H-1 sólo lleva 3000ms
    vi.advanceTimersByTime(3000);

    expect(commit1).toHaveBeenCalledTimes(1);
    expect(commit2).not.toHaveBeenCalled();

    // Solo H-1 queda pendiente
    const list = manager.getPendingList();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('H-1');
  });

  it('Paso 6: soporta idsSecundarios para ocultar simultáneamente identificadores alternativos y código legado', () => {
    const mockCommit = vi.fn().mockResolvedValue(undefined);

    manager.programarEliminacion({
      tabla: 'proyectos',
      id: 'uuid-proy-123',
      idsSecundarios: ['PRO-001', 'pro-001'],
      etiqueta: 'Proyecto Alfa',
      tipo: 'PROYECTO',
      commit: mockCommit,
      duracionMs: 4000
    });

    expect(manager.estaOculto('uuid-proy-123')).toBe(true);
    expect(manager.estaOculto('PRO-001')).toBe(true);
    expect(manager.estaOculto('pro-001')).toBe(true);
    expect(manager.getHiddenIdsSet().has('uuid-proy-123')).toBe(true);
    expect(manager.getHiddenIdsSet().has('PRO-001')).toBe(true);

    // Al deshacer, se restauran tanto el ID principal como los secundarios
    manager.deshacer('proyectos:uuid-proy-123');
    expect(manager.estaOculto('uuid-proy-123')).toBe(false);
    expect(manager.estaOculto('PRO-001')).toBe(false);
    expect(manager.getHiddenIdsSet().has('PRO-001')).toBe(false);
  });
});
