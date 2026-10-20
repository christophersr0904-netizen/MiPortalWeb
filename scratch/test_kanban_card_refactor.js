// scratch/test_kanban_card_refactor.js
// Test suite para verificar crearTarjetaKanbanHTML en JS_Kanban.html

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const kanbanPath = path.join(__dirname, '..', 'JS_Kanban.html');
const kanbanContent = fs.readFileSync(kanbanPath, 'utf8');

// Extraer el contenido dentro de <script> ... </script>
const scriptMatches = kanbanContent.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
if (!scriptMatches || scriptMatches.length === 0) {
  console.error("No se encontraron etiquetas <script> en JS_Kanban.html");
  process.exit(1);
}

// Mock DOM environment
class MockDOMElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.id = '';
    this.draggable = false;
    this.className = '';
    this.dataset = {};
    this.classList = {
      _classes: new Set(),
      add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
      remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
      contains: (c) => this.classList._classes.has(c)
    };
    this._attributes = {};
    this.innerHTML = '';
    this._eventListeners = {};
  }
  querySelector(sel) { return new MockDOMElement('div'); }
  querySelectorAll(sel) { return []; }
  setAttribute(k, v) { this._attributes[k] = String(v); }
  getAttribute(k) { return this._attributes[k]; }
  addEventListener(event, fn) {
    this._eventListeners[event] = this._eventListeners[event] || [];
    this._eventListeners[event].push(fn);
  }
}

const mockDocument = {
  createElement: (tag) => new MockDOMElement(tag),
  getElementById: (id) => new MockDOMElement('div'),
  querySelector: (sel) => new MockDOMElement('div'),
  querySelectorAll: (sel) => [],
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Global state mock
const mockState = {
  proyectos: [
    { ID_Proyecto: 'PRY-001', Nombre_Proyecto: 'Portal Web Antigravity' }
  ],
  hitos: [
    { ID_Hito: 'WP-101', Nombre_Hito: 'Frontend UI Kanban', ID_Proyecto: 'PRY-001' }
  ],
  tareas: [
    { ID_Tarea: 'TAR-001', Nombre_Tarea_Actividad: 'Configurar Store' },
    { ID_Tarea: 'TAR-002', Nombre_Tarea_Actividad: 'Diseñar Componente Tarjeta' }
  ],
  gastos: [
    { ID_Entidad_Vinculada: 'TAR-002', Monto_PEN: 450.50 },
    { ID_Tarea: 'TAR-002', Monto_PEN: 129.50 }
  ]
};

const mockWindow = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { reload: () => {} },
  localStorage: { getItem: () => null, setItem: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {} }
};

const sandbox = {
  console: console,
  document: mockDocument,
  window: mockWindow,
  localStorage: mockWindow.localStorage,
  sessionStorage: mockWindow.sessionStorage,
  state: mockState,
  Date: Date,
  String: String,
  Array: Array,
  parseFloat: parseFloat,
  isNaN: isNaN,
  isFinite: isFinite,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  draggedTaskId: null,
  formatHoraLimpia: (h) => h || '',
  formatFechaHumana: (f) => '12 Oct 2026',
  normalizarEstadoTarea: (e) => {
    if (!e) return '01_Backlog';
    if (e.includes('Backlog')) return '01_Backlog';
    if (e.includes('Por_Hacer') || e.includes('Hacer')) return '02_Por_Hacer';
    if (e.includes('Proceso') || e.includes('Progreso')) return '03_En_Proceso';
    if (e.includes('Completado') || e.includes('Terminado')) return '04_Completado';
    return e;
  },
  generarBadgeNotasVinculadas: (id) => '<span class="badge-notas-mock">2 Notas</span>',
  renderWidgetSubtareasTarjeta: (id) => '<div class="subtareas-mock">0/3 Subtareas</div>',
  activarResaltadoDependencias: () => {},
  limpiarTrazabilidadKanban: () => {},
  confirmarArchivarTarea: () => {},
  confirmarEliminarTarea: () => {},
  transicionarEstadoTareaRapido: () => {},
  abrirModalDetalleTarea: () => {},
  escapeHtml: (s) => s ? String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : ""
};

