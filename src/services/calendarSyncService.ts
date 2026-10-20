/**
 * ============================================================================
 * ARCHIVO: src/services/calendarSyncService.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-CAL-02
 * DESCRIPCIÓN: Adaptador de integración resiliente con Google Calendar (GAS / WebApp).
 *              Diseño tolerante a fallos, no bloqueante para la UI y compatible
 *              con sincronización Local-First (Dexie/IndexedDB).
 * ============================================================================
 */

import { db } from '../db/db';
import type { ActividadPersonal } from '../types';

export interface OpcionesAlcanceCalendar {
  alcance?: string; // 'SINGLE' | 'FUTURE' | 'ALL'
  fechaRef?: string; // YYYY-MM-DD
}

export interface ResultadoCalendarSync {
  success: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Despacha reactivamente la sincronización de una actividad con Google Calendar.
 * Si el endpoint no está configurado o el entorno está offline, finaliza limpiamente
 * sin interrumpir el flujo del usuario ni lanzar excepciones no capturadas.
 */
export async function sincronizarActividadCalendar(
  actividad: ActividadPersonal,
  accion: 'UPSERT' | 'DELETE',
  opcionesAlcance?: OpcionesAlcanceCalendar
): Promise<ResultadoCalendarSync> {
  // 1. Verificación previa de bandera de agendamiento
  if (actividad.agendado_calendar !== 'Sí' && accion !== 'DELETE') {
    return { success: true };
  }

  // 2. Detección de conectividad
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn('[CalendarSyncService] Dispositivo offline. Sincronización con Calendar postergada.');
    return { success: false, error: 'Dispositivo sin conexión a internet' };
  }

  // 3. Resolución de Endpoint configurado en entorno
  const endpointUrl =
    import.meta.env.VITE_GAS_WEBAPP_URL ||
    import.meta.env.VITE_CALENDAR_ENDPOINT ||
    '';

  if (!endpointUrl) {
    // Modo local-first: no hay endpoint configurado, no bloquear la experiencia
    return {
      success: true,
      error: 'Endpoint de Google Calendar no configurado (operación puramente local)'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const payload = {
      accion,
      idActividad: actividad.codigo_legado || actividad.id,
      idEventoCalendar: actividad.id_evento_calendar || '',
      nombreActividad: actividad.nombre_actividad,
      categoriaVida: actividad.categoria_vida,
      tipoCompromiso: actividad.tipo_compromiso,
      fechaProgramada: actividad.fecha_programada,
      horaInicio: actividad.hora_inicio || '08:00',
      duracionHoras: actividad.duracion_horas,
      frecuenciaCiclo: actividad.frecuencia_ciclo || 'NINGUNA',
      reglaRepeticion: actividad.regla_repeticion || '',
      alcance: opcionesAlcance?.alcance || 'ALL',
      fechaReferencia: opcionesAlcance?.fechaRef || actividad.fecha_programada
    };

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errTxt = `Error HTTP ${response.status} en Calendar WebApp`;
      console.warn('[CalendarSyncService]', errTxt);
      return { success: false, error: errTxt };
    }

    const data = await response.json();

    // Si Google Calendar retornó un eventId y fue un UPSERT, persistirlo en Dexie
    if (data.success && data.eventId && actividad.id && accion === 'UPSERT') {
      try {
        await db.actividades_personales.update(actividad.id, {
          id_evento_calendar: data.eventId,
          updated_at: new Date().toISOString()
        });
      } catch (eDexie) {
        console.warn('[CalendarSyncService] Error al actualizar id_evento_calendar en Dexie:', eDexie);
      }
    }

    return {
      success: Boolean(data.success),
      eventId: data.eventId,
      error: data.error
    };
  } catch (err: any) {
    const errMsg = err?.name === 'AbortError' ? 'Timeout de conexión con Google Calendar' : err?.message || 'Error de red';
    console.warn('[CalendarSyncService] Excepción de sincronización:', errMsg);
    return { success: false, error: errMsg };
  }
}
