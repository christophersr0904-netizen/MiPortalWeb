const fs = require('fs');

const modalFiles = [
  'Modal_TareaFlow.html',
  'Modal_ActividadFlow.html',
  'Modal_Finanzas.html',
  'Modal_Notas.html',
  'Modal_ProyectosYHitos.html',
  'Modal_AtajosYPdf.html',
  'View_Kanban.html'
];

modalFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  console.log('====================================');
  console.log(`FILE: ${file}`);
  console.log('====================================');
  
  // Find all overlays: <div id="modal-..."
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('<div') && (line.includes('id="modal-') || line.includes("id='modal-"))) {
      console.log(`L${idx+1}: ${line.trim()}`);
      // Print next 5 lines to find inner card
      for (let j = 1; j <= 8; j++) {
        if (lines[idx + j]) {
          const l = lines[idx + j].trim();
          if (l.includes('class=') && (l.includes('max-w-') || l.includes('portal-surface') || l.includes('rounded-'))) {
            console.log(`   CARD -> L${idx+1+j}: ${l}`);
            break;
          }
        }
      }
    }
  });
  console.log('\n');
});
