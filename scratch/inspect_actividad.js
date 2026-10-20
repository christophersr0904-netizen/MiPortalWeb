const fs = require('fs');
const content = fs.readFileSync('Modal_ActividadFlow.html', 'utf8');
const lines = content.split(/\r?\n/);

console.log('Lines count:', lines.length);
lines.forEach((l, idx) => {
  if (l.includes('modal-actividad-flow') || l.includes('modal-desglose') || l.includes('shrink-0') || (l.includes('<!--') && (l.includes('CABECERA') || l.includes('PIE') || l.includes('CUERPO')))) {
    console.log((idx+1) + ': ' + l.trim());
  }
});
