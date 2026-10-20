import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  type Node,
  type Edge,
  type ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { calcularRutaCriticaCPM, calcularCPMCanoicoTareas } from '../../services/cpmService';
import {
  NodoProyecto,
  NodoFase,
  NodoWBS,
  NodoTarea,
  NodoGasto,
  NodoIngreso
} from './nodos';
import {
  GitFork,
  Flame,
  Zap,
  Clock,
  AlertOctagon,
  CheckCircle,
  DollarSign,
  Layers,
  Maximize2,
  Minimize2,
  Crosshair,
  TrendingUp,
  CheckSquare
} from 'lucide-react';
import type {
  HitoWbsRecord,
  TareaRecord,
  GastoRecord,
  IngresoRecord,
  NodoCalculadoCPM
} from '../../types';
import { CanaletaEdge } from './CanaletaEdge';
import { TooltipFlotanteWBS, type TooltipInfo } from './TooltipFlotanteWBS';

const nodeTypes = {
  proyectoNode: NodoProyecto,
  faseNode: NodoFase,
  wbsNode: NodoWBS,
  tareaNode: NodoTarea,
  gastoNode: NodoGasto,
  ingresoNode: NodoIngreso
};

const edgeTypes = {
  canaletaEdge: CanaletaEdge
};

// Constantes de dimensiones canónicas (Paridad 1:1 REQ-F2-P2.1p)
export const CARD_W = {
  proyecto: 320,
  fase: 220,
  wbs: 250,
  tarea: 220,
  gasto: 180
};

export const CARD_H = {
  proyecto: 120,
  fase: 80,
  wbs: 120,
  tarea: 90,
  gasto: 60
};

export const Y_LEVELS = {
  proyecto: 40,                // Nivel 0: Proyecto Matriz (H=120)
  fase: 200,                   // Nivel 1: Fases agrupadoras (H=80)
  wbs: 380,                    // Nivel 2: Paquetes WP e Hitos (H=120)
  tarea: 580,                  // Nivel 3: Tareas hijas (H=90)
  canaletaDependencias: 700,   // Canal horizontal exclusivo dependencias Manhattan (Y = 700px)
  gasto: 780                   // Nivel 4: Gastos imputados
};

export const GAP_X = 36;       // Separación horizontal canónica entre entregables/tareas (36px)
export const GAP_FASE = 60;    // Separación horizontal canónica entre ramas de fases (60px)

export function safeCoord(num: any, fallback = 60): number {
  if (typeof num === 'number' && Number.isFinite(num)) {
    return Math.round(num);
  }
  return fallback;
}

function formatFecha(f: any): string {
  if (!f) return 'Sin fecha';
  try {
    const s = String(f).split('T')[0];
    const parts = s.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(f);
    if (isNaN(d.getTime())) return String(f);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(f);
  }
}

export interface GrafoWBSProps {
  proyectoId?: string | null;
  hitosExternos?: HitoWbsRecord[];
}

