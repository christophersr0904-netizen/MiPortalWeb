const fs = require('fs');

let code = fs.readFileSync('JS_Portafolio.html', 'utf8');

// 1. Add call to actualizarContadoresPildorasPortafolio in renderKPIsPortafolio
const targetRenderKPIs = '    // Preconstrucción en memoria de Mapas Hash O(1) de Tareas y Gastos';
const replacementRenderKPIs = `    actualizarContadoresPildorasPortafolio();\n    // Preconstrucción en memoria de Mapas Hash O(1) de Tareas y Gastos`;

if (!code.includes(targetRenderKPIs)) {
  console.error('Error: targetRenderKPIs not found');
  process.exit(1);
}
code = code.replace(targetRenderKPIs, replacementRenderKPIs);

// 2. Add call to actualizarContadoresPildorasPortafolio in renderGridProyectos
const targetRenderGrid = '    var filtrados = obtenerProyectosFiltradosPortafolio();';
const replacementRenderGrid = `    actualizarContadoresPildorasPortafolio();\n    var filtrados = obtenerProyectosFiltradosPortafolio();`;

if (!code.includes(targetRenderGrid)) {
  console.error('Error: targetRenderGrid not found');
  process.exit(1);
}
code = code.replace(targetRenderGrid, replacementRenderGrid);

// 3. Update limpiarFiltrosPortafolio
const targetLimpiar = `    var btnLimpiar = document.getElementById('btn-limpiar-filtros-portafolio');
    if (btnLimpiar) {
      btnLimpiar.classList.add('hidden');
      btnLimpiar.classList.remove('flex', 'inline-flex');
    }

    if (typeof renderKPIsPortafolio === 'function') renderKPIsPortafolio();`;

const replacementLimpiar = `    var btnLimpiar = document.getElementById('btn-limpiar-filtros-portafolio');
    if (btnLimpiar) {
      btnLimpiar.classList.add('hidden');
      btnLimpiar.classList.remove('flex', 'inline-flex');
    }

    actualizarEstilosPildorasPortafolio('');
    if (typeof renderKPIsPortafolio === 'function') renderKPIsPortafolio();`;

if (!code.includes(targetLimpiar)) {
  console.error('Error: targetLimpiar not found');
  process.exit(1);
}
code = code.replace(targetLimpiar, replacementLimpiar);

// 4. Inject the new pill filter functions before exports
const targetExports = '  // Exportación Universal a window para compatibilidad estricta';

