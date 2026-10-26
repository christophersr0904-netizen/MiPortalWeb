import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  FileDown,
  Layers,
  Search,
  ChevronDown,
  Plus,
  Clock,
  Sparkles,
  ExternalLink,
  Edit3,
  Trash2,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  X,
  User,
  Briefcase,
  TrendingUp,
  Users
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { BadgeNotasVinculadas } from '../Notas/BadgeNotasVinculadas';
import {
  normalizeProyecto,
  type CanonicalProyecto
} from '../../utils/entityNormalizer';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import { ModalExportarPdf } from '../Modals/ModalExportarPdf';
import { ModalNuevoProyecto } from '../Modals/ModalNuevoProyecto';
import { ModalTareaFlow } from '../Modals/ModalTareaFlow';
import Swal from 'sweetalert2';

interface ViewPortafolioProps {
  onSeleccionarProyecto: (proyectoId: string) => void;
}

export const ViewPortafolio: React.FC<ViewPortafolioProps> = ({ onSeleccionarProyecto }) => {
  const { programarEliminacion, estaOculto } = useUndoDelete();

  // Estados de Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroSalud, setFiltroSalud] = useState<string>('');
  const [filtroOrden, setFiltroOrden] = useState<string>('avance_desc');
  const [busqueda, setBusqueda] = useState<string>('');
  const [vistaModo, setVistaModo] = useState<'grid' | 'table'>('grid');

  // Estados de menús desplegables
  const [openDropdown, setOpenDropdown] = useState<'estado' | 'salud' | 'orden' | null>(null);

  // Estados de modales canónicos
  const [modalPdfAbierto, setModalPdfAbierto] = useState(false);
  const [modalProyectoAbierto, setModalProyectoAbierto] = useState(false);
  const [proyectoAEditarId, setProyectoAEditarId] = useState<string | null>(null);
  const [modalTareaProps, setModalTareaProps] = useState<{ abierto: boolean; proyectoCodigo?: string | null }>({
    abierto: false,
    proyectoCodigo: null
  });

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

  const confirmarEliminacionCascada = async (p: CanonicalProyecto) => {
    const nombreProy = p.nombre || p.codigo_legado || 'Proyecto';
    const resultado = await Swal.fire({
      title: '⚠️ ¿Eliminar Proyecto en Cascada?',
      html: `Estás a punto de eliminar el proyecto <strong class="text-sky-300">${nombreProy}</strong>.<br/><br/><span class="text-rose-400 text-xs">Esta acción eliminará también en cascada todos sus hitos WBS, tareas operativas, subtareas y gastos vinculados.</span><br/><br/>Tendrás un margen de <strong>4 segundos</strong> para Deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar en cascada',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      background: '#0D1526',
      color: '#f8fafc',
      customClass: {
        popup: 'border border-rose-500/40 shadow-2xl rounded-2xl text-xs'
      }
    });

    if (!resultado.isConfirmed) return;

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

          // 4. Eliminar gastos subordinados
          const gastosProy = await db.gastos.toArray();
          const gastosABorrar = gastosProy.filter((g: any) => {
            const gProy = String(g.id_origen_vinculado || g.ID_Proyecto || g.proyecto_id || '').trim();
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
  };

  return (
    <div
      id="vista-portafolio-wrapper"
      className="flex-1 flex flex-col h-full w-full overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-100 dark:bg-slate-950 transition-colors duration-200 custom-scrollbar space-y-6"
    >
      {/* CABECERA PRINCIPAL DEL PORTAFOLIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Portafolio Ejecutivo
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                360° Management
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control estratégico, avance ponderado, ruta crítica y salud financiera
            </p>
          </div>
        </div>

        {/* ACCIONES RÁPIDAS GLOBALES DEL PORTAFOLIO */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setModalPdfAbierto(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
            title="Compilar y Descargar Ficha Ejecutiva en PDF"
          >
            <FileDown className="w-4 h-4 text-slate-400" />
            <span>Exportar PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProyectoAEditarId(null);
              setModalProyectoAbierto(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30 dark:shadow-indigo-950/50 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
            title="Crear Nuevo Proyecto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: KPI CARDS EJECUTIVAS CON MICRO-MÉTRICAS Y BURN RATE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: TOTAL PROYECTOS & FASES */}
        <div className="portal-surface bg-white dark:bg-[#0D1526] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Iniciativas Totales
            </span>
            <span className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight" id="kpi-total-proyectos">
              {totalProyectos}
            </div>
            <span className="text-[11px] font-medium text-slate-400 font-mono tabular-nums" id="kpi-sub-total-proyectos">
              {proyEjecucion + proyPlan} activas
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-semibold text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold" id="kpi-proy-ejecucion">{proyEjecucion} ejec.</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold" id="kpi-proy-plan">{proyPlan} plan.</span>
            <span>•</span>
            <span className="text-slate-400 font-bold" id="kpi-proy-cerrados">{proyCerrados} cerrados</span>
          </div>
        </div>

        {/* KPI 2: AVANCE GLOBAL PONDERADO */}
        <div className="portal-surface bg-white dark:bg-[#0D1526] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Avance Global Real
            </span>
            <span className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums tracking-tight" id="kpi-avance-promedio">
              {promReal}%
            </div>
            <span className="text-[11px] font-medium text-slate-400 font-mono tabular-nums" id="kpi-avance-meta">
              Meta: {promMeta}%
            </span>
          </div>
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative shadow-inner">
              <div
                id="kpi-avance-meta-bar"
                className="bg-indigo-300/40 dark:bg-indigo-700/40 h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                style={{ width: `${promMeta}%` }}
              />
              <div
                id="kpi-avance-real-bar"
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                style={{ width: `${promReal}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: CONSUMO PRESUPUESTARIO (BURN RATE) */}
        <div className="portal-surface bg-white dark:bg-[#0D1526] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Consumo Presupuesto
            </span>
            <span className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight" id="kpi-gasto-total">
              PEN {sumaAC.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono tabular-nums mt-0.5">
              <span>de</span>
              <b className="text-slate-600 dark:text-slate-300" id="kpi-presupuesto-total">
                PEN {sumaBAC.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </b>
              <span
                id="kpi-presupuesto-pct"
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border font-mono tabular-nums ${
                  pctBurn > 100
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                    : pctBurn > 85
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                }`}
              >
                {pctBurn}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
            <span>Saldo restante:</span>
            <b className="text-emerald-600 dark:text-emerald-400" id="kpi-saldo-restante">
              PEN {saldoRestante.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </b>
          </div>
        </div>

        {/* KPI 4: SALUD & RIESGOS DEL PORTAFOLIO */}
        <div className="portal-surface bg-white dark:bg-[#0D1526] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/40 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Salud & Riesgos
            </span>
            <span id="kpi-health-icon" className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${countBloqueado > 0 ? 'bg-rose-500' : countRiesgo > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 font-mono tabular-nums" id="kpi-alertas-criticas">
              {countBloqueado + countRiesgo === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">0 en riesgo</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400">{countBloqueado + countRiesgo} en alerta</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5" id="kpi-alertas-desc">
              {countBloqueado + countRiesgo === 0
                ? 'Portafolio operando en rango normal'
                : `${countBloqueado} bloqueado(s) • ${countRiesgo} en riesgo`}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-bold font-mono tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1" />
              <span>{countRango}</span>
            </span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1" />
              <span>{countRiesgo}</span>
            </span>
            <span>•</span>
            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block mr-1" />
              <span>{countBloqueado}</span>
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: BARRA DE DISTRIBUCIÓN GERENCIAL Y SEMÁFORO INTERACTIVO */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Distribución de Estados del Portafolio</span>
          </span>

          {/* Semáforo de Salud Interactivo */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Filtrar salud:</span>
            <button
              type="button"
              onClick={() => setFiltroSalud(filtroSalud === 'En Rango' ? '' : 'En Rango')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:scale-105 active:scale-95 transition flex items-center gap-1 shadow-2xs cursor-pointer ${
                filtroSalud === 'En Rango' ? 'ring-2 ring-indigo-500 font-black' : ''
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5" />
              <span>En Rango ({countRango})</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroSalud(filtroSalud === 'En Riesgo' ? '' : 'En Riesgo')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:scale-105 active:scale-95 transition flex items-center gap-1 shadow-2xs cursor-pointer ${
                filtroSalud === 'En Riesgo' ? 'ring-2 ring-indigo-500 font-black' : ''
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1.5" />
              <span>En Riesgo ({countRiesgo})</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroSalud(filtroSalud === 'Bloqueado' ? '' : 'Bloqueado')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:scale-105 active:scale-95 transition flex items-center gap-1 shadow-2xs cursor-pointer ${
                filtroSalud === 'Bloqueado' ? 'ring-2 ring-indigo-500 font-black' : ''
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block mr-1.5" />
              <span>Bloqueados ({countBloqueado})</span>
            </button>
          </div>
        </div>

        {/* Barra segmentada dinámica de estados */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex shadow-inner relative" id="bar-distribucion-estados">
          {totalProyectos > 0 ? (
            <>
              {proyEjecucion > 0 && (
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300 cursor-pointer hover:opacity-85"
                  style={{ width: `${(proyEjecucion / totalProyectos) * 100}%` }}
                  title={`En Ejecución: ${proyEjecucion}`}
                  onClick={() => setFiltroEstado(filtroEstado === '03_En_Ejecucion' ? '' : '03_En_Ejecucion')}
                />
              )}
              {proyPlan > 0 && (
                <div
                  className="bg-blue-500 dark:bg-blue-400 h-full transition-all duration-300 cursor-pointer hover:opacity-85"
                  style={{ width: `${(proyPlan / totalProyectos) * 100}%` }}
                  title={`Planificado: ${proyPlan}`}
                  onClick={() => setFiltroEstado(filtroEstado === '02_Planificado' ? '' : '02_Planificado')}
                />
              )}
              {proyBacklog > 0 && (
                <div
                  className="bg-slate-400 dark:bg-slate-500 h-full transition-all duration-300 cursor-pointer hover:opacity-85"
                  style={{ width: `${(proyBacklog / totalProyectos) * 100}%` }}
                  title={`Backlog: ${proyBacklog}`}
                  onClick={() => setFiltroEstado(filtroEstado === '01_Backlog' ? '' : '01_Backlog')}
                />
              )}
              {proyPausa > 0 && (
                <div
                  className="bg-amber-500 dark:bg-amber-400 h-full transition-all duration-300 cursor-pointer hover:opacity-85"
                  style={{ width: `${(proyPausa / totalProyectos) * 100}%` }}
                  title={`En Pausa: ${proyPausa}`}
                  onClick={() => setFiltroEstado(filtroEstado === '04_En_Pausa' ? '' : '04_En_Pausa')}
                />
              )}
              {proyCerrados > 0 && (
                <div
                  className="bg-emerald-500 dark:bg-emerald-400 h-full transition-all duration-300 cursor-pointer hover:opacity-85"
                  style={{ width: `${(proyCerrados / totalProyectos) * 100}%` }}
                  title={`Cerrado: ${proyCerrados}`}
                  onClick={() => setFiltroEstado(filtroEstado === '06_Cerrado' ? '' : '06_Cerrado')}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-slate-200 dark:bg-slate-700" />
          )}
        </div>

        {/* Leyenda de la barra segmentada */}
        <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1">
          <button type="button" onClick={() => setFiltroEstado(filtroEstado === '03_En_Ejecucion' ? '' : '03_En_Ejecucion')} className="flex items-center gap-1.5 hover:text-indigo-500 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-500" />
            <span>En Ejecución (<b>{proyEjecucion}</b>)</span>
          </button>
          <button type="button" onClick={() => setFiltroEstado(filtroEstado === '02_Planificado' ? '' : '02_Planificado')} className="flex items-center gap-1.5 hover:text-blue-500 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400" />
            <span>Planificado (<b>{proyPlan}</b>)</span>
          </button>
          <button type="button" onClick={() => setFiltroEstado(filtroEstado === '01_Backlog' ? '' : '01_Backlog')} className="flex items-center gap-1.5 hover:text-slate-400 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            <span>Backlog (<b>{proyBacklog}</b>)</span>
          </button>
          <button type="button" onClick={() => setFiltroEstado(filtroEstado === '04_En_Pausa' ? '' : '04_En_Pausa')} className="flex items-center gap-1.5 hover:text-amber-500 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span>En Pausa (<b>{proyPausa}</b>)</span>
          </button>
          <button type="button" onClick={() => setFiltroEstado(filtroEstado === '06_Cerrado' ? '' : '06_Cerrado')} className="flex items-center gap-1.5 hover:text-emerald-500 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span>Cerrado (<b>{proyCerrados}</b>)</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 3: BARRA DE FILTROS CRUZADOS, BUSCADOR Y TOGGLE DE VISTA (GRID / TABLE) */}
      <div className="bg-white dark:bg-slate-900 p-3.5 my-2 space-y-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* FILTRO DE CARTERA CON EXPANSIÓN FLUIDA (GLASSMORPHISM & HOVER / CLICK FLYOUT) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative group/cartera inline-flex items-center">
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 bg-slate-900/70 dark:bg-slate-900/80 border border-slate-700/70 text-slate-200 shadow-sm hover:border-indigo-500 hover:text-white"
            >
              <FolderKanban className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Cartera: <b className="text-indigo-400 font-extrabold">{filtroTipo || 'Todos'}</b></span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 group-hover/cartera:rotate-180" />
            </button>

            {/* Tira de Opciones Desplegable con Glassmorphism */}
            <div
              id="flyout-cartera-strip"
              className="flyout-cartera-menu absolute left-0 sm:left-full top-full sm:top-0 mt-1.5 sm:mt-0 sm:ml-2 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 shadow-xl opacity-0 translate-x-[-8px] pointer-events-none group-hover/cartera:opacity-100 group-hover/cartera:translate-x-0 group-hover/cartera:pointer-events-auto transition-all duration-200 flex-wrap sm:flex-nowrap whitespace-nowrap"
            >
              <button
                type="button"
                onClick={() => setFiltroTipo('')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  filtroTipo === ''
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-500'
                    : 'bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <span>Todos</span>
                <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                  {totalProyectos}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroTipo('Personal')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  filtroTipo === 'Personal'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-500'
                    : 'bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Personal</span>
                <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {countsPorTipo.Personal || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroTipo('Profesional')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  filtroTipo === 'Profesional'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-500'
                    : 'bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Profesional</span>
                <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {countsPorTipo.Profesional || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroTipo('Inversiones')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  filtroTipo === 'Inversiones'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-500'
                    : 'bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Inversiones</span>
                <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {countsPorTipo.Inversiones || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroTipo('Social')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  filtroTipo === 'Social'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-500'
                    : 'bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Social</span>
                <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {countsPorTipo.Social || 0}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* BARRA SECUNDARIA: BUSCADOR, ESTADO, SALUD, ORDEN Y CONMUTADOR VISTA */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Buscador Rápido */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar proyecto, ID, OKR o líder..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pl-8 pr-7 py-1.5 outline-none transition shadow-2xs"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown: ESTADO */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'estado' ? null : 'estado')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/70 text-slate-300 hover:border-slate-500 hover:text-white shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block shrink-0" />
                <span>{filtroEstado ? `Estado: ${filtroEstado.replace(/^\d+_/, '').replace(/_/g, ' ')}` : 'Estado: Todos'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {openDropdown === 'estado' && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-44 p-1.5 rounded-xl bg-[#0B1222] border border-slate-700/80 shadow-2xl space-y-1">
                  {[
                    { key: '', label: 'Todos' },
                    { key: '03_En_Ejecucion', label: 'En Ejecución', dot: 'bg-sky-500' },
                    { key: '02_Planificado', label: 'Planificado', dot: 'bg-indigo-500' },
                    { key: '01_Backlog', label: 'Backlog', dot: 'bg-slate-400' },
                    { key: '04_En_Pausa', label: 'En Pausa', dot: 'bg-amber-500' },
                    { key: '06_Cerrado', label: 'Cerrado', dot: 'bg-emerald-500' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setFiltroEstado(item.key);
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      {item.dot && <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown: SALUD */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'salud' ? null : 'salud')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/70 text-slate-300 hover:border-slate-500 hover:text-white shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" />
                <span>{filtroSalud ? `Salud: ${filtroSalud}` : 'Salud: Todas'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {openDropdown === 'salud' && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-48 p-1.5 rounded-xl bg-[#0B1222] border border-slate-700/80 shadow-2xl space-y-1">
                  <button
                    type="button"
                    onClick={() => { setFiltroSalud(''); setOpenDropdown(null); }}
                    className="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFiltroSalud('En Rango'); setOpenDropdown(null); }}
                    className="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Saludable (En Rango)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFiltroSalud('En Riesgo'); setOpenDropdown(null); }}
                    className="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-amber-400 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>En Riesgo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFiltroSalud('Bloqueado'); setOpenDropdown(null); }}
                    className="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-rose-400 hover:bg-slate-800 hover:text-rose-300 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>Crítico / Bloqueado</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dropdown: ORDENACIÓN */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'orden' ? null : 'orden')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/70 text-slate-300 hover:border-slate-500 hover:text-white shadow-2xs"
              >
                <span>
                  {filtroOrden === 'avance_desc' && 'Mayor Avance'}
                  {filtroOrden === 'avance_asc' && 'Menor Avance'}
                  {filtroOrden === 'fecha_asc' && 'Fecha Fin'}
                  {filtroOrden === 'presupuesto_desc' && 'Presupuesto'}
                  {filtroOrden === 'gasto_desc' && 'Gasto AC'}
                  {filtroOrden === 'nombre_asc' && 'Nombre (A-Z)'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {openDropdown === 'orden' && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-44 p-1.5 rounded-xl bg-[#0B1222] border border-slate-700/80 shadow-2xl space-y-1">
                  {[
                    { key: 'avance_desc', label: 'Mayor Avance' },
                    { key: 'avance_asc', label: 'Menor Avance' },
                    { key: 'fecha_asc', label: 'Fecha Fin' },
                    { key: 'presupuesto_desc', label: 'Presupuesto' },
                    { key: 'gasto_desc', label: 'Gasto AC' },
                    { key: 'nombre_asc', label: 'Nombre (A-Z)' }
                  ].map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => { setFiltroOrden(o.key); setOpenDropdown(null); }}
                      className="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 text-rose-400 hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {/* Selector de Vista (Cuadrícula / Tabla) */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60 shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => setVistaModo('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                vistaModo === 'grid'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>

            <button
              type="button"
              onClick={() => setVistaModo('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                vistaModo === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4A: VISTA CUADRÍCULA DE TARJETAS ENRIQUECIDAS */}
      {vistaModo === 'grid' ? (
        proyectosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <FolderKanban className="w-12 h-12 text-slate-400 mb-3" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">No se encontraron proyectos</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">Ningún proyecto coincide con los filtros actuales.</p>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div id="grid-proyectos-cards" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {proyectosFiltrados.map((p) => {
              const tareas = tareasPorProyecto.get(p.codigo_legado) || tareasPorProyecto.get(p.id) || [];
              const tTotal = tareas.length;
              const tComp = tareas.filter((t: any) => String(t.Estado_Tarea || t.estado_tarea || '').includes('Completad')).length;

              const avReal = p.avance_pct || 0;
              const avPlan = 60; // Proyectado referencial estándar

              const bac = p.presupuesto || 0;
              const ac = p.costo_real || 0;
              const burn = bac > 0 ? Math.round((ac / bac) * 100) : 0;
              const varianza = bac > 0 ? (bac - ac) : 0;

              const h = String(p.health_status || '').toLowerCase();
              const isCrit = h.includes('bloqueado') || h.includes('crítico') || h.includes('critico');
              const isRiesgo = h.includes('riesgo') || h.includes('alerta');

              const colorBarra = isCrit ? 'bg-rose-500' : isRiesgo ? 'bg-amber-500' : 'bg-emerald-500';

              let progGradient = 'from-slate-400 to-indigo-500';
              if (avReal >= 80) progGradient = 'from-emerald-500 to-teal-500';
              else if (avReal >= 50) progGradient = 'from-indigo-500 to-blue-500';
              else if (avReal >= 25) progGradient = 'from-amber-500 to-yellow-500';

              return (
                <div
                  key={p.id}
                  onClick={() => onSeleccionarProyecto(p.codigo_legado || p.id)}
                  className="portfolio-card portal-surface bg-white dark:bg-[#0D1526] rounded-2xl p-4 pl-4.5 border border-slate-200/80 dark:border-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-xl transition-all duration-150 ease-out hover:-translate-y-0.5 flex flex-col justify-between relative group overflow-hidden select-none cursor-pointer"
                >
                  {/* Barra lateral de salud dinámica */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorBarra} transition-all duration-150 group-hover:w-2`} />

                  <div>
                    {/* Fila superior: ID, Tipo y Badge de Salud */}
                    <div className="flex items-center justify-between gap-1.5 mb-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700/60">
                          {p.codigo_legado}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {p.tipo_iniciativa || 'General'}
                        </span>
                        <BadgeNotasVinculadas
                          codigo={p.codigo_legado}
                          tipo="PROYECTO"
                          tituloEntidad={p.nombre}
                        />
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold flex items-center gap-1 shrink-0 ${
                          isCrit
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : isRiesgo
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${colorBarra}`} />
                        <span>{p.health_status || 'En Rango'}</span>
                      </span>
                    </div>

                    {/* Título de Proyecto */}
                    <h3
                      className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base leading-snug mb-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer line-clamp-2"
                      title={p.nombre}
                    >
                      {p.nombre}
                    </h3>

                    {/* North Star OKR */}
                    {p.north_star_okr && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 mb-2.5 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{p.north_star_okr}</span>
                      </p>
                    )}

                    {/* Doble Barra de Progreso (Meta Proyectada vs Real) */}
                    <div className="space-y-1 my-3">
                      <div className="flex justify-between items-center text-xs font-mono tabular-nums">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <span>Avance Real: <b className="text-slate-900 dark:text-white font-bold">{avReal}%</b></span>
                        </span>
                        <span className="text-[11px] text-slate-400">Proyectado: {avPlan}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative shadow-inner">
                        <div
                          className="bg-indigo-200/50 dark:bg-indigo-900/40 h-full rounded-full absolute left-0 top-0"
                          style={{ width: `${avPlan}%` }}
                        />
                        <div
                          className={`bg-gradient-to-r ${progGradient} h-full rounded-full absolute left-0 top-0 transition-all duration-500`}
                          style={{ width: `${avReal}%` }}
                        />
                      </div>
                    </div>

                    {/* Fila de Metadatos de Tareas y Plazo */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 text-[10px] font-mono tabular-nums">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span><b>{tComp}</b>/{tTotal} tareas</span>
                      </span>

                      {p.fecha_fin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{p.fecha_fin}</span>
                        </span>
                      )}

                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold ml-auto bg-slate-100 dark:bg-slate-800 text-slate-400">
                        {p.estado ? p.estado.replace(/^\d+_/, '').replace(/_/g, ' ') : 'Activo'}
                      </span>
                    </div>

                    {/* Bloque Financiero BAC vs AC y Burn Rate */}
                    <div className="bg-slate-50/80 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs font-mono tabular-nums mb-4">
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 mb-1.5">
                        <span>Presupuesto (BAC): <b className="text-slate-800 dark:text-slate-200">PEN {bac.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</b></span>
                        <span className={ac > bac ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-800 dark:text-slate-200 font-bold'}>
                          Real: PEN {ac.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                        <div
                          className={`${burn > 100 ? 'bg-rose-500' : burn > 85 ? 'bg-amber-500' : 'bg-emerald-500'} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(burn, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 flex-wrap gap-1">
                        <span>Consumo: <b className={burn > 100 ? 'text-rose-500 font-bold' : burn > 85 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>{burn}%</b></span>
                        <span>Varianza: <b className={varianza >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {bac > 0 ? (varianza >= 0 ? `+S/ ${varianza.toFixed(1)}` : `-S/ ${Math.abs(varianza).toFixed(1)}`) : 'Sin Tope'}
                        </b></span>
                        <span>Saldo: PEN {Math.max(0, bac - ac).toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botonera Inferior Canónica */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onSeleccionarProyecto(p.id); }}
                      className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Detalle 360°</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalTareaProps({ abierto: true, proyectoCodigo: p.codigo_legado || p.id });
                      }}
                      className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800/60 transition shadow-2xs active:scale-95 shrink-0 cursor-pointer"
                      title="Añadir Tarea"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProyectoAEditarId(p.id);
                        setModalProyectoAbierto(true);
                      }}
                      className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-2xs active:scale-95 shrink-0 cursor-pointer"
                      title="Editar Proyecto"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmarEliminacionCascada(p);
                      }}
                      className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition shadow-2xs shrink-0 cursor-pointer"
                      title="Eliminar Proyecto en Cascada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* SECCIÓN 4B: VISTA TABLA EJECUTIVA (8 COLUMNAS CANÓNICAS) */
        <div id="table-proyectos-wrapper" className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4">Proyecto</th>
                <th className="py-3 px-3">Salud</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 min-w-[140px]">Avance Real</th>
                <th className="py-3 px-3">Tareas</th>
                <th className="py-3 px-3">Plazo Límite</th>
                <th className="py-3 px-3">Presupuesto (AC / BAC)</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {proyectosFiltrados.map((p) => {
                const tareas = tareasPorProyecto.get(p.codigo_legado) || tareasPorProyecto.get(p.id) || [];
                const tTotal = tareas.length;
                const tComp = tareas.filter((t: any) => String(t.Estado_Tarea || t.estado_tarea || '').includes('Completad')).length;

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSeleccionarProyecto(p.codigo_legado || p.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
                          {p.codigo_legado}
                        </span>
                        <div className="min-w-0 max-w-[240px]">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.nombre}</div>
                          <span className="text-[10px] text-slate-400">{p.tipo_iniciativa || 'General'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-300 border border-slate-700">
                        {p.health_status || 'En Rango'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400">
                        {p.estado ? p.estado.replace(/^\d+_/, '').replace(/_/g, ' ') : 'Activo'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span>{p.avance_pct || 0}%</span>
                        </div>
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${p.avance_pct || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {tComp}/{tTotal}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {p.fecha_fin || 'Sin fecha'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div>S/ {(p.costo_real || 0).toLocaleString('es-PE')}</div>
                      <div className="text-[10px] text-slate-500">de S/ {(p.presupuesto || 0).toLocaleString('es-PE')}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSeleccionarProyecto(p.id); }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
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
    </div>
  );
};
