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

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  editarActividadConAlcance,
  eliminarActividadConAlcance
} from '../../services/habitosService';
import { sincronizarActividadCalendar } from '../../services/calendarSyncService';
import {
  vincularHabitoAMetaLocal,
  recalcularProgresoMetaLocal,
  crearMetaRapidaDesdeActividadLocal
} from '../../services/metasService';
import { ModalAlcanceRecurrencia } from './ModalAlcanceRecurrencia';
import { SeccionNotasVinculadasModal } from '../Notas/SeccionNotasVinculadasModal';
import type {
  ActividadPersonal,
  CategoriaVida,
  TipoCompromiso,
  FrecuenciaCiclo,
  SubtareaPaso,
  AlcanceRecurrencia
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
  Clock
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  formatearDuracionLegible,
  convertirStringToHorasDecimal,
  convertirHorasDecimalAString
} from '../../utils/timeFormatters';

export type TipoRecurrenciaOpcion =
  | 'NINGUNA'
  | 'DIARIA'
  | 'DIARIA_LABORAL'
  | 'FIN_SEMANA'
  | 'SEMANAL'
  | 'MENSUAL'
  | 'PERSONALIZADO';

export interface ModalActividadFlowProps {
  isOpen: boolean;
  onClose: () => void;
  actividadEditar?: ActividadPersonal | null;
  categoriaInicial?: CategoriaVida;
  alcanceEdicion?: AlcanceRecurrencia;
  onGuardadoExitoso?: (actividad: ActividadPersonal) => void;
}

interface CategoriaConfigItem {
  clave: CategoriaVida;
  nombre: string;
  dotColor: string;
  badgeClase: string;
  icono: React.ReactNode;
}

const CATEGORIAS_FLOW: CategoriaConfigItem[] = [
  {
    clave: 'SALUD_DEPORTE',
    nombre: 'Deporte & Salud',
    dotColor: 'bg-emerald-500',
    badgeClase: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icono: <HeartPulse className="w-4 h-4 text-emerald-500" />
  },
  {
    clave: 'DESARROLLO_ESTUDIO',
    nombre: 'Estudio & Mente',
    dotColor: 'bg-blue-500',
    badgeClase: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    icono: <BookOpen className="w-4 h-4 text-blue-500" />
  },
  {
    clave: 'LABORAL_HONORARIO',
    nombre: 'Trabajo & Carrera',
    dotColor: 'bg-violet-500',
    badgeClase: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60',
    icono: <Briefcase className="w-4 h-4 text-violet-500" />
  },
  {
    clave: 'FINANZAS_TRAMITES',
    nombre: 'Finanzas & Admin',
    dotColor: 'bg-purple-500',
    badgeClase: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    icono: <Wallet className="w-4 h-4 text-purple-500" />
  },
  {
    clave: 'SOCIAL_FAMILIA',
    nombre: 'Social & Familia',
    dotColor: 'bg-amber-500',
    badgeClase: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    icono: <Users className="w-4 h-4 text-amber-500" />
  },
  {
    clave: 'PERSONAL_DESCANSO',
    nombre: 'Personal & Relax',
    dotColor: 'bg-pink-500',
    badgeClase: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60',
    icono: <Coffee className="w-4 h-4 text-pink-500" />
  }
];

