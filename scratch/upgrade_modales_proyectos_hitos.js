const fs = require('fs');

let content = fs.readFileSync('Modal_ProyectosYHitos.html', 'utf8');

// 1. Upgrade modal-editar-proyecto (Lines 1 to 114)
const oldModalEdit = content.substring(
  content.indexOf('<div id="modal-editar-proyecto"'),
  content.indexOf('<!-- MODAL: CREAR HITO -->')
);

const newModalEdit = `<div id="modal-editar-proyecto"
    class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="portal-surface elevation-3 w-full max-w-4xl overflow-hidden flex flex-col max-sm:rounded-b-none max-sm:rounded-t-2xl max-h-[92vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
      
      <!-- Drag handle móvil -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0"></div>

      <!-- Header del Modal -->
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </div>
          <div>
            <h3 class="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base">Editar Proyecto</h3>
            <span id="modal-edit-proy-badge-notas" class="text-[11px] text-slate-500 dark:text-slate-400">Ajusta parámetros estratégicos, ciclo de vida y criterios de gobernanza</span>
          </div>
        </div>
        <button type="button" onclick="closeModal('modal-editar-proyecto')"
          class="btn-portal-icon" title="Cerrar">
          <svg class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <!-- Formulario Bento Grid en 3 Cuadrantes -->
      <form id="form-editar-proyecto" class="p-5 md:p-6 space-y-4 text-xs overflow-y-auto flex-1">
        <input type="hidden" id="edit-idProyecto">

        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          <!-- CUADRANTE 1: IDENTIDAD & CICLO DE VIDA (col-span-12 md:col-span-4) -->
          <div class="md:col-span-4 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <div class="flex items-center gap-1.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
              <h4 class="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">1. Identidad & Ciclo</h4>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Proyecto</label>
              <input type="text" id="edit-nombreProyecto" required class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 outline-none focus:ring-1 focus:ring-indigo-500">
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Estado del Proyecto</label>
              <select id="edit-estadoProyecto" class="w-full border dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800">
                <option value="01_Backlog">01_Backlog</option>
                <option value="02_Planificado">02_Planificado</option>
                <option value="03_En_Ejecucion">03_En_Ejecucion</option>
                <option value="04_En_Pausa">04_En_Pausa</option>
                <option value="06_Cerrado">06_Cerrado</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Arquetipo de Ciclo</label>
              <select id="edit-arquetipoProyecto" class="w-full border dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800">
                <option value="1_Infraestructura">1. Infraestructura / Producto Físico</option>
                <option value="2_Venture">2. Venture / Startup / Negocio</option>
                <option value="3_Activo">3. Activo Financiero / Inversión</option>
                <option value="4_Carrera">4. Carrera / Habilidad / Certificación</option>
                <option value="5_Evento">5. Evento / Campaña / Temporal</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Magnitud / Complejidad</label>
              <select id="edit-magnitudComplejidad" class="w-full border dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800">
                <option value="LIGHT">LIGHT (1 Fase canónica • WBS ágil)</option>
                <option value="MEDIUM">MEDIUM (3 Fases • EVM estándar)</option>
                <option value="HEAVY">HEAVY (4 Fases • Control exhaustivo)</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cadencia de Control</label>
              <select id="edit-frecuenciaControl" class="w-full border dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800">
                <option value="Diario">Diario</option>
                <option value="Semanal">Semanal (Check-in PMO)</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>
          </div>

          <!-- CUADRANTE 2: CRONOGRAMA & FINANZAS (col-span-12 md:col-span-4) -->
          <div class="md:col-span-4 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <div class="flex items-center gap-1.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h4 class="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">2. Cronograma & Finanzas</h4>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Inicio Plan</label>
                <input type="date" id="edit-fechaInicioPlan" class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 text-xs">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fin Plan</label>
                <input type="date" id="edit-fechaFinPlan" class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 text-xs">
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Presupuesto Tope (BAC)</label>
              <div class="relative">
                <span class="absolute left-2.5 top-2 font-mono font-bold text-slate-400">S/</span>
                <input type="number" step="0.01" id="edit-presupuestoTope" class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 pl-8 font-mono text-slate-900 dark:text-slate-100 font-bold">
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Carpeta Google Drive</label>
              <input type="url" id="edit-urlDrive" class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 text-indigo-600 dark:text-indigo-400" placeholder="https://drive.google.com/...">
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Salud EVM (Tiempo Real)</span>
                <span class="text-[9.5px] text-slate-400 font-normal">Calculada automáticamente</span>
              </label>
              <div id="edit-healthStatus-badge" class="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 flex items-center gap-2 cursor-help" title="Calculada automáticamente según SPI, CPI y cronograma">
                <span id="edit-healthStatus-icon" class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span id="edit-healthStatus-text" class="font-bold text-slate-700 dark:text-slate-200">Saludable</span>
                <span id="edit-healthStatus-motivo" class="text-[10px] text-slate-500 ml-auto truncate max-w-[130px]">SPI >= 0.95</span>
              </div>
              <input type="hidden" id="edit-healthStatus" value="Saludable">
            </div>
          </div>

          <!-- CUADRANTE 3: ALINEACIÓN ESTRATÉGICA & DOD (col-span-12 md:col-span-4) -->
          <div class="md:col-span-4 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <div class="flex items-center gap-1.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
              <span class="w-2 h-2 rounded-full bg-violet-500"></span>
              <h4 class="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">3. Estrategia & Calidad</h4>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">North Star OKR</label>
              <input type="text" id="edit-northStarOKR" class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2" placeholder="Objetivo estratégico cuantificable...">
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Criterios de Aceptación (DoD)</label>
              <textarea id="edit-criteriosDoD" rows="4" class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2" placeholder="Condiciones estrictas para considerar el proyecto finalizado con éxito..."></textarea>
            </div>

            <div class="p-2.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 text-[10.5px] text-violet-800 dark:text-violet-300 leading-relaxed">
              <b>Gobernanza WBS:</b> Los cambios en arquetipo o magnitud recalibran las fases activas y las tolerancias EVM.
            </div>
          </div>

        </div>

        <!-- Footer Acciones -->
        <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button type="button" id="btn-eliminar-proyecto-modal" onclick="confirmarEliminarProyectoDesdeModal()"
            class="px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
            title="Eliminar este proyecto y todas sus dependencias permanentemente">
            <svg class="portal-icon-sm text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
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
      </form>
    </div>
  </div>\n\n  `;

