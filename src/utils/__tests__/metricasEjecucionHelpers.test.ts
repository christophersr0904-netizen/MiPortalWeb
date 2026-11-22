import { describe, it, expect } from 'vitest';
import {
  parsearFechaPartes,
  calcularDesfaseDias,
  clasificarDesfase,
  calcularDesviacionEsfuerzo
} from '../metricasEjecucionHelpers';

describe('metricasEjecucionHelpers - Motor de Desfase y Esfuerzo (REQ-METRICS-EXECUTION-02)', () => {
  describe('parsearFechaPartes', () => {
    it('parsea correctamente una fecha YYYY-MM-DD estándar', () => {
      const res = parsearFechaPartes('2026-11-23');
      expect(res).toEqual({ anio: 2026, mes: 11, dia: 23 });
    });

    it('parsea fechas con sufijo de hora ISO (YYYY-MM-DDTHH:mm:ss)', () => {
      const res = parsearFechaPartes('2026-10-05T14:30:00.000Z');
      expect(res).toEqual({ anio: 2026, mes: 10, dia: 5 });
    });

    it('retorna null ante entradas vacías o inválidas', () => {
      expect(parsearFechaPartes('')).toBeNull();
      expect(parsearFechaPartes(undefined)).toBeNull();
      expect(parsearFechaPartes('fecha-invalida')).toBeNull();
      expect(parsearFechaPartes('2026-13-40')).toBeNull();
    });
  });

  describe('calcularDesfaseDias', () => {
    it('calcula mora (+3 días) cuando se ejecuta después de lo programado', () => {
      // Programado: 20 Nov 2026, Real: 23 Nov 2026
      const desfase = calcularDesfaseDias('2026-11-20', '2026-11-23');
      expect(desfase).toBe(3);
    });

    it('calcula adelanto (-2 días) cuando se ejecuta antes de lo programado', () => {
      // Programado: 25 Nov 2026, Real: 23 Nov 2026
      const desfase = calcularDesfaseDias('2026-11-25', '2026-11-23');
      expect(desfase).toBe(-2);
    });

    it('calcula 0 días cuando se completa exactamente el día programado (a tiempo)', () => {
      const desfase = calcularDesfaseDias('2026-11-23', '2026-11-23');
      expect(desfase).toBe(0);
    });

    it('opera con total precisión a través de cambios de mes y año', () => {
      // Cambio de mes: 31 de Octubre a 2 de Noviembre (+2 días)
      expect(calcularDesfaseDias('2026-10-31', '2026-11-02')).toBe(2);

      // Cambio de año: 31 de Diciembre a 1 de Enero (+1 día)
      expect(calcularDesfaseDias('2026-12-31', '2027-01-01')).toBe(1);

      // Adelanto en cambio de mes
      expect(calcularDesfaseDias('2026-11-01', '2026-10-30')).toBe(-2);
    });

    it('retorna null si alguna de las fechas es inválida o no está definida', () => {
      expect(calcularDesfaseDias(undefined, '2026-11-23')).toBeNull();
      expect(calcularDesfaseDias('2026-11-23', undefined)).toBeNull();
      expect(calcularDesfaseDias('invalido', '2026-11-23')).toBeNull();
    });
  });

  describe('clasificarDesfase', () => {
    it('clasifica mora correctamente con etiqueta +Nd', () => {
      const res = clasificarDesfase(5);
      expect(res).toEqual({
        tipo: 'MORA',
        etiqueta: 'Mora (+5d)',
        dias: 5
      });
    });

    it('clasifica adelanto correctamente con etiqueta -Nd', () => {
      const res = clasificarDesfase(-3);
      expect(res).toEqual({
        tipo: 'ADELANTO',
        etiqueta: 'Adelanto (-3d)',
        dias: -3
      });
    });

    it('clasifica cumplimiento a tiempo (0d)', () => {
      const res = clasificarDesfase(0);
      expect(res).toEqual({
        tipo: 'A_TIEMPO',
        etiqueta: 'A tiempo',
        dias: 0
      });
    });

    it('clasifica sin dato ante null o NaN', () => {
      expect(clasificarDesfase(null)).toEqual({
        tipo: 'SIN_DATO',
        etiqueta: 'Sin dato',
        dias: 0
      });
      expect(clasificarDesfase(NaN)).toEqual({
        tipo: 'SIN_DATO',
        etiqueta: 'Sin dato',
        dias: 0
      });
    });
  });

  describe('calcularDesviacionEsfuerzo', () => {
    it('calcula sobreesfuerzo (deltaHoras positivo y porcentaje mayor a 100%)', () => {
      const res = calcularDesviacionEsfuerzo(2.0, 3.5);
      expect(res.estimado).toBe(2.0);
      expect(res.real).toBe(3.5);
      expect(res.deltaHoras).toBe(1.5);
      expect(res.pctEficiencia).toBe(175.0);
    });

    it('calcula ahorro de esfuerzo (deltaHoras negativo y porcentaje menor a 100%)', () => {
      const res = calcularDesviacionEsfuerzo(4.0, 2.0);
      expect(res.estimado).toBe(4.0);
      expect(res.real).toBe(2.0);
      expect(res.deltaHoras).toBe(-2.0);
      expect(res.pctEficiencia).toBe(50.0);
    });

    it('maneja esfuerzo estimado en 0 retornando pctEficiencia null', () => {
      const res = calcularDesviacionEsfuerzo(0, 1.5);
      expect(res.estimado).toBe(0);
      expect(res.real).toBe(1.5);
      expect(res.deltaHoras).toBe(1.5);
      expect(res.pctEficiencia).toBeNull();
    });

    it('normaliza entradas falsy o negativas a 0', () => {
      const res = calcularDesviacionEsfuerzo(undefined, null);
      expect(res.estimado).toBe(0);
      expect(res.real).toBe(0);
      expect(res.deltaHoras).toBe(0);
      expect(res.pctEficiencia).toBeNull();
    });
  });
});
