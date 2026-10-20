import { db } from '../db/db';
import type { ActividadPersonal, SubtareaPaso, FrecuenciaCiclo } from '../types';
import { sincronizarActividadCalendar } from './calendarSyncService';

/**
 * ============================================================================
 * MOTOR DE NEGOCIO: HÁBITOS, RACHAS, CICLOS Y RESCATE CUANTITATIVO
 * Portado exacto de ActividadesService.js y TareasService.js a TypeScript Local-First
 * ============================================================================
 */

/**
 * Formatea un objeto Date en cadena 'YYYY-MM-DD'
 */
export function formatFechaIsoLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula la primera fecha válida según la frecuencia o regla de días permitidos.
 */
export function calcularProximaFechaValida(
  fechaBaseStr: string,
  frecuenciaCiclo: FrecuenciaCiclo = 'DIARIA',
  reglaRepeticion: string = '',
  diasSeleccionados?: number[]
): string {
  if (!fechaBaseStr) {
    fechaBaseStr = formatFechaIsoLocal(new Date());
  }

  const partes = String(fechaBaseStr).split(/[\sT]/)[0].split('-');
  if (partes.length !== 3) return fechaBaseStr;

  const d = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10), 12, 0, 0);
  const freq = String(frecuenciaCiclo || 'DIARIA').toUpperCase().trim();
  const regla = String(reglaRepeticion || '').toUpperCase().trim();

  let diasPermitidos: number[] = [];

  // 1. Días estructurados como array numérico (0=Domingo, 1=Lunes .. 6=Sábado)
  if (Array.isArray(diasSeleccionados) && diasSeleccionados.length > 0) {
    diasSeleccionados.forEach((num) => {
      let n = parseInt(String(num), 10);
      if (!isNaN(n)) {
        if (n === 7) n = 0; // Domingo normalizado a 0
        if (n >= 0 && n <= 6 && !diasPermitidos.includes(n)) {
          diasPermitidos.push(n);
        }
      }
    });
  }

  // 2. Reglas textuales si no se especificaron números
  if (diasPermitidos.length === 0) {
    if (freq === 'DIARIA_LABORAL' || regla === 'L-V') {
      diasPermitidos = [1, 2, 3, 4, 5];
    } else if (freq === 'FIN_SEMANA' || regla === 'DIAS:S,D') {
      diasPermitidos = [0, 6];
    } else if (regla.startsWith('DIAS:') || /^[A-Z,]+$/.test(regla.trim().toUpperCase())) {
      const mapeo: Record<string, number> = {
        'L': 1, 'LU': 1, 'LUN': 1,
        'M': 2, 'MA': 2, 'MAR': 2,
        'X': 3, 'MI': 3, 'MIER': 3,
        'J': 4, 'JU': 4, 'JUE': 4,
        'V': 5, 'VI': 5, 'VIE': 5,
        'S': 6, 'SA': 6, 'SAB': 6,
        'D': 0, 'DO': 0, 'DOM': 0
      };
      const strTokens = regla.startsWith('DIAS:') ? regla.substring(5) : regla;
      const rawDias = strTokens.split(',');
      rawDias.forEach((diaToken) => {
        const tokenLimpio = diaToken.trim().toUpperCase();
        if (mapeo[tokenLimpio] !== undefined && !diasPermitidos.includes(mapeo[tokenLimpio])) {
          diasPermitidos.push(mapeo[tokenLimpio]);
        }
      });
    }
  }

  // Si existen restricciones de días, avanzar en bucle hasta encontrar la primera coincidencia
  if (diasPermitidos.length > 0) {
    for (let i = 0; i < 7; i++) {
      if (diasPermitidos.includes(d.getDay())) {
        break;
      }
      d.setDate(d.getDate() + 1);
    }
  }

  return formatFechaIsoLocal(d);
}

/**
 * Calcula el siguiente ciclo sumando el intervalo o evaluando el día siguiente para hábitos completados.
 */
