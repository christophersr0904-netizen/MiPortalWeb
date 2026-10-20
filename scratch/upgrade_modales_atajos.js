const fs = require('fs');

let content = fs.readFileSync('JS_ModalesYAtajos.html', 'utf8');

// 1. Update form-create-hito listener
const oldFormHitoListener = `        var payload = {
          idProyecto: idProyHito,
          nombreHito: nomHito,
          pesoPct: parseFloat(document.getElementById('hito-peso').value) || 0.25,
          fechaLimite: document.getElementById('hito-fechaLimite').value,
          estadoHito: '01_Pendiente'
        };

        // 1. OPTIMISTIC UI: Crear hito temporal en memoria
        var tempIdHito = 'TEMP-HIT-' + Date.now();
        var nuevoHitoLocal = {
          ID_Hito: tempIdHito,
          ID_Proyecto: payload.idProyecto,
          Nombre_Hito: payload.nombreHito,
          Peso_Porcentual: payload.pesoPct,
          Fecha_Limite: payload.fechaLimite,
          Estado_Hito: '01_Pendiente',
          _isOptimistic: true
        };`;

const newFormHitoListener = `        var elTipo = document.getElementById('hito-tipoElementoWbs');
        var tipoElementoWbs = elTipo ? elTipo.value : 'PAQUETE_TRABAJO';
        var elFase = document.getElementById('hito-faseAsociada');
        var faseAsociada = (elFase && elFase.value.trim()) ? elFase.value.trim() : 'Fase 1: Entregables Principales';
        var elPres = document.getElementById('hito-presupuesto');
        var presupuestoAsignado = (tipoElementoWbs === 'PAQUETE_TRABAJO' && elPres) ? (parseFloat(elPres.value) || 0.0) : 0.0;
        var elDod = document.getElementById('hito-criterioDod');
        var criterioDod = elDod ? elDod.value.trim() : '';

        var payload = {
          idProyecto: idProyHito,
          tipoElementoWbs: tipoElementoWbs,
          nombreHito: nomHito,
          nombreElemento: nomHito,
          faseAsociada: faseAsociada,
          pesoPct: parseFloat(document.getElementById('hito-peso').value) || 0.20,
          fechaLimite: document.getElementById('hito-fechaLimite').value,
          presupuestoAsignado: presupuestoAsignado,
          criterioDod: criterioDod,
          estadoHito: '01_Pendiente'
        };

        // 1. OPTIMISTIC UI: Crear entregable temporal en memoria
        var tempPrefix = (tipoElementoWbs === 'PAQUETE_TRABAJO') ? 'TEMP-WP-' : 'TEMP-HIT-';
        var tempIdHito = tempPrefix + Date.now();
        var nuevoHitoLocal = {
          ID_Hito: tempIdHito,
          ID_Elemento_WBS: tempIdHito,
          ID_Proyecto: payload.idProyecto,
          Tipo_Elemento_WBS: tipoElementoWbs,
          Fase_Asociada: payload.faseAsociada,
          Nombre_Hito: payload.nombreHito,
          Nombre_Elemento: payload.nombreHito,
          Peso_Porcentual: payload.pesoPct,
          Peso_Ponderado_Pct: payload.pesoPct,
          Fecha_Limite: payload.fechaLimite,
          Fecha_Limite_Plan: payload.fechaLimite,
          Presupuesto_Asignado: payload.presupuestoAsignado,
          Criterio_Aceptacion_DoD: payload.criterioDod,
          Estado_Hito: '01_Pendiente',
          _isOptimistic: true
        };`;

if (!content.includes(oldFormHitoListener)) {
  console.error('Error: oldFormHitoListener not found');
  process.exit(1);
}
content = content.replace(oldFormHitoListener, newFormHitoListener);

