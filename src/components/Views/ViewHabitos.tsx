import React, { useState } from 'react';
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
      <div className="px-2.5 sm:px-4 lg:px-6 py-2 sm:py-3 bg-[#0D1526]/80 backdrop-blur-md border-b border-slate-800/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shadow-cobalt-1">
        {/* Identidad del Módulo */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2.5 bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-emerald-500/20 ring-1 ring-white/20 shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-black text-slate-100 leading-tight truncate">
                  Hábitos & Vida
                </h2>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 shrink-0">
                  SaaS Personal
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Gestión integral de hábitos, metas estratégicas y analítica de consistencia
              </p>
            </div>
          </div>

          {/* Botón Primario en Móvil (h-7.5 inline) */}
          <button
            type="button"
            id="btn-nuevo-habito-header-movil"
            onClick={() => setModalActividadAbierto(true)}
            className="sm:hidden px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-900/30 transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
            title="Registrar nuevo hábito"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>+ Hábito</span>
          </button>
        </div>

        {/* Controles de Navegación y Acción Primaria Desktop */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* SELECTOR ESTRATÉGICO DE SUBPESTAÑAS: [ Tablero | Metas y Planes | Dashboard ] */}
          <div
            role="tablist"
            aria-label="Navegación estratégica del módulo de Hábitos y Vida"
            className="inline-flex p-0.5 sm:p-1 bg-[#0B132B] rounded-xl border border-slate-800/40 gap-0.5 sm:gap-1 text-xs w-full sm:w-auto justify-between sm:justify-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tabActiva === 'tablero'}
              id="subtab-habitos-tablero"
              onClick={() => setTabActiva('tablero')}
              className={`relative flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                tabActiva === 'tablero'
                  ? 'text-sky-300 bg-sky-950/30 shadow-xs'
                  : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span>Tablero</span>
              {tabActiva === 'tablero' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-sky-400" />
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tabActiva === 'metas'}
              id="subtab-habitos-metas"
              onClick={() => setTabActiva('metas')}
              className={`relative flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                tabActiva === 'metas'
                  ? 'text-sky-300 bg-sky-950/30 shadow-xs'
                  : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              <Target className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span>Metas</span>
              {tabActiva === 'metas' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-sky-400" />
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tabActiva === 'dashboard'}
              id="subtab-habitos-dashboard"
              onClick={() => setTabActiva('dashboard')}
              className={`relative flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                tabActiva === 'dashboard'
                  ? 'text-sky-300 bg-sky-950/30 shadow-xs'
                  : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span>Dashboard</span>
              {tabActiva === 'dashboard' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-sky-400" />
              )}
            </button>
          </div>

          {/* Botón Primario Desktop: Registrar Nuevo Hábito */}
          <button
            type="button"
            id="btn-nuevo-habito-header"
            onClick={() => setModalActividadAbierto(true)}
            className="hidden sm:flex px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
            title="Registrar nuevo hábito o compromiso personal"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
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
