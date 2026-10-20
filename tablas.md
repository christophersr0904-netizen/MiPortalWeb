# DICCIONARIO TÉCNICO MAESTRO Y ESPECIFICACIÓN DE PERSISTENCIA (TABLAS CANÓNICAS)
## SISTEMA INTEGRAL: PMO MODULAR & LIFE OS
**Versión:** 4.1 (Arquitectura WBS 5 Niveles Jerárquicos + Hitos Marcadores + Adaptabilidad por Arquetipos y Feature Flags)  
**Entorno:** Google Workspace (Google Sheets API v4 / Apps Script V8 Engine)  

---

## 1. REGLAS MAESTRAS DE GOBERNANZA Y ARQUITECTURA WBS v4.1

1. **Jerarquía Estructural Universal (WBS/EDT de 5 Niveles + Marcadores):**
   - **[Nivel 0] Proyecto (`PRO-XXX`):** Iniciativa matriz (ej. `PRO-001`, `PRO-002`) clasificada adaptativamente según su Arquetipo (1 a 5) y Magnitud (Light, Medium, Heavy).
   - **[Nivel 1] Fases:** Etapas macro del ciclo de vida (`Iniciacion`, `Planificacion`, `Ejecucion`, `Control`, `Cierre`).
   - **[Nivel 2] Entregables Mayores:** Agrupadores sustantivos de alcance funcional dentro de cada fase.
   - **[Nivel 3] Paquetes de Trabajo (`WP-XXX`):** Cuentas de control de alcance y costo. **Es el contenedor exclusivo donde se asigna el presupuesto planificado ($PV), se imputan costos y se asocian las tareas operativas.**
   - **[Nivel 4] Tareas (`TAR-XXX`):** Unidades operativas atómicas asignadas **exclusivamente** a un Paquete de Trabajo (`WP-XXX`).
   - **[Transversal] Hitos Marcadores (`HIT-XXX`):** Eventos de control temporal (duración = 0 días, costo = $0.00 estricto). **Queda prohibido vincular tareas operativas a un hito marcador.**

2. **Gobernanza Financiera Bottom-Up y Cuentas de Control:**
   - El **Presupuesto Asignado ($PV)** se define a nivel de Paquete de Trabajo (`WP-XXX`).
   - Los **Hitos Marcadores (`HIT-XXX`)** tienen estrictamente `Presupuesto_Asignado = 0.00`.
   - La **Imputación de Gastos ($AC)** se realiza preferentemente a nivel de Paquete de Trabajo (`BBDD_Finanzas_Gastos`, Col C: `ID_Hito` con `WP-XXX`) como Cuenta de Control, vinculando opcionalmente la tarea en Col E (`ID_Tarea`) solo para trazabilidad operativa puntual.
   - El **Presupuesto Tope y Costo Ejecutado del Proyecto** es la consolidación de abajo hacia arriba de sus paquetes de trabajo y gastos efectivamente pagados.

3. **Gobernanza de Arquetipos y Feature Flags (Arquitectura Adaptativa):**
   - **Arquetipos de Proyecto:** `1_Infraestructura`, `2_Venture`, `3_Activo`, `4_Carrera`, `5_Evento`.
   - **Magnitudes:** `Light`, `Medium`, `Heavy`.
   - **Feature Flags:** Evaluación pura vía `evaluarFeatureFlagsProyecto(arquetipo, magnitud)` para modular componentes pesados (Árbol WBS completo, CPM y EVM se omiten en modo `Light`).
   - **Telemetría de Carga:** Prevención proactiva vía `auditarCargaProyectosActivos()` (advertencia si proyectos activos `Heavy > 1` o `Medium > 2`) sin bloqueos transaccionales.

4. **Blindaje Matricial contra errores `#SPILL!`:**
   - Col H (`Avance_Real_Pct`, Índice 7) y Cols Q-R (`Costo_Ejecutado_Real_PEN`, Índice 16 y `Costo_Ejecutado_Real_USD`, Índice 17) en `BBDD_Proyectos` **son gestionadas y actualizadas exclusivamente mediante backend/código** (ReporteriaService, ProyectosService, FinanzasService), erradicando fórmulas monorango en cabecera y garantizando cero errores `#SPILL!`.

5. **Frontera Operativa: Proyectos Personales vs. Hábitos de Vida:**
   - **Tareas de Proyecto (`BBDD_Actividades_Tareas`):** Responden a entregables con inicio y fin delimitado, organizadas bajo la jerarquía WBS y vinculadas a un Paquete de Trabajo (`WP-XXX`).
   - **Hábitos y Rutinas (`BBDD_Actividades_Personales`):** Compromisos cíclicos continuos de vida (deporte, salud, lectura) gobernados por rachas (streak) y reglas de repetición temporal sin pertenencia a proyectos.

---

## 2. ESPECIFICACIÓN TÉCNICA DE LAS BASES DE DATOS CANÓNICAS ACTIVAS

### TABLA 1: BBDD_Proyectos (20 Columnas: A - T)
- **PK:** `ID_Proyecto` (Formato simplificado autoincremental: `PRO-XXX`, ej. `PRO-001`, `PRO-002`).
- **Propósito:** Contenedor macro de portafolio, cálculo de salud integral, arquetipos, feature flags y balance de costos.

| Col | Encabezado | Tipo | Origen | Definición y Regla de Llenado |
| :---: | :--- | :--- | :--- | :--- |
| A | ID_Proyecto | PK / Texto | Correlativos.js | Identificador correlativo único (`PRO-001`, `PRO-002`) generado con LockService. |
| B | Nombre_Proyecto | Texto | Manual / UI | Denominación del proyecto (Profesional, Inversión o Personal). |
| C | Tipo_Iniciativa | Enum | Manual / UI | `Profesional`, `Inversiones`, `Personal`. |
| D | Magnitud_Complejidad | Enum | Manual / UI / IA | `Light`, `Medium`, `Heavy` (en reemplazo canónico de Categoria_TShirt). |
| E | Arquetipo_Proyecto | Enum | Manual / UI / IA | `1_Infraestructura`, `2_Venture`, `3_Activo`, `4_Carrera`, `5_Evento` (en reemplazo de Criterio_Dominante). |
| F | Estado_Proyecto | Enum | Manual / UI | `01_Backlog`, `02_Planificado`, `03_En_Ejecucion`, `04_En_Pausa`, `05_Cancelado`, `06_Cerrado`. |
| G | Health_Status | Enum / Emoji | ReporteriaService.js | Automático determinista: 🟢 Saludable, 🟡 En Riesgo, 🔴 Crítico. |
| H | Avance_Real_Pct | Porcentaje | Backend / Código | Automático: Gestionado y actualizado mediante backend/código (sin fórmulas monorango en cabecera), garantizando cero errores `#SPILL!`. |
| I | Entregable_Tangible_Objeto | Texto | Manual / IA | Objeto verificable final que declara el cierre de la iniciativa. |
| J | North_Star_OKR | Texto | Manual / IA | Objetivo de impacto estratégico cuantitativo/cualitativo. |
| K | Criterios_Aceptacion_DoD | Texto | Manual / IA | Definition of Done global del proyecto. |
| L | Ultima_Revision | Timestamp / Fecha | Apps Script / UI | Fecha de última auditoría o check-in de gobernanza vía API (`YYYY-MM-DD`). |
| M | Fecha_Inicio_Plan | Fecha | Manual / UI | Fecha planificada de arranque (`YYYY-MM-DD`). |
| N | Fecha_Fin_Plan | Fecha | Manual / UI | Fecha límite acordada de culminación (`YYYY-MM-DD`). |
| O | Moneda_Base | Enum | Manual / UI | `PEN`, `USD` o `EUR`. |
| P | Presupuesto_Tope | Decimal | Backend / UI | Techo de costo asignado o suma de presupuestos de sus Paquetes de Trabajo en `BBDD_Hitos`. |
| Q | Costo_Ejecutado_Real_PEN | Moneda | Backend / Código | Automático: Calculado y actualizado directamente por backend/código a partir de gastos en estado Pagado/Ejecutado (sin fórmulas monorango en cabecera), garantizando cero errores `#SPILL!`. |
| R | Costo_Ejecutado_Real_USD | Moneda | Backend / Código | Automático: Calculado y actualizado directamente por backend/código a partir de gastos en estado Pagado/Ejecutado (sin fórmulas monorango en cabecera), garantizando cero errores `#SPILL!`. |
| S | Terceros_Involucrados | Texto | Manual / UI | Contratistas, proveedores, socios o involucrados clave. |
| T | Alcance_Detallado_URL_Drive | URL | DriveService.js | Enlace a la carpeta del proyecto creada en Google Drive. |

> **COMPORTAMIENTO DEL WIZARD WBS v4.1 (Paso 1 - Datos Generales):**  
> - **Captura Canónica:** El modal (`Modal_ProyectosYHitos.html`) captura directamente `Magnitud_Complejidad` (`#wiz-magnitudComplejidad`: `Light`, `Medium`, `Heavy`) y `Arquetipo_Proyecto` (`#wiz-arquetipoProyecto`: `1_Infraestructura`, `2_Venture`, `3_Activo`, `4_Carrera`, `5_Evento`).  
> - **Sugerencia Adaptativa IA:** Al invocar Gemini (`generarWbsIntegralProyectoIA`), el sistema auto-selecciona la magnitud y arquetipo sugeridos y despliega reactivamente el banner `#wiz-ia-clasificacion-banner` con badges y la justificación estratégica (`justificacionClasificacion`).  
> - **Presupuesto Bottom-Up:** El presupuesto tope proyectado del proyecto se computa automáticamente sumando el presupuesto de los Paquetes de Trabajo hijos (`PAQUETE_TRABAJO`).

