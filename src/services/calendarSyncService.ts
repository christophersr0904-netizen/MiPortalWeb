/**
 * ============================================================================
 * ARCHIVO: src/services/calendarSyncService.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-UI-39-GCAL-REAL-SYNC
 * DESCRIPCIÓN: Integración real CREATE / UPDATE / DELETE con Google Calendar
 *              REST API v3 (OAuth2 GIS + Supabase provider_token) y mapeo
 *              persistente `pmo_gcal_event_map` sobre estándar RFC-5545.
 * ============================================================================
 */

import { db } from '../db/db';
import type { ActividadPersonal, AlcanceRecurrencia, TareaRecord } from '../types';
import { syncManager } from './syncManager';
import {
  construirEventoGoogleCalendarV3,
  construirRRuleRFC5545,
  construirUrlGoogleCalendar,
  generarArchivoICS,
  normalizarFechaIso,
  type ActividadRecurrenciaInput,
  type EventoGoogleCalendarV3
} from '../utils/recurrenceEngine';
import { formatFechaIsoLocal } from '../utils/timeFormatters';

export const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
export const GCAL_EVENT_MAP_KEY = 'pmo_gcal_event_map';
export const GCAL_TOKEN_STORAGE_KEY = 'pmo_gcal_access_token';
export const GCAL_EXPIRES_STORAGE_KEY = 'pmo_gcal_expires_at';
export const GCAL_HINT_STORAGE_KEY = 'pmo_gcal_user_hint';
export const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar';

export interface EntidadAgendable {
  id?: string;
  user_id?: string;
  codigo_legado?: string;
  nombre?: string;
  nombre_actividad?: string;
  nombre_tarea_actividad?: string;
  descripcion_gasto?: string;
  descripcion_ingreso?: string;
  titulo?: string;
  fecha_programada?: string;
  fecha_gasto?: string;
  fecha_ingreso?: string;
  fecha_vencimiento?: string;
  hora_inicio?: string;
  duracion_horas?: number;
  horas_estimadas?: number;
  agendado_calendar?: 'Sí' | 'No' | string;
  agendado_en_calendar?: 'Sí' | 'No' | string;
  id_evento_calendar?: string;
  notas_impedimentos?: string;
  notas_checklist?: string;
  tipo_entidad?: 'ACTIVIDAD' | 'TAREA' | 'GASTO' | 'INGRESO' | 'CUOTA' | string;
  categoria_vida?: string;
  meta_macro_nombre?: string;
  proyecto_codigo?: string;
  hito_codigo?: string;
  frecuencia_ciclo?: string;
  regla_repeticion?: string;
  tipo_compromiso?: string;
  excepciones_fechas?: string[];
  [key: string]: any;
}

export type AgendableCalendarInput = EntidadAgendable | ActividadPersonal | TareaRecord | any;

export interface OpcionesAlcanceCalendar {
  alcance?: AlcanceRecurrencia | string;
  fechaRef?: string;
}

export interface ResultadoCalendarSync {
  success: boolean;
  mode?: 'API_V3' | 'AUTH_REQUIRED' | 'SKIPPED' | 'OFFLINE';
  requiereAuth?: boolean;
  requiereConfigClientId?: boolean;
  eventId?: string;
  rrule?: string | null;
  eventoV3?: EventoGoogleCalendarV3;
  googleCalendarUrl?: string;
  icsContent?: string;
  message?: string;
  error?: string;
}

export interface EstadoConexionGoogleCalendar {
  conectado: boolean;
  tieneClientId: boolean;
  expiraEn?: number;
  email?: string | null;
}

let accessTokenMemoria: string | null = null;
let expiresAtMemoria = 0;
const listenersEstado = new Set<(estado: EstadoConexionGoogleCalendar) => void>();

export function obtenerUrlGcalAuth(): string | null {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('mock')) return null;
  return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/gcal-auth`;
}

async function obtenerHeadersGcalAuth(): Promise<Record<string, string>> {
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  let token = supabaseAnonKey;
  try {
    const supabase = syncManager.getSupabaseClient();
    if (supabase?.auth && typeof supabase.auth.getSession === 'function') {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        token = data.session.access_token;
      }
    }
  } catch {
    // Usar anonKey como fallback
  }
  return {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${token}`
  };
}

function emitirCambioEstado() {
  const est = obtenerEstadoConexionGoogleCalendar();
  listenersEstado.forEach((cb) => {
    try {
      cb(est);
    } catch {
      // No propagar errores de listeners UI
    }
  });
}

function leerLocalStorage(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // Ignorar en entornos restringidos
  }
  return null;
}

function escribirLocalStorage(key: string, value: string | null): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  } catch {
    // Ignorar en entornos restringidos
  }
}

export function setGoogleCalendarAccessToken(token: string | null, expiresInSeconds = 3500): void {
  if (!token) {
    accessTokenMemoria = null;
    expiresAtMemoria = 0;
    escribirLocalStorage(GCAL_TOKEN_STORAGE_KEY, null);
    escribirLocalStorage(GCAL_EXPIRES_STORAGE_KEY, null);
    emitirCambioEstado();
    return;
  }
  const exp = Date.now() + Math.max(60, expiresInSeconds) * 1000;
  accessTokenMemoria = token;
  expiresAtMemoria = exp;
  escribirLocalStorage(GCAL_TOKEN_STORAGE_KEY, token);
  escribirLocalStorage(GCAL_EXPIRES_STORAGE_KEY, String(exp));
  emitirCambioEstado();
}

