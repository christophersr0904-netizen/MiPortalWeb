import { describe, it, expect } from 'vitest';
import {
  getProp,
  normalizeProyecto,
  normalizeTarea,
  normalizeHito,
  normalizeActividad,
  calcularDiasArchivado,
  esElementoArchivado,
  validarDoDSubtareas,
  evaluarFiltroTemporal,
  evaluarFiltroPlazo,
  evaluarFiltroMeta,
  extraerCodigoCanonico,
  fusionarRegistrosDuplicados,
  deduplicarPorCodigoCanonico,
  deduplicarMetasPlanes,
  deduplicarHitosPlan,
  deduplicarVinculosMeta
} from '../entityNormalizer';
import initialSeed from '../../db/initialSeed.json';

describe('REQ-1TO1-001: EntityNormalizer and Seed Integrity', () => {
  it('getProp resolves across snake_case, PascalCase, and fallback keys', () => {
    const objLegacy = { ID_Proyecto: 'PRO-001', Nombre_Proyecto: 'Proyecto Alpha' };
    const objSnake = { codigo_legado: 'PRO-002', nombre_proyecto: 'Proyecto Beta' };

    expect(getProp(objLegacy, 'codigo_legado', 'ID_Proyecto')).toBe('PRO-001');
    expect(getProp(objLegacy, 'nombre_proyecto', 'Nombre_Proyecto')).toBe('Proyecto Alpha');
    expect(getProp(objSnake, 'codigo_legado', 'ID_Proyecto')).toBe('PRO-002');
    expect(getProp(objSnake, 'nombre_proyecto', 'Nombre_Proyecto')).toBe('Proyecto Beta');
    expect(getProp(null, 'foo')).toBeUndefined();
  });

  it('normalizeProyecto scales decimal 0.65 to 65% and unifies attributes', () => {
    const rawLegacy = {
      ID_Proyecto: 'PRO-001',
      Nombre_Proyecto: 'Certificación PMP',
      Avance_Real_Pct: 0.65,
      Presupuesto_Tope: 12500,
      Costo_Ejecutado_Real_PEN: 1563.75,
      SPI: 0.78,
      CPI: 0.99
    };

    const canonical = normalizeProyecto(rawLegacy);
    expect(canonical.codigo_legado).toBe('PRO-001');
    expect(canonical.nombre).toBe('Certificación PMP');
    expect(canonical.avance_pct).toBe(65);
    expect(canonical.presupuesto).toBe(12500);
    expect(canonical.costo_real).toBe(1563.75);
    expect(canonical.spi).toBe(0.78);
    expect(canonical.cpi).toBe(0.99);
  });

  it('normalizeTarea correctly unifies IDs, titles, and states', () => {
    const rawTarea = {
      ID_Tarea: 'TAR-001',
      Nombre_Tarea_Actividad: 'Revisar temario PMP',
      Estado_Tarea: '04_Completado',
      Prioridad_Eisenhower: '01_P1_Alta',
      idHito: 'WP-001'
    };

    const canonical = normalizeTarea(rawTarea);
    expect(canonical.codigo_legado).toBe('TAR-001');
    expect(canonical.nombre).toBe('Revisar temario PMP');
    expect(canonical.estado).toBe('04_Completado');
    expect(canonical.estado_label).toBe('Completado');
    expect(canonical.prioridad).toBe('01_P1_Alta');
    expect(canonical.hito_codigo).toBe('WP-001');
  });

  it('normalizeHito unifies WBS code and weight', () => {
    const rawHito = {
      ID_Elemento_WBS: 'WP-001',
      ID_Proyecto: 'PRO-001',
      Nombre_Elemento: 'Diagnóstico',
      Peso_Ponderado_Pct: 0.05,
      Fecha_Limite_Plan: '2026-03-05'
    };

    const canonical = normalizeHito(rawHito);
    expect(canonical.codigo_legado).toBe('WP-001');
    expect(canonical.proyecto_id).toBe('PRO-001');
    expect(canonical.nombre).toBe('Diagnóstico');
    expect(canonical.peso_pct).toBe(0.05);
    expect(canonical.fecha_limite).toBe('2026-03-05');
  });

  it('normalizeActividad unifies habits metrics with number safety', () => {
    const rawAct = {
      ID_Actividad: 'ACT-001',
      Nombre_Actividad: 'Entrenamiento Gimnasio',
      Racha_Actual: '5',
      Valor_Acumulado_Actual: '80',
      Meta_Diaria_Estandar: '1'
    };

    const canonical = normalizeActividad(rawAct);
    expect(canonical.codigo_legado).toBe('ACT-001');
    expect(canonical.nombre).toBe('Entrenamiento Gimnasio');
    expect(canonical.racha_actual).toBe(5);
    expect(canonical.valor_acumulado).toBe(80);
    expect(canonical.meta_diaria).toBe(1);
  });

  it('initialSeed.json contains audited counts across all 10 collections', () => {
    expect(initialSeed.proyectos.length).toBe(13);
    expect(initialSeed.tareas.length).toBe(59);
    expect(initialSeed.hitos.length).toBe(47);
    expect(initialSeed.actividades.length).toBe(13);
    expect(initialSeed.subtareas.length).toBe(33);
    expect(initialSeed.notas.length).toBe(23);
    expect(initialSeed.gastos.length).toBe(28);
    expect(initialSeed.ingresos.length).toBe(57);
    expect(initialSeed.ideas.length).toBe(8);
    expect(initialSeed.cuotas.length).toBe(2);

    const total =
      initialSeed.proyectos.length +
      initialSeed.tareas.length +
      initialSeed.hitos.length +
      initialSeed.actividades.length +
      initialSeed.subtareas.length +
      initialSeed.notas.length +
      initialSeed.gastos.length +
      initialSeed.ingresos.length +
      initialSeed.ideas.length +
      initialSeed.cuotas.length;

    expect(total).toBe(283);
  });

  describe('REQ-1TO1-002: Bóveda de Archivados (+10 Días) Rule', () => {
    const refDate = new Date('2026-10-16T12:00:00Z');

    it('calcularDiasArchivado returns exact difference in elapsed days', () => {
      // 5 días antes
      const item5Dias = { fecha_completado: '2026-10-11' };
      expect(calcularDiasArchivado(item5Dias, refDate)).toBe(5);

      // 10 días antes
      const item10Dias = { fecha_completado: '2026-10-06' };
      expect(calcularDiasArchivado(item10Dias, refDate)).toBe(10);

      // 15 días antes
      const item15Dias = { fecha_completado: '2026-10-01' };
      expect(calcularDiasArchivado(item15Dias, refDate)).toBe(15);

      // Desarchivado retorna 0
      const itemDesarchivado = { fecha_completado: '2026-09-01', _desarchivado: true };
      expect(calcularDiasArchivado(itemDesarchivado, refDate)).toBe(0);
    });

    it('esElementoArchivado returns false if not completed or terminal', () => {
      const tareaActiva = {
        estado_tarea: '02_Por_Hacer',
        fecha_programada: '2026-09-01'
      };
      expect(esElementoArchivado(tareaActiva, 'tareas', refDate)).toBe(false);

      const proyectoEnCurso = {
        estado_proyecto: '03_En_Ejecucion',
        avance_real_pct: 0.65,
        fecha_fin_plan: '2026-09-01'
      };
      expect(esElementoArchivado(proyectoEnCurso, 'proyectos', refDate)).toBe(false);
    });

    it('esElementoArchivado returns false for terminal items completed <= 10 days ago', () => {
      // Tarea completada hace 5 días
      const tareaReciente = {
        estado_tarea: '04_Completado',
        fecha_completado: '2026-10-11'
      };
      expect(esElementoArchivado(tareaReciente, 'tareas', refDate)).toBe(false);

      // Tarea completada hace exactamente 10 días (umbral estricto > 10)
      const tareaLimite10 = {
        estado_tarea: '04_Completado',
        fecha_completado: '2026-10-06'
      };
      expect(esElementoArchivado(tareaLimite10, 'tareas', refDate)).toBe(false);
    });

    it('esElementoArchivado returns true for terminal items completed > 10 days ago', () => {
      // Tarea completada hace 11 días
      const tareaArchivada = {
        estado_tarea: '04_Completado',
        fecha_completado: '2026-10-05'
      };
      expect(esElementoArchivado(tareaArchivada, 'tareas', refDate)).toBe(true);

      // Proyecto cerrado hace 30 días
      const proyectoCerrado = {
        estado_proyecto: '04_Cerrado',
        fecha_fin_real: '2026-09-16'
      };
      expect(esElementoArchivado(proyectoCerrado, 'proyectos', refDate)).toBe(true);

      // Hábito personal completado hace 15 días
      const habitoAntiguo = {
        estado: '04_Completado',
        fecha_completado: '2026-10-01'
      };
      expect(esElementoArchivado(habitoAntiguo, 'actividades', refDate)).toBe(true);

      // Gasto conciliado y pagado hace 20 días
      const gastoPagado = {
        estado_pago: 'PAGADO',
        fecha_gasto: '2026-09-26'
      };
      expect(esElementoArchivado(gastoPagado, 'gastos', refDate)).toBe(true);

      // Ingreso cobrado hace 12 días
      const ingresoCobrado = {
        estado_cobro: 'COBRADO',
        fecha_ingreso: '2026-10-04'
      };
      expect(esElementoArchivado(ingresoCobrado, 'ingresos', refDate)).toBe(true);
    });

    it('esElementoArchivado respects _desarchivado === true flag', () => {
      const tareaReactivada = {
        estado_tarea: '04_Completado',
        fecha_completado: '2026-09-01',
        _desarchivado: true
      };
      expect(esElementoArchivado(tareaReactivada, 'tareas', refDate)).toBe(false);
    });
  });

  describe('REQ-1TO1-003: Kanban DoD Validation and Multi-dimensional Filters', () => {
    it('validarDoDSubtareas returns valido=true when no subtasks exist', () => {
      const res = validarDoDSubtareas('TAR-999', []);
      expect(res.valido).toBe(true);
      expect(res.total).toBe(0);
      expect(res.pendientes).toBe(0);
    });

    it('validarDoDSubtareas detects incomplete procedural steps', () => {
      const mockSubtareas = [
        { id_padre_vinculado: 'TAR-001', descripcion_paso: 'Paso 1', completado: true },
        { id_padre_vinculado: 'TAR-001', descripcion_paso: 'Paso 2', completado: false },
        { id_padre_vinculado: 'TAR-002', descripcion_paso: 'Otro paso', completado: true }
      ];

      const resInvalido = validarDoDSubtareas('TAR-001', mockSubtareas);
      expect(resInvalido.valido).toBe(false);
      expect(resInvalido.total).toBe(2);
      expect(resInvalido.completadas).toBe(1);
      expect(resInvalido.pendientes).toBe(1);

      const resValido = validarDoDSubtareas('TAR-002', mockSubtareas);
      expect(resValido.valido).toBe(true);
      expect(resValido.total).toBe(1);
      expect(resValido.completadas).toBe(1);
      expect(resValido.pendientes).toBe(0);
    });

    it('evaluarFiltroTemporal accurately checks TODO, HOY, SEMANA, and MES', () => {
      const ref = new Date('2026-10-16T12:00:00Z'); // Viernes 16 Octubre 2026

      expect(evaluarFiltroTemporal('2026-10-16', 'HOY', ref)).toBe(true);
      expect(evaluarFiltroTemporal('2026-10-15', 'HOY', ref)).toBe(false);

      expect(evaluarFiltroTemporal('2026-10-14', 'SEMANA', ref)).toBe(true);
      expect(evaluarFiltroTemporal('2026-10-25', 'SEMANA', ref)).toBe(false);

      expect(evaluarFiltroTemporal('2026-10-30', 'MES', ref)).toBe(true);
      expect(evaluarFiltroTemporal('2026-11-01', 'MES', ref)).toBe(false);

      expect(evaluarFiltroTemporal('2026-11-01', 'TODO', ref)).toBe(true);
    });

    it('evaluarFiltroPlazo handles vencidas, hoy, 7dias, and sin_fecha', () => {
      const ref = new Date('2026-10-16T12:00:00Z');

      expect(evaluarFiltroPlazo(undefined, 'sin_fecha', '01_Backlog', ref)).toBe(true);
      expect(evaluarFiltroPlazo('2026-10-16', 'sin_fecha', '01_Backlog', ref)).toBe(false);

      expect(evaluarFiltroPlazo('2026-10-16', 'hoy', '01_Backlog', ref)).toBe(true);
      expect(evaluarFiltroPlazo('2026-10-17', 'hoy', '01_Backlog', ref)).toBe(false);

      // Vencida: menor a hoy y no completada
      expect(evaluarFiltroPlazo('2026-10-10', 'vencidas', '01_Backlog', ref)).toBe(true);
      expect(evaluarFiltroPlazo('2026-10-10', 'vencidas', '04_Completado', ref)).toBe(false);
      expect(evaluarFiltroPlazo('2026-10-20', 'vencidas', '01_Backlog', ref)).toBe(false);

      // 7 días: hoy hasta hoy+7
      expect(evaluarFiltroPlazo('2026-10-20', '7dias', '01_Backlog', ref)).toBe(true);
      expect(evaluarFiltroPlazo('2026-10-28', '7dias', '01_Backlog', ref)).toBe(false);
    });

    it('evaluarFiltroMeta handles TODAS, __SIN_META__, direct link, and macro name match (REQ-HABITS-FILTER-BY-META-16)', () => {
      const metaMaraton = { id: 'meta-uuid-1', nombre_meta: 'Maratón 42K' };
      const metaLectura = { id: 'meta-uuid-2', nombre_meta: 'Leer 12 Libros' };
      const metasPlanes = [metaMaraton, metaLectura];

      const metasPorHabitoId = new Map<string, any>([
        ['act-running', metaMaraton]
      ]);

      const actVinculada = { id: 'act-running', meta_macro_nombre: undefined };
      const actPorNombre = { id: 'act-lectura', meta_macro_nombre: 'Leer 12 Libros' };
      const actSinMeta = { id: 'act-meditacion', meta_macro_nombre: '' };

      // 1. TODAS permite cualquier actividad
      expect(evaluarFiltroMeta(actVinculada, 'TODAS', metasPorHabitoId, metasPlanes)).toBe(true);
      expect(evaluarFiltroMeta(actPorNombre, 'TODAS', metasPorHabitoId, metasPlanes)).toBe(true);
      expect(evaluarFiltroMeta(actSinMeta, 'TODAS', metasPorHabitoId, metasPlanes)).toBe(true);

      // 2. __SIN_META__ filtra solo las no vinculadas y sin meta_macro_nombre
      expect(evaluarFiltroMeta(actSinMeta, '__SIN_META__', metasPorHabitoId, metasPlanes)).toBe(true);
      expect(evaluarFiltroMeta(actVinculada, '__SIN_META__', metasPorHabitoId, metasPlanes)).toBe(false);
      expect(evaluarFiltroMeta(actPorNombre, '__SIN_META__', metasPorHabitoId, metasPlanes)).toBe(false);

      // 3. Filtro por UUID específico con vínculo directo en metasPorHabitoId
      expect(evaluarFiltroMeta(actVinculada, 'meta-uuid-1', metasPorHabitoId, metasPlanes)).toBe(true);
      expect(evaluarFiltroMeta(actVinculada, 'meta-uuid-2', metasPorHabitoId, metasPlanes)).toBe(false);

      // 4. Filtro por UUID específico por coincidencia de nombre en meta_macro_nombre
      expect(evaluarFiltroMeta(actPorNombre, 'meta-uuid-2', metasPorHabitoId, metasPlanes)).toBe(true);
      expect(evaluarFiltroMeta(actPorNombre, 'meta-uuid-1', metasPorHabitoId, metasPlanes)).toBe(false);

      // 5. Actividad sin meta frente a un UUID específico
      expect(evaluarFiltroMeta(actSinMeta, 'meta-uuid-1', metasPorHabitoId, metasPlanes)).toBe(false);
    });
  });

  describe('REQ-VISTA-360-DEDUPLICATION-AUDIT-89: Deduplicación y Fusión Canónica por codigo_legado', () => {
    it('extraerCodigoCanonico prioriza codigo_legado e ID_* sobre UUID', () => {
      expect(extraerCodigoCanonico({ id: 'h0000000-0000-0000-0000-000000000001', codigo_legado: 'WP-001' })).toBe('WP-001');
      expect(extraerCodigoCanonico({ id: 'uuid-1', ID_Tarea: 'TAR-005' })).toBe('TAR-005');
      expect(extraerCodigoCanonico({ id: '550e8400-e29b-41d4-a716-446655440000' })).toBe('550E8400-E29B-41D4-A716-446655440000');
    });

    it('deduplicarPorCodigoCanonico consolida semilla (h0000...) y registro Supabase conservando UUID real y vínculos', () => {
      const hitoSemilla: Record<string, any> = {
        id: 'h0000000-0000-0000-0000-000000000001',
        codigo_legado: 'WP-001',
        proyecto_id: 'PRO-001',
        nombre_elemento: 'Diagnóstico Inicial',
        wbs_code: '1.1',
        peso_pct: 0.15,
        sync_status: 'synced'
      };
      const hitoRemoto: Record<string, any> = {
        id: '550e8400-e29b-41d4-a716-446655440010',
        codigo_legado: 'WP-001',
        proyecto_id: '550e8400-e29b-41d4-a716-446655440001',
        nombre_elemento: 'Diagnóstico Inicial Actualizado',
        peso_ponderado_pct: 15,
        sync_status: 'synced'
      };

      const resultado = deduplicarPorCodigoCanonico([hitoSemilla, hitoRemoto]);
      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe('550e8400-e29b-41d4-a716-446655440010');
      expect(resultado[0].codigo_legado).toBe('WP-001');
      expect(resultado[0].nombre_elemento).toBe('Diagnóstico Inicial Actualizado');
      expect(resultado[0].wbs_code).toBe('1.1');
      expect(resultado[0].peso_pct).toBe(0.15);
    });

    it('fusionarRegistrosDuplicados preserva mutaciones locales con sync_status === pending', () => {
      const tareaRemota: Record<string, any> = {
        id: '550e8400-e29b-41d4-a716-446655440020',
        codigo_legado: 'TAR-001',
        estado_tarea: '02_Por_Hacer',
        sync_status: 'synced'
      };
      const tareaLocalPending: Record<string, any> = {
        id: 't0000000-0000-0000-0000-000000000001',
        codigo_legado: 'TAR-001',
        proyecto_codigo: 'PRO-001',
        hito_codigo: 'WP-001',
        estado_tarea: '04_Completado',
        sync_status: 'pending'
      };

      const fusionado = fusionarRegistrosDuplicados(tareaRemota, tareaLocalPending);
      expect(fusionado.estado_tarea).toBe('04_Completado');
      expect(fusionado.sync_status).toBe('pending');
      expect(fusionado.proyecto_codigo).toBe('PRO-001');
      expect(fusionado.hito_codigo).toBe('WP-001');
      expect(fusionado.id).toBe('550e8400-e29b-41d4-a716-446655440020');
    });
  });

  describe('REQ-HABITOS-METAS-360-FULL-SYSTEM-90: Deduplicación Canónica de Metas, Hitos de Plan y Vínculos', () => {
    it('deduplicarMetasPlanes unifica metas duplicadas por nombre_meta o codigo_legado conservando el mayor avance', () => {
      const meta1: Record<string, any> = {
        id: 'meta-uuid-1',
        codigo_legado: 'MET-001',
        nombre_meta: 'Dominar Inglés C1',
        valor_acumulado_actual: 12,
        sync_status: 'synced'
      };
      const meta2DuplicadaPorNombre: Record<string, any> = {
        id: 'meta-uuid-2',
        codigo_legado: 'MET-002',
        nombre_meta: '  dominar inglés c1  ',
        valor_acumulado_actual: 25,
        sync_status: 'pending'
      };

      const unificadas = deduplicarMetasPlanes([meta1, meta2DuplicadaPorNombre]);
      expect(unificadas).toHaveLength(1);
      expect(unificadas[0].valor_acumulado_actual).toBe(25);
    });

    it('deduplicarHitosPlan consolida hitos duplicados de una misma meta', () => {
      const hitoA: Record<string, any> = {
        id: 'hito-1',
        meta_id: 'meta-uuid-1',
        codigo_legado: 'MPL-001',
        titulo_hito: 'Inscribirse al examen',
        completado: false
      };
      const hitoBDuplicado: Record<string, any> = {
        id: 'hito-2',
        meta_id: 'meta-uuid-1',
        codigo_legado: 'MPL-002',
        titulo_hito: 'inscribirse al examen',
        completado: true,
        sync_status: 'pending'
      };

      const hitosUnicos = deduplicarHitosPlan([hitoA, hitoBDuplicado]);
      expect(hitosUnicos).toHaveLength(1);
      expect(hitosUnicos[0].completado).toBe(true);
    });

    it('deduplicarVinculosMeta elimina vínculos repetidos para el mismo par (meta_id, habito_id)', () => {
      const v1: Record<string, any> = {
        id: 'vinc-1',
        meta_id: 'meta-uuid-1',
        habito_id: 'act-uuid-1',
        peso_contribucion: 1,
        factor_conversion: 1
      };
      const v2: Record<string, any> = {
        id: 'vinc-2',
        meta_id: 'meta-uuid-1',
        habito_id: 'act-uuid-1',
        peso_contribucion: 2.5,
        factor_conversion: 1.5,
        sync_status: 'pending'
      };

      const vinculosUnicos = deduplicarVinculosMeta([v1, v2]);
      expect(vinculosUnicos).toHaveLength(1);
      expect(vinculosUnicos[0].peso_contribucion).toBe(2.5);
    });
  });
});


