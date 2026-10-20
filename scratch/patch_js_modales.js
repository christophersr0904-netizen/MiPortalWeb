const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '..', 'JS_ModalesYAtajos.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Mejorar abrirModalCrearHitoFase
const targetAbrirModal = `  function abrirModalCrearHitoFase(nombreFase) {
    if (!state.proyectoDetalleActivo) return;
    abrirModalCrearHito();
    var inFase = document.getElementById('hito-faseAsociada');
    if (inFase && nombreFase) {
      inFase.value = nombreFase;
    }
  }`;

const replacementAbrirModal = `  function abrirModalCrearHitoFase(nombreFase) {
    if (!state.proyectoDetalleActivo) return;
    abrirModalCrearHito();

    // a) #modal-hito-tipo y #hito-tipoElementoWbs -> 'PAQUETE_TRABAJO'
    var inTipo = document.getElementById('hito-tipoElementoWbs');
    if (inTipo) inTipo.value = 'PAQUETE_TRABAJO';
    var inTipo2 = document.getElementById('modal-hito-tipo');
    if (inTipo2) inTipo2.value = 'PAQUETE_TRABAJO';

    // b) Conmuta visualmente las clases del switcher para que [ 📦 Paquete de Trabajo (WP) ] quede encendido
    if (typeof seleccionarTipoEntregable === 'function') {
      seleccionarTipoEntregable('WP');
    }

    // c) #hito-faseAsociada -> Asigna exactamente el nombreFase recibido
    var inFase = document.getElementById('hito-faseAsociada');
    if (inFase && nombreFase) {
      inFase.value = nombreFase;
    }
    var datalist = document.getElementById('lista-fases-proyecto');
    if (datalist && nombreFase) {
      var exists = Array.from(datalist.options || []).some(function (opt) { return opt.value === nombreFase; });
      if (!exists) {
        var opt = document.createElement('option');
        opt.value = nombreFase;
        datalist.appendChild(opt);
      }
    }

    // d) Habilita el input de presupuesto planificado (#hito-presupuesto)
    var inPres = document.getElementById('hito-presupuesto');
    if (inPres) {
      inPres.disabled = false;
      inPres.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed', 'opacity-60');
    }
  }`;

content = content.replace(targetAbrirModal.replace(/\r\n/g, '\n'), replacementAbrirModal.replace(/\r\n/g, '\n'));

// 2. En submit del formulario, asegurar centrarGrafoRed() y payload completo
const targetSubmitRender = `        // 3. ACTUALIZACIÓN REACTIVA AL INSTANTE (60 FPS)
        if (typeof renderCascadaHitos === 'function') {
          renderCascadaHitos(payload.idProyecto);
        }`;

const replacementSubmitRender = `        // 3. ACTUALIZACIÓN REACTIVA AL INSTANTE (60 FPS)
        if (typeof renderCascadaHitos === 'function') {
          renderCascadaHitos(payload.idProyecto);
        }
        if (typeof centrarGrafoRed === 'function') {
          centrarGrafoRed();
        }`;

content = content.replace(targetSubmitRender.replace(/\r\n/g, '\n'), replacementSubmitRender.replace(/\r\n/g, '\n'));

const targetBackendSuccess = `              if (realHito.ID_Proyecto) nuevoHitoLocal.ID_Proyecto = realHito.ID_Proyecto;
              if (typeof renderCascadaHitos === 'function') renderCascadaHitos(payload.idProyecto);`;

const replacementBackendSuccess = `              if (realHito.ID_Proyecto) nuevoHitoLocal.ID_Proyecto = realHito.ID_Proyecto;
              if (typeof renderCascadaHitos === 'function') renderCascadaHitos(payload.idProyecto);
              if (typeof centrarGrafoRed === 'function') centrarGrafoRed();`;

content = content.replace(targetBackendSuccess.replace(/\r\n/g, '\n'), replacementBackendSuccess.replace(/\r\n/g, '\n'));

// Validar sintaxis
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
while ((match = scriptRegex.exec(content)) !== null) {
  new vm.Script(match[1]);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated JS_ModalesYAtajos.html!');
