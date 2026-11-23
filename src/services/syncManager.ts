import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';
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
  sanitizarTareaInbound,
  sanitizarNotaInbound
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

  // Si ambos tienen updated_at, comparar timestamp ISO con tolerancia de 2s (REQ-FIX-SYNC-CALENDAR-02)
  // para absorber el redondeo de microsegundos de PostgreSQL frente a milisegundos de JS/Dexie
  if (remoto.updated_at && local.updated_at) {
    const tRemoto = new Date(remoto.updated_at).getTime();
    const tLocal = new Date(local.updated_at).getTime();
    if (!isNaN(tRemoto) && !isNaN(tLocal) && Math.abs(tRemoto - tLocal) > 2000) {
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

    // Normalizar version por defecto (1) frente a registros locales legacy sin versión explícita
    if (k === 'version' && (valR === 1 || valR === undefined) && (valL === 1 || valL === undefined)) continue;

    return false;
  }

  return true;
}

/**
 * REQ-SYNC-40-EXEC: Determina si el entorno actual corresponde a desarrollo local o runtime de escritorio.
 * Retorna true exclusivamente si hostname es 'localhost' o '127.0.0.1', o si existe bandera de runtime Electron/Desktop.
 * En dominios web remotos (Cloudflare Pages *.pages.dev, Vercel, etc.) retorna false para suprimir llamadas infructuosas a 127.0.0.1:48123.
 */
export function esEntornoEscritorioLocal(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const hostname = window.location?.hostname || '';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isElectron = Boolean(
      (window as any).IS_DESKTOP_WIDGET === true ||
      (window as any).IS_ELECTRON_COCKPIT === true ||
      (window as any).desktopWidget ||
      (window as any).electronAPI
    );
    return isLocalhost || isElectron;
  } catch {
    return false;
  }
}

class SyncManager {
  private supabase: SupabaseClient | null = null;
  private isSyncing = false;
  private syncRequestedWhileRunning = false;
  private syncState: SyncState = 'synced';
  private listeners: Array<(state: SyncState) => void> = [];
  private currentUserId: string = DEFAULT_USER_ID;
  public currentUserUUID: string | null = DEFAULT_USER_ID;
  public authResuelto: boolean = true;
  private inicializacionPromise: Promise<void> | null = null;

  // Realtime & Anti-Eco (TTL 10s & Debounce 800ms)
  private recentlyPushedIds = new Map<string, number>();
  private realtimeChannel: any = null;
  private realtimeDebounceTimer: any = null;
  private tablasPendientesRealtime = new Set<string>();

  // Cuarentena en memoria para registros con fallos irrecuperables de Foreign Key (23503 / 409 / user_id ausente)
  // Impide bucles infinitos de reintento que saturen la red y congelen el event loop de React (REQ-DESKTOP-11)
  private registrosFkCuarentena = new Set<string>();

  // Circuit Breaker de Reintentos en Memoria (REQ-HARDENING-P0-01)
  // Limita a 3 reintentos consecutivos los fallos individuales por registro para evitar bucles infinitos de red
  public static readonly MAX_RETRY_COUNT = 3;
  private recordRetryCount = new Map<string, number>();

  // Cooldown de sincronización por ciclo de vida (focus / visibilitychange) para erradicar micro-parpadeos (REQ-FIX-SYNC-CALENDAR-02)
  private ultimaSyncPorFocoMs = 0;
  private readonly COOLDOWN_FOCO_MS = 60_000;

  constructor() {
    this.initSupabaseClient();
    this.setupNetworkListeners();
    this.setupRealtimeSubscriptions();
    this.inicializacionPromise = this.resolverUsuarioActivo().then(() => { }).catch(() => { });
  }

  /**
   * REQ-SYNC-PROD-14-FIX: Bypass Absoluto de Auth (Modo Local-First).
   * Asigna y retorna de forma síncrona el UUID dummy '00000000-0000-0000-0000-000000000001'
   * a this.currentUserUUID y this.currentUserId, resolviendo true inmediatamente sin bloquear con getSession().
   */
  public async resolverUsuarioActivo(_force: boolean = false): Promise<string> {
    const dummyId = DEFAULT_USER_ID;
    this.currentUserUUID = dummyId;
    this.currentUserId = dummyId;
    this.authResuelto = true;
    return dummyId;
  }

  /**
   * REQ-SYNC-40-EXEC: Espera de forma no bloqueante a que concluya la resolución inicial de autenticación
   * y cualquier sincronización o descarga en vuelo antes de hidratar o auto-promover metas.
   */
  public async esperarSincronizacionInicial(timeoutMs: number = 2000): Promise<void> {
    const inicio = Date.now();
    if (this.inicializacionPromise) {
      try {
        await Promise.race([
          this.inicializacionPromise,
          new Promise((resolve) => setTimeout(resolve, timeoutMs))
        ]);
      } catch (err) {
        console.debug('[SyncManager] Timeout o excepción esperando sincronización inicial:', err);
      }
    }
    while (this.isSyncing && Date.now() - inicio < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
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
      this.currentUserUUID = userId;
      this.authResuelto = true;
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

  /**
   * REQ-SYNC-PROD-17-FIX: Manejo unificado de errores Foreign Key (23503 / 409).
   * Si el error contiene _id_fkey y no es user_id_fkey, significa que el registro local es un huérfano
   * que apunta a un padre inexistente en la nube.
   * En lugar de retenerlo en 'quarantined', ejecuta una eliminación física de Dexie.
   */
  public async gestionarFkError(
    tabla: string,
    registroId: string,
    codigoLegado: string,
    error: any
  ): Promise<void> {
    const errorStr = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
    const esHuerfano = !errorStr.includes('user_id_fkey') && errorStr.includes('_id_fkey');

    if (esHuerfano) {
      console.warn(`[SyncManager] Registro huérfano purgado automáticamente en tabla ${tabla}`);
      const tableRef = (db as any)[tabla];
      if (tableRef && typeof tableRef.delete === 'function') {
        try {
          await tableRef.delete(registroId);
        } catch (delErr) {
          console.error(`[SyncManager] Error purgando registro huérfano en ${tabla}:`, delErr);
        }
      }
      this.registrosFkCuarentena.delete(registroId);
    } else {
      console.warn(`[SyncManager] Violación FK/409 en ${tabla} ${codigoLegado}. Cuarentena definitiva en Dexie:`, error?.message || error);
      this.registrosFkCuarentena.add(registroId);
      const tableRef = (db as any)[tabla];
      if (tableRef && typeof tableRef.update === 'function') {
        try {
          await tableRef.update(registroId, { sync_status: 'quarantined' });
        } catch (updErr) {
          console.error(`[SyncManager] Error marcando cuarentena en ${tabla}:`, updErr);
        }
      }
    }
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

  /**
   * Detecta errores 404 / PGRST205 de PostgREST cuando una tabla no está desplegada en el schema remoto.
   */
  public esErrorTablaInexistente(error: any): boolean {
    if (!error) return false;
    const status = Number(error.status || error.statusCode || 0);
    const code = String(error.code || '').toUpperCase();
    const msg = String(error.message || '').toLowerCase();
    const details = String(error.details || '').toLowerCase();
    return (
      status === 404 ||
      code === 'PGRST205' ||
      msg.includes('schema cache') ||
      msg.includes('could not find the table') ||
      details.includes('could not find the table')
    );
  }

  public limpiarTablasInexistentes(): void {
    this.tablasInexistentesSupabase.clear();
    if (!this.syncFinanzasRemotoHabilitado) {
      this.tablasInexistentesSupabase.add('gastos');
      this.tablasInexistentesSupabase.add('ingresos');
      this.tablasInexistentesSupabase.add('cuotas');
    }
  }

  private registrarTablaInexistente(tabla: string): void {
    if (tabla === 'configuracion_usuario' || tabla === 'proyectos' || tabla === 'hitos_wbs' || tabla === 'tareas' || tabla === 'notas') {
      // REQ-SYNC-PROD-11-FIX: Las tablas canónicas de la suite PMO no se bloquean permanentemente en caliente
      return;
    }
    this.tablasInexistentesSupabase.add(tabla);
    if (tabla === 'gastos' || tabla === 'ingresos' || tabla === 'cuotas') {
      this.syncFinanzasRemotoHabilitado = false;
    }
  }

  private debeOmitirTablaRemota(tabla: string): boolean {
    if (tabla === 'configuracion_usuario') {
      return false;
    }
    if (tabla === 'gastos' || tabla === 'ingresos' || tabla === 'cuotas') {
      return !this.syncFinanzasRemotoHabilitado && this.tablasInexistentesSupabase.has(tabla);
    }
    return this.tablasInexistentesSupabase.has(tabla);
  }

  public limpiarCuarentenaFk(): void {
    this.registrosFkCuarentena.clear();
  }

  /**
   * REQ-SYNC-PROD-15-FIX: Auto-Recuperación de Cuarentena FK.
   * Rescata registros bloqueados previamente por errores 23503/409 en Dexie,
   * restaurando su sync_status a 'pending' para reintentar su sincronización en Supabase.
   */
  public async liberarRegistrosCuarentena(): Promise<void> {
    const tablas = [
      'metas_planes',
      'proyectos',
      'hitos_wbs',
      'tareas',
      'notas',
      'gastos',
      'ingresos',
      'actividades_personales',
      'subtareas',
      'subtareas_pasos',
      'planes_accion_hitos',
      'habitos_metas_vinculos',
      'configuracion_usuario'
    ];
    for (const t of tablas) {
      const tableRef = (db as any)[t];
      if (tableRef && typeof tableRef.where === 'function') {
        try {
          const query = tableRef.where('sync_status');
          if (query && typeof query.equals === 'function') {
            const eq = query.equals('quarantined');
            if (eq && typeof eq.modify === 'function') {
              await eq.modify({ sync_status: 'pending' });
            }
          }
        } catch {
          // Ignorar si la tabla o índice no está listo en el entorno
        }
      }
    }
    this.registrosFkCuarentena.clear();
  }

  public estaEnCuarentenaFk(id: string): boolean {
    return this.registrosFkCuarentena.has(id);
  }

  /**
   * REQ-ARCH-75-EXEC: Detecta fallos de conectividad, caída de sockets o timeouts de red
   */
  public esErrorDeRed(error: any): boolean {
    if (!error) return false;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
    const msg = String(error.message || error || '').toLowerCase();
    const details = String(error.details || '').toLowerCase();
    return (
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('connection_closed') ||
      msg.includes('err_connection') ||
      msg.includes('timeout') ||
      msg.includes('abort') ||
      details.includes('network') ||
      details.includes('connection')
    );
  }

  private initSupabaseClient() {
    try {
      this.supabase = getSupabase();
      if (this.supabase?.auth && typeof this.supabase.auth.onAuthStateChange === 'function') {
        try {
          this.supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user?.id && isUuid(session.user.id)) {
              this.setUserId(session.user.id);
            }
          });
        } catch (err) {
          console.warn('[SyncManager] Error al suscribir onAuthStateChange:', err);
        }
      }
    } catch (err) {
      console.warn('[SyncManager] Error al inicializar cliente Supabase:', err);
    }
  }

