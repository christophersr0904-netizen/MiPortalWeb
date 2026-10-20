# SYSTEM_RULES.md - SISTEMA DE DISEÑO Y ARQUITECTURA PMO
## Estilo Canónico: Cobalt Aerodynamic (A.2.2)

### 1. REGLAS INQUEBRANTABLES DE ARQUITECTURA

#### A. Entorno Moderno Activo (React 19 / TypeScript / Vite / Local-First):
- **Estructura Modular:** El código frontend reside en `src/` utilizando sintaxis estándar `import` / `export` ES Modules y dependencias controladas en `package.json`.
- **Integridad de Código:** Compilación limpia verificada con `npx tsc --noEmit` y pruebas con Vitest (`npm test`).
- **Integridad de Componentes:** Prohibido desbalancear etiquetas JSX/HTML o alterar atributos clave (`id`, listeners de drag & drop, manejadores de estado).

#### B. Confinamiento de Google Apps Script (`legacy_gas/`):
- **Ámbito Aislado:** Válido ÚNICAMENTE dentro del directorio `legacy_gas/`.
- **Restricciones GAS:** Prohibido el uso de `import` / `export` o llamadas a `require()` dentro de `legacy_gas/`. Inclusión modular obligatoria vía scriptlets `<?!= HtmlService.createHtmlOutputFromFile('Nombre').getContent(); ?>`.

---

### 2. DESIGN SYSTEM: COBALT AERODYNAMIC (Tokens y Clases)

#### A. Paleta Cromática y Superficies
- **Lienzo Base:** `bg-[#040711]` en modo oscuro / `bg-slate-50` en modo claro.
- **Superficie Flotante Primaria (.portal-surface):**
  - Fondo: `#0D1526` (slate oscuro con matiz azul noche profundo).
  - Borde: Sin marcos duros ni gruesos. Únicamente micropenumbra o trazo ultradelgado: `border border-slate-800/40`.
  - Relieve / Sombra Canónica:
    `box-shadow: 0 10px 25px -5px rgba(2, 6, 23, 0.8), 0 8px 10px -6px rgba(30, 58, 138, 0.18);`
  - Comportamiento Hover: `hover:translate-y-[-2px] hover:shadow-[0_15px_30px_-5px_rgba(2,6,23,0.9),0_10px_15px_-3px_rgba(30,58,138,0.28)]` con transición suave `transition: all 0.15s ease-out;`.

#### B. Filtros y Navegación (Ghost Controls - Cero Cajas Pesadas)
- PROHIBIDO colocar marcos o recuadros toscos alrededor de filtros o botones secundarios.
- **Filtros Inactivos:** Texto `text-slate-400 font-medium text-xs hover:text-sky-300 transition-colors bg-transparent border-0 px-2 py-1`.
- **Filtros Activos:** `text-sky-300 font-semibold text-xs bg-sky-950/30 rounded-md px-2 py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-[2px] after:bg-sky-400`.

#### C. Iconografía Universal (Lucide Lineal)
- Sin cajas de fondo ni círculos pesados alrededor de los iconos salvo botones de acción circular explícita.
- Dimensiones estrictas:
  - `.portal-icon-sm`: `12px × 12px`, `stroke-width: 1.75`.
  - `.portal-icon`: `16px × 16px`, `stroke-width: 1.75`.
  - `.portal-icon-lg`: `20px × 20px`, `stroke-width: 1.75`.
- Todos con `fill="none"`, `stroke="currentColor"`.

#### D. Badges Semánticos y Tipografía Numérica
- **Badges:** `.badge-sem-emerald`, `.badge-sem-amber`, `.badge-sem-rose`, `.badge-sem-slate`.
- **Tipografía Numérica OBLIGATORIA:** Toda cifra, porcentaje, importe (PEN/USD), fecha, hora o contador de avance DEBE llevar `font-mono tabular-nums`.

---

### 3. REGLAS DE EJECUCIÓN PARA LA IA
1. Prohibido inventar clases CSS arbitrarias por archivo. Usar los tokens centralizados en `src/index.css`.
2. Al auditar o modificar tarjetas y modales, invocar el skill `pmo-ui-cobalt` para comprobar elevaciones multicapa y eliminar remarcados toscos.
3. Erradicación total de emojis crudos en el DOM y en templates de React.
4. Exportación Atómica de Notas: Toda serialización de notas a texto plano debe realizarse mediante `serializarNotaATextoPlano(nota)`, garantizando la exclusión absoluta de metadatos de auditoría (IDs técnicos, fechas) y respetando el soporte dual para checklists lineales (`Checklist`) y matrices dinámicas (`Tabla.filas`).

---

