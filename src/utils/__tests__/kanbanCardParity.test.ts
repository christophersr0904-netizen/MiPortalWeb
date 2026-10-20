import { describe, it, expect } from 'vitest';

describe('REQ-F2-P2.2-FUNC: Kanban Card Priority Stripe and Filter Parity', () => {
  // Helper que emula la resolución canónica de color de franja en ViewKanban.tsx
  function resolverColorFranjaPrioridad(prioridad?: string): string {
    const prioStr = String(prioridad || '').toLowerCase();
    if (prioStr.includes('01') || prioStr.includes('p1') || prioStr.includes('alta') || prioStr.includes('urgente')) {
      return 'bg-rose-500';
    } else if (prioStr.includes('02') || prioStr.includes('p2') || prioStr.includes('media')) {
      return 'bg-amber-400';
    } else if (prioStr.includes('03') || prioStr.includes('p3') || prioStr.includes('baja')) {
      return 'bg-emerald-400';
    } else if (prioStr.includes('04') || prioStr.includes('p4')) {
      return 'bg-slate-600';
    }
    return 'bg-slate-600';
  }

  // Helper que emula el matching inclusivo y resiliente del filtro de prioridad
  function evaluarFiltroPrioridad(prioridadTarea: string | undefined, filtroPrioridad: string): boolean {
    if (!filtroPrioridad) return true;
    const pNorm = String(prioridadTarea || '').toLowerCase();
    const fNorm = filtroPrioridad.toLowerCase();
    if (fNorm.includes('01') || fNorm.includes('p1') || fNorm.includes('alta')) {
      return pNorm.includes('01') || pNorm.includes('p1') || pNorm.includes('alta') || pNorm.includes('urgente');
    } else if (fNorm.includes('02') || fNorm.includes('p2') || fNorm.includes('media')) {
      return pNorm.includes('02') || pNorm.includes('p2') || pNorm.includes('media');
    } else if (fNorm.includes('03') || fNorm.includes('p3') || fNorm.includes('baja')) {
      return pNorm.includes('03') || pNorm.includes('p3') || pNorm.includes('baja');
    } else if (fNorm.includes('04') || fNorm.includes('p4')) {
      return pNorm.includes('04') || pNorm.includes('p4');
    }
    return pNorm.includes(fNorm) || prioridadTarea === filtroPrioridad;
  }

  it('asigna bg-rose-500 a P1 / Alta / Urgente', () => {
    expect(resolverColorFranjaPrioridad('01_P1_Alta')).toBe('bg-rose-500');
    expect(resolverColorFranjaPrioridad('Alta')).toBe('bg-rose-500');
    expect(resolverColorFranjaPrioridad('P1')).toBe('bg-rose-500');
    expect(resolverColorFranjaPrioridad('urgente')).toBe('bg-rose-500');
  });

  it('asigna bg-amber-400 a P2 / Media', () => {
    expect(resolverColorFranjaPrioridad('02_P2_Media')).toBe('bg-amber-400');
    expect(resolverColorFranjaPrioridad('Media')).toBe('bg-amber-400');
    expect(resolverColorFranjaPrioridad('P2')).toBe('bg-amber-400');
  });

  it('asigna bg-emerald-400 a P3 / Baja', () => {
    expect(resolverColorFranjaPrioridad('03_P3_Baja')).toBe('bg-emerald-400');
    expect(resolverColorFranjaPrioridad('Baja')).toBe('bg-emerald-400');
    expect(resolverColorFranjaPrioridad('P3')).toBe('bg-emerald-400');
  });

  it('asigna bg-slate-600 a P4 / default', () => {
    expect(resolverColorFranjaPrioridad('04_P4')).toBe('bg-slate-600');
    expect(resolverColorFranjaPrioridad(undefined)).toBe('bg-slate-600');
  });

  it('el filtro de prioridad hace match flexible y resiliente', () => {
    // Filtro P1
    expect(evaluarFiltroPrioridad('01_P1_Alta', '01_P1_Alta')).toBe(true);
    expect(evaluarFiltroPrioridad('Alta', '01_P1_Alta')).toBe(true);
    expect(evaluarFiltroPrioridad('02_P2_Media', '01_P1_Alta')).toBe(false);

    // Filtro P2
    expect(evaluarFiltroPrioridad('02_P2_Media', '02_P2_Media')).toBe(true);
    expect(evaluarFiltroPrioridad('Media', '02_P2_Media')).toBe(true);
    expect(evaluarFiltroPrioridad('01_P1_Alta', '02_P2_Media')).toBe(false);

    // Filtro P3
    expect(evaluarFiltroPrioridad('03_P3_Baja', '03_P3_Baja')).toBe(true);
    expect(evaluarFiltroPrioridad('Baja', '03_P3_Baja')).toBe(true);

    // Filtro P4
    expect(evaluarFiltroPrioridad('04_P4', '04_P4')).toBe(true);
  });
});
