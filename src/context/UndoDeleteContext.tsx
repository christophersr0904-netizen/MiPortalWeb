import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';

export type TipoEntidadUndo =
  | 'PROYECTO'
  | 'HITO'
  | 'TAREA'
  | 'SUBTAREA'
  | 'GASTO'
  | 'INGRESO'
  | 'ACTIVIDAD'
  | 'META'
  | 'NOTA';

export interface PendingDelete {
  key: string; // `${tabla}:${id}`
  tabla: string;
  id: string;
  etiqueta: string;
  tipo: TipoEntidadUndo;
  commit: () => Promise<void>;
  timeoutId: number;
  tiempoRestanteMs: number;
  creadoEn: number;
  idsSecundarios?: string[];
}

export interface ProgramarEliminacionParams {
  tabla: string;
  id: string;
  etiqueta: string;
  tipo: TipoEntidadUndo;
  commit: () => Promise<void>;
  duracionMs?: number;
  idsSecundarios?: string[];
}

export interface UndoDeleteContextType {
  pendingList: PendingDelete[];
  hiddenIdsSet: Set<string>;
  programarEliminacion: (params: ProgramarEliminacionParams) => void;
  deshacer: (key: string) => void;
  estaOculto: (id: string | undefined | null) => boolean;
  flushTodos: () => Promise<void>;
}

/**
 * Controlador de gestión del búfer temporal de eliminación diferida (4s).
 * Permite control seguro de timers, listeners reactivos y pruebas unitarias aisladas.
 */
export class UndoDeleteManager {
  private pendingMap = new Map<string, PendingDelete>();
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[UndoDeleteManager] Error en listener:', err);
      }
    });
  }

  getPendingList(): PendingDelete[] {
    return Array.from(this.pendingMap.values());
  }

  getHiddenIdsSet(): Set<string> {
    const set = new Set<string>();
    this.pendingMap.forEach((item) => {
      set.add(item.id);
      if (item.idsSecundarios) {
        item.idsSecundarios.forEach((secId) => {
          if (secId) set.add(secId);
        });
      }
    });
    return set;
  }

  estaOculto(id: string | undefined | null): boolean {
    if (!id) return false;
    const cleanId = String(id).trim().toUpperCase();
    for (const item of this.pendingMap.values()) {
      if (item.id === id || String(item.id).trim().toUpperCase() === cleanId) return true;
      if (item.idsSecundarios) {
        for (const sec of item.idsSecundarios) {
          if (sec === id || String(sec).trim().toUpperCase() === cleanId) return true;
        }
      }
    }
    return false;
  }

  programarEliminacion(params: ProgramarEliminacionParams): PendingDelete {
    const { tabla, id, etiqueta, tipo, commit, duracionMs = 4000, idsSecundarios } = params;
    const key = `${tabla}:${id}`;

    // Si ya existía un borrado pendiente para la misma clave, ejecutar inmediatamente su commit previo
    if (this.pendingMap.has(key)) {
      const previo = this.pendingMap.get(key)!;
      clearTimeout(previo.timeoutId);
      previo.commit().catch((err) => {
        console.error(`[UndoDeleteManager] Error ejecutando commit previo para ${key}:`, err);
      });
      this.pendingMap.delete(key);
    }

    const timeoutId = (setTimeout(async () => {
      this.pendingMap.delete(key);
      this.notify();

      try {
        await commit();
      } catch (err) {
        console.error(`[UndoDeleteManager] Error en commit diferido para ${key}:`, err);
      }
    }, duracionMs) as unknown) as number;

    const nuevoPending: PendingDelete = {
      key,
      tabla,
      id,
      etiqueta,
      tipo,
      commit,
      timeoutId,
      tiempoRestanteMs: duracionMs,
      creadoEn: Date.now(),
      idsSecundarios: idsSecundarios ? idsSecundarios.filter(Boolean) : []
    };

    this.pendingMap.set(key, nuevoPending);
    this.notify();
    return nuevoPending;
  }

  deshacer(key: string): boolean {
    const item = this.pendingMap.get(key);
    if (!item) return false;

    clearTimeout(item.timeoutId);
    this.pendingMap.delete(key);
    this.notify();
    return true;
  }

  async flushTodos(): Promise<void> {
    const pendientes = Array.from(this.pendingMap.values());
    this.pendingMap.clear();
    this.notify();

    for (const item of pendientes) {
      clearTimeout(item.timeoutId);
      try {
        await item.commit();
      } catch (err) {
        console.error(`[UndoDeleteManager] Error en flushTodos para ${item.key}:`, err);
      }
    }
  }

  destroy() {
    this.pendingMap.forEach((item) => clearTimeout(item.timeoutId));
    this.pendingMap.clear();
    this.listeners.clear();
  }
}

export const UndoDeleteContext = createContext<UndoDeleteContextType | null>(null);

export const UndoDeleteProvider: React.FC<{
  children: React.ReactNode;
  manager?: UndoDeleteManager;
}> = ({ children, manager: customManager }) => {
  const managerRef = useRef<UndoDeleteManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = customManager || new UndoDeleteManager();
  }
  const manager = managerRef.current;

  // Reactividad sincronizada con el gestor
  const [, setTick] = useState(0);
  useEffect(() => {
    return manager.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, [manager]);

  const pendingList = manager.getPendingList();
  const hiddenIdsSet = manager.getHiddenIdsSet();

  const programarEliminacion = useCallback(
    (params: ProgramarEliminacionParams) => {
      manager.programarEliminacion(params);
    },
    [manager]
  );

  const deshacer = useCallback(
    (key: string) => {
      manager.deshacer(key);
    },
    [manager]
  );

  const estaOculto = useCallback(
    (id: string | undefined | null) => {
      return manager.estaOculto(id);
    },
    [manager]
  );

  const flushTodos = useCallback(async () => {
    await manager.flushTodos();
  }, [manager]);

  // Flush automático en beforeunload para garantizar integridad de datos al cerrar o recargar la pestaña
  useEffect(() => {
    const handleBeforeUnload = () => {
      manager.flushTodos().catch((err) => {
        console.error('[UndoDeleteProvider] Error en beforeunload flush:', err);
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [manager]);

  return (
    <UndoDeleteContext.Provider
      value={{
        pendingList,
        hiddenIdsSet,
        programarEliminacion,
        deshacer,
        estaOculto,
        flushTodos
      }}
    >
      {children}
    </UndoDeleteContext.Provider>
  );
};
