/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalTareaFlow.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-F1-P1.2a / REQ-REFACTOR-P1-03
 * DESCRIPCIÓN: Modal Bento interactivo de edición y creación de tareas del PMO.
 *              Lógica de estado y persistencia desacoplada en useTareaForm.ts.
 * ============================================================================
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  X,
  Calendar,
  Zap,
  CheckCircle2,
  FolderKanban,
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
  Hash
} from 'lucide-react';
import { SelectIconicoCobalt } from '../UI/SelectIconicoCobalt';
import { OPCIONES_CATEGORIA_GASTO_COBALT } from '../../constants/uiMappers';
import { SeccionNotasVinculadasModal } from '../Notas/SeccionNotasVinculadasModal';
import { SwitchCobalt } from '../UI/SwitchCobalt';
import { InputFechaCobalt } from '../UI/InputFechaCobalt';
import { InputHoraCobalt } from '../UI/InputHoraCobalt';
import {
  convertirStringToHorasDecimal,
  convertirHorasDecimalAString,
  formatearDuracionLegible
} from '../../utils/timeFormatters';
import {
  useTareaForm,
  type UseTareaFormProps,
  type ModalTareaFlowProps,
  OPCIONES_ESTADO
} from '../../hooks/useTareaForm';

export {
  convertirStringToHorasDecimal,
  convertirHorasDecimalAString,
  formatearDuracionLegible,
  type ModalTareaFlowProps,
  type UseTareaFormProps
};

export const ModalTareaFlow: React.FC<ModalTareaFlowProps> = (props) => {
  const { isOpen, onClose, tareaId } = props;
  useBodyScrollLock(isOpen);

  const {
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
    horasEstimadasStr,
    setHorasEstimadas,
    horasRealesStr,
    setHorasReales,
    setHorasEstimadasStr,
    setHorasRealesStr,
    fechaProgramada,
    setFechaProgramada,
    horaInicio,
    setHoraInicio,
    agendadoCalendar,
    setAgendadoCalendar,
    esMav,
    setEsMav,
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
  } = useTareaForm(props);

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
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/70 hover:border-sky-500/50 text-slate-200 text-[11px] font-mono tabular-nums font-bold tracking-wider transition-[transform,colors] duration-150 cursor-pointer active:scale-95 shrink-0 select-none shadow-2xs"
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-[transform,colors] duration-150 cursor-pointer select-none active:scale-95 ${
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
                    className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-[width] duration-300 ease-out"
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
                                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-[transform,colors] duration-150 cursor-pointer shrink-0 active:scale-95 ${
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
                    className="h-8 px-3 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-sky-950/50 active:scale-95 transition-[transform,colors] duration-150 flex items-center gap-1.5 cursor-pointer shrink-0"
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
                    placeholder="Sin hora (ir a Por Agendar)"
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
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-colors duration-150 cursor-pointer border ${
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
                        className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors duration-150 cursor-pointer border ${
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
              <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-[#0D1526]/80 transition-colors duration-150">
                <button
                  type="button"
                  onClick={() => setMostrarGasto(!mostrarGasto)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30 transition-colors duration-150 cursor-pointer"
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
                                className={`flex-1 py-1 rounded-md text-xs font-mono font-bold transition-colors duration-150 cursor-pointer ${
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
                                  className={`p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer border transition-colors duration-150 ${
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
              className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 transition-[transform,box-shadow,opacity] duration-150 flex items-center justify-center cursor-pointer"
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
