const fs = require('fs');

let code = fs.readFileSync('JS_Detalle360.html', 'utf8');

// 1. Fix F1 bug and loop parameter
const oldLoop = 'fasesOrden.forEach(function (faseKey) {';
const newLoop = 'fasesOrden.forEach(function (faseKey, idxFase) {';
if (!code.includes(oldLoop)) {
  console.error('Error: oldLoop not found');
  process.exit(1);
}
code = code.replace(oldLoop, newLoop);

const oldF1 = '<span class="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-violet-600 dark:bg-violet-500 text-white font-extrabold text-xs shadow-2xs shrink-0">F1</span>';
const newF1 = '<span class="inline-flex items-center justify-center min-w-[1.75rem] px-1.5 h-7 rounded-xl bg-violet-600 dark:bg-violet-500 text-white font-extrabold text-xs shadow-2xs shrink-0 font-mono">F\' + (idxFase + 1) + \'</span>';
if (!code.includes(oldF1)) {
  console.error('Error: oldF1 not found');
  process.exit(1);
}
code = code.replace(oldF1, newF1);

// 2. Add Desglosar tareas con IA button and fix trash icon
const targetTrash = '<button type="button" onclick="confirmarEliminarHito(\\\'\' + idHitoKey + \'\\\')" class="btn-portal-icon text-slate-400 hover:text-rose-600 dark:hover:text-rose-400" title="Eliminar paquete de trabajo">\' +';

if (!code.includes(targetTrash)) {
  console.error('Error: targetTrash not found');
  process.exit(1);
}

const oldBlock = targetTrash +
  '\r\n            \'<svg class="portal-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>\' +' +
  '\r\n            \'</button>\' +';

const newBlock = '\'<button type="button" onclick="desglosarTareasPaqueteIA(\\\\\'\' + idHitoKey + \'\\\\\', \\\\\'\' + escapeHtmlDetalle(nomElem).replace(/\'/g, "\\\\\'") + \'\\\\\')" class="btn-portal-secondary text-xs px-2.5 py-1 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 flex items-center gap-1 shadow-2xs" title="Desglosar tareas atómicas con IA">\' +' +
  '\r\n            \'<svg xmlns="http://www.w3.org/2000/svg" class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg><span>IA Tareas</span>\' +' +
  '\r\n            \'</button>\' +' +
  '\r\n            \'<button type="button" onclick="confirmarEliminarHito(\\\\\'\' + idHitoKey + \'\\\\\')" class="btn-portal-icon text-slate-400 hover:text-rose-600 dark:hover:text-rose-400" title="Eliminar paquete de trabajo">\' +' +
  '\r\n            \'<svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>\' +' +
  '\r\n            \'</button>\' +';

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
} else {
  const oldBlockLF = oldBlock.replace(/\r\n/g, '\n');
  const newBlockLF = newBlock.replace(/\r\n/g, '\n');
  if (code.includes(oldBlockLF)) {
    code = code.replace(oldBlockLF, newBlockLF);
  } else {
    console.error('Error: oldBlock not found in either CRLF or LF');
    process.exit(1);
  }
}

// 3. Add AI functions before window exports
const anchorExports = '  // Exposición global para interoperabilidad y reactividad universal';
if (!code.includes(anchorExports)) {
  console.error('Error: anchorExports not found');
  process.exit(1);
}

