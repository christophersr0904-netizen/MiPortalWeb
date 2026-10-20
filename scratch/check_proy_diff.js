const fs = require('fs');
const content = fs.readFileSync('Modal_ProyectosYHitos.html', 'utf8');

const modals = ['modal-editar-proyecto', 'modal-hito', 'modal-proyecto-wizard', 'modal-ia-completar-wbs', 'modal-ia-desglose-tareas'];
modals.forEach((id, idx) => {
  const start = content.indexOf(`id="${id}"`);
  const nextId = modals[idx+1];
  const end = nextId ? content.indexOf(`id="${nextId}"`) : content.length;
  const chunk = content.substring(start, end);
  const opens = (chunk.match(/<div(\s|>)/g) || []).length;
  const closes = (chunk.match(/<\/div>/g) || []).length;
  console.log(id, 'opens:', opens, 'closes:', closes, 'diff:', opens - closes);
});