export function calcularSiguienteFechaCiclo(
  fechaBaseStr: string,
  frecuenciaCiclo: FrecuenciaCiclo = 'DIARIA',
  reglaRepeticion: string = '',
  diasSeleccionados?: number[]
): string {
  const partes = String(fechaBaseStr).split(/[\sT]/)[0].split('-');
  const d = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10), 12, 0, 0);

  if (frecuenciaCiclo === 'SEMANAL') {
    d.setDate(d.getDate() + 7);
    return formatFechaIsoLocal(d);
  } else if (frecuenciaCiclo === 'QUINCENAL') {
    d.setDate(d.getDate() + 14);
    return formatFechaIsoLocal(d);
  } else if (frecuenciaCiclo === 'MENSUAL') {
    d.setMonth(d.getMonth() + 1);
    return formatFechaIsoLocal(d);
  }

  // Por defecto DIARIA o basada en días de la semana: avanzar al día siguiente e iterar
  d.setDate(d.getDate() + 1);
  const mananaStr = formatFechaIsoLocal(d);
  return calcularProximaFechaValida(mananaStr, frecuenciaCiclo, reglaRepeticion, diasSeleccionados);
}

/**
 * Marca como completada o pendiente una actividad personal, aplicando avance de ciclo y racha.
 */
export async function completarActividadPersonalLocal(
  actividad: ActividadPersonal,
  completar: boolean
): Promise<{
  actividadActualizada: ActividadPersonal;
  esRepetida: boolean;
  nuevaRacha: number;
}> {
  const rachaActual = actividad.racha_actual || 0;
  const tieneRecurrencia = Boolean(
    (actividad.frecuencia_ciclo && actividad.frecuencia_ciclo !== 'NINGUNA') ||
    (actividad.regla_repeticion && actividad.regla_repeticion.trim() !== '')
  );
  const esRutinaria = actividad.tipo_compromiso === 'HABITUAL' || tieneRecurrencia;

  const hoyD = new Date();
  const hoyStr = formatFechaIsoLocal(hoyD);
  const ayerD = new Date(hoyD.getFullYear(), hoyD.getMonth(), hoyD.getDate() - 1, 12, 0, 0);
  const ayerStr = formatFechaIsoLocal(ayerD);

  // 1. Cálculo de Racha: validación de mora y penalización por discontinuidad temporal
  let nuevaRacha = rachaActual;
  if (completar) {
    if (!esRutinaria) {
      nuevaRacha = rachaActual;
    } else {
      const estaEnMora = actividad.fecha_programada < hoyStr;
      const ultimaComp = actividad.ultima_fecha_completado;
      if (estaEnMora && (!ultimaComp || ultimaComp < ayerStr)) {
        // Rompe racha por discontinuidad temporal al arrastrar mora
        nuevaRacha = 1;
      } else {
        nuevaRacha = rachaActual + 1;
      }
    }
  } else {
    nuevaRacha = esRutinaria ? Math.max(0, rachaActual - 1) : rachaActual;
  }

  // 2. Avance de ciclo y reinicio de estado para hábitos o actividades recurrentes
  let nuevoEstado = completar ? '04_Completado' : '02_Por_Hacer';
  let nuevaFecha = actividad.fecha_programada;
  let proximaFecha: string | undefined = actividad.proxima_fecha_programada;
  let ultimaFechaCompletado: string | undefined = actividad.ultima_fecha_completado;
  let esRepetida = false;

  if (completar) {
    ultimaFechaCompletado = hoyStr;
    if (esRutinaria && actividad.frecuencia_ciclo && actividad.frecuencia_ciclo !== 'NINGUNA') {
      const prox = calcularSiguienteFechaCiclo(
        actividad.fecha_programada,
        actividad.frecuencia_ciclo,
        actividad.regla_repeticion
      );
      nuevaFecha = prox;
      proximaFecha = prox;
      nuevoEstado = '02_Por_Hacer'; // Reabrir automáticamente para el siguiente ciclo o siguiente paso de mora
      esRepetida = true;
    }
  } else {
    // Reversión / desmarcar: limpiar completado de hoy e idempotencia de racha
    ultimaFechaCompletado = undefined;
    proximaFecha = undefined;
    nuevoEstado = '02_Por_Hacer';
    if (esRutinaria && actividad.fecha_programada > hoyStr) {
      nuevaFecha = hoyStr;
    }
  }

  // 3. Gestión de trazabilidad histórica en historial_fechas
  const historialPrevio = Array.isArray(actividad.historial_fechas) ? [...actividad.historial_fechas] : [];
  let nuevoHistorial: string[];
  if (completar) {
    nuevoHistorial = historialPrevio.includes(hoyStr) ? historialPrevio : [...historialPrevio, hoyStr];
  } else {
    nuevoHistorial = historialPrevio.filter((f) => f !== hoyStr);
  }

  const nowIso = new Date().toISOString();
  const actividadActualizada: ActividadPersonal = {
    ...actividad,
    estado: nuevoEstado as ActividadPersonal['estado'],
    racha_actual: nuevaRacha,
    fecha_programada: nuevaFecha,
    ultima_fecha_completado: ultimaFechaCompletado,
    proxima_fecha_programada: proximaFecha,
    historial_fechas: nuevoHistorial,
    version: (actividad.version || 1) + 1,
    sync_status: 'pending',
    updated_at: nowIso
  };

  await db.actividades_personales.put(actividadActualizada);

  // Notificar al servicio puente de Calendar de forma reactiva no bloqueante
  if (actividad.agendado_calendar === 'Sí') {
    sincronizarActividadCalendar(actividadActualizada, 'UPSERT', {
      alcance: 'ALL',
      fechaRef: actividadActualizada.fecha_programada
    }).catch((e) => console.warn('[habitosService] Fallo en sincronización Calendar (COMPLETE):', e));
  }

  return {
    actividadActualizada,
    esRepetida,
    nuevaRacha
  };
}

