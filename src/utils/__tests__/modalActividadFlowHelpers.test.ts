import { describe, it, expect } from 'vitest';
import {
  resolverNombreActividadDefensivo,
  resolverNombreColumnaCanonico
} from '../../components/Modals/ModalActividadFlow';

describe('ModalActividadFlow - FIX-HABITOS-MODAL-DETAIL-TITLE-PILL-109', () => {
  describe('resolverNombreActividadDefensivo', () => {
    it('retorna cadena vacía si no se suministra actividad', () => {
      expect(resolverNombreActividadDefensivo(null)).toBe('');
      expect(resolverNombreActividadDefensivo(undefined)).toBe('');
    });

    it('prioriza nombre_actividad canónico', () => {
      const act = {
        nombre_actividad: 'Meditación Matutina',
        nombre: 'Otro nombre',
        titulo: 'Título secundario'
      };
      expect(resolverNombreActividadDefensivo(act as any)).toBe('Meditación Matutina');
    });

    it('extrae en cascada desde campo nombre si nombre_actividad está vacío', () => {
      const act = {
        nombre_actividad: '',
        nombre: 'Caminata 30m'
      };
      expect(resolverNombreActividadDefensivo(act as any)).toBe('Caminata 30m');
    });

    it('extrae en cascada desde Nombre_Actividad (legacy PascalCase)', () => {
      const act = {
        Nombre_Actividad: 'Lectura de 10 Páginas'
      };
      expect(resolverNombreActividadDefensivo(act as any)).toBe('Lectura de 10 Páginas');
    });

    it('extrae en cascada desde titulo o Titulo', () => {
      const act1 = { titulo: 'Revisión Semanal GTD' };
      const act2 = { Titulo: 'Planificación Financiera' };
      expect(resolverNombreActividadDefensivo(act1 as any)).toBe('Revisión Semanal GTD');
      expect(resolverNombreActividadDefensivo(act2 as any)).toBe('Planificación Financiera');
    });

    it('extrae en cascada desde actividad o descripcion o nombre_tarea_actividad', () => {
      expect(resolverNombreActividadDefensivo({ actividad: 'Yoga Diario' } as any)).toBe('Yoga Diario');
      expect(resolverNombreActividadDefensivo({ descripcion: 'Hidratación 2L' } as any)).toBe('Hidratación 2L');
      expect(resolverNombreActividadDefensivo({ nombre_tarea_actividad: 'Descanso Ocular' } as any)).toBe('Descanso Ocular');
    });

    it('retorna "Actividad sin título" como fallback defensivo si el objeto no tiene campos de nombre', () => {
      const actVacio = { id: 'act-123' };
      expect(resolverNombreActividadDefensivo(actVacio as any)).toBe('Actividad sin título');
    });
  });

  describe('resolverNombreColumnaCanonico', () => {
    it('resuelve correctamente la columna canónica en mayúsculas o minúsculas', () => {
      expect(resolverNombreColumnaCanonico('SALUD_DEPORTE')).toBe('Salud & Deporte');
      expect(resolverNombreColumnaCanonico('salud_deporte')).toBe('Salud & Deporte');
      expect(resolverNombreColumnaCanonico('DESARROLLO_ESTUDIO')).toBe('Desarrollo Personal');
      expect(resolverNombreColumnaCanonico('LABORAL_HONORARIO')).toBe('Trabajo & Carrera');
      expect(resolverNombreColumnaCanonico('FINANZAS_TRAMITES')).toBe('Finanzas & Admin');
      expect(resolverNombreColumnaCanonico('SOCIAL_FAMILIA')).toBe('Hogar & Familia');
      expect(resolverNombreColumnaCanonico('PERSONAL_DESCANSO')).toBe('Ocio & Social');
    });

    it('utiliza fallback defensivo si la clave es nula o indefinida', () => {
      expect(resolverNombreColumnaCanonico(null, 'SALUD_DEPORTE')).toBe('Salud & Deporte');
      expect(resolverNombreColumnaCanonico(undefined, 'LABORAL_HONORARIO')).toBe('Trabajo & Carrera');
    });
  });
});

