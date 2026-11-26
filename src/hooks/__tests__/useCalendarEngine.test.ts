import { describe, it, expect, vi } from 'vitest';
import {
  obtenerRangoVisible,
  calcularLayoutSolapados,
  horaAMinutos,
  snapMinutos15,
  minutosAHoraStr,
  calcularRangoReprogramado,
  pesoPrioridadTarea,
  calcularCargaDiariaPorFecha,
  clasificarTareasBacklog,
  devolverTareaABacklogLocal,
  aplicarUndoEntryLocal,
  propagarCambioAGoogleCalendar,
  type CalendarEventItem,
  type CalendarUndoEntry
} from '../useCalendarEngine';
import * as calendarSyncService from '../../services/calendarSyncService';
import {
  normalizarEventosExternosGoogleCalendar,
  type GoogleCalendarApiEventItem
} from '../../services/calendarSyncService';
import { db } from '../../db/db';
import { syncManager } from '../../services/syncManager';
import type { TareaRecord } from '../../types';

function crearEventoTimed(
  id: string,
  horaInicio: string,
  duracionMinutos: number,
  entidad: CalendarEventItem['entidad'] = 'tarea',
  fecha: string = '2026-11-25',
  allDay: boolean = false
): CalendarEventItem {
  return {
    id,
    sourceId: id,
    entidad,
    codigoLegado: 'TAR-001',
    titulo: `Evento ${id}`,
    fecha,
    horaInicio,
    horaFin: '12:00',
    duracionMinutos,
    allDay,
    completado: false,
    rawRef: {
      kind: 'externo_gcal',
      record: {
        id,
        summary: `Evento ${id}`,
        fecha,
        allDay
      }
    }
  };
}

