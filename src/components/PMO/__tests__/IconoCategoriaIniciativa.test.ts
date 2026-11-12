import { describe, it, expect } from 'vitest';
import { Briefcase, User, TrendingUp, Users, Layers } from 'lucide-react';
import {
  resolverMetaCategoriaIniciativa,
  coincideCategoriaIniciativa
} from '../IconoCategoriaIniciativa';

describe('REQ-UI-32-33-REF: Compactación Iconográfica de Categorías en Tarjetas PMO/Kanban', () => {
  it('resuelve Profesional con Briefcase sky y borde Cobalt', () => {
    const meta = resolverMetaCategoriaIniciativa('Profesional');
    expect(meta.clave).toBe('profesional');
    expect(meta.etiqueta).toBe('Profesional');
    expect(meta.Icon).toBe(Briefcase);
    expect(meta.iconClass).toContain('text-sky-400');
    expect(meta.containerClass).toBe('bg-sky-500/10 border border-sky-500/20');
  });

  it('resuelve Personal con User emerald y borde Cobalt', () => {
    const meta = resolverMetaCategoriaIniciativa('personal');
    expect(meta.clave).toBe('personal');
    expect(meta.etiqueta).toBe('personal');
    expect(meta.Icon).toBe(User);
    expect(meta.iconClass).toContain('text-emerald-400');
    expect(meta.containerClass).toBe('bg-emerald-500/10 border border-emerald-500/20');
  });

  it('resuelve Inversión e Inversiones de forma unificada con TrendingUp violet', () => {
    for (const etiqueta of ['Inversiones', 'Inversión', 'inversion']) {
      const meta = resolverMetaCategoriaIniciativa(etiqueta);
      expect(meta.clave).toBe('inversion');
      expect(meta.etiqueta).toBe(etiqueta);
      expect(meta.Icon).toBe(TrendingUp);
      expect(meta.iconClass).toContain('text-violet-400');
      expect(meta.containerClass).toBe('bg-violet-500/10 border border-violet-500/20');
    }
  });

  it('resuelve Social con Users amber y borde Cobalt', () => {
    const meta = resolverMetaCategoriaIniciativa('Social');
    expect(meta.clave).toBe('social');
    expect(meta.etiqueta).toBe('Social');
    expect(meta.Icon).toBe(Users);
    expect(meta.iconClass).toContain('text-amber-400');
    expect(meta.containerClass).toBe('bg-amber-500/10 border border-amber-500/20');
  });

  it('provee fallback seguro sin colisiones para categorías generales o vacías', () => {
    const metaVacio = resolverMetaCategoriaIniciativa(undefined);
    expect(metaVacio.clave).toBe('general');
    expect(metaVacio.etiqueta).toBe('General');
    expect(metaVacio.Icon).toBe(Layers);

    const metaCustom = resolverMetaCategoriaIniciativa('Desarrollo Web');
    expect(metaCustom.clave).toBe('general');
    expect(metaCustom.etiqueta).toBe('Desarrollo Web');
  });

  it('preserva compatibilidad de filtrado por cartera Kanban para todas las claves', () => {
    expect(coincideCategoriaIniciativa('Profesional', '')).toBe(true);
    expect(coincideCategoriaIniciativa('Profesional', 'Profesional')).toBe(true);
    expect(coincideCategoriaIniciativa('Personal', 'Profesional')).toBe(false);
    expect(coincideCategoriaIniciativa('Personal', 'Personal')).toBe(true);
    expect(coincideCategoriaIniciativa('Social', 'Social')).toBe(true);
    expect(coincideCategoriaIniciativa('Inversiones', 'Inversiones')).toBe(true);
    expect(coincideCategoriaIniciativa('Inversión', 'Inversiones')).toBe(true);
    expect(coincideCategoriaIniciativa('Profesional', 'Inversiones')).toBe(false);
  });
});
