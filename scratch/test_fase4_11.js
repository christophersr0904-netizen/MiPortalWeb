const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

// 1. Setup mock Google Apps Script environment
const mockData = {
  "BBDD_Finanzas_Gastos": [
    [
      "ID_Gasto", "Tipo_Origen", "ID_Origen_Vinculado", "ID_Cuota",
      "Fecha_Gasto", "Descripcion_Gasto", "Categoria_Gasto", "Moneda_Original",
      "Monto_Original", "Tipo_Cambio", "Monto_PEN", "Metodo_Pago",
      "Estado_Pago", "Comprobante_URL"
    ]
  ]
};

const createMockSheet = (sheetName) => {
  return {
    getName: () => sheetName,
    getLastColumn: () => mockData[sheetName] ? (mockData[sheetName][0] ? mockData[sheetName][0].length : 0) : 0,
    getLastRow: () => mockData[sheetName] ? mockData[sheetName].length : 0,
    getDataRange: () => ({
      getValues: () => JSON.parse(JSON.stringify(mockData[sheetName] || []))
    }),
    getRange: (row, col, numRows = 1, numCols = 1) => ({
      getValues: () => {
        const rows = [];
        for (let r = 0; r < numRows; r++) {
          const rowData = mockData[sheetName][row - 1 + r] || [];
          const cols = [];
          for (let c = 0; c < numCols; c++) {
            cols.push(rowData[col - 1 + c] !== undefined ? rowData[col - 1 + c] : "");
          }
          rows.push(cols);
        }
        return rows;
      },
      setValues: (values) => {
        for (let r = 0; r < values.length; r++) {
          const targetRow = row - 1 + r;
          if (!mockData[sheetName][targetRow]) {
            mockData[sheetName][targetRow] = new Array(numCols).fill("");
          }
          for (let c = 0; c < values[r].length; c++) {
            mockData[sheetName][targetRow][col - 1 + c] = values[r][c];
          }
        }
      },
      setValue: (val) => {
        const targetRow = row - 1;
        if (!mockData[sheetName][targetRow]) {
          mockData[sheetName][targetRow] = [];
        }
        mockData[sheetName][targetRow][col - 1] = val;
      }
    }),
    appendRow: (rowArr) => {
      mockData[sheetName].push([...rowArr]);
    }
  };
};

const mockSpreadsheet = {
  getSheetByName: (name) => {
    if (name === "BBDD_Finanzas_Cuotas") {
      throw new Error("RESIUDAL_CALL_ERROR: BBDD_Finanzas_Cuotas should NEVER be called!");
    }
    if (!mockData[name]) return null;
    return createMockSheet(name);
  },
  insertSheet: (name) => {
    if (name === "BBDD_Finanzas_Cuotas") {
      throw new Error("RESIDUAL_INSERT_ERROR: BBDD_Finanzas_Cuotas should NEVER be inserted!");
    }
    mockData[name] = [];
    return createMockSheet(name);
  },
  getSheets: () => Object.keys(mockData).map(createMockSheet),
  getId: () => "mock-ss-id"
};

const context = {
  console: console,
  Logger: { log: console.log },
  Utilities: {
    formatDate: (d, tz, fmt) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
  },
  CacheService: {
    getScriptCache: () => ({
      get: () => null,
      put: () => {}
    })
  },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => mockSpreadsheet,
    flush: () => {}
  },
  LockService: {
    getScriptLock: () => ({
      waitLock: () => true,
      releaseLock: () => {}
    })
  },
  invalidarCacheDashboard: () => {},
  CONFIG: null,
  CorrelativoService: {
    generarCorrelativo: (prefix) => `${prefix}-001`,
    generarIdGasto: () => {
      const idx = mockData["BBDD_Finanzas_Gastos"].length;
      return `GAS-${String(idx).padStart(3, '0')}`;
    }
  }
};

vm.createContext(context);

// Load Config.js
const configCode = fs.readFileSync(path.join(__dirname, '..', 'Config.js'), 'utf8');
vm.runInContext(configCode, context);

// Check 1: CONFIG schema assertions
const CONFIG = vm.runInContext("CONFIG", context);
assert.strictEqual(CONFIG.SHEETS.CUOTAS, undefined, "SHEETS.CUOTAS must be removed");
assert.strictEqual(CONFIG.COLS_CUOTAS, undefined, "COLS_CUOTAS must be removed");
assert.strictEqual(CONFIG.COLS_FINANZAS.ID_CUOTA, 3, "COLS_FINANZAS.ID_CUOTA must remain 3 (Col D)");
assert.strictEqual(CONFIG.COLS_GASTOS.ID_CUOTA, 3, "COLS_GASTOS.ID_CUOTA must remain 3 (Col D)");
console.log("PASS: Config.js assertions verified.");

