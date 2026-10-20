import { db } from '../db/db';
import type {
  MetaPlanRecord,
  HitoPlanRecord,
  HabitoMetaVinculo,
  ActividadPersonal,
  ModoComputoVinculo,
  CategoriaVida,
  HabitoLogRecord
} from '../types';
import { syncManager } from './syncManager';

/**
 * ============================================================================
 * SERVICIO LOCAL-FIRST: METAS, PLANES DE ACCIÓN E HITOS (N:M CON HÁBITOS)
 * REQ-METAS-UI-FLOW-12: Lógica de negocio y motor de progreso bimodal
 * ============================================================================
 */

export interface MetaConDetalle extends MetaPlanRecord {
  hitos: HitoPlanRecord[];
  vinculos: (HabitoMetaVinculo & { habito?: ActividadPersonal })[];
  avanceHitosPct: number;
  avanceHabitosPct: number;
  progresoGlobalPct: number;
}

/**
 * Genera el siguiente código correlativo 'MET-XXX' para una meta
 */
export async function generarSiguienteCodigoMeta(): Promise<string> {
  const todas = await db.metas_planes.toArray();
  let maxNum = 0;
  for (const m of todas) {
    const match = (m.codigo_legado || '').match(/^MET-(\d+)$/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  return `MET-${String(maxNum + 1).padStart(3, '0')}`;
}

export const generarSiguienteCodigoMetaLocal = generarSiguienteCodigoMeta;

/**
 * Genera el siguiente código correlativo 'HIT-PLN-XXX' para un hito de plan
 */
export async function generarSiguienteCodigoHitoPlan(): Promise<string> {
  const todos = await db.planes_accion_hitos.toArray();
  let maxNum = 0;
  for (const h of todos) {
    const match = (h.codigo_legado || '').match(/^HIT-PLN-(\d+)$/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  return `HIT-PLN-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Calcula el progreso bimodal de una meta dado sus hitos y hábitos vinculados.
 * Fórmula: Progress = (Avance_Hitos * Peso_Hitos / 100) + (Avance_Habitos * Peso_Habitos / 100)
 */
export function calcularProgresoBimodal(
  meta: MetaPlanRecord,
  hitos: HitoPlanRecord[],
  vinculos: (HabitoMetaVinculo & { habito?: ActividadPersonal })[]
): {
  avanceHitosPct: number;
  avanceHabitosPct: number;
  progresoGlobalPct: number;
} {
  // 1. Cálculo de Hitos
  let avanceHitosPct = 0;
  if (hitos.length > 0) {
    const pesoTotalHitos = hitos.reduce((acc, h) => acc + (h.peso_relativo || 1), 0);
    const pesoCompletadoHitos = hitos
      .filter((h) => h.completado)
      .reduce((acc, h) => acc + (h.peso_relativo || 1), 0);

    avanceHitosPct = pesoTotalHitos > 0
      ? Math.min(100, Math.round((pesoCompletadoHitos / pesoTotalHitos) * 100))
      : 0;
  }

  // 2. Cálculo de Hábitos Motores
  let avanceHabitosPct = 0;
  if (vinculos.length > 0) {
    let sumaPonderada = 0;
    let pesoTotalVinculos = 0;

    for (const v of vinculos) {
      const pesoV = v.peso_contribucion_pct || 100;
      pesoTotalVinculos += pesoV;

      if (v.habito) {
        const factor = v.factor_conversion || 1.0;
        const metaEsperada = v.meta_volumen_esperada || meta.meta_objetivo_total || 1;
        const acumuladoHabito = (v.habito.valor_acumulado_actual || 0) * factor;

        const pctIndividual = metaEsperada > 0
          ? Math.min(100, (acumuladoHabito / metaEsperada) * 100)
          : 0;
        sumaPonderada += pctIndividual * (pesoV / 100);
      }
    }

    avanceHabitosPct = pesoTotalVinculos > 0
      ? Math.min(100, Math.round((sumaPonderada / (pesoTotalVinculos / 100))))
      : 0;
  } else if (meta.meta_objetivo_total > 0) {
    // Si no hay hábitos vinculados pero tiene valor acumulado directo
    avanceHabitosPct = Math.min(
      100,
      Math.round(((meta.valor_acumulado_actual || 0) / meta.meta_objetivo_total) * 100)
    );
  }

  // 3. Balance Ponderado Bimodal
  const pesoH = meta.peso_hitos_pct ?? 50;
  const pesoHab = meta.peso_habitos_pct ?? 50;
  const totalPesos = pesoH + pesoHab || 100;

  // Si solo hay hitos y 0 vínculos
  let progresoGlobalPct = 0;
  if (hitos.length > 0 && vinculos.length === 0 && (meta.meta_objetivo_total || 0) === 0) {
    progresoGlobalPct = avanceHitosPct;
  } else if (hitos.length === 0 && (vinculos.length > 0 || (meta.meta_objetivo_total || 0) > 0)) {
    progresoGlobalPct = avanceHabitosPct;
  } else {
    progresoGlobalPct = Math.min(
      100,
      Math.round((avanceHitosPct * (pesoH / totalPesos)) + (avanceHabitosPct * (pesoHab / totalPesos)))
    );
  }

  return {
    avanceHitosPct,
    avanceHabitosPct,
    progresoGlobalPct
  };
}

/**
 * Obtiene todas las metas con sus hitos y hábitos vinculados en una sola ronda O(N)
 */
export async function obtenerMetasConDetalleLocal(): Promise<MetaConDetalle[]> {
  const [metas, hitos, vinculos, actividades] = await Promise.all([
    db.metas_planes.toArray(),
    db.planes_accion_hitos.toArray(),
    db.habitos_metas_vinculos.toArray(),
    db.actividades_personales.toArray()
  ]);

  // Mapa de hábitos por id para lookup O(1)
  const mapActividades = new Map<string, ActividadPersonal>();
  for (const act of actividades) {
    mapActividades.set(act.id, act);
  }

  // Mapa de hitos por meta_id
  const mapHitos = new Map<string, HitoPlanRecord[]>();
  for (const h of hitos) {
    if (!mapHitos.has(h.meta_id)) mapHitos.set(h.meta_id, []);
    mapHitos.get(h.meta_id)!.push(h);
  }

  // Mapa de vínculos por meta_id
  const mapVinculos = new Map<string, (HabitoMetaVinculo & { habito?: ActividadPersonal })[]>();
  for (const v of vinculos) {
    if (!mapVinculos.has(v.meta_id)) mapVinculos.set(v.meta_id, []);
    mapVinculos.get(v.meta_id)!.push({
      ...v,
      habito: mapActividades.get(v.habito_id)
    });
  }

  return metas.map((meta) => {
    const hitosMeta = (mapHitos.get(meta.id) || []).sort(
      (a, b) => (a.orden_secuencia || 0) - (b.orden_secuencia || 0)
    );
    const vinculosMeta = mapVinculos.get(meta.id) || [];

    const calculo = calcularProgresoBimodal(meta, hitosMeta, vinculosMeta);

    return {
      ...meta,
      hitos: hitosMeta,
      vinculos: vinculosMeta,
      ...calculo
    };
  });
}

/**
 * Guarda atómicamente una meta con sus hitos y hábitos vinculados
 */
export async function guardarMetaPlanLocal(
  metaData: Partial<MetaPlanRecord>,
  hitosData: Array<Partial<HitoPlanRecord>> = [],
  vinculosData: Array<{
    habito_id: string;
    modo_computo?: ModoComputoVinculo | string;
    factor_conversion?: number;
    peso_contribucion_pct?: number;
    meta_volumen_esperada?: number;
  }> = []
): Promise<MetaPlanRecord> {
  const userId = metaData.user_id || '00000000-0000-0000-0000-000000000001';
  const nowIso = new Date().toISOString();

  // Resolver o generar ID y código legado para la meta
  const metaId = metaData.id || crypto.randomUUID();
  const codigoLegado = metaData.codigo_legado || (await generarSiguienteCodigoMeta());

  const metaFinal: MetaPlanRecord = {
    id: metaId,
    user_id: userId,
    codigo_legado: codigoLegado,
    nombre_meta: metaData.nombre_meta || 'Nueva Meta',
    descripcion: metaData.descripcion || '',
    categoria_vida: metaData.categoria_vida || 'DESARROLLO_ESTUDIO',
    tipo_meta: metaData.tipo_meta || 'CUANTITATIVA',
    unidad_medida: metaData.unidad_medida || 'unidades',
    meta_objetivo_total: Number(metaData.meta_objetivo_total || 0),
    valor_acumulado_actual: Number(metaData.valor_acumulado_actual || 0),
    nivel_rescate_minimo: Number(metaData.nivel_rescate_minimo || 0),
    peso_hitos_pct: Number(metaData.peso_hitos_pct ?? 50),
    peso_habitos_pct: Number(metaData.peso_habitos_pct ?? 50),
    fecha_inicio: metaData.fecha_inicio || nowIso.split('T')[0],
    fecha_fin: metaData.fecha_fin,
    estado: metaData.estado || '02_En_Progreso',
    proyecto_id: metaData.proyecto_id || null,
    created_at: metaData.created_at || nowIso,
    updated_at: nowIso,
    version: (metaData.version || 0) + 1,
    sync_status: 'pending'
  };

  // Preparar hitos
  let contadorHito = 0;
  const hitosFinales: HitoPlanRecord[] = [];
  for (const h of hitosData) {
    contadorHito++;
    const hitoId = h.id || crypto.randomUUID();
    const codigoHito = h.codigo_legado || `HIT-PLN-${String(contadorHito).padStart(3, '0')}`;

    hitosFinales.push({
      id: hitoId,
      user_id: userId,
      codigo_legado: codigoHito,
      meta_id: metaId,
      titulo_hito: h.titulo_hito || `Hito ${contadorHito}`,
      orden_secuencia: h.orden_secuencia ?? contadorHito,
      fecha_objetivo: h.fecha_objetivo,
      completado: Boolean(h.completado),
      fecha_completado: h.fecha_completado,
      peso_relativo: Number(h.peso_relativo ?? 1.0),
      created_at: h.created_at || nowIso,
      updated_at: nowIso,
      version: (h.version || 0) + 1,
      sync_status: 'pending'
    });
  }

  // Preparar vínculos
  const vinculosFinales: HabitoMetaVinculo[] = vinculosData.map((v) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    habito_id: v.habito_id,
    meta_id: metaId,
    modo_computo: v.modo_computo || 'VOLUMEN_DIRECTO',
    factor_conversion: Number(v.factor_conversion ?? 1.0),
    peso_contribucion_pct: Number(v.peso_contribucion_pct ?? 100),
    meta_volumen_esperada: Number(v.meta_volumen_esperada ?? 0),
    created_at: nowIso,
    updated_at: nowIso,
    sync_status: 'pending'
  }));

  // Transacción atómica en Dexie
  await db.transaction('rw', [db.metas_planes, db.planes_accion_hitos, db.habitos_metas_vinculos], async () => {
    // 1. Guardar la meta
    await db.metas_planes.put(metaFinal);

    // 2. Reemplazar o actualizar hitos de la meta
    // Limpiar hitos previos si es edición para sincronizar exactamente la lista actual
    await db.planes_accion_hitos.where('meta_id').equals(metaId).delete();
    if (hitosFinales.length > 0) {
      await db.planes_accion_hitos.bulkPut(hitosFinales);
    }

    // 3. Reemplazar vínculos
    await db.habitos_metas_vinculos.where('meta_id').equals(metaId).delete();
    if (vinculosFinales.length > 0) {
      await db.habitos_metas_vinculos.bulkPut(vinculosFinales);
    }
  });

  // Notificar al worker de sincronización
  try {
    syncManager.syncPendingRecords();
  } catch {
    // Modo offline tolerado
  }

  return metaFinal;
}

/**
 * Conmuta el estado completado de un hito de plan y recalcula la meta
 */
export async function conmutarHitoPlanLocal(
  hitoId: string,
  completadoDeseado?: boolean
): Promise<HitoPlanRecord | null> {
  const hito = await db.planes_accion_hitos.get(hitoId);
  if (!hito) return null;

  const nuevoCompletado = completadoDeseado !== undefined ? completadoDeseado : !hito.completado;
  const hoyStr = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  const hitoActualizado: HitoPlanRecord = {
    ...hito,
    completado: nuevoCompletado,
    fecha_completado: nuevoCompletado ? hoyStr : undefined,
    updated_at: nowIso,
    version: (hito.version || 0) + 1,
    sync_status: 'pending'
  };

  await db.planes_accion_hitos.put(hitoActualizado);

  // Recalcular progreso en la meta
  await recalcularProgresoMetaLocal(hito.meta_id);

  try {
    syncManager.syncPendingRecords();
  } catch {
    // Offline tolerado
  }

  return hitoActualizado;
}

/**
 * Vincula o actualiza la relación de un hábito con una meta
 */
export async function vincularHabitoAMetaLocal(
  habitoId: string,
  metaId: string,
  modoComputo: ModoComputoVinculo = 'VOLUMEN_DIRECTO',
  factorConversion: number = 1.0,
  pesoContribucionPct: number = 100.0,
  metaVolumenEsperada: number = 0
): Promise<HabitoMetaVinculo> {
  const nowIso = new Date().toISOString();

  // Buscar si ya existe el vínculo
  const existente = await db.habitos_metas_vinculos
    .where('meta_id')
    .equals(metaId)
    .and((v) => v.habito_id === habitoId)
    .first();

  const vinculoFinal: HabitoMetaVinculo = {
    id: existente?.id || crypto.randomUUID(),
    user_id: existente?.user_id || '00000000-0000-0000-0000-000000000001',
    habito_id: habitoId,
    meta_id: metaId,
    modo_computo: modoComputo,
    factor_conversion: factorConversion,
    peso_contribucion_pct: pesoContribucionPct,
    meta_volumen_esperada: metaVolumenEsperada,
    created_at: existente?.created_at || nowIso,
    updated_at: nowIso,
    sync_status: 'pending'
  };

  await db.habitos_metas_vinculos.put(vinculoFinal);
  await recalcularProgresoMetaLocal(metaId);

  return vinculoFinal;
}

/**
 * Desvincula un hábito de una meta
 */
export async function desvincularHabitoLocal(vinculoId: string): Promise<boolean> {
  const vinculo = await db.habitos_metas_vinculos.get(vinculoId);
  if (!vinculo) return false;

  await db.habitos_metas_vinculos.delete(vinculoId);
  await recalcularProgresoMetaLocal(vinculo.meta_id);
  return true;
}

/**
 * Recalcula y persiste el avance consolidado de una meta
 */
export async function recalcularProgresoMetaLocal(metaId: string): Promise<number> {
  const meta = await db.metas_planes.get(metaId);
  if (!meta) return 0;

  const hitos = await db.planes_accion_hitos.where('meta_id').equals(metaId).toArray();
  const vinculos = await db.habitos_metas_vinculos.where('meta_id').equals(metaId).toArray();
  const actividades = await db.actividades_personales.toArray();

  const mapAct = new Map(actividades.map((a) => [a.id, a]));
  const vinculosConHabito = vinculos.map((v) => ({
    ...v,
    habito: mapAct.get(v.habito_id)
  }));

  const { progresoGlobalPct } = calcularProgresoBimodal(meta, hitos, vinculosConHabito);

  // Actualizar estado sugerido si llega al 100%
  let nuevoEstado = meta.estado;
  if (progresoGlobalPct >= 100 && meta.estado === '02_En_Progreso') {
    nuevoEstado = '03_Completado';
  } else if (progresoGlobalPct < 100 && meta.estado === '03_Completado') {
    nuevoEstado = '02_En_Progreso';
  }

  const nowIso = new Date().toISOString();
  await db.metas_planes.update(metaId, {
    estado: nuevoEstado,
    updated_at: nowIso,
    sync_status: 'pending'
  });

  return progresoGlobalPct;
}

/**
 * Elimina una meta y sus hitos y vínculos asociados
 */
export async function eliminarMetaPlanLocal(metaId: string): Promise<boolean> {
  await db.transaction('rw', [db.metas_planes, db.planes_accion_hitos, db.habitos_metas_vinculos], async () => {
    await db.planes_accion_hitos.where('meta_id').equals(metaId).delete();
    await db.habitos_metas_vinculos.where('meta_id').equals(metaId).delete();
    await db.metas_planes.delete(metaId);
  });

  try {
    syncManager.syncPendingRecords();
  } catch {
    // Offline tolerado
  }

  return true;
}

/**
 * REQ-HABITS-CREATE-METAS-INLINE-15: Creación in-situ de metas desde actividades y vinculación atómica
 */
export async function crearMetaRapidaDesdeActividadLocal(params: {
  nombre: string;
  categoria: CategoriaVida;
  metaTotal?: number;
  unidad?: string;
  nivelRescate?: number;
  habitoId?: string;
}): Promise<MetaPlanRecord> {
  const userId = '00000000-0000-0000-0000-000000000001';
  const nowIso = new Date().toISOString();
  const nuevoCodigo = await generarSiguienteCodigoMetaLocal();
  const metaId = crypto.randomUUID();

  const nuevaMeta: MetaPlanRecord = {
    id: metaId,
    user_id: userId,
    codigo_legado: nuevoCodigo,
    nombre_meta: params.nombre.trim(),
    descripcion: '',
    categoria_vida: params.categoria,
    tipo_meta: 'CUANTITATIVA',
    unidad_medida: params.unidad?.trim() || 'unidades',
    meta_objetivo_total: params.metaTotal !== undefined ? params.metaTotal : 100,
    valor_acumulado_actual: 0,
    nivel_rescate_minimo: params.nivelRescate || 0,
    peso_hitos_pct: 0,
    peso_habitos_pct: 100,
    fecha_inicio: nowIso.split('T')[0],
    estado: '02_En_Progreso',
    proyecto_id: null,
    created_at: nowIso,
    updated_at: nowIso,
    version: 1,
    sync_status: 'pending'
  };

  await db.metas_planes.put(nuevaMeta);

  if (params.habitoId) {
    const vinculo: HabitoMetaVinculo = {
      id: crypto.randomUUID(),
      user_id: userId,
      habito_id: params.habitoId,
      meta_id: nuevaMeta.id,
      modo_computo: 'VOLUMEN_DIRECTO',
      factor_conversion: 1.0,
      peso_contribucion_pct: 100,
      meta_volumen_esperada: params.metaTotal !== undefined ? params.metaTotal : 100,
      created_at: nowIso,
      updated_at: nowIso,
      sync_status: 'pending'
    };
    await db.habitos_metas_vinculos.put(vinculo);
    await recalcularProgresoMetaLocal(nuevaMeta.id);
  }

  try {
    syncManager.syncPendingRecords();
  } catch {
    // Offline tolerado
  }

  return nuevaMeta;
}

/**
 * REQ-HABITS-CREATE-METAS-INLINE-15: Promoción automática de metas internas preexistentes hacia metas_planes
 */
export async function sincronizarMetasInternasHaciaPlanesLocal(): Promise<number> {
  const [actividades, vinculos, metasExistentes] = await Promise.all([
    db.actividades_personales.toArray(),
    db.habitos_metas_vinculos.toArray(),
    db.metas_planes.toArray()
  ]);

  const vinculosSet = new Set(vinculos.map((v) => v.habito_id));
  const metasPorNombre = new Map<string, MetaPlanRecord>();
  for (const m of metasExistentes) {
    metasPorNombre.set(m.nombre_meta.trim().toLowerCase(), m);
  }

  let metasPromovidas = 0;

  for (const act of actividades) {
    const tieneMetaMacro = Boolean(act.meta_macro_nombre && act.meta_macro_nombre.trim().length > 0);
    const esTipoMeta = act.tipo_compromiso === 'META';

    if ((tieneMetaMacro || esTipoMeta) && !vinculosSet.has(act.id)) {
      const nombreMeta = (act.meta_macro_nombre?.trim()) || act.nombre_actividad.trim();
      const nombreKey = nombreMeta.toLowerCase();

      let metaDestino = metasPorNombre.get(nombreKey);

      if (!metaDestino) {
        metaDestino = await crearMetaRapidaDesdeActividadLocal({
          nombre: nombreMeta,
          categoria: act.categoria_vida,
          metaTotal: act.meta_objetivo_total || 100,
          unidad: act.unidad_medida || 'unidades',
          nivelRescate: act.nivel_rescate_minimo || 0,
          habitoId: act.id
        });
        metasPorNombre.set(nombreKey, metaDestino);
        metasPromovidas++;
      } else {
        await vincularHabitoAMetaLocal(
          act.id,
          metaDestino.id,
          'VOLUMEN_DIRECTO',
          1.0,
          100,
          act.meta_objetivo_total || metaDestino.meta_objetivo_total
        );
        await recalcularProgresoMetaLocal(metaDestino.id);
      }

      vinculosSet.add(act.id);
    }
  }

  return metasPromovidas;
}

export interface ProyeccionMetaResult {
  velocidadDiaria: number;
  diasRestantesEstimados: number | null;
  fechaProyectada: string | null;
  desviacionDias: number | null;
  estadoSalud: 'ADELANTADO' | 'A_TIEMPO' | 'RIESGO' | 'CRITICO' | 'SIN_DATOS';
  mensajeBadge: string;
}

/**
 * REQ-METAS-FORECASTING-BADGES-17: Motor de Velocidad Real y Badges de Proyección en ViewMetasPlanes
 * Calcula la velocidad de los últimos 30 días, días restantes y estado de salud respecto a fecha_fin e hitos.
 */
export function calcularProyeccionMeta(
  meta: MetaPlanRecord,
  logsHabitos: HabitoLogRecord[],
  hitos: HitoPlanRecord[],
  fechaHoyStr: string = new Date().toISOString().split('T')[0]
): ProyeccionMetaResult {
  const soloHoy = fechaHoyStr.split('T')[0];
  const [yHoy, mHoy, dHoy] = soloHoy.split('-').map(Number);
  const hoyUtc = Date.UTC(yHoy, mHoy - 1, dHoy);
  const hace30DiasUtc = hoyUtc - 30 * 86400000;

  // 1. Filtrar los logs de los últimos 30 días respecto a fechaHoyStr
  const logs30Dias = (logsHabitos || []).filter((log) => {
    if (!log.fecha_registro) return false;
    const [yL, mL, dL] = log.fecha_registro.split('T')[0].split('-').map(Number);
    const logUtc = Date.UTC(yL, mL - 1, dL);
    return logUtc >= hace30DiasUtc && logUtc <= hoyUtc;
  });

  // 2. Sumar valor registrado y calcular V_real = Sum / 30
  let sumaValorRegistrado = 0;
  for (const log of logs30Dias) {
    const valor =
      typeof log.valor_cuantitativo_sumado === 'number' && log.valor_cuantitativo_sumado > 0
        ? log.valor_cuantitativo_sumado
        : log.completado
        ? 1
        : 0;
    sumaValorRegistrado += valor;
  }

  const velocidadDiaria = Number((sumaValorRegistrado / 30).toFixed(4));

  // 3. Remanente pendiente de volumen
  const metaTotal = Number(meta.meta_objetivo_total || 0);
  const valorActual = Number(meta.valor_acumulado_actual || 0);
  const volumenPendiente = Math.max(0, metaTotal - valorActual);

  // 4 & 5. Evaluación de inercia y proyección
  let diasRestantesEstimados: number | null = null;
  let fechaProyectada: string | null = null;
  let desviacionDias: number | null = null;
  let estadoSalud: 'ADELANTADO' | 'A_TIEMPO' | 'RIESGO' | 'CRITICO' | 'SIN_DATOS' = 'SIN_DATOS';
  let mensajeBadge = 'Sin inercia / 0 avance';

  if (velocidadDiaria === 0) {
    estadoSalud = 'SIN_DATOS';
    mensajeBadge = 'Sin inercia / 0 avance';
  } else {
    // V_real > 0
    diasRestantesEstimados = Math.ceil(volumenPendiente / velocidadDiaria);
    const projUtc = hoyUtc + diasRestantesEstimados * 86400000;
    const projDate = new Date(projUtc);
    fechaProyectada = projDate.toISOString().split('T')[0];

    if (meta.fecha_fin && meta.fecha_fin.trim().length > 0) {
      const [yF, mF, dF] = meta.fecha_fin.split('T')[0].split('-').map(Number);
      const finUtc = Date.UTC(yF, mF - 1, dF);
      desviacionDias = Math.round((projUtc - finUtc) / 86400000);

      if (desviacionDias <= -3) {
        estadoSalud = 'ADELANTADO';
        mensajeBadge = `Adelantado ${Math.abs(desviacionDias)}d`;
      } else if (desviacionDias <= 0) {
        estadoSalud = 'A_TIEMPO';
        mensajeBadge = 'En cronograma';
      } else if (desviacionDias <= 7) {
        estadoSalud = 'RIESGO';
        mensajeBadge = `⚠️ Riesgo (+${desviacionDias}d)`;
      } else {
        estadoSalud = 'CRITICO';
        mensajeBadge = `🚨 Desviación (+${desviacionDias}d)`;
      }
    } else {
      // Sin fecha_fin definida pero con velocidad positiva
      estadoSalud = 'A_TIEMPO';
      mensajeBadge = 'En cronograma';
    }
  }

  // 6. Alerta de hitos vencidos no completados
  const hitosAtrasados = (hitos || []).filter(
    (h) => !h.completado && h.fecha_objetivo && h.fecha_objetivo.split('T')[0] < soloHoy
  );
  if (hitosAtrasados.length > 0) {
    const cant = hitosAtrasados.length;
    const sufijo = cant === 1 ? '1 hito vencido' : `${cant} hitos vencidos`;
    mensajeBadge = `${mensajeBadge} · ⚠️ ${sufijo}`;
  }

  return {
    velocidadDiaria,
    diasRestantesEstimados,
    fechaProyectada,
    desviacionDias,
    estadoSalud,
    mensajeBadge
  };
}

