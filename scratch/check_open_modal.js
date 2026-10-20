const fs = require('fs');
['JS_Core.html', 'JS_Finanzas.html'].forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const lines = c.split(/\r?\n/);
  lines.forEach((l, idx) => {
    if (l.includes('function openModal') || l.includes('function closeModal')) {
      console.log(f, (idx+1), l.trim());
    }
  });
});
