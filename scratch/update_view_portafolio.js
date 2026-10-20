const fs = require('fs');

let content = fs.readFileSync('View_Portafolio.html', 'utf8');

// 1. Elevate "Nuevo Proyecto" button
const oldNewProjectBtn = `<button type="button" onclick="abrirWizardProyecto()"
            class="btn-portal-primary text-xs shadow-xs"
            title="Crear Nuevo Proyecto">
            <svg class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <span>Nuevo Proyecto</span>
          </button>`;

const newNewProjectBtn = `<button type="button" onclick="abrirWizardProyecto()"
            class="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30 dark:shadow-indigo-950/50 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all duration-200 active:scale-[0.98]"
            title="Crear Nuevo Proyecto">
            <svg class="portal-icon-sm shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
              <line x1="12" x2="12" y1="10" y2="16"/><line x1="9" x2="15" y1="13" y2="13"/>
            </svg>
            <span>Nuevo Proyecto</span>
          </button>`;

if (!content.includes(oldNewProjectBtn)) {
  console.error('Error: oldNewProjectBtn not found in View_Portafolio.html');
  process.exit(1);
}
content = content.replace(oldNewProjectBtn, newNewProjectBtn);

// 2. Modernize Section 3 filters
const oldSection3Start = '<!-- SECCIÓN 3: BARRA DE FILTROS CRUZADOS, BUSCADOR Y TOGGLE DE VISTA (GRID / TABLE) -->';
const oldSection3End = '<!-- SECCIÓN 4A: VISTA CUADRÍCULA DE TARJETAS ENRIQUECIDAS -->';

const idxStart = content.indexOf(oldSection3Start);
const idxEnd = content.indexOf(oldSection3End);

if (idxStart === -1 || idxEnd === -1) {
  console.error('Error: Section 3 boundaries not found');
  process.exit(1);
}

const newSection3 = `<!-- SECCIÓN 3: BARRA DE FILTROS CRUZADOS, BUSCADOR Y TOGGLE DE VISTA (GRID / TABLE) -->
      <div
        class="portal-surface p-3.5 my-2 space-y-3 rounded-2xl shadow-xs">
        
        <!-- PÍLDORAS INTERACTIVAS DE CARTERA / TIPO (GLASSMORPHISM & ACENTOS LUMINOSOS) -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">Cartera:</span>
          
          <button type="button" onclick="filtrarPortafolioPorTipo('')" id="pill-portafolio-tipo-todos"
            class="pill-portafolio-tipo px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-500">
            <span>Todos</span>
            <span id="badge-portafolio-tipo-todos" class="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-white/20 text-white">0</span>
          </button>

          <button type="button" onclick="filtrarPortafolioPorTipo('Personal')" id="pill-portafolio-tipo-personal"
            class="pill-portafolio-tipo px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white">
            <span>Personal</span>
            <span id="badge-portafolio-tipo-personal" class="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">0</span>
          </button>

          <button type="button" onclick="filtrarPortafolioPorTipo('Profesional')" id="pill-portafolio-tipo-profesional"
            class="pill-portafolio-tipo px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white">
            <span>Profesional</span>
            <span id="badge-portafolio-tipo-profesional" class="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">0</span>
          </button>

          <button type="button" onclick="filtrarPortafolioPorTipo('Inversiones')" id="pill-portafolio-tipo-inversiones"
            class="pill-portafolio-tipo px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white">
            <span>Inversiones</span>
            <span id="badge-portafolio-tipo-inversiones" class="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">0</span>
          </button>

          <button type="button" onclick="filtrarPortafolioPorTipo('Social')" id="pill-portafolio-tipo-social"
            class="pill-portafolio-tipo px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white">
            <span>Social</span>
            <span id="badge-portafolio-tipo-social" class="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">0</span>
          </button>
        </div>

        <!-- BARRA SECUNDARIA: BUSCADOR, ESTADO, SALUD, ORDEN Y CONMUTADOR VISTA -->
        <div class="flex items-center justify-between gap-3 flex-wrap pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <!-- Filtros y Búsqueda -->
          <div class="flex items-center gap-2 flex-wrap flex-1">
            <input type="hidden" id="grid-filter-tipo" value="">

            <!-- Buscador Rápido -->
            <div class="relative min-w-[200px] flex-1 max-w-xs">
              <span class="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                <svg class="portal-icon-sm text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
              <input type="text" id="portafolio-search" oninput="renderGridProyectos()"
                placeholder="Buscar proyecto, ID, OKR o líder..."
                class="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-xs rounded-lg border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pl-8 pr-7 py-1.5 outline-none transition shadow-2xs">
              <button type="button" id="btn-clear-portafolio-search" onclick="limpiarBusquedaPortafolio()"
                class="hidden absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-transform duration-150"
                title="Limpiar búsqueda">
                <svg class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <!-- Filtro por Estado -->
            <select id="grid-filter-estado" onchange="renderGridProyectos()"
              class="filter-ghost-select">
              <option value="">Estado: Todos</option>
              <option value="03_En_Ejecucion">En Ejecución</option>
              <option value="02_Planificado">Planificado</option>
              <option value="01_Backlog">Backlog</option>
              <option value="04_En_Pausa">En Pausa</option>
              <option value="06_Cerrado">Cerrado</option>
            </select>

            <!-- Filtro por Salud -->
            <select id="grid-filter-salud" onchange="renderGridProyectos()"
              class="filter-ghost-select">
              <option value="">Salud: Todas</option>
              <option value="En Rango">En Rango</option>
              <option value="En Riesgo">En Riesgo</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>

            <!-- Ordenamiento -->
            <select id="grid-filter-orden" onchange="renderGridProyectos()"
              class="filter-ghost-select">
              <option value="avance_desc">Mayor Avance</option>
              <option value="avance_asc">Menor Avance</option>
              <option value="presupuesto_desc">Mayor Presupuesto</option>
              <option value="gasto_desc">Mayor Gasto AC</option>
              <option value="fecha_asc">Fecha Fin Próxima</option>
              <option value="nombre_asc">Nombre (A-Z)</option>
            </select>

            <button type="button" id="btn-limpiar-filtros-portafolio" onclick="(window.limpiarFiltrosVistaActiva || window.limpiarFiltrosPortafolio)()"
              class="hidden btn-portal-secondary text-xs active:scale-95 transition flex items-center gap-1 shadow-2xs"
              title="Restablecer filtros de portafolio y mostrar todos los proyectos">
              <svg class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              <span>Limpiar</span>
            </button>
          </div>

          <!-- Selector de Vista (Cuadrícula / Tabla) -->
          <div
            class="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60 shrink-0 self-start md:self-auto shadow-2xs">
            <button type="button" id="btn-view-grid-portafolio" onclick="cambiarVistaPortafolio('grid')"
              class="btn-portal-primary text-xs shadow-xs"
              title="Vista en Tarjetas">
              <svg class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              <span>Tarjetas</span>
            </button>

            <button type="button" id="btn-view-table-portafolio" onclick="cambiarVistaPortafolio('table')"
              class="btn-portal-secondary text-xs"
              title="Vista Ejecutiva en Tabla">
              <svg class="portal-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
              <span>Tabla</span>
            </button>
          </div>
        </div>
      </div>\n\n      `;

content = content.substring(0, idxStart) + newSection3 + content.substring(idxEnd);
fs.writeFileSync('View_Portafolio.html', content, 'utf8');
console.log('Successfully updated View_Portafolio.html!');
