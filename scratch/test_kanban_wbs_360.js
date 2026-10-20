const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log("=== INICIO DE PRUEBAS DE INTEGRACIÓN: KANBAN & WBS 360 & DASHBOARDSERVICE ===");

// -----------------------------------------------------------------------------
// PRUEBA 1: ERRADICACIÓN TOTAL DE MAV EN VIEW_KANBAN Y JS_KANBAN
// -----------------------------------------------------------------------------
console.log("\n[TEST 1] Verificando eliminación de MAV en Kanban...");
const viewKanbanPath = path.join(__dirname, '..', 'View_Kanban.html');
const viewKanbanContent = fs.readFileSync(viewKanbanPath, 'utf8');

assert.strictEqual(
  viewKanbanContent.includes('btn-toggle-modo-mav'),
  false,
  "FAIL: View_Kanban.html todavía contiene el botón btn-toggle-modo-mav"
);
assert.strictEqual(
  viewKanbanContent.includes('badge-count-mav'),
  false,
  "FAIL: View_Kanban.html todavía contiene el contador badge-count-mav"
);
console.log("✓ View_Kanban.html: DOM libre de selectores, botones y badges MAV.");

const jsKanbanPath = path.join(__dirname, '..', 'JS_Kanban.html');
const jsKanbanContent = fs.readFileSync(jsKanbanPath, 'utf8');

// Verificar que crearCardTareaHtml no inyecte badgeMavHtml
assert.strictEqual(
  jsKanbanContent.includes('badgeMavHtml'),
  false,
  "FAIL: JS_Kanban.html aún inyecta badgeMavHtml en crearCardTareaHtml"
);
assert.strictEqual(
  jsKanbanContent.includes('totalMavCount'),
  false,
  "FAIL: JS_Kanban.html aún cuenta totalMavCount"
);
console.log("✓ JS_Kanban.html: crearCardTareaHtml y filtros libres de badges/variables MAV.");

// -----------------------------------------------------------------------------
// PRUEBA 2: RECONSTRUCCIÓN DEL ÁRBOL WBS DE 4 NIVELES CANÓNICOS EN JS_GRAFORED
// -----------------------------------------------------------------------------
console.log("\n[TEST 2] Verificando árbol jerárquico canónico de 4 niveles en JS_GrafoRed.html...");
const jsGrafoPath = path.join(__dirname, '..', 'JS_GrafoRed.html');
const jsGrafoContent = fs.readFileSync(jsGrafoPath, 'utf8');

// Extraer el script interno de JS_GrafoRed.html
const scriptMatch = jsGrafoContent.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
assert.ok(scriptMatch, "No se encontró tag script en JS_GrafoRed.html");
const jsGrafoCode = scriptMatch[1];

// Montar entorno sandbox de simulación
const sandbox = {
  window: {},
  document: {
    getElementById: (id) => null
  },
  console: console,
  Map: Map,
  Set: Set,
  state: {
    proyectos: [
      {
        ID_Proyecto: 'PRO-001',
        Nombre_Proyecto: 'Proyecto Alpha',
        Estado_Proyecto: '02_En_Ejecucion',
        Magnitud_Complejidad: 'XS - UltraLigero', // Notar: T-shirt ultra ligera
        Fecha_Inicio_Plan: '2026-01-01',
        Fecha_Fin_Plan: '2026-12-31'
      }
    ],
    hitos: [
      {
        ID_Elemento_WBS: 'WP-001',
        ID_Hito: 'WP-001',
        ID_Proyecto: 'PRO-001',
        Tipo_Elemento_WBS: 'PAQUETE_TRABAJO',
        Nombre_Elemento: 'Paquete de Diseño',
        Nombre_Hito: 'Paquete de Diseño',
        Fase_Asociada: 'Fase 1: Diseño',
        Estado_Hito: '02_En_Proceso',
        Peso_Ponderado_Pct: 0.5,
        Presupuesto_Asignado: 5000
      },
      {
        ID_Elemento_WBS: 'HIT-001',
        ID_Hito: 'HIT-001',
        ID_Proyecto: 'PRO-001',
        Tipo_Elemento_WBS: 'HITO_MARCADOR',
        Nombre_Elemento: 'Aprobación de Arquitectura',
        Nombre_Hito: 'Aprobación de Arquitectura',
        Fase_Asociada: 'Fase 1: Diseño',
        Estado_Hito: '03_Completado',
        Peso_Ponderado_Pct: 0.1,
        Presupuesto_Asignado: 0.00
      },
      {
        ID_Elemento_WBS: 'WP-002',
        ID_Hito: 'WP-002',
        ID_Proyecto: 'PRO-001',
        Tipo_Elemento_WBS: 'PAQUETE_TRABAJO',
        Nombre_Elemento: 'Paquete de Despliegue',
        Nombre_Hito: 'Paquete de Despliegue',
        Fase_Asociada: 'Fase 2: Despliegue',
        Estado_Hito: '01_Pendiente',
        Peso_Ponderado_Pct: 0.4,
        Presupuesto_Asignado: 8000
      }
    ],
    tareas: [
      {
        ID_Tarea: 'TAR-001',
        ID_Proyecto: 'PRO-001',
        ID_Hito: 'WP-001',
        Nombre_Tarea_Actividad: 'Wireframing UI',
        Estado_Tarea: '03_En_Proceso',
        Prioridad: '01_P1_Alta'
      },
      {
        ID_Tarea: 'TAR-002',
        ID_Proyecto: 'PRO-001',
        ID_Hito: 'WP-001',
        Nombre_Tarea_Actividad: 'Prototipo Figma',
        Estado_Tarea: '04_Completado',
        Prioridad: '02_P2_Media'
      },
      {
        ID_Tarea: 'TAR-003',
        ID_Proyecto: 'PRO-001',
        ID_Hito: 'WP-002',
        Nombre_Tarea_Actividad: 'Release v1.0',
        Estado_Tarea: '05_Archivado',
        Prioridad: '03_P3_Baja'
      }
    ],
    gastos: [],
    proyectoDetalleActivo: {
      ID_Proyecto: 'PRO-001'
    }
  }
};

