/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalAtajosTeclado.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-1TO1-002 / REQ-F1-P1.2
 * DESCRIPCIÓN: Modal interactivo de configuración y consulta de atajos de teclado
 *              con paridad visual 1:1 de Modal_AtajosYPdf.html, elevación z-[10000],
 *              soporte portal top-level, scroll-lock y erradicación total de emojis.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  X,
  Keyboard,
  Zap,
  RotateCcw,
  Columns,
  Briefcase,
  HeartPulse,
  Wallet,
  FileText,
  Calendar,
  Sparkles,
  Plus,
  Users,
  User,
  Clock,
  AlertTriangle,
  Search,
  FolderTree,
  Crosshair,
  Sprout,
  Flame,
  CreditCard,
  DollarSign,
  Layers,
  LayoutGrid,
  Pin,
  CheckSquare
} from 'lucide-react';

export type ScopeAtajo = 'global' | 'kanban' | 'portafolio' | 'habitos' | 'finanzas' | 'notas';

export interface ShortcutItem {
  id: string;
  scope: ScopeAtajo;
  defaultKey: string;
  label: string;
  iconName: string;
  desc: string;
}

export const CANONICAL_SHORTCUTS: ShortcutItem[] = [
  // GLOBALES
  { id: 'global_nav_kanban', scope: 'global', defaultKey: '1', label: 'Ir a Tablero Kanban', iconName: 'kanban', desc: 'Navega inmediatamente al tablero principal de tareas' },
  { id: 'global_nav_portafolio', scope: 'global', defaultKey: '2', label: 'Ir a Portafolio Ejecutivo', iconName: 'portafolio', desc: 'Navega al portafolio de proyectos e iniciativas WBS' },
  { id: 'global_nav_habitos', scope: 'global', defaultKey: '3', label: 'Ir a Hábitos & Vida', iconName: 'habitos', desc: 'Navega a la gestión de hábitos y compromisos personales' },
  { id: 'global_nav_finanzas', scope: 'global', defaultKey: '4', label: 'Ir a Flujo y Finanzas', iconName: 'finanzas', desc: 'Navega al control financiero, gastos e ingresos' },
  { id: 'global_nav_notas', scope: 'global', defaultKey: '5', label: 'Ir a Notas Inteligentes', iconName: 'notas', desc: 'Navega a notas inteligentes, checklists y referencias' },
  { id: 'global_calendar', scope: 'global', defaultKey: 'c', label: 'Abrir Google Calendar', iconName: 'calendar', desc: 'Abre Google Calendar en pestaña nueva (blindado fuera de inputs)' },
  { id: 'global_sync', scope: 'global', defaultKey: 'r', label: 'Sincronizar y Refrescar', iconName: 'refresh', desc: 'Sincroniza datos con la nube y puente local, y refresca estados' },
  { id: 'global_limpiar', scope: 'global', defaultKey: 'x', label: 'Limpiar Filtros Activos', iconName: 'limpiar', desc: 'Resetea filtros, búsquedas y selecciones en la vista activa' },
  { id: 'global_atajos', scope: 'global', defaultKey: '?', label: 'Abrir Guía de Atajos', iconName: 'atajos', desc: 'Despliega este configurador interactivo de comandos' },

  // KANBAN
  { id: 'kanban_nueva_tarea', scope: 'kanban', defaultKey: 'n', label: '+ Nueva Tarea Kanban', iconName: 'plus', desc: 'Abre modal interactivo para crear una nueva tarea' },
  { id: 'kanban_ctx_todos', scope: 'kanban', defaultKey: 'a', label: 'Contexto: Todos', iconName: 'users', desc: 'Visualiza iniciativas de proyectos y tareas personales juntos' },
  { id: 'kanban_ctx_proy', scope: 'kanban', defaultKey: 'p', label: 'Contexto: Solo Proyectos', iconName: 'portafolio', desc: 'Filtra únicamente tareas vinculadas a proyectos' },
  { id: 'kanban_ctx_pers', scope: 'kanban', defaultKey: 'u', label: 'Contexto: Solo Personal', iconName: 'user', desc: 'Filtra únicamente actividades de vida personal' },
  { id: 'kanban_time_hoy', scope: 'kanban', defaultKey: 'h', label: 'Horizonte: Hoy', iconName: 'zap', desc: 'Filtra tareas para el día de hoy (En foco + En proceso)' },
  { id: 'kanban_time_semana', scope: 'kanban', defaultKey: 'w', label: 'Horizonte: Esta Semana', iconName: 'calendar', desc: 'Filtra tareas correspondientes a la semana en curso' },
  { id: 'kanban_time_mes', scope: 'kanban', defaultKey: 'm', label: 'Horizonte: Este Mes', iconName: 'clock', desc: 'Filtra tareas del mes calendario en curso' },
  { id: 'kanban_time_todo', scope: 'kanban', defaultKey: 't', label: 'Horizonte: Todo el Tiempo', iconName: 'layers', desc: 'Muestra todas las tareas sin restricción temporal' },
  { id: 'kanban_vencidas', scope: 'kanban', defaultKey: 'v', label: 'Alternar Tareas Vencidas', iconName: 'alert', desc: 'Alterna el filtro rápido para ver tareas con fecha vencida' },
  { id: 'kanban_buscar', scope: 'kanban', defaultKey: 'f', label: 'Buscar tarea en Kanban', iconName: 'search', desc: 'Pone el foco en el campo de búsqueda del tablero' },

  // PORTAFOLIO
  { id: 'portafolio_nuevo_proy', scope: 'portafolio', defaultKey: 'n', label: '+ Nuevo Proyecto (Wizard con IA)', iconName: 'sparkles', desc: 'Abre el asistente interactivo de creación de proyecto WBS' },
  { id: 'portafolio_alternar_vista', scope: 'portafolio', defaultKey: 'v', label: 'Alternar Cuadrícula / Tabla', iconName: 'grid', desc: 'Conmuta entre tarjetas ejecutivas y tabla compacta de proyectos' },
  { id: 'portafolio_abrir_360', scope: 'portafolio', defaultKey: 'o', label: 'Abrir Vista 360°', iconName: 'target', desc: 'Abre la vista ejecutiva 360° del proyecto en foco' },
  { id: 'portafolio_colapsar_hitos', scope: 'portafolio', defaultKey: 'e', label: 'Expandir / Colapsar Hitos', iconName: 'folder', desc: 'En la Vista 360°, expande o contrae los acordeones de hitos' },
  { id: 'portafolio_buscar', scope: 'portafolio', defaultKey: 'f', label: 'Buscar proyecto', iconName: 'search', desc: 'Pone el foco en la barra de búsqueda de proyectos' },

  // HÁBITOS
  { id: 'habitos_nueva_actividad', scope: 'habitos', defaultKey: 'n', label: '+ Nueva Actividad / Hábito', iconName: 'sprout', desc: 'Abre modal para registrar un nuevo hábito o meta personal' },
  { id: 'habitos_desglose', scope: 'habitos', defaultKey: 'd', label: 'Desglose Inversión Bienestar', iconName: 'heartPulse', desc: 'Abre el desglose modal de inversión financiera en bienestar' },
  { id: 'habitos_alternar_frecuencia', scope: 'habitos', defaultKey: 'f', label: 'Ciclar Filtro de Frecuencia', iconName: 'refresh', desc: 'Alterna cíclicamente: Todos → Recurrentes → Metas → En Racha' },
  { id: 'habitos_marcar_racha', scope: 'habitos', defaultKey: 'r', label: 'Filtrar Solo En Racha', iconName: 'flame', desc: 'Alterna el filtro para ver hábitos con racha activa' },
  { id: 'habitos_buscar', scope: 'habitos', defaultKey: 'b', label: 'Buscar hábito / actividad', iconName: 'search', desc: 'Pone el foco en el buscador del módulo de hábitos' },

  // FINANZAS
  { id: 'finanzas_nuevo_gasto', scope: 'finanzas', defaultKey: 'g', label: '+ Registrar Nuevo Gasto', iconName: 'creditCard', desc: 'Abre modal para registrar un gasto o compra con comprobante' },
  { id: 'finanzas_nuevo_ingreso', scope: 'finanzas', defaultKey: 'i', label: '+ Registrar Nuevo Ingreso', iconName: 'dollar', desc: 'Abre modal para registrar un nuevo cobro o ingreso' },
  { id: 'finanzas_seg_todos', scope: 'finanzas', defaultKey: 'a', label: 'Segmentación: Todos', iconName: 'layers', desc: 'Muestra flujo y transacciones completas (Proyectos + Personal)' },
  { id: 'finanzas_seg_proy', scope: 'finanzas', defaultKey: 'p', label: 'Segmentación: Solo Proyectos', iconName: 'portafolio', desc: 'Filtra transacciones asociadas a proyectos de inversión' },
  { id: 'finanzas_seg_pers', scope: 'finanzas', defaultKey: 'u', label: 'Segmentación: Solo Personal', iconName: 'user', desc: 'Filtra transacciones y presupuesto de vida personal y hábitos' },
  { id: 'finanzas_alternar_tab', scope: 'finanzas', defaultKey: 't', label: 'Ciclar Pestañas de Finanzas', iconName: 'fileText', desc: 'Cicla entre General, Transacciones, Cuotas y Presupuesto' },
  { id: 'finanzas_alternar_periodo', scope: 'finanzas', defaultKey: 'm', label: 'Ciclar Periodo (Mes/Todo)', iconName: 'calendar', desc: 'Alterna entre Mes Actual, Mes Anterior y Todos los periodos' },
  { id: 'finanzas_buscar', scope: 'finanzas', defaultKey: 'f', label: 'Buscar en Finanzas', iconName: 'search', desc: 'Pone el foco en el buscador de transacciones financieras' },

  // NOTAS
  { id: 'notas_nueva_nota', scope: 'notas', defaultKey: 'n', label: '+ Nueva Nota Rápida', iconName: 'notas', desc: 'Abre el modal de creación de nota o checklist interactiva' },
  { id: 'notas_alternar_modo', scope: 'notas', defaultKey: 'v', label: 'Alternar Mosaico / Lista', iconName: 'grid', desc: 'Conmuta entre visualización de mosaico Masonry y lista vertical' },
  { id: 'notas_filtro_fijadas', scope: 'notas', defaultKey: 'f', label: 'Alternar Filtro Fijadas', iconName: 'pin', desc: 'Muestra u oculta exclusivamente las notas fijadas en tablero' },
  { id: 'notas_filtro_checklists', scope: 'notas', defaultKey: 'k', label: 'Alternar Filtro Checklists', iconName: 'checkSquare', desc: 'Filtra notas que contienen listas de verificación' },
  { id: 'notas_buscar', scope: 'notas', defaultKey: 'b', label: 'Buscar en Notas', iconName: 'search', desc: 'Pone el foco en el buscador de notas inteligentes' }
];