  public getSupabaseClient(): SupabaseClient | null {
    return this.supabase;
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    // Reconexión Bidireccional Atómica: PULL primero y continuación a PUSH con aislamiento de fallos parciales (REQ-SYNC-PROD-08-FIX)
    window.addEventListener('online', async () => {
      console.log('[SyncManager] Conexión restablecida. Disparando sincronización bidireccional...');
      this.limpiarTablasInexistentes();
      this.setSyncState('syncing');
      this.reconectarRealtimeSiEsNecesario();
      try {
        const pullResult = await this.descargarDatosDescendientes();
        if (pullResult.fallidos > 0) {
          console.warn(`[SyncManager] Pull de reconexión registró ${pullResult.fallidos} tabla(s) fallida(s). Continuando hacia push pendiente.`);
        }
        await this.syncPendingRecords();
      } catch (err) {
        console.error('[SyncManager] Error en sincronización de reconexión:', err);
      }
    });

    window.addEventListener('offline', () => {
      console.log('[SyncManager] Sin conexión. Modo offline activo.');
      this.setSyncState('offline');
    });

    // Sincronización periódica cada 45 segundos si hay conexión (Blindaje contra pestañas en segundo plano REQ-FIX-08 y REQ-SYNC-PROD-08-FIX)
    setInterval(async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine && !this.isSyncing) {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return;
        }
        try {
          const pullResult = await this.descargarDatosDescendientes();
          if (pullResult.fallidos > 0) {
            console.warn(`[SyncManager] Pull periódico registró ${pullResult.fallidos} tabla(s) fallida(s). Continuando hacia push pendiente.`);
          }
          await this.syncPendingRecords();
        } catch (err) {
          console.warn('[SyncManager] Error en intervalo periódico:', err);
        }
      }
    }, 45000);

    // REQ-ARCH-75-EXEC / REQ-FIX-SYNC-CALENDAR-02: Refresco por Ciclo de Vida con Throttle (Cooldown de 60s)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          const ahora = Date.now();
          if (ahora - this.ultimaSyncPorFocoMs >= this.COOLDOWN_FOCO_MS) {
            this.ultimaSyncPorFocoMs = ahora;
            this.reconectarRealtimeSiEsNecesario();
            this.sincronizarTodo().catch((err) => {
              console.warn('[SyncManager] Error al sincronizar en visibilitychange:', err);
            });
          }
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        const ahora = Date.now();
        if (ahora - this.ultimaSyncPorFocoMs >= this.COOLDOWN_FOCO_MS) {
          this.ultimaSyncPorFocoMs = ahora;
          this.reconectarRealtimeSiEsNecesario();
          this.sincronizarTodo().catch((err) => {
            console.warn('[SyncManager] Error al sincronizar en window focus:', err);
          });
        }
      });
    }
  }

  /**
   * Configura las suscripciones WebSocket selectivas (Supabase Realtime)
   * REQ-SYNC-41-EXEC: Monitorea las 12 entidades operativas para paridad multi-dispositivo en tiempo real.
   */
  public setupRealtimeSubscriptions() {
    if (!this.supabase || typeof this.supabase.channel !== 'function') return;
    if (import.meta.env.VITE_SUPABASE_URL?.includes('mock')) return;

    try {
      const tablasMonitoreadas = [
        'proyectos',
        'hitos_wbs',
        'tareas',
        'actividades_personales',
        'subtareas_pasos',
        'notas',
        'metas_planes',
        'planes_accion_hitos',
        'habitos_metas_vinculos',
        'gastos',
        'ingresos',
        'cuotas',
        'configuracion_usuario'
      ];
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
   * Manejador de eventos entrantes de Realtime con Filtro Anti-Eco, Inyección Inmediata Zero-Delay (REQ-SYNC-PROD-11-FIX),
   * Borrado Físico Propagado y Trailing-Edge Debounce secundario para integridad relacional.
   */
  public handleRealtimeChange(tabla: string, payload: any) {
    const recordId = payload?.new?.id || payload?.old?.id;

    // 1. Filtro Anti-Eco: si el registro fue empujado recientemente por este cliente, se ignora
    if (this.esEcoLocal(recordId)) {
      return;
    }

    const targetTable = payload?.table || tabla;
    const eventType = payload?.eventType || payload?.event;

    // REQ-SYNC-41-EXEC / REQ-SYNC-PROD-11-FIX: Propagación inmediata de DELETE para erradicar registros fantasma en todos los nodos
    if (eventType === 'DELETE') {
      const delId = payload?.old?.id || payload?.new?.id;
      if (delId) {
        if ((db as any)[targetTable] && typeof (db as any)[targetTable].delete === 'function') {
          (db as any)[targetTable].delete(delId).catch(() => { });
        }
        const nowIso = new Date().toISOString();
        if (db.tombstones && typeof db.tombstones.put === 'function') {
          db.tombstones.put({
            id: delId,
            tabla: targetTable,
            tabla_afectada: targetTable,
            deleted_at: nowIso,
            fecha_eliminacion: nowIso,
            sync_status: 'synced'
          } as any).catch(() => { });
        }
        if (db.sync_deletions && typeof db.sync_deletions.put === 'function') {
          db.sync_deletions.put({
            id: delId,
            tabla: targetTable,
            deleted_at: nowIso,
            sync_status: 'synced'
          } as any).catch(() => { });
        }
      }
      return;
    }

    // PASO 1 - Inyección Inmediata en Dexie (Zero-Delay) ante INSERT o UPDATE
    if (payload?.new && (eventType === 'INSERT' || eventType === 'UPDATE')) {
      const rawNew = payload.new;
      const refDexie = (db as any)[targetTable];
      if (refDexie && typeof refDexie.put === 'function') {
        try {
          let registroSanitizado: any = {
            ...rawNew,
            sync_status: 'synced' as const
          };

          if (targetTable === 'notas') {
            registroSanitizado = sanitizarNotaInbound(rawNew);
          } else if (targetTable === 'actividades_personales') {
            registroSanitizado = sanitizarActividadInbound(rawNew);
          } else if (targetTable === 'subtareas_pasos') {
            registroSanitizado = sanitizarSubtareaInbound(rawNew);
          } else if (targetTable === 'hitos_wbs') {
            registroSanitizado = sanitizarHitoInbound(rawNew);
          } else if (targetTable === 'tareas') {
            registroSanitizado = sanitizarTareaInbound(rawNew);
          } else if (targetTable === 'configuracion_usuario') {
            registroSanitizado = {
              id: String(rawNew.id),
              codigo_legado: rawNew.codigo_legado ? String(rawNew.codigo_legado) : String(rawNew.id),
              valor: rawNew.valor !== undefined && rawNew.valor !== null ? rawNew.valor : {},
              updated_at: rawNew.updated_at || new Date().toISOString(),
              sync_status: 'synced' as const
            };
          }

          // Ejecución inmediata en Dexie para despertar useLiveQuery sin latencia (0ms)
          refDexie.put(registroSanitizado).catch((putErr: any) => {
            console.warn(`[SyncManager] Aviso al inyectar realtime ${targetTable}:`, putErr);
          });
        } catch (prepErr) {
          console.warn(`[SyncManager] Error preparando registro realtime ${targetTable}:`, prepErr);
        }
      }
    }

    // 2. Acumular la tabla afectada para pull de INSERT / UPDATE (Fallback secundario para integridad)
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
      } catch (err) {
        console.debug('[SyncManager] Excepción al desuscribir canal Realtime:', err);
      }
      this.realtimeChannel = null;
    }
  }

  /**
   * REQ-MOBILE-47-EXEC: Reconecta proactivamente las suscripciones de Supabase Realtime
   * si el canal se cerró silenciosamente por suspensión de pestañas en móvil, timeout o reconexión de red.
   */
  public reconectarRealtimeSiEsNecesario(): void {
    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) return;
    const channelState = this.realtimeChannel?.state;
    if (!this.realtimeChannel || channelState !== 'joined') {
      if (import.meta.env.DEV) {
        console.log(`[SyncManager] Canal Realtime en estado "${channelState || 'null'}". Reconectando suscripciones...`);
      }
      this.destroyRealtimeSubscriptions();
      this.setupRealtimeSubscriptions();
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
   * Obtiene la cantidad de reintentos consecutivos acumulados por un registro en la sesión.
   */
  public getRecordRetryCount(id: string): number {
    return this.recordRetryCount.get(String(id)) || 0;
  }

  /**
   * Reinicia el conteo de reintentos de un registro (o de todos si no se pasa id).
   */
  public resetRecordRetryCount(id?: string): void {
    if (id) {
      this.recordRetryCount.delete(String(id));
    } else {
      this.recordRetryCount.clear();
    }
  }

  /**
   * Registra un fallo de sincronización por registro e incrementa su contador de reintentos.
   * Si alcanza MAX_RETRY_COUNT (3), activa el circuit breaker y loguea una advertencia.
   */
  public registrarFalloRegistro(id: string, tabla?: string, _err?: any): void {
    if (!id) return;
    const key = String(id);
    const count = (this.recordRetryCount.get(key) || 0) + 1;
    this.recordRetryCount.set(key, count);
    if (count >= SyncManager.MAX_RETRY_COUNT) {
      console.warn(
        `[SyncManager] Circuit Breaker: El registro ${tabla || 'entidad'} (${key}) alcanzó ` +
        `${count} reintentos fallidos consecutivos. Se omite temporalmente del ciclo automático.`
      );
    }
  }

  /**
   * Limpia el contador de reintentos al tener éxito la sincronización de un registro.
   */
  public registrarExitoRegistro(id: string): void {
    if (!id) return;
    this.recordRetryCount.delete(String(id));
  }

  /**
   * Resuelve registros en cola de sincronización ('pending' o 'error' para reintentos con backoff).
   * Compatible con mocks de pruebas unitarias que sólo implementen .equals().
   * Descarta permanentemente registros en estado 'quarantined' (REQ-WEB-01), en registrosFkCuarentena
   * o que hayan alcanzado el umbral MAX_RETRY_COUNT (3) del Circuit Breaker (REQ-HARDENING-P0-01).
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
      if (r.id && (this.recordRetryCount.get(String(r.id)) || 0) >= SyncManager.MAX_RETRY_COUNT) {
        return false;
      }
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
   * REQ-SYNC-PROD-06-FIX: Reconcilia el Primary Key 'id' (UUID) con la fila remota en Supabase
   * antes de ejecutar .upsert(..., { onConflict: 'codigo_legado' }).
   * Si el registro ya existe en la nube con un UUID distinto, conserva el UUID remoto
   * para evitar errores 409 Conflict / 23503 por intento de sobrescribir una Primary Key existente.
   */
  private async reconciliarPayloadIdRemoto<T extends { id?: string; codigo_legado?: string }>(
    tabla: string,
    payload: T
  ): Promise<T> {
    if (!this.supabase || !payload?.codigo_legado) return payload;
    if (import.meta.env.VITE_SUPABASE_URL?.includes('mock')) return payload;
    if (this.debeOmitirTablaRemota(tabla)) return payload;

    try {
      const tableQuery = this.supabase.from(tabla);
      if (typeof tableQuery.select !== 'function') return payload;

      const selectBuilder = tableQuery.select('id');
      if (!selectBuilder || typeof selectBuilder.eq !== 'function') return payload;

      const eqBuilder = selectBuilder.eq('codigo_legado', payload.codigo_legado);
      if (!eqBuilder || typeof eqBuilder.maybeSingle !== 'function') return payload;

      const { data: remoto, error } = await eqBuilder.maybeSingle();
      if (error) {
        if (this.esErrorTablaInexistente(error)) {
          this.registrarTablaInexistente(tabla);
        }
        return payload;
      }

      if (remoto?.id && isUuid(remoto.id)) {
        return { ...payload, id: remoto.id };
      }
    } catch {
      // Tolerar mocks de pruebas unitarias que solo implementan .upsert()
    }
    return payload;
  }

  // ============================================================================
  // MÉTODOS MODULARES DE REPLICACIÓN PUSH (13 ENTIDADES OPERATIVAS)
  // ============================================================================

  /**
   * 0. Sincroniza lápidas de registros eliminados hacia Supabase (Tombstones Push / sync_deletions)
   * Previene resurrección remota y garantiza la consistencia del borrado físico (REQ-BUGFIX-74-EXEC).
   */
  public async sincronizarTombstones(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    if (!db.tombstones && !db.sync_deletions) return result;

    const pendingMap = new Map<string, TombstoneRecord>();

    if (db.tombstones && typeof db.tombstones.toArray === 'function') {
      const pendingTomb = await this.obtenerRegistrosPendientes<TombstoneRecord>(db.tombstones);
      pendingTomb.forEach((t) => pendingMap.set(t.id, t));
    }

    if (db.sync_deletions && typeof db.sync_deletions.toArray === 'function') {
      const pendingDels = await this.obtenerRegistrosPendientes<TombstoneRecord>(db.sync_deletions);
      pendingDels.forEach((t) => {
        if (!pendingMap.has(t.id)) {
          pendingMap.set(t.id, t);
        }
      });
    }

    const pending = Array.from(pendingMap.values());
    if (pending.length === 0) return result;

    const limpiarColaLocal = async (id: string) => {
      if (db.sync_deletions && typeof db.sync_deletions.delete === 'function') {
        await db.sync_deletions.delete(id).catch(() => { });
      }
    };

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all([
        ...pending.map((t) => (db.tombstones && typeof db.tombstones.update === 'function' ? db.tombstones.update(t.id, { sync_status: 'synced' }).catch(() => { }) : Promise.resolve())),
        ...pending.map((t) => limpiarColaLocal(t.id))
      ]);
      result.success = pending.length;
      return result;
    }

    for (const tombstone of pending) {
      if (this.debeOmitirTablaRemota(tombstone.tabla)) {
        if (db.tombstones && typeof db.tombstones.update === 'function') await db.tombstones.update(tombstone.id, { sync_status: 'synced' }).catch(() => { });
        await limpiarColaLocal(tombstone.id);
        result.success++;
        continue;
      }
      try {
        this.registrarPushedId(tombstone.id);
        const { error } = await this.supabase
          .from(tombstone.tabla)
          .delete()
          .eq('id', tombstone.id);

        if (error) {
          if (this.esErrorTablaInexistente(error)) {
            this.registrarTablaInexistente(tombstone.tabla);
            if (db.tombstones && typeof db.tombstones.update === 'function') await db.tombstones.update(tombstone.id, { sync_status: 'synced' }).catch(() => { });
            await limpiarColaLocal(tombstone.id);
            result.success++;
          } else {
            console.error(
              `[SyncManager] Error al sincronizar tombstone en Supabase (${tombstone.tabla}:${tombstone.id}):`,
              error
            );
            if (db.tombstones && typeof db.tombstones.update === 'function') await db.tombstones.update(tombstone.id, { sync_status: 'error' }).catch(() => { });
            this.registrarFalloRegistro(tombstone.id, 'tombstones', error);
            result.failed++;
          }
        } else {
          this.registrarExitoRegistro(tombstone.id);
          if (db.tombstones && typeof db.tombstones.update === 'function') await db.tombstones.update(tombstone.id, { sync_status: 'synced' }).catch(() => { });
          await limpiarColaLocal(tombstone.id);
          result.success++;
        }
      } catch (err) {
        if (this.esErrorTablaInexistente(err)) {
          this.registrarTablaInexistente(tombstone.tabla);
          if (db.tombstones && typeof db.tombstones.update === 'function') await db.tombstones.update(tombstone.id, { sync_status: 'synced' }).catch(() => { });
          await limpiarColaLocal(tombstone.id);
          result.success++;
        } else {
          console.error(
            `[SyncManager] Excepción al sincronizar tombstone (${tombstone.tabla}:${tombstone.id}):`,
            err
          );
          if (db.tombstones && typeof db.tombstones.update === 'function') await db.tombstones.update(tombstone.id, { sync_status: 'error' }).catch(() => { });
          this.registrarFalloRegistro(tombstone.id, 'tombstones', err);
          result.failed++;
        }
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
        const rawPayload = sanitizarProyectoPayload(proy, this.currentUserId);
        const payload = await this.reconciliarPayloadIdRemoto('proyectos', rawPayload);
        this.registrarPushedId(proy.id);
        if (payload.id) this.registrarPushedId(payload.id);
        const { error } = await this.supabase
          .from('proyectos')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            await this.gestionarFkError('proyectos', proy.id, proy.codigo_legado, error);
          } else {
            console.error('[SyncManager] Error al sincronizar proyecto:', proy.codigo_legado, error);
            await db.proyectos.update(proy.id, { sync_status: 'error' });
          }
          this.registrarFalloRegistro(proy.id, 'proyectos', error);
          result.failed++;
        } else {
          this.registrarExitoRegistro(proy.id);
          await db.proyectos.update(proy.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          await this.gestionarFkError('proyectos', proy.id, proy.codigo_legado, err);
        } else {
          console.error('[SyncManager] Excepción al sincronizar proyecto:', proy.codigo_legado, err);
          await db.proyectos.update(proy.id, { sync_status: 'error' });
        }
        this.registrarFalloRegistro(proy.id, 'proyectos', err);
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
        const rawPayload = sanitizarHitoPayload(hito, map, this.currentUserId);
        if (!rawPayload.proyecto_id) {
          console.warn('[SyncManager] Hito sin proyecto_id UUID resuelto, cuarentena en Dexie:', hito.codigo_legado);
          this.registrosFkCuarentena.add(hito.id);
          await db.hitos_wbs.update(hito.id, { sync_status: 'quarantined' });
          result.failed++;
          continue;
        }

        const payload = await this.reconciliarPayloadIdRemoto('hitos_wbs', rawPayload);
        this.registrarPushedId(hito.id);
        if (payload.id) this.registrarPushedId(payload.id);
        const { error } = await this.supabase
          .from('hitos_wbs')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            await this.gestionarFkError('hitos_wbs', hito.id, hito.codigo_legado, error);
          } else {
            console.error('[SyncManager] Error al sincronizar hito:', hito.codigo_legado, error);
            await db.hitos_wbs.update(hito.id, { sync_status: 'error' });
          }
          this.registrarFalloRegistro(hito.id, 'hitos_wbs', error);
          result.failed++;
        } else {
          this.registrarExitoRegistro(hito.id);
          await db.hitos_wbs.update(hito.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          await this.gestionarFkError('hitos_wbs', hito.id, hito.codigo_legado, err);
        } else {
          console.error('[SyncManager] Excepción al sincronizar hito:', hito.codigo_legado, err);
          await db.hitos_wbs.update(hito.id, { sync_status: 'error' });
        }
        this.registrarFalloRegistro(hito.id, 'hitos_wbs', err);
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
    const tMap = await this.construirMapaTareas().catch(() => new Map<string, string>());

    for (const tarea of pending) {
      if (this.registrosFkCuarentena.has(tarea.id)) {
        continue;
      }
      try {
        const rawPayload = sanitizarTareaPayload(tarea, pMap, hMap, this.currentUserId, tMap);
        if (!rawPayload.proyecto_id || !rawPayload.hito_id) {
          console.warn('[SyncManager] Tarea sin proyecto_id o hito_id UUID resuelto, cuarentena en Dexie:', tarea.codigo_legado);
          this.registrosFkCuarentena.add(tarea.id);
          await db.tareas.update(tarea.id, { sync_status: 'quarantined' });
          result.failed++;
          continue;
        }

        const payload = await this.reconciliarPayloadIdRemoto('tareas', rawPayload);
        this.registrarPushedId(tarea.id);
        if (payload.id) this.registrarPushedId(payload.id);
        const { error } = await this.supabase
          .from('tareas')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            await this.gestionarFkError('tareas', tarea.id, tarea.codigo_legado, error);
          } else {
            console.error('[SyncManager] Error al sincronizar tarea:', tarea.codigo_legado, error);
            await db.tareas.update(tarea.id, { sync_status: 'error' });
          }
          this.registrarFalloRegistro(tarea.id, 'tareas', error);
          result.failed++;
        } else {
          this.registrarExitoRegistro(tarea.id);
          await db.tareas.update(tarea.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          await this.gestionarFkError('tareas', tarea.id, tarea.codigo_legado, err);
        } else {
          console.error('[SyncManager] Excepción al sincronizar tarea:', tarea.codigo_legado, err);
          await db.tareas.update(tarea.id, { sync_status: 'error' });
        }
        this.registrarFalloRegistro(tarea.id, 'tareas', err);
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
        const rawPayload = sanitizarActividadPayload(act, this.currentUserId);
        const payload = await this.reconciliarPayloadIdRemoto('actividades_personales', rawPayload);
        this.registrarPushedId(act.id);
        if (payload.id) this.registrarPushedId(payload.id);
        const { error } = await this.supabase
          .from('actividades_personales')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            await this.gestionarFkError('actividades_personales', act.id, act.codigo_legado, error);
          } else {
            console.error('[SyncManager] Error al sincronizar actividad:', act.codigo_legado, error);
            await db.actividades_personales.update(act.id, { sync_status: 'error' });
          }
          this.registrarFalloRegistro(act.id, 'actividades_personales', error);
          result.failed++;
        } else {
          this.registrarExitoRegistro(act.id);
          await db.actividades_personales.update(act.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          await this.gestionarFkError('actividades_personales', act.id, act.codigo_legado, err);
        } else {
          console.error('[SyncManager] Excepción al sincronizar actividad:', act.codigo_legado, err);
          await db.actividades_personales.update(act.id, { sync_status: 'error' });
        }
        this.registrarFalloRegistro(act.id, 'actividades_personales', err);
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
        const rawPayload = sanitizarSubtareaPayload(sub, tMap, aMap, this.currentUserId);
        if (!rawPayload.tarea_id && !rawPayload.actividad_id) {
          console.warn('[SyncManager] Subtarea sin padre UUID resuelto, cuarentena en Dexie:', sub.codigo_legado);
          this.registrosFkCuarentena.add(sub.id);
          await db.subtareas_pasos.update(sub.id, { sync_status: 'quarantined' });
          result.failed++;
          continue;
        }

        const payload = await this.reconciliarPayloadIdRemoto('subtareas_pasos', rawPayload);
        this.registrarPushedId(sub.id);
        if (payload.id) this.registrarPushedId(payload.id);
        const { error } = await this.supabase
          .from('subtareas_pasos')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            await this.gestionarFkError('subtareas_pasos', sub.id, sub.codigo_legado, error);
          } else {
            console.error('[SyncManager] Error al sincronizar subtarea:', sub.codigo_legado, error);
            await db.subtareas_pasos.update(sub.id, { sync_status: 'error' });
          }
          this.registrarFalloRegistro(sub.id, 'subtareas_pasos', error);
          result.failed++;
        } else {
          this.registrarExitoRegistro(sub.id);
          await db.subtareas_pasos.update(sub.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          await this.gestionarFkError('subtareas_pasos', sub.id, sub.codigo_legado, err);
        } else {
          console.error('[SyncManager] Excepción al sincronizar subtarea:', sub.codigo_legado, err);
          await db.subtareas_pasos.update(sub.id, { sync_status: 'error' });
        }
        this.registrarFalloRegistro(sub.id, 'subtareas_pasos', err);
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
        const rawPayload = sanitizarMetaPlanPayload(meta, this.currentUserId);
        const payload = await this.reconciliarPayloadIdRemoto('metas_planes', rawPayload);
        this.registrarPushedId(meta.id);
        if (payload.id) this.registrarPushedId(payload.id);
        const { error } = await this.supabase
          .from('metas_planes')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            await this.gestionarFkError('metas_planes', meta.id, meta.codigo_legado, error);
          } else {
            console.error('[SyncManager] Error al sincronizar meta:', meta.codigo_legado, error);
            await db.metas_planes.update(meta.id, { sync_status: 'error' });
          }
          this.registrarFalloRegistro(meta.id, 'metas_planes', error);
          result.failed++;
        } else {
          this.registrarExitoRegistro(meta.id);
          await db.metas_planes.update(meta.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          await this.gestionarFkError('metas_planes', meta.id, meta.codigo_legado, err);
        } else {
          console.error('[SyncManager] Excepción al sincronizar meta:', meta.codigo_legado, err);
          await db.metas_planes.update(meta.id, { sync_status: 'error' });
        }
        this.registrarFalloRegistro(meta.id, 'metas_planes', err);
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
        const rawPayload = sanitizarHitoPlanPayload(hito, mMap, this.currentUserId);
        if (!rawPayload.meta_id) {
          console.warn('[SyncManager] Hito de plan sin meta_id UUID resuelto, cuarentena en Dexie:', hito.codigo_legado);
          this.registrosFkCuarentena.add(hito.id);
          await db.planes_accion_hitos.update(hito.id, { sync_status: 'quarantined' });
          result.failed++;
          continue;
        }

        const payload = await this.reconciliarPayloadIdRemoto('planes_accion_hitos', rawPayload);
        this.registrarPushedId(hito.id);
        if (payload.id) this.registrarPushedId(payload.id);
        const { error } = await this.supabase
          .from('planes_accion_hitos')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            await this.gestionarFkError('planes_accion_hitos', hito.id, hito.codigo_legado, error);
          } else {
            console.error('[SyncManager] Error al sincronizar hito de plan:', hito.codigo_legado, error);
            await db.planes_accion_hitos.update(hito.id, { sync_status: 'error' });
          }
          this.registrarFalloRegistro(hito.id, 'planes_accion_hitos', error);
          result.failed++;
        } else {
          this.registrarExitoRegistro(hito.id);
          await db.planes_accion_hitos.update(hito.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          await this.gestionarFkError('planes_accion_hitos', hito.id, hito.codigo_legado, err);
        } else {
          console.error('[SyncManager] Excepción al sincronizar hito de plan:', hito.codigo_legado, err);
          await db.planes_accion_hitos.update(hito.id, { sync_status: 'error' });
        }
        this.registrarFalloRegistro(hito.id, 'planes_accion_hitos', err);
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
          .upsert(payload, { onConflict: 'habito_id,meta_id' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            await this.gestionarFkError('habitos_metas_vinculos', vinculo.id, vinculo.id, error);
          } else {
            console.error('[SyncManager] Error al sincronizar vínculo hábito-meta:', vinculo.id, error);
            await db.habitos_metas_vinculos.update(vinculo.id, { sync_status: 'error' });
          }
          this.registrarFalloRegistro(vinculo.id, 'habitos_metas_vinculos', error);
          result.failed++;
        } else {
          this.registrarExitoRegistro(vinculo.id);
          await db.habitos_metas_vinculos.update(vinculo.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          await this.gestionarFkError('habitos_metas_vinculos', vinculo.id, vinculo.id, err);
        } else {
          console.error('[SyncManager] Excepción al sincronizar vínculo hábito-meta:', vinculo.id, err);
          await db.habitos_metas_vinculos.update(vinculo.id, { sync_status: 'error' });
        }
        this.registrarFalloRegistro(vinculo.id, 'habitos_metas_vinculos', err);
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Helper compartido para tablas financieras opcionales ('gastos', 'ingresos', 'cuotas')
   * con aislamiento automático ante 404 / PGRST205 y preservación local-first en Dexie.
   */
  private async sincronizarTablaFinancieraOpcional(
    tabla: 'gastos' | 'ingresos' | 'cuotas',
    etiquetaSingular: string,
    refDexie: any,
    sanitizar: (item: any, userId: string) => any
  ): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    if (this.debeOmitirTablaRemota(tabla)) {
      return result;
    }

    const pending = await this.obtenerRegistrosPendientes<any>(refDexie);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(pending.map((item) => refDexie.update(item.id, { sync_status: 'synced' })));
      result.success = pending.length;
      return result;
    }

    for (const item of pending) {
      if (this.registrosFkCuarentena.has(item.id)) {
        continue;
      }
      try {
        const rawPayload = sanitizar(item, this.currentUserId);
        const payload = await this.reconciliarPayloadIdRemoto(tabla, rawPayload);
        this.registrarPushedId(item.id);
        if (payload.id) this.registrarPushedId(payload.id);
        const { error } = await this.supabase
          .from(tabla)
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorTablaInexistente(error)) {
            this.registrarTablaInexistente(tabla);
            break;
          }
          if (this.esErrorFkNoRecuperable(error)) {
            await this.gestionarFkError(tabla, item.id, item.codigo_legado, error);
          } else {
            console.error(`[SyncManager] Error al sincronizar ${etiquetaSingular}:`, item.codigo_legado, error);
            await refDexie.update(item.id, { sync_status: 'error' });
          }
          this.registrarFalloRegistro(item.id, tabla, error);
          result.failed++;
        } else {
          this.registrarExitoRegistro(item.id);
          await refDexie.update(item.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorTablaInexistente(err)) {
          this.registrarTablaInexistente(tabla);
          break;
        }
        if (this.esErrorFkNoRecuperable(err)) {
          await this.gestionarFkError(tabla, item.id, item.codigo_legado, err);
        } else {
          console.error(`[SyncManager] Excepción al sincronizar ${etiquetaSingular}:`, item.codigo_legado, err);
          await refDexie.update(item.id, { sync_status: 'error' });
        }
        this.registrarFalloRegistro(item.id, tabla, err);
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 9. Sincroniza gastos financieros con LWW
   */
  public sincronizarGastos(): Promise<SyncResult> {
    return this.sincronizarTablaFinancieraOpcional('gastos', 'gasto', db.gastos, sanitizarGastoPayload);
  }

  /**
   * 10. Sincroniza ingresos financieros con LWW
   */
  public sincronizarIngresos(): Promise<SyncResult> {
    return this.sincronizarTablaFinancieraOpcional('ingresos', 'ingreso', db.ingresos, sanitizarIngresoPayload);
  }

  /**
   * 11. Sincroniza cuotas y compromisos de financiamiento con LWW
   */
  public sincronizarCuotas(): Promise<SyncResult> {
    return this.sincronizarTablaFinancieraOpcional('cuotas', 'cuota', db.cuotas, sanitizarCuotaPayload);
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
        const rawPayload = sanitizarNotaPayload(nota, this.currentUserId);
        const payload = await this.reconciliarPayloadIdRemoto('notas', rawPayload);
        this.registrarPushedId(nota.id);
        if (payload.id) this.registrarPushedId(payload.id);
        const { error } = await this.supabase
          .from('notas')
          .upsert(payload, { onConflict: 'codigo_legado' });

        if (error) {
          if (this.esErrorFkNoRecuperable(error)) {
            await this.gestionarFkError('notas', nota.id, nota.codigo_legado, error);
          } else {
            console.error('[SyncManager] Error al sincronizar nota:', nota.codigo_legado, error);
            await db.notas.update(nota.id, { sync_status: 'error' });
          }
          this.registrarFalloRegistro(nota.id, 'notas', error);
          result.failed++;
        } else {
          this.registrarExitoRegistro(nota.id);
          await db.notas.update(nota.id, {
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });
          result.success++;
        }
      } catch (err: any) {
        if (this.esErrorFkNoRecuperable(err)) {
          await this.gestionarFkError('notas', nota.id, nota.codigo_legado, err);
        } else {
          console.error('[SyncManager] Excepción al sincronizar nota:', nota.codigo_legado, err);
          await db.notas.update(nota.id, { sync_status: 'error' });
        }
        this.registrarFalloRegistro(nota.id, 'notas', err);
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 13. Sincroniza configuración de usuario (cuadernos, metadatos, techos) hacia Supabase
   */
  public async sincronizarConfiguracion(): Promise<SyncResult> {
    const result: SyncResult = { success: 0, failed: 0 };
    if (!db.configuracion_usuario || this.debeOmitirTablaRemota('configuracion_usuario')) {
      return result;
    }

    const pending = await this.obtenerRegistrosPendientes<any>(db.configuracion_usuario);
    if (pending.length === 0) return result;

    if (!this.supabase || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
      await Promise.all(
        pending.map((c) => db.configuracion_usuario.update(c.id, { sync_status: 'synced' }).catch(() => { }))
      );
      result.success = pending.length;
      return result;
    }

    const pendientes = pending.filter((item) => !this.registrosFkCuarentena.has(item.id));
    if (pendientes.length === 0) return result;

    try {
      const payloads = pendientes.map((p) => ({
        id: String(p.id),
        codigo_legado: p.codigo_legado ? String(p.codigo_legado) : String(p.id),
        valor: p.valor !== undefined && p.valor !== null ? p.valor : {},
        updated_at: p.updated_at || new Date().toISOString()
      }));

      pendientes.forEach((p) => this.registrarPushedId(p.id));

      const { error } = await this.supabase
        .from('configuracion_usuario')
        .upsert(payloads, { onConflict: 'id' });

      if (error) {
        console.error('Error 400 Supabase (Config):', error.message, (error as any).details, (error as any).hint);
        if (this.esErrorTablaInexistente(error)) {
          this.registrarTablaInexistente('configuracion_usuario');
          return result;
        }
        if (this.esErrorFkNoRecuperable(error)) {
          for (const item of pendientes) {
            this.registrosFkCuarentena.add(item.id);
            await db.configuracion_usuario.update(item.id, { sync_status: 'quarantined' }).catch(() => { });
          }
        } else {
          for (const item of pendientes) {
            await db.configuracion_usuario.update(item.id, { sync_status: 'error' }).catch(() => { });
          }
        }
        result.failed += pendientes.length;
      } else {
        for (const item of pendientes) {
          const matchedPayload = payloads.find((x) => x.id === String(item.id));
          await db.configuracion_usuario.update(item.id, {
            sync_status: 'synced',
            updated_at: matchedPayload?.updated_at || new Date().toISOString()
          }).catch(() => { });
        }
        result.success += pendientes.length;
      }
    } catch (err: any) {
      if (this.esErrorTablaInexistente(err)) {
        this.registrarTablaInexistente('configuracion_usuario');
        return result;
      }
      console.error('[SyncManager] Excepción al sincronizar configuracion_usuario:', err);
      for (const item of pendientes) {
        if (this.esErrorFkNoRecuperable(err)) {
          this.registrosFkCuarentena.add(item.id);
          await db.configuracion_usuario.update(item.id, { sync_status: 'quarantined' }).catch(() => { });
        } else {
          await db.configuracion_usuario.update(item.id, { sync_status: 'error' }).catch(() => { });
        }
      }
      result.failed += pendientes.length;
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
        map.set(t.codigo_legado.toUpperCase(), t.id);
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

  /**
   * REQ-BUGFIX-72-EXEC: Resolución O(n) in-memory de Tareas en Cuarentena o con UUIDs faltantes.
   * Carga mapas en memoria de proyectos e hitos y actualiza Dexie en lote con bulkPut, erradicando UI freezes.
   */
  public async resolverTareasEnCuarentena(
    proyectosMap?: Map<string, string>,
    hitosMap?: Map<string, string>
  ): Promise<number> {
    try {
      if (!db.tareas || typeof db.tareas.toArray !== 'function') return 0;

      const pMap = proyectosMap || (await this.construirMapaProyectos());
      const hMap = hitosMap || (await this.construirMapaHitos());

      if (pMap.size === 0 && hMap.size === 0) return 0;

      const todasTareas = await db.tareas.toArray().catch(() => []);
      if (!Array.isArray(todasTareas) || todasTareas.length === 0) return 0;

      const tareasResueltas: any[] = [];

      for (const t of todasTareas) {
        if (!t) continue;
        const estaCuarentenada = t.sync_status === 'quarantined' || this.registrosFkCuarentena.has(String(t.id));
        const faltaProyUuid = !t.proyecto_id || !isUuid(t.proyecto_id);
        const faltaHitoUuid = !t.hito_id || !isUuid(t.hito_id);

        if (!estaCuarentenada && !faltaProyUuid && !faltaHitoUuid) {
          continue;
        }

        let mutado = false;
        let proyId = t.proyecto_id;
        let hitoId = t.hito_id;

        if (faltaProyUuid && t.proyecto_codigo) {
          const resP = pMap.get(t.proyecto_codigo) || pMap.get(t.proyecto_codigo.toUpperCase());
          if (resP && isUuid(resP)) {
            proyId = resP;
            mutado = true;
          }
        }

        if (faltaHitoUuid && t.hito_codigo) {
          const resH = hMap.get(t.hito_codigo) || hMap.get(t.hito_codigo.toUpperCase());
          if (resH && isUuid(resH)) {
            hitoId = resH;
            mutado = true;
          }
        }

        // Si la tarea estaba en cuarentena o faltaban UUIDs, y ahora ambos están completos y válidos
        if (proyId && isUuid(proyId) && hitoId && isUuid(hitoId)) {
          const resuelto = {
            ...t,
            proyecto_id: proyId,
            hito_id: hitoId,
            sync_status: (t.sync_status === 'quarantined' ? 'pending' : t.sync_status) as any
          };
          this.registrosFkCuarentena.delete(String(t.id));
          tareasResueltas.push(resuelto);
        } else if (mutado) {
          tareasResueltas.push({
            ...t,
            proyecto_id: proyId,
            hito_id: hitoId
          });
        }
      }

      if (tareasResueltas.length > 0) {
        if (typeof db.tareas.bulkPut === 'function') {
          await db.tareas.bulkPut(tareasResueltas);
        } else {
          await Promise.all(tareasResueltas.map((t) => db.tareas.update(t.id, t)));
        }
      }

      return tareasResueltas.length;
    } catch (err) {
      console.warn('[SyncManager] Error al resolver tareas en cuarentena en lote:', err);
      return 0;
    }
  }

  /**
   * REQ-BUGFIX-72-EXEC: Resolución O(n) in-memory de Hitos WBS en Cuarentena
   */
  public async resolverHitosEnCuarentena(
    proyectosMap?: Map<string, string>
  ): Promise<number> {
    try {
      if (!db.hitos_wbs || typeof db.hitos_wbs.toArray !== 'function') return 0;
      const pMap = proyectosMap || (await this.construirMapaProyectos());
      if (pMap.size === 0) return 0;

      const todosHitos = await db.hitos_wbs.toArray().catch(() => []);
      if (!Array.isArray(todosHitos) || todosHitos.length === 0) return 0;

      const hitosResueltos: any[] = [];

      for (const h of todosHitos) {
        if (!h) continue;
        const estaCuarentenado = h.sync_status === 'quarantined' || this.registrosFkCuarentena.has(String(h.id));
        const faltaProyUuid = !h.proyecto_id || !isUuid(h.proyecto_id);

        if (!estaCuarentenado && !faltaProyUuid) continue;

        let proyId = h.proyecto_id;
        if (faltaProyUuid && h.proyecto_codigo) {
          const resP = pMap.get(h.proyecto_codigo) || pMap.get(h.proyecto_codigo.toUpperCase());
          if (resP && isUuid(resP)) {
            proyId = resP;
          }
        }

        if (proyId && isUuid(proyId)) {
          hitosResueltos.push({
            ...h,
            proyecto_id: proyId,
            sync_status: (h.sync_status === 'quarantined' ? 'pending' : h.sync_status) as any
          });
          this.registrosFkCuarentena.delete(String(h.id));
        }
      }

      if (hitosResueltos.length > 0) {
        if (typeof db.hitos_wbs.bulkPut === 'function') {
          await db.hitos_wbs.bulkPut(hitosResueltos);
        } else {
          await Promise.all(hitosResueltos.map((h) => db.hitos_wbs.update(h.id, h)));
        }
      }
      return hitosResueltos.length;
    } catch (err) {
      console.warn('[SyncManager] Error al resolver hitos en cuarentena en lote:', err);
      return 0;
    }
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
  /**
   * Orquestador maestro de sincronización Outbound (Push local -> remoto)
   * Protegido por Web Lock API (miportalweb_sync_mutex) para evitar colisiones entre múltiples pestañas.
   */
  public async syncPendingRecords(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'locks' in navigator && typeof (navigator as any).locks?.request === 'function') {
      try {
        await (navigator as any).locks.request('miportalweb_sync_mutex', { ifAvailable: true }, async (lock: any) => {
          if (!lock) {
            console.info('[SyncManager] Otra pestaña está ejecutando la sincronización activa (Web Lock adquirido). Omitiendo ciclo duplicado.');
            return;
          }
          await this.ejecutarSyncPendingRecords();
        });
        return;
      } catch (lockErr) {
        console.warn('[SyncManager] Web Lock no disponible o falló; recurriendo a lock en memoria:', lockErr);
      }
    }

    // Fallback estándar en entornos sin Web Locks (Vitest, JSDOM, Node o navegadores legacy)
    await this.ejecutarSyncPendingRecords();
  }

  private async ejecutarSyncPendingRecords(): Promise<void> {
    if (this.isSyncing) {
      this.syncRequestedWhileRunning = true;
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.setSyncState('offline');
      return;
    }

    // REQ-BUGFIX-73-EXEC: Bypass de autenticación (Zero-Login Sync Local-First).
    // Proceder incondicionalmente a sincronizar con la API de Supabase vía Anon Key.
    await this.resolverUsuarioActivo().catch(() => { });

    // REQ-SYNC-PROD-15-FIX: Auto-Recuperación de Cuarentena FK
    await this.liberarRegistrosCuarentena().catch(() => { });

    try {
      // 1. Verificar registros pendientes en IndexedDB a través de las 13 entidades (incluyendo tombstones / sync_deletions)
      const pendingCounts = await Promise.all([
        this.contarPendientes(db.tombstones),
        db.sync_deletions ? this.contarPendientes(db.sync_deletions) : Promise.resolve(0),
        this.contarPendientes(db.proyectos),
        this.contarPendientes(db.hitos_wbs),
        this.contarPendientes(db.tareas),
        this.contarPendientes(db.actividades_personales),
        this.contarPendientes(db.subtareas_pasos),
        this.contarPendientes(db.metas_planes),
        this.contarPendientes(db.planes_accion_hitos),
        this.contarPendientes(db.habitos_metas_vinculos),
        this.debeOmitirTablaRemota('gastos') ? Promise.resolve(0) : this.contarPendientes(db.gastos),
        this.debeOmitirTablaRemota('ingresos') ? Promise.resolve(0) : this.contarPendientes(db.ingresos),
        this.debeOmitirTablaRemota('cuotas') ? Promise.resolve(0) : this.contarPendientes(db.cuotas),
        this.contarPendientes(db.notas),
        db.configuracion_usuario && !this.debeOmitirTablaRemota('configuracion_usuario')
          ? this.contarPendientes(db.configuracion_usuario)
          : Promise.resolve(0)
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

      // 1. Construir mapas topológicos iniciales
      const proyectoMap = await this.construirMapaProyectos();

      // PASO 1: Subir/Sincronizar Proyectos (Padres) - REQ-ARCH-75-EXEC / REQ-SYNC-PROD-05-FIX
      const resProy = await this.sincronizarProyectos();
      if (resProy.failed > 0) {
        console.warn('[SyncManager] Subida de Proyectos registró fallos. Continuando hacia Hitos, Tareas, Notas y Tombstones.');
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          this.setSyncState('offline');
          return;
        }
      }
      if (resProy.success > 0) {
        const updatedPMap = await this.construirMapaProyectos();
        updatedPMap.forEach((v, k) => proyectoMap.set(k, v));
      }

      // PASO 2: Subir/Sincronizar Hitos y Metas (Hijos directos) - REQ-ARCH-75-EXEC / REQ-SYNC-PROD-05-FIX
      const resHit = await this.sincronizarHitos(proyectoMap);
      if (resHit.failed > 0) {
        console.warn('[SyncManager] Subida de Hitos registró fallos. Continuando hacia Tareas, Notas, Gastos y Tombstones.');
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          this.setSyncState('offline');
          return;
        }
      }
      const hitoMap = await this.construirMapaHitos();

      // REQ-BUGFIX-72-EXEC: Resolver en lote O(n) tareas e hitos en cuarentena con los mapas actualizados
      await this.resolverHitosEnCuarentena(proyectoMap);
      await this.resolverTareasEnCuarentena(proyectoMap, hitoMap);

      const resMet = await this.sincronizarMetasPlanes();
      const metaMap = await this.construirMapaMetas();
      const resHitPln = await this.sincronizarHitosPlan(metaMap);
      const resAct = await this.sincronizarActividades();

      // PASO 3: Subir/Sincronizar Tareas, Gastos, Ingresos, Notas (Dependientes) - REQ-ARCH-75-EXEC
      const resTar = await this.sincronizarTareas(proyectoMap, hitoMap);
      const tareaMap = await this.construirMapaTareas();
      const actividadMap = await this.construirMapaActividades();

      const resSub = await this.sincronizarSubtareas(tareaMap, actividadMap);
      const resVin = await this.sincronizarVinculosMeta(actividadMap, metaMap);
      const resGas = await this.sincronizarGastos();
      const resIng = await this.sincronizarIngresos();
      const resCuo = await this.sincronizarCuotas();
      const resNot = await this.sincronizarNotas();
      const resCfg = await this.sincronizarConfiguracion();

      // PASO 4: Subir Lápidas (sync_deletions / Tombstones) - REQ-ARCH-75-EXEC
      const resTomb = await this.sincronizarTombstones();

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
        resNot.failed +
        resCfg.failed;

      if (totalFallidos > 0) {
        this.setSyncState('error');
      } else {
        this.setSyncState('synced');
      }

      this.guardarSnapshotEnPuenteLocal().catch(() => { });
    } catch (err) {
      console.error('[SyncManager] Error general en orquestación de sincronización:', err);
      this.setSyncState('error');
    } finally {
      this.isSyncing = false;
      if (this.syncRequestedWhileRunning) {
        this.syncRequestedWhileRunning = false;
        this.syncPendingRecords().catch((err) => {
          console.warn('[SyncManager] Error en re-disparo encolado de syncPendingRecords:', err);
        });
      }
    }
  }

  /**
   * Descarga selectiva en caliente para eventos Realtime acotados a tablas específicas.
   * Excluye automáticamente tablas inexistentes o locales ('gastos', 'ingresos', 'cuotas') salvo habilitación explícita.
   */
  public async descargarDatosSelectivos(tablas: string[]): Promise<{ descargados: number; fallidos: number }> {
    const tablasActivas = tablas.filter((t) => !this.debeOmitirTablaRemota(t));
    if (tablasActivas.length === 0) {
      return { descargados: 0, fallidos: 0 };
    }
    return this.descargarDatosDescendientes(tablasActivas);
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
        const todasLapidas = (await db.tombstones.toArray().catch(() => [])) || [];
        todasLapidas.forEach((t) => {
          if (t.id) tombstonesLocalesSet.add(String(t.id));
        });
      }
      if (db.sync_deletions && typeof db.sync_deletions.toArray === 'function') {
        const todasDeletions = (await db.sync_deletions.toArray().catch(() => [])) || [];
        todasDeletions.forEach((t) => {
          if (t.id) tombstonesLocalesSet.add(String(t.id));
        });
      }
    } catch {
      // Tolerancia defensiva ante entornos sin IndexedDB
    }

    // Pre-cargar mapas UUID -> Código y Código -> UUID de Proyectos, Hitos, Tareas y Actividades (REQ-FIX-10 / REQ-BUGFIX-72)
    const proyUuidToCod = new Map<string, string>();
    const hitoUuidToCod = new Map<string, string>();
    const tareaUuidToCod = new Map<string, string>();
    const actividadUuidToCod = new Map<string, string>();
    const proyCodToUuid = new Map<string, string>();
    const hitoCodToUuid = new Map<string, string>();
    try {
      if (db.proyectos && typeof (db.proyectos as any).toArray === 'function') {
        const locProys = (await (db.proyectos as any).toArray().catch(() => [])) || [];
        if (Array.isArray(locProys)) {
          locProys.forEach((p: any) => {
            const cod = extraerCodigoCanonico(p);
            if (cod) {
              if (p.id) {
                proyUuidToCod.set(String(p.id), cod);
                proyUuidToCod.set(String(p.id).toUpperCase(), cod);
                proyCodToUuid.set(cod, String(p.id));
                proyCodToUuid.set(cod.toUpperCase(), String(p.id));
              }
              proyUuidToCod.set(cod, cod);
            }
            if (p.id && isUuid(p.id)) {
              proyCodToUuid.set(String(p.id), String(p.id));
            }
          });
        }
      }
      if (db.hitos_wbs && typeof (db.hitos_wbs as any).toArray === 'function') {
        const locHitos = (await (db.hitos_wbs as any).toArray().catch(() => [])) || [];
        if (Array.isArray(locHitos)) {
          locHitos.forEach((h: any) => {
            const cod = extraerCodigoCanonico(h);
            if (cod) {
              if (h.id) {
                hitoUuidToCod.set(String(h.id), cod);
                hitoUuidToCod.set(String(h.id).toUpperCase(), cod);
                hitoCodToUuid.set(cod, String(h.id));
                hitoCodToUuid.set(cod.toUpperCase(), String(h.id));
              }
              hitoUuidToCod.set(cod, cod);
            }
            if (h.id && isUuid(h.id)) {
              hitoCodToUuid.set(String(h.id), String(h.id));
            }
          });
        }
      }
      if (db.tareas && typeof (db.tareas as any).toArray === 'function') {
        const locTareas = (await (db.tareas as any).toArray().catch(() => [])) || [];
        if (Array.isArray(locTareas)) {
          locTareas.forEach((t: any) => {
            const cod = extraerCodigoCanonico(t);
            if (cod) {
              if (t.id) {
                tareaUuidToCod.set(String(t.id), cod);
                tareaUuidToCod.set(String(t.id).toUpperCase(), cod);
              }
              tareaUuidToCod.set(cod, cod);
            }
          });
        }
      }
      if (db.actividades_personales && typeof (db.actividades_personales as any).toArray === 'function') {
        const locActs = (await (db.actividades_personales as any).toArray().catch(() => [])) || [];
        if (Array.isArray(locActs)) {
          locActs.forEach((a: any) => {
            const cod = extraerCodigoCanonico(a);
            if (cod) {
              if (a.id) {
                actividadUuidToCod.set(String(a.id), cod);
                actividadUuidToCod.set(String(a.id).toUpperCase(), cod);
              }
              actividadUuidToCod.set(cod, cod);
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
      { tabla: 'notas', refDexie: db.notas },
      ...(db.configuracion_usuario
        ? [{ tabla: 'configuracion_usuario', refDexie: db.configuracion_usuario }]
        : [])
    ] as const;

    const configuracionesFiltradas = configuraciones.filter((c) => {
      if (tablasFiltro && tablasFiltro.length > 0) {
        return tablasFiltro.includes(c.tabla);
      }
      // REQ-WEB-01 / REQ-FIX-16: Suprimir peticiones a tablas inexistentes en Supabase ('gastos', 'ingresos', 'cuotas' 404)
      return !this.debeOmitirTablaRemota(c.tabla);
    });

    for (const { tabla, refDexie } of configuracionesFiltradas) {
      if (!tablasFiltro?.includes(tabla) && this.debeOmitirTablaRemota(tabla)) {
        continue;
      }

      try {
        // REQ-SYNC-PROD-08-FIX: Paginación en bloques de 250 filas con persistencia aislada por tabla
        // para prevenir saturación de frames HTTP/2 (ERR_CONNECTION_CLOSED) y efecto dominó entre tablas.
        const PAGE_SIZE = 250;
        let offset = 0;
        let hasMore = true;
        let data: any[] = [];
        let descargaCompleta = true;

        const tablasAltoVolumen = ['gastos', 'ingresos', 'habitos_registros', 'habito_cumplimiento_logs'];
        const cutoffIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

        while (hasMore) {
          let query: any = this.supabase.from(tabla).select('*');
          if (tablasAltoVolumen.includes(tabla) && typeof query?.gte === 'function') {
            query = query.gte('created_at', cutoffIso);
          }

          const to = offset + PAGE_SIZE - 1;
          const chunkPromise = typeof query?.range === 'function'
            ? query.range(offset, to)
            : (typeof query?.limit === 'function' ? query.limit(PAGE_SIZE) : query);

          const chunkRes = await chunkPromise;
          const { data: chunk, error } = chunkRes || {};

          if (error) {
            descargaCompleta = false;
            hasMore = false;
            if (this.esErrorTablaInexistente(error)) {
              this.registrarTablaInexistente(tabla);
            } else {
              console.warn(`[SyncManager] Aviso al descargar tabla remota ${tabla} (offset ${offset}):`, error.message);
              summary.fallidos++;
            }
            break;
          }

          const records = Array.isArray(chunk) ? chunk : (Array.isArray(chunkRes) ? chunkRes : []);

          if (!records || records.length === 0) {
            hasMore = false;
            break;
          }

          data.push(...records);

          if (typeof query?.range !== 'function' || records.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            offset += PAGE_SIZE;
          }
        }

        if (!descargaCompleta) {
          continue;
        }

        // Enriquecer mapas UUID -> Código y Código -> UUID con datos remotos frescos (REQ-FIX-10 / REQ-BUGFIX-72)
        if (tabla === 'proyectos') {
          for (const item of data) {
            const cod = item.codigo_legado || extraerCodigoCanonico(item);
            if (item.id) {
              if (cod) {
                proyUuidToCod.set(String(item.id), cod);
                proyUuidToCod.set(String(item.id).toUpperCase(), cod);
                proyCodToUuid.set(cod, String(item.id));
                proyCodToUuid.set(cod.toUpperCase(), String(item.id));
              }
              proyCodToUuid.set(String(item.id), String(item.id));
            }
          }
        } else if (tabla === 'hitos_wbs') {
          for (const item of data) {
            const cod = item.codigo_legado || extraerCodigoCanonico(item);
            if (item.id) {
              if (cod) {
                hitoUuidToCod.set(String(item.id), cod);
                hitoUuidToCod.set(String(item.id).toUpperCase(), cod);
                hitoCodToUuid.set(cod, String(item.id));
                hitoCodToUuid.set(cod.toUpperCase(), String(item.id));
              }
              hitoCodToUuid.set(String(item.id), String(item.id));
            }
          }
        } else if (tabla === 'tareas') {
          for (const item of data) {
            const cod = extraerCodigoCanonico(item);
            if (item.id && cod) {
              tareaUuidToCod.set(String(item.id), cod);
              tareaUuidToCod.set(String(item.id).toUpperCase(), cod);
            }
          }
        } else if (tabla === 'actividades_personales') {
          for (const item of data) {
            const cod = extraerCodigoCanonico(item);
            if (item.id && cod) {
              actividadUuidToCod.set(String(item.id), cod);
              actividadUuidToCod.set(String(item.id).toUpperCase(), cod);
            }
          }
        }

        // Recuperar IDs pendientes en local para proteger cambios sin sincronizar (permitir que la nube reconcilie 'error')
        const idsPendientesLocales = new Set<string>();
        try {
          const w = (refDexie as any).where('sync_status');
          const keys = typeof w.equals === 'function'
            ? await w.equals('pending').primaryKeys()
            : typeof w.anyOf === 'function'
              ? await w.anyOf(['pending']).primaryKeys()
              : [];
          keys.forEach((k: any) => idsPendientesLocales.add(String(k)));
        } catch {
          // Fallback defensivo
        }

        // Indexar registros locales actuales por código canónico (codigo_legado) y por ID para evitar duplicar semillas
        const mapaLocalPorCodigo = new Map<string, any>();
        const mapaLocalPorId = new Map<string, any>();
        let actuales: any[] = [];
        try {
          if (typeof (refDexie as any).toArray === 'function') {
            actuales = (await (refDexie as any).toArray()) || [];
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

        // REQ-BUGFIX-74-EXEC: Diffing de eliminaciones remotas (Hard-Deletes en Dispositivo B - Sprint 1)
        // Si un registro local está 'synced' pero ya no existe en el catálogo remoto de Supabase,
        // fue eliminado en la nube (ej. desde Dispositivo A) y debe eliminarse de Dexie localmente.
        if (descargaCompleta && Array.isArray(actuales) && actuales.length > 0) {
          const idsRemotosDescargados = new Set<string>();
          const codigosRemotosDescargados = new Set<string>();
          for (const item of data) {
            if (item?.id) {
              idsRemotosDescargados.add(String(item.id));
              idsRemotosDescargados.add(String(item.id).toLowerCase());
            }
            const cod = item?.codigo_legado || extraerCodigoCanonico(item);
            if (cod) {
              codigosRemotosDescargados.add(cod);
              codigosRemotosDescargados.add(cod.toUpperCase());
            }
          }

          for (const loc of actuales) {
            if (!loc || !loc.id) continue;
            const locId = String(loc.id);

            // Proteger estrictamente registros locales creados o modificados que aún no se han subido
            if (loc.sync_status !== 'synced') continue;

            // Omitir si ya tiene lápida local o ya está encolado para eliminar
            if (tombstonesLocalesSet.has(locId) || idsObsoletosAEliminar.includes(locId)) continue;

            // Para tablas con límite de ventana de fecha (90 días), sólo comparar si el registro está dentro de la ventana
            if (tablasAltoVolumen.includes(tabla)) {
              const fRef = loc.created_at || loc.fecha_gasto || loc.fecha_ingreso || loc.updated_at;
              if (fRef && new Date(fRef).getTime() < new Date(cutoffIso).getTime()) {
                continue;
              }
            }

            const locCod = extraerCodigoCanonico(loc);
            const existeEnRemoto = idsRemotosDescargados.has(locId) ||
              idsRemotosDescargados.has(locId.toLowerCase()) ||
              (locCod && (codigosRemotosDescargados.has(locCod) || codigosRemotosDescargados.has(locCod.toUpperCase())));

            if (!existeEnRemoto) {
              idsObsoletosAEliminar.push(locId);
            }
          }
        }

        for (const item of data) {
          if (!item || !item.id) continue;
          const idStr = String(item.id);
          const codRemoto = extraerCodigoCanonico(item);

          // REQ-ARCH-75-EXEC Regla Anti-Resurrección (Sprint 2):
          // Antes de insertar un registro descargado de Supabase en Dexie, cruzar su ID contra sync_deletions / tombstones.
          // Si el ID está en la cola de borrado, IGNORAR la actualización remota (el borrado local gana).
          if (
            tombstonesLocalesSet.has(idStr) ||
            tombstonesLocalesSet.has(idStr.toLowerCase()) ||
            (codRemoto && (tombstonesLocalesSet.has(codRemoto) || tombstonesLocalesSet.has(codRemoto.toLowerCase())))
          ) {
            continue;
          }

          if (idsPendientesLocales.has(idStr)) continue;

          const existentePorCodigo = codRemoto ? mapaLocalPorCodigo.get(codRemoto) : undefined;
          const existentePorId = mapaLocalPorId.get(idStr);
          const localPrevio = existentePorCodigo || existentePorId;

          if (localPrevio && localPrevio.sync_status === 'pending') {
            continue;
          }

          let registroFinal = {
            ...item,
            sync_status: 'synced' as const
          };

          if (tabla === 'actividades_personales') {
            registroFinal = sanitizarActividadInbound(item, localPrevio);
          } else if (tabla === 'subtareas_pasos') {
            registroFinal = sanitizarSubtareaInbound(item, localPrevio, tareaUuidToCod, actividadUuidToCod);
          } else if (tabla === 'hitos_wbs') {
            registroFinal = sanitizarHitoInbound(item, localPrevio, proyUuidToCod, proyCodToUuid);
          } else if (tabla === 'tareas') {
            registroFinal = sanitizarTareaInbound(item, localPrevio, proyUuidToCod, hitoUuidToCod, tareaUuidToCod, proyCodToUuid, hitoCodToUuid);
          } else if (tabla === 'notas') {
            registroFinal = sanitizarNotaInbound(item, localPrevio);
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

          // REQ-SYNC-PROD-06-FIX: El estado proveniente de Supabase (Single Source of Truth)
          // prevalece sobre registros locales ('synced' / 'error') siempre que difiera en valores (!sonRegistrosIdenticos),
          // sin descartarse por desfase de reloj (clock skew) entre dispositivos.
          if (localPrevio && !idsObsoletosAEliminar.includes(String(localPrevio.id))) {
            if (sonRegistrosIdenticos(registroFinal, localPrevio)) {
              continue;
            }
          }

          registrosParaActualizar.push(registroFinal);
        }

        if (idsObsoletosAEliminar.length > 0 || registrosParaActualizar.length > 0) {
          this.setSyncState('syncing');

          const persistirTablaLocal = async () => {
            if (idsObsoletosAEliminar.length > 0 && typeof (refDexie as any)?.bulkDelete === 'function') {
              await (refDexie as any).bulkDelete(idsObsoletosAEliminar);
            }
            if (registrosParaActualizar.length > 0 && typeof (refDexie as any)?.bulkPut === 'function') {
              await (refDexie as any).bulkPut(registrosParaActualizar);
              summary.descargados += registrosParaActualizar.length;
            }
          };

          try {
            if (typeof (db as any).transaction === 'function' && refDexie && typeof (refDexie as any).bulkPut === 'function') {
              await (db as any).transaction('rw', [refDexie], persistirTablaLocal);
            } else {
              await persistirTablaLocal();
            }
          } catch (txErr) {
            console.warn(`[SyncManager] Fallback a escrituras directas en tabla ${tabla} tras error en transacción:`, txErr);
            await persistirTablaLocal();
          }
        }
      } catch (err) {
        if (this.esErrorTablaInexistente(err)) {
          this.registrarTablaInexistente(tabla);
        } else {
          console.warn(`[SyncManager] Error al sincronizar tabla descendente ${tabla}:`, err);
          summary.fallidos++;
        }
        continue;
      }
    }

    if (summary.descargados > 0) {
      await sanearDuplicadosDexie();
      this.setSyncState('synced');
    }

    // REQ-BUGFIX-72-EXEC: Resolver en lote tareas e hitos en cuarentena tras el pull usando los mapas en memoria
    await this.resolverHitosEnCuarentena(proyCodToUuid);
    await this.resolverTareasEnCuarentena(proyCodToUuid, hitoCodToUuid);

    return summary;
  }

  /**
   * Procesa la cola de cambios locales pendientes hacia Supabase (Push Outbox)
   */
  public async procesarColaPendiente(): Promise<void> {
    await this.syncPendingRecords();
  }

  /**
   * Sincronización bidireccional completa (REQ-SYNC-PROD-08-FIX):
   * 1. Pull nube -> local (descargarDatosDescendientes) con aislamiento de errores por tabla
   * 2. Push local -> nube (procesarColaPendiente) garantizado para no bloquear cambios pendientes
   * 3. Sincronización de fallback con el puente HTTP local 127.0.0.1:48123
   */
  public async sincronizarTodo(): Promise<void> {
    await this.resolverUsuarioActivo().catch(() => { });

    const pullResult = await this.descargarDatosDescendientes();
    if (pullResult.fallidos > 0) {
      console.warn(`[SyncManager] Pull remoto registró ${pullResult.fallidos} tabla(s) fallida(s). Continuando hacia ciclo push.`);
    }

    await this.procesarColaPendiente();

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
    if (!esEntornoEscritorioLocal()) return false;
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
    if (!esEntornoEscritorioLocal()) return false;
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
