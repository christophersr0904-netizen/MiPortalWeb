import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GOOGLE_CALENDAR_API_BASE,
  GCAL_EVENT_MAP_KEY,
  setGoogleCalendarAccessToken,
  limpiarTokenGoogleCalendar,
  obtenerMapaEventosGoogleCalendar,
  sincronizarCreacionCalendar,
  sincronizarActualizacionCalendar,
  sincronizarEliminacionCalendar
} from '../calendarSyncService';
import type { ActividadPersonal } from '../../types';

function crearMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (idx: number) => Array.from(store.keys())[idx] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    }
  };
}

const actividadBaseRecurrente: ActividadPersonal = {
  id: 'act-gcal-001',
  user_id: 'user-001',
  codigo_legado: 'ACT-501',
  nombre_actividad: 'Simulador PMP 60 min',
  tipo_compromiso: 'HABITUAL',
  categoria_vida: 'DESARROLLO_ESTUDIO',
  estado: '02_Por_Hacer',
  racha_actual: 4,
  fecha_programada: '2026-11-12',
  hora_inicio: '07:30',
  duracion_horas: 1,
  agendado_calendar: 'Sí',
  frecuencia_ciclo: 'DIARIA_LABORAL',
  regla_repeticion: 'DIAS:LU,MA,MI,JU,VI',
  updated_at: '2026-11-12T07:00:00Z',
  version: 1,
  sync_status: 'pending'
};

const actividadPuntual: ActividadPersonal = {
  ...actividadBaseRecurrente,
  id: 'act-gcal-puntual',
  codigo_legado: 'ACT-502',
  nombre_actividad: 'Control Médico Anual',
  tipo_compromiso: 'PUNTUAL',
  frecuencia_ciclo: 'NINGUNA',
  regla_repeticion: '',
  hora_inicio: '15:00',
  duracion_horas: 1.5
};

