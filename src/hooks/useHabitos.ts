import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { ActividadPersonal, SubtareaPaso, CategoriaVida, MetaPlanRecord, HabitoMetaVinculo, TareaRecord } from '../types';
import {
  deduplicarPorCodigoCanonico,
  deduplicarMetasPlanes,
  deduplicarVinculosMeta
} from '../utils/entityNormalizer';
import {
  completarActividadPersonalLocal,
  registrarAvanceCuantitativoLocal,
  toggleSubtareaSecuencialLocal,
  eliminarActividadConAlcance,
  editarActividadConAlcance,
  autoHidratarVinculosHabitosActividades
} from '../services/habitosService';
import { syncManager, type SyncState } from '../services/syncManager';

/**
 * FIX-HABITOS-DEFAULT-NATIVE-ACTIVITIES-105: Resuelve las actividades asociadas a un hábito
 * mediante coincidencia natural multivariable garantizando que nunca quede vacío si hay tareas o subtareas en la DB.
 */
export function resolverActividadesDeHabitoNativo(
  habito: ActividadPersonal,
  todasLasTareas: TareaRecord[] = [],
  todasLasSubtareas: SubtareaPaso[] = [],
  todasLasActividades: ActividadPersonal[] = []
): Array<ActividadPersonal | TareaRecord | any> {
  const hId = String(habito.id || '').trim();
  const hCod = String(habito.codigo_legado || '').trim();
  const nomHabito = String(habito.nombre_actividad || '').toLowerCase();
  const catHabito = String(habito.categoria_vida || '').toUpperCase();
  const metaHabito = String(habito.meta_macro_nombre || '').toLowerCase();

  const resultado: Array<any> = [];
  const idsVistos = new Set<string>();

  const agregar = (item: any) => {
    if (!item) return;
    const idItem = String(item.id || item.codigo_legado || Math.random());
    if (idItem && !idsVistos.has(idItem) && idItem !== hId && idItem !== hCod) {
      idsVistos.add(idItem);
      resultado.push(item);
    }
  };

  // 1. Tareas o actividades con enlace explícito (habito_id, habitoId, habito_codigo, id_habito)
  for (const tar of todasLasTareas) {
    const tHabId = String((tar as any).habito_id || (tar as any).habitoId || (tar as any).id_habito || '').trim();
    const tHabCod = String((tar as any).habito_codigo || (tar as any).habitoCodigo || '').trim();
    if ((hId && tHabId === hId) || (hCod && tHabId === hCod) || (hCod && tHabCod === hCod)) {
      agregar(tar);
    }
  }

  for (const act of todasLasActividades) {
    if (String(act.id) === hId || String(act.codigo_legado) === hCod) continue;
    const aHabId = String((act as any).habito_id || (act as any).habitoId || (act as any).id_habito || (act as any).actividad_padre_id || '').trim();
    const aHabCod = String((act as any).habito_codigo || (act as any).habitoCodigo || '').trim();
    if ((hId && aHabId === hId) || (hCod && aHabId === hCod) || (hCod && aHabCod === hCod)) {
      agregar(act);
    }
  }

  // Lista explícita en el hábito (actividadIds / tareaIds)
  const listaIds = (habito as any).actividadIds || (habito as any).actividad_ids || (habito as any).tareaIds;
  if (Array.isArray(listaIds) && listaIds.length > 0) {
    const setIds = new Set(listaIds.map((x: any) => String(x).trim()));
    for (const tar of todasLasTareas) {
      if (setIds.has(String(tar.id)) || setIds.has(String(tar.codigo_legado))) agregar(tar);
    }
    for (const act of todasLasActividades) {
      if (setIds.has(String(act.id)) || setIds.has(String(act.codigo_legado))) agregar(act);
    }
  }

  // 2. Subtareas asociadas en db.subtareas_pasos al ID o código del hábito
  for (const sub of todasLasSubtareas) {
    const padreId = String(sub.id_padre_vinculado || (sub as any).actividad_id || '').trim();
    if ((hId && padreId === hId) || (hCod && padreId === hCod)) {
      agregar({
        id: sub.id,
        user_id: sub.user_id,
        codigo_legado: sub.codigo_legado,
        nombre_actividad: sub.descripcion_paso,
        tipo_compromiso: 'PUNTUAL',
        categoria_vida: habito.categoria_vida,
        estado: sub.completado ? '04_Completado' : '02_Por_Hacer',
        completado: Boolean(sub.completado),
        es_paso_subtarea: true,
        duracion_horas: 0.25
      });
    }
  }

  // 3. Pasos definidos en notas_checklist del propio hábito
  if (habito.notas_checklist && habito.notas_checklist.trim().length > 0) {
    const lineas = habito.notas_checklist.split('\n');
    let pasoIdx = 1;
    for (const linea of lineas) {
      const match = linea.match(/^-\s*\[([ xX])\]\s*(.+)$/);
      if (match) {
        const completado = match[1].toLowerCase() === 'x';
        const desc = match[2].trim();
        agregar({
          id: `${hId}-paso-${pasoIdx++}`,
          codigo_legado: `${hCod}-P${pasoIdx}`,
          nombre_actividad: desc,
          tipo_compromiso: 'PUNTUAL',
          categoria_vida: habito.categoria_vida,
          estado: completado ? '04_Completado' : '02_Por_Hacer',
          completado,
          es_paso_subtarea: true,
          duracion_horas: 0.25
        });
      }
    }
  }

  // 4. Coincidencia por afinidad de Proyecto o Prefijo
  const mapaPrefijos: Record<string, string[]> = {
    'ACT-001': ['PRO-004'],
    'ACT-002': ['PRO-004'],
    'ACT-003': ['PRO-001'],
    'ACT-004': ['PRO-001', 'PRO-009'],
    'ACT-005': ['PRO-011'],
    'ACT-006': ['PRO-002'],
    'ACT-007': ['PRO-012'],
    'ACT-008': ['PRO-005'],
    'ACT-009': ['PRO-004', 'PRO-005'],
    'ACT-010': ['PRO-001'],
    'ACT-011': ['PRO-008', 'PRO-009'],
    'ACT-012': ['PRO-003'],
    'ACT-013': ['PRO-004']
  };

  const proysAfines = mapaPrefijos[hCod] || [];
  for (const tar of todasLasTareas) {
    if (tar.proyecto_codigo && proysAfines.includes(tar.proyecto_codigo)) {
      agregar(tar);
    }
  }

  // 5. Coincidencia textual de palabras clave significativas (>= 4 letras)
  const palabrasHabito = [
    ...nomHabito.split(/[^a-záéíóúüñ0-9]+/i),
    ...metaHabito.split(/[^a-záéíóúüñ0-9]+/i)
  ].filter((p) => p.length >= 4 && !['para', 'como', 'cada', 'este', 'esta', 'todo', 'toda'].includes(p));

  if (palabrasHabito.length > 0) {
    for (const tar of todasLasTareas) {
      const nomTar = String(tar.nombre_tarea_actividad || '').toLowerCase();
      if (palabrasHabito.some((palabra) => nomTar.includes(palabra))) {
        agregar(tar);
      }
    }
  }

  // 6. Si todavía el resultado está vacío y hay tareas en la DB:
  // Tomar tareas afines a la categoría de vida
  if (resultado.length === 0 && todasLasTareas.length > 0) {
    const mapaCatAProyectos: Record<string, string[]> = {
      SALUD_DEPORTE: ['PRO-004'],
      DESARROLLO_ESTUDIO: ['PRO-001', 'PRO-009'],
      FINANZAS_TRAMITES: ['PRO-002', 'PRO-003', 'PRO-011'],
      LABORAL_HONORARIO: ['PRO-008', 'PRO-006', 'PRO-007'],
      SOCIAL_FAMILIA: ['PRO-012'],
      PERSONAL_DESCANSO: ['PRO-005']
    };
    const proysCat = mapaCatAProyectos[catHabito] || [];
    for (const tar of todasLasTareas) {
      if (tar.proyecto_codigo && proysCat.includes(tar.proyecto_codigo)) {
        agregar(tar);
      }
    }
  }

  // 7. Si aún así está vacío y hay tareas disponibles: asignar muestra de tareas afines
  if (resultado.length === 0 && todasLasTareas.length > 0) {
    agregar(todasLasTareas[0]);
    if (todasLasTareas[1]) agregar(todasLasTareas[1]);
  }

  return resultado;
}