content = content.replace(oldModalEdit, newModalEdit);

// 2. Upgrade modal-hito to Dual Entregable WBS Modal (Lines 116 to 160)
const oldModalHito = content.substring(
  content.indexOf('<!-- MODAL: CREAR HITO -->'),
  content.indexOf('<!-- ===================================================================== -->\n  <!-- MODAL: CREACIÓN DE PROYECTO & GENERACIÓN WBS CON IA (UNIFICADO)       -->')
);

const newModalHito = `<!-- ===================================================================== -->
  <!-- MODAL DUAL DE ENTREGABLES: PAQUETE DE TRABAJO (WP) & HITO (HIT)       -->
  <!-- ===================================================================== -->
  <div id="modal-hito"
    class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="portal-surface elevation-3 w-full max-w-lg overflow-hidden flex flex-col max-sm:rounded-b-none max-sm:rounded-t-2xl max-h-[90vh] animate-in slide-in-from-bottom duration-200">
      
      <!-- Drag handle móvil -->
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0"></div>

      <!-- Cabecera -->
      <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
        <div class="flex items-center gap-2">
          <div id="entregable-icon-container" class="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <h3 id="titulo-modal-entregable" class="font-bold text-slate-800 dark:text-slate-100 text-sm">Nuevo Entregable WBS</h3>
        </div>
        <button type="button" onclick="closeModal('modal-hito')"
          class="btn-portal-icon" title="Cerrar">
          <svg class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <form id="form-create-hito" class="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
        <input type="hidden" id="hito-idProyecto">
        <input type="hidden" id="hito-tipoElementoWbs" value="PAQUETE_TRABAJO">
        <input type="hidden" id="hito-duracion" value="0">

        <!-- SELECTOR DUAL PILL: [ 📦 Paquete de Trabajo (WP) | 🏁 Hito de Control (Milestone) ] -->
        <div class="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 gap-1">
          <button type="button" id="tab-entregable-wp" onclick="seleccionarTipoEntregable('WP')"
            class="py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-xs bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center gap-1.5">
            <span>📦 Paquete de Trabajo (WP)</span>
          </button>
          <button type="button" id="tab-entregable-hit" onclick="seleccionarTipoEntregable('HIT')"
            class="py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all flex items-center justify-center gap-1.5">
            <span>🏁 Hito de Control (Milestone)</span>
          </button>
        </div>

        <div>
          <label id="lbl-nombre-entregable" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Paquete de Trabajo</label>
          <input type="text" id="hito-nombre" required placeholder="Ej. Arquitectura Backend & Base de Datos"
            class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 outline-none focus:ring-1 focus:ring-indigo-500">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fase Asociada</label>
            <input type="text" id="hito-faseAsociada" list="lista-fases-proyecto" placeholder="Ej. Fase 1: Entregables Principales"
              class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 text-xs">
            <datalist id="lista-fases-proyecto"></datalist>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Peso Ponderado (0.0 a 1.0)</label>
            <input type="number" step="0.05" id="hito-peso" value="0.20" class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 font-mono">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label id="lbl-fecha-entregable" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Límite Plan</label>
            <input type="date" id="hito-fechaLimite" required class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2">
          </div>
          <div id="contenedor-presupuesto-entregable">
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Presupuesto Planificado ($PV)</label>
            <div class="relative">
              <span class="absolute left-2.5 top-2 font-mono font-bold text-slate-400">S/</span>
              <input type="number" step="0.01" id="hito-presupuesto" value="0.00" class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 pl-8 font-mono">
            </div>
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Criterio de Aceptación (DoD)</label>
          <textarea id="hito-criterioDod" rows="2" class="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2" placeholder="Condición verificable para marcar este entregable como Completado..."></textarea>
        </div>

        <!-- Banner informativo dinámico -->
        <div id="banner-regla-entregable" class="p-2.5 rounded-xl border border-sky-200/80 dark:border-sky-800/80 bg-sky-50/60 dark:bg-sky-950/40 text-[11px] text-sky-800 dark:text-sky-300 flex items-center justify-between">
          <span class="flex items-center gap-1.5 font-medium">
            <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <span id="texto-regla-entregable">Paquete de Trabajo: admite vinculación de tareas y costos reales.</span>
          </span>
          <span id="badge-costo-entregable" class="font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">PV Flexible</span>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onclick="closeModal('modal-hito')" class="btn-portal-secondary">Cancelar</button>
          <button type="submit" id="btn-submit-hito" class="btn-portal-primary">Guardar Entregable</button>
        </div>
      </form>
    </div>
  </div>\n\n  `;