const aiFunctionsCode = `  /**
   * =========================================================================
   * ASISTENTE DE IA: COMPLETAR WBS Y DESGLOSE DE TAREAS ATÓMICAS
   * =========================================================================
   */
  function abrirModalAsistenteWbsIA() {
    var p = state.proyectoDetalleActivo;
    if (!p) {
      if (typeof mostrarToastOperativo === 'function') {
        mostrarToastOperativo('warning', 'Proyecto requerido', 'Selecciona un proyecto activo para consultar a la IA.');
      }
      return;
    }

    var idProy = p.ID_Proyecto;
    var hitosProy = (state.hitos || []).filter(function (h) {
      return String(h.ID_Proyecto || '').trim() === String(idProy).trim();
    });

    var elementosExistentes = hitosProy.map(function (h) {
      return {
        id: h.ID_Elemento_WBS || h.ID_Hito,
        nombre: h.Nombre_Elemento || h.Nombre_Hito,
        tipo: h.Tipo_Elemento_WBS || (String(h.ID_Hito || '').startsWith('WP-') ? 'PAQUETE_TRABAJO' : 'HITO_MARCADOR'),
        fase: h.Fase_Asociada || 'General'
      };
    });

    var contexto = {
      idProyecto: idProy,
      nombreProyecto: p.Nombre_Proyecto || '',
      arquetipo: p.Arquetipo_Proyecto || p.Arquetipo || '1_Infraestructura',
      descripcion: p.North_Star_OKR || p.Descripcion || '',
      criteriosDoD: p.Criterios_Aceptacion_DoD || '',
      elementosExistentes: elementosExistentes
    };

    if (typeof mostrarToastOperativo === 'function') {
      mostrarToastOperativo('info', 'Consultando a Gemini', 'Analizando proyecto y vacíos en el WBS...');
    }

    callBackend('sugerirEstructuraWbsFaltanteIA', contexto, function (res) {
      if (res && res.success && res.data) {
        mostrarModalSugerenciasWbsIA(res.data, contexto);
      } else {
        if (typeof mostrarToastOperativo === 'function') {
          mostrarToastOperativo('error', 'Error en IA', (res && res.error) || 'No se pudieron generar sugerencias.');
        }
      }
    }, function (err) {
      if (typeof mostrarToastOperativo === 'function') {
        mostrarToastOperativo('error', 'Error de Conexión', (err && err.message) || 'Error de red con el asistente de IA.');
      }
    });
  }

  function mostrarModalSugerenciasWbsIA(dataIA, contexto) {
    var modal = document.getElementById('modal-ia-completar-wbs');
    if (!modal) return;

    var container = document.getElementById('contenedor-sugerencias-wbs-ia');
    var analisisEl = document.getElementById('analisis-wbs-ia');
    if (analisisEl) {
      analisisEl.textContent = dataIA.analisis || 'Sugerencias para completar el ciclo de vida del proyecto según su arquetipo.';
    }

    var sugerencias = dataIA.elementosSugeridos || [];
    if (!container) return;
    container.innerHTML = '';

    if (sugerencias.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-xs text-slate-500">No se detectaron vacíos significativos en el WBS actual. ¡Estructura completa!</div>';
    } else {
      sugerencias.forEach(function (elem, idx) {
        var card = document.createElement('div');
        card.className = 'p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2';
        var esWP = (elem.tipoElementoWBS || elem.tipo) === 'PAQUETE_TRABAJO';

        card.innerHTML =
          '<div class="flex items-start justify-between gap-3">' +
          '  <label class="flex items-center gap-2 cursor-pointer">' +
          '    <input type="checkbox" checked class="check-sugerencia-wbs w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" data-idx="' + idx + '">' +
          '    <div>' +
          '      <span class="text-xs font-black text-slate-900 dark:text-slate-100">' + escapeHtmlDetalle(elem.nombre) + '</span>' +
          '      <div class="flex items-center gap-1.5 mt-0.5">' +
          '        <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ' + (esWP ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300') + '">' + (esWP ? '📦 WP' : '🏁 HITO') + '</span>' +
          '        <span class="text-[10px] text-slate-500 font-medium">Fase: <b>' + escapeHtmlDetalle(elem.fase || 'General') + '</b></span>' +
          '      </div>' +
          '    </div>' +
          '  </label>' +
          '  <span class="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 font-bold shrink-0">' + (esWP ? 'S/ ' + (parseFloat(elem.presupuestoEstimado) || 0).toFixed(2) : '$0.00') + '</span>' +
          '</div>' +
          (elem.justificacion ? '<p class="text-[11px] text-slate-500 dark:text-slate-400 pl-6">' + escapeHtmlDetalle(elem.justificacion) + '</p>' : '') +
          (elem.criterioDoD ? '<div class="text-[10px] bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 ml-6"><b>DoD:</b> ' + escapeHtmlDetalle(elem.criterioDoD) + '</div>' : '');

        container.appendChild(card);
      });
    }

    window._sugerenciasWbsCache = sugerencias;
    openModal('modal-ia-completar-wbs');
  }

  function desglosarTareasPaqueteIA(idHito, nomHito) {
    var p = state.proyectoDetalleActivo;
    if (!p) return;

    var hito = (state.hitos || []).find(function (h) {
      return String(h.ID_Elemento_WBS || h.ID_Hito || '').trim() === String(idHito).trim();
    });

    var contexto = {
      idProyecto: p.ID_Proyecto,
      nombreProyecto: p.Nombre_Proyecto,
      arquetipo: p.Arquetipo_Proyecto || p.Arquetipo || '1_Infraestructura',
      idHito: idHito,
      nombreHito: nomHito || (hito ? hito.Nombre_Elemento || hito.Nombre_Hito : ''),
      criterioDoD: hito ? (hito.Criterio_Aceptacion_DoD || hito.Criterio_DoD || '') : ''
    };

    if (typeof mostrarToastOperativo === 'function') {
      mostrarToastOperativo('info', 'Consultando a Gemini', 'Desglosando paquete en tareas atómicas...');
    }

    callBackend('sugerirDesgloseTareasPaqueteIA', contexto, function (res) {
      if (res && res.success && res.data) {
        mostrarModalSugerenciasTareasIA(res.data, contexto);
      } else {
        if (typeof mostrarToastOperativo === 'function') {
          mostrarToastOperativo('error', 'Error en IA', (res && res.error) || 'No se pudieron desglosar tareas.');
        }
      }
    }, function (err) {
      if (typeof mostrarToastOperativo === 'function') {
        mostrarToastOperativo('error', 'Error de Red', (err && err.message) || 'Error al conectar con la IA.');
      }
    });
  }

  function mostrarModalSugerenciasTareasIA(dataIA, contexto) {
    var modal = document.getElementById('modal-ia-desglose-tareas');
    if (!modal) return;

    var titleEl = document.getElementById('titulo-paquete-ia-desglose');
    if (titleEl) titleEl.textContent = contexto.nombreHito || 'Paquete de Trabajo';

    var container = document.getElementById('contenedor-sugerencias-tareas-ia');
    var analisisEl = document.getElementById('analisis-tareas-ia');
    if (analisisEl) {
      analisisEl.textContent = dataIA.analisis || 'Tareas atómicas recomendadas para garantizar el criterio DoD del paquete.';
    }

    var tareas = dataIA.tareas || [];
    if (!container) return;
    container.innerHTML = '';

    if (tareas.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-xs text-slate-500">No se pudieron generar tareas específicas para este paquete.</div>';
    } else {
      tareas.forEach(function (t, idx) {
        var card = document.createElement('div');
        card.className = 'p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-1.5';

        card.innerHTML =
          '<div class="flex items-start justify-between gap-3">' +
          '  <label class="flex items-center gap-2 cursor-pointer">' +
          '    <input type="checkbox" checked class="check-sugerencia-tarea w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" data-idx="' + idx + '">' +
          '    <div>' +
          '      <span class="text-xs font-black text-slate-900 dark:text-slate-100">' + escapeHtmlDetalle(t.titulo) + '</span>' +
          '      <div class="flex items-center gap-2 mt-0.5">' +
          '        <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">~' + (t.tiempoEstimadoHoras || 2) + 'h</span>' +
          '        <span class="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">' + escapeHtmlDetalle(t.prioridad || 'Media') + '</span>' +
          '      </div>' +
          '    </div>' +
          '  </label>' +
          '</div>' +
          (t.descripcion ? '<p class="text-[11px] text-slate-500 dark:text-slate-400 pl-6">' + escapeHtmlDetalle(t.descripcion) + '</p>' : '');

        container.appendChild(card);
      });
    }

    window._sugerenciasTareasCache = {
      idHito: contexto.idHito,
      idProyecto: contexto.idProyecto,
      tareas: tareas
    };
    openModal('modal-ia-desglose-tareas');
  }

  function aplicarSugerenciasWbsIA() {
    var checks = document.querySelectorAll('.check-sugerencia-wbs:checked');
    if (!checks || checks.length === 0) {
      if (typeof mostrarToastOperativo === 'function') {
        mostrarToastOperativo('warning', 'Selección vacía', 'Por favor selecciona al menos un entregable para insertar.');
      }
      return;
    }

    var cache = window._sugerenciasWbsCache || [];
    var p = state.proyectoDetalleActivo;
    if (!p) return;

    var seleccionados = [];
    checks.forEach(function (c) {
      var idx = parseInt(c.getAttribute('data-idx'), 10);
      if (cache[idx]) seleccionados.push(cache[idx]);
    });

    closeModal('modal-ia-completar-wbs');
    if (typeof mostrarToastOperativo === 'function') {
      mostrarToastOperativo('info', 'Insertando Entregables', 'Guardando ' + seleccionados.length + ' elementos en la base de datos...');
    }

    var insertados = 0;
    seleccionados.forEach(function (elem) {
      var payload = {
        idProyecto: p.ID_Proyecto,
        tipoElementoWbs: elem.tipoElementoWBS || elem.tipo || 'PAQUETE_TRABAJO',
        nombreHito: elem.nombre,
        faseAsociada: elem.fase || 'Ejecucion',
        presupuestoAsignado: parseFloat(elem.presupuestoEstimado) || 0.0,
        criterioDod: elem.criterioDoD || '',
        pesoPct: parseFloat(elem.pesoPonderadoPct || elem.peso) || 0.15,
        estadoHito: '01_Pendiente'
      };

      callBackend('createHito', payload, function (res) {
        insertados++;
        if (res && res.success && res.data) {
          if (!state.hitos) state.hitos = [];
          state.hitos.push(res.data);
        }
        if (insertados === seleccionados.length) {
          if (typeof renderCascadaHitos === 'function') renderCascadaHitos(p.ID_Proyecto);
          if (typeof actualizarBentoKPIsProyecto === 'function') actualizarBentoKPIsProyecto(p.ID_Proyecto);
          if (typeof mostrarToastOperativo === 'function') {
            mostrarToastOperativo('success', 'WBS Actualizado', 'Se agregaron ' + seleccionados.length + ' entregables al proyecto.');
          }
        }
      }, function () {
        insertados++;
        if (insertados === seleccionados.length && typeof renderCascadaHitos === 'function') {
          renderCascadaHitos(p.ID_Proyecto);
        }
      }, { silent: true });
    });
  }

  function aplicarSugerenciasTareasIA() {
    var checks = document.querySelectorAll('.check-sugerencia-tarea:checked');
    if (!checks || checks.length === 0) {
      if (typeof mostrarToastOperativo === 'function') {
        mostrarToastOperativo('warning', 'Selección vacía', 'Por favor selecciona al menos una tarea para insertar.');
      }
      return;
    }

    var cacheObj = window._sugerenciasTareasCache || {};
    var tareas = cacheObj.tareas || [];
    var idHito = cacheObj.idHito;
    var idProyecto = cacheObj.idProyecto;
    var p = state.proyectoDetalleActivo;

    var seleccionadas = [];
    checks.forEach(function (c) {
      var idx = parseInt(c.getAttribute('data-idx'), 10);
      if (tareas[idx]) seleccionadas.push(tareas[idx]);
    });

    closeModal('modal-ia-desglose-tareas');
    if (typeof mostrarToastOperativo === 'function') {
      mostrarToastOperativo('info', 'Insertando Tareas', 'Guardando ' + seleccionadas.length + ' tareas en el paquete de trabajo...');
    }

    var insertadas = 0;
    seleccionadas.forEach(function (t) {
      var payload = {
        idProyecto: idProyecto,
        idHito: idHito,
        nombreTarea: t.titulo,
        descripcion: t.descripcion || '',
        tiempoEstimadoHoras: parseFloat(t.tiempoEstimadoHoras) || 2,
        prioridad: t.prioridad || 'Media',
        estadoTarea: '01_Pendiente'
      };

      callBackend('createTarea', payload, function (res) {
        insertadas++;
        if (res && res.success && res.data) {
          if (!state.tareas) state.tareas = [];
          state.tareas.push(res.data);
        }
        if (insertadas === seleccionadas.length) {
          if (typeof renderCascadaHitos === 'function' && p) renderCascadaHitos(p.ID_Proyecto);
          if (typeof renderKanban === 'function') renderKanban();
          if (typeof mostrarToastOperativo === 'function') {
            mostrarToastOperativo('success', 'Tareas Creadas', 'Se agregaron ' + seleccionadas.length + ' tareas al paquete de trabajo.');
          }
        }
      }, function () {
        insertadas++;
        if (insertadas === seleccionadas.length && typeof renderCascadaHitos === 'function' && p) {
          renderCascadaHitos(p.ID_Proyecto);
        }
      }, { silent: true });
    });
  }

\r\n` + anchorExports;

code = code.replace(anchorExports, aiFunctionsCode);

// 4. Update exports
const oldExports = '  window.actualizarNotaTradeOff = actualizarNotaTradeOff;\r\n</script>';
const newExports = '  window.actualizarNotaTradeOff = actualizarNotaTradeOff;\r\n  window.abrirModalAsistenteWbsIA = abrirModalAsistenteWbsIA;\r\n  window.desglosarTareasPaqueteIA = desglosarTareasPaqueteIA;\r\n  window.aplicarSugerenciasWbsIA = aplicarSugerenciasWbsIA;\r\n  window.aplicarSugerenciasTareasIA = aplicarSugerenciasTareasIA;\r\n</script>';

if (code.includes(oldExports)) {
  code = code.replace(oldExports, newExports);
} else {
  const oldExportsLF = oldExports.replace(/\r\n/g, '\n');
  const newExportsLF = newExports.replace(/\r\n/g, '\n');
  if (code.includes(oldExportsLF)) {
    code = code.replace(oldExportsLF, newExportsLF);
  } else {
    console.error('Error: oldExports not found');
    process.exit(1);
  }
}

fs.writeFileSync('JS_Detalle360.html', code, 'utf8');
console.log('Successfully updated JS_Detalle360.html!');