describe('Google Calendar REST API v3 Real Sync [REQ-UI-39-GCAL-REAL-SYNC]', () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  beforeEach(() => {
    vi.stubGlobal('localStorage', crearMemoryStorage());
    vi.stubGlobal('sessionStorage', crearMemoryStorage());
    vi.stubGlobal('navigator', { onLine: true });
    limpiarTokenGoogleCalendar();
  });

  afterEach(() => {
    limpiarTokenGoogleCalendar();
    vi.stubGlobal('fetch', originalFetch);
    if (originalLocalStorage) vi.stubGlobal('localStorage', originalLocalStorage);
    if (originalSessionStorage) vi.stubGlobal('sessionStorage', originalSessionStorage);
    vi.restoreAllMocks();
  });

  it('1. Creación puntual y recurrente (POST): envía Bearer token, America/Lima, RRULE y guarda eventId en pmo_gcal_event_map', async () => {
    setGoogleCalendarAccessToken('ya29.test-token-create', 3600);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'gcal_ev_recurrente_123' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'gcal_ev_puntual_456' })
      });
    vi.stubGlobal('fetch', fetchMock);

    // 1A. Recurrente
    const resRec = await sincronizarCreacionCalendar(actividadBaseRecurrente);
    expect(resRec.success).toBe(true);
    expect(resRec.mode).toBe('API_V3');
    expect(resRec.eventId).toBe('gcal_ev_recurrente_123');

    const [urlRec, optsRec] = fetchMock.mock.calls[0];
    expect(urlRec).toBe(GOOGLE_CALENDAR_API_BASE);
    expect(optsRec.method).toBe('POST');
    expect(optsRec.headers.Authorization).toBe('Bearer ya29.test-token-create');
    const bodyRec = JSON.parse(optsRec.body);
    expect(bodyRec.summary).toBe('Simulador PMP 60 min');
    expect(bodyRec.start).toEqual({
      dateTime: '2026-11-12T07:30:00-05:00',
      timeZone: 'America/Lima'
    });
    expect(bodyRec.end).toEqual({
      dateTime: '2026-11-12T08:30:00-05:00',
      timeZone: 'America/Lima'
    });
    expect(bodyRec.recurrence).toEqual(['RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR']);

    // 1B. Puntual
    const resPuntual = await sincronizarCreacionCalendar(actividadPuntual);
    expect(resPuntual.success).toBe(true);
    expect(resPuntual.eventId).toBe('gcal_ev_puntual_456');

    const [, optsPuntual] = fetchMock.mock.calls[1];
    const bodyPuntual = JSON.parse(optsPuntual.body);
    expect(bodyPuntual.start.dateTime).toBe('2026-11-12T15:00:00-05:00');
    expect(bodyPuntual.end.dateTime).toBe('2026-11-12T16:30:00-05:00');
    expect(bodyPuntual.recurrence).toBeUndefined();

    // Mapeo persistente en localStorage bajo pmo_gcal_event_map
    const mapa = obtenerMapaEventosGoogleCalendar();
    expect(mapa['act-gcal-001']).toBe('gcal_ev_recurrente_123');
    expect(mapa['act-gcal-puntual']).toBe('gcal_ev_puntual_456');
    expect(JSON.parse(localStorage.getItem(GCAL_EVENT_MAP_KEY) || '{}')['act-gcal-001']).toBe('gcal_ev_recurrente_123');
  });

  it('2. Actualización (PATCH): modifica el eventId existente con nueva hora y regla de repetición', async () => {
    setGoogleCalendarAccessToken('ya29.test-token-patch', 3600);
    localStorage.setItem(GCAL_EVENT_MAP_KEY, JSON.stringify({ 'act-gcal-001': 'gcal_ev_recurrente_123' }));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'gcal_ev_recurrente_123' })
    });
    vi.stubGlobal('fetch', fetchMock);

    const actividadEditada: ActividadPersonal = {
      ...actividadBaseRecurrente,
      nombre_actividad: 'Simulador PMP Intensivo',
      hora_inicio: '09:00',
      duracion_horas: 2,
      frecuencia_ciclo: 'SEMANAL',
      regla_repeticion: 'INTERVALO:2:SEMANAS;DIAS:MA,JU'
    };

    const res = await sincronizarActualizacionCalendar(actividadEditada);
    expect(res.success).toBe(true);
    expect(res.mode).toBe('API_V3');
    expect(res.eventId).toBe('gcal_ev_recurrente_123');

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe(`${GOOGLE_CALENDAR_API_BASE}/gcal_ev_recurrente_123`);
    expect(opts.method).toBe('PATCH');
    expect(opts.headers.Authorization).toBe('Bearer ya29.test-token-patch');
    const body = JSON.parse(opts.body);
    expect(body.summary).toBe('Simulador PMP Intensivo');
    expect(body.start.dateTime).toBe('2026-11-12T09:00:00-05:00');
    expect(body.end.dateTime).toBe('2026-11-12T11:00:00-05:00');
    expect(body.recurrence).toEqual(['RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH']);
  });

  it('3. Eliminación total (DELETE ALL): invoca DELETE /events/{eventId} (204 / 410) y limpia pmo_gcal_event_map', async () => {
    setGoogleCalendarAccessToken('ya29.test-token-delete', 3600);
    localStorage.setItem(
      GCAL_EVENT_MAP_KEY,
      JSON.stringify({ 'act-gcal-001': 'gcal_ev_del_999', 'ACT-501': 'gcal_ev_del_999' })
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await sincronizarEliminacionCalendar(actividadBaseRecurrente, 'ALL');
    expect(res.success).toBe(true);
    expect(res.mode).toBe('API_V3');

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe(`${GOOGLE_CALENDAR_API_BASE}/gcal_ev_del_999`);
    expect(opts.method).toBe('DELETE');
    expect(opts.headers.Authorization).toBe('Bearer ya29.test-token-delete');

    const mapa = obtenerMapaEventosGoogleCalendar();
    expect(mapa['act-gcal-001']).toBeUndefined();
    expect(mapa['ACT-501']).toBeUndefined();

    // También acepta 410 Gone como éxito limpio
    localStorage.setItem(GCAL_EVENT_MAP_KEY, JSON.stringify({ 'act-gcal-001': 'gcal_ev_gone_410' }));
    fetchMock.mockResolvedValueOnce({ ok: false, status: 410 });
    const resGone = await sincronizarEliminacionCalendar(actividadBaseRecurrente, 'ALL');
    expect(resGone.success).toBe(true);
    expect(obtenerMapaEventosGoogleCalendar()['act-gcal-001']).toBeUndefined();
  });

  it('4. Eliminación de instancia única (SINGLE): envía PATCH con EXDATE en recurrence sin borrar la serie', async () => {
    setGoogleCalendarAccessToken('ya29.test-token-single', 3600);
    localStorage.setItem(GCAL_EVENT_MAP_KEY, JSON.stringify({ 'act-gcal-001': 'gcal_ev_series_777' }));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'gcal_ev_series_777' })
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await sincronizarEliminacionCalendar(actividadBaseRecurrente, 'SINGLE', '2026-11-18');
    expect(res.success).toBe(true);
    expect(res.mode).toBe('API_V3');

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe(`${GOOGLE_CALENDAR_API_BASE}/gcal_ev_series_777`);
    expect(opts.method).toBe('PATCH');
    const body = JSON.parse(opts.body);
    expect(body.recurrence).toEqual([
      'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      'EXDATE;TZID=America/Lima:20261118T073000'
    ]);

    // La serie sigue mapeada en localStorage
    expect(obtenerMapaEventosGoogleCalendar()['act-gcal-001']).toBe('gcal_ev_series_777');
  });

  it('5. Manejo sin token OAuth: nunca retorna falso success:true, devuelve requiereAuth:true y enlace TEMPLATE', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const resCreate = await sincronizarCreacionCalendar(actividadBaseRecurrente);
    expect(resCreate.success).toBe(false);
    expect(resCreate.requiereAuth).toBe(true);
    expect(resCreate.mode).toBe('AUTH_REQUIRED');
    expect(resCreate.googleCalendarUrl).toContain('https://calendar.google.com/calendar/render?');

    localStorage.setItem(GCAL_EVENT_MAP_KEY, JSON.stringify({ 'act-gcal-001': 'gcal_ev_existing' }));

    const resUpdate = await sincronizarActualizacionCalendar(actividadBaseRecurrente);
    expect(resUpdate.success).toBe(false);
    expect(resUpdate.requiereAuth).toBe(true);
    expect(resUpdate.mode).toBe('AUTH_REQUIRED');

    const resDelete = await sincronizarEliminacionCalendar(actividadBaseRecurrente, 'ALL');
    expect(resDelete.success).toBe(false);
    expect(resDelete.requiereAuth).toBe(true);
    expect(resDelete.mode).toBe('AUTH_REQUIRED');

    // Cero peticiones de red lanzadas sin autorización
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