content = content.replace(oldModalHito, newModalHito);

// 3. Append the two AI Assistant Modals at the end of Modal_ProyectosYHitos.html
const endAnchor = '<!-- Fin de modal-proyecto-wizard -->';

const aiModals = `<!-- ===================================================================== -->
  <!-- MODALES DE ASISTENCIA IA: WBS Y TAREAS ATÓMICAS (GEMINI)              -->
  <!-- ===================================================================== -->
  <div id="modal-ia-completar-wbs"
    class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="portal-surface elevation-3 w-full max-w-2xl overflow-hidden flex flex-col max-sm:rounded-b-none max-sm:rounded-t-2xl max-h-[90vh] animate-in slide-in-from-bottom duration-200">
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0"></div>
      <div class="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <div>
            <h3 class="font-black text-slate-800 dark:text-slate-100 text-sm">✨ Asistente IA: Completar Estructura WBS</h3>
            <p id="analisis-wbs-ia" class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">Sugerencias inteligentes basadas en el arquetipo del proyecto.</p>
          </div>
        </div>
        <button type="button" onclick="closeModal('modal-ia-completar-wbs')" class="btn-portal-icon" title="Cerrar">
          <svg class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <div class="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
        <p class="text-xs text-slate-600 dark:text-slate-400">Selecciona los paquetes de trabajo e hitos sugeridos por Gemini que deseas incorporar a la WBS:</p>
        <div id="contenedor-sugerencias-wbs-ia" class="space-y-2.5">
          <!-- Renderizado dinámico -->
        </div>
      </div>
      <div class="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
        <button type="button" onclick="closeModal('modal-ia-completar-wbs')" class="btn-portal-secondary text-xs">Cancelar</button>
        <button type="button" onclick="aplicarSugerenciasWbsIA()" class="btn-portal-primary text-xs flex items-center gap-1.5 shadow-2xs">
          <svg xmlns="http://www.w3.org/2000/svg" class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          <span>Insertar Entregables en WBS</span>
        </button>
      </div>
    </div>
  </div>

  <div id="modal-ia-desglose-tareas"
    class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="portal-surface elevation-3 w-full max-w-xl overflow-hidden flex flex-col max-sm:rounded-b-none max-sm:rounded-t-2xl max-h-[90vh] animate-in slide-in-from-bottom duration-200">
      <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0"></div>
      <div class="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <div>
            <h3 class="font-black text-slate-800 dark:text-slate-100 text-sm">✨ Asistente IA: Desglose de Tareas</h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Paquete: <span id="titulo-paquete-ia-desglose" class="font-bold text-slate-800 dark:text-slate-200"></span></p>
          </div>
        </div>
        <button type="button" onclick="closeModal('modal-ia-desglose-tareas')" class="btn-portal-icon" title="Cerrar">
          <svg class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <div class="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
        <div id="analisis-tareas-ia" class="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-300 text-[11px] font-medium leading-relaxed">
          Tareas orientadas a cumplir los criterios DoD del paquete de trabajo.
        </div>
        <div id="contenedor-sugerencias-tareas-ia" class="space-y-2">
          <!-- Renderizado dinámico -->
        </div>
      </div>
      <div class="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
        <button type="button" onclick="closeModal('modal-ia-desglose-tareas')" class="btn-portal-secondary text-xs">Cancelar</button>
        <button type="button" onclick="aplicarSugerenciasTareasIA()" class="btn-portal-primary text-xs flex items-center gap-1.5 shadow-2xs">
          <svg xmlns="http://www.w3.org/2000/svg" class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          <span>Insertar Tareas en Paquete</span>
        </button>
      </div>
    </div>
  </div>\n\n  ` + endAnchor;

content = content.replace(endAnchor, aiModals);

fs.writeFileSync('Modal_ProyectosYHitos.html', content, 'utf8');
console.log('Successfully upgraded Modal_ProyectosYHitos.html!');
