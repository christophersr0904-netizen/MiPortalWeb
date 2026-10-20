const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== APLICANDO PARCHE DE POPOVER / PREVIEW FLOTANTE DE NOTAS ===');

// 1. ACTUALIZAR JS_Core.html (generarBadgeNotasVinculadas)
const corePath = path.join(__dirname, '..', 'JS_Core.html');
let coreContent = fs.readFileSync(corePath, 'utf8');

const targetCoreBadge = `      return '<span onclick="' + onclickAttr + '" ' +
        'class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-semibold border ' + cfg.bgClass + ' ' + (extraClass || '') + ' transition-all active:scale-95 cursor-pointer shadow-2xs z-10" ' +
        'title="' + escapeHtml(tooltip) + '">' +
        cfg.svg +
        contadorHtml +
        '</span>';`;

const replacementCoreBadge = `      return '<span onclick="' + onclickAttr + '" ' +
        'onmouseenter="if(typeof window.mostrarPopoverNotaHover===\\'function\\') window.mostrarPopoverNotaHover(event, \\'' + idPrimeraNota + '\\');" ' +
        'onmouseleave="if(typeof window.ocultarPopoverNotaHover===\\'function\\') window.ocultarPopoverNotaHover();" ' +
        'onmousemove="if(typeof window.moverPopoverNotaHover===\\'function\\') window.moverPopoverNotaHover(event);" ' +
        'class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-semibold border ' + cfg.bgClass + ' ' + (extraClass || '') + ' transition-all active:scale-95 cursor-pointer shadow-2xs z-10" ' +
        'title="' + escapeHtml(tooltip) + '">' +
        cfg.svg +
        contadorHtml +
        '</span>';`;

if (coreContent.includes(targetCoreBadge)) {
  coreContent = coreContent.replace(targetCoreBadge, replacementCoreBadge);
  fs.writeFileSync(corePath, coreContent, 'utf8');
  console.log('[OK] JS_Core.html actualizado con atributos hover en generarBadgeNotasVinculadas');
} else {
  console.log('[WARN] targetCoreBadge no encontrado en JS_Core.html, verificando con normalización...');
  const normCore = coreContent.replace(/\r\n/g, '\n');
  const normTarget = targetCoreBadge.replace(/\r\n/g, '\n');
  if (normCore.includes(normTarget)) {
    coreContent = normCore.replace(normTarget, replacementCoreBadge.replace(/\r\n/g, '\n'));
    fs.writeFileSync(corePath, coreContent, 'utf8');
    console.log('[OK] JS_Core.html actualizado (con normalización LF)');
  } else {
    console.log('[FAIL] No se pudo encontrar targetCoreBadge');
  }
}

// 2. ACTUALIZAR JS_Notas.html (Controlador Popover Hover)
const notasPath = path.join(__dirname, '..', 'JS_Notas.html');
let notasContent = fs.readFileSync(notasPath, 'utf8');

