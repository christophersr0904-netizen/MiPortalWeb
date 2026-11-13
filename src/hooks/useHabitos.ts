import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { ActividadPersonal, SubtareaPaso, CategoriaVida, MetaPlanRecord, TareaRecord } from '../types';
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
  autoHidratarVinculosHabitosActividades,
  formatFechaIsoLocal,
  esActividadCompletadaHoy
} from '../services/habitosService';
import { syncManager, type SyncState } from '../services/syncManager';

// Bandera global para evitar ciclos de hidratación redundantes en IndexedDB
let autoHidratacionEjecutadaGlobal = false;

/**
 * FIX-HABITOS-HIERARCHY-DECOUPLING-108: Resuelve exclusivamente subtareas reales o pasos procedurales
 * vinculados a un hábito. NUNCA subyuga ni absorbe otras ActividadPersonal ni tareas principales completas.
 */
export function resolverActividadesDeHabitoNativo(
  habito: ActividadPersonal,
  _todasLasTareas: TareaRecord[] = [],
  todasLasSubtareas: SubtareaPaso[] = [],
  _todasLasActividades: ActividadPersonal[] = []
): Array<SubtareaPaso | any> {
  const hId = String(habito.id || '').trim();
  const hCod = String(habito.codigo_legado || '').trim();

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

  // 1. Subtareas reales asociadas en db.subtareas_pasos al ID o código del hábito
  for (const sub of todasLasSubtareas) {
    const padreId = String(sub.id_padre_vinculado || (sub as any).actividad_id || '').trim();
    if ((hId && padreId === hId) || (hCod && padreId === hCod)) {
      agregar({
        id: sub.id,
        user_id: sub.user_id,
        codigo_legado: sub.codigo_legado,
        nombre_actividad: sub.descripcion_paso,
        descripcion_paso: sub.descripcion_paso,
        tipo_compromiso: 'PUNTUAL',
        categoria_vida: habito.categoria_vida,
        estado: sub.completado ? '04_Completado' : '02_Por_Hacer',
        completado: Boolean(sub.completado),
        es_paso_subtarea: true,
        duracion_horas: 0.25
      });
    }
  }

  // 2. Pasos definidos en notas_checklist del propio hábito
  if (habito.notas_checklist && habito.notas_checklist.trim().length > 0) {
    const lineas = habito.notas_checklist.split('\n');
    let pasoIdx = 1;
    for (const linea of lineas) {
      const match = linea.match(/^-\s*\[([ xX])\]\s*(.+)$/);
      if (match) {
        const completado = match[1].toLowerCase() === 'x';
        const desc = match[2].trim();
        agregar({
          id: `${hId}-paso-${pasoIdx}`,
          codigo_legado: `${hCod}-P${pasoIdx}`,
          nombre_actividad: desc,
          descripcion_paso: desc,
          tipo_compromiso: 'PUNTUAL',
          categoria_vida: habito.categoria_vida,
          estado: completado ? '04_Completado' : '02_Por_Hacer',
          completado,
          es_paso_subtarea: true,
          duracion_horas: 0.25
        });
        pasoIdx++;
      }
    }
  }

  // Si no existen subtareas reales o pasos de checklist, retorna []
  return resultado;
}

