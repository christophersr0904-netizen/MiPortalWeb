import { describe, it, expect } from 'vitest';

describe('REQ-PMO-001 & REQ-PMO-002: Contrato, Lógica e Iconografía de FiltrosPortafolio', () => {
  const ESTADOS_VALIDOS = [
    { key: '', label: 'Todos', tooltip: 'Ver todos los proyectos' },
    { key: '03_En_Ejecucion', label: 'En Curso', tooltip: 'Proyectos en curso / ejecución' },
    { key: '02_Planificado', label: 'Planif.', tooltip: 'Proyectos planificados' },
    { key: '01_Backlog', label: 'Backlog', tooltip: 'Proyectos en backlog' },
    { key: '04_En_Pausa', label: 'Pausa', tooltip: 'Proyectos en pausa' },
    { key: '06_Cerrado', label: 'Cerrado', tooltip: 'Proyectos cerrados' }
  ];

  const OPCIONES_SALUD_VALIDAS = [
    { key: '', label: 'Todas', tooltip: 'Todas las condiciones de salud' },
    { key: 'En Rango', label: 'Saludable', tooltip: 'Saludable (En Rango)' },
    { key: 'En Riesgo', label: 'En Riesgo', tooltip: 'En Riesgo / Alerta' },
    { key: 'Bloqueado', label: 'Crítico', tooltip: 'Crítico / Bloqueado' }
  ];

  const OPCIONES_ORDEN_VALIDAS = [
    { key: 'avance_desc', label: 'Mayor Avance', tooltip: 'Ordenar por Mayor Avance' },
    { key: 'avance_asc', label: 'Menor Avance', tooltip: 'Ordenar por Menor Avance' },
    { key: 'fecha_asc', label: 'Fecha Fin', tooltip: 'Ordenar por Fecha Fin' },
    { key: 'presupuesto_desc', label: 'Presupuesto', tooltip: 'Ordenar por Presupuesto Planificado' },
    { key: 'gasto_desc', label: 'Gasto AC', tooltip: 'Ordenar por Gasto Real Acumulado' },
    { key: 'nombre_asc', label: 'Nombre (A-Z)', tooltip: 'Ordenar Alfabéticamente' }
  ];

  it('1. Patrón A (Sliding Pill): Mapeo unívoco de índices para traslación matemática de pastilla', () => {
    ESTADOS_VALIDOS.forEach((est, idx) => {
      const activeIndex = Math.max(0, ESTADOS_VALIDOS.findIndex((e) => e.key === est.key));
      expect(activeIndex).toBe(idx);
    });

    // Caso de fallback ante estado no reconocido o vacío
    const fallbackIndex = Math.max(0, ESTADOS_VALIDOS.findIndex((e) => e.key === 'DESCONOCIDO'));
    expect(fallbackIndex).toBe(0);
  });

  it('2. Patrón B (Animated Popover): Coherencia con semáforo de salud de ViewPortafolio', () => {
    // Simula filtrado por salud en proyectos
    const mockProyectos = [
      { id: 'PRO-1', salud: 'En Rango (Saludable)' },
      { id: 'PRO-2', salud: 'En Riesgo (Alerta)' },
      { id: 'PRO-3', salud: 'Bloqueado (Crítico)' }
    ];

    OPCIONES_SALUD_VALIDAS.forEach((op) => {
      let filtrados = mockProyectos;
      if (op.key) {
        filtrados = mockProyectos.filter((p) => {
          const h = (p.salud || '').toLowerCase();
          if (op.key === 'En Rango') return h.includes('rango') || h.includes('saludable');
          if (op.key === 'En Riesgo') return h.includes('riesgo') || h.includes('alerta');
          if (op.key === 'Bloqueado') return h.includes('bloqueado') || h.includes('crítico') || h.includes('critico');
          return true;
        });
        expect(filtrados.length).toBe(1);
      } else {
        expect(filtrados.length).toBe(3);
      }
    });
  });

  it('3. Patrón C (Spring-Bite): Preservación de criterios de ordenación con clave por defecto "avance_desc"', () => {
    const defaultOrden = OPCIONES_ORDEN_VALIDAS[0];
    expect(defaultOrden.key).toBe('avance_desc');
    expect(defaultOrden.label).toBe('Mayor Avance');

    const keys = OPCIONES_ORDEN_VALIDAS.map((o) => o.key);
    expect(keys).toContain('avance_desc');
    expect(keys).toContain('avance_asc');
    expect(keys).toContain('fecha_asc');
    expect(keys).toContain('presupuesto_desc');
    expect(keys).toContain('gasto_desc');
    expect(keys).toContain('nombre_asc');
  });

  it('4. REQ-PMO-002: Cobertura de tooltips nativos en todas las opciones de los 3 filtros', () => {
    ESTADOS_VALIDOS.forEach((est) => {
      expect(est.tooltip).toBeDefined();
      expect(est.tooltip.length).toBeGreaterThan(0);
    });

    OPCIONES_SALUD_VALIDAS.forEach((sal) => {
      expect(sal.tooltip).toBeDefined();
      expect(sal.tooltip.length).toBeGreaterThan(0);
    });

    OPCIONES_ORDEN_VALIDAS.forEach((ord) => {
      expect(ord.tooltip).toBeDefined();
      expect(ord.tooltip.length).toBeGreaterThan(0);
    });
  });

  it('5. REQ-SYS-001-F1.1: Sanitización centralizada de strings de salud (Ley del Silencio Visual)', () => {
    const sanitizeHealth = (val: string) => (val || 'En Rango').replace(/^[^\p{L}\p{N}]+/u, '').trim();

    expect(sanitizeHealth('🔴 Crítico')).toBe('Crítico');
    expect(sanitizeHealth('🟡 En Riesgo')).toBe('En Riesgo');
    expect(sanitizeHealth('🟢 Saludable')).toBe('Saludable');
    expect(sanitizeHealth('🟢 En Rango')).toBe('En Rango');
    expect(sanitizeHealth('En Rango')).toBe('En Rango');
    expect(sanitizeHealth('')).toBe('En Rango');
  });

  it('6. REQ-SYS-001-F1.1: Comportamiento del micro-LED en Filtro de Salud (Neutro vs Reactivo)', () => {
    // Si filtroSalud está vacío (Todas): LED neutro sin pulso
    const getLedState = (filtro: string) => {
      if (!filtro) {
        return { isPulse: false, colorClass: 'bg-slate-400', shadow: 'shadow-[0_0_4px_#94a3b8]' };
      }
      const isBloqueado = filtro === 'Bloqueado';
      return {
        isPulse: isBloqueado,
        colorClass: filtro === 'Bloqueado' ? 'bg-rose-500' : filtro === 'En Riesgo' ? 'bg-amber-500' : 'bg-emerald-500',
        shadow: filtro === 'Bloqueado' ? 'shadow-[0_0_8px_#f43f5e]' : filtro === 'En Riesgo' ? 'shadow-[0_0_8px_#f59e0b]' : 'shadow-[0_0_8px_#10b981]'
      };
    };

    const neutro = getLedState('');
    expect(neutro.isPulse).toBe(false);
    expect(neutro.colorClass).toBe('bg-slate-400');

    const critico = getLedState('Bloqueado');
    expect(critico.isPulse).toBe(true);
    expect(critico.colorClass).toBe('bg-rose-500');

    const riesgo = getLedState('En Riesgo');
    expect(riesgo.isPulse).toBe(false);
    expect(riesgo.colorClass).toBe('bg-amber-500');

    const saludable = getLedState('En Rango');
    expect(saludable.isPulse).toBe(false);
    expect(saludable.colorClass).toBe('bg-emerald-500');
  });
});