export function limpiarTokenGoogleCalendar(limpiarHint = false): void {
  setGoogleCalendarAccessToken(null);
  if (limpiarHint) {
    escribirLocalStorage(GCAL_HINT_STORAGE_KEY, null);
  }
}

function obtenerTokenSincrono(): string | null {
  const margenMs = 15000;
  if (accessTokenMemoria && (expiresAtMemoria === 0 || Date.now() + margenMs < expiresAtMemoria)) {
    return accessTokenMemoria;
  }

  const tokenStorage = leerLocalStorage(GCAL_TOKEN_STORAGE_KEY);
  const expRaw = leerLocalStorage(GCAL_EXPIRES_STORAGE_KEY);
  const expStorage = expRaw ? parseInt(expRaw, 10) : 0;
  if (tokenStorage && (!expStorage || Date.now() + margenMs < expStorage)) {
    accessTokenMemoria = tokenStorage;
    expiresAtMemoria = expStorage;
    return tokenStorage;
  }

  return null;
}

export function obtenerEstadoConexionGoogleCalendar(): EstadoConexionGoogleCalendar {
  const token = obtenerTokenSincrono();
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const email = leerLocalStorage(GCAL_HINT_STORAGE_KEY) || null;
  return {
    conectado: Boolean(token),
    tieneClientId: Boolean(clientId),
    expiraEn: expiresAtMemoria || undefined,
    email
  };
}

export function suscribirEstadoGoogleCalendar(
  listener: (estado: EstadoConexionGoogleCalendar) => void
): () => void {
  listenersEstado.add(listener);
  return () => {
    listenersEstado.delete(listener);
  };
}

/**
 * REQ-GCAL-BACKEND-02: Consulta el estado de vinculación offline en Supabase Edge Function (`gcal-auth`).
 * Si el backend tiene un refresh_token válido, obtiene de forma transparente un access_token fresco
 * y actualiza el estado de la aplicación sin abrir ninguna ventana emergente.
 */
export async function consultarEstadoGoogleCalendarBackend(): Promise<{ conectado: boolean; email?: string | null }> {
  const url = obtenerUrlGcalAuth();
  if (!url) {
    const est = obtenerEstadoConexionGoogleCalendar();
    return { conectado: est.conectado, email: est.email };
  }

  try {
    const headers = await obtenerHeadersGcalAuth();
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'status' })
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.connected) {
        if (data.email) {
          escribirLocalStorage(GCAL_HINT_STORAGE_KEY, data.email);
        }
        const tokenLocal = obtenerTokenSincrono();
        if (!tokenLocal) {
          await obtenerTokenGoogleCalendar();
        } else {
          emitirCambioEstado();
        }
        return { conectado: true, email: data.email || leerLocalStorage(GCAL_HINT_STORAGE_KEY) };
      } else {
        const tokenLocal = obtenerTokenSincrono();
        if (!tokenLocal) {
          limpiarTokenGoogleCalendar(false);
        }
        return { conectado: Boolean(tokenLocal), email: leerLocalStorage(GCAL_HINT_STORAGE_KEY) };
      }
    }
  } catch (err) {
    console.warn('[CalendarSync] Error al consultar estado en Edge Function:', err);
  }

  const est = obtenerEstadoConexionGoogleCalendar();
  return { conectado: est.conectado, email: est.email };
}

/**
 * REQ-GCAL-BACKEND-02: Desconecta Google Calendar revocando credenciales tanto en backend
 * como en el almacenamiento local.
 */
export async function desconectarGoogleCalendar(): Promise<{ success: boolean; error?: string }> {
  limpiarTokenGoogleCalendar(true);

  const url = obtenerUrlGcalAuth();
  if (url) {
    try {
      const headers = await obtenerHeadersGcalAuth();
      await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'disconnect' })
      });
    } catch (err) {
      console.warn('[CalendarSync] Error al desconectar en backend:', err);
    }
  }

  emitirCambioEstado();
  return { success: true };
}

/**
 * REQ-ELECTRON-COCKPIT-02: Determina si el entorno actual corresponde al widget nativo de escritorio de Electron.
 */
export function esWidgetElectron(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).IS_DESKTOP_WIDGET || (window as any).desktopWidget?.isNative);
}

/**
 * REQ-GCAL-AUTH-01-FIX / REQ-GCAL-BACKEND-02: Renovación proactiva al volver a la pestaña activa.
 * Consulta silenciosamente al backend o renueva vía refresh_token sin popups.
 */
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (esWidgetElectron()) return;
    if (document.visibilityState === 'visible') {
      const expRaw = leerLocalStorage(GCAL_EXPIRES_STORAGE_KEY);
      const exp = expRaw ? parseInt(expRaw, 10) : 0;
      const diezMinMs = 10 * 60 * 1000;
      if (!exp || Date.now() + diezMinMs >= exp) {
        void consultarEstadoGoogleCalendarBackend();
      }
    }
  });
}

