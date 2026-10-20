const fs = require('fs');
const content = fs.readFileSync('Modal_AtajosYPdf.html', 'utf8');
const lines = content.split(/\r?\n/);
console.log('=== Modal_AtajosYPdf.html Lines 1-80 ===');
console.log(lines.slice(0, 80).join('\n'));
