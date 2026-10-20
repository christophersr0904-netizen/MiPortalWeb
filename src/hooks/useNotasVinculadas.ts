import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { NotaRecord, VinculoEntidad } from '../types';
import { normalizeNota } from '../utils/entityNormalizer';

/**
 * Hook reactivo de alto rendimiento que indexa TODAS las notas de la base de datos
 * en un único Map en memoria agrupado por el `codigo` de entidad vinculada.
 *
 * Evita el problema de rendimiento N+1 de ejecutar múltiples queries a Dexie
 * dentro de bucles o listas de tarjetas (ej. 60 tarjetas en Kanban).
 */
export function useMapaNotasVinculadas(): Map<string, NotaRecord[]> {
  const notasRaw = useLiveQuery(() => db.notas.toArray(), []) ?? [];

  return useMemo(() => {
    const mapa = new Map<string, NotaRecord[]>();

    for (const raw of notasRaw) {
      const nota = normalizeNota(raw);
      if (Array.isArray(nota.enlaces_entidades_json) && nota.enlaces_entidades_json.length > 0) {
        for (const vinculo of nota.enlaces_entidades_json) {
          if (vinculo.codigo) {
            const key = vinculo.codigo.trim();
            const actuales = mapa.get(key) || [];
            // Evitar notas duplicadas en el mismo código
            if (!actuales.some((n) => n.id === nota.id)) {
              actuales.push(nota);
              mapa.set(key, actuales);
            }
          }
        }
      }
    }

    return mapa;
  }, [notasRaw]);
}

/**
 * Hook para obtener de forma reactiva las notas vinculadas a un código de entidad específico.
 */
export function useNotasDeEntidad(codigo?: string): NotaRecord[] {
  const mapa = useMapaNotasVinculadas();
  if (!codigo) return [];
  return mapa.get(codigo.trim()) || [];
}

/**
 * Asocia atómicamente una entidad a una nota existente en Dexie de forma idempotente.
 */
export async function vincularNotaAEntidad(
  notaId: string,
  vinculo: VinculoEntidad
): Promise<boolean> {
  if (!notaId || !vinculo || !vinculo.codigo) return false;

  const nota = await db.notas.get(notaId);
  if (!nota) return false;

  const enlacesActuales: VinculoEntidad[] = Array.isArray(nota.enlaces_entidades_json)
    ? [...nota.enlaces_entidades_json]
    : [];

  const yaExiste = enlacesActuales.some(
    (e) => e.codigo.trim() === vinculo.codigo.trim() && e.tipo === vinculo.tipo
  );

  if (yaExiste) return true; // Idempotente

  enlacesActuales.push({
    tipo: vinculo.tipo,
    codigo: vinculo.codigo.trim(),
    titulo: vinculo.titulo.trim() || vinculo.codigo.trim(),
    id_entidad: vinculo.id_entidad
  });

  const nowIso = new Date().toISOString();
  await db.notas.update(notaId, {
    enlaces_entidades_json: enlacesActuales,
    updated_at: nowIso,
    version: (nota.version || 1) + 1,
    sync_status: 'pending'
  });

  return true;
}

/**
 * Desvincula una entidad de una nota en Dexie.
 */
export async function desvincularNotaDeEntidad(
  notaId: string,
  codigoEntidad: string
): Promise<boolean> {
  if (!notaId || !codigoEntidad) return false;

  const nota = await db.notas.get(notaId);
  if (!nota || !Array.isArray(nota.enlaces_entidades_json)) return false;

  const targetCode = codigoEntidad.trim();
  const enlacesFiltrados = nota.enlaces_entidades_json.filter(
    (e) => e.codigo.trim() !== targetCode
  );

  if (enlacesFiltrados.length === nota.enlaces_entidades_json.length) {
    return true; // No había nada que remover
  }

  const nowIso = new Date().toISOString();
  await db.notas.update(notaId, {
    enlaces_entidades_json: enlacesFiltrados,
    updated_at: nowIso,
    version: (nota.version || 1) + 1,
    sync_status: 'pending'
  });

  return true;
}

/**
 * Crea una nueva nota vinculada directamente a una entidad.
 */
export async function crearNotaConVinculo(
  datos: {
    titulo: string;
    contenido_markdown?: string;
    block_nombre?: string;
  },
  vinculo: VinculoEntidad
): Promise<NotaRecord> {
  const count = await db.notas.count();
  const codigoCorrelativo = `NOT-${String(count + 1).padStart(5, '0')}`;
  const nuevoId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `not_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const nuevaNota: NotaRecord = {
    id: nuevoId,
    user_id: '00000000-0000-0000-0000-000000000001',
    codigo_legado: codigoCorrelativo,
    titulo: datos.titulo.trim() || `Nota vinculada a ${vinculo.codigo}`,
    contenido_markdown: datos.contenido_markdown || '',
    tipo_nota: 'MODULAR',
    block_nombre: datos.block_nombre?.trim() || undefined,
    color_tema: 'default',
    color: 'default',
    es_fijada: false,
    fijada: false,
    checklists_json: [],
    wishlist_json: undefined,
    adjuntos_drive_json: [],
    enlaces_entidades_json: [
      {
        tipo: vinculo.tipo,
        codigo: vinculo.codigo.trim(),
        titulo: vinculo.titulo.trim() || vinculo.codigo.trim(),
        id_entidad: vinculo.id_entidad
      }
    ],
    etiquetas: [vinculo.tipo.toLowerCase()],
    created_at: nowIso,
    updated_at: nowIso,
    version: 1,
    sync_status: 'pending'
  };

  await db.notas.add(nuevaNota);
  return nuevaNota;
}
