import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus,
  Lightbulb,
  X,
  Mic,
  Paperclip,
  Check,
  Sparkles,
  Minus,
  Maximize2,
  Minimize2,
  Search,
  CheckSquare,
  FolderPlus,
  Activity,
  FileText,
  ArrowRight
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { IdeaRecord } from '../../types';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import Swal from 'sweetalert2';

interface WidgetIdeasBubbleProps {
  onAbrirAsistenteIA?: () => void;
  onConvertirATarea?: (idea: { id: string; enunciado: string; detalle: string }) => void;
  onConvertirAProyecto?: (idea: { id: string; enunciado: string; detalle: string }) => void;
  onConvertirAHabito?: (idea: { id: string; enunciado: string; detalle: string }) => void;
  onConvertirANota?: (idea: { id: string; enunciado: string; detalle: string }) => void;
  onNavegarVista?: (vista: any) => void;
}

type TabIdeasVentana = 'inbox' | 'incubacion' | 'procesadas';

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
  const [guardando, setGuardando] = useState(false);
  const [fueGrabadoConVoz, setFueGrabadoConVoz] = useState(false);
  const baseTextoVozRef = useRef<string>('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

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
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: errorMsg,
        showConfirmButton: false,
        timer: 3000,
        background: '#0D1526',
        color: '#f8fafc'
      });
    }
  });

  // Reset integral de formulario de captura rápida (REQ-IDEAS-UX-REFINEMENT-22)
  const resetFormulario = useCallback(() => {
    setEnunciado('');
    setFueGrabadoConVoz(false);
    baseTextoVozRef.current = '';
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

  const handleToggleVoz = () => {
    if (!isSupported) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Tu navegador no soporta reconocimiento de voz nativo. Usa Chrome o Edge.',
        showConfirmButton: false,
        timer: 3500,
        background: '#0D1526',
        color: '#f8fafc'
      });
      return;
    }

    if (!isListening) {
      baseTextoVozRef.current = enunciado.trim();
      startListening();
    } else {
      stopListening();
    }
  };

  // Ventana Flotante Canvas/PiP (Draggable & Resizable)
  const [ventanaAbierta, setVentanaAbierta] = useState(false);
  const [ventanaMinimizada, setVentanaMinimizada] = useState(false);
  const [ventanaMaximizada, setVentanaMaximizada] = useState(false);
  const [tabVentana, setTabVentana] = useState<TabIdeasVentana>('inbox');
  const [busquedaDrawer, setBusquedaDrawer] = useState('');

  // Posición del micro-widget flotante con persistencia en localStorage
  const [posicion, setPosicion] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Posición y tamaño de la ventana flotante de gestión con persistencia
  const [posicionVentana, setPosicionVentana] = useState<{ x: number; y: number } | null>(null);
  const [tamanoVentana, setTamanoVentana] = useState<{ width: number; height: number } | null>(null);
  const ventanaDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const ventanaResizeRef = useRef<{ startX: number; startY: number; initialW: number; initialH: number } | null>(null);

  // Cargar posiciones y dimensiones guardadas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPos = localStorage.getItem('pmo_ideas_bubble_pos');
        if (savedPos) {
          const parsed = JSON.parse(savedPos);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            setPosicion(parsed);
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

  // Atajo global Alt+I
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'i' || e.key === 'I')) {
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

  // Guardar captura rápida en 1 clic
  const handleGuardarIdea = async () => {
    if (!enunciado.trim()) return;

    if (isListening) {
      stopListening();
    }

    setGuardando(true);
    try {
      const nowIso = new Date().toISOString();
      const count = await db.ideas.count();
      const codigoLegado = `IDE-${String(count + 1).padStart(3, '0')}`;

      // Desglose: primera línea para Enunciado, resto para Detalle
      const lineas = enunciado.trim().split(/\r?\n/);
      const enunFinal = lineas[0] || 'Idea sin título';
      const detFinal = lineas.slice(1).join('\n').trim();

      await db.ideas.add({
        id: crypto.randomUUID ? crypto.randomUUID() : `ide_${Date.now()}`,
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: codigoLegado,
        enunciado_idea: enunFinal,
        detalle_contexto: detFinal,
        tipo_captura: fueGrabadoConVoz ? 'VOZ' : 'TEXTO',
        estado: 'CAPTURA',
        fecha_captura: nowIso,
        updated_at: nowIso,
        sync_status: 'synced'
      });

      resetFormulario();
      setPopoverAbierto(false);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Idea capturada en Inbox',
        showConfirmButton: false,
        timer: 1500,
        background: '#0D1526',
        color: '#f8fafc'
      });
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

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Idea convertida en Tarea',
      showConfirmButton: false,
      timer: 1500,
      background: '#0D1526',
      color: '#f8fafc'
    });
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

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Idea convertida en Proyecto',
      showConfirmButton: false,
      timer: 1500,
      background: '#0D1526',
      color: '#f8fafc'
    });
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

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Idea convertida en Hábito',
      showConfirmButton: false,
      timer: 1500,
      background: '#0D1526',
      color: '#f8fafc'
    });
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

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Idea convertida en Nota',
      showConfirmButton: false,
      timer: 1500,
      background: '#0D1526',
      color: '#f8fafc'
    });
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

  // Drag and Drop de la cápsula flotante
  const handleMouseDownGrip = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentX = posicion?.x ?? (window.innerWidth - 80);
    const currentY = posicion?.y ?? (window.innerHeight - 80);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY
    };

    const handleMouseMove = (moveEv: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = moveEv.clientX - dragRef.current.startX;
      const dy = moveEv.clientY - dragRef.current.startY;
      const newX = Math.max(16, Math.min(window.innerWidth - 90, dragRef.current.initialX + dx));
      const newY = Math.max(16, Math.min(window.innerHeight - 90, dragRef.current.initialY + dy));
      const newPos = { x: newX, y: newY };
      setPosicion(newPos);
      try {
        localStorage.setItem('pmo_ideas_bubble_pos', JSON.stringify(newPos));
      } catch (err) {}
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Estilo de posición del contenedor
  const containerStyle: React.CSSProperties = posicion
    ? {
        position: 'fixed',
        left: `${posicion.x}px`,
        top: `${posicion.y}px`,
        bottom: 'auto',
        right: 'auto',
        zIndex: 9990
      }
    : {};

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
        left: posicionVentana ? `${posicionVentana.x}px` : undefined,
        top: posicionVentana ? `${posicionVentana.y}px` : undefined,
        right: !posicionVentana ? '24px' : undefined,
        bottom: !posicionVentana ? '80px' : undefined,
        width: `${tamanoVentana?.width ?? 480}px`,
        height: `${tamanoVentana?.height ?? 580}px`,
        minWidth: 'min(480px, calc(100vw - 32px))',
        minHeight: '400px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        zIndex: 9995
      };

  return (
    <>
      {/* 1. MICRO-BOTÓN FLOTANTE EXPANDIBLE (Dynamic Micro-Pill) */}
      <div
        id="widget-ideas-bubble-container"
        style={containerStyle}
        className={`fixed ${!posicion ? 'bottom-20 md:bottom-6 right-4 md:right-6' : ''} z-[9990] flex flex-col items-end gap-2.5 select-none pointer-events-auto`}
      >
        {/* POPOVER DE MICRO-CAPTURA RÁPIDA */}
        {popoverAbierto && (
          <div
            ref={popoverRef}
            id="popover-captura-rapida-idea"
            className="w-80 sm:w-96 p-4 rounded-3xl bg-[#0D1526]/95 backdrop-blur-xl border border-slate-800/60 shadow-[0_20px_50px_rgba(2,6,23,0.8),0_0_25px_rgba(56,189,248,0.12)] focus-within:border-sky-500/50 focus-within:shadow-[0_20px_50px_rgba(2,6,23,0.8),0_0_30px_rgba(56,189,248,0.2)] text-slate-100 flex flex-col gap-3.5 transition-all duration-200 origin-bottom-right animate-in fade-in zoom-in-95"
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
                <span className="text-xs font-bold tracking-wide text-slate-200">
                  Captura Rápida de Idea
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    cerrarPopover();
                    setVentanaAbierta(true);
                    setVentanaMinimizada(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-white/5 transition cursor-pointer"
                  title="Expandir a Gestión de Ideas"
                >
                  <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={cerrarPopover}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
                  title="Cerrar Captura"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Textarea con tipografía limpia y contador de caracteres */}
            <div className="relative flex flex-col gap-1.5">
              <textarea
                id="input-captura-rapida-enunciado"
                rows={4}
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                placeholder="Escribe tu chispazo, idea o nota rápida... (usa #tags)"
                className="w-full bg-[#040711]/80 border border-slate-800/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all duration-200 resize-none min-h-[105px] leading-relaxed font-sans"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleGuardarIdea();
                  }
                }}
              />
              <div className="flex items-center justify-between px-1">
                <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                  {enunciado.length} caracteres
                </span>
                {fueGrabadoConVoz && (
                  <span className="font-mono text-[10px] text-sky-400/80 flex items-center gap-1">
                    <Mic className="w-2.5 h-2.5" strokeWidth={1.75} />
                    Vía voz
                  </span>
                )}
              </div>
            </div>

            {/* Footer de Controles */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                {/* Botón Compacto de Voz Unificado (REQ-IDEAS-UX-REFINEMENT-22) */}
                <button
                  type="button"
                  id="btn-quick-voice-record"
                  onClick={handleToggleVoz}
                  className={
                    isListening
                      ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-medium animate-pulse cursor-pointer transition-all'
                      : 'px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer'
                  }
                  title={isListening ? 'Detener grabación de voz' : 'Grabar Nota de Voz'}
                >
                  {isListening ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                      <span className="font-mono text-[11px] font-medium">Escuchando... [Detener]</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                      <span className="font-mono text-[11px]">Voz</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    Swal.fire({
                      toast: true,
                      position: 'top-end',
                      icon: 'info',
                      title: 'Adjuntos disponibles en notas',
                      showConfirmButton: false,
                      timer: 1500,
                      background: '#0D1526',
                      color: '#f8fafc'
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  title="Adjuntar archivo"
                >
                  <Paperclip className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
                  <span className="font-mono text-[11px]">Adjuntar</span>
                </button>
                {onAbrirAsistenteIA && (
                  <button
                    type="button"
                    onClick={() => {
                      cerrarPopover();
                      onAbrirAsistenteIA();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title="Abrir Asistente IA"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                    <span className="font-mono text-[11px]">IA</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                id="btn-quick-idea-submit"
                disabled={guardando || !enunciado.trim()}
                onClick={handleGuardarIdea}
                className={`px-4 py-1.5 rounded-xl transition-all duration-150 flex items-center gap-1.5 text-xs font-bold shadow-md cursor-pointer ${
                  enunciado.trim()
                    ? 'bg-sky-600 hover:bg-sky-500 active:scale-95 text-white shadow-sky-600/30'
                    : 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                }`}
              >
                <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
                <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        )}

        {/* CONTENEDOR FLOTANTE: [ DRAG HANDLE ] + [ BOTÓN '+' ] + [ HOVER: FOCO + CONTADOR ] */}
        <div
          ref={pillRef}
          id="widget-ideas-pill"
          className="group flex items-center p-1 rounded-full bg-[#0D1526]/90 backdrop-blur-xl border border-slate-800/60 shadow-2xl transition-all duration-300 ease-out select-none"
        >
          {/* 1. Drag Handle interactivo con 6 puntos */}
          <div
            id="widget-ideas-drag-handle"
            onMouseDown={handleMouseDownGrip}
            className="flex items-center justify-center w-5 h-8 px-1 text-slate-400 hover:text-slate-200 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
            title="Arrastrar widget de ideas"
          >
            <div className="grid grid-cols-2 gap-0.5">
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              <span className="w-1 h-1 rounded-full bg-slate-400" />
            </div>
          </div>

          {/* 2. Micro-Botón (+) de Captura Rápida con Reset Seguro */}
          <button
            type="button"
            id="btn-widget-ideas-add"
            onClick={togglePopover}
            className="w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-sky-400/40 shrink-0"
            title="Nueva Idea Rápida (+)"
          >
            <Plus className="w-4 h-4 pointer-events-none" strokeWidth={1.75} />
          </button>

          {/* 3. Foco + Contador en Hover */}
          <div className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-focus-within:max-w-xs group-focus-within:opacity-100 transition-all duration-300 ease-out flex items-center overflow-hidden pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
            <div className="w-[1px] h-4 bg-white/10 mx-1 shrink-0" />

            <button
              type="button"
              id="btn-widget-ideas-bubble"
              onClick={() => {
                cerrarPopover();
                setVentanaAbierta(true);
                setVentanaMinimizada(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Abrir Gestión de Ideas"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-sky-500 flex items-center justify-center text-white shadow-xs">
                <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.75} />
              </div>

              {/* Micro-badge contador con pulsación si hay más de 5 ideas pendientes */}
              <span
                id="badge-contador-ideas-activas"
                className={`font-mono tabular-nums text-[11px] font-bold px-1.5 py-0.2 rounded-full border ${
                  totalIdeasActivas > 5
                    ? 'animate-pulse bg-amber-500/30 text-amber-200 border-amber-400'
                    : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                }`}
              >
                {totalIdeasActivas}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. VENTANA FLOTANTE ESTILO CANVAS / PIP (ARRASTRABLE Y REDIMENSIONABLE)*/}
      {/* ===================================================================== */}
      {ventanaAbierta && (
        <div
          id="ventana-flotante-ideas"
          style={ventanaStyle}
          className="ideas-floating-window fixed z-[9995] rounded-3xl bg-[#0D1526]/95 backdrop-blur-2xl border border-slate-800/60 shadow-[0_25px_60px_-15px_rgba(2,6,23,0.9),0_0_20px_rgba(30,58,138,0.25)] select-none flex flex-col overflow-hidden transition-[box-shadow,border-color] duration-200"
        >
          {/* Cabecera Arrastrable con Controles PIP */}
          <div
            id="ideas-floating-drag-header"
            onMouseDown={handleMouseDownVentanaHeader}
            className="p-3 px-4 border-b border-slate-800/60 flex items-center justify-between shrink-0 bg-[#040711]/40 cursor-grab active:cursor-grabbing select-none"
            title="Arrastrar ventana"
          >
            <div className="flex items-center gap-2.5 pointer-events-none">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400/20 via-orange-500/20 to-sky-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                <Lightbulb className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-100 tracking-tight">
                  Gestión de Ideas
                </span>
                <span
                  id="drawer-ideas-total-badge"
                  className="font-mono tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30"
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
