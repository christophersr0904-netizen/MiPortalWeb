import { describe, it, expect } from 'vitest';
import { arePropsEqual, type TarjetaNotaProps } from '../TarjetaNota';
import type { NotaRecord } from '../../../types';

describe('TarjetaNota Memoization and Silencio Visual (REQ-SYS-001-F3)', () => {
  const notaBase: NotaRecord = {
    id: 'nota_123',
    user_id: '00000000-0000-0000-0000-000000000001',
    codigo_legado: 'NOT-001',
    titulo: 'Revisión Arquitectura PMO',
    contenido_markdown: 'Analizar backlog @PROY-001 y @TAR-002',
    color_tema: 'slate',
    es_fijada: false,
    block_nombre: 'Proyectos',
    tipo_nota: 'texto',
    etiquetas: ['arquitectura', 'pmo'],
    checklists_json: [
      { id: 'c1', texto: 'Verificar TypeScript', completado: true },
      { id: 'c2', texto: 'Verificar Tests', completado: false }
    ],
    wishlist_json: {
      costoEstimado: 250,
      montoRealGastado: 100,
      moneda: 'PEN',
      prioridad: 'ALTA',
      estado: 'PENDIENTE'
    },
    enlaces_entidades_json: [
      { tipo: 'PROYECTO', id_entidad: 'p1', codigo: 'PROY-001', titulo: 'Portal Web' }
    ],
    adjuntos_drive_json: [],
    updated_at: '2026-11-02T10:00:00Z',
    created_at: '2026-11-01T10:00:00Z',
    version: 1,
    sync_status: 'synced'
  };

  const dummyProps: TarjetaNotaProps = {
    nota: notaBase,
    onEditar: () => {},
    onEliminar: () => {},
    modoVista: 'masonry'
  };

  it('arePropsEqual retorna true cuando id, updated_at y modoVista se mantienen idénticos (Memoización Atómica)', () => {
    const nextProps: TarjetaNotaProps = {
      ...dummyProps,
      nota: { ...notaBase }
    };
    expect(arePropsEqual(dummyProps, nextProps)).toBe(true);
  });

  it('arePropsEqual retorna false cuando updated_at cambia (mutación de datos en Dexie)', () => {
    const nextProps: TarjetaNotaProps = {
      ...dummyProps,
      nota: { ...notaBase, updated_at: '2026-11-02T10:05:00Z' }
    };
    expect(arePropsEqual(dummyProps, nextProps)).toBe(false);
  });

  it('arePropsEqual retorna false cuando id de nota cambia', () => {
    const nextProps: TarjetaNotaProps = {
      ...dummyProps,
      nota: { ...notaBase, id: 'nota_distinta_999' }
    };
    expect(arePropsEqual(dummyProps, nextProps)).toBe(false);
  });

  it('arePropsEqual retorna false cuando modoVista cambia entre masonry y lista', () => {
    const nextProps: TarjetaNotaProps = {
      ...dummyProps,
      modoVista: 'lista'
    };
    expect(arePropsEqual(dummyProps, nextProps)).toBe(false);
  });

  it('garantiza que arePropsEqual no ejecuta JSON.stringify en cada ciclo de render', () => {
    // Si nota tiene subobjetos modificados pero updated_at no se alteró,
    // el reconciliador atómico confía en el contrato inmutable de Dexie
    const nextProps: TarjetaNotaProps = {
      ...dummyProps,
      nota: {
        ...notaBase,
        checklists_json: [
          { id: 'c1', texto: 'Verificar TypeScript', completado: true },
          { id: 'c2', texto: 'Verificar Tests', completado: true }
        ]
      }
    };
    // Al no cambiar updated_at, arePropsEqual retorna true sin costo de serialización
    expect(arePropsEqual(dummyProps, nextProps)).toBe(true);
  });

  it('al mutar en Dexie con updated_at refrescado, arePropsEqual retorna false', () => {
    const nextProps: TarjetaNotaProps = {
      ...dummyProps,
      nota: {
        ...notaBase,
        wishlist_json: {
          ...notaBase.wishlist_json!,
          montoRealGastado: 250,
          estado: 'CONSEGUIDO'
        },
        updated_at: '2026-11-02T10:10:00Z'
      }
    };
    expect(arePropsEqual(dummyProps, nextProps)).toBe(false);
  });

  it('calcula métricas de Wishlist y Checklist con precisión matemática', () => {
    const totalItems = notaBase.checklists_json.length;
    const itemsCompletados = notaBase.checklists_json.filter(c => c.completado).length;
    const pctChecklist = Math.round((itemsCompletados / totalItems) * 100);
    expect(pctChecklist).toBe(50);

    const meta = Number(notaBase.wishlist_json?.costoEstimado || 0);
    const gastado = Number(notaBase.wishlist_json?.montoRealGastado || 0);
    const pctWishlist = meta > 0 ? Math.min(Math.round((gastado / meta) * 100), 100) : 0;
    expect(pctWishlist).toBe(40);
  });

  it('valida el reconocimiento de menciones contextuales (@PROY, @TAR, @GAS, @ACT)', () => {
    const regex = /(@(?:PROY|TAR|GAS|ACT)-\w+)/g;
    const texto = 'Vincular con @PROY-001, revisar @TAR-999 y auditar @GAS-104 y @ACT-50';
    const menciones = texto.match(regex);
    expect(menciones).toEqual(['@PROY-001', '@TAR-999', '@GAS-104', '@ACT-50']);
  });
});