const newFunctions = `  /**
   * 4.3.7. Píldoras de Cartera / Tipo (Glassmorphism & Acentos Luminosos)
   */
  function filtrarPortafolioPorTipo(tipo) {
    var inTipo = document.getElementById('grid-filter-tipo');
    if (inTipo) {
      inTipo.value = tipo || '';
    }
    actualizarEstilosPildorasPortafolio(tipo || '');
    if (typeof renderGridProyectos === 'function') {
      renderGridProyectos();
    }
  }

  function actualizarEstilosPildorasPortafolio(tipoActivo) {
    var config = [
      {
        tipo: '',
        id: 'pill-portafolio-tipo-todos',
        badgeId: 'badge-portafolio-tipo-todos',
        activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border-indigo-500',
        badgeActiveClass: 'bg-white/20 text-white',
        badgeInactiveClass: 'bg-slate-800 text-slate-400'
      },
      {
        tipo: 'Personal',
        id: 'pill-portafolio-tipo-personal',
        badgeId: 'badge-portafolio-tipo-personal',
        activeClass: 'bg-sky-600/90 text-white shadow-md shadow-sky-500/25 border-sky-400',
        badgeActiveClass: 'bg-white/20 text-white',
        badgeInactiveClass: 'bg-slate-800 text-slate-400'
      },
      {
        tipo: 'Profesional',
        id: 'pill-portafolio-tipo-profesional',
        badgeId: 'badge-portafolio-tipo-profesional',
        activeClass: 'bg-violet-600/90 text-white shadow-md shadow-violet-500/25 border-violet-400',
        badgeActiveClass: 'bg-white/20 text-white',
        badgeInactiveClass: 'bg-slate-800 text-slate-400'
      },
      {
        tipo: 'Inversiones',
        id: 'pill-portafolio-tipo-inversiones',
        badgeId: 'badge-portafolio-tipo-inversiones',
        activeClass: 'bg-emerald-600/90 text-white shadow-md shadow-emerald-500/25 border-emerald-400',
        badgeActiveClass: 'bg-white/20 text-white',
        badgeInactiveClass: 'bg-slate-800 text-slate-400'
      },
      {
        tipo: 'Social',
        id: 'pill-portafolio-tipo-social',
        badgeId: 'badge-portafolio-tipo-social',
        activeClass: 'bg-amber-600/90 text-white shadow-md shadow-amber-500/25 border-amber-400',
        badgeActiveClass: 'bg-white/20 text-white',
        badgeInactiveClass: 'bg-slate-800 text-slate-400'
      }
    ];

    var baseClass = 'pill-portafolio-tipo px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 border ';
    var inactiveClass = 'bg-slate-900/60 dark:bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white';

    config.forEach(function (item) {
      var el = document.getElementById(item.id);
      var badge = document.getElementById(item.badgeId);
      var esActivo = (item.tipo === (tipoActivo || ''));

      if (el) {
        el.className = baseClass + (esActivo ? item.activeClass : inactiveClass);
      }
      if (badge) {
        badge.className = 'text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full ' + (esActivo ? item.badgeActiveClass : item.badgeInactiveClass);
      }
    });
  }

  function actualizarContadoresPildorasPortafolio() {
    var proys = (state && Array.isArray(state.proyectos)) ? state.proyectos : [];
    var counts = {
      todos: 0,
      personal: 0,
      profesional: 0,
      inversiones: 0,
      social: 0
    };

    proys.forEach(function (p) {
      if (typeof esElementoArchivado === 'function' && esElementoArchivado(p)) return;
      counts.todos++;
      var t = String(p.Tipo_Iniciativa || '').trim();
      if (t === 'Personal') counts.personal++;
      else if (t === 'Profesional') counts.profesional++;
      else if (t === 'Inversiones') counts.inversiones++;
      else if (t === 'Social') counts.social++;
    });

    var bTodos = document.getElementById('badge-portafolio-tipo-todos');
    if (bTodos) bTodos.textContent = counts.todos;
    var bPersonal = document.getElementById('badge-portafolio-tipo-personal');
    if (bPersonal) bPersonal.textContent = counts.personal;
    var bProfesional = document.getElementById('badge-portafolio-tipo-profesional');
    if (bProfesional) bProfesional.textContent = counts.profesional;
    var bInversiones = document.getElementById('badge-portafolio-tipo-inversiones');
    if (bInversiones) bInversiones.textContent = counts.inversiones;
    var bSocial = document.getElementById('badge-portafolio-tipo-social');
    if (bSocial) bSocial.textContent = counts.social;
  }

` + targetExports;

if (!code.includes(targetExports)) {
  console.error('Error: targetExports not found');
  process.exit(1);
}
code = code.replace(targetExports, newFunctions);

// 5. Update exports
const oldFinalExports = '  window.limpiarBusquedaPortafolio = limpiarBusquedaPortafolio;\n</script>';
const newFinalExports = '  window.limpiarBusquedaPortafolio = limpiarBusquedaPortafolio;\n  window.filtrarPortafolioPorTipo = filtrarPortafolioPorTipo;\n  window.actualizarEstilosPildorasPortafolio = actualizarEstilosPildorasPortafolio;\n  window.actualizarContadoresPildorasPortafolio = actualizarContadoresPildorasPortafolio;\n</script>';

if (code.includes(oldFinalExports)) {
  code = code.replace(oldFinalExports, newFinalExports);
} else {
  const oldFinalExportsCRLF = oldFinalExports.replace(/\n/g, '\r\n');
  const newFinalExportsCRLF = newFinalExports.replace(/\n/g, '\r\n');
  if (code.includes(oldFinalExportsCRLF)) {
    code = code.replace(oldFinalExportsCRLF, newFinalExportsCRLF);
  } else {
    console.error('Error: oldFinalExports not found in either LF or CRLF');
    process.exit(1);
  }
}

fs.writeFileSync('JS_Portafolio.html', code, 'utf8');
console.log('Successfully updated JS_Portafolio.html!');
