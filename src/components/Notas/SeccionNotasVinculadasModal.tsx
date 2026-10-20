import React, { useState } from 'react';
import type { TipoEntidadVinculable, NotaRecord } from '../../types';
import { useNotasDeEntidad, desvincularNotaDeEntidad } from '../../hooks/useNotasVinculadas';
import { ModalVincularEntidades } from './ModalVincularEntidades';
import { EditorNotaModal } from './EditorNotaModal';
import { FileText, Plus, ExternalLink, Unlink, BookOpen } from 'lucide-react';
import Swal from 'sweetalert2';

interface SeccionNotasVinculadasModalProps {
  codigoEntidad: string;
  tipoEntidad: TipoEntidadVinculable;
  tituloEntidad?: string;
  className?: string;
}

/**
 * Limpia la sintaxis markdown para obtener un extracto legible de 1 línea.
 */
function extraerTextoPlano(md?: string, maxLineas = 1): string {
  if (!md) return 'Nota sin contenido de texto.';
  const limpio = md
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .trim();

  const lineas = limpio.split('\n').filter((l) => l.trim().length > 0);
  return lineas.slice(0, maxLineas).join(' ') || 'Nota sin contenido de texto.';
}

export const SeccionNotasVinculadasModal: React.FC<SeccionNotasVinculadasModalProps> = ({
  codigoEntidad,
  tipoEntidad,
  tituloEntidad = '',
  className = ''
}) => {
  const [modalVincularAbierto, setModalVincularAbierto] = useState(false);
  const [notaParaEditar, setNotaParaEditar] = useState<NotaRecord | null>(null);

  const notas = useNotasDeEntidad(codigoEntidad);

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
    }
  };

  // Si aún no hay código de entidad generado (ej. creación de nueva tarea/hábito)
  if (!codigoEntidad) {
    return (
      <div className={`p-3 bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg text-xs font-black">
            <FileText className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Notas Vinculadas</h4>
        </div>
        <p className="text-[11px] text-slate-400 italic">
          Guarda primero el registro para habilitar la vinculación de notas.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-3.5 bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 ${className}`}>
      {/* Cabecera de la Sección */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg text-xs font-black">
            <FileText className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
              <span>Notas Vinculadas</span>
              <span className="font-mono tabular-nums text-[10px] font-bold px-2 py-0.2 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/40">
                {notas.length}
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">Documentación, actas o minutas asociadas</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalVincularAbierto(true)}
          className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
          title="Vincular nota existente o redactar nueva"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>+ Nota</span>
        </button>
      </div>

      {/* Lista de Notas o Estado Vacío */}
      {notas.length === 0 ? (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-400">
          <span>No hay notas vinculadas a este registro.</span>
          <button
            type="button"
            onClick={() => setModalVincularAbierto(true)}
            className="text-sky-400 hover:text-sky-300 font-semibold underline text-[11px] cursor-pointer"
          >
            + Vincular Nota
          </button>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {notas.map((nota) => (
            <div
              key={nota.id}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 transition flex items-start justify-between gap-2 group"
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => setNotaParaEditar(nota)}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] text-slate-400 font-bold shrink-0">
                    {nota.codigo_legado}
                  </span>
                  <h5 className="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-sky-400 transition truncate max-w-[240px]">
                    {nota.titulo}
                  </h5>
                  {nota.block_nombre && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                      <BookOpen className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{nota.block_nombre}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {extraerTextoPlano(nota.contenido_markdown, 1)}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                <button
                  type="button"
                  onClick={() => setNotaParaEditar(nota)}
                  className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Abrir editor completo de la nota"
                >
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDesvincular(e, nota)}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Desvincular nota"
                >
                  <Unlink className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Vinculación */}
      <ModalVincularEntidades
        isOpen={modalVincularAbierto}
        onClose={() => setModalVincularAbierto(false)}
        codigoEntidad={codigoEntidad}
        tipoEntidad={tipoEntidad}
        tituloEntidad={tituloEntidad}
      />

      {/* Editor Modal de la Nota */}
      {notaParaEditar && (
        <EditorNotaModal
          isOpen={Boolean(notaParaEditar)}
          nota={notaParaEditar}
          onClose={() => setNotaParaEditar(null)}
        />
      )}
    </div>
  );
};