/** Alias canónico para completar/alternar completado */
export const alternarCompletadoActividad = completarActividadPersonalLocal;

/**
 * Registra un avance cuantitativo en un hábito o meta (Fase 4.8).
 * Evalúa rescate de racha diaria si avance >= nivel_rescate_minimo.
 */
export async function registrarAvanceCuantitativoLocal(
  actividad: ActividadPersonal,
  valorAvance: number
): Promise<{
  actividadActualizada: ActividadPersonal;
  rachaRescatada: boolean;
  metaCompletada: boolean;
}> {
  const valorNum = Math.max(0, parseFloat(String(valorAvance)) || 0);
  const acumActual = parseFloat(String(actividad.valor_acumulado_actual || 0)) || 0;
  const nuevoAcumulado = acumActual + valorNum;

  const nivelRescate = parseFloat(String(actividad.nivel_rescate_minimo || 0)) || 0;
  const rachaActual = actividad.racha_actual || 0;
  let nuevaRacha = rachaActual;
  let rachaRescatada = false;

  // Rescate de racha si el avance supera o iguala el nivel de rescate
  if (nivelRescate > 0 && valorNum >= nivelRescate) {
    nuevaRacha = rachaActual + 1;
    rachaRescatada = true;
  }

  // Verificación de cumplimiento de meta total
  const metaTotal = parseFloat(String(actividad.meta_objetivo_total || 0)) || 0;
  let metaCompletada = false;
  let nuevoEstado = actividad.estado;

  if (metaTotal > 0 && nuevoAcumulado >= metaTotal) {
    nuevoEstado = '04_Completado';
    metaCompletada = true;
  }

  const nowIso = new Date().toISOString();
  const actividadActualizada: ActividadPersonal = {
    ...actividad,
    valor_acumulado_actual: nuevoAcumulado,
    racha_actual: nuevaRacha,
    estado: nuevoEstado,
    version: (actividad.version || 1) + 1,
    sync_status: 'pending',
    updated_at: nowIso
  };

  await db.actividades_personales.put(actividadActualizada);

  return {
    actividadActualizada,
    rachaRescatada,
    metaCompletada
  };
}

/**
 * ============================================================================
 * MOTOR DE SUBTAREAS: VALIDACIÓN SECUENCIAL Y DESMARCADO EN CASCADA
 * ============================================================================
 */

/**
 * Marca o desmarca una subtarea aplicando la regla secuencial para marcar y desmarcado en cascada.
 */
