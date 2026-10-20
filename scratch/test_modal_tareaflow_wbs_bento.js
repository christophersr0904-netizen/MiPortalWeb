const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: MODAL_TAREAFLOW WBS & BENTO REFACTOR ===\n');

// 1. Validar Modal_TareaFlow.html
const modalHtml = fs.readFileSync(path.join(__dirname, '..', 'Modal_TareaFlow.html'), 'utf8');

// A. Erradicación de MAV
assert.strictEqual(modalHtml.includes('task-flow-chip-mav'), false, 'task-flow-chip-mav debe estar eliminado de Modal_TareaFlow.html');
assert.strictEqual(modalHtml.includes('task-flow-es-mav'), false, 'task-flow-es-mav debe estar eliminado de Modal_TareaFlow.html');
assert.strictEqual(modalHtml.includes('title="Alternar Mínimo Alcance Viable (MAV)"'), false, 'El tooltip de MAV debe estar eliminado');
console.log('✔ [1/6] MAV erradicado al 100% de Modal_TareaFlow.html');

// B. Presencia de contenedores WBS
assert.strictEqual(modalHtml.includes('id="task-flow-wbs-info"'), true, 'Debe existir task-flow-wbs-info para modo lectura/editar');
assert.strictEqual(modalHtml.includes('id="task-flow-wbs-selectors"'), true, 'Debe existir task-flow-wbs-selectors para modo crear');
assert.strictEqual(modalHtml.includes('id="task-flow-wbs-proy-text"'), true, 'Debe existir task-flow-wbs-proy-text');
assert.strictEqual(modalHtml.includes('id="task-flow-wbs-hito-text"'), true, 'Debe existir task-flow-wbs-hito-text');
assert.strictEqual(modalHtml.includes('id="task-flow-wbs-fase-container"'), true, 'Debe existir task-flow-wbs-fase-container');
assert.strictEqual(modalHtml.includes('id="task-flow-wbs-fase-text"'), true, 'Debe existir task-flow-wbs-fase-text');
console.log('✔ [2/6] Contenedor WBS dual (info / selectores) presente en Modal_TareaFlow.html');

// C. Presencia de Bento Grid con los 3 bloques
assert.strictEqual(modalHtml.includes('Tiempo & Esfuerzo'), true, 'Tile 1 Tiempo & Esfuerzo debe existir');
assert.strictEqual(modalHtml.includes('id="task-flow-bento-horas-est"'), true, 'Badge horas estimadas en Bento debe existir');
assert.strictEqual(modalHtml.includes('id="task-flow-bento-horas-rea"'), true, 'Badge horas reales en Bento debe existir');

assert.strictEqual(modalHtml.includes('Operativo & Flujo'), true, 'Tile 2 Operativo & Flujo debe existir');
assert.strictEqual(modalHtml.includes('id="task-flow-chip-prioridad"'), true, 'task-flow-chip-prioridad debe existir en Bento Operativo');
assert.strictEqual(modalHtml.includes('id="task-flow-chip-energia"'), true, 'task-flow-chip-energia debe existir en Bento Operativo');
assert.strictEqual(modalHtml.includes('id="task-flow-chip-dependencia"'), true, 'task-flow-chip-dependencia debe existir en Bento Operativo');

assert.strictEqual(modalHtml.includes('Financiero & Entorno'), true, 'Tile 3 Financiero & Entorno debe existir');
assert.strictEqual(modalHtml.includes('id="task-flow-chip-gasto"'), true, 'task-flow-chip-gasto debe existir');
assert.strictEqual(modalHtml.includes('id="task-flow-chip-lugar"'), true, 'task-flow-chip-lugar debe existir');
assert.strictEqual(modalHtml.includes('id="task-flow-chip-notas"'), true, 'task-flow-chip-notas debe existir');
console.log('✔ [3/6] Bento Grid estructurado con 3 tiles validado en Modal_TareaFlow.html');

// 2. Simulación de ejecución de JS_TareaFlow.html
const jsTareaFlowRaw = fs.readFileSync(path.join(__dirname, '..', 'JS_TareaFlow.html'), 'utf8');

// Extraer solo el contenido dentro de <script> ... </script>
const scriptMatch = jsTareaFlowRaw.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
const scriptContent = scriptMatch ? scriptMatch[1] : jsTareaFlowRaw;

