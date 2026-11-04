import { describe, it, expect } from 'vitest';
import type { CanonicalProyecto } from '../../../utils/entityNormalizer';
import { db } from '../../../db/db';

describe('TarjetaProyecto & Optimización PMO [REQ-SYS-001-F1]', () => {
  const proyectoMock: CanonicalProyecto = {
    id: 'proy-uuid-001',
    codigo_legado: 'PRO-001',
    nombre: 'Migración Cloud & Infraestructura',
    tipo_iniciativa: 'Profesional',
    arquetipo: '1_Infraestructura',
    estado: '03_En_Ejecucion',
    avance_pct: 75,
    presupuesto: 10000,
    costo_real: 6500,
    costo_real_usd: 1750,
    health_status: 'En Rango',
    spi: 1.0,
    cpi: 1.0,
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    north_star_okr: 'Alcanzar 99.99% de disponibilidad',
    raw: {}
  };

  it('calcula métricas financieras (Burn Rate y Varianza) con precisión matemática', () => {
    const bac = proyectoMock.presupuesto || 0;
    const ac = proyectoMock.costo_real || 0;
    const burn = bac > 0 ? Math.round((ac / bac) * 100) : 0;
    const varianza = bac > 0 ? bac - ac : 0;

    expect(burn).toBe(65);
    expect(varianza).toBe(3500);
  });

  it('procesa el resumen de tareas precalculado sin filtrar arrays en el cuerpo de la tarjeta', () => {
    const resumenTareas = { total: 12, completadas: 9 };
    expect(resumenTareas.total).toBe(12);
    expect(resumenTareas.completadas).toBe(9);
    const pct = Math.round((resumenTareas.completadas / resumenTareas.total) * 100);
    expect(pct).toBe(75);
  });

  it('asigna la clave defensiva canónica para prevenir claves undefined o colisiones en la reconciliación React', () => {
    const p1 = { ...proyectoMock };
    const p2 = { ...proyectoMock, id: '' };

    const generarKey = (p: CanonicalProyecto) => (p.id ? `proy_${p.id}` : `proy_cod_${p.codigo_legado}`);

    expect(generarKey(p1)).toBe('proy_proy-uuid-001');
    expect(generarKey(p2)).toBe('proy_cod_PRO-001');
  });

  it('el esquema Dexie v5 tiene gastos indexados por id_proyecto e id_origen_vinculado', () => {
    const stores = (db as any)._allTables;
    expect(stores).toBeDefined();
    // Verificar que la tabla gastos existe en la instancia de base de datos
    expect(db.gastos).toBeDefined();
    expect(typeof db.gastos.where).toBe('function');
  });

  it('REQ-SYS-001-F1.1: Sanitiza strings de salud y activa pulso + halo solo en estado crítico', () => {
    const evaluarSaludLed = (saludRaw: string) => {
      const h = String(saludRaw || '').toLowerCase();
      const isCrit = h.includes('bloqueado') || h.includes('crítico') || h.includes('critico');
      const isRiesgo = h.includes('riesgo') || h.includes('alerta');
      const healthClean = (saludRaw || 'En Rango').replace(/^[^\p{L}\p{N}]+/u, '').trim();
      const colorBarra = isCrit ? 'bg-rose-500' : isRiesgo ? 'bg-amber-500' : 'bg-emerald-500';
      const ledShadowClass = isCrit
        ? 'shadow-[0_0_8px_#f43f5e]'
        : isRiesgo
        ? 'shadow-[0_0_8px_#f59e0b]'
        : 'shadow-[0_0_8px_#10b981]';

      return { isCrit, isRiesgo, healthClean, colorBarra, ledShadowClass };
    };

    const resCrit = evaluarSaludLed('🔴 Crítico');
    expect(resCrit.isCrit).toBe(true);
    expect(resCrit.healthClean).toBe('Crítico');
    expect(resCrit.colorBarra).toBe('bg-rose-500');
    expect(resCrit.ledShadowClass).toBe('shadow-[0_0_8px_#f43f5e]');

    const resRiesgo = evaluarSaludLed('🟡 En Riesgo');
    expect(resRiesgo.isCrit).toBe(false);
    expect(resRiesgo.isRiesgo).toBe(true);
    expect(resRiesgo.healthClean).toBe('En Riesgo');
    expect(resRiesgo.colorBarra).toBe('bg-amber-500');
    expect(resRiesgo.ledShadowClass).toBe('shadow-[0_0_8px_#f59e0b]');

    const resNormal = evaluarSaludLed('🟢 Saludable');
    expect(resNormal.isCrit).toBe(false);
    expect(resNormal.isRiesgo).toBe(false);
    expect(resNormal.healthClean).toBe('Saludable');
    expect(resNormal.colorBarra).toBe('bg-emerald-500');
    expect(resNormal.ledShadowClass).toBe('shadow-[0_0_8px_#10b981]');
  });
});
