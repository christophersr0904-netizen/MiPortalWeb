const fs = require('fs');

let content = fs.readFileSync('Modal_Finanzas.html', 'utf8');

// 1. MODAL GASTO
const gastoTarget = `<div id="modal-gasto"
    class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 items-center justify-center p-4">
    <div id="modal-gasto-card" class="portal-surface elevation-3 w-full max-w-lg overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar transition-all duration-200">
      
      <!-- Cabecera Dinámica -->
      <div id="modal-gasto-header" class="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850 sticky top-0 z-10 transition-colors duration-200">`;

const gastoReplacement = `<div id="modal-gasto"
    class="hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-gasto-card" class="portal-surface elevation-3 w-full max-w-xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative transition-all duration-200">

      <!-- DRAG HANDLE MÓVIL (BOTTOM SHEET) -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

      <!-- Cabecera Dinámica -->
      <div id="modal-gasto-header" class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs transition-colors duration-200">`;

if (content.includes(gastoTarget)) {
  content = content.replace(gastoTarget, gastoReplacement);
}

// Body and Footer inside modal-gasto
const gastoFormStart = `<form id="form-create-gasto" class="p-5 space-y-3.5 text-xs">`;
const gastoFormStartReplacement = `<form id="form-create-gasto" class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-3.5 custom-scrollbar text-xs">`;

if (content.includes(gastoFormStart)) {
  content = content.replace(gastoFormStart, gastoFormStartReplacement);
}

const gastoFormEnd = `        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onclick="closeModal('modal-gasto')" class="btn-portal-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-gasto" class="btn-portal-primary">
            <span id="txt-btn-submit-gasto">Registrar Gasto Real</span>
          </button>
        </div>
      </form>`;

const gastoFormEndReplacement = `        </div>
        <div class="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-end gap-2.5">
          <button type="button" onclick="closeModal('modal-gasto')" class="btn-portal-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-gasto" class="btn-portal-primary">
            <span id="txt-btn-submit-gasto">Registrar Gasto Real</span>
          </button>
        </div>
      </form>`;

if (content.includes(gastoFormEnd)) {
  content = content.replace(gastoFormEnd, gastoFormEndReplacement);
}

// 2. MODAL INGRESO
const ingresoTarget = `<div id="modal-ingreso"
    class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 items-center justify-center p-4">
    <div id="modal-ingreso-card" class="portal-surface elevation-3 w-full max-w-lg overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar transition-all duration-200">
      
      <!-- Cabecera Dinámica -->
      <div id="modal-ingreso-header" class="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-emerald-50/80 dark:bg-emerald-950/30 sticky top-0 z-10 transition-colors duration-200">`;

const ingresoReplacement = `<div id="modal-ingreso"
    class="hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-ingreso-card" class="portal-surface elevation-3 w-full max-w-xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative transition-all duration-200">

      <!-- DRAG HANDLE MÓVIL (BOTTOM SHEET) -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

      <!-- Cabecera Dinámica -->
      <div id="modal-ingreso-header" class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/30 backdrop-blur-xs transition-colors duration-200">`;

if (content.includes(ingresoTarget)) {
  content = content.replace(ingresoTarget, ingresoReplacement);
}

// Body and Footer inside modal-ingreso
const ingresoFormStart = `<form id="form-create-ingreso" class="p-5 space-y-3.5 text-xs">`;
const ingresoFormStartReplacement = `<form id="form-create-ingreso" class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-3.5 custom-scrollbar text-xs">`;

if (content.includes(ingresoFormStart)) {
  content = content.replace(ingresoFormStart, ingresoFormStartReplacement);
}

const ingresoFormEnd = `        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onclick="closeModal('modal-ingreso')" class="btn-portal-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-ingreso" class="btn-portal-primary">
            <span id="txt-btn-submit-ingreso">Registrar Ingreso Real</span>
          </button>
        </div>
      </form>`;

const ingresoFormEndReplacement = `        </div>
        <div class="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-end gap-2.5">
          <button type="button" onclick="closeModal('modal-ingreso')" class="btn-portal-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-ingreso" class="btn-portal-primary">
            <span id="txt-btn-submit-ingreso">Registrar Ingreso Real</span>
          </button>
        </div>
      </form>`;

if (content.includes(ingresoFormEnd)) {
  content = content.replace(ingresoFormEnd, ingresoFormEndReplacement);
}

// 3. MODAL EDITAR GASTO
const editGastoTarget = `<div id="modal-editar-gasto"
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm hidden items-center justify-center z-50 p-4 transition-all">
    <div
      class="portal-surface elevation-3 max-w-lg w-full p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">

      <!-- Cabecera Modal -->
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">`;

const editGastoReplacement = `<div id="modal-editar-gasto"
    class="hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-editar-gasto-card"
      class="portal-surface elevation-3 w-full max-w-xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative transition-all duration-200">

      <!-- DRAG HANDLE MÓVIL (BOTTOM SHEET) -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

      <!-- Cabecera Modal -->
      <div class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">`;

if (content.includes(editGastoTarget)) {
  content = content.replace(editGastoTarget, editGastoReplacement);
}

const editGastoFormStart = `<form id="form-editar-gasto" class="space-y-3.5 text-xs">`;
const editGastoFormStartReplacement = `<form id="form-editar-gasto" class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-3.5 custom-scrollbar text-xs">`;

if (content.includes(editGastoFormStart)) {
  content = content.replace(editGastoFormStart, editGastoFormStartReplacement);
}

