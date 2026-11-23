/**
 * ============================================================================
 * ARCHIVO: src/hooks/useCockpitPomodoro.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-REFACTOR-P1-04
 * DESCRIPCIÓN: Custom hook que desacopla el motor Pomodoro, temporizadores,
 *              síntesis Web Audio API (6 perfiles), persistencia en localStorage,
 *              heartbeat BroadcastChannel y acreditación de horas en Dexie.
 * ============================================================================
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../db/db';
import { syncManager } from '../services/syncManager';
import { formatFechaIsoLocal } from '../utils/timeFormatters';
import type { DailyScheduleItem } from './useDailySchedule';

export type PerfilAlarma = 'zen' | 'digital' | 'cristal' | 'gong' | 'radar' | 'silencio';

export const PERFILES_ALARMA: Array<{ id: PerfilAlarma; nombre: string; detalle: string }> = [
  { id: 'zen', nombre: 'Campana Zen', detalle: 'Armónico cálido (528 Hz)' },
  { id: 'digital', nombre: 'Pulso Digital', detalle: 'Doble beep nítido' },
  { id: 'cristal', nombre: 'Arpegio Cristal', detalle: 'Tríada brillante en cascada' },
  { id: 'gong', nombre: 'Gong Tibetano', detalle: 'Graves profundos y resonantes' },
  { id: 'radar', nombre: 'Eco Radar', detalle: 'Barrido secuencial en ascenso' },
  { id: 'silencio', nombre: 'Silencioso', detalle: 'Solo alerta visual y notificación' }
];

export interface UseCockpitPomodoroProps {
  esWidgetNativo?: boolean;
  itemFocoActivo?: DailyScheduleItem | null;
  pipWindow?: Window | null;
}

export function useCockpitPomodoro({
  esWidgetNativo = false,
  itemFocoActivo = null,
  pipWindow = null
}: UseCockpitPomodoroProps = {}) {
  // Duración inicial configurada en localStorage (1 - 180 min)
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
  const itemFocoActivoRef = useRef<DailyScheduleItem | null>(itemFocoActivo);
  itemFocoActivoRef.current = itemFocoActivo;

  const pomodoroTotalRef = useRef<number>(duracionInicialPomodoro);
  pomodoroTotalRef.current = pomodoroTotal;

  // Popover minimalista de duración personalizada (1-180 min)
  const [customMinutosAbierto, setCustomMinutosAbierto] = useState(false);
  const [inputMinutosCustom, setInputMinutosCustom] = useState(String(duracionInicialMin));
  const customPopoverRef = useRef<HTMLDivElement | null>(null);

  // Popover y perfiles de alarma sonora
  const [tiempoExpirado, setTiempoExpirado] = useState(false);
  const [sonidoPopoverAbierto, setSonidoPopoverAbierto] = useState(false);
  const sonidoPopoverRef = useRef<HTMLDivElement | null>(null);

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
    } catch (err) {
      console.warn('[Cockpit] Error al persistir pmo_perfil_alarma en localStorage:', err);
    }
  };

  // Métrica de Bloques Diarios de Foco
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
      } catch (err) {
        console.warn('[Cockpit] Error al leer pmo_foco_metric de localStorage:', err);
      }
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
        } catch (err) {
          console.warn('[Cockpit] Error al leer key de foco actual en registrarBloqueCompletado:', err);
        }
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
          ctxToClose.close().catch((errClose) => {
            console.debug('[Cockpit Audio] Fallo al cerrar ctxToClose promise:', errClose);
          });
        }
      } catch (err) {
        console.debug('[Cockpit Audio] Excepción al cerrar audio context activo:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      cerrarAudioActivo();
    };
  }, []);

  // Web Audio API Synthesis
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
            ctx.close().catch((errClose) => {
              console.debug('[Cockpit Audio] Fallo al cerrar audio context diferido:', errClose);
            });
          }
        } catch (err) {
          console.debug('[Cockpit Audio] Excepción en cierre diferido de audio context:', err);
        }
      }, cierreMs);
    } catch (err) {
      console.warn('[Cockpit Audio] No se pudo reproducir la alarma:', err);
    }
  };

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

  // Motor Absoluto de Temporizador sin Deriva basado en Date.now()
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

  // Efecto de Expiración
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
    } catch (err) {
      console.warn('[Cockpit Pomodoro] Error al guardar pmo_pomodoro_minutos en localStorage:', err);
    }
  };

  const handleAplicarMinutosCustom = () => {
    const min = parseInt(inputMinutosCustom, 10);
    if (!isNaN(min) && min >= 1 && min <= 180) {
      handleSetPresetPomodoro(min);
    }
    setCustomMinutosAbierto(false);
  };

  const tiempoPomodoroStr = useMemo(() => {
    const m = Math.floor(pomodoroSegundos / 60);
    const s = pomodoroSegundos % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [pomodoroSegundos]);

  const pctPomodoro = useMemo(() => {
    return Math.min(100, Math.max(0, ((pomodoroTotal - pomodoroSegundos) / pomodoroTotal) * 100));
  }, [pomodoroTotal, pomodoroSegundos]);

  // Cierre automático de popovers por clic fuera o Escape
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

  // Heartbeat de emisión de presencia si esta ventana es el widget nativo de escritorio
  useEffect(() => {
    if (esWidgetNativo) {
      let channel: BroadcastChannel | null = null;
      try {
        channel = new BroadcastChannel('pmo_hud_bus');
      } catch (err) {
        console.warn('[Cockpit HUD] Error al instanciar BroadcastChannel pmo_hud_bus:', err);
      }

      const interval = setInterval(() => {
        if (channel) {
          try {
            channel.postMessage({ type: 'DESKTOP_WIDGET_ALIVE', timestamp: Date.now() });
          } catch (err) {
            console.debug('[Cockpit HUD] Error al emitir heartbeat por BroadcastChannel:', err);
          }
        }
        try {
          localStorage.setItem('pmo_desktop_widget_heartbeat', String(Date.now()));
        } catch (err) {
          console.debug('[Cockpit HUD] Error al persistir heartbeat en localStorage:', err);
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        if (channel) channel.close();
      };
    }
  }, [esWidgetNativo]);

  return {
    pomodoroSegundos,
    pomodoroTotal,
    pomodoroCorriendo,
    tiempoExpirado,
    tiempoPomodoroStr,
    pctPomodoro,
    perfilAlarma,
    metricasFocoHoy,
    customMinutosAbierto,
    setCustomMinutosAbierto,
    inputMinutosCustom,
    setInputMinutosCustom,
    customPopoverRef,
    sonidoPopoverAbierto,
    setSonidoPopoverAbierto,
    sonidoPopoverRef,
    handleTogglePomodoro,
    handleResetPomodoro,
    handleSetPresetPomodoro,
    handleAplicarMinutosCustom,
    handleCambiarPerfilAlarma,
    reproducirAlarmaFin,
    cerrarAudioActivo
  };
}