/**
 * REQ-GCAL-BACKEND-02: Obtiene un Bearer access_token vigente.
 * Prioriza token en memoria/localStorage. Si ha vencido o expira en menos de 5 min,
 * solicita silenciosamente uno nuevo a la Edge Function usando el refresh_token persistido (CERO popups).
 */
export async function obtenerTokenGoogleCalendar(): Promise<string | null> {
  const tokenLocal = obtenerTokenSincrono();
  const expRaw = leerLocalStorage(GCAL_EXPIRES_STORAGE_KEY);
  const expStorage = expRaw ? parseInt(expRaw, 10) : 0;
  const cincoMinutosMs = 5 * 60 * 1000;

  // 1. Token válido en memoria/localStorage con más de 5 minutos de vigencia
  if (tokenLocal && (!expStorage || Date.now() + cincoMinutosMs < expStorage)) {
    return tokenLocal;
  }

  // 2. Intentar renovación silenciosa contra Edge Function con refresh_token si existe cuenta vinculada
  const url = obtenerUrlGcalAuth();
  const hintStorage = leerLocalStorage(GCAL_HINT_STORAGE_KEY);
  if (url && (tokenLocal || hintStorage || expStorage)) {
    try {
      const headers = await obtenerHeadersGcalAuth();
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'token' })
      });

      if (res && res.ok) {
        const data = await res.json();
        if (data?.access_token) {
          const expiresIn = Number(data.expires_in) || 3500;
          setGoogleCalendarAccessToken(data.access_token, expiresIn);
          if (data.email) {
            escribirLocalStorage(GCAL_HINT_STORAGE_KEY, data.email);
          }
          return data.access_token;
        }
      }
    } catch (err) {
      console.warn('[CalendarSync] Error al renovar token desde backend:', err);
    }
  }

  // 3. Fallback a provider_token de Supabase Auth
  try {
    const supabase = syncManager.getSupabaseClient();
    if (supabase?.auth && typeof supabase.auth.getSession === 'function') {
      const { data } = await supabase.auth.getSession();
      const providerToken = (data?.session as any)?.provider_token;
      if (providerToken && typeof providerToken === 'string') {
        setGoogleCalendarAccessToken(providerToken, 3000);
        return providerToken;
      }
    }
  } catch {
    // Continuar sin token
  }

  if (tokenLocal) {
    return tokenLocal;
  }

  return null;
}

async function cargarScriptGIS(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Entorno sin navegador para Google Identity Services');
  }
  const win = window as any;
  if (win.google?.accounts?.oauth2) return;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout al cargar Google Identity Services'));
    }, 4000);

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => { clearTimeout(timer); resolve(); }, { once: true });
      existing.addEventListener('error', () => { clearTimeout(timer); reject(new Error('No se pudo cargar Google Identity Services')); }, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => { clearTimeout(timer); reject(new Error('No se pudo cargar Google Identity Services')); };
    document.head.appendChild(script);
  });
}

/**
 * REQ-GCAL-AUTH-01-FIX: Resuelve y persiste en localStorage el correo principal
 * de la cuenta Google autorizada (usado como `hint` en renovaciones silenciosas).
 */
async function resolverYGuardarHint(token: string): Promise<void> {
  try {
    const existente = leerLocalStorage(GCAL_HINT_STORAGE_KEY);
    if (existente && existente.trim()) return;
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      const email = String(data?.id || '').trim();
      if (email && email.includes('@')) {
        escribirLocalStorage(GCAL_HINT_STORAGE_KEY, email);
      }
    }
  } catch (err) {
    console.warn('[CalendarSync] No se pudo resolver hint de email:', err);
  }
}

// Single-flight lock para colapsar múltiples llamadas concurrentes de renovación silenciosa
let promesaRenovacionEnCurso: Promise<{
  success: boolean;
  token?: string;
  requiereConfigClientId?: boolean;
  error?: string;
}> | null = null;

/**
 * REQ-GCAL-BACKEND-02: Inicia autorización OAuth2.
 * Si hay Edge Function disponible y llamada interactiva, utiliza `initCodeClient` para intercambiar
 * código por `refresh_token` permanente en Supabase (multi-dispositivo).
 * Si no hay Edge Function o en tests/fallback, utiliza `initTokenClient`.
 */
