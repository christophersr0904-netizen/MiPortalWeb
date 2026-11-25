import { describe, it, expect } from 'vitest';
import {
  obtenerRangoVisible,
  calcularLayoutSolapados,
  horaAMinutos,
  snapMinutos15,
  minutosAHoraStr,
  calcularRangoReprogramado,
  pesoPrioridadTarea,
  calcularCargaDiariaPorFecha,
  type CalendarEventItem
} from '../useCalendarEngine';
import {
  normalizarEventosExternosGoogleCalendar,
  type GoogleCalendarApiEventItem
} from '../../services/calendarSyncService';

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
});
