import React, { useEffect, useState, lazy, Suspense } from 'react';
import { HeaderMaestro, type VistaGlobal, type ModoColor, type SaborTema } from './components/Layout/HeaderMaestro';
import { BottomNavMobile } from './components/Layout/BottomNavMobile';
import { WidgetIdeasBubble } from './components/Ideas/WidgetIdeasBubble';

// ErrorBoundary para blindar el Cockpit contra pantallas blancas en Electron
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CockpitErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Cockpit ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#070C18] text-rose-300 font-sans text-xs select-none">
          <p className="font-bold text-sm mb-2 text-rose-400">Error al montar el Cockpit</p>
          <pre className="p-3 rounded-lg bg-black/50 border border-rose-500/30 text-[10px] font-mono text-left max-w-full overflow-auto">
            {this.state.error?.message || 'Error desconocido'}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold cursor-pointer"
          >
            Reintentar
          </button>
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
import { AsistenteIaModal } from './components/IA/AsistenteIaModal';
import { DailyCockpit } from './components/Cockpit/DailyCockpit';
import { ModalAtajosTeclado } from './components/Modals/ModalAtajosTeclado';
import { ModalExportarPdf } from './components/Modals/ModalExportarPdf';
import { ModalTareaFlow } from './components/Modals/ModalTareaFlow';
import { ModalActividadFlow } from './components/Modals/ModalActividadFlow';
import { ModalGasto } from './components/Modals/ModalGasto';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { db, inicializarDatosSemillaSiVacio } from './db/db';
import { syncManager } from './services/syncManager';
import type { ActividadPersonal, VinculoEntidad } from './types';
import { UndoDeleteProvider } from './context/UndoDeleteContext';
import { UndoToastContainer } from './components/UI/UndoToastContainer';

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
  const [modoColor, setModoColor] = useState<ModoColor>('dark');
  const [saborTema, setSaborTema] = useState<SaborTema>('slate');
  const [modalHabitoGlobalAbierto, setModalHabitoGlobalAbierto] = useState(false);
  const [actividadEditarGlobal, setActividadEditarGlobal] = useState<ActividadPersonal | null>(null);
  const [modalGastoGlobalAbierto, setModalGastoGlobalAbierto] = useState(false);
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

      // Leer tema guardado
      const savedMode = localStorage.getItem('pmo_theme_mode') as ModoColor | null;
      if (savedMode === 'light' || savedMode === 'dark') {
        setModoColor(savedMode);
        if (savedMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        document.documentElement.classList.add('dark');
      }

      const savedSabor = localStorage.getItem('pmo_theme_flavor') as SaborTema | null;
      if (savedSabor === 'slate' || savedSabor === 'rose') {
        setSaborTema(savedSabor);
        document.documentElement.setAttribute('data-theme', savedSabor);
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

  const handleCambiarModoColor = (modo: ModoColor) => {
    setModoColor(modo);
    localStorage.setItem('pmo_theme_mode', modo);
    if (modo === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleCambiarSaborTema = (sabor: SaborTema) => {
    setSaborTema(sabor);
    localStorage.setItem('pmo_theme_flavor', sabor);
    document.documentElement.setAttribute('data-theme', sabor);
  };

  // Garantizar fondo 100% transparente en Electron para widget frameless
  // Si no está en modo widget, restablecer background de forma segura
  useEffect(() => {
    if (esModoHud || esWidgetNativo) {
      document.documentElement.classList.remove('bg-[#020617]', 'bg-[#040711]', 'bg-slate-50');
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.classList.remove('bg-[#020617]', 'bg-[#040711]', 'bg-slate-50');
      document.body.style.backgroundColor = 'transparent';
      const root = document.getElementById('root');
      if (root) root.style.backgroundColor = 'transparent';
    } else {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
      const root = document.getElementById('root');
      if (root) root.style.backgroundColor = '';
    }
  }, [esModoHud, esWidgetNativo]);

  // Si está en modo widget flotante de escritorio (Electron / Desktop HUD / Standalone)
  if (esModoHud || esWidgetNativo) {
    return (
      <CockpitErrorBoundary>
        <div className="h-screen w-screen bg-transparent p-0 overflow-hidden flex flex-col font-sans select-none">
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
    <UndoDeleteProvider>
      <div className="min-h-[100dvh] h-[100dvh] flex flex-col overflow-hidden bg-slate-50 dark:bg-[#040711] text-slate-800 dark:text-slate-200 antialiased font-sans safe-area-insets">
        {/* 1. Header Maestro Global */}
        <HeaderMaestro
          vistaActiva={vistaActiva}
          onCambiarVista={handleCambiarVista}
          onAbrirAsistenteIA={() => setAsistenteAbierto(true)}
          onAbrirAtajos={() => setModalAtajosAbierto(true)}
          onAbrirExportarPdf={() => setModalPdfAbierto(true)}
          drawerArchivadosAbierto={drawerArchivadosAbierto}
          onToggleDrawerArchivados={setDrawerArchivadosAbierto}
          modoColor={modoColor}
          saborTema={saborTema}
          onCambiarModoColor={handleCambiarModoColor}
          onCambiarSaborTema={handleCambiarSaborTema}
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

        {/* 3. Micro-Botón '+' Expandible Flotante de Ideas */}
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

      {/* 8. Cápsula Flotante y Cockpit Diario Global */}
      <DailyCockpit />

      {/* 9. Notificaciones y Búfer Global de Deshacer */}
      <UndoToastContainer />
    </div>
  </UndoDeleteProvider>
  );
};