export async function autorizarGoogleCalendarOAuth(silencioso = false): Promise<{
  success: boolean;
  token?: string;
  requiereConfigClientId?: boolean;
  error?: string;
}> {
  if (esWidgetElectron()) {
    return {
      success: false,
      error: 'OAuth deshabilitado en widget de escritorio; sincronizar desde el portal web.'
    };
  }

  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) {
    return {
      success: false,
      requiereConfigClientId: true,
      error: 'Configura VITE_GOOGLE_CLIENT_ID en .env para habilitar OAuth automático con Google Calendar.'
    };
  }

  if (silencioso && promesaRenovacionEnCurso) {
    return promesaRenovacionEnCurso;
  }

  const ejecutarAuth = async () => {

    try {
      await cargarScriptGIS();
      const win = window as any;
      const gcalAuthUrl = obtenerUrlGcalAuth();

      // Camino 1: Edge Function + initCodeClient para OAuth offline persistente
      if (gcalAuthUrl && !silencioso && win.google?.accounts?.oauth2?.initCodeClient) {
        return await new Promise<{
          success: boolean;
          token?: string;
          requiereConfigClientId?: boolean;
          error?: string;
        }>((resolve) => {
          const codeClient = win.google.accounts.oauth2.initCodeClient({
            client_id: clientId,
            scope: GCAL_SCOPE,
            ux_mode: 'popup',
            callback: async (resp: any) => {
              if (resp?.error || !resp?.code) {
                resolve({
                  success: false,
                  error: resp?.error_description || resp?.error || 'Autorización denegada por el usuario.'
                });
                return;
              }

              try {
                const headers = await obtenerHeadersGcalAuth();
                const exchangeRes = await fetch(gcalAuthUrl, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ action: 'exchange', code: resp.code })
                });

                if (!exchangeRes.ok) {
                  const errText = await exchangeRes.text().catch(() => '');
                  resolve({
                    success: false,
                    error: `Fallo al intercambiar código en backend: ${exchangeRes.status} ${errText.slice(0, 100)}`
                  });
                  return;
                }

                const data = await exchangeRes.json();
                if (data?.access_token) {
                  const expiresIn = Number(data.expires_in) || 3500;
                  setGoogleCalendarAccessToken(data.access_token, expiresIn);
                  if (data.email) {
                    escribirLocalStorage(GCAL_HINT_STORAGE_KEY, data.email);
                  }
                  emitirCambioEstado();
                  resolve({ success: true, token: data.access_token });
                } else {
                  resolve({
                    success: false,
                    error: data?.error || 'No se recibió access_token del backend.'
                  });
                }
              } catch (exchangeErr: any) {
                resolve({
                  success: false,
                  error: exchangeErr?.message || 'Error de conexión al intercambiar código OAuth.'
                });
              }
            },
            error_callback: (err: any) => {
              resolve({
                success: false,
                error: err?.message || 'Ventana de autorización Google cerrada o bloqueada.'
              });
            }
          });
          codeClient.requestCode();
        });
      }

      // Camino 2 (Fallback estándar o tests): initTokenClient
      if (!win.google?.accounts?.oauth2?.initTokenClient) {
        return {
          success: false,
          error: 'Google Identity Services no inicializó el cliente OAuth2.'
        };
      }

      const hint = leerLocalStorage(GCAL_HINT_STORAGE_KEY) || undefined;

      return await new Promise<{
        success: boolean;
        token?: string;
        requiereConfigClientId?: boolean;
        error?: string;
      }>((resolve) => {
        const tokenClient = win.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GCAL_SCOPE,
          ...(hint ? { hint } : {}),
          callback: (resp: any) => {
            if (resp?.error || !resp?.access_token) {
              resolve({
                success: false,
                error: resp?.error_description || resp?.error || 'Autorización denegada por el usuario.'
              });
              return;
            }
            const expiresIn = Number(resp.expires_in) || 3500;
            setGoogleCalendarAccessToken(resp.access_token, expiresIn);
            void resolverYGuardarHint(resp.access_token);
            resolve({ success: true, token: resp.access_token });
          },
          error_callback: (err: any) => {
            resolve({
              success: false,
              error: err?.message || 'Ventana de autorización Google cerrada o bloqueada.'
            });
          }
        });
        tokenClient.requestAccessToken({
          prompt: silencioso ? 'none' : 'consent',
          ...(hint ? { hint } : {})
        });
      });
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Error al iniciar autorización OAuth con Google Calendar.'
      };
    }
  };

  if (silencioso) {
    promesaRenovacionEnCurso = ejecutarAuth().finally(() => {
      promesaRenovacionEnCurso = null;
    });
    return promesaRenovacionEnCurso;
  }

  return ejecutarAuth();
}

// ============================================================================
// MAPEO PERSISTENTE `actividadId <-> googleEventId` EN localStorage
// ============================================================================

export function obtenerMapaEventosGoogleCalendar(): Record<string, string> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(GCAL_EVENT_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function guardarMapaEventosGoogleCalendar(mapa: Record<string, string>): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GCAL_EVENT_MAP_KEY, JSON.stringify(mapa));
    }
  } catch {
    // Ignorar error de almacenamiento
  }
}

/**
 * Obtiene el ID del evento de Google Calendar.
 * Prioriza estrictamente la columna canónica `id_evento_calendar` de la base de datos.
 * El mapa local en localStorage queda deprecado únicamente como fallback de lectura retrocompatible.
 */
export function obtenerGoogleEventId(actividad: Partial<EntidadAgendable>): string | undefined {
  if (actividad.id_evento_calendar && String(actividad.id_evento_calendar).trim()) {
    return String(actividad.id_evento_calendar).trim();
  }
  const mapa = obtenerMapaEventosGoogleCalendar();
  if (actividad.id && mapa[actividad.id]) return mapa[actividad.id];
  if (actividad.codigo_legado && mapa[actividad.codigo_legado]) return mapa[actividad.codigo_legado];
  return undefined;
}

