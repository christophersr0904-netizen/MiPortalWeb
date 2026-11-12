import React, { useEffect, useState, lazy, Suspense } from 'react';
import { HeaderMaestro, type VistaGlobal } from './components/Layout/HeaderMaestro';
import { BottomNavMobile } from './components/Layout/BottomNavMobile';
import { WidgetIdeasBubble } from './components/Ideas/WidgetIdeasBubble';

// ErrorBoundary global para blindar tanto el Cockpit como el Portal contra pantallas azules vacías
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CockpitErrorBoundary extends React.Component<
  { children: React.ReactNode; scope?: 'Cockpit' | 'Portal' },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; scope?: 'Cockpit' | 'Portal' }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.scope || 'Cockpit'} ErrorBoundary]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      const scopeLabel = this.props.scope === 'Portal' ? 'el Portal Principal' : 'el Cockpit';
      return (
        <div className="w-full h-full min-h-screen flex flex-col items-center justify-center p-6 bg-[#040711] text-slate-200 font-sans text-xs select-none">
          <div className="max-w-xl w-full p-5 rounded-2xl bg-[#0D1526] border border-rose-500/40 shadow-2xl space-y-3">
            <p className="font-bold text-sm text-rose-400">Error al montar {scopeLabel}</p>
            <pre className="p-3 rounded-lg bg-[#020617] border border-rose-500/30 text-[11px] font-mono text-rose-200 text-left max-w-full max-h-60 overflow-auto whitespace-pre-wrap break-words">
              {this.state.error?.stack || this.state.error?.message || 'Error desconocido'}
            </pre>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold cursor-pointer"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if ('serviceWorker' in navigator) {
                      const regs = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(regs.map((r) => r.unregister()));
                    }
                    if ('caches' in window) {
                      const keys = await caches.keys();
                      await Promise.all(keys.map((k) => caches.delete(k)));
                    }
                  } finally {
                    window.location.reload();
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold cursor-pointer"
              >
                Limpiar Caché SW y Recargar
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Carga diferida con code-splitting para optimización drástica de bundle (REQ-SYS-001-F7)
const ViewKanban = lazy(() =>
  import('./components/Views/ViewKanban').then((m) => ({ default: m.ViewKanban }))
);
const ViewPortafolio = lazy(() =>
  import('./components/Views/ViewPortafolio').then((m) => ({ default: m.ViewPortafolio }))
);
const ViewHabitos = lazy(() =>
  import('./components/Views/ViewHabitos').then((m) => ({ default: m.ViewHabitos }))
);
const ViewNotas = lazy(() =>
  import('./components/Views/ViewNotas').then((m) => ({ default: m.ViewNotas }))
);
const ViewDetalle360 = lazy(() =>
  import('./components/Views/ViewDetalle360').then((m) => ({ default: m.ViewDetalle360 }))
);
const ViewFinanzas = lazy(() =>
  import('./components/Views/ViewFinanzas').then((m) => ({ default: m.ViewFinanzas }))
);

const getVistaDesdeHash = (): VistaGlobal => {
  if (typeof window === 'undefined') return 'kanban';
  const rawHash = window.location.hash.replace(/^#/, '').toLowerCase().trim();
  const vistasValidas: VistaGlobal[] = ['kanban', 'portafolio', 'habitos', 'financiero', 'detalle', 'notas'];
  if (vistasValidas.includes(rawHash as VistaGlobal)) {
    return rawHash as VistaGlobal;
  }
  return 'kanban';
};

const VistaCargandoFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#040711] min-h-[400px]">
    <div className="w-8 h-8 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin mb-3" />
    <span className="text-xs font-mono text-slate-400 tracking-wider">CARGANDO VISTA...</span>
  </div>
);
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, X } from 'lucide-react';
import { AsistenteIaModal } from './components/IA/AsistenteIaModal';
import { DailyCockpit } from './components/Cockpit/DailyCockpit';
import { ModalAtajosTeclado } from './components/Modals/ModalAtajosTeclado';
import { ModalExportarPdf } from './components/Modals/ModalExportarPdf';
import { ModalTareaFlow } from './components/Modals/ModalTareaFlow';
import { ModalActividadFlow } from './components/Modals/ModalActividadFlow';
import { ModalGasto } from './components/Modals/ModalGasto';
import { EditorNotaModal } from './components/Notas/EditorNotaModal';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useUndoDelete } from './hooks/useUndoDelete';
import { db, inicializarDatosSemillaSiVacio } from './db/db';
import { syncManager } from './services/syncManager';
import type { ActividadPersonal, VinculoEntidad } from './types';
import { UndoDeleteProvider } from './context/UndoDeleteContext';
import { UndoToastContainer } from './components/UI/UndoToastContainer';

