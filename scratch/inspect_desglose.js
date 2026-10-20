const fs = require('fs');
const content = fs.readFileSync('Modal_ActividadFlow.html', 'utf8');
const lines = content.split(/\r?\n/);
console.log(lines.slice(720).join('\n'));
