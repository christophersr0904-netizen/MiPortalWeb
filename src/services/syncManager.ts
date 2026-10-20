import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { db } from '../db/db';
import {
  DEFAULT_USER_ID,
  isUuid,
  sanitizarProyectoPayload,
  sanitizarHitoPayload,
  sanitizarTareaPayload,
  sanitizarNotaPayload,
  sanitizarActividadPayload,
  sanitizarSubtareaPayload
} from './syncPayloadSanitizer';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncResult {
  success: number;
  failed: number;
}

class SyncManager {
  private supabase: SupabaseClient | null = null;
  private isSyncing = false;
  private syncState: SyncState = 'synced';
  private listeners: Array<(state: SyncState) => void> = [];
  private currentUserId: string = DEFAULT_USER_ID;

  constructor() {
    this.initSupabaseClient();
    this.setupNetworkListeners();
  }

  public setUserId(userId: string) {
    if (isUuid(userId)) {
      this.currentUserId = userId;
    }
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  private initSupabaseClient() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

    try {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.warn('[SyncManager] Error al inicializar cliente Supabase:', err);
    }
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[SyncManager] Conexión restablecida. Disparando sincronización...');
      this.setSyncState('syncing');
      this.syncPendingRecords();
    });

    window.addEventListener('offline', () => {
      console.log('[SyncManager] Sin conexión. Modo offline activo.');
      this.setSyncState('offline');
    });

    // Sincronización periódica cada 45 segundos si hay conexión
    setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine && !this.isSyncing) {
        this.syncPendingRecords();
      }
    }, 45000);
  }

  public subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener);
    listener(this.syncState);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private setSyncState(newState: SyncState) {
    this.syncState = newState;
    this.listeners.forEach((l) => l(newState));
  }

  public getStatus(): SyncState {
    return this.syncState;
  }

  // ============================================================================
  // MÉTODOS MODULARES DE REPLICACIÓN (REQ-SYNC-02)
  // ============================================================================

  /**
   * Sincroniza proyectos pendientes aplicando sanitización e idempotencia con onConflict: codigo_legado
   */
  public async sincronizarProyectos(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await db.proyectos.where('sync_status').equals('pending').toArray();
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((p) => db.proyectos.update(p.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const proy of pending) {
      try {
        const payload = sanitizarProyectoPayload(proy, this.currentUserId);
        const { error } = await this.supabase
          .from('proyectos')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          console.error('[SyncManager] Error al sincronizar proyecto:', proy.codigo_legado, error);
          await db.proyectos.update(proy.id, { sync_status: 'error' });
          result.failed++;
        } else {
          await db.proyectos.update(proy.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err) {
        console.error('[SyncManager] Excepción al sincronizar proyecto:', proy.codigo_legado, err);
        await db.proyectos.update(proy.id, { sync_status: 'error' });
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Sincroniza hitos WBS pendientes resolviendo la FK de proyecto_id
   */
  public async sincronizarHitos(proyectoMap?: Map<string, string>): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await db.hitos_wbs.where('sync_status').equals('pending').toArray();
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((h) => db.hitos_wbs.update(h.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    const map = proyectoMap || (await this.construirMapaProyectos());

    for (const hito of pending) {
      try {
        const payload = sanitizarHitoPayload(hito, map, this.currentUserId);
        if (!payload.proyecto_id) {
          console.warn('[SyncManager] Hito sin proyecto_id UUID resuelto, omitiendo:', hito.codigo_legado);
          await db.hitos_wbs.update(hito.id, { sync_status: 'error' });
          result.failed++;
          continue;
        }

        const { error } = await this.supabase
          .from('hitos_wbs')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          console.error('[SyncManager] Error al sincronizar hito:', hito.codigo_legado, error);
          await db.hitos_wbs.update(hito.id, { sync_status: 'error' });
          result.failed++;
        } else {
          await db.hitos_wbs.update(hito.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err) {
        console.error('[SyncManager] Excepción al sincronizar hito:', hito.codigo_legado, err);
        await db.hitos_wbs.update(hito.id, { sync_status: 'error' });
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Sincroniza tareas WBS pendientes resolviendo FKs de proyecto_id e hito_id
   */
  public async sincronizarTareas(
    proyectoMap?: Map<string, string>,
    hitoMap?: Map<string, string>
  ): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await db.tareas.where('sync_status').equals('pending').toArray();
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((t) => db.tareas.update(t.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    const pMap = proyectoMap || (await this.construirMapaProyectos());
    const hMap = hitoMap || (await this.construirMapaHitos());

    for (const tarea of pending) {
      try {
        const payload = sanitizarTareaPayload(tarea, pMap, hMap, this.currentUserId);
        if (!payload.proyecto_id || !payload.hito_id) {
          console.warn('[SyncManager] Tarea sin proyecto_id o hito_id UUID resuelto:', tarea.codigo_legado);
          await db.tareas.update(tarea.id, { sync_status: 'error' });
          result.failed++;
          continue;
        }

        const { error } = await this.supabase
          .from('tareas')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          console.error('[SyncManager] Error al sincronizar tarea:', tarea.codigo_legado, error);
          await db.tareas.update(tarea.id, { sync_status: 'error' });
          result.failed++;
        } else {
          await db.tareas.update(tarea.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err) {
        console.error('[SyncManager] Excepción al sincronizar tarea:', tarea.codigo_legado, err);
        await db.tareas.update(tarea.id, { sync_status: 'error' });
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Sincroniza notas pendientes asegurando arrays/objetos JSONB sin campos virtuales
   */
  public async sincronizarNotas(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await db.notas.where('sync_status').equals('pending').toArray();
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((n) => db.notas.update(n.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const nota of pending) {
      try {
        const payload = sanitizarNotaPayload(nota, this.currentUserId);
        const { error } = await this.supabase
          .from('notas')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          console.error('[SyncManager] Error al sincronizar nota:', nota.codigo_legado, error);
          await db.notas.update(nota.id, { sync_status: 'error' });
          result.failed++;
        } else {
          await db.notas.update(nota.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err) {
        console.error('[SyncManager] Excepción al sincronizar nota:', nota.codigo_legado, err);
        await db.notas.update(nota.id, { sync_status: 'error' });
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Sincroniza actividades personales (hábitos y rutinas)
   */
  public async sincronizarActividades(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await db.actividades_personales.where('sync_status').equals('pending').toArray();
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((a) => db.actividades_personales.update(a.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const act of pending) {
      try {
        const payload = sanitizarActividadPayload(act, this.currentUserId);
        const { error } = await this.supabase
          .from('actividades_personales')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          console.error('[SyncManager] Error al sincronizar actividad:', act.codigo_legado, error);
          await db.actividades_personales.update(act.id, { sync_status: 'error' });
          result.failed++;
        } else {
          await db.actividades_personales.update(act.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err) {
        console.error('[SyncManager] Excepción al sincronizar actividad:', act.codigo_legado, err);
        await db.actividades_personales.update(act.id, { sync_status: 'error' });
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Sincroniza subtareas y pasos enlazando tarea_id o actividad_id
   */
  public async sincronizarSubtareas(
    tareaMap?: Map<string, string>,
    actividadMap?: Map<string, string>
  ): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await db.subtareas_pasos.where('sync_status').equals('pending').toArray();
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((s) => db.subtareas_pasos.update(s.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    const tMap = tareaMap || (await this.construirMapaTareas());
    const aMap = actividadMap || (await this.construirMapaActividades());

    for (const sub of pending) {
      try {
        const payload = sanitizarSubtareaPayload(sub, tMap, aMap, this.currentUserId);
        if (!payload.tarea_id && !payload.actividad_id) {
          console.warn('[SyncManager] Subtarea sin padre UUID resuelto:', sub.codigo_legado);
          await db.subtareas_pasos.update(sub.id, { sync_status: 'error' });
          result.failed++;
          continue;
        }

        const { error } = await this.supabase
          .from('subtareas_pasos')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          console.error('[SyncManager] Error al sincronizar subtarea:', sub.codigo_legado, error);
          await db.subtareas_pasos.update(sub.id, { sync_status: 'error' });
          result.failed++;
        } else {
          await db.subtareas_pasos.update(sub.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err) {
        console.error('[SyncManager] Excepción al sincronizar subtarea:', sub.codigo_legado, err);
        await db.subtareas_pasos.update(sub.id, { sync_status: 'error' });
        result.failed++;
      }
    }

    return result;
  }

  // ============================================================================
  // RESOLUTORES TOPOLÓGICOS DE MAPAS EN MEMORIA
  // ============================================================================

  public async construirMapaProyectos(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const proyectos = await db.proyectos.toArray();
    for (const p of proyectos) {
      if (p.codigo_legado && isUuid(p.id)) {
        map.set(p.codigo_legado, p.id);
        map.set(p.id, p.id);
      }
    }
    return map;
  }

  public async construirMapaHitos(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const hitos = await db.hitos_wbs.toArray();
    for (const h of hitos) {
      if (h.codigo_legado && isUuid(h.id)) {
        map.set(h.codigo_legado, h.id);
        map.set(h.id, h.id);
      }
    }
    return map;
  }

  public async construirMapaTareas(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const tareas = await db.tareas.toArray();
    for (const t of tareas) {
      if (t.codigo_legado && isUuid(t.id)) {
        map.set(t.codigo_legado, t.id);
        map.set(t.id, t.id);
      }
    }
    return map;
  }

  public async construirMapaActividades(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const acts = await db.actividades_personales.toArray();
    for (const a of acts) {
      if (a.codigo_legado && isUuid(a.id)) {
        map.set(a.codigo_legado, a.id);
        map.set(a.id, a.id);
      }
    }
    return map;
  }

  // ============================================================================
  // ORQUESTADOR TOPOLÓGICO CANÓNICO
  // ============================================================================

  /**
   * Procesa la cola de registros con sync_status = 'pending' respetando el
   * orden topológico de llaves foráneas para evitar violaciones de integridad referencial:
   * 1. Proyectos (Raíz WBS)
   * 2. Hitos WBS (Nivel 3 - Paquetes de Trabajo y Marcadores)
   * 3. Tareas WBS (Nivel 4) & Actividades Personales (Hábitos)
   * 4. Subtareas / Pasos (Hijos de tareas o actividades)
   * 5. Notas (Bóveda híbrida desacoplada)
   */
  public async syncPendingRecords(): Promise<void> {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.setSyncState('offline');
      return;
    }

    this.isSyncing = true;
    this.setSyncState('syncing');

    try {
      // 1. Verificar registros pendientes en IndexedDB
      const [
        countProy,
        countHit,
        countTar,
        countAct,
        countSub,
        countNot
      ] = await Promise.all([
        db.proyectos.where('sync_status').equals('pending').count(),
        db.hitos_wbs.where('sync_status').equals('pending').count(),
        db.tareas.where('sync_status').equals('pending').count(),
        db.actividades_personales.where('sync_status').equals('pending').count(),
        db.subtareas_pasos.where('sync_status').equals('pending').count(),
        db.notas.where('sync_status').equals('pending').count()
      ]);

      if (countProy + countHit + countTar + countAct + countSub + countNot === 0) {
        this.setSyncState('synced');
        this.isSyncing = false;
        return;
      }

      // 2. Construir mapas topológicos iniciales
      const proyectoMap = await this.construirMapaProyectos();

      // PASO 1: Proyectos (Raíz)
      const resProy = await this.sincronizarProyectos();
      // Actualizar mapa si se sincronizaron nuevos proyectos
      if (resProy.success > 0) {
        const updatedPMap = await this.construirMapaProyectos();
        updatedPMap.forEach((v, k) => proyectoMap.set(k, v));
      }

      // PASO 2: Hitos WBS
      const resHit = await this.sincronizarHitos(proyectoMap);
      const hitoMap = await this.construirMapaHitos();

      // PASO 3: Tareas WBS y Actividades Personales
      const [resTar, resAct] = await Promise.all([
        this.sincronizarTareas(proyectoMap, hitoMap),
        this.sincronizarActividades()
      ]);

      const tareaMap = await this.construirMapaTareas();
      const actividadMap = await this.construirMapaActividades();

      // PASO 4: Subtareas / Pasos
      const resSub = await this.sincronizarSubtareas(tareaMap, actividadMap);

      // PASO 5: Notas
      const resNot = await this.sincronizarNotas();

      const totalFallidos =
        resProy.failed +
        resHit.failed +
        resTar.failed +
        resAct.failed +
        resSub.failed +
        resNot.failed;

      if (totalFallidos > 0) {
        this.setSyncState('error');
      } else {
        this.setSyncState('synced');
      }
    } catch (err) {
      console.error('[SyncManager] Error general en orquestación de sincronización:', err);
      this.setSyncState('error');
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncManager = new SyncManager();
