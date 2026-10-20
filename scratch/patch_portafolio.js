const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- 1. ACTUALIZAR View_Portafolio.html ---
const viewPath = path.join(__dirname, '..', 'View_Portafolio.html');
let viewContent = fs.readFileSync(viewPath, 'utf8');

const targetSection3 = `      <!-- SECCIÓN 3: BARRA DE FILTROS CRUZADOS, BUSCADOR Y TOGGLE DE VISTA (GRID / TABLE) -->
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
            </select>`;

const replacementSection3 = `      <!-- SECCIÓN 3: BARRA DE FILTROS CRUZADOS, BUSCADOR Y TOGGLE DE VISTA (GRID / TABLE) -->
      <div
        class="portal-surface p-3.5 my-2 space-y-3 rounded-2xl shadow-xs">
        
        <!-- FILTRO DE CARTERA CON EXPANSIÓN FLUIDA (GLASSMORPHISM & HOVER / CLICK FLYOUT) -->
        <div class="flex items-center gap-2 flex-wrap">
          <div class="relative group/cartera inline-flex items-center">
            <!-- Botón Disparador Principal -->
            <button type="button" id="btn-trigger-cartera" onclick="toggleFlyoutCartera()"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 bg-slate-900/70 dark:bg-slate-900/80 border border-slate-700/70 text-slate-200 shadow-sm hover:border-indigo-500 hover:text-white">
              <svg class="portal-icon-sm text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
              </svg>
              <span>Cartera: <b id="lbl-cartera-activa" class="text-indigo-400 font-extrabold">Todos</b></span>
              <svg class="portal-icon-sm text-slate-400 transition-transform duration-200 group-hover/cartera:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <!-- Tira de Opciones Desplegable con Glassmorphism -->
            <div id="flyout-cartera-strip"
              class="flyout-cartera-menu absolute left-0 sm:left-full top-full sm:top-0 mt-1.5 sm:mt-0 sm:ml-2 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 shadow-xl opacity-0 translate-x-[-8px] pointer-events-none group-hover/cartera:opacity-100 group-hover/cartera:translate-x-0 group-hover/cartera:pointer-events-auto transition-all duration-200 flex-wrap sm:flex-nowrap whitespace-nowrap">
              
              <button type="button" onclick="filtrarPortafolioPorTipo('')" id="pill-portafolio-tipo-todos"
                class="pill-portafolio-tipo px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-500">
                <span>Todos</span>
                <span id="badge-portafolio-tipo-todos" class="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-white/20 text-white">0</span>
              </button>

              <button type="button" onclick="filtrarPortafolioPorTipo('Personal')" id="pill-portafolio-tipo-personal"
                class="pill-portafolio-tipo px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white">
                <span>👤 Personal</span>
                <span id="badge-portafolio-tipo-personal" class="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">0</span>
              </button>

              <button type="button" onclick="filtrarPortafolioPorTipo('Profesional')" id="pill-portafolio-tipo-profesional"
                class="pill-portafolio-tipo px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white">
                <span>💼 Profesional</span>
                <span id="badge-portafolio-tipo-profesional" class="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">0</span>
              </button>

              <button type="button" onclick="filtrarPortafolioPorTipo('Inversiones')" id="pill-portafolio-tipo-inversiones"
                class="pill-portafolio-tipo px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white">
                <span>📈 Inversiones</span>
                <span id="badge-portafolio-tipo-inversiones" class="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">0</span>
              </button>

              <button type="button" onclick="filtrarPortafolioPorTipo('Social')" id="pill-portafolio-tipo-social"
                class="pill-portafolio-tipo px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white">
                <span>🤝 Social</span>
                <span id="badge-portafolio-tipo-social" class="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">0</span>
              </button>
            </div>
          </div>
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

            <!-- Custom Flyout Dropdown: ESTADO -->
            <div class="relative custom-dropdown-portafolio" id="dropdown-portafolio-estado">
              <input type="hidden" id="grid-filter-estado" value="">
              <button type="button" onclick="toggleDropdownPortafolio('estado')" id="btn-dropdown-estado"
                class="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/70 text-slate-300 hover:border-slate-500 hover:text-white shadow-2xs">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block shrink-0"></span>
                <span id="lbl-dropdown-estado">Estado: Todos</span>
                <svg class="portal-icon-sm text-slate-400 transition-transform duration-150" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div id="menu-dropdown-estado"
                class="hidden absolute left-0 top-full mt-1.5 z-40 w-44 p-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-indigo-500/30 shadow-xl space-y-1">
                <button type="button" onclick="seleccionarFiltroEstadoPortafolio('', 'Estado: Todos')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between">
                  <span>Todos</span>
                </button>
                <button type="button" onclick="seleccionarFiltroEstadoPortafolio('03_En_Ejecucion', 'En Ejecución')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                  <span>En Ejecución</span>
                </button>
                <button type="button" onclick="seleccionarFiltroEstadoPortafolio('02_Planificado', 'Planificado')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                  <span>Planificado</span>
                </button>
                <button type="button" onclick="seleccionarFiltroEstadoPortafolio('01_Backlog', 'Backlog')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                  <span>Backlog</span>
                </button>
                <button type="button" onclick="seleccionarFiltroEstadoPortafolio('04_En_Pausa', 'En Pausa')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span>En Pausa</span>
                </button>
                <button type="button" onclick="seleccionarFiltroEstadoPortafolio('06_Cerrado', 'Cerrado')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Cerrado</span>
                </button>
              </div>
            </div>

            <!-- Custom Flyout Dropdown: SALUD -->
            <div class="relative custom-dropdown-portafolio" id="dropdown-portafolio-salud">
              <input type="hidden" id="grid-filter-salud" value="">
              <button type="button" onclick="toggleDropdownPortafolio('salud')" id="btn-dropdown-salud"
                class="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/70 text-slate-300 hover:border-slate-500 hover:text-white shadow-2xs">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" id="led-salud-trigger"></span>
                <span id="lbl-dropdown-salud">Salud: Todas</span>
                <svg class="portal-icon-sm text-slate-400 transition-transform duration-150" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div id="menu-dropdown-salud"
                class="hidden absolute left-0 top-full mt-1.5 z-40 w-44 p-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-emerald-500/30 shadow-xl space-y-1">
                <button type="button" onclick="seleccionarFiltroSaludPortafolio('', 'Salud: Todas')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between">
                  <span>Todas</span>
                </button>
                <button type="button" onclick="seleccionarFiltroSaludPortafolio('En Rango', '🟢 Saludable')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Saludable (En Rango)</span>
                </button>
                <button type="button" onclick="seleccionarFiltroSaludPortafolio('En Riesgo', '🟡 En Riesgo')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-amber-400 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span>En Riesgo</span>
                </button>
                <button type="button" onclick="seleccionarFiltroSaludPortafolio('Bloqueado', '🔴 Crítico')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-rose-400 hover:bg-slate-800 hover:text-rose-300 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span>Crítico / Bloqueado</span>
                </button>
              </div>
            </div>

            <!-- Custom Flyout Dropdown: ORDENACIÓN -->
            <div class="relative custom-dropdown-portafolio" id="dropdown-portafolio-orden">
              <input type="hidden" id="grid-filter-orden" value="avance_desc">
              <button type="button" onclick="toggleDropdownPortafolio('orden')" id="btn-dropdown-orden"
                class="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/70 text-slate-300 hover:border-slate-500 hover:text-white shadow-2xs">
                <svg class="portal-icon-sm text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
                <span id="lbl-dropdown-orden">Mayor Avance ⬇</span>
                <svg class="portal-icon-sm text-slate-400 transition-transform duration-150" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div id="menu-dropdown-orden"
                class="hidden absolute left-0 top-full mt-1.5 z-40 w-44 p-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 shadow-xl space-y-1">
                <button type="button" onclick="seleccionarFiltroOrdenPortafolio('avance_desc', 'Mayor Avance ⬇')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between">
                  <span>Mayor Avance ⬇</span>
                </button>
                <button type="button" onclick="seleccionarFiltroOrdenPortafolio('avance_asc', 'Menor Avance ⬆')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between">
                  <span>Menor Avance ⬆</span>
                </button>
                <button type="button" onclick="seleccionarFiltroOrdenPortafolio('fecha_asc', 'Fecha Fin 📅')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between">
                  <span>Fecha Fin 📅</span>
                </button>
                <button type="button" onclick="seleccionarFiltroOrdenPortafolio('presupuesto_desc', 'Presupuesto 💰')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between">
                  <span>Presupuesto 💰</span>
                </button>
                <button type="button" onclick="seleccionarFiltroOrdenPortafolio('gasto_desc', 'Gasto AC 📉')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between">
                  <span>Gasto AC 📉</span>
                </button>
                <button type="button" onclick="seleccionarFiltroOrdenPortafolio('nombre_asc', 'Nombre (A-Z)')" class="w-full text-left px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between">
                  <span>Nombre (A-Z)</span>
                </button>
              </div>
            </div>`;