export function guardarGoogleEventId(actividad: Partial<EntidadAgendable>, eventId: string): void {
  if (!eventId) return;
  const mapa = obtenerMapaEventosGoogleCalendar();
  if (actividad.id) mapa[actividad.id] = eventId;
  if (actividad.codigo_legado) mapa[actividad.codigo_legado] = eventId;
  guardarMapaEventosGoogleCalendar(mapa);
}

export function eliminarGoogleEventId(actividad: Partial<EntidadAgendable>): void {
  const mapa = obtenerMapaEventosGoogleCalendar();
  let changed = false;
  if (actividad.id && actividad.id in mapa) {
    delete mapa[actividad.id];
    changed = true;
  }
  if (actividad.codigo_legado && actividad.codigo_legado in mapa) {
    delete mapa[actividad.codigo_legado];
    changed = true;
  }
  if (changed) guardarMapaEventosGoogleCalendar(mapa);
}

async function persistirEventIdEnDexie(actividad: AgendableCalendarInput, eventId: string | null): Promise<void> {
  const actividadId = actividad?.id;
  if (!actividadId) return;
  try {
    const eid = eventId ?? undefined;
    const now = new Date().toISOString();
    const isTarea = Boolean(
      actividad.nombre_tarea_actividad ||
      actividad.proyecto_codigo ||
      actividad.hito_codigo ||
      String(actividad.codigo_legado || '').startsWith('TAR')
    );

    if (isTarea && db.tareas && typeof db.tareas.update === 'function') {
      await db.tareas.update(actividadId, {
        id_evento_calendar: eid,
        agendado_calendar: eventId ? 'Sí' : 'No',
        updated_at: now
      } as any);
    } else if (db.actividades_personales && typeof db.actividades_personales.update === 'function') {
      await db.actividades_personales.update(actividadId, {
        id_evento_calendar: eid,
        updated_at: now
      });
    } else if (actividad.tipo_entidad === 'GASTO' && db.gastos && typeof db.gastos.update === 'function') {
      await db.gastos.update(actividadId, {
        id_evento_calendar: eid,
        updated_at: now
      } as any);
    } else if (actividad.tipo_entidad === 'INGRESO' && db.ingresos && typeof db.ingresos.update === 'function') {
      await db.ingresos.update(actividadId, {
        id_evento_calendar: eid,
        updated_at: now
      } as any);
    }
  } catch {
    // Tolerar entorno de test donde IndexedDB no está disponible
  }
}

function construirResultadoAuthRequerida(
  actividad: AgendableCalendarInput,
  rrule: string | null,
  eventoV3: EventoGoogleCalendarV3
): ResultadoCalendarSync {
  const tieneClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  return {
    success: false,
    requiereAuth: true,
    requiereConfigClientId: !tieneClientId,
    mode: 'AUTH_REQUIRED',
    rrule,
    eventoV3,
    googleCalendarUrl: construirUrlGoogleCalendar(actividad),
    icsContent: generarArchivoICS(actividad),
    message: tieneClientId
      ? 'Conecta tu cuenta Google Calendar para sincronizar automáticamente'
      : 'Google Calendar no configurado en este entorno (falta VITE_GOOGLE_CLIENT_ID)',
    error: !tieneClientId ? 'Falta configurar VITE_GOOGLE_CLIENT_ID en variables de entorno' : undefined
  };
}

// ============================================================================
// OPERACIONES REALES CONTRA GOOGLE CALENDAR REST API V3 (ROUTER DINÁMICO)
// ============================================================================

export async function obtenerIdCalendarioParaEntidad(entidad: any, token: string): Promise<string> {
  let nombreEsperado = 'primary';
  const tipoEntidad = (entidad?.tipo_entidad || '').toUpperCase();
  const tipoCompromiso = (entidad?.tipo_compromiso || '').toUpperCase();

  if (
    tipoEntidad === 'HABITO' ||
    tipoEntidad === 'ACTIVIDAD' ||
    tipoCompromiso === 'HÁBITO' ||
    tipoCompromiso === 'ACTIVIDAD PUNTUAL'
  ) {
    nombreEsperado = 'MiPortalWeb - Hábitos';
  } else if (tipoEntidad === 'GASTO' || tipoEntidad === 'INGRESO') {
    nombreEsperado = 'MiPortalWeb - Finanzas';
  } else if (tipoEntidad === 'TAREA' || tipoEntidad === 'HITO') {
    nombreEsperado = 'MiPortalWeb - Proyectos';
  }

  if (nombreEsperado === 'primary') return 'primary';

  const cacheKey = `pmo_cal_id_${nombreEsperado}`;
  const cachedId = typeof localStorage !== 'undefined' ? localStorage.getItem(cacheKey) : null;
  if (cachedId) return cachedId;

  try {
    const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      const calEncontrado = listData.items?.find((c: any) => c.summary === nombreEsperado);
      if (calEncontrado?.id) {
        if (typeof localStorage !== 'undefined') localStorage.setItem(cacheKey, calEncontrado.id);
        return calEncontrado.id;
      }
    }

    const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: nombreEsperado, timeZone: 'America/Lima' })
    });
    if (createRes.ok) {
      const createData = await createRes.json();
      if (createData?.id) {
        if (typeof localStorage !== 'undefined') localStorage.setItem(cacheKey, createData.id);
        return createData.id;
      }
    }
  } catch (e) {
    console.warn('[CalendarRouter] Error al enrutar calendario, fallback a primary', e);
  }
  return 'primary';
}

