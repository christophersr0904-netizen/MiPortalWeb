import { describe, it, expect, vi, afterEach } from 'vitest';
import { db } from '../../db/db';
import { syncManager } from '../syncManager';
import {
  sanitizarProyectoPayload,
  sanitizarHitoPayload,
  sanitizarTareaPayload,
  sanitizarNotaPayload,
  sanitizarActividadPayload,
  sanitizarSubtareaPayload,
  sanitizeDate,
  isUuid
} from '../syncPayloadSanitizer';
import type {
  ProyectoRecord,
  HitoWbsRecord,
  TareaRecord,
  NotaRecord,
  ActividadPersonal,
  SubtareaPaso
} from '../../types';

describe('REQ-SYNC-02: syncPayloadSanitizer (Sanitización Pura de Payloads)', () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';

  describe('1. Sanitización de Fechas y Helpers', () => {
    it('convierte strings vacíos o inválidos a null', () => {
      expect(sanitizeDate('')).toBeNull();
      expect(sanitizeDate('   ')).toBeNull();
      expect(sanitizeDate(undefined)).toBeNull();
      expect(sanitizeDate(null)).toBeNull();
      expect(sanitizeDate('fecha_invalida')).toBeNull();
    });

    it('extrae YYYY-MM-DD limpiamente de strings ISO', () => {
      expect(sanitizeDate('2026-10-19T15:30:00.000Z')).toBe('2026-10-19');
      expect(sanitizeDate('2026-03-31')).toBe('2026-03-31');
    });

    it('valida UUIDs correctamente con isUuid', () => {
      expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUuid('PRO-001')).toBe(false);
      expect(isUuid('tar-123456789')).toBe(false);
      expect(isUuid('')).toBe(false);
    });
  });

  describe('2. Sanitización de Proyectos (sanitizarProyectoPayload)', () => {
    const proyBase: ProyectoRecord = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: dummyUser,
      codigo_legado: 'PRO-001',
      nombre_proyecto: 'Proyecto Certificación PMP',
      tipo_iniciativa: 'Social', // Inválido en PG CHECK
      categoria_tshirt: 'Heavy',
      magnitud_complejidad: 'Heavy',
      arquetipo_proyecto: '4_Carrera',
      estado_proyecto: '04_Cerrado', // Inválido en PG CHECK
      avance_real_pct: 0.65, // Escala 0..1
      fecha_inicio_plan: '', // String vacío
      fecha_fin_plan: '2026-11-30',
      ultima_revision: '',
      moneda_base: 'PEN',
      presupuesto_tope: 12500,
      costo_ejecutado_real_pen: 1500,
      costo_ejecutado_real_usd: 0,
      north_star_okr: 'Aprobar examen PMP',
      criterios_aceptacion_dod: 'Certificado obtenido',
      entregable_tangible_objeto: 'Diploma',
      fase_ciclo_vida: 'Planificacion', // Columna inexistente en PG
      health_status: '🟢 Saludable',
      health_motivo: 'Evaluado', // Columna inexistente en PG
      spi: 1.05, // Columna inexistente en PG
      cpi: 0.98, // Columna inexistente en PG
      terceros_involucrados: 'PMI',
      alcance_detallado_url_drive: '',
      updated_at: '2026-10-19T00:00:00Z',
      sync_status: 'pending'
    };

    it('omite columnas no relacionales que provocarían error 400', () => {
      const payload = sanitizarProyectoPayload(proyBase, dummyUser);
      expect(payload).not.toHaveProperty('fase_ciclo_vida');
      expect(payload).not.toHaveProperty('health_motivo');
      expect(payload).not.toHaveProperty('spi');
      expect(payload).not.toHaveProperty('cpi');
      expect(payload).not.toHaveProperty('categoria_tshirt');
    });

    it('convierte fechas vacías a null', () => {
      const payload = sanitizarProyectoPayload(proyBase, dummyUser);
      expect(payload.fecha_inicio_plan).toBeNull();
      expect(payload.ultima_revision).toBeNull();
      expect(payload.fecha_fin_plan).toBe('2026-11-30');
    });

    it('escala avance_real_pct de 0..1 a 0..100 entero', () => {
      const payload = sanitizarProyectoPayload(proyBase, dummyUser);
      expect(payload.avance_real_pct).toBe(65);
    });

    it('normaliza tipo_iniciativa y estado_proyecto a valores válidos en PostgreSQL', () => {
      const payload = sanitizarProyectoPayload(proyBase, dummyUser);
      expect(payload.tipo_iniciativa).toBe('Personal'); // 'Social' se normaliza a 'Personal'
      expect(payload.estado_proyecto).toBe('06_Cerrado'); // '04_Cerrado' se mapea a '06_Cerrado'
    });
  });

  describe('3. Sanitización de Hitos WBS (sanitizarHitoPayload)', () => {
    const proyectoMap = new Map<string, string>([
      ['PRO-001', '550e8400-e29b-41d4-a716-446655440001']
    ]);

    const hitoPaquete: HitoWbsRecord = {
      id: '550e8400-e29b-41d4-a716-446655440010',
      user_id: dummyUser,
      codigo_legado: 'WP-001',
      proyecto_id: 'PRO-001', // Código legado a resolver
      tipo_elemento_wbs: 'PAQUETE_TRABAJO',
      wbs_code: '1.1',
      fase_asociada: '01_INICIACION', // Inválido en PG CHECK
      nombre_elemento: 'Diagnóstico Curricular',
      estado: '03_Completado',
      peso_pct: 0.15, // Mapear a peso_ponderado_pct y escalar a 15
      fecha_limite: '2026-03-31', // Mapear a fecha_limite_plan
      fecha_real_fin: '', // String vacío -> null
      presupuesto_asignado: 1500,
      duracion_estimada_dias: 15, // Columna inexistente en PG
      criterio_dod: 'Aprobación del syllabus', // Mapear a criterio_aceptacion_dod
      dependencia_hito_id: 'Ninguno', // String no UUID -> null
      entregable_link: 'https://drive.google.com', // Mapear a entregable_verificable_link
      updated_at: '2026-10-19T00:00:00Z',
      version: 1, // Columna inexistente en PG
      sync_status: 'pending'
    };

    const hitoMarcador: HitoWbsRecord = {
      ...hitoPaquete,
      id: '550e8400-e29b-41d4-a716-446655440011',
      codigo_legado: 'HIT-001',
      tipo_elemento_wbs: 'HITO_MARCADOR',
      presupuesto_asignado: 500 // Inconsistente con marcador
    };

    it('mapea correctamente los nombres de columnas relacionales de Postgres', () => {
      const payload = sanitizarHitoPayload(hitoPaquete, proyectoMap, dummyUser);
      expect(payload.peso_ponderado_pct).toBe(15);
      expect(payload.fecha_limite_plan).toBe('2026-03-31');
      expect(payload.criterio_aceptacion_dod).toBe('Aprobación del syllabus');
      expect(payload.entregable_verificable_link).toBe('https://drive.google.com');
      expect(payload).not.toHaveProperty('peso_pct');
      expect(payload).not.toHaveProperty('fecha_limite');
      expect(payload).not.toHaveProperty('criterio_dod');
      expect(payload).not.toHaveProperty('entregable_link');
    });

    it('omite columnas inexistentes como duracion_estimada_dias y version', () => {
      const payload = sanitizarHitoPayload(hitoPaquete, proyectoMap, dummyUser);
      expect(payload).not.toHaveProperty('duracion_estimada_dias');
      expect(payload).not.toHaveProperty('version');
    });

    it('resuelve proyecto_id al UUID correspondiente del mapa', () => {
      const payload = sanitizarHitoPayload(hitoPaquete, proyectoMap, dummyUser);
      expect(payload.proyecto_id).toBe('550e8400-e29b-41d4-a716-446655440001');
    });

    it('fuerza presupuesto_asignado a 0.00 en HITO_MARCADOR para respetar CHECK', () => {
      const payload = sanitizarHitoPayload(hitoMarcador, proyectoMap, dummyUser);
      expect(payload.presupuesto_asignado).toBe(0.00);
      expect(payload.tipo_elemento_wbs).toBe('HITO_MARCADOR');
    });

    it('normaliza fase_asociada de 01_INICIACION a Iniciacion', () => {
      const payload = sanitizarHitoPayload(hitoPaquete, proyectoMap, dummyUser);
      expect(payload.fase_asociada).toBe('Iniciacion');
    });

    it('descarta strings no UUID en dependencia_hito_id convirtiéndolos a null', () => {
      const payload = sanitizarHitoPayload(hitoPaquete, proyectoMap, dummyUser);
      expect(payload.dependencia_hito_id).toBeNull();
    });
  });

  describe('4. Sanitización de Tareas WBS (sanitizarTareaPayload)', () => {
    const proyectoMap = new Map<string, string>([
      ['PRO-001', '550e8400-e29b-41d4-a716-446655440001']
    ]);
    const hitoMap = new Map<string, string>([
      ['WP-001', '550e8400-e29b-41d4-a716-446655440010']
    ]);

    const tareaBase: TareaRecord = {
      id: '550e8400-e29b-41d4-a716-446655440020',
      user_id: dummyUser,
      codigo_legado: 'TAR-001',
      proyecto_codigo: 'PRO-001',
      hito_codigo: 'WP-001',
      nombre_tarea_actividad: 'Revisar material de lectura',
      estado_tarea: '03_En_Curso', // Normalizar a 03_En_Proceso
      prioridad_eisenhower: '01_P1_Alta',
      nivel_energia_requerido: 'Alta_Cognitiva_DeepWork',
      horas_estimadas: 2.5,
      horas_reales: 2.0,
      fecha_programada: '2026-10-19T09:00:00Z',
      agendado_calendar: 'Sí', // Mapear a agendado_en_calendar
      id_dependencia: 'TAR-000', // No UUID -> null
      responsable_ejecutor: 'Christopher',
      notas_impedimentos: 'Sin bloqueos',
      es_mav: true, // Columna inexistente en PG
      costo_real_pen: 50, // Columna inexistente en PG
      updated_at: '2026-10-19T00:00:00Z',
      sync_status: 'pending'
    };

    it('resuelve proyecto_id e hito_id a los UUIDs de Supabase', () => {
      const payload = sanitizarTareaPayload(tareaBase, proyectoMap, hitoMap, dummyUser);
      expect(payload.proyecto_id).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(payload.hito_id).toBe('550e8400-e29b-41d4-a716-446655440010');
    });

    it('omite campos operativos locales es_mav y costo_real_pen', () => {
      const payload = sanitizarTareaPayload(tareaBase, proyectoMap, hitoMap, dummyUser);
      expect(payload).not.toHaveProperty('es_mav');
      expect(payload).not.toHaveProperty('costo_real_pen');
    });

    it('mapea agendado_calendar a agendado_en_calendar y normaliza estado', () => {
      const payload = sanitizarTareaPayload(tareaBase, proyectoMap, hitoMap, dummyUser);
      expect(payload.agendado_en_calendar).toBe('Sí');
      expect(payload.estado_tarea).toBe('03_En_Proceso');
      expect(payload.fecha_programada).toBe('2026-10-19');
    });
  });

  describe('5. Sanitización de Notas (sanitizarNotaPayload)', () => {
    const notaBase: NotaRecord = {
      id: '550e8400-e29b-41d4-a716-446655440030',
      user_id: dummyUser,
      codigo_legado: 'NOT-00001',
      titulo: 'Nota Estratégica',
      contenido_markdown: '# Resumen ejecutivo',
      tipo_nota: 'CHECKLIST', // Campo virtual - omitir
      checklists_json: [{ id: 'c1', texto: 'Comprar libro', completado: true }],
      wishlist_json: undefined, // Debe sanitizarse a {}
      color_tema: 'sky',
      es_fijada: true,
      adjuntos_drive_json: [],
      enlaces_entidades_json: [],
      etiquetas: ['estrategia', 'pmp'],
      created_at: '2026-10-19T00:00:00Z',
      updated_at: '2026-10-19T00:00:00Z',
      version: 1, // Columna inexistente en PG
      sync_status: 'pending'
    };

    it('omite tipo_nota y version para evitar error 400', () => {
      const payload = sanitizarNotaPayload(notaBase, dummyUser);
      expect(payload).not.toHaveProperty('tipo_nota');
      expect(payload).not.toHaveProperty('version');
    });

    it('garantiza objetos y arrays válidos en campos JSONB NOT NULL', () => {
      const payload = sanitizarNotaPayload(notaBase, dummyUser);
      expect(payload.wishlist_json).toEqual({});
      expect(Array.isArray(payload.checklists_json)).toBe(true);
      expect(Array.isArray(payload.adjuntos_drive_json)).toBe(true);
      expect(Array.isArray(payload.enlaces_entidades_json)).toBe(true);
      expect(Array.isArray(payload.etiquetas)).toBe(true);
    });
  });

  describe('6. Sanitización de Actividades Personales (sanitizarActividadPayload)', () => {
    const actBase: ActividadPersonal = {
      id: '550e8400-e29b-41d4-a716-446655440040',
      user_id: dummyUser,
      codigo_legado: 'ACT-001',
      nombre_actividad: 'Meditación Matutina',
      tipo_compromiso: 'HABITUAL',
      categoria_vida: 'PERSONAL_DESCANSO',
      estado: '03_En_Curso', // Normalizar a 03_En_Proceso
      racha_actual: 5,
      fecha_programada: '2026-10-19T07:00:00Z',
      duracion_horas: 0.5,
      agendado_calendar: 'Sí',
      updated_at: '2026-10-19T00:00:00Z',
      version: 1,
      sync_status: 'pending'
    };

    it('sanitiza tipos, normaliza estado y fechas limpiamente', () => {
      const payload = sanitizarActividadPayload(actBase, dummyUser);
      expect(payload.nombre).toBe('Meditación Matutina');
      expect(payload.estado).toBe('03_En_Proceso');
      expect(payload.fecha_programada).toBe('2026-10-19');
      expect(payload.tipo_registro).toBe('HABITUAL');
      expect(payload.meta_objetivo_total).toBe(0);
    });
  });

  describe('7. Sanitización de Subtareas (sanitizarSubtareaPayload)', () => {
    const tareaMap = new Map<string, string>([
      ['TAR-001', '550e8400-e29b-41d4-a716-446655440020']
    ]);
    const actividadMap = new Map<string, string>([
      ['ACT-001', '550e8400-e29b-41d4-a716-446655440040']
    ]);

    const subBase: SubtareaPaso = {
      id: '550e8400-e29b-41d4-a716-446655440050',
      user_id: dummyUser,
      codigo_legado: 'SUB-001',
      id_padre_vinculado: 'TAR-001',
      tipo_padre: 'TAREA',
      numero_paso: 1,
      descripcion_paso: 'Paso 1 del procedimiento',
      completado: true,
      fecha_completado: '2026-10-19T10:00:00Z',
      updated_at: '2026-10-19T00:00:00Z',
      version: 1,
      sync_status: 'pending'
    };

    it('resuelve tarea_id a UUID y mantiene actividad_id como null', () => {
      const payload = sanitizarSubtareaPayload(subBase, tareaMap, actividadMap, dummyUser);
      expect(payload.tarea_id).toBe('550e8400-e29b-41d4-a716-446655440020');
      expect(payload.actividad_id).toBeNull();
      expect(payload).not.toHaveProperty('id_padre_vinculado');
      expect(payload).not.toHaveProperty('tipo_padre');
    });

    it('resuelve actividad_id a UUID cuando el padre es ACT-XXX', () => {
      const subAct: SubtareaPaso = {
        ...subBase,
        id_padre_vinculado: 'ACT-001',
        tipo_padre: 'ACTIVIDAD'
      };
      const payload = sanitizarSubtareaPayload(subAct, tareaMap, actividadMap, dummyUser);
      expect(payload.actividad_id).toBe('550e8400-e29b-41d4-a716-446655440040');
      expect(payload.tarea_id).toBeNull();
    });
  });
});

