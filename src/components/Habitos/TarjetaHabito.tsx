import React, { useState } from 'react';
import type { ActividadPersonal, SubtareaPaso, AlcanceRecurrencia } from '../../types';
import { CATEGORIAS_VIDA_MAP } from '../../types';
import { ListaSubtareas } from '../Subtareas/ListaSubtareas';
import { ModalAlcanceRecurrencia } from '../Modals/ModalAlcanceRecurrencia';
import {
  Check, Flame, Calendar, Clock, DollarSign, PlusCircle, Pencil, Trash2,
  HeartPulse, BookOpen, Briefcase, Wallet, Users, Coffee
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';
import { BadgeNotasVinculadas } from '../Notas/BadgeNotasVinculadas';

export const renderIconoCategoriaVida = (icono: string, className = "w-3 h-3") => {
  switch (icono) {
    case 'HeartPulse': return <HeartPulse className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Briefcase': return <Briefcase className={className} />;
    case 'Wallet': return <Wallet className={className} />;
    case 'Users': return <Users className={className} />;
    case 'Coffee': return <Coffee className={className} />;
    default: return <HeartPulse className={className} />;
  }
};

interface TarjetaHabitoProps {
  actividad: ActividadPersonal;
  subtareas: SubtareaPaso[];
  onToggleCompletar: (actividad: ActividadPersonal, completadoDeseado: boolean) => Promise<{ actividadActualizada: ActividadPersonal; esRepetida: boolean; nuevaRacha: number }>;
  onRegistrarAvance: (actividad: ActividadPersonal, valor: number) => Promise<{ actividadActualizada: ActividadPersonal; rachaRescatada: boolean; metaCompletada: boolean }>;
  onToggleSubtarea: (idSubtarea: string, deseado?: boolean) => Promise<{ success: boolean; error?: string }>;
  onEditar?: (actividad: ActividadPersonal, alcance?: AlcanceRecurrencia) => void;
  onEliminar?: (actividad: ActividadPersonal, alcance?: AlcanceRecurrencia) => void;
}

export const TarjetaHabito: React.FC<TarjetaHabitoProps> = ({
  actividad,
  subtareas,
  onToggleCompletar,
  onRegistrarAvance,
  onToggleSubtarea,
  onEditar,
  onEliminar
}) => {
  const [modalAlcanceAbierto, setModalAlcanceAbierto] = useState(false);
  const [accionAlcance, setAccionAlcance] = useState<'editar' | 'eliminar'>('editar');

  const catConfig = CATEGORIAS_VIDA_MAP[actividad.categoria_vida] || CATEGORIAS_VIDA_MAP.SALUD_DEPORTE;
  const hoyStr = new Date().toISOString().split('T')[0];
  const tieneRecurrencia = Boolean(
    (actividad.frecuencia_ciclo && actividad.frecuencia_ciclo !== 'NINGUNA') ||
    (actividad.regla_repeticion && actividad.regla_repeticion.trim() !== '')
  );
  const esRutinaria = actividad.tipo_compromiso === 'HABITUAL' || tieneRecurrencia;

  // Cálculo de días de mora
  const diferenciaEnDias = (fHoy: string, fProg?: string): number => {
    if (!fProg || fProg >= fHoy) return 0;
    const pProg = fProg.split(/[\sT]/)[0].split('-');
    const pHoy = fHoy.split('-');
    if (pProg.length !== 3 || pHoy.length !== 3) return 0;
    const dProg = new Date(parseInt(pProg[0], 10), parseInt(pProg[1], 10) - 1, parseInt(pProg[2], 10), 12, 0, 0);
    const dHoy = new Date(parseInt(pHoy[0], 10), parseInt(pHoy[1], 10) - 1, parseInt(pHoy[2], 10), 12, 0, 0);
    return Math.max(0, Math.floor((dHoy.getTime() - dProg.getTime()) / 86400000));
  };
  const diasMora = diferenciaEnDias(hoyStr, actividad.fecha_programada);

  const esCumplidoHoy = (diasMora === 0 || actividad.estado === '04_Completado') && (
    actividad.estado === '04_Completado' || 
    actividad.ultima_fecha_completado === hoyStr ||
    (Boolean(actividad.updated_at && actividad.updated_at.startsWith(hoyStr)) && (actividad.racha_actual || 0) > 0 && actividad.fecha_programada >= hoyStr) ||
    (esRutinaria && actividad.fecha_programada > hoyStr && (actividad.racha_actual || 0) > 0)
  );
  const esCompletada = esCumplidoHoy;
  const esHabitual = actividad.tipo_compromiso === 'HABITUAL';
  const racha = actividad.racha_actual || 0;

  // Disparador de confeti según nivel de racha
  const lanzarConfettiCelebracion = (rachaNum: number) => {
    try {
      confetti({
        particleCount: rachaNum >= 5 ? 60 : 30,
        spread: 55,
        origin: { y: 0.75 },
        colors: ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'],
        ticks: 200,
        zIndex: 99999
      });
    } catch {
      // Ignorar en entornos sin soporte de canvas
    }
  };

  // Handlers de acción con alcance
  const handleSolicitarEditar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onEditar) return;
    onEditar(actividad);
  };

  const handleSolicitarEliminar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onEliminar) return;
    if (esRutinaria) {
      setAccionAlcance('eliminar');
      setModalAlcanceAbierto(true);
    } else {
      const confirm = await Swal.fire({
        title: '¿Eliminar actividad?',
        text: `Se borrará "${actividad.nombre_actividad}".`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#475569',
        background: '#0D1526',
        color: '#f8fafc'
      });
      if (confirm.isConfirmed) {
        onEliminar(actividad, 'ALL');
      }
    }
  };

  const handleSeleccionarAlcance = (alcance: AlcanceRecurrencia) => {
    setModalAlcanceAbierto(false);
    if (accionAlcance === 'eliminar' && onEliminar) {
      onEliminar(actividad, alcance);
    }
  };

  const handleToggleCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nuevoEstadoDeseado = !esCompletada;

    const res = await onToggleCompletar(actividad, nuevoEstadoDeseado);

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1600,
      timerProgressBar: true,
      background: '#0D1526',
      color: '#f8fafc'
    });

    if (nuevoEstadoDeseado) {
      const msgRacha = esHabitual && res.nuevaRacha > 0
        ? ` · ¡Racha de ${res.nuevaRacha} ${res.nuevaRacha === 1 ? 'día' : 'días'}!`
        : ' · ¡Objetivo cumplido!';

      Toast.fire({
        icon: 'success',
        title: '¡Hábito Cumplido!',
        text: `${actividad.nombre_actividad}${msgRacha}`
      });

      lanzarConfettiCelebracion(res.nuevaRacha);
    } else {
      Toast.fire({
        icon: 'info',
        title: 'Hábito Reabierto',
        text: `${actividad.nombre_actividad} marcado como pendiente`
      });
    }
  };

  const handleAbrirAvanceCuantitativo = (e: React.MouseEvent) => {
    e.stopPropagation();

    const uMed = actividad.unidad_medida || 'unidades';
    const valAcum = actividad.valor_acumulado_actual || 0;
    const metaTot = actividad.meta_objetivo_total || 0;
    const rescMin = actividad.nivel_rescate_minimo || 0;
    const metaDia = actividad.meta_diaria_estandar || 0;

    Swal.fire({
      title: 'Registrar Avance Cuantitativo',
      background: '#0D1526',
      color: '#f8fafc',
      html: `
        <div class="text-left text-xs space-y-2 mb-3 text-slate-300">
          <p><strong>Meta:</strong> ${actividad.nombre_actividad}</p>
          <p><strong>Acumulado actual:</strong> <span class="font-mono font-bold text-cyan-400">${valAcum} ${uMed}</span> ${metaTot > 0 ? `(de ${metaTot})` : ''}</p>
          ${rescMin > 0 ? `<p class="text-amber-400"><strong>Rescate mínimo de racha:</strong> ≥ ${rescMin} ${uMed}</p>` : ''}
          ${metaDia > 0 ? `<p class="text-slate-400"><strong>Meta diaria estándar:</strong> ${metaDia} ${uMed}</p>` : ''}
        </div>
        <input type="number" step="any" min="0" id="swal-inp-avance" class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400" placeholder="Cantidad de ${uMed}">
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0891b2',
      preConfirm: () => {
        const input = document.getElementById('swal-inp-avance') as HTMLInputElement | null;
        const val = input ? parseFloat(input.value) : NaN;
        if (isNaN(val) || val <= 0) {
          Swal.showValidationMessage('Ingresa un valor numérico válido mayor a 0');
          return false;
        }
        return val;
      }
    }).then(async (result) => {
      if (result.isConfirmed && typeof result.value === 'number') {
        const val = result.value;
        const res = await onRegistrarAvance(actividad, val);

        if (res.rachaRescatada) {
          lanzarConfettiCelebracion(res.actividadActualizada.racha_actual);
          Swal.fire({
            icon: 'success',
            title: '¡Racha Rescatada!',
            text: `Has alcanzado el mínimo requerido (≥ ${rescMin} ${uMed}). Racha actual: ${res.actividadActualizada.racha_actual} días`,
            timer: 2200,
            showConfirmButton: false,
            background: '#0D1526',
            color: '#f8fafc'
          });
        }
      }
    });
  };

  // Cálculo de avance cuantitativo
  const metaTotal = actividad.meta_objetivo_total || 0;
  const valorAcum = actividad.valor_acumulado_actual || 0;
  const pctAvance = metaTotal > 0 ? Math.min(100, Math.round((valorAcum / metaTotal) * 100)) : 0;
  const rescateMin = actividad.nivel_rescate_minimo || 0;

  return (
    <div
      className={`portal-surface p-3 space-y-2.5 transition-all duration-200 border rounded-xl ${
        esCompletada
          ? 'opacity-75 border-slate-800/40 bg-[#0A101D]'
          : 'border-slate-800/40 hover:border-slate-700 bg-[#0D1526]'
      }`}
    >
      {/* Cabecera de la Tarjeta */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.badgeClase}`}>
            <span>{renderIconoCategoriaVida(catConfig.icono, "w-3 h-3")}</span>
            <span>{catConfig.nombre}</span>
          </span>

          {diasMora > 0 && !esCompletada && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1"
              title={`Hábito con retraso de ${diasMora} días`}
            >
              ⚠️ En mora ({diasMora}d)
            </span>
          )}

          {esHabitual && actividad.frecuencia_ciclo && actividad.frecuencia_ciclo !== 'DIARIA' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
              {actividad.frecuencia_ciclo}
            </span>
          )}
        </div>

        {/* Píldora de Racha */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {racha > 0 && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                racha >= 7
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
              }`}
              title={`Racha consecutiva de ${racha} días`}
            >
              <Flame className={`w-3 h-3 ${racha >= 7 ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
              <span className="font-mono tabular-nums">{racha} d</span>
            </span>
          )}

          <BadgeNotasVinculadas
            codigo={actividad.codigo_legado}
            tipo="HABITO"
            tituloEntidad={actividad.nombre_actividad}
          />

          {onEditar && (
            <button
              type="button"
              onClick={handleSolicitarEditar}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition active:scale-90 cursor-pointer"
              title="Editar actividad (Modal Flow)"
            >
              <Pencil className="w-3 h-3" strokeWidth={1.75} />
            </button>
          )}

          {onEliminar && (
            <button
              type="button"
              onClick={handleSolicitarEliminar}
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition active:scale-90 cursor-pointer"
              title="Eliminar actividad"
            >
              <Trash2 className="w-3 h-3" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Cuerpo Principal: Checkbox y Título */}
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={handleToggleCheck}
          className={`w-5 h-5 mt-0.5 rounded-full border-2 transition-all duration-150 flex items-center justify-center shrink-0 active:scale-75 group/chk focus:outline-none ${
            esCompletada
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-500 text-white shadow-xs ring-2 ring-emerald-500/20'
              : 'border-slate-600 hover:border-emerald-400 hover:ring-4 hover:ring-emerald-500/15 text-transparent bg-slate-800/60'
          }`}
          title={esCompletada ? 'Marcar como pendiente' : 'Marcar como cumplido'}
        >
          <Check className={`w-3.5 h-3.5 stroke-[3] transition-transform duration-150 ${esCompletada ? 'scale-100' : 'scale-50 group-hover/chk:scale-100'}`} />
        </button>

        <h4
          onClick={handleSolicitarEditar}
          className={`text-xs sm:text-sm font-semibold leading-snug flex-1 select-none transition-colors duration-150 ${
            esCompletada ? 'line-through text-slate-500' : 'text-slate-100'
          } ${onEditar ? 'cursor-pointer hover:text-emerald-300' : ''}`}
          title={onEditar ? `${actividad.nombre_actividad} (Click para editar)` : actividad.nombre_actividad}
        >
          {actividad.nombre_actividad}
        </h4>
      </div>

      {/* Subtareas / Checklist Procedural */}
      {subtareas && subtareas.length > 0 && (
        <ListaSubtareas
          idPadre={actividad.codigo_legado}
          pasos={subtareas}
          onTogglePaso={onToggleSubtarea}
        />
      )}

      {/* Barra de Avance Cuantitativo (Fase 4.8) */}
      {(metaTotal > 0 || valorAcum > 0 || actividad.meta_macro_nombre) && (
        <div className="space-y-1.5 p-2 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-[11px]">
          <div className="flex items-center justify-between gap-1 flex-wrap font-mono">
            <span className="font-bold text-cyan-200 truncate" title={actividad.meta_macro_nombre || 'Meta'}>
              {actividad.meta_macro_nombre || 'Meta Cuantificable'}
            </span>
            <span className="font-bold text-cyan-300 tabular-nums">
              {valorAcum}{metaTotal > 0 ? ` / ${metaTotal}` : ''} {actividad.unidad_medida || ''}
            </span>
          </div>

          {metaTotal > 0 && (
            <div className="w-full bg-cyan-950/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-teal-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${pctAvance}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-1 pt-0.5">
            {rescateMin > 0 && (
              <span className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded-md bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 font-semibold">
                Rescate: ≥ {rescateMin} {actividad.unidad_medida}
              </span>
            )}

            <button
              type="button"
              onClick={handleAbrirAvanceCuantitativo}
              className="ml-auto px-2 py-0.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] shadow-xs transition active:scale-95 flex items-center gap-1"
              title="Registrar avance cuantitativo"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Avance</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer de la Tarjeta */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          {esCompletada ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono tabular-nums">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
              <span>Próxima: {actividad.proxima_fecha_programada || 'Mañana'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
              <Calendar className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
              <span>
                {esRutinaria && (actividad.proxima_fecha_programada || actividad.fecha_programada > hoyStr)
                  ? `Próx: ${actividad.proxima_fecha_programada || actividad.fecha_programada}`
                  : actividad.fecha_programada}
              </span>
            </span>
          )}

          {actividad.hora_inicio && (
            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{actividad.hora_inicio}</span>
            </span>
          )}
        </div>

        {actividad.monto_gasto_asociado && actividad.monto_gasto_asociado > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 font-mono tabular-nums font-bold">
            <DollarSign className="w-3 h-3" />
            <span>S/ {actividad.monto_gasto_asociado.toFixed(2)}</span>
          </span>
        )}
      </div>

      {/* Modal de Alcance de Recurrencia */}
      <ModalAlcanceRecurrencia
        isOpen={modalAlcanceAbierto}
        accion={accionAlcance}
        tituloActividad={actividad.nombre_actividad}
        fechaActual={actividad.fecha_programada}
        onSeleccionarAlcance={handleSeleccionarAlcance}
        onClose={() => setModalAlcanceAbierto(false)}
      />
    </div>
  );
};
