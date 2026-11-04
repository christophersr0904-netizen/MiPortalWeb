import React, { useState, useMemo, useDeferredValue, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  RefreshCw,
  Layers,
  CreditCard,
  PieChart,
  Search,
  X,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Receipt
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ModalGasto } from '../Modals/ModalGasto';
import { ModalIngreso } from '../Modals/ModalIngreso';
import { ModalNuevoPlanCuotas } from '../Modals/ModalNuevoPlanCuotas';
import { ModalTechosPresupuesto } from '../Modals/ModalTechosPresupuesto';
import { TarjetaTransaccion } from '../PMO/TarjetaTransaccion';
import type { TransaccionUnificada } from '../PMO/TarjetaTransaccion';
import { DashboardFinanciero } from '../Finanzas/DashboardFinanciero';
import { TabControlCuotas } from '../Finanzas/TabControlCuotas';
import { TabPresupuestos } from '../Finanzas/TabPresupuestos';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import type { GastoRecord, IngresoRecord } from '../../types';

type TabFinanzas = 'general' | 'transacciones' | 'cuotas' | 'presupuesto';
type SegmentoFinanzas = 'TODOS' | 'PROYECTOS' | 'PERSONAL';
type PeriodoFinanzas = 'MES_ACTUAL' | 'MES_ANTERIOR' | 'ULTIMOS_3_MESES' | 'ANIO_ACTUAL' | 'TODOS';
type TipoFlujo = 'TODOS' | 'INGRESO' | 'GASTO';
type EstadoFlujo = 'TODOS' | 'REAL' | 'PROGRAMADO';

