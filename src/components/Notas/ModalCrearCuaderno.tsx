import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Briefcase,
  Code,
  Sparkles,
  Heart,
  Bookmark,
  Compass,
  Folder,
  Terminal,
  Coffee,
  Target,
  Archive,
  type LucideIcon
} from 'lucide-react';
import type { CuadernoMeta } from '../../types';

export const CATALOGO_ICONOS_CUADERNO: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'Folder', label: 'Carpeta', icon: Folder },
  { id: 'BookOpen', label: 'Cuaderno', icon: BookOpen },
  { id: 'Briefcase', label: 'Trabajo', icon: Briefcase },
  { id: 'Code', label: 'Código', icon: Code },
  { id: 'Terminal', label: 'Terminal', icon: Terminal },
  { id: 'Sparkles', label: 'Ideas', icon: Sparkles },
  { id: 'Target', label: 'Objetivos', icon: Target },
  { id: 'Bookmark', label: 'Marcador', icon: Bookmark },
  { id: 'Compass', label: 'Exploración', icon: Compass },
  { id: 'Heart', label: 'Personal', icon: Heart },
  { id: 'Coffee', label: 'Rutina', icon: Coffee },
  { id: 'Archive', label: 'Archivo', icon: Archive }
];

export interface ModalCrearCuadernoProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (datos: { nombre: string; descripcion: string; icono: string; color?: string }) => void;
  nombresExistentes: string[];
  cuadernoEnEdicion?: CuadernoMeta | null;
}

export const ModalCrearCuaderno: React.FC<ModalCrearCuadernoProps> = ({
  isOpen,
  onClose,
  onGuardar,
  nombresExistentes,
  cuadernoEnEdicion = null
}) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [icono, setIcono] = useState('Folder');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (cuadernoEnEdicion) {
        setNombre(cuadernoEnEdicion.nombre || '');
        setDescripcion(cuadernoEnEdicion.descripcion || '');
        setIcono(cuadernoEnEdicion.icono || 'Folder');
      } else {
        setNombre('');
        setDescripcion('');
        setIcono('Folder');
      }
      setError(null);
    }
  }, [isOpen, cuadernoEnEdicion]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError('Ingresa un nombre para el cuaderno');
      return;
    }

    const yaExiste = nombresExistentes.some(
      (n) => n.toLowerCase() === nombreLimpio.toLowerCase() && (!cuadernoEnEdicion || n.toLowerCase() !== cuadernoEnEdicion.nombre.toLowerCase())
    );

    if (yaExiste) {
      setError('Ya existe un cuaderno o block con este nombre');
      return;
    }

    onGuardar({
      nombre: nombreLimpio,
      descripcion: descripcion.trim(),
      icono
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm select-none transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-[#0D1526] border border-slate-800/60 rounded-2xl shadow-cobalt-2 p-5 text-slate-100 flex flex-col gap-4 relative"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <BookOpen className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                {cuadernoEnEdicion ? 'Editar Cuaderno / Block' : 'Nuevo Cuaderno / Block'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Organiza tus notas dentro de un contenedor temático
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-2 sm:p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Campo Nombre */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Nombre del Cuaderno *
            </label>
            <input
              type="text"
              autoFocus
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Ej. Arquitectura, Finanzas, Personal..."
              className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40 transition"
              maxLength={40}
            />
            {error && (
              <p className="text-[11px] text-rose-400 font-medium pt-0.5">{error}</p>
            )}
          </div>

          {/* Campo Descripción */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Descripción o Propósito (Opcional)
            </label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Breve propósito de este cuaderno (ej. Decisiones técnicas y notas de arquitectura)"
              className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40 transition resize-none custom-scrollbar"
              maxLength={200}
            />
          </div>

          {/* Selector de Ícono Semántico */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Ícono del Cuaderno
            </label>
            <div className="grid grid-cols-6 gap-1.5 p-2 bg-slate-900/50 border border-slate-800/80 rounded-xl">
              {CATALOGO_ICONOS_CUADERNO.map((item) => {
                const IconComponent = item.icon;
                const seleccionado = icono === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcono(item.id)}
                    title={item.label}
                    className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                      seleccionado
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-xs scale-105'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nombre.trim()}
              className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {cuadernoEnEdicion ? 'Guardar Cambios' : 'Crear Cuaderno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

