const fs = require('fs');
const vm = require('vm');
const path = require('path');

const files = fs.readdirSync('.');
let totalChecked = 0;
let errors = 0;

files.forEach(file => {
  if (file.endsWith('.js') && !file.startsWith('test_') && !file.startsWith('scratch')) {
    totalChecked++;
    try {
      const code = fs.readFileSync(file, 'utf8');
      new vm.Script(code);
      console.log(`[OK] ${file}`);
    } catch (e) {
      console.error(`[ERROR] ${file}:`, e.message);
      errors++;
    }
  } else if (file.startsWith('JS_') && file.endsWith('.html')) {
    totalChecked++;
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const startTag = '<script>';
      const endTag = '</script>';
      const idxStart = raw.indexOf(startTag);
      const idxEnd = raw.lastIndexOf(endTag);
      if (idxStart !== -1 && idxEnd !== -1) {
        const js = raw.substring(idxStart + startTag.length, idxEnd);
        new vm.Script(js);
        console.log(`[OK] ${file}`);
      }
    } catch (e) {
      console.error(`[ERROR] ${file}:`, e.message);
      errors++;
    }
  }
});

console.log(`\nChecked ${totalChecked} files. Errors: ${errors}`);
if (errors > 0) process.exit(1);
