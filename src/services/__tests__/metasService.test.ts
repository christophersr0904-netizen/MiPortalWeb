import { describe, it, expect, vi } from 'vitest';
import { db } from '../../db/db';
import {
  calcularProgresoBimodal,
  crearMetaRapidaDesdeActividadLocal,
  sincronizarMetasInternasHaciaPlanesLocal,
  calcularProyeccionMeta
} from '../metasService';
import type { MetaPlanRecord, HitoPlanRecord, HabitoMetaVinculo, ActividadPersonal, HabitoLogRecord } from '../../types';

describe('Servicio de Metas y Planes (metasService)', () => {
  const metaBase: MetaPlanRecord = {
    id: 'meta-001',
    user_id: 'user-001',
    codigo_legado: 'MET-001',
    nombre_meta: 'Correr Media Maratón (21 km)',
    categoria_vida: 'SALUD_DEPORTE',
    meta_objetivo_total: 100,
    valor_acumulado_actual: 50,
    nivel_rescate_minimo: 20,
    peso_hitos_pct: 50,
    peso_habitos_pct: 50,
    estado: '02_En_Progreso',
    updated_at: '2026-10-19T00:00:00Z',
    version: 1,
    sync_status: 'synced'
  };

  it('Calcula correctamente el avance de hitos al 50% con pesos idénticos', () => {
    const hitos: HitoPlanRecord[] = [
      {
        id: 'h1',
        user_id: 'user-001',
        codigo_legado: 'HIT-PLN-001',
        meta_id: 'meta-001',
        titulo_hito: 'Hito 1',
        orden_secuencia: 1,
        peso_relativo: 1,
        completado: true,
        updated_at: '2026-10-19T00:00:00Z',
        version: 1,
        sync_status: 'synced'
      },
      {
        id: 'h2',
        user_id: 'user-001',
        codigo_legado: 'HIT-PLN-002',
        meta_id: 'meta-001',
        titulo_hito: 'Hito 2',
        orden_secuencia: 2,
        peso_relativo: 1,
        completado: false,
        updated_at: '2026-10-19T00:00:00Z',
        version: 1,
        sync_status: 'synced'
      }
    ];

    const { avanceHitosPct } = calcularProgresoBimodal(metaBase, hitos, []);
    expect(avanceHitosPct).toBe(50);
  });

  it('Calcula correctamente el avance bimodal (50% hitos ponderado a 50% + 50% hábitos ponderado a 50% = 50%)', () => {
    const hitos: HitoPlanRecord[] = [
      {
        id: 'h1',
        user_id: 'user-001',
        codigo_legado: 'HIT-PLN-001',
        meta_id: 'meta-001',
        titulo_hito: 'Hito 1',
        orden_secuencia: 1,
        peso_relativo: 1,
        completado: true,
        updated_at: '2026-10-19T00:00:00Z',
        version: 1,
        sync_status: 'synced'
      },
      {
        id: 'h2',
        user_id: 'user-001',
        codigo_legado: 'HIT-PLN-002',
        meta_id: 'meta-001',
        titulo_hito: 'Hito 2',
        orden_secuencia: 2,
        peso_relativo: 1,
        completado: false,
        updated_at: '2026-10-19T00:00:00Z',
        version: 1,
        sync_status: 'synced'
      }
    ];

    const habito: ActividadPersonal = {
      id: 'act-001',
      user_id: 'user-001',
      codigo_legado: 'ACT-001',
      nombre_actividad: 'Running matutino',
      tipo_compromiso: 'HABITUAL',
      categoria_vida: 'SALUD_DEPORTE',
      estado: '02_Por_Hacer',
      racha_actual: 5,
      fecha_programada: '2026-10-19',
      duracion_horas: 1,
      agendado_calendar: 'No',
      valor_acumulado_actual: 25,
      updated_at: '2026-10-19T00:00:00Z',
      version: 1,
      sync_status: 'synced'
    };

    const vinculos: (HabitoMetaVinculo & { habito?: ActividadPersonal })[] = [
      {
        id: 'v1',
        user_id: 'user-001',
        habito_id: 'act-001',
        meta_id: 'meta-001',
        modo_computo: 'VOLUMEN_DIRECTO',
        factor_conversion: 1,
        peso_contribucion_pct: 100,
        meta_volumen_esperada: 50,
        habito,
        updated_at: '2026-10-19T00:00:00Z',
        sync_status: 'synced'
      }
    ];

    // Habito acumuló 25 / 50 = 50%
    // Hitos completaron 1 / 2 = 50%
    // Bimodal = 50% * 0.5 + 50% * 0.5 = 50%
    const { avanceHitosPct, avanceHabitosPct, progresoGlobalPct } = calcularProgresoBimodal(
      metaBase,
      hitos,
      vinculos
    );

    expect(avanceHitosPct).toBe(50);
    expect(avanceHabitosPct).toBe(50);
    expect(progresoGlobalPct).toBe(50);
  });

  it('Calcula 100% de progreso cuando todos los hitos y hábitos alcanzan su meta', () => {
    const hitos: HitoPlanRecord[] = [
      {
        id: 'h1',
        user_id: 'user-001',
        codigo_legado: 'HIT-PLN-001',
        meta_id: 'meta-001',
        titulo_hito: 'Hito 1',
        orden_secuencia: 1,
        peso_relativo: 1,
        completado: true,
        updated_at: '2026-10-19T00:00:00Z',
        version: 1,
        sync_status: 'synced'
      }
    ];

    const habito: ActividadPersonal = {
      id: 'act-001',
      user_id: 'user-001',
      codigo_legado: 'ACT-001',
      nombre_actividad: 'Running matutino',
      tipo_compromiso: 'HABITUAL',
      categoria_vida: 'SALUD_DEPORTE',
      estado: '04_Completado',
      racha_actual: 10,
      fecha_programada: '2026-10-19',
      duracion_horas: 1,
      agendado_calendar: 'No',
      valor_acumulado_actual: 50,
      updated_at: '2026-10-19T00:00:00Z',
      version: 1,
      sync_status: 'synced'
    };

    const vinculos: (HabitoMetaVinculo & { habito?: ActividadPersonal })[] = [
      {
        id: 'v1',
        user_id: 'user-001',
        habito_id: 'act-001',
        meta_id: 'meta-001',
        modo_computo: 'VOLUMEN_DIRECTO',
        factor_conversion: 1,
        peso_contribucion_pct: 100,
        meta_volumen_esperada: 50,
        habito,
        updated_at: '2026-10-19T00:00:00Z',
        sync_status: 'synced'
      }
    ];

    const { progresoGlobalPct } = calcularProgresoBimodal(metaBase, hitos, vinculos);
    expect(progresoGlobalPct).toBe(100);
  });

  describe('REQ-HABITS-CREATE-METAS-INLINE-15: Creación In-Situ y Promoción de Metas', () => {
    it('crearMetaRapidaDesdeActividadLocal crea la meta con correlativo canónico y vínculo a hábito', async () => {
      const mockMetas: any[] = [
        { id: 'm1', codigo_legado: 'MET-001', nombre_meta: 'Meta 1' }
      ];
      vi.spyOn(db.metas_planes, 'toArray').mockResolvedValue(mockMetas as any);
      const putMetaSpy = vi.spyOn(db.metas_planes, 'put').mockResolvedValue('m-new' as any);
      const putVinculoSpy = vi.spyOn(db.habitos_metas_vinculos, 'put').mockResolvedValue('v-new' as any);
      vi.spyOn(db.planes_accion_hitos, 'where').mockReturnValue({
        toArray: async () => []
      } as any);
      vi.spyOn(db.habitos_metas_vinculos, 'where').mockReturnValue({
        toArray: async () => []
      } as any);
      vi.spyOn(db.actividades_personales, 'toArray').mockResolvedValue([]);
      vi.spyOn(db.metas_planes, 'get').mockResolvedValue(null);

      const nuevaMeta = await crearMetaRapidaDesdeActividadLocal({
        nombre: 'Leer 20 Libros',
        categoria: 'DESARROLLO_ESTUDIO',
        metaTotal: 20,
        unidad: 'libros',
        nivelRescate: 5,
        habitoId: 'act-123'
      });

      expect(nuevaMeta.codigo_legado).toBe('MET-002');
      expect(nuevaMeta.nombre_meta).toBe('Leer 20 Libros');
      expect(nuevaMeta.categoria_vida).toBe('DESARROLLO_ESTUDIO');
      expect(nuevaMeta.meta_objetivo_total).toBe(20);
      expect(nuevaMeta.unidad_medida).toBe('libros');
      expect(nuevaMeta.nivel_rescate_minimo).toBe(5);
      expect(nuevaMeta.peso_hitos_pct).toBe(0);
      expect(nuevaMeta.peso_habitos_pct).toBe(100);
      expect(nuevaMeta.estado).toBe('02_En_Progreso');
      expect(nuevaMeta.sync_status).toBe('pending');

      expect(putMetaSpy).toHaveBeenCalledWith(expect.objectContaining({
        codigo_legado: 'MET-002',
        nombre_meta: 'Leer 20 Libros'
      }));

      expect(putVinculoSpy).toHaveBeenCalledWith(expect.objectContaining({
        habito_id: 'act-123',
        meta_id: nuevaMeta.id,
        meta_volumen_esperada: 20
      }));
    });

    it('sincronizarMetasInternasHaciaPlanesLocal promueve actividades internas a metas_planes si no están vinculadas', async () => {
      const mockActividades: any[] = [
        {
          id: 'act-unlinked-1',
          nombre_actividad: 'Práctica de Piano',
          tipo_compromiso: 'HABITUAL',
          meta_macro_nombre: 'Aprender Piano',
          categoria_vida: 'CREATIVIDAD_ARTE',
          meta_objetivo_total: 100,
          unidad_medida: 'horas',
          nivel_rescate_minimo: 10
        },
        {
          id: 'act-already-linked',
          nombre_actividad: 'Rutina gym',
          tipo_compromiso: 'HABITUAL',
          meta_macro_nombre: 'Pérdida de Peso',
          categoria_vida: 'SALUD_DEPORTE'
        }
      ];

      const mockVinculos: any[] = [
        { id: 'v-1', habito_id: 'act-already-linked', meta_id: 'm-peso' }
      ];

      const mockMetas: any[] = [];

      vi.spyOn(db.actividades_personales, 'toArray').mockResolvedValue(mockActividades as any);
      vi.spyOn(db.habitos_metas_vinculos, 'toArray').mockResolvedValue(mockVinculos as any);
      vi.spyOn(db.metas_planes, 'toArray').mockResolvedValue(mockMetas as any);
      vi.spyOn(db.metas_planes, 'put').mockResolvedValue('new-m' as any);
      vi.spyOn(db.habitos_metas_vinculos, 'put').mockResolvedValue('new-v' as any);
      vi.spyOn(db.planes_accion_hitos, 'where').mockReturnValue({ toArray: async () => [] } as any);
      vi.spyOn(db.habitos_metas_vinculos, 'where').mockReturnValue({
        equals: () => ({
          and: () => ({ first: async () => null })
        }),
        toArray: async () => []
      } as any);
      vi.spyOn(db.metas_planes, 'get').mockResolvedValue(null);

      const promovidas = await sincronizarMetasInternasHaciaPlanesLocal();
      expect(promovidas).toBe(1);
    });
  });

  describe('REQ-METAS-FORECASTING-BADGES-17: Motor de Velocidad Real y Badges de Proyección', () => {
    const metaPrueba: MetaPlanRecord = {
      id: 'meta-forecast-1',
      user_id: 'user-001',
      codigo_legado: 'MET-100',
      nombre_meta: 'Aprender Programación Rust',
      categoria_vida: 'DESARROLLO_ESTUDIO',
      meta_objetivo_total: 100,
      valor_acumulado_actual: 40,
      nivel_rescate_minimo: 10,
      peso_hitos_pct: 0,
      peso_habitos_pct: 100,
      fecha_inicio: '2026-10-01',
      fecha_fin: '2026-11-19',
      estado: '02_En_Progreso',
      updated_at: '2026-10-20T00:00:00Z',
      version: 1,
      sync_status: 'synced'
    };

    const fechaHoy = '2026-10-20';

    it('Calcula correctamente velocidadDiaria, días restantes y estado A_TIEMPO (Delta t = 0)', () => {
      const logs: HabitoLogRecord[] = [
        {
          id: 'l1',
          user_id: 'user-001',
          habito_id: 'hab-1',
          fecha_registro: '2026-10-15',
          valor_cuantitativo_sumado: 30,
          completado: true,
          updated_at: '2026-10-15T00:00:00Z',
          sync_status: 'synced'
        },
        {
          id: 'l2',
          user_id: 'user-001',
          habito_id: 'hab-1',
          fecha_registro: '2026-10-10',
          valor_cuantitativo_sumado: 30,
          completado: true,
          updated_at: '2026-10-10T00:00:00Z',
          sync_status: 'synced'
        }
      ];

      const resultado = calcularProyeccionMeta(metaPrueba, logs, [], fechaHoy);

      expect(resultado.velocidadDiaria).toBe(2);
      expect(resultado.diasRestantesEstimados).toBe(30);
      expect(resultado.fechaProyectada).toBe('2026-11-19');
      expect(resultado.desviacionDias).toBe(0);
      expect(resultado.estadoSalud).toBe('A_TIEMPO');
      expect(resultado.mensajeBadge).toBe('En cronograma');
    });

    it('Asigna estado ADELANTADO cuando Delta t <= -3', () => {
      const metaHolgada = { ...metaPrueba, fecha_fin: '2026-11-25' };
      const logs: HabitoLogRecord[] = [
        {
          id: 'l1',
          user_id: 'user-001',
          habito_id: 'hab-1',
          fecha_registro: '2026-10-18',
          valor_cuantitativo_sumado: 60,
          completado: true,
          updated_at: '2026-10-18T00:00:00Z',
          sync_status: 'synced'
        }
      ];

      const resultado = calcularProyeccionMeta(metaHolgada, logs, [], fechaHoy);

      expect(resultado.desviacionDias).toBe(-6);
      expect(resultado.estadoSalud).toBe('ADELANTADO');
      expect(resultado.mensajeBadge).toBe('Adelantado 6d');
    });

    it('Asigna estado RIESGO cuando 0 < Delta t <= 7', () => {
      const metaRiesgo = { ...metaPrueba, fecha_fin: '2026-11-15' };
      const logs: HabitoLogRecord[] = [
        {
          id: 'l1',
          user_id: 'user-001',
          habito_id: 'hab-1',
          fecha_registro: '2026-10-18',
          valor_cuantitativo_sumado: 60,
          completado: true,
          updated_at: '2026-10-18T00:00:00Z',
          sync_status: 'synced'
        }
      ];

      const resultado = calcularProyeccionMeta(metaRiesgo, logs, [], fechaHoy);

      expect(resultado.desviacionDias).toBe(4);
      expect(resultado.estadoSalud).toBe('RIESGO');
      expect(resultado.mensajeBadge).toBe('⚠️ Riesgo (+4d)');
    });

    it('Asigna estado CRITICO cuando Delta t > 7', () => {
      const metaCritica = { ...metaPrueba, fecha_fin: '2026-11-05' };
      const logs: HabitoLogRecord[] = [
        {
          id: 'l1',
          user_id: 'user-001',
          habito_id: 'hab-1',
          fecha_registro: '2026-10-18',
          valor_cuantitativo_sumado: 60,
          completado: true,
          updated_at: '2026-10-18T00:00:00Z',
          sync_status: 'synced'
        }
      ];

      const resultado = calcularProyeccionMeta(metaCritica, logs, [], fechaHoy);

      expect(resultado.desviacionDias).toBe(14);
      expect(resultado.estadoSalud).toBe('CRITICO');
      expect(resultado.mensajeBadge).toBe('🚨 Desviación (+14d)');
    });

    it('Tolerancia ante metas sin registros previos o sin inercia (SIN_DATOS)', () => {
      const resultado = calcularProyeccionMeta(metaPrueba, [], [], fechaHoy);

      expect(resultado.velocidadDiaria).toBe(0);
      expect(resultado.diasRestantesEstimados).toBeNull();
      expect(resultado.fechaProyectada).toBeNull();
      expect(resultado.desviacionDias).toBeNull();
      expect(resultado.estadoSalud).toBe('SIN_DATOS');
      expect(resultado.mensajeBadge).toBe('Sin inercia / 0 avance');
    });

    it('Ignora logs fuera de la ventana móvil de los últimos 30 días', () => {
      const logsViejos: HabitoLogRecord[] = [
        {
          id: 'l-antiguo',
          user_id: 'user-001',
          habito_id: 'hab-1',
          fecha_registro: '2026-08-01',
          valor_cuantitativo_sumado: 500,
          completado: true,
          updated_at: '2026-08-01T00:00:00Z',
          sync_status: 'synced'
        }
      ];

      const resultado = calcularProyeccionMeta(metaPrueba, logsViejos, [], fechaHoy);
      expect(resultado.velocidadDiaria).toBe(0);
      expect(resultado.estadoSalud).toBe('SIN_DATOS');
    });

    it('Adjunta indicador de alerta cuando existen hitos vencidos no completados', () => {
      const hitosVencidos: HitoPlanRecord[] = [
        {
          id: 'h-vencido-1',
          user_id: 'user-001',
          codigo_legado: 'HIT-PLN-010',
          meta_id: metaPrueba.id,
          titulo_hito: 'Instalar Rust y Cargo',
          orden_secuencia: 1,
          peso_relativo: 1,
          fecha_objetivo: '2026-10-10',
          completado: false,
          updated_at: '2026-10-10T00:00:00Z',
          version: 1,
          sync_status: 'synced'
        }
      ];

      const logs: HabitoLogRecord[] = [
        {
          id: 'l1',
          user_id: 'user-001',
          habito_id: 'hab-1',
          fecha_registro: '2026-10-18',
          valor_cuantitativo_sumado: 60,
          completado: true,
          updated_at: '2026-10-18T00:00:00Z',
          sync_status: 'synced'
        }
      ];

      const resultado = calcularProyeccionMeta(metaPrueba, logs, hitosVencidos, fechaHoy);
      expect(resultado.mensajeBadge).toContain('1 hito vencido');
      expect(resultado.mensajeBadge).toContain('En cronograma');
    });
  });
});