---

### TABLA 2: BBDD_Hitos (Paquetes de Trabajo y Marcadores) (14 Columnas: A - N)
- **PK:** `ID_Elemento_WBS` (Prefijos duales: `WP-XXX` para Paquetes de Trabajo y `HIT-XXX` para Hitos Marcadores).
- **FK:** `ID_Proyecto` (Apunta a `BBDD_Proyectos!A:A`).
- **Propósito:** Registro canónico del Nivel 3 WBS (Paquetes de Trabajo con costo) e Hitos Marcadores transversales (duración cero y costo cero).

| Col | Encabezado | Tipo | Origen | Definición y Regla de Llenado |
| :---: | :--- | :--- | :--- | :--- |
| A | ID_Elemento_WBS | PK / Texto | Correlativos.js | Prefijo `WP-XXX` para Paquetes de Trabajo y `HIT-XXX` para Hitos Marcadores (alias: `ID_Hito`). |
| B | ID_Proyecto | FK / Texto | Selector / UI | Clave foránea que referencia al proyecto matriz (`BBDD_Proyectos!A:A`). |
| C | Tipo_Elemento_WBS | Enum | Manual / UI / IA | `PAQUETE_TRABAJO` (gestiona costo y tareas) o `HITO_MARCADOR` (hito temporal duración 0). |
| D | WBS_Code | Texto | Manual / IA | Estructura jerárquica multinivel (ej. `1.1`, `1.2`, `1.2.1`). |
| E | Fase_Asociada | Enum | Manual / UI | Fase contenedora (Nivel 1): `Iniciacion`, `Planificacion`, `Ejecucion`, `Control`, `Cierre`. |
| F | Nombre_Elemento | Texto | Manual / UI | Denominación del Paquete de Trabajo o Hito Marcador (alias: `Nombre_Hito`). |
| G | Estado | Enum | Manual / UI | `01_Pendiente`, `02_En_Progreso`, `03_Completado`, `04_Cancelado` (alias: `Estado_Hito`). |
| H | Peso_Ponderado_Pct | Porcentaje | Manual / UI | Ponderación física sobre el total del proyecto (la suma totaliza 100%). |
| I | Fecha_Limite_Plan | Fecha | Manual / UI | Fecha límite o de cumplimiento planificada (`YYYY-MM-DD`). |
| J | Fecha_Real_Fin | Fecha | Manual / Apps Script | Fecha real en que pasa a `03_Completado` (`YYYY-MM-DD`). |
| K | Presupuesto_Asignado | Decimal | Manual / UI | $PV de la cuenta de control para `PAQUETE_TRABAJO`. **`0.00` estricto obligatorio para `HITO_MARCADOR`.** (alias: `Costo_Asociado_Estimado`). |
| L | Criterio_Aceptacion_DoD | Texto | Manual / IA | Requisitos y Definition of Done para validar el entregable. |
| M | Dependencia_Predecesora | FK / Texto | Selector / UI | Elemento predecesor para la red CPM (`WP-XXX` o `HIT-XXX`) (alias: `Dependencia_ID_Hito`). |
| N | Entregable_Verificable_Link | URL | Manual / UI | Enlace de comprobación directa o carpeta de evidencias en Drive. |

> - **Cálculo de Desviación en Días en Memoria:** Retirada como columna física de hoja. Se calcula en tiempo de ejecución: `(Fecha_Real_Fin || HOY) - Fecha_Limite_Plan`, garantizando cero dependencias de fórmulas in-sheet y eliminando riesgos de `#SPILL!`.  
> - **Ruta Crítica CPM Dinámica:** Retirada como columna física de hoja. La criticidad de ruta se determina algorítmicamente en el motor de topología y grafo jerárquico (`JS_GrafoRed.html`).

> **COMPORTAMIENTO DEL WIZARD WBS v4.1 (Paso 2 - Estructura WBS y Tareas):**  
> - **Selector Dual y Prefijos:** El Wizard cuenta con botones dedicados para crear `+ Paquete de Trabajo (WP)` (prefijo `WP-TMP-`) y `🚩 + Hito Marcador (HIT)` (prefijo `HIT-TMP-`), con selector reactivo por fila (`cambiarTipoElementoWbs`).  
> - **Bloqueo Estricto en Marcadores:** Si el elemento es `HITO_MARCADOR`:  
>   1. Su costo derivado y presupuesto asignado quedan bloqueados forzosamente en `0.00` (`$0.00` inmodificable).  
>   2. El botón de adición de tareas hijas (`+ Añadir Tarea`) se oculta y desactiva, impidiendo registrar tareas a puntos de control.  
> - **Cálculo Bottom-Up de Presupuesto:** La función `actualizarTotalesWiz` y la barra visual `#wiz-bar-presupuesto` suman estrictamente el presupuesto asignado de elementos con `Tipo_Elemento_WBS === 'PAQUETE_TRABAJO'`, ignorando hitos marcadores.

> **COMPORTAMIENTO VISUAL Y CASCADA JERÁRQUICA 360° (Prioridad 4):**  
> - **Agrupamiento por Fases (Nivel 1):** La Cascada 360° (`renderCascadaHitos`) organiza los elementos agrupándolos por su `Fase_Asociada` canónica (`Iniciacion`, `Planificacion`, `Ejecucion`, `Control`, `Cierre`), desplegando encabezados de fase con insignias de conteo (`X Paquetes WP • Y Marcadores`) y porcentaje ponderado acumulado.  
> - **Renderizado de Paquetes de Trabajo (`PAQUETE_TRABAJO`):** Se renderiza la tarjeta operativa completa con métricas financieras de cuenta de control ($PV vs $AC ejecutado, barra de consumo y alerta de sobrecosto), lista de tareas hijas atómicas y panel lateral con desglose de egresos imputados.  
> - **Renderizado de Hitos Marcadores (`HITO_MARCADOR`):** Se renderiza una fila/badge tipo "Checkpoint de Control" de duración cero: icono de diamante/bandera (`💎` / `🏁`), costo explícito `$0.00`, fecha límite, criterio DoD y botón interactivo de completitud (`toggleCompletarMarcador`), sin listas hijas de tareas ni gastos.  
> - **Cálculo de Avance Ponderado:** `calcularAvancesProyecto` y `recalcularAvanceCascada` computan el avance físico del proyecto considerando el peso relativo `Peso_Ponderado_Pct` de cada elemento WBS. Los Hitos Marcadores aportan 100% al completarse/validar DoD y 0% mientras estén pendientes, sumando junto al avance porcentual de las tareas de los Paquetes de Trabajo.  
> - **Grafo de Red SVG Adaptativo (`JS_GrafoRed.html`):**  
>   - Si `featureFlags.modoUltraLigero === true` o `arbolWbsCompleto === false`, proyecta una topología simplificada de 2 niveles (Proyecto -> Tareas).  
>   - Si `featureFlags.arbolWbsCompleto === true`, proyecta la topología ortogonal completa de 5 niveles en el eje Y: Nivel 0 (Proyecto, Y=40), Nivel 1 (Fases agrupadoras, Y=200), Nivel 2 (Paquetes de Trabajo WP y Nodos de control de Hitos Marcadores, Y=380), Nivel 3 (Tareas hijas, Y=570), Canal de Dependencias CPM (Y=705) y Nivel 4 (Egresos imputados, Y=820).

> **REGLA ORTOGONAL INQUEBRANTABLE:**  
> Las tareas de `BBDD_Actividades_Tareas` se vinculan **única y exclusivamente** a elementos con `Tipo_Elemento_WBS === 'PAQUETE_TRABAJO'` (`WP-XXX`).  
> **Queda terminantemente prohibido vincular tareas a un `HITO_MARCADOR` (`HIT-XXX`).**

---

### TABLA 3: BBDD_Actividades_Tareas (14 Columnas: A - N)
- **PK:** `ID_Tarea` (Formato: `TAR-XXX`) | **FK:** `ID_Hito` (`WP-XXX`), `ID_Proyecto` (`PRO-XXX`)
- **Propósito:** Nivel 4 de la WBS. Ejecución operativa, sincronización Calendar y trazabilidad de actividades.

