const fs = require('fs');
const content = fs.readFileSync('Modal_ProyectosYHitos.html', 'utf8');
const lines = content.split(/\r?\n/);

function show(start, end) {
  console.log(`=== LINES ${start} - ${end} ===`);
  console.log(lines.slice(start-1, end).join('\n'));
}

show(1, 35);
show(175, 215);
show(275, 305);
show(845, 875);
show(880, 915);
