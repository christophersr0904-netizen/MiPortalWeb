import { describe, it, expect } from 'vitest';
import {
  convertirStringToHorasDecimal,
  convertirHorasDecimalAString
} from '../../components/Modals/ModalTareaFlow';

describe('ModalTareaFlow - Conversión Bidireccional Horas H:MM (REQ-TASK-DETAIL-EXPENSE-STEPS-EXEC-34)', () => {
  it('convierte cadenas en formato H:MM a decimales con precisión', () => {
    expect(convertirStringToHorasDecimal('1:30')).toBe(1.5);
    expect(convertirStringToHorasDecimal('0:45')).toBe(0.75);
    expect(convertirStringToHorasDecimal('2:15')).toBe(2.25);
    expect(convertirStringToHorasDecimal('0:00')).toBe(0);
    expect(convertirStringToHorasDecimal('3:00')).toBe(3);
  });

  it('soporta formato minutos (90m, 45min)', () => {
    expect(convertirStringToHorasDecimal('90m')).toBe(1.5);
    expect(convertirStringToHorasDecimal('45min')).toBe(0.75);
    expect(convertirStringToHorasDecimal('120m')).toBe(2);
  });

  it('soporta formato decimal directo (1.5, 2, 0.75)', () => {
    expect(convertirStringToHorasDecimal('1.5')).toBe(1.5);
    expect(convertirStringToHorasDecimal('1,5')).toBe(1.5);
    expect(convertirStringToHorasDecimal('2')).toBe(2);
    expect(convertirStringToHorasDecimal('')).toBe(0);
  });

  it('convierte horas decimales a formato canónico H:MM', () => {
    expect(convertirHorasDecimalAString(1.5)).toBe('1:30');
    expect(convertirHorasDecimalAString(0.75)).toBe('0:45');
    expect(convertirHorasDecimalAString(2)).toBe('2:00');
    expect(convertirHorasDecimalAString(0)).toBe('0:00');
    expect(convertirHorasDecimalAString(undefined)).toBe('0:00');
    expect(convertirHorasDecimalAString(null)).toBe('0:00');
  });

  it('asegura consistencia de ida y vuelta (round-trip)', () => {
    const valoresOriginales = [0.5, 1.25, 1.5, 2.75, 4.0];
    for (const val of valoresOriginales) {
      const str = convertirHorasDecimalAString(val);
      const backToDecimal = convertirStringToHorasDecimal(str);
      expect(backToDecimal).toBe(val);
    }
  });
});
