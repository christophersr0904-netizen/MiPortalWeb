import type { ActividadPersonal } from '../types';
import { formatFechaIsoLocal } from './timeFormatters';

export const TIMEZONE_LIMA = 'America/Lima';

const MAP_DIA_A_INDICE: Record<string, number> = {
  D: 0, DO: 0, DOM: 0, SU: 0, SUN: 0,
  L: 1, LU: 1, LUN: 1, MO: 1, MON: 1,
  M: 2, MA: 2, MAR: 2, TU: 2, TUE: 2,
  X: 3, MI: 3, MIE: 3, MIER: 3, WE: 3, WED: 3,
  J: 4, JU: 4, JUE: 4, TH: 4, THU: 4,
  V: 5, VI: 5, VIE: 5, FR: 5, FRI: 5,
  S: 6, SA: 6, SAB: 6, SAT: 6
};

const INDICE_A_RFC_BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;
const INDICE_ORDEN_RFC = [1, 2, 3, 4, 5, 6, 0] as const;

export interface ReglaRecurrenciaParsed {
  esRecurrente: boolean;
  frecuenciaBase: 'NINGUNA' | 'DIARIA' | 'DIARIA_LABORAL' | 'FIN_SEMANA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
  unidad: 'NONE' | 'DIAS' | 'SEMANAS' | 'MESES';
  intervalo: number;
  diasIndices: number[];
  diasByDayRFC: string[];
}

export interface EventoGoogleCalendarV3 {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  recurrence?: string[];
  extendedProperties?: {
    private: Record<string, string>;
  };
}

/**
 * Normaliza fechas ISO o legadas (YYYY-MM-DD, YYYY/MM/DD, M/D/YYYY, con/sin hora) a 'YYYY-MM-DD'.
 */
