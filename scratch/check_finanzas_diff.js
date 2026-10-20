const fs = require('fs');
const content = fs.readFileSync('Modal_Finanzas.html', 'utf8');

const modals = ['modal-gasto', 'modal-ingreso', 'modal-editar-gasto', 'modal-plan-cuotas', 'modal-conciliar-transaccion'];
modals.forEach((id, idx) => {
  const start = content.indexOf(`id="${id}"`);
  const nextId = modals[idx+1];
  const end = nextId ? content.indexOf(`id="${nextId}"`) : content.length;
  const chunk = content.substring(start, end);
  const opens = (chunk.match(/<div(\s|>)/g) || []).length;
  const closes = (chunk.match(/<\/div>/g) || []).length;
  console.log(id, 'opens:', opens, 'closes:', closes, 'diff:', opens - closes);
});
