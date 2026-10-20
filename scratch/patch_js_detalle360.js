const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '..', 'JS_Detalle360.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Agregar sort determinista de fases antes del loop de fases
const targetSortAnchor = 'var fragmentHitos = document.createDocumentFragment();';

const sortLogic = `    // Ordenamiento determinista de fases según ciclo de vida canónico
    function normalizarTextoFase(str) {
      return String(str || '').trim().toLowerCase()
        .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    }

    function extraerIndiceFase(faseStr) {
      var s = String(faseStr || '').trim();
      var m = s.match(/^(?:f|fase\\s*)?0*(\\d+)(?:[_\\s.:\\-)].*|$)/i);
      if (m && m[1]) {
        return parseInt(m[1], 10);
      }
      return null;
    }

    var cicloVidaEstandar = [
      'iniciacion',
      'planificacion',
      'diseno',
      'ejecucion',
      'procura',
      'construccion',
      'validacion',
      'pruebas',
      'cierre'
    ];

    function obtenerIndiceCicloVida(faseStr) {
      var norm = normalizarTextoFase(faseStr);
      for (var i = 0; i < cicloVidaEstandar.length; i++) {
        if (norm.indexOf(cicloVidaEstandar[i]) !== -1) {
          return i;
        }
      }
      return -1;
    }

    fasesOrden.sort(function (a, b) {
      var idxA = extraerIndiceFase(a);
      var idxB = extraerIndiceFase(b);
      if (idxA !== null && idxB !== null) {
        if (idxA !== idxB) return idxA - idxB;
      } else if (idxA !== null) {
        return -1;
      } else if (idxB !== null) {
        return 1;
      }

      var cA = obtenerIndiceCicloVida(a);
      var cB = obtenerIndiceCicloVida(b);
      if (cA !== -1 && cB !== -1) {
        if (cA !== cB) return cA - cB;
      } else if (cA !== -1) {
        return -1;
      } else if (cB !== -1) {
        return 1;
      }

      return String(a || '').localeCompare(String(b || ''), undefined, { numeric: true, sensitivity: 'base' });
    });

    var fragmentHitos = document.createDocumentFragment();`;

if (!content.includes('extraerIndiceFase')) {
  content = content.replace(targetSortAnchor, sortLogic);
}

// 2. Elevar micro-badges F1-F4 y limpiar texto "+ Entregable" a "Entregable"
// Buscamos el banner de fase
const targetBannerFase = `      // Banner Header de Fase (Nivel 1 WBS)
      var bannerFase = document.createElement('div');
      bannerFase.className = 'flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70';
      bannerFase.innerHTML =
        '<div class="flex items-center gap-2.5 min-w-0 flex-1">' +
        '  <span class="inline-flex items-center justify-center min-w-[2rem] px-2 h-7 rounded-xl bg-violet-600 dark:bg-violet-500 text-white font-extrabold text-xs shadow-2xs shrink-0 font-mono tracking-tight">F' + (idxFase + 1) + '</span>' +
        '  <div class="min-w-0 flex-1">' +
        '    <div class="flex items-center gap-2 flex-wrap">' +
        '      <h3 class="font-black text-slate-900 dark:text-slate-100 text-sm md:text-base leading-tight truncate">' + escapeHtmlDetalle(grupo.nombre) + '</h3>' +
        '      <span class="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">(' + textoContadorFase + ')</span>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<div class="flex items-center gap-2 shrink-0 flex-wrap">' +
        '  <span class="text-xs badge-sem-indigo font-mono tabular-nums font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-2xs">' +
        '    <span>Peso: <b>' + pctPesoFase + '%</b></span>' +
        '  </span>' +
        '  <button type="button" onclick="abrirModalCrearHitoFase(\\'' + nombreFaseEsc + '\\')" class="btn-portal-secondary text-xs px-2.5 py-1 flex items-center gap-1 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-2xs" title="Crear entregable en esta fase">' +
        '    <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>' +
        '    <span>+ Entregable</span>' +
        '  </button>' +
        '</div>';`;

