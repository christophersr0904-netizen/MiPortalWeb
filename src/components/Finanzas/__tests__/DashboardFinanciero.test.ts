import { describe, it, expect } from 'vitest';
import {
  esGastoDeProyecto,
  esIngresoDeProyecto,
  coincideFechaConPeriodo,
  resolverCostoEjecutadoProyecto
} from '../../../utils/finanzasHelpers';

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

  describe('Discriminador Canónico de Segmento y Fechas Locales [REQ-FINANZAS-GASTOS-02]', () => {
    it('clasifica correctamente gastos personales de actividades/hábitos y proyectos', () => {
      // Gastos de Actividades Personales (Hábitos)
      const gastoHabito = {
        tipo_origen: 'ACTIVIDAD_PERSONAL',
        id_origen_vinculado: 'ACT-001',
        categoria_gasto: 'Salud',
        monto_pen: 50
      };
      expect(esGastoDeProyecto(gastoHabito)).toBe(false);

      const gastoPersonalComun = {
        tipo_origen: 'Personal',
        categoria_gasto: 'Alimentación',
        monto_pen: 30
      };
      expect(esGastoDeProyecto(gastoPersonalComun)).toBe(false);

      // Gastos vinculados a prefijo ACT / HAB
      const gastoPrefijoAct = {
        id_origen_vinculado: 'HAB-102',
        monto_pen: 20
      };
      expect(esGastoDeProyecto(gastoPrefijoAct)).toBe(false);

      // Gastos de Tareas de Proyectos (ModalTareaFlow)
      const gastoTarea = {
        tipo_origen: 'TAREA_PROYECTO',
        id_origen_vinculado: 'TAR-005',
        id_tarea: 'TAR-005',
        id_proyecto: 'PRY-001',
        monto_pen: 120
      };
      expect(esGastoDeProyecto(gastoTarea)).toBe(true);

      // Gastos de Proyectos directos (ModalNuevoProyecto)
      const gastoProyectoDirecto = {
        tipo_origen: 'PROYECTO',
        id_origen_vinculado: 'PRY-002',
        id_proyecto: 'PRY-002',
        monto_pen: 500
      };
      expect(esGastoDeProyecto(gastoProyectoDirecto)).toBe(true);

      // Ingresos
      expect(esIngresoDeProyecto({ tipo_origen: 'PROYECTO' })).toBe(true);
      expect(esIngresoDeProyecto({ tipo_origen: 'Personal' })).toBe(false);
    });

    it('coincideFechaConPeriodo es inmune al bug de medianoche UTC en UTC-5', () => {
      // Noviembre 2026 (mes 10 en base 0)
      const mesNov2026 = 10;
      const anio2026 = 2026;
      const mesOct2026 = 9;

      // El 1 de Noviembre a las 00:00:00 suele desfasarse a Octubre 31 en UTC-5 con new Date('2026-11-01')
      const fechaPrimeroMes = '2026-11-01';
      expect(coincideFechaConPeriodo(fechaPrimeroMes, 'MES_ACTUAL', mesNov2026, anio2026, mesOct2026, anio2026)).toBe(true);
      expect(coincideFechaConPeriodo(fechaPrimeroMes, 'MES_ANTERIOR', mesNov2026, anio2026, mesOct2026, anio2026)).toBe(false);
      expect(coincideFechaConPeriodo(fechaPrimeroMes, 'ANIO_ACTUAL', mesNov2026, anio2026, mesOct2026, anio2026)).toBe(true);
      expect(coincideFechaConPeriodo(fechaPrimeroMes, 'TODOS', mesNov2026, anio2026, mesOct2026, anio2026)).toBe(true);

      // Fecha del mes anterior (Octubre 2026)
      const fechaMesAnterior = '2026-10-15';
      expect(coincideFechaConPeriodo(fechaMesAnterior, 'MES_ACTUAL', mesNov2026, anio2026, mesOct2026, anio2026)).toBe(false);
      expect(coincideFechaConPeriodo(fechaMesAnterior, 'MES_ANTERIOR', mesNov2026, anio2026, mesOct2026, anio2026)).toBe(true);

      // Fecha de otro año (2025)
      const fechaAnioPasado = '2025-11-01';
      expect(coincideFechaConPeriodo(fechaAnioPasado, 'ANIO_ACTUAL', mesNov2026, anio2026, mesOct2026, anio2026)).toBe(false);
    });

    it('resolverCostoEjecutadoProyecto calcula dinámicamente el costo real (AC) por asignación directa o relacional', () => {
      const proyecto = {
        id: 'p01',
        codigo_legado: 'PRO-001',
        costo_ejecutado_real_pen: 500 // fallback estático
      };

      const tareasMap = new Map<string, string>([
        ['TAR-01', 'PRO-001'],
        ['TAR-02', 'PRO-002']
      ]);

      const hitosMap = new Map<string, string>([
        ['WP-01', 'PRO-001']
      ]);

      const gastos = [
        { id: 'g1', monto_pen: 250, id_proyecto: 'PRO-001' }, // directo
        { id: 'g2', monto_pen: 150, id_origen_vinculado: 'TAR-01' }, // via tarea map
        { id: 'g3', monto_pen: 300, id_origen_vinculado: 'WP-01' }, // via hito map
        { id: 'g4', monto_pen: 999, id_origen_vinculado: 'TAR-02' } // otro proyecto
      ];

      const res = resolverCostoEjecutadoProyecto(proyecto, gastos, tareasMap, hitosMap);
      expect(res.esDinamico).toBe(true);
      expect(res.cantidadGastos).toBe(3);
      expect(res.ac).toBe(700); // 250 + 150 + 300

      // Si no hay gastos para el proyecto, hace fallback seguro al valor estático de Dexie
      const proyectoSinGastos = {
        id: 'p99',
        codigo_legado: 'PRO-099',
        costo_ejecutado_real_pen: 1200
      };
      const resFallback = resolverCostoEjecutadoProyecto(proyectoSinGastos, gastos, tareasMap, hitosMap);
      expect(resFallback.esDinamico).toBe(false);
      expect(resFallback.cantidadGastos).toBe(0);
      expect(resFallback.ac).toBe(1200);
    });
  });
});

