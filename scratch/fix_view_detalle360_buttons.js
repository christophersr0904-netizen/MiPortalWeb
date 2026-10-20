const fs = require('fs');

let content = fs.readFileSync('View_Detalle360.html', 'utf8');

// Target the buttons in View_Detalle360.html
const oldButtons = `<div class="flex items-center gap-2 flex-wrap">
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

const newButtons = `<div class="flex items-center gap-2 flex-wrap">
            <button type="button" onclick="abrirModalAsistenteWbsIA()"
              class="btn-portal-secondary text-xs flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 shadow-2xs"
              title="Sugerir paquetes de trabajo e hitos faltantes para este proyecto con IA">
              <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <span>Completar WBS con IA</span>
            </button>
            <button type="button" onclick="abrirModalCrearHito()"
              class="btn-portal-primary flex items-center gap-1.5 shadow-2xs">
              <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              <span>Nuevo Entregable</span>
            </button>
          </div>`;

if (!content.includes(oldButtons)) {
  console.error('Error: oldButtons not found in View_Detalle360.html');
  process.exit(1);
}

content = content.replace(oldButtons, newButtons);
fs.writeFileSync('View_Detalle360.html', content, 'utf8');
console.log('Successfully updated View_Detalle360.html buttons!');