const replacementBannerFase = `      // Banner Header de Fase (Nivel 1 WBS) - Elevación Cobalt A.2.2 y Gradientes Semánticos
      var gradienteFase = 'bg-gradient-to-r from-sky-500 to-indigo-600 shadow-sm shadow-indigo-500/20';
      if (idxFase === 1) {
        gradienteFase = 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-sm shadow-purple-500/20';
      } else if (idxFase === 2) {
        gradienteFase = 'bg-gradient-to-r from-purple-500 to-pink-600 shadow-sm shadow-pink-500/20';
      } else if (idxFase >= 3) {
        gradienteFase = 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm shadow-emerald-500/20';
      }

      var bannerFase = document.createElement('div');
      bannerFase.className = 'flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70';
      bannerFase.innerHTML =
        '<div class="flex items-center gap-2.5 min-w-0 flex-1">' +
        '  <span class="inline-flex items-center justify-center min-w-[2.2rem] px-2 h-7 rounded-lg ' + gradienteFase + ' text-white font-mono font-black text-[11px] border border-white/20 tracking-tight shrink-0 shadow-xs">F' + (idxFase + 1) + '</span>' +
        '  <div class="min-w-0 flex-1">' +
        '    <div class="flex items-center gap-2 flex-wrap">' +
        '      <h3 class="font-black text-slate-900 dark:text-slate-100 text-sm md:text-base leading-tight truncate">' + escapeHtmlDetalle(grupo.nombre) + '</h3>' +
        '      <span class="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">(' + textoContadorFase + ')</span>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<div class="flex items-center gap-2 shrink-0 flex-wrap">' +
        '  <span class="text-xs badge-sem-indigo font-mono tabular-nums font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-2xs">' +
        '    <span>Peso: <b>' + pctPesoFase + '%</b></span>' +
        '  </span>' +
        '  <button type="button" onclick="abrirModalCrearHitoFase(\\'' + nombreFaseEsc + '\\')" class="btn-portal-secondary text-xs px-2.5 py-1 flex items-center gap-1 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-2xs cursor-pointer active:scale-95 transition-all" title="Crear entregable en esta fase">' +
        '    <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>' +
        '    <span>Entregable</span>' +
        '  </button>' +
        '</div>';`;

// Normalize CRLF to match either
const targetBannerFaseNormalized = targetBannerFase.replace(/\r\n/g, '\n');
const contentNormalized = content.replace(/\r\n/g, '\n');

if (contentNormalized.includes(targetBannerFaseNormalized)) {
  content = contentNormalized.replace(targetBannerFaseNormalized, replacementBannerFase.replace(/\r\n/g, '\n'));
} else {
  console.log('WARN: targetBannerFase not found directly, checking partial matches...');
}

// 3. Compactación y armonía de botones en WP card: [+ TAREA | ✨ IA | GASTO | ELIMINAR]
const targetActionsRow = `'<div class="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">' +
            '<!-- KPI PANEL CONTROL FINANCIERO: [Presupuesto Estimado vs. Real Ejecutado por Tareas | Varianza en S/ | % Consumido] -->' +
            '<div class="px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs text-right mr-1 flex flex-col justify-center min-w-[170px]">' +
            '  <div class="flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums">' +
            '    <span class="text-slate-400 dark:text-slate-500 font-bold uppercase">Est vs Real:</span>' +
            '    <span class="font-bold text-slate-700 dark:text-slate-300">S/ ' + (presEstimadoHito > 0 ? presEstimadoHito.toLocaleString('es-PE', {minimumFractionDigits: 1, maximumFractionDigits: 1}) : '-') + ' | <b class="' + (realEjecutadoHito > presEstimadoHito && presEstimadoHito > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-emerald-600 dark:text-emerald-400 font-bold') + '">S/ ' + realEjecutadoHito.toLocaleString('es-PE', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + '</b></span>' +
            '  </div>' +
            '  <div class="flex items-center justify-between gap-1.5 text-[9.5px] font-mono tabular-nums mt-0.5">' +
            '    <span class="' + (varianzaHito >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-extrabold') + '">' + (presEstimadoHito > 0 ? (varianzaHito >= 0 ? 'Ahorro +S/' + varianzaHito.toFixed(1) : 'Desvío -S/' + Math.abs(varianzaHito).toFixed(1)) : 'Sin Techo') + '</span>' +
            '    <span class="px-1.5 py-0.5 rounded-md border text-[9px] font-bold flex items-center gap-1 ' + semBadgeClass + '">' + semIcon + ' ' + (presEstimadoHito > 0 ? pctConsumidoHito + '%' : (realEjecutadoHito > 0 ? '100%' : '0%')) + '</span>' +
            '  </div>' +
            '</div>' +
            '<button type="button" onclick="abrirModalCrearTareaConHito(\\'' + idHitoKey + '\\')" class="btn-portal-primary text-xs px-2.5 py-1" title="Crear tarea en este paquete de trabajo">' +
            '+ Tarea' +
            '</button>' +
            '<button type="button" onclick="abrirModalCrearGastoConHito(\\'' + idHitoKey + '\\')" class="btn-portal-secondary text-xs px-2.5 py-1 text-emerald-700 dark:text-emerald-300" title="Registrar gasto en este paquete de trabajo">' +
            '+ Gasto' +
            '</button>' +
            '<button type="button" onclick="desglosarTareasPaqueteIA(\\'' + idHitoKey + '\\', \\'' + escapeHtmlDetalle(nomElem).replace(/'/g, "\\\\'") + '\\')" class="btn-portal-secondary text-xs px-2.5 py-1 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 flex items-center gap-1 shadow-2xs" title="Desglosar tareas atómicas con IA">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg><span>IA Tareas</span>' +
            '</button>' +
            '<button type="button" onclick="confirmarEliminarHito(\\'' + idHitoKey + '\\')" class="btn-portal-icon text-slate-400 hover:text-rose-600 dark:hover:text-rose-400" title="Eliminar paquete de trabajo">' +
            '<svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>' +
            '</button>' +
            '</div>'`;

