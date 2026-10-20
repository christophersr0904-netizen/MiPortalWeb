const fs = require('fs');

let content = fs.readFileSync('Modal_ProyectosYHitos.html', 'utf8');

// 1. MODAL EDITAR PROYECTO
const editProyTarget = `  <div id="modal-editar-proyecto"
    class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="portal-surface elevation-3 w-full max-w-4xl overflow-hidden flex flex-col max-sm:rounded-b-none max-sm:rounded-t-2xl max-h-[92vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
      
      <!-- Drag handle móvil -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0"></div>

      <!-- Header del Modal -->
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">`;

const editProyReplacement = `  <div id="modal-editar-proyecto"
    class="hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-editar-proyecto-card" class="portal-surface elevation-3 w-full max-w-4xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">

      <!-- Drag handle móvil -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

      <!-- Header del Modal -->
      <div class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">`;

if (content.includes(editProyTarget)) {
  content = content.replace(editProyTarget, editProyReplacement);
}

// Body and Footer inside modal-editar-proyecto
const editProyFormStart = `<form id="form-editar-proyecto" class="p-5 md:p-6 space-y-4 text-xs overflow-y-auto flex-1">`;
const editProyFormStartReplacement = `<form id="form-editar-proyecto" class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-4 custom-scrollbar text-xs">`;

if (content.includes(editProyFormStart)) {
  content = content.replace(editProyFormStart, editProyFormStartReplacement);
}

const editProyFormEnd = `        <div class="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onclick="confirmarEliminarProyectoDesdeModal()"
            class="px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold flex items-center gap-1.5 transition text-xs active:scale-95"
            title="Eliminar este proyecto y sus elementos WBS">
            <svg class="portal-icon-sm text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
            </svg>
            <span>Eliminar Proyecto</span>
          </button>
          <div class="flex items-center gap-2">
            <button type="button" onclick="closeModal('modal-editar-proyecto')"
              class="btn-portal-secondary">
              Cancelar
            </button>
            <button type="submit" id="btn-submit-edit-proy"
              class="btn-portal-primary shadow-xs">
              Guardar Cambios
            </button>
          </div>
        </div>
      </form>`;

const editProyFormEndReplacement = `        </div>
        <div class="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-2.5">
          <button type="button" onclick="confirmarEliminarProyectoDesdeModal()"
            class="px-3.5 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold flex items-center gap-1.5 transition text-xs active:scale-95"
            title="Eliminar este proyecto y sus elementos WBS">
            <svg class="portal-icon-sm text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
            </svg>
            <span>Eliminar Proyecto</span>
          </button>
          <div class="flex items-center gap-2">
            <button type="button" onclick="closeModal('modal-editar-proyecto')"
              class="btn-portal-secondary">
              Cancelar
            </button>
            <button type="submit" id="btn-submit-edit-proy"
              class="btn-portal-primary shadow-xs">
              Guardar Cambios
            </button>
          </div>
        </div>
      </form>`;

if (content.includes(editProyFormEnd)) {
  content = content.replace(editProyFormEnd, editProyFormEndReplacement);
}

// 2. MODAL DUAL HITO / PAQUETE DE TRABAJO (UPGRADE TO TIER 2 max-w-xl)
const hitoTarget = `  <div id="modal-hito"
    class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="portal-surface elevation-3 w-full max-w-lg overflow-hidden flex flex-col max-sm:rounded-b-none max-sm:rounded-t-2xl max-h-[90vh] animate-in slide-in-from-bottom duration-200">
      
      <!-- Drag handle móvil -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0"></div>

      <!-- Cabecera -->
      <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">`;

const hitoReplacement = `  <div id="modal-hito"
    class="hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-hito-card" class="portal-surface elevation-3 w-full max-w-xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative animate-in slide-in-from-bottom duration-200">

      <!-- Drag handle móvil -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

      <!-- Cabecera -->
      <div class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">`;

if (content.includes(hitoTarget)) {
  content = content.replace(hitoTarget, hitoReplacement);
}

const hitoFormStart = `<form id="form-create-hito" class="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">`;
const hitoFormStartReplacement = `<form id="form-create-hito" class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-3.5 custom-scrollbar text-xs">`;

if (content.includes(hitoFormStart)) {
  content = content.replace(hitoFormStart, hitoFormStartReplacement);
}

const hitoFormEnd = `        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onclick="closeModal('modal-hito')" class="btn-portal-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-hito" class="btn-portal-primary">Guardar Entregable</button>
        </div>
      </form>`;

const hitoFormEndReplacement = `        </div>
        <div class="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-end gap-2.5">
          <button type="button" onclick="closeModal('modal-hito')" class="btn-portal-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-hito" class="btn-portal-primary">Guardar Entregable</button>
        </div>
      </form>`;

if (content.includes(hitoFormEnd)) {
  content = content.replace(hitoFormEnd, hitoFormEndReplacement);
}

// 3. MODAL PROYECTO WIZARD
const wizTarget = `  <div id="modal-proyecto-wizard"
    class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 items-center justify-center p-3 md:p-6 overflow-hidden">
    <div
      class="portal-surface elevation-3 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
      
      <!-- CABECERA PRINCIPAL (STICKY) CON BOTÓN ÚNICO DE IA -->
      <div class="sticky top-0 z-30 px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 shrink-0 gap-3">`;

const wizReplacement = `  <div id="modal-proyecto-wizard"
    class="hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-proyecto-wizard-card"
      class="portal-surface elevation-3 w-full max-w-4xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

      <!-- Drag handle móvil -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

      <!-- CABECERA PRINCIPAL (STICKY) CON BOTÓN ÚNICO DE IA -->
      <div class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs gap-3">`;

if (content.includes(wizTarget)) {
  content = content.replace(wizTarget, wizReplacement);
}

// 4. MODAL IA COMPLETAR WBS
const wbsTarget = `  <div id="modal-ia-completar-wbs"
    class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="portal-surface elevation-3 w-full max-w-2xl overflow-hidden flex flex-col max-sm:rounded-b-none max-sm:rounded-t-2xl max-h-[90vh] animate-in slide-in-from-bottom duration-200">
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0"></div>
      <div class="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">`;

const wbsReplacement = `  <div id="modal-ia-completar-wbs"
    class="hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-ia-completar-wbs-card" class="portal-surface elevation-3 w-full max-w-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative animate-in slide-in-from-bottom duration-200">
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>
      <div class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">`;

if (content.includes(wbsTarget)) {
  content = content.replace(wbsTarget, wbsReplacement);
}

// 5. MODAL IA DESGLOSE TAREAS
const desgloseTarget = `  <div id="modal-ia-desglose-tareas"
    class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="portal-surface elevation-3 w-full max-w-xl overflow-hidden flex flex-col max-sm:rounded-b-none max-sm:rounded-t-2xl max-h-[90vh] animate-in slide-in-from-bottom duration-200">
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0"></div>
      <div class="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">`;

const desgloseReplacement = `  <div id="modal-ia-desglose-tareas"
    class="hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-ia-desglose-tareas-card" class="portal-surface elevation-3 w-full max-w-xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative animate-in slide-in-from-bottom duration-200">
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>
      <div class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">`;

if (content.includes(desgloseTarget)) {
  content = content.replace(desgloseTarget, desgloseReplacement);
}

fs.writeFileSync('Modal_ProyectosYHitos.html', content, 'utf8');
console.log('Successfully upgraded Modal_ProyectosYHitos.html!');
