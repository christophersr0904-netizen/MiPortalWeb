import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Archive,
  RotateCw,
  Columns,
  FolderKanban,
  HeartPulse,
  Wallet,
  FileText,
  Search,
  X,
  RotateCcw,
  Keyboard,
  Globe,
  Briefcase,
  Lightbulb
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { esElementoArchivado } from '../../utils/entityNormalizer';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { syncManager, type SyncState } from '../../services/syncManager';

export type VistaGlobal = 'kanban' | 'portafolio' | 'habitos' | 'financiero' | 'detalle' | 'notas';

interface HeaderMaestroProps {
  vistaActiva: VistaGlobal;
  onCambiarVista: (vista: VistaGlobal) => void;
  onAbrirAsistenteIA?: () => void;
  onAbrirAtajos?: () => void;
  onAbrirExportarPdf?: () => void;
  drawerArchivadosAbierto?: boolean;
  onToggleDrawerArchivados?: (abierto: boolean) => void;
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
  sincronizando = false
}) => {
  const [localDrawerOpen, setLocalDrawerOpen] = useState(false);
  const isDrawerOpen = propDrawerAbierto !== undefined ? propDrawerAbierto : localDrawerOpen;
  const setDrawerAbierto = onToggleDrawerArchivados || setLocalDrawerOpen;

  useBodyScrollLock(isDrawerOpen);

  const [tabArchivados, setTabArchivados] = useState<'todos' | 'kanban' | 'portafolio' | 'habitos' | 'finanzas'>('todos');
  const [busquedaArchivados, setBusquedaArchivados] = useState('');
  const [recargandoAnim, setRecargandoAnim] = useState(false);
  const [syncManagerEstado, setSyncManagerEstado] = useState<SyncState>(() => syncManager.getStatus());

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((nuevoEstado) => {
      setSyncManagerEstado(nuevoEstado);
    });
    return unsubscribe;
  }, []);

  const handleEjecutarSync = async () => {
    setRecargandoAnim(true);
    try {
      await syncManager.sincronizarTodo();
    } catch (err) {
      console.warn('[HeaderMaestro] Error en sincronización manual:', err);
    } finally {
      setTimeout(() => {
        setRecargandoAnim(false);
      }, 750);
    }
  };

  useEffect(() => {
    const handleSyncEvent = () => {
      setRecargandoAnim(true);
      setTimeout(() => {
        setRecargandoAnim(false);
      }, 750);
    };
    window.addEventListener('pmo:sync-triggered', handleSyncEvent);
    return () => {
      window.removeEventListener('pmo:sync-triggered', handleSyncEvent);
    };
  }, []);

  const estaSincronizando = sincronizando || syncManagerEstado === 'syncing' || recargandoAnim;

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

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0D1526]/95 backdrop-blur-md border-b border-slate-800/40 shadow-xs flex items-center justify-between px-3 md:px-5 py-1.5 md:py-2 min-h-[52px] md:min-h-0 shrink-0 gap-2 relative">
        {/* FLANCO IZQUIERDO: Identificador Corporativo Permanente y Píldora "Al Día" (REQ-UI-32-FINAL) */}
        <div className="flex items-center gap-2.5 flex-1 md:flex-initial min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center font-black text-xs md:text-sm text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20 shrink-0">
              <span>P</span>
            </div>
            <span
              id="header-view-title"
              className="hidden md:inline text-base sm:text-lg font-bold text-slate-100 tracking-tight truncate"
            >
              MiPortalWeb
            </span>
            <span
              id="mobile-header-view-title"
              className="md:hidden text-base sm:text-lg font-bold text-slate-100 tracking-tight truncate"
            >
              MiPortalWeb
            </span>
          </div>

          {/* Píldora de Estado de Sincronización con Pulso Esmeralda Reactivo */}
          <button
            type="button"
            id="btn-sync-status-merged"
            data-legacy-id="btn-header-refresh"
            onClick={handleEjecutarSync}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none shrink-0 ml-auto md:ml-0 ${
              estaSincronizando
                ? 'bg-sky-500/10 border-sky-500/25 text-sky-400'
                : syncManagerEstado === 'reconnecting'
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                : syncManagerEstado === 'offline'
                ? 'bg-slate-800/80 border-slate-700/60 text-slate-400'
                : syncManagerEstado === 'error'
                ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/35'
            }`}
            title={
              estaSincronizando
                ? 'Sincronizando datos...'
                : syncManagerEstado === 'reconnecting'
                ? 'Reconectando en tiempo real...'
                : syncManagerEstado === 'offline'
                ? 'Modo sin conexión'
                : syncManagerEstado === 'error'
                ? 'Error en sincronización (Click para reintentar)'
                : 'Al Día (Sincronizado) - Click o presiona R para refrescar'
            }
            aria-label="Estado de sincronización: pulsar para sincronizar"
          >
            {estaSincronizando ? (
              <RotateCw className="w-3 h-3 text-sky-400 animate-spin shrink-0" strokeWidth={1.75} />
            ) : syncManagerEstado === 'reconnecting' ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40 duration-1000" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </span>
            ) : syncManagerEstado === 'offline' ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500" />
              </span>
            ) : syncManagerEstado === 'error' ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              </span>
            ) : (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 duration-1000" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </span>
            )}

            <span id="sync-status-text" className="whitespace-nowrap leading-none">
              {estaSincronizando
                ? 'Sincronizando...'
                : syncManagerEstado === 'reconnecting'
                ? 'Reconectando...'
                : syncManagerEstado === 'offline'
                ? 'Offline'
                : syncManagerEstado === 'error'
                ? 'Error sync'
                : 'Al Día'}
            </span>
          </button>
        </div>

        {/* CENTRO: 5 Pestañas Maestras Canónicas Unificadas (Atajos 1 a 5) */}
        <nav className="hidden md:inline-flex items-center p-1.5 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-inner gap-1 text-xs select-none xl:absolute xl:left-1/2 xl:-translate-x-1/2">
          {/* 1. Kanban */}
          <button
            type="button"
            onClick={() => onCambiarVista('kanban')}
            id="tab-nav-kanban"
            className={`px-3 py-1.5 rounded-xl font-bold transition-[color,background-color,border-color,transform] duration-150 ease-out transform-gpu will-change-transform flex items-center gap-2 cursor-pointer active:scale-95 ${
              vistaActiva === 'kanban'
                ? 'text-sky-300 bg-sky-950/30 border border-sky-800/40 shadow-xs'
                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/40 border border-transparent'
            }`}
            title="Tablero Kanban de Tareas (Presiona 1)"
          >
            <Columns className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span className="hidden lg:inline">Tablero</span>
            {totalKanban > 0 && (
              <span
                id="badge-header-kanban"
                className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 min-w-[18px] h-4 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/60 shadow-2xs leading-none flex items-center justify-center"
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
            className={`px-3 py-1.5 rounded-xl font-bold transition-[color,background-color,border-color,transform] duration-150 ease-out transform-gpu will-change-transform flex items-center gap-2 cursor-pointer active:scale-95 ${
              vistaActiva === 'portafolio' || vistaActiva === 'detalle'
                ? 'text-sky-300 bg-sky-950/30 border border-sky-800/40 shadow-xs'
                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/40 border border-transparent'
            }`}
            title="Portafolio de Proyectos (Presiona 2)"
          >
            <FolderKanban className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span className="hidden lg:inline">Portafolio</span>
            {totalPortafolio > 0 && (
              <span
                id="badge-header-portafolio"
                className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 min-w-[18px] h-4 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/60 shadow-2xs leading-none flex items-center justify-center"
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
            className={`px-3 py-1.5 rounded-xl font-bold transition-[color,background-color,border-color,transform] duration-150 ease-out transform-gpu will-change-transform flex items-center gap-2 cursor-pointer active:scale-95 ${
              vistaActiva === 'habitos'
                ? 'text-sky-300 bg-sky-950/30 border border-sky-800/40 shadow-xs'
                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/40 border border-transparent'
            }`}
            title="Hábitos y Gestión de Vida (Presiona 3)"
          >
            <HeartPulse className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span className="hidden lg:inline">Hábitos</span>
          </button>

          {/* 4. Finanzas */}
          <button
            type="button"
            onClick={() => onCambiarVista('financiero')}
            id="tab-nav-financiero"
            className={`px-3 py-1.5 rounded-xl font-bold transition-[color,background-color,border-color,transform] duration-150 ease-out transform-gpu will-change-transform flex items-center gap-2 cursor-pointer active:scale-95 ${
              vistaActiva === 'financiero'
                ? 'text-sky-300 bg-sky-950/30 border border-sky-800/40 shadow-xs'
                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/40 border border-transparent'
            }`}
            title="Flujo de Caja y Finanzas (Presiona 4)"
          >
            <Wallet className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span className="hidden lg:inline">Finanzas</span>
          </button>
        </nav>

        {/* FLANCO DERECHO: Dock Operativo Dark Cobalt (REQ-UI-32-FIX) */}
        <div id="header-actions-container" className="hidden md:flex items-center gap-2.5 shrink-0">
          {/* 0. Acceso Rápido a Notas Inteligentes (Atajo 5) */}
          <button
            type="button"
            onClick={() => onCambiarVista('notas')}
            id="tab-nav-notas"
            data-legacy-id="btn-nav-notas"
            className={`min-h-[40px] px-2.5 py-1.5 rounded-xl font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              vistaActiva === 'notas'
                ? 'text-sky-300 bg-sky-950/40 border border-sky-800/60 shadow-xs'
                : 'text-slate-400 hover:text-sky-300 hover:bg-[#0D1526] bg-[#0D1526]/80 border border-slate-800/80 hover:border-sky-500/40'
            }`}
            title="Notas Inteligentes y Wishlists (Presiona 5)"
          >
            <FileText className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span className="hidden xl:inline text-xs font-semibold">Notas</span>
            {totalNotas > 0 && (
              <span
                id="badge-header-notas"
                className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 min-w-[16px] h-3.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60 shadow-2xs leading-none flex items-center justify-center"
              >
                {totalNotas}
              </span>
            )}
          </button>

          {/* 1. Botón Calendar */}
          <a
            href="https://calendar.google.com/calendar/r"
            target="_blank"
            rel="noopener noreferrer"
            id="btn-header-calendar"
            className="min-w-[40px] min-h-[40px] w-10 h-10 p-0 rounded-xl border border-slate-800/80 bg-[#0D1526]/80 hover:border-sky-500/40 hover:bg-[#0D1526] text-slate-400 hover:text-sky-300 active:scale-95 transition-all cursor-pointer flex items-center justify-center select-none"
            title="Abrir Google Calendar (Presiona C)"
            aria-label="Abrir Google Calendar"
          >
            <Calendar className="w-4 h-4" strokeWidth={1.75} />
          </a>

          {/* 2. Botón de Archivados (#btn-header-archivados) */}
          <button
            type="button"
            id="btn-header-archivados"
            data-legacy-id="btn-header-boveda-archivados"
            onClick={() => setDrawerAbierto(true)}
            className={`min-w-[40px] min-h-[40px] h-10 rounded-xl border border-slate-800/80 bg-[#0D1526]/80 hover:border-sky-500/40 hover:bg-[#0D1526] text-slate-400 hover:text-sky-300 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 select-none ${
              totalArchivados > 0 ? 'px-2.5' : 'w-10 p-0'
            }`}
            title="Bóveda de Archivados (+10 días completados/conciliados)"
            aria-label="Abrir Bóveda de Archivados"
          >
            <Archive className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            {totalArchivados > 0 && (
              <span
                id="badge-header-archivados"
                className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 min-w-[18px] h-4 rounded-full bg-slate-800 text-sky-300 border border-slate-700 leading-none flex items-center justify-center shrink-0"
              >
                {totalArchivados}
              </span>
            )}
          </button>

          {/* 3. Atajos (#btn-toggle-shortcuts-modal) */}
          <button
            type="button"
            id="btn-toggle-shortcuts-modal"
            data-legacy-id="btn-shortcuts-config"
            onClick={onAbrirAtajos}
            className="min-w-[40px] min-h-[40px] w-10 h-10 p-0 rounded-xl border border-slate-800/80 bg-[#0D1526]/80 hover:border-sky-500/40 hover:bg-[#0D1526] text-slate-400 hover:text-sky-300 active:scale-95 transition-all cursor-pointer flex items-center justify-center select-none"
            title="Atajos de Teclado (Presiona ?)"
            aria-label="Abrir guía de atajos de teclado"
          >
            <Keyboard className="w-4 h-4" strokeWidth={1.75} />
          </button>

          {/* 4. Exportar Ficha PDF (Opcional / Directo) */}
          {onAbrirExportarPdf && (
            <button
              type="button"
              id="btn-header-exportar-pdf"
              onClick={onAbrirExportarPdf}
              className="min-w-[40px] min-h-[40px] w-10 h-10 p-0 rounded-xl border border-slate-800/80 bg-[#0D1526]/80 hover:border-sky-500/40 hover:bg-[#0D1526] text-slate-400 hover:text-sky-300 active:scale-95 transition-all cursor-pointer flex items-center justify-center select-none"
              title="Generar Ficha Resumen (PDF)"
              aria-label="Generar Ficha Resumen (PDF)"
            >
              <FileText className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
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
        className={`fixed inset-y-0 right-0 z-[10005] w-full sm:w-[500px] lg:w-[580px] bg-white dark:bg-[#0D1526] shadow-2xl border-l border-slate-200/90 dark:border-slate-800/40 transition-[transform] duration-200 ease-out transform-gpu will-change-transform flex flex-col min-h-0 select-none ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Encabezado del Drawer */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between shrink-0 bg-white dark:bg-[#0D1526]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-lg shadow-md shadow-amber-500/20 ring-1 ring-white/20">
              <Archive className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Bóveda de Archivados
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono tabular-nums">
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
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-[color,background-color,border-color,transform] duration-150 transform-gpu will-change-transform active:scale-95 cursor-pointer"
            title="Cerrar Bóveda (Esc)"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Buscador & 5 Pestañas de Filtro (Todos, Kanban, Portafolio, Hábitos, Finanzas) */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/60 space-y-3 shrink-0 bg-slate-50 dark:bg-[#090F1D]">
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 w-4 h-4 top-2.5" strokeWidth={1.75} />
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
                className="absolute inset-y-0 right-0 min-w-[44px] md:min-w-0 pr-3 flex items-center justify-end text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
            <button
              type="button"
              id="tab-drawer-todos"
              onClick={() => setTabArchivados('todos')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-[color,background-color,border-color,transform] duration-150 transform-gpu will-change-transform flex items-center gap-1.5 shrink-0 cursor-pointer ${
                tabArchivados === 'todos'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Todos</span>
              <span id="count-tab-arch-todos" className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono tabular-nums font-black">
                {totalArchivados}
              </span>
            </button>
            <button
              type="button"
              id="tab-drawer-kanban"
              onClick={() => setTabArchivados('kanban')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-[color,background-color,border-color,transform] duration-150 transform-gpu will-change-transform flex items-center gap-1.5 shrink-0 cursor-pointer ${
                tabArchivados === 'kanban'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Columns className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Kanban</span>
              <span id="count-tab-arch-kanban" className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 font-mono tabular-nums font-bold">
                {tareasArchivadas.length}
              </span>
            </button>
            <button
              type="button"
              id="tab-drawer-portafolio"
              onClick={() => setTabArchivados('portafolio')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-[color,background-color,border-color,transform] duration-150 transform-gpu will-change-transform flex items-center gap-1.5 shrink-0 cursor-pointer ${
                tabArchivados === 'portafolio'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Portafolio</span>
              <span id="count-tab-arch-portafolio" className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 font-mono tabular-nums font-bold">
                {proyectosArchivados.length}
              </span>
            </button>
            <button
              type="button"
              id="tab-drawer-habitos"
              onClick={() => setTabArchivados('habitos')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-[color,background-color,border-color,transform] duration-150 transform-gpu will-change-transform flex items-center gap-1.5 shrink-0 cursor-pointer ${
                tabArchivados === 'habitos'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" strokeWidth={1.75} />
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
              className={`px-3 py-1.5 rounded-xl font-medium transition-[color,background-color,border-color,transform] duration-150 transform-gpu will-change-transform flex items-center gap-1.5 shrink-0 cursor-pointer ${
                tabArchivados === 'finanzas'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" strokeWidth={1.75} />
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
                className="p-3.5 rounded-xl bg-white dark:bg-[#0D1526] border border-slate-200 dark:border-slate-800/60 flex items-center justify-between gap-3 shadow-xs hover:border-amber-400/50 transition-[color,background-color,border-color,transform] duration-150 transform-gpu will-change-transform"
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
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 flex items-center gap-1 shrink-0 transition-[color,background-color,border-color,transform] duration-150 transform-gpu will-change-transform active:scale-95 cursor-pointer"
                  title="Restaurar elemento en caliente"
                >
                  <RotateCcw className="w-3 h-3" strokeWidth={1.75} />
                  <span>Restaurar</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-5 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1526] flex items-center justify-between shrink-0 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={1.75} />
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
