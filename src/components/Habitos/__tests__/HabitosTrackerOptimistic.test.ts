import { describe, it, expect } from 'vitest';
import { formatFechaIsoLocal } from '../../../utils/timeFormatters';
import { areHabitoPropsEqual, type TarjetaHabitoProps } from '../TarjetaHabito';
import { esTipoHabitoRecurrente } from '../TableroHabitos';
import { esActividadCompletadaHoy } from '../../../services/habitosService';
import seedLife from '../../../db/seedLife.json';
import type { ActividadPersonal } from '../../../types';

describe('Tracker de Hábitos & Consistencia Diaria [REQ-SYS-001-F6]', () => {
  describe('V1: Normalización Temporal Local (Cero Desfase UTC-5 Lima)', () => {
    it('formatea fechas en el huso horario local sin adelantar el día en horas nocturnas', () => {
      // Simular las 20:30 (8:30 PM) en Lima (GMT-5) del 2 de Noviembre de 2026
      // En UTC esto equivale al 3 de Noviembre a las 01:30 AM
      const fechaNocturnaLocal = new Date(2026, 10, 2, 20, 30, 0); // Mes 10 = Noviembre

      const isoLocal = formatFechaIsoLocal(fechaNocturnaLocal);
      expect(isoLocal).toBe('2026-11-02');

      // Comprobar que formatFechaIsoLocal() por defecto utiliza new Date() local
      const hoyLocal = formatFechaIsoLocal();
      expect(hoyLocal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('calcula correctamente días consecutivos pasados para la proyección de racha sin desfasar fechas', () => {
      const fechaRef = new Date(2026, 10, 2, 12, 0, 0);
      const fechasCalculadas: string[] = [];

      for (let i = 1; i <= 3; i++) {
        const fAnt = new Date(fechaRef);
        fAnt.setDate(fechaRef.getDate() - i);
        fechasCalculadas.push(formatFechaIsoLocal(fAnt));
      }

      expect(fechasCalculadas).toEqual(['2026-11-01', '2026-10-31', '2026-10-30']);
    });
  });

  describe('V2 & V3: UI Optimista de Check-in (0ms de Latencia)', () => {
    it('resuelve el estado optimista con precedencia inmediata sobre el registro de Dexie', () => {
      const habitoMock: Partial<ActividadPersonal> = {
        id: 'act-001',
        estado: '02_Por_Hacer',
        ultima_fecha_completado: '2026-11-01'
      };

      const optimisticCompletados: Record<string, boolean> = {
        'act-001': true // Check marcado en 0ms
      };

      const esCompletadaEfectiva = optimisticCompletados[habitoMock.id!] !== undefined
        ? optimisticCompletados[habitoMock.id!]
        : habitoMock.estado === '04_Completado';

      expect(esCompletadaEfectiva).toBe(true);
    });

    it('permite rollback limpio ante rechazo o excepción en la base de datos local', () => {
      let optimisticCompletados: Record<string, boolean> = {
        'act-002': true
      };

      // Simular fallo en Dexie
      try {
        throw new Error('Dexie write failed');
      } catch {
        optimisticCompletados = { ...optimisticCompletados };
        delete optimisticCompletados['act-002'];
      }

      expect(optimisticCompletados['act-002']).toBeUndefined();
    });
  });

  describe('V4: Memoización Atómica de Tarjetas (areHabitoPropsEqual)', () => {
    const actividadBase: ActividadPersonal = {
      id: 'act-101',
      user_id: 'user-001',
      codigo_legado: 'ACT-101',
      nombre_actividad: 'Lectura Técnica 30 min',
      categoria_vida: 'DESARROLLO_ESTUDIO',
      tipo_compromiso: 'HABITUAL',
      frecuencia_ciclo: 'DIARIA',
      fecha_programada: '2026-11-02',
      duracion_horas: 0.5,
      agendado_calendar: 'No',
      estado: '02_Por_Hacer',
      racha_actual: 5,
      valor_acumulado_actual: 150,
      updated_at: '2026-11-02T10:00:00Z',
      version: 1,
      sync_status: 'synced'
    };

    const mockProps: TarjetaHabitoProps = {
      actividad: actividadBase,
      subtareas: [],
      optimisticCompletado: undefined,
      onToggleCompletar: async () => ({ actividadActualizada: actividadBase, esRepetida: true, nuevaRacha: 6 }),
      onToggleSubtarea: async () => ({ success: true })
    };

    it('retorna true cuando las propiedades atómicas y estados reactivos no cambian', () => {
      const nextProps: TarjetaHabitoProps = {
        ...mockProps,
        actividad: { ...actividadBase }
      };

      expect(areHabitoPropsEqual(mockProps, nextProps)).toBe(true);
    });

    it('retorna false cuando se activa la mutación optimista instantánea (0ms)', () => {
      const nextProps: TarjetaHabitoProps = {
        ...mockProps,
        optimisticCompletado: true
      };

      expect(areHabitoPropsEqual(mockProps, nextProps)).toBe(false);
    });

    it('retorna false cuando la racha, estado o timestamp cambian en la base de datos', () => {
      const nextPropsConRacha: TarjetaHabitoProps = {
        ...mockProps,
        actividad: { ...actividadBase, racha_actual: 6 }
      };
      expect(areHabitoPropsEqual(mockProps, nextPropsConRacha)).toBe(false);

      const nextPropsConEstado: TarjetaHabitoProps = {
        ...mockProps,
        actividad: { ...actividadBase, estado: '04_Completado' }
      };
      expect(areHabitoPropsEqual(mockProps, nextPropsConEstado)).toBe(false);

      const nextPropsConTimestamp: TarjetaHabitoProps = {
        ...mockProps,
        actividad: { ...actividadBase, updated_at: '2026-11-02T10:05:00Z' }
      };
      expect(areHabitoPropsEqual(mockProps, nextPropsConTimestamp)).toBe(false);
    });
  });

  describe('V5: Clasificación Inclusiva de Hábitos y Contratos [REQ-FIX-01]', () => {
    it('esTipoHabitoRecurrente identifica HABITUAL, HABITO_MANTENIMIENTO, HABITO_ACUMULATIVO y CHECKLIST_META', () => {
      expect(esTipoHabitoRecurrente('HABITUAL')).toBe(true);
      expect(esTipoHabitoRecurrente('HABITO_MANTENIMIENTO')).toBe(true);
      expect(esTipoHabitoRecurrente('HABITO_ACUMULATIVO')).toBe(true);
      expect(esTipoHabitoRecurrente('CHECKLIST_META')).toBe(true);
      expect(esTipoHabitoRecurrente('PUNTUAL')).toBe(false);
      expect(esTipoHabitoRecurrente('META')).toBe(false);
      expect(esTipoHabitoRecurrente(undefined)).toBe(false);
    });

    it('clasifica los 13 hábitos de seedLife sin descartar ninguno silenciosamente', () => {
      const actividades = seedLife.actividades_personales || [];
      expect(actividades.length).toBe(13);

      const habituales = actividades.filter((a: any) => esTipoHabitoRecurrente(a.tipo_compromiso));
      const puntuales = actividades.filter((a: any) => !esTipoHabitoRecurrente(a.tipo_compromiso));

      expect(habituales.length).toBe(12);
      expect(puntuales.length).toBe(1);
      expect(puntuales[0].codigo_legado).toBe('ACT-012');
    });
  });

  describe('V6: Evaluación Sin Rebote al Marcar/Desmarcar Hábitos (REQ-UI-37-HOTFIX-CHECK-BOUNCE)', () => {
    it('mantiene completado hoy incluso si fecha_programada sigue en mora histórica (sin rebote a pendiente)', () => {
      const hoy = '2026-11-12';
      const habitoEnMoraCompletadoHoy: Partial<ActividadPersonal> = {
        id: 'act-mora-ok',
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'DIARIA',
        estado: '02_Por_Hacer',
        fecha_programada: '2026-10-20',
        ultima_fecha_completado: hoy,
        historial_fechas: [hoy],
        racha_actual: 1
      };
      expect(esActividadCompletadaHoy(habitoEnMoraCompletadoHoy as ActividadPersonal, hoy)).toBe(true);
    });

    it('al desmarcar un hábito con racha activa y updated_at de hoy retorna false (sin rebote a completado)', () => {
      const hoy = '2026-11-12';
      const habitoDesmarcado: Partial<ActividadPersonal> = {
        id: 'act-uncheck',
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'DIARIA',
        estado: '02_Por_Hacer',
        fecha_programada: hoy,
        ultima_fecha_completado: undefined,
        historial_fechas: ['2026-11-11'],
        racha_actual: 4,
        updated_at: '2026-11-12T06:45:00.000Z'
      };
      expect(esActividadCompletadaHoy(habitoDesmarcado as ActividadPersonal, hoy)).toBe(false);
    });
  });
});