const controllerCode = `
  // ============================================================================
  // PREVISUALIZACIÓN FLOTANTE GLOBAL DE NOTAS (POPOVER / HOVER ENRIQUECIDO)
  // ============================================================================
  function buscarNotaPorId(idNota) {
    if (!idNota) return null;
    var idBuscado = String(idNota).trim().toUpperCase();
    var st = window.state || (typeof state !== 'undefined' ? state : null);
    var todasNotas = (st && Array.isArray(st.notas)) ? st.notas : (window._notasCache || []);
    var n = todasNotas.find(function (item) {
      if (!item) return false;
      var nid = String(item.ID_Nota || item.idNota || item.id || '').trim().toUpperCase();
      return nid === idBuscado;
    });
    if (n) return n;

    // Si no se encontró por ID_Nota directo, verificar si es ID de entidad vinculada
    if (typeof obtenerNotasVinculadasAEntidad === 'function') {
      var vincs = obtenerNotasVinculadasAEntidad(idNota);
      if (vincs && vincs.length > 0) return vincs[0];
    }
    return null;
  }

  function posicionarPopoverNota(event) {
    var popover = document.getElementById('popover-nota-preview');
    if (!popover || !event) return;

    var pad = 14;
    var mouseX = event.clientX;
    var mouseY = event.clientY;

    var popoverWidth = popover.offsetWidth || 300;
    var popoverHeight = popover.offsetHeight || 120;
    var winWidth = window.innerWidth;
    var winHeight = window.innerHeight;

    var posX = mouseX + pad;
    var posY = mouseY + pad;

    // Colisión derecha: si se desborda del viewport, posicionar a la izquierda
    if (posX + popoverWidth + pad > winWidth) {
      posX = mouseX - popoverWidth - pad;
    }
    // Colisión inferior: si se desborda del viewport, posicionar arriba
    if (posY + popoverHeight + pad > winHeight) {
      posY = mouseY - popoverHeight - pad;
    }

    // Límites mínimos
    if (posX < pad) posX = pad;
    if (posY < pad) posY = pad;

    popover.style.left = posX + 'px';
    popover.style.top = posY + 'px';
  }

  function mostrarPopoverNotaHover(event, idNota) {
    // 4. Adaptación ergonómica: silenciar hover en móvil o dispositivos táctiles sin hover
    if (window.innerWidth < 768) return;
    if ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches) return;

    var popover = document.getElementById('popover-nota-preview');
    if (!popover) return;

    var elTitulo = document.getElementById('popover-nota-titulo');
    var elFecha = document.getElementById('popover-nota-fecha');
    var elCuerpo = document.getElementById('popover-nota-cuerpo');
    var elTags = document.getElementById('popover-nota-tags');

    var nota = buscarNotaPorId(idNota);

    // 1. Título
    var titulo = nota ? (nota.Titulo_Nota || nota.Titulo || nota.titulo || 'Nota sin título') : 'Nota vinculada';
    if (elTitulo) elTitulo.textContent = titulo;

    // 2. Fecha (DD/MM/AAAA)
    var fechaStr = '';
    if (nota) {
      var fRaw = nota.Fecha_Modificacion || nota.Fecha_Creacion || nota.Fecha || nota.fecha;
      if (fRaw) {
        var d = new Date(fRaw);
        if (!isNaN(d.getTime())) {
          var dd = String(d.getDate()).padStart(2, '0');
          var mm = String(d.getMonth() + 1).padStart(2, '0');
          var yy = d.getFullYear();
          fechaStr = dd + '/' + mm + '/' + yy;
        } else {
          fechaStr = String(fRaw).split('T')[0];
        }
      }
    }
    if (elFecha) elFecha.textContent = fechaStr || 'Reciente';

    // 3. Cuerpo / Contenido
    var cuerpoRaw = nota ? (nota.Contenido_Nota || nota.Contenido || nota.Cuerpo || nota.contenido || '') : '';
    if (typeof cuerpoRaw === 'string' && cuerpoRaw.trim().startsWith('{')) {
      try {
        var obj = JSON.parse(cuerpoRaw);
        if (obj.items && Array.isArray(obj.items)) {
          cuerpoRaw = obj.items.map(function (it) { return (it.check ? '☑ ' : '☐ ') + (it.texto || ''); }).join('\\n');
        } else if (obj.filas && Array.isArray(obj.filas)) {
          cuerpoRaw = obj.filas.map(function (f) { return '• ' + Object.values(f).filter(function (v) { return typeof v === 'string'; }).join(' | '); }).join('\\n');
        }
      } catch (eJson) {}
    }
    var cuerpoLimpio = (cuerpoRaw && cuerpoRaw.trim()) ? cuerpoRaw.trim() : 'Nota vinculada (Haz clic para ver detalles)';
    if (elCuerpo) elCuerpo.textContent = cuerpoLimpio;

    // 4. Tags
    if (elTags) {
      var tagsRaw = nota ? (nota.Etiquetas || nota.Tags || nota.tags || '') : '';
      var tagsArr = Array.isArray(tagsRaw) ? tagsRaw : (typeof tagsRaw === 'string' && tagsRaw.trim() ? tagsRaw.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : []);
      if (tagsArr.length > 0) {
        var helperEscape = (typeof escapeHtml === 'function') ? escapeHtml : function (s) { return String(s || ''); };
        elTags.innerHTML = tagsArr.slice(0, 4).map(function (t) {
          return '<span class="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700/60">#' + helperEscape(t.replace(/^#/, '')) + '</span>';
        }).join('');
        elTags.classList.remove('hidden');
      } else {
        elTags.innerHTML = '';
        elTags.classList.add('hidden');
      }
    }

    // 5. Posicionamiento inteligente y animación fluida
    popover.classList.remove('hidden');
    posicionarPopoverNota(event);

    clearTimeout(window._timerOcultarPopoverNota);
    requestAnimationFrame(function () {
      popover.classList.remove('opacity-0');
      popover.classList.add('opacity-100');
    });
  }

  function moverPopoverNotaHover(event) {
    if (window.innerWidth < 768) return;
    posicionarPopoverNota(event);
  }

  function ocultarPopoverNotaHover() {
    var popover = document.getElementById('popover-nota-preview');
    if (!popover) return;
    popover.classList.remove('opacity-100');
    popover.classList.add('opacity-0');

    clearTimeout(window._timerOcultarPopoverNota);
    window._timerOcultarPopoverNota = setTimeout(function () {
      if (popover.classList.contains('opacity-0')) {
        popover.classList.add('hidden');
      }
    }, 150);
  }

  window.mostrarPopoverNotaHover = mostrarPopoverNotaHover;
  window.moverPopoverNotaHover = moverPopoverNotaHover;
  window.ocultarPopoverNotaHover = ocultarPopoverNotaHover;
`;

