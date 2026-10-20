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
  Clock,
  Zap,
  Receipt,
  CalendarCheck,
  FileText,
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
  ListOrdered
} from 'lucide-react';
import Swal from 'sweetalert2';

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

  // Fecha, Hora y Recurrencia
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('08:00');
  const [duracionHoras, setDuracionHoras] = useState(1.0);
  const [esPuntual, setEsPuntual] = useState(false);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaCiclo>('DIARIA');
  const [diasSemana, setDiasSemana] = useState<string[]>(['LU', 'MA', 'MI', 'JU', 'VI']);
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState<'DIA' | 'SEMANA' | 'MES'>('SEMANA');
  const [repeatEnd, setRepeatEnd] = useState<'NUNCA' | 'CONTEO'>('NUNCA');
  const [repeatCount, setRepeatCount] = useState(10);

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
  const [mostrarMetas, setMostrarMetas] = useState(false);
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

  // Sección Notas Vinculadas
  const [mostrarNotas, setMostrarNotas] = useState(false);
  const [notasSearch, setNotasSearch] = useState('');
  const [notaVinculadaId, setNotaVinculadaId] = useState<string | null>(null);

  // Pasos / Subtareas Procedurales
  const [mostrarPasos, setMostrarPasos] = useState(false);
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
      setDuracionHoras(actividadEditar.duracion_horas || 1.0);
      setEsPuntual(actividadEditar.duracion_horas === 0 || actividadEditar.tipo_compromiso === 'PUNTUAL');
      setFrecuencia(actividadEditar.frecuencia_ciclo || 'DIARIA');
      if (actividadEditar.regla_repeticion) {
        const rawRegla = actividadEditar.regla_repeticion.startsWith('DIAS:')
          ? actividadEditar.regla_repeticion.substring(5)
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
      if (actividadEditar.meta_macro_nombre || actividadEditar.meta_objetivo_total) {
        setMostrarMetas(true);
      }

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
            setMostrarPasos(true);
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
      setEsPuntual(false);
      setFrecuencia('DIARIA');
      setDiasSemana(['LU', 'MA', 'MI', 'JU', 'VI']);
      setMostrarDatePicker(false);
      setMostrarGasto(false);
      setGastoMonto('');
      setGastoConcepto('');
      setGastoVinculadoId(null);
      setMostrarMetas(false);
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
      setMostrarNotas(false);
      setNotaVinculadaId(null);
      setMostrarPasos(false);
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
  const listaGastos = useLiveQuery(() => db.gastos.orderBy('fecha_gasto').reverse().limit(15).toArray()) || [];
  const listaNotas = useLiveQuery(() => db.notas.orderBy('updated_at').reverse().limit(15).toArray()) || [];

  if (!isOpen) return null;

  const categoriaActual = CATEGORIAS_FLOW.find((c) => c.clave === categoria) || CATEGORIAS_FLOW[0];

  // Alternar prioridad cíclica
  const ciclarPrioridad = () => {
    if (prioridad === '01_P1_Alta') setPrioridad('02_P2_Media');
    else if (prioridad === '02_P2_Media') setPrioridad('03_P3_Baja');
    else setPrioridad('01_P1_Alta');
  };

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
    const horaCambio = payload.hora_inicio !== (actividadEditar.hora_inicio || '08:00');
    const duracionCambio = (payload.duracion_horas ?? 0) !== (actividadEditar.duracion_horas ?? 0);
    const syncCambio = payload.agendado_calendar !== (actividadEditar.agendado_calendar || 'Sí');
    const freqCambio = payload.frecuencia_ciclo !== (actividadEditar.frecuencia_ciclo || 'DIARIA');
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

    const payload: ActividadPersonal = {
      id: idActividad!,
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: codigoLegado!,
      nombre_actividad: titulo.trim(),
      tipo_compromiso: esPuntual ? 'PUNTUAL' : metaTotal ? 'META' : tipoCompromiso,
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
      hora_inicio: hora || '08:00',
      duracion_horas: esPuntual ? 0 : duracionHoras,
      agendado_calendar: calendarSync,
      id_evento_calendar: actividadEditar?.id_evento_calendar,
      monto_gasto_asociado: montoGastoFinal,
      notas_checklist: notas.trim() || undefined,
      frecuencia_ciclo: frecuencia,
      regla_repeticion: diasSemana.length > 0 ? `DIAS:${diasSemana.join(',')}` : '',
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
        (frecuencia && frecuencia !== 'NINGUNA') ||
        (actividadEditar.frecuencia_ciclo && actividadEditar.frecuencia_ciclo !== 'NINGUNA') ||
        (actividadEditar.regla_repeticion && actividadEditar.regla_repeticion.trim() !== '')
      );
      const esRutinaria = payload.tipo_compromiso === 'HABITUAL' || actividadEditar.tipo_compromiso === 'HABITUAL' || tieneRecurrencia;

      // 3. Si es recurrente y la frecuencia NO es NINGUNA: solicitar alcance al guardar
      if (esRutinaria && frecuencia !== 'NINGUNA') {
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
      className="fixed inset-0 z-[10000] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-actividad-flow-card"
        className="portal-surface elevation-3 w-full max-w-xl max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative bg-white dark:bg-[#0D1526] text-slate-800 dark:text-slate-100"
      >
        {/* Drag handle móvil */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        {/* CABECERA: CATEGORÍA HEREDADA + MODO + CERRAR */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 bg-white/50 dark:bg-slate-900/50">
          {/* Chip de Categoría con Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="flow-cat-badge-btn"
              onClick={() => setMenuCategoriaAbierto(!menuCategoriaAbierto)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition shadow-2xs hover:scale-[1.02] active:scale-95 cursor-pointer ${categoriaActual.badgeClase}`}
              title="Cambiar Categoría de Vida"
            >
              <span className={`w-2 h-2 rounded-full ${categoriaActual.dotColor} inline-block`} />
              <span>{categoriaActual.nombre}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {menuCategoriaAbierto && (
              <div
                id="flow-cat-dropdown"
                className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#0D1526] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-1 animate-fadeIn"
              >
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-2 py-1 uppercase tracking-wider">
                  Vincular a Categoría de Vida:
                </p>
                {CATEGORIAS_FLOW.map((cat) => (
                  <button
                    key={cat.clave}
                    type="button"
                    onClick={() => {
                      setCategoria(cat.clave);
                      setMenuCategoriaAbierto(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
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

          <div className="flex items-center gap-2">
            <span
              id="flow-badge-modo"
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono"
            >
              {actividadEditar ? `Editar (${actividadEditar.codigo_legado})` : 'Nuevo Hábito'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CUERPO DE CONTENIDO CON SCROLL EXCLUSIVO VERTICAL */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-4 custom-scrollbar text-xs">
          {/* INPUT DE TÍTULO PRINCIPAL (GOOGLE TASKS STYLE) */}
          <div>
            <input
              type="text"
              id="act-flow-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 bg-transparent outline-none border-b border-transparent focus:border-indigo-500/40 pb-1.5 transition-colors"
              placeholder="Añadir título (ej. Salir a correr 5k, Meditación matutina...)"
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* BARRA DE CHIPS DE CONFIGURACIÓN RÁPIDA */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Chip Fecha y Hora */}
            <button
              type="button"
              id="flow-chip-datetime"
              onClick={() => setMostrarDatePicker(!mostrarDatePicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700/60 transition shadow-2xs group cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500" />
              <span>{fecha ? `${fecha} ${hora}` : 'Fecha y hora'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
            </button>

            {/* Chip Prioridad Eisenhower */}
            <button
              type="button"
              id="flow-chip-prioridad"
              onClick={ciclarPrioridad}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 transition shadow-2xs cursor-pointer"
              title="Clic para cambiar prioridad"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {prioridad === '01_P1_Alta' ? 'P1 Alta' : prioridad === '02_P2_Media' ? 'P2 Media' : 'P3 Baja'}
              </span>
            </button>

            {/* Chip Gasto Asociado */}
            <button
              type="button"
              id="flow-chip-gasto"
              onClick={() => setMostrarGasto(!mostrarGasto)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition shadow-2xs cursor-pointer ${
                gastoMonto
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-300'
              }`}
              title="Imputar gasto a este hábito"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{gastoMonto ? `S/ ${gastoMonto}` : 'Gasto'}</span>
            </button>

            {/* Chip Google Calendar */}
            <button
              type="button"
              id="flow-chip-calendar"
              onClick={() => setCalendarSync(calendarSync === 'Sí' ? 'No' : 'Sí')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition shadow-2xs cursor-pointer ${
                calendarSync === 'Sí'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800/70'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-slate-200/80 dark:border-slate-700/60'
              }`}
              title="Alternar sincronización con Calendar"
            >
              <CalendarCheck className={`w-3.5 h-3.5 ${calendarSync === 'Sí' ? 'text-blue-500' : 'text-slate-400'}`} />
              <span>Calendar: {calendarSync}</span>
            </button>

            {/* Chip Meta Cuantitativa / OKR */}
            <button
              type="button"
              id="flow-chip-meta"
              onClick={() => setMostrarMetas(!mostrarMetas)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition shadow-2xs cursor-pointer ${
                mostrarMetas || metaTotal
                  ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60 hover:border-cyan-400'
              }`}
              title="Configurar Meta Cuantificable y Rescate de Racha"
            >
              <Target className="w-3.5 h-3.5 text-cyan-500" />
              <span>{metaTotal ? `Meta: ${metaTotal} ${unidadMedida}` : 'Meta Cuantitativa'}</span>
            </button>

            {/* Chip Notas */}
            <button
              type="button"
              id="act-flow-chip-notas"
              onClick={() => setMostrarNotas(!mostrarNotas)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60 hover:border-purple-400 transition shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              <span>+ Notas</span>
            </button>
          </div>

          {/* POPOVER / SECCIÓN DE FECHA, HORA Y RECURRENCIA */}
          {mostrarDatePicker && (
            <div className="p-4 bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-750 pb-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>Programación Temporal & Recurrencia</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarDatePicker(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Selector de Fecha y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    Fecha de Ejecución
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              {/* Presets de Hora */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { label: '07:00 AM Mañana', val: '07:00' },
                  { label: '10:00 AM Media m.', val: '10:00' },
                  { label: '02:00 PM Tarde', val: '14:00' },
                  { label: '08:30 PM Noche', val: '20:30' }
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setHora(preset.val)}
                    className="py-1 px-2 text-[10.5px] rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-600 dark:text-slate-300 text-center transition cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Toggle Puntual vs Duración */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">⚡ Micro-Acción (Check instantáneo · 0 min)</p>
                  <p className="text-[10px] text-slate-400">Sin bloqueo de tiempo en agenda</p>
                </div>
                <input
                  type="checkbox"
                  checked={esPuntual}
                  onChange={(e) => setEsPuntual(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
              </div>

              {!esPuntual && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Duración estimada:</span>
                  <div className="flex items-center gap-1.5">
                    {[0.25, 0.5, 1.0, 1.5, 2.0].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setDuracionHoras(h)}
                        className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] transition cursor-pointer ${
                          duracionHoras === h
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recurrencia */}
              <div>
                <label className="block font-semibold text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  Frecuencia de Repetición
                </label>
                <select
                  value={frecuencia}
                  onChange={(e) => setFrecuencia(e.target.value as FrecuenciaCiclo)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900 font-medium text-xs outline-none"
                >
                  <option value="NINGUNA">🎯 Instancia Única (Sin repetición)</option>
                  <option value="DIARIA">🔄 Recurrencia Diaria</option>
                  <option value="DIARIA_LABORAL">🔄 Días Laborales (Lun-Vie)</option>
                  <option value="FIN_SEMANA">🔄 Fines de Semana (Sáb-Dom)</option>
                  <option value="SEMANAL">🔄 Recurrencia Semanal</option>
                  <option value="MENSUAL">🔄 Recurrencia Mensual</option>
                </select>
              </div>

              {frecuencia === 'SEMANAL' && (
                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                  <label className="block font-semibold text-[10px] text-slate-500 dark:text-slate-400">
                    Días de la semana
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].map((dia) => {
                      const activo = diasSemana.includes(dia);
                      return (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => {
                            if (activo) {
                              setDiasSemana(diasSemana.filter((d) => d !== dia));
                            } else {
                              setDiasSemana([...diasSemana, dia]);
                            }
                          }}
                          className={`w-8 h-8 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            activo
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-400'
                          }`}
                        >
                          {dia}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <span>Repetir cada:</span>
                    <input
                      type="number"
                      min={1}
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                      className="w-14 p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono"
                    />
                    <select
                      value={repeatUnit}
                      onChange={(e) => setRepeatUnit(e.target.value as 'DIA' | 'SEMANA' | 'MES')}
                      className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="DIA">Día(s)</option>
                      <option value="SEMANA">Semana(s)</option>
                      <option value="MES">Mes(es)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <span>Finaliza:</span>
                    <select
                      value={repeatEnd}
                      onChange={(e) => setRepeatEnd(e.target.value as 'NUNCA' | 'CONTEO')}
                      className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="NUNCA">Nunca</option>
                      <option value="CONTEO">Después de</option>
                    </select>
                    {repeatEnd === 'CONTEO' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          value={repeatCount}
                          onChange={(e) => setRepeatCount(parseInt(e.target.value) || 1)}
                          className="w-14 p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono"
                        />
                        <span>veces</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN GASTO ASOCIADO DESPLEGABLE */}
          {mostrarGasto && (
            <div
              id="flow-gasto-container"
              className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-3.5 space-y-3 animate-fadeIn"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-bold text-emerald-900 dark:text-emerald-200 leading-tight">Gasto Asociado</p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Imputación financiera en Life OS</p>
                  </div>
                </div>

                <div className="inline-flex p-0.5 bg-emerald-100/80 dark:bg-emerald-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTabGasto('NUEVO')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      tabGasto === 'NUEVO'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    Registrar Nuevo
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabGasto('VINCULAR')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      tabGasto === 'VINCULAR'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    Vincular Existente
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarGasto(false)}
                  className="p-1 rounded-md text-emerald-700 dark:text-emerald-400 hover:text-emerald-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {tabGasto === 'NUEVO' ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    {/* Divisa */}
                    <div className="sm:col-span-4">
                      <label className="block font-semibold text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                        Moneda
                      </label>
                      <div className="inline-flex p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-xl border border-slate-300/60 dark:border-slate-700 w-full justify-between">
                        {(['PEN', 'USD', 'EUR'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setGastoMoneda(m)}
                            className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              gastoMoneda === m ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Monto */}
                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                        Monto
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                          {gastoMoneda === 'PEN' ? 'S/' : gastoMoneda === 'USD' ? '$' : '€'}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={gastoMonto}
                          onChange={(e) => setGastoMonto(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 font-mono font-bold text-emerald-700 dark:text-emerald-300 outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    {/* Categoría */}
                    <div className="sm:col-span-5">
                      <label className="block font-semibold text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                        Categoría
                      </label>
                      <select
                        value={gastoCategoria}
                        onChange={(e) => setGastoCategoria(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 bg-white dark:bg-slate-900 text-xs outline-none"
                      >
                        <option value="Personal_Salud">Salud y Cuidado</option>
                        <option value="Personal_Alimentacion">Alimentación y Comida</option>
                        <option value="Personal_Transporte">Transporte y Movilidad</option>
                        <option value="Personal_Educacion">Educación y Cursos</option>
                        <option value="Personal_Ocio">Ocio y Entretenimiento</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={gastoConcepto}
                      onChange={(e) => setGastoConcepto(e.target.value)}
                      placeholder="Concepto o descripción breve del egreso..."
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900 text-xs outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={gastoSearch}
                      onChange={(e) => setGastoSearch(e.target.value)}
                      placeholder="Buscar egreso en Finanzas..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs outline-none"
                    />
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1">
                    {listaGastos
                      .filter((g) =>
                        g.descripcion_gasto.toLowerCase().includes(gastoSearch.toLowerCase()) ||
                        g.codigo_legado.toLowerCase().includes(gastoSearch.toLowerCase())
                      )
                      .map((g) => (
                        <div
                          key={g.id}
                          onClick={() => {
                            setGastoVinculadoId(g.codigo_legado);
                            setGastoMonto(String(g.monto_original));
                          }}
                          className={`p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer border transition ${
                            gastoVinculadoId === g.codigo_legado
                              ? 'bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-500'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                          }`}
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-500 text-[10px] mr-1.5">
                              {g.codigo_legado}
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-100">
                              {g.descripcion_gasto}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            S/ {g.monto_original}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN METAS CUANTIFICABLES Y RESCATE DE RACHA */}
          {mostrarMetas && (
            <div
              id="act-flow-meta-section"
              className="bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-800/60 rounded-2xl p-3.5 space-y-3 animate-fadeIn"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <div>
                    <span className="font-bold text-xs text-cyan-900 dark:text-cyan-200">
                      Meta Cuantificable & Rescate de Racha
                    </span>
                    <p className="text-[10px] text-cyan-700 dark:text-cyan-400">
                      Seguimiento por acumulación numérica y preservación de streak
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarMetas(false)}
                  className="p-1 rounded-md text-cyan-700 dark:text-cyan-400 hover:text-cyan-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-8">
                  <label className="block font-semibold text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Meta & Plan Estratégico
                  </label>
                  <select
                    id="act-flow-meta-select"
                    value={
                      modoMetaManual
                        ? '__TEXTO_LIBRE__'
                        : metaSeleccionadaId === '__CREAR_NUEVA__'
                        ? '__CREAR_NUEVA__'
                        : metaSeleccionadaId
                    }
                    onChange={(e) => handleCambiarMetaSeleccionada(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">Sin vincular a meta</option>
                    <option value="__CREAR_NUEVA__">+ Crear nueva meta para este hábito...</option>
                    <option value="__TEXTO_LIBRE__">Personalizada (Solo texto libre / Legacy)</option>
                    {metasDisponibles.length > 0 && (
                      <optgroup label="Metas y Planes Activos">
                        {metasDisponibles.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.codigo_legado ? `[${m.codigo_legado}] ` : ''}{m.nombre_meta} ({m.meta_objetivo_total || 0} {m.unidad_medida || 'u'})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-semibold text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    value={unidadMedida}
                    onChange={(e) => setUnidadMedida(e.target.value)}
                    placeholder="km, horas, libros, sesiones..."
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Si se seleccionó Crear Nueva Meta inline (REQ-HABITS-CREATE-METAS-INLINE-15) */}
              {metaSeleccionadaId === '__CREAR_NUEVA__' && (
                <div className="p-3 rounded-xl bg-cyan-100/50 dark:bg-cyan-950/40 border border-cyan-300/70 dark:border-cyan-800/60 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-cyan-800 dark:text-cyan-300 font-semibold text-[11px]">
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Crear Nueva Meta en Metas & Planes</span>
                  </div>
                  <div>
                    <label className="block font-semibold text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                      Nombre de la nueva meta
                    </label>
                    <input
                      id="act-flow-new-meta-name"
                      type="text"
                      value={nombreNuevaMeta}
                      onChange={(e) => setNombreNuevaMeta(e.target.value)}
                      placeholder={titulo.trim() || 'Ej: Correr 500 km, Leer 12 libros...'}
                      className="w-full border border-cyan-300/80 dark:border-cyan-700/60 rounded-xl p-2 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                    <p className="text-[10px] text-cyan-700/90 dark:text-cyan-400/90 mt-1">
                      Esta meta se registrará automáticamente en metas_planes y quedará vinculada al 100% con este hábito.
                    </p>
                  </div>
                </div>
              )}

              {/* Si es personalizada / manual, mostrar campo de texto libre */}
              {modoMetaManual && (
                <div>
                  <label className="block font-semibold text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Meta Macro / OKR (Texto Libre)
                  </label>
                  <input
                    type="text"
                    value={metaMacro}
                    onChange={(e) => setMetaMacro(e.target.value)}
                    placeholder="Ej: Leer 12 libros, Ahorro $10k, Maratón 42k..."
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block font-semibold text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Meta Objetivo Total
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={metaTotal}
                    onChange={(e) => setMetaTotal(e.target.value)}
                    placeholder="100"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 font-mono tabular-nums font-bold text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Acumulado Actual
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={valorAcumulado}
                    onChange={(e) => setValorAcumulado(e.target.value)}
                    placeholder="0"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 font-mono tabular-nums font-bold text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Meta Diaria
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={metaDiaria}
                    onChange={(e) => setMetaDiaria(e.target.value)}
                    placeholder="0"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 font-mono tabular-nums font-bold text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Nivel de Rescate Mínimo
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={rescateMinimo}
                    onChange={(e) => setRescateMinimo(e.target.value)}
                    placeholder="0"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 font-mono tabular-nums font-bold text-xs bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN NOTAS VINCULADAS */}
          {mostrarNotas && (
            <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-3.5 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-bold text-xs text-purple-900 dark:text-purple-200">Notas Inteligentes</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarNotas(false)}
                  className="p-1 rounded-md text-purple-700 dark:text-purple-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={notasSearch}
                  onChange={(e) => setNotasSearch(e.target.value)}
                  placeholder="Buscar nota o checklist..."
                  className="w-full pl-8 pr-3 py-1.5 border border-purple-200 dark:border-purple-800 rounded-xl bg-white dark:bg-slate-900 text-xs outline-none"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-400" />
              </div>
              <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                {listaNotas
                  .filter((n) => n.titulo.toLowerCase().includes(notasSearch.toLowerCase()))
                  .map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setNotaVinculadaId(n.codigo_legado)}
                      className={`p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer border transition ${
                        notaVinculadaId === n.codigo_legado
                          ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                      }`}
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-100">{n.titulo}</span>
                      <span className="font-mono text-[10px] text-slate-400">{n.codigo_legado}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SECCIÓN DE PASOS / SUBTAREAS PROCEDURALES */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMostrarPasos(!mostrarPasos)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition cursor-pointer"
              >
                <ListOrdered className="w-4 h-4" />
                <span>{mostrarPasos ? 'Ocultar pasos procedurales' : '+ Añadir pasos secuenciales'}</span>
              </button>
              {pasosLocales.length > 0 && (
                <div className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {pasosCompletados}/{pasosLocales.length} pasos ({progresoPasos}%)
                </div>
              )}
            </div>

            {mostrarPasos && (
              <div className="space-y-2 p-3 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl animate-fadeIn">
                {/* Barra de progreso */}
                {pasosLocales.length > 0 && (
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progresoPasos}%` }}
                    />
                  </div>
                )}

                {/* Input agregar paso */}
                <div className="flex items-center gap-2">
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
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={agregarPaso}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Lista de pasos */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {pasosLocales.map((paso) => (
                    <div
                      key={paso.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => togglePasoCompletado(paso.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
                          paso.completado
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                        }`}
                      >
                        {paso.completado && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span
                        className={`flex-1 text-slate-800 dark:text-slate-200 ${
                          paso.completado ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {paso.numero}. {paso.descripcion}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarPaso(paso.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Eliminar paso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ÁREA DE NOTAS LIBRES */}
          <div>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none transition-colors"
              placeholder="Añadir notas, enlaces o apuntes rápidos..."
            />
          </div>

          {/* SECCIÓN DINÁMICA DE NOTAS VINCULADAS (Fase 4.43) */}
          <SeccionNotasVinculadasModal
            codigoEntidad={actividadEditar?.codigo_legado || ''}
            tipoEntidad="HABITO"
            tituloEntidad={titulo || actividadEditar?.nombre_actividad || 'Actividad'}
          />
        </div>

        {/* FOOTER DE ACCIONES */}
        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {actividadEditar && (
              <button
                type="button"
                id="act-flow-btn-eliminar"
                onClick={handleEliminar}
                className="px-3 py-2 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl font-bold flex items-center gap-1.5 transition text-xs active:scale-95 cursor-pointer"
                title="Eliminar esta actividad permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            )}
            <p className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px] border border-slate-200 dark:border-slate-700">
                Esc
              </kbd>
              <span>para cancelar</span>
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-submit-flow-actividad"
              onClick={() => handleGuardar()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>{actividadEditar ? 'Actualizar Actividad' : 'Guardar Actividad'}</span>
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
