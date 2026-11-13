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
  Sparkles,
  LayoutGrid,
  Minimize2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
  Volume2,
  VolumeX,
  Link2,
  Repeat,
  BellRing,
  Milestone
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import SpotlightCard from '../SpotlightCard';
import { db } from '../../db/db';
import {
  useDailySchedule,
  formatFechaIsoLocal,
  type HorizonteAgenda,
  type DailyScheduleItem
} from '../../hooks/useDailySchedule';
import { syncManager, esEntornoEscritorioLocal } from '../../services/syncManager';
import { crearTarea } from '../../services/tareasService';
import { ModalTareaFlow } from '../Modals/ModalTareaFlow';
import {
  obtenerIdentificadoresWbs,
  resolverSiguienteTareaFoco,
  formatearTiempoInvertido
} from './cockpitUiHelpers';
import {
  autorizarGoogleCalendarOAuth,
  limpiarTokenGoogleCalendar,
  obtenerEstadoConexionGoogleCalendar,
  suscribirEstadoGoogleCalendar,
  type EstadoConexionGoogleCalendar
} from '../../services/calendarSyncService';
import { mostrarToastCobalt } from '../../utils/toastCobalt';

const PRESETS_DURACION_FOCO = [10, 15, 25, 45, 60, 90] as const;

type PerfilAlarma = 'zen' | 'digital' | 'cristal' | 'gong' | 'radar' | 'silencio';