// Load FinanzasService.js
const finanzasCode = fs.readFileSync(path.join(__dirname, '..', 'FinanzasService.js'), 'utf8');
vm.runInContext(finanzasCode, context);
const FinanzasService = vm.runInContext("FinanzasService", context);

// Test crearGastoEnCuotas
const payloadPlan = {
  nombrePlan: "Laptop Gamer Asus",
  descripcion: "Equipo para desarrollo",
  montoTotal: 3600,
  cuotaInicial: 0,
  numCuotas: 3,
  montoCuota: 1200,
  diaPago: 15,
  fechaInicio: "2026-10-15",
  categoria: "Tecnologia",
  metodoPago: "Tarjeta_Credito",
  moneda: "PEN"
};

const resCrear = FinanzasService.crearGastoEnCuotas(payloadPlan);
assert.strictEqual(resCrear.success, true, "crearGastoEnCuotas should succeed");
assert.strictEqual(resCrear.idPlan, "CUO-001", "Plan ID should be CUO-001");
console.log("PASS: crearGastoEnCuotas executed successfully.");

// Verify rows in BBDD_Finanzas_Gastos
const gastosRows = mockData["BBDD_Finanzas_Gastos"];
assert.strictEqual(gastosRows.length, 4, "Should have 1 header row + 3 installment rows");

for (let i = 1; i <= 3; i++) {
  const row = gastosRows[i];
  assert.strictEqual(row.length, 14, `Row ${i} must have exactly 14 columns`);
  assert.strictEqual(row[3], "CUO-001", `Row ${i} Col D (ID_Cuota) must be CUO-001`);
  assert.strictEqual(row[5], `Laptop Gamer Asus (Total S/ 3600) - Cuota ${i}/3`, `Row ${i} Col F (Descripcion) format canonical`);
  assert.strictEqual(row[12], "Pendiente", `Row ${i} Col M (Estado_Pago) must be 'Pendiente'`);
}
console.log("PASS: BBDD_Finanzas_Gastos 14-column canonical rows verified.");

// Test pagarSiguienteCuota for cuota 1
const resPagar1 = FinanzasService.pagarSiguienteCuota({
  idPlan: "CUO-001",
  fechaReal: "2026-10-15",
  metodoPago: "Transferencia_BCP"
});

assert.strictEqual(resPagar1.success, true, "pagarSiguienteCuota 1 should succeed");
assert.strictEqual(resPagar1.cuotasPagadas, 1, "Cuotas pagadas should be 1");
assert.strictEqual(resPagar1.totalCuotas, 3, "Total cuotas should be 3");
assert.strictEqual(resPagar1.saldoPendiente, 2400, "Saldo pendiente should be 2400");
assert.strictEqual(resPagar1.estado, "ACTIVO", "Estado should be ACTIVO");

// Verify row 1 mutated to 'Pagado'
assert.strictEqual(gastosRows[1][12], "Pagado", "Row 1 Estado_Pago must be Pagado");
assert.strictEqual(gastosRows[2][12], "Pendiente", "Row 2 Estado_Pago must still be Pendiente");
assert.strictEqual(gastosRows[3][12], "Pendiente", "Row 3 Estado_Pago must still be Pendiente");
console.log("PASS: pagarSiguienteCuota cuota 1 verified.");

// Test pagarSiguienteCuota for cuota 2
const resPagar2 = FinanzasService.pagarSiguienteCuota({
  idPlan: "CUO-001",
  fechaReal: "2026-11-15"
});
assert.strictEqual(resPagar2.cuotasPagadas, 2, "Cuotas pagadas should be 2");
assert.strictEqual(resPagar2.saldoPendiente, 1200, "Saldo pendiente should be 1200");
assert.strictEqual(resPagar2.estado, "ACTIVO");
assert.strictEqual(gastosRows[2][12], "Pagado", "Row 2 Estado_Pago must be Pagado");
console.log("PASS: pagarSiguienteCuota cuota 2 verified.");

