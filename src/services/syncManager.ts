import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { db, sanearDuplicadosDexie } from '../db/db';
import { extraerCodigoCanonico, fusionarRegistrosDuplicados } from '../utils/entityNormalizer';
import {
  DEFAULT_USER_ID,
  isUuid,
  sanitizarProyectoPayload,
  sanitizarHitoPayload,
  sanitizarTareaPayload,
  sanitizarNotaPayload,
  sanitizarActividadPayload,
  sanitizarSubtareaPayload,
  sanitizarGastoPayload,
  sanitizarIngresoPayload,
  sanitizarCuotaPayload,
  sanitizarMetaPlanPayload,
  sanitizarHitoPlanPayload,
  sanitizarVinculoPayload,
  sanitizarActividadInbound,
  sanitizarSubtareaInbound,
  sanitizarHitoInbound,
  sanitizarTareaInbound
} from './syncPayloadSanitizer';
import type { TombstoneRecord } from '../types';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error' | 'reconnecting';

export interface SyncResult {
  success: number;
  failed: number;
}

/**
 * Diffing en memoria para sincronización silenciosa (REQ-FIX-10).
 * Compara un registro inbound ya sanitizado contra el registro local previo en Dexie.
 * Retorna true si ambos registros son idénticos en valores significativos,
 * evitando escrituras redundantes en Dexie que despierten useLiveQuery innecesariamente.
 */
function sonRegistrosIdenticos(remoto: any, local: any): boolean {
  if (!local || !remoto) return false;
  if (String(remoto.id) !== String(local.id)) return false;

  // Si ambos tienen updated_at, comparar timestamp ISO
  if (remoto.updated_at && local.updated_at) {
    const tRemoto = new Date(remoto.updated_at).getTime();
    const tLocal = new Date(local.updated_at).getTime();
    if (!isNaN(tRemoto) && !isNaN(tLocal) && tRemoto !== tLocal) {
      return false;
    }
  }

  // Comparar campos significativos
  const keys = Object.keys(remoto);
  for (const k of keys) {
    if (k === 'sync_status' || k === 'updated_at') continue;
    const valR = remoto[k];
    const valL = local[k];
    if (valR === valL) continue;

    // Normalizar null, undefined y string vacío como equivalentes
    const rFalsy = valR === null || valR === undefined || valR === '';
    const lFalsy = valL === null || valL === undefined || valL === '';
    if (rFalsy && lFalsy) continue;

    // Comparar tolerancias numéricas para decimales/porcentajes
    if (typeof valR === 'number' && typeof valL === 'number' && Math.abs(valR - valL) < 0.0001) continue;

    return false;
  }

  return true;
}

class SyncManager {
  private supabase: SupabaseClient | null = null;
  private isSyncing = false;
  private syncState: SyncState = 'synced';
  private listeners: Array<(state: SyncState) => void> = [];
  private currentUserId: string = DEFAULT_USER_ID;

  // Realtime & Anti-Eco (TTL 10s & Debounce 800ms)
  private recentlyPushedIds = new Map<string, number>();
  private realtimeChannel: any = null;
  private realtimeDebounceTimer: any = null;
  private visibilityDebounceTimer: any = null;
  private tablasPendientesRealtime = new Set<string>();

  // Cuarentena en memoria para registros con fallos irrecuperables de Foreign Key (23503 / 409 / user_id ausente)
  // Impide bucles infinitos de reintento que saturen la red y congelen el event loop de React (REQ-DESKTOP-11)
  private registrosFkCuarentena = new Set<string>();

  constructor() {
    this.initSupabaseClient();
    this.setupNetworkListeners();
    this.setupRealtimeSubscriptions();
  }

  /**
   * Registra un ID en la caché temporal anti-eco con un TTL de 10 segundos por defecto.
   */
  public registrarPushedId(id: string | undefined | null, ttlMs: number = 10000): void {
    if (!id) return;
    this.recentlyPushedIds.set(String(id), Date.now() + ttlMs);
  }

  /**
   * Evalúa si un ID recibido por WebSocket corresponde a un eco reciente de un push local.
   */
  public esEcoLocal(id: string | undefined | null): boolean {
    if (!id) return false;
    const expiracion = this.recentlyPushedIds.get(String(id));
    if (!expiracion) return false;
    if (Date.now() > expiracion) {
      this.recentlyPushedIds.delete(String(id));
      return false;
    }
    return true;
  }