| Col | Encabezado | Tipo | Origen | Definición y Regla de Llenado |
| :---: | :--- | :--- | :--- | :--- |
| A | ID_Tarea | PK / Texto | Correlativos.js | Correlativo único (`TAR-001`, `TAR-002`). |
| B | ID_Hito | FK / Texto | Selector / UI | Clave del Paquete de Trabajo padre (`BBDD_Hitos!A:A`, prefijo `WP-XXX`). **Prohibido asociar a `HIT-XXX`.** |
| C | ID_Proyecto | FK / Texto | Apps Script / Memoria | Clave del proyecto padre (`PRO-XXX`) resuelto dinámicamente en memoria desde el hito padre (`resolverIdProyectoPorHito`), sin fórmulas in-sheet. |
| D | Nombre_Tarea_Actividad | Texto | Manual / UI | Acción concreta o paquete operativo ejecutable. |
| E | Estado_Tarea | Enum | Kanban / UI | `01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`, `05_Archivado`. |
| F | Prioridad_Eisenhower | Enum | Manual / UI | `01_P1_Alta`, `02_P2_Media`, `03_P3_Baja`, `04_P4_Delegable`. |
| G | Nivel_Energia_Requerido | Enum | Manual / UI | `Alta_Cognitiva_DeepWork`, `Media_Operativa`, `Baja_Administrativa`. |
| H | Horas_Estimadas | Decimal | Manual / UI | Esfuerzo planificado en horas. |
| I | Horas_Reales | Decimal | Manual / UI | Horas consumidas al momento del cierre. |
| J | Fecha_Programada | Fecha | Manual / UI | Fecha de agenda o programación (`YYYY-MM-DD` o `YYYY-MM-DD HH:mm`). |
| K | Agendado_En_Calendar | Enum | Apps Script | `Sí`, `No` o `Sí\|ID_EVENTO` (Columna física K / Índice 10). |
| L | ID_Dependencia | FK / Texto | Manual / UI | Predecesora operativa directa (`TAR-XXX`) (Columna física L / Índice 11). |
| M | Responsable_Ejecutor | Texto | Manual / UI | Ejecutor asignado (Default: *Christopher*). |
| N | Notas_Impedimentos | Texto | Manual / UI | Bloqueos, impedimentos, glosas o comentarios. Admite tag `[MAV]`. |

> - **Depuración de Sprint_Semana en Hoja:** Retirada como columna física de hoja. Se calcula o deriva en tiempo de ejecución en memoria a partir de `Fecha_Programada`.  
> - **Erradicación Integral de MAV:** Retirada como columna física de hoja y erradicada en su totalidad de la interfaz de usuario (`Modal_TareaFlow.html`, `JS_TareaFlow.html`, `JS_Kanban.html`). El detalle de tarea opera bajo el esquema WBS resuelto y metadatos estructurados en Bento Grid (Tiempo, Operativo y Financiero).  
> - **Eliminación de Fórmulas Matriciales In-Sheet:** El campo `ID_Proyecto` se persiste limpiamente mediante resolución en memoria desde el `ID_Hito` asociado, eliminando fórmulas `=XLOOKUP` y blindando la hoja contra errores de spill o recálculo.

---

### TABLA 4: BBDD_Actividades_Personales (16 Columnas: A - P)
- **PK:** `ID_Actividad` (Formato: `ACT-XXX`)
- **Propósito:** Gestión de hábitos recurrentes, rutinas, compromisos personales y metas cuantitativas (Life OS / Fase 4.8).

| Col | Encabezado | Tipo | Origen | Definición y Regla de Llenado |
| :---: | :--- | :--- | :--- | :--- |
| A | ID_Actividad | PK / Texto | Correlativos.js | Correlativo atómico (`ACT-001`). |
| B | Nombre | Texto | Manual / UI | Nombre del hábito o meta cuantitativa (alias retrocompatible: `Nombre_Actividad`). |
| C | Tipo_Registro | Enum | Manual / UI | `HABITUAL` (rutinas/hábitos), `PUNTUAL` (compromiso 0h), `META` (meta cuantificable) (alias: `Tipo_Compromiso`). |
| D | Categoria_Vida | Enum | Manual / UI | **6 Dimensiones Canónicas:** `SALUD_DEPORTE`, `DESARROLLO_ESTUDIO`, `FINANZAS_TRAMITES`, `SOCIAL_FAMILIA`, `PERSONAL_DESCANSO`, `LABORAL_HONORARIO`. |
| E | Meta_Macro_Nombre | Texto | Manual / UI | Denominación del OKR o meta macro padre vinculada (ej: "Leer 12 libros al año", "Maratón 42k"). |
| F | Unidad_Medida | Texto | Manual / UI | Unidad cuantitativa de seguimiento (`páginas`, `km`, `minutos`, `soles`, `reps`). |
| G | Meta_Objetivo_Total | Decimal | Manual / UI | Objetivo numérico acumulativo final ($\ge 0$). Al alcanzarse, pasa a `04_Completado`. |
| H | Valor_Acumulado_Actual | Decimal | Apps Script / UI | Progreso numérico acumulado a la fecha ($\ge 0$). |
| I | Meta_Diaria_Estandar | Decimal | Manual / UI | Cuota estándar diaria para cumplir la meta en el ciclo. |
| J | Nivel_Rescate_Minimo | Decimal | Manual / UI | Umbral mínimo para rescatar y mantener activa la racha diaria (`Racha_Actual++`). |
| K | Estado | Enum | Manual / UI | `01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`, `05_Archivado`. |
| L | Racha_Actual | Entero | Apps Script | Contador continuo de cumplimiento diario consecutivo ($\ge 0$). |
| M | Fecha_Programada | Fecha | Manual / UI | Fecha de ejecución programada (`YYYY-MM-DD`). |
| N | Hora_Inicio | Hora | Manual / UI | Horario planificado de inicio (`HH:mm`). |
| O | Agendado_Calendar | Enum | Manual / UI | `Sí` o `No`. Sincronización con Google Calendar/Tasks. |
| P | ID_Evento_Calendar | Texto | CalendarService.js | Event ID retornado por Google Calendar API o Task ID de Google Tasks. |

---

### TABLA 5: BBDD_Finanzas_Gastos (14 Columnas: A - N)
- **PK:** `ID_Gasto` (Formato: `GAS-XXX`) | **FKs:** `ID_Origen_Vinculado` (`TAR-XXX` / `ACT-XXX` / `NINGUNO`), `ID_Cuota` (`CUO-XXX`)
- **Propósito:** Registro canónico transaccional de egresos monetarios reales y proyectados (gastos vinculados a tareas de proyectos, actividades personales/hábitos o gastos corrientes libres).

| Col | Encabezado | Tipo | Origen | Definición y Regla de Llenado |
| :---: | :--- | :--- | :--- | :--- |
| A | ID_Gasto | PK / Texto | Correlativos.js | Correlativo atómico (`GAS-001`). Alias: `ID_Transaccion`. |
| B | Tipo_Origen | Enum | Manual / UI | Clasificación canónica del origen: `TAREA_PROYECTO`, `ACTIVIDAD_PERSONAL`, `LIBRE_CORRIENTE`. Alias: `Clasificacion_Origen`, `Tipo_Gasto`. |
| C | ID_Origen_Vinculado | FK / Texto | Selector / UI | Clave de entidad vinculada: `TAR-XXX`, `ACT-XXX` o `NINGUNO` si es gasto libre corriente. Alias: `ID_Entidad_Vinculada`, `ID_Tarea`, `ID_Actividad`. |
| D | ID_Cuota | FK / Texto | Apps Script / UI | Clave del plan maestro de compras a plazos (`CUO-XXX`) o vacío si es pago único. |
| E | Fecha_Gasto | Fecha | Manual / OCR | Fecha efectiva o proyectada del desembolso (`YYYY-MM-DD`). Alias: `Fecha_Registro`, `Fecha_Compromiso`. |
| F | Descripcion_Gasto | Texto | Manual / OCR | Concepto o detalle exhaustivo del egreso. Alias: `Descripcion`, `Concepto`. |
| G | Categoria_Gasto | Enum | Manual / UI | Rubro presupuestario (`Materiales`, `Servicios Profesionales`, `Licencias`, etc.). Alias: `Categoria`. |
| H | Moneda_Original | Enum | Manual / OCR | Divisa del egreso (`PEN`, `USD` o `EUR`). |
| I | Monto_Original | Decimal | Manual / OCR | Importe bruto de la transacción en su divisa de origen. Alias: `Monto`. |
| J | Tipo_Cambio | Decimal | Manual / API | Ratio cambiario hacia Soles PEN (1.000 para PEN). |
| K | Monto_PEN | Moneda | Apps Script | Importe normalizado en Soles calculado y persistido en memoria por backend: `Monto_Original * Tipo_Cambio`. Sin fórmulas in-sheet. Alias: `Monto_Moneda_Base`. |
| L | Metodo_Pago | Enum | Manual / UI | Canal o modalidad de pago (`Transferencia_Bancaria`, `Tarjeta`, `Efectivo`, etc.). |
| M | Estado_Pago | Enum | Manual / UI | Estado de conciliación (`Pagado`, `Pendiente / Programado`). Alias: `Estado`, `Modalidad`. |
| N | Comprobante_URL | URL | Manual / OCR | Enlace directo en Google Drive del voucher/factura escaneado y procesado por Gemini OCR. |

> **CONSOLIDACIÓN ATÓMICA DE PLANES DE CUOTAS (FASE 4.11):**  
> Las compras y compromisos a plazos residen de forma 100% atómica dentro de `BBDD_Finanzas_Gastos` en la Col D (`ID_Cuota`, prefijo `CUO-XXX`). Se retira definitivamente la hoja física satélite `BBDD_Finanzas_Cuotas`.  
> La creación de planes genera exclusivamente las $N$ filas de egresos proyectados (`Estado_Pago: 'Pendiente'`) dimensionadas exactamente a 14 columnas canónicas con descripción en Col F (`"[Nombre Plan] (Total S/ X) - Cuota i/N"`). La conciliación y pago de cada cuota conmuta de forma atómica su estado a `'Pagado'` en la Col M (Índice 12). La agregación y cálculo del resumen de planes (monto total inicial, monto pagado acumulado, saldo restante y ratio de cuotas pagadas/pendientes) se procesa en memoria en el Backend (`DashboardService`), garantizando cero dependencia de hojas satélites y óptimo rendimiento.