// 2. Update form-editar-proyecto listener
const oldFormEditListener = `        var idProy = document.getElementById('edit-idProyecto').value;
        var elCrit = document.getElementById('edit-criterioDominante');
        var elFrec = document.getElementById('edit-frecuenciaControl');
        var elDrive = document.getElementById('edit-urlDrive');
        var nomProy = document.getElementById('edit-nombreProyecto').value.trim();

        var payload = {
          idProyecto: idProy,
          nombreProyecto: nomProy,
          estadoProyecto: document.getElementById('edit-estadoProyecto').value,
          criterioDominante: elCrit ? elCrit.value : undefined,
          frecuenciaControl: elFrec ? elFrec.value : undefined,
          urlDrive: elDrive ? elDrive.value.trim() : undefined,
          fechaInicioPlan: document.getElementById('edit-fechaInicioPlan').value,
          fechaFinPlan: document.getElementById('edit-fechaFinPlan').value,
          northStarOKR: document.getElementById('edit-northStarOKR').value.trim(),
          criteriosDoD: document.getElementById('edit-criteriosDoD').value.trim(),
          presupuestoTope: parseFloat(document.getElementById('edit-presupuestoTope').value) || 0
        };`;

const newFormEditListener = `        var idProy = document.getElementById('edit-idProyecto').value;
        var elArq = document.getElementById('edit-arquetipoProyecto');
        var elMag = document.getElementById('edit-magnitudComplejidad');
        var elFrec = document.getElementById('edit-frecuenciaControl');
        var elDrive = document.getElementById('edit-urlDrive');
        var nomProy = document.getElementById('edit-nombreProyecto').value.trim();

        var payload = {
          idProyecto: idProy,
          nombreProyecto: nomProy,
          estadoProyecto: document.getElementById('edit-estadoProyecto').value,
          arquetipoProyecto: elArq ? elArq.value : undefined,
          magnitudComplejidad: elMag ? elMag.value : undefined,
          frecuenciaControl: elFrec ? elFrec.value : undefined,
          urlDrive: elDrive ? elDrive.value.trim() : undefined,
          fechaInicioPlan: document.getElementById('edit-fechaInicioPlan').value,
          fechaFinPlan: document.getElementById('edit-fechaFinPlan').value,
          northStarOKR: document.getElementById('edit-northStarOKR').value.trim(),
          criteriosDoD: document.getElementById('edit-criteriosDoD').value.trim(),
          presupuestoTope: parseFloat(document.getElementById('edit-presupuestoTope').value) || 0
        };`;

if (!content.includes(oldFormEditListener)) {
  console.error('Error: oldFormEditListener not found');
  process.exit(1);
}
content = content.replace(oldFormEditListener, newFormEditListener);

// 3. Update abrirModalEditarProyecto
const oldAbrirModalEdit = `    var elCrit = document.getElementById('edit-criterioDominante');
    if (elCrit) elCrit.value = p.Criterio_Dominante || 'I-Impacto';`;

const newAbrirModalEdit = `    var elArq = document.getElementById('edit-arquetipoProyecto');
    if (elArq) elArq.value = p.Arquetipo_Proyecto || p.Arquetipo || '1_Infraestructura';

    var elMag = document.getElementById('edit-magnitudComplejidad');
    if (elMag) elMag.value = p.Magnitud_Complejidad || p.Complejidad || 'MEDIUM';`;

if (!content.includes(oldAbrirModalEdit)) {
  console.error('Error: oldAbrirModalEdit not found');
  process.exit(1);
}
content = content.replace(oldAbrirModalEdit, newAbrirModalEdit);

// 4. Update abrirModalCrearHito & inject seleccionarTipoEntregable
const oldAbrirModalHito = `  function abrirModalCrearHito() {
    if (!state.proyectoDetalleActivo) return;
    document.getElementById('hito-idProyecto').value = state.proyectoDetalleActivo.ID_Proyecto;
    document.getElementById('form-create-hito').reset();
    openModal('modal-hito');
  }`;

