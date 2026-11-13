import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Sparkles,
  X,
  Trash2,
  CheckCircle2,
  Flag,
  Briefcase,
  CheckSquare,
  Receipt,
  LayoutTemplate,
  Network,
  ListTodo,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';
import { SelectIconicoCobalt } from '../UI/SelectIconicoCobalt';
import {
  OPCIONES_ARQUETIPO,
  OPCIONES_MAGNITUD,
  OPCIONES_ESTADO_PROYECTO,
  OPCIONES_ESTADO_PARTIDA
} from '../../constants/uiMappers';
import { db } from '../../db/db';
import type { ProyectoRecord, HitoWbsRecord, TareaRecord, GastoRecord } from '../../types';
import { mostrarToastCobalt } from '../../utils/toastCobalt';

interface ModalNuevoProyectoProps {
  abierto: boolean;
  onCerrar: () => void;
  onProyectoCreado?: (proyectoCodigo: string) => void;
  proyectoAEditarId?: string | null;
}

interface HitoWizItem {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'PAQUETE_TRABAJO' | 'HITO_MARCADOR';
  wbsCode: string;
  fase: string;
  pesoPct: number;
  fechaLimite: string;
  presupuesto: number;
}

interface TareaWizItem {
  id: string;
  codigo: string;
  nombre: string;
  hitoCodigo: string;
  prioridad: string;
  horasEstimadas: number;
}

interface GastoWizItem {
  id: string;
  codigo: string;
  concepto: string;
  monto: number;
  categoria: string;
}