### 4. REGLAS DE ATAJOS GLOBALES Y DESPACHO LIFO (REQ-1TO1-002)
1. **Blindaje Estricto contra Inputs:** Si el foco activo reside en `INPUT`, `TEXTAREA`, `SELECT` o cualquier contenedor `[contenteditable="true"]`, la escucha de letras y números queda completamente inhibida para permitir mecanografía natural.
2. **Pila LIFO de Cancelación (`Escape`):** Debe cerrar secuencialmente desde el diálogo de mayor jerarquía z-index hacia abajo: Asistente IA -> Modal Exportar PDF -> Modal Atajos Teclado -> Drawer de Archivados -> `blur()` de campo de texto enfocado.
3. **Mapeo Canónico de Navegación Numérica:**
   - `1`: Tablero Kanban (`kanban`)
   - `2`: Portafolio Ejecutivo (`portafolio`)
   - `3`: Hábitos & Vida (`habitos`)
   - `4`: Flujo y Finanzas (`financiero`)
   - `5`: Notas Inteligentes (`notas`)
4. **Núcleo Transversal:**
   - `Esc`: Cerrar / Cancelar en orden LIFO.
   - `C`: Abrir Google Calendar en pestaña nueva.
   - `X`: Limpiar filtros activos (`pmo:clear-filters`).
   - `Enter`: Confirmar acción primaria en diálogo modal.
   - `?` (`Shift + /`): Desplegar Modal Canónico de Atajos de Teclado.

---

### 5. REGLA DE NEGOCIO CANÓNICA DE LA BÓVEDA DE ARCHIVADOS (+10 DÍAS)
1. **Umbral Estricto Temporal:** Solo ingresan a la Bóveda de Archivados aquellas entidades cuyo evento de finalización, cierre o conciliación supere los **10 días transcurridos** (`diffDias > 10`). Las entidades finalizadas hace $\le 10$ días deben permanecer visibles en sus vistas canónicas activas.
2. **Exclusión por Reactivación:** La bandera `_desarchivado === true` excluye inmediatamente a la entidad de la bóveda, manteniéndola visible en el canvas operativo en caliente.
3. **Restauración Atómica:** Toda restauración debe mutar el estado operativo a un estado activo inicial (`01_Backlog` para tareas, `03_En_Ejecucion` para proyectos, `02_Por_Hacer` para actividades, `PENDIENTE` para finanzas) y actualizar el sello temporal `updated_at: new Date().toISOString()`.

---

### 6. REGLAS DEL TABLERO KANBAN, DOD Y MODAL TAREAFLOW (REQ-1TO1-003)
1. **Header Multi-Fila y Filtrado Multidimensional:**
   - **Fila 1:** Segmented control contextual (`TODOS`, `PROYECTOS`, `PERSONAL`), chip dinámico de proyecto activo (con semáforo de salud, CPI y acceso 360°), cápsula temporal popover glassmorphism (`TODO`, `HOY`, `SEMANA`, `MES`) y badge de Gasto Contextual en PEN.
   - **Fila 2:** Micro-popovers de filtros multidimensionales (Hito WBS, Prioridad Eisenhower Q1-Q4, Nivel de Energía, Plazo/Vencimiento, Predecesoras/Bloqueos) y botón reactivo `#btn-limpiar-filtros-kanban` sincronizado con la tecla `X` (`pmo:clear-filters`).
2. **Drag-and-Drop HTML5 Nativo y Definición de Terminado (DoD):**
   - Transiciones de estado fluidas a 60fps con `draggable={true}`, event handlers `dragstart`, `dragover`, `dragleave`, `drop` y feedback visual `.kanban-dropzone-active`.
   - **Protocolo DoD Obligatorio:** Antes de transicionar una tarea al estado terminal `04_Completado` (vía drag-and-drop o botones rápidos), se debe ejecutar `validarDoDSubtareas()`. Si existen subtareas pendientes en `db.subtareas_pasos`, el sistema debe advertir o requerir confirmación explícita del usuario antes de permitir la transición.
3. **Modal TareaFlow Bento:**
   - Layout de 3 tarjetas maestras elevadas: `Tiempo & Esfuerzo` (fecha, hora, horas estimadas vs reales, sync Calendar), `Operativo & Matriz` (prioridad Eisenhower, nivel de energía, switch MAV) y `Financiero & Entorno` (costo real PEN, responsable ejecutor, notas/impedimentos).
   - Breadcrumb WBS canónico (`Proyecto › Hito › Predecesora`) con selectores interactivos.
   - Checklist procedural reactivo vinculado a `db.subtareas_pasos` con barra de progreso porcentual gradiente índigo-esmeralda.