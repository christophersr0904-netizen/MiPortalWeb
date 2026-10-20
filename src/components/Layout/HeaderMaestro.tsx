import React, { useState } from 'react';
import {
  Calendar,
  Archive,
  RotateCw,
  Sun,
  Moon,
  Columns,
  FolderKanban,
  HeartPulse,
  Wallet,
  FileText,
  Search,
  X,
  RotateCcw,
  Keyboard,
  Sparkles,
  Zap,
  Palette,
  Globe,
  Briefcase,
  Lightbulb
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { esElementoArchivado } from '../../utils/entityNormalizer';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export type VistaGlobal = 'kanban' | 'portafolio' | 'habitos' | 'financiero' | 'detalle' | 'notas';
export type SaborTema = 'slate' | 'rose';
export type ModoColor = 'light' | 'dark';

interface HeaderMaestroProps {
  vistaActiva: VistaGlobal;
  onCambiarVista: (vista: VistaGlobal) => void;
  onAbrirAsistenteIA?: () => void;
  onAbrirAtajos?: () => void;
  onAbrirExportarPdf?: () => void;
  drawerArchivadosAbierto?: boolean;
  onToggleDrawerArchivados?: (abierto: boolean) => void;
  modoColor: ModoColor;
  saborTema: SaborTema;
  onCambiarModoColor: (modo: ModoColor) => void;
  onCambiarSaborTema: (sabor: SaborTema) => void;
  sincronizando?: boolean;
}

export const HeaderMaestro: React.FC<HeaderMaestroProps> = ({
  vistaActiva,
  onCambiarVista,
  onAbrirAsistenteIA: _onAbrirAsistenteIA,
  onAbrirAtajos,
  onAbrirExportarPdf,
  drawerArchivadosAbierto: propDrawerAbierto,
  onToggleDrawerArchivados,
  modoColor,
  saborTema,
  onCambiarModoColor,
  onCambiarSaborTema,
  sincronizando = false
}) => {
  const [menuTemaAbierto, setMenuTemaAbierto] = useState(false);
  const [localDrawerOpen, setLocalDrawerOpen] = useState(false);
  const isDrawerOpen = propDrawerAbierto !== undefined ? propDrawerAbierto : localDrawerOpen;
  const setDrawerAbierto = onToggleDrawerArchivados || setLocalDrawerOpen;

  useBodyScrollLock(isDrawerOpen);

  const [tabArchivados, setTabArchivados] = useState<'todos' | 'kanban' | 'portafolio' | 'habitos' | 'finanzas'>('todos');
  const [busquedaArchivados, setBusquedaArchivados] = useState('');
  const [recargandoAnim, setRecargandoAnim] = useState(false);

  // Queries reactivas para badges superiores
  const totalKanban = useLiveQuery(
    () => db.tareas.filter((t) => t.estado_tarea !== '04_Completado' && t.estado_tarea !== '05_Archivado').count(),
    []
  ) ?? 0;

  const totalPortafolio = useLiveQuery(
    () => db.proyectos.filter((p) => p.estado_proyecto !== '04_Cerrado' && p.estado_proyecto !== '05_Archivado').count(),
    []
  ) ?? 0;

  const totalNotas = useLiveQuery(() => db.notas.count(), []) ?? 0;

  // Queries reactivas para la Bóveda de Archivados aplicando regla canónica (+10 días)
  const tareasArchivadas = useLiveQuery(
    () => db.tareas.filter((t) => esElementoArchivado(t, 'tareas')).toArray(),
    []
  ) ?? [];

  const proyectosArchivados = useLiveQuery(
    () => db.proyectos.filter((p) => esElementoArchivado(p, 'proyectos')).toArray(),
    []
  ) ?? [];

  const actividadesArchivadas = useLiveQuery(
    () => db.actividades_personales.filter((a) => esElementoArchivado(a, 'actividades')).toArray(),
    []
  ) ?? [];

  const gastosArchivados = useLiveQuery(
    () => db.gastos.filter((g) => esElementoArchivado(g, 'gastos')).toArray(),
    []
  ) ?? [];

  const ingresosArchivados = useLiveQuery(
    () => db.ingresos.filter((i) => esElementoArchivado(i, 'ingresos')).toArray(),
    []
  ) ?? [];

  const totalArchivados =
    tareasArchivadas.length +
    proyectosArchivados.length +
    actividadesArchivadas.length +
    gastosArchivados.length +
    ingresosArchivados.length;

  const handleRecarga = () => {
    setRecargandoAnim(true);
    setTimeout(() => {
      setRecargandoAnim(false);
    }, 800);
  };

  // Filtrado de elementos en la Bóveda de Archivados según pestaña y término de búsqueda
  const archivadosFiltrados = React.useMemo(() => {
    const list: Array<{ id: string; titulo: string; tipo: string; subtitulo: string; fecha?: string }> = [];

    if (tabArchivados === 'todos' || tabArchivados === 'kanban') {
      tareasArchivadas.forEach((t) => {
        list.push({
          id: t.id,
          titulo: t.nombre_tarea_actividad,
          tipo: 'Tarea Kanban',
          subtitulo: `${t.codigo_legado} · ${t.proyecto_codigo || 'General'}`,
          fecha: t.fecha_programada
        });
      });
    }

    if (tabArchivados === 'todos' || tabArchivados === 'portafolio') {
      proyectosArchivados.forEach((p) => {
        list.push({
          id: p.id,
          titulo: p.nombre_proyecto,
          tipo: 'Proyecto',
          subtitulo: `${p.codigo_legado} · ${p.tipo_iniciativa}`,
          fecha: p.fecha_fin_plan
        });
      });
    }

    if (tabArchivados === 'todos' || tabArchivados === 'habitos') {
      actividadesArchivadas.forEach((a) => {
        list.push({
          id: a.id,
          titulo: a.nombre_actividad,
          tipo: 'Hábito',
          subtitulo: `${a.codigo_legado} · ${a.categoria_vida}`,
          fecha: a.fecha_programada
        });
      });
    }

    if (tabArchivados === 'todos' || tabArchivados === 'finanzas') {
      gastosArchivados.forEach((g) => {
        list.push({
          id: g.id,
          titulo: g.descripcion_gasto || 'Gasto conciliado',
          tipo: 'Gasto',
          subtitulo: `${g.codigo_legado} · ${g.moneda_original || 'PEN'} ${(g.monto_original || g.monto_pen || 0).toFixed(2)}`,
          fecha: g.fecha_gasto
        });
      });
      ingresosArchivados.forEach((ing) => {
        list.push({
          id: ing.id,
          titulo: ing.descripcion_ingreso || 'Ingreso conciliado',
          tipo: 'Ingreso',
          subtitulo: `${ing.codigo_legado} · ${ing.moneda_original || 'PEN'} ${(ing.monto_original || ing.monto_pen || 0).toFixed(2)}`,
          fecha: ing.fecha_ingreso
        });
      });
    }

    if (!busquedaArchivados.trim()) return list;

    const term = busquedaArchivados.toLowerCase();
    return list.filter(
      (item) =>
        item.titulo.toLowerCase().includes(term) ||
        item.subtitulo.toLowerCase().includes(term) ||
        item.tipo.toLowerCase().includes(term)
    );
  }, [tabArchivados, busquedaArchivados, tareasArchivadas, proyectosArchivados, actividadesArchivadas, gastosArchivados, ingresosArchivados]);

  const tituloMovil = {
    kanban: 'Tablero Kanban',
    portafolio: 'Portafolio Ejecutivo',
    habitos: 'Hábitos & Vida',
    financiero: 'Finanzas & Liquidez',
    detalle: 'Detalle 360°',
    notas: 'Notas Inteligentes'
  }[vistaActiva];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0D1526]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/40 transition-colors duration-200 shadow-xs flex items-center justify-between px-3 md:px-6 py-1.5 md:py-2.5 h-11 md:h-auto shrink-0 gap-3 relative">
        {/* FLANCO IZQUIERDO: Branding & Sync Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center font-black text-xs md:text-sm text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
              <span>P</span>
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase leading-none">
                PMO Modular
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 leading-tight">
                Executive Suite
              </span>
            </div>
            {/* Título compacto de la vista activa para móviles (< md) */}
            <span id="mobile-header-view-title" className="md:hidden text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[170px]">
              {tituloMovil}
            </span>
          </div>

          {/* Indicador reactivo de sincronización (Desktop) */}
          <div
            id="sync-status-container"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-default bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 shadow-2xs"
            title={sincronizando ? 'Sincronizando cambios locales...' : 'Última sincronización: Al día'}
          >
            <span id="sync-status-led" className="relative flex h-2 w-2">
              {sincronizando ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              )}
            </span>
            <span id="sync-status-text" className="text-[11px] font-medium hidden md:inline">
              {sincronizando ? 'Sincronizando' : 'Al día'}
            </span>
          </div>
        </div>

        {/* CENTRO: Pestañas Principales Centradas Matemáticamente */}
        <nav className="hidden md:inline-flex items-center p-1.5 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-inner gap-1 text-xs select-none absolute left-1/2 -translate-x-1/2">
          {/* 1. Kanban */}
          <button
            type="button"
            onClick={() => onCambiarVista('kanban')}
            id="tab-nav-kanban"
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 ease-out flex items-center gap-2 cursor-pointer ${
              vistaActiva === 'kanban'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs dark:shadow-md dark:shadow-slate-950/40 border border-slate-200/90 dark:border-slate-700/80 ring-1 ring-black/5 dark:ring-white/10 active:scale-95'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 border border-transparent'
            }`}
            title="Tablero Kanban de Tareas (Presiona 1)"
          >
            <Columns className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Tablero</span>
            {totalKanban > 0 && (
              <span
                id="badge-header-kanban"
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 min-w-[18px] h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60 shadow-2xs leading-none flex items-center justify-center"
              >
                {totalKanban}
              </span>
            )}
          </button>

          {/* 2. Portafolio */}
          <button
            type="button"
            onClick={() => onCambiarVista('portafolio')}
            id="tab-nav-portafolio"
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 ease-out flex items-center gap-2 cursor-pointer ${
              vistaActiva === 'portafolio' || vistaActiva === 'detalle'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs dark:shadow-md dark:shadow-slate-950/40 border border-slate-200/90 dark:border-slate-700/80 ring-1 ring-black/5 dark:ring-white/10 active:scale-95'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 border border-transparent'
            }`}
            title="Portafolio de Proyectos (Presiona 2)"
          >
            <FolderKanban className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Portafolio</span>
            {totalPortafolio > 0 && (
              <span
                id="badge-header-portafolio"
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 min-w-[18px] h-4 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 shadow-2xs leading-none flex items-center justify-center"
              >
                {totalPortafolio}
              </span>
            )}
          </button>

          {/* 3. Hábitos */}
          <button
            type="button"
            onClick={() => onCambiarVista('habitos')}
            id="tab-nav-habitos"
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 ease-out flex items-center gap-2 cursor-pointer ${
              vistaActiva === 'habitos'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs dark:shadow-md dark:shadow-slate-950/40 border border-slate-200/90 dark:border-slate-700/80 ring-1 ring-black/5 dark:ring-white/10 active:scale-95'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 border border-transparent'
            }`}
            title="Hábitos y Gestión de Vida (Presiona 3)"
          >
            <HeartPulse className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Hábitos</span>
          </button>

          {/* 4. Finanzas */}
          <button
            type="button"
            onClick={() => onCambiarVista('financiero')}
            id="tab-nav-financiero"
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 ease-out flex items-center gap-2 cursor-pointer ${
              vistaActiva === 'financiero'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs dark:shadow-md dark:shadow-slate-950/40 border border-slate-200/90 dark:border-slate-700/80 ring-1 ring-black/5 dark:ring-white/10 active:scale-95'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 border border-transparent'
            }`}
            title="Flujo de Caja y Finanzas (Presiona 4)"
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Finanzas</span>
          </button>
        </nav>

        {/* FLANCO DERECHO: Acceso a Notas, Calendar, Archivados y Dock de Utilidades */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 1. Botón de Notas (#btn-nav-notas): Protagonista con fondo ámbar */}
          <div className="hidden md:inline-flex">
            <button
              type="button"
              id="btn-nav-notas"
              onClick={() => onCambiarVista('notas')}
              className={`relative items-center justify-center w-11 h-9 rounded-2xl border active:scale-95 transition-all duration-200 cursor-pointer select-none shadow-xs flex ${
                vistaActiva === 'notas'
                  ? 'bg-amber-500/25 border-amber-400/90 text-amber-300 ring-2 ring-amber-500/30'
                  : 'bg-amber-500/[0.12] border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-400/70 text-amber-400'
              }`}
              title="Notas Inteligentes (Presiona 5)"
            >
              <FileText className="w-4 h-4" />
              {totalNotas > 0 && (
                <span
                  id="badge-header-notas"
                  className="absolute -top-1 -right-1 text-[9px] font-mono tabular-nums font-bold px-1 min-w-[15px] h-3.5 rounded-full bg-amber-500 text-slate-950 border border-amber-300 leading-none flex items-center justify-center shadow-xs"
                >
                  {totalNotas}
                </span>
              )}
            </button>
          </div>

          {/* 2. Botón Calendar */}
          <a
            href="https://calendar.google.com/calendar/r"
            target="_blank"
            rel="noopener noreferrer"
            id="btn-header-calendar"
            className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/30 active:scale-95 transition-all duration-200 cursor-pointer hidden md:flex items-center justify-center select-none"
            title="Abrir Google Calendar (Presiona C)"
          >
            <Calendar className="w-4 h-4" />
          </a>

          {/* 3. Botón de Archivados (#btn-header-archivados) */}
          <button
            type="button"
            id="btn-header-archivados"
            data-legacy-id="btn-header-boveda-archivados"
            onClick={() => setDrawerAbierto(true)}
            className="relative h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/30 active:scale-95 transition-all duration-200 cursor-pointer hidden md:flex items-center justify-center select-none"
            title="Bóveda de Archivados (+10 días completados/conciliados)"
          >
            <Archive className="w-4 h-4" />
            {totalArchivados > 0 && (
              <span
                id="badge-header-archivados"
                className="absolute -top-1 -right-1 text-[9px] font-mono font-bold px-1 min-w-[15px] h-3.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 leading-none flex items-center justify-center shadow-xs"
              >
                {totalArchivados}
              </span>
            )}
          </button>

          {/* 4. Recargar (#btn-refresh-global) */}
          <button
            type="button"
            id="btn-refresh-global"
            data-legacy-id="btn-header-refresh"
            onClick={handleRecarga}
            className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/30 active:scale-95 transition-all duration-200 cursor-pointer hidden md:flex items-center justify-center"
            title="Sincronizar datos y refrescar estados (Presiona R)"
          >
            <RotateCw className={`w-4 h-4 transition-transform duration-500 ${recargandoAnim ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* 5. Atajos (#btn-toggle-shortcuts-modal): Canónico según legacy L151-166 */}
          <button
            type="button"
            id="btn-toggle-shortcuts-modal"
            data-legacy-id="btn-shortcuts-config"
            onClick={onAbrirAtajos}
            className="h-9 w-9 p-0 rounded-xl bg-transparent border border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/30 active:scale-95 transition-all duration-200 cursor-pointer hidden md:flex items-center justify-center select-none"
            title="Atajos de Teclado (Presiona ?)"
          >
            <Keyboard className="w-4 h-4 transition-transform duration-200" />
          </button>

          {/* 6. Exportar Ficha PDF (Opcional / Directo) */}
          {onAbrirExportarPdf && (
            <button
              type="button"
              id="btn-header-exportar-pdf"
              onClick={onAbrirExportarPdf}
              className="h-9 w-9 p-0 rounded-xl bg-transparent border border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/30 active:scale-95 transition-all duration-200 cursor-pointer hidden md:flex items-center justify-center select-none"
              title="Generar Ficha Resumen (PDF)"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}


          {/* 8. Selector de Tema / Paleta */}
          <div className="relative" id="container-theme-dropdown">
            <button
              type="button"
              id="btn-theme-dropdown"
              onClick={() => setMenuTemaAbierto(!menuTemaAbierto)}
              className="h-8 w-8 md:h-9 md:w-9 p-0 rounded-xl bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/30 flex items-center justify-center active:scale-95 transition-all duration-200 cursor-pointer"
              title="Tema e Iluminación (Sol / Luna y Paletas)"
            >
              {modoColor === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* Dropdown Flotante Glassmorphism */}
            {menuTemaAbierto && (
              <div
                id="menu-theme-dropdown"
                className="absolute right-0 mt-2 w-60 rounded-2xl bg-white/95 dark:bg-[#0D1526]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/60 shadow-2xl p-3 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Apariencia
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onCambiarModoColor(modoColor === 'dark' ? 'light' : 'dark');
                    }}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Alternar Modo
                  </button>
                </div>

                {/* Iluminación */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                    Iluminación
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onCambiarModoColor('light')}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                        modoColor === 'light'
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Claro</span>
                        <span className="text-[9px] text-slate-400">Light</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onCambiarModoColor('dark')}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                        modoColor === 'dark'
                          ? 'border-indigo-400 bg-indigo-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400/50'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Oscuro</span>
                        <span className="text-[9px] text-slate-400">OLED</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Paleta de Color */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                    Paleta de Color
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onCambiarSaborTema('slate')}
                      className={`flex flex-col items-start p-2 rounded-xl border transition-all text-left cursor-pointer ${
                        saborTema === 'slate'
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-sky-400" />
                          <span>Slate</span>
                        </span>
                        {saborTema === 'slate' && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                      </div>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">Metálico</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onCambiarSaborTema('rose')}
                      className={`flex flex-col items-start p-2 rounded-xl border transition-all text-left cursor-pointer ${
                        saborTema === 'rose'
                          ? 'border-rose-500 bg-rose-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-rose-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                          <Palette className="w-3.5 h-3.5 text-rose-400" />
                          <span>Rose</span>
                        </span>
                        {saborTema === 'rose' && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                      </div>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">Champagne</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* DRAWER LATERAL: BÓVEDA DE ARCHIVADOS (+10 DÍAS) */}
      {isDrawerOpen && (
        <div
          id="drawer-archivados-overlay"
          onClick={() => setDrawerAbierto(false)}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[10000] transition-opacity duration-300"
        />
      )}

      <aside
        id="drawer-archivados"
        className={`fixed inset-y-0 right-0 z-[10005] w-full sm:w-[500px] lg:w-[580px] bg-white/95 dark:bg-[#0D1526]/95 backdrop-blur-2xl shadow-2xl border-l border-slate-200/90 dark:border-slate-800/40 transition-transform duration-300 ease-out flex flex-col min-h-0 select-none ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Encabezado del Drawer */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between shrink-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-lg shadow-md shadow-amber-500/20 ring-1 ring-white/20">
              <Archive className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Bóveda de Archivados
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                  +10 días
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Elementos finalizados o conciliados retirados del canvas activo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDrawerAbierto(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95 cursor-pointer"
            title="Cerrar Bóveda (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buscador & 5 Pestañas de Filtro (Todos, Kanban, Portafolio, Hábitos, Finanzas) */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/60 space-y-3 shrink-0 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 w-4 h-4 top-2.5" />
            <input
              type="text"
              id="input-busqueda-drawer-archivados"
              value={busquedaArchivados}
              onChange={(e) => setBusquedaArchivados(e.target.value)}
              placeholder="Buscar por título, ID, proyecto o categoría..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100 shadow-2xs placeholder:text-slate-400"
            />
            {busquedaArchivados && (
              <button
                type="button"
                id="btn-clear-busqueda-drawer"
                onClick={() => setBusquedaArchivados('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
            <button
              type="button"
              id="tab-drawer-todos"
              onClick={() => setTabArchivados('todos')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                tabArchivados === 'todos'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Todos</span>
              <span id="count-tab-arch-todos" className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono tabular-nums font-black">
                {totalArchivados}
              </span>
            </button>
            <button
              type="button"
              id="tab-drawer-kanban"
              onClick={() => setTabArchivados('kanban')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                tabArchivados === 'kanban'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban</span>
              <span id="count-tab-arch-kanban" className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 font-mono tabular-nums font-bold">
                {tareasArchivadas.length}
              </span>
            </button>
            <button
              type="button"
              id="tab-drawer-portafolio"
              onClick={() => setTabArchivados('portafolio')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                tabArchivados === 'portafolio'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Portafolio</span>
              <span id="count-tab-arch-portafolio" className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 font-mono tabular-nums font-bold">
                {proyectosArchivados.length}
              </span>
            </button>
            <button
              type="button"
              id="tab-drawer-habitos"
              onClick={() => setTabArchivados('habitos')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                tabArchivados === 'habitos'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Hábitos</span>
              <span id="count-tab-arch-habitos" className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 font-mono tabular-nums font-bold">
                {actividadesArchivadas.length}
              </span>
            </button>
            {/* 5ta Pestaña: Finanzas (Canónica L352-358) */}
            <button
              type="button"
              id="tab-drawer-finanzas"
              onClick={() => setTabArchivados('finanzas')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                tabArchivados === 'finanzas'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Finanzas</span>
              <span id="count-tab-arch-finanzas" className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 font-mono tabular-nums font-bold">
                {gastosArchivados.length + ingresosArchivados.length}
              </span>
            </button>
          </div>
        </div>

        {/* Listado de Bento Cards de Archivados */}
        <div
          id="lista-elementos-drawer-archivados"
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar min-h-0 bg-slate-100/50 dark:bg-slate-950/50"
        >
          {archivadosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-400 italic">
              No hay elementos archivados en este filtro (+10 días).
            </div>
          ) : (
            archivadosFiltrados.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white dark:bg-[#0D1526] border border-slate-200 dark:border-slate-800/60 flex items-center justify-between gap-3 shadow-xs hover:border-amber-400/50 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {item.tipo}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate font-mono tabular-nums">{item.subtitulo}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.titulo}</h4>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ahoraIso = new Date().toISOString();
                    // Restauración canónica según tipo
                    if (item.tipo === 'Tarea Kanban') {
                      await db.tareas.update(item.id, { estado_tarea: '01_Backlog', updated_at: ahoraIso });
                    } else if (item.tipo === 'Proyecto') {
                      await db.proyectos.update(item.id, { estado_proyecto: '03_En_Ejecucion', updated_at: ahoraIso });
                    } else if (item.tipo === 'Hábito') {
                      await db.actividades_personales.update(item.id, { estado: '02_Por_Hacer', updated_at: ahoraIso });
                    } else if (item.tipo === 'Gasto') {
                      await db.gastos.update(item.id, { estado_pago: 'PENDIENTE', updated_at: ahoraIso });
                    } else if (item.tipo === 'Ingreso') {
                      await db.ingresos.update(item.id, { estado_cobro: 'PENDIENTE', updated_at: ahoraIso });
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 flex items-center gap-1 shrink-0 transition-all active:scale-95 cursor-pointer"
                  title="Restaurar elemento en caliente"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-5 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0D1526]/80 backdrop-blur-md flex items-center justify-between shrink-0 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px]">Pulsa <b>'Restaurar'</b> para devolver un elemento al canvas activo.</span>
          </div>
          <span id="lbl-total-archivados-footer" className="font-mono tabular-nums text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {archivadosFiltrados.length} archivados
          </span>
        </div>
      </aside>
    </>
  );
};
