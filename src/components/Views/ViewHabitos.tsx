import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TableroHabitos } from '../Habitos/TableroHabitos';
import { DashboardHabitos } from '../Habitos/Dashboard/DashboardHabitos';
import { ViewMetasPlanes } from '../Habitos/Metas/ViewMetasPlanes';
import { ModalActividadFlow } from '../Modals/ModalActividadFlow';
import { Activity, LayoutGrid, Plus, Target } from 'lucide-react';

type SubtabHabitos = 'tablero' | 'metas' | 'dashboard';

export const ViewHabitos: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<SubtabHabitos>('tablero');
  const [modalActividadAbierto, setModalActividadAbierto] = useState(false);

  return (
    <div id="vista-habitos-wrapper" className="flex-1 flex flex-col h-full w-full overflow-hidden bg-[#040711]">
      {/* ================================================================= */}
      {/* CABECERA MAESTRA UNIFICADA CON SELECTOR DE SUBPESTAÑAS COBALT     */}
      {/* ================================================================= */}
      <div className="px-2.5 sm:px-4 lg:px-6 py-2 sm:py-3 bg-[#0D1526]/90 backdrop-blur-md border-b border-slate-800/80 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        {/* Identidad del Módulo */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 bg-[#0B132B] text-sky-400 border border-slate-800/80 rounded-xl shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-black text-slate-100 leading-tight truncate">
                  Hábitos & Vida
                </h2>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/60 shrink-0">
                  SaaS Personal
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Gestión integral de hábitos, metas estratégicas y analítica de consistencia
              </p>
            </div>
          </div>

          {/* Botón Primario en Móvil (40px ergonómico con gradiente aeroespacial) */}
          <button
            type="button"
            id="btn-nuevo-habito-header-movil"
            onClick={() => setModalActividadAbierto(true)}
            className="sm:hidden h-10 px-3.5 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(56,189,248,0.28)] border border-sky-400/40 active:scale-95 cursor-pointer shrink-0"
            title="Registrar nuevo hábito"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Hábito</span>
          </button>
        </div>

        {/* Controles de Navegación y Acción Primaria Desktop */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* SELECTOR ESTRATÉGICO DE SUBPESTAÑAS: Segmented Control Flotante Glassmorphism */}
          <div
            role="tablist"
            aria-label="Navegación estratégica del módulo de Hábitos y Vida"
            className="inline-flex p-1 bg-[#040711]/80 backdrop-blur-md rounded-2xl border border-slate-800/80 gap-1 text-xs w-full sm:w-auto justify-between sm:justify-start shadow-inner shrink-0"
          >
            {[
              { id: 'tablero' as const, etiqueta: 'Tablero', icono: LayoutGrid },
              { id: 'metas' as const, etiqueta: 'Metas', icono: Target },
              { id: 'dashboard' as const, etiqueta: 'Dashboard', icono: Activity }
            ].map((tab) => {
              const estaActiva = tabActiva === tab.id;
              const Icono = tab.icono;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={estaActiva}
                  id={`subtab-habitos-${tab.id}`}
                  onClick={() => setTabActiva(tab.id)}
                  className={`relative flex-1 sm:flex-initial h-9 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer select-none shrink-0 ${
                    estaActiva
                      ? 'text-sky-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
                >
                  {estaActiva && (
                    <motion.div
                      layoutId="subtab-habitos-indicator"
                      className="absolute inset-0 rounded-xl bg-sky-500/15 border border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.22)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icono className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                    <span>{tab.etiqueta}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Botón Primario Desktop: Registrar Nuevo Hábito con Tokens Aeroespaciales */}
          <button
            type="button"
            id="btn-nuevo-habito-header"
            onClick={() => setModalActividadAbierto(true)}
            className="hidden sm:flex h-10 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 font-bold text-xs items-center gap-2 transition-all shadow-[0_0_20px_rgba(56,189,248,0.28)] border border-sky-400/40 active:scale-95 cursor-pointer shrink-0 group"
            title="Registrar nuevo hábito o compromiso personal"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" strokeWidth={2} />
            <span>Nuevo Hábito / Actividad</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* VISTA CONDICIONAL SEGÚN SUBPESTAÑA ACTIVA                         */}
      {/* ================================================================= */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {tabActiva === 'tablero' ? (
          <TableroHabitos ocultarHeader={true} />
        ) : tabActiva === 'metas' ? (
          <ViewMetasPlanes onCrearMeta={() => setModalActividadAbierto(true)} />
        ) : (
          <DashboardHabitos onCrearActividad={() => setModalActividadAbierto(true)} />
        )}
      </div>

      {/* Modal Canónico ActividadFlow para creación directa */}
      {modalActividadAbierto && (
        <ModalActividadFlow
          isOpen={modalActividadAbierto}
          onClose={() => setModalActividadAbierto(false)}
        />
      )}
    </div>
  );
};
