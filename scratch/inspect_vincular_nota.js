const fs = require('fs');
const content = fs.readFileSync('Modal_Notas.html', 'utf8');
const lines = content.split(/\r?\n/);
console.log(lines.slice(405, 460).join('\n'));
