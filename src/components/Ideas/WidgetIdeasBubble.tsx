import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Lightbulb,
  X,
  Paperclip,
  Camera,
  CornerDownLeft,
  Sparkles,
  Minus,
  Maximize2,
  Minimize2,
  Search,
  CheckSquare,
  FolderPlus,
  Activity,
  FileText,
  ArrowRight,
  GripVertical,
  Image as ImageIcon
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { IdeaRecord } from '../../types';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { mostrarToastCobalt } from '../../utils/toastCobalt';
import VoicePill from '../VoicePill';
import SpotlightCard from '../SpotlightCard';

interface WidgetIdeasBubbleProps {
  onAbrirAsistenteIA?: () => void;
  onConvertirATarea?: (idea: { id: string; enunciado: string; detalle: string }) => void;
  onConvertirAProyecto?: (idea: { id: string; enunciado: string; detalle: string }) => void;
  onConvertirAHabito?: (idea: { id: string; enunciado: string; detalle: string }) => void;
  onConvertirANota?: (idea: { id: string; enunciado: string; detalle: string }) => void;
  onNavegarVista?: (vista: any) => void;
}

type TabIdeasVentana = 'inbox' | 'incubacion' | 'procesadas';

interface AdjuntoCapturaRapida {
  nombre: string;
  pesoKb: number;
  tipoMime: string;
  esImagen: boolean;
  dataUri: string;
}

const STORAGE_KEY_BUBBLE_POS = 'pmo_ideas_bubble_pos';
const MARGIN_MINIMO_PANTALLA = 16;
const MAX_IMAGEN_ANCHO = 1280;
const CALIDAD_COMPRESION_IMAGEN = 0.75;
const LIMITE_IMAGEN_BYTES = 400 * 1024;
const LIMITE_DOC_BYTES = 500 * 1024;

function acortarNombreArchivo(nombre: string, maxLen: number = 22): string {
  if (nombre.length <= maxLen) return nombre;
  const dotIdx = nombre.lastIndexOf('.');
  if (dotIdx > 0 && dotIdx < nombre.length - 1) {
    const ext = nombre.slice(dotIdx);
    const baseMax = Math.max(6, maxLen - ext.length - 3);
    return `${nombre.slice(0, baseMax)}...${ext}`;
  }
  return `${nombre.slice(0, maxLen - 3)}...`;
}

function calcularBytesDataUri(dataUri: string): number {
  const commaIdx = dataUri.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUri.slice(commaIdx + 1) : dataUri;
  return Math.ceil((base64.length * 3) / 4);
}

function leerArchivoComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });
}