if (!notasContent.includes('mostrarPopoverNotaHover')) {
  notasContent = notasContent.replace(
    'window.desvincularNotaDeEntidad = desvincularNotaDeEntidad;',
    `window.desvincularNotaDeEntidad = desvincularNotaDeEntidad;\n` + controllerCode
  );
  fs.writeFileSync(notasPath, notasContent, 'utf8');
  console.log('[OK] JS_Notas.html actualizado con controlador Popover Hover');
}

// 3. ACTUALIZAR JS_Habitos.html (renderListaNotasActividadFlow)
const habitosPath = path.join(__dirname, '..', 'JS_Habitos.html');
let habitosContent = fs.readFileSync(habitosPath, 'utf8');

const targetHabitoRow = `'<div class="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer" onclick="if(typeof window.abrirModalEditarNotaConDatos===\\'function\\'){ window.abrirModalEditarNotaConDatos(\\'' + idN + '\\'); }else if(typeof window.abrirModalEditarNota===\\'function\\'){ window.abrirModalEditarNota(\\'' + idN + '\\'); }">' +`;

const replacementHabitoRow = `'<div class="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer" onclick="if(typeof window.abrirModalEditarNotaConDatos===\\'function\\'){ window.abrirModalEditarNotaConDatos(\\'' + idN + '\\'); }else if(typeof window.abrirModalEditarNota===\\'function\\'){ window.abrirModalEditarNota(\\'' + idN + '\\'); }" onmouseenter="if(typeof window.mostrarPopoverNotaHover===\\'function\\') window.mostrarPopoverNotaHover(event, \\'' + idN + '\\');" onmouseleave="if(typeof window.ocultarPopoverNotaHover===\\'function\\') window.ocultarPopoverNotaHover();" onmousemove="if(typeof window.moverPopoverNotaHover===\\'function\\') window.moverPopoverNotaHover(event);">' +`;

const habitosNorm = habitosContent.replace(/\r\n/g, '\n');
const targetHabitoNorm = targetHabitoRow.replace(/\r\n/g, '\n');

if (habitosNorm.includes(targetHabitoNorm)) {
  habitosContent = habitosNorm.replace(targetHabitoNorm, replacementHabitoRow.replace(/\r\n/g, '\n'));
  fs.writeFileSync(habitosPath, habitosContent, 'utf8');
  console.log('[OK] JS_Habitos.html actualizado con eventos hover en lista de notas del modal');
}

// 4. Validar sintaxis de todos los scripts afectados
[corePath, notasPath, habitosPath].forEach(fp => {
  const c = fs.readFileSync(fp, 'utf8');
  const reg = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m;
  let b = 1;
  while ((m = reg.exec(c)) !== null) {
    new vm.Script(m[1], { filename: `${path.basename(fp)}#b${b}` });
    b++;
  }
  console.log(`[PASS] ${path.basename(fp)}: Sintaxis JS verificada sin errores`);
});
