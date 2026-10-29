/**
 * ============================================================================
 * ARCHIVO: src/components/Cockpit/DailyCockpit.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-DAILY-HUD-COCKPIT-EXEC-38
 * DESCRIPCIÓN: Cápsula Diaria Flotante, Cockpit de Ejecución Táctico Unificado
 *              (Hoy/Mañana/Semana), Riel Horario vs Checklist y Desacople PiP.
 * ============================================================================
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  ListTodo,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Gauge,
  CheckCircle2,
  Zap,
  Flame,
  FolderKanban,
  Wallet,
  TrendingUp,
  TrendingDown,
  Check
} from 'lucide-react';
import {
  useDailySchedule,
  type HorizonteAgenda,
  type DailyScheduleItem
} from '../../hooks/useDailySchedule';
import { syncManager } from '../../services/syncManager';

const DRAG_REGION_STYLE: React.CSSProperties = { WebkitAppRegion: 'drag' } as unknown as React.CSSProperties;
const NO_DRAG_REGION_STYLE: React.CSSProperties = { WebkitAppRegion: 'no-drag' } as unknown as React.CSSProperties;

export interface DailyCockpitProps {
  modoForzadoDesacoplado?: boolean;
  onCerrarDesacoplado?: () => void;
}

export const DailyCockpit: React.FC<DailyCockpitProps> = ({
  modoForzadoDesacoplado = false,
  onCerrarDesacoplado
}) => {
  // Detección de wrapper nativo standalone HUD (?widget=desktop o ?mode=hud o ?mode=cockpit-only)
  const esWidgetNativo = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('widget') === 'desktop' ||
    new URLSearchParams(window.location.hash.replace(/^#/, '')).get('widget') === 'desktop' ||
    new URLSearchParams(window.location.search).get('mode') === 'hud' ||
    new URLSearchParams(window.location.hash.replace(/^#/, '')).get('mode') === 'hud' ||
    new URLSearchParams(window.location.search).get('mode') === 'cockpit-only' ||
    new URLSearchParams(window.location.hash.replace(/^#/, '')).get('mode') === 'cockpit-only' ||
    window.location.hash.includes('cockpit-widget') ||
    Boolean(window.desktopWidget?.isNative)
  );

  // Estado de visibilidad y visualización (adaptativo en standalone HUD según altura o parámetro)
  const [cockpitAbierto, setCockpitAbierto] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const getParam = (k: string) => searchParams.get(k) || hashParams.get(k);

      if (getParam('state') === 'open') return true;
      if (getParam('state') === 'rest') return false;
      if (getParam('mode') === 'cockpit-only' || window.location.hash.includes('cockpit-widget')) {
        return true; // En modo ventana de Cockpit independiente (420x720) arranca abierto y listo
      }
      if (getParam('widget') === 'desktop') {
        return false; // El widget nativo arranca en reposo (380x100)
      }
      if (getParam('mode') === 'hud') {
        return window.innerHeight > 400;
      }
    }
    return modoForzadoDesacoplado;
  });

  // Expansión con sincronización de ventana nativa de Electron si aplica en modo HUD
  const handleAbrirCockpit = () => {
    if (esWidgetNativo && typeof window !== 'undefined' && window.desktopWidget) {
      window.desktopWidget.expand();
    }
    setCockpitAbierto(true);
  };

  // Contracción con sincronización de ventana nativa de Electron si aplica en modo HUD
  const handleContraerCockpit = () => {
    if (esWidgetNativo && typeof window !== 'undefined' && window.desktopWidget) {
      window.desktopWidget.collapse();
    }
    setCockpitAbierto(false);
  };

  // Posición libre de la cápsula en modo web persistida en localStorage
  const [posicionWeb, setPosicionWeb] = useState<{ x: number; y: number } | null>(() => {
    if (typeof window !== 'undefined') {
      const x = localStorage.getItem('pmo_cockpit_pos_x');
      const y = localStorage.getItem('pmo_cockpit_pos_y');
      if (x !== null && y !== null) {
        const parsedX = parseFloat(x);
        const parsedY = parseFloat(y);
        if (!isNaN(parsedX) && !isNaN(parsedY)) {
          const maxX = Math.max(10, window.innerWidth - 180);
          const maxY = Math.max(10, window.innerHeight - 60);
          return {
            x: Math.min(Math.max(10, parsedX), maxX),
            y: Math.min(Math.max(10, parsedY), maxY)
          };
        }
      }
    }
    return null;
  });

  const arrastreRef = useRef<{
    iniciado: boolean;
    startX: number;
    startY: number;
    elemStartX: number;
    elemStartY: number;
    haMovido: boolean;
  }>({
    iniciado: false,
    startX: 0,
    startY: 0,
    elemStartX: 0,
    elemStartY: 0,
    haMovido: false
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, [data-no-drag]')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    arrastreRef.current = {
      iniciado: true,
      startX: e.clientX,
      startY: e.clientY,
      elemStartX: rect.left,
      elemStartY: rect.top,
      haMovido: false
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!arrastreRef.current.iniciado) return;
    const dx = e.clientX - arrastreRef.current.startX;
    const dy = e.clientY - arrastreRef.current.startY;

    if (!arrastreRef.current.haMovido && Math.sqrt(dx * dx + dy * dy) > 4) {
      arrastreRef.current.haMovido = true;
    }

    if (arrastreRef.current.haMovido) {
      const nuevoX = Math.min(
        Math.max(10, arrastreRef.current.elemStartX + dx),
        window.innerWidth - 180
      );
      const nuevoY = Math.min(
        Math.max(10, arrastreRef.current.elemStartY + dy),
        window.innerHeight - 60
      );
      setPosicionWeb({ x: nuevoX, y: nuevoY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!arrastreRef.current.iniciado) return;
    const { haMovido } = arrastreRef.current;
    arrastreRef.current.iniciado = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar si ya fue liberado
    }

    if (haMovido) {
      if (posicionWeb) {
        localStorage.setItem('pmo_cockpit_pos_x', String(posicionWeb.x));
        localStorage.setItem('pmo_cockpit_pos_y', String(posicionWeb.y));
      }
    } else {
      if (pipWindow) {
        pipWindow.focus();
      } else {
        handleAbrirCockpit();
      }
    }
  };

  // Heartbeat de emisión de presencia si esta ventana es el widget nativo de escritorio
  useEffect(() => {
    if (esWidgetNativo) {
      let channel: BroadcastChannel | null = null;
      try {
        channel = new BroadcastChannel('pmo_hud_bus');
      } catch {}

      const interval = setInterval(() => {
        if (channel) {
          try {
            channel.postMessage({ type: 'DESKTOP_WIDGET_ALIVE', timestamp: Date.now() });
          } catch {}
        }
        try {
          localStorage.setItem('pmo_desktop_widget_heartbeat', String(Date.now()));
        } catch {}
      }, 1000);

      return () => {
        clearInterval(interval);
        if (channel) channel.close();
      };
    }
  }, [esWidgetNativo]);

  // Detección de coexistencia exclusiva y sincronización de puente local
  const [hayWidgetDeEscritorioActivo, setHayWidgetDeEscritorioActivo] = useState(false);

  useEffect(() => {
    // Si estamos dentro del widget nativo de Electron, NUNCA ocultarse
    if (esWidgetNativo) {
      setHayWidgetDeEscritorioActivo(false);
      // Al montar o al recibir foco en el widget nativo, cargar el snapshot más reciente del puente local
      syncManager.cargarSnapshotDesdePuenteLocal().catch(() => {});
      const handleFocus = () => {
        syncManager.cargarSnapshotDesdePuenteLocal().catch(() => {});
      };
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }

    if (modoForzadoDesacoplado) return;

    let cancelado = false;

    const pingLoopbackDesktop = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300);

      try {
        const res = await fetch('http://127.0.0.1:48123/status', {
          mode: 'cors',
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!cancelado) {
          if (res.ok) {
            const data = await res.json();
            if (data.desktopWidgetAlive) {
              setHayWidgetDeEscritorioActivo(true);
              return;
            }
          }
          setHayWidgetDeEscritorioActivo(false);
        }
      } catch {
        clearTimeout(timeoutId);
        if (!cancelado) {
          setHayWidgetDeEscritorioActivo(false);
        }
      }
    };

    // Ping inmediato al montar y recurrente cada 1200ms
    pingLoopbackDesktop();
    const timer = setInterval(pingLoopbackDesktop, 1200);

    return () => {
      cancelado = true;
      clearInterval(timer);
    };
  }, [esWidgetNativo, modoForzadoDesacoplado]);

  const [horizonte, setHorizonte] = useState<HorizonteAgenda>('HOY');
  const [modoVista, setModoVista] = useState<'RIEL' | 'CHECKLIST'>('CHECKLIST');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'TAREAS' | 'HABITOS' | 'VENCIDAS' | 'FINANZAS'>('TODOS');

  // Referencia para anclaje y auto-scroll centrado en el slot horario en curso
  const slotActualRef = useRef<HTMLDivElement | null>(null);

  // Estado de ventana Picture-in-Picture nativa
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // Hook unificado de datos y ritmo
  const { items, metricas, horaActual, fechaActual, toggleCompletar, cargando } = useDailySchedule(horizonte);

  // Auto-scroll centrado en el slot actual cuando se visualiza el Riel Horario en HOY
  useEffect(() => {
    if (cockpitAbierto && modoVista === 'RIEL' && horizonte === 'HOY' && !cargando) {
      const timer = setTimeout(() => {
        slotActualRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [cockpitAbierto, modoVista, horizonte, cargando]);

  // Filtrado de items según filtro secundario
  const itemsFiltrados = useMemo(() => {
    return items.filter((item) => {
      if (filtroTipo === 'TODOS') return true;
      if (filtroTipo === 'TAREAS') return item.tipo === 'TAREA';
      if (filtroTipo === 'HABITOS') return item.tipo === 'HABITO';
      if (filtroTipo === 'FINANZAS') return item.tipo === 'GASTO' || item.tipo === 'INGRESO' || item.tipo === 'CUOTA';
      if (filtroTipo === 'VENCIDAS') return item.estadoRitmo === 'VENCIDO_PASADO' && !item.completado;
      return true;
    });
  }, [items, filtroTipo]);

  // Completar rápido con aislamiento de propagación
  const handleToggle = async (item: DailyScheduleItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    await toggleCompletar(item);

    // Enviar snapshot al puente local si estamos en navegador web para actualizar Electron
    if (!esWidgetNativo) {
      syncManager.guardarSnapshotEnPuenteLocal().catch(() => {});
    }
  };

  // Motor de desacople a escritorio Always-on-Top (Document Picture-in-Picture con calce 100% y fallback)
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

        // Reset exhaustivo de html y body en Document PiP para calce exacto sin descalce azul
        pipWin.document.documentElement.style.margin = '0';
        pipWin.document.documentElement.style.padding = '0';
        pipWin.document.documentElement.style.width = '100%';
        pipWin.document.documentElement.style.height = '100%';
        pipWin.document.documentElement.style.overflow = 'hidden';
        pipWin.document.documentElement.className = 'dark';

        pipWin.document.body.style.margin = '0';
        pipWin.document.body.style.padding = '0';
        pipWin.document.body.style.width = '100vw';
        pipWin.document.body.style.height = '100vh';
        pipWin.document.body.style.backgroundColor = '#040711';
        pipWin.document.body.style.overflow = 'hidden';
        pipWin.document.body.className = 'bg-[#040711] text-slate-100 m-0 p-0 overflow-hidden w-full h-full select-none';

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

  // Altura base fija por cada hora en el lienzo tipo Calendar (64px * 24h = 1536px)
  const ALTURA_HORA_PX = 64;

  // Reloj reactivo dedicado con intervalo de 60 segundos para la línea viva 24H
  const [relojVivo, setRelojVivo] = useState<Date>(() => new Date());

  useEffect(() => {
    const actualizarReloj = () => setRelojVivo(new Date());
    actualizarReloj();
    const timer = setInterval(actualizarReloj, 60000);
    return () => clearInterval(timer);
  }, []);

  // Horas del Riel Horario Completo 24H (00:00 a 23:00) ininterrumpidas con Array.from({ length: 24 })
  const slotsHorarios = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);
  }, []);

  // Cálculo explícito de la posición en píxeles de la línea de tiempo actual desde las 00:00
  const ahora = relojVivo;
  const minutosTotales = ahora.getHours() * 60 + ahora.getMinutes();
  const topLineaActualPx = (minutosTotales / 60) * ALTURA_HORA_PX;

  // Etiqueta compacta de hora real con formato HH:mm AM/PM para el indicador en vivo
  const horaActualAmPm = useMemo(() => {
    const h24 = relojVivo.getHours();
    const mStr = String(relojVivo.getMinutes()).padStart(2, '0');
    const sufijo = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${String(h12).padStart(2, '0')}:${mStr} ${sufijo}`;
  }, [relojVivo]);

  // Motor de posicionamiento proporcional tipo Calendar 24H con distribución en columnas si hay solapamiento horario
  const bloquesCalendarPosicion = useMemo(() => {
    const parseMinutos = (hm: string): number => {
      const [hStr, mStr] = (hm || '00:00').split(':');
      const h = parseInt(hStr, 10) || 0;
      const m = parseInt(mStr, 10) || 0;
      return Math.min(1439, Math.max(0, h * 60 + m));
    };

    const rawBlocks = itemsFiltrados.map((item) => {
      const startMin = parseMinutos(item.horaInicio);
      const durMin = Math.max(20, item.duracionMinutos || 30);
      const endMin = Math.min(1440, startMin + durMin);
      const topPx = (startMin / 60) * ALTURA_HORA_PX;
      const heightPx = Math.max(28, (durMin / 60) * ALTURA_HORA_PX - 2);
      return {
        item,
        startMin,
        endMin,
        topPx,
        heightPx,
        colIndex: 0,
        totalCols: 1
      };
    });

    // Ordenar por minuto de inicio y luego por mayor duración
    rawBlocks.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

    // Agrupar bloques que se solapan en clusters para repartir el ancho proporcionalmente
    let cluster: typeof rawBlocks = [];
    let clusterMaxEnd = -1;

    const procesarCluster = (grupo: typeof rawBlocks) => {
      if (grupo.length === 0) return;
      const colsEnd: number[] = [];
      for (const b of grupo) {
        let placedCol = -1;
        for (let c = 0; c < colsEnd.length; c++) {
          if (colsEnd[c] <= b.startMin) {
            placedCol = c;
            colsEnd[c] = b.endMin;
            break;
          }
        }
        if (placedCol === -1) {
          placedCol = colsEnd.length;
          colsEnd.push(b.endMin);
        }
        b.colIndex = placedCol;
      }
      const numCols = Math.max(1, colsEnd.length);
      for (const b of grupo) {
        b.totalCols = numCols;
      }
    };

    for (const block of rawBlocks) {
      if (cluster.length === 0) {
        cluster.push(block);
        clusterMaxEnd = block.endMin;
      } else if (block.startMin < clusterMaxEnd) {
        cluster.push(block);
        if (block.endMin > clusterMaxEnd) {
          clusterMaxEnd = block.endMin;
        }
      } else {
        procesarCluster(cluster);
        cluster = [block];
        clusterMaxEnd = block.endMin;
      }
    }
    procesarCluster(cluster);

    return rawBlocks;
  }, [itemsFiltrados]);

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
      className={`flex flex-col bg-[#0B132B]/95 border border-slate-700/60 text-slate-100 shadow-2xl backdrop-blur-md select-none transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        modoForzadoDesacoplado || pipWindow || esWidgetNativo
          ? 'w-full h-full flex-1 rounded-2xl border overflow-hidden'
          : 'w-full md:w-[440px] h-[85vh] md:h-[680px] max-h-[85vh] rounded-t-3xl md:rounded-3xl border-t md:border'
      }`}
    >
      {/* 1. Cabecera Táctica Canónica con Región de Arrastre Libre */}
      <div
        style={DRAG_REGION_STYLE}
        className="px-4 py-3 border-b border-slate-700/60 bg-slate-950/80 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2" style={DRAG_REGION_STYLE}>
          <div className="relative w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0" style={NO_DRAG_REGION_STYLE}>
            <Gauge className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          </div>
          <div style={DRAG_REGION_STYLE}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-tight text-white uppercase">
                Cockpit Diario
              </span>
              <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60" style={NO_DRAG_REGION_STYLE}>
                {horaActual}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {metricas.completadasTotal} de {metricas.totalItems} cumplidas ({metricas.porcentajeTotal}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5" style={NO_DRAG_REGION_STYLE}>
          {/* Badge Ritmo Horario */}
          <div
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono tabular-nums font-bold flex items-center gap-1 ${colorRitmo}`}
            title="Porcentaje de avance sobre entidades programadas hasta este momento"
          >
            <Zap className="w-3 h-3" strokeWidth={1.75} />
            {metricas.porcentajeRitmo}%
          </div>

          {/* Botón Desacople Always-on-Top (disponible si no está desacoplado en PiP ni widget nativo) */}
          {!pipWindow && !esWidgetNativo && (
            <button
              type="button"
              onClick={desacoplarAEscritorio}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Desacoplar Cockpit a ventana flotante Always-on-Top en PC"
            >
              <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}

          {/* Botón Contraer a Píldora de Reposo / Minimizar */}
          <button
            type="button"
            onClick={() => {
              if (pipWindow) {
                pipWindow.close();
              } else {
                handleContraerCockpit();
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={modoForzadoDesacoplado ? "Contraer a widget en reposo" : "Cerrar Cockpit"}
          >
            <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
          </button>

          {/* Botón Salir de Modo Standalone / Cerrar Widget */}
          {(modoForzadoDesacoplado || esWidgetNativo) && (
            <button
              type="button"
              onClick={() => {
                if (esWidgetNativo && window.desktopWidget?.close) {
                  window.desktopWidget.close();
                } else if (onCerrarDesacoplado) {
                  onCerrarDesacoplado();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title={esWidgetNativo ? "Ocultar a la bandeja del sistema" : "Volver a la vista completa del Portal"}
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
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
        ) : modoVista === 'CHECKLIST' ? (
          /* ========================================================
             VISTA A: CHECKLIST TÁCTICO DIRECTO (OPACIDAD 40% Y TACHADO)
             ======================================================== */
          itemsFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-slate-500 border border-dashed border-slate-800/80 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mb-2" strokeWidth={1.75} />
              <span className="text-xs font-semibold text-slate-400">Sin entidades para este horizonte</span>
              <span className="text-[10px] text-slate-600 mt-0.5">Estás al día o cambia el filtro de vista</span>
            </div>
          ) : (
            <div className="space-y-2">
              {itemsFiltrados.map((item) => {
                const estaCompletado = item.completado;
                const esVencido = item.estadoRitmo === 'VENCIDO_PASADO' && !estaCompletado;
                const esFocus = item.estadoRitmo === 'FOCUS_ACTUAL' && !estaCompletado;
                const esHabito = item.tipo === 'HABITO';
                const esTarea = item.tipo === 'TAREA';
                const esIngreso = item.tipo === 'INGRESO';
                const esGasto = item.tipo === 'GASTO' || item.tipo === 'CUOTA';

                const bordeIzquierdoClase = estaCompletado
                  ? 'border-l-slate-600'
                  : esHabito
                  ? 'border-l-emerald-500'
                  : esTarea
                  ? 'border-l-indigo-500'
                  : esIngreso
                  ? 'border-l-emerald-400'
                  : 'border-l-rose-500';

                const badgeTipoClase = esHabito
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : esTarea
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                  : esIngreso
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                return (
                  <div
                    key={`${item.tipo}-${item.id}`}
                    onClick={(e) => handleToggle(item, e)}
                    className={`group relative flex items-start gap-3 pl-3 pr-3 py-2.5 rounded-xl border border-l-4 transition-all transition-opacity duration-200 cursor-pointer overflow-hidden ${bordeIzquierdoClase} ${
                      estaCompletado
                        ? 'bg-slate-900/30 border-slate-800/40 opacity-40'
                        : esFocus
                        ? 'bg-gradient-to-r from-sky-950/35 to-[#0D1526]/95 border-sky-500/50 shadow-[0_6px_18px_-4px_rgba(14,165,233,0.18)] hover:border-sky-400'
                        : esVencido
                        ? 'bg-gradient-to-r from-[#0B132B]/95 to-[#0D1526]/90 border-rose-500/35 hover:border-rose-400/60 hover:translate-y-[-1px]'
                        : 'bg-gradient-to-r from-[#0B132B]/95 to-[#0D1526]/90 border-slate-800/80 hover:border-sky-500/40 hover:translate-y-[-1px]'
                    }`}
                  >
                    {/* Checkbox responsivo tipo cuadrado redondeado con micro-animación de check */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(item, e);
                      }}
                      aria-label={estaCompletado ? `Desmarcar ${item.titulo}` : `Completar ${item.titulo}`}
                      className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
                        estaCompletado
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.45)] scale-100'
                          : 'bg-slate-900/80 border-slate-600/80 text-transparent group-hover:border-sky-400 group-hover:bg-sky-950/30 active:scale-90'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          estaCompletado ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                        }`}
                        strokeWidth={2.5}
                      />
                    </button>

                    {/* Cuerpo de la tarjeta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-xs font-semibold leading-snug break-words transition-all duration-200 ${
                            estaCompletado
                              ? 'line-through text-slate-500'
                              : esFocus
                              ? 'text-sky-200'
                              : 'text-slate-100 group-hover:text-white'
                          }`}
                        >
                          {item.titulo}
                        </span>

                        {/* Badge semántico de monto formateado para Gastos/Ingresos/Cuotas */}
                        {item.montoFormateado && (
                          <span
                            className={`shrink-0 px-1.5 py-0.5 rounded-md border font-mono tabular-nums text-[10px] font-bold ${
                              esIngreso
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {esIngreso ? `+${item.montoFormateado}` : `-${item.montoFormateado}`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[10px] font-mono tabular-nums text-slate-400">
                        {/* Badge semántico por tipo de ente con icono representativo */}
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold tracking-tight ${badgeTipoClase}`}
                        >
                          {esHabito ? (
                            <Flame className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                          ) : esTarea ? (
                            <FolderKanban className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                          ) : esIngreso ? (
                            <TrendingUp className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                          ) : esGasto ? (
                            <TrendingDown className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                          ) : (
                            <Wallet className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                          )}
                          <span>{item.codigoLegado || item.tipo}</span>
                        </span>

                        {/* Tiempo programado y duración estimada */}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300 font-mono tabular-nums">
                          <Clock className="w-2.5 h-2.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                          <span>
                            {item.horaInicio} - {item.horaFin} ({item.duracionMinutos}m)
                          </span>
                        </span>

                        {/* Categoría o Proyecto Padre */}
                        {item.categoria && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-900/60 border border-slate-800/70 truncate max-w-[130px] text-slate-300">
                            {item.categoria}
                          </span>
                        )}

                        {/* Prioridad en Tareas con badge Índigo/Zafiro */}
                        {esTarea && item.prioridad && (
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-bold">
                            {item.prioridad}
                          </span>
                        )}

                        {/* Estado explícito en Finanzas */}
                        {(esGasto || esIngreso) && item.estadoEntidad && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${
                              estaCompletado
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            }`}
                          >
                            {item.estadoEntidad}
                          </span>
                        )}

                        {/* Badge Focus actual */}
                        {esFocus && (
                          <span className="px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 text-[9px] animate-pulse">
                            EN CURSO
                          </span>
                        )}

                        {/* Badge Vencida */}
                        {esVencido && (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 text-[9px]">
                            VENCIDA
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ========================================================
             VISTA B: LIENZO TEMPORAL CONTINUO TIPO CALENDAR 24H (1536px)
             ======================================================== */
          <div
            id="cockpit-calendar-24h-canvas"
            className="relative min-h-[1536px] h-[1536px] border border-slate-800/60 rounded-2xl bg-[#040711]/95 overflow-hidden my-1 select-none"
            style={{ height: `${24 * ALTURA_HORA_PX}px`, minHeight: `${24 * ALTURA_HORA_PX}px` }}
          >
            {/* 1. Capa Base en Flujo Normal: 24 Horas Ininterrumpidas (00:00 a 23:00) con Array.from({ length: 24 }) */}
            <div className="relative w-full h-[1536px] min-h-[1536px] flex flex-col pointer-events-none">
              {Array.from({ length: 24 }, (_, idx) => {
                const slot = slotsHorarios[idx] || `${String(idx).padStart(2, '0')}:00`;
                const horaActualPad = String(relojVivo.getHours()).padStart(2, '0');
                const hSlot = slot.split(':')[0];
                const esHoraEnCurso = hSlot === horaActualPad;

                return (
                  <div
                    key={slot}
                    className={`flex items-stretch h-[64px] min-h-[64px] border-b border-slate-800/40 relative shrink-0 ${
                      esHoraEnCurso ? 'bg-sky-950/15' : ''
                    }`}
                    style={{ height: `${ALTURA_HORA_PX}px`, minHeight: `${ALTURA_HORA_PX}px` }}
                  >
                    {/* Eje izquierdo de marcas horarias (00:00 a 23:00) */}
                    <div className="w-16 shrink-0 pr-2.5 pt-1.5 border-r border-slate-800/60 flex items-start justify-end">
                      <span
                        className={`text-[10px] font-mono tabular-nums leading-none ${
                          esHoraEnCurso ? 'text-sky-400 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {slot}
                      </span>
                    </div>

                    {/* Guía intermedia tenue de media hora (:30) */}
                    <div className="flex-1 relative">
                      <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-slate-800/25" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Capa de Eventos Proporcionales Tipo Calendar (Posición y Altura según Minutos/Duración) */}
            <div className="absolute top-0 bottom-0 left-16 right-0">
              {bloquesCalendarPosicion.map(({ item, topPx, heightPx, colIndex, totalCols }) => {
                const estaCompletado = item.completado;
                const esFocus = item.estadoRitmo === 'FOCUS_ACTUAL' && !estaCompletado;
                const esHabito = item.tipo === 'HABITO';
                const esTarea = item.tipo === 'TAREA';
                const esIngreso = item.tipo === 'INGRESO';
                const esGasto = item.tipo === 'GASTO' || item.tipo === 'CUOTA';
                const widthPct = 100 / totalCols;
                const leftPct = colIndex * widthPct;
                const esCompacto = heightPx < 44;

                const bordeIzquierdoClase = estaCompletado
                  ? 'border-l-slate-600'
                  : esHabito
                  ? 'border-l-emerald-500'
                  : esTarea
                  ? 'border-l-indigo-500'
                  : esIngreso
                  ? 'border-l-emerald-400'
                  : 'border-l-rose-500';

                const badgeTipoClase = esHabito
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : esTarea
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                  : esIngreso
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                return (
                  <div
                    key={`cal-${item.tipo}-${item.id}`}
                    onClick={(e) => handleToggle(item, e)}
                    style={{
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                      left: `calc(${leftPct}% + 4px)`,
                      width: `calc(${widthPct}% - 8px)`
                    }}
                    title={`${item.titulo} · ${item.subtitulo} (${item.horaInicio} - ${item.horaFin})`}
                    className={`group absolute rounded-xl border border-l-4 px-2.5 py-1 text-xs cursor-pointer bg-[#0B132B]/90 backdrop-blur-sm border-slate-700/50 hover:scale-[1.01] hover:border-sky-400/60 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-150 overflow-hidden flex items-start justify-between gap-2 z-10 hover:z-20 ${bordeIzquierdoClase} ${
                      estaCompletado ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {/* Badge semántico por tipo de ente */}
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8.5px] font-mono tabular-nums font-bold shrink-0 border ${badgeTipoClase}`}
                        >
                          {esHabito ? (
                            <Flame className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                          ) : esTarea ? (
                            <FolderKanban className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                          ) : esIngreso ? (
                            <TrendingUp className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                          ) : esGasto ? (
                            <TrendingDown className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                          ) : (
                            <Wallet className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                          )}
                          <span>{item.codigoLegado || item.tipo}</span>
                        </span>

                        <span
                          className={`font-semibold truncate leading-tight transition-colors ${
                            esCompacto ? 'text-[10.5px]' : 'text-[11.5px]'
                          } ${
                            estaCompletado
                              ? 'line-through text-slate-500'
                              : esFocus
                              ? 'text-sky-200'
                              : 'text-slate-100 group-hover:text-white'
                          }`}
                        >
                          {item.titulo}
                        </span>

                        {/* Badge de monto formateado para Gastos/Ingresos/Cuotas */}
                        {item.montoFormateado && (
                          <span
                            className={`ml-auto shrink-0 px-1.5 py-0.2 rounded border font-mono tabular-nums text-[9px] font-bold ${
                              esIngreso
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {esIngreso ? `+${item.montoFormateado}` : `-${item.montoFormateado}`}
                          </span>
                        )}
                      </div>

                      {!esCompacto && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] font-mono tabular-nums text-slate-400 truncate">
                          <span className="text-slate-300">
                            {item.horaInicio} - {item.horaFin}
                          </span>
                          {item.categoria && (
                            <>
                              <span>·</span>
                              <span className="truncate">{item.categoria}</span>
                            </>
                          )}
                          {esTarea && item.prioridad && (
                            <>
                              <span>·</span>
                              <span className="text-indigo-300 font-semibold">{item.prioridad}</span>
                            </>
                          )}
                          {(esGasto || esIngreso) && item.estadoEntidad && (
                            <>
                              <span>·</span>
                              <span className={estaCompletado ? 'text-emerald-400' : 'text-amber-300'}>
                                {item.estadoEntidad}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Checkbox táctil con aislamiento de propagación */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(item, e);
                      }}
                      aria-label={estaCompletado ? `Desmarcar ${item.titulo}` : `Completar ${item.titulo}`}
                      className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
                        estaCompletado
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : 'bg-slate-950/80 border-slate-600/80 text-transparent group-hover:border-sky-400'
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 transition-transform duration-200 ${
                          estaCompletado ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                        }`}
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 3. Línea de Hora Actual en Vivo Global (Live Time Indicator 24H) */}
            <div
              id="cockpit-live-time-indicator"
              ref={slotActualRef}
              className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
              style={{ top: `${topLineaActualPx}px` }}
            >
              {/* Etiqueta digital de hora actual en el eje izquierdo (HH:mm AM/PM) */}
              <div className="w-16 shrink-0 pr-1.5 flex items-center justify-end">
                <span className="px-1.5 py-0.5 rounded-md bg-rose-600 border border-rose-400 text-white font-mono tabular-nums text-[9px] font-bold shadow-[0_0_12px_rgba(244,63,94,0.7)] whitespace-nowrap leading-none">
                  {horaActualAmPm}
                </span>
              </div>

              {/* Micro-punto radar vivo en la intersección del eje horario */}
              <span className="relative -ml-1.5 flex h-3 w-3 shrink-0 items-center justify-center z-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-85"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white/80 shadow-[0_0_10px_rgba(244,63,94,1)]"></span>
              </span>

              {/* Trazo horizontal luminoso continuo sobre todo el ancho del riel */}
              <div className="flex-1 h-[2px] bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.85)]" />
            </div>
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

  // MODO DESACOPLADO DIRECTO (cuando se renderiza en modo standalone / widget de escritorio ?mode=hud)
  if (modoForzadoDesacoplado) {
    // Si no está abierto y no hay PiP activo, renderizar la Cápsula Flotante en Reposo (Widget Pill)
    if (!cockpitAbierto && !pipWindow) {
      return (
        <div className={`h-screen w-screen ${esWidgetNativo ? 'bg-transparent p-0' : 'bg-[#040711] p-4'} flex items-center justify-center select-none overflow-hidden font-sans`}>
          <div
            onClick={handleAbrirCockpit}
            style={esWidgetNativo ? DRAG_REGION_STYLE : undefined}
            className="px-4 py-2 rounded-full bg-[#0a101f]/95 border border-sky-500/25 backdrop-blur-2xl shadow-[0_8px_30px_-4px_rgba(2,6,23,0.55),0_0_35px_-4px_rgba(56,189,248,0.18)] hover:shadow-[0_12px_40px_-4px_rgba(2,6,23,0.7),0_0_45px_0px_rgba(56,189,248,0.28)] hover:border-sky-400/40 flex items-center gap-3 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] active:scale-[0.97] cursor-pointer group select-none animate-in fade-in zoom-in-95"
            title="Expandir Cockpit de Ejecución Diaria"
          >
            {/* Glifo Técnico Maestro: Gauge + Micro-punto Radar de Actividad */}
            <div
              style={esWidgetNativo ? NO_DRAG_REGION_STYLE : undefined}
              className="relative flex items-center justify-center shrink-0"
            >
              <Gauge className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
            </div>

            {/* Reloj Actual */}
            <span
              style={esWidgetNativo ? NO_DRAG_REGION_STYLE : undefined}
              className="text-xs font-bold font-mono tabular-nums text-slate-100"
            >
              {horaActual}
            </span>

            {/* Semáforo de Ritmo */}
            <div
              style={esWidgetNativo ? NO_DRAG_REGION_STYLE : undefined}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold border ${colorRitmo}`}
            >
              {metricas.porcentajeRitmo}%
            </div>

            {/* Siguiente en turno */}
            {metricas.siguienteItem && (
              <div
                style={esWidgetNativo ? NO_DRAG_REGION_STYLE : undefined}
                className="flex items-center gap-1 max-w-[150px] truncate text-[11px] text-slate-300 font-sans border-l border-slate-800 pl-2"
              >
                <span className="truncate">{metricas.siguienteItem.titulo}</span>
              </div>
            )}

            {/* Micro-botón de apertura para garantizar activación rápida */}
            <button
              type="button"
              style={esWidgetNativo ? NO_DRAG_REGION_STYLE : undefined}
              onClick={(e) => {
                e.stopPropagation();
                handleAbrirCockpit();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition-colors"
              title="Abrir Cockpit"
            >
              <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`h-screen w-screen ${esWidgetNativo ? 'bg-transparent p-0' : 'bg-[#040711] p-2'} flex items-center justify-center font-sans select-none overflow-hidden`}>
        {pipWindow &&
          createPortal(
            <div className="w-screen h-screen max-w-full max-h-full flex flex-col bg-[#040711] p-2 box-border overflow-hidden">
              {cockpitContent}
            </div>,
            pipWindow.document.body
          )}
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

  // Si hay un widget nativo de escritorio activo en Windows y el Cockpit web no está abierto ni en PiP,
  // se oculta la cápsula web para evitar duplicidad visual en pantalla
  if (!esWidgetNativo && !modoForzadoDesacoplado && hayWidgetDeEscritorioActivo && !cockpitAbierto && !pipWindow) {
    return null;
  }

  // MODO NORMAL DE LA APLICACIÓN PRINCIPAL (con soporte Portal PiP si pipWindow está activo)
  return (
    <>
      {/* Montaje del Cockpit en ventana PiP Always-on-Top vía Portal con estiramiento 100% y fondo sin descalces */}
      {pipWindow &&
        createPortal(
          <div className="w-screen h-screen max-w-full max-h-full flex flex-col bg-[#040711] p-2 box-border overflow-hidden">
            {cockpitContent}
          </div>,
          pipWindow.document.body
        )}

      {/* A. CÁPSULA EN REPOSO (FLOATING PILL) */}
      {(!cockpitAbierto || pipWindow) && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            touchAction: 'none',
            ...(posicionWeb
              ? { left: `${posicionWeb.x}px`, top: `${posicionWeb.y}px`, bottom: 'auto', right: 'auto' }
              : {})
          }}
          className={`fixed ${!posicionWeb ? 'bottom-20 right-4 sm:bottom-6 sm:right-6 md:bottom-6 md:right-6' : ''} z-50 pointer-events-auto px-3.5 py-1.5 rounded-full bg-[#0a101f]/95 border border-sky-500/25 backdrop-blur-2xl shadow-[0_8px_30px_-4px_rgba(2,6,23,0.55),0_0_35px_-4px_rgba(56,189,248,0.18)] hover:shadow-[0_12px_40px_-4px_rgba(2,6,23,0.7),0_0_45px_0px_rgba(56,189,248,0.28)] hover:border-sky-400/40 flex items-center gap-2.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] cursor-grab active:cursor-grabbing group select-none`}
          title={pipWindow ? "Cockpit activo Always-on-Top (clic para enfocar)" : "Arrastrar para mover libremente / Clic para abrir Cockpit"}
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
