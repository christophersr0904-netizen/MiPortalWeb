/**
 * ============================================================================
 * ARCHIVO: src/components/Modals/ModalActividadFlow.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-F1-P1.2b
 * DESCRIPCIÓN: Modal interactivo de creación y edición de hábitos, rutinas y metas
 *              personales con paridad 1:1 de legacy_gas/Modal_ActividadFlow.html,
 *              elevación canónica z-[10000], createPortal, useBodyScrollLock y
 *              erradicación total de emojis por iconos vectoriales Lucide.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { SelectIconicoCobalt } from '../UI/SelectIconicoCobalt';
import {
  OPCIONES_RECURRENCIA_ACTIVIDAD_COBALT,
  OPCIONES_CATEGORIA_GASTO_COBALT
} from '../../constants/uiMappers';
import {
  editarActividadConAlcance,
  eliminarActividadConAlcance
} from '../../services/habitosService';
import {
  sincronizarCreacionCalendar,
  abrirGoogleCalendarActividad,
  obtenerEstadoConexionGoogleCalendar,
  suscribirEstadoGoogleCalendar,
  type EstadoConexionGoogleCalendar
} from '../../services/calendarSyncService';
import { syncManager } from '../../services/syncManager';
import { generarCodigoCorrelativoSeguro } from '../../utils/entityNormalizer';
import { mostrarToastCobalt } from '../../utils/toastCobalt';
import {
  vincularHabitoAMetaLocal,
  recalcularProgresoMetaLocal,
  crearMetaRapidaDesdeActividadLocal
} from '../../services/metasService';
import { ModalAlcanceRecurrencia } from './ModalAlcanceRecurrencia';
import { SeccionNotasVinculadasModal } from '../Notas/SeccionNotasVinculadasModal';
import { SwitchCobalt } from '../UI/SwitchCobalt';
import { InputFechaCobalt } from '../UI/InputFechaCobalt';
import { InputHoraCobalt } from '../UI/InputHoraCobalt';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import {
  CATEGORIAS_VIDA_MAP,
  type ActividadPersonal,
  type CategoriaVida,
  type TipoCompromiso,
  type FrecuenciaCiclo,
  type SubtareaPaso,
  type AlcanceRecurrencia
} from '../../types';
import {
  X,
  Calendar,
  Zap,
  Target,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  Search,
  DollarSign,
  HeartPulse,
  BookOpen,
  Briefcase,
  Wallet,
  Users,
  Coffee,
  ListOrdered,
  Link2,
  Flame,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
  CalendarCheck2,
  Hash,
  Repeat,
  Sun,
  CalendarDays,
  CalendarRange,
  SlidersHorizontal,
  CircleDot,
  AlertCircle,
  ArrowDown
} from 'lucide-react';
import {
  formatearDuracionLegible,
  convertirStringToHorasDecimal,
  convertirHorasDecimalAString,
  formatFechaIsoLocal
} from '../../utils/timeFormatters';

export type TipoRecurrenciaOpcion =
  | 'NINGUNA'
  | 'DIARIA'
  | 'DIARIA_LABORAL'
  | 'FIN_SEMANA'
  | 'SEMANAL'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'PERSONALIZADO';

export interface ModalActividadFlowProps {
  isOpen: boolean;
  onClose: () => void;
  actividadEditar?: ActividadPersonal | null;
  actividad?: ActividadPersonal | null; // Compatibilidad defensiva
  categoriaInicial?: CategoriaVida;
  alcanceEdicion?: AlcanceRecurrencia;
  onGuardadoExitoso?: (actividad: ActividadPersonal) => void;
  modo?: 'detalle' | 'edicion' | 'creacion';
  soloLectura?: boolean;
}

interface CategoriaConfigItem {
  clave: CategoriaVida;
  nombre: string;
  dotColor: string;
  badgeClase: string;
  icono: React.ReactNode;
  iconoComp: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const CATEGORIAS_FLOW: CategoriaConfigItem[] = [
  {
    clave: 'SALUD_DEPORTE',
    nombre: 'Deporte & Salud',
    dotColor: 'bg-emerald-500',
    badgeClase: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icono: <HeartPulse className="w-4 h-4 text-emerald-500" />,
    iconoComp: HeartPulse
  },
  {
    clave: 'DESARROLLO_ESTUDIO',
    nombre: 'Estudio & Mente',
    dotColor: 'bg-blue-500',
    badgeClase: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    icono: <BookOpen className="w-4 h-4 text-blue-500" />,
    iconoComp: BookOpen
  },
  {
    clave: 'LABORAL_HONORARIO',
    nombre: 'Trabajo & Carrera',
    dotColor: 'bg-violet-500',
    badgeClase: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60',
    icono: <Briefcase className="w-4 h-4 text-violet-500" />,
    iconoComp: Briefcase
  },
  {
    clave: 'FINANZAS_TRAMITES',
    nombre: 'Finanzas & Admin',
    dotColor: 'bg-purple-500',
    badgeClase: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    icono: <Wallet className="w-4 h-4 text-purple-500" />,
    iconoComp: Wallet
  },
  {
    clave: 'SOCIAL_FAMILIA',
    nombre: 'Social & Familia',
    dotColor: 'bg-amber-500',
    badgeClase: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    icono: <Users className="w-4 h-4 text-amber-500" />,
    iconoComp: Users
  },
  {
    clave: 'PERSONAL_DESCANSO',
    nombre: 'Personal & Relax',
    dotColor: 'bg-pink-500',
    badgeClase: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60',
    icono: <Coffee className="w-4 h-4 text-pink-500" />,
    iconoComp: Coffee
  }
];

/**
 * FIX-HABITOS-MODAL-DETAIL-TITLE-PILL-109: Extracción defensiva del nombre
 * Resolviendo el nombre en cascada sobre todas las claves posibles
 */
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

