const fs = require('fs');
const content = fs.readFileSync('Modal_Finanzas.html', 'utf8');
const lines = content.split(/\r?\n/);

console.log('Lines count:', lines.length);
lines.forEach((l, idx) => {
  if (l.includes('<div id="modal-') || (l.includes('class=') && l.includes('fixed inset-0'))) {
    console.log((idx+1) + ': ' + l.trim());
  }
});
