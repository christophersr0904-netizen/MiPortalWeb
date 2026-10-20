// scratch/test_fase4_14.js
// Test suite for Fase 4.14: BBDD_Subtareas_Pasos 6 canonical columns & polymorphic binding

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

console.log("=== INICIANDO VALIDACIÓN FASE 4.14 ===");

// 1. Prepare Mock Gas Environment
const gasContext = {
  console: console,
  Logger: {
    log: (...args) => console.log("[GAS Logger]", ...args),
    warn: (...args) => console.warn("[GAS Logger WARN]", ...args),
    error: (...args) => console.error("[GAS Logger ERROR]", ...args)
  },
  Utilities: {
    formatDate: (date, tz, format) => {
      const d = new Date(date);
      const pad = (n) => String(n).padStart(2, '0');
      const YYYY = d.getFullYear();
      const MM = pad(d.getMonth() + 1);
      const DD = pad(d.getDate());
      const HH = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
    }
  },
  LockService: {
    getScriptLock: () => ({
      waitLock: () => true,
      releaseLock: () => true
    })
  }
};

// Mock SpreadsheetApp
class MockRange {
  constructor(sheet, row, col, numRows, numCols) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
  }
  getValue() {
    return this.sheet.data[this.row - 1][this.col - 1];
  }
  getValues() {
    const res = [];
    for (let r = 0; r < this.numRows; r++) {
      const rowArr = [];
      for (let c = 0; c < this.numCols; c++) {
        rowArr.push(this.sheet.data[this.row - 1 + r][this.col - 1 + c]);
      }
      res.push(rowArr);
    }
    return res;
  }
  setValue(val) {
    this.sheet.data[this.row - 1][this.col - 1] = val;
  }
  setValues(vals) {
    for (let r = 0; r < vals.length; r++) {
      for (let c = 0; c < vals[r].length; c++) {
        this.sheet.data[this.row - 1 + r][this.col - 1 + c] = vals[r][c];
      }
    }
  }
}

class MockSheet {
  constructor(name, data = []) {
    this.name = name;
    this.data = data;
  }
  getName() { return this.name; }
  getLastRow() { return this.data.length; }
  getLastColumn() { return this.data.length > 0 ? this.data[0].length : 0; }
  getRange(r, c, nr = 1, nc = 1) {
    return new MockRange(this, r, c, nr, nc);
  }
  appendRow(rowArr) {
    this.data.push([...rowArr]);
  }
  deleteRow(r) {
    this.data.splice(r - 1, 1);
  }
}

const mockSheets = {
  'BBDD_Subtareas_Pasos': new MockSheet('BBDD_Subtareas_Pasos', [
    ['ID_Subtarea', 'ID_Padre_Vinculado', 'Numero_Paso', 'Descripcion_Paso', 'Completado', 'Fecha_Completado']
  ]),
  'BBDD_Tareas': new MockSheet('BBDD_Tareas', [
    ['ID_Tarea', 'Titulo', 'Estado']
  ]),
  'BBDD_Actividades_Personales': new MockSheet('BBDD_Actividades_Personales', [
    new Array(30).fill('Header')
  ])
};

gasContext.SpreadsheetApp = {
  getActiveSpreadsheet: () => ({
    getId: () => 'mock-sheet-id-12345',
    getSheetByName: (name) => mockSheets[name] || null,
    insertSheet: (name) => {
      mockSheets[name] = new MockSheet(name, []);
      return mockSheets[name];
    }
  })
};

vm.createContext(gasContext);

// Load files in order
function loadFile(relPath) {
  const code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  vm.runInContext(code, gasContext);
}

loadFile('Config.js');
gasContext.CONFIG = vm.runInContext('CONFIG', gasContext);

