/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalActividadFlow.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-F1-P1.2b / REQ-REFACTOR-P1-02
 * DESCRIPCIÓN: Modal interactivo de creación y edición de hábitos, rutinas y metas
 *              personales con paridad 1:1 de legacy_gas/Modal_ActividadFlow.html,
 *              elevación canónica z-[10000], createPortal, useBodyScrollLock y
 *              erradicación total de emojis por iconos vectoriales Lucide.
 *              Lógica desacoplada en el hook canónico useActividadForm.ts.
 * ============================================================================
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { SelectIconicoCobalt } from '../UI/SelectIconicoCobalt';
import {
  OPCIONES_RECURRENCIA_ACTIVIDAD_COBALT,
  OPCIONES_CATEGORIA_GASTO_COBALT
} from '../../constants/uiMappers';
import {
  abrirGoogleCalendarActividad
} from '../../services/calendarSyncService';
import { ModalAlcanceRecurrencia } from './ModalAlcanceRecurrencia';
import { SeccionNotasVinculadasModal } from '../Notas/SeccionNotasVinculadasModal';
import { SwitchCobalt } from '../UI/SwitchCobalt';
import { InputFechaCobalt } from '../UI/InputFechaCobalt';
import { InputHoraCobalt } from '../UI/InputHoraCobalt';
import {
  type CategoriaVida
} from '../../types';
import {
  X,
  Calendar,
  Zap,
  Target,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  Search,
  DollarSign,
  Briefcase,
  ListOrdered,
  Link2,
  Flame,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
  CalendarCheck2,
  Hash,
  Repeat,
  Sun,
  CalendarDays,
  CalendarRange,
  SlidersHorizontal,
  CircleDot,
  AlertCircle,
  ArrowDown
} from 'lucide-react';
import {
  formatearDuracionLegible,
  convertirStringToHorasDecimal,
  convertirHorasDecimalAString,
  formatFechaIsoLocal
} from '../../utils/timeFormatters';
import {
  useActividadForm,
  CATEGORIAS_FLOW,
  resolverNombreActividadDefensivo,
  resolverNombreColumnaCanonico,
  type TipoRecurrenciaOpcion,
  type ModalActividadFlowProps
} from '../../hooks/useActividadForm';

export {
  CATEGORIAS_FLOW,
  resolverNombreActividadDefensivo,
  resolverNombreColumnaCanonico,
  type TipoRecurrenciaOpcion,
  type ModalActividadFlowProps
};