describe('REQ-FEAT-CAL-01: Motor Unificado useCalendarEngine', () => {
  it('calcula rango visible exacto para vistas Día, Semana (Lun-Dom) y Mes', () => {
    // 2026-11-25 es Miércoles
    const ancla = new Date(2026, 10, 25, 12, 0, 0);

    const dia = obtenerRangoVisible(ancla, 'dia');
    expect(dia.fechas).toEqual(['2026-11-25']);
    expect(dia.inicioIso).toBe('2026-11-25');
    expect(dia.finIso).toBe('2026-11-25');

    const semana = obtenerRangoVisible(ancla, 'semana');
    expect(semana.fechas).toHaveLength(7);
    expect(semana.inicioIso).toBe('2026-11-23'); // Lunes
    expect(semana.finIso).toBe('2026-11-29'); // Domingo

    const mes = obtenerRangoVisible(ancla, 'mes');
    expect(mes.fechas.length % 7).toBe(0);
    expect(mes.fechas).toContain('2026-11-01');
    expect(mes.fechas).toContain('2026-11-30');
  });

  it('convierte horas HH:mm a minutos correctamente', () => {
    expect(horaAMinutos('05:00')).toBe(300);
    expect(horaAMinutos('09:30')).toBe(570);
    expect(horaAMinutos('23:45')).toBe(1425);
  });

  it('resuelve columnas de eventos solapados por cluster sin pisar bloques independientes', () => {
    const eventos: CalendarEventItem[] = [
      crearEventoTimed('A', '09:00', 90), // 09:00-10:30
      crearEventoTimed('B', '09:30', 60), // 09:30-10:30 (solapa con A)
      crearEventoTimed('C', '10:00', 60), // 10:00-11:00 (solapa con A y B)
      crearEventoTimed('D', '14:00', 60)  // 14:00-15:00 (cluster independiente)
    ];

    const layout = calcularLayoutSolapados(eventos);
    const map = new Map(layout.map((e) => [e.id, e]));

    expect(map.get('A')?.totalColumns).toBe(3);
    expect(map.get('B')?.totalColumns).toBe(3);
    expect(map.get('C')?.totalColumns).toBe(3);
    expect(new Set([map.get('A')?.columnIndex, map.get('B')?.columnIndex, map.get('C')?.columnIndex]).size).toBe(3);

    expect(map.get('D')?.totalColumns).toBe(1);
    expect(map.get('D')?.columnIndex).toBe(0);
  });

  it('aplica snap de 15 minutos y calcula rango reprogramado respetando mínimo de 15 min y tope 24h (REQ-FEAT-CAL-02)', () => {
    expect(snapMinutos15(547)).toBe(540); // 09:07 -> 09:00
    expect(snapMinutos15(548)).toBe(555); // 09:08 -> 09:15
    expect(minutosAHoraStr(555)).toBe('09:15');

    const rangoNormal = calcularRangoReprogramado(548, 43); // 09:15, 45m
    expect(rangoNormal.horaInicio).toBe('09:15');
    expect(rangoNormal.horaFin).toBe('10:00');
    expect(rangoNormal.duracionMinutos).toBe(45);
    expect(rangoNormal.horasDecimal).toBe(0.75);

    const rangoMinimo = calcularRangoReprogramado(600, 5); // mínimo 15m
    expect(rangoMinimo.horaInicio).toBe('10:00');
    expect(rangoMinimo.horaFin).toBe('10:15');
    expect(rangoMinimo.duracionMinutos).toBe(15);
    expect(rangoMinimo.horasDecimal).toBe(0.25);

    // Orden de prioridad en panel Por Agendar
    expect(pesoPrioridadTarea('Q1_Urgente')).toBeLessThan(pesoPrioridadTarea('Q2_Alta'));
    expect(pesoPrioridadTarea('Q2_Alta')).toBeLessThan(pesoPrioridadTarea('03_P3_Media'));
  });

  it('deduplica eventos de Google Calendar con pmoId y cancelados, normalizando timed y allDay (REQ-FEAT-CAL-03)', () => {
    const rawItems: GoogleCalendarApiEventItem[] = [
      {
        id: 'ev-propio-pmo',
        status: 'confirmed',
        summary: 'Tarea propia ya en Dexie',
        start: { dateTime: '2026-11-25T10:00:00-05:00' },
        end: { dateTime: '2026-11-25T11:00:00-05:00' },
        extendedProperties: { private: { pmoId: 'tar-uuid-123' } }
      },
      {
        id: 'ev-cancelado',
        status: 'cancelled',
        summary: 'Reunión cancelada',
        start: { dateTime: '2026-11-25T12:00:00-05:00' },
        end: { dateTime: '2026-11-25T13:00:00-05:00' }
      },
      {
        id: 'ev-externo-meet',
        status: 'confirmed',
        summary: 'Comité Directorio',
        location: 'Sala Zoom',
        htmlLink: 'https://calendar.google.com/event?eid=1',
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
        start: { dateTime: '2026-11-25T14:00:00-05:00' },
        end: { dateTime: '2026-11-25T15:30:00-05:00' }
      },
      {
        id: 'ev-feriado',
        status: 'confirmed',
        summary: 'Feriado Nacional',
        start: { date: '2026-11-26' },
        end: { date: '2026-11-27' }
      }
    ];

    const normalizados = normalizarEventosExternosGoogleCalendar(rawItems);
    expect(normalizados).toHaveLength(2);

    const meet = normalizados.find((e) => e.id === 'ev-externo-meet');
    expect(meet).toBeDefined();
    expect(meet?.allDay).toBe(false);
    expect(meet?.duracionMinutos).toBe(90);
    expect(meet?.location).toBe('Sala Zoom');
    expect(meet?.hangoutLink).toBe('https://meet.google.com/abc-defg-hij');
    expect(meet?.htmlLink).toBe('https://calendar.google.com/event?eid=1');

    const feriado = normalizados.find((e) => e.id === 'ev-feriado');
    expect(feriado).toBeDefined();
    expect(feriado?.allDay).toBe(true);
    expect(feriado?.fecha).toBe('2026-11-26');
  });

  it('calcula cargaDiariaPorFecha clasificando normal (<=75%), alta (76-100%) y sobrecarga (>100%) (REQ-FEAT-CAL-03)', () => {
    const fechas = ['2026-11-25', '2026-11-26', '2026-11-27'];
    const eventos: CalendarEventItem[] = [
      // Día 1: 4h (50% -> normal) + allDay ignorado
      crearEventoTimed('t1', '09:00', 180, 'tarea', '2026-11-25', false),
      crearEventoTimed('g1', '14:00', 60, 'externo_gcal', '2026-11-25', false),
      crearEventoTimed('h1', '00:00', 480, 'hito', '2026-11-25', true),
      // Día 2: 7h (88% -> alta)
      crearEventoTimed('t2', '08:00', 240, 'tarea', '2026-11-26', false),
      crearEventoTimed('a2', '13:00', 180, 'actividad', '2026-11-26', false),
      // Día 3: 9.5h (119% -> sobrecarga)
      crearEventoTimed('t3', '08:00', 300, 'tarea', '2026-11-27', false),
      crearEventoTimed('g3', '14:00', 270, 'externo_gcal', '2026-11-27', false)
    ];

    const carga = calcularCargaDiariaPorFecha(fechas, eventos, 8);

    expect(carga['2026-11-25']).toEqual({
      horasComprometidas: 4,
      capacidadHoras: 8,
      porcentaje: 50,
      nivel: 'normal'
    });
    expect(carga['2026-11-26']).toEqual({
      horasComprometidas: 7,
      capacidadHoras: 8,
      porcentaje: 88,
      nivel: 'alta'
    });
    expect(carga['2026-11-27']).toEqual({
      horasComprometidas: 9.5,
      capacidadHoras: 8,
      porcentaje: 119,
      nivel: 'sobrecarga'
    });
  });

  it('separa tareasVencidasReprogramar vs tareasSinHora sin duplicados y excluye completadas/agendadas (REQ-UX-CAL-05)', () => {
    const base = {
      user_id: 'u1',
      updated_at: '2026-11-25T00:00:00Z',
      sync_status: 'synced' as const
    };

    const tareas: TareaRecord[] = [
      {
        ...base,
        id: 't-vencida-con-hora',
        codigo_legado: 'TAR-001',
        nombre_tarea_actividad: 'Vencida con hora',
        estado_tarea: '02_Por_Hacer',
        prioridad_eisenhower: 'Q2_Alta',
        fecha_programada: '2026-11-20',
        hora_inicio: '09:00'
      },
      {
        ...base,
        id: 't-vencida-sin-hora',
        codigo_legado: 'TAR-002',
        nombre_tarea_actividad: 'Vencida sin hora (debe ir solo en vencidas)',
        estado_tarea: '03_En_Proceso',
        prioridad_eisenhower: 'Q1_Urgente',
        fecha_programada: '2026-11-22',
        hora_inicio: ''
      },
      {
        ...base,
        id: 't-hoy-sin-hora',
        codigo_legado: 'TAR-003',
        nombre_tarea_actividad: 'Pendiente de hoy sin hora',
        estado_tarea: '02_Por_Hacer',
        prioridad_eisenhower: 'Q2_Alta',
        fecha_programada: '2026-11-25',
        hora_inicio: ''
      },
      {
        ...base,
        id: 't-hoy-agendada',
        codigo_legado: 'TAR-004',
        nombre_tarea_actividad: 'Agendada hoy a las 10:00',
        estado_tarea: '02_Por_Hacer',
        fecha_programada: '2026-11-25',
        hora_inicio: '10:00'
      },
      {
        ...base,
        id: 't-completada',
        codigo_legado: 'TAR-005',
        nombre_tarea_actividad: 'Completada antigua',
        estado_tarea: '04_Completado',
        fecha_programada: '2026-11-10',
        hora_inicio: ''
      }
    ];

    const { tareasVencidasReprogramar, tareasSinHora } = clasificarTareasBacklog(
      tareas,
      '2026-11-25'
    );

    // Vencidas ordenadas por prioridad (Q1 primero, luego Q2)
    expect(tareasVencidasReprogramar.map((t) => t.id)).toEqual([
      't-vencida-sin-hora',
      't-vencida-con-hora'
    ]);

    // Sin hora excluye la que ya está en vencidas, las agendadas y las completadas
    expect(tareasSinHora.map((t) => t.id)).toEqual(['t-hoy-sin-hora']);
  });

  it('devolverTareaABacklog limpia hora_inicio con sync_status pending y dispara sincronización (REQ-UX-CAL-05)', async () => {
    const updateSpy = vi.spyOn(db.tareas, 'update').mockResolvedValue(1);
    const syncSpy = vi.spyOn(syncManager, 'sincronizarTodo').mockResolvedValue(undefined);

    const ok = await devolverTareaABacklogLocal('tar-123');
    expect(ok).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith(
      'tar-123',
      expect.objectContaining({
        hora_inicio: '',
        sync_status: 'pending'
      })
    );
    expect(syncSpy).toHaveBeenCalledTimes(1);

    updateSpy.mockRestore();
    syncSpy.mockRestore();
  });

  it('ciclo Undo (aplicarUndoEntryLocal): restaura snapshot previo, marca sync_status pending, dispara sync y propaga a GCal (REQ-FEAT-CAL-07)', async () => {
    const tareaRestaurada: TareaRecord = {
      id: 'tar-undo-1',
      user_id: 'u1',
      codigo_legado: 'TAR-060',
      nombre_tarea_actividad: 'Revisar arquitectura',
      estado_tarea: '02_Por_Hacer',
      fecha_programada: '2026-11-25',
      hora_inicio: '09:00',
      horas_estimadas: 1.5,
      agendado_calendar: 'Sí',
      id_evento_calendar: 'gcal-evt-060',
      updated_at: '2026-11-25T10:00:00Z',
      sync_status: 'pending'
    };

    const updateSpy = vi.spyOn(db.tareas, 'update').mockResolvedValue(1);
    const getSpy = vi.spyOn(db.tareas, 'get').mockResolvedValue(tareaRestaurada);
    const syncSpy = vi.spyOn(syncManager, 'sincronizarTodo').mockResolvedValue(undefined);
    const tokenSpy = vi
      .spyOn(calendarSyncService, 'obtenerTokenGoogleCalendar')
      .mockResolvedValue('mock-access-token');
    const gcalSpy = vi
      .spyOn(calendarSyncService, 'sincronizarTareaCalendar')
      .mockResolvedValue({ success: true, mode: 'API_V3', eventId: 'gcal-evt-060' });

    const entry: CalendarUndoEntry = {
      entidad: 'tarea',
      id: 'tar-undo-1',
      etiqueta: 'Reprogramación de TAR-060',
      snapshot: {
        fecha_programada: '2026-11-25',
        hora_inicio: '09:00',
        horas_estimadas: 1.5,
        estado_tarea: '02_Por_Hacer',
        fecha_completado: undefined
      }
    };

    const ok = await aplicarUndoEntryLocal(entry);
    expect(ok).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith(
      'tar-undo-1',
      expect.objectContaining({
        fecha_programada: '2026-11-25',
        hora_inicio: '09:00',
        horas_estimadas: 1.5,
        estado_tarea: '02_Por_Hacer',
        sync_status: 'pending'
      })
    );
    expect(syncSpy).toHaveBeenCalledTimes(1);

    // Esperar microtarea de propagación no bloqueante a Google Calendar
    await Promise.resolve();
    await Promise.resolve();
    expect(gcalSpy).toHaveBeenCalledWith(tareaRestaurada, 'UPSERT');

    // Verificar que si una tarea NO está vinculada a GCal, propagarCambioAGoogleCalendar no llama a la API
    gcalSpy.mockClear();
    await propagarCambioAGoogleCalendar('tarea', {
      ...tareaRestaurada,
      agendado_calendar: 'No',
      id_evento_calendar: undefined
    });
    expect(gcalSpy).not.toHaveBeenCalled();

    updateSpy.mockRestore();
    getSpy.mockRestore();
    syncSpy.mockRestore();
    tokenSpy.mockRestore();
    gcalSpy.mockRestore();
  });
});
