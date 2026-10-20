const fs = require('fs');
const vm = require('vm');
const path = require('path');

const filesToCheck = [
  'Index.html',
  'Layout_Header.html',
  'View_Kanban.html',
  'View_Detalle360.html',
  'Styles.html',
  'JS_Kanban.html',
  'JS_ModalesYAtajos.html',
  'JS_Detalle360.html',
  'JS_GrafoRed.html'
];

let allPassed = true;

console.log('--- 1. VERIFICACIÓN DE BALANCE DE ETIQUETAS HTML ---');
filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Contar etiquetas clave
  const tags = ['div', 'button', 'span', 'main', 'header', 'nav', 'style', 'script'];
  const report = {};
  let fileOk = true;

  tags.forEach(t => {
    // Regex tolerante a atributos y saltos de línea
    const openRegex = new RegExp(`<${t}(\\s+[^>]*)?>`, 'gi');
    const closeRegex = new RegExp(`</${t}>`, 'gi');
    const openCount = (content.match(openRegex) || []).length;
    const closeCount = (content.match(closeRegex) || []).length;
    const diff = openCount - closeCount;
    if (openCount > 0 || closeCount > 0) {
      report[t] = { open: openCount, close: closeCount, diff: diff };
      if (diff !== 0) fileOk = false;
    }
  });

  if (fileOk) {
    console.log(`[PASS] ${file}: Balance perfecto (diff = 0)`);
  } else {
    console.log(`[WARN/FAIL] ${file}: Desbalance detectado:`, JSON.stringify(report, null, 2));
    allPassed = false;
  }
});

console.log('\n--- 2. VERIFICACIÓN DE SINTAXIS JS (Node.js vm.Script) ---');
const jsFiles = ['JS_Kanban.html', 'JS_ModalesYAtajos.html', 'JS_Detalle360.html', 'JS_GrafoRed.html'];
jsFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Extraer el contenido dentro de <script> ... </script>
  const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match;
  let blockIndex = 1;
  while ((match = scriptRegex.exec(content)) !== null) {
    const jsCode = match[1];
    try {
      new vm.Script(jsCode, { filename: `${file}#block${blockIndex}` });
      console.log(`[PASS] ${file} Bloque #${blockIndex}: Sintaxis JS válida`);
    } catch (err) {
      console.error(`[FAIL] ${file} Bloque #${blockIndex}: Error de sintaxis:`, err.message);
      allPassed = false;
    }
    blockIndex++;
  }
});

if (allPassed) {
  console.log('\n>>> RESULTADO FINAL: TODOS LOS TESTS PASARON EXITOSAMENTE (0 ERRORES) <<<');
} else {
  console.error('\n>>> RESULTADO FINAL: HUBO ERRORES EN LA VALIDACIÓN <<<');
  process.exit(1);
}