/**
 * CREATE: Crea un evento puntual o serie recurrente (RRULE RFC-5545) en Google Calendar API v3.
 */
export async function sincronizarCreacionCalendar(
  actividad: AgendableCalendarInput
): Promise<ResultadoCalendarSync> {
  const agendadoVal = actividad.agendado_calendar || actividad.agendado_en_calendar;
  if (agendadoVal !== 'Sí') {
    return { success: true, mode: 'SKIPPED' };
  }

  const eventoV3 = construirEventoGoogleCalendarV3(actividad);
  const rrule = construirRRuleRFC5545(actividad);
  const googleCalendarUrl = construirUrlGoogleCalendar(actividad);
  const icsContent = generarArchivoICS(actividad);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      mode: 'OFFLINE',
      rrule,
      eventoV3,
      googleCalendarUrl,
      icsContent,
      error: 'Dispositivo sin conexión a internet'
    };
  }

  const token = await obtenerTokenGoogleCalendar();
  if (!token) {
    return construirResultadoAuthRequerida(actividad, rrule, eventoV3);
  }

  const calendarId = await obtenerIdCalendarioParaEntidad(actividad, token);
  const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  try {
    const response = await fetch(eventsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventoV3)
    });

    if (response.status === 401) {
      limpiarTokenGoogleCalendar();
      return {
        ...construirResultadoAuthRequerida(actividad, rrule, eventoV3),
        error: 'Sesión de Google Calendar expirada. Vuelve a conectar.'
      };
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      return {
        success: false,
        mode: 'API_V3',
        rrule,
        eventoV3,
        googleCalendarUrl,
        icsContent,
        error: `Google Calendar HTTP ${response.status}${errBody ? `: ${errBody.slice(0, 140)}` : ''}`
      };
    }

    const data = await response.json();
    const eventId = String(data?.id || '').trim();
    if (eventId) {
      guardarGoogleEventId(actividad, eventId);
      await persistirEventIdEnDexie(actividad, eventId);
    }

    return {
      success: true,
      mode: 'API_V3',
      eventId: eventId || undefined,
      rrule,
      eventoV3,
      googleCalendarUrl,
      icsContent,
      message: 'Sincronizado en Google Calendar'
    };
  } catch (err: any) {
    return {
      success: false,
      mode: 'API_V3',
      rrule,
      eventoV3,
      googleCalendarUrl,
      icsContent,
      error: err?.message || 'Error de red al crear evento en Google Calendar'
    };
  }
}

/**
 * UPDATE: Actualiza un evento existente en Google Calendar (`PATCH /events/{eventId}`) o lo crea si no existía.
 */
