import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placeAbove: boolean;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const actualizarCoordenadas = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setPopoverAbierto(false);
      return;
    }

    const popoverWidth = Math.min(384, window.innerWidth - 24);
    const estimatedHeight = 280;
    const margin = 8;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceAbove >= estimatedHeight + margin || spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12);
    }
    if (left < 12) {
      left = 12;
    }

    const top = placeAbove ? rect.top - margin : rect.bottom + margin;

    setCoords({
      top,
      left,
      placeAbove
    });
  };

  const handleMouseEnter = () => {
    // Si ya hay un modal abierto o en proceso, inhibir hover para erradicar conflictos visuales
    if (notaParaEditar || modalVincularAbierto) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (notas.length > 0) {
      actualizarCoordenadas();
      timerRef.current = setTimeout(() => {
        if (notaParaEditar || modalVincularAbierto) return;
        actualizarCoordenadas();
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

  const handlePopoverMouseEnter = () => {
    if (notaParaEditar || modalVincularAbierto) return;
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handlePopoverMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPopoverAbierto(false);
    }, 250);
  };

  const handleClickBadge = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (notas.length > 0) {
      if (!popoverAbierto) {
        actualizarCoordenadas();
        setPopoverAbierto(true);
      } else {
        setPopoverAbierto(false);
      }
    } else {
      setPopoverAbierto(false);
      setModalVincularAbierto(true);
    }
  };

  const handleAbrirNotaInterno = (nota: NotaRecord) => {
    // 1. Cancelar temporizadores pendientes de hover
    if (timerRef.current) clearTimeout(timerRef.current);
    // 2. Cerrar el popover flotante al instante para purgar cualquier parpadeo
    setPopoverAbierto(false);
    // 3. Abrir el modal centrado global pasando la nota
    if (onAbrirNota) {
      onAbrirNota(nota);
    } else {
      setNotaParaEditar(nota);
    }
  };

  // Listeners para reposicionar en scroll/resize y cerrar al hacer click fuera o Escape
  useEffect(() => {
    if (!popoverAbierto) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setPopoverAbierto(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopoverAbierto(false);
      }
    };

    const handleScrollOrResize = () => {
      actualizarCoordenadas();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [popoverAbierto]);

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
        ref={buttonRef}
        type="button"
        onClick={handleClickBadge}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-semibold bg-sky-950/50 hover:bg-sky-900/60 text-sky-400 hover:text-sky-300 border border-sky-800/60 hover:border-sky-500/80 transition shadow-2xs cursor-pointer active:scale-95"
        title={`${notas.length} nota(s) vinculada(s) a ${codigo}. Pasa el mouse para ver extracto.`}
      >
        <FileText className="w-3 h-3 shrink-0" strokeWidth={1.75} />
        <span>{notas.length}</span>
      </button>

      {/* Popover Flotante de Previsualización montado en Portal para evitar recortes por overflow */}
      {popoverAbierto && notas.length > 0 && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: coords.placeAbove ? 'auto' : `${coords.top}px`,
            bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : 'auto',
            left: `${coords.left}px`,
            zIndex: 99999
          }}
          className="pointer-events-auto select-auto"
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
          onClick={(e) => e.stopPropagation()}
        >
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
        </div>,
        document.body
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
