const fs = require('fs');
const content = fs.readFileSync('Modal_Finanzas.html', 'utf8');

const start = content.indexOf('id="modal-plan-cuotas"');
const end = content.indexOf('id="modal-conciliar-transaccion"');
const chunk = content.substring(start, end);
console.log('=== MODAL PLAN CUOTAS CHUNK ===');
const lines = chunk.split('\n');
console.log(lines.slice(0, 30).join('\n'));
console.log('...');
console.log(lines.slice(-30).join('\n'));

console.log('=== AFTER CONCILIAR ===');
const after = content.substring(content.indexOf('id="modal-conciliar-transaccion"'));
const afterLines = after.split('\n');
console.log(afterLines.slice(-30).join('\n'));
