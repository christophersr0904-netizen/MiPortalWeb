import { getProp } from '../../utils/entityNormalizer';
import type { DailyScheduleItem } from '../../hooks/useDailySchedule';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface IdentificadoresWbsItem {
  codigo: string;
  hito?: string;
  proyecto?: string;
  textoLinea: string;
}

/** Limpia códigos WBS omitiendo UUIDs crudos o etiquetas redundantes. */
function limpiarCodigoWbs(valor: unknown): string {
  const txt = String(valor ?? '').trim();
  if (!txt || UUID_REGEX.test(txt)) return '';
  return txt;
}

/** Extrae jerarquía técnica monoespaciada (TAR-XXX · HIT-XXX · PRO-XXX) desde un item de agenda. */
export function obtenerIdentificadoresWbs(item: DailyScheduleItem): IdentificadoresWbsItem {
  const rawRecord = item.raw as unknown as Record<string, unknown> | undefined;
  const codigo = limpiarCodigoWbs(item.codigoLegado) || item.tipo;
  const hito = limpiarCodigoWbs(
    getProp(rawRecord, 'hito_codigo', 'Hito_Codigo', 'codigo_hito', 'wp_codigo', 'hito_legado')
  );
  const proyectoRaw = limpiarCodigoWbs(
    item.proyectoCodigo ?? getProp(rawRecord, 'proyecto_codigo', 'ID_Proyecto', 'idProyecto')
  );
  const proyecto = proyectoRaw && proyectoRaw !== codigo && proyectoRaw !== hito ? proyectoRaw : '';

  const partes = [codigo];
  if (hito && !partes.includes(hito)) partes.push(hito);
  if (proyecto && !partes.includes(proyecto)) partes.push(proyecto);

  return {
    codigo,
    hito: hito || undefined,
    proyecto: proyecto || undefined,
    textoLinea: partes.join(' · ')
  };
}

/** Selecciona el siguiente item pendiente para alternar el bloque de foco sin repetir el actual si hay alternativas. */
export function resolverSiguienteTareaFoco(
  pendientes: DailyScheduleItem[],
  idActual: string | null
): DailyScheduleItem | null {
  if (!pendientes || pendientes.length === 0) return null;
  if (!idActual) return pendientes[0];
  const idxActual = pendientes.findIndex((i) => i.id === idActual);
  if (idxActual === -1) return pendientes[0];
  return pendientes[(idxActual + 1) % pendientes.length];
}

/** Formatea minutos invertidos en foco con precisión compacta para métricas tabulares. */
export function formatearTiempoInvertido(minutosTotal: number): string {
  const mins = Math.max(0, Math.round(Number(minutosTotal) || 0));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

