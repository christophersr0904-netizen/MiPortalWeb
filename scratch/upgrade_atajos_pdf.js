const fs = require('fs');

let content = fs.readFileSync('Modal_AtajosYPdf.html', 'utf8');

// 1. MODAL EXPORTAR PDF
const pdfTarget = `  <div id="modal-exportar-pdf"
    class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col">
      <div class="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">`;

const pdfReplacement = `  <div id="modal-exportar-pdf"
    class="hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-exportar-pdf-card" class="portal-surface elevation-3 w-full max-w-lg max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative">

      <!-- DRAG HANDLE MÓVIL (BOTTOM SHEET) -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

      <div class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">`;

if (!content.includes(pdfTarget)) {
  console.error('Target for modal-exportar-pdf not found!');
  process.exit(1);
}
content = content.replace(pdfTarget, pdfReplacement);

const pdfTabsTarget = `      <div class="px-5 pt-3 pb-2 bg-slate-100/70 border-b border-slate-200">`;
const pdfTabsReplacement = `      <div class="shrink-0 px-5 pt-3 pb-2 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800">`;
content = content.replace(pdfTabsTarget, pdfTabsReplacement);

const pdfBodyTarget = `      <div class="p-5 space-y-4 text-xs">`;
const pdfBodyReplacement = `      <div class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-4 custom-scrollbar text-xs">`;
content = content.replace(pdfBodyTarget, pdfBodyReplacement);

// 2. MODAL ATAJOS TECLADO
const atajosTarget = `  <div id="modal-atajos-teclado"
    class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] items-center justify-center p-3 sm:p-4">
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">

      <!-- Header Modal -->
      <div
        class="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-950/60 shrink-0">`;

const atajosReplacement = `  <div id="modal-atajos-teclado"
    class="hidden fixed inset-0 z-[9999] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
    <div id="modal-atajos-teclado-card"
      class="portal-surface elevation-3 w-full max-w-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative animate-fadeIn">

      <!-- DRAG HANDLE MÓVIL (BOTTOM SHEET) -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0"></div>

      <!-- Header Modal -->
      <div
        class="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">`;

if (!content.includes(atajosTarget)) {
  console.error('Target for modal-atajos-teclado not found!');
  process.exit(1);
}
content = content.replace(atajosTarget, atajosReplacement);

const atajosBodyTarget = `<div id="contenedor-lista-atajos" class="p-5 overflow-y-auto custom-scrollbar space-y-4 text-xs flex-1">`;
const atajosBodyReplacement = `<div id="contenedor-lista-atajos" class="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-4 custom-scrollbar text-xs">`;
content = content.replace(atajosBodyTarget, atajosBodyReplacement);

const atajosFooterTarget = `      <!-- Footer Modal -->
      <div
        class="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between shrink-0 flex-wrap gap-2">`;

const atajosFooterReplacement = `      <!-- Footer Modal -->
      <div
        class="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-2.5">`;

content = content.replace(atajosFooterTarget, atajosFooterReplacement);

fs.writeFileSync('Modal_AtajosYPdf.html', content, 'utf8');
console.log('Successfully upgraded Modal_AtajosYPdf.html!');
