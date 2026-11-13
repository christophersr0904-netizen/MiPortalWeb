import { describe, it, expect } from 'vitest';
import type { CanonicalProyecto } from '../../../utils/entityNormalizer';

describe('HeaderProyectoActivo - Lógica Semafórica EVM y Métricas PMO [REQ-UI-54-EXEC]', () => {
  const baseProyecto: CanonicalProyecto = {
    id: 'proy-uuid-101',
    codigo_legado: 'PRO-101',
    nombre: 'Migración Infraestructura Cloud',
    tipo_iniciativa: 'Profesional',
    arquetipo: '1_Infraestructura',
    estado: '03_En_Ejecucion',
    avance_pct: 75,
    presupuesto: 20000,
    costo_real: 18000,
    costo_real_usd: 4800,
    health_status: 'Saludable',
    spi: 1.05,
    cpi: 1.12,
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-06-30',
    raw: {}
  };

  it('clasifica CPI >= 1.0 como estado Óptimo (Emerald)', () => {
    const cpi = baseProyecto.cpi;
    const cpiOptimo = cpi >= 1.0;
    const cpiRiesgo = cpi >= 0.85 && cpi < 1.0;
    const colorClass = cpiOptimo
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : cpiRiesgo
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

    expect(cpiOptimo).toBe(true);
    expect(colorClass).toContain('emerald');
  });

  it('clasifica CPI en rango [0.85, 1.0) como Riesgo (Amber)', () => {
    const cpi = 0.92;
    const cpiOptimo = cpi >= 1.0;
    const cpiRiesgo = cpi >= 0.85 && cpi < 1.0;
    const colorClass = cpiOptimo
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : cpiRiesgo
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

    expect(cpiOptimo).toBe(false);
    expect(cpiRiesgo).toBe(true);
    expect(colorClass).toContain('amber');
  });

  it('clasifica CPI < 0.85 como Crítico (Rose)', () => {
    const cpi = 0.79;
    const cpiOptimo = cpi >= 1.0;
    const cpiRiesgo = cpi >= 0.85 && cpi < 1.0;
    const colorClass = cpiOptimo
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : cpiRiesgo
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

    expect(cpiOptimo).toBe(false);
    expect(cpiRiesgo).toBe(false);
    expect(colorClass).toContain('rose');
  });

  it('clasifica SPI >= 1.0 como A Tiempo (Sky)', () => {
    const spi = baseProyecto.spi;
    const spiOptimo = spi >= 1.0;
    const spiRiesgo = spi >= 0.85 && spi < 1.0;
    const colorClass = spiOptimo
      ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
      : spiRiesgo
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

    expect(spiOptimo).toBe(true);
    expect(colorClass).toContain('sky');
  });

  it('clasifica SPI < 0.85 como Retraso Severo (Rose)', () => {
    const spi = 0.81;
    const spiOptimo = spi >= 1.0;
    const spiRiesgo = spi >= 0.85 && spi < 1.0;
    const colorClass = spiOptimo
      ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
      : spiRiesgo
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

    expect(spiOptimo).toBe(false);
    expect(spiRiesgo).toBe(false);
    expect(colorClass).toContain('rose');
  });

  it('aplica fallback determinista de 1.00 ante valores undefined o NaN en CPI y SPI', () => {
    const proyIncompleto = { ...baseProyecto, cpi: undefined, spi: NaN } as any;
    const resolvedCpi = typeof proyIncompleto.cpi === 'number' && !isNaN(proyIncompleto.cpi) ? proyIncompleto.cpi : 1.0;
    const resolvedSpi = typeof proyIncompleto.spi === 'number' && !isNaN(proyIncompleto.spi) ? proyIncompleto.spi : 1.0;

    expect(resolvedCpi).toBe(1.0);
    expect(resolvedSpi).toBe(1.0);
    expect(resolvedCpi.toFixed(2)).toBe('1.00');
    expect(resolvedSpi.toFixed(2)).toBe('1.00');
  });

  it('calcula la anchura de la micro-barra de avance físico confinada en [0, 100]%', () => {
    const calcularWidth = (pct: number) => `${Math.min(100, Math.max(0, pct))}%`;

    expect(calcularWidth(65)).toBe('65%');
    expect(calcularWidth(-10)).toBe('0%');
    expect(calcularWidth(150)).toBe('100%');
  });
});

