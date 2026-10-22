/**
 * ============================================================================
 * ARCHIVO: src/components/Cockpit/DailyCockpit.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-DAILY-HUD-COCKPIT-EXEC-38
 * DESCRIPCIÓN: Cápsula Diaria Flotante, Cockpit de Ejecución Táctico Unificado
 *              (Hoy/Mañana/Semana), Riel Horario vs Checklist y Desacople PiP.
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  ListTodo,
  ExternalLink,
  ChevronDown,
  Gauge,
  CheckCircle2,
  Circle,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  useDailySchedule,
  type HorizonteAgenda,
  type DailyScheduleItem
} from '../../hooks/useDailySchedule';

export interface DailyCockpitProps {
  modoForzadoDesacoplado?: boolean;
  onCerrarDesacoplado?: () => void;
}

export const DailyCockpit: React.FC<DailyCockpitProps> = ({
  modoForzadoDesacoplado = false,
  onCerrarDesacoplado
}) => {
  // Estado de visibilidad y visualización
  const [cockpitAbierto, setCockpitAbierto] = useState(modoForzadoDesacoplado);
  const [horizonte, setHorizonte] = useState<HorizonteAgenda>('HOY');
  const [modoVista, setModoVista] = useState<'RIEL' | 'CHECKLIST'>('CHECKLIST');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'TAREAS' | 'HABITOS' | 'VENCIDAS' | 'FINANZAS'>('TODOS');

  // Estado de ventana Picture-in-Picture nativa
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // Hook unificado de datos y ritmo
  const { items, metricas, horaActual, fechaActual, toggleCompletar, cargando } = useDailySchedule(horizonte);

  // Filtrado de items según filtro secundario
  const itemsFiltrados = useMemo(() => {
    return items.filter((item) => {
      if (filtroTipo === 'TODOS') return true;
      if (filtroTipo === 'TAREAS') return item.tipo === 'TAREA';
      if (filtroTipo === 'HABITOS') return item.tipo === 'HABITO';
      if (filtroTipo === 'FINANZAS') return item.tipo === 'GASTO' || item.tipo === 'CUOTA';
      if (filtroTipo === 'VENCIDAS') return item.estadoRitmo === 'VENCIDO_PASADO' && !item.completado;
      return true;
    });
  }, [items, filtroTipo]);

  // Completar rápido con micro-feedback de confetti
  const handleToggle = async (item: DailyScheduleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const marcar = !item.completado;
    await toggleCompletar(item);

    if (marcar) {
      confetti({
        particleCount: 22,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#38bdf8', '#34d399', '#818cf8']
      });
    }
  };

  // Motor de desacople a escritorio Always-on-Top (Document Picture-in-Picture enriquecido con fallback)
  const desacoplarAEscritorio = async () => {
    if ('documentPictureInPicture' in window) {
      try {
        const pipWin = await (window as any).documentPictureInPicture.requestWindow({
          width: 420,
          height: 700,
        });

        // Clonar todas las hojas de estilo de la ventana principal para mantener Tailwind 1:1
        [...document.styleSheets].forEach((sheet) => {
          try {
            const css = [...sheet.cssRules].map((r) => r.cssText).join('');
            const style = document.createElement('style');
            style.textContent = css;
            pipWin.document.head.appendChild(style);
          } catch {
            if (sheet.href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = sheet.href;
              pipWin.document.head.appendChild(link);
            }
          }
        });

        pipWin.document.documentElement.className = document.documentElement.className;
        pipWin.document.body.className = 'bg-[#040711] text-slate-100 overflow-hidden m-0 p-3 select-none';

        // Montar el contenedor con React Portal o renderizado directo
        setPipWindow(pipWin);
        setCockpitAbierto(false);
        pipWin.addEventListener('pagehide', () => setPipWindow(null));
        return;
      } catch (err) {
        console.warn('PiP declinado o no disponible, usando fallback window.open', err);
      }
    }

    // Fallback inmediato: cálculo de pantalla derecha
    const w = 420;
    const h = 720;
    const left = typeof window !== 'undefined' ? window.screen.availWidth - w - 20 : 1000;
    const top = 40;
    window.open(
      '/?mode=hud',
      'PMO_HUD_Widget',
      `width=${w},height=${h},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );
  };

  // Horas del Riel Horario (06:00 a 23:00)
  const slotsHorarios = useMemo(() => {
    const slots: string[] = [];
    for (let h = 6; h <= 23; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // Semáforo dinámico de color según ritmo horario
  const colorRitmo = useMemo(() => {
    const pct = metricas.porcentajeRitmo;
    if (pct >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30';
    if (pct >= 40) return 'text-sky-400 border-sky-500/30 bg-sky-950/30';
    return 'text-rose-400 border-rose-500/30 bg-rose-950/30';
  }, [metricas.porcentajeRitmo]);

  // Contenido interno del Cockpit
  const cockpitContent = (
    <div
      className={`flex flex-col bg-[#0D1526] border border-slate-800/80 text-slate-100 shadow-2xl backdrop-blur-2xl select-none ${
        modoForzadoDesacoplado || pipWindow
          ? 'w-full h-full rounded-2xl md:rounded-3xl border'
          : 'w-full md:w-[440px] h-[85vh] md:h-[680px] max-h-[85vh] rounded-t-3xl md:rounded-3xl border-t md:border'
      }`}
    >
      {/* 1. Cabecera Táctica Canónica */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Gauge className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-tight text-white uppercase">
                Cockpit Diario
              </span>
              <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                {horaActual}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {metricas.completadasTotal} de {metricas.totalItems} cumplidas ({metricas.porcentajeTotal}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Badge Ritmo Horario */}
          <div
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono tabular-nums font-bold flex items-center gap-1 ${colorRitmo}`}
            title="Porcentaje de avance sobre entidades programadas hasta este momento"
          >
            <Zap className="w-3 h-3" strokeWidth={1.75} />
            {metricas.porcentajeRitmo}%
          </div>

          {/* Botón Desacople Always-on-Top (disponible si no está desacoplado en PiP) */}
          {!pipWindow && (
            <button
              type="button"
              onClick={desacoplarAEscritorio}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Desacoplar Cockpit a ventana flotante Always-on-Top en PC"
            >
              <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}

          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={() => {
              if (modoForzadoDesacoplado && onCerrarDesacoplado) {
                onCerrarDesacoplado();
              } else if (pipWindow) {
                pipWindow.close();
              } else {
                setCockpitAbierto(false);
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Cerrar Cockpit"
          >
            <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* 2. Selector de Horizonte (Hoy / Mañana / Semana) */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between gap-1 shrink-0">
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 w-full">
          <button
            type="button"
            onClick={() => setHorizonte('HOY')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              horizonte === 'HOY'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setHorizonte('MANANA')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              horizonte === 'MANANA'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mañana
          </button>
          <button
            type="button"
            onClick={() => setHorizonte('SEMANA')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              horizonte === 'SEMANA'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semana
          </button>
        </div>
      </div>

      {/* 3. Barra de Herramientas Dual (Riel vs Checklist + Filtros Rápidos) */}
      <div className="px-3 py-2 bg-[#040711]/50 border-b border-slate-800/50 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Switch Modo Vista */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setModoVista('CHECKLIST')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                modoVista === 'CHECKLIST'
                  ? 'bg-slate-800 text-sky-300 font-bold border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" strokeWidth={1.75} />
              Checklist
            </button>
            <button
              type="button"
              onClick={() => setModoVista('RIEL')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                modoVista === 'RIEL'
                  ? 'bg-slate-800 text-sky-300 font-bold border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              Riel Horario
            </button>
          </div>

          {/* Siguiente en turno badge */}
          {metricas.siguienteItem && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
              <span className="text-sky-400 font-bold shrink-0">Turno:</span>
              <span className="truncate text-slate-300">{metricas.siguienteItem.titulo}</span>
            </div>
          )}
        </div>

        {/* Filtros tipo Ghost Controls */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px] font-medium">
          {(['TODOS', 'TAREAS', 'HABITOS', 'VENCIDAS', 'FINANZAS'] as const).map((filtro) => {
            const activo = filtroTipo === filtro;
            return (
              <button
                key={filtro}
                type="button"
                onClick={() => setFiltroTipo(filtro)}
                className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  activo
                    ? 'bg-sky-950/60 text-sky-300 border border-sky-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-transparent'
                }`}
              >
                {filtro === 'TODOS' && 'Todos'}
                {filtro === 'TAREAS' && 'Tareas'}
                {filtro === 'HABITOS' && 'Hábitos'}
                {filtro === 'VENCIDAS' && 'Vencidas'}
                {filtro === 'FINANZAS' && 'Finanzas'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Cuerpo de Ejecución Táctica */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cargando ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500 space-y-2">
            <div className="w-6 h-6 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin" />
            <span className="text-xs font-mono">Sincronizando agenda...</span>
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500 border border-dashed border-slate-800/80 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mb-2" strokeWidth={1.75} />
            <span className="text-xs font-semibold text-slate-400">Sin entidades para este horizonte</span>
            <span className="text-[10px] text-slate-600 mt-0.5">Estás al día o cambia el filtro de vista</span>
          </div>
        ) : modoVista === 'CHECKLIST' ? (
          /* ========================================================
             VISTA A: CHECKLIST DIRECTO CON OPACIDAD 35% Y TACHADO
             ======================================================== */
          <div className="space-y-2">
            {itemsFiltrados.map((item) => {
              const estaCompletado = item.completado;
              const esVencido = item.estadoRitmo === 'VENCIDO_PASADO' && !estaCompletado;
              const esFocus = item.estadoRitmo === 'FOCUS_ACTUAL' && !estaCompletado;

              return (
                <div
                  key={`${item.tipo}-${item.id}`}
                  onClick={(e) => handleToggle(item, e)}
                  className={`group flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                    estaCompletado
                      ? 'bg-slate-900/30 border-slate-800/40 opacity-35'
                      : esFocus
                      ? 'bg-sky-950/25 border-sky-500/40 shadow-sm shadow-sky-500/10'
                      : esVencido
                      ? 'bg-rose-950/15 border-rose-500/30'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80'
                  }`}
                >
                  {/* Checkbox táctil */}
                  <div className="shrink-0 pt-0.5 text-sky-400">
                    {estaCompletado ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" strokeWidth={1.75} />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" strokeWidth={1.75} />
                    )}
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-xs font-medium leading-snug break-words transition-all duration-200 ${
                          estaCompletado
                            ? 'line-through text-slate-500'
                            : esFocus
                            ? 'text-sky-200 font-semibold'
                            : 'text-slate-100'
                        }`}
                      >
                        {item.titulo}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] font-mono tabular-nums text-slate-400">
                      {/* Horario */}
                      <span className="flex items-center gap-0.5 text-slate-400">
                        <Clock className="w-2.5 h-2.5 text-slate-400" strokeWidth={1.75} />
                        {item.horaInicio} - {item.horaFin}
                      </span>

                      {/* Tipo / Categoría */}
                      <span className="px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60 text-[9px]">
                        {item.tipo}
                      </span>

                      {/* Tag secundario */}
                      {item.categoria && (
                        <span className="truncate max-w-[120px] text-slate-400">
                          {item.categoria}
                        </span>
                      )}

                      {/* Monto si aplica */}
                      {item.monto !== undefined && item.monto > 0 && (
                        <span className="text-emerald-400 font-bold">
                          {item.moneda || 'PEN'} {item.monto.toFixed(2)}
                        </span>
                      )}

                      {/* Badge Focus actual */}
                      {esFocus && (
                        <span className="px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 text-[9px] animate-pulse">
                          EN CURSO
                        </span>
                      )}

                      {/* Badge Vencida */}
                      {esVencido && (
                        <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 text-[9px]">
                          VENCIDA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================
             VISTA B: RIEL HORARIO (TIMELINE CONTINUO 06:00 - 23:00)
             ======================================================== */
          <div className="relative border-l border-slate-800 ml-12 my-2 space-y-6">
            {/* Marcador en tiempo real de hora actual */}
            {horizonte === 'HOY' && (
              <div
                className="absolute left-[-48px] right-0 flex items-center z-10 pointer-events-none"
                style={{
                  top: `${Math.min(
                    95,
                    Math.max(
                      2,
                      ((parseInt(horaActual.split(':')[0], 10) - 6) * 60 +
                        parseInt(horaActual.split(':')[1], 10)) *
                        (100 / (18 * 60))
                    )
                  )}%`
                }}
              >
                <span className="text-[9px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white shadow-sm shrink-0">
                  {horaActual}
                </span>
                <div className="h-[2px] bg-rose-500/80 flex-1 ml-1" />
              </div>
            )}

            {slotsHorarios.map((slot) => {
              const itemsEnSlot = itemsFiltrados.filter((i) => {
                const hItem = i.horaInicio.split(':')[0];
                const hSlot = slot.split(':')[0];
                return hItem === hSlot;
              });

              return (
                <div key={slot} className="relative pl-4 min-h-[44px]">
                  {/* Etiqueta horaria */}
                  <span className="absolute -left-12 top-0 text-[10px] font-mono tabular-nums text-slate-400 w-10 text-right">
                    {slot}
                  </span>

                  {/* Nodo de punto en la línea */}
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-700 border border-slate-900" />

                  {/* Contenedor de entidades en esta hora */}
                  <div className="space-y-1.5">
                    {itemsEnSlot.length === 0 ? (
                      <div className="text-[10px] text-slate-400 font-mono italic">
                        — Disponible —
                      </div>
                    ) : (
                      itemsEnSlot.map((item) => {
                        const estaCompletado = item.completado;
                        return (
                          <div
                            key={`${item.tipo}-${item.id}`}
                            onClick={(e) => handleToggle(item, e)}
                            className={`p-2 rounded-xl border text-xs cursor-pointer transition-all duration-200 flex items-start justify-between gap-2 ${
                              estaCompletado
                                ? 'bg-slate-900/30 border-slate-800/40 opacity-35'
                                : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <span
                                className={`font-medium block leading-snug truncate transition-all duration-200 ${
                                  estaCompletado ? 'line-through text-slate-500' : 'text-slate-200'
                                }`}
                              >
                                {item.titulo}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {item.horaInicio} - {item.horaFin} · {item.tipo}
                              </span>
                            </div>
                            <div className="shrink-0 pt-0.5 text-sky-400">
                              {estaCompletado ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={1.75} />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Footer con Resumen Rápido */}
      <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span>Fecha: {fechaActual}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Ritmo: <strong className="text-white font-mono tabular-nums">{metricas.porcentajeRitmo}%</strong></span>
        </div>
      </div>
    </div>
  );

  // MODO DESACOPLADO DIRECTO (cuando se renderiza en la ventana principal o como página completa)
  if (modoForzadoDesacoplado) {
    return (
      <div className="h-full w-full bg-[#040711] flex items-center justify-center p-2 font-sans select-none">
        {pipWindow && createPortal(cockpitContent, pipWindow.document.body)}
        {pipWindow ? (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[#0D1526] border border-slate-800/80 rounded-2xl max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 animate-pulse">
              <Gauge className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono">Cockpit Desacoplado</h3>
              <p className="text-xs text-slate-400 mt-1">El Cockpit se está ejecutando en la ventana flotante Always-on-Top.</p>
            </div>
            <button
              type="button"
              onClick={() => pipWindow.focus()}
              className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold hover:bg-sky-500/30 transition cursor-pointer"
            >
              Enfocar Ventana PiP
            </button>
          </div>
        ) : (
          cockpitContent
        )}
      </div>
    );
  }

  // MODO NORMAL DE LA APLICACIÓN PRINCIPAL (con soporte Portal PiP si pipWindow está activo)
  return (
    <>
      {/* Montaje del Cockpit en ventana PiP Always-on-Top vía Portal */}
      {pipWindow && createPortal(cockpitContent, pipWindow.document.body)}

      {/* A. CÁPSULA EN REPOSO (FLOATING PILL) */}
      {(!cockpitAbierto || pipWindow) && (
        <div
          onClick={() => {
            if (pipWindow) {
              pipWindow.focus();
            } else {
              setCockpitAbierto(true);
            }
          }}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 md:bottom-6 md:right-6 z-50 pointer-events-auto px-3.5 py-1.5 rounded-full bg-[#0D1526]/90 border border-sky-500/30 backdrop-blur-xl shadow-[0_4px_25px_rgba(2,6,23,0.8),0_0_15px_rgba(56,189,248,0.12)] flex items-center gap-2.5 transition-all duration-200 hover:border-sky-400 hover:scale-[1.02] active:scale-[0.97] cursor-pointer group select-none"
          title={pipWindow ? "Cockpit activo Always-on-Top (clic para enfocar)" : "Abrir Cockpit de Ejecución Diaria"}
        >
          {/* Glifo Técnico Maestro: Gauge + Micro-punto Radar de Actividad */}
          <div className="relative flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          </div>

          {/* Reloj Actual */}
          <span className="text-xs font-bold font-mono tabular-nums text-slate-100">
            {horaActual}
          </span>

          {/* Semáforo de Ritmo */}
          <div
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold border ${colorRitmo}`}
          >
            {metricas.porcentajeRitmo}%
          </div>

          {/* Siguiente en turno (solo si existe y en pantallas sm+) */}
          {metricas.siguienteItem && (
            <div className="hidden md:flex items-center gap-1 max-w-[140px] truncate text-[11px] text-slate-300 font-sans border-l border-slate-800 pl-2">
              <span className="truncate">{metricas.siguienteItem.titulo}</span>
            </div>
          )}

          {/* Indicador Always-on-Top PiP si está desacoplado */}
          {pipWindow && (
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-500/30 px-1.5 py-0.2 rounded-full animate-pulse">
              PiP
            </span>
          )}
        </div>
      )}

      {/* B. COCKPIT DESPLEGADO */}
      {cockpitAbierto && !pipWindow && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-50 flex items-end md:items-start justify-center md:justify-end bg-black/40 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none animate-in fade-in duration-200">
          {/* Backdrop móvil para cerrar */}
          <div
            className="md:hidden absolute inset-0 -z-10"
            onClick={() => setCockpitAbierto(false)}
          />
          <div className="w-full md:w-auto transition-transform duration-200 ease-out origin-bottom-right">
            {cockpitContent}
          </div>
        </div>
      )}
    </>
  );
};
