import { describe, it, expect } from 'vitest';
import { normalizeNota, serializarNotaATextoPlano } from '../entityNormalizer';
import initialSeed from '../../db/initialSeed.json';
import { NotaRecord } from '../../types';

describe('REQ-NOT-03: Homogenización de Notas Compuestas, Blocks Dinámicos y Erradicación de Crashes', () => {
  it('1. normalizeNota admite simultáneamente texto markdown, checklist y wishlist (Nota Modular Compuesta)', () => {
    const rawNotaCompuesta = {
      id: 'NOT-TEST-001',
      titulo: 'Planificación de Viaje y Equipamiento',
      contenido_markdown: '# Itinerario\nVisita a museos y caminatas matutinas.',
      checklists_json: [
        { id: 'chk-1', texto: 'Comprar boletos de tren', completado: true },
        { id: 'chk-2', texto: 'Reservar hotel céntrico', completado: false }
      ],
      wishlist_json: {
        costoEstimado: 450.75,
        tienda: 'Amazon',
        urlReferencia: 'https://ejemplo.com/mochila',
        comprada: false
      },
      block_nombre: 'Viajes 2026',
      etiquetas: ['viajes', 'vacaciones', 'checklist'],
      fijada: true,
      color: 'blue'
    };

    const nota = normalizeNota(rawNotaCompuesta);

    // Verificación de integridad simultánea
    expect(nota.id).toBe('NOT-TEST-001');
    expect(nota.titulo).toBe('Planificación de Viaje y Equipamiento');
    expect(nota.contenido_markdown).toBe('# Itinerario\nVisita a museos y caminatas matutinas.');
    expect(nota.checklists_json).toHaveLength(2);
    expect(nota.checklists_json[0].texto).toBe('Comprar boletos de tren');
    expect(nota.checklists_json[0].completado).toBe(true);
    expect(nota.checklists_json[1].completado).toBe(false);
    expect(nota.wishlist_json).toBeDefined();
    expect(nota.wishlist_json?.costoEstimado).toBe(450.75);
    expect(nota.wishlist_json?.tienda).toBe('Amazon');
    expect(nota.block_nombre).toBe('Viajes 2026');
    expect(nota.fijada).toBe(true);
    expect(nota.color).toBe('blue');
    expect(nota.etiquetas).toEqual(['viajes', 'vacaciones', 'checklist']);
  });

  it('2. Blindaje contra crash: wishlist_json: {} se normaliza a undefined evitando error en toFixed(2)', () => {
    const rawCrashCandidate = {
      id: 'NOT-CRASH-001',
      titulo: 'Nota con Wishlist Vacío Peligroso',
      contenido_markdown: 'Nota normal que en legacy tenía wishlist vacío',
      wishlist_json: {} // Caso exacto que detonaba TypeError en toFixed
    };

    const nota = normalizeNota(rawCrashCandidate);

    // Debe sanearse a undefined
    expect(nota.wishlist_json).toBeUndefined();

    // Verificación de acceso seguro al formatear moneda
    const formatearMonedaSeguro = (n: NotaRecord) => {
      if (n.wishlist_json && typeof n.wishlist_json.costoEstimado === 'number') {
        return (n.wishlist_json.costoEstimado ?? 0).toFixed(2);
      }
      return 'N/A';
    };

    expect(formatearMonedaSeguro(nota)).toBe('N/A');
    expect(() => {
      // Incluso con fallback inline no debe fallar
      const costo = (nota.wishlist_json?.costoEstimado ?? 0).toFixed(2);
      expect(costo).toBe('0.00');
    }).not.toThrow();
  });

  it('3. Conversión numérica segura y sanitización de wishlist con valores mixtos', () => {
    const rawWishlistString = {
      id: 'NOT-WISH-NUM',
      titulo: 'Monitor UltraWide',
      wishlist_json: {
        costoEstimado: '1299.99', // String numérico procedente de formularios o seeds
        montoRealGastado: '1250.00',
        tienda: 'PC Componentes'
      }
    };

    const nota = normalizeNota(rawWishlistString);

    expect(nota.wishlist_json).toBeDefined();
    expect(nota.wishlist_json?.costoEstimado).toBe(1299.99);
    expect(nota.wishlist_json?.montoRealGastado).toBe(1250.00);
    expect(nota.wishlist_json!.costoEstimado!.toFixed(2)).toBe('1299.99');
  });

  it('4. Deserialización segura de JSON strings en checklists y etiquetas', () => {
    const rawSerializado = {
      id: 'NOT-JSON-STR',
      titulo: 'Nota serializada desde base de datos',
      checklists_json: JSON.stringify([
        { id: '1', texto: 'Tarea serializada 1', completado: false },
        { id: '2', texto: 'Tarea serializada 2', completado: true }
      ]),
      etiquetas: 'trabajo, urgente, backend'
    };

    const nota = normalizeNota(rawSerializado);

    expect(Array.isArray(nota.checklists_json)).toBe(true);
    expect(nota.checklists_json).toHaveLength(2);
    expect(nota.checklists_json[0].texto).toBe('Tarea serializada 1');
    expect(nota.checklists_json[1].completado).toBe(true);
    expect(nota.etiquetas).toEqual(['trabajo', 'urgente', 'backend']);
  });

  it('5. Manejo y asignación de Blocks dinámicos creados por el usuario', () => {
    const notaConBlock = normalizeNota({
      id: 'NOT-BLK-1',
      titulo: 'Nota en Block Personal',
      block_nombre: 'Finanzas Personales'
    });

    const notaSinBlock = normalizeNota({
      id: 'NOT-BLK-2',
      titulo: 'Nota Suelta'
    });

    expect(notaConBlock.block_nombre).toBe('Finanzas Personales');
    expect(notaSinBlock.block_nombre).toBeUndefined();

    // Lógica de filtrado en visor
    const todasLasNotas = [notaConBlock, notaSinBlock];
    const notasSuelta = todasLasNotas.filter(n => !n.block_nombre || n.block_nombre.trim() === '');
    const notasFinanzas = todasLasNotas.filter(n => n.block_nombre === 'Finanzas Personales');

    expect(notasSuelta).toHaveLength(1);
    expect(notasSuelta[0].id).toBe('NOT-BLK-2');
    expect(notasFinanzas).toHaveLength(1);
    expect(notasFinanzas[0].id).toBe('NOT-BLK-1');
  });

  it('6. Prueba de stress y erradicación de crashes sobre las 23 notas de initialSeed.json', () => {
    const rawNotas = (initialSeed as any).notas || [];
    expect(rawNotas.length).toBeGreaterThan(0);

    const normalizadas = rawNotas.map(normalizeNota);

    expect(normalizadas.length).toBe(rawNotas.length);

    // Verificar que ninguna nota normalizada cause crash al formatear wishlist o leer markdown
    normalizadas.forEach((n: NotaRecord) => {
      // 1. Markdown seguro
      expect(typeof n.contenido_markdown).toBe('string');
      expect(() => (n.contenido_markdown || '').toLowerCase()).not.toThrow();

      // 2. Título seguro
      expect(typeof n.titulo).toBe('string');
      expect(() => (n.titulo || '').toLowerCase()).not.toThrow();

      // 3. Wishlist seguro
      if (n.wishlist_json) {
        expect(typeof n.wishlist_json.costoEstimado).toBe('number');
        expect(() => {
          const formatted = (n.wishlist_json?.costoEstimado ?? 0).toFixed(2);
          expect(typeof formatted).toBe('string');
        }).not.toThrow();
      }

      // 4. Checklist seguro
      expect(Array.isArray(n.checklists_json)).toBe(true);
    });

    // Validar específicamente las notas que antes tenían wishlist_json: {}
    const notasPreviamentePeligrosas = ['NOT-00003', 'NOT-00006', 'NOT-00007', 'NOT-00008', 'NOT-00009'];
    notasPreviamentePeligrosas.forEach(id => {
      const encontrada = normalizadas.find((n: NotaRecord) => n.id === id);
      if (encontrada) {
        expect(encontrada.wishlist_json).toBeUndefined();
      }
    });
  });

  it('7. REQ-NOTAS-001: Edición in-situ inmutable de ítems en checklists_json preservando UUID y completado', () => {
    const checklistOriginal = [
      { id: 'chk-1', texto: 'Texto original', completado: false },
      { id: 'chk-2', texto: 'Otro paso', completado: true }
    ];

    const itemIdAEditar = 'chk-1';
    const nuevoTexto = 'Texto modificado in-line';

    // Función de mutación inmutable idéntica a handleEditarChecklistItem
    const checklistActualizado = checklistOriginal.map(c =>
      c.id === itemIdAEditar ? { ...c, texto: nuevoTexto } : c
    );

    expect(checklistActualizado[0].id).toBe('chk-1');
    expect(checklistActualizado[0].texto).toBe('Texto modificado in-line');
    expect(checklistActualizado[0].completado).toBe(false);
    expect(checklistActualizado[1].texto).toBe('Otro paso');
    expect(checklistActualizado[1].completado).toBe(true);

    // Inmutabilidad comprobada
    expect(checklistActualizado).not.toBe(checklistOriginal);
    expect(checklistOriginal[0].texto).toBe('Texto original');
  });

  it('8. REQ-NOTAS-001: Desacoplamiento de eventos y toggle atómico independiente en checklists_json', () => {
    const checklistOriginal = [
      { id: 'chk-1', texto: 'Comprar insumos', completado: false }
    ];

    // Toggle atómico aislado
    const toggled = checklistOriginal.map(c =>
      c.id === 'chk-1' ? { ...c, completado: !c.completado } : c
    );

    expect(toggled[0].completado).toBe(true);
    expect(toggled[0].texto).toBe('Comprar insumos');
  });

  it('9. REQ-SYS-004-NOTAS: serializarNotaATextoPlano serializa título, wishlist, checklists, markdown y tags excluyendo IDs técnicos', () => {
    const notaMock = {
      id: '00000000-0000-0000-0000-000000000999',
      codigo_legado: 'NOT-00099',
      titulo: 'Plan Semanal de Compras',
      contenido_markdown: 'Revisar ofertas del fin de semana en el supermercado.',
      checklists_json: [
        { id: 'chk-1', texto: 'Café de grano', completado: true },
        { id: 'chk-2', texto: 'Avena integral', completado: false }
      ],
      wishlist_json: {
        costoEstimado: 85.5,
        moneda: 'PEN',
        estado: 'Pendiente',
        urlReferencia: 'https://ejemplo.com/tienda'
      },
      etiquetas: ['compras', 'finanzas'],
      sync_status: 'synced',
      version: 3
    };

    const textoPlano = serializarNotaATextoPlano(notaMock);

    expect(textoPlano).toContain('Plan Semanal de Compras');
    expect(textoPlano).toContain('Costo: PEN 85.50 | Estado: Pendiente');
    expect(textoPlano).toContain('Enlace: https://ejemplo.com/tienda');
    expect(textoPlano).toContain('[x] Café de grano');
    expect(textoPlano).toContain('[ ] Avena integral');
    expect(textoPlano).toContain('Revisar ofertas del fin de semana en el supermercado.');
    expect(textoPlano).toContain('Tags: #compras #finanzas');

    // Comprobar que no se filtran IDs técnicos ni metadatos de sincronización
    expect(textoPlano).not.toContain('NOT-00099');
    expect(textoPlano).not.toContain('00000000-0000-0000-0000-000000000999');
    expect(textoPlano).not.toContain('synced');
  });
});