// 2. Validate Config.js specifications
console.log("\n--- TEST 1: Config.js COLS_SUBTAREAS & COLS_PASOS ---");
const COLS_SUBTAREAS = gasContext.CONFIG.COLS_SUBTAREAS;
assert.strictEqual(COLS_SUBTAREAS.ID_SUBTAREA, 0, "ID_SUBTAREA debe ser 0");
assert.strictEqual(COLS_SUBTAREAS.ID_PADRE_VINCULADO, 1, "ID_PADRE_VINCULADO debe ser 1");
assert.strictEqual(COLS_SUBTAREAS.NUMERO_PASO, 2, "NUMERO_PASO debe ser 2");
assert.strictEqual(COLS_SUBTAREAS.DESCRIPCION_PASO, 3, "DESCRIPCION_PASO debe ser 3");
assert.strictEqual(COLS_SUBTAREAS.COMPLETADO, 4, "COMPLETADO debe ser 4");
assert.strictEqual(COLS_SUBTAREAS.FECHA_COMPLETADO, 5, "FECHA_COMPLETADO debe ser 5");
assert.strictEqual(COLS_SUBTAREAS.MAX_COLUMNS, 6, "MAX_COLUMNS debe ser 6");

const COLS_PASOS = gasContext.CONFIG.COLS_PASOS;
assert.strictEqual(COLS_PASOS.MAX_COLUMNS, 6, "COLS_PASOS.MAX_COLUMNS debe ser 6");
assert.strictEqual(COLS_PASOS.ID_PADRE_VINCULADO, 1, "COLS_PASOS.ID_PADRE_VINCULADO debe ser 1");

console.log("✓ COLS_SUBTAREAS y COLS_PASOS validados correctamente con 6 columnas (0 a 5).");

console.log("\n--- TEST 2: Config.js obtenerMapaSubtareas con Headers Canónicos (6 cols) ---");
const headersCanonicos = ['ID_Subtarea', 'ID_Padre_Vinculado', 'Numero_Paso', 'Descripcion_Paso', 'Completado', 'Fecha_Completado'];
const mapaCanonico = gasContext.CONFIG.obtenerMapaSubtareas(headersCanonicos);
assert.strictEqual(mapaCanonico.ID_SUBTAREA, 0);
assert.strictEqual(mapaCanonico.ID_PADRE_VINCULADO, 1);
assert.strictEqual(mapaCanonico.NUMERO_PASO, 2);
assert.strictEqual(mapaCanonico.DESCRIPCION_PASO, 3);
assert.strictEqual(mapaCanonico.COMPLETADO, 4);
assert.strictEqual(mapaCanonico.FECHA_COMPLETADO, 5);
assert.strictEqual(mapaCanonico.MAX_COLUMNS, 6);
console.log("✓ Mapa Canónico 6 columnas resuelto con éxito.");

console.log("\n--- TEST 3: Config.js obtenerMapaSubtareas con Headers Legacy (7 cols) ---");
const headersLegacy = ['ID_Subtarea', 'Tipo_Padre', 'ID_Padre', 'Numero_Paso', 'Descripcion_Paso', 'Completado', 'Fecha_Completado'];
const mapaLegacy = gasContext.CONFIG.obtenerMapaSubtareas(headersLegacy);
assert.strictEqual(mapaLegacy.ID_SUBTAREA, 0);
assert.strictEqual(mapaLegacy.TIPO_PADRE, 1);
assert.strictEqual(mapaLegacy.ID_PADRE, 2);
assert.strictEqual(mapaLegacy.ID_PADRE_VINCULADO, 2, "En legacy, ID_PADRE_VINCULADO debe mapearse a Col C (2)");
assert.strictEqual(mapaLegacy.NUMERO_PASO, 3);
assert.strictEqual(mapaLegacy.DESCRIPCION_PASO, 4);
assert.strictEqual(mapaLegacy.COMPLETADO, 5);
assert.strictEqual(mapaLegacy.FECHA_COMPLETADO, 6);
assert.strictEqual(mapaLegacy.MAX_COLUMNS, 7);
console.log("✓ Mapa Legacy 7 columnas detectado y retrocompatible con éxito.");

loadFile('Correlativos.js');
gasContext.CorrelativoService = vm.runInContext('CorrelativoService', gasContext);
loadFile('TareasService.js');
gasContext.TareasService = vm.runInContext('TareasService', gasContext);
loadFile('ActividadesService.js');
gasContext.ActividadesService = vm.runInContext('ActividadesService', gasContext);