  public setUserId(userId: string) {
    if (isUuid(userId)) {
      if (this.currentUserId !== userId) {
        this.currentUserId = userId;
        this.registrosFkCuarentena.clear();
      }
    }
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  /**
   * Evalúa si un error retornado por Supabase corresponde a una violación de Foreign Key no recuperable (código 23503 o 409)
   */
  public esErrorFkNoRecuperable(error: any): boolean {
    if (!error) return false;
    const code = String(error.code || '');
    const status = Number(error.status || error.statusCode || 0);
    const msg = String(error.message || '').toLowerCase();
    const details = String(error.details || '').toLowerCase();
    const hint = String(error.hint || '').toLowerCase();
    return (
      code === '23503' ||
      code === '409' ||
      status === 409 ||
      msg.includes('23503') ||
      msg.includes('409') ||
      msg.includes('foreign key') ||
      msg.includes('violates foreign key constraint') ||
      msg.includes('user_id') ||
      msg.includes('is not present in table') ||
      msg.includes('conflict') ||
      details.includes('is not present in table') ||
      details.includes('foreign key') ||
      details.includes('violates foreign key') ||
      hint.includes('foreign key')
    );
  }

  // Bandera de seguridad para suprimir consultas a tablas inexistentes en Supabase (REQ-WEB-01)
  // Por defecto se omiten 'gastos', 'ingresos' y 'cuotas' para neutralizar 404 (Could not find table in schema cache).
  public syncFinanzasRemotoHabilitado: boolean = false;
  private tablasInexistentesSupabase: Set<string> = new Set<string>(['gastos', 'ingresos', 'cuotas']);

  public habilitarSyncFinanzasRemoto(habilitar: boolean = true): void {
    this.syncFinanzasRemotoHabilitado = habilitar;
    if (habilitar) {
      this.tablasInexistentesSupabase.delete('gastos');
      this.tablasInexistentesSupabase.delete('ingresos');
      this.tablasInexistentesSupabase.delete('cuotas');
    } else {
      this.tablasInexistentesSupabase.add('gastos');
      this.tablasInexistentesSupabase.add('ingresos');
      this.tablasInexistentesSupabase.add('cuotas');
    }
  }

  public esTablaInexistenteSupabase(tabla: string): boolean {
    return this.tablasInexistentesSupabase.has(tabla);
  }

  public limpiarCuarentenaFk(): void {
    this.registrosFkCuarentena.clear();
  }

  public estaEnCuarentenaFk(id: string): boolean {
    return this.registrosFkCuarentena.has(id);
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

    // Reconexión Bidireccional Atómica (Push + Pull)
    window.addEventListener('online', async () => {
      console.log('[SyncManager] Conexión restablecida. Disparando sincronización bidireccional...');
      this.setSyncState('syncing');
      try {
        await this.syncPendingRecords();
        await this.descargarDatosDescendientes();
      } catch (err) {
        console.error('[SyncManager] Error en sincronización de reconexión:', err);
      }
    });

    window.addEventListener('offline', () => {
      console.log('[SyncManager] Sin conexión. Modo offline activo.');
      this.setSyncState('offline');
    });

    // Sincronización periódica cada 45 segundos si hay conexión (Blindaje contra pestañas en segundo plano REQ-FIX-08)
    setInterval(async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine && !this.isSyncing) {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return;
        }
        try {
          await this.syncPendingRecords();
          await this.descargarDatosDescendientes();
        } catch (err) {
          console.warn('[SyncManager] Error en intervalo periódico:', err);
        }
      }
    }, 45000);

    // Amortiguación de sincronización al recuperar visibilidad (REQ-FIX-08)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          if (this.visibilityDebounceTimer) {
            clearTimeout(this.visibilityDebounceTimer);
          }
          this.visibilityDebounceTimer = setTimeout(async () => {
            this.visibilityDebounceTimer = null;
            if (typeof navigator !== 'undefined' && navigator.onLine && !this.isSyncing) {
              try {
                await this.syncPendingRecords();
                await this.descargarDatosDescendientes();
              } catch (err) {
                console.warn('[SyncManager] Error al sincronizar tras recuperar visibilidad:', err);
              }
            }
          }, 800);
        }
      });
    }
  }

  /**
   * Configura las suscripciones WebSocket selectivas (Supabase Realtime)
   * Monitorea únicamente las 5 entidades operativas críticas:
   * tareas, actividades_personales, gastos, ingresos, proyectos.
   */
  public setupRealtimeSubscriptions() {
    if (!this.supabase || typeof this.supabase.channel !== 'function') return;
    if (import.meta.env.VITE_SUPABASE_URL?.includes('mock')) return;

    try {
      const tablasMonitoreadas = ['tareas', 'actividades_personales', 'gastos', 'ingresos', 'proyectos'];
      let channel: any = this.supabase.channel('pmo-realtime-channel');

      tablasMonitoreadas.forEach((tabla) => {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tabla },
          (payload: any) => {
            this.handleRealtimeChange(tabla, payload);
          }
        );
      });

      channel.subscribe((status: string) => {
        this.handleRealtimeStatusChange(status);
      });

      this.realtimeChannel = channel;
    } catch (err) {
      console.warn('[SyncManager] Error al configurar suscripción Realtime:', err);
    }
  }

  /**
   * Manejador de eventos entrantes de Realtime con Filtro Anti-Eco y Trailing-Edge Debounce (800ms)
   */
  public handleRealtimeChange(tabla: string, payload: any) {
    const recordId = payload?.new?.id || payload?.old?.id;

    // 1. Filtro Anti-Eco: si el registro fue empujado recientemente por este cliente, se ignora
    if (this.esEcoLocal(recordId)) {
      return;
    }

    // 2. Acumular la tabla afectada
    const targetTable = payload?.table || tabla;
    this.tablasPendientesRealtime.add(targetTable);

    // 3. Trailing-Edge Debounce (800ms) para amortiguar ráfagas concurrentes (Thundering Herd)
    if (this.realtimeDebounceTimer) {
      clearTimeout(this.realtimeDebounceTimer);
    }

    this.realtimeDebounceTimer = setTimeout(async () => {
      this.realtimeDebounceTimer = null;
      const tablasParaPull = Array.from(this.tablasPendientesRealtime);
      this.tablasPendientesRealtime.clear();

      if (tablasParaPull.length > 0) {
        try {
          await this.descargarDatosSelectivos(tablasParaPull);
        } catch (err) {
          console.error('[SyncManager] Error en pull selectivo Realtime:', err);
        }
      }
    }, 800);
  }

  /**
   * Telemetría de conexión WebSocket: actualiza el estado si el canal se degrada o reconecta
   */
  public handleRealtimeStatusChange(status: string) {
    if (status === 'SUBSCRIBED') {
      if (this.syncState === 'reconnecting' || this.syncState === 'error') {
        this.setSyncState('synced');
      }
    } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
      const isExplicitOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      if (!this.isSyncing && !isExplicitOffline) {
        this.setSyncState('reconnecting');
      }
    }
  }

  /**
   * Limpieza defensiva de suscripciones y timers
   */
  public destroyRealtimeSubscriptions() {
    if (this.realtimeDebounceTimer) {
      clearTimeout(this.realtimeDebounceTimer);
      this.realtimeDebounceTimer = null;
    }
    if (this.realtimeChannel && typeof this.realtimeChannel.unsubscribe === 'function') {
      try {
        this.realtimeChannel.unsubscribe();
      } catch {}
      this.realtimeChannel = null;
    }
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
  // HELPERS DE TOLERANCIA Y RESOLUCIÓN LWW (LAST-WRITE-WINS)
  // ============================================================================

  /**
   * Resuelve registros en cola de sincronización ('pending' o 'error' para reintentos con backoff).
   * Compatible con mocks de pruebas unitarias que sólo implementen .equals().
   * Descarta permanentemente registros en estado 'quarantined' (REQ-WEB-01) o en registrosFkCuarentena.
   */
  public async obtenerRegistrosPendientes<T>(tableRef: any): Promise<T[]> {
    let records: T[] = [];
    try {
      const w = tableRef.where('sync_status');
      if (typeof w.anyOf === 'function') {
        records = await w.anyOf(['pending', 'error']).toArray();
      } else if (typeof w.equals === 'function') {
        records = await w.equals('pending').toArray();
      } else {
        records = (await tableRef.toArray()).filter(
          (r: any) => r.sync_status === 'pending' || r.sync_status === 'error'
        );
      }
    } catch {
      try {
        records = await tableRef.where('sync_status').equals('pending').toArray();
      } catch {
        records = [];
      }
    }

    return records.filter((r: any) => {
      if (!r) return false;
      if (r.sync_status === 'quarantined' || r.sync_status === 'synced') return false;
      if (r.id && this.registrosFkCuarentena.has(String(r.id))) return false;
      return true;
    });
  }

  /**
   * Conteo seguro de registros pendientes o en error (excluye registros en cuarentena)
   */
  public async contarPendientes(tableRef: any): Promise<number> {
    try {
      const pending = await this.obtenerRegistrosPendientes(tableRef);
      return pending.length;
    } catch {
      return 0;
    }
  }

  /**
   * Resolución de Conflictos LWW (Last-Write-Wins):
   * Compara timestamps 'updated_at' entre la réplica remota en Supabase y el registro local.
   * Si la versión remota es estrictamente más reciente, cancela el push y preserva la remota.
   */
  private async esRemotoMasReciente(
    tabla: string,
    codigoLegado?: string,
    updatedAtLocal?: string
  ): Promise<boolean> {
    if (!this.supabase || !codigoLegado || !updatedAtLocal) return false;
    if (import.meta.env.VITE_SUPABASE_URL?.includes('mock')) return false;

    try {
      const tableQuery = this.supabase.from(tabla);
      if (typeof tableQuery.select !== 'function') return false;

      const { data: remoto, error } = await tableQuery
        .select('updated_at')
        .eq('codigo_legado', codigoLegado)
        .maybeSingle();

      if (error || !remoto?.updated_at) return false;

      const remoteTime = new Date(remoto.updated_at).getTime();
      const localTime = new Date(updatedAtLocal).getTime();

      if (!isNaN(remoteTime) && !isNaN(localTime) && remoteTime > localTime) {
        console.warn(
          `[SyncManager] LWW Alert: Remote wins for ${tabla} ${codigoLegado} (Remoto: ${remoto.updated_at} > Local: ${updatedAtLocal})`
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // MÉTODOS MODULARES DE REPLICACIÓN PUSH (13 ENTIDADES OPERATIVAS)
  // ============================================================================

  /**
   * 0. Sincroniza lápidas de registros eliminados hacia Supabase (Tombstones Push)
   * Previene resurrección remota y garantiza la consistencia del borrado físico.
   */
  public async sincronizarTombstones(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    if (!db.tombstones) return result;

    const pending = await this.obtenerRegistrosPendientes<TombstoneRecord>(db.tombstones);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((t) => db.tombstones.update(t.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const tombstone of pending) {
      try {
        this.registrarPushedId(tombstone.id);
        const { error } = await this.supabase
          .from(tombstone.tabla)
          .delete()
          .eq('id', tombstone.id);

        if (error) {
          console.error(
            `[SyncManager] Error al sincronizar tombstone en Supabase (${tombstone.tabla}:${tombstone.id}):`,
            error
          );
          await db.tombstones.update(tombstone.id, { sync_status: 'error' });
          result.failed++;
        } else {
          await db.tombstones.update(tombstone.id, { sync_status: 'synced' });
          result.success++;
        }
      } catch (err) {
        console.error(
          `[SyncManager] Excepción al sincronizar tombstone (${tombstone.tabla}:${tombstone.id}):`,
          err
        );
        await db.tombstones.update(tombstone.id, { sync_status: 'error' });
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 1. Sincroniza proyectos pendientes aplicando sanitización, LWW e idempotencia
   */
  public async sincronizarProyectos(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await this.obtenerRegistrosPendientes<any>(db.proyectos);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((p) => db.proyectos.update(p.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const proy of pending) {
      if (this.registrosFkCuarentena.has(proy.id)) {
        continue;
      }
      try {
        if (await this.esRemotoMasReciente('proyectos', proy.codigo_legado, proy.updated_at)) {
          await db.proyectos.update(proy.id, { sync_status: 'synced' });
          result.success++;
          continue;
        }

        const payload = sanitizarProyectoPayload(proy, this.currentUserId);
        this.registrarPushedId(proy.id);
        const { error } = await this.supabase
          .from('proyectos')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(`[SyncManager] Violación FK/409 en proyecto ${proy.codigo_legado}. Cuarentena definitiva en Dexie:`, error.message);
            this.registrosFkCuarentena.add(proy.id);
            await db.proyectos.update(proy.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar proyecto:', proy.codigo_legado, error);
            await db.proyectos.update(proy.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.proyectos.update(proy.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción FK/409 en proyecto ${proy.codigo_legado}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(proy.id);
          await db.proyectos.update(proy.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar proyecto:', proy.codigo_legado, err);
          await db.proyectos.update(proy.id, { sync_status: 'error' });
        }
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 2. Sincroniza hitos WBS pendientes resolviendo la FK de proyecto_id y LWW
   */
  public async sincronizarHitos(proyectoMap?: Map<string, string>): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await this.obtenerRegistrosPendientes<any>(db.hitos_wbs);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((h) => db.hitos_wbs.update(h.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    const map = proyectoMap || (await this.construirMapaProyectos());

    for (const hito of pending) {
      if (this.registrosFkCuarentena.has(hito.id)) {
        continue;
      }
      try {
        if (await this.esRemotoMasReciente('hitos_wbs', hito.codigo_legado, hito.updated_at)) {
          await db.hitos_wbs.update(hito.id, { sync_status: 'synced' });
          result.success++;
          continue;
        }

        const payload = sanitizarHitoPayload(hito, map, this.currentUserId);
        if (!payload.proyecto_id) {
          console.warn('[SyncManager] Hito sin proyecto_id UUID resuelto, cuarentena en Dexie:', hito.codigo_legado);
          this.registrosFkCuarentena.add(hito.id);
          await db.hitos_wbs.update(hito.id, { sync_status: 'quarantined' });
          result.failed++;
          continue;
        }

        this.registrarPushedId(hito.id);
        const { error } = await this.supabase
          .from('hitos_wbs')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(`[SyncManager] Violación FK/409 en hito ${hito.codigo_legado}. Cuarentena definitiva en Dexie:`, error.message);
            this.registrosFkCuarentena.add(hito.id);
            await db.hitos_wbs.update(hito.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar hito:', hito.codigo_legado, error);
            await db.hitos_wbs.update(hito.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.hitos_wbs.update(hito.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción FK/409 en hito ${hito.codigo_legado}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(hito.id);
          await db.hitos_wbs.update(hito.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar hito:', hito.codigo_legado, err);
          await db.hitos_wbs.update(hito.id, { sync_status: 'error' });
        }
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 3. Sincroniza tareas WBS pendientes resolviendo FKs de proyecto_id e hito_id y LWW
   */
  public async sincronizarTareas(
    proyectoMap?: Map<string, string>,
    hitoMap?: Map<string, string>
  ): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await this.obtenerRegistrosPendientes<any>(db.tareas);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((t) => db.tareas.update(t.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    const pMap = proyectoMap || (await this.construirMapaProyectos());
    const hMap = hitoMap || (await this.construirMapaHitos());

    for (const tarea of pending) {
      if (this.registrosFkCuarentena.has(tarea.id)) {
        continue;
      }
      try {
        if (await this.esRemotoMasReciente('tareas', tarea.codigo_legado, tarea.updated_at)) {
          await db.tareas.update(tarea.id, { sync_status: 'synced' });
          result.success++;
          continue;
        }

        const payload = sanitizarTareaPayload(tarea, pMap, hMap, this.currentUserId);
        if (!payload.proyecto_id || !payload.hito_id) {
          console.warn('[SyncManager] Tarea sin proyecto_id o hito_id UUID resuelto, cuarentena en Dexie:', tarea.codigo_legado);
          this.registrosFkCuarentena.add(tarea.id);
          await db.tareas.update(tarea.id, { sync_status: 'quarantined' });
          result.failed++;
          continue;
        }

        this.registrarPushedId(tarea.id);
        const { error } = await this.supabase
          .from('tareas')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(`[SyncManager] Violación FK/409 en tarea ${tarea.codigo_legado}. Cuarentena definitiva en Dexie:`, error.message);
            this.registrosFkCuarentena.add(tarea.id);
            await db.tareas.update(tarea.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar tarea:', tarea.codigo_legado, error);
            await db.tareas.update(tarea.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.tareas.update(tarea.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción FK/409 en tarea ${tarea.codigo_legado}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(tarea.id);
          await db.tareas.update(tarea.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar tarea:', tarea.codigo_legado, err);
          await db.tareas.update(tarea.id, { sync_status: 'error' });
        }
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 4. Sincroniza actividades personales (hábitos y rutinas) con LWW
   */
  public async sincronizarActividades(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await this.obtenerRegistrosPendientes<any>(db.actividades_personales);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((a) => db.actividades_personales.update(a.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const act of pending) {
      if (this.registrosFkCuarentena.has(act.id)) {
        continue;
      }
      try {
        if (await this.esRemotoMasReciente('actividades_personales', act.codigo_legado, act.updated_at)) {
          await db.actividades_personales.update(act.id, { sync_status: 'synced' });
          result.success++;
          continue;
        }

        const payload = sanitizarActividadPayload(act, this.currentUserId);
        this.registrarPushedId(act.id);
        const { error } = await this.supabase
          .from('actividades_personales')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(`[SyncManager] Violación FK/409 en actividad ${act.codigo_legado}. Cuarentena definitiva en Dexie:`, error.message);
            this.registrosFkCuarentena.add(act.id);
            await db.actividades_personales.update(act.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar actividad:', act.codigo_legado, error);
            await db.actividades_personales.update(act.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.actividades_personales.update(act.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción FK/409 en actividad ${act.codigo_legado}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(act.id);
          await db.actividades_personales.update(act.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar actividad:', act.codigo_legado, err);
          await db.actividades_personales.update(act.id, { sync_status: 'error' });
        }
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 5. Sincroniza subtareas y pasos enlazando tarea_id o actividad_id con LWW
   */
  public async sincronizarSubtareas(
    tareaMap?: Map<string, string>,
    actividadMap?: Map<string, string>
  ): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await this.obtenerRegistrosPendientes<any>(db.subtareas_pasos);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((s) => db.subtareas_pasos.update(s.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    const tMap = tareaMap || (await this.construirMapaTareas());
    const aMap = actividadMap || (await this.construirMapaActividades());

    for (const sub of pending) {
      if (this.registrosFkCuarentena.has(sub.id)) {
        continue;
      }
      try {
        if (await this.esRemotoMasReciente('subtareas_pasos', sub.codigo_legado, sub.updated_at)) {
          await db.subtareas_pasos.update(sub.id, { sync_status: 'synced' });
          result.success++;
          continue;
        }

        const payload = sanitizarSubtareaPayload(sub, tMap, aMap, this.currentUserId);
        if (!payload.tarea_id && !payload.actividad_id) {
          console.warn('[SyncManager] Subtarea sin padre UUID resuelto, cuarentena en Dexie:', sub.codigo_legado);
          this.registrosFkCuarentena.add(sub.id);
          await db.subtareas_pasos.update(sub.id, { sync_status: 'quarantined' });
          result.failed++;
          continue;
        }

        this.registrarPushedId(sub.id);
        const { error } = await this.supabase
          .from('subtareas_pasos')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(`[SyncManager] Violación FK/409 en subtarea ${sub.codigo_legado}. Cuarentena definitiva en Dexie:`, error.message);
            this.registrosFkCuarentena.add(sub.id);
            await db.subtareas_pasos.update(sub.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar subtarea:', sub.codigo_legado, error);
            await db.subtareas_pasos.update(sub.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.subtareas_pasos.update(sub.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción FK/409 en subtarea ${sub.codigo_legado}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(sub.id);
          await db.subtareas_pasos.update(sub.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar subtarea:', sub.codigo_legado, err);
          await db.subtareas_pasos.update(sub.id, { sync_status: 'error' });
        }
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 6. Sincroniza metas y planes cuantitativos/cualitativos con LWW
   */
  public async sincronizarMetasPlanes(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await this.obtenerRegistrosPendientes<any>(db.metas_planes);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((m) => db.metas_planes.update(m.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const meta of pending) {
      if (this.registrosFkCuarentena.has(meta.id)) {
        continue;
      }
      try {
        if (await this.esRemotoMasReciente('metas_planes', meta.codigo_legado, meta.updated_at)) {
          await db.metas_planes.update(meta.id, { sync_status: 'synced' });
          result.success++;
          continue;
        }

        const payload = sanitizarMetaPlanPayload(meta, this.currentUserId);
        this.registrarPushedId(meta.id);
        const { error } = await this.supabase
          .from('metas_planes')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(
              `[SyncManager] Violación Foreign Key (código ${error.code || '23503'}) en meta ${meta.codigo_legado}. Cuarentena definitiva en Dexie para contener bucle:`,
              error.message
            );
            this.registrosFkCuarentena.add(meta.id);
            await db.metas_planes.update(meta.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar meta:', meta.codigo_legado, error);
            await db.metas_planes.update(meta.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.metas_planes.update(meta.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción Foreign Key en meta ${meta.codigo_legado}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(meta.id);
          await db.metas_planes.update(meta.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar meta:', meta.codigo_legado, err);
          await db.metas_planes.update(meta.id, { sync_status: 'error' });
        }
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 7. Sincroniza hitos del plan de acción secuenciales con LWW
   */
  public async sincronizarHitosPlan(metaMap?: Map<string, string>): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await this.obtenerRegistrosPendientes<any>(db.planes_accion_hitos);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((h) => db.planes_accion_hitos.update(h.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    const mMap = metaMap || (await this.construirMapaMetas());

    for (const hito of pending) {
      if (this.registrosFkCuarentena.has(hito.id)) {
        continue;
      }
      try {
        if (await this.esRemotoMasReciente('planes_accion_hitos', hito.codigo_legado, hito.updated_at)) {
          await db.planes_accion_hitos.update(hito.id, { sync_status: 'synced' });
          result.success++;
          continue;
        }

        const payload = sanitizarHitoPlanPayload(hito, mMap, this.currentUserId);
        if (!payload.meta_id) {
          console.warn('[SyncManager] Hito de plan sin meta_id UUID resuelto, cuarentena en Dexie:', hito.codigo_legado);
          this.registrosFkCuarentena.add(hito.id);
          await db.planes_accion_hitos.update(hito.id, { sync_status: 'quarantined' });
          result.failed++;
          continue;
        }

        this.registrarPushedId(hito.id);
        const { error } = await this.supabase
          .from('planes_accion_hitos')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(
              `[SyncManager] Violación Foreign Key (código ${error.code || '23503'}) en hito de plan ${hito.codigo_legado}. Cuarentena definitiva en Dexie:`,
              error.message
            );
            this.registrosFkCuarentena.add(hito.id);
            await db.planes_accion_hitos.update(hito.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar hito de plan:', hito.codigo_legado, error);
            await db.planes_accion_hitos.update(hito.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.planes_accion_hitos.update(hito.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción Foreign Key en hito de plan ${hito.codigo_legado}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(hito.id);
          await db.planes_accion_hitos.update(hito.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar hito de plan:', hito.codigo_legado, err);
          await db.planes_accion_hitos.update(hito.id, { sync_status: 'error' });
        }
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 8. Sincroniza vínculos N:M entre hábitos y metas
   */
  public async sincronizarVinculosMeta(
    actividadMap?: Map<string, string>,
    metaMap?: Map<string, string>
  ): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await this.obtenerRegistrosPendientes<any>(db.habitos_metas_vinculos);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((v) => db.habitos_metas_vinculos.update(v.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    const aMap = actividadMap || (await this.construirMapaActividades());
    const mMap = metaMap || (await this.construirMapaMetas());

    for (const vinculo of pending) {
      if (this.registrosFkCuarentena.has(vinculo.id)) {
        continue;
      }
      try {
        const payload = sanitizarVinculoPayload(vinculo, aMap, mMap, this.currentUserId);
        if (!payload.habito_id || !payload.meta_id) {
          console.warn('[SyncManager] Vínculo hábito-meta sin UUIDs resueltos, cuarentena en Dexie:', vinculo.id);
          this.registrosFkCuarentena.add(vinculo.id);
          await db.habitos_metas_vinculos.update(vinculo.id, { sync_status: 'quarantined' });
          result.failed++;
          continue;
        }

        this.registrarPushedId(vinculo.id);
        const { error } = await this.supabase
          .from('habitos_metas_vinculos')
          .upsert(payload, { onConflict: 'id' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(
              `[SyncManager] Violación Foreign Key (código ${error.code || '23503'}) en vínculo hábito-meta ${vinculo.id}. Cuarentena definitiva en Dexie para contener bucle:`,
              error.message
            );
            this.registrosFkCuarentena.add(vinculo.id);
            await db.habitos_metas_vinculos.update(vinculo.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar vínculo hábito-meta:', vinculo.id, error);
            await db.habitos_metas_vinculos.update(vinculo.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.habitos_metas_vinculos.update(vinculo.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción Foreign Key en vínculo hábito-meta ${vinculo.id}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(vinculo.id);
          await db.habitos_metas_vinculos.update(vinculo.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar vínculo hábito-meta:', vinculo.id, err);
          await db.habitos_metas_vinculos.update(vinculo.id, { sync_status: 'error' });
        }
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 9. Sincroniza gastos financieros con LWW
   */
  public async sincronizarGastos(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    // REQ-WEB-01: Suprimir push hacia Supabase si la tabla no existe en el schema remoto (404)
    if (!this.syncFinanzasRemotoHabilitado && this.tablasInexistentesSupabase.has('gastos')) {
      return result;
    }

    const pending = await this.obtenerRegistrosPendientes<any>(db.gastos);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((g) => db.gastos.update(g.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const gasto of pending) {
      if (this.registrosFkCuarentena.has(gasto.id)) {
        continue;
      }
      try {
        if (await this.esRemotoMasReciente('gastos', gasto.codigo_legado, gasto.updated_at)) {
          await db.gastos.update(gasto.id, { sync_status: 'synced' });
          result.success++;
          continue;
        }

        const payload = sanitizarGastoPayload(gasto, this.currentUserId);
        this.registrarPushedId(gasto.id);
        const { error } = await this.supabase
          .from('gastos')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(`[SyncManager] Violación FK/409 en gasto ${gasto.codigo_legado}. Cuarentena definitiva en Dexie:`, error.message);
            this.registrosFkCuarentena.add(gasto.id);
            await db.gastos.update(gasto.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar gasto:', gasto.codigo_legado, error);
            await db.gastos.update(gasto.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.gastos.update(gasto.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción FK/409 en gasto ${gasto.codigo_legado}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(gasto.id);
          await db.gastos.update(gasto.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar gasto:', gasto.codigo_legado, err);
          await db.gastos.update(gasto.id, { sync_status: 'error' });
        }
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 10. Sincroniza ingresos financieros con LWW
   */
  public async sincronizarIngresos(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    // REQ-WEB-01: Suprimir push hacia Supabase si la tabla no existe en el schema remoto (404)
    if (!this.syncFinanzasRemotoHabilitado && this.tablasInexistentesSupabase.has('ingresos')) {
      return result;
    }

    const pending = await this.obtenerRegistrosPendientes<any>(db.ingresos);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((i) => db.ingresos.update(i.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const ingreso of pending) {
      if (this.registrosFkCuarentena.has(ingreso.id)) {
        continue;
      }
      try {
        if (await this.esRemotoMasReciente('ingresos', ingreso.codigo_legado, ingreso.updated_at)) {
          await db.ingresos.update(ingreso.id, { sync_status: 'synced' });
          result.success++;
          continue;
        }

        const payload = sanitizarIngresoPayload(ingreso, this.currentUserId);
        this.registrarPushedId(ingreso.id);
        const { error } = await this.supabase
          .from('ingresos')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(`[SyncManager] Violación FK/409 en ingreso ${ingreso.codigo_legado}. Cuarentena definitiva en Dexie:`, error.message);
            this.registrosFkCuarentena.add(ingreso.id);
            await db.ingresos.update(ingreso.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar ingreso:', ingreso.codigo_legado, error);
            await db.ingresos.update(ingreso.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.ingresos.update(ingreso.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción FK/409 en ingreso ${ingreso.codigo_legado}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(ingreso.id);
          await db.ingresos.update(ingreso.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar ingreso:', ingreso.codigo_legado, err);
          await db.ingresos.update(ingreso.id, { sync_status: 'error' });
        }
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 11. Sincroniza cuotas y compromisos de financiamiento con LWW
   */
  public async sincronizarCuotas(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    // REQ-WEB-01: Suprimir push hacia Supabase si la tabla no existe en el schema remoto (404)
    if (!this.syncFinanzasRemotoHabilitado && this.tablasInexistentesSupabase.has('cuotas')) {
      return result;
    }

    const pending = await this.obtenerRegistrosPendientes<any>(db.cuotas);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((c) => db.cuotas.update(c.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const cuota of pending) {
      if (this.registrosFkCuarentena.has(cuota.id)) {
        continue;
      }
      try {
        if (await this.esRemotoMasReciente('cuotas', cuota.codigo_legado, cuota.updated_at)) {
          await db.cuotas.update(cuota.id, { sync_status: 'synced' });
          result.success++;
          continue;
        }

        const payload = sanitizarCuotaPayload(cuota, this.currentUserId);
        this.registrarPushedId(cuota.id);
        const { error } = await this.supabase
          .from('cuotas')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(`[SyncManager] Violación FK/409 en cuota ${cuota.codigo_legado}. Cuarentena definitiva en Dexie:`, error.message);
            this.registrosFkCuarentena.add(cuota.id);
            await db.cuotas.update(cuota.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar cuota:', cuota.codigo_legado, error);
            await db.cuotas.update(cuota.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.cuotas.update(cuota.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción FK/409 en cuota ${cuota.codigo_legado}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(cuota.id);
          await db.cuotas.update(cuota.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar cuota:', cuota.codigo_legado, err);
          await db.cuotas.update(cuota.id, { sync_status: 'error' });
        }
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 12. Sincroniza notas pendientes asegurando arrays/objetos JSONB sin campos virtuales y LWW
   */
  public async sincronizarNotas(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    const pending = await this.obtenerRegistrosPendientes<any>(db.notas);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((n) => db.notas.update(n.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const nota of pending) {
      if (this.registrosFkCuarentena.has(nota.id)) {
        continue;
      }
      try {
        if (await this.esRemotoMasReciente('notas', nota.codigo_legado, nota.updated_at)) {
          await db.notas.update(nota.id, { sync_status: 'synced' });
          result.success++;
          continue;
        }

        const payload = sanitizarNotaPayload(nota, this.currentUserId);
        this.registrarPushedId(nota.id);
        const { error } = await this.supabase
          .from('notas')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            console.warn(`[SyncManager] Violación FK/409 en nota ${nota.codigo_legado}. Cuarentena definitiva en Dexie:`, error.message);
            this.registrosFkCuarentena.add(nota.id);
            await db.notas.update(nota.id, { sync_status: 'quarantined' });
          } else {
            console.error('[SyncManager] Error al sincronizar nota:', nota.codigo_legado, error);
            await db.notas.update(nota.id, { sync_status: 'error' });
          }
          result.failed++;
        } else {
          await db.notas.update(nota.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          console.warn(`[SyncManager] Excepción FK/409 en nota ${nota.codigo_legado}. Cuarentena definitiva en Dexie:`, err?.message);
          this.registrosFkCuarentena.add(nota.id);
          await db.notas.update(nota.id, { sync_status: 'quarantined' });
        } else {
          console.error('[SyncManager] Excepción al sincronizar nota:', nota.codigo_legado, err);
          await db.notas.update(nota.id, { sync_status: 'error' });
        }
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

  public async construirMapaMetas(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const metas = await db.metas_planes.toArray();
    for (const m of metas) {
      if (m.codigo_legado && isUuid(m.id)) {
        map.set(m.codigo_legado, m.id);
        map.set(m.id, m.id);
      }
    }
    return map;
  }

  // ============================================================================
  // ORQUESTADOR TOPOLÓGICO CANÓNICO (12 ENTIDADES)
  // ============================================================================

  /**
   * Procesa la cola de registros con sync_status 'pending' o 'error' respetando el
   * orden topológico de llaves foráneas para evitar violaciones de integridad referencial:
   * 1. Proyectos (Raíz WBS)
   * 2. Hitos WBS (depende de Proyectos)
   * 3. Tareas WBS & Actividades Personales (Hábitos)
   * 4. Subtareas / Pasos (depende de Tareas y Actividades)
   * 5. Metas y Planes
   * 6. Hitos del Plan (depende de Metas)
   * 7. Vínculos Hábito-Meta (depende de Actividades y Metas)
   * 8. Gastos Financieros
   * 9. Ingresos Financieros
   * 10. Cuotas Bancarias
   * 11. Notas (Bóveda híbrida desacoplada)
   */
  public async syncPendingRecords(): Promise<void> {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.setSyncState('offline');
      return;
    }

    try {
      // 1. Verificar registros pendientes en IndexedDB a través de las 13 entidades (incluyendo tombstones)
      const pendingCounts = await Promise.all([
        this.contarPendientes(db.tombstones),
        this.contarPendientes(db.proyectos),
        this.contarPendientes(db.hitos_wbs),
        this.contarPendientes(db.tareas),
        this.contarPendientes(db.actividades_personales),
        this.contarPendientes(db.subtareas_pasos),
        this.contarPendientes(db.metas_planes),
        this.contarPendientes(db.planes_accion_hitos),
        this.contarPendientes(db.habitos_metas_vinculos),
        this.contarPendientes(db.gastos),
        this.contarPendientes(db.ingresos),
        this.contarPendientes(db.cuotas),
        this.contarPendientes(db.notas)
      ]);

      const totalPendientes = pendingCounts.reduce((acc, c) => acc + c, 0);

      if (totalPendientes === 0) {
        if (this.syncState !== 'synced') {
          this.setSyncState('synced');
        }
        return;
      }

      this.isSyncing = true;
      this.setSyncState('syncing');

      // PASO 0: Lápidas (Tombstones) - Borrado prioritario remoto para evitar colisiones
      const resTomb = await this.sincronizarTombstones();

      // 2. Construir mapas topológicos iniciales
      const proyectoMap = await this.construirMapaProyectos();

      // PASO 1: Proyectos (Raíz)
      const resProy = await this.sincronizarProyectos();
      if (resProy.success > 0) {
        const updatedPMap = await this.construirMapaProyectos();
        updatedPMap.forEach((v, k) => proyectoMap.set(k, v));
      }

      // PASO 2: Hitos WBS (depende de Proyectos)
      const resHit = await this.sincronizarHitos(proyectoMap);
      const hitoMap = await this.construirMapaHitos();

      // PASO 3: Tareas WBS y Actividades Personales (Hábitos)
      const [resTar, resAct] = await Promise.all([
        this.sincronizarTareas(proyectoMap, hitoMap),
        this.sincronizarActividades()
      ]);

      const tareaMap = await this.construirMapaTareas();
      const actividadMap = await this.construirMapaActividades();

      // PASO 4: Subtareas / Pasos (depende de Tareas y Actividades)
      const resSub = await this.sincronizarSubtareas(tareaMap, actividadMap);

      // PASO 5: Metas y Planes
      const resMet = await this.sincronizarMetasPlanes();
      const metaMap = await this.construirMapaMetas();

      // PASO 6: Hitos del Plan (depende de Metas)
      const resHitPln = await this.sincronizarHitosPlan(metaMap);

      // PASO 7: Vínculos Hábito-Meta (depende de Actividades y Metas)
      const resVin = await this.sincronizarVinculosMeta(actividadMap, metaMap);

      // PASO 8: Gastos Financieros
      const resGas = await this.sincronizarGastos();

      // PASO 9: Ingresos Financieros
      const resIng = await this.sincronizarIngresos();

      // PASO 10: Cuotas Bancarias
      const resCuo = await this.sincronizarCuotas();

      // PASO 11: Notas
      const resNot = await this.sincronizarNotas();

      const totalFallidos =
        resTomb.failed +
        resProy.failed +
        resHit.failed +
        resTar.failed +
        resAct.failed +
        resSub.failed +
        resMet.failed +
        resHitPln.failed +
        resVin.failed +
        resGas.failed +
        resIng.failed +
        resCuo.failed +
        resNot.failed;

      if (totalFallidos > 0) {
        this.setSyncState('error');
      } else {
        this.setSyncState('synced');
      }

      this.guardarSnapshotEnPuenteLocal().catch(() => {});
    } catch (err) {
      console.error('[SyncManager] Error general en orquestación de sincronización:', err);
      this.setSyncState('error');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Descarga selectiva en caliente para eventos Realtime acotados a tablas específicas
   */
  public async descargarDatosSelectivos(tablas: string[]): Promise<{ descargados: number; fallidos: number }> {
    return this.descargarDatosDescendientes(tablas);
  }

  /**
   * Descarga registros desde Supabase hacia Dexie (Inbound Pull)
   * preservando y sin sobreescribir datos locales con sync_status 'pending' o 'error'.
   * Si se especifica `tablasFiltro`, procesa únicamente las entidades indicadas.
   */
  public async descargarDatosDescendientes(tablasFiltro?: string[]): Promise<{ descargados: number; fallidos: number }> {
    const summary = { descargados: 0, fallidos: 0 };
    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      return summary;
    }

    // Pre-cargar en memoria un Set con los IDs de todos los tombstones locales para evitar resurrección
    const tombstonesLocalesSet = new Set<string>();
    try {
      if (db.tombstones && typeof db.tombstones.toArray === 'function') {
        const todasLapidas = await db.tombstones.toArray();
        todasLapidas.forEach((t) => {
          if (t.id) tombstonesLocalesSet.add(String(t.id));
        });
      }
    } catch {
      // Tolerancia defensiva ante entornos sin IndexedDB
    }

    // Pre-cargar mapas UUID -> Código de Proyectos e Hitos existentes en Dexie (REQ-FIX-10)
    const proyUuidToCod = new Map<string, string>();
    const hitoUuidToCod = new Map<string, string>();
    try {
      if (db.proyectos && typeof (db.proyectos as any).toArray === 'function') {
        const locProys = await (db.proyectos as any).toArray();
        if (Array.isArray(locProys)) {
          locProys.forEach((p: any) => {
            const cod = extraerCodigoCanonico(p);
            if (cod) {
              if (p.id) {
                proyUuidToCod.set(String(p.id), cod);
                proyUuidToCod.set(String(p.id).toUpperCase(), cod);
              }
              proyUuidToCod.set(cod, cod);
            }
          });
        }
      }
      if (db.hitos_wbs && typeof (db.hitos_wbs as any).toArray === 'function') {
        const locHitos = await (db.hitos_wbs as any).toArray();
        if (Array.isArray(locHitos)) {
          locHitos.forEach((h: any) => {
            const cod = extraerCodigoCanonico(h);
            if (cod) {
              if (h.id) {
                hitoUuidToCod.set(String(h.id), cod);
                hitoUuidToCod.set(String(h.id).toUpperCase(), cod);
              }
              hitoUuidToCod.set(cod, cod);
            }
          });
        }
      }
    } catch {
      // Fallback defensivo ante entornos sin IndexedDB
    }

    const configuraciones = [
      { tabla: 'proyectos', refDexie: db.proyectos },
      { tabla: 'hitos_wbs', refDexie: db.hitos_wbs },
      { tabla: 'tareas', refDexie: db.tareas },
      { tabla: 'actividades_personales', refDexie: db.actividades_personales },
      { tabla: 'subtareas_pasos', refDexie: db.subtareas_pasos },
      { tabla: 'metas_planes', refDexie: db.metas_planes },
      { tabla: 'planes_accion_hitos', refDexie: db.planes_accion_hitos },
      { tabla: 'habitos_metas_vinculos', refDexie: db.habitos_metas_vinculos },
      { tabla: 'gastos', refDexie: db.gastos },
      { tabla: 'ingresos', refDexie: db.ingresos },
      { tabla: 'cuotas', refDexie: db.cuotas },
      { tabla: 'notas', refDexie: db.notas }
    ] as const;

    const configuracionesFiltradas = configuraciones.filter((c) => {
      if (tablasFiltro && tablasFiltro.length > 0) {
        return tablasFiltro.includes(c.tabla);
      }
      // REQ-WEB-01: Suprimir peticiones a tablas inexistentes en Supabase ('gastos', 'ingresos', 'cuotas' 404)
      if (this.tablasInexistentesSupabase.has(c.tabla) && !this.syncFinanzasRemotoHabilitado) {
        return false;
      }
      return true;
    });

    // Buffer de mutaciones en memoria para ejecución en transacción atómica unificada (REQ-FIX-10)
    const mutacionesPorTabla: Array<{
      tabla: string;
      refDexie: any;
      eliminar: string[];
      actualizar: any[];
    }> = [];

    for (const { tabla, refDexie } of configuracionesFiltradas) {
      if (this.tablasInexistentesSupabase.has(tabla) && !this.syncFinanzasRemotoHabilitado && (!tablasFiltro || !tablasFiltro.includes(tabla))) {
        continue;
      }

      try {
        let query: any = this.supabase.from(tabla).select('*');

        // Límites de Ingesta (90 días) para tablas de alto volumen
        const tablasAltoVolumen = ['gastos', 'ingresos', 'habitos_registros', 'habito_cumplimiento_logs'];
        if (tablasAltoVolumen.includes(tabla) && typeof query?.gte === 'function') {
          const cutoffIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('created_at', cutoffIso);
        }

        const { data, error } = await query;

        if (error) {
          const msg = String(error.message || '').toLowerCase();
          const code = String(error.code || '');
          const status = Number(error.status || error.statusCode || 0);

          if (
            status === 404 ||
            code === 'PGRST205' ||
            msg.includes('schema cache') ||
            msg.includes('could not find the table')
          ) {
            console.warn(`[SyncManager] Tabla ${tabla} inexistente en Supabase (404/PGRST205). Suprimiendo futuras consultas.`);
            this.tablasInexistentesSupabase.add(tabla);
          } else {
            console.warn(`[SyncManager] Aviso al descargar tabla remota ${tabla}:`, error.message);
          }
          summary.fallidos++;
          continue;
        }

        if (!data || data.length === 0) continue;

        // Enriquecer mapas UUID -> Código con datos remotos frescos (REQ-FIX-10)
        if (tabla === 'proyectos') {
          for (const item of data) {
            if (item.id && item.codigo_legado) {
              proyUuidToCod.set(String(item.id), item.codigo_legado);
              proyUuidToCod.set(String(item.id).toUpperCase(), item.codigo_legado);
            }
          }
        } else if (tabla === 'hitos_wbs') {
          for (const item of data) {
            if (item.id && item.codigo_legado) {
              hitoUuidToCod.set(String(item.id), item.codigo_legado);
              hitoUuidToCod.set(String(item.id).toUpperCase(), item.codigo_legado);
            }
          }
        }

        // Recuperar IDs pendientes o en error en local para proteger cambios sin sincronizar
        const idsPendientesLocales = new Set<string>();
        try {
          const w = (refDexie as any).where('sync_status');
          const keys = typeof w.anyOf === 'function'
            ? await w.anyOf(['pending', 'error']).primaryKeys()
            : await w.equals('pending').primaryKeys();
          keys.forEach((k: any) => idsPendientesLocales.add(String(k)));
        } catch {
          // Fallback defensivo
        }

        // Indexar registros locales actuales por código canónico (codigo_legado) y por ID para evitar duplicar semillas
        const mapaLocalPorCodigo = new Map<string, any>();
        const mapaLocalPorId = new Map<string, any>();
        try {
          if (typeof (refDexie as any).toArray === 'function') {
            const actuales = await (refDexie as any).toArray();
            if (Array.isArray(actuales)) {
              for (const loc of actuales) {
                if (loc.id) mapaLocalPorId.set(String(loc.id), loc);
                const cod = extraerCodigoCanonico(loc);
                if (cod) mapaLocalPorCodigo.set(cod, loc);
              }
            }
          }
        } catch {
          // Tolerancia ante mocks parciales en pruebas unitarias
        }

        const idsObsoletosAEliminar: string[] = [];
        const registrosParaActualizar: any[] = [];

        for (const item of data) {
          if (!item || !item.id) continue;
          const idStr = String(item.id);
          if (idsPendientesLocales.has(idStr) || tombstonesLocalesSet.has(idStr)) continue;

          const codRemoto = extraerCodigoCanonico(item);
          const existentePorCodigo = codRemoto ? mapaLocalPorCodigo.get(codRemoto) : undefined;
          const existentePorId = mapaLocalPorId.get(idStr);
          const localPrevio = existentePorCodigo || existentePorId;

          if (localPrevio && (localPrevio.sync_status === 'pending' || localPrevio.sync_status === 'error')) {
            continue;
          }

          let registroFinal = {
            ...item,
            sync_status: 'synced' as const
          };

          if (tabla === 'actividades_personales') {
            registroFinal = sanitizarActividadInbound(item, localPrevio);
          } else if (tabla === 'subtareas_pasos') {
            registroFinal = sanitizarSubtareaInbound(item, localPrevio);
          } else if (tabla === 'hitos_wbs') {
            registroFinal = sanitizarHitoInbound(item, localPrevio, proyUuidToCod);
          } else if (tabla === 'tareas') {
            registroFinal = sanitizarTareaInbound(item, localPrevio, proyUuidToCod, hitoUuidToCod);
          } else if (existentePorCodigo && existentePorCodigo.id && existentePorCodigo.id !== item.id) {
            registroFinal = {
              ...fusionarRegistrosDuplicados(existentePorCodigo, registroFinal),
              id: item.id,
              sync_status: 'synced' as const
            };
          }

          if (existentePorCodigo && existentePorCodigo.id && existentePorCodigo.id !== item.id) {
            idsObsoletosAEliminar.push(String(existentePorCodigo.id));
          }

          // Diffing Silencioso en Memoria: Si es idéntico al local previo, no mutar Dexie
          if (localPrevio && !idsObsoletosAEliminar.includes(String(localPrevio.id))) {
            if (sonRegistrosIdenticos(registroFinal, localPrevio)) {
              continue;
            }
          }

          registrosParaActualizar.push(registroFinal);
        }

        if (idsObsoletosAEliminar.length > 0 || registrosParaActualizar.length > 0) {
          mutacionesPorTabla.push({
            tabla,
            refDexie,
            eliminar: idsObsoletosAEliminar,
            actualizar: registrosParaActualizar
          });
        }
      } catch (err) {
        console.warn(`[SyncManager] Error al sincronizar tabla descendente ${tabla}:`, err);
        summary.fallidos++;
      }
    }

    const totalMutaciones = mutacionesPorTabla.reduce(
      (acc, m) => acc + m.actualizar.length + m.eliminar.length,
      0
    );

    if (totalMutaciones > 0) {
      this.setSyncState('syncing');

      const tablasParaTransaccion = mutacionesPorTabla
        .map((m) => m.refDexie)
        .filter((ref) => ref && typeof ref.bulkPut === 'function');

      const ejecutarEscrituras = async () => {
        for (const m of mutacionesPorTabla) {
          if (m.eliminar.length > 0 && typeof (m.refDexie as any).bulkDelete === 'function') {
            await (m.refDexie as any).bulkDelete(m.eliminar);
          }
          if (m.actualizar.length > 0 && typeof (m.refDexie as any).bulkPut === 'function') {
            await (m.refDexie as any).bulkPut(m.actualizar);
            summary.descargados += m.actualizar.length;
          }
        }
      };

      try {
        if (typeof (db as any).transaction === 'function' && tablasParaTransaccion.length > 0) {
          await (db as any).transaction('rw', tablasParaTransaccion, ejecutarEscrituras);
        } else {
          await ejecutarEscrituras();
        }
      } catch (txErr) {
        console.warn('[SyncManager] Fallback a escrituras directas tras error en transacción:', txErr);
        await ejecutarEscrituras();
      }

      if (summary.descargados > 0) {
        await sanearDuplicadosDexie();
      }

      this.setSyncState('synced');
    }

    return summary;
  }

  /**
   * Procesa la cola de cambios locales pendientes hacia Supabase (Push Outbox)
   */
  public async procesarColaPendiente(): Promise<void> {
    await this.syncPendingRecords();
  }

  /**
   * Sincronización bidireccional completa:
   * 1. Push local -> nube (procesarColaPendiente)
   * 2. Pull nube -> local (descargarDatosDescendientes)
   * 3. Sincronización de fallback con el puente HTTP local 127.0.0.1:48123
   */
  public async sincronizarTodo(): Promise<void> {
    await this.procesarColaPendiente();
    const pullResult = await this.descargarDatosDescendientes();

    // Si Supabase es mock o no hubo datos remotos, hidratar desde el almacén local en disco
    if (pullResult.descargados === 0) {
      await this.cargarSnapshotDesdePuenteLocal();
    }
    // Publicar snapshot en el puente local para que la otra instancia (Electron o Web) lo reciba
    await this.guardarSnapshotEnPuenteLocal();
  }

  /**
   * Guarda un snapshot completo de las tablas operativas en el puente local HTTP 127.0.0.1:48123
   */
  public async guardarSnapshotEnPuenteLocal(): Promise<boolean> {
    if (typeof fetch === 'undefined') return false;

    try {
      const [tareas, actividades, gastos, ingresos, cuotas, proyectos, hitos, metas, hitosPlan, vinculosMeta] = await Promise.all([
        db.tareas.toArray(),
        db.actividades_personales.toArray(),
        db.gastos.toArray(),
        db.ingresos.toArray(),
        db.cuotas.toArray(),
        db.proyectos.toArray(),
        db.hitos_wbs.toArray(),
        db.metas_planes.toArray(),
        db.planes_accion_hitos.toArray(),
        db.habitos_metas_vinculos.toArray()
      ]);

      const payload = {
        version: 1,
        timestamp: Date.now(),
        data: {
          tareas,
          actividades,
          gastos,
          ingresos,
          cuotas,
          proyectos,
          hitos,
          metas,
          hitosPlan,
          vinculosMeta
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600);

      const res = await fetch('http://127.0.0.1:48123/api/sync-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      // Silencioso si Electron o el socket local no están corriendo
      return false;
    }
  }

  /**
   * Descarga e hidrata un snapshot desde el puente local HTTP 127.0.0.1:48123 hacia Dexie
   */
  public async cargarSnapshotDesdePuenteLocal(): Promise<boolean> {
    if (typeof fetch === 'undefined') return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600);

      const res = await fetch('http://127.0.0.1:48123/api/sync-data', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return false;
      const json = await res.json();
      if (!json || !json.data) return false;

      const { tareas, actividades, gastos, ingresos, cuotas, proyectos, hitos, metas, hitosPlan, vinculosMeta } = json.data;

      const obtenerKeysPendientes = async (table: any) => {
        try {
          const w = table.where('sync_status');
          const keys = typeof w.anyOf === 'function'
            ? await w.anyOf(['pending', 'error']).primaryKeys()
            : await w.equals('pending').primaryKeys();
          return new Set(keys.map((k: any) => String(k)));
        } catch {
          return new Set<string>();
        }
      };

      await db.transaction('rw', [
        db.tareas,
        db.actividades_personales,
        db.gastos,
        db.ingresos,
        db.cuotas,
        db.proyectos,
        db.hitos_wbs,
        db.metas_planes,
        db.planes_accion_hitos,
        db.habitos_metas_vinculos
      ], async () => {
        if (Array.isArray(tareas) && tareas.length > 0) {
          const pendingIds = await obtenerKeysPendientes(db.tareas);
          const toPut = tareas.filter((t) => t.id && !pendingIds.has(String(t.id)));
          if (toPut.length > 0) await db.tareas.bulkPut(toPut);
        }
        if (Array.isArray(actividades) && actividades.length > 0) {
          const pendingIds = await obtenerKeysPendientes(db.actividades_personales);
          const toPut = actividades.filter((a) => a.id && !pendingIds.has(String(a.id)));
          if (toPut.length > 0) await db.actividades_personales.bulkPut(toPut);
        }
        if (Array.isArray(gastos) && gastos.length > 0) {
          const pendingIds = await obtenerKeysPendientes(db.gastos);
          const toPut = gastos.filter((g) => g.id && !pendingIds.has(String(g.id)));
          if (toPut.length > 0) await db.gastos.bulkPut(toPut);
        }
        if (Array.isArray(ingresos) && ingresos.length > 0) {
          const pendingIds = await obtenerKeysPendientes(db.ingresos);
          const toPut = ingresos.filter((i) => i.id && !pendingIds.has(String(i.id)));
          if (toPut.length > 0) await db.ingresos.bulkPut(toPut);
        }
        if (Array.isArray(cuotas) && cuotas.length > 0) {
          const pendingIds = await obtenerKeysPendientes(db.cuotas);
          const toPut = cuotas.filter((c) => c.id && !pendingIds.has(String(c.id)));
          if (toPut.length > 0) await db.cuotas.bulkPut(toPut);
        }
        if (Array.isArray(proyectos) && proyectos.length > 0) {
          const pendingIds = await obtenerKeysPendientes(db.proyectos);
          const toPut = proyectos.filter((p) => p.id && !pendingIds.has(String(p.id)));
          if (toPut.length > 0) await db.proyectos.bulkPut(toPut);
        }
        if (Array.isArray(hitos) && hitos.length > 0) {
          const pendingIds = await obtenerKeysPendientes(db.hitos_wbs);
          const toPut = hitos.filter((h) => h.id && !pendingIds.has(String(h.id)));
          if (toPut.length > 0) await db.hitos_wbs.bulkPut(toPut);
        }
        if (Array.isArray(metas) && metas.length > 0) {
          const pendingIds = await obtenerKeysPendientes(db.metas_planes);
          const toPut = metas.filter((m) => m.id && !pendingIds.has(String(m.id)));
          if (toPut.length > 0) await db.metas_planes.bulkPut(toPut);
        }
        if (Array.isArray(hitosPlan) && hitosPlan.length > 0) {
          const pendingIds = await obtenerKeysPendientes(db.planes_accion_hitos);
          const toPut = hitosPlan.filter((hp) => hp.id && !pendingIds.has(String(hp.id)));
          if (toPut.length > 0) await db.planes_accion_hitos.bulkPut(toPut);
        }
        if (Array.isArray(vinculosMeta) && vinculosMeta.length > 0) {
          const pendingIds = await obtenerKeysPendientes(db.habitos_metas_vinculos);
          const toPut = vinculosMeta.filter((vm) => vm.id && !pendingIds.has(String(vm.id)));
          if (toPut.length > 0) await db.habitos_metas_vinculos.bulkPut(toPut);
        }
      });

      await sanearDuplicadosDexie();
      return true;
    } catch {
      return false;
    }
  }
}

export const syncManager = new SyncManager();