export async function toggleSubtareaSecuencialLocal(
  idSubtarea: string,
  completadoDeseado?: boolean
): Promise<{
  success: boolean;
  error?: string;
  pasosActualizados?: SubtareaPaso[];
}> {
  const targetPaso = await db.subtareas_pasos.get(idSubtarea);
  if (!targetPaso) {
    return { success: false, error: `Subtarea no encontrada: ${idSubtarea}` };
  }

  const idPadre = targetPaso.id_padre_vinculado;
  const todosLosPasos = await db.subtareas_pasos
    .where('id_padre_vinculado')
    .equals(idPadre)
    .toArray();

  todosLosPasos.sort((a, b) => a.numero_paso - b.numero_paso);

  const deseadoBool = (completadoDeseado === undefined) ? !targetPaso.completado : Boolean(completadoDeseado);
  const nowIso = new Date().toISOString();
  const pasosModificados: SubtareaPaso[] = [];

  if (deseadoBool) {
    // REGLA SECUENCIAL: Para marcar el Paso N (N > 1), todos los pasos anteriores (1 .. N-1) deben estar completados.
    const predecesoresIncompletos = todosLosPasos.filter(
      (p) => p.numero_paso < targetPaso.numero_paso && !p.completado
    );

    if (predecesoresIncompletos.length > 0) {
      const faltante = predecesoresIncompletos[0];
      return {
        success: false,
        error: `Secuencia bloqueada: Debes completar primero el Paso ${faltante.numero_paso} ("${faltante.descripcion_paso}")`
      };
    }

    targetPaso.completado = true;
    targetPaso.fecha_completado = nowIso;
    targetPaso.version = (targetPaso.version || 1) + 1;
    targetPaso.sync_status = 'pending';
    targetPaso.updated_at = nowIso;
    pasosModificados.push(targetPaso);
  } else {
    // REGLA DE DESMARCADO EN CASCADA: Si se desmarca el Paso N, se desmarca este y TODOS los pasos posteriores (Paso > N)
    targetPaso.completado = false;
    targetPaso.fecha_completado = undefined;
    targetPaso.version = (targetPaso.version || 1) + 1;
    targetPaso.sync_status = 'pending';
    targetPaso.updated_at = nowIso;
    pasosModificados.push(targetPaso);

    for (const p of todosLosPasos) {
      if (p.numero_paso > targetPaso.numero_paso && p.completado) {
        p.completado = false;
        p.fecha_completado = undefined;
        p.version = (p.version || 1) + 1;
        p.sync_status = 'pending';
        p.updated_at = nowIso;
        pasosModificados.push(p);
      }
    }
  }

  await db.subtareas_pasos.bulkPut(pasosModificados);

  return {
    success: true,
    pasosActualizados: pasosModificados
  };
}

/**
 * ============================================================================
 * MOTOR DE ALCANCE DE RECURRENCIA (REQ-HAB-04: Scope-Aware Edit & Delete)
 * ============================================================================
 */

/**
 * Elimina una actividad personal considerando el alcance de recurrencia (SINGLE, FUTURE, ALL).
 */
