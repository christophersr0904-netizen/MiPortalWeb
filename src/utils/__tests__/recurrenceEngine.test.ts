import { describe, it, expect } from 'vitest';
import {
  evaluarOcurrenciaEnFecha,
  construirRRuleRFC5545,
  construirEventoGoogleCalendarV3,
  construirUrlGoogleCalendar,
  generarArchivoICS
} from '../recurrenceEngine';

describe('Motor Unificado de Recurrencias y Estándar RFC-5545 [REQ-UI-38-EXEC]', () => {
  describe('evaluarOcurrenciaEnFecha', () => {
    it('proyecta actividad puntual únicamente en su fecha_programada', () => {
      const puntual = {
        tipo_compromiso: 'PUNTUAL',
        frecuencia_ciclo: 'NINGUNA',
        fecha_programada: '2026-11-12'
      };
      expect(evaluarOcurrenciaEnFecha(puntual, '2026-11-11')).toBe(false);
      expect(evaluarOcurrenciaEnFecha(puntual, '2026-11-12')).toBe(true);
      expect(evaluarOcurrenciaEnFecha(puntual, '2026-11-13')).toBe(false);
    });

    it('respeta fecha_programada (inicio), fecha_fin (término) y excepciones_fechas', () => {
      const diaria = {
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'DIARIA',
        fecha_programada: '2026-11-10',
        fecha_fin: '2026-11-15',
        excepciones_fechas: ['2026-11-12']
      };
      expect(evaluarOcurrenciaEnFecha(diaria, '2026-11-09')).toBe(false);
      expect(evaluarOcurrenciaEnFecha(diaria, '2026-11-10')).toBe(true);
      expect(evaluarOcurrenciaEnFecha(diaria, '2026-11-12')).toBe(false);
      expect(evaluarOcurrenciaEnFecha(diaria, '2026-11-15')).toBe(true);
      expect(evaluarOcurrenciaEnFecha(diaria, '2026-11-16')).toBe(false);
    });

    it('distingue DIARIA_LABORAL (L-V) y FIN_SEMANA (S-D)', () => {
      const laboral = {
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'DIARIA_LABORAL',
        fecha_programada: '2026-11-09' // Lunes
      };
      // 2026-11-13 Viernes, 2026-11-14 Sábado, 2026-11-15 Domingo
      expect(evaluarOcurrenciaEnFecha(laboral, '2026-11-13')).toBe(true);
      expect(evaluarOcurrenciaEnFecha(laboral, '2026-11-14')).toBe(false);
      expect(evaluarOcurrenciaEnFecha(laboral, '2026-11-15')).toBe(false);

      const finde = {
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'FIN_SEMANA',
        fecha_programada: '2026-11-09'
      };
      expect(evaluarOcurrenciaEnFecha(finde, '2026-11-13')).toBe(false);
      expect(evaluarOcurrenciaEnFecha(finde, '2026-11-14')).toBe(true);
      expect(evaluarOcurrenciaEnFecha(finde, '2026-11-15')).toBe(true);
    });

    it('proyecta SEMANAL con días específicos e intervalos INTERVALO:N:SEMANAS', () => {
      const quincenal = {
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'SEMANAL',
        regla_repeticion: 'INTERVALO:2:SEMANAS;DIAS:LU,JU',
        fecha_programada: '2026-11-02' // Lunes semana 0
      };
      // Semana 0: Jue 2026-11-05 -> sí; Mar 2026-11-03 -> no
      expect(evaluarOcurrenciaEnFecha(quincenal, '2026-11-02')).toBe(true);
      expect(evaluarOcurrenciaEnFecha(quincenal, '2026-11-03')).toBe(false);
      expect(evaluarOcurrenciaEnFecha(quincenal, '2026-11-05')).toBe(true);
      // Semana 1 (intermedia): Lun 2026-11-09 -> no
      expect(evaluarOcurrenciaEnFecha(quincenal, '2026-11-09')).toBe(false);
      // Semana 2: Lun 2026-11-16 y Jue 2026-11-19 -> sí
      expect(evaluarOcurrenciaEnFecha(quincenal, '2026-11-16')).toBe(true);
      expect(evaluarOcurrenciaEnFecha(quincenal, '2026-11-19')).toBe(true);
    });

    it('proyecta QUINCENAL, MENSUAL e INTERVALO:N:DIAS correctamente', () => {
      const cadaTresDias = {
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'DIARIA',
        regla_repeticion: 'INTERVALO:3:DIAS',
        fecha_programada: '2026-11-01'
      };
      expect(evaluarOcurrenciaEnFecha(cadaTresDias, '2026-11-01')).toBe(true);
      expect(evaluarOcurrenciaEnFecha(cadaTresDias, '2026-11-02')).toBe(false);
      expect(evaluarOcurrenciaEnFecha(cadaTresDias, '2026-11-04')).toBe(true);

      const mensual31 = {
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'MENSUAL',
        fecha_programada: '2026-10-31'
      };
      expect(evaluarOcurrenciaEnFecha(mensual31, '2026-11-30')).toBe(true);
      expect(evaluarOcurrenciaEnFecha(mensual31, '2026-11-29')).toBe(false);

      const quincenal = {
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'QUINCENAL',
        fecha_programada: '2026-11-05' // Jueves
      };
      expect(evaluarOcurrenciaEnFecha(quincenal, '2026-11-12')).toBe(false);
      expect(evaluarOcurrenciaEnFecha(quincenal, '2026-11-19')).toBe(true);
    });
  });

  describe('RRULE RFC-5545, Google Calendar API v3, URL e ICS', () => {
    it('retorna null en RRULE para actividades puntuales', () => {
      expect(
        construirRRuleRFC5545({
          tipo_compromiso: 'PUNTUAL',
          frecuencia_ciclo: 'NINGUNA',
          fecha_programada: '2026-11-12'
        })
      ).toBeNull();
    });

    it('construye RRULE RFC-5545 exacto con BYDAY, INTERVAL y UNTIL', () => {
      const rrule = construirRRuleRFC5545({
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'SEMANAL',
        regla_repeticion: 'INTERVALO:2:SEMANAS;DIAS:LU,MI,VI',
        fecha_programada: '2026-11-12',
        fecha_fin: '2026-12-31'
      });
      expect(rrule).toBe('RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR;UNTIL=20261231T235959Z');
    });

    it('construye evento Google Calendar v3 con zona America/Lima, recurrence y EXDATE', () => {
      const ev = construirEventoGoogleCalendarV3({
        id: 'act-uuid-1',
        codigo_legado: 'ACT-010',
        nombre_actividad: 'Entrenamiento 10K',
        categoria_vida: 'SALUD_DEPORTE',
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'DIARIA_LABORAL',
        fecha_programada: '2026-11-12',
        hora_inicio: '06:30',
        duracion_horas: 1.5,
        excepciones_fechas: ['2026-11-18']
      });

      expect(ev.summary).toBe('Entrenamiento 10K');
      expect(ev.start).toEqual({
        dateTime: '2026-11-12T06:30:00-05:00',
        timeZone: 'America/Lima'
      });
      expect(ev.end).toEqual({
        dateTime: '2026-11-12T08:00:00-05:00',
        timeZone: 'America/Lima'
      });
      expect(ev.recurrence).toEqual([
        'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
        'EXDATE;TZID=America/Lima:20261118T063000'
      ]);
    });

    it('construye URL estándar Google Calendar TEMPLATE y archivo .ics válidos', () => {
      const act = {
        id: 'act-url-1',
        codigo_legado: 'ACT-020',
        nombre_actividad: 'Estudio PMP',
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'DIARIA',
        fecha_programada: '2026-11-12',
        hora_inicio: '20:00',
        duracion_horas: 1
      };

      const url = construirUrlGoogleCalendar(act);
      expect(url).toContain('https://calendar.google.com/calendar/render?');
      expect(url).toContain('action=TEMPLATE');
      expect(url).toContain('ctz=America%2FLima');
      expect(url).toContain('dates=20261112T200000%2F20261112T210000');
      expect(url).toContain('recur=RRULE%3AFREQ%3DDAILY');

      const ics = generarArchivoICS(act);
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('DTSTART;TZID=America/Lima:20261112T200000');
      expect(ics).toContain('DTEND;TZID=America/Lima:20261112T210000');
      expect(ics).toContain('RRULE:FREQ=DAILY');
      expect(ics).toContain('END:VCALENDAR');
    });
  });
});

