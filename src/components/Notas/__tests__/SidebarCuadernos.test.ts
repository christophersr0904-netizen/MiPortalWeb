import { describe, it, expect, vi } from 'vitest';
import { resolverIconoCuaderno, MAPA_ICONOS_CUADERNO } from '../SidebarCuadernos';
import { CATALOGO_ICONOS_CUADERNO } from '../ModalCrearCuaderno';
import { Folder, BookOpen, Code, Briefcase } from 'lucide-react';
import { sanitizarNotaPayload, sanitizarNotaInbound } from '../../../services/syncPayloadSanitizer';
import { normalizeNota } from '../../../utils/entityNormalizer';
import { UndoDeleteManager } from '../../../context/UndoDeleteContext';
import type { CuadernoMeta, NotaRecord } from '../../../types';

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

  describe('Erradicación del Efecto Rebote al Eliminar Cuadernos [REQ-SYNC-NOTAS-04-FIX]', () => {
    it('V3: sanitizarNotaPayload y sanitizarNotaInbound preservan block_nombre vacío ("") sin forzar "General" ni resucitar localPrevio', () => {
      const notaDesvinculada: NotaRecord = {
        id: '550e8400-e29b-41d4-a716-446655440099',
        user_id: '00000000-0000-0000-0000-000000000001',
        codigo_legado: 'NOT-00099',
        titulo: 'Nota desvinculada de cuaderno',
        contenido_markdown: 'Contenido libre',
        tipo_nota: 'TEXTO',
        block_nombre: '',
        checklists_json: [],
        color_tema: 'default',
        es_fijada: false,
        adjuntos_drive_json: [],
        enlaces_entidades_json: [],
        etiquetas: [],
        created_at: '2026-11-17T00:00:00.000Z',
        updated_at: '2026-11-17T01:00:00.000Z',
        version: 2,
        sync_status: 'pending'
      };

      // Outbound: debe enviar "" estricto, jamás "General"
      const outbound = sanitizarNotaPayload(notaDesvinculada);
      expect(outbound.block_nombre).toBe('');

      // Inbound: cuando Supabase devuelve block_nombre: "", no debe caer en localPrevio ("Cuaderno Antiguo") ni en "General"
      const localPrevio = { ...notaDesvinculada, block_nombre: 'Cuaderno Antiguo' };
      const inbound = sanitizarNotaInbound({ ...outbound, id: notaDesvinculada.id }, localPrevio);
      expect(inbound.block_nombre).toBe('');
    });

    it('V1, V2, V4: eliminar el cuaderno "General" o uno personalizado no vuelve a aparecer tras 5 segundos del timer UndoDelete', async () => {
      vi.useFakeTimers();
      const manager = new UndoDeleteManager();

      let cuadernosMeta: Record<string, CuadernoMeta> = {
        General: { id: 'c1', nombre: 'General', descripcion: '', icono: 'Folder', created_at: '2026-01-01T00:00:00Z' },
        Proyectos: { id: 'c2', nombre: 'Proyectos', descripcion: '', icono: 'Folder', created_at: '2026-01-01T00:00:00Z' },
        Arquitectura: { id: 'c3', nombre: 'Arquitectura', descripcion: '', icono: 'Code', created_at: '2026-01-01T00:00:00Z' }
      };
      let blocksLocales = ['Arquitectura'];
      const cuadernosEliminados = new Set<string>();
      const notasEnDexie: any[] = [
        { id: 'n1', titulo: 'Nota en General', block_nombre: 'General' },
        { id: 'n2', titulo: 'Nota con alias legado', Block_Nombre: 'Arquitectura ' }
      ];

      const calcularBloquesUnicos = () => {
        const set = new Set<string>();
        const notasRaw = notasEnDexie.map((n) => normalizeNota(n));

        Object.keys(cuadernosMeta).forEach((b) => {
          const trimmed = b.trim();
          if (trimmed && !manager.estaOculto(trimmed) && !cuadernosEliminados.has(trimmed)) {
            set.add(trimmed);
          }
        });
        blocksLocales.forEach((b) => {
          if (b && b.trim() && !manager.estaOculto(b.trim()) && !cuadernosEliminados.has(b.trim())) {
            set.add(b.trim());
          }
        });
        notasRaw.forEach((n) => {
          if (n.block_nombre && n.block_nombre.trim() && !manager.estaOculto(n.block_nombre.trim()) && !cuadernosEliminados.has(n.block_nombre.trim())) {
            set.add(n.block_nombre.trim());
          }
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
      };

      const handleEliminarSimulado = (nombreBlock: string) => {
        const targetBlock = nombreBlock.trim();
        manager.programarEliminacion({
          tabla: 'cuadernos',
          id: nombreBlock,
          etiqueta: `Cuaderno: ${nombreBlock}`,
          tipo: 'CUADERNO',
          duracionMs: 5000,
          commit: async () => {
            cuadernosEliminados.add(targetBlock);
            blocksLocales = blocksLocales.filter((b) => b.trim() !== targetBlock);
            const nuevosMeta = { ...cuadernosMeta };
            delete nuevosMeta[nombreBlock];
            delete nuevosMeta[targetBlock];
            cuadernosMeta = nuevosMeta;

            // Filtro normalizado idéntico a VisorNotas.tsx
            const notasAModificar = notasEnDexie.filter(
              (n) => (normalizeNota(n).block_nombre || '') === targetBlock
            );
            for (const n of notasAModificar) {
              n.block_nombre = '';
              n.Block_Nombre = undefined;
              n.cuaderno = undefined;
              n.categoria = undefined;
            }
          }
        });
      };

      expect(calcularBloquesUnicos()).toEqual(['Arquitectura', 'General', 'Proyectos']);

      // Eliminar tanto el predeterminado 'General' como el personalizado 'Arquitectura'
      handleEliminarSimulado('General');
      handleEliminarSimulado('Arquitectura');

      // Durante los 5 segundos de gracia deben estar ocultos
      expect(calcularBloquesUnicos()).toEqual(['Proyectos']);

      // Avanzar más allá de los 5000ms (ejecución de commit y liberación de pendingMap)
      vi.advanceTimersByTime(5001);
      await vi.runAllTimersAsync();

      // Tras expirar los 5 segundos, NO deben reaparecer en bloquesUnicos (cero efecto rebote)
      expect(manager.estaOculto('General')).toBe(false);
      expect(manager.estaOculto('Arquitectura')).toBe(false);
      expect(calcularBloquesUnicos()).toEqual(['Proyectos']);

      // Y las notas asociadas quedaron limpias como notas sueltas
      expect(normalizeNota(notasEnDexie[0]).block_nombre).toBeUndefined();
      expect(normalizeNota(notasEnDexie[1]).block_nombre).toBeUndefined();

      manager.destroy();
      vi.useRealTimers();
    });
  });
});

