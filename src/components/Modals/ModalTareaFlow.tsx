import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  X,
  Calendar,
  Zap,
  CheckCircle2,
  FolderKanban,
  Milestone,
  Plus,
  Trash2,
  Archive,
  DollarSign,
  Lock,
  Flame,
  AlertCircle,
  ArrowDown,
  Minus,
  Cpu,
  Coffee,
  ChevronDown,
  Link2,
  Search,
  Check,
  Loader2,
  CalendarCheck2,
  Hash,
  CircleDot,
  Layers
} from 'lucide-react';
import { SelectIconicoCobalt } from '../UI/SelectIconicoCobalt';
import { OPCIONES_CATEGORIA_GASTO_COBALT } from '../../constants/uiMappers';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { TareaRecord, SubtareaPaso } from '../../types';
import { getProp } from '../../utils/entityNormalizer';
import { generateSafeUUID } from '../../utils/uuidGenerator';
import { SeccionNotasVinculadasModal } from '../Notas/SeccionNotasVinculadasModal';
import { SwitchCobalt } from '../UI/SwitchCobalt';
import { InputFechaCobalt } from '../UI/InputFechaCobalt';
import { InputHoraCobalt } from '../UI/InputHoraCobalt';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import { crearTarea, actualizarTarea, eliminarTarea } from '../../services/tareasService';
import { crearGasto, actualizarGasto } from '../../services/gastosService';
import {
  obtenerEstadoConexionGoogleCalendar,
  suscribirEstadoGoogleCalendar
} from '../../services/calendarSyncService';
import { mostrarToastCobalt } from '../../utils/toastCobalt';

import {
  convertirStringToHorasDecimal,
  convertirHorasDecimalAString,
  formatearDuracionLegible,
  formatFechaIsoLocal
} from '../../utils/timeFormatters';

export {
  convertirStringToHorasDecimal,
  convertirHorasDecimalAString,
  formatearDuracionLegible
};

interface ModalTareaFlowProps {
  isOpen: boolean;
  onClose: () => void;
  tareaId: string | null; // ID de Tarea a editar, o null si es creación
  initialColumna?: string; // '01_Backlog' | '02_Por_Hacer' | '03_En_Proceso' | '04_Completado'
  estadoInicial?: string;
  initialProyectoCodigo?: string | null;
  initialTitulo?: string;
  initialNotas?: string;
  onGuardado?: () => void;
}