export const ModalActividadFlow: React.FC<ModalActividadFlowProps> = (props) => {
  const { isOpen, onClose } = props;
  useBodyScrollLock(isOpen);

  const {
    actividadEditar,
    esModoDetalle,
    esEdicionODetalle,
    nombreDisplay,
    categoriaActual,
    nombreColumnaCanonico,
    titulo,
    setTitulo,
    categoria,
    setCategoria,
    tipoCompromiso,
    prioridad,
    setPrioridad,
    calendarSync,
    setCalendarSync,
    notas,
    setNotas,
    fecha,
    setFecha,
    hora,
    setHora,
    duracionHoras,
    setDuracionHoras,
    duracionStr,
    setDuracionStr,
    tipoRecurrencia,
    setTipoRecurrencia,
    diasSemana,
    setDiasSemana,
    intervaloRepeticion,
    setIntervaloRepeticion,
    unidadIntervalo,
    setUnidadIntervalo,
    tieneFechaFin,
    setTieneFechaFin,
    fechaFin,
    setFechaFin,
    mostrarGasto,
    setMostrarGasto,
    tabGasto,
    setTabGasto,
    gastoMoneda,
    setGastoMoneda,
    gastoMonto,
    setGastoMonto,
    gastoCategoria,
    setGastoCategoria,
    gastoConcepto,
    setGastoConcepto,
    gastoSearch,
    setGastoSearch,
    gastoVinculadoId,
    setGastoVinculadoId,
    metaMacro,
    setMetaMacro,
    metaSeleccionadaId,
    modoMetaManual,
    setModoMetaManual,
    nombreNuevaMeta,
    setNombreNuevaMeta,
    unidadMedida,
    setUnidadMedida,
    metaTotal,
    setMetaTotal,
    valorAcumulado,
    setValorAcumulado,
    rescateMinimo,
    setRescateMinimo,
    copiado,
    handleCopiarCodigo,
    opcionesCategoriasCobalt,
    opcionesMetasCobalt,
    nuevoPasoTexto,
    setNuevoPasoTexto,
    pasosLocales,
    pasosCompletados,
    progresoPasos,
    agregarPaso,
    togglePasoCompletado,
    eliminarPaso,
    handleCambiarMetaSeleccionada,
    construirReglaYFrecuencia,
    handleGuardar,
    handleConfirmarAlcance,
    handleEliminar,
    mostrarModalAlcance,
    setMostrarModalAlcance,
    setPayloadPendiente,
    errorLocal,
    isSaving,
    gcalEstado,
    listaGastos
  } = useActividadForm(props);

  if (!isOpen) return null;
  return createPortal(
    <div
      id="modal-actividad-flow"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[10000] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200"
    >
      <div
        id="modal-actividad-flow-card"
        className="portal-surface elevation-3 w-full max-w-5xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-800/80 bg-[#0D1526] shadow-2xl overflow-hidden relative transform-gpu transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        {/* Drag handle móvil */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* 1. CABECERA EJECUTIVA DESPEJADA */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-800/80 shrink-0 space-y-2.5 bg-[#0A101D]">
          {/* Fila 1: ID Copiable, Píldora de Recurrencia, Píldora de Duración, Racha y Botón Cerrar */}
          <div className="flex items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
              {/* Placa de Código Interactivo con Copy-to-Clipboard */}
              {actividadEditar?.codigo_legado ? (
                <button
                  type="button"
                  id="act-flow-badge-id"
                  onClick={handleCopiarCodigo}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/70 hover:border-sky-500/50 text-slate-200 text-[11px] font-mono tabular-nums font-bold tracking-wider transition-[transform,colors] duration-150 cursor-pointer active:scale-95 shrink-0 select-none shadow-2xs"
                  title="Clic para copiar código de actividad"
                >
                  {copiado ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Hash className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
                      <span>{actividadEditar.codigo_legado}</span>
                    </>
                  )}
                </button>
              ) : (
                <span
                  id="act-flow-badge-id"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/70 text-slate-300 text-[11px] font-mono tabular-nums font-bold tracking-wider shrink-0 select-none shadow-2xs"
                >
                  <Hash className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
                  <span>NUEVA ACTIVIDAD</span>
                </span>
              )}

              {/* Píldora Dinámica de Configuración / Recurrencia */}
              <span
                id="act-flow-frecuencia-badge"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-800/80 bg-slate-900/60 text-slate-300 select-none shrink-0"
              >
                {tipoRecurrencia === 'DIARIA' && (
                  <>
                    <Repeat className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                    <span>Diario · Todos los días</span>
                  </>
                )}
                {tipoRecurrencia === 'DIARIA_LABORAL' && (
                  <>
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" strokeWidth={1.75} />
                    <span>Lun a Vie · Laboral</span>
                  </>
                )}
                {tipoRecurrencia === 'FIN_SEMANA' && (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                    <span>Fines de semana</span>
                  </>
                )}
                {tipoRecurrencia === 'SEMANAL' && (
                  <>
                    <CalendarDays className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.75} />
                    <span>Semanal · Configurado</span>
                  </>
                )}
                {tipoRecurrencia === 'QUINCENAL' && (
                  <>
                    <CalendarRange className="w-3.5 h-3.5 text-violet-400" strokeWidth={1.75} />
                    <span>Cada 15 días</span>
                  </>
                )}
                {tipoRecurrencia === 'MENSUAL' && (
                  <>
                    <Calendar className="w-3.5 h-3.5 text-purple-400" strokeWidth={1.75} />
                    <span>Mensual</span>
                  </>
                )}
                {tipoRecurrencia === 'PERSONALIZADO' && (
                  <>
                    <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                    <span>Personalizado · Configurado</span>
                  </>
                )}
                {tipoRecurrencia === 'NINGUNA' && (
                  <>
                    <CircleDot className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                    <span>Única · 1 vez</span>
                  </>
                )}
              </span>

              {/* Píldora Dinámica de Duración */}
              {duracionHoras > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold font-mono tabular-nums rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 select-none shrink-0">
                  <Clock className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
                  <span>Bloque · {formatearDuracionLegible(duracionHoras)}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold font-mono tabular-nums rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-300 select-none shrink-0">
                  <Zap className="w-3 h-3 text-amber-400" strokeWidth={1.75} />
                  <span>Puntual · Sin duración (0m)</span>
                </span>
              )}

              {/* Racha Badge si existe racha > 0 */}
              {(actividadEditar?.racha_actual || 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold font-mono tabular-nums rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 select-none shrink-0">
                  <Flame className="w-3 h-3 text-amber-400" strokeWidth={1.75} />
                  <span>{actividadEditar?.racha_actual} días</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-auto"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fila 2: Título en Alto Contraste */}
          <div className="pt-0.5">
            {esModoDetalle ? (
              <h2
                id="act-flow-titulo-readonly"
                className="text-lg sm:text-xl font-bold text-slate-100 py-0.5 leading-snug select-text"
              >
                {titulo || nombreDisplay || 'Actividad sin título'}
              </h2>
            ) : (
              <input
                type="text"
                id="act-flow-titulo"
                value={titulo || (actividadEditar ? nombreDisplay : '')}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Nombre del hábito o actividad personal..."
                className="text-lg sm:text-xl font-bold text-slate-100 placeholder:text-slate-500 bg-transparent outline-none w-full border-b border-transparent focus:border-sky-500/50 transition-colors py-0.5 leading-snug"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* 2. CUERPO DE CONTENIDO CON SCROLL — LINEAR SPLIT 2 COLUMNAS */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* COLUMNA IZQUIERDA: LIENZO DE TRABAJO */}
          <div className="flex-1 min-w-0 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
            {errorLocal && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorLocal}</span>
              </div>
            )}

            {/* Apuntes y Notas Rápidas de Ejecución */}
            <div className="space-y-1.5">
              <label className="block font-bold text-xs text-slate-400">
                Apuntes y Notas Rápidas de Ejecución
              </label>
              <textarea
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Añadir notas, observaciones o apuntes rápidos de ejecución..."
                className="w-full bg-[#080E1C]/80 border border-slate-800/70 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50 transition resize-y custom-scrollbar"
              />
            </div>

            {/* Pasos / Subtareas Procedurales (DoD) */}
            <div className="p-4 bg-[#080E1C]/80 border border-slate-800/70 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg text-xs font-black">
                    <ListOrdered className="w-4 h-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs">Pasos / Subtareas Procedurales</h4>
                    <p className="text-[10px] text-slate-400">Procedimiento guiado secuencial de ejecución</p>
                  </div>
                </div>

                {pasosLocales.length > 0 && (
                  <div
                    id="act-flow-pasos-progreso-badge"
                    className="font-mono tabular-nums text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#0D1526] text-slate-300 border border-slate-800"
                  >
                    {pasosCompletados}/{pasosLocales.length} pasos ({progresoPasos}%)
                  </div>
                )}
              </div>

              {/* Barra de progreso */}
              {pasosLocales.length > 0 && (
                <div className="w-full bg-[#040711] h-1.5 rounded-full overflow-hidden border border-slate-800/40">
                  <div
                    className={`${progresoPasos >= 100 ? 'bg-emerald-500' : 'bg-sky-500'} h-full rounded-full transition-[width] duration-300 ease-out`}
                    style={{ width: `${progresoPasos}%` }}
                  />
                </div>
              )}

              {/* Lista de pasos con casillas cuadradas redondeadas */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {pasosLocales.length === 0 ? (
                  <p className="text-center py-3 text-[11px] text-slate-500 italic">No hay pasos secuenciales agregados.</p>
                ) : (
                  pasosLocales.map((paso) => (
                    <div
                      key={paso.id}
                      className="flex items-center justify-between gap-2.5 p-2 rounded-lg border text-xs group transition-colors bg-[#0D1526] border-slate-800/80 hover:border-slate-700"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => togglePasoCompletado(paso.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-[transform,colors] duration-150 cursor-pointer active:scale-95 ${
                            paso.completado
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : 'border-slate-600 bg-slate-900/80 hover:border-emerald-400 text-transparent'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 ${paso.completado ? 'opacity-100' : 'opacity-0'}`} strokeWidth={2.5} />
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">#{paso.numero}</span>
                        <span
                          className={`truncate ${
                            paso.completado ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {paso.descripcion}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarPaso(paso.id)}
                        className="opacity-90 sm:opacity-0 sm:group-hover:opacity-100 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer flex items-center justify-center shrink-0"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarPaso();
                    }
                  }}
                  placeholder="Escribe el siguiente paso procedural y pulsa Enter..."
                  className="flex-1 border border-slate-800 rounded-lg px-3 py-1.5 text-xs bg-[#040711] text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50"
                />
                <button
                  type="button"
                  onClick={agregarPaso}
                  className="h-8 px-3 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-sky-950/50 active:scale-95 transition-[transform,colors] duration-150 flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Agregar paso"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Añadir</span>
                </button>
              </div>
            </div>

            {/* Sección Dinámica de Notas Vinculadas */}
            <SeccionNotasVinculadasModal
              codigoEntidad={actividadEditar?.codigo_legado || ''}
              tipoEntidad="HABITO"
              tituloEntidad={titulo || nombreDisplay || 'Actividad'}
            />
          </div>

          {/* COLUMNA DERECHA: INSPECTOR DE PROPIEDADES */}
          <div className="w-full md:w-[350px] lg:w-[380px] shrink-0 bg-[#080E1C]/80 border-t md:border-t-0 md:border-l border-slate-800/80 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar text-xs">
            {/* 1. Categoría / Pilar de Vida */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Pilar de Vida
              </label>
              {esEdicionODetalle ? (
                <div
                  id="flow-cat-badge-readonly"
                  className="p-2.5 rounded-xl bg-[#0D1526] border border-slate-700/70 flex items-center gap-2.5 select-none"
                  title={`Columna fija: ${nombreColumnaCanonico}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
                    {categoriaActual.iconoComp ? (
                      <categoriaActual.iconoComp className="w-4 h-4 text-sky-400" strokeWidth={1.75} />
                    ) : (
                      categoriaActual.icono
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-100 truncate">{nombreColumnaCanonico}</span>
                    <span className="text-[10px] text-slate-400 truncate">Dimensión fijada en edición</span>
                  </div>
                </div>
              ) : (
                <SelectIconicoCobalt
                  label=""
                  valor={categoria}
                  onChange={(nuevaCat) => setCategoria(nuevaCat as CategoriaVida)}
                  opciones={opcionesCategoriasCobalt}
                  placeholder="Seleccionar Pilar de Vida..."
                />
              )}
            </div>

            {/* 2. Prioridad Operativa (Riel Táctil Limpio) */}
            <div className="space-y-2 p-3 bg-[#0D1526]/80 rounded-xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                  <span>Prioridad Operativa</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Eisenhower</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: '01_P1_Alta', label: 'P1 Urgente', sublabel: 'Crítico', icon: Flame, activeClass: 'bg-rose-500/20 border-rose-500/60 text-rose-200 shadow-xs' },
                  { id: '02_P2_Media', label: 'P2 Media', sublabel: 'Sostenido', icon: AlertCircle, activeClass: 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-xs' },
                  { id: '03_P3_Baja', label: 'P3 Baja', sublabel: 'Flexible', icon: ArrowDown, activeClass: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 shadow-xs' }
                ].map((p) => {
                  const IconComp = p.icon;
                  const isSelected = prioridad === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPrioridad(p.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-[transform,colors] duration-150 cursor-pointer flex flex-col items-center justify-center gap-0.5 border active:scale-95 ${
                        isSelected
                          ? p.activeClass
                          : 'border-slate-800/80 bg-[#040711] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <IconComp className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        <span className="font-bold text-[11px]">{p.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">{p.sublabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Tiempo, Recurrencia & Duración */}
            <div className="space-y-3 p-3 bg-[#0D1526]/80 rounded-xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                  <span>Tiempo & Ciclo</span>
                </span>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-2">
                <InputFechaCobalt
                  label="Fecha"
                  value={fecha}
                  onChange={setFecha}
                />
                <InputHoraCobalt
                  label="Hora"
                  value={hora}
                  onChange={setHora}
                />
              </div>

              {/* Frecuencia de Repetición */}
              <div>
                <SelectIconicoCobalt
                  label="Frecuencia"
                  valor={tipoRecurrencia}
                  onChange={(nuevaRecurrencia) => {
                    const val = nuevaRecurrencia as TipoRecurrenciaOpcion;
                    setTipoRecurrencia(val);
                    if (val === 'DIARIA') {
                      setDiasSemana(['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']);
                    } else if (val === 'DIARIA_LABORAL') {
                      setDiasSemana(['LU', 'MA', 'MI', 'JU', 'VI']);
                    } else if (val === 'FIN_SEMANA') {
                      setDiasSemana(['SA', 'DO']);
                    } else if (val === 'SEMANAL') {
                      if (diasSemana.length === 0) setDiasSemana(['LU']);
                    }
                  }}
                  opciones={OPCIONES_RECURRENCIA_ACTIVIDAD_COBALT}
                />
              </div>

              {/* Días Activos Circulares Táctiles */}
              {(tipoRecurrencia === 'SEMANAL' || tipoRecurrencia === 'PERSONALIZADO') && (
                <div className="pt-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-400">Días Activos</label>
                    <span className="text-[10px] font-mono text-sky-400">
                      {diasSemana.length} seleccionados
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    {[
                      { id: 'LU', label: 'L', name: 'Lunes' },
                      { id: 'MA', label: 'M', name: 'Martes' },
                      { id: 'MI', label: 'M', name: 'Miércoles' },
                      { id: 'JU', label: 'J', name: 'Jueves' },
                      { id: 'VI', label: 'V', name: 'Viernes' },
                      { id: 'SA', label: 'S', name: 'Sábado' },
                      { id: 'DO', label: 'D', name: 'Domingo' }
                    ].map(({ id, label, name }) => {
                      const activo = diasSemana.includes(id);
                      const esFinde = id === 'SA' || id === 'DO';
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={activo}
                          onClick={() => {
                            if (activo) {
                              if (diasSemana.length > 1) {
                                setDiasSemana(diasSemana.filter((d) => d !== id));
                              }
                            } else {
                              setDiasSemana([...diasSemana, id]);
                            }
                          }}
                          className={`w-8 h-8 rounded-full text-xs font-mono font-black transition-[transform,colors] duration-150 flex items-center justify-center cursor-pointer select-none active:scale-90 ${
                            activo
                              ? 'bg-gradient-to-b from-sky-400 to-sky-600 text-slate-950 border border-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]'
                              : esFinde
                                ? 'bg-[#040711] text-amber-400/70 border border-amber-900/30 hover:border-amber-500/40 hover:text-amber-300 hover:bg-slate-900/60'
                                : 'bg-[#040711] text-slate-400 border border-slate-800/90 hover:border-sky-500/40 hover:text-sky-300 hover:bg-slate-900/60'
                          }`}
                          title={`${name} (${id})`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Intervalo Personalizado con botones segmentados Cobalt */}
              {tipoRecurrencia === 'PERSONALIZADO' && (
                <div className="pt-2 space-y-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 shrink-0">Repetir cada:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={intervaloRepeticion}
                        onChange={(e) => setIntervaloRepeticion(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-14 bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs font-mono tabular-nums font-bold text-center text-slate-200 outline-none focus:border-sky-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="inline-flex p-0.5 bg-[#040711] rounded-lg border border-slate-800 text-[11px]">
                        {[
                          { id: 'dias', label: 'días' },
                          { id: 'semanas', label: 'sem' },
                          { id: 'meses', label: 'meses' }
                        ].map((u) => {
                          const isActivo = unidadIntervalo === u.id;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => setUnidadIntervalo(u.id as 'dias' | 'semanas' | 'meses')}
                              className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer text-[10px] ${
                                isActivo
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {u.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vencimiento */}
              {tipoRecurrencia !== 'NINGUNA' && (
                <div className="pt-1.5 space-y-1.5 border-t border-slate-800/60">
                  <label className="text-[10px] text-slate-400 block font-medium">Vencimiento</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="finRecurrencia"
                        checked={!tieneFechaFin}
                        onChange={() => {
                          setTieneFechaFin(false);
                          setFechaFin('');
                        }}
                        className="text-sky-500 focus:ring-sky-500"
                      />
                      <span>Sin límite</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="finRecurrencia"
                        checked={tieneFechaFin}
                        onChange={() => setTieneFechaFin(true)}
                        className="text-sky-500 focus:ring-sky-500"
                      />
                      <span>Hasta</span>
                    </label>
                    {tieneFechaFin && (
                      <div className="flex-1">
                        <InputFechaCobalt
                          value={fechaFin}
                          onChange={setFechaFin}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Duración */}
              <div className="pt-2 space-y-1.5 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-400" />
                    <span>Duración</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setDuracionHoras(0);
                      setDuracionStr('0:00');
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      duracionHoras === 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                        : 'bg-[#040711] text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Micro (0m)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={duracionStr}
                    onChange={(e) => setDuracionStr(e.target.value)}
                    onBlur={() => {
                      const dec = convertirStringToHorasDecimal(duracionStr);
                      setDuracionHoras(dec);
                      setDuracionStr(convertirHorasDecimalAString(dec));
                    }}
                    placeholder="H:MM"
                    className="w-20 bg-[#040711] px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-mono tabular-nums text-center text-slate-200 outline-none focus:border-sky-500/50"
                  />
                  <span className="text-[11px] font-mono tabular-nums text-sky-400 font-semibold">
                    ({formatearDuracionLegible(duracionHoras)})
                  </span>
                </div>

                {/* Botones rápidos */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {[
                    { label: '15m', horas: 0.25 },
                    { label: '30m', horas: 0.5 },
                    { label: '45m', horas: 0.75 },
                    { label: '1h', horas: 1.0 },
                    { label: '2h', horas: 2.0 }
                  ].map((p) => {
                    const activo = Math.abs(duracionHoras - p.horas) < 0.02;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setDuracionHoras(p.horas);
                          setDuracionStr(convertirHorasDecimalAString(p.horas));
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-bold transition active:scale-95 cursor-pointer ${
                          activo
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-[#040711] text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sincronización Google Calendar */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                <SwitchCobalt
                  id="switch-actividad-calendar"
                  checked={calendarSync === 'Sí'}
                  onChange={(val) => setCalendarSync(val ? 'Sí' : 'No')}
                  label="Agendar en Calendar"
                  size="sm"
                />
                {calendarSync === 'Sí' && (
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
                    <button
                      type="button"
                      onClick={() => {
                        const { freqFinal, reglaFinal, fechaFinFinal } = construirReglaYFrecuencia();
                        abrirGoogleCalendarActividad({
                          id: actividadEditar?.id,
                          codigo_legado: actividadEditar?.codigo_legado || 'ACT-NEW',
                          nombre_actividad: titulo.trim() || nombreDisplay.trim() || 'Actividad PMO',
                          categoria_vida: categoria,
                          tipo_compromiso: tipoRecurrencia === 'NINGUNA' ? 'PUNTUAL' : tipoCompromiso,
                          meta_macro_nombre: metaMacro || undefined,
                          notas_checklist: notas || undefined,
                          fecha_programada: fecha || formatFechaIsoLocal(),
                          fecha_fin: fechaFinFinal,
                          hora_inicio: hora || '08:00',
                          duracion_horas: duracionHoras,
                          frecuencia_ciclo: freqFinal,
                          regla_repeticion: reglaFinal
                        });
                      }}
                      className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition cursor-pointer"
                      title="Abrir en Google Calendar"
                      aria-label="Abrir en Google Calendar"
                    >
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Meta Estratégica & Métricas Cuantitativas */}
            <div className="space-y-3 p-3 bg-[#0D1526]/80 rounded-xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                  <span>Meta & Métricas</span>
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] text-slate-400">Meta Vinculada</label>
                  <button
                    type="button"
                    onClick={() => setModoMetaManual(!modoMetaManual)}
                    className="text-[10px] text-sky-400 hover:text-sky-300 transition cursor-pointer font-medium"
                  >
                    {modoMetaManual ? 'Seleccionar lista' : '+ Nueva rápida'}
                  </button>
                </div>

                {modoMetaManual ? (
                  <input
                    type="text"
                    value={nombreNuevaMeta || metaMacro}
                    onChange={(e) => {
                      setNombreNuevaMeta(e.target.value);
                      setMetaMacro(e.target.value);
                    }}
                    placeholder="Nombre del objetivo..."
                    className="w-full bg-[#040711] px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50"
                  />
                ) : (
                  <SelectIconicoCobalt
                    label=""
                    valor={metaSeleccionadaId}
                    onChange={(nuevaMetaId) => handleCambiarMetaSeleccionada(nuevaMetaId)}
                    opciones={opcionesMetasCobalt}
                    placeholder="Sin vinculación a metas"
                  />
                )}
              </div>

              {/* Métricas Cuantitativas: Grilla 2x2 */}
              <div className="pt-1.5 border-t border-slate-800/60 space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 block">Avance Cuantitativo</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Unidad</label>
                    <input
                      type="text"
                      placeholder="km, págs..."
                      value={unidadMedida}
                      onChange={(e) => setUnidadMedida(e.target.value)}
                      className="w-full bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Objetivo</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="100"
                      value={metaTotal}
                      onChange={(e) => setMetaTotal(e.target.value)}
                      className="w-full bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs font-mono tabular-nums font-bold text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Acumulado</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={valorAcumulado}
                      onChange={(e) => setValorAcumulado(e.target.value)}
                      className="w-full bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs font-mono tabular-nums font-bold text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Mínimo Racha</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="1"
                      value={rescateMinimo}
                      onChange={(e) => setRescateMinimo(e.target.value)}
                      className="w-full bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs font-mono tabular-nums font-bold text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Acordeón Gasto Asociado & Costos */}
            <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-[#0D1526]">
              <button
                type="button"
                onClick={() => setMostrarGasto(!mostrarGasto)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30 transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Gasto Asociado & Costos</span>
                  {tabGasto === 'VINCULAR' && gastoVinculadoId ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-emerald-400" />
                      <span>{gastoVinculadoId} • S/ {Number(gastoMonto || 0).toFixed(2)}</span>
                    </span>
                  ) : parseFloat(gastoMonto) > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                      {gastoMoneda === 'PEN' ? 'S/' : gastoMoneda === 'USD' ? '$' : '€'} {Number(gastoMonto).toFixed(2)} • {gastoCategoria.replace(/_/g, ' ')}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {!mostrarGasto && (!gastoMonto || parseFloat(gastoMonto) === 0) && !gastoVinculadoId && (
                    <span className="text-[11px] text-slate-400 font-normal">Sin gastos vinculados</span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-emerald-400 transition-transform duration-200 ${mostrarGasto ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {mostrarGasto && (
                <div className="p-3.5 border-t border-emerald-500/20 bg-[#0D1526] space-y-3">
                  {/* Selector de Pestaña Superior: Modo Dual */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Modo de Imputación
                    </span>
                    <div className="inline-flex p-0.5 bg-[#040711] rounded-lg border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setTabGasto('NUEVO')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${tabGasto === 'NUEVO'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Nuevo Gasto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTabGasto('VINCULAR')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${tabGasto === 'VINCULAR'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Vincular Existente</span>
                      </button>
                    </div>
                  </div>

                  {tabGasto === 'NUEVO' ? (
                    /* Modo NUEVO GASTO */
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-3 items-end">
                        {/* Selector Moneda */}
                        <div className="col-span-12 sm:col-span-4">
                          <label className="text-[10px] text-slate-400 block mb-1">Moneda de Registro</label>
                          <div className="inline-flex p-0.5 bg-[#040711] rounded-lg border border-slate-800 w-full justify-between">
                            {(['PEN', 'USD', 'EUR'] as const).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setGastoMoneda(m)}
                                className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition-colors duration-150 cursor-pointer ${gastoMoneda === m ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Input Monto */}
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
                              onChange={(e) => setGastoMonto(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-9 pr-3 py-1.5 border border-slate-800 rounded-lg bg-[#040711] font-mono font-bold text-lg text-emerald-300 outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <SelectIconicoCobalt
                          label="Categoría Contable"
                          valor={gastoCategoria}
                          onChange={(nuevaCat) => setGastoCategoria(nuevaCat)}
                          opciones={OPCIONES_CATEGORIA_GASTO_COBALT}
                        />
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Concepto / Glosa Detallada</label>
                          <input
                            type="text"
                            value={gastoConcepto}
                            onChange={(e) => setGastoConcepto(e.target.value)}
                            placeholder="Ej. Membresía gimnasio, suplementos, zapatillas..."
                            className="w-full bg-[#040711] px-2.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-500 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Modo VINCULAR EXISTENTE */
                    <div className="space-y-2.5">
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
                            const isSelected = gastoVinculadoId === g.codigo_legado;
                            const montoMostrar = Number(g.monto_pen || g.monto_original || 0).toFixed(2);
                            return (
                              <div
                                key={g.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setGastoVinculadoId(null);
                                    setGastoMonto('');
                                  } else {
                                    setGastoVinculadoId(g.codigo_legado || null);
                                    setGastoMonto(String(g.monto_original || g.monto_pen || ''));
                                    setGastoMoneda((g.moneda_original as 'PEN' | 'USD' | 'EUR') || 'PEN');
                                    setGastoCategoria(g.categoria_gasto || 'Personal_Salud');
                                    setGastoConcepto(g.descripcion_gasto || '');
                                  }
                                }}
                                className={`p-2.5 rounded-xl flex items-center justify-between text-xs cursor-pointer border transition-colors duration-150 ${isSelected
                                    ? 'bg-emerald-950/40 border-emerald-500/80 shadow-xs'
                                    : 'bg-[#040711] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-[10px] text-sky-400 bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-800/40 shrink-0">
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

        {/* 3. FOOTER DE ACCIONES */}
        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-800/80 bg-[#0A101D] flex items-center justify-between gap-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="flex items-center gap-2">
            {actividadEditar && (
              <button
                type="button"
                id="act-flow-btn-eliminar"
                onClick={handleEliminar}
                className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Eliminar esta actividad permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            )}
            <p className="text-[10px] text-slate-500 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#040711] font-mono text-[9px] border border-slate-800 text-slate-400">
                Esc
              </kbd>
              <span>para cancelar</span>
            </p>
          </div>
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
              id="btn-submit-flow-actividad"
              disabled={isSaving}
              onClick={() => handleGuardar()}
              className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 transition-[transform,box-shadow,opacity] duration-150 flex items-center justify-center cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{actividadEditar ? 'Actualizar Actividad' : 'Guardar Actividad'}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Alcance de Recurrencia al Guardar */}
      {mostrarModalAlcance && actividadEditar && (
        <ModalAlcanceRecurrencia
          isOpen={mostrarModalAlcance}
          accion="editar"
          tituloActividad={titulo || nombreDisplay || 'Actividad'}
          fechaActual={actividadEditar.fecha_programada}
          onSeleccionarAlcance={handleConfirmarAlcance}
          onClose={() => {
            setMostrarModalAlcance(false);
            setPayloadPendiente(null);
          }}
        />
      )}
    </div>,
    document.body
  );
};
