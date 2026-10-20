import { describe, it, expect } from 'vitest';
import {
  calcularRutaCriticaCPM,
  normalizarPredecesores
} from '../cpmService';
import type { HitoWbsRecord } from '../../types';

describe('cpmService - Motor Algorítmico WBS / CPM', () => {
  it('normalizarPredecesores divide correctamente comas, puntos y comas y pipes', () => {
    expect(normalizarPredecesores('WP-001, WP-002 ; WP-003|WP-004')).toEqual([
      'WP-001',
      'WP-002',
      'WP-003',
      'WP-004'
    ]);
    expect(normalizarPredecesores('')).toEqual([]);
    expect(normalizarPredecesores(undefined)).toEqual([]);
  });

  it('detecta ciclos circulares mediante el algoritmo de Kahn', () => {
    const hitosCiclo: HitoWbsRecord[] = [
      {
        id: '1',
        user_id: 'u1',
        codigo_legado: 'WP-001',
        proyecto_id: 'P1',
        tipo_elemento_wbs: 'PAQUETE_TRABAJO',
        wbs_code: '1.1',
        fase_asociada: '01_INIC',
        nombre_elemento: 'Tarea A',
        estado: '01_Pendiente',
        peso_pct: 1.0,
        fecha_limite: '2026-10-20',
        duracion_estimada_dias: 3,
        presupuesto_asignado: 100,
        dependencia_hito_id: 'WP-002', // Depende de B
        updated_at: new Date().toISOString(),
        version: 1,
        sync_status: 'synced'
      },
      {
        id: '2',
        user_id: 'u1',
        codigo_legado: 'WP-002',
        proyecto_id: 'P1',
        tipo_elemento_wbs: 'PAQUETE_TRABAJO',
        wbs_code: '1.2',
        fase_asociada: '01_INIC',
        nombre_elemento: 'Tarea B',
        estado: '01_Pendiente',
        peso_pct: 0,
        fecha_limite: '2026-10-25',
        duracion_estimada_dias: 4,
        presupuesto_asignado: 200,
        dependencia_hito_id: 'WP-001', // Depende de A -> Ciclo A <-> B
        updated_at: new Date().toISOString(),
        version: 1,
        sync_status: 'synced'
      }
    ];

    const resultado = calcularRutaCriticaCPM(hitosCiclo);
    expect(resultado.tieneCiclos).toBe(true);
    expect(resultado.cicloDetectado).toBeDefined();
    expect(resultado.cicloDetectado).toContain('WP-001');
    expect(resultado.cicloDetectado).toContain('WP-002');
  });

  it('calcula correctamente Forward/Backward pass, holguras y Ruta Crítica en red lineal', () => {
    const hitos: HitoWbsRecord[] = [
      {
        id: 'h1',
        user_id: 'u1',
        codigo_legado: 'WP-001',
        proyecto_id: 'PRO-1',
        tipo_elemento_wbs: 'PAQUETE_TRABAJO',
        wbs_code: '1.1',
        fase_asociada: '01_INICIACION',
        nombre_elemento: 'Actividad 1',
        estado: '03_Completado',
        peso_pct: 1.0,
        fecha_limite: '2026-10-20',
        duracion_estimada_dias: 5,
        presupuesto_asignado: 1000,
        updated_at: new Date().toISOString(),
        version: 1,
        sync_status: 'synced'
      },
      {
        id: 'h2',
        user_id: 'u1',
        codigo_legado: 'WP-002',
        proyecto_id: 'PRO-1',
        tipo_elemento_wbs: 'PAQUETE_TRABAJO',
        wbs_code: '2.1',
        fase_asociada: '02_PLANIFICACION',
        nombre_elemento: 'Rama Larga (Crítica)',
        estado: '02_En_Progreso',
        peso_pct: 0.6,
        fecha_limite: '2026-10-30',
        duracion_estimada_dias: 10,
        dependencia_hito_id: 'WP-001',
        presupuesto_asignado: 2000,
        updated_at: new Date().toISOString(),
        version: 1,
        sync_status: 'synced'
      },
      {
        id: 'h3',
        user_id: 'u1',
        codigo_legado: 'WP-003',
        proyecto_id: 'PRO-1',
        tipo_elemento_wbs: 'PAQUETE_TRABAJO',
        wbs_code: '2.2',
        fase_asociada: '02_PLANIFICACION',
        nombre_elemento: 'Rama Corta (Con holgura)',
        estado: '01_Pendiente',
        peso_pct: 0.4,
        fecha_limite: '2026-10-25',
        duracion_estimada_dias: 3,
        dependencia_hito_id: 'WP-001',
        presupuesto_asignado: 500,
        updated_at: new Date().toISOString(),
        version: 1,
        sync_status: 'synced'
      },
      {
        id: 'h4',
        user_id: 'u1',
        codigo_legado: 'HIT-001',
        proyecto_id: 'PRO-1',
        tipo_elemento_wbs: 'HITO_MARCADOR',
        wbs_code: '2.3',
        fase_asociada: '02_PLANIFICACION',
        nombre_elemento: 'Fin de Planificación',
        estado: '01_Pendiente',
        peso_pct: 0,
        fecha_limite: '2026-11-01',
        duracion_estimada_dias: 0,
        dependencia_hito_id: 'WP-002,WP-003',
        presupuesto_asignado: 0,
        updated_at: new Date().toISOString(),
        version: 1,
        sync_status: 'synced'
      }
    ];

    const res = calcularRutaCriticaCPM(hitos);
    expect(res.tieneCiclos).toBe(false);

    // Duración total: WP-001 (5) + WP-002 (10) + HIT-001 (0) = 15 días
    expect(res.duracionProyecto).toBe(15);

    const n1 = res.nodos.get('WP-001')!;
    expect(n1.es).toBe(0);
    expect(n1.ef).toBe(5);
    expect(n1.ls).toBe(0);
    expect(n1.lf).toBe(5);
    expect(n1.holguraTotal).toBe(0);
    expect(n1.esCritico).toBe(true);

    const n2 = res.nodos.get('WP-002')!;
    expect(n2.es).toBe(5);
    expect(n2.ef).toBe(15);
    expect(n2.ls).toBe(5);
    expect(n2.lf).toBe(15);
    expect(n2.holguraTotal).toBe(0);
    expect(n2.esCritico).toBe(true);

    const n3 = res.nodos.get('WP-003')!;
    expect(n3.es).toBe(5);
    expect(n3.ef).toBe(8);
    expect(n3.lf).toBe(15); // Debe esperar al fin antes de HIT-001
    expect(n3.ls).toBe(12); // 15 - 3 = 12
    expect(n3.holguraTotal).toBe(7); // 12 - 5 = 7 días de holgura
    expect(n3.esCritico).toBe(false);

    const n4 = res.nodos.get('HIT-001')!;
    expect(n4.es).toBe(15);
    expect(n4.ef).toBe(15);
    expect(n4.holguraTotal).toBe(0);
    expect(n4.esCritico).toBe(true);

    expect(res.rutaCritica).toEqual(['WP-001', 'WP-002', 'HIT-001']);

    // Balance de ponderaciones
    expect(res.balancePonderaciones).toEqual([
      { fase: '01_INICIACION', sumaPesos: 1.0, estaBalanceada: true },
      { fase: '02_PLANIFICACION', sumaPesos: 1.0, estaBalanceada: true }
    ]);
  });
});
