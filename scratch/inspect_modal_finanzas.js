const fs = require('fs');

function inspect(filename) {
  console.log(`=== ${filename} ===`);
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const num = idx + 1;
    if (line.includes('id="modal-')) {
      console.log(`MODAL L${num}: ${line.trim()}`);
    }
    if (line.includes('closeModal(')) {
      console.log(`  CLOSE L${num}: ${line.trim()}`);
    }
    if (line.includes('type="submit"') || (line.includes('<button') && (line.includes('Guardar') || line.includes('Registrar') || line.includes('Conciliar')))) {
      console.log(`  SUBMIT L${num}: ${line.trim()}`);
    }
  });
}

inspect('Modal_Finanzas.html');
