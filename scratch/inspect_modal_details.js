const fs = require('fs');

function inspect(filename) {
  console.log('==============================================');
  console.log('FILE:', filename);
  console.log('==============================================');
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('id="modal-') || line.includes("id='modal-") || (line.includes('class=') && line.includes('fixed inset-0'))) {
      console.log(`L${idx+1}:`, line.trim());
    }
  });
}

['Modal_TareaFlow.html', 'Modal_ActividadFlow.html', 'Modal_Finanzas.html', 'Modal_Notas.html', 'Modal_ProyectosYHitos.html', 'Modal_AtajosYPdf.html'].forEach(inspect);