vm.createContext(sandbox);

// Extraer el código JS del archivo
const fullJs = scriptMatches.map(m => m.replace(/<\/?script[\s\S]*?>/gi, '')).join('\n');

try {
  vm.runInContext(fullJs, sandbox);
  console.log("Compilación JS_Kanban.html exitosa en entorno VM.");
} catch (e) {
  console.error("Error al compilar JS_Kanban.html:", e.message);
  process.exit(1);
}

// Validar que crearTarjetaKanbanHTML existe en el sandbox
if (typeof sandbox.crearTarjetaKanbanHTML !== 'function') {
  console.error("crearTarjetaKanbanHTML no está definida en sandbox.");
  process.exit(1);
}

console.log("crearTarjetaKanbanHTML detectada correctamente.");

// CASO 1: Tarea completa con Dependencia, Gastos, Proyecto e Hito
const tareaTest1 = {
  ID_Tarea: 'TAR-002',
  Nombre_Tarea_Actividad: 'Diseñar Componente Tarjeta <script>',
  Prioridad_Eisenhower: '01_P1_Alta_Urgente',
  Nivel_Energia_Requerido: 'Alta_DeepWork',
  Fecha_Programada: '2026-10-15',
  Hora_Inicio: '09:00',
  Horas_Estimadas: 4,
  Horas_Reales: 2.5,
  ID_Dependencia: 'TAR-001',
  Estado_Tarea: '02_Por_Hacer',
  ID_Proyecto: 'PRY-001',
  ID_Hito: 'WP-101'
};

const card1 = sandbox.crearTarjetaKanbanHTML(tareaTest1);
const html1 = card1.innerHTML;

let errors = [];

// 1. Verificación data-attributes
if (card1.getAttribute('data-id-tarea') !== 'TAR-002') errors.push("data-id-tarea no coincide");
if (card1.dataset.taskId !== 'TAR-002') errors.push("dataset.taskId no coincide");
if (card1.dataset.depId !== 'TAR-001') errors.push("dataset.depId no coincide");
if (card1.getAttribute('data-prioridad') !== '01_P1_Alta_Urgente') errors.push("data-prioridad no coincide");
if (card1.getAttribute('data-energia') !== 'Alta_DeepWork') errors.push("data-energia no coincide");
if (card1.getAttribute('data-tipo-trabajo') !== 'Alta_DeepWork') errors.push("data-tipo-trabajo no coincide");

// 2. Ausencia de MAV
if (/mav/i.test(html1)) {
  errors.push("ALERTA: Se detectó 'MAV' en el HTML generado");
}

// 3. Zona 1: Cabecera Minimalista
if (!html1.includes('TAR-002')) errors.push("ID_Tarea no presente en cabecera");
if (/P1\s*Urgente|P2\s*Media|P3\s*Baja|P4\s*Delegar/i.test(html1)) {
  errors.push("ALERTA: Se detectó etiqueta de texto de prioridad (P1/P2/P3/P4) en la tarjeta");
}
if (html1.includes('rounded-full shrink-0')) {
  errors.push("ALERTA: Micro-dot cromático de cabecera aún presente");
}
if (!html1.includes('kanban-badge-notas-slot')) errors.push("Slot kanban-badge-notas-slot ausente");

// 4. Zona 2: Título sanitizado y Widget Subtareas
if (!html1.includes('abrirModalDetalleTarea(\'TAR-002\')')) errors.push("onclick abrirModalDetalleTarea no presente");
if (html1.includes('<script>')) errors.push("XSS detectado: Nombre_Tarea_Actividad no fue sanitizado");
if (!html1.includes('&lt;script&gt;')) errors.push("Nombre_Tarea_Actividad no tiene escapeHtml correcto");
if (!html1.includes('procedural-widget-container')) errors.push("procedural-widget-container ausente");