viewContent = viewContent.replace(targetSection3.replace(/\r\n/g, '\n'), replacementSection3.replace(/\r\n/g, '\n'));
fs.writeFileSync(viewPath, viewContent, 'utf8');
console.log('Successfully updated View_Portafolio.html!');

// --- 2. ACTUALIZAR JS_Portafolio.html ---
const jsPortafolioPath = path.join(__dirname, '..', 'JS_Portafolio.html');
let jsPortafolioContent = fs.readFileSync(jsPortafolioPath, 'utf8');

// Añadir funciones de control de dropdowns y flyout
const dropdownFunctions = `
  function toggleFlyoutCartera() {
    var strip = document.getElementById('flyout-cartera-strip');
    if (strip) {
      var estaAbierto = strip.classList.contains('cartera-flyout-open');
      if (estaAbierto) {
        strip.classList.remove('cartera-flyout-open', 'opacity-100', 'translate-x-0', 'pointer-events-auto');
      } else {
        strip.classList.add('cartera-flyout-open', 'opacity-100', 'translate-x-0', 'pointer-events-auto');
      }
    }
  }

  function toggleDropdownPortafolio(tipo) {
    var tipos = ['estado', 'salud', 'orden'];
    tipos.forEach(function (t) {
      var menu = document.getElementById('menu-dropdown-' + t);
      var btn = document.getElementById('btn-dropdown-' + t);
      if (t === tipo) {
        if (menu) {
          var abierto = !menu.classList.contains('hidden');
          if (abierto) {
            menu.classList.add('hidden');
            if (btn) btn.classList.remove('border-indigo-500', 'text-white');
          } else {
            menu.classList.remove('hidden');
            if (btn) btn.classList.add('border-indigo-500', 'text-white');
          }
        }
      } else if (menu) {
        menu.classList.add('hidden');
        if (btn) btn.classList.remove('border-indigo-500', 'text-white');
      }
    });
  }

  function seleccionarFiltroEstadoPortafolio(valor, etiqueta) {
    var inEstado = document.getElementById('grid-filter-estado');
    if (inEstado) inEstado.value = valor;
    var lbl = document.getElementById('lbl-dropdown-estado');
    if (lbl) lbl.textContent = etiqueta;
    var menu = document.getElementById('menu-dropdown-estado');
    if (menu) menu.classList.add('hidden');
    renderGridProyectos();
  }

  function seleccionarFiltroSaludPortafolio(valor, etiqueta) {
    var inSalud = document.getElementById('grid-filter-salud');
    if (inSalud) inSalud.value = valor;
    var lbl = document.getElementById('lbl-dropdown-salud');
    if (lbl) lbl.textContent = etiqueta;
    var led = document.getElementById('led-salud-trigger');
    if (led) {
      if (valor === 'En Rango') led.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0';
      else if (valor === 'En Riesgo') led.className = 'w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0';
      else if (valor === 'Bloqueado') led.className = 'w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0';
      else led.className = 'w-2 h-2 rounded-full bg-slate-400 inline-block shrink-0';
    }
    var menu = document.getElementById('menu-dropdown-salud');
    if (menu) menu.classList.add('hidden');
    renderGridProyectos();
  }

  function seleccionarFiltroOrdenPortafolio(valor, etiqueta) {
    var inOrden = document.getElementById('grid-filter-orden');
    if (inOrden) inOrden.value = valor;
    var lbl = document.getElementById('lbl-dropdown-orden');
    if (lbl) lbl.textContent = etiqueta;
    var menu = document.getElementById('menu-dropdown-orden');
    if (menu) menu.classList.add('hidden');
    renderGridProyectos();
  }

  // Listener para cerrar dropdowns al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-dropdown-portafolio')) {
      ['estado', 'salud', 'orden'].forEach(function(t) {
        var m = document.getElementById('menu-dropdown-' + t);
        if (m) m.classList.add('hidden');
        var b = document.getElementById('btn-dropdown-' + t);
        if (b) b.classList.remove('border-indigo-500', 'text-white');
      });
    }
  });
`;

