/**
 * ============================================================================
 * ARCHIVO: src/hooks/useTareaForm.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-REFACTOR-P1-03
 * DESCRIPCIÓN: Custom hook que centraliza la lógica de formulario, hidratación,
 *              persistencia (Dexie + Google Calendar + Gastos), subtareas,
 *              atajos y WBS de ModalTareaFlow.
 * ============================================================================
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { TareaRecord, SubtareaPaso } from '../types';
import { getProp } from '../utils/entityNormalizer';
import { generateSafeUUID } from '../utils/uuidGenerator';
import { useUndoDelete } from './useUndoDelete';
import { crearTarea, actualizarTarea, eliminarTarea } from '../services/tareasService';
import { crearGasto, actualizarGasto } from '../services/gastosService';
import {
  obtenerEstadoConexionGoogleCalendar,
  suscribirEstadoGoogleCalendar
} from '../services/calendarSyncService';
import { mostrarToastCobalt } from '../utils/toastCobalt';
import {
  convertirStringToHorasDecimal,
  convertirHorasDecimalAString,
  formatFechaIsoLocal
} from '../utils/timeFormatters';
import {
  FolderKanban,
  Milestone,
  Lock,
  CircleDot,
  Zap,
  CheckCircle2,
  Archive,
  Layers
} from 'lucide-react';

export interface UseTareaFormProps {
  isOpen: boolean;
  onClose: () => void;
  tareaId: string | null;
  initialColumna?: string;
  estadoInicial?: string;
  initialProyectoCodigo?: string | null;
  initialTitulo?: string;
  initialNotas?: string;
  onGuardado?: () => void;
}

export type ModalTareaFlowProps = UseTareaFormProps;

export const OPCIONES_ESTADO = [
  { id: '01_Backlog', label: 'Backlog', icon: Layers, color: 'text-slate-300 bg-slate-900/80 border-slate-700/80 hover:border-slate-500' },
  { id: '02_Por_Hacer', label: 'Por Hacer', icon: CircleDot, color: 'text-sky-300 bg-sky-950/60 border-sky-700/70 hover:border-sky-400' },
  { id: '03_En_Proceso', label: 'En Proceso', icon: Zap, color: 'text-amber-300 bg-amber-950/60 border-amber-700/70 hover:border-amber-400' },
  { id: '04_Completado', label: 'Completado', icon: CheckCircle2, color: 'text-emerald-300 bg-emerald-950/60 border-emerald-700/70 hover:border-emerald-400' },
  { id: '05_Archivado', label: 'Archivado', icon: Archive, color: 'text-purple-300 bg-purple-950/60 border-purple-700/70 hover:border-purple-400' }
];

export function useTareaForm({
  isOpen,
  onClose,
  tareaId,
  initialColumna = '01_Backlog',
  estadoInicial,
  initialProyectoCodigo = null,
  initialTitulo = '',
  initialNotas = '',
  onGuardado
}: UseTareaFormProps) {
  const estadoBase = estadoInicial || initialColumna || '01_Backlog';
  const { programarEliminacion } = useUndoDelete();
  const [isSaving, setIsSaving] = useState(false);
  const guardandoRef = useRef(false);

  // Estado reactivo de conexión Google Calendar
  const [gcalEstado, setGcalEstado] = useState(obtenerEstadoConexionGoogleCalendar);

  useEffect(() => {
    return suscribirEstadoGoogleCalendar(setGcalEstado);
  }, []);

  // Proyectos e Hitos disponibles en Dexie
  const proyectos = useLiveQuery(() => db.proyectos.toArray(), []) ?? [];
  const hitos = useLiveQuery(() => db.hitos_wbs.toArray(), []) ?? [];
  const todasLasTareas = useLiveQuery(() => db.tareas.toArray(), []) ?? [];

  // Tarea existente a editar (si aplica) con búsqueda dual resiliente UUID o código legado
  const tareaExistente = useLiveQuery<TareaRecord | null>(async () => {
    if (!tareaId) return null;
    const porId = await db.tareas.get(tareaId);
    if (porId) return porId;
    return (await db.tareas.where('codigo_legado').equals(tareaId).first()) || null;
  }, [tareaId]);

  // Subtareas existentes asociadas a la tarea en edición
  const subtareasExistentes = useLiveQuery<SubtareaPaso[]>(
    async () => {
      const codPadre = tareaExistente?.codigo_legado || (tareaId?.startsWith('TAR-') ? tareaId : undefined);
      if (!codPadre) return [];
      return await db.subtareas_pasos
        .where('id_padre_vinculado')
        .equals(codPadre)
        .sortBy('numero_paso');
    },
    [tareaExistente?.codigo_legado, tareaId]
  ) ?? [];

  // Lista de gastos de Finanzas para vinculación reactiva
  const listaGastos = useLiveQuery(
    () => db.gastos.orderBy('fecha_gasto').reverse().limit(50).toArray(),
    []
  ) ?? [];

  // Form states
  const [codigoLegado, setCodigoLegado] = useState('');
  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState(estadoBase);
  const [proyectoCodigo, setProyectoCodigo] = useState('');
  const [hitoCodigo, setHitoCodigo] = useState('');
  const [idDependencia, setIdDependencia] = useState('');
  const [prioridad, setPrioridad] = useState('02_P2_Media');
  const [nivelEnergia, setNivelEnergia] = useState('Media_Operativa');
  const [horasEstimadas, setHorasEstimadas] = useState(1);
  const [horasReales, setHorasReales] = useState(0);
  const [horasEstimadasStr, setHorasEstimadasStr] = useState('1:00');
  const [horasRealesStr, setHorasRealesStr] = useState('0:00');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [agendadoCalendar, setAgendadoCalendar] = useState<'Sí' | 'No'>('Sí');
  const [esMav, setEsMav] = useState(false);
  const [costoRealPen, setCostoRealPen] = useState(0);
  const [responsable, setResponsable] = useState('');
  const [notas, setNotas] = useState('');

  // Sección Gasto Asociado Embebido (Dual: Nuevo / Vincular)
  const [mostrarGasto, setMostrarGasto] = useState(false);
  const [modoGasto, setModoGasto] = useState<'NUEVO' | 'VINCULAR'>('NUEVO');
  const [gastoMoneda, setGastoMoneda] = useState<'PEN' | 'USD' | 'EUR'>('PEN');
  const [gastoMonto, setGastoMonto] = useState<string>('');
  const [gastoCategoria, setGastoCategoria] = useState('Operativo_Proyecto');
  const [gastoConcepto, setGastoConcepto] = useState('');
  const [gastoVinculadoCodigo, setGastoVinculadoCodigo] = useState('');
  const [gastoSearch, setGastoSearch] = useState('');

  // Subtareas en memoria (para modo creación o staging)
  const [subtareasLocal, setSubtareasLocal] = useState<Array<{ id: string; descripcion_paso: string; completado: boolean }>>([]);
  const [nuevoPasoTexto, setNuevoPasoTexto] = useState('');
  const errorMsgSubtareaState = useState<string | null>(null);
  const [errorMsgSubtarea, setErrorMsgSubtarea] = errorMsgSubtareaState;

  // Filtrado reactivo de hitos según el proyecto seleccionado en el formulario
  const hitosDelProyecto = useMemo(() => {
    if (!hitos || !proyectoCodigo) return [];
    const proyMatch = proyectos.find((p) => p.codigo_legado === proyectoCodigo || p.id === proyectoCodigo);
    const pId = proyMatch?.id || proyectoCodigo;
    const pCod = proyMatch?.codigo_legado || proyectoCodigo;
    return hitos.filter((h) => h.proyecto_id === pId || h.proyecto_id === pCod || (h as any).proyecto_codigo === pCod);
  }, [hitos, proyectos, proyectoCodigo]);

  const opcionesProyectosCobalt = useMemo(() => [
    ...proyectos.map((p) => ({
      valor: p.codigo_legado || p.id,
      etiqueta: p.nombre_proyecto,
      badge: p.codigo_legado,
      colorBadge: 'bg-sky-950/60 text-sky-300 border-sky-500/40 font-mono font-bold',
      icono: FolderKanban
    }))
  ], [proyectos]);

  const opcionesHitosCobalt = useMemo(() => [
    { valor: '', etiqueta: 'Sin Paquete WBS', subtitulo: 'Tarea suelta', icono: Milestone },
    ...hitosDelProyecto.map((h) => ({
      valor: h.codigo_legado || h.id,
      etiqueta: h.nombre_elemento || h.nombre_hito || h.codigo_legado,
      badge: h.codigo_legado,
      colorBadge: 'bg-purple-950/60 text-purple-300 border-purple-500/40 font-mono font-bold',
      icono: Milestone
    }))
  ], [hitosDelProyecto]);

  const opcionesDependencias = useMemo(() => [
    { valor: '', etiqueta: 'Sin dependencias', subtitulo: 'Tarea independiente', icono: Lock },
    ...todasLasTareas
      .filter((t) => t.id !== tareaId && t.codigo_legado !== codigoLegado)
      .map((t) => ({
        valor: t.codigo_legado || t.id,
        etiqueta: `${t.codigo_legado} · ${t.nombre_tarea_actividad || (t as any).nombre || 'Tarea'}`,
        subtitulo: t.estado_tarea || '',
        badge: t.codigo_legado,
        colorBadge: 'bg-amber-950/60 text-amber-300 border-amber-500/40 font-mono font-bold',
        icono: Lock
      }))
  ], [todasLasTareas, tareaId, codigoLegado]);

  // Copia rápida del código de tarea
  const [copiado, setCopiado] = useState(false);
  const handleCopiarCodigo = () => {
    const textoACopiar = codigoLegado || (tareaId ? (tareaId.startsWith('TAR-') ? tareaId : '') : '');
    if (textoACopiar) {
      navigator.clipboard.writeText(textoACopiar);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1200);
      mostrarToastCobalt(`Código ${textoACopiar} copiado al portapapeles`, 'info');
    }
  };

  // Selector interactivo de estado de tarea
  const [menuEstadoAbierto, setMenuEstadoAbierto] = useState(false);
  const estadoMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickFueraEstado = (e: MouseEvent) => {
      if (estadoMenuRef.current && !estadoMenuRef.current.contains(e.target as Node)) {
        setMenuEstadoAbierto(false);
      }
    };
    if (menuEstadoAbierto) {
      document.addEventListener('mousedown', handleClickFueraEstado);
    }
    return () => document.removeEventListener('mousedown', handleClickFueraEstado);
  }, [menuEstadoAbierto]);

  const estadoActualConfig = OPCIONES_ESTADO.find((o) => o.id === estado) || OPCIONES_ESTADO[0];

  // Sincronizar datos al abrir o cambiar tareaId
  useEffect(() => {
    if (!isOpen) return;

    if (tareaId !== null && tareaExistente === undefined) {
      return;
    }

    if (tareaExistente) {
      setCodigoLegado(tareaExistente.codigo_legado || '');
      setNombre(tareaExistente.nombre_tarea_actividad || '');
      setEstado(tareaExistente.estado_tarea || initialColumna);
      setProyectoCodigo(tareaExistente.proyecto_codigo || '');
      setHitoCodigo(tareaExistente.hito_codigo || '');
      setIdDependencia(tareaExistente.id_dependencia || '');
      setPrioridad(tareaExistente.prioridad_eisenhower || '02_P2_Media');
      setNivelEnergia(tareaExistente.nivel_energia_requerido || 'Media_Operativa');
      const hEst = tareaExistente.horas_estimadas ?? 1;
      const hReal = tareaExistente.horas_reales ?? 0;
      setHorasEstimadas(hEst);
      setHorasReales(hReal);
      setHorasEstimadasStr(convertirHorasDecimalAString(hEst));
      setHorasRealesStr(convertirHorasDecimalAString(hReal));
      setFechaProgramada(tareaExistente.fecha_programada ? tareaExistente.fecha_programada.split('T')[0] : '');
      setHoraInicio(getProp(tareaExistente, 'hora_inicio', 'Hora_Inicio') || '09:00');
      setAgendadoCalendar(tareaExistente.agendado_calendar === 'No' ? 'No' : 'Sí');
      setEsMav(Boolean(tareaExistente.es_mav));
      const cPen = tareaExistente.costo_real_pen ?? 0;
      setCostoRealPen(cPen);
      setResponsable(tareaExistente.responsable_ejecutor || '');
      setNotas(tareaExistente.notas_impedimentos || '');
      setSubtareasLocal([]);

      // Cargar gasto asociado vinculado si existe
      if (tareaExistente.codigo_legado) {
        db.gastos
          .where('id_origen_vinculado')
          .equals(tareaExistente.codigo_legado)
          .first()
          .then((gastoExistente) => {
            if (gastoExistente) {
              setGastoMoneda((gastoExistente.moneda_original as 'PEN' | 'USD' | 'EUR') || 'PEN');
              setGastoMonto(String(gastoExistente.monto_original || gastoExistente.monto_pen || ''));
              setGastoCategoria(gastoExistente.categoria_gasto || 'Operativo_Proyecto');
              setGastoConcepto(gastoExistente.descripcion_gasto || '');
              setGastoVinculadoCodigo(gastoExistente.codigo_legado || '');
              setGastoSearch('');
              setModoGasto('NUEVO');
              setMostrarGasto(true);
            } else if (cPen > 0) {
              setGastoMoneda('PEN');
              setGastoMonto(String(cPen));
              setGastoCategoria('Operativo_Proyecto');
              setGastoConcepto('');
              setGastoVinculadoCodigo('');
              setGastoSearch('');
              setModoGasto('NUEVO');
              setMostrarGasto(true);
            } else {
              setGastoMoneda('PEN');
              setGastoMonto('');
              setGastoCategoria('Operativo_Proyecto');
              setGastoConcepto('');
              setGastoVinculadoCodigo('');
              setGastoSearch('');
              setModoGasto('NUEVO');
              setMostrarGasto(false);
            }
          })
          .catch(() => {
            if (cPen > 0) {
              setGastoMoneda('PEN');
              setGastoMonto(String(cPen));
              setGastoVinculadoCodigo('');
              setGastoSearch('');
              setModoGasto('NUEVO');
              setMostrarGasto(true);
            }
          });
      } else if (cPen > 0) {
        setGastoMoneda('PEN');
        setGastoMonto(String(cPen));
        setGastoVinculadoCodigo('');
        setGastoSearch('');
        setModoGasto('NUEVO');
        setMostrarGasto(true);
      } else {
        setGastoVinculadoCodigo('');
        setGastoSearch('');
        setModoGasto('NUEVO');
        setMostrarGasto(false);
      }
    } else if (tareaId === null) {
      // Modo Creación explícito
      const now = new Date();
      setCodigoLegado('NUEVA TAREA');
      setNombre(initialTitulo || '');
      setEstado(estadoBase);
      setProyectoCodigo(initialProyectoCodigo || (proyectos[0]?.codigo_legado ?? 'PRO-001'));
      setHitoCodigo('');
      setIdDependencia('');
      setPrioridad('02_P2_Media');
      setNivelEnergia('Media_Operativa');
      setHorasEstimadas(1);
      setHorasReales(0);
      setHorasEstimadasStr('1:00');
      setHorasRealesStr('0:00');
      setFechaProgramada(formatFechaIsoLocal(now));
      setHoraInicio('09:00');
      setAgendadoCalendar('Sí');
      setEsMav(false);
      setCostoRealPen(0);
      setResponsable('');
      setNotas(initialNotas || '');
      setSubtareasLocal([]);
      setGastoMoneda('PEN');
      setGastoMonto('');
      setGastoCategoria('Operativo_Proyecto');
      setGastoConcepto('');
      setGastoVinculadoCodigo('');
      setGastoSearch('');
      setModoGasto('NUEVO');
      setMostrarGasto(false);
    }
  }, [isOpen, tareaId, tareaExistente, estadoBase, initialColumna, initialProyectoCodigo, initialTitulo, initialNotas, proyectos]);

  // Lista de subtareas activa
  const listaSubtareasActiva = tareaId ? subtareasExistentes : subtareasLocal;
  const totalSubtareas = listaSubtareasActiva.length;
  const completadasSubtareas = listaSubtareasActiva.filter((s) => s.completado).length;
  const progresoPct = totalSubtareas > 0 ? Math.round((completadasSubtareas / totalSubtareas) * 100) : 0;

  // Acciones sobre subtareas
  const agregarSubtarea = async () => {
    if (!nuevoPasoTexto.trim()) return;
    const texto = nuevoPasoTexto.trim();
    setNuevoPasoTexto('');
    setErrorMsgSubtarea(null);

    if (tareaId && tareaExistente?.codigo_legado) {
      const count = await db.subtareas_pasos.count();
      const nuevoCodigo = `SUB-${String(count + 1).padStart(3, '0')}`;
      const nowIso = new Date().toISOString();

      await db.subtareas_pasos.add({
        id: generateSafeUUID(),
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: nuevoCodigo,
        id_padre_vinculado: tareaExistente.codigo_legado,
        tipo_padre: 'TAREA',
        numero_paso: listaSubtareasActiva.length + 1,
        descripcion_paso: texto,
        completado: false,
        version: 1,
        updated_at: nowIso,
        sync_status: 'synced'
      });
    } else {
      setSubtareasLocal((prev) => [
        ...prev,
        {
          id: generateSafeUUID(),
          descripcion_paso: texto,
          completado: false
        }
      ]);
    }
  };

  const toggleSubtareaCompletado = async (sub: any, idx: number) => {
    const estaBloqueado = idx > 0 && !listaSubtareasActiva[idx - 1].completado;

    if (!sub.completado && estaBloqueado) {
      setErrorMsgSubtarea(`Debes completar primero el paso #${idx} antes de avanzar.`);
      return;
    }

    if (sub.completado) {
      const hayPosterioresCompletados = listaSubtareasActiva
        .slice(idx + 1)
        .some((p) => p.completado);

      if (hayPosterioresCompletados) {
        setErrorMsgSubtarea('Para desmarcar este paso, debes desmarcar primero los pasos posteriores completados.');
        return;
      }
    }

    if (errorMsgSubtarea) setErrorMsgSubtarea(null);

    if (tareaId && sub.id) {
      await db.subtareas_pasos.update(sub.id, {
        completado: !sub.completado,
        fecha_completado: !sub.completado ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      });
    } else {
      setSubtareasLocal((prev) =>
        prev.map((item) => (item.id === sub.id ? { ...item, completado: !item.completado } : item))
      );
    }
  };

  const eliminarSubtarea = async (subId: string) => {
    if (tareaId) {
      await db.subtareas_pasos.delete(subId);
    } else {
      setSubtareasLocal((prev) => prev.filter((item) => item.id !== subId));
    }
  };

  // Guardar Cambios
  const handleGuardar = async () => {
    if (!nombre.trim() || guardandoRef.current) return;
    guardandoRef.current = true;
    setIsSaving(true);

    try {
      const nowIso = new Date().toISOString();
      const hEstFinal = horasEstimadas || convertirStringToHorasDecimal(horasEstimadasStr) || 1;
      const hRealFinal = horasReales || convertirStringToHorasDecimal(horasRealesStr) || 0;

      const montoGastoFinal = parseFloat(gastoMonto) || 0;
      const tc = gastoMoneda === 'USD' ? 3.75 : gastoMoneda === 'EUR' ? 4.10 : 1.0;
      const costoPenCalculado = montoGastoFinal > 0 ? Number((montoGastoFinal * tc).toFixed(2)) : (Number(costoRealPen) || 0);

      let codTarFinal = '';
      let calRes: any = undefined;

      if (tareaId && tareaExistente) {
        codTarFinal = tareaExistente.codigo_legado || tareaId;
        const res = await actualizarTarea(tareaId, {
          nombre_tarea_actividad: nombre.trim(),
          estado_tarea: estado,
          proyecto_codigo: proyectoCodigo,
          hito_codigo: hitoCodigo || undefined,
          id_dependencia: idDependencia || undefined,
          prioridad_eisenhower: prioridad,
          nivel_energia_requerido: nivelEnergia,
          horas_estimadas: hEstFinal,
          horas_reales: hRealFinal,
          fecha_programada: fechaProgramada || undefined,
          hora_inicio: horaInicio.trim() || undefined,
          agendado_calendar: agendadoCalendar,
          es_mav: esMav,
          costo_real_pen: costoPenCalculado,
          responsable_ejecutor: responsable || undefined,
          notas_impedimentos: notas || undefined,
          updated_at: nowIso
        });
        calRes = res.calendarResult;
      } else {
        const res = await crearTarea({
          nombre_tarea_actividad: nombre.trim(),
          estado_tarea: estado,
          proyecto_codigo: proyectoCodigo || 'PRO-001',
          hito_codigo: hitoCodigo || undefined,
          id_dependencia: idDependencia || undefined,
          prioridad_eisenhower: prioridad,
          nivel_energia_requerido: nivelEnergia,
          horas_estimadas: hEstFinal,
          horas_reales: hRealFinal,
          fecha_programada: fechaProgramada || undefined,
          hora_inicio: horaInicio.trim() || undefined,
          agendado_calendar: agendadoCalendar,
          es_mav: esMav,
          costo_real_pen: costoPenCalculado,
          responsable_ejecutor: responsable || undefined,
          notas_impedimentos: notas || undefined,
          subtareas: subtareasLocal.map((item) => ({
            descripcion_paso: item.descripcion_paso,
            completado: item.completado
          }))
        });
        codTarFinal = res.tarea.codigo_legado;
        calRes = res.calendarResult;
      }

      if (calRes) {
        if (calRes.success && calRes.mode === 'API_V3') {
          mostrarToastCobalt(calRes.message || 'Sincronizado en Google Calendar', 'success');
        } else if (calRes.requiereAuth) {
          mostrarToastCobalt('Tarea guardada · Conecta Google Calendar para sync automático', 'info', 3500);
        } else if (!calRes.success && calRes.error) {
          mostrarToastCobalt(`Guardado local · ${calRes.error}`, 'warning', 3500);
        }
      }

      // Persistir / Vincular egreso en db.gastos
      if (codTarFinal) {
        if (modoGasto === 'VINCULAR') {
          if (gastoVinculadoCodigo) {
            const gastoAEnlazar = await db.gastos
              .where('codigo_legado')
              .equals(gastoVinculadoCodigo)
              .first();

            if (gastoAEnlazar) {
              await actualizarGasto(gastoAEnlazar.id, {
                id_origen_vinculado: codTarFinal,
                id_tarea: codTarFinal,
                id_proyecto: proyectoCodigo || undefined,
                tipo_origen: 'TAREA_PROYECTO'
              });
            }
          }
        } else if (montoGastoFinal > 0) {
          const gastoExistente = await db.gastos
            .where('id_origen_vinculado')
            .equals(codTarFinal)
            .first();

          if (gastoExistente) {
            await actualizarGasto(gastoExistente.id, {
              moneda_original: gastoMoneda,
              monto_original: montoGastoFinal,
              tipo_cambio: tc,
              monto_pen: costoPenCalculado,
              categoria_gasto: gastoCategoria,
              descripcion_gasto: gastoConcepto.trim() || `Gasto en ${nombre.trim()}`,
              fecha_gasto: fechaProgramada || formatFechaIsoLocal(new Date()),
              id_origen_vinculado: codTarFinal,
              id_tarea: codTarFinal,
              id_proyecto: proyectoCodigo || undefined,
              tipo_origen: 'TAREA_PROYECTO'
            });
          } else {
            await crearGasto({
              tipo_origen: 'TAREA_PROYECTO',
              id_origen_vinculado: codTarFinal,
              id_tarea: codTarFinal,
              id_proyecto: proyectoCodigo || undefined,
              categoria_gasto: gastoCategoria,
              fecha_gasto: fechaProgramada || formatFechaIsoLocal(new Date()),
              descripcion_gasto: gastoConcepto.trim() || `Gasto en ${nombre.trim()}`,
              moneda_original: gastoMoneda,
              monto_original: montoGastoFinal,
              tipo_cambio: tc,
              monto_pen: costoPenCalculado,
              estado_pago: 'PAGADO',
              metodo_pago: 'Efectivo'
            });
          }
        }
      }

      if (onGuardado) onGuardado();
      onClose();
    } finally {
      guardandoRef.current = false;
      setIsSaving(false);
    }
  };

  const handleArchivar = async () => {
    if (!tareaId) return;
    await actualizarTarea(tareaId, {
      estado_tarea: '05_Archivado'
    });
    if (onGuardado) onGuardado();
    onClose();
  };

  const handleEliminar = () => {
    if (!tareaId) return;
    const targetId = tareaId;
    const targetCodigoLegado = tareaExistente?.codigo_legado;
    const etiqueta = nombre || tareaExistente?.nombre_tarea_actividad || 'Tarea';
    programarEliminacion({
      tabla: 'tareas',
      id: targetId,
      etiqueta,
      tipo: 'TAREA',
      commit: async () => {
        await eliminarTarea(targetId, targetCodigoLegado);
      }
    });
    onClose();
  };

  // Atajos de teclado: Escape para cerrar, Ctrl+Enter / Cmd+Enter para guardar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGuardar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleGuardar]);

  return {
    isSaving,
    gcalEstado,
    tareaExistente,
    listaGastos,
    codigoLegado,
    nombre,
    setNombre,
    estado,
    setEstado,
    proyectoCodigo,
    setProyectoCodigo,
    hitoCodigo,
    setHitoCodigo,
    idDependencia,
    setIdDependencia,
    prioridad,
    setPrioridad,
    nivelEnergia,
    setNivelEnergia,
    horasEstimadas,
    setHorasEstimadas,
    horasReales,
    setHorasReales,
    horasEstimadasStr,
    setHorasEstimadasStr,
    horasRealesStr,
    setHorasRealesStr,
    fechaProgramada,
    setFechaProgramada,
    horaInicio,
    setHoraInicio,
    agendadoCalendar,
    setAgendadoCalendar,
    esMav,
    setEsMav,
    costoRealPen,
    setCostoRealPen,
    responsable,
    setResponsable,
    notas,
    setNotas,
    mostrarGasto,
    setMostrarGasto,
    modoGasto,
    setModoGasto,
    gastoMoneda,
    setGastoMoneda,
    gastoMonto,
    setGastoMonto,
    gastoCategoria,
    setGastoCategoria,
    gastoConcepto,
    setGastoConcepto,
    gastoVinculadoCodigo,
    setGastoVinculadoCodigo,
    gastoSearch,
    setGastoSearch,
    nuevoPasoTexto,
    setNuevoPasoTexto,
    errorMsgSubtarea,
    opcionesProyectosCobalt,
    opcionesHitosCobalt,
    opcionesDependencias,
    copiado,
    handleCopiarCodigo,
    menuEstadoAbierto,
    setMenuEstadoAbierto,
    estadoMenuRef,
    OPCIONES_ESTADO,
    estadoActualConfig,
    listaSubtareasActiva,
    totalSubtareas,
    completadasSubtareas,
    progresoPct,
    agregarSubtarea,
    toggleSubtareaCompletado,
    eliminarSubtarea,
    handleGuardar,
    handleArchivar,
    handleEliminar
  };
}