// 5. Zona 3: Riel Bento [Req] -> [Fecha] -> [Horas] -> [Gasto]
const idxReq = html1.indexOf('↳ Req: TAR-001');
const idxFecha = html1.indexOf('12 Oct 2026');
const idxHoras = html1.indexOf('2.5h / 4h');
const idxGasto = html1.indexOf('S/ 580.00'); // 450.50 + 129.50 = 580.00

if (idxReq === -1) errors.push("Req TAR-001 no encontrado");
if (idxFecha === -1) errors.push("Fecha no encontrada");
if (idxHoras === -1) errors.push("Horas no encontradas");
if (idxGasto === -1) errors.push("Gasto S/ 580.00 no calculado correctamente");

if (!(idxReq < idxFecha && idxFecha < idxHoras && idxHoras < idxGasto)) {
  errors.push("Orden canónico del riel de metadatos violado: Req < Fecha < Horas < Gasto");
}

// Comprobación de estilos Bento
if (!html1.includes('bg-amber-950/30 text-amber-300')) errors.push("Estilo Bento en chip Requerimiento no detectado");
if (!html1.includes('bg-slate-800/60 text-slate-300')) errors.push("Estilo Bento en chip Fecha/Horas no detectado");
if (!html1.includes('bg-emerald-950/30 text-emerald-300')) errors.push("Estilo Bento en chip Gastos no detectado");
if (!html1.includes('text-[10px] font-mono mb-2')) errors.push("Contenedor Bento text-[10px] font-mono mb-2 no detectado");

// 6. Zona 4: Pertenencia Jerárquica WBS
if (!html1.includes('Portal Web Antigravity')) errors.push("Nombre_Proyecto no resuelto");
if (!html1.includes('Frontend UI Kanban')) errors.push("Nombre_Hito no resuelto");

// Prueba de resolución en cascada (tarea sin ID_Proyecto directo pero con ID_Hito)
const tareaHeredada = { ...tareaTest1, ID_Proyecto: '' };
const cardHeredada = sandbox.crearTarjetaKanbanHTML(tareaHeredada);
if (!cardHeredada.innerHTML.includes('Portal Web Antigravity')) {
  errors.push("Fallo en cascada: Proyecto no heredado desde el paquete Hito");
}

// 7. Zona 5: Botonera Acciones Rápidas (02_Por_Hacer -> Backlog y Iniciar)
if (!html1.includes('transicionarEstadoTareaRapido(\'TAR-002\', \'01_Backlog\', event)')) errors.push("Botón Backlog no encontrado para 02_Por_Hacer");
if (!html1.includes('transicionarEstadoTareaRapido(\'TAR-002\', \'03_En_Proceso\', event)')) errors.push("Botón Iniciar no encontrado para 02_Por_Hacer");
if (!html1.includes('h-7')) errors.push("Clase h-7 de compactación no encontrada en botonera");

// CASO 2: Tarea en 01_Backlog
const tareaBacklog = { ...tareaTest1, Estado_Tarea: '01_Backlog' };
const cardBacklog = sandbox.crearTarjetaKanbanHTML(tareaBacklog);
if (!cardBacklog.innerHTML.includes('transicionarEstadoTareaRapido(\'TAR-002\', \'02_Por_Hacer\', event)')) {
  errors.push("Botón A Por Hacer no encontrado para 01_Backlog");
}

// CASO 3: Tarea en 03_En_Proceso
const tareaProceso = { ...tareaTest1, Estado_Tarea: '03_En_Proceso' };
const cardProceso = sandbox.crearTarjetaKanbanHTML(tareaProceso);
if (!cardProceso.innerHTML.includes('transicionarEstadoTareaRapido(\'TAR-002\', \'04_Completado\', event)')) {
  errors.push("Botón Completar no encontrado para 03_En_Proceso");
}