interface ModalAtajosTecladoProps {
  isOpen: boolean;
  onClose: () => void;
  scopeInicial?: ScopeAtajo;
}

const renderShortcutSvgIcon = (iconName: string) => {
  switch (iconName) {
    case 'kanban': return <Columns className="w-4 h-4 text-indigo-400 shrink-0" />;
    case 'portafolio': return <Briefcase className="w-4 h-4 text-rose-400 shrink-0" />;
    case 'habitos':
    case 'heartPulse': return <HeartPulse className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'finanzas': return <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'notas':
    case 'fileText': return <FileText className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'calendar': return <Calendar className="w-4 h-4 text-sky-400 shrink-0" />;
    case 'limpiar':
    case 'sparkles': return <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />;
    case 'atajos': return <Keyboard className="w-4 h-4 text-indigo-400 shrink-0" />;
    case 'plus': return <Plus className="w-4 h-4 text-indigo-400 shrink-0" />;
    case 'users': return <Users className="w-4 h-4 text-slate-400 shrink-0" />;
    case 'user': return <User className="w-4 h-4 text-slate-400 shrink-0" />;
    case 'zap': return <Zap className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'clock': return <Clock className="w-4 h-4 text-sky-400 shrink-0" />;
    case 'alert': return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
    case 'search': return <Search className="w-4 h-4 text-slate-400 shrink-0" />;
    case 'folder': return <FolderTree className="w-4 h-4 text-rose-400 shrink-0" />;
    case 'target': return <Crosshair className="w-4 h-4 text-indigo-400 shrink-0" />;
    case 'refresh': return <RotateCcw className="w-4 h-4 text-sky-400 shrink-0" />;
    case 'sprout': return <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'flame': return <Flame className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'creditCard': return <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'dollar': return <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'layers': return <Layers className="w-4 h-4 text-indigo-400 shrink-0" />;
    case 'grid': return <LayoutGrid className="w-4 h-4 text-slate-400 shrink-0" />;
    case 'pin': return <Pin className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'checkSquare': return <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />;
    default: return <Keyboard className="w-4 h-4 text-slate-400 shrink-0" />;
  }
};