/** Barra de estado flotante compacta para tareas en progreso (REQ-OPS-28). */
const BarraFocoTareasEnProgreso: React.FC<{
  onAbrirTarea: (tareaId: string) => void;
}> = React.memo(({ onAbrirTarea }) => {
  const { estaOculto } = useUndoDelete();
  const [ocultoTemporal, setOcultoTemporal] = useState(false);
  const [indice, setIndice] = useState(0);

  const tareasActivasRaw =
    useLiveQuery(
      () => db.tareas.where('estado_tarea').equals('03_En_Proceso').toArray(),
      [],
      []
    ) ?? [];

  const tareasActivas = React.useMemo(
    () =>
      tareasActivasRaw.filter(
        (t) => !estaOculto(t.id) && !(t.codigo_legado && estaOculto(t.codigo_legado))
      ),
    [tareasActivasRaw, estaOculto]
  );

  if (ocultoTemporal || tareasActivas.length === 0) return null;

  const tareaActual = tareasActivas[indice % tareasActivas.length];
  const titulo =
    tareaActual.nombre_tarea_actividad ||
    (tareaActual as any).titulo ||
    tareaActual.codigo_legado ||
    'Tarea en curso';

  return (
    <div
      id="micro-widget-foco-progreso"
      className="fixed bottom-20 left-3 md:bottom-5 md:left-1/2 md:-translate-x-1/2 z-[9980] max-w-[calc(100vw-84px)] sm:max-w-sm pointer-events-auto select-none"
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1 min-h-[40px] rounded-full bg-[#0D1526]/95 backdrop-blur-xl border border-sky-500/35 shadow-[0_10px_25px_-5px_rgba(2,6,23,0.85),0_0_15px_rgba(56,189,248,0.18)] text-xs text-slate-100">
        <button
          type="button"
          onClick={() => onAbrirTarea(tareaActual.id)}
          className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-pointer active:scale-[0.98] transition-transform"
          title={`En Progreso: ${titulo} (Clic para abrir)`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
          <span className="font-mono tabular-nums text-[10px] font-bold text-sky-300 bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 rounded shrink-0">
            {tareaActual.codigo_legado || 'FOCO'}
          </span>
          <span className="truncate text-xs font-semibold text-slate-100 max-w-[115px] sm:max-w-[180px]">
            {titulo}
          </span>
        </button>

        {tareasActivas.length > 1 && (
          <button
            type="button"
            onClick={() => setIndice((prev) => prev + 1)}
            className="min-w-[28px] min-h-[28px] px-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono tabular-nums text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer shrink-0 transition"
            title="Ver siguiente tarea en progreso"
            aria-label="Siguiente tarea en progreso"
          >
            <span>{(indice % tareasActivas.length) + 1}/{tareasActivas.length}</span>
            <ChevronRight className="w-3 h-3" strokeWidth={1.75} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setOcultoTemporal(true)}
          aria-label="Ocultar barra de tarea en progreso"
          title="Ocultar temporalmente"
          className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
});

BarraFocoTareasEnProgreso.displayName = 'BarraFocoTareasEnProgreso';

export const App: React.FC = () => {
  // FIX-COCKPIT-NATIVE-SIGNAL-RESTORE-119: Reconocimiento dual de entorno nativo Electron
  // Se detecta tanto por la marca inmutable inyectada en desktop/preload.js (window.IS_DESKTOP_WIDGET)
  // como por parámetros explícitos de URL (?widget=desktop o ?mode=hud).
  // En navegador normal (http://localhost:3000/), window.IS_DESKTOP_WIDGET es undefined y monta el Layout completo.
  const [esModoHud, setEsModoHud] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      return (
        (window as any).IS_DESKTOP_WIDGET === true ||
        searchParams.get('widget') === 'desktop' ||
        hashParams.get('widget') === 'desktop' ||
        searchParams.get('mode') === 'hud' ||
        hashParams.get('mode') === 'hud'
      );
    }
    return false;
  });

  const esWidgetNativo = typeof window !== 'undefined' && (
    (window as any).IS_DESKTOP_WIDGET === true ||
    new URLSearchParams(window.location.search).get('widget') === 'desktop' ||
    new URLSearchParams(window.location.hash.replace(/^#/, '')).get('widget') === 'desktop' ||
    new URLSearchParams(window.location.search).get('mode') === 'hud' ||
    new URLSearchParams(window.location.hash.replace(/^#/, '')).get('mode') === 'hud'
  );

  const [vistaActiva, setVistaActiva] = useState<VistaGlobal>(() => getVistaDesdeHash());

  const handleCambiarVista = (vista: VistaGlobal) => {
    setVistaActiva(vista);
    if (typeof window !== 'undefined' && !esModoHud && !esWidgetNativo) {
      if (window.location.hash.replace(/^#/, '') !== vista) {
        window.history.replaceState(null, '', `#${vista}`);
      }
    }
  };

  useEffect(() => {
    if (esModoHud || esWidgetNativo) return;
    const handleHashChange = () => {
      const vista = getVistaDesdeHash();
      setVistaActiva(vista);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [esModoHud, esWidgetNativo]);

  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string | null>(null);
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);
  const [modalAtajosAbierto, setModalAtajosAbierto] = useState(false);
  const [modalPdfAbierto, setModalPdfAbierto] = useState(false);
  const [drawerArchivadosAbierto, setDrawerArchivadosAbierto] = useState(false);
  const [modalHabitoGlobalAbierto, setModalHabitoGlobalAbierto] = useState(false);
  const [actividadEditarGlobal, setActividadEditarGlobal] = useState<ActividadPersonal | null>(null);
  const [modalGastoGlobalAbierto, setModalGastoGlobalAbierto] = useState(false);
  const [modalNotaGlobalAbierto, setModalNotaGlobalAbierto] = useState(false);
  const [modalTareaProps, setModalTareaProps] = useState<{
    isOpen: boolean;
    tareaId: string | null;
    initialColumna?: string;
    initialTitulo?: string;
    initialNotas?: string;
  } | null>(null);

  // Integración centralizada de atajos de teclado y pila LIFO
  useGlobalShortcuts({
    vistaActiva,
    onCambiarVista: handleCambiarVista,
    modalAtajosAbierto,
    setModalAtajosAbierto,
    modalPdfAbierto,
    setModalPdfAbierto,
    drawerArchivadosAbierto,
    setDrawerArchivadosAbierto,
    asistenteIaAbierto: asistenteAbierto,
    setAsistenteIaAbierto: setAsistenteAbierto
  });

  useEffect(() => {
    // Detectar si se solicitó modo HUD por parámetro de URL (?mode=hud o #mode=hud o ?mode=cockpit-only)
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      if (
        (window as any).IS_DESKTOP_WIDGET === true ||
        searchParams.get('widget') === 'desktop' ||
        hashParams.get('widget') === 'desktop' ||
        searchParams.get('mode') === 'hud' ||
        hashParams.get('mode') === 'hud'
      ) {
        setEsModoHud(true);
      }

      // Sellar interfaz exclusivamente en el tema oficial Dark Cobalt (REQ-UI-32-FIX)
      document.documentElement.classList.add('dark');
      document.documentElement.removeAttribute('data-theme');

      // Enrutador Deep-Link para App Shortcuts PWA (?action=...) (REQ-OPS-28)
      const isHudInit =
        (window as any).IS_DESKTOP_WIDGET === true ||
        searchParams.get('widget') === 'desktop' ||
        hashParams.get('widget') === 'desktop' ||
        searchParams.get('mode') === 'hud' ||
        hashParams.get('mode') === 'hud';

      const actionParam = searchParams.get('action');
      if (!isHudInit && actionParam) {
        switch (actionParam) {
          case 'nueva_tarea':
            setModalTareaProps({
              isOpen: true,
              tareaId: null,
              initialColumna: '01_Backlog'
            });
            break;
          case 'nuevo_gasto':
            setModalGastoGlobalAbierto(true);
            break;
          case 'nueva_idea':
          case 'voice_idea':
            window.dispatchEvent(new CustomEvent('pmo:abrir-captura-idea'));
            break;
          case 'nueva_nota':
            handleCambiarVista('notas');
            setModalNotaGlobalAbierto(true);
            break;
          case 'nuevo_habito':
            handleCambiarVista('habitos');
            setModalHabitoGlobalAbierto(true);
            break;
          default:
            break;
        }
        const hashDestino =
          actionParam === 'nueva_nota'
            ? '#notas'
            : actionParam === 'nuevo_habito'
            ? '#habitos'
            : window.location.hash;
        window.history.replaceState({}, '', `${window.location.pathname}${hashDestino}`);
      }
    }

    // Hidratar en frío si la base de datos Dexie está vacía o incompleta (I/O paralelo ultra-rápido)
    // En modo HUD / widget nativo de escritorio, priorizar snapshot del puente local antes de la semilla fría
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const hashParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.replace(/^#/, '')) : null;
    const isHud =
      (window as any).IS_DESKTOP_WIDGET === true ||
      searchParams?.get('widget') === 'desktop' ||
      hashParams?.get('widget') === 'desktop' ||
      searchParams?.get('mode') === 'hud' ||
      hashParams?.get('mode') === 'hud';

    (async () => {
      try {
        if (isHud) {
          await syncManager.cargarSnapshotDesdePuenteLocal().catch(() => false);
        }
        await inicializarDatosSemillaSiVacio();
        if (isHud) {
          await syncManager.sincronizarTodo().catch((err) => {
            console.warn('[App] Error en syncManager.sincronizarTodo al arrancar modo HUD:', err);
          });
        } else if (typeof navigator !== 'undefined' && navigator.onLine) {
          // REQ-SYNC-41-EXEC: En arranque web normal, descargar inmediatamente datos frescos de Supabase
          syncManager.descargarDatosDescendientes().catch((err) => {
            console.warn('[App] Error en syncManager.descargarDatosDescendientes al arrancar web:', err);
          });
        }
      } catch (err) {
        console.warn('[App] Error al inicializar semilla de datos:', err);
      }
    })();

    // Listener global para navegación inversa desde notas vinculadas (Fase 4.43)
    const handleAbrirEntidad = async (e: Event) => {
      const customEvent = e as CustomEvent<VinculoEntidad>;
      const v = customEvent.detail;
      if (!v || !v.codigo) return;

      const t = (v.tipo || 'PROYECTO').toUpperCase();
      if (t === 'TAREA') {
        setModalTareaProps({
          isOpen: true,
          tareaId: v.codigo
        });
      } else if (t === 'HABITO' || t === 'ACTIVIDAD') {
        const act = await db.actividades_personales
          .where('codigo_legado')
          .equals(v.codigo.trim())
          .first();
        if (act) {
          setActividadEditarGlobal(act);
          setModalHabitoGlobalAbierto(true);
        } else {
          handleCambiarVista('habitos');
        }
      } else if (t === 'PROYECTO') {
        const proy = await db.proyectos
          .where('codigo_legado')
          .equals(v.codigo.trim())
          .first();
        if (proy) {
          setProyectoSeleccionadoId(proy.id);
          handleCambiarVista('detalle');
        } else {
          handleCambiarVista('portafolio');
        }
      } else if (t === 'GASTO' || t === 'INGRESO' || t === 'FINANZAS') {
        handleCambiarVista('financiero');
      }
    };

    window.addEventListener('pmo:abrir-entidad', handleAbrirEntidad);
    return () => {
      window.removeEventListener('pmo:abrir-entidad', handleAbrirEntidad);
    };
  }, []);

  // Soporte de ventana transparente y silueta orgánica para widget flotante (REQ-DESKTOP-05)
  // En modo widget, el contenedor tiene tamaño exacto sin áreas muertas
  useEffect(() => {
    if (esModoHud || esWidgetNativo) {
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.style.backgroundColor = 'transparent';
      const root = document.getElementById('root');
      if (root) {
        root.style.backgroundColor = 'transparent';
        root.style.overflow = 'hidden';
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
      const root = document.getElementById('root');
      if (root) {
        root.style.backgroundColor = '';
        root.style.overflow = '';
      }
      document.body.style.overflow = '';
    }
  }, [esModoHud, esWidgetNativo]);

  // Si está en modo widget flotante de escritorio (Electron / Desktop HUD / Standalone)
  if (esModoHud || esWidgetNativo) {
    return (
      <CockpitErrorBoundary>
        <div className="w-full h-full bg-transparent p-0 overflow-hidden flex flex-col font-sans select-none">
          <DailyCockpit
            modoForzadoDesacoplado={true}
            onCerrarDesacoplado={() => {
              if (esWidgetNativo && window.desktopWidget?.close) {
                window.desktopWidget.close();
              } else {
                setEsModoHud(false);
              }
            }}
          />
          <AsistenteIaModal
            isOpen={asistenteAbierto}
            onClose={() => setAsistenteAbierto(false)}
          />
        </div>
      </CockpitErrorBoundary>
    );
  }

  return (
    <CockpitErrorBoundary scope="Portal">
      <UndoDeleteProvider>
        <div className="min-h-[100dvh] h-[100dvh] flex flex-col overflow-hidden bg-[#040711] text-slate-200 antialiased font-sans safe-area-insets">
        {/* 1. Header Maestro Global */}
        <HeaderMaestro
          vistaActiva={vistaActiva}
          onCambiarVista={handleCambiarVista}
          onAbrirAsistenteIA={() => setAsistenteAbierto(true)}
          onAbrirAtajos={() => setModalAtajosAbierto(true)}
          onAbrirExportarPdf={() => setModalPdfAbierto(true)}
          drawerArchivadosAbierto={drawerArchivadosAbierto}
          onToggleDrawerArchivados={setDrawerArchivadosAbierto}
        />

        {/* 2. Área Central con Renderizado Condicional de Vistas Canónicas */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overscroll-contain md:overflow-hidden relative pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <Suspense fallback={<VistaCargandoFallback />}>
            {vistaActiva === 'kanban' && (
              <ViewKanban
                onSeleccionarProyecto={(id) => {
                  setProyectoSeleccionadoId(id);
                  handleCambiarVista('detalle');
                }}
                onVerDetalle360={(id) => {
                  setProyectoSeleccionadoId(id);
                  handleCambiarVista('detalle');
                }}
              />
            )}

            {vistaActiva === 'portafolio' && (
              <ViewPortafolio
                onSeleccionarProyecto={(id) => {
                  setProyectoSeleccionadoId(id);
                  handleCambiarVista('detalle');
                }}
              />
            )}

            {vistaActiva === 'habitos' && <ViewHabitos />}

            {vistaActiva === 'financiero' && <ViewFinanzas />}

            {vistaActiva === 'detalle' && (
              <ViewDetalle360
                proyectoIdSeleccionado={proyectoSeleccionadoId}
                onVolverAlPortafolio={() => handleCambiarVista('portafolio')}
              />
            )}

            {vistaActiva === 'notas' && <ViewNotas />}
          </Suspense>
        </div>

        {/* 3. Barra de Foco en Progreso + Micro-Botón '+' Expandible Flotante de Ideas */}
        <BarraFocoTareasEnProgreso
          onAbrirTarea={(id) =>
            setModalTareaProps({
              isOpen: true,
              tareaId: id
            })
          }
        />

        <WidgetIdeasBubble
          onAbrirAsistenteIA={() => setAsistenteAbierto(true)}
          onConvertirATarea={(idea) => {
            setModalTareaProps({
              isOpen: true,
              tareaId: null,
              initialColumna: '02_Por_Hacer',
              initialTitulo: idea.enunciado,
              initialNotas: idea.detalle
            });
          }}
          onConvertirAProyecto={() => {
            handleCambiarVista('portafolio');
          }}
          onConvertirAHabito={() => {
            handleCambiarVista('habitos');
          }}
          onConvertirANota={() => {
            handleCambiarVista('notas');
          }}
          onNavegarVista={handleCambiarVista}
        />

        {/* Modal TareaFlow para conversiones globales */}
        {modalTareaProps?.isOpen && (
          <ModalTareaFlow
            isOpen={modalTareaProps.isOpen}
            onClose={() => setModalTareaProps(null)}
            tareaId={modalTareaProps.tareaId}
            initialColumna={modalTareaProps.initialColumna}
            initialTitulo={modalTareaProps.initialTitulo}
            initialNotas={modalTareaProps.initialNotas}
          />
        )}

        {/* 4. Barra Fija Inferior Móvil con Bottom Sheets */}
        <BottomNavMobile
          vistaActiva={vistaActiva}
          onCambiarVista={handleCambiarVista}
          onCrearTareaRapida={() => {
            setModalTareaProps({
              isOpen: true,
              tareaId: null,
              initialColumna: '01_Backlog'
            });
          }}
          onCrearHabitoRapido={() => setModalHabitoGlobalAbierto(true)}
          onCrearNotaRapida={() => handleCambiarVista('notas')}
          onCrearGastoRapido={() => setModalGastoGlobalAbierto(true)}
          onAbrirDrawerArchivados={() => setDrawerArchivadosAbierto(true)}
        />

      {/* Modal Canónico ActividadFlow (Global) */}
      <ModalActividadFlow
        isOpen={modalHabitoGlobalAbierto}
        actividadEditar={actividadEditarGlobal}
        onClose={() => {
          setModalHabitoGlobalAbierto(false);
          setActividadEditarGlobal(null);
        }}
      />

      {/* Modal Canónico Gasto (Global) */}
      <ModalGasto
        isOpen={modalGastoGlobalAbierto}
        onClose={() => setModalGastoGlobalAbierto(false)}
      />

      {/* Modal Canónico Nota Rápida / Deep-Link (Global) */}
      <EditorNotaModal
        isOpen={modalNotaGlobalAbierto}
        nota={null}
        onClose={() => setModalNotaGlobalAbierto(false)}
      />

      {/* 5. Modal Asistente IA */}
      <AsistenteIaModal
        isOpen={asistenteAbierto}
        onClose={() => setAsistenteAbierto(false)}
      />

      {/* 6. Modal Canónico de Atajos de Teclado */}
      <ModalAtajosTeclado
        isOpen={modalAtajosAbierto}
        onClose={() => setModalAtajosAbierto(false)}
        scopeInicial={vistaActiva === 'financiero' ? 'finanzas' : vistaActiva === 'detalle' ? 'portafolio' : vistaActiva}
      />

      {/* 7. Modal Canónico de Exportación PDF */}
      <ModalExportarPdf
        isOpen={modalPdfAbierto}
        onClose={() => setModalPdfAbierto(false)}
        proyectoIdSeleccionado={proyectoSeleccionadoId}
      />

      {/* 8. Notificaciones y Búfer Global de Deshacer */}
      <UndoToastContainer />
    </div>
  </UndoDeleteProvider>
    </CockpitErrorBoundary>
  );
};