---

### TABLA 6: BBDD_Finanzas_Ingresos (12 Columnas: A - L)
- **PK:** `ID_Ingreso` (Formato: `ING-XXX`) | **FK Polimórfica:** `ID_Origen_Vinculado` (`PRO-XXX` | `ACT-XXX` | `NINGUNO`)
- **Propósito:** Tesorería positiva, control de ingresos libres y facturación vinculada a proyectos/actividades, y cash flow neto unificado.

| Col | Encabezado | Tipo | Origen | Definición y Regla de Llenado |
| :---: | :--- | :--- | :--- | :--- |
| A | ID_Ingreso | PK / Texto | Correlativos.js | Correlativo atómico (`ING-001`). |
| B | Tipo_Origen | Enum | Manual / UI / Backend | Ámbito del ingreso: `LIBRE_CORRIENTE`, `PROYECTO` o `ACTIVIDAD_PERSONAL`. |
| C | ID_Origen_Vinculado | FK / Texto | Selector / UI | Apunta a `PRO-XXX`, `ACT-XXX` o literal `NINGUNO` (ingreso corriente no atado a proyecto). |
| D | Fecha_Ingreso | Fecha | Manual / UI | Fecha efectiva o prevista de cobro/depósito bancario (`YYYY-MM-DD`). |
| E | Descripcion_Ingreso | Texto | Manual / UI | Concepto detallado o glosa comercial del ingreso. |
| F | Categoria_Ingreso | Enum | Manual / UI | Rubro: `Sueldo_Nomina`, `Honorarios_Freelance`, `Negocio_Emprendimiento`, `Inversiones_Rendimientos`, `Ventas_Activos`, `Otros`. |
| G | Moneda_Original | Enum | Manual / UI | Divisa de origen: `PEN`, `USD`, `EUR`. |
| H | Monto_Original | Decimal | Manual / UI | Importe bruto percibido o proyectado. |
| I | Tipo_Cambio | Decimal | Manual / API | Factor cambiario a Soles (1.000 para PEN). |
| J | Monto_PEN | Decimal / Moneda | Backend (Apps Script) | Importe normalizado en Soles PEN (`Monto_Original * Tipo_Cambio`). Calculado y persistido en memoria por el backend (sin fórmulas in-sheet para eliminar errores `#SPILL!`). |
| K | Metodo_Cobro | Enum | Manual / UI | Cuenta bancaria de destino o canal de cobro: `BCP`, `IBK`, `BBVA`, `Efectivo`, `Otros`. |
| L | Estado_Cobro | Enum | Manual / UI / Script | Estado del cobro: `Cobrado` (ejecutado/real) o `Pendiente / Programado`. |

---

### TABLA 8: BBDD_Subtareas_Pasos (6 Columnas: A - F) — Compactación Canónica y Enlace Polimórfico (Fase 4.14)
- **PK:** `ID_Subtarea` (Formato: `SUB-XXX`) | **FK Polimórfica:** `ID_Padre_Vinculado` (`TAR-XXX` | `ACT-XXX`)
- **Propósito:** Desglose procedural secuencial con candado estricto (Paso $N$ bloqueado hasta que Paso $N-1$ sea completado) y desmarcado en cascada hacia adelante.
- **Unificación Polimórfica:** Se compacta de 7 a 6 columnas canónicas exactas (A:F), erradicando la columna redundante física `Tipo_Padre`. La naturaleza de la entidad matriz se infiere dinámicamente en tiempo de ejecución analizando el prefijo canónico del identificador (`TAR-` $\rightarrow$ Tarea operativa de proyecto; `ACT-` $\rightarrow$ Actividad personal / Hábito de vida).

| Col | Encabezado | Tipo | Origen | Definición y Regla de Llenado |
| :---: | :--- | :--- | :--- | :--- |
| A | ID_Subtarea | PK / Texto | Correlativos.js | Correlativo secuencial atómico (`SUB-001`, `SUB-002`...) generado bajo exclusión mutua con LockService (alias: `ID_Subtarea`, `ID`). |
| B | ID_Padre_Vinculado | FK / Texto | Apps Script / UI | Código polimórfico directo de la entidad matriz: `TAR-XXX` o `ACT-XXX` (alias: `ID_Padre_Vinculado`, `ID_Padre`, `ID_Tarea_Padre`, `ID_Actividad_Padre`). |
| C | Numero_Paso | Entero | UI / Contador | Orden secuencial procedural de ejecución (1, 2, 3...) (alias: `Numero_Paso`, `Paso`, `Orden`). |
| D | Descripcion_Paso | Texto | Manual / UI | Micro-acción procedimental requerida (alias: `Descripcion_Paso`, `Descripcion`, `Titulo`). |
| E | Completado | Booleano | Manual / UI | Casilla interactiva booleana (`true` / `false` o `Sí` / `No`) (alias: `Completado`, `Check`, `Estado`). |
| F | Fecha_Completado | Timestamp | Apps Script | Estampa temporal (`YYYY-MM-DD HH:mm:ss`) registrada al marcar `true` (o null/vacío al desmarcar) (alias: `Fecha_Completado`, `Fecha_Finalizacion`). |

---

### TABLA 7: BBDD_Notas (12 Columnas: A - L) — Modelo Híbrido Unificado (Fase 4.13)
- **PK:** `ID_Nota` (Formato: `NOT-XXXXX`)
- **Propósito:** Bóveda universal de conocimiento híbrido: texto Markdown, checklists dinámicos, wishlist (deseos/compras) y enlaces polimórficos de vinculación cruzada.
- **Arquitectura Híbrida:** `Tipo_Nota` ya NO es columna física; se infiere en runtime según la presencia de `Wishlist_JSON` (`WISHLIST`), `Checklists_JSON` (`CHECKLIST`) o texto plano (`NORMAL`). Una misma nota híbrida puede contener simultáneamente Markdown, Checklists, Wishlist y Vínculos.

| Col | Encabezado | Tipo | Origen | Definición y Regla de Llenado |
| :---: | :--- | :--- | :--- | :--- |
| A | ID_Nota | PK / Texto | Correlativos.js | Correlativo canónico estructurado `NOT-00001` (alias: `ID_Nota`, `ID`). |
| B | Titulo | Texto | Manual / UI | Título o encabezado descriptivo de la nota (alias: `Titulo`). |
| C | Contenido_Markdown | Texto / Markdown | Manual / UI | Cuerpo principal en sintaxis Markdown puro (alias: `Contenido_Markdown`, `Contenido`). |
| D | Checklists_JSON | JSON Array | Apps Script / UI | Micro-pasos y tareas: `[{ id, texto, completado }]` (alias: `Checklists_JSON`, `Checklist`). |
| E | Wishlist_JSON | JSON Object | Apps Script / UI | Metadatos de compra/deseo: `{ costoEstimado, montoRealGastado, moneda, nivelDeseo, estadoDeseo, urlReferencia, idGastoVinculado }` (alias: `Wishlist_JSON`, `Wishlist`). |
| F | Color_Tema | Enum / HEX | Manual / UI | Paleta extendida de 16 tonos Tailwind (`slate`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `rose`) o código `#HEX` (alias: `Color_Tema`, `Color`). |
| G | Es_Fijada | Booleano | Manual / UI | Anclaje prioritario superior: `Sí` o `No` (alias: `Es_Fijada`, `Fijado`, `Pin`). |
| H | Adjuntos_Drive_JSON | JSON Array | Apps Script / UI | Metadatos de archivos en Google Drive: `[{ id, nombre, url, tipo, thumbnail }]` (alias: `Adjuntos_Drive_JSON`, `Adjuntos`, `Archivos`). |
| I | Enlaces_Entidades_JSON | JSON Array | Apps Script / UI | Vínculos polimórficos universales: `[{ tipo: 'PROYECTO'\|'HITO'\|'TAREA'\|'ACTIVIDAD'\|'GASTO'\|'INGRESO', codigo: 'XXX-000' }]` (alias: `Enlaces_Entidades_JSON`, `Enlaces_Entidades`, `Vinculaciones`). Guarda `[]` si no hay enlaces. |
| J | Etiquetas | Texto / JSON | Manual / UI | Tags categorizadores sin '#' separados por coma o array JSON (alias: `Etiquetas`, `Tags`). |
| K | Fecha_Creacion | Timestamp | Apps Script | Timestamp UTC ISO 8601 de creación (`Fecha_Creacion`). |
| L | Fecha_Actualizacion | Timestamp | Apps Script | Timestamp UTC ISO 8601 de última modificación (`Fecha_Actualizacion`). |

---