export async function eliminarActividadConAlcance(
  id: string,
  alcance: 'SINGLE' | 'FUTURE' | 'ALL',
  fechaReferencia: string
): Promise<{ success: boolean; alcanceAplicado: 'SINGLE' | 'FUTURE' | 'ALL' }> {
  const act = await db.actividades_personales.get(id);
  if (!act) {
    return { success: false, alcanceAplicado: alcance };
  }

  const tieneRecurrencia = Boolean(
    (act.frecuencia_ciclo && act.frecuencia_ciclo !== 'NINGUNA') ||
    (act.regla_repeticion && act.regla_repeticion.trim() !== '') ||
    act.tipo_compromiso === 'HABITUAL'
  );

  // Si no es recurrente o el alcance es ALL: eliminar registro por completo
  if (!tieneRecurrencia || alcance === 'ALL') {
    await db.actividades_personales.delete(id);
    if (act.codigo_legado) {
      await db.subtareas_pasos.where('id_padre_vinculado').equals(act.codigo_legado).delete();
    }
    if (act.agendado_calendar === 'Sí') {
      sincronizarActividadCalendar(act, 'DELETE', { alcance: 'ALL', fechaRef: fechaReferencia })
        .catch((e) => console.warn('[habitosService] Fallo en sincronización Calendar (DELETE ALL):', e));
    }
    return { success: true, alcanceAplicado: 'ALL' };
  }

  const nowIso = new Date().toISOString();
  const hoyStr = formatFechaIsoLocal(new Date());

  if (alcance === 'SINGLE') {
    // SINGLE: Registrar fechaReferencia en excepciones_fechas y avanzar fecha_programada
    const excepciones = Array.isArray(act.excepciones_fechas) ? [...act.excepciones_fechas] : [];
    if (!excepciones.includes(fechaReferencia)) {
      excepciones.push(fechaReferencia);
    }

    let proximaFecha = act.fecha_programada;
    if (act.fecha_programada === fechaReferencia) {
      const baseD = new Date(fechaReferencia + 'T12:00:00');
      baseD.setDate(baseD.getDate() + 1);
      proximaFecha = calcularProximaFechaValida(
        formatFechaIsoLocal(baseD),
        act.frecuencia_ciclo,
        act.regla_repeticion
      );
    }

    await db.actividades_personales.update(id, {
      excepciones_fechas: excepciones,
      fecha_programada: proximaFecha,
      version: (act.version || 1) + 1,
      updated_at: nowIso,
      sync_status: 'pending'
    });

    if (act.agendado_calendar === 'Sí') {
      sincronizarActividadCalendar(act, 'DELETE', { alcance: 'SINGLE', fechaRef: fechaReferencia })
        .catch((e) => console.warn('[habitosService] Fallo en sincronización Calendar (DELETE SINGLE):', e));
    }

    return { success: true, alcanceAplicado: 'SINGLE' };
  }

  if (alcance === 'FUTURE') {
    // FUTURE: Actualizar la actividad fijando fecha_fin o archivando si fechaReferencia <= hoy
    const dAnterior = new Date(fechaReferencia + 'T12:00:00');
    dAnterior.setDate(dAnterior.getDate() - 1);
    const fechaFin = formatFechaIsoLocal(dAnterior);

    const updates: Partial<ActividadPersonal> = {
      fecha_fin: fechaFin,
      version: (act.version || 1) + 1,
      updated_at: nowIso,
      sync_status: 'pending'
    };

    if (fechaReferencia <= hoyStr) {
      updates.estado = '05_Archivado';
    }

    await db.actividades_personales.update(id, updates);

    if (act.agendado_calendar === 'Sí') {
      sincronizarActividadCalendar(act, 'DELETE', { alcance: 'FUTURE', fechaRef: fechaReferencia })
        .catch((e) => console.warn('[habitosService] Fallo en sincronización Calendar (DELETE FUTURE):', e));
    }

    return { success: true, alcanceAplicado: 'FUTURE' };
  }

  return { success: false, alcanceAplicado: alcance };
}

/**
 * Edita una actividad personal aplicando desacoplamiento de instancia (SINGLE),
 * corte de serie (FUTURE) o mutación maestra de toda la serie (ALL).
 */
