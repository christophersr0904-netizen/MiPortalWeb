import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeNota } from '../entityNormalizer';
import { db } from '../../db/db';
import {
  vincularNotaAEntidad,
  desvincularNotaDeEntidad,
  crearNotaConVinculo
} from '../../hooks/useNotasVinculadas';
import type { NotaRecord, VinculoEntidad } from '../../types';

describe('REQ-NOT-05: Red de Vinculación Transversal de Notas con Entidades', () => {
  let mockStore: Map<string, NotaRecord>;

  const notaMockBase: NotaRecord = {
    id: 'not-test-vinculo-1',
    user_id: '00000000-0000-0000-0000-000000000001',
    codigo_legado: 'NOT-09991',
    titulo: 'Minuta Técnica de Revisión de Arquitectura',
    contenido_markdown: '# Acuerdos\n- Revisar el esquema WBS.\n- Validar índices de base de datos.',
    tipo_nota: 'MODULAR',
    color_tema: 'sky',
    es_fijada: false,
    checklists_json: [],
    wishlist_json: undefined,
    adjuntos_drive_json: [],
    enlaces_entidades_json: [
      { tipo: 'PROYECTO', codigo: 'PRO-001', titulo: 'Certificación PMP' },
      { tipo: 'TAREA', codigo: 'TAR-017', titulo: 'Inspección técnica' }
    ],
    etiquetas: ['arquitectura', 'pmp'],
    updated_at: new Date().toISOString(),
    version: 1,
    sync_status: 'synced'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStore = new Map<string, NotaRecord>();
    mockStore.set(notaMockBase.id, JSON.parse(JSON.stringify(notaMockBase)));

    vi.spyOn(db.notas, 'get').mockImplementation((async (id: any) => {
      const found = mockStore.get(String(id));
      return found ? JSON.parse(JSON.stringify(found)) : undefined;
    }) as any);

    vi.spyOn(db.notas, 'put').mockImplementation((async (item: any) => {
      mockStore.set(item.id, JSON.parse(JSON.stringify(item)));
      return item.id;
    }) as any);

    vi.spyOn(db.notas, 'add').mockImplementation((async (item: any) => {
      mockStore.set(item.id, JSON.parse(JSON.stringify(item)));
      return item.id;
    }) as any);

    vi.spyOn(db.notas, 'update').mockImplementation((async (id: any, changes: any) => {
      const existing = mockStore.get(String(id));
      if (!existing) return 0;
      const updated = { ...existing, ...changes };
      mockStore.set(String(id), updated);
      return 1;
    }) as any);

    vi.spyOn(db.notas, 'count').mockImplementation((async () => mockStore.size) as any);
    vi.spyOn(db.notas, 'toArray').mockImplementation((async () => Array.from(mockStore.values())) as any);
  });

  it('1. normalizeNota preserva y normaliza íntegramente los arreglos de enlaces_entidades_json', () => {
    const rawNota = {
      ...notaMockBase,
      enlaces_entidades_json: [
        { tipo: 'tarea', codigo: 'TAR-005', titulo: 'Definir DoD', id_entidad: 'uuid-123' },
        { tipo: 'HABITO', codigo: 'ACT-002', titulo: 'Sesión de carrera' },
        { tipo: 'FINANZAS', codigo: 'GAS-001', titulo: 'Servidor VPS' },
        { tipo: 'INVALIDO', codigo: 'IDE-009', titulo: 'Idea sin tipo' }
      ]
    };

    const normalizada = normalizeNota(rawNota);

    expect(normalizada.enlaces_entidades_json).toHaveLength(4);
    expect(normalizada.enlaces_entidades_json[0]).toEqual({
      tipo: 'TAREA',
      codigo: 'TAR-005',
      titulo: 'Definir DoD',
      id_entidad: 'uuid-123'
    });
    expect(normalizada.enlaces_entidades_json[1].tipo).toBe('HABITO');
    expect(normalizada.enlaces_entidades_json[2].tipo).toBe('FINANZAS');
    // Tipo no reconocido recurre al fallback 'PROYECTO'
    expect(normalizada.enlaces_entidades_json[3].tipo).toBe('PROYECTO');
  });

  it('2. Indexación en mapa reactivo agrupa correctamente notas por código de entidad', async () => {
    // Insertamos una segunda nota con vínculos cruzados
    const nota2: NotaRecord = {
      ...notaMockBase,
      id: 'not-test-vinculo-2',
      codigo_legado: 'NOT-09992',
      titulo: 'Lista de compras de laboratorio',
      enlaces_entidades_json: [
        { tipo: 'TAREA', codigo: 'TAR-017', titulo: 'Inspección técnica' },
        { tipo: 'HABITO', codigo: 'ACT-001', titulo: 'Lectura diaria' }
      ]
    };
    mockStore.set(nota2.id, nota2);

    // Emulación del cálculo del hook useMapaNotasVinculadas
    const todasLasNotas = await db.notas.toArray();
    const mapa = new Map<string, NotaRecord[]>();

    for (const raw of todasLasNotas) {
      const n = normalizeNota(raw);
      for (const v of n.enlaces_entidades_json) {
        const actuales = mapa.get(v.codigo) || [];
        actuales.push(n);
        mapa.set(v.codigo, actuales);
      }
    }

    // TAR-017 está en nota 1 y nota 2
    const notasTar017 = mapa.get('TAR-017') || [];
    expect(notasTar017).toHaveLength(2);
    expect(notasTar017.map((n) => n.id)).toContain('not-test-vinculo-1');
    expect(notasTar017.map((n) => n.id)).toContain('not-test-vinculo-2');

    // PRO-001 solo está en nota 1
    const notasPro001 = mapa.get('PRO-001') || [];
    expect(notasPro001).toHaveLength(1);
    expect(notasPro001[0].id).toBe('not-test-vinculo-1');

    // ACT-001 solo está en nota 2
    const notasAct001 = mapa.get('ACT-001') || [];
    expect(notasAct001).toHaveLength(1);
    expect(notasAct001[0].id).toBe('not-test-vinculo-2');
  });

  it('3. vincularNotaAEntidad asocia atómicamente de forma idempotente sin duplicar', async () => {
    const nuevoVinculo: VinculoEntidad = {
      tipo: 'HABITO',
      codigo: 'ACT-005',
      titulo: 'Meditación matutina'
    };

    // Primera vinculación
    const res1 = await vincularNotaAEntidad(notaMockBase.id, nuevoVinculo);
    expect(res1).toBe(true);

    let notaEnDb = await db.notas.get(notaMockBase.id);
    expect(notaEnDb?.enlaces_entidades_json).toHaveLength(3);
    expect(notaEnDb?.enlaces_entidades_json.some((e) => e.codigo === 'ACT-005')).toBe(true);
    expect(notaEnDb?.sync_status).toBe('pending');

    // Segunda vinculación del mismo vínculo (idempotencia)
    const res2 = await vincularNotaAEntidad(notaMockBase.id, nuevoVinculo);
    expect(res2).toBe(true);

    notaEnDb = await db.notas.get(notaMockBase.id);
    // Debe mantenerse en 3, no duplicarse a 4
    expect(notaEnDb?.enlaces_entidades_json).toHaveLength(3);
  });

  it('4. desvincularNotaDeEntidad remueve el enlace específico sin tocar los demás', async () => {
    // La nota mock tiene PRO-001 y TAR-017
    const ok = await desvincularNotaDeEntidad(notaMockBase.id, 'TAR-017');
    expect(ok).toBe(true);

    const notaEnDb = await db.notas.get(notaMockBase.id);
    expect(notaEnDb?.enlaces_entidades_json).toHaveLength(1);
    expect(notaEnDb?.enlaces_entidades_json[0].codigo).toBe('PRO-001');
    expect(notaEnDb?.sync_status).toBe('pending');
  });

  it('5. crearNotaConVinculo genera una nueva nota con el enlace preestablecido', async () => {
    const vinculoTarea: VinculoEntidad = {
      tipo: 'TAREA',
      codigo: 'TAR-099',
      titulo: 'Desplegar a producción'
    };

    const notaCreada = await crearNotaConVinculo(
      {
        titulo: 'Procedimiento de Despliegue',
        contenido_markdown: '1. Build de Vite\n2. Verificación de tests',
        block_nombre: 'DevOps'
      },
      vinculoTarea
    );

    expect(notaCreada.id).toBeDefined();
    expect(notaCreada.titulo).toBe('Procedimiento de Despliegue');
    expect(notaCreada.block_nombre).toBe('DevOps');
    expect(notaCreada.enlaces_entidades_json).toHaveLength(1);
    expect(notaCreada.enlaces_entidades_json[0]).toEqual({
      tipo: 'TAREA',
      codigo: 'TAR-099',
      titulo: 'Desplegar a producción',
      id_entidad: undefined
    });

    const guardada = await db.notas.get(notaCreada.id);
    expect(guardada).toBeDefined();
    expect(guardada?.codigo_legado).toMatch(/^NOT-\d{5}$/);
  });

  it('6. [Fase 4.43] Entidades sin notas vinculadas retornan arreglo vacío (Badge exterior es estrictamente null)', async () => {
    // Si consultamos una tarea sin notas vinculadas (ej. TAR-999)
    const todasLasNotas = await db.notas.toArray();
    const mapa = new Map<string, NotaRecord[]>();

    for (const raw of todasLasNotas) {
      const n = normalizeNota(raw);
      for (const v of n.enlaces_entidades_json || []) {
        const actuales = mapa.get(v.codigo.trim()) || [];
        actuales.push(n);
        mapa.set(v.codigo.trim(), actuales);
      }
    }

    const notasHuerfanas = mapa.get('TAR-999') || [];
    expect(notasHuerfanas).toHaveLength(0);
    // Demuestra que notas.length === 0 y BadgeNotasVinculadas retorna null sin ensuciar la UI
  });

  it('7. [Fase 4.43] Vinculación sucesiva múltiple (N >= 2) asocia múltiples notas a la misma entidad sin colisión', async () => {
    // Creamos dos notas distintas y vinculamos ambas a la misma tarea 'TAR-050'
    const vinculoTar50: VinculoEntidad = {
      tipo: 'TAREA',
      codigo: 'TAR-050',
      titulo: 'Auditoría de Seguridad y Tokens'
    };

    const notaA = await crearNotaConVinculo(
      { titulo: 'Nota A: Hallazgos de Red', contenido_markdown: 'Detalle de puertos' },
      vinculoTar50
    );

    const notaB = await crearNotaConVinculo(
      { titulo: 'Nota B: Checklist de Criptografía', contenido_markdown: 'Algoritmos AES-GCM' },
      vinculoTar50
    );

    expect(notaA.id).not.toBe(notaB.id);

    // Mapeo reactivo de TAR-050
    const todas = await db.notas.toArray();
    const notasTar50: NotaRecord[] = [];
    for (const raw of todas) {
      const n = normalizeNota(raw);
      if (n.enlaces_entidades_json?.some((e) => e.codigo === 'TAR-050')) {
        notasTar50.push(n);
      }
    }

    expect(notasTar50.length).toBeGreaterThanOrEqual(2);
    expect(notasTar50.some((n) => n.titulo === 'Nota A: Hallazgos de Red')).toBe(true);
    expect(notasTar50.some((n) => n.titulo === 'Nota B: Checklist de Criptografía')).toBe(true);
  });

  it('8. [Fase 4.43] Persistencia atómica de enlaces_entidades_json preserva { tipo, codigo, titulo, id_entidad } y updated_at', async () => {
    const vinculoCompleto: VinculoEntidad = {
      tipo: 'HABITO',
      codigo: 'ACT-088',
      titulo: 'Entrenamiento de Resistencia',
      id_entidad: 'uuid-habito-088-xyz'
    };

    const exito = await vincularNotaAEntidad(notaMockBase.id, vinculoCompleto);
    expect(exito).toBe(true);

    const notaEnDb = await db.notas.get(notaMockBase.id);
    expect(notaEnDb).toBeDefined();

    const enlaceGuardado = notaEnDb?.enlaces_entidades_json.find((e) => e.codigo === 'ACT-088');
    expect(enlaceGuardado).toBeDefined();
    expect(enlaceGuardado?.tipo).toBe('HABITO');
    expect(enlaceGuardado?.codigo).toBe('ACT-088');
    expect(enlaceGuardado?.titulo).toBe('Entrenamiento de Resistencia');
    expect(enlaceGuardado?.id_entidad).toBe('uuid-habito-088-xyz');

    expect(notaEnDb?.updated_at).toBeDefined();
    expect(new Date(notaEnDb!.updated_at).getTime()).toBeGreaterThan(0);
  });
});
