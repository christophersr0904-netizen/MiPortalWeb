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
  CuotaRecord,
  MetaPlanRecord,
  HitoPlanRecord,
  HabitoMetaVinculo,
  HabitoLogRecord
} from '../types';
import { extraerCodigoCanonico, fusionarRegistrosDuplicados } from '../utils/entityNormalizer';
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
  metas_planes!: Table<MetaPlanRecord, string>;
  planes_accion_hitos!: Table<HitoPlanRecord, string>;
  habitos_metas_vinculos!: Table<HabitoMetaVinculo, string>;
  habito_cumplimiento_logs!: Table<HabitoLogRecord, string>;

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
    this.version(4).stores({
      metas_planes: 'id, user_id, codigo_legado, categoria_vida, estado, sync_status',
      planes_accion_hitos: 'id, user_id, codigo_legado, meta_id, estado, sync_status',
      habitos_metas_vinculos: 'id, user_id, habito_id, meta_id, sync_status',
      habito_cumplimiento_logs: 'id, user_id, habito_id, fecha_registro, sync_status, [habito_id+fecha_registro]'
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

  // Consulta de conteo concurrente en una sola ronda I/O (< 25 ms)
  const [
    countAct, countSub, countHit, countNot, countProy,
    countTar, countGas, countIng, countIde, countCuo,
    countMetas, countHitosPln, countVin, countLogs
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
    db.cuotas.count(),
    db.metas_planes.count(),
    db.planes_accion_hitos.count(),
    db.habitos_metas_vinculos.count(),
    db.habito_cumplimiento_logs.count()
  ]);

  // Siembras condicionales únicamente cuando la tabla respectiva se encuentra vacía (count === 0),
  // evitando re-inyectar UUIDs sintéticos de semilla sobre bases ya sincronizadas con Supabase.
  const tareasDeSiembra: Promise<any>[] = [];

  if (countAct === 0 && initialSeed.actividades_personales?.length) {
    tareasDeSiembra.push(db.actividades_personales.bulkPut(initialSeed.actividades_personales as ActividadPersonal[]));
  }
  if (countSub === 0 && initialSeed.subtareas_pasos?.length) {
    tareasDeSiembra.push(db.subtareas_pasos.bulkPut(initialSeed.subtareas_pasos as SubtareaPaso[]));
  }
  if (countHit === 0 && initialSeed.hitos_wbs?.length) {
    tareasDeSiembra.push(db.hitos_wbs.bulkPut(initialSeed.hitos_wbs as HitoWbsRecord[]));
  }
  if (countNot === 0 && initialSeed.notas?.length) {
    tareasDeSiembra.push(db.notas.bulkPut(initialSeed.notas as unknown as NotaRecord[]));
  }
  if (countProy === 0 && initialSeed.proyectos?.length) {
    tareasDeSiembra.push(db.proyectos.bulkPut(initialSeed.proyectos as ProyectoRecord[]));
  }
  if (countTar === 0 && initialSeed.tareas?.length) {
    tareasDeSiembra.push(db.tareas.bulkPut(initialSeed.tareas as TareaRecord[]));
  }
  if (countGas === 0 && initialSeed.gastos?.length) {
    tareasDeSiembra.push(db.gastos.bulkPut(initialSeed.gastos as GastoRecord[]));
  }
  if (countIng === 0 && initialSeed.ingresos?.length) {
    tareasDeSiembra.push(db.ingresos.bulkPut(initialSeed.ingresos as IngresoRecord[]));
  }
  if (countIde === 0 && initialSeed.ideas?.length) {
    tareasDeSiembra.push(db.ideas.bulkPut(initialSeed.ideas as IdeaRecord[]));
  }
  if (countCuo === 0 && initialSeed.cuotas?.length) {
    tareasDeSiembra.push(db.cuotas.bulkPut(initialSeed.cuotas as CuotaRecord[]));
  }
  if (countMetas === 0 && (initialSeed as any).metas_planes?.length) {
    tareasDeSiembra.push(db.metas_planes.bulkPut((initialSeed as any).metas_planes as MetaPlanRecord[]));
  }
  if (countHitosPln === 0 && (initialSeed as any).planes_accion_hitos?.length) {
    tareasDeSiembra.push(db.planes_accion_hitos.bulkPut((initialSeed as any).planes_accion_hitos as HitoPlanRecord[]));
  }
  if (countVin === 0 && (initialSeed as any).habitos_metas_vinculos?.length) {
    tareasDeSiembra.push(db.habitos_metas_vinculos.bulkPut((initialSeed as any).habitos_metas_vinculos as HabitoMetaVinculo[]));
  }
  if (countLogs === 0 && (initialSeed as any).habito_cumplimiento_logs?.length) {
    tareasDeSiembra.push(db.habito_cumplimiento_logs.bulkPut((initialSeed as any).habito_cumplimiento_logs as HabitoLogRecord[]));
  }

  if (tareasDeSiembra.length > 0) {
    await Promise.all(tareasDeSiembra);
  }

  // Saneamiento automático de duplicados físicos por codigo_legado y enriquecimiento relacional
  await sanearDuplicadosDexie();

  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('t2_dexie_resolved');
  }
}