if (!jsPortafolioContent.includes('toggleDropdownPortafolio')) {
  jsPortafolioContent = jsPortafolioContent.replace(
    'window.filtrarPortafolioPorTipo = filtrarPortafolioPorTipo;',
    `window.filtrarPortafolioPorTipo = filtrarPortafolioPorTipo;
  window.toggleFlyoutCartera = toggleFlyoutCartera;
  window.toggleDropdownPortafolio = toggleDropdownPortafolio;
  window.seleccionarFiltroEstadoPortafolio = seleccionarFiltroEstadoPortafolio;
  window.seleccionarFiltroSaludPortafolio = seleccionarFiltroSaludPortafolio;
  window.seleccionarFiltroOrdenPortafolio = seleccionarFiltroOrdenPortafolio;\n` + dropdownFunctions
  );
}

// Actualizar filtrarPortafolioPorTipo para cerrar flyout y actualizar label de Cartera activa
const targetFiltrarTipo = `  function filtrarPortafolioPorTipo(tipo) {
    var inputTipo = document.getElementById('grid-filter-tipo');
    if (inputTipo) inputTipo.value = tipo;
    actualizarEstilosPildorasPortafolio(tipo);
    renderGridProyectos();
  }`;

const replacementFiltrarTipo = `  function filtrarPortafolioPorTipo(tipo) {
    var inputTipo = document.getElementById('grid-filter-tipo');
    if (inputTipo) inputTipo.value = tipo;

    var lblCartera = document.getElementById('lbl-cartera-activa');
    if (lblCartera) {
      lblCartera.textContent = tipo || 'Todos';
    }

    var strip = document.getElementById('flyout-cartera-strip');
    if (strip) {
      strip.classList.remove('cartera-flyout-open', 'opacity-100', 'translate-x-0', 'pointer-events-auto');
    }

    actualizarEstilosPildorasPortafolio(tipo);
    renderGridProyectos();
  }`;

