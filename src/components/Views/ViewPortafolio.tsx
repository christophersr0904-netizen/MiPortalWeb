import React, { useState, useMemo, useCallback } from 'react';
import {
  FolderKanban,
  FileDown,
  Layers,
  Search,
  SearchX,
  ChevronDown,
  FolderPlus,
  Clock,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  X,
  User,
  Briefcase,
  TrendingUp,
  Users,
  AlertTriangle
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  normalizeProyecto,
  type CanonicalProyecto
} from '../../utils/entityNormalizer';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import { ModalExportarPdf } from '../Modals/ModalExportarPdf';
import { ModalNuevoProyecto } from '../Modals/ModalNuevoProyecto';
import { ModalTareaFlow } from '../Modals/ModalTareaFlow';
import { FiltrosPortafolio } from '../PMO/FiltrosPortafolio';
import { TarjetaProyecto } from '../PMO/TarjetaProyecto';
import CountUp from '../CountUp';

interface ViewPortafolioProps {
  onSeleccionarProyecto: (proyectoId: string) => void;
}

export const ViewPortafolio: React.FC<ViewPortafolioProps> = ({ onSeleccionarProyecto }) => {
  const { programarEliminacion, estaOculto } = useUndoDelete();

  // Estados de Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [carteraAbierta, setCarteraAbierta] = useState<boolean>(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroSalud, setFiltroSalud] = useState<string>('');
  const [filtroOrden, setFiltroOrden] = useState<string>('avance_desc');
  const [busqueda, setBusqueda] = useState<string>('');
  const [vistaModo, setVistaModo] = useState<'grid' | 'table'>('grid');

  // Estados de modales canónicos
  const [modalPdfAbierto, setModalPdfAbierto] = useState(false);
  const [modalProyectoAbierto, setModalProyectoAbierto] = useState(false);
  const [proyectoAEditarId, setProyectoAEditarId] = useState<string | null>(null);
  const [modalTareaProps, setModalTareaProps] = useState<{ abierto: boolean; proyectoCodigo?: string | null }>({
    abierto: false,
    proyectoCodigo: null
  });
  const [proyectoAEliminar, setProyectoAEliminar] = useState<CanonicalProyecto | null>(null);

  // Consultas reactivas Dexie filtradas con el búfer de deshacer
  const rawProyectosLive = useLiveQuery(() => db.proyectos.toArray(), []) ?? [];
  const rawTareasLive = useLiveQuery(() => db.tareas.toArray(), []) ?? [];

  const rawProyectos = useMemo(
    () => rawProyectosLive.filter((p: any) => !estaOculto(p.id) && !estaOculto(p.codigo_legado)),
    [rawProyectosLive, estaOculto]
  );
  const rawTareas = useMemo(
    () =>
      rawTareasLive.filter((t: any) => {
        if (estaOculto(t.id) || estaOculto(t.codigo_legado)) return false;
        const pid = String(
          t.proyecto_codigo ||
            t.id_proyecto ||
            (t.ID_Proyecto && String(t.ID_Proyecto).startsWith('PRO-') ? t.ID_Proyecto : '')
        ).trim();
        const proyUuid = String(t.proyecto_id || '').trim();
        if (pid && estaOculto(pid)) return false;
        if (proyUuid && estaOculto(proyUuid)) return false;
        return true;
      }),
    [rawTareasLive, estaOculto]
  );

  const proyectos: CanonicalProyecto[] = useMemo(() => {
    return rawProyectos.map(normalizeProyecto);
  }, [rawProyectos]);

  // Indexación O(1) de tareas por proyecto
  const tareasPorProyecto = useMemo(() => {
    const map = new Map<string, any[]>();
    rawTareas.forEach((t: any) => {
      const pid = String(t.proyecto_codigo || t.id_proyecto || (t.ID_Proyecto && String(t.ID_Proyecto).startsWith('PRO-') ? t.ID_Proyecto : '')).trim();
      if (pid) {
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid)!.push(t);
      }
      const proyUuid = String(t.proyecto_id || '').trim();
      if (proyUuid && proyUuid !== pid) {
        if (!map.has(proyUuid)) map.set(proyUuid, []);
        map.get(proyUuid)!.push(t);
      }
    });
    return map;
  }, [rawTareas]);

  // Resumen O(1) de tareas (total y completadas) por proyecto
  const resumenTareasPorProyecto = useMemo(() => {
    const mapa = new Map<string, { total: number; completadas: number }>();
    tareasPorProyecto.forEach((tareas, key) => {
      const total = tareas.length;
      const completadas = tareas.filter((t: any) =>
        String(t.Estado_Tarea || t.estado_tarea || '').includes('Completad')
      ).length;
      mapa.set(key, { total, completadas });
    });
    return mapa;
  }, [tareasPorProyecto]);

  // Cálculos de KPIs Ejecutivos Consolidados (O(N))
  const {
    totalProyectos,
    proyEjecucion,
    proyPlan,
    proyBacklog,
    proyPausa,
    proyCerrados,
    promReal,
    promMeta,
    sumaBAC,
    sumaAC,
    countRango,
    countRiesgo,
    countBloqueado,
    pctBurn,
    saldoRestante,
    countsPorTipo
  } = useMemo(() => {
    const total = proyectos.length;
    let ejec = 0, plan = 0, back = 0, pausa = 0, cerr = 0;
    let sReal = 0, sMeta = 0, bac = 0, ac = 0;
    let cRango = 0, cRiesgo = 0, cBloq = 0;
    const tiposMap: Record<string, number> = { Personal: 0, Profesional: 0, Inversiones: 0, Social: 0 };

    proyectos.forEach((p) => {
      const st = String(p.estado || '');
      if (st.includes('03_En_Ejecucion') || st.includes('Ejecucion')) ejec++;
      else if (st.includes('02_Planificado') || st.includes('Planificado')) plan++;
      else if (st.includes('01_Backlog') || st.includes('Backlog')) back++;
      else if (st.includes('04_En_Pausa') || st.includes('Pausa')) pausa++;
      else if (st.includes('06_Cerrado') || st.includes('Cerrado') || st.includes('04_Cerrado')) cerr++;

      sReal += (p.avance_pct || 0);
      sMeta += 60; // Meta proyectada referencial estándar

      bac += (p.presupuesto || 0);
      ac += (p.costo_real || 0);

      const h = String(p.health_status || '').toLowerCase();
      if (h.includes('bloqueado') || h.includes('crítico') || h.includes('critico')) cBloq++;
      else if (h.includes('riesgo') || h.includes('alerta')) cRiesgo++;
      else cRango++;

      const tipo = p.tipo_iniciativa;
      if (tipo && tiposMap[tipo] !== undefined) {
        tiposMap[tipo]++;
      }
    });

    const pReal = total > 0 ? Math.round(sReal / total) : 0;
    const pMeta = total > 0 ? Math.round(sMeta / total) : 0;
    const burn = bac > 0 ? Math.round((ac / bac) * 100) : 0;
    const saldo = Math.max(0, bac - ac);

    return {
      totalProyectos: total,
      proyEjecucion: ejec,
      proyPlan: plan,
      proyBacklog: back,
      proyPausa: pausa,
      proyCerrados: cerr,
      promReal: pReal,
      promMeta: pMeta,
      sumaBAC: bac,
      sumaAC: ac,
      countRango: cRango,
      countRiesgo: cRiesgo,
      countBloqueado: cBloq,
      pctBurn: burn,
      saldoRestante: saldo,
      countsPorTipo: tiposMap
    };
  }, [proyectos]);

  // Filtrado y Ordenamiento Reactivo
  const proyectosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    const filtrados = proyectos.filter((p) => {
      if (filtroTipo && p.tipo_iniciativa !== filtroTipo) return false;
      if (filtroEstado && !String(p.estado || '').includes(filtroEstado)) return false;
      if (filtroSalud) {
        const h = String(p.health_status || '').toLowerCase();
        if (filtroSalud === 'En Rango' && !h.includes('rango') && !h.includes('saludable')) return false;
        if (filtroSalud === 'En Riesgo' && !h.includes('riesgo') && !h.includes('alerta')) return false;
        if (filtroSalud === 'Bloqueado' && !h.includes('bloqueado') && !h.includes('crítico') && !h.includes('critico')) return false;
      }
      if (q) {
        const nom = String(p.nombre || '').toLowerCase();
        const cod = String(p.codigo_legado || '').toLowerCase();
        const okr = String(p.north_star_okr || '').toLowerCase();
        const lid = String((p as any).lider || (p as any).lider_proyecto || '').toLowerCase();
        if (!nom.includes(q) && !cod.includes(q) && !okr.includes(q) && !lid.includes(q)) return false;
      }
      return true;
    });

    // Ordenamiento
    filtrados.sort((a, b) => {
      const avA = a.avance_pct || 0;
      const avB = b.avance_pct || 0;
      const bacA = a.presupuesto || 0;
      const bacB = b.presupuesto || 0;
      const acA = a.costo_real || 0;
      const acB = b.costo_real || 0;

      if (filtroOrden === 'avance_desc') return avB - avA;
      if (filtroOrden === 'avance_asc') return avA - avB;
      if (filtroOrden === 'presupuesto_desc') return bacB - bacA;
      if (filtroOrden === 'gasto_desc') return acB - acA;
      if (filtroOrden === 'fecha_asc') {
        const fA = a.fecha_fin ? new Date(a.fecha_fin).getTime() : 9999999999999;
        const fB = b.fecha_fin ? new Date(b.fecha_fin).getTime() : 9999999999999;
        return fA - fB;
      }
      if (filtroOrden === 'nombre_asc') {
        return (a.nombre || '').localeCompare(b.nombre || '');
      }
      return 0;
    });

    return filtrados;
  }, [proyectos, filtroTipo, filtroEstado, filtroSalud, filtroOrden, busqueda]);

  const hayFiltrosActivos = busqueda !== '' || filtroTipo !== '' || filtroEstado !== '' || filtroSalud !== '' || filtroOrden !== 'avance_desc';

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroTipo('');
    setFiltroEstado('');
    setFiltroSalud('');
    setFiltroOrden('avance_desc');
  };

  const handleAñadirTarea = useCallback((codigo: string) => {
    setModalTareaProps({ abierto: true, proyectoCodigo: codigo });
  }, []);

  const handleEditarProyecto = useCallback((id: string) => {
    setProyectoAEditarId(id);
    setModalProyectoAbierto(true);
  }, []);

  const handleEliminarProyecto = useCallback((p: CanonicalProyecto) => {
    setProyectoAEliminar(p);
  }, []);

  const ejecutarEliminacionCascada = (p: CanonicalProyecto) => {
    const targetId = p.id;
    const codLegado = p.codigo_legado || p.id;
    const etiqueta = p.nombre || codLegado;

    programarEliminacion({
      tabla: 'proyectos',
      id: targetId,
      idsSecundarios: codLegado && codLegado !== targetId ? [codLegado] : undefined,
      etiqueta: `Proyecto: ${etiqueta}`,
      tipo: 'PROYECTO',
      commit: async () => {
        await db.transaction('rw', [db.proyectos, db.hitos_wbs, db.tareas, db.subtareas_pasos, db.gastos], async () => {
          // 1. Obtener hitos del proyecto
          const hitos = await db.hitos_wbs
            .where('proyecto_id')
            .equals(targetId)
            .or('proyecto_id')
            .equals(codLegado)
            .toArray();
          const hitoIds = hitos.map((h) => h.id);
          const hitoCodigos = hitos.map((h) => h.codigo_legado).filter(Boolean);

          // 2. Obtener tareas del proyecto
          const tareas = await db.tareas
            .where('proyecto_codigo')
            .equals(targetId)
            .or('proyecto_codigo')
            .equals(codLegado)
            .toArray();
          const tareaIds = tareas.map((t) => t.id);
          const tareaCodigos = tareas.map((t) => t.codigo_legado).filter(Boolean);

          // 3. Eliminar subtareas subordinadas vinculadas a tareas
          const subPadres = Array.from(new Set([...tareaIds, ...tareaCodigos]));
          if (subPadres.length > 0) {
            await db.subtareas_pasos.where('id_padre_vinculado').anyOf(subPadres).delete();
          }

          // 4. Eliminar gastos subordinados (optimizado con consulta indexada Dexie)
          const pId = codLegado || targetId;
          const gastosProy = await db.gastos.where('id_proyecto').equals(pId).toArray();
          const gastosABorrar = gastosProy.filter((g: any) => {
            const gProy = String(g.id_proyecto || g.id_origen_vinculado || g.ID_Proyecto || g.proyecto_id || '').trim();
            const gHito = String(g.ID_Hito || g.id_hito || '').trim();
            const gTarea = String(g.ID_Tarea || g.id_tarea || '').trim();
            return (
              gProy === targetId ||
              gProy === codLegado ||
              (gHito && (hitoIds.includes(gHito) || hitoCodigos.includes(gHito))) ||
              (gTarea && (tareaIds.includes(gTarea) || tareaCodigos.includes(gTarea)))
            );
          });
          if (gastosABorrar.length > 0) {
            await db.gastos.bulkDelete(gastosABorrar.map((g) => g.id));
          }

          // 5. Eliminar tareas subordinadas
          if (tareaIds.length > 0) {
            await db.tareas.bulkDelete(tareaIds);
          }

          // 6. Eliminar hitos subordinados
          if (hitoIds.length > 0) {
            await db.hitos_wbs.bulkDelete(hitoIds);
          }

          // 7. Eliminar proyecto raíz
          await db.proyectos.delete(targetId);
        });
      }
    });
    setProyectoAEliminar(null);
  };

  return (
    <div
      id="vista-portafolio-wrapper"
      className="flex-1 flex flex-col h-full w-full overflow-y-auto overscroll-contain p-3 md:p-6 lg:p-8 pb-28 md:pb-8 bg-[#040711] text-slate-100 transition-colors duration-200 custom-scrollbar space-y-4 md:space-y-6"
    >
      {/* CABECERA PRINCIPAL DEL PORTAFOLIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0B132B] border border-slate-800/80 flex items-center justify-center text-sky-400 shrink-0">
            <FolderKanban className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black text-slate-100 tracking-tight">
                Portafolio Ejecutivo
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/80">
                360° Management
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-400">
              Control estratégico, avance ponderado, ruta crítica y salud financiera
            </p>
          </div>
        </div>

        {/* ACCIONES RÁPIDAS GLOBALES DEL PORTAFOLIO */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setModalPdfAbierto(true)}
            className="h-10 px-3.5 rounded-xl border border-slate-800/80 bg-[#0D1526] text-slate-300 hover:bg-slate-800/60 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Compilar y Descargar Ficha Ejecutiva en PDF"
          >
            <FileDown className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
            <span>Exportar PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProyectoAEditarId(null);
              setModalProyectoAbierto(true);
            }}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 border border-sky-300/40 shadow-[0_0_20px_rgba(56,189,248,0.28)] hover:shadow-[0_0_28px_rgba(56,189,248,0.45)] transition-all duration-200 active:scale-95 cursor-pointer select-none group"
            title="Crear Nuevo Proyecto Estratégico"
          >
            <FolderPlus className="w-4 h-4 text-slate-950 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
            <span className="tracking-tight">Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: KPI CARDS EJECUTIVAS CON COUNTUP Y CUADRÍCULA 2X2 MÓVIL (REQ-UI-29) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-0">
        {/* KPI 1: TOTAL PROYECTOS & FASES */}
        <div className="portal-surface bg-[#0D1526]/90 p-2.5 sm:p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition-colors duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate leading-none">
              Iniciativas
            </span>
            <span className="sm:w-7 sm:h-7 sm:rounded-xl sm:bg-sky-950/60 text-sky-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="mt-1 sm:my-2 flex items-baseline gap-1.5 sm:gap-2">
            <div className="text-lg sm:text-3xl font-bold text-slate-100 font-mono tabular-nums tracking-tight leading-none" id="kpi-total-proyectos">
              <CountUp
                to={totalProyectos}
                duration={1.2}
                trigger="load"
                className="font-mono font-bold tabular-nums"
              />
            </div>
            <span className="hidden sm:inline text-[11px] font-medium text-slate-400 font-mono tabular-nums" id="kpi-sub-total-proyectos">
              {proyEjecucion + proyPlan} act.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/80 text-[10px] font-semibold text-slate-400 font-mono tabular-nums">
            <span className="text-emerald-400 font-bold" id="kpi-proy-ejecucion">{proyEjecucion} ejec.</span>
            <span>•</span>
            <span className="text-sky-400 font-bold" id="kpi-proy-plan">{proyPlan} plan.</span>
            <span>•</span>
            <span className="text-slate-400 font-bold" id="kpi-proy-cerrados">{proyCerrados} cerrados</span>
          </div>
        </div>

        {/* KPI 2: AVANCE GLOBAL PONDERADO */}
        <div className="portal-surface bg-[#0D1526]/90 p-2.5 sm:p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition-colors duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate leading-none">
              Avance Global
            </span>
            <span className="sm:w-7 sm:h-7 sm:rounded-xl sm:bg-emerald-950/60 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="mt-1 sm:my-2 flex items-baseline justify-between gap-1">
            <div className="text-lg sm:text-3xl font-bold text-sky-400 font-mono tabular-nums tracking-tight leading-none" id="kpi-avance-promedio">
              <CountUp
                to={promReal}
                duration={1.2}
                trigger="load"
                suffix="%"
                className="font-mono font-bold tabular-nums"
              />
            </div>
            <span className="hidden sm:inline text-[11px] font-medium text-slate-400 font-mono tabular-nums" id="kpi-avance-meta">
              Meta: {promMeta}%
            </span>
          </div>
          <div className="hidden sm:block space-y-1 pt-2 border-t border-slate-800/80">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative shadow-inner">
              <div
                id="kpi-avance-meta-bar"
                className="bg-sky-950/60 border border-sky-800/40 h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                style={{ width: `${promMeta}%` }}
              />
              <div
                id="kpi-avance-real-bar"
                className="bg-sky-500 h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                style={{ width: `${promReal}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: CONSUMO PRESUPUESTARIO (BURN RATE) */}
        <div className="portal-surface bg-[#0D1526]/90 p-2.5 sm:p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition-colors duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate leading-none">
              Presupuesto
            </span>
            <span className="sm:w-7 sm:h-7 sm:rounded-xl sm:bg-amber-950/60 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="mt-1 sm:my-2 min-w-0">
            <div className="text-sm sm:text-2xl font-bold text-slate-100 font-mono tabular-nums tracking-tight truncate leading-none" id="kpi-gasto-total">
              <CountUp
                to={sumaAC}
                duration={1.2}
                trigger="load"
                decimals={2}
                separator=","
                prefix="PEN "
                className="font-mono font-bold tabular-nums"
              />
            </div>
            <div className="hidden sm:flex text-[11px] text-slate-400 items-center gap-1 font-mono tabular-nums mt-0.5">
              <span>de</span>
              <b className="text-slate-300" id="kpi-presupuesto-total">
                PEN {sumaBAC.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </b>
              <span
                id="kpi-presupuesto-pct"
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono tabular-nums ${
                  pctBurn > 100
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                    : pctBurn > 85
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                }`}
              >
                {pctBurn}%
              </span>
            </div>
          </div>
          <div className="hidden sm:flex justify-between items-center pt-2 border-t border-slate-800/80 text-[10px] font-mono tabular-nums text-slate-400">
            <span>Saldo restante:</span>
            <b className="text-emerald-400" id="kpi-saldo-restante">
              PEN {saldoRestante.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </b>
          </div>
        </div>

        {/* KPI 4: SALUD & RIESGOS DEL PORTAFOLIO */}
        <div className="portal-surface bg-[#0D1526]/90 p-2.5 sm:p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition-colors duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate leading-none">
              Salud
            </span>
            <span id="kpi-health-icon" className="w-4 h-4 sm:w-7 sm:h-7 sm:rounded-xl sm:bg-slate-900/80 flex items-center justify-center text-xs font-bold relative shrink-0">
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${countBloqueado > 0 ? 'bg-rose-500' : countRiesgo > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            </span>
          </div>
          <div className="mt-1 sm:my-2">
            <div className="text-base sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-1.5 font-mono tabular-nums leading-none" id="kpi-alertas-criticas">
              {countBloqueado + countRiesgo === 0 ? (
                <span className="text-emerald-400 inline-flex items-baseline gap-1">
                  <CountUp
                    to={0}
                    duration={1.2}
                    trigger="load"
                    className="font-mono font-bold tabular-nums"
                  />
                  <span className="text-xs sm:text-base font-bold">riesgo</span>
                </span>
              ) : (
                <span className="text-rose-400 inline-flex items-baseline gap-1">
                  <CountUp
                    to={countBloqueado + countRiesgo}
                    duration={1.2}
                    trigger="load"
                    className="font-mono font-bold tabular-nums"
                  />
                  <span className="text-xs sm:text-base font-bold">alerta</span>
                </span>
              )}
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 mt-0.5" id="kpi-alertas-desc">
              {countBloqueado + countRiesgo === 0
                ? 'Portafolio operando en rango normal'
                : `${countBloqueado} bloqueado(s) • ${countRiesgo} en riesgo`}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-bold font-mono tabular-nums">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1" />
              <span>{countRango}</span>
            </span>
            <span>•</span>
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block mr-1" />
              <span>{countRiesgo}</span>
            </span>
            <span>•</span>
            <span className="text-rose-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block mr-1" />
              <span>{countBloqueado}</span>
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: BARRA DE DISTRIBUCIÓN GERENCIAL Y SEMÁFORO INTERACTIVO */}
      <div className="bg-[#0D1526]/90 p-4 rounded-xl border border-slate-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-400" strokeWidth={1.75} />
            <span>Distribución de Estados del Portafolio</span>
          </span>

          {/* Semáforo de Salud Interactivo */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Filtrar salud:</span>
            <button
              type="button"
              onClick={() => setFiltroSalud(filtroSalud === 'En Rango' ? '' : 'En Rango')}
              className={`h-9 px-3 rounded-lg text-xs font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 transition-colors flex items-center gap-1.5 cursor-pointer ${
                filtroSalud === 'En Rango' ? 'ring-2 ring-sky-500 font-bold' : 'hover:border-emerald-500/50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className="font-mono tabular-nums">En Rango ({countRango})</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroSalud(filtroSalud === 'En Riesgo' ? '' : 'En Riesgo')}
              className={`h-9 px-3 rounded-lg text-xs font-semibold bg-amber-950/50 text-amber-300 border border-amber-800/60 transition-colors flex items-center gap-1.5 cursor-pointer ${
                filtroSalud === 'En Riesgo' ? 'ring-2 ring-sky-500 font-bold' : 'hover:border-amber-500/50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span className="font-mono tabular-nums">En Riesgo ({countRiesgo})</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroSalud(filtroSalud === 'Bloqueado' ? '' : 'Bloqueado')}
              className={`h-9 px-3 rounded-lg text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-800/60 transition-colors flex items-center gap-1.5 cursor-pointer ${
                filtroSalud === 'Bloqueado' ? 'ring-2 ring-sky-500 font-bold' : 'hover:border-rose-500/50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
              <span className="font-mono tabular-nums">Bloqueados ({countBloqueado})</span>
            </button>
          </div>
        </div>

        {/* Barra segmentada dinámica de estados */}
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex shadow-inner relative" id="bar-distribucion-estados">
          {totalProyectos > 0 ? (
            <>
              {proyEjecucion > 0 && (
                <div
                  className="bg-sky-500 h-full transition-all duration-300 cursor-pointer hover:opacity-85"
                  style={{ width: `${(proyEjecucion / totalProyectos) * 100}%` }}
                  title={`En Ejecución: ${proyEjecucion}`}
                  onClick={() => setFiltroEstado(filtroEstado === '03_En_Ejecucion' ? '' : '03_En_Ejecucion')}
                />
              )}
              {proyPlan > 0 && (
                <div
                  className="bg-blue-500 h-full transition-all duration-300 cursor-pointer hover:opacity-85"
                  style={{ width: `${(proyPlan / totalProyectos) * 100}%` }}
                  title={`Planificado: ${proyPlan}`}
                  onClick={() => setFiltroEstado(filtroEstado === '02_Planificado' ? '' : '02_Planificado')}
                />
              )}
              {proyBacklog > 0 && (
                <div
                  className="bg-slate-500 h-full transition-all duration-300 cursor-pointer hover:opacity-85"
                  style={{ width: `${(proyBacklog / totalProyectos) * 100}%` }}
                  title={`Backlog: ${proyBacklog}`}
                  onClick={() => setFiltroEstado(filtroEstado === '01_Backlog' ? '' : '01_Backlog')}
                />
              )}
              {proyPausa > 0 && (
                <div
                  className="bg-amber-500 h-full transition-all duration-300 cursor-pointer hover:opacity-85"
                  style={{ width: `${(proyPausa / totalProyectos) * 100}%` }}
                  title={`En Pausa: ${proyPausa}`}
                  onClick={() => setFiltroEstado(filtroEstado === '04_En_Pausa' ? '' : '04_En_Pausa')}
                />
              )}
              {proyCerrados > 0 && (
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 cursor-pointer hover:opacity-85"
                  style={{ width: `${(proyCerrados / totalProyectos) * 100}%` }}
                  title={`Cerrado: ${proyCerrados}`}
                  onClick={() => setFiltroEstado(filtroEstado === '06_Cerrado' ? '' : '06_Cerrado')}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-slate-800" />
          )}
        </div>

        {/* Leyenda de la barra segmentada */}
        <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-400 font-medium pt-1">
          <button type="button" onClick={() => setFiltroEstado(filtroEstado === '03_En_Ejecucion' ? '' : '03_En_Ejecucion')} className="flex items-center gap-1.5 hover:text-sky-400 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>En Ejecución (<b>{proyEjecucion}</b>)</span>
          </button>
          <button type="button" onClick={() => setFiltroEstado(filtroEstado === '02_Planificado' ? '' : '02_Planificado')} className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Planificado (<b>{proyPlan}</b>)</span>
          </button>
          <button type="button" onClick={() => setFiltroEstado(filtroEstado === '01_Backlog' ? '' : '01_Backlog')} className="flex items-center gap-1.5 hover:text-slate-300 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span>Backlog (<b>{proyBacklog}</b>)</span>
          </button>
          <button type="button" onClick={() => setFiltroEstado(filtroEstado === '04_En_Pausa' ? '' : '04_En_Pausa')} className="flex items-center gap-1.5 hover:text-amber-400 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>En Pausa (<b>{proyPausa}</b>)</span>
          </button>
          <button type="button" onClick={() => setFiltroEstado(filtroEstado === '06_Cerrado' ? '' : '06_Cerrado')} className="flex items-center gap-1.5 hover:text-emerald-400 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Cerrado (<b>{proyCerrados}</b>)</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 3: BARRA DE FILTROS CRUZADOS, BUSCADOR Y TOGGLE DE VISTA (GRID / TABLE) */}
      <div className="bg-[#0D1526]/90 p-3.5 my-2 space-y-3 rounded-xl border border-slate-800/80">
        {/* FILTRO DE CARTERA INTERACTIVO (Tira táctil horizontal en móvil + Toggle Click en Desktop) */}
        <div className="flex items-center gap-2">
          <div className="relative inline-flex items-center w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCarteraAbierta((prev) => !prev)}
              aria-expanded={carteraAbierta}
              className="hidden sm:flex h-9 px-3 rounded-xl text-xs font-semibold transition-colors items-center gap-2 cursor-pointer bg-[#040711]/70 border border-slate-800/80 text-slate-200 hover:border-sky-500/40 hover:text-white"
            >
              <FolderKanban className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
              <span>Cartera: <b className="text-sky-400 font-bold">{filtroTipo || 'Todos'}</b></span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${carteraAbierta ? 'rotate-180' : ''}`} strokeWidth={1.75} />
            </button>

            {/* Tira horizontal táctil en móvil (< sm) y desplegada por clic en desktop */}
            <div
              id="flyout-cartera-strip"
              className={`flyout-cartera-menu flex overflow-x-auto no-scrollbar gap-1.5 pb-1 w-full sm:w-auto sm:pb-1.5 sm:p-1.5 sm:rounded-xl sm:bg-[#0D1526]/95 sm:backdrop-blur-md sm:border sm:border-slate-800/80 sm:shadow-[0_10px_25px_-5px_rgba(2,6,23,0.85)] sm:absolute sm:left-full sm:top-0 sm:ml-2 z-30 transition-[opacity,transform] duration-200 whitespace-nowrap ${
                carteraAbierta
                  ? 'sm:opacity-100 sm:translate-x-0 sm:pointer-events-auto'
                  : 'sm:opacity-0 sm:translate-x-[-8px] sm:pointer-events-none'
              }`}
            >
              <button
                type="button"
                onClick={() => { setFiltroTipo(''); setCarteraAbierta(false); }}
                className={`h-9 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  filtroTipo === ''
                    ? 'bg-sky-500 text-slate-950 border border-sky-400'
                    : 'bg-[#040711]/70 border border-slate-800/80 text-slate-300 hover:border-sky-500/40 hover:text-white'
                }`}
              >
                <span>Todos</span>
                <span className={`text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-full border ${
                  filtroTipo === ''
                    ? 'bg-slate-950/20 text-slate-950 border-slate-950/25'
                    : 'bg-slate-800 text-slate-400 border-slate-700/60'
                }`}>
                  {totalProyectos}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setFiltroTipo('Personal'); setCarteraAbierta(false); }}
                className={`h-9 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  filtroTipo === 'Personal'
                    ? 'bg-sky-500 text-slate-950 border border-sky-400'
                    : 'bg-[#040711]/70 border border-slate-800/80 text-slate-300 hover:border-sky-500/40 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Personal</span>
                <span className={`text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-full ${
                  filtroTipo === 'Personal' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {countsPorTipo.Personal || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setFiltroTipo('Profesional'); setCarteraAbierta(false); }}
                className={`h-9 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  filtroTipo === 'Profesional'
                    ? 'bg-sky-500 text-slate-950 border border-sky-400'
                    : 'bg-[#040711]/70 border border-slate-800/80 text-slate-300 hover:border-sky-500/40 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Profesional</span>
                <span className={`text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-full ${
                  filtroTipo === 'Profesional' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {countsPorTipo.Profesional || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setFiltroTipo('Inversiones'); setCarteraAbierta(false); }}
                className={`h-9 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  filtroTipo === 'Inversiones'
                    ? 'bg-sky-500 text-slate-950 border border-sky-400'
                    : 'bg-[#040711]/70 border border-slate-800/80 text-slate-300 hover:border-sky-500/40 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Inversiones</span>
                <span className={`text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-full ${
                  filtroTipo === 'Inversiones' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {countsPorTipo.Inversiones || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setFiltroTipo('Social'); setCarteraAbierta(false); }}
                className={`h-9 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  filtroTipo === 'Social'
                    ? 'bg-sky-500 text-slate-950 border border-sky-400'
                    : 'bg-[#040711]/70 border border-slate-800/80 text-slate-300 hover:border-sky-500/40 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Social</span>
                <span className={`text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-full ${
                  filtroTipo === 'Social' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {countsPorTipo.Social || 0}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* BARRA SECUNDARIA: BUSCADOR, ESTADO, SALUD, ORDEN Y CONMUTADOR VISTA */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2.5 border-t border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Buscador Rápido */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar proyecto, ID, OKR o líder..."
                className="w-full h-9 bg-[#040711]/70 text-slate-200 placeholder-slate-500 text-xs rounded-xl border border-slate-800/80 focus:border-sky-500/50 pl-8 pr-7 outline-none transition-colors"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* Controles de Filtrado Desacoplados (Patrones A, B y C ReactBits) */}
            <FiltrosPortafolio
              filtroEstado={filtroEstado}
              setFiltroEstado={setFiltroEstado}
              filtroSalud={filtroSalud}
              setFiltroSalud={setFiltroSalud}
              filtroOrden={filtroOrden}
              setFiltroOrden={setFiltroOrden}
            />

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="h-9 px-3 rounded-xl text-xs font-semibold bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-800/60 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {/* Selector de Vista (Cuadrícula / Tabla) */}
          <div className="h-9 flex items-center gap-1 p-0.5 bg-[#040711]/70 rounded-xl border border-slate-800/80 shrink-0">
            <button
              type="button"
              onClick={() => setVistaModo('grid')}
              className={`h-full px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                vistaModo === 'grid'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Tarjetas</span>
            </button>

            <button
              type="button"
              onClick={() => setVistaModo('table')}
              className={`h-full px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                vistaModo === 'table'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Tabla</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4A: VISTA CUADRÍCULA DE TARJETAS ENRIQUECIDAS */}
      {vistaModo === 'grid' ? (
        proyectosFiltrados.length === 0 ? (
          proyectos.length === 0 ? (
            /* Bento Empty State Onboarding: Portafolio en blanco */
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0D1526]/90 rounded-xl border border-slate-800/80 min-h-[420px] [contain:layout]">
              <div className="w-12 h-12 rounded-2xl bg-[#0B132B] border border-slate-800/80 flex items-center justify-center text-sky-400 mb-3.5">
                <FolderKanban className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="font-bold text-base text-slate-100 mb-1">
                Comienza tu Portafolio Ejecutivo
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
                Aún no tienes iniciativas registradas. Inicia creando tu primer proyecto estratégico para gestionar hitos WBS, tareas operativas y salud financiera.
              </p>
              <button
                type="button"
                onClick={() => {
                  setProyectoAEditarId(null);
                  setModalProyectoAbierto(true);
                }}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 text-xs font-bold shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_28px_rgba(56,189,248,0.5)] border border-sky-300/40 transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer group"
              >
                <FolderPlus className="w-4 h-4 text-slate-950 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
                <span>Crear Primer Proyecto</span>
              </button>
            </div>
          ) : (
            /* Bento Empty State Filtro: Búsqueda sin coincidencias */
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0D1526]/90 rounded-xl border border-slate-800/80 min-h-[420px] [contain:layout]">
              <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400 mb-3.5 shadow-inner">
                <SearchX className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <h3 className="font-bold text-base text-slate-100 mb-1">
                Sin Coincidencias en el Portafolio
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
                Ninguna iniciativa coincide con los filtros aplicados en este momento.
              </p>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="h-9 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-sky-300 border border-slate-700/60 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                Restablecer Filtros
              </button>
            </div>
          )
        ) : (
          <div id="grid-proyectos-cards" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-auto items-stretch gap-3 md:gap-5 shrink-0 min-h-[420px]">
            {proyectosFiltrados.map((p) => {
              const resumen = resumenTareasPorProyecto.get(p.codigo_legado) ||
                              resumenTareasPorProyecto.get(p.id) ||
                              { total: 0, completadas: 0 };
              return (
                <TarjetaProyecto
                  key={p.id ? 'proy_' + p.id : 'proy_cod_' + p.codigo_legado}
                  proyecto={p}
                  resumenTareas={resumen}
                  onSeleccionarProyecto={onSeleccionarProyecto}
                  onAñadirTarea={handleAñadirTarea}
                  onEditarProyecto={handleEditarProyecto}
                  onEliminarProyecto={handleEliminarProyecto}
                />
              );
            })}
          </div>
        )
      ) : (
        /* SECCIÓN 4B: VISTA TABLA EJECUTIVA (9 COLUMNAS CANÓNICAS CON VARIANZA) */
        <div id="table-proyectos-wrapper" className="overflow-x-auto rounded-xl bg-[#0D1526]/90 border border-slate-800/80 custom-scrollbar min-h-[520px] contain-layout [contain:layout]">
          <table className="w-full min-w-[960px] text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4">Proyecto</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Salud</th>
                <th className="py-3 px-3 whitespace-nowrap">Estado</th>
                <th className="py-3 px-3 text-right min-w-[140px] whitespace-nowrap">Avance Real</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Tareas</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Plazo Límite</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Presupuesto (AC / BAC)</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Varianza</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {proyectosFiltrados.map((p) => {
                const resumen = resumenTareasPorProyecto.get(p.codigo_legado) ||
                                resumenTareasPorProyecto.get(p.id) ||
                                { total: 0, completadas: 0 };
                const tTotal = resumen.total;
                const tComp = resumen.completadas;

                const bac = p.presupuesto || 0;
                const ac = p.costo_real || 0;
                const varianza = bac > 0 ? bac - ac : 0;

                const h = String(p.health_status || '').toLowerCase();
                const isCrit = h.includes('bloqueado') || h.includes('crítico') || h.includes('critico');
                const isRiesgo = h.includes('riesgo') || h.includes('alerta');
                const healthClean = (p.health_status || 'En Rango').replace(/^[^\p{L}\p{N}]+/u, '').trim();

                return (
                  <tr
                    key={p.id ? 'proy_row_' + p.id : 'proy_cod_row_' + p.codigo_legado}
                    onClick={() => onSeleccionarProyecto(p.codigo_legado || p.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono tabular-nums font-bold text-[10px] bg-slate-900 text-slate-300 px-2 py-1 rounded-md border border-slate-800 shrink-0">
                          {p.codigo_legado}
                        </span>
                        <div className="min-w-0 max-w-[240px]">
                          <div className="font-bold text-slate-100 truncate">{p.nombre}</div>
                          <span className="text-[10px] text-slate-400">{p.tipo_iniciativa || 'General'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div
                        className="relative inline-flex items-center justify-center w-4 h-4 shrink-0 cursor-help"
                        title={healthClean}
                        aria-label={`Salud: ${healthClean}`}
                      >
                        <span
                          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                            isCrit
                              ? 'bg-rose-500'
                              : isRiesgo
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-900 border border-slate-800 text-slate-400">
                        {p.estado ? p.estado.replace(/^\d+_/, '').replace(/_/g, ' ') : 'Activo'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex flex-col items-end space-y-1">
                        <div className="text-[10px] font-mono tabular-nums text-slate-200">
                          {p.avance_pct || 0}%
                        </div>
                        <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-500 h-full rounded-full"
                            style={{ width: `${p.avance_pct || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono tabular-nums text-[11px] text-slate-400">
                      {tComp}/{tTotal}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono tabular-nums text-[11px] text-slate-400">
                      {p.fecha_fin || 'Sin fecha'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono tabular-nums text-[11px]">
                      <div className="text-slate-100">
                        PEN {ac.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        de PEN {bac.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono tabular-nums text-[11px] font-semibold">
                      {bac > 0 ? (
                        <span className={varianza >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {varianza >= 0 ? '+' : '-'}PEN{' '}
                          {Math.abs(varianza).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSeleccionarProyecto(p.id); }}
                        className="h-9 px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Ver 360°
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales Canónicos del Portafolio */}
      <ModalExportarPdf
        abierto={modalPdfAbierto}
        onCerrar={() => setModalPdfAbierto(false)}
        proyectoIdSeleccionado={null}
      />

      <ModalNuevoProyecto
        abierto={modalProyectoAbierto}
        onCerrar={() => {
          setModalProyectoAbierto(false);
          setProyectoAEditarId(null);
        }}
        proyectoAEditarId={proyectoAEditarId}
      />

      <ModalTareaFlow
        isOpen={modalTareaProps.abierto}
        onClose={() => setModalTareaProps({ abierto: false, proyectoCodigo: null })}
        tareaId={null}
        initialProyectoCodigo={modalTareaProps.proyectoCodigo}
      />

      {/* Modal Declarativo Bento de Confirmación de Eliminación */}
      {proyectoAEliminar && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProyectoAEliminar(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setProyectoAEliminar(null);
            }
          }}
        >
          <div className="w-full max-w-md max-h-[92dvh] bg-[#0D1526] border-t sm:border border-rose-500/40 rounded-t-3xl sm:rounded-2xl shadow-[0_10px_25px_-5px_rgba(2,6,23,0.85)] p-5 text-slate-100 flex flex-col gap-4 relative overflow-hidden">
            <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto -mt-2 sm:hidden flex-shrink-0" />
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100">
                  ¿Eliminar Proyecto en Cascada?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Estás a punto de eliminar el proyecto{' '}
                  <strong className="text-sky-300 font-semibold">
                    {proyectoAEliminar.nombre || proyectoAEliminar.codigo_legado || 'Proyecto'}
                  </strong>.
                </p>
                <p className="text-[11px] text-rose-400 leading-normal pt-1">
                  Esta acción eliminará también en cascada todos sus hitos WBS, tareas operativas, subtareas y gastos vinculados. Tendrás un margen de <strong>4 segundos</strong> para Deshacer.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#0D1526]/95 backdrop-blur-md flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setProyectoAEliminar(null)}
                className="min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => ejecutarEliminacionCascada(proyectoAEliminar)}
                className="min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-rose-900/30"
              >
                Sí, eliminar en cascada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
