/**
 * ============================================================================
 * ARCHIVO: src/utils/finanzasHelpers.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-FINANZAS-GASTOS-02
 * DESCRIPCIÓN: Helpers puros y deterministas de clasificación de segmento
 *              (Proyectos vs Personal) y coincidencia de periodos inmune a
 *              desfases horarios de medianoche en UTC-5.
 * ============================================================================
 */

export type SegmentoFinanzas = 'TODOS' | 'PROYECTOS' | 'PERSONAL';
export type PeriodoFinanzas = 'MES_ACTUAL' | 'MES_ANTERIOR' | 'ULTIMOS_3_MESES' | 'ANIO_ACTUAL' | 'TODOS';

/**
 * Helper canónico y puro para clasificar si un gasto pertenece al segmento PROYECTOS o PERSONAL.
 * Protege contra discrepancias en tipo_origen y prefijos de id_origen_vinculado / id_proyecto.
 */
export function esGastoDeProyecto(g: any): boolean {
  if (!g) return false;
  const origen = String(g.tipo_origen || '').toUpperCase();
  const vinc = String(g.id_origen_vinculado || g.ID_Origen_Vinculado || g.id_tarea || g.ID_Tarea || '').toUpperCase();
  const proyIdRaw = String(g.id_proyecto || g.ID_Proyecto || '').trim().toUpperCase();
  const proyId = proyIdRaw !== 'NINGUNO' && (proyIdRaw.startsWith('PRO-') || proyIdRaw.startsWith('PRY-') || proyIdRaw.startsWith('P000') || Boolean(g.id_proyecto)) ? proyIdRaw : '';

  // Origen explícito de Proyecto o Tarea
  if (origen === 'PROYECTO' || origen === 'TAREA' || origen === 'TAREA_PROYECTO') return true;
  // Origen explícito de Actividad Personal
  if (origen === 'ACTIVIDAD_PERSONAL' || origen === 'PERSONAL') return false;
  // Vinculación explícita a Actividad / Hábito
  if (vinc.startsWith('ACT-') || vinc.startsWith('HAB-')) return false;
  // Id de proyecto directo o vinculación a entidad de proyectos (PRY, TAR, WP, HIT)
  if (Boolean(proyId) || vinc.startsWith('PRY-') || vinc.startsWith('TAR-') || vinc.startsWith('WP-') || vinc.startsWith('HIT-')) return true;

  return false;
}

/**
 * Resuelve de forma determinista el costo ejecutado (AC) y cantidad de gastos imputados a un proyecto,
 * soportando imputación directa (id_proyecto / ID_Proyecto / id_origen_vinculado) o indirecta
 * a través de tareas (tarea -> proyecto) e hitos (hito -> proyecto).
 */
export function resolverCostoEjecutadoProyecto(
  p: any,
  gastos: any[] = [],
  tareasAProyectoMap?: Map<string, string>,
  hitosAProyectoMap?: Map<string, string>
): { ac: number; cantidadGastos: number; esDinamico: boolean } {
  if (!p) return { ac: 0, cantidadGastos: 0, esDinamico: false };
  const pCod = String(p.codigo_legado || p.ID_Proyecto || '').trim().toUpperCase();
  const pId = String(p.id || '').trim().toUpperCase();

  let totalDinamico = 0;
  let cantidad = 0;

  for (const g of gastos) {
    const monto = Number(g.monto_pen || g.monto_original || 0);
    const proyDirecto = String(g.id_proyecto || g.ID_Proyecto || '').trim().toUpperCase();
    const vinc = String(g.id_origen_vinculado || g.ID_Origen_Vinculado || g.id_tarea || g.ID_Tarea || '').trim().toUpperCase();
    const hitoGasto = String(g.ID_Hito || g.id_hito || '').trim().toUpperCase();

    let coincide = false;

    // Coincidencia directa con código o ID del proyecto
    if (proyDirecto && proyDirecto !== 'NINGUNO' && (proyDirecto === pCod || proyDirecto === pId)) {
      coincide = true;
    } else if (vinc && (vinc === pCod || vinc === pId)) {
      coincide = true;
    } else if (vinc && tareasAProyectoMap && (tareasAProyectoMap.get(vinc) === pCod || tareasAProyectoMap.get(vinc) === pId)) {
      coincide = true;
    } else if (vinc && hitosAProyectoMap && (hitosAProyectoMap.get(vinc) === pCod || hitosAProyectoMap.get(vinc) === pId)) {
      coincide = true;
    } else if (hitoGasto && hitosAProyectoMap && (hitosAProyectoMap.get(hitoGasto) === pCod || hitosAProyectoMap.get(hitoGasto) === pId)) {
      coincide = true;
    }

    if (coincide) {
      totalDinamico += monto;
      cantidad += 1;
    }
  }

  const fallback = Number(p.costo_ejecutado_real_pen || p.Costo_Ejecutado_Real_PEN || 0);
  const acFinal = totalDinamico > 0 ? totalDinamico : fallback;

  return {
    ac: acFinal,
    cantidadGastos: cantidad,
    esDinamico: totalDinamico > 0
  };
}

/**
 * Helper canónico y puro para clasificar si un ingreso pertenece al segmento PROYECTOS o PERSONAL.
 */
export function esIngresoDeProyecto(i: any): boolean {
  if (!i) return false;
  const origen = String(i.tipo_origen || '').toUpperCase();
  if (origen === 'PROYECTO' || origen === 'PROYECTOS') return true;
  return false;
}

/**
 * Helper canónico inmune a bugs de huso horario UTC (evita desfase de medianoche en UTC-5).
 * Evalúa localmente año, mes y día a partir de strings 'YYYY-MM-DD'.
 */
export function coincideFechaConPeriodo(
  fechaStr: string | undefined | null,
  periodo: PeriodoFinanzas,
  mesHoy: number,
  anioHoy: number,
  mesAnt: number,
  anioAnt: number
): boolean {
  if (periodo === 'TODOS') return true;
  if (!fechaStr) return true;
  const partes = String(fechaStr).slice(0, 10).split('-');
  if (partes.length < 3) return true;
  const anio = Number(partes[0]);
  const mes = Number(partes[1]) - 1; // 0-based
  if (Number.isNaN(anio) || Number.isNaN(mes)) return true;

  if (periodo === 'MES_ACTUAL') {
    return mes === mesHoy && anio === anioHoy;
  }
  if (periodo === 'MES_ANTERIOR') {
    return mes === mesAnt && anio === anioAnt;
  }
  if (periodo === 'ANIO_ACTUAL') {
    return anio === anioHoy;
  }
  if (periodo === 'ULTIMOS_3_MESES') {
    const dItem = new Date(anio, mes, Number(partes[2]) || 1);
    const dInicio = new Date(anioHoy, mesHoy - 2, 1);
    return dItem >= dInicio && anio === anioHoy && mes <= mesHoy;
  }
  return true;
}
