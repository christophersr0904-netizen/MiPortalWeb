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
  editarActividadConAlcance
} from '../services/habitosService';
import { syncManager, type SyncState } from '../services/syncManager';

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
      }

      if (meta) {
        if (hId) mapa.set(hId, meta);
        if (hCod) mapa.set(hCod, meta);
      }
    }

    return mapa;
  }, [vinculos, metasPlanes, todasLasActividades]);

  // Mapeo O(1) de actividades y tareas asociadas a cada hábito
  const actividadesPorHabitoId = useMemo(() => {
    const map = new Map<string, Array<ActividadPersonal | TareaRecord>>();

    // Diccionario de lookup para mapear IDs y códigos de hábitos
    const mapaHabitos = new Map<string, ActividadPersonal>();
    for (const h of todasLasActividades) {
      if (h.id) mapaHabitos.set(String(h.id), h);
      if (h.codigo_legado) mapaHabitos.set(String(h.codigo_legado), h);
    }

    // 1. Actividades personales secundarias que referencian a un hábito contenedor
    for (const act of todasLasActividades) {
      const parentId = String(
        (act as any).habitoId ||
        (act as any).habito_id ||
        (act as any).id_habito ||
        (act as any).actividad_padre_id ||
        ''
      ).trim();

      if (parentId && parentId !== String(act.id) && parentId !== String(act.codigo_legado)) {
        if (!map.has(parentId)) map.set(parentId, []);
        if (!map.get(parentId)!.some((item) => String(item.id) === String(act.id))) {
          map.get(parentId)!.push(act);
        }

        const hab = mapaHabitos.get(parentId);
        if (hab) {
          const altKey = String(hab.id) === parentId ? String(hab.codigo_legado) : String(hab.id);
          if (altKey && altKey !== parentId) {
            if (!map.has(altKey)) map.set(altKey, []);
            if (!map.get(altKey)!.some((item) => String(item.id) === String(act.id))) {
              map.get(altKey)!.push(act);
            }
          }
        }
      }
    }

    // 2. Tareas de proyectos que referencian a un hábito motor
    for (const tar of todasLasTareas) {
      const parentId = String(
        (tar as any).habitoId ||
        (tar as any).habito_id ||
        (tar as any).id_habito ||
        (tar as any).habito_codigo ||
        ''
      ).trim();

      if (parentId) {
        if (!map.has(parentId)) map.set(parentId, []);
        if (!map.get(parentId)!.some((item) => String(item.id) === String(tar.id))) {
          map.get(parentId)!.push(tar);
        }

        const hab = mapaHabitos.get(parentId);
        if (hab) {
          const altKey = String(hab.id) === parentId ? String(hab.codigo_legado) : String(hab.id);
          if (altKey && altKey !== parentId) {
            if (!map.has(altKey)) map.set(altKey, []);
            if (!map.get(altKey)!.some((item) => String(item.id) === String(tar.id))) {
              map.get(altKey)!.push(tar);
            }
          }
        }
      }
    }

    // 3. Hábitos que contienen una lista explícita de actividadIds o tareaIds
    for (const h of todasLasActividades) {
      const hId = String(h.id);
      const hCod = String(h.codigo_legado);
      const listaIds = (h as any).actividadIds || (h as any).actividad_ids || (h as any).actividades_ids || (h as any).tareaIds;
      if (Array.isArray(listaIds) && listaIds.length > 0) {
        const idSet = new Set(listaIds.map((x: any) => String(x).trim()));

        // Buscar en todasLasActividades
        for (const act of todasLasActividades) {
          if (String(act.id) === hId || String(act.codigo_legado) === hCod) continue;
          if (idSet.has(String(act.id)) || idSet.has(String(act.codigo_legado))) {
            if (!map.has(hId)) map.set(hId, []);
            if (!map.get(hId)!.some((item) => String(item.id) === String(act.id))) {
              map.get(hId)!.push(act);
            }
            if (hCod) {
              if (!map.has(hCod)) map.set(hCod, []);
              if (!map.get(hCod)!.some((item) => String(item.id) === String(act.id))) {
                map.get(hCod)!.push(act);
              }
            }
          }
        }

        // Buscar en todasLasTareas
        for (const tar of todasLasTareas) {
          if (idSet.has(String(tar.id)) || idSet.has(String(tar.codigo_legado))) {
            if (!map.has(hId)) map.set(hId, []);
            if (!map.get(hId)!.some((item) => String(item.id) === String(tar.id))) {
              map.get(hId)!.push(tar);
            }
            if (hCod) {
              if (!map.has(hCod)) map.set(hCod, []);
              if (!map.get(hCod)!.some((item) => String(item.id) === String(tar.id))) {
                map.get(hCod)!.push(tar);
              }
            }
          }
        }
      }
    }

    return map;
  }, [todasLasActividades, todasLasTareas]);

  // Selector seguro para obtener actividades vinculadas por ID o código
  const obtenerActividadesDeHabito = (habitoId: string | number): Array<ActividadPersonal | TareaRecord> => {
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
        const nom = a.nombre_actividad.toLowerCase();
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
      const aId = String(a.id);
      const aCod = String(a.codigo_legado);
      const actVinc = actividadesPorHabitoId.get(aId) || (aCod ? actividadesPorHabitoId.get(aCod) : []) || [];
      const metaVinc = metasPorHabitoId.get(aId) || (aCod ? metasPorHabitoId.get(aCod) : undefined);
      return {
        ...a,
        actividadesVinculadas: actVinc,
        metaVinculada: metaVinc
      };
    });
  }, [actividadesFiltradas, actividadesPorHabitoId, metasPorHabitoId]);

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