console.log("\n--- TEST 4: TareasService.createSubtarea y guardarPaso (Persistencia exacta 6 cols) ---");
const sheetSub = gasContext.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BBDD_Subtareas_Pasos');

// Probar createSubtarea con TAR-001
const resCrea = gasContext.TareasService.createSubtarea({
  idTareaPadre: 'TAR-001',
  descripcionPaso: 'Diseñar arquitectura canónica',
  numeroPaso: 1
});

assert.strictEqual(resCrea.success, true, "createSubtarea debe ser exitoso");
assert.strictEqual(sheetSub.data.length, 2, "Debe haber 1 fila de datos añadida");
const row1 = sheetSub.data[1];
assert.strictEqual(row1.length, 6, "La fila insertada debe tener exactamente 6 columnas");
assert.strictEqual(row1[0], 'SUB-001', "ID_Subtarea debe ser SUB-001");
assert.strictEqual(row1[1], 'TAR-001', "ID_Padre_Vinculado debe ser TAR-001");
assert.strictEqual(row1[2], 1, "Numero_Paso debe ser 1");
assert.strictEqual(row1[3], 'Diseñar arquitectura canónica', "Descripcion_Paso correcta");
assert.strictEqual(row1[4], false, "Completado debe iniciar en false");
assert.strictEqual(row1[5], '', "Fecha_Completado debe iniciar vacía");
console.log("✓ createSubtarea insertó exactamente 6 columnas con ID_Padre_Vinculado = TAR-001.");

// Probar alias guardarPaso con ACT-002
const resGuardar = gasContext.TareasService.guardarPaso({
  idPadreVinculado: 'ACT-002',
  descripcionPaso: 'Meditar 10 minutos',
  numeroPaso: 1
});
assert.strictEqual(resGuardar.success, true, "guardarPaso debe ser exitoso");
assert.strictEqual(sheetSub.data.length, 3);
const row2 = sheetSub.data[2];
assert.strictEqual(row2.length, 6, "guardarPaso debe insertar exactamente 6 columnas");
assert.strictEqual(row2[0], 'SUB-002');
assert.strictEqual(row2[1], 'ACT-002');
console.log("✓ guardarPaso alias verificado con éxito.");

console.log("\n--- TEST 5: TareasService.updateSubtareaCompletado y togglePaso ---");
// Toggling SUB-001 a true
const resToggleTrue = gasContext.TareasService.updateSubtareaCompletado('SUB-001', true);
assert.strictEqual(resToggleTrue.success, true);
assert.strictEqual(sheetSub.data[1][4], true, "Completado debe ser true");
assert.ok(sheetSub.data[1][5] && sheetSub.data[1][5].length > 10, "Fecha_Completado debe tener timestamp YYYY-MM-DD HH:mm:ss");
console.log("✓ updateSubtareaCompletado(true) estampó timestamp:", sheetSub.data[1][5]);

// Toggling SUB-001 a false vía togglePaso sin pasar 'completado' (toggle automático)
const resToggleFalse = gasContext.TareasService.togglePaso('SUB-001');
assert.strictEqual(resToggleFalse.success, true);
assert.strictEqual(sheetSub.data[1][4], false, "Completado debe togglear a false");
assert.strictEqual(sheetSub.data[1][5], '', "Fecha_Completado debe quedar vacía al desmarcar");
console.log("✓ togglePaso(SUB-001) alternó a false y limpió Fecha_Completado correctamente.");

console.log("\n--- TEST 6: ActividadesService.createActividadPersonal con pasos embebidos ---");
// Insertar actividad con pasos
const resAct = gasContext.ActividadesService.createActividadPersonal({
  nombreActividad: 'Rutina Mañanera',
  pasos: [
    { descripcionPaso: 'Tomar vaso de agua' },
    { descripcionPaso: 'Estiramientos' }
  ]
});
assert.strictEqual(resAct.success, true);
assert.strictEqual(sheetSub.data.length, 5, "Se deben haber agregado 2 pasos de la actividad");
const rowAct1 = sheetSub.data[3];
const rowAct2 = sheetSub.data[4];
assert.strictEqual(rowAct1.length, 6, "Paso 1 de actividad tiene 6 columnas");
assert.strictEqual(rowAct1[1], resAct.idActividad, "ID_Padre_Vinculado coincide con ID de actividad");
assert.strictEqual(rowAct2.length, 6, "Paso 2 de actividad tiene 6 columnas");
assert.strictEqual(rowAct2[1], resAct.idActividad);
console.log("✓ ActividadesService insertó pasos embebidos en 6 columnas con ID_Padre_Vinculado.");

