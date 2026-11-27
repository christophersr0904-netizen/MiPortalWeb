import React, { memo } from 'react';
import { resolverDependenciasTarea, type CanonicalTarea } from '../../utils/entityNormalizer';
import { formatearFechaDdMmYyyy, formatearFechaDdMm, formatFechaIsoLocal } from '../../utils/timeFormatters';
import type { SubtareaPaso } from '../../types';
import { BadgeNotasVinculadas } from '../Notas/BadgeNotasVinculadas';
import { abrirGoogleCalendarActividad } from '../../services/calendarSyncService';
import {
  Zap,
  CornerDownRight,
  AlertTriangle,
  Archive,
  Trash2,
  Lock,
  CheckSquare,
  Calendar,
  CalendarCheck2,
  Clock,
  RotateCcw,
  Check,
  HeartPulse,
  GraduationCap,
  Coffee,
  Activity,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export interface TarjetaTareaKanbanProps {
  tar: CanonicalTarea;
  colId: string;
  isDragged: boolean;
  isHovered: boolean;
  isPredecesora: boolean;
  isSucesora: boolean;
  atenuar: boolean;
  predecesorasOcultas: string[];
  sucesorasOcultas: string[];
  subsTarea: SubtareaPaso[];
  nombreProyecto: string;
  nombreHito: string;
  costoGasto: number;
  tareasLookupMap?: Map<string, { codigo: string; nombre: string }>;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onMouseEnter: (codigo: string) => void;
  onMouseLeave: () => void;
  onClick: (id: string, estado: string) => void;
  onMoverTareaAEstado: (tar: CanonicalTarea, nuevoEstado: string) => void;
  onArchivarTarea: (tar: CanonicalTarea) => void;
  onEliminarTarea: (id: string, nombre: string) => void;
}

const TarjetaTareaKanbanComponent: React.FC<TarjetaTareaKanbanProps> = ({
  tar,
  colId,
  isDragged,
  isHovered,
  isPredecesora,
  isSucesora,
  atenuar,
  predecesorasOcultas,
  sucesorasOcultas,
  subsTarea,
  nombreProyecto,
  nombreHito,
  costoGasto,
  tareasLookupMap,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onMoverTareaAEstado,
  onArchivarTarea,
  onEliminarTarea
}) => {
  // Subtareas y porcentaje de avance
  const totalSubs = subsTarea.length;
  const completadasSubs = subsTarea.filter((s) => s.completado).length;
  const pctSubs = totalSubs > 0 ? Math.round((completadasSubs / totalSubs) * 100) : 0;

  // Borde lateral izquierdo continuo con presencia visual por prioridad (REQ-UX-KANBAN-02B)
  let bordePrioridad = 'border-l-slate-400/80';
  const prioStr = String(tar.prioridad || tar.raw?.Prioridad_Eisenhower || '').toLowerCase();
  if (prioStr.includes('01') || prioStr.includes('p1') || prioStr.includes('alta') || prioStr.includes('urgente')) {
    bordePrioridad = 'border-l-rose-400';
  } else if (prioStr.includes('02') || prioStr.includes('p2') || prioStr.includes('media')) {
    bordePrioridad = 'border-l-amber-300';
  } else if (prioStr.includes('03') || prioStr.includes('p3') || prioStr.includes('baja')) {
    bordePrioridad = 'border-l-sky-400';
  } else if (prioStr.includes('04') || prioStr.includes('p4')) {
    bordePrioridad = 'border-l-slate-400/80';
  }

  // Vencimiento y fecha/hora programada
  const hoyIso = formatFechaIsoLocal(new Date());
  const fechaSoloIso = tar.fecha_programada ? tar.fecha_programada.split('T')[0] : '';
  const estaVencida = Boolean(
    fechaSoloIso &&
    fechaSoloIso < hoyIso &&
    tar.estado !== '04_Completado'
  );
  const esHoy = Boolean(
    fechaSoloIso &&
    fechaSoloIso === hoyIso &&
    tar.estado !== '04_Completado'
  );
  const horaInicioStr =
    typeof tar.raw?.hora_inicio === 'string' && tar.raw.hora_inicio.trim()
      ? tar.raw.hora_inicio.trim()
      : '';

  const formatFechaCorta = (fechaIso?: string) => {
    return formatearFechaDdMm(fechaIso, 'S/F');
  };

  const rawDep = tar.id_dependencia || tar.raw?.id_dependencia || tar.raw?.ID_Dependencia || tar.raw?.dependencia_tarea_id;
  const dependenciasResueltas = resolverDependenciasTarea(rawDep, tareasLookupMap);
  const costoTotalPen = costoGasto > 0 ? costoGasto : (tar.costo_real || Number(tar.raw?.costo_real_pen || tar.raw?.Costo_Real_PEN || 0));

  const renderIconoEnergia = () => {
    const eStr = String(tar.nivel_energia || '').toLowerCase();
    const tipoRaw = String(tar.raw?.Tipo_Tarea || tar.raw?.tipo_tarea || tar.raw?.tipo || '').toLowerCase();
    const esHabito = tar.codigo_legado.startsWith('ACT-') || tipoRaw.includes('habito') || tipoRaw.includes('rutina') || tipoRaw.includes('personal');
    const esEstudio = tipoRaw.includes('aprendizaje') || tipoRaw.includes('estudio') || /pmp|curso|tesis|cert/i.test(tar.nombre);

    if (esHabito) {
      return (
        <span title="Tipo: Personal / Hábito" className="inline-flex items-center text-pink-300 shrink-0">
          <HeartPulse className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
        </span>
      );
    }
    if (esEstudio) {
      return (
        <span title="Tipo: Aprendizaje / Estudio" className="inline-flex items-center text-indigo-300 shrink-0">
          <GraduationCap className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
        </span>
      );
    }
    if (eStr.includes('alta') || eStr.includes('deepwork') || eStr.includes('creativa') || eStr.includes('estrategica')) {
      return (
        <span title="Energía: Alta Cognitiva DeepWork" className="inline-flex items-center text-amber-300 shrink-0">
          <Zap className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
        </span>
      );
    }
    if (eStr.includes('baja') || eStr.includes('automatica') || eStr.includes('mecanica') || eStr.includes('admin')) {
      return (
        <span title="Energía: Baja Mecánica" className="inline-flex items-center text-teal-400 shrink-0">
          <Coffee className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
        </span>
      );
    }
    return (
      <span title="Energía: Media Operativa" className="inline-flex items-center text-sky-400 shrink-0">
        <Activity className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
      </span>
    );
  };

  return (
    <div
      id={`kanban-card-${tar.codigo_legado}`}
      data-id-tarea={tar.codigo_legado}
      data-task-id={tar.id}
      draggable={typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches}
      onDragStart={(e) => onDragStart(e, tar.id)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => onMouseEnter(tar.codigo_legado)}
      onMouseLeave={onMouseLeave}
      onClick={() => onClick(tar.id, tar.estado)}
      className={`kanban-card shrink-0 group relative bg-[#151F32]/95 hover:bg-[#1A263D] border border-white/[0.09] hover:border-sky-400/30 border-l-[3.5px] ${bordePrioridad} rounded-xl p-3.5 space-y-2.5 shadow-sm hover:shadow-md transition-all duration-150 ease-out hover:-translate-y-[1px] active:scale-[0.992] transform-gpu cursor-grab active:cursor-grabbing select-none text-xs overflow-hidden touch-pan-y [touch-action:pan-y] ${
        isDragged
          ? 'opacity-40 scale-[0.98] border-sky-400/40 cursor-grabbing'
          : ''
      } ${
        atenuar ? 'kanban-card-atenuada opacity-55' : ''
      } ${
        isPredecesora ? 'kanban-card-predecesora' : ''
      } ${
        isSucesora ? 'kanban-card-sucesora' : ''
      }`}
    >
      {/* Badges de relación para dependencias al hacer hover */}
      {isPredecesora && (
        <div className="kanban-etiqueta-relacion flex items-center justify-between text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/12 text-amber-300 border border-amber-400/30 pointer-events-none">
          <span className="inline-flex items-center gap-1">
            <Zap className="w-3 h-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>Predecesora</span>
          </span>
          <span className="text-[9px] opacity-90 uppercase tracking-wider font-mono tabular-nums">{tar.codigo_legado}</span>
        </div>
      )}
      {isSucesora && (
        <div className="kanban-etiqueta-relacion flex items-center justify-between text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/12 text-emerald-300 border border-emerald-400/30 pointer-events-none">
          <span className="inline-flex items-center gap-1">
            <CornerDownRight className="w-3 h-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>Sucesora</span>
          </span>
          <span className="text-[9px] opacity-90 uppercase tracking-wider font-mono tabular-nums">{tar.codigo_legado}</span>
        </div>
      )}

      {/* Alerta discreta para Predecesoras o Sucesoras Ocultas por Filtro */}
      {isHovered && (predecesorasOcultas.length > 0 || sucesorasOcultas.length > 0) && (
        <div className="whitespace-normal bg-slate-950/90 text-slate-300 text-[10px] px-2 py-1 rounded-md border border-white/[0.08] pointer-events-none flex flex-col gap-0.5">
          {predecesorasOcultas.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>Predecesora [{predecesorasOcultas.join(', ')}] oculta por filtros</span>
            </span>
          )}
          {sucesorasOcultas.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <span>Sucesora [{sucesorasOcultas.join(', ')}] oculta por filtros</span>
            </span>
          )}
        </div>
      )}

      {/* NIVEL 1 — Cabecera Meta + Botones Archivar/Eliminar Siempre Visibles */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <div
          className="flex items-center gap-1.5 min-w-0 flex-1"
          title={`${tar.codigo_legado} · ${nombreProyecto} · ${nombreHito}`}
        >
          <span className="font-mono tabular-nums font-medium text-slate-400 shrink-0">
            {tar.codigo_legado}
          </span>
          <span className="text-slate-600 shrink-0">·</span>
          <span className="truncate text-slate-400">
            {nombreProyecto} · {nombreHito}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {renderIconoEnergia()}

          <BadgeNotasVinculadas
            codigo={tar.codigo_legado}
            tipo="TAREA"
            tituloEntidad={tar.nombre}
          />

          {/* Acciones táctiles en móvil y hover puro en escritorio (REQ-UX-KANBAN-02C / 04) */}
          <div className="flex items-center gap-0.5 shrink-0 opacity-80 md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:focus-within:opacity-100 md:focus-within:pointer-events-auto transition-opacity duration-150">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onArchivarTarea(tar);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-amber-300 hover:bg-white/[0.08] flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
              title="Archivar tarea"
              aria-label="Archivar tarea"
            >
              <Archive className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEliminarTarea(tar.id, tar.nombre);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-white/[0.08] flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
              title="Eliminar tarea"
              aria-label="Eliminar tarea"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* NIVEL 2 — Título Protagonista */}
      <h4
        className={`text-[13.5px] font-semibold leading-snug line-clamp-2 cursor-pointer transition-colors ${
          tar.estado === '04_Completado'
            ? 'line-through text-slate-400'
            : 'text-slate-100 group-hover:text-white'
        }`}
        title={tar.nombre}
      >
        {tar.nombre}
      </h4>

      {/* NIVEL 3 — Micro-Chips Armónicos de Metadatos */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.06]">
        {/* Chip Fecha / Hora programada */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-mono tabular-nums ${
            estaVencida
              ? 'bg-rose-500/10 border-rose-400/25 text-rose-300 font-medium'
              : esHoy
              ? 'bg-sky-500/10 border-sky-400/25 text-sky-300 font-medium'
              : 'bg-white/[0.045] border-white/[0.07] text-slate-300'
          }`}
          title={
            tar.fecha_programada
              ? `${estaVencida ? 'Vencida' : esHoy ? 'Hoy' : 'Programada'}: ${formatearFechaDdMmYyyy(tar.fecha_programada)}${horaInicioStr ? ` · ${horaInicioStr}` : ''}`
              : 'Sin fecha límite'
          }
        >
          <Calendar
            className={`w-3 h-3 shrink-0 ${
              estaVencida ? 'text-rose-300' : esHoy ? 'text-sky-300' : 'text-slate-400'
            }`}
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>
            {formatFechaCorta(tar.fecha_programada)}
            {horaInicioStr ? ` ${horaInicioStr}` : ''}
          </span>
        </span>

        {/* Chip de acceso directo a Google Calendar */}
        {(tar.raw?.agendado_calendar === 'Sí' || tar.raw?.id_evento_calendar) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const { estado: _st, ...rawSinEstado } = (tar.raw || {}) as Record<string, unknown>;
              abrirGoogleCalendarActividad({
                ...rawSinEstado,
                id: tar.id,
                codigo_legado: tar.codigo_legado,
                nombre_actividad: tar.nombre,
                fecha_programada: tar.fecha_programada,
                hora_inicio: horaInicioStr || '09:00',
                duracion_horas: tar.horas_estimadas || 1,
                categoria_vida: 'LABORAL_HONORARIO',
                tipo_compromiso: 'PUNTUAL'
              });
            }}
            className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/25 text-sky-300 transition-colors cursor-pointer"
            title="Agendado en Google Calendar (clic para abrir)"
            aria-label="Abrir en Google Calendar"
          >
            <CalendarCheck2 className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}

        {/* Chip Horas reales / estimadas */}
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.045] border border-white/[0.07] text-[11px] font-mono tabular-nums text-slate-300"
          title={`Tiempo real / estimado: ${tar.horas_reales ?? 0}h / ${tar.horas_estimadas ?? 0}h`}
        >
          <Clock className="w-3 h-3 text-sky-400/80 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{tar.horas_reales ?? 0}/{tar.horas_estimadas ?? 0}h</span>
        </span>

        {/* Chip Progreso de Subtareas + micro-barra */}
        {totalSubs > 0 && (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.045] border border-white/[0.07] text-[11px] font-mono tabular-nums text-slate-300"
            title={`Subtareas completadas: ${completadasSubs}/${totalSubs} (${pctSubs}%)`}
          >
            <CheckSquare
              className={`w-3 h-3 shrink-0 ${completadasSubs === totalSubs ? 'text-emerald-400' : 'text-slate-400'}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>{completadasSubs}/{totalSubs}</span>
            <span className="w-7 h-1 rounded-full bg-white/[0.10] overflow-hidden inline-block shrink-0">
              <span
                className="block h-full rounded-full bg-emerald-400 transition-[width] duration-300"
                style={{ width: `${pctSubs}%` }}
              />
            </span>
          </span>
        )}

        {/* Chips Dependencias / Bloqueos (Req) */}
        {dependenciasResueltas.map((dep) => (
          <span
            key={dep.codigo}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-400/25 text-[11px] font-mono tabular-nums text-amber-300 max-w-full"
            title={`Requiere: ${dep.codigo} · ${dep.nombre}`}
          >
            <Lock className="w-3 h-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">Req {dep.codigo}</span>
          </span>
        ))}

        {/* Chip Presupuesto / Costo S/ */}
        {costoTotalPen > 0 && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-400/20 text-[11px] font-mono tabular-nums text-emerald-300"
            title={`Costo / presupuesto vinculado: S/ ${costoTotalPen.toFixed(2)}`}
          >
            S/ {costoTotalPen.toFixed(2)}
          </span>
        )}
      </div>

      {/* Micro-Botonera Táctica de Estado (Preservada 100%, contraste armonioso) */}
      <div className="pt-2 border-t border-white/[0.06]" onClick={(e) => e.stopPropagation()}>
        {colId === '01_Backlog' && (
          <button
            type="button"
            onClick={() => onMoverTareaAEstado(tar, '02_Por_Hacer')}
            className="w-full h-8 md:h-7 px-2.5 rounded-lg bg-white/[0.04] hover:bg-sky-500/15 border border-white/[0.08] hover:border-sky-400/35 text-slate-200 hover:text-sky-200 font-sans text-xs md:text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition"
            title="Mover a Por Hacer"
          >
            <span>Por Hacer</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}

        {colId === '02_Por_Hacer' && (
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => onMoverTareaAEstado(tar, '01_Backlog')}
              className="w-8 h-8 md:w-7 md:h-7 shrink-0 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
              title="Retroceder a Backlog"
              aria-label="Retroceder a Backlog"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onMoverTareaAEstado(tar, '03_En_Proceso')}
              className="flex-1 h-8 md:h-7 px-2.5 rounded-lg bg-white/[0.04] hover:bg-amber-500/15 border border-white/[0.08] hover:border-amber-400/35 text-slate-200 hover:text-amber-200 font-sans text-xs md:text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition"
              title="Iniciar tarea (Mover a En Proceso)"
            >
              <span>Iniciar</span>
              <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        )}

        {colId === '03_En_Proceso' && (
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => onMoverTareaAEstado(tar, '02_Por_Hacer')}
              className="w-8 h-8 md:w-7 md:h-7 shrink-0 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
              title="Retroceder a Por Hacer"
              aria-label="Retroceder a Por Hacer"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onMoverTareaAEstado(tar, '04_Completado')}
              className="flex-1 h-8 md:h-7 px-2.5 rounded-lg bg-white/[0.04] hover:bg-emerald-500/15 border border-white/[0.08] hover:border-emerald-400/35 text-slate-200 hover:text-emerald-200 font-sans text-xs md:text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition"
              title="Finalizar tarea (Mover a Completado)"
            >
              <span>Completar</span>
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        )}

        {colId === '04_Completado' && (
          <button
            type="button"
            onClick={() => onMoverTareaAEstado(tar, '03_En_Proceso')}
            className="w-full h-8 md:h-7 px-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-amber-400/30 text-slate-300 hover:text-amber-300 font-sans text-xs md:text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition"
            title="Reabrir tarea a En Proceso"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>Reabrir</span>
          </button>
        )}
      </div>
    </div>
  );
};

export const TarjetaTareaKanban = memo(TarjetaTareaKanbanComponent);