export const ModalAtajosTeclado: React.FC<ModalAtajosTecladoProps> = ({
  isOpen,
  onClose,
  scopeInicial = 'global'
}) => {
  const [tabActiva, setTabActiva] = useState<ScopeAtajo>(scopeInicial);
  const [grabandoAccionId, setGrabandoAccionId] = useState<string | null>(null);
  const [mappingAtajos, setMappingAtajos] = useState<{ [id: string]: string }>({});
  const [atajosActivos, setAtajosActivos] = useState<boolean>(true);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cargar personalizaciones desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('pmo_custom_shortcuts');
        if (stored) {
          setMappingAtajos(JSON.parse(stored));
        }
        const masterToggle = localStorage.getItem('pmo_shortcuts_enabled');
        if (masterToggle !== null) {
          setAtajosActivos(masterToggle === 'true');
        }
      } catch (err) {
        console.warn('Error al leer atajos de localStorage:', err);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (scopeInicial) {
      setTabActiva(scopeInicial);
    }
  }, [scopeInicial]);

  // Listener para captura de tecla durante grabación
  useEffect(() => {
    if (!grabandoAccionId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setGrabandoAccionId(null);
        return;
      }

      const keyCapturada = e.key.toLowerCase();
      const nuevoMapping = {
        ...mappingAtajos,
        [grabandoAccionId]: keyCapturada
      };
      setMappingAtajos(nuevoMapping);
      localStorage.setItem('pmo_custom_shortcuts', JSON.stringify(nuevoMapping));
      setGrabandoAccionId(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [grabandoAccionId, mappingAtajos]);

  if (!isOpen) return null;

  const handleToggleMaster = (activo: boolean) => {
    setAtajosActivos(activo);
    localStorage.setItem('pmo_shortcuts_enabled', String(activo));
  };

  const restablecerTabActual = () => {
    const nuevoMapping = { ...mappingAtajos };
    CANONICAL_SHORTCUTS.filter((s) => s.scope === tabActiva).forEach((s) => {
      delete nuevoMapping[s.id];
    });
    setMappingAtajos(nuevoMapping);
    localStorage.setItem('pmo_custom_shortcuts', JSON.stringify(nuevoMapping));
  };

  const restablecerTodo = () => {
    setMappingAtajos({});
    localStorage.removeItem('pmo_custom_shortcuts');
  };

  const formatKey = (k: string) => {
    if (k === ' ') return 'Espacio';
    if (k === 'Escape') return 'Esc';
    if (k === 'ArrowUp') return '↑';
    if (k === 'ArrowDown') return '↓';
    if (k === 'ArrowLeft') return '←';
    if (k === 'ArrowRight') return '→';
    return k.toUpperCase();
  };

  const atajosFiltrados = CANONICAL_SHORTCUTS.filter((s) => s.scope === tabActiva);

  const modalContent = (
    <div
      id="modal-atajos-teclado"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[10000] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200"
    >
      <div
        id="modal-atajos-teclado-card"
        className="portal-surface elevation-3 w-full max-w-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800/60 shadow-2xl relative bg-white dark:bg-[#0D1526]"
      >
        {/* DRAG HANDLE MÓVIL (BOTTOM SHEET) */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

        {/* Header Modal */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <span>Atajos de Teclado</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  Configurables
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Navega y filtra velozmente. Haz clic en cualquier tecla para reasignarla.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Activar/Desactivar atajos */}
            <label
              className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300 select-none"
              title="Activar o desactivar escucha global de atajos"
            >
              <input
                type="checkbox"
                id="chk-shortcuts-toggle"
                checked={atajosActivos}
                onChange={(e) => handleToggleMaster(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span className="text-[11px] font-semibold">Atajos activos</span>
            </label>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* NÚCLEO ESENCIAL DE 4 ATAJOS GLOBALES (ESC, C, X, ENTER) */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                Núcleo Esencial Transversal (4 Atajos Globales)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-indigo-300/80">Inmutables · Siempre Activos</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-indigo-800/40 flex items-center justify-between">
              <span className="text-slate-300 font-medium">Cerrar / Cancelar</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono font-bold text-[10px] border border-slate-700">Esc</kbd>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-indigo-800/40 flex items-center justify-between">
              <span className="text-slate-300 font-medium">Google Calendar</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono font-bold text-[10px] border border-slate-700">C</kbd>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-indigo-800/40 flex items-center justify-between">
              <span className="text-slate-300 font-medium">Limpiar Filtros</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono font-bold text-[10px] border border-slate-700">X</kbd>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-indigo-800/40 flex items-center justify-between">
              <span className="text-slate-300 font-medium">Confirmar Acción</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono font-bold text-[10px] border border-slate-700">Enter</kbd>
            </div>
          </div>
        </div>

        {/* Pestañas de Secciones */}
        <div className="flex items-center gap-1.5 px-5 sm:px-6 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 shrink-0 overflow-x-auto">
          {[
            { id: 'global', label: 'Globales', icon: <GlobeIcon /> },
            { id: 'kanban', label: 'Tablero', icon: <Columns className="w-3.5 h-3.5" /> },
            { id: 'portafolio', label: 'Portafolio', icon: <Briefcase className="w-3.5 h-3.5" /> },
            { id: 'habitos', label: 'Hábitos', icon: <HeartPulse className="w-3.5 h-3.5" /> },
            { id: 'finanzas', label: 'Finanzas', icon: <Wallet className="w-3.5 h-3.5" /> },
            { id: 'notas', label: 'Notas', icon: <FileText className="w-3.5 h-3.5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setTabActiva(tab.id as ScopeAtajo);
                setGrabandoAccionId(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                tabActiva === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Banner de Grabación Activa */}
        {grabandoAccionId && (
          <div
            id="banner-grabando-atajo"
            className="px-5 py-2.5 bg-amber-500 text-slate-950 font-medium text-xs flex items-center justify-between shrink-0 shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span>
                Presiona cualquier tecla para reasignar a{' '}
                <b id="lbl-grabando-accion" className="underline underline-offset-2">
                  {CANONICAL_SHORTCUTS.find((s) => s.id === grabandoAccionId)?.label || 'Acción'}
                </b>
                ...
              </span>
            </div>
            <button
              type="button"
              onClick={() => setGrabandoAccionId(null)}
              className="text-white/90 hover:text-white font-bold text-[11px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Cuerpo del Modal: Lista de Atajos Interactiva */}
        <div
          id="contenedor-lista-atajos"
          className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-3 custom-scrollbar text-xs bg-slate-50/50 dark:bg-slate-950/40"
        >
          {atajosFiltrados.map((item) => {
            const keyActual = mappingAtajos[item.id] || item.defaultKey;
            const esGrabando = grabandoAccionId === item.id;

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs hover:border-indigo-400/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {renderShortcutSvgIcon(item.iconName)}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">{item.label}</h5>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setGrabandoAccionId(item.id)}
                    className={`px-3 py-1 rounded-lg border font-mono font-black text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      esGrabando
                        ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40'
                    }`}
                    title="Haz clic para reasignar esta tecla"
                  >
                    <span>{esGrabando ? 'Presiona tecla...' : formatKey(keyActual)}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Modal con Restablecer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restablecerTabActual}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition flex items-center gap-1 cursor-pointer"
              title="Restablecer atajos de esta pestaña al valor de fábrica"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer sección</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              type="button"
              onClick={restablecerTodo}
              className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition flex items-center gap-1 cursor-pointer"
              title="Restablecer todos los atajos de todas las secciones"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer todo</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold shadow-xs transition text-xs cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

function GlobeIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
