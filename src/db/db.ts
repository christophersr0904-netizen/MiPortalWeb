import Dexie, { type Table } from 'dexie';
import type {
  ActividadPersonal,
  SubtareaPaso,
  HitoWbsRecord,
  NotaRecord,
  ProyectoRecord,
  TareaRecord,
  GastoRecord,
  IngresoRecord,
  IdeaRecord,
  CuotaRecord
} from '../types';
import seedPmo from './seedPmo.json';
import seedLife from './seedLife.json';

const initialSeed = {
  ...seedPmo,
  ...seedLife
};

export class PMODatabase extends Dexie {
  actividades_personales!: Table<ActividadPersonal, string>;
  subtareas_pasos!: Table<SubtareaPaso, string>;
  hitos_wbs!: Table<HitoWbsRecord, string>;
  notas!: Table<NotaRecord, string>;
  proyectos!: Table<ProyectoRecord, string>;
  tareas!: Table<TareaRecord, string>;
  gastos!: Table<GastoRecord, string>;
  ingresos!: Table<IngresoRecord, string>;
  ideas!: Table<IdeaRecord, string>;
  cuotas!: Table<CuotaRecord, string>;

  constructor() {
    super('PMOPersonalModularDB');
    this.version(1).stores({
      actividades_personales: 'id, user_id, codigo_legado, estado, categoria_vida, tipo_compromiso, fecha_programada, sync_status, [user_id+estado], [user_id+categoria_vida]',
      subtareas_pasos: 'id, user_id, codigo_legado, id_padre_vinculado, tipo_padre, numero_paso, completado, sync_status, [id_padre_vinculado+numero_paso]'
    });
    this.version(2).stores({
      actividades_personales: 'id, user_id, codigo_legado, estado, categoria_vida, tipo_compromiso, fecha_programada, sync_status, [user_id+estado], [user_id+categoria_vida]',
      subtareas_pasos: 'id, user_id, codigo_legado, id_padre_vinculado, tipo_padre, numero_paso, completado, sync_status, [id_padre_vinculado+numero_paso]',
      hitos_wbs: 'id, user_id, codigo_legado, proyecto_id, wbs_code, tipo_elemento_wbs, fase_asociada, estado, fecha_limite, updated_at, sync_status',
      notas: 'id, user_id, codigo_legado, tipo_nota, color_tema, es_fijada, updated_at, sync_status, *etiquetas'
    });
    this.version(3).stores({
      actividades_personales: 'id, user_id, codigo_legado, estado, categoria_vida, tipo_compromiso, fecha_programada, sync_status, [user_id+estado], [user_id+categoria_vida]',
      subtareas_pasos: 'id, user_id, codigo_legado, id_padre_vinculado, tipo_padre, numero_paso, completado, sync_status, [id_padre_vinculado+numero_paso]',
      hitos_wbs: 'id, user_id, codigo_legado, proyecto_id, wbs_code, tipo_elemento_wbs, fase_asociada, estado, fecha_limite, updated_at, sync_status',
      notas: 'id, user_id, codigo_legado, tipo_nota, color_tema, es_fijada, updated_at, sync_status, *etiquetas',
      proyectos: 'id, user_id, codigo_legado, tipo_iniciativa, estado_proyecto, arquetipo_proyecto, health_status, sync_status',
      tareas: 'id, user_id, codigo_legado, proyecto_codigo, hito_codigo, estado_tarea, prioridad_eisenhower, nivel_energia_requerido, fecha_programada, sync_status',
      gastos: 'id, user_id, codigo_legado, tipo_origen, categoria_gasto, estado_pago, fecha_gasto, sync_status',
      ingresos: 'id, user_id, codigo_legado, tipo_origen, categoria_ingreso, estado_cobro, fecha_ingreso, sync_status',
      ideas: 'id, user_id, codigo_legado, estado, tipo_captura, fecha_captura, sync_status',
      cuotas: 'id, user_id, codigo_legado, estado_cuota, fecha_vencimiento, sync_status'
    });
  }
}

export const db = new PMODatabase();

/**
 * Semilla de hidratación canónica a partir de volcado_sheets_pmo.json (281+ registros auditados)
 * Verificación e inserción idempotente tabla por tabla preservando claves duales legacy y normalizadas.
 */
