import React, { useEffect, useState, lazy, Suspense } from 'react';
import { HeaderMaestro, type VistaGlobal, type ModoColor, type SaborTema } from './components/Layout/HeaderMaestro';
import { BottomNavMobile } from './components/Layout/BottomNavMobile';
import { WidgetIdeasBubble } from './components/Ideas/WidgetIdeasBubble';
import { ViewKanban } from './components/Views/ViewKanban';
import { ViewPortafolio } from './components/Views/ViewPortafolio';
import { ViewHabitos } from './components/Views/ViewHabitos';
import { ViewNotas } from './components/Views/ViewNotas';

// Carga diferida con code-splitting para optimización de bundle (REQ-PROD-002)
const ViewDetalle360 = lazy(() =>
  import('./components/Views/ViewDetalle360').then((m) => ({ default: m.ViewDetalle360 }))
);
const ViewFinanzas = lazy(() =>
  import('./components/Views/ViewFinanzas').then((m) => ({ default: m.ViewFinanzas }))
);

const VistaCargandoFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#040711] min-h-[400px]">
    <div className="w-8 h-8 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin mb-3" />
    <span className="text-xs font-mono text-slate-400 tracking-wider">CARGANDO VISTA...</span>
  </div>
);
import { AsistenteIaModal } from './components/IA/AsistenteIaModal';
import { DesktopHudWidget } from './components/HUD/DesktopHudWidget';
import { ModalAtajosTeclado } from './components/Modals/ModalAtajosTeclado';
import { ModalExportarPdf } from './components/Modals/ModalExportarPdf';
import { ModalTareaFlow } from './components/Modals/ModalTareaFlow';
import { ModalActividadFlow } from './components/Modals/ModalActividadFlow';
import { ModalGasto } from './components/Modals/ModalGasto';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { db, inicializarDatosSemillaSiVacio } from './db/db';
import type { ActividadPersonal, VinculoEntidad } from './types';

export const App: React.FC = () => {
  const [vistaActiva, setVistaActiva] = useState<VistaGlobal>('kanban');
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string | null>(null);
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);
  const [modalAtajosAbierto, setModalAtajosAbierto] = useState(false);
  const [modalPdfAbierto, setModalPdfAbierto] = useState(false);
  const [drawerArchivadosAbierto, setDrawerArchivadosAbierto] = useState(false);
  const [esModoHud, setEsModoHud] = useState(false);
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
    onCambiarVista: (vista) => setVistaActiva(vista),
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
    // Detectar si se solicitó modo HUD por parámetro de URL (?mode=hud)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'hud') {
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
    inicializarDatosSemillaSiVacio().catch((err) => {
      console.warn('[App] Error al inicializar semilla de datos:', err);
    });

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
          setVistaActiva('habitos');
        }
      } else if (t === 'PROYECTO') {
        const proy = await db.proyectos
          .where('codigo_legado')
          .equals(v.codigo.trim())
          .first();
        if (proy) {
          setProyectoSeleccionadoId(proy.id);
          setVistaActiva('detalle');
        } else {
          setVistaActiva('portafolio');
        }
      } else if (t === 'GASTO' || t === 'INGRESO' || t === 'FINANZAS') {
        setVistaActiva('financiero');
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

  // Si está en modo HUD flotante compacto (Windows Widget / Desktop Window)
  if (esModoHud) {
    return (
      <div className="h-screen w-full bg-transparent flex items-center justify-center p-2 font-sans select-none">
        <DesktopHudWidget
          onCambiarModoCompleto={() => setEsModoHud(false)}
          onAbrirAsistenteIA={() => setAsistenteAbierto(true)}
        />
        <AsistenteIaModal
          isOpen={asistenteAbierto}
          onClose={() => setAsistenteAbierto(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen md:h-full flex flex-col overflow-y-auto md:overflow-hidden bg-slate-50 dark:bg-[#040711] text-slate-800 dark:text-slate-200 antialiased font-sans safe-area-insets">
      {/* 1. Header Maestro Global */}
      <HeaderMaestro
        vistaActiva={vistaActiva}
        onCambiarVista={(vista) => setVistaActiva(vista)}
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
      <div className="flex-1 flex overflow-y-auto md:overflow-hidden relative pb-20 md:pb-0">
        {vistaActiva === 'kanban' && (
          <ViewKanban
            onSeleccionarProyecto={(id) => {
              setProyectoSeleccionadoId(id);
              setVistaActiva('detalle');
            }}
            onVerDetalle360={(id) => {
              setProyectoSeleccionadoId(id);
              setVistaActiva('detalle');
            }}
          />
        )}

        {vistaActiva === 'portafolio' && (
          <ViewPortafolio
            onSeleccionarProyecto={(id) => {
              setProyectoSeleccionadoId(id);
              setVistaActiva('detalle');
            }}
          />
        )}

        {vistaActiva === 'habitos' && <ViewHabitos />}

        {vistaActiva === 'financiero' && (
          <Suspense fallback={<VistaCargandoFallback />}>
            <ViewFinanzas />
          </Suspense>
        )}

        {vistaActiva === 'detalle' && (
          <Suspense fallback={<VistaCargandoFallback />}>
            <ViewDetalle360
              proyectoIdSeleccionado={proyectoSeleccionadoId}
              onVolverAlPortafolio={() => setVistaActiva('portafolio')}
            />
          </Suspense>
        )}

        {vistaActiva === 'notas' && <ViewNotas />}
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
          setVistaActiva('portafolio');
        }}
        onConvertirAHabito={() => {
          setVistaActiva('habitos');
        }}
        onConvertirANota={() => {
          setVistaActiva('notas');
        }}
        onNavegarVista={(vista) => setVistaActiva(vista)}
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
        onCambiarVista={(vista) => setVistaActiva(vista)}
        onCrearTareaRapida={() => {
          setModalTareaProps({
            isOpen: true,
            tareaId: null,
            initialColumna: '01_Backlog'
          });
        }}
        onCrearHabitoRapido={() => setModalHabitoGlobalAbierto(true)}
        onCrearNotaRapida={() => setVistaActiva('notas')}
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
    </div>
  );
};