jsPortafolioContent = jsPortafolioContent.replace(targetFiltrarTipo.replace(/\r\n/g, '\n'), replacementFiltrarTipo.replace(/\r\n/g, '\n'));

// Actualizar limpiarFiltrosPortafolio para reiniciar labels
const targetLimpiarFiltros = `    actualizarEstilosPildorasPortafolio('');
    renderGridProyectos();`;

const replacementLimpiarFiltros = `    var lblCartera = document.getElementById('lbl-cartera-activa');
    if (lblCartera) lblCartera.textContent = 'Todos';
    var lblEstado = document.getElementById('lbl-dropdown-estado');
    if (lblEstado) lblEstado.textContent = 'Estado: Todos';
    var lblSalud = document.getElementById('lbl-dropdown-salud');
    if (lblSalud) lblSalud.textContent = 'Salud: Todas';
    var lblOrden = document.getElementById('lbl-dropdown-orden');
    if (lblOrden) lblOrden.textContent = 'Mayor Avance ⬇';
    var ledSalud = document.getElementById('led-salud-trigger');
    if (ledSalud) ledSalud.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0';

    actualizarEstilosPildorasPortafolio('');
    renderGridProyectos();`;

jsPortafolioContent = jsPortafolioContent.replace(targetLimpiarFiltros.replace(/\r\n/g, '\n'), replacementLimpiarFiltros.replace(/\r\n/g, '\n'));