export async function inicializarDatosSemillaSiVacio(_userId: string = '00000000-0000-0000-0000-000000000001'): Promise<void> {
  if (!initialSeed) return;

  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('t1_dexie_start');
  }

  // Umbrales canónicos esperados desde initialSeed.json
  const totalActEsperadas = initialSeed.actividades_personales?.length || 13;
  const totalSubEsperadas = initialSeed.subtareas_pasos?.length || 33;
  const totalHitosEsperados = initialSeed.hitos_wbs?.length || 47;
  const totalNotasEsperadas = initialSeed.notas?.length || 23;
  const totalProyectosEsperados = initialSeed.proyectos?.length || 13;
  const totalTareasEsperadas = initialSeed.tareas?.length || 59;
  const totalGastosEsperados = initialSeed.gastos?.length || 28;
  const totalIngresosEsperados = initialSeed.ingresos?.length || 57;
  const totalIdeasEsperadas = initialSeed.ideas?.length || 8;
  const totalCuotasEsperadas = initialSeed.cuotas?.length || 2;

  // Consulta de conteo concurrente en una sola ronda I/O (< 25 ms)
  const [
    countAct, countSub, countHit, countNot, countProy,
    countTar, countGas, countIng, countIde, countCuo
  ] = await Promise.all([
    db.actividades_personales.count(),
    db.subtareas_pasos.count(),
    db.hitos_wbs.count(),
    db.notas.count(),
    db.proyectos.count(),
    db.tareas.count(),
    db.gastos.count(),
    db.ingresos.count(),
    db.ideas.count(),
    db.cuotas.count()
  ]);

  // Siembras condicionales en bloque si se detectan umbrales inferiores al canónico
  const tareasDeSiembra: Promise<any>[] = [];

  if (countAct < totalActEsperadas && initialSeed.actividades_personales?.length) {
    tareasDeSiembra.push(db.actividades_personales.bulkPut(initialSeed.actividades_personales as ActividadPersonal[]));
  }
  if (countSub < totalSubEsperadas && initialSeed.subtareas_pasos?.length) {
    tareasDeSiembra.push(db.subtareas_pasos.bulkPut(initialSeed.subtareas_pasos as SubtareaPaso[]));
  }
  if (countHit < totalHitosEsperados && initialSeed.hitos_wbs?.length) {
    tareasDeSiembra.push(db.hitos_wbs.bulkPut(initialSeed.hitos_wbs as HitoWbsRecord[]));
  }
  if (countNot < totalNotasEsperadas && initialSeed.notas?.length) {
    tareasDeSiembra.push(db.notas.bulkPut(initialSeed.notas as unknown as NotaRecord[]));
  }
  if (countProy < totalProyectosEsperados && initialSeed.proyectos?.length) {
    tareasDeSiembra.push(db.proyectos.bulkPut(initialSeed.proyectos as ProyectoRecord[]));
  }
  if (countTar < totalTareasEsperadas && initialSeed.tareas?.length) {
    tareasDeSiembra.push(db.tareas.bulkPut(initialSeed.tareas as TareaRecord[]));
  }
  if (countGas < totalGastosEsperados && initialSeed.gastos?.length) {
    tareasDeSiembra.push(db.gastos.bulkPut(initialSeed.gastos as GastoRecord[]));
  }
  if (countIng < totalIngresosEsperados && initialSeed.ingresos?.length) {
    tareasDeSiembra.push(db.ingresos.bulkPut(initialSeed.ingresos as IngresoRecord[]));
  }
  if (countIde < totalIdeasEsperadas && initialSeed.ideas?.length) {
    tareasDeSiembra.push(db.ideas.bulkPut(initialSeed.ideas as IdeaRecord[]));
  }
  if (countCuo < totalCuotasEsperadas && initialSeed.cuotas?.length) {
    tareasDeSiembra.push(db.cuotas.bulkPut(initialSeed.cuotas as CuotaRecord[]));
  }

  if (tareasDeSiembra.length > 0) {
    await Promise.all(tareasDeSiembra);
  }

  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('t2_dexie_resolved');
  }
}

/**
 * Función utilitaria para forzar la rehidratación completa de los 281 registros desde initialSeed.json
 */
export async function forzarRecargaSemillaCompleta(): Promise<void> {
  if (!initialSeed) return;
  await db.transaction('rw', [
    db.actividades_personales,
    db.subtareas_pasos,
    db.hitos_wbs,
    db.notas,
    db.proyectos,
    db.tareas,
    db.gastos,
    db.ingresos,
    db.ideas,
    db.cuotas
  ], async () => {
    await db.actividades_personales.clear();
    await db.subtareas_pasos.clear();
    await db.hitos_wbs.clear();
    await db.notas.clear();
    await db.proyectos.clear();
    await db.tareas.clear();
    await db.gastos.clear();
    await db.ingresos.clear();
    await db.ideas.clear();
    await db.cuotas.clear();

    if (initialSeed.actividades_personales) await db.actividades_personales.bulkPut(initialSeed.actividades_personales as ActividadPersonal[]);
    if (initialSeed.subtareas_pasos) await db.subtareas_pasos.bulkPut(initialSeed.subtareas_pasos as SubtareaPaso[]);
    if (initialSeed.hitos_wbs) await db.hitos_wbs.bulkPut(initialSeed.hitos_wbs as HitoWbsRecord[]);
    if (initialSeed.notas) await db.notas.bulkPut(initialSeed.notas as unknown as NotaRecord[]);
    if (initialSeed.proyectos) await db.proyectos.bulkPut(initialSeed.proyectos as ProyectoRecord[]);
    if (initialSeed.tareas) await db.tareas.bulkPut(initialSeed.tareas as TareaRecord[]);
    if (initialSeed.gastos) await db.gastos.bulkPut(initialSeed.gastos as GastoRecord[]);
    if (initialSeed.ingresos) await db.ingresos.bulkPut(initialSeed.ingresos as IngresoRecord[]);
    if (initialSeed.ideas) await db.ideas.bulkPut(initialSeed.ideas as IdeaRecord[]);
    if (initialSeed.cuotas) await db.cuotas.bulkPut(initialSeed.cuotas as CuotaRecord[]);
  });
}

// Exposición en runtime para depuración en modo desarrollo
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__PMO_DB__ = db;
  (window as any).__FORZAR_RECARGA_SEMILLA__ = forzarRecargaSemillaCompleta;
}

