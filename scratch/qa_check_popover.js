const fs = require('fs');
const path = require('path');

console.log('=== QA CHECK: TAG BALANCE IN Index.html ===');
const indexContent = fs.readFileSync(path.join(__dirname, '..', 'Index.html'), 'utf8');
const tags = ['div', 'button', 'span', 'svg', 'section', 'main', 'header', 'nav', 'body', 'html'];
let pass = true;

tags.forEach(t => {
  const openRegex = new RegExp(`<${t}(\\s+[^>]*)?>`, 'gi');
  const closeRegex = new RegExp(`</${t}>`, 'gi');
  const openCount = (indexContent.match(openRegex) || []).length;
  const closeCount = (indexContent.match(closeRegex) || []).length;
  const diff = openCount - closeCount;
  if (diff !== 0) {
    console.log(`[FAIL] Index.html Tag <${t}>: open=${openCount}, close=${closeCount}, diff=${diff}`);
    pass = false;
  }
});

if (pass) {
  console.log('[PASS] Index.html: Todos los tags balanceados (diff = 0)');
}

// Verificar existencia y consistencia del elemento popover
if (indexContent.includes('id="popover-nota-preview"')) {
  console.log('[PASS] Elemento #popover-nota-preview presente en Index.html');
} else {
  console.log('[FAIL] Falta #popover-nota-preview en Index.html');
  pass = false;
}

process.exit(pass ? 0 : 1);