const newAbrirModalHito = `  function seleccionarTipoEntregable(tipo) {
    var esWP = (tipo === 'WP');
    var tabWP = document.getElementById('tab-entregable-wp');
    var tabHIT = document.getElementById('tab-entregable-hit');
    var inTipo = document.getElementById('hito-tipoElementoWbs');
    var lblNombre = document.getElementById('lbl-nombre-entregable');
    var lblFecha = document.getElementById('lbl-fecha-entregable');
    var inPresupuesto = document.getElementById('hito-presupuesto');
    var textoRegla = document.getElementById('texto-regla-entregable');
    var badgeCosto = document.getElementById('badge-costo-entregable');
    var tituloModal = document.getElementById('titulo-modal-entregable');

    if (inTipo) inTipo.value = esWP ? 'PAQUETE_TRABAJO' : 'HITO_MARCADOR';

    if (tabWP && tabHIT) {
      if (esWP) {
        tabWP.className = 'py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-xs bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center gap-1.5';
        tabHIT.className = 'py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all flex items-center justify-center gap-1.5';
      } else {
        tabHIT.className = 'py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-xs bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center gap-1.5';
        tabWP.className = 'py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all flex items-center justify-center gap-1.5';
      }
    }

    if (tituloModal) {
      tituloModal.textContent = esWP ? 'Nuevo Paquete de Trabajo (WP)' : 'Nuevo Hito de Control (Milestone)';
    }

    if (lblNombre) {
      lblNombre.textContent = esWP ? 'Nombre del Paquete de Trabajo (WP)' : 'Nombre del Hito de Control (Milestone)';
    }

    if (lblFecha) {
      lblFecha.textContent = esWP ? 'Fecha Límite Plan' : 'Fecha Objetivo de Validación';
    }

    if (inPresupuesto) {
      if (esWP) {
        inPresupuesto.disabled = false;
        inPresupuesto.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-60');
      } else {
        inPresupuesto.value = '0.00';
        inPresupuesto.disabled = true;
        inPresupuesto.classList.add('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-60');
      }
    }

    if (textoRegla) {
      textoRegla.textContent = esWP
        ? 'Paquete de Trabajo: admite vinculación de tareas y presupuesto ($PV).'
        : 'Hito de Control: Duración = 0 días y Costo = $0.00. No admite vinculación directa de tareas.';
    }

    if (badgeCosto) {
      badgeCosto.textContent = esWP ? 'PV Flexible' : 'Costo = $0.00';
    }
  }

  function abrirModalCrearHito() {
    if (!state.proyectoDetalleActivo) return;
    var p = state.proyectoDetalleActivo;
    document.getElementById('hito-idProyecto').value = p.ID_Proyecto;
    document.getElementById('form-create-hito').reset();

    // Poblar datalist con fases del proyecto activo
    var datalist = document.getElementById('lista-fases-proyecto');
    if (datalist) {
      datalist.innerHTML = '';
      var fasesSet = new Set();
      (state.hitos || []).forEach(function (h) {
        if (String(h.ID_Proyecto || '').trim() === String(p.ID_Proyecto).trim()) {
          var f = String(h.Fase_Asociada || '').trim();
          if (f) fasesSet.add(f);
        }
      });
      if (fasesSet.size === 0) {
        fasesSet.add('Fase 1: Entregables Principales');
      }
      fasesSet.forEach(function (f) {
        var opt = document.createElement('option');
        opt.value = f;
        datalist.appendChild(opt);
      });
      var inFase = document.getElementById('hito-faseAsociada');
      if (inFase) {
        inFase.value = Array.from(fasesSet)[0] || 'Fase 1: Entregables Principales';
      }
    }

    seleccionarTipoEntregable('WP');
    openModal('modal-hito');
  }

  window.seleccionarTipoEntregable = seleccionarTipoEntregable;
  window.abrirModalCrearHito = abrirModalCrearHito;`;

if (!content.includes(oldAbrirModalHito)) {
  console.error('Error: oldAbrirModalHito not found');
  process.exit(1);
}
content = content.replace(oldAbrirModalHito, newAbrirModalHito);

fs.writeFileSync('JS_ModalesYAtajos.html', content, 'utf8');
console.log('Successfully upgraded JS_ModalesYAtajos.html!');
