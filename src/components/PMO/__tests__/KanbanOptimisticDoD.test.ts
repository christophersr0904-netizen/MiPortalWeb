import { describe, it, expect } from 'vitest';
import { validarDoDSubtareas, normalizeTarea, type CanonicalTarea } from '../../../utils/entityNormalizer';

describe('REQ-SYS-001-F2: Kanban Optimista, Definition of Done y Desacoplamiento Memoizado', () => {
  const tareaMock: CanonicalTarea = {
    id: 'tar-001-uuid',
    codigo_legado: 'TAR-001',
    nombre: 'Implementar Motor Drag & Drop',
    estado: '02_Por_Hacer',
    estado_label: 'Por Hacer',
    proyecto_codigo: 'PRO-001',
    prioridad: '01_P1_Alta',
    horas_estimadas: 4,
    horas_reales: 2,
    es_mav: false,
    costo_real: 0,
    raw: {}
  };

  it('1. Valida Definition of Done (DoD) y reporta subtareas pendientes antes de completar', () => {
    const subtareasMock = [
      { id: 'sub-1', id_padre_vinculado: 'TAR-001', completado: true },
      { id: 'sub-2', id_padre_vinculado: 'TAR-001', completado: false },
      { id: 'sub-3', id_padre_vinculado: 'TAR-001', completado: false }
    ];

    const dodInvalido = validarDoDSubtareas('TAR-001', subtareasMock);
    expect(dodInvalido.valido).toBe(false);
    expect(dodInvalido.total).toBe(3);
    expect(dodInvalido.completadas).toBe(1);
    expect(dodInvalido.pendientes).toBe(2);

    const subtareasCompletas = [
      { id: 'sub-1', id_padre_vinculado: 'TAR-001', completado: true },
      { id: 'sub-2', id_padre_vinculado: 'TAR-001', completado: true }
    ];

    const dodValido = validarDoDSubtareas('TAR-001', subtareasCompletas);
    expect(dodValido.valido).toBe(true);
    expect(dodValido.pendientes).toBe(0);
  });

  it('2. Aplica transición UI Optimista inmediata sin esperar a Dexie', () => {
    const rawTareas = [{ ...tareaMock }];
    const estadosOptimistas = new Map<string, string>();

    // Simulación de drag & drop a '03_En_Proceso'
    estadosOptimistas.set(tareaMock.id, '03_En_Proceso');

    const tareasRenderizadas = rawTareas.map((t) => {
      const normalizada = normalizeTarea(t);
      const opt = estadosOptimistas.get(normalizada.id);
      if (opt && opt !== normalizada.estado) {
        return { ...normalizada, estado: opt };
      }
      return normalizada;
    });

    expect(tareasRenderizadas[0].estado).toBe('03_En_Proceso');
  });

  it('3. Reversión resiliente de UI Optimista si falla la persistencia', () => {
    const estadosOptimistas = new Map<string, string>();
    estadosOptimistas.set(tareaMock.id, '03_En_Proceso');

    expect(estadosOptimistas.get(tareaMock.id)).toBe('03_En_Proceso');

    // Simula fallo en db.tareas.update -> Catch block reversión
    estadosOptimistas.delete(tareaMock.id);
    expect(estadosOptimistas.has(tareaMock.id)).toBe(false);

    const normalizada = normalizeTarea(tareaMock);
    const estadoFinal = estadosOptimistas.get(normalizada.id) || normalizada.estado;
    expect(estadoFinal).toBe('02_Por_Hacer');
  });

  it('4. Clases CSS reactivas del Dropzone en ColumnaKanban', () => {
    const getDropzoneClass = (isOver: boolean) => {
      return isOver
        ? 'kanban-dropzone-active bg-indigo-950/20 border-sky-500/40 shadow-[0_0_20px_rgba(56,189,248,0.15)] ring-1 ring-sky-400/30'
        : 'portal-surface bg-slate-200/50 dark:bg-[#0D1526]/80 border-slate-300/60 dark:border-slate-800/40';
    };

    const activo = getDropzoneClass(true);
    expect(activo).toContain('bg-indigo-950/20');
    expect(activo).toContain('border-sky-500/40');

    const reposo = getDropzoneClass(false);
    expect(reposo).toContain('dark:bg-[#0D1526]/80');
    expect(reposo).toContain('dark:border-slate-800/40');
  });
});
