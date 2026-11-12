/**
 * ============================================================================
 * ARCHIVO: src/components/Finanzas/TabPresupuestos.tsx
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYS-001-F5 / REQ-SYS-001-F8
 * DESCRIPCIÓN: Submódulo memoizado de Gobernanza Presupuestal, Techos de Gasto,
 *              Inversión en Hábitos y Matriz Burn Rate por Proyecto.
 * ============================================================================
 */

import React, { memo, useMemo, useState, useEffect } from 'react';
import { Target, Flame, Building } from 'lucide-react';
import { getProp } from '../../utils/entityNormalizer';
import {
  obtenerTechosConfigurados,
  EVENT_TECHOS_UPDATED,
  type TechoPresupuestoItem
} from '../Modals/ModalTechosPresupuesto';

export interface TabPresupuestosProps {
  actividadesRaw: any[];
  proyectosRaw: any[];
  gastosRaw?: any[];
  onConfigurarTechos: () => void;
}

function coincideCategoria(catPresupuesto: string, catGasto?: string): boolean {
  if (!catGasto) return false;
  const p = catPresupuesto.toLowerCase();
  const g = catGasto.toLowerCase();
  if (p === g) return true;
  if (p.includes('vivienda') && (g.includes('alquiler') || g.includes('servicio'))) return true;
  if (p.includes('alimentación') && (g.includes('aliment') || g.includes('supermercado'))) return true;
  if (p.includes('transporte') && (g.includes('transporte') || g.includes('logística') || g.includes('movilidad'))) return true;
  if (p.includes('materiales') && (g.includes('material') || g.includes('equipo') || g.includes('hardware'))) return true;
  if (p.includes('licencias') && (g.includes('licencia') || g.includes('software'))) return true;
  if (p.includes('educación') && (g.includes('educa') || g.includes('libro') || g.includes('curso'))) return true;
  if (p.includes('salud') && (g.includes('salud') || g.includes('gym') || g.includes('gimnasio') || g.includes('médic'))) return true;
  if (p.includes('ocio') && (g.includes('ocio') || g.includes('restaurante') || g.includes('suscrip'))) return true;
  return p.includes(g) || g.includes(p);
}