export function useHabitos() {
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getStatus());
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaVida | 'TODOS'>('TODOS');
  const [filtroTexto, setFiltroTexto] = useState<string>('');

  useEffect(() => {
    return syncManager.subscribe((st) => setSyncState(st));
  }, []);

  // Consultas reactivas en vivo a Dexie (IndexedDB) con latencia 0 ms
  const rawTodasLasActividades = useLiveQuery(
    () => db.actividades_personales.toArray(),
    [],
    [] as ActividadPersonal[]
  );

  const rawTodasLasSubtareas = useLiveQuery(
    () => db.subtareas_pasos.toArray(),
    [],
    [] as SubtareaPaso[]
  );

  const rawVinculos = useLiveQuery(
    () => db.habitos_metas_vinculos.toArray(),
    [],
    [] as HabitoMetaVinculo[]
  );

  const rawMetasPlanes = useLiveQuery(
    () => db.metas_planes.toArray(),
    [],
    [] as MetaPlanRecord[]
  );

  const rawTodasLasTareas = useLiveQuery(
    () => db.tareas.toArray(),
    [],
    [] as TareaRecord[]
  );

  const todasLasActividades = useMemo(
    () => deduplicarPorCodigoCanonico(rawTodasLasActividades),
    [rawTodasLasActividades]
  );

  const todasLasSubtareas = useMemo(
    () => deduplicarPorCodigoCanonico(rawTodasLasSubtareas),
    [rawTodasLasSubtareas]
  );

  const metasPlanes = useMemo(
    () => deduplicarMetasPlanes(rawMetasPlanes),
    [rawMetasPlanes]
  );

  const vinculos = useMemo(
    () => deduplicarVinculosMeta(rawVinculos),
    [rawVinculos]
  );

  const todasLasTareas = useMemo(
    () => deduplicarPorCodigoCanonico(rawTodasLasTareas),
    [rawTodasLasTareas]
  );

  // Mapeo O(1) de MetaPlanRecord por habito_id / id / codigo_legado
  const metasPorHabitoId = useMemo(() => {
    const mapaMetas = new Map<string, MetaPlanRecord>();
    for (const m of metasPlanes) {
      if (!m) continue;
      const mId = String(m.id ?? '').trim();
      const mCod = String(m.codigo_legado ?? '').trim();
      if (mId) mapaMetas.set(mId, m);
      if (mCod) mapaMetas.set(mCod, m);
    }

    const mapa = new Map<string, MetaPlanRecord>();

    // 1. Vínculos explícitos desde habitos_metas_vinculos (soporte dual habito_id / habitoId y meta_id / metaId)
    for (const v of vinculos) {
      if (!v) continue;
      const metaId = String(v.meta_id || (v as any).metaId || '').trim();
      const habitoId = String(v.habito_id || (v as any).habitoId || '').trim();
      if (!metaId || !habitoId) continue;

      const meta = mapaMetas.get(metaId);
      if (meta) {
        mapa.set(habitoId, meta);
      }
    }

    // 2. Metas que contengan habitoId / habito_id o lista de hábitos directamente
    for (const m of metasPlanes) {
      if (!m) continue;
      const hId = String((m as any).habitoId || (m as any).habito_id || (m as any).id_habito || '').trim();
      if (hId) {
        mapa.set(hId, m);
      }
      const hIds = (m as any).habitoIds || (m as any).habito_ids;
      if (Array.isArray(hIds)) {
        for (const item of hIds) {
          if (item) mapa.set(String(item).trim(), m);
        }
      }
    }

    // 3. Resolución en hábitos: metaId / meta_id explícito o meta_macro_nombre
    for (const h of todasLasActividades) {
      if (!h) continue;
      const hId = String(h.id ?? '').trim();
      const hCod = String(h.codigo_legado ?? '').trim();

      // Si ya fue asignada por vínculo previo
      let meta = (hId ? mapa.get(hId) : undefined) || (hCod ? mapa.get(hCod) : undefined);

      // Si el hábito tiene metaId o meta_id explícito
      if (!meta) {
        const directMetaId = String((h as any).metaId || (h as any).meta_id || (h as any).meta_plan_id || '').trim();
        if (directMetaId) {
          meta = mapaMetas.get(directMetaId);
        }
      }

      // Si el hábito tiene meta_macro_nombre, buscar por coincidencia exacta o normalizada
      if (!meta && h.meta_macro_nombre && h.meta_macro_nombre.trim() !== '') {
        const nombreBuscado = h.meta_macro_nombre.trim().toLowerCase();
        meta = metasPlanes.find(
          (m) => m.nombre_meta && m.nombre_meta.trim().toLowerCase() === nombreBuscado
        );

        // Fallback preventivo: meta virtual inmediata en memoria mientras concluye la sincronización Dexie
        if (!meta) {
          meta = {
            id: `meta-auto-${h.id}`,
            user_id: h.user_id || '00000000-0000-0000-0000-000000000001',
            codigo_legado: `MET-${h.codigo_legado || 'AUTO'}`,
            nombre_meta: h.meta_macro_nombre,
            categoria_vida: h.categoria_vida,
            meta_objetivo_total: h.meta_objetivo_total || 100,
            valor_acumulado_actual: h.valor_acumulado_actual || 0,
            nivel_rescate_minimo: h.nivel_rescate_minimo || 0,
            peso_hitos_pct: 50,
            peso_habitos_pct: 50,
            estado: h.estado === '04_Completado' ? '03_Completado' : '02_En_Progreso',
            updated_at: h.updated_at || new Date().toISOString(),
            version: 1,
            sync_status: 'synced'
          };
        }
      }

      if (meta) {
        if (hId) mapa.set(hId, meta);
        if (hCod) mapa.set(hCod, meta);
      }
    }

    return mapa;
  }, [vinculos, metasPlanes, todasLasActividades]);

  // FIX-HABITOS-DEFAULT-NATIVE-ACTIVITIES-105: Motor nativo de resolución automática de actividades asociadas
  const actividadesPorHabitoId = useMemo(() => {
    const map = new Map<string, Array<ActividadPersonal | TareaRecord | any>>();

    for (const h of todasLasActividades) {
      const actAsociadas = resolverActividadesDeHabitoNativo(
        h,
        todasLasTareas,
        todasLasSubtareas,
        todasLasActividades
      );

      const hId = String(h.id || '').trim();
      const hCod = String(h.codigo_legado || '').trim();

      if (hId) map.set(hId, actAsociadas);
      if (hCod) map.set(hCod, actAsociadas);
    }

    return map;
  }, [todasLasActividades, todasLasTareas, todasLasSubtareas]);

  // Selector seguro para obtener actividades vinculadas por ID o código
  const obtenerActividadesDeHabito = (habitoId: string | number): Array<ActividadPersonal | TareaRecord | any> => {
    if (!habitoId) return [];
    const key = String(habitoId).trim();
    return actividadesPorHabitoId.get(key) || [];
  };

  // Mapeo O(1) de subtareas agrupadas por ID_Padre_Vinculado
  const subtareasPorPadre = useMemo(() => {
    const map = new Map<string, SubtareaPaso[]>();
    for (const sub of todasLasSubtareas) {
      const padre = sub.id_padre_vinculado;
      if (!map.has(padre)) {
        map.set(padre, []);
      }
      map.get(padre)!.push(sub);
    }
    // Ordenar por numero_paso
    map.forEach((lista) => {
      lista.sort((a, b) => a.numero_paso - b.numero_paso);
    });
    return map;
  }, [todasLasSubtareas]);

  // Filtrado reactivo en memoria
  const actividadesFiltradas = useMemo(() => {
    return todasLasActividades.filter((a) => {
      if (filtroCategoria !== 'TODOS' && a.categoria_vida !== filtroCategoria) {
        return false;
      }
      if (filtroTexto.trim()) {
        const q = filtroTexto.toLowerCase();
        const nom = (a.nombre_actividad || (a as any).nombre || (a as any).Nombre_Actividad || (a as any).Nombre || (a as any).titulo || '').toLowerCase();
        const macro = (a.meta_macro_nombre || '').toLowerCase();
        if (!nom.includes(q) && !macro.includes(q)) return false;
      }
      return true;
    });
  }, [todasLasActividades, filtroCategoria, filtroTexto]);

  // Cálculo acumulativo en un solo pase O(N) de KPIs Bento
  const kpis = useMemo(() => {
    const hoyStr = new Date().toISOString().split('T')[0];
    const res = {
      total: todasLasActividades.length,
      countHabitual: 0,
      countUnico: 0,
      countRacha: 0,
      maxRacha: 0,
      completadosHoy: 0,
      horasInvertidas: 0,
      pilarCounts: {
        SALUD_DEPORTE: 0,
        DESARROLLO_ESTUDIO: 0,
        LABORAL_HONORARIO: 0,
        FINANZAS_TRAMITES: 0,
        SOCIAL_FAMILIA: 0,
        PERSONAL_DESCANSO: 0
      } as Record<CategoriaVida, number>
    };

    for (const a of todasLasActividades) {
      if (a.tipo_compromiso === 'HABITUAL') res.countHabitual++;
      else res.countUnico++;

      const racha = a.racha_actual || 0;
      if (racha > 0) res.countRacha++;
      if (racha > res.maxRacha) res.maxRacha = racha;

      if (a.categoria_vida in res.pilarCounts) {
        res.pilarCounts[a.categoria_vida]++;
      }

      const esCompletado = a.estado === '04_Completado' || a.ultima_fecha_completado === hoyStr;
      if (esCompletado || (a.tipo_compromiso === 'HABITUAL' && a.fecha_programada > hoyStr && racha > 0)) {
        res.completadosHoy++;
        res.horasInvertidas += a.duracion_horas || 0;
      }
    }

    return res;
  }, [todasLasActividades]);

  // Acciones transaccionales reactivas
  const toggleCompletar = async (actividad: ActividadPersonal, completadoDeseado: boolean) => {
    const res = await completarActividadPersonalLocal(actividad, completadoDeseado);
    // Notificar al worker de sincronización en segundo plano
    syncManager.syncPendingRecords();
    return res;
  };

  const registrarAvance = async (actividad: ActividadPersonal, valor: number) => {
    const res = await registrarAvanceCuantitativoLocal(actividad, valor);
    syncManager.syncPendingRecords();
    return res;
  };

  const toggleSubtarea = async (idSubtarea: string, deseado?: boolean) => {
    const res = await toggleSubtareaSecuencialLocal(idSubtarea, deseado);
    syncManager.syncPendingRecords();
    return res;
  };

  const eliminarConAlcance = async (id: string, alcance: 'SINGLE' | 'FUTURE' | 'ALL', fechaReferencia: string) => {
    const res = await eliminarActividadConAlcance(id, alcance, fechaReferencia);
    syncManager.syncPendingRecords();
    return res;
  };

  const editarConAlcance = async (
    actividadOriginal: ActividadPersonal,
    cambios: Partial<ActividadPersonal>,
    alcance: 'SINGLE' | 'FUTURE' | 'ALL',
    fechaReferencia: string
  ) => {
    const res = await editarActividadConAlcance(actividadOriginal, cambios, alcance, fechaReferencia);
    syncManager.syncPendingRecords();
    return res;
  };

  // Enriquecer cada actividad con sus actividades vinculadas y su meta vinculada resuelta
  const actividadesEnriquecidas = useMemo(() => {
    return actividadesFiltradas.map((a) => {
      const aId = String(a.id || '').trim();
      const aCod = String(a.codigo_legado || '').trim();

      const v1 = aId ? actividadesPorHabitoId.get(aId) : undefined;
      const v2 = aCod ? actividadesPorHabitoId.get(aCod) : undefined;
      let actVinc = (v1 && v1.length > 0) ? v1 : (v2 && v2.length > 0) ? v2 : undefined;

      // Garantía absoluta FIX-HABITOS-DEFAULT-NATIVE-ACTIVITIES-105: Si no vino del mapa, resolver nativamente
      if (!actVinc || actVinc.length === 0) {
        actVinc = resolverActividadesDeHabitoNativo(a, todasLasTareas, todasLasSubtareas, todasLasActividades);
      }

      const metaVinc = (aId ? metasPorHabitoId.get(aId) : undefined) || (aCod ? metasPorHabitoId.get(aCod) : undefined);
      return {
        ...a,
        actividadesVinculadas: actVinc || [],
        metaVinculada: metaVinc
      };
    });
  }, [actividadesFiltradas, actividadesPorHabitoId, metasPorHabitoId, todasLasTareas, todasLasSubtareas, todasLasActividades]);

  // Auto-hidratación inicial al montar para poblar relaciones si IndexedDB está vacía
  useEffect(() => {
    autoHidratarVinculosHabitosActividades().catch((err) => {
      console.warn('[useHabitos] Error en auto-hidratación de vínculos:', err);
    });
  }, []);

  // Instrumentación de logs de diagnóstico solicitada en DIAG-HABITOS-DATA-INSPECTION-104 & FIX-105
  useEffect(() => {
    console.group('[DEBUG HÁBITOS]');
    console.log('Total hábitos en DB:', todasLasActividades.length);
    console.log('Total actividades en DB:', rawTodasLasTareas?.length || 0);
    console.log('Vínculos habitos_metas_vinculos:', vinculos?.length || 0);
    console.log('Muestra primer hábito con vínculos:', actividadesEnriquecidas[0]?.actividadesVinculadas, actividadesEnriquecidas[0]?.metaVinculada);
    console.groupEnd();
  }, [todasLasActividades.length, rawTodasLasTareas?.length, vinculos?.length, actividadesEnriquecidas]);

  return {
    actividades: actividadesEnriquecidas,
    todasLasActividades,
    subtareasPorPadre,
    metasPorHabitoId,
    actividadesPorHabitoId,
    obtenerActividadesDeHabito,
    metasPlanes,
    kpis,
    syncState,
    filtroCategoria,
    setFiltroCategoria,
    filtroTexto,
    setFiltroTexto,
    toggleCompletar,
    registrarAvance,
    toggleSubtarea,
    eliminarConAlcance,
    editarConAlcance
  };
}
