import { describe, it, expect } from 'vitest';
import {
  obtenerIdentificadoresWbs,
  resolverSiguienteTareaFoco,
  formatearTiempoInvertido
} from '../cockpitUiHelpers';
import type { DailyScheduleItem } from '../../../hooks/useDailySchedule';

function crearItemMock(overrides: Partial<DailyScheduleItem> = {}): DailyScheduleItem {
  return {
    id: 'tar-1',
    tipo: 'TAREA',
    codigoLegado: 'TAR-014',
    titulo: 'Implementar tablero',
    subtitulo: 'TAR-014 · PRO-002',
    fecha: '2026-11-11',
    horaInicio: '09:00',
    horaFin: '10:00',
    duracionMinutos: 60,
    completado: false,
    proyectoCodigo: 'PRO-002',
    estadoRitmo: 'PROXIMO_EN_ESPERA',
    raw: {
      id: 'tar-1',
      user_id: 'u1',
      codigo_legado: 'TAR-014',
      proyecto_codigo: 'PRO-002',
      hito_codigo: 'HIT-003',
      nombre_tarea_actividad: 'Implementar tablero',
      estado_tarea: '02_Por_Hacer',
      updated_at: '2026-11-11T00:00:00Z',
      sync_status: 'synced'
    },
    ...overrides
  };
}

describe('REQ-UI-33: Helpers ergonómicos y WBS del Daily Cockpit', () => {
  it('extrae jerarquía WBS completa TAR-XXX · HIT-XXX · PRO-XXX omitiendo UUIDs crudos', () => {
    const itemCompleto = crearItemMock();
    expect(obtenerIdentificadoresWbs(itemCompleto)).toEqual({
      codigo: 'TAR-014',
      hito: 'HIT-003',
      proyecto: 'PRO-002',
      textoLinea: 'TAR-014 · HIT-003 · PRO-002'
    });

    const itemSinHito = crearItemMock({
      raw: {
        id: 'tar-2',
        user_id: 'u1',
        codigo_legado: 'TAR-015',
        proyecto_codigo: 'PRO-005',
        hito_codigo: '123e4567-e89b-12d3-a456-426614174000',
        nombre_tarea_actividad: 'Revisar métricas',
        estado_tarea: '02_Por_Hacer',
        updated_at: '2026-11-11T00:00:00Z',
        sync_status: 'synced'
      },
      codigoLegado: 'TAR-015',
      proyectoCodigo: 'PRO-005'
    });
    expect(obtenerIdentificadoresWbs(itemSinHito).textoLinea).toBe('TAR-015 · PRO-005');
  });

  it('alterna cíclicamente entre tareas pendientes en modo foco', () => {
    const p1 = crearItemMock({ id: 't1', codigoLegado: 'TAR-001' });
    const p2 = crearItemMock({ id: 't2', codigoLegado: 'TAR-002' });
    const p3 = crearItemMock({ id: 't3', codigoLegado: 'TAR-003' });

    expect(resolverSiguienteTareaFoco([p1, p2, p3], null)?.id).toBe('t1');
    expect(resolverSiguienteTareaFoco([p1, p2, p3], 't1')?.id).toBe('t2');
    expect(resolverSiguienteTareaFoco([p1, p2, p3], 't3')?.id).toBe('t1');
    expect(resolverSiguienteTareaFoco([], 't1')).toBeNull();
  });

  it('formatea tiempo invertido en minutos y horas legibles para métricas tabulares', () => {
    expect(formatearTiempoInvertido(0)).toBe('0m');
    expect(formatearTiempoInvertido(45)).toBe('45m');
    expect(formatearTiempoInvertido(60)).toBe('1h');
    expect(formatearTiempoInvertido(135)).toBe('2h 15m');
  });
});

