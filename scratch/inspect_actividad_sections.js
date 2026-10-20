const fs = require('fs');
const content = fs.readFileSync('Modal_ActividadFlow.html', 'utf8');
const lines = content.split(/\r?\n/);
console.log('=== LINES 1-35 ===');
console.log(lines.slice(0, 35).join('\n'));
console.log('=== LINES 410-455 ===');
console.log(lines.slice(410, 455).join('\n'));
