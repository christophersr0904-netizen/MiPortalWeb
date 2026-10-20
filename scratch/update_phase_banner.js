const fs = require('fs');

// 1. Update JS_Detalle360.html
let code360 = fs.readFileSync('JS_Detalle360.html', 'utf8');

const oldBannerBlock = `      var pctPesoFase = Math.round(grupo.pesoTotal * 100);
      var countWP = grupo.paquetes.length;
      var countHit = grupo.marcadores.length;

      // Banner Header de Fase (Nivel 1 WBS)
      var bannerFase = document.createElement('div');
      bannerFase.className = 'flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/70 dark:border-slate-800/70';
      bannerFase.innerHTML =
        '<div class="flex items-center gap-2.5 min-w-0 flex-1">' +
        '  <span class="inline-flex items-center justify-center min-w-[1.75rem] px-1.5 h-7 rounded-xl bg-violet-600 dark:bg-violet-500 text-white font-extrabold text-xs shadow-2xs shrink-0 font-mono">F' + (idxFase + 1) + '</span>' +
        '  <div class="min-w-0 flex-1">' +
        '    <div class="flex items-center gap-2 flex-wrap">' +
        '      <span class="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">Nivel 1 • Fase</span>' +
        '      <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">(' + countWP + ' Paquetes WP • ' + countHit + ' Marcadores)</span>' +
        '    </div>' +
        '    <h3 class="font-black text-slate-900 dark:text-slate-100 text-sm md:text-base leading-tight truncate mt-0.5">' + escapeHtmlDetalle(grupo.nombre) + '</h3>' +
        '  </div>' +
        '</div>' +
        '<div class="flex items-center gap-2 shrink-0">' +
        '  <span class="text-xs badge-sem-indigo font-mono tabular-nums font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-2xs">' +
        '    <span>Peso Fase: <b>' + pctPesoFase + '%</b></span>' +
        '  </span>' +
        '</div>';`;

const newBannerBlock = `      var pctPesoFase = Math.round(grupo.pesoTotal * 100);
      var countWP = grupo.paquetes.length;
      var countHit = grupo.marcadores.length;
      var totalEntregablesFase = countWP + countHit;
      var textoContadorFase = totalEntregablesFase === 1 ? '1 entregable' : totalEntregablesFase + ' entregables';
      if (countWP > 0 && countHit > 0) {
        textoContadorFase = countWP + ' WP • ' + countHit + ' hitos';
      }
      var nombreFaseEsc = escapeHtmlDetalle(grupo.nombre).replace(/'/g, "\\\\'");

      // Banner Header de Fase (Nivel 1 WBS)
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
        '  <button type="button" onclick="abrirModalCrearHitoFase(\\\'' + nombreFaseEsc + '\\\')" class="btn-portal-secondary text-xs px-2.5 py-1 flex items-center gap-1 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-2xs" title="Crear entregable en esta fase">' +
        '    <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>' +
        '    <span>+ Entregable</span>' +
        '  </button>' +
        '</div>';`;

const oldBannerBlockCRLF = oldBannerBlock.replace(/\r?\n/g, '\r\n');
const newBannerBlockCRLF = newBannerBlock.replace(/\r?\n/g, '\r\n');

if (code360.includes(oldBannerBlockCRLF)) {
  code360 = code360.replace(oldBannerBlockCRLF, newBannerBlockCRLF);
} else {
  const oldBannerBlockLF = oldBannerBlock.replace(/\r?\n/g, '\n');
  const newBannerBlockLF = newBannerBlock.replace(/\r?\n/g, '\n');
  if (code360.includes(oldBannerBlockLF)) {
    code360 = code360.replace(oldBannerBlockLF, newBannerBlockLF);
  } else {
    console.error('Error: oldBannerBlock not found in JS_Detalle360.html');
    process.exit(1);
  }
}

// Ensure abrirModalCrearHitoFase is exported in JS_Detalle360.html
const oldExport360 = '  window.abrirModalAsistenteWbsIA = abrirModalAsistenteWbsIA;';
const newExport360 = '  window.abrirModalCrearHitoFase = function(fase) { if (typeof window.abrirModalCrearHito === "function") { window.abrirModalCrearHito(); var inF = document.getElementById("hito-faseAsociada"); if (inF && fase) inF.value = fase; } };\r\n  window.abrirModalAsistenteWbsIA = abrirModalAsistenteWbsIA;';

if (code360.includes(oldExport360)) {
  code360 = code360.replace(oldExport360, newExport360);
}

fs.writeFileSync('JS_Detalle360.html', code360, 'utf8');
console.log('Successfully updated JS_Detalle360.html phase banners!');

// 2. Update JS_ModalesYAtajos.html
let codeModales = fs.readFileSync('JS_ModalesYAtajos.html', 'utf8');

const targetHitoFunction = '  window.abrirModalCrearHito = abrirModalCrearHito;';
const replacementHitoFunction = `  function abrirModalCrearHitoFase(nombreFase) {
    if (!state.proyectoDetalleActivo) return;
    abrirModalCrearHito();
    var inFase = document.getElementById('hito-faseAsociada');
    if (inFase && nombreFase) {
      inFase.value = nombreFase;
    }
  }

  window.abrirModalCrearHitoFase = abrirModalCrearHitoFase;
  window.abrirModalCrearHito = abrirModalCrearHito;`;

if (codeModales.includes(targetHitoFunction)) {
  codeModales = codeModales.replace(targetHitoFunction, replacementHitoFunction);
  fs.writeFileSync('JS_ModalesYAtajos.html', codeModales, 'utf8');
  console.log('Successfully added abrirModalCrearHitoFase in JS_ModalesYAtajos.html!');
} else {
  console.error('Error: targetHitoFunction not found in JS_ModalesYAtajos.html');
  process.exit(1);
}