/**
 * FIX-HABITOS-MODAL-DETAIL-TITLE-PILL-109: Resolución de nombre de columna canónica fija
 */
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

export const ModalActividadFlow: React.FC<ModalActividadFlowProps> = ({
  isOpen,
  onClose,
  actividadEditar: actividadEditarProp,
  actividad: actividadProp,
  categoriaInicial = 'SALUD_DEPORTE',
  alcanceEdicion,
  onGuardadoExitoso,
  modo,
  soloLectura = false
}) => {
  useBodyScrollLock(isOpen);
  const { programarEliminacion } = useUndoDelete();

  // Unificación defensiva del objeto de actividad objetivo
  const actividadEditar = actividadEditarProp || actividadProp || null;
  const esModoDetalle = soloLectura || modo === 'detalle';
  const esEdicionODetalle = Boolean(actividadEditar);

  // FIX-HABITOS-MODAL-DETAIL-TITLE-PILL-109: Extracción defensiva del nombre para detalle y edición
  const nombreDisplay = resolverNombreActividadDefensivo(actividadEditar);

  // Estados base del formulario
  const [titulo, setTitulo] = useState(nombreDisplay);
  const [categoria, setCategoria] = useState<CategoriaVida>(categoriaInicial);
  const [tipoCompromiso, setTipoCompromiso] = useState<TipoCompromiso>('HABITUAL');
  const [prioridad, setPrioridad] = useState<'01_P1_Alta' | '02_P2_Media' | '03_P3_Baja'>('02_P2_Media');
  const [calendarSync, setCalendarSync] = useState<'Sí' | 'No'>('Sí');
  const [notas, setNotas] = useState('');

  // Fecha, Hora, Duración y Recurrencia (Google Calendar / Tasks Style)
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

  // Sección Metas OKR / metas_planes (REQ-HABITS-METAS-INTEGRATION-14 / REQ-HABITS-CREATE-METAS-INLINE-15)
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
  }, [isOpen, actividadEditar, categoriaInicial]);

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

  if (!isOpen) return null;

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

  // Manejador del selector de metas (REQ-HABITS-CREATE-METAS-INLINE-15)
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

  // Detección de Dirty State normalizada (cero falsos positivos al abrir y guardar/cerrar sin cambios)
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

  // Commit atómico del guardado en Dexie y despacho a Calendar
  const commitGuardado = async (payloadAguardar: ActividadPersonal, alcance: AlcanceRecurrencia) => {
    if (guardandoRef.current) return;
    guardandoRef.current = true;
    setIsSaving(true);

    try {
      const nowIso = new Date().toISOString();
    let codigoLegado = actividadEditar?.codigo_legado || payloadAguardar.codigo_legado;

    let idMetaFinal = metaSeleccionadaId;

    // Si seleccionó __CREAR_NUEVA__, invocar crearMetaRapidaDesdeActividadLocal (REQ-HABITS-CREATE-METAS-INLINE-15)
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
      const countGastos = await db.gastos.count();
      const codGasto = `GAS-${String(countGastos + 1).padStart(3, '0')}`;
      const tc = gastoMoneda === 'USD' ? 3.75 : gastoMoneda === 'EUR' ? 4.10 : 1.0;
      await db.gastos.add({
        id: crypto.randomUUID(),
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: codGasto,
        tipo_origen: 'ACTIVIDAD_PERSONAL',
        id_origen_vinculado: codigoLegado,
        categoria_gasto: gastoCategoria,
        fecha_gasto: fecha || formatFechaIsoLocal(),
        descripcion_gasto: gastoConcepto.trim() || `Gasto en ${titulo.trim()}`,
        moneda_original: gastoMoneda,
        monto_original: montoGastoFinal,
        tipo_cambio: tc,
        monto_pen: Number((montoGastoFinal * tc).toFixed(2)),
        estado_pago: 'PAGADO',
        updated_at: nowIso,
        sync_status: 'pending'
      });
    } else if (mostrarGasto && tabGasto === 'VINCULAR' && gastoVinculadoId && codigoLegado) {
      const gastoExistente = await db.gastos.where('codigo_legado').equals(gastoVinculadoId).first();
      if (gastoExistente) {
        await db.gastos.update(gastoExistente.id, {
          tipo_origen: 'ACTIVIDAD_PERSONAL',
          id_origen_vinculado: codigoLegado,
          updated_at: nowIso,
          sync_status: 'pending'
        });
      }
    }

    // Persistencia y vinculación a Meta & Plan Estratégico (REQ-HABITS-METAS-INTEGRATION-14 / REQ-HABITS-CREATE-METAS-INLINE-15)
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

    // Propagar inmediatamente hacia Supabase y el puente local del Cockpit/HUD
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

  // Helper de construcción de payload/recurrencia para guardado y vista previa Calendar
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

  return createPortal(
    <div
      id="modal-actividad-flow"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[10000] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200"
    >
      <div
        id="modal-actividad-flow-card"
        className="portal-surface elevation-3 w-full max-w-5xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-800/80 bg-[#0D1526] shadow-2xl overflow-hidden relative transform-gpu transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        {/* Drag handle móvil */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* 1. CABECERA EJECUTIVA DESPEJADA */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-800/80 shrink-0 space-y-2.5 bg-[#0A101D]">
          {/* Fila 1: ID Copiable, Píldora de Recurrencia, Píldora de Duración, Racha y Botón Cerrar */}
          <div className="flex items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
              {/* Placa de Código Interactivo con Copy-to-Clipboard */}
              {actividadEditar?.codigo_legado ? (
                <button
                  type="button"
                  id="act-flow-badge-id"
                  onClick={handleCopiarCodigo}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/70 hover:border-sky-500/50 text-slate-200 text-[11px] font-mono tabular-nums font-bold tracking-wider transition-[transform,colors] duration-150 cursor-pointer active:scale-95 shrink-0 select-none shadow-2xs"
                  title="Clic para copiar código de actividad"
                >
                  {copiado ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Hash className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
                      <span>{actividadEditar.codigo_legado}</span>
                    </>
                  )}
                </button>
              ) : (
                <span
                  id="act-flow-badge-id"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/70 text-slate-300 text-[11px] font-mono tabular-nums font-bold tracking-wider shrink-0 select-none shadow-2xs"
                >
                  <Hash className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
                  <span>NUEVA ACTIVIDAD</span>
                </span>
              )}

              {/* Píldora Dinámica de Configuración / Recurrencia */}
              <span
                id="act-flow-frecuencia-badge"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-800/80 bg-slate-900/60 text-slate-300 select-none shrink-0"
              >
                {tipoRecurrencia === 'DIARIA' && (
                  <>
                    <Repeat className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                    <span>Diario · Todos los días</span>
                  </>
                )}
                {tipoRecurrencia === 'DIARIA_LABORAL' && (
                  <>
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" strokeWidth={1.75} />
                    <span>Lun a Vie · Laboral</span>
                  </>
                )}
                {tipoRecurrencia === 'FIN_SEMANA' && (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                    <span>Fines de semana</span>
                  </>
                )}
                {tipoRecurrencia === 'SEMANAL' && (
                  <>
                    <CalendarDays className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.75} />
                    <span>Semanal · Configurado</span>
                  </>
                )}
                {tipoRecurrencia === 'QUINCENAL' && (
                  <>
                    <CalendarRange className="w-3.5 h-3.5 text-violet-400" strokeWidth={1.75} />
                    <span>Cada 15 días</span>
                  </>
                )}
                {tipoRecurrencia === 'MENSUAL' && (
                  <>
                    <Calendar className="w-3.5 h-3.5 text-purple-400" strokeWidth={1.75} />
                    <span>Mensual</span>
                  </>
                )}
                {tipoRecurrencia === 'PERSONALIZADO' && (
                  <>
                    <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                    <span>Personalizado · Configurado</span>
                  </>
                )}
                {tipoRecurrencia === 'NINGUNA' && (
                  <>
                    <CircleDot className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                    <span>Única · 1 vez</span>
                  </>
                )}
              </span>

              {/* Píldora Dinámica de Duración */}
              {duracionHoras > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold font-mono tabular-nums rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 select-none shrink-0">
                  <Clock className="w-3 h-3 text-sky-400" strokeWidth={1.75} />
                  <span>Bloque · {formatearDuracionLegible(duracionHoras)}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold font-mono tabular-nums rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-300 select-none shrink-0">
                  <Zap className="w-3 h-3 text-amber-400" strokeWidth={1.75} />
                  <span>Puntual · Sin duración (0m)</span>
                </span>
              )}

              {/* Racha Badge si existe racha > 0 */}
              {(actividadEditar?.racha_actual || 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold font-mono tabular-nums rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 select-none shrink-0">
                  <Flame className="w-3 h-3 text-amber-400" strokeWidth={1.75} />
                  <span>{actividadEditar?.racha_actual} días</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-auto"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fila 2: Título en Alto Contraste */}
          <div className="pt-0.5">
            {esModoDetalle ? (
              <h2
                id="act-flow-titulo-readonly"
                className="text-lg sm:text-xl font-bold text-slate-100 py-0.5 leading-snug select-text"
              >
                {titulo || nombreDisplay || 'Actividad sin título'}
              </h2>
            ) : (
              <input
                type="text"
                id="act-flow-titulo"
                value={titulo || (actividadEditar ? nombreDisplay : '')}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Nombre del hábito o actividad personal..."
                className="text-lg sm:text-xl font-bold text-slate-100 placeholder:text-slate-500 bg-transparent outline-none w-full border-b border-transparent focus:border-sky-500/50 transition-colors py-0.5 leading-snug"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* 2. CUERPO DE CONTENIDO CON SCROLL — LINEAR SPLIT 2 COLUMNAS */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* COLUMNA IZQUIERDA: LIENZO DE TRABAJO */}
          <div className="flex-1 min-w-0 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
            {errorLocal && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorLocal}</span>
              </div>
            )}

            {/* Apuntes y Notas Rápidas de Ejecución */}
            <div className="space-y-1.5">
              <label className="block font-bold text-xs text-slate-400">
                Apuntes y Notas Rápidas de Ejecución
              </label>
              <textarea
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Añadir notas, observaciones o apuntes rápidos de ejecución..."
                className="w-full bg-[#080E1C]/80 border border-slate-800/70 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50 transition resize-y custom-scrollbar"
              />
            </div>

            {/* Pasos / Subtareas Procedurales (DoD) */}
            <div className="p-4 bg-[#080E1C]/80 border border-slate-800/70 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg text-xs font-black">
                    <ListOrdered className="w-4 h-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs">Pasos / Subtareas Procedurales</h4>
                    <p className="text-[10px] text-slate-400">Procedimiento guiado secuencial de ejecución</p>
                  </div>
                </div>

                {pasosLocales.length > 0 && (
                  <div
                    id="act-flow-pasos-progreso-badge"
                    className="font-mono tabular-nums text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#0D1526] text-slate-300 border border-slate-800"
                  >
                    {pasosCompletados}/{pasosLocales.length} pasos ({progresoPasos}%)
                  </div>
                )}
              </div>

              {/* Barra de progreso */}
              {pasosLocales.length > 0 && (
                <div className="w-full bg-[#040711] h-1.5 rounded-full overflow-hidden border border-slate-800/40">
                  <div
                    className={`${progresoPasos >= 100 ? 'bg-emerald-500' : 'bg-sky-500'} h-full rounded-full transition-[width] duration-300 ease-out`}
                    style={{ width: `${progresoPasos}%` }}
                  />
                </div>
              )}

              {/* Lista de pasos con casillas cuadradas redondeadas */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {pasosLocales.length === 0 ? (
                  <p className="text-center py-3 text-[11px] text-slate-500 italic">No hay pasos secuenciales agregados.</p>
                ) : (
                  pasosLocales.map((paso) => (
                    <div
                      key={paso.id}
                      className="flex items-center justify-between gap-2.5 p-2 rounded-lg border text-xs group transition-colors bg-[#0D1526] border-slate-800/80 hover:border-slate-700"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => togglePasoCompletado(paso.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-[transform,colors] duration-150 cursor-pointer active:scale-95 ${
                            paso.completado
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : 'border-slate-600 bg-slate-900/80 hover:border-emerald-400 text-transparent'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 ${paso.completado ? 'opacity-100' : 'opacity-0'}`} strokeWidth={2.5} />
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">#{paso.numero}</span>
                        <span
                          className={`truncate ${
                            paso.completado ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {paso.descripcion}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarPaso(paso.id)}
                        className="opacity-90 sm:opacity-0 sm:group-hover:opacity-100 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer flex items-center justify-center shrink-0"
                        title="Eliminar paso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Input para nuevo paso */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={nuevoPasoTexto}
                  onChange={(e) => setNuevoPasoTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarPaso();
                    }
                  }}
                  placeholder="Escribe el siguiente paso procedural y pulsa Enter..."
                  className="flex-1 border border-slate-800 rounded-lg px-3 py-1.5 text-xs bg-[#040711] text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50"
                />
                <button
                  type="button"
                  onClick={agregarPaso}
                  className="h-8 px-3 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-sky-950/50 active:scale-95 transition-[transform,colors] duration-150 flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Agregar paso"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Añadir</span>
                </button>
              </div>
            </div>

            {/* Sección Dinámica de Notas Vinculadas */}
            <SeccionNotasVinculadasModal
              codigoEntidad={actividadEditar?.codigo_legado || ''}
              tipoEntidad="HABITO"
              tituloEntidad={titulo || nombreDisplay || 'Actividad'}
            />
          </div>

          {/* COLUMNA DERECHA: INSPECTOR DE PROPIEDADES */}
          <div className="w-full md:w-[350px] lg:w-[380px] shrink-0 bg-[#080E1C]/80 border-t md:border-t-0 md:border-l border-slate-800/80 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar text-xs">
            {/* 1. Categoría / Pilar de Vida */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Pilar de Vida
              </label>
              {esEdicionODetalle ? (
                <div
                  id="flow-cat-badge-readonly"
                  className="p-2.5 rounded-xl bg-[#0D1526] border border-slate-700/70 flex items-center gap-2.5 select-none"
                  title={`Columna fija: ${nombreColumnaCanonico}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
                    {categoriaActual.iconoComp ? (
                      <categoriaActual.iconoComp className="w-4 h-4 text-sky-400" strokeWidth={1.75} />
                    ) : (
                      categoriaActual.icono
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-100 truncate">{nombreColumnaCanonico}</span>
                    <span className="text-[10px] text-slate-400 truncate">Dimensión fijada en edición</span>
                  </div>
                </div>
              ) : (
                <SelectIconicoCobalt
                  label=""
                  valor={categoria}
                  onChange={(nuevaCat) => setCategoria(nuevaCat as CategoriaVida)}
                  opciones={opcionesCategoriasCobalt}
                  placeholder="Seleccionar Pilar de Vida..."
                />
              )}
            </div>

            {/* 2. Prioridad Operativa (Riel Táctil Limpio) */}
            <div className="space-y-2 p-3 bg-[#0D1526]/80 rounded-xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                  <span>Prioridad Operativa</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Eisenhower</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: '01_P1_Alta', label: 'P1 Urgente', sublabel: 'Crítico', icon: Flame, activeClass: 'bg-rose-500/20 border-rose-500/60 text-rose-200 shadow-xs' },
                  { id: '02_P2_Media', label: 'P2 Media', sublabel: 'Sostenido', icon: AlertCircle, activeClass: 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-xs' },
                  { id: '03_P3_Baja', label: 'P3 Baja', sublabel: 'Flexible', icon: ArrowDown, activeClass: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 shadow-xs' }
                ].map((p) => {
                  const IconComp = p.icon;
                  const isSelected = prioridad === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPrioridad(p.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-[transform,colors] duration-150 cursor-pointer flex flex-col items-center justify-center gap-0.5 border active:scale-95 ${
                        isSelected
                          ? p.activeClass
                          : 'border-slate-800/80 bg-[#040711] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <IconComp className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        <span className="font-bold text-[11px]">{p.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">{p.sublabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Tiempo, Recurrencia & Duración */}
            <div className="space-y-3 p-3 bg-[#0D1526]/80 rounded-xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                  <span>Tiempo & Ciclo</span>
                </span>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-2">
                <InputFechaCobalt
                  label="Fecha"
                  value={fecha}
                  onChange={setFecha}
                />
                <InputHoraCobalt
                  label="Hora"
                  value={hora}
                  onChange={setHora}
                />
              </div>

              {/* Frecuencia de Repetición */}
              <div>
                <SelectIconicoCobalt
                  label="Frecuencia"
                  valor={tipoRecurrencia}
                  onChange={(nuevaRecurrencia) => {
                    const val = nuevaRecurrencia as TipoRecurrenciaOpcion;
                    setTipoRecurrencia(val);
                    if (val === 'DIARIA') {
                      setDiasSemana(['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']);
                    } else if (val === 'DIARIA_LABORAL') {
                      setDiasSemana(['LU', 'MA', 'MI', 'JU', 'VI']);
                    } else if (val === 'FIN_SEMANA') {
                      setDiasSemana(['SA', 'DO']);
                    } else if (val === 'SEMANAL') {
                      if (diasSemana.length === 0) setDiasSemana(['LU']);
                    }
                  }}
                  opciones={OPCIONES_RECURRENCIA_ACTIVIDAD_COBALT}
                />
              </div>

              {/* Días Activos Circulares Táctiles */}
              {(tipoRecurrencia === 'SEMANAL' || tipoRecurrencia === 'PERSONALIZADO') && (
                <div className="pt-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-400">Días Activos</label>
                    <span className="text-[10px] font-mono text-sky-400">
                      {diasSemana.length} seleccionados
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    {[
                      { id: 'LU', label: 'L', name: 'Lunes' },
                      { id: 'MA', label: 'M', name: 'Martes' },
                      { id: 'MI', label: 'M', name: 'Miércoles' },
                      { id: 'JU', label: 'J', name: 'Jueves' },
                      { id: 'VI', label: 'V', name: 'Viernes' },
                      { id: 'SA', label: 'S', name: 'Sábado' },
                      { id: 'DO', label: 'D', name: 'Domingo' }
                    ].map(({ id, label, name }) => {
                      const activo = diasSemana.includes(id);
                      const esFinde = id === 'SA' || id === 'DO';
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={activo}
                          onClick={() => {
                            if (activo) {
                              if (diasSemana.length > 1) {
                                setDiasSemana(diasSemana.filter((d) => d !== id));
                              }
                            } else {
                              setDiasSemana([...diasSemana, id]);
                            }
                          }}
                          className={`w-8 h-8 rounded-full text-xs font-mono font-black transition-[transform,colors] duration-150 flex items-center justify-center cursor-pointer select-none active:scale-90 ${
                            activo
                              ? 'bg-gradient-to-b from-sky-400 to-sky-600 text-slate-950 border border-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]'
                              : esFinde
                                ? 'bg-[#040711] text-amber-400/70 border border-amber-900/30 hover:border-amber-500/40 hover:text-amber-300 hover:bg-slate-900/60'
                                : 'bg-[#040711] text-slate-400 border border-slate-800/90 hover:border-sky-500/40 hover:text-sky-300 hover:bg-slate-900/60'
                          }`}
                          title={`${name} (${id})`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Intervalo Personalizado con botones segmentados Cobalt */}
              {tipoRecurrencia === 'PERSONALIZADO' && (
                <div className="pt-2 space-y-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 shrink-0">Repetir cada:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={intervaloRepeticion}
                        onChange={(e) => setIntervaloRepeticion(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-14 bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs font-mono tabular-nums font-bold text-center text-slate-200 outline-none focus:border-sky-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="inline-flex p-0.5 bg-[#040711] rounded-lg border border-slate-800 text-[11px]">
                        {[
                          { id: 'dias', label: 'días' },
                          { id: 'semanas', label: 'sem' },
                          { id: 'meses', label: 'meses' }
                        ].map((u) => {
                          const isActivo = unidadIntervalo === u.id;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => setUnidadIntervalo(u.id as 'dias' | 'semanas' | 'meses')}
                              className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer text-[10px] ${
                                isActivo
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {u.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vencimiento */}
              {tipoRecurrencia !== 'NINGUNA' && (
                <div className="pt-1.5 space-y-1.5 border-t border-slate-800/60">
                  <label className="text-[10px] text-slate-400 block font-medium">Vencimiento</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="finRecurrencia"
                        checked={!tieneFechaFin}
                        onChange={() => {
                          setTieneFechaFin(false);
                          setFechaFin('');
                        }}
                        className="text-sky-500 focus:ring-sky-500"
                      />
                      <span>Sin límite</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="finRecurrencia"
                        checked={tieneFechaFin}
                        onChange={() => setTieneFechaFin(true)}
                        className="text-sky-500 focus:ring-sky-500"
                      />
                      <span>Hasta</span>
                    </label>
                    {tieneFechaFin && (
                      <div className="flex-1">
                        <InputFechaCobalt
                          value={fechaFin}
                          onChange={setFechaFin}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Duración */}
              <div className="pt-2 space-y-1.5 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-400" />
                    <span>Duración</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setDuracionHoras(0);
                      setDuracionStr('0:00');
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      duracionHoras === 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                        : 'bg-[#040711] text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Micro (0m)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={duracionStr}
                    onChange={(e) => setDuracionStr(e.target.value)}
                    onBlur={() => {
                      const dec = convertirStringToHorasDecimal(duracionStr);
                      setDuracionHoras(dec);
                      setDuracionStr(convertirHorasDecimalAString(dec));
                    }}
                    placeholder="H:MM"
                    className="w-20 bg-[#040711] px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-mono tabular-nums text-center text-slate-200 outline-none focus:border-sky-500/50"
                  />
                  <span className="text-[11px] font-mono tabular-nums text-sky-400 font-semibold">
                    ({formatearDuracionLegible(duracionHoras)})
                  </span>
                </div>

                {/* Botones rápidos */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {[
                    { label: '15m', horas: 0.25 },
                    { label: '30m', horas: 0.5 },
                    { label: '45m', horas: 0.75 },
                    { label: '1h', horas: 1.0 },
                    { label: '2h', horas: 2.0 }
                  ].map((p) => {
                    const activo = Math.abs(duracionHoras - p.horas) < 0.02;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setDuracionHoras(p.horas);
                          setDuracionStr(convertirHorasDecimalAString(p.horas));
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-bold transition active:scale-95 cursor-pointer ${
                          activo
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-[#040711] text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sincronización Google Calendar */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                <SwitchCobalt
                  id="switch-actividad-calendar"
                  checked={calendarSync === 'Sí'}
                  onChange={(val) => setCalendarSync(val ? 'Sí' : 'No')}
                  label="Agendar en Calendar"
                  size="sm"
                />
                {calendarSync === 'Sí' && (
                  <div className="flex items-center gap-1.5">
                    {gcalEstado.conectado && (
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.18)]"
                        title={gcalEstado.email ? `Sincronización automática activa (${gcalEstado.email})` : 'Sincronización automática activa con Google Calendar'}
                        aria-label="Google Calendar conectado"
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const { freqFinal, reglaFinal, fechaFinFinal } = construirReglaYFrecuencia();
                        abrirGoogleCalendarActividad({
                          id: actividadEditar?.id,
                          codigo_legado: actividadEditar?.codigo_legado || 'ACT-NEW',
                          nombre_actividad: titulo.trim() || nombreDisplay.trim() || 'Actividad PMO',
                          categoria_vida: categoria,
                          tipo_compromiso: tipoRecurrencia === 'NINGUNA' ? 'PUNTUAL' : tipoCompromiso,
                          meta_macro_nombre: metaMacro || undefined,
                          notas_checklist: notas || undefined,
                          fecha_programada: fecha || formatFechaIsoLocal(),
                          fecha_fin: fechaFinFinal,
                          hora_inicio: hora || '08:00',
                          duracion_horas: duracionHoras,
                          frecuencia_ciclo: freqFinal,
                          regla_repeticion: reglaFinal
                        });
                      }}
                      className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition cursor-pointer"
                      title="Abrir en Google Calendar"
                      aria-label="Abrir en Google Calendar"
                    >
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Meta Estratégica & Métricas Cuantitativas */}
            <div className="space-y-3 p-3 bg-[#0D1526]/80 rounded-xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                  <span>Meta & Métricas</span>
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] text-slate-400">Meta Vinculada</label>
                  <button
                    type="button"
                    onClick={() => setModoMetaManual(!modoMetaManual)}
                    className="text-[10px] text-sky-400 hover:text-sky-300 transition cursor-pointer font-medium"
                  >
                    {modoMetaManual ? 'Seleccionar lista' : '+ Nueva rápida'}
                  </button>
                </div>

                {modoMetaManual ? (
                  <input
                    type="text"
                    value={nombreNuevaMeta || metaMacro}
                    onChange={(e) => {
                      setNombreNuevaMeta(e.target.value);
                      setMetaMacro(e.target.value);
                    }}
                    placeholder="Nombre del objetivo..."
                    className="w-full bg-[#040711] px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50"
                  />
                ) : (
                  <SelectIconicoCobalt
                    label=""
                    valor={metaSeleccionadaId}
                    onChange={(nuevaMetaId) => handleCambiarMetaSeleccionada(nuevaMetaId)}
                    opciones={opcionesMetasCobalt}
                    placeholder="Sin vinculación a metas"
                  />
                )}
              </div>

              {/* Métricas Cuantitativas: Grilla 2x2 */}
              <div className="pt-1.5 border-t border-slate-800/60 space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 block">Avance Cuantitativo</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Unidad</label>
                    <input
                      type="text"
                      placeholder="km, págs..."
                      value={unidadMedida}
                      onChange={(e) => setUnidadMedida(e.target.value)}
                      className="w-full bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Objetivo</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="100"
                      value={metaTotal}
                      onChange={(e) => setMetaTotal(e.target.value)}
                      className="w-full bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs font-mono tabular-nums font-bold text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Acumulado</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={valorAcumulado}
                      onChange={(e) => setValorAcumulado(e.target.value)}
                      className="w-full bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs font-mono tabular-nums font-bold text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Mínimo Racha</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="1"
                      value={rescateMinimo}
                      onChange={(e) => setRescateMinimo(e.target.value)}
                      className="w-full bg-[#040711] px-2 py-1.5 rounded-lg border border-slate-800 text-xs font-mono tabular-nums font-bold text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Acordeón Gasto Asociado & Costos */}
            <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-[#0D1526]">
              <button
                type="button"
                onClick={() => setMostrarGasto(!mostrarGasto)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30 transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Gasto Asociado & Costos</span>
                  {tabGasto === 'VINCULAR' && gastoVinculadoId ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-emerald-400" />
                      <span>{gastoVinculadoId} • S/ {Number(gastoMonto || 0).toFixed(2)}</span>
                    </span>
                  ) : parseFloat(gastoMonto) > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                      {gastoMoneda === 'PEN' ? 'S/' : gastoMoneda === 'USD' ? '$' : '€'} {Number(gastoMonto).toFixed(2)} • {gastoCategoria.replace(/_/g, ' ')}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {!mostrarGasto && (!gastoMonto || parseFloat(gastoMonto) === 0) && !gastoVinculadoId && (
                    <span className="text-[11px] text-slate-400 font-normal">Sin gastos vinculados</span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-emerald-400 transition-transform duration-200 ${mostrarGasto ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {mostrarGasto && (
                <div className="p-3.5 border-t border-emerald-500/20 bg-[#0D1526] space-y-3">
                  {/* Selector de Pestaña Superior: Modo Dual */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Modo de Imputación
                    </span>
                    <div className="inline-flex p-0.5 bg-[#040711] rounded-lg border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setTabGasto('NUEVO')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${tabGasto === 'NUEVO'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Nuevo Gasto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTabGasto('VINCULAR')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${tabGasto === 'VINCULAR'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Vincular Existente</span>
                      </button>
                    </div>
                  </div>

                  {tabGasto === 'NUEVO' ? (
                    /* Modo NUEVO GASTO */
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-3 items-end">
                        {/* Selector Moneda */}
                        <div className="col-span-12 sm:col-span-4">
                          <label className="text-[10px] text-slate-400 block mb-1">Moneda de Registro</label>
                          <div className="inline-flex p-0.5 bg-[#040711] rounded-lg border border-slate-800 w-full justify-between">
                            {(['PEN', 'USD', 'EUR'] as const).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setGastoMoneda(m)}
                                className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition-colors duration-150 cursor-pointer ${gastoMoneda === m ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Input Monto */}
                        <div className="col-span-12 sm:col-span-8">
                          <label className="text-[10px] text-slate-400 block mb-1">Monto Incurrido</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-mono font-bold text-emerald-400 select-none">
                              {gastoMoneda === 'PEN' ? 'S/' : gastoMoneda === 'USD' ? '$' : '€'}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={gastoMonto}
                              onChange={(e) => setGastoMonto(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-9 pr-3 py-1.5 border border-slate-800 rounded-lg bg-[#040711] font-mono font-bold text-lg text-emerald-300 outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <SelectIconicoCobalt
                          label="Categoría Contable"
                          valor={gastoCategoria}
                          onChange={(nuevaCat) => setGastoCategoria(nuevaCat)}
                          opciones={OPCIONES_CATEGORIA_GASTO_COBALT}
                        />
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Concepto / Glosa Detallada</label>
                          <input
                            type="text"
                            value={gastoConcepto}
                            onChange={(e) => setGastoConcepto(e.target.value)}
                            placeholder="Ej. Membresía gimnasio, suplementos, zapatillas..."
                            className="w-full bg-[#040711] px-2.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-500 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Modo VINCULAR EXISTENTE */
                    <div className="space-y-2.5">
                      <div className="relative">
                        <input
                          type="text"
                          value={gastoSearch}
                          onChange={(e) => setGastoSearch(e.target.value)}
                          placeholder="Buscar egreso por código (GAS-XXX), descripción o monto..."
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-800 rounded-lg bg-[#040711] text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50"
                        />
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      </div>

                      <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                        {listaGastos
                          .filter((g) => {
                            const q = gastoSearch.toLowerCase().trim();
                            if (!q) return true;
                            return (
                              (g.codigo_legado || '').toLowerCase().includes(q) ||
                              (g.descripcion_gasto || '').toLowerCase().includes(q) ||
                              String(g.monto_pen || g.monto_original || '').includes(q) ||
                              (g.categoria_gasto || '').toLowerCase().includes(q)
                            );
                          })
                          .slice(0, 30)
                          .map((g) => {
                            const isSelected = gastoVinculadoId === g.codigo_legado;
                            const montoMostrar = Number(g.monto_pen || g.monto_original || 0).toFixed(2);
                            return (
                              <div
                                key={g.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setGastoVinculadoId(null);
                                    setGastoMonto('');
                                  } else {
                                    setGastoVinculadoId(g.codigo_legado || null);
                                    setGastoMonto(String(g.monto_original || g.monto_pen || ''));
                                    setGastoMoneda((g.moneda_original as 'PEN' | 'USD' | 'EUR') || 'PEN');
                                    setGastoCategoria(g.categoria_gasto || 'Personal_Salud');
                                    setGastoConcepto(g.descripcion_gasto || '');
                                  }
                                }}
                                className={`p-2.5 rounded-xl flex items-center justify-between text-xs cursor-pointer border transition-colors duration-150 ${isSelected
                                    ? 'bg-emerald-950/40 border-emerald-500/80 shadow-xs'
                                    : 'bg-[#040711] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-[10px] text-sky-400 bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-800/40 shrink-0">
                                        {g.codigo_legado}
                                      </span>
                                      <span className="font-medium text-slate-200 truncate">
                                        {g.descripcion_gasto || 'Sin descripción'}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                      {g.fecha_gasto || 'Sin fecha'} • {(g.categoria_gasto || 'General').replace(/_/g, ' ')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                  <span className="font-mono font-bold text-xs text-emerald-300">
                                    S/ {montoMostrar}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. FOOTER DE ACCIONES */}
        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-800/80 bg-[#0A101D] flex items-center justify-between gap-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="flex items-center gap-2">
            {actividadEditar && (
              <button
                type="button"
                id="act-flow-btn-eliminar"
                onClick={handleEliminar}
                className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Eliminar esta actividad permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            )}
            <p className="text-[10px] text-slate-500 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#040711] font-mono text-[9px] border border-slate-800 text-slate-400">
                Esc
              </kbd>
              <span>para cancelar</span>
            </p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-submit-flow-actividad"
              disabled={isSaving}
              onClick={() => handleGuardar()}
              className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 transition-[transform,box-shadow,opacity] duration-150 flex items-center justify-center cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{actividadEditar ? 'Actualizar Actividad' : 'Guardar Actividad'}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Alcance de Recurrencia al Guardar */}
      {mostrarModalAlcance && actividadEditar && (
        <ModalAlcanceRecurrencia
          isOpen={mostrarModalAlcance}
          accion="editar"
          tituloActividad={titulo || nombreDisplay || 'Actividad'}
          fechaActual={actividadEditar.fecha_programada}
          onSeleccionarAlcance={handleConfirmarAlcance}
          onClose={() => {
            setMostrarModalAlcance(false);
            setPayloadPendiente(null);
          }}
        />
      )}
    </div>,
    document.body
  );
};