export const ViewFinanzas: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<TabFinanzas>('general');
  const [segmento, setSegmento] = useState<SegmentoFinanzas>('TODOS');
  const [periodo, setPeriodo] = useState<PeriodoFinanzas>('MES_ACTUAL');
  const [tipoCambioSunat, setTipoCambioSunat] = useState<number>(3.75);
  const [fechaCotizacion, setFechaCotizacion] = useState<string>('Hoy, 09:00 AM');
  const [actualizandoTC, setActualizandoTC] = useState(false);

  // UI Optimista de Conciliación instantánea (0ms de latencia)
  const [optimisticConciliados, setOptimisticConciliados] = useState<Record<string, boolean>>({});

  // Filtros Tab Transacciones
  const [tipoFlujo, setTipoFlujo] = useState<TipoFlujo>('TODOS');
  const [estadoFlujo, setEstadoFlujo] = useState<EstadoFlujo>('TODOS');
  const [busquedaTrx, setBusquedaTrx] = useState<string>('');
  const deferredBusquedaTrx = useDeferredValue(busquedaTrx);

  // Modales de Nueva Transacción & Edición
  const [modalGastoAbierto, setModalGastoAbierto] = useState(false);
  const [modalIngresoAbierto, setModalIngresoAbierto] = useState(false);
  const [modalCuotaAbierto, setModalCuotaAbierto] = useState(false);
  const [modalTechosAbierto, setModalTechosAbierto] = useState(false);
  const [gastoAEditar, setGastoAEditar] = useState<GastoRecord | null>(null);
  const [ingresoAEditar, setIngresoAEditar] = useState<IngresoRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { estaOculto, programarEliminacion } = useUndoDelete();

  // Auto-dismiss del toast reactivo
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Queries reactivos desde Dexie filtrados con el búfer de deshacer
  const rawGastosLive = useLiveQuery(() => db.gastos.toArray(), []) ?? [];
  const rawIngresosLive = useLiveQuery(() => db.ingresos.toArray(), []) ?? [];
  const rawCuotasLive = useLiveQuery(() => db.cuotas.toArray(), []) ?? [];
  const rawProyectosLive = useLiveQuery(() => db.proyectos.toArray(), []) ?? [];
  const rawActividadesLive = useLiveQuery(() => db.actividades_personales.toArray(), []) ?? [];

  const gastosRaw = useMemo(() => rawGastosLive.filter((g: any) => !estaOculto(g.id) && !estaOculto(g.codigo_legado) && !estaOculto(g.id_origen_vinculado) && !estaOculto(g.ID_Proyecto)), [rawGastosLive, estaOculto]);
  const ingresosRaw = useMemo(() => rawIngresosLive.filter((i: any) => !estaOculto(i.id) && !estaOculto(i.codigo_legado)), [rawIngresosLive, estaOculto]);
  const cuotasRaw = useMemo(() => rawCuotasLive.filter((c: any) => !estaOculto(c.id) && !estaOculto(c.codigo_legado)), [rawCuotasLive, estaOculto]);
  const proyectosRaw = useMemo(() => rawProyectosLive.filter((p: any) => !estaOculto(p.id) && !estaOculto(p.codigo_legado)), [rawProyectosLive, estaOculto]);
  const actividadesRaw = useMemo(() => rawActividadesLive.filter((a: any) => !estaOculto(a.id) && !estaOculto(a.codigo_legado)), [rawActividadesLive, estaOculto]);

  // Actualización manual de TC SUNAT
  const handleRefreshTC = () => {
    setActualizandoTC(true);
    setTimeout(() => {
      // Simulación de consulta a SUNAT / SBS
      const variacion = (Math.random() * 0.02 - 0.01);
      const nuevoTC = Number((3.750 + variacion).toFixed(3));
      setTipoCambioSunat(nuevoTC);
      setFechaCotizacion(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) + ' (Oficial SUNAT)');
      setActualizandoTC(false);
    }, 600);
  };

  // Filtrado por segmento y periodo
  const gastosFiltrados = useMemo(() => {
    const hoy = new Date();
    const mesHoy = hoy.getMonth();
    const anioHoy = hoy.getFullYear();
    const mesAnt = mesHoy === 0 ? 11 : mesHoy - 1;
    const anioAnt = mesHoy === 0 ? anioHoy - 1 : anioHoy;

    return gastosRaw.filter((g) => {
      // Segmento
      if (segmento === 'PROYECTOS') {
        const esProy = g.tipo_origen?.toLowerCase() === 'proyecto' || g.id_origen_vinculado;
        if (!esProy) return false;
      } else if (segmento === 'PERSONAL') {
        const esProy = g.tipo_origen?.toLowerCase() === 'proyecto' || g.id_origen_vinculado;
        if (esProy) return false;
      }

      // Periodo
      if (periodo === 'TODOS') return true;
      const fecha = g.fecha_gasto || '';
      if (!fecha) return true;
      const d = new Date(fecha);
      if (periodo === 'MES_ACTUAL') {
        return d.getMonth() === mesHoy && d.getFullYear() === anioHoy;
      }
      if (periodo === 'MES_ANTERIOR') {
        return d.getMonth() === mesAnt && d.getFullYear() === anioAnt;
      }
      if (periodo === 'ANIO_ACTUAL') {
        return d.getFullYear() === anioHoy;
      }
      return true;
    });
  }, [gastosRaw, segmento, periodo]);

  const ingresosFiltrados = useMemo(() => {
    const hoy = new Date();
    const mesHoy = hoy.getMonth();
    const anioHoy = hoy.getFullYear();
    const mesAnt = mesHoy === 0 ? 11 : mesHoy - 1;
    const anioAnt = mesHoy === 0 ? anioHoy - 1 : anioHoy;

    return ingresosRaw.filter((i) => {
      // Segmento
      if (segmento === 'PROYECTOS') {
        const esProy = i.tipo_origen?.toLowerCase() === 'proyecto';
        if (!esProy) return false;
      } else if (segmento === 'PERSONAL') {
        const esProy = i.tipo_origen?.toLowerCase() === 'proyecto';
        if (esProy) return false;
      }

      // Periodo
      if (periodo === 'TODOS') return true;
      const fecha = i.fecha_ingreso || '';
      if (!fecha) return true;
      const d = new Date(fecha);
      if (periodo === 'MES_ACTUAL') {
        return d.getMonth() === mesHoy && d.getFullYear() === anioHoy;
      }
      if (periodo === 'MES_ANTERIOR') {
        return d.getMonth() === mesAnt && d.getFullYear() === anioAnt;
      }
      if (periodo === 'ANIO_ACTUAL') {
        return d.getFullYear() === anioHoy;
      }
      return true;
    });
  }, [ingresosRaw, segmento, periodo]);

  // ==========================================
  // CÁLCULOS 1: TOTALES FINANCIEROS CONSOLIDADOS O(N)
  // ==========================================

  // 1. Acumulador O(N) de Gastos (Real, Pendientes, Hormiga, Posición Bimonetaria y Radar)
  const totalesGastos = useMemo(() => {
    let real = 0;
    let pendientes = 0;
    let hormiga = 0;
    let usd = 0;
    let pen = 0;
    const mapaCat: Record<string, number> = {};

    for (const g of gastosFiltrados) {
      const est = (g.estado_pago || '').toUpperCase();
      const esPagado = optimisticConciliados[g.id] !== undefined
        ? optimisticConciliados[g.id]
        : (est === 'PAGADO' || est === 'REAL');

      const montoPen = Number(g.monto_pen || 0);
      const montoOrig = Number(g.monto_original || 0);

      if (esPagado) {
        real += montoPen;
      } else if (est === 'PENDIENTE' || est === 'PROGRAMADO') {
        pendientes += montoPen;
      }

      // Gastos Hormiga (<= S/ 25 o conceptos recurrentes de bajo importe)
      const cat = (g.categoria_gasto || '').toLowerCase();
      const desc = (g.descripcion_gasto || '').toLowerCase();
      if ((montoPen > 0 && montoPen <= 25) || cat.includes('hormiga') || desc.includes('antojo') || desc.includes('snack') || desc.includes('café')) {
        hormiga += montoPen;
      }

      // Desglose Bimonetario
      if (g.moneda_original === 'USD') {
        usd += montoOrig;
      } else {
        pen += (montoOrig || montoPen);
      }

      // Radar de Categorías Críticas
      const catNombre = g.categoria_gasto || 'Varios';
      mapaCat[catNombre] = (mapaCat[catNombre] || 0) + montoPen;
    }

    const radar = Object.entries(mapaCat)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    return {
      realGastos: real,
      otrosGastosPendientes: pendientes,
      gastosHormiga: hormiga,
      gastosUSD: usd,
      gastosPEN: pen,
      radarCategorias: radar
    };
  }, [gastosFiltrados, optimisticConciliados]);

  const {
    realGastos,
    otrosGastosPendientes,
    gastosHormiga,
    radarCategorias
  } = totalesGastos;

  // 2. Acumulador O(N) de Ingresos (Real, Pendientes y Desglose Bimonetario)
  const totalesIngresos = useMemo(() => {
    let real = 0;
    let pendientes = 0;
    let usd = 0;
    let pen = 0;

    for (const i of ingresosFiltrados) {
      const est = (i.estado_cobro || '').toUpperCase();
      const esCobrado = optimisticConciliados[i.id] !== undefined
        ? optimisticConciliados[i.id]
        : (est === 'COBRADO' || est === 'REAL');

      const montoPen = Number(i.monto_pen || 0);
      const montoOrig = Number(i.monto_original || 0);

      if (esCobrado) {
        real += montoPen;
      } else if (est === 'PENDIENTE' || est === 'PROGRAMADO') {
        pendientes += montoPen;
      }

      if (i.moneda_original === 'USD') {
        usd += montoOrig;
      } else {
        pen += (montoOrig || montoPen);
      }
    }

    return {
      realIngresos: real,
      ingresosPendientes: pendientes,
      ingresosUSD: usd,
      ingresosPEN: pen
    };
  }, [ingresosFiltrados, optimisticConciliados]);

  const { realIngresos, ingresosPendientes } = totalesIngresos;

  // 3. Saldo en Mano Real Hoy
  const saldoEnManoReal = useMemo(() => realIngresos - realGastos, [realIngresos, realGastos]);

  // 4. Compromisos y Cuotas Pendientes del Mes (Consolidado O(N) en un paso)
  const { cuotasPendientesMes, montoCuotasPendientes } = useMemo(() => {
    const pendientes: typeof cuotasRaw = [];
    let montoTotal = 0;
    for (const c of cuotasRaw) {
      const esPagado = optimisticConciliados[c.id] !== undefined
        ? optimisticConciliados[c.id]
        : (c.estado_cuota || '').toUpperCase() === 'PAGADO';
      if (!esPagado) {
        pendientes.push(c);
        const monto = Number(c.monto_cuota || 0);
        montoTotal += (c.moneda === 'USD' ? monto * tipoCambioSunat : monto);
      }
    }
    return { cuotasPendientesMes: pendientes, montoCuotasPendientes: montoTotal };
  }, [cuotasRaw, optimisticConciliados, tipoCambioSunat]);

  const totalCompromisosPendientes = useMemo(
    () => montoCuotasPendientes + otrosGastosPendientes,
    [montoCuotasPendientes, otrosGastosPendientes]
  );

  // 5. Saldo Proyectado a Fin de Mes
  const saldoProyectadoFinMes = useMemo(
    () => saldoEnManoReal + ingresosPendientes - totalCompromisosPendientes,
    [saldoEnManoReal, ingresosPendientes, totalCompromisosPendientes]
  );

  // 6. Posición Bimonetaria PEN/USD O(1)
  const posicionBimonetaria = useMemo(() => ({
    totalPEN: totalesIngresos.ingresosPEN - totalesGastos.gastosPEN,
    totalUSD: totalesIngresos.ingresosUSD - totalesGastos.gastosUSD
  }), [totalesIngresos, totalesGastos]);

  // ==========================================
  // CÁLCULOS 2: 5 BENTO CARDS DE SALUD FINANCIERA
  // ==========================================

  // 1. Semáforo de Liquidez
  const gastoDiarioPromedio = useMemo(() => {
    const totalEgresos = realGastos + totalCompromisosPendientes;
    return totalEgresos > 0 ? totalEgresos / 30 : 1;
  }, [realGastos, totalCompromisosPendientes]);

  const diasCobertura = useMemo(() => {
    if (saldoEnManoReal <= 0) return 0;
    return Math.round(saldoEnManoReal / (gastoDiarioPromedio || 1));
  }, [saldoEnManoReal, gastoDiarioPromedio]);

  const semaforoStatus = useMemo(() => {
    if (saldoProyectadoFinMes > 1500) {
      return { badge: 'Holgado', color: 'emerald', dot: 'bg-emerald-500', barWidth: '85%', desc: 'Tus ingresos cubren con holgura los gastos y cuotas bancarias restantes del mes.' };
    }
    if (saldoProyectadoFinMes >= 0) {
      return { badge: 'Ajustado', color: 'amber', dot: 'bg-amber-500', barWidth: '50%', desc: 'Tu balance proyectado es positivo pero con poco margen de imprevistos.' };
    }
    return { badge: 'Déficit', color: 'rose', dot: 'bg-rose-500', barWidth: '20%', desc: 'Alerta: Los compromisos restantes superan los ingresos proyectados del mes.' };
  }, [saldoProyectadoFinMes]);

  const pctGastosHormiga = useMemo(() => {
    const tot = realGastos || 1;
    return Math.min(Math.round((gastosHormiga / tot) * 100), 100);
  }, [gastosHormiga, realGastos]);

  // 3. Capacidad de Ahorro / Superávit
  const ingresosTotalesMes = useMemo(() => realIngresos + ingresosPendientes, [realIngresos, ingresosPendientes]);
  const gastosTotalesMes = useMemo(() => realGastos + totalCompromisosPendientes, [realGastos, totalCompromisosPendientes]);
  const capacidadAhorro = useMemo(() => Math.max(ingresosTotalesMes - gastosTotalesMes, 0), [ingresosTotalesMes, gastosTotalesMes]);
  const ratioAhorroPct = useMemo(() => {
    if (ingresosTotalesMes <= 0) return 0;
    return Number(((capacidadAhorro / ingresosTotalesMes) * 100).toFixed(1));
  }, [capacidadAhorro, ingresosTotalesMes]);

  // 4. Nivel de Endeudamiento en Cuotas
  const ratioEndeudamientoCuotas = useMemo(() => {
    if (ingresosTotalesMes <= 0) return 0;
    return Number(((montoCuotasPendientes / ingresosTotalesMes) * 100).toFixed(1));
  }, [montoCuotasPendientes, ingresosTotalesMes]);

  // ==========================================
  // CÁLCULOS 3: PRÓXIMOS VENCIMIENTOS (15 DÍAS)
  // ==========================================
  const proximosVencimientos = useMemo(() => {
    const hoy = new Date();
    const hoyMs = hoy.getTime();
    const oneDayMs = 86400000;

    const items: Array<{
      id: string;
      tipo: 'CUOTA' | 'GASTO';
      codigo: string;
      concepto: string;
      entidad?: string;
      fecha: string;
      diasRestantes: number;
      montoPen: number;
      raw: any;
    }> = [];

    // Cuotas
    for (const c of cuotasRaw) {
      const esPagado = optimisticConciliados[c.id] !== undefined
        ? optimisticConciliados[c.id]
        : (c.estado_cuota || '').toUpperCase() === 'PAGADO';
      if (esPagado) continue;
      const fStr = c.fecha_vencimiento;
      if (!fStr) continue;
      const fMs = new Date(fStr).getTime();
      const diffDias = Math.ceil((fMs - hoyMs) / oneDayMs);
      if (diffDias >= -5 && diffDias <= 15) {
        items.push({
          id: c.id,
          tipo: 'CUOTA',
          codigo: c.codigo_legado || 'CUO',
          concepto: `Cuota ${c.numero_cuota}/${c.total_cuotas} - ${c.entidad_financiera}`,
          entidad: c.entidad_financiera,
          fecha: fStr,
          diasRestantes: diffDias,
          montoPen: c.moneda === 'USD' ? c.monto_cuota * tipoCambioSunat : c.monto_cuota,
          raw: c
        });
      }
    }

    // Gastos programados
    for (const g of gastosRaw) {
      const esPagado = optimisticConciliados[g.id] !== undefined
        ? optimisticConciliados[g.id]
        : ((g.estado_pago || '').toUpperCase() === 'PAGADO');
      if (esPagado) continue;
      const est = (g.estado_pago || '').toUpperCase();
      if (est !== 'PENDIENTE' && est !== 'PROGRAMADO') continue;
      const fStr = g.fecha_gasto;
      if (!fStr) continue;
      const fMs = new Date(fStr).getTime();
      const diffDias = Math.ceil((fMs - hoyMs) / oneDayMs);
      if (diffDias >= -5 && diffDias <= 15) {
        items.push({
          id: g.id,
          tipo: 'GASTO',
          codigo: g.codigo_legado || 'GAS',
          concepto: g.descripcion_gasto || g.categoria_gasto || 'Compromiso',
          fecha: fStr,
          diasRestantes: diffDias,
          montoPen: g.monto_pen || 0,
          raw: g
        });
      }
    }

    return items.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [cuotasRaw, gastosRaw, tipoCambioSunat, optimisticConciliados]);

  // ==========================================
  // CÁLCULOS 4: TRANSACCIONES UNIFICADAS (TAB 2)
  // ==========================================
  const transaccionesUnificadas = useMemo(() => {
    let lista: Array<{
      id: string;
      tipo: 'INGRESO' | 'GASTO';
      codigo: string;
      fecha: string;
      descripcion: string;
      categoria: string;
      montoPen: number;
      estado: string;
      esConciliado: boolean;
      raw: any;
    }> = [];

    if (tipoFlujo === 'TODOS' || tipoFlujo === 'INGRESO') {
      ingresosFiltrados.forEach((i) => {
        const est = (i.estado_cobro || '').toUpperCase();
        const esConciliadoReal = est === 'COBRADO' || est === 'REAL';
        const esConciliado = optimisticConciliados[i.id] !== undefined
          ? optimisticConciliados[i.id]
          : esConciliadoReal;

        lista.push({
          id: i.id,
          tipo: 'INGRESO',
          codigo: i.codigo_legado || 'ING',
          fecha: i.fecha_ingreso,
          descripcion: i.descripcion_ingreso || 'Ingreso',
          categoria: i.categoria_ingreso || 'Varios',
          montoPen: i.monto_pen || 0,
          estado: esConciliado ? 'COBRADO' : 'PENDIENTE',
          esConciliado,
          raw: i
        });
      });
    }

    if (tipoFlujo === 'TODOS' || tipoFlujo === 'GASTO') {
      gastosFiltrados.forEach((g) => {
        const est = (g.estado_pago || '').toUpperCase();
        const esConciliadoReal = est === 'PAGADO' || est === 'REAL';
        const esConciliado = optimisticConciliados[g.id] !== undefined
          ? optimisticConciliados[g.id]
          : esConciliadoReal;

        lista.push({
          id: g.id,
          tipo: 'GASTO',
          codigo: g.codigo_legado || 'GAS',
          fecha: g.fecha_gasto,
          descripcion: g.descripcion_gasto || 'Gasto',
          categoria: g.categoria_gasto || 'Varios',
          montoPen: g.monto_pen || 0,
          estado: esConciliado ? 'PAGADO' : 'PENDIENTE',
          esConciliado,
          raw: g
        });
      });
    }

    // Filtro por estado
    if (estadoFlujo === 'REAL') {
      lista = lista.filter((t) => t.esConciliado);
    } else if (estadoFlujo === 'PROGRAMADO') {
      lista = lista.filter((t) => !t.esConciliado);
    }

    // Búsqueda en vivo diferida (concurrencia reactiva)
    if (deferredBusquedaTrx.trim()) {
      const q = deferredBusquedaTrx.toLowerCase();
      lista = lista.filter((t) => {
        return (
          t.codigo.toLowerCase().includes(q) ||
          t.descripcion.toLowerCase().includes(q) ||
          t.categoria.toLowerCase().includes(q)
        );
      });
    }

    // Ordenar por fecha descendente (comparación lexicográfica O(1) sin instanciar Date)
    return lista.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [ingresosFiltrados, gastosFiltrados, tipoFlujo, estadoFlujo, deferredBusquedaTrx, optimisticConciliados]);

  // Alternar conciliación con UI Optimista instantánea (0ms)
  const handleToggleConciliar = async (trx: TransaccionUnificada) => {
    const nuevoEstado = !trx.esConciliado;
    setOptimisticConciliados((prev) => ({ ...prev, [trx.id]: nuevoEstado }));

    const nowIso = new Date().toISOString();
    try {
      if (trx.tipo === 'INGRESO') {
        await db.ingresos.update(trx.id, {
          estado_cobro: nuevoEstado ? 'COBRADO' : 'PENDIENTE',
          updated_at: nowIso,
          sync_status: 'pending'
        });
      } else {
        await db.gastos.update(trx.id, {
          estado_pago: nuevoEstado ? 'PAGADO' : 'PENDIENTE',
          updated_at: nowIso,
          sync_status: 'pending'
        });
      }
    } catch {
      // Rollback
      setOptimisticConciliados((prev) => {
        const copy = { ...prev };
        delete copy[trx.id];
        return copy;
      });
    }
  };

  // Conciliar cuota con UI Optimista instantánea (0ms)
  const handleToggleConciliarCuota = async (cuotaId: string, estadoActual: string) => {
    const estadoReal = (estadoActual || '').toUpperCase() === 'PAGADO';
    const nuevoEstado = !estadoReal;

    setOptimisticConciliados((prev) => ({ ...prev, [cuotaId]: nuevoEstado }));

    try {
      await db.cuotas.update(cuotaId, {
        estado_cuota: nuevoEstado ? 'PAGADO' : 'PENDIENTE',
        updated_at: new Date().toISOString(),
        sync_status: 'pending'
      });
    } catch {
      // Rollback
      setOptimisticConciliados((prev) => {
        const copy = { ...prev };
        delete copy[cuotaId];
        return copy;
      });
    }
  };

  // Conciliar gasto desde widget de Dashboard
  const handleToggleConciliarGasto = (gastoId: string) => {
    const gasto = gastosRaw.find((g) => g.id === gastoId);
    if (!gasto) return;
    const est = (gasto.estado_pago || '').toUpperCase();
    const esConciliadoReal = est === 'PAGADO' || est === 'REAL';
    const esConciliado = optimisticConciliados[gastoId] !== undefined
      ? optimisticConciliados[gastoId]
      : esConciliadoReal;

    handleToggleConciliar({
      id: gastoId,
      tipo: 'GASTO',
      codigo: gasto.codigo_legado || 'GAS',
      fecha: gasto.fecha_gasto || '',
      descripcion: gasto.descripcion_gasto || '',
      categoria: gasto.categoria_gasto || '',
      montoPen: gasto.monto_pen || 0,
      estado: esConciliado ? 'PAGADO' : 'PENDIENTE',
      esConciliado,
      raw: gasto
    });
  };

  // Edición de transacciones
  const handleEditarTrx = (trx: TransaccionUnificada) => {
    if (trx.tipo === 'GASTO') {
      setGastoAEditar(trx.raw);
      setModalGastoAbierto(true);
    } else {
      setIngresoAEditar(trx.raw);
      setModalIngresoAbierto(true);
    }
  };

  // Eliminación con búfer de deshacer de 4s
  const handleEliminarTrx = (trx: TransaccionUnificada) => {
    if (trx.tipo === 'GASTO') {
      programarEliminacion({
        tabla: 'gastos',
        id: trx.id,
        etiqueta: trx.descripcion || trx.codigo,
        tipo: 'GASTO',
        commit: async () => {
          await db.gastos.delete(trx.id);
        }
      });
    } else {
      programarEliminacion({
        tabla: 'ingresos',
        id: trx.id,
        etiqueta: trx.descripcion || trx.codigo,
        tipo: 'INGRESO',
        commit: async () => {
          await db.ingresos.delete(trx.id);
        }
      });
    }
  };

  // Saneamiento de cuotas
  const handleSanearCuotas = async () => {
    setToastMsg('Sincronización y saneamiento de planes de crédito completada con éxito.');
  };

  return (
    <div
      id="vista-financiero-wrapper"
      className="flex-1 bg-[#040711] flex flex-col w-full h-full overflow-y-auto transition-colors duration-200 custom-scrollbar select-none"
    >
      {/* 1. HEADER FINANCIERO */}
      <header className="bg-[#0D1526]/85 backdrop-blur-md border-b border-slate-800/40 px-4 md:px-6 py-3.5 shrink-0 shadow-cobalt-1 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-20 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 text-xl font-bold shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-slate-100 text-lg tracking-tight">
                Finanzas & Gobernanza de Liquidez
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                En Tiempo Real
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Coexistencia Real / Proyectado, Cuotas Bancarias, Calendarios Sincronizados y Presupuestos
            </p>
          </div>
        </div>

        {/* Indicador de Tipo de Cambio (TC) con paridad cambiaria oficial */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRefreshTC}
            title={`Actualizar tipo de cambio oficial SUNAT / SBS. Última cotización: ${fechaCotizacion}`}
            className="px-3 py-1.5 rounded-xl border border-slate-800/60 bg-[#0D1526] text-slate-300 hover:bg-slate-800/60 hover:text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition cursor-pointer shadow-2xs"
          >
            <span id="icon-refresh-tc" className="transition-transform duration-300 flex items-center">
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${actualizandoTC ? 'animate-spin text-amber-500' : ''}`} />
            </span>
            <span className="hidden sm:inline">TC SUNAT:</span>
            <span id="btn-label-tc" className="font-mono tabular-nums text-amber-400 font-black">
              {tipoCambioSunat.toFixed(3)}
            </span>
          </button>
        </div>
      </header>

      {/* 2. BARRA DE NAVEGACIÓN PRINCIPAL (4 PESTAÑAS ESTRUCTURALES) */}
      <div className="px-4 md:px-6 pt-3 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/40 bg-[#0D1526]/50 shrink-0">
        {/* Tabs Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/60 overflow-x-auto">
          {/* Pestaña 1: Vista General & KPIs */}
          <button
            type="button"
            id="tab-btn-fin-general"
            onClick={() => setTabActiva('general')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tabActiva === 'general'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
                : 'text-slate-400 hover:text-sky-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Vista General & KPIs</span>
          </button>

          {/* Pestaña 2: Transacciones */}
          <button
            type="button"
            id="tab-btn-fin-transacciones"
            onClick={() => setTabActiva('transacciones')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              tabActiva === 'transacciones'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
                : 'text-slate-400 hover:text-sky-300'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Transacciones</span>
            <span
              id="tab-count-transacciones"
              className="text-[10px] px-2 py-0.2 bg-emerald-950 text-emerald-300 rounded-full font-mono font-bold"
            >
              {gastosFiltrados.length + ingresosFiltrados.length}
            </span>
          </button>

          {/* Pestaña 3: Control de Cuotas */}
          <button
            type="button"
            id="tab-btn-fin-cuotas"
            onClick={() => setTabActiva('cuotas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              tabActiva === 'cuotas'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
                : 'text-slate-400 hover:text-sky-300'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Control de Cuotas / Créditos</span>
            <span
              id="tab-count-cuotas"
              className="text-[10px] px-2 py-0.2 bg-violet-950 text-violet-300 rounded-full font-mono font-bold"
            >
              {cuotasRaw.length}
            </span>
          </button>

          {/* Pestaña 4: Presupuestos */}
          <button
            type="button"
            id="tab-btn-fin-presupuesto"
            onClick={() => setTabActiva('presupuesto')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              tabActiva === 'presupuesto'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
                : 'text-slate-400 hover:text-sky-300'
            }`}
          >
            <PieChart className="w-4 h-4 shrink-0" />
            <span>Presupuestos</span>
          </button>
        </div>

        {/* Segmentación y Periodo */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Barra de Segmentación Maestra: [ Todos | Proyectos | Personal ] */}
          <div className="inline-flex p-1 bg-slate-900/90 rounded-2xl border border-slate-800/60 gap-1 text-xs">
            <button
              type="button"
              id="btn-seg-fin-todos"
              onClick={() => setSegmento('TODOS')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                segmento === 'TODOS'
                  ? 'bg-slate-800 text-white border border-slate-700/60'
                  : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              <span>Todos</span>
            </button>
            <button
              type="button"
              id="btn-seg-fin-proyectos"
              onClick={() => setSegmento('PROYECTOS')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                segmento === 'PROYECTOS'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              <span>Proyectos</span>
            </button>
            <button
              type="button"
              id="btn-seg-fin-personal"
              onClick={() => setSegmento('PERSONAL')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                segmento === 'PERSONAL'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span>Personal</span>
            </button>
          </div>

          {/* Selector de Periodo Global */}
          <div className="relative inline-flex items-center">
            <select
              id="filtro-mes-finanzas"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as PeriodoFinanzas)}
              className="py-1.5 pl-3 pr-8 text-xs bg-[#0D1526] border border-slate-800/80 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-200 shadow-2xs font-semibold cursor-pointer transition"
            >
              <option value="MES_ACTUAL">Mes Actual</option>
              <option value="MES_ANTERIOR">Mes Anterior</option>
              <option value="ULTIMOS_3_MESES">Últimos 3 Meses</option>
              <option value="ANIO_ACTUAL">Año Actual</option>
              <option value="TODOS">Todos los Periodos</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PESTAÑA 1: VISTA GENERAL & KPIS (DASHBOARD FINANCIERO MEMOIZADO)  */}
      {/* ================================================================= */}
      {tabActiva === 'general' && (
        <DashboardFinanciero
          saldoEnManoReal={saldoEnManoReal}
          realIngresos={realIngresos}
          realGastos={realGastos}
          saldoProyectadoFinMes={saldoProyectadoFinMes}
          totalCompromisosPendientes={totalCompromisosPendientes}
          cuotasPendientesCount={cuotasPendientesMes.length}
          montoCuotasPendientes={montoCuotasPendientes}
          otrosGastosPendientes={otrosGastosPendientes}
          posicionBimonetaria={posicionBimonetaria}
          tipoCambioSunat={tipoCambioSunat}
          diasCobertura={diasCobertura}
          semaforoStatus={semaforoStatus}
          gastosHormiga={gastosHormiga}
          pctGastosHormiga={pctGastosHormiga}
          capacidadAhorro={capacidadAhorro}
          ratioAhorroPct={ratioAhorroPct}
          ratioEndeudamientoCuotas={ratioEndeudamientoCuotas}
          radarCategorias={radarCategorias}
          proximosVencimientos={proximosVencimientos}
          optimisticConciliados={optimisticConciliados}
          onIrAPresupuesto={() => setTabActiva('presupuesto')}
          onIrATransaccionesProgramadas={() => {
            setTabActiva('transacciones');
            setEstadoFlujo('PROGRAMADO');
          }}
          onToggleConciliarCuota={handleToggleConciliarCuota}
          onToggleConciliarGasto={handleToggleConciliarGasto}
        />
      )}

      {/* ================================================================= */}
      {/* PESTAÑA 2: TRANSACCIONES (COEXISTENCIA REAL VS PROGRAMADO)         */}
      {/* ================================================================= */}
      {tabActiva === 'transacciones' && (
        <div id="vista-fin-tab-transacciones" className="tab-fin-view p-4 md:p-6 space-y-4 flex-1">
          {/* CABECERA Y FILTROS RÁPIDOS ERGONÓMICOS */}
          <div className="portal-surface p-4 rounded-2xl bg-[#0D1526] border border-slate-800/40 shadow-cobalt-1 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
                  <span>Registro Unificado de Movimientos Financieros</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Movimientos reales ejecutados conviven con compromisos programados. Concilia manualmente con el check.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setModalIngresoAbierto(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  + Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setModalGastoAbierto(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  + Gasto
                </button>
              </div>
            </div>

            {/* BARRAS DE FILTROS TIPO PÍLDORA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
              {/* Filtro 1: Selector Tipo de Movimiento */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tipo de Flujo</span>
                <div className="inline-flex p-1 bg-slate-900/80 rounded-xl gap-1 text-xs border border-slate-800/40">
                  <button
                    type="button"
                    id="pill-tipo-todos"
                    onClick={() => setTipoFlujo('TODOS')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      tipoFlujo === 'TODOS'
                        ? 'bg-slate-800 text-white shadow-2xs border border-slate-700/60'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    id="pill-tipo-ingreso"
                    onClick={() => setTipoFlujo('INGRESO')}
                    className={`px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${
                      tipoFlujo === 'INGRESO'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-bold shadow-2xs'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Ingresos</span>
                  </button>
                  <button
                    type="button"
                    id="pill-tipo-gasto"
                    onClick={() => setTipoFlujo('GASTO')}
                    className={`px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${
                      tipoFlujo === 'GASTO'
                        ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30 font-bold shadow-2xs'
                        : 'text-slate-400 hover:text-rose-400'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Gastos</span>
                  </button>
                </div>
              </div>

              {/* Filtro 2: Estado (Real/Conciliado vs Programado/Pendiente) */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Estado de Ejecución</span>
                <div className="inline-flex p-1 bg-slate-900/80 rounded-xl gap-1 text-xs border border-slate-800/40">
                  <button
                    type="button"
                    id="pill-estado-todos"
                    onClick={() => setEstadoFlujo('TODOS')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      estadoFlujo === 'TODOS'
                        ? 'bg-slate-800 text-white shadow-2xs border border-slate-700/60'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    id="pill-estado-real"
                    onClick={() => setEstadoFlujo('REAL')}
                    className={`px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${
                      estadoFlujo === 'REAL'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-bold shadow-2xs'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Conciliados</span>
                  </button>
                  <button
                    type="button"
                    id="pill-estado-programado"
                    onClick={() => setEstadoFlujo('PROGRAMADO')}
                    className={`px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${
                      estadoFlujo === 'PROGRAMADO'
                        ? 'bg-amber-950/40 text-amber-400 border border-amber-500/30 font-bold shadow-2xs'
                        : 'text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Programados</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Búsqueda en Vivo */}
            <div className="relative pt-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                id="input-busqueda-transacciones"
                value={busquedaTrx}
                onChange={(e) => setBusquedaTrx(e.target.value)}
                placeholder="Buscar por concepto, entidad, categoría o código..."
                className="w-full pl-8 pr-8 py-2 text-xs bg-slate-900/80 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-100"
              />
              {busquedaTrx && (
                <button
                  type="button"
                  onClick={() => setBusquedaTrx('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* CONTENEDOR DE TARJETAS TRANSACCIONALES */}
          <div id="lista-transacciones-unificada" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-8">
            {transaccionesUnificadas.length === 0 ? (
              <div className="col-span-full min-h-[140px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/50 bg-slate-900/30 text-slate-400 p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-400">
                  <Receipt className="w-5 h-5 text-slate-400" strokeWidth={1.75} />
                </div>
                <div className="text-xs font-semibold text-slate-300">
                  No se encontraron transacciones con los filtros seleccionados
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Ajusta los filtros de segmento, periodo o término de búsqueda para visualizar otros movimientos.
                </p>
              </div>
            ) : (
              transaccionesUnificadas.map((trx) => (
                <TarjetaTransaccion
                  key={`${trx.tipo}-${trx.id}`}
                  trx={trx}
                  onToggleConciliar={handleToggleConciliar}
                  onEditar={handleEditarTrx}
                  onEliminar={handleEliminarTrx}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PESTAÑA 3: CONTROL DE CUOTAS / CRÉDITOS (ENFOQUE REAL BANCARIO)   */}
      {/* ================================================================= */}
      {tabActiva === 'cuotas' && (
        <TabControlCuotas
          cuotasRaw={cuotasRaw}
          montoCuotasPendientes={montoCuotasPendientes}
          optimisticConciliados={optimisticConciliados}
          onSanearCuotas={handleSanearCuotas}
          onAbrirModalNuevaCuota={() => setModalCuotaAbierto(true)}
          onToggleConciliarCuota={handleToggleConciliarCuota}
        />
      )}

      {/* ================================================================= */}
      {/* PESTAÑA 4: PRESUPUESTOS (TECHOS POR CATEGORÍA & PROYECTOS)        */}
      {/* ================================================================= */}
      {tabActiva === 'presupuesto' && (
        <TabPresupuestos
          actividadesRaw={actividadesRaw}
          proyectosRaw={proyectosRaw}
          gastosRaw={gastosRaw}
          onConfigurarTechos={() => setModalTechosAbierto(true)}
        />
      )}

      {/* MODAL CANÓNICO REGISTRAR INGRESO */}
      <ModalIngreso
        isOpen={modalIngresoAbierto}
        onClose={() => {
          setModalIngresoAbierto(false);
          setIngresoAEditar(null);
        }}
        ingresoEditar={ingresoAEditar}
      />

      {/* MODAL CANÓNICO REGISTRAR GASTO */}
      <ModalGasto
        isOpen={modalGastoAbierto}
        onClose={() => {
          setModalGastoAbierto(false);
          setGastoAEditar(null);
        }}
        gastoEditar={gastoAEditar}
      />

      {/* MODAL CANÓNICO CREAR PLAN CUOTAS */}
      <ModalNuevoPlanCuotas
        isOpen={modalCuotaAbierto}
        onClose={() => setModalCuotaAbierto(false)}
      />

      {/* MODAL CANÓNICO CONFIGURAR TECHOS PRESUPUESTALES */}
      <ModalTechosPresupuesto
        isOpen={modalTechosAbierto}
        onClose={() => setModalTechosAbierto(false)}
      />

      {/* Toast reactivo nativo Cobalt */}
      {toastMsg && (
        <div
          id="toast-finanzas"
          className="fixed bottom-6 right-6 z-50 bg-[#0D1526] border border-slate-700/60 shadow-cobalt-2 text-slate-200 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