export function useHabitos() {
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getStatus());
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaVida | 'TODOS'>('TODOS');
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const deferredFiltroTexto = useDeferredValue(filtroTexto);

  useEffect(() => {
    return syncManager.subscribe((st) => setSyncState(st));
  }, []);

  // Consultas reactivas en vivo a Dexie (IndexedDB) con latencia 0 ms
  // Consultas reactivas en vivo a Dexie (IndexedDB)
  const rawTodasLasActividades = useLiveQuery(
    () => db.actividades_personales.toArray(),
    []
  );

  const rawTodasLasSubtareas = useLiveQuery(
    () => db.subtareas_pasos.toArray(),
    []
  );

  const rawVinculos = useLiveQuery(
    () => db.habitos_metas_vinculos.toArray(),
    []
  );

  const rawMetasPlanes = useLiveQuery(
    () => db.metas_planes.toArray(),
    []
  );

  // Bandera de carga precisa: true mientras Dexie no haya completado la hidratación inicial
  const cargando = rawTodasLasActividades === undefined;
  const loading = cargando;

  const todasLasActividades = useMemo(
    () => deduplicarPorCodigoCanonico(rawTodasLasActividades || []),
    [rawTodasLasActividades]
  );

  const todasLasSubtareas = useMemo(
    () => deduplicarPorCodigoCanonico(rawTodasLasSubtareas || []),
    [rawTodasLasSubtareas]
  );

  const metasPlanes = useMemo(
    () => deduplicarMetasPlanes(rawMetasPlanes || []),
    [rawMetasPlanes]
  );

  const vinculos = useMemo(
    () => deduplicarVinculosMeta(rawVinculos || []),
    [rawVinculos]
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

  // Mapeo O(1) de HabitoMetaVinculo[] por habito_id / codigo_legado
  const vinculosPorHabitoId = useMemo(() => {
    const map = new Map<string, typeof vinculos>();
    for (const v of vinculos) {
      if (!v) continue;
      const hId = String(v.habito_id || (v as any).habitoId || '').trim();
      if (!hId) continue;
      if (!map.has(hId)) map.set(hId, []);
      map.get(hId)!.push(v);
    }
    return map;
  }, [vinculos]);

  // FIX-HABITOS-HIERARCHY-DECOUPLING-108: Resolución estricta de subtareas reales/checklist por hábito
  const actividadesPorHabitoId = useMemo(() => {
    const map = new Map<string, Array<SubtareaPaso | any>>();

    for (const h of todasLasActividades) {
      const actAsociadas = resolverActividadesDeHabitoNativo(
        h,
        [],
        todasLasSubtareas,
        []
      );

      const hId = String(h.id || '').trim();
      const hCod = String(h.codigo_legado || '').trim();

      if (hId) map.set(hId, actAsociadas);
      if (hCod) map.set(hCod, actAsociadas);
    }

    return map;
  }, [todasLasActividades, todasLasSubtareas]);

  // Selector seguro para obtener actividades vinculadas por ID o código
  const obtenerActividadesDeHabito = (habitoId: string | number): Array<ActividadPersonal | TareaRecord | any> => {
    if (!habitoId) return [];
    const key = String(habitoId).trim();
    return actividadesPorHabitoId.get(key) || [];
  };

  // Mapeo O(1) de subtareas agrupadas por id_padre_vinculado (indexado por código legado e ID)
  const subtareasPorPadre = useMemo(() => {
    const mapCrudo = new Map<string, SubtareaPaso[]>();
    for (const sub of todasLasSubtareas) {
      const padre = String(sub.id_padre_vinculado || (sub as any).actividad_id || '').trim();
      if (!padre) continue;
      if (!mapCrudo.has(padre)) {
        mapCrudo.set(padre, []);
      }
      mapCrudo.get(padre)!.push(sub);
    }

    const map = new Map<string, SubtareaPaso[]>();
    mapCrudo.forEach((lista, key) => {
      map.set(key, [...lista].sort((a, b) => a.numero_paso - b.numero_paso));
    });

    // Unificar subtareas bajo ambas llaves (id y codigo_legado) por cada actividad
    for (const h of todasLasActividades) {
      const hId = String(h.id || '').trim();
      const hCod = String(h.codigo_legado || '').trim();
      const porId = hId ? mapCrudo.get(hId) || [] : [];
      const porCod = hCod ? mapCrudo.get(hCod) || [] : [];
      if (porId.length === 0 && porCod.length === 0) continue;

      const vistos = new Set<string>();
      const combinadas: SubtareaPaso[] = [];
      for (const s of [...porId, ...porCod]) {
        if (!vistos.has(s.id)) {
          vistos.add(s.id);
          combinadas.push(s);
        }
      }
      combinadas.sort((a, b) => a.numero_paso - b.numero_paso);
      if (hId) map.set(hId, combinadas);
      if (hCod) map.set(hCod, combinadas);
    }

    return map;
  }, [todasLasSubtareas, todasLasActividades]);

  // Filtrado reactivo en memoria
  const actividadesFiltradas = useMemo(() => {
    return todasLasActividades.filter((a) => {
      if (filtroCategoria !== 'TODOS' && a.categoria_vida !== filtroCategoria) {
        return false;
      }
      if (deferredFiltroTexto.trim()) {
        const q = deferredFiltroTexto.toLowerCase().trim();
        const nom = (a.nombre_actividad || (a as any).nombre || (a as any).Nombre_Actividad || (a as any).Nombre || (a as any).titulo || '').toLowerCase();
        const macro = (a.meta_macro_nombre || '').toLowerCase();
        const cod = (a.codigo_legado || '').toLowerCase();
        if (!nom.includes(q) && !macro.includes(q) && !cod.includes(q)) return false;
      }
      return true;
    });
  }, [todasLasActividades, filtroCategoria, deferredFiltroTexto]);

  // Cálculo acumulativo en un solo pase O(N) de KPIs Bento
  const kpis = useMemo(() => {
    const hoyStr = formatFechaIsoLocal();
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

      if (esActividadCompletadaHoy(a, hoyStr)) {
        res.completadosHoy++;
        res.horasInvertidas += a.duracion_horas || 0;
      }
    }

    return res;
  }, [todasLasActividades]);

  // Acciones transaccionales reactivas + puente local con Cockpit
  const notificarSyncYPuente = () => {
    syncManager.syncPendingRecords().catch(() => {});
    syncManager.guardarSnapshotEnPuenteLocal().catch(() => {});
  };

  const toggleCompletar = async (actividad: ActividadPersonal, completadoDeseado: boolean) => {
    const res = await completarActividadPersonalLocal(actividad, completadoDeseado);
    notificarSyncYPuente();
    return res;
  };

  const registrarAvance = async (actividad: ActividadPersonal, valor: number) => {
    const res = await registrarAvanceCuantitativoLocal(actividad, valor);
    notificarSyncYPuente();
    return res;
  };

  const toggleSubtarea = async (idSubtarea: string, deseado?: boolean) => {
    const res = await toggleSubtareaSecuencialLocal(idSubtarea, deseado);
    notificarSyncYPuente();
    return res;
  };

  const eliminarConAlcance = async (id: string, alcance: 'SINGLE' | 'FUTURE' | 'ALL', fechaReferencia: string) => {
    const res = await eliminarActividadConAlcance(id, alcance, fechaReferencia);
    notificarSyncYPuente();
    return res;
  };

  const editarConAlcance = async (
    actividadOriginal: ActividadPersonal,
    cambios: Partial<ActividadPersonal>,
    alcance: 'SINGLE' | 'FUTURE' | 'ALL',
    fechaReferencia: string
  ) => {
    const res = await editarActividadConAlcance(actividadOriginal, cambios, alcance, fechaReferencia);
    notificarSyncYPuente();
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

      // Si no vino del mapa, resolver subtareas nativamente
      if (!actVinc || actVinc.length === 0) {
        actVinc = resolverActividadesDeHabitoNativo(a, [], todasLasSubtareas, []);
      }

      const nomDefensivo =
        a.nombre_actividad ||
        (a as any).nombre ||
        (a as any).Nombre_Actividad ||
        (a as any).Nombre ||
        (a as any).titulo ||
        (a as any).Titulo ||
        (a as any).actividad ||
        (a as any).descripcion ||
        (a as any).nombre_tarea_actividad ||
        'Hábito sin título';

      const metaVinc = (aId ? metasPorHabitoId.get(aId) : undefined) || (aCod ? metasPorHabitoId.get(aCod) : undefined);
      const vMeta = (aId ? vinculosPorHabitoId.get(aId) : undefined) || (aCod ? vinculosPorHabitoId.get(aCod) : undefined) || [];

      return {
        ...a,
        nombre_actividad: nomDefensivo,
        actividadesVinculadas: actVinc || [],
        metaVinculada: metaVinc,
        vinculosMeta: vMeta
      };
    });
  }, [actividadesFiltradas, actividadesPorHabitoId, metasPorHabitoId, vinculosPorHabitoId, todasLasSubtareas]);

  // Auto-hidratación inicial al montar para poblar relaciones si IndexedDB está vacía
  useEffect(() => {
    if (autoHidratacionEjecutadaGlobal) return;
    autoHidratacionEjecutadaGlobal = true;

    const coordinarHidratacion = async () => {
      try {
        if (typeof syncManager.esperarSincronizacionInicial === 'function') {
          await syncManager.esperarSincronizacionInicial(2000);
        }
      } catch {
        // Fallback no bloqueante
      }

      try {
        await autoHidratarVinculosHabitosActividades();
      } catch (err) {
        console.warn('[useHabitos] Error en auto-hidratación de vínculos:', err);
      }
    };

    coordinarHidratacion();
  }, []);

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
    editarConAlcance,
    cargando,
    loading
  };
}

export default useHabitos;
