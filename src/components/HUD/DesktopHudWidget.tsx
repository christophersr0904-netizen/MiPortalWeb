import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { completarActividadPersonalLocal } from '../../services/habitosService';
import { calcularRutaCriticaCPM } from '../../services/cpmService';
import type { ActividadPersonal } from '../../types';
import {
  Activity,
  Maximize2,
  Sparkles,
  Flame,
  CheckCircle2,
  Circle,
  Send,
  Clock
} from 'lucide-react';

interface DesktopHudWidgetProps {
  onCambiarModoCompleto: () => void;
  onAbrirAsistenteIA: () => void;
}

export const DesktopHudWidget: React.FC<DesktopHudWidgetProps> = ({
  onCambiarModoCompleto,
  onAbrirAsistenteIA
}) => {
  const [nuevaIdea, setNuevaIdea] = useState('');

  // Hábitos activos
  const actividades = useLiveQuery(() => db.actividades_personales.toArray(), []);
  const hitos = useLiveQuery(() => db.hitos_wbs.toArray(), []);

  // Métricas CPM
  const calculoCPM = React.useMemo(() => {
    return calcularRutaCriticaCPM(hitos || []);
  }, [hitos]);

  const habitosDeHoy = (actividades || []).filter(
    (a) => a.tipo_compromiso === 'HABITUAL' || a.estado !== '05_Archivado'
  );

  const completadosCount = habitosDeHoy.filter((a) => a.estado === '04_Completado').length;
  const progresoPct =
    habitosDeHoy.length > 0 ? Math.round((completadosCount / habitosDeHoy.length) * 100) : 0;

  // Toggle hábito a 1-clic
  const handleToggleHabito = async (act: ActividadPersonal, e: React.MouseEvent) => {
    e.stopPropagation();
    const marcarCompletado = act.estado !== '04_Completado';
    await completarActividadPersonalLocal(act, marcarCompletado);
  };

  // Captura ultra-rápida de nota en Dexie (0 ms)
  const handleCapturaRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaIdea.trim()) return;

    const nowIso = new Date().toISOString();
    const count = await db.notas.count();
    await db.notas.add({
      id: crypto.randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: `NOT-${String(count + 1).padStart(5, '0')}`,
      titulo: nuevaIdea.trim(),
      contenido_markdown: `Captura rápida desde Desktop HUD el ${new Date().toLocaleDateString('es-PE')}`,
      tipo_nota: 'TEXTO',
      color_tema: 'sky',
      es_fijada: false,
      checklists_json: [],
      adjuntos_drive_json: [],
      enlaces_entidades_json: [],
      etiquetas: ['hud', 'captura-rapida'],
      created_at: nowIso,
      updated_at: nowIso,
      version: 1,
      sync_status: 'pending'
    });

    setNuevaIdea('');
  };

  return (
    <div className="w-full max-w-[380px] mx-auto min-h-[580px] bg-[#0D1526]/95 border border-slate-800 rounded-3xl shadow-cobalt-3 backdrop-blur-xl flex flex-col overflow-hidden text-slate-100">
      {/* Header HUD Frameless */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
            PMO HUD
            <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              0 ms
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onAbrirAsistenteIA}
            title="Abrir Asistente IA"
            className="p-1.5 rounded-lg text-sky-400 hover:bg-slate-800/80 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </button>
          <button
            onClick={onCambiarModoCompleto}
            title="Cambiar a Modo Dashboard Completo"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini KPIs Flotantes (Hábitos Hoy + WBS Ruta Crítica) */}
      <div className="p-3 grid grid-cols-2 gap-2 bg-[#020617]/40 border-b border-slate-800/60">
        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>HÁBITOS HOY</span>
            <span className="text-sky-400 font-bold">{progresoPct}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${progresoPct}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            {completadosCount} de {habitosDeHoy.length} completados
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>RUTA CRÍTICA</span>
            <Flame className="w-3 h-3 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-slate-100 font-mono">
              {calculoCPM.duracionProyecto}d
            </span>
            <span className="text-[10px] font-mono text-rose-300">
              ({calculoCPM.rutaCritica.length} críticos)
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-slate-400" /> Plazo Total
          </span>
        </div>
      </div>

      {/* Mini Checklist de Hábitos */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold font-mono text-slate-400 uppercase tracking-wider px-1">
          <span>Compromisos de Hoy</span>
          <span className="text-[10px] font-normal text-slate-500">1-clic</span>
        </div>

        {habitosDeHoy.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No hay hábitos activos para hoy.
          </div>
        ) : (
          habitosDeHoy.map((act) => {
            const estaCompletado = act.estado === '04_Completado';
            return (
              <div
                key={act.id}
                onClick={(e) => handleToggleHabito(act, e)}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  estaCompletado
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                    : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="shrink-0 text-sky-400">
                    {estaCompletado ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                    )}
                  </div>
                  <span
                    className={`text-xs truncate font-medium leading-snug ${
                      estaCompletado ? 'line-through text-slate-500' : 'text-slate-100'
                    }`}
                  >
                    {act.nombre_actividad}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                  {act.racha_actual > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                      <Flame className="w-2.5 h-2.5 fill-amber-400" />
                      {act.racha_actual}d
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input de Captura Rápida en Footer */}
      <form
        onSubmit={handleCapturaRapida}
        className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={nuevaIdea}
          onChange={(e) => setNuevaIdea(e.target.value)}
          placeholder="Captura rápida de idea o nota..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={!nuevaIdea.trim()}
          className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500 text-slate-950 transition-colors"
          title="Guardar Nota Instantánea"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
