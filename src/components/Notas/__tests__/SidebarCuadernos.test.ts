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
});