export const ModalTareaFlow: React.FC<ModalTareaFlowProps> = ({
  isOpen,
  onClose,
  tareaId,
  initialColumna = '01_Backlog',
  estadoInicial,
  initialProyectoCodigo = null,
  initialTitulo = '',
  initialNotas = '',
  onGuardado
}) => {
  const estadoBase = estadoInicial || initialColumna || '01_Backlog';
  // Bloquear scroll de fondo incondicionalmente según isOpen
  useBodyScrollLock(isOpen);
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

  const OPCIONES_ESTADO = [
    { id: '01_Backlog', label: 'Backlog', icon: Layers, color: 'text-slate-300 bg-slate-900/80 border-slate-700/80 hover:border-slate-500' },
    { id: '02_Por_Hacer', label: 'Por Hacer', icon: CircleDot, color: 'text-sky-300 bg-sky-950/60 border-sky-700/70 hover:border-sky-400' },
    { id: '03_En_Proceso', label: 'En Proceso', icon: Zap, color: 'text-amber-300 bg-amber-950/60 border-amber-700/70 hover:border-amber-400' },
    { id: '04_Completado', label: 'Completado', icon: CheckCircle2, color: 'text-emerald-300 bg-emerald-950/60 border-emerald-700/70 hover:border-emerald-400' },
    { id: '05_Archivado', label: 'Archivado', icon: Archive, color: 'text-purple-300 bg-purple-950/60 border-purple-700/70 hover:border-purple-400' }
  ];

  const estadoActualConfig = OPCIONES_ESTADO.find((o) => o.id === estado) || OPCIONES_ESTADO[0];

  // Sincronizar datos al abrir o cambiar tareaId
  useEffect(() => {
    if (!isOpen) return;

    // Si se especificó una tarea para edición pero Dexie aún está resolviendo, esperar sin blanquear
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

  // Lista de subtareas activa (existentes de Dexie si estamos editando, o locales si creando)
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
      // Persistencia inmediata en Dexie
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
      // Modo local
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

    // Si no está completado y está bloqueado por el paso anterior: IMPEDIR
    if (!sub.completado && estaBloqueado) {
      setErrorMsgSubtarea(`Debes completar primero el paso #${idx} antes de avanzar.`);
      return;
    }

    // Si está completado y se quiere desmarcar, verificar si hay pasos posteriores completados (LIFO)
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
              tipo_origen: 'TAREA'
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
            fecha_gasto: fechaProgramada || formatFechaIsoLocal(new Date())
          });
        } else {
          await crearGasto({
            tipo_origen: 'TAREA',
            id_origen_vinculado: codTarFinal,
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

  if (!isOpen) return null;

  const modalContent = (
    <div
      id="modal-tarea-flow"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200"
    >
      <div
        id="modal-tarea-flow-card"
        className="w-full max-w-5xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-800/80 bg-[#0D1526] shadow-2xl relative transform-gpu transition-[transform,opacity] duration-200 ease-out overflow-hidden"
      >
        {/* DRAG HANDLE MÓVIL */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* 1. CABECERA SUPERIOR */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-800/80 shrink-0 space-y-2.5 bg-[#0A101D]">
          {/* Fila 1: Código Interactivo, Estado Selector y Botón Cerrar */}
          <div className="flex items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
              {/* Placa de Código Interactivo con Copy-to-Clipboard */}
              <button
                type="button"
                id="task-flow-badge-id"
                onClick={handleCopiarCodigo}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/70 hover:border-sky-500/50 text-slate-200 text-[11px] font-mono tabular-nums font-bold tracking-wider transition-all duration-150 cursor-pointer active:scale-95 shrink-0 select-none shadow-2xs"
                title="Clic para copiar código de tarea"
              >
                {copiado ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />
                    <span className="text-emerald-400">COPIADO</span>
                  </>
                ) : (
                  <>
                    <Hash className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
                    <span>{codigoLegado || (tareaId ? (tareaId.startsWith('TAR-') ? tareaId : 'CARGANDO...') : 'NUEVA TAREA')}</span>
                  </>
                )}
              </button>

              {/* Píldora de Estado Interactiva */}
              <div className="relative shrink-0" ref={estadoMenuRef}>
                <button
                  type="button"
                  id="task-flow-estado-badge"
                  onClick={() => setMenuEstadoAbierto((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                    estadoActualConfig?.color || 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                  title="Cambiar estado de la tarea"
                >
                  {estadoActualConfig && <estadoActualConfig.icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />}
                  <span>{estadoActualConfig?.label || estado}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${menuEstadoAbierto ? 'rotate-180' : ''}`} />
                </button>

                {menuEstadoAbierto && (
                  <div className="absolute top-[calc(100%+6px)] left-0 z-50 p-1 rounded-xl bg-[#0D1526] border border-slate-700 shadow-2xl min-w-[150px] space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    {OPCIONES_ESTADO.map((opt) => {
                      const esSel = estado === opt.id;
                      const IconC = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setEstado(opt.id);
                            setMenuEstadoAbierto(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            esSel
                              ? 'bg-sky-500/15 text-sky-300 font-bold'
                              : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <IconC className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                            <span>{opt.label}</span>
                          </div>
                          {esSel && <Check className="w-3 h-3 text-sky-400" strokeWidth={2} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Píldora discreta de Dependencia (si existe) */}
              {idDependencia && (
                <div
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs text-amber-300 select-none max-w-[200px] overflow-hidden whitespace-nowrap shrink-0 cursor-default"
                  title={`Requiere: ${idDependencia}`}
                >
                  <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate font-mono tabular-nums text-[11px] font-semibold">{idDependencia}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[36px] min-h-[36px] p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-auto"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fila 2: Título Editable Prominente */}
          <div className="pt-0.5">
            <input
              type="text"
              id="task-flow-titulo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Título de la tarea o entregable..."
              className="text-lg sm:text-xl font-bold text-slate-100 placeholder:text-slate-500 bg-transparent outline-none w-full border-b border-transparent focus:border-sky-500 transition-colors py-0.5"
              autoFocus
            />
          </div>
        </div>

        {/* 2. CUERPO SPLIT (2 COLUMNAS LINEAR) */}
        {tareaId !== null && tareaExistente === undefined ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3 min-h-[300px]">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-medium font-mono">Cargando detalles de la tarea...</span>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* A. COLUMNA IZQUIERDA — LIENZO DE TRABAJO */}
            <div className="flex-1 min-w-0 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
              {/* 1. Descripción y Especificaciones Técnicas */}
              <div className="space-y-1.5">
                <label className="block font-bold text-xs text-slate-400">
                  Descripción y Especificaciones Técnicas
                </label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Especificaciones técnicas, entregables, o impedimentos..."
                  className="w-full bg-[#080E1C]/80 border border-slate-800/70 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50 transition resize-y custom-scrollbar"
                />
              </div>

              {/* 2. Subtareas / Pasos (Definition of Done) */}
              <div className="p-4 bg-[#080E1C]/80 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg text-xs font-black">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">Pasos / Subtareas</h4>
                      <p className="text-[10px] text-slate-400">Procedimiento guiado secuencial (Definition of Done)</p>
                    </div>
                  </div>

                  <div
                    id="task-flow-pasos-progreso-badge"
                    className="font-mono tabular-nums text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#040711] text-slate-300 border border-slate-800"
                  >
                    {completadasSubtareas}/{totalSubtareas} pasos ({progresoPct}%)
                  </div>
                </div>

                {/* Barra de progreso con gradiente */}
                <div className="w-full bg-[#040711] h-1.5 rounded-full overflow-hidden border border-slate-800/40">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progresoPct}%` }}
                  />
                </div>

                {/* Contenedor Anti-CLS con altura fija reservada */}
                <div className="min-h-[22px] flex items-center">
                  <p
                    className={`w-full text-rose-400 text-xs font-semibold py-1 px-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 transition-opacity duration-200 ${
                      errorMsgSubtarea ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    {errorMsgSubtarea || ''}
                  </p>
                </div>

                {/* Lista de pasos */}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {listaSubtareasActiva.length === 0 ? (
                    <p className="text-center py-3 text-[11px] text-slate-400 italic">No hay pasos procedurales agregados.</p>
                  ) : (
                    listaSubtareasActiva.map((sub, idx) => {
                      const estaBloqueado = idx > 0 && !listaSubtareasActiva[idx - 1].completado;

                      return (
                        <div
                          key={sub.id}
                          title={estaBloqueado ? 'Completa primero el paso anterior' : undefined}
                          className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs group transition-colors ${
                            estaBloqueado
                              ? 'opacity-50 cursor-not-allowed select-none bg-slate-900/40 border-slate-800/40'
                              : 'bg-[#040711] border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {estaBloqueado ? (
                              <div
                                className="w-5 h-5 rounded-md flex items-center justify-center border border-slate-800 bg-slate-900/40 text-slate-500 shrink-0 select-none"
                                title="Completa primero el paso anterior"
                              >
                                <Lock className="w-3 h-3 text-slate-500" />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleSubtareaCompletado(sub, idx)}
                                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0 active:scale-95 ${
                                  sub.completado
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                    : 'border-slate-600 hover:border-emerald-400 bg-slate-900/80 text-transparent'
                                }`}
                                title={sub.completado ? 'Marcar incompleto' : 'Marcar completado'}
                              >
                                {sub.completado && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                              </button>
                            )}
                            <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">#{idx + 1}</span>
                            <span
                              className={`truncate ${
                                sub.completado
                                  ? 'line-through text-slate-500'
                                  : estaBloqueado
                                  ? 'text-slate-500'
                                  : 'text-slate-200'
                              }`}
                            >
                              {sub.descripcion_paso}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => eliminarSubtarea(sub.id)}
                            className="opacity-90 sm:opacity-0 sm:group-hover:opacity-100 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer flex items-center justify-center shrink-0"
                            title="Eliminar paso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input para nuevo paso */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={nuevoPasoTexto}
                    onChange={(e) => setNuevoPasoTexto(e.target.value)}
                    placeholder="Escribe el siguiente paso procedural y pulsa Enter..."
                    className="flex-1 border border-slate-800 rounded-lg px-3 py-1.5 text-xs bg-[#040711] text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        agregarSubtarea();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={agregarSubtarea}
                    className="h-8 px-3 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-sky-950/50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Agregar paso procedural"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="hidden sm:inline">Añadir</span>
                  </button>
                </div>
              </div>

              {/* 3. Notas Vinculadas */}
              <SeccionNotasVinculadasModal
                codigoEntidad={tareaExistente?.codigo_legado || tareaId || ''}
                tipoEntidad="TAREA"
                tituloEntidad={nombre || tareaExistente?.nombre_tarea_actividad || 'Tarea'}
              />
            </div>

            {/* B. COLUMNA DERECHA — INSPECTOR DE PROPIEDADES */}
            <div className="w-full md:w-[350px] lg:w-[380px] shrink-0 bg-[#080E1C]/80 border-t md:border-t-0 md:border-l border-slate-800/80 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
              {/* 1. Contexto WBS */}
              <div className="space-y-3 p-3 bg-[#0D1526]/80 rounded-xl border border-slate-800/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-800/60">
                  <FolderKanban className="w-3.5 h-3.5 text-sky-400" />
                  <span>Contexto WBS & Proyecto</span>
                </span>
                <SelectIconicoCobalt
                  label="Proyecto Principal"
                  valor={proyectoCodigo}
                  onChange={(cod) => {
                    setProyectoCodigo(cod);
                    setHitoCodigo('');
                  }}
                  opciones={opcionesProyectosCobalt}
                  placeholder="Seleccionar Proyecto..."
                />
                <SelectIconicoCobalt
                  label="Paquete de Trabajo / Hito WBS"
                  valor={hitoCodigo}
                  onChange={(cod) => setHitoCodigo(cod)}
                  opciones={opcionesHitosCobalt}
                  placeholder="Sin Paquete WBS"
                />
                <SelectIconicoCobalt
                  label="Tarea Predecesora"
                  valor={idDependencia}
                  onChange={(cod) => setIdDependencia(cod)}
                  opciones={opcionesDependencias}
                  placeholder="Sin dependencias"
                />
              </div>

              {/* 2. Tiempo, Esfuerzo & Calendar */}
              <div className="space-y-3 p-3 bg-[#0D1526]/80 rounded-xl border border-slate-800/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-800/60">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tiempo & Agenda</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <InputFechaCobalt
                    label="Fecha Programada"
                    value={fechaProgramada}
                    onChange={setFechaProgramada}
                  />
                  <InputHoraCobalt
                    label="Hora Inicio"
                    value={horaInicio}
                    onChange={setHoraInicio}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Horas Est. (H:MM)</label>
                    <input
                      type="text"
                      placeholder="1:30"
                      value={horasEstimadasStr}
                      onChange={(e) => setHorasEstimadasStr(e.target.value)}
                      onBlur={() => {
                        const dec = convertirStringToHorasDecimal(horasEstimadasStr);
                        setHorasEstimadas(dec);
                        setHorasEstimadasStr(convertirHorasDecimalAString(dec));
                      }}
                      className="w-full bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs font-mono tabular-nums text-center outline-none text-slate-200 focus:border-sky-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Horas Reales (H:MM)</label>
                    <input
                      type="text"
                      placeholder="0:45"
                      value={horasRealesStr}
                      onChange={(e) => setHorasRealesStr(e.target.value)}
                      onBlur={() => {
                        const dec = convertirStringToHorasDecimal(horasRealesStr);
                        setHorasReales(dec);
                        setHorasRealesStr(convertirHorasDecimalAString(dec));
                      }}
                      className="w-full bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs font-mono tabular-nums text-center outline-none text-slate-200 focus:border-sky-500/50"
                    />
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                  <SwitchCobalt
                    id="switch-tarea-calendar"
                    checked={agendadoCalendar === 'Sí'}
                    onChange={(val) => setAgendadoCalendar(val ? 'Sí' : 'No')}
                    label="Agendar en Calendar"
                    size="sm"
                  />
                  {agendadoCalendar === 'Sí' && (
                    <div className="flex items-center gap-1.5">
                      {gcalEstado.conectado && (
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.18)]"
                          title={gcalEstado.email ? `Sincronización automática activa (${gcalEstado.email})` : 'Sincronización automática activa con Google Calendar'}
                          aria-label="Google Calendar conectado"
                        >
                          <CalendarCheck2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Prioridad Eisenhower */}
              <div className="space-y-2 p-3 bg-[#0D1526]/80 rounded-xl border border-slate-800/70">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Prioridad Eisenhower
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: '01_P1_Alta', label: 'P1 · Crítica', icon: Flame, activeClass: 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-xs' },
                    { id: '02_P2_Media', label: 'P2 · Alta', icon: AlertCircle, activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-xs' },
                    { id: '03_P3_Baja', label: 'P3 · Normal', icon: ArrowDown, activeClass: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-xs' },
                    { id: '04_P4', label: 'P4 · Baja', icon: Minus, activeClass: 'bg-slate-500/20 border-slate-500/50 text-slate-300 shadow-xs' },
                  ].map((p) => {
                    const IconComp = p.icon;
                    const isSelected = prioridad === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPrioridad(p.id)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? p.activeClass
                            : 'border-slate-800/80 bg-[#040711] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Nivel de Energía, Responsable & MAV */}
              <div className="space-y-2.5 p-3 bg-[#0D1526]/80 rounded-xl border border-slate-800/70">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Nivel de Energía
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'Alta_DeepWork', label: 'DeepWork', icon: Zap, activeClass: 'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-xs' },
                    { id: 'Media_Operativa', label: 'Operativa', icon: Cpu, activeClass: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-xs' },
                    { id: 'Baja_Automatica', label: 'Mecánica', icon: Coffee, activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-xs' },
                  ].map((e) => {
                    const IconComp = e.icon;
                    const isSelected = nivelEnergia === e.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setNivelEnergia(e.id)}
                        className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? e.activeClass
                            : 'border-slate-800/80 bg-[#040711] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        <span>{e.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Responsable & MAV */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 items-center">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Responsable</label>
                    <input
                      type="text"
                      value={responsable}
                      onChange={(e) => setResponsable(e.target.value)}
                      placeholder="Ej. Christopher"
                      className="w-full bg-[#040711] px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs outline-none text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50"
                    />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Mínimo Avance Viable</span>
                    <button
                      type="button"
                      onClick={() => setEsMav(!esMav)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                        esMav
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                          : 'bg-[#040711] border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Zap className={`w-3 h-3 ${esMav ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                      <span>{esMav ? 'MAV Activo' : 'Inactivo'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Acordeón Gasto Asociado & Costos */}
              <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-[#0D1526]/80 transition-all duration-150">
                <button
                  type="button"
                  onClick={() => setMostrarGasto(!mostrarGasto)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30 transition-all duration-150 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Gasto & Costos</span>
                    {modoGasto === 'VINCULAR' && gastoVinculadoCodigo ? (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 shrink-0">
                        <Link2 className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{gastoVinculadoCodigo}</span>
                      </span>
                    ) : parseFloat(gastoMonto) > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shrink-0">
                        {gastoMoneda === 'PEN' ? 'S/' : gastoMoneda === 'USD' ? '$' : '€'} {Number(gastoMonto).toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {!mostrarGasto && (!gastoMonto || parseFloat(gastoMonto) === 0) && !gastoVinculadoCodigo && (
                      <span className="text-[10px] text-slate-400 font-normal">Sin gastos</span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-400 transition-transform duration-200 ${
                        mostrarGasto ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {mostrarGasto && (
                  <div className="p-3 border-t border-emerald-500/20 bg-[#0D1526] space-y-3">
                    {/* Selector de Pestaña Superior: Modo Dual */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Modo
                      </span>
                      <div className="inline-flex p-0.5 bg-[#040711] rounded-lg border border-slate-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setModoGasto('NUEVO')}
                          className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                            modoGasto === 'NUEVO'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Nuevo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoGasto('VINCULAR')}
                          className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                            modoGasto === 'VINCULAR'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Link2 className="w-3 h-3" />
                          <span>Vincular</span>
                        </button>
                      </div>
                    </div>

                    {modoGasto === 'NUEVO' ? (
                      /* Modo REGISTRAR NUEVO GASTO */
                      <div className="space-y-2.5">
                        {/* Selector Moneda */}
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Moneda</label>
                          <div className="inline-flex p-0.5 bg-[#040711] rounded-lg border border-slate-800 w-full justify-between">
                            {(['PEN', 'USD', 'EUR'] as const).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => {
                                  setGastoMoneda(m);
                                  const val = parseFloat(gastoMonto) || 0;
                                  const tc = m === 'USD' ? 3.75 : m === 'EUR' ? 4.10 : 1.0;
                                  setCostoRealPen(Number((val * tc).toFixed(2)));
                                }}
                                className={`flex-1 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                                  gastoMoneda === m ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Input Monto Incurrido */}
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Monto Incurrido</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-emerald-400 select-none">
                              {gastoMoneda === 'PEN' ? 'S/' : gastoMoneda === 'USD' ? '$' : '€'}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={gastoMonto}
                              onChange={(e) => {
                                setGastoMonto(e.target.value);
                                const val = parseFloat(e.target.value) || 0;
                                const tc = gastoMoneda === 'USD' ? 3.75 : gastoMoneda === 'EUR' ? 4.10 : 1.0;
                                setCostoRealPen(Number((val * tc).toFixed(2)));
                              }}
                              placeholder="0.00"
                              className="w-full pl-9 pr-3 py-1.5 border border-slate-800 rounded-lg bg-[#040711] font-mono font-bold text-base text-emerald-300 outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>

                        {/* Categoría y Concepto */}
                        <div className="space-y-2">
                          <SelectIconicoCobalt
                            label="Categoría Contable"
                            valor={gastoCategoria}
                            onChange={(nuevaCat) => setGastoCategoria(nuevaCat)}
                            opciones={OPCIONES_CATEGORIA_GASTO_COBALT}
                          />
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Glosa / Concepto</label>
                            <input
                              type="text"
                              value={gastoConcepto}
                              onChange={(e) => setGastoConcepto(e.target.value)}
                              placeholder="Ej. Servidor cloud, licencia..."
                              className="w-full bg-[#040711] px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-500"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Modo VINCULAR EGRESO EXISTENTE */
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={gastoSearch}
                            onChange={(e) => setGastoSearch(e.target.value)}
                            placeholder="Buscar egreso..."
                            className="w-full pl-8 pr-3 py-1.5 border border-slate-800 rounded-lg bg-[#040711] text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50"
                          />
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>

                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                          {listaGastos
                            .filter((g) => {
                              const q = gastoSearch.toLowerCase().trim();
                              if (!q) return true;
                              return (
                                (g.codigo_legado || '').toLowerCase().includes(q) ||
                                (g.descripcion_gasto || '').toLowerCase().includes(q) ||
                                String(g.monto_pen || g.monto_original || '').includes(q) ||
                                (g.categoria_gasto || '').toLowerCase().includes(q)
                              );
                            })
                            .slice(0, 30)
                            .map((g) => {
                              const isSelected = gastoVinculadoCodigo === g.codigo_legado;
                              const montoMostrar = Number(g.monto_pen || g.monto_original || 0).toFixed(2);
                              return (
                                <div
                                  key={g.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      setGastoVinculadoCodigo('');
                                      setGastoMonto('');
                                      setCostoRealPen(0);
                                    } else {
                                      setGastoVinculadoCodigo(g.codigo_legado || '');
                                      const mVal = String(g.monto_original || g.monto_pen || '');
                                      setGastoMonto(mVal);
                                      setGastoMoneda((g.moneda_original as 'PEN' | 'USD' | 'EUR') || 'PEN');
                                      setGastoCategoria(g.categoria_gasto || 'Operativo_Proyecto');
                                      setGastoConcepto(g.descripcion_gasto || '');
                                      const tc = g.moneda_original === 'USD' ? 3.75 : g.moneda_original === 'EUR' ? 4.10 : 1.0;
                                      const valNum = parseFloat(mVal) || 0;
                                      setCostoRealPen(g.monto_pen || Number((valNum * tc).toFixed(2)));
                                    }
                                  }}
                                  className={`p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer border transition-all ${
                                    isSelected
                                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-xs'
                                      : 'bg-[#040711] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-[10px] text-sky-400 bg-sky-950/50 px-1 py-0.2 rounded border border-sky-800/40 shrink-0">
                                          {g.codigo_legado}
                                        </span>
                                        <span className="font-medium text-slate-200 truncate text-[11px]">
                                          {g.descripcion_gasto || 'Sin descripción'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 ml-1.5">
                                    <span className="font-mono font-bold text-xs text-emerald-300">
                                      S/ {montoMostrar}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. PIE DE DIÁLOGO / FOOTER */}
        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-800/80 bg-[#0A101D] flex items-center justify-between gap-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          {/* Izquierda: Eliminar / Archivar */}
          <div className="flex items-center gap-2">
            {tareaId && (
              <>
                <button
                  type="button"
                  onClick={handleEliminar}
                  className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Eliminar tarea permanentemente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>

                <button
                  type="button"
                  onClick={handleArchivar}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Mover a bóveda de archivados"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Archivar</span>
                </button>
              </>
            )}
          </div>

          {/* Derecha: Cancelar + Guardar */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleGuardar}
              className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 flex items-center justify-center cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{tareaId ? 'Guardar Cambios' : 'Crear Tarea'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
