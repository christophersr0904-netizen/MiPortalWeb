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
export const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

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
}

let accessTokenMemoria: string | null = null;
let expiresAtMemoria = 0;
const listenersEstado = new Set<(estado: EstadoConexionGoogleCalendar) => void>();

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

function leerSessionStorage(key: string): string | null {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(key);
    }
  } catch {
    // Ignorar en entornos restringidos
  }
  return null;
}

function escribirSessionStorage(key: string, value: string | null): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (value === null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, value);
    }
  } catch {
    // Ignorar en entornos restringidos
  }
}

export function setGoogleCalendarAccessToken(token: string | null, expiresInSeconds = 3500): void {
  if (!token) {
    accessTokenMemoria = null;
    expiresAtMemoria = 0;
    escribirSessionStorage(GCAL_TOKEN_STORAGE_KEY, null);
    escribirSessionStorage(GCAL_EXPIRES_STORAGE_KEY, null);
    emitirCambioEstado();
    return;
  }
  const exp = Date.now() + Math.max(60, expiresInSeconds) * 1000;
  accessTokenMemoria = token;
  expiresAtMemoria = exp;
  escribirSessionStorage(GCAL_TOKEN_STORAGE_KEY, token);
  escribirSessionStorage(GCAL_EXPIRES_STORAGE_KEY, String(exp));
  emitirCambioEstado();
}

export function limpiarTokenGoogleCalendar(): void {
  setGoogleCalendarAccessToken(null);
}

function obtenerTokenSincrono(): string | null {
  const margenMs = 15000;
  if (accessTokenMemoria && (expiresAtMemoria === 0 || Date.now() + margenMs < expiresAtMemoria)) {
    return accessTokenMemoria;
  }

  const tokenStorage = leerSessionStorage(GCAL_TOKEN_STORAGE_KEY);
  const expRaw = leerSessionStorage(GCAL_EXPIRES_STORAGE_KEY);
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
  return {
    conectado: Boolean(token),
    tieneClientId: Boolean(clientId),
    expiraEn: expiresAtMemoria || undefined
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
 * Obtiene un Bearer access_token vigente desde memoria/sessionStorage o desde Supabase Auth (`provider_token`).
 */
export async function obtenerTokenGoogleCalendar(): Promise<string | null> {
  const tokenLocal = obtenerTokenSincrono();
  if (tokenLocal) return tokenLocal;

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
    // Continuar sin token si falla lectura de sesión
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
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity Services')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Inicia autorización OAuth2 directa con Google Identity Services (`calendar.events`).
 */
export async function autorizarGoogleCalendarOAuth(): Promise<{
  success: boolean;
  token?: string;
  requiereConfigClientId?: boolean;
  error?: string;
}> {
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) {
    return {
      success: false,
      requiereConfigClientId: true,
      error: 'Configura VITE_GOOGLE_CLIENT_ID en .env para habilitar OAuth automático con Google Calendar.'
    };
  }

  try {
    await cargarScriptGIS();
    const win = window as any;
    if (!win.google?.accounts?.oauth2?.initTokenClient) {
      return {
        success: false,
        error: 'Google Identity Services no inicializó el cliente OAuth2.'
      };
    }

    return await new Promise((resolve) => {
      const tokenClient = win.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GCAL_SCOPE,
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
          resolve({ success: true, token: resp.access_token });
        },
        error_callback: (err: any) => {
          resolve({
            success: false,
            error: err?.message || 'Ventana de autorización Google cerrada o bloqueada.'
          });
        }
      });
      tokenClient.requestAccessToken({ prompt: accessTokenMemoria ? '' : 'consent' });
    });
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error al iniciar autorización OAuth con Google Calendar.'
    };
  }
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

export function obtenerGoogleEventId(actividad: Partial<EntidadAgendable>): string | undefined {
  const mapa = obtenerMapaEventosGoogleCalendar();
  if (actividad.id && mapa[actividad.id]) return mapa[actividad.id];
  if (actividad.codigo_legado && mapa[actividad.codigo_legado]) return mapa[actividad.codigo_legado];
  if (actividad.id_evento_calendar && String(actividad.id_evento_calendar).trim()) {
    return String(actividad.id_evento_calendar).trim();
  }
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
  return {
    success: false,
    requiereAuth: true,
    mode: 'AUTH_REQUIRED',
    rrule,
    eventoV3,
    googleCalendarUrl: construirUrlGoogleCalendar(actividad),
    icsContent: generarArchivoICS(actividad),
    message: 'Conecta tu cuenta Google Calendar para sincronizar automáticamente'
  };
}

// ============================================================================
// OPERACIONES REALES CONTRA GOOGLE CALENDAR REST API V3
// ============================================================================

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

  try {
    const response = await fetch(GOOGLE_CALENDAR_API_BASE, {
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

  try {
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/${encodeURIComponent(eventId)}`, {
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
      const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/${encodeURIComponent(eventId)}`, {
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
      const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/${encodeURIComponent(eventId)}`, {
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
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/${encodeURIComponent(eventId)}`, {
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