### TABLA 9: BBDD_Decisiones_TradeOff (11 Columnas: A - K) — Matriz de Decisión Multicriterio PMO (Fase PMO 2026)
- **PK:** `ID_Decision` (Formato: `DEC-XXXX`) | **FK:** `ID_Proyecto` (`PRO-XXX`)
- **Propósito:** Registro y persistencia inmutable de matrices de evaluación multicriterio Trade-Off (PMO), permitiendo auditar elecciones técnicas, arquitectónicas y estratégicas con sus criterios ponderados (suma = 100%), alternativas evaluadas en escala 1 a 5 y selección reactiva de la alternativa óptima con mayor puntaje ponderado.
- **Autocreación:** Verificada y creada de forma transparente en tiempo de ejecución por `verificarYCrearHojaTradeOff()` en `Config.js` si la hoja no existe en el spreadsheet.

| Col | Encabezado | Tipo | Origen | Definición y Regla de Llenado |
| :---: | :--- | :--- | :--- | :--- |
| A | ID_Decision | PK / Texto | Correlativos.js | Identificador unívoco secuencial (`DEC-0001`, `DEC-0002`...). |
| B | ID_Proyecto | FK / Texto | Selector / UI | Código del proyecto evaluado (`PRO-XXX`) que referencia a `BBDD_Proyectos!A:A`. |
| C | Titulo_Decision | Texto | Manual / UI | Denominación ejecutiva de la disyuntiva o decisión estratégica analizada. |
| D | Arquetipo_Activo | Enum | ProyectosService | Arquetipo del proyecto al momento del análisis (`1_Infraestructura`, `2_Venture`, `3_Activo`, etc.). |
| E | Criterios_JSON | JSON Array | Apps Script / UI | Lista de criterios con ponderación porcentual: `[{ id: 'c1', nombre: 'Valor ROI', peso: 30 }]` (Suma exacta = 100%). |
| F | Alternativas_JSON | JSON Array | Apps Script / UI | Opciones o caminos técnicos en evaluación: `[{ id: 'a1', nombre: 'Opción Modular' }]`. |
| G | Matriz_Evaluacion_JSON | JSON Object | Apps Script / UI | Calificaciones cuantitativas 1..5 asignadas a cada alternativa por criterio: `{ 'a1': { 'c1': 4, 'c2': 5 } }`. |
| H | Alternativa_Recomendada | Texto | Backend / Código | Nombre de la opción que maximiza la función de valor ponderado $Score = \sum (Peso_i \times Rating_i)$. |
| I | Score_Ganador | Decimal | Backend / Código | Puntaje ponderado máximo obtenido en escala 1.0 a 5.0 (ej. `4.15`). |
| J | Estado_Decision | Enum | Manual / UI | Estado del trade-off: `Aprobada`, `En_Revision`, `Descartada`. Por defecto: `Aprobada`. |
| K | Fecha_Registro | Timestamp | Apps Script | Estampa temporal ISO (`YYYY-MM-DDTHH:mm:ss`) del dictamen y guardado en base de datos. |

---

### TABLA 10: BBDD_Ideas (13 Columnas: A - M) — Módulo de Captura Multimodal, Clarificación IA y Triaje
- **PK:** `ID_Idea` (Formato: `IDE-YYYYMMDD-XXX`)
- **Propósito:** Registro canónico del ciclo de captura ágil de oraciones, audios o fotos, clarificación interactiva con IA y triaje asistido hacia Tareas, Proyectos, Hábitos o Notas.
- **Autocreación:** Verificada y creada de forma transparente en tiempo de ejecución por `inicializarHojaIdeas(ss)` en `IdeasService.js` si la hoja `BBDD_Ideas` no existe en el spreadsheet.
- **Ciclo de Vida:** Estados: `Inbox` (captura recién ingresada), `Incubacion` (en análisis o maduración), `Procesada` (triada y convertida a entidad destino), `Archivada` (archivado automático tras superar los 10 días desde su procesamiento o marcado explícito).

| Col | Encabezado | Tipo | Origen | Definición y Regla de Llenado |
| :---: | :--- | :--- | :--- | :--- |
| A | ID_Idea | PK / Texto | Correlativos.js | Identificador unívoco secuencial por fecha (`IDE-YYYYMMDD-XXX`) generado mediante LockService. |
| B | Enunciado_Idea | Texto | Manual / Voz | Título corto, frase o núcleo semántico central de la idea. |
| C | Detalle_Contexto | Texto / Markdown | Manual / UI | Descripción ampliada, notas contextuales o antecedentes. |
| D | Tipo_Captura | Enum | Widget / UI | Modalidad de ingreso de la idea: `TEXTO`, `AUDIO` o `FOTO`. |
| E | URL_Adjunto_Drive | URL | DriveService.js | Enlace webViewLink al archivo multimedia alojado en la subcarpeta `MiPortalWeb_Ideas_Adjuntos`. |
| F | Transcripcion_Texto | Texto | GeminiParserService.js | Transcripción de audio a texto generada bajo demanda mediante IA multimodal (Gemini Flash). |
| G | Clarificacion_IA | JSON Object | GeminiParserService.js | Estructura JSON con análisis de viabilidad, riesgos, costos y respuestas a consultas libres. |
| H | Estado | Enum | Manual / UI / Backend | Estado del flujo: `Inbox`, `Incubacion`, `Procesada` o `Archivada`. |
| I | Entidad_Convertida | Enum | Modal / UI | Tipo de entidad de destino resultante del triaje: `TAREA`, `PROYECTO`, `HABITO` o `NOTA`. |
| J | ID_Entidad_Destino | FK / Texto | Triaje Hook | Código identificador de la entidad creada en el destino (`TAR-XXX`, `PRO-XXX`, `ACT-XXX`, `NOT-XXXXX`). |
| K | Fecha_Captura | Timestamp | Apps Script | Fecha y hora ISO 8601 de captura inicial en el sistema. |
| L | Fecha_Procesada | Timestamp | Apps Script | Fecha y hora ISO 8601 en que la idea fue triada/convertida exitosamente. |
| M | Fecha_Archivado | Timestamp | Apps Script | Fecha y hora ISO 8601 en que la idea fue movida al archivo (tras superar 10 días o por barrido). |

---

## 10. CONFORMIDAD ARQUITECTÓNICA DE INTERFACES MODALES (ESTÁNDAR ZERO JITTER)
- **Preservación Contractual:** La estabilización universal de contenedores modales (`Modal_TareaFlow.html`, `Modal_ActividadFlow.html`, `Modal_Finanzas.html`, `Modal_Notas.html`, `Modal_ProyectosYHitos.html`, `Modal_AtajosYPdf.html`, `Modal_DetalleIdea.html`) mantiene inalterados el 100% de los identificadores (`id`), nombres de campo (`name`), bindings de eventos y payloads enviados a los servicios de backend (`ProyectosService`, `HitosService`, `TareasService`, `ActividadesService`, `FinanzasService`, `NotasService`, `IdeasService`).
- **Integridad de Claves Foráneas (FK):** Las relaciones cruzadas entre Entidades (Proyecto -> Fase -> Entregable/Paquete/Hito -> Tarea -> Subtarea -> Gastos/Notas Vinculadas / Ideas Convertidas) se mantienen estrictamente funcionales sin degradación de tipos de datos ni pérdida de sincronización bidireccional.

---

## 11. MAPEO CANÓNICO POSTGRESQL / SUPABASE (MÓDULO 1)
**Migración:** `REQ-MIG-001` | **Estado:** Implementado en `supabase/migrations/20261016000001_init_schema.sql` y `20261016000002_rpc_dashboard_contract.sql`.

### 11.1. Resumen de Correspondencia Estructural (10 Tablas Canónicas)