const editGastoFormEnd = `        <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button type="button" id="btn-eliminar-gasto" onclick="confirmarEliminarGastoDesdeModal()"
            class="px-3.5 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold flex items-center gap-1.5 transition text-xs active:scale-95"
            title="Eliminar este registro de gasto permanentemente">
            <svg class="portal-icon-sm text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span>Eliminar</span>
          </button>
          <div class="flex items-center gap-2">
            <button type="button" onclick="closeModal('modal-editar-gasto')"
              class="btn-portal-secondary">Cancelar</button>
            <button type="submit" id="btn-submit-edit-gasto"
              class="btn-portal-primary">Guardar Cambios</button>
          </div>
        </div>
      </form>`;

const editGastoFormEndReplacement = `        </div>
        <div class="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-2.5">
          <button type="button" id="btn-eliminar-gasto" onclick="confirmarEliminarGastoDesdeModal()"
            class="px-3.5 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold flex items-center gap-1.5 transition text-xs active:scale-95"
            title="Eliminar este registro de gasto permanentemente">
            <svg class="portal-icon-sm text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span>Eliminar</span>
          </button>
          <div class="flex items-center gap-2">
            <button type="button" onclick="closeModal('modal-editar-gasto')"
              class="btn-portal-secondary">Cancelar</button>
            <button type="submit" id="btn-submit-edit-gasto"
              class="btn-portal-primary">Guardar Cambios</button>
          </div>
        </div>
      </form>`;

if (content.includes(editGastoFormEnd)) {
  content = content.replace(editGastoFormEnd, editGastoFormEndReplacement);
}

// 4. MODAL PLAN CUOTAS
const cuotasTarget = `<div id="modal-plan-cuotas"
    class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 items-center justify-center p-4">
    <div class="portal-surface elevation-3 w-full max-w-lg overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-violet-50/80 dark:bg-violet-950/30 sticky top-0 z-10 backdrop-blur-md">`;

const cuotasReplacement = `<div id="modal-plan-cuotas"
    class="hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-plan-cuotas-card" class="portal-surface elevation-3 w-full max-w-lg max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative transition-all duration-200">

      <!-- DRAG HANDLE MÓVIL (BOTTOM SHEET) -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

      <div class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-violet-50/80 dark:bg-violet-950/30 backdrop-blur-xs">`;

if (content.includes(cuotasTarget)) {
  content = content.replace(cuotasTarget, cuotasReplacement);
}

const cuotasFormStart = `<form id="form-create-plan-cuotas" class="p-5 space-y-3.5 text-xs">`;
const cuotasFormStartReplacement = `<form id="form-create-plan-cuotas" class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-3.5 custom-scrollbar text-xs">`;

if (content.includes(cuotasFormStart)) {
  content = content.replace(cuotasFormStart, cuotasFormStartReplacement);
}

const cuotasFormEnd = `        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onclick="closeModal('modal-plan-cuotas')" class="btn-portal-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-cuotas" class="btn-portal-primary">
            <span id="txt-btn-submit-cuotas">Guardar Plan</span>
          </button>
        </div>
      </form>`;

const cuotasFormEndReplacement = `        </div>
        <div class="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-end gap-2.5">
          <button type="button" onclick="closeModal('modal-plan-cuotas')" class="btn-portal-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-cuotas" class="btn-portal-primary">
            <span id="txt-btn-submit-cuotas">Guardar Plan</span>
          </button>
        </div>
      </form>`;

if (content.includes(cuotasFormEnd)) {
  content = content.replace(cuotasFormEnd, cuotasFormEndReplacement);
}

// 5. MODAL CONCILIAR
const conciliarTarget = `<div id="modal-conciliar-transaccion"
    class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 items-center justify-center p-4">
    <div class="portal-surface elevation-3 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      
      <!-- Cabecera -->
      <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-cyan-50/80 dark:bg-cyan-950/30">`;

const conciliarReplacement = `<div id="modal-conciliar-transaccion"
    class="hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-conciliar-transaccion-card" class="portal-surface elevation-3 w-full max-w-md max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">

      <!-- DRAG HANDLE MÓVIL (BOTTOM SHEET) -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

      <!-- Cabecera -->
      <div class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-cyan-50/80 dark:bg-cyan-950/30">`;

if (content.includes(conciliarTarget)) {
  content = content.replace(conciliarTarget, conciliarReplacement);
}

const conciliarFormStart = `<form id="form-conciliar-transaccion" class="p-5 space-y-3.5 text-xs">`;
const conciliarFormStartReplacement = `<form id="form-conciliar-transaccion" class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-3.5 custom-scrollbar text-xs">`;

if (content.includes(conciliarFormStart)) {
  content = content.replace(conciliarFormStart, conciliarFormStartReplacement);
}

const conciliarFormEnd = `        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onclick="closeModal('modal-conciliar-transaccion')" class="btn-portal-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-conciliar" class="btn-portal-primary">
            Confirmar y Conciliar
          </button>
        </div>
      </form>`;

const conciliarFormEndReplacement = `        </div>
        <div class="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-end gap-2.5">
          <button type="button" onclick="closeModal('modal-conciliar-transaccion')" class="btn-portal-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-conciliar" class="btn-portal-primary">
            Confirmar y Conciliar
          </button>
        </div>
      </form>`;

if (content.includes(conciliarFormEnd)) {
  content = content.replace(conciliarFormEnd, conciliarFormEndReplacement);
}

fs.writeFileSync('Modal_Finanzas.html', content, 'utf8');
console.log('Successfully upgraded Modal_Finanzas.html!');