// Actualizar filtrarPortafolioPorSalud para soportar input hidden sin .options
const targetFiltrarSalud = `  function filtrarPortafolioPorSalud(salud) {
    var elSalud = document.getElementById('grid-filter-salud');
    if (!elSalud) return;
    var normal = String(salud).replace(/[🟢🟡🔴]/g, '').trim().toLowerCase();
    var current = String(elSalud.value || '').replace(/[🟢🟡🔴]/g, '').trim().toLowerCase();
    if (current === normal && current !== '') {
      elSalud.value = '';
    } else {
      var matched = false;
      for (var i = 0; i < elSalud.options.length; i++) {
        var optVal = String(elSalud.options[i].value).replace(/[🟢🟡🔴]/g, '').trim().toLowerCase();
        if (optVal === normal) {
          elSalud.value = elSalud.options[i].value;
          matched = true;
          break;
        }
      }
      if (!matched) elSalud.value = salud;
    }
    renderGridProyectos();
  }`;

const replacementFiltrarSalud = `  function filtrarPortafolioPorSalud(salud) {
    var elSalud = document.getElementById('grid-filter-salud');
    if (!elSalud) return;
    var normal = String(salud).replace(/[🟢🟡🔴]/g, '').trim().toLowerCase();
    var current = String(elSalud.value || '').replace(/[🟢🟡🔴]/g, '').trim().toLowerCase();
    var nuevoValor = '';
    var etiqueta = 'Salud: Todas';
    if (current !== normal) {
      nuevoValor = salud;
      etiqueta = (salud.indexOf('🟢') !== -1 || normal.indexOf('rango') !== -1) ? '🟢 Saludable' :
                 ((salud.indexOf('🟡') !== -1 || normal.indexOf('riesgo') !== -1) ? '🟡 En Riesgo' : '🔴 Crítico');
    }
    elSalud.value = nuevoValor;
    var lbl = document.getElementById('lbl-dropdown-salud');
    if (lbl) lbl.textContent = etiqueta;
    var led = document.getElementById('led-salud-trigger');
    if (led) {
      if (nuevoValor.indexOf('rango') !== -1 || nuevoValor.indexOf('🟢') !== -1) led.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0';
      else if (nuevoValor.indexOf('riesgo') !== -1 || nuevoValor.indexOf('🟡') !== -1) led.className = 'w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0';
      else if (nuevoValor.indexOf('bloqueado') !== -1 || nuevoValor.indexOf('🔴') !== -1) led.className = 'w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0';
      else led.className = 'w-2 h-2 rounded-full bg-slate-400 inline-block shrink-0';
    }
    renderGridProyectos();
  }`;

jsPortafolioContent = jsPortafolioContent.replace(targetFiltrarSalud.replace(/\r\n/g, '\n'), replacementFiltrarSalud.replace(/\r\n/g, '\n'));

// Validar sintaxis
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
while ((match = scriptRegex.exec(jsPortafolioContent)) !== null) {
  new vm.Script(match[1]);
}

fs.writeFileSync(jsPortafolioPath, jsPortafolioContent, 'utf8');
console.log('Successfully updated JS_Portafolio.html!');
