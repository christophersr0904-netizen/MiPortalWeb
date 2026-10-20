import React, { useState } from 'react';
import {
  Columns,
  HeartPulse,
  Plus,
  FileText,
  Layers,
  X,
  CheckSquare,
  Activity,
  Receipt,
  FolderKanban,
  Wallet,
  Compass,
  ChevronRight,
  Archive
} from 'lucide-react';
import type { VistaGlobal } from './HeaderMaestro';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface BottomNavMobileProps {
  vistaActiva: VistaGlobal;
  onCambiarVista: (vista: VistaGlobal) => void;
  onCrearTareaRapida?: () => void;
  onCrearHabitoRapido?: () => void;
  onCrearNotaRapida?: () => void;
  onCrearGastoRapido?: () => void;
  onAbrirDrawerArchivados?: () => void;
}

export const BottomNavMobile: React.FC<BottomNavMobileProps> = ({
  vistaActiva,
  onCambiarVista,
  onCrearTareaRapida,
  onCrearHabitoRapido,
  onCrearNotaRapida,
  onCrearGastoRapido,
  onAbrirDrawerArchivados
}) => {
  const [sheetAccionAbierto, setSheetAccionAbierto] = useState(false);
  const [sheetMasAbierto, setSheetMasAbierto] = useState(false);

  useBodyScrollLock(sheetAccionAbierto || sheetMasAbierto);

  const cerrarSheets = () => {
    setSheetAccionAbierto(false);
    setSheetMasAbierto(false);
  };

  return (
    <>
      {/* Barra Fija Inferior (< 768px) */}
      <nav
        id="bottom-navigation-bar"
        className="fixed bottom-0 inset-x-0 z-[9999] md:hidden bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 shadow-[0_-8px_25px_rgba(0,0,0,0.35)] px-3 pt-1.5 pb-safe flex items-center justify-around select-none"
      >
        {/* Botón 1: Kanban */}
        <button
          type="button"
          id="bottom-nav-kanban"
          onClick={() => {
            cerrarSheets();
            onCambiarVista('kanban');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors group cursor-pointer active:scale-95 ${
            vistaActiva === 'kanban' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Tablero Kanban"
        >
          <Columns className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-[10px] font-semibold mt-1 tracking-tight">Kanban</span>
        </button>

        {/* Botón 2: Hábitos */}
        <button
          type="button"
          id="bottom-nav-habitos"
          onClick={() => {
            cerrarSheets();
            onCambiarVista('habitos');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors group cursor-pointer active:scale-95 ${
            vistaActiva === 'habitos' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Hábitos & Vida"
        >
          <HeartPulse className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-[10px] font-semibold mt-1 tracking-tight">Hábitos</span>
        </button>

        {/* Botón Central (+): Acción Rápida Elevada */}
        <div className="flex flex-col items-center justify-center -mt-5 px-1 shrink-0">
          <button
            type="button"
            id="bottom-nav-add"
            onClick={() => {
              setSheetMasAbierto(false);
              setSheetAccionAbierto(!sheetAccionAbierto);
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 ring-4 ring-slate-900 dark:ring-slate-950 active:scale-90 transition-transform cursor-pointer"
            title="Crear Nuevo Registro"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-bold text-indigo-400 dark:text-indigo-300 mt-0.5 tracking-tight">
            Nuevo
          </span>
        </div>

        {/* Botón 4: Notas */}
        <button
          type="button"
          id="bottom-nav-notas"
          onClick={() => {
            cerrarSheets();
            onCambiarVista('notas');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors group cursor-pointer active:scale-95 ${
            vistaActiva === 'notas' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Notas Inteligentes"
        >
          <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-[10px] font-semibold mt-1 tracking-tight">Notas</span>
        </button>

        {/* Botón 5: Más / Proyectos & Finanzas */}
        <button
          type="button"
          id="bottom-nav-mas"
          onClick={() => {
            setSheetAccionAbierto(false);
            setSheetMasAbierto(!sheetMasAbierto);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors group cursor-pointer active:scale-95 ${
            sheetMasAbierto || vistaActiva === 'portafolio' || vistaActiva === 'financiero' || vistaActiva === 'detalle'
              ? 'text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Más Módulos"
        >
          <Layers className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-[10px] font-semibold mt-1 tracking-tight">Más</span>
        </button>
      </nav>

      {/* Backdrop Compartido */}
      {(sheetAccionAbierto || sheetMasAbierto) && (
        <div
          id="bottom-sheet-backdrop"
          onClick={cerrarSheets}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99990] md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* 1. Bottom Sheet: Acción Rápida (+) */}
      {sheetAccionAbierto && (
        <div
          id="bottom-sheet-accion-rapida"
          className="fixed inset-x-0 bottom-0 z-[99995] bg-slate-900/98 dark:bg-slate-950/98 border-t border-slate-700/80 rounded-t-3xl p-5 pb-safe shadow-2xl md:hidden flex flex-col animate-in slide-in-from-bottom duration-250"
        >
          <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto mb-4 shrink-0" />

          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h3 className="text-sm font-black text-slate-100 tracking-tight">Acción Rápida</h3>
              <p className="text-[11px] text-slate-400">Crear un nuevo registro en el sistema</p>
            </div>
            <button
              type="button"
              onClick={cerrarSheets}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            {/* Tarea */}
            <button
              type="button"
              onClick={() => {
                cerrarSheets();
                if (onCrearTareaRapida) onCrearTareaRapida();
                else onCambiarVista('kanban');
              }}
              className="p-3.5 rounded-2xl flex flex-col items-start gap-2 bg-slate-850/60 dark:bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 active:scale-95 transition-all text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-100">Nueva Tarea</div>
                <div className="text-[10px] text-slate-400">Al Backlog Kanban</div>
              </div>
            </button>

            {/* Hábito */}
            <button
              type="button"
              onClick={() => {
                cerrarSheets();
                if (onCrearHabitoRapido) onCrearHabitoRapido();
                else onCambiarVista('habitos');
              }}
              className="p-3.5 rounded-2xl flex flex-col items-start gap-2 bg-slate-850/60 dark:bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 active:scale-95 transition-all text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-100">Nuevo Hábito</div>
                <div className="text-[10px] text-slate-400">Salud & Vida Personal</div>
              </div>
            </button>

            {/* Nota */}
            <button
              type="button"
              onClick={() => {
                cerrarSheets();
                if (onCrearNotaRapida) onCrearNotaRapida();
                else onCambiarVista('notas');
              }}
              className="p-3.5 rounded-2xl flex flex-col items-start gap-2 bg-slate-850/60 dark:bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/50 active:scale-95 transition-all text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-100">Nueva Nota</div>
                <div className="text-[10px] text-slate-400">Checklist & Captura</div>
              </div>
            </button>

            {/* Gasto */}
            <button
              type="button"
              onClick={() => {
                cerrarSheets();
                if (onCrearGastoRapido) onCrearGastoRapido();
                else onCambiarVista('financiero');
              }}
              className="p-3.5 rounded-2xl flex flex-col items-start gap-2 bg-slate-850/60 dark:bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/50 active:scale-95 transition-all text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-100">Nuevo Gasto</div>
                <div className="text-[10px] text-slate-400">Movimiento Financiero</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 2. Bottom Sheet: Más Módulos */}
      {sheetMasAbierto && (
        <div
          id="bottom-sheet-mas"
          className="fixed inset-x-0 bottom-0 z-[99995] bg-slate-900/98 dark:bg-slate-950/98 border-t border-slate-700/80 rounded-t-3xl p-5 pb-safe shadow-2xl md:hidden flex flex-col animate-in slide-in-from-bottom duration-250"
        >
          <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto mb-4 shrink-0" />

          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h3 className="text-sm font-black text-slate-100 tracking-tight">Más Módulos</h3>
              <p className="text-[11px] text-slate-400">Gestión estratégica y gobernanza</p>
            </div>
            <button
              type="button"
              onClick={cerrarSheets}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 mb-2">
            {/* Portafolio */}
            <button
              type="button"
              onClick={() => {
                cerrarSheets();
                onCambiarVista('portafolio');
              }}
              className="w-full p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-left active:scale-98 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Portafolio de Proyectos</div>
                  <div className="text-[10px] text-slate-400">Iniciativas, carteras e hitos WBS</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Finanzas */}
            <button
              type="button"
              onClick={() => {
                cerrarSheets();
                onCambiarVista('financiero');
              }}
              className="w-full p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-left active:scale-98 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Flujo de Caja & Finanzas</div>
                  <div className="text-[10px] text-slate-400">Ingresos, egresos, cuotas y liquidez</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Detalle 360 */}
            <button
              type="button"
              onClick={() => {
                cerrarSheets();
                onCambiarVista('detalle');
              }}
              className="w-full p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-left active:scale-98 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Detalle 360° de Proyecto</div>
                  <div className="text-[10px] text-slate-400">Visión profunda, hitos y gobernanza</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Bóveda de Archivados */}
            <button
              type="button"
              onClick={() => {
                cerrarSheets();
                if (onAbrirDrawerArchivados) onAbrirDrawerArchivados();
              }}
              className="w-full p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-left active:scale-98 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Bóveda de Archivados</div>
                  <div className="text-[10px] text-slate-400">Historial de tareas y registros cerrados (+10 días)</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