export async function sincronizarActualizacionCalendar(
  actividad: AgendableCalendarInput
): Promise<ResultadoCalendarSync> {
  const eventId = obtenerGoogleEventId(actividad);
  const agendadoVal = actividad.agendado_calendar || actividad.agendado_en_calendar;

  if (agendadoVal !== 'Sí') {
    if (eventId) {
      return sincronizarEliminacionCalendar(actividad, 'ALL');
    }
    return { success: true, mode: 'SKIPPED' };
  }

  if (!eventId) {
    return sincronizarCreacionCalendar(actividad);
  }

  const eventoV3 = construirEventoGoogleCalendarV3(actividad);
  const rrule = construirRRuleRFC5545(actividad);
  const googleCalendarUrl = construirUrlGoogleCalendar(actividad);
  const icsContent = generarArchivoICS(actividad);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      mode: 'OFFLINE',
      eventId,
      rrule,
      eventoV3,
      googleCalendarUrl,
      icsContent,
      error: 'Dispositivo sin conexión a internet'
    };
  }

  const token = await obtenerTokenGoogleCalendar();
  if (!token) {
    return construirResultadoAuthRequerida(actividad, rrule, eventoV3);
  }

  const calendarId = await obtenerIdCalendarioParaEntidad(actividad, token);
  const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  try {
    const response = await fetch(`${eventsUrl}/${encodeURIComponent(eventId)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventoV3)
    });

    if (response.status === 401) {
      limpiarTokenGoogleCalendar();
      return {
        ...construirResultadoAuthRequerida(actividad, rrule, eventoV3),
        error: 'Sesión de Google Calendar expirada. Vuelve a conectar.'
      };
    }

    if (response.status === 404 || response.status === 410) {
      // El evento ya no existe en Google Calendar: recrearlo limpiamente
      eliminarGoogleEventId(actividad);
      return sincronizarCreacionCalendar(actividad);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      return {
        success: false,
        mode: 'API_V3',
        eventId,
        rrule,
        eventoV3,
        googleCalendarUrl,
        icsContent,
        error: `Google Calendar HTTP ${response.status}${errBody ? `: ${errBody.slice(0, 140)}` : ''}`
      };
    }

    const data = await response.json();
    const returnedId = String(data?.id || eventId);
    guardarGoogleEventId(actividad, returnedId);

    return {
      success: true,
      mode: 'API_V3',
      eventId: returnedId,
      rrule,
      eventoV3,
      googleCalendarUrl,
      icsContent,
      message: 'Actualizado en Google Calendar'
    };
  } catch (err: any) {
    return {
      success: false,
      mode: 'API_V3',
      eventId,
      rrule,
      eventoV3,
      googleCalendarUrl,
      icsContent,
      error: err?.message || 'Error de red al actualizar Google Calendar'
    };
  }
}

/**
 * DELETE: Elimina la serie completa (`DELETE`) o excluye una ocurrencia (`SINGLE` -> `PATCH` con `EXDATE`),
 * o recorta la serie (`FUTURE` -> `PATCH` con `UNTIL`).
 */
export async function sincronizarEliminacionCalendar(
  actividad: AgendableCalendarInput,
  alcance: AlcanceRecurrencia | string = 'ALL',
  fechaReferencia?: string
): Promise<ResultadoCalendarSync> {
  const eventId = obtenerGoogleEventId(actividad);
  if (!eventId) {
    eliminarGoogleEventId(actividad);
    return { success: true, mode: 'SKIPPED' };
  }

  const alcanceNorm = String(alcance || 'ALL').toUpperCase();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      mode: 'OFFLINE',
      eventId,
      error: 'Dispositivo sin conexión a internet'
    };
  }

  const token = await obtenerTokenGoogleCalendar();
  if (!token) {
    const eventoFallback = construirEventoGoogleCalendarV3(actividad);
    return {
      ...construirResultadoAuthRequerida(actividad, construirRRuleRFC5545(actividad), eventoFallback),
      eventId
    };
  }

  const calendarId = await obtenerIdCalendarioParaEntidad(actividad, token);
  const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  // Eliminación de una única instancia ('SINGLE'): actualizar recurrence con EXDATE
  if (alcanceNorm === 'SINGLE') {
    const fechaExc = normalizarFechaIso(fechaReferencia || actividad.fecha_programada);
    const prevExcepciones = Array.isArray(actividad.excepciones_fechas) ? [...actividad.excepciones_fechas] : [];
    if (fechaExc && !prevExcepciones.some((f) => normalizarFechaIso(f) === fechaExc)) {
      prevExcepciones.push(fechaExc);
    }

    const actConExcepcion: ActividadPersonal = {
      ...actividad,
      excepciones_fechas: prevExcepciones
    };
    const eventoConExdate = construirEventoGoogleCalendarV3(actConExcepcion);
    const rrule = construirRRuleRFC5545(actConExcepcion);

    try {
      const response = await fetch(`${eventsUrl}/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recurrence: eventoConExdate.recurrence || [] })
      });

      if (response.status === 401) {
        limpiarTokenGoogleCalendar();
        return {
          ...construirResultadoAuthRequerida(actConExcepcion, rrule, eventoConExdate),
          eventId,
          error: 'Sesión de Google Calendar expirada. Vuelve a conectar.'
        };
      }

      if (response.status === 410 || response.status === 404) {
        eliminarGoogleEventId(actividad);
        return { success: true, mode: 'API_V3', eventId };
      }

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        return {
          success: false,
          mode: 'API_V3',
          eventId,
          rrule,
          eventoV3: eventoConExdate,
          error: `Google Calendar HTTP ${response.status}${errBody ? `: ${errBody.slice(0, 140)}` : ''}`
        };
      }

      return {
        success: true,
        mode: 'API_V3',
        eventId,
        rrule,
        eventoV3: eventoConExdate,
        message: 'Ocurrencia excluida en Google Calendar'
      };
    } catch (err: any) {
      return {
        success: false,
        mode: 'API_V3',
        eventId,
        error: err?.message || 'Error de red al excluir ocurrencia en Google Calendar'
      };
    }
  }

  // Corte de serie desde fechaReferencia ('FUTURE'): actualizar UNTIL en Google Calendar
  if (alcanceNorm === 'FUTURE') {
    let fechaFinCorte = normalizarFechaIso(actividad.fecha_fin);
    const fRefNorm = normalizarFechaIso(fechaReferencia || formatFechaIsoLocal());
    if (!fechaFinCorte && fRefNorm) {
      const dAnterior = new Date(`${fRefNorm}T12:00:00`);
      dAnterior.setDate(dAnterior.getDate() - 1);
      fechaFinCorte = formatFechaIsoLocal(dAnterior);
    }

    const actRecortada: ActividadPersonal = {
      ...actividad,
      fecha_fin: fechaFinCorte || undefined
    };
    const eventoRecortado = construirEventoGoogleCalendarV3(actRecortada);
    const rrule = construirRRuleRFC5545(actRecortada);

    try {
      const response = await fetch(`${eventsUrl}/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recurrence: eventoRecortado.recurrence || [] })
      });

      if (response.status === 401) {
        limpiarTokenGoogleCalendar();
        return {
          ...construirResultadoAuthRequerida(actRecortada, rrule, eventoRecortado),
          eventId
        };
      }

      if (!response.ok && response.status !== 410 && response.status !== 404) {
        return {
          success: false,
          mode: 'API_V3',
          eventId,
          error: `Google Calendar HTTP ${response.status}`
        };
      }

      return {
        success: true,
        mode: 'API_V3',
        eventId,
        rrule,
        eventoV3: eventoRecortado,
        message: 'Serie recortada en Google Calendar'
      };
    } catch (err: any) {
      return {
        success: false,
        mode: 'API_V3',
        eventId,
        error: err?.message || 'Error de red al recortar serie en Google Calendar'
      };
    }
  }

  // Eliminación total de evento o serie ('ALL')
  try {
    const response = await fetch(`${eventsUrl}/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      limpiarTokenGoogleCalendar();
      const eventoFallback = construirEventoGoogleCalendarV3(actividad);
      return {
        ...construirResultadoAuthRequerida(actividad, construirRRuleRFC5545(actividad), eventoFallback),
        eventId,
        error: 'Sesión de Google Calendar expirada. Vuelve a conectar.'
      };
    }

    // 200, 204 o 410 Gone se consideran eliminación exitosa
    if (response.ok || response.status === 204 || response.status === 410) {
      eliminarGoogleEventId(actividad);
      await persistirEventIdEnDexie(actividad, null);
      return {
        success: true,
        mode: 'API_V3',
        eventId,
        message: 'Eliminado de Google Calendar'
      };
    }

    const errBody = await response.text().catch(() => '');
    return {
      success: false,
      mode: 'API_V3',
      eventId,
      error: `Google Calendar HTTP ${response.status}${errBody ? `: ${errBody.slice(0, 140)}` : ''}`
    };
  } catch (err: any) {
    return {
      success: false,
      mode: 'API_V3',
      eventId,
      error: err?.message || 'Error de red al eliminar de Google Calendar'
    };
  }
}

