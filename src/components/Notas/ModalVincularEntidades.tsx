import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { NotaRecord, VinculoEntidad, TipoEntidadVinculable } from '../../types';
import { vincularNotaAEntidad, crearNotaConVinculo } from '../../hooks/useNotasVinculadas';
import {
  X,
  Search,
  Link2,
  Plus,
  FolderKanban,
  CheckSquare,
  Flame,
  DollarSign,
  Lightbulb,
  Check
} from 'lucide-react';
import Swal from 'sweetalert2';

interface ModalVincularEntidadesProps {
  isOpen: boolean;
  onClose: () => void;
  // Modo A: Abierto desde una tarjeta de entidad (para vincularle notas)
  codigoEntidad?: string;
  tipoEntidad?: TipoEntidadVinculable;
  tituloEntidad?: string;
  // Modo B: Abierto desde EditorNotaModal (para asociar entidades a una nota)
  enlacesActuales?: VinculoEntidad[];
  onGuardarEnlaces?: (nuevosEnlaces: VinculoEntidad[]) => void;
  notaId?: string;
}

type TabEntidad = 'PROYECTO' | 'TAREA' | 'HABITO' | 'GASTO' | 'INGRESO' | 'IDEA';

export const ModalVincularEntidades: React.FC<ModalVincularEntidadesProps> = ({
  isOpen,
  onClose,
  codigoEntidad,
  tipoEntidad,
  tituloEntidad,
  enlacesActuales,
  onGuardarEnlaces
}) => {
  // Estado para Modo A: Vincular nota existente o nueva a una tarjeta
  const [modoCrearNueva, setModoCrearNueva] = useState(false);
  const [nuevoTituloNota, setNuevoTituloNota] = useState('');
  const [nuevoMarkdown, setNuevoMarkdown] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Estado para Modo B: Seleccionar entidades desde EditorNotaModal
  const [tabActiva, setTabActiva] = useState<TabEntidad>('TAREA');
  const [seleccionadosLocal, setSeleccionadosLocal] = useState<VinculoEntidad[]>(
    enlacesActuales || []
  );

  // Queries reactivos a Dexie
  const notasRaw = useLiveQuery(() => db.notas.toArray(), []) ?? [];
  const proyectosRaw = useLiveQuery(() => db.proyectos.toArray(), []) ?? [];
  const tareasRaw = useLiveQuery(() => db.tareas.toArray(), []) ?? [];
  const actividadesRaw = useLiveQuery(() => db.actividades_personales.toArray(), []) ?? [];
  const gastosRaw = useLiveQuery(() => db.gastos.toArray(), []) ?? [];
  const ingresosRaw = useLiveQuery(() => db.ingresos.toArray(), []) ?? [];
  const ideasRaw = useLiveQuery(() => db.ideas.toArray(), []) ?? [];

  const esModoEntidad = Boolean(codigoEntidad && tipoEntidad);

  // Lista filtrada de notas para Modo A
  const notasFiltradas = useMemo(() => {
    if (!esModoEntidad) return [];
    const q = busqueda.toLowerCase().trim();
    return notasRaw.filter((n) => {
      // Excluir notas que ya estén vinculadas a este código
      const yaVinculada = n.enlaces_entidades_json?.some(
        (e) => e.codigo.trim() === codigoEntidad?.trim()
      );
      if (yaVinculada) return false;
      if (!q) return true;
      return (
        (n.titulo || '').toLowerCase().includes(q) ||
        (n.codigo_legado || '').toLowerCase().includes(q) ||
        (n.contenido_markdown || '').toLowerCase().includes(q)
      );
    });
  }, [notasRaw, codigoEntidad, busqueda, esModoEntidad]);

  // Manejo de Vinculación en Modo A
  const handleVincularNotaExistente = async (nota: NotaRecord) => {
    if (!codigoEntidad || !tipoEntidad) return;

    await vincularNotaAEntidad(nota.id, {
      tipo: tipoEntidad,
      codigo: codigoEntidad,
      titulo: tituloEntidad || codigoEntidad
    });

    Swal.fire({
      icon: 'success',
      title: 'Nota Vinculada',
      text: `Se asoció "${nota.titulo}" a ${codigoEntidad}.`,
      timer: 1500,
      showConfirmButton: false,
      background: '#0D1526',
      color: '#f8fafc'
    });

    onClose();
  };

  const handleCrearYNuevoVincular = async () => {
    if (!nuevoTituloNota.trim() || !codigoEntidad || !tipoEntidad) return;

    await crearNotaConVinculo(
      {
        titulo: nuevoTituloNota.trim(),
        contenido_markdown: nuevoMarkdown.trim()
      },
      {
        tipo: tipoEntidad,
        codigo: codigoEntidad,
        titulo: tituloEntidad || codigoEntidad
      }
    );

    Swal.fire({
      icon: 'success',
      title: 'Nota Creada y Vinculada',
      text: `Se creó la nota y se vinculó exitosamente a ${codigoEntidad}.`,
      timer: 1800,
      showConfirmButton: false,
      background: '#0D1526',
      color: '#f8fafc'
    });

    setModoCrearNueva(false);
    setNuevoTituloNota('');
    setNuevoMarkdown('');
    onClose();
  };

  // Manejo de Toggle en Modo B (EditorNotaModal)
  const handleToggleSeleccion = (item: { tipo: TipoEntidadVinculable; codigo: string; titulo: string; id_entidad?: string }) => {
    setSeleccionadosLocal((prev) => {
      const existe = prev.some((p) => p.codigo === item.codigo);
      if (existe) {
        return prev.filter((p) => p.codigo !== item.codigo);
      }
      return [...prev, item];
    });
  };

  const handleGuardarModoB = () => {
    if (onGuardarEnlaces) {
      onGuardarEnlaces(seleccionadosLocal);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0D1526] border border-slate-800/80 rounded-2xl shadow-cobalt-3 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-5 py-3.5 border-b border-slate-800/70 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-sky-400" strokeWidth={1.75} />
            <h4 className="font-semibold text-slate-100 text-sm">
              {esModoEntidad
                ? `Vincular Nota a ${codigoEntidad}`
                : 'Vincular Entidades a la Nota'}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CUERPO MODO A: Vincular nota a una entidad específica */}
        {esModoEntidad ? (
          <div className="p-4 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4">
            {/* Toggle Crear vs Seleccionar Existente */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setModoCrearNueva(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  !modoCrearNueva
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Vincular Nota Existente
              </button>
              <button
                type="button"
                onClick={() => setModoCrearNueva(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  modoCrearNueva
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Nueva Nota Vinculada</span>
              </button>
            </div>

            {modoCrearNueva ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Título de la Nueva Nota
                  </label>
                  <input
                    type="text"
                    value={nuevoTituloNota}
                    onChange={(e) => setNuevoTituloNota(e.target.value)}
                    placeholder={`Ej. Minuta técnica de ${codigoEntidad}`}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Contenido / Apunte Inicial (Markdown opcional)
                  </label>
                  <textarea
                    rows={4}
                    value={nuevoMarkdown}
                    onChange={(e) => setNuevoMarkdown(e.target.value)}
                    placeholder="Escribe aquí los detalles, checklist o acuerdos..."
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModoCrearNueva(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCrearYNuevoVincular}
                    disabled={!nuevoTituloNota.trim()}
                    className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
                  >
                    Crear y Vincular
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                {/* Buscador */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar notas por título o palabra clave..."
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Lista de Notas Disponibles */}
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {notasFiltradas.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No se encontraron notas disponibles para vincular.
                    </div>
                  ) : (
                    notasFiltradas.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleVincularNotaExistente(n)}
                        className="p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800/60 hover:border-sky-500/40 transition cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[10px] text-slate-400">
                              {n.codigo_legado}
                            </span>
                            <span className="font-semibold text-xs text-slate-200 group-hover:text-sky-300 truncate">
                              {n.titulo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {n.contenido_markdown || 'Sin contenido de texto.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10.5px] font-bold shrink-0 group-hover:bg-sky-500 group-hover:text-white transition"
                        >
                          Vincular
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CUERPO MODO B: Seleccionar entidades para vincular a la nota (Editor) */
          <div className="p-4 flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden">
            {/* Pestañas de Tipo de Entidad */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2 shrink-0">
              {(
                [
                  { id: 'TAREA', label: 'Tareas', icon: CheckSquare },
                  { id: 'HABITO', label: 'Hábitos', icon: Flame },
                  { id: 'PROYECTO', label: 'Proyectos', icon: FolderKanban },
                  { id: 'GASTO', label: 'Gastos', icon: DollarSign },
                  { id: 'INGRESO', label: 'Ingresos', icon: DollarSign },
                  { id: 'IDEA', label: 'Ideas', icon: Lightbulb }
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTabActiva(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      tabActiva === tab.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Buscador */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por código o descripción..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Lista Dinámica de Entidades */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
              {(() => {
                const q = busqueda.toLowerCase().trim();
                let items: { tipo: TipoEntidadVinculable; codigo: string; titulo: string; id_entidad?: string }[] = [];

                if (tabActiva === 'TAREA') {
                  items = tareasRaw.map((t) => ({
                    tipo: 'TAREA',
                    codigo: t.codigo_legado,
                    titulo: t.nombre_tarea_actividad || 'Tarea sin nombre',
                    id_entidad: t.id
                  }));
                } else if (tabActiva === 'HABITO') {
                  items = actividadesRaw.map((a) => ({
                    tipo: 'HABITO',
                    codigo: a.codigo_legado,
                    titulo: a.nombre_actividad || 'Hábito sin nombre',
                    id_entidad: a.id
                  }));
                } else if (tabActiva === 'PROYECTO') {
                  items = proyectosRaw.map((p) => ({
                    tipo: 'PROYECTO',
                    codigo: p.codigo_legado,
                    titulo: p.nombre_proyecto || (p as any).nombre || 'Proyecto sin nombre',
                    id_entidad: p.id
                  }));
                } else if (tabActiva === 'GASTO') {
                  items = gastosRaw.map((g) => ({
                    tipo: 'GASTO',
                    codigo: g.codigo_legado,
                    titulo: g.descripcion_gasto || 'Gasto',
                    id_entidad: g.id
                  }));
                } else if (tabActiva === 'INGRESO') {
                  items = ingresosRaw.map((i) => ({
                    tipo: 'INGRESO',
                    codigo: i.codigo_legado,
                    titulo: i.descripcion_ingreso || 'Ingreso',
                    id_entidad: i.id
                  }));
                } else if (tabActiva === 'IDEA') {
                  items = ideasRaw.map((id) => ({
                    tipo: 'IDEA',
                    codigo: id.codigo_legado,
                    titulo: id.enunciado_idea || 'Idea',
                    id_entidad: id.id
                  }));
                }

                const filtrados = items.filter(
                  (it) =>
                    !q ||
                    it.codigo.toLowerCase().includes(q) ||
                    it.titulo.toLowerCase().includes(q)
                );

                if (filtrados.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No se encontraron elementos en esta categoría.
                    </div>
                  );
                }

                return filtrados.map((it) => {
                  const seleccionado = seleccionadosLocal.some(
                    (s) => s.codigo === it.codigo
                  );

                  return (
                    <div
                      key={it.codigo}
                      onClick={() => handleToggleSeleccion(it)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        seleccionado
                          ? 'bg-sky-500/15 border-sky-500/40 text-slate-100'
                          : 'bg-slate-900/50 hover:bg-slate-800/60 border-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-sky-400 font-bold">
                            {it.codigo}
                          </span>
                          <span className="font-semibold text-xs truncate">
                            {it.titulo}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                          seleccionado
                            ? 'bg-sky-500 border-sky-400 text-white'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        {seleccionado && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer con entidades seleccionadas y botón Guardar */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {seleccionadosLocal.length} entidad(es) seleccionada(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarModoB}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
                >
                  Aplicar Vínculos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
