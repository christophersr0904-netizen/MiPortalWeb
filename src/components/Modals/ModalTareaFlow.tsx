import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  X,
  Calendar,
  Zap,
  CheckCircle2,
  Folder,
  Milestone,
  Plus,
  Trash2,
  Archive,
  DollarSign,
  Share2,
  Check
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { TareaRecord, SubtareaPaso } from '../../types';
import { getProp } from '../../utils/entityNormalizer';
import { SeccionNotasVinculadasModal } from '../Notas/SeccionNotasVinculadasModal';

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
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [agendadoCalendar, setAgendadoCalendar] = useState<'Sí' | 'No'>('No');
  const [esMav, setEsMav] = useState(false);
  const [costoRealPen, setCostoRealPen] = useState(0);
  const [responsable, setResponsable] = useState('');
  const [notas, setNotas] = useState('');

  // Subtareas en memoria (para modo creación o staging)
  const [subtareasLocal, setSubtareasLocal] = useState<Array<{ id: string; descripcion_paso: string; completado: boolean }>>([]);
  const [nuevoPasoTexto, setNuevoPasoTexto] = useState('');

  // Dropdowns UI
  const [dropdownEstadoAbierto, setDropdownEstadoAbierto] = useState(false);

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
      setHorasEstimadas(tareaExistente.horas_estimadas ?? 1);
      setHorasReales(tareaExistente.horas_reales ?? 0);
      setFechaProgramada(tareaExistente.fecha_programada ? tareaExistente.fecha_programada.split('T')[0] : '');
      setHoraInicio(getProp(tareaExistente, 'hora_inicio', 'Hora_Inicio') || '09:00');
      setAgendadoCalendar(tareaExistente.agendado_calendar === 'Sí' ? 'Sí' : 'No');
      setEsMav(Boolean(tareaExistente.es_mav));
      setCostoRealPen(tareaExistente.costo_real_pen ?? 0);
      setResponsable(tareaExistente.responsable_ejecutor || '');
      setNotas(tareaExistente.notas_impedimentos || '');
      setSubtareasLocal([]);
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
      setFechaProgramada(now.toISOString().split('T')[0]);
      setHoraInicio('09:00');
      setAgendadoCalendar('No');
      setEsMav(false);
      setCostoRealPen(0);
      setResponsable('');
      setNotas(initialNotas || '');
      setSubtareasLocal([]);
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

  // Hitos filtrados por proyecto seleccionado
  const hitosDelProyecto = hitos.filter((h) => {
    if (!proyectoCodigo) return true;
    const pCode = getProp(h, 'proyecto_codigo', 'proyecto_id', 'Proyecto_ID', 'ID_Proyecto');
    return pCode === proyectoCodigo || (proyectos.find(p => p.id === pCode)?.codigo_legado === proyectoCodigo);
  });

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

  const toggleSubtareaCompletado = async (sub: any) => {
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

    if (tareaId && tareaExistente) {
      // Actualizar tarea existente
      await db.tareas.update(tareaId, {
        nombre_tarea_actividad: nombre.trim(),
        estado_tarea: estado,
        proyecto_codigo: proyectoCodigo,
        hito_codigo: hitoCodigo || undefined,
        id_dependencia: idDependencia || undefined,
        prioridad_eisenhower: prioridad,
        nivel_energia_requerido: nivelEnergia,
        horas_estimadas: Number(horasEstimadas) || 1,
        horas_reales: Number(horasReales) || 0,
        fecha_programada: fechaProgramada || undefined,
        agendado_calendar: agendadoCalendar,
        es_mav: esMav,
        costo_real_pen: Number(costoRealPen) || 0,
        responsable_ejecutor: responsable || undefined,
        notas_impedimentos: notas || undefined,
        updated_at: nowIso
      });
    } else {
      // Crear nueva tarea
      const totalTareas = await db.tareas.count();
      const nuevoCodigoTar = `TAR-${String(totalTareas + 1).padStart(3, '0')}`;
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
        horas_estimadas: Number(horasEstimadas) || 1,
        horas_reales: Number(horasReales) || 0,
        fecha_programada: fechaProgramada || undefined,
        agendado_calendar: agendadoCalendar,
        es_mav: esMav,
        costo_real_pen: Number(costoRealPen) || 0,
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
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 shrink-0 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/40">
          {/* Fila 1: ID, selector de estado y botón cerrar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                id="task-flow-badge-id"
                className="text-[11px] font-mono tabular-nums font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200 border border-slate-700/60 shadow-2xs shrink-0"
              >
                {codigoLegado || (tareaId ? (tareaId.startsWith('TAR-') ? tareaId : 'CARGANDO...') : 'NUEVA TAREA')}
              </span>

              {/* Selector de Estado Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  id="task-flow-estado-btn"
                  onClick={() => setDropdownEstadoAbierto(!dropdownEstadoAbierto)}
                  className="filter-ghost-btn inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 transition shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {estado === '01_Backlog' && '01. Backlog'}
                    {estado === '02_Por_Hacer' && '02. Por Hacer'}
                    {estado === '03_En_Proceso' && '03. En Proceso'}
                    {estado === '04_Completado' && '04. Completado'}
                    {estado === '05_Archivado' && '05. Archivado'}
                  </span>
                </button>

                {dropdownEstadoAbierto && (
                  <div className="absolute left-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 space-y-1 text-xs">
                    {[
                      { id: '01_Backlog', label: '01. Backlog', color: 'text-slate-400' },
                      { id: '02_Por_Hacer', label: '02. Por Hacer', color: 'text-blue-400' },
                      { id: '03_En_Proceso', label: '03. En Proceso', color: 'text-amber-400' },
                      { id: '04_Completado', label: '04. Completado', color: 'text-emerald-400' },
                      { id: '05_Archivado', label: '05. Archivado', color: 'text-purple-400' }
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setEstado(st.id);
                          setDropdownEstadoAbierto(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer ${
                          estado === st.id ? `${st.color} font-bold bg-slate-100 dark:bg-slate-800/80` : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fila 2: Contexto WBS Canónico (Selectores de Proyecto e Hito) */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Selector de Proyecto */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
              <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={proyectoCodigo}
                onChange={(e) => {
                  setProyectoCodigo(e.target.value);
                  setHitoCodigo('');
                }}
                className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-semibold outline-none cursor-pointer max-w-[160px] truncate"
              >
                {proyectos.map((p) => (
                  <option key={p.id} value={p.codigo_legado} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {p.codigo_legado} · {p.nombre_proyecto}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-400 select-none">›</span>

            {/* Selector de Hito */}
            <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-2 py-1 rounded-lg">
              <Milestone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <select
                value={hitoCodigo}
                onChange={(e) => setHitoCodigo(e.target.value)}
                className="bg-transparent text-purple-700 dark:text-purple-300 text-xs font-semibold outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  Sin Paquete / Hito
                </option>
                {hitosDelProyecto.map((h) => (
                  <option key={h.id} value={h.codigo_legado} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {h.codigo_legado} · {h.nombre_elemento}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-400 select-none">›</span>

            {/* Selector de Predecesora */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
              <Share2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={idDependencia}
                onChange={(e) => setIdDependencia(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-300 text-xs font-semibold outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  Sin Predecesora
                </option>
                {todasLasTareas
                  .filter((t) => t.codigo_legado !== codigoLegado)
                  .map((t) => (
                    <option key={t.id} value={t.codigo_legado} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {t.codigo_legado} · {t.nombre_tarea_actividad}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Fila 3: Título Editable Prominente */}
          <div className="pt-1">
            <input
              type="text"
              id="task-flow-titulo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Título de la tarea o entregable..."
              className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-transparent outline-none w-full border-b border-transparent focus:border-indigo-500 transition-colors py-0.5"
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
              {/* BENTO GRID DE 3 TARJETAS */}
              <div className="bg-slate-100/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* CARD 1: TIEMPO & ESFUERZO */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tiempo & Esfuerzo</span>
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Fecha Programada</label>
                      <input
                        type="date"
                        value={fechaProgramada}
                        onChange={(e) => setFechaProgramada(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Hora Inicio</label>
                      <input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Horas Est.</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={horasEstimadas}
                        onChange={(e) => setHorasEstimadas(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Horas Reales</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={horasReales}
                        onChange={(e) => setHorasReales(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Agendar en Calendar</span>
                    <button
                      type="button"
                      onClick={() => setAgendadoCalendar(agendadoCalendar === 'Sí' ? 'No' : 'Sí')}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        agendadoCalendar === 'Sí'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {agendadoCalendar === 'Sí' && <Check className="w-3 h-3" />}
                      <span>{agendadoCalendar === 'Sí' ? 'Sí' : 'No'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 2: OPERATIVO & MATRIZ */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Operativo & Matriz</span>
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Prioridad Eisenhower</label>
                    <select
                      value={prioridad}
                      onChange={(e) => setPrioridad(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="01_P1_Alta">P1 - Alta / Urgente</option>
                      <option value="02_P2_Media">P2 - Media / Estratégico</option>
                      <option value="03_P3_Baja">P3 - Baja / Delegable</option>
                      <option value="04_P4">P4 - Descarte</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Nivel de Energía</label>
                    <select
                      value={nivelEnergia}
                      onChange={(e) => setNivelEnergia(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="Alta_DeepWork">DeepWork (Foco Total)</option>
                      <option value="Media_Operativa">Operativa (Gestión)</option>
                      <option value="Baja_Automatica">Automática (Mecánica)</option>
                    </select>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Mínimo Avance Viable (MAV)</span>
                    <button
                      type="button"
                      onClick={() => setEsMav(!esMav)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        esMav
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {esMav && <Zap className="w-3 h-3" />}
                      <span>{esMav ? 'MAV Activo' : 'Inactivo'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 3: FINANCIERO & ENTORNO */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Financiero & Entorno</span>
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Costo Real (PEN)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={costoRealPen}
                      onChange={(e) => setCostoRealPen(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono outline-none text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Responsable Ejecutor</label>
                    <input
                      type="text"
                      value={responsable}
                      onChange={(e) => setResponsable(e.target.value)}
                      placeholder="Ej. Christopher"
                      className="w-full bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs outline-none text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. DESCRIPCIÓN Y NOTAS DE IMPEDIMENTOS */}
          <div className="space-y-1.5">
            <label className="block font-bold text-xs text-slate-500 dark:text-slate-400">
              Descripción y Especificaciones Técnicas
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Especificaciones técnicas, entregables, o impedimentos..."
              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition resize-y custom-scrollbar"
            />
          </div>

          {/* 4. BLOQUE PROCEDURAL DE SUBTAREAS / PASOS */}
          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-xs font-black">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Pasos / Subtareas</h4>
                  <p className="text-[10px] text-slate-400">Procedimiento guiado secuencial (Definition of Done)</p>
                </div>
              </div>

              <div
                id="task-flow-pasos-progreso-badge"
                className="font-mono tabular-nums text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
              >
                {completadasSubtareas}/{totalSubtareas} pasos ({progresoPct}%)
              </div>
            </div>

            {/* Barra de progreso con gradiente */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
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
                listaSubtareasActiva.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={sub.completado}
                        onChange={() => toggleSubtareaCompletado(sub)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">#{idx + 1}</span>
                      <span
                        className={`truncate ${
                          sub.completado ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {sub.descripcion_paso}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarSubtarea(sub.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      title="Eliminar paso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Input para nuevo paso */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={nuevoPasoTexto}
                onChange={(e) => setNuevoPasoTexto(e.target.value)}
                placeholder="Escribe el siguiente paso procedural y pulsa Enter..."
                className="flex-1 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500"
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
        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between gap-3">
          {/* Izquierda: Eliminar / Archivar */}
          <div className="flex items-center gap-2">
            {tareaId && (
              <>
                <button
                  type="button"
                  onClick={handleEliminar}
                  className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Eliminar tarea permanentemente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>

                <button
                  type="button"
                  onClick={handleArchivar}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
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
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
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