vm.createContext(sandbox);
vm.runInContext(jsGrafoCode, sandbox);

// Probar compilación del dataset
assert.strictEqual(typeof sandbox.compilarDatasetGrafoProyecto, 'function', "compilarDatasetGrafoProyecto no es una función");

const dataset = sandbox.compilarDatasetGrafoProyecto('PRO-001');
assert.ok(dataset, "Dataset retornado es nulo");
assert.ok(Array.isArray(dataset.nodes), "dataset.nodes no es array");
assert.ok(Array.isArray(dataset.connectors), "dataset.connectors no es array");

const nodosPorTipo = {};
dataset.nodes.forEach(n => {
  nodosPorTipo[n.tipo] = (nodosPorTipo[n.tipo] || 0) + 1;
});

console.log("   Distribución de Nodos Compilados:", nodosPorTipo);

// Verificación de los 4 niveles canónicos
// Nivel 1: Proyecto (PRO-XXX)
assert.strictEqual(nodosPorTipo['PROYECTO'], 1, "Debe haber 1 nodo de PROYECTO (Nivel 1)");

// Nivel 2: Fases (agrupador extraído de Fase_Asociada)
assert.strictEqual(nodosPorTipo['FASE'], 2, "Debe haber 2 nodos de FASE (Nivel 2: Fase 1 y Fase 2)");

// Nivel 3: Paquetes WP e Hitos Marcadores
assert.strictEqual(nodosPorTipo['HITO'], 2, "Debe haber 2 nodos de WP (WP-001 y WP-002)");
assert.strictEqual(nodosPorTipo['HITO_MARCADOR'], 1, "Debe haber 1 nodo de HITO_MARCADOR (HIT-001)");

// Nivel 4: Tareas Operativas
assert.strictEqual(nodosPorTipo['TAREA'], 3, "Debe haber 3 nodos de TAREA (TAR-001, TAR-002, TAR-003)");

console.log("✓ Estructura de 4 niveles canónicos verificada con éxito.");

// Verificación de representación de tarjetas en renderTarjetaNodo
const renderFn = sandbox.renderTarjetaNodo || sandbox.window.renderTarjetaNodo || sandbox.window.construirHtmlTarjetaNodo;
assert.strictEqual(typeof renderFn, 'function', "renderTarjetaNodo no es función");

const nodeMarcador = dataset.nodes.find(n => n.id === 'HIT-001');
const htmlMarcador = renderFn(nodeMarcador);
assert.ok(htmlMarcador.includes('◆') || htmlMarcador.includes('rotate-45') || htmlMarcador.includes('HITO_MARCADOR'), "Hito Marcador debe contener el rombo o indicador de control");
assert.ok(htmlMarcador.includes('$0.00'), "Hito Marcador debe mostrar $0.00");
console.log("✓ Hito Marcador renderizado con rombo de control y costo $0.00.");

const nodeTareaDone = dataset.nodes.find(n => n.id === 'TAR-002');
const htmlTareaDone = renderFn(nodeTareaDone);
assert.ok(htmlTareaDone.includes('✓ Hecho'), "Tarea completada debe mostrar ✓ Hecho");

const nodeTareaArch = dataset.nodes.find(n => n.id === 'TAR-003');
const htmlTareaArch = renderFn(nodeTareaArch);
assert.ok(htmlTareaArch.includes('📦 Archivado'), "Tarea archivada debe mostrar 📦 Archivado");
console.log("✓ Tareas completadas y archivadas muestran sus iconos de estado.");

// -----------------------------------------------------------------------------
// PRUEBA 3: PAYLOAD Y CACHÉ EN DASHBOARDSERVICE.JS
// -----------------------------------------------------------------------------
console.log("\n[TEST 3] Verificando DashboardService.js payload y caché...");
const dashPath = path.join(__dirname, '..', 'DashboardService.js');
const dashContent = fs.readFileSync(dashPath, 'utf8');

assert.ok(
  dashContent.includes('proyObj.fasesUnicas = fasesUnicas;'),
  "FAIL: DashboardService.js no asigna fasesUnicas a proyObj"
);
assert.ok(
  dashContent.includes('proyObj.hitos = hitosDelProy;'),
  "FAIL: DashboardService.js no asigna hitos a proyObj"
);
assert.ok(
  dashContent.includes('proyObj.tareas = tareasDelProy;'),
  "FAIL: DashboardService.js no asigna tareas a proyObj"
);
assert.ok(
  dashContent.includes('cache.removeAll'),
  "FAIL: DashboardService.js no utiliza cache.removeAll"
);
assert.ok(
  dashContent.includes('invalidarCache: function ()'),
  "FAIL: DashboardService.js no expone invalidarCache"
);

console.log("✓ DashboardService expone fasesUnicas, hitos y tareas en proyObj y cuenta con invalidación atómica removeAll.");

console.log("\n=== TODAS LAS PRUEBAS PASARON EXITOSAMENTE (3/3) ===");