const TabPresupuestosComponent: React.FC<TabPresupuestosProps> = ({
  actividadesRaw,
  proyectosRaw,
  gastosRaw = [],
  onConfigurarTechos
}) => {
  const [techosConfig, setTechosConfig] = useState<TechoPresupuestoItem[]>(() =>
    obtenerTechosConfigurados()
  );

  useEffect(() => {
    const handleUpdated = () => {
      setTechosConfig(obtenerTechosConfigurados());
    };
    window.addEventListener(EVENT_TECHOS_UPDATED, handleUpdated);
    return () => window.removeEventListener(EVENT_TECHOS_UPDATED, handleUpdated);
  }, []);

  // Consumo real calculado dinámicamente según mes actual y gastos en Dexie
  const categoriasCalculadas = useMemo(() => {
    const mesActual = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const gastosMes = (gastosRaw || []).filter((g) => {
      const fecha = g.fecha_gasto || '';
      return fecha.startsWith(mesActual);
    });

    return techosConfig.map((item) => {
      const consumido = gastosMes
        .filter((g) => coincideCategoria(item.categoria, g.categoria_gasto))
        .reduce((sum, g) => sum + (Number(g.monto_pen) || 0), 0);

      const asignado = item.asignado > 0 ? item.asignado : 1;
      const pct = Math.round((consumido / asignado) * 100);
      return {
        cat: item.categoria,
        asignado: item.asignado,
        consumido,
        pct
      };
    });
  }, [techosConfig, gastosRaw]);

  // Memoización de métricas de hábitos
  const habitosPresupuestos = useMemo(() => {
    return actividadesRaw.slice(0, 6).map((act) => {
      const costoEstimado = Number(getProp(act, 'costo_estimado', 'Costo_Estimado') || 120);
      const costoReal = Number(getProp(act, 'costo_real', 'Costo_Real') || 65);
      const pct = Math.round((costoReal / (costoEstimado || 1)) * 100);
      return {
        id: act.id,
        nombre: act.nombre_actividad || 'Actividad',
        codigo: act.codigo_legado || 'ACT',
        costoEstimado,
        costoReal,
        pct
      };
    });
  }, [actividadesRaw]);

  // Memoización de matriz de proyectos (Burn Rate Matrix)
  const proyectosBurnRate = useMemo(() => {
    return proyectosRaw.map((p) => {
      const bac = Number(p.presupuesto_tope || 5000);
      const ac = Number(p.costo_ejecutado_real_pen || 0);
      const burnRate = Math.round((ac / (bac || 1)) * 100);
      const remanente = Math.max(bac - ac, 0);
      return {
        id: p.id,
        codigo: p.codigo_legado || 'PROY',
        nombre: p.nombre_proyecto || 'Proyecto',
        bac,
        ac,
        burnRate,
        remanente
      };
    });
  }, [proyectosRaw]);

  return (
    <div id="vista-fin-tab-presupuesto" className="tab-fin-view p-4 md:p-6 space-y-5 flex-1 animate-in fade-in duration-150">
      {/* HEADER PRESUPUESTOS */}
      <div className="p-4 rounded-xl bg-[#0D1526]/90 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
            <span>Techos de Gasto Presupuestal por Categoría</span>
          </h3>
          <p className="text-xs text-slate-400">
            Compara la ejecución real de tus gastos versus el límite mensual fijado para evitar sobrecostos.
          </p>
        </div>
        <button
          type="button"
          id="btn-configurar-techos-presupuesto"
          onClick={onConfigurarTechos}
          className="h-10 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>Configurar Techos</span>
        </button>
      </div>

      {/* SECCIÓN 4.1: TECHOS DE GASTO POR CATEGORÍA */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
            Categorías de Vida & Gastos Corrientes
          </h4>
          <span className="text-xs text-slate-400" id="label-periodo-presupuesto">Mes Actual</span>
        </div>
        <div id="lista-presupuestos-categorias" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {categoriasCalculadas.map((pItem) => {
            const excede = pItem.pct >= 90;

            return (
              <div
                key={pItem.cat}
                className="p-4 rounded-xl bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 space-y-2.5 transition-colors"
              >
                <div className="flex justify-between items-start text-xs">
                  <span className="font-bold text-slate-200">{pItem.cat}</span>
                  <span className={`text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded border ${excede ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                    {pItem.pct}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${excede ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(pItem.pct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                  <span>Ejecutado: S/ {pItem.consumido.toFixed(2)}</span>
                  <span>Tope: S/ {pItem.asignado.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 4.2: PRESUPUESTO POR TIPO DE HÁBITO (INVERSIÓN BIENESTAR & LIFE OS) */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-teal-400 shrink-0" strokeWidth={1.75} />
              <span>Presupuesto por Tipo de Hábito (Inversión Bienestar)</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Presupuesto Asignado | Gasto Real Ejecutado | Saldo Restante vinculado a actividades personales (ACT-)
            </p>
          </div>
        </div>
        <div id="lista-presupuestos-habitos" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {habitosPresupuestos.length === 0 ? (
            <div className="col-span-full min-h-[120px] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/50 bg-slate-900/30 text-slate-400 p-6 text-center space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-950/40 flex items-center justify-center text-teal-400">
                <Flame className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className="text-xs font-semibold text-slate-300">
                Sin presupuestos de hábitos vinculados
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Asigna costo estimado a tus hábitos en el módulo correspondiente para monitorear su inversión.
              </p>
            </div>
          ) : (
            habitosPresupuestos.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl border border-slate-800/80 hover:border-sky-500/40 bg-[#0D1526]/90 space-y-2 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 truncate pr-2">
                    {act.nombre}
                  </span>
                  <span className="font-mono tabular-nums text-[10px] text-teal-400 font-bold">
                    {act.codigo}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(act.pct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                  <span>Gasto: S/ {act.costoReal.toFixed(2)}</span>
                  <span>Asignado: S/ {act.costoEstimado.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECCIÓN 4.3: MATRIZ DE PRESUPUESTO POR PROYECTO (BURN RATE MATRIX) */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
            <span>Control Presupuestario por Proyecto (Burn Rate Matrix)</span>
          </h4>
          <span className="text-xs text-slate-400">Presupuesto Tope (BAC) vs Costo Real Imputado (AC)</span>
        </div>
        <div id="lista-fin-presupuesto-proyectos" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
          {proyectosBurnRate.length === 0 ? (
            <div className="col-span-full min-h-[120px] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/50 bg-slate-900/30 text-slate-400 p-6 text-center space-y-2">
              <div className="w-9 h-9 rounded-xl bg-sky-950/40 flex items-center justify-center text-sky-400">
                <Building className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className="text-xs font-semibold text-slate-300">
                No hay proyectos registrados
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Crea proyectos con presupuesto tope (BAC) para monitorear la tasa de consumo de fondos.
              </p>
            </div>
          ) : (
            proyectosBurnRate.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 space-y-3 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono tabular-nums font-bold text-sky-400">{p.codigo}</span>
                    <h5 className="text-xs font-bold text-slate-100 line-clamp-1">{p.nombre}</h5>
                  </div>
                  <span className={`text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-full border ${p.burnRate > 80 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    {p.burnRate}% BAC
                  </span>
                </div>

                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${p.burnRate > 80 ? 'bg-rose-500' : 'bg-sky-500'}`}
                    style={{ width: `${Math.min(p.burnRate, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono tabular-nums pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Costo Real (AC):</span>
                    <strong className="text-slate-100">S/ {p.ac.toFixed(2)}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Remanente:</span>
                    <strong className="text-emerald-400">S/ {p.remanente.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const TabPresupuestos = memo(TabPresupuestosComponent);