/**
 * Facade unificado para despachar CREATE / UPDATE / DELETE hacia Google Calendar API v3.
 */
export async function sincronizarActividadCalendar(
  actividad: AgendableCalendarInput,
  accion: 'UPSERT' | 'DELETE',
  opcionesAlcance?: OpcionesAlcanceCalendar
): Promise<ResultadoCalendarSync> {
  if (accion === 'DELETE') {
    return sincronizarEliminacionCalendar(actividad, opcionesAlcance?.alcance || 'ALL', opcionesAlcance?.fechaRef);
  }
  const existente = obtenerGoogleEventId(actividad);
  if (existente) {
    return sincronizarActualizacionCalendar(actividad);
  }
  return sincronizarCreacionCalendar(actividad);
}

/**
 * Facade polimórfico universal para despachar Tareas hacia Google Calendar API v3.
 */
export async function sincronizarTareaCalendar(
  tarea: AgendableCalendarInput,
  accion: 'UPSERT' | 'DELETE' = 'UPSERT',
  opcionesAlcance?: OpcionesAlcanceCalendar
): Promise<ResultadoCalendarSync> {
  return sincronizarActividadCalendar(tarea, accion, opcionesAlcance);
}

/**
 * Facade polimórfico universal para despachar Gastos hacia Google Calendar API v3.
 */
export async function sincronizarGastoCalendar(
  gasto: any,
  accion: 'UPSERT' | 'DELETE' = 'UPSERT'
): Promise<ResultadoCalendarSync> {
  const agendado = gasto.agendar_calendar !== false && gasto.agendado_calendar !== 'No' ? 'Sí' : 'No';
  return sincronizarActividadCalendar(
    {
      ...gasto,
      tipo_entidad: 'GASTO',
      nombre: gasto.nombre || gasto.descripcion_gasto,
      fecha_programada: gasto.fecha_programada || gasto.fecha_gasto,
      agendado_calendar: agendado
    },
    accion
  );
}

/**
 * Facade polimórfico universal para despachar Ingresos hacia Google Calendar API v3.
 */
export async function sincronizarIngresoCalendar(
  ingreso: any,
  accion: 'UPSERT' | 'DELETE' = 'UPSERT'
): Promise<ResultadoCalendarSync> {
  const agendado = ingreso.agendar_calendar !== false && ingreso.agendado_calendar !== 'No' ? 'Sí' : 'No';
  return sincronizarActividadCalendar(
    {
      ...ingreso,
      tipo_entidad: 'INGRESO',
      nombre: ingreso.nombre || ingreso.descripcion_ingreso,
      fecha_programada: ingreso.fecha_programada || ingreso.fecha_ingreso,
      agendado_calendar: agendado
    },
    accion
  );
}

/**
 * Abre la plantilla estándar de Google Calendar con fecha, hora, zona America/Lima y RRULE precargados.
 */
export function abrirGoogleCalendarActividad(actividad: ActividadRecurrenciaInput): string {
  const url = construirUrlGoogleCalendar(actividad);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return url;
}

/**
 * Descarga un evento RFC-5545 (.ics) listo para importar en Google Calendar / Apple Calendar / Outlook.
 */
export function descargarICSActividad(actividad: ActividadRecurrenciaInput): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const ics = generarArchivoICS(actividad);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${(actividad.codigo_legado || 'actividad').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}
