import { describe, it, expect, vi } from 'vitest';
import { calcularSiguienteFechaCiclo } from '../habitosService';

describe('Motor de Hábitos y Recurrencias (habitosService)', () => {
  it('Calcula la siguiente fecha para frecuencia DIARIA sumando +1 día', () => {
    const fecha = '2026-10-16';
    const sig = calcularSiguienteFechaCiclo(fecha, 'DIARIA');
    expect(sig).toBe('2026-10-17');
  });

  it('Avanza correctamente en DIARIA_LABORAL saltando el fin de semana (Viernes -> Lunes)', () => {
    // 2026-10-16 es Viernes
    const fechaViernes = '2026-10-16';
    const sig = calcularSiguienteFechaCiclo(fechaViernes, 'DIARIA_LABORAL', 'L-V');
    expect(sig).toBe('2026-10-19'); // Lunes
  });

  it('Respeta regla textual de días personalizados (ej: Martes y Jueves)', () => {
    // 2026-10-20 es Martes
    const fechaMartes = '2026-10-20';
    const sig = calcularSiguienteFechaCiclo(fechaMartes, 'DIARIA', 'DIAS:M,J');
    expect(sig).toBe('2026-10-22'); // Jueves
  });

  it('Avanza 7 días para frecuencia SEMANAL', () => {
    const fecha = '2026-10-16';
    const sig = calcularSiguienteFechaCiclo(fecha, 'SEMANAL');
    expect(sig).toBe('2026-10-23');
  });

  it('Avanza 14 días para frecuencia QUINCENAL', () => {
    const fecha = '2026-10-16';
    const sig = calcularSiguienteFechaCiclo(fecha, 'QUINCENAL');
    expect(sig).toBe('2026-10-30');
  });

  it('Avanza 1 mes para frecuencia MENSUAL', () => {
    const fecha = '2026-10-16';
    const sig = calcularSiguienteFechaCiclo(fecha, 'MENSUAL');
    expect(sig).toBe('2026-11-16');
  });

  it('Avanza correctamente de Viernes a Lunes con tokens de 2 letras (LU,MA,MI,JU,VI) sin prefijo DIAS:', () => {
    // 2026-10-16 es Viernes
    const fechaViernes = '2026-10-16';
    const sig = calcularSiguienteFechaCiclo(fechaViernes, 'DIARIA', 'LU,MA,MI,JU,VI');
    expect(sig).toBe('2026-10-19'); // Lunes siguiente
  });

  it('Respeta tokens con prefijo DIAS: y 2 letras (DIAS:LU,VI)', () => {
    // 2026-10-16 es Viernes
    const fechaViernes = '2026-10-16';
    const sig = calcularSiguienteFechaCiclo(fechaViernes, 'DIARIA', 'DIAS:LU,VI');
    expect(sig).toBe('2026-10-19'); // Lunes siguiente
  });
});