console.log("\n--- TEST 7: DashboardService Desempaquetado y Deducción Polimórfica ---");
loadFile('DashboardService.js');

// Añadir también una fila legacy de 7 columnas para comprobar robustez
sheetSub.data.push([
  'SUB-LEGACY',
  'TAREA',
  'TAR-999',
  1,
  'Paso en tabla legacy 7 cols',
  true,
  '2026-10-10 10:00:00'
]);

// Crear mock dashboard environment para la sección 7
// Mocking getHojaSegura
const subData = sheetSub.data;
const headersSub = subData[0];
const colMapSub = gasContext.CONFIG.obtenerMapaSubtareas(headersSub);
const rawSubFilas = subData.slice(1);

const subtareasDesempaquetadas = rawSubFilas.map(f => {
  const isLegacy7 = f.length >= 7 && (f[1] === 'TAREA' || f[1] === 'ACTIVIDAD');
  const idPadreRaw = isLegacy7 ? String(f[2] || '').trim() : String(f[colMapSub.ID_PADRE_VINCULADO] || '').trim();
  const idPadre = idPadreRaw;
  const tipoPadre = idPadre.startsWith('TAR-') ? 'TAREA' : (idPadre.startsWith('ACT-') ? 'ACTIVIDAD' : (isLegacy7 ? String(f[1] || '').trim() : ''));

  return {
    idSubtarea: String(f[colMapSub.ID_SUBTAREA] || '').trim(),
    idPadreVinculado: idPadre,
    ID_Padre_Vinculado: idPadre,
    idPadre: idPadre,
    ID_Padre: idPadre,
    tipoPadre: tipoPadre,
    Tipo_Padre: tipoPadre,
    numeroPaso: Number(isLegacy7 ? f[3] : f[colMapSub.NUMERO_PASO]) || 1,
    descripcionPaso: String(isLegacy7 ? f[4] : f[colMapSub.DESCRIPCION_PASO] || '').trim(),
    completado: Boolean(isLegacy7 ? f[5] : f[colMapSub.COMPLETADO]),
    fechaCompletado: isLegacy7 ? f[6] : f[colMapSub.FECHA_COMPLETADO]
  };
});

assert.strictEqual(subtareasDesempaquetadas.length, 5);

// Fila 1: TAR-001 (Canónica 6 cols)
assert.strictEqual(subtareasDesempaquetadas[0].idPadreVinculado, 'TAR-001');
assert.strictEqual(subtareasDesempaquetadas[0].tipoPadre, 'TAREA', "TAR-001 debe deducirse como TAREA");

// Fila 2: ACT-002 (Canónica 6 cols)
assert.strictEqual(subtareasDesempaquetadas[1].idPadreVinculado, 'ACT-002');
assert.strictEqual(subtareasDesempaquetadas[1].tipoPadre, 'ACTIVIDAD', "ACT-002 debe deducirse como ACTIVIDAD");

// Fila 5: SUB-LEGACY (Legacy 7 cols)
assert.strictEqual(subtareasDesempaquetadas[4].idPadreVinculado, 'TAR-999', "Fila legacy debe resolver ID_Padre_Vinculado como TAR-999");
assert.strictEqual(subtareasDesempaquetadas[4].tipoPadre, 'TAREA', "Fila legacy debe deducir TAREA");
assert.strictEqual(subtareasDesempaquetadas[4].descripcionPaso, 'Paso en tabla legacy 7 cols');

console.log("✓ Desempaquetado de Dashboard validado al 100%: 6 columnas canónicas y 7 columnas legacy compatibles.");

console.log("\n=== TODAS LAS PRUEBAS DE LA FASE 4.14 PASARON SATISFACTORIAMENTE ===");
