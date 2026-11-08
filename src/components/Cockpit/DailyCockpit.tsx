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
  X,
  Gauge,
  Zap,
  Flame,
  FolderKanban,
  Wallet,
  TrendingUp,
  TrendingDown,
  Check,
  Calendar,
  Play,
  Pause,
  RotateCcw,
  Briefcase,
  Sparkles,
  LayoutGrid,
  Minimize2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Bell,
  Plus,
  Target,
  Volume2
} from 'lucide-react';
import { db } from '../../db/db';
import {
  useDailySchedule,
  type HorizonteAgenda,
  type DailyScheduleItem
} from '../../hooks/useDailySchedule';
import { syncManager } from '../../services/syncManager';

const DRAG_REGION_STYLE: React.CSSProperties = { WebkitAppRegion: 'drag' } as unknown as React.CSSProperties;
const NO_DRAG_REGION_STYLE: React.CSSProperties = { WebkitAppRegion: 'no-drag' } as unknown as React.CSSProperties;

interface CockpitInternalErrorBoundaryProps {
  children: React.ReactNode;
}

interface CockpitInternalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class CockpitInternalErrorBoundary extends React.Component<
  CockpitInternalErrorBoundaryProps,
  CockpitInternalErrorBoundaryState
> {
  constructor(props: CockpitInternalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): CockpitInternalErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[DailyCockpit ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center p-6 bg-[#0B132B]/95 border border-slate-700/60 rounded-2xl text-slate-100 select-none shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
            <Gauge className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h4 className="text-sm font-bold font-mono uppercase text-rose-300 mb-1">
            Cockpit en Recuperación
          </h4>
          <p className="text-xs text-slate-400 text-center max-w-xs mb-3">
            Se aisló una excepción de datos. Los registros locales permanecen seguros.
          </p>
          <pre className="p-2.5 rounded-lg bg-black/60 border border-rose-500/20 text-[10px] font-mono text-rose-300 max-w-full overflow-auto mb-4">
            {this.state.error?.message || 'Error de datos'}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all cursor-pointer"
          >
            Reconectar Cockpit
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export interface DailyCockpitProps {
  modoForzadoDesacoplado?: boolean;
  onCerrarDesacoplado?: () => void;
}

export const DailyCockpit: React.FC<DailyCockpitProps> = ({
  modoForzadoDesacoplado = false,
  onCerrarDesacoplado
}) => {
  // FIX-COCKPIT-NATIVE-SIGNAL-RESTORE-119: Reconocimiento dual de entorno nativo Electron
  const esWidgetNativo = typeof window !== 'undefined' && (
    (window as any).IS_DESKTOP_WIDGET === true ||
    new URLSearchParams(window.location.search).get('widget') === 'desktop' ||
    new URLSearchParams(window.location.hash.replace(/^#/, '')).get('widget') === 'desktop' ||
    new URLSearchParams(window.location.search).get('mode') === 'hud' ||
    new URLSearchParams(window.location.hash.replace(/^#/, '')).get('mode') === 'hud'
  );

  // Estado de visibilidad y factor de forma (REQ-DESKTOP-05)
  // En modo widget nativo arranca en reposo (340x58) salvo que se pase ?state=open
  const [cockpitAbierto, setCockpitAbierto] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const getParam = (k: string) => searchParams.get(k) || hashParams.get(k);

      if (getParam('state') === 'open') return true;
      if (getParam('state') === 'rest') return false;
      if ((window as any).IS_DESKTOP_WIDGET === true || getParam('widget') === 'desktop') {
        return false; // Inicia discretamente como cápsula flotante compacta
      }
      if (getParam('mode') === 'hud') {
        return true;
      }
    }
    return modoForzadoDesacoplado;
  });

  // Coordinación inicial y reactiva de dimensiones con Electron
  useEffect(() => {
    if (esWidgetNativo && typeof window !== 'undefined' && window.desktopWidget) {
      if (cockpitAbierto) {
        window.desktopWidget.expand();
      } else {
        window.desktopWidget.collapse();
      }
    }
  }, [esWidgetNativo, cockpitAbierto]);

  // Modo de Enfoque Activo (Deep Work / Admin / Recarga) (REQ-DESKTOP-05)
  const [modoEnfoque, setModoEnfoque] = useState<'DEEP_WORK' | 'ADMIN' | 'RECARGA'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pmo_modo_enfoque') as any) || 'DEEP_WORK';
    }
    return 'DEEP_WORK';
  });

  // Temporizador Pomodoro con Barra Ultra-Fina (sincronizado con modo de enfoque inicial - REQ-DESKTOP-08)
  const duracionInicialPomodoro = modoEnfoque === 'DEEP_WORK' ? 50 * 60 : modoEnfoque === 'ADMIN' ? 25 * 60 : 15 * 60;
  const [pomodoroSegundos, setPomodoroSegundos] = useState(duracionInicialPomodoro);
  const [pomodoroCorriendo, setPomodoroCorriendo] = useState(false);
  const [pomodoroTotal, setPomodoroTotal] = useState(duracionInicialPomodoro);
  const timerPomodoroRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Micro-input para tiempo personalizado (1-180 min) en Pomodoro (REQ-DESKTOP-13 Paso 1)
  const [customMinutosAbierto, setCustomMinutosAbierto] = useState(false);
  const [inputMinutosCustom, setInputMinutosCustom] = useState('45');

  const handleAplicarMinutosCustom = () => {
    const min = parseInt(inputMinutosCustom, 10);
    if (!isNaN(min) && min >= 1 && min <= 180) {
      handleSetPresetPomodoro(min);
    }
    setCustomMinutosAbierto(false);
  };

  // Estado y Sistema de Alerta Multisensorial Pomodoro (REQ-DESKTOP-14 / REQ-DESKTOP-15)
  const [tiempoExpirado, setTiempoExpirado] = useState(false);

  // Selector de Perfiles de Alarma Sonora (REQ-DESKTOP-17 Paso 2)
  const [perfilAlarma, setPerfilAlarma] = useState<'zen' | 'digital' | 'radar'>(() => {
    if (typeof window !== 'undefined') {
      const guardado = localStorage.getItem('pmo_perfil_alarma');
      if (guardado === 'zen' || guardado === 'digital' || guardado === 'radar') return guardado;
    }
    return 'zen';
  });

  const handleCambiarPerfilAlarma = (perfil: 'zen' | 'digital' | 'radar') => {
    setPerfilAlarma(perfil);
    try {
      localStorage.setItem('pmo_perfil_alarma', perfil);
    } catch {}
  };

  // Métrica de Bloques Diarios de Foco (REQ-DESKTOP-17 Paso 3)
  const obtenerKeyFocoHoy = () => {
    const hoyStr = new Date().toISOString().split('T')[0];
    return `pmo_foco_metric_${hoyStr}`;
  };

  const [metricasFocoHoy, setMetricasFocoHoy] = useState<{ bloques: number; minutos: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(obtenerKeyFocoHoy());
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            bloques: Number(parsed.bloques) || 0,
            minutos: Number(parsed.minutos) || 0
          };
        }
      } catch {}
    }
    return { bloques: 0, minutos: 0 };
  });

  const registrarBloqueCompletado = (duracionSegundos: number) => {
    try {
      const minBloque = Math.max(1, Math.round(duracionSegundos / 60));
      const key = obtenerKeyFocoHoy();
      const actual = (() => {
        try {
          const raw = localStorage.getItem(key);
          if (raw) return JSON.parse(raw);
        } catch {}
        return { bloques: 0, minutos: 0 };
      })();
      const actualizado = {
        bloques: (Number(actual.bloques) || 0) + 1,
        minutos: (Number(actual.minutos) || 0) + minBloque
      };
      localStorage.setItem(key, JSON.stringify(actualizado));
      setMetricasFocoHoy(actualizado);
    } catch (e) {
      console.warn('[Cockpit FocusMetric] Error al persistir bloque de foco:', e);
    }
  };

  // Alarma Sonora Nativa mediante Web Audio API con perfiles y desbloqueo explícito en Chromium (REQ-DESKTOP-17 Paso 2)
  const reproducirAlarmaFin = async () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // En Chromium / Electron, si el AudioContext nace suspendido por Autoplay Policy, reanudarlo
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const ahora = ctx.currentTime;

      if (perfilAlarma === 'digital') {
        // 'digital': Doble beep rápido tipo cronómetro clásico (2000Hz)
        [0, 0.12].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(2000, ahora + offset);

          gain.gain.setValueAtTime(0.0001, ahora + offset);
          gain.gain.linearRampToValueAtTime(0.22, ahora + offset + 0.01);
          gain.gain.setValueAtTime(0.22, ahora + offset + 0.07);
          gain.gain.linearRampToValueAtTime(0.0001, ahora + offset + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ahora + offset);
          osc.stop(ahora + offset + 0.09);
        });
      } else if (perfilAlarma === 'radar') {
        // 'radar': Tres pulsos tácticos de advertencia (520Hz -> 650Hz)
        [
          { freq: 520, t: 0 },
          { freq: 580, t: 0.14 },
          { freq: 650, t: 0.28 }
        ].forEach(({ freq, t }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ahora + t);

          gain.gain.setValueAtTime(0.0001, ahora + t);
          gain.gain.exponentialRampToValueAtTime(0.25, ahora + t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ahora + t + 0.11);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ahora + t);
          osc.stop(ahora + t + 0.12);
        });
      } else {
        // 'zen': Tríada armónica brillante (880Hz -> 1046Hz -> 1318.5Hz)
        const frecuencias = [880, 1046, 1318.5];
        frecuencias.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ahora + idx * 0.16);

          gain.gain.setValueAtTime(0.0001, ahora + idx * 0.16);
          gain.gain.exponentialRampToValueAtTime(0.35, ahora + idx * 0.16 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ahora + idx * 0.16 + 0.5);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ahora + idx * 0.16);
          osc.stop(ahora + idx * 0.16 + 0.55);
        });
      }

      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, 1500);
    } catch (err) {
      console.warn('[Cockpit Audio] No se pudo reproducir la alarma:', err);
    }
  };

  // Notificación Nativa de Sistema al Finalizar Bloque
  const lanzarNotificacionExpirado = () => {
    try {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission === 'granted') {
        new Notification('Cockpit: Tiempo Cumplido', {
          body: 'Tu bloque de enfoque ha finalizado con éxito.'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification('Cockpit: Tiempo Cumplido', {
              body: 'Tu bloque de enfoque ha finalizado con éxito.'
            });
          }
        });
      }
    } catch (e) {
      console.warn('[Cockpit Notification] Error al emitir notificación:', e);
    }
  };

  // Motor Atómico de Temporizador Pomodoro con Limpieza Inmediata de Intervalo (REQ-DESKTOP-15 Paso 1 / REQ-DESKTOP-17 Paso 3)
  useEffect(() => {
    if (!pomodoroCorriendo) {
      if (timerPomodoroRef.current) {
        clearInterval(timerPomodoroRef.current);
        timerPomodoroRef.current = null;
      }
      return;
    }

    if (pomodoroSegundos <= 0) {
      setPomodoroCorriendo(false);
      setTiempoExpirado(true);
      return;
    }

    timerPomodoroRef.current = setInterval(() => {
      setPomodoroSegundos((prev) => {
        if (prev <= 1) {
          if (timerPomodoroRef.current) {
            clearInterval(timerPomodoroRef.current);
            timerPomodoroRef.current = null;
          }
          // Desacoplado inmediato fuera del updater puro de React para garantizar persistencia y audio atómico
          setTimeout(() => {
            setPomodoroCorriendo(false);
            setTiempoExpirado(true);
            registrarBloqueCompletado(pomodoroTotal);
            reproducirAlarmaFin();
            lanzarNotificacionExpirado();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerPomodoroRef.current) {
        clearInterval(timerPomodoroRef.current);
        timerPomodoroRef.current = null;
      }
    };
  }, [pomodoroCorriendo, pomodoroTotal]);

  const handleTogglePomodoro = () => {
    if (tiempoExpirado) {
      setTiempoExpirado(false);
      handleResetPomodoro();
      return;
    }
    setPomodoroCorriendo((p) => !p);
  };
  const handleResetPomodoro = () => {
    if (timerPomodoroRef.current) {
      clearInterval(timerPomodoroRef.current);
      timerPomodoroRef.current = null;
    }
    setPomodoroCorriendo(false);
    setTiempoExpirado(false);
    setPomodoroSegundos(pomodoroTotal);
  };
  const handleSetPresetPomodoro = (minutos: number) => {
    if (timerPomodoroRef.current) {
      clearInterval(timerPomodoroRef.current);
      timerPomodoroRef.current = null;
    }
    setPomodoroTotal(minutos * 60);
    setPomodoroSegundos(minutos * 60);
    setPomodoroCorriendo(false);
    setTiempoExpirado(false);
    if (minutos === 50) {
      setModoEnfoque('DEEP_WORK');
      try { localStorage.setItem('pmo_modo_enfoque', 'DEEP_WORK'); } catch {}
    } else if (minutos === 25) {
      setModoEnfoque('ADMIN');
      try { localStorage.setItem('pmo_modo_enfoque', 'ADMIN'); } catch {}
    } else if (minutos === 15) {
      setModoEnfoque('RECARGA');
      try { localStorage.setItem('pmo_modo_enfoque', 'RECARGA'); } catch {}
    }
  };

  const handleCambiarEnfoque = (modo: 'DEEP_WORK' | 'ADMIN' | 'RECARGA') => {
    setModoEnfoque(modo);
    try {
      localStorage.setItem('pmo_modo_enfoque', modo);
    } catch {}
    if (modo === 'DEEP_WORK') {
      setPomodoroTotal(50 * 60);
      setPomodoroSegundos(50 * 60);
      setPomodoroCorriendo(false);
    } else if (modo === 'ADMIN') {
      setPomodoroTotal(25 * 60);
      setPomodoroSegundos(25 * 60);
      setPomodoroCorriendo(false);
    } else {
      setPomodoroTotal(15 * 60);
      setPomodoroSegundos(15 * 60);
      setPomodoroCorriendo(false);
    }
  };

  const tiempoPomodoroStr = useMemo(() => {
    const m = Math.floor(pomodoroSegundos / 60);
    const s = pomodoroSegundos % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [pomodoroSegundos]);

  const pctPomodoro = useMemo(() => {
    return Math.min(100, Math.max(0, ((pomodoroTotal - pomodoroSegundos) / pomodoroTotal) * 100));
  }, [pomodoroTotal, pomodoroSegundos]);

  // Pestaña activa del Dock desplegado: 'BENTO' vs 'AGENDA'
  const [tabDock, setTabDock] = useState<'BENTO' | 'AGENDA'>('BENTO');

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

  // Filtrado de items según filtro secundario con optional chaining defensivo
  const itemsFiltrados = useMemo(() => {
    return (items || []).filter((item) => {
      if (!item) return false;
      if (filtroTipo === 'TODOS') return true;
      if (filtroTipo === 'TAREAS') return item.tipo === 'TAREA';
      if (filtroTipo === 'HABITOS') return item.tipo === 'HABITO';
      if (filtroTipo === 'FINANZAS') return item.tipo === 'GASTO' || item.tipo === 'INGRESO' || item.tipo === 'CUOTA';
      if (filtroTipo === 'VENCIDAS') return item.estadoRitmo === 'VENCIDO_PASADO' && !item.completado;
      return true;
    });
  }, [items, filtroTipo]);

  // Top 3 Tareas Clave para Bento Card Focus (REQ-DESKTOP-05)
  const tresTareasClave = useMemo(() => {
    return (items || []).filter((i) => i && i.tipo === 'TAREA').slice(0, 3);
  }, [items]);

  // Estado para Detalle Expandible de Tareas Clave (REQ-DESKTOP-13 Paso 2)
  const [tareaDetalleSeleccionada, setTareaDetalleSeleccionada] = useState<DailyScheduleItem | null>(null);
  const tareaDetalleActualizada = useMemo(() => {
    if (!tareaDetalleSeleccionada) return null;
    return (items || []).find((i) => i.id === tareaDetalleSeleccionada.id) || tareaDetalleSeleccionada;
  }, [items, tareaDetalleSeleccionada]);

  // Hábitos de Hoy para Bento Card Radar (REQ-DESKTOP-05)
  const habitosHoy = useMemo(() => {
    return (items || []).filter((i) => i && i.tipo === 'HABITO');
  }, [items]);
  const completadosHabitos = useMemo(() => habitosHoy.filter((h) => h.completado).length, [habitosHoy]);
  const totalHabitos = habitosHoy.length;

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

  // Quick-Add de Tareas Clave (REQ-DESKTOP-17 Paso 1)
  const [quickAddTareaAbierto, setQuickAddTareaAbierto] = useState(false);
  const [inputQuickAddTarea, setInputQuickAddTarea] = useState('');
  const [guardandoTareaRapida, setGuardandoTareaRapida] = useState(false);

  const handleCrearTareaRapida = async () => {
    const texto = inputQuickAddTarea.trim();
    if (!texto || guardandoTareaRapida) return;
    try {
      setGuardandoTareaRapida(true);
      const totalTareas = await db.tareas.count();
      const nuevoCodigoTar = `TAR-${String(totalTareas + 1).padStart(3, '0')}`;
      const nuevaTareaId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tar-${Date.now()}`;
      const fechaHoy = new Date().toISOString().split('T')[0];

      await db.tareas.add({
        id: nuevaTareaId,
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: nuevoCodigoTar,
        nombre_tarea_actividad: texto,
        estado_tarea: '02_Por_Hacer',
        prioridad_eisenhower: 'DO_FIRST',
        nivel_energia_requerido: 'Medio',
        fecha_programada: fechaHoy,
        horas_estimadas: 1,
        horas_reales: 0,
        sync_status: 'pending',
        updated_at: new Date().toISOString()
      });

      if (!esWidgetNativo) {
        syncManager.guardarSnapshotEnPuenteLocal().catch(() => {});
      }

      setInputQuickAddTarea('');
      setQuickAddTareaAbierto(false);
    } catch (err) {
      console.error('[Cockpit QuickAdd] Error al crear tarea rápida:', err);
    } finally {
      setGuardandoTareaRapida(false);
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
    const parseMinutos = (hm?: string | null): number => {
      if (!hm || typeof hm !== 'string' || !hm.includes(':')) return 0;
      const [hStr, mStr] = hm.split(':');
      const h = parseInt(hStr, 10) || 0;
      const m = parseInt(mStr, 10) || 0;
      return Math.min(1439, Math.max(0, h * 60 + m));
    };

    const rawBlocks = (itemsFiltrados || [])
      .filter((item): item is DailyScheduleItem => Boolean(item))
      .map((item) => {
        const startMin = parseMinutos(item?.horaInicio);
        const durMin = Math.max(20, Number(item?.duracionMinutos) || 30);
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

  // Semáforo dinámico de color según ritmo horario con optional chaining defensivo
  const colorRitmo = useMemo(() => {
    const pct = metricas?.porcentajeRitmo ?? 100;
    if (pct >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30';
    if (pct >= 40) return 'text-sky-400 border-sky-500/30 bg-sky-950/30';
    return 'text-rose-400 border-rose-500/30 bg-rose-950/30';
  }, [metricas?.porcentajeRitmo]);

  // Contenido interno del Cockpit (Dock Aeroespacial Bento - REQ-DESKTOP-05)
  const cockpitContent = (
    <div
      className={`flex flex-col bg-[#080D1A] border border-cyan-500/30 text-slate-100 shadow-[0_0_35px_rgba(6,182,212,0.18),0_20px_50px_rgba(2,6,23,0.9)] select-none transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden font-sans ${
        modoForzadoDesacoplado || pipWindow || esWidgetNativo
          ? 'w-full h-full flex-1 rounded-2xl'
          : 'w-full md:w-[440px] h-[92dvh] md:h-[680px] max-h-[92dvh] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-0 rounded-t-3xl md:rounded-3xl border'
      }`}
    >
      {/* 1. Cabecera Aeroespacial Compacta con Selector de Energía y Pestañas */}
      <div
        style={DRAG_REGION_STYLE}
        className="px-3 py-2 border-b border-cyan-500/20 bg-[#080D1A] flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing"
      >
        {/* Lado Izquierdo: Glifo Técnico + Título + Selector de Modo de Energía */}
        <div className="flex items-center gap-1.5" style={DRAG_REGION_STYLE}>
          <button
            type="button"
            onClick={handleContraerCockpit}
            style={NO_DRAG_REGION_STYLE}
            className="relative w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/25 transition-colors cursor-pointer shrink-0"
            title="Replegar Cockpit a cápsula"
          >
            <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" strokeWidth={1.75} />
            <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
            </span>
          </button>

          <div className="flex items-center gap-1" style={NO_DRAG_REGION_STYLE}>
            <button
              type="button"
              onClick={() => handleCambiarEnfoque('DEEP_WORK')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                modoEnfoque === 'DEEP_WORK'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="Modo Deep Work (50m Focus)"
            >
              <Zap className="w-3 h-3 text-cyan-400" strokeWidth={1.75} />
              Deep
            </button>
            <button
              type="button"
              onClick={() => handleCambiarEnfoque('ADMIN')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                modoEnfoque === 'ADMIN'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="Modo Admin (25m Focus)"
            >
              <Briefcase className="w-3 h-3 text-indigo-400" strokeWidth={1.75} />
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleCambiarEnfoque('RECARGA')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                modoEnfoque === 'RECARGA'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="Modo Recarga (15m)"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
              Recarga
            </button>
          </div>
        </div>

        {/* Lado Derecho: Toggle Bento/Agenda + Minimizar + Cerrar */}
        <div className="flex items-center gap-1" style={NO_DRAG_REGION_STYLE}>
          {/* Switch Dock Tab */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setTabDock('BENTO')}
              className={`p-1 rounded text-xs transition-all cursor-pointer ${
                tabDock === 'BENTO'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="Vista Bento Táctica"
            >
              <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setTabDock('AGENDA')}
              className={`p-1 rounded text-xs transition-all cursor-pointer ${
                tabDock === 'AGENDA'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="Vista Agenda 24H"
            >
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Botón Desacople Always-on-Top PiP (cuando no es widget nativo ni PiP) */}
          {!pipWindow && !esWidgetNativo && (
            <button
              type="button"
              onClick={desacoplarAEscritorio}
              className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Desacoplar Cockpit a ventana flotante Always-on-Top en PC"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}

          {/* Botón Contraer a Píldora */}
          <button
            type="button"
            onClick={() => {
              if (pipWindow) {
                pipWindow.close();
              } else {
                handleContraerCockpit();
              }
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Replegar a cápsula flotante"
          >
            <Minimize2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>

          {/* Botón Salir / Ocultar a Bandeja */}
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
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title={esWidgetNativo ? "Ocultar a la bandeja del sistema" : "Cerrar"}
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {tabDock === 'BENTO' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {/* Banner Prominente de Fin de Bloque Pomodoro (REQ-DESKTOP-14 Paso 3) */}
          {tiempoExpirado && (
            <div className="rounded-xl p-3 bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-amber-500/20 border border-amber-500/50 shadow-[0_0_20px_rgba(251,191,36,0.3)] animate-pulse flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/30 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                  <Bell className="w-4 h-4 animate-bounce" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-200 uppercase font-mono tracking-wide">
                    ¡Bloque Finalizado!
                  </h4>
                  <p className="text-[10px] text-amber-300/80 font-sans">
                    Tiempo de enfoque cumplido con éxito.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTiempoExpirado(false);
                  handleResetPomodoro();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                Reiniciar
              </button>
            </div>
          )}

          {/* Bento Card 1: Pomodoro Focus Timer con Presets y Tiempo Personalizado (REQ-DESKTOP-13 Paso 1) */}
          <div className="rounded-xl p-3 bg-[#0D1526] border border-slate-800/60 hover:border-cyan-500/30 transition-all shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    tiempoExpirado ? 'bg-amber-400' : pomodoroCorriendo ? 'bg-cyan-400' : 'bg-slate-500'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    tiempoExpirado ? 'bg-amber-400' : pomodoroCorriendo ? 'bg-cyan-400' : 'bg-slate-500'
                  }`}></span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {tiempoExpirado ? '¡Tiempo Cumplido!' : pomodoroCorriendo ? 'Sesión en Curso' : 'Timer de Enfoque'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {customMinutosAbierto ? (
                  <div className="flex items-center gap-1 bg-slate-950/90 p-0.5 rounded-lg border border-cyan-500/40">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={inputMinutosCustom}
                      onChange={(e) => setInputMinutosCustom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAplicarMinutosCustom();
                        if (e.key === 'Escape') setCustomMinutosAbierto(false);
                      }}
                      autoFocus
                      className="w-10 px-1 py-0.5 text-[9px] font-mono tabular-nums bg-transparent text-cyan-300 text-center outline-none"
                      placeholder="min"
                    />
                    <button
                      type="button"
                      onClick={handleAplicarMinutosCustom}
                      className="p-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition-colors cursor-pointer"
                      title="Confirmar"
                    >
                      <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomMinutosAbierto(false)}
                      className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-2.5 h-2.5" strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSetPresetPomodoro(50)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums transition-all cursor-pointer ${
                        pomodoroTotal === 50 * 60 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      50m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetPomodoro(25)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums transition-all cursor-pointer ${
                        pomodoroTotal === 25 * 60 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      25m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetPomodoro(15)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums transition-all cursor-pointer ${
                        pomodoroTotal === 15 * 60 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      15m
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomMinutosAbierto(true)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-all flex items-center gap-0.5 cursor-pointer ${
                        ![50 * 60, 25 * 60, 15 * 60].includes(pomodoroTotal)
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Tiempo personalizado (1-180 min)"
                    >
                      <SlidersHorizontal className="w-2.5 h-2.5" strokeWidth={1.75} />
                      <span>{![50 * 60, 25 * 60, 15 * 60].includes(pomodoroTotal) ? `${Math.round(pomodoroTotal / 60)}m` : 'Custom'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl font-mono tabular-nums font-bold tracking-tight ${
                tiempoExpirado ? 'text-amber-300 animate-pulse' : 'text-cyan-300'
              }`}>
                {tiempoExpirado ? '¡00:00 HECHO!' : tiempoPomodoroStr}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleTogglePomodoro}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    tiempoExpirado
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.4)] animate-pulse'
                      : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  }`}
                >
                  {tiempoExpirado ? (
                    <>
                      <RotateCcw className="w-3 h-3" strokeWidth={2.5} />
                      Reiniciar
                    </>
                  ) : pomodoroCorriendo ? (
                    <>
                      <Pause className="w-3 h-3" strokeWidth={2.5} />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" strokeWidth={2.5} />
                      Iniciar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleResetPomodoro}
                  className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Reiniciar Pomodoro"
                >
                  <RotateCcw className="w-3 h-3" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Barra de progreso ultra-fina (h-1.5) con gradiente cian a índigo */}
            <div className="w-full h-1.5 rounded-full bg-slate-950/80 border border-slate-800/80 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 transition-all duration-300"
                style={{ width: `${pctPomodoro}%` }}
              />
            </div>

            {/* Métrica de Bloques Diarios y Selector de Perfiles de Alarma (REQ-DESKTOP-17 Pasos 2 y 3) */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <Target className="w-3 h-3 text-cyan-400 shrink-0" strokeWidth={1.75} />
                <span>
                  <strong className="text-cyan-300 font-mono tabular-nums">{metricasFocoHoy.bloques}</strong> bloques completados
                  {' • '}
                  <strong className="text-slate-200 font-mono tabular-nums">{metricasFocoHoy.minutos}</strong> min de foco
                </span>
              </div>
              <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/80">
                <Volume2 className="w-2.5 h-2.5 text-slate-500 ml-0.5 shrink-0" strokeWidth={1.75} />
                {(['zen', 'digital', 'radar'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleCambiarPerfilAlarma(p)}
                    className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono transition-all cursor-pointer ${
                      perfilAlarma === p
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-slate-500 hover:text-slate-300 border border-transparent'
                    }`}
                    title={`Perfil de alarma: ${p}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bento Card 2: Tira de las 3 Tareas Clave con Detalle Expandible y Quick-Add (REQ-DESKTOP-13 / REQ-DESKTOP-17 Paso 1) */}
          <div className="rounded-xl p-3 bg-[#0D1526] border border-slate-800/60 hover:border-cyan-500/30 transition-all shadow-md">
            {tareaDetalleActualizada ? (
              /* Vista de Detalle Interna de Tarea Clave */
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setTareaDetalleSeleccionada(null)}
                    className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Volver a tareas</span>
                  </button>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Detalle de Tarea
                  </span>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(tareaDetalleActualizada, e);
                    }}
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      tareaDetalleActualizada.completado
                        ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-950/80 border-slate-700 hover:border-cyan-400 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-semibold leading-snug ${tareaDetalleActualizada.completado ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                      {tareaDetalleActualizada.titulo}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] font-mono">
                      {tareaDetalleActualizada.proyectoCodigo && (
                        <span className="px-1.5 py-0.2 rounded bg-sky-950/60 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                          <Briefcase className="w-2.5 h-2.5" />
                          {tareaDetalleActualizada.proyectoCodigo}
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {tareaDetalleActualizada.duracionMinutos || 30} min
                      </span>
                      {tareaDetalleActualizada.prioridad && (
                        <span className="px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                          {tareaDetalleActualizada.prioridad}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción / Notas de la tarea */}
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 max-h-32 overflow-y-auto scrollbar-thin">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Descripción y Notas
                  </span>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                    {(tareaDetalleActualizada.raw as any)?.notas ||
                      (tareaDetalleActualizada.raw as any)?.descripcion ||
                      tareaDetalleActualizada.subtitulo ||
                      'Sin notas registradas para esta tarea.'}
                  </p>
                </div>
              </div>
            ) : (
              /* Lista Top 3 Tareas Clave con trigger de detalle y Quick-Add */
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400" strokeWidth={2} />
                    Foco Diario (Top 3)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickAddTareaAbierto((v) => !v)}
                      className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Crear nueva tarea rápida"
                    >
                      <Plus className="w-3 h-3" strokeWidth={2} />
                    </button>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums font-bold bg-cyan-950/50 text-cyan-300 border border-cyan-500/30">
                      {tresTareasClave.filter((t) => t.completado).length} / {tresTareasClave.length}
                    </span>
                  </div>
                </div>

                {/* Campo Inline de Creación Rápida (REQ-DESKTOP-17 Paso 1) */}
                {quickAddTareaAbierto && (
                  <div className="mb-2 p-1.5 rounded-lg bg-slate-950/90 border border-cyan-500/40 flex items-center gap-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={inputQuickAddTarea}
                      onChange={(e) => setInputQuickAddTarea(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCrearTareaRapida();
                        if (e.key === 'Escape') {
                          setInputQuickAddTarea('');
                          setQuickAddTareaAbierto(false);
                        }
                      }}
                      autoFocus
                      placeholder="Nueva tarea clave..."
                      className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none px-1"
                    />
                    <button
                      type="button"
                      onClick={handleCrearTareaRapida}
                      disabled={!inputQuickAddTarea.trim() || guardandoTareaRapida}
                      className="px-2 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-[10px] font-mono transition cursor-pointer"
                    >
                      Enter
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInputQuickAddTarea('');
                        setQuickAddTareaAbierto(false);
                      }}
                      className="p-0.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                      title="Cancelar (Esc)"
                    >
                      <X className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  {tresTareasClave.length === 0 ? (
                    <div className="text-center py-2.5 text-xs text-slate-400 font-mono">
                      Sin tareas prioritarias para hoy
                    </div>
                  ) : (
                    tresTareasClave.map((tarea) => {
                      return (
                        <div
                          key={tarea.id}
                          onClick={() => setTareaDetalleSeleccionada(tarea)}
                          className={`group flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                            tarea.completado
                              ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                              : 'bg-slate-900/60 border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/90'
                          }`}
                          title="Clic para ver detalle de la tarea"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggle(tarea, e);
                              }}
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                tarea.completado
                                  ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                                  : 'bg-slate-950/80 border-slate-700 group-hover:border-cyan-400 text-transparent'
                              }`}
                            >
                              <Check className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                            <span
                              className={`text-xs truncate transition-all ${
                                tarea.completado ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white font-medium'
                              }`}
                            >
                              {tarea.titulo}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono tabular-nums text-slate-400">
                              {tarea.horaInicio || 'Hoy'}
                            </span>
                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Bento Card 3: Hábitos Personales en Cuadrícula Compacta (REQ-DESKTOP-13 Paso 3) */}
          <div className="rounded-xl p-3 bg-[#0D1526] border border-slate-800/60 hover:border-cyan-500/30 transition-all shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.75} />
                Hábitos Personales
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums font-bold bg-cyan-950/50 text-cyan-300 border border-cyan-500/30">
                  {completadosHabitos} / {totalHabitos} completados
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums font-bold border ${colorRitmo}`}>
                  {metricas?.porcentajeRitmo ?? 100}%
                </span>
              </div>
            </div>

            {/* Layout Cuadrícula Compacta 2 columnas */}
            {habitosHoy.length === 0 ? (
              <div className="text-center w-full py-3 text-xs text-slate-400 font-mono">
                No hay hábitos configurados para hoy
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {habitosHoy.slice(0, 8).map((habito) => {
                  const estaCompletado = habito.completado;
                  return (
                    <button
                      key={habito.id}
                      type="button"
                      onClick={() => handleToggle(habito)}
                      className={`p-2 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                        estaCompletado
                          ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                          : 'bg-[#0A101D] border-slate-800 hover:border-slate-700 hover:bg-[#0D1526]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span
                          className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs ${
                            estaCompletado ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          <Flame className="w-3 h-3 text-amber-400" strokeWidth={1.75} />
                        </span>
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                            estaCompletado
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_6px_rgba(6,182,212,0.5)]'
                              : 'border-slate-700 bg-slate-950/60 text-transparent'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-medium leading-tight line-clamp-2 transition-all ${
                          estaCompletado ? 'line-through text-slate-400' : 'text-slate-200'
                        }`}
                      >
                        {habito.titulo}
                      </span>
                      {habito.horaInicio && (
                        <span className="text-[9px] font-mono tabular-nums text-slate-500 mt-1">
                          {habito.horaInicio}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. Barra de Control Táctico Bento (Horizonte + Modo + Filtros) */}
          <div className="px-3.5 py-2.5 bg-[#080D1A] border-b border-slate-800/60 flex flex-col gap-2 shrink-0 backdrop-blur-md">
            {/* Fila Superior: Selector de Horizonte Bento */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-[#040711]/90 p-1 rounded-xl border border-slate-800/80 w-full">
                <button
                  type="button"
                  onClick={() => setHorizonte('HOY')}
                  className={`flex-1 py-1 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                    horizonte === 'HOY'
                      ? 'bg-cyan-950/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setHorizonte('MANANA')}
                  className={`flex-1 py-1 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                    horizonte === 'MANANA'
                      ? 'bg-cyan-950/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  Mañana
                </button>
                <button
                  type="button"
                  onClick={() => setHorizonte('SEMANA')}
                  className={`flex-1 py-1 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                    horizonte === 'SEMANA'
                      ? 'bg-cyan-950/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  Semana
                </button>
              </div>
            </div>

            {/* Fila Media: Modo de Vista + Badge Turno Siguiente */}
            <div className="flex items-center justify-between gap-2">
              {/* Switch Modo Vista */}
              <div className="flex items-center gap-1 bg-[#040711]/90 p-0.5 rounded-xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModoVista('CHECKLIST')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                    modoVista === 'CHECKLIST'
                      ? 'bg-cyan-950/30 text-cyan-300 font-semibold border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <ListTodo className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Checklist
                </button>
                <button
                  type="button"
                  onClick={() => setModoVista('RIEL')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                    modoVista === 'RIEL'
                      ? 'bg-cyan-950/30 text-cyan-300 font-semibold border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Riel Horario
                </button>
              </div>

              {/* Siguiente en turno badge */}
              {metricas?.siguienteItem && (
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 truncate max-w-[200px] bg-[#040711]/60 px-2 py-1 rounded-lg border border-slate-800/60">
                  <span className="text-cyan-400 font-bold shrink-0">Turno:</span>
                  <span className="truncate text-slate-300">{metricas?.siguienteItem?.titulo}</span>
                </div>
              )}
            </div>

            {/* Fila Inferior: Filtros tipo Ghost Controls */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px] font-mono">
              {(['TODOS', 'TAREAS', 'HABITOS', 'VENCIDAS', 'FINANZAS'] as const).map((filtro) => {
                const activo = filtroTipo === filtro;
                return (
                  <button
                    key={filtro}
                    type="button"
                    onClick={() => setFiltroTipo(filtro)}
                    className={`px-2.5 py-0.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                      activo
                        ? 'bg-sky-950/60 text-sky-300 border border-sky-500/40 font-semibold shadow-[0_0_8px_rgba(14,165,233,0.15)]'
                        : 'text-slate-400 hover:text-slate-200 bg-[#040711]/60 border border-slate-800/60'
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
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#070C18]/60 border border-dashed border-slate-800/80 rounded-2xl my-2">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Calendar className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-300 block">
                  {horizonte === 'HOY'
                    ? 'Sin actividades programadas para hoy'
                    : `Sin actividades para el horizonte ${horizonte === 'MANANA' ? 'de mañana' : 'semanal'}`}
                </span>
                <span className="text-[11px] text-slate-500 block max-w-[240px]">
                  {filtroTipo !== 'TODOS'
                    ? `No hay elementos en el filtro "${filtroTipo}". Prueba cambiando a "Todos".`
                    : 'Estás al día con tus compromisos agendados.'}
                </span>
              </div>
              {horizonte === 'HOY' ? (
                <button
                  type="button"
                  onClick={() => setHorizonte('SEMANA')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Ver Agenda de la Semana</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setHorizonte('HOY');
                    setFiltroTipo('TODOS');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 text-xs font-medium transition-all cursor-pointer"
                >
                  <span>Volver a Hoy</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {(itemsFiltrados || []).map((item) => {
                if (!item) return null;
                const estaCompletado = Boolean(item.completado);
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
                    key={`${item?.tipo || 'item'}-${item?.id || Math.random()}`}
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
                      aria-label={estaCompletado ? `Desmarcar ${item?.titulo || ''}` : `Completar ${item?.titulo || ''}`}
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
                          {item?.titulo || 'Sin título'}
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
                      esHoraEnCurso ? 'bg-sky-500/5 border-l-2 border-l-sky-400/50' : ''
                    }`}
                    style={{ height: `${ALTURA_HORA_PX}px`, minHeight: `${ALTURA_HORA_PX}px` }}
                  >
                    {/* Eje izquierdo de marcas horarias (00:00 a 23:00) */}
                    <div className="w-16 shrink-0 pr-2.5 pt-1.5 border-r border-slate-800/60 flex items-start justify-end">
                      <span
                        className={`text-[11px] font-mono tabular-nums tracking-tight leading-none ${
                          esHoraEnCurso ? 'text-sky-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {slot}
                      </span>
                    </div>

                    {/* Guía intermedia tenue de media hora (:30) */}
                    <div className="flex-1 relative">
                      <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-slate-800/20" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Banner informativo cuando el Riel no tiene bloques activos */}
            {bloquesCalendarPosicion.length === 0 && (
              <div className="absolute top-4 left-20 right-4 z-30 p-3.5 bg-[#0D1526]/90 border border-slate-800/70 rounded-xl flex items-center justify-between text-xs text-slate-300 shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8)] backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Calendar className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <span className="font-mono text-xs">Sin bloques en el riel horario para {horizonte === 'HOY' ? 'hoy' : horizonte.toLowerCase()}</span>
                </div>
                {horizonte === 'HOY' && (
                  <button
                    type="button"
                    onClick={() => setHorizonte('SEMANA')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/40 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-semibold hover:bg-cyan-900/40 transition cursor-pointer"
                  >
                    Ver Semana
                  </button>
                )}
              </div>
            )}

            {/* 2. Capa de Eventos Proporcionales Tipo Calendar (Posición y Altura según Minutos/Duración) */}
            <div className="absolute top-0 bottom-0 left-16 right-0">
              {(bloquesCalendarPosicion || []).map(({ item, topPx, heightPx, colIndex, totalCols }) => {
                if (!item) return null;
                const estaCompletado = Boolean(item.completado);
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
                    key={`cal-${item?.tipo || 'item'}-${item?.id || Math.random()}`}
                    onClick={(e) => handleToggle(item, e)}
                    style={{
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                      left: `calc(${leftPct}% + 4px)`,
                      width: `calc(${widthPct}% - 8px)`
                    }}
                    title={`${item?.titulo || ''} · ${item?.subtitulo || ''} (${item?.horaInicio || ''} - ${item?.horaFin || ''})`}
                    className={`group absolute rounded-xl border border-l-4 px-2.5 py-1 text-xs cursor-pointer bg-[#0D1526]/90 backdrop-blur-md border-slate-800/70 hover:border-sky-400/80 hover:shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(30,58,138,0.25)] transition-all duration-200 overflow-hidden flex items-start justify-between gap-2 z-10 hover:z-20 ${bordeIzquierdoClase} ${
                      estaCompletado ? 'opacity-40' : ''
                    } ${
                      esFocus ? 'ring-1 ring-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : ''
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
                              ? 'text-cyan-200 font-semibold'
                              : 'text-slate-100 group-hover:text-white'
                          }`}
                        >
                          {item?.titulo || 'Sin título'}
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
                      aria-label={estaCompletado ? `Desmarcar ${item?.titulo || ''}` : `Completar ${item?.titulo || ''}`}
                      className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
                        estaCompletado
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : 'bg-slate-950/80 border-slate-700/80 text-transparent group-hover:border-cyan-400'
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
                <span className="px-1.5 py-0.5 rounded bg-[#080D1A] border border-rose-500/50 text-rose-300 font-mono tabular-nums text-[9.5px] font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)] whitespace-nowrap leading-none">
                  {horaActualAmPm}
                </span>
              </div>

              {/* Micro-punto radar vivo en la intersección del eje horario */}
              <span className="relative -ml-1.5 flex h-3 w-3 shrink-0 items-center justify-center z-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-85"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-2 ring-white/90 shadow-[0_0_10px_rgba(244,63,94,1)]"></span>
              </span>

              {/* Trazo horizontal luminoso continuo sobre todo el ancho del riel con gradiente láser */}
              <div className="flex-1 h-[1.5px] bg-gradient-to-r from-rose-500 via-sky-400 to-transparent shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* 5. Footer con Resumen Rápido */}
      <div className="px-3.5 py-2 border-t border-cyan-500/20 bg-[#080D1A] flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span>Fecha: {fechaActual}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Ritmo: <strong className="text-white font-mono tabular-nums">{metricas?.porcentajeRitmo ?? 100}%</strong></span>
        </div>
      </div>
    </div>
  );

  // MODO DESACOPLADO DIRECTO (cuando se renderiza en modo standalone / widget de escritorio ?mode=hud)
  if (modoForzadoDesacoplado) {
    // Si no está abierto y no hay PiP activo, renderizar la Cápsula Flotante en Reposo (Widget Pill - REQ-DESKTOP-08)
    if (!cockpitAbierto && !pipWindow) {
      return (
        <div className="w-full h-full bg-transparent flex items-center justify-center p-0 select-none overflow-hidden font-sans">
          <div
            style={esWidgetNativo ? DRAG_REGION_STYLE : undefined}
            className={`w-full h-10 rounded-full bg-[#080D1A] border ${
              tiempoExpirado
                ? 'border-amber-400 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] animate-pulse'
                : 'border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:border-cyan-400/50'
            } flex items-center justify-between px-3 py-1 transition-all duration-200 cursor-grab active:cursor-grabbing group select-none`}
            title="Cockpit Flotante OS (arrastrar para mover / clic para desplegar)"
          >
            {/* Lado Izquierdo: Icono Principal con Disparador Unificado (NO DRAG) */}
            <div className="flex items-center gap-1.5 shrink-0" style={esWidgetNativo ? NO_DRAG_REGION_STYLE : undefined}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAbrirCockpit();
                }}
                className="relative flex items-center justify-center p-1 rounded-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors cursor-pointer shrink-0"
                title="Desplegar Dock Bento"
              >
                <Gauge className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform" strokeWidth={1.75} />
                <span className="absolute top-0 right-0 flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    tiempoExpirado ? 'bg-amber-400' : pomodoroCorriendo ? 'bg-cyan-400' : 'bg-cyan-500'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    tiempoExpirado ? 'bg-amber-400' : pomodoroCorriendo ? 'bg-cyan-400' : 'bg-cyan-500'
                  }`}></span>
                </span>
              </button>
            </div>

            {/* Zona Principal Central: Clic para desplegar (Display de Tiempo, Ritmo y Foco) */}
            <div
              onClick={() => handleAbrirCockpit()}
              style={esWidgetNativo ? NO_DRAG_REGION_STYLE : undefined}
              className="flex-1 flex items-center justify-between gap-2 min-w-0 px-1.5 cursor-pointer"
              title="Clic para desplegar Dock Bento"
            >
              {/* Contador en vivo (REQ-DESKTOP-08 / REQ-DESKTOP-14) o reloj del sistema */}
              <div className="flex items-center gap-1.5 shrink-0">
                {tiempoExpirado ? (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="font-mono tabular-nums text-amber-300 text-xs font-bold tracking-tight animate-pulse">
                      ¡00:00 HECHO!
                    </span>
                  </div>
                ) : pomodoroCorriendo || pomodoroSegundos !== pomodoroTotal ? (
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${pomodoroCorriendo ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="font-mono tabular-nums text-cyan-300 text-xs font-semibold tracking-tight">
                      {tiempoPomodoroStr}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-bold font-mono tabular-nums text-slate-100">
                    {horaActual}
                  </span>
                )}
                <div className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums font-bold border ${colorRitmo}`}>
                  {metricas?.porcentajeRitmo ?? 100}%
                </div>
              </div>

              {/* Título de Foco o Siguiente Item */}
              <div className="flex items-center gap-1 min-w-0 truncate text-[11px] text-slate-300 font-sans border-l border-slate-800/80 pl-2">
                <span className="truncate">
                  {metricas?.siguienteItem
                    ? metricas.siguienteItem.titulo
                    : modoEnfoque === 'DEEP_WORK'
                    ? 'Deep Work'
                    : modoEnfoque === 'ADMIN'
                    ? 'Admin'
                    : 'Recarga'}
                </span>
              </div>
            </div>

            {/* Lado Derecho: Únicamente botón de Ocultar a la Bandeja (NO DRAG) */}
            <div className="flex items-center shrink-0 ml-1" style={esWidgetNativo ? NO_DRAG_REGION_STYLE : undefined}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.desktopWidget?.close) {
                    window.desktopWidget.close();
                  } else if (onCerrarDesacoplado) {
                    onCerrarDesacoplado();
                  }
                }}
                className="p-1 rounded-full text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Ocultar a la bandeja"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full h-full ${esWidgetNativo ? 'bg-transparent p-0' : 'bg-[#040711] p-2'} flex items-center justify-center font-sans select-none overflow-hidden`}>
        {pipWindow &&
          createPortal(
            <div className="w-screen h-screen max-w-full max-h-full flex flex-col bg-[#040711] p-2 box-border overflow-hidden">
              <CockpitInternalErrorBoundary>
                {cockpitContent}
              </CockpitInternalErrorBoundary>
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
          <CockpitInternalErrorBoundary>
            {cockpitContent}
          </CockpitInternalErrorBoundary>
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
            <CockpitInternalErrorBoundary>
              {cockpitContent}
            </CockpitInternalErrorBoundary>
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
            ...(posicionWeb && typeof window !== 'undefined' && window.innerWidth >= 768
              ? { left: `${posicionWeb.x}px`, top: `${posicionWeb.y}px`, bottom: 'auto', right: 'auto' }
              : {})
          }}
          className={`fixed ${
            !posicionWeb || (typeof window !== 'undefined' && window.innerWidth < 768)
              ? 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-4 sm:left-6 md:bottom-6 md:left-auto md:right-28'
              : ''
          } z-[9998] pointer-events-auto h-10 px-3 py-1 rounded-full bg-[#080D1A] border ${
            tiempoExpirado
              ? 'border-amber-400 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] animate-pulse'
              : 'border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]'
          } flex items-center gap-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] cursor-grab active:cursor-grabbing group select-none`}
          title={pipWindow ? "Cockpit activo Always-on-Top (clic para enfocar)" : "Arrastrar para mover libremente / Clic para abrir Cockpit"}
        >
          {/* Glifo Técnico Maestro: Gauge + Micro-punto Radar de Actividad */}
          <div className="relative flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4 text-cyan-400 shrink-0" strokeWidth={1.75} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                tiempoExpirado ? 'bg-amber-400' : pomodoroCorriendo ? 'bg-cyan-400' : 'bg-cyan-500'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                tiempoExpirado ? 'bg-amber-400' : pomodoroCorriendo ? 'bg-cyan-400' : 'bg-cyan-500'
              }`}></span>
            </span>
          </div>

          {/* Reloj o Pomodoro en Vivo (REQ-DESKTOP-08 / REQ-DESKTOP-14) */}
          {tiempoExpirado ? (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-mono tabular-nums text-amber-300 text-xs font-bold tracking-tight animate-pulse">
                ¡00:00 HECHO!
              </span>
            </div>
          ) : pomodoroCorriendo || pomodoroSegundos !== pomodoroTotal ? (
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${pomodoroCorriendo ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-mono tabular-nums text-cyan-300 text-xs font-semibold tracking-tight">
                {tiempoPomodoroStr}
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold font-mono tabular-nums text-slate-100">
              {horaActual}
            </span>
          )}

          {/* Semáforo de Ritmo */}
          <div
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums font-bold border ${colorRitmo}`}
          >
            {metricas?.porcentajeRitmo ?? 100}%
          </div>

          {/* Siguiente en turno (solo si existe y en pantallas sm+) */}
          {metricas?.siguienteItem && (
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
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-[10000] flex items-end md:items-start justify-center md:justify-end bg-black/50 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none pointer-events-auto animate-in fade-in duration-200">
          {/* Backdrop móvil para cerrar */}
          <div
            className="md:hidden absolute inset-0 -z-10 cursor-pointer pointer-events-auto"
            onClick={() => setCockpitAbierto(false)}
          />
          <div className="w-full md:w-auto transition-transform duration-200 ease-out origin-bottom-right pointer-events-auto">
            <CockpitInternalErrorBoundary>
              {cockpitContent}
            </CockpitInternalErrorBoundary>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyCockpit;
