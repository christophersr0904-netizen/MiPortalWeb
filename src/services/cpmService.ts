/**
 * ============================================================================
 * SERVICIO: cpmService.ts
 * SISTEMA: PMO Personal Modular (Módulo 3 - WBS / CPM / Ruta Crítica)
 * ROL: Motor algorítmico determinista de ordenamiento topológico (Kahn),
 *      Forward/Backward Pass, cálculo de holguras y balanceo WBS.
 * ============================================================================
 */

import type {
  HitoWbsRecord,
  NodoCalculadoCPM,
  ResultadoCalculoCPM,
  TareaRecord
} from '../types';

/**
 * Parsea los identificadores o códigos de predecesores desde un string delimitado
 */
export function normalizarPredecesores(dependenciaStr?: string): string[] {
  if (!dependenciaStr || typeof dependenciaStr !== 'string') return [];
  return dependenciaStr
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Ejecuta el Algoritmo de Kahn para ordenar topológicamente los nodos y detectar ciclos circulares.
 * Retorna { ordenTopologico, tieneCiclos, cicloNodos }
 */
export function ordenarTopologicamenteKahn(
  codigos: string[],
  grafoAdyacencia: Map<string, string[]>,
  gradoEntradaMap: Map<string, number>
): { ordenTopologico: string[]; tieneCiclos: boolean; cicloNodos: string[] } {
  const gradoEntrada = new Map<string, number>(gradoEntradaMap);
  const cola: string[] = [];
  const ordenTopologico: string[] = [];

  // Nodos con grado de entrada 0 (sin predecesores)
  codigos.forEach((codigo) => {
    if ((gradoEntrada.get(codigo) || 0) === 0) {
      cola.push(codigo);
    }
  });

  while (cola.length > 0) {
    const actual = cola.shift()!;
    ordenTopologico.push(actual);

    const sucesores = grafoAdyacencia.get(actual) || [];
    for (const sucesor of sucesores) {
      const nuevoGrado = (gradoEntrada.get(sucesor) || 1) - 1;
      gradoEntrada.set(sucesor, nuevoGrado);
      if (nuevoGrado === 0) {
        cola.push(sucesor);
      }
    }
  }

  // Si no se procesaron todos los nodos, existe al menos un ciclo circular
  const tieneCiclos = ordenTopologico.length < codigos.length;
  const cicloNodos = tieneCiclos
    ? codigos.filter((c) => !ordenTopologico.includes(c))
    : [];

  return { ordenTopologico, tieneCiclos, cicloNodos };
}

/**
 * Calcula la Ruta Crítica (CPM), holguras y balance WBS de una lista de hitos
 */
export function calcularRutaCriticaCPM(hitos: HitoWbsRecord[]): ResultadoCalculoCPM {
  if (!hitos || hitos.length === 0) {
    return {
      nodos: new Map(),
      duracionProyecto: 0,
      rutaCritica: [],
      tieneCiclos: false,
      balancePonderaciones: []
    };
  }

  // 1. Indexar hitos por código legado e ID
  const porCodigoOId = new Map<string, HitoWbsRecord>();
  hitos.forEach((h) => {
    porCodigoOId.set(h.codigo_legado, h);
    porCodigoOId.set(h.id, h);
  });

  const codigos = hitos.map((h) => h.codigo_legado);
  const grafoSucesores = new Map<string, string[]>();
  const grafoPredecesores = new Map<string, string[]>();
  const gradoEntrada = new Map<string, number>();

  codigos.forEach((c) => {
    grafoSucesores.set(c, []);
    grafoPredecesores.set(c, []);
    gradoEntrada.set(c, 0);
  });

  // 2. Construir aristas de dependencias
  hitos.forEach((h) => {
    const codigoActual = h.codigo_legado;
    const rawPreds = normalizarPredecesores(h.dependencia_hito_id);

    rawPreds.forEach((ref) => {
      const nodoPred = porCodigoOId.get(ref);
      if (nodoPred) {
        const codigoPred = nodoPred.codigo_legado;
        if (codigoPred !== codigoActual) {
          // Predecesor -> Actual
          const succs = grafoSucesores.get(codigoPred) || [];
          if (!succs.includes(codigoActual)) {
            succs.push(codigoActual);
            grafoSucesores.set(codigoPred, succs);
          }

          const preds = grafoPredecesores.get(codigoActual) || [];
          if (!preds.includes(codigoPred)) {
            preds.push(codigoPred);
            grafoPredecesores.set(codigoActual, preds);
            gradoEntrada.set(codigoActual, (gradoEntrada.get(codigoActual) || 0) + 1);
          }
        }
      }
    });
  });

  // 3. Validación acíclica mediante Algoritmo de Kahn
  const { ordenTopologico, tieneCiclos, cicloNodos } = ordenarTopologicamenteKahn(
    codigos,
    grafoSucesores,
    gradoEntrada
  );

  // Balance de ponderaciones por fase
  const fasesMap = new Map<string, number>();
  hitos.forEach((h) => {
    if (h.tipo_elemento_wbs === 'PAQUETE_TRABAJO') {
      const fase = h.fase_asociada || 'GENERAL';
      fasesMap.set(fase, (fasesMap.get(fase) || 0) + (h.peso_pct || 0));
    }
  });

  const balancePonderaciones = Array.from(fasesMap.entries()).map(([fase, suma]) => {
    const sumaRedondeada = Math.round(suma * 100) / 100;
    return {
      fase,
      sumaPesos: sumaRedondeada,
      estaBalanceada: Math.abs(sumaRedondeada - 1.0) <= 0.01 || sumaRedondeada === 0
    };
  });

  if (tieneCiclos) {
    return {
      nodos: new Map(),
      duracionProyecto: 0,
      rutaCritica: [],
      tieneCiclos: true,
      cicloDetectado: cicloNodos,
      balancePonderaciones
    };
  }

  // 4. Inicializar Nodos Calculados
  const nodosMap = new Map<string, NodoCalculadoCPM>();
  hitos.forEach((h) => {
    const duracion = h.tipo_elemento_wbs === 'HITO_MARCADOR'
      ? 0
      : Math.max(0, h.duracion_estimada_dias ?? 1);

    const nodoCalculado: NodoCalculadoCPM = {
      id: h.id,
      codigo: h.codigo_legado,
      nombre: h.nombre_elemento,
      tipo: h.tipo_elemento_wbs,
      wbsCode: h.wbs_code,
      fase: h.fase_asociada,
      duracion,
      pesoPct: h.peso_pct,
      estado: h.estado,
      predecesores: grafoPredecesores.get(h.codigo_legado) || [],
      sucesores: grafoSucesores.get(h.codigo_legado) || [],
      es: 0,
      ef: 0,
      ls: 0,
      lf: 0,
      holguraTotal: 0,
      esCritico: false
    };
    nodosMap.set(h.codigo_legado, nodoCalculado);
    if (h.id) {
      nodosMap.set(h.id, nodoCalculado);
    }
  });

  // 5. Forward Pass (Early Start y Early Finish)
  for (const codigo of ordenTopologico) {
    const nodo = nodosMap.get(codigo)!;
    const preds = nodo.predecesores;

    if (preds.length === 0) {
      nodo.es = 0;
    } else {
      let maxEf = 0;
      for (const pCod of preds) {
        const predNodo = nodosMap.get(pCod);
        if (predNodo && predNodo.ef > maxEf) {
          maxEf = predNodo.ef;
        }
      }
      nodo.es = maxEf;
    }
    nodo.ef = nodo.es + nodo.duracion;
  }

  // Duración total del proyecto
  let duracionProyecto = 0;
  nodosMap.forEach((n) => {
    if (n.ef > duracionProyecto) {
      duracionProyecto = n.ef;
    }
  });

  // 6. Backward Pass (Late Finish y Late Start)
  const ordenInverso = [...ordenTopologico].reverse();
  for (const codigo of ordenInverso) {
    const nodo = nodosMap.get(codigo)!;
    const succs = nodo.sucesores;

    if (succs.length === 0) {
      nodo.lf = duracionProyecto;
    } else {
      let minLs = Infinity;
      for (const sCod of succs) {
        const succNodo = nodosMap.get(sCod);
        if (succNodo && succNodo.ls < minLs) {
          minLs = succNodo.ls;
        }
      }
      nodo.lf = minLs === Infinity ? duracionProyecto : minLs;
    }
    nodo.ls = nodo.lf - nodo.duracion;
    nodo.holguraTotal = Math.max(0, Math.round((nodo.ls - nodo.es) * 1000) / 1000);
    nodo.esCritico = nodo.holguraTotal <= 0.001;
  }

  // 7. Extraer Ruta Crítica
  const rutaCritica = ordenTopologico.filter((cod) => {
    const n = nodosMap.get(cod);
    return n && n.esCritico;
  });

  return {
    nodos: nodosMap,
    duracionProyecto,
    rutaCritica,
    tieneCiclos: false,
    balancePonderaciones
  };
}

export interface NodoCPMTarea {
  id: string;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  holguraTotal: number;
  esCritico: boolean;
}

export interface ResultadoCPMTareas {
  rutaCriticaSet: Set<string>;
  duracionProyectoHoras: number;
  holgurasMap: Map<string, number>;
  mapaCPM: Map<string, NodoCPMTarea>;
}

/**
 * Motor Canónico de Ruta Crítica (CPM) a nivel de Tareas Operativas
 * (Paridad 1:1 con legacy_gas/JS_GrafoRed.html:L42-159)
 */
export function calcularCPMCanoicoTareas(tareas: TareaRecord[]): ResultadoCPMTareas {
  const tMap = new Map<string, { tarea: TareaRecord; duracion: number; rawId: string }>();
  const depMap = new Map<string, { pred: string[]; succ: string[] }>();
  const rutaCriticaSet = new Set<string>();
  const holgurasMap = new Map<string, number>();
  const mapaCPM = new Map<string, NodoCPMTarea>();

  if (!tareas || tareas.length === 0) {
    return {
      rutaCriticaSet,
      duracionProyectoHoras: 0,
      holgurasMap,
      mapaCPM
    };
  }

  // 1. Indexar tareas y normalizar identificadores
  tareas.forEach((t) => {
    const rawId = String(t.codigo_legado || t.id || (t as any).ID_Tarea || '').trim();
    if (!rawId) return;
    const upperId = rawId.toUpperCase();
    const dur = Math.max(0.5, parseFloat(String(t.horas_estimadas || (t as any).Horas_Estimadas || 1)) || 1.0);

    tMap.set(upperId, { tarea: t, duracion: dur, rawId });
    if (!depMap.has(upperId)) {
      depMap.set(upperId, { pred: [], succ: [] });
    }

    // Predecesora
    const rawDep = String(t.id_dependencia || (t as any).ID_Dependencia || '').trim();
    if (rawDep && rawDep !== 'Ninguno' && rawDep !== '0' && rawDep !== '-') {
      const preds = rawDep.split(/[,;|]/).map((s) => s.trim().toUpperCase()).filter(Boolean);
      preds.forEach((predId) => {
        depMap.get(upperId)!.pred.push(predId);
        if (!depMap.has(predId)) {
          depMap.set(predId, { pred: [], succ: [] });
        }
        depMap.get(predId)!.succ.push(upperId);
      });
    }
  });

  const ids = Array.from(tMap.keys());
  const esMap = new Map<string, number>();
  const efMap = new Map<string, number>();

  ids.forEach((id) => {
    esMap.set(id, 0);
    efMap.set(id, tMap.get(id)!.duracion);
  });

  // 2. Forward Pass: Calcular Early Start (ES) y Early Finish (EF)
  const iterLimit = Math.max(20, ids.length * 3);
  let changed = true;
  let iter = 0;
  while (changed && iter < iterLimit) {
    changed = false;
    iter++;
    ids.forEach((id) => {
      const preds = depMap.get(id)?.pred || [];
      if (preds.length > 0) {
        let maxPredEF = 0;
        preds.forEach((pId) => {
          if (efMap.has(pId) && efMap.get(pId)! > maxPredEF) {
            maxPredEF = efMap.get(pId)!;
          }
        });
        if (maxPredEF > (esMap.get(id) || 0)) {
          esMap.set(id, maxPredEF);
          efMap.set(id, maxPredEF + tMap.get(id)!.duracion);
          changed = true;
        }
      }
    });
  }

  // 3. Duración total del proyecto en horas
  let duracionProyectoHoras = 0;
  ids.forEach((id) => {
    const ef = efMap.get(id) || 0;
    if (ef > duracionProyectoHoras) {
      duracionProyectoHoras = ef;
    }
  });

  // 4. Backward Pass: Calcular Late Finish (LF) y Late Start (LS)
  const lfMap = new Map<string, number>();
  const lsMap = new Map<string, number>();

  ids.forEach((id) => {
    lfMap.set(id, duracionProyectoHoras);
    lsMap.set(id, duracionProyectoHoras - tMap.get(id)!.duracion);
  });

  changed = true;
  iter = 0;
  while (changed && iter < iterLimit) {
    changed = false;
    iter++;
    ids.forEach((id) => {
      const succs = depMap.get(id)?.succ || [];
      if (succs.length > 0) {
        let minSuccLS = duracionProyectoHoras;
        succs.forEach((sId) => {
          if (lsMap.has(sId) && lsMap.get(sId)! < minSuccLS) {
            minSuccLS = lsMap.get(sId)!;
          }
        });
        if (minSuccLS < (lfMap.get(id) ?? duracionProyectoHoras)) {
          lfMap.set(id, minSuccLS);
          lsMap.set(id, minSuccLS - tMap.get(id)!.duracion);
          changed = true;
        }
      }
    });
  }

  // 5. Holgura Total (Total Float = LS - ES) y Extracción de Ruta Crítica
  ids.forEach((id) => {
    const es = esMap.get(id) || 0;
    const ef = efMap.get(id) || 0;
    const ls = lsMap.get(id) || 0;
    const lf = lfMap.get(id) || 0;
    const floatVal = Math.round((ls - es) * 100) / 100;
    holgurasMap.set(id, floatVal);

    const esCritico = floatVal <= 0.05;
    const nodeObj: NodoCPMTarea = {
      id,
      es,
      ef,
      ls,
      lf,
      holguraTotal: floatVal,
      esCritico
    };
    mapaCPM.set(id, nodeObj);

    const rawObj = tMap.get(id);
    if (rawObj?.rawId) {
      mapaCPM.set(rawObj.rawId, nodeObj);
      if (rawObj.tarea.id) mapaCPM.set(String(rawObj.tarea.id), nodeObj);
      if (rawObj.tarea.codigo_legado) mapaCPM.set(String(rawObj.tarea.codigo_legado), nodeObj);
    }

    if (esCritico) {
      rutaCriticaSet.add(id);
      if (rawObj?.rawId) rutaCriticaSet.add(rawObj.rawId);
      if (rawObj?.tarea.id) rutaCriticaSet.add(String(rawObj.tarea.id));
      if (rawObj?.tarea.codigo_legado) rutaCriticaSet.add(String(rawObj.tarea.codigo_legado));
    }
  });

  return {
    rutaCriticaSet,
    duracionProyectoHoras,
    holgurasMap,
    mapaCPM
  };
}
