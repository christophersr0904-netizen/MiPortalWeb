import React, { useState, useEffect } from 'react';
import type { NotaRecord, TipoEntidadVinculable } from '../../types';
import { desvincularNotaDeEntidad } from '../../hooks/useNotasVinculadas';
import {
  FileText,
  ExternalLink,
  Unlink,
  CheckSquare,
  DollarSign,
  Plus,
  BookOpen,
  X
} from 'lucide-react';
import Swal from 'sweetalert2';

interface PopoverPreviewNotasProps {
  codigoEntidad: string;
  tipoEntidad: TipoEntidadVinculable;
  tituloEntidad?: string;
  notas: NotaRecord[];
  onAbrirNota: (nota: NotaRecord) => void;
  onAbrirModalVincular: () => void;
  onCerrar: () => void;
}

/**
 * Limpia la sintaxis markdown para obtener un extracto legible de 2 a 3 líneas.
 */
function extraerTextoPlano(md: string, maxLineas = 3): string {
  if (!md) return 'Nota sin contenido de texto.';
  const limpio = md
    .replace(/^#+\s+/gm, '') // Títulos
    .replace(/\*\*(.*?)\*\*/g, '$1') // Negritas
    .replace(/\*(.*?)\*/g, '$1') // Cursivas
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Enlaces
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Código inline
    .replace(/^>\s+/gm, '') // Citas
    .replace(/^[-*+]\s+/gm, '') // Listas
    .trim();

  const lineas = limpio.split('\n').filter((l) => l.trim().length > 0);
  return lineas.slice(0, maxLineas).join(' ') || 'Nota sin contenido de texto.';
}

export const PopoverPreviewNotas: React.FC<PopoverPreviewNotasProps> = ({
  codigoEntidad,
  notas,
  onAbrirNota,
  onAbrirModalVincular,
  onCerrar
}) => {
  const [notaActivaId, setNotaActivaId] = useState<string>(notas[0]?.id || '');

  useEffect(() => {
    if (!notas.some((n) => n.id === notaActivaId) && notas.length > 0) {
      setNotaActivaId(notas[notas.length - 1].id);
    }
  }, [notas, notaActivaId]);

  const notaActiva = notas.find((n) => n.id === notaActivaId) || notas[0];

  const handleDesvincular = async (e: React.MouseEvent, nota: NotaRecord) => {
    e.stopPropagation();
    const confirm = await Swal.fire({
      title: '¿Desvincular nota?',
      text: `Se removerá el enlace entre "${nota.titulo}" y "${codigoEntidad}". La nota no se eliminará.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, desvincular',
      cancelButtonText: 'Cancelar',
      background: '#0D1526',
      color: '#f8fafc',
      confirmButtonColor: '#f43f5e',
      cancelButtonColor: '#334155'
    });

    if (confirm.isConfirmed) {
      await desvincularNotaDeEntidad(nota.id, codigoEntidad);
      if (notas.length <= 1) {
        onCerrar();
      }
    }
  };

  if (!notaActiva) return null;

  const totalChecklist = notaActiva.checklists_json?.length || 0;
  const completadasChecklist = notaActiva.checklists_json?.filter((c) => c.completado).length || 0;
  const tieneWishlist = Boolean(
    notaActiva.wishlist_json &&
    typeof notaActiva.wishlist_json.costoEstimado === 'number' &&
    notaActiva.wishlist_json.costoEstimado > 0
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-80 sm:w-96 p-3.5 bg-[#0D1526] border border-slate-800/90 rounded-2xl shadow-cobalt-3 text-slate-200 text-xs animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2.5 z-[100]"
    >
      {/* Cabecera del Popover */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/70 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
          <span className="font-semibold text-slate-100 truncate">
            Notas Vinculadas
          </span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums font-bold bg-sky-950/60 text-sky-300 border border-sky-800/40">
            {notas.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onAbrirModalVincular}
            className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition cursor-pointer"
            title="Vincular otra nota"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
            title="Cerrar vista previa"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Selector de pestañas si hay más de 1 nota */}
      {notas.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {notas.map((n, idx) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setNotaActivaId(n.id)}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-medium transition shrink-0 cursor-pointer flex items-center gap-1 ${
                n.id === notaActiva.id
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700/40'
              }`}
            >
              <span>Nota {idx + 1}:</span>
              <span className="truncate max-w-[90px]">{n.titulo}</span>
            </button>
          ))}
        </div>
      )}

      {/* Contenido de la Nota Activa */}
      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/50 space-y-2">
        <div className="flex items-center justify-between gap-1.5">
          <h5 className="font-semibold text-slate-100 text-xs truncate" title={notaActiva.titulo}>
            {notaActiva.titulo}
          </h5>
          {notaActiva.block_nombre && (
            <span className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
              <BookOpen className="w-2.5 h-2.5 text-indigo-400" />
              <span>{notaActiva.block_nombre}</span>
            </span>
          )}
        </div>

        {/* Extracto de texto */}
        <p className="text-[11px] text-slate-300/90 leading-relaxed line-clamp-3">
          {extraerTextoPlano(notaActiva.contenido_markdown)}
        </p>

        {/* Micro-resumen Checklist y Wishlist si tiene */}
        {(totalChecklist > 0 || tieneWishlist) && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 flex-wrap text-[10px]">
            {totalChecklist > 0 && (
              <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-400">
                <CheckSquare className="w-3 h-3 text-emerald-400" />
                <span>
                  {completadasChecklist}/{totalChecklist} pasos
                </span>
              </span>
            )}

            {tieneWishlist && (
              <span className="inline-flex items-center gap-1 font-mono tabular-nums text-emerald-400 font-bold">
                <DollarSign className="w-3 h-3" />
                <span>
                  S/ {(notaActiva.wishlist_json?.costoEstimado ?? 0).toFixed(2)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Botonera de Acciones */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            onAbrirNota(notaActiva);
            onCerrar();
          }}
          className="flex-1 py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Abrir Editor Completo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onAbrirModalVincular();
          }}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-sky-950/40 text-slate-400 hover:text-sky-300 border border-slate-700/60 hover:border-sky-800/50 transition cursor-pointer"
          title="Vincular otra nota a esta entidad"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={(e) => handleDesvincular(e, notaActiva)}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-800/50 transition cursor-pointer"
          title="Desvincular esta nota"
        >
          <Unlink className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};
