const fs = require('fs');
let content = fs.readFileSync('View_Detalle360.html', 'utf8');

// 1. Update trash icon on line 34
const oldTrash = `<button type="button" id="btn-eliminar-proyecto-det360" onclick="confirmarEliminarProyectoDesdeDetalle360()"
            class="btn-portal-icon text-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
            title="Eliminar este proyecto y todas sus dependencias">
            <svg class="portal-icon-sm shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>`;

const newTrash = `<button type="button" id="btn-eliminar-proyecto-det360" onclick="confirmarEliminarProyectoDesdeDetalle360()"
            class="btn-portal-icon text-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
            title="Eliminar este proyecto y todas sus dependencias">
            <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
            </svg>
          </button>`;

const oldTrashLF = oldTrash.replace(/\r\n/g, '\n');
const newTrashLF = newTrash.replace(/\r\n/g, '\n');

if (content.includes(oldTrashLF)) {
  content = content.replace(oldTrashLF, newTrashLF);
  console.log('Replaced trash icon successfully.');
} else {
  console.warn('oldTrashLF not found, checking normalized...');
}

// 2. Update WBS buttons
const oldWbsButtons = `<div class="flex items-center gap-2">
            <button type="button" onclick="abrirModalCrearHito()"
              class="btn-portal-primary flex items-center gap-1.5">
              <span>+ Nuevo Hito</span>
            </button>
          </div>`;

const newWbsButtons = `<div class="flex items-center gap-2 flex-wrap">
            <button type="button" onclick="abrirModalAsistenteWbsIA()"
              class="btn-portal-secondary text-xs flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 shadow-2xs"
              title="Sugerir paquetes de trabajo e hitos faltantes para este proyecto con IA">
              <svg xmlns="http://www.w3.org/2000/svg" class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <span>✨ Completar WBS con IA</span>
            </button>
            <button type="button" onclick="abrirModalCrearHito()"
              class="btn-portal-primary flex items-center gap-1.5 shadow-2xs">
              <svg xmlns="http://www.w3.org/2000/svg" class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
              <span>+ Nuevo Entregable</span>
            </button>
          </div>`;

const oldWbsButtonsLF = oldWbsButtons.replace(/\r\n/g, '\n');
const newWbsButtonsLF = newWbsButtons.replace(/\r\n/g, '\n');

if (content.includes(oldWbsButtonsLF)) {
  content = content.replace(oldWbsButtonsLF, newWbsButtonsLF);
  console.log('Replaced WBS buttons successfully.');
} else {
  console.error('Error: oldWbsButtonsLF not found.');
  process.exit(1);
}

fs.writeFileSync('View_Detalle360.html', content, 'utf8');
console.log('View_Detalle360.html updated cleanly!');
