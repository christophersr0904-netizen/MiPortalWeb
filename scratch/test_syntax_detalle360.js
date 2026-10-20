const fs = require('fs');
const vm = require('vm');

const raw = fs.readFileSync('JS_Detalle360.html', 'utf8');
const startTag = '<script>';
const endTag = '</script>';
const js = raw.substring(raw.indexOf(startTag) + startTag.length, raw.lastIndexOf(endTag));

try {
  new vm.Script(js);
  console.log('SYNTAX VALIDATION: SUCCESSFUL! No syntax errors in JS_Detalle360.html.');
} catch (e) {
  console.error('SYNTAX VALIDATION FAILED:', e);
  process.exit(1);
}
