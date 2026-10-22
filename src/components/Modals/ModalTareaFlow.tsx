import React, { useState, useEffect } from 'react';
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
  Check,
  Lock,
  Flame,
  AlertCircle,
  ArrowDown,
  Minus,
  Cpu,
  Coffee,
  ChevronDown,
  Link2,
  Search
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { TareaRecord, SubtareaPaso } from '../../types';
import { getProp } from '../../utils/entityNormalizer';
import { SeccionNotasVinculadasModal } from '../Notas/SeccionNotasVinculadasModal';

/**
 * Convierte una cadena de texto en formato 'H:MM', 'H', 'MMm' o decimal a número de horas decimal.
 * Ej: '1:30' -> 1.5, '0:45' -> 0.75, '2' -> 2.0, '90m' -> 1.5
 */
export function convertirStringToHorasDecimal(str: string): number {
  if (!str || typeof str !== 'string') return 0;
  const s = str.trim().toLowerCase();
  if (!s) return 0;

  // Formato minutos puro: '90m' o '45min'
  if (s.endsWith('m') || s.endsWith('min')) {
    const minVal = parseFloat(s.replace(/[^0-9.]/g, ''));
    return isNaN(minVal) ? 0 : Number((minVal / 60).toFixed(2));
  }

  // Formato H:MM o HH:MM
  if (s.includes(':')) {
    const parts = s.split(':');
    const horas = parseInt(parts[0], 10) || 0;
    const minutos = parseInt(parts[1], 10) || 0;
    return Number((horas + minutos / 60).toFixed(2));
  }

  // Formato decimal directo '1.5' o '2'
  const parsed = parseFloat(s.replace(',', '.'));
  return isNaN(parsed) ? 0 : Number(parsed.toFixed(2));
}

/**
 * Convierte un valor numérico decimal de horas a cadena canónica 'H:MM'.
 * Ej: 1.5 -> '1:30', 0.75 -> '0:45', 2 -> '2:00', 0 -> '0:00'
 */
export function convertirHorasDecimalAString(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num) || num <= 0) return '0:00';
  const horas = Math.floor(num);
  const minutos = Math.round((num - horas) * 60);
  if (minutos >= 60) {
    return `${horas + 1}:00`;
  }
  return `${horas}:${String(minutos).padStart(2, '0')}`;
}