describe('REQ-SYNC-02: SyncManager (Replicación y Despacho Topológico)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inicializa y expone los métodos de sincronización requeridos', () => {
    expect(typeof syncManager.sincronizarProyectos).toBe('function');
    expect(typeof syncManager.sincronizarHitos).toBe('function');
    expect(typeof syncManager.sincronizarTareas).toBe('function');
    expect(typeof syncManager.sincronizarNotas).toBe('function');
    expect(typeof syncManager.sincronizarActividades).toBe('function');
    expect(typeof syncManager.sincronizarSubtareas).toBe('function');
    expect(typeof syncManager.syncPendingRecords).toBe('function');
    expect(typeof syncManager.descargarDatosDescendientes).toBe('function');
    expect(typeof syncManager.procesarColaPendiente).toBe('function');
    expect(typeof syncManager.sincronizarTodo).toBe('function');
  });

  it('construye mapas topológicos correctamente a partir de Dexie', async () => {
    vi.spyOn(db.proyectos, 'toArray').mockResolvedValue([
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        codigo_legado: 'PRO-001'
      } as any
    ]);

    const mapaProy = await syncManager.construirMapaProyectos();
    expect(mapaProy.get('PRO-001')).toBe('550e8400-e29b-41d4-a716-446655440001');
  });

  it('en modo mock/local-first, sincronizarProyectos marca registros como synced', async () => {
    (syncManager as any).supabase = null;
    const mockPendingProy = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      codigo_legado: 'PRO-001',
      nombre_proyecto: 'Proyecto Mock',
      tipo_iniciativa: 'Personal',
      estado_proyecto: '03_En_Ejecucion',
      avance_real_pct: 0,
      moneda_base: 'PEN',
      presupuesto_tope: 1000,
      costo_ejecutado_real_pen: 0,
      costo_ejecutado_real_usd: 0,
      updated_at: new Date().toISOString(),
      sync_status: 'pending'
    };

    vi.spyOn(db.proyectos, 'where').mockReturnValue({
      equals: () => ({
        toArray: async () => [mockPendingProy],
        count: async () => 1
      })
    } as any);

    const updateSpy = vi.spyOn(db.proyectos, 'update').mockResolvedValue(1);

    const res = await syncManager.sincronizarProyectos();
    expect(res.success).toBe(1);
    expect(res.failed).toBe(0);
    expect(updateSpy).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001', {
      sync_status: 'synced'
    });
  });

  it('despacha upsert con flag { onConflict: "codigo_legado" } cuando Supabase está activo', async () => {
    const mockPendingProy = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      codigo_legado: 'PRO-001',
      nombre_proyecto: 'Proyecto Live',
      tipo_iniciativa: 'Personal',
      estado_proyecto: '03_En_Ejecucion',
      avance_real_pct: 0,
      moneda_base: 'PEN',
      presupuesto_tope: 1000,
      costo_ejecutado_real_pen: 0,
      costo_ejecutado_real_usd: 0,
      updated_at: new Date().toISOString(),
      sync_status: 'pending'
    };

    vi.spyOn(db.proyectos, 'where').mockReturnValue({
      equals: () => ({
        toArray: async () => [mockPendingProy],
        count: async () => 1
      })
    } as any);

    vi.spyOn(db.proyectos, 'update').mockResolvedValue(1);

    const upsertSpy = vi.fn().mockResolvedValue({ error: null });
    const fromSpy = vi.fn().mockReturnValue({ upsert: upsertSpy });

    // Inyectar cliente Supabase activo
    (syncManager as any).supabase = { from: fromSpy };

    const res = await syncManager.sincronizarProyectos();

    expect(res.success).toBe(1);
    expect(res.failed).toBe(0);
    expect(fromSpy).toHaveBeenCalledWith('proyectos');
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ codigo_legado: 'PRO-001' }),
      { onConflict: 'codigo_legado' }
    );
  });

  it('aísla fallos por fila marcando sync_status = "error" en Dexie', async () => {
    const mockPendingNota = {
      id: '550e8400-e29b-41d4-a716-446655440030',
      codigo_legado: 'NOT-00001',
      titulo: 'Nota Fallida',
      contenido_markdown: 'Texto',
      tipo_nota: 'TEXTO',
      checklists_json: [],
      wishlist_json: {},
      color_tema: 'default',
      es_fijada: false,
      adjuntos_drive_json: [],
      enlaces_entidades_json: [],
      etiquetas: [],
      updated_at: new Date().toISOString(),
      version: 1,
      sync_status: 'pending'
    };

    vi.spyOn(db.notas, 'where').mockReturnValue({
      equals: () => ({
        toArray: async () => [mockPendingNota],
        count: async () => 1
      })
    } as any);

    const updateSpy = vi.spyOn(db.notas, 'update').mockResolvedValue(1);

    const upsertSpy = vi.fn().mockResolvedValue({
      error: { message: 'Database error simulated', code: '400' }
    });
    (syncManager as any).supabase = {
      from: vi.fn().mockReturnValue({ upsert: upsertSpy })
    };

    const res = await syncManager.sincronizarNotas();

    expect(res.success).toBe(0);
    expect(res.failed).toBe(1);
    expect(updateSpy).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440030', {
      sync_status: 'error'
    });
  });

  it('ejecuta syncPendingRecords en orden topológico sin lanzar excepciones', async () => {
    (syncManager as any).supabase = null;
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    }
    vi.spyOn(db.proyectos, 'where').mockReturnValue({ equals: () => ({ count: async () => 0 }) } as any);
    vi.spyOn(db.hitos_wbs, 'where').mockReturnValue({ equals: () => ({ count: async () => 0 }) } as any);
    vi.spyOn(db.tareas, 'where').mockReturnValue({ equals: () => ({ count: async () => 0 }) } as any);
    vi.spyOn(db.actividades_personales, 'where').mockReturnValue({ equals: () => ({ count: async () => 0 }) } as any);
    vi.spyOn(db.subtareas_pasos, 'where').mockReturnValue({ equals: () => ({ count: async () => 0 }) } as any);
    vi.spyOn(db.notas, 'where').mockReturnValue({ equals: () => ({ count: async () => 0 }) } as any);

    await syncManager.syncPendingRecords();
    expect(syncManager.getStatus()).toBe('synced');
  });

  it('descargarDatosDescendientes omite registros si Supabase no está conectado o es mock', async () => {
    (syncManager as any).supabase = null;
    const res = await syncManager.descargarDatosDescendientes();
    expect(res.descargados).toBe(0);
    expect(res.fallidos).toBe(0);
  });

  it('descargarDatosDescendientes preserva registros con sync_status === pending', async () => {
    const mockRemoteTasks = [
      { id: 't1', nombre_tarea_actividad: 'Remota 1' },
      { id: 't2', nombre_tarea_actividad: 'Remota 2 Pendiente Local' }
    ];

    const fromSpy = vi.fn().mockImplementation((table: string) => ({
      select: vi.fn().mockResolvedValue({
        data: table === 'tareas' ? mockRemoteTasks : [],
        error: null
      })
    }));
    (syncManager as any).supabase = { from: fromSpy };

    // t2 está pendiente en Dexie
    vi.spyOn(db.tareas, 'where').mockReturnValue({
      equals: () => ({
        primaryKeys: async () => ['t2']
      })
    } as any);

    const bulkPutSpy = vi.spyOn(db.tareas, 'bulkPut').mockResolvedValue('t1' as any);

    const res = await syncManager.descargarDatosDescendientes();
    expect(res.descargados).toBe(1);
    expect(bulkPutSpy).toHaveBeenCalledWith([
      expect.objectContaining({ id: 't1', sync_status: 'synced' })
    ]);
  });

  it('sincronizarTodo orquesta procesarColaPendiente y descargarDatosDescendientes secuencialmente', async () => {
    const pushSpy = vi.spyOn(syncManager, 'procesarColaPendiente').mockResolvedValue(undefined);
    const pullSpy = vi.spyOn(syncManager, 'descargarDatosDescendientes').mockResolvedValue({ descargados: 2, fallidos: 0 });

    await syncManager.sincronizarTodo();
    expect(pushSpy).toHaveBeenCalled();
    expect(pullSpy).toHaveBeenCalled();
  });
});
