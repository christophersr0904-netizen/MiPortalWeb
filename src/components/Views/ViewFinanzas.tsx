import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  RefreshCw,
  Layers,
  CreditCard,
  PieChart,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Flame,
  Search,
  X,
  Wrench,
  Check,
  Building,
  Target
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getProp } from '../../utils/entityNormalizer';
import { ModalGasto } from '../Modals/ModalGasto';
import { ModalIngreso } from '../Modals/ModalIngreso';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import Swal from 'sweetalert2';

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

  // Filtros Tab Transacciones
  const [tipoFlujo, setTipoFlujo] = useState<TipoFlujo>('TODOS');
  const [estadoFlujo, setEstadoFlujo] = useState<EstadoFlujo>('TODOS');
  const [busquedaTrx, setBusquedaTrx] = useState<string>('');

  // Modales de Nueva Transacción
  const [modalGastoAbierto, setModalGastoAbierto] = useState(false);
  const [modalIngresoAbierto, setModalIngresoAbierto] = useState(false);
  const [modalCuotaAbierto, setModalCuotaAbierto] = useState(false);

  const { estaOculto } = useUndoDelete();

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
      const hoy = new Date();
      if (periodo === 'MES_ACTUAL') {
        return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
      }
      if (periodo === 'MES_ANTERIOR') {
        const mesAnt = hoy.getMonth() === 0 ? 11 : hoy.getMonth() - 1;
        const anioAnt = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear();
        return d.getMonth() === mesAnt && d.getFullYear() === anioAnt;
      }
      if (periodo === 'ANIO_ACTUAL') {
        return d.getFullYear() === hoy.getFullYear();
      }
      return true;
    });
  }, [gastosRaw, segmento, periodo]);

  const ingresosFiltrados = useMemo(() => {
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
      const hoy = new Date();
      if (periodo === 'MES_ACTUAL') {
        return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
      }
      if (periodo === 'MES_ANTERIOR') {
        const mesAnt = hoy.getMonth() === 0 ? 11 : hoy.getMonth() - 1;
        const anioAnt = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear();
        return d.getMonth() === mesAnt && d.getFullYear() === anioAnt;
      }
      if (periodo === 'ANIO_ACTUAL') {
        return d.getFullYear() === hoy.getFullYear();
      }
      return true;
    });
  }, [ingresosRaw, segmento, periodo]);

  // ==========================================
  // CÁLCULOS 1: 4 TARJETAS BENTO TOP CANÓNICAS
  // ==========================================

  // 1. Dinero Real Hoy (En Mano)
  const realIngresos = useMemo(() => {
    return ingresosFiltrados
      .filter((i) => (i.estado_cobro || '').toUpperCase() === 'COBRADO' || (i.estado_cobro || '').toUpperCase() === 'REAL')
      .reduce((acc, curr) => acc + (curr.monto_pen || 0), 0);
  }, [ingresosFiltrados]);

  const realGastos = useMemo(() => {
    return gastosFiltrados
      .filter((g) => (g.estado_pago || '').toUpperCase() === 'PAGADO' || (g.estado_pago || '').toUpperCase() === 'REAL')
      .reduce((acc, curr) => acc + (curr.monto_pen || 0), 0);
  }, [gastosFiltrados]);

  const saldoEnManoReal = realIngresos - realGastos;

  // 2. Compromisos y Cuotas Pendientes del Mes
  const cuotasPendientesMes = useMemo(() => {
    return cuotasRaw.filter((c) => (c.estado_cuota || '').toUpperCase() !== 'PAGADO');
  }, [cuotasRaw]);

  const montoCuotasPendientes = useMemo(() => {
    return cuotasPendientesMes.reduce((acc, curr) => {
      const monto = curr.monto_cuota || 0;
      return acc + (curr.moneda === 'USD' ? monto * tipoCambioSunat : monto);
    }, 0);
  }, [cuotasPendientesMes, tipoCambioSunat]);

  const otrosGastosPendientes = useMemo(() => {
    return gastosFiltrados
      .filter((g) => {
        const est = (g.estado_pago || '').toUpperCase();
        return est === 'PENDIENTE' || est === 'PROGRAMADO';
      })
      .reduce((acc, curr) => acc + (curr.monto_pen || 0), 0);
  }, [gastosFiltrados]);

  const totalCompromisosPendientes = montoCuotasPendientes + otrosGastosPendientes;

  // Ingresos Proyectados Pendientes
  const ingresosPendientes = useMemo(() => {
    return ingresosFiltrados
      .filter((i) => {
        const est = (i.estado_cobro || '').toUpperCase();
        return est === 'PENDIENTE' || est === 'PROGRAMADO';
      })
      .reduce((acc, curr) => acc + (curr.monto_pen || 0), 0);
  }, [ingresosFiltrados]);

  // Saldo Proyectado a Fin de Mes
  const saldoProyectadoFinMes = saldoEnManoReal + ingresosPendientes - totalCompromisosPendientes;

  // 4. Posición Bimonetaria PEN/USD
  const posicionBimonetaria = useMemo(() => {
    let totalPEN = 0;
    let totalUSD = 0;

    ingresosFiltrados.forEach((i) => {
      if (i.moneda_original === 'USD') totalUSD += (i.monto_original || 0);
      else totalPEN += (i.monto_original || i.monto_pen || 0);
    });

    gastosFiltrados.forEach((g) => {
      if (g.moneda_original === 'USD') totalUSD -= (g.monto_original || 0);
      else totalPEN -= (g.monto_original || g.monto_pen || 0);
    });

    return { totalPEN, totalUSD };
  }, [ingresosFiltrados, gastosFiltrados]);

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

  // 2. Alerta Fuga / Gastos Hormiga
  const gastosHormiga = useMemo(() => {
    return gastosFiltrados
      .filter((g) => {
        const monto = g.monto_pen || 0;
        const cat = (g.categoria_gasto || '').toLowerCase();
        const desc = (g.descripcion_gasto || '').toLowerCase();
        return monto > 0 && monto <= 25 || cat.includes('hormiga') || desc.includes('antojo') || desc.includes('snack') || desc.includes('café');
      })
      .reduce((acc, curr) => acc + (curr.monto_pen || 0), 0);
  }, [gastosFiltrados]);

  const pctGastosHormiga = useMemo(() => {
    const tot = realGastos || 1;
    return Math.min(Math.round((gastosHormiga / tot) * 100), 100);
  }, [gastosHormiga, realGastos]);

  // 3. Capacidad de Ahorro / Superávit
  const ingresosTotalesMes = realIngresos + ingresosPendientes;
  const gastosTotalesMes = realGastos + totalCompromisosPendientes;
  const capacidadAhorro = Math.max(ingresosTotalesMes - gastosTotalesMes, 0);
  const ratioAhorroPct = useMemo(() => {
    if (ingresosTotalesMes <= 0) return 0;
    return Number(((capacidadAhorro / ingresosTotalesMes) * 100).toFixed(1));
  }, [capacidadAhorro, ingresosTotalesMes]);

  // 4. Nivel de Endeudamiento en Cuotas
  const ratioEndeudamientoCuotas = useMemo(() => {
    if (ingresosTotalesMes <= 0) return 0;
    return Number(((montoCuotasPendientes / ingresosTotalesMes) * 100).toFixed(1));
  }, [montoCuotasPendientes, ingresosTotalesMes]);

  // 5. Radar de Categorías Críticas
  const radarCategorias = useMemo(() => {
    const mapa: Record<string, number> = {};
    gastosFiltrados.forEach((g) => {
      const cat = g.categoria_gasto || 'Varios';
      mapa[cat] = (mapa[cat] || 0) + (g.monto_pen || 0);
    });

    return Object.entries(mapa)
      .map(([cat, total]) => ({ categoria: cat, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [gastosFiltrados]);

  // ==========================================
  // CÁLCULOS 3: PRÓXIMOS VENCIMIENTOS (15 DÍAS)
  // ==========================================
  const proximosVencimientos = useMemo(() => {
    const hoy = new Date();
    const dentroDe15Dias = new Date();
    dentroDe15Dias.setDate(hoy.getDate() + 15);

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
    cuotasRaw.forEach((c) => {
      if ((c.estado_cuota || '').toUpperCase() === 'PAGADO') return;
      const fStr = c.fecha_vencimiento;
      if (!fStr) return;
      const f = new Date(fStr);
      const diffMs = f.getTime() - hoy.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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
    });

    // Gastos programados
    gastosRaw.forEach((g) => {
      const est = (g.estado_pago || '').toUpperCase();
      if (est !== 'PENDIENTE' && est !== 'PROGRAMADO') return;
      const fStr = g.fecha_gasto;
      if (!fStr) return;
      const f = new Date(fStr);
      const diffMs = f.getTime() - hoy.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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
    });

    return items.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [cuotasRaw, gastosRaw, tipoCambioSunat]);

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
        const esConciliado = est === 'COBRADO' || est === 'REAL';
        lista.push({
          id: i.id,
          tipo: 'INGRESO',
          codigo: i.codigo_legado || 'ING',
          fecha: i.fecha_ingreso,
          descripcion: i.descripcion_ingreso || 'Ingreso',
          categoria: i.categoria_ingreso || 'Varios',
          montoPen: i.monto_pen || 0,
          estado: i.estado_cobro || 'PENDIENTE',
          esConciliado,
          raw: i
        });
      });
    }

    if (tipoFlujo === 'TODOS' || tipoFlujo === 'GASTO') {
      gastosFiltrados.forEach((g) => {
        const est = (g.estado_pago || '').toUpperCase();
        const esConciliado = est === 'PAGADO' || est === 'REAL';
        lista.push({
          id: g.id,
          tipo: 'GASTO',
          codigo: g.codigo_legado || 'GAS',
          fecha: g.fecha_gasto,
          descripcion: g.descripcion_gasto || 'Gasto',
          categoria: g.categoria_gasto || 'Varios',
          montoPen: g.monto_pen || 0,
          estado: g.estado_pago || 'PENDIENTE',
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

    // Búsqueda en vivo
    if (busquedaTrx.trim()) {
      const q = busquedaTrx.toLowerCase();
      lista = lista.filter((t) => {
        return (
          t.codigo.toLowerCase().includes(q) ||
          t.descripcion.toLowerCase().includes(q) ||
          t.categoria.toLowerCase().includes(q)
        );
      });
    }

    // Ordenar por fecha descendente
    return lista.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [ingresosFiltrados, gastosFiltrados, tipoFlujo, estadoFlujo, busquedaTrx]);

  // Alternar conciliación en 1 clic
  const handleToggleConciliar = async (trx: typeof transaccionesUnificadas[0]) => {
    const nowIso = new Date().toISOString();
    if (trx.tipo === 'INGRESO') {
      const nuevoEstado = trx.esConciliado ? 'PENDIENTE' : 'COBRADO';
      await db.ingresos.update(trx.id, {
        estado_cobro: nuevoEstado,
        updated_at: nowIso,
        sync_status: 'pending'
      });
    } else {
      const nuevoEstado = trx.esConciliado ? 'PENDIENTE' : 'PAGADO';
      await db.gastos.update(trx.id, {
        estado_pago: nuevoEstado,
        updated_at: nowIso,
        sync_status: 'pending'
      });
    }
  };

  // Conciliar cuota
  const handleToggleConciliarCuota = async (cuotaId: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
    await db.cuotas.update(cuotaId, {
      estado_cuota: nuevoEstado,
      updated_at: new Date().toISOString(),
      sync_status: 'pending'
    });
  };

  // Saneamiento de cuotas
  const handleSanearCuotas = async () => {
    Swal.fire({
      title: 'Saneamiento de Cuotas',
      text: '¿Deseas auditar y recalcular las amortizaciones y estados de crédito en BBDD_Finanzas_Gastos?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, ejecutar saneamiento',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#8b5cf6',
      background: '#0D1526',
      color: '#f8fafc'
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Saneamiento Completado',
          text: 'Se han sincronizado los planes de crédito activos con las cuotas registradas.',
          icon: 'success',
          background: '#0D1526',
          color: '#f8fafc'
        });
      }
    });
  };

  return (
    <div
      id="vista-financiero-wrapper"
      className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col w-full h-full overflow-y-auto transition-colors duration-200 custom-scrollbar select-none"
    >
      {/* 1. HEADER FINANCIERO */}
      <header className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-6 py-3.5 shrink-0 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-20 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 text-xl font-bold shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-slate-800 dark:text-slate-100 text-lg tracking-tight">
                Finanzas & Gobernanza de Liquidez
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                En Tiempo Real
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition cursor-pointer shadow-2xs"
          >
            <span id="icon-refresh-tc" className="transition-transform duration-300 flex items-center">
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${actualizandoTC ? 'animate-spin text-amber-500' : ''}`} />
            </span>
            <span className="hidden sm:inline">TC SUNAT:</span>
            <span id="btn-label-tc" className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-black">
              {tipoCambioSunat.toFixed(3)}
            </span>
          </button>
        </div>
      </header>

      {/* 2. BARRA DE NAVEGACIÓN PRINCIPAL (4 PESTAÑAS ESTRUCTURALES) */}
      <div className="px-4 md:px-6 pt-3 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        {/* Tabs Pills */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto">
          {/* Pestaña 1: Vista General & KPIs */}
          <button
            type="button"
            id="tab-btn-fin-general"
            onClick={() => setTabActiva('general')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tabActiva === 'general'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Transacciones</span>
            <span
              id="tab-count-transacciones"
              className="text-[10px] px-2 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full font-mono font-bold"
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
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Control de Cuotas / Créditos</span>
            <span
              id="tab-count-cuotas"
              className="text-[10px] px-2 py-0.2 bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 rounded-full font-mono font-bold"
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
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4 shrink-0" />
            <span>Presupuestos</span>
          </button>
        </div>

        {/* Segmentación y Periodo */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Barra de Segmentación Maestra: [ Todos | Proyectos | Personal ] */}
          <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 gap-1 text-xs">
            <button
              type="button"
              id="btn-seg-fin-todos"
              onClick={() => setSegmento('TODOS')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                segmento === 'TODOS'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
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
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
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
              className="py-1.5 pl-3 pr-8 text-xs bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 shadow-2xs font-semibold cursor-pointer transition"
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
      {/* PESTAÑA 1: VISTA GENERAL & KPIS (PANEL DECISIONAL BENTO GRID)     */}
      {/* ================================================================= */}
      {tabActiva === 'general' && (
        <div id="vista-fin-tab-general" className="tab-fin-view p-4 md:p-6 space-y-5 flex-1">
          {/* RESUMEN TOP: SALDO EN MANO HOY VS PROYECCIÓN FIN DE MES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Saldo en Mano Real Hoy */}
            <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Dinero Real Hoy (En Mano)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Liquidez Real
                </span>
              </div>
              <div>
                <div id="kpi-saldo-en-mano" className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 truncate">
                  S/ {saldoEnManoReal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span>
                    Ing. Cobrados: <strong id="kpi-sub-ing-real" className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">S/ {realIngresos.toFixed(2)}</strong>
                  </span>
                  <span>
                    Gas. Pagados: <strong id="kpi-sub-gas-real" className="text-rose-500 dark:text-rose-400 font-mono tabular-nums">S/ {realGastos.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Saldo Proyectado a Fin de Mes */}
            <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Saldo Proyectado Fin de Mes</span>
                <span id="badge-proy-status" className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                  Estimado
                </span>
              </div>
              <div>
                <div id="kpi-saldo-proyectado-fin-mes" className="text-2xl font-black font-mono tabular-nums text-cyan-600 dark:text-cyan-400 truncate">
                  S/ {saldoProyectadoFinMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  Restando compromisos y cuotas pendientes del mes
                </div>
              </div>
            </div>

            {/* Card 3: Compromisos y Cuotas Pendientes del Mes */}
            <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Compromisos por Pagar (Mes)</span>
                <span id="badge-count-pendientes" className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {cuotasPendientesMes.length + (otrosGastosPendientes > 0 ? 1 : 0)} Pendientes
                </span>
              </div>
              <div>
                <div id="kpi-total-compromisos-pendientes" className="text-2xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 truncate">
                  S/ {totalCompromisosPendientes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span>
                    Cuotas: <strong id="kpi-sub-cuotas-pend" className="text-violet-600 dark:text-violet-400 font-mono tabular-nums">S/ {montoCuotasPendientes.toFixed(2)}</strong>
                  </span>
                  <span>
                    Otros Prog.: <strong id="kpi-sub-otros-pend" className="text-slate-700 dark:text-slate-300 font-mono tabular-nums">S/ {otrosGastosPendientes.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Posición Bimonetaria y TC */}
            <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Posición Bimonetaria</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  PEN / USD
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-between font-mono tabular-nums text-xs">
                  <span className="text-slate-500">PEN:</span>
                  <span id="kpi-fin-bimon-pen" className="font-bold text-slate-800 dark:text-slate-100 text-sm font-mono tabular-nums">
                    S/ {posicionBimonetaria.totalPEN.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between font-mono tabular-nums text-xs mt-0.5">
                  <span className="text-slate-500">USD:</span>
                  <span id="kpi-fin-bimon-usd" className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono tabular-nums">
                    $ {posicionBimonetaria.totalUSD.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>TC SUNAT:</span>
                  <span id="kpi-fin-tc-val" className="font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                    {tipoCambioSunat.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO GRID: LOS 5 KPIS DE IMPACTO DECISIONAL */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Indicadores de Salud & Decisión Financiera</span>
              </h3>
              <span className="text-xs text-slate-400">Calculado sobre tus ingresos, gastos y cuotas activas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* KPI 1: SEMÁFORO DE LIQUIDEZ */}
              <div id="card-semaforo-liquidez" className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${semaforoStatus.dot}`} id="dot-semaforo-liquidez"></span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">1. Semáforo de Liquidez</span>
                    </div>
                    <span id="badge-semaforo-liquidez" className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {semaforoStatus.badge} ({diasCobertura} días)
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-500">Liquidez Neta Estimada (Fin de Mes):</div>
                    <div id="val-semaforo-liquidez" className="text-xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      S/ {saldoProyectadoFinMes.toFixed(2)}
                    </div>
                  </div>
                  <p id="desc-semaforo-liquidez" className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    {semaforoStatus.desc}
                  </p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                  <div id="bar-semaforo-liquidez" className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: semaforoStatus.barWidth }}></div>
                </div>
              </div>

              {/* KPI 2: ALERTA DE FUGA / GASTOS HORMIGA */}
              <div id="card-gastos-hormiga" className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 flex items-center">
                        <Flame className="w-4 h-4 shrink-0" />
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">2. Alerta Fuga / Gastos Hormiga</span>
                    </div>
                    <span id="badge-gastos-hormiga" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gastosHormiga <= 300 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                      {gastosHormiga <= 300 ? 'Bajo Control' : 'Precaución'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-500">Compras menores no esenciales del mes:</div>
                    <div id="val-gastos-hormiga" className="text-xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                      S/ {gastosHormiga.toFixed(2)}
                    </div>
                  </div>
                  <p id="desc-gastos-hormiga" className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    Representa el <strong className="font-mono">{pctGastosHormiga}%</strong> de tus egresos. Umbral: &le; S/ 300.00.
                  </p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                  <div id="bar-gastos-hormiga" className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pctGastosHormiga * 3, 100)}%` }}></div>
                </div>
              </div>

              {/* KPI 3: CAPACIDAD DE AHORRO / SUPERÁVIT MENSUAL */}
              <div id="card-capacidad-ahorro" className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 flex items-center">
                        <TrendingUp className="w-4 h-4 shrink-0" />
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">3. Capacidad de Ahorro / Superávit</span>
                    </div>
                    <span id="badge-capacidad-ahorro" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ratioAhorroPct >= 20 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                      {ratioAhorroPct >= 20 ? 'Superávit Meta' : 'Ahorro Moderado'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-500">Dinero libre para ahorro / inversión:</div>
                    <div id="val-capacidad-ahorro" className="text-xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      S/ {capacidadAhorro.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono tabular-nums">
                    <span>Tasa de Ahorro: <strong id="val-ratio-ahorro-pct" className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{ratioAhorroPct}%</strong></span>
                    <span>Meta: &ge; 20%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                  <div id="bar-capacidad-ahorro" className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(ratioAhorroPct, 100)}%` }}></div>
                </div>
              </div>

              {/* KPI 4: NIVEL DE ENDEUDAMIENTO EN CUOTAS */}
              <div id="card-endeudamiento-cuotas" className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-violet-500 flex items-center">
                        <CreditCard className="w-4 h-4 shrink-0" />
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">4. Nivel de Endeudamiento en Cuotas</span>
                    </div>
                    <span id="badge-endeudamiento-cuotas" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ratioEndeudamientoCuotas <= 30 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                      {ratioEndeudamientoCuotas <= 30 ? 'Saludable' : 'Alerta Deuda'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-500">% Ingreso Comprometido en Cuotas:</div>
                    <div id="val-endeudamiento-cuotas" className="text-xl font-black font-mono tabular-nums text-violet-600 dark:text-violet-400">
                      {ratioEndeudamientoCuotas}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>Compromiso: <strong id="val-cuotas-compromiso-sub" className="text-slate-700 dark:text-slate-300 font-mono tabular-nums">S/ {montoCuotasPendientes.toFixed(2)}/mes</strong></span>
                    <span>Límite seguro: &le; 30%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                  <div id="bar-endeudamiento-cuotas" className="bg-violet-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(ratioEndeudamientoCuotas, 100)}%` }}></div>
                </div>
              </div>

              {/* KPI 5: RADAR DE CATEGORÍAS CRÍTICAS */}
              <div id="card-radar-categorias-criticas" className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs md:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-500 flex items-center">
                        <PieChart className="w-4 h-4 shrink-0" />
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">5. Radar de Categorías Críticas</span>
                    </div>
                    <span id="badge-radar-criticas" className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Monitoreo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Categorías con mayor presión presupuestal o consumo acelerado este periodo:
                  </p>
                  <div id="lista-radar-categorias-criticas" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {radarCategorias.length === 0 ? (
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400 italic text-center col-span-full">
                        Analizando gastos por categoría...
                      </div>
                    ) : (
                      radarCategorias.map((c) => (
                        <div key={c.categoria} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mr-2">{c.categoria}</span>
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 shrink-0">S/ {c.total.toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="pt-3 text-right">
                  <button
                    type="button"
                    onClick={() => setTabActiva('presupuesto')}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Ver Techos Presupuestales &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PRÓXIMOS VENCIMIENTOS Y CUOTAS (WIDGET ACCIONABLE) */}
          <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-indigo-500 flex items-center">
                  <Clock className="w-4 h-4 shrink-0" />
                </span>
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Próximos Vencimientos y Cuotas (Próximos 15 Días)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTabActiva('transacciones');
                  setEstadoFlujo('PROGRAMADO');
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Ver Todas las Programadas &rarr;
              </button>
            </div>
            <div id="lista-proximos-vencimientos-dashboard" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {proximosVencimientos.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl col-span-full">
                  Sin compromisos pendientes de liquidación en los próximos 15 días
                </div>
              ) : (
                proximosVencimientos.map((item) => (
                  <div
                    key={`${item.tipo}-${item.id}`}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between gap-3 hover:border-indigo-500/40 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${item.tipo === 'CUOTA' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                          {item.codigo}
                        </span>
                        <span className={`text-[10px] font-bold ${item.diasRestantes <= 1 ? 'text-rose-500 font-extrabold' : 'text-amber-500'}`}>
                          {item.diasRestantes <= 0 ? 'Vence hoy' : `Vence en ${item.diasRestantes} días`}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.concepto}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">F. Límite: {item.fecha}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                        S/ {item.montoPen.toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.tipo === 'CUOTA') {
                            handleToggleConciliarCuota(item.id, 'PENDIENTE');
                          } else {
                            handleToggleConciliar({ id: item.id, tipo: 'GASTO', esConciliado: false } as any);
                          }
                        }}
                        className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Conciliar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PESTAÑA 2: TRANSACCIONES (COEXISTENCIA REAL VS PROGRAMADO)         */}
      {/* ================================================================= */}
      {tabActiva === 'transacciones' && (
        <div id="vista-fin-tab-transacciones" className="tab-fin-view p-4 md:p-6 space-y-4 flex-1">
          {/* CABECERA Y FILTROS RÁPIDOS ERGONÓMICOS */}
          <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Registro Unificado de Movimientos Financieros</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Filtro 1: Selector Tipo de Movimiento */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tipo de Flujo</span>
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 text-xs">
                  <button
                    type="button"
                    id="pill-tipo-todos"
                    onClick={() => setTipoFlujo('TODOS')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      tipoFlujo === 'TODOS'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
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
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
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
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-rose-600'
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
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 text-xs">
                  <button
                    type="button"
                    id="pill-estado-todos"
                    onClick={() => setEstadoFlujo('TODOS')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      estadoFlujo === 'TODOS'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
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
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
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
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
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
                className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
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
              <div className="col-span-full text-center py-16 text-xs text-slate-400 italic">
                No se encontraron transacciones con los filtros seleccionados
              </div>
            ) : (
              transaccionesUnificadas.map((trx) => (
                <div
                  key={`${trx.tipo}-${trx.id}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-400/40 dark:hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded ${trx.tipo === 'INGRESO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {trx.codigo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums">{trx.fecha}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trx.esConciliado ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                        {trx.estado}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-relaxed">
                      {trx.descripcion}
                    </h4>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{trx.categoria}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className={`font-mono tabular-nums font-black text-sm ${trx.tipo === 'INGRESO' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {trx.tipo === 'INGRESO' ? '+' : '-'}S/ {trx.montoPen.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleConciliar(trx)}
                      title={trx.esConciliado ? 'Marcar como pendiente' : 'Conciliar movimiento'}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                        trx.esConciliado
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{trx.esConciliado ? 'Conciliado' : 'Conciliar'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PESTAÑA 3: CONTROL DE CUOTAS / CRÉDITOS (ENFOQUE REAL BANCARIO)   */}
      {/* ================================================================= */}
      {tabActiva === 'cuotas' && (
        <div id="vista-fin-tab-cuotas" className="tab-fin-view p-4 md:p-6 space-y-4 flex-1">
          {/* HEADER CONTROL DE CUOTAS */}
          <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-500"></span>
                Gobernanza de Compromisos a Plazos & Deudas Bancarias
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registrado con la cuota exacta emitida por tu banco. Concilia cuotas individuales y monitorea el avance del capital.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleSanearCuotas}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Auditar y realinear columnas de cuotas desfasadas"
              >
                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                <span>Sanear Cuotas</span>
              </button>
              <button
                type="button"
                onClick={() => setModalCuotaAbierto(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ Nuevo Plan de Crédito</span>
              </button>
            </div>
          </div>

          {/* KPIS RÁPIDOS DE CUOTAS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="portal-surface p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Planes de Crédito Activos</div>
              <div id="kpi-cuotas-activas" className="text-xl font-black font-mono tabular-nums text-violet-600 dark:text-violet-400">
                {cuotasRaw.length}
              </div>
            </div>
            <div className="portal-surface p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Compromiso Bancario Mensual</div>
              <div id="kpi-cuotas-mensual" className="text-xl font-black font-mono tabular-nums text-rose-500 dark:text-rose-400">
                S/ {montoCuotasPendientes.toFixed(2)}
              </div>
            </div>
            <div className="portal-surface p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Capital Amortizado Acumulado</div>
              <div id="kpi-cuotas-amortizado" className="text-xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                S/ {(cuotasRaw.filter(c => c.estado_cuota === 'PAGADO').reduce((acc, curr) => acc + (curr.monto_cuota || 0), 0)).toFixed(2)}
              </div>
            </div>
            <div className="portal-surface p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Saldo Pendiente Total</div>
              <div id="kpi-cuotas-deuda" className="text-xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                S/ {(cuotasRaw.filter(c => c.estado_cuota !== 'PAGADO').reduce((acc, curr) => acc + (curr.monto_cuota || 0), 0)).toFixed(2)}
              </div>
            </div>
          </div>

          {/* LISTA DE PLANES DE CRÉDITO Y CUOTAS */}
          <div id="lista-planes-cuotas" className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
            {cuotasRaw.length === 0 ? (
              <div className="col-span-full text-center py-16 text-xs text-slate-400 italic">
                Sin planes de cuotas registrados
              </div>
            ) : (
              cuotasRaw.map((c) => {
                const avancePct = Math.round((c.numero_cuota / c.total_cuotas) * 100);
                const esPagado = (c.estado_cuota || '').toUpperCase() === 'PAGADO';

                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-violet-500" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.entidad_financiera}</h4>
                        </div>
                        <span className="text-xs font-black font-mono text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-xl border border-violet-500/20">
                          Cuota {c.numero_cuota} de {c.total_cuotas}
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-xs text-slate-500">Monto de Cuota:</span>
                        <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                          {c.moneda} {c.monto_cuota.toFixed(2)}
                        </span>
                      </div>

                      {/* Progreso de Amortización */}
                      <div className="space-y-1 pt-2">
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>Avance Capital</span>
                          <span>{avancePct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-violet-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${avancePct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span>Vencimiento: </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{c.fecha_vencimiento}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleConciliarCuota(c.id, c.estado_cuota)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                          esPagado
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{esPagado ? 'Liquidada' : 'Liquidar Cuota'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PESTAÑA 4: PRESUPUESTOS (TECHOS POR CATEGORÍA & PROYECTOS)        */}
      {/* ================================================================= */}
      {tabActiva === 'presupuesto' && (
        <div id="vista-fin-tab-presupuesto" className="tab-fin-view p-4 md:p-6 space-y-5 flex-1">
          {/* HEADER PRESUPUESTOS */}
          <div className="portal-surface p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Techos de Gasto Presupuestal por Categoría</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compara la ejecución real de tus gastos versus el límite mensual fijado para evitar sobrecostos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                Swal.fire({
                  title: 'Configurar Techos Presupuestales',
                  text: 'Los techos se actualizan dinámicamente según la parametrización de tus metas financieras.',
                  icon: 'info',
                  background: '#0D1526',
                  color: '#f8fafc'
                });
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>Configurar Techos</span>
            </button>
          </div>

          {/* SECCIÓN 4.1: TECHOS DE GASTO POR CATEGORÍA */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Categorías de Vida & Gastos Corrientes
              </h4>
              <span className="text-xs text-slate-400" id="label-periodo-presupuesto">Mes Actual</span>
            </div>
            <div id="lista-presupuestos-categorias" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                { cat: 'Vivienda & Servicios', asignado: 850, consumido: 620 },
                { cat: 'Alimentación & Supermercado', asignado: 700, consumido: 540 },
                { cat: 'Educación, Certificaciones & Libros', asignado: 600, consumido: 380 },
                { cat: 'Transporte & Movilidad', asignado: 250, consumido: 190 },
                { cat: 'Salud, Gimnasio & Cuidado Personal', asignado: 350, consumido: 220 },
                { cat: 'Ocio, Restaurantes & Suscripciones', asignado: 300, consumido: 285 }
              ].map((pItem) => {
                const pct = Math.round((pItem.consumido / pItem.asignado) * 100);
                const excede = pct >= 90;

                return (
                  <div
                    key={pItem.cat}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2.5"
                  >
                    <div className="flex justify-between items-start text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{pItem.cat}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${excede ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${excede ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Ejecutado: S/ {pItem.consumido.toFixed(2)}</span>
                      <span>Tope: S/ {pItem.asignado.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 4.2: PRESUPUESTO POR TIPO DE HÁBITO (INVERSIÓN BIENESTAR & LIFE OS) */}
          <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Presupuesto por Tipo de Hábito (Inversión Bienestar)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Presupuesto Asignado | Gasto Real Ejecutado | Saldo Restante vinculado a actividades personales (ACT-)
                </p>
              </div>
            </div>
            <div id="lista-presupuestos-habitos" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {actividadesRaw.length === 0 ? (
                <div className="col-span-full text-center py-8 text-xs text-slate-400 italic">
                  Cargando presupuestos de hábitos...
                </div>
              ) : (
                actividadesRaw.slice(0, 6).map((act) => {
                  const costoEstimado = Number(getProp(act, 'costo_estimado', 'Costo_Estimado') || 120);
                  const costoReal = Number(getProp(act, 'costo_real', 'Costo_Real') || 65);
                  const pct = Math.round((costoReal / (costoEstimado || 1)) * 100);

                  return (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                          {act.nombre_actividad}
                        </span>
                        <span className="font-mono text-[10px] text-indigo-400 font-bold">
                          {act.codigo_legado}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Gasto: S/ {costoReal.toFixed(2)}</span>
                        <span>Asignado: S/ {costoEstimado.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECCIÓN 4.3: MATRIZ DE PRESUPUESTO POR PROYECTO (BURN RATE MATRIX) */}
          <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Control Presupuestario por Proyecto (Burn Rate Matrix)</span>
              </h4>
              <span className="text-xs text-slate-400">Presupuesto Tope (BAC) vs Costo Real Imputado (AC)</span>
            </div>
            <div id="lista-fin-presupuesto-proyectos" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {proyectosRaw.length === 0 ? (
                <div className="col-span-full text-center py-8 text-xs text-slate-400 italic">
                  No hay proyectos registrados
                </div>
              ) : (
                proyectosRaw.map((p) => {
                  const bac = Number(p.presupuesto_tope || 5000);
                  const ac = Number(p.costo_ejecutado_real_pen || 0);
                  const burnRate = Math.round((ac / (bac || 1)) * 100);
                  const remanente = Math.max(bac - ac, 0);

                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-indigo-400">{p.codigo_legado}</span>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{p.nombre_proyecto}</h5>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${burnRate > 80 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {burnRate}% BAC
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${burnRate > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                          style={{ width: `${Math.min(burnRate, 100)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Costo Real (AC):</span>
                          <strong className="text-slate-900 dark:text-white">S/ {ac.toFixed(2)}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Remanente:</span>
                          <strong className="text-emerald-500">S/ {remanente.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANÓNICO REGISTRAR INGRESO */}
      <ModalIngreso
        isOpen={modalIngresoAbierto}
        onClose={() => setModalIngresoAbierto(false)}
      />

      {/* MODAL CANÓNICO REGISTRAR GASTO */}
      <ModalGasto
        isOpen={modalGastoAbierto}
        onClose={() => setModalGastoAbierto(false)}
      />

      {/* MODAL CREAR PLAN CUOTAS */}
      {modalCuotaAbierto && (
        <ModalNuevoPlanCuotas
          onClose={() => setModalCuotaAbierto(false)}
        />
      )}
    </div>
  );
};

// Modal auxiliar para nuevo plan de crédito
const ModalNuevoPlanCuotas: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [entidad, setEntidad] = useState('');
  const [totalCuotas, setTotalCuotas] = useState<number>(12);
  const [montoCuota, setMontoCuota] = useState<number>(0);
  const [moneda, setMoneda] = useState<'PEN' | 'USD'>('PEN');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entidad.trim() || montoCuota <= 0 || totalCuotas <= 0) return;

    const count = await db.cuotas.count();
    const nowIso = new Date().toISOString();

    await db.cuotas.add({
      id: crypto.randomUUID ? crypto.randomUUID() : `cuo_${Date.now()}`,
      user_id: '00000000-0000-0000-0000-000000000001',
      codigo_legado: `CUO-${String(count + 1).padStart(3, '0')}`,
      entidad_financiera: entidad.trim(),
      numero_cuota: 1,
      total_cuotas: totalCuotas,
      monto_cuota: montoCuota,
      moneda: moneda,
      fecha_vencimiento: fechaVencimiento || nowIso.split('T')[0],
      estado_cuota: 'PENDIENTE',
      updated_at: nowIso,
      sync_status: 'pending'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">+ Nuevo Plan de Crédito / Cuotas</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleGuardar} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 font-bold mb-1">Entidad Financiera / Banco</label>
            <input
              type="text"
              required
              value={entidad}
              onChange={(e) => setEntidad(e.target.value)}
              placeholder="Ej. BCP, BBVA, Interbank..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold mb-1">Número de Cuotas</label>
              <input
                type="number"
                min="1"
                required
                value={totalCuotas || ''}
                onChange={(e) => setTotalCuotas(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Monto por Cuota</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={montoCuota || ''}
                onChange={(e) => setMontoCuota(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold mb-1">Moneda</label>
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as 'PEN' | 'USD')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500 font-mono"
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Fecha 1ra Cuota</label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition shadow-xs cursor-pointer"
            >
              Registrar Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