export const GrafoWBS: React.FC<GrafoWBSProps> = ({ proyectoId, hitosExternos }) => {
  const [soloRutaCritica, setSoloRutaCritica] = useState(false);
  const [soloHitos, setSoloHitos] = useState(false);
  const [verTareas, setVerTareas] = useState(true);
  const [verGastos, setVerGastos] = useState(false);
  const [verIngresos, setVerIngresos] = useState(true);
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Consultas Dexie en tiempo real para todas las entidades requeridas
  const todosLosProyectos = useLiveQuery(() => db.proyectos.toArray(), []);
  const todosLosHitos = useLiveQuery(() => db.hitos_wbs.toArray(), []);
  const todasLasTareas = useLiveQuery(() => db.tareas.toArray(), []);
  const todosLosGastos = useLiveQuery(() => db.gastos.toArray(), []);
  const todosLosIngresos = useLiveQuery(() => db.ingresos.toArray(), []);
  const todasLasNotas = useLiveQuery(() => db.notas.toArray(), []);

  // Identificar el proyecto activo
  const proyectoActivo = useMemo(() => {
    if (!todosLosProyectos || todosLosProyectos.length === 0) return null;
    if (!proyectoId) return todosLosProyectos[0];
    const pidNorm = String(proyectoId).trim().toUpperCase();
    return (
      todosLosProyectos.find(
        (p) =>
          String(p.id).toUpperCase() === pidNorm ||
          String(p.codigo_legado || '').toUpperCase() === pidNorm
      ) || todosLosProyectos[0]
    );
  }, [todosLosProyectos, proyectoId]);

  const proyCod = useMemo(() => {
    return proyectoActivo ? String(proyectoActivo.codigo_legado || proyectoActivo.id).trim().toUpperCase() : '';
  }, [proyectoActivo]);

  // Filtrar estrictamente hitos por proyecto activo (prioriza hitosExternos si vienen provistos)
  const hitos = useMemo(() => {
    if (hitosExternos && hitosExternos.length > 0) {
      return hitosExternos;
    }
    if (!todosLosHitos || !proyCod) return [];
    return todosLosHitos.filter((h: any) => {
      const hProyId = String(h.proyecto_id || h.ID_Proyecto || '').trim().toUpperCase();
      const hProyCod = String(h.proyecto_codigo || '').trim().toUpperCase();
      const hCod = String(h.codigo_legado || h.id || '').trim().toUpperCase();
      return hProyId === proyCod || hProyCod === proyCod || hCod.startsWith(proyCod);
    });
  }, [todosLosHitos, proyCod, hitosExternos]);

  const idsHitosSet = useMemo(() => {
    const s = new Set<string>();
    hitos.forEach((h) => {
      s.add(String(h.codigo_legado || h.id).trim().toUpperCase());
    });
    return s;
  }, [hitos]);

  // Filtrar tareas por proyecto activo o hitos asociados
  const tareas = useMemo(() => {
    if (!todasLasTareas || !proyCod) return [];
    return todasLasTareas.filter((t: any) => {
      const tProy = String(t.proyecto_codigo || t.ID_Proyecto || '').trim().toUpperCase();
      const tHito = String(t.hito_codigo || t.ID_Hito || '').trim().toUpperCase();
      return tProy === proyCod || (tHito && idsHitosSet.has(tHito));
    });
  }, [todasLasTareas, proyCod, idsHitosSet]);

  const idsTareasSet = useMemo(() => {
    const s = new Set<string>();
    tareas.forEach((t) => {
      s.add(String(t.codigo_legado || t.id).trim().toUpperCase());
    });
    return s;
  }, [tareas]);

  // Filtrar gastos asociados al proyecto, hitos o tareas
  const gastos = useMemo(() => {
    if (!todosLosGastos || !proyCod) return [];
    return todosLosGastos.filter((g: any) => {
      const gProy = String(g.id_origen_vinculado || g.ID_Proyecto || '').trim().toUpperCase();
      const gHito = String(g.ID_Hito || g.id_hito || '').trim().toUpperCase();
      const gTarea = String(g.ID_Tarea || g.id_tarea || '').trim().toUpperCase();
      return (
        gProy === proyCod ||
        (gHito && idsHitosSet.has(gHito)) ||
        (gTarea && idsTareasSet.has(gTarea))
      );
    });
  }, [todosLosGastos, proyCod, idsHitosSet, idsTareasSet]);

  // Filtrar ingresos del proyecto activo
  const ingresos = useMemo(() => {
    if (!todosLosIngresos || !proyCod) return [];
    return todosLosIngresos.filter((ing: any) => {
      const orig = String(ing.id_origen_vinculado || ing.ID_Origen_Vinculado || '').trim().toUpperCase();
      const tipo = String(ing.tipo_origen || ing.Tipo_Origen || '').trim().toUpperCase();
      return orig === proyCod || (tipo === 'PROYECTO' && (orig === proyCod || proyCod.startsWith(orig)));
    });
  }, [todosLosIngresos, proyCod]);

  // Mapeo auxiliar de notas por entidad
  const notasPorEntidadMap = useMemo(() => {
    const m = new Map<string, number>();
    if (!todasLasNotas) return m;

    todasLasNotas.forEach((n: any) => {
      const vinculos = n.enlaces_entidades_json || n.Vinculos;
      if (Array.isArray(vinculos)) {
        vinculos.forEach((v: any) => {
          const cod = String(v.codigo || v.id || '').trim().toUpperCase();
          if (cod) m.set(cod, (m.get(cod) || 0) + 1);
        });
      }
      if (Array.isArray(n.etiquetas)) {
        n.etiquetas.forEach((tag: string) => {
          const tNorm = String(tag).trim().toUpperCase();
          if (tNorm) m.set(tNorm, (m.get(tNorm) || 0) + 1);
        });
      }
    });

    return m;
  }, [todasLasNotas]);

  // Mapas de tareas y gastos por hito
  const { tareasPorHito, gastosPorHito, gastosPorTarea } = useMemo(() => {
    const tMap = new Map<string, TareaRecord[]>();
    const gHitoMap = new Map<string, GastoRecord[]>();
    const gTareaMap = new Map<string, GastoRecord[]>();

    const hitoCodeMap = new Map<string, string>();
    (hitos || []).forEach((h) => {
      const c1 = String(h.codigo_legado || '').trim().toUpperCase();
      const c2 = String(h.id || '').trim().toUpperCase();
      if (c1 && c2) {
        hitoCodeMap.set(c2, c1);
        hitoCodeMap.set(c1, c1);
      } else if (c1) {
        hitoCodeMap.set(c1, c1);
      } else if (c2) {
        hitoCodeMap.set(c2, c2);
      }
    });

    tareas.forEach((t) => {
      const rawKey = String(
        t.hito_codigo ||
        (t as any).id_hito ||
        (t as any).ID_Hito ||
        (t as any).hito_id ||
        ''
      ).trim().toUpperCase();
      const canonicalKey = hitoCodeMap.get(rawKey) || rawKey;
      if (canonicalKey) {
        if (!tMap.has(canonicalKey)) tMap.set(canonicalKey, []);
        tMap.get(canonicalKey)!.push(t);
      }
    });

    gastos.forEach((g) => {
      const rawHKey = String((g as any).ID_Hito || (g as any).id_hito || '').trim().toUpperCase();
      const canonicalHKey = hitoCodeMap.get(rawHKey) || rawHKey;
      const tKey = String((g as any).ID_Tarea || (g as any).id_tarea || '').trim().toUpperCase();

      if (tKey) {
        if (!gTareaMap.has(tKey)) gTareaMap.set(tKey, []);
        gTareaMap.get(tKey)!.push(g);
      } else if (canonicalHKey) {
        if (!gHitoMap.has(canonicalHKey)) gHitoMap.set(canonicalHKey, []);
        gHitoMap.get(canonicalHKey)!.push(g);
      }
    });

    return { tareasPorHito: tMap, gastosPorHito: gHitoMap, gastosPorTarea: gTareaMap };
  }, [tareas, gastos, hitos]);

  // Calcular CPM a nivel de hitos
  const calculoCPM = useMemo(() => {
    return calcularRutaCriticaCPM(hitos || []);
  }, [hitos]);

  // Calcular CPM canónico de tareas operativas (legacy_gas/JS_GrafoRed.html:L42-159)
  const cpmTareas = useMemo(() => {
    return calcularCPMCanoicoTareas(tareas || []);
  }, [tareas]);

  // Set global determinista de identificadores en Ruta Crítica (tareas e hitos)
  const setCriticos = useMemo(() => {
    const s = new Set<string>();

    // 1. Tareas identificadas por el motor CPM canónico de tareas (float <= 0.05)
    cpmTareas.rutaCriticaSet.forEach((cod) => s.add(String(cod).trim().toUpperCase()));

    // 2. Tareas evaluadas con float <= 0.05 o esCritico
    tareas.forEach((t) => {
      const idUpper = String(t.codigo_legado || t.id || (t as any).ID_Tarea || '').trim().toUpperCase();
      const cpmNode = cpmTareas.mapaCPM.get(idUpper) || cpmTareas.mapaCPM.get(String(t.id)) || cpmTareas.mapaCPM.get(String(t.codigo_legado));

      const esCrit = Boolean(
        cpmNode?.esCritico ||
        (typeof cpmNode?.holguraTotal === 'number' && cpmNode.holguraTotal <= 0.05) ||
        (t as any).es_critica === true ||
        (t as any).esCritica === true
      );

      if (esCrit) {
        if (t.codigo_legado) s.add(String(t.codigo_legado).trim().toUpperCase());
        if (t.id) s.add(String(t.id).trim().toUpperCase());
        if ((t as any).ID_Tarea) s.add(String((t as any).ID_Tarea).trim().toUpperCase());
      }
    });

    // 3. Hitos calculados por CPM
    calculoCPM.rutaCritica.forEach((cod) => s.add(String(cod).trim().toUpperCase()));

    return s;
  }, [tareas, cpmTareas, calculoCPM]);

  const rutaCriticaSet = setCriticos;

  const tareasCriticasCount = useMemo(() => {
    return tareas.filter((t) =>
      setCriticos.has(String(t.codigo_legado || t.id || (t as any).ID_Tarea || '').trim().toUpperCase())
    ).length;
  }, [tareas, setCriticos]);

  // =========================================================================
  // 1. TOPOLOGÍA GEOMÉTRICA INMUTABLE: Posiciones (x, y) NUNCA se recalculan al alternar Ruta Crítica
  // =========================================================================
  const baseGraphTopology = useMemo(() => {
    const nList: Node[] = [];
    const eList: Edge[] = [];

    if (!proyectoActivo) {
      return { nodes: nList, edges: eList };
    }

    const proyNodeId = String(proyectoActivo.codigo_legado || proyectoActivo.id);
    const notasProyCount = notasPorEntidadMap.get(String(proyNodeId).toUpperCase()) || 0;
    const totalIngresosMonto = ingresos.reduce(
      (acc, i) => acc + (parseFloat(String(i.monto_pen || i.monto_original || 0)) || 0),
      0
    );

    // 1. Agrupar la estructura: Fase -> [Entregables] -> [Tareas] -> [Gastos]
    const fasesMap = new Map<
      string,
      {
        id: string;
        nombre: string;
        hitos: HitoWbsRecord[];
        pesoTotal: number;
      }
    >();

    hitos.forEach((h) => {
      const fRaw = String(h.fase_asociada || (h as any).Fase_Asociada || '').trim();
      const fNombre = fRaw || 'Fase General';
      const fId = `FASE-${fNombre.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;

      if (!fasesMap.has(fNombre)) {
        fasesMap.set(fNombre, {
          id: fId,
          nombre: fNombre,
          hitos: [],
          pesoTotal: 0
        });
      }

      const fObj = fasesMap.get(fNombre)!;
      fObj.hitos.push(h);
      fObj.pesoTotal += h.peso_pct || 0;
    });

    const fasesArr = Array.from(fasesMap.values());

    // 2. Pre-calcular estructura jerárquica con anchos Bottom-Up
    interface TareaBranch {
      tarea: TareaRecord;
      tCod: string;
      esCritica: boolean;
      notasCount: number;
      gastos: GastoRecord[];
      anchoTarea: number;
      tareaX: number;
    }

    interface EntregableBranch {
      hito: HitoWbsRecord;
      hCod: string;
      nodoCPM: NodoCalculadoCPM;
      tCount: number;
      gHitoSum: number;
      notasCount: number;
      tareas: TareaBranch[];
      gastosDirectos: GastoRecord[];
      anchoWP: number;
      wpX: number;
      gastosStartX: number;
    }

    interface FaseBranch {
      id: string;
      nombre: string;
      pesoTotal: number;
      numWP: number;
      numMarcadores: number;
      numTareasTotal: number;
      entregables: EntregableBranch[];
      anchoFase: number;
      faseX: number;
      startX: number;
    }

    const faseBranches: FaseBranch[] = [];

    fasesArr.forEach((fase) => {
      const entregablesBranch: EntregableBranch[] = [];

      fase.hitos.forEach((h) => {
        const hCod = String(h.codigo_legado || h.id).trim();
        const nodoCPM = calculoCPM.nodos.get(hCod);
        const hCodUpper = hCod.toUpperCase();

        const tRecords = (!soloHitos && verTareas && h.tipo_elemento_wbs !== 'HITO_MARCADOR')
          ? (tareasPorHito.get(hCodUpper) || [])
          : [];
        const gHitoList = (verGastos && !soloHitos)
          ? (gastosPorHito.get(hCodUpper) || [])
          : [];
        const gHitoSum = gHitoList.reduce(
          (acc, g) => acc + (parseFloat(String(g.monto_pen || g.monto_original || 0)) || 0),
          0
        );
        const notasHCount = notasPorEntidadMap.get(hCodUpper) || 0;

        const defaultNodoCPM: NodoCalculadoCPM = nodoCPM || {
          id: h.id,
          codigo: hCod,
          nombre: h.nombre_elemento || '',
          tipo: h.tipo_elemento_wbs,
          wbsCode: h.wbs_code || '1.0',
          fase: fase.nombre,
          duracion: h.duracion_estimada_dias || 1,
          pesoPct: h.peso_pct || 0,
          estado: h.estado,
          predecesores: [],
          sucesores: [],
          es: 0,
          ef: h.duracion_estimada_dias || 1,
          ls: 0,
          lf: h.duracion_estimada_dias || 1,
          holguraTotal: 0,
          esCritico: false
        };

        const esHitoCritico = Boolean(
          defaultNodoCPM.esCritico ||
          (defaultNodoCPM.holguraTotal !== undefined && defaultNodoCPM.holguraTotal <= 0.05) ||
          rutaCriticaSet.has(hCodUpper)
        );
        defaultNodoCPM.esCritico = esHitoCritico;

        const tareasBranch: TareaBranch[] = [];
        tRecords.forEach((t) => {
          const tCod = String(t.codigo_legado || t.id).trim();
          const tCodUpper = tCod.toUpperCase();
          const esTareaCritica = Boolean(
            setCriticos.has(tCodUpper) ||
            (t.id && setCriticos.has(String(t.id).trim().toUpperCase())) ||
            (t as any).es_critica === true ||
            (t as any).esCritica === true
          );
          const notasTCount = notasPorEntidadMap.get(tCod.toUpperCase()) || 0;
          const gTareaList = verGastos ? (gastosPorTarea.get(tCod.toUpperCase()) || []) : [];

          let anchoT = CARD_W.tarea;
          if (verGastos && gTareaList.length > 1) {
            anchoT = Math.max(CARD_W.tarea, gTareaList.length * CARD_W.gasto + (gTareaList.length - 1) * GAP_X);
          } else if (verGastos && gTareaList.length === 1) {
            anchoT = Math.max(CARD_W.tarea, CARD_W.gasto);
          }

          tareasBranch.push({
            tarea: t,
            tCod,
            esCritica: esTareaCritica,
            notasCount: notasTCount,
            gastos: gTareaList,
            anchoTarea: anchoT,
            tareaX: 0
          });
        });

        // Ancho mínimo del WP Bottom-Up:
        let anchoWP = CARD_W.wbs;
        if (tareasBranch.length > 0) {
          const totalTareasW =
            tareasBranch.reduce((acc, tb) => acc + tb.anchoTarea, 0) +
            (tareasBranch.length - 1) * GAP_X;
          anchoWP = Math.max(CARD_W.wbs, totalTareasW);
        } else if (verGastos && gHitoList.length > 0) {
          const totalGastosDirectosW =
            gHitoList.length * CARD_W.gasto + (gHitoList.length - 1) * GAP_X;
          anchoWP = Math.max(CARD_W.wbs, totalGastosDirectosW);
        }

        entregablesBranch.push({
          hito: h,
          hCod,
          nodoCPM: defaultNodoCPM,
          tCount: tRecords.length,
          gHitoSum,
          notasCount: notasHCount,
          tareas: tareasBranch,
          gastosDirectos: gHitoList,
          anchoWP,
          wpX: 0,
          gastosStartX: 0
        });
      });

      const numWP = fase.hitos.filter((h) => h.tipo_elemento_wbs !== 'HITO_MARCADOR').length;
      const numMarcadores = fase.hitos.filter((h) => h.tipo_elemento_wbs === 'HITO_MARCADOR').length;
      const numTareasTotal = fase.hitos.reduce((acc, h) => {
        const hCod = String(h.codigo_legado || h.id).trim().toUpperCase();
        return acc + (tareasPorHito.get(hCod)?.length || 0);
      }, 0);

      let anchoFase = CARD_W.fase;
      if (entregablesBranch.length > 0) {
        const totalEntregablesW =
          entregablesBranch.reduce((acc, eb) => acc + eb.anchoWP, 0) +
          (entregablesBranch.length - 1) * GAP_X;
        anchoFase = Math.max(CARD_W.fase, totalEntregablesW);
      }

      faseBranches.push({
        id: fase.id,
        nombre: fase.nombre,
        pesoTotal: fase.pesoTotal,
        numWP,
        numMarcadores,
        numTareasTotal,
        entregables: entregablesBranch,
        anchoFase,
        faseX: 0,
        startX: 0
      });
    });

    // 3. Algoritmo de Posicionamiento Determinista sin Colisiones (Eje X)
    let cursorX = 60;

    faseBranches.forEach((fb) => {
      fb.startX = cursorX;

      const totalWPsW =
        fb.entregables.length > 0
          ? fb.entregables.reduce((acc, eb) => acc + eb.anchoWP, 0) +
            (fb.entregables.length - 1) * GAP_X
          : 0;

      fb.faseX = safeCoord(cursorX + (fb.anchoFase - CARD_W.fase) / 2, cursorX);

      const wpOffset = fb.anchoFase > totalWPsW ? (fb.anchoFase - totalWPsW) / 2 : 0;
      let currentWPX = cursorX + wpOffset;

      fb.entregables.forEach((eb) => {
        eb.wpX = safeCoord(currentWPX + (eb.anchoWP - CARD_W.wbs) / 2, currentWPX);

        if (eb.tareas.length > 0) {
          const totalTareasW =
            eb.tareas.reduce((acc, tb) => acc + tb.anchoTarea, 0) +
            (eb.tareas.length - 1) * GAP_X;
          const taskOffset = eb.anchoWP > totalTareasW ? (eb.anchoWP - totalTareasW) / 2 : 0;
          let currentTaskX = currentWPX + taskOffset;

          eb.tareas.forEach((tb) => {
            tb.tareaX = safeCoord(currentTaskX + (tb.anchoTarea - CARD_W.tarea) / 2, currentTaskX);
            currentTaskX += tb.anchoTarea + GAP_X;
          });
        }

        if (eb.tareas.length === 0 && eb.gastosDirectos.length > 0) {
          const totalGDirectW =
            eb.gastosDirectos.length * CARD_W.gasto +
            (eb.gastosDirectos.length - 1) * GAP_X;
          const gOffset = eb.anchoWP > totalGDirectW ? (eb.anchoWP - totalGDirectW) / 2 : 0;
          eb.gastosStartX = currentWPX + gOffset;
        }

        currentWPX += eb.anchoWP + GAP_X;
      });

      cursorX += fb.anchoFase + GAP_FASE;
    });

    const totalTreeWidth = Math.max(CARD_W.proyecto, cursorX - GAP_FASE - 60);
    const proyX = safeCoord(60 + (totalTreeWidth - CARD_W.proyecto) / 2, 60);

    // 4. Indexación Determinista Global de Tareas para Precedencias
    interface TaskCoordInfo {
      x: number;
      y: number;
      index: number;
      esCritica: boolean;
      tarea: TareaRecord;
      tCod: string;
    }
    const taskMap = new Map<string, TaskCoordInfo>();
    let globalTaskIdx = 0;

    faseBranches.forEach((fb) => {
      fb.entregables.forEach((eb) => {
        eb.tareas.forEach((tb) => {
          const info: TaskCoordInfo = {
            x: tb.tareaX,
            y: Y_LEVELS.tarea,
            index: globalTaskIdx++,
            esCritica: tb.esCritica,
            tarea: tb.tarea,
            tCod: tb.tCod
          };
          taskMap.set(tb.tCod.toUpperCase(), info);
          if (tb.tarea.id) {
            taskMap.set(String(tb.tarea.id).trim().toUpperCase(), info);
          }
          if (tb.tarea.codigo_legado) {
            taskMap.set(String(tb.tarea.codigo_legado).trim().toUpperCase(), info);
          }
        });
      });
    });

    // -------------------------------------------------------------------------
    // NIVEL 0: NODO PROYECTO RAÍZ (Y = 40)
    // -------------------------------------------------------------------------
    nList.push({
      id: proyNodeId,
      type: 'proyectoNode',
      draggable: false,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: { x: proyX, y: Y_LEVELS.proyecto },
      data: {
        proyecto: proyectoActivo,
        direccion: 'TB',
        notasCount: notasProyCount,
        ingresosTotal: totalIngresosMonto,
        pctAvance: proyectoActivo.avance_real_pct || 0
      }
    });

    // -------------------------------------------------------------------------
    // NIVEL 1: FASES (Y = 200) Y ENLACES
    // -------------------------------------------------------------------------
    faseBranches.forEach((fb, idx) => {
      nList.push({
        id: fb.id,
        type: 'faseNode',
        draggable: false,
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
        position: { x: fb.faseX, y: Y_LEVELS.fase },
        data: {
          id: fb.id,
          nombreFase: fb.nombre,
          pesoPct: Math.round(fb.pesoTotal * 100),
          numWP: fb.numWP,
          numMarcadores: fb.numMarcadores,
          numTareasTotal: fb.numTareasTotal,
          direccion: 'TB'
        }
      });

      // Conector Proyecto (Bottom) -> Fase (Top) en 90° con smoothstep (árbol superior)
      eList.push({
        id: `edge-${proyNodeId}-${fb.id}`,
        source: proyNodeId,
        sourceHandle: 'proy-bottom',
        target: fb.id,
        targetHandle: 'fase-top',
        type: 'smoothstep',
        data: { esArbolSuperior: true, esCritica: false },
        style: {
          stroke: '#8b5cf6',
          strokeWidth: 1.5
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#8b5cf6',
          width: 14,
          height: 14
        }
      });

      // Secuencia horizontal punteada entre fases consecutivas
      if (idx < faseBranches.length - 1) {
        const nextFb = faseBranches[idx + 1];
        eList.push({
          id: `edge-faseSeq-${fb.id}-${nextFb.id}`,
          source: fb.id,
          sourceHandle: 'fase-right',
          target: nextFb.id,
          targetHandle: 'fase-left',
          type: 'straight',
          data: { esArbolSuperior: true, esCritica: false },
          style: {
            stroke: '#8b5cf6',
            strokeWidth: 1.5,
            strokeDasharray: '4,4'
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6', width: 12, height: 12 }
        });
      }

      // -----------------------------------------------------------------------
      // NIVEL 2: PAQUETES DE TRABAJO / HITOS (Y = 380)
      // -----------------------------------------------------------------------
      fb.entregables.forEach((eb) => {
        const esWpCrit =
          eb.nodoCPM.esCritico ||
          rutaCriticaSet.has(eb.hCod.toUpperCase()) ||
          eb.tareas.some((t) => t.esCritica);

        nList.push({
          id: eb.hCod,
          type: 'wbsNode',
          draggable: false,
          targetPosition: Position.Top,
          sourcePosition: Position.Bottom,
          position: { x: eb.wpX, y: Y_LEVELS.wbs },
          data: {
            nodo: {
              ...eb.nodoCPM,
              esCritico: esWpCrit
            },
            direccion: 'TB',
            mostrarGastos: verGastos,
            gastoTotal: eb.gHitoSum,
            tareasCount: eb.tCount,
            notasCount: eb.notasCount
          }
        });

        // Conector Fase (Bottom) -> WP (Top) en 90° con smoothstep (árbol superior)
        eList.push({
          id: `edge-${fb.id}-${eb.hCod}`,
          source: fb.id,
          sourceHandle: 'fase-bottom',
          target: eb.hCod,
          targetHandle: 'wbs-top',
          type: 'smoothstep',
          data: { esArbolSuperior: true, esCritica: false },
          style: {
            stroke: eb.hito.tipo_elemento_wbs === 'HITO_MARCADOR' ? '#6366f1' : '#0ea5e9',
            strokeWidth: 1.5,
            strokeDasharray: eb.hito.tipo_elemento_wbs === 'HITO_MARCADOR' ? '4,3' : undefined
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: eb.hito.tipo_elemento_wbs === 'HITO_MARCADOR' ? '#6366f1' : '#0ea5e9',
            width: 14,
            height: 14
          }
        });

        // ---------------------------------------------------------------------
        // NIVEL 3: TAREAS HIJAS (Y = 580)
        // ---------------------------------------------------------------------
        eb.tareas.forEach((tb) => {
          const esTarCrit = Boolean(
            tb.esCritica ||
            setCriticos.has(tb.tCod.toUpperCase()) ||
            (tb.tarea.id && setCriticos.has(String(tb.tarea.id).trim().toUpperCase()))
          );

          nList.push({
            id: tb.tCod,
            type: 'tareaNode',
            draggable: false,
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            position: { x: tb.tareaX, y: Y_LEVELS.tarea },
            data: {
              tarea: tb.tarea,
              nodoCPM: eb.nodoCPM,
              esCritica: esTarCrit,
              isCriticalFocused: false,
              soloRutaCritica: false,
              direccion: 'TB',
              notasCount: tb.notasCount
            }
          });

          // Conector WP (Bottom) -> Tarea (Top) en 90° con smoothstep (árbol superior)
          eList.push({
            id: `edge-${eb.hCod}-${tb.tCod}`,
            source: eb.hCod,
            sourceHandle: 'wbs-bottom',
            target: tb.tCod,
            targetHandle: 'tar-top',
            type: 'smoothstep',
            data: { esArbolSuperior: true, esCritica: false, esEnlaceCritico: false },
            style: {
              stroke: '#94a3b8',
              strokeWidth: 1.5
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#94a3b8',
              width: 14,
              height: 14
            }
          });

          // Precedencias operativas entre tareas (Ruta operativa de precedencias)
          if (tb.tarea.id_dependencia) {
            const rawDeps = String(tb.tarea.id_dependencia).split(',').map((d) => d.trim()).filter(Boolean);
            rawDeps.forEach((depCod) => {
              const depCodUpper = depCod.toUpperCase();
              const depInfo = taskMap.get(depCodUpper);

              if (depInfo) {
                const targetX = tb.tareaX;
                const sourceX = depInfo.x;
                // Es vecino inmediato si va hacia la derecha y no hay salto grande
                const isAdjacente =
                  targetX > sourceX && Math.abs(targetX - (sourceX + CARD_W.tarea + GAP_X)) < 24;
                const sourceNodeId = depInfo.tCod;
                const targetNodeId = tb.tCod;
                const isDepCrit = (esTarCrit && depInfo.esCritica) || (setCriticos.has(sourceNodeId.toUpperCase()) && setCriticos.has(targetNodeId.toUpperCase()));

                if (isAdjacente) {
                  // 1. Flecha horizontal directa y recta entre tareas adyacentes
                  eList.push({
                    id: `edge-dep-${sourceNodeId}-${targetNodeId}`,
                    source: sourceNodeId,
                    sourceHandle: 'tar-right',
                    target: targetNodeId,
                    targetHandle: 'tar-left',
                    type: 'straight',
                    data: {
                      esArbolSuperior: false,
                      isAdjacente: true,
                      esVecinoInmediato: true,
                      esCritica: isDepCrit,
                      esEnlaceCritico: isDepCrit
                    },
                    style: {
                      stroke: isDepCrit ? '#F59E0B' : '#6366f1',
                      strokeWidth: isDepCrit ? 2.5 : 1.8
                    },
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      color: isDepCrit ? '#F59E0B' : '#6366f1',
                      width: 14,
                      height: 14
                    }
                  });
                } else {
                  // 2. Trazo rectangular limpio en 'U' invertida por la pista inferior (Y = 700px)
                  eList.push({
                    id: `edge-dep-${sourceNodeId}-${targetNodeId}`,
                    source: sourceNodeId,
                    sourceHandle: 'tar-bottom',
                    target: targetNodeId,
                    targetHandle: 'tar-left',
                    type: 'canaletaEdge',
                    data: {
                      esArbolSuperior: false,
                      canalY: Y_LEVELS.canaletaDependencias,
                      isAdjacente: false,
                      esVecinoInmediato: false,
                      esCritica: isDepCrit,
                      esEnlaceCritico: isDepCrit
                    },
                    style: {
                      stroke: isDepCrit ? '#F59E0B' : '#6366f1',
                      strokeWidth: isDepCrit ? 2.5 : 1.8
                    },
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      color: isDepCrit ? '#F59E0B' : '#6366f1',
                      width: 14,
                      height: 14
                    }
                  });
                }
              }
            });
          }

          // Gastos de tarea (Nivel 4: Y = 780)
          if (verGastos && tb.gastos.length > 0) {
            if (tb.gastos.length === 1) {
              const g = tb.gastos[0];
              const gCod = String(g.codigo_legado || g.id).trim();
              const gastoCardX = tb.tareaX + (CARD_W.tarea - CARD_W.gasto) / 2;

              nList.push({
                id: gCod,
                type: 'gastoNode',
                draggable: false,
                targetPosition: Position.Top,
                sourcePosition: Position.Bottom,
                position: { x: safeCoord(gastoCardX, tb.tareaX), y: Y_LEVELS.gasto },
                data: { gasto: g, direccion: 'TB' }
              });

              eList.push({
                id: `edge-${tb.tCod}-${gCod}`,
                source: tb.tCod,
                sourceHandle: 'tar-bottom',
                target: gCod,
                targetHandle: 'gasto-top',
                type: 'smoothstep',
                data: { esArbolSuperior: true, esCritica: false },
                style: {
                  stroke: '#10b981',
                  strokeWidth: 1.4,
                  strokeDasharray: '3,3'
                },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 12, height: 12 }
              });
            } else {
              const totalG = tb.gastos.length * CARD_W.gasto + (tb.gastos.length - 1) * GAP_X;
              let currentGX = tb.tareaX + (CARD_W.tarea - totalG) / 2;

              tb.gastos.forEach((g) => {
                const gCod = String(g.codigo_legado || g.id).trim();
                nList.push({
                  id: gCod,
                  type: 'gastoNode',
                  draggable: false,
                  targetPosition: Position.Top,
                  sourcePosition: Position.Bottom,
                  position: { x: safeCoord(currentGX, tb.tareaX), y: Y_LEVELS.gasto },
                  data: { gasto: g, direccion: 'TB' }
                });

                eList.push({
                  id: `edge-${tb.tCod}-${gCod}`,
                  source: tb.tCod,
                  sourceHandle: 'tar-bottom',
                  target: gCod,
                  targetHandle: 'gasto-top',
                  type: 'smoothstep',
                  data: { esArbolSuperior: true, esCritica: false },
                  style: {
                    stroke: '#10b981',
                    strokeWidth: 1.4,
                    strokeDasharray: '3,3'
                  },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 12, height: 12 }
                });

                currentGX += CARD_W.gasto + GAP_X;
              });
            }
          }
        });

        // Gastos directos de Hito (sin tareas)
        if (verGastos && !soloHitos && eb.gastosDirectos.length > 0 && eb.tareas.length === 0) {
          let currentGX = eb.gastosStartX || eb.wpX;
          eb.gastosDirectos.forEach((g) => {
            const gCod = String(g.codigo_legado || g.id).trim();
            nList.push({
              id: gCod,
              type: 'gastoNode',
              draggable: false,
              targetPosition: Position.Top,
              sourcePosition: Position.Bottom,
              position: { x: safeCoord(currentGX, eb.wpX), y: Y_LEVELS.gasto },
              data: { gasto: g, direccion: 'TB' }
            });

            eList.push({
              id: `edge-${eb.hCod}-${gCod}`,
              source: eb.hCod,
              sourceHandle: 'wbs-bottom',
              target: gCod,
              targetHandle: 'gasto-top',
              type: 'smoothstep',
              data: { esArbolSuperior: true, esCritica: false },
              style: {
                stroke: '#10b981',
                strokeWidth: 1.4,
                strokeDasharray: '3,3'
              },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 12, height: 12 }
            });

            currentGX += CARD_W.gasto + GAP_X;
          });
        }
      });
    });

    // Satélite Ingresos (Y = 780)
    if (verIngresos && !soloHitos && ingresos.length > 0) {
      let ingStartX = cursorX + GAP_FASE;
      ingresos.forEach((ing) => {
        const ingNodeId = String(ing.codigo_legado || ing.id);
        nList.push({
          id: ingNodeId,
          type: 'ingresoNode',
          draggable: false,
          targetPosition: Position.Top,
          sourcePosition: Position.Bottom,
          position: { x: safeCoord(ingStartX, 60), y: Y_LEVELS.gasto },
          data: {
            ingreso: ing,
            direccion: 'TB'
          }
        });

        eList.push({
          id: `edge-${proyNodeId}-${ingNodeId}`,
          source: proyNodeId,
          sourceHandle: 'proy-bottom',
          target: ingNodeId,
          targetHandle: 'ingreso-top',
          type: 'smoothstep',
          data: { esArbolSuperior: true, esCritica: false },
          style: {
            stroke: '#10b981',
            strokeWidth: 1.6,
            strokeDasharray: '4,4'
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 14, height: 14 }
        });

        ingStartX += CARD_W.gasto + GAP_X;
      });
    }

    return { nodes: nList, edges: eList };
  }, [
    proyectoActivo,
    hitos,
    tareas,
    gastos,
    ingresos,
    notasPorEntidadMap,
    tareasPorHito,
    gastosPorHito,
    gastosPorTarea,
    calculoCPM,
    setCriticos,
    soloHitos,
    verTareas,
    verGastos,
    verIngresos
  ]);

  // =========================================================================
  // 2. PROYECCIÓN VISUAL Y ESTILOS: Aplica Ruta Crítica SIN recalcular posiciones
  // =========================================================================
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo<{ nodes: Node[]; edges: Edge[] }>(() => {
    if (!baseGraphTopology) return { nodes: [], edges: [] };

    const { nodes: rawNodes, edges: rawEdges } = baseGraphTopology;

    const styledNodes = rawNodes.map((n) => {
      const isTaskNode = n.type === 'tareaNode';
      const nIdUpper = String(n.id).trim().toUpperCase();
      const tId = (n.data as any)?.tarea?.id ? String((n.data as any).tarea.id).trim().toUpperCase() : '';
      const tCodLeg = (n.data as any)?.tarea?.codigo_legado ? String((n.data as any).tarea.codigo_legado).trim().toUpperCase() : '';

      const esCritico = isTaskNode && (
        setCriticos.has(nIdUpper) ||
        (tId && setCriticos.has(tId)) ||
        (tCodLeg && setCriticos.has(tCodLeg)) ||
        Boolean((n.data as any)?.esCritica)
      );

      const nodeStyle: React.CSSProperties = { ...(n.style || {}) };
      const nodeData = { ...(n.data as any) };
      let nodeClass = '';

      if (soloRutaCritica) {
        if (esCritico) {
          // TAREAS CRÍTICAS: 100% VISIBLE, RESPLANDECIENTE, Z-50
          nodeStyle.opacity = 1;
          nodeStyle.zIndex = 50;
          nodeStyle.filter = 'none';
          nodeStyle.pointerEvents = 'auto';
          nodeData.isCriticalFocused = true;
          nodeData.soloRutaCritica = true;
          nodeClass = 'wbs-node-focused';
        } else {
          // RESTO DE NODOS: EFECTO FANTASMA (OPACIDAD 0.18, GRAYSCALE)
          nodeStyle.opacity = 0.18;
          nodeStyle.filter = 'grayscale(60%)';
          nodeStyle.pointerEvents = 'none';
          nodeStyle.zIndex = 1;
          nodeData.isCriticalFocused = false;
          nodeData.soloRutaCritica = true;
          nodeClass = 'wbs-node-dimmed';
        }
      } else {
        nodeStyle.opacity = 1;
        nodeStyle.filter = 'none';
        nodeStyle.pointerEvents = 'auto';
        nodeStyle.zIndex = undefined;
        nodeData.isCriticalFocused = false;
        nodeData.soloRutaCritica = false;
        nodeClass = '';
      }

      return {
        ...n,
        className: nodeClass,
        style: nodeStyle,
        data: nodeData
      };
    });

    const styledEdges = rawEdges.map((e) => {
      const sourceUpper = String(e.source).trim().toUpperCase();
      const targetUpper = String(e.target).trim().toUpperCase();
      const sourceIsCrit = setCriticos.has(sourceUpper);
      const targetIsCrit = setCriticos.has(targetUpper);
      const esArbolSup = Boolean((e.data as any)?.esArbolSuperior);
      const esEnlaceCrit = Boolean((e.data as any)?.esEnlaceCritico);
      const isCriticalEdge = (sourceIsCrit && targetIsCrit && !esArbolSup) || esEnlaceCrit;

      const edgeStyle: React.CSSProperties = { ...(e.style || {}) };
      let animated = false;
      let edgeClass = '';
      let markerColor = '#94a3b8';

      if (soloRutaCritica) {
        if (isCriticalEdge) {
          // ARISTA CRÍTICA: AMBAR GRUESA BRILLANTE
          edgeStyle.stroke = '#F59E0B';
          edgeStyle.strokeWidth = 3.5;
          edgeStyle.opacity = 1.0;
          edgeStyle.filter = 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.95))';
          edgeStyle.zIndex = 50;
          animated = true;
          edgeClass = 'wbs-connector-critical';
          markerColor = '#F59E0B';
        } else {
          // ARISTA NO CRÍTICA: EFECTO FANTASMA (OPACIDAD 0.05)
          edgeStyle.opacity = 0.05;
          edgeStyle.strokeWidth = 1;
          edgeStyle.filter = 'none';
          animated = false;
          edgeClass = 'wbs-connector-dimmed';
          markerColor = '#475569';
        }
      } else {
        edgeStyle.opacity = 1;
        edgeStyle.filter = 'none';
        animated = false;
        edgeClass = '';
        markerColor = (e.data as any)?.isAdjacente ? '#6366f1' : ((e.style as any)?.stroke || '#94a3b8');
      }

      return {
        ...e,
        className: edgeClass,
        animated,
        style: edgeStyle,
        markerEnd: e.markerEnd
          ? {
              ...(typeof e.markerEnd === 'object' ? e.markerEnd : {}),
              type: MarkerType.ArrowClosed,
              color: markerColor,
              width: 14,
              height: 14
            }
          : undefined
      };
    });

    return { nodes: styledNodes, edges: styledEdges };
  }, [baseGraphTopology, soloRutaCritica, setCriticos]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    setNodes((prevNodes) => {
      if (!prevNodes || prevNodes.length === 0 || prevNodes.length !== layoutedNodes.length) {
        return layoutedNodes;
      }
      const layoutedMap = new Map(layoutedNodes.map((n) => [n.id, n]));
      return prevNodes.map((prev) => {
        const updated = layoutedMap.get(prev.id);
        if (!updated) return prev;
        return {
          ...prev,
          className: updated.className,
          style: updated.style,
          data: updated.data,
          position: updated.position
        };
      });
    });
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  // Protección inmutable de posiciones: filtrar cualquier intento de cambio de posición
  const handleNodesChange = (changes: any) => {
    const nonPositional = changes.filter((c: any) => c.type !== 'position');
    if (nonPositional.length > 0) {
      onNodesChange(nonPositional);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#040711] shadow-cobalt-3 transition-all relative ${
        isFullscreen ? 'h-screen fixed inset-0 z-[10000]' : 'h-full min-h-[680px]'
      }`}
    >
      {/* Barra de Control y Métricas Superiores */}
      <div className="bg-[#0D1526]/90 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Topología WBS Jerárquica Canónica (TB)
              <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                {nodes.length} Nodos • {edges.length} Enlaces
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              N0 Proyecto (Y=40) → N1 Fases (Y=200) → N2 WP/Hitos (Y=380) → N3 Tareas (Y=580) → Precedencias (Y=720)
            </p>
          </div>
        </div>

        {/* Controles Contextuales Unificados WBS */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Métricas CPM */}
          <div className="bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-xl flex items-center gap-2 text-xs font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <div>
              <span className="text-slate-400 text-[9px] block leading-none">DURACIÓN</span>
              <span className="text-slate-100 font-bold">{calculoCPM.duracionProyecto}d</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-xl flex items-center gap-2 text-xs font-mono tabular-nums">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <div>
              <span className="text-slate-400 text-[9px] block leading-none">CRÍTICOS</span>
              <span className="text-rose-400 font-bold">{tareasCriticasCount > 0 ? tareasCriticasCount : calculoCPM.rutaCritica.length}</span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Toggle Vista: Completa / Solo Hitos */}
          <button
            type="button"
            onClick={() => setSoloHitos(!soloHitos)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 ${
              soloHitos
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Alternar entre ver árbol completo o solo hitos y paquetes"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vista: {soloHitos ? 'Solo Hitos' : 'Completa'}</span>
          </button>

          {/* Toggle Tareas */}
          {!soloHitos && (
            <button
              type="button"
              onClick={() => setVerTareas(!verTareas)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 ${
                verTareas
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Mostrar u ocultar tareas operativas"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tareas: {verTareas ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Toggle Gastos */}
          {!soloHitos && (
            <button
              type="button"
              onClick={() => setVerGastos(!verGastos)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 ${
                verGastos
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Mostrar u ocultar capa de gastos imputados"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Gastos: {verGastos ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Toggle Ingresos */}
          {!soloHitos && (
            <button
              type="button"
              onClick={() => setVerIngresos(!verIngresos)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 ${
                verIngresos
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Mostrar u ocultar ingresos vinculados"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ingresos: {verIngresos ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Toggle Ruta Crítica */}
          <button
            type="button"
            onClick={() => setSoloRutaCritica(!soloRutaCritica)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 ${
              soloRutaCritica
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Resaltar Ruta Crítica en ámbar con atenuación no destructiva"
          >
            <Zap className={`w-3.5 h-3.5 ${soloRutaCritica ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
            <span>Ruta Crítica: {soloRutaCritica ? 'ON' : 'OFF'}</span>
          </button>

          {/* Fit View */}
          <button
            type="button"
            onClick={() => rfInstance?.fitView({ padding: 0.15, duration: 400 })}
            className="p-1.5 rounded-xl text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer active:scale-95"
            title="Ajustar y centrar diagrama"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer active:scale-95"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Alerta de Ciclos Circulares (si existen) */}
      {calculoCPM.tieneCiclos && (
        <div className="bg-rose-950/80 border-b border-rose-500/50 p-3 text-xs text-rose-200 flex items-center gap-3 z-20">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          <div>
            <span className="font-bold block">¡Dependencia Circular Detectada por Algoritmo de Kahn!</span>
            Los siguientes elementos forman un ciclo:{' '}
            <span className="font-mono font-bold text-rose-300">{calculoCPM.cicloDetectado?.join(' ⇄ ')}</span>.
          </div>
        </div>
      )}

      {/* Canvas ReactFlow con contenedor referenciado para proyección de coordenadas */}
      <div ref={canvasContainerRef} className="flex-1 w-full h-full relative bg-[#040711]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={true}
          onInit={(instance) => setRfInstance(instance)}
          onNodeMouseEnter={(event, node) => {
            if (hideTimerRef.current) {
              clearTimeout(hideTimerRef.current);
              hideTimerRef.current = null;
            }

            const containerRect = canvasContainerRef.current?.getBoundingClientRect();
            const mouseX = event.clientX;
            const mouseY = event.clientY;
            const posX = containerRect ? mouseX - containerRect.left : mouseX;
            const posY = containerRect ? mouseY - containerRect.top : mouseY;

            const d = node.data as any;

            if (node.type === 'tareaNode') {
              const t = d?.tarea as TareaRecord;
              const esCrit = d?.esCritica || false;

              let salud = { texto: 'A tiempo', esOk: true, esVencida: false };
              if (t?.estado_tarea === '04_Completado') {
                salud = { texto: 'Completado', esOk: true, esVencida: false };
              } else if (t?.fecha_programada) {
                const dProg = new Date(t.fecha_programada);
                if (!isNaN(dProg.getTime()) && dProg < new Date()) {
                  salud = { texto: 'Vencida', esOk: false, esVencida: true };
                }
              }

              setTooltipInfo({
                x: posX,
                y: posY,
                tipo: 'TAREA',
                id: node.id,
                codigo: String(t?.codigo_legado || t?.id || node.id).trim(),
                titulo: t?.nombre_tarea_actividad || node.id,
                descripcion: t?.notas_impedimentos || '',
                esCritica: esCrit,
                salud,
                gridItems: [
                  { label: 'Fecha', valor: formatFecha(t?.fecha_programada), icono: '📅' },
                  { label: 'Responsable', valor: t?.responsable_ejecutor || 'Sin asignar', icono: '👤' },
                  { label: 'Est', valor: `${t?.horas_estimadas || 0}h`, icono: '⏱️' },
                  { label: 'Real', valor: `${t?.horas_reales || 0}h`, icono: '⌛' }
                ],
                predecesora: t?.id_dependencia ? String(t.id_dependencia).trim() : undefined
              });
            } else if (node.type === 'wbsNode') {
              const nCPM = d?.nodo as NodoCalculadoCPM;
              const esCrit = nCPM?.esCritico || false;
              setTooltipInfo({
                x: posX,
                y: posY,
                tipo: 'WBS',
                id: node.id,
                codigo: String(nCPM?.codigo || node.id).trim(),
                titulo: nCPM?.nombre || node.id,
                descripcion: `Entregable WBS ${nCPM?.wbsCode || '1.0'} • Duración: ${nCPM?.duracion || 0}d`,
                esCritica: esCrit,
                salud: esCrit
                  ? { texto: 'Ruta Crítica', esCritico: true }
                  : { texto: 'A tiempo', esOk: true },
                gridItems: [
                  { label: 'Duración', valor: `${nCPM?.duracion || 0}d`, icono: '⏱️' },
                  { label: 'Holgura (TH)', valor: `${nCPM?.holguraTotal || 0}d`, icono: '⚓' },
                  { label: 'Precoz (PE/PP)', valor: `${nCPM?.es || 0}d / ${nCPM?.ef || 0}d`, icono: '🟢' },
                  { label: 'Tardío (LE/LP)', valor: `${nCPM?.ls || 0}d / ${nCPM?.lf || 0}d`, icono: '🔴' }
                ]
              });
            } else if (node.type === 'faseNode') {
              setTooltipInfo({
                x: posX,
                y: posY,
                tipo: 'FASE',
                id: node.id,
                codigo: node.id,
                titulo: d?.nombreFase || node.id,
                descripcion: `Fase del proyecto con ${d?.numWP || 0} paquetes y ${d?.numTareasTotal || 0} tareas.`,
                gridItems: [
                  { label: 'Ponderación', valor: `${d?.pesoPct || 0}%`, icono: '⚖️' },
                  { label: 'Paquetes WP', valor: `${d?.numWP || 0}`, icono: '📦' },
                  { label: 'Tareas Total', valor: `${d?.numTareasTotal || 0}`, icono: '📋' },
                  { label: 'Hitos Control', valor: `${d?.numMarcadores || 0}`, icono: '🚩' }
                ]
              });
            } else if (node.type === 'proyectoNode') {
              setTooltipInfo({
                x: posX,
                y: posY,
                tipo: 'PROYECTO',
                id: node.id,
                codigo: String(proyectoActivo?.codigo_legado || proyectoActivo?.id || node.id).trim(),
                titulo: d?.proyecto?.nombre_proyecto || node.id,
                descripcion: d?.proyecto?.descripcion || 'Proyecto Matriz Canónico',
                gridItems: [
                  { label: 'Avance Real', valor: `${d?.pctAvance || 0}%`, icono: '📈' },
                  { label: 'Ingresos Totales', valor: `PEN ${(d?.ingresosTotal || 0).toLocaleString()}`, icono: '💰' },
                  { label: 'Fecha Inicio', valor: formatFecha(d?.proyecto?.fecha_inicio_plan), icono: '🚀' },
                  { label: 'Fecha Fin Plan', valor: formatFecha(d?.proyecto?.fecha_fin_plan), icono: '🏁' }
                ]
              });
            } else if (node.type === 'gastoNode') {
              const g = d?.gasto as GastoRecord;
              setTooltipInfo({
                x: posX,
                y: posY,
                tipo: 'GASTO',
                id: node.id,
                codigo: String(g?.codigo_legado || g?.id || node.id).trim(),
                titulo: g?.descripcion_gasto || 'Gasto',
                gridItems: [
                  { label: 'Monto PEN', valor: `PEN ${(g?.monto_pen || g?.monto_original || 0).toLocaleString()}`, icono: '💵' },
                  { label: 'Categoría', valor: g?.categoria_gasto || 'General', icono: '🏷️' },
                  { label: 'Estado Pago', valor: g?.estado_pago || 'Pendiente', icono: '💳' },
                  { label: 'Fecha Gasto', valor: formatFecha(g?.fecha_gasto), icono: '📅' }
                ],
                comprobanteUrl: g?.comprobante_url
              });
            } else if (node.type === 'ingresoNode') {
              const ing = d?.ingreso as IngresoRecord;
              setTooltipInfo({
                x: posX,
                y: posY,
                tipo: 'INGRESO',
                id: node.id,
                codigo: String(ing?.codigo_legado || ing?.id || node.id).trim(),
                titulo: ing?.descripcion_ingreso || 'Ingreso',
                gridItems: [
                  { label: 'Monto PEN', valor: `PEN ${(ing?.monto_pen || ing?.monto_original || 0).toLocaleString()}`, icono: '💰' },
                  { label: 'Categoría', valor: ing?.categoria_ingreso || 'Honorarios', icono: '🏷️' },
                  { label: 'Estado Cobro', valor: ing?.estado_cobro || 'Pendiente', icono: '🧾' },
                  { label: 'Fecha Cobro', valor: formatFecha((ing as any)?.fecha_cobro || (ing as any)?.fecha_emision), icono: '📅' }
                ]
              });
            }
          }}
          onNodeMouseLeave={() => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => {
              setTooltipInfo(null);
            }, 200);
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.15}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          className="bg-[#040711]"
        >
          <Background color="#1e293b" gap={24} size={1.5} />
          <Controls className="!bg-[#0D1526]/90 !border !border-slate-800 !rounded-xl !overflow-hidden !shadow-cobalt-1 [&>button]:!bg-[#0D1526] [&>button]:!border-slate-800 [&>button]:!text-slate-300 hover:[&>button]:!bg-slate-800" />
          <MiniMap
            nodeColor={(n) => {
              switch (n.type) {
                case 'proyectoNode':
                  return '#6366f1';
                case 'faseNode':
                  return '#8b5cf6';
                case 'wbsNode': {
                  const data = n.data as any;
                  if (data?.nodo?.esCritico) return '#f43f5e';
                  if (data?.nodo?.tipo === 'HITO_MARCADOR') return '#a855f7';
                  return '#0ea5e9';
                }
                case 'tareaNode': {
                  const data = n.data as any;
                  return data?.esCritica ? '#f59e0b' : '#64748b';
                }
                case 'gastoNode':
                  return '#f59e0b';
                case 'ingresoNode':
                  return '#10b981';
                default:
                  return '#38bdf8';
              }
            }}
            maskColor="rgba(4, 7, 17, 0.75)"
            className="!bg-[#0D1526]/90 !border !border-slate-800 !rounded-xl !overflow-hidden !shadow-cobalt-1"
          />

          {/* Panel Informativo de Balance WBS */}
          <Panel position="bottom-left" className="m-3">
            <div className="bg-[#0D1526]/95 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-cobalt-1 max-w-xs space-y-2">
              <span className="text-[10.5px] font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1">
                Balance de Ponderaciones por Fase
              </span>
              <div className="space-y-1">
                {calculoCPM.balancePonderaciones.map((b) => (
                  <div key={b.fase} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[10px] truncate max-w-[160px]">
                      {b.fase}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
                      <span className={b.estaBalanceada ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {Math.round(b.sumaPesos * 100)}%
                      </span>
                      {b.estaBalanceada ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1 rounded border border-amber-500/20">
                          Desbalance
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </ReactFlow>

        {/* Popover Contextual Dinámico Flotante 360° */}
        <TooltipFlotanteWBS
          info={tooltipInfo}
          onMouseEnter={() => {
            if (hideTimerRef.current) {
              clearTimeout(hideTimerRef.current);
              hideTimerRef.current = null;
            }
          }}
          onMouseLeave={() => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => {
              setTooltipInfo(null);
            }, 200);
          }}
        />
      </div>
    </div>
  );
};