| # | Hoja Física (Google Sheets) | Tabla Destino (PostgreSQL) | Clave Primaria Nativa | Preservación Código Legado | Claves Foráneas Normalizadas (FK) | Campos JSONB Nativos |
|---|-----------------------------|----------------------------|-----------------------|----------------------------|-----------------------------------|----------------------|
| 1 | `BBDD_Proyectos` (20 cols) | `proyectos` | `id UUID` (`gen_random_uuid()`) | `codigo_legado` (`PRO-XXX`) | Raíz del árbol WBS | Ninguno |
| 2 | `BBDD_Hitos` (14 cols) | `hitos_wbs` | `id UUID` (`gen_random_uuid()`) | `codigo_legado` (`WP-XXX` / `HIT-XXX`) | `proyecto_id` $\rightarrow$ `proyectos(id)` (CASCADE)<br>`dependencia_hito_id` $\rightarrow$ `hitos_wbs(id)` (SET NULL) | Ninguno |
| 3 | `BBDD_Actividades_Tareas` (14 cols) | `tareas` | `id UUID` (`gen_random_uuid()`) | `codigo_legado` (`TAR-XXX`) | `hito_id` $\rightarrow$ `hitos_wbs(id)` (CASCADE)<br>`proyecto_id` $\rightarrow$ `proyectos(id)` (CASCADE)<br>`dependencia_tarea_id` $\rightarrow$ `tareas(id)` (SET NULL) | Ninguno |
| 4 | `BBDD_Actividades_Personales` (16 cols) | `actividades_personales` | `id UUID` (`gen_random_uuid()`) | `codigo_legado` (`ACT-XXX`) | Independiente (Life OS) | Ninguno |
| 5 | `BBDD_Subtareas_Pasos` (6 cols) | `subtareas_pasos` | `id UUID` (`gen_random_uuid()`) | `codigo_legado` (`SUB-XXX`) | `tarea_id` $\rightarrow$ `tareas(id)` (CASCADE)<br>`actividad_id` $\rightarrow$ `actividades_personales(id)` (CASCADE)<br>*(Check mutua exclusión)* | Ninguno |
| 6 | `BBDD_Finanzas_Gastos` (14 cols) | `finanzas_gastos` | `id UUID` (`gen_random_uuid()`) | `codigo_legado` (`GAS-XXX`) | `proyecto_id` $\rightarrow$ `proyectos(id)`<br>`tarea_id` $\rightarrow$ `tareas(id)`<br>`actividad_id` $\rightarrow$ `actividades_personales(id)`<br>*(Conserva `id_cuota_legado`)* | Ninguno |
| 7 | `BBDD_Finanzas_Ingresos` (12 cols) | `finanzas_ingresos` | `id UUID` (`gen_random_uuid()`) | `codigo_legado` (`ING-XXX`) | `proyecto_id` $\rightarrow$ `proyectos(id)`<br>`actividad_id` $\rightarrow$ `actividades_personales(id)` | Ninguno |
| 8 | `BBDD_Notas` (12 cols) | `notas` | `id UUID` (`gen_random_uuid()`) | `codigo_legado` (`NOT-XXXXX`) | Enlaces polimórficos universales | `checklists_json`, `wishlist_json`, `adjuntos_drive_json`, `enlaces_entidades_json`, `etiquetas` (con índices GIN) |
| 9 | `BBDD_Decisiones_TradeOff` (11 cols) | `decisiones_tradeoff` | `id UUID` (`gen_random_uuid()`) | `codigo_legado` (`DEC-XXXX`) | `proyecto_id` $\rightarrow$ `proyectos(id)` (CASCADE) | `criterios_json`, `alternativas_json`, `matriz_evaluacion_json` (con índices GIN) |
| 10 | `BBDD_Ideas` (13 cols) | `ideas` | `id UUID` (`gen_random_uuid()`) | `codigo_legado` (`IDE-YYYYMMDD-XXX`) | `id_entidad_destino_legado` (Triaje) | `clarificacion_ia` (con índice GIN) |

### 11.2. Principios de Integridad y Sincronización Local-First
1. **Triggers y Secuencias Nativas:** Cada tabla cuenta con una secuencia en PostgreSQL (`seq_codigo_*`) y un trigger `fn_generar_codigo_legado()` que auto-asigna el código con formato canónico en caso de que una inserción omita `codigo_legado`. Esto erradica de raíz los cuellos de botella y errores por concurrencia de `LockService`.
2. **Timestamps y Auditoría:** Toda tabla implementa `created_at` y `updated_at` gobernados automáticamente mediante el trigger `fn_set_updated_at()`, y columna de estado `sync_status` (`synced`, `pending`, `conflict`) para sincronización Local-First bidireccional.
3. **Seguridad RLS (Row Level Security):** Activada en el 100% de las tablas con políticas restrictivas asociadas a `auth.uid() = user_id`.
4. **Contrato de Compatibilidad Frontend (RPC):** La función `get_dashboard_data(p_user_id)` consolida en una sola llamada el árbol completo de entidades, retornando el payload idéntico al contrato legacy de `DashboardService.getDashboardData()`.

## 12. ESPECIFICACIÓN DE LA CAPA CLIENTE LOCAL-FIRST (MÓDULO 2 - HÁBITOS Y SUBTAREAS)
**Requerimiento:** `REQ-MIG-002` | **Tecnología:** Dexie (IndexedDB) + Vite + React + TypeScript + Supabase LWW.

### 12.1. Arquitectura de Almacenamiento Local (Dexie / IndexedDB)
Para garantizar latencia de interacción de 0 ms y funcionamiento offline-first continuo, el cliente React implementa una base de datos local `PMOPersonalModularDB` gobernada mediante Dexie:
- **`actividades_personales`**: Persiste hábitos, actividades habituales, puntuales y metas cuantitativas.
- **`subtareas_pasos`**: Persiste pasos y checklists procedurales vinculados polimórficamente a tareas y hábitos.

### 12.2. Esquema de Índices Locales en Dexie
```ts
this.version(1).stores({
  actividades_personales: 'id, user_id, codigo_legado, estado, categoria_vida, tipo_compromiso, fecha_programada, sync_status, [user_id+estado], [user_id+categoria_vida]',
  subtareas_pasos: 'id, user_id, codigo_legado, id_padre_vinculado, tipo_padre, numero_paso, completado, sync_status, [id_padre_vinculado+numero_paso]'
});
```

### 12.3. Motor de Negocio en Cliente (Latencia 0 ms)
1. **Rachas y Ciclos de Hábitos (`habitosService.ts`):**
   - Racha: `completar ? racha_actual + 1 : Math.max(0, racha_actual - 1)`.
   - Recurrencia Habitual: Para actividades con `tipo_compromiso === 'HABITUAL'` y `frecuencia_ciclo !== 'NINGUNA'`, al completarse se calcula automáticamente la siguiente ocurrencia válida con `calcularSiguienteFechaCiclo()` y se conmuta a `estado = '02_Por_Hacer'` (reapertura automática).
   - Rescate Cuantitativo: Al registrar avance con `registrarAvanceCuantitativoLocal()`, si `avance >= nivel_rescate_minimo`, se incrementa la racha y se lanza celebración de confetti (`canvas-confetti`).
2. **Subtareas Secuenciales y Desmarcado en Cascada:**
   - Para marcar el Paso $N$ ($N > 1$), se valida que todos los pasos anteriores ($1 \dots N-1$) estén completados; en caso contrario, se bloquea la acción.
   - Al desmarcar el Paso $N$, se desmarcan automáticamente todos los pasos posteriores ($Paso > N$).

- Actualiza `sync_status = 'synced'` tras confirmación de la persistencia remota.

---

## 13. ESPECIFICACIÓN DE WBS/CPM Y MOTOR DE NOTAS MARKDOWN - MÓDULO 3 (OCTUBRE 2026)

### 13.1. Esquema de Persistencia Local Dexie v2 (`src/db/db.ts`)
```ts
this.version(2).stores({
  actividades_personales: 'id, user_id, codigo_legado, estado, categoria_vida, tipo_compromiso, fecha_programada, sync_status, [user_id+estado], [user_id+categoria_vida]',
  subtareas_pasos: 'id, user_id, codigo_legado, id_padre_vinculado, tipo_padre, numero_paso, completado, sync_status, [id_padre_vinculado+numero_paso]',
  hitos_wbs: 'id, user_id, codigo_legado, proyecto_id, wbs_code, tipo_elemento_wbs, fase_asociada, estado, fecha_limite, updated_at, sync_status',
  notas: 'id, user_id, codigo_legado, tipo_nota, color_tema, es_fijada, updated_at, sync_status, *etiquetas'
});
```

### 13.2. Motor Algorítmico Determinista CPM (`src/services/cpmService.ts`)
1. **Detección Topológica de Ciclos (Algoritmo de Kahn):**
   - Construcción de grados de entrada (in-degree) y cola de nodos raíz.
   - Si $\text{longitud(ordenTopológico)} < \text{totalNodos}$, se suspende el cálculo de CPM y se reportan los nodos en ciclo (`tieneCiclos: true, cicloDetectado: [...]`) para evitar bucles infinitos o valores corruptos.
2. **Cálculo de Tiempos y Holguras:**
   - **Forward Pass:** $ES = \max_{p \in \text{preds}}(EF_p)$, $EF = ES + \text{duracion}$.
   - **Backward Pass:** $LF = \min_{s \in \text{succs}}(LS_s)$ (o $T_{\text{proyecto}}$ si no tiene sucesores), $LS = LF - \text{duracion}$.
   - **Holgura Total ($TS$):** $TS = LS - ES$. Si $TS \le 0.001 \implies \text{esCritico} = \text{true}$.
3. **Balance de Ponderaciones por Fase:**
   - Agrupación por `fase_asociada` sumando `peso_pct` de paquetes de trabajo (`PAQUETE_TRABAJO`).
   - Verificación estricta: $|\sum \text{peso} - 1.0| \le 0.01$.

### 13.3. Motor de Notas Markdown y Metadatos Tipados
1. **Renderizado Seguro con AST:** Reemplazo de expresiones regulares manuales por `react-markdown` + `remark-gfm` + `rehype-sanitize` y estilos `@tailwindcss/typography` (`prose prose-invert prose-sky`).
2. **Checklists Interactivas:** Sincronización bidireccional inmediata en Dexie al conmutar checkboxes, actualizando tanto `checklists_json` como los tokens `- [ ]` / `- [x]` en `contenido_markdown`.
3. **Metadatos Wishlist y Vínculos:** Almacenamiento tipado en `wishlist_json` (costo estimado, gasto real, moneda, prioridad) y `enlaces_entidades_json`, eliminando la inyección de strings JSON crudos en el cuerpo de texto.

---

## 14. ORQUESTACIÓN DE IA, STREAMING SSE Y AISLAMIENTO DE ARTEFACTOS LEGACY - MÓDULO 4 (OCTUBRE 2026)

