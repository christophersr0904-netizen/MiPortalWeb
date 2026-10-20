const fs = require('fs');
const vm = require('vm');
const path = require('path');

const htmlFiles = [
  'View_Detalle360.html',
  'View_Portafolio.html',
  'Modal_ProyectosYHitos.html',
  'JS_Detalle360.html',
  'JS_Portafolio.html',
  'JS_ModalesYAtajos.html'
];

let allPassed = true;

console.log('=== QA CHECK: TAG BALANCE ===');
['View_Detalle360.html', 'View_Portafolio.html', 'Modal_ProyectosYHitos.html'].forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(filePath, 'utf8');
  const tags = ['div', 'button', 'span', 'svg', 'section', 'main', 'header', 'nav'];
  let fileOk = true;
  const issues = {};

  tags.forEach(t => {
    const openRegex = new RegExp(`<${t}(\\s+[^>]*)?>`, 'gi');
    const closeRegex = new RegExp(`</${t}>`, 'gi');
    const openCount = (content.match(openRegex) || []).length;
    const closeCount = (content.match(closeRegex) || []).length;
    const diff = openCount - closeCount;
    if (diff !== 0) {
      issues[t] = { open: openCount, close: closeCount, diff: diff };
      fileOk = false;
    }
  });

  if (fileOk) {
    console.log(`[PASS] ${file}: Tag balance verified (diff = 0)`);
  } else {
    console.log(`[FAIL] ${file}: Tag imbalance:`, issues);
    allPassed = false;
  }
});

console.log('\n=== QA CHECK: SVG & TEXT CLEANLINESS ===');
['View_Detalle360.html', 'View_Portafolio.html'].forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check for duplicate ++
  if (content.includes('++') || content.includes('+ +')) {
    console.log(`[FAIL] ${file}: Found duplicate '+' text!`);
    allPassed = false;
  } else {
    console.log(`[PASS] ${file}: No duplicate '+' found.`);
  }

  // Check for raw svg paths outside <path d="...">
  if (content.includes('m12 3-1.912') && !content.includes('d="m12 3-1.912')) {
    console.log(`[FAIL] ${file}: Found leaked SVG path outside attribute!`);
    allPassed = false;
  } else {
    console.log(`[PASS] ${file}: No leaked SVG path text found.`);
  }
});

console.log('\n=== QA CHECK: JS SYNTAX (vm.Script) ===');
['JS_Detalle360.html', 'JS_Portafolio.html', 'JS_ModalesYAtajos.html'].forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(filePath, 'utf8');
  const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match;
  let block = 1;
  while ((match = scriptRegex.exec(content)) !== null) {
    try {
      new vm.Script(match[1], { filename: `${file}#block${block}` });
      console.log(`[PASS] ${file} Block ${block}: Syntax valid`);
    } catch (err) {
      console.log(`[FAIL] ${file} Block ${block}: Syntax error - ${err.message}`);
      allPassed = false;
    }
    block++;
  }
});

console.log('\nResult:', allPassed ? 'ALL AUDITS PASSED ✅' : 'FAILURES DETECTED ❌');
process.exit(allPassed ? 0 : 1);