export async function editarActividadConAlcance(
  actividadOriginal: ActividadPersonal,
  cambios: Partial<ActividadPersonal>,
  alcance: 'SINGLE' | 'FUTURE' | 'ALL',
  fechaReferencia: string
): Promise<{
  actividadPrincipal: ActividadPersonal;
  instanciaDesacoplada?: ActividadPersonal;
  alcanceAplicado: 'SINGLE' | 'FUTURE' | 'ALL';
}> {
  const tieneRecurrencia = Boolean(
    (actividadOriginal.frecuencia_ciclo && actividadOriginal.frecuencia_ciclo !== 'NINGUNA') ||
    (actividadOriginal.regla_repeticion && actividadOriginal.regla_repeticion.trim() !== '') ||
    actividadOriginal.tipo_compromiso === 'HABITUAL'
  );

  const nowIso = new Date().toISOString();

  // Si no es recurrente o el alcance es ALL: mutación directa del registro maestro
  if (!tieneRecurrencia || alcance === 'ALL') {
    const actualizada: ActividadPersonal = {
      ...actividadOriginal,
      ...cambios,
      id: actividadOriginal.id,
      codigo_legado: actividadOriginal.codigo_legado,
      version: (actividadOriginal.version || 1) + 1,
      updated_at: nowIso,
      sync_status: 'pending'
    };
    await db.actividades_personales.put(actualizada);
    if (actualizada.agendado_calendar === 'Sí') {
      sincronizarActividadCalendar(actualizada, 'UPSERT', { alcance: 'ALL', fechaRef: fechaReferencia })
        .catch((e) => console.warn('[habitosService] Fallo en sincronización Calendar (EDIT ALL):', e));
    }
    return { actividadPrincipal: actualizada, alcanceAplicado: 'ALL' };
  }

  if (alcance === 'SINGLE') {
    // Desacoplamiento de instancia:
    // 1. Excluir fechaReferencia en la serie maestra
    const excepciones = Array.isArray(actividadOriginal.excepciones_fechas)
      ? [...actividadOriginal.excepciones_fechas]
      : [];
    if (!excepciones.includes(fechaReferencia)) {
      excepciones.push(fechaReferencia);
    }

    let nuevaFechaMaestra = actividadOriginal.fecha_programada;
    if (actividadOriginal.fecha_programada === fechaReferencia) {
      const baseD = new Date(fechaReferencia + 'T12:00:00');
      baseD.setDate(baseD.getDate() + 1);
      nuevaFechaMaestra = calcularProximaFechaValida(
        formatFechaIsoLocal(baseD),
        actividadOriginal.frecuencia_ciclo,
        actividadOriginal.regla_repeticion
      );
    }

    const maestraActualizada: ActividadPersonal = {
      ...actividadOriginal,
      excepciones_fechas: excepciones,
      fecha_programada: nuevaFechaMaestra,
      version: (actividadOriginal.version || 1) + 1,
      updated_at: nowIso,
      sync_status: 'pending'
    };
    await db.actividades_personales.put(maestraActualizada);

    // 2. Crear una instancia puntual desacoplada para la fecha referenciada
    const count = await db.actividades_personales.count();
    const nuevoCodigo = `ACT-${String(count + 1).padStart(3, '0')}`;
    const instanciaDesacoplada: ActividadPersonal = {
      ...actividadOriginal,
      ...cambios,
      id: crypto.randomUUID(),
      codigo_legado: nuevoCodigo,
      tipo_compromiso: 'PUNTUAL',
      frecuencia_ciclo: 'NINGUNA',
      regla_repeticion: '',
      fecha_programada: fechaReferencia,
      actividad_padre_id: actividadOriginal.id,
      version: 1,
      created_at: nowIso,
      updated_at: nowIso,
      sync_status: 'pending'
    };
    await db.actividades_personales.add(instanciaDesacoplada);

    if (instanciaDesacoplada.agendado_calendar === 'Sí') {
      sincronizarActividadCalendar(instanciaDesacoplada, 'UPSERT', { alcance: 'SINGLE', fechaRef: fechaReferencia })
        .catch((e) => console.warn('[habitosService] Fallo en sincronización Calendar (EDIT SINGLE):', e));
    }

    return {
      actividadPrincipal: maestraActualizada,
      instanciaDesacoplada,
      alcanceAplicado: 'SINGLE'
    };
  }

  if (alcance === 'FUTURE') {
    // Corte de serie:
    // 1. Finalizar la serie anterior en fechaReferencia - 1 día
    const dAnterior = new Date(fechaReferencia + 'T12:00:00');
    dAnterior.setDate(dAnterior.getDate() - 1);
    const fechaFinAnterior = formatFechaIsoLocal(dAnterior);

    const maestraAnterior: ActividadPersonal = {
      ...actividadOriginal,
      fecha_fin: fechaFinAnterior,
      version: (actividadOriginal.version || 1) + 1,
      updated_at: nowIso,
      sync_status: 'pending'
    };
    await db.actividades_personales.put(maestraAnterior);

    // 2. Crear una nueva serie recurrente que arranca en fechaReferencia con los cambios aplicados
    const count = await db.actividades_personales.count();
    const nuevoCodigo = `ACT-${String(count + 1).padStart(3, '0')}`;
    const nuevaSerieFutura: ActividadPersonal = {
      ...actividadOriginal,
      ...cambios,
      id: crypto.randomUUID(),
      codigo_legado: nuevoCodigo,
      fecha_programada: fechaReferencia,
      actividad_padre_id: actividadOriginal.id,
      version: 1,
      created_at: nowIso,
      updated_at: nowIso,
      sync_status: 'pending'
    };
    await db.actividades_personales.add(nuevaSerieFutura);

    if (nuevaSerieFutura.agendado_calendar === 'Sí') {
      sincronizarActividadCalendar(nuevaSerieFutura, 'UPSERT', { alcance: 'FUTURE', fechaRef: fechaReferencia })
        .catch((e) => console.warn('[habitosService] Fallo en sincronización Calendar (EDIT FUTURE):', e));
    }

    return {
      actividadPrincipal: nuevaSerieFutura,
      alcanceAplicado: 'FUTURE'
    };
  }

  return { actividadPrincipal: actividadOriginal, alcanceAplicado: 'ALL' };
}