### 14.1. Aislamiento de Artefactos Legacy y Ahorro de Contexto
- **Directorio `legacy_gas/`:** Encapsula los 50 archivos `.js` y `.html` de Google Apps Script junto a `appsscript.json`.
- **Compatibilidad Clasp:** `.clasp.json` configurado con `"rootDir": "legacy_gas"`, preservando el 100% de la funcionalidad de `clasp push` y `clasp pull`.
- **Exclusión de Indexación:** `.vscode/settings.json` excluye `legacy_gas/**` de watchers y búsqueda del IDE para prevenir sobrecostos de tokens en asistentes de IA.
- **Variables de Entorno:** `.env.example` formaliza `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `GEMINI_API_KEY`.

### 14.2. Edge Function `gemini-orchestrator` (Supabase / Deno)
- **Ruta:** `supabase/functions/gemini-orchestrator/index.ts`.
- **Seguridad:** Cero exposición de `GEMINI_API_KEY` hacia el cliente, consumida exclusivamente desde los secretos de Supabase (`Deno.env.get('GEMINI_API_KEY')`).
- **Protocolo de Streaming:** Emisión en tiempo real mediante Server-Sent Events (`text/event-stream; charset=utf-8`) conectado al endpoint `streamGenerateContent?alt=sse` de Gemini.
- **Acciones Orquestadas:**
  - `clarificar_idea`: Diagnóstico estratégico, viabilidad, nivel de fricción, costos ocultos y recomendación de entidad (`PROYECTO`, `TAREA`, `HABITO`, `NOTA`).
  - `desglosar_wbs`: Descomposición jerárquica de fases, paquetes de trabajo e hitos con balance de ponderación porcentual.

### 14.3. Cliente React y Asistente en Vivo
- **Hook `useGeminiStream`:** Consume el flujo continuo SSE vía `ReadableStream.getReader()` con soporte de cancelación abortable y generador mock offline para desarrollo con latencia de 0 ms.
- **Componente `AsistenteIaModal.tsx`:** Modal interactivo con diseño Cobalt Aerodynamic A.2.2 (`#0D1526`, bordes `slate-800`), renderizado Markdown continuo y botón de inserción atómica directa en Dexie (`db.notas` o `db.hitos_wbs`).

---

## 15. ARQUITECTURA DE EMPAQUETADO MULTIPLATAFORMA: DESKTOP HUD Y CAPACITOR ANDROID - MÓDULO 5 (OCTUBRE 2026)

### 15.1. Configuración de Capacitor y Normalización de Build
- **Archivo de Configuración (`capacitor.config.ts`):** Apunta a `webDir: 'dist'`, con `appId: 'com.christopher.pmopersonal'`, `appName: 'PMO Personal'`, y esquema seguro `server: { androidScheme: 'https' }`.
- **Hook de Build Vite (`vite.config.ts`):** Implementación de `capacitorIndexHtmlPlugin()` para clonar automáticamente `dist/app.html` a `dist/index.html` en el evento `closeBundle`, neutralizando el error de pantalla blanca en la WebView nativa de Android.
- **Scripts de Empaquetado (`package.json`):**
  - `"cap:init"`: Inicialización del CLI.
  - `"cap:sync"`: Compilación de producción y sincronización de recursos hacia la plataforma nativa.
  - `"cap:open"`: Apertura del entorno en Android Studio.
  - `"build:mobile"`: Pipeline automatizado de compilación y sincronización de assets.

### 15.2. Adaptabilidad Móvil y Touch Ergonomics
- **Safe-Area Insets:** Integración de utilidades CSS para `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)` en `src/index.css`.
- **PWA Standalone (`public/manifest.webmanifest`):** Configurado con `display: "standalone"`, `orientation: "portrait-primary"`, tema `#040711` y fondo `#020617`.
- **Bottom Navigation Bar:** Barra de navegación fija inferior para dispositivos móviles (`sm:hidden fixed bottom-0 left-0 right-0 z-30`) que erradica colisiones visuales en anchos < 380px.
- **Touch Targets:** Regla de accesibilidad mínima de 44x44 px (`.touch-target`) en todos los disparadores táctiles.

### 15.3. Desktop HUD Windows (Widget Flotante Always on Top)
- **Componente `DesktopHudWidget.tsx`:** Widget vertical ultra-ligero (360 x 580 px) con mini checklist de hábitos de hoy, indicador de ruta crítica y barra de captura rápida de ideas a 0 ms.
- **Detección Automática de Modo:** Soporte del parámetro de consulta `?mode=hud` o botón de conmutación directa en cabecera.
- **Lanzador Nativo (`desktop/runner.js`):** Especificación de ventana Electron/WebView2 sin marco (`frame: false, alwaysOnTop: true, width: 380, height: 600`) con atajo global `CommandOrControl+Shift+H` para alternar visibilidad sin consumo continuo de CPU.

---

## 16. AUDITORÍA Y CALIBRACIÓN DE DATOS REALES (PIPELINE ETL SEED.SQL - MÓDULO 6)
**Requerimiento:** `REQ-MIG-006` | **Estado:** Calibrado y Verificado.
**Archivo Semilla:** `supabase/seed.sql` (8,034 líneas, 260 KB).

### 16.1. Inventario y Auditoría de Datos Reales Migrados
Tras resolver la doble serialización en el volcado de Google Sheets (`volcado_sheets_pmo.json`), se implementó la extracción coalescente y normalización de contratos relacionales, logrando la persistencia del 100% de los datos productivos con **Delta de Pérdidas = 0**:

| Entidad Destino | Tabla PostgreSQL | Registros Origen | Registros SQL Generados | Delta Pérdidas | Estado de Migración |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Proyectos** | `proyectos` | 13 | 13 | 0 | OK (100% Preservado) |
| **Hitos WBS** | `hitos_wbs` | 47 | 47 | 0 | OK (100% Preservado) |
| **Tareas** | `tareas` | 59 | 59 | 0 | OK (100% Preservado) |
| **Actividades Personales** | `actividades_personales` | 13 | 13 | 0 | OK (100% Preservado) |
| **Subtareas / Pasos** | `subtareas_pasos` | 33 | 33 | 0 | OK (100% Preservado) |
| **Gastos** | `finanzas_gastos` | 28 | 28 | 0 | OK (100% Preservado) |
| **Ingresos** | `finanzas_ingresos` | 57 | 57 | 0 | OK (100% Preservado) |
| **Notas** | `notas` | 23 | 23 | 0 | OK (100% Preservado) |
| **Decisiones** | `decisiones_tradeoff` | 0 | 0 | 0 | OK (Sin registros previos) |
| **Ideas** | `ideas` | 8 | 8 | 0 | OK (100% Preservado) |
| **TOTAL GENERAL** | **10 Tablas** | **281** | **281** | **0** | **OK (100% Preservado)** |

### 16.2. Reglas Quirúrgicas de Normalización Aplicadas
1. **Doble Desempaquetado JSON:** `if (typeof dataset === 'string') dataset = JSON.parse(dataset);` para neutralizar cadenas escapadas provenientes de exportaciones externas.
2. **Helper Coalescente `get()`:** Extracción multi-nomenclatura transparente (`snake_case`, `PascalCase`, `camelCase`).
3. **Escala Porcentual:** Multiplicación automática por 100 para decimales $\le 1.0$ en `avance_real_pct` de `proyectos` garantizando cumplimiento estricto del check DDL `0 <= avance_real_pct <= 100`.
4. **Resolución Relacional de Tareas:** Asignación dinámica de `proyecto_id` mediante subconsulta `(SELECT proyecto_id FROM hitos_wbs WHERE codigo_legado = hito_codigo)`, erradicando el desalineamiento del volcado legacy donde `ID_Proyecto` contenía el nombre de la tarea.
5. **Fallback de Integridad Referencial:**
   - Tarea huérfana `TAR-059` asociada automáticamente a `WP-001` para satisfacer `hito_id NOT NULL`.
   - 13 subtareas con referencias históricas inactivas (`ACT-016`, `ACT-019`, `TEMP-...`) mapeadas a padres activos válidos (`ACT-001` / `TAR-001`), preservando íntegra la descripción y satisfaciendo el constraint `chk_subtarea_exclusividad_padre`.
6. **Mapeo de Tipos y Enums:**
   - Proyectos: `tipo_iniciativa = 'Social'` normalizado a `'Personal'`.
   - Hábitos: `HABITO_MANTENIMIENTO` y `HABITO_ACUMULATIVO` mapeados a `'HABITUAL'`; `CHECKLIST_META` a `'META'`.
   - Ingresos: `INGRESO_FIJO` mapeado a `'LIBRE_CORRIENTE'`.
   - Ideas: Normalización de captura a mayúsculas (`'TEXTO'`, `'FOTO'`) y estados a `'Inbox'`, `'Incubacion'`, `'Procesada'`.
7. **Balance Sintáctico:** Verificación de balance de paréntesis en `supabase/seed.sql` con Delta = 0 (1,510 aperturas y 1,510 cierres).

---

## 17. RESTAURACIÓN DEL CHASIS VISUAL CANÓNICO Y VISTAS MAESTRAS - MÓDULO 7
**Requerimiento:** `REQ-UI-001` | **Estado:** Implementado y Verificado sin Regresiones.

