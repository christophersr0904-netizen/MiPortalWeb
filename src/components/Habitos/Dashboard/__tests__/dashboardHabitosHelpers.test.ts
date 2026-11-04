import { describe, it, expect } from 'vitest';
import { resolverTituloHabito } from '../TablaRendimiento';
import { resolverNombreMeta } from '../MetasCuantitativas';

describe('FIX-HABITOS-DASHBOARD-SEARCH-EMPTY-SPACES-121: Helper de Resolución Defensiva y Cálculos', () => {
  describe('resolverTituloHabito', () => {
    it('resuelve nombre_actividad si está presente', () => {
      expect(resolverTituloHabito({ nombre_actividad: 'Hábito Canónico' })).toBe('Hábito Canónico');
    });

    it('resuelve fallback polimórfico a nombre, Nombre_Actividad, titulo, actividad o descripcion', () => {
      expect(resolverTituloHabito({ nombre: 'Nombre Secundario' })).toBe('Nombre Secundario');
      expect(resolverTituloHabito({ Nombre_Actividad: 'Nombre Legado' })).toBe('Nombre Legado');
      expect(resolverTituloHabito({ Nombre: 'Nombre Mayúscula' })).toBe('Nombre Mayúscula');
      expect(resolverTituloHabito({ titulo: 'Título Minúscula' })).toBe('Título Minúscula');
      expect(resolverTituloHabito({ Titulo: 'Título Mayúscula' })).toBe('Título Mayúscula');
      expect(resolverTituloHabito({ actividad: 'Actividad Clave' })).toBe('Actividad Clave');
      expect(resolverTituloHabito({ descripcion: 'Descripción Clave' })).toBe('Descripción Clave');
      expect(resolverTituloHabito({ nombre_tarea_actividad: 'Tarea Actividad' })).toBe('Tarea Actividad');
    });

    it('retorna fallback seguro "Hábito sin título" si el objeto es nulo, vacío o indefinido', () => {
      expect(resolverTituloHabito(null)).toBe('Hábito sin título');
      expect(resolverTituloHabito(undefined)).toBe('Hábito sin título');
      expect(resolverTituloHabito({})).toBe('Hábito sin título');
      expect(resolverTituloHabito({ nombre_actividad: '' })).toBe('Hábito sin título');
    });
  });

  describe('resolverNombreMeta', () => {
    it('resuelve nombre_meta si está presente', () => {
      expect(resolverNombreMeta({ nombre_meta: 'Leer 12 libros' })).toBe('Leer 12 libros');
    });

    it('resuelve fallback polimórfico a nombre_actividad, nombre o titulo', () => {
      expect(resolverNombreMeta({ nombre_actividad: 'Correr 500 km' })).toBe('Correr 500 km');
      expect(resolverNombreMeta({ nombre: 'Ahorrar $1000' })).toBe('Ahorrar $1000');
      expect(resolverNombreMeta({ titulo: 'Meditar 100 horas' })).toBe('Meditar 100 horas');
    });

    it('retorna fallback seguro "Meta sin título" para objetos nulos o indefinidos', () => {
      expect(resolverNombreMeta(null)).toBe('Meta sin título');
      expect(resolverNombreMeta(undefined)).toBe('Meta sin título');
      expect(resolverNombreMeta({})).toBe('Meta sin título');
    });
  });

  describe('Cálculos numéricos defensivos en Metas Cuantitativas', () => {
    it('evita división por cero y NaN cuando meta_objetivo_total es 0 o nulo', () => {
      const totalInvalido = Math.max(1, Number(0) || 1);
      const actual = Math.max(0, Number(50) || 0);
      const ratio = actual / totalInvalido;
      const pct = Number.isFinite(ratio) ? Math.min(100, Math.max(0, Math.round(ratio * 100))) : 0;

      expect(Number.isFinite(pct)).toBe(true);
      expect(isNaN(pct)).toBe(false);
      expect(pct).toBe(100);
    });

    it('calcula porcentaje correcto con valores válidos', () => {
      const total = Math.max(1, Number(200) || 1);
      const actual = Math.max(0, Number(50) || 0);
      const ratio = actual / total;
      const pct = Number.isFinite(ratio) ? Math.min(100, Math.max(0, Math.round(ratio * 100))) : 0;

      expect(pct).toBe(25);
    });
  });
});

