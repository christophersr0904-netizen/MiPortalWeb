const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log("=== INICIANDO SUITE DE PRUEBAS VM: FASE 4.12 ===");

// 1. Mock de Apps Script Environment
const mockSpreadsheet = {
  getId: () => "mock-spreadsheet-id",
  getSheetByName: (name) => {
    // Si buscan FlujoCaja, retornar null o simular que no existe
    if (name === "BBDD_Finanzas_FlujoCaja" || name === "BBDD_FlujoCaja" || name === "FlujoCaja") {
      return null;
    }
    // Hojas canónicas
    if (name === "BBDD_Finanzas_Gastos" || name === "BBDD_Gastos") {
      return {
        getLastRow: () => 3,
        getLastColumn: () => 14,
        getRange: (r, c, numR, numC) => ({
          getValues: () => {
            if (numR === 1) {
              // Encabezados
              return [["ID_Gasto", "Clasificacion_Origen", "ID_Origen_Vinculado", "ID_Cuota", "Fecha_Gasto", "Concepto", "Categoria", "Moneda", "Monto_Original", "Tipo_Cambio", "Monto_PEN", "Metodo_Pago", "Estado_Pago", "Comprobante_URL"]];
            }
            return [
              ["GAS-001", "Personal", "NINGUNO", "", "2026-10-01", "Supermercado", "Alimentacion", "PEN", 150, 1, 150, "Tarjeta", "Pagado", ""],
              ["GAS-CUO-001-001", "Personal", "CUO-001", "CUO-001", "2026-10-15", "Laptop - Cuota 1/12", "Deudas", "PEN", 250, 1, 250, "Transferencia", "Pendiente / Programado", ""]
            ];
          },
          setValues: (vals) => {}
        }),
        getDataRange: () => ({
          getValues: () => [
            ["ID_Gasto", "Clasificacion_Origen", "ID_Origen_Vinculado", "ID_Cuota", "Fecha_Gasto", "Concepto", "Categoria", "Moneda", "Monto_Original", "Tipo_Cambio", "Monto_PEN", "Metodo_Pago", "Estado_Pago", "Comprobante_URL"],
            ["GAS-001", "Personal", "NINGUNO", "", "2026-10-01", "Supermercado", "Alimentacion", "PEN", 150, 1, 150, "Tarjeta", "Pagado", ""],
            ["GAS-CUO-001-001", "Personal", "CUO-001", "CUO-001", "2026-10-15", "Laptop - Cuota 1/12", "Deudas", "PEN", 250, 1, 250, "Transferencia", "Pendiente / Programado", ""]
          ]
        })
      };
    }
    if (name === "BBDD_Finanzas_Ingresos") {
      return {
        getLastRow: () => 2,
        getLastColumn: () => 12,
        getRange: (r, c, numR, numC) => ({
          getValues: () => {
            if (numR === 1) {
              return [["ID_Ingreso", "Tipo_Origen", "ID_Origen_Vinculado", "Fecha_Ingreso", "Descripcion_Ingreso", "Categoria_Ingreso", "Moneda_Original", "Monto_Original", "Tipo_Cambio", "Monto_PEN", "Metodo_Cobro", "Estado_Cobro"]];
            }
            return [
              ["ING-001", "LIBRE_CORRIENTE", "NINGUNO", "2026-10-05", "Sueldo", "Sueldo_Nomina", "PEN", 5000, 1, 5000, "BCP", "Cobrado"]
            ];
          },
          setValues: (vals) => {}
        }),
        getDataRange: () => ({
          getValues: () => [
            ["ID_Ingreso", "Tipo_Origen", "ID_Origen_Vinculado", "Fecha_Ingreso", "Descripcion_Ingreso", "Categoria_Ingreso", "Moneda_Original", "Monto_Original", "Tipo_Cambio", "Monto_PEN", "Metodo_Cobro", "Estado_Cobro"],
            ["ING-001", "LIBRE_CORRIENTE", "NINGUNO", "2026-10-05", "Sueldo", "Sueldo_Nomina", "PEN", 5000, 1, 5000, "BCP", "Cobrado"]
          ]
        })
      };
    }
    return {
      getLastRow: () => 0,
      getLastColumn: () => 0,
      getRange: () => ({ getValues: () => [] }),
      getDataRange: () => ({ getValues: () => [] })
    };
  },
  getSheets: () => []
};

const sandbox = {
  console: console,
  Logger: { log: (...args) => console.log("[GAS Logger]:", ...args) },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => mockSpreadsheet,
    flush: () => {}
  },
  LockService: {
    getScriptLock: () => ({
      waitLock: () => true,
      releaseLock: () => true
    })
  },
  CacheService: {
    getScriptCache: () => ({
      get: () => null,
      put: () => {},
      remove: () => {}
    })
  },
  Utilities: {
    formatDate: (d, tz, fmt) => "2026-10-11"
  },
  invalidarCacheDashboard: () => {},
  sobrescribirHojaFiltrada: (sheet, filterFn) => {}
};

vm.createContext(sandbox);

// 2. Cargar scripts en orden
const filesToLoad = [
  'Config.js',
  'FinanzasService.js',
  'FinanzasAvanzadasService.js',
  'DashboardService.js',
  'ApiRouter.js'
];