async function comprimirImagenCanvas(file: File): Promise<{ dataUri: string; pesoBytes: number; tipoMime: string }> {
  const objectUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
    ? URL.createObjectURL(file)
    : null;
  const srcUrl = objectUrl ?? (await leerArchivoComoDataUrl(file));

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const imagen = new Image();
      imagen.onload = () => resolve(imagen);
      imagen.onerror = () => reject(new Error('No se pudo decodificar la imagen.'));
      imagen.src = srcUrl;
    });

    const natW = img.naturalWidth || img.width || 1;
    const natH = img.naturalHeight || img.height || 1;
    let escala = natW > MAX_IMAGEN_ANCHO ? MAX_IMAGEN_ANCHO / natW : 1;
    let calidad = CALIDAD_COMPRESION_IMAGEN;
    let outputMime = 'image/webp';
    let dataUri = '';
    let pesoBytes = 0;

    for (let intento = 0; intento < 3; intento++) {
      const targetW = Math.max(1, Math.round(natW * escala));
      const targetH = Math.max(1, Math.round(natH * escala));
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Contexto Canvas 2D no disponible.');
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);

      dataUri = canvas.toDataURL('image/webp', calidad);
      outputMime = 'image/webp';
      if (!dataUri.startsWith('data:image/webp')) {
        dataUri = canvas.toDataURL('image/jpeg', calidad);
        outputMime = 'image/jpeg';
      }

      pesoBytes = calcularBytesDataUri(dataUri);
      if (pesoBytes < LIMITE_IMAGEN_BYTES) {
        break;
      }
      escala *= 0.78;
      calidad = Math.max(0.5, calidad - 0.12);
    }

    return { dataUri, pesoBytes, tipoMime: outputMime };
  } finally {
    if (objectUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function clampPosicionBurbuja(
  x: number,
  y: number,
  anchoWidget: number,
  altoWidget: number
): { x: number; y: number } {
  const maxX = Math.max(MARGIN_MINIMO_PANTALLA, window.innerWidth - anchoWidget - MARGIN_MINIMO_PANTALLA);
  const maxY = Math.max(MARGIN_MINIMO_PANTALLA, window.innerHeight - altoWidget - MARGIN_MINIMO_PANTALLA);
  return {
    x: Math.round(Math.max(MARGIN_MINIMO_PANTALLA, Math.min(maxX, x))),
    y: Math.round(Math.max(MARGIN_MINIMO_PANTALLA, Math.min(maxY, y)))
  };
}

export const WidgetIdeasBubble: React.FC<WidgetIdeasBubbleProps> = ({
  onAbrirAsistenteIA,
  onConvertirATarea,
  onConvertirAProyecto,
  onConvertirAHabito,
  onConvertirANota,
  onNavegarVista
}) => {
  // Popover de micro-captura
  const [popoverAbierto, setPopoverAbierto] = useState(false);
  const [enunciado, setEnunciado] = useState('');
  const [adjunto, setAdjunto] = useState<AdjuntoCapturaRapida | null>(null);
  const [procesandoAdjunto, setProcesandoAdjunto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fueGrabadoConVoz, setFueGrabadoConVoz] = useState(false);
  const [voiceResetSignal, setVoiceResetSignal] = useState(0);
  const baseTextoVozRef = useRef<string>('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hook de Reconocimiento de Voz Nativo (REQ-IDEAS-VOICE-RECOGNITION-19)
  const {
    isListening,
    isSupported,
    startListening,
    stopListening
  } = useSpeechRecognition({
    onTranscript: (texto) => {
      const base = baseTextoVozRef.current;
      const resultado = base ? `${base} ${texto}` : texto;
      setEnunciado(resultado);
      setFueGrabadoConVoz(true);
    },
    onError: (errorMsg) => {
      mostrarToastCobalt(errorMsg, 'warning');
      setVoiceResetSignal((n) => n + 1);
    }
  });

  // Reset integral de formulario de captura rápida (REQ-IDEAS-UX-REFINEMENT-22 / REQ-UI-31-FIX)
  const resetFormulario = useCallback(() => {
    setEnunciado('');
    setAdjunto(null);
    setProcesandoAdjunto(false);
    setFueGrabadoConVoz(false);
    baseTextoVozRef.current = '';
    setVoiceResetSignal((n) => n + 1);
    if (isListening) {
      stopListening();
    }
  }, [isListening, stopListening]);

  // Cierre y apertura controlados con reset
  const cerrarPopover = useCallback(() => {
    resetFormulario();
    setPopoverAbierto(false);
  }, [resetFormulario]);

  const abrirPopover = useCallback(() => {
    resetFormulario();
    setPopoverAbierto(true);
  }, [resetFormulario]);

  const togglePopover = useCallback(() => {
    if (popoverAbierto) {
      cerrarPopover();
    } else {
      abrirPopover();
    }
  }, [popoverAbierto, cerrarPopover, abrirPopover]);

  // Cierre al hacer clic fuera o pulsar Escape
  useEffect(() => {
    if (!popoverAbierto) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        pillRef.current &&
        !pillRef.current.contains(target)
      ) {
        cerrarPopover();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrarPopover();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [popoverAbierto, cerrarPopover]);

  // Al cerrar el popover, detener cualquier escucha activa
  useEffect(() => {
    if (!popoverAbierto && isListening) {
      stopListening();
    }
  }, [popoverAbierto, isListening, stopListening]);

  // Foco automático limpio en el campo de captura al abrir el popover (REQ-UI-31-HOTFIX)
  useEffect(() => {
    if (!popoverAbierto) return;
    const frameId = requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    return () => cancelAnimationFrame(frameId);
  }, [popoverAbierto]);

  // Receptor externo para apertura por App Shortcuts / Deep-Link (?action=nueva_idea) (REQ-OPS-28)
  useEffect(() => {
    const handleAbrirCapturaExterna = () => {
      abrirPopover();
    };
    window.addEventListener('pmo:abrir-captura-idea', handleAbrirCapturaExterna);
    return () => {
      window.removeEventListener('pmo:abrir-captura-idea', handleAbrirCapturaExterna);
    };
  }, [abrirPopover]);

  const handleVoiceStart = useCallback(() => {
    if (!isSupported) {
      mostrarToastCobalt('Tu navegador no soporta reconocimiento de voz nativo. Usa Chrome o Edge.', 'info');
      setVoiceResetSignal((n) => n + 1);
      return;
    }

    baseTextoVozRef.current = enunciado.trim();
    setFueGrabadoConVoz(true);
    startListening();
  }, [isSupported, enunciado, startListening]);

  const handleVoiceStop = useCallback(() => {
    stopListening();
  }, [stopListening]);

  // Ventana Flotante Canvas/PiP (Draggable & Resizable)
  const [ventanaAbierta, setVentanaAbierta] = useState(false);
  const [ventanaMinimizada, setVentanaMinimizada] = useState(false);
  const [ventanaMaximizada, setVentanaMaximizada] = useState(false);
  const [tabVentana, setTabVentana] = useState<TabIdeasVentana>('inbox');
  const [busquedaDrawer, setBusquedaDrawer] = useState('');

  // Posición del micro-widget flotante con persistencia en localStorage (REQ-UI-31-FIX)
  const [posicion, setPosicion] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    width: number;
    height: number;
  } | null>(null);
  const latestPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Posición y tamaño de la ventana flotante de gestión con persistencia
  const [posicionVentana, setPosicionVentana] = useState<{ x: number; y: number } | null>(null);
  const [tamanoVentana, setTamanoVentana] = useState<{ width: number; height: number } | null>(null);
  const ventanaDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const ventanaResizeRef = useRef<{ startX: number; startY: number; initialW: number; initialH: number } | null>(null);

  // Cargar posiciones y dimensiones guardadas de la píldora y la ventana PiP
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPos = localStorage.getItem(STORAGE_KEY_BUBBLE_POS);
        if (savedPos) {
          const parsed = JSON.parse(savedPos);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            const clamped = clampPosicionBurbuja(parsed.x, parsed.y, 160, 48);
            setPosicion(clamped);
            latestPosRef.current = clamped;
          }
        }
        const savedVentanaPos = localStorage.getItem('pmo_ideas_ventana_pos');
        if (savedVentanaPos) {
          const parsed = JSON.parse(savedVentanaPos);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            setPosicionVentana(parsed);
          }
        }
        const savedVentanaSize = localStorage.getItem('pmo_ideas_ventana_size');
        if (savedVentanaSize) {
          const parsed = JSON.parse(savedVentanaSize);
          if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
            setTamanoVentana(parsed);
          }
        }
      } catch (err) {
        console.warn('Error al leer persistencia de ideas:', err);
      }
    }
  }, []);

  // Re-acotar posición guardada al redimensionar la ventana para evitar salidas de viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setPosicion((prev) => {
        if (!prev) return prev;
        const w = pillRef.current?.offsetWidth || 160;
        const h = pillRef.current?.offsetHeight || 48;
        const clamped = clampPosicionBurbuja(prev.x, prev.y, w, h);
        latestPosRef.current = clamped;
        return clamped;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      dragCleanupRef.current?.();
    };
  }, []);

  // Atajos globales ejecutivos Ctrl+I / Alt+I para captura rápida (REQ-UI-31-HOTFIX)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.altKey) && !e.shiftKey && !e.metaKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        togglePopover();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePopover]);

  // Ideas reactivas desde Dexie
  const ideasRaw = useLiveQuery(() => db.ideas.toArray(), []) ?? [];

  // Conteo reactivo por pestañas
  const ideasInbox = useMemo(() => {
    return ideasRaw.filter((i: IdeaRecord) => {
      const est = (i.estado || '').toUpperCase();
      return est === 'CAPTURA' || est === 'BORRADOR' || est.includes('INBOX');
    });
  }, [ideasRaw]);

  const ideasIncubacion = useMemo(() => {
    return ideasRaw.filter((i: IdeaRecord) => {
      const est = (i.estado || '').toUpperCase();
      return est === 'INCUBANDO' || est === 'EN INCUBACIÓN' || est.includes('INCUBACI');
    });
  }, [ideasRaw]);

  const ideasProcesadas = useMemo(() => {
    return ideasRaw.filter((i: IdeaRecord) => {
      const est = (i.estado || '').toUpperCase();
      return est === 'CONVERTIDA' || est === 'PROCESADA' || est === 'ARCHIVADA';
    });
  }, [ideasRaw]);

  // Total de ideas pendientes activas en Inbox
  const totalIdeasActivas = ideasInbox.length;

  // Filtrado de lista en el Canvas
  const ideasFiltradasCanvas = useMemo(() => {
    let lista = tabVentana === 'inbox' ? ideasInbox : tabVentana === 'incubacion' ? ideasIncubacion : ideasProcesadas;

    if (busquedaDrawer.trim()) {
      const q = busquedaDrawer.toLowerCase();
      lista = lista.filter((i: IdeaRecord) => {
        const enun = (i.enunciado_idea || '').toLowerCase();
        const det = (i.detalle_contexto || '').toLowerCase();
        return enun.includes(q) || det.includes(q);
      });
    }

    return lista.sort((a: IdeaRecord, b: IdeaRecord) => new Date(b.fecha_captura).getTime() - new Date(a.fecha_captura).getTime());
  }, [tabVentana, ideasInbox, ideasIncubacion, ideasProcesadas, busquedaDrawer]);

  // Guardar captura rápida en 1 clic (texto, voz, cámara o archivo adjunto)
  const handleGuardarIdea = async () => {
    if (!enunciado.trim() && !adjunto) return;

    if (isListening) {
      stopListening();
    }

    setGuardando(true);
    try {
      const nowIso = new Date().toISOString();
      const count = await db.ideas.count();
      const codigoLegado = `IDE-${String(count + 1).padStart(3, '0')}`;

      // Desglose: primera línea para Enunciado, resto para Detalle
      const textoLimpio = enunciado.trim();
      const lineas = textoLimpio ? textoLimpio.split(/\r?\n/) : [];
      const enunFinal = lineas[0] || (adjunto ? adjunto.nombre : 'Idea sin título');
      const detFinal = lineas.slice(1).join('\n').trim();
      const tipoCaptura = adjunto
        ? adjunto.esImagen
          ? 'FOTO'
          : 'ARCHIVO'
        : fueGrabadoConVoz
        ? 'VOZ'
        : 'TEXTO';

      await db.ideas.add({
        id: crypto.randomUUID ? crypto.randomUUID() : `ide_${Date.now()}`,
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: codigoLegado,
        enunciado_idea: enunFinal,
        detalle_contexto: detFinal,
        tipo_captura: tipoCaptura,
        url_adjunto_drive: adjunto?.dataUri || '',
        estado: 'CAPTURA',
        fecha_captura: nowIso,
        updated_at: nowIso,
        sync_status: 'synced'
      });

      resetFormulario();
      setPopoverAbierto(false);

      mostrarToastCobalt('Idea capturada en Inbox', 'success');
    } catch (err) {
      console.error('Error al guardar idea rápida:', err);
    } finally {
      setGuardando(false);
    }
  };

  // Convertir idea a Tarea
  const handleConvertirATarea = async (idea: IdeaRecord) => {
    const enun = idea.enunciado_idea || '';
    const det = idea.detalle_contexto || '';
    const nowIso = new Date().toISOString();

    // Actualizar idea a CONVERTIDA
    await db.ideas.update(idea.id, {
      estado: 'CONVERTIDA',
      entidad_convertida: 'Tarea',
      updated_at: nowIso,
      sync_status: 'pending'
    });

    if (onConvertirATarea) {
      onConvertirATarea({ id: idea.id, enunciado: enun, detalle: det });
    } else {
      // Fallback: crear tarea directa en 02_Por_Hacer si no hay callback
      const count = await db.tareas.count();
      await db.tareas.add({
        id: crypto.randomUUID ? crypto.randomUUID() : `tar_${Date.now()}`,
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: `TAR-${String(count + 1).padStart(3, '0')}`,
        nombre_tarea_actividad: enun,
        estado_tarea: '02_Por_Hacer',
        notas_impedimentos: det,
        prioridad_eisenhower: '02_P2_Media',
        nivel_energia_requerido: 'Media_Operativa',
        updated_at: nowIso,
        sync_status: 'pending'
      });
      if (onNavegarVista) onNavegarVista('kanban');
    }

    mostrarToastCobalt('Idea convertida en Tarea', 'success');
  };

  // Convertir idea a Proyecto
  const handleConvertirAProyecto = async (idea: IdeaRecord) => {
    const enun = idea.enunciado_idea || '';
    const det = idea.detalle_contexto || '';
    const nowIso = new Date().toISOString();

    await db.ideas.update(idea.id, {
      estado: 'CONVERTIDA',
      entidad_convertida: 'Proyecto',
      updated_at: nowIso,
      sync_status: 'pending'
    });

    if (onConvertirAProyecto) {
      onConvertirAProyecto({ id: idea.id, enunciado: enun, detalle: det });
    } else {
      const count = await db.proyectos.count();
      await db.proyectos.add({
        id: crypto.randomUUID ? crypto.randomUUID() : `proy_${Date.now()}`,
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: `PRO-${String(count + 1).padStart(3, '0')}`,
        nombre_proyecto: enun,
        tipo_iniciativa: 'Personal',
        estado_proyecto: '01_Ideacion',
        avance_real_pct: 0,
        moneda_base: 'PEN',
        presupuesto_tope: 1000,
        costo_ejecutado_real_pen: 0,
        costo_ejecutado_real_usd: 0,
        north_star_okr: det,
        updated_at: nowIso,
        sync_status: 'pending'
      });
      if (onNavegarVista) onNavegarVista('portafolio');
    }

    mostrarToastCobalt('Idea convertida en Proyecto', 'success');
  };

  // Convertir idea a Hábito
  const handleConvertirAHabito = async (idea: IdeaRecord) => {
    const enun = idea.enunciado_idea || '';
    const det = idea.detalle_contexto || '';
    const nowIso = new Date().toISOString();

    await db.ideas.update(idea.id, {
      estado: 'CONVERTIDA',
      entidad_convertida: 'Hábito',
      updated_at: nowIso,
      sync_status: 'pending'
    });

    if (onConvertirAHabito) {
      onConvertirAHabito({ id: idea.id, enunciado: enun, detalle: det });
    } else {
      const count = await db.actividades_personales.count();
      await db.actividades_personales.add({
        id: crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}`,
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: `ACT-${String(count + 1).padStart(3, '0')}`,
        nombre_actividad: enun,
        estado: '01_Backlog',
        categoria_vida: 'PERSONAL_DESCANSO',
        tipo_compromiso: 'HABITUAL',
        frecuencia_ciclo: 'DIARIA',
        racha_actual: 0,
        fecha_programada: new Date().toISOString().split('T')[0],
        duracion_horas: 0.5,
        agendado_calendar: 'No',
        version: 1,
        created_at: nowIso,
        updated_at: nowIso,
        sync_status: 'pending'
      });
      if (onNavegarVista) onNavegarVista('habitos');
    }

    mostrarToastCobalt('Idea convertida en Hábito', 'success');
  };

  // Convertir idea a Nota
  const handleConvertirANota = async (idea: IdeaRecord) => {
    const enun = idea.enunciado_idea || '';
    const det = idea.detalle_contexto || '';
    const nowIso = new Date().toISOString();

    await db.ideas.update(idea.id, {
      estado: 'CONVERTIDA',
      entidad_convertida: 'Nota',
      updated_at: nowIso,
      sync_status: 'pending'
    });

    const count = await db.notas.count();
    await db.notas.add({
      id: crypto.randomUUID ? crypto.randomUUID() : `not_${Date.now()}`,
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: `NOT-${String(count + 1).padStart(3, '0')}`,
      titulo: enun,
      contenido_markdown: det || enun,
      tipo_nota: 'TEXTO_LIBRE',
      checklists_json: [],
      color_tema: 'indigo',
      es_fijada: false,
      adjuntos_drive_json: [],
      enlaces_entidades_json: [],
      etiquetas: ['idea-convertida'],
      created_at: nowIso,
      updated_at: nowIso,
      version: 1,
      sync_status: 'pending'
    });

    if (onConvertirANota) {
      onConvertirANota({ id: idea.id, enunciado: enun, detalle: det });
    } else if (onNavegarVista) {
      onNavegarVista('notas');
    }

    mostrarToastCobalt('Idea convertida en Nota', 'success');
  };

  // Alternar Incubación
  const handleToggleIncubacion = async (idea: IdeaRecord) => {
    const nuevoEstado = idea.estado === 'INCUBANDO' ? 'CAPTURA' : 'INCUBANDO';
    await db.ideas.update(idea.id, {
      estado: nuevoEstado,
      updated_at: new Date().toISOString(),
      sync_status: 'pending'
    });
  };

  // Detección reactiva de viewport móvil (< 768px) para anclaje despejado sobre BottomNavMobile (REQ-UI-24 / REQ-UI-31-HOTFIX)
  const [esMovil, setEsMovil] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const actualizar = () => setEsMovil(mq.matches);
    actualizar();
    mq.addEventListener('change', actualizar);
    return () => mq.removeEventListener('change', actualizar);
  }, []);

  const procesarArchivoSeleccionado = async (file: File) => {
    setProcesandoAdjunto(true);
    try {
      const esImagen = file.type.startsWith('image/');
      if (esImagen) {
        const comprimido = await comprimirImagenCanvas(file);
        const pesoKb = Math.max(1, Math.round(comprimido.pesoBytes / 1024));
        if (comprimido.pesoBytes > LIMITE_IMAGEN_BYTES) {
          mostrarToastCobalt(`Imagen pesada (${pesoKb}KB). Intenta con una foto más ligera (< 400KB).`, 'warning');
          return;
        }
        setAdjunto({
          nombre: file.name,
          pesoKb,
          tipoMime: comprimido.tipoMime,
          esImagen: true,
          dataUri: comprimido.dataUri
        });
        mostrarToastCobalt(`Imagen lista (${pesoKb}KB)`, 'success');
        return;
      }

      const pesoKb = Math.max(1, Math.round(file.size / 1024));
      if (file.size <= LIMITE_DOC_BYTES) {
        const dataUri = await leerArchivoComoDataUrl(file);
        setAdjunto({
          nombre: file.name,
          pesoKb,
          tipoMime: file.type || 'application/octet-stream',
          esImagen: false,
          dataUri
        });
        mostrarToastCobalt(`Archivo adjuntado (${pesoKb}KB)`, 'success');
      } else {
        const metadataRef = `meta://adjunto?name=${encodeURIComponent(file.name)}&size=${file.size}&type=${encodeURIComponent(file.type || 'application/octet-stream')}`;
        setAdjunto({
          nombre: file.name,
          pesoKb,
          tipoMime: file.type || 'application/octet-stream',
          esImagen: false,
          dataUri: metadataRef
        });
        mostrarToastCobalt(`Archivo > 500KB (${pesoKb}KB): se adjuntó referencia de metadata`, 'info');
      }
    } catch (err) {
      console.error('Error al procesar archivo adjunto:', err);
      mostrarToastCobalt('No se pudo procesar el archivo seleccionado', 'warning');
    } finally {
      setProcesandoAdjunto(false);
    }
  };

  const handleSeleccionarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await procesarArchivoSeleccionado(file);
  };

  const handleCapturarImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await procesarArchivoSeleccionado(file);
  };

  // Arrastre controlado con puntero y persistencia en localStorage (REQ-UI-31-FIX / REQ-UI-31-REFINEMENT)
  const PILL_COLLAPSED_WIDTH = 78;
  const PILL_COLLAPSED_HEIGHT = 48;

  const handlePointerDownGrip = (e: React.PointerEvent) => {
    if (esMovil) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.preventDefault();
    dragCleanupRef.current?.();

    const rect = pillRef.current?.getBoundingClientRect();
    const hasRect = Boolean(rect && rect.width > 0);
    const width = PILL_COLLAPSED_WIDTH;
    const height = hasRect ? rect!.height : PILL_COLLAPSED_HEIGHT;
    const usaAnclajeDerecho = posicion ? posicion.x >= 200 : true;
    const currentX =
      posicion?.x ??
      (hasRect
        ? usaAnclajeDerecho
          ? rect!.right - width
          : rect!.left
        : window.innerWidth - 180);
    const currentY = posicion?.y ?? (hasRect ? rect!.top : window.innerHeight - 80);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
      width,
      height
    };
    latestPosRef.current = { x: currentX, y: currentY };

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = moveEv.clientX - dragRef.current.startX;
      const dy = moveEv.clientY - dragRef.current.startY;
      const nextPos = clampPosicionBurbuja(
        dragRef.current.initialX + dx,
        dragRef.current.initialY + dy,
        dragRef.current.width,
        dragRef.current.height
      );
      latestPosRef.current = nextPos;
      setPosicion(nextPos);
    };

    const cleanup = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      dragCleanupRef.current = null;
    };

    const handlePointerUp = () => {
      const posFinal = latestPosRef.current;
      cleanup();
      if (posFinal) {
        try {
          localStorage.setItem(STORAGE_KEY_BUBBLE_POS, JSON.stringify(posFinal));
        } catch {}
      }
    };

    dragCleanupRef.current = cleanup;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const usaAnclajeDerecho = Boolean(posicion && posicion.x >= 200);
  const containerStyle: React.CSSProperties =
    posicion && !esMovil
      ? {
          position: 'fixed',
          top: `${posicion.y}px`,
          bottom: 'auto',
          ...(usaAnclajeDerecho
            ? {
                right: `${Math.max(
                  MARGIN_MINIMO_PANTALLA,
                  window.innerWidth - (posicion.x + PILL_COLLAPSED_WIDTH)
                )}px`,
                left: 'auto'
              }
            : {
                left: `${posicion.x}px`,
                right: 'auto'
              }),
          zIndex: 9990
        }
      : {};

  const abrirPopoverHaciaAbajo = Boolean(!esMovil && posicion && posicion.y < 340);
  const abrirPopoverHaciaDerecha = Boolean(
    !esMovil && posicion && typeof window !== 'undefined' && posicion.x < window.innerWidth / 2
  );

  // Drag and Drop de la ventana de gestión (REQ-IDEAS-UX-REFINEMENT-22)
  const handleMouseDownVentanaHeader = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (ventanaMaximizada) return;

    e.preventDefault();
    const ventanaElem = document.getElementById('ventana-flotante-ideas');
    const rect = ventanaElem ? ventanaElem.getBoundingClientRect() : null;
    const currentX = rect ? rect.left : (posicionVentana?.x ?? (window.innerWidth - 500));
    const currentY = rect ? rect.top : (posicionVentana?.y ?? (window.innerHeight - 620));

    ventanaDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY
    };

    const handleMouseMove = (moveEv: MouseEvent) => {
      if (!ventanaDragRef.current) return;
      const dx = moveEv.clientX - ventanaDragRef.current.startX;
      const dy = moveEv.clientY - ventanaDragRef.current.startY;

      const currentW = tamanoVentana?.width ?? (rect ? rect.width : 480);
      const minX = 8;
      const maxX = Math.max(8, window.innerWidth - currentW - 8);
      const minY = 8;
      const maxY = Math.max(8, window.innerHeight - 60);

      const newX = Math.max(minX, Math.min(maxX, ventanaDragRef.current.initialX + dx));
      const newY = Math.max(minY, Math.min(maxY, ventanaDragRef.current.initialY + dy));

      const newPos = { x: Math.round(newX), y: Math.round(newY) };
      setPosicionVentana(newPos);
      try {
        localStorage.setItem('pmo_ideas_ventana_pos', JSON.stringify(newPos));
      } catch {}
    };

    const handleMouseUp = () => {
      ventanaDragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Redimensionamiento de la ventana de gestión (REQ-IDEAS-UX-REFINEMENT-22)
  const handleMouseDownVentanaResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (ventanaMaximizada || ventanaMinimizada) return;

    const ventanaElem = document.getElementById('ventana-flotante-ideas');
    const rect = ventanaElem ? ventanaElem.getBoundingClientRect() : null;
    const currentW = rect ? rect.width : (tamanoVentana?.width ?? 480);
    const currentH = rect ? rect.height : (tamanoVentana?.height ?? 580);

    ventanaResizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialW: currentW,
      initialH: currentH
    };

    const handleMouseMove = (moveEv: MouseEvent) => {
      if (!ventanaResizeRef.current) return;
      const dw = moveEv.clientX - ventanaResizeRef.current.startX;
      const dh = moveEv.clientY - ventanaResizeRef.current.startY;

      const minW = Math.min(480, window.innerWidth - 32);
      const maxW = Math.floor(window.innerWidth * 0.95);
      const minH = 400;
      const maxH = Math.floor(window.innerHeight * 0.90);

      const newW = Math.max(minW, Math.min(maxW, ventanaResizeRef.current.initialW + dw));
      const newH = Math.max(minH, Math.min(maxH, ventanaResizeRef.current.initialH + dh));

      const newSize = { width: Math.round(newW), height: Math.round(newH) };
      setTamanoVentana(newSize);
      try {
        localStorage.setItem('pmo_ideas_ventana_size', JSON.stringify(newSize));
      } catch {}
    };

    const handleMouseUp = () => {
      ventanaResizeRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Estilo reactivo de posición y tamaño de la ventana
  const ventanaStyle: React.CSSProperties = ventanaMaximizada
    ? {
        position: 'fixed',
        top: '16px',
        left: '16px',
        right: '16px',
        bottom: '16px',
        width: 'calc(100vw - 32px)',
        height: 'calc(100vh - 32px)',
        zIndex: 9995
      }
    : ventanaMinimizada
    ? {
        position: 'fixed',
        left: posicionVentana ? `${posicionVentana.x}px` : undefined,
        top: posicionVentana ? `${posicionVentana.y}px` : undefined,
        right: !posicionVentana ? '24px' : undefined,
        bottom: !posicionVentana ? '80px' : undefined,
        width: '320px',
        height: '56px',
        zIndex: 9995
      }
    : {
        position: 'fixed',
        left: (posicionVentana && !esMovil) ? `${posicionVentana.x}px` : undefined,
        top: (posicionVentana && !esMovil) ? `${posicionVentana.y}px` : undefined,
        right: (!posicionVentana || esMovil) ? (esMovil ? '8px' : '24px') : undefined,
        bottom: (!posicionVentana || esMovil) ? 'calc(5rem + env(safe-area-inset-bottom, 0px))' : undefined,
        width: esMovil ? 'calc(100vw - 16px)' : `${tamanoVentana?.width ?? 480}px`,
        height: esMovil ? 'min(560px, calc(100dvh - 7rem))' : `${tamanoVentana?.height ?? 580}px`,
        minWidth: esMovil ? 'auto' : 'min(480px, calc(100vw - 32px))',
        minHeight: esMovil ? '300px' : '400px',
        maxWidth: '96vw',
        maxHeight: 'calc(100dvh - 6rem)',
        zIndex: 9995
      };

  return (
    <>
      {/* 1. MICRO-BOTÓN FLOTANTE EJECUTIVO CON ARRASTRE CONTROLADO (REQ-UI-31-FIX) */}
      <div
        id="widget-ideas-bubble-container"
        style={containerStyle}
        className={`${
          !posicion || esMovil ? 'fixed bottom-20 right-3 md:bottom-6 md:right-6' : 'fixed'
        } z-[9990] select-none pointer-events-none`}
      >
        {/* POPOVER DE MICRO-CAPTURA MULTIMODAL CON SPOTLIGHTCARD SUTIL Y TRANSICIÓN VOLUMÉTRICA (REQ-UI-31-HOTFIX-2) */}
        <AnimatePresence>
          {popoverAbierto && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, scale: 0.98, y: abrirPopoverHaciaAbajo ? -4 : 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: abrirPopoverHaciaAbajo ? -4 : 4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transformOrigin: `${abrirPopoverHaciaAbajo ? 'top' : 'bottom'} ${abrirPopoverHaciaDerecha ? 'left' : 'right'}`
              }}
              className={`absolute z-10 pointer-events-auto ${
                abrirPopoverHaciaAbajo ? 'top-full mt-2' : 'bottom-full mb-2'
              } ${abrirPopoverHaciaDerecha ? 'left-0' : 'right-0'}`}
            >
              <SpotlightCard
                id="popover-captura-rapida-idea"
                spotlightColor="rgba(56, 189, 248, 0.12)"
                proximity={0}
                flare={false}
                style={
                  {
                    '--spotlight-card-surface': 'rgba(13, 21, 38, 0.95)',
                    '--spotlight-card-border': 'rgba(30, 41, 59, 0.8)'
                  } as React.CSSProperties
                }
                className="w-80 max-w-[calc(100vw-24px)] sm:w-[360px] bg-[#0D1526]/95 border border-slate-800/80 rounded-2xl !p-3.5 shadow-2xl backdrop-blur-xl focus-within:border-sky-500/50 text-slate-100 flex flex-col gap-2.5 transition-colors duration-150"
              >
                {/* Cabecera minimalista */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wide text-slate-400">
                    Captura rápida
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        cerrarPopover();
                        setVentanaAbierta(true);
                        setVentanaMinimizada(false);
                      }}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 flex items-center justify-center transition-colors cursor-pointer"
                      title="Expandir a Gestión de Ideas"
                      aria-label="Expandir a Gestión de Ideas"
                    >
                      <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={cerrarPopover}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                      title="Cerrar Captura"
                      aria-label="Cerrar Captura"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Textarea minimalista sin bordes ni labels parásitos */}
                <div className="flex flex-col">
                  <textarea
                    ref={textareaRef}
                    id="input-captura-rapida-enunciado"
                    aria-label="Enunciado de la idea rápida"
                    autoFocus
                    rows={4}
                    value={enunciado}
                    onChange={(e) => setEnunciado(e.target.value)}
                    placeholder="Captura un pensamiento, comando o tarea rápida..."
                    className="w-full bg-transparent border-0 p-1 text-sm leading-relaxed text-slate-100 placeholder-slate-500 focus:outline-none resize-none min-h-[88px] font-sans"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) {
                        handleGuardarIdea();
                      }
                    }}
                  />
                </div>

                {/* Inputs ocultos para adjuntos y captura visual */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleSeleccionarArchivo}
                  aria-hidden="true"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCapturarImagen}
                  className="hidden"
                  aria-hidden="true"
                />

                {/* Chip de adjunto flotante justo arriba de la botonera */}
                {(procesandoAdjunto || adjunto) && (
                  <div>
                    {procesandoAdjunto ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 inline-flex items-center gap-1.5 font-mono">
                        Comprimiendo...
                      </span>
                    ) : adjunto ? (
                      <div
                        id="chip-adjunto-captura-rapida"
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1.5 w-fit max-w-full"
                        title={`${adjunto.nombre} (${adjunto.pesoKb}KB)`}
                      >
                        {adjunto.esImagen ? (
                          <ImageIcon className="w-3 h-3 text-sky-400 shrink-0" strokeWidth={1.5} />
                        ) : (
                          <FileText className="w-3 h-3 text-sky-400 shrink-0" strokeWidth={1.5} />
                        )}
                        <span className="truncate font-medium">
                          {acortarNombreArchivo(adjunto.nombre)}
                        </span>
                        <span className="font-mono tabular-nums text-[10px] text-slate-400 shrink-0">
                          ({adjunto.pesoKb}KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdjunto(null)}
                          className="w-4 h-4 rounded text-slate-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Remover adjunto"
                          aria-label="Remover adjunto"
                        >
                          <X className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Barra inferior técnica depurada (REQ-UI-31-HOTFIX-2) */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                  {/* Izquierda: 4 micro-herramientas técnicas en Dark Cobalt */}
                  <div className="flex items-center gap-1 shrink-0">
                    <VoicePill
                      id="btn-quick-voice-record"
                      reactive="simulated"
                      showTime={false}
                      waveform={false}
                      slideToCancel={false}
                      reach={0}
                      shape="rounded"
                      size={32}
                      accentColor="#38bdf8"
                      iconColor="#94a3b8"
                      background="#0B1220"
                      className="rounded-lg text-slate-400 hover:text-slate-100 hover:shadow-[0_0_12px_rgba(56,189,248,0.2)] [&>span:first-child]:!border-slate-800/80 hover:[&>span:first-child]:!border-sky-500/40 data-[state=listening]:shadow-[0_0_14px_rgba(56,189,248,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 focus-visible:outline-offset-1"
                      active={isListening}
                      resetSignal={voiceResetSignal}
                      disabled={guardando || procesandoAdjunto}
                      ariaLabel={isListening ? 'Detener grabación de voz' : 'Grabar Nota de Voz'}
                      title={isListening ? 'Detener grabación de voz' : 'Grabar Nota de Voz'}
                      onStart={handleVoiceStart}
                      onStop={handleVoiceStop}
                    />

                    <button
                      type="button"
                      id="btn-quick-idea-attach"
                      disabled={isListening || procesandoAdjunto || guardando}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-8 h-8 rounded-lg bg-[#0B1220]/70 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-800/60 hover:shadow-[0_0_12px_rgba(56,189,248,0.2)] text-slate-400 hover:text-slate-100 transition-all duration-150 flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 shrink-0 ${
                        isListening || procesandoAdjunto ? 'opacity-40 pointer-events-none' : ''
                      }`}
                      title="Adjuntar archivo o imagen"
                      aria-label="Adjuntar archivo o imagen"
                    >
                      <Paperclip className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    </button>

                    <button
                      type="button"
                      id="btn-quick-idea-camera"
                      disabled={isListening || procesandoAdjunto || guardando}
                      onClick={() => cameraInputRef.current?.click()}
                      className={`w-8 h-8 rounded-lg bg-[#0B1220]/70 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-800/60 hover:shadow-[0_0_12px_rgba(56,189,248,0.2)] text-slate-400 hover:text-slate-100 transition-all duration-150 flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 shrink-0 ${
                        isListening || procesandoAdjunto ? 'opacity-40 pointer-events-none' : ''
                      }`}
                      title="Capturar imagen con cámara"
                      aria-label="Capturar imagen con cámara"
                    >
                      <Camera className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    </button>

                    {onAbrirAsistenteIA && (
                      <button
                        type="button"
                        id="btn-quick-idea-ai"
                        disabled={isListening || guardando}
                        onClick={() => {
                          cerrarPopover();
                          onAbrirAsistenteIA();
                        }}
                        className={`w-8 h-8 rounded-lg bg-[#0B1220]/70 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-800/60 hover:shadow-[0_0_12px_rgba(56,189,248,0.2)] text-sky-400 hover:text-sky-300 transition-all duration-150 flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 shrink-0 ${
                          isListening ? 'opacity-40 pointer-events-none' : ''
                        }`}
                        title="Clarificar con Asistente IA"
                        aria-label="Clarificar con Asistente IA"
                      >
                        <Sparkles className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  {/* Derecha: Atajo visual + Botón Enviar con flecha técnica */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-slate-500 select-none">
                      Ctrl ↵
                    </span>
                    <button
                      type="button"
                      id="btn-quick-idea-submit"
                      disabled={guardando || procesandoAdjunto || (!enunciado.trim() && !adjunto)}
                      onClick={handleGuardarIdea}
                      className={`h-8 px-3 rounded-lg font-semibold text-xs transition-all duration-150 active:scale-95 flex items-center gap-1.5 shrink-0 ${
                        !guardando && !procesandoAdjunto && (enunciado.trim() || adjunto)
                          ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer'
                          : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
                      <CornerDownLeft className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PÍLDORA FLOTANTE COBALT CON HOVER-REVEAL Y ARRASTRE (REQ-UI-31-REFINEMENT) */}
        <div
          ref={pillRef}
          id="widget-ideas-pill"
          className="group flex items-center p-1 rounded-full bg-[#0D1526]/90 backdrop-blur-xl border border-slate-800/80 hover:border-sky-500/40 text-slate-200 shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.12)] transition-colors duration-200 select-none pointer-events-auto"
        >
          {/* Botón Gestor Completo desplegable hacia la izquierda en Hover */}
          <div className="max-w-0 opacity-0 overflow-hidden group-hover:max-w-xs group-hover:opacity-100 group-focus-within:max-w-xs group-focus-within:opacity-100 transition-all duration-300 ease-out flex items-center pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
            <button
              type="button"
              id="btn-widget-ideas-bubble"
              onClick={() => {
                cerrarPopover();
                setVentanaAbierta(true);
                setVentanaMinimizada(false);
              }}
              className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full hover:bg-slate-800/60 text-slate-200 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 focus-visible:outline-offset-1 shrink-0 whitespace-nowrap"
              title="Abrir Gestión de Ideas"
              aria-label={`Abrir Gestión de Ideas (${totalIdeasActivas} en Inbox)`}
            >
              <Lightbulb className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
              <span className="text-xs font-medium text-slate-200">Gestor</span>
              <span
                id="badge-contador-ideas-activas"
                className="font-mono tabular-nums text-[11px] bg-slate-800 text-slate-300 border border-slate-700/60 px-1.5 py-0.5 leading-none rounded-full"
              >
                {totalIdeasActivas}
              </span>
            </button>
            <div className="w-[1px] h-5 bg-slate-800/80 mx-1 shrink-0" />
          </div>

          {/* Botón Visible por Defecto: Nueva Idea Rápida (+) */}
          <button
            type="button"
            id="btn-widget-ideas-add"
            onClick={togglePopover}
            className="w-10 h-10 rounded-full bg-sky-600 hover:bg-sky-500 active:scale-95 text-white flex items-center justify-center shadow-sm transition-colors duration-150 cursor-pointer border border-sky-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 focus-visible:outline-offset-2 shrink-0"
            title="Nueva Idea Rápida (Ctrl+I / Alt+I)"
            aria-label="Nueva Idea Rápida"
          >
            <Plus className="w-5 h-5 pointer-events-none" strokeWidth={1.75} />
          </button>

          {/* Micro-grip de arrastre en desktop (sin interferir en reposo ni hover) */}
          <button
            type="button"
            id="widget-ideas-drag-handle"
            onPointerDown={handlePointerDownGrip}
            className="hidden md:flex items-center justify-center w-6 h-8 rounded-r-full text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing touch-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 shrink-0"
            title="Arrastrar widget de ideas"
            aria-label="Arrastrar widget de ideas"
          >
            <GripVertical className="w-3.5 h-3.5 pointer-events-none" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. VENTANA FLOTANTE ESTILO CANVAS / PIP (ARRASTRABLE Y REDIMENSIONABLE)*/}
      {/* ===================================================================== */}
      {ventanaAbierta && (
        <div
          id="ventana-flotante-ideas"
          style={ventanaStyle}
          className="ideas-floating-window fixed z-[9995] rounded-3xl bg-[#0D1526]/95 backdrop-blur-2xl border border-slate-800/60 shadow-[0_25px_60px_-15px_rgba(2,6,23,0.9),0_0_20px_rgba(30,58,138,0.25)] select-none flex flex-col overflow-hidden transition-[box-shadow,border-color] duration-200 pointer-events-auto"
        >
          {/* Cabecera Arrastrable con Controles PIP */}
          <div
            id="ideas-floating-drag-header"
            onMouseDown={handleMouseDownVentanaHeader}
            className="p-3 px-4 border-b border-slate-800/60 flex items-center justify-between shrink-0 bg-[#040711]/40 cursor-grab active:cursor-grabbing select-none"
            title="Arrastrar ventana"
          >
            <div className="flex items-center gap-2.5 pointer-events-none">
              <div className="w-7 h-7 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                <Lightbulb className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-100 tracking-tight">
                  Gestión de Ideas
                </span>
                <span
                  id="drawer-ideas-total-badge"
                  className="font-mono tabular-nums text-[11px] bg-slate-800 text-slate-300 border border-slate-700/60 px-1.5 py-0.5 rounded-full"
                >
                  {ideasRaw.length}
                </span>
              </div>
            </div>

            {/* Controles de Ventana PIP */}
            <div className="flex items-center gap-1">
              {/* Botón Minimizar */}
              <button
                type="button"
                onClick={() => setVentanaMinimizada(!ventanaMinimizada)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title={ventanaMinimizada ? 'Restaurar ventana' : 'Minimizar ventana'}
              >
                <Minus className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>

              {/* Botón Maximizar / Restaurar */}
              <button
                type="button"
                id="btn-maximize-ideas-window"
                onClick={() => {
                  setVentanaMaximizada(!ventanaMaximizada);
                  setVentanaMinimizada(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Maximizar / Restaurar"
              >
                {ventanaMaximizada ? (
                  <Minimize2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                )}
              </button>

              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={() => setVentanaAbierta(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {!ventanaMinimizada && (
            <>
              {/* Barra de Filtros y Búsqueda */}
              <div
                id="ideas-floating-filterbar"
                className="p-2.5 sm:px-3 border-b border-slate-800/60 bg-[#040711]/30 flex flex-col gap-2 shrink-0"
              >
                {/* Pestañas Zen: Inbox | Incubación | Procesadas */}
                <div className="flex items-center justify-between gap-1 p-0.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <button
                    type="button"
                    id="tab-ideas-inbox"
                    onClick={() => setTabVentana('inbox')}
                    className={`flex-1 text-center py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      tabVentana === 'inbox'
                        ? 'bg-sky-950/40 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    Inbox (<span id="count-tab-ideas-inbox" className="font-mono tabular-nums">{ideasInbox.length}</span>)
                  </button>
                  <button
                    type="button"
                    id="tab-ideas-incubacion"
                    onClick={() => setTabVentana('incubacion')}
                    className={`flex-1 text-center py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      tabVentana === 'incubacion'
                        ? 'bg-sky-950/40 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    Incubación (<span id="count-tab-ideas-incubacion" className="font-mono tabular-nums">{ideasIncubacion.length}</span>)
                  </button>
                  <button
                    type="button"
                    id="tab-ideas-procesadas"
                    onClick={() => setTabVentana('procesadas')}
                    className={`flex-1 text-center py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      tabVentana === 'procesadas'
                        ? 'bg-sky-950/40 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    Procesadas (<span id="count-tab-ideas-procesadas" className="font-mono tabular-nums">{ideasProcesadas.length}</span>)
                  </button>
                </div>

                {/* Buscador Reactivo */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" strokeWidth={1.75} />
                  <input
                    type="text"
                    id="input-busqueda-ideas-drawer"
                    value={busquedaDrawer}
                    onChange={(e) => setBusquedaDrawer(e.target.value)}
                    placeholder="Buscar en ideas capturadas..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#040711]/60 text-slate-200 placeholder-slate-500 rounded-lg border border-slate-800/80 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition outline-none"
                  />
                  {busquedaDrawer && (
                    <button
                      type="button"
                      onClick={() => setBusquedaDrawer('')}
                      className="absolute right-2 top-2 text-slate-500 hover:text-slate-300 text-xs flex items-center"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </div>

              {/* Contenedor con Scroll de la Lista de Ideas */}
              <div id="ideas-floating-body" className="flex-1 overflow-hidden flex flex-col relative">
                <div
                  id="contenedor-lista-ideas-drawer"
                  className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar"
                >
                  {ideasFiltradasCanvas.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-600">
                        <Lightbulb className="w-6 h-6" strokeWidth={1.75} />
                      </div>
                      <span className="font-medium text-slate-400">No hay ideas en esta sección</span>
                    </div>
                  ) : (
                    ideasFiltradasCanvas.map((idea: IdeaRecord) => {
                      const tagsIdea = (idea.enunciado_idea || '').match(/#[\w-]+/g) || [];

                      return (
                        <div
                          key={idea.id}
                          className="p-3.5 rounded-2xl bg-[#040711]/40 hover:bg-[#040711]/70 border border-slate-800/60 hover:border-sky-500/30 transition-all duration-150 flex flex-col gap-2.5 group shadow-xs"
                        >
                          {/* Fila 1: ID, Tipo y Fecha */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5 text-sky-300">
                                <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.75} />
                              </span>
                              <span className="font-mono text-[10px] font-bold text-slate-400 tracking-wider">
                                {idea.codigo_legado}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono tabular-nums text-[10px] text-slate-500">
                                {new Date(idea.fecha_captura).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </div>

                          {/* Enunciado */}
                          <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed group-hover:text-sky-200 transition-colors">
                            {idea.enunciado_idea}
                          </p>

                          {/* Detalle si existe */}
                          {idea.detalle_contexto && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal">
                              {idea.detalle_contexto}
                            </p>
                          )}

                          {/* Tags compactos */}
                          {tagsIdea.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {tagsIdea.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Indicador de adjunto o foto persistida */}
                          {idea.url_adjunto_drive && (
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded-lg w-fit">
                              {idea.tipo_captura === 'FOTO' ? (
                                <ImageIcon className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                              ) : (
                                <Paperclip className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                              )}
                              <span>
                                {idea.tipo_captura === 'FOTO' ? 'Imagen adjunta' : 'Archivo adjunto'}
                              </span>
                            </div>
                          )}

                          {/* Badges de Estado o Entidad Convertida */}
                          {idea.entidad_convertida && (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                              <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                              <span>Convertida a {idea.entidad_convertida}</span>
                            </div>
                          )}

                          {/* 4 BOTONES CANÓNICOS DE CONVERSIÓN DIRECTA */}
                          {tabVentana !== 'procesadas' && (
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1">
                                {/* Botón 1: -> Tarea */}
                                <button
                                  type="button"
                                  id="btn-convertir-tarea"
                                  onClick={() => handleConvertirATarea(idea)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 flex items-center gap-1 transition cursor-pointer"
                                  title="Convertir en Tarea del Kanban"
                                >
                                  <CheckSquare className="w-3 h-3 text-indigo-400" strokeWidth={1.75} />
                                  <span>Tarea</span>
                                </button>

                                {/* Botón 2: -> Proyecto */}
                                <button
                                  type="button"
                                  id="btn-convertir-proyecto"
                                  onClick={() => handleConvertirAProyecto(idea)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 flex items-center gap-1 transition cursor-pointer"
                                  title="Convertir en Nuevo Proyecto"
                                >
                                  <FolderPlus className="w-3 h-3 text-purple-400" strokeWidth={1.75} />
                                  <span>Proyecto</span>
                                </button>

                                {/* Botón 3: -> Hábito */}
                                <button
                                  type="button"
                                  id="btn-convertir-habito"
                                  onClick={() => handleConvertirAHabito(idea)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 flex items-center gap-1 transition cursor-pointer"
                                  title="Convertir en Hábito / Rutina"
                                >
                                  <Activity className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
                                  <span>Hábito</span>
                                </button>

                                {/* Botón 4: -> Nota */}
                                <button
                                  type="button"
                                  id="btn-convertir-nota"
                                  onClick={() => handleConvertirANota(idea)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30 flex items-center gap-1 transition cursor-pointer"
                                  title="Generar Nota en Módulo de Notas"
                                >
                                  <FileText className="w-3 h-3 text-amber-400" strokeWidth={1.75} />
                                  <span>Nota</span>
                                </button>
                              </div>

                              {/* Toggle Incubación */}
                              <button
                                type="button"
                                onClick={() => handleToggleIncubacion(idea)}
                                className="px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/5 transition cursor-pointer"
                                title={idea.estado === 'INCUBANDO' ? 'Regresar a Inbox' : 'Mover a Incubación'}
                              >
                                {idea.estado === 'INCUBANDO' ? 'A Inbox' : 'Incubar'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

          {/* Resizable Corner Handle interactivo (REQ-IDEAS-UX-REFINEMENT-22) */}
          {!ventanaMaximizada && !ventanaMinimizada && (
            <div
              id="ideas-floating-resize-handle"
              onMouseDown={handleMouseDownVentanaResize}
              className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-500 hover:text-sky-400 transition-colors select-none z-20"
              title="Redimensionar ventana"
            >
              <svg viewBox="0 0 6 6" className="w-2.5 h-2.5 fill-current opacity-60 hover:opacity-100">
                <circle cx="5" cy="5" r="0.75" />
                <circle cx="5" cy="3" r="0.75" />
                <circle cx="3" cy="5" r="0.75" />
                <circle cx="5" cy="1" r="0.75" />
                <circle cx="3" cy="3" r="0.75" />
                <circle cx="1" cy="5" r="0.75" />
              </svg>
            </div>
          )}
        </div>
      )}
    </>
  );
};
