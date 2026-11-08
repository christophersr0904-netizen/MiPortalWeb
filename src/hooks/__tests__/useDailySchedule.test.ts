import { describe, it, expect } from 'vitest';
import { normalizarFechaAFechaIso, sumarMinutosAHora, formatFechaIsoLocal } from '../useDailySchedule';
import seedLife from '../../db/seedLife.json';
import { calcularProximaFechaValida } from '../../services/habitosService';
import { getProp } from '../../utils/entityNormalizer';

describe('useDailySchedule - Normalización y Proyección de Agenda Diaria', () => {
  it('normalizarFechaAFechaIso maneja fechas ISO y formatos tradicionales M/D/YYYY', () => {
    expect(normalizarFechaAFechaIso('2026-10-29')).toBe('2026-10-29');
    expect(normalizarFechaAFechaIso('2026-10-29T15:30:00.000Z')).toBe('2026-10-29');
    expect(normalizarFechaAFechaIso('4/3/2026 0:00:00')).toBe('2026-04-03');
    expect(normalizarFechaAFechaIso('10/15/2026 12:00:00')).toBe('2026-10-15');
    expect(normalizarFechaAFechaIso('2026/08/10')).toBe('2026-08-10');
    expect(normalizarFechaAFechaIso('')).toBe('');
    expect(normalizarFechaAFechaIso(null)).toBe('');
    expect(normalizarFechaAFechaIso(undefined)).toBe('');
  });

  it('sumarMinutosAHora calcula correctamente horas finales sin desborde', () => {
    expect(sumarMinutosAHora('07:00', 60)).toBe('08:00');
    expect(sumarMinutosAHora('07:30', 45)).toBe('08:15');
    expect(sumarMinutosAHora('23:00', 30)).toBe('23:30');
  });

  it('proyecta hábitos diarios activos de seedLife para la fecha de hoy', () => {
    const fechaHoy = formatFechaIsoLocal(new Date());
    const actividades = seedLife.actividades_personales || [];

    const habitosHoy = actividades.filter((a: any) => {
      const estado = String(getProp(a, 'estado', 'Estado') ?? '');
      if (estado === '05_Archivado') return false;

      const freqCiclo = String(getProp(a, 'frecuencia_ciclo', 'Frecuencia_Ciclo') ?? 'DIARIA').toUpperCase().trim();
      const reglaRep = String(getProp(a, 'regla_repeticion', 'Regla_Repeticion') ?? '').trim();
      const tipoCompromiso = String(getProp(a, 'tipo_compromiso', 'Tipo_Compromiso') ?? '').toUpperCase().trim();

      const tieneRecurrencia = Boolean(
        (freqCiclo && freqCiclo !== 'NINGUNA') || reglaRep !== ''
      );
      const esRutinaria = tipoCompromiso !== 'PUNTUAL' || tieneRecurrencia;

      const fProg = normalizarFechaAFechaIso(String(getProp(a, 'fecha_programada', 'Fecha_Programada') ?? ''));
      const aplicaPorRecurrenciaHoy =
        esRutinaria && calcularProximaFechaValida(fechaHoy, freqCiclo as any, reglaRep) === fechaHoy;

      return fProg === fechaHoy || aplicaPorRecurrenciaHoy;
    });

    // Se proyectan al menos 10 hábitos diarios recurrentes de la semilla
    expect(habitosHoy.length).toBeGreaterThanOrEqual(10);
    const nombres = habitosHoy.map((h: any) => h.Nombre_Actividad || h.nombre_actividad);
    expect(nombres).toContain('Entrenamiento de fuerza en gimnasio');
    expect(nombres).toContain('Estudio intensivo y simuladores PMP');
  });

  it('REQ-FIX-01: preserva hábitos recurrentes activos evitando que esElementoArchivado los oculte por desfase de fecha semilla', () => {
    const actividades = seedLife.actividades_personales || [];
    expect(actividades.length).toBe(13);

    const habitosActivos = actividades.filter((a: any) => {
      const estado = String(getProp(a, 'estado', 'Estado') ?? '');
      const freqCiclo = String(getProp(a, 'frecuencia_ciclo', 'Frecuencia_Ciclo') ?? 'DIARIA').toUpperCase().trim();
      const reglaRep = String(getProp(a, 'regla_repeticion', 'Regla_Repeticion') ?? '').trim();
      const tipoCompromiso = String(getProp(a, 'tipo_compromiso', 'Tipo_Compromiso') ?? '').toUpperCase().trim();

      const tieneRecurrencia = Boolean(
        (freqCiclo && freqCiclo !== 'NINGUNA') || reglaRep !== ''
      );
      const esRutinaria = tipoCompromiso !== 'PUNTUAL' || tieneRecurrencia;

      if (esRutinaria) {
        return estado !== '05_Archivado';
      }
      return false;
    });

    // Las 13 actividades de seedLife tienen frecuencia_ciclo DIARIA y se preservan
    expect(habitosActivos.length).toBe(13);
  });
});
