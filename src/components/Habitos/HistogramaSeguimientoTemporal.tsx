import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Target,
  Calendar,
  TrendingUp
} from 'lucide-react';
import type {
  MetaPlanRecord,
  ActividadPersonal,
  HabitoMetaVinculo,
  HabitoLogRecord
} from '../../types';
import { CATEGORIAS_VIDA_MAP } from '../../types';

export type GranoTemporalHistograma = 'SEMANA' | 'MES' | 'TRIMESTRE';

export interface HistogramaSeguimientoTemporalProps {
  /** Meta fija cuando el histograma se incrusta en la Vista Detallada 360° */
  metaFija?: MetaPlanRecord | null;
  /** Lista de metas disponibles cuando se incrusta en el Dashboard global */
  metasDisponibles?: MetaPlanRecord[];
  actividades: ActividadPersonal[];
  vinculos: HabitoMetaVinculo[];
  logs: HabitoLogRecord[];
  /** Callback opcional para abrir la Vista 360° desde el Dashboard */
  onAbrirMeta360?: (meta: MetaPlanRecord) => void;
}

interface BucketTemporal {
  id: string;
  etiquetaPrincipal: string;
  etiquetaSecundaria: string;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string;    // YYYY-MM-DD
  valor: number;
  metaReferencia: number;
  esPeriodoActual: boolean;
}

