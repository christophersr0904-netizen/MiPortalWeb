const fs = require('fs');

const content = fs.readFileSync('Modal_Notas.html', 'utf8');
const lines = content.split('\n');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

console.log('=== MODALES EN Modal_Notas.html ===');
lines.forEach((l, i) => {
  const num = i + 1;
  if (l.includes('id="modal-')) console.log(`MODAL L${num}: ${l.trim()}`);
  if (l.includes('closeModal(')) console.log(`  CLOSE L${num}: ${l.trim()}`);
  if (l.includes('type="submit"') || (l.includes('<button') && (l.includes('Guardar') || l.includes('Registrar') || l.includes('Crear')))) {
    console.log(`  SUBMIT L${num}: ${l.trim()}`);
  }
  if (emojiRegex.test(l)) {
    console.log(`  EMOJI L${num}: ${l.trim().substring(0, 80)}`);
  }
});
