/**
 * ============================================================================
 * ARCHIVO: src/hooks/useActividadForm.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-REFACTOR-P1-02
 * DESCRIPCIÓN: Custom hook que encapsula el estado reactivo, hidratación,
 *              validaciones, persistencia (Dexie + Calendar + Tombstones)
 *              y lógica de negocio del formulario de actividades/hábitos.
 * ============================================================================
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, registrarTombstone } from '../db/db';
import {
  editarActividadConAlcance,
  eliminarActividadConAlcance
} from '../services/habitosService';
import { crearGasto, actualizarGasto } from '../services/gastosService';
import {
  sincronizarCreacionCalendar,
  obtenerEstadoConexionGoogleCalendar,
  suscribirEstadoGoogleCalendar,
  type EstadoConexionGoogleCalendar
} from '../services/calendarSyncService';
import { syncManager } from '../services/syncManager';
import { generarCodigoCorrelativoSeguro } from '../utils/entityNormalizer';
import { mostrarToastCobalt } from '../utils/toastCobalt';
import {
  vincularHabitoAMetaLocal,
  recalcularProgresoMetaLocal,
  crearMetaRapidaDesdeActividadLocal
} from '../services/metasService';
import { useUndoDelete } from './useUndoDelete';
import {
  CATEGORIAS_VIDA_MAP,
  type ActividadPersonal,
  type CategoriaVida,
  type TipoCompromiso,
  type FrecuenciaCiclo,
  type SubtareaPaso,
  type AlcanceRecurrencia
} from '../types';
import {
  convertirHorasDecimalAString,
  formatFechaIsoLocal
} from '../utils/timeFormatters';
import {
  HeartPulse,
  BookOpen,
  Briefcase,
  Wallet,
  Users,
  Coffee,
  Target
} from 'lucide-react';

export type TipoRecurrenciaOpcion =
  | 'NINGUNA'
  | 'DIARIA'
  | 'DIARIA_LABORAL'
  | 'FIN_SEMANA'
  | 'SEMANAL'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'PERSONALIZADO';

export interface CategoriaConfigItem {
  clave: CategoriaVida;
  nombre: string;
  dotColor: string;
  badgeClase: string;
  icono?: React.ReactNode;
  iconoComp: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

export const CATEGORIAS_FLOW: CategoriaConfigItem[] = [
  {
    clave: 'SALUD_DEPORTE',
    nombre: 'Deporte & Salud',
    dotColor: 'bg-emerald-500',
    badgeClase: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    iconoComp: HeartPulse
  },
  {
    clave: 'DESARROLLO_ESTUDIO',
    nombre: 'Estudio & Mente',
    dotColor: 'bg-blue-500',
    badgeClase: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    iconoComp: BookOpen
  },
  {
    clave: 'LABORAL_HONORARIO',
    nombre: 'Trabajo & Carrera',
    dotColor: 'bg-violet-500',
    badgeClase: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60',
    iconoComp: Briefcase
  },
  {
    clave: 'FINANZAS_TRAMITES',
    nombre: 'Finanzas & Admin',
    dotColor: 'bg-purple-500',
    badgeClase: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    iconoComp: Wallet
  },
  {
    clave: 'SOCIAL_FAMILIA',
    nombre: 'Social & Familia',
    dotColor: 'bg-amber-500',
    badgeClase: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    iconoComp: Users
  },
  {
    clave: 'PERSONAL_DESCANSO',
    nombre: 'Personal & Relax',
    dotColor: 'bg-pink-500',
    badgeClase: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60',
    iconoComp: Coffee
  }
];

export function resolverNombreActividadDefensivo(actividad?: Partial<ActividadPersonal> | null): string {
  if (!actividad) return '';
  return (
    actividad.nombre_actividad ||
    (actividad as any).nombre ||
    (actividad as any).Nombre_Actividad ||
    (actividad as any).Nombre ||
    (actividad as any).titulo ||
    (actividad as any).Titulo ||
    (actividad as any).actividad ||
    (actividad as any).descripcion ||
    (actividad as any).nombre_tarea_actividad ||
    'Actividad sin título'
  );
}

export function resolverNombreColumnaCanonico(
  categoriaVida?: string | null,
  categoriaFallback: CategoriaVida = 'SALUD_DEPORTE'
): string {
  const catKeyUpper = String(categoriaVida || categoriaFallback).toUpperCase().trim();
  return (
    CATEGORIAS_VIDA_MAP[catKeyUpper as CategoriaVida]?.nombre ||
    CATEGORIAS_FLOW.find((c) => c.clave === catKeyUpper)?.nombre ||
    'Salud & Deporte'
  );
}

export type UseActividadFormProps = ModalActividadFlowProps;

export interface ModalActividadFlowProps {
  isOpen: boolean;
  onClose: () => void;
  actividadEditar?: ActividadPersonal | null;
  actividad?: ActividadPersonal | null;
  categoriaInicial?: CategoriaVida;
  alcanceEdicion?: AlcanceRecurrencia;
  onGuardadoExitoso?: (actividad: ActividadPersonal) => void;
  modo?: 'detalle' | 'edicion' | 'creacion';
  soloLectura?: boolean;
}

export function useActividadForm({
  isOpen,
  onClose,
  actividadEditar: actividadEditarProp,
  actividad: actividadProp,
  categoriaInicial = 'SALUD_DEPORTE',
  alcanceEdicion,
  onGuardadoExitoso,
  modo,
  soloLectura = false
}: UseActividadFormProps) {
  const { programarEliminacion } = useUndoDelete();

  // Unificación defensiva del objeto de actividad objetivo
  const actividadEditar = actividadEditarProp || actividadProp || null;
  const esModoDetalle = soloLectura || modo === 'detalle';
  const esEdicionODetalle = Boolean(actividadEditar);

  // Extracción defensiva del nombre
  const nombreDisplay = resolverNombreActividadDefensivo(actividadEditar);

  // Estados base del formulario
  const [titulo, setTitulo] = useState(nombreDisplay);
  const [categoria, setCategoria] = useState<CategoriaVida>(categoriaInicial);
  const [tipoCompromiso, setTipoCompromiso] = useState<TipoCompromiso>('HABITUAL');
  const [prioridad, setPrioridad] = useState<'01_P1_Alta' | '02_P2_Media' | '03_P3_Baja'>('02_P2_Media');
  const [calendarSync, setCalendarSync] = useState<'Sí' | 'No'>('Sí');
  const [notas, setNotas] = useState('');

  // Fecha, Hora, Duración y Recurrencia
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('08:00');
  const [duracionHoras, setDuracionHoras] = useState(0);
  const [duracionStr, setDuracionStr] = useState('0:00');
  const [tipoRecurrencia, setTipoRecurrencia] = useState<TipoRecurrenciaOpcion>('DIARIA');
  const [diasSemana, setDiasSemana] = useState<string[]>(['LU', 'MA', 'MI', 'JU', 'VI']);
  const [intervaloRepeticion, setIntervaloRepeticion] = useState<number>(1);
  const [unidadIntervalo, setUnidadIntervalo] = useState<'dias' | 'semanas' | 'meses'>('semanas');
  const [tieneFechaFin, setTieneFechaFin] = useState<boolean>(false);
  const [fechaFin, setFechaFin] = useState<string>('');

  // Sección Gasto Asociado
  const [mostrarGasto, setMostrarGasto] = useState(false);
  const [tabGasto, setTabGasto] = useState<'NUEVO' | 'VINCULAR'>('NUEVO');
  const [gastoMoneda, setGastoMoneda] = useState<'PEN' | 'USD' | 'EUR'>('PEN');
  const [gastoMonto, setGastoMonto] = useState<string>('');
  const [gastoCategoria, setGastoCategoria] = useState('Personal_Salud');
  const [gastoConcepto, setGastoConcepto] = useState('');
  const [gastoSearch, setGastoSearch] = useState('');
  const [gastoVinculadoId, setGastoVinculadoId] = useState<string | null>(null);

  // Sección Metas OKR / metas_planes
  const [metaMacro, setMetaMacro] = useState('');
  const [metaSeleccionadaId, setMetaSeleccionadaId] = useState<string>('');
  const [metaIdInicial, setMetaIdInicial] = useState<string>('');
  const [modoMetaManual, setModoMetaManual] = useState<boolean>(false);
  const [nombreNuevaMeta, setNombreNuevaMeta] = useState<string>('');
  const [unidadMedida, setUnidadMedida] = useState('');
  const [metaTotal, setMetaTotal] = useState<string>('');
  const [valorAcumulado, setValorAcumulado] = useState<string>('0');
  const [metaDiaria, setMetaDiaria] = useState<string>('');
  const [rescateMinimo, setRescateMinimo] = useState<string>('');

  // Copia rápida del código de actividad
  const [copiado, setCopiado] = useState(false);
  const handleCopiarCodigo = () => {
    const cod = actividadEditar?.codigo_legado;
    if (cod) {
      navigator.clipboard.writeText(cod);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1200);
      mostrarToastCobalt(`Código ${cod} copiado al portapapeles`, 'info');
    }
  };

  // Opciones para selector de categoría/pilar de vida
  const opcionesCategoriasCobalt = useMemo(() => [
    ...CATEGORIAS_FLOW.map((c) => ({
      valor: c.clave,
      etiqueta: c.nombre,
      icono: c.iconoComp
    }))
  ], []);

  // Metas & Planes existentes en Dexie
  const metasDisponibles = useLiveQuery(() => db.metas_planes.toArray(), []) || [];

  const opcionesMetasCobalt = useMemo(() => [
    { valor: '', etiqueta: 'Sin vinculación a metas', subtitulo: 'Hábito independiente', icono: Target },
    ...metasDisponibles.map((m) => ({
      valor: m.id,
      etiqueta: m.nombre_meta,
      badge: m.codigo_legado,
      colorBadge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 font-mono font-bold',
      icono: Target
    }))
  ], [metasDisponibles]);

  // Pasos / Subtareas Procedurales
  const [nuevoPasoTexto, setNuevoPasoTexto] = useState('');
  const [pasosLocales, setPasosLocales] = useState<{ id: string; numero: number; descripcion: string; completado: boolean }[]>([]);
  const [pasosInicialesJson, setPasosInicialesJson] = useState('[]');

  // Estados para selector de alcance diferido al guardar
  const [mostrarModalAlcance, setMostrarModalAlcance] = useState(false);
  const [payloadPendiente, setPayloadPendiente] = useState<ActividadPersonal | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const guardandoRef = useRef(false);
  const [gcalEstado, setGcalEstado] = useState<EstadoConexionGoogleCalendar>(() => obtenerEstadoConexionGoogleCalendar());

  useEffect(() => {
    setGcalEstado(obtenerEstadoConexionGoogleCalendar());
    return suscribirEstadoGoogleCalendar(setGcalEstado);
  }, [isOpen]);

  // Cargar datos en edición o resetear en nuevo
  useEffect(() => {
    if (!isOpen) return;

    if (actividadEditar) {
      setTitulo(nombreDisplay);
      setCategoria(actividadEditar.categoria_vida || categoriaInicial);
      setTipoCompromiso(actividadEditar.tipo_compromiso || 'HABITUAL');
      const prioRaw = (actividadEditar as any).prioridad || (actividadEditar as any).prioridad_eisenhower || '02_P2_Media';
      setPrioridad(prioRaw as '01_P1_Alta' | '02_P2_Media' | '03_P3_Baja');
      setCalendarSync(actividadEditar.agendado_calendar || 'Sí');
      setFecha((actividadEditar.fecha_programada || '').split(/[\sT]/)[0]);
      setHora(actividadEditar.hora_inicio || '08:00');
      const dur = actividadEditar.duracion_horas ?? 0;
      setDuracionHoras(dur);
      setDuracionStr(convertirHorasDecimalAString(dur));

      // Determinar Tipo de Recurrencia Google Style
      const freq = actividadEditar.frecuencia_ciclo;
      const regla = actividadEditar.regla_repeticion || '';

      if (freq === 'NINGUNA' || (!freq && !regla && actividadEditar.tipo_compromiso === 'PUNTUAL')) {
        setTipoRecurrencia('NINGUNA');
      } else if (regla.startsWith('INTERVALO:')) {
        setTipoRecurrencia('PERSONALIZADO');
      } else if (freq === 'DIARIA_LABORAL' || regla === 'L-V') {
        setTipoRecurrencia('DIARIA_LABORAL');
      } else if (freq === 'FIN_SEMANA') {
        setTipoRecurrencia('FIN_SEMANA');
      } else if (freq === 'QUINCENAL') {
        setTipoRecurrencia('QUINCENAL');
      } else if (freq === 'SEMANAL') {
        setTipoRecurrencia('SEMANAL');
      } else if (freq === 'MENSUAL') {
        setTipoRecurrencia('MENSUAL');
      } else if (freq === 'DIARIA') {
        setTipoRecurrencia('DIARIA');
      } else {
        setTipoRecurrencia('DIARIA');
      }

      if (actividadEditar.fecha_fin) {
        setTieneFechaFin(true);
        setFechaFin((actividadEditar.fecha_fin || '').split(/[\sT]/)[0]);
      } else {
        setTieneFechaFin(false);
        setFechaFin('');
      }

      if (regla.startsWith('INTERVALO:')) {
        const parts = regla.split(';')[0].split(':');
        const num = parseInt(parts[1], 10) || 1;
        const u = parts[2]?.toLowerCase();
        const unidad = u === 'dias' ? 'dias' : u === 'meses' ? 'meses' : 'semanas';
        setIntervaloRepeticion(num);
        setUnidadIntervalo(unidad);
      } else {
        setIntervaloRepeticion(1);
        setUnidadIntervalo('semanas');
      }

      if (actividadEditar.regla_repeticion) {
        const rawRegla = actividadEditar.regla_repeticion.includes('DIAS:')
          ? actividadEditar.regla_repeticion.split('DIAS:')[1].split(';')[0]
          : actividadEditar.regla_repeticion;
        const tokens = rawRegla.toUpperCase().split(',').map((t) => t.trim()).filter(Boolean);
        const mapDias: Record<string, string> = {
          'L': 'LU', 'LU': 'LU', 'LUN': 'LU',
          'M': 'MA', 'MA': 'MA', 'MAR': 'MA',
          'X': 'MI', 'MI': 'MI', 'MIE': 'MI', 'MIER': 'MI',
          'J': 'JU', 'JU': 'JU', 'JUE': 'JU',
          'V': 'VI', 'VI': 'VI', 'VIE': 'VI',
          'S': 'SA', 'SA': 'SA', 'SAB': 'SA',
          'D': 'DO', 'DO': 'DO', 'DOM': 'DO'
        };
        const tokensValidos = tokens.map((t) => mapDias[t] || t).filter((t) => ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].includes(t));
        if (tokensValidos.length > 0) {
          setDiasSemana(tokensValidos);
        }
      } else {
        setDiasSemana(['LU', 'MA', 'MI', 'JU', 'VI']);
      }
      setNotas(actividadEditar.notas_checklist || '');
      setMetaMacro(actividadEditar.meta_macro_nombre || '');
      setUnidadMedida(actividadEditar.unidad_medida || '');
      setMetaTotal(actividadEditar.meta_objetivo_total !== undefined ? String(actividadEditar.meta_objetivo_total) : '');
      setValorAcumulado(actividadEditar.valor_acumulado_actual !== undefined ? String(actividadEditar.valor_acumulado_actual) : '0');
      setMetaDiaria(actividadEditar.meta_diaria_estandar !== undefined ? String(actividadEditar.meta_diaria_estandar) : '');
      setRescateMinimo(actividadEditar.nivel_rescate_minimo !== undefined ? String(actividadEditar.nivel_rescate_minimo) : '');

      // Consultar si tiene vínculo activo en habitos_metas_vinculos
      db.habitos_metas_vinculos
        .where('habito_id')
        .equals(actividadEditar.id)
        .first()
        .then((vinc) => {
          if (vinc) {
            setMetaSeleccionadaId(vinc.meta_id);
            setMetaIdInicial(vinc.meta_id);
            setModoMetaManual(false);
          } else if (actividadEditar.meta_macro_nombre) {
            setMetaSeleccionadaId('');
            setMetaIdInicial('');
            setModoMetaManual(true);
          } else {
            setMetaSeleccionadaId('');
            setMetaIdInicial('');
            setModoMetaManual(false);
          }
          setNombreNuevaMeta('');
        });

      if (actividadEditar.monto_gasto_asociado) {
        setGastoMonto(String(actividadEditar.monto_gasto_asociado));
        setMostrarGasto(true);
      }

      // Cargar subtareas desde Dexie (por codigo_legado o id)
      const padreLlaves = [actividadEditar.codigo_legado, actividadEditar.id].filter(Boolean) as string[];
      db.subtareas_pasos
        .where('id_padre_vinculado')
        .anyOf(padreLlaves)
        .sortBy('numero_paso')
        .then((items) => {
          if (items && items.length > 0) {
            const mapped = items.map((it) => ({
              id: it.id,
              numero: it.numero_paso,
              descripcion: it.descripcion_paso,
              completado: it.completado
            }));
            setPasosLocales(mapped);
            setPasosInicialesJson(
              JSON.stringify(
                mapped.map((m) => ({
                  numero: m.numero,
                  descripcion: m.descripcion.trim(),
                  completado: m.completado
                }))
              )
            );
          } else {
            setPasosLocales([]);
            setPasosInicialesJson('[]');
          }
        });
    } else {
      // Valores por defecto para nuevo hábito
      setTitulo('');
      setCategoria(categoriaInicial);
      setTipoCompromiso('HABITUAL');
      setPrioridad('02_P2_Media');
      setCalendarSync('Sí');
      setNotas('');
      const hoy = formatFechaIsoLocal();
      setFecha(hoy);
      setHora('08:00');
      setDuracionHoras(0);
      setDuracionStr('0:00');
      setTipoRecurrencia('DIARIA');
      setDiasSemana(['LU', 'MA', 'MI', 'JU', 'VI']);
      setIntervaloRepeticion(1);
      setUnidadIntervalo('semanas');
      setTieneFechaFin(false);
      setFechaFin('');
      setMostrarGasto(false);
      setGastoMonto('');
      setGastoConcepto('');
      setGastoVinculadoId(null);
      setMetaMacro('');
      setMetaSeleccionadaId('');
      setMetaIdInicial('');
      setModoMetaManual(false);
      setNombreNuevaMeta('');
      setUnidadMedida('');
      setMetaTotal('');
      setValorAcumulado('0');
      setMetaDiaria('');
      setRescateMinimo('');
      setPasosLocales([]);
      setPasosInicialesJson('[]');
      setNuevoPasoTexto('');
    }
    setMostrarModalAlcance(false);
    setPayloadPendiente(null);
  }, [isOpen, actividadEditar, categoriaInicial, nombreDisplay]);

  // Listener de Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mostrarModalAlcance) return;
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, mostrarModalAlcance]);

  // Consultas reactivas en Dexie para vinculaciones
  const listaGastos = useLiveQuery(() => db.gastos.orderBy('fecha_gasto').reverse().limit(50).toArray()) || [];

  const catClaveNormalizada = String(
    actividadEditar?.categoria_vida || categoria || categoriaInicial || 'SALUD_DEPORTE'
  ).toUpperCase().trim();

  const categoriaActual =
    CATEGORIAS_FLOW.find((c) => c.clave === catClaveNormalizada) ||
    CATEGORIAS_FLOW.find((c) => c.clave === categoria) ||
    CATEGORIAS_FLOW[0];

  const nombreColumnaCanonico = resolverNombreColumnaCanonico(
    actividadEditar?.categoria_vida || categoria,
    categoriaInicial
  );

  // Gestión de pasos
  const agregarPaso = () => {
    if (!nuevoPasoTexto.trim()) return;
    const nuevoNumero = pasosLocales.length + 1;
    setPasosLocales([
      ...pasosLocales,
      {
        id: crypto.randomUUID(),
        numero: nuevoNumero,
        descripcion: nuevoPasoTexto.trim(),
        completado: false
      }
    ]);
    setNuevoPasoTexto('');
  };

  const togglePasoCompletado = (id: string) => {
    setPasosLocales(
      pasosLocales.map((p) => (p.id === id ? { ...p, completado: !p.completado } : p))
    );
  };

  const eliminarPaso = (id: string) => {
    const filtrados = pasosLocales.filter((p) => p.id !== id);
    setPasosLocales(filtrados.map((p, idx) => ({ ...p, numero: idx + 1 })));
  };

  const pasosCompletados = pasosLocales.filter((p) => p.completado).length;
  const progresoPasos = pasosLocales.length > 0 ? Math.round((pasosCompletados / pasosLocales.length) * 100) : 0;

  // Manejador del selector de metas
  const handleCambiarMetaSeleccionada = (valor: string) => {
    if (valor === '__CREAR_NUEVA__') {
      setModoMetaManual(false);
      setMetaSeleccionadaId('__CREAR_NUEVA__');
      if (!nombreNuevaMeta.trim()) {
        setNombreNuevaMeta(titulo.trim());
      }
      return;
    }

    if (valor === '__TEXTO_LIBRE__' || valor === 'MANUAL') {
      setModoMetaManual(true);
      setMetaSeleccionadaId('__TEXTO_LIBRE__');
      return;
    }

    if (!valor) {
      setModoMetaManual(false);
      setMetaSeleccionadaId('');
      setMetaMacro('');
      return;
    }

    // Se seleccionó una meta de metas_planes
    setModoMetaManual(false);
    setMetaSeleccionadaId(valor);
    const metaElegida = metasDisponibles.find((m) => m.id === valor);
    if (metaElegida) {
      setMetaMacro(metaElegida.nombre_meta);
      setUnidadMedida(metaElegida.unidad_medida || 'unidades');
      setMetaTotal(metaElegida.meta_objetivo_total ? String(metaElegida.meta_objetivo_total) : '');
      if (metaElegida.nivel_rescate_minimo) {
        setRescateMinimo(String(metaElegida.nivel_rescate_minimo));
      }
    }
  };

  // Detección de Dirty State normalizada
  const normalizarReglaParaDirty = (reglaStr?: string, freqStr?: string): string => {
    const r = (reglaStr || '').trim().toUpperCase();
    const f = (freqStr || 'DIARIA').trim().toUpperCase();
    if (f === 'DIARIA' && (r === '' || r === 'DIAS:LU,MA,MI,JU,VI,SA,DO')) return 'DIARIA_FULL';
    if (f === 'DIARIA_LABORAL' && (r === '' || r === 'L-V' || r === 'DIAS:LU,MA,MI,JU,VI')) return 'DIARIA_LAB';
    if (f === 'FIN_SEMANA' && (r === '' || r === 'DIAS:S,D' || r === 'DIAS:SA,DO')) return 'FIN_SEM';
    return r;
  };

  const verificarSiHayCambios = (payload: ActividadPersonal): boolean => {
    if (!actividadEditar) return true;

    const nombreInicial = (
      actividadEditar.nombre_actividad ||
      (actividadEditar as any).nombre ||
      (actividadEditar as any).Nombre_Actividad ||
      (actividadEditar as any).Nombre ||
      (actividadEditar as any).titulo ||
      (actividadEditar as any).Titulo ||
      (actividadEditar as any).actividad ||
      (actividadEditar as any).descripcion ||
      (actividadEditar as any).nombre_tarea_actividad ||
      ''
    ).trim();
    const nombreCambio = payload.nombre_actividad.trim() !== nombreInicial;
    const catCambio = payload.categoria_vida !== (actividadEditar.categoria_vida || categoriaInicial);
    const fechaInicial = (actividadEditar.fecha_programada || '').split(/[\sT]/)[0];
    const fechaCambio = (payload.fecha_programada || '').split(/[\sT]/)[0] !== fechaInicial;
    const fechaFinInicial = (actividadEditar.fecha_fin || '').split(/[\sT]/)[0];
    const fechaFinCambio = ((payload.fecha_fin || '').split(/[\sT]/)[0]) !== fechaFinInicial;
    const horaCambio = payload.hora_inicio !== (actividadEditar.hora_inicio || '08:00');
    const duracionCambio = (payload.duracion_horas ?? 0) !== (actividadEditar.duracion_horas ?? 0);
    const syncCambio = payload.agendado_calendar !== (actividadEditar.agendado_calendar || 'Sí');
    const freqInicial = actividadEditar.frecuencia_ciclo || (actividadEditar.tipo_compromiso === 'PUNTUAL' ? 'NINGUNA' : 'DIARIA');
    const freqCambio = (payload.frecuencia_ciclo || 'DIARIA') !== freqInicial;
    const reglaCambio =
      normalizarReglaParaDirty(payload.regla_repeticion, payload.frecuencia_ciclo) !==
      normalizarReglaParaDirty(actividadEditar.regla_repeticion, freqInicial);
    const prioInicial = (actividadEditar as any).prioridad || (actividadEditar as any).prioridad_eisenhower || '02_P2_Media';
    const prioCambio = prioridad !== prioInicial;
    const notasCambio = (payload.notas_checklist || '').trim() !== (actividadEditar.notas_checklist || '').trim();
    const gastoCambio = (payload.monto_gasto_asociado || 0) !== (actividadEditar.monto_gasto_asociado || 0);
    const macroCambio = (payload.meta_macro_nombre || '').trim() !== (actividadEditar.meta_macro_nombre || '').trim();
    const unidadCambio = (payload.unidad_medida || '').trim() !== (actividadEditar.unidad_medida || '').trim();
    const metaTotCambio = (payload.meta_objetivo_total || 0) !== (actividadEditar.meta_objetivo_total || 0);
    const metaDiaCambio = (payload.meta_diaria_estandar || 0) !== (actividadEditar.meta_diaria_estandar || 0);
    const rescMinCambio = (payload.nivel_rescate_minimo || 0) !== (actividadEditar.nivel_rescate_minimo || 0);
    const pasosActualesNorm = JSON.stringify(
      pasosLocales.map((p) => ({
        numero: p.numero,
        descripcion: p.descripcion.trim(),
        completado: p.completado
      }))
    );
    const pasosCambio = pasosActualesNorm !== pasosInicialesJson;
    const vinculoCambio = metaSeleccionadaId !== metaIdInicial;

    return (
      nombreCambio ||
      catCambio ||
      fechaCambio ||
      fechaFinCambio ||
      horaCambio ||
      duracionCambio ||
      syncCambio ||
      freqCambio ||
      reglaCambio ||
      prioCambio ||
      notasCambio ||
      gastoCambio ||
      macroCambio ||
      unidadCambio ||
      metaTotCambio ||
      metaDiaCambio ||
      rescMinCambio ||
      pasosCambio ||
      vinculoCambio
    );
  };

  // Helper de construcción de regla y frecuencia
  const construirReglaYFrecuencia = (): {
    freqFinal: FrecuenciaCiclo;
    reglaFinal: string;
    fechaFinFinal: string | undefined;
  } => {
    let freqFinal: FrecuenciaCiclo = 'DIARIA';
    let reglaFinal = '';

    if (tipoRecurrencia === 'NINGUNA') {
      freqFinal = 'NINGUNA';
      reglaFinal = '';
    } else if (tipoRecurrencia === 'DIARIA') {
      freqFinal = 'DIARIA';
      reglaFinal = 'DIAS:LU,MA,MI,JU,VI,SA,DO';
    } else if (tipoRecurrencia === 'DIARIA_LABORAL') {
      freqFinal = 'DIARIA_LABORAL';
      reglaFinal = 'DIAS:LU,MA,MI,JU,VI';
    } else if (tipoRecurrencia === 'FIN_SEMANA') {
      freqFinal = 'FIN_SEMANA';
      reglaFinal = 'DIAS:SA,DO';
    } else if (tipoRecurrencia === 'QUINCENAL') {
      freqFinal = 'QUINCENAL';
      reglaFinal = '';
    } else if (tipoRecurrencia === 'SEMANAL') {
      freqFinal = 'SEMANAL';
      reglaFinal = diasSemana.length > 0 ? `DIAS:${diasSemana.join(',')}` : 'DIAS:LU';
    } else if (tipoRecurrencia === 'MENSUAL') {
      freqFinal = 'MENSUAL';
      reglaFinal = '';
    } else if (tipoRecurrencia === 'PERSONALIZADO') {
      if (unidadIntervalo === 'dias') {
        freqFinal = 'DIARIA';
        reglaFinal = intervaloRepeticion > 1 ? `INTERVALO:${intervaloRepeticion}:DIAS` : 'DIAS:LU,MA,MI,JU,VI,SA,DO';
      } else if (unidadIntervalo === 'semanas') {
        freqFinal = 'SEMANAL';
        const diasStr = diasSemana.length > 0 ? diasSemana.join(',') : 'LU';
        reglaFinal = intervaloRepeticion > 1 ? `INTERVALO:${intervaloRepeticion}:SEMANAS;DIAS:${diasStr}` : `DIAS:${diasStr}`;
      } else {
        freqFinal = 'MENSUAL';
        reglaFinal = intervaloRepeticion > 1 ? `INTERVALO:${intervaloRepeticion}:MESES` : '';
      }
    }

    const fechaFinFinal = (tipoRecurrencia !== 'NINGUNA' && tieneFechaFin && fechaFin)
      ? fechaFin
      : undefined;

    return { freqFinal, reglaFinal, fechaFinFinal };
  };

  // Commit atómico del guardado en Dexie y despacho a Calendar
  const commitGuardado = async (payloadAguardar: ActividadPersonal, alcance: AlcanceRecurrencia) => {
    if (guardandoRef.current) return;
    guardandoRef.current = true;
    setIsSaving(true);

    try {
      const nowIso = new Date().toISOString();
      let codigoLegado = actividadEditar?.codigo_legado || payloadAguardar.codigo_legado;
      let idMetaFinal = metaSeleccionadaId;

      // Si seleccionó __CREAR_NUEVA__, invocar crearMetaRapidaDesdeActividadLocal
      if (metaSeleccionadaId === '__CREAR_NUEVA__') {
        const nombreFinal = nombreNuevaMeta.trim() || titulo.trim() || payloadAguardar.nombre_actividad;
        const metaCreada = await crearMetaRapidaDesdeActividadLocal({
          nombre: nombreFinal,
          categoria: payloadAguardar.categoria_vida,
          metaTotal: parseFloat(metaTotal) || undefined,
          unidad: unidadMedida.trim() || undefined,
          nivelRescate: parseFloat(rescateMinimo) || undefined,
          habitoId: payloadAguardar.id
        });
        payloadAguardar.meta_macro_nombre = metaCreada.nombre_meta;
        idMetaFinal = metaCreada.id;
      }

      if (actividadEditar) {
        try {
          const editRes = await editarActividadConAlcance(
            actividadEditar,
            payloadAguardar,
            alcance,
            actividadEditar.fecha_programada
          );
          if (editRes.calendarResult) {
            if (editRes.calendarResult.success && editRes.calendarResult.mode === 'API_V3') {
              mostrarToastCobalt(editRes.calendarResult.message || 'Actualizado en Google Calendar', 'success');
            } else if (editRes.calendarResult.requiereConfigClientId) {
              mostrarToastCobalt('Google Calendar no configurado en este entorno (falta VITE_GOOGLE_CLIENT_ID)', 'warning', 4500);
            } else if (!editRes.calendarResult.success && editRes.calendarResult.error) {
              mostrarToastCobalt(`Guardado local · ${editRes.calendarResult.error}`, 'warning', 4000);
            } else if (editRes.calendarResult.requiereAuth) {
              mostrarToastCobalt('Cambios guardados · Conecta Google Calendar para sync automático', 'info', 3500);
            }
          }
        } catch (e) {
          console.warn('[ModalActividadFlow] Error en edición con alcance:', e);
        }
      } else {
        await db.actividades_personales.put(payloadAguardar);
        if (calendarSync === 'Sí') {
          try {
            const calRes = await sincronizarCreacionCalendar(payloadAguardar);
            if (calRes?.success && calRes.mode === 'API_V3') {
              mostrarToastCobalt('Sincronizado en Google Calendar', 'success');
            } else if (calRes?.requiereConfigClientId) {
              mostrarToastCobalt('Google Calendar no configurado en este entorno (falta VITE_GOOGLE_CLIENT_ID)', 'warning', 4500);
            } else if (calRes && !calRes.success && calRes.error) {
              mostrarToastCobalt(`Guardado local · ${calRes.error}`, 'warning', 4000);
            } else if (calRes?.requiereAuth) {
              mostrarToastCobalt('Actividad guardada · Conecta Google Calendar para sync automático', 'info', 3500);
            }
          } catch (e) {
            console.warn('[ModalActividadFlow] Fallo en sincronización inicial Calendar:', e);
            mostrarToastCobalt('Guardado local · Error inesperado al agendar en Calendar', 'warning', 4000);
          }
        }
      }

      // Persistir subtareas asociadas en db.subtareas_pasos
      if (codigoLegado) {
        try {
          const subtareasPrevias = await db.subtareas_pasos
            .where('id_padre_vinculado')
            .equals(codigoLegado)
            .toArray();
          const idsNuevos = new Set(pasosLocales.map((p) => p.id));
          for (const sub of subtareasPrevias) {
            if (!idsNuevos.has(sub.id)) {
              await registrarTombstone('subtareas_pasos', sub.id);
            }
          }
        } catch (errSub) {
          console.warn('[ModalActividadFlow] Error al resolver lápidas de subtareas previas:', errSub);
        }
        await db.subtareas_pasos.where('id_padre_vinculado').equals(codigoLegado).delete();
        if (pasosLocales.length > 0) {
          const subtareasPayload: SubtareaPaso[] = pasosLocales.map((p, idx) => ({
            id: p.id,
            user_id: '00000000-0000-0000-0000-000000000001',
            codigo_legado: `SUB-${String(idx + 1).padStart(3, '0')}`,
            id_padre_vinculado: codigoLegado,
            tipo_padre: 'ACTIVIDAD',
            numero_paso: p.numero,
            descripcion_paso: p.descripcion,
            completado: p.completado,
            fecha_completado: p.completado ? nowIso : undefined,
            created_at: nowIso,
            updated_at: nowIso,
            version: 1,
            sync_status: 'pending'
          }));
          await db.subtareas_pasos.bulkPut(subtareasPayload);
        }
      }

      // Si se registró nuevo gasto directo
      const montoGastoFinal = parseFloat(gastoMonto) || undefined;
      if (mostrarGasto && tabGasto === 'NUEVO' && montoGastoFinal && montoGastoFinal > 0 && codigoLegado) {
        const tc = gastoMoneda === 'USD' ? 3.75 : gastoMoneda === 'EUR' ? 4.10 : 1.0;
        await crearGasto({
          tipo_origen: 'ACTIVIDAD_PERSONAL',
          id_origen_vinculado: codigoLegado,
          categoria_gasto: gastoCategoria,
          fecha_gasto: fecha || formatFechaIsoLocal(),
          descripcion_gasto: gastoConcepto.trim() || `Gasto en ${titulo.trim()}`,
          moneda_original: gastoMoneda,
          monto_original: montoGastoFinal,
          tipo_cambio: tc,
          monto_pen: Number((montoGastoFinal * tc).toFixed(2)),
          metodo_pago: 'Efectivo',
          estado_pago: 'PAGADO'
        });
      } else if (mostrarGasto && tabGasto === 'VINCULAR' && gastoVinculadoId && codigoLegado) {
        const gastoExistente = await db.gastos.where('codigo_legado').equals(gastoVinculadoId).first();
        if (gastoExistente) {
          await actualizarGasto(gastoExistente.id, {
            tipo_origen: 'ACTIVIDAD_PERSONAL',
            id_origen_vinculado: codigoLegado
          });
        }
      }

      // Persistencia y vinculación a Meta & Plan Estratégico
      if (idMetaFinal && idMetaFinal !== '__TEXTO_LIBRE__') {
        await vincularHabitoAMetaLocal(
          payloadAguardar.id,
          idMetaFinal,
          'VOLUMEN_DIRECTO',
          1.0,
          100,
          parseFloat(metaTotal) || 0
        );
        await recalcularProgresoMetaLocal(idMetaFinal);

        // Si cambió de meta respecto a la inicial, limpiar vínculo anterior
        if (actividadEditar && metaIdInicial && metaIdInicial !== idMetaFinal) {
          const vinculoPrevio = await db.habitos_metas_vinculos
            .where('habito_id')
            .equals(actividadEditar.id)
            .and((v) => v.meta_id === metaIdInicial)
            .first();
          if (vinculoPrevio) {
            await db.habitos_metas_vinculos.delete(vinculoPrevio.id);
            await recalcularProgresoMetaLocal(metaIdInicial);
          }
        }
      } else if (actividadEditar) {
        const vinculoExistente = await db.habitos_metas_vinculos
          .where('habito_id')
          .equals(actividadEditar.id)
          .first();
        if (vinculoExistente) {
          await db.habitos_metas_vinculos.delete(vinculoExistente.id);
          await recalcularProgresoMetaLocal(vinculoExistente.meta_id);
        }
      }

      // Propagar inmediatamente hacia Supabase y el puente local
      syncManager.syncPendingRecords().catch(() => {});
      syncManager.guardarSnapshotEnPuenteLocal().catch(() => {});

      if (onGuardadoExitoso) onGuardadoExitoso(payloadAguardar);
      setPayloadPendiente(null);
      onClose();
    } finally {
      guardandoRef.current = false;
      setIsSaving(false);
    }
  };

  // Guardar en Dexie con Dirty Checking y confirmación diferida de alcance
  const handleGuardar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (guardandoRef.current) return;
    const tituloFinal = titulo.trim() || nombreDisplay.trim();
    if (!tituloFinal) {
      setErrorLocal('El título de la actividad es requerido');
      return;
    }
    setErrorLocal(null);

    const nowIso = new Date().toISOString();
    let codigoLegado = actividadEditar?.codigo_legado;
    let idActividad = actividadEditar?.id;

    if (!actividadEditar) {
      idActividad = crypto.randomUUID();
      codigoLegado = await generarCodigoCorrelativoSeguro(db.actividades_personales, 'ACT', 3);
    }

    const montoGastoFinal = parseFloat(gastoMonto) || undefined;

    let metaMacroNombre = metaMacro.trim();
    if (metaSeleccionadaId === '__CREAR_NUEVA__') {
      metaMacroNombre = nombreNuevaMeta.trim() || titulo.trim() || 'Nueva Meta';
    } else if (metaSeleccionadaId && metaSeleccionadaId !== '__TEXTO_LIBRE__') {
      metaMacroNombre = metasDisponibles.find((m) => m.id === metaSeleccionadaId)?.nombre_meta || metaMacro.trim();
    }

    const { freqFinal, reglaFinal, fechaFinFinal } = construirReglaYFrecuencia();

    const tipoCompromisoFinal: TipoCompromiso =
      tipoRecurrencia === 'NINGUNA' ? 'PUNTUAL' : metaTotal ? 'META' : tipoCompromiso === 'PUNTUAL' ? 'HABITUAL' : tipoCompromiso;

    const payload: ActividadPersonal = {
      id: idActividad!,
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: codigoLegado!,
      nombre_actividad: tituloFinal,
      tipo_compromiso: tipoCompromisoFinal,
      categoria_vida: actividadEditar ? (actividadEditar.categoria_vida || categoria) : categoria,
      meta_macro_nombre: metaMacroNombre || undefined,
      unidad_medida: unidadMedida.trim() || undefined,
      meta_objetivo_total: parseFloat(metaTotal) || undefined,
      valor_acumulado_actual: parseFloat(valorAcumulado) || 0,
      meta_diaria_estandar: parseFloat(metaDiaria) || undefined,
      nivel_rescate_minimo: parseFloat(rescateMinimo) || undefined,
      estado: actividadEditar?.estado || '01_Backlog',
      racha_actual: actividadEditar?.racha_actual || 0,
      fecha_programada: fecha || formatFechaIsoLocal(),
      fecha_fin: fechaFinFinal,
      hora_inicio: hora || '08:00',
      duracion_horas: duracionHoras,
      agendado_calendar: calendarSync,
      id_evento_calendar: actividadEditar?.id_evento_calendar,
      monto_gasto_asociado: montoGastoFinal,
      notas_checklist: notas.trim() || undefined,
      frecuencia_ciclo: freqFinal,
      regla_repeticion: reglaFinal,
      created_at: actividadEditar?.created_at || nowIso,
      updated_at: nowIso,
      version: (actividadEditar?.version || 0) + 1,
      sync_status: 'pending'
    };
    (payload as any).prioridad = prioridad;
    (payload as any).tipo_entidad = 'ACTIVIDAD';

    if (actividadEditar) {
      // 1. Detección de cambios reales (Dirty Checking)
      const isDirty = verificarSiHayCambios(payload);
      if (!isDirty) {
        onClose();
        return;
      }

      // 2. Evaluar si es actividad recurrente
      const tieneRecurrencia = Boolean(
        (freqFinal && freqFinal !== 'NINGUNA') ||
        (actividadEditar.frecuencia_ciclo && actividadEditar.frecuencia_ciclo !== 'NINGUNA') ||
        (actividadEditar.regla_repeticion && actividadEditar.regla_repeticion.trim() !== '')
      );
      const esRutinaria = payload.tipo_compromiso === 'HABITUAL' || actividadEditar.tipo_compromiso === 'HABITUAL' || tieneRecurrencia;

      // 3. Si es recurrente y la frecuencia NO es NINGUNA: solicitar alcance al guardar
      if (esRutinaria && freqFinal !== 'NINGUNA') {
        setPayloadPendiente(payload);
        setMostrarModalAlcance(true);
        return;
      }

      // Si es puntual o sin repetición, guardar directo con ALL
      await commitGuardado(payload, 'ALL');
      return;
    }

    // Creación de nueva actividad
    await commitGuardado(payload, 'ALL');
  };

  const handleConfirmarAlcance = async (alcance: AlcanceRecurrencia) => {
    if (!payloadPendiente || guardandoRef.current) return;
    setMostrarModalAlcance(false);
    await commitGuardado(payloadPendiente, alcance);
  };

  // Eliminar actividad con borrado optimista en 0ms y cola de deshacer
  const handleEliminar = () => {
    if (!actividadEditar) return;
    const actId = actividadEditar.id;
    const codLegado = actividadEditar.codigo_legado;
    const alcance = alcanceEdicion || 'ALL';
    const fechaProg = actividadEditar.fecha_programada;
    const etiqueta = titulo.trim() || nombreDisplay.trim() || 'Actividad';

    programarEliminacion({
      tabla: 'actividades_personales',
      id: actId,
      idsSecundarios: codLegado ? [codLegado] : [],
      etiqueta,
      tipo: 'ACTIVIDAD',
      commit: async () => {
        await eliminarActividadConAlcance(actId, alcance, fechaProg);
      }
    });

    onClose();
  };

  return {
    actividadEditar,
    esModoDetalle,
    esEdicionODetalle,
    nombreDisplay,
    categoriaActual,
    nombreColumnaCanonico,
    titulo,
    setTitulo,
    categoria,
    setCategoria,
    tipoCompromiso,
    setTipoCompromiso,
    prioridad,
    setPrioridad,
    calendarSync,
    setCalendarSync,
    notas,
    setNotas,
    fecha,
    setFecha,
    hora,
    setHora,
    duracionHoras,
    setDuracionHoras,
    duracionStr,
    setDuracionStr,
    tipoRecurrencia,
    setTipoRecurrencia,
    diasSemana,
    setDiasSemana,
    intervaloRepeticion,
    setIntervaloRepeticion,
    unidadIntervalo,
    setUnidadIntervalo,
    tieneFechaFin,
    setTieneFechaFin,
    fechaFin,
    setFechaFin,
    mostrarGasto,
    setMostrarGasto,
    tabGasto,
    setTabGasto,
    gastoMoneda,
    setGastoMoneda,
    gastoMonto,
    setGastoMonto,
    gastoCategoria,
    setGastoCategoria,
    gastoConcepto,
    setGastoConcepto,
    gastoSearch,
    setGastoSearch,
    gastoVinculadoId,
    setGastoVinculadoId,
    metaMacro,
    setMetaMacro,
    metaSeleccionadaId,
    setMetaSeleccionadaId,
    modoMetaManual,
    setModoMetaManual,
    nombreNuevaMeta,
    setNombreNuevaMeta,
    unidadMedida,
    setUnidadMedida,
    metaTotal,
    setMetaTotal,
    valorAcumulado,
    setValorAcumulado,
    metaDiaria,
    setMetaDiaria,
    rescateMinimo,
    setRescateMinimo,
    copiado,
    handleCopiarCodigo,
    opcionesCategoriasCobalt,
    opcionesMetasCobalt,
    metasDisponibles,
    nuevoPasoTexto,
    setNuevoPasoTexto,
    pasosLocales,
    setPasosLocales,
    pasosCompletados,
    progresoPasos,
    agregarPaso,
    togglePasoCompletado,
    eliminarPaso,
    handleCambiarMetaSeleccionada,
    construirReglaYFrecuencia,
    handleGuardar,
    handleConfirmarAlcance,
    handleEliminar,
    mostrarModalAlcance,
    setMostrarModalAlcance,
    setPayloadPendiente,
    errorLocal,
    isSaving,
    gcalEstado,
    listaGastos
  };
}