describe('Motor de Alcance de Recurrencia (Scope-Aware Edit & Delete)', () => {
  it('eliminarActividadConAlcance SINGLE registra fecha en excepciones_fechas y avanza fecha_programada', async () => {
    const { eliminarActividadConAlcance } = await import('../habitosService');
    const { db } = await import('../../db/db');

    const mockAct = {
      id: 'test-act-1',
      user_id: 'user-1',
      codigo_legado: 'ACT-901',
      nombre_actividad: 'Meditación Matutina',
      tipo_compromiso: 'HABITUAL' as const,
      categoria_vida: 'SALUD_DEPORTE' as const,
      estado: '02_Por_Hacer' as const,
      racha_actual: 5,
      fecha_programada: '2026-10-19',
      duracion_horas: 0.5,
      agendado_calendar: 'No' as const,
      frecuencia_ciclo: 'DIARIA' as const,
      regla_repeticion: '',
      updated_at: '2026-10-19T08:00:00Z',
      version: 1,
      sync_status: 'synced' as const
    };

    let updatedFields: any = null;
    const getSpy = vi.spyOn(db.actividades_personales, 'get').mockResolvedValue(mockAct as any);
    const updateSpy = vi.spyOn(db.actividades_personales, 'update').mockImplementation((async (_id: any, changes: any) => {
      updatedFields = changes;
      return 1;
    }) as any);

    const res = await eliminarActividadConAlcance('test-act-1', 'SINGLE', '2026-10-19');
    expect(res.success).toBe(true);
    expect(res.alcanceAplicado).toBe('SINGLE');
    expect(updatedFields.excepciones_fechas).toContain('2026-10-19');
    expect(updatedFields.fecha_programada).toBe('2026-10-20');

    getSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('eliminarActividadConAlcance FUTURE fija fecha_fin y archiva si es fecha actual o anterior', async () => {
    const { eliminarActividadConAlcance } = await import('../habitosService');
    const { db } = await import('../../db/db');

    const mockAct = {
      id: 'test-act-2',
      codigo_legado: 'ACT-902',
      nombre_actividad: 'Lectura Nocturna',
      tipo_compromiso: 'HABITUAL' as const,
      categoria_vida: 'DESARROLLO_ESTUDIO' as const,
      estado: '02_Por_Hacer' as const,
      racha_actual: 3,
      fecha_programada: '2026-10-19',
      frecuencia_ciclo: 'DIARIA' as const,
      regla_repeticion: ''
    };

    let updatedFields: any = null;
    const getSpy = vi.spyOn(db.actividades_personales, 'get').mockResolvedValue(mockAct as any);
    const updateSpy = vi.spyOn(db.actividades_personales, 'update').mockImplementation((async (_id: any, changes: any) => {
      updatedFields = changes;
      return 1;
    }) as any);

    const res = await eliminarActividadConAlcance('test-act-2', 'FUTURE', '2026-10-19');
    expect(res.success).toBe(true);
    expect(res.alcanceAplicado).toBe('FUTURE');
    expect(updatedFields.fecha_fin).toBe('2026-10-18');

    getSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('eliminarActividadConAlcance ALL elimina físicamente la actividad y sus subtareas', async () => {
    const { eliminarActividadConAlcance } = await import('../habitosService');
    const { db } = await import('../../db/db');

    const mockAct = {
      id: 'test-act-3',
      codigo_legado: 'ACT-903',
      nombre_actividad: 'Gimnasio',
      tipo_compromiso: 'HABITUAL' as const,
      frecuencia_ciclo: 'DIARIA' as const
    };

    let deletedId: any = null;
    const getSpy = vi.spyOn(db.actividades_personales, 'get').mockResolvedValue(mockAct as any);
    const deleteSpy = vi.spyOn(db.actividades_personales, 'delete').mockImplementation((async (id: any) => {
      deletedId = id;
    }) as any);
    const subDeleteSpy = vi.spyOn(db.subtareas_pasos, 'where').mockReturnValue({
      equals: () => ({
        delete: vi.fn().mockResolvedValue(1)
      })
    } as any);

    const res = await eliminarActividadConAlcance('test-act-3', 'ALL', '2026-10-19');
    expect(res.success).toBe(true);
    expect(res.alcanceAplicado).toBe('ALL');
    expect(deletedId).toBe('test-act-3');

    getSpy.mockRestore();
    deleteSpy.mockRestore();
    subDeleteSpy.mockRestore();
  });

  it('editarActividadConAlcance SINGLE desacopla una instancia puntual e independiza la ocurrencia', async () => {
    const { editarActividadConAlcance } = await import('../habitosService');
    const { db } = await import('../../db/db');

    const mockAct = {
      id: 'test-act-4',
      user_id: 'user-1',
      codigo_legado: 'ACT-904',
      nombre_actividad: 'Correr 5K',
      tipo_compromiso: 'HABITUAL' as const,
      categoria_vida: 'SALUD_DEPORTE' as const,
      estado: '02_Por_Hacer' as const,
      racha_actual: 10,
      fecha_programada: '2026-10-19',
      duracion_horas: 1,
      agendado_calendar: 'No' as const,
      frecuencia_ciclo: 'DIARIA' as const,
      regla_repeticion: '',
      updated_at: '2026-10-19T07:00:00Z',
      version: 2,
      sync_status: 'synced' as const
    };

    let putMaster: any = null;
    let addedInstance: any = null;

    const putSpy = vi.spyOn(db.actividades_personales, 'put').mockImplementation((async (item: any) => {
      putMaster = item;
      return item.id;
    }) as any);
    const countSpy = vi.spyOn(db.actividades_personales, 'count').mockResolvedValue(50);
    const addSpy = vi.spyOn(db.actividades_personales, 'add').mockImplementation((async (item: any) => {
      addedInstance = item;
      return item.id;
    }) as any);

    const res = await editarActividadConAlcance(
      mockAct as any,
      { nombre_actividad: 'Correr 10K Especial' },
      'SINGLE',
      '2026-10-19'
    );

    expect(res.alcanceAplicado).toBe('SINGLE');
    expect(putMaster.excepciones_fechas).toContain('2026-10-19');
    expect(putMaster.fecha_programada).toBe('2026-10-20');
    expect(addedInstance).toBeDefined();
    expect(addedInstance.nombre_actividad).toBe('Correr 10K Especial');
    expect(addedInstance.tipo_compromiso).toBe('PUNTUAL');
    expect(addedInstance.actividad_padre_id).toBe('test-act-4');

    putSpy.mockRestore();
    countSpy.mockRestore();
    addSpy.mockRestore();
  });
});

describe('Retención Visual de Hábitos Completados Hoy y Sincronización Calendar (REQ-HAB-05 & REQ-CAL-02)', () => {
  it('completarActividadPersonalLocal persiste ultima_fecha_completado y proxima_fecha_programada al completar hábito recurrente', async () => {
    const { completarActividadPersonalLocal, formatFechaIsoLocal } = await import('../habitosService');
    const { db } = await import('../../db/db');

    const hoyStr = formatFechaIsoLocal(new Date());

    const mockAct = {
      id: 'test-act-retencion-1',
      user_id: 'user-1',
      codigo_legado: 'ACT-905',
      nombre_actividad: 'Lectura Matutina',
      tipo_compromiso: 'HABITUAL' as const,
      categoria_vida: 'DESARROLLO_ESTUDIO' as const,
      estado: '02_Por_Hacer' as const,
      racha_actual: 3,
      fecha_programada: hoyStr,
      duracion_horas: 0.5,
      agendado_calendar: 'Sí' as const,
      frecuencia_ciclo: 'DIARIA' as const,
      regla_repeticion: '',
      updated_at: '2026-10-18T08:00:00Z',
      version: 1,
      sync_status: 'synced' as const
    };

    let putItem: any = null;
    const putSpy = vi.spyOn(db.actividades_personales, 'put').mockImplementation((async (item: any) => {
      putItem = item;
      return item.id;
    }) as any);

    const res = await completarActividadPersonalLocal(mockAct as any, true);

    expect(res.actividadActualizada).toBeDefined();
    expect(res.nuevaRacha).toBe(4);
    expect(res.esRepetida).toBe(true);
    expect(putItem.ultima_fecha_completado).toBe(hoyStr);
    expect(putItem.proxima_fecha_programada).toBeDefined();
    expect(putItem.proxima_fecha_programada > hoyStr).toBe(true);
    expect(putItem.fecha_programada).toBe(putItem.proxima_fecha_programada);
    expect(putItem.estado).toBe('02_Por_Hacer');
    expect(putItem.historial_fechas).toContain(hoyStr);

    putSpy.mockRestore();
  });

  it('completarActividadPersonalLocal revierte limpiamente al desmarcar (restituye racha y limpia ultima_fecha_completado)', async () => {
    const { completarActividadPersonalLocal, formatFechaIsoLocal } = await import('../habitosService');
    const { db } = await import('../../db/db');

    const hoyStr = formatFechaIsoLocal(new Date());
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const mananaStr = formatFechaIsoLocal(manana);

    const mockActCompletada = {
      id: 'test-act-retencion-2',
      user_id: 'user-1',
      codigo_legado: 'ACT-906',
      nombre_actividad: 'Ejercicio Fuerza',
      tipo_compromiso: 'HABITUAL' as const,
      categoria_vida: 'SALUD_DEPORTE' as const,
      estado: '02_Por_Hacer' as const,
      racha_actual: 4,
      fecha_programada: mananaStr, // Fecha futura tras avance de ciclo
      ultima_fecha_completado: hoyStr,
      proxima_fecha_programada: mananaStr,
      historial_fechas: ['2026-10-18', hoyStr],
      duracion_horas: 1,
      agendado_calendar: 'No' as const,
      frecuencia_ciclo: 'DIARIA' as const,
      regla_repeticion: '',
      updated_at: '2026-10-18T08:00:00Z',
      version: 2,
      sync_status: 'synced' as const
    };

    let putItem: any = null;
    const putSpy = vi.spyOn(db.actividades_personales, 'put').mockImplementation((async (item: any) => {
      putItem = item;
      return item.id;
    }) as any);

    const res = await completarActividadPersonalLocal(mockActCompletada as any, false);

    expect(res.nuevaRacha).toBe(3);
    expect(putItem.ultima_fecha_completado).toBeUndefined();
    expect(putItem.proxima_fecha_programada).toBeUndefined();
    expect(putItem.fecha_programada).toBe(hoyStr);
    expect(putItem.estado).toBe('02_Por_Hacer');
    expect(putItem.historial_fechas).not.toContain(hoyStr);

    putSpy.mockRestore();
  });

  it('sincronizarActividadCalendar no rompe el flujo ni lanza excepciones en entorno local/offline', async () => {
    const { sincronizarActividadCalendar } = await import('../calendarSyncService');

    const mockAct = {
      id: 'test-cal-1',
      user_id: 'user-1',
      codigo_legado: 'ACT-907',
      nombre_actividad: 'Hábito con Calendar',
      tipo_compromiso: 'HABITUAL' as const,
      categoria_vida: 'LABORAL_HONORARIO' as const,
      estado: '02_Por_Hacer' as const,
      racha_actual: 1,
      fecha_programada: '2026-10-19',
      duracion_horas: 1,
      agendado_calendar: 'Sí' as const,
      version: 1,
      sync_status: 'pending' as const,
      updated_at: new Date().toISOString()
    };

    const res = await sincronizarActividadCalendar(mockAct as any, 'UPSERT');
    expect(res).toBeDefined();
    expect(typeof res.success).toBe('boolean');
  });

  it('completarActividadPersonalLocal resetea racha a 1 y avanza secuencialmente si el hábito arrastra mora sin completar ayer', async () => {
    const { completarActividadPersonalLocal } = await import('../habitosService');
    const { db } = await import('../../db/db');

    const mockActMora = {
      id: 'test-act-mora-1',
      user_id: 'user-1',
      codigo_legado: 'ACT-908',
      nombre_actividad: 'Meditación Atrasada',
      tipo_compromiso: 'HABITUAL' as const,
      categoria_vida: 'PERSONAL_DESCANSO' as const,
      estado: '02_Por_Hacer' as const,
      racha_actual: 10,
      fecha_programada: '2026-10-10', // En mora histórica
      duracion_horas: 0.5,
      agendado_calendar: 'No' as const,
      frecuencia_ciclo: 'DIARIA' as const,
      regla_repeticion: '',
      ultima_fecha_completado: '2026-10-09', // No completado ayer
      updated_at: '2026-10-10T08:00:00Z',
      version: 1,
      sync_status: 'synced' as const
    };

    let putItem: any = null;
    const putSpy = vi.spyOn(db.actividades_personales, 'put').mockImplementation((async (item: any) => {
      putItem = item;
      return item.id;
    }) as any);

    const res = await completarActividadPersonalLocal(mockActMora as any, true);

    expect(res.actividadActualizada).toBeDefined();
    expect(res.nuevaRacha).toBe(1); // Penalización de racha por discontinuidad temporal
    expect(res.esRepetida).toBe(true);
    expect(putItem.fecha_programada).toBe('2026-10-11'); // Avance secuencial paso a paso (+1 día)
    expect(putItem.proxima_fecha_programada).toBe('2026-10-11');
    expect(putItem.estado).toBe('02_Por_Hacer'); // Reabierta para continuar catch-up

    putSpy.mockRestore();
  });
});


