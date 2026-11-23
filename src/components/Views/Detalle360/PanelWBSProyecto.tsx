/**
 * ============================================================================
 * ARCHIVO: src/components/Views/Detalle360/PanelWBSProyecto.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-REFACTOR-P1-06 (Desacoplamiento Modular de Pestaña WBS)
 * DESCRIPCIÓN: Panel de Estructura Jerárquica de Entregables e Hitos (WBS),
 *              Grafo de Red aislado, Ruta Crítica CPM, desglose de tareas,
 *              subtareas y gastos bajo estándar visual Cobalt Aerodynamic (A.2.2).
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  Layers,
  Milestone,
  Flag,
  ChevronRight,
  ChevronDown,
  Package,
  Flame,
  Calendar,
  CheckSquare,
  Bot,
  DollarSign,
  Trash2,
  Check,
  Clock,
  Receipt,
  Tag,
  Gem,
  Circle,
  FolderOpen
} from 'lucide-react';
import { db } from '../../../db/db';
import type {
  ProyectoRecord,
  HitoWbsRecord,
  TareaRecord,
  GastoRecord,
  SubtareaPaso
} from '../../../types';
import { GrafoWBS } from '../../WBS/GrafoWBS';
import { calcularDesfaseDias, clasificarDesfase } from '../../../utils/metricasEjecucionHelpers';
import { mostrarToastCobalt } from '../../../utils/toastCobalt';
import { useUndoDelete } from '../../../hooks/useUndoDelete';
import { eliminarHitoWBS } from '../../../services/proyectosService';

export interface FaseAgrupadaWBS {
  nombre: string;
  paquetes: HitoWbsRecord[];
  marcadores: HitoWbsRecord[];
  pesoTotal: number;
}

export interface CPMCalculoProyecto {
  rutaCritica: string[];
  duracionProyecto: number;
}

export interface PanelWBSProyectoProps {
  proyectoActivo: ProyectoRecord;
  hitosProyecto: HitoWbsRecord[];
  cpmCalculo: CPMCalculoProyecto;
  fasesAgrupadas: FaseAgrupadaWBS[];
  tareasPorHito: Map<string, TareaRecord[]>;
  gastosPorHito: Map<string, GastoRecord[]>;
  subtareasPorTareaMap: Map<string, SubtareaPaso[]>;
  gastosPorTareaMap: Map<string, GastoRecord[]>;
  tareasGenerales: TareaRecord[];
  gastosGenerales: GastoRecord[];
  onAbrirModalCrearHitoFase: (nombreFase?: string) => void;
  onCrearTareaHito: () => void;
  onEditarTarea: (tareaId: string) => void;
  onDesglosarConIA: (paquete: HitoWbsRecord) => void;
  onRegistrarGastoHito: (hitoIdKey: string) => void;
}

function getPropStr(obj: unknown, key: string): string {
  if (!obj || typeof obj !== 'object') return '';
  const val = (obj as Record<string, unknown>)[key];
  return typeof val === 'string' ? val : '';
}

export const PanelWBSProyecto: React.FC<PanelWBSProyectoProps> = ({
  proyectoActivo,
  hitosProyecto,
  cpmCalculo,
  fasesAgrupadas,
  tareasPorHito,
  gastosPorHito,
  subtareasPorTareaMap,
  gastosPorTareaMap,
  tareasGenerales,
  gastosGenerales,
  onAbrirModalCrearHitoFase,
  onCrearTareaHito,
  onEditarTarea,
  onDesglosarConIA,
  onRegistrarGastoHito
}) => {
  const { programarEliminacion } = useUndoDelete();
  const [hitosExpandidos, setHitosExpandidos] = useState<Record<string, boolean>>({});
  const [pasosExpandidosMap, setPasosExpandidosMap] = useState<Record<string, boolean>>({});
  const [elementoResaltadoId, setElementoResaltadoId] = useState<string | null>(null);

  const toggleHito = (id: string) => {
    setHitosExpandidos((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  const toggleTodosHitos = (expandir: boolean) => {
    const nuevoEstado: Record<string, boolean> = {};
    hitosProyecto.forEach((h: HitoWbsRecord) => {
      nuevoEstado[h.id] = expandir;
    });
    setHitosExpandidos(nuevoEstado);
  };

  const togglePasosTarea = (tareaId: string) => {
    setPasosExpandidosMap((prev) => ({
      ...prev,
      [tareaId]: !prev[tareaId]
    }));
  };

  const toggleCompletarMarcador = async (hito: HitoWbsRecord) => {
    const esCompletado = hito.estado === '03_Completado' || getPropStr(hito, 'Estado') === '03_Completado';
    const nuevoEstado = esCompletado ? '01_Pendiente' : '03_Completado';
    await db.hitos_wbs.update(hito.id, {
      estado: nuevoEstado,
      fecha_real_fin: nuevoEstado === '03_Completado' ? new Date().toISOString().split('T')[0] : undefined
    });
    mostrarToastCobalt(
      esCompletado ? 'Marcador reabierto' : 'Checkpoint DoD validado',
      'success',
      2000
    );
  };

  const handleNodoGrafoClick = (tipo: string, id: string, hitoPadreId?: string) => {
    if (hitoPadreId) {
      setHitosExpandidos((prev) => ({ ...prev, [hitoPadreId]: true }));
    }

    setTimeout(() => {
      const targetId = tipo.includes('tarea') ? `wbs-tarea-${id}` : `wbs-nodo-${id}`;
      let elem = document.getElementById(targetId);
      if (!elem) {
        elem = document.getElementById(`wbs-tarea-${id}`) || document.getElementById(`wbs-nodo-${id}`);
      }
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setElementoResaltadoId(id);
        setTimeout(() => setElementoResaltadoId(null), 1800);
      }
    }, 60);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Estado de Ruta Crítica CPM */}
      <div className="portal-surface bg-[#0D1526] p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs border border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
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
          onNodoClick={handleNodoGrafoClick}
        />
      </div>

      {/* Encabezado de Cascada WBS */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" strokeWidth={1.75} />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">
              Estructura Jerárquica de Entregables e Hitos (WBS)
            </h2>
            <button
              type="button"
              onClick={() => toggleTodosHitos(true)}
              className="text-[11px] text-sky-400 hover:underline font-bold px-1.5 cursor-pointer"
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
            onClick={() => onAbrirModalCrearHitoFase('Fase General')}
            className="h-9 px-3.5 rounded-xl border border-sky-500/40 bg-[#0D1526] hover:bg-sky-500/15 text-sky-300 text-xs font-semibold flex items-center gap-2 shadow-[0_0_12px_rgba(56,189,248,0.12)] transition-[transform,colors] duration-150 active:scale-95 cursor-pointer"
          >
            <Milestone className="w-3.5 h-3.5 text-sky-300" strokeWidth={1.75} />
            <span>Nuevo Hito / Entregable</span>
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

              return (
                <div
                  key={fase.nombre}
                  className="wbs-fase-seccion space-y-4 p-4 md:p-5 rounded-2xl bg-[#0D1526]/90 border border-slate-800/80"
                >
                  {/* Banner Header de Fase */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="inline-flex items-center justify-center min-w-[2.2rem] px-2 h-7 rounded-lg bg-[#040711]/80 text-sky-300 font-mono font-bold text-[11px] border border-sky-500/40 tracking-tight shrink-0">
                        F{idxFase + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-100 text-sm md:text-base leading-tight break-words">
                            {fase.nombre}
                          </h3>
                          <span className="text-xs text-slate-400 font-mono font-medium">
                            ({fase.paquetes.length} WP • {fase.marcadores.length} hitos)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className="h-9 px-2.5 text-xs bg-[#040711]/70 text-sky-300 font-mono tabular-nums font-bold rounded-xl border border-slate-800 flex items-center gap-1.5">
                        <span>
                          Peso: <b>{pctPesoFase}%</b>
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onAbrirModalCrearHitoFase(fase.nombre)}
                        className="h-9 px-3 rounded-xl border border-slate-800 bg-[#0D1526] hover:border-sky-500/40 hover:bg-sky-500/10 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-[transform,colors] duration-150 active:scale-95 cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5 text-sky-300" strokeWidth={1.75} />
                        <span>Entregable</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. Paquetes de Trabajo (WP) */}
                  {fase.paquetes.length > 0 && (
                    <div className="space-y-4">
                      {fase.paquetes.map((h) => {
                        const hitoIdKey = h.codigo_legado || h.id;
                        const estaColapsado = hitosExpandidos[h.id] === false;
                        const nomElem = h.nombre_elemento || h.Nombre_Elemento || h.nombre_hito || h.Nombre_Hito || h.nombre || h.codigo_legado || 'Elemento sin nombre';
                        const tareasHito = tareasPorHito.get(String(hitoIdKey).toUpperCase()) || [];
                        const gastosHito = gastosPorHito.get(String(hitoIdKey).toUpperCase()) || [];

                        let totalGastoHito = 0;
                        gastosHito.forEach((g) => {
                          totalGastoHito +=
                            Number(g.monto_pen ?? g.Monto_PEN ?? g.Monto_Moneda_Base ?? g.monto ?? 0) || 0;
                        });

                        const presEstimadoHito = Number(h.presupuesto_asignado || 0) || 0;
                        const realEjecutadoHito = totalGastoHito;
                        const varianzaHito = presEstimadoHito > 0 ? presEstimadoHito - realEjecutadoHito : 0;
                        const pctConsumidoHito =
                          presEstimadoHito > 0
                            ? Math.round((realEjecutadoHito / presEstimadoHito) * 100)
                            : realEjecutadoHito > 0
                              ? 100
                              : 0;

                        const esCrit = cpmCalculo.rutaCritica.includes(hitoIdKey);
                        const tareasHechasHito = tareasHito.filter((t) =>
                          String(t.Estado_Tarea || t.estado_tarea || '').includes('Completad')
                        ).length;
                        const pctHito =
                          tareasHito.length > 0 ? Math.round((tareasHechasHito / tareasHito.length) * 100) : 0;

                        const esElementoResaltado =
                          elementoResaltadoId === hitoIdKey ||
                          elementoResaltadoId === h.id ||
                          elementoResaltadoId === h.codigo_legado;

                        return (
                          <div
                            key={h.id}
                            id={`wbs-nodo-${hitoIdKey}`}
                            className={`portal-surface bg-[#0D1526] rounded-2xl border border-slate-800/80 transition-colors ${esElementoResaltado
                                ? 'ring-2 ring-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-[box-shadow,border-color] duration-300'
                                : ''
                              }`}
                          >
                            {/* Header Paquete WP */}
                            <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 gap-3.5 bg-slate-950/40 rounded-t-2xl">
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
                                      <Package className="w-3 h-3" strokeWidth={1.75} />
                                      <span>Paquete WP</span>
                                    </span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold border bg-slate-800 text-slate-300 border-slate-700">
                                      {h.estado ? String(h.estado).replace(/^\d+_/, '').replace(/_/g, ' ') : 'Pendiente'}
                                    </span>
                                    {esCrit && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                        <Flame className="w-3 h-3 text-rose-400" strokeWidth={1.75} />
                                        <span>Ruta Crítica</span>
                                      </span>
                                    )}
                                    <span className="text-xs text-slate-400 font-mono tabular-nums inline-flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                                      <span>Límite: <b>{h.fecha_limite || h.Fecha_Limite_Plan || h.fecha_limite_plan || '-'}</b></span>
                                    </span>
                                    <span className="text-xs bg-sky-950/50 text-sky-300 font-mono tabular-nums font-bold px-2 py-0.5 rounded border border-sky-500/30">
                                      Peso: {(() => {
                                        const rawP = Number(h.peso_pct ?? h.peso_ponderado_pct ?? h.Peso_Ponderado_Pct ?? 0) || 0;
                                        return Math.round(rawP > 1 ? rawP : rawP * 100);
                                      })()}%
                                    </span>
                                  </div>

                                  <h3 className="font-bold text-slate-100 text-base leading-snug break-words">
                                    {nomElem}
                                  </h3>

                                  {/* Barra de Progreso */}
                                  <div className="flex items-center gap-2 mt-2 w-full max-w-xs">
                                    <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                                      <div
                                        className="bg-sky-500 h-full rounded-full transition-[width] duration-300 ease-out"
                                        style={{ width: `${pctHito}%` }}
                                      />
                                    </div>
                                    <span className="text-[11px] font-mono tabular-nums font-bold text-sky-400 shrink-0">
                                      {pctHito}%
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Panel de Control Financiero & Botones */}
                              <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                                <div className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-right min-w-[190px]">
                                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums">
                                    <span className="text-slate-400 font-bold uppercase">Est vs Real:</span>
                                    <span className="font-bold text-slate-300">
                                      PEN {presEstimadoHito.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} |{' '}
                                      <b
                                        className={
                                          realEjecutadoHito > presEstimadoHito && presEstimadoHito > 0
                                            ? 'text-rose-400 font-black'
                                            : 'text-emerald-400 font-bold'
                                        }
                                      >
                                        PEN {realEjecutadoHito.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                          ? `Ahorro +PEN ${varianzaHito.toFixed(2)}`
                                          : `Desvío -PEN ${Math.abs(varianzaHito).toFixed(2)}`
                                        : 'Sin Techo'}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${pctConsumidoHito > 100
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
                                <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-slate-900 border border-slate-800">
                                  <button
                                    type="button"
                                    onClick={onCrearTareaHito}
                                    className="h-8 px-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(56,189,248,0.25)] transition-[transform,colors] duration-150 active:scale-95 cursor-pointer"
                                    title="Crear tarea en este paquete"
                                  >
                                    <CheckSquare className="w-3 h-3 text-slate-950" strokeWidth={2} />
                                    <span>Tarea</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onDesglosarConIA(h)}
                                    className="h-8 px-2.5 rounded-lg bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(56,189,248,0.15)]"
                                    title="Desglosar tareas con IA"
                                  >
                                    <Bot className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
                                    <span>IA</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onRegistrarGastoHito(hitoIdKey)}
                                    className="px-2 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                                    title="Registrar gasto en este paquete"
                                  >
                                    <DollarSign className="w-3 h-3" />
                                    <span>Gasto</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const targetHitoId = h.id;
                                      const etiqueta = h.nombre_hito || hitoIdKey || 'Paquete de trabajo';
                                      programarEliminacion({
                                        tabla: 'hitos_wbs',
                                        id: targetHitoId,
                                        etiqueta,
                                        tipo: 'HITO',
                                        commit: async () => {
                                          await eliminarHitoWBS(targetHitoId);
                                        }
                                      });
                                    }}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                    title="Eliminar paquete de trabajo (con opción a deshacer)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Body Bicolumna: Tareas (col-span-7) vs Gastos (col-span-5) */}
                            {!estaColapsado && (
                              <div className="p-4 md:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                                {/* COLUMNA IZQUIERDA: TAREAS (58%) */}
                                <div className="lg:col-span-7 space-y-3">
                                  <div className="flex justify-between items-center px-1 pb-1 border-b border-slate-800">
                                    <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                      <Layers className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
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
                                      {tareasHito.map((t) => {
                                        const tareaIdKey = t.codigo_legado || t.ID_Tarea || t.id;
                                        const esTareaResaltada =
                                          elementoResaltadoId === tareaIdKey ||
                                          elementoResaltadoId === t.id;

                                        // Estado semántico de la tarea
                                        const estRaw = String(t.Estado_Tarea || t.estado_tarea || '').trim();
                                        const estLower = estRaw.toLowerCase();
                                        const esDone =
                                          estLower.includes('completad') ||
                                          estLower.includes('04_') ||
                                          estLower.includes('done');
                                        const esProg =
                                          estLower.includes('proceso') ||
                                          estLower.includes('03_') ||
                                          estLower.includes('progress');
                                        const esBloqOVenc =
                                          estLower.includes('bloquead') ||
                                          estLower.includes('imped') ||
                                          estLower.includes('vencid') ||
                                          estLower.includes('cancel');

                                        // Franja lateral semántica (3.5px)
                                        const franjaClase = esDone
                                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                          : esProg
                                            ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                                            : esBloqOVenc
                                              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                              : 'bg-slate-600';

                                        // Pasos/Subtareas vinculadas
                                        const pasosTarea =
                                          subtareasPorTareaMap.get(String(tareaIdKey).toUpperCase()) ||
                                          subtareasPorTareaMap.get(String(t.id).toUpperCase()) ||
                                          (Array.isArray((t as unknown as Record<string, unknown>).pasos)
                                            ? ((t as unknown as Record<string, unknown>).pasos as SubtareaPaso[])
                                            : Array.isArray((t as unknown as Record<string, unknown>).subtareas)
                                              ? ((t as unknown as Record<string, unknown>).subtareas as SubtareaPaso[])
                                              : []);
                                        const totalPasos = pasosTarea.length;
                                        const pasosHechos = pasosTarea.filter((p: SubtareaPaso) => p.completado).length;
                                        const pctPasos = totalPasos > 0 ? Math.round((pasosHechos / totalPasos) * 100) : 0;
                                        const pasosAbiertos = Boolean(pasosExpandidosMap[t.id]);

                                        // Gastos vinculados directamente a la tarea
                                        const gastosDeEstaTarea =
                                          gastosPorTareaMap.get(String(tareaIdKey).toUpperCase()) ||
                                          gastosPorTareaMap.get(String(t.id).toUpperCase()) ||
                                          [];
                                        const totalGastosTarea = gastosDeEstaTarea.reduce((acc: number, g: GastoRecord) => {
                                          return (
                                            acc +
                                            (Number(g.monto_pen ?? g.Monto_PEN ?? g.Monto_Moneda_Base ?? g.monto ?? 0) || 0)
                                          );
                                        }, 0);

                                        // Prioridad Eisenhower
                                        const prio = String(
                                          t.Prioridad_Eisenhower || t.prioridad_eisenhower || ''
                                        ).toUpperCase();
                                        const esAltaPrio =
                                          prio.includes('P1') || prio.includes('ALTA') || prio.includes('URGENTE');

                                        return (
                                          <div
                                            key={t.id}
                                            id={`wbs-tarea-${tareaIdKey}`}
                                            className={`group relative rounded-xl border border-slate-800/80 bg-[#0B1120]/90 p-3.5 transition-colors hover:border-sky-500/40 hover:bg-[#0D1526] ${esTareaResaltada
                                                ? 'ring-2 ring-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-[box-shadow,border-color] duration-300'
                                                : ''
                                              }`}
                                          >
                                            {/* Franja Lateral Izquierda Semántica (3.5px) */}
                                            <div
                                              className={`absolute left-0 top-0 bottom-0 w-[3.5px] rounded-l-xl ${franjaClase}`}
                                            />

                                            {/* Cuerpo Principal de la Tarea */}
                                            <div className="flex items-start justify-between gap-2.5 pl-1">
                                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                                {/* Checkbox táctil */}
                                                <button
                                                  type="button"
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const nvo = esDone ? '02_Por_Hacer' : '04_Completado';
                                                    await db.tareas.update(t.id, {
                                                      estado_tarea: nvo,
                                                      updated_at: new Date().toISOString()
                                                    });
                                                  }}
                                                  className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 cursor-pointer transition ${esDone
                                                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                                                      : 'border-slate-700 hover:border-slate-500 bg-slate-800/90'
                                                    }`}
                                                  title={
                                                    esDone ? 'Marcar como pendiente' : 'Marcar como completada'
                                                  }
                                                >
                                                  {esDone && <Check className="w-3 h-3" strokeWidth={2.5} />}
                                                </button>

                                                <div className="min-w-0 flex-1">
                                                  {/* Micro-pills de metadatos */}
                                                  <div className="flex items-center gap-1.5 flex-wrap mb-1 leading-none">
                                                    <span className="font-mono text-[9.5px] font-bold text-slate-300 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700/70">
                                                      {tareaIdKey}
                                                    </span>

                                                    {/* Badge de Prioridad */}
                                                    {esAltaPrio ? (
                                                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                                                        <Flame className="w-2.5 h-2.5 text-rose-400" strokeWidth={1.75} />
                                                        <span>Alta</span>
                                                      </span>
                                                    ) : (
                                                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/50">
                                                        Media
                                                      </span>
                                                    )}

                                                    {/* Horas estimadas */}
                                                    <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 tabular-nums bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
                                                      <Clock className="w-2.5 h-2.5 text-slate-500" strokeWidth={1.75} />
                                                      <span>{t.horas_estimadas || t.Horas_Estimadas || 1}h</span>
                                                    </span>

                                                    {/* Micro-badge Desfase Temporal en Tarea Completada */}
                                                    {(() => {
                                                      const fProg = t.fecha_programada || t.Fecha_Programada;
                                                      const fComp = t.fecha_completado || t.Fecha_Completado;
                                                      if (!esDone || !fProg || !fComp) return null;
                                                      const dias = calcularDesfaseDias(fProg, fComp);
                                                      const clasif = clasificarDesfase(dias);
                                                      if (clasif.tipo === 'SIN_DATO') return null;

                                                      let badgeClass = 'bg-sky-950/40 text-sky-300 border-sky-800/50';
                                                      if (clasif.tipo === 'MORA') {
                                                        badgeClass = 'bg-rose-950/50 text-rose-300 border-rose-800/50';
                                                      } else if (clasif.tipo === 'ADELANTO') {
                                                        badgeClass = 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50';
                                                      }

                                                      return (
                                                        <span
                                                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums font-bold border ${badgeClass}`}
                                                          title={`Programado: ${fProg} | Completado: ${fComp}`}
                                                        >
                                                          <Clock className="w-2.5 h-2.5" strokeWidth={1.75} />
                                                          <span>{clasif.etiqueta}</span>
                                                        </span>
                                                      );
                                                    })()}

                                                    {/* Badge y Mini-cápsula de Gastos Asociados */}
                                                    {totalGastosTarea > 0 && (
                                                      <div className="relative group/gastos inline-block">
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-[9.5px] font-mono tabular-nums font-semibold cursor-help">
                                                          <DollarSign className="w-2.5 h-2.5 text-emerald-400" strokeWidth={1.75} />
                                                          <span>PEN {totalGastosTarea.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </span>

                                                        {/* Popover con conceptos y montos */}
                                                        <div className="pointer-events-none group-hover/gastos:pointer-events-auto opacity-0 group-hover/gastos:opacity-100 transition-[opacity,transform] duration-200 absolute left-0 bottom-full mb-1.5 z-40 w-56 p-2.5 rounded-xl bg-[#0D1526] border border-slate-700/80 shadow-2xl space-y-1 text-left">
                                                          <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800 flex items-center justify-between">
                                                            <span>Gastos ({gastosDeEstaTarea.length})</span>
                                                            <span className="font-mono text-emerald-400">
                                                              PEN {totalGastosTarea.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                          </div>
                                                          <div className="max-h-28 overflow-y-auto space-y-1 text-[10px]">
                                                            {gastosDeEstaTarea.map((gt: GastoRecord) => (
                                                              <div
                                                                key={gt.id}
                                                                className="flex items-center justify-between gap-1 text-slate-300"
                                                              >
                                                                <span className="truncate flex-1">
                                                                  {gt.Descripcion_Gasto ||
                                                                    gt.descripcion_gasto ||
                                                                    gt.concepto ||
                                                                    'Gasto'}
                                                                </span>
                                                                <span className="font-mono tabular-nums font-bold text-emerald-400 shrink-0">
                                                                  PEN{' '}
                                                                  {(
                                                                    Number(gt.monto_pen ?? gt.Monto_PEN ?? gt.monto ?? 0) || 0
                                                                  ).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                              </div>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>

                                                  {/* Título de la Tarea */}
                                                  <h4
                                                    onClick={() => onEditarTarea(t.id)}
                                                    className={`text-xs font-semibold leading-snug cursor-pointer transition-colors group-hover:text-sky-300 break-words whitespace-normal ${esDone ? 'line-through text-slate-500' : 'text-slate-200'
                                                      }`}
                                                    title={t.nombre_tarea_actividad || t.Nombre_Tarea_Actividad}
                                                  >
                                                    {t.nombre_tarea_actividad || t.Nombre_Tarea_Actividad}
                                                  </h4>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Micro-Checklist de Pasos/Subtareas */}
                                            {totalPasos > 0 && (
                                              <div className="mt-2.5 pt-2 border-t border-slate-800/70 pl-1">
                                                <div className="flex items-center justify-between gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => togglePasosTarea(t.id)}
                                                    className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                                                  >
                                                    <ChevronRight
                                                      className={`w-3.5 h-3.5 transition-transform duration-200 ${pasosAbiertos ? 'rotate-90 text-sky-400' : 'text-slate-500'
                                                        }`}
                                                      strokeWidth={1.75}
                                                    />
                                                    <span>
                                                      {pasosHechos}/{totalPasos} pasos
                                                    </span>
                                                    <span className="font-mono tabular-nums text-slate-500 text-[9.5px]">
                                                      ({pctPasos}%)
                                                    </span>
                                                  </button>

                                                  {/* Micro barra segmentada de progreso */}
                                                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
                                                    <div
                                                      className={`h-full transition-[width] duration-300 ease-out ${pctPasos === 100 ? 'bg-emerald-400' : 'bg-sky-400'
                                                        }`}
                                                      style={{ width: `${pctPasos}%` }}
                                                    />
                                                  </div>
                                                </div>

                                                {/* Lista de pasos con checkboxes interactivos */}
                                                {pasosAbiertos && (
                                                  <div className="mt-2 space-y-1 pl-3.5 border-l-2 border-slate-800/80 animate-in fade-in duration-150">
                                                    {pasosTarea.map((paso: SubtareaPaso) => (
                                                      <div
                                                        key={paso.id}
                                                        className="text-[11px] text-slate-300 py-0.5 flex items-center justify-between gap-2 hover:bg-slate-800/30 rounded px-1.5 transition-colors"
                                                      >
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                          <button
                                                            type="button"
                                                            onClick={async (e) => {
                                                              e.stopPropagation();
                                                              await db.subtareas_pasos.update(paso.id, {
                                                                completado: !paso.completado,
                                                                updated_at: new Date().toISOString()
                                                              });
                                                            }}
                                                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 cursor-pointer transition ${paso.completado
                                                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                                                : 'border-slate-700 hover:border-slate-500 bg-slate-800'
                                                              }`}
                                                          >
                                                            {paso.completado && (
                                                              <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
                                                            )}
                                                          </button>
                                                          <span
                                                            className={`truncate ${paso.completado
                                                                ? 'line-through text-slate-500'
                                                                : 'text-slate-300'
                                                              }`}
                                                          >
                                                            {paso.descripcion_paso ||
                                                              paso.nombre_paso ||
                                                              'Paso'}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            )}
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
                                      {gastosHito.map((g) => {
                                        const mGasto =
                                          Number(g.monto_pen ?? g.Monto_PEN ?? g.Monto_Moneda_Base ?? g.monto ?? 0) || 0;
                                        const estPago = String(g.Estado_Pago || g.estado_pago || g.Estado || '').trim().toLowerCase();
                                        const esDesvio = Boolean(g.desvio || g.es_sobrecosto || estPago.includes('desv') || estPago.includes('sobrecosto'));
                                        const esPagado = estPago === 'pagado' || estPago === 'ejecutado';
                                        const categoria = g.Categoria_Gasto || g.categoria || g.tipo || '';
                                        const vinculo = g.tarea_nombre || g.tarea_id || g.Tarea_Asociada || null;

                                        let franjaGastoClass = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]';
                                        if (esDesvio) {
                                          franjaGastoClass = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
                                        } else if (esPagado) {
                                          franjaGastoClass = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
                                        }

                                        return (
                                          <div
                                            key={g.id}
                                            className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-[#0B1120]/90 p-2.5 transition-colors hover:border-sky-500/30 hover:bg-[#0D1526]"
                                          >
                                            {/* Franja Lateral Semántica */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-[3.5px] rounded-l-xl ${franjaGastoClass}`} />

                                            <div className="pl-2 flex items-center justify-between gap-3">
                                              {/* Columna 1, 2 y 3: Concepto, Categoría, Vínculo y Fecha */}
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span className="text-xs font-semibold text-slate-200 break-words group-hover:text-sky-300 transition-colors">
                                                    {g.Descripcion_Gasto || g.concepto || g.descripcion || 'Gasto'}
                                                  </span>
                                                  {categoria && (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 text-sky-300 bg-sky-950/40 border border-sky-800/40 rounded">
                                                      <Tag className="w-2.5 h-2.5" strokeWidth={1.75} />
                                                      <span>{categoria}</span>
                                                    </span>
                                                  )}
                                                </div>

                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 tabular-nums">
                                                    <Calendar className="w-2.5 h-2.5 text-slate-500" strokeWidth={1.75} />
                                                    <span>{g.Fecha_Gasto || g.fecha || '-'}</span>
                                                  </span>
                                                  {vinculo && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 truncate max-w-[130px]">
                                                      {vinculo}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Columna 4: Monto y Estado */}
                                              <div className="text-right shrink-0">
                                                <div className="font-mono tabular-nums text-xs md:text-sm font-bold text-slate-100">
                                                  PEN {mGasto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <span
                                                  className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${esDesvio
                                                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                                      : esPagado
                                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                                    }`}
                                                >
                                                  {esDesvio ? 'Desvío' : esPagado ? 'Pagado' : 'Pendiente'}
                                                </span>
                                              </div>
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
                        {fase.marcadores.map((h: HitoWbsRecord) => {
                          const esComp =
                            h.estado === '03_Completado' || getPropStr(h, 'Estado') === '03_Completado';
                          const marcadorIdKey = h.codigo_legado || h.id;
                          const esMarcadorResaltado =
                            elementoResaltadoId === marcadorIdKey ||
                            elementoResaltadoId === h.id ||
                            elementoResaltadoId === h.codigo_legado;
                          return (
                            <div
                              key={h.id}
                              id={`wbs-nodo-${marcadorIdKey}`}
                              className={`portal-surface bg-[#0D1526] p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors ${esMarcadorResaltado
                                  ? 'ring-2 ring-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-[box-shadow,border-color] duration-300'
                                  : ''
                                }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${esComp
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
                                      className={`font-bold break-words ${esComp ? 'line-through text-slate-500' : 'text-slate-100'
                                        }`}
                                    >
                                      {h.nombre_elemento || h.Nombre_Elemento || h.nombre_hito || h.Nombre_Hito || h.nombre || h.codigo_legado}
                                    </h4>
                                    {(() => {
                                      const presupuestoMarcador =
                                        Number(h.presupuesto_asignado || h.Presupuesto_Asignado || 0) || 0;
                                      if (presupuestoMarcador <= 0) return null;
                                      return (
                                        <span className="text-[10px] font-mono tabular-nums text-sky-300 bg-sky-950/40 border border-sky-500/30 px-1.5 py-0.5 rounded">
                                          PEN {presupuestoMarcador.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-[11px] text-slate-400 break-words leading-relaxed">
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
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${esComp
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
                {tareasGenerales.map((t) => {
                  const est = String(t.estado_tarea || t.Estado_Tarea || t.estado || t.Estado || '02_Por_Hacer').toUpperCase();
                  const esComp = est.includes('04_') || est.includes('COMPLETAD') || est === 'HECHO' || est === 'DONE';
                  const esProc = est.includes('03_') || est.includes('PROCESO') || est.includes('PROGRESO');
                  const esBloq = est.includes('BLOQUEAD') || est.includes('IMPED') || est.includes('CANCEL');
                  let franjaTarea = 'bg-slate-600';
                  if (esComp) franjaTarea = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
                  else if (esProc) franjaTarea = 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]';
                  else if (esBloq) franjaTarea = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';

                  return (
                    <div
                      key={t.id}
                      className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-[#0B1120]/90 p-2.5 transition-colors hover:border-sky-500/30 hover:bg-[#0D1526] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-[3.5px] rounded-l-xl ${franjaTarea}`} />
                      <span className="pl-2 font-medium text-slate-200 group-hover:text-sky-300 transition-colors break-words">
                        {t.nombre_tarea_actividad || t.Nombre_Tarea_Actividad}
                      </span>
                      <div className="font-mono tabular-nums text-slate-400 text-[11px] shrink-0 flex items-center gap-1.5">
                        {(() => {
                          const fProg = t.fecha_programada || t.Fecha_Programada;
                          const fComp = t.fecha_completado || t.Fecha_Completado;
                          if (esComp && fProg && fComp) {
                            const dias = calcularDesfaseDias(fProg, fComp);
                            const clasif = clasificarDesfase(dias);
                            if (clasif.tipo !== 'SIN_DATO') {
                              let bClass = 'text-sky-400 bg-sky-950/40 border-sky-800/40';
                              if (clasif.tipo === 'MORA') bClass = 'text-rose-400 bg-rose-950/40 border-rose-800/40';
                              else if (clasif.tipo === 'ADELANTO') bClass = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
                              return (
                                <span className={`text-[9.5px] px-1 py-0.5 rounded border ${bClass}`} title={`Programado: ${fProg} | Completado: ${fComp}`}>
                                  {clasif.etiqueta}
                                </span>
                              );
                            }
                          }
                          return null;
                        })()}
                        <span>{t.horas_estimadas || 1}h</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-5 space-y-2 border-t lg:border-t-0 lg:border-l lg:pl-5 border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Gastos Generales
                </span>
                {gastosGenerales.map((g) => {
                  const mGasto = Number(g.monto_pen ?? g.Monto_PEN ?? g.Monto_Moneda_Base ?? g.monto ?? 0) || 0;
                  const estPago = String(g.Estado_Pago || g.estado_pago || g.Estado || '').trim().toLowerCase();
                  const esDesvio = Boolean(g.desvio || g.es_sobrecosto || estPago.includes('desv') || estPago.includes('sobrecosto'));
                  const esPagado = estPago === 'pagado' || estPago === 'ejecutado';
                  let franjaGastoClass = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]';
                  if (esDesvio) franjaGastoClass = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
                  else if (esPagado) franjaGastoClass = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';

                  return (
                    <div
                      key={g.id}
                      className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-[#0B1120]/90 p-2.5 transition-colors hover:border-sky-500/30 hover:bg-[#0D1526] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-[3.5px] rounded-l-xl ${franjaGastoClass}`} />
                      <div className="pl-2 min-w-0 flex-1">
                        <span className="font-semibold text-slate-200 group-hover:text-sky-300 transition-colors break-words block">
                          {g.Descripcion_Gasto || g.concepto || 'Gasto'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                          {g.Fecha_Gasto || g.fecha || '-'}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-slate-100 font-bold shrink-0 text-xs md:text-sm">
                        PEN {mGasto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelWBSProyecto;
