/**
 * ============================================================================
 * ARCHIVO: src/utils/timeFormatters.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-MODAL-ACTIVIDAD-RECURRENCIA-FORMATO-NOTAS-EXEC-71
 * DESCRIPCIÓN: Helpers canónicos de conversión y formateo de tiempo, duraciones
 *              H:MM, representación amigable Xh Ymin y parsing resiliente.
 * ============================================================================
 */

/**
 * Formatea una duración en horas decimal a una cadena amigable y humana (ej: '1h 30min', '45min', '2h').
 */
export function formatearDuracionLegible(horasDecimal: number | undefined | null): string {
  if (horasDecimal === undefined || horasDecimal === null || isNaN(horasDecimal) || horasDecimal <= 0) {
    return '0 min';
  }
  const totalMinutos = Math.round(horasDecimal * 60);
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

/**
 * Convierte una cadena de texto en formato 'H:MM', 'H', 'MMm', 'MMmin' o decimal a número de horas decimal.
 * Ej: '1:30' -> 1.5, '0:45' -> 0.75, '90m' -> 1.5, '45min' -> 0.75, '1,5' -> 1.5
 */
export function convertirStringToHorasDecimal(str: string | undefined | null): number {
  if (!str || typeof str !== 'string') return 0;
  const s = str.trim().toLowerCase();
  if (!s) return 0;

  // Formato minutos puro: '90m' o '45min'
  if (s.endsWith('min') || s.endsWith('m')) {
    const minVal = parseFloat(s.replace(/[^0-9.]/g, ''));
    return isNaN(minVal) ? 0 : Number((minVal / 60).toFixed(2));
  }

  // Formato H:MM o HH:MM
  if (s.includes(':')) {
    const parts = s.split(':');
    const horas = parseInt(parts[0], 10) || 0;
    const minutos = parseInt(parts[1], 10) || 0;
    return Number((horas + minutos / 60).toFixed(2));
  }

  // Formato horas con sufijo 'h': '1.5h' o '2h'
  if (s.endsWith('h')) {
    const hVal = parseFloat(s.replace(/[^0-9.,]/g, '').replace(',', '.'));
    return isNaN(hVal) ? 0 : Number(hVal.toFixed(2));
  }

  // Formato decimal directo '1.5', '1,5' o '2'
  const parsed = parseFloat(s.replace(',', '.'));
  return isNaN(parsed) ? 0 : Number(parsed.toFixed(2));
}

/**
 * Convierte un valor numérico decimal de horas a cadena canónica 'H:MM'.
 * Ej: 1.5 -> '1:30', 0.75 -> '0:45', 2 -> '2:00', 0 -> '0:00'
 */
export function convertirHorasDecimalAString(horasDecimal: number | undefined | null): string {
  if (horasDecimal === undefined || horasDecimal === null || isNaN(horasDecimal) || horasDecimal <= 0) {
    return '0:00';
  }
  const totalMinutos = Math.round(horasDecimal * 60);
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

/**
 * Formatea un objeto Date en cadena canónica 'YYYY-MM-DD' en el huso horario local del usuario,
 * erradicando el desfase nocturno de UTC (como UTC-5 Lima a partir de las 19:00).
 */
export function formatFechaIsoLocal(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formatea una fecha ISO o cadena estándar a formato canónico 'DD/MM/AAAA' (ej: '15/11/2026').
 * Acepta fechas ISO ('2026-11-15', '2026-11-15T08:00:00Z') o Date objects.
 */
export function formatearFechaDdMmYyyy(fecha?: string | Date | null, fallback = '-'): string {
  if (!fecha) return fallback;
  if (fecha instanceof Date) {
    if (isNaN(fecha.getTime())) return fallback;
    const d = String(fecha.getDate()).padStart(2, '0');
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const y = fecha.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const clean = String(fecha).trim().split(/[\sT]/)[0];
  if (!clean) return fallback;

  // Si ya viene como DD/MM/AAAA
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Si viene como YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    const [y, m, d] = clean.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Si viene como YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(clean)) {
    const [y, m, d] = clean.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  return clean;
}

/**
 * Formatea una fecha a representación corta 'DD/MM' (ej: '15/11').
 */
export function formatearFechaDdMm(fecha?: string | Date | null, fallback = 'S/F'): string {
  if (!fecha) return fallback;
  const full = formatearFechaDdMmYyyy(fecha, '');
  if (!full) return fallback;
  const partes = full.split('/');
  return partes.length >= 2 ? `${partes[0]}/${partes[1]}` : full;
}

/**
 * Convierte una fecha 'DD/MM/AAAA' a formato canónico ISO 'YYYY-MM-DD'.
 */
export function parsearFechaDdMmYyyyAIso(fechaDdMmYyyy?: string | null): string {
  if (!fechaDdMmYyyy) return '';
  const clean = String(fechaDdMmYyyy).trim().split(/[\sT]/)[0];
  if (!clean) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  if (clean.includes('/')) {
    const [d, m, y] = clean.split('/');
    if (d && m && y && y.length === 4) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return '';
}


