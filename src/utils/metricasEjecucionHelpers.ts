/**
 * ============================================================================
 * ARCHIVO: src/utils/metricasEjecucionHelpers.ts
 * SISTEMA: PMO Personal & Life OS
 * REQUISITO: REQ-METRICS-EXECUTION-02
 * DESCRIPCIÓN: Motor puro de cálculo para trazabilidad de ejecución real,
 *              desfase temporal (mora/adelanto) y desviación de esfuerzo.
 *              Blindado contra bugs de desfase por zona horaria UTC-5.
 * ============================================================================
 */

export interface ClasificacionDesfase {
  tipo: 'MORA' | 'ADELANTO' | 'A_TIEMPO' | 'SIN_DATO';
  etiqueta: string;
  dias: number;
}

export interface DesviacionEsfuerzo {
  estimado: number;
  real: number;
  deltaHoras: number;
  pctEficiencia: number | null;
}

/**
 * Parsea una cadena de fecha YYYY-MM-DD en sus componentes enteros puros.
 * Evita la llamada directa a `new Date("YYYY-MM-DD")` que genera desfases por UTC-5.
 */
export function parsearFechaPartes(fechaIso?: string | null): { anio: number; mes: number; dia: number } | null {
  if (!fechaIso) return null;
  const limpia = String(fechaIso).split(/[\sT]/)[0].trim();
  const match = limpia.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const anio = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const dia = parseInt(match[3], 10);

  if (isNaN(anio) || isNaN(mes) || isNaN(dia) || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
    return null;
  }

  return { anio, mes, dia };
}

/**
 * Calcula la diferencia en días entre la fecha programada y la fecha real de ejecución.
 * Utiliza Date.UTC(anio, mes - 1, dia) para garantizar aritmética de medianoche UTC pura,
 * inmune a cambios de horario de verano o zonas horarias locales.
 *
 * @param fechaProgramada Fecha estipulada originalmente (YYYY-MM-DD)
 * @param fechaReal Fecha en que efectivamente se ejecutó/completó (YYYY-MM-DD)
 * @returns Entero en días:
 *          > 0 : Mora (+N días de retraso)
 *          < 0 : Adelanto (-N días antes de lo previsto)
 *          = 0 : Completado a tiempo (el mismo día)
 *          null: Si alguna de las fechas es inválida o no está definida
 */
export function calcularDesfaseDias(fechaProgramada?: string | null, fechaReal?: string | null): number | null {
  const prog = parsearFechaPartes(fechaProgramada);
  const real = parsearFechaPartes(fechaReal);
  if (!prog || !real) return null;

  const utProg = Date.UTC(prog.anio, prog.mes - 1, prog.dia);
  const utReal = Date.UTC(real.anio, real.mes - 1, real.dia);
  const MS_POR_DIA = 1000 * 60 * 60 * 24;

  return Math.round((utReal - utProg) / MS_POR_DIA);
}

/**
 * Clasifica semánticamente el desfase de días para su presentación visual.
 */
export function clasificarDesfase(dias: number | null): ClasificacionDesfase {
  if (dias === null || isNaN(dias)) {
    return {
      tipo: 'SIN_DATO',
      etiqueta: 'Sin dato',
      dias: 0
    };
  }

  if (dias > 0) {
    return {
      tipo: 'MORA',
      etiqueta: `Mora (+${dias}d)`,
      dias
    };
  }

  if (dias < 0) {
    return {
      tipo: 'ADELANTO',
      etiqueta: `Adelanto (${dias}d)`,
      dias
    };
  }

  return {
    tipo: 'A_TIEMPO',
    etiqueta: 'A tiempo',
    dias: 0
  };
}

/**
 * Calcula la desviación entre el esfuerzo estimado y el esfuerzo real en horas.
 *
 * @param estimado Horas estimadas planificadas
 * @param real Horas reales invertidas
 * @returns DesviacionEsfuerzo con horas normalizadas, deltaHoras y porcentaje de eficiencia
 */
export function calcularDesviacionEsfuerzo(estimado?: number | null, real?: number | null): DesviacionEsfuerzo {
  const est = Math.max(0, Number(estimado) || 0);
  const rel = Math.max(0, Number(real) || 0);
  const deltaHoras = Number((rel - est).toFixed(2));

  let pctEficiencia: number | null = null;
  if (est > 0) {
    pctEficiencia = Number(((rel / est) * 100).toFixed(1));
  }

  return {
    estimado: est,
    real: rel,
    deltaHoras,
    pctEficiencia
  };
}
