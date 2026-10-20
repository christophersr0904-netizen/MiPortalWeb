const fs = require('fs');
const content = fs.readFileSync('Modal_Finanzas.html', 'utf8');
const lines = content.split(/\r?\n/);

function showSection(start, end) {
  console.log(`=== LINES ${start} - ${end} ===`);
  console.log(lines.slice(start-1, end).join('\n'));
}

showSection(6, 30);
showSection(200, 235);
showSection(385, 415);
showSection(695, 725);
showSection(835, 865);