export const ModalNuevoProyecto: React.FC<ModalNuevoProyectoProps> = ({
  abierto,
  onCerrar,
  onProyectoCreado,
  proyectoAEditarId
}) => {
  // Bloqueo incondicional de scroll de fondo según abierto
  useBodyScrollLock(abierto);

  const [tabActiva, setTabActiva] = useState<'datos' | 'hitos' | 'tareas' | 'gastos'>('datos');

  // Datos Generales
  const [codigoProyecto, setCodigoProyecto] = useState('');
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estadoProyecto, setEstadoProyecto] = useState('02_Planificado');
  const [estadoPartida, setEstadoPartida] = useState('Cero Absoluto (Greenfield)');
  const [perfilEjecutor, setPerfilEjecutor] = useState('Ejecutor Directo');
  const [recursosMateriales, setRecursosMateriales] = useState('');
  const [restricciones, setRestricciones] = useState('');
  const [tipoIniciativa, setTipoIniciativa] = useState('Hogar / Construcción');
  const [magnitudComplejidad, setMagnitudComplejidad] = useState('Medium');
  const [arquetipoProyecto, setArquetipoProyecto] = useState('1_Infraestructura');
  const [monedaBase, setMonedaBase] = useState<'PEN' | 'USD' | 'EUR'>('PEN');
  const [presupuestoTope, setPresupuestoTope] = useState<string>('');
  const [fechaInicioPlan, setFechaInicioPlan] = useState('');
  const [fechaFinPlan, setFechaFinPlan] = useState('');
  const [northStarOKR, setNorthStarOKR] = useState('');
  const [entregableTangible, setEntregableTangible] = useState('');
  const [criteriosDoD, setCriteriosDoD] = useState('');
  const [metodologia, setMetodologia] = useState('');

  // Estructuras WBS
  const [hitosWiz, setHitosWiz] = useState<HitoWizItem[]>([]);
  const [tareasWiz, setTareasWiz] = useState<TareaWizItem[]>([]);
  const [gastosWiz, setGastosWiz] = useState<GastoWizItem[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resolutores limpios de información IA basados en uiMappers
  const arquetipoInfo = useMemo(
    () => OPCIONES_ARQUETIPO.find((o) => o.valor === arquetipoProyecto),
    [arquetipoProyecto]
  );

  const magnitudInfo = useMemo(
    () => OPCIONES_MAGNITUD.find((o) => o.valor === magnitudComplejidad),
    [magnitudComplejidad]
  );

  // Inicializar o cargar datos del proyecto reactivamente
  useEffect(() => {
    if (abierto) {
      setErrorMsg(null);
      if (proyectoAEditarId) {
        const cargarProyectoAEditar = async () => {
          let proy = await db.proyectos.get(proyectoAEditarId);
          if (!proy) {
            proy = await db.proyectos.where('codigo_legado').equals(proyectoAEditarId).first();
          }
          if (proy) {
            setCodigoProyecto(proy.codigo_legado || '');
            setNombreProyecto(proy.nombre_proyecto || '');
            setEstadoProyecto(proy.estado_proyecto || '02_Planificado');
            setTipoIniciativa(proy.tipo_iniciativa || 'Hogar / Construcción');
            setMagnitudComplejidad(proy.magnitud_complejidad || 'Medium');
            setArquetipoProyecto(proy.arquetipo_proyecto || '1_Infraestructura');
            setMonedaBase((proy.moneda_base as 'PEN' | 'USD') || 'PEN');
            setPresupuestoTope(proy.presupuesto_tope ? String(proy.presupuesto_tope) : '');
            setFechaInicioPlan(proy.fecha_inicio_plan || '');
            setFechaFinPlan(proy.fecha_fin_plan || '');
            setNorthStarOKR(proy.north_star_okr || '');
            setCriteriosDoD(proy.criterios_aceptacion_dod || '');
            setEntregableTangible(proy.entregable_tangible_objeto || '');

            const hitosExistentes = await db.hitos_wbs
              .where('proyecto_id')
              .equals(proy.codigo_legado)
              .or('proyecto_id')
              .equals(proy.id)
              .toArray();

            if (hitosExistentes.length > 0) {
              setHitosWiz(
                hitosExistentes.map((h) => ({
                  id: h.id,
                  codigo: h.codigo_legado,
                  nombre: h.nombre_elemento,
                  tipo: (h.tipo_elemento_wbs as any) || 'PAQUETE_TRABAJO',
                  wbsCode: h.wbs_code || '',
                  fase: h.fase_asociada || '',
                  pesoPct: (h.peso_pct || 0) <= 1 ? (h.peso_pct || 0) * 100 : (h.peso_pct || 0),
                  fechaLimite: h.fecha_limite || '',
                  presupuesto: h.presupuesto_asignado || 0
                }))
              );
            } else {
              setHitosWiz([]);
            }
          }
        };
        cargarProyectoAEditar();
        setTabActiva('datos');
      } else {
        const initCorrelativo = async () => {
          const count = await db.proyectos.count();
          setCodigoProyecto(`PRO-${String(count + 1).padStart(3, '0')}`);
        };
        initCorrelativo();
        const hoy = new Date().toISOString().split('T')[0];
        setFechaInicioPlan(hoy);
        setFechaFinPlan('');
        setNombreProyecto('');
        setDescripcion('');
        setEstadoProyecto('02_Planificado');
        setPresupuestoTope('');
        setNorthStarOKR('');
        setCriteriosDoD('');
        setEntregableTangible('');
        setHitosWiz([]);
        setTareasWiz([]);
        setGastosWiz([]);
        setTabActiva('datos');
      }
    }
  }, [abierto, proyectoAEditarId]);

  // Generador inteligente de estructura de ejemplo / IA
  const generarPropuestaEstructura = () => {
    const proyCode = codigoProyecto || 'PRO-999';
    const wp1: HitoWizItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `hit-${Date.now()}-1`,
      codigo: `WP-${proyCode}-01`,
      nombre: 'Fase 1: Diagnóstico, Planificación y Diseño',
      tipo: 'PAQUETE_TRABAJO',
      wbsCode: '1.1',
      fase: '01_Iniciacion',
      pesoPct: 30,
      fechaLimite: fechaInicioPlan || new Date().toISOString().split('T')[0],
      presupuesto: presupuestoTope ? Math.round(Number(presupuestoTope) * 0.3) : 500
    };
    const wp2: HitoWizItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `hit-${Date.now()}-2`,
      codigo: `WP-${proyCode}-02`,
      nombre: 'Fase 2: Ejecución e Implementación Central',
      tipo: 'PAQUETE_TRABAJO',
      wbsCode: '1.2',
      fase: '02_Ejecucion',
      pesoPct: 50,
      fechaLimite: fechaFinPlan || '',
      presupuesto: presupuestoTope ? Math.round(Number(presupuestoTope) * 0.5) : 1000
    };
    const hit3: HitoWizItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `hit-${Date.now()}-3`,
      codigo: `HIT-${proyCode}-03`,
      nombre: 'Hito de Cierre y Verificación DoD',
      tipo: 'HITO_MARCADOR',
      wbsCode: '1.3',
      fase: '03_Cierre',
      pesoPct: 20,
      fechaLimite: fechaFinPlan || '',
      presupuesto: 0
    };

    setHitosWiz([wp1, wp2, hit3]);

    const tar1: TareaWizItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `tar-${Date.now()}-1`,
      codigo: `TAR-${proyCode}-01`,
      nombre: 'Definir especificaciones técnicas y cotizar materiales/recursos',
      hitoCodigo: wp1.codigo,
      prioridad: '01_P1_Alta',
      horasEstimadas: 8
    };
    const tar2: TareaWizItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `tar-${Date.now()}-2`,
      codigo: `TAR-${proyCode}-02`,
      nombre: 'Despliegue operativo y construcción del entregable tangible',
      hitoCodigo: wp2.codigo,
      prioridad: '01_P1_Alta',
      horasEstimadas: 24
    };
    const tar3: TareaWizItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `tar-${Date.now()}-3`,
      codigo: `TAR-${proyCode}-03`,
      nombre: 'Revisión final de calidad, pruebas y conciliación de gastos',
      hitoCodigo: hit3.codigo,
      prioridad: '02_P2_Media',
      horasEstimadas: 6
    };

    setTareasWiz([tar1, tar2, tar3]);

    if (!presupuestoTope) {
      setPresupuestoTope('1500');
    }
    if (!northStarOKR) {
      setNorthStarOKR(`Culminar exitosamente ${nombreProyecto || 'el proyecto'} en tiempo y presupuesto.`);
    }
    if (!criteriosDoD) {
      setCriteriosDoD('1. Entregable funcionando al 100%.\n2. Archivos respaldados.\n3. Gastos registrados y balance cuadrado.');
    }
    if (!entregableTangible) {
      setEntregableTangible('Objeto, producto o reporte final completamente finalizado y verificado.');
    }

    setTabActiva('hitos');
  };

  const agregarHito = (tipo: 'PAQUETE_TRABAJO' | 'HITO_MARCADOR') => {
    const num = hitosWiz.length + 1;
    const prefix = tipo === 'PAQUETE_TRABAJO' ? 'WP' : 'HIT';
    const nuevo: HitoWizItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `hit-${Date.now()}-${num}`,
      codigo: `${prefix}-${codigoProyecto}-${String(num).padStart(2, '0')}`,
      nombre: `Nuevo ${tipo === 'PAQUETE_TRABAJO' ? 'Paquete de Trabajo' : 'Hito Marcador'}`,
      tipo,
      wbsCode: `1.${num}`,
      fase: '02_Ejecucion',
      pesoPct: 0,
      fechaLimite: fechaFinPlan || fechaInicioPlan,
      presupuesto: 0
    };
    setHitosWiz([...hitosWiz, nuevo]);
  };

  const eliminarHito = (id: string) => {
    setHitosWiz(hitosWiz.filter((h) => h.id !== id));
  };

  const agregarTarea = () => {
    const num = tareasWiz.length + 1;
    const nuevo: TareaWizItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `tar-${Date.now()}-${num}`,
      codigo: `TAR-${codigoProyecto}-${String(num).padStart(2, '0')}`,
      nombre: 'Nueva Tarea Táctica',
      hitoCodigo: hitosWiz[0]?.codigo || '',
      prioridad: '02_P2_Media',
      horasEstimadas: 4
    };
    setTareasWiz([...tareasWiz, nuevo]);
  };

  const eliminarTarea = (id: string) => {
    setTareasWiz(tareasWiz.filter((t) => t.id !== id));
  };

  const agregarGasto = () => {
    const num = gastosWiz.length + 1;
    const nuevo: GastoWizItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `gas-${Date.now()}-${num}`,
      codigo: `GAS-${codigoProyecto}-${String(num).padStart(2, '0')}`,
      concepto: 'Partida de gasto estimada',
      monto: 0,
      categoria: 'Materiales / Recursos'
    };
    setGastosWiz([...gastosWiz, nuevo]);
  };

  const eliminarGasto = (id: string) => {
    setGastosWiz(gastosWiz.filter((g) => g.id !== id));
  };

  const guardarProyecto = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nombreProyecto.trim()) {
      setErrorMsg('Por favor ingresa el nombre del proyecto.');
      setTabActiva('datos');
      return;
    }

    setGuardando(true);
    setErrorMsg(null);
    try {
      const nowIso = new Date().toISOString();
      const presNum = parseFloat(presupuestoTope) || 0;

      // MODO EDICIÓN
      if (proyectoAEditarId) {
        let targetId = proyectoAEditarId;
        const proyExistente = await db.proyectos.get(proyectoAEditarId);
        if (!proyExistente) {
          const proyPorCod = await db.proyectos.where('codigo_legado').equals(proyectoAEditarId).first();
          if (proyPorCod) targetId = proyPorCod.id;
        }

        await db.proyectos.update(targetId, {
          nombre_proyecto: nombreProyecto.trim(),
          tipo_iniciativa: tipoIniciativa,
          categoria_tshirt: magnitudComplejidad === 'Light' ? 'S-Light' : magnitudComplejidad === 'Heavy' ? 'L-Heavy' : 'M-Medium',
          magnitud_complejidad: magnitudComplejidad,
          arquetipo_proyecto: arquetipoProyecto,
          estado_proyecto: estadoProyecto,
          moneda_base: monedaBase === 'USD' ? 'USD' : 'PEN',
          presupuesto_tope: presNum,
          fecha_inicio_plan: fechaInicioPlan || undefined,
          fecha_fin_plan: fechaFinPlan || undefined,
          north_star_okr: northStarOKR.trim() || undefined,
          criterios_aceptacion_dod: criteriosDoD.trim() || undefined,
          entregable_tangible_objeto: entregableTangible.trim() || undefined,
          updated_at: nowIso
        });

        mostrarToastCobalt('Proyecto actualizado con éxito', 'success', 2500);
        if (onProyectoCreado) {
          onProyectoCreado(codigoProyecto);
        }
        onCerrar();
        return;
      }

      // MODO CREACIÓN NUEVO
      const pId = crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`;

      const nuevoProyecto: ProyectoRecord = {
        id: pId,
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: codigoProyecto,
        nombre_proyecto: nombreProyecto.trim(),
        tipo_iniciativa: tipoIniciativa,
        categoria_tshirt: magnitudComplejidad === 'Light' ? 'S-Light' : magnitudComplejidad === 'Heavy' ? 'L-Heavy' : 'M-Medium',
        magnitud_complejidad: magnitudComplejidad,
        arquetipo_proyecto: arquetipoProyecto,
        estado_proyecto: estadoProyecto,
        avance_real_pct: 0,
        fecha_inicio_plan: fechaInicioPlan || undefined,
        fecha_fin_plan: fechaFinPlan || undefined,
        moneda_base: monedaBase === 'USD' ? 'USD' : 'PEN',
        presupuesto_tope: presNum,
        costo_ejecutado_real_pen: 0,
        costo_ejecutado_real_usd: 0,
        north_star_okr: northStarOKR.trim() || undefined,
        criterios_aceptacion_dod: criteriosDoD.trim() || undefined,
        entregable_tangible_objeto: entregableTangible.trim() || undefined,
        health_status: 'Saludable',
        updated_at: nowIso,
        sync_status: 'synced'
      };

      await db.transaction('rw', [db.proyectos, db.hitos_wbs, db.tareas, db.gastos], async () => {
        await db.proyectos.add(nuevoProyecto);

        // Guardar hitos
        for (const h of hitosWiz) {
          const hitoRecord: HitoWbsRecord = {
            id: h.id,
            user_id: '00000000-0000-0000-0000-000000000001',
            codigo_legado: h.codigo,
            proyecto_id: codigoProyecto,
            tipo_elemento_wbs: h.tipo,
            wbs_code: h.wbsCode,
            fase_asociada: h.fase,
            nombre_elemento: h.nombre,
            estado: '01_Pendiente',
            peso_pct: h.pesoPct > 1 ? h.pesoPct / 100 : h.pesoPct,
            fecha_limite: h.fechaLimite || fechaFinPlan || nowIso.split('T')[0],
            presupuesto_asignado: h.presupuesto,
            updated_at: nowIso,
            version: 1,
            sync_status: 'synced'
          };
          await db.hitos_wbs.add(hitoRecord);
        }

        // Guardar tareas
        for (const t of tareasWiz) {
          const tareaRecord: TareaRecord = {
            id: t.id,
            user_id: '00000000-0000-0000-0000-000000000001',
            codigo_legado: t.codigo,
            proyecto_codigo: codigoProyecto,
            hito_codigo: t.hitoCodigo || undefined,
            nombre_tarea_actividad: t.nombre,
            estado_tarea: '01_Backlog',
            prioridad_eisenhower: t.prioridad,
            horas_estimadas: t.horasEstimadas,
            horas_reales: 0,
            fecha_programada: fechaInicioPlan || nowIso.split('T')[0],
            updated_at: nowIso,
            sync_status: 'synced'
          };
          await db.tareas.add(tareaRecord);
        }

        // Guardar gastos si existen
        for (const g of gastosWiz) {
          const gastoRecord: GastoRecord = {
            id: g.id,
            user_id: '00000000-0000-0000-0000-000000000001',
            codigo_legado: g.codigo,
            tipo_origen: 'PROYECTO',
            id_origen_vinculado: codigoProyecto,
            categoria_gasto: g.categoria,
            fecha_gasto: fechaInicioPlan || nowIso.split('T')[0],
            monto_original: g.monto,
            moneda_original: monedaBase === 'USD' ? 'USD' : 'PEN',
            tipo_cambio: 1,
            monto_pen: monedaBase === 'USD' ? g.monto * 3.75 : g.monto,
            descripcion_gasto: g.concepto,
            estado_pago: 'PROGRAMADO',
            metodo_pago: 'Transferencia',
            updated_at: nowIso,
            sync_status: 'synced'
          };
          await db.gastos.add(gastoRecord);
        }
      });

      if (onProyectoCreado) {
        onProyectoCreado(codigoProyecto);
      }
      onCerrar();
    } catch (err) {
      console.error('Error al guardar proyecto:', err);
      setErrorMsg('Error al guardar proyecto en base de datos local.');
    } finally {
      setGuardando(false);
    }
  };

  // Atajos de teclado: Escape para cerrar, Ctrl+Enter / Cmd+Enter para guardar
  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCerrar();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        guardarProyecto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, onCerrar, guardarProyecto]);

  if (!abierto) return null;

  const modalContent = (
    <div
      id="modal-proyecto-wizard"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200"
    >
      <div
        id="modal-proyecto-wizard-card"
        className="w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-800/60 shadow-cobalt-2 relative transform-gpu transition-[transform,opacity] duration-200 bg-[#0D1526] text-slate-100"
      >
        {/* Drag handle móvil */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* CABECERA PRINCIPAL (STICKY) CON BOTÓN ÚNICO DE IA */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-800 flex flex-wrap justify-between items-center bg-[#0A101D] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-950/40 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-100 text-sm md:text-base">
                  {proyectoAEditarId ? `Editar Proyecto: ${codigoProyecto || ''}` : 'Nuevo Proyecto & Estructura WBS'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  {codigoProyecto || 'PRO-XXX'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800/60 text-slate-300 border border-slate-700/60">
                  {proyectoAEditarId ? 'Modo Edición' : 'Asistido por IA'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Define los datos clave o genera la estructura completa (Hitos, Tareas y Gastos) con asistencia inteligente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-ia-generar-propuesta"
              onClick={generarPropuestaEstructura}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-400 hover:from-sky-400 hover:to-indigo-400 text-white font-bold text-xs shadow-md shadow-sky-950/60 flex items-center gap-2 border border-sky-300/40 transition-all duration-200 active:scale-95 hover:shadow-[0_0_20px_rgba(56,189,248,0.35)] cursor-pointer group"
              title="Generar propuesta WBS automática con IA"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 group-hover:rotate-12 transition-transform duration-200" strokeWidth={1.75} />
              <span>Generar Estructura con IA</span>
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS STICKY CON MICRO-INTERACCIONES */}
        <div className="sticky top-0 z-20 px-6 py-2 bg-[#090E1A] border-b border-slate-800 flex items-center gap-2 shrink-0 overflow-x-auto text-xs font-bold custom-scrollbar">
          {[
            { id: 'datos', label: 'General', icono: LayoutTemplate },
            { id: 'hitos', label: 'Estructura WBS', icono: Network, count: hitosWiz.length },
            { id: 'tareas', label: 'Tareas', icono: ListTodo, count: tareasWiz.length },
            { id: 'gastos', label: 'Presupuesto', icono: Wallet, count: gastosWiz.length }
          ].map((tab) => {
            const IconoTab = tab.icono;
            const esActivo = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabActiva(tab.id as any)}
                className={`relative px-3.5 py-2 rounded-xl transition-all duration-150 flex items-center gap-2 font-bold shrink-0 cursor-pointer active:scale-95 ${
                  esActivo
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {esActivo && (
                  <motion.div
                    layoutId="tab-indicator-proyecto"
                    className="absolute inset-0 bg-sky-500 rounded-xl shadow-sm shadow-sky-950/50"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <IconoTab className={`w-3.5 h-3.5 ${esActivo ? 'text-white' : 'text-slate-400'}`} strokeWidth={1.75} />
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                        esActivo ? 'bg-sky-950/60 text-white border border-sky-300/30' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* CUERPO PRINCIPAL CON SCROLL INDEPENDIENTE */}
        <form
          id="form-wizard-proyecto"
          className="flex-1 overflow-y-auto max-h-[68vh] p-4 md:p-6 custom-scrollbar bg-[#040711] space-y-4 text-xs"
          onSubmit={guardarProyecto}
        >
          {/* TAB 1: DATOS GENERALES */}
          {tabActiva === 'datos' && (
            <div className="space-y-4">
              {/* BANNER GUÍA DE CREACIÓN Y ESTRUCTURACIÓN */}
              <div className="p-3.5 bg-[#0D1526] border border-slate-800/80 rounded-2xl flex items-center gap-3 shadow-2xs">
                <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="text-[11px] leading-relaxed text-slate-300 flex-1">
                  <span className="font-bold text-slate-100">Creación Asistida:</span>{' '}
                  Ingresa el <strong className="text-sky-400 font-semibold">Nombre</strong> y un resumen en{' '}
                  <strong className="text-sky-400 font-semibold">Descripción / Alcance</strong>. Haz clic arriba en{' '}
                  <strong className="text-sky-400 font-semibold">"Generar Estructura con IA"</strong> para desglosar hitos, tareas y presupuesto adaptados a tu sector.
                </div>
              </div>

              {/* BANNER GLASSMORPHISM DE CLASIFICACIÓN ADAPTATIVA IA */}
              <div
                id="wiz-ia-clasificacion-banner"
                className="relative overflow-hidden p-4 bg-gradient-to-br from-[#0D1526]/95 via-[#0c1427]/90 to-[#101c36]/95 border border-sky-500/30 rounded-2xl shadow-[0_8px_32px_rgba(2,6,23,0.8),0_0_20px_rgba(56,189,248,0.1)] backdrop-blur-xl space-y-2.5"
              >
                {/* Destello ambiental en esquina */}
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-wrap items-center justify-between gap-2.5 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" strokeWidth={1.75} />
                    </div>
                    <span className="font-extrabold text-xs text-slate-100 tracking-tight">
                      Clasificación Adaptativa IA
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Píldora Arquetipo con Ícono Mapeado */}
                    <span
                      id="wiz-badge-arquetipo-sugerido"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-xs"
                    >
                      {arquetipoInfo?.icono && (
                        <arquetipoInfo.icono className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                      )}
                      <span>{arquetipoInfo?.etiqueta || arquetipoProyecto}</span>
                    </span>

                    {/* Píldora Magnitud con Badge T-Shirt Mapeado */}
                    <span
                      id="wiz-badge-magnitud-sugerida"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-xs"
                    >
                      <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-teal-950/70 border border-teal-400/40 text-teal-300">
                        {magnitudInfo?.badge || 'M'}
                      </span>
                      <span>{magnitudInfo?.etiqueta || magnitudComplejidad}</span>
                    </span>
                  </div>
                </div>

                <p id="wiz-texto-justificacion-clasificacion" className="text-[11px] leading-relaxed text-slate-400 relative z-10">
                  Estructura inferida automáticamente según el alcance, complejidad estimada y recursos definidos.
                </p>
              </div>

              <div className="bg-[#0D1526] rounded-2xl border border-slate-800/80 p-5 shadow-2xs space-y-4">
                {/* Código PRO-XXX y Nombre del Proyecto */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span>Código</span>
                      </label>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                        PRO-XXX
                      </span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={codigoProyecto || 'PRO-XXX'}
                      className="w-full border border-slate-800 bg-[#040711] rounded-xl p-2.5 font-mono font-bold text-xs text-sky-400 outline-none select-all"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span>Nombre del Proyecto</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        Requerido
                      </span>
                    </div>
                    <input
                      type="text"
                      id="wiz-nombreProyecto"
                      required
                      value={nombreProyecto}
                      onChange={(e) => {
                        setNombreProyecto(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="Ej: Construcción de segundo piso / Lanzamiento de Tienda Online / Certificación PMP"
                      className="w-full border border-slate-800 bg-slate-900/60 rounded-xl p-2.5 font-bold outline-none text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50"
                    />
                    {/* Contenedor Anti-CLS con altura fija reservada */}
                    <div className="min-h-[22px] flex items-center mt-1">
                      <p
                        className={`text-rose-400 text-xs font-semibold transition-opacity duration-200 ${
                          errorMsg && tabActiva === 'datos' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        {errorMsg || ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Descripción / Alcance */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-200">
                      Descripción / Alcance / Problema a Resolver
                    </label>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/60 text-slate-300 border border-slate-700/60">
                      Recomendado
                    </span>
                  </div>

                  {/* Micro-guía de contexto ideal */}
                  <div className="mb-2 p-2.5 bg-[#040711] border border-dashed border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <span className="text-sky-400 font-bold">1.</span>
                      <div><strong className="text-slate-100">Resultado:</strong> Entregable final tangible, obra, producto o servicio concluido.</div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">2.</span>
                      <div><strong className="text-slate-100">Restricciones:</strong> Plazos límite, presupuesto disponible o trámites externos.</div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">3.</span>
                      <div><strong className="text-slate-100">Enfoque:</strong> Ejecución propia, con contratistas o colaborativa.</div>
                    </div>
                  </div>

                  <textarea
                    id="wiz-descripcion"
                    rows={3}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe el objetivo, entregables esperados, contexto operativo y condiciones clave..."
                    className="w-full border border-slate-800 bg-slate-900/60 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 text-xs"
                  />
                </div>

                {/* Contexto Operativo de Ejecución */}
                <div className="p-4 bg-[#0A101D] rounded-2xl border border-slate-800/80 space-y-3">
                  <h5 className="font-extrabold text-slate-100 text-xs">
                    Contexto Operativo de Ejecución
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Estado de partida */}
                    <div>
                      <label className="font-semibold text-slate-300 text-[11px] block mb-1">
                        1. Estado Actual de Partida
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {OPCIONES_ESTADO_PARTIDA.map((opt) => {
                          const IconoOpt = opt.icono;
                          const esActivo = estadoPartida === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setEstadoPartida(opt.id)}
                              className={`p-2 rounded-xl border text-left transition-all duration-150 font-semibold cursor-pointer flex items-center gap-2 active:scale-95 ${
                                esActivo
                                  ? 'border-sky-500 bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                                  : 'border-slate-800 bg-[#040711] text-slate-300 hover:border-slate-700 hover:bg-[#070c18]'
                              }`}
                            >
                              <IconoOpt className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate leading-tight text-xs">{opt.titulo}</span>
                                <span className="text-[10px] text-slate-400 truncate font-normal">{opt.subtitulo}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Modalidad Ejecutor */}
                    <div>
                      <label className="font-semibold text-slate-300 text-[11px] block mb-1">
                        2. Modalidad o Rol del Ejecutor
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {[
                          'Ejecutor Directo',
                          'Con Contratistas',
                          'Equipo Colaborativo',
                          'Consultor / Asesor'
                        ].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setPerfilEjecutor(opt)}
                            className={`p-2 rounded-xl border text-left transition font-semibold cursor-pointer truncate ${
                              perfilEjecutor === opt
                                ? 'border-sky-500 bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30'
                                : 'border-slate-800 bg-[#040711] text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-semibold text-slate-300 text-[11px] block mb-1">
                        3. Recursos o Materiales Clave
                      </label>
                      <input
                        type="text"
                        value={recursosMateriales}
                        onChange={(e) => setRecursosMateriales(e.target.value)}
                        placeholder="Ej. Contratista y ferretería / Notaría / React & Supabase..."
                        className="w-full border border-slate-800 bg-[#040711] rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 text-[11px] block mb-1">
                        4. Restricciones Críticas & Trámites
                      </label>
                      <input
                        type="text"
                        value={restricciones}
                        onChange={(e) => setRestricciones(e.target.value)}
                        placeholder="Ej: Licencia municipal / Presupuesto tope estricto..."
                        className="w-full border border-slate-800 bg-[#040711] rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Metodología / Enfoque de Ejecución */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <span>Metodología / Enfoque de Ejecución</span>
                    </label>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      Inferencia Automática
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {[
                      { id: '', label: 'Automático' },
                      { id: 'Scrum / Ágil', label: 'Scrum / Ágil' },
                      { id: 'Cascada / Tradicional', label: 'Faseado / Cascada' },
                      { id: 'Iterativo / Kanban', label: 'Iterativo / Kanban' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMetodologia(m.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-98 ${
                          metodologia === m.id
                            ? 'border-sky-500 bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30 font-bold'
                            : 'border-slate-800 bg-[#040711] text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de Iniciativa */}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5">
                    Tipo de Iniciativa
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      'Hogar / Construcción',
                      'Negocio',
                      'Salud / Bienestar',
                      'Inversiones',
                      'Desarrollo Web',
                      'Profesional',
                      'Marketing',
                      'Infraestructura'
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setTipoIniciativa(opt)}
                        className={`p-2 rounded-xl border text-left transition font-semibold cursor-pointer truncate ${
                          tipoIniciativa === opt
                            ? 'border-sky-500 bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30'
                            : 'border-slate-800 bg-[#040711] text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Magnitud / T-Shirt & Arquetipo & Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <SelectIconicoCobalt
                    label="Magnitud (T-Shirt)"
                    valor={magnitudComplejidad}
                    onChange={(val) => setMagnitudComplejidad(val)}
                    opciones={OPCIONES_MAGNITUD}
                  />

                  <SelectIconicoCobalt
                    label="Arquetipo de Proyecto"
                    valor={arquetipoProyecto}
                    onChange={(val) => setArquetipoProyecto(val)}
                    opciones={OPCIONES_ARQUETIPO}
                  />

                  <SelectIconicoCobalt
                    label="Estado del Proyecto"
                    valor={estadoProyecto}
                    onChange={(val) => setEstadoProyecto(val)}
                    opciones={OPCIONES_ESTADO_PROYECTO}
                  />
                </div>

                {/* Moneda y Presupuesto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1.5">
                      Moneda Base
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {(['PEN', 'USD', 'EUR'] as const).map((mon) => (
                        <button
                          key={mon}
                          type="button"
                          onClick={() => setMonedaBase(mon)}
                          className={`py-2 px-2 rounded-xl border text-center font-bold cursor-pointer transition ${
                            monedaBase === mon
                              ? 'border-sky-500 bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30'
                              : 'border-slate-800 bg-[#040711] text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {mon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1.5">
                      Presupuesto Estimado / Tope (BAC)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                        {monedaBase === 'USD' ? '$' : monedaBase === 'EUR' ? '€' : 'S/.'}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={presupuestoTope}
                        onChange={(e) => setPresupuestoTope(e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-slate-800 bg-slate-900/60 rounded-xl py-2 pl-9 pr-3 font-mono tabular-nums text-slate-100 font-bold text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Fechas Planificadas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1.5">
                      Fecha Inicio Plan
                    </label>
                    <input
                      type="date"
                      value={fechaInicioPlan}
                      onChange={(e) => setFechaInicioPlan(e.target.value)}
                      className="w-full border border-slate-800 bg-slate-900/60 rounded-xl p-2.5 text-slate-100 font-mono font-medium text-xs outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1.5">
                      Fecha Fin Estimada
                    </label>
                    <input
                      type="date"
                      value={fechaFinPlan}
                      onChange={(e) => setFechaFinPlan(e.target.value)}
                      className="w-full border border-slate-800 bg-slate-900/60 rounded-xl p-2.5 text-slate-100 font-mono font-medium text-xs outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Gobernanza & Metas */}
              <div className="bg-[#0D1526] rounded-2xl border border-slate-800/80 p-5 shadow-2xs space-y-3.5">
                <h4 className="font-bold text-slate-200 text-xs">
                  Gobernanza & Criterios de Aceptación
                </h4>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    North Star OKR (Objetivo Estratégico)
                  </label>
                  <input
                    type="text"
                    value={northStarOKR}
                    onChange={(e) => setNorthStarOKR(e.target.value)}
                    placeholder="Lograr la implementación exitosa en tiempo y forma..."
                    className="w-full border border-slate-800 bg-slate-900/60 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Entregable Tangible / Objeto Final
                  </label>
                  <input
                    type="text"
                    value={entregableTangible}
                    onChange={(e) => setEntregableTangible(e.target.value)}
                    placeholder="Documento, obra física o producto funcional verificable..."
                    className="w-full border border-slate-800 bg-slate-900/60 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Criterios de Aceptación (Definition of Done - DoD)
                  </label>
                  <textarea
                    rows={2}
                    value={criteriosDoD}
                    onChange={(e) => setCriteriosDoD(e.target.value)}
                    placeholder="1. Pruebas superadas. 2. Repositorio en Drive. 3. Balance financiero cuadrado."
                    className="w-full border border-slate-800 bg-slate-900/60 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HITOS */}
          {tabActiva === 'hitos' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#0D1526] rounded-xl border border-slate-800 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400">Total Hitos:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono tabular-nums font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {hitosWiz.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => agregarHito('PAQUETE_TRABAJO')}
                    className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 hover:border-sky-400 rounded-xl font-bold text-xs shadow-sm shadow-sky-950/40 transition-all duration-200 active:scale-95 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                    <span>Nuevo Paquete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => agregarHito('HITO_MARCADOR')}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 rounded-xl font-bold text-xs shadow-sm shadow-amber-950/40 transition-all duration-200 active:scale-95 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.75} />
                    <span>Nuevo Hito</span>
                  </button>
                </div>
              </div>

              {hitosWiz.length === 0 ? (
                <div className="text-center py-10 bg-[#0D1526]/40 rounded-xl border border-slate-800 text-slate-400">
                  <p className="font-bold">No hay hitos agregados aún.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Agrega un paquete de trabajo o genera la estructura completa con IA.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {hitosWiz.map((h, idx) => (
                    <div
                      key={h.id}
                      className="p-3 bg-[#0D1526] rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono tabular-nums font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {h.codigo}
                        </span>
                        <input
                          type="text"
                          value={h.nombre}
                          onChange={(e) => {
                            const copy = [...hitosWiz];
                            copy[idx].nombre = e.target.value;
                            setHitosWiz(copy);
                          }}
                          className="font-bold text-slate-200 bg-transparent border-b border-transparent hover:border-slate-600 focus:border-sky-500 outline-none flex-1 min-w-[140px] text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Peso %:</span>
                        <input
                          type="number"
                          value={h.pesoPct}
                          onChange={(e) => {
                            const copy = [...hitosWiz];
                            copy[idx].pesoPct = Number(e.target.value);
                            setHitosWiz(copy);
                          }}
                          className="w-16 p-1 rounded bg-[#040711] border border-slate-800 text-center font-mono tabular-nums font-bold text-xs text-slate-100 outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => eliminarHito(h.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TAREAS */}
          {tabActiva === 'tareas' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#0D1526] rounded-xl border border-slate-800 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400">Total Tareas:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono tabular-nums font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {tareasWiz.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={agregarTarea}
                  className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 hover:border-sky-400 rounded-xl font-bold text-xs shadow-sm shadow-sky-950/40 transition-all duration-200 active:scale-95 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                  <span>Añadir Tarea</span>
                </button>
              </div>

              {tareasWiz.length === 0 ? (
                <div className="text-center py-10 bg-[#0D1526]/40 rounded-xl border border-slate-800 text-slate-400">
                  <p className="font-bold">No hay tareas agregadas aún.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Crea tareas accionables vinculadas a tus hitos o deja que la IA las genere.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tareasWiz.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-3 bg-[#0D1526] rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono tabular-nums font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {t.codigo}
                        </span>
                        <input
                          type="text"
                          value={t.nombre}
                          onChange={(e) => {
                            const copy = [...tareasWiz];
                            copy[idx].nombre = e.target.value;
                            setTareasWiz(copy);
                          }}
                          className="font-semibold text-slate-200 bg-transparent border-b border-transparent hover:border-slate-600 focus:border-sky-500 outline-none flex-1 min-w-[140px] text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Horas:</span>
                        <input
                          type="number"
                          value={t.horasEstimadas}
                          onChange={(e) => {
                            const copy = [...tareasWiz];
                            copy[idx].horasEstimadas = Number(e.target.value);
                            setTareasWiz(copy);
                          }}
                          className="w-14 p-1 rounded bg-[#040711] border border-slate-800 text-center font-mono tabular-nums font-bold text-xs text-slate-100 outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => eliminarTarea(t.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GASTOS */}
          {tabActiva === 'gastos' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#0D1526] rounded-xl border border-slate-800 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400">Partidas Planificadas:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono tabular-nums font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {gastosWiz.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={agregarGasto}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 rounded-xl font-bold text-xs shadow-sm shadow-emerald-950/40 transition-all duration-200 active:scale-95 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-1.5 cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.75} />
                  <span>Añadir Gasto</span>
                </button>
              </div>

              {gastosWiz.length === 0 ? (
                <div className="text-center py-10 bg-[#0D1526]/40 rounded-xl border border-slate-800 text-slate-400">
                  <p className="font-bold">No hay gastos planificados aún.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Puedes presupuestar materiales, honorarios o trámites.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {gastosWiz.map((g, idx) => (
                    <div
                      key={g.id}
                      className="p-3 bg-[#0D1526] rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono tabular-nums font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {g.codigo}
                        </span>
                        <input
                          type="text"
                          value={g.concepto}
                          onChange={(e) => {
                            const copy = [...gastosWiz];
                            copy[idx].concepto = e.target.value;
                            setGastosWiz(copy);
                          }}
                          className="font-semibold text-slate-200 bg-transparent border-b border-transparent hover:border-slate-600 focus:border-sky-500 outline-none flex-1 min-w-[140px] text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Monto:</span>
                        <input
                          type="number"
                          value={g.monto}
                          onChange={(e) => {
                            const copy = [...gastosWiz];
                            copy[idx].monto = Number(e.target.value);
                            setGastosWiz(copy);
                          }}
                          className="w-20 p-1 rounded bg-[#040711] border border-slate-800 text-center font-mono tabular-nums font-bold text-xs text-slate-100 outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => eliminarGasto(g.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* PIE DEL MODAL (STICKY) */}
        <div className="sticky bottom-0 z-20 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-[#0A101D] shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
            >
              Cancelar
            </button>
            {/* Contenedor Anti-CLS con altura fija reservada */}
            <div className="min-h-[22px] flex items-center">
              <p
                className={`text-rose-400 text-xs font-semibold transition-opacity duration-200 ${
                  errorMsg ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {errorMsg || ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => guardarProyecto()}
            disabled={guardando}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-md shadow-sky-950/50 flex items-center gap-2 transition-all duration-200 active:scale-95 hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" strokeWidth={2} />
            <span>{guardando ? 'Guardando...' : proyectoAEditarId ? 'Guardar Cambios' : 'Guardar Proyecto'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