// Crear entorno simulado de DOM y estado
const mockDOM = {};
function createMockElement(id) {
  const el = {
    id: id,
    classList: {
      classes: new Set(),
      add: function(c) { el.classList.classes.add(c); },
      remove: function(c) { el.classList.classes.delete(c); },
      contains: function(c) { return el.classList.classes.has(c); }
    },
    textContent: '',
    value: '',
    title: '',
    innerHTML: '',
    style: {},
    disabled: false,
    focus: function() {}
  };
  mockDOM[id] = el;
  return el;
}

// Inicializar elementos clave
[
  'task-flow-pry-label', 'task-flow-hit-label', 'task-flow-pry-val', 'task-flow-hit-val',
  'task-flow-pry-btn', 'task-flow-hit-btn', 'task-flow-wbs-info', 'task-flow-wbs-selectors',
  'task-flow-wbs-proy-text', 'task-flow-wbs-hito-text', 'task-flow-wbs-fase-container', 'task-flow-wbs-fase-text',
  'task-flow-bento-horas-est', 'task-flow-bento-horas-rea',
  'task-flow-badge-id', 'task-flow-badge-notas', 'task-flow-id', 'task-flow-btn-archivar', 'task-flow-btn-eliminar',
  'task-flow-btn-submit', 'task-flow-titulo', 'task-flow-notas', 'task-flow-lugar-input', 'task-flow-lugar-section',
  'task-flow-gasto-section', 'task-flow-gasto-monto', 'task-flow-gasto-desc', 'task-flow-notas-section',
  'task-flow-chip-datetime-label', 'task-flow-chip-energia-label', 'task-flow-chip-prioridad-label',
  'task-flow-chip-prioridad', 'task-flow-chip-dependencia-label', 'task-flow-estado-label', 'task-flow-estado-btn',
  'task-flow-estado-val', 'task-flow-prioridad-val', 'task-flow-energia-val', 'task-flow-fecha-val', 'task-flow-hora-val',
  'task-flow-horas-est-val', 'task-flow-horas-rea-val', 'task-flow-horas-label', 'task-flow-picker-horas-input'
].forEach(createMockElement);

const state = {
  proyectos: [
    { ID_Proyecto: 'PRO-001', Nombre_Proyecto: 'Rediseño Portal Web', Moneda_Base: 'PEN' },
    { ID_Proyecto: 'PRO-002', Nombre_Proyecto: 'Sistema ERP Fase 2', Moneda_Base: 'USD' }
  ],
  hitos: [
    { ID_Hito: 'WP-001', Nombre_Hito: 'Maquetado Frontend', ID_Proyecto: 'PRO-001', Fase_Asociada: 'Fase 1: Diseño' },
    { ID_Hito: 'WP-002', Nombre_Hito: 'Integración API', ID_Proyecto: 'PRO-002', Fase_Asociada: 'Fase 2: Backend' }
  ],
  tareas: [
    {
      ID_Tarea: 'TAR-017',
      Nombre_Tarea_Actividad: 'Instalación de medidor y pruebas',
      ID_Hito: 'WP-001',
      // ID_Proyecto ausente o incorrecto para probar resolución canónica
      ID_Proyecto: '',
      Estado_Tarea: '03_En_Proceso',
      Prioridad_Eisenhower: '01_P1_Alta',
      Nivel_Energia_Requerido: 'Alta_Estrategica',
      Horas_Estimadas: 3.5,
      Horas_Reales: 1.5,
      Fecha_Programada: '2026-10-15 10:00'
    }
  ],
  gastos: [],
  subtareas: []
};

// Sandbox de ejecución
const sandbox = {
  window: {},
  document: {
    getElementById: function(id) {
      return mockDOM[id] || createMockElement(id);
    }
  },
  state: state,
  openModal: function() {},
  closeModal: function() {},
  recalcularAvanceCascada: function() {},
  calcularAvanceTarea: function() {},
  calcularAvanceHito: function() {},
  calcularAvanceProyectoCascada: function() {},
  calcularAvancesProyecto: function() {},
  ordenarHitosCronologicamente: function() {},
  obtenerPesosEfectivosHitos: function() {},
  actualizarSelectorHitosKanban: function() {},
  formatHoraLimpia: function(h) { return h ? h.substring(0, 5) : '--:--'; },
  Date: Date,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  parseInt: parseInt,
  parseFloat: parseFloat,
  Math: Math,
  String: String,
  Array: Array,
  Object: Object,
  console: console
};