interface ModalTareaFlowProps {
  isOpen: boolean;
  onClose: () => void;
  tareaId: string | null; // ID de Tarea a editar, o null si es creación
  initialColumna?: string; // '01_Backlog' | '02_Por_Hacer' | '03_En_Proceso' | '04_Completado'
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
  initialProyectoCodigo = null,
  initialTitulo = '',
  initialNotas = '',
  onGuardado
}) => {
  // Bloquear scroll de fondo incondicionalmente según isOpen
  useBodyScrollLock(isOpen);

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
  const [estado, setEstado] = useState(initialColumna);
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
      setEstado(initialColumna);
      setProyectoCodigo(initialProyectoCodigo || (proyectos[0]?.codigo_legado ?? 'PRO-001'));
      setHitoCodigo('');
      setIdDependencia('');
      setPrioridad('02_P2_Media');
      setNivelEnergia('Media_Operativa');
      setHorasEstimadas(1);
      setHorasReales(0);
      setHorasEstimadasStr('1:00');
      setHorasRealesStr('0:00');
      setFechaProgramada(now.toISOString().split('T')[0]);
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
  }, [isOpen, tareaId, tareaExistente, initialColumna, initialProyectoCodigo, initialTitulo, initialNotas, proyectos]);

  // Manejo incondicional de tecla Escape para cerrar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

    if (tareaId && tareaExistente?.codigo_legado) {
      // Persistencia inmediata en Dexie
      const count = await db.subtareas_pasos.count();
      const nuevoCodigo = `SUB-${String(count + 1).padStart(3, '0')}`;
      const nowIso = new Date().toISOString();

      await db.subtareas_pasos.add({
        id: crypto.randomUUID ? crypto.randomUUID() : `sub-${Date.now()}`,
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
          id: `local-${Date.now()}-${Math.random()}`,
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
      alert(`Debes completar primero el paso #${idx} antes de avanzar.`);
      return;
    }

    // Si está completado y se quiere desmarcar, verificar si hay pasos posteriores completados (LIFO)
    if (sub.completado) {
      const hayPosterioresCompletados = listaSubtareasActiva
        .slice(idx + 1)
        .some((p) => p.completado);

      if (hayPosterioresCompletados) {
        alert('Para desmarcar este paso, debes desmarcar primero los pasos posteriores completados.');
        return;
      }
    }

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
    if (!nombre.trim()) return;

    const nowIso = new Date().toISOString();
    const hEstFinal = horasEstimadas || convertirStringToHorasDecimal(horasEstimadasStr) || 1;
    const hRealFinal = horasReales || convertirStringToHorasDecimal(horasRealesStr) || 0;

    const montoGastoFinal = parseFloat(gastoMonto) || 0;
    const tc = gastoMoneda === 'USD' ? 3.75 : gastoMoneda === 'EUR' ? 4.10 : 1.0;
    const costoPenCalculado = montoGastoFinal > 0 ? Number((montoGastoFinal * tc).toFixed(2)) : (Number(costoRealPen) || 0);

    let codTarFinal = '';

    if (tareaId && tareaExistente) {
      codTarFinal = tareaExistente.codigo_legado || tareaId;
      // Actualizar tarea existente
      await db.tareas.update(tareaId, {
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
        agendado_calendar: agendadoCalendar,
        es_mav: esMav,
        costo_real_pen: costoPenCalculado,
        responsable_ejecutor: responsable || undefined,
        notas_impedimentos: notas || undefined,
        updated_at: nowIso
      });
    } else {
      // Crear nueva tarea
      const totalTareas = await db.tareas.count();
      const nuevoCodigoTar = `TAR-${String(totalTareas + 1).padStart(3, '0')}`;
      codTarFinal = nuevoCodigoTar;
      const nuevaTareaId = crypto.randomUUID ? crypto.randomUUID() : `tar-${Date.now()}`;

      await db.tareas.add({
        id: nuevaTareaId,
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: nuevoCodigoTar,
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
        agendado_calendar: agendadoCalendar,
        es_mav: esMav,
        costo_real_pen: costoPenCalculado,
        responsable_ejecutor: responsable || undefined,
        notas_impedimentos: notas || undefined,
        updated_at: nowIso,
        sync_status: 'synced'
      });

      // Persistir subtareas locales si se agregaron
      if (subtareasLocal.length > 0) {
        let subIndex = await db.subtareas_pasos.count();
        for (let i = 0; i < subtareasLocal.length; i++) {
          const item = subtareasLocal[i];
          subIndex++;
          await db.subtareas_pasos.add({
            id: crypto.randomUUID ? crypto.randomUUID() : `sub-${Date.now()}-${i}`,
            user_id: '00000000-0000-0000-0000-000000000001',
            codigo_legado: `SUB-${String(subIndex).padStart(3, '0')}`,
            id_padre_vinculado: nuevoCodigoTar,
            tipo_padre: 'TAREA',
            numero_paso: i + 1,
            descripcion_paso: item.descripcion_paso,
            completado: item.completado,
            version: 1,
            updated_at: nowIso,
            sync_status: 'synced'
          });
        }
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
            await db.gastos.update(gastoAEnlazar.id, {
              id_origen_vinculado: codTarFinal,
              tipo_origen: 'TAREA',
              updated_at: nowIso,
              sync_status: 'pending'
            });
          }
        }
      } else if (montoGastoFinal > 0) {
        const gastoExistente = await db.gastos
          .where('id_origen_vinculado')
          .equals(codTarFinal)
          .first();

        if (gastoExistente) {
          await db.gastos.update(gastoExistente.id, {
            moneda_original: gastoMoneda,
            monto_original: montoGastoFinal,
            tipo_cambio: tc,
            monto_pen: costoPenCalculado,
            categoria_gasto: gastoCategoria,
            descripcion_gasto: gastoConcepto.trim() || `Gasto en ${nombre.trim()}`,
            fecha_gasto: fechaProgramada || nowIso.split('T')[0],
            updated_at: nowIso,
            sync_status: 'pending'
          });
        } else {
          const countGastos = await db.gastos.count();
          const codGasto = `GAS-${String(countGastos + 1).padStart(3, '0')}`;
          await db.gastos.add({
            id: crypto.randomUUID ? crypto.randomUUID() : `gas-${Date.now()}`,
            user_id: '00000000-0000-0000-0000-000000000001',
            codigo_legado: codGasto,
            tipo_origen: 'TAREA',
            id_origen_vinculado: codTarFinal,
            categoria_gasto: gastoCategoria,
            fecha_gasto: fechaProgramada || nowIso.split('T')[0],
            descripcion_gasto: gastoConcepto.trim() || `Gasto en ${nombre.trim()}`,
            moneda_original: gastoMoneda,
            monto_original: montoGastoFinal,
            tipo_cambio: tc,
            monto_pen: costoPenCalculado,
            estado_pago: 'PAGADO',
            updated_at: nowIso,
            sync_status: 'pending'
          });
        }
      }
    }

    if (onGuardado) onGuardado();
    onClose();
  };

  const handleArchivar = async () => {
    if (!tareaId) return;
    await db.tareas.update(tareaId, {
      estado_tarea: '05_Archivado',
      updated_at: new Date().toISOString()
    });
    if (onGuardado) onGuardado();
    onClose();
  };

  const handleEliminar = async () => {
    if (!tareaId) return;
    if (window.confirm('¿Confirmas la eliminación permanente de esta tarea y sus subtareas?')) {
      if (tareaExistente?.codigo_legado) {
        const subs = await db.subtareas_pasos
          .where('id_padre_vinculado')
          .equals(tareaExistente.codigo_legado)
          .toArray();
        for (const s of subs) {
          await db.subtareas_pasos.delete(s.id);
        }
      }
      await db.tareas.delete(tareaId);
      if (onGuardado) onGuardado();
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      id="modal-tarea-flow"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[10000] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all"
    >
      <div
        id="modal-tarea-flow-card"
        className="portal-surface elevation-3 w-full max-w-2xl max-h-[90vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0D1526] shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
      >
        {/* DRAG HANDLE MÓVIL */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* 1. CABECERA INTEGRADA */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
          {/* Fila 1: ID, Contexto WBS Unificado en 1 Sola Línea con Ticker Marquee, y botón cerrar */}
          <div className="flex items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
              {/* ID de Tarea */}
              <span
                id="task-flow-badge-id"
                className="text-[11px] font-mono tabular-nums font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200 border border-slate-700/60 shadow-2xs shrink-0 select-none"
              >
                {codigoLegado || (tareaId ? (tareaId.startsWith('TAR-') ? tareaId : 'CARGANDO...') : 'NUEVA TAREA')}
              </span>

              {/* 1. Badge de Estatus: Chip estático compacto con micro-punto semántico */}
              <span
                id="task-flow-estado-badge"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold rounded-lg border border-slate-800/80 bg-slate-900/60 text-slate-300 select-none shrink-0"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    estado === '01_Backlog'
                      ? 'bg-slate-400'
                      : estado === '02_Por_Hacer'
                      ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]'
                      : estado === '03_En_Proceso'
                      ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                      : estado === '04_Completado'
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                      : 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.6)]'
                  }`}
                />
                <span>
                  {estado === '01_Backlog' && 'Backlog'}
                  {estado === '02_Por_Hacer' && 'Por Hacer'}
                  {estado === '03_En_Proceso' && 'En Proceso'}
                  {estado === '04_Completado' && 'Completado'}
                  {estado === '05_Archivado' && 'Archivado'}
                  {!['01_Backlog', '02_Por_Hacer', '03_En_Proceso', '04_Completado', '05_Archivado'].includes(estado) && estado}
                </span>
              </span>

              <span className="text-slate-600 select-none shrink-0">|</span>

              {/* 2. Píldora de Proyecto con Ticker Marquee en Hover */}
              {(() => {
                const p = proyectos.find((item) => item.codigo_legado === proyectoCodigo || item.id === proyectoCodigo);
                const pNombre = p ? `${p.codigo_legado} · ${p.nombre_proyecto}` : (proyectoCodigo || 'Sin Proyecto');
                return (
                  <div
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 px-2.5 py-0.5 text-xs text-slate-300 select-none max-w-[190px] sm:max-w-[220px] overflow-hidden whitespace-nowrap group/ticker shrink-0 cursor-default"
                    title={pNombre}
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <div className="overflow-hidden relative max-w-full">
                      <span className="inline-block transition-transform duration-300 ease-out group-hover/ticker:animate-marquee">
                        {pNombre}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <span className="text-slate-600 select-none shrink-0">›</span>

              {/* 3. Píldora de Paquete WBS con Ticker Marquee en Hover */}
              {(() => {
                const h = hitos.find((item) => item.codigo_legado === hitoCodigo || item.id === hitoCodigo);
                const hNombre = h ? `${h.codigo_legado} · ${h.nombre_elemento}` : (hitoCodigo || 'Sin Paquete WBS');
                return (
                  <div
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 px-2.5 py-0.5 text-xs text-slate-300 select-none max-w-[160px] sm:max-w-[200px] overflow-hidden whitespace-nowrap group/ticker shrink-0 cursor-default"
                    title={hNombre}
                  >
                    <Milestone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <div className="overflow-hidden relative max-w-full">
                      <span className="inline-block transition-transform duration-300 ease-out group-hover/ticker:animate-marquee">
                        {hNombre}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <span className="text-slate-600 select-none shrink-0">›</span>

              {/* 4. Píldora de Predecesora */}
              {(() => {
                const t = todasLasTareas.find((item) => item.codigo_legado === idDependencia || item.id === idDependencia);
                const depTexto = t ? `${t.codigo_legado} · ${t.nombre_tarea_actividad}` : (idDependencia || 'Sin dependencias');
                return (
                  <div
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 px-2.5 py-0.5 text-xs text-slate-300 select-none max-w-[140px] sm:max-w-[180px] overflow-hidden whitespace-nowrap shrink-0 cursor-default"
                    title={depTexto}
                  >
                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{t ? t.codigo_legado : depTexto}</span>
                  </div>
                );
              })()}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 ml-1"
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
              className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-500 bg-transparent outline-none w-full border-b border-transparent focus:border-indigo-500 transition-colors py-0.5"
              autoFocus
            />
          </div>
        </div>

        {/* 2. CUERPO DE CONTENIDO CON SCROLL */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-4 custom-scrollbar">
          {tareaId !== null && tareaExistente === undefined ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3 min-h-[300px]">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-medium font-mono">Cargando detalles de la tarea...</span>
            </div>
          ) : (
            <>
              {/* BENTO GRID DE 2 TARJETAS */}
              <div className="bg-[#040711] border border-slate-800/80 rounded-xl p-3 sm:p-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* CARD 1: TIEMPO & ESFUERZO */}
                  <div className="bg-[#0D1526] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Tiempo & Esfuerzo</span>
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Fecha Programada</label>
                          <input
                            type="date"
                            value={fechaProgramada}
                            onChange={(e) => setFechaProgramada(e.target.value)}
                            className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono outline-none text-slate-200 focus:border-sky-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Hora Inicio</label>
                          <input
                            type="time"
                            value={horaInicio}
                            onChange={(e) => setHoraInicio(e.target.value)}
                            className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono outline-none text-slate-200 focus:border-sky-500/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Horas Est. (H:MM)</label>
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
                            className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono tabular-nums text-center outline-none text-slate-200 focus:border-sky-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Horas Reales (H:MM)</label>
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
                            className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono tabular-nums text-center outline-none text-slate-200 focus:border-sky-500/50"
                          />
                        </div>
                      </div>

                      <div className="pt-1.5 flex items-center justify-between text-[11px] border-t border-slate-800/60">
                        <span className="text-slate-400">Agendar en Calendar</span>
                        <button
                          type="button"
                          onClick={() => setAgendadoCalendar(agendadoCalendar === 'Sí' ? 'No' : 'Sí')}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                            agendadoCalendar === 'Sí'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-[#040711] border border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {agendadoCalendar === 'Sí' && <Check className="w-3 h-3" />}
                          <span>{agendadoCalendar === 'Sí' ? 'Sí' : 'No'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: OPERATIVO & MATRIZ */}
                  <div className="bg-[#0D1526] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Operativo & Matriz</span>
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Micro-riel Prioridad Eisenhower */}
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Prioridad Eisenhower</label>
                        <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#040711] border border-slate-800 rounded-lg">
                          {[
                            { id: '01_P1_Alta', label: 'P1', icon: Flame, title: 'Prioridad P1: Urgente / Importante', activeClass: 'bg-rose-500/20 border-rose-500/40 text-rose-300' },
                            { id: '02_P2_Media', label: 'P2', icon: AlertCircle, title: 'Prioridad P2: Media / Estratégico', activeClass: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
                            { id: '03_P3_Baja', label: 'P3', icon: ArrowDown, title: 'Prioridad P3: Baja / Delegable', activeClass: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
                            { id: '04_P4', label: 'P4', icon: Minus, title: 'Prioridad P4: Descarte', activeClass: 'bg-slate-500/20 border-slate-500/40 text-slate-300' },
                          ].map((p) => {
                            const IconComp = p.icon;
                            const isSelected = prioridad === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                title={p.title}
                                onClick={() => setPrioridad(p.id)}
                                className={`flex items-center justify-center gap-1 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer border ${
                                  isSelected
                                    ? p.activeClass
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                }`}
                              >
                                <IconComp className="w-3.5 h-3.5 shrink-0" />
                                <span>{p.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Micro-riel Nivel de Energía */}
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Nivel de Energía</label>
                        <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#040711] border border-slate-800 rounded-lg">
                          {[
                            { id: 'Alta_DeepWork', label: 'DeepWork', icon: Zap, title: 'Energía Alta: Deep Work', activeClass: 'bg-sky-500/20 border-sky-500/40 text-sky-300' },
                            { id: 'Media_Operativa', label: 'Operativa', icon: Cpu, title: 'Energía Media: Operativa', activeClass: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' },
                            { id: 'Baja_Automatica', label: 'Mecánica', icon: Coffee, title: 'Energía Baja: Mecánica', activeClass: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
                          ].map((e) => {
                            const IconComp = e.icon;
                            const isSelected = nivelEnergia === e.id;
                            return (
                              <button
                                key={e.id}
                                type="button"
                                title={e.title}
                                onClick={() => setNivelEnergia(e.id)}
                                className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-all cursor-pointer border ${
                                  isSelected
                                    ? e.activeClass
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                }`}
                              >
                                <IconComp className="w-3.5 h-3.5 shrink-0" />
                                <span>{e.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Responsable & MAV */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 items-center">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Responsable</label>
                          <input
                            type="text"
                            value={responsable}
                            onChange={(e) => setResponsable(e.target.value)}
                            placeholder="Ej. Christopher"
                            className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs outline-none text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50"
                          />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Mínimo Avance Viable</span>
                          <button
                            type="button"
                            onClick={() => setEsMav(!esMav)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 border ${
                              esMav
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-[#040711] border-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <Zap className={`w-3 h-3 ${esMav ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                            <span>{esMav ? 'MAV Activo' : 'Inactivo'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACORDEÓN DE FILA COMPLETA: GASTO ASOCIADO & COSTOS */}
              <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-[#0D1526]/80 transition-all duration-150">
                <button
                  type="button"
                  onClick={() => setMostrarGasto(!mostrarGasto)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30 transition-all duration-150 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Gasto Asociado & Costos</span>
                    {modoGasto === 'VINCULAR' && gastoVinculadoCodigo ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-emerald-400" />
                        <span>{gastoVinculadoCodigo} • S/ {Number(gastoMonto || costoRealPen || 0).toFixed(2)}</span>
                      </span>
                    ) : parseFloat(gastoMonto) > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                        {gastoMoneda === 'PEN' ? 'S/' : gastoMoneda === 'USD' ? '$' : '€'} {Number(gastoMonto).toFixed(2)} • {gastoCategoria.replace(/_/g, ' ')}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {!mostrarGasto && (!gastoMonto || parseFloat(gastoMonto) === 0) && !gastoVinculadoCodigo && (
                      <span className="text-[11px] text-slate-400 font-normal">Sin gastos vinculados</span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-400 transition-transform duration-200 ${
                        mostrarGasto ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {mostrarGasto && (
                  <div className="p-3.5 border-t border-emerald-500/20 bg-[#0D1526] space-y-3">
                    {/* Selector de Pestaña Superior: Modo Dual */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Modo de Imputación
                      </span>
                      <div className="inline-flex p-0.5 bg-[#040711] rounded-lg border border-slate-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setModoGasto('NUEVO')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            modoGasto === 'NUEVO'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Nuevo Gasto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoGasto('VINCULAR')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            modoGasto === 'VINCULAR'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Link2 className="w-3 h-3" />
                          <span>Vincular Existente</span>
                        </button>
                      </div>
                    </div>

                    {modoGasto === 'NUEVO' ? (
                      /* Modo REGISTRAR NUEVO GASTO */
                      <div className="space-y-3">
                        {/* Moneda y Monto Incurrido */}
                        <div className="grid grid-cols-12 gap-3 items-end">
                          {/* Selector Moneda */}
                          <div className="col-span-12 sm:col-span-4">
                            <label className="text-[10px] text-slate-400 block mb-1">Moneda de Registro</label>
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
                                  className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                                    gastoMoneda === m ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Input Monto Limpio Sin Spinners */}
                          <div className="col-span-12 sm:col-span-8">
                            <label className="text-[10px] text-slate-400 block mb-1">Monto Incurrido</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-mono font-bold text-emerald-400 select-none">
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
                                className="w-full pl-9 pr-3 py-1.5 border border-slate-800 rounded-lg bg-[#040711] font-mono font-bold text-lg text-emerald-300 outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Selector de Categoría y Glosa */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Categoría Contable</label>
                            <select
                              value={gastoCategoria}
                              onChange={(e) => setGastoCategoria(e.target.value)}
                              className="w-full bg-[#040711] px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 cursor-pointer"
                            >
                              <option value="Operativo_Proyecto">Operativo del Proyecto</option>
                              <option value="Equipamiento_Herramientas">Equipamiento & Herramientas</option>
                              <option value="Servicios_Honorarios">Servicios & Honorarios</option>
                              <option value="Suscripciones_Software">Suscripciones & Software</option>
                              <option value="Materiales_Insumos">Materiales & Insumos</option>
                              <option value="Otros">Otros</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Concepto / Glosa Detallada</label>
                            <input
                              type="text"
                              value={gastoConcepto}
                              onChange={(e) => setGastoConcepto(e.target.value)}
                              placeholder="Ej. Servidor cloud, licencia, insumos..."
                              className="w-full bg-[#040711] px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-500"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Modo VINCULAR EGRESO EXISTENTE */
                      <div className="space-y-2.5">
                        {/* Buscador Rápido */}
                        <div className="relative">
                          <input
                            type="text"
                            value={gastoSearch}
                            onChange={(e) => setGastoSearch(e.target.value)}
                            placeholder="Buscar egreso por código (GAS-XXX), descripción o monto..."
                            className="w-full pl-8 pr-3 py-1.5 border border-slate-800 rounded-lg bg-[#040711] text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50"
                          />
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>

                        {/* Lista Bento de Gastos Disponibles */}
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
                                  className={`p-2.5 rounded-xl flex items-center justify-between text-xs cursor-pointer border transition-all ${
                                    isSelected
                                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-xs'
                                      : 'bg-[#040711] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-[10px] text-sky-400 bg-sky-950/50 px-1.5 py-0.2 rounded border border-sky-800/40 shrink-0">
                                          {g.codigo_legado}
                                        </span>
                                        <span className="font-medium text-slate-200 truncate">
                                          {g.descripcion_gasto || 'Sin descripción'}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                        {g.fecha_gasto || 'Sin fecha'} • {(g.categoria_gasto || 'General').replace(/_/g, ' ')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 ml-2">
                                    <span className="font-mono font-bold text-xs text-emerald-300">
                                      S/ {montoMostrar}
                                    </span>
                                    {g.moneda_original && g.moneda_original !== 'PEN' && (
                                      <p className="text-[10px] font-mono text-slate-400">
                                        {g.moneda_original} {Number(g.monto_original).toFixed(2)}
                                      </p>
                                    )}
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

          {/* 3. DESCRIPCIÓN Y NOTAS DE IMPEDIMENTOS */}
          <div className="space-y-1.5">
            <label className="block font-bold text-xs text-slate-400">
              Descripción y Especificaciones Técnicas
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Especificaciones técnicas, entregables, o impedimentos..."
              className="w-full bg-[#0D1526] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50 transition resize-y custom-scrollbar"
            />
          </div>

          {/* 4. BLOQUE PROCEDURAL DE SUBTAREAS / PASOS */}
          <div className="p-3.5 bg-[#0D1526] border border-slate-800/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-black">
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
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progresoPct}%` }}
              />
            </div>

            {/* Lista de pasos */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
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
                          <div className="p-0.5 text-slate-500 shrink-0" title="Completa primero el paso anterior">
                            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            checked={sub.completado}
                            onChange={() => toggleSubtareaCompletado(sub, idx)}
                            className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                          />
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
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
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
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                title="Agregar paso"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 5. SECCIÓN DINÁMICA DE NOTAS VINCULADAS (Fase 4.43) */}
          <SeccionNotasVinculadasModal
            codigoEntidad={tareaExistente?.codigo_legado || tareaId || ''}
            tipoEntidad="TAREA"
            tituloEntidad={nombre || tareaExistente?.nombre_tarea_actividad || 'Tarea'}
          />
            </>
          )}
        </div>

        {/* 4. PIE DE DIÁLOGO / FOOTER */}
        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-800 bg-[#0D1526] flex items-center justify-between gap-3">
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
              onClick={handleGuardar}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition cursor-pointer"
            >
              {tareaId ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
