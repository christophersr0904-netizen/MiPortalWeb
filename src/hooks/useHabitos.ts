import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { ActividadPersonal, SubtareaPaso, CategoriaVida } from '../types';
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
  const todasLasActividades = useLiveQuery(
    () => db.actividades_personales.toArray(),
    [],
    [] as ActividadPersonal[]
  );

  const todasLasSubtareas = useLiveQuery(
    () => db.subtareas_pasos.toArray(),
    [],
    [] as SubtareaPaso[]
  );

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

  return {
    actividades: actividadesFiltradas,
    todasLasActividades,
    subtareasPorPadre,
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