/**
 * Sanea registros físicamente duplicados en IndexedDB (distinto `id` primario pero idéntico
 * `codigo_legado`) originados por colisiones entre la semilla local (`p0000...`, `h0000...`, `t0000...`)
 * y descargas de Supabase/puente local, consolidando vínculos relacionales (`proyecto_codigo`, `hito_codigo`).
 */
export async function sanearDuplicadosDexie(): Promise<number> {
  let totalEliminados = 0;

  try {
    const tablasCanonicas: Array<Table<any, string>> = [
      db.proyectos,
      db.hitos_wbs,
      db.tareas,
      db.subtareas_pasos,
      db.actividades_personales,
      db.gastos,
      db.ingresos,
      db.notas,
      db.ideas,
      db.cuotas
    ];

    // 1. Deduplicación física por clave canónica en cada tabla
    const idRedirectMap = new Map<string, string>();

    for (const tabla of tablasCanonicas) {
      if (!tabla || typeof tabla.toArray !== 'function') continue;
      const registros = await tabla.toArray();
      if (!registros || registros.length <= 1) continue;

      const grupos = new Map<string, any[]>();
      for (const reg of registros) {
        const clave = extraerCodigoCanonico(reg);
        if (!clave) continue;
        if (!grupos.has(clave)) {
          grupos.set(clave, []);
        }
        grupos.get(clave)!.push(reg);
      }

      const idsAEliminar: string[] = [];
      const registrosConsolidados: any[] = [];

      grupos.forEach((lista) => {
        if (lista.length > 1) {
          let consolidado = lista[0];
          for (let i = 1; i < lista.length; i++) {
            consolidado = fusionarRegistrosDuplicados(consolidado, lista[i]);
          }
          for (const item of lista) {
            if (item.id && item.id !== consolidado.id) {
              idsAEliminar.push(String(item.id));
              idRedirectMap.set(String(item.id), String(consolidado.id));
            }
          }
          registrosConsolidados.push(consolidado);
        }
      });

      if (idsAEliminar.length > 0) {
        await tabla.bulkDelete(idsAEliminar);
        totalEliminados += idsAEliminar.length;
      }
      if (registrosConsolidados.length > 0) {
        await tabla.bulkPut(registrosConsolidados);
      }
    }

    // 1.B Deduplicación canónica de Metas, Planes de Acción (Hitos) y Vínculos N:M
    if (db.metas_planes && typeof db.metas_planes.toArray === 'function') {
      const metasRaw = await db.metas_planes.toArray();
      if (metasRaw && metasRaw.length > 1) {
        const gruposMetas = new Map<string, MetaPlanRecord[]>();
        for (const m of metasRaw) {
          const claveNombre = String(m.nombre_meta || '').trim().toUpperCase();
          const claveCod = extraerCodigoCanonico(m);
          const clave = claveNombre || claveCod || String(m.id);
          if (!gruposMetas.has(clave)) gruposMetas.set(clave, []);
          gruposMetas.get(clave)!.push(m);
        }

        const metasIdsEliminar: string[] = [];
        const metasConsolidadas: MetaPlanRecord[] = [];

        gruposMetas.forEach((lista) => {
          if (lista.length > 1) {
            let consolidada = lista[0];
            for (let i = 1; i < lista.length; i++) {
              const prevCod = String(consolidada.codigo_legado || '').trim();
              const nextCod = String(lista[i].codigo_legado || '').trim();
              const maxAcum = Math.max(
                Number(consolidada.valor_acumulado_actual || 0),
                Number(lista[i].valor_acumulado_actual || 0)
              );
              consolidada = fusionarRegistrosDuplicados(consolidada, lista[i]);
              if (prevCod && nextCod && prevCod.localeCompare(nextCod, undefined, { numeric: true }) < 0) {
                consolidada.codigo_legado = prevCod;
              }
              if (maxAcum > 0) {
                consolidada.valor_acumulado_actual = maxAcum;
              }
            }
            for (const item of lista) {
              if (item.id && item.id !== consolidada.id) {
                metasIdsEliminar.push(String(item.id));
                idRedirectMap.set(String(item.id), String(consolidada.id));
              }
            }
            metasConsolidadas.push(consolidada);
          }
        });

        if (metasIdsEliminar.length > 0) {
          await db.metas_planes.bulkDelete(metasIdsEliminar);
          totalEliminados += metasIdsEliminar.length;
        }
        if (metasConsolidadas.length > 0) {
          await db.metas_planes.bulkPut(metasConsolidadas);
        }
      }
    }

    // Reconciliar referencias huérfanas y deduplicar planes_accion_hitos y habitos_metas_vinculos
    if (db.planes_accion_hitos && typeof db.planes_accion_hitos.toArray === 'function') {
      const hitosPlanRaw = await db.planes_accion_hitos.toArray();
      if (hitosPlanRaw && hitosPlanRaw.length > 0) {
        const gruposHitosPlan = new Map<string, HitoPlanRecord[]>();
        const hitosPlanModificados: HitoPlanRecord[] = [];

        for (const hp of hitosPlanRaw) {
          const nuevoMetaId = idRedirectMap.get(hp.meta_id) || hp.meta_id;
          const itemActualizado = nuevoMetaId !== hp.meta_id ? { ...hp, meta_id: nuevoMetaId } : hp;
          if (nuevoMetaId !== hp.meta_id) {
            hitosPlanModificados.push(itemActualizado);
          }
          const clave = `${String(itemActualizado.meta_id).trim().toUpperCase()}::${String(
            itemActualizado.titulo_hito || itemActualizado.codigo_legado || itemActualizado.id
          ).trim().toUpperCase()}`;
          if (!gruposHitosPlan.has(clave)) gruposHitosPlan.set(clave, []);
          gruposHitosPlan.get(clave)!.push(itemActualizado);
        }

        const hitosPlanEliminar: string[] = [];
        gruposHitosPlan.forEach((lista) => {
          if (lista.length > 1) {
            let ganador = lista[0];
            for (let i = 1; i < lista.length; i++) {
              ganador = fusionarRegistrosDuplicados(ganador, lista[i]);
            }
            for (const item of lista) {
              if (item.id && item.id !== ganador.id) {
                hitosPlanEliminar.push(String(item.id));
              }
            }
            hitosPlanModificados.push(ganador);
          }
        });

        if (hitosPlanEliminar.length > 0) {
          await db.planes_accion_hitos.bulkDelete(hitosPlanEliminar);
          totalEliminados += hitosPlanEliminar.length;
        }
        if (hitosPlanModificados.length > 0) {
          await db.planes_accion_hitos.bulkPut(hitosPlanModificados);
        }
      }
    }

    if (db.habitos_metas_vinculos && typeof db.habitos_metas_vinculos.toArray === 'function') {
      const vinculosRaw = await db.habitos_metas_vinculos.toArray();
      if (vinculosRaw && vinculosRaw.length > 0) {
        const gruposVinculos = new Map<string, HabitoMetaVinculo[]>();
        const vinculosModificados: HabitoMetaVinculo[] = [];

        for (const v of vinculosRaw) {
          const nuevoMetaId = idRedirectMap.get(v.meta_id) || v.meta_id;
          const nuevoHabitoId = idRedirectMap.get(v.habito_id) || v.habito_id;
          const itemActualizado =
            nuevoMetaId !== v.meta_id || nuevoHabitoId !== v.habito_id
              ? { ...v, meta_id: nuevoMetaId, habito_id: nuevoHabitoId }
              : v;
          if (nuevoMetaId !== v.meta_id || nuevoHabitoId !== v.habito_id) {
            vinculosModificados.push(itemActualizado);
          }
          const clave = `${String(itemActualizado.meta_id).trim().toUpperCase()}::${String(
            itemActualizado.habito_id
          ).trim().toUpperCase()}`;
          if (!gruposVinculos.has(clave)) gruposVinculos.set(clave, []);
          gruposVinculos.get(clave)!.push(itemActualizado);
        }

        const vinculosEliminar: string[] = [];
        gruposVinculos.forEach((lista) => {
          if (lista.length > 1) {
            let ganador = lista[0];
            for (let i = 1; i < lista.length; i++) {
              ganador = fusionarRegistrosDuplicados(ganador, lista[i]);
            }
            for (const item of lista) {
              if (item.id && item.id !== ganador.id) {
                vinculosEliminar.push(String(item.id));
              }
            }
            vinculosModificados.push(ganador);
          }
        });

        if (vinculosEliminar.length > 0) {
          await db.habitos_metas_vinculos.bulkDelete(vinculosEliminar);
          totalEliminados += vinculosEliminar.length;
        }
        if (vinculosModificados.length > 0) {
          await db.habitos_metas_vinculos.bulkPut(vinculosModificados);
        }
      }
    }

    // 2. Reconciliación relacional de códigos legados (UUID Supabase -> PRO-XXX / WP-XXX)
    const [proyectosActuales, hitosActuales, tareasActuales] = await Promise.all([
      db.proyectos.toArray(),
      db.hitos_wbs.toArray(),
      db.tareas.toArray()
    ]);

    const proyUuidToCod = new Map<string, string>();
    proyectosActuales.forEach((p: any) => {
      const pId = String(p.id || '').trim().toUpperCase();
      const pCod = String(p.codigo_legado || p.ID_Proyecto || '').trim().toUpperCase();
      if (pId && pCod) {
        proyUuidToCod.set(pId, pCod);
        proyUuidToCod.set(pCod, pCod);
      }
    });

    const hitoUuidToCod = new Map<string, string>();
    const hitosModificados: HitoWbsRecord[] = [];

    hitosActuales.forEach((h: any) => {
      const hId = String(h.id || '').trim().toUpperCase();
      const hCod = String(h.codigo_legado || h.ID_Hito || h.ID_Elemento_WBS || '').trim().toUpperCase();
      if (hId && hCod) {
        hitoUuidToCod.set(hId, hCod);
        hitoUuidToCod.set(hCod, hCod);
      }

      let mutado = false;
      const copia = { ...h };
      const rawProyRef = String(copia.proyecto_id || copia.ID_Proyecto || '').trim().toUpperCase();
      const resolvedProyCod = proyUuidToCod.get(rawProyRef);

      if (resolvedProyCod && !copia.proyecto_codigo) {
        copia.proyecto_codigo = resolvedProyCod;
        mutado = true;
      }

      // Armonizar columnas de Supabase (peso_ponderado_pct -> peso_pct, fecha_limite_plan -> fecha_limite)
      if (copia.peso_pct === undefined && copia.peso_ponderado_pct !== undefined) {
        const rawPeso = Number(copia.peso_ponderado_pct) || 0;
        copia.peso_pct = rawPeso > 1 ? rawPeso / 100 : rawPeso;
        mutado = true;
      }
      if (!copia.fecha_limite && copia.fecha_limite_plan) {
        copia.fecha_limite = copia.fecha_limite_plan;
        mutado = true;
      }
      if (!copia.criterio_dod && copia.criterio_aceptacion_dod) {
        copia.criterio_dod = copia.criterio_aceptacion_dod;
        mutado = true;
      }
      if (!copia.entregable_link && copia.entregable_verificable_link) {
        copia.entregable_link = copia.entregable_verificable_link;
        mutado = true;
      }

      if (mutado) {
        hitosModificados.push(copia);
      }
    });

    if (hitosModificados.length > 0) {
      await db.hitos_wbs.bulkPut(hitosModificados);
    }

    const tareasModificadas: TareaRecord[] = [];
    tareasActuales.forEach((t: any) => {
      let mutado = false;
      const copia = { ...t };

      const rawProyRef = String(copia.proyecto_codigo || copia.proyecto_id || copia.ID_Proyecto || '').trim().toUpperCase();
      const resolvedProyCod = proyUuidToCod.get(rawProyRef);
      if (resolvedProyCod && copia.proyecto_codigo !== resolvedProyCod) {
        copia.proyecto_codigo = resolvedProyCod;
        mutado = true;
      }

      const rawHitoRef = String(copia.hito_codigo || copia.hito_id || copia.id_hito || copia.ID_Hito || '').trim().toUpperCase();
      const resolvedHitoCod = hitoUuidToCod.get(rawHitoRef);
      if (resolvedHitoCod && copia.hito_codigo !== resolvedHitoCod) {
        copia.hito_codigo = resolvedHitoCod;
        mutado = true;
      }

      if (!copia.agendado_calendar && copia.agendado_en_calendar) {
        copia.agendado_calendar = copia.agendado_en_calendar;
        mutado = true;
      }

      if (mutado) {
        tareasModificadas.push(copia);
      }
    });

    if (tareasModificadas.length > 0) {
      await db.tareas.bulkPut(tareasModificadas);
    }
  } catch (err) {
    console.warn('[PMO DB] Saneamiento de duplicados omitido parcialmente:', err);
  }

  return totalEliminados;
}

