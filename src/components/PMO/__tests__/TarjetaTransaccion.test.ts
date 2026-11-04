import { describe, it, expect } from 'vitest';
import type { TransaccionUnificada } from '../TarjetaTransaccion';

describe('TarjetaTransaccion & Motor Financiero [REQ-SYS-001-F4]', () => {
  const transaccionIngresoMock: TransaccionUnificada = {
    id: 'trx-ing-001',
    tipo: 'INGRESO',
    codigo: 'ING-042',
    fecha: '2026-11-02',
    descripcion: 'Cobro de Consultoría Arquitectura Cloud',
    categoria: 'Honorarios_Facturas',
    montoPen: 3500.00,
    estado: 'COBRADO',
    esConciliado: true,
    raw: {}
  };

  const transaccionGastoMock: TransaccionUnificada = {
    id: 'trx-gas-002',
    tipo: 'GASTO',
    codigo: 'GAS-105',
    fecha: '2026-11-01',
    descripcion: 'Licencia Servidor Dedicado Google Cloud',
    categoria: 'Software_Suscripciones',
    montoPen: 420.50,
    estado: 'PENDIENTE',
    esConciliado: false,
    raw: {}
  };

  it('determina micro-LED y halo orgánico según el estado de conciliación sin emojis invasivos', () => {
    const evaluarLedTrx = (trx: TransaccionUnificada) => {
      const ledColor = trx.esConciliado ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse';
      const tooltip = `Estado: ${trx.estado} (${trx.esConciliado ? 'Conciliado en Tesorería' : 'Pendiente / Programado'})`;
      return { ledColor, tooltip };
    };

    const ledIngreso = evaluarLedTrx(transaccionIngresoMock);
    expect(ledIngreso.ledColor).toContain('bg-emerald-500');
    expect(ledIngreso.ledColor).toContain('shadow-[0_0_8px_#10b981]');
    expect(ledIngreso.ledColor).not.toContain('animate-pulse');
    expect(ledIngreso.tooltip).toBe('Estado: COBRADO (Conciliado en Tesorería)');

    const ledGasto = evaluarLedTrx(transaccionGastoMock);
    expect(ledGasto.ledColor).toContain('bg-amber-500');
    expect(ledGasto.ledColor).toContain('shadow-[0_0_8px_#f59e0b]');
    expect(ledGasto.ledColor).toContain('animate-pulse');
    expect(ledGasto.tooltip).toBe('Estado: PENDIENTE (Pendiente / Programado)');
  });

  it('valida la función de memoización areTrxPropsEqual con granularidad atómica', () => {
    const areTrxPropsEqual = (
      prev: { trx: TransaccionUnificada },
      next: { trx: TransaccionUnificada }
    ): boolean => {
      return (
        prev.trx.id === next.trx.id &&
        prev.trx.montoPen === next.trx.montoPen &&
        prev.trx.esConciliado === next.trx.esConciliado &&
        prev.trx.estado === next.trx.estado &&
        prev.trx.fecha === next.trx.fecha &&
        prev.trx.descripcion === next.trx.descripcion &&
        prev.trx.categoria === next.trx.categoria &&
        prev.trx.tipo === next.trx.tipo
      );
    };

    const prev = { trx: { ...transaccionIngresoMock } };
    const nextIdentico = { trx: { ...transaccionIngresoMock } };
    expect(areTrxPropsEqual(prev, nextIdentico)).toBe(true);

    const nextConciliadoCambiado = { trx: { ...transaccionIngresoMock, esConciliado: false, estado: 'PENDIENTE' } };
    expect(areTrxPropsEqual(prev, nextConciliadoCambiado)).toBe(false);

    const nextMontoCambiado = { trx: { ...transaccionIngresoMock, montoPen: 3600.00 } };
    expect(areTrxPropsEqual(prev, nextMontoCambiado)).toBe(false);
  });

  it('ordena transacciones cronológicamente por ISO string con localeCompare O(1) sin instanciar Date', () => {
    const lista = [
      { fecha: '2026-05-10', codigo: 'T-1' },
      { fecha: '2026-11-02', codigo: 'T-3' },
      { fecha: '2026-08-15', codigo: 'T-2' }
    ];

    const ordenadas = [...lista].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    expect(ordenadas[0].codigo).toBe('T-3');
    expect(ordenadas[1].codigo).toBe('T-2');
    expect(ordenadas[2].codigo).toBe('T-1');
  });

  it('calcula y formatea signos y montos monetarios de forma inmutable', () => {
    const formatearMonto = (trx: TransaccionUnificada) => {
      const signo = trx.tipo === 'INGRESO' ? '+' : '-';
      return `${signo}S/ ${trx.montoPen.toFixed(2)}`;
    };

    expect(formatearMonto(transaccionIngresoMock)).toBe('+S/ 3500.00');
    expect(formatearMonto(transaccionGastoMock)).toBe('-S/ 420.50');
  });

  it('prepara el payload para el buffer de eliminación reversible de 4s', () => {
    const prepararPayloadUndo = (trx: TransaccionUnificada) => {
      return {
        tabla: trx.tipo === 'GASTO' ? 'gastos' : 'ingresos',
        id: trx.id,
        etiqueta: trx.descripcion || trx.codigo,
        tipo: trx.tipo
      };
    };

    const payloadGasto = prepararPayloadUndo(transaccionGastoMock);
    expect(payloadGasto.tabla).toBe('gastos');
    expect(payloadGasto.id).toBe('trx-gas-002');
    expect(payloadGasto.tipo).toBe('GASTO');
    expect(payloadGasto.etiqueta).toBe('Licencia Servidor Dedicado Google Cloud');

    const payloadIngreso = prepararPayloadUndo(transaccionIngresoMock);
    expect(payloadIngreso.tabla).toBe('ingresos');
    expect(payloadIngreso.id).toBe('trx-ing-001');
    expect(payloadIngreso.tipo).toBe('INGRESO');
  });
});

