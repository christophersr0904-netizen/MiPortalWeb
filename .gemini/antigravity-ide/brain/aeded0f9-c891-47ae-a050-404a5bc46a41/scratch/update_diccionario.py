import sys

def update_dictionary():
    with open('DICCIONARIO_TECNICO_MAESTRO.md', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Target Section 29 & 30
    old_sec_29_30 = """## 29. ARCHIVO: `c:\\Users\\CHRISTOPHER\\Desktop\\MiPortalWeb\\Modal_TareaFlow.html`

### 2. PROPÓSITO:
Modal interactivo estilo ClickUp / Asana (`#modal-tarea-flow`) para la creación y edición exhaustiva de tareas operativas de proyecto (`TAR-XXX`). Implementa selectores dinámicos en cascada (Proyecto -> Hitos del proyecto), control de dependencias predecesoras, estimación de horas vs. horas reales, asignación de cuadrante Eisenhower y energía, bandera MAV, gestión en vivo de subtareas hijas con reordenamiento, y vinculación atómica inmediata de gastos financieros asociados.

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Contenedor Modal: `#modal-tarea-flow`, `#task-flow-backdrop`.
  - Encabezado: `#task-flow-id`, `#task-flow-title` (input editable), `#task-flow-btn-close`.
  - Jerarquía Cascada:
    - `#task-flow-selector-proyecto`, `#task-flow-project-val`.
    - `#task-flow-selector-hito`, `#task-flow-hito-val`.
  - Atributos Operativos:
    - `#task-flow-selector-estado`, `#task-flow-status-val`.
    - `#task-flow-selector-prioridad`, `#task-flow-priority-val`.
    - `#task-flow-selector-energia`, `#task-flow-energy-val`.
    - `#task-flow-date`: Selector de fecha programada.
    - `#task-flow-time`: Selector de hora (HH:mm).
    - `#task-flow-hours`: Input decimal de horas estimadas.
    - `#task-flow-hours-real`: Input decimal de horas reales ejecutadas.
    - `#task-flow-dep`: Selector de tarea predecesora vinculada.
    - `#task-flow-mav`: Toggle booleano de Mínimo Alcance Viable.
    - `#task-flow-notes`: Área de notas e impedimentos.
  - Subtareas Integradas:
    - `#task-flow-subtasks-container`: Lista dinámica de pasos con drag handles.
    - `#input-new-subtask-flow`: Input de nuevo paso.
    - `#btn-add-subtask-flow`: Agrega paso procedural atómico.
  - Gastos Asociados:
    - `#task-flow-gastos-container`: Lista de egresos reales vinculados a la tarea.
    - `#btn-add-gasto-taskflow`: Agrega gasto instantáneo persistido en Sheets.
  - Botones de Pie:
    - `#task-flow-btn-eliminar`: Elimina la tarea invocando `deleteTarea`.
    - `#task-flow-btn-guardar`: Guarda cambios invocando `updateTarea` o `createTarea`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.tareas`, `state.proyectos`, `state.hitos`, `state.subtareas`, `state.gastos`.

---

## 30. ARCHIVO: `c:\\Users\\CHRISTOPHER\\Desktop\\MiPortalWeb\\Modal_ActividadFlow.html`

### 2. PROPÓSITO:
Modal interactivo para la gestión de actividades de vida, hábitos y rutinas personales (`#modal-actividad-flow`, `ACT-XXX`). Permite seleccionar dimensiones de vida (Salud, Estudio, Trabajo, Finanzas, Hogar, Ocio), periodicidad (Habitual recurrente o Puntual de una sola vez), reglas de repetición (diaria, semanal, mensual, o por días específicos L, M, V), control estricto de sincronización por duración (Tasks para 0h, Calendar para >0h), y enlace atómico con gastos financieros.

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Contenedor Modal: `#modal-actividad-flow`.
  - Campos Principales:
    - `#act-flow-id`: Identificador correlativo (`ACT-XXX`).
    - `#act-flow-title`: Título de la actividad.
    - `#act-flow-categoria-val`: Selector visual de categoría de vida con iconos.
    - `#act-flow-tipo-val`: Tipo de compromiso (`HABITUAL` o `PUNTUAL`).
    - `#act-flow-frecuencia-val`: Frecuencia de ciclo.
    - Selectores de días: `#act-day-L`, `#act-day-M`, `#act-day-X`, `#act-day-J`, `#act-day-V`, `#act-day-S`, `#act-day-D`.
    - `#act-flow-date`: Fecha de inicio o ejecución.
    - `#act-flow-time`: Hora de inicio programada.
    - `#act-flow-duration`: Duración en minutos u horas.
    - `#act-flow-calendar-val`: Selector de agendado (Sí / No).
    - `#act-flow-gasto-monto`: Importe de gasto asociado opcional.
    - `#act-flow-gasto-moneda`: Moneda del gasto (PEN / USD / EUR).
    - `#act-flow-notes`: Notas y checklist libre.
  - Acciones:
    - `#act-flow-btn-eliminar`: Dispara `deleteActividadPersonal`.
    - `#act-flow-btn-guardar`: Dispara `createActividadPersonal` o `updateActividadPersonal`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.actividadesPersonales`, `CONFIG.CATEGORIAS_VIDA_CONFIG`."""

    new_sec_29_30 = """## 29. ARCHIVO: `c:\\Users\\CHRISTOPHER\\Desktop\\MiPortalWeb\\Modal_TareaFlow.html`

### 2. PROPÓSITO:
Modal interactivo estilo ClickUp / Asana (`#modal-tarea-flow`) para la creación y edición exhaustiva de tareas operativas de proyecto (`TAR-XXX`). Implementa selectores dinámicos en cascada (Proyecto -> Hitos del proyecto), control de dependencias predecesoras en el grafo de red, estimación de horas vs. horas reales, asignación de cuadrante Eisenhower y energía, bandera MAV, gestión en vivo de subtareas hijas con drag-and-drop, y vinculación atómica inmediata de gastos financieros asociados con segregación estricta entre borradores no confirmados y egresos persistidos en Google Sheets (`BBDD_Finanzas_Gastos`).

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Contenedor Modal: `#modal-tarea-flow`, `#task-flow-backdrop`.
  - Encabezado: `#task-flow-id`, `#task-flow-title` (input editable), `#task-flow-btn-close`.
  - Jerarquía Cascada:
    - `#task-flow-selector-proyecto`, `#task-flow-project-val`.
    - `#task-flow-selector-hito`, `#task-flow-hito-val`.
  - Atributos Operativos:
    - `#task-flow-selector-estado`, `#task-flow-status-val`.
    - `#task-flow-selector-prioridad`, `#task-flow-priority-val`.
    - `#task-flow-selector-energia`, `#task-flow-energy-val`.
    - `#task-flow-date`: Selector de fecha programada.
    - `#task-flow-time`: Selector de hora (HH:mm).
    - `#task-flow-hours`: Input decimal de horas estimadas.
    - `#task-flow-hours-real`: Input decimal de horas reales ejecutadas.
    - `#task-flow-dep`: Selector de tarea predecesora vinculada.
    - `#task-flow-mav`: Toggle booleano de Mínimo Alcance Viable.
    - `#task-flow-notes`: Área de notas e impedimentos.
  - Subtareas Integradas:
    - `#task-flow-subtasks-container`: Lista dinámica de pasos con drag handles.
    - `#input-new-subtask-flow`: Input de nuevo paso.
    - `#btn-add-subtask-flow`: Agrega paso procedural atómico.
  - Gestor de Gastos Asociados (Modo Dual: Nuevo vs. Vincular):
    - `#task-flow-gasto-section`: Contenedor colapsable del gestor contextual de gastos.
    - Pestañas de Modo: `#task-tab-gasto-nuevo` (Registrar Nuevo) y `#task-tab-gasto-vincular` (Vincular Existente).
    - Formulario de Nuevo Gasto:
      - `#task-flow-gasto-moneda`: Selector de moneda (`PEN`, `USD`, `EUR`) con botones segmented `#task-btn-moneda-pen`, `#task-btn-moneda-usd`, `#task-btn-moneda-eur`.
      - `#task-flow-gasto-monto`: Input numérico de importe del egreso.
      - `#task-flow-gasto-simbolo`: Símbolo visual de divisa (`S/`, `$`, `€`).
      - `#task-flow-gasto-tc-badge`: Badge con tipo de cambio en tiempo real para moneda extranjera.
      - `#task-flow-gasto-categoria`: Select con categorías de gasto de proyecto (`Servicios_Contratados`, `Materiales`, `Licencias_Software`, `Logistica_Transporte`, `Otros`).
      - `#task-flow-gasto-desc`: Input de concepto o descripción breve del egreso.
      - `#task-flow-gasto-equiv-box` / `#task-flow-gasto-equiv-lbl`: Badge de cálculo de equivalencia en soles.
    - Acciones Atómicas de Gasto:
      - `#task-btn-guardar-gasto-inmediato`: Botón `Guardar Gasto` (`onclick="guardarGastoAtomicoTaskFlow()"`). Persiste de forma atómica e inmediata el gasto en `BBDD_Finanzas_Gastos` y lo vincula a `TAR-XXX`.
      - `#task-btn-eliminar-gasto`: Botón `Eliminar Gasto` (`onclick="eliminarGastoModalTaskFlow()"`). Si es un borrador no confirmado limpia los inputs a vacío (`#task-flow-gasto-monto`, `#task-flow-gasto-desc`); si posee ID persistido `GAS-XXX` despacha `deleteGasto` al backend y purga `state.gastos`.
    - Vinculación de Gastos Existentes:
      - `#task-panel-gasto-vincular`: Panel buscador de gastos existentes.
      - `#task-flow-gasto-search-input`: Buscador en tiempo real por concepto, código (`GAS-XXX`) o importe.
      - `#task-flow-gastos-disponibles-list`: Lista dinámica de gastos huérfanos/disponibles en `state.gastos`.
    - Egresos Vinculados Confirmados:
      - `#task-flow-gastos-asociados-box`: Contenedor de gastos confirmados a la tarea.
      - `#task-flow-gastos-total-badge`: Badge con la sumatoria acumulada de egresos vinculados.
      - `#task-flow-gastos-asociados-list`: Lista de items confirmados con acción de desvinculación/eliminación.
  - Botones de Pie:
    - `#task-flow-btn-eliminar`: Elimina la tarea invocando `deleteTarea`.
    - `#task-flow-btn-guardar`: Guarda cambios invocando `updateTarea` o `createTarea`.
- **Regla de Negocio Crítica:** Ningún gasto se crea en Google Sheets ni se muestra en tarjetas de Kanban si el usuario solo digitó un monto y no pulsó explícitamente "Guardar Gasto". Los campos `Monto_Gasto_Asociado` y `Costo_Real_Imputado` provienen exclusivamente de gastos confirmados en `taskFlowState.gastosVinculados`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.tareas`, `state.proyectos`, `state.hitos`, `state.subtareas`, `state.gastos`, `taskFlowState.gastosVinculados`.

---

## 30. ARCHIVO: `c:\\Users\\CHRISTOPHER\\Desktop\\MiPortalWeb\\Modal_ActividadFlow.html`

### 2. PROPÓSITO:
Modal interactivo para la gestión de actividades de vida, hábitos y rutinas personales (`#modal-actividad-flow`, `ACT-XXX`). Permite seleccionar dimensiones de vida (Salud, Estudio, Trabajo, Finanzas, Hogar, Ocio), periodicidad (Habitual recurrente o Puntual de una sola vez), reglas de repetición (diaria, semanal, mensual, o por días específicos L, M, V), control estricto de sincronización por duración (Tasks para 0h, Calendar para >0h), y enlace atómico con gastos financieros con segregación estricta entre borradores no confirmados y egresos persistidos en Google Sheets (`BBDD_Finanzas_Gastos`).

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Contenedor Modal: `#modal-actividad-flow`.
  - Campos Principales:
    - `#act-flow-id`: Identificador correlativo (`ACT-XXX`).
    - `#act-flow-title`: Título de la actividad.
    - `#act-flow-categoria-val`: Selector visual de categoría de vida con iconos.
    - `#act-flow-tipo-val`: Tipo de compromiso (`HABITUAL` o `PUNTUAL`).
    - `#act-flow-frecuencia-val`: Frecuencia de ciclo.
    - Selectores de días: `#act-day-L`, `#act-day-M`, `#act-day-X`, `#act-day-J`, `#act-day-V`, `#act-day-S`, `#act-day-D`.
    - `#act-flow-date`: Fecha de inicio o ejecución.
    - `#act-flow-time`: Hora de inicio programada.
    - `#act-flow-duration`: Duración en minutos u horas.
    - `#act-flow-calendar-val`: Selector de agendado (Sí / No).
    - `#act-flow-notes`: Notas y checklist libre.
  - Gestor de Gastos Asociados (Modo Dual: Nuevo vs. Vincular):
    - `#act-flow-gasto-section`: Contenedor colapsable del gestor contextual de gastos.
    - Pestañas de Modo: `#act-tab-gasto-nuevo` (Registrar Nuevo) y `#act-tab-gasto-vincular` (Vincular Existente).
    - Formulario de Nuevo Gasto:
      - `#act-flow-gasto-moneda`: Selector de divisa (`PEN`, `USD`, `EUR`) con botones segmented `#act-btn-moneda-pen`, `#act-btn-moneda-usd`, `#act-btn-moneda-eur`.
      - `#act-flow-gasto-input`: Input numérico de importe del egreso.
      - `#act-flow-gasto-simbolo`: Símbolo de divisa (`S/`, `$`, `€`).
      - `#act-flow-gasto-tc-badge`: Badge con tipo de cambio en tiempo real.
      - `#act-flow-gasto-categoria`: Select con categorías de egreso personal (`Personal_Alimentacion`, `Personal_Transporte`, `Personal_Salud`, `Personal_Educacion`, `Personal_Ocio`, `Servicios_Contratados`, `Otros`).
      - `#act-flow-gasto-desc`: Input de concepto o detalle del gasto.
      - `#act-flow-gasto-equiv-box` / `#act-flow-gasto-equiv-lbl`: Badge de equivalencia cambiaria en soles.
    - Acciones Atómicas de Gasto:
      - `#act-btn-guardar-gasto-inmediato`: Botón `Guardar Gasto` (`onclick="guardarGastoAtomicoActividadFlow()"`). Persiste de forma atómica e inmediata el gasto en `BBDD_Finanzas_Gastos` y lo vincula a `ACT-XXX`.
      - `#act-btn-eliminar-gasto`: Botón `Eliminar Gasto` (`onclick="eliminarGastoModalActividadFlow()"`). Si es un borrador no confirmado limpia los inputs a vacío (`#act-flow-gasto-input`, `#act-flow-gasto-desc`); si posee ID persistido `GAS-XXX` despacha `deleteGasto` al backend y purga `state.gastos`.
    - Vinculación de Gastos Existentes:
      - `#act-panel-gasto-vincular`: Panel buscador de gastos existentes.
      - `#act-flow-gasto-search-input`: Buscador en tiempo real de transacciones disponibles.
      - `#act-flow-gastos-disponibles-list`: Lista dinámica de gastos huérfanos/disponibles en `state.gastos`.
    - Egresos Vinculados Confirmados:
      - `#act-flow-gastos-asociados-box`: Contenedor de gastos confirmados a la actividad.
      - `#act-flow-gastos-total-badge`: Badge con la sumatoria acumulada de egresos vinculados.
      - `#act-flow-gastos-asociados-list`: Lista de items confirmados con acción de desvinculación/eliminación.
      - `#act-flow-gasto-label`: Etiqueta contextual con el importe total consolidado.
  - Acciones:
    - `#act-flow-btn-eliminar`: Dispara `deleteActividadPersonal`.
    - `#act-flow-btn-guardar`: Dispara `createActividadPersonal` o `updateActividadPersonal`.
- **Regla de Negocio Crítica:** Ningún gasto se crea en Google Sheets ni se muestra en tarjetas si el usuario solo digitó un monto y no pulsó explícitamente "Guardar Gasto". El total de gastos vinculados (`Monto_Gasto_Asociado`) proviene exclusivamente de gastos confirmados en `activityFlowState.gastosVinculados`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.actividadesPersonales`, `state.gastos`, `CONFIG.CATEGORIAS_VIDA_CONFIG`, `activityFlowState.gastosVinculados`."""

    if old_sec_29_30 not in content:
        print("ERROR: old_sec_29_30 not found in content!")
        return False
    
    content = content.replace(old_sec_29_30, new_sec_29_30)

    # 2. Target Section 39 (JS_Habitos.html)
    old_sec_39 = """## 39. ARCHIVO: `c:\\Users\\CHRISTOPHER\\Desktop\\MiPortalWeb\\JS_Habitos.html`

### 2. PROPÓSITO:
Controlador de interfaz del módulo Hábitos y Vida Personal. Renderiza las 6 columnas temáticas de vida, administra el completado de hábitos con animación de confetti y cálculo en vivo del incremento de rachas (`Racha_Actual`), reprogramación rápida de fechas y horarios con inputs inline, apertura del modal de creación/edición de rutinas, y persistencia atómica inmediata de gastos asociados a hábitos en Google Sheets sin necesidad de guardar el formulario completo.

### 3. FUNCIONES QUE CONTIENE:

#### `lanzarCelebracionConfetti(racha)`
- **Efecto Visual:** Lanza ráfaga de confeti mediante la librería `canvas-confetti` al completar un hábito o alcanzar múltiplos de racha.

#### `renderVistaHabitos()`
- **DOM Afectado:** Renderiza `#col-cat-SALUD_DEPORTE`, `#col-cat-DESARROLLO_ESTUDIO`, `#col-cat-LABORAL_HONORARIO`, `#col-cat-FINANZAS_TRAMITES`, `#col-cat-SOCIAL_FAMILIA`, `#col-cat-PERSONAL_DESCANSO`, actualiza el anillo `#progress-ring-habitos` y contadores `#counter-habitos-hoy`.

#### `crearTarjetaHabitoHTML(act)`
- **DOM Afectado:** Genera tarjeta de hábito con checkbox de completado, badge de racha con fuego 🔥, horario programado, selector rápido de reprogramación y widget de subtareas hijas.

#### `completarHabitoDirecto(idActividad, event)`
- **Backend Invocado:** `callBackend("completarActividadPersonal", { idActividad, nuevoEstado, incrementarRacha: true })`.
- **Descripción:** Actualización optimista: marca el checkbox, incrementa visualmente la racha, dispara confeti y envía RPC al servidor.

#### `abrirModalCrearActividadPersonalPorCategoria(catKey)`
- **DOM Afectado:** Abre `#modal-actividad-flow` con la categoría preseleccionada.

#### `abrirModalEditarActividadPersonal(idActividad)`
- **DOM Afectado:** Carga datos de la actividad en `#modal-actividad-flow`.

#### `guardarActividadPersonalDesdeModal()`
- **Backend Invocado:** `callBackend("createActividadPersonal", payload)` o `callBackend("updateActividadPersonal", payload)`.

#### `eliminarActividadPersonalDesdeModal()`
- **Backend Invocado:** `callBackend("deleteActividadPersonal", { idActividad })`.

#### `guardarGastoAsociadoHabitoInmediato(idActividad)`
- **Backend Invocado:** `callBackend("createGasto", payloadGasto)`.
- **Descripción:** Registra de forma instantánea el gasto en `BBDD_Finanzas_Gastos` vinculándolo a la actividad (`ID_Entidad_Vinculada = ACT-XXX`).

### 4. VARIABLES Y ESTADO:
- **Variables Globales:** `state.actividadesPersonales`, `state.gastos`."""

    new_sec_39 = """## 39. ARCHIVO: `c:\\Users\\CHRISTOPHER\\Desktop\\MiPortalWeb\\JS_Habitos.html`

### 2. PROPÓSITO:
Controlador de interfaz del módulo Hábitos y Vida Personal. Renderiza las 6 columnas temáticas de vida, administra el completado de hábitos con animación de confetti y cálculo en vivo del incremento de rachas (`Racha_Actual`), reprogramación rápida de fechas y horarios con inputs inline, apertura del modal de creación/edición de rutinas, y persistencia atómica inmediata de gastos asociados a hábitos en Google Sheets sin necesidad de guardar el formulario completo, garantizando que ningún gasto se cree o muestre si el usuario no pulsó explícitamente "Guardar Gasto".

### 3. FUNCIONES QUE CONTIENE:

#### `lanzarCelebracionConfetti(racha)`
- **Efecto Visual:** Lanza ráfaga de confeti mediante la librería `canvas-confetti` al completar un hábito o alcanzar múltiplos de racha.

#### `renderVistaHabitos()`
- **DOM Afectado:** Renderiza `#col-cat-SALUD_DEPORTE`, `#col-cat-DESARROLLO_ESTUDIO`, `#col-cat-LABORAL_HONORARIO`, `#col-cat-FINANZAS_TRAMITES`, `#col-cat-SOCIAL_FAMILIA`, `#col-cat-PERSONAL_DESCANSO`, actualiza el anillo `#progress-ring-habitos` y contadores `#counter-habitos-hoy`.

#### `crearTarjetaHabitoHTML(act)`
- **DOM Afectado:** Genera tarjeta de hábito con checkbox de completado, badge de racha con fuego 🔥, horario programado, selector rápido de reprogramación, widget de subtareas hijas y badge de gasto monetario (únicamente para gastos confirmados en Sheets).

#### `completarHabitoDirecto(idActividad, event)`
- **Backend Invocado:** `callBackend("completarActividadPersonal", { idActividad, nuevoEstado, incrementarRacha: true })`.
- **Descripción:** Actualización optimista: marca el checkbox, incrementa visualmente la racha, dispara confeti y envía RPC al servidor.

#### `abrirModalCrearActividadPersonalPorCategoria(catKey)`
- **DOM Afectado:** Abre `#modal-actividad-flow` con la categoría preseleccionada. Limpia el formulario borrador de egreso (`#act-flow-gasto-input` y `#act-flow-gasto-desc`) y resetea la lista de vinculados.

#### `abrirModalEditarActividadFlow(idActividad)` / `abrirModalEditarActividadPersonal(idActividad)`
- **DOM Afectado:** Carga datos de la actividad en `#modal-actividad-flow`. Inicializa `#act-flow-gasto-input` y `#act-flow-gasto-desc` a cadena vacía `""` y resetea `actualizarGastoLabelFlow(0)` para garantizar que ningún dato previo ensucie el formulario borrador de egreso. Carga los egresos ya confirmados en `activityFlowState.gastosVinculados` y renderiza `#act-flow-gastos-asociados-list`.

#### `guardarActividadPersonalDesdeModal()` (alias exportado de `guardarActividadFlow()`)
- **Backend Invocado:** `callBackend("createActividadPersonal", payload)` o `callBackend("updateActividadPersonal", payload)`.
- **Regla Crítica Corregida:** **Eliminada por completo la auto-creación de gastos a partir de inputs no confirmados**. Ningún gasto se crea en Google Sheets ni se muestra en tarjetas si el usuario solo digitó un monto y no pulsó "Guardar Gasto". El total de gastos vinculados (`Monto_Gasto_Asociado`) se computa única y exclusivamente sumando los egresos confirmados previamente en `activityFlowState.gastosVinculados`.

#### `guardarNuevaActividadPersonal(payloadForm)`
- **Descripción:** Lógica de creación de actividad personal. Se eliminó la inyección optimista de `tempIdGasto`, la mutación de `state.gastos` sin confirmación y las llamadas automáticas en segundo plano a `createGasto` desde inputs no confirmados.

#### `eliminarActividadPersonalDesdeModal()`
- **Backend Invocado:** `callBackend("deleteActividadPersonal", { idActividad })`.

#### `guardarGastoAtomicoActividadFlow()`
- **Backend Invocado:** `callBackend("createGasto", payloadGasto)`.
- **Descripción:** Registra y persiste de forma atómica e inmediata el gasto en `BBDD_Finanzas_Gastos` (`ID_Entidad_Vinculada = ACT-XXX`) únicamente tras la pulsación voluntaria de `#act-btn-guardar-gasto-inmediato`. Inyecta el registro confirmado en `state.gastos` y en `activityFlowState.gastosVinculados`.

#### `eliminarGastoModalActividadFlow(idGasto)` / `ejecutarEliminacionGastoActividadFlow(idGasto)` (alias `window.eliminarGastoActividadFlow`)
- **Backend Invocado:** `callBackend("deleteGasto", { idGasto })` (condicional a ID persistido).
- **Descripción / Regla:** Si el egreso es un borrador no confirmado (input sucio sin ID persistido), limpia los inputs a vacío (`#act-flow-gasto-input`, `#act-flow-gasto-desc`) y resetea el label visual sin tocar el backend. Si el gasto ya posee un ID persistido `GAS-XXX` (`/^GAS-[A-Za-z0-9_]+$/` sin prefijos `-TMP-` ni `-ATM-`), despacha `deleteGasto`, purga el registro de `state.gastos` y de `activityFlowState.gastosVinculados`, recalcula los totales y refresca las tarjetas de la vista de hábitos.

### 4. VARIABLES Y ESTADO:
- **Variables Globales:** `state.actividadesPersonales`, `state.gastos`, `activityFlowState.gastosVinculados`."""

    if old_sec_39 not in content:
        print("ERROR: old_sec_39 not found in content!")
        return False
    
    content = content.replace(old_sec_39, new_sec_39)

    # 3. Target Section 43 (JS_TareaFlow.html)
    old_sec_43 = """## 43. ARCHIVO: `c:\\Users\\CHRISTOPHER\\Desktop\\MiPortalWeb\\JS_TareaFlow.html`

### 2. PROPÓSITO:
Lógica interactiva del modal de edición profunda de tareas (`#modal-tarea-flow`). Controla el ciclo de vida del formulario ClickUp/Asana, la actualización reactiva de menús desplegables en cascada (al cambiar de proyecto filtra automáticamente los hitos correspondientes), validación de campos obligatorios, cálculo de horas y persistencia atómica bidireccional de gastos vinculados.

### 3. FUNCIONES QUE CONTIENE:

#### `abrirModalCrearTarea(prefill)` / `abrirModalEditarTarea(idTarea)`
- **DOM Afectado:** `#modal-tarea-flow`. Llena los inputs con datos existentes o valores por defecto.

#### `cerrarModalTareaFlow()`
- **DOM Afectado:** Oculta `#modal-tarea-flow` y resetea validaciones.

#### `seleccionarProyectoTaskFlow(idProyecto)`
- **DOM Afectado:** Actualiza `#task-flow-project-val` y regenera la lista de hitos en `#task-flow-selector-hito`.

#### `seleccionarHitoTaskFlow(idHito)`
- **DOM Afectado:** Actualiza `#task-flow-hito-val`.

#### `seleccionarEstadoTaskFlow(nuevoEstado)` / `seleccionarPrioridadTaskFlow(p)` / `seleccionarEnergiaTaskFlow(e)`
- **DOM Afectado:** Actualiza badges y valores de estado, prioridad y energía.

#### `guardarTareaDesdeModalFlow()`
- **Backend Invocado:** `callBackend("createTarea", payload)` o `callBackend("updateTarea", payload)`.
- **Descripción:** Valida campos, arma el payload JSON completo y despacha la transacción.

#### `guardarGastoAsociadoTareaInmediato(idTarea)`
- **Backend Invocado:** `callBackend("createGasto", payloadGasto)`.
- **Descripción:** Registra de forma instantánea un gasto en `BBDD_Finanzas_Gastos` con `ID_Entidad_Vinculada = idTarea`.

#### `eliminarGastoAsociadoTareaInmediato(idGasto)`
- **Backend Invocado:** `callBackend("deleteGasto", { idGasto })`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales:** `state.tareas`, `state.proyectos`, `state.hitos`, `state.gastos`."""

    new_sec_43 = """## 43. ARCHIVO: `c:\\Users\\CHRISTOPHER\\Desktop\\MiPortalWeb\\JS_TareaFlow.html`

### 2. PROPÓSITO:
Lógica interactiva del modal de edición profunda de tareas (`#modal-tarea-flow`). Controla el ciclo de vida del formulario ClickUp/Asana, la actualización reactiva de menús desplegables en cascada (al cambiar de proyecto filtra automáticamente los hitos correspondientes), validación de campos obligatorios, cálculo de horas y persistencia atómica bidireccional de gastos vinculados, asegurando que ningún gasto se genere en Sheets ni se visualice en tarjetas Kanban a menos que el usuario lo guarde explícitamente.

### 3. FUNCIONES QUE CONTIENE:

#### `abrirModalCrearTarea(prefill)` / `abrirModalEditarTarea(idTarea)`
- **DOM Afectado:** `#modal-tarea-flow`. Llena los inputs con datos existentes o valores por defecto. Resetea los inputs de gasto borrador (`#task-flow-gasto-monto`, `#task-flow-gasto-desc`) a vacío y carga los egresos vinculados confirmados en `taskFlowState.gastosVinculados`.

#### `cerrarModalTareaFlow()`
- **DOM Afectado:** Oculta `#modal-tarea-flow` y resetea validaciones y formularios.

#### `seleccionarProyectoTaskFlow(idProyecto)`
- **DOM Afectado:** Actualiza `#task-flow-project-val` y regenera la lista de hitos en `#task-flow-selector-hito`.

#### `seleccionarHitoTaskFlow(idHito)`
- **DOM Afectado:** Actualiza `#task-flow-hito-val`.

#### `seleccionarEstadoTaskFlow(nuevoEstado)` / `seleccionarPrioridadTaskFlow(p)` / `seleccionarEnergiaTaskFlow(e)`
- **DOM Afectado:** Actualiza badges y valores de estado, prioridad y energía.

#### `guardarTareaDesdeModalFlow()` (alias exportado de `guardarTareaFlow()`)
- **Backend Invocado:** `callBackend("createTarea", payload)` o `callBackend("updateTarea", payload)`.
- **Regla Crítica Corregida:** **Eliminada la auto-creación de gastos a partir de inputs no confirmados** en modo CREAR y modo EDITAR. Ningún gasto se crea en Google Sheets ni se muestra en tarjetas de Kanban si el usuario solo digitó un monto y no pulsó "Guardar Gasto". Los campos `Monto_Gasto_Asociado` y `Costo_Real_Imputado` se calculan estrictamente a partir de los gastos confirmados existentes en `taskFlowState.gastosVinculados`.

#### `guardarGastoAtomicoTaskFlow()`
- **Backend Invocado:** `callBackend("createGasto", payloadGasto)`.
- **Descripción:** Registra de forma instantánea y atómica un gasto en `BBDD_Finanzas_Gastos` con `ID_Entidad_Vinculada = TAR-XXX` únicamente cuando el usuario hace clic en `#task-btn-guardar-gasto-inmediato`. Inyecta el registro en `state.gastos` y en `taskFlowState.gastosVinculados`.

#### `eliminarGastoModalTaskFlow(idGasto)` / `ejecutarEliminacionGastoTaskFlow(idGasto)` (alias `window.eliminarGastoTaskFlow`)
- **Backend Invocado:** `callBackend("deleteGasto", { idGasto })` (condicional a ID persistido).
- **Descripción / Regla:** Si el egreso es un borrador no confirmado (input de monto o descripción sin guardar), limpia `#task-flow-gasto-monto` y `#task-flow-gasto-desc` a vacío sin disparar llamadas de red. Si ya posee un ID persistido `GAS-XXX` (`/^GAS-[A-Za-z0-9_]+$/` sin `-TMP-` ni `-ATM-`), despacha `deleteGasto`, purga el registro de `state.gastos` y `taskFlowState.gastosVinculados`, actualiza `#task-flow-gastos-lista` y refresca el tablero Kanban (`renderKanbanCompleto()`).

### 4. VARIABLES Y ESTADO:
- **Variables Globales:** `state.tareas`, `state.proyectos`, `state.hitos`, `state.gastos`, `taskFlowState.gastosVinculados`."""

    if old_sec_43 not in content:
        print("ERROR: old_sec_43 not found in content!")
        return False
    
    content = content.replace(old_sec_43, new_sec_43)

    with open('DICCIONARIO_TECNICO_MAESTRO.md', 'w', encoding='utf-8') as f:
        f.write(content)

    print("SUCCESS: DICCIONARIO_TECNICO_MAESTRO.md successfully updated!")
    return True

if __name__ == '__main__':
    update_dictionary()
