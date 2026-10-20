const fs = require('fs');
const content = fs.readFileSync('Modal_ProyectosYHitos.html', 'utf8');

console.log('=== END OF EDITAR PROYECTO ===');
const epChunk = content.substring(content.indexOf('id="modal-editar-proyecto"'), content.indexOf('id="modal-hito"'));
const epLines = epChunk.split('\n');
console.log(epLines.slice(-25).join('\n'));

console.log('=== END OF DESGLOSE TAREAS ===');
const dtChunk = content.substring(content.indexOf('id="modal-ia-desglose-tareas"'));
const dtLines = dtChunk.split('\n');
console.log(dtLines.slice(-25).join('\n'));
