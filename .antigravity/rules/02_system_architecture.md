# SYSTEM ARCHITECTURE & GOVERNANCE RULES
## Suite Modular de Gestión Integral: PMO Personal & Life OS (v2.2)

---

### 1. ARQUITECTURA TÉCNICA DUAL Y CONFINAMIENTO DE STACKS

#### A. Stack Moderno Activo (SPA Local-First):
- **Entorno:** React 19 + TypeScript (strict mode) + Vite + Tailwind CSS + Dexie (IndexedDB) + Supabase Client.
- **Estructura:** Código modular en `src/` (`components/`, `services/`, `hooks/`, `types/`, `utils/`).
- **Políticas de Módulos:**
  - Uso mandatorio de sintaxis estándar `import` / `export` ES Modules.
  - Gestión rigurosa de dependencias mediante `package.json`.
  - Compilación y tipado estricto verificado con `npx tsc --noEmit` y suite de pruebas Vitest (`npm test`).
  - Prohibido eludir tipos de TypeScript con `any` injustificado.

#### B. Confinamiento Estricto de Google Apps Script (`legacy_gas/`):
- **Entorno:** Google Apps Script V8 Engine servido vía `HtmlService` (archivos planos `.html` y `.gs`).
- **Ámbito:** Confinado ÚNICAMENTE a la carpeta `legacy_gas/` como referencia histórica y sandbox aislado.
- **Restricciones Absolutas en `legacy_gas/`:**
  - PROHIBIDO el uso de sintaxis `import` / `export` o llamadas a `require()` dentro de los archivos de `legacy_gas/`.
  - Inclusión modular exclusiva mediante scriptlets: `<?!= HtmlService.createHtmlOutputFromFile('Nombre').getContent(); ?>`.
  - Prohibido alterar atributos clave (`id`, `name`) o desbalancear etiquetas HTML en plantillas GAS.

---

### 2. REGLAS TRANSVERSALES DE NEGOCIO Y ESTADO

#### A. Blindaje de Atajos Globales y Despacho LIFO:
1. **Blindaje contra Inputs:** Si el foco activo reside en `INPUT`, `TEXTAREA`, `SELECT` o `[contenteditable="true"]`, la escucha de letras y números se inhibe para permitir mecanografía natural.
2. **Pila LIFO de Cancelación (`Escape`):** Cierre secuencial desde el diálogo de mayor jerarquía z-index hacia abajo:
   `Asistente IA -> Modal Exportar PDF -> Modal Atajos Teclado -> Drawer de Archivados -> blur() de campo enfocado`.
3. **Mapeo Canónico de Navegación Numérica:**
   - `1`: Tablero Kanban (`kanban`)
   - `2`: Portafolio Ejecutivo (`portafolio`)
   - `3`: Hábitos & Vida (`habitos`)
   - `4`: Flujo y Finanzas (`financiero`)
   - `5`: Notas Inteligentes (`notas`)
4. **Núcleo Transversal:**
   - `Esc`: Cancelar / Cerrar en orden LIFO.
   - `C`: Abrir Google Calendar en pestaña nueva.
   - `X`: Limpiar filtros activos (`pmo:clear-filters`).
   - `Enter`: Confirmar acción primaria en diálogo modal activo.
   - `?` (`Shift + /`): Desplegar Modal Canónico de Atajos de Teclado.

#### B. Bóveda de Archivados (+10 Días):
1. **Umbral Temporal Estricto:** Ingresan a la Bóveda de Archivados únicamente aquellas entidades cuyo evento de finalización, cierre o conciliación supere los **10 días transcurridos** (`diffDias > 10`). Entidades completadas hace $\le 10$ días permanecen visibles en sus vistas canónicas activas.
2. **Exclusión por Reactivación:** La bandera `_desarchivado === true` excluye inmediatamente a la entidad de la bóveda, manteniéndola visible en el canvas operativo en caliente.
3. **Restauración Atómica:** Toda restauración muta el estado a un estado activo inicial (`01_Backlog` para tareas, `03_En_Ejecucion` para proyectos, `02_Por_Hacer` para actividades, `PENDIENTE` para finanzas) y actualiza el timestamp `updated_at: new Date().toISOString()`.

#### C. Tablero Kanban, DoD y Modal TareaFlow Bento:
1. **Header Multi-Fila:** Segmented control contextual (`TODOS`, `PROYECTOS`, `PERSONAL`), chip dinámico de proyecto activo con semáforo de salud y CPI, cápsula temporal (`TODO`, `HOY`, `SEMANA`, `MES`) y badge de Gasto Contextual en PEN.
2. **Drag-and-Drop HTML5 Nativo y DoD:**
   - Transiciones de estado con `draggable={true}`, feedback visual `.kanban-dropzone-active`.
   - **Protocolo DoD Obligatorio:** Antes de transicionar una tarea al estado terminal `04_Completado`, ejecutar `validarDoDSubtareas()`. Si existen subtareas pendientes en `db.subtareas_pasos`, advertir o requerir confirmación explícita.
3. **Modal TareaFlow Bento:**
   - 3 tarjetas maestras elevadas: `Tiempo & Esfuerzo`, `Operativo & Matriz`, `Financiero & Entorno`.
   - Breadcrumb WBS canónico (`Proyecto › Hito › Predecesora`) con selectores interactivos.
   - Checklist procedural reactivo vinculado a subtareas con barra de progreso porcentual gradiente índigo-esmeralda.

#### D. Serialización e Integridad:
- **Exportación Atómica de Notas:** Serialización a texto plano mediante `serializarNotaATextoPlano(nota)`, excluyendo metadatos de auditoría internos y soportando checklists lineales y tablas dinámicas.
- **Erradicación de Emojis Crudos:** Prohibido el uso de emojis crudos en el DOM o templates de React. Toda iconografía debe emplear componentes SVG Lucide.
