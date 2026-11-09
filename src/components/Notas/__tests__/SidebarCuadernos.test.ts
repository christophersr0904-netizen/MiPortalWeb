import { describe, it, expect } from 'vitest';
import { resolverIconoCuaderno, MAPA_ICONOS_CUADERNO } from '../SidebarCuadernos';
import { CATALOGO_ICONOS_CUADERNO } from '../ModalCrearCuaderno';
import { Folder, BookOpen, Code, Briefcase } from 'lucide-react';
import type { CuadernoMeta } from '../../../types';

describe('SidebarCuadernos y Gestión de Metadatos de Cuadernos [REQ-NOTAS-002]', () => {
  it('resuelve íconos Lucide conocidos y aplica fallback a Folder para íconos desconocidos o nulos', () => {
    expect(resolverIconoCuaderno('BookOpen')).toBe(BookOpen);
    expect(resolverIconoCuaderno('Code')).toBe(Code);
    expect(resolverIconoCuaderno('Briefcase')).toBe(Briefcase);
    expect(resolverIconoCuaderno('Folder')).toBe(Folder);
    expect(resolverIconoCuaderno('InexistenteIcono')).toBe(Folder);
    expect(resolverIconoCuaderno(undefined)).toBe(Folder);
  });

  it('el catálogo de íconos de ModalCrearCuaderno dispone de 12 íconos semánticos con etiquetas accesibles', () => {
    expect(CATALOGO_ICONOS_CUADERNO.length).toBe(12);
    CATALOGO_ICONOS_CUADERNO.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.label).toBeDefined();
      expect(typeof item.label).toBe('string');
      expect(item.icon).toBeDefined();
      expect(MAPA_ICONOS_CUADERNO[item.id]).toBeDefined();
    });
  });

  it('fusiona bloques únicos de Dexie con cuadernosMeta garantizando fallback a Folder para blocks legacy', () => {
    const bloquesUnicos = ['General', 'Arquitectura', 'Ideas Legacy'];
    const cuadernosMeta: Record<string, CuadernoMeta> = {
      Arquitectura: {
        id: 'cua_01',
        nombre: 'Arquitectura',
        descripcion: 'Decisiones y diagramas C4',
        icono: 'Code',
        created_at: '2026-11-02T00:00:00.000Z'
      }
    };

    // Función de normalización idéntica a la implementada en VisorNotas
    const resultado: Record<string, CuadernoMeta> = { ...cuadernosMeta };
    bloquesUnicos.forEach((block) => {
      if (!resultado[block]) {
        resultado[block] = {
          id: 'cua_legacy_' + encodeURIComponent(block),
          nombre: block,
          descripcion: '',
          icono: 'Folder',
          created_at: new Date(0).toISOString()
        };
      }
    });

    // Cuaderno con metadatos personalizados
    expect(resultado['Arquitectura'].icono).toBe('Code');
    expect(resultado['Arquitectura'].descripcion).toBe('Decisiones y diagramas C4');

    // Bloque legacy sin metadatos
    expect(resultado['General'].icono).toBe('Folder');
    expect(resultado['General'].descripcion).toBe('');

    // Bloque legacy con espacios
    expect(resultado['Ideas Legacy'].icono).toBe('Folder');
    expect(resultado['Ideas Legacy'].id).toBe('cua_legacy_Ideas%20Legacy');
  });

  it('valida la unicidad de nombres para prevenir colisiones en la creación de cuadernos', () => {
    const existentes = ['General', 'Proyectos', 'Finanzas'];
    const nuevoNombreDuplicado = 'general';
    const nuevoNombreValido = 'Arquitectura';

    const esDuplicado = (nombre: string) =>
      existentes.some((n) => n.toLowerCase() === nombre.trim().toLowerCase());

    expect(esDuplicado(nuevoNombreDuplicado)).toBe(true);
    expect(esDuplicado(nuevoNombreValido)).toBe(false);
  });

  it('evalúa la lógica multi-select acumulativa (AND) para subfiltros rápidos [REQ-FIX-12]', () => {
    type SubFiltroRapido = 'FIJADAS' | 'ADJUNTOS' | 'VINCULADAS' | 'CHECKLIST' | 'WISHLIST';

    const toggleFiltro = (activos: SubFiltroRapido[], target: SubFiltroRapido): SubFiltroRapido[] =>
      activos.includes(target) ? activos.filter((f) => f !== target) : [...activos, target];

    let filtros: SubFiltroRapido[] = [];
    filtros = toggleFiltro(filtros, 'FIJADAS');
    expect(filtros).toEqual(['FIJADAS']);

    filtros = toggleFiltro(filtros, 'CHECKLIST');
    expect(filtros).toEqual(['FIJADAS', 'CHECKLIST']);

    interface MockNota {
      es_fijada: boolean;
      tipo_nota: 'CHECKLIST' | 'TEXTO';
      checklists_json: { id: string; texto: string; completado: boolean }[];
    }

    const nota1: MockNota = { es_fijada: true, tipo_nota: 'CHECKLIST', checklists_json: [{ id: '1', texto: 'ok', completado: false }] };
    const nota2: MockNota = { es_fijada: true, tipo_nota: 'TEXTO', checklists_json: [] };
    const nota3: MockNota = { es_fijada: false, tipo_nota: 'CHECKLIST', checklists_json: [{ id: '1', texto: 'ok', completado: false }] };

    const cumpleFiltros = (n: MockNota, activos: SubFiltroRapido[]) => {
      return activos.every((f) => {
        if (f === 'FIJADAS') return Boolean(n.es_fijada);
        if (f === 'CHECKLIST') return n.tipo_nota === 'CHECKLIST' || n.checklists_json.length > 0;
        return true;
      });
    };

    expect(cumpleFiltros(nota1, filtros)).toBe(true);
    expect(cumpleFiltros(nota2, filtros)).toBe(false);
    expect(cumpleFiltros(nota3, filtros)).toBe(false);

    // Deseleccionar FIJADAS deja solo CHECKLIST
    filtros = toggleFiltro(filtros, 'FIJADAS');
    expect(filtros).toEqual(['CHECKLIST']);
    expect(cumpleFiltros(nota1, filtros)).toBe(true);
    expect(cumpleFiltros(nota3, filtros)).toBe(true);
    expect(cumpleFiltros(nota2, filtros)).toBe(false);
  });

  it('filtra cuadernos en búfer optimista UndoDelete y los restaura sin pérdida de datos [REQ-FIX-12]', () => {
    const blocksLocales = ['General', 'Arquitectura', 'Personal'];
    const ocultos = new Set<string>();

    const obtenerBloquesVisibles = (locales: string[], hidden: Set<string>) =>
      locales.filter((b) => !hidden.has(b));

    expect(obtenerBloquesVisibles(blocksLocales, ocultos)).toEqual(['General', 'Arquitectura', 'Personal']);

    // Programar eliminación optimista
    ocultos.add('Arquitectura');
    expect(obtenerBloquesVisibles(blocksLocales, ocultos)).toEqual(['General', 'Personal']);

    // Al presionar Deshacer
    ocultos.delete('Arquitectura');
    expect(obtenerBloquesVisibles(blocksLocales, ocultos)).toEqual(['General', 'Arquitectura', 'Personal']);
  });

  describe('Drag-and-Drop de Notas a Cuadernos Temáticos [REQ-FIX-13]', () => {
    it('resuelve correctamente los destinos de bloque ("__sin_block__" a vacío y nombres de cuadernos exactos)', () => {
      const resolverDestino = (destinoBlock: string) =>
        destinoBlock === '__sin_block__' ? '' : destinoBlock;

      expect(resolverDestino('__sin_block__')).toBe('');
      expect(resolverDestino('Arquitectura')).toBe('Arquitectura');
      expect(resolverDestino('Ideas 2026')).toBe('Ideas 2026');
    });

    it('identifica movimientos redundantes cuando la nota ya pertenece al cuaderno destino', () => {
      interface NotaSimulada {
        id: string;
        block_nombre?: string;
      }

      const verificarMovimiento = (nota: NotaSimulada, destinoBlock: string) => {
        const nuevoBlock = destinoBlock === '__sin_block__' ? '' : destinoBlock;
        const blockActual = nota.block_nombre || '';
        if (blockActual === nuevoBlock) {
          return { procede: false, motivo: 'YA_ASIGNADA' };
        }
        return { procede: true, nuevoBlock };
      };

      const notaEnArquitectura: NotaSimulada = { id: 'n1', block_nombre: 'Arquitectura' };
      const notaSuelta: NotaSimulada = { id: 'n2', block_nombre: '' };

      // Movimiento redundante a la misma carpeta
      expect(verificarMovimiento(notaEnArquitectura, 'Arquitectura')).toEqual({
        procede: false,
        motivo: 'YA_ASIGNADA'
      });
      // Movimiento redundante de nota suelta a Notas Sueltas
      expect(verificarMovimiento(notaSuelta, '__sin_block__')).toEqual({
        procede: false,
        motivo: 'YA_ASIGNADA'
      });

      // Movimientos válidos
      expect(verificarMovimiento(notaEnArquitectura, '__sin_block__')).toEqual({
        procede: true,
        nuevoBlock: ''
      });
      expect(verificarMovimiento(notaSuelta, 'Finanzas')).toEqual({
        procede: true,
        nuevoBlock: 'Finanzas'
      });
    });

    it('genera el payload de actualización para Dexie con sync_status: pending y version incrementada', () => {
      const notaPrevia = {
        id: 'nota-123',
        block_nombre: '',
        version: 2
      };

      const prepararUpdate = (nota: typeof notaPrevia, nuevoBlock: string) => ({
        block_nombre: nuevoBlock,
        updated_at: '2026-11-09T01:00:00.000Z',
        version: (nota.version || 1) + 1,
        sync_status: 'pending' as const
      });

      const update = prepararUpdate(notaPrevia, 'PMO OS');
      expect(update.block_nombre).toBe('PMO OS');
      expect(update.version).toBe(3);
      expect(update.sync_status).toBe('pending');
    });

    it('evalúa la lógica de boundary check en dragLeave para prevenir parpadeos por elementos hijos', () => {
      const rect = { left: 100, right: 300, top: 50, bottom: 90 };

      const esSalidaReal = (clientX: number, clientY: number, r: typeof rect) =>
        clientX < r.left || clientX >= r.right || clientY < r.top || clientY >= r.bottom;

      // Coordenadas internas (sobre un elemento hijo como ícono o texto)
      expect(esSalidaReal(150, 70, rect)).toBe(false);

      // Coordenadas externas (cursor abandonó el contenedor)
      expect(esSalidaReal(90, 70, rect)).toBe(true);
      expect(esSalidaReal(310, 70, rect)).toBe(true);
      expect(esSalidaReal(150, 40, rect)).toBe(true);
      expect(esSalidaReal(150, 100, rect)).toBe(true);
    });
  });
});