// Test pagarSiguienteCuota for cuota 3 (final)
const resPagar3 = FinanzasService.pagarSiguienteCuota({
  idPlan: "CUO-001",
  fechaReal: "2026-12-15"
});
assert.strictEqual(resPagar3.cuotasPagadas, 3, "Cuotas pagadas should be 3");
assert.strictEqual(resPagar3.saldoPendiente, 0, "Saldo pendiente should be 0");
assert.strictEqual(resPagar3.estado, "COMPLETADO", "Estado should be COMPLETADO");
assert.strictEqual(gastosRows[3][12], "Pagado", "Row 3 Estado_Pago must be Pagado");
console.log("PASS: pagarSiguienteCuota cuota 3 verified (completion).");

// Test DashboardService in-memory synthesis
// Setup dummy sheets for other required tables in getDashboardData
mockData["BBDD_Hitos"] = [["ID_Elemento_WBS", "WBS_Code", "Nombre_Elemento", "Fase_Asociada", "Estado_Hito", "Peso_Ponderado_Pct", "Fecha_Limite_Plan", "Fecha_Real_Fin", "Presupuesto_Asignado", "Criterio_Aceptacion_DoD", "Dependencia_ID_Hito", "Entregable_Verificable_Link"]];
mockData["BBDD_Actividades_Tareas"] = [["ID_Tarea", "ID_Hito", "ID_Proyecto", "Nombre_Tarea_Actividad", "Estado_Tarea", "Prioridad_Eisenhower", "Nivel_Energia_Requerido", "Horas_Estimadas", "Horas_Reales", "Fecha_Programada", "Agendado_En_Calendar", "ID_Dependencia", "Responsable_Ejecutor", "Notas_Impedimentos"]];
mockData["BBDD_Proyectos"] = [["ID_Proyecto", "Nombre_Proyecto", "Tipo_Iniciativa", "Magnitud_Complejidad", "Arquetipo_Proyecto", "Estado_Proyecto", "Health_Status", "Avance_Real_Pct"]];
mockData["BBDD_Actividades_Personales"] = [["ID_Actividad", "Nombre", "Tipo_Registro", "Categoria_Vida", "Meta_Macro_Nombre", "Unidad_Medida", "Meta_Objetivo_Total", "Valor_Acumulado_Actual", "Meta_Diaria_Estandar", "Nivel_Rescate_Minimo", "Estado", "Racha_Actual", "Fecha_Programada", "Hora_Inicio", "Agendado_Calendar", "ID_Evento_Calendar"]];
mockData["BBDD_Finanzas_Ingresos"] = [["ID_Ingreso", "Tipo_Origen", "ID_Origen_Vinculado", "Fecha_Ingreso", "Descripcion_Ingreso", "Categoria_Ingreso", "Moneda_Original", "Monto_Original", "Tipo_Cambio", "Monto_PEN", "Metodo_Cobro", "Estado_Cobro"]];
mockData["BBDD_Subtareas_Pasos"] = [["ID_Subtarea", "ID_Padre", "Paso_Numero", "Descripcion_Paso", "Completada", "Bloqueada_Por_Predecesora", "Fecha_Completado"]];

const dashboardCode = fs.readFileSync(path.join(__dirname, '..', 'DashboardService.js'), 'utf8');
vm.runInContext(dashboardCode, context);
const DashboardService = vm.runInContext("DashboardService", context);

const dashData = DashboardService.getDashboardData();
assert.strictEqual(dashData.success, true, "getDashboardData should succeed");
assert(Array.isArray(dashData.cuotas), "dashData.cuotas should be an array");
assert.strictEqual(dashData.cuotas.length, 1, "Should have 1 synthesized plan");

const planSynth = dashData.cuotas[0];
assert.strictEqual(planSynth.ID_Cuota, "CUO-001");
assert.strictEqual(planSynth.Nombre_Plan, "Laptop Gamer Asus");
assert.strictEqual(planSynth.Monto_Total, 3600);
assert.strictEqual(planSynth.Num_Cuotas, 3);
assert.strictEqual(planSynth.Cuotas_Pagadas, 3);
assert.strictEqual(planSynth.Monto_Pagado, 3600);
assert.strictEqual(planSynth.Saldo_Pendiente, 0);
assert.strictEqual(planSynth.Estado, "COMPLETADO");
console.log("PASS: DashboardService in-memory cuotas aggregation verified.");

console.log("\nALL FASE 4.11 TESTS PASSED SUCCESSFULLY (Exit Code 0).");