const replacementActionsRow = `'<div class="flex items-center gap-1.5 shrink-0 self-end md:self-center flex-wrap">' +
            '<!-- KPI PANEL CONTROL FINANCIERO -->' +
            '<div class="px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs text-right mr-0.5 flex flex-col justify-center min-w-[170px]">' +
            '  <div class="flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums">' +
            '    <span class="text-slate-400 dark:text-slate-500 font-bold uppercase">Est vs Real:</span>' +
            '    <span class="font-bold text-slate-700 dark:text-slate-300">S/ ' + (presEstimadoHito > 0 ? presEstimadoHito.toLocaleString('es-PE', {minimumFractionDigits: 1, maximumFractionDigits: 1}) : '-') + ' | <b class="' + (realEjecutadoHito > presEstimadoHito && presEstimadoHito > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-emerald-600 dark:text-emerald-400 font-bold') + '">S/ ' + realEjecutadoHito.toLocaleString('es-PE', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + '</b></span>' +
            '  </div>' +
            '  <div class="flex items-center justify-between gap-1.5 text-[9.5px] font-mono tabular-nums mt-0.5">' +
            '    <span class="' + (varianzaHito >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-extrabold') + '">' + (presEstimadoHito > 0 ? (varianzaHito >= 0 ? 'Ahorro +S/' + varianzaHito.toFixed(1) : 'Desvío -S/' + Math.abs(varianzaHito).toFixed(1)) : 'Sin Techo') + '</span>' +
            '    <span class="px-1.5 py-0.5 rounded-md border text-[9px] font-bold flex items-center gap-1 ' + semBadgeClass + '">' + semIcon + ' ' + (presEstimadoHito > 0 ? pctConsumidoHito + '%' : (realEjecutadoHito > 0 ? '100%' : '0%')) + '</span>' +
            '  </div>' +
            '</div>' +
            '<!-- BUTTON GROUP WP COMPACTO -->' +
            '<div class="inline-flex items-center gap-1 p-0.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">' +
            '  <button type="button" onclick="abrirModalCrearTareaConHito(\\'' + idHitoKey + '\\')" class="btn-portal-primary text-[11px] px-2 py-1 flex items-center gap-1 shadow-2xs active:scale-95 transition-all" title="Crear tarea en este paquete de trabajo">' +
            '    <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>' +
            '    <span>Tarea</span>' +
            '  </button>' +
            '  <button type="button" onclick="desglosarTareasPaqueteIA(\\'' + idHitoKey + '\\', \\'' + escapeHtmlDetalle(nomElem).replace(/'/g, "\\\\'") + '\\')" class="btn-portal-secondary text-[11px] px-2 py-1 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 flex items-center gap-1 shadow-2xs active:scale-95 transition-all" title="Desglosar tareas atómicas con IA">' +
            '    <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>' +
            '    <span>IA</span>' +
            '  </button>' +
            '  <button type="button" onclick="abrirModalCrearGastoConHito(\\'' + idHitoKey + '\\')" class="btn-portal-secondary text-[11px] px-2 py-1 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1 shadow-2xs active:scale-95 transition-all" title="Registrar gasto en este paquete de trabajo">' +
            '    <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' +
            '    <span>Gasto</span>' +
            '  </button>' +
            '  <button type="button" onclick="confirmarEliminarHito(\\'' + idHitoKey + '\\')" class="btn-portal-icon p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 active:scale-95 transition-all" title="Eliminar paquete de trabajo">' +
            '    <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>' +
            '  </button>' +
            '</div>' +
            '</div>'`;

const targetActionsRowNormalized = targetActionsRow.replace(/\r\n/g, '\n');
if (content.includes(targetActionsRowNormalized)) {
  content = content.replace(targetActionsRowNormalized, replacementActionsRow.replace(/\r\n/g, '\n'));
} else {
  console.log('WARN: targetActionsRow not found directly, checking partial matches...');
}

// Validar sintaxis
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
while ((match = scriptRegex.exec(content)) !== null) {
  new vm.Script(match[1]);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated JS_Detalle360.html!');