const NOMBRES_MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const NOMBRES_MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function toIsoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const HistogramaSeguimientoTemporal: React.FC<HistogramaSeguimientoTemporalProps> = ({
  metaFija,
  metasDisponibles = [],
  actividades,
  vinculos,
  logs,
  onAbrirMeta360
}) => {
  const [grano, setGrano] = useState<GranoTemporalHistograma>('SEMANA');
  const [offsetPeriodo, setOffsetPeriodo] = useState<number>(0);
  const [metaSeleccionadaId, setMetaSeleccionadaId] = useState<string>('');

  // Resolver la meta activa a graficar
  const metaActiva: MetaPlanRecord | null = useMemo(() => {
    if (metaFija) return metaFija;
    if (!metasDisponibles || metasDisponibles.length === 0) return null;
    if (metaSeleccionadaId) {
      const encontrada = metasDisponibles.find((m) => m.id === metaSeleccionadaId);
      if (encontrada) return encontrada;
    }
    // Priorizar metas con objetivo cuantitativo > 0
    return (
      metasDisponibles.find((m) => (m.meta_objetivo_total || 0) > 0) ||
      metasDisponibles[0]
    );
  }, [metaFija, metasDisponibles, metaSeleccionadaId]);

  const unidadMedida = useMemo(() => {
    return metaActiva?.unidad_medida?.trim() || 'unidades';
  }, [metaActiva]);

  // Resolver hábitos vinculados a la meta activa (por tabla N:M o coincidencia de meta_macro_nombre)
  const habitosVinculados = useMemo(() => {
    if (!metaActiva) return [] as Array<{ habito: ActividadPersonal; factor: number; peso: number }>;

    const mapAct = new Map<string, ActividadPersonal>();
    for (const a of actividades) {
      mapAct.set(a.id, a);
      if (a.codigo_legado) mapAct.set(a.codigo_legado, a);
    }

    const resultado: Array<{ habito: ActividadPersonal; factor: number; peso: number }> = [];
    const idsIncluidos = new Set<string>();

    const vinculosDeMeta = vinculos.filter((v) => v.meta_id === metaActiva.id);
    for (const v of vinculosDeMeta) {
      const hab = mapAct.get(v.habito_id);
      if (hab && !idsIncluidos.has(hab.id)) {
        idsIncluidos.add(hab.id);
        resultado.push({
          habito: hab,
          factor: Number(v.factor_conversion || 1),
          peso: Number(v.peso_contribucion_pct || 100)
        });
      }
    }

    // Fallback por nombre macro si aún no hay vínculos explícitos
    const nombreMetaNorm = (metaActiva.nombre_meta || '').trim().toLowerCase();
    if (nombreMetaNorm) {
      for (const a of actividades) {
        if (idsIncluidos.has(a.id)) continue;
        const macroNorm = (a.meta_macro_nombre || '').trim().toLowerCase();
        const actNorm = (a.nombre_actividad || '').trim().toLowerCase();
        if (macroNorm === nombreMetaNorm || actNorm === nombreMetaNorm) {
          idsIncluidos.add(a.id);
          resultado.push({
            habito: a,
            factor: 1,
            peso: 100
          });
        }
      }
    }

    return resultado;
  }, [metaActiva, actividades, vinculos]);

  // Calcular meta diaria base de referencia en la unidad de medida de la meta
  const metaDiariaBase = useMemo(() => {
    if (!metaActiva) return 1;

    // 1. Suma de metas diarias estándar de los hábitos motores vinculados
    let sumaDiariaHabitos = 0;
    for (const item of habitosVinculados) {
      const diariaHab = Number(item.habito.meta_diaria_estandar || 0);
      if (diariaHab > 0) {
        sumaDiariaHabitos += diariaHab * item.factor;
      }
    }
    if (sumaDiariaHabitos > 0) {
      return Number(sumaDiariaHabitos.toFixed(1));
    }

    // 2. Derivación desde meta_objetivo_total entre el horizonte de días
    const objTotal = Number(metaActiva.meta_objetivo_total || 0);
    if (objTotal > 0) {
      if (metaActiva.fecha_inicio && metaActiva.fecha_fin) {
        const tIni = new Date(metaActiva.fecha_inicio).getTime();
        const tFin = new Date(metaActiva.fecha_fin).getTime();
        const dias = Math.max(1, Math.round((tFin - tIni) / 86400000));
        return Number(Math.max(0.5, objTotal / dias).toFixed(1));
      }
      return Number(Math.max(1, objTotal / 90).toFixed(1));
    }

    return 1;
  }, [metaActiva, habitosVinculados]);

  // Construir mapa diario (YYYY-MM-DD -> valor registrado en la unidad de la meta)
  const mapaValoresPorFecha = useMemo(() => {
    const mapa = new Map<string, number>();
    if (!metaActiva) return mapa;

    const hoyStr = new Date().toISOString().split('T')[0];
    const [yH, mH, dH] = hoyStr.split('-').map(Number);
    const hoyUtc = Date.UTC(yH, mH - 1, dH);

    const mapFactorPorHabito = new Map<string, { habito: ActividadPersonal; factor: number }>();
    for (const item of habitosVinculados) {
      mapFactorPorHabito.set(item.habito.id, item);
      if (item.habito.codigo_legado) {
        mapFactorPorHabito.set(item.habito.codigo_legado, item);
      }
    }

    const fechasConLogRealPorHabito = new Set<string>();

    // A. Procesar registros explícitos en habito_cumplimiento_logs
    for (const log of logs) {
      const info = mapFactorPorHabito.get(log.habito_id);
      if (!info || !log.fecha_registro) continue;
      const fecha = log.fecha_registro.split('T')[0];
      const valBase =
        typeof log.valor_cuantitativo_sumado === 'number' && log.valor_cuantitativo_sumado > 0
          ? log.valor_cuantitativo_sumado
          : log.completado
          ? Number(info.habito.meta_diaria_estandar || 1)
          : 0;

      if (valBase > 0) {
        const aporte = valBase * info.factor;
        mapa.set(fecha, (mapa.get(fecha) || 0) + aporte);
        fechasConLogRealPorHabito.add(`${info.habito.id}::${fecha}`);
      }
    }

    // B. Procesar historial_fechas y racha activa de cada hábito vinculado
    for (const { habito, factor } of habitosVinculados) {
      const aporteDiario = Number(habito.meta_diaria_estandar || 1) * factor;

      if (Array.isArray(habito.historial_fechas)) {
        for (const fRaw of habito.historial_fechas) {
          const fecha = String(fRaw).split('T')[0];
          const key = `${habito.id}::${fecha}`;
          if (fecha && !fechasConLogRealPorHabito.has(key)) {
            fechasConLogRealPorHabito.add(key);
            mapa.set(fecha, (mapa.get(fecha) || 0) + aporteDiario);
          }
        }
      }

      if (habito.ultima_fecha_completado) {
        const fechaUlt = habito.ultima_fecha_completado.split('T')[0];
        const key = `${habito.id}::${fechaUlt}`;
        if (fechaUlt && !fechasConLogRealPorHabito.has(key)) {
          fechasConLogRealPorHabito.add(key);
          mapa.set(fechaUlt, (mapa.get(fechaUlt) || 0) + aporteDiario);
        }
      }

      // C. Proyección de racha actual y volumen acumulado histórico cuando no existen logs detallados
      const racha = Math.max(0, Number(habito.racha_actual || 0));
      if (racha > 0) {
        for (let i = 0; i < racha; i++) {
          const fechaRacha = toIsoDate(new Date(hoyUtc - i * 86400000));
          const key = `${habito.id}::${fechaRacha}`;
          if (!fechasConLogRealPorHabito.has(key)) {
            fechasConLogRealPorHabito.add(key);
            mapa.set(fechaRacha, (mapa.get(fechaRacha) || 0) + aporteDiario);
          }
        }
      }
    }

    return mapa;
  }, [metaActiva, habitosVinculados, logs]);

  // Construcción de los Buckets del Histograma según grano ('SEMANA' | 'MES' | 'TRIMESTRE') y offsetPeriodo
  const { buckets, tituloPeriodo, unidadEjeX, etiquetaMetaReferencia } = useMemo(() => {
    const hoy = new Date();
    const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const hoyStr = toIsoDate(new Date(hoyUtc));
    const listaBuckets: BucketTemporal[] = [];

    if (grano === 'SEMANA') {
      // Lunes de la semana actual + offsetPeriodo * 7 días
      const diaSem = new Date(hoyUtc).getUTCDay(); // 0=Dom, 1=Lun..6=Sab
      const offsetLunes = diaSem === 0 ? -6 : 1 - diaSem;
      const lunesBaseUtc = hoyUtc + (offsetLunes + offsetPeriodo * 7) * 86400000;

      for (let i = 0; i < 7; i++) {
        const diaUtc = lunesBaseUtc + i * 86400000;
        const dObj = new Date(diaUtc);
        const fIso = toIsoDate(dObj);
        const dd = String(dObj.getUTCDate()).padStart(2, '0');
        const mm = String(dObj.getUTCMonth() + 1).padStart(2, '0');

        const val = Number((mapaValoresPorFecha.get(fIso) || 0).toFixed(1));
        listaBuckets.push({
          id: fIso,
          etiquetaPrincipal: DIAS_SEMANA_CORTOS[i],
          etiquetaSecundaria: `${dd}/${mm}`,
          fechaInicio: fIso,
          fechaFin: fIso,
          valor: val,
          metaReferencia: metaDiariaBase,
          esPeriodoActual: fIso === hoyStr
        });
      }

      const dIni = new Date(lunesBaseUtc);
      const dFin = new Date(lunesBaseUtc + 6 * 86400000);
      const labelIni = `${String(dIni.getUTCDate()).padStart(2, '0')} ${NOMBRES_MESES_CORTOS[dIni.getUTCMonth()]}`;
      const labelFin = `${String(dFin.getUTCDate()).padStart(2, '0')} ${NOMBRES_MESES_CORTOS[dFin.getUTCMonth()]} ${dFin.getUTCFullYear()}`;

      return {
        buckets: listaBuckets,
        tituloPeriodo: `${labelIni} – ${labelFin}`,
        unidadEjeX: 'Días de la Semana',
        etiquetaMetaReferencia: `${metaDiariaBase} ${unidadMedida}/día`
      };
    }

    if (grano === 'MES') {
      // Mes actual + offsetPeriodo meses -> dividido en Semanas del Mes (Sem 1..5)
      const fechaMes = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth() + offsetPeriodo, 1));
      const anio = fechaMes.getUTCFullYear();
      const mes = fechaMes.getUTCMonth();
      const ultimoDiaMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();

      const cortesSemanas = [
        { num: 1, ini: 1, fin: Math.min(7, ultimoDiaMes) },
        { num: 2, ini: 8, fin: Math.min(14, ultimoDiaMes) },
        { num: 3, ini: 15, fin: Math.min(21, ultimoDiaMes) },
        { num: 4, ini: 22, fin: Math.min(28, ultimoDiaMes) }
      ];
      if (ultimoDiaMes > 28) {
        cortesSemanas.push({ num: 5, ini: 29, fin: ultimoDiaMes });
      }

      for (const sem of cortesSemanas) {
        const diasEnBloque = sem.fin - sem.ini + 1;
        const fIni = toIsoDate(new Date(Date.UTC(anio, mes, sem.ini)));
        const fFin = toIsoDate(new Date(Date.UTC(anio, mes, sem.fin)));

        let sumaSemanal = 0;
        for (let d = sem.ini; d <= sem.fin; d++) {
          const fDia = toIsoDate(new Date(Date.UTC(anio, mes, d)));
          sumaSemanal += mapaValoresPorFecha.get(fDia) || 0;
        }

        const metaRefSem = Number((metaDiariaBase * diasEnBloque).toFixed(1));
        listaBuckets.push({
          id: `${anio}-${mes + 1}-S${sem.num}`,
          etiquetaPrincipal: `Sem ${sem.num}`,
          etiquetaSecundaria: `${String(sem.ini).padStart(2, '0')}–${String(sem.fin).padStart(2, '0')} ${NOMBRES_MESES_CORTOS[mes]}`,
          fechaInicio: fIni,
          fechaFin: fFin,
          valor: Number(sumaSemanal.toFixed(1)),
          metaReferencia: metaRefSem,
          esPeriodoActual: hoyStr >= fIni && hoyStr <= fFin
        });
      }

      return {
        buckets: listaBuckets,
        tituloPeriodo: `${NOMBRES_MESES_LARGOS[mes]} ${anio}`,
        unidadEjeX: 'Semanas del Mes',
        etiquetaMetaReferencia: `${Number((metaDiariaBase * 7).toFixed(1))} ${unidadMedida}/sem`
      };
    }

    // GRANO === 'TRIMESTRE': 3 meses del trimestre seleccionado
    const trimestreActualIdx = Math.floor(hoy.getMonth() / 3);
    const primerMesTrimestre = trimestreActualIdx * 3 + offsetPeriodo * 3;
    const fechaInicioTrim = new Date(Date.UTC(hoy.getFullYear(), primerMesTrimestre, 1));
    const anioTrim = fechaInicioTrim.getUTCFullYear();
    const numTrimestre = Math.floor(fechaInicioTrim.getUTCMonth() / 3) + 1;

    for (let mOffset = 0; mOffset < 3; mOffset++) {
      const fMes = new Date(Date.UTC(hoy.getFullYear(), primerMesTrimestre + mOffset, 1));
      const yM = fMes.getUTCFullYear();
      const mIdx = fMes.getUTCMonth();
      const diasMes = new Date(Date.UTC(yM, mIdx + 1, 0)).getUTCDate();

      const fIni = toIsoDate(new Date(Date.UTC(yM, mIdx, 1)));
      const fFin = toIsoDate(new Date(Date.UTC(yM, mIdx, diasMes)));

      let sumaMensual = 0;
      for (let d = 1; d <= diasMes; d++) {
        const fDia = toIsoDate(new Date(Date.UTC(yM, mIdx, d)));
        sumaMensual += mapaValoresPorFecha.get(fDia) || 0;
      }

      const metaRefMes = Number((metaDiariaBase * diasMes).toFixed(1));
      listaBuckets.push({
        id: `${yM}-${mIdx + 1}`,
        etiquetaPrincipal: NOMBRES_MESES_LARGOS[mIdx],
        etiquetaSecundaria: `${diasMes} días · ${yM}`,
        fechaInicio: fIni,
        fechaFin: fFin,
        valor: Number(sumaMensual.toFixed(1)),
        metaReferencia: metaRefMes,
        esPeriodoActual: hoyStr >= fIni && hoyStr <= fFin
      });
    }

    const mesIniNombre = NOMBRES_MESES_CORTOS[listaBuckets[0] ? new Date(listaBuckets[0].fechaInicio).getUTCMonth() : 0];
    const mesFinNombre = NOMBRES_MESES_CORTOS[listaBuckets[2] ? new Date(listaBuckets[2].fechaInicio).getUTCMonth() : 2];

    return {
      buckets: listaBuckets,
      tituloPeriodo: `T${numTrimestre} ${anioTrim} (${mesIniNombre} – ${mesFinNombre})`,
      unidadEjeX: 'Meses del Trimestre',
      etiquetaMetaReferencia: `${Number((metaDiariaBase * 30).toFixed(1))} ${unidadMedida}/mes`
    };
  }, [grano, offsetPeriodo, mapaValoresPorFecha, metaDiariaBase, unidadMedida]);

  // Escala vertical máxima del gráfico (incluyendo tanto valores reales como la línea de referencia)
  const { maxEscalaY, promedioMetaRef, totalPeriodo, cumplimientoPctPeriodo } = useMemo(() => {
    if (buckets.length === 0) {
      return { maxEscalaY: 10, promedioMetaRef: 5, totalPeriodo: 0, cumplimientoPctPeriodo: 0 };
    }
    const maxValor = Math.max(...buckets.map((b) => b.valor), 0);
    const maxMeta = Math.max(...buckets.map((b) => b.metaReferencia), 1);
    const sumaValores = buckets.reduce((acc, b) => acc + b.valor, 0);
    const sumaMetas = buckets.reduce((acc, b) => acc + b.metaReferencia, 0);
    const promRef = sumaMetas / buckets.length;
    const tope = Math.max(maxValor, maxMeta) * 1.22;

    return {
      maxEscalaY: Math.max(1, Number(tope.toFixed(1))),
      promedioMetaRef: Number(promRef.toFixed(1)),
      totalPeriodo: Number(sumaValores.toFixed(1)),
      cumplimientoPctPeriodo: sumaMetas > 0 ? Math.min(100, Math.round((sumaValores / sumaMetas) * 100)) : 0
    };
  }, [buckets]);

  const alturaLineaMetaPct = useMemo(() => {
    if (maxEscalaY <= 0) return 50;
    return Math.min(92, Math.max(8, Math.round((promedioMetaRef / maxEscalaY) * 100)));
  }, [promedioMetaRef, maxEscalaY]);

  if (!metaActiva) {
    return null;
  }

  const cfgCat = CATEGORIAS_VIDA_MAP[metaActiva.categoria_vida];

  return (
    <div
      id="histograma-seguimiento-temporal"
      className="portal-surface bg-[#0D1526] p-4 lg:p-5 rounded-2xl border border-slate-800/40 shadow-xs flex flex-col justify-between space-y-4"
      style={{
        boxShadow: '0 10px 25px -5px rgba(2, 6, 23, 0.8), 0 8px 10px -6px rgba(30, 58, 138, 0.18)'
      }}
    >
      {/* CABECERA TÁCTICA Y CONTROLES DE GRANULARIDAD / PAGINACIÓN */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-start sm:items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-teal-950/60 border border-teal-800/40 flex items-center justify-center text-teal-400 shrink-0">
            <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-100 tracking-tight">
                Histograma Temporal de Seguimiento
              </h3>
              {cfgCat && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfgCat.badgeClase}`}>
                  {cfgCat.nombre}
                </span>
              )}
              <span className="text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-md bg-sky-950/40 text-sky-300 border border-sky-800/40">
                Unidad: {unidadMedida}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Eje X ({unidadEjeX}) vs. Eje Y ({unidadMedida} registrados) · Meta ref: <b className="font-mono tabular-nums text-amber-300">{etiquetaMetaReferencia}</b>
            </p>
          </div>
        </div>

        {/* Selector de Meta (cuando se visualiza en Dashboard global) + Botones de Grano + Paginador */}
        <div className="flex items-center gap-2 flex-wrap">
          {!metaFija && metasDisponibles.length > 1 && (
            <select
              aria-label="Seleccionar meta para el histograma"
              value={metaActiva.id}
              onChange={(e) => setMetaSeleccionadaId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-[#040711] border border-slate-800/80 text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer max-w-[220px] truncate"
            >
              {metasDisponibles.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#0D1526] text-slate-100">
                  {m.codigo_legado} · {m.nombre_meta} ({m.unidad_medida || 'unid'})
                </option>
              ))}
            </select>
          )}

          {!metaFija && onAbrirMeta360 && (
            <button
              type="button"
              onClick={() => onAbrirMeta360(metaActiva)}
              className="px-2.5 py-1.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-800/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Abrir Vista Detallada 360° de esta Meta"
            >
              <Target className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Vista 360°</span>
            </button>
          )}

          {/* Selector de Grano Temporal: [ Semana | Mes | Trimestre ] */}
          <div
            role="group"
            aria-label="Granularidad temporal"
            className="inline-flex p-0.5 rounded-xl bg-[#040711] border border-slate-800/80 gap-0.5"
          >
            {(
              [
                { id: 'SEMANA', label: 'Semana' },
                { id: 'MES', label: 'Mes' },
                { id: 'TRIMESTRE', label: 'Trimestre' }
              ] as const
            ).map((op) => {
              const activo = grano === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => {
                    setGrano(op.id);
                    setOffsetPeriodo(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    activo
                      ? 'text-sky-300 bg-sky-950/30 font-bold border-b-2 border-sky-400'
                      : 'text-slate-400 hover:text-sky-300 font-medium'
                  }`}
                >
                  {op.label}
                </button>
              );
            })}
          </div>

          {/* Paginador Interactivo: [ < Anterior | Período Actual | Siguiente > ] */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-[#040711] border border-slate-800/80 gap-0.5">
            <button
              type="button"
              onClick={() => setOffsetPeriodo((p) => p - 1)}
              className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-sky-300 hover:bg-slate-800/50 flex items-center gap-1 transition cursor-pointer"
              title="Período Anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <button
              type="button"
              onClick={() => setOffsetPeriodo(0)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums font-bold flex items-center gap-1 transition cursor-pointer ${
                offsetPeriodo === 0
                  ? 'text-emerald-300 bg-emerald-950/30'
                  : 'text-slate-300 hover:text-sky-300'
              }`}
              title="Volver al período actual"
            >
              <Calendar className="w-3 h-3 shrink-0" strokeWidth={1.75} />
              <span>{tituloPeriodo}</span>
              {offsetPeriodo !== 0 && <RotateCcw className="w-3 h-3 ml-0.5 text-sky-400" strokeWidth={1.75} />}
            </button>

            <button
              type="button"
              onClick={() => setOffsetPeriodo((p) => p + 1)}
              className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-sky-300 hover:bg-slate-800/50 flex items-center gap-1 transition cursor-pointer"
              title="Período Siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* RESUMEN RÁPIDO DEL PERÍODO SELECCIONADO */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-2.5 rounded-xl bg-[#040711]/70 border border-slate-800/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Volumen del Período</span>
          <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-emerald-400">
            {totalPeriodo.toLocaleString('es-PE')} {unidadMedida}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#040711]/70 border border-slate-800/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Meta de Referencia</span>
          <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-amber-300">
            {etiquetaMetaReferencia}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#040711]/70 border border-slate-800/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1.75} />
            <span>Efectividad</span>
          </span>
          <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-sky-300">
            {cumplimientoPctPeriodo}%
          </span>
        </div>
      </div>

      {/* LIENZO DEL HISTOGRAMA (EJE Y + BARRAS PROPORCIONALES + LÍNEA DE META OBJETIVO) */}
      <div className="relative pt-4 pb-2 px-2 bg-[#040711]/60 rounded-xl border border-slate-800/40">
        <div className="flex items-stretch h-52">
          {/* Eje Vertical (Y) en la unidad de medida */}
          <div className="w-14 pr-2 flex flex-col justify-between text-right text-[10px] font-mono tabular-nums text-slate-500 select-none border-r border-slate-800/60 pb-6">
            <span>{maxEscalaY.toLocaleString('es-PE')}</span>
            <span>{Number((maxEscalaY * 0.75).toFixed(1)).toLocaleString('es-PE')}</span>
            <span>{Number((maxEscalaY * 0.5).toFixed(1)).toLocaleString('es-PE')}</span>
            <span>{Number((maxEscalaY * 0.25).toFixed(1)).toLocaleString('es-PE')}</span>
            <span>0 {unidadMedida}</span>
          </div>

          {/* Área de Barras y Línea de Meta */}
          <div className="relative flex-1 flex flex-col justify-end pl-3 pr-2 pb-6">
            {/* Líneas guía horizontales */}
            <div className="absolute inset-x-3 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
              <div className="border-b border-slate-800/40 w-full h-0" />
              <div className="border-b border-slate-800/30 w-full h-0" />
              <div className="border-b border-slate-800/30 w-full h-0" />
              <div className="border-b border-slate-800/30 w-full h-0" />
              <div className="border-b border-slate-800/60 w-full h-0" />
            </div>

            {/* Línea de Meta Objetivo de Referencia */}
            <div
              className="absolute left-2 right-2 border-t-2 border-dashed border-amber-400/80 z-10 pointer-events-none flex items-center justify-end"
              style={{ bottom: `calc(1.5rem + ${alturaLineaMetaPct}%)` }}
            >
              <span className="px-1.5 py-0.5 -mt-5 rounded bg-amber-950/90 border border-amber-500/40 text-[9.5px] font-mono tabular-nums font-bold text-amber-300 shadow-xs">
                Obj: {promedioMetaRef} {unidadMedida}
              </span>
            </div>

            {/* Contenedor de Columnas / Barras */}
            <div className="relative z-20 flex items-end justify-around gap-2 h-full pt-4">
              {buckets.map((b) => {
                const pctAltura =
                  maxEscalaY > 0 ? Math.min(100, Math.round((b.valor / maxEscalaY) * 100)) : 0;
                const superoMeta = b.valor >= b.metaReferencia && b.metaReferencia > 0;
                const tieneAvance = b.valor > 0;

                return (
                  <div
                    key={b.id}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Valor numérico sobre la barra */}
                    <span
                      className={`text-[10px] font-mono tabular-nums font-bold mb-1 transition-all ${
                        superoMeta
                          ? 'text-emerald-300'
                          : tieneAvance
                          ? 'text-sky-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {b.valor > 0 ? b.valor.toLocaleString('es-PE') : '0'}
                    </span>

                    {/* Barra proporcional */}
                    <div className="w-full max-w-[44px] h-full flex items-end justify-center">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 relative ${
                          superoMeta
                            ? 'bg-gradient-to-t from-teal-600/90 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                            : tieneAvance
                            ? 'bg-gradient-to-t from-sky-700/80 to-sky-400'
                            : 'bg-slate-800/50'
                        } ${b.esPeriodoActual ? 'ring-1 ring-sky-300' : ''}`}
                        style={{
                          height: `${ Math.max(tieneAvance ? 8 : 3, pctAltura) }%`
                        }}
                        title={`${b.etiquetaPrincipal} (${b.etiquetaSecundaria}): ${b.valor} / ${b.metaReferencia} ${unidadMedida}`}
                      />
                    </div>

                    {/* Etiqueta del Eje X */}
                    <div className="absolute -bottom-6 inset-x-0 flex flex-col items-center text-center leading-tight">
                      <span
                        className={`text-[10px] font-bold truncate max-w-full ${
                          b.esPeriodoActual ? 'text-sky-300' : 'text-slate-300'
                        }`}
                      >
                        {b.etiquetaPrincipal}
                      </span>
                      <span className="text-[9px] font-mono tabular-nums text-slate-500 truncate max-w-full">
                        {b.etiquetaSecundaria}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

