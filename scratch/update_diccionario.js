const fs = require('fs');

const doc = fs.readFileSync('DICCIONARIO_TECNICO_MAESTRO.md', 'utf8');

const section9 = `\n### 9. Implementación Integral de Vista 360°, Fases Automáticas, Asistencia IA Contextual y Modal Dual WBS (Octubre 2026)

#### 1. Fases Automáticas por Complejidad y Arquetipo (\`ProyectosService.js\`)
- **Siembra Canónica en Creación Manual:**
  - Proyectos \`LIGHT\`: Sembrado automático de \`Fase 1: Entregables Principales\` y paquete de trabajo \`WP-001: Ejecución y Entregables\` (peso 1.0, estado \`01_Pendiente\`), permitiendo la creación inmediata de tareas sin pasos intermedios.
  - Proyectos \`MEDIUM\` y \`HEAVY\`: Sembrado de 3 a 4 fases canónicas con sus paquetes de trabajo raíz correspondientes según el \`Arquetipo_Proyecto\` (\`1_Infraestructura\`, \`2_Venture\`, \`3_Activo\`, \`4_Carrera\`, \`5_Evento\`).
  - Integración total con \`evaluarFeatureFlagsProyecto\` y blindaje contra duplicación de semillas.

#### 2. Asistencia Continua de Inteligencia Artificial (Gemini) (\`GeminiParserService.js\`, \`ApiRouter.js\`, \`JS_Detalle360.html\`)
- **Completar WBS con IA:**
  - Endpoint \`sugerirEstructuraWbsFaltanteIA\`: Analiza el proyecto activo, su North Star OKR, DoD y los entregables existentes. Genera sugerencias de paquetes de trabajo e hitos faltantes estructurados por fases, con estimaciones presupuestarias y criterios DoD. Fallback heurístico multi-arquetipo para tolerancia a fallas de cuota o conectividad.
  - Modal interactivo \`#modal-ia-completar-wbs\` con selección granular por checkboxes e inserción en lote.
- **Desglosar Tareas Atómicas con IA:**
  - Endpoint \`sugerirDesgloseTareasPaqueteIA\`: Descompone un paquete de trabajo seleccionado en tareas atómicas orientadas al cumplimiento estricto del criterio DoD, con tiempo estimado en horas y prioridad.
  - Botón "IA Tareas" integrado en cada tarjeta de paquete de trabajo WP en la Vista 360°.
  - Modal interactivo \`#modal-ia-desglose-tareas\` para selección e inserción optimista reactiva a 60 FPS.

#### 3. Corrección del Grafo WBS y Nomenclatura (\`View_Detalle360.html\`, \`JS_GrafoRed.html\`)
- **Nomenclatura Canónica:** Botón de alternancia de vista renombrado a \`"Vista: Hitos / Paquetes"\` (Niveles 1 y 2) y \`"Vista: Árbol Completo"\` (Niveles 1, 2, 3 y 4).
- **Erradicación de Emojis Crudos:** Reemplazados todos los emojis residuales en tarjetas de nodo y HUD por iconos SVG Lucide estandarizados (\`stroke-width: 1.75\`, clase \`.portal-icon-sm\`) o tipografía mono.

#### 4. Corrección Definitiva del Bug "F1" (\`JS_Detalle360.html\`)
- **Dinamización de Código de Fase:** Eliminado el literal \`'F1'\` hardcodeado. La plantilla renderiza dinámicamente \`codigoFase\` (\`F1\`, \`F2\`, \`F3\`...) computado en el bucle según el orden de fases (\`idxFase + 1\`), mostrando el nombre real del grupo en cada banner de cabecera de fase.

#### 5. Modal Dual de Entregables WBS (\`Modal_ProyectosYHitos.html\`, \`JS_ModalesYAtajos.html\`, \`HitosService.js\`)
- **Botón "+ Nuevo Entregable":** Vista 360° actualizada con botón canónico e icono Lucide plus.
- **Selector Dual Segmentado:** Selector pill reactivo \`[ 📦 Paquete de Trabajo (WP) | 🏁 Hito de Control (Milestone) ]\`:
  - **Paquete de Trabajo (WP):** Habilita Fase Asociada, Presupuesto Planificado ($PV), Fecha Límite Plan, Criterio DoD y Peso Ponderado. Admite desagregación en tareas.
  - **Hito de Control (HIT):** Bloquea Duración = 0 y Costo = $0.00. Solicita Nombre, Fase Asociada, Fecha Objetivo de Validación, Criterio DoD y Peso Ponderado.
- **Datalist de Fases Reactivo:** El campo de fase se auto-puebla dinámicamente con las fases existentes en el proyecto activo.

#### 6. Ergonomía Bento Grid y Mobile Bottom Sheet (\`Modal_ProyectosYHitos.html\`, \`View_Detalle360.html\`)
- **Mobile First (<640px):** Comportamiento Bottom Sheet nativo con drag handle (\`w-12 h-1.5\`) para modales de edición de proyecto, creación de entregables y asistentes de IA.
- **Desktop (>=640px):** Estructura Bento Grid en 3 cuadrantes para \`#modal-editar-proyecto\`:
  - Cuadrante 1: Identidad & Ciclo de Vida (\`edit-nombreProyecto\`, \`edit-estadoProyecto\`, \`edit-arquetipoProyecto\`, \`edit-magnitudComplejidad\`, \`edit-frecuenciaControl\`).
  - Cuadrante 2: Cronograma & Gobernanza Financiera (\`edit-fechaInicioPlan\`, \`edit-fechaFinPlan\`, \`edit-presupuestoTope\`, \`edit-urlDrive\`, \`edit-healthStatus-badge\`).
  - Cuadrante 3: Alineación Estratégica & Calidad (\`edit-northStarOKR\`, \`edit-criteriosDoD\`).
- **Homogeneización Visual:** Estandarización de todos los iconos de la Vista 360° a Lucide con \`stroke-width: 1.75\`.
`;

fs.writeFileSync('DICCIONARIO_TECNICO_MAESTRO.md', doc.trimEnd() + '\n' + section9 + '\n', 'utf8');
console.log('Appended section 9 to DICCIONARIO_TECNICO_MAESTRO.md');