const vm = require('vm');
vm.createContext(sandbox);
vm.runInContext(scriptContent, sandbox);

console.log('✔ [4/6] Script JS_TareaFlow.html evaluado correctamente sin errores sintácticos');

// Test 5: Abrir tarea existente en modo EDITAR (verificar resolución canónica WBS)
sandbox.abrirModalEditarTareaFlow('TAR-017');

assert.strictEqual(sandbox.taskFlowState.modo, 'EDITAR', 'taskFlowState.modo debe ser EDITAR');
assert.strictEqual(sandbox.taskFlowState.idProyecto, 'PRO-001', 'idProyecto debe resolverse canónicamente como PRO-001 desde WP-001');
assert.strictEqual(sandbox.taskFlowState.idHito, 'WP-001', 'idHito debe ser WP-001');

// Verificar que task-flow-wbs-info esté visible y task-flow-wbs-selectors esté oculto
assert.strictEqual(mockDOM['task-flow-wbs-info'].classList.contains('hidden'), false, 'task-flow-wbs-info debe estar visible en modo EDITAR');
assert.strictEqual(mockDOM['task-flow-wbs-selectors'].classList.contains('hidden'), true, 'task-flow-wbs-selectors debe estar oculto en modo EDITAR');

// Verificar textos de WBS
assert.strictEqual(mockDOM['task-flow-wbs-proy-text'].textContent, '[PRO-001] Rediseño Portal Web', 'El texto del proyecto debe coincidir');
assert.strictEqual(mockDOM['task-flow-wbs-hito-text'].textContent, '[WP-001] Maquetado Frontend', 'El texto del hito debe coincidir');
assert.strictEqual(mockDOM['task-flow-wbs-fase-text'].textContent, 'Fase 1: Diseño', 'La fase asociada debe coincidir');
assert.strictEqual(mockDOM['task-flow-wbs-fase-container'].classList.contains('hidden'), false, 'La fase debe estar visible');

// Verificar Bento Grid horas
assert.strictEqual(mockDOM['task-flow-bento-horas-est'].textContent, '3.5h', 'Horas estimadas en Bento deben ser 3.5h');
assert.strictEqual(mockDOM['task-flow-bento-horas-rea'].textContent, '1.5h', 'Horas reales en Bento deben ser 1.5h');

console.log('✔ [5/6] Modo EDITAR: Resolución WBS canónica y Bento Grid validados con éxito');

// Test 6: Abrir modal en modo CREAR (verificar selectores interactivos)
sandbox.abrirModalCrearTareaFlow('PRO-002', 'WP-002', '02_Por_Hacer');

assert.strictEqual(sandbox.taskFlowState.modo, 'CREAR', 'taskFlowState.modo debe ser CREAR');
assert.strictEqual(mockDOM['task-flow-wbs-info'].classList.contains('hidden'), true, 'task-flow-wbs-info debe estar oculto en modo CREAR');
assert.strictEqual(mockDOM['task-flow-wbs-selectors'].classList.contains('hidden'), false, 'task-flow-wbs-selectors debe estar visible en modo CREAR');
assert.strictEqual(mockDOM['task-flow-pry-label'].textContent, '[PRO-002] Sistema ERP Fase 2', 'El selector de proyecto debe mostrar el proyecto asignado');
assert.strictEqual(mockDOM['task-flow-hit-label'].textContent, '[WP-002] Integración API', 'El selector de hito debe mostrar el hito asignado');
assert.strictEqual(mockDOM['task-flow-bento-horas-est'].textContent, '1.0h', 'Horas estimadas por defecto deben ser 1.0h en Bento');
assert.strictEqual(mockDOM['task-flow-bento-horas-rea'].textContent, '0.0h', 'Horas reales por defecto deben ser 0.0h en Bento');

console.log('✔ [6/6] Modo CREAR: Selectores interactivos y Bento Grid validados con éxito');

console.log('\n=======================================================');
console.log('TODAS LAS PRUEBAS AUTOMATIZADAS PASARON EXITOSAMENTE (6/6)');
console.log('=======================================================');
