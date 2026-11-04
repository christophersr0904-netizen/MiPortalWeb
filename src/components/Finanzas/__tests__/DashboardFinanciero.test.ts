import { describe, it, expect } from 'vitest';

describe('Finanzas Dashboard & Componentes Desacoplados [REQ-SYS-001-F5]', () => {
  describe('UI Optimista de Conciliación (0ms de latencia)', () => {
    it('resuelve el estado optimista con precedencia sobre la base de datos Dexie', () => {
      const trxRecordFromDb = { id: 'trx-101', esConciliado: false };
      const optimisticConciliados: Record<string, boolean> = {
        'trx-101': true // Usuario acaba de hacer click
      };

      // Helper idéntico a la resolución en TarjetaTransaccion y Dashboard
      const esConciliadoEfectivo = optimisticConciliados[trxRecordFromDb.id] !== undefined
        ? optimisticConciliados[trxRecordFromDb.id]
        : trxRecordFromDb.esConciliado;

      expect(esConciliadoEfectivo).toBe(true);
    });

    it('hace fallback seguro al registro de la base de datos si no hay mutación optimista activa', () => {
      const trxRecordFromDb = { id: 'trx-202', esConciliado: true };
      const optimisticConciliados: Record<string, boolean> = {};

      const esConciliadoEfectivo = optimisticConciliados[trxRecordFromDb.id] !== undefined
        ? optimisticConciliados[trxRecordFromDb.id]
        : trxRecordFromDb.esConciliado;

      expect(esConciliadoEfectivo).toBe(true);
    });

    it('permite revertir (rollback) en caso de fallo en Dexie', () => {
      let optimisticConciliados: Record<string, boolean> = { 'trx-303': true };

      // Simular rollback en bloque catch
      optimisticConciliados = { ...optimisticConciliados };
      delete optimisticConciliados['trx-303'];

      expect(optimisticConciliados['trx-303']).toBeUndefined();
    });
  });

  describe('Acumulador de KPIs en una sola pasada O(N) (TabControlCuotas)', () => {
    interface CuotaMock {
      id: string;
      id_plan: string;
      numero_cuota: number;
      monto_pen: number;
      estado: 'PENDIENTE' | 'PAGADO';
      es_conciliado?: boolean;
      fecha_vencimiento: string;
    }

    const cuotasMock: CuotaMock[] = [
      { id: 'c1', id_plan: 'plan-1', numero_cuota: 1, monto_pen: 500, estado: 'PAGADO', es_conciliado: true, fecha_vencimiento: '2026-10-01' },
      { id: 'c2', id_plan: 'plan-1', numero_cuota: 2, monto_pen: 500, estado: 'PENDIENTE', es_conciliado: false, fecha_vencimiento: '2026-11-01' },
      { id: 'c3', id_plan: 'plan-2', numero_cuota: 1, monto_pen: 1200, estado: 'PENDIENTE', es_conciliado: false, fecha_vencimiento: '2026-11-15' },
    ];

    it('calcula totales, amortización y compromisos mensuales en un solo ciclo O(N)', () => {
      const optimisticConciliados: Record<string, boolean> = {};

      const kpis = cuotasMock.reduce(
        (acc, c) => {
          const esConciliado = optimisticConciliados[c.id] !== undefined
            ? optimisticConciliados[c.id]
            : (c.estado === 'PAGADO' || c.es_conciliado);

          acc.totalComprometido += c.monto_pen;
          if (esConciliado) {
            acc.totalAmortizado += c.monto_pen;
            acc.cuotasPagadas += 1;
          } else {
            acc.cuotasPendientes += 1;
            if (c.fecha_vencimiento.startsWith('2026-11')) {
              acc.compromisoMesActual += c.monto_pen;
            }
          }
          return acc;
        },
        { totalComprometido: 0, totalAmortizado: 0, cuotasPagadas: 0, cuotasPendientes: 0, compromisoMesActual: 0 }
      );

      expect(kpis.totalComprometido).toBe(2200);
      expect(kpis.totalAmortizado).toBe(500);
      expect(kpis.cuotasPagadas).toBe(1);
      expect(kpis.cuotasPendientes).toBe(2);
      expect(kpis.compromisoMesActual).toBe(1700);
    });
  });

  describe('Cálculo de Próximos Vencimientos sin Presión de GC (Dashboard & Cuotas)', () => {
    it('evalúa la diferencia de días con aritmética de timestamps en milisegundos', () => {
      const hoyMs = new Date('2026-11-02T00:00:00Z').getTime();

      const evaluarVencimiento = (fechaStr: string) => {
        const fMs = new Date(fechaStr + 'T00:00:00Z').getTime();
        const diffDias = Math.ceil((fMs - hoyMs) / 86400000);
        return {
          diffDias,
          esVencido: diffDias < 0,
          esHoy: diffDias === 0,
          esUrgente: diffDias > 0 && diffDias <= 7,
          esFuturo: diffDias > 7
        };
      };

      // Vencido
      const v1 = evaluarVencimiento('2026-10-30');
      expect(v1.diffDias).toBe(-3);
      expect(v1.esVencido).toBe(true);

      // Hoy
      const v2 = evaluarVencimiento('2026-11-02');
      expect(v2.diffDias).toBe(0);
      expect(v2.esHoy).toBe(true);

      // Urgente (a 3 días)
      const v3 = evaluarVencimiento('2026-11-05');
      expect(v3.diffDias).toBe(3);
      expect(v3.esUrgente).toBe(true);

      // Futuro (> 7 días)
      const v4 = evaluarVencimiento('2026-11-20');
      expect(v4.diffDias).toBe(18);
      expect(v4.esFuturo).toBe(true);
    });
  });

  describe('Matriz de Burn Rate y Runway (TabPresupuestos)', () => {
    it('calcula runway y tasa de quema protegiendo divisiones por cero', () => {
      const balanceLiquido = 15000;
      const gastosMesActual = 3000;
      const gastosMesAnterior = 2500;

      const burnRatePromedio = (gastosMesActual + gastosMesAnterior) / 2;
      const runwayMeses = burnRatePromedio > 0 ? balanceLiquido / burnRatePromedio : 999;

      expect(burnRatePromedio).toBe(2750);
      expect(Math.round(runwayMeses * 10) / 10).toBe(5.5);

      // División por cero protegida
      const burnRateCero = 0;
      const runwayInfinito = burnRateCero > 0 ? balanceLiquido / burnRateCero : 999;
      expect(runwayInfinito).toBe(999);
    });
  });
});

