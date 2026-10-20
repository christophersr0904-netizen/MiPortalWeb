import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FileDown,
  Clock,
  Compass,
  GitFork,
  CheckCircle2,
  Scale,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
  Trash2,
  Edit3,
  Plus,
  DollarSign,
  Receipt,
  Calendar,
  Check,
  ExternalLink,
  Package,
  Gem,
  RotateCcw,
  Bot,
  Flame,
  FolderOpen,
  Circle
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { GrafoWBS } from '../WBS/GrafoWBS';
import { calcularRutaCriticaCPM } from '../../services/cpmService';
import { ModalGasto } from '../Modals/ModalGasto';
import { ModalTareaFlow } from '../Modals/ModalTareaFlow';
import Swal from 'sweetalert2';
import type { GastoRecord, TareaRecord, HitoWbsRecord } from '../../types';

interface ViewDetalle360Props {
  proyectoIdSeleccionado?: string | null;
  onVolverAlPortafolio: () => void;
}

type SubTab360 = 'wbs' | 'evm' | 'tradeoff' | 'gobernanza';

interface CriterioTradeOff {
  id: string;
  nombre: string;
  peso: number;
  scoreA: number;
  scoreB: number;
  scoreC: number;
}

export const ViewDetalle360: React.FC<ViewDetalle360Props> = ({
  proyectoIdSeleccionado,
  onVolverAlPortafolio
}) => {
  const [subTabActiva, setSubTabActiva] = useState<SubTab360>('wbs');
  const [hitosExpandidos, setHitosExpandidos] = useState<Record<string, boolean>>({});

  // Modales interactivos
  const [isModalGastoOpen, setIsModalGastoOpen] = useState(false);
  const [isModalTareaOpen, setIsModalTareaOpen] = useState(false);
  const [tareaAEditarId, setTareaAEditarId] = useState<string | null>(null);
  const [hitoPreseleccionadoGasto, setHitoPreseleccionadoGasto] = useState<string | undefined>(undefined);

  // Estado de Matriz Trade-Off interactiva
  const [toTitulo, setToTitulo] = useState('Selección de Infraestructura y Servidor Cloud');
  const [toTipo, setToTipo] = useState('Tecnología / Software');
  const [toOpcionA, setToOpcionA] = useState('AWS / Arquitectura Estándar');
  const [toOpcionB, setToOpcionB] = useState('GCP / Modelo Serverless');
  const [toOpcionC, setToOpcionC] = useState('On-Premise / Híbrido');
  const [criteriosTradeOff, setCriteriosTradeOff] = useState<CriterioTradeOff[]>([
    { id: 'crit-1', nombre: 'Costo Total de Propiedad (TCO)', peso: 35, scoreA: 3.5, scoreB: 4.5, scoreC: 2.0 },
    { id: 'crit-2', nombre: 'Velocidad de Despliegue y Time-to-Market', peso: 25, scoreA: 4.0, scoreB: 4.8, scoreC: 2.5 },
    { id: 'crit-3', nombre: 'Seguridad, Gobernanza y SLA 99.9%', peso: 20, scoreA: 4.5, scoreB: 4.2, scoreC: 4.0 },
    { id: 'crit-4', nombre: 'Facilidad de Soporte y Curva de Aprendizaje', peso: 20, scoreA: 4.0, scoreB: 4.2, scoreC: 3.0 }
  ]);
  const [historialTradeOff, setHistorialTradeOff] = useState<
    Array<{ id: string; fecha: string; titulo: string; tipo: string; ganador: string; score: number }>
  >([]);

  // Consultas reactivas en Dexie
  const proyectos = useLiveQuery(() => db.proyectos.toArray(), []) ?? [];
  const hitos = useLiveQuery(() => db.hitos_wbs.toArray(), []) ?? [];
  const tareas = useLiveQuery(() => db.tareas.toArray(), []) ?? [];
  const gastos = useLiveQuery(() => db.gastos.toArray(), []) ?? [];

  // Proyecto activo seleccionado o primero disponible
  const proyectoActivo = useMemo(() => {
    if (!proyectos || proyectos.length === 0) return null;
    if (proyectoIdSeleccionado) {
      const target = String(proyectoIdSeleccionado).trim().toUpperCase();
      return (
        proyectos.find((p: any) => {
          const pId = String(p.id || '').trim().toUpperCase();
          const pCod = String(p.codigo_legado || p.ID_Proyecto || '').trim().toUpperCase();
          return pId === target || pCod === target;
        }) || proyectos[0]
      );
    }
    return proyectos[0];
  }, [proyectos, proyectoIdSeleccionado]);

  const proyCod = proyectoActivo?.codigo_legado || proyectoActivo?.id || '';
  const proyId = proyectoActivo?.id || '';

  // Hitos del proyecto activo
  const hitosProyecto = useMemo(() => {
    if (!proyectoActivo) return [];
    const cUpper = String(proyCod || '').trim().toUpperCase();
    const idUpper = String(proyId || '').trim().toUpperCase();
    return hitos.filter((h: any) => {
      const hProy = String(h.proyecto_id || h.ID_Proyecto || '').trim().toUpperCase();
      const hProyCod = String(h.proyecto_codigo || '').trim().toUpperCase();
      const hCod = String(h.codigo_legado || h.id || '').trim().toUpperCase();
      return (
        (cUpper !== '' && (hProy === cUpper || hProyCod === cUpper || hCod.startsWith(cUpper))) ||
        (idUpper !== '' && hProy === idUpper)
      );
    });
  }, [hitos, proyectoActivo, proyId, proyCod]);

  // Set de IDs de hitos del proyecto
  const idsHitosSet = useMemo(() => {
    const s = new Set<string>();
    hitosProyecto.forEach((h: any) => {
      if (h.id) s.add(String(h.id).toUpperCase());
      if (h.codigo_legado) s.add(String(h.codigo_legado).toUpperCase());
      if (h.ID_Hito) s.add(String(h.ID_Hito).toUpperCase());
    });
    return s;
  }, [hitosProyecto]);

  // Tareas del proyecto activo
  const tareasProyecto = useMemo(() => {
    if (!proyectoActivo) return [];
    return tareas.filter((t: any) => {
      const tProy = String(t.proyecto_codigo || t.ID_Proyecto || t.proyecto_id || '').toUpperCase();
      const tHito = String(t.hito_codigo || t.ID_Hito || t.id_hito || '').toUpperCase();
      return tProy === proyCod.toUpperCase() || tProy === proyId.toUpperCase() || (tHito && idsHitosSet.has(tHito));
    });
  }, [tareas, proyectoActivo, proyCod, proyId, idsHitosSet]);

  // Mapas de tareas por hito
  const { tareasPorHito, tareasGenerales, tareaIdToHitoMap } = useMemo(() => {
    const porHito = new Map<string, TareaRecord[]>();
    const generales: TareaRecord[] = [];
    const idToHito = new Map<string, string>();

    tareasProyecto.forEach((t: any) => {
      const hKey = String(t.hito_codigo || t.ID_Hito || t.id_hito || '').trim().toUpperCase();
      const tId = String(t.codigo_legado || t.ID_Tarea || t.id || '').trim().toUpperCase();

      if (hKey && idsHitosSet.has(hKey)) {
        if (!porHito.has(hKey)) porHito.set(hKey, []);
        porHito.get(hKey)!.push(t);
        if (tId) idToHito.set(tId, hKey);
      } else {
        generales.push(t);
      }
    });

    return { tareasPorHito: porHito, tareasGenerales: generales, tareaIdToHitoMap: idToHito };
  }, [tareasProyecto, idsHitosSet]);

  // Gastos del proyecto activo (por hito y generales)
  const { gastosPorHito, gastosGenerales, gastosProyectoTotal } = useMemo(() => {
    const porHito = new Map<string, GastoRecord[]>();
    const generales: GastoRecord[] = [];
    const todosProy: GastoRecord[] = [];

    if (!gastos) return { gastosPorHito: porHito, gastosGenerales: generales, gastosProyectoTotal: todosProy };

    gastos.forEach((g: any) => {
      const gProy = String(g.ID_Proyecto || g.proyecto_id || '').trim().toUpperCase();
      let gHito = String(g.ID_Hito || g.id_hito || '').trim().toUpperCase();
      const gTarea = String(g.ID_Tarea || g.ID_Entidad_Vinculada || g.id_origen_vinculado || '').trim().toUpperCase();

      if (!gHito && gTarea && tareaIdToHitoMap.has(gTarea)) {
        gHito = tareaIdToHitoMap.get(gTarea)!;
      }

      const perteneceProy =
        gProy === proyCod.toUpperCase() ||
        gProy === proyId.toUpperCase() ||
        (gHito && idsHitosSet.has(gHito)) ||
        (gTarea && tareaIdToHitoMap.has(gTarea));

      if (perteneceProy) {
        todosProy.push(g);
        if (gHito && idsHitosSet.has(gHito)) {
          if (!porHito.has(gHito)) porHito.set(gHito, []);
          porHito.get(gHito)!.push(g);
        } else {
          generales.push(g);
        }
      }
    });

    return { gastosPorHito: porHito, gastosGenerales: generales, gastosProyectoTotal: todosProy };
  }, [gastos, proyCod, proyId, idsHitosSet, tareaIdToHitoMap]);

  // Agrupamiento WBS Nivel 1 por Fase_Asociada
  const fasesAgrupadas = useMemo(() => {
    const mapaFases = new Map<
      string,
      {
        nombre: string;
        paquetes: HitoWbsRecord[];
        marcadores: HitoWbsRecord[];
        pesoTotal: number;
      }
    >();

    const fasesOrden: string[] = [];

    hitosProyecto.forEach((h: any) => {
      const rawFase = String(h.fase_asociada || h.Fase_Asociada || h.fase || '').trim();
      const faseKey = rawFase || 'Fase General';

      if (!mapaFases.has(faseKey)) {
        mapaFases.set(faseKey, {
          nombre: faseKey,
          paquetes: [],
          marcadores: [],
          pesoTotal: 0
        });
        fasesOrden.push(faseKey);
      }

      const grupo = mapaFases.get(faseKey)!;
      const peso = parseFloat(h.peso_ponderado_pct || h.Peso_Ponderado_Pct || 0) || 0;
      grupo.pesoTotal += peso;

      const tipo = String(h.tipo_elemento_wbs || h.Tipo_Elemento_WBS || '').toUpperCase();
      if (tipo === 'HITO_MARCADOR' || h.codigo_legado?.startsWith('HIT-')) {
        grupo.marcadores.push(h);
      } else {
        grupo.paquetes.push(h);
      }
    });

    // Ordenamiento determinista de fases
    const cicloEstandar = [
      'iniciacion',
      'planificacion',
      'diseno',
      'ejecucion',
      'procura',
      'construccion',
      'validacion',
      'pruebas',
      'cierre'
    ];

    fasesOrden.sort((a, b) => {
      const matchA = a.match(/\d+/);
      const matchB = b.match(/\d+/);
      if (matchA && matchB) return parseInt(matchA[0], 10) - parseInt(matchB[0], 10);

      const normA = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normB = b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const idxA = cicloEstandar.findIndex((c) => normA.includes(c));
      const idxB = cicloEstandar.findIndex((c) => normB.includes(c));
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;

      return a.localeCompare(b);
    });

    return fasesOrden.map((fKey) => mapaFases.get(fKey)!);
  }, [hitosProyecto]);

  // Cálculo CPM sobre hitos del proyecto
  const cpmCalculo = useMemo(() => {
    return calcularRutaCriticaCPM(hitosProyecto);
  }, [hitosProyecto]);

  if (!proyectoActivo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#040711] text-slate-400">
        <Compass className="w-12 h-12 mb-3 text-indigo-400 animate-pulse" />
        <p className="text-sm font-semibold">Cargando detalles del proyecto...</p>
      </div>
    );
  }

  // Métricas financieras y progreso reales
  const bac = parseFloat(proyectoActivo.presupuesto_tope || (proyectoActivo as any).presupuesto || 0) || 0;

  // Costo Real Pagado (AC) y Costo Comprometido (CC)
  let acCalculado = 0;
  let ccCalculado = 0;

  gastosProyectoTotal.forEach((g: any) => {
    const monto = parseFloat(g.Monto_PEN || g.Monto_Moneda_Base || g.monto_pen || g.monto || 0) || 0;
    const estado = String(g.Estado_Pago || g.estado_pago || g.Estado || '').toLowerCase();
    const esPagado = estado === 'pagado' || g.conciliado === true || String(g.modalidad || '').includes('Real');
    if (esPagado) {
      acCalculado += monto;
    } else {
      ccCalculado += monto;
    }
  });

  const ac = acCalculado > 0 ? acCalculado : parseFloat(String(proyectoActivo.costo_ejecutado_real_pen || 0)) || 0;
  const cc = ccCalculado;

  // Progreso físico ponderado
  const avReal = proyectoActivo.avance_real_pct ?? (proyectoActivo as any).Avance_Real_Pct ?? 0;
  const pctAvance = Math.round(avReal <= 1 && avReal > 0 ? avReal * 100 : avReal);
  const burnPct = bac > 0 ? Math.round((ac / bac) * 100) : 0;
  const saldoRestante = Math.max(0, bac - ac);

  // Progreso temporal determinista para PV
  const fInicio = proyectoActivo.fecha_inicio_plan ? new Date(proyectoActivo.fecha_inicio_plan).getTime() : 0;
  const fFin = proyectoActivo.fecha_fin_plan ? new Date(proyectoActivo.fecha_fin_plan).getTime() : 0;
  const fHoy = Date.now();
  let pctTiempo = 50;
  if (fInicio > 0 && fFin > fInicio) {
    pctTiempo = Math.min(100, Math.max(0, Math.round(((fHoy - fInicio) / (fFin - fInicio)) * 100)));
  }

  const ev = bac * (pctAvance / 100);
  const pv = bac * (pctTiempo / 100);
  const cpi = ac > 0 ? Number((ev / ac).toFixed(2)) : 1.0;
  const spi = pv > 0 ? Number((ev / pv).toFixed(2)) : 1.0;
  const cv = ev - ac;
  const sv = ev - pv;
  const eac = cpi > 0 ? Math.round(bac / cpi) : bac;
  const vac = bac - eac;

  const tareasTotal = tareasProyecto.length;
  const tareasCompletadas = tareasProyecto.filter((t: any) =>
    String(t.Estado_Tarea || t.estado_tarea || '').includes('Completad')
  ).length;

  // Días transcurridos vs días totales
  const totalDias = fInicio > 0 && fFin > fInicio ? Math.round((fFin - fInicio) / (1000 * 60 * 60 * 24)) : 0;
  const diasTranscurridos = fInicio > 0 ? Math.max(0, Math.round((fHoy - fInicio) / (1000 * 60 * 60 * 24))) : 0;

  // Días sin revisión de gobernanza
  const revDate = proyectoActivo.ultima_revision || (proyectoActivo as any).Ultima_Revision;
  const diasSinRevision = revDate
    ? Math.max(0, Math.floor((fHoy - new Date(revDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Dictamen Ejecutivo PMO
  let dictamenPmo = '';
  if (cpi >= 1 && spi >= 1) {
    dictamenPmo = `Proyecto en estado ÓPTIMO. El rendimiento en costo (CPI: ${cpi.toFixed(2)}) y en cronograma (SPI: ${spi.toFixed(2)}) superan la línea base. Las variaciones son favorables (+PEN ${cv.toLocaleString('es-PE', { maximumFractionDigits: 1 })} en costo). Continuar bajo el plan previsto.`;
  } else if (cpi >= 1 && spi < 1) {
    dictamenPmo = `DESFASE TEMPORAL CON AHORRO EN COSTOS (CPI: ${cpi.toFixed(2)}, SPI: ${spi.toFixed(2)}). El cronograma presenta un retraso equivalente a SV: PEN ${sv.toLocaleString('es-PE', { maximumFractionDigits: 1 })}. Se sugiere evaluar la asignación de holguras presupuestarias a tareas críticas para acelerar la entrega.`;
  } else if (cpi < 1 && spi >= 1) {
    dictamenPmo = `SOBRECOSTO DETECTADO CON RITMO ADECUADO (CPI: ${cpi.toFixed(2)}, SPI: ${spi.toFixed(2)}). La ejecución física avanza a tiempo, pero el costo real supera el valor ganado (CV: PEN ${cv.toLocaleString('es-PE', { maximumFractionDigits: 1 })}). La proyección final a la conclusión (EAC) se estima en PEN ${eac.toLocaleString('es-PE')}.`;
  } else {
    dictamenPmo = `ALERTA ROJA PMO: DIVERGENCIA CRÍTICA EN COSTO Y PLAZO (CPI: ${cpi.toFixed(2)}, SPI: ${spi.toFixed(2)}). Se registran pérdidas tanto en cronograma como en presupuesto. Se requiere convocar a sesión de control ejecutivo para recortar alcance no esencial o refinanciar el proyecto.`;
  }

  // Acciones en Cascada
  const toggleHito = (id: string) => {
    setHitosExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTodosHitos = (expandir: boolean) => {
    const nuevo: Record<string, boolean> = {};
    hitosProyecto.forEach((h: any) => {
      nuevo[h.id] = expandir;
      if (h.codigo_legado) nuevo[h.codigo_legado] = expandir;
    });
    setHitosExpandidos(nuevo);
  };

  // Checkpoint DoD toggle
  const toggleCompletarMarcador = async (hito: HitoWbsRecord) => {
    const esCompletado = hito.estado === '03_Completado' || (hito as any).Estado === '03_Completado';
    const nuevoEstado = esCompletado ? '01_Pendiente' : '03_Completado';
    await db.hitos_wbs.update(hito.id, {
      estado: nuevoEstado,
      fecha_real_fin: nuevoEstado === '03_Completado' ? new Date().toISOString().split('T')[0] : ('' as any)
    });
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: esCompletado ? 'Marcador reabierto' : 'Checkpoint DoD validado',
      timer: 1600,
      showConfirmButton: false,
      background: '#0D1526',
      color: '#f8fafc'
    });
  };

  // Crear entregable dentro de una fase
  const abrirModalCrearHitoFase = (nombreFase: string) => {
    Swal.fire({
      title: `Nuevo Entregable en ${nombreFase}`,
      html: `
        <div class="space-y-3 text-left text-xs">
          <div>
            <label class="block font-semibold mb-1 text-slate-300">Nombre del Entregable / Hito</label>
            <input id="swal-hito-nombre" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100" placeholder="Ej. Diseño de Arquitectura Cloud" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold mb-1 text-slate-300">Tipo de Elemento</label>
              <select id="swal-hito-tipo" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100">
                <option value="PAQUETE_TRABAJO">Paquete de Trabajo (WP)</option>
                <option value="HITO_MARCADOR">Checkpoint DoD (HIT)</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold mb-1 text-slate-300">Presupuesto PEN</label>
              <input id="swal-hito-costo" type="number" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label class="block font-semibold mb-1 text-slate-300">Fecha Límite Plan</label>
            <input id="swal-hito-fecha" type="date" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear Entregable',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
      background: '#0D1526',
      color: '#f8fafc',
      preConfirm: () => {
        const nombre = (document.getElementById('swal-hito-nombre') as HTMLInputElement)?.value;
        const tipo = (document.getElementById('swal-hito-tipo') as HTMLSelectElement)?.value;
        const costo = parseFloat((document.getElementById('swal-hito-costo') as HTMLInputElement)?.value || '0');
        const fecha = (document.getElementById('swal-hito-fecha') as HTMLInputElement)?.value;
        if (!nombre) {
          Swal.showValidationMessage('El nombre del entregable es requerido');
          return false;
        }
        return { nombre, tipo, costo, fecha };
      }
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        const count = hitosProyecto.length + 1;
        const prefijo = res.value.tipo === 'HITO_MARCADOR' ? 'HIT' : 'WP';
        const nuevoCodigo = `${prefijo}-${String(count).padStart(3, '0')}`;

        await db.hitos_wbs.add({
          id: `hito-${Date.now()}`,
          codigo_legado: nuevoCodigo,
          proyecto_id: proyId,
          proyecto_codigo: proyCod,
          nombre_hito: res.value.nombre,
          nombre_elemento: res.value.nombre,
          fase_asociada: nombreFase,
          tipo_elemento_wbs: res.value.tipo as any,
          estado: '01_Pendiente',
          peso_pct: 0.1,
          peso_ponderado_pct: 0.1,
          presupuesto_asignado: res.value.tipo === 'HITO_MARCADOR' ? 0 : res.value.costo,
          fecha_limite: res.value.fecha || new Date().toISOString().split('T')[0],
          fecha_limite_plan: res.value.fecha || new Date().toISOString().split('T')[0],
          duracion_dias: res.value.tipo === 'HITO_MARCADOR' ? 0 : 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any);

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Entregable ${nuevoCodigo} creado`,
          timer: 1600,
          showConfirmButton: false,
          background: '#0D1526',
          color: '#f8fafc'
        });
      }
    });
  };

  // Check-in de gobernanza hoy
  const registrarCheckinHoy = async () => {
    const hoyStr = new Date().toISOString().split('T')[0];
    await db.proyectos.update(proyectoActivo.id, {
      ultima_revision: hoyStr
    } as any);
    Swal.fire({
      icon: 'success',
      title: 'Check-in de Control Registrado',
      text: `Se actualizó la fecha de auditoría de ${proyectoActivo.codigo_legado} a ${hoyStr}.`,
      background: '#0D1526',
      color: '#f8fafc',
      confirmButtonColor: '#4f46e5'
    });
  };

  // Guardar Decisión de Trade-off
  const guardarDecisionTradeOff = () => {
    // Calcular alternativa ganadora
    let sumaA = 0;
    let sumaB = 0;
    let sumaC = 0;
    let pesoTotal = 0;

    criteriosTradeOff.forEach((c) => {
      pesoTotal += c.peso;
      sumaA += (c.peso / 100) * c.scoreA;
      sumaB += (c.peso / 100) * c.scoreB;
      sumaC += (c.peso / 100) * c.scoreC;
    });

    let ganador = toOpcionA;
    let scoreGanador = sumaA;
    if (sumaB > scoreGanador) {
      ganador = toOpcionB;
      scoreGanador = sumaB;
    }
    if (sumaC > scoreGanador) {
      ganador = toOpcionC;
      scoreGanador = sumaC;
    }

    const nuevaDecision = {
      id: `to-${Date.now()}`,
      fecha: new Date().toLocaleDateString('es-PE'),
      titulo: toTitulo,
      tipo: toTipo,
      ganador,
      score: Number(scoreGanador.toFixed(2))
    };

    setHistorialTradeOff([nuevaDecision, ...historialTradeOff]);
    Swal.fire({
      icon: 'success',
      title: 'Decisión Aprobada y Guardada',
      text: `Alternativa recomendada: ${ganador} (Score: ${scoreGanador.toFixed(2)}/5.00)`,
      background: '#0D1526',
      color: '#f8fafc',
      confirmButtonColor: '#4f46e5'
    });
  };

  return (
    <div
      id="vista-detalle-proyecto-wrapper"
      className="flex-1 flex flex-col h-full w-full overflow-y-auto p-4 md:p-8 bg-[#040711] transition-colors duration-200 custom-scrollbar space-y-6"
    >
      {/* BARRA DE NAVEGACIÓN SUPERIOR Y ACCIONES RÁPIDAS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onVolverAlPortafolio}
          className="px-3 py-1.5 rounded-xl border border-slate-800 bg-[#0D1526] text-slate-300 hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Portafolio</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              Swal.fire({
                title: 'Exportar Informe',
                text: `Generando PDF ejecutivo para ${proyectoActivo.codigo_legado}...`,
                icon: 'info',
                background: '#0D1526',
                color: '#f8fafc'
              })
            }
            className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
            title="Descargar Informe Ejecutivo PDF de este Proyecto"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar Informe</span>
          </button>

          <button
            type="button"
            onClick={() => {
              Swal.fire({
                title: `Editar ${proyectoActivo.codigo_legado}`,
                input: 'text',
                inputValue: proyectoActivo.nombre_proyecto || (proyectoActivo as any).nombre,
                showCancelButton: true,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#4f46e5',
                background: '#0D1526',
                color: '#f8fafc'
              }).then(async (res) => {
                if (res.isConfirmed && res.value) {
                  await db.proyectos.update(proyectoActivo.id, {
                    nombre_proyecto: res.value
                  } as any);
                  Swal.fire({
                    icon: 'success',
                    title: 'Proyecto actualizado',
                    timer: 1400,
                    showConfirmButton: false,
                    background: '#0D1526',
                    color: '#f8fafc'
                  });
                }
              });
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-800 bg-[#0D1526] text-slate-300 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
            title="Editar parámetros del proyecto"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              Swal.fire({
                title: '¿Eliminar proyecto?',
                text: `Se eliminará ${proyectoActivo.codigo_legado} y sus dependencias.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e11d48',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                background: '#0D1526',
                color: '#f8fafc'
              }).then(async (res) => {
                if (res.isConfirmed) {
                  await db.proyectos.delete(proyectoActivo.id);
                  onVolverAlPortafolio();
                }
              });
            }}
            className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition shadow-2xs cursor-pointer"
            title="Eliminar este proyecto y todas sus dependencias"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HERO CARD DEL PROYECTO & OKR / DOD */}
      <div className="portal-surface bg-[#0D1526] rounded-2xl p-6 border border-slate-800/40 shadow-xs relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado Principal del Proyecto */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/60 pb-5 mb-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-extrabold bg-slate-900 text-white px-2.5 py-0.5 rounded-lg tracking-wide border border-slate-800 shadow-2xs">
                {proyectoActivo.codigo_legado || proyectoActivo.id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800 font-bold">
                {proyectoActivo.tipo_iniciativa || 'General'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                {proyectoActivo.estado_proyecto || 'En Ejecución'}
              </span>
              <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800 flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>{proyectoActivo.health_status || 'Saludable'}</span>
              </span>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-100 leading-tight tracking-tight">
              {proyectoActivo.nombre_proyecto || (proyectoActivo as any).nombre}
            </h1>
          </div>

          {/* Barra de Progreso Temporal */}
          <div className="w-full lg:w-80 bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Cronograma Temporal</span>
              </span>
              <span className="font-mono tabular-nums text-[11px] font-bold text-slate-400">
                {diasTranscurridos} / {totalDias} días
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, pctTiempo)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tabular-nums">
              <span>Inicio: {proyectoActivo.fecha_inicio_plan || '-'}</span>
              <span className="font-bold text-indigo-400">{pctTiempo}% tiempo</span>
              <span>Fin: {proyectoActivo.fecha_fin_plan || '-'}</span>
            </div>
          </div>
        </div>

        {/* North Star OKR & Criterios DoD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6 relative z-10">
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-indigo-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>North Star OKR</span>
            </span>
            <p className="text-slate-300 leading-relaxed font-medium">
              {proyectoActivo.north_star_okr || 'Objetivo de impacto no definido.'}
            </p>
          </div>
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-indigo-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Criterios de Aceptación (DoD)</span>
            </span>
            <p className="text-slate-300 leading-relaxed font-medium">
              {proyectoActivo.criterios_aceptacion_dod || 'Verificación estricta de entregables e hitos.'}
            </p>
          </div>
        </div>

        {/* BENTO GRID DE KPIS FINANCIEROS Y OPERATIVOS 360° */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2 border-t border-slate-800">
          {/* KPI 1: Salud Operativa */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="uppercase tracking-wider">Salud Operativa</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            </div>
            <div className="my-2">
              <div className="text-base font-black text-slate-100 leading-tight">
                {proyectoActivo.health_status || 'Saludable'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {cpmCalculo.rutaCritica.length} hitos críticos
              </div>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <span>Semáforo dinámico</span>
            </div>
          </div>

          {/* KPI 2: Burn Rate */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="uppercase tracking-wider">Burn Rate</span>
              <span className="font-mono tabular-nums text-xs font-bold text-slate-300">{burnPct}%</span>
            </div>
            <div className="my-1.5 space-y-1.5">
              <div className="flex items-baseline justify-between gap-1">
                <b className="text-sm font-black font-mono tabular-nums text-emerald-400">
                  PEN {ac.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </b>
                <span className="text-[10px] text-slate-400">de</span>
                <b className="text-xs font-mono tabular-nums font-bold text-slate-300">
                  PEN {bac.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </b>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    burnPct > 100 ? 'bg-rose-500' : burnPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                  } rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(burnPct, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-[10px] font-medium text-slate-400">
              {burnPct > 100 ? 'Sobregiro presupuestario' : 'En margen presupuestal'}
            </div>
          </div>

          {/* KPI 3: Progreso Físico */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Progreso Físico
              </span>
              <div className="text-xs font-bold text-slate-200 font-mono tabular-nums">
                {tareasCompletadas} / {tareasTotal} Tareas
              </div>
              <div className="text-[10px] text-slate-400 font-mono tabular-nums">Avance cascada</div>
            </div>
            <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-400 transition-all duration-700 ease-out"
                  strokeDasharray={`${pctAvance}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-black font-mono tabular-nums text-slate-100">
                {pctAvance}%
              </span>
            </div>
          </div>

          {/* KPI 4: Saldo / CPI */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="uppercase tracking-wider">Saldo / Compromiso</span>
              <span className="font-mono tabular-nums text-[10px] text-slate-400">CPI</span>
            </div>
            <div className="my-1">
              <div className="text-sm font-black font-mono tabular-nums text-slate-100">
                PEN {saldoRestante.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Saldo disponible</div>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800 font-mono tabular-nums">
              <span className="text-slate-400">Eficiencia EVM:</span>
              <b className={`font-mono font-bold ${cpi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>{cpi.toFixed(2)}</b>
            </div>
          </div>

          {/* KPI 5: Días Meta / SPI */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="uppercase tracking-wider">Días Meta</span>
              <span className="font-mono tabular-nums text-[10px] text-slate-400">SPI</span>
            </div>
            <div className="my-1">
              <div className="text-base font-black font-mono tabular-nums text-slate-100 leading-tight">
                {totalDias > diasTranscurridos ? `${totalDias - diasTranscurridos}d rest.` : 'En meta'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Para la fecha meta</div>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800 font-mono tabular-nums">
              <span className="text-slate-400">Ritmo Plazo:</span>
              <b className={`font-mono font-bold ${spi >= 1 ? 'text-indigo-400' : 'text-amber-400'}`}>{spi.toFixed(2)}</b>
            </div>
          </div>
        </div>
      </div>

      {/* SISTEMA DE SUBPESTAÑAS ERGONÓMICAS VISTA 360° */}
      <div
        className="flex items-center gap-1.5 border-b border-slate-800 pb-1 overflow-x-auto scrollbar-none shrink-0"
        role="tablist"
      >
        <button
          type="button"
          onClick={() => setSubTabActiva('wbs')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTabActiva === 'wbs'
              ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800 shadow-2xs'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <GitFork className="w-4 h-4 shrink-0" />
          <span>1. WBS & Ruta Crítica</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTabActiva('evm')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTabActiva === 'evm'
              ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800 shadow-2xs'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>2. Rendimiento EVM & Curva S</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTabActiva('tradeoff')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTabActiva === 'tradeoff'
              ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800 shadow-2xs'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Scale className="w-4 h-4 shrink-0" />
          <span>3. Matriz Trade-Off</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTabActiva('gobernanza')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTabActiva === 'gobernanza'
              ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800 shadow-2xs'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>4. Gobernanza & Salud</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* SUBPESTAÑA 1: WBS & RUTA CRÍTICA                                 */}
      {/* ================================================================= */}
      {subTabActiva === 'wbs' && (
        <div className="space-y-6">
          {/* Banner de Estado de Ruta Crítica CPM */}
          <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs border border-slate-800/80 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <div>
                <span className="font-bold text-slate-100">Ruta Crítica CPM:</span>
                <span className="font-mono font-bold text-amber-400 ml-1">
                  {cpmCalculo.rutaCritica.length} hitos críticos
                </span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="font-mono text-slate-400 tabular-nums">
                  Duración calculada: {cpmCalculo.duracionProyecto} días
                </span>
              </div>
            </div>
            <div className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              Cronograma Sin Desfase
            </div>
          </div>

          {/* LIENZO INTERACTIVO: GRAFO DE RED WBS AISLADO POR PROYECTO */}
          <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
            <GrafoWBS
              proyectoId={proyectoActivo.codigo_legado || proyectoActivo.id}
              hitosExternos={hitosProyecto}
            />
          </div>

          {/* Encabezado de Cascada WBS */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">
                  Estructura Jerárquica de Entregables e Hitos (WBS)
                </h2>
                <button
                  type="button"
                  onClick={() => toggleTodosHitos(true)}
                  className="text-[11px] text-indigo-400 hover:underline font-bold px-1.5 cursor-pointer"
                >
                  Expandir todos
                </button>
                <span className="text-slate-500">|</span>
                <button
                  type="button"
                  onClick={() => toggleTodosHitos(false)}
                  className="text-[11px] text-slate-400 hover:underline font-semibold px-1.5 cursor-pointer"
                >
                  Colapsar todos
                </button>
              </div>

              <button
                type="button"
                onClick={() => abrirModalCrearHitoFase('Fase General')}
                className="px-3 py-1.5 rounded-xl border border-indigo-800/60 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Hito / Entregable</span>
              </button>
            </div>

            {/* Agrupamiento por Fases Nivel 1 */}
            {fasesAgrupadas.length === 0 ? (
              <div className="portal-surface bg-[#0D1526] p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-800">
                No se registran hitos específicos en este proyecto. Puedes crear paquetes de trabajo e hitos con "+ Nuevo Hito / Entregable".
              </div>
            ) : (
              <div className="space-y-6">
                {fasesAgrupadas.map((fase, idxFase) => {
                  const pctPesoFase = Math.round(fase.pesoTotal * 100);

                  const gradienteBadge =
                    idxFase === 0
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600'
                      : idxFase === 1
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                      : idxFase === 2
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600';

                  return (
                    <div
                      key={fase.nombre}
                      className="wbs-fase-seccion space-y-4 p-4 md:p-5 rounded-2xl bg-[#0D1526]/70 border border-slate-800/80 shadow-2xs"
                    >
                      {/* Banner Header de Fase */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={`inline-flex items-center justify-center min-w-[2.2rem] px-2 h-7 rounded-lg ${gradienteBadge} text-white font-mono font-black text-[11px] border border-white/20 tracking-tight shrink-0 shadow-xs`}
                          >
                            F{idxFase + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-slate-100 text-sm md:text-base leading-tight truncate">
                                {fase.nombre}
                              </h3>
                              <span className="text-xs text-slate-400 font-mono font-medium">
                                ({fase.paquetes.length} WP • {fase.marcadores.length} hitos)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <span className="text-xs bg-indigo-950/60 text-indigo-300 font-mono tabular-nums font-bold px-2.5 py-1 rounded-xl border border-indigo-800 flex items-center gap-1.5 shadow-2xs">
                            <span>
                              Peso: <b>{pctPesoFase}%</b>
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => abrirModalCrearHitoFase(fase.nombre)}
                            className="px-2.5 py-1 rounded-xl border border-indigo-800/60 bg-[#0D1526] hover:bg-indigo-950/40 text-indigo-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Entregable</span>
                          </button>
                        </div>
                      </div>

                      {/* 1. Paquetes de Trabajo (WP) */}
                      {fase.paquetes.length > 0 && (
                        <div className="space-y-4">
                          {fase.paquetes.map((h: any) => {
                            const hitoIdKey = h.codigo_legado || h.id;
                            const estaColapsado = hitosExpandidos[h.id] === false;
                            const nomElem = h.nombre_elemento || h.Nombre_Elemento || h.nombre_hito || h.Nombre_Hito || h.nombre || h.codigo_legado || 'Elemento sin nombre';
                            const tareasHito = tareasPorHito.get(String(hitoIdKey).toUpperCase()) || [];
                            const gastosHito = gastosPorHito.get(String(hitoIdKey).toUpperCase()) || [];

                            let totalGastoHito = 0;
                            gastosHito.forEach((g: any) => {
                              totalGastoHito +=
                                parseFloat(g.Monto_PEN || g.Monto_Moneda_Base || g.monto_pen || g.monto || 0) || 0;
                            });

                            const presEstimadoHito = parseFloat(h.presupuesto_asignado || 0) || 0;
                            const realEjecutadoHito = totalGastoHito;
                            const varianzaHito = presEstimadoHito > 0 ? presEstimadoHito - realEjecutadoHito : 0;
                            const pctConsumidoHito =
                              presEstimadoHito > 0
                                ? Math.round((realEjecutadoHito / presEstimadoHito) * 100)
                                : realEjecutadoHito > 0
                                ? 100
                                : 0;

                            const esCrit = cpmCalculo.rutaCritica.includes(hitoIdKey);
                            const tareasHechasHito = tareasHito.filter((t: any) =>
                              String(t.Estado_Tarea || t.estado_tarea || '').includes('Completad')
                            ).length;
                            const pctHito =
                              tareasHito.length > 0 ? Math.round((tareasHechasHito / tareasHito.length) * 100) : 0;

                            return (
                              <div
                                key={h.id}
                                className="portal-surface bg-[#0D1526] rounded-2xl border border-slate-800/80 overflow-hidden shadow-xs transition-all"
                              >
                                {/* Header Paquete WP */}
                                <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 gap-3.5 bg-slate-950/40">
                                  <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => toggleHito(h.id)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer mt-0.5"
                                      title="Expandir o contraer paquete"
                                    >
                                      {estaColapsado ? (
                                        <ChevronRight className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <span className="font-mono tabular-nums text-[10px] font-extrabold bg-slate-800 text-slate-200 px-2 py-0.5 rounded tracking-wide border border-slate-700">
                                          {hitoIdKey}
                                        </span>
                                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-sky-950/70 text-sky-300 border-sky-800/60 flex items-center gap-1">
                                          <Package className="w-3 h-3" />
                                          <span>Paquete WP</span>
                                        </span>
                                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold border bg-slate-800 text-slate-300 border-slate-700">
                                          {h.estado || 'Pendiente'}
                                        </span>
                                        {esCrit && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                            <Flame className="w-3 h-3 text-rose-400" />
                                            <span>Ruta Crítica</span>
                                          </span>
                                        )}
                                        <span className="text-xs text-slate-400 font-mono tabular-nums inline-flex items-center gap-1">
                                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                          <span>Límite: <b>{h.fecha_limite || h.Fecha_Limite_Plan || h.fecha_limite_plan || '-'}</b></span>
                                        </span>
                                        <span className="text-xs bg-indigo-950/60 text-indigo-300 font-mono tabular-nums font-bold px-2 py-0.5 rounded border border-indigo-800">
                                          Peso: {Math.round(((h.peso_pct ?? h.peso_ponderado_pct ?? h.Peso_Ponderado_Pct ?? 0)) * 100)}%
                                        </span>
                                      </div>

                                      <h3 className="font-black text-slate-100 text-base leading-tight truncate">
                                        {nomElem}
                                      </h3>

                                      {/* Barra de Progreso */}
                                      <div className="flex items-center gap-2 mt-2 w-full max-w-xs">
                                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                                          <div
                                            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${pctHito}%` }}
                                          />
                                        </div>
                                        <span className="text-[11px] font-mono tabular-nums font-black text-indigo-400 shrink-0">
                                          {pctHito}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Panel de Control Financiero & Botones */}
                                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                                    <div className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 shadow-2xs text-right min-w-[170px]">
                                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums">
                                        <span className="text-slate-400 font-bold uppercase">Est vs Real:</span>
                                        <span className="font-bold text-slate-300">
                                          S/ {presEstimadoHito.toLocaleString('es-PE')} |{' '}
                                          <b
                                            className={
                                              realEjecutadoHito > presEstimadoHito && presEstimadoHito > 0
                                                ? 'text-rose-400 font-black'
                                                : 'text-emerald-400 font-bold'
                                            }
                                          >
                                            S/ {realEjecutadoHito.toLocaleString('es-PE')}
                                          </b>
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-1.5 text-[9.5px] font-mono tabular-nums mt-0.5">
                                        <span
                                          className={
                                            varianzaHito >= 0
                                              ? 'text-emerald-400 font-bold'
                                              : 'text-rose-400 font-extrabold'
                                          }
                                        >
                                          {presEstimadoHito > 0
                                            ? varianzaHito >= 0
                                              ? `Ahorro +S/ ${varianzaHito.toFixed(1)}`
                                              : `Desvío -S/ ${Math.abs(varianzaHito).toFixed(1)}`
                                            : 'Sin Techo'}
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${
                                            pctConsumidoHito > 100
                                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                              : pctConsumidoHito >= 80
                                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                          }`}
                                        >
                                          {pctConsumidoHito}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Botones de Acción */}
                                    <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTareaAEditarId(null);
                                          setIsModalTareaOpen(true);
                                        }}
                                        className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                                        title="Crear tarea en este paquete"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Tarea</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          Swal.fire({
                                            title: 'Asistente WBS IA',
                                            text: `Desglosando tareas atómicas para ${nomElem}...`,
                                            icon: 'info',
                                            background: '#0D1526',
                                            color: '#f8fafc'
                                          })
                                        }
                                        className="px-2 py-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                                        title="Desglosar tareas con IA"
                                      >
                                        <Bot className="w-3 h-3" />
                                        <span>IA</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setHitoPreseleccionadoGasto(hitoIdKey);
                                          setIsModalGastoOpen(true);
                                        }}
                                        className="px-2 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                                        title="Registrar gasto en este paquete"
                                      >
                                        <DollarSign className="w-3 h-3" />
                                        <span>Gasto</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          Swal.fire({
                                            title: '¿Eliminar paquete?',
                                            text: `Se eliminará ${hitoIdKey} y sus vínculos.`,
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonColor: '#e11d48',
                                            confirmButtonText: 'Sí, eliminar',
                                            cancelButtonText: 'Cancelar',
                                            background: '#0D1526',
                                            color: '#f8fafc'
                                          }).then(async (res) => {
                                            if (res.isConfirmed) {
                                              await db.hitos_wbs.delete(h.id);
                                            }
                                          });
                                        }}
                                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                        title="Eliminar paquete de trabajo"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Body Bicolumna: Tareas (col-span-7) vs Gastos (col-span-5) */}
                                {!estaColapsado && (
                                  <div className="p-4 md:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 transition-all">
                                    {/* COLUMNA IZQUIERDA: TAREAS (58%) */}
                                    <div className="lg:col-span-7 space-y-3">
                                      <div className="flex justify-between items-center px-1 pb-1 border-b border-slate-800">
                                        <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                          <span>Tareas del Paquete ({tareasHito.length})</span>
                                        </span>
                                        <span className="text-[11px] font-mono tabular-nums text-slate-400">
                                          {tareasHechasHito} de {tareasHito.length} hechas
                                        </span>
                                      </div>

                                      {tareasHito.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic py-3 text-center bg-slate-900/40 rounded-xl border border-slate-800">
                                          Sin tareas asignadas a este paquete de trabajo.
                                        </p>
                                      ) : (
                                        <div className="space-y-2">
                                          {tareasHito.map((t: any) => {
                                            const esDone = String(t.Estado_Tarea || t.estado_tarea || '').includes(
                                              'Completad'
                                            );
                                            return (
                                              <div
                                                key={t.id}
                                                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                                              >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                  <button
                                                    type="button"
                                                    onClick={async () => {
                                                      const nvo = esDone ? '02_Por_Hacer' : '04_Completado';
                                                      await db.tareas.update(t.id, {
                                                        estado_tarea: nvo,
                                                        Estado_Tarea: nvo
                                                      } as any);
                                                    }}
                                                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition ${
                                                      esDone
                                                        ? 'bg-emerald-600 border-emerald-500 text-white'
                                                        : 'border-slate-700 hover:border-slate-500 bg-slate-800'
                                                    }`}
                                                  >
                                                    {esDone && <Check className="w-3 h-3" />}
                                                  </button>
                                                  <span className="font-mono text-[10px] text-slate-400">
                                                    {t.codigo_legado || t.ID_Tarea}
                                                  </span>
                                                  <span
                                                    onClick={() => {
                                                      setTareaAEditarId(t.id);
                                                      setIsModalTareaOpen(true);
                                                    }}
                                                    className={`truncate font-medium cursor-pointer hover:underline ${
                                                      esDone ? 'line-through text-slate-500' : 'text-slate-200'
                                                    }`}
                                                  >
                                                    {t.nombre_tarea_actividad || t.Nombre_Tarea_Actividad}
                                                  </span>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
                                                  <span>{t.horas_estimadas || 1}h</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {/* COLUMNA DERECHA: GASTOS (42%) */}
                                    <div className="lg:col-span-5 space-y-3 border-t lg:border-t-0 lg:border-l lg:pl-5 border-slate-800">
                                      <div className="flex justify-between items-center px-1 pb-1 border-b border-slate-800">
                                        <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                                          <span>Gastos Imputados ({gastosHito.length})</span>
                                        </span>
                                        <span className="text-xs font-mono tabular-nums font-black text-emerald-400">
                                          PEN {totalGastoHito.toLocaleString('es-PE')}
                                        </span>
                                      </div>

                                      {gastosHito.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic py-3 text-center bg-slate-900/40 rounded-xl border border-slate-800">
                                          Sin gastos imputados a este paquete.
                                        </p>
                                      ) : (
                                        <div className="space-y-2">
                                          {gastosHito.map((g: any) => {
                                            const mGasto =
                                              parseFloat(
                                                g.Monto_PEN || g.Monto_Moneda_Base || g.monto_pen || g.monto || 0
                                              ) || 0;
                                            const estPago = String(g.Estado_Pago || g.estado_pago || g.Estado || '');
                                            const esPag = estPago.toLowerCase() === 'pagado';
                                            return (
                                              <div
                                                key={g.id}
                                                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                                              >
                                                <div className="min-w-0 flex-1">
                                                  <div className="font-medium text-slate-200 truncate">
                                                    {g.Descripcion_Gasto || g.concepto || g.descripcion || 'Gasto'}
                                                  </div>
                                                  <span className="text-[10px] text-slate-400 font-mono">
                                                    {g.Fecha_Gasto || g.fecha || '-'}
                                                  </span>
                                                </div>

                                                <div className="text-right shrink-0">
                                                  <div className="font-mono tabular-nums font-bold text-slate-100">
                                                    PEN {mGasto.toLocaleString('es-PE')}
                                                  </div>
                                                  <span
                                                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                      esPag
                                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                    }`}
                                                  >
                                                    {esPag ? 'Pagado' : 'Pendiente'}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {gastosHito.length > 0 && (
                                        <div className="pt-2 px-1 flex justify-between items-center text-xs font-mono tabular-nums font-bold text-slate-400 border-t border-slate-800">
                                          <span>Total Paquete:</span>
                                          <span className="text-emerald-400">
                                            PEN {totalGastoHito.toLocaleString('es-PE')}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 2. Checkpoints de Control Transversales (Hitos Marcadores) */}
                      {fase.marcadores.length > 0 && (
                        <div className="space-y-2.5 pt-2 border-t border-dashed border-slate-800">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                            <Gem className="w-3.5 h-3.5 text-purple-400" />
                            <span>Checkpoints de Control Transversales ({fase.marcadores.length})</span>
                          </div>

                          <div className="space-y-2">
                            {fase.marcadores.map((h: any) => {
                              const esComp =
                                h.estado === '03_Completado' || (h as any).Estado === '03_Completado';
                              return (
                                <div
                                  key={h.id}
                                  className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                        esComp
                                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                          : 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                                      }`}
                                    >
                                      <Gem className="w-4 h-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className="font-mono text-[10px] font-bold bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                                          {h.codigo_legado}
                                        </span>
                                        <h4
                                          className={`font-bold truncate ${
                                            esComp ? 'line-through text-slate-500' : 'text-slate-100'
                                          }`}
                                        >
                                          {h.nombre_elemento || h.Nombre_Elemento || h.nombre_hito || h.Nombre_Hito || h.nombre || h.codigo_legado}
                                        </h4>
                                        <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 border border-purple-800 px-1.5 py-0.5 rounded">
                                          Costo: $0.00
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-400 truncate">
                                        DoD: {h.criterio_dod || h.criterio_aceptacion_dod || h.Criterio_Aceptacion_DoD || 'Criterio de aceptación estándar'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                    <span className="text-[10.5px] font-mono tabular-nums text-slate-400 mr-2">
                                      Límite: {h.fecha_limite || h.Fecha_Limite_Plan || h.fecha_limite_plan || '-'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleCompletarMarcador(h)}
                                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                                        esComp
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                                      }`}
                                    >
                                      {esComp ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Verificado</span>
                                        </>
                                      ) : (
                                        <>
                                          <Circle className="w-3.5 h-3.5" />
                                          <span>Validar Cierre DoD</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bloque General de Tareas y Gastos del Proyecto (Sin hito específico) */}
            {(tareasGenerales.length > 0 || gastosGenerales.length > 0) && (
              <div className="portal-surface bg-[#0D1526] p-4 md:p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-400" />
                    <span>Entregables & Gastos Generales del Proyecto</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {tareasGenerales.length} tareas • {gastosGenerales.length} gastos
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-7 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Tareas Generales
                    </span>
                    {tareasGenerales.map((t: any) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-200">{t.nombre_tarea_actividad || t.Nombre_Tarea_Actividad}</span>
                        <span className="font-mono text-slate-400">{t.horas_estimadas || 1}h</span>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-5 space-y-2 border-t lg:border-t-0 lg:border-l lg:pl-5 border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Gastos Generales
                    </span>
                    {gastosGenerales.map((g: any) => (
                      <div
                        key={g.id}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-200">{g.Descripcion_Gasto || g.concepto || 'Gasto'}</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          PEN {parseFloat(g.Monto_PEN || g.monto_pen || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBPESTAÑA 2: RENDIMIENTO EVM & CURVA S                           */}
      {/* ================================================================= */}
      {subTabActiva === 'evm' && (
        <div className="space-y-6">
          <div className="portal-surface bg-[#0D1526] p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <h2 className="text-base font-black text-slate-100">
                  Gestión de Valor Ganado (EVM) en Tiempo Real
                </h2>
                <span className="text-[10px] bg-emerald-950/60 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                  PMBOK 7th Ed.
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evaluación continua de costo, cronograma, índice de desempeño y proyecciones a la conclusión.
              </p>
            </div>
          </div>

          {/* Bento Grid de Métricas Principales EVM (6 Tarjetas) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">BAC (Presupuesto)</span>
              <div className="text-sm font-black font-mono tabular-nums text-slate-100">
                PEN {bac.toLocaleString('es-PE')}
              </div>
              <span className="text-[9.5px] text-slate-400 block">Línea base total</span>
            </div>

            <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PV (Planificado)</span>
              <div className="text-sm font-black font-mono tabular-nums text-indigo-400">
                PEN {pv.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[9.5px] text-slate-400 block">{pctTiempo}% de cronograma</span>
            </div>

            <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">EV (Valor Ganado)</span>
              <div className="text-sm font-black font-mono tabular-nums text-emerald-400">
                PEN {ev.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[9.5px] text-slate-400 block">% Físico × BAC</span>
            </div>

            <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AC (Costo Real)</span>
              <div className="text-sm font-black font-mono tabular-nums text-rose-400">
                PEN {ac.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[9.5px] text-slate-400 block">Egresos pagados</span>
            </div>

            <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CC (Comprometido)</span>
              <div className="text-sm font-black font-mono tabular-nums text-amber-400">
                PEN {cc.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[9.5px] text-slate-400 block">Pendiente de pago</span>
            </div>

            <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">EAC (Proyección)</span>
              <div className="text-sm font-black font-mono tabular-nums text-purple-400">
                PEN {eac.toLocaleString('es-PE')}
              </div>
              <span className="text-[9.5px] text-slate-400 block">BAC / CPI</span>
            </div>
          </div>

          {/* Varianzas e Índices */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Variación de Costo (CV)</span>
                <span className="font-mono text-slate-400">EV - AC</span>
              </div>
              <div className={`text-lg font-black font-mono tabular-nums ${cv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                PEN {cv.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[11px] text-slate-400">
                {cv >= 0 ? 'En presupuesto favorable.' : 'Sobrecosto detectado.'}
              </p>
            </div>

            <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Variación de Cronograma (SV)</span>
                <span className="font-mono text-slate-400">EV - PV</span>
              </div>
              <div className={`text-lg font-black font-mono tabular-nums ${sv >= 0 ? 'text-indigo-400' : 'text-amber-400'}`}>
                PEN {sv.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[11px] text-slate-400">
                {sv >= 0 ? 'Alineado al cronograma.' : 'Desfase de plazos.'}
              </p>
            </div>

            <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Índice Costo (CPI)</span>
                <span className="font-mono text-slate-400">EV / AC</span>
              </div>
              <div className={`text-lg font-black font-mono tabular-nums ${cpi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {cpi.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400">{cpi >= 1 ? 'Eficiencia en costos.' : 'Baja eficiencia.'}</p>
            </div>

            <div className="portal-surface bg-[#0D1526] p-4 rounded-2xl space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Índice Plazo (SPI)</span>
                <span className="font-mono text-slate-400">EV / PV</span>
              </div>
              <div className={`text-lg font-black font-mono tabular-nums ${spi >= 1 ? 'text-indigo-400' : 'text-amber-400'}`}>
                {spi.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400">{spi >= 1 ? 'Ritmo acelerado.' : 'Retraso de ejecución.'}</p>
            </div>
          </div>

          {/* Curva S Vectorial y Diagnóstico Ejecutivo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico Curva S Vectorial SVG */}
            <div className="portal-surface bg-[#0D1526] p-5 rounded-2xl space-y-3 lg:col-span-2 border border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Curva S: Proyección de Desempeño Acumulado</span>
                </h3>
                <div className="flex items-center gap-3 text-[10.5px] font-mono">
                  <span className="flex items-center gap-1 text-indigo-400 font-semibold">
                    <span className="w-2.5 h-1 bg-indigo-500 rounded-full inline-block" /> PV (Plan)
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-2.5 h-1 bg-emerald-500 rounded-full inline-block" /> EV (Ganado)
                  </span>
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <span className="w-2.5 h-1 bg-rose-500 rounded-full inline-block" /> AC (Costo)
                  </span>
                </div>
              </div>

              {/* Canvas SVG Reactivo Curva S */}
              <div className="w-full h-56 bg-slate-950/70 rounded-xl p-3 border border-slate-800 relative flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                  {/* Ejes y líneas guía */}
                  <line x1="40" y1="20" x2="40" y2="150" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1="40" y1="150" x2="480" y2="150" stroke="#475569" strokeWidth="1.5" />

                  {/* Curva PV (Planificada) - Curva Sigmoide S Completa */}
                  <path
                    d="M 40 150 C 180 145, 260 70, 480 25"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Línea de corte actual */}
                  {(() => {
                    const statusX = 40 + (Math.min(100, pctTiempo) / 100) * 440;
                    const evRatio = bac > 0 ? Math.min(1.2, ev / bac) : 0;
                    const acRatio = bac > 0 ? Math.min(1.2, ac / bac) : 0;
                    const targetEvY = 150 - evRatio * 125;
                    const targetAcY = 150 - acRatio * 125;

                    return (
                      <>
                        <line
                          x1={statusX}
                          y1="20"
                          x2={statusX}
                          y2="150"
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                        />
                        {/* Curva EV (Ganado) hasta fecha de corte */}
                        <path
                          d={`M 40 150 Q ${(40 + statusX) / 2} ${(150 + targetEvY) / 2 + 10} ${statusX} ${targetEvY}`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        {/* Curva AC (Costo Real) hasta fecha de corte */}
                        <path
                          d={`M 40 150 Q ${(40 + statusX) / 2} ${(150 + targetAcY) / 2 + 15} ${statusX} ${targetAcY}`}
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx={statusX} cy={targetEvY} r="4" fill="#10b981" />
                        <circle cx={statusX} cy={targetAcY} r="4" fill="#f43f5e" />
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                <span>0% Tiempo (Inicio)</span>
                <span>Línea de Corte Actual ({pctTiempo}%)</span>
                <span>100% Tiempo (Fin Contractual)</span>
              </div>
            </div>

            {/* Diagnóstico PMO */}
            <div className="portal-surface bg-[#0D1526] p-5 rounded-2xl space-y-3 border border-slate-800 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    Dictamen Ejecutivo PMO
                  </h3>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  {dictamenPmo}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800 text-[11px] font-mono tabular-nums">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Varianza a la Conclusión (VAC):</span>
                  <b className={vac >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    PEN {vac.toLocaleString('es-PE')}
                  </b>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Costo Comprometido (CC):</span>
                  <b className="text-amber-400">PEN {cc.toLocaleString('es-PE')}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBPESTAÑA 3: MATRIZ TRADE-OFF                                    */}
      {/* ================================================================= */}
      {subTabActiva === 'tradeoff' && (
        <div className="space-y-6">
          <div className="portal-surface bg-[#0D1526] p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                <h2 className="text-base font-black text-slate-100">
                  Matriz de Decisión Ponderada (Trade-Off Analysis)
                </h2>
                <span className="text-[10px] bg-indigo-950/60 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-800">
                  Decisiones Tipo 1 / Alto Valor
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evaluación multicriterio objetiva para adquisiciones de alto valor, contratos y alternativas clave.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCriteriosTradeOff([
                  { id: `c-${Date.now()}-1`, nombre: 'Costo / Inversión', peso: 30, scoreA: 4, scoreB: 3, scoreC: 2 },
                  { id: `c-${Date.now()}-2`, nombre: 'Plazo de Entrega', peso: 25, scoreA: 3, scoreB: 5, scoreC: 2 },
                  { id: `c-${Date.now()}-3`, nombre: 'Calidad Técnica', peso: 25, scoreA: 5, scoreB: 4, scoreC: 3 },
                  { id: `c-${Date.now()}-4`, nombre: 'Garantía / SLA', peso: 20, scoreA: 4, scoreB: 4, scoreC: 4 }
                ]);
              }}
              className="px-3 py-1.5 rounded-xl border border-indigo-800/60 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Criterios</span>
            </button>
          </div>

          {/* Evaluador Interactivo Multicriterio */}
          <div className="portal-surface bg-[#0D1526] p-6 rounded-2xl space-y-5 border border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título de la Decisión / Adquisición
                </label>
                <input
                  type="text"
                  value={toTitulo}
                  onChange={(e) => setToTitulo(e.target.value)}
                  className="w-full border border-slate-700 bg-slate-900 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Dilema</label>
                <select
                  value={toTipo}
                  onChange={(e) => setToTipo(e.target.value)}
                  className="w-full border border-slate-700 bg-slate-900 rounded-xl p-2.5 text-xs text-slate-100 outline-none"
                >
                  <option value="Tecnología / Software">Tecnología / Software</option>
                  <option value="Activo / Infraestructura">Activo / Infraestructura</option>
                  <option value="Servicio Profesional / Contrato">Servicio Profesional / Contrato</option>
                  <option value="Inversión Patrimonial">Inversión Patrimonial</option>
                </select>
              </div>
            </div>

            {/* Nombres de Alternativas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-sky-400 mb-1">Opción A (Estándar)</label>
                <input
                  type="text"
                  value={toOpcionA}
                  onChange={(e) => setToOpcionA(e.target.value)}
                  className="w-full border border-slate-800 bg-slate-950 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-indigo-400 mb-1">Opción B (Competidor)</label>
                <input
                  type="text"
                  value={toOpcionB}
                  onChange={(e) => setToOpcionB(e.target.value)}
                  className="w-full border border-slate-800 bg-slate-950 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-400 mb-1">Opción C (Alternativa)</label>
                <input
                  type="text"
                  value={toOpcionC}
                  onChange={(e) => setToOpcionC(e.target.value)}
                  className="w-full border border-slate-800 bg-slate-950 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            </div>

            {/* Tabla de Criterios y Puntajes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Criterios de Ponderación (Suma = 100%)
                </span>
                {(() => {
                  const sumaPesos = criteriosTradeOff.reduce((acc, c) => acc + c.peso, 0);
                  return (
                    <div
                      className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold ${
                        sumaPesos === 100
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      Suma: {sumaPesos}%
                    </div>
                  );
                })()}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="p-3 font-bold w-1/3">Criterio de Evaluación</th>
                      <th className="p-3 font-bold text-center w-24">Peso (%)</th>
                      <th className="p-3 font-bold text-center">Score A (1-5)</th>
                      <th className="p-3 font-bold text-center">Score B (1-5)</th>
                      <th className="p-3 font-bold text-center">Score C (1-5)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono tabular-nums">
                    {criteriosTradeOff.map((c, i) => (
                      <tr key={c.id}>
                        <td className="p-2.5 font-sans">
                          <input
                            type="text"
                            value={c.nombre}
                            onChange={(e) => {
                              const nuevo = [...criteriosTradeOff];
                              nuevo[i].nombre = e.target.value;
                              setCriteriosTradeOff(nuevo);
                            }}
                            className="w-full bg-transparent border-0 text-slate-200 font-medium focus:underline"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={c.peso}
                            onChange={(e) => {
                              const nuevo = [...criteriosTradeOff];
                              nuevo[i].peso = parseFloat(e.target.value) || 0;
                              setCriteriosTradeOff(nuevo);
                            }}
                            className="w-16 bg-slate-950 border border-slate-700 text-center rounded p-1 text-slate-100"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.5"
                            value={c.scoreA}
                            onChange={(e) => {
                              const nuevo = [...criteriosTradeOff];
                              nuevo[i].scoreA = parseFloat(e.target.value) || 0;
                              setCriteriosTradeOff(nuevo);
                            }}
                            className="w-16 bg-slate-950 border border-slate-700 text-center rounded p-1 text-sky-400 font-bold"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.5"
                            value={c.scoreB}
                            onChange={(e) => {
                              const nuevo = [...criteriosTradeOff];
                              nuevo[i].scoreB = parseFloat(e.target.value) || 0;
                              setCriteriosTradeOff(nuevo);
                            }}
                            className="w-16 bg-slate-950 border border-slate-700 text-center rounded p-1 text-indigo-400 font-bold"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.5"
                            value={c.scoreC}
                            onChange={(e) => {
                              const nuevo = [...criteriosTradeOff];
                              nuevo[i].scoreC = parseFloat(e.target.value) || 0;
                              setCriteriosTradeOff(nuevo);
                            }}
                            className="w-16 bg-slate-950 border border-slate-700 text-center rounded p-1 text-purple-400 font-bold"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Showcase de Ganador */}
            {(() => {
              let scoreA = 0;
              let scoreB = 0;
              let scoreC = 0;
              criteriosTradeOff.forEach((c) => {
                scoreA += (c.peso / 100) * c.scoreA;
                scoreB += (c.peso / 100) * c.scoreB;
                scoreC += (c.peso / 100) * c.scoreC;
              });

              let ganadorNom = toOpcionA;
              let ganadorScore = scoreA;
              if (scoreB > ganadorScore) {
                ganadorNom = toOpcionB;
                ganadorScore = scoreB;
              }
              if (scoreC > ganadorScore) {
                ganadorNom = toOpcionC;
                ganadorScore = scoreC;
              }

              return (
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        Alternativa Ganadora Recomendada
                      </span>
                      <div className="flex items-center gap-2">
                        <b className="text-sm font-black text-slate-100">{ganadorNom}</b>
                        <span className="font-mono tabular-nums text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                          Score: {ganadorScore.toFixed(2)} / 5.00
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={guardarDecisionTradeOff}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar y Aprobar Decisión</span>
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Historial de Decisiones Guardadas */}
          <div className="portal-surface bg-[#0D1526] p-5 rounded-2xl space-y-3 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-400" />
              <span>Registro Histórico de Decisiones Ponderadas</span>
            </h3>
            {historialTradeOff.length === 0 ? (
              <div className="p-4 text-center text-slate-500 italic bg-slate-900 rounded-xl text-xs">
                Sin decisiones guardadas en esta sesión.
              </div>
            ) : (
              <div className="space-y-2">
                {historialTradeOff.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block">{h.titulo}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {h.fecha} • {h.tipo}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800">
                      {h.ganador} ({h.score}/5.00)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBPESTAÑA 4: GOBERNANZA & SALUD                                  */}
      {/* ================================================================= */}
      {subTabActiva === 'gobernanza' && (
        <div className="space-y-6">
          <div className="portal-surface bg-[#0D1526] p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-500 shrink-0" />
                <h2 className="text-base font-black text-slate-100">
                  Ficha de Gobernanza, Control & Auditoría
                </h2>
                <span className="text-[10px] bg-violet-950/60 text-violet-300 font-bold px-2 py-0.5 rounded-full border border-violet-800">
                  Supervisión PMO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Control de revisiones periódicas, stakeholders involucrados y alineamiento estratégico OKR.
              </p>
            </div>
            <button
              type="button"
              onClick={registrarCheckinHoy}
              className="px-3 py-1.5 rounded-xl border border-indigo-800/60 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Registrar Check-in de Control Hoy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="portal-surface bg-[#0D1526] p-5 rounded-2xl space-y-4 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Parámetros de Auditoría y Ciclo de Vida
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Última Revisión Registrada:</span>
                  <b className="font-mono text-slate-200">
                    {proyectoActivo.ultima_revision || (proyectoActivo as any).Ultima_Revision || 'Hoy'}
                  </b>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Frecuencia de Control:</span>
                  <b className="text-slate-200">Semanal</b>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Días sin Revisión:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${
                      diasSinRevision <= 7
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : diasSinRevision <= 14
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {diasSinRevision} {diasSinRevision === 1 ? 'día' : 'días'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Terceros Involucrados:</span>
                  <span className="text-slate-300 font-medium">
                    {proyectoActivo.terceros_involucrados || 'Sin contratistas asignados'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Expediente en Drive:</span>
                  {proyectoActivo.alcance_detallado_url_drive ? (
                    <a
                      href={proyectoActivo.alcance_detallado_url_drive}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Ver Carpeta</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500 italic">No vinculado</span>
                  )}
                </div>
              </div>
            </div>

            <div className="portal-surface bg-[#0D1526] p-5 rounded-2xl space-y-4 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Estrategia y Criterios de Éxito
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl space-y-1">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                    North Star OKR
                  </span>
                  <p className="text-slate-200 font-medium">
                    {proyectoActivo.north_star_okr || 'No definido.'}
                  </p>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl space-y-1">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                    Definition of Done (DoD) Contractual
                  </span>
                  <p className="text-slate-200 font-medium">
                    {proyectoActivo.criterios_aceptacion_dod || 'Criterios de entrega y calidad verificados.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Canónico de Gasto (Invocado desde WBS) */}
      <ModalGasto
        isOpen={isModalGastoOpen}
        onClose={() => {
          setIsModalGastoOpen(false);
          setHitoPreseleccionadoGasto(undefined);
        }}
        proyectoPreseleccionadoId={proyCod || proyId}
        tareaPreseleccionadaId={hitoPreseleccionadoGasto}
      />

      {/* Modal Canónico de TareaFlow (Invocado desde WBS) */}
      <ModalTareaFlow
        isOpen={isModalTareaOpen}
        onClose={() => {
          setIsModalTareaOpen(false);
          setTareaAEditarId(null);
        }}
        tareaId={tareaAEditarId}
        initialProyectoCodigo={proyCod || proyId}
      />
    </div>
  );
};