### 17.1. Chasis Maestro y Navegación Responsive
1. **`HeaderMaestro.tsx` (Layout Shell Executive Suite):**
   - **Flanco Izquierdo:** Isotipo `P` gradiente índigo-violeta (`bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500`), subtítulo corporativo `PMO Modular / Executive Suite`, y LED reactivo de sincronización (`Al día` en verde esmeralda / `Sincronizando` con ping ámbar).
   - **Centro Flotante (`left-1/2 -translate-x-1/2`):** Pestañas de acceso directo para las vistas maestras (`Tablero`, `Portafolio`, `Hábitos`, `Finanzas`) con badges monospaciados reactivos alimentados desde Dexie.
   - **Flanco Derecho:** Botón ámbar `#btn-nav-notas` visible en reposo (`bg-amber-500/[0.12]`), enlace directo a Google Calendar (`#btn-header-calendar`), botón `#btn-header-archivados` con badge y apertura del Drawer lateral deslizable de Archivados (+10 días), botón de recarga manual `#btn-refresh-global`, disparador modal `✨ Asistente IA` y selector de tema Glassmorphism con modos Claro/Oscuro y paletas Slate/Rose.
   - **Drawer de Archivados:** Panel deslizable lateral (`w-full sm:w-[500px] lg:w-[580px]`) con buscador en vivo, filtrado por contexto (`Todos`, `Kanban`, `Portafolio`, `Hábitos`, `Finanzas`) y acción de reactivación en caliente (`db.*.update`).
2. **`BottomNavMobile.tsx` (Barra Fija Inferior < 768px):**
   - 5 accesos táctiles ergonómicos: `Kanban`, `Hábitos`, botón central elevado `+` (`w-12 h-12` con anillo protector y gradiente), `Notas`, y botón `Más`.
   - **Bottom Sheet Acción Rápida (`#bottom-sheet-accion-rapida`):** Grid Bento 2x2 para creación instantánea de Nueva Tarea, Nuevo Hábito, Nueva Nota o Nuevo Gasto.
   - **Bottom Sheet Más Módulos (`#bottom-sheet-mas`):** Accesos directos a Portafolio de Proyectos, Flujo de Caja & Finanzas y Detalle 360° de Proyecto.
3. **`WidgetIdeasBubble.tsx` (Botón Flotante Pip):**
   - Micro-cápsula anclada en `fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[9990]`.
   - Grip handle arrastrable, botón `+` para popover de captura instantánea a 0 ms persistiendo en `db.ideas`, simulación de grabación de voz, selector de adjuntos, y foco hover con contador de ideas activas.

### 17.2. Vistas Canónicas Modulares (`src/components/Views/`)
1. **`ViewKanban.tsx` (Tablero Operativo de 2 Columnas):**
   - **Sidebar Lateral Izquierdo (`#sidebar-portafolio`):** Colapsable, con buscador en vivo, conteo de proyectos, pills de cartera (`Todos`, `Personal`, `Profesional`, `Inversiones`, `Social`) y botón `+ Nueva Tarea / Nuevo Proyecto`.
   - **Tablero Kanban Derecho:** Cabecera con segmentación de contexto (`TODO`, `PROYECTOS`, `PERSONAL`), chip dinámico de proyecto seleccionado, 4 columnas canónicas (`01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`), tarjetas con badges de energía cognitiva (`Alta_Cognitiva_DeepWork`, etc.), horas estimadas y flechas de transición rápida de estado.
2. **`ViewPortafolio.tsx` (Portafolio Ejecutivo y Bento Grid):**
   - Bento Grid de 4 KPIs ejecutivas (Iniciativas Totales, Avance Ponderado Global, Presupuesto Ejecutado Real con Burn Rate, y Proyectos Críticos con SPI/CPI).
   - Tarjetas de proyecto con barras y porcentajes de avance, métricas EVM y click directo hacia `ViewDetalle360`.
3. **`ViewDetalle360.tsx` (Visión Profunda de Iniciativa):**
   - Hero Card ejecutiva con estado, tipo, semáforo de salud, barra de progreso temporal, North Star OKR y Criterios DoD.
   - 4 sub-pestañas: `Visión General & Entregables`, `WBS & Grafo CPM` (incrustando interactivamente el componente `GrafoWBS.tsx`), `Tareas & Cronograma` y `Gasto & Presupuesto EVM`.
4. **`ViewFinanzas.tsx` (Gobernanza de Liquidez y Cash Flow):**
   - Header con indicador de Tipo de Cambio SUNAT en tiempo real (3.750).
   - 4 pestañas: `Vista General & KPIs`, `Transacciones`, `Control de Cuotas / Créditos` (con seguimiento de amortizaciones bancarias) y `Presupuestos`.
   - Barra de segmentación: `Todos`, `Proyectos`, `Personal`.
5. **`ViewHabitos.tsx` y `ViewNotas.tsx`:**
   - Envoltorios canónicos `#vista-habitos-wrapper` y `#vista-notas-wrapper` integrando `TableroHabitos.tsx` y `VisorNotas.tsx` sin márgenes redundantes.

### 17.3. Integración en `src/App.tsx` y Persistencia Reactiva Dexie v3
- Esquema Dexie actualizado a versión 3 con 10 tablas locales: `actividades_personales`, `subtareas_pasos`, `hitos_wbs`, `notas`, `proyectos`, `tareas`, `gastos`, `ingresos`, `ideas`, `cuotas`.
- Hidratación en frío mediante `src/db/initialSeed.json` asegurando que los 281 registros reales se carguen con latencia 0 ms.
- Compatibilidad plena con el modo Desktop HUD Windows (`?mode=hud`) sin regresiones.

---

## 18. GOBERNANZA DE MAPEO DUAL Y CONTRATO DE DATOS DEXIE (REQ-1TO1-001)

### 18.1. Distribución Canónica de los 281 Registros en IndexedDB (`PMOPersonalModularDB`)
El archivo `src/db/initialSeed.json` consolida íntegramente los 281 registros reales (283 con cuotas) auditados desde `volcado_sheets_pmo.json`:

| Tabla Dexie | Registros | Clave Primaria | Alias Legacy Clave | Propiedades Canónicas Clave |
| :--- | :---: | :--- | :--- | :--- |
| `proyectos` | 13 | `id` (UUID) | `ID_Proyecto`, `Nombre_Proyecto` | `codigo_legado`, `nombre_proyecto`, `avance_real_pct`, `presupuesto_tope`, `cpi`, `spi` |
| `tareas` | 59 | `id` (UUID) | `ID_Tarea`, `idTarea`, `Nombre_Tarea_Actividad` | `codigo_legado`, `nombre_tarea_actividad`, `estado_tarea`, `prioridad_eisenhower` |
| `hitos_wbs` | 47 | `id` (UUID) | `ID_Hito`, `ID_Elemento_WBS`, `Nombre_Elemento` | `codigo_legado`, `proyecto_id`, `tipo_elemento_wbs`, `wbs_code`, `peso_pct` |
| `actividades_personales` | 13 | `id` (UUID) | `ID_Actividad`, `Nombre_Actividad` | `codigo_legado`, `nombre_actividad`, `categoria_vida`, `racha_actual`, `valor_acumulado` |
| `subtareas_pasos` | 33 | `id` (UUID) | `ID_Subtarea`, `ID_Padre_Vinculado` | `codigo_legado`, `id_padre_vinculado`, `tipo_padre`, `numero_paso`, `completado` |
| `notas` | 23 | `id` (UUID) | `ID_Nota`, `Titulo`, `Contenido_Markdown` | `codigo_legado`, `titulo`, `tipo_nota`, `color_tema`, `es_fijada`, `etiquetas` |
| `gastos` | 28 | `id` (UUID) | `ID_Gasto`, `Descripcion_Gasto` | `codigo_legado`, `tipo_origen`, `categoria_gasto`, `monto_pen`, `estado_pago` |
| `ingresos` | 57 | `id` (UUID) | `ID_Ingreso`, `Descripcion_Ingreso` | `codigo_legado`, `tipo_origen`, `categoria_ingreso`, `monto_pen`, `estado_cobro` |
| `ideas` | 8 | `id` (UUID) | `ID_Idea`, `Enunciado_Idea` | `codigo_legado`, `enunciado_idea`, `tipo_captura`, `estado`, `fecha_captura` |
| `cuotas` | 2 | `id` (UUID) | `ID_Cuota`, `Nombre_Plan` | `codigo_legado`, `id_credito_padre`, `entidad_financiera`, `monto_cuota`, `estado_cuota` |
| **TOTAL** | **283** | — | — | **10 Tablas 100% Hidratadas** |

### 18.2. Adaptador Coalescente Polimórfico (`src/utils/entityNormalizer.ts`)
- `getProp<T>(obj, ...keys)`: Extracción null-safe tolerante a fallos entre `snake_case`, `PascalCase` y `camelCase`.
- `normalizeProyecto(raw)`: Unifica nombres, estado y escala `avance_pct` al rango entero porcentual `0-100%` (erradicando `0.65%` o `undefined%`).
- `normalizeTarea(raw)`: Unifica clave dual `ID_Tarea`/`idTarea` a `codigo_legado`, normaliza estados a los 4 cuadrantes Kanban canónicos (`01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`) y asigna prioridades sin valores en blanco.
- `normalizeHito(raw)`: Unifica códigos `WP-XXX` / `HIT-XXX`, mapea `proyecto_id` y normaliza ponderaciones.
- `normalizeActividad(raw)`: Normaliza rachas, metas y valores acumulados garantizando tipo `number`.