// CASO 4: Tarea en 04_Completado
const tareaCompletada = { ...tareaTest1, Estado_Tarea: '04_Completado' };
const cardCompletada = sandbox.crearTarjetaKanbanHTML(tareaCompletada);
if (!cardCompletada.innerHTML.includes('transicionarEstadoTareaRapido(\'TAR-002\', \'03_En_Proceso\', event)')) {
  errors.push("Botón Reabrir no encontrado para 04_Completado");
}

// CASO 5: TAR-017 con ID_Proyecto infectado ("TAR-017") y Fase_Asociada
sandbox.state.hitos[0].Fase_Asociada = "Fase 2: Ejecución";
const tareaTar017 = {
  ID_Tarea: 'TAR-017',
  Nombre_Tarea_Actividad: 'Instalación de medidor y pruebas de carga',
  Estado_Tarea: '02_Por_Hacer',
  ID_Proyecto: 'TAR-017', // Infectado
  ID_Hito: 'WP-101'
};
const cardTar017 = sandbox.crearTarjetaKanbanHTML(tareaTar017);
const htmlTar017 = cardTar017.innerHTML;

if (htmlTar017.includes('max-w-[110px]">TAR-017</span>') || htmlTar017.includes('title="TAR-017 ›')) {
  errors.push("FAIL: TAR-017 sigue apareciendo en lugar del Proyecto Padre");
}
if (!htmlTar017.includes('Portal Web Antigravity')) {
  errors.push("FAIL: El nombre del proyecto padre (Portal Web Antigravity) no se resolvió");
}
if (!htmlTar017.includes('Fase 2: Ejecución')) {
  errors.push("FAIL: Fase_Asociada no se renderizó en la tarjeta");
}
if (htmlTar017.includes('rounded-full shrink-0')) {
  errors.push("FAIL: Micro-dot cromático presente en TAR-017");
}

// CASO 6: Tarea con ID_Proyecto contaminado con el título de la tarea ("Ingresar solicitud de medidor")
const tareaTarContaminada = {
  ID_Tarea: 'TAR-017',
  Nombre_Tarea_Actividad: 'Ingresar solicitud de medidor',
  Estado_Tarea: '02_Por_Hacer',
  ID_Proyecto: 'Ingresar solicitud de medidor', // Columna C contaminada con título
  ID_Hito: 'WP-101'
};
const cardTarContaminada = sandbox.crearTarjetaKanbanHTML(tareaTarContaminada);
const htmlTarContaminada = cardTarContaminada.innerHTML;

if (htmlTarContaminada.includes('max-w-[110px]">Ingresar solicitud de medidor</span>') || htmlTarContaminada.includes('title="Ingresar solicitud de medidor ›')) {
  errors.push("FAIL: Título de tarea sigue apareciendo en lugar del Proyecto Padre");
}
if (!htmlTarContaminada.includes('Portal Web Antigravity')) {
  errors.push("FAIL: Proyecto padre no se resolvió ante contaminación por título");
}

if (errors.length > 0) {
  console.error("ERRORES DETECTADOS:", errors);
  process.exit(1);
} else {
  console.log("TODAS LAS VERIFICACIONES PASARON EXITOSAMENTE (100% CANÓNICO).");
  console.log("- 5 Zonas canónicas verificadas.");
  if (idxGasto !== -1) console.log("- Gastos acumulados calculados correctamente: S/ 580.00.");
  console.log("- Riel ordenado verificado: [Req] -> [Fecha] -> [Horas] -> [Gasto].");
  console.log("- Pertenencia jerárquica resuelta: Portal Web Antigravity › Frontend UI Kanban.");
  console.log("- Botonera compacta h-7 probada para los 4 estados.");
  console.log("- Erradicación absoluta de MAV verificada.");
}