/**
 * Función utilitaria para forzar la rehidratación completa de los registros desde initialSeed.json
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
    db.cuotas,
    db.metas_planes,
    db.planes_accion_hitos,
    db.habitos_metas_vinculos,
    db.habito_cumplimiento_logs
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
    await db.metas_planes.clear();
    await db.planes_accion_hitos.clear();
    await db.habitos_metas_vinculos.clear();
    await db.habito_cumplimiento_logs.clear();

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
    if ((initialSeed as any).metas_planes) await db.metas_planes.bulkPut((initialSeed as any).metas_planes as MetaPlanRecord[]);
    if ((initialSeed as any).planes_accion_hitos) await db.planes_accion_hitos.bulkPut((initialSeed as any).planes_accion_hitos as HitoPlanRecord[]);
    if ((initialSeed as any).habitos_metas_vinculos) await db.habitos_metas_vinculos.bulkPut((initialSeed as any).habitos_metas_vinculos as HabitoMetaVinculo[]);
    if ((initialSeed as any).habito_cumplimiento_logs) await db.habito_cumplimiento_logs.bulkPut((initialSeed as any).habito_cumplimiento_logs as HabitoLogRecord[]);
  });
}

// Exposición en runtime para depuración en modo desarrollo
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__PMO_DB__ = db;
  (window as any).__FORZAR_RECARGA_SEMILLA__ = forzarRecargaSemillaCompleta;
}