export function normalizarFechaIso(raw?: string | null): string {
  if (!raw) return '';
  const str = String(raw).trim();
  if (!str) return '';
  const parteFecha = str.split(/[\sT]/)[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(parteFecha)) {
    return parteFecha;
  }

  if (parteFecha.includes('/') || (parteFecha.includes('-') && /^\d{1,2}-\d{1,2}-\d{4}$/.test(parteFecha))) {
    const separador = parteFecha.includes('/') ? '/' : '-';
    const trozos = parteFecha.split(separador);
    if (trozos.length === 3) {
      if (trozos[0].length === 4) {
        return `${trozos[0]}-${trozos[1].padStart(2, '0')}-${trozos[2].padStart(2, '0')}`;
      }
      const [d, m, y] = trozos;
      if (y && m && d) {
        return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
  }

  return '';
}

/**
 * Construye Date local al mediodía (12:00:00) para evitar desfases DST/UTC en aritmética de calendario.
 */
export function parsearFechaLocalMediodia(fechaIso?: string | null): Date | null {
  const norm = normalizarFechaIso(fechaIso);
  if (!norm) return null;
  const [yStr, mStr, dStr] = norm.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Normaliza hora de inicio a 'HH:mm' (24h), con fallback '08:00'.
 */
export function normalizarHora24(raw?: string | null, fallback = '08:00'): string {
  if (!raw) return fallback;
  const match = String(raw).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return fallback;
  const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function obtenerLunesSemana(fecha: Date): Date {
  const copia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 12, 0, 0);
  const day = copia.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  copia.setDate(copia.getDate() + offset);
  return copia;
}

export type ActividadRecurrenciaInput =
  | Partial<ActividadPersonal>
  | (Partial<Omit<ActividadPersonal, 'tipo_compromiso' | 'frecuencia_ciclo' | 'categoria_vida'>> & {
      tipo_compromiso?: string;
      frecuencia_ciclo?: string;
      categoria_vida?: string;
      [key: string]: any;
    });

function resolverCampo(obj: ActividadRecurrenciaInput | undefined | null, ...keys: string[]): any {
  if (!obj) return undefined;
  const rec = obj as Record<string, any>;
  for (const k of keys) {
    if (rec[k] !== undefined && rec[k] !== null && rec[k] !== '') return rec[k];
  }
  return undefined;
}

/**
 * Parsea `frecuencia_ciclo`, `regla_repeticion` y `tipo_compromiso` en una estructura canónica.
 */
export function parsearReglaRecurrencia(
  actividad: ActividadRecurrenciaInput
): ReglaRecurrenciaParsed {
  const freqRaw = String(
    resolverCampo(actividad, 'frecuencia_ciclo', 'Frecuencia_Ciclo') ?? 'NINGUNA'
  ).toUpperCase().trim();

  const reglaRaw = String(
    resolverCampo(actividad, 'regla_repeticion', 'Regla_Repeticion') ?? ''
  ).toUpperCase().trim();

  const tipoRaw = String(
    resolverCampo(actividad, 'tipo_compromiso', 'Tipo_Compromiso', 'tipo_registro') ?? ''
  ).toUpperCase().trim();

  const esPuntualExplicita = freqRaw === 'NINGUNA' && reglaRaw === '' && tipoRaw === 'PUNTUAL';
  const tieneReglaExplicita = Boolean((freqRaw && freqRaw !== 'NINGUNA') || reglaRaw !== '');
  const esRecurrente = !esPuntualExplicita && (tieneReglaExplicita || tipoRaw !== 'PUNTUAL');

  if (!esRecurrente || (freqRaw === 'NINGUNA' && reglaRaw === '')) {
    return {
      esRecurrente: false,
      frecuenciaBase: 'NINGUNA',
      unidad: 'NONE',
      intervalo: 1,
      diasIndices: [],
      diasByDayRFC: []
    };
  }

  let intervalo = 1;
  let unidadOverride: 'DIAS' | 'SEMANAS' | 'MESES' | null = null;

  const matchIntervalo = reglaRaw.match(/INTERVALO:(\d+):(DIAS|SEMANAS|MESES)/);
  if (matchIntervalo) {
    intervalo = Math.max(1, parseInt(matchIntervalo[1], 10) || 1);
    unidadOverride = matchIntervalo[2] as 'DIAS' | 'SEMANAS' | 'MESES';
  }

  // Extraer días de semana de la regla
  const diasSet = new Set<number>();
  if (reglaRaw === 'L-V' || freqRaw === 'DIARIA_LABORAL') {
    [1, 2, 3, 4, 5].forEach((d) => diasSet.add(d));
  } else if (freqRaw === 'FIN_SEMANA' || reglaRaw === 'DIAS:S,D') {
    [6, 0].forEach((d) => diasSet.add(d));
  }

  if (reglaRaw.includes('DIAS:')) {
    const parteDias = reglaRaw.split('DIAS:')[1].split(';')[0];
    parteDias.split(',').forEach((tk) => {
      const idx = MAP_DIA_A_INDICE[tk.trim()];
      if (idx !== undefined) diasSet.add(idx);
    });
  } else if (/^[A-Z,\s]+$/.test(reglaRaw) && !reglaRaw.includes('INTERVALO')) {
    reglaRaw.split(',').forEach((tk) => {
      const idx = MAP_DIA_A_INDICE[tk.trim()];
      if (idx !== undefined) diasSet.add(idx);
    });
  }

  let frecuenciaBase: ReglaRecurrenciaParsed['frecuenciaBase'] = 'DIARIA';
  let unidad: ReglaRecurrenciaParsed['unidad'] = 'DIAS';

  if (unidadOverride === 'MESES' || freqRaw === 'MENSUAL') {
    frecuenciaBase = 'MENSUAL';
    unidad = 'MESES';
  } else if (freqRaw === 'QUINCENAL') {
    frecuenciaBase = 'QUINCENAL';
    unidad = 'SEMANAS';
    if (!matchIntervalo) intervalo = 2;
  } else if (unidadOverride === 'SEMANAS' || freqRaw === 'SEMANAL') {
    frecuenciaBase = 'SEMANAL';
    unidad = 'SEMANAS';
  } else if (freqRaw === 'DIARIA_LABORAL') {
    frecuenciaBase = 'DIARIA_LABORAL';
    unidad = 'DIAS';
  } else if (freqRaw === 'FIN_SEMANA') {
    frecuenciaBase = 'FIN_SEMANA';
    unidad = 'DIAS';
  } else {
    frecuenciaBase = 'DIARIA';
    unidad = 'DIAS';
  }

  const diasIndices = INDICE_ORDEN_RFC.filter((idx) => diasSet.has(idx));
  const diasByDayRFC = diasIndices.map((idx) => INDICE_A_RFC_BYDAY[idx]);

  return {
    esRecurrente: true,
    frecuenciaBase,
    unidad,
    intervalo,
    diasIndices,
    diasByDayRFC
  };
}

/**
 * Evalúa con fidelidad 1:1 si una actividad puntual o recurrente ocurre en `fechaIso` ('YYYY-MM-DD'),
 * respetando inicio (`fecha_programada`), término (`fecha_fin`), exclusiones (`excepciones_fechas`),
 * días de semana, quincenas, meses e intervalos personalizados (`INTERVALO:N:...`).
 */
export function evaluarOcurrenciaEnFecha(
  actividad: ActividadRecurrenciaInput,
  fechaIso: string
): boolean {
  const fObjetivo = normalizarFechaIso(fechaIso);
  const dObj = parsearFechaLocalMediodia(fObjetivo);
  if (!fObjetivo || !dObj) return false;

  const fInicio = normalizarFechaIso(
    resolverCampo(actividad, 'fecha_programada', 'Fecha_Programada')
  );
  const fFin = normalizarFechaIso(
    resolverCampo(actividad, 'fecha_fin', 'Fecha_Fin')
  );

  // 1. Verificar exclusiones explícitas (instancias eliminadas/editadas 'SINGLE')
  const excRaw = resolverCampo(actividad, 'excepciones_fechas', 'Excepciones_Fechas');
  if (Array.isArray(excRaw)) {
    const esExcluida = excRaw.some((ex) => normalizarFechaIso(String(ex)) === fObjetivo);
    if (esExcluida) return false;
  }

  // 2. Verificar rango temporal [fecha_programada, fecha_fin]
  if (fInicio && fObjetivo < fInicio) return false;
  if (fFin && fObjetivo > fFin) return false;

  const parsed = parsearReglaRecurrencia(actividad);

  // 3. Caso puntual: solo ocurre exactamente en fecha_programada
  if (!parsed.esRecurrente) {
    return Boolean(fInicio && fObjetivo === fInicio);
  }

  const dIni = parsearFechaLocalMediodia(fInicio) || dObj;
  const diaSemanaObj = dObj.getDay();

  // 4. Evaluación por cadencia
  if (parsed.unidad === 'DIAS') {
    if (parsed.diasIndices.length > 0 && parsed.diasIndices.length < 7) {
      if (!parsed.diasIndices.includes(diaSemanaObj)) return false;
    }
    if (parsed.intervalo > 1) {
      const diffDias = Math.round((dObj.getTime() - dIni.getTime()) / 86400000);
      if (diffDias < 0 || diffDias % parsed.intervalo !== 0) return false;
    }
    return true;
  }

  if (parsed.unidad === 'SEMANAS') {
    const diasPermitidos = parsed.diasIndices.length > 0 ? parsed.diasIndices : [dIni.getDay()];
    if (!diasPermitidos.includes(diaSemanaObj)) return false;

    if (parsed.intervalo > 1) {
      const semIni = obtenerLunesSemana(dIni);
      const semObj = obtenerLunesSemana(dObj);
      const diffSemanas = Math.round((semObj.getTime() - semIni.getTime()) / (7 * 86400000));
      if (diffSemanas < 0 || diffSemanas % parsed.intervalo !== 0) return false;
    }
    return true;
  }

  if (parsed.unidad === 'MESES') {
    const diffMeses =
      (dObj.getFullYear() - dIni.getFullYear()) * 12 +
      (dObj.getMonth() - dIni.getMonth());
    if (diffMeses < 0 || diffMeses % parsed.intervalo !== 0) return false;

    const ultimoDiaMes = new Date(dObj.getFullYear(), dObj.getMonth() + 1, 0).getDate();
    const diaEsperado = Math.min(dIni.getDate(), ultimoDiaMes);
    return dObj.getDate() === diaEsperado;
  }

  return false;
}

/**
 * Construye una cadena estándar RFC-5545 `RRULE:...` compatible con Google Calendar REST API v3.
 * Retorna `null` si la actividad es puntual.
 */
export function construirRRuleRFC5545(
  actividad: ActividadRecurrenciaInput
): string | null {
  const parsed = parsearReglaRecurrencia(actividad);
  if (!parsed.esRecurrente) return null;

  const partes: string[] = [];
  const fInicio = normalizarFechaIso(
    resolverCampo(actividad, 'fecha_programada', 'Fecha_Programada')
  );
  const dIni = parsearFechaLocalMediodia(fInicio);

  if (parsed.unidad === 'DIAS') {
    if (parsed.diasIndices.length > 0 && parsed.diasIndices.length < 7 && parsed.intervalo === 1) {
      partes.push('FREQ=WEEKLY');
      partes.push(`BYDAY=${parsed.diasByDayRFC.join(',')}`);
    } else {
      partes.push('FREQ=DAILY');
      if (parsed.intervalo > 1) partes.push(`INTERVAL=${parsed.intervalo}`);
    }
  } else if (parsed.unidad === 'SEMANAS') {
    partes.push('FREQ=WEEKLY');
    if (parsed.intervalo > 1) partes.push(`INTERVAL=${parsed.intervalo}`);
    const byDay =
      parsed.diasByDayRFC.length > 0
        ? parsed.diasByDayRFC
        : dIni
        ? [INDICE_A_RFC_BYDAY[dIni.getDay()]]
        : ['MO'];
    partes.push(`BYDAY=${byDay.join(',')}`);
  } else if (parsed.unidad === 'MESES') {
    partes.push('FREQ=MONTHLY');
    if (parsed.intervalo > 1) partes.push(`INTERVAL=${parsed.intervalo}`);
  } else {
    return null;
  }

  const fFin = normalizarFechaIso(resolverCampo(actividad, 'fecha_fin', 'Fecha_Fin'));
  if (fFin) {
    partes.push(`UNTIL=${fFin.replace(/-/g, '')}T235959Z`);
  }

  return `RRULE:${partes.join(';')}`;
}

function calcularFinLocalLima(fechaIso: string, horaInicio: string, duracionHoras: number): {
  fechaFin: string;
  horaFin: string;
} {
  const [y, m, d] = fechaIso.split('-').map((n) => parseInt(n, 10));
  const [hh, mm] = horaInicio.split(':').map((n) => parseInt(n, 10));
  const durMinutos = Math.max(15, Math.round((duracionHoras || 1) * 60));

  const inicioDate = new Date(y, m - 1, d, hh, mm, 0);
  const finDate = new Date(inicioDate.getTime() + durMinutos * 60000);

  return {
    fechaFin: formatFechaIsoLocal(finDate),
    horaFin: `${String(finDate.getHours()).padStart(2, '0')}:${String(finDate.getMinutes()).padStart(2, '0')}`
  };
}

function construirDescripcionCalendar(actividad: ActividadRecurrenciaInput): string {
  const rec = actividad as Record<string, any>;
  const lineas: string[] = [];
  if (rec.codigo_legado) lineas.push(`Código: ${rec.codigo_legado}`);
  if (rec.proyecto_codigo) lineas.push(`Proyecto: ${rec.proyecto_codigo}`);
  if (rec.hito_codigo) lineas.push(`Hito: ${rec.hito_codigo}`);
  if (rec.categoria_vida) lineas.push(`Pilar: ${String(rec.categoria_vida).replace(/_/g, ' ')}`);
  if (rec.meta_macro_nombre) lineas.push(`Meta: ${rec.meta_macro_nombre}`);
  const notasTexto =
    rec.notas_checklist ||
    rec.notas_impedimentos ||
    rec.descripcion_gasto ||
    rec.descripcion_ingreso;
  if (notasTexto && String(notasTexto).trim()) {
    lineas.push('', String(notasTexto).trim());
  }
  return lineas.join('\n');
}

/**
 * Construye el payload oficial de evento para Google Calendar REST API v3 (`/calendars/primary/events`).
 */
export function construirEventoGoogleCalendarV3(
  actividad: ActividadRecurrenciaInput
): EventoGoogleCalendarV3 {
  const fechaBase =
    normalizarFechaIso(
      resolverCampo(
        actividad,
        'fecha_programada',
        'Fecha_Programada',
        'fecha_gasto',
        'fecha_ingreso',
        'fecha_vencimiento'
      )
    ) || formatFechaIsoLocal();
  const horaBase = normalizarHora24(resolverCampo(actividad, 'hora_inicio', 'Hora_Inicio'), '08:00');
  const durHoras = Number(
    resolverCampo(actividad, 'duracion_horas', 'Duracion_Horas', 'horas_estimadas') ?? 1
  ) || 1;
  const { fechaFin, horaFin } = calcularFinLocalLima(fechaBase, horaBase, durHoras);

  const summary = String(
    resolverCampo(
      actividad,
      'nombre_actividad',
      'nombre',
      'Nombre_Actividad',
      'titulo',
      'nombre_tarea_actividad',
      'descripcion_gasto',
      'descripcion_ingreso'
    ) || 'Actividad PMO'
  ).trim();

  const rrule = construirRRuleRFC5545(actividad);
  const recurrence: string[] = [];
  if (rrule) {
    recurrence.push(rrule);
    const excRaw = resolverCampo(actividad, 'excepciones_fechas', 'Excepciones_Fechas');
    if (Array.isArray(excRaw) && excRaw.length > 0) {
      const exDatesCompact = excRaw
        .map((f) => normalizarFechaIso(String(f)))
        .filter(Boolean)
        .map((iso) => `${iso.replace(/-/g, '')}T${horaBase.replace(':', '')}00`);
      if (exDatesCompact.length > 0) {
        recurrence.push(`EXDATE;TZID=${TIMEZONE_LIMA}:${exDatesCompact.join(',')}`);
      }
    }
  }

  return {
    summary,
    description: construirDescripcionCalendar(actividad),
    start: {
      dateTime: `${fechaBase}T${horaBase}:00-05:00`,
      timeZone: TIMEZONE_LIMA
    },
    end: {
      dateTime: `${fechaFin}T${horaFin}:00-05:00`,
      timeZone: TIMEZONE_LIMA
    },
    ...(recurrence.length > 0 ? { recurrence } : {}),
    extendedProperties: {
      private: {
        pmoId: String(actividad.id || ''),
        codigoLegado: String(actividad.codigo_legado || ''),
        categoriaVida: String(actividad.categoria_vida || ''),
        tipoCompromiso: String(actividad.tipo_compromiso || 'HABITUAL')
      }
    }
  };
}

/**
 * Construye URL estándar de Google Calendar (`action=TEMPLATE`) con `ctz=America/Lima` y `recur=RRULE:...`
 * para agendar/reflejar al instante incluso sin backend OAuth conectado.
 */
export function construirUrlGoogleCalendar(
  actividad: ActividadRecurrenciaInput
): string {
  const fechaBase =
    normalizarFechaIso(
      resolverCampo(
        actividad,
        'fecha_programada',
        'Fecha_Programada',
        'fecha_gasto',
        'fecha_ingreso',
        'fecha_vencimiento'
      )
    ) || formatFechaIsoLocal();
  const horaBase = normalizarHora24(resolverCampo(actividad, 'hora_inicio', 'Hora_Inicio'), '08:00');
  const durHoras = Number(
    resolverCampo(actividad, 'duracion_horas', 'Duracion_Horas', 'horas_estimadas') ?? 1
  ) || 1;
  const { fechaFin, horaFin } = calcularFinLocalLima(fechaBase, horaBase, durHoras);

  const startCompact = `${fechaBase.replace(/-/g, '')}T${horaBase.replace(':', '')}00`;
  const endCompact = `${fechaFin.replace(/-/g, '')}T${horaFin.replace(':', '')}00`;

  const summary = String(
    resolverCampo(
      actividad,
      'nombre_actividad',
      'nombre',
      'Nombre_Actividad',
      'titulo',
      'nombre_tarea_actividad',
      'descripcion_gasto',
      'descripcion_ingreso'
    ) || 'Actividad PMO'
  ).trim();

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary,
    dates: `${startCompact}/${endCompact}`,
    ctz: TIMEZONE_LIMA,
    details: construirDescripcionCalendar(actividad)
  });

  const rrule = construirRRuleRFC5545(actividad);
  if (rrule) {
    params.set('recur', rrule);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escaparTextoICS(texto: string): string {
  return texto
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Genera el contenido de un archivo `.ics` RFC-5545 con bloques horarios y regla de recurrencia fiel 1:1.
 */
export function generarArchivoICS(
  actividad: ActividadRecurrenciaInput
): string {
  const fechaBase =
    normalizarFechaIso(
      resolverCampo(
        actividad,
        'fecha_programada',
        'Fecha_Programada',
        'fecha_gasto',
        'fecha_ingreso',
        'fecha_vencimiento'
      )
    ) || formatFechaIsoLocal();
  const horaBase = normalizarHora24(resolverCampo(actividad, 'hora_inicio', 'Hora_Inicio'), '08:00');
  const durHoras = Number(
    resolverCampo(actividad, 'duracion_horas', 'Duracion_Horas', 'horas_estimadas') ?? 1
  ) || 1;
  const { fechaFin, horaFin } = calcularFinLocalLima(fechaBase, horaBase, durHoras);

  const startCompact = `${fechaBase.replace(/-/g, '')}T${horaBase.replace(':', '')}00`;
  const endCompact = `${fechaFin.replace(/-/g, '')}T${horaFin.replace(':', '')}00`;
  const stampUtc = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const uid = `${actividad.id || actividad.codigo_legado || Date.now()}@miportalweb.local`;

  const summary = String(
    resolverCampo(
      actividad,
      'nombre_actividad',
      'nombre',
      'Nombre_Actividad',
      'titulo',
      'nombre_tarea_actividad',
      'descripcion_gasto',
      'descripcion_ingreso'
    ) || 'Actividad PMO'
  ).trim();

  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MiPortalWeb PMO//Life OS//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stampUtc}`,
    `DTSTART;TZID=${TIMEZONE_LIMA}:${startCompact}`,
    `DTEND;TZID=${TIMEZONE_LIMA}:${endCompact}`,
    `SUMMARY:${escaparTextoICS(summary)}`,
    `DESCRIPTION:${escaparTextoICS(construirDescripcionCalendar(actividad))}`
  ];

  const rrule = construirRRuleRFC5545(actividad);
  if (rrule) {
    lineas.push(rrule);
    const excRaw = resolverCampo(actividad, 'excepciones_fechas', 'Excepciones_Fechas');
    if (Array.isArray(excRaw) && excRaw.length > 0) {
      const exDatesCompact = excRaw
        .map((f) => normalizarFechaIso(String(f)))
        .filter(Boolean)
        .map((iso) => `${iso.replace(/-/g, '')}T${horaBase.replace(':', '')}00`);
      if (exDatesCompact.length > 0) {
        lineas.push(`EXDATE;TZID=${TIMEZONE_LIMA}:${exDatesCompact.join(',')}`);
      }
    }
  }

  lineas.push('END:VEVENT', 'END:VCALENDAR');
  return lineas.join('\r\n');
}
