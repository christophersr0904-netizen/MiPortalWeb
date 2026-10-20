import React, { useState, useRef } from 'react';
import type { TipoEntidadVinculable, NotaRecord } from '../../types';
import { useMapaNotasVinculadas } from '../../hooks/useNotasVinculadas';
import { PopoverPreviewNotas } from './PopoverPreviewNotas';
import { ModalVincularEntidades } from './ModalVincularEntidades';
import { EditorNotaModal } from './EditorNotaModal';
import { FileText } from 'lucide-react';

interface BadgeNotasVinculadasProps {
  codigo: string;
  tipo: TipoEntidadVinculable;
  tituloEntidad?: string;
  onAbrirNota?: (nota: NotaRecord) => void;
  className?: string;
}

export const BadgeNotasVinculadas: React.FC<BadgeNotasVinculadasProps> = ({
  codigo,
  tipo,
  tituloEntidad,
  onAbrirNota,
  className = ''
}) => {
  const mapaNotas = useMapaNotasVinculadas();
  const notas = mapaNotas.get(codigo?.trim() || '') || [];

  const [popoverAbierto, setPopoverAbierto] = useState(false);
  const [modalVincularAbierto, setModalVincularAbierto] = useState(false);
  const [notaParaEditar, setNotaParaEditar] = useState<NotaRecord | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (notas.length > 0) {
      timerRef.current = setTimeout(() => {
        setPopoverAbierto(true);
      }, 150); // 150ms delay canónico
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPopoverAbierto(false);
    }, 250); // margen para interactuar con el popover
  };

  const handleClickBadge = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notas.length > 0) {
      setPopoverAbierto(!popoverAbierto);
    } else {
      setModalVincularAbierto(true);
    }
  };

  const handleAbrirNotaInterno = (nota: NotaRecord) => {
    if (onAbrirNota) {
      onAbrirNota(nota);
    } else {
      setNotaParaEditar(nota);
    }
  };

  if (notas.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleClickBadge}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-semibold bg-sky-950/50 hover:bg-sky-900/60 text-sky-400 hover:text-sky-300 border border-sky-800/60 hover:border-sky-500/80 transition shadow-2xs cursor-pointer active:scale-95"
        title={`${notas.length} nota(s) vinculada(s) a ${codigo}. Pasa el mouse para ver extracto.`}
      >
        <FileText className="w-3 h-3 shrink-0" strokeWidth={1.75} />
        <span>{notas.length}</span>
      </button>

      {/* Popover Flotante de Previsualización */}
      {popoverAbierto && notas.length > 0 && (
        <div className="absolute left-0 bottom-full mb-2 z-[9999]">
          <PopoverPreviewNotas
            codigoEntidad={codigo}
            tipoEntidad={tipo}
            tituloEntidad={tituloEntidad}
            notas={notas}
            onAbrirNota={handleAbrirNotaInterno}
            onAbrirModalVincular={() => {
              setPopoverAbierto(false);
              setModalVincularAbierto(true);
            }}
            onCerrar={() => setPopoverAbierto(false)}
          />
        </div>
      )}

      {/* Modal de Vinculación */}
      <ModalVincularEntidades
        isOpen={modalVincularAbierto}
        onClose={() => setModalVincularAbierto(false)}
        codigoEntidad={codigo}
        tipoEntidad={tipo}
        tituloEntidad={tituloEntidad}
      />

      {/* Editor Modal de Respaldo */}
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