for (const file of filesToLoad) {
  const code = fs.readFileSync(file, 'utf8');
  vm.runInContext(code, sandbox);
  console.log(`[VM LOAD]: ${file} cargado con éxito.`);
}

// 3. Verificaciones de CONFIG
console.log("\n--- TEST 1: CONFIG.COLS_FLUJO_CAJA Y CATALOGOS ---");
const CONFIG = vm.runInContext('CONFIG', sandbox);
const FinanzasService = vm.runInContext('FinanzasService', sandbox);
const FinanzasAvanzadasService = vm.runInContext('FinanzasAvanzadasService', sandbox);
const DashboardService = vm.runInContext('DashboardService', sandbox);

assert.strictEqual(CONFIG.COLS_FLUJO_CAJA, undefined, "COLS_FLUJO_CAJA debe estar undefined");
assert.strictEqual(CONFIG.CATALOGOS.CATEGORIAS_FLUJO_CAJA, undefined, "CATEGORIAS_FLUJO_CAJA debe estar undefined");
assert.strictEqual(CONFIG.CATALOGOS.ESTADOS_FLUJO, undefined, "ESTADOS_FLUJO debe estar undefined");
assert.strictEqual(CONFIG.SHEETS.FLUJO_CAJA, undefined, "CONFIG.SHEETS.FLUJO_CAJA debe estar undefined");
assert.ok(CONFIG.SHEETS.FINANZAS, "CONFIG.SHEETS.FINANZAS debe existir");
assert.ok(CONFIG.SHEETS.INGRESOS, "CONFIG.SHEETS.INGRESOS debe existir");
console.log("✓ TEST 1 PASADO: Config.js está limpio de residuos de FlujoCaja.");

// 4. Verificaciones de FinanzasService
console.log("\n--- TEST 2: FinanzasService ---");
assert.strictEqual(FinanzasService.migrarFlujoCajaAGastos, undefined, "migrarFlujoCajaAGastos no debe existir");
const resSaneamiento = FinanzasService.sanearCuotasDesfasadas();
assert.ok(resSaneamiento.success, "sanearCuotasDesfasadas debe ejecutarse con éxito");
console.log("✓ TEST 2 PASADO: FinanzasService no contiene migrarFlujoCajaAGastos y sanea limpiamente.");

// 5. Verificaciones de FinanzasAvanzadasService
console.log("\n--- TEST 3: FinanzasAvanzadasService.calcularMetricasAvanzadas ---");
const metricas = FinanzasAvanzadasService.calcularMetricasAvanzadas({});
assert.ok(metricas.success, "calcularMetricasAvanzadas debe tener éxito");
assert.ok(metricas.data, "calcularMetricasAvanzadas debe retornar propiedad data");
assert.strictEqual(typeof metricas.data.balanceProyectado, "number", "balanceProyectado numérico");
assert.strictEqual(typeof metricas.data.balanceReal, "number", "balanceReal numérico");
assert.strictEqual(typeof metricas.data.totalIngresosReales, "number", "totalIngresosReales numérico");
assert.strictEqual(typeof metricas.data.totalEgresosReales, "number", "totalEgresosReales numérico");
assert.ok(Array.isArray(metricas.data.cuotasProximas), "cuotasProximas debe ser array");
assert.ok(Array.isArray(metricas.data.recordatorios), "recordatorios debe ser array");
console.log("Resultado de métricas:", JSON.stringify(metricas.data, null, 2));
console.log("✓ TEST 3 PASADO: Métricas avanzadas opera 100% en memoria sobre Gastos e Ingresos.");

// 6. Verificaciones de deleteMovimiento
console.log("\n--- TEST 4: FinanzasAvanzadasService.deleteMovimiento ---");
let gastoDeleted = false;
FinanzasService.deleteGasto = (p) => { gastoDeleted = true; return { success: true }; };
const resDel = FinanzasAvanzadasService.deleteMovimiento({ idMovimiento: "GAS-001" });
assert.ok(resDel.success, "deleteMovimiento debe delegar con éxito");
assert.ok(gastoDeleted, "deleteGasto fue invocado como delegación");
console.log("✓ TEST 4 PASADO: deleteMovimiento redirige a deleteGasto limpiamente.");

// 7. Verificaciones de ApiRouter
console.log("\n--- TEST 5: ApiRouter - crearmovimientoflujocaja ---");
let movCreated = false;
FinanzasAvanzadasService.createMovimiento = (p) => { movCreated = true; return { success: true }; };
const procesarAccionBackend = vm.runInContext('procesarAccionBackend', sandbox);
const resRouter = procesarAccionBackend("crearmovimientoflujocaja", { tipo: "EGRESO", monto: 50 });
assert.ok(movCreated, "crearmovimientoflujocaja debe rutear a createMovimiento");
assert.ok(resRouter.success, "procesarAccionBackend debe retornar success");
console.log("✓ TEST 5 PASADO: ApiRouter enruta crearmovimientoflujocaja a createMovimiento.");

console.log("\n========================================================");
console.log("TODAS LAS PRUEBAS DE NO REGRESIÓN DE LA FASE 4.12 PASARON CON ÉXITO (CÓDIGO 0).");
console.log("========================================================");
