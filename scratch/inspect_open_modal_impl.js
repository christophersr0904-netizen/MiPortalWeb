const fs = require('fs');
const c = fs.readFileSync('JS_ModalesYAtajos.html', 'utf8');
const lines = c.split(/\r?\n/);
lines.forEach((l, idx) => {
  if (l.includes('function openModal') || l.includes('function closeModal')) {
    console.log(lines.slice(idx, idx + 18).join('\n'));
  }
});