const PERFILES_ALARMA: Array<{ id: PerfilAlarma; nombre: string; detalle: string }> = [
  { id: 'zen', nombre: 'Campana Zen', detalle: 'Armónico cálido suave' },
  { id: 'digital', nombre: 'Pulso Digital', detalle: 'Doble tono ejecutivo' },
  { id: 'cristal', nombre: 'Acorde Cristal', detalle: 'Tríada limpia' },
  { id: 'gong', nombre: 'Gong Profundo', detalle: 'Grave resonante' },
  { id: 'radar', nombre: 'Alerta Radar', detalle: 'Secuencia técnica breve' },
  { id: 'silencio', nombre: 'Silencio', detalle: 'Sin sonido' }
];

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

  // Temporizador Pomodoro persistido en localStorage (REQ-UI-33-EXEC)
  const duracionInicialMin = (() => {
    if (typeof window !== 'undefined') {
      const saved = parseInt(localStorage.getItem('pmo_pomodoro_minutos') || '', 10);
      if (!isNaN(saved) && saved >= 1 && saved <= 180) return saved;
    }
    return 25;
  })();
  const duracionInicialPomodoro = duracionInicialMin * 60;
  const [pomodoroSegundos, setPomodoroSegundos] = useState(duracionInicialPomodoro);
  const [pomodoroCorriendo, setPomodoroCorriendo] = useState(false);
  const [pomodoroTotal, setPomodoroTotal] = useState(duracionInicialPomodoro);
  const timerPomodoroRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetEndTimestampRef = useRef<number | null>(null);
  const expiracionNotificadaRef = useRef(false);
  const activeAudioCtxRef = useRef<AudioContext | null>(null);
  const audioCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemFocoActivoRef = useRef<DailyScheduleItem | null>(null);
  const pomodoroTotalRef = useRef<number>(duracionInicialPomodoro);
  pomodoroTotalRef.current = pomodoroTotal;

  // Popover minimalista de duración personalizada (1-180 min) sin spinners (REQ-UI-33-EXEC Paso 2)
  const [customMinutosAbierto, setCustomMinutosAbierto] = useState(false);
  const [inputMinutosCustom, setInputMinutosCustom] = useState(String(duracionInicialMin));
  const customPopoverRef = useRef<HTMLDivElement | null>(null);

  const handleAplicarMinutosCustom = () => {
    const min = parseInt(inputMinutosCustom, 10);
    if (!isNaN(min) && min >= 1 && min <= 180) {
      handleSetPresetPomodoro(min);
    }
    setCustomMinutosAbierto(false);
  };

  // Estado y Sistema de Alerta Multisensorial Pomodoro (REQ-UI-33-EXEC Paso 3 & 4)
  const [tiempoExpirado, setTiempoExpirado] = useState(false);
  const [sonidoPopoverAbierto, setSonidoPopoverAbierto] = useState(false);
  const sonidoPopoverRef = useRef<HTMLDivElement | null>(null);

  // Selector de Perfiles de Alarma Sonora (6 perfiles Web Audio API)
  const [perfilAlarma, setPerfilAlarma] = useState<PerfilAlarma>(() => {
    if (typeof window !== 'undefined') {
      const guardado = localStorage.getItem('pmo_perfil_alarma');
      if (
        guardado === 'zen' ||
        guardado === 'digital' ||
        guardado === 'cristal' ||
        guardado === 'gong' ||
        guardado === 'radar' ||
        guardado === 'silencio'
      ) {
        return guardado;
      }
    }
    return 'zen';
  });
  const perfilAlarmaRef = useRef<PerfilAlarma>(perfilAlarma);
  perfilAlarmaRef.current = perfilAlarma;

  const handleCambiarPerfilAlarma = (perfil: PerfilAlarma) => {
    setPerfilAlarma(perfil);
    perfilAlarmaRef.current = perfil;
    try {
      localStorage.setItem('pmo_perfil_alarma', perfil);
    } catch {}
  };

  // Métrica de Bloques Diarios de Foco (REQ-DESKTOP-17 Paso 3)
  const obtenerKeyFocoHoy = () => {
    const hoyStr = formatFechaIsoLocal(new Date());
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

  const acreditarHorasFocoEnTarea = async (duracionSegundos: number) => {
    const itemFoco = itemFocoActivoRef.current;
    if (!itemFoco || itemFoco.tipo !== 'TAREA') return;

    const tareaId = String((itemFoco.raw as any)?.id || itemFoco.id || '').trim();
    if (!tareaId) return;

    try {
      const tareaActual = await db.tareas.get(tareaId);
      if (!tareaActual) return;

      const horasPrevias =
        Number((tareaActual as any).horas_reales ?? (tareaActual as any).Horas_Reales ?? 0) || 0;
      const incrementoHoras = Math.round((duracionSegundos / 3600) * 100) / 100;
      const nuevasHorasReales = Math.round((horasPrevias + incrementoHoras) * 100) / 100;
      const nowIso = new Date().toISOString();

      await db.tareas.update(tareaId, {
        horas_reales: nuevasHorasReales,
        Horas_Reales: nuevasHorasReales,
        sync_status: 'pending',
        updated_at: nowIso
      } as any);

      syncManager.syncPendingRecords().catch(() => {});
      syncManager.guardarSnapshotEnPuenteLocal().catch(() => {});
    } catch (err) {
      console.warn('[Cockpit FocusHours] Error al acreditar horas reales en Dexie:', err);
    }
  };

  const cerrarAudioActivo = () => {
    if (audioCloseTimerRef.current) {
      clearTimeout(audioCloseTimerRef.current);
      audioCloseTimerRef.current = null;
    }
    if (activeAudioCtxRef.current) {
      const ctxToClose = activeAudioCtxRef.current;
      activeAudioCtxRef.current = null;
      try {
        if (ctxToClose.state !== 'closed') {
          ctxToClose.close().catch(() => {});
        }
      } catch {}
    }
  };

  useEffect(() => {
    return () => {
      cerrarAudioActivo();
    };
  }, []);

  // Motor Web Audio API con 6 perfiles acústicos, refuerzo limpio sin distorsión y cierre seguro (REQ-UI-33-V2 Paso 4)
  const programarCicloAlarma = (
    ctx: AudioContext,
    destino: AudioNode,
    perfilActivo: Exclude<PerfilAlarma, 'silencio'>,
    tInicio: number
  ): number => {
    if (perfilActivo === 'digital') {
      [
        { freq: 1567.98, t: 0, dur: 0.1 },
        { freq: 2093.0, t: 0.14, dur: 0.14 }
      ].forEach(({ freq, t, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, tInicio + t);

        gain.gain.setValueAtTime(0.0001, tInicio + t);
        gain.gain.linearRampToValueAtTime(0.42, tInicio + t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, tInicio + t + dur);

        osc.connect(gain);
        gain.connect(destino);
        osc.start(tInicio + t);
        osc.stop(tInicio + t + dur + 0.02);
      });
      return 0.3;
    }

    if (perfilActivo === 'cristal') {
      [880, 1108.73, 1318.51].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const inicio = tInicio + idx * 0.1;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, inicio);

        gain.gain.setValueAtTime(0.0001, inicio);
        gain.gain.exponentialRampToValueAtTime(0.4, inicio + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.45);

        osc.connect(gain);
        gain.connect(destino);
        osc.start(inicio);
        osc.stop(inicio + 0.48);
      });
      return 0.68;
    }

    if (perfilActivo === 'gong') {
      [
        { freq: 130.81, peak: 0.45, dur: 1.15 },
        { freq: 196.0, peak: 0.18, dur: 0.95 },
        { freq: 261.63, peak: 0.09, dur: 0.75 }
      ].forEach(({ freq, peak, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, tInicio);

        gain.gain.setValueAtTime(0.0001, tInicio);
        gain.gain.exponentialRampToValueAtTime(peak, tInicio + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, tInicio + dur);

        osc.connect(gain);
        gain.connect(destino);
        osc.start(tInicio);
        osc.stop(tInicio + dur + 0.04);
      });
      return 1.2;
    }

    if (perfilActivo === 'radar') {
      [
        { freq: 620, t: 0 },
        { freq: 780, t: 0.12 },
        { freq: 940, t: 0.24 }
      ].forEach(({ freq, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, tInicio + t);

        gain.gain.setValueAtTime(0.0001, tInicio + t);
        gain.gain.exponentialRampToValueAtTime(0.38, tInicio + t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, tInicio + t + 0.11);

        osc.connect(gain);
        gain.connect(destino);
        osc.start(tInicio + t);
        osc.stop(tInicio + t + 0.12);
      });
      return 0.38;
    }

    // Campana Zen (default)
    [
      { freq: 528, peak: 0.42, dur: 0.95 },
      { freq: 792, peak: 0.16, dur: 0.8 }
    ].forEach(({ freq, peak, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, tInicio);

      gain.gain.setValueAtTime(0.0001, tInicio);
      gain.gain.exponentialRampToValueAtTime(peak, tInicio + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, tInicio + dur);

      osc.connect(gain);
      gain.connect(destino);
      osc.start(tInicio);
      osc.stop(tInicio + dur + 0.04);
    });
    return 1.0;
  };

  const reproducirAlarmaFin = async (perfilOverride?: PerfilAlarma, repeticiones: number = 1) => {
    const perfilActivo = perfilOverride ?? perfilAlarmaRef.current;
    if (perfilActivo === 'silencio') {
      cerrarAudioActivo();
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      cerrarAudioActivo();
      const ctx = new AudioCtx();
      activeAudioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Limitador suave para mantener ganancia clara (0.38–0.45) sin clipping en armónicos
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-3, ctx.currentTime);
      limiter.knee.setValueAtTime(6, ctx.currentTime);
      limiter.ratio.setValueAtTime(12, ctx.currentTime);
      limiter.attack.setValueAtTime(0.002, ctx.currentTime);
      limiter.release.setValueAtTime(0.1, ctx.currentTime);
      limiter.connect(ctx.destination);

      const ciclos = Math.max(1, repeticiones);
      const pausaEntreCiclosSec = 0.6;
      let cursor = ctx.currentTime;
      let duracionCiclo = 0;

      for (let i = 0; i < ciclos; i++) {
        duracionCiclo = programarCicloAlarma(ctx, limiter, perfilActivo, cursor);
        cursor += duracionCiclo + (i < ciclos - 1 ? pausaEntreCiclosSec : 0);
      }

      const cierreMs = Math.ceil((cursor - ctx.currentTime + 0.35) * 1000);
      audioCloseTimerRef.current = setTimeout(() => {
        if (activeAudioCtxRef.current === ctx) {
          activeAudioCtxRef.current = null;
        }
        audioCloseTimerRef.current = null;
        try {
          if (ctx.state !== 'closed') {
            ctx.close().catch(() => {});
          }
        } catch {}
      }, cierreMs);
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

  // Motor Absoluto de Temporizador sin Deriva basado en Date.now() (REQ-UI-33-EXEC Paso 5)
  useEffect(() => {
    if (!pomodoroCorriendo) {
      if (timerPomodoroRef.current) {
        clearInterval(timerPomodoroRef.current);
        timerPomodoroRef.current = null;
      }
      targetEndTimestampRef.current = null;
      return;
    }

    if (targetEndTimestampRef.current === null) {
      const segundosBase = pomodoroSegundos > 0 ? pomodoroSegundos : pomodoroTotalRef.current;
      targetEndTimestampRef.current = Date.now() + segundosBase * 1000;
    }

    const actualizarRestante = () => {
      if (targetEndTimestampRef.current === null) return;
      const restante = Math.max(0, Math.ceil((targetEndTimestampRef.current - Date.now()) / 1000));
      setPomodoroSegundos(restante);
      if (restante <= 0) {
        if (timerPomodoroRef.current) {
          clearInterval(timerPomodoroRef.current);
          timerPomodoroRef.current = null;
        }
        targetEndTimestampRef.current = null;
        setPomodoroCorriendo(false);
        setTiempoExpirado(true);
      }
    };

    actualizarRestante();
    timerPomodoroRef.current = setInterval(actualizarRestante, 250);
    document.addEventListener('visibilitychange', actualizarRestante);

    return () => {
      if (timerPomodoroRef.current) {
        clearInterval(timerPomodoroRef.current);
        timerPomodoroRef.current = null;
      }
      document.removeEventListener('visibilitychange', actualizarRestante);
    };
  }, [pomodoroCorriendo]);

  // Efecto Único y Determinístico de Expiración (Audio, Notificación, Métrica y Horas Reales en Dexie)
  useEffect(() => {
    if (!tiempoExpirado) {
      expiracionNotificadaRef.current = false;
      return;
    }
    if (expiracionNotificadaRef.current) return;
    expiracionNotificadaRef.current = true;

    const duracionCompletada = pomodoroTotalRef.current;
    registrarBloqueCompletado(duracionCompletada);
    void acreditarHorasFocoEnTarea(duracionCompletada);
    void reproducirAlarmaFin(undefined, 2);
    lanzarNotificacionExpirado();
  }, [tiempoExpirado]);

  const handleTogglePomodoro = () => {
    if (tiempoExpirado) {
      handleResetPomodoro();
      return;
    }
    if (pomodoroCorriendo) {
      const restante = targetEndTimestampRef.current
        ? Math.max(0, Math.ceil((targetEndTimestampRef.current - Date.now()) / 1000))
        : pomodoroSegundos;
      targetEndTimestampRef.current = null;
      setPomodoroSegundos(restante);
      setPomodoroCorriendo(false);
    } else {
      expiracionNotificadaRef.current = false;
      const base = pomodoroSegundos > 0 ? pomodoroSegundos : pomodoroTotal;
      if (pomodoroSegundos <= 0) {
        setPomodoroSegundos(base);
      }
      targetEndTimestampRef.current = Date.now() + base * 1000;
      setPomodoroCorriendo(true);
    }
  };

  const handleResetPomodoro = () => {
    if (timerPomodoroRef.current) {
      clearInterval(timerPomodoroRef.current);
      timerPomodoroRef.current = null;
    }
    cerrarAudioActivo();
    targetEndTimestampRef.current = null;
    expiracionNotificadaRef.current = false;
    setPomodoroCorriendo(false);
    setTiempoExpirado(false);
    setPomodoroSegundos(pomodoroTotal);
  };

  const handleSetPresetPomodoro = (minutos: number) => {
    if (timerPomodoroRef.current) {
      clearInterval(timerPomodoroRef.current);
      timerPomodoroRef.current = null;
    }
    targetEndTimestampRef.current = null;
    expiracionNotificadaRef.current = false;
    const segundos = minutos * 60;
    setPomodoroTotal(segundos);
    setPomodoroSegundos(segundos);
    setInputMinutosCustom(String(minutos));
    setPomodoroCorriendo(false);
    setTiempoExpirado(false);
    try {
      localStorage.setItem('pmo_pomodoro_minutos', String(minutos));
    } catch {}
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
  const [gcalEstado, setGcalEstado] = useState<EstadoConexionGoogleCalendar>(() => obtenerEstadoConexionGoogleCalendar());

  useEffect(() => {
    setGcalEstado(obtenerEstadoConexionGoogleCalendar());
    return suscribirEstadoGoogleCalendar(setGcalEstado);
  }, []);

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

    if (!esEntornoEscritorioLocal()) {
      setHayWidgetDeEscritorioActivo(false);
      return;
    }

    let cancelado = false;

    if (!esEntornoEscritorioLocal()) {
      setHayWidgetDeEscritorioActivo(false);
      return;
    }

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

    // Ping inmediato al montar y recurrente cada 3000ms en entorno local
    pingLoopbackDesktop();
    const timer = setInterval(pingLoopbackDesktop, 3000);

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

  // Elementos pendientes elegibles para ejecución en Bloque de Modo Foco (REQ-UI-33)
  const pendientesFoco = useMemo(() => {
    return (items || []).filter((i): i is DailyScheduleItem => Boolean(i && !i.completado));
  }, [items]);

  // Sesión libre por defecto: solo resuelve tarea vinculada cuando tareaFocoId está definido (REQ-UI-33-V2 Paso 2)
  const [tareaFocoId, setTareaFocoId] = useState<string | null>(null);
  const itemFocoActivo = useMemo(() => {
    if (!tareaFocoId) return null;
    return pendientesFoco.find((i) => i.id === tareaFocoId) || null;
  }, [tareaFocoId, pendientesFoco]);
  itemFocoActivoRef.current = itemFocoActivo;

  // Cierre automático de popovers (duración y sonido) por clic fuera o Escape (incluye ventana PiP)
  useEffect(() => {
    if (!customMinutosAbierto && !sonidoPopoverAbierto) return;

    const handlePointerOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        customMinutosAbierto &&
        customPopoverRef.current &&
        !customPopoverRef.current.contains(target)
      ) {
        setCustomMinutosAbierto(false);
      }
      if (
        sonidoPopoverAbierto &&
        sonidoPopoverRef.current &&
        !sonidoPopoverRef.current.contains(target)
      ) {
        setSonidoPopoverAbierto(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setCustomMinutosAbierto(false);
        setSonidoPopoverAbierto(false);
      }
    };

    const docs: Document[] = [document];
    if (pipWindow?.document && pipWindow.document !== document) {
      docs.push(pipWindow.document);
    }

    docs.forEach((doc) => {
      doc.addEventListener('mousedown', handlePointerOutside);
      doc.addEventListener('keydown', handleEscape);
    });

    return () => {
      docs.forEach((doc) => {
        doc.removeEventListener('mousedown', handlePointerOutside);
        doc.removeEventListener('keydown', handleEscape);
      });
    };
  }, [customMinutosAbierto, sonidoPopoverAbierto, pipWindow]);

  const handleVincularTareaFoco = () => {
    const candidata =
      pendientesFoco.find((i) => i.tipo === 'TAREA') ||
      metricas?.itemEnFocus ||
      metricas?.siguienteItem ||
      pendientesFoco[0] ||
      null;
    if (candidata) {
      setTareaFocoId(candidata.id);
    }
  };

  const handleCambiarTareaFoco = () => {
    const siguiente = resolverSiguienteTareaFoco(pendientesFoco, itemFocoActivo?.id ?? null);
    if (siguiente) {
      setTareaFocoId(siguiente.id);
    }
  };

  // Métricas diarias consolidadas de ejecución y foco (REQ-UI-33 Paso 2)
  const completadasDia = metricas?.completadasTotal ?? 0;
  const totalDia = metricas?.totalItems ?? 0;
  const porcentajeCompletadoDia =
    metricas?.porcentajeTotal ?? (totalDia > 0 ? Math.round((completadasDia / totalDia) * 100) : 0);
  const minutosFocoEnCurso =
    pomodoroTotal > pomodoroSegundos ? Math.floor((pomodoroTotal - pomodoroSegundos) / 60) : 0;
  const tiempoInvertidoMin = metricasFocoHoy.minutos + minutosFocoEnCurso;

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
  };

  // Quick-Add de Tareas Clave con WBS Selectors (REQ-SYNC-44-EXEC)
  const [quickAddTareaAbierto, setQuickAddTareaAbierto] = useState(false);
  const [inputQuickAddTarea, setInputQuickAddTarea] = useState('');
  const [guardandoTareaRapida, setGuardandoTareaRapida] = useState(false);
  const [proyectoQuickAdd, setProyectoQuickAdd] = useState<string>('PRO-001');
  const [hitoQuickAdd, setHitoQuickAdd] = useState<string>('');
  const [modalTareaFlowAbierto, setModalTareaFlowAbierto] = useState<boolean>(false);

  const proyectosLive = useLiveQuery(() => db.proyectos.toArray(), []);
  const hitosLive = useLiveQuery(() => db.hitos_wbs.toArray(), []);

  const hitosFiltradosQuickAdd = useMemo(() => {
    if (!hitosLive || !proyectoQuickAdd) return [];
    return hitosLive.filter(
      (h) => h.proyecto_codigo === proyectoQuickAdd || h.proyecto_id === proyectoQuickAdd
    );
  }, [hitosLive, proyectoQuickAdd]);

  const handleCrearTareaRapida = async () => {
    const texto = inputQuickAddTarea.trim();
    if (!texto || guardandoTareaRapida) return;
    try {
      setGuardandoTareaRapida(true);
      const fechaHoy = formatFechaIsoLocal(new Date());

      const { calendarResult } = await crearTarea({
        nombre_tarea_actividad: texto,
        proyecto_codigo: proyectoQuickAdd || 'PRO-001',
        hito_codigo: hitoQuickAdd || undefined,
        estado_tarea: '02_Por_Hacer',
        prioridad_eisenhower: 'DO_FIRST',
        nivel_energia_requerido: 'Medio',
        fecha_programada: fechaHoy,
        horas_estimadas: 1,
        horas_reales: 0,
        agendado_calendar: 'Sí'
      });

      if (calendarResult?.success && calendarResult.mode === 'API_V3') {
        mostrarToastCobalt(
          calendarResult.message || `Tarea creada y sincronizada en Google Calendar.`,
          'success'
        );
      } else if (calendarResult?.requiereAuth) {
        mostrarToastCobalt(
          'Tarea guardada localmente · Conecta Google Calendar para sync automático.',
          'warning',
          4000
        );
      } else if (calendarResult && !calendarResult.success && calendarResult.error) {
        mostrarToastCobalt(
          `Tarea guardada · ${calendarResult.error}`,
          'warning',
          4000
        );
      } else {
        mostrarToastCobalt(
          `Tarea creada en ${proyectoQuickAdd || 'PRO-001'} con sync en segundo plano.`,
          'success'
        );
      }

      setInputQuickAddTarea('');
      setQuickAddTareaAbierto(false);
    } catch (err) {
      console.error('[Cockpit QuickAdd] Error al crear tarea rápida:', err);
      mostrarToastCobalt(`Error al crear tarea: ${String(err)}`, 'error');
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

  // Contenido interno del Cockpit (Dock Bento Dark Cobalt - REQ-UI-33)
  const wbsItemFocoActivo = itemFocoActivo ? obtenerIdentificadoresWbs(itemFocoActivo) : null;
  const focoActivoVisual =
    pomodoroCorriendo || Boolean(itemFocoActivo && itemFocoActivo.estadoRitmo === 'FOCUS_ACTUAL');

  const cockpitContent = (
    <div
      className={`flex flex-col bg-[#080D1A] border border-slate-800/80 text-slate-100 shadow-xl select-none transition-colors duration-200 overflow-hidden font-sans ${
        modoForzadoDesacoplado || pipWindow || esWidgetNativo
          ? 'w-full h-full flex-1 rounded-2xl'
          : 'w-full md:w-[440px] h-[92dvh] md:h-[680px] max-h-[92dvh] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-0 rounded-t-3xl md:rounded-3xl border'
      }`}
    >
      {/* 1. Cabecera Compacta con Selector de Energía y Pestañas */}
      <div
        style={DRAG_REGION_STYLE}
        className="px-3 py-2 border-b border-slate-800/80 bg-[#080D1A] flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing"
      >
        {/* Lado Izquierdo: Glifo Técnico y Título Sobrio */}
        <div className="flex items-center gap-2" style={DRAG_REGION_STYLE}>
          <button
            type="button"
            onClick={handleContraerCockpit}
            style={NO_DRAG_REGION_STYLE}
            className="relative min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 flex items-center justify-center text-sky-400 transition-colors cursor-pointer shrink-0"
            title="Replegar Cockpit a cápsula"
            aria-label="Replegar Cockpit a cápsula"
          >
            <Gauge className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
            <span
              className={`absolute top-1 right-1 inline-flex rounded-full h-1.5 w-1.5 ${
                pomodoroCorriendo ? 'bg-sky-400' : 'bg-emerald-400'
              }`}
            />
          </button>

          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 select-none">
            Daily Cockpit
          </span>
        </div>

        {/* Lado Derecho: Toggle Bento/Agenda + Minimizar + Cerrar */}
        <div className="flex items-center gap-1" style={NO_DRAG_REGION_STYLE}>
          {/* Switch Dock Tab */}
          <div className="flex items-center bg-[#040711]/90 p-0.5 rounded-lg border border-slate-800/80">
            <button
              type="button"
              onClick={() => setTabDock('BENTO')}
              className={`min-w-[32px] min-h-[32px] p-1.5 rounded-md text-xs transition-colors cursor-pointer flex items-center justify-center ${
                tabDock === 'BENTO'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="Vista Bento Táctica"
              aria-label="Vista Bento Táctica"
            >
              <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setTabDock('AGENDA')}
              className={`min-w-[32px] min-h-[32px] p-1.5 rounded-md text-xs transition-colors cursor-pointer flex items-center justify-center ${
                tabDock === 'AGENDA'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="Vista Agenda 24H"
              aria-label="Vista Agenda 24H"
            >
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Indicador compacto estado Google Calendar OAuth */}
          <button
            type="button"
            onClick={async () => {
              if (gcalEstado.conectado) {
                limpiarTokenGoogleCalendar();
                mostrarToastCobalt('Google Calendar desconectado', 'info');
                return;
              }
              const res = await autorizarGoogleCalendarOAuth();
              if (res.success) {
                mostrarToastCobalt('Google Calendar conectado', 'success');
              } else {
                mostrarToastCobalt(res.error || 'No se pudo conectar Google Calendar', 'warning', 3500);
              }
            }}
            className={`min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg border transition-colors cursor-pointer flex items-center justify-center relative ${
              gcalEstado.conectado
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-[#040711]/90 border-slate-800/80 text-slate-400 hover:text-sky-300 hover:border-sky-500/40'
            }`}
            title={
              gcalEstado.conectado
                ? 'Google Calendar sincronizado (clic para desconectar)'
                : 'Conectar Google Calendar (OAuth2)'
            }
            aria-label="Google Calendar Sync"
          >
            <Calendar className={`w-3.5 h-3.5 ${gcalEstado.conectado ? 'text-emerald-400' : 'text-slate-400'}`} strokeWidth={1.75} />
            <span
              className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                gcalEstado.conectado ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
          </button>

          {/* Botón Desacople Always-on-Top PiP */}
          {!pipWindow && !esWidgetNativo && (
            <button
              type="button"
              onClick={desacoplarAEscritorio}
              className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-[#0D1526]/90 border border-transparent hover:border-slate-800/80 transition-colors cursor-pointer flex items-center justify-center"
              title="Desacoplar Cockpit a ventana flotante Always-on-Top en PC"
              aria-label="Desacoplar Cockpit"
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
            className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-[#0D1526]/90 border border-transparent hover:border-slate-800/80 transition-colors cursor-pointer flex items-center justify-center"
            title="Replegar a cápsula flotante"
            aria-label="Replegar a cápsula flotante"
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
              className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#0D1526]/90 border border-transparent hover:border-slate-800/80 transition-colors cursor-pointer flex items-center justify-center"
              title={esWidgetNativo ? "Ocultar a la bandeja del sistema" : "Cerrar"}
              aria-label={esWidgetNativo ? "Ocultar a la bandeja del sistema" : "Cerrar"}
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Barra Táctica de Progreso Diario (REQ-UI-33 Paso 2) */}
      <div className="px-3.5 py-2.5 bg-[#080D1A] border-b border-slate-800/80 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-400 font-medium">Avance hoy</span>
            <span className="font-mono tabular-nums text-slate-100 font-bold">
              {completadasDia}/{totalDia}
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono tabular-nums text-slate-100 font-bold">
              {porcentajeCompletadoDia}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0" title="Tiempo invertido en foco hoy">
            <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
            <span className="text-slate-400">Tiempo invertido</span>
            <span className="font-mono tabular-nums text-slate-100 font-bold">
              {formatearTiempoInvertido(tiempoInvertidoMin)}
            </span>
          </div>
        </div>
        <div
          className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800/80 overflow-hidden"
          role="progressbar"
          aria-valuenow={porcentajeCompletadoDia}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Porcentaje completado del día"
        >
          <div
            className="h-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.25)] transition-all duration-300"
            style={{ width: `${porcentajeCompletadoDia}%` }}
          />
        </div>
      </div>

      {tabDock === 'BENTO' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {/* Bento Card 1: Temporizador Ultra-Minimalista con SpotlightCard y Vínculo Opcional (REQ-UI-33-V2) */}
          <SpotlightCard
            spotlightColor={tiempoExpirado ? 'rgba(245, 158, 11, 0.28)' : 'rgba(56, 189, 248, 0.14)'}
            proximity={0}
            flare={false}
            style={
              {
                '--spotlight-card-surface': tiempoExpirado ? 'rgba(245, 158, 11, 0.15)' : 'rgba(13, 21, 38, 0.92)',
                '--spotlight-card-border': 'transparent',
                '--spotlight-card-shadow': tiempoExpirado ? '0 0 28px rgba(245, 158, 11, 0.28)' : 'none'
              } as React.CSSProperties
            }
            className={`!rounded-xl !p-3.5 !overflow-visible transition-all border ${
              customMinutosAbierto || sonidoPopoverAbierto ? 'z-20' : ''
            } ${
              tiempoExpirado
                ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/40 shadow-[0_0_28px_rgba(245,158,11,0.28)]'
                : focoActivoVisual
                ? 'border-sky-500/60 ring-1 ring-sky-500/20'
                : 'border-slate-800/80 hover:border-sky-500/40'
            }`}
          >
            {/* Fila Superior: Vínculo Opcional 1-Clic o Chip Ultra-Compacto de Tarea + Métrica Numérica */}
            <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
              {itemFocoActivo && wbsItemFocoActivo ? (
                <>
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 px-2 py-0.5 rounded-lg bg-[#040711]/70 border border-slate-800/80">
                    <span className="text-[10px] font-mono font-bold text-sky-400 shrink-0">
                      {wbsItemFocoActivo.codigo}
                    </span>
                    <span className="truncate max-w-[160px] text-xs text-slate-200" title={itemFocoActivo.titulo}>
                      {itemFocoActivo.titulo}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleToggle(itemFocoActivo, e).then(() => setTareaFocoId(null));
                      }}
                      className="w-6 h-6 min-w-0 min-h-0 rounded-md hover:bg-emerald-500/15 flex items-center justify-center transition-colors cursor-pointer"
                      title="Completar tarea"
                      aria-label="Completar tarea"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCambiarTareaFoco}
                      disabled={pendientesFoco.length <= 1}
                      className="w-6 h-6 min-w-0 min-h-0 rounded-md hover:bg-slate-800/80 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Cambiar tarea"
                      aria-label="Cambiar tarea"
                    >
                      <Repeat className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTareaFocoId(null)}
                      className="w-6 h-6 min-w-0 min-h-0 rounded-md hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer text-slate-400 hover:text-rose-400"
                      title="Desvincular (Modo libre)"
                      aria-label="Desvincular (Modo libre)"
                    >
                      <X className="w-3 h-3" strokeWidth={1.75} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleVincularTareaFoco}
                    disabled={pendientesFoco.length === 0}
                    title={pendientesFoco.length > 0 ? 'Vincular tarea (opcional)' : 'Sin tareas pendientes'}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border border-dashed border-slate-700 text-slate-400 hover:text-sky-400 hover:border-sky-500/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Link2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                    <span>Vincular</span>
                  </button>

                  <span className="inline-flex items-center gap-1 text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                    <Target className="w-3 h-3 text-sky-400 shrink-0" strokeWidth={1.75} />
                    <strong className="text-slate-200 font-bold">{metricasFocoHoy.bloques}</strong>
                    <span>·</span>
                    <strong className="text-slate-200 font-bold">{formatearTiempoInvertido(tiempoInvertidoMin)}</strong>
                  </span>
                </>
              )}
            </div>

            {/* Reloj Tabular Central con Alerta Ámbar de Alto Impacto al Expirar */}
            <div className="flex items-center justify-between gap-2 my-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {tiempoExpirado ? (
                  <>
                    <BellRing className="w-5 h-5 text-amber-400 animate-bounce shrink-0" strokeWidth={2} />
                    <span className="font-mono tabular-nums text-3xl sm:text-4xl font-bold tracking-tight text-amber-400 animate-pulse">
                      00:00
                    </span>
                    <span className="text-xs font-bold tracking-widest text-amber-300 uppercase">
                      FINALIZADO
                    </span>
                  </>
                ) : (
                  <span className="font-mono tabular-nums text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">
                    {tiempoPomodoroStr}
                  </span>
                )}
              </div>

              {itemFocoActivo && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                  <Target className="w-3 h-3 text-sky-400 shrink-0" strokeWidth={1.75} />
                  <strong className="text-slate-200 font-bold">{metricasFocoHoy.bloques}</strong>
                  <span>·</span>
                  <strong className="text-slate-200 font-bold">{formatearTiempoInvertido(tiempoInvertidoMin)}</strong>
                </span>
              )}
            </div>

            {/* Barra Ultra-Fina de Progreso */}
            <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800/80 overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${
                  tiempoExpirado
                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.45)]'
                    : 'bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.25)]'
                }`}
                style={{ width: `${tiempoExpirado ? 100 : pctPomodoro}%` }}
              />
            </div>

            {/* Barra de Control Única y Compacta: 1 Botón Principal + 3 Micro-Iconos (36x36px) */}
            <div className="flex items-center justify-between gap-2">
              {tiempoExpirado ? (
                <button
                  type="button"
                  onClick={handleResetPomodoro}
                  title="Reiniciar"
                  aria-label="Reiniciar temporizador"
                  className="h-9 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-[0_0_16px_rgba(245,158,11,0.4)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" strokeWidth={2} />
                  <span>Reiniciar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTogglePomodoro}
                  title={pomodoroCorriendo ? 'Pausar' : 'Iniciar'}
                  aria-label={pomodoroCorriendo ? 'Pausar temporizador' : 'Iniciar temporizador'}
                  className={`h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    pomodoroCorriendo
                      ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100'
                      : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                  }`}
                >
                  {pomodoroCorriendo ? (
                    <>
                      <Pause className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                      <span>Iniciar</span>
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center gap-1.5 shrink-0">
                {!tiempoExpirado && (
                  <button
                    type="button"
                    onClick={handleResetPomodoro}
                    className="h-9 w-9 min-w-0 min-h-0 rounded-xl border border-slate-800/80 bg-[#0D1526] hover:border-sky-500/40 text-slate-400 hover:text-sky-400 flex items-center justify-center transition-colors cursor-pointer"
                    title="Reiniciar"
                    aria-label="Reiniciar"
                  >
                    <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                )}

                {/* Popover Duración */}
                <div ref={customPopoverRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setInputMinutosCustom(String(Math.max(1, Math.round(pomodoroTotal / 60))));
                      setSonidoPopoverAbierto(false);
                      setCustomMinutosAbierto((v) => !v);
                    }}
                    className={`h-9 w-9 min-w-0 min-h-0 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                      customMinutosAbierto
                        ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                        : 'border-slate-800/80 bg-[#0D1526] hover:border-sky-500/40 text-slate-400 hover:text-sky-400'
                    }`}
                    title="Duración"
                    aria-label="Duración"
                    aria-expanded={customMinutosAbierto}
                  >
                    <SlidersHorizontal className="w-4 h-4" strokeWidth={1.75} />
                  </button>

                  {customMinutosAbierto && (
                    <div
                      role="dialog"
                      aria-label="Duración personalizada del temporizador"
                      className="absolute right-0 top-full mt-1.5 w-52 bg-[#0D1526] border border-slate-700/80 rounded-xl p-2.5 shadow-lg z-30 space-y-2"
                    >
                      <div className="grid grid-cols-3 gap-1.5">
                        {PRESETS_DURACION_FOCO.map((mins) => {
                          const activo = pomodoroTotal === mins * 60;
                          return (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => {
                                handleSetPresetPomodoro(mins);
                                setCustomMinutosAbierto(false);
                              }}
                              className={`h-7 min-h-0 px-2 rounded-lg font-mono tabular-nums text-xs border transition-colors cursor-pointer ${
                                activo
                                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/50 font-semibold'
                                  : 'bg-[#040711]/70 text-slate-300 border-slate-800/80 hover:border-sky-500/40 hover:text-sky-300'
                              }`}
                            >
                              {mins}m
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/80">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={inputMinutosCustom}
                          onChange={(e) => setInputMinutosCustom(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAplicarMinutosCustom();
                            }
                            if (e.key === 'Escape') {
                              e.stopPropagation();
                              setCustomMinutosAbierto(false);
                            }
                          }}
                          autoFocus
                          aria-label="Minutos personalizados"
                          placeholder="min"
                          className="flex-1 min-w-0 h-8 px-2 rounded-lg bg-[#040711]/80 border border-slate-800/80 focus:border-sky-500/50 text-xs font-mono tabular-nums text-slate-100 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={handleAplicarMinutosCustom}
                          className="w-8 h-8 min-w-0 min-h-0 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Confirmar minutos"
                          aria-label="Confirmar minutos"
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Popover Sonido (6 perfiles Web Audio API) */}
                <div ref={sonidoPopoverRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMinutosAbierto(false);
                      setSonidoPopoverAbierto((v) => !v);
                    }}
                    className={`h-9 w-9 min-w-0 min-h-0 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                      sonidoPopoverAbierto
                        ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                        : 'border-slate-800/80 bg-[#0D1526] hover:border-sky-500/40 text-slate-400 hover:text-sky-400'
                    }`}
                    title={`Sonido: ${PERFILES_ALARMA.find((p) => p.id === perfilAlarma)?.nombre || 'Campana Zen'}`}
                    aria-label="Sonido"
                    aria-expanded={sonidoPopoverAbierto}
                  >
                    {perfilAlarma === 'silencio' ? (
                      <VolumeX className="w-4 h-4" strokeWidth={1.75} />
                    ) : (
                      <Volume2 className="w-4 h-4" strokeWidth={1.75} />
                    )}
                  </button>

                  {sonidoPopoverAbierto && (
                    <div
                      role="menu"
                      aria-label="Perfiles acústicos de alarma"
                      className="absolute right-0 top-full mt-1.5 w-52 bg-[#0D1526] border border-slate-700/80 rounded-xl p-1.5 shadow-lg z-30 space-y-0.5 font-sans"
                    >
                      {PERFILES_ALARMA.map((perfil) => {
                        const activo = perfilAlarma === perfil.id;
                        return (
                          <button
                            key={perfil.id}
                            type="button"
                            role="menuitemradio"
                            aria-checked={activo}
                            onClick={() => {
                              handleCambiarPerfilAlarma(perfil.id);
                              if (perfil.id !== 'silencio') {
                                void reproducirAlarmaFin(perfil.id, 1);
                              } else {
                                cerrarAudioActivo();
                              }
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between gap-2 transition-colors cursor-pointer border ${
                              activo
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/35'
                                : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100 border-transparent'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">{perfil.nombre}</div>
                              <div className="text-[10px] text-slate-400 truncate">{perfil.detalle}</div>
                            </div>
                            {activo && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={2} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Bento Card 2: Tira de las 3 Tareas Clave con Jerarquía WBS */}
          <div className="rounded-xl p-3.5 bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 transition-colors">
            {tareaDetalleActualizada ? (
              /* Vista de Detalle Interna de Tarea Clave */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setTareaDetalleSeleccionada(null)}
                    title="Volver a lista de tareas clave"
                    className="min-h-[36px] px-2 -ml-1 flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 rounded-lg hover:bg-slate-900/80 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Volver a tareas</span>
                  </button>
                  {!tareaDetalleActualizada.completado && (
                    <button
                      type="button"
                      onClick={() => setTareaFocoId(tareaDetalleActualizada.id)}
                      title="Establecer como tarea activa en Modo Foco"
                      className={`min-h-[36px] px-2.5 rounded-lg text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                        itemFocoActivo?.id === tareaDetalleActualizada.id
                          ? 'bg-sky-500/15 text-sky-300 border-sky-500/60 ring-1 ring-sky-500/20'
                          : 'bg-slate-900/90 text-slate-300 border-slate-800/80 hover:border-sky-500/40'
                      }`}
                    >
                      {itemFocoActivo?.id === tareaDetalleActualizada.id ? 'En Foco' : 'Enfocar'}
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#040711]/70 border border-slate-800/80">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(tareaDetalleActualizada, e);
                    }}
                    title={
                      tareaDetalleActualizada.completado
                        ? 'Reabrir tarea'
                        : 'Completar tarea'
                    }
                    aria-label={
                      tareaDetalleActualizada.completado
                        ? `Reabrir ${tareaDetalleActualizada.titulo}`
                        : `Completar ${tareaDetalleActualizada.titulo}`
                    }
                    className="min-w-[36px] min-h-[36px] w-9 h-9 -ml-1.5 -mt-1 flex items-center justify-center rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                        tareaDetalleActualizada.completado
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'bg-slate-900/90 border-slate-600 text-transparent hover:border-sky-400'
                      }`}
                    >
                      <Check className="w-3 h-3" strokeWidth={2.5} />
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-mono text-slate-400 mb-0.5 truncate">
                      {obtenerIdentificadoresWbs(tareaDetalleActualizada).textoLinea}
                    </div>
                    <h4
                      className={`text-xs font-semibold leading-snug ${
                        tareaDetalleActualizada.completado
                          ? 'line-through text-slate-500'
                          : 'text-slate-100'
                      }`}
                    >
                      {tareaDetalleActualizada.titulo}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] font-mono tabular-nums text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 inline-flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-sky-400" strokeWidth={1.75} />
                        {tareaDetalleActualizada.duracionMinutos || 30} min
                      </span>
                      {tareaDetalleActualizada.prioridad && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          {tareaDetalleActualizada.prioridad}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción / Notas de la tarea */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 max-h-32 overflow-y-auto scrollbar-thin">
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
              /* Lista Top 3 Tareas Clave con Jerarquía WBS */
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-sky-400" strokeWidth={2} />
                    Foco Diario (Top 3)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickAddTareaAbierto((v) => !v)}
                      className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-800/80 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 transition-colors cursor-pointer flex items-center justify-center"
                      title="Crear nueva tarea rápida"
                      aria-label="Crear nueva tarea rápida"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-bold bg-slate-900 text-slate-100 border border-slate-800">
                      {tresTareasClave.filter((t) => t.completado).length}/{tresTareasClave.length}
                    </span>
                  </div>
                </div>

                {/* Campo Inline de Creación Rápida con Selectores WBS y Acceso a ModalTareaFlow */}
                {quickAddTareaAbierto && (
                  <div className="mb-2.5 p-2 rounded-xl bg-slate-950/95 border border-sky-500/40 shadow-xl space-y-2">
                    <div className="flex items-center gap-1.5">
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
                        className="flex-1 bg-slate-900/60 border border-slate-800/60 rounded-lg text-xs text-slate-100 placeholder-slate-500 outline-none px-2.5 py-1.5 focus:border-sky-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setModalTareaFlowAbierto(true)}
                        className="min-h-[32px] px-2 rounded-lg border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Abrir formulario completo TareaFlow"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>

                    {/* Micro-selectores WBS (Proyecto e Hito) */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <div className="flex-1 flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 rounded-lg px-2 py-1 min-w-0">
                        <FolderKanban className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                        <select
                          value={proyectoQuickAdd}
                          onChange={(e) => {
                            setProyectoQuickAdd(e.target.value);
                            setHitoQuickAdd('');
                          }}
                          className="w-full bg-transparent text-slate-200 outline-none cursor-pointer truncate"
                          title="Proyecto WBS"
                        >
                          {(proyectosLive && proyectosLive.length > 0) ? (
                            proyectosLive.map((p) => (
                              <option key={p.id} value={p.codigo_legado || p.id} className="bg-slate-900 text-slate-200">
                                {p.codigo_legado || p.id}: {p.nombre_proyecto || 'Sin nombre'}
                              </option>
                            ))
                          ) : (
                            <option value="PRO-001" className="bg-slate-900 text-slate-200">PRO-001: Vida & Personal</option>
                          )}
                        </select>
                      </div>

                      <div className="flex-1 flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 rounded-lg px-2 py-1 min-w-0">
                        <Milestone className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.75} />
                        <select
                          value={hitoQuickAdd}
                          onChange={(e) => setHitoQuickAdd(e.target.value)}
                          className="w-full bg-transparent text-slate-200 outline-none cursor-pointer truncate"
                          title="Hito WBS (Opcional)"
                        >
                          <option value="" className="bg-slate-900 text-slate-400">Sin Hito WBS</option>
                          {hitosFiltradosQuickAdd.map((h) => (
                            <option key={h.id} value={h.codigo_legado || h.id} className="bg-slate-900 text-slate-200">
                              {h.codigo_legado || h.id}: {h.nombre_hito || 'Hito'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleCrearTareaRapida}
                        disabled={!inputQuickAddTarea.trim() || guardandoTareaRapida}
                        title="Guardar tarea rápida"
                        className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold text-[11px] font-mono transition-colors cursor-pointer shrink-0"
                      >
                        Enter
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInputQuickAddTarea('');
                          setQuickAddTareaAbierto(false);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                        title="Cancelar (Esc)"
                        aria-label="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {tresTareasClave.length === 0 ? (
                    <div className="text-center py-3 text-xs text-slate-400 font-mono">
                      Sin tareas prioritarias para hoy
                    </div>
                  ) : (
                    tresTareasClave.map((tarea) => {
                      const wbs = obtenerIdentificadoresWbs(tarea);
                      const esEnFoco =
                        !tarea.completado &&
                        (itemFocoActivo?.id === tarea.id || tarea.estadoRitmo === 'FOCUS_ACTUAL');

                      return (
                        <div
                          key={tarea.id}
                          onClick={() => setTareaDetalleSeleccionada(tarea)}
                          className={`group flex items-start justify-between gap-2 p-3.5 rounded-xl bg-[#0D1526]/90 border transition-colors cursor-pointer ${
                            tarea.completado
                              ? 'border-slate-800/40 opacity-50'
                              : esEnFoco
                              ? 'border-sky-500/60 ring-1 ring-sky-500/20'
                              : 'border-slate-800/80 hover:border-sky-500/40'
                          }`}
                          title="Clic para ver detalle de la tarea"
                        >
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggle(tarea, e);
                              }}
                              title={tarea.completado ? 'Reabrir tarea' : 'Completar tarea'}
                              aria-label={
                                tarea.completado
                                  ? `Desmarcar ${tarea.titulo}`
                                  : `Completar ${tarea.titulo}`
                              }
                              className="min-w-[36px] min-h-[36px] w-9 h-9 -ml-1.5 -mt-1 flex items-center justify-center rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer shrink-0"
                            >
                              <span
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  tarea.completado
                                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                    : 'bg-slate-900/90 border-slate-600 group-hover:border-sky-400 text-transparent'
                                }`}
                              >
                                <Check className="w-3 h-3" strokeWidth={2.5} />
                              </span>
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-mono text-slate-400 truncate mb-0.5">
                                {wbs.textoLinea}
                              </div>
                              <div
                                className={`text-xs truncate transition-colors ${
                                  tarea.completado
                                    ? 'line-through text-slate-500'
                                    : 'text-slate-100 group-hover:text-white font-semibold'
                                }`}
                              >
                                {tarea.titulo}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <span className="text-[11px] font-mono tabular-nums text-slate-400">
                              {tarea.horaInicio || 'Hoy'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Bento Card 3: Hábitos Personales en Cuadrícula Compacta */}
          <div className="rounded-xl p-3.5 bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                Hábitos Personales
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums font-bold bg-slate-900 text-slate-100 border border-slate-800">
                  {completadosHabitos}/{totalHabitos}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums font-bold border ${colorRitmo}`}>
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
                      title={`${habito.codigoLegado} · ${habito.titulo}`}
                      className={`p-3 rounded-xl text-left transition-colors cursor-pointer flex flex-col justify-between border ${
                        estaCompletado
                          ? 'bg-sky-950/25 border-sky-500/40'
                          : 'bg-[#0D1526]/90 border-slate-800/80 hover:border-sky-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5 gap-1">
                        <span className="text-[11px] font-mono text-slate-400 truncate">
                          {habito.codigoLegado}
                        </span>
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            estaCompletado
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-700 bg-slate-950/60 text-transparent'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium leading-tight line-clamp-2 transition-colors ${
                          estaCompletado ? 'line-through text-slate-400' : 'text-slate-100'
                        }`}
                      >
                        {habito.titulo}
                      </span>
                      {habito.horaInicio && (
                        <span className="text-[11px] font-mono tabular-nums text-slate-400 mt-1.5">
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
          <div className="px-3.5 py-2.5 bg-[#080D1A] border-b border-slate-800/80 flex flex-col gap-2 shrink-0">
            {/* Fila Superior: Selector de Horizonte */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-[#040711]/90 p-1 rounded-xl border border-slate-800/80 w-full">
                {(['HOY', 'MANANA', 'SEMANA'] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorizonte(h)}
                    className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer border ${
                      horizonte === h
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                        : 'text-slate-400 hover:text-slate-200 border-transparent'
                    }`}
                  >
                    {h === 'HOY' ? 'Hoy' : h === 'MANANA' ? 'Mañana' : 'Semana'}
                  </button>
                ))}
              </div>
            </div>

            {/* Fila Media: Modo de Vista + Badge Turno Siguiente */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-[#040711]/90 p-0.5 rounded-xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModoVista('CHECKLIST')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors cursor-pointer border ${
                    modoVista === 'CHECKLIST'
                      ? 'bg-sky-500/15 text-sky-300 font-semibold border-sky-500/40'
                      : 'text-slate-400 hover:text-slate-200 border-transparent'
                  }`}
                >
                  <ListTodo className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Checklist
                </button>
                <button
                  type="button"
                  onClick={() => setModoVista('RIEL')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors cursor-pointer border ${
                    modoVista === 'RIEL'
                      ? 'bg-sky-500/15 text-sky-300 font-semibold border-sky-500/40'
                      : 'text-slate-400 hover:text-slate-200 border-transparent'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Riel Horario
                </button>
              </div>

              {metricas?.siguienteItem && (
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 truncate max-w-[200px] bg-[#040711]/60 px-2 py-1 rounded-lg border border-slate-800/80">
                  <span className="text-sky-400 font-bold shrink-0">Turno:</span>
                  <span className="truncate text-slate-200">{metricas?.siguienteItem?.titulo}</span>
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
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer border ${
                      activo
                        ? 'bg-sky-950/50 text-sky-300 border-sky-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 bg-[#040711]/60 border-slate-800/80'
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
          <div className="flex flex-col items-center justify-center p-8 text-slate-400 space-y-2">
            <div className="w-6 h-6 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin" />
            <span className="text-xs font-mono">Sincronizando agenda...</span>
          </div>
        ) : modoVista === 'CHECKLIST' ? (
          /* ========================================================
             VISTA A: CHECKLIST TÁCTICO DARK COBALT (REQ-UI-33)
             ======================================================== */
          itemsFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#0D1526]/60 border border-dashed border-slate-800/80 rounded-xl my-2">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Calendar className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-200 block">
                  {horizonte === 'HOY'
                    ? 'Sin actividades programadas para hoy'
                    : `Sin actividades para el horizonte ${horizonte === 'MANANA' ? 'de mañana' : 'semanal'}`}
                </span>
                <span className="text-[11px] text-slate-400 block max-w-[240px]">
                  {filtroTipo !== 'TODOS'
                    ? `No hay elementos en el filtro "${filtroTipo}". Prueba cambiando a "Todos".`
                    : 'Estás al día con tus compromisos agendados.'}
                </span>
              </div>
              {horizonte === 'HOY' ? (
                <button
                  type="button"
                  onClick={() => setHorizonte('SEMANA')}
                  className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/35 text-xs font-semibold transition-colors cursor-pointer"
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
                  className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800/80 text-xs font-medium transition-colors cursor-pointer"
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
                const esFocus =
                  !estaCompletado &&
                  (item.estadoRitmo === 'FOCUS_ACTUAL' || item.id === itemFocoActivo?.id);
                const esHabito = item.tipo === 'HABITO';
                const esTarea = item.tipo === 'TAREA';
                const esIngreso = item.tipo === 'INGRESO';
                const esGasto = item.tipo === 'GASTO' || item.tipo === 'CUOTA';
                const wbs = obtenerIdentificadoresWbs(item);

                const badgeTipoClase = esHabito
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : esTarea
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                  : esIngreso
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                return (
                  <div
                    key={`${item?.tipo || 'item'}-${item?.id || Math.random()}`}
                    onClick={(e) => handleToggle(item, e)}
                    className={`group relative flex items-start gap-2.5 bg-[#0D1526]/90 border rounded-xl p-3.5 transition-colors cursor-pointer ${
                      estaCompletado
                        ? 'border-slate-800/40 opacity-50'
                        : esFocus
                        ? 'border-sky-500/60 ring-1 ring-sky-500/20 hover:border-sky-400'
                        : esVencido
                        ? 'border-rose-500/40 hover:border-rose-400/60'
                        : 'border-slate-800/80 hover:border-sky-500/40'
                    }`}
                  >
                    {/* Objetivo táctil mínimo 36px para completar tarea/actividad */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(item, e);
                      }}
                      title={estaCompletado ? `Reabrir ${item?.titulo || ''}` : `Completar ${item?.titulo || ''}`}
                      aria-label={estaCompletado ? `Desmarcar ${item?.titulo || ''}` : `Completar ${item?.titulo || ''}`}
                      className="min-w-[36px] min-h-[36px] w-9 h-9 -ml-1.5 -mt-1 flex items-center justify-center rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
                    >
                      <span
                        className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                          estaCompletado
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'bg-slate-900/90 border-slate-600/80 text-transparent group-hover:border-sky-400'
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 transition-opacity ${
                            estaCompletado ? 'opacity-100' : 'opacity-0'
                          }`}
                          strokeWidth={2.5}
                        />
                      </span>
                    </button>

                    {/* Cuerpo de la tarjeta con Jerarquía WBS monoespaciada */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-mono text-slate-400 truncate">
                          {wbs.textoLinea}
                        </span>
                        {!estaCompletado && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTareaFocoId(item.id);
                              setTabDock('BENTO');
                            }}
                            title="Llevar esta actividad al Bloque de Foco"
                            aria-label={`Enfocar ${item?.titulo || ''}`}
                            className={`min-w-[36px] min-h-[36px] -my-2 -mr-1.5 px-2 rounded-lg text-[10px] font-mono font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0 ${
                              esFocus
                                ? 'text-sky-300 bg-sky-500/15 border border-sky-500/35'
                                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/70'
                            }`}
                          >
                            <Target className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                            <span className="hidden sm:inline">{esFocus ? 'Foco' : 'Enfocar'}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-xs font-semibold leading-snug break-words transition-colors ${
                            estaCompletado
                              ? 'line-through text-slate-500'
                              : esFocus
                              ? 'text-sky-100'
                              : 'text-slate-100 group-hover:text-white'
                          }`}
                        >
                          {item?.titulo || 'Sin título'}
                        </span>

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

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] font-mono tabular-nums text-slate-400">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${badgeTipoClase}`}
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

                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800/80 text-slate-300 font-mono tabular-nums">
                          <Clock className="w-2.5 h-2.5 text-sky-400 shrink-0" strokeWidth={1.75} />
                          <span>
                            {item.horaInicio}–{item.horaFin} ({item.duracionMinutos}m)
                          </span>
                        </span>

                        {esTarea && item.prioridad && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-900/70 text-slate-300 border border-slate-800/80 text-[10px]">
                            {item.prioridad}
                          </span>
                        )}

                        {(esGasto || esIngreso) && item.estadoEntidad && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${
                              estaCompletado
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            }`}
                          >
                            {item.estadoEntidad}
                          </span>
                        )}

                        {esFocus && (
                          <span className="px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-300 font-bold border border-sky-500/35 text-[10px]">
                            EN FOCO
                          </span>
                        )}

                        {esVencido && (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30 text-[10px]">
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
              <div className="absolute top-4 left-20 right-4 z-30 p-3.5 bg-[#0D1526]/90 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0">
                    <Calendar className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <span className="font-mono text-xs">Sin bloques en el riel horario para {horizonte === 'HOY' ? 'hoy' : horizonte.toLowerCase()}</span>
                </div>
                {horizonte === 'HOY' && (
                  <button
                    type="button"
                    onClick={() => setHorizonte('SEMANA')}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/35 text-[10px] font-mono font-semibold hover:bg-sky-500/25 transition-colors cursor-pointer"
                  >
                    Ver Semana
                  </button>
                )}
              </div>
            )}

            {/* 2. Capa de Eventos Proporcionales Tipo Calendar */}
            <div className="absolute top-0 bottom-0 left-16 right-0">
              {(bloquesCalendarPosicion || []).map(({ item, topPx, heightPx, colIndex, totalCols }) => {
                if (!item) return null;
                const estaCompletado = Boolean(item.completado);
                const esFocus =
                  !estaCompletado &&
                  (item.estadoRitmo === 'FOCUS_ACTUAL' || item.id === itemFocoActivo?.id);
                const esHabito = item.tipo === 'HABITO';
                const esTarea = item.tipo === 'TAREA';
                const esIngreso = item.tipo === 'INGRESO';
                const esGasto = item.tipo === 'GASTO' || item.tipo === 'CUOTA';
                const widthPct = 100 / totalCols;
                const leftPct = colIndex * widthPct;
                const esCompacto = heightPx < 44;
                const wbs = obtenerIdentificadoresWbs(item);

                const badgeTipoClase = esHabito
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : esTarea
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
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
                    title={`${wbs.textoLinea} · ${item?.titulo || ''} (${item?.horaInicio || ''}-${item?.horaFin || ''})`}
                    className={`group absolute rounded-xl border px-2.5 py-1.5 text-xs cursor-pointer bg-[#0D1526]/90 transition-colors overflow-hidden flex items-start justify-between gap-2 z-10 hover:z-20 ${
                      estaCompletado
                        ? 'border-slate-800/40 opacity-50'
                        : esFocus
                        ? 'border-sky-500/60 ring-1 ring-sky-500/20'
                        : 'border-slate-800/80 hover:border-sky-500/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-semibold shrink-0 border ${badgeTipoClase}`}
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
                            esCompacto ? 'text-[10.5px]' : 'text-xs'
                          } ${
                            estaCompletado
                              ? 'line-through text-slate-500'
                              : esFocus
                              ? 'text-sky-100'
                              : 'text-slate-100 group-hover:text-white'
                          }`}
                        >
                          {item?.titulo || 'Sin título'}
                        </span>

                        {item.montoFormateado && (
                          <span
                            className={`ml-auto shrink-0 px-1.5 py-0.5 rounded border font-mono tabular-nums text-[10px] font-bold ${
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
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-mono tabular-nums text-slate-400 truncate">
                          <span className="truncate">{wbs.textoLinea}</span>
                          <span>·</span>
                          <span className="text-slate-300 shrink-0">
                            {item.horaInicio}–{item.horaFin}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(item, e);
                      }}
                      title={estaCompletado ? `Reabrir ${item?.titulo || ''}` : `Completar ${item?.titulo || ''}`}
                      aria-label={estaCompletado ? `Desmarcar ${item?.titulo || ''}` : `Completar ${item?.titulo || ''}`}
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          estaCompletado
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'bg-slate-900/90 border-slate-700/80 text-transparent group-hover:border-sky-400'
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 transition-opacity ${
                            estaCompletado ? 'opacity-100' : 'opacity-0'
                          }`}
                          strokeWidth={2.5}
                        />
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 3. Línea de Hora Actual en Vivo Global */}
            <div
              id="cockpit-live-time-indicator"
              ref={slotActualRef}
              className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
              style={{ top: `${topLineaActualPx}px` }}
            >
              <div className="w-16 shrink-0 pr-1.5 flex items-center justify-end">
                <span className="px-1.5 py-0.5 rounded bg-[#080D1A] border border-rose-500/50 text-rose-300 font-mono tabular-nums text-[9.5px] font-bold whitespace-nowrap leading-none">
                  {horaActualAmPm}
                </span>
              </div>

              <span className="relative -ml-1 flex h-2 w-2 shrink-0 rounded-full bg-rose-500 z-10" />

              <div className="flex-1 h-[1px] bg-rose-500/60" />
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* 5. Footer con Resumen Tabular */}
      <div className="px-3.5 py-2 border-t border-slate-800/80 bg-[#080D1A] flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span>Fecha: <strong className="text-slate-200 tabular-nums">{fechaActual}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            Ritmo:{' '}
            <strong className="font-mono tabular-nums text-slate-100 font-bold">
              {metricas?.porcentajeRitmo ?? 100}%
            </strong>
          </span>
        </div>
      </div>
    </div>
  );

  // MODO DESACOPLADO DIRECTO (widget standalone ?mode=hud)
  if (modoForzadoDesacoplado) {
    if (!cockpitAbierto && !pipWindow) {
      return (
        <div className="w-full h-full bg-transparent flex items-center justify-center p-0 select-none overflow-hidden font-sans">
          <div className="w-full h-10 rounded-full bg-[#080D1A]">
            <div
              style={esWidgetNativo ? DRAG_REGION_STYLE : undefined}
              className={`w-full h-full rounded-full border ${
                tiempoExpirado
                  ? 'border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                  : pomodoroCorriendo
                  ? 'border-sky-500/60 ring-1 ring-sky-500/20'
                  : 'border-slate-800/80 hover:border-sky-500/40'
              } flex items-center justify-between px-3 py-1 transition-all cursor-grab active:cursor-grabbing group select-none`}
              title="Cockpit Flotante OS (arrastrar para mover / clic para desplegar)"
            >
            {/* Lado Izquierdo: Icono Principal o BellRing en Alerta */}
            <div className="flex items-center gap-1.5 shrink-0" style={esWidgetNativo ? NO_DRAG_REGION_STYLE : undefined}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAbrirCockpit();
                }}
                className="relative flex items-center justify-center p-1 rounded-full text-sky-400 hover:text-sky-300 hover:bg-slate-800/70 transition-colors cursor-pointer shrink-0"
                title="Desplegar Dock Bento"
                aria-label="Desplegar Dock Bento"
              >
                {tiempoExpirado ? (
                  <BellRing className="w-4 h-4 text-amber-400 animate-bounce shrink-0" strokeWidth={2} />
                ) : (
                  <>
                    <Gauge className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    <span className="absolute top-0 right-0 inline-flex rounded-full h-2 w-2 bg-sky-400" />
                  </>
                )}
              </button>
            </div>

            {/* Zona Principal Central: Display de Tiempo, Ritmo y Foco */}
            <div
              onClick={() => handleAbrirCockpit()}
              style={esWidgetNativo ? NO_DRAG_REGION_STYLE : undefined}
              className="flex-1 flex items-center justify-between gap-2 min-w-0 px-1.5 cursor-pointer"
              title="Clic para desplegar Dock Bento"
            >
              <div className="flex items-center gap-1.5 shrink-0">
                {tiempoExpirado ? (
                  <span className="font-mono tabular-nums text-amber-300 text-xs font-bold tracking-tight animate-pulse">
                    00:00
                  </span>
                ) : pomodoroCorriendo || pomodoroSegundos !== pomodoroTotal ? (
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${pomodoroCorriendo ? 'bg-sky-400' : 'bg-amber-400'}`} />
                    <span className="font-mono tabular-nums text-slate-100 text-xs font-bold tracking-tight">
                      {tiempoPomodoroStr}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-bold font-mono tabular-nums text-slate-100">
                    {horaActual}
                  </span>
                )}
                <div className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold border ${colorRitmo}`}>
                  {metricas?.porcentajeRitmo ?? 100}%
                </div>
              </div>

              <div className="flex items-center gap-1 min-w-0 truncate text-[11px] text-slate-300 font-sans border-l border-slate-800/80 pl-2">
                <span className="truncate">
                  {tiempoExpirado
                    ? 'FINALIZADO'
                    : itemFocoActivo
                    ? itemFocoActivo.titulo
                    : 'Modo Libre'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1" style={esWidgetNativo ? NO_DRAG_REGION_STYLE : undefined}>
              {tiempoExpirado && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetPomodoro();
                  }}
                  className="w-6 h-6 min-w-0 min-h-0 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                  title="Reiniciar temporizador"
                  aria-label="Reiniciar temporizador"
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} />
                </button>
              )}
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
                aria-label="Ocultar a la bandeja"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
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
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[#0D1526]/90 border border-slate-800/80 rounded-xl max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Gauge className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase font-mono">Cockpit Desacoplado</h3>
              <p className="text-xs text-slate-400 mt-1">El Cockpit se está ejecutando en la ventana flotante Always-on-Top.</p>
            </div>
            <button
              type="button"
              onClick={() => pipWindow.focus()}
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/35 text-xs font-semibold hover:bg-sky-500/25 transition-colors cursor-pointer"
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

  // MODO NORMAL DE LA APLICACIÓN PRINCIPAL
  return (
    <>
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
          } z-[9998] pointer-events-auto h-10 rounded-full bg-[#080D1A] cursor-grab active:cursor-grabbing group select-none`}
          title={pipWindow ? "Cockpit activo Always-on-Top (clic para enfocar)" : "Arrastrar para mover libremente / Clic para abrir Cockpit"}
        >
          <div
            className={`w-full h-full px-3 py-1 rounded-full border flex items-center gap-2 transition-all ${
              tiempoExpirado
                ? 'border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                : pomodoroCorriendo
                ? 'border-sky-500/60 ring-1 ring-sky-500/20'
                : 'border-slate-800/80 hover:border-sky-500/40'
            }`}
          >
          <div className="relative flex items-center justify-center shrink-0">
            {tiempoExpirado ? (
              <BellRing className="w-4 h-4 text-amber-400 animate-bounce shrink-0" strokeWidth={2} />
            ) : (
              <>
                <Gauge className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
                <span className="absolute -top-0.5 -right-0.5 inline-flex rounded-full h-2 w-2 bg-sky-400" />
              </>
            )}
          </div>

          {tiempoExpirado ? (
            <span className="font-mono tabular-nums text-amber-300 text-xs font-bold tracking-tight animate-pulse">
              00:00
            </span>
          ) : pomodoroCorriendo || pomodoroSegundos !== pomodoroTotal ? (
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${pomodoroCorriendo ? 'bg-sky-400' : 'bg-amber-400'}`} />
              <span className="font-mono tabular-nums text-slate-100 text-xs font-bold tracking-tight">
                {tiempoPomodoroStr}
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold font-mono tabular-nums text-slate-100">
              {horaActual}
            </span>
          )}

          <div
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold border ${colorRitmo}`}
          >
            {metricas?.porcentajeRitmo ?? 100}%
          </div>

          {itemFocoActivo && !tiempoExpirado && (
            <div className="hidden md:flex items-center gap-1 max-w-[140px] truncate text-[11px] text-slate-300 font-sans border-l border-slate-800 pl-2">
              <span className="truncate">{itemFocoActivo.titulo}</span>
            </div>
          )}

          {tiempoExpirado && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleResetPomodoro();
              }}
              className="w-6 h-6 min-w-0 min-h-0 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
              title="Reiniciar temporizador"
              aria-label="Reiniciar temporizador"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} />
            </button>
          )}

          {pipWindow && (
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-500/30 px-1.5 py-0.5 rounded-full">
              PiP
            </span>
          )}
          </div>
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

      {/* C. MODAL TAREAFLOW INVOCADO DESDE COCKPIT */}
      {modalTareaFlowAbierto && (
        <ModalTareaFlow
          isOpen={modalTareaFlowAbierto}
          onClose={() => setModalTareaFlowAbierto(false)}
          tareaId={null}
          initialTitulo={inputQuickAddTarea}
          initialProyectoCodigo={proyectoQuickAdd}
          onGuardado={() => {
            setModalTareaFlowAbierto(false);
            setInputQuickAddTarea('');
            setQuickAddTareaAbierto(false);
          }}
        />
      )}
    </>
  );
};

export default DailyCockpit;