export const ModalActividadFlow: React.FC<ModalActividadFlowProps> = ({
  isOpen,
  onClose,
  actividadEditar,
  categoriaInicial = 'SALUD_DEPORTE',
  alcanceEdicion,
  onGuardadoExitoso
}) => {
  useBodyScrollLock(isOpen);

  // Estados base del formulario
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaVida>(categoriaInicial);
  const [menuCategoriaAbierto, setMenuCategoriaAbierto] = useState(false);
  const [tipoCompromiso, setTipoCompromiso] = useState<TipoCompromiso>('HABITUAL');
  const [prioridad, setPrioridad] = useState<'01_P1_Alta' | '02_P2_Media' | '03_P3_Baja'>('02_P2_Media');
  const [calendarSync, setCalendarSync] = useState<'Sí' | 'No'>('Sí');
  const [notas, setNotas] = useState('');

  // Fecha, Hora, Duración y Recurrencia (Google Calendar / Tasks Style)
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('08:00');
  const [duracionHoras, setDuracionHoras] = useState(1.0);
  const [duracionStr, setDuracionStr] = useState('1:00');
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

  // Metas & Planes existentes en Dexie
  const metasDisponibles = useLiveQuery(() => db.metas_planes.toArray(), []) || [];

  // Pasos / Subtareas Procedurales
  const [nuevoPasoTexto, setNuevoPasoTexto] = useState('');
  const [pasosLocales, setPasosLocales] = useState<{ id: string; numero: number; descripcion: string; completado: boolean }[]>([]);
  const [pasosInicialesJson, setPasosInicialesJson] = useState('[]');

  // Estados para selector de alcance diferido al guardar
  const [mostrarModalAlcance, setMostrarModalAlcance] = useState(false);
  const [payloadPendiente, setPayloadPendiente] = useState<ActividadPersonal | null>(null);

  // Cargar datos en edición o resetear en nuevo
  useEffect(() => {
    if (!isOpen) return;

    if (actividadEditar) {
      setTitulo(actividadEditar.nombre_actividad || '');
      setCategoria(actividadEditar.categoria_vida || categoriaInicial);
      setTipoCompromiso(actividadEditar.tipo_compromiso || 'HABITUAL');
      setCalendarSync(actividadEditar.agendado_calendar || 'Sí');
      setFecha(actividadEditar.fecha_programada || '');
      setHora(actividadEditar.hora_inicio || '08:00');
      const dur = actividadEditar.duracion_horas ?? 1.0;
      setDuracionHoras(dur);
      setDuracionStr(convertirHorasDecimalAString(dur));

      // Determinar Tipo de Recurrencia Google Style
      const freq = actividadEditar.frecuencia_ciclo;
      const regla = actividadEditar.regla_repeticion || '';

      if (freq === 'NINGUNA' || (!freq && !regla && actividadEditar.tipo_compromiso === 'PUNTUAL')) {
        setTipoRecurrencia('NINGUNA');
      } else if (freq === 'DIARIA_LABORAL' || regla === 'L-V') {
        setTipoRecurrencia('DIARIA_LABORAL');
      } else if (freq === 'FIN_SEMANA') {
        setTipoRecurrencia('FIN_SEMANA');
      } else if (freq === 'SEMANAL') {
        setTipoRecurrencia('SEMANAL');
      } else if (freq === 'MENSUAL') {
        setTipoRecurrencia('MENSUAL');
      } else if (regla.startsWith('INTERVALO:')) {
        setTipoRecurrencia('PERSONALIZADO');
      } else if (freq === 'DIARIA') {
        setTipoRecurrencia('DIARIA');
      } else {
        setTipoRecurrencia('DIARIA');
      }

      if (actividadEditar.fecha_fin) {
        setTieneFechaFin(true);
        setFechaFin(actividadEditar.fecha_fin);
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

      // Cargar subtareas desde Dexie
      db.subtareas_pasos
        .where('id_padre_vinculado')
        .equals(actividadEditar.codigo_legado)
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
            setPasosInicialesJson(JSON.stringify(mapped));
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
      const hoy = new Date().toISOString().split('T')[0];
      setFecha(hoy);
      setHora('08:00');
      setDuracionHoras(1.0);
      setDuracionStr('1:00');
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
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, mostrarModalAlcance]);

  // Consultas reactivas en Dexie para vinculaciones
  const listaGastos = useLiveQuery(() => db.gastos.orderBy('fecha_gasto').reverse().limit(50).toArray()) || [];

  if (!isOpen) return null;

  const categoriaActual = CATEGORIAS_FLOW.find((c) => c.clave === categoria) || CATEGORIAS_FLOW[0];

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

  // Detección de Dirty State (comparación con el snapshot inicial)
  const verificarSiHayCambios = (payload: ActividadPersonal): boolean => {
    if (!actividadEditar) return true;

    const nombreCambio = payload.nombre_actividad.trim() !== (actividadEditar.nombre_actividad || '').trim();
    const catCambio = payload.categoria_vida !== actividadEditar.categoria_vida;
    const tipoCambio = payload.tipo_compromiso !== actividadEditar.tipo_compromiso;
    const fechaCambio = payload.fecha_programada !== (actividadEditar.fecha_programada || '');
    const fechaFinCambio = (payload.fecha_fin || '') !== (actividadEditar.fecha_fin || '');
    const horaCambio = payload.hora_inicio !== (actividadEditar.hora_inicio || '08:00');
    const duracionCambio = (payload.duracion_horas ?? 0) !== (actividadEditar.duracion_horas ?? 0);
    const syncCambio = payload.agendado_calendar !== (actividadEditar.agendado_calendar || 'Sí');
    const freqCambio = (payload.frecuencia_ciclo || 'DIARIA') !== (actividadEditar.frecuencia_ciclo || 'DIARIA');
    const reglaCambio = (payload.regla_repeticion || '') !== (actividadEditar.regla_repeticion || '');
    const notasCambio = (payload.notas_checklist || '').trim() !== (actividadEditar.notas_checklist || '').trim();
    const gastoCambio = (payload.monto_gasto_asociado || 0) !== (actividadEditar.monto_gasto_asociado || 0);
    const macroCambio = (payload.meta_macro_nombre || '').trim() !== (actividadEditar.meta_macro_nombre || '').trim();
    const unidadCambio = (payload.unidad_medida || '').trim() !== (actividadEditar.unidad_medida || '').trim();
    const metaTotCambio = (payload.meta_objetivo_total || 0) !== (actividadEditar.meta_objetivo_total || 0);
    const metaDiaCambio = (payload.meta_diaria_estandar || 0) !== (actividadEditar.meta_diaria_estandar || 0);
    const rescMinCambio = (payload.nivel_rescate_minimo || 0) !== (actividadEditar.nivel_rescate_minimo || 0);
    const pasosCambio = JSON.stringify(pasosLocales) !== pasosInicialesJson;
    const vinculoCambio = metaSeleccionadaId !== metaIdInicial;

    return (
      nombreCambio ||
      catCambio ||
      tipoCambio ||
      fechaCambio ||
      fechaFinCambio ||
      horaCambio ||
      duracionCambio ||
      syncCambio ||
      freqCambio ||
      reglaCambio ||
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
      await editarActividadConAlcance(
        actividadEditar,
        payloadAguardar,
        alcance,
        actividadEditar.fecha_programada
      );
    } else {
      await db.actividades_personales.put(payloadAguardar);
      if (calendarSync === 'Sí') {
        sincronizarActividadCalendar(payloadAguardar, 'UPSERT', { alcance: 'ALL', fechaRef: payloadAguardar.fecha_programada })
          .catch((e) => console.warn('[ModalActividadFlow] Fallo en sincronización inicial Calendar:', e));
      }
    }

    // Persistir subtareas asociadas en db.subtareas_pasos
    if (pasosLocales.length > 0 && codigoLegado) {
      await db.subtareas_pasos.where('id_padre_vinculado').equals(codigoLegado).delete();
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
        fecha_gasto: fecha || nowIso.split('T')[0],
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

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: actividadEditar ? 'Hábito actualizado con éxito' : 'Hábito registrado en Life OS',
      showConfirmButton: false,
      timer: 2000,
      background: '#0D1526',
      color: '#f8fafc'
    });

    if (onGuardadoExitoso) onGuardadoExitoso(payloadAguardar);
    setPayloadPendiente(null);
    onClose();
  };

  // Guardar en Dexie con Dirty Checking y confirmación diferida de alcance
  const handleGuardar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!titulo.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'El título de la actividad es requerido',
        showConfirmButton: false,
        timer: 2000,
        background: '#0D1526',
        color: '#f8fafc'
      });
      return;
    }

    const nowIso = new Date().toISOString();
    let codigoLegado = actividadEditar?.codigo_legado;
    let idActividad = actividadEditar?.id;

    if (!actividadEditar) {
      idActividad = crypto.randomUUID();
      const count = await db.actividades_personales.count();
      codigoLegado = `ACT-${String(count + 1).padStart(3, '0')}`;
    }

    const montoGastoFinal = parseFloat(gastoMonto) || undefined;

    let metaMacroNombre = metaMacro.trim();
    if (metaSeleccionadaId === '__CREAR_NUEVA__') {
      metaMacroNombre = nombreNuevaMeta.trim() || titulo.trim() || 'Nueva Meta';
    } else if (metaSeleccionadaId && metaSeleccionadaId !== '__TEXTO_LIBRE__') {
      metaMacroNombre = metasDisponibles.find((m) => m.id === metaSeleccionadaId)?.nombre_meta || metaMacro.trim();
    }

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

    const tipoCompromisoFinal: TipoCompromiso =
      tipoRecurrencia === 'NINGUNA' ? 'PUNTUAL' : metaTotal ? 'META' : tipoCompromiso === 'PUNTUAL' ? 'HABITUAL' : tipoCompromiso;

    const fechaFinFinal = (tipoRecurrencia === 'PERSONALIZADO' && tieneFechaFin && fechaFin)
      ? fechaFin
      : undefined;

    const payload: ActividadPersonal = {
      id: idActividad!,
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: codigoLegado!,
      nombre_actividad: titulo.trim(),
      tipo_compromiso: tipoCompromisoFinal,
      categoria_vida: categoria,
      meta_macro_nombre: metaMacroNombre || undefined,
      unidad_medida: unidadMedida.trim() || undefined,
      meta_objetivo_total: parseFloat(metaTotal) || undefined,
      valor_acumulado_actual: parseFloat(valorAcumulado) || 0,
      meta_diaria_estandar: parseFloat(metaDiaria) || undefined,
      nivel_rescate_minimo: parseFloat(rescateMinimo) || undefined,
      estado: actividadEditar?.estado || '01_Backlog',
      racha_actual: actividadEditar?.racha_actual || 0,
      fecha_programada: fecha || new Date().toISOString().split('T')[0],
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

    if (actividadEditar) {
      // 1. Detección de cambios reales (Dirty Checking)
      const isDirty = verificarSiHayCambios(payload);
      if (!isDirty) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Sin cambios detectados',
          showConfirmButton: false,
          timer: 1600,
          background: '#0D1526',
          color: '#f8fafc'
        });
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
    if (!payloadPendiente) return;
    setMostrarModalAlcance(false);
    await commitGuardado(payloadPendiente, alcance);
  };

  // Eliminar actividad
  const handleEliminar = async () => {
    if (!actividadEditar) return;
    const result = await Swal.fire({
      title: '¿Eliminar actividad?',
      text: `Se borrará "${actividadEditar.nombre_actividad}" y sus pasos procedurales.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#475569',
      background: '#0D1526',
      color: '#f8fafc'
    });

    if (result.isConfirmed) {
      await eliminarActividadConAlcance(
        actividadEditar.id,
        alcanceEdicion || 'ALL',
        actividadEditar.fecha_programada
      );
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Actividad eliminada',
        showConfirmButton: false,
        timer: 2000,
        background: '#0D1526',
        color: '#f8fafc'
      });
      onClose();
    }
  };

  return createPortal(
    <div
      id="modal-actividad-flow"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[10000] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all"
    >
      <div
        id="modal-actividad-flow-card"
        className="portal-surface elevation-3 w-full max-w-2xl max-h-[90vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1526] shadow-2xl relative transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        {/* Drag handle móvil */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* 1. CABECERA INTEGRADA EN 2 FILAS (1:1 con ModalTareaFlow) */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
          {/* Fila 1: ID, Selector Categoría de Vida con micro-punto semántico, Badge Recurrencia/Racha y botón cerrar */}
          <div className="flex items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
              {/* ID de Actividad */}
              <span
                id="act-flow-badge-id"
                className="text-[11px] font-mono tabular-nums font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200 border border-slate-700/60 shadow-2xs shrink-0 select-none"
              >
                {actividadEditar?.codigo_legado || 'NUEVA ACTIVIDAD'}
              </span>

              {/* Selector compacto de Categoría de Vida con micro-punto semántico */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  id="flow-cat-badge-btn"
                  onClick={() => setMenuCategoriaAbierto(!menuCategoriaAbierto)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border transition cursor-pointer ${categoriaActual.badgeClase}`}
                  title="Cambiar Categoría de Vida"
                >
                  <span className={`w-2 h-2 rounded-full ${categoriaActual.dotColor} shrink-0`} />
                  <span>{categoriaActual.nombre}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {menuCategoriaAbierto && (
                  <div
                    id="flow-cat-dropdown"
                    className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#0D1526] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95"
                  >
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-2 py-1 uppercase tracking-wider">
                      Categoría de Vida:
                    </p>
                    {CATEGORIAS_FLOW.map((cat) => (
                      <button
                        key={cat.clave}
                        type="button"
                        onClick={() => {
                          setCategoria(cat.clave);
                          setMenuCategoriaAbierto(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                          categoria === cat.clave
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${cat.dotColor}`} />
                        <span>{cat.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-slate-600 select-none shrink-0">|</span>

              {/* Badge de Frecuencia / Recurrencia */}
              <span
                id="act-flow-frecuencia-badge"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold rounded-lg border border-slate-800/80 bg-slate-900/60 text-slate-300 select-none shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
                <span>
                  {tipoRecurrencia === 'NINGUNA'
                    ? 'No se repite'
                    : tipoRecurrencia === 'DIARIA'
                    ? 'Diario'
                    : tipoRecurrencia === 'DIARIA_LABORAL'
                    ? 'Lun a Vie'
                    : tipoRecurrencia === 'FIN_SEMANA'
                    ? 'Fines de semana'
                    : tipoRecurrencia === 'SEMANAL'
                    ? 'Semanal'
                    : tipoRecurrencia === 'MENSUAL'
                    ? 'Mensual'
                    : 'Personalizado'}
                </span>
              </span>

              {/* Racha Badge si existe racha > 0 */}
              {(actividadEditar?.racha_actual || 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold font-mono tabular-nums rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 select-none shrink-0">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>{actividadEditar?.racha_actual} días</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 ml-1"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fila 2: Título Editable Prominente */}
          <div className="pt-0.5">
            <input
              type="text"
              id="act-flow-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nombre del hábito o actividad personal..."
              className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-500 bg-transparent outline-none w-full border-b border-transparent focus:border-indigo-500 transition-colors py-0.5"
              autoFocus
            />
          </div>
        </div>

        {/* 2. CUERPO DE CONTENIDO CON SCROLL */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-4 custom-scrollbar text-xs">

          {/* BENTO GRID DE 2 TARJETAS */}
          <div className="bg-[#040711] border border-slate-800/80 rounded-xl p-3 sm:p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* TARJETA BENTO 1: TIEMPO & PROGRAMACIÓN */}
              <div className="bg-[#0D1526] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tiempo & Programación</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Fecha y Hora */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Fecha Programada</label>
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono tabular-nums outline-none text-slate-200 focus:border-sky-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Hora Inicio</label>
                      <input
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono tabular-nums outline-none text-slate-200 focus:border-sky-500/50"
                      />
                    </div>
                  </div>

                  {/* Frecuencia de Repetición (Google Style) */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Frecuencia / Repetición</label>
                    <div className="relative">
                      <select
                        value={tipoRecurrencia}
                        onChange={(e) => {
                          const val = e.target.value as TipoRecurrenciaOpcion;
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
                        className="w-full bg-[#040711] px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs font-medium text-slate-200 outline-none focus:border-sky-500/50 appearance-none cursor-pointer pr-7"
                      >
                        <option value="NINGUNA" className="bg-[#0D1526] text-slate-200">No se repite</option>
                        <option value="DIARIA" className="bg-[#0D1526] text-slate-200">Todos los días</option>
                        <option value="DIARIA_LABORAL" className="bg-[#0D1526] text-slate-200">De lunes a viernes</option>
                        <option value="FIN_SEMANA" className="bg-[#0D1526] text-slate-200">Fines de semana</option>
                        <option value="SEMANAL" className="bg-[#0D1526] text-slate-200">Cada semana</option>
                        <option value="MENSUAL" className="bg-[#0D1526] text-slate-200">Cada mes</option>
                        <option value="PERSONALIZADO" className="bg-[#0D1526] text-slate-200">Personalizado...</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Grilla circular táctica de días (L M M J V S D) cuando aplica */}
                  {(tipoRecurrencia === 'SEMANAL' || tipoRecurrencia === 'PERSONALIZADO') && (
                    <div className="pt-1">
                      <label className="text-[10px] text-slate-400 block mb-1">Repetir el</label>
                      <div className="flex items-center justify-between gap-1">
                        {[
                          { id: 'LU', label: 'L' },
                          { id: 'MA', label: 'M' },
                          { id: 'MI', label: 'M' },
                          { id: 'JU', label: 'J' },
                          { id: 'VI', label: 'V' },
                          { id: 'SA', label: 'S' },
                          { id: 'DO', label: 'D' }
                        ].map(({ id, label }) => {
                          const activo = diasSemana.includes(id);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                if (activo) {
                                  if (diasSemana.length > 1) {
                                    setDiasSemana(diasSemana.filter((d) => d !== id));
                                  }
                                } else {
                                  setDiasSemana([...diasSemana, id]);
                                }
                              }}
                              className={`w-7 h-7 rounded-full text-xs font-mono font-bold transition flex items-center justify-center cursor-pointer ${
                                activo
                                  ? 'bg-sky-500 text-slate-950 font-black shadow-[0_0_8px_rgba(14,165,233,0.4)]'
                                  : 'bg-[#040711] text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                              }`}
                              title={id}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Configuración avanzada de Personalizado (Intervalo y Fin) */}
                  {tipoRecurrencia === 'PERSONALIZADO' && (
                    <div className="pt-2 space-y-2 border-t border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 shrink-0">Repetir cada</span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={intervaloRepeticion}
                          onChange={(e) => setIntervaloRepeticion(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-14 bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono tabular-nums text-center text-slate-200 outline-none focus:border-sky-500/50"
                        />
                        <select
                          value={unidadIntervalo}
                          onChange={(e) => setUnidadIntervalo(e.target.value as 'dias' | 'semanas' | 'meses')}
                          className="bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 cursor-pointer"
                        >
                          <option value="dias" className="bg-[#0D1526]">día(s)</option>
                          <option value="semanas" className="bg-[#0D1526]">semana(s)</option>
                          <option value="meses" className="bg-[#0D1526]">mes(es)</option>
                        </select>
                      </div>

                      {/* Fecha de término */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">Finaliza</label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="finRecurrencia"
                              checked={!tieneFechaFin}
                              onChange={() => setTieneFechaFin(false)}
                              className="text-sky-500 focus:ring-sky-500"
                            />
                            <span>Nunca</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="finRecurrencia"
                              checked={tieneFechaFin}
                              onChange={() => setTieneFechaFin(true)}
                              className="text-sky-500 focus:ring-sky-500"
                            />
                            <span>El</span>
                          </label>
                          {tieneFechaFin && (
                            <input
                              type="date"
                              value={fechaFin}
                              onChange={(e) => setFechaFin(e.target.value)}
                              className="flex-1 bg-[#040711] px-2 py-0.5 rounded-lg border border-slate-800 text-xs font-mono tabular-nums text-slate-200 outline-none focus:border-sky-500/50"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estimación de Duración Desacoplada (Formato H:MM / Xh Ymin) */}
                  <div className="pt-2 space-y-1.5 border-t border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" />
                        <span>Duración Estimada</span>
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
                        <span>Micro-Acción (0min)</span>
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
                        title="Duración en formato H:MM o minutos (ej. 1:30, 45m)"
                      />
                      <span className="text-[11px] font-mono tabular-nums text-sky-400 font-semibold">
                        ({formatearDuracionLegible(duracionHoras)})
                      </span>
                    </div>

                    {/* Botones rápidos de duración */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {[
                        { label: '15min', horas: 0.25 },
                        { label: '30min', horas: 0.5 },
                        { label: '45min', horas: 0.75 },
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
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-bold transition cursor-pointer ${
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
                  <div className="pt-1.5 flex items-center justify-between text-[11px] border-t border-slate-800/60">
                    <span className="text-slate-400">Agendar en Calendar</span>
                    <button
                      type="button"
                      onClick={() => setCalendarSync(calendarSync === 'Sí' ? 'No' : 'Sí')}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        calendarSync === 'Sí'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-[#040711] border border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {calendarSync === 'Sí' && <Check className="w-3 h-3" />}
                      <span>{calendarSync === 'Sí' ? 'Sí' : 'No'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* TARJETA BENTO 2: OPERATIVO & METAS ESTRATÉGICAS */}
              <div className="bg-[#0D1526] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-sky-400" />
                    <span>Operativo & Metas Estratégicas</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Micro-riel Prioridad Eisenhower */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Prioridad Operativa</label>
                    <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#040711] rounded-lg border border-slate-800">
                      {(
                        [
                          { id: '01_P1_Alta', label: 'P1 Urgente', dot: 'bg-rose-400' },
                          { id: '02_P2_Media', label: 'P2 Media', dot: 'bg-amber-400' },
                          { id: '03_P3_Baja', label: 'P3 Baja', dot: 'bg-emerald-400' }
                        ] as const
                      ).map((p) => {
                        const activo = prioridad === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPrioridad(p.id)}
                            className={`py-1 rounded-md text-[10px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                              activo
                                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                            <span>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector y Vinculación a Metas & Planes */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] text-slate-400">Meta o Plan Estratégico</label>
                      <button
                        type="button"
                        onClick={() => setModoMetaManual(!modoMetaManual)}
                        className="text-[10px] text-sky-400 hover:text-sky-300 transition cursor-pointer"
                      >
                        {modoMetaManual ? 'Seleccionar existente' : '+ Nueva meta rápida'}
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
                        placeholder="Nombre del nuevo objetivo estratégico..."
                        className="w-full bg-[#040711] px-2.5 py-1 rounded-lg border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50"
                      />
                    ) : (
                      <select
                        value={metaSeleccionadaId}
                        onChange={(e) => handleCambiarMetaSeleccionada(e.target.value)}
                        className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 cursor-pointer"
                      >
                        <option value="">Sin vinculación a metas</option>
                        {metasDisponibles.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.codigo_legado ? `${m.codigo_legado} · ${m.nombre_meta}` : m.nombre_meta}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Métricas Cuantitativas: Unidad, Objetivo, Acumulado y Rescate */}
                  <div className="pt-1 border-t border-slate-800/60 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Unidad de Medida</label>
                        <input
                          type="text"
                          placeholder="km, págs, vasos..."
                          value={unidadMedida}
                          onChange={(e) => setUnidadMedida(e.target.value)}
                          className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Meta Objetivo</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="100"
                          value={metaTotal}
                          onChange={(e) => setMetaTotal(e.target.value)}
                          className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono tabular-nums text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Valor Acumulado</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="0"
                          value={valorAcumulado}
                          onChange={(e) => setValorAcumulado(e.target.value)}
                          className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono tabular-nums text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Rescate Racha Mínimo</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="Mínimo diario"
                          value={rescateMinimo}
                          onChange={(e) => setRescateMinimo(e.target.value)}
                          className="w-full bg-[#040711] px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono tabular-nums text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACORDEÓN CANÓNICO DE GASTOS ASOCIADOS */}
          <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-[#0D1526]">
            <button
              type="button"
              onClick={() => setMostrarGasto(!mostrarGasto)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30 transition-all duration-150 cursor-pointer"
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
                  className={`w-4 h-4 text-emerald-400 transition-transform duration-200 ${
                    mostrarGasto ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {mostrarGasto && (
              <div className="p-3.5 border-t border-emerald-500/20 bg-[#0D1526] space-y-3">
                {/* Selector de Pestaña Superior: Modo Dual */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Modo de Imputación
                  </span>
                  <div className="inline-flex p-0.5 bg-[#040711] rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setTabGasto('NUEVO')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        tabGasto === 'NUEVO'
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
                      className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        tabGasto === 'VINCULAR'
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
                              className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                                gastoMoneda === m ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Categoría Contable</label>
                        <select
                          value={gastoCategoria}
                          onChange={(e) => setGastoCategoria(e.target.value)}
                          className="w-full bg-[#040711] px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 cursor-pointer"
                        >
                          <option value="Personal_Salud">Salud & Bienestar</option>
                          <option value="Educacion_Libros">Educación & Libros</option>
                          <option value="Equipamiento_Herramientas">Equipamiento & Herramientas</option>
                          <option value="Suscripciones_Software">Suscripciones & Apps</option>
                          <option value="Alimentacion_Nutricion">Nutrición & Suplementos</option>
                          <option value="Otros">Otros</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Concepto / Glosa Detallada</label>
                        <input
                          type="text"
                          value={gastoConcepto}
                          onChange={(e) => setGastoConcepto(e.target.value)}
                          placeholder="Ej. Membresía gimnasio, suplementos, zapatillas..."
                          className="w-full bg-[#040711] px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-500"
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
                              className={`p-2.5 rounded-xl flex items-center justify-between text-xs cursor-pointer border transition-all ${
                                isSelected
                                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-xs'
                                  : 'bg-[#040711] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-[10px] text-sky-400 bg-sky-950/50 px-1.5 py-0.2 rounded border border-sky-800/40 shrink-0">
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





          {/* 4. BLOQUE PROCEDURAL DE SUBTAREAS / PASOS */}
          <div className="p-3.5 bg-[#040711] border border-slate-800/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-black">
                  <ListOrdered className="w-4 h-4" />
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

            {/* Barra de progreso con gradiente */}
            {pasosLocales.length > 0 && (
              <div className="w-full bg-[#0D1526] h-1.5 rounded-full overflow-hidden border border-slate-800/40">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progresoPasos}%` }}
                />
              </div>
            )}

            {/* Lista de pasos */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
              {pasosLocales.length === 0 ? (
                <p className="text-center py-2.5 text-[11px] text-slate-500 italic">No hay pasos secuenciales agregados.</p>
              ) : (
                pasosLocales.map((paso) => (
                  <div
                    key={paso.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg border text-xs group transition-colors bg-[#0D1526] border-slate-800/80 hover:border-slate-700"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => togglePasoCompletado(paso.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition cursor-pointer ${
                          paso.completado
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                        }`}
                      >
                        {paso.completado && <Check className="w-3 h-3 stroke-[3]" />}
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
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
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
                className="flex-1 border border-slate-800 rounded-lg px-3 py-1.5 text-xs bg-[#0D1526] text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50"
              />
              <button
                type="button"
                onClick={agregarPaso}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                title="Agregar paso"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 5. APUNTES Y NOTAS RÁPIDAS DE EJECUCIÓN */}
          <div className="space-y-1.5">
            <label className="block font-bold text-xs text-slate-400">
              Apuntes y Notas Rápidas de Ejecución
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Añadir notas, observaciones o apuntes rápidos..."
              className="w-full bg-[#040711] border border-slate-800/80 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500/50 transition resize-y custom-scrollbar"
            />
          </div>

          {/* 6. SECCIÓN DINÁMICA DE NOTAS VINCULADAS */}
          <SeccionNotasVinculadasModal
            codigoEntidad={actividadEditar?.codigo_legado || ''}
            tipoEntidad="HABITO"
            tituloEntidad={titulo || actividadEditar?.nombre_actividad || 'Actividad'}
          />
        </div>

        {/* 7. FOOTER DE ACCIONES */}
        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-800 bg-[#0D1526] flex items-center justify-between gap-3">
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
              onClick={() => handleGuardar()}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition cursor-pointer"
            >
              {actividadEditar ? 'Actualizar Actividad' : 'Guardar Actividad'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Alcance de Recurrencia al Guardar */}
      {mostrarModalAlcance && actividadEditar && (
        <ModalAlcanceRecurrencia
          isOpen={mostrarModalAlcance}
          accion="editar"
          tituloActividad={actividadEditar.nombre_actividad}
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
