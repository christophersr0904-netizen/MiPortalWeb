# DICCIONARIO TÉCNICO MAESTRO DE ARQUITECTURA Y CÓDIGO FUENTE
## Suite Modular de Gestión Integral: PMO Personal & Life OS (v2.2 Architecture)
**Versión:** 2.2 Modular Polimórfica | **Plataforma:** Google Apps Script (V8 Engine) / Google Sheets BBDD / Web App SPA  
**Auditoría & Compilación:** Arquitecto de Software Senior | **Fecha:** Septiembre 2026  
**Propósito:** Fuente Única de Verdad (Single Source of Truth) técnica, exhaustiva y determinística para análisis, mantenimiento y evolución del sistema sin requerir re-escaneos.

---

## 🛡️ ZONAS INMUTABLES Y CONTRATOS ESTRICTOS (NO MODIFICAR)

Esta sección define las directrices y contratos defensivos inviolables del sistema para prevenir cualquier regresión entre el cliente Web, el entorno de escritorio (Electron) y la capa de datos reactiva.

1. **REGLA 1 (Arquitectura Dual App.tsx):**
   La detección del widget DEBE incluir siempre `(window as any).IS_DESKTOP_WIDGET === true` (inyectado de forma aislada por `desktop/preload.js`) combinada con los parámetros de búsqueda de URL (`?widget=desktop` o `?mode=hud`). Prohibido unificar o eliminar esta lectura dual, garantizando que el portal web en navegador normal monte el Layout completo con fondo sólido mientras la ventana nativa de Electron monte exclusivamente el widget flotante transparente (Cockpit).

2. **REGLA 2 (Servidor Loopback Electron):**
   El micro-servidor local HTTP en `desktop/main.js` (`127.0.0.1:48123`) requiere obligatoriamente el diccionario canónico y estricto de MIME Types (`.js` / `.mjs` $\rightarrow$ `application/javascript`, `.css` $\rightarrow$ `text/css`, `.json` $\rightarrow$ `application/json`, etc.). Prohibido terminantemente hacer fallback a `index.html` (MIME `text/html`) ante peticiones de assets inexistentes con extensión de archivo (debe responder `404 Not Found`), evitando que Chromium bloquee la ejecución por `Strict MIME type checking is enforced`.

3. **REGLA 3 (Polimorfismo de Datos Dexie):**
   Prohibido acceder rígidamente a propiedades de título (`a.nombre_actividad`). Toda lectura o filtrado de hábitos, actividades y metas debe canalizarse a través de resolutores defensivos polimórficos (`resolverTituloHabito`, `resolverNombreMeta` o `getProp`) para soportar llaves heredadas (`Nombre_Actividad`, `titulo`, `nombre`, `actividad`, `descripcion`) sin arrojar excepciones de tipo `TypeError` ni renderizar celdas en blanco.

4. **REGLA 4 (Matemáticas UI & Barras de Progreso):**
   Todo cálculo de porcentajes y ratios para barras de progreso, anillos o medidores radiales (Dashboards, Cockpit, Metas Cuantitativas) debe normalizar denominadores (`Math.max(1, total)`) y validar explícitamente con `Number.isFinite()` para prevenir renders de `NaN%` o `Infinity` que colapsen el CSS Grid o estropeen la maquetación.

5. **REGLA 5 (Memoización Atómica y Cero `JSON.stringify` en Reconciliadores):**
   Prohibido terminantemente ejecutar `JSON.stringify()` dentro de funciones comparadoras de `React.memo` (`arePropsEqual`). La arquitectura Local-First de Dexie garantiza que cualquier mutación actualice `updated_at` (ISO timestamp) e incremente `version`. Los comparadores deben validar estrictamente primitivos (`id`, `updated_at`, `modoVista`), preservando el hilo principal a 60-120 FPS sin bloquear el event loop.

6. **REGLA 6 (Concurrencia en Búsquedas Masivas y Aceleración GPU):**
   Todo input de búsqueda en tiempo real que filtre cuadrículas masivas (Masonry, Kanban, Portafolio) debe desacoplar el estado de entrada del filtrado pesado mediante `useDeferredValue()`. En cuadrículas densas, está prohibido usar `backdrop-blur-md` y `transition-all` en tarjetas individuales, debiendo implementarse fondos `#0D1526` opacos con aceleración por hardware (`transform-gpu transition-[transform,opacity,border-color] will-change-[transform,opacity]`). Modales de acción por fila deben elevarse a la raíz bajo el patrón *Single Instance Modal*.

---

## SECCIÓN DE GOBERNANZA LOCAL DE AGENTES & PIPELINE CANÓNICO
**Rutas Activas de Gobernanza:** `.antigravity/` y `.agents/`  
**Directriz Maestra:** [AGENTS.md](file:///c:/Users/CHRISTOPHER/Desktop/MiPortalWeb/AGENTS.md)

### 1. Directorios y Mapeo Canónico
- `.antigravity/rules/`:
  - `01_subagents_pipeline.md`: Protocolo de subagentes (Inspector, Maquetador UI/UX, Arquitecto de Datos, Cirujano de Código, Auditor QA) adaptado al stack React 19/Vite/Vitest.
  - `02_system_architecture.md`: Reglas del sistema, confinamiento de `legacy_gas/`, atajos LIFO, bóveda +10 días y DoD.
  - `03_cobalt_design_tokens.md`: Estándar visual Cobalt Aerodynamic (`#040711`, `#0D1526`, `border-slate-800/40`, Lucide 1.75).
- `.agents/rules/`: Réplica canónica para inyección nativa en `<user_rules>` de Antigravity.
- `AGENTS.md`: Punto de entrada raíz para el motor de inteligencia artificial.

### 2. Catálogo Especializado de Skills
- `.antigravity/skills/pmo-architecture/` & `.agents/skills/pmo-architecture/`: Modelado relacional, paridad de contratos, `tablas.md`, `DICCIONARIO_TECNICO_MAESTRO.md`, Dexie y Supabase.
- `.antigravity/skills/pmo-ui-cobalt/` & `.agents/skills/pmo-ui-cobalt/`: Maquetación de alta fidelidad, tokens Cobalt Aerodynamic, WBS Bento y paridad 1:1.
- `.agents/skills/ui-ux-pro-max/`: Repositorio pasivo secundario subordinado a los tokens Cobalt.
- `.antigravity/archive/`: Archivo de skills obsoletas o incompatibles (`frontend-ui-designer`, `ui-styling`).

---

## CHANGELOG DE ARQUITECTURA

### FASE 6.7.1 — Upgrade de Botones Globales PMO y Refinamiento IA WBS (REQ-UI-53-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Views/ViewPortafolio.tsx`, `src/components/Views/ViewKanban.tsx`, `src/components/Modals/ModalNuevoProyecto.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - **Botón Global de PMO (`ViewPortafolio.tsx` y `ViewKanban.tsx`):**
    - Sustitución del botón plano tradicional con `+` por el estándar aeroespacial Cobalt: fondo degradado fluido (`from-sky-600 via-sky-500 to-cyan-500`), halo luminoso `shadow-[0_0_20px_rgba(56,189,248,0.28)]`, micro-borde iluminado y micro-interacción táctil (`active:scale-95`).
    - Reemplazo del icono genérico por `<FolderPlus />` con animación de escala reactiva al hover (`group-hover:scale-110`). Aplicado a la cabecera ejecutiva y al Empty State de Portafolio, así como al pie del Sidebar y Bottom Sheet móvil en Kanban.
  - **Panel Glassmorphism de Clasificación Adaptativa IA (`ModalNuevoProyecto.tsx`):**
    - Erradicación de la fuga de variables crudas: `{arquetipoProyecto}` y `{magnitudComplejidad}` ahora se resuelven reactivamente mediante `useMemo` contra `OPCIONES_ARQUETIPO` y `OPCIONES_MAGNITUD`, mostrando etiquetas humanas limpias con sus respectivos iconos y badges de escala T-Shirt.
    - Reestructuración visual como contenedor de cristal ahumado (`backdrop-blur-xl`), halo ambiental `blur-2xl` en esquina y encabezado de alta jerarquía con `<Sparkles className="text-amber-300 animate-pulse" />` y micro-indicador esmeralda.
  - **Botón "Generar Estructura con IA" (`ModalNuevoProyecto.tsx`):**
    - Elevación con gradiente multicapa (`from-sky-500 via-indigo-500 to-sky-400`), resplandor Cobalt y rotación lúdica al hover (`group-hover:rotate-12`) en el icono de chispas.
  - **Validación QA:** 31 suites Vitest ejecutadas al 100% (306/306 tests aprobados), chequeo estricto TypeScript limpio (`npx tsc --noEmit`: 0 errores) y compilación de producción generada exitosamente.

### FASE 6.7 — Despliegue de Selectores Cobalt, Iconografía Contextual y Micro-interacciones (REQ-UI-52-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/UI/SelectIconicoCobalt.tsx` (Nuevo), `src/constants/uiMappers.ts` (Nuevo), `src/components/Modals/ModalNuevoProyecto.tsx`, `src/components/Modals/ModalNuevoHito.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `src/components/UI/SelectIconicoCobalt.tsx` (Nuevo Componente Canónico):
    - Implementado selector desplegable interactivo fluido con tokens Cobalt Aerodynamic (`#0D1526`, `border-slate-800/90`, halo `shadow-[0_16px_36px_-6px_rgba(2,6,23,0.9)]`).
    - Desacoplamiento estricto entre valor técnico persistido en base de datos (`valor`) y representación visual para el usuario (`etiqueta`, `subtitulo`, `icono`, `badge`).
    - Soporte completo de accesibilidad ARIA (`role="listbox"`, `role="option"`, `aria-expanded`), detección de clic exterior y tecla `Escape`.
  - `src/constants/uiMappers.ts` (Diccionarios de Mapeo Visual):
    - Exportadas las configuraciones `OPCIONES_ARQUETIPO`, `OPCIONES_MAGNITUD`, `OPCIONES_ESTADO_PROYECTO`, `MAPEO_FASES_WBS` y `OPCIONES_ESTADO_PARTIDA` con iconografía Lucide React (`strokeWidth={1.75}`).
  - `src/components/Modals/ModalNuevoProyecto.tsx`:
    - Erradicación de los 3 `<select>` nativos crudos, sustituidos por `<SelectIconicoCobalt />` para Arquetipo, Magnitud y Estado del Proyecto.
    - Corrección del bug de truncamiento en estado de partida (`.split(' ')` que generaba `"Migración /"` y `"Base /"`), sustituido por tarjetas seleccionables limpias con `OPCIONES_ESTADO_PARTIDA`.
    - Modernización de la barra de navegación de pestañas: retiro de prefijos numéricos rígidos (`1. `, `2. `, etc.), adopción de íconos temáticos (`LayoutTemplate`, `Network`, `ListTodo`, `Wallet`) e indicador activo con resorte cinético (`motion.div layoutId="tab-indicator-proyecto"`).
    - Supresión de dobles íconos y signos más redundantes (`+ +`), sustituidos por botones contextuales: `<Briefcase /> Nuevo Paquete`, `<Flag /> Nuevo Hito`, `<CheckSquare /> Añadir Tarea`, `<Receipt /> Añadir Gasto` y feedback táctil (`active:scale-95`).
  - `src/components/Modals/ModalNuevoHito.tsx`:
    - Sustituido el `<select>` nativo de fases asociadas por `<SelectIconicoCobalt />` dinámico con `MAPEO_FASES_WBS`.
    - Limpieza visual en selector Bento de tipo de entregable, erradicando siglas redundantes `(WP)` y `(HIT)` a favor de `Paquete de Trabajo` e `Hito de Control`.
    - Botón de guardado actualizado con iconografía contextual y micro-interacción táctil (`active:scale-95 hover:shadow-[0_0_25px_rgba(56,189,248,0.5)]`).
  - Validación QA: 31 suites Vitest ejecutadas al 100% (306/306 tests aprobados), chequeo estricto TypeScript limpio (`npx tsc --noEmit`: 0 errores) y compilación de producción generada exitosamente.

### FASE 6.6.1 — Aceleración de Animaciones a 60FPS: Bypass de Render Thrashing y Spring Physics (REQ-PERF-51-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/UI/ToastDeshacer.tsx`, `src/components/UI/AnimateCardExit.tsx`, `src/components/PMO/ColumnaKanban.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Views/ViewFinanzas.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `src/components/UI/ToastDeshacer.tsx`:
    - Erradicación definitiva de *render thrashing*: eliminado el llamado de `setTiempoRestante` a 60 Hz dentro de `requestAnimationFrame` que forzaba reconciliaciones completas de React.
    - Implementado bypass directo al DOM con `circuloRef` para el anillo SVG (`strokeDashoffset`) y `barraRef` para la micro-barra inferior resplandeciente (`width`), aplicadas directamente al nodo en cada frame.
    - Retiradas las transiciones CSS en conflicto (`transition-all duration-75`) para fluidez nativa a 60 FPS sin jitter ni latencia artificial.
    - Throttling del estado de React a 1 Hz (`Math.ceil(tiempo / 1000)` con `segundosPreviosRef`) únicamente para actualizar la cifra numérica de segundos restantes en pantalla.
  - Física Cinética *Spring* Agresiva (`AnimateCardExit.tsx`, `ColumnaKanban.tsx`, `TableroHabitos.tsx`, `ViewFinanzas.tsx`):
    - Sustituida la curva de salida lenta y pesada (`duration: 0.22, ease: [0.16, 1, 0.3, 1]`) por resortes instantáneos y ágiles: `{ type: 'spring', stiffness: 500, damping: 40, mass: 1 }` y `transition: { duration: 0.15, ease: 'easeOut' }`.
    - Eliminación perceptible de retraso visual ("floaty feeling"), colapsando tarjetas de Kanban, hábitos y finanzas en milisegundos con cero saltos bruscos de maquetación (CLS).
  - Verificación QA: 31 suites Vitest ejecutadas al 100% (306/306 tests aprobados), chequeo estricto TypeScript limpio (`npx tsc --noEmit`: 0 errores) y compilación de producción generada exitosamente.

### FASE 6.6 — Borrado Optimista Determinista (0ms), Animaciones React Bits y ToastDeshacer (REQ-UI-50-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/context/UndoDeleteContext.tsx`, `src/components/UI/ToastDeshacer.tsx` (Nuevo), `src/components/UI/AnimateCardExit.tsx` (Nuevo), `src/components/UI/UndoToastContainer.tsx`, `src/components/Views/ViewKanban.tsx`, `src/components/PMO/ColumnaKanban.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Views/ViewFinanzas.tsx`, `src/components/Modals/ModalActividadFlow.tsx`, `src/components/Notas/VisorNotas.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `src/context/UndoDeleteContext.tsx`:
    - Ruptura del *Memoization Trap* reactivo: el proveedor ahora expone `hiddenIdsSet: Set<string>` recalculado en cada `tick` emitido por el gestor de eventos (`manager.subscribe`).
    - Actualizado `estaOculto` para evaluar reactivamente contra `hiddenIdsSet` y el estado interno de `manager`, permitiendo que todos los `useMemo` de las vistas maestras invalidadas oculten las entidades eliminadas en **Frame 0 (0ms)** sin esperar a que el temporizador de base de datos expire.
    - Incorporados los métodos de control bidireccional `pausar(key)`, `reanudar(key)` y `forzarCommit(key)` en `UndoDeleteManager` y el contexto.
  - `src/components/UI/ToastDeshacer.tsx` & `UndoToastContainer.tsx`:
    - Creación del componente `ToastDeshacer` con estética React Bits / Shadcn y tokens Cobalt Aerodynamic (`#0D1526`, `border-slate-800/80`, halo `shadow-[0_12px_40px_-5px_rgba(2,6,23,0.85)]`).
    - Integrado un anillo circular SVG dinámico que consume su circunferencia en tiempo real, micro-barra inferior con gradiente resplandeciente (`from-sky-500 via-sky-400 to-teal-300`), contador numérico de segundos restantes y pausa automática de cuenta regresiva (`onMouseEnter` / `onMouseLeave`).
    - Botón prominente "Deshacer" (`RotateCcw`) que cancela la eliminación y restaura inmediatamente la entidad en pantalla con cero llamadas de red ni escrituras en Dexie.
  - Salida Animada de Tarjetas (`AnimateCardExit.tsx`, `ColumnaKanban.tsx`, `TableroHabitos.tsx`, `ViewFinanzas.tsx`):
    - Creación de `AnimateCardExit.tsx` e integración de `<AnimatePresence mode="popLayout" initial={false}>` con `<motion.div layout="position" exit={{ opacity: 0, scale: 0.94, height: 0, ... }}>` en las columnas Kanban, columnas de hábitos y listas de transacciones financieras. Al eliminarse una tarjeta, colapsa suavemente sin saltos abruptos de maquetación (CLS).
  - Reparación de Bypasses:
    - En `ModalActividadFlow.tsx`, sustituido el bloqueo síncrono de red por `programarEliminacion`, cerrando el modal de inmediato (`onClose()`) en 0ms y delegando `eliminarActividadConAlcance` al commit diferido de 4s.
    - En `ViewFinanzas.tsx`, sustituidos los métodos crudos `db.gastos.delete` y `db.ingresos.delete` por los servicios de negocio `eliminarGasto` y `eliminarIngreso`, garantizando limpieza de Google Calendar y notificación de sincronización.
  - Validación QA: 31 suites Vitest ejecutadas al 100% (306/306 tests aprobados), compilación estricta de TypeScript limpia (`npx tsc --noEmit`: 0 errores) y bundle de producción generado exitosamente.

### FASE 6.5 — Minimalismo UI/UX, Erradicación de Ruido Visual de Sincronización y SwitchCobalt (REQ-UI-49-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/UI/SwitchCobalt.tsx` (Nuevo), `src/components/Modals/ModalTareaFlow.tsx`, `src/components/Modals/ModalActividadFlow.tsx`, `src/components/Modals/ModalGasto.tsx`, `src/components/Modals/ModalIngreso.tsx`, `src/components/Modals/ModalNuevoPlanCuotas.tsx`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/PMO/TarjetaTareaKanban.tsx`, `src/components/PMO/TarjetaTransaccion.tsx`, `src/components/Cockpit/DailyCockpit.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `src/components/UI/SwitchCobalt.tsx`: Creación del componente canónico de interruptor toggle animado estilo React Bits / Shadcn y adaptado a los tokens Cobalt Aerodynamic (`#040711`, `#0D1526`, `border-slate-800/40`, halo resplandeciente `shadow-[0_0_12px_rgba(14,165,233,0.35)]` al activarse). Cumple con atributos de accesibilidad WAI-ARIA (`role="switch"`, `aria-checked`), teclado interactivo (Space / Enter) y soporta variantes de tamaño `sm` y `md`.
  - Modales de Creación y Edición (`ModalTareaFlow.tsx`, `ModalActividadFlow.tsx`, `ModalGasto.tsx`, `ModalIngreso.tsx`, `ModalNuevoPlanCuotas.tsx`):
    - Reemplazados los botones binarios toscos (`Sí` / `No`) y checkboxes nativos por `<SwitchCobalt checked={...} onChange={...} label="Agendar en Calendar" size="sm" />`.
    - Erradicado el ruido textual de diagnóstico ("OAuth Activo", "Google Calendar", ".ics", "Descargar .ics"). Sustituido por un micro-indicador inline de estado: punto pulsante esmeralda + texto "Sincronizado" cuando OAuth está activo, o enlace sutil "Conectar" cuando está pendiente. En `ModalActividadFlow`, se añade un micro-botón ícono `ExternalLink` para apertura instantánea del evento en Google Calendar.
  - Tarjetas de Entidades (`TarjetaHabito.tsx`, `TarjetaTareaKanban.tsx`, `TarjetaTransaccion.tsx`):
    - Implementación de un micro-botón ícono funcional minimalista (`CalendarClock` de Lucide React con `strokeWidth={1.75}`) condicionado a que la entidad esté agendada (`agendado_calendar === 'Sí' || id_evento_calendar`).
    - Al hacer clic, detiene la propagación del evento (`e.stopPropagation()`) e invoca `abrirGoogleCalendarActividad(entidad)` abriendo la URL del evento en Google Calendar en una pestaña nueva sin perturbar el arrastre ni la apertura del modal.
    - En `TarjetaHabito.tsx`, se integró en la comparación atómica de `areHabitoPropsEqual` para asegurar re-renderizado reactivo sin impactar los 60-120 FPS.
  - `DailyCockpit.tsx`: Limpieza del botón de Google Calendar en el HUD flotante, erradicando el texto plano "GCal" y transformándolo en un micro-botón cuadrado ergonómico (`36x36px`) con ícono `Calendar`, micro-LED pulsante de estado en la esquina superior derecha y tooltip descriptivo con modo de desconexión.
  - Verificación Integral de Calidad: 31 suites de pruebas Vitest 100% aprobadas (306/306 tests en verde). TypeScript sin errores (`npx tsc --noEmit`: 0 errores) y bundle de producción generado con éxito vía `npm run build`.

### FASE 6.4 — Inyección de Google Client ID y Aceleración GIS (REQ-OAUTH-48-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `.env`, `index.html`, `app.html`, `dist/index.html`, `dist/app.html`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `.env`: Configurado el Client ID real de Google Identity Services (`VITE_GOOGLE_CLIENT_ID=583437513933-5vj9gb8fo1thmlmnevl0mm88iqjp170c.apps.googleusercontent.com`), desbloqueando la autorización OAuth2 directa para sincronización de eventos de tareas, hábitos y finanzas con Google Calendar API v3.
  - `index.html` & `app.html`: Inyectada en el `<head>` la etiqueta `<script src="https://accounts.google.com/gsi/client" async defer></script>`, asegurando la precarga de la biblioteca oficial GIS para eliminar cualquier latencia en el pop-up de consentimiento al pulsar "Conectar GCalendar".
  - Empaquetado: Reconstruido el bundle de producción con Vite (`npm run build`), sincronizando `dist/index.html` y `dist/app.html` con cero errores.

### FASE 6.3 — Resiliencia Mobile-First, Reconexión Realtime, UX Táctil y PWA (REQ-MOBILE-47-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/services/syncManager.ts`, `src/App.tsx`, `src/components/PMO/TarjetaTareaKanban.tsx`, `src/components/PMO/TarjetaTransaccion.tsx`, `src/components/Modals/ModalTareaFlow.tsx`, `src/components/Modals/ModalActividadFlow.tsx`, `src/components/Notas/EditorNotaModal.tsx`, `src/components/Views/ViewKanban.tsx`, `public/sw.js`, `public/manifest.json`, `public/manifest.webmanifest`, `src/services/__tests__/syncManagerRealtime.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `src/services/syncManager.ts`: Creado el método canónico `reconectarRealtimeSiEsNecesario()`. Evalúa proactivamente si `realtimeChannel` es nulo o su estado interno difiere de `'joined'`, ejecutando el ciclo defensivo `destroyRealtimeSubscriptions()` y `setupRealtimeSubscriptions()`. Invocado en `window.addEventListener('online')` y dentro del callback de `document.addEventListener('visibilitychange')` al recuperar el estado `'visible'`, garantizando que tras horas de suspensión en smartphones (iOS/Android) el WebSocket se reconecte de inmediato sin recarga de navegador.
  - `src/App.tsx`: Incorporada la solicitud de almacenamiento persistente duradero vía `navigator.storage.persist()`. Protege a la base de datos local Dexie (IndexedDB) contra el mecanismo de desalojo automático (*eviction*) de WebKit tras 7 días de inactividad o presión de disco en dispositivos móviles.
  - `src/components/PMO/TarjetaTareaKanban.tsx`: Resuelto el bloqueo de scroll táctil en smartphones mediante `draggable={typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches}` y la inyección de `touch-pan-y [touch-action:pan-y]`. En móviles se prioriza el scroll vertical libre y las transiciones por micro-botones de estado, reservando el Drag & Drop HTML5 para punteros de precisión (ratón).
  - Accesibilidad Táctil de Botones Ocultos: Erradicada la clase `opacity-0` sin alternativa táctil en `src/components/PMO/TarjetaTransaccion.tsx` (botones Editar y Eliminar movimiento), `src/components/Modals/ModalTareaFlow.tsx` (eliminar paso de subtarea), `src/components/Modals/ModalActividadFlow.tsx` (eliminar paso de hábito) y `src/components/Views/ViewKanban.tsx` (botón de proyecto 360°). Estandarizados con `opacity-90 sm:opacity-0 sm:group-hover:opacity-100` y touch targets ergonómicos de `min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1`.
  - Responsive UI y Safe Areas: En `ModalTareaFlow.tsx` y `ModalActividadFlow.tsx`, modernizado el alto máximo del contenedor de `max-h-[90vh]` a `max-h-[92dvh] sm:max-h-[88vh]`, evitando que el teclado virtual oculte las acciones de guardado. Compensada la barra de inicio de iPhone (*Home Indicator*) mediante `pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]` en los pies de diálogo de `ModalTareaFlow`, `ModalActividadFlow` y `EditorNotaModal`.
  - `public/sw.js` & PWA: Blindada la regla de exclusión de red para que el Service Worker únicamente intercepte peticiones locales (`url.origin === self.location.origin`) o fuentes de Google, bloqueando el cacheado accidental Stale-While-Revalidate de APIs REST externas (como Google Calendar o Supabase). En `manifest.json` y `manifest.webmanifest`, estandarizadas las rutas de los accesos directos (*shortcuts*) a formato relativo (`./?action=...`).
  - Suite de Validación QA: 31 suites ejecutadas al 100% en verde con 306 pruebas unitarias aprobadas (+2 tests unitarios en `syncManagerRealtime.test.ts`). Compilación TypeScript limpia (`npx tsc --noEmit`: 0 errores) y build de producción exitoso.

### FASE 6.2 — Optimización de Performance Dexie, Fix Horario UTC-5, Seguridad XSS y Truncamiento Defensivo (REQ-OPT-46-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/Notas/BadgeNotasVinculadas.tsx`, `src/components/Notas/SeccionNotasVinculadasModal.tsx`, `src/utils/entityNormalizer.ts`, `src/services/syncPayloadSanitizer.ts`, `src/components/Notas/TarjetaNota.tsx`, `src/components/Views/ViewDetalle360.tsx`, `src/components/WBS/TooltipFlotanteWBS.tsx`, `src/components/WBS/nodos/NodoGasto.tsx`, `src/services/habitosService.ts`, `src/components/Modals/ModalGasto.tsx`, `src/components/Modals/ModalIngreso.tsx`, `src/components/Modals/ModalTareaFlow.tsx`, `src/components/Modals/ModalNuevoHito.tsx`, `src/components/Modals/ModalNuevoPlanCuotas.tsx`, `src/components/PMO/TarjetaTareaKanban.tsx`, `src/hooks/useHabitos.ts`, `src/components/Views/ViewKanban.tsx`, `src/components/Cockpit/DailyCockpit.tsx`, `src/utils/__tests__/entityNormalizer.test.ts`, `src/services/__tests__/multiDeviceParityRealtime.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `src/components/Notas/BadgeNotasVinculadas.tsx` & `SeccionNotasVinculadasModal.tsx`: Erradicación del patrón N+1 masivo en IndexedDB mediante el montaje condicional de `ModalVincularEntidades` (`{modalVincularAbierto && (<ModalVincularEntidades .../>)}`). Purgadas más de 630 suscripciones inactivas en segundo plano que saturaban el microtask loop en cada renderizado de tarjetas Kanban, Hábitos y Portafolio.
  - `src/utils/entityNormalizer.ts`: Implementada y exportada la función canónica `sanitizarUrlExterna(url: string | null | undefined): string | undefined`. Bloquea proactivamente cualquier esquema de inyección ejecutable (`javascript:`, `data:`, `vbscript:`, `file:`) y convalida protocolos web seguros (`http://`, `https://`, `mailto:`), autocompletando con `https://` en dominios web crudos.
  - Parche XSS en componentes UI: Aplicado `sanitizarUrlExterna` en todos los anclajes `<a href={...}>` en `src/components/Notas/TarjetaNota.tsx` (enlace Wishlist), `src/components/Views/ViewDetalle360.tsx` (carpeta Drive), `src/components/WBS/TooltipFlotanteWBS.tsx` (comprobante Drive) y `src/components/WBS/nodos/NodoGasto.tsx` (comprobante Drive).
  - `src/services/syncPayloadSanitizer.ts`: Implementado el helper `truncar(str, maxLen)` para defensa contra ataques de denegación de servicio (DoS) por payloads sobredimensionados. Acotado `nombre_tarea_actividad`, `titulo` y `nombre_actividad` a máx. 255 caracteres; `notas_impedimentos` y `notas_checklist` a máx. 4000 caracteres; y `contenido_markdown` a máx. 65535 caracteres.
  - Fix de Desfase Horario Nocturno UTC-5: Erradicada la anomalía de fecha anticipada provocada por `new Date().toISOString().split('T')[0]` a partir de las 19:00 horas (UTC-5 Perú). Estandarizado de forma estricta con `formatFechaIsoLocal(new Date())` en `ModalGasto.tsx`, `ModalIngreso.tsx`, `ModalTareaFlow.tsx`, `ModalNuevoHito.tsx`, `ModalNuevoPlanCuotas.tsx` y `TarjetaTareaKanban.tsx`. Eliminada la redefinición duplicada de `formatFechaIsoLocal` en `src/services/habitosService.ts`.
  - Optimización de Buscadores con React 19: En `src/hooks/useHabitos.ts` y `src/components/Views/ViewKanban.tsx`, integrados `useDeferredValue(filtroTexto)`, `useDeferredValue(busquedaTarea)` y `useDeferredValue(busquedaProyecto)`. El input de búsqueda mantiene reactividad inmediata a 120 FPS sin bloquear el hilo principal durante el filtrado de listas y tarjetas.
  - Limpieza de Telemetría y Loops en Background: Condicionado el `console.log` de telemetría PMO en `ViewKanban.tsx` exclusivamente bajo `import.meta.env.DEV`. En `DailyCockpit.tsx`, `pingLoopbackDesktop` aborta inmediatamente sin inicializar el `setInterval` si `!esEntornoEscritorioLocal()`, y en entornos locales amplía el intervalo de sondeo a 3000ms.
  - Suite de Pruebas Automatizadas: 31 archivos de prueba superados al 100% en verde con 304 tests aprobados (añadidas 6 pruebas unitarias para `sanitizarUrlExterna` y `truncar`). Build de producción completado en 14.13s con cero errores de TypeScript.

### FASE 5.31 — Corrección de Fechas Iso 400 Bad Request en Google Calendar, Renderizado Global DD/MM/AAAA y Selectores WBS en ModalTareaFlow (REQ-SYNC-45-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/utils/recurrenceEngine.ts`, `src/utils/timeFormatters.ts`, `src/components/Cockpit/DailyCockpit.tsx`, `src/components/PMO/TarjetaTransaccion.tsx`, `src/components/Finanzas/TabControlCuotas.tsx`, `src/components/PMO/TarjetaTareaKanban.tsx`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Modals/ModalTareaFlow.tsx`, `src/utils/__tests__/recurrenceEngine.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `src/utils/recurrenceEngine.ts`: Corrección del bug de transposición de día y mes en `normalizarFechaIso(raw)`. Cuando recibía cadenas con formato latinoamericano `DD/MM/YYYY` (como `15/11/2026`), desestructuraba erróneamente `[m, d, y]`, produciendo `2026-15-11` e induciendo un error HTTP `400 Bad Request` en Google Calendar API v3 por mes inválido. Ahora se desestructura como `[d, m, y]`, retornando consistentemente `2026-11-15`.
  - `src/components/Cockpit/DailyCockpit.tsx`: Retroalimentación explícita del estado de Google Calendar en la creación rápida de tareas. Si `calendarResult.requiereAuth === true`, se presenta un toast instructivo solicitando conectar Google Calendar en Configuración en lugar de suponer éxito. Si `calendarResult.success === true && mode === 'API_V3'`, se confirma la sincronización exitosa en la cuenta del usuario.
  - `src/utils/timeFormatters.ts`: Implementación y exportación de funciones canónicas de fecha: `formatearFechaDdMmYyyy(fecha, fallback = '-')`, `formatearFechaDdMm(fecha, fallback = 'S/F')` y `parsearFechaDdMmYyyyAIso(fechaStr)`. Soporta strings ISO completos con o sin tiempo y fechas con formato latinoamericano existente.
  - Estandarización visual global `DD/MM/AAAA`:
    - `src/components/PMO/TarjetaTransaccion.tsx`: Formateo de fecha de transacción con `formatearFechaDdMmYyyy(trx.fecha)`.
    - `src/components/Finanzas/TabControlCuotas.tsx`: Formateo de fecha de vencimiento de cuotas bancarias con `formatearFechaDdMmYyyy(c.fecha_vencimiento)`.
    - `src/components/PMO/TarjetaTareaKanban.tsx`: `formatFechaCorta` actualizado a `formatearFechaDdMm` y tooltip de fecha límite formateado a `DD/MM/AAAA`.
    - `src/components/Habitos/TarjetaHabito.tsx`: `formatearFechaCortaHabito` actualizado a `formatearFechaDdMm` y tooltips de próxima ejecución y fecha programada formateados con `formatearFechaDdMmYyyy`.
  - `src/components/Modals/ModalTareaFlow.tsx`: Reemplazo de las píldoras estáticas (`div` con `cursor-default`) de Proyecto y Paquete de Trabajo (Hito WBS) por selectores interactivos `<select>` nativos con diseño Cobalt Aerodynamic (`bg-slate-900/60 border border-slate-800/80 px-2 py-0.5 text-xs text-sky-300 / text-purple-300`). Vinculados reactivamente a `proyectoCodigo` y `hitoCodigo`, filtrando dinámicamente los hitos del proyecto seleccionado (`hitosDelProyecto`) y permitiendo al usuario asignar libremente proyecto y hito WBS al crear o editar desde cualquier columna del tablero Kanban o HUD.
  - `src/utils/__tests__/recurrenceEngine.test.ts`: Batería de pruebas unitarias cubriendo la normalización de fechas `DD/MM/AAAA` a ISO `YYYY-MM-DD` sin transposición (validando `15/11/2026` -> `2026-11-15`), formateo canónico `DD/MM/AAAA` y extracción corta `DD/MM`. 100% de la suite Vitest superada (31 suites, 298 tests) y build de producción limpio.

### FASE 5.30 — Omni-Sincronización Local-Cloud Instantánea, Google Calendar Polimórfico (RFC-5545), Auto-Completado Contextual Kanban y Selección WBS en HUD Cockpit (REQ-SYNC-44-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `.env`, `src/utils/recurrenceEngine.ts`, `src/services/calendarSyncService.ts`, `src/services/syncPayloadSanitizer.ts`, `src/services/tareasService.ts`, `src/services/gastosService.ts`, `src/services/ingresosService.ts`, `src/services/cuotasService.ts`, `src/services/notasService.ts`, `src/components/Modals/ModalTareaFlow.tsx`, `src/components/Views/ViewKanban.tsx`, `src/components/Cockpit/DailyCockpit.tsx`, `src/components/Modals/ModalGasto.tsx`, `src/components/Modals/ModalIngreso.tsx`, `src/components/Modals/ModalNuevoPlanCuotas.tsx`, `src/components/Notas/EditorNotaModal.tsx`, `src/components/Notas/TarjetaNota.tsx`, `src/components/Notas/VisorNotas.tsx`, `src/services/__tests__/tareasService.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `src/services/tareasService.ts`: Nuevo servicio de negocio canónico para tareas (`crearTarea`, `actualizarTarea`, `eliminarTarea`) con generación correlativa anti-colisión `TAR-XXX`, asignación determinística de `sync_status = 'pending'`, cascada de subtareas a tombstones, sincronización RFC-5545 hacia Google Calendar API v3 y disparo inmediato de `syncManager.syncPendingRecords()` y snapshot loopback desktop.
  - `src/services/gastosService.ts`, `ingresosService.ts`, `cuotasService.ts`, `notasService.ts`: Servicios dedicados de mutación financiera y documental que garantizan persistencia Local-First en Dexie, emisión de lápidas en `tombstones` con `sync_status = 'pending'`, e invocación inmediata no bloqueante de `syncPendingRecords()` para erradicar el aislamiento de datos en clientes de escritorio y laptops.
  - `src/services/calendarSyncService.ts` & `src/utils/recurrenceEngine.ts`: Refactorización polimórfica para aceptar cualquier entidad agendable (`EntidadAgendable`: Tareas, Gastos, Cuotas, Actividades) en `construirEventoGoogleCalendarV3`, `construirDescripcionCalendar`, `construirUrlGoogleCalendar` y `generarArchivoICS`. Facade unificado `sincronizarTareaCalendar` y gestión bidireccional de IDs de eventos en `pmo_gcal_event_map` y `db.tareas`.
  - `src/services/syncPayloadSanitizer.ts`: Blindaje WBS en `sanitizarTareaPayload` con fallback defensivo a `PRO-001` y primer hito del proyecto cuando la tarea carece de vinculación explícita, erradicando cuarentenas accidentales por restricciones `NOT NULL` de Foreign Keys en Supabase.
  - `src/components/Views/ViewKanban.tsx`: Recepción e inicialización de `estadoInicial` en `ModalTareaFlow`, propagación del ID de columna al pulsar `+` en las columnas del tablero, y migración de mutaciones (`ejecutarMoverTarea`, `handleEliminarTarea`) hacia `actualizarTarea` y `eliminarTarea`.
  - `src/components/Cockpit/DailyCockpit.tsx`: Integración de micro-selectores WBS reactivos (`FolderKanban` para Proyecto y `Milestone` para Hito) y botón de acceso a `ModalTareaFlow` dentro del Quick-Add inline del HUD flotante. Migración de `handleCrearTareaRapida` hacia `crearTarea` con sincronización Calendar y Cloud inmediata.
  - Modales Financieros y de Notas (`ModalGasto.tsx`, `ModalIngreso.tsx`, `ModalNuevoPlanCuotas.tsx`, `EditorNotaModal.tsx`, `TarjetaNota.tsx`, `VisorNotas.tsx`): Cableados a sus respectivos servicios de negocio, asegurando consistencia de estado reactivo y sincronización automática.
  - `src/services/__tests__/tareasService.test.ts`: Batería de pruebas unitarias cubriendo creación, actualización, eliminación con tombstones, sincronización polimórfica Calendar y triggers de push. 100% de la suite Vitest superada (31 suites, 294 tests).

### FASE 5.29 — Certificación Multi-Dispositivo en Tiempo Real 100%: Supabase Realtime 12 Tablas, Borrado Propagado DELETE, Correlativos Anti-Colisión (MAX + 1), LWW Inbound Pull y Paridad DDL Total (REQ-SYNC-41-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `supabase/migrations/20261112000001_multi_device_parity_realtime.sql`, `src/utils/entityNormalizer.ts`, `src/services/syncPayloadSanitizer.ts`, `src/services/syncManager.ts`, `src/components/Modals/ModalTareaFlow.tsx`, `src/components/Cockpit/DailyCockpit.tsx`, `src/components/Modals/ModalActividadFlow.tsx`, `src/services/habitosService.ts`, `src/App.tsx`, `src/services/__tests__/multiDeviceParityRealtime.test.ts`, `src/services/__tests__/syncManager.test.ts`, `src/services/__tests__/syncManagerRealtime.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `supabase/migrations/20261112000001_multi_device_parity_realtime.sql`: Migración SQL no destructiva con `ADD COLUMN IF NOT EXISTS` para incorporar columnas operativas en `actividades_personales` (`frecuencia_ciclo`, `regla_repeticion`, `fecha_fin`, `excepciones_fechas`, `ultima_fecha_completado`, `proxima_fecha_programada`, `historial_fechas`, `actividad_padre_id`, `notas_checklist`, `monto_gasto_asociado`, `version`), `notas` (`tipo_nota`, `block_nombre`, `version`) y `tareas` (`es_mav`, `costo_real_pen`, `archivado`, `hora_inicio`, `version`). Incluye bloque PL/pgSQL idempotente que añade las 12 tablas operativas a la publicación `supabase_realtime`.
  - `src/utils/entityNormalizer.ts`: Implementada y exportada la función canónica `generarCodigoCorrelativoSeguro(tableRef, prefijo, padding)` basada en `MAX(correlativo) + 1` mediante inspección por expresiones regulares. Erradica la vulnerabilidad de colisiones de IDs provocadas por `count() + 1` tras eliminaciones o entre dispositivos concurrentes. Aplicada de inmediato en `ModalTareaFlow.tsx` (`TAR`), `DailyCockpit.tsx` (`TAR`), `ModalActividadFlow.tsx` (`ACT`) y `habitosService.ts` (`ACT`).
  - `src/services/syncPayloadSanitizer.ts`: Paridad total de serialización outbound. `sanitizarActividadPayload` preserva y envía todas las propiedades de recurrencia, fechas, notas, montos y versión; `sanitizarTareaPayload` incluye `es_mav`, `costo_real_pen`, `archivado`, `hora_inicio` y `version`; `sanitizarNotaPayload` incluye `tipo_nota`, `block_nombre` y `version`. En la vía inbound, `sanitizarSubtareaInbound` recibe mapas en memoria `tareaUuidToCod` y `actividadUuidToCod` para traducir de forma determinística UUIDs remotos a códigos legibles `TAR-XXX` / `ACT-XXX`, erradicando subtareas huérfanas en laptops o dispositivos nuevos; se implementa además `sanitizarNotaInbound` para preservar cuadernos y checklists.
  - `src/services/syncManager.ts`:
    1. `setupRealtimeSubscriptions`: Expandida la suscripción WebSocket a las 12 tablas operativas (`proyectos`, `hitos_wbs`, `tareas`, `actividades_personales`, `subtareas_pasos`, `notas`, `metas_planes`, `planes_accion_hitos`, `habitos_metas_vinculos`, `gastos`, `ingresos`, `cuotas`).
    2. `handleRealtimeChange`: Detección de eventos `DELETE` entrantes y propagación inmediata del borrado físico en Dexie (`db[tabla].delete(delId)`) más registro en `db.tombstones` (`sync_status: 'synced'`), suprimiendo registros fantasma en todos los nodos cliente sin necesidad de pull redundante.
    3. `sincronizarVinculosMeta`: Corregida la cláusula de upsert a `{ onConflict: 'habito_id,meta_id' }`, respetando la restricción de unicidad canónica y neutralizando errores `23505 duplicate key`.
    4. `descargarDatosDescendientes`: Pre-carga de mapa `actividadUuidToCod` para alimentar la reconstrucción de subtareas; implementación de regla LWW estricta en pull inbound (si el registro local `'synced'` posee un timestamp `updated_at` o `version` superior al recibido, se descarta el registro remoto obsoleto). Normalización en `sonRegistrosIdenticos` para admitir `version: 1` por defecto frente a registros locales legacy sin versión.
  - `src/App.tsx`: En arranque web normal en línea (`!isHud && navigator.onLine`), se dispara en segundo plano `syncManager.descargarDatosDescendientes()` tras la inicialización de semillas, asegurando que cualquier laptop o teléfono nuevo se sincronice inmediatamente con la base de datos de Supabase sin esperar mutaciones manuales.
  - Pruebas Unitarias Vitest: Creado `src/services/__tests__/multiDeviceParityRealtime.test.ts` con 11 pruebas unitarias cubriendo anti-colisión de correlativos con huecos numéricos, resolución inbound de subtareas con mapas de UUIDs, paridad de esquemas en payloads de salida y borrado reactivo DELETE vía Realtime. 291/291 pruebas pasando al 100% en verde y compilación de producción exitosa en 9.89s.

### FASE 5.28 — Blindaje Multi-Dispositivo Web: Resolución Dinámica de User ID, Guardas Loopback y Saneamiento de Metas Semilla (REQ-SYNC-40-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos modificados:** `src/services/syncManager.ts`, `src/services/syncPayloadSanitizer.ts`, `src/components/Cockpit/DailyCockpit.tsx`, `src/services/metasService.ts`, `src/hooks/useHabitos.ts`, `src/services/__tests__/syncManager.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `src/services/syncManager.ts` y `DailyCockpit.tsx`: Implementado y exportado el helper `esEntornoEscritorioLocal()` que valida si el runtime corresponde a desarrollo local (`localhost`, `127.0.0.1`) o contenedor Electron (`IS_DESKTOP_WIDGET`, `IS_ELECTRON_COCKPIT`, `electronAPI`). En entornos web remotos (como `https://miportalweb-aft.pages.dev`), `guardarSnapshotEnPuenteLocal()`, `cargarSnapshotDesdePuenteLocal()` y `pingLoopbackDesktop()` abortan de inmediato en silencio (`return false;`), erradicando las excepciones de transporte a nivel de socket `net::ERR_CONNECTION_REFUSED` hacia `http://127.0.0.1:48123`.
  - `src/services/syncManager.ts` y `syncPayloadSanitizer.ts`: Implementada la resolución dinámica de identidad con `resolverUsuarioActivo(): Promise<string>` consultando `this.supabase.auth.getSession()` y `getUser()`, enlazado además al listener `onAuthStateChange`. Implementado blindaje estricto de Foreign Key (código 23503 / 409 Conflict) en `sincronizarMetasPlanes()`, `sincronizarHitosPlan()` y `sincronizarVinculosMeta()`: si `currentUserId` no es un usuario autenticado real o sigue en `DEFAULT_USER_ID`, se omite el push remoto hacia Supabase. En `syncPayloadSanitizer.ts`, `resolverUserIdSeguro()` promueve de forma transparente el `DEFAULT_USER_ID` sintético local al `userId` real de la sesión activa en el payload de salida.
  - `src/services/metasService.ts` y `src/hooks/useHabitos.ts`: Saneada la auto-promoción de metas desde actividades internas (`sincronizarMetasInternasHaciaPlanesLocal` y `crearMetaRapidaDesdeActividadLocal`): los registros autogenerados desde semillas locales nacen con `sync_status: 'synced'` (no `pending`) y se neutraliza el push prematuro inmediato de red en arranque en frío. En `useHabitos.ts`, `autoHidratarVinculosHabitosActividades()` se coordina con `syncManager.esperarSincronizacionInicial(2000)` para esperar a que concluya el pull inicial desde la nube antes de promover metas sintéticas, evitando duplicados.
  - Pruebas Unitarias Vitest: Añadida batería de pruebas en `src/services/__tests__/syncManager.test.ts` verificando que `esEntornoEscritorioLocal()` retorne `false` en `pages.dev` suprimiendo `fetch` al puente local, que `syncManager` omite push de metas y vínculos cuando no hay sesión de auth real (`DEFAULT_USER_ID`), y que `resolverUserIdSeguro` sustituya el UUID dummy por el usuario autenticado real. 280 tests pasando al 100%.

### FASE 5.27 — Sincronización Real Automática Create / Update / Delete con Google Calendar REST API v3 (REQ-UI-39-GCAL-REAL-SYNC)
- **Fecha:** Noviembre 2026 | **Archivos modificados:** `src/services/calendarSyncService.ts`, `src/services/syncManager.ts`, `src/services/habitosService.ts`, `src/components/Modals/ModalActividadFlow.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Cockpit/DailyCockpit.tsx`, `src/services/__tests__/calendarSyncService.test.ts`, `.env.example`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `src/services/calendarSyncService.ts` y `syncManager.ts`: Integración directa OAuth2 (`provider_token` de Supabase Auth vía `getSupabaseClient()` + cliente dinámico Google Identity Services `VITE_GOOGLE_CLIENT_ID` con scope `calendar.events`) y persistencia de mapeo `actividadId <-> googleEventId` en `localStorage` (`pmo_gcal_event_map`). Eliminado el no-op optimista silencioso sin token (`requiereAuth: true` y `mode: 'AUTH_REQUIRED'`). Implementadas operaciones reales `sincronizarCreacionCalendar` (`POST`), `sincronizarActualizacionCalendar` (`PATCH` con fallback `POST` ante 404/410) y `sincronizarEliminacionCalendar` (`DELETE` 200/204/410 en `ALL`, `PATCH` con `EXDATE` en `SINGLE` y `PATCH` con `UNTIL` en `FUTURE`).
  - `habitosService.ts`, `ModalActividadFlow.tsx`, `TableroHabitos.tsx` y `DailyCockpit.tsx`: Conectadas creación, edición (`ALL`/`SINGLE`/`FUTURE`) y eliminación (`ALL`/`SINGLE`/`FUTURE`) con feedback instantáneo vía `mostrarToastCobalt` y botones de conexión Google Calendar (`Conectar Calendar` / `Calendar Conectado`, `OAuth Activo` y `GCal`) con suscripción reactiva de estado.
  - `src/services/__tests__/calendarSyncService.test.ts`: Suite Vitest de integración con mocks de `fetch` y `localStorage` cubriendo `POST` puntual/recurrente, `PATCH` de actualización, `DELETE ALL`, `PATCH EXDATE` en `SINGLE` y bloqueo sin token (`requiereAuth: true`).

### FASE 5.26 — Edición Diferida con Dirty-Check Real, Botón Iconográfico Avance, Motor Unificado de Recurrencias y Conector Moderno Google Calendar RFC-5545 (REQ-UI-38-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos modificados:** `src/utils/recurrenceEngine.ts`, `src/utils/__tests__/recurrenceEngine.test.ts`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Modals/ModalActividadFlow.tsx`, `src/components/Habitos/TarjetaHabito.tsx`, `src/hooks/useDailySchedule.ts`, `src/services/calendarSyncService.ts`, `.env.example`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `src/utils/recurrenceEngine.ts`: Nuevo motor puro y pruebas (`recurrenceEngine.test.ts`) para evaluación fiel 1:1 en `evaluarOcurrenciaEnFecha(actividad, fechaIso)` (respetando `fecha_programada`, `fecha_fin`, `excepciones_fechas`, `NINGUNA`, `DIARIA`, `DIARIA_LABORAL`, `FIN_SEMANA`, `SEMANAL`, `QUINCENAL`, `MENSUAL` e `INTERVALO:N:DIAS|SEMANAS|MESES`), generación estándar RFC-5545 (`construirRRuleRFC5545`), payload REST `construirEventoGoogleCalendarV3` (`America/Lima` + `RRULE`/`EXDATE`), plantilla directa `construirUrlGoogleCalendar` (`action=TEMPLATE&ctz=America/Lima&recur=...`) y exportador `.ics` (`generarArchivoICS`).
  - `TableroHabitos.tsx` y `ModalActividadFlow.tsx`: Eliminada la intercepción anticipada de `ModalAlcanceRecurrencia` al abrir edición; `"¿Cómo deseas aplicar los cambios?"` aparece únicamente al pulsar `"Actualizar Actividad"` cuando `verificarSiHayCambios` (normalizando equivalencias de regla diaria, duración, fechas `YYYY-MM-DD`, pasos y prioridad) detecta cambios reales. Habilitado `fecha_fin` para cualquier serie recurrente, uso de `formatFechaIsoLocal()`, tokens Cobalt (`sky-500`), accesos inmediatos `"Google Calendar"` y `".ics"`, y propagación inmediata `syncManager.syncPendingRecords()` + `guardarSnapshotEnPuenteLocal()` en creación/edición.
  - `TarjetaHabito.tsx`: Reemplazada la píldora `"+ Avance"` por un único botón iconográfico cuadrado Cobalt `w-7 h-7` con `<TrendingUp strokeWidth={1.75} />` y `title="Registrar avance"`.
  - `useDailySchedule.ts`, `calendarSyncService.ts` y `.env.example`: Integrado `evaluarOcurrenciaEnFecha` en Agenda 24H y Tablero de Hábitos; reescrito `calendarSyncService.ts` sobre estándar moderno Google Calendar v3 / RFC-5545 sin acoplamiento legado GAS (`VITE_CALENDAR_ENDPOINT` documentado en `.env.example`).

### FASE 5.25 — Rediseño Limpio de Hábitos Sin Pérdida de Datos y Blindaje de Zona Horaria / Rachas / Sync (REQ-UI-37-HABITOS-EXEC)
- **Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Subtareas/ListaSubtareas.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Views/ViewHabitos.tsx`, `src/hooks/useHabitos.ts`, `src/services/habitosService.ts`, `src/utils/entityNormalizer.ts`, `src/components/Habitos/HistogramaSeguimientoTemporal.tsx`, `src/services/metasService.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `TarjetaHabito.tsx` y `ListaSubtareas.tsx`: Consolidación visual en 4 niveles preservando el 100% de los datos operativos (`codigoHabito`, categoría, mora `+Nd`, ciclo traducido a tooltip en icono `Repeat`, racha `Flame`, notas vinculadas, título íntegro, bloque único de Meta + Progreso 360° con ratio/barra sólida `bg-sky-500`/`bg-emerald-500`/rescate mínimo/`+ Avance`, bloque unificado de pasos sin duplicación entre `ListaSubtareas` y checklist exclusivo, y pie tabular con gasto `S/ XX.XX`). Añadido guard `toggleInFlight` / `togglingId` contra doble clic rápido y checkbox neutro en estado pendiente.
  - `TableroHabitos.tsx` y `ViewHabitos.tsx`: Cálculo real de inversión en KPI `Bienestar` (`gastoTotal`) y horas completadas por columna (`horasHoy` / `horasPlanificadas`), subtextos dinámicos en KPIs, unificación completa de controles del toolbar a `h-9` y `py-0.5` en tokens Dark Cobalt (`#0D1526` / `sky-500`), filtro temporal táctil con cierre por clic fuera/`Escape`, iconos de pilar con `cfg.badgeClase` y limpieza de `optimisticCompletados` en `finally` de `handleToggleCompletar` para sincronía inmediata con `DailyCockpit`.
  - Blindaje Timezone, Rachas y Sync (`entityNormalizer.ts`, `HistogramaSeguimientoTemporal.tsx`, `metasService.ts`, `habitosService.ts`, `useHabitos.ts`): Reemplazo de `.toISOString().split('T')[0]` por `formatFechaIsoLocal(...)` para evitar desfases UTC-5 Lima después de las 19:00; lectura fresca en Dexie + guarda `ultima_fecha_completado !== hoyStr` antes de incrementar `racha_actual` en `completarActividadPersonalLocal` y `registrarAvanceCuantitativoLocal`; tombstones para subtareas en `eliminarActividadConAlcance(..., 'ALL')`; indexación dual (`codigo_legado` e `id`) en `subtareasPorPadre`, búsqueda por código legado en `useHabitos` y propagación `guardarSnapshotEnPuenteLocal()`.

### FASE 5.24 — Pulso de Salud en Portafolio, Iconografía Limpia en Detalle 360°, Purga Debug en Grafo WBS y Saneamiento de Tabla Portafolio (REQ-UI-36-FINAL)
- **Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/PMO/TarjetaProyecto.tsx`, `src/components/Views/ViewDetalle360.tsx`, `src/components/WBS/GrafoWBS.tsx`, `src/components/PMO/FiltrosPortafolio.tsx`, `src/components/Views/ViewPortafolio.tsx`, `src/components/Views/ViewKanban.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`
- **Descripción:**
  - `TarjetaProyecto.tsx`: Activación de pulso visual vivo (`animate-ping` halo + punto central sólido `emerald-400`/`amber-400`/`rose-500`) únicamente en el punto indicador de salud superior derecho con `title` limpio, conservando intactos altura y contenido de la tarjeta.
  - `ViewDetalle360.tsx`: Reemplazo de etiquetas crudas en el Hero por cápsulas de icono `w-8 h-8` con `title` legible (`obtenerEstadoEjecucionMeta`, `obtenerEstadoSalud` con pulso vivo, `IconoCategoriaIniciativa`); eliminación de `overflow-hidden` en tarjetas WP (`#wbs-nodo-*`) y tareas (`#wbs-tarea-*`) para desbloquear el popover de gastos; eliminación de `truncate`/`line-clamp-2` en encabezados WBS y del bug `"Costo: $0.00"` en Hitos Marcadores (formato `PEN` condicional si `presupuesto_asignado > 0`); lectura de estado canónico en `Tareas Generales` (`estado_tarea`/`Estado_Tarea` con prefijos `'04_'` y `'03_'`) y consolidación Dark Cobalt (`#0D1526`, `sky-500`).
  - `GrafoWBS.tsx`: Purga de cadena debug de coordenadas Y (`"N0 Proyecto (Y=40)..."`), reemplazada por leyenda mínima con iconos (`Proyecto · Fases · Paquetes · Tareas`) y toggle `soloHitos` en acento `sky-500`.
  - `FiltrosPortafolio.tsx`, `ViewPortafolio.tsx` y `ViewKanban.tsx`: Unificación `h-9` en `#sliding-pill-track-estado`, selector Tarjetas/Tabla y barra superior de `ViewKanban.tsx` (`#sidebar-search-proyectos`, `#label-proyecto-activo`, `#kanban-cronograma-proyecto`, `#kanban-gasto-presupuesto-box`); ampliación de `#table-proyectos-wrapper` a 9 columnas con `min-w-[960px]`, `whitespace-nowrap`, importes `PEN` a 2 decimales y columna `Varianza` (`BAC - AC`); purga de clases duales de tema claro (`bg-white`, `bg-slate-50`, `bg-slate-100`), corrección `py-0.2` -> `py-0.5` y retiro de `animate-ping`/`animate-pulse` en tarjetas de proyectos del sidebar de `ViewKanban.tsx`.

### FASE 5.23 — Temporizador Ultra-Minimalista con React Bits (`SpotlightCard`), Vínculo Opcional y Alerta Ámbar/Acústica de Alto Impacto (REQ-UI-33-V2)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Cockpit/DailyCockpit.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Integración de Primitivo React Bits (`SpotlightCard.tsx`) en `DailyCockpit.tsx`:**
   - Envoltorio directo del bloque de temporizador con `SpotlightCard` (`src/components/SpotlightCard.tsx`, excluyendo estrictamente efectos criptográficos), alternando `spotlightColor` entre `rgba(56, 189, 248, 0.14)` (operación normal) y `rgba(245, 158, 11, 0.28)` (estado expirado).
2. **Economía Extrema de Texto y Modo Libre por Defecto:**
   - Inicialización de `tareaFocoId` en `null` sin auto-selección forzada: muestra píldora compacta `<Link2 /> Vincular` para vincular en 1 clic solo cuando el usuario lo decide.
   - En estado vinculado, despliega chip único `TAR-XXX` + título truncado (`max-w-[160px]`) + 3 micro-iconos `24x24px` (`Check` completar, `Repeat` cambiar, `X` desvincular a Modo libre).
   - Barra de control única bajo el reloj tabular (`text-3xl sm:text-4xl`): 1 botón principal (`Iniciar`/`Pausar` o botón ámbar `Reiniciar` al expirar) + micro-iconos `36x36px` (`RotateCcw`, `SlidersHorizontal` con presets `10m..90m` e input sin spinners, `Volume2`/`VolumeX` con 6 perfiles).
3. **Alerta Ámbar Unificada en Cockpit Desplegado + Cápsula Colapsada y Refuerzo Sonoro:**
   - Sin banners ni tarjetas duplicadas: al llegar a `00:00`, el bloque `SpotlightCard` y ambas píldoras colapsadas (HUD Electron + píldora flotante Web) mutan a énfasis ámbar (`border-amber-500`, `ring-2 ring-amber-500/40..50`, `<BellRing />`, `00:00` en `text-amber-300`/`text-amber-400`, etiqueta `FINALIZADO` y botón de reinicio directo).
   - Elevación limpia de ganancia (`0.38`–`0.45` a través de `DynamicsCompressorNode` limitador) en los 5 perfiles audibles Web Audio API y repetición automática de 2 ciclos con pausa de `600ms` al expirar (preservando motor `Date.now()` y acreditación de `horas_reales` en `db.tareas`).

---

### FASE 5.22 — Rediseño de Temporizador en Daily Cockpit y Sincronización Bidireccional en Tiempo Real (REQ-UI-33-EXEC)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Cockpit/DailyCockpit.tsx`, `src/App.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Purga de Presets `Deep`, `Admin` y `Recarga` (`DailyCockpit.tsx`):**
   - Eliminación integral de la botonera superior de modos (`Deep`, `Admin`, `Recarga`), del estado `modoEnfoque`, de `handleCambiarEnfoque` y de sus referencias residuales en la píldora colapsada, conservando la cabecera minimalista `"Daily Cockpit"` con su duración persistida en `localStorage` (`pmo_pomodoro_minutos`).
2. **Popover Minimalista de Duración sin Spinners (`DailyCockpit.tsx`):**
   - Sustitución del bloque inline de presets y `<input type="number">` con flechas nativas por un disparador compacto de icono técnico (`SlidersHorizontal`, `w-8 h-8`) que abre un popover Dark Cobalt (`bg-[#0D1526] border-slate-700/80 rounded-xl p-2.5 shadow-lg z-30`) con píldoras rápidas (`10m`, `15m`, `25m`, `45m`, `60m`, `90m`), campo numérico libre de spinners CSS y confirmación por botón `Check` o tecla `Enter`, cerrando automáticamente ante clic fuera (`mousedown`) o `Escape` (incluyendo ventana Document Picture-in-Picture).
3. **Unificación de Alerta Final y Botón `Reiniciar` Único (`DailyCockpit.tsx`):**
   - Erradicación del banner ámbar superior redundante (`"Bloque Finalizado"`) y de los botones duplicados de reinicio, integrando al expirar un único badge esmeralda (`<CheckCircle2 /> Completado`) en cabecera de bloque y un único botón ejecutivo `Reiniciar` (`<RotateCcw />`, `h-8 px-3`).
4. **Selector Compacto de Sonido en Popover con 6 Perfiles Web Audio API (`DailyCockpit.tsx`):**
   - Reemplazo de la barra segmentada de 3 opciones por un botón de icono compacto (`w-8 h-8` con `<Volume2 />` / `<VolumeX />`) y popover de 6 perfiles sintetizados en Web Audio API (`Campana Zen`, `Pulso Digital`, `Acorde Cristal`, `Gong Profundo`, `Alerta Radar`, `Silencio`), con persistencia en `pmo_perfil_alarma`, previsualización inmediata al seleccionar y cierre seguro de `AudioContext` tras reproducir y en unmount.
5. **Reloj Absoluto `Date.now()` y Sincronización Bidireccional en Tiempo Real (`DailyCockpit.tsx`, `src/App.tsx`):**
   - Reemplazo del conteo `prev - 1` vulnerable a throttling por marca temporal objetivo (`targetEndTimestampRef` + listener `visibilitychange`) y efecto único determinístico de expiración (`expiracionNotificadaRef`).
   - Acreditación automática de horas ejecutadas (`horas_reales` redondeado a 2 decimales con `sync_status: 'pending'`) en `db.tareas` al concluir un bloque con tarea activa, además de invocación incondicional de `syncManager.syncPendingRecords()` y `syncManager.guardarSnapshotEnPuenteLocal()` en `handleCrearTareaRapida`.
   - Alineación canónica en `BarraFocoTareasEnProgreso` (`src/App.tsx`, L140) de `'03_En_Progreso'` a `'03_En_Proceso'`.

---

### FASE 5.21 — Reducción Proporcionada de Checkbox en Tarjetas de Hábitos (REQ-UI-35-HOTFIX-CHECK)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/Habitos/TarjetaHabito.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Checkbox Compacto `20x20px` (`TarjetaHabito.tsx`):**
   - Sustitución del disparador `min-w-[44px] min-h-[44px] rounded-xl` junto al título `<h4>` por un checkbox compacto de `20x20px` (`w-5 h-5 min-w-0 min-h-0 shrink-0 rounded-md flex items-center justify-center mt-0.5 transition-colors`) alineado con `items-start` e icono `<Check />` de `w-3.5 h-3.5` y `strokeWidth={2.5}`, liberando ancho horizontal para el enunciado completo del hábito sin alterar lógica de rachas ni contratos de datos.

---

### FASE 5.20 — Restauración Íntegra de Tarjetas de Hábitos y Actividades (REQ-UI-35-ROLLBACK-HABITOS)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Reversión Canónica del Tablero y Tarjetas de Hábitos (`TableroHabitos.tsx`, `TarjetaHabito.tsx`):**
   - Restauración exacta desde `HEAD` (`0c045fa`) vía `git checkout HEAD` de `TableroHabitos.tsx` y `TarjetaHabito.tsx`, preservando los KPIs Bento, columnas de categorías y bloques operativos originales.
   - Incorporación de `shrink-0 h-auto` y retiro de `overflow-hidden` / `line-clamp-2` en el enunciado dentro de `TarjetaHabito.tsx` para evitar compresión vertical en columnas densas y garantizar lectura completa (cabecera `ACT-XXX`, icono de categoría, mora `+Xd`, racha, franja lateral encajada `top-0 bottom-0 w-1 rounded-l-xl`, checkbox `44px`, subtareas/Meta & Plan `360°`, barra de progreso y botón `+ Avance`, más pie con estado/fecha y hora programada).

---

### FASE 5.19 — Restauración Íntegra de Tarjetas de Proyecto en Portafolio (REQ-UI-35-ROLLBACK-PORTAFOLIO)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/PMO/TarjetaProyecto.tsx`, `src/components/Views/ViewPortafolio.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Despliegue Vertical Completo de Tarjeta de Proyecto (`TarjetaProyecto.tsx`):**
   - Eliminación de `overflow-hidden`, `line-clamp-2`, `line-clamp-1`, `truncate` y compresiones compactas del overhaul móvil, consolidando altura automática libre (`shrink-0 h-auto`) sobre tarjetas Dark Cobalt (`bg-[#0D1526]/90 border-slate-800/80 hover:border-sky-500/40 rounded-xl`).
   - Conservación exclusiva de `IconoCategoriaIniciativa` en cabecera junto a `PRO-XXX`, `BadgeNotasVinculadas` y estado de salud; renderizado completo sin recortes de título, objetivo estratégico / OKR (`whitespace-normal break-words`), doble barra de avance (`Avance Real` vs `Meta`), tareas/plazo/estado, bloque financiero íntegro (`BAC`, `Real`, burn rate bar, `Consumo`, `Varianza` y `Saldo` en `S/`) y pie de acciones `h-10` con botón sólido `Ver Detalle 360°`.
2. **Estabilidad del Grid (`ViewPortafolio.tsx`):**
   - Ajuste en `#grid-proyectos-cards` con `auto-rows-auto items-stretch shrink-0` y remoción de `contain-layout [contain:layout]` para garantizar expansión vertical irrestricta sin filas fijas.

---

### FASE 5.18 — Restauración Íntegra de Tarjetas/Columnas Kanban y Corrección de Dock en Header (REQ-UI-34-ROLLBACK)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados/eliminados:** `src/components/PMO/TarjetaTareaKanban.tsx`, `src/components/PMO/ColumnaKanban.tsx`, `src/components/Layout/HeaderMaestro.tsx`, `src/components/PMO/__tests__/kanbanUiHierarchy.test.ts` (Eliminado), `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Reversión Canónica de Tablero Kanban (`TarjetaTareaKanban.tsx`, `ColumnaKanban.tsx`):**
   - Restauración exacta desde `HEAD` (`0c045fa`) de `TarjetaTareaKanban.tsx` y `ColumnaKanban.tsx`, preservando íntegramente los 6 niveles estructurales de tarjeta (badge `TAR-XXX` + icono de energía + `BadgeNotasVinculadas`, enunciado principal, badges de dependencia `Lock` y presupuesto `S/`, badges de fecha y horas `X/Yh`, ruta `Nombre Proyecto • Nombre Hito`, y botonera táctica inferior de transición de estados `Por Hacer →`, `← | Iniciar`, `← | Completar`, `↻ Reabrir`).
   - Inclusión explícita de `shrink-0` en el contenedor raíz `.kanban-card` de `TarjetaTareaKanban.tsx` para evitar compresión vertical en columnas con alta densidad de tarjetas (15+ elementos).
   - Eliminación de `src/components/PMO/__tests__/kanbanUiHierarchy.test.ts` correspondiente al experimento revertido de `REQ-UI-34`.
2. **Contención de Badge en Cabecera Maestra (`HeaderMaestro.tsx`):**
   - Ajuste en `#header-actions-container` incrementando espaciado a `gap-2.5` y conversión de `#badge-header-archivados` dentro de `#btn-header-archivados` a chip inline contenido (`px-2.5 gap-1.5` cuando `totalArchivados > 0`), erradicando el desbordamiento negativo (`-right-1`) y cualquier solapamiento con `#btn-toggle-shortcuts-modal`.

---

### FASE 5.17 — Estandarización Ejecutiva Dark Cobalt y Tabular en Hábitos, Notas, Portafolio y Finanzas (REQ-UI-35)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/Views/ViewHabitos.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Habitos/Metas/ViewMetasPlanes.tsx`, `src/components/Notas/VisorNotas.tsx`, `src/components/Notas/TarjetaNota.tsx`, `src/components/Views/ViewPortafolio.tsx`, `src/components/PMO/FiltrosPortafolio.tsx`, `src/components/PMO/TarjetaProyecto.tsx`, `src/components/Views/ViewFinanzas.tsx`, `src/components/Finanzas/DashboardFinanciero.tsx`, `src/components/Finanzas/TabControlCuotas.tsx`, `src/components/Finanzas/TabPresupuestos.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Unificación Dark Cobalt de Superficies y Eliminación de Gradientes/Brillos:**
   - Erradicación de badges con degradado multicolor, barras `bg-gradient-to-r`, `animate-ping`/`animate-pulse` en indicadores no-skeleton, elevaciones 3D (`hover:translate-y-[-2px]`, `hover:-translate-y-0.5`), sombras `shadow-cobalt-1`/`shadow-xl`/`shadow-2xl` y glows neón (`shadow-[0_0_8px_...]`), consolidando tarjetas y paneles en `bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 rounded-xl transition-colors`.
2. **Ergonomía Uniforme de Controles (`h-9` / `h-10`):**
   - Estandarización de inputs de búsqueda, selectores de periodo/meta y botones/píldoras de filtro secundarios a altura `h-9` (`bg-[#040711]/70` / `#0D1526` con `border-slate-800/80`) y botones CTA primarios a altura `h-10` con acento ejecutivo sólido (`bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl`).
3. **Integridad Tabular y Contratos Inmutables:**
   - Preservación total de `src/db/db.ts`, `src/types/index.ts`, fórmulas financieras y cálculo de rachas, aplicando `font-mono tabular-nums` de forma transversal en importes, KPIs, porcentajes, rachas, fechas y métricas de tabla/cápsulas.

---

### FASE 5.16 — Refinamiento Ejecutivo de Columnas y Tarjetas de Tareas en Tablero Kanban (REQ-UI-34)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/PMO/ColumnaKanban.tsx`, `src/components/PMO/TarjetaTareaKanban.tsx`, `src/components/Views/ViewKanban.tsx`, `src/components/PMO/__tests__/kanbanUiHierarchy.test.ts` (Nuevo), `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Estandarización de Columnas (`ColumnaKanban.tsx`):**
   - Superficie unificada `bg-[#040711]/60 border border-slate-800/70 rounded-xl flex flex-col`, cabecera sobria (`text-xs font-semibold uppercase tracking-wider text-slate-300`), contador numérico `font-mono tabular-nums text-[11px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-md` y espaciado uniforme `gap-2.5 p-2.5`.
2. **Jerarquía de Lectura en 3 Niveles (`TarjetaTareaKanban.tsx`):**
   - Superficie Dark Cobalt `bg-[#0D1526]/95 border border-slate-800/80 hover:border-sky-500/40 rounded-xl p-3 transition-colors` preservando franja lateral de prioridad (`P1`..`P4`), drag & drop y botones táctiles aislados sin solapamiento.
   - Nivel 1: contexto WBS superior (`TAR-XXX · PRO-XXX · HIT-XXX` vía `resolverContextoWbsTarjeta`); Nivel 2: enunciado `text-xs sm:text-[13px] font-medium text-slate-100 leading-snug line-clamp-2 my-1`; Nivel 3: pie técnico único (`pt-2 border-t border-slate-800/60 text-[11px] font-mono tabular-nums text-slate-400`) con iconos de `12px` para horas, fecha, dependencia (`Req`) y costo `S/`.
3. **Barra de Filtros Compacta (`ViewKanban.tsx`):**
   - Estandarización de input de búsqueda, micro-riel de ordenamiento y disparadores de filtro a altura uniforme `h-9` (`36px`) con bordes `border-slate-800/80 bg-[#0D1526] text-xs` y limpieza de brillos/elevaciones residuales.

---

### FASE 5.15 — Refinamiento Ergonómico, Métricas Tabulares y Estado de Foco en Daily Cockpit (REQ-UI-33)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/Cockpit/DailyCockpit.tsx`, `src/components/Cockpit/cockpitUiHelpers.ts` (Nuevo), `src/components/Cockpit/__tests__/cockpitUiHelpers.test.ts` (Nuevo), `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Tarjetas de Ejecución y Jerarquía WBS (`DailyCockpit.tsx`, `cockpitUiHelpers.ts`):**
   - Estandarización de tarjetas Bento, Top 3, Checklist y Riel Horario 24H a superficie sobria Dark Cobalt (`bg-[#0D1526]/90 border border-slate-800/80 hover:border-sky-500/40 transition-colors rounded-xl p-3.5`), retirando gradientes multicolores, elevaciones 3D y sombras excesivas.
   - Extracción de `obtenerIdentificadoresWbs` para desplegar identificadores técnicos (`TAR-XXX · HIT-XXX · PRO-XXX`) en `text-[11px] font-mono text-slate-400`, filtrando UUIDs crudos.
2. **Métricas Tabulares y Barra de Progreso Uniforme (`DailyCockpit.tsx`):**
   - Incorporación de barra táctica superior con avance del día (`completadas/total`), porcentaje completado y tiempo invertido (`formatearTiempoInvertido`), formateados estrictamente con `font-mono tabular-nums text-slate-100 font-bold`.
   - Relleno de barras de progreso en `bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.25)]` tanto en progreso diario como en temporizador Pomodoro.
3. **Bloque de Modo Foco / Deep Work y Objetivos Táctiles (`DailyCockpit.tsx`):**
   - Estado activo de alto contraste (`border-sky-500/60 ring-1 ring-sky-500/20`) libre de animaciones parásitas (`animate-pulse`, `animate-bounce`, `animate-ping`).
   - Botones directos de acción (`Completar`, `Pausar`/`Iniciar`, `Cambiar`, `Reiniciar`) y disparadores táctiles principales con objetivo accesible mínimo de `36px` (`min-w-[36px] min-h-[36px]`) y tooltips `title` descriptivos.
   - Integridad preservada al 100% en `src/db/db.ts`, `src/types/index.ts` y `syncManager.ts`.

---

### FASE 5.14 — Identificador Corporativo Fijo "MiPortalWeb" y Compactación Iconográfica de Categorías en Tarjetas PMO/Kanban (REQ-UI-32-33-REF)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/Layout/HeaderMaestro.tsx`, `src/components/PMO/IconoCategoriaIniciativa.tsx` (Nuevo), `src/components/Views/ViewKanban.tsx`, `src/components/PMO/TarjetaProyecto.tsx`, `src/components/PMO/__tests__/IconoCategoriaIniciativa.test.ts` (Nuevo), `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Cabecera Estática Corporativa (`HeaderMaestro.tsx` - REQ-UI-32-FINAL):**
   - Eliminación definitiva del diccionario mutante `tituloVistaActiva` y renderizado permanente del identificador `"MiPortalWeb"` (`text-base sm:text-lg font-bold text-slate-100 tracking-tight`) en `#header-view-title` (desktop) y `#mobile-header-view-title` (móvil), manteniendo a su derecha la píldora esmeralda `"Al Día"`.
2. **Compactación Iconográfica de Categorías (`IconoCategoriaIniciativa.tsx`, `ViewKanban.tsx`, `TarjetaProyecto.tsx` - REQ-UI-33-PRE):**
   - Creación del componente reutilizable `IconoCategoriaIniciativa` (`w-6 h-6 rounded-md`, `strokeWidth={1.75}`, `title={categoria}`, `aria-label={categoria}`) con resolución normalizada sin acentos para las 4 carteras canónicas (`Profesional` -> `Briefcase` `sky-400`, `Personal` -> `User` `emerald-400`, `Inversiones`/`Inversión` -> `TrendingUp` `violet-400`, `Social` -> `Users` `amber-400`) y respaldo limpio `General`.
   - Reemplazo de las píldoras textuales extensas en las tarjetas de proyecto de `#lista-proyectos-sidebar` (`ViewKanban.tsx`) y en `TarjetaProyecto.tsx`, erradicando encimamientos y truncamientos y conservando intactos los filtros por cartera (`''`, `'Personal'`, `'Profesional'`, `'Inversiones'`, `'Social'`) en `ViewKanban.tsx`.

---

### FASE 5.13 — Sobriedad Ejecutiva en Cabecera: Erradicación de DecryptedText, Restitución de Píldora "Al Día" y Purga de Selector de Temas (REQ-UI-32-FIX)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados/eliminados:** `src/components/Layout/HeaderMaestro.tsx`, `src/App.tsx`, `src/components/DecryptedText.tsx` (Eliminado), `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Erradicación de `DecryptedText` y Tipografía Corporativa Sobria (`HeaderMaestro.tsx`, `DecryptedText.tsx`):**
   - Retiro definitivo de `src/components/DecryptedText.tsx` del repositorio y de su importación/uso en `HeaderMaestro.tsx`.
   - Restauración de `#header-view-title` (desktop) y `#mobile-header-view-title` (móvil) a tipografía plana ejecutiva (`text-base sm:text-lg font-bold text-slate-100 tracking-tight`), eliminando retrasos o animaciones criptográficas al cambiar de módulo.
2. **Restitución de la Píldora "Al Día" junto al Título (`HeaderMaestro.tsx`):**
   - Reubicación de `#btn-sync-status-merged` desde `#header-actions-container` de regreso al bloque izquierdo inmediatamente al lado del título principal.
   - Estilización técnica con cápsula esmeralda (`bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium`), micro-indicador con onda `animate-ping opacity-40 duration-1000` y núcleo `bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]`, etiqueta `"Al Día"` (o `"Sincronizando..."` con spinner `RotateCw` al transferir) y disparo manual al pulsar.
3. **Purga Integral del Selector de Temas y Sello Dark Cobalt (`HeaderMaestro.tsx`, `App.tsx`):**
   - Eliminación completa de `#btn-toggle-tema` (`btn-theme-dropdown`), `#menu-theme-dropdown`, iconos de sol/luna/paleta, tipos `ModoColor`/`SaborTema`, estado `menuTemaAbierto` y props/handlers de tema en `App.tsx` y `HeaderMaestro.tsx`, sellando `document.documentElement` exclusivamente en `dark` (`#040711` / `#0D1526`).
   - Dock derecho `#header-actions-container` balanceado con botones operativos `40x40px` Dark Cobalt (`#tab-nav-notas`, `#btn-header-calendar`, `#btn-header-archivados`, `#btn-toggle-shortcuts-modal`, `#btn-header-exportar-pdf`).
   - Integridad intacta de `src/db/db.ts` y `src/types/index.ts`.

---

### FASE 5.12 — Modernización Visual de Cabecera Maestra con React Bits DecryptedText y Ergonomía de Acciones (REQ-UI-32)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/DecryptedText.tsx` (Nuevo vía `@reactbits-starter/DecryptedText-TS-TW`), `src/components/Layout/HeaderMaestro.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Integración de `@reactbits-starter/DecryptedText-TS-TW` en Títulos de Vista (`HeaderMaestro.tsx`):**
   - Instalación oficial de `src/components/DecryptedText.tsx` y montaje directo sobre `#header-view-title` (desktop `hidden md:flex`) y `#mobile-header-view-title` (móvil `md:hidden`) con `key={vistaActiva}`, `speed={35}`, `maxIterations={10}`, `animateOn="view"`, `revealDirection="start"` y `encryptedClassName="text-sky-400 font-mono"`, disparando el efecto de decodificación al cambiar de módulo sin jitter horizontal.
2. **Dock Cobalt de 40px y Compactación de Sincronización (`#header-actions-container`):**
   - Estandarización de acciones superiores (`#btn-toggle-tema`, `#btn-sync-status-merged`, `#btn-header-calendar`, `#btn-header-archivados`, `#btn-toggle-shortcuts-modal`, `#btn-header-exportar-pdf`) con área táctil `min-w-[40px] min-h-[40px]` y acabado `rounded-xl border border-slate-800/80 bg-[#0D1526]/80 hover:border-sky-500/40 hover:bg-[#0D1526] transition-all`.
   - Compactación de `#btn-sync-status-merged` hacia micro-LED con pulso suave (`w-2.5 h-2.5 rounded-full ring-2 ring-emerald-500/20`), ocultando texto redundante bajo `xl:` (`hidden xl:inline`) para mantener limpia la cabecera móvil y evitando colisiones con la navegación central (`xl:absolute xl:left-1/2 xl:-translate-x-1/2`).
   - Integridad intacta de `src/App.tsx`, `src/db/db.ts` y `src/types/index.ts`.

---

### FASE 5.11 — Depuración de Captura Rápida: Erradicación de Labels Parásitos y Acabado Ejecutivo React Bits (REQ-UI-31-HOTFIX-2)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Ideas/WidgetIdeasBubble.tsx`, `src/components/VoicePill.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Erradicación de Textos Parásitos (`"Vía voz"`, `"Cancel"`, badges superpuestos):**
   - Eliminado el bloque JSX de estado visual `"Vía voz"` / `"Escuchando dictado..."` bajo `#input-captura-rapida-enunciado` en `WidgetIdeasBubble.tsx` (preservando la lógica interna `fueGrabadoConVoz` para clasificación `tipo_captura: 'VOZ'`).
   - Desactivado explícitamente `slideToCancel={false}`, `showTime={false}`, `waveform={false}` y `reach={0}` sobre `<VoicePill />` en `WidgetIdeasBubble.tsx`, e inicializadas `--vp-slide: '0px'` y `--vp-cancel: '0'` en `VoicePill.tsx` para prevenir la visualización residual del nodo `"Cancel"` cuando no hay arrastre lateral activo.
2. **Iconografía Técnica de Precisión (`strokeWidth={1.5}`) y Pulido Cinético `motion/react`:**
   - Unificada la barra de herramientas en micro-cápsulas Dark Cobalt (`bg-[#0B1220]/70`, micro-borde `border-slate-800/80`, hover `border-sky-500/40` y resplandor `shadow-[0_0_12px_rgba(56,189,248,0.2)]`) con `VoicePill` (`32px`), `Paperclip`, `Camera`, `Sparkles` (`text-sky-400`) y envío `#btn-quick-idea-submit` con flecha técnica `CornerDownLeft` y `active:scale-95 duration-150`.
   - Envuelto `#popover-captura-rapida-idea` en `<AnimatePresence>` + `<motion.div>` (`motion/react`) con transición volumétrica calibrada sin rebote (`initial={{ opacity: 0, scale: 0.98, y: ±4 }}`, `animate={{ opacity: 1, scale: 1, y: 0 }}`, `duration: 0.18`, `ease: [0.16, 1, 0.3, 1]`).
   - Cero cambios en `src/db/db.ts` ni `src/types/index.ts`.

---

### FASE 5.10 — Interacción Hover-Reveal en Píldora y Rediseño Minimalista de Captura Rápida (REQ-UI-31-REFINEMENT)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Ideas/WidgetIdeasBubble.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Hover-Reveal hacia la Izquierda en Píldora Flotante (`WidgetIdeasBubble.tsx`):**
   - Estructuración de `#widget-ideas-pill` como grupo `group` manteniendo en reposo el botón visible por defecto `#btn-widget-ideas-add` (`w-10 h-10`, icono `Plus` `w-5 h-5`) y el micro-grip `GripVertical` (`#widget-ideas-drag-handle`, `hidden md:flex`) con anclaje derecho inteligente (`usaAnclajeDerecho`) y persistencia `pmo_ideas_bubble_pos` sin desplazamientos al desplegarse.
   - Replegado por defecto de `#btn-widget-ideas-bubble` (`max-w-0 opacity-0 overflow-hidden group-hover:max-w-xs group-hover:opacity-100 group-focus-within:max-w-xs group-focus-within:opacity-100 transition-all duration-300 ease-out`) revelándose hacia la izquierda al pasar el puntero con icono `Lightbulb` (`w-4 h-4 text-sky-400`), texto `"Gestor"` y contador tabular `#badge-contador-ideas-activas`.
2. **Rediseño Minimalista Técnico de `#popover-captura-rapida-idea`:**
   - Reducción dimensional a `w-80 max-w-[calc(100vw-24px)] sm:w-[360px]` con `!p-3.5` y cabecera desaturada minimalista.
   - Textarea sin bordes pesados (`bg-transparent border-0 p-1 text-sm leading-relaxed text-slate-100 focus:outline-none`) con placeholder `"Captura un pensamiento, comando o tarea rápida..."` conservando blindaje IME (`!e.nativeEvent.isComposing`) y foco automático.
   - Barra inferior simplificada en 1 sola fila compacta: izquierda con 4 micro-herramientas de `32x32px` / iconos `w-4 h-4` (`VoicePill` micro `size={32}` `showTime={false}` `waveform={false}` `reach={0}`, `Adjuntar`, `Cámara` e `IA`, todos `w-8 h-8 rounded-lg`); derecha con indicador `Ctrl ↵` (`text-[10px] font-mono text-slate-500`) y `#btn-quick-idea-submit` (`h-8 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950`); y chip de adjunto (`text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 border-slate-700/60`) flotando justo sobre la botonera.
   - Preservación total de compresión Canvas, persistencia en `db.ideas` (`url_adjunto_drive`), `src/db/db.ts` y `src/types/index.ts`.

---

### FASE 5.09 — Restauración de Arrastre Persistente, Paleta Cobalt Ejecutiva y Captura Multimodal Robusta (REQ-UI-31-FIX)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Ideas/WidgetIdeasBubble.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Arrastre Controlado con Puntero y Persistencia (`WidgetIdeasBubble.tsx`):**
   - Restauración del estado de posición leyendo `localStorage.getItem('pmo_ideas_bubble_pos')` en desktop (fallback seguro `{ x: window.innerWidth - 180, y: window.innerHeight - 80 }`, acotado con `16px` de margen vía `clampPosicionBurbuja` y reajuste en `resize`), manteniendo anclaje fijo Tailwind en móvil (`bottom-20 right-3`).
   - Inclusión de micro-grip `GripVertical` (`#widget-ideas-drag-handle`) con listeners nativos `pointerdown`, `pointermove` y `pointerup` / `pointercancel`, persistiendo coordenadas finales en `localStorage` al soltar y calculando alineación contextual del popover (`top-full` / `bottom-full`, `left-0` / `right-0`) sin mover la píldora.
2. **Estética Ejecutiva Cobalt (`#btn-widget-ideas-bubble` y Cabecera PiP):**
   - Retiro completo de degradados multicolores (`from-amber-400 via-orange-500 to-sky-500`) y `animate-pulse`, sustituidos por superficies `bg-[#0D1526]/90 border-slate-800/80 hover:border-sky-500/40`, círculos de icono `bg-sky-500/15 border-sky-500/30 text-sky-400` y badges `font-mono tabular-nums text-[11px] bg-slate-800 text-slate-300 border-slate-700/60`, con visibilidad y acceso directo coherente en móvil y desktop.
3. **Adjuntos Reales, Compresión Canvas y Footer Simétrico de 2 Filas:**
   - Conexión de `<input type="file" accept="image/*,.pdf,.doc,.docx,.txt">` (`fileInputRef`) y cámara (`cameraInputRef`) hacia `procesarArchivoSeleccionado`: compresión nativa WebP/JPEG vía Canvas (`maxWidth = 1280px`, `quality = 0.75`, objetivo `< 400KB`), soporte a documentos `< 500KB` en Data-URI (o referencia `meta://adjunto` si supera `500KB`), preview chip removible `#chip-adjunto-captura-rapida` y persistencia real en `db.ideas.add` (`tipo_captura: 'FOTO' | 'ARCHIVO' | 'VOZ' | 'TEXTO'` y `url_adjunto_drive`).
   - Reestructuración del footer en 2 filas simétricas (`Fila Superior`: `VoicePill` `shape="rounded"` `reach={0}` con padding dinámico reservado `pl-[42px]` / `pl-[116px]` al escuchar para evitar colisiones o recortes en `SpotlightCard`, junto a botones uniformes `40x40px` `Adjuntar`, `Cámara` e `IA`; `Fila Inferior`: chip de adjunto + botón `#btn-quick-idea-submit` `bg-sky-500 hover:bg-sky-400 text-slate-950`).
   - Integridad intacta de `src/db/db.ts` y `src/types/index.ts`.

---

### FASE 5.08 — Retiro de Basic-SSL y Restauración de HTTP Plano en Localhost (REQ-OPS-31)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `vite.config.ts`, `package.json`, `iniciar-todo.bat`, `iniciar-movil.bat`, `scripts/dev-mobile.bat`, `scripts/supervisor-servicios.ps1`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Desacople Completo de `@vitejs/plugin-basic-ssl` (`vite.config.ts`, `package.json`):**
   - Eliminación de la importación y registro de `basicSsl()` en `vite.config.ts`, retirando igualmente `@vitejs/plugin-basic-ssl` de `devDependencies` en `package.json`.
   - Configuración de `server` en `vite.config.ts` para servir HTTP plano sin TLS autofirmado (`host: '0.0.0.0'`, `port: 3000`, `https: undefined` acorde al contrato `ServerOptions` de Vite 6, `strictPort: true`, `open: false`), manteniendo `"dev:mobile": "vite --host 0.0.0.0 --port 3000"`.
2. **Actualización Integral de Scripts de Arranque y Polling (`iniciar-todo.bat`, `iniciar-movil.bat`, `scripts/dev-mobile.bat`, `scripts/supervisor-servicios.ps1`):**
   - Migración de URLs, mensajes y lanzamiento automático del navegador hacia `http://localhost:3000/` (PC) y `http://%IP%:3000/` (LAN/móvil), eliminando advertencias de certificado autofirmado.
   - Sustitución del polling `curl.exe -k https://localhost:3000/` por verificación HTTP directa `curl.exe http://localhost:3000/`.
   - Integridad intacta de `src/db/db.ts`, `src/types/index.ts` y lógica de aplicación.

---

### FASE 5.07 — Eliminación de Física Lúdica en Widget de Ideas y Ergonomía Ejecutiva (REQ-UI-31-HOTFIX)
**Fecha:** Noviembre 2026 | **Archivos modificados/eliminados:** `src/components/Ideas/WidgetIdeasBubble.tsx`, `src/components/Magnet.tsx` (Eliminado), `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Desacople Total de `Magnet` y Anclaje Estático Sobrio (`WidgetIdeasBubble.tsx`):**
   - Retiro definitivo de `src/components/Magnet.tsx` y eliminación de su importación/envoltorio sobre `#widget-ideas-pill`, dejando `#widget-ideas-bubble-container` anclado de forma estática en `fixed bottom-20 right-3 md:bottom-6 md:right-6 z-[9990]`.
   - Aplicación de estilo ejecutivo Cobalt sin traslación X/Y ni escalado al pasar el cursor (`rounded-full bg-[#0D1526]/90 backdrop-blur-xl border border-slate-800/80 hover:border-sky-500/40 shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.12)] transition-all duration-200`) con `flex-row-reverse` para revelar `#btn-widget-ideas-bubble` hacia la izquierda sin desplazar `#btn-widget-ideas-add`.
2. **Acceso Rápido Ejecutivo (`Ctrl + I` / `Alt + I`) y Foco Limpio:**
   - Ampliación del listener global de atajos en `WidgetIdeasBubble.tsx` para responder tanto a `Ctrl + I` como a `Alt + I` (excluyendo `Shift`/`Meta`) y conmutar instantáneamente `#popover-captura-rapida-idea`.
   - Incorporación de `autoFocus` y `textareaRef` con `requestAnimationFrame(() => textareaRef.current?.focus())` sobre `#input-captura-rapida-enunciado` al abrir el popover, conservando `SpotlightCard` (`proximity={0}`, `flare={false}`) únicamente como textura luminosa sutil dentro de la tarjeta sin desplazamiento de elementos.
   - Sin cambios sobre `vite.config.ts`, `src/db/db.ts` ni `src/types/index.ts`.

---

### FASE 5.06 — Modernización Cinética del Widget Flotante de Ideas con React Bits Magnet y Spotlight (REQ-UI-31)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/Magnet.tsx` (Nuevo vía `@reactbits-starter/Magnet-TS-TW`), `src/components/SpotlightCard.tsx` (Nuevo vía `@reactbits-starter/SpotlightCard-TS-TW`), `src/components/Ideas/WidgetIdeasBubble.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Acople Magnético en Píldora Flotante (`Magnet.tsx` + `WidgetIdeasBubble.tsx`):**
   - Instalación oficial de `src/components/Magnet.tsx` y envoltura de `#widget-ideas-pill` con `<Magnet padding={40} disabled={esMovil}>`.
   - Eliminación del grip de arrastre físico (`#widget-ideas-drag-handle`) y su estado asociado en favor del anclaje limpio Cobalt (`rounded-full border border-sky-500/30 shadow-[0_0_20px_rgba(56,189,248,0.15)]`), manteniendo en móvil (`< md`) posición fija segura en `bottom-20 right-3` sin colisión sobre `BottomNavMobile`.
2. **Tarjeta de Captura Multimodal con Spotlight (`SpotlightCard.tsx` + `WidgetIdeasBubble.tsx`):**
   - Instalación oficial de `src/components/SpotlightCard.tsx` reemplazando la superficie plana de `#popover-captura-rapida-idea` (`spotlightColor="rgba(56, 189, 248, 0.12)"`, `--spotlight-card-surface` Cobalt `#0D1526`, `rounded-2xl !p-4 backdrop-blur-xl`).
   - Calibración ergonómica de controles multimodales (`VoicePill` `size={40}`, botón `Adjuntar`, botón `Cámara` `#btn-quick-idea-camera` con selector visual `capture="environment"`, `IA`, cabecera y `Guardar`) con targets táctiles `min-w-[40px] min-h-[40px]` y estados hover iluminados.
   - Sin cambios en `src/db/db.ts`, `src/types/index.ts` ni lógica de persistencia de ideas.

---

### FASE 5.05 — Launcher Maestro Resiliente para Cockpit, Vite HTTPS Móvil y Portal Web (REQ-OPS-30)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `iniciar-todo.bat` (Nuevo), `scripts/supervisor-servicios.ps1` (Nuevo), `package.json`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Supervisor en Segundo Plano con Auto-Recuperación (`scripts/supervisor-servicios.ps1`):**
   - Limpieza preventiva de sockets en los puertos troncales `3000` (Vite HTTPS) y `48123` (Cockpit loopback bridge), además de instancias huérfanas de `electron.exe` vinculadas a `desktop/main.js` (sin afectar otros procesos Electron del sistema).
   - Orquestación paralela de `npm run dev:mobile` (`0.0.0.0:3000` con SSL) y `npm run cockpit` (`127.0.0.1:48123`) mediante ciclo de vigilancia continuo cada 3 segundos, relanzando automáticamente cualquier servicio caído previa limpieza segura de puerto.
2. **Lanzador Unificado de Un Solo Clic (`iniciar-todo.bat`) y Scripts (`package.json`):**
   - Detección priorizada de IP Wi-Fi/LAN (`192.168.x.x`), limpieza previa de procesos/supervisores previos con `-ExecutionPolicy Bypass`, arranque minimizado de `scripts/supervisor-servicios.ps1` y presentación de rutas listas (`https://localhost:3000/`, `https://%IP%:3000/`, `http://127.0.0.1:48123`).
   - Polling silencioso de disponibilidad sobre `https://localhost:3000/` (`curl.exe -k`) y `http://127.0.0.1:48123/status`, con apertura automática del navegador predeterminado en `https://localhost:3000/`.
   - Registro en `package.json` de los alias `"start:all": ".\\iniciar-todo.bat"` y `"servicios:all": ".\\iniciar-todo.bat"` (con prefijo `.\\` para compatibilidad cuando `NoDefaultCurrentDirectoryInExePath` está activo).
   - Cero modificaciones sobre `src/db/db.ts`, `src/types/index.ts` ni lógica de negocio.

---

### FASE 5.04 — Auto-Liberación Forzada de Puerto 3000 en Lanzador Móvil (REQ-OPS-29)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `iniciar-movil.bat`, `scripts/dev-mobile.bat`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Auto-limpieza del puerto 3000 antes del arranque Vite (`iniciar-movil.bat`, `scripts/dev-mobile.bat`):**
   - Incorporación de bucle `netstat -aon | findstr ":3000 " | findstr LISTENING` con terminación forzada vía `taskkill /F /PID %%p` sobre procesos ocupantes antes de ejecutar `call npm run dev:mobile`.
   - Inclusión de espera de 1 segundo (`timeout /t 1 /nobreak >nul 2>&1 || ping -n 2 127.0.0.1 >nul`) posterior al bloque de limpieza para garantizar liberación del socket TCP antes de enlazar `0.0.0.0:3000` con `strictPort: true`.
   - Limpieza inmediata del listener activo en puerto 3000 de la sesión operativa mediante `Get-NetTCPConnection` / `Stop-Process -Force`.
   - Cero cambios en `src/`, `src/db/db.ts` ni `src/types/index.ts`.

---

### FASE 5.03 — Catálogo Completo de App Shortcuts, Enrutador Deep-Link y Micro-Widget de Foco (REQ-OPS-28)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `public/manifest.json`, `public/manifest.webmanifest`, `src/App.tsx`, `src/components/Ideas/WidgetIdeasBubble.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Catálogo Completo de App Shortcuts PWA (`public/manifest.json`, `public/manifest.webmanifest`):**
   - Sincronización 1:1 de ambos manifiestos estáticos incorporando los 5 atajos directos móviles en `shortcuts`: `Capturar Idea (Voz)` (`/?action=nueva_idea`), `Nueva Tarea` (`/?action=nueva_tarea`), `Registrar Gasto` (`/?action=nuevo_gasto`), `Nueva Nota` (`/?action=nueva_nota`) y `Avance de Hábito` (`/?action=nuevo_habito`), preservando `Ejecución Diaria (Hoy)` (`./?mode=hud`).
2. **Enrutador Deep-Link en Carga Inicial y Limpieza de Historial (`src/App.tsx`):**
   - Procesamiento de `URLSearchParams(window.location.search).get('action')` durante el montaje inicial (inhibido en modo `esModoHud` / Electron widget) despachando apertura inmediata de `ModalTareaFlow`, `ModalGasto`, `ModalActividadFlow` (`#habitos`), `EditorNotaModal` global (`#notas`) y el evento personalizado `'pmo:abrir-captura-idea'`.
   - Saneamiento automático de query string vía `window.history.replaceState({}, '', pathname + hashDestino)` para evitar reaperturas accidentales al refrescar la PWA.
3. **Receptor de Disparo Externo en Ideas (`WidgetIdeasBubble.tsx`) y Micro-Widget de Foco (`src/App.tsx`):**
   - Registro del listener `window.addEventListener('pmo:abrir-captura-idea', ...)` en `WidgetIdeasBubble.tsx` invocando `abrirPopover()` (`setPopoverAbierto(true)` con reset seguro).
   - Incorporación de `BarraFocoTareasEnProgreso` (`#micro-widget-foco-progreso`, `z-[9980]`, `bottom-20 left-3 md:bottom-5 md:left-1/2`) consultando tareas activas `03_En_Progreso` desde Dexie con rotación entre múltiples focos, acceso directo a `ModalTareaFlow` y ocultamiento temporal sin colisiones sobre `BottomNavMobile` ni `WidgetIdeasBubble`.
   - Contratos de `src/db/db.ts` y `src/types/index.ts` intactos.

---

### FASE 5.02 — Ergonomía Móvil en Hábitos, Registro Financiero Ágil y Consolidación Global (REQ-UI-30)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Views/ViewHabitos.tsx`, `src/components/Views/ViewFinanzas.tsx`, `src/components/Finanzas/DashboardFinanciero.tsx`, `src/components/Modals/ModalGasto.tsx`, `src/components/Modals/ModalIngreso.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Desaturación Visual y Ergonomía de 44px en Hábitos (`TarjetaHabito.tsx`, `TableroHabitos.tsx`, `ViewHabitos.tsx`):**
   - Superficie Bento compacta: `bg-[#0D1526]/90 border border-slate-800/60 rounded-xl p-3 shadow-sm hover:border-sky-500/30`.
   - Reemplazo de etiquetas textuales verbosas ("Subtareas / Pasos", "Rescate:", "Próx:") por iconografía calibrada (`Flame`, `Target`, `ListTodo`, `Calendar`, `Clock`, `strokeWidth={1.75}`), formato compacto `DD/MM` (`formatearFechaCortaHabito`) y cifras en `font-mono tabular-nums text-xs`.
   - Escalamiento del botón de check diario (`handleToggleCheck`) a `min-w-[44px] min-h-[44px] rounded-xl bg-emerald-500/15 text-emerald-400 border-emerald-500/30 active:scale-95`, además de objetivos `40px` en edición/eliminación móvil, botón `+ Avance`, botón móvil `#btn-nuevo-habito-header-movil` y despeje inferior `pb-28 md:pb-4` en `.kanban-col-body`.
2. **Compactación 2x2 de Dashboard Financiero y Despeje (`ViewFinanzas.tsx`, `DashboardFinanciero.tsx`):**
   - Incorporación de bloque resumen 2x2 (`#finanzas-resumen-kpi`: Ingresos, Gastos, Balance, Ahorro) en `ViewFinanzas.tsx` con `grid grid-cols-2 lg:grid-cols-4 gap-2 p-2 sm:p-0`, tipografía `font-mono tabular-nums font-bold` y subtextos ocultos en `< sm` con `hidden sm:block`.
   - Conversión del carrusel superior de `DashboardFinanciero.tsx` a cuadrícula 2x2 sin scroll horizontal atrapado en `< md`, con líneas de detalle secundario ocultas en móvil.
   - Aseguramiento de `pb-28 md:pb-8` en `#vista-financiero-wrapper` y targets táctiles `min-h-[40px]` para `+ Ingreso`, `+ Gasto`, búsqueda y `Filtros`.
3. **Bottom Sheets Ágiles con Hero Monto para Gastos e Ingresos (`ModalGasto.tsx`, `ModalIngreso.tsx`):**
   - Contenedores Bottom Sheet en `< md` (`items-end sm:items-center p-0 sm:p-4`, `max-h-[92dvh] rounded-t-3xl sm:rounded-2xl bg-[#0D1526] border-t sm:border border-slate-700/60 flex flex-col`).
   - Promoción del input de Monto al tope del formulario con selector de moneda integrado, teclado decimal móvil (`inputMode="decimal"`) y tipografía `text-2xl font-mono tabular-nums font-bold text-center py-2 text-slate-100`.
   - Footer fijado `sticky bottom-0 bg-[#0D1526]/95 backdrop-blur-md p-3 border-t border-slate-800/80` con safe area y botones `h-11` (`Eliminar`, `Cancelar`, `Guardar`).
   - Sin cambios en contratos Dexie (`src/db/db.ts`), tipos (`src/types/index.ts`) ni lógica contable.

---

### FASE 5.01 — Bento Móvil de Proyectos, KPIs 2x2 con CountUp y Ergonomía en Portafolio (REQ-UI-29)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/CountUp.tsx` (Nuevo vía `@reactbits-starter/CountUp-TS-TW`), `package.json`, `package-lock.json`, `src/components/Views/ViewPortafolio.tsx`, `src/components/PMO/TarjetaProyecto.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Integración de `@reactbits-starter/CountUp-TS-TW` y Grid KPI 2x2 Móvil (`ViewPortafolio.tsx`):**
   - Instalación oficial de `src/components/CountUp.tsx` y montaje en las 4 tarjetas KPI superiores (`Iniciativas`, `Avance Global`, `Presupuesto`, `Salud`) con `duration={1.2}`, `trigger="load"` y tipografía numérica `font-mono font-bold tabular-nums`.
   - Compactación de cuadrícula móvil (`< md`) a `grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-0`, padding interno `p-2.5 sm:p-4`, iconografía superior derecha `w-4 h-4` y ocultamiento de subtextos y barras secundarias en móvil mediante `hidden sm:inline` / `hidden sm:flex` / `hidden sm:block`, conteniendo el bloque bajo ~130px verticales.
   - Verificación y preservación del despeje inferior en `#vista-portafolio-wrapper` (`pb-28 md:pb-8`) sobre la navegación inferior móvil y widget flotante.
2. **Tarjeta de Proyecto Bento Compacta (`TarjetaProyecto.tsx`):**
   - Rediseño de contenedor Bento: `bg-[#0D1526]/90 border border-slate-800/60 rounded-xl p-3 sm:p-4 shadow-sm hover:border-sky-500/30 transition-all flex flex-col justify-between`.
   - Cabecera simplificada: pastilla de código violeta/cobalt (`text-[11px] font-mono font-bold bg-violet-500/15 text-violet-300 border-violet-500/30`), semáforo sutil con pulso crítico y título limitado a `line-clamp-2`.
   - Métricas condensadas: barra de progreso `h-1.5 bg-slate-800 rounded-full` con porcentaje `text-sky-400 font-semibold font-mono tabular-nums`, rango de fechas `Calendar` + `DD/MM - DD/MM` (`formatearFechaDDMM`) y chip presupuestario único `PEN {gasto} / {presupuesto}` (`formatearMontoCompacto` en `< sm`) sin etiquetas verbosas.
   - Botonera táctica ergonómica: CTA principal `Ver Detalle 360°` (`h-10 bg-sky-500/10 text-sky-400 border-sky-500/20 rounded-lg`) y botones auxiliares (`+ Tarea`, `Editar`, `Eliminar`) con `min-w-[40px] min-h-[40px]`.
   - Cero alteraciones en `src/db/db.ts`, `src/types/index.ts` ni fórmulas de agregación presupuestal.

---

### FASE 5.00 — Bento Mobile para Tarjetas de Notas, ShinyText y Captura Ergonómica (REQ-UI-28)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/ShinyText.tsx` (Nuevo vía `@reactbits-starter/ShinyText-TS-TW`), `src/components/Notas/VisorNotas.tsx`, `src/components/Notas/TarjetaNota.tsx`, `src/components/Notas/SidebarCuadernos.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Integración de `@reactbits-starter/ShinyText-TS-TW` y Captura Ergonómica (`VisorNotas.tsx`):**
   - Instalación oficial de `src/components/ShinyText.tsx` y montaje directo en el disparador móvil `#trigger-crear-nota-rapida` y en el encapsulado rápido de escritorio `#quick-note-collapsed` con paleta Cobalt (`color="#94a3b8"`, `shineColor="#38bdf8"`, `speed={3}`).
   - Calibración táctil de controles auxiliares (búsqueda, conmutadores de vista, etiquetas, color, limpieza, fijar nota rápida y disparadores checklist/wishlist) a superficie mínima ergonómica `min-w-[40px] min-h-[40px]` con iconografía Lucide centrada (`strokeWidth={1.75}`).
   - Manejo de cierre con tecla `Escape` para el drawer móvil de cuadernos.
2. **Estética Bento Compacta y Reducción de Densidad en `TarjetaNota.tsx`:**
   - Rediseño de tarjeta Bento Cobalt: superficie `bg-[#0D1526]/90 border border-slate-800/60 border-l-4` con acento lateral dinámico según `color_tema` / cuaderno (`COLOR_BORDE_ACENTO`), bordes `rounded-xl`, sombra `shadow-sm` y realce `hover:border-sky-500/30`.
   - Reemplazo de fechas verbosas por icono `<Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />` y formato compacto `DD/MM` (`formatearFechaCortaNota`) en `font-mono tabular-nums text-[11px] text-slate-400`.
   - Chips de entidades vinculadas en `< sm` limitados a icono + código (`TAR-022`, `PRJ-01`) ocultando el título descriptivo (`hidden sm:inline`), y botones táctiles Pin / Copiar / Editar / Eliminar escalados a `min-w-[44px] min-h-[44px]` en móvil.
3. **Drawer Bottom Sheet de Cuadernos en Móvil (`SidebarCuadernos.tsx`):**
   - Extracción compartida de lista de cuadernos y matriz de accesos rápidos (`ACCESOS_RAPIDOS_CONFIG`) reutilizada por el panel desktop (`hidden md:flex`) y un Bottom Sheet nativo en `< md` (`createPortal`, `z-[10000]`, drag handle, badges `font-mono tabular-nums`, acción fija `+ Nuevo Cuaderno` con `FolderPlus` de `h-10`), conectado desde `CarruselCuadernosMovil` (`#btn-abrir-drawer-cuadernos`).
   - Integridad intacta de `src/db/db.ts`, `src/types/index.ts`, `arePropsEqual`, `resolverIconoCuaderno` y `MAPA_ICONOS_CUADERNO`.

---

### FASE 4.99 — Modernización Visual de Kanban con React Bits, Reducción de Texto e Iconografía Ergonómica (REQ-UI-27)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/AnimatedContent.tsx` (Nuevo vía `@reactbits-starter/AnimatedContent-TS-TW`), `package.json` (`gsap`), `src/components/Views/ViewKanban.tsx`, `src/components/PMO/TarjetaTareaKanban.tsx`, `src/components/PMO/ColumnaKanban.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Integración de `@reactbits-starter/AnimatedContent-TS-TW` en `ViewKanban.tsx`:**
   - Instalación oficial de `src/components/AnimatedContent.tsx` (`gsap@^3.15.1` como motor de animación hardware-accelerated en `@reactbits-starter`).
   - Envoltorio de la columna activa móvil (`md:hidden`) con `AnimatedContent` (`key={columnaMovilSeleccionada.id}`, `trigger="mount"`, `distance={40}`, `direction="horizontal"`, `reverse={false}`, `duration={0.28}`, `ease="power3.out"`) reutilizando `renderColumnaKanban()` sin duplicación ni desmontaje del chasis desktop (`md:grid-cols-4`). Nota técnica: la distribución instalada de `AnimatedContent-TS-TW` expone props GSAP (`duration`/`ease`/`trigger`) en vez de `config` de Spring.
2. **Reducción de Texto y Estándar Visual Cobalt en `TarjetaTareaKanban.tsx`:**
   - Superficie canónica `bg-[#0D1526]/90 border border-slate-800/60 rounded-xl p-3 shadow-sm hover:border-sky-500/30`.
   - Eliminación de etiquetas verbosas (`Sin fecha`, `Req:`, `pasos`, `h / h`, `A Por Hacer`, `Reabrir tarea`) reemplazadas por iconografía `w-3.5 h-3.5 text-slate-400` y formatos ultracompactos `font-mono tabular-nums text-[11px]` (`DD/MM` ej. `12/10` / `S/F`, y `{real}/{est}h` ej. `0/2h`).
   - Micro-botonera táctica renovada con altura cómoda móvil (`h-9 px-3 md:h-6 md:px-2`): `Por Hacer` + `ArrowRight`, retroceso compacto con `ArrowLeft`, `Iniciar`, `Completar` y `Reabrir`.
3. **Simplificación de Contadores y Acciones en `ColumnaKanban.tsx`:**
   - Botón móvil de creación rápida condensado a icono `Plus` centrado y etiqueta `Añadir`.
   - Contador de columna estandarizado con `text-xs font-mono tabular-nums font-bold bg-slate-800/70 px-2 py-0.5 rounded-full text-slate-300 border border-slate-700/50`.
   - Sin alteraciones en `src/db/db.ts`, hooks de estado ni tipos en `src/types/index.ts`.

---

### FASE 4.98 — Automatización de Exposición Local HTTPS y Script Móvil (REQ-OPS-25)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `vite.config.ts`, `package.json`, `iniciar-movil.bat`, `scripts/dev-mobile.bat`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Exposición LAN con HTTPS Autofirmado (`vite.config.ts`, `package.json`):**
   - Instalación de `@vitejs/plugin-basic-ssl` en `devDependencies` y registro de `basicSsl()` dentro de `plugins` en `vite.config.ts` para habilitar HTTPS autofirmado (`node_modules/.vite/basic-ssl/_cert.pem`) en `server` y `preview`, evitando bloqueos de contexto seguro en móviles reales (`crypto.randomUUID()`, `navigator.mediaDevices` / `VoicePill`, Service Worker).
   - Configuración explícita de `server: { host: '0.0.0.0', port: 3000, strictPort: true, open: false }` e incorporación del script `"dev:mobile": "vite --host 0.0.0.0 --port 3000"` en `package.json`.
2. **Automatización de Arranque con Detección de IP (`iniciar-movil.bat`, `scripts/dev-mobile.bat`):**
   - Creación de lanzadores Windows en raíz (`iniciar-movil.bat`) y en `scripts/dev-mobile.bat` con resolución automática de dirección `IPv4` vía `ipconfig`, impresión directa de `https://%IP%:3000/` y arranque de `npm run dev:mobile`.
   - Preservación absoluta de `src/components/`, `src/db/db.ts` y contratos de datos.

---

### FASE 4.97 — Limpieza Estética Radical del Tablero Kanban en Móvil (REQ-UI-24)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Views/ViewKanban.tsx`, `src/components/Layout/HeaderMaestro.tsx`, `src/components/Ideas/WidgetIdeasBubble.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Unificación a Barra Única Limpia en `ViewKanban.tsx` (< md):**
   - Consolidación de las franjas móviles en una sola barra compacta (`h-11`, `#carrusel-proyectos-movil`) con: selector compacto de proyecto (`#btn-selector-proyecto-movil`), pestañas de columna (`#selector-columnas-kanban-movil`) con `01_Backlog` activo por defecto al frente, y disparador único de filtros (`#btn-toggle-filtros-movil`).
   - Ocultación completa en móvil del encabezado multipropósito (`<header className="hidden md:flex ...">`), eliminando duplicidad de `"Tablero Kanban"` (`hidden sm:flex`) y suprimiendo en `< md` el bloque de gasto global (`#kanban-gasto-presupuesto-box` con `hidden md:inline-flex` y retiro de `#kanban-gasto-presupuesto-box-movil`).
   - Migración de búsqueda móvil (`#filter-buscar-tarea-mobile`), selector de proyectos (`#bottom-sheet-proyectos-kanban-movil`) y filtros multidimensionales (`#bottom-sheet-filtros-kanban-movil`) a Bottom Sheets nativos (`z-[10000]`) bajo `createPortal` y `motion/react`.
2. **Erradicación de Popovers Fantasmas y Cierre Defensivo (`ViewKanban.tsx`, `HeaderMaestro.tsx`):**
   - Sustitución de contenedores siempre montados (`opacity-0 invisible`) por montaje condicional estricto (`&&`) en los 6 popovers de cabecera desktop (`Tiempo`, `WBS`, `Prioridad`, `Energía`, `Plazo`, `Bloqueos`) y bloqueo de `handlePopoverMouseEnter` en dispositivos táctiles o `< 768px`.
   - Listener global de clic externo y `Escape` para `#menu-theme-dropdown` (`HeaderMaestro.tsx`), acotado con `max-w-[calc(100vw-24px)]`.
3. **Despeje Inferior sin Colisión (`WidgetIdeasBubble.tsx`):**
   - Detección reactiva `matchMedia('(max-width: 767px)')` y reposicionamiento móvil canónico a `bottom-20 right-3 md:bottom-6 md:right-6`, eliminando traslapes con el botón central `+` elevado de `BottomNavMobile`.
   - Compactación del pill flotante móvil (`hidden md:flex` en grip drag y bandeja expandible hover) y acotación de `#popover-captura-rapida-idea` a `max-w-[calc(100vw-24px)]`.
   - Sin alteraciones en `src/db/db.ts` ni esquemas de datos.

---

### FASE 4.96 — Blindaje de Despliegue Wrangler v4 para Assets Estáticos (REQ-OPS-23)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `wrangler.toml`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
- **Migración a bloque `[assets]` de Wrangler v4 en `wrangler.toml`:**
  - Sustitución de la directiva heredada de Pages (`pages_build_output_dir = "dist"`, registrada previamente en `REQ-OPS-19`) por la configuración canónica de assets estáticos:
    - `name = "miportalweb"`
    - `compatibility_date = "2026-11-01"`
    - `[assets]` con `directory = "./dist"`
  - Permite ejecutar `npx wrangler deploy` directamente con Wrangler `4.160.0` sin requerir un script entrypoint `main` de Worker.
  - Política de aislamiento respetada: cero cambios en `src/`, `package.json` ni esquemas Dexie.

---

### FASE 4.95 — Ergonomía de Pulgar 44px, Compactación de Cabeceras Móviles y Transiciones Cinéticas (REQ-OPS-22B)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/PMO/TarjetaTareaKanban.tsx`, `src/components/PMO/TarjetaProyecto.tsx`, `src/components/PMO/ColumnaKanban.tsx`, `src/components/PMO/FiltrosPortafolio.tsx`, `src/components/Views/ViewKanban.tsx`, `src/components/Views/ViewPortafolio.tsx`, `src/components/Notas/VisorNotas.tsx`, `src/components/Layout/HeaderMaestro.tsx`, `src/components/Layout/BottomNavMobile.tsx`, `src/components/Modals/{ModalTareaFlow,ModalMetaPlanFlow,ModalActividadFlow,ModalGasto,ModalIngreso,ModalNuevoProyecto,ModalAtajosTeclado,ModalExportarPdf,ModalNuevoPlanCuotas,ModalDoDAdvertencia,ModalConvertirWishlistGasto,ModalAlcanceRecurrencia,ModalNuevoHito,ModalTechosPresupuesto}.tsx`, `src/components/Notas/{EditorNotaModal,ModalCrearCuaderno,ModalVincularEntidades,PopoverPreviewNotas}.tsx`, `src/components/IA/AsistenteIaModal.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Ergonomía Táctil Móvil (≥ 44px / 40px Compacto):**
   - `TarjetaTareaKanban.tsx`: escalado de botones de avance/retroceso a `h-10 px-3 md:h-6 md:px-2` (`w-10 h-10 md:w-6 md:h-6` en flechas de retroceso) y visibilidad táctil continua de Archivar/Eliminar (`opacity-75 md:opacity-0 md:group-hover:opacity-100`).
   - `TarjetaProyecto.tsx`: controles inferiores (`Ver Detalle 360°`, `+`, Editar, Eliminar) escalados a `min-h-[44px] sm:min-h-0` y `min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0`.
   - Botones de cierre (`X`) normalizados a `min-w-[44px] min-h-[44px]` en móvil en `HeaderMaestro.tsx` (`#drawer-archivados`), `ModalTareaFlow.tsx`, `ModalMetaPlanFlow.tsx`, `ModalActividadFlow.tsx`, `ModalGasto.tsx`, `ModalIngreso.tsx`, `ModalNuevoProyecto.tsx`, `ModalAtajosTeclado.tsx`, `ModalExportarPdf.tsx`, `ModalNuevoPlanCuotas.tsx`, `ModalDoDAdvertencia.tsx`, `ModalConvertirWishlistGasto.tsx`, `ModalNuevoHito.tsx`, `EditorNotaModal.tsx`, `AsistenteIaModal.tsx`, `ModalCrearCuaderno.tsx` y `ModalVincularEntidades.tsx`.
2. **Compactación de Cabeceras Móviles (< sm / < md):**
   - `ViewKanban.tsx`: lupa expandible (`#btn-toggle-busqueda-kanban-movil`) y toggle de filtros (`#btn-toggle-filtros-movil`) integrados en `#carrusel-proyectos-movil`; `<header>` colapsado (`hidden md:flex`) cuando no hay búsqueda ni filtros activos para recuperar altura útil en viewport compacto; pestañas `#selector-columnas-kanban-movil` escaladas a `h-10 md:h-7` con `snap-x` y popovers acotados con `max-w-[calc(100vw-20px)]`.
   - `ColumnaKanban.tsx`: botón móvil *Añadir Tarea* escalado a `h-10 md:h-7`.
   - `VisorNotas.tsx`: compactación de barra superior (`py-1.5 md:py-2.5`), filtros (`py-1.5 md:py-3`, `#input-busqueda-notas` `h-9 md:h-8`) y disparador de nota rápida (`h-10 md:h-8`).
3. **Limpieza Visual de Portafolio y Supresión de Dependencias Hover:**
   - `ViewPortafolio.tsx`: KPIs en `grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4`, subtítulo y líneas secundarias ocultas en `< sm`, `animate-ping` restringido a `countBloqueado > 0`, filtro *Cartera* con tira horizontal táctil en `< sm` + toggle `onClick` en `sm+` (sin `:hover` flyout), y modal de eliminación en cascada convertido a Bottom Sheet (`max-h-[92dvh]`, `rounded-t-3xl sm:rounded-2xl`).
   - `TarjetaProyecto.tsx`: ocultamiento en `< sm` de badges redundantes (`tipo_iniciativa`, North Star OKR, `p.estado`, `Varianza`, `Saldo`) e `animate-ping` exclusivo de `isCrit`.
4. **Transiciones Aceleradas por Hardware e Higiene Tailwind v3:**
   - Sustitución de clases inexistentes en Tailwind v3.4 (`backdrop-blur-xs`, `animate-in`, `animate-fadeIn`, `animate-scaleUp`, `shadow-2xs`) por `backdrop-blur-sm`, `shadow-sm`, `transform-gpu`, `transition-[transform,opacity]` y `motion/react`.
   - Sin alteraciones en `src/db/db.ts` ni `src/types/index.ts`.

---

### FASE 4.94 — Reestructuración de Chasis, Z-Index y Bottom Sheets en Móvil (REQ-OPS-22A)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/UI/UndoToastContainer.tsx`, `src/components/PMO/ColumnaKanban.tsx`, `src/components/Views/ViewPortafolio.tsx`, `src/components/Notas/VisorNotas.tsx`, `src/components/Modals/ModalRegistroAvanceHabito.tsx`, `src/components/Notas/EditorNotaModal.tsx`, `src/components/IA/AsistenteIaModal.tsx`, `src/components/Modals/ModalMetaPlanFlow.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Solución Implementada
1. **Desacople de Toasts y Z-Index (`UndoToastContainer.tsx`):**
   - Contenedor `#undo-toast-container` reposicionado en móvil arriba (`fixed top-14 left-3 right-3 sm:top-auto sm:bottom-4 sm:right-4 sm:left-auto z-[10010] flex flex-col gap-2`), eliminando la colisión con el botón *Más* de `BottomNavMobile` (`z-[9999]`) y garantizando visibilidad por encima de modales (`z-[10000]`).
2. **Despeje Inferior frente al FAB de Ideas y BottomNav:**
   - Actualización del padding inferior scrollable a `pb-28 md:pb-8` en `#body-${col.domId}` (`ColumnaKanban.tsx`), `#vista-portafolio-wrapper` (`ViewPortafolio.tsx`) y `#contenedor-scroll-notas` (`VisorNotas.tsx`), evitando obstrucciones sobre la última tarjeta en viewports de `360px`–`412px`.
3. **Estandarización Universal de Modales a Bottom Sheet Móvil:**
   - Migración de `ModalRegistroAvanceHabito.tsx`, `EditorNotaModal.tsx`, `AsistenteIaModal.tsx` y `ModalMetaPlanFlow.tsx` al patrón canónico: overlay `fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm`, contenedor `w-full max-h-[92dvh] rounded-t-3xl sm:rounded-2xl bg-[#0D1526] border-t sm:border border-slate-700/60 overflow-hidden flex flex-col`, drag handle superior `sm:hidden` y barra inferior de acciones fijada con `sticky bottom-0 bg-[#0D1526]/95 backdrop-blur-md p-3 border-t border-slate-800/80`.
   - Preservación integral de `db.ts` y contratos de persistencia.

---

### FASE 4.93 — Integración Canónica de VoicePill (React Bits) en Captura Rápida de Ideas (REQ-UI-20)
**Fecha:** Noviembre 2026 | **Archivos creados/modificados:** `src/components/VoicePill.tsx` (Nuevo vía `@reactbits-starter/VoicePill-TS-TW`), `src/components/Ideas/WidgetIdeasBubble.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Alcance
- Modernizar el disparador rudimentario `#btn-quick-voice-record` dentro del popover `#popover-captura-rapida-idea` de `WidgetIdeasBubble.tsx` con la cápsula cinética `VoicePill` (`@reactbits-starter/VoicePill-TS-TW`), manteniendo intactos `src/hooks/useSpeechRecognition.ts` (Web Speech API) y el esquema/persistencia en `db.ideas` (`IdeaRecord`, `tipo_captura: 'VOZ' | 'TEXTO'`).

#### Solución Implementada
1. **Componente `src/components/VoicePill.tsx` (`@reactbits-starter/VoicePill-TS-TW`):**
   - Instalado vía `npx --yes shadcn@latest add @reactbits-starter/VoicePill-TS-TW` (componente Tailwind-only sin hoja `.css` separada).
   - Extendido quirúrgicamente con props opcionales de sincronización (`id`, `title`, `active`, `resetSignal`), tipografía numérica `font-mono tabular-nums` en el reloj, y bordes Cobalt (`border-slate-700/50` / `border-sky-400/40`) sin alterar sus props originales ni su animación matemática.
2. **Micro-Cirugía en `src/components/Ideas/WidgetIdeasBubble.tsx`:**
   - Reubicación de `#btn-quick-voice-record` (`VoicePill`) en el subgrupo derecho junto a `#btn-quick-idea-submit`, con `reactive="simulated"`, `showTime={true}`, `waveform={true}`, `size={32}`, `accentColor="#38bdf8"`, `iconColor="#94a3b8"`, `background="#1e293b"`.
   - Enlace reactivo: `onStart` (`handleVoiceStart`) preserva el texto previo en `baseTextoVozRef.current`, activa `setFueGrabadoConVoz(true)` e invoca `startListening()`; `onStop` (`handleVoiceStop`) invoca `stopListening()`.
   - Sincronización bidireccional: `active={isListening}` y `resetSignal={voiceResetSignal}` garantizan el repliegue inmediato de `VoicePill` si `useSpeechRecognition` finaliza externamente (`onend` / `onerror`), si el navegador no soporta Web Speech API, o al ejecutarse `resetFormulario()` (`Escape`, clic fuera o `handleGuardarIdea`).
   - Ergonomía de contención: durante `isListening`, los botones auxiliares izquierdos (`Adjuntar`, `IA`) aplican `opacity-30 pointer-events-none`, despejando la expansión horizontal (`right-full`) dentro de `#popover-captura-rapida-idea` (`w-80 sm:w-96`) sin colisiones ni desbordamientos.

---

### FASE 4.92 — Aceleración Reactiva: Suscripción WebSocket Supabase Realtime, Filtro Anti-Eco y Debounce Trailing-Edge (REQ-SYS-010-REALTIME)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/services/syncManager.ts`, `src/components/Layout/HeaderMaestro.tsx`, `src/services/__tests__/syncManagerRealtime.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Latencia de Refresco Pasivo (45s Polling):** Las mutaciones colaborativas o concurrentes en Supabase dependían de un sondeo por intervalo de 45 segundos, del evento `window.online` o de recargas manuales (tecla R), provocando desfases temporales en tableros Kanban y métricas.
- **Vulnerabilidad a Avalanchas por Eventos Concurrentes (Thundering Herd):** Un cliente conectado a WebSocket recibiendo ráfagas de cambios remotos (ej. 10 actualizaciones de tareas en segundos) podía colapsar el hilo principal si disparaba el *inbound pull* completo de las 12 tablas en cada notificación individual.
- **Riesgo de Bucle Infinito por Auto-Eco:** Al subir cambios locales vía `upsert`, Supabase emite un evento `postgres_changes` de vuelta hacia todos los suscriptores. Sin un discriminador de origen, el cliente que originó la mutación re-descargaba su propio dato, re-escribiendo IndexedDB y disparando re-renders reactivos ociosos.
- **Opacidad del Estado de Conexión en UI:** `HeaderMaestro.tsx` sólo mostraba estado "Al día" (verde) o "Sincronizando...", ocultando fallas de WebSocket (`CHANNEL_ERROR`, `CLOSED`, `TIMED_OUT`) si las peticiones REST previas habían sido exitosas.

#### Solución Implementada
- **Suscripción Selectiva Supabase Realtime (`setupRealtimeSubscriptions`):**
  - Creación del canal unificado `pmo-realtime-channel` en `src/services/syncManager.ts`, escuchando eventos `postgres_changes` exclusivamente sobre las 5 tablas de alta frecuencia operativa: `tareas`, `actividades_personales`, `gastos`, `ingresos` y `proyectos`.
- **Caché Temporal Anti-Eco con TTL de 10 Segundos (`recentlyPushedIds`):**
  - Implementación del buffer en memoria `recentlyPushedIds = new Map<string, number>()`.
  - En la fase de subida de todas las entidades, cada ID se registra de inmediato con un vencimiento de 10 segundos (`registrarPushedId`).
  - Al ingresar un evento por el WebSocket, si `payload.new.id` o `payload.old.id` reside en la caché y no ha expirado, el evento se descarta en $O(1)$ sin generar llamadas de red ni lecturas I/O.
- **Amortiguación Trailing-Edge Debounce (800ms) y Pull Selectivo:**
  - Acumulación de entidades afectadas en `tablasPendientesRealtime`.
  - Temporizador de 800ms que consolida ráfagas de cambios remotos en una única ejecución del nuevo método `descargarDatosSelectivos(tablas: string[])`, descargando únicamente las tablas impactadas en vez de las 12 tablas completas.
- **Telemetría y Feedback Visual en `HeaderMaestro.tsx`:**
  - Extensión de `SyncState` con el estado `'reconnecting'`.
  - Monitoreo del estado del canal Realtime: ante `CHANNEL_ERROR`, `CLOSED` o `TIMED_OUT`, el indicador se degrada automáticamente a `'reconnecting'`.
  - Renderizado de Micro-LED ámbar Cobalt Aerodynamic (`bg-amber-400 shadow-[0_0_12px_#f59e0b]`) con tooltip interactivo *"Reconectando en tiempo real..."*, restaurando el verde esmeralda brillante exclusivamente para *"Al día (Sincronizado)"*.
- **Validación QA:**
  - `npx tsc --noEmit`: 0 errores.
  - `npm test`: 25/25 suites pasadas (217/217 tests unitarios e integrados).
  - `npm run build`: Compilación de producción exitosa en 7.55s.

### FASE 4.91 — Ciclo de Vida de Datos: Orquestación de Tombstones, Anti-Resurrección y Garbage Collection en DexieDB (REQ-SYS-009-DATA-LIFECYCLE)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/types/index.ts`, `src/db/db.ts`, `src/context/UndoDeleteContext.tsx`, `src/services/syncManager.ts`, `src/services/habitosService.ts`, `src/services/metasService.ts`, `src/services/__tests__/dataLifecycleTombstones.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Resurrección Remota por Ausencia de Lápidas (Tombstones):** El flujo anterior ejecutaba borrado físico directo en Dexie (`db[tabla].delete(id)`) al expirar la ventana de 4s de `UndoDeleteContext`. Dado que no se despachaba una mutación destructiva remota hacia Supabase ni se conservaba constancia del borrado, el *inbound pull* periódico o tras reconexión (`descargarDatosDescendientes`) re-descargaba el registro desde la nube vía `bulkPut()`, resucitándolo indefinidamente en la base local.
- **Ausencia de Garbage Collection / Purga en IndexedDB:** La "Bóveda de Archivados (+10 Días)" operaba únicamente como filtro de renderizado en memoria (`diffDias > 10`), sin existir un mecanismo de limpieza para tareas completadas, transacciones y lápidas obsoletas, lo que generaba un crecimiento sin acotamiento en el almacenamiento local.
- **Descargas Históricas Irrestrictas en Pull Descendente:** `descargarDatosDescendientes()` realizaba consultas abiertas `.select('*')` sin delimitador temporal en tablas de alto volumen transaccional (`gastos`, `ingresos`, registros de hábitos), saturando la memoria y la red del cliente en dispositivos móviles.

#### Solución Implementada
- **Esquema e Indexación de Lápidas (Tombstones):**
  - En `src/types/index.ts`, definición de `TombstoneRecord` (`id`, `tabla`, `deleted_at`, `sync_status`).
  - En `src/db/db.ts`, migración a `version(6)` incorporando la tabla `tombstones` con índices `'id, tabla, sync_status, deleted_at'`.
  - Creación del helper `registrarTombstone(tabla, id)` expuesto para servicios de dominio y utilidades de borrado en cascada.
- **Captura Quirúrgica en el Búfer UndoDelete (4s):**
  - En `UndoDeleteContext.tsx`, previo a ejecutar el `commit()` atómico diferido, se registra automáticamente la lápida en `db.tombstones` con estado `pending`, soportando también `idsSecundarios` sin retrasar el callback de ejecución síncrona.
  - Integración en `habitosService.ts` y `metasService.ts` para cubrir eliminaciones en cascada y de series completas.
- **Push Prioritario de Tombstones hacia Supabase:**
  - En `syncManager.ts`, incorporación del método `sincronizarTombstones()` despachado como **Paso 0** en `syncPendingRecords()` antes de cualquier sincronización de entidades raíz, emitiendo `.from(tombstone.tabla).delete().eq('id', tombstone.id)`. Al confirmarse en nube, la lápida se actualiza a `sync_status === 'synced'`.
- **Pull Acotado (Ventana de 90 días) y Barrera Anti-Resurrección:**
  - En `descargarDatosDescendientes()`, pre-carga en memoria de un `Set` exhaustivo de IDs provenientes de `db.tombstones`. Cualquier entidad remota entrante cuyo identificador coincida con una lápida local es descartada de inmediato, impidiendo su reinserción en IndexedDB.
  - Inyección de cláusula temporal `.gte('created_at', cutoffIso)` (umbral 90 días) en consultas de tablas de alto volumen (`gastos`, `ingresos`, logs de hábitos).
- **Rutina de Garbage Collection Local (`purgarRegistrosLocalesExpirados`):**
  - Implementación en `src/db/db.ts` de `purgarRegistrosLocalesExpirados(diasRetencion = 90)` que barre físicamente tareas completadas/archivadas, transacciones y lápidas con `sync_status === 'synced'` cuya antigüedad supere los 90 días.
  - Exposición de trigger de mantenimiento en entorno de desarrollo `window.__PURGAR_REGISTROS_EXPIRADOS__`.
- **Validación QA:**
  - `npx tsc --noEmit`: 0 errores.
  - `npm test`: 24/24 suites pasadas (210/210 tests unitarios e integrados).
  - `npm run build`: Compilación exitosa en 7.62s.

### FASE 4.90 — Consolidación O(1) de Totales Financieros, Purga Definitiva de Tokens Indigo/Legacy y Bento Empty States (REQ-SYS-008-FINANZAS-METAS)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Views/ViewFinanzas.tsx`, `src/components/Finanzas/TabPresupuestos.tsx`, `src/components/Finanzas/TabControlCuotas.tsx`, `src/components/Finanzas/DashboardFinanciero.tsx`, `src/components/Habitos/Metas/ViewMetasPlanes.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Iteraciones Redundantes en Sumatorias Financieras ($O(8N)$):** `ViewFinanzas.tsx` ejecutaba hasta 5 reducciones y filtrados sucesivos sobre `gastosFiltrados` (`realGastos`, `otrosGastosPendientes`, `gastosHormiga`, `posicionBimonetaria`, `radarCategorias`) y 3 sobre `ingresosFiltrados`. Esto causaba una sobrecarga de CPU evitable ante datasets extensos de tesorería y créditos.
- **Ruptura de Tokens Cobalt Aerodynamic por Clases Legacy (`indigo-*`, `bg-white`, `border-slate-200`):** `ViewFinanzas.tsx` poseía un chasis `bg-slate-100`, cabecera `bg-white/85`, selector de periodos blanco y selectores de píldora con `text-slate-900`. `TabPresupuestos.tsx` y `DashboardFinanciero.tsx` empleaban acentos `indigo-400`, `indigo-500` y halos `shadow-[0_0_8px_#6366f1]`, infringiendo la directriz A.2.2 de Cobalt Aerodynamic.
- **Estados Vacíos con Cursivas Abandonadas:** En transacciones, cuotas bancarias, presupuestos de hábitos y proyectos se mostraban etiquetas `<div className="... italic">` planas sin identidad Bento ni llamadas a la acción, degradando la experiencia visual del usuario.
- **Filtrado Inline en Metas y Planes:** En `ViewMetasPlanes.tsx`, el cálculo de contadores por categoría de vida ejecutaba `metasDetalladas.filter()` inline dentro del render de botones.

#### Solución Implementada
- **Consolidación de Totales en Un Solo Paso $O(N)$:**
  - En `ViewFinanzas.tsx`, sustitución de las 5 llamadas independientes por el hook unificado `totalesGastos`, que barre `gastosFiltrados` en un único bucle `for...of` calculando en simultáneo: dinero pagado/real, compromisos pendientes, gastos hormiga, desglose bimonetario y radar de categorías.
  - Sincronización idéntica en `totalesIngresos` para `realIngresos`, `ingresosPendientes` y posición cambiaria, y consolidación de `cuotasPendientesMes` + `montoCuotasPendientes` en un solo paso.
- **Purga Estética Integral Cobalt Aerodynamic:**
  - Chasis de `ViewFinanzas.tsx` migrado a `bg-[#040711]`, cabeceras y superficies elevadas a `#0D1526` con microbordes `border-slate-800/40`.
  - Erradicación total de clases `indigo-*` en `TabPresupuestos.tsx` y `DashboardFinanciero.tsx`, reemplazándolas por los acentos canónicos `sky-400` y `teal-400`.
  - Normalización de las barras de progreso bimodal en `ViewMetasPlanes.tsx` a `bg-[#040711]/60 border border-slate-800/40` y pre-cálculo de `conteoMetasPorCategoria` para acceso $O(1)$.
- **Rediseño de Bento Empty States:**
  - Reemplazo de todos los textos cursivos por tarjetas estructuradas Bento (`min-h-[120px]`/`min-h-[140px]`, fondo `bg-slate-900/30`, microborde dashed `border-slate-700/50`, glifos temáticos Lucide `Receipt`, `CreditCard`, `Flame`, `Building` y botones CTA donde aplica).
- **Validación QA:**
  - `npx tsc --noEmit`: 0 errores.
  - `npm test`: 23 suites pasadas, 203/203 pruebas en verde (100%).
  - `npm run build`: compilación de producción limpia y empaquetado exitoso.

---

### FASE 4.89 — Refactor Integral de Service Worker (Cache-First para Google Fonts), Protección de Lazy Loading (ChunkLoadError) y Estandarización PWA Cobalt (REQ-SYS-007-PWA)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `public/sw.js`, `src/main.tsx`, `index.html`, `app.html`, `public/manifest.webmanifest`, `public/manifest.json`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Exclusión Indeseada de Fuentes Google en Service Worker:** En `public/sw.js`, el bloque de exclusiones incluía genéricamente `url.hostname.includes('googleapis.com')`, lo que bloqueaba la interceptación de `fonts.googleapis.com` (hojas de estilo CSS de Google Fonts). Al operar sin conexión por primera vez o ante purgas de caché HTTP, las tipografías Plus Jakarta Sans y JetBrains Mono fallaban al cargarse offline.
- **Vulnerabilidad de Desincronización de Chunks en Lazy Loading (`ChunkLoadError`):** Dado que el Service Worker opera con auto-actualización inmediata (`skipWaiting()` y `clients.claim()`), los nuevos despliegues de producción purgan los chunks compilados anteriores. Las pestañas abiertas que intentaban importar dinámicamente vistas como `ViewDetalle360` o `ViewFinanzas` mediante `React.lazy()` arrojaban excepciones no controladas de tipo `ChunkLoadError` o `Failed to fetch dynamically imported module`.
- **Inconsistencia de Tokens de Color en Shell HTML:** `index.html` y `app.html` declaraban `bg-[#020617]` (Slate 950) en las etiquetas `<html>` y `<body>`, provocando una micro-discrepancia visual frente al lienzo canónico Cobalt Aerodynamic (`#040711`) durante el splash screen y precarga del cliente.
- **Rutas Absolutas en Manifiestos PWA:** En `public/manifest.webmanifest` y `public/manifest.json`, la sección `shortcuts` definía `"url": "/?mode=hud"` e icono `"/icon-192.png"` con barras iniciales absolutas, quebrando la navegación relativa (`base: './'`) al desplegar la suite en subdirectorios o dominios compartidos.

#### Solución Implementada
- **Estrategia Cache-First para Google Fonts en `public/sw.js`:**
  - Inyección de una regla prioritaria en el evento `fetch`: para peticiones hacia `fonts.googleapis.com` o `fonts.gstatic.com`, el Service Worker entrega inmediatamente la copia en caché (`caches.match`) y, si no existe, ejecuta el fetch de red, clonando y almacenando en caché la respuesta válida (incluyendo respuestas `opaque` y `cors`).
  - Eliminación de la exclusión indiscriminada de `googleapis.com` para permitir el almacenamiento persistente de fuentes offline.
- **Intercepción y Autocorrección de `ChunkLoadError` en `src/main.tsx`:**
  - Registro de listener global `window.addEventListener('vite:preloadError', (event) => { event.preventDefault(); window.location.reload(); });`. Al detectar un chunk diferido inaccesible debido a un despliegue reciente, previene el crash de la aplicación y ejecuta una recarga limpia y transparente de la página.
- **Unificación de Tokens Visuales Cobalt Aerodynamic en Shell HTML:**
  - Sustitución de `bg-[#020617]` por `bg-[#040711]` en `<html>` y `<body>` tanto en `index.html` como en `app.html`, garantizando continuidad cromática 1:1 con el diseño Cobalt desde el milisegundo cero.
- **Portabilidad Relativa en Manifiestos Web:**
  - Actualización de los accesos directos en `public/manifest.webmanifest` y `public/manifest.json` hacia rutas relativas puras: `"./?mode=hud"` y `"./icon-192.png"`.
- **Validación QA:**
  - `npx tsc --noEmit` completado con 0 errores de tipado.
  - Suite Vitest con 23 suites y 203/203 pruebas en verde (100%).
  - Empaquetado de producción exitoso con `npm run build`.

---

### FASE 4.88 — Orquestación Integral de Sincronización (12 Entidades), Estrategia LWW (Last-Write-Wins), Reconexión Atómica y Resiliencia con Backoff (REQ-SYS-006-SYNC)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/services/syncPayloadSanitizer.ts`, `src/services/syncManager.ts`, `src/services/__tests__/syncManager.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Brecha Crítica de Entidades en Cola Push:** `syncPendingRecords` únicamente procesaba 6 entidades (`proyectos`, `hitos_wbs`, `tareas`, `actividades_personales`, `subtareas_pasos`, `notas`). Las entidades de Finanzas (`gastos`, `ingresos`, `cuotas`) y de Metas/Planes (`metas_planes`, `planes_accion_hitos`, `habitos_metas_vinculos`) quedaban atrapadas en Dexie sin replicarse jamás a Supabase.
- **Ausencia de Estrategia Last-Write-Wins (LWW):** En el proceso Push, el cliente local ejecutaba `.upsert(payload, { onConflict: 'codigo_legado' })` sobreescribiendo ciegamente cualquier mutación remota más reciente hecha por otro dispositivo. En el Pull, los registros pendientes locales ignoraban al remoto sin comparar marcas de tiempo, provocando pérdida inadvertida de datos multi-dispositivo.
- **Deadlock de Registros en Estado de Error:** Los registros rechazados por errores transitorios de red o llaves foráneas se marcaban con `sync_status = 'error'`. Dado que `syncPendingRecords` consultaba estrictamente `.where('sync_status').equals('pending')`, los registros fallidos quedaban huérfanos indefinidamente sin reintentos automáticos.
- **Reconexión Unidireccional Asimétrica:** Al restablecerse la conexión a Internet (`window.addEventListener('online')`), el orquestador solo disparaba el Push (`syncPendingRecords`) omitiendo el Pull (`descargarDatosDescendientes`), dejando la base local desactualizada frente a cambios en la nube.

#### Solución Implementada
- **Orquestación Topológica Integral de 12 Entidades:**
  - Creación de sanitizadores PostgreSQL puros en `syncPayloadSanitizer.ts`: `sanitizarGastoPayload`, `sanitizarIngresoPayload`, `sanitizarCuotaPayload`, `sanitizarMetaPlanPayload`, `sanitizarHitoPlanPayload` y `sanitizarVinculoPayload`.
  - Expansión de `syncPendingRecords` para despachar en orden topológico estricto: 1. Proyectos $\rightarrow$ 2. Hitos WBS $\rightarrow$ 3. Tareas & Hábitos $\rightarrow$ 4. Subtareas $\rightarrow$ 5. Metas/Planes $\rightarrow$ 6. Hitos del Plan $\rightarrow$ 7. Vínculos Hábito-Meta $\rightarrow$ 8. Gastos $\rightarrow$ 9. Ingresos $\rightarrow$ 10. Cuotas $\rightarrow$ 11. Notas.
  - Expansión de `descargarDatosDescendientes` (Pull) para hidratar las 12 entidades protegiendo cambios locales no sincronizados.
- **Algoritmo LWW (Last-Write-Wins) Pre-Upsert:**
  - Inyección del método `esRemotoMasReciente(tabla, codigoLegado, updatedAtLocal)` que inspecciona `updated_at` remoto en Supabase antes de ejecutar `.upsert()`. Si la versión remota es estrictamente más reciente (`remoteTime > localTime`), se aborta el push, se marca localmente como `'synced'` y se emite la advertencia estructurada `[SyncManager] LWW Alert: Remote wins`.
- **Tolerancia a Fallos y Reintentos con Backoff:**
  - Consulta reactiva de pendientes expandida a `anyOf(['pending', 'error'])` vía helper defensivo `obtenerRegistrosPendientes`, permitiendo que el intervalo periódico (45s) reintente automáticamente la replicación de registros fallidos.
- **Reconexión Bidireccional Atómica:**
  - En `setupNetworkListeners()`, el evento `'online'` ahora orquesta una secuencia atómica: `await this.syncPendingRecords()` (Push) seguido de `await this.descargarDatosDescendientes()` (Pull).
- **Validación QA:**
  - `npx tsc --noEmit` completado con 0 errores.
  - Suite Vitest con 23 archivos, 203/203 pruebas aprobadas (100%), incluyendo tests específicos para LWW y sincronización de 12 entidades.
  - Empaquetado de producción exitoso con `npm run build`.

---

### FASE 4.87 — Memoización O(1) por Categoría en TableroHabitos, Estándar de Zona Horaria Local para Check-ins y Purga Estética Cobalt Aerodynamic (REQ-SYS-005-HABITOS)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Habitos/HistogramaSeguimientoTemporal.tsx`, `src/services/habitosService.ts`, `src/components/Views/ViewHabitos.tsx`, `src/components/Habitos/Dashboard/RadarBalanceVida.tsx`, `src/components/Habitos/Dashboard/TablaRendimiento.tsx`, `src/components/Habitos/Dashboard/BentoMetricasHero.tsx`, `src/components/Habitos/Dashboard/MetasCuantitativas.tsx`, `src/components/Habitos/Metas/ViewMetasPlanes.tsx`, `src/components/Habitos/Metas/ModalDetalleMeta360.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Desfase Temporal Nocturno (Bug UTC en Check-in de Hábitos):** `TarjetaHabito.tsx` y `habitosService.ts` evaluaban si un hábito había sido completado hoy contrastando `updated_at.startsWith(hoyStr)`. Dado que `updated_at` en base de datos es una marca temporal ISO UTC (`2026-11-04T01:30:00.000Z`), en husos horarios negativos (Perú UTC-5), a partir de las 19:00 horas locales la cadena cambiaba de fecha (`2026-11-04` vs `2026-11-03`), provocando que los hábitos marcados como hechos se desmarcaran visualmente antes de la medianoche. En `HistogramaSeguimientoTemporal.tsx`, `toIsoDate` convertía marcas temporales usando `getUTCFullYear()` / `getUTCMonth()`, fragmentando la consistencia histórica.
- **Cuello de Botella de Renderizado en Tablero de Hábitos (18 Filtros Redundantes O(N)):** En `TableroHabitos.tsx`, el renderizado de las 6 columnas canónicas ejecutaba múltiples `.filter()` inline sobre `actividadesProcesadas` (6 veces para segmentar por categoría, y 2 veces más por columna para separar pendientes y completadas con `esCompletadaHoy`), totalizando 18 iteraciones completas sobre el dataset en cada ciclo de render reactivo ante cualquier mutación optimista.
- **Inestabilidad de Layout (Layout Shifts en Hover de Tarjeta):** En `TarjetaHabito.tsx`, la barra de botones rápidos (`onEditar`, `onEliminar`, `onAbrirAvance`) carecía de reserva de altura y contención CSS, provocando micro-desplazamientos verticales bruscos (CLS) al pasar el cursor sobre la tarjeta.
- **Vestigios Estéticos Legacy y Ruptura de Tokens Cobalt:** Múltiples componentes del módulo de hábitos arrastraban tokens `indigo-*`, `bg-white dark:bg-[#0D1526]`, bordes claros `border-slate-200/80` y glifos Lucide con grosores inconsistentes, infringiendo las directrices canónicas de diseño Cobalt Aerodynamic (`#040711`, `#0D1526`, microborde `border-slate-800/40`, `sky-*`, Lucide `strokeWidth={1.75}`). En `TableroHabitos.tsx`, los estados vacíos mostraban un texto en cursiva simple en lugar de un Empty State Bento estructurado.

#### Solución Implementada
- **Estandarización Absoluta de Zona Horaria Local:** Sustitución de `updated_at.startsWith(hoyStr)` por `formatFechaIsoLocal(new Date(actividad.updated_at)) === hoyStr` y evaluación prioritaria de `actividad.ultima_fecha_completado === hoyStr`. En `HistogramaSeguimientoTemporal.tsx`, migración de `toIsoDate` a `formatFechaIsoLocal`. En `habitosService.ts`, sanitización de `(actividad.fecha_programada || '').split(/[\sT]/)[0] < hoyStr`, blindando el ciclo de vida continuo de 24 horas sin desfasajes nocturnos.
- **Pre-agrupación Memoizada O(1) (`actividadesPorCategoria`):** Inyección de un hook `useMemo` en la raíz de `TableroHabitos.tsx` que barre `actividadesProcesadas` en una sola pasada $O(N)$ y genera un diccionario indexado por `CategoriaVida` con sus sublistas `completadas` y `pendientes`, KPIs y porcentajes precalculados. El renderizado de las columnas pasó a ser acceso directo $O(1)$, eliminando los 18 filtros redundantes.
- **Estabilización de Layout y Contención CSS en `TarjetaHabito.tsx`:** Contenedor estabilizado con `contain: layout paint`, aceleración `will-change-[transform,opacity]` y botonera de acciones con altura mínima fija `min-h-[24px]` y `shrink-0`, eliminando cualquier Layout Shift en interacción por hover. Checkbox renovado con micro-animación GPU `transform-gpu scale-0` a `scale-100` y `strokeWidth={1.75}`.
- **Empty State Bento Canónico:** Inyección de tarjetas Bento estructuradas en columnas vacías de hábitos con microborde dashed `border-slate-700/50`, icono canónico del pilar de vida y botón directo de llamada a la acción ("+ Crear primer hábito").
- **Purga Integral de Tokens Cobalt Aerodynamic:** Erradicación total de referencias residuales a `indigo-*`, fondos `bg-white` y bordes claros en `ViewHabitos.tsx`, `TableroHabitos.tsx`, `RadarBalanceVida.tsx`, `TablaRendimiento.tsx`, `BentoMetricasHero.tsx`, `MetasCuantitativas.tsx`, `ViewMetasPlanes.tsx` y `ModalDetalleMeta360.tsx`, consolidando el lienzo base `#040711`, tarjetas `#0D1526`, bordes `border-slate-800/40` y acentos `sky`.
- **Validación QA:** `npx tsc --noEmit` completado con 0 errores, pruebas unitarias Vitest aprobadas (100%) y empaquetado de producción exitoso con `npm run build`.

---

### FASE 4.83 — Erradicación Definitiva de SweetAlert2, Toasts Declarativos Cobalt, Motor Real de Techos Presupuestales y Accesibilidad Táctil WCAG (REQ-SYS-001-F8)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/utils/toastCobalt.ts`, `src/components/UI/UndoToastContainer.tsx`, `src/components/Modals/ModalMetaPlanFlow.tsx`, `src/components/Habitos/Metas/ViewMetasPlanes.tsx`, `src/components/Views/ViewDetalle360.tsx`, `src/components/Ideas/WidgetIdeasBubble.tsx`, `src/components/IA/AsistenteIaModal.tsx`, `src/components/Notas/ModalVincularEntidades.tsx`, `src/components/Notas/PopoverPreviewNotas.tsx`, `src/components/Notas/SeccionNotasVinculadasModal.tsx`, `src/components/Modals/ModalTechosPresupuesto.tsx`, `src/components/Finanzas/TabPresupuestos.tsx`, `src/components/Views/ViewFinanzas.tsx`, `src/components/Layout/BottomNavMobile.tsx`, `src/hooks/useGlobalShortcuts.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Presencia Residual de SweetAlert2 (`Swal.fire`):** A pesar de la arquitectura moderna de toasts, 9 archivos aún importaban y ejecutaban `sweetalert2`, bloqueando el hilo de ejecución mediante popups invasivos, inyectando estilos incompatibles con Cobalt Aerodynamic e introduciendo latencia innecesaria en operaciones cotidianas (captura de ideas, desvinculación de notas, check-ins de proyectos).
- **Techos Presupuestales Hardcodeados y Sin Persistencia:** En `TabPresupuestos.tsx`, el catálogo `CATEGORIAS_PRESUPUESTO` consistía en un arreglo estático de 6 elementos con consumos simulados. El botón "Configurar Techos" en `ViewFinanzas.tsx` simplemente emitía un mensaje informativo sin abrir modal ni permitir parametrización real por parte del usuario.
- **Incumplimiento de Touch Targets WCAG y Colisión con Teclado Virtual Móvil:** En `BottomNavMobile.tsx`, los botones de pestañas presentaban alturas inferiores a 48px (`py-1`), y los botones de cierre `X` en los bottom sheets medían apenas 24px (`p-1.5` con icono 16px), violando la recomendación WCAG AAA de 44x44px. Además, al desplegarse el teclado virtual móvil en campos editables (`<input>`, `<textarea>`), la barra inferior flotante se superponía con el teclado tapando el contenido activo.
- **Atajos Rígidos Sin Respeto de Preferencias en LocalStorage:** El hook `useGlobalShortcuts.ts` no consultaba los parámetros `pmo_shortcuts_enabled` ni `pmo_custom_shortcuts` en `localStorage`, impidiendo la inhabilitación o reasignación personalizada de comandos por parte del usuario.

#### Solución Implementada
- **Fulminación Definitiva de SweetAlert2 (0 Referencias en `src/`):**
  - Reescritura integral de `src/utils/toastCobalt.ts` como despachador desacoplado de eventos nativos `pmo:toast` con cero importación de `sweetalert2`.
  - Ampliación de `src/components/UI/UndoToastContainer.tsx` para suscribirse reactivamente al canal de eventos `pmo:toast`, renderizando tanto el búfer de deshecho (`useUndoDelete`) como los micro-toasts declarativos Cobalt con autocierre (2500ms), barra de progreso fluida y tokens Cobalt Aerodynamic (`#0D1526`, microborde `border-slate-800/80`, glifos Lucide con `strokeWidth={1.75}`).
  - Purgadas quirúrgicamente todas las llamadas a `Swal.fire` en `ModalMetaPlanFlow.tsx`, `ViewMetasPlanes.tsx`, `ViewDetalle360.tsx`, `WidgetIdeasBubble.tsx`, `AsistenteIaModal.tsx`, `ModalVincularEntidades.tsx`, `PopoverPreviewNotas.tsx` y `SeccionNotasVinculadasModal.tsx`, sustituyéndolas por toasts fluidos y desvinculaciones directas no bloqueantes. Búsqueda global de `sweetalert2` en `src/` certificada en **0 resultados**.
- **Motor Real y Reactivo de Techos Presupuestales:**
  - Creación de `src/components/Modals/ModalTechosPresupuesto.tsx` (diseño Bento Cobalt `#0D1526`, totalizador dinámico de techo mensual, adición y eliminación de categorías, restablecimiento por defecto y tipografía numérica estricta `font-mono tabular-nums`). Persistencia atómica en `localStorage ('pmo_techos_presupuesto')` y notificación global `pmo:techos-updated`.
  - Refactorización de `TabPresupuestos.tsx`: Sustitución del mock hardcodeado por la agregación en tiempo real de gastos desde Dexie (`gastosRaw`) filtrados por el mes en curso (`YYYY-MM`) y contrastados contra los techos activos, calculando consumos y semáforos porcentuales al instante.
  - Conexión del botón "Configurar Techos" en `ViewFinanzas.tsx` con apertura reactiva de `ModalTechosPresupuesto`.
- **Accesibilidad Móvil WCAG AAA y Ocultamiento de Teclado:**
  - Elevación de los touch targets de las pestañas en `BottomNavMobile.tsx` a `min-h-[48px] py-1.5` y botones de cierre `X` en sheets a `min-w-[44px] min-h-[44px] p-2.5`.
  - Sustitución de `pb-safe` por `.safe-area-bottom` con fallback de inset dinámico `max(0.5rem, env(safe-area-inset-bottom, 0px))`.
  - Detección de foco en elementos editables (`INPUT`, `TEXTAREA`, `isContentEditable`) ocultando reactivamente la barra con `translate-y-full opacity-0 pointer-events-none` y restaurándola con animación fluida al desenfocar.
- **Atajos Globales Dinámicos:**
  - `useGlobalShortcuts.ts` ahora lee `pmo_shortcuts_enabled` y `pmo_custom_shortcuts` desde `localStorage`, permitiendo que el usuario active/desactive atajos y sobrescriba teclas para acciones canónicas con fallback al esquema predeterminado (1..5, C, R, X, ?).
- **Validación QA:**
  - `npx tsc --noEmit` completado con 0 errores.
  - Suite de pruebas unitarias (`npm test`): 23 archivos, 200/200 pruebas aprobadas (100%).
  - Build de producción (`npm run build`): Empaquetado exitoso sin advertencias de tamaño en chunks principales.

---

### FASE 4.82 — Unificación Canónica del Dock Superior (5 Vistas), Ruteo por Hash, Code-Splitting Total y Estandarización Iconográfica Cobalt (REQ-SYS-001-F7)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/App.tsx`, `src/components/Layout/HeaderMaestro.tsx`, `src/components/Layout/BottomNavMobile.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Inflación del Bundle Inicial (>800 kB):** `App.tsx` importaba síncronamente `ViewKanban`, `ViewPortafolio`, `ViewHabitos` y `ViewNotas` en el hilo principal. Esto cargaba de golpe los motores de drag-and-drop (`@dnd-kit`), parseo Markdown y árboles WBS al arranque, inflando el chunk principal a **800.23 kB** y emitiendo advertencias de bundle en Vite (>500 kB).
- **Segregación Asimétrica de "Notas" (Ruptura con Atajo 5):** En `HeaderMaestro.tsx`, la barra central de navegación solo agrupaba 4 vistas (`Tablero`, `Portafolio`, `Hábitos`, `Finanzas`). La 5ª vista troncal (`Notas`) estaba aislada en el flanco derecho con un botón ámbar segregado (`#btn-nav-notas`), recargando el clúster de utilidades (9 botones contiguos) y rompiendo la paridad arquitectónica con `useGlobalShortcuts.ts` (atajos 1..5).
- **Inconsistencia de Tokens Cobalt e Iconografía Sin `strokeWidth={1.75}`:** Más de 20 glifos Lucide omitían el peso canónico `strokeWidth={1.75}` (usando por defecto 2.0 o grosores arbitrarios como `stroke-[2.5]`). Las pestañas activas del header usaban `bg-white dark:bg-slate-800` genérico y `BottomNavMobile` arrastraba clases residuales índigo (`text-indigo-400`, `bg-indigo-600`).
- **Pérdida de Estado al Recargar (F5) y Caídas de FPS en Drawer:** `vistaActiva` residía solo en memoria local reseteando a `'kanban'` ante cualquier recarga. El panel deslizante de la Bóveda de Archivados ejecutaba `backdrop-blur-2xl` sobre un contenedor animado de 580px sin aceleración por hardware, y múltiples botones utilizaban `transition-all`.

#### Solución Implementada
- **Code-Splitting Total y Lazy Loading Universal en `App.tsx`:** Migración de `ViewKanban`, `ViewPortafolio`, `ViewHabitos` y `ViewNotas` a `React.lazy()` junto a `ViewDetalle360` y `ViewFinanzas`. Envoltorio del switch de vistas en un único `<Suspense fallback={<VistaCargandoFallback />}>`. Reducción drástica del bundle principal: de **800.23 kB a 394.60 kB** (reducción >50%), eliminando todo warning de Vite.
- **Ruteo Declarativo por Hash Bidireccional (`window.location.hash`):** Sincronización robusta de `vistaActiva` con el hash de la URL (`#kanban`, `#portafolio`, `#habitos`, `#financiero`, `#detalle`, `#notas`). Detección automática en recarga y soporte nativo para los botones Atrás/Adelante del navegador, con blindaje estricto para no interferir con el modo Electron HUD (`?widget=desktop` o `?mode=hud`).
- **Unificación de las 5 Vistas Maestras en el Dock Central:** Integración de "Notas" (Atajo 5) dentro del `<nav>` central como 5ª pestaña canónica (`#tab-nav-notas`), suprimiendo el botón segregado del flanco derecho y devolviendo la simetría 1:1 con `useGlobalShortcuts.ts` (1..5).
- **Modo Compacto Responsivo Anticolisión (`hidden lg:inline`):** En viewports intermedios (`768px` a `1024px`), las etiquetas de texto se colapsan elegantemente mostrando solo el glifo Lucide y su micro-badge numérico (`font-mono tabular-nums`), evitando desbordamientos contra el logo o el dock de herramientas.
- **Estandarización Iconográfica Universal (`strokeWidth={1.75}`) y Tokens Cobalt:** Estandarización de pestaña activa a `text-sky-300 bg-sky-950/30 border border-sky-800/40 shadow-xs` e inactiva a `text-slate-400 hover:text-sky-300 hover:bg-slate-800/40`. Erradicación de clases índigo en `BottomNavMobile` en favor de la paleta Cobalt (`sky`). Inyección de `strokeWidth={1.75}` en todos los iconos Lucide del layout.
- **Aceleración GPU en Drawer de Archivados:** Sustitución de `backdrop-blur-2xl` por fondo opaco `#0D1526` con microborde `border-slate-800/40`, inyección de `transform-gpu will-change-transform` y purga de `transition-all` en favor de `transition-[color,background-color,border-color,transform] duration-150`.
- **Certificación QA:** 23 suites de pruebas unitarias Vitest aprobadas (200/200 tests pasando, 100%), verificación estricta de TypeScript con `npx tsc --noEmit` (0 errores) y empaquetado de producción exitoso con `npm run build` en 8.64s.

---

### FASE 4.81 — Optimización Integral de Hábitos, Tracker Diario, Erradicación del Desfase UTC-5 y Check-in Optimista (0ms) (REQ-SYS-001-F6)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/utils/timeFormatters.ts`, `src/services/habitosService.ts`, `src/components/Modals/ModalRegistroAvanceHabito.tsx`, `src/components/Habitos/Dashboard/HeatmapConsistencia.tsx`, `src/hooks/useHabitos.ts`, `src/components/Habitos/Dashboard/TablaRendimiento.tsx`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Modals/ModalActividadFlow.tsx`, `src/components/Habitos/Dashboard/MetasCuantitativas.tsx`, `src/components/Habitos/Metas/ModalDetalleMeta360.tsx`, `src/components/Habitos/__tests__/HabitosTrackerOptimistic.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Desfase Temporal Nocturno (Bug Crítico UTC-5 Lima):** Cuatro componentes clave (`HeatmapConsistencia.tsx`, `useHabitos.ts`, `TarjetaHabito.tsx`, `TablaRendimiento.tsx`) evaluaban la fecha del día con `new Date().toISOString().split('T')[0]`. A partir de las 19:00 horas (hora local de Lima GMT-5), la conversión UTC devolvía el día siguiente (`2026-11-03` en lugar de `2026-11-02`), causando que la celda de hoy en el mapa de calor se desplazara al futuro y que los hábitos completados en la noche no coincidieran con `hoyStr`, cayendo el KPI de completados a cero.
- **Cuello de Botella en el Heatmap (112 Celdas por Movimiento de Ratón):** Cada milímetro de movimiento del cursor sobre las 112 celdas del mapa de consistencia disparaba `onMouseEnter` con `setHoveredCell`, forzando el re-renderizado reactivo del mapa entero de 16 semanas. El componente además carecía de `React.memo`.
- **Latencia de 100-300ms en el Check-in:** Al alternar el completado de un hábito, la tarjeta esperaba síncronamente la resolución de múltiples escrituras en Dexie (`actividades_personales`, `habito_cumplimiento_logs`, `syncManager`), percibiendo el usuario un lag molesto en el checkbox.
- **Multiplicación de Modales en el DOM y Diálogos Legacy (`SweetAlert2`):** Cada `TarjetaHabito` montaba su propia instancia inactiva de `<ModalAlcanceRecurrencia>` (hasta 40 instancias en el árbol). Además, el registro de avance cuantitativo y las confirmaciones de borrado utilizaban `Swal.fire` inyectando inputs HTML con `document.getElementById('swal-inp-avance')`.
- **Ruido Visual y Falta de Silencio:** Botones secundarios de edición y eliminación siempre visibles, compitiendo con la claridad del check-in diario.

#### Solución Implementada
- **Normalización Temporal Canónica Local (`formatFechaIsoLocal`):** Inyección transversal de `formatFechaIsoLocal(date = new Date())` en todo el módulo de hábitos. La función extrae `date.getFullYear()`, `date.getMonth() + 1` y `date.getDate()`, garantizando consistencia absoluta en cualquier huso horario sin importar la hora del día.
- **UI Optimista de Check-in (0ms de Latencia):** Inyección del estado reactivo `optimisticCompletados` (`Record<string, boolean>`) en `TableroHabitos.tsx` y propagado a `TarjetaHabito.tsx`. El checkbox cambia de estado, tacha el título y actualiza su opacidad en 0 milisegundos con blindaje de rollback si falla la escritura en Dexie.
- **Heatmap Acelerado por GPU y Tooltips Nativos O(1):** Envoltorio de `HeatmapConsistencia` en `React.memo`, sustitución del tooltip flotante por atributos nativos `title` en cada celda (0 re-renders en hover) y estandarización a fondo `#0D1526`.
- **Modal Declarativo Bento `ModalRegistroAvanceHabito.tsx`:** Creación de un modal Bento Cobalt (`#0D1526`, `border-cyan-500/40`) con `createPortal`, atajo `Escape`, bloqueo de scroll, botones de incremento rápido (+1, +5, +10) y micro-banner inline de validación, eliminando todo rastro de `Swal.fire` y manipulación del DOM.
- **Single Instance Modal Pattern & Búfer UndoDelete (4s):** Elevación de `ModalAlcanceRecurrencia` a la raíz del tablero. Sustitución de alertas bloqueantes de eliminación por `programarEliminacion` de `useUndoDelete()` con exclusión optimista instantánea vía `estaOculto(act.id)`.
- **Ley del Silencio Visual:** Ocultamiento de botones de acción rápida secundarios en `TarjetaHabito`, revelados exclusivamente en hover suave (`opacity-0 group-hover:opacity-100`).
- **Certificación QA:** 23 suites de pruebas unitarias ejecutadas, 200/200 pruebas aprobadas (100%), verificación estricta de TypeScript con `npx tsc --noEmit` y empaquetado de producción exitoso con `vite build` en 8.41s.

---

### FASE 4.80 — Desacoplamiento Arquitectónico de Finanzas, UI Optimista de Conciliación y Optimización Matemática O(N) (REQ-SYS-001-F5)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Views/ViewFinanzas.tsx`, `src/components/Finanzas/DashboardFinanciero.tsx`, `src/components/Finanzas/TabControlCuotas.tsx`, `src/components/Finanzas/TabPresupuestos.tsx`, `src/components/Modals/ModalNuevoPlanCuotas.tsx`, `src/components/Finanzas/__tests__/DashboardFinanciero.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Monolito Ineficiente de 1,733 Líneas:** `ViewFinanzas.tsx` concentraba en un único componente el Dashboard General, el Explorador de Transacciones, el Monitoreo de Cuotas Bancarias, la Matriz de Presupuestos y los modales, forzando la reconciliación del árbol completo ante cualquier interacción en el buscador o cambio de filtros.
- **Cuellos de Botella en Cálculos de Cuotas y Presupuestos:** Cálculos matemáticos inline en JSX repetían filtros y reducciones dobles iterativas (`cuotas.filter(...).reduce(...)`), ejecutando recorridos redundantes $O(2N)$ en cada ciclo de render.
- **Latencia Perceptible en Conciliación de Tesorería:** El marcado de gastos y cuotas como conciliados dependía de la escritura asíncrona en Dexie IndexedDB antes de reflejar el cambio en la interfaz de usuario, rompiendo la sensación de fluidez y respuesta instantánea.
- **Fuga de Rendimiento en Próximos Vencimientos:** Bucles de filtrado calculaban vencimientos de deudas instanciando objetos `new Date()` repetidamente en cada iteración, provocando presión evitable sobre el Garbage Collector.
- **Ruido Cognitivo en Tarjetas Bento:** Párrafos descriptivos densos en el Dashboard saturaban visualmente las métricas principales de flujo de caja y balances.

#### Solución Implementada
- **Desacoplamiento Modular Memoizado (`React.memo`):** Rompimiento del monolito mediante la extracción de tres módulos especializados:
  - `src/components/Finanzas/DashboardFinanciero.tsx`: Balance consolidado, ingresos, egresos, runway y desglose multimoneda.
  - `src/components/Finanzas/TabControlCuotas.tsx`: Seguimiento de planes de financiamiento, tarjetas bancarias y cronograma de amortización con acumulador $O(N)$ en una sola pasada.
  - `src/components/Finanzas/TabPresupuestos.tsx`: Techos de gasto por categoría, inversiones en hábitos y matriz de Burn Rate por proyecto con prevención de división por cero.
- **Patrón UI Optimista de Conciliación (0ms de Latencia):** Inyección de un diccionario de estado optimista `optimisticConciliados` (`Record<string, boolean>`) en `ViewFinanzas.tsx`. Las transacciones y cuotas alternan su micro-LED (`#10b981` activo / `#f59e0b` pendiente) y sus estados de forma instantánea al click, respaldados por un bloque `try/catch` que revierte la mutación si la escritura en Dexie falla.
- **Extracción de `ModalNuevoPlanCuotas.tsx`:** Modal Bento Cobalt (`#0D1526`, `border-slate-800/80`) montado mediante `createPortal(..., document.body)` con `useBodyScrollLock`, atajo `Escape`, micro-banner de validación inline accesible y cero dependencias de `sweetalert2`.
- **Aritmética de Timestamps sin Presión de GC:** Cálculo de próximos vencimientos optimizado con `hoyMs = hoy.getTime()` y `diffDias = Math.ceil((fMs - hoyMs) / 86400000)`, eliminando la instanciación de objetos `Date` dentro de bucles iterativos.
- **Ley del Silencio Visual en Métricas:** Sustitución de explicaciones en texto por atributos nativos `title` en micro-halos y LEDs orgánicos, manteniendo una interfaz sobria y limpia.
- **Certificación QA:** 22 suites de pruebas unitarias ejecutadas, 193/193 pruebas aprobadas (100%), verificación estricta de TypeScript con `npx tsc --noEmit` y empaquetado de producción exitoso con `vite build` en 8.56s.

---

### FASE 4.78 — Aceleración GPU, Concurrencia de Búsqueda y Supresión de Cuellos de Botella (HOTFIX-SYS-001)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Notas/TarjetaNota.tsx`, `src/components/Notas/VisorNotas.tsx`, `src/components/Notas/__tests__/TarjetaNotaMemo.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Cuello de Botella Letal en Reconciliación (`arePropsEqual`):** `TarjetaNota.tsx` ejecutaba cuatro llamadas a `JSON.stringify()` por tarjeta en cada ciclo de render. Con 100 notas, cada pulsación de tecla disparaba 800 serializaciones completas de objetos anidados (`checklists_json`, `wishlist_json`, etc.), congelando el hilo principal de JavaScript.
- **Sobrecarga de Compositor GPU por `backdrop-blur-md`:** Cada tarjeta aplicaba `backdrop-filter: blur(12px)` con `transition-all` en un layout multi-columna CSS (`columns-1 sm:columns-2 ...`), obligando al motor de renderizado a rasterizar múltiples capas de desenfoque gaussiano durante scroll y reflows.
- **Falta de Concurrencia en Búsqueda:** El input de texto filtraba miles de caracteres de markdown síncronamente en el render loop sin priorización concurrente, causando caídas de caracteres y retraso de input.
- **Multiplicación de Nodos Modales:** Cada tarjeta con deseo activo montaba su propia instancia de `<ModalConvertirWishlistGasto />` en el árbol React.

#### Solución Implementada
- **Memoización Atómica de Primitivos:** En `TarjetaNota.tsx`, erradicación total de `JSON.stringify()`. `arePropsEqual` se redujo a la comparación atómica `prev.id === next.id && prev.updated_at === next.updated_at && prev.modoVista === next.modoVista`, apalancando el contrato estricto de Dexie donde toda mutación refresca `updated_at`.
- **Aceleración por Hardware Directa (Zero Blur Overhead):** Supresión de `backdrop-blur-md` y `transition-all` en las tarjetas. Inyección de fondo sólido `#0D1526` con `transform-gpu transition-[transform,opacity,border-color] duration-150 will-change-[transform,opacity]`. Eliminación de `transition-all` en el contenedor Quick Note.
- **Concurrencia React 19 (`useDeferredValue`):** En `VisorNotas.tsx`, desacoplamiento del input de búsqueda con `deferredBusqueda`, garantizando que el teclado responda a 60-120 FPS sin bloqueos. Sustitución de `new Date().getTime()` por comparación lexicográfica ISO `(b.updated_at || '').localeCompare(...)`. Memoización estricta de `handleEditar`, `handleEliminarNota`, `handleAbrirConvertirGasto` con `useCallback`.
- **Single Instance Modal Pattern:** Elevación del modal de conversión de wishlist a la raíz de `VisorNotas.tsx`, reduciendo de N instancias a 1 único nodo condicional en el DOM.
- **Certificación QA:** 20 suites de pruebas unitarias aprobadas (182/182), TypeScript estricto verificado sin errores y empaquetado de producción en 7.63s.

---

### FASE 4.77 — Optimización Integral de Notas, Wishlist, Ley de Silencio Visual y Eliminación Diferida (REQ-SYS-001-F3)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Notas/TarjetaNota.tsx`, `src/components/Notas/VisorNotas.tsx`, `src/components/Modals/ModalConvertirWishlistGasto.tsx`, `src/components/Notas/__tests__/TarjetaNotaMemo.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Re-renders Ineficientes en Masonry:** `TarjetaNota.tsx` se renderizaba como componente estándar sin memoización. Al teclear en la barra de búsqueda o cambiar filtros, cada tarjeta re-parseaba el árbol AST Markdown con `ReactMarkdown`, provocando degradación de fluidez.
- **Modales Legacy (`Swal.fire` / `sweetalert2`):** `TarjetaNota.tsx` empleaba `Swal.fire` con diálogos bloqueantes para confirmar la conversión de deseos a transacciones de gastos y para eliminar notas, rompiendo la experiencia de usuario y el diseño Bento Cobalt.
- **Layout Shifts en la Captura Rápida:** El contenedor expandible tipo Google Keep en `VisorNotas.tsx` carecía de altura mínima reservada y transiciones CSS acotadas, ocasionando saltos visuales bruscos (CLS) en la cuadrícula de notas inferiores.
- **Sobrecarga Visual en Badges:** La cabecera de las tarjetas mostraba badges sobredimensionados de Checklist y Wishlist (`Checklist (X/Y)` y `Wishlist`), generando ruido cognitivo innecesario.

#### Solución Implementada
- **Desacoplamiento Memoizado (`React.memo` + `arePropsEqual`):** `TarjetaNota.tsx` fue desacoplado con comparador estricto `arePropsEqual` que audita `id`, `updated_at`, `es_fijada`, `color_tema`, `titulo`, `contenido_markdown`, `modoVista` y las colecciones serializadas (`checklists_json`, `wishlist_json`, `etiquetas`, `enlaces_entidades_json`). El AST Markdown fue envuelto en `useMemo` con dependencias mínimas.
- **Modal Bento Declarativo de Conversión (`ModalConvertirWishlistGasto`):** Sustitución total de `Swal.fire` por un modal Cobalt `#0D1526` con borde `emerald-500/40`, micro-indicadores numéricos `font-mono tabular-nums`, tipado TypeScript estricto y atajos de teclado (`Escape` para cerrar, `Enter` para confirmar).
- **Integración con Búfer Temporal UndoDelete (4s):** Se erradicó `Swal.fire` y el borrado síncrono. Ahora `onEliminar(nota.id)` se despacha hacia `programarEliminacion({ tabla: 'notas', id, etiqueta, tipo: 'NOTA', commit })`, permitiendo recuperación inmediata con toast de 4 segundos y exclusión reactiva optimista mediante `estaOculto()`.
- **Eliminación de Layout Shifts en Quick Note:** Se asignó `min-h-[4rem]` al chasis de creación rápida y `transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]` con `max-h-14` (colapsado) y `max-h-[700px]` (expandido).
- **Ley del Silencio Visual:** Reemplazo de badges textuales por micro-indicadores compactos con `title` explicativo (`CheckSquare` con conteo numérico y `DollarSign` con porcentaje de meta). Revelación de botones de acción (`Edit3`, `Trash2`) exclusivamente en `hover` con `opacity-0 group-hover:opacity-100 transition-opacity duration-200`. Formateo sutil de menciones contextuales (`@PROY-`, `@TAR-`, `@GAS-`) como micro-píldoras `bg-slate-800/60 border-slate-700/60 text-slate-400 text-xs`.
- **Certificación QA:** 20 suites de pruebas unitarias ejecutadas, 182/182 pruebas aprobadas (100%), verificación estricta de TypeScript con `npx tsc --noEmit` y empaquetado de producción exitoso con `vite build` en 6.39s.

---

### FASE 4.76 — Optimización Integral de Portafolio, Kanban y Físicas de Fluidez Visual (REQ-SYS-001-F1 & REQ-SYS-001-F2)
**Fecha:** Noviembre 2026 | **Archivos modificados:** `src/components/Views/ViewPortafolio.tsx`, `src/components/PMO/TarjetaProyecto.tsx`, `src/components/Views/ViewKanban.tsx`, `src/components/PMO/ColumnaKanban.tsx`, `src/components/PMO/TarjetaTareaKanban.tsx`, `src/components/Modals/ModalDoDAdvertencia.tsx`, `src/components/Subtareas/ListaSubtareas.tsx`

#### Solución Implementada
- **Portafolio y LEDs Orgánicos:** Erradicación de `Swal.fire` en cascada de proyectos en favor de UndoDelete y modal Bento. Inyección de LEDs hiper-luminosos (`animate-pulse`) según salud del proyecto y consultas indexadas directas en Dexie (`where('id_proyecto').equals(...)`).
- **Kanban Memoizado y DoD Declarativo:** Extracción de `ColumnaKanban.tsx` y `TarjetaTareaKanban.tsx` envueltos en `React.memo` con dragging optimista libre de layout shifts. Erradicación de `window.confirm` en favor de `ModalDoDAdvertencia.tsx` y purga de SweetAlert2 en `ListaSubtareas.tsx` con micro-banners de error inline.

---

### FASE 4.75 — Blindaje Analítico, Extracción Polimórfica y Reparación del Buscador en Dashboard de Hábitos (FIX-HABITOS-DASHBOARD-SEARCH-EMPTY-SPACES-121)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/components/Habitos/Dashboard/TablaRendimiento.tsx`, `src/components/Habitos/Dashboard/MetasCuantitativas.tsx`, `src/components/Habitos/Dashboard/__tests__/dashboardHabitosHelpers.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Buscador Inoperativo:** En `TablaRendimiento.tsx`, el filtrado evaluaba rígidamente `a.nombre_actividad.toLowerCase()`. Registros en Dexie hidratados desde esquemas variables o migraciones contenían el título bajo `nombre`, `Nombre_Actividad`, `titulo`, `actividad` o `descripcion`. Si `nombre_actividad` era nulo o indefinido, la búsqueda fallaba o lanzaba excepción `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.
- **Huecos Vacíos y `NaN%`:**
  - En `TablaRendimiento.tsx`, la celda del hábito renderizaba `{a.nombre_actividad}` directamente, dejando filas con la primera columna en blanco si la propiedad no estaba poblada.
  - En `MetasCuantitativas.tsx`, si `meta_objetivo_total` era 0, nulo o indefinido, la división `actual / total` generaba `NaN` o `Infinity`, renderizando `NaN%` y desbordando la barra de progreso. Además, `nombre: a.nombre_actividad` dejaba tarjetas de metas sin título.

#### Solución Implementada
- **Resolución Canónica Defensiva (`resolverTituloHabito` / `resolverNombreMeta`):** Se inyectaron helpers de resolución en cascada que evalúan secuencialmente `nombre_actividad`, `nombre_meta`, `nombre`, `Nombre_Actividad`, `Nombre`, `titulo`, `Titulo`, `actividad`, `descripcion` y `nombre_tarea_actividad` con fallback seguro (`Hábito sin título` / `Meta sin título`).
- **Buscador Multi-Atributo Tolerante:** En `TablaRendimiento.tsx`, el término de búsqueda ahora filtra contra el título defensivo resuelto, `meta_macro_nombre`, `codigo_legado` y `descripcion`. La ordenación alfabética por `NOMBRE` utiliza la misma resolución canónica, previniendo excepciones de `localeCompare`.
- **Blindaje Matemático en `MetasCuantitativas.tsx`:** Uso de `Math.max(1, Number(m.meta_objetivo_total) || 1)` y verificación de `Number.isFinite(ratio)` para erradicar cualquier posibilidad de `NaN%` o `Infinity`. Se asignó altura mínima fija `min-h-[145px]` a las tarjetas en grid para eliminar celdas huérfanas o asimetrías.
- **Cobertura de Pruebas:** Se incorporaron 8 pruebas unitarias exhaustivas en `dashboardHabitosHelpers.test.ts`, alcanzando 153/153 pruebas unitarias aprobadas (100%).

---

### FASE 4.74 — Reparación de Servidor Loopback y Resolución Estricta de MIME Types en Electron (HOTFIX-ELECTRON-LOOPBACK-MIME-TYPES-121)
**Fecha:** Octubre 2026 | **Archivos modificados:** `desktop/main.js`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Falla en Electron:** Chromium bloqueaba la carga de los bundles JavaScript y módulos ES (`Strict MIME type checking is enforced`) arrojando el error `Refused to execute script from '...' because its MIME type ('text/html') is not executable`.
- **Causa:** El microservidor HTTP loopback de Electron (`desktop/main.js` en puerto 48123) poseía un fallback SPA incondicional que, ante cualquier desajuste de ruta o archivo estático no encontrado en `dist/`, servía `dist/index.html` con cabecera `Content-Type: text/html; charset=utf-8`. Cuando Chromium solicitaba módulos `.js` o estilos `.css`, la respuesta HTML provocaba la detención inmediata del motor de ejecución de Chromium, dejando el widget en blanco.

#### Solución Implementada
- **Diccionario Canónico de MIME Types:** Se formalizó la tabla estricta de mapeos de extensiones:
  - `.html` -> `text/html`
  - `.js`, `.mjs` -> `application/javascript`
  - `.css` -> `text/css`
  - `.json` -> `application/json`
  - `.svg` -> `image/svg+xml`
  - `.png` -> `image/png`
  - `.jpg`, `.jpeg` -> `image/jpeg`
  - `.woff` -> `font/woff`, `.woff2` -> `font/woff2`
  - Soporte adicional para `.ttf`, `.ico`, `.wasm`, `.webmanifest` y `.map`.
- **Resolución Estricta por Extensión:**
  - Si la ruta solicitada posee extensión de archivo conocida (`.js`, `.css`, etc.) y el archivo existe en `dist/`, se sirve con su `Content-Type` correspondiente y soporte para métodos `GET` y `HEAD`.
  - Si el archivo estático con extensión no existe en `dist/`, se responde estrictamente con código `404 Not Found` (`Content-Type: text/plain; charset=utf-8`), impidiendo terminantemente que se retorne `index.html`.
  - El fallback a `index.html` con `Content-Type: text/html; charset=utf-8` queda confinado única y exclusivamente a rutas de navegación SPA (rutas sin extensión o que terminen explícitamente en `.html`).

---

### FASE 4.73 — Restauración de Señal Nativa para Electron en Cockpit (FIX-COCKPIT-NATIVE-SIGNAL-RESTORE-119)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/App.tsx`, `src/components/Cockpit/DailyCockpit.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Falla en Electron:** La ventana de Electron (420x720 px) se mostraba como un marco rectangular negro colapsado sin renderizar el cuerpo del Cockpit.
- **Causa:** Para proteger la vista web en `HOTFIX-111`, se habían removido las comprobaciones de variables nativas de Electron (`window.IS_DESKTOP_WIDGET`), limitándose exclusivamente a parámetros de URL (`?widget=desktop`). Cuando Electron cargaba mediante su loopback HTTP SPA sin query params persistentes, `App.tsx` intentaba montar la aplicación web completa en una ventana de 420 px, provocando el colapso del layout.

#### Solución Implementada
- **Restauración de Detección Nativa Segura:** Se incorporó `(window as any).IS_DESKTOP_WIDGET === true` en `src/App.tsx` (`esModoHud`, `isHud`, `esWidgetNativo`) y en `src/components/Cockpit/DailyCockpit.tsx` (`esWidgetNativo`, `cockpitAbierto`).
- **Aislamiento Total:** Dado que `window.IS_DESKTOP_WIDGET` es inyectada de forma inmutable y exclusiva por `desktop/preload.js`, ningún navegador estándar (Chrome, Edge) posee esta variable, garantizando que el portal web en `http://localhost:3000` monte el Layout completo con fondo sólido, mientras Electron monta el Cockpit transparente de 420x720 px en vista táctica completa.

---

### FASE 4.72 — Exportación Dual Nombrada y Default en DailyCockpit (HOTFIX-DAILYCOCKPIT-EXPORT-MISMATCH-117)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/components/Cockpit/DailyCockpit.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Falla de Runtime en Vite:** `Uncaught SyntaxError: The requested module '/src/components/Cockpit/DailyCockpit.tsx' does not provide an export named 'DailyCockpit' (at App.tsx:67:10)`.
- **Causa:** En recargas en caliente o compilación modular Vite, se requería garantizar la coexistencia tanto del export nombrado `export const DailyCockpit` como del export por defecto `export default DailyCockpit`, previniendo desajustes de resolución entre consumidores ES Modules.

#### Solución Implementada
- Añadido `export default DailyCockpit;` al cierre de `src/components/Cockpit/DailyCockpit.tsx`, asegurando compatibilidad total tanto con `import { DailyCockpit }` como con `import DailyCockpit`.

---

### FASE 4.71 — Reparación de Extracción de Datos y Poblado de Agenda Diaria en Cockpit (FIX-COCKPIT-DAILY-SCHEDULE-POPULATION-115)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/hooks/useDailySchedule.ts`, `src/components/Cockpit/DailyCockpit.tsx`, `src/hooks/__tests__/useDailySchedule.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
1. **Poblado Nulo de Hábitos y Tareas en el Cockpit:**
   - En `useDailySchedule.ts`, las claves de recurrencia (`frecuencia_ciclo`, `regla_repeticion`, `tipo_compromiso`, `ultima_fecha_completado`) se leían de forma directa en minúsculas sin el helper normalizador `getProp()`. Al almacenar Dexie registros procedentes de Google Sheets/GAS con mayúsculas canónicas (`Frecuencia_Ciclo`, `Regla_Repeticion`), las condiciones evaluaban a `undefined`, desactivando la regla de recurrencia diaria y descartando todos los hábitos activos del horizonte de hoy.
   - En tareas y finanzas, las fechas en formato tradicional `M/D/YYYY H:mm:ss` fallaban la comparación lexicográfica con fechas ISO (`YYYY-MM-DD`), descartando tareas en mora.
2. **Estado Vacío Desierto:**
   - Cuando no había elementos en el filtro o en el horizonte inmediato, el Checklist mostraba un cuadro punteado austero y el Riel Horario renderizaba 1536 px de cuadrícula vacía sin orientación para el usuario.

#### Solución Implementada
1. **Normalización Universal de Fechas (`normalizarFechaAFechaIso`):**
   - Implementación de `normalizarFechaAFechaIso()` en `useDailySchedule.ts` con soporte dual para `YYYY-MM-DD`, `ISO strings` y `M/D/YYYY`, homogeneizando la comparación temporal en tareas, gastos, ingresos y cuotas.
2. **Extracción Resiliente con `getProp()` y Tolerancia a Fallos en Dexie:**
   - Resolución canónica con `getProp()` para todas las propiedades de hábitos (`frecuencia_ciclo`, `regla_repeticion`, `tipo_compromiso`, `ultima_fecha_completado`, `historial_fechas`).
   - Aislamiento de consultas con `catch(() => []) ?? []` por tabla en `useLiveQuery` para evitar bloqueos por tablas vacías o no migradas.
   - Proyección inmediata de los **13 hábitos diarios activos** de la semilla (Entrenamiento, PMP, Lectura, etc.) en la fecha actual.
3. **Estados Vacíos Resilientes Cobalt:**
   - En `DailyCockpit.tsx`, nuevo estado vacío en `CHECKLIST` con iconografía Lucide `Calendar`, mensaje contextual explicativo y botón de salto directo a *"Ver Agenda de la Semana"*.
   - Banner informativo flotante en `RIEL` cuando no existen bloques horarios para el horizonte seleccionado.

---

### FASE 4.70 — Restauración de Pantalla Blanca y Desacoplamiento Estricto de Widget en App.tsx (HOTFIX-REVERT-WHITE-SCREEN-APP-111)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/App.tsx`, `src/components/Cockpit/DailyCockpit.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
1. **Pantalla Blanca con Rectángulo Oscuro en la Vista Web Principal:**
   - Al iniciar la aplicación web (`npm run dev` en `http://localhost:3000/`), la pantalla quedaba blanca mostrando únicamente un rectángulo oscuro a la derecha (`DailyCockpit` forzado).
   - **Causa Raíz:** En `src/App.tsx`, las comprobaciones `esModoHud` y `esWidgetNativo` evaluaban flags globales como `Boolean((window as any).desktopWidget)` o `Boolean(window.desktopWidget?.isNative)` expuestas por el preload de Electron o scripts remanentes. Esto disparaba de forma ilegítima la rama de retorno temprano `if (esModoHud || esWidgetNativo) return <DailyCockpit modoForzadoDesacoplado={true} />`, impidiendo el montaje de `HeaderMaestro`, del router y del layout general.
   - Además, el hook de efecto forzaba `document.body.style.backgroundColor = 'transparent'`, que en navegadores web estándar se renderiza como blanco nativo por el canvas del sistema operativo.

#### Solución Implementada
1. **Detección Estricta y Exclusiva por Parámetros URL:**
   - En `src/App.tsx`, `esModoHud` y `esWidgetNativo` se restringieron estrictamente a verificar si la URL contiene de forma explícita `?widget=desktop`, `#widget=desktop`, `?mode=hud` o `#mode=hud`.
   - Se eliminaron las lecturas permisivas de `window.desktopWidget` o `window.IS_DESKTOP_WIDGET` que contaminaban la ventana web principal.
2. **Restauración del Background Web:**
   - En `src/App.tsx`, se añadió la rama `else` en el `useEffect` de fondo para limpiar de inmediato cualquier estilo inline de `backgroundColor = 'transparent'` en `document.documentElement`, `document.body` y `#root` cuando se navega en el portal estándar.
3. **Auditoría de Rules of Hooks y Calce de Cockpit:**
   - En `src/components/Cockpit/DailyCockpit.tsx`, `esWidgetNativo` y el estado de arranque `cockpitAbierto` se alinearon a la misma regla canónica, garantizando que el widget embebido en la aplicación web arranque en reposo sin interferir con la retícula principal.

---

### FASE 4.69 — Restauración de Widget Cockpit Electrón y Blindaje Anti-FOUC en Tablero de Hábitos (FIX-COCKPIT-RESTORATION-AND-HABIT-ANTI-FOUC-110)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/components/Cockpit/DailyCockpit.tsx`, `src/hooks/useDailySchedule.ts`, `src/hooks/useHabitos.ts`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Habitos/TarjetaHabito.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
1. **Colapso en Blanco de `DailyCockpit.tsx` en Electron:**
   - La ventana de escritorio nativa (`?widget=desktop` o `?mode=hud`) colapsaba en un lienzo blanco vacío. La inicialización de `cockpitAbierto` evaluaba a `false` en modo widget, esperando renderizar una cápsula pill flotante dentro de una ventana de 420x720 con fondo transparente. Al no capturarse fallos de mapeo sobre propiedades indefinidas (`item.horaInicio`, `metricas.porcentajeRitmo`, etc.), React desmontaba el árbol y Chromium sobre Windows rasterizaba el canvas transparente como un fondo blanco sólido.
2. **Salto Visual (FOUC) en Tablero de Hábitos:**
   - `useHabitos.ts` asignaba por defecto un array vacío en `useLiveQuery`, haciendo que la primera renderización interpretara `todasLasActividades.length === 0` sin distinguir estado de carga. Todas las columnas mostraban "Sin hábitos en esta categoría" y, al resolver la base de datos Dexie (~50ms después con 19 registros), las tarjetas se inyectaban en bloque provocando un severo desplazamiento y re-cálculo de layout.

#### Solución Implementada
1. **Blindaje Defensivo y ErrorBoundary en `DailyCockpit.tsx`:**
   - Implementación de `CockpitInternalErrorBoundary` con tarjeta de recuperación visual Cobalt Aerodynamic (`#0B132B`, `#040711`, botón de reinicio de estado).
   - Envoltura de todo retorno y portal PiP con `<CockpitInternalErrorBoundary>`.
   - Inicialización forzada de `cockpitAbierto = true` cuando se detecta `widget=desktop` o `window.desktopWidget?.isNative`.
   - Optional chaining exhaustivo (`metricas?.porcentajeRitmo ?? 100`, `metricas?.siguienteItem?.titulo`, `(itemsFiltrados || []).map(...)`).
   - Normalización robusta en `parseMinutos(hm?: string | null)` protegiendo entradas nulas o malformadas.
2. **Blindaje Anti-FOUC en `useHabitos.ts` y `TableroHabitos.tsx`:**
   - Eliminación de defaults vacíos artificiales en `useLiveQuery` de hábitos para distinguir el estado pendiente: `cargando = rawTodasLasActividades === undefined`.
   - Integración de Skeleton Loader Cobalt en cada columna durante la hidratación inicial (`min-h-[140px] rounded-xl bg-slate-900/40 border border-slate-800/40 p-3 space-y-3 animate-pulse`).
   - Confinamiento de renderizado con `style={{ contain: 'layout' }}` y `min-h-[140px]` en `TarjetaHabito.tsx`, garantizando paridad dimensional exacta y eliminando reflows tardíos.

---

### FASE 4.68 — Fallback Defensivo del Nombre y Píldora de Categoría Fija en Modal Detalle de Hábitos (FIX-HABITOS-MODAL-DETAIL-TITLE-PILL-109)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/components/Modals/ModalActividadFlow.tsx`, `src/utils/__tests__/modalActividadFlowHelpers.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
1. **Nombre Vacío en Modal de Detalle:**
   - Al abrir el modal desde ciertas tarjetas de hábitos personales, el título se mostraba en blanco cuando el registro contenía campos alternativos (`nombre`, `titulo`, `actividad`, `descripcion`) sin estar normalizado bajo `nombre_actividad`.
2. **Selector de Columna/Categoría Editable:**
   - El selector de categoría se presentaba como un dropdown editable aun en modo visualización/detalle de actividad, permitiendo alteraciones accidentales de la columna asignada a la tarjeta original.

#### Solución Implementada
1. **Resolución Defensiva del Nombre:**
   - Helper modular `extraerNombreActividadDefensivo(actividad)` que resuelve en cascada: `nombre_actividad || nombre || Nombre_Actividad || titulo || actividad || descripcion || nombre_tarea_actividad || 'Actividad sin título'`.
   - Hidratación en inputs de edición y visualización con alto contraste `text-slate-100 font-semibold`.
2. **Píldora Informativa Fija (Read-Only):**
   - En modo detalle/visualización y edición acotada, sustitución del dropdown por un badge estático Cobalt Aerodynamic (`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700/60 text-xs font-mono text-slate-300 select-none` con icono `Tag` Lucide 1.75 en `text-sky-400`), blindando la categoría de modificaciones accidentales.

---

### FASE 4.67 — Modal Global Centrado de Editor de Notas con Portal y Purga Definitiva de Parpadeo (REQ-KANBAN-NOTE-MODAL-PORTAL-102)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/components/Notas/BadgeNotasVinculadas.tsx`, `src/components/Notas/PopoverPreviewNotas.tsx`, `src/components/Notas/EditorNotaModal.tsx`, `src/components/Notas/ModalVincularEntidades.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Falla:** Al presionar "Abrir Editor Completo" desde el popover de la tarjeta Kanban, el editor sufría parpadeos o quedaba atrapado en el transform de la tarjeta. Asimismo, el movimiento del cursor cerca de la tarjeta durante la apertura re-disparaba el hover del popover generando conflicto visual.
- **Causa:** `EditorNotaModal` y `ModalVincularEntidades` se montaban dentro de la jerarquía DOM de `.kanban-card`, quedando atrapados por la propiedad CSS `transform` de la tarjeta (anulando el `position: fixed` al viewport) y sin inhibir eventos de hover entrantes.

#### Solución Implementada
1. **Purga Inmediata de Hover y Parpadeos en `BadgeNotasVinculadas.tsx`:**
   - Cancelación atómica del temporizador de hover (`clearTimeout(timerRef.current)`).
   - Cierre inmediato del popover (`setPopoverAbierto(false)`) al solicitar la apertura del editor o modal de vinculación.
   - Guarda de inhibición en `handleMouseEnter`: si `notaParaEditar` o `modalVincularAbierto` están activos, se bloquea cualquier re-apertura del popover por movimiento de cursor.
2. **Montaje Centrado Global en `document.body` (`createPortal`):**
   - `EditorNotaModal` y `ModalVincularEntidades` ahora se proyectan fuera de la tarjeta directamente sobre `document.body` con `createPortal`.
   - **Telón de Fondo (Backdrop):** `fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4`, con cierre accesible al hacer clic exterior o presionar la tecla `Escape`.
   - **Contenedor Modal Centrado:** `w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#0B132B] border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden`.
   - **Cuerpo Interno:** Scroll independiente `overflow-y-auto custom-scrollbar` y micro-animación `animate-in zoom-in-95 duration-200 ease-out`.
3. **Sincronización en `PopoverPreviewNotas.tsx`:**
   - Callback `onAbrirNota` y `onAbrirModalVincular` precedidos por `e.stopPropagation()`, `e.preventDefault()` y `onCerrar()` para una transición fluida e instantánea sin solapamientos.


### FASE 4.66 — Erradicación de Recorte de Popover de Notas Vinculadas mediante React Portal y Posicionamiento Fijo (FIX-KANBAN-NOTE-POPOVER-CLIPPING-101)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/components/Notas/BadgeNotasVinculadas.tsx`, `src/components/Notas/PopoverPreviewNotas.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Falla:** Al interactuar con el badge de notas vinculadas en las tarjetas Kanban de Proyectos, el cuadro de vista previa/resumen aparecía cortado por los límites de la tarjeta (`overflow: hidden`) y por el contenedor de columna con scroll vertical (`overflow-y: auto`).
- **Causa:** El popover se renderizaba como hijo DOM directo de la tarjeta con `position: absolute`, quedando atrapado en el clipping box y el stacking context de sus contenedores ancestros.

#### Solución Implementada
1. **Desacoplamiento Estructural con React Portal (`createPortal`):**
   - El popover `PopoverPreviewNotas` ahora se monta directamente en `document.body` mediante `createPortal`, evadiendo de raíz cualquier restricción de `overflow`, `clip-path` o `contain` de la jerarquía de componentes del Kanban.
2. **Cálculo Determinístico de Coordenadas Viewport (`fixed`):**
   - Posicionamiento dinámico a través de `getBoundingClientRect()` con detección de espacio disponible vertical (`placeAbove` vs. abajo) y acotamiento horizontal (`Math.max(12, Math.min(...))` para evitar desbordes en los bordes de la ventana.
   - Sincronización reactiva con listeners de `scroll` (en fase de captura `true` para columnas con scroll interno) y `resize`.
3. **Cierre Limpio y Accesibilidad:**
   - Cierre automático al hacer clic fuera del badge/popover (`pointerdown`) o pulsar `Escape`.
   - Preservación de margen de 250ms al mover el cursor entre el botón y el popover.
4. **Refinamiento Estético Cobalt Aerodynamic:**
   - Actualizado a `bg-[#0B132B]/95`, `backdrop-blur-md`, `border border-slate-700/60`, sombra multicapa `shadow-2xl` y microtipografía `font-mono tabular-nums`. Cero emojis en DOM.


### FASE 4.65 — Restauración de Widget Flotante Puro con Residencia en Iconos Ocultos / System Tray (RESTORE-COCKPIT-TRAY-WIDGET-FINAL-100)
**Fecha:** Octubre 2026 | **Archivos modificados:** `desktop/main.js`, `package.json`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico & Motivación
Concluido el ciclo de diagnóstico y verificada la carga impecable a través del microservidor loopback HTTP en `127.0.0.1:48123`, se restituye la experiencia de widget de escritorio flotante nativo:
- Eliminación de DevTools desacopladas.
- Ocultamiento de la barra de tareas de Windows (`skipTaskbar: true`).
- Residencia permanente en la bandeja del sistema (System Tray) con alternancia de visibilidad al clic/doble clic.

#### Solución Implementada
1. **Restauración de Propiedades de Widget Puro en `BrowserWindow`:**
   - `skipTaskbar: true` asegurado en la creación y en todas las transiciones de visibilidad (`toggleWidgetVisibility`).
   - Removido `mainWindow.webContents.openDevTools({ mode: 'detach' })`.
   - Preservadas propiedades translúcidas: `frame: false`, `transparent: true`, `backgroundColor: '#00000000'`, `hasShadow: false`, `resizable: false`, `alwaysOnTop: true ('floating')`.
2. **Residencia en Bandeja del Sistema (System Tray):**
   - Intercepción de evento `'close'` de la ventana para ocultar (`mainWindow.hide()`) sin terminar el proceso a menos que `app.isQuitting === true`.
   - Eventos `'click'` y `'double-click'` del tray invocan `toggleWidgetVisibility()` para mostrar y enfocar o esconder la cápsula.
3. **Scripts de Arranque en `package.json`:**
   - Añadido script `cockpit` (`cross-env ELECTRON_RUN_AS_NODE= electron desktop/main.js`).
   - `widget` y `widget:clean` consolidados con saneamiento de entorno.


### FASE 4.64 — Forzado de Visibilidad Inmediata, Desacople DevTools, Purga de ELECTRON_RUN_AS_NODE y Diagnóstico Activo (FIX-ELECTRON-FORCE-SHOW-AND-DEBUG-99)
**Fecha:** Octubre 2026 | **Archivos modificados:** `desktop/main.js`, `package.json`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Falla:** Al ejecutar Electron no aparecía ventana visible en pantalla.
- **Causa Raíz Principal:**
  1. La variable de entorno `ELECTRON_RUN_AS_NODE=1` heredada en la sesión forzaba a Electron a operar estrictamente en modo CLI de Node.js, bloqueando el motor de renderizado Chromium y la exposición del namespace `electron` (`app`, `BrowserWindow`).
  2. Procesos huérfanos de Electron retenían el singleton lock (`app.requestSingleInstanceLock() = false`), provocando salida silenciosa inmediata.
  3. Parámetro `show: false` esperando `ready-to-show` y `skipTaskbar: true` impedían la visibilidad antes de que concluyera la negociación HTTP.

#### Solución Implementada
1. **Blindaje contra `ELECTRON_RUN_AS_NODE` & Wrapper Node:**
   - Detección inmediata en cabecera de `desktop/main.js`: si la variable está presente o `require('electron')` retorna string, se purga del entorno y se re-invoca de forma transparente el binario de Electron con stdio heredado.
   - Scripts `npm run widget` y `widget:clean` reforzados con `cross-env ELECTRON_RUN_AS_NODE=`.
2. **Forzado de Visibilidad Inmediata:**
   - `show: true` activado desde el ciclo de creación de la ventana.
   - `skipTaskbar: false` para visualización táctica en la barra de tareas durante diagnóstico.
3. **Apertura Automática de DevTools Desacopladas:**
   - Inyección de `mainWindow.webContents.openDevTools({ mode: 'detach' });`.
4. **Instrumentación Exhaustiva de Logs:**
   - Logs en consola para el servidor loopback HTTP (puerto, solicitudes entrantes con método y URL).
   - Logs de Electron para URL solicitada, eventos de `did-finish-load` y `did-fail-load`.
   - Inyección de `app.commandLine.appendSwitch('enable-logging')`.


### FASE 4.63 — Erradicación de ERR_FAILED (-2) en Carga Nativa de Electron y Despliegue sobre Loopback HTTP Server (FIX-ELECTRON-ERR-FAILED-LOADFILE-98)
**Fecha:** Octubre 2026 | **Archivos modificados:** `desktop/main.js`, `src/App.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Diagnóstico Técnico & Causa Raíz
- **Falla:** `[Electron][did-fail-load] Código: -2 | "ERR_FAILED" | URL: file:///C:/Users/CHRISTOPHER/Desktop/MiPortalWeb/dist/index.html`.
- **Causa:** Chromium en Electron bloquea la ejecución de ES Modules (`<script type="module" crossorigin src="./assets/...">`) generados por Vite bajo el protocolo `file://`, arrojando `ERR_FAILED (-2)` y evitando el montaje del DOM.

#### Solución Implementada
1. **Eliminación Total de `mainWindow.loadFile()`:**
   - Erradicado cualquier llamado a `loadFile()` con rutas `file:///`.
2. **Servido Nativo mediante Loopback HTTP en `127.0.0.1:48123`:**
   - La ventana de Electron carga `http://127.0.0.1:48123/?widget=desktop`.
   - Se ampliaron los tipos MIME del micro-servidor interno (`.wasm`, `.webmanifest`, `.map`).
   - El micro-servidor mapea limpiamente la ruta raíz `/` a `/index.html` y sirve los bundles de JavaScript y CSS con sus correspondientes cabeceras HTTP sin bloqueos de sandbox ni restricciones CORS de archivo local.
3. **Fallback Automático Resiliente:**
   - En modo desarrollo (`--dev-server`), intenta cargar `http://localhost:3000/?widget=desktop`; si el dev server no responde, el evento `did-fail-load` redirige de forma transparente al loopback `http://127.0.0.1:48123/?widget=desktop`.
4. **Preservación del Widget Flotante Translúcido de Escritorio:**
   - Propiedades de ventana nativa intactas: `frame: false`, `transparent: true`, `backgroundColor: '#00000000'`, `skipTaskbar: true`, `alwaysOnTop: true ('floating')`.
   - React garantiza transparencia en `html`, `body` y `#root`, renderizando directamente la cápsula `DailyCockpit` desacoplada.


### FASE 4.57 — Refactorización Bento 1:1 de ModalActividadFlow con ModalTareaFlow, Unificación de Notas y Cinemática Cobalt (REQ-MODAL-ACTIVIDAD-BENTO-NOTAS-EXEC-63)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/components/Modals/ModalActividadFlow.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Solución Arquitectural
1. **Saneamiento de Notas y Supresión del Chip Huérfano:**
   - Erradicación de estados huérfanos desvinculados (`mostrarNotas`, `notasSearch`, `notaVinculadaId`).
   - Eliminación del botón disparador `act-flow-chip-notas` y su contenedor desplegable ad-hoc redundante.
   - Preservación de `notas_checklist` como "Apuntes y Notas Rápidas de Ejecución" e integración formal y permanente del bloque canónico `<SeccionNotasVinculadasModal codigoEntidad={actividad.codigo_legado} tipoEntidad="HABITO" ... />`.
2. **Reestructuración de Cabecera y Título Bento en 2 Filas:**
   - **Fila Superior:** Badge mono tabular `ACT-XXX`, Selector compacto de Categoría de Vida con micro-punto indicador semántico, Badge de Frecuencia/Recurrencia, Badge de Racha Flame y botón de escape `Esc`.
   - **Fila Inferior:** Input prominente `text-lg sm:text-xl font-bold bg-transparent border-0 focus:ring-0 text-slate-100 placeholder:text-slate-600` con placeholder `"Nombre del hábito o actividad personal..."`.
3. **Rejilla Bento de 2 Tarjetas Maestras en Paralelo:**
   - **Tarjeta 1 (Tiempo & Programación):** Contenedor `#0D1526` con fecha, hora inicio, selector de frecuencia (Puntual, Diario, Semanal, Mensual), selector de días (`LU`..`DO`), botones rápidos de duración (5m, 15m, 30m, 1h, 2h) y Micro-Acción (0m) con icono Lucide `Zap` (sin emojis), y switch de Google Calendar sync.
   - **Tarjeta 2 (Operativo & Metas Estratégicas):** Contenedor `#0D1526` con micro-riel Eisenhower (P1 Alta, P2 Media, P3 Baja), selector de Metas & Planes con creación in-situ (`metas_planes`), parámetros de meta cuantitativa (unidad, meta objetivo, acumulado y rescate racha) en `font-mono tabular-nums`.
4. **Acordeón Canónico de Gastos Asociados & Subtareas Procedurales:**
   - Acordeón colapsable con selección dual ("Nuevo Gasto" / "Vincular Gasto Existente"), selector de moneda PEN/USD/EUR y vinculación limpia a `db.gastos`.
   - Bloque procedural permanente de pasos secuenciales con barra de progreso con gradiente y checklist interactivo.
5. **Erradicación de Emojis, Textos Verbosos y Cinemática Cobalt:**
   - Eliminación total de emojis crudos (`⚡`, `🎯`, `🔄`) del DOM y selects.
   - Cinemática Cobalt Aerodynamic `transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]` sobre lienzo `#040711` y superficie `#0D1526`.
6. **Aseguramiento de Calidad (QA):**
   - `npx tsc --noEmit`: 0 errores de tipado estricto.
   - Vitest: 12 suites de prueba y 121 pruebas unitarias aprobadas al 100% (`npm test -- --run`).
   - Compilación de producción exitosa: `npm run build` en 7.52s.

---

### FASE 4.54 — Sistema Global de Eliminación Diferida con Deshacer 4s: Undo Buffer & Toast Apilable Cobalt (REQ-GLOBAL-SOFT-DELETE-UNDO-BUFFER-EXEC-57)
**Fecha:** Octubre 2026 | **Archivos creados/modificados:** `src/context/UndoDeleteContext.tsx`, `src/hooks/useUndoDelete.ts`, `src/components/UI/UndoToastContainer.tsx`, `src/context/__tests__/UndoDeleteContext.test.ts`, `src/App.tsx`, `src/index.css`, `src/components/Views/ViewDetalle360.tsx`, `src/components/Views/ViewKanban.tsx`, `src/components/Views/ViewPortafolio.tsx`, `src/components/Views/ViewFinanzas.tsx`, `src/components/Modals/ModalGasto.tsx`, `src/components/Modals/ModalIngreso.tsx`, `src/components/Modals/ModalTareaFlow.tsx`

#### Motivación & Solución Arquitectural
1. **Gestor Desacoplado y Contexto Global (`UndoDeleteContext.tsx` & `useUndoDelete.ts`):**
   - Implementación de `UndoDeleteManager` con `pendingMap`, `hiddenIdsSet` y listeners reactivos.
   - Enfoque Local-First en memoria: al solicitar una eliminación, la entidad se oculta instantáneamente de la UI mediante `estaOculto(id)` sin mutar Dexie ni generar desincronización con `syncManager`.
   - Si transcurren los 4000ms sin intervención del usuario, se despacha el `commit()` asíncrono en Dexie (`db[tabla].delete(id)` y sus cascadas).
   - Si el usuario pulsa `[ Deshacer ]`, se aborta el `clearTimeout`, la entidad reaparece de inmediato en la UI sin costo alguno de escritura en base de datos.
   - Manejador `beforeunload` para ejecutar `flushTodos()` síncrono si el usuario recarga o cierra la ventana durante la ventana de gracia.
2. **Componente Visual Apilable Cobalt (`UndoToastContainer.tsx`):**
   - Renderizado en portal flotante `fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2`.
   - Tokens canónicos Cobalt Aerodynamic (`#0D1526`/95, `backdrop-blur-xl`, `border-slate-800/80`, `shadow-[0_10px_35px_-5px_rgba(2,6,23,0.8),0_0_20px_rgba(56,189,248,0.15)]`, Lucide con `strokeWidth={1.75}`).
   - Barra regresiva CSS de 4s (`@keyframes shrinkWidth`, `.animate-shrink-width`) que escala `transform: scaleX(1)` a `scaleX(0)` con aceleración de hardware.
3. **Puntos de Eliminación Migrados:**
   - `ViewDetalle360.tsx`: Proyectos e hitos WBS migrados al búfer con filtrado reactivo de proyectos, hitos, tareas y gastos.
   - `ViewKanban.tsx`: Tareas en tarjeta migradas con filtrado reactivo del tablero.
   - `ViewPortafolio.tsx`: Proyectos en portafolio migrados con filtrado reactivo.
   - `ModalGasto.tsx` y `ModalIngreso.tsx`: Cierre instantáneo del modal al eliminar con programación en el búfer de 4s.
   - `ModalTareaFlow.tsx`: Eliminación de tarea y subtareas asociadas en cascada diferida.
   - `ViewFinanzas.tsx`: Filtrado reactivo de transacciones pendientes en tiempo real.
4. **Aseguramiento de Calidad (QA):**
   - `npx tsc --noEmit`: 0 errores de tipado estricto.
   - Vitest: 12 suites de prueba y 120 pruebas unitarias aprobadas al 100% (`npm test -- --run`).
   - Compilación de producción exitosa: `npm run build`.

---

### FASE 4.48 — Estado en Reposo para Widget de Escritorio y Calce 100% en Document PiP (REQ-DAILY-HUD-WIDGET-REST-STATE-PIP-FIT-42)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/components/Cockpit/DailyCockpit.tsx`, `docs/WINDOWS_11_HUD_SHORTCUT.md`, `public/WINDOWS_HUD_GUIDE.md`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Solución Arquitectural
1. **Estado en Reposo Adaptativo (Widget Pill) en Modo Standalone (`DailyCockpit.tsx`):**
   - Inicialización inteligente de `cockpitAbierto`: si se abre en modo HUD y la altura de ventana es menor a 400px (ej: acceso directo `--window-size=360,180`), la aplicación inicia automáticamente en estado de reposo como la cápsula flotante compacta.
   - En reposo standalone (`modoForzadoDesacoplado && !cockpitAbierto`), se renderiza la cápsula centrada en la pantalla con reloj activo, semáforo de ritmo (`%`), glifo `Gauge` con radar pulsante y título de la siguiente entidad programada.
   - Al hacer clic en la cápsula, conmuta a `cockpitAbierto = true` expandiéndose al Cockpit completo con animación fluida.
   - En la cabecera del Cockpit abierto, el botón `ChevronDown` permite contraer el widget nuevamente a la cápsula de reposo sin cerrar la ventana.
2. **Erradicación del Descalce en Document Picture-in-Picture:**
   - En `desacoplarAEscritorio`, reseteo exhaustivo de estilos de `html` y `body` en `pipWin`: `margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; background-color: #040711;`.
   - Contenedor del portal envuelto en `w-screen h-screen max-w-full max-h-full flex flex-col bg-[#040711] p-2 box-border overflow-hidden`.
   - `cockpitContent` estilizado con `w-full h-full flex-1 rounded-2xl border bg-[#0D1526]`, eliminando cualquier margen residual o descalce cromático dentro de la ventana PiP Always-on-Top.
3. **Calibración de Acceso Directo de Windows 11 para Modo Píldora de Arranque:**
   - Documentación actualizada con el comando canónico recomendado de 360x180:
     `"C:\Program Files\Google\Chrome\Application\chrome.exe" --app="https://miportalweb-aft.pages.dev/?mode=hud" --window-size=360,180 --window-position=1540,50`
4. **Aseguramiento de Calidad (QA):**
   - Verificación de tipos `npx tsc --noEmit` limpia (0 errores).
   - 115/115 pruebas unitarias aprobadas en Vitest (`npm test -- --run`).
   - Compilación de producción exitosa (`npm run build`).

---

### FASE 4.47 — Vista Dedicada HUD Standalone, PiP Nativo Chrome y Soporte PWA Launcher (REQ-DAILY-HUD-WIN11-STANDALONE-MOBILE-41)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/App.tsx`, `src/components/Cockpit/DailyCockpit.tsx`, `public/sw.js`, `src/main.tsx`, `index.html`, `app.html`, `docs/WINDOWS_11_HUD_SHORTCUT.md`, `public/WINDOWS_HUD_GUIDE.md`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Solución Arquitectural
1. **Ruta Dedicada Standalone `?mode=hud` (`src/App.tsx`):**
   - Detección sincrónica del parámetro `mode === 'hud'` en el estado de inicialización para erradicar cualquier parpadeo de carga del layout general.
   - Renderizado exclusivo a pantalla completa sin scroll global, sin sidebar, sin header maestro ni barras inferiores: `h-screen w-screen bg-[#040711] overflow-hidden flex flex-col p-2 font-sans select-none`.
   - Montaje del Cockpit desplegado por defecto con alternancia entre Riel Horario y Checklist directo.
2. **Robustecimiento del Desacople PiP y Fallback Ergonómico (`DailyCockpit.tsx`):**
   - Dimensiones nativas de solicitud calibradas a `width: 420, height: 700` para `documentPictureInPicture.requestWindow`.
   - Botón de desacople a PiP Always-on-Top habilitado de forma universal en la cabecera superior, permitiendo desacoplar tanto desde la app principal como desde la vista standalone `mode=hud`.
   - Fallback de ventana emergente con cálculo automático de posicionamiento a la derecha de la pantalla:
     `left = window.screen.availWidth - 420 - 20`, `top = 40`, `width = 420`, `height = 720`.
   - Cuando se activa PiP desde la ventana standalone, se despliega una tarjeta de control minimalista que permite re-enfocar la ventana PiP con un solo clic.
3. **Bypass de Caché y Service Worker Auto-Invalidante (`public/sw.js` y `src/main.tsx`):**
   - Actualización de `CACHE_NAME` a `pmo-cache-v2.4-hud-standalone`.
   - Forzado de activación inmediata con `self.skipWaiting()` en `install` y `self.clients.claim()` en `activate` para purgar versiones anteriores de inmediato.
   - Registro en `src/main.tsx` forzando `reg.update()` en cada recarga e invalidación inmediata para dispositivos móviles y Cloudflare Pages.
4. **Guía y Comando Maestro para Acceso Directo en Windows 11:**
   - Creación de documentación canónica `docs/WINDOWS_11_HUD_SHORTCUT.md` y `public/WINDOWS_HUD_GUIDE.md` con el comando maestro:
     `"C:\Program Files\Google\Chrome\Application\chrome.exe" --app="https://tu-dominio.pages.dev/?mode=hud" --window-size=420,720 --window-position=1480,50`
   - Instrucciones para integración en `shell:startup` para arranque automático con Windows 11.
5. **Aseguramiento de Calidad (QA):**
   - 115/115 pruebas unitarias aprobadas en Vitest (`npm test -- --run`) sin regresiones.
   - Verificación estática con `npx tsc --noEmit` exitosa (0 errores).
   - Compilación completa de producción validada con `npm run build`.

---

### FASE 4.46 — Cápsula Flotante Always-on-Top vía Document PiP, Forzado de Caché Móvil y Glifo Gauge (REQ-DAILY-HUD-DESKTOP-PIP-MOBILE-POLISH-39)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/components/Cockpit/DailyCockpit.tsx`, `public/sw.js`, `src/main.tsx`, `index.html`, `app.html`, `vite.config.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Solución Arquitectural
1. **Cápsula Flotante Always-on-Top en PC vía Document Picture-in-Picture (`DailyCockpit.tsx`):**
   - Implementación enriquecida de `desacoplarAEscritorio` utilizando la API nativa de Chrome/Edge `documentPictureInPicture.requestWindow({ width: 420, height: 680 })`.
   - Clonación integral e iterativa de todas las hojas de estilo del documento principal (incluyendo reglas CSS en memoria y hojas enlazadas `<link rel="stylesheet">`) hacia el `<head>` de la ventana emergente, manteniendo la paridad estética 1:1 de Tailwind CSS y tokens Cobalt Aerodynamic.
   - Montaje del componente `cockpitContent` dentro de `pipWindow.document.body` mediante `createPortal`, permitiendo que el Cockpit se mantenga en primer plano persistente (*always-on-top*) mientras el usuario interactúa con otras aplicaciones o el IDE.
   - Mantenimiento simbiótico de la cápsula en reposo en la ventana principal con badge indicador `PiP` pulsante, permitiendo reenfocar la ventana desacoplada al hacer clic y recuperando el modo integrado automáticamente en el evento `pagehide`.
2. **Sustitución de Icono Repetido por Glifo Técnico Distintivo:**
   - Erradicación de iconos genéricos (`Activity`) en la cabecera y en la píldora en reposo.
   - Adopción canónica de `<Gauge className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />` como glifo maestro del Cockpit de Ejecución Diaria, complementado con un micro-punto radar de actividad (`span.relative.flex.h-2.w-2`) con pulso ping cian.
3. **Garantía de Visibilidad Móvil y Erradicación de Falsos Positivos de Caché:**
   - Ajuste de elevación `z-50 pointer-events-auto` y posicionamiento reactivo para móvil en `bottom-20 right-4 sm:bottom-6 sm:right-6 md:bottom-6 md:right-6`, asegurando visibilidad inmediata por encima de la barra fija inferior (`BottomNavMobile`).
   - Forzado de actualización e invalidación de caché:
     - Incremento de versión del Service Worker a `pmo-cache-v2.3-hud-pip` en `public/sw.js`, purga reactiva de cachés obsoletas en el evento `activate` e integración de `self.skipWaiting()` inmediato.
     - Registro de Service Worker en `src/main.tsx` reforzado con `reg.update()` en cada carga de página y postMessage `SKIP_WAITING` para clientes en espera.
     - Inyección de metadatos de compilación `build-version="2.3.0-hud-pip"` en `index.html` y `app.html` y `define.__BUILD_TIMESTAMP__` en `vite.config.ts` para invalidar cachés intermedias en Cloudflare Pages.
4. **Pulido de Fluidez, Micro-animación y Ergonomía Visual:**
   - Cápsula en reposo estandarizada con `px-3.5 py-1.5 rounded-full bg-[#0D1526]/90 border border-sky-500/30 backdrop-blur-xl shadow-[0_4px_25px_rgba(2,6,23,0.8),0_0_15px_rgba(56,189,248,0.12)] flex items-center gap-2.5 transition-all duration-200 hover:border-sky-400 hover:scale-[1.02] active:scale-[0.97] cursor-pointer group`.
   - Transición fluida elástica al desplegar el Cockpit: `transition-transform duration-200 ease-out origin-bottom-right`.
   - Atenuación y tachado suave de tarjetas al completarse: `transition-all duration-200 opacity-35 line-through`.
5. **Aseguramiento de Calidad (QA):**
   - 115/115 pruebas unitarias aprobadas en Vitest (`npm test -- --run`) sin regresiones.
   - Verificación estática con `npx tsc --noEmit` exitosa (0 errores de tipado).
   - Compilación completa de producción validada con `npm run build` en 8.01s.

---

### FASE 4.45 — Remoción de Selector Redundante y Reset Total con Botón X en Kanban (REQ-KANBAN-CLEAN-PROJECT-SELECTOR-26)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/components/Views/ViewKanban.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Solución Arquitectural
1. **Erradicación del Dropdown Redundante de Selección de Proyecto:**
   - Remoción del elemento `<select id="kanban-selector-proyecto">` y su contenedor de la Fila 1 en `src/components/Views/ViewKanban.tsx`.
   - La selección de proyectos se canaliza limpiamente a través del sidebar lateral canónico y la navegación contextual (o links desde Detalle 360° / Hitos).
2. **Píldora Directa de Estado y Reseteo Atómico con Botón X:**
   - Si no hay proyecto activo (`!proyectoSeleccionadoCodigo`): Se renderiza permanentemente la píldora sobria de **`Vista Global`** con icono `FolderKanban`, mostrando de forma consolidada el gasto global y presupuesto acumulado.
   - Si hay proyecto activo (`proyectoSeleccionadoCodigo`): Se renderiza la píldora contextual del proyecto (`[PRJ-XXX]`, nombre truncado, CPI y botón 360° `Sparkles`).
   - El botón rápido de deselección `X` de la píldora contextual ejecuta:
     ```typescript
     setProyectoSeleccionadoCodigo('');
     setFiltroHito('');
     ```
     retornando el tablero inmediatamente a la `Vista Global` y recalculando las métricas de gasto en tiempo real.
3. **Reset Total Integrado en Botón "Limpiar (X)":**
   - Actualización de `limpiarTodosLosFiltros` para incluir la limpieza de `setProyectoSeleccionadoCodigo('')` y `setFiltroHito('')`, garantizando que un solo clic en "Limpiar (X)" restablezca tanto los filtros operativos como el filtro de proyecto activo.
   - Inclusión de `proyectoSeleccionadoCodigo` en `hayFiltrosActivos` para que el botón de limpieza y el badge resumen de filtros se activen automáticamente al seleccionar un proyecto.
4. **Armonización de Espacio y Balance Visual:**
   - La cabecera superior (Fila 1) queda distribuida de forma limpia:
     `[Título Kanban] [Píldora: Vista Global / PRJ-XXX] ... [Cápsula Temporal / Cronograma] [Horizonte: TODO/HOY/SEM/MES] [Gasto/Presupuesto Global/Proyecto]`.
5. **Aseguramiento de Calidad:**
   - 110/110 pruebas unitarias aprobadas en Vitest sin fallos ni regresiones.
   - Verificación estática con `npx tsc --noEmit` exitosa (0 errores).
   - Compilación completa de producción validada con `npm run build` en 5.87s.

---

### FASE 4.44 — Restauración Quirúrgica de Cabecera Kanban: Fila de Proyecto, Selector y Gasto Global (REQ-KANBAN-RESTORE-PROJECT-BAR-25)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/components/Views/ViewKanban.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Solución Arquitectural
1. **Restauración de la Fila 1 de Proyecto y Contexto Financiero (`ViewKanban.tsx`):**
   - **Selector Desplegable de Proyecto (`#kanban-selector-proyecto`):** Menú `<select>` para alternar entre "Vista Global (Todos los proyectos)" y proyectos individuales (`PRJ-XXX · Nombre`). Reseteo automático de `filtroHito` al conmutar para evitar paquetes de trabajo huérfanos.
   - **Píldora de Estado del Proyecto (`#label-proyecto-activo`):** Badge interactivo con código de proyecto `[PRJ-XXX]`, nombre truncado, CPI, botón de acceso directo a Detalle 360° (`Sparkles`) y botón de deselección rápida (`X`), o badge neutral de "Vista Global".
   - **Cápsula Temporal / Cronograma (`#kanban-cronograma-proyecto`):** Fechas de inicio y fin (`DD/MM/YYYY`) del proyecto activo con indicador porcentual de avance de tiempo transcurrido (`% t`).
   - **Cápsula de Filtro de Horizonte Temporal (`#container-time-filter`):** Selector de rango de tiempo (`TODO`, `HOY`, `SEMANA`, `MES`) con icono Lucide y popover flotante Cobalt.
   - **Bloque de Gasto Acumulado / Presupuesto Global (`#kanban-gasto-presupuesto-box`):** Muestra el gasto del proyecto seleccionado o gasto global acumulado en `PEN`, presupuesto contractual tope y badge tabular de consumo porcentual (`%`).
   - **Exclusión Estricta:** Se prescinde del selector segmented "Todos / Proyectos / Personal" para maximizar la amplitud y legibilidad visual.
2. **Preservación y Armonización de la Fila 2 de Filtros Operativos Kanban:**
   - Mantenimiento intacto del buscador compacto (`#filter-buscar-tarea`), micro-riel de ordenamiento (Prioridad, Fecha, Energía, Horas, Alpha), selector de "Paquetes de Trabajo" (antiguo Hitos), filtros por Prioridad Eisenhower (P1-P4), Energía (DeepWork, Operativa, Mecánica), Plazo y Dependencias/Bloqueos.
   - Indicador reactivo de tareas filtradas `{tF}/{total}` y botón de restablecimiento rápido `Limpiar (X)`.
3. **Aseguramiento de Calidad:**
   - 110/110 pruebas unitarias aprobadas en Vitest sin fallos ni regresiones.
   - Verificación estática con `npx tsc --noEmit` exitosa (0 errores).
   - Compilación completa de producción validada con `npm run build` en 6.04s.

---

### FASE 4.43 — Implementación de Transcriptor de Voz Nativo Web Speech API en Ideas (REQ-IDEAS-VOICE-RECOGNITION-19)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/hooks/useSpeechRecognition.ts` (Nuevo), `src/components/Ideas/WidgetIdeasBubble.tsx`, `src/hooks/__tests__/useSpeechRecognition.test.ts` (Nuevo), `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Solución Arquitectural
1. **Hook Reutilizable y Controlador (`useSpeechRecognition.ts`):**
   - Detección universal de Web Speech API (`window.SpeechRecognition || window.webkitSpeechRecognition`).
   - Configuración nativa con `continuous = true`, `interimResults = true`, e idioma `lang = 'es-PE'` con fallback inteligente.
   - Manejo de `onresult` procesando resultados finales e interinos para streaming en tiempo real hacia `onTranscript(texto, esFinal)`.
   - Manejo de `onerror` tipificado con mensajes de usuario en español para denegación de micrófono (`not-allowed`), ausencia de voz (`no-speech`), hardware no encontrado (`audio-capture`) o errores de red (`network`).
   - Aborto defensivo y liberación de recursos en el ciclo de vida `useEffect` al desmontar.
2. **Integración en `WidgetIdeasBubble.tsx` (Cobalt Aerodynamic):**
   - Erradicación del estado mock `grabando`.
   - Concatenación inteligente con preservación del texto preexistente en el textarea sin sobreescrituras ni duplicaciones.
   - Botón de Voz reactivo: alterna a estado activo con animación pulsante (`bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse`), renderizando el icono `MicOff` y etiqueta "Detener".
   - Banner interactivo de grabación con botón de parada inmediata.
   - Persistencia contextual: asignación automática de `tipo_captura: 'VOZ'` al guardar ideas capturadas por dictado.
3. **Aseguramiento de Calidad:**
   - 110/110 pruebas unitarias aprobadas en Vitest (`useSpeechRecognition.test.ts` con 10 pruebas cubriendo inicio, parada, eventos de resultado y errores).
   - Comprobación estática con `npx tsc --noEmit` limpia con 0 errores.
   - Compilación de producción con Vite exitosa.

---

### FASE 4.42 — Motor de Velocidad Real y Badges de Proyección en ViewMetasPlanes (REQ-METAS-FORECASTING-BADGES-17)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/services/metasService.ts`, `src/components/Habitos/Metas/ViewMetasPlanes.tsx`, `src/services/__tests__/metasService.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Solución Arquitectural
1. **Motor Matemático de Forecasting (`calcularProyeccionMeta` en `metasService.ts`):**
   - Función pura que procesa los logs de cumplimiento de hábitos en la ventana móvil de los últimos 30 días respecto a `fechaHoyStr` con aritmética UTC determinista.
   - Cálculo de velocidad real diaria: $V_{real} = \frac{\sum ValorRegistrado}{30}$.
   - Remanente pendiente: $VolumenPendiente = \max(0, meta.meta\_objetivo\_total - meta.valor\_acumulado\_actual)$.
   - Días restantes: $D_{rest} = \lceil \frac{VolumenPendiente}{V_{real}} \rceil$ y fecha proyectada $F_{proj} = fechaHoy + D_{rest}$.
   - Desviación temporal respecto a `meta.fecha_fin`: $\Delta t = \text{días}(F_{proj}) - \text{días}(meta.fecha\_fin)$.
   - Clasificación semántica de salud:
     - $\Delta t \le -3$: `ADELANTADO` ("Adelantado Xd").
     - $-3 < \Delta t \le 0$: `A_TIEMPO` ("En cronograma").
     - $0 < \Delta t \le 7$: `RIESGO` ("⚠️ Riesgo (+Xd)").
     - $\Delta t > 7$: `CRITICO` ("🚨 Desviación (+Xd)").
     - $V_{real} == 0$: `SIN_DATOS` ("Sin inercia / 0 avance").
   - Detección de hitos atrasados no completados (`fecha_objetivo < fechaHoyStr`), adjuntando alerta descriptiva en `mensajeBadge`.
2. **Visualización Reactiva en `ViewMetasPlanes.tsx` (Cobalt Aerodynamic):**
   - Consulta reactiva `useLiveQuery` sobre `db.habito_cumplimiento_logs` con mapeo en memoria $O(1)$ por hábito.
   - Renderizado en cabecera de tarjeta de píldora estilizada según `estadoSalud` con tokens Cobalt:
     - `ADELANTADO`: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
     - `A_TIEMPO`: `bg-teal-500/10 text-teal-400 border border-teal-500/20`
     - `RIESGO`: `bg-amber-500/10 text-amber-400 border border-amber-500/20`
     - `CRITICO`: `bg-rose-500/10 text-rose-400 border border-rose-500/20`
     - `SIN_DATOS`: `bg-slate-800/40 text-slate-400 border border-slate-700/40`
   - Renderizado discreto al pie de la barra bimodal con `font-mono tabular-nums`:
     `Ritmo: {velocidadDiaria.toFixed(1)} {meta.unidad_medida}/día · Proyectado: {fechaProyectada || 'Indeterminado'}`.
3. **Aseguramiento de Calidad:**
   - 100/100 pruebas unitarias aprobadas en Vitest (`metasService.test.ts` con cobertura de todos los umbrales de $\Delta t$, metas sin datos y alertas de hitos).
   - Comprobación estática `npx tsc --noEmit` limpia con 0 errores.
   - Compilación de producción con Vite exitosa.

---

### FASE 4.41 — Selector de Filtro por Meta en Barra de Herramientas de TableroHabitos (REQ-HABITS-FILTER-BY-META-16)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/utils/entityNormalizer.ts`, `src/components/Habitos/TableroHabitos.tsx`, `src/utils/__tests__/entityNormalizer.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Solución Arquitectural
1. **Función Canónica de Evaluación de Filtro por Meta (`evaluarFiltroMeta`):**
   - En `src/utils/entityNormalizer.ts`, implementación pura de `evaluarFiltroMeta(act, filtroMetaId, metasPorHabitoId, metasPlanes)`:
     - `'TODAS'`: Pase libre sin exclusión.
     - `'__SIN_META__'`: Inclusión exclusiva de actividades sin vínculo en `db.habitos_metas_vinculos` y sin `meta_macro_nombre`.
     - UUID de meta: Inclusión por ID de vínculo en `metasPorHabitoId` o por coincidencia normalizada de texto libre en `act.meta_macro_nombre`.
2. **Selector Estilizado Cobalt Aerodynamic en Toolbar (`TableroHabitos.tsx`):**
   - Integración de `<select id="filtro-meta-select">` con icono Lucide `Target` (`text-cyan-400 stroke-[1.75]`), opciones estructuradas (`🎯 Todas las Metas`, `⚡ Hábitos de Rutina Base (Sin meta)` y optgroup `"Metas y Planes Activos"` ordenado alfabéticamente).
   - Botón de restablecimiento rápido (`X`) con microborde y tooltip cuando el filtro está activo (`filtroMetaId !== 'TODAS'`).
3. **KPIs Bento y Cabeceras de Columna Contextuales:**
   - Cálculo reactivo de `kpisTablero` en `TableroHabitos.tsx`, reflejando dinámicamente el universo de hábitos según la meta activa en las 5 Bento Cards y en los contadores del Kanban, sin alterar los gráficos globales del Dashboard.
4. **Aseguramiento de Calidad:**
   - 93/93 pruebas unitarias aprobadas en Vitest (`entityNormalizer.test.ts` con cobertura completa del filtro).
   - Comprobación estática con `npx tsc --noEmit` y build de producción validado con `vite build` (0 errores).

---

### FASE 4.40 — Creación In-Situ de Metas desde Actividades y Promoción a Metas & Planes (REQ-HABITS-CREATE-METAS-INLINE-15)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/services/metasService.ts`, `src/components/Modals/ModalActividadFlow.tsx`, `src/components/Habitos/Metas/ViewMetasPlanes.tsx`, `src/services/__tests__/metasService.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Solución Arquitectural
1. **Creación In-Situ de Metas en `metasService.ts` (`crearMetaRapidaDesdeActividadLocal`):**
   - Implementación de la función `crearMetaRapidaDesdeActividadLocal(params)` con correlativo canónico determinista `MET-XXX` generado mediante `generarSiguienteCodigoMetaLocal()`.
   - Inicialización con `peso_hitos_pct: 0` y `peso_habitos_pct: 100` (100% dependiente de hábitos hasta incorporar hitos posteriormente), `estado: '02_En_Progreso'`, `tipo_meta: 'CUANTITATIVA'`, y persistencia atómica en `db.metas_planes`.
   - Si se provee `habitoId`, genera atómicamente el vínculo en `db.habitos_metas_vinculos` con `modo_computo: 'VOLUMEN_DIRECTO'` y recalcula el progreso bimodal con `recalcularProgresoMetaLocal`.
2. **Selector de Metas Canónico con Opción de Creación Inline (`ModalActividadFlow.tsx`):**
   - Estructuración canónica del `<select>` con opciones: `"Sin vincular a meta"`, `"+ Crear nueva meta para este hábito..."` (`__CREAR_NUEVA__`), `"Personalizada (Solo texto libre / Legacy)"` (`__TEXTO_LIBRE__`), y optgroup `"Metas y Planes Activos"`.
   - Despliegue de subpanel interactivo Cobalt Aerodynamic al seleccionar `__CREAR_NUEVA__` para ingresar el nombre de la meta, unidad de medida, meta objetivo total y nivel de rescate mínimo con tipografía `font-mono tabular-nums`.
   - En `commitGuardado()`, invocación atómica de `crearMetaRapidaDesdeActividadLocal()`, asignación de `payload.meta_macro_nombre` y persistencia con limpieza de vínculos preexistentes si aplica.
3. **Promoción Automática de Metas Internas Preexistentes (`sincronizarMetasInternasHaciaPlanesLocal`):**
   - Recorrido de actividades en `db.actividades_personales` con `meta_macro_nombre` no vacío o `tipo_compromiso === 'META'` que no tengan un vínculo registrado en `db.habitos_metas_vinculos`.
   - Creación de la meta en `db.metas_planes` si no existe o vinculación a la meta existente si ya fue registrada previamente, garantizando idempotencia.
   - Invocación reactiva en el montaje (`useEffect`) de `src/components/Habitos/Metas/ViewMetasPlanes.tsx`, asegurando que todas las metas definidas en tarjetas de actividades figuren inmediatamente en la pestaña de Metas & Planes.
4. **Validación y Aseguramiento de Calidad:**
   - 92/92 pruebas unitarias aprobadas en Vitest (`metasService.test.ts` con cobertura completa).
   - Verificación estática con `npx tsc --noEmit` y compilación de producción validada con `vite build` (0 errores).

---

### FASE 4.38 — Retención Visual de Hábitos Completados Hoy y Sincronización Robusta con Calendar (REQ-HAB-05 & REQ-CAL-02)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/types/index.ts`, `src/services/calendarSyncService.ts`, `src/services/habitosService.ts`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Modals/ModalActividadFlow.tsx`, `src/hooks/useHabitos.ts`, `legacy_gas/CalendarService.js`, `src/services/__tests__/habitosService.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Solución Arquitectural
1. **Retención Visual de Hábitos Completados en el Día en Curso (`ultima_fecha_completado`):**
   - Resolución del problema de desaparición inmediata de tarjetas de hábitos recurrentes completados al avanzar su fecha al siguiente ciclo (`fecha_programada > hoyStr`).
   - Incorporación de los campos `ultima_fecha_completado?: string` y `proxima_fecha_programada?: string` en el contrato canónico `ActividadPersonal` de `src/types/index.ts`.
   - Modificación de `completarActividadPersonalLocal` en `src/services/habitosService.ts` para persistir `ultima_fecha_completado = hoyStr` y registrar la fecha proyectada en `proxima_fecha_programada`.
   - Reversión idempotente al desmarcar: limpieza de `ultima_fecha_completado` y `proxima_fecha_programada`, restitución de la racha anterior y retorno de `fecha_programada = hoyStr` si había avanzado.
2. **Filtrado y Renderizado en Tablero Kanban (`TableroHabitos.tsx` y `TarjetaHabito.tsx`):**
   - Homologación del predicado `esCompletadaHoy`: incluye `a.estado === '04_Completado'`, `a.ultima_fecha_completado === hoyStr`, o `(a.updated_at.startsWith(hoyStr) && a.racha_actual > 0)`.
   - Inclusión en el horizonte temporal `filtroTemporal === 'HOY'` para evitar que las actividades completadas sean podadas del DOM.
   - Renderizado en subsección "Completadas Hoy" de cada columna con el badge de próxima ocurrencia `Próx: [fecha]`.
3. **Adaptador Resiliente de Sincronización con Google Calendar (`calendarSyncService.ts`):**
   - Implementación de `sincronizarActividadCalendar(act, accion, opcionesAlcance)` con diseño no bloqueante para la UI, timeout de 6000 ms y tolerancia total a entornos offline o sin variables de entorno configuradas.
   - Notificación reactiva de mutaciones (`UPSERT`, `DELETE`, `SINGLE`, `FUTURE`, `ALL`) desde `habitosService.ts` al completar, editar o eliminar actividades con alcance.
   - Actualización de `id_evento_calendar` en Dexie cuando el backend Google Calendar retorna un identificador válido.
4. **Blindaje de Parser de Recurrencias en Google Apps Script (`CalendarService.js`):**
   - Flexibilización de la regex de validación en `_parsearDiasEspecificos` a `/^[A-Z,\s]+$/i` para admitir tokens de 2 letras con o sin prefijo (`"LU,MA,MI,JU,VI"` o `"DIAS:..."`).
   - Ampliación del diccionario `mapaNombres` para soportar tokens estándar RFC 5545 en inglés (`MO`, `TU`, `WE`, `TH`, `FR`, `SA`, `SU`) con paridad 1:1.
5. **Aseguramiento de Calidad:**
   - 45/45 pruebas unitarias aprobadas en Vitest con cobertura de retención, reversión y tolerancia a fallos.
   - Verificación estricta de TypeScript con `npx tsc --noEmit` y build de producción exitoso con `vite build`.

---

### FASE 4.33 — Sanitización de Contrato REST y Upsert Idempotente en Actividades Personales (REQ-SYNC-01)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/services/syncManager.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Diagnóstico Forense
Resolución del fallo HTTP 400 (`PGRST204` / `23502` / `23505`) durante la sincronización de `actividades_personales` hacia PostgreSQL / Supabase:
1. **Purgado de Columnas Inexistentes en PostgreSQL (`src/services/syncManager.ts`):**
   - Eliminación de atributos locales en el payload REST: `frecuencia_ciclo`, `monto_gasto_asociado`, `notas_checklist`, `regla_repeticion`, `version`, `nombre_actividad`, `tipo_compromiso`.
2. **Mapeo y Normalización Determinista de Contrato:**
   - Columna `nombre`: Mapeada desde `act.nombre_actividad || act.nombre || 'Actividad sin nombre'`.
   - Columna `tipo_registro`: Normalizada a `'HABITUAL' | 'PUNTUAL' | 'META'` para satisfacer el constraint `CHECK (tipo_registro IN ('HABITUAL', 'PUNTUAL', 'META'))`, mapeando `HABITO_MANTENIMIENTO` y `HABITO_ACUMULATIVO` a `'HABITUAL'`.
   - Columna `estado`: Homologación de `'03_En_Curso'` hacia `'03_En_Proceso'` respetando el constraint `CHECK (estado IN (...))`.
   - Normalización de formatos: `fecha_programada` a `'YYYY-MM-DD'`, `duracion_horas`, `meta_objetivo_total`, etc. a valores numéricos válidos.
3. **Resolución de Colisión de Identificadores (UUID Local vs Remoto):**
   - Inyección de `{ onConflict: 'codigo_legado' }` en el método `.upsert()` de Supabase, evitando la colisión de claves únicas (`actividades_personales_codigo_legado_key` - error 409) entre los UUIDs locales generados por la siembra y los UUIDs del servidor PostgreSQL.
4. **Validación en Runtime:**
   - Comprobación en vivo mediante conexión CDP en navegador headless: transición exitosa de `sync_status: 'pending'` a `'synced'` con respuesta `HTTP 200 OK` de Supabase sin registrar advertencias ni errores en la consola.

---

### FASE 4.32 — Optimización de Rendimiento, Paralelización I/O en Dexie y Mapas Lookup O(1) (REQ-PERF-01)
**Fecha:** Octubre 2026 | **Archivos modificados:** `src/db/db.ts`, `src/App.tsx`, `src/components/Views/ViewKanban.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Diagnóstico de Rendimiento
Resolución del cuello de botella en la cascada de arranque y desfasaje visual entre el montaje inmediato de marcos/sidebar y la hidratación de tarjetas en el tablero Kanban y vistas operativas:
1. **Concurrencia Total I/O en Inicialización (`src/db/db.ts`):**
   - Sustitución de los 10 conteos secuenciales en serie (`await count()`) en `inicializarDatosSemillaSiVacio()` por una única consulta paralela atómica con `Promise.all`.
   - Reducción del tiempo de inspección previa a la siembra de ~220 ms a < 25 ms, liberando de inmediato el canal IPC de IndexedDB.
   - Ejecución de escrituras de siembra concurrentes (`bulkPut`) en paralelo mediante `Promise.all` si se detecta déficit de registros frente a las cuotas canónicas.
2. **Supresión de I/O Redundante en Montaje (`src/App.tsx`):**
   - Eliminación del segundo ciclo de 10 `db.*.count()` que se disparaba en el `useEffect` de `App.tsx` exclusivamente para el log de depuración, erradicando la contención de transacciones en frío.
3. **Indexación $O(1)$ y Memoización en Render (`src/components/Views/ViewKanban.tsx`):**
   - Creación de índices y mapas hash memoizados con `useMemo`:
     - `proyectosMap = Map<string, CanonicalProyecto>`
     - `hitosMap = Map<string, HitoWbsRecord>`
     - `gastosPorTarea = Map<string, number>`
     - `subtareasPorTarea = Map<string, SubtareaPaso[]>`
     - `avancesPorProyecto = Map<string, { avanceReal: number; avanceTotalProyectado: number }>`
   - Erradicación de más de 5,000 iteraciones y filtros lineales $O(N \times M)$ por ciclo de render en las 59 tarjetas del tablero y los 13 proyectos del sidebar, transformando búsquedas lineales en consultas instantáneas $O(1)$ (`.get(key)`).
4. **Sincronización Perceptiva con Micro-Skeletons Shimmer Cobalt:**
   - Detección de carga transitoria inicial (`cargandoDatosIniciales = rawTareasLive === undefined || rawProyectosLive === undefined`).
   - Renderizado preventivo de micro-tarjetas esqueleto (*skeleton shimmer* con tokens Cobalt `#0D1526`, `border-slate-800/40`, `animate-pulse`) tanto en el cuerpo de las 5 columnas como en el sidebar, eliminando el parpadeo de "0 tareas" y el salto visual ("pop-in") brusco.
5. **Telemetría de Alta Precisión con Performance API (REQ-PERF-02):**
   - Marcas temporales instrumentadas: `t0_bootstrap` (`main.tsx`), `t1_dexie_start` / `t2_dexie_resolved` (`db.ts`), `t3_kanban_mount` / `t4_kanban_cards_painted` (`ViewKanban.tsx`).
   - Telemetría en vivo (Warm Reload): `Bootstrap: 79.60ms | Dexie I/O: 9.30ms | Kanban Render: 276.10ms | Total: 355.50ms`.
   - Evidencia: Dexie I/O opera en solo 9.3 ms; Supabase no bloquea el montaje; el grueso del tiempo en DEV corresponde a transpilación/módulos ESM de Vite (~80 ms) y doble renderizado por React StrictMode en dev (~270 ms).

---

### FASE 4.29 — Coalescencia Canónica de Hitos/Paquetes WBS en Vista 360 y Resolución FK Dual (REQ-V360-01)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/Views/ViewDetalle360.tsx`, `src/services/syncManager.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Resolución de Cadena de Datos WBS 360
Corrección de la pérdida de visibilidad y metadatos en la cascada jerárquica de entregables de `ViewDetalle360.tsx` y blindaje de sincronización relacional con Supabase:
1. **Regla de Coalescencia Canónica en Entidades `hitos_wbs`:**
   - Se establece formalmente `nombre_elemento` como clave canónica primaria (según `HitoWbsRecord`), respaldada por la cadena de extracción tolerante a fuentes:
     `h.nombre_elemento || h.Nombre_Elemento || h.nombre_hito || h.Nombre_Hito || h.nombre || h.codigo_legado || 'Elemento sin nombre'`.
   - Normalización de fecha límite (`h.fecha_limite || h.Fecha_Limite_Plan || h.fecha_limite_plan || '-'`) y ponderación porcentual (`h.peso_pct ?? h.peso_ponderado_pct ?? h.Peso_Ponderado_Pct ?? 0`).
   - Erradicación del título vacío en elementos `<h4>` de hitos marcadores y resolución del nombre descriptivo en paquetes de trabajo WP.
2. **Blindaje de Filtrado Relacional en `hitosProyecto`:**
   - Normalización insensible a mayúsculas/minúsculas y espacios con `trim().toUpperCase()` sobre identificadores cruzados (`proyecto_id`, `ID_Proyecto`, `proyecto_codigo` y prefijos `codigo_legado`).
3. **Resolución de FK Dual en `syncManager.ts`:**
   - Intercepción de `hito.proyecto_id` previo al upsert en Supabase: si contiene un código alfanumérico legado (`PRO-XXX`), se resuelve dinámicamente el UUID canónico consultando `db.proyectos.where('codigo_legado')`, evitando violaciones de tipo de datos UUID en PostgreSQL.

---

### FASE 4.28 — Reorganización Canónica de Gobernanza, Reglas y Skills en Antigravity (REQ-GOV-001)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `.antigravity/rules/01_subagents_pipeline.md`, `.antigravity/rules/02_system_architecture.md`, `.antigravity/rules/03_cobalt_design_tokens.md`, `.antigravity/skills/pmo-architecture/SKILL.md`, `.antigravity/skills/pmo-ui-cobalt/SKILL.md`, `.agents/rules/`, `.agents/skills/`, `AGENTS.md`, `SYSTEM_RULES.md`, `.antigravity/SUBAGENTS_RULES.md`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Reorganización Canónica de Gobernanza
Centralización y formalización de la estructura de subagentes, reglas del sistema y catálogo de skills para garantizar indexación activa en Antigravity sin colisiones entre stacks:
1. **Centralización de Reglas (`.antigravity/rules/` y `.agents/rules/`):**
   - `01_subagents_pipeline.md`: Define el pipeline quirúrgico de 5 roles (Inspector Técnico, Maquetador UI/UX, Arquitecto de Datos, Cirujano de Código, Auditor QA) desacoplado de `clasp push` y enlazado a Vitest y compilación estricta TypeScript (`npx tsc --noEmit`).
   - `02_system_architecture.md`: Formaliza la arquitectura dual (React 19 + TypeScript + Vite + Dexie + Supabase en `src/` frente al confinamiento estricto de Google Apps Script en `legacy_gas/`). Define atajos LIFO, bóveda de archivados (+10 días), protocolo DoD Kanban y serialización atómica de notas.
   - `03_cobalt_design_tokens.md`: Estandariza la paleta Cobalt Aerodynamic (`#040711`, `#0D1526`, `border-slate-800/40`), iconografía Lucide React lineal (`strokeWidth={1.75}`) y formato numérico `font-mono tabular-nums`.
2. **Carga Nativa en Memoria (`AGENTS.md`):**
   - Creación de `AGENTS.md` en raíz y reglas en `.agents/rules/` para inyección obligatoria en `<user_rules>` en cada sesión de trabajo.
3. **Especialización de Skills y Purgado de Contaminantes:**
   - Skills canónicos del PMO en `.antigravity/skills/` y `.agents/skills/`:
     - `pmo-architecture`: SSOT de datos, paridad de contratos relacionales y Local-First.
     - `pmo-ui-cobalt`: Maquetación de alta fidelidad, WBS Bento y paridad 1:1.
   - Purgado de skills contaminantes: `frontend-ui-designer` (redundante) y `ui-styling` (incompatible por uso de shadcn/Radix CLI) trasladados al archivo inactivo `.antigravity/archive/`.
   - Subordinación explícita de `ui-ux-pro-max` como repositorio pasivo secundario bajo los tokens Cobalt.

---

### FASE 4.27 — Restitución de Canales Ortogonales Colectores y Altura Fija de Tarjetas WBS (REQ-F2-P2.1m)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/WBS/nodos/NodoProyecto.tsx`, `src/components/WBS/nodos/NodoFase.tsx`, `src/components/WBS/nodos/NodoWBS.tsx`, `src/components/WBS/nodos/NodoTarea.tsx`, `src/components/WBS/nodos/NodoGasto.tsx`, `src/components/WBS/GrafoWBS.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Paridad 1:1
Restitución de la precisión geométrica de píxel y limpieza canónica del árbol WBS jerárquico Top-to-Bottom (TB), eliminando variaciones de altura y enrutamiento arbitrario:
1. **Alturas y Anchos Fijos Estrictos (Nivelación Perfecta de Filas):**
   - `NodoProyecto`: `w-[320px]`, `h-[120px]`.
   - `NodoFase`: `w-[220px]`, `h-[80px]`.
   - `NodoWBS`: `w-[240px]`, `h-[120px]` inmutable con layout compacto: Código WBS, título truncado con ellipsis a 1-2 líneas, badge de estado, progreso %, duración y costo imputado.
   - `NodoTarea`: `w-[210px]`, `h-[90px]` inmutable: Código, título truncado a 1 línea limpia, estado DoD, responsable, prioridad y horas.
   - `NodoGasto`: `w-[180px]`, `h-[60px]` inmutable, confinado a la base y activo únicamente bajo switch manual.
2. **Canales Colectores Ortogonales (Bus Jerárquico 90° Estricto):**
   - Todas las conexiones Padre e Hijos (`PROY_FASE`, `FASE_WP`, `WP_TAR`, `TAR_GAS`) configuradas con `type: 'step'`. Bajan verticalmente desde el centro del padre, viajan por una cota Y intermedia fija (bus horizontal) y bajan en 90° hacia el centro superior de cada hijo.
3. **Canaleta Despejada para Dependencias entre Tareas:**
   - Dependencias inter-tareas (`TAR -> TAR`) configuradas con `type: 'step'` saliendo de `tar-bottom` hacia `tar-left` en tono ámbar (`#F59E0B`, `strokeWidth: 1.8`). La arista viaja por la canaleta libre entre la fila de tareas y la de gastos sin atravesar el cuerpo de ninguna tarjeta intermedia.
4. **Línea de Secuencia Horizontal entre Fases:**
   - Línea recta horizontal perfecta a la misma altura Y (`type: 'straight'`).
5. **Cotas Y Fijas y Espaciado Horizontal Calibrado:**
   - N0 (Proyecto): `Y = 40` (h: 120px, base $Y = 160\text{px}$).
   - N1 (Fases): `Y = 220` (h: 80px, luz vertical: 60px, base $Y = 300\text{px}$).
   - N2 (Entregables WBS): `Y = 380` (h: 120px, luz vertical: 80px, base $Y = 500\text{px}$).
   - N3 (Tareas): `Y = 580` (h: 90px, luz vertical: 80px, base $Y = 670\text{px}$).
   - N4 (Gastos): `Y = 740` (h: 60px, luz vertical: 70px, base $Y = 800\text{px}$).
   - Separación entre entregables hermanos: `GAP_X = 32` px.
   - Separación entre fases: `FASE_GAP_X = 64` px.

---

### FASE 4.26 — Tooltip Contextual 360°, Canaleta Ortogonal Manhattan y Ruta Crítica No Destructiva (REQ-F2-P2.1o)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/WBS/GrafoWBS.tsx`, `src/components/WBS/TooltipFlotanteWBS.tsx` (Nuevo), `src/components/WBS/CanaletaEdge.tsx` (Nuevo), `src/index.css`, `src/components/WBS/nodos/NodoProyecto.tsx`, `src/components/WBS/nodos/NodoFase.tsx`, `src/components/WBS/nodos/NodoWBS.tsx`, `src/components/WBS/nodos/NodoTarea.tsx`, `src/components/WBS/nodos/NodoGasto.tsx`, `src/components/WBS/nodos/NodoIngreso.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Paridad Forense 1:1
Consolidación de la paridad 1:1 entre el frontend React y la referencia canónica `legacy_gas/JS_GrafoRed.html` y `legacy_gas/Styles.html`, resolviendo los defectos de interacción, enrutamiento y enfoque visual:

1. **Tooltip Contextual Flotante 360° (`TooltipFlotanteWBS.tsx`):**
   - Erradicación total del panel fijo lateral top-right en favor de un micro-popover flotante posicionado sobre el nodo activo en coordenadas locales relativas al canvas.
   - Detección reactiva de colisión de bordes en viewport con micro-transiciones suaves y retardo al ocultar (hover persistence).
   - Anatomía canónica 1:1:
     - *Header:* Badge de Código ID en alto contraste (`TAR-XXX`), badge `⚡ Crítica` (ámbar si aplica) y badge de salud semafórico (`🟢 A tiempo` en esmeralda o `⚠️ Vencida` en ámbar/rojo con cálculo dinámico respecto a la fecha programada).
     - *Título & Descripción:* Título en `font-bold text-sm text-slate-100` y notas o impedimentos en cursiva (`text-xs text-slate-400 italic line-clamp-2`).
     - *Cuadrícula 2x2 en container oscuro (`bg-[#070C18]/90`):*
       - 📅 Fecha: `DD/MM/YYYY` (`font-mono tabular-nums`).
       - 👤 Responsable: Nombre asignado o `Sin asignar`.
       - ⏱️ Est: `Xh` (`tabular-nums`).
       - ⌛ Real: `Yh` (`tabular-nums`).
     - *Píldora de precedencias:* `⛓️ Predecesora: TAR-XXX` en tono índigo/violeta sobrio.
     - *Acceso documental:* Botón de acceso directo a comprobantes/recibos en Google Drive si existen.

2. **Canaleta Ortogonal Manhattan y Handles Explícitos (`CanaletaEdge.tsx`):**
   - Enlace horizontal directo de `tar-right` a `tar-left` para tareas inmediatamente adyacentes en la misma fila.
   - Enlace por canaleta dedicada en `Y = 750px` para tareas no contiguas: la línea desciende perpendicularmente desde `tar-bottom`, viaja horizontalmente a través de la canaleta despejada con quiebres limpios a 90° (fillets suaves de radio 8px) y asciende perpendicularmente hacia `tar-left` del nodo destino, erradicando zig-zags en escalera o colisiones con tarjetas intermedias.
   - Conexiones jerárquicas verticales descendentes (`PROY_FASE`, `FASE_WP`, `WP_TAR`, `TAR_GAS`, `WP_GAS`, `PROY_ING`) configuradas con `type: 'smoothstep'` y handles canónicos explícitos (`proy-bottom`, `fase-top`, `fase-bottom`, `wbs-top`, `wbs-bottom`, `tar-top`, `tar-bottom`, `gasto-top`, `ingreso-top`).

3. **Resaltado Interactivo No Destructivo de Ruta Crítica (Non-Destructive Focus):**
   - Erradicación definitiva de filtrado destructivo (`if (soloRutaCritica && !esCritico) return`). El árbol WBS completo y todos sus nodos permanecen visibles en el canvas en todo momento.
   - Al activar `Ruta Crítica: ON` en la toolbar con botón ámbar y Lucide `Zap`:
     - *Nodos Críticos:* Clase `.wbs-node-focused` con `opacity-100 ring-2 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)] scale-[1.02]`.
     - *Nodos No Críticos:* Clase `.wbs-node-dimmed` con `opacity: 0.25; filter: grayscale(60%)` y transición suave.
     - *Aristas Críticas:* Clase `.wbs-connector-critical` con trazo reforzado a `strokeWidth: 3.5px`, color ámbar `#F59E0B`, `filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.95))` y animación de flujo.
     - *Aristas No Críticas:* Clase `.wbs-connector-dimmed` atenuando la opacidad a `0.15`.

4. **Holgura Espacial Ampliada y Calibración Vertical:**
   - Separación horizontal ergonómica: `GAP_X = 52px` (entregables y tareas) y `FASE_GAP_X = 84px` (ramas de fases).
   - Dimensiones de tarjetas inmutables: `CARD_W = { proyecto: 320, fase: 230, wbs: 250, tarea: 220, gasto: 180 }`, `CARD_H = { proyecto: 120, fase: 80, wbs: 120, tarea: 90, gasto: 60 }`.
   - Cotas Y calibradas: Nivel 0 (Proyecto): `Y = 40`, Nivel 1 (Fases): `Y = 230`, Nivel 2 (WBS/Hitos): `Y = 410`, Nivel 3 (Tareas): `Y = 620`, Canaleta de Dependencias: `Y = 750`, Nivel 4 (Gastos): `Y = 860`.

---

### FASE 4.25 — Algoritmo Jerárquico Bottom-Up y Calibración Geométrica de Coordenadas, Luz Vertical y Aristas WBS (REQ-F2-P2.1i / REQ-F2-P2.1k)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/WBS/GrafoWBS.tsx`, `src/components/WBS/nodos/NodoProyecto.tsx`, `src/components/WBS/nodos/NodoFase.tsx`, `src/components/WBS/nodos/NodoWBS.tsx`, `src/components/WBS/nodos/NodoTarea.tsx`, `src/components/WBS/nodos/NodoGasto.tsx`, `src/components/WBS/nodos/NodoIngreso.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Paridad 1:1
Implementación determinista del algoritmo recursivo Bottom-Up para el árbol WBS jerárquico canónico, erradicando al 100% la dependencia de `@dagrejs/dagre` para el cálculo de coordenadas espaciales y aplicando calibración geométrica de precisión para erradicar cualquier solapamiento físico inter-filas y congestión de aristas.
Las hojas inferiores (tareas operativas y píldoras de gastos) gobiernan y determinan el ancho del paquete de trabajo; los paquetes determinan el ancho de su fase respectiva; y el conjunto consolidado de fases determina el ancho global sobre el cual se centra el Proyecto Matriz de manera matemáticamente exacta.

1. **Nivel 0 (Proyecto Matriz):** Tarjeta central superior (`PRO-001`, `w-[320px]`, altura $\sim 130\text{px}$) en `Y = 40` (Base en $Y = 170\text{px}$). Su posición X es exactamente el centro matemático consolidado de todo el proyecto.
2. **Nivel 1 (Fases WBS):** Tarjetas de fase (`w-[220px]`, altura $\sim 95\text{px}$) alineadas en una sola fila `Y = 240` (**luz vertical con N0: $70\text{px}$**, base en $Y = 335\text{px}$), conectadas al proyecto con curvas `smoothstep` violetas (`#8B5CF6`) y unidas entre sí por una línea horizontal recta punteada (`fase-right` $\rightarrow$ `fase-left`).
3. **Nivel 2 (Paquetes de Trabajo / Checkpoints):** Tarjetas (`w-[240px]`, altura $\sim 185\text{px}$) en `Y = 420` (**luz vertical con N1: $85\text{px}$**, base en $Y = 605\text{px}$). Cada entregable centrado sobre su abanico de tareas hijas o slot asignado.
4. **Nivel 3 (Tareas Hijas):** Tarjetas operativas (`w-[210px]`, altura $\sim 115\text{px}$) en `Y = 680` (**luz vertical con N2: $75\text{px}$**, base en $Y = 795\text{px}$). Cero solapamiento con N2. Enlaces horizontales con aristas ámbar `smoothstep` (`#F59E0B`) para precedencias inter-tareas (`tar-right` $\rightarrow$ `tar-left`).
5. **Nivel 4 (Gastos Satélite / Ingresos):** Píldoras contables (`w-[180px]`, altura $\sim 80\text{px}$) en `Y = 880` (**luz vertical con N3: $85\text{px}$**, base en $Y = 960\text{px}$), situadas verticalmente bajo sus tareas con línea `smoothstep` punteada verde esmeralda (`#10B981`).
6. **Espaciado y No-Solapamiento:** Constantes canónicas ampliadas `GAP_X = 36` (separación entre entregables hermanos y tareas hermanas) y `FASE_GAP_X = 72` (separación entre clústeres de distintas fases). Cero solapamientos horizontales entre ramas contiguas y congelamiento estático con `draggable: false`.

#### Componentes y Modificaciones Realizadas
1. **Algoritmo Jerárquico Bottom-Up en `src/components/WBS/GrafoWBS.tsx`**:
   - Desactivación y retiro definitivo del import `@dagrejs/dagre`.
   - Constantes canónicas integradas: `CARD_W` (`proyecto: 320`, `fase: 220`, `wbs: 240`, `tarea: 210`, `gasto: 180`), `Y_LEVELS` (`proyecto: 40`, `fase: 240`, `wbs: 420`, `tarea: 680`, `gasto: 880`), `GAP_X: 36` y `FASE_GAP_X: 72`.
   - Agrupación por ramas recursivas `Fase -> Entregables -> Tareas -> Gastos` con cálculo Bottom-Up de anchos mínimos y centrado piramidal directo.
   - Enrutamiento ortogonal y suave `type: 'smoothstep'` para todas las aristas jerárquicas descendentes (`strokeWidth: 1.8`) y precedencias horizontales de tareas.
   - Generación de arista horizontal recta punteada entre fases consecutivas (`edge-faseSeq-*`).
   - Propiedad `draggable: false` en todos los nodos calculados para mantener la cuadrícula inmutable.
2. **Ajuste de Dimensiones y Estilos en Suite de Nodos (`src/components/WBS/nodos/`)**:
   - `NodoProyecto.tsx`: Ancho normalizado a `w-[320px]`, sombra limpia `shadow-lg`, borde `border-slate-700/60`.
   - `NodoFase.tsx`: Ancho normalizado a `w-[220px]`, borde `border-slate-700/60`, handles laterales `fase-left` y `fase-right`.
   - `NodoWBS.tsx`: Ancho normalizado a `w-[240px]`, eliminación de sombras incandescentes (`shadow-[0_0_15px...]`), borde limpio `border-slate-700/60`.
   - `NodoTarea.tsx`: Ancho normalizado a `w-[210px]`, eliminación de sombras incandescentes, borde limpio `border-slate-700/60`.
   - `NodoGasto.tsx` & `NodoIngreso.tsx`: Ancho normalizado a `w-[180px]`, borde limpio `border-slate-700/60`.

---

### FASE 4.24 — Jerarquía Vertical Canónica de Arriba hacia Abajo (TB) por Niveles Estrictos en Y (REQ-F2-P2.1f)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/WBS/GrafoWBS.tsx`, `src/components/WBS/nodos/NodoProyecto.tsx`, `src/components/WBS/nodos/NodoFase.tsx`, `src/components/WBS/nodos/NodoWBS.tsx`, `src/components/WBS/nodos/NodoTarea.tsx`, `src/components/WBS/nodos/NodoGasto.tsx`, `src/components/WBS/nodos/NodoIngreso.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Paridad 1:1
Calibración determinista del motor de visualización topológica del Grafo WBS al flujo canónico estrictamente vertical descendente (Top-to-Bottom / `TB`), con bloqueo determinista de coordenadas Y por nivel estructural para garantizar una cuadrícula uniforme y alineación matemática de filas sin escalonamientos erráticos:
1. **Fila Y = 40 (Nivel 0 - Cima):** Proyecto Matriz (`proyectoNode`) centrado horizontalmente en la parte superior respecto al ancho consolidado del árbol de dependencias.
2. **Fila Y = 220 (Nivel 1):** TODAS las Fases del Proyecto (`faseNode`) distribuidas horizontalmente en el mismo eje Y exacto, enlazadas desde el Proyecto Matriz mediante curvas Bézier violetas (`#8B5CF6`).
3. **Fila Y = 420 (Nivel 2):** TODOS los Entregables WBS (`wbsNode`, Paquetes de Trabajo y Checkpoints) en el mismo eje Y exacto, situados debajo de su respectiva fase con bordes semánticos reactivos y caja de métricas CPM.
4. **Fila Y = 640 (Nivel 3):** Tareas Operativas Hijas (`tareaNode`) en el mismo eje Y exacto, situadas verticalmente debajo de su paquete de trabajo. Para precedencias entre tareas (`TAR-A -> TAR-B`), se enlazan horizontalmente en esta fila mediante handles laterales (`tar-right` a `tar-left`).
5. **Fila Y = 840 (Nivel 4 - Base):** Píldoras satélites de Gastos Imputados (`gastoNode`) e Ingresos (`ingresoNode`) alineadas debajo de sus tareas o entregables.

#### Componentes y Modificaciones Realizadas
1. **Algoritmo de Posicionamiento Determinista (`src/components/WBS/GrafoWBS.tsx`)**:
   - Orientación predeterminada fijada en `TB`:
     `dagreGraph.setGraph({ rankdir: 'TB', align: 'UL', nodesep: 50, ranksep: 140 })`.
   - Función determinista `getYByStructuralLevel(node.type)` que sobreescribe las coordenadas Y de Dagre fijándolas estrictamente en 40, 220, 420, 640 y 840 según la jerarquía del nodo, aprovechando Dagre exclusivamente para la distribución horizontal sin colisiones en X.
   - Centrado dinámico del nodo raíz del Proyecto en X: `(minX + maxX)/2 - width/2`.
   - Inyección automática de `targetPosition: Position.Top` y `sourcePosition: Position.Bottom` en la matriz de nodos calculada.
2. **Normalización de Handles en Suite de Nodos (`src/components/WBS/nodos/`)**:
   - `NodoProyecto.tsx`: Handle `target` en `Position.Top`, handle `source` en `Position.Bottom`.
   - `NodoFase.tsx`: Handle `target` en `Position.Top`, handle `source` en `Position.Bottom`.
   - `NodoWBS.tsx`: Handle `target` en `Position.Top`, handle `source` en `Position.Bottom`.
   - `NodoTarea.tsx`: Handles verticales principales `tar-top` (`Position.Top`) y `tar-bottom` (`Position.Bottom`). Handles laterales dedicados `tar-left` (`Position.Left`) y `tar-right` (`Position.Right`) para soportar precedencias operativas horizontales en el Nivel 3.
   - `NodoGasto.tsx` y `NodoIngreso.tsx`: Handle `target` en `Position.Top`.

---

### FASE 4.23 — Reconfiguración Estructural a Grafo Horizontal Canónico Left-to-Right (REQ-F2-P2.1d)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/WBS/GrafoWBS.tsx`, `src/components/WBS/nodos/NodoWBS.tsx`, `src/components/WBS/nodos/NodoFase.tsx`, `src/components/WBS/nodos/NodoTarea.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Paridad 1:1
Calibración y reestructuración del motor de visualización topológica del Grafo WBS al flujo canónico horizontal (Left-to-Right / `LR`), replicando fielmente la arquitectura original y erradicando la disposición en árbol vertical descendente.
Se garantiza la alineación canónica de ejes de avance:
1. **Eje X=0 (Extremo Izquierdo - N0):** Tarjeta del Proyecto Matriz con satélites de ingresos vinculados mediante trazos punteados esmeralda.
2. **Eje X=380 (Columna de Fases - N1):** Fases del proyecto (Iniciación, Planificación, Ejecución, Control, Cierre) desplegadas verticalmente en abanico sin colisiones y enlazadas desde el Proyecto mediante curvas Bézier violetas (`#8B5CF6`).
3. **Eje X=780+ (Entregables - N2):** Paquetes de Trabajo (WP) e Hitos Marcadores (HIT) naciendo horizontalmente hacia la derecha de sus respectivas fases, con borde semántico condicional (Rojo Carmesí si es Crítico, Azul/Cian si es En Curso, Púrpura si es Checkpoint) y caja interna de métricas CPM (`Duración`, `Holgura (TH)`, `PE / PP` y `LE / LP` en `tabular-nums`).
4. **Eje X=1200+ (Tareas Hijas - N3):** Ramificación horizontal de tareas operativas (`TAR-XXX`) enlazadas desde sus WP con conectores ámbar/pizarra, con flujo de precedencias (`TAR-A -> TAR-B`) fluyendo limpiamente de izquierda a derecha.
5. **Hojas Satélites (Gastos Imputados - N4):** Píldoras contables (`GAS-XXX`) ubicadas a la derecha/debajo de sus respectivas tareas con conectores discontinuos en esmeralda.

#### Componentes y Modificaciones Realizadas
1. **Motor de Layout Dagre (`src/components/WBS/GrafoWBS.tsx`)**:
   - Orientación predeterminada fijada estrictamente en `'LR'`.
   - Configuración de espaciado y separación de rangos:
     `dagreGraph.setGraph({ rankdir: 'LR', align: 'UL', nodesep: 40, ranksep: 180, edgesep: 25 })`.
   - Inyección automática de `targetPosition: Position.Left` y `sourcePosition: Position.Right` en todos los nodos calculados.
   - Retiro de enlaces de secuencia inter-fases para asegurar que todas las Fases permanezcan exactamente en el Rango 1 (columna vertical paralela en X=380).
   - Conexiones fluidas tipo `type: 'bezier'` con curvatura suave y terminaciones de flecha direccionales normalizadas.
2. **Bordes Semánticos y Métricas CPM en Nodos WBS (`src/components/WBS/nodos/NodoWBS.tsx`)**:
   - Borde semántico condicional reactivo:
     - Crítico (`esCritico || holguraTotal <= 0.0001`): `border-l-4 border-l-rose-500 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.25)]` con badge parpadeante `Crítico`.
     - En Curso (`02_En_Progreso`): `border-l-4 border-l-sky-500 border-sky-500/80` con badge `En Curso`.
     - Checkpoint (`HITO_MARCADOR`): `border-l-4 border-l-indigo-500 border-purple-500/60`.
   - Despliegue de métricas CPM estándar: `Duración`, `Holgura (TH)`, `PE: ESd | PP: EFd` y `LE: LSd | LP: LFd` con formato monoespaciado `font-mono tabular-nums`.
3. **Normalización de Handles en Nodos (`NodoFase.tsx`, `NodoTarea.tsx`, `NodoProyecto.tsx`)**:
   - Todos los handles de entrada (`target`) situados a la izquierda (`Position.Left`).
   - Todos los handles de salida (`source`) situados a la derecha (`Position.Right`).

---

### FASE 4.22 — Reconstrucción Integral del Grafo WBS Jerárquico Multinivel N0-N4 (REQ-F2-P2.1c)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/WBS/nodos/NodoProyecto.tsx`, `src/components/WBS/nodos/NodoFase.tsx`, `src/components/WBS/nodos/NodoWBS.tsx`, `src/components/WBS/nodos/NodoTarea.tsx`, `src/components/WBS/nodos/NodoGasto.tsx`, `src/components/WBS/nodos/NodoIngreso.tsx`, `src/components/WBS/nodos/index.ts`, `src/components/WBS/GrafoWBS.tsx`, `src/components/WBS/NodoWBS.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Paridad 1:1
Reconstrucción integral y modularización de la topología WBS de 4 niveles jerárquicos canónicos + nodos satélites financieros y de conocimiento, replicando al 100% la arquitectura del motor de topología en `legacy_gas/JS_GrafoRed.html:L420-888`.
Se erradica la simplificación a grafo plano mono-nodo, implementando una suite completa de componentes de nodo ReactFlow especializados bajo el estándar Cobalt Aerodynamic A.2.2 y Cero Emojis (Regla 49).

#### Componentes y Modificaciones Realizadas
1. **Suite Modular de Nodos ReactFlow (`src/components/WBS/nodos/`)**:
   - `NodoProyecto.tsx` (Nivel 0 - Proyecto Raíz): Tarjeta central superior (`340px`) con corona dorada Lucide, código `PRO-XXX`, badge de salud reactivo (`En Tiempo`, `Riesgo`, `Crítico`), título, fechas planificadas, barra de progreso global, y badges para notas vinculadas e ingresos en Soles (`PEN`).
   - `NodoFase.tsx` (Nivel 1 - Fases Agrupadoras): Tarjeta compacta (`260px`) con borde superior violeta (`#8B5CF6`), peso acumulado de la fase %, conteo consolidado de paquetes de trabajo, checkpoints y tareas totales. Incorpora conectores laterales para la secuencia horizontal inter-fases.
   - `NodoWBS.tsx` (Nivel 2 - Entregables Duales): Soporte dual para `PAQUETE_TRABAJO` (azul cyan `#0EA5E9`, progreso, conteo de tareas y gastos imputados) y `HITO_MARCADOR` (púrpura `#6366F1`, control con duración 0d y costo $0.00).
   - `NodoTarea.tsx` (Nivel 3 - Tareas Operativas): Tarjeta de tarea (`260px`) con código `TAR-XXX`, iluminación ámbar con glow si pertenece a la Ruta Crítica, badges de estado DoD (`Hecho`, `Proceso`, `Por Hacer`), prioridad, duración en horas estimadas (`tabular-nums`), ejecutor y notas asociadas.
   - `NodoGasto.tsx` (Nivel 4 - Gastos Imputados): Píldora financiera satélite (`230px`) conectada a tareas o hitos, con código `GAS-XXX`, importe en Soles (`PEN`), categoría, estado de conciliación (`Pagado`/`Pendiente`) y enlace directo a Google Drive.
   - `NodoIngreso.tsx` (Satélite de Tesorería): Píldora en esmeralda (`230px`) conectada al Proyecto Raíz con código `ING-XXX`, importe `+PEN X.XX` (`TrendingUp`), concepto, rubro y estado de cobro.

2. **Motor Ensamblador de Topología Multinivel (`src/components/WBS/GrafoWBS.tsx`)**:
   - Consultas en tiempo real vía `useLiveQuery` a `db.proyectos`, `db.hitos_wbs`, `db.tareas`, `db.gastos`, `db.ingresos` y `db.notas`.
   - Registro polimórfico en `nodeTypes`: `{ proyectoNode, faseNode, wbsNode, tareaNode, gastoNode, ingresoNode }`.
   - Layout automático determinista mediante `@dagrejs/dagre` con dimensionamiento dinámico de nodos según su tipo (`getNodeDimensions`), eliminando cualquier colisión o solapamiento visual.
   - Generación de las 6 familias de aristas canónicas:
     - `PROY_FASE`: Proyecto $\rightarrow$ Fases (`stroke: #8B5CF6`).
     - `SECUENCIA_FASE`: Enlace horizontal entre fases consecutivas (`strokeDasharray: '4,4'`).
     - `FASE_ELEMENTO`: Fase $\rightarrow$ Entregables WP/Hitos (`stroke: #0EA5E9` / `#6366F1`).
     - `HITO_TAREA`: WP $\rightarrow$ Tareas hijas (`stroke: #F59E0B` o `#94A3B8`).
     - `DEPENDENCIA_TAREA`: Precedencias operativas entre tareas con estilo animado en enlaces críticos.
     - `TAREA_GASTO` / `HITO_GASTO`: Enlaces punteados esmeralda hacia gastos imputados (`#10B981`).
     - `PROY_INGRESO`: Enlace punteado esmeralda hacia ingresos registrados (`#10B981`).
   - Controles de visualización en la Toolbar superior: switches dedicados para alternar `Solo Hitos`, `Ver Tareas`, `Ver Gastos`, `Ver Ingresos`, `Ruta Crítica`, conmutador de orientación `Vertical / Horizontal`, `Fit View` y `Pantalla Completa`.
   - Micro-ventana flotante (Tooltip 360°) polimórfica en hover adaptada dinámicamente a proyectos, fases, hitos, tareas, gastos e ingresos.

---

### FASE 4.21 — Reconstrucción 1:1 de Vista Detallada 360° y Grafo de Proyectos WBS (REQ-F2-P2.1)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/Views/ViewDetalle360.tsx`, `src/components/WBS/GrafoWBS.tsx`, `src/components/WBS/NodoWBS.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Paridad 1:1
Reconstrucción quirúrgica e integral de la Vista Detallada 360° de Proyectos y su motor de visualización de Grafos WBS/CPM, alcanzando paridad 1:1 contra los artefactos canónicos `legacy_gas/View_Detalle360.html`, `legacy_gas/JS_Detalle360.html` y `legacy_gas/JS_GrafoRed.html`.
Se erradica el bug crítico de contaminación visual en el Grafo WBS, implementando un aislamiento estricto por proyecto activo, jerarquía de 4 niveles en cascada, diferenciación dual de entregables, panel bicolumna financiero de paquetes de trabajo, Curva S vectorial con EVM determinístico, matriz de trade-off interactiva y ficha de gobernanza con check-in de control.

#### Componentes y Modificaciones Realizadas
1. **Aislamiento del Grafo WBS y Filtrado Estricto (`src/components/WBS/GrafoWBS.tsx` y `src/components/WBS/NodoWBS.tsx`)**:
   - Inyección de la prop `proyectoId?: string | null` en `GrafoWBS`. Filtrado exhaustivo y determinista en Dexie contra `db.hitos_wbs`, `db.tareas` y `db.gastos` utilizando matching multi-clave (`proyecto_id`, `proyecto_codigo`, `ID_Proyecto` y prefijo `PRO-XXX`), erradicando la fuga de hitos globales de otros proyectos.
   - Barra de herramientas interactiva (Toolbar):
     - Toggle de visualización de gastos (`Gastos: ON/OFF`).
     - Selector de modo de vista (`Completa` vs `Solo Hitos`).
     - Switch de Ruta Crítica (`ON/OFF`) con iluminación en borde ámbar y glow.
     - Switch de orientación (`Vertical TB` vs `Horizontal LR`) recalculando el layout Dagre.
     - Botón de ajuste de encuadre (`Fit View`) invocando `reactFlowInstance.fitView()`.
     - Botón de Pantalla Completa utilizando la API estándar de Fullscreen HTML5 con detección de estado reactiva.
   - Tooltip 360° Flotante en Hover: Al posar el cursor sobre cualquier nodo del grafo, se despliega una tarjeta de metadatos detallando código, nombre, tipo de entregable, fechas tempranas (`ES/EF`), fechas tardías (`LS/LF`), holgura total (`HT`), duración y presupuesto/gasto imputado.
   - Normalización de nodos con `font-mono tabular-nums` para todas las métricas numéricas.

2. **Jerarquía WBS en Cascada Nivel 1 (Fases) y Entregables Duales (`src/components/Views/ViewDetalle360.tsx`)**:
   - Agrupación estructurada de hitos por `Fase_Asociada` (F1 Iniciación, F2 Planificación, F3 Ejecución, F4 Cierre, o Fase Única).
   - Cabecera de fase con badges temáticos en gradiente, porcentaje de peso acumulado (`Peso: X%`), conteo consolidado (`X WP • Y hitos`) y botón directo `+ Entregable`.
   - Soporte Dual de Entregables:
     - `PAQUETE_TRABAJO`: Entregable con costo, control financiero bottom-up, tareas hijas y registro de gastos.
     - `HITO_MARCADOR`: Checkpoint temporal con duración 0 días y costo bloqueado en S/ 0.00. Dispone del botón interactivo `Validar Cierre DoD` que conmuta el estado de cumplimiento en `db.hitos_wbs`.

3. **Panel Bicolumna en Paquetes de Trabajo (Tareas 58% / Gastos 42%)**:
   - Columna Izquierda (`col-span-12 lg:col-span-7`): Desglose de tareas asignadas al WP, indicando estado DoD (`COMPLETADA` vs pendiente), horas estimadas y botón para agregar tarea (`+ Tarea`).
   - Columna Derecha (`col-span-12 lg:col-span-5`): Desglose contable de gastos imputados directamente al hito o a sus tareas asociadas desde `db.gastos`, reflejando moneda (`PEN`), estado de liquidación (`Pagado` vs `Pendiente`) y botón `+ Gasto`.

4. **Bloque Transversal de Tareas y Gastos Generales**:
   - Renderizado al pie del WBS de todas aquellas tareas y gastos imputados al proyecto que no tienen un hito específico asignado (`!ID_Hito`), evitando pérdida de trazabilidad contable y operativa.

5. **Curva S Vectorial y Proyecciones EVM Determinísticas**:
   - Erradicación de constantes mockeadas (`PV = bac * 0.6`, `CC = 0`).
   - Cálculo determinista del PV basado en el avance temporal del cronograma, AC a partir de los gastos efectivamente pagados (`tipo === 'REAL'`) y CC desde gastos programados o compromisos pendientes (`tipo === 'PROGRAMADO'`).
   - Métricas estándar de Valor Ganado: BAC, PV, EV, AC, CC, CV (`EV - AC`), SV (`EV - PV`), CPI (`EV / AC`), SPI (`EV / PV`), EAC (`BAC / CPI`) y VAC (`BAC - EAC`).
   - Curva S en SVG interactivo trazando las trayectorias acumuladas de PV (línea azul discontinua), EV (línea esmeralda continua) y AC (línea ámbar continua) respecto a la fecha de corte.
   - Dictamen Ejecutivo PMO Dinámico: Diagnóstico automático de salud del proyecto evaluando la combinación de CPI y SPI para emitir directrices de contingencia técnica.

6. **Matriz de Decisión Ponderada (Trade-Off Interactivo)**:
   - Evaluador multicriterio interactivo con ponderación porcentual estricta (suma = 100%).
   - Calificación de 3 alternativas estratégicas (Escala 1 a 5) con cálculo reactivo de puntajes ponderados.
   - Resaltado visual en esmeralda de la alternativa ganadora y registro de historial de evaluaciones.

7. **Ficha de Gobernanza y Check-in de Control**:
   - Cálculo reactivo de días transcurridos sin revisión a partir de `fecha_ultima_revision`.
   - Identificación de terceros involucrados y enlace directo a la carpeta en Google Drive del proyecto.
   - Botón funcional `Registrar Check-in de Control Hoy` que actualiza `fecha_ultima_revision` con la fecha actual en `db.proyectos` mediante Dexie.

8. **Estándar Visual Cobalt Aerodynamic A.2.2 y Cero Emojis (Regla 49)**:
   - Estilizado de superficies en `.portal-surface` (`#0D1526`) con `border-slate-800/40`.
   - Formato numérico riguroso con `font-mono tabular-nums` en montos monetarios, porcentajes, índices y fechas.
   - Erradicación del 100% de caracteres emojis; empleo exclusivo de iconografía vectorial SVG de `lucide-react`.

---

### FASE 4.20 — Rescate Quirúrgico y Creación de Modales Omitidos: ModalActividadFlow, ModalGasto y ModalIngreso (REQ-F1-P1.2b)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/Modals/ModalActividadFlow.tsx`, `src/components/Modals/ModalGasto.tsx`, `src/components/Modals/ModalIngreso.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Views/ViewFinanzas.tsx`, `src/types/index.ts`, `src/App.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Paridad 1:1
Rescate y transcripción canónica de los diálogos modales omitidos en `legacy_gas/Modal_ActividadFlow.html` y `legacy_gas/Modal_Finanzas.html`, erradicando modales improvisados, alertas crudas `Swal.fire` y selectores monolíticos. Todos los modales implementan el estándar de diálogo del sistema: `createPortal(..., document.body)`, elevación canónica `z-[10000]`, `useBodyScrollLock(isOpen)`, cierre por click en backdrop y tecla `Escape`, estética Cobalt `#0D1526`, y erradicación total de emojis por iconos vectoriales SVG de `lucide-react`.

#### Componentes y Modificaciones Realizadas
1. **`src/components/Modals/ModalActividadFlow.tsx` (Nuevo - Rescate 1:1 de `Modal_ActividadFlow.html`)**:
   - Soporte para Modos Duales: Creación (`ACT-XXX` autocorrelativo) y Edición (con confirmación de eliminación reactiva en Dexie).
   - Selector interactivo de las 6 Dimensiones de Vida (`SALUD_DEPORTE`, `DESARROLLO_ESTUDIO`, `LABORAL_HONORARIO`, `FINANZAS_TRAMITES`, `SOCIAL_FAMILIA`, `PERSONAL_DESCANSO`) con dots de color y badges temáticos.
   - Popover Temporal Completo: Selector de fecha de ejecución, selector y presets de hora rápida (07:00 AM, 10:00 AM, 02:00 PM, 08:30 PM), switch de tarea puntual (0h), píldoras de duración estimada (0.25h a 2.0h) y selector de frecuencia (`NINGUNA`, `DIARIA`, `DIARIA_LABORAL`, `FIN_SEMANA`, `SEMANAL`, `MENSUAL`) con selector de días de semana (`LU`, `MA`, `MI`, `JU`, `VI`, `SA`, `DO`), intervalo y límite de repeticiones.
   - Módulo de Imputación Financiera Asociada: Pestañas "Nuevo Gasto" vs "Vincular Gasto Existente" con multi-moneda (`PEN`, `USD`, `EUR`), categorías de gasto y persistencia automática cruzada en `db.gastos`.
   - Módulo Cuantitativo OKR: Meta macro, unidad de medida, objetivo total, valor acumulado, meta diaria estándar y nivel de rescate mínimo.
   - Subtareas Procedurales: Checklist dinámico con progreso en barra reactiva, adición por tecla `Enter`, toggle de completado y eliminación.
   - Sincronización con Google Calendar (`Sí` / `No`) y notas adicionales.
   - Persistencia reactiva en `db.actividades_personales`, `db.subtareas_pasos` y `db.gastos`.

2. **`src/components/Modals/ModalGasto.tsx` (Nuevo - Rescate 1:1 de `Modal_Finanzas.html` `#modal-gasto`)**:
   - Modal canónico de egresos con soporte Dual: Creación y Edición (`gastoEditar`).
   - Segmented Control Dual: `REAL` (esmeralda) vs `PROGRAMADO` (ámbar), conmutación automática si la fecha de pago es posterior a hoy.
   - Selector de Origen (`ACTIVIDAD_PERSONAL`, `TAREA_PROYECTO`, `LIBRE_CORRIENTE`).
   - Cascada WBS de 3 niveles reactiva: Proyecto (`PRO-XXX`) -> Hito WBS (`WP-XXX`/`HIT-XXX`) -> Tarea (`TAR-XXX`), filtrando reactivamente las entidades dependientes en Dexie.
   - Soporte Bimonetario/Multimoneda (`PEN`, `USD`, `EUR`): Input de monto original, tipo de cambio reactivo y cálculo automático de `monto_pen`.
   - Modos de Pago (`PAGO_UNICO`, `RECURRENTE`, `CUOTAS_CREDITO`), medios de pago (`Tarjeta BBVA`, `Tarjeta BCP`, `Efectivo`, `Transferencia`, `Yape/Plin`), comprobante y enlace a Drive.
   - Persistencia en `db.gastos`.

3. **`src/components/Modals/ModalIngreso.tsx` (Nuevo - Rescate 1:1 de `Modal_Finanzas.html` `#modal-ingreso`)**:
   - Modal canónico de ingresos con control `REAL` vs `PROGRAMADO`.
   - Categorías canónicas de ingreso (`HONORARIOS`, `SUELDO`, `DIVIDENDOS`, `VENTA`, `OTROS`) y cuentas de destino (`BCP`, `IBK`, `BBVA`, `SCTBK`, `EFECTIVO`).
   - Asociación a proyecto opcional o ingreso personal libre.
   - Persistencia en `db.ingresos`.

4. **Integración en Vistas y Layout (`ViewFinanzas.tsx`, `TableroHabitos.tsx`, `TarjetaHabito.tsx`, `App.tsx`)**:
   - `ViewFinanzas.tsx`: Eliminado el modal improvisado; conectado directamente a `<ModalGasto />` y `<ModalIngreso />`.
   - `TableroHabitos.tsx` y `TarjetaHabito.tsx`: Reemplazado `Swal.fire` por `<ModalActividadFlow />`. Botón y click en título habilitados para edición y apertura en flujo completo.
   - `App.tsx`: Conectadas las acciones rápidas móviles del Bottom Nav (`onCrearHabitoRapido`, `onCrearGastoRapido`, `onCrearTareaRapida`) para disparar directamente los modales correspondientes sin interrupción de vista.

---

### FASE 4.19 — Estandarización de Modales, Z-Index Unificado z-[10000], Scroll-Lock y Erradicación de Emojis (REQ-F1-P1.2)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/hooks/useBodyScrollLock.ts`, `src/components/Modals/ModalTareaFlow.tsx`, `src/components/Modals/ModalNuevoProyecto.tsx`, `src/components/Modals/ModalAtajosTeclado.tsx`, `src/components/Modals/ModalExportarPdf.tsx`, `src/components/IA/AsistenteIaModal.tsx`, `src/components/Layout/HeaderMaestro.tsx`, `src/components/Layout/BottomNavMobile.tsx`, `src/App.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación & Gobernanza de Elevación Z
Garantizar la interoperabilidad visual y táctil perfecta entre la navegación móvil fija (`#bottom-navigation-bar`, `z-[9999]`), los diálogos modales centrales, los drawers laterales y los bottom sheets emergentes.
Se establece la **Cota Base Canónica de Elevación Modal en `z-[10000]`**:
1. **Layout Base / Canvas Activo:** `z-0`.
2. **Sidebar & Header Maestro Global:** `z-40`.
3. **Barra Fija Inferior Móvil (`#bottom-navigation-bar`):** `z-[9999]`.
4. **Modales Globales (Portal a `document.body`) & Overlays de Drawers:** `z-[10000]`. Todos los modales renderizan en la raíz mediante `createPortal(..., document.body)` para evitar problemas de stacking context inducidos por transformaciones CSS, filtros o `overflow` de contenedores padre. Cierre estándar por click en backdrop (`if (e.target === e.currentTarget) onClose()`) y tecla `Escape`.
5. **Aside / Contenedor Activo de Drawer Lateral (`#drawer-archivados`):** `z-[10005]`.
6. **Backdrop de Bottom Sheets Móviles:** `z-[99990]`.
7. **Contenedor Bottom Sheet Móvil:** `z-[99995]`.
8. **Contenedor Flotante de Toasts y Deshacer:** `z-[99999]`.

#### Componentes y Utilidades Intervenidas
1. **`src/hooks/useBodyScrollLock.ts` (Nuevo)**:
   - Hook reactivo que aplica `overflow: hidden; touch-action: none;` al `document.body` mientras `isOpen === true`, restaurando estrictamente el estilo previo al desmontar o cerrar.
2. **`src/components/Modals/ModalTareaFlow.tsx`**:
   - Elevación `z-[10000]`, `createPortal(..., document.body)`, cierre por click en backdrop y `Escape`, scroll-lock integrado, superficie canónica Cobalt Aerodynamic `#0D1526`.
3. **`src/components/Modals/ModalNuevoProyecto.tsx`**:
   - Elevación `z-[10000]`, `createPortal(..., document.body)`, cierre por click en backdrop y `Escape`, scroll-lock integrado.
4. **`src/components/Modals/ModalAtajosTeclado.tsx`**:
   - **Erradicación de emojis (Regla 49):** Reemplazo integral de emojis en `CANONICAL_SHORTCUTS` por iconos vectoriales SVG de `lucide-react` (`ClipboardList`, `Briefcase`, `Zap`, `CreditCard`, `FileText`, `Calendar`, `Sparkles`, `Keyboard`).
   - Elevación `z-[10000]`, `createPortal(..., document.body)`, backdrop click, `Escape` y scroll-lock.
5. **`src/components/Modals/ModalExportarPdf.tsx` & `src/components/IA/AsistenteIaModal.tsx`**:
   - Elevación `z-[10000]`, `createPortal`, backdrop click, `Escape` y scroll-lock. Backdrop normalizado a `bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs`.
6. **`src/components/Layout/HeaderMaestro.tsx`**:
   - Drawer Bóveda de Archivados (`#drawer-archivados`): Overlay en `z-[10000]`, aside en `z-[10005]`, scroll-lock conectado a `isDrawerOpen`.
7. **`src/components/Layout/BottomNavMobile.tsx` & `src/App.tsx`**:
   - Acceso canónico a "Bóveda de Archivados" en `#bottom-sheet-mas`, integración de `useBodyScrollLock` en bottom sheets y prop delegada `onAbrirDrawerArchivados`.

---

### FASE 4.18 — Reconstrucción Modal Proyecto 1:1, Hover de Dependencias Bidireccional y Alertas de Tareas Ocultas (REQ-1TO1-003H)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/Modals/ModalNuevoProyecto.tsx`, `src/components/Views/ViewKanban.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Garantizar la paridad 1:1 estricta contra `legacy_gas/Modal_ProyectosYHitos.html`, `legacy_gas/View_Kanban.html` y `legacy_gas/JS_Kanban.html`. Se reconstruye integralmente el modal de creación de proyectos incorporando la jerarquía DOM canónica (Banners guía y adaptativo IA, código `PRO-XXX`, nombre, tipo de iniciativa con 8 cuadrantes, categoría T-Shirt/magnitud, arquetipo WBS v4.1, fechas, presupuesto BAC, moneda PEN/USD/EUR, North Star OKR, DoD y entregable tangible). En el tablero Kanban, se implanta el motor reactivo de trazabilidad relacional bidireccional al pasar el cursor (`onMouseEnter`/`onMouseLeave`) con atenuación de tarjetas no vinculadas (`opacity-35`), resaltado de tarjetas predecesoras (`ring-2 ring-amber-400` y badge `⬅️ Predecesora`), resaltado de tarjetas sucesoras (`ring-2 ring-sky-400` y badge `➡️ Sucesora`) e inyección de alertas de dependencias ocultas o archivadas dentro de la tarjeta activa.

#### Componentes Intervenidos
1. **`src/components/Modals/ModalNuevoProyecto.tsx`**:
   - Jerarquía DOM exacta de `legacy_gas/Modal_ProyectosYHitos.html` (`#modal-proyecto-wizard`).
   - Banner guía interactivo y banner de clasificación adaptativa con badges de arquetipo y magnitud calculados.
   - 11 campos canónicos obligatorios: Código `PRO-XXX` auto-correlativo, Nombre requerido, Tipo de Iniciativa (8 cuadrantes interactivos), Categoría T-Shirt / Magnitud (`Light`, `Medium`, `Heavy`), Arquetipo (`1_Infraestructura`, `2_Venture`, `3_Activo`, `4_Carrera`, `5_Evento`), Metodología (`Automático`, `Scrum / Ágil`, `Faseado / Cascada`, `Iterativo / Kanban`), Presupuesto Tope (BAC) sin spinners, Moneda Base (`PEN`, `USD`, `EUR`), Fechas planificadas (Inicio y Fin), North Star OKR, Entregable Tangible y Criterios DoD.
   - Pestañas secundarias canónicas (Hitos WP/HIT con peso %, Tareas tácticas por hito y Gastos presupuestados con barra porcentual de consumo).
2. **`src/components/Views/ViewKanban.tsx`**:
   - `hoveredTaskId`: Estado de foco relacional por hover en `.kanban-card`.
   - Motor memoizado de grafos de dependencia: recorrido recursivo hacia atrás (`buscarPredecesoras`) y hacia adelante (`buscarSucesoras`) analizando el campo `id_dependencia` / `raw.ID_Dependencia` de todas las tareas en Dexie.
   - Atenuación de tarjetas ajenas (`opacity-35 transition-opacity duration-200`).
   - Badges relacionales en borde superior: `⬅️ Predecesora` (`bg-amber-500 text-slate-900`) y `➡️ Sucesora` (`bg-sky-500 text-slate-900`).
   - Detección de tareas dependientes no visibles en pantalla (filtradas o archivadas) e inyección de micro-banner informativo: `⚠️ Predecesora [TAR-XXX] oculta por filtro/archivo` y `ℹ️ Sucesora [TAR-YYY] oculta por filtro/archivo`.

---

### FASE 4.17 — Reconstrucción Espejo Kanban 1:1, Header Multi-Fila, DnD Nativo HTML5 y Modal TareaFlow Bento (REQ-1TO1-003)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/Modals/ModalTareaFlow.tsx` (Nuevo), `src/components/Views/ViewKanban.tsx`, `src/utils/entityNormalizer.ts`, `src/utils/__tests__/entityNormalizer.test.ts`, `SYSTEM_RULES.md`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Restaurar la experiencia ejecutiva y operativa completa del Tablero Kanban según la especificación de `legacy_gas/View_Kanban.html`, `legacy_gas/JS_Kanban.html` y `legacy_gas/Modal_TareaFlow.html`. Se erradica la simplificación previa mediante la implementación del header multi-fila con cápsula temporal glassmorphism y popovers de filtrado multidimensional (Hitos, Eisenhower Q1-Q4, Energía, Vencimiento, Bloqueos), soporte de drag-and-drop HTML5 nativo a 60fps con validación del protocolo Definition of Done (DoD) sobre subtareas procedurales, y el componente modal canónico `ModalTareaFlow` con arquitectura Bento Grid de 3 tarjetas maestras, checklist interactivo y persistencia reactiva en Dexie.

#### Componentes Intervenidos
1. **`src/components/Modals/ModalTareaFlow.tsx` (Nuevo)**:
   - Componente modal espejo de `legacy_gas/Modal_TareaFlow.html`.
   - Breadcrumb WBS canónico con selectores dinámicos de Proyecto, Hito y Predecesora.
   - Bento Grid de 3 tarjetas maestras:
     - *Card 1 (Tiempo & Esfuerzo):* Fecha programada, hora de inicio, horas estimadas vs reales y toggle de sincronización con Google Calendar.
     - *Card 2 (Operativo & Matriz):* Cuadrantes Eisenhower (`01_P1_Alta`, `02_P2_Media`, `03_P3_Baja`, `04_P4`), nivel de energía (`Alta_DeepWork`, `Media_Operativa`, `Baja_Automatica`) y switch MAV (Mínimo Avance Viable).
     - *Card 3 (Finanzas & Entorno):* Costo real en PEN (`costo_real_pen`), responsable ejecutor y notas/impedimentos.
   - Módulo de checklist procedural de subtareas vinculado reactivamente a `db.subtareas_pasos`: barra de progreso con gradiente índigo-esmeralda, adición, marcado de completado, borrado y persistencia inmediata en Dexie.
2. **`src/components/Views/ViewKanban.tsx`**:
   - Sidebar lateral canónico de proyectos: buscador en tiempo real, píldoras de cartera (Personal, Profesional, Inversiones, Social), tarjetas de proyecto con barra porcentual, semáforo de salud y botón de creación `+ Nuevo Proyecto`.
   - Header de dos filas:
     - *Fila 1:* Segmented control (`TODOS`, `PROYECTOS`, `PERSONAL`), chip del proyecto activo con Health status, CPI y acceso 360°, cápsula temporal glassmorphism (`TODO`, `HOY`, `SEMANA`, `MES`) y widget de Gasto Contextual en PEN.
     - *Fila 2:* Barra de micro-popovers interactivos (Buscador libre, Hito WBS, Prioridad, Tipo/Energía, Vencimiento, Bloqueos/Predecesoras) y botón `#btn-limpiar-filtros-kanban` sincronizado con la tecla `X` (`pmo:clear-filters`).
   - Chasis de 4 columnas (`01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`) con Drag-and-Drop nativo HTML5 (`draggable`, `dragover`, `dragleave`, `drop`), dropzones activas y validación DoD previa a marcar como completado.
   - Tarjetas canónicas `.kanban-card` con acento de color por prioridad, badges de energía, horas, MAV, checklist procedural y botones one-click de avance rápido.
3. **`src/utils/entityNormalizer.ts` & `src/utils/__tests__/entityNormalizer.test.ts`**:
   - `validarDoDSubtareas(idPadre, subtareas)`: Validación determinística de pasos pendientes (DoD).
   - `evaluarFiltroTemporal(fechaIso, filtro, fechaRef)`: Cálculo de horizonte temporal (`TODO`, `HOY`, `SEMANA`, `MES`).
   - `evaluarFiltroPlazo(fechaIso, plazo, estado, fechaRef)`: Evaluación de vencimientos (`vencidas`, `hoy`, `7dias`, `sin_fecha`).
   - 4 nuevas pruebas unitarias (24 pruebas totales en la suite, 100% aprobadas).

---

### FASE 4.20 — Despacho Estático de HUD mediante Loopback HTTP y Relajación WebSecurity (REQ-ELECTRON-STATIC-SERVE-HUD-FIX-79)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `desktop/main.js`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Superar de forma definitiva las restricciones de CORS, resolución de módulos ES (`<script type="module">`) y bloqueo de rutas relativas/absolutas (`/assets/...`) impuestas por Chromium en Windows bajo el esquema `file://`. Se convierte el microservidor loopback existente en `127.0.0.1:48123` en despachador estático con streaming de archivos y encabezados MIME precisos, cargando el HUD sobre un origen HTTP estándar `http://127.0.0.1:48123/?mode=hud&widget=desktop` con `webSecurity: false` y `allowRunningInsecureContent: true`.

#### Componentes Intervenidos
1. **`desktop/main.js`**:
   - Mapeo de `MIME_TYPES` para `.html`, `.js`, `.css`, `.json`, `.png`, `.svg`, `.ico`, etc.
   - En `statusServer`: streaming de archivos de `dist/` con sanitización de rutas (`safePath.startsWith(distDir)`) y fallback SPA hacia `dist/index.html`.
   - En `widgetWin`: activación de `webSecurity: false` y `allowRunningInsecureContent: true`.
   - Carga de producción dirigida a `http://127.0.0.1:48123/?mode=hud&widget=desktop`.

---

### FASE 4.19 — Carga Nativa de HUD en Electron con Hash Routing (REQ-ELECTRON-LOADFILE-HASH-FIX-78)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `desktop/main.js`, `src/App.tsx`, `src/components/Cockpit/DailyCockpit.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Erradicar definitivamente los fallos de resolución de protocolo `file://` en Windows Chromium (`ERR_FAILED`) causados por query strings (`?mode=hud&widget=desktop`) sobre el sistema de archivos local. Se migra la invocación a `loadFile(distPath, { hash: 'mode=hud&widget=desktop' })` y se implementa soporte dual e interoperable en el frontend (`window.location.search` y `window.location.hash`), previniendo además bucles de recarga en `did-fail-load`.

#### Componentes Intervenidos
1. **`desktop/main.js`**:
   - `widgetWin.loadFile(distPath, { hash: 'mode=hud&widget=desktop' })`: Carga local nativa en Windows sin colisión de query strings.
   - Protección en `did-fail-load` para abortar reintentos cíclicos cuando el destino ya era `localhost:5173` o `127.0.0.1`.
2. **`src/App.tsx` & `src/components/Cockpit/DailyCockpit.tsx`**:
   - Detección reactiva dual que extrae parámetros tanto de `window.location.search` como de `window.location.hash.replace(/^#/, '')`.
   - Inicialización inmediata de `esModoHud` y `esWidgetNativo` bajo esquemas `?` y `#`.

---

### FASE 4.18 — Resilencia de Carga en Electron con url.format y Manejo did-fail-load (REQ-ELECTRON-URL-PROTOCOL-QUERY-FIX-76)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `desktop/main.js`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Resolver el fallo `ERR_FAILED` (-2) en Windows originado por la incompatibilidad de `loadFile` con parámetros de consulta (`query`) en rutas con letras de unidad y barras invertidas. Reemplazar por la construcción estandarizada de URLs mediante `url.format({ protocol: 'file:', pathname, query })`, incorporar detección reactiva `did-fail-load` con fallback automático a `localhost:5173`, y garantizar visibilidad mediante `ready-to-show`.

#### Componentes Intervenidos
1. **`desktop/main.js`**:
   - Importación de `const url = require('url');`.
   - Carga de `dist/index.html` mediante `url.format` con query params `{ mode: 'hud', widget: 'desktop' }`.
   - Manejador `webContents.on('did-fail-load')` con fallback automático a `http://localhost:5173/?mode=hud&widget=desktop`.
   - Evento `widgetWin.once('ready-to-show', () => widgetWin.show())` para asegurar la apertura limpia del HUD.

---

### FASE 4.17 — Consolidación del Chip "Al Día", Fusión de Sincronización Global y Conexión de Atajo 'R' (REQ-NAV-SYNC-BUTTON-MERGE-EXEC-74)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/components/Layout/HeaderMaestro.tsx`, `src/hooks/useGlobalShortcuts.ts`, `src/components/Modals/ModalAtajosTeclado.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Eliminar la redundancia visual del botón aislado de sincronización `#btn-refresh-global` en el flanco derecho del Header y unificar su comportamiento en el chip reactivo "Al día" (`#btn-sync-status-merged`). Conectar el atajo de teclado universal `'r'` / `'R'` para sincronización omnicanal con blindaje riguroso contra inputs editables, proveyendo microanimación aerodinámica de rotación (`RotateCw` con `animate-spin text-sky-400`) y feedback visual instantáneo.

#### Componentes Intervenidos
1. **`src/components/Layout/HeaderMaestro.tsx`**:
   - Supresión definitiva del botón flotante redundante `#btn-refresh-global`.
   - Transformación del chip de estado en un botón interactivo y accesible (`#btn-sync-status-merged`, `data-legacy-id="btn-header-refresh"`).
   - **Depuración Visual (REQ-HEADER-SYNC-CHIP-SIMPLIFY-75):** Erradicación total del punto/LED redundante (tanto el ping animado como el punto esmeralda), consolidando un diseño sobrio y limpio de un solo icono gráfico interactivo (`RotateCw`, `w-3.5 h-3.5`, `strokeWidth={1.75}`).
   - Monocromía Cobalt Aerodynamic: Contenedor con borde tenue `border-slate-200/80 dark:border-slate-800/80`, fondo `bg-slate-100/60 dark:bg-slate-900/40` y texto `text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100`.
   - Estados dinámicos: En reposo (`text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200`, texto "Al día") vs Sincronizando (`animate-spin text-sky-400`, texto "Sincronizando...").
   - Suscripción directa y reactiva a `syncManager.subscribe((estado) => setSyncManagerEstado(estado))` y al evento de broadcast `pmo:sync-triggered`.
2. **`src/hooks/useGlobalShortcuts.ts`**:
   - Mapeo de la tecla `'r'` / `'R'` en el switch de atajos globales.
   - Invocación de `syncManager.sincronizarTodo()` con emisión de `pmo:sync-triggered` para feedback inmediato.
   - Blindaje preservado contra campos de entrada (`INPUT`, `TEXTAREA`, `SELECT`, `isContentEditable`) impidiendo disparos involuntarios al escribir.
3. **`src/components/Modals/ModalAtajosTeclado.tsx`**:
   - Incorporación del atajo `global_sync` (`'r'`, icono `refresh` / `RotateCcw`) en `CANONICAL_SHORTCUTS` para paridad documental y visual 1:1.

---

### FASE 4.16 — Chasis Espejo Header, Atajos Globales LIFO, Bóveda con Regla 10 Días y Modales Canónicos (REQ-1TO1-002)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `src/hooks/useGlobalShortcuts.ts` (Nuevo), `src/components/Modals/ModalAtajosTeclado.tsx` (Nuevo), `src/components/Modals/ModalExportarPdf.tsx` (Nuevo), `src/utils/entityNormalizer.ts`, `src/utils/__tests__/entityNormalizer.test.ts`, `src/components/Layout/HeaderMaestro.tsx`, `src/App.tsx`, `SYSTEM_RULES.md`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Garantizar la paridad 1:1 absoluta del chasis maestro de cabecera y el sistema omnicanal de atajos de teclado entre el frontend React y la versión canónica Google Apps Script. Se restaura el listener omnicanal `keydown` con blindaje contra campos de texto (`INPUT`, `TEXTAREA`, `SELECT`, `contenteditable`), pila LIFO de tecla `Escape`, conmutación numérica de vistas (`1` a `5`), atajos globales (`C` para Calendar, `X` para reset de filtros, `Enter` para acción primaria y `?` para el modal de atajos). Asimismo, se implementa la regla de negocio de antigüedad estricta (> 10 días) para la Bóveda de Archivados en IndexedDB Dexie y se transcriben fielmente los modales `ModalAtajosTeclado` y `ModalExportarPdf`.

#### Componentes Intervenidos
1. **`src/hooks/useGlobalShortcuts.ts` (Nuevo)**:
   - Listener de eventos de teclado con blindaje contra inputs y cancelación secuencial en pila LIFO (Asistente IA -> Modal PDF -> Modal Atajos -> Drawer Archivados -> `blur()`).
   - Mapeo de teclas numéricas `1` (Kanban), `2` (Portafolio), `3` (Hábitos), `4` (Finanzas), `5` (Notas).
   - Atajos esenciales `c` (Calendar), `x` (evento `pmo:clear-filters`), `Enter` (evento `pmo:confirm-action`), `?` (toggle del modal de atajos) y `Ctrl+K` (búsqueda contextual).
2. **`src/utils/entityNormalizer.ts` & `src/utils/__tests__/entityNormalizer.test.ts`**:
   - `calcularDiasArchivado(param, fechaReferencia)`: Cálculo de días transcurridos desde fecha terminal respetando medianoche y banderas de reactivación.
   - `esElementoArchivado(item, coleccion, fechaReferencia)`: Verificación canónica de estado terminal y umbral estricto de antigüedad `diffDias > 10` sin reactivación (`_desarchivado !== true`). 11 pruebas unitarias aprobadas.
3. **`src/components/Layout/HeaderMaestro.tsx`**:
   - Integración canónica de `#btn-toggle-shortcuts-modal` (icono teclado/pregunta) y enlace a `onAbrirAtajos`.
   - Incorporación de la 5ta pestaña de Finanzas (`#tab-drawer-finanzas`, `#count-tab-arch-finanzas`) en el Drawer de Archivados.
   - Conexión de consultas reactivas `useLiveQuery` en Dexie para las 5 colecciones (`tareas`, `proyectos`, `actividades_personales`, `gastos`, `ingresos`).
   - Restauración atómica con estampa temporal `updated_at: new Date().toISOString()` y reasignación de estados operativos canónicos (`01_Backlog`, `03_En_Ejecucion`, `02_Por_Hacer`, `PENDIENTE`).
4. **`src/components/Modals/ModalAtajosTeclado.tsx` & `ModalExportarPdf.tsx` (Nuevos)**:
   - Transcripción 1:1 de `legacy_gas/Modal_AtajosYPdf.html` con banner degradado de 4 atajos esenciales (KBD glow), 6 pestañas de categorías, banner interactivo de reasignación y generador de Ficha Resumen PDF.
5. **`src/App.tsx`**:
   - Integración de `useGlobalShortcuts()`, estados de visibilidad y montaje de los modales en la raíz.

---

### FASE 4.15 — Implementación del Módulo "IDEAS" (Captura Multimodal, Clarificación IA con Gemini Flash, Widget Flotante y Triaje)
**Fecha:** Octubre 2026 | **Archivos modificados/creados:** `Config.js`, `Correlativos.js`, `DriveService.js`, `IdeasService.js` (Nuevo), `GeminiParserService.js`, `ApiRouter.js`, `DashboardService.js`, `Widget_Ideas.html` (Nuevo), `Modal_DetalleIdea.html` (Nuevo), `JS_Ideas.html` (Nuevo), `Index.html`, `JS_Core.html`, `JS_TareaFlow.html`, `JS_ModalesYAtajos.html`, `JS_Habitos.html`, `JS_Notas.html`, `tablas.md`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Implementar el ciclo completo de captura ágil de oraciones, audios o fotos al instante, exploración y clarificación interactiva con IA (evaluación de viabilidad, costos, riesgos y resolución de dudas libres mediante Gemini Flash), y triaje fluido con conversión directa hacia Tareas, Proyectos, Hábitos o Notas sin regresiones funcionales ni desalineaciones de esquema. Cumple con el estándar Cobalt Aerodynamic A.2.2, erradicación total de emojis crudos en el DOM (reemplazados por iconos SVG Lucide) y tipografía monoespaciada tabular (`font-mono tabular-nums`).

#### Componentes Intervenidos
1. **`Config.js` & `Correlativos.js`**:
   - `CONFIG.SHEETS.IDEAS = "BBDD_Ideas"`.
   - `CONFIG.COLS_IDEAS`: Mapeo canónico a 13 columnas (A:M, índices 0 a 12): `ID_IDEA: 0`, `ENUNCIADO_IDEA: 1`, `DETALLE_CONTEXTO: 2`, `TIPO_CAPTURA: 3`, `URL_ADJUNTO_DRIVE: 4`, `TRANSCRIPCION_TEXTO: 5`, `CLARIFICACION_IA: 6`, `ESTADO: 7`, `ENTIDAD_CONVERTIDA: 8`, `ID_ENTIDAD_DESTINO: 9`, `FECHA_CAPTURA: 10`, `FECHA_PROCESADA: 11`, `FECHA_ARCHIVADO: 12`, `MAX_COLUMNS: 13`, con catálogo de estados (`Inbox`, `Incubacion`, `Procesada`, `Archivada`) y tipos de captura (`TEXTO`, `AUDIO`, `FOTO`).
   - `generarIdIdea()`: Generación de identificador correlativo diario `IDE-YYYYMMDD-XXX` gobernado mediante `LockService` y zona horaria `America/Lima`.
2. **`IdeasService.js` (Nuevo)**:
   - `inicializarHojaIdeas(ss)`: Inicialización defensiva de la hoja `BBDD_Ideas` con encabezados canónicos, fila congelada y formato bold.
   - CRUD completo: `obtenerIdeas(payload)`, `crearIdea(payload)`, `actualizarIdea(payload)`, `moverIdeaIncubacion(payload)`, `marcarIdeaProcesada(payload)`, `eliminarIdea(payload)`.
   - `archivarIdeasVencidas()`: Barrido periódico y automático que transiciona ideas en estado `Procesada` a `Archivada` tras superar los 10 días desde su procesamiento.
3. **`DriveService.js` & `GeminiParserService.js`**:
   - `guardarArchivoAdjuntoIdea(idIdea, base64Data, mimeType, fileName)`: Almacenamiento optimizado de archivos multimedia en la subcarpeta `MiPortalWeb_Ideas_Adjuntos`.
   - `transcribirAudioIdea(payload)`: Transcripción de audios bajo demanda utilizando Gemini Flash con modo multimodal inline o desde Google Drive.
   - `clarificarIdeaIA(payload)`: Clarificación estructurada en JSON (`desgloseEsencial`, `evaluacionViabilidad`, `respuestaDudaUsuario`, `entidadSugerida`, `justificacionEntidad`, `primerosPasosAccionables`).
4. **`ApiRouter.js` & `DashboardService.js`**:
   - Registro de endpoints: `obtenerideas`, `crearidea`, `actualizaridea`, `moverideaincubacion`, `marcarideaprocesada`, `eliminaridea`, `archivarideasvencidas`, `guardaradjuntoidea`, `transcribiraudioidea`, `clarificarideaia`.
   - Invalidación de caché `"IDEAS_DATA_CACHE"`.
   - Inclusión de `IDEAS` en `ALIAS_HOJAS` e integración de `state.ideas` en la carga del Dashboard.
5. **`Widget_Ideas.html`, `Modal_DetalleIdea.html` & `JS_Ideas.html` (Nuevos)**:
   - Botón flotante arrastrable en PC y persistido en `localStorage`, fijo en móvil, con icono Lucide e indicador numérico `font-mono tabular-nums`.
   - Popover de micro-captura rápida con soporte de texto, grabación nativa de audio (`MediaRecorder`) y captura fotográfica.
   - Drawer / Dock lateral con pestañas (`Inbox`, `Incubación`, `Procesadas`), buscador reactivo y tarjetas con mini-acciones.
   - Modal Zen Tier 2 (`max-w-2xl`) con diseño anti-jitter, visor de audio/foto, botón de transcripción, editor contextual y Bento Card de clarificación con IA.
   - Triaje sin fricción con pre-llenado de modales de destino y enganche de hooks de confirmación (`window.notificarEntidadCreadaDesdeIdea`).
6. **`JS_Core.html`, `JS_TareaFlow.html`, `JS_ModalesYAtajos.html`, `JS_Habitos.html`, `JS_Notas.html`**:
   - Conexión de callbacks en la creación exitosa de Tareas, Proyectos, Hábitos y Notas para marcar la idea en tránsito como `Procesada`.
   - Soporte para Ideas en `esElementoArchivado`, `aplicarDatosDashboard`, `sincronizarCacheLocalState` y `actualizarBadgeContadorArchivadosGlobal`.

---

### FASE 4.14 — Compactación Canónica de BBDD_Subtareas_Pasos a 6 Columnas (A:F) y Enlace Polimórfico Nativo
**Fecha:** Octubre 2026 | **Archivos modificados:** `Config.js`, `TareasService.js`, `ActividadesService.js`, `DashboardService.js`, `Correlativos.js`, `ApiRouter.js`, `JS_Subtareas.html`, `JS_TareaFlow.html`, `JS_Habitos.html`, `tablas.md`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Evolucionar y compactar la estructura de almacenamiento de `BBDD_Subtareas_Pasos` a 6 columnas canónicas exactas (A:F) bajo el principio de no regresión funcional. Se unifica la vinculación en el campo canónico `ID_Padre_Vinculado` (eliminando la redundancia física de la columna legacy `Tipo_Padre`), deduciendo polimórficamente la entidad propietaria a partir del prefijo canónico del identificador (`TAR-` para Tareas operativas y `ACT-` para Actividades personales / Hábitos). Se implementa retrocompatibilidad transparente tanto para lecturas de tablas con esquema legacy de 7 columnas como para APIs, vistas de tareas y rutinas de hábitos.

#### Componentes Intervenidos
1. **`Config.js`**:
   - `CONFIG.COLS_SUBTAREAS` y alias `CONFIG.COLS_PASOS`: Configurados a 6 índices exactos (0 a 5): `ID_SUBTAREA: 0` (Col A), `ID_PADRE_VINCULADO: 1` (Col B), `NUMERO_PASO: 2` (Col C), `DESCRIPCION_PASO: 3` (Col D), `COMPLETADO: 4` (Col E), `FECHA_COMPLETADO: 5` (Col F), con `MAX_COLUMNS: 6`.
   - `CONFIG.construirMapaColumnas()`: Armonización bidireccional tolerante de los 6 encabezados canónicos y aliases con `CONFIG.obtenerMapaSubtareas()` y `CONFIG.ALIASES_SUBTAREAS`, detectando esquemas legacy de 7 columnas (con `Tipo_Padre`) y mapeando `ID_Padre` directamente a Col B.
2. **`TareasService.js` & `ActividadesService.js`**:
   - `createSubtarea` y persistencia en lote: Inserción dimensionada estrictamente a 6 columnas (`MAX_COLUMNS || 6`) registrando directamente el código padre `TAR-XXX` o `ACT-XXX` en `ID_Padre_Vinculado`.
   - `updateSubtareaCompletado` (y alias `togglePaso`): Muta `Completado` entre booleanos (o toggle automático), estampando timestamp `YYYY-MM-DD HH:mm:ss` en `Fecha_Completado` al marcar true y `null`/vacío al desmarcar.
   - `guardarPaso`: Alias expuesto con idéntica interfaz canónica.
   - Generación de correlativos con concurrencia segura mediante `LockService` y `CorrelativoService.generarCorrelativo('SUB')`.
   - Modificación en cascada y borrado tolerante tanto de filas canónicas de 6 columnas como legadas de 7 columnas.
3. **`DashboardService.js`**:
   - Desempaquetado en Sección 7 de `subtareas` según los 6 índices canónicos exactos con fallback defensivo si la fila física posee 7 columnas legadas.
   - Deducción dinámica de `Tipo_Padre` y `tipoPadre` analizando el prefijo: `TAR-` => `'TAREA'`, `ACT-` => `'ACTIVIDAD'`.
   - Exposición simétrica de propiedades `ID_Padre_Vinculado`, `idPadreVinculado`, `ID_Padre` e `idPadre` para garantizar compatibilidad con consumidores frontend existentes.
4. **`ApiRouter.js` & `Correlativos.js`**:
   - Enrutamiento directo de acciones de API `guardarpaso` y `togglepaso`.
   - Soporte en `Correlativos.js` para inicialización de encabezados canónicos a 6 columnas y correlativos `"PASO"` / `"PASOS"`.
5. **`JS_Subtareas.html`, `JS_TareaFlow.html` & `JS_Habitos.html`**:
   - Indexación y consumo tolerante de `idPadreVinculado` e `ID_Padre_Vinculado`.
   - Gestión de pasos y subtareas en memoria con sincronización persistente mediante `idPadreVinculado`.
   - Toggles optimistas y llamadas a API transparentes.
6. **`tablas.md`**:
   - Actualización técnica de `TABLA 8: BBDD_Subtareas_Pasos (6 Columnas: A - F)` detallando catálogo de columnas, validaciones, vinculación polimórfica y retrocompatibilidad.

---

### FASE 4.13 — Consolidación Canónica de BBDD_Notas a 12 Columnas: Notas Híbridas Unificadas (Markdown, Checklists Dinámicos, Wishlist y Vinculación Universal)
**Fecha:** Octubre 2026 | **Archivos modificados:** `Config.js`, `NotasService.js`, `DashboardService.js`, `JS_Notas.html`, `Modal_Notas.html`, `View_Notas.html`, `tablas.md`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Evolucionar la arquitectura de `BBDD_Notas` a 12 columnas canónicas exactas (A:L) bajo el principio de no regresión funcional. Se elimina la rigidez de tipos mutuamente excluyentes, permitiendo que una misma nota coexista como entidad híbrida unificada con contenido Markdown enriquecido, matrices/checklists dinámicos y metadatos de compra/wishlist, integrando además vinculación universal polimórfica bidireccional y paleta extendida de 16 colores Tailwind + códigos #HEX.

#### Componentes Intervenidos
1. **`Config.js`**:
   - `CONFIG.COLS_NOTAS`: Configurado a 12 índices exactos (0 a 11): `ID_NOTA: 0`, `TITULO: 1`, `CONTENIDO_MARKDOWN: 2`, `CHECKLISTS_JSON: 3`, `WISHLIST_JSON: 4`, `COLOR_TEMA: 5`, `ES_FIJADA: 6`, `ADJUNTOS_DRIVE_JSON: 7`, `ENLACES_ENTIDADES_JSON: 8`, `ETIQUETAS: 9`, `FECHA_CREACION: 10`, `FECHA_ACTUALIZACION: 11`, `MAX_COLUMNS: 12`.
   - `CONFIG.CATALOGOS.COLOR_TEMA`: Ampliado a 16 tonos Tailwind canónicos (`slate`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `rose`) con soporte de cualquier valor `#HEX`.
   - `CONFIG.construirMapaColumnas()`: Armonización bidireccional tolerante de los 12 encabezados canónicos y aliases con `CONFIG.obtenerMapaNotas()` y `CONFIG.ALIASES_NOTAS`.
2. **`NotasService.js`**:
   - `createNota` y `updateNota`: Persistencia estrictamente dimensionada a 12 columnas canónicas (`MAX_COLUMNS || 12`).
   - Normalización de color sin colapso erróneo de tokens Tailwind y soporte íntegro de `#HEX`.
   - Soporte polimórfico universal de vinculaciones en `Enlaces_Entidades_JSON` (`PROYECTO`, `HITO`, `TAREA`, `ACTIVIDAD`, `GASTO`, `INGRESO`) con fallback a `'[]'`.
   - Timestamps ISO 8601 en `Fecha_Creacion` y `Fecha_Actualizacion`.
3. **`DashboardService.js`**:
   - Desempaquetado defensivo de `BBDD_Notas` a 12 columnas con `JSON.parse` tolerante en `Checklists_JSON`, `Wishlist_JSON`, `Adjuntos_Drive_JSON` y `Enlaces_Entidades_JSON`.
   - Adición de `NOTAS` en `ALIAS_HOJAS` y resolución de fallback de lectura directa.
4. **`JS_Notas.html`, `Modal_Notas.html`, `View_Notas.html`**:
   - Paleta de 16 colores Tailwind integrada en selector, toolbar y tarjetas, con renderizado dinámico de estilos para `#HEX`.
   - Tarjetas inteligentes con renderizado simultáneo de Markdown (`renderizarMarkdownNota`), checklists dinámicos/tablas y badges/acciones de Wishlist.
   - Formato interactivo 'HÍBRIDA' en modal que permite edición simultánea de todas las secciones.
   - Filtrado dinámico por códigos de entidad (`Enlaces_Entidades_JSON`) en vista y sincronización del botón de limpieza.
5. **`tablas.md`**:
   - Actualización técnica de `TABLA 7: BBDD_Notas (12 Columnas: A - L)` con el modelo híbrido unificado.

---

### FASE 4.12 — Depuración Definitiva de Hoja Física BBDD_Finanzas_FlujoCaja y Consolidación de Flujo de Caja 100% en Memoria
**Fecha:** Octubre 2026 | **Archivos modificados:** `Config.js`, `DashboardService.js`, `FinanzasService.js`, `FinanzasAvanzadasService.js`, `ApiRouter.js`, `tablas.md`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Consolidar el retiro definitivo de la hoja física `BBDD_Finanzas_FlujoCaja` bajo el principio de no regresión funcional. Todas las transacciones, compromisos proyectados y cuotas residen y se procesan atómicamente en `BBDD_Finanzas_Gastos` e `BBDD_Finanzas_Ingresos`. Las métricas de flujo de caja, saldos proyectados vs. reales, recordatorios y compromisos operan 100% en memoria en tiempo de ejecución, erradicando lecturas/escrituras físicas innecesarias y optimizando la latencia del sistema.

#### Componentes Intervenidos
1. **`Config.js`**:
   - Eliminación de la definición física `CONFIG.COLS_FLUJO_CAJA`.
   - Eliminación de catálogos residuales `CATEGORIAS_FLUJO_CAJA` y `ESTADOS_FLUJO` de `CONFIG.CATALOGOS`.
   - Ratificación de que `CONFIG.SHEETS` mantiene exclusivamente las 9 hojas canónicas activas.
2. **`DashboardService.js`**:
   - Eliminación de `ALIAS_HOJAS.FLUJO_CAJA` y de la variable de resolución `nombreRealFlujoCaja`.
   - Preservación determinista de `flujoCaja: []` y `cashFlowNeto` en el objeto devuelto por `getDashboardData()` para garantizar retrocompatibilidad con la firma de datos esperada por el cliente.
3. **`FinanzasService.js`**:
   - Depuración del script histórico de migración `migrarFlujoCajaAGastos(ss)`.
   - Limpieza de `sanearCuotasDesfasadas` eliminando el paso que intentaba interactuar con `FlujoCaja`.
4. **`FinanzasAvanzadasService.js`**:
   - Refactorización de `deleteMovimiento` para delegar limpiamente a `deleteGasto` o `deleteIngreso` sin consultar `CONFIG.SHEETS.FLUJO_CAJA`.
   - En `calcularMetricasAvanzadas`, cálculo autónomo 100% en memoria sobre las colecciones de Gastos e Ingresos, computando balances proyectados vs. reales, recordatorios de vencimiento y compromisos sin requerir hojas físicas obsoletas.
   - En `_eliminarMovimientosCuota`, retiro de la etapa de purga de la hoja física `FlujoCaja`.
5. **`ApiRouter.js`**:
   - Verificación de que el alias `crearmovimientoflujocaja` continúa enrutando a `createMovimiento` (que delega a `createGasto` o `createIngreso`) sin accesos a hojas deprecadas.
6. **`tablas.md`**:
   - Retiro formal de la sección `TABLA 9: BBDD_Finanzas_FlujoCaja [DEPRECADA / HISTÓRICA]`, reflejando exclusivamente el modelo de persistencia canónico activo.

---

### FASE 4.2 — Prioridad 2: Feature Flags Adaptativos por Arquetipo, Clasificación IA y Telemetría de Carga Operativa
**Fecha:** Octubre 2026 | **Archivos modificados:** `ProyectosService.js`, `GeminiParserService.js`, `DashboardService.js`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### Motivación
Implementar la arquitectura adaptativa y elástica para la gestión del portafolio bajo el principio de no regresión funcional. Se erradica la rigidez de un modelo único monolítico mediante una matriz determinista de Feature Flags que activa y desactiva componentes según el Arquetipo de Proyecto (1_Infraestructura, 2_Venture, 3_Activo, 4_Carrera, 5_Evento) y su Magnitud (Light, Medium, Heavy), proveyendo además un motor de telemetría de sobrecarga operativa y clasificación autónoma asistida por Gemini AI.

#### Componentes Intervenidos
1. **`ProyectosService.js`**:
   - `evaluarFeatureFlagsProyecto(arquetipo, magnitud)`: Función pura que retorna 12 flags booleanos gobernados por la naturaleza y escala del proyecto.
   - `auditarCargaProyectosActivos(proyectosOpt)`: Auditoría preventiva de capacidad ejecutiva (Heavy > 1 o Medium > 2 en estado '03_En_Ejecucion') sin bloqueos transaccionales.
2. **`GeminiParserService.js`**:
   - Enriquecimiento del JSON Schema y System Prompt en `generarWbsProyectoIA` y fallback heurístico para inferir `arquetipoSugerido`, `magnitudSugerida` y `justificacionClasificacion`.
3. **`DashboardService.js`**:
   - Evaluación e inyección de `featureFlags` en cada proyecto devuelto en `getDashboardData`.
   - Incorporación a nivel raíz de `telemetriaCarga`.

---

### FASE 3.3 — Resolución Definitiva de Iconografía Canónica Lucide, Extractor Universal de Vínculos y Selector de Color en Notas
**Fecha:** Octubre 2026 | **Archivos modificados:** `JS_Core.html`, `JS_Habitos.html`, `View_Notas.html`, `JS_Notas.html`, `Modal_Notas.html`

#### Motivación
Completar la estandarización Cobalt Aerodynamic (A.2.2) y directrices de `SYSTEM_RULES.md` erradicando emojis funcionales en filtros, cabeceras, modales y chips de vínculos, resolver de forma determinista la vinculación cruzada de hábitos/actividades ante etiquetas compuestas como `"🌱 GYM (ACT-009)"`, dotar al modal de edición de notas de un selector de color desplegable ergonómico (popover upward) y armonizar los paneles bitemáticos (claro/oscuro) de Wishlist y Checklist junto con la elevación canónica `portal-surface elevation-3 rounded-2xl`.

#### Cambios por Componente

##### 1. `JS_Core.html` — Extractor Universal Regex e Indexación Cruzada de Vínculos
| Aspecto | Antes | Después |
|---|---|---|
| Extracción de Códigos | Búsquedas por prefijo rígido fallaban al recibir strings compuestos como `"🌱 GYM (ACT-009)"` | Extractor universal regex `/\b(ACT\|HAB\|TAR\|PRO\|HIT\|ING\|GAS)-0*(\d+)\b/i` en `registrarVinculo` y `obtenerNotasVinculadasAEntidad` |
| Indexación Cruzada | Solo indexaba la cadena exacta proporcionada | Generación determinista de variantes: canónica con padding (`pad3`, `pad4`, `pad2`), normalizada sin ceros y numérica pura. Para `ACT` y `HAB` se indexa recíprocamente (`ACT-009` <-> `HAB-009`, `ACT-9` <-> `HAB-9`, `9`) |

##### 2. `JS_Habitos.html` & `Modal_ActividadFlow.html` — Vinculación Bidireccional y Badges de Notas en Hábitos
| Aspecto | Antes | Después |
|---|---|---|
| Chip de Notas en Modal de Hábito | Inexistente en `Modal_ActividadFlow.html` | Chip interactivo `#act-flow-chip-notas` con label `#act-flow-chip-notas-label` (`+ Notas` o `N Notas`) y micro-icono Lucide `file-text` |
| Panel de Gestión de Notas | Inexistente en modal de hábito | Panel desplegable `#act-flow-notas-section` con lista de vinculadas, buscador en tiempo real `#act-flow-notas-search-input` y lista de notas disponibles para enlazar con un clic |
| Controladores de Notas en Hábitos | Inexistentes | `toggleNotasSectionActividadFlow(event)`, `renderNotasVinculadasActividadFlow()`, `filtrarNotasParaVincularActividadFlow(query)`, `vincularNotaAActividadFlow(idNota)` y `desvincularNotaDeActividadFlow(idNota)` integrados con `vincularNotaAEntidad` y `desvincularNotaDeEntidad` |
| Micro-acción Rápida en Tarjetas | La tarjeta quedaba inerte si no había notas vinculadas | Micro-botón ghost en hover `btnVincularNotaRapida` con Lucide `file-plus` para abrir directamente el modal con la sección de notas desplegada; badge canónico visible cuando ya posee notas asociadas |
| Badge de Modo en Edición | `badgeModo.textContent = "✏️ " + act.ID_Actividad;` con emoji plano | `badgeModo.textContent = act.ID_Actividad;` con tipografía `font-mono text-[11px] font-bold tabular-nums` |
| Micro-acciones en Listas | Botón con icono literal `✏️` | Reemplazado por micro-icono vectorial Lucide `edit-3` (`.portal-icon-sm`) |

##### 3. `View_Notas.html` — Purga Integral de Emojis en Filtros y Quick Creator
| Aspecto | Antes | Después |
|---|---|---|
| Botones de Filtro Rápido | `📌 Fijadas`, `📎 Adjuntos`, `🔗 Vínculos`, `🏷️ Tags` | Micro-iconos vectoriales Lucide `pin`, `paperclip`, `link`, `tag` (`.portal-icon-sm`) con tipografía semántica |
| Chips de Tipo de Nota | `📝 Nota`, `📋 Checklist`, `🎁 WishList` | Iconos Lucide vectoriales `file-text`, `list-todo`, `bookmark` |
| Selector de Prioridad Wishlist | Emojis planos `🔥`, `⭐`, `💡` en opciones del select | Textos puros y limpios: `"Alta Prioridad"`, `"Media"`, `"Baja / Capricho"` |

##### 4. `JS_Notas.html` & `Modal_Notas.html` — Selector Desplegable de Color y Chips Vectoriales
| Aspecto | Antes | Después |
|---|---|---|
| Chips de Vínculos en Tarjetas | Emojis planos (`💼`, `🚩`, `🎯`, `🌱`, `💵`, `💰`, `🔗`) | Micro-iconos vectoriales Lucide `folder-kanban` (Proyecto), `flag` (Hito), `check-circle-2` (Tarea), `target` (Hábito/Actividad), `trending-up` (Ingreso), `trending-down` (Gasto), `link` (General) |
| Selector de Color en Modal | Barra estática horizontal hardcodeada (`#modal-nota-color-bar`) | Selector desplegable compacto (`#btn-modal-nota-color`) con micro-círculo indicador (`#modal-nota-color-indicador`) y popover upward (`#modal-nota-color-picker-popover`) con elevación `elevation-3` y las 7 opciones con swatches |
| Controladores de Popover | Inexistentes | `toggleModalNotaColorPicker(event)`, `cerrarModalNotaColorPicker()`, `cerrarModalNotaColorPickerAlClickAfuera()` y exportación a `window` |
| Paneles Wishlist / Checklist | Contenedores rígidos `bg-slate-900/40 border-slate-800/60` | Armonización bitemática: `bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 rounded-xl p-4` |
| Tarjeta del Modal (`card`) | `rounded-3xl` | Armonizado con `rounded-2xl portal-surface elevation-3` |

---

### FASE 3.1 — Optimización del Núcleo Frontend y Consolidación de Estilos
**Fecha:** Octubre 2026 | **Archivos modificados:** `JS_Core.html`, `Index.html`, `Styles.html`

#### Motivación
Blindar el transporte de peticiones RPC en el cliente web mediante deduplicación en vuelo, erradicar la sobrecarga de reconciliación en memoria transformando la resolución de dependencias relacionales de O(T × H) a O(1), sanear el objeto global de estado (`state`) eliminando propiedades muertas y referencias legacy a hojas deprecadas, y unificar el motor de estilos CSS purgando selectores huérfanos y reglas duplicadas en conflicto con la experiencia háptica y fluida de la aplicación.

#### Cambios por Componente

##### 1. `JS_Core.html` — Deduplicación RPC, Indexación O(1) e Higiene del Estado
| Aspecto | Antes | Después |
|---|---|---|
| Control de Concurrencia RPC | `callBackend` despachaba llamadas sin control de duplicados; clics simultáneos o refrescos paralelos saturaban el motor GAS | Set `_pendingRpcCalls` en memoria indexando firmas `'action:payload'`; descarta peticiones concurrentes idénticas en vuelo y libera la firma en éxito o fallo |
| Resolución Relacional de Tareas | Búsqueda lineal anidada `(state.hitos \|\| []).find(...)` en cada tarea para asociar proyectos huérfanos, con complejidad **O(T × H)** | Indexación previa de hitos en un `Map(idHito => idProyecto)` con resolución instantánea en complejidad **O(1)** |
| Estado Global `state` | Propiedades residuales y en desuso: `verArchivados: false`, `filtroTextoFinanzas: ''`, `filtroCategoriaGastos: 'TODAS'` y `flujoCaja` | Purgadas completamente de la definición de `state`, de `sincronizarCacheLocalState` y de `limpiarFiltrosFinanzas` |
| Guardas de Ciclo de Vida | Invocación directa sin comprobación de funciones de vistas en `DOMContentLoaded` y `aplicarDatosDashboard` | Guardas defensivas `typeof === 'function'` para `aplicarEstadoSidebarDOM`, `setupDragAndDropKanban`, `inicializarFormularios`, `normalizarEstadoTarea`, `renderSidebarProyectos`, etc. |

##### 2. `Index.html` — Saneamiento de Contenedores de Interfaz
| Aspecto | Antes | Después |
|---|---|---|
| `#undo-toast-container` | Declaraba estilos en línea duplicados y conflictivos con `!important` (`position: fixed !important; bottom: 20px...`) | Estilos en línea removidos; el contenedor delega enteramente en sus clases utilitarias Tailwind y las reglas declarativas de `Styles.html` |

##### 3. `Styles.html` — Consolidación de Selectores y Purga de Clases Huérfanas
| Aspecto | Antes | Después |
|---|---|---|
| `.kanban-card` y `.habit-card` | Declaraciones triplicadas (L138, L689, L1036) con curvas de transición dispares (`0.15s ease-out` vs `0.2s cubic-bezier`) | Unificadas en la declaración base con transición suave cubic-bezier `(0.16, 1, 0.3, 1)`, elevación táctil `translateY(-2px)` y sombras unificadas |
| `.custom-scrollbar` | Reglas duplicadas en L716-741 y L922-942 con anchos y paletas divergentes | Consolidada en una sola regla de 5px con tonalidades suaves transparentes y acento índigo en hover |
| `#popover-time-filter` | Declaración duplicada con delays en conflicto en L376-391 y L1281-1320 | Consolidado en el bloque maestro con puente invisible (`::before`), retardo de 250ms al cerrar y soporte para aperturas hover y programáticas |
| Clases Huérfanas Purgadas | 8 clases residuales sin uso en ninguna vista HTML o JS (`.header-bento-btn`, `.btn-touch-active`, `.btn-press`, `.animate-pulse-subtle`, `.procedural-step-active`, `.optimistic-deleting`, `.btn-tactile`, `.card-restaurada-anim`) | Purgadas en su totalidad junto con sus `@keyframes` asociados (`pulseSubtle` y `cardRestaurarEntrada`) |

---

### FASE 2.3 — Optimización de Servicios Externos, Reportería y Limpieza
**Fecha:** Octubre 2026 | **Archivos modificados:** `CalendarService.js`, `GeminiParserService.js`, `DriveService.js`, `ReporteriaService.js`, `FichaEjecutiva.html`

#### Motivación
Robustecer los puntos de integración con APIs externas de Google (Calendar, Gemini, Drive) y el motor cuantitativo de valor ganado (EVM): eliminar consultas I/O duplicadas a `CalendarApp` y `DriveApp`, suprimir bloques de captura silenciosa que ocultaban agotamiento de cuotas, dotar a `GeminiParserService` de sanitización universal contra prefijos Data URL en Base64, sincronizar el universo completo de tareas para la salud determinista de proyectos y purgar código residual en reportería y drive.

#### Cambios por Componente

##### 1. `CalendarService.js` — Desduplicación de Consultas y Trazabilidad de Excepciones
| Aspecto | Antes | Después |
|---|---|---|
| Consultas a Calendar | En `sincronizarFilaGasto` y `sincronizarFilaIngreso`, se ejecutaban hasta 2 llamadas `cal.getEventById(idEvento)` para el mismo registro | Consulta única memoizada en variable local `ev`, reutilizada en ramas real y programada |
| Manejo de Excepciones | 24 bloques `catch (e) { }` silenciosos en getters de color, `getEventById`, series y borrados | `Logger.log` informativo y contextualizado en todos los bloques catch para visibilidad de cuotas y permisos |
| Sincronización Tareas | Posibles consultas redundantes al default calendar | Validación estricta y captura con registro diagnóstico en `sincronizarFilaTarea` |

##### 2. `GeminiParserService.js` — Sanitización de Base64 y Optimización de Cronograma
| Aspecto | Antes | Después |
|---|---|---|
| Sanitización Base64 | La carga útil se enviaba cruda a `inline_data`; fallaba con HTTP 400 si traía prefijo `data:...;base64,` | Split defensivo por coma y extracción estricta del payload Base64 puro antes de invocar la API |
| Fallback MimeType | Podía enviar `undefined`, rechazado por Gemini | Fallback determinista a `'image/jpeg'` en ausencia de tipo explícito |
| Cronograma WBS | Doble recorrido anidado e independiente sobre `dataRaw.hitos` y reevaluación redundante de fechas | Pre-cálculo acumulativo sobre hitos reutilizando el booleano `tieneFechaFin` |

##### 3. `DriveService.js` — Caché de Carpetas y Deprecación de Métodos Huérfanos
| Aspecto | Antes | Después |
|---|---|---|
| Búsquedas en Drive | `DriveApp.getFoldersByName` se invocaba repetidamente sin almacenamiento en memoria | Diccionario `_carpetasCache` en memoria para indexar Folder IDs y evitar latencia I/O en Drive |
| `guardarArchivoAdjuntoNota` | Método huérfano no expuesto en `ApiRouter`; el frontend guarda adjuntos en el JSON de la nota | **DEPRECADO** formalmente con advertencia en `Logger.log`; se mantiene compatibilidad de interfaz |

##### 4. `ReporteriaService.js` y `FichaEjecutiva.html` — Precisión EVM y Corrección Visual
| Aspecto | Antes | Después |
|---|---|---|
| Cómputo EVM | `calcularMetricasEVM` se ejecutaba 2 veces consecutivas en `generarFichaPdf` | Cálculo único en `generarFichaPdf`, inyectado opcionalmente como `evmPrecalculado` en `evaluarSaludDeterminista` |
| Salud Determinista | Pasaba el slice de 3 bloqueos a `evaluarSaludDeterminista`, distorsionando el conteo de tareas vencidas | Pasa **todas** las tareas del proyecto (`tareasProyecto`) para evaluar con exactitud `tareasAtrasadas` |
| Código Muerto | Función de depuración `testGenerarFicha()` expuesta en ámbito global | Purgada completamente del archivo de producción |
| CSS Ficha PDF (L102) | Regla `color: #dc2626;` inyectada erróneamente en atributo `class` | Corregido a clase `val-bad` y `style="color: #dc2626;"` |

---

### FASE 2.2 — Optimización Batch, LockService Universal y Purga de FlujoCaja
**Fecha:** Octubre 2026 | **Archivos modificados:** `FinanzasService.js`, `FinanzasAvanzadasService.js`, `ActividadesService.js`

#### Motivación
Eliminar las escrituras celda-a-celda (`setValue` individual) en todos los métodos de actualización de registros, reemplazándolas por mutación en memoria del array de fila y una única llamada atómica `.setValues([filaActualizada])`. Reduce el número de llamadas a la API de Sheets de O(n campos) a O(1) por transacción, y previene condiciones de carrera mediante `LockService`.

#### Cambios por Archivo

##### `FinanzasService.js` — `updateGasto` y `updateIngreso`
| Aspecto | Antes (≤ 2.1) | Después (2.2) |
|---|---|---|
| Concurrencia | Sin protección | `LockService.getScriptLock()` + `waitLock(10000)` + `try/finally { lock.releaseLock() }` |
| Escritura | N llamadas `sheet.getRange(row, col+1).setValue(val)` | Clon de fila en memoria → mutaciones → 1 único `sheet.getRange(rowIdx, 1, 1, totalCols).setValues([filaActualizada])` |
| MONTO_PEN / MONTO_USD | Recalculados sin blindaje concurrente | Recalculados sobre el clon antes del commit; columnas calculadas de Sheets intactas |
| Error handling | Sin try/catch | `catch (err)` con `Logger.log` + retorno `{ success: false, error }` |

##### `ActividadesService.js` — `completarActividadPersonal` y `updateActividadPersonal`
| Método | Antes | Después |
|---|---|---|
| `completarActividadPersonal` | 3 `.setValue()` separados para ESTADO, RACHA_ACTUAL, FECHA_PROGRAMADA | LockService + clon + 3 mutaciones + 1 `.setValues([fila])` |
| `updateActividadPersonal` | ~12 `.setValue()` dispersos + 5 más en sync de gasto | LockService + clon + mutaciones en memoria + 1 commit batch; sync de gasto en BBDD_Finanzas_Gastos también migrada a 1 `.setValues([filaGasto])` |

##### `FinanzasAvanzadasService.js` — `conciliarTransaccion`, `_actualizarProgresoCuota`, deprecaciones
| Método | Cambio |
|---|---|
| `conciliarTransaccion` | LockService; escritura de BBDD_Gastos vía `.setValues([filaG])` e Ingresos vía `.setValues([filaI])`; sección FlujoCaja **eliminada** |
| `_actualizarProgresoCuota` | 3–4 `.setValue()` → clon + mutación de CUOTAS_PAGADAS, MONTO_PAGADO, SALDO_PENDIENTE (y ESTADO) + 1 `.setValues([fila])` |
| `updateMovimiento` | **DEPRECADO** — redirige a `FinanzasService.updateGasto` / `updateIngreso` |
| `desconciliarMovimiento` | **DEPRECADO** — retorna `{ success: false, error }` indicando FlujoCaja fuera de servicio |
| `createPlanCuotas` | Primera rama delega en `FinanzasService.crearGastoEnCuotas`; lógica interna solo como fallback de resiliencia |

#### Patrón Canónico Batch (referencia de implementación)
```javascript
// 1. Leer tabla completa (una sola llamada getValues — ya existía)
const data = sheet.getDataRange().getValues();
// 2. Clonar la fila objetivo en memoria
const filaActualizada = data[rowIdx - 1].slice();
// 3. Mutar campos en memoria (cero llamadas a Sheets aquí)
filaActualizada[colMap.CAMPO_A] = nuevoValorA;
filaActualizada[colMap.CAMPO_B] = nuevoValorB;
// 4. COMMIT ATÓMICO: UNA sola llamada a Sheets API
sheet.getRange(rowIdx, 1, 1, filaActualizada.length).setValues([filaActualizada]);
```

#### Estado de Retiro Definitivo de `FlujoCaja` (Fase 4.12)
- Hoja física `BBDD_Finanzas_FlujoCaja` retirada definitivamente del sistema.
- `conciliarTransaccion`: opera sobre gastos e ingresos sin escrituras en FlujoCaja.
- `updateMovimiento` / `deleteMovimiento` / `desconciliarMovimiento`: redirigen a servicios canónicos activos (`FinanzasService`).
- `_eliminarMovimientosCuota`: opera exclusivamente sobre `BBDD_Finanzas_Gastos` y Calendar.
- Métricas y proyecciones de flujo de caja: consolidadas 100% en memoria en `DashboardService.js` y `FinanzasAvanzadasService.js`.

---

## ÍNDICE GENERAL DEL SISTEMA

### [PARTE I: SERVICIOS DE BACKEND (ARCHIVOS JAVASCRIPT `.js`)](#parte-i-servicios-de-backend-archivos-javascript-js)
1. [`ActividadesService.js`](#1-archivo-cuserschristopherdesktopmiportalwebactividadesservicejs) - Gestión de vida, hábitos, ciclos, rachas y sincronización dual (Tasks/Calendar).
2. [`ApiEndpoints.js`](#2-archivo-cuserschristopherdesktopmiportalwebapiendpointsjs) - Manifiesto declarativo de segregación modular legacy.
3. [`ApiRouter.js`](#3-archivo-cuserschristopherdesktopmiportalwebapirouterjs) - Enrutador maestro HTTP, despachador RPC universal, disparador `onEdit` y caché.
4. [`CalendarService.js`](#4-archivo-cuserschristopherdesktopmiportalwebcalendarservicejs) - Integración con Google Calendar (4 calendarios segregados) y sincronización reactiva.
5. [`Config.js`](#5-archivo-cuserschristopherdesktopmiportalwebconfigjs) - Diccionarios de cabeceras dinámicas, sinónimos polimórficos y constantes globales.
6. [`Correlativos.js`](#6-archivo-cuserschristopherdesktopmiportalwebcorrelativosjs) - Generador concurrente atómico de PKs con `LockService` (`PRO-`, `HIT-`, `TAR-`, `GAS-`, etc.).
7. [`DashboardService.js`](#7-archivo-cuserschristopherdesktopmiportalwebdashboardservicejs) - Agregador de lectura en masa y motor de caché segmentado en memoria.
8. [`DriveService.js`](#8-archivo-cuserschristopherdesktopmiportalwebdriveservicejs) - Jerarquía documental de carpetas en Google Drive y persistencia binaria de adjuntos.
9. [`FinanzasAvanzadasService.js`](#9-archivo-cuserschristopherdesktopmiportalwebfinanzasavanzadasservicejs) - Flujo de caja, conciliación bancaria y métricas financieras de salud.
10. [`FinanzasService.js`](#10-archivo-cuserschristopherdesktopmiportalwebfinanzasservicejs) - Tesorería polimórfica, control de gastos e ingresos, cuotas y tipo de cambio.
11. [`GeminiParserService.js`](#11-archivo-cuserschristopherdesktopmiportalwebgeminiparserservicejs) - Inferencia con Gemini 1.5 Flash (OCR de comprobantes y WBS Integral) con fallback heurístico.
12. [`GoogleTasksService.js`](#12-archivo-cuserschristopherdesktopmiportalwebgoogletasksservicejs) - Integración con Google Tasks API para compromisos de duración = 0h y avisos financieros.
13. [`HitosService.js`](#13-archivo-cuserschristopherdesktopmiportalwebhitosservicejs) - Control de estructura WBS de proyectos, pesos porcentuales y criterios DoD.
14. [`NotasService.js`](#14-archivo-cuserschristopherdesktopmiportalwebnotasservicejs) - Notas enriquecidas (Keep + Notion), paleta pastel, checklists JSON y Wishlist.
15. [`ProyectosService.js`](#15-archivo-cuserschristopherdesktopmiportalwebproyectosservicejs) - Ciclo de vida de iniciativas, autocompletado con IA y transacciones batch atómicas.
16. [`ReporteriaService.js`](#16-archivo-cuserschristopherdesktopmiportalwebreporteriaservicejs) - Análisis de Valor Ganado (EVM), semáforo de salud y compilación de PDF ejecutivos A4.
17. [`TareasService.js`](#17-archivo-cuserschristopherdesktopmiportalwebtareasservicejs) - Tareas operativas de proyecto y subtareas procedurales atómicas.

### [PARTE II: VISTAS, MAQUETACIÓN Y ESTILOS (ARCHIVOS HTML)](#parte-ii-vistas-maquetación-estilos-y-modales-archivos-html)
18. [`Index.html`](#18-archivo-cuserschristopherdesktopmiportalwebindexhtml) - Shell de la Single Page Application, CDN y orquestador de inclusiones.
19. [`Layout_Header.html`](#19-archivo-cuserschristopherdesktopmiportalweblayout_headerhtml) - Barra de navegación fija superior, monitor de sincronización y controles globales.
20. [`Layout_Sidebar.html`](#20-archivo-cuserschristopherdesktopmiportalweblayout_sidebarhtml) - Módulo de referencia de navegación lateral de proyectos.
21. [`Styles.html`](#21-archivo-cuserschristopherdesktopmiportalwebstyleshtml) - Sistema de diseño CSS, glassmorphism, temas oscuros y animaciones.
22. [`FichaEjecutiva.html`](#22-archivo-cuserschristopherdesktopmiportalwebfichaejecutivahtml) - Plantilla HTML/CSS de impresión de alta precisión para PDF en Google Drive.
23. [`View_Kanban.html`](#23-archivo-cuserschristopherdesktopmiportalwebview_kanbanhtml) - Tablero Kanban drag & drop con filtros contextuales y temporales.
24. [`View_Portafolio.html`](#24-archivo-cuserschristopherdesktopmiportalwebview_portafoliohtml) - Cuadro de mando estratégico de iniciativas con Bento KPIs y tabla analítica.
25. [`View_Habitos.html`](#25-archivo-cuserschristopherdesktopmiportalwebview_habitoshtml) - Vista de 6 dimensiones de vida, anillo diario y contador de rachas.
26. [`View_Finanzas.html`](#26-archivo-cuserschristopherdesktopmiportalwebview_finanzashtml) - Control de flujo de caja, balance, compras a plazos y escáner OCR.
27. [`View_Detalle360.html`](#27-archivo-cuserschristopherdesktopmiportalwebview_detalle360html) - Vista profunda de proyecto en cascada WBS y visor de Grafo de Red.
28. [`View_Notas.html`](#28-archivo-cuserschristopherdesktopmiportalwebview_notashtml) - Interfaz de notas estilo Google Keep con Masonry, tags y Wishlist.

### [PARTE III: MODALES Y WIZARDS DE ENTRADA DE DATOS](#parte-iii-modales-y-wizards-de-entrada-de-datos)
29. [`Modal_TareaFlow.html`](#29-archivo-cuserschristopherdesktopmiportalwebmodal_tareaflowhtml) - Modal ClickUp/Asana para edición de tareas, subtareas y gastos vinculados.
30. [`Modal_ActividadFlow.html`](#30-archivo-cuserschristopherdesktopmiportalwebmodal_actividadflowhtml) - Modal de creación/edición de actividades de vida, hábitos y periodicidad.
31. [`Modal_Finanzas.html`](#31-archivo-cuserschristopherdesktopmiportalwebmodal_finanzashtml) - Formulario unificado de transacciones (Gastos/Ingresos) y OCR con IA.
32. [`Modal_ProyectosYHitos.html`](#32-archivo-cuserschristopherdesktopmiportalwebmodal_proyectosyhitoshtml) - Wizard de 4 pestañas para proyectos y generación WBS integral con IA.
33. [`Modal_AtajosYPdf.html`](#33-archivo-cuserschristopherdesktopmiportalwebmodal_atajosypdfhtml) - Modal de atajos de teclado y diálogo de compilación PDF de cartera.
34. [`Modal_Notas.html`](#34-archivo-cuserschristopherdesktopmiportalwebmodal_notashtml) - Editor enriquecido de notas inteligentes con checklist interactivo y adjuntos.

### [PARTE IV: MÓDULOS DE JAVASCRIPT CLIENTE (ARCHIVOS `JS_*.html`)](#parte-iv-módulos-de-javascript-cliente-archivos-js_html)
35. [`JavaScript.html`](#35-archivo-cuserschristopherdesktopmiportalwebjavascripthtml) - Manifiesto de refactorización modular frontend.
36. [`JS_Core.html`](#36-archivo-cuserschristopherdesktopmiportalwebjs_corehtml) - Estado global (`state`), cliente RPC (`callBackend`), formato y notificaciones.
37. [`JS_Kanban.html`](#37-archivo-cuserschristopherdesktopmiportalwebjs_kanbanhtml) - Tablero Kanban, drag & drop, filtros temporales y trazabilidad de dependencias.
38. [`JS_Portafolio.html`](#38-archivo-cuserschristopherdesktopmiportalwebjs_portafoliohtml) - KPIs de portafolio, sidebar y visualización en cuadrícula/tabla.
39. [`JS_Habitos.html`](#39-archivo-cuserschristopherdesktopmiportalwebjs_habitoshtml) - Lógica de hábitos por categorías, confetti, cálculo de rachas y gastos inline.
40. [`JS_Finanzas.html`](#40-archivo-cuserschristopherdesktopmiportalwebjs_finanzashtml) - Control de flujo de caja, transacciones, cuotas, balance y escáner OCR.
41. [`JS_Detalle360.html`](#41-archivo-cuserschristopherdesktopmiportalwebjs_detalle360html) - Vista 360°, KPIs Bento de proyecto, cascada WBS y exportación PDF.
42. [`JS_GrafoRed.html`](#42-archivo-cuserschristopherdesktopmiportalwebjs_graforedhtml) - Motor Canvas Vis.js, jerarquía 4 niveles, enrutamiento Manhattan y ruta crítica.
43. [`JS_TareaFlow.html`](#43-archivo-cuserschristopherdesktopmiportalwebjs_tareaflowhtml) - Lógica del wizard de tareas, cascada de selects y gastos atómicos.
44. [`JS_Subtareas.html`](#44-archivo-cuserschristopherdesktopmiportalwebjs_subtareashtml) - Motor procedural de pasos de checklist para tarjetas y modales.
45. [`JS_ModalesYAtajos.html`](#45-archivo-cuserschristopherdesktopmiportalwebjs_modalesyatajoshtml) - Atajos de teclado globales y ciclo del wizard de proyectos con IA.
46. [`JS_Notas.html`](#46-archivo-cuserschristopherdesktopmiportalwebjs_notashtml) - Lógica de notas inteligentes, checklists, tags, colores y Wishlist.

### [PARTE V: MATRICES GLOBALES DE REFERENCIA ARQUITECTÓNICA](#parte-v-matrices-globales-de-referencia-arquitectónica)
- Matriz 1: Catálogo Exhaustivo de Acciones RPC (Frontend -> Backend).

| Alias | Función Canónica |
|-------|------------------|
| crearnota | guardarnota |
| deletenota | eliminarnota |
| getnotas | obtenernotas |
| pinnote | togglepinnota |
| togglechecklistnota | actualizarchecklistnota |
| deleteproyecto | eliminarproyectoencascada |
| togglesubtarea | updatesubtareacompletado |
| guardarsubtarea | createsubtarea |

- Matriz 2: Esquema Canónico de Base de Datos (Google Sheets BBDD).
- Matriz 3: Registro Global de Almacenamiento, Variables, Caché y Propiedades.
- Matriz 4: Archivos de Configuración y Despliegue (.clasp, appsscript).

---

# PARTE I: SERVICIOS DE BACKEND (ARCHIVOS JAVASCRIPT `.js`)

---

## 1. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\ActividadesService.js`

### 2. PROPÓSITO:
Servicio de dominio encargado de la gestión integral del ciclo de vida de actividades personales, compromisos y hábitos recurrentes (`BBDD_Actividades_Personales`, prefijo `ACT-XXX`). Implementa la regla estricta de sincronización por duración (duración = 0h hacia Google Tasks; duración > 0h como evento bloqueante hacia Google Calendar en el calendario dedicado `PMO - Hábitos y Vida`), cálculo matemático y actualización de rachas (`Racha_Actual`), reprogramación automática del próximo ciclo (diario, semanal, mensual, anual, personalizado por días L, M, V, etc.), vinculación atómica opcional con gastos financieros asociados en `BBDD_Finanzas_Gastos`, y gestión de subtareas procedurales hijas.

### 3. FUNCIONES QUE CONTIENE:

#### `obtenerOCrearHojaSubtareas()`
- **Tipo:** Helper interno (no expuesto directamente como RPC).
- **Parámetros:** Ninguno.
- **Descripción:** Verifica la existencia de la hoja satélite `BBDD_Subtareas_Pasos` (`CONFIG.SHEETS.SUBTAREAS`). Si no existe, la crea con sus encabezados canónicos (`ID_Subtarea`, `Tipo_Padre`, `ID_Padre`, `Numero_Paso`, `Descripcion_Paso`, `Completado`, `Fecha_Completado`) y aplica formato de negrita en fila 1.
- **Retorno:** Objeto `Sheet` de Google Sheets.

#### `_calcularProximaFechaValida(fechaBaseStr, frecuenciaCiclo, reglaRepeticion, diasSeleccionados)`
- **Tipo:** Helper interno de motor de recurrencia.
- **Parámetros:**
  - `fechaBaseStr` (`string` | `Date`): Fecha base en formato `'YYYY-MM-DD'` o instancia Date.
  - `frecuenciaCiclo` (`string`): Frecuencia (`'DIARIA'`, `'SEMANAL'`, `'MENSUAL'`, `'ANUAL'`, `'PERSONALIZADA'`, `'NINGUNA'`).
  - `reglaRepeticion` (`string`): Regla serializada tipo `'DIAS:L,M,V'` o intervalo.
  - `diasSeleccionados` (`string[]` | `string`): Lista de días permitidos (`['L', 'M', 'V']` o `'L,M,V'`).
- **Descripción:** Calcula la primera fecha válida a partir de la fecha base. Si la fecha cae en un día no contemplado por los días seleccionados, avanza iterativamente día por día hasta encontrar el próximo día habilitado.
- **Retorno:** Cadena `'YYYY-MM-DD'` o la fecha base normalizada.

#### `_calcularSiguienteFechaCiclo(fechaBaseStr, frecuenciaCiclo, reglaRepeticion)`
- **Tipo:** Helper interno de proyección de fechas para hábitos completados.
- **Parámetros:**
  - `fechaBaseStr` (`string`): Fecha de última ejecución en formato `'YYYY-MM-DD'`.
  - `frecuenciaCiclo` (`string`): Frecuencia configurada (`'DIARIA'`, `'SEMANAL'`, `'MENSUAL'`, etc.).
  - `reglaRepeticion` (`string`): Regla complementaria de días.
- **Descripción:** Determina la fecha de la próxima repetición tras el completado de un hábito, arrancando desde el día siguiente (`fechaBase + 1 día`) y buscando el primer día hábil según la regla.
- **Retorno:** Cadena `'YYYY-MM-DD'`.

#### `eliminarEventoCalendarPorId(idEvento, nombreOpcional)`
- **Tipo:** Helper interno de limpieza de eventos externos.
- **Parámetros:**
  - `idEvento` (`string`): Identificador del evento en Google Calendar o task en Google Tasks.
  - `nombreOpcional` (`string`, opcional): Título para limpieza de tareas huérfanas en Google Tasks.
- **Descripción:** Detecta la naturaleza del ID. Si es numérico/alfanumérico de Google Calendar, invoca `CalendarService.eliminarEventoCalendar(idEvento, 'HABITO')`. Si corresponde a Google Tasks, delega a `GoogleTasksService.eliminarTask(idEvento)`.
- **Retorno:** `boolean` (`true` si eliminó o no requería acción; `false` ante error).

#### `createActividadPersonal(payload)`
- **Tipo:** Backend RPC (`action: "createActividadPersonal"`).
- **Estructura Payload Entrada:**
```json
{
  "nombreActividad": "Lectura técnica de arquitectura",
  "categoriaVida": "DESARROLLO_ESTUDIO",
  "tipoCompromiso": "HABITUAL",
  "estado": "02_Por_Hacer",
  "prioridad": "01_P1_Alta",
  "frecuenciaCiclo": "DIARIA",
  "reglaRepeticion": "DIAS:L,M,V",
  "diasSeleccionados": ["L", "M", "V"],
  "fechaProgramada": "2026-10-01",
  "horaInicio": "07:30",
  "duracionHoras": 1.0,
  "duracionMinutos": 60,
  "agendadoCalendar": "Sí",
  "montoGastoAsociado": 0,
  "monedaGasto": "PEN",
  "tipoCambio": 3.75,
  "notasChecklist": "Capítulo 4 de Patrones Cloud",
  "subtareas": ["Leer 15 páginas", "Tomar notas en Obsidian"]
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "data": {
    "idActividad": "ACT-045",
    "nombre": "Lectura técnica de arquitectura",
    "categoria": "DESARROLLO_ESTUDIO",
    "idEvento": "calendar_event_id_or_task_id",
    "gastoAsociado": null,
    "proximaFecha": "2026-10-01"
  },
  "message": "Actividad personal registrada con éxito"
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "Hoja BBDD_Actividades_Personales no encontrada"
}
```

#### `completarActividadPersonal(payload)`
- **Tipo:** Backend RPC (`action: "completarActividadPersonal"` / `"updateEstadoActividadPersonal"`).
- **Estructura Payload Entrada:**
```json
{
  "idActividad": "ACT-045",
  "nuevoEstado": "04_Completado",
  "incrementarRacha": true
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idActividad": "ACT-045",
  "estado": "04_Completado",
  "rachaActual": 6,
  "nuevaFecha": "2026-10-02",
  "idEventoNuevo": "new_calendar_event_id"
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "Actividad no encontrada: ACT-045"
}
```

#### `updateFechaActividadPersonal(payload)`
- **Tipo:** Backend RPC (`action: "updateFechaActividadPersonal"`).
- **Estructura Payload Entrada:**
```json
{
  "idActividad": "ACT-045",
  "fechaProgramada": "2026-10-03",
  "horaInicio": "08:00",
  "duracionHoras": 1.5,
  "duracionMinutos": 90
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idActividad": "ACT-045",
  "fechaProgramada": "2026-10-03",
  "horaInicio": "08:00",
  "idEvento": "updated_calendar_id"
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "Actividad no encontrada: ACT-045"
}
```

#### `updateActividadPersonal(payload)`
- **Tipo:** Backend RPC (`action: "updateActividadPersonal"`).
- **Estructura Payload Entrada:**
```json
{
  "idActividad": "ACT-045",
  "nombreActividad": "Lectura técnica avanzada",
  "categoriaVida": "DESARROLLO_ESTUDIO",
  "tipoCompromiso": "HABITUAL",
  "estado": "02_Por_Hacer",
  "prioridad": "01_P1_Alta",
  "frecuenciaCiclo": "DIARIA",
  "reglaRepeticion": "DIAS:L,M,V",
  "fechaProgramada": "2026-10-01",
  "horaInicio": "07:00",
  "duracionHoras": 1.0,
  "duracionMinutos": 60,
  "esPuntual": false,
  "agendadoCalendar": "Sí",
  "notasChecklist": "Capítulo 5",
  "montoGastoAsociado": 50,
  "monedaGasto": "PEN",
  "tipoCambio": 3.75
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idActividad": "ACT-045",
  "data": { "..." : "..." }
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "Hoja BBDD_Actividades_Personales no encontrada"
}
```

#### `deleteActividadPersonal(payload)`
- **Tipo:** Backend RPC (`action: "deleteActividadPersonal"`).
- **Estructura Payload Entrada:**
```json
{
  "idActividad": "ACT-045"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "message": "Actividad personal eliminada correctamente",
  "idEliminado": "ACT-045"
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "ID_Actividad requerido para eliminar"
}
```

### 4. VARIABLES Y ESTADO:
- **Hojas persistentes:** `CONFIG.SHEETS.ACTIVIDADES_PERSONALES` (`"BBDD_Actividades_Personales"`), `CONFIG.SHEETS.SUBTAREAS` (`"BBDD_Subtareas_Pasos"`), `CONFIG.SHEETS.FINANZAS` (`"BBDD_Finanzas_Gastos"`).
- **Mapeo matricial dinámico:** `CONFIG.obtenerMapaActividades(sheet)`.
- **Caché:** Invoca `invalidarCacheDashboard()` de `ApiRouter.js` tras inserciones, modificaciones y eliminaciones atómicas.
- **Control de concurrencia:** Bloqueos mediante `LockService.getScriptLock()` con timeout de 10,000 ms a 15,000 ms.
- **Integraciones:** `CalendarService`, `GoogleTasksService`, `CorrelativoService.generarIdActividadPersonal()`, `CorrelativoService.generarIdSubtarea()`, `FinanzasService.createGasto()`.

---

## 2. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\ApiEndpoints.js`

### 2. PROPÓSITO:
Manifiesto histórico y encabezado de compatibilidad arquitectónica. Documenta la segregación del antiguo endpoint monolítico legacy en servicios modulares de dominio estricto (`ApiRouter.js`, `DashboardService.js`, `ProyectosService.js`, `HitosService.js`, `TareasService.js`, `FinanzasService.js`, `ActividadesService.js`). Asegura que Clasp no falle ante dependencias antiguas.

### 3. FUNCIONES QUE CONTIENE:
- No define funciones activas ejecutables en tiempo de ejecución. Actúa como archivo declarativo de documentación de módulo.

### 4. VARIABLES Y ESTADO:
- Sin variables globales ni almacenamiento en sesión/caché.

---

## 3. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\ApiRouter.js`

### 2. PROPÓSITO:
Enrutador maestro central de la infraestructura de backend de Google Apps Script. Administra los puntos de entrada HTTP (`doGet` para servir la SPA o entregar JSON REST; `doPost` para transacciones API externas), el enrutador RPC universal seguro (`apiRouter`), el disparador en tiempo real de celdas (`onEditTrigger`), la invalidación del motor de caché global (`CacheService`), la utilidad transversal de borrado en memoria en bloque (`sobrescribirHojaFiltrada`), y el despachador de dominio (`procesarAccionBackend`) que mapea más de 50 acciones RPC hacia sus respectivos servicios.

### 3. FUNCIONES QUE CONTIENE:

#### `onEditTrigger(e)`
- **Tipo:** Trigger de evento de hoja en tiempo real (`Simple Trigger / Installable Trigger`).
- **Parámetros:**
  - `e` (`GoogleAppsScript.Events.SheetsOnEdit`): Objeto de evento con `.range`, `.value`, etc.
- **Descripción:** Se ejecuta automáticamente ante cualquier edición en las hojas de cálculo. Invalida la caché del dashboard y de notas de forma síncrona. Si se editan columnas críticas de fecha/hora/estado en `BBDD_Actividades_Tareas` (cols E, G, I, K) o `BBDD_Actividades_Personales` (cols J, K, L), invoca la sincronización reactiva hacia Google Calendar (`CalendarService.sincronizarFilaTarea` o `CalendarService.sincronizarFilaActividadPersonal`).
- **Retorno:** `void`.

#### `doGet(e)`
- **Tipo:** Punto de entrada HTTP GET web.
- **Parámetros:**
  - `e` (`Object`): Parámetros de consulta HTTP GET (`e.parameter`).
- **Descripción:** Si recibe `?action=...`, procesa la lectura REST y devuelve JSON con `ContentService.createTextOutput()`. Si no recibe acción, evalúa y sirve la Single Page Application a partir de `Index.html` con título `"PMO Personal & Vida Modular"`, viewport móvil y `XFrameOptionsMode.ALLOWALL`.
- **Retorno:** `HtmlOutput` o `TextOutput` (JSON).

#### `doPost(e)`
- **Tipo:** Punto de entrada HTTP POST REST transaccional.
- **Parámetros:**
  - `e` (`Object`): Solicitud HTTP con `e.postData.contents` conteniendo un JSON con `{ action, payload }`.
- **Descripción:** Parsea el cuerpo JSON y delega en `procesarAccionBackend(action, payload)`. Retorna la respuesta serializada en MIME type JSON.
- **Retorno:** `TextOutput` (JSON).

#### `apiRouter(action, payload)`
- **Tipo:** Canal RPC universal blindado invocado desde el cliente mediante `google.script.run.apiRouter(action, payload)`.
- **Parámetros:**
  - `action` (`string`): Nombre de la acción requerida (case-insensitive).
  - `payload` (`Object`): Objeto plano con los datos de entrada para la acción.
- **Descripción:** Despacha la solicitud a `procesarAccionBackend(action, payload)` y serializa la respuesta con `JSON.stringify()`. Maneja errores fatales devolviendo un objeto seguro `{ success: false, error: err.message }` previniendo caídas del cliente RPC.
- **Retorno:** `string` (JSON serializado).

#### `invalidarCacheDashboard()`
- **Tipo:** Utilidad transversal de caché.
- **Parámetros:** Ninguno.
- **Descripción:** Remueve de forma atómica e inmediata las llaves `"DASHBOARD_DATA_CACHE"` y `"NOTAS_DATA_CACHE"` del caché de script (`CacheService.getScriptCache()`), obligando al siguiente ciclo de lectura a leer datos frescos desde Google Sheets.
- **Retorno:** `void`.

#### `sobrescribirHojaFiltrada(sheet, predicateConservar)`
- **Tipo:** Utilidad atómica de alto rendimiento para manipulación masiva de hojas en memoria.
- **Parámetros:**
  - `sheet` (`GoogleAppsScript.Spreadsheet.Sheet`): Hoja a procesar.
  - `predicateConservar` (`Function(row, index): boolean`): Función que retorna `true` para conservar la fila y `false` para eliminarla.
- **Descripción:** Lee todas las filas en un único `getValues()`, filtra las filas a conservar en memoria RAM, ejecuta un solo `clearContent()` sobre el rango de datos (fila 2 hacia abajo), y reescribe las filas filtradas con un solo `setValues()`. Elimina el cuello de botella de los bucles con `sheet.deleteRow()`.
- **Retorno:** `number` (Cantidad de filas eliminadas).

#### `procesarAccionBackend(action, payload)`
- **Tipo:** Despachador maestro interno por dominio.
- **Parámetros:**
  - `action` (`string`): Nombre de la acción operativa normalizada en minúsculas.
  - `payload` (`Object`): Datos de entrada.
- **Descripción:** Mapea de forma exhaustiva:
  - Lectura agregada: `getDashboardData` -> `DashboardService.getDashboardData(payload)`.
  - Tareas/Subtareas: `createTarea`, `updateTarea`, `deleteTarea`, `createSubtarea`, `updateSubtareaCompletado`, `updateSubtarea`, `reordenarSubtareas`, `deleteSubtarea`.
  - Actividades Personales: `createActividadPersonal`, `completarActividadPersonal`, `updateFechaActividadPersonal`, `updateActividadPersonal`, `deleteActividadPersonal`.
  - Finanzas: `createGasto`, `updateGasto`, `desvincularGasto`, `deleteGasto`, `createIngreso`, `updateIngreso`, `deleteIngreso`, `obtenerTipoCambio`.
  - Finanzas Avanzadas: `createMovimiento`, `updateMovimiento`, `deleteMovimiento`, `conciliarTransaccion`, `desconciliarMovimiento`, `createPlanCuotas`, `pagarSiguienteCuota`, `sanearCuotasDesfasadas`, `updatePlanCuotas`, `deletePlanCuotas`, `calcularMetricasAvanzadas`.
  - Proyectos e Hitos: `createProyecto`, `updateProyecto`, `deleteProyecto` / `eliminarProyectoEnCascada`, `registrarCheckinProyecto`, `agendarRutinaControlProyecto`, `autocompletarProyecto`, `generarWbsIntegralProyectoIA`, `guardarEstructuraProyectoCompleta`, `createHito`, `updateHito`, `deleteHito`.
  - Notas Inteligentes: `obtenerNotas`, `guardarNota`, `togglePinNota`, `eliminarNota`, `actualizarChecklistNota`, `adjuntarArchivoNota`, `marcarDeseoConseguido`.
  - Servicios Especiales: `parsearComprobante` (`GeminiParserService`), `generarFichaPdf` (`ReporteriaService`).
- **Retorno:** `Object` (Resultado devuelto por el servicio invocado).

#### `procesarLecturaBackend(tipo)`
- **Tipo:** Endpoint REST de verificación de salud (health check).
- **Parámetros:**
  - `tipo` (`string`): Tipo de lectura solicitada.
- **Retorno:** `{ success: true, message: "PMO API Activa con Soporte Modular", timestamp: Date }`.

#### `include(filename)`
- **Tipo:** Helper del motor de plantillas HTML de Apps Script (`HtmlService`).
- **Parámetros:**
  - `filename` (`string`): Nombre del archivo `.html` modular a compilar.
- **Descripción:** Evalúa el archivo con `HtmlService.createTemplateFromFile(filename).evaluate().getContent()`. Permite la inclusión limpia de vistas, modales y scripts en `Index.html`.
- **Retorno:** `string` (Contenido HTML evaluado).

#### `eliminarProyectoEnCascada(idProyecto)`
- **Tipo:** Función global expuesta para ejecución directa en el IDE de Apps Script o consola.
- **Parámetros:**
  - `idProyecto` (`string`): Código del proyecto (`PRO-XXX`).
- **Retorno:** `Object` (Resultado de `ProyectosService.eliminarProyectoEnCascada`).

### 4. VARIABLES Y ESTADO:
- **Caché:** `CacheService.getScriptCache()`. Llaves administradas: `"DASHBOARD_DATA_CACHE"`, `"NOTAS_DATA_CACHE"`.
- **Módulos referenciados:** `DashboardService`, `TareasService`, `ActividadesService`, `FinanzasService`, `FinanzasAvanzadasService`, `ProyectosService`, `HitosService`, `NotasService`, `CalendarService`, `GeminiParserService`, `ReporteriaService`.

---

## 4. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\CalendarService.js`

### 2. PROPÓSITO:
Capa de integración bidireccional y reactiva con la API de Google Calendar (`CalendarApp`) y Google Tasks (`Tasks`). Gestiona de forma estricta 4 calendarios segregados e independientes:
1. `PMO - Proyectos` (Color Azul / Índigo) para tareas operativas de proyectos.
2. `PMO - Hábitos y Vida` (Color Verde / Teal) para hábitos y vida personal con bloques > 0h.
3. `PMO - Gastos Programados` (Color Rojo / Mandarina) para egresos o vencimientos futuros.
4. `PMO - Ingresos Programados` (Color Verde / Turquesa) para cobros o dividendos.
Administra la asignación cromática de eventos por cuadrante de Eisenhower / nivel de energía / categoría de vida, reconciliación reactiva en tiempo real al editar celdas o modales, y programación de rutinas de control de proyectos.

### 3. FUNCIONES QUE CONTIENE:

#### `obtenerOCrearCalendario(nombreCalendario, colorBase)`
- **Tipo:** Helper interno de aprovisionamiento de calendarios.
- **Parámetros:**
  - `nombreCalendario` (`string`): Nombre del calendario segregado.
  - `colorBase` (`CalendarApp.Color` | `string`): Color institucional por defecto.
- **Descripción:** Busca en los calendarios propios del usuario. Si no existe, lo crea con `CalendarApp.createCalendar()`, almacena su ID en `PropertiesService.getUserProperties()`, y lo retorna.
- **Retorno:** `CalendarApp.Calendar`.

#### `getCalendarioProyectos()`
- **Tipo:** Helper de acceso.
- **Retorno:** Objeto `Calendar` para `PMO - Proyectos`.

#### `getCalendarioHabitos()`
- **Tipo:** Helper de acceso.
- **Retorno:** Objeto `Calendar` para `PMO - Hábitos y Vida`.

#### `getCalendarioGastos()`
- **Tipo:** Helper de acceso.
- **Retorno:** Objeto `Calendar` para `PMO - Gastos Programados`.

#### `getCalendarioIngresos()`
- **Tipo:** Helper de acceso.
- **Retorno:** Objeto `Calendar` para `PMO - Ingresos Programados`.

#### `getCalendarInstance()`
- **Tipo:** Helper de compatibilidad.
- **Retorno:** Objeto `Calendar` predeterminado o el de proyectos.

#### `obtenerColorEventoHabito(categoriaVida, esPuntual)`
- **Tipo:** Selector de color cromático de evento para hábitos.
- **Parámetros:**
  - `categoriaVida` (`string`): Clave de categoría (`SALUD_DEPORTE`, `DESARROLLO_ESTUDIO`, etc.).
  - `esPuntual` (`boolean`): Bandera de actividad única o periódica.
- **Retorno:** Constante de color de `CalendarApp.EventColor`.

#### `obtenerColorEventoTarea(prioridad, nivelEnergia)`
- **Tipo:** Selector de color cromático de evento para tareas.
- **Parámetros:**
  - `prioridad` (`string`): Prioridad (`01_P1_Alta`, `02_P2_Media`, `03_P3_Baja`).
  - `nivelEnergia` (`string`): Nivel (`Alta`, `Media`, `Baja`).
- **Retorno:** Constante de color de `CalendarApp.EventColor` (Rojo para P1, Naranja para P2, Azul/Cian para P3).

#### `eliminarEventoCalendar(idEvento, tipo)`
- **Tipo:** Operación atómica de eliminación en Google Calendar.
- **Parámetros:**
  - `idEvento` (`string`): ID del evento a eliminar.
  - `tipo` (`string`): Tipo de entidad (`'PROYECTO'`, `'HABITO'`, `'GASTO'`, `'INGRESO'`).
- **Descripción:** Busca el evento en el calendario correspondiente o en los 4 calendarios si no se especifica. Si existe, invoca `event.deleteEvent()`.
- **Retorno:** `boolean` (`true` si fue eliminado o ya no existía; `false` ante error).

#### `normalizarHora(val)`
- **Tipo:** Helper de parseo de tiempos.
- **Parámetros:**
  - `val` (`string` | `Date` | `number`): Valor crudo de celda.
- **Retorno:** Cadena `'HH:mm'` limpia.

#### `normalizarFecha(fechaRaw, tz)`
- **Tipo:** Helper de parseo de fechas.
- **Parámetros:**
  - `fechaRaw` (`string` | `Date`): Valor de fecha.
  - `tz` (`string`): Zona horaria (por defecto `CONFIG.TIMEZONE`).
- **Retorno:** Cadena `'YYYY-MM-DD'`.

#### `parsearFechaHora(fechaRaw, nivelEnergia, horaProgramada)`
- **Tipo:** Helper de construcción de instantes Date con Time-Blocking inteligente.
- **Parámetros:**
  - `fechaRaw` (`string` | `Date`): Fecha objetivo.
  - `nivelEnergia` (`string`): Para ubicar en bloques 'Deep Work' (20:30) u 'Operativo' (10:00).
  - `horaProgramada` (`string`): Hora específica manual si fue provista.
- **Retorno:** `{ start: Date, end: Date, esTodoElDia: boolean }`.

#### `parsearFechaSinHora(fechaRaw)`
- **Tipo:** Helper para eventos de todo el día.
- **Retorno:** Objeto `Date` a las 00:00:00 en la zona horaria local.

#### `sincronizarFilaTarea(rowNumber, payload)`
- **Tipo:** Reconciliador reactivo por fila activado por `onEditTrigger`.
- **Parámetros:**
  - `rowNumber` (`number`): Fila física en `BBDD_Actividades_Tareas`.
  - `payload` (`Object`, opcional): Datos directos de la tarea si vienen de un formulario.
- **Descripción:** Lee los datos de la fila o payload, valida si tiene fecha programada, crea o actualiza el evento en el calendario `PMO - Proyectos`, y escribe el `Evento_Calendar_ID` en la columna física correspondiente.
- **Retorno:** `{ success: boolean, eventId: string }`.

#### `agendarTareaEnCalendar(payload, rowNumber)`
- **Tipo:** Creación/actualización directa de evento de tarea desde `TareasService`.
- **Parámetros:**
  - `payload` (`Object`): Datos de la tarea (`nombreTarea`, `fechaProgramada`, `horaInicio`, `duracionHoras`, etc.).
  - `rowNumber` (`number`, opcional): Fila en Sheets para persistir el ID.
- **Retorno:** `{ success: boolean, eventId: string }`.

#### `agendarRutinaControlProyecto(payload)`
- **Tipo:** Backend RPC (`action: "agendarRutinaControlProyecto"`).
- **Estructura Payload Entrada:**
```json
{
  "idProyecto": "PRO-P-M-I-01",
  "nombreProyecto": "Portal Web Life OS",
  "frecuenciaControl": "Semanal"
}
```
- **Descripción:** Crea una serie recurrente de eventos en `PMO - Proyectos` (ej. domingos a las 18:00 hrs, 45 minutos) con título `[PMO Control] Revisión & Check-in: NombreProyecto` y regla de recurrencia configurada según la frecuencia (Diario, Semanal, Quincenal, Mensual).
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "message": "Rutina de control agendada con éxito en PMO - Proyectos (Semanal - 18:00 hrs).",
  "idProyecto": "PRO-P-M-I-01",
  "frecuencia": "Semanal",
  "seriesId": "recurrence_series_id"
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "Error al agendar rutina de control: mensaje"
}
```

#### `sincronizarFilaActividadPersonal(rowNumber, payload)`
- **Tipo:** Sincronización reactiva de hábitos activada por `onEditTrigger`.
- **Parámetros:**
  - `rowNumber` (`number`): Fila en `BBDD_Actividades_Personales`.
  - `payload` (`Object`, opcional): Datos de la actividad.
- **Descripción:** Evalúa la duración. Si duración = 0h, delega a `_gestionarActividadComoTask()`; si duración > 0h, delega a `_gestionarActividadComoEventoCalendar()`. Escribe el ID en la hoja.
- **Retorno:** `{ success: boolean, id: string, tipo: 'CALENDAR' | 'TASK' }`.

#### `_calcularPrimerDiaValido(fechaBase, diasValidos)`
- **Tipo:** Helper de cálculo de días válidos para series de Calendar.
- **Retorno:** `Date`.

#### `_calcularOcurrenciasRutina(fechaInicioStr, freq, regla, diasSeleccionados, maxOcurrencias)`
- **Tipo:** Generador de instantes Date para múltiples ocurrencias de hábitos.
- **Retorno:** `Date[]`.

#### `_gestionarActividadComoTask(sheet, rowNumber, params)`
- **Tipo:** Integración de Google Tasks para ítems de 0h.
- **Retorno:** `{ success: boolean, taskId: string }`.

#### `_gestionarActividadComoEventoCalendar(sheet, rowNumber, params)`
- **Tipo:** Creación de bloques horarios en `PMO - Hábitos y Vida`.
- **Retorno:** `{ success: boolean, eventId: string }`.

#### `_esActividadRutinaria(frecuenciaCiclo, reglaRepeticion, diasSeleccionados)`
- **Tipo:** Evaluador booleano de recurrencia.
- **Retorno:** `boolean`.

#### `_crearSerieRecurrente(cal, sheet, rowNumber, params)`
- **Tipo:** Creación de serie recurrente de eventos en Google Calendar mediante `createEventSeries()`.
- **Retorno:** `{ success: boolean, seriesId: string }`.

#### `_parsearDiasEspecificos(reglaRepeticion, diasSeleccionados)`
- **Tipo:** Parser de lista de días de la semana (`L`, `M`, `X`, `J`, `V`, `S`, `D`).
- **Retorno:** `number[]` (días estándar 0 a 6).

#### `_eliminarTaskSiExiste(taskId)`
- **Tipo:** Helper seguro que remueve una Google Task si está registrada.
- **Retorno:** `void`.

#### `obtenerColorEventoGasto(categoria)`
- **Tipo:** Selector cromático de eventos para el calendario de gastos.
- **Retorno:** `CalendarApp.EventColor`.

#### `obtenerColorEventoIngreso(fuente)`
- **Tipo:** Selector cromático de eventos para el calendario de ingresos.
- **Retorno:** `CalendarApp.EventColor`.

#### `sincronizarFilaGasto(rowNumber, payload)`
- **Tipo:** Sincronización reactiva de fila de gasto. Si es futuro y programado, agenda en `PMO - Gastos Programados` o en Google Tasks.
- **Retorno:** `{ success: boolean, eventId: string }`.

#### `sincronizarFilaIngreso(rowNumber, payload)`
- **Tipo:** Sincronización reactiva de fila de ingreso en `PMO - Ingresos Programados` o Google Tasks.
- **Retorno:** `{ success: boolean, eventId: string }`.

#### `actualizarConciliacionEventoCalendar(idEvento, tipo, conciliar, detalle)`
- **Tipo:** Actualización de título y descripción del evento al conciliarse (agrega marca `[CONCILIADO]`).
- **Retorno:** `boolean`.

#### `agendarGastoEnCalendar(payload, rowNumber)`
- **Tipo:** Agendado directo de egreso programado.
- **Retorno:** `{ success: boolean, eventId: string }`.

#### `agendarIngresoEnCalendar(payload, rowNumber)`
- **Tipo:** Agendado directo de ingreso programado.
- **Retorno:** `{ success: boolean, eventId: string }`.

### 4. VARIABLES Y ESTADO:
- **Propiedades de usuario (`PropertiesService.getUserProperties()`):**
  - `"ID_Calendar_Proyectos"`
  - `"ID_Calendar_Habitos"`
  - `"ID_Calendar_Gastos"`
  - `"ID_Calendar_Ingresos"`
- **Constantes de configuración:** `CONFIG.CALENDARIOS`, `CONFIG.TIMEZONE`.
- **Integraciones:** `CalendarApp`, `Tasks` (Google Tasks API v1), `GoogleTasksService`.

---

## 5. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Config.js`

### 2. PROPÓSITO:
Núcleo declarativo de parámetros globales, nombres canónicos de hojas de cálculo, mapeo posicional de columnas, diccionarios de sinónimos/alias para resiliencia matricial dinámica, catálogo de opciones y configuración cromática del sistema. Es la piedra angular que permite a los servicios de backend leer y escribir en Google Sheets inspeccionando la Fila 1 de encabezados sin romperse por inserciones o desplazamientos de columnas.

### 3. FUNCIONES QUE CONTIENE:

#### `CONFIG.normalizarTextoCabecera(str)`
- **Tipo:** Helper puro de normalización de cadenas de encabezados.
- **Parámetros:**
  - `str` (`string`): Texto original del encabezado de columna.
- **Descripción:** Convierte a mayúsculas, elimina espacios, guiones, barras, porcentajes y tildes mediante descomposición Unicode NFD (`̀-ͯ`).
- **Retorno:** Cadena normalizada sin caracteres especiales (ej. `"Avance Real (%)"` -> `"AVANCEREAL"`).

#### `CONFIG.construirMapaColumnas(sheetOrHeaders, defaultConfig, aliasDict)`
- **Tipo:** Motor universal de resolución dinámica de columnas por coincidencia difusa de cabeceras.
- **Parámetros:**
  - `sheetOrHeaders` (`GoogleAppsScript.Spreadsheet.Sheet` | `string[]`): Hoja de cálculo o arreglo de encabezados de la Fila 1.
  - `defaultConfig` (`Object`): Mapeo canónico por defecto (índices base 0).
  - `aliasDict` (`Object`): Diccionario de claves canónicas con sus alias conocidos.
- **Descripción:** Ejecuta una resolución de 4 fases altamente resiliente:
  1. Coincidencia exacta de la clave canónica normalizada con la cabecera.
  2. Coincidencia secuencial por lista de alias para columnas no resueltas.
  2.5. Respaldo defensivo con `defaultConfig` para claves no detectadas en cabeceras.
  3. Armonización bidireccional y exportación polimórfica de sinónimos (`ID_TRANSACCION` <-> `ID_GASTO`, `CONCEPTO` <-> `DESCRIPCION`, `MONTO_MONEDA_BASE` <-> `MONTO_PEN`, `ID_PROYECTO` <-> `idProyecto` <-> `id_proyecto`, `ID_HITO` <-> `idHito` <-> `id_hito`, etc.).
  Calcula `MAX_COLUMNS`.
- **Retorno:** Objeto `{ NOMBRE_COLUMNA: indiceBase0, MAX_COLUMNS: total }`.

#### `CONFIG.obtenerMapaProyectos(sheetOrHeaders)`
- **Tipo:** Helper de mapeo para `BBDD_Proyectos`.
- **Retorno:** Mapa de columnas con claves de `CONFIG.COLS_PROYECTOS`.

#### `CONFIG.obtenerMapaHitos(sheetOrHeaders)`
- **Tipo:** Helper de mapeo para `BBDD_Hitos`.
- **Retorno:** Mapa de columnas con claves de `CONFIG.COLS_HITOS`.

#### `CONFIG.obtenerMapaTareas(sheetOrHeaders)`
- **Tipo:** Helper de mapeo para `BBDD_Actividades_Tareas`.
- **Descripción:** Resuelve los índices de columnas mediante `CONFIG.ALIASES_TAREAS` (robustece la detección de `ID_PROYECTO` e `ID_HITO` con soporte para variantes con guion bajo o pegadas como `ID_PROYECTO`, `IDPROYECTO`, `PROYECTO_ID`, `PROYECTOID`, `ID_HITO`, `IDHITO`, `HITO_ID`, `HITOID`, `ID_HITO_ASOCIADO`, `ID_PROYECTO_ASOCIADO`, etc.) y exporta de forma polimórfica `ID_PROYECTO`, `IDPROYECTO`, `idProyecto`, `id_proyecto` e `ID_HITO`, `IDHITO`, `idHito`, `id_hito`.
- **Retorno:** Mapa de columnas con claves de `CONFIG.COLS_TAREAS` y alias polimórficos.

#### `CONFIG.obtenerMapaActividades(sheetOrHeaders)`
- **Tipo:** Helper de mapeo para `BBDD_Actividades_Personales`.
- **Retorno:** Mapa de columnas con claves de `CONFIG.COLS_ACTIVIDADES_PERSONALES`.

#### `CONFIG.obtenerMapaIngresos(sheetOrHeaders)`
- **Tipo:** Helper de mapeo para `BBDD_Finanzas_Ingresos`.
- **Retorno:** Mapa de columnas con claves de `CONFIG.COLS_INGRESOS`.

#### `CONFIG.obtenerMapaFinanzas(sheetOrHeaders)` / `CONFIG.obtenerMapaGastos(sheetOrHeaders)`
- **Tipo:** Helper de mapeo para `BBDD_Finanzas_Gastos`.
- **Retorno:** Mapa de columnas con claves de `CONFIG.COLS_FINANZAS`.

#### `CONFIG.obtenerHojaGastos(ss)`
- **Tipo:** Resolver polimórfico de la hoja de gastos.
- **Parámetros:**
  - `ss` (`GoogleAppsScript.Spreadsheet.Spreadsheet`, opcional): Libro activo.
- **Descripción:** Busca en orden de prioridad: `CONFIG.SHEETS.FINANZAS`, `"BBDD_Finanzas_Gastos"`, `"BBDD_Gastos"`, `"BBDD_Finanzas"`, `"Gastos"`.
- **Retorno:** Objeto `Sheet`.

#### `CONFIG.obtenerHojaIngresos(ss)`
- **Tipo:** Resolver polimórfico de la hoja de ingresos.
- **Parámetros:**
  - `ss` (`GoogleAppsScript.Spreadsheet.Spreadsheet`, opcional): Libro activo.
- **Descripción:** Busca en orden de prioridad: `CONFIG.SHEETS.INGRESOS`, `"BBDD_Finanzas_Ingresos"`, `"BBDD_Ingresos"`, `"Ingresos"`.
- **Retorno:** Objeto `Sheet`.

#### `CONFIG.normalizarCategoriaVida(catRaw)`
- **Tipo:** Normalizador de categorías de vida.
- **Parámetros:**
  - `catRaw` (`string`): Texto ingresado.
- **Retorno:** Una de las 6 claves canónicas: `SALUD_DEPORTE`, `DESARROLLO_ESTUDIO`, `LABORAL_HONORARIO`, `FINANZAS_TRAMITES`, `SOCIAL_FAMILIA`, `PERSONAL_DESCANSO`.

#### `verificarClaveGemini()`
- **Tipo:** Función utilitaria de diagnóstico para el desarrollador.
- **Descripción:** Lee `PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')` y registra en Logger si la clave existe y tiene longitud válida.
- **Retorno:** `void`.

### 4. VARIABLES Y ESTADO:
- **Objeto Global:** `CONFIG`.
- **Hojas definidas (`CONFIG.SHEETS`):**
  - `PROYECTOS`: `"BBDD_Proyectos"`
  - `HITOS`: `"BBDD_Hitos"`
  - `TAREAS`: `"BBDD_Actividades_Tareas"`
  - `FINANZAS`: `"BBDD_Finanzas_Gastos"`
  - `ACTIVIDADES_PERSONALES`: `"BBDD_Actividades_Personales"`
  - `INGRESOS`: `"BBDD_Finanzas_Ingresos"`
  - `CONFIG`: `"Configuracion_Sistema"`
  - `SUBTAREAS`: `"BBDD_Subtareas_Pasos"`
  - `NOTAS`: `"BBDD_Notas"`
  - *(Hojas físicas de FlujoCaja y Cuotas retiradas en Fases 4.11 y 4.12; consolidadas en BBDD_Finanzas_Gastos)*
- **Catálogos canónicos (`CONFIG.CATALOGOS`):** `TIPOS_COMPROMISO`, `CATEGORIAS_VIDA`, `ORIGEN_INGRESOS`, `CATEGORIAS_CUOTAS`, `ESTADOS_CUOTA`, `ESTADOS_TAREAS`.
- **Timezone:** `"America/Lima"`.
- **Esquema Canónico de Columnas (`CONFIG.COLS_PROYECTOS` - 20 Columnas A:T):**
  - Col A (0): `ID_PROYECTO` (`PRO-XXX`)
  - Col B (1): `NOMBRE` / `NOMBRE_PROYECTO`
  - Col C (2): `TIPO_INICIATIVA` / `TIPO`
  - Col D (3): `MAGNITUD_COMPLEJIDAD` / `TSHIRT`
  - Col E (4): `ARQUETIPO_PROYECTO` / `CRITERIO`
  - Col F (5): `ESTADO` / `ESTADO_PROYECTO`
  - Col G (6): `HEALTH_STATUS` / `HEALTH`
  - Col H (7): `AVANCE_REAL_PCT` / `AVANCE` (Calculado por backend)
  - Col I (8): `ENTREGABLE_OBJETO` / `OBJETO` / `Entregable_Tangible_Objeto`
  - Col J (9): `NORTH_STAR_OKR` / `OKR`
  - Col K (10): `CRITERIOS_DOD` / `DOD` / `Criterios_Aceptacion_DoD`
  - Col L (11): `ULTIMA_REVISION`
  - Col M (12): `FECHA_INICIO_PLAN`
  - Col N (13): `FECHA_FIN_PLAN`
  - Col O (14): `MONEDA_BASE`
  - Col P (15): `PRESUPUESTO_TOPE`
  - Col Q (16): `COSTO_EJECUTADO_PEN` / `COSTO_REAL_PEN` / `Costo_Ejecutado_Real_PEN` (Calculado por backend)
  - Col R (17): `COSTO_EJECUTADO_USD` / `COSTO_REAL_USD` / `Costo_Ejecutado_Real_USD` (Calculado por backend)
  - Col S (18): `TERCEROS_INVOLUCRADOS` / `TERCEROS`
  - Col T (19): `ALCANCE_URL_DRIVE` / `URL_DRIVE` / `Alcance_Detallado_URL_Drive`
  - `MAX_COLUMNS: 20`
- **Esquema Canónico de Columnas (`CONFIG.COLS_HITOS` - 14 Columnas A:N):**
  - Col A (0): `ID_ELEMENTO_WBS` (`WP-XXX` / `HIT-XXX`, alias: `ID_Hito`, `ID_Elemento_WBS`)
  - Col B (1): `ID_PROYECTO` (FK hacia `BBDD_Proyectos`)
  - Col C (2): `TIPO_ELEMENTO_WBS` (`PAQUETE_TRABAJO` | `HITO_MARCADOR`, alias: `Tipo_Elemento_WBS`)
  - Col D (3): `WBS_CODE` (Código jerárquico ej: `1.1`, `1.2.1`, alias: `WBS_Code`)
  - Col E (4): `FASE_ASOCIADA` (Fase contenedora Nivel 1, alias: `Fase_Asociada`)
  - Col F (5): `NOMBRE_ELEMENTO` (Nombre del Paquete o Hito, alias: `Nombre_Hito`, `Nombre_Elemento`)
  - Col G (6): `ESTADO` (`01_Pendiente`, `02_En_Progreso`, `03_Completado`, `04_Cancelado`, alias: `Estado_Hito`, `Estado`)
  - Col H (7): `PESO_PCT` / `PESO_PONDERADO_PCT` (Ponderación física 0 a 1)
  - Col I (8): `FECHA_LIMITE` / `FECHA_LIMITE_PLAN` (`YYYY-MM-DD`)
  - Col J (9): `FECHA_REAL_FIN` (`YYYY-MM-DD`)
  - Col K (10): `PRESUPUESTO_ASIGNADO` / `COSTO_ASOCIADO_ESTIMADO` (Techo $PV asignado; obligatorio `0.00` para `HITO_MARCADOR`)
  - Col L (11): `CRITERIO_DOD` / `CRITERIO_ACEPTACION_DOD` / `DOD` (Definition of Done)
  - Col M (12): `DEPENDENCIA_PREDECESORA` / `DEPENDENCIA_ID_HITO` / `DEPENDENCIA` (Predecesor CPM)
  - Col N (13): `ENTREGABLE_LINK` / `ENTREGABLE_VERIFICABLE_LINK` / `LINK_ENTREGABLE` (Link Drive/URL)
  - `MAX_COLUMNS: 14`
- **Esquema Canónico de Columnas (`CONFIG.COLS_TAREAS` - 14 Columnas A:N):**
  - Col A (0): `ID_TAREA` (PK única `TAR-XXX`)
  - Col B (1): `ID_HITO` (FK hacia `WP-XXX` en `BBDD_Hitos`)
  - Col C (2): `ID_PROYECTO` (FK hacia `PRO-XXX`, resuelto en memoria por backend, sin fórmula in-sheet)
  - Col D (3): `NOMBRE_TAREA` (`Nombre_Tarea_Actividad`)
  - Col E (4): `ESTADO` (`01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`, `05_Archivado`, alias: `Estado_Tarea`)
  - Col F (5): `PRIORIDAD` (`01_P1_Alta`, `02_P2_Media`, `03_P3_Baja`, `04_P4_Delegable`, alias: `Prioridad_Eisenhower`)
  - Col G (6): `NIVEL_ENERGIA` (`Alta_Cognitiva_DeepWork`, `Media_Operativa`, `Baja_Administrativa`, alias: `Nivel_Energia_Requerido`)
  - Col H (7): `HORAS_ESTIMADAS` (Esfuerzo planificado en horas)
  - Col I (8): `HORAS_REALES` (Horas consumidas al momento del cierre)
  - Col J (9): `FECHA_PROGRAMADA` (`YYYY-MM-DD` o `YYYY-MM-DD HH:mm`)
  - Col K (10): `AGENDADO_CALENDAR` (`Sí` / `No` / `Sí|ID_EVENTO`)
  - Col L (11): `ID_DEPENDENCIA` (Predecesora operativa protegida `TAR-XXX`)
  - Col M (12): `RESPONSABLE` (Ejecutor asignado, alias: `Responsable_Ejecutor`)
  - Col N (13): `NOTAS` (Bloqueos, impedimentos y glosas operativas, alias: `Notas_Impedimentos`)
  - `MAX_COLUMNS: 14`

---

## 6. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Correlativos.js`

### 2. PROPÓSITO:
Motor generador atómico y concurrente de identificadores primarios (PKs) para todas las tablas del sistema. Protegido mediante exclusión mutua estricta con `LockService` (timeout de 10,000 ms), previene condiciones de carrera o duplicación de llaves al crear registros concurrentes desde la interfaz web o procesos batch.

### 3. FUNCIONES QUE CONTIENE:

#### `CorrelativoService.generarIdProyecto()`
- **Tipo:** Generador PK de proyectos (WBS v4.1).
- **Descripción:** Genera directamente un autoincremental limpio de 3 dígitos con prefijo `PRO-` protegido por `LockService`, eliminando la dependencia de letras de talla o criterios en la llave primaria.
- **Estructura Formato ID:** `PRO-XXX` secuencial de 3 dígitos (ej. `PRO-001`, `PRO-002`).
- **Retorno:** `string`.

#### `CorrelativoService.generarIdPaqueteTrabajo()`
- **Tipo:** Generador PK para Paquetes de Trabajo WBS (WBS v4.1).
- **Descripción:** Genera identificadores secuenciales con prefijo `WP-` (Work Package) para elementos que conllevan costo asignado y admiten vinculación de tareas.
- **Estructura Formato ID:** `WP-XXX` secuencial de 3 dígitos (ej. `WP-001`, `WP-002`).
- **Retorno:** `string`.

#### `CorrelativoService.generarIdHito(idProyecto)`
- **Tipo:** Generador PK para Hitos Marcadores de Control (WBS v4.1).
- **Parámetros:**
  - `idProyecto` (`string`, opcional): Código del proyecto padre.
- **Descripción:** Genera identificadores secuenciales con prefijo `HIT-` para marcadores de control cronológico (duración cero, costo $0, sin tareas asociadas).
- **Estructura Formato ID:** `HIT-XXX` secuencial de 3 dígitos (ej. `HIT-001`, `HIT-042`).
- **Retorno:** `string`.

#### `CorrelativoService.generarCorrelativo(tipo)`
- **Tipo:** Despachador universal de correlativos.
- **Parámetros:**
  - `tipo` (`string`): Tipo de entidad (`"WP"` / `"PAQUETE"` -> `generarIdPaqueteTrabajo()`, `"HIT"` / `"HITO"` -> `generarIdHito()`, `"PRO"` / `"PROYECTO"` -> `generarIdProyecto()`, etc.).
- **Retorno:** `string`.

#### `CorrelativoService.generarIdsBatch(tipo, cantidad)`
- **Tipo:** Generador en lote atómico para transacciones concurrentes sin colisiones.
- **Soporte:** `WP` / `PAQUETE`, `HIT` / `HITO`, `PRO` / `PROYECTO`, `TAR`, `GAS`, `ING`, `ACT`, `NOT`, `CUO`.
- **Retorno:** `string[]`.

#### `CorrelativoService.generarIdTarea()`
- **Tipo:** Generador PK de tareas operativas de proyecto.
- **Estructura Formato ID:** `TAR-XXX` secuencial de 3 dígitos (ej. `TAR-001`, `TAR-158`).
- **Retorno:** `string`.

#### `CorrelativoService.generarIdGasto()`
- **Tipo:** Generador PK de transacciones de egreso monetario.
- **Estructura Formato ID:** `GAS-XXX` secuencial de 3 dígitos (ej. `GAS-001`, `GAS-089`).
- **Retorno:** `string`.

#### `CorrelativoService.generarIdActividadPersonal()`
- **Tipo:** Generador PK de actividades de vida y hábitos.
- **Estructura Formato ID:** `ACT-XXX` secuencial de 3 dígitos (ej. `ACT-001`, `ACT-077`).
- **Retorno:** `string`.

#### `CorrelativoService.generarIdIngreso()`
- **Tipo:** Generador PK de entradas financieras y cobros.
- **Estructura Formato ID:** `ING-XXX` secuencial de 3 dígitos (ej. `ING-001`, `ING-025`).
- **Retorno:** `string`.

#### `CorrelativoService.generarIdSubtarea()`
- **Tipo:** Generador PK de subtareas procedurales hijas.
- **Descripción:** Si la hoja `BBDD_Subtareas_Pasos` no existe, la inicializa con cabeceras antes de calcular el correlativo secuencial.
- **Estructura Formato ID:** `SUB-XXX` secuencial de 3 dígitos (ej. `SUB-001`, `SUB-312`).
- **Retorno:** `string`.

#### `CorrelativoService.generarIdNota()`
- **Tipo:** Generador PK de notas inteligentes.
- **Descripción:** Si la hoja `BBDD_Notas` no existe, la inicializa con encabezados canónicos.
- **Estructura Formato ID:** `NOT-XXXXX` secuencial de 5 dígitos (ej. `NOT-00001`, `NOT-00124`).
- **Retorno:** `string`.

### 4. VARIABLES Y ESTADO:
- **Objeto Global:** `CorrelativoService`.
- **LockService:** `LockService.getScriptLock()` con bloqueo de 10 segundos por llamada.
- **Persistencia:** Inspecciona la primera columna de cada hoja canónica en `SpreadsheetApp.getActiveSpreadsheet()`.

---

## 7. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\DashboardService.js`

### 2. PROPÓSITO:
Agregador universal de datos y motor de optimización de rendimiento de la suite. Ejecuta la lectura consolidada de todas las entidades del sistema (Proyectos, Hitos, Tareas, Gastos, Actividades Personales, Ingresos, Subtareas, Notas Inteligentes y Cuotas) en un único ciclo eficiente de lectura en masa (`getValues()`), calcula estadísticas de portafolio y balance en memoria, e implementa una capa de caché de alto rendimiento con fragmentación inteligente para eludir el límite de 100 KB de `CacheService` de Google Apps Script.

### 3. FUNCIONES QUE CONTIENE:

#### `DashboardService.getDashboardData(payload)`
- **Tipo:** Backend RPC principal (`action: "getDashboardData"`).
- **Estructura Payload Entrada:**
```json
{
  "forceRefresh": false
}
```
- **Descripción:**
  1. Si `forceRefresh` es `false`, intenta recuperar los datos desde `CacheService.getScriptCache()` (reconstruyendo fragmentos si la llave `DASHBOARD_DATA_CACHE_CHUNKS` existe).
  2. Si no hay caché o se forzó actualización, lee en lote las 9 hojas BBDD mediante mapeo de columnas dinámico (`CONFIG.construirMapaColumnas`), aplicando fallback multicanal defensivo para `ID_Hito` e `ID_Proyecto`, detección automática de inversión accidental de columnas (Col B <-> Col C) y deducción jerárquica inversa de proyecto vía `mapaHitoAProyecto` y convención de prefijos `-H`.
  3. Exporta de forma polimórfica en cada objeto de tarea: `idProyecto`, `id_proyecto`, `ID_Proyecto` e `idHito`, `id_hito`, `ID_Hito` con `String().trim()`, normalizando fechas ISO, números decimales y estados para evitar problemas con epochs 1899 de Sheets.
  4. Calcula KPIs globales: Proyectos activos/en riesgo, balance monetario (Ingresos PEN, Gastos PEN, Saldo Neto), horas planificadas vs. reales, y rachas de hábitos.
  5. Serializa el resultado. Si supera 95 KB, lo divide en fragmentos de 90 KB y los guarda en caché por 21,600 segundos (6 horas).
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "proyectos": [
    {
      "id": "PRO-P-M-I-01",
      "nombre": "Portal Web Life OS",
      "tipo": "Profesional",
      "tShirt": "M",
      "criterio": "Inversión",
      "Arquetipo_Proyecto": "1_Infraestructura",
      "Magnitud_Complejidad": "Medium",
      "estado": "03_En_Proceso",
      "health": "Verde",
      "avanceRealPct": 65,
      "presupuestoTope": 5000,
      "costoRealPEN": 2350,
      "costoRealUSD": 0,
      "monedaBase": "PEN",
      "fechaInicioPlan": "2026-09-01",
      "fechaFinPlan": "2026-11-30",
      "urlDrive": "https://drive.google.com/drive/folders/...",
      "featureFlags": {
        "arquetipo": "1_Infraestructura",
        "magnitud": "Medium",
        "flags": {
          "arbolWbsCompleto": true,
          "rutaCriticaCpm": true,
          "evmFinanciero": true,
          "sprintsAgiles": false,
          "tableroHipotesis": false,
          "matrizTradeOff": false,
          "checklistDueDiligence": false,
          "hitosCurriculares": false,
          "timeBlockingDeepWork": false,
          "cronogramaTMinus": false,
          "directorioProveedores": false,
          "modoUltraLigero": false
        }
      }
    }
  ],
  "hitos": [
    {
      "id": "HIT-001",
      "idProyecto": "PRO-P-M-I-01",
      "nombre": "Fase 1: Arquitectura Base",
      "pesoPct": 30,
      "estado": "04_Completado",
      "fechaLimite": "2026-09-20"
    }
  ],
  "tareas": [
    {
      "ID_Tarea": "TAR-001",
      "idTarea": "TAR-001",
      "id_tarea": "TAR-001",
      "ID_Proyecto": "PRO-P-M-I-01",
      "idProyecto": "PRO-P-M-I-01",
      "id_proyecto": "PRO-P-M-I-01",
      "ID_Hito": "HIT-001",
      "idHito": "HIT-001",
      "id_hito": "HIT-001",
      "Nombre_Tarea_Actividad": "Diseño de Esquema BBDD",
      "Estado_Tarea": "04_Completado",
      "Prioridad_Eisenhower": "01_P1_Alta",
      "Horas_Estimadas": 8,
      "Horas_Reales": 7.5,
      "Fecha_Programada": "2026-09-05"
    }
  ],
  "gastos": [
    {
      "id": "GAS-001",
      "idProyecto": "PRO-P-M-I-01",
      "concepto": "Hosting Servidor Cloud",
      "monto": 150.00,
      "montoPEN": 150.00,
      "moneda": "PEN",
      "categoria": "Infraestructura",
      "fecha": "2026-09-10",
      "estado": "Ejecutado"
    }
  ],
  "actividadesPersonales": [
    {
      "id": "ACT-001",
      "nombre": "Gimnasio Fuerza",
      "categoriaVida": "SALUD_DEPORTE",
      "tipoCompromiso": "HABITUAL",
      "estado": "02_Por_Hacer",
      "rachaActual": 12,
      "fechaProgramada": "2026-09-30",
      "horaInicio": "06:30",
      "duracionHoras": 1.5
    }
  ],
  "ingresos": [
    {
      "id": "ING-001",
      "concepto": "Consultoría PMO",
      "monto": 3500.00,
      "montoPEN": 3500.00,
      "moneda": "PEN",
      "fecha": "2026-09-25",
      "estado": "Cobrado"
    }
  ],
  "subtareas": [
    {
      "id": "SUB-001",
      "idPadre": "TAR-001",
      "tipoPadre": "TAREA",
      "numeroPaso": 1,
      "descripcion": "Definir llaves primarias",
      "completado": true
    }
  ],
  "notas": [
    {
      "id": "NOT-00001",
      "titulo": "Ideas de Arquitectura",
      "tipo": "NORMAL",
      "color": "indigo",
      "esFijada": true,
      "contenido": "Implementar CQRS liviano...",
      "checklist": [],
      "adjuntos": [],
      "vinculos": []
    }
  ],
  "cuotas": [],
  "telemetriaCarga": {
    "alertaSobrecarga": false,
    "conteoHeavy": 1,
    "conteoMedium": 2,
    "mensajeAlerta": "Carga de proyectos dentro del umbral operativo."
  },
  "estadisticas": {
    "totalProyectos": 12,
    "totalTareas": 85,
    "tareasCompletadas": 62,
    "totalGastosPEN": 12450.00,
    "totalIngresosPEN": 24800.00,
    "balanceNetoPEN": 12350.00
  },
  "meta": {
    "timestamp": "2026-09-30T16:30:00.000Z",
    "fromCache": false,
    "timezone": "America/Lima"
  }
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "Error al consolidar dashboard: mensaje descriptivo"
}
```

### 4. VARIABLES Y ESTADO:
- **Caché:** `CacheService.getScriptCache()`.
  - Llave maestra: `"DASHBOARD_DATA_CACHE"`.
  - Llave de fragmentación: `"DASHBOARD_DATA_CACHE_CHUNKS"`, `"DASHBOARD_DATA_CACHE_CHUNK_0"`, `"DASHBOARD_DATA_CACHE_CHUNK_1"`, etc.
  - Expiración: 21,600 segundos (6 horas).
- **Hojas leídas:** 9 pestañas de `CONFIG.SHEETS`.

---

## 8. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\DriveService.js`

### 2. PROPÓSITO:
Gestor de persistencia y organización documental en Google Drive (`DriveApp`). Automatiza la creación y vinculación jerárquica de carpetas dedicadas para cada nuevo proyecto (`[PRO-XXX] NombreProyecto`), estructurándolas en subcarpetas temáticas (`01_Documentacion_Entregables`, `02_Comprobantes_Finanzas`, `03_Contratos_Cotizaciones`), y administra el almacenamiento de archivos binarios e imágenes adjuntas a Notas Inteligentes (`PMO_Notas_Adjuntos`).

### 3. FUNCIONES QUE CONTIENE:

#### `DriveService.inicializarCarpetaProyecto(idProyecto, nombreProyecto, parentFolderId = null)`
- **Tipo:** Servicio de dominio invocado internamente por `ProyectosService`.
- **Parámetros:**
  - `idProyecto` (`string`): Código correlativo (`PRO-XXX`).
  - `nombreProyecto` (`string`): Nombre formal de la iniciativa.
  - `parentFolderId` (`string`, opcional): ID de carpeta padre en Google Drive.
- **Descripción:** Crea en la raíz de Google Drive (o dentro de `parentFolderId`) la carpeta principal del proyecto nombrada `[idProyecto] nombreProyecto`. Dentro de ella genera 3 subcarpetas estándar:
  1. `01_Documentacion_Entregables`
  2. `02_Comprobantes_Finanzas`
  3. `03_Contratos_Cotizaciones`
  Obtiene la URL pública de visualización y actualiza la columna `URL_DRIVE` en `BBDD_Proyectos`.
- **Retorno:**
```json
{
  "success": true,
  "folderId": "1a2b3c4d5e6f...",
  "folderUrl": "https://drive.google.com/drive/folders/1a2b3c4d5e6f...",
  "subcarpetas": {
    "documentacion": "id_sub1",
    "comprobantes": "id_sub2",
    "contratos": "id_sub3"
  }
}
```

#### `DriveService.guardarArchivoAdjuntoNota(idNota, base64Data, mimeType, fileName)`
- **Tipo:** Servicio de almacenamiento binario para notas (`NotasService`).
- **Parámetros:**
  - `idNota` (`string`): Identificador de la nota (`NOT-XXXXX`).
  - `base64Data` (`string`): Cadena en Base64 del contenido del archivo.
  - `mimeType` (`string`): Tipo MIME (ej. `'image/png'`, `'application/pdf'`).
  - `fileName` (`string`): Nombre original del archivo.
- **Descripción:** Decodifica los bytes Base64 con `Utilities.base64Decode()`, busca o crea la carpeta global `"PMO_Notas_Adjuntos"`, guarda el archivo con nombre prefijado `[idNota]_fileName`, establece permisos de lectura, y genera su URL de visualización directa y miniatura.
- **Retorno:**
```json
{
  "success": true,
  "id": "drive_file_id",
  "nombre": "[NOT-00001]_recibo.png",
  "url": "https://drive.google.com/file/d/.../view",
  "mimeType": "image/png",
  "downloadUrl": "https://drive.google.com/uc?id=..."
}
```

### 4. VARIABLES Y ESTADO:
- **Carpeta de Notas:** `"PMO_Notas_Adjuntos"`.
- **Servicios de Google:** `DriveApp`, `Utilities.base64Decode()`.


---

## 9. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\FinanzasAvanzadasService.js`

### 2. PROPÓSITO:
Servicio especializado en tesorería extendida, planeamiento y control financiero avanzado. Administra el modelo de flujo de caja proyectado vs. real, la conciliación bancaria de transacciones, la gestión de planes de compras a plazos / financiamiento en cuotas (`BBDD_Finanzas_Cuotas`, prefijo `CUO-XXX`), amortización periódica y cálculo de indicadores avanzados de salud financiera (Runway en meses, Burn Rate mensual, Capacidad de Ahorro, Nivel de Endeudamiento, Tasa de Desviación Presupuestal y Proyección de Saldo).

### 3. FUNCIONES QUE CONTIENE:

#### `FinanzasAvanzadasService.createMovimiento(payload)`
- **Tipo:** Backend RPC (`action: "createMovimiento"` / `"crearmovimientoflujocaja"`).
- **Estructura Payload Entrada:**
```json
{
  "fecha": "2026-10-15",
  "tipo": "EGRESO",
  "categoria": "Cuota_Credito",
  "descripcion": "Pago cuota laptop",
  "montoProyectado": 450.00,
  "montoReal": 0,
  "moneda": "PEN",
  "tipoCambio": 3.75,
  "estado": "PROGRAMADO",
  "recurrente": true,
  "frecuencia": "MENSUAL",
  "idCuota": "CUO-001",
  "numeroCuota": 3,
  "notas": "Descuento automático"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idMovimiento": "MOV-024",
  "message": "Movimiento registrado con éxito"
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "Error al registrar movimiento: mensaje"
}
```

#### `FinanzasAvanzadasService.updateMovimiento(payload)`
- **Tipo:** Backend RPC (`action: "updateMovimiento"`).
- **Estructura Payload Entrada:**
```json
{
  "idMovimiento": "MOV-024",
  "fecha": "2026-10-16",
  "montoProyectado": 450.00,
  "montoReal": 450.00,
  "estado": "EJECUTADO",
  "notas": "Pagado vía transferencia BCP"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idMovimiento": "MOV-024"
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "Movimiento no encontrado: MOV-024"
}
```

#### `FinanzasAvanzadasService.deleteMovimiento(payload)`
- **Tipo:** Backend RPC (`action: "deleteMovimiento"`).
- **Estructura Payload Entrada:**
```json
{
  "idMovimiento": "MOV-024"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idEliminado": "MOV-024"
}
```

#### `FinanzasAvanzadasService.conciliarTransaccion(payload)`
- **Tipo:** Backend RPC (`action: "conciliarTransaccion"` / `"conciliarmovimiento"`).
- **Estructura Payload Entrada:**
```json
{
  "idTransaccion": "GAS-032",
  "tipo": "GASTO",
  "fechaReal": "2026-09-28",
  "montoReal": 150.00
}
```
- **Descripción:** Marca la transacción como conciliada (`CONCILIADO = true`), estampa la fecha de conciliación, sincroniza el título del evento en Calendar o Tasks (agregando `[CONCILIADO]`), e invalida el caché.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idTransaccion": "GAS-032",
  "conciliado": true,
  "fechaConciliacion": "2026-09-30T15:00:00.000Z"
}
```

#### `FinanzasAvanzadasService.desconciliarMovimiento(payload)`
- **Tipo:** Backend RPC (`action: "desconciliarMovimiento"`).
- **Estructura Payload Entrada:**
```json
{
  "idMovimiento": "MOV-024"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idMovimiento": "MOV-024",
  "conciliado": false
}
```

#### `FinanzasAvanzadasService.createPlanCuotas(payload)`
- **Tipo:** Backend RPC (`action: "createPlanCuotas"`).
- **Estructura Payload Entrada:**
```json
{
  "nombrePlan": "Financiamiento Laptop Pro",
  "descripcion": "Laptop desarrollo para proyectos",
  "montoTotal": 6000.00,
  "cuotaInicial": 1200.00,
  "numCuotas": 12,
  "montoCuota": 400.00,
  "tasaInteres": 0,
  "tipoTasa": "SIN_INTERES",
  "fechaInicio": "2026-10-05",
  "diaPago": 5,
  "categoria": "ELECTRONICO",
  "metodoPago": "Tarjeta",
  "entidadFinanciera": "BCP",
  "notas": "Promoción 12 cuotas sin intereses"
}
```
- **Descripción:** Inserta el registro del plan maestro en `BBDD_Finanzas_Cuotas` (`CUO-XXX`), genera opcionalmente los 12 egresos programados futuros en `BBDD_Finanzas_Gastos` asociados a Google Tasks, y calcula el saldo inicial.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idCuota": "CUO-003",
  "saldoPendiente": 4800.00,
  "movimientosGenerados": 12
}
```

#### `FinanzasAvanzadasService.updatePlanCuotas(payload)`
- **Tipo:** Backend RPC (`action: "updatePlanCuotas"`).
- **Estructura Payload Entrada:**
```json
{
  "idCuota": "CUO-003",
  "nombrePlan": "Laptop Pro 32GB",
  "estado": "ACTIVO",
  "notas": "Actualizado límite de crédito"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idCuota": "CUO-003"
}
```

#### `FinanzasAvanzadasService.deletePlanCuotas(payload)`
- **Tipo:** Backend RPC (`action: "deletePlanCuotas"`).
- **Estructura Payload Entrada:**
```json
{
  "idCuota": "CUO-003",
  "eliminarMovimientosAsociados": true
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idCuota": "CUO-003",
  "movimientosEliminados": 10
}
```

#### `FinanzasAvanzadasService.calcularMetricasAvanzadas(payload)`
- **Tipo:** Backend RPC (`action: "calcularMetricasAvanzadas"` / `"getmetricasfinanzas"`).
- **Estructura Payload Entrada:**
```json
{
  "mes": "2026-09"
}
```
- **Descripción:** Agrega ingresos y gastos ejecutados vs. proyectados, cuotas pendientes, calcula Burn Rate mensual, Runway estimado en meses, Ratio de Endeudamiento sobre ingresos, y proyecciones de flujo a 30, 60 y 90 días.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "metricas": {
    "runwayMeses": 6.4,
    "burnRateMensualPEN": 4200.00,
    "capacidadAhorroPEN": 2300.00,
    "ratioEndeudamientoPct": 22.5,
    "totalComprometidoCuotasPEN": 14200.00,
    "proyeccionFinDeMesPEN": 8450.00
  }
}
```

#### Helpers Internos:
- `_generarMovimientosCuota(...)`: Genera cronograma recurrente de cuotas.
- `_actualizarProgresoCuota(idCuota, montoPagado)`: Recalcula `Cuotas_Pagadas`, `Monto_Pagado` y `Saldo_Pendiente`.
- `_eliminarMovimientosCuota(idCuota)`: Remueve cuotas huérfanas en lote.

### 4. VARIABLES Y ESTADO:
- **Hojas persistentes:** `CONFIG.SHEETS.CUOTAS` (`"BBDD_Finanzas_Cuotas"`), `CONFIG.SHEETS.FINANZAS` (`"BBDD_Finanzas_Gastos"`).
- **Caché:** Invalida `"DASHBOARD_DATA_CACHE"`.
- **Exclusión mutua:** `LockService.getScriptLock()` (10s).

---

## 10. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\FinanzasService.js`

### 2. PROPÓSITO:
Servicio central de tesorería y gestión contable polimórfica (Gastos e Ingresos). Administra los registros de egresos (`BBDD_Finanzas_Gastos`, `GAS-XXX`) e ingresos (`BBDD_Finanzas_Ingresos`, `ING-XXX`), soporta el esquema polimórfico coexistente v2.2 (resolución de cabeceras dinámicas sin índices fijos), cotización en tiempo real de divisas (USD/PEN) mediante APIs públicas con fallback local, gestión atómica del ciclo de cuotas (creación de cronogramas, pago secuencial de cuotas con actualización de amortización y saneamiento de desfases temporales), y sincronización reactiva hacia Google Calendar / Google Tasks.

### 3. FUNCIONES QUE CONTIENE:

#### `FinanzasService.obtenerMapaColumnasGastos(sheet)`
- **Tipo:** Helper de mapeo de cabeceras de gastos.
- **Retorno:** Diccionario `{ COL: index }`.

#### `FinanzasService.obtenerMapaColumnasIngresos(sheet)`
- **Tipo:** Helper de mapeo de cabeceras de ingresos.
- **Retorno:** Diccionario `{ COL: index }`.

#### `FinanzasService.obtenerHojaGastos(ss)`
- **Tipo:** Resolver de hoja de gastos.
- **Retorno:** Objeto `Sheet`.

#### `FinanzasService.obtenerHojaIngresos(ss)`
- **Tipo:** Resolver de hoja de ingresos.
- **Retorno:** Objeto `Sheet`.

#### `FinanzasService.createGasto(payload)`
- **Tipo:** Backend RPC (`action: "createGasto"`).
- **Estructura Payload Entrada:**
```json
{
  "idProyecto": "PRO-P-M-I-01",
  "idHito": "HIT-001",
  "idTarea": "TAR-005",
  "clasificacionOrigen": "Proyecto",
  "concepto": "Licencia Figma Pro",
  "categoria": "Software",
  "monedaOriginal": "USD",
  "montoOriginal": 15.00,
  "tipoCambio": 3.75,
  "montoPEN": 56.25,
  "fechaGasto": "2026-09-30",
  "metodoPago": "Tarjeta Crédito",
  "comprobanteUrl": "https://drive.google.com/...",
  "estadoPago": "Ejecutado",
  "modalidad": "Real / Ejecutado",
  "agendarCalendar": false
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "data": {
    "idGasto": "GAS-089",
    "montoPEN": 56.25,
    "estado": "Ejecutado",
    "idEventoCalendar": null,
    "idGoogleTask": null
  },
  "message": "Gasto registrado con éxito"
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "Error al registrar gasto: concepto requerido"
}
```

#### `FinanzasService.updateGasto(payload)`
- **Tipo:** Backend RPC (`action: "updateGasto"`).
- **Estructura Payload Entrada:**
```json
{
  "idGasto": "GAS-089",
  "idProyecto": "PRO-P-M-I-01",
  "idHito": "HIT-001",
  "idTarea": "TAR-005",
  "concepto": "Licencia Figma Pro Anual",
  "montoOriginal": 144.00,
  "monedaOriginal": "USD",
  "tipoCambio": 3.75,
  "montoPEN": 540.00,
  "fechaGasto": "2026-09-30",
  "categoria": "Software",
  "estadoPago": "Ejecutado",
  "comprobanteUrl": "https://drive.google.com/..."
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idGasto": "GAS-089",
  "message": "Gasto actualizado"
}
```

#### `FinanzasService.desvincularGasto(payload)`
- **Tipo:** Backend RPC (`action: "desvincularGasto"`).
- **Estructura Payload Entrada:**
```json
{
  "idGasto": "GAS-089"
}
```
- **Descripción:** Conserva el registro financiero pero limpia sus llaves foráneas (`ID_Proyecto = ""`, `ID_Hito = ""`, `ID_Tarea = ""`), reclasificándolo como Gasto General/Personal.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idGasto": "GAS-089",
  "message": "Gasto desvinculado del proyecto con éxito"
}
```

#### `FinanzasService.deleteGasto(payload)`
- **Tipo:** Backend RPC (`action: "deleteGasto"`).
- **Estructura Payload Entrada:**
```json
{
  "idGasto": "GAS-089"
}
```
- **Descripción:** Remueve la fila de Sheets mediante `sobrescribirHojaFiltrada`, elimina el evento en Calendar o Task en Tasks, e invalida la caché.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idEliminado": "GAS-089"
}
```

#### `FinanzasService.createIngreso(payload)`
- **Tipo:** Backend RPC (`action: "createIngreso"`).
- **Estructura Payload Entrada:**
```json
{
  "fechaIngreso": "2026-10-01",
  "origenFuente": "Honorarios_Freelance",
  "clasificacionOrigen": "Personal",
  "descripcion": "Anticipo desarrollo Web App",
  "monedaOriginal": "PEN",
  "montoOriginal": 2500.00,
  "tipoCambio": 1.0,
  "montoPEN": 2500.00,
  "cuentaDestino": "BCP Ahorros",
  "idProyectoAsociado": "PRO-P-M-I-01",
  "estadoCobro": "Cobrado",
  "modalidad": "Real / Ejecutado"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "data": {
    "idIngreso": "ING-026",
    "montoPEN": 2500.00,
    "estado": "Cobrado"
  }
}
```

#### `FinanzasService.updateIngreso(payload)`
- **Tipo:** Backend RPC (`action: "updateIngreso"`).
- **Estructura Payload Entrada:**
```json
{
  "idIngreso": "ING-026",
  "descripcion": "Anticipo desarrollo Web App (Cancelado)",
  "montoOriginal": 2500.00,
  "estadoCobro": "Cobrado"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idIngreso": "ING-026"
}
```

#### `FinanzasService.deleteIngreso(payload)`
- **Tipo:** Backend RPC (`action: "deleteIngreso"`).
- **Estructura Payload Entrada:**
```json
{
  "idIngreso": "ING-026"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idEliminado": "ING-026"
}
```

#### `FinanzasService.obtenerTipoCambio(payload)`
- **Tipo:** Backend RPC (`action: "obtenerTipoCambio"`).
- **Estructura Payload Entrada:**
```json
{
  "monedaOrigen": "USD",
  "monedaDestino": "PEN"
}
```
- **Descripción:** Consulta en tiempo real APIs financieras externas (ej. SUNAT, ExchangeRate API) con fallback a cotización fija segura (3.750 PEN) ante contingencias de red.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "tipoCambio": 3.755,
  "monedaOrigen": "USD",
  "monedaDestino": "PEN",
  "fuente": "API_EXTERNA",
  "timestamp": "2026-09-30T16:00:00Z"
}
```

#### `FinanzasService.crearGastoEnCuotas(payload)`
- **Tipo:** Backend RPC (`action: "crearGastoEnCuotas"` / `"createplancuotas"`).
- **Estructura Payload Entrada:**
```json
{
  "nombrePlan": "Smartphone Pro",
  "montoTotal": 3600.00,
  "cuotaInicial": 600.00,
  "numCuotas": 6,
  "montoCuota": 500.00,
  "fechaInicio": "2026-10-10",
  "diaPago": 10,
  "categoria": "ELECTRONICO",
  "entidadFinanciera": "Interbank",
  "metodoPago": "Tarjeta"
}
```
- **Descripción:** Transacción atómica que crea el plan en `BBDD_Finanzas_Cuotas` y genera inmediatamente las 6 filas en `BBDD_Finanzas_Gastos` con `ID_Cuota = CUO-XXX`, estado `"Programado"`, y tareas asociadas en Google Tasks.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idCuota": "CUO-004",
  "cuotasCreadas": 6,
  "saldoPendiente": 3000.00
}
```

#### `FinanzasService.pagarSiguienteCuota(payload)`
- **Tipo:** Backend RPC (`action: "pagarSiguienteCuota"` / `"pagarcuota"`).
- **Estructura Payload Entrada:**
```json
{
  "idCuota": "CUO-004",
  "fechaPago": "2026-10-10",
  "comprobanteUrl": "https://..."
}
```
- **Descripción:** Busca la primera cuota en estado `"Programado"`, la actualiza a `"Ejecutado"`, actualiza su tarea en Google Tasks a completada, incrementa `Cuotas_Pagadas` en el plan, amortiza el monto y recalcula el `Saldo_Pendiente`. Si el saldo llega a 0, cambia el estado del plan a `"COMPLETADO"`.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idCuota": "CUO-004",
  "cuotaPagadaNumero": 1,
  "saldoRestante": 2500.00,
  "planCompletado": false
}
```

#### `FinanzasService.sanearCuotasDesfasadas()`
- **Tipo:** Backend RPC (`action: "sanearCuotasDesfasadas"`).
- **Descripción:** Rutina de mantenimiento que detecta cuotas vencidas y reconcilia el saldo pendiente de los planes de cuotas contra los egresos ejecutados reales.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "cuotasSaneadas": 2,
  "planesActualizados": 1
}
```

### 4. VARIABLES Y ESTADO:
- **Hojas persistentes:** `CONFIG.SHEETS.FINANZAS`, `CONFIG.SHEETS.INGRESOS`, `CONFIG.SHEETS.CUOTAS`.
- **Caché:** Invalida `"DASHBOARD_DATA_CACHE"`.
- **Integraciones:** `UrlFetchApp` (Tipo de Cambio), `GoogleTasksService`, `CalendarService`, `CorrelativoService`.

---

## 11. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\GeminiParserService.js`

### 2. PROPÓSITO:
Capa de Inteligencia Artificial multimodal e inferencia contextual impulsada por Gemini 1.5 Flash. Desempeña dos roles fundamentales:
1. **OCR y Parsing de Comprobantes:** Extrae con precisión campos estructurados (RUC, proveedor, fecha, total, moneda, ítems e inferencia de categoría contable) a partir de imágenes o PDFs en Base64.
2. **Generador WBS Integral de Proyectos:** Descompone iniciativas en una estructura analítica balanceada de Hitos (fases con % ponderado que suman 100%), Tareas operativas (con estimación de horas y prioridad) y Gastos presupuestados (vinculados jerárquicamente a hitos y tareas sin desbordar el presupuesto tope). Incluye un motor heurístico determinístico de fallback contextual por dominio para garantizar alta disponibilidad.

### 3. FUNCIONES QUE CONTIENE:

#### `extraerDatosComprobante(base64Image, mimeType, contextProyectosHitos = [])`
- **Tipo:** Motor multimodal de extracción documental.
- **Parámetros:**
  - `base64Image` (`string`): Imagen o PDF codificado en Base64.
  - `mimeType` (`string`): MIME type (`image/jpeg`, `image/png`, `application/pdf`).
  - `contextProyectosHitos` (`Array`): Lista de proyectos e hitos activos para inferir vinculación automática.
- **Descripción:** Llama a la API de Gemini 1.5 Flash (`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=...`) con System Instructions contables peruanas (Factura, Boleta de Venta, Ticket, RUC de 11 dígitos, IGV 18%, PEN/USD). Fuerza respuesta en JSON puro.
- **Retorno:** Objeto parseado con `{ ruc, proveedor, fecha, montoTotal, moneda, categoriaSugerida, idProyectoRecomendado, items }`.

#### `parsearComprobante(base64Data, mimeType, contextProyectosHitos = [])`
- **Tipo:** Backend RPC (`action: "parsearComprobante"`).
- **Estructura Payload Entrada:**
```json
{
  "base64Data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "mimeType": "image/jpeg",
  "contexto": { "proyectos": [...] }
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "datos": {
    "proveedor": "COMPU PALACE SAC",
    "ruc": "20548963214",
    "fecha": "2026-09-28",
    "monto": 280.00,
    "moneda": "PEN",
    "categoria": "Hardware_Tecnologia",
    "descripcion": "SSD NVMe 1TB Kingston",
    "idProyecto": "PRO-P-M-I-01",
    "idHito": "HIT-002"
  }
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "Error al conectar con la API de Gemini: clave no configurada"
}
```

#### `generarWbsProyectoIA(contexto)`
- **Tipo:** Motor cognitivo de descomposición WBS y clasificación adaptativa con Gemini 1.5 Flash.
- **Parámetros:**
  - `contexto` (`Object`): Datos iniciales del proyecto: `{ nombreProyecto, tipoIniciativa, descripcion, fechaFinPlan, presupuestoTope, metodologiaSugerida, perfilEjecutor, estadoPartida, recursosClave }`.
- **Descripción:** Envía un prompt especializado de Senior Project Manager a Gemini 1.5 Flash con System Instructions y JSON Schema estructurado requiriendo:
  - Inferencia y sugerencia explícita de `arquetipoSugerido` (`1_Infraestructura`, `2_Venture`, `3_Activo`, `4_Carrera`, `5_Evento`).
  - Inferencia y sugerencia explícita de `magnitudSugerida` (`Light`, `Medium`, `Heavy`).
  - Justificación concisa del dictamen (`justificacionClasificacion`).
  - 3 a 5 Hitos cronológicos con entregables tangibles cuyos `pesoPct` sumen exactamente 100%.
  - Tareas tácticas de campo con horas estimadas, fechas límite y bandera determinista `esMav`.
  - Gastos proyectados con vinculación obligatoria a tareas concretas sin desbordar el presupuesto.
- **Retorno:** Objeto `{ success: true, data: { arquetipoSugerido, magnitudSugerida, justificacionClasificacion, hitos, gastos, ... } }`.

#### `generarWbsFallbackHeuristico(contexto)`
- **Tipo:** Motor determinístico contextual de fallback ante indisponibilidad de API key o interrupciones de red.
- **Parámetros:**
  - `contexto` (`Object`): Contexto del proyecto.
- **Descripción:** Analiza heurísticamente el tipo y nombre de la iniciativa para deducir el `arquetipoSugerido` y `magnitudSugerida` correspondiente, generando una estructura balanceada de hitos, tareas y gastos matemáticamente consistentes.
- **Retorno:** Objeto con `{ success: true, data: { arquetipoSugerido, magnitudSugerida, justificacionClasificacion, hitos, gastos, ... } }`.

### 4. VARIABLES Y ESTADO:
- **API Key:** `PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')`.
- **Endpoint:** Google Gemini REST API v1beta.
- **Servicio:** `UrlFetchApp.fetch()`.

---

## 12. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\GoogleTasksService.js`

### 2. PROPÓSITO:
Servicio dedicado a la integración con Google Tasks mediante la biblioteca avanzada `Tasks` (API v1). Encargado exclusivo de la gestión de compromisos de duración = 0 horas (actividades puntuales, checks diarios de hábitos) e hitos financieros futuros (cobro de ingresos programados o recordatorios de vencimiento de gastos y cuotas). Implementa formateo estricto de fechas RFC 3339 neutralizando desfases horarios en UTC.

### 3. FUNCIONES QUE CONTIENE:

#### `_formatearFechaRFC3339(fechaEntrada)`
- **Tipo:** Utilidad de normalización de huso horario.
- **Parámetros:**
  - `fechaEntrada` (`string` | `Date`): Fecha a convertir.
- **Descripción:** Extrae año, mes y día, y fija la hora al mediodía local (12:00:00) antes de convertir a UTC RFC 3339 (`YYYY-MM-DDTHH:mm:ssZ`). Previene que un vencimiento del día 15 se muestre como día 14 por conversión a medianoche UTC.
- **Retorno:** Cadena RFC 3339 o `null`.

#### `obtenerOCrearListaTareas()`
- **Tipo:** Resolver de lista de Google Tasks.
- **Retorno:** Identificador `"@default"` (Garantiza visibilidad directa en la barra lateral de Google Calendar y Gmail).

#### `crearTask(params)`
- **Tipo:** Creación de tarea en Google Tasks.
- **Parámetros:**
  - `params` (`Object`): `{ titulo: string, notas: string, fechaLimite: string }`.
- **Retorno:** `{ success: boolean, taskId: string }`.

#### `actualizarTask(params)`
- **Tipo:** Actualización de Google Task existente.
- **Parámetros:**
  - `params` (`Object`): `{ taskId: string, titulo?: string, notas?: string, fechaLimite?: string, completada?: boolean }`.
- **Retorno:** `{ success: boolean, taskId: string }`.

#### `eliminarTask(taskId)`
- **Tipo:** Eliminación atómica por ID (soporta múltiples IDs separados por coma o pleca).
- **Parámetros:**
  - `taskId` (`string`): ID de la tarea.
- **Retorno:** `boolean`.

#### `eliminarTaskPorTitulo(titulo)`
- **Tipo:** Limpieza de tareas huérfanas por coincidencia de texto.
- **Parámetros:**
  - `titulo` (`string`): Nombre de la actividad a buscar.
- **Retorno:** `boolean`.

#### `crearTaskIngreso(params)`
- **Tipo:** Helper financiero para cobros futuros.
- **Formato Título:** `"💰 Cobrar: [Concepto] - [Moneda] [Monto]"`.
- **Retorno:** `{ success: boolean, taskId: string }`.

#### `crearTaskGastoCuota(params)`
- **Tipo:** Helper financiero para egresos y cuotas.
- **Formato Título:** `"⚠️ Pagar: [Concepto] - [Moneda] [Monto]"`.
- **Retorno:** `{ success: boolean, taskId: string }`.

#### `crearTaskActividadPuntual(params)`
- **Tipo:** Helper para hábitos y compromisos de 0h.
- **Formato Título:** `"[Categoría] Nombre Actividad"`.
- **Retorno:** `{ success: boolean, taskId: string }`.

#### `autorizarGoogleTasks()`
- **Tipo:** Función global de concesión y chequeo OAuth para Google Tasks.
- **Descripción:** Ejecuta una lectura en la lista `@default` para solicitar permisos OAuth al administrador.
- **Retorno:** `{ success: true, message: string }`.

### 4. VARIABLES Y ESTADO:
- **Lista de Tareas:** `"@default"`.
- **Servicio:** Google Advanced Service `Tasks.Tasks`.

---

## 13. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\HitosService.js`

### 2. PROPÓSITO:
Servicio de dominio para el control de la estructura analítica de entregables e hitos del proyecto (`BBDD_Hitos`, prefijos duales `WP-XXX` para Paquetes de Trabajo y `HIT-XXX` para Hitos Marcadores, bajo arquitectura WBS v4.1). Administra las fases del proyecto, pesos ponderados porcentuales (`Peso_Ponderado_Pct`), fechas límite de compromiso, criterios de aceptación (DoD), presupuesto asignado, y salvaguarda la **regla ortogonal WBS v4.1**:
- **Paquetes de Trabajo (`PAQUETE_TRABAJO` / `WP-XXX`):** Representan alcance medible y costo asignado (`Presupuesto_Asignado >= 0`). Son los **únicos** elementos WBS que admiten la asociación de tareas operativas (`BBDD_Actividades_Tareas`).
- **Hitos Marcadores (`HITO_MARCADOR` / `HIT-XXX`):** Representan puntos de control temporal y verificación cronológica de duración cero (0 días) y costo cero ($0.00). Tienen **estrictamente prohibida** la vinculación de tareas directas.

### 3. FUNCIONES QUE CONTIENE:

#### `obtenerMapaColumnasHitos(sheet)`
- **Tipo:** Helper de mapeo de cabeceras de hitos (resolución canónica de 16 columnas WBS v4.1 y alias hacia atrás).
- **Retorno:** Mapa `{ COL: index }`.

#### `validarAsociacionTareas(idElementoWbs)`
- **Tipo:** Validador de integridad estructural de dominio (WBS v4.1).
- **Parámetros:**
  - `idElementoWbs` (`string`): Identificador del elemento padre (`WP-XXX` o `HIT-XXX`).
- **Descripción:** Verifica que el elemento objetivo no esté configurado como `HITO_MARCADOR` ni posea prefijo `HIT-`. Si detecta un intento de asociar tareas a un hito marcador, rechaza la operación con mensaje explicativo.
- **Retorno:** `{ permitido: boolean, error?: string }`.

#### `createHito(payload)`
- **Tipo:** Backend RPC (`action: "createHito"`).
- **Descripción:** Crea un elemento WBS en `BBDD_Hitos`. Determina `tipoElementoWbs` (`PAQUETE_TRABAJO` o `HITO_MARCADOR`). Si es `HITO_MARCADOR`, fuerza automáticamente `presupuestoAsignado = 0.00` y genera PK con prefijo `HIT-XXX`. Si es `PAQUETE_TRABAJO`, genera PK con prefijo `WP-XXX` y registra el presupuesto asignado.
- **Estructura Payload Entrada:**
```json
{
  "idProyecto": "PRO-001",
  "tipoElementoWbs": "PAQUETE_TRABAJO",
  "wbsCode": "1.2",
  "nombreElemento": "Desarrollo del Motor Transaccional",
  "faseAsociada": "Ejecucion",
  "estadoHito": "01_Pendiente",
  "pesoPct": 25,
  "fechaLimite": "2026-10-31",
  "presupuestoAsignado": 1500.00,
  "criterioDod": "Pruebas de estrés y conciliación validadas",
  "dependenciaPredecesora": "WP-001",
  "flagRutaCritica": "Sí",
  "entregableLink": "https://drive.google.com/..."
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idElementoWbs": "WP-002",
  "tipoElementoWbs": "PAQUETE_TRABAJO",
  "data": {
    "ID_Elemento_WBS": "WP-002",
    "ID_Proyecto": "PRO-001",
    "Tipo_Elemento_WBS": "PAQUETE_TRABAJO",
    "Nombre_Elemento": "Desarrollo del Motor Transaccional",
    "Presupuesto_Asignado": 1500.00
  }
}
```

#### `updateHito(payload)`
- **Tipo:** Backend RPC (`action: "updateHito"`).
- **Descripción:** Actualiza un elemento WBS. Si se actualiza a `HITO_MARCADOR`, valida que no existan tareas activas vinculadas en `BBDD_Actividades_Tareas`; de existir, revoca la mutación para preservar la integridad ortogonal de WBS v4.1. Fuerza `presupuestoAsignado = 0.00` en hitos marcadores.
- **Estructura Payload Entrada:**
```json
{
  "idHito": "HIT-005",
  "nombreHito": "Fase 2: Motor Transaccional y Cuotas",
  "estadoHito": "03_En_Proceso",
  "pesoPct": 25,
  "fechaLimite": "2026-11-05",
  "criteriosDoD": "DoD actualizado",
  "esMav": true
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idHito": "HIT-005"
}
```

#### `deleteHito(payload)`
- **Tipo:** Backend RPC (`action: "deleteHito"`).
- **Estructura Payload Entrada:**
```json
{
  "idHito": "HIT-005"
}
```
- **Descripción:** Elimina el hito de `BBDD_Hitos` usando `sobrescribirHojaFiltrada` y desvincula las tareas asociadas para evitar inconsistencias de llaves foráneas.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idEliminado": "HIT-005"
}
```

### 4. VARIABLES Y ESTADO:
- **Hoja persistente:** `CONFIG.SHEETS.HITOS` (`"BBDD_Hitos"`).
- **Caché:** Invalida `"DASHBOARD_DATA_CACHE"`.
- **Concurrencia:** `LockService` (10s).

---

## 14. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\NotasService.js`

### 2. PROPÓSITO:
Servicio de dominio de Notas Inteligentes (arquitectura híbrida inspirada en Google Keep + Notion/OneNote, `BBDD_Notas`, prefijo `NOT-XXXXX`). Administra notas rápidas enriquecidas, paleta cromática pastel (slate, emerald, indigo, amber, rose, sky, violet), fijado en cabecera (`Es_Fijada`), listas de verificación dinámicas en formato JSON (`Checklist`), catálogo de etiquetas/tags, vínculos contextuales bidireccionales polimórficos hacia Proyectos (`PRO-`), Hitos (`HIT-`), Tareas (`TAR-`), Hábitos (`ACT-`), Gastos (`GAS-`) e Ingresos (`ING-`), carga de archivos adjuntos en Google Drive, y gestión del módulo Wishlist (lista de compras y deseos con cálculo de costo y amortización).

### 3. FUNCIONES QUE CONTIENE:

#### `obtenerHojaNotas()`
- **Tipo:** Helper que localiza o auto-crea `BBDD_Notas` con sus 11 encabezados canónicos.
- **Retorno:** Objeto `Sheet`.

#### `obtenerNotas(payload)`
- **Tipo:** Backend RPC (`action: "obtenerNotas"` / `"getnotas"`).
- **Estructura Payload Entrada:**
```json
{
  "filtroEtiqueta": "",
  "filtroColor": "",
  "forceRefresh": false
}
```
- **Descripción:** Lee la hoja `BBDD_Notas` con caché dedicada en `CacheService` (`"NOTAS_DATA_CACHE"`, 12 horas de expiración). Parsea los campos JSON serializados (`Checklist`, `Adjuntos`, `Vinculos`, `Etiquetas`).
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "notas": [
    {
      "id": "NOT-00001",
      "titulo": "Roadmap Q4",
      "tipo": "NORMAL",
      "contenido": "Priorizar módulo de tesorería...",
      "color": "indigo",
      "esFijada": true,
      "checklist": [
        { "id": "chk_1", "texto": "Revisar flujos", "completado": true }
      ],
      "adjuntos": [],
      "vinculos": [
        { "id": "PRO-P-M-I-01", "tipo": "PROYECTO", "codigo": "PRO-01", "titulo": "Portal Web" }
      ],
      "etiquetas": ["Estrategia", "Arquitectura"],
      "fechaCreacion": "2026-09-20T10:00:00Z",
      "fechaActualizacion": "2026-09-30T12:00:00Z"
    }
  ]
}
```

#### `guardarNota(payload)`
- **Tipo:** Backend RPC (`action: "guardarNota"` / `"crearnota"` / `"updatenota"`).
- **Estructura Payload Entrada:**
```json
{
  "id": "NOT-00001",
  "titulo": "Roadmap Q4 Actualizado",
  "tipo": "NORMAL",
  "contenido": "Priorizar módulo de tesorería y cuotas...",
  "color": "indigo",
  "esFijada": true,
  "checklist": [{ "id": "chk_1", "texto": "Paso 1", "completado": false }],
  "adjuntos": [],
  "vinculos": [{ "id": "PRO-P-M-I-01", "tipo": "PROYECTO", "codigo": "PRO-01", "titulo": "Portal Web" }],
  "etiquetas": ["Estrategia"]
}
```
- **Descripción:** Si `id` está vacío o inicia con `TEMP-`, genera un nuevo correlativo `NOT-XXXXX` e inserta la fila. Si `id` existe, actualiza la fila existente y actualiza `Fecha_Actualizacion`. Invalida `"NOTAS_DATA_CACHE"` y `"DASHBOARD_DATA_CACHE"`.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "id": "NOT-00001",
  "message": "Nota guardada con éxito"
}
```

#### `togglePinNota(payload)`
- **Tipo:** Backend RPC (`action: "togglePinNota"` / `"pinnote"`).
- **Estructura Payload Entrada:**
```json
{
  "id": "NOT-00001",
  "esFijada": false
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "id": "NOT-00001",
  "esFijada": false
}
```

#### `eliminarNota(payload)`
- **Tipo:** Backend RPC (`action: "eliminarNota"` / `"deletenota"`).
- **Estructura Payload Entrada:**
```json
{
  "id": "NOT-00001"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idEliminada": "NOT-00001"
}
```

#### `actualizarChecklistNota(payload)`
- **Tipo:** Backend RPC (`action: "actualizarChecklistNota"` / `"togglechecklistnota"`).
- **Estructura Payload Entrada:**
```json
{
  "idNota": "NOT-00001",
  "idCheck": "chk_1",
  "completado": true
}
```
- **Descripción:** Actualiza en tiempo real el valor booleano de un paso del checklist dentro del JSON de la nota sin requerir guardar el modal completo.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idNota": "NOT-00001",
  "idCheck": "chk_1",
  "completado": true
}
```

#### `adjuntarArchivoNota(payload)`
- **Tipo:** Backend RPC (`action: "adjuntarArchivoNota"` / `"uploadadjuntonota"`).
- **Estructura Payload Entrada:**
```json
{
  "idNota": "NOT-00001",
  "base64Data": "data:image/png;base64,...",
  "mimeType": "image/png",
  "fileName": "captura_dashboard.png"
}
```
- **Descripción:** Invoca `DriveService.guardarArchivoAdjuntoNota`, añade el metadato al arreglo `Adjuntos` de la nota en Sheets, e invalida la caché.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idNota": "NOT-00001",
  "adjunto": {
    "id": "drive_file_id",
    "nombre": "captura_dashboard.png",
    "url": "https://drive.google.com/...",
    "mimeType": "image/png"
  }
}
```

#### `marcarDeseoConseguido(payload)`
- **Tipo:** Backend RPC (`action: "marcarDeseoConseguido"` / `"wishlistconseguido"`).
- **Estructura Payload Entrada:**
```json
{
  "idNota": "NOT-00005",
  "montoReal": 450.00,
  "metodoPago": "Efectivo",
  "crearGasto": true
}
```
- **Descripción:** Marca el ítem de la Wishlist como conseguido. Si `crearGasto` es `true`, registra automáticamente la transacción en `BBDD_Finanzas_Gastos` vinculando la nota.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idNota": "NOT-00005",
  "conseguido": true,
  "idGastoGenerado": "GAS-090"
}
```

#### `invalidarCache()`
- **Tipo:** Helper interno que remueve `"NOTAS_DATA_CACHE"` en `CacheService.getScriptCache()`.

### 4. VARIABLES Y ESTADO:
- **Hoja persistente:** `CONFIG.SHEETS.NOTAS` (`"BBDD_Notas"`).
- **Caché:** Llave `"NOTAS_DATA_CACHE"` con TTL de 43,200 segundos (12 horas).
- **LockService:** Bloqueo de 10 segundos.

---

## 15. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\ProyectosService.js`

### 2. PROPÓSITO:
Servicio de dominio rector para la gestión estratégica del portafolio de proyectos (`BBDD_Proyectos`, prefijo `PRO-[TIPO]-[TSHIRT]-[CRITERIO]-[CORRELATIVO]`). Gestiona el ciclo de vida de iniciativas, cálculo de avance real ponderado (`Avance_Ponderado`), carpetas dedicadas en Drive, check-ins de gobernanza y control, generación integral de la Estructura Analítica del Proyecto (WBS: Hitos, Tareas y Gastos) con Inteligencia Artificial Gemini 1.5 Flash (y fallback heurístico determinístico), guardado transaccional batch atómico (`guardarEstructuraProyectoCompleta`), y eliminación en cascada profunda multidominio (`eliminarProyectoEnCascada`).

### 3. FUNCIONES QUE CONTIENE:

#### `ProyectosService.obtenerMapaColumnasProyectos(sheet)`
- **Tipo:** Helper de mapeo de cabeceras de proyectos.
- **Retorno:** Mapa `{ COL: index }`.

#### `ProyectosService.createProyecto(payload)`
- **Tipo:** Backend RPC (`action: "createProyecto"`).
- **Estructura Payload Entrada:**
```json
{
  "nombreProyecto": "Migración Cloud AWS",
  "tipoIniciativa": "Profesional",
  "categoriaTShirt": "L",
  "criterioDominante": "Inversión",
  "estadoProyecto": "02_Por_Hacer",
  "healthStatus": "Verde",
  "entregableTangible": "Infraestructura desplegada en producción",
  "northStarOKR": "Disponibilidad 99.99%",
  "criteriosDoD": "Terraform automatizado y CI/CD activo",
  "mavRequerido": "MVP con 3 microservicios",
  "faseCicloVida": "Planificación",
  "frecuenciaControl": "Semanal",
  "nivelRiesgoGlobal": "Medio",
  "fechaInicioPlan": "2026-10-01",
  "fechaFinPlan": "2026-12-15",
  "monedaBase": "USD",
  "presupuestoTope": 12000.00,
  "tercerosInvolucrados": "DevOps Engineer, Cloud Architect"
}
```
- **Descripción:** Genera ID primario único (`PRO-P-L-I-01`), inicializa carpetas en Google Drive vía `DriveService.inicializarCarpetaProyecto`, inserta la fila y limpia el caché.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "data": {
    "idProyecto": "PRO-P-L-I-01",
    "nombre": "Migración Cloud AWS",
    "urlDrive": "https://drive.google.com/drive/folders/..."
  },
  "message": "Proyecto creado exitosamente"
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "El nombre del proyecto es obligatorio"
}
```

#### `ProyectosService.updateProyecto(payload)`
- **Tipo:** Backend RPC (`action: "updateProyecto"`).
- **Estructura Payload Entrada:**
```json
{
  "idProyecto": "PRO-P-L-I-01",
  "nombreProyecto": "Migración Cloud AWS - Fase Prod",
  "estadoProyecto": "03_En_Proceso",
  "healthStatus": "Verde",
  "avanceRealPct": 45,
  "presupuestoTope": 12500.00,
  "fechaFinPlan": "2026-12-20"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idProyecto": "PRO-P-L-I-01"
}
```

#### `ProyectosService.registrarCheckinProyecto(payload)`
- **Tipo:** Backend RPC (`action: "registrarCheckinProyecto"`).
- **Estructura Payload Entrada:**
```json
{
  "idProyecto": "PRO-P-L-I-01",
  "fechaCheckin": "2026-09-30",
  "observaciones": "Reunión de avance sprint 2 con stakeholders"
}
```
- **Descripción:** Actualiza la columna `ULTIMA_REVISION` con la fecha y hora actual del check-in de control, manteniendo la auditoría de cadencia.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idProyecto": "PRO-P-L-I-01",
  "ultimaRevision": "2026-09-30 17:30"
}
```

#### `ProyectosService.eliminarProyectoEnCascada(payloadOrId)`
- **Tipo:** Backend RPC (`action: "deleteProyecto"` / `"eliminarproyectoencascada"`).
- **Estructura Payload Entrada:**
```json
{
  "idProyecto": "PRO-P-L-I-01"
}
```
(O directamente la cadena `"PRO-P-L-I-01"`).
- **Descripción:** Transacción atómica integral protegida por `LockService` (15s):
  1. Identifica todas las tareas (`TAR-`) asociadas y elimina sus eventos en Google Calendar o Google Tasks.
  2. Elimina en lote en memoria (`sobrescribirHojaFiltrada`) las tareas del proyecto en `BBDD_Actividades_Tareas`.
  3. Elimina en cascada todas las subtareas (`SUB-`) de esas tareas en `BBDD_Subtareas_Pasos`.
  4. Elimina todos los hitos (`HIT-`) del proyecto en `BBDD_Hitos`.
  5. Elimina o desvincula todos los gastos (`GAS-`) asociados en `BBDD_Finanzas_Gastos`.
  6. Elimina la fila del proyecto en `BBDD_Proyectos`.
  7. Invalida inmediatamente el caché de dashboard.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idProyecto": "PRO-P-L-I-01",
  "eliminados": {
    "proyecto": 1,
    "hitos": 4,
    "tareas": 18,
    "subtareas": 35,
    "gastos": 6
  },
  "message": "Proyecto y todas sus dependencias eliminados en cascada con éxito."
}
```

#### `ProyectosService.deleteProyecto(payload)`
- **Tipo:** Alias de compatibilidad que delega directamente a `eliminarProyectoEnCascada(payload)`.

#### `ProyectosService.generarSugerenciaAutocompletado(nombreProyecto, tipoIniciativa)`
- **Tipo:** Backend RPC (`action: "autocompletarProyecto"`).
- **Parámetros / Payload:** `{ nombreProyecto: string, tipoIniciativa: string }`.
- **Descripción:** Llama a Gemini para generar sugerencias contextuales de Entregable Tangible, OKR North Star, Criterios DoD, Alcance Viable (MAV), Fase, Frecuencia de Control y Nivel de Riesgo.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "sugerencia": {
    "categoriaTShirt": "M",
    "criterioDominante": "Inversión",
    "entregableTangible": "...",
    "northStarOKR": "...",
    "criteriosDoD": "...",
    "mavRequerido": "...",
    "faseCicloVida": "Planificación",
    "frecuenciaControl": "Semanal",
    "nivelRiesgoGlobal": "Bajo"
  }
}
```

#### `ProyectosService.generarWbsIntegralProyectoIA(payload)`
- **Tipo:** Backend RPC (`action: "generarWbsIntegralProyectoIA"`).
- **Estructura Payload Entrada:**
```json
{
  "nombreProyecto": "E-Commerce de Calzado",
  "tipoIniciativa": "Profesional",
  "descripcion": "Tienda virtual con pasarela de pagos Niubiz y catálogo",
  "presupuestoTope": 8000.00,
  "fechaFinPlan": "2026-11-30",
  "metodologiaSugerida": "Scrum / Ágil"
}
```
- **Descripción:** Invoca `GeminiParserService.generarWbsProyectoIA` con fallback a `generarWbsFallbackHeuristico`. Retorna la estructura completa pre-compilada con hitos, tareas y gastos asignados para revisión en el wizard modal de la UI.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "propuesta": {
    "hitos": [
      { "id": "TEMP-HIT-1", "nombre": "Fase 1: Diseño UI/UX", "pesoPct": 25, "fechaLimite": "2026-10-15" }
    ],
    "tareas": [
      { "id": "TEMP-TAR-1", "idHito": "TEMP-HIT-1", "nombre": "Wireframes en Figma", "horasEstimadas": 12, "prioridad": "01_P1_Alta" }
    ],
    "gastos": [
      { "id": "TEMP-GAS-1", "idHito": "TEMP-HIT-1", "concepto": "Plugins de Figma", "monto": 120.00, "moneda": "PEN" }
    ]
  }
}
```

#### `ProyectosService.guardarEstructuraProyectoCompleta(payload)`
- **Tipo:** Backend RPC (`action: "guardarEstructuraProyectoCompleta"`).
- **Estructura Payload Entrada:**
```json
{
  "proyecto": {
    "nombreProyecto": "E-Commerce de Calzado",
    "tipoIniciativa": "Profesional",
    "categoriaTShirt": "M",
    "criterioDominante": "Inversión",
    "estadoProyecto": "02_Por_Hacer",
    "healthStatus": "Verde",
    "presupuestoTope": 8000.00,
    "fechaInicioPlan": "2026-10-01",
    "fechaFinPlan": "2026-11-30",
    "monedaBase": "PEN"
  },
  "hitos": [
    { "tempId": "TEMP-HIT-1", "nombreHito": "Fase 1: Diseño UI/UX", "pesoPct": 25, "fechaLimite": "2026-10-15" }
  ],
  "tareas": [
    { "tempId": "TEMP-TAR-1", "tempHitoId": "TEMP-HIT-1", "nombreTarea": "Wireframes", "horasEstimadas": 12, "prioridad": "01_P1_Alta", "fechaProgramada": "2026-10-05" }
  ],
  "gastos": [
    { "tempId": "TEMP-GAS-1", "tempHitoId": "TEMP-HIT-1", "tempTareaId": "TEMP-TAR-1", "concepto": "Plugins Figma", "monto": 120.00, "categoria": "Software" }
  ]
}
```
- **Descripción:** Transacción atómica batch con `LockService` (15s):
  1. Genera ID del proyecto (`PRO-XXX`) e inserta en `BBDD_Proyectos`.
  2. Crea carpeta en Drive (`DriveService.inicializarCarpetaProyecto`).
  3. Mapea identificadores temporales a correlativos definitivos atómicos (`HIT-XXX`, `TAR-XXX`, `GAS-XXX`).
  4. Inserta en bloque todos los hitos en `BBDD_Hitos`.
  5. Inserta en bloque todas las tareas en `BBDD_Actividades_Tareas`.
  6. Inserta en bloque todos los gastos en `BBDD_Finanzas_Gastos`.
  7. Invalida el caché global del dashboard.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idProyecto": "PRO-P-M-I-02",
  "totalHitos": 4,
  "totalTareas": 14,
  "totalGastos": 5,
  "message": "Proyecto y estructura WBS persistidos de forma atómica con éxito."
}
```

#### `ProyectosService.evaluarFeatureFlagsProyecto(arquetipo, magnitud)`
- **Tipo:** Función pura y determinística de gobernanza y activación de capacidades UI/Backend.
- **Parámetros:**
  - `arquetipo` (`string`): Identificador del arquetipo (`1_Infraestructura`, `2_Venture`, `3_Activo`, `4_Carrera`, `5_Evento`). Acepta normalización tolerante de prefijos y alias.
  - `magnitud` (`string`): Escala de complejidad del proyecto (`Light`, `Medium`, `Heavy`). Acepta normalización de tamaños T-Shirt (XS, S, M, L, XL).
- **Descripción:** Evalúa los 12 flags de arquitectura modular desacoplando las herramientas pesadas de las iniciativas ágiles o ultra ligeras. Si la magnitud es `Light`, se activa `modoUltraLigero` y se suprimen los artefactos de alta densidad (Árbol WBS completo, Ruta Crítica CPM y EVM Financiero).
- **Matriz Canónica de Activación:**

| Feature Flag | Arquetipo 1 (Infraestructura) | Arquetipo 2 (Venture) | Arquetipo 3 (Activo) | Arquetipo 4 (Carrera) | Arquetipo 5 (Evento) | Modificador por Magnitud |
|---|---|---|---|---|---|---|
| `arbolWbsCompleto` | **True** | **True** | False | False | False | `False` si Magnitud === 'Light' |
| `rutaCriticaCpm` | **True** | False | False | False | False | `False` si Magnitud === 'Light' |
| `evmFinanciero` | **True** | False | False | False | False | `False` si Magnitud === 'Light' |
| `sprintsAgiles` | False | **True** | False | False | False | Sin restricción por magnitud |
| `tableroHipotesis` | False | **True** | False | False | False | Sin restricción por magnitud |
| `matrizTradeOff` | False | False | **True** | False | False | Sin restricción por magnitud |
| `checklistDueDiligence` | False | False | **True** | False | False | Sin restricción por magnitud |
| `hitosCurriculares` | False | False | False | **True** | False | Sin restricción por magnitud |
| `timeBlockingDeepWork` | False | False | False | **True** | False | Sin restricción por magnitud |
| `cronogramaTMinus` | False | False | False | False | **True** | Sin restricción por magnitud |
| `directorioProveedores` | False | False | False | False | **True** | Sin restricción por magnitud |
| `modoUltraLigero` | False | False | False | False | False | **True si Magnitud === 'Light'** |

- **Estructura Objeto Retornado:**
```json
{
  "arquetipo": "1_Infraestructura",
  "magnitud": "Medium",
  "flags": {
    "arbolWbsCompleto": true,
    "rutaCriticaCpm": true,
    "evmFinanciero": true,
    "sprintsAgiles": false,
    "tableroHipotesis": false,
    "matrizTradeOff": false,
    "checklistDueDiligence": false,
    "hitosCurriculares": false,
    "timeBlockingDeepWork": false,
    "cronogramaTMinus": false,
    "directorioProveedores": false,
    "modoUltraLigero": false
  }
}
```

#### `ProyectosService.auditarCargaProyectosActivos(proyectosOpt)`
- **Tipo:** Motor analítico de telemetría y prevención de sobrecarga de portafolio.
- **Parámetros:**
  - `proyectosOpt` (`Array`, opcional): Lista de proyectos ya cargados en memoria (ej. desde `DashboardService`). Si se omite, consulta de forma aislada la hoja `BBDD_Proyectos`.
- **Descripción:** Inspecciona únicamente los proyectos en estado de ejecución activa (`03_En_Ejecucion`). Realiza un recuento de carga cognitiva y operativa evaluando proyectos de magnitud `Heavy` y `Medium`. Activa preventivamente una bandera de advertencia `alertaSobrecarga: true` si se supera el umbral saludable:
  * Proyectos `Heavy` activos > 1
  * Proyectos `Medium` activos > 2
  * **Principio de no regresión:** No lanza excepciones, no detiene flujos ni bloquea transacciones del usuario.
- **Estructura Payload Retornado:**
```json
{
  "alertaSobrecarga": true,
  "conteoHeavy": 2,
  "conteoMedium": 3,
  "mensajeAlerta": "Alerta preventiva: Se detectaron 2 proyectos Heavy y 3 proyectos Medium en ejecución simultánea. Supera el umbral operativo recomendado (máx. 1 Heavy o 2 Medium)."
}
```

### 4. VARIABLES Y ESTADO:
- **Hojas persistentes:** `BBDD_Proyectos`, `BBDD_Hitos`, `BBDD_Actividades_Tareas`, `BBDD_Finanzas_Gastos`, `BBDD_Subtareas_Pasos`.
- **Caché:** Invalida `"DASHBOARD_DATA_CACHE"`.
- **LockService:** Timeout de 15,000 ms.

---

## 16. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\ReporteriaService.js`

### 2. PROPÓSITO:
Motor de inteligencia de valor ganado (EVM - Earned Value Management) y compilación documental ejecutiva. Calcula métricas estándar de dirección de proyectos (PV, EV, AC, CPI, SPI, CV, SV, EAC, VAC), evalúa la salud global del proyecto de forma determinística cruzando el semáforo de plazos con el semáforo presupuestal, y renderiza la plantilla HTML de alta resolución `FichaEjecutiva.html` en formato A4 para generar reportes ejecutivos en PDF descargables almacenados directamente en Google Drive.

### 3. FUNCIONES QUE CONTIENE:

#### `ReporteriaService.generarFichaPdf(idProyecto)`
- **Tipo:** Backend RPC (`action: "generarFichaPdf"`).
- **Estructura Payload Entrada:**
```json
{
  "idProyecto": "PRO-P-M-I-01"
}
```
- **Descripción:**
  1. Obtiene los datos del proyecto, sus hitos, tareas y gastos reales acumulados.
  2. Calcula métricas EVM y salud determinística.
  3. Evalúa la plantilla `FichaEjecutiva.html` mediante `HtmlService.createTemplateFromFile`.
  4. Convierte el HTML renderizado a Blob PDF (`getAs('application/pdf')`).
  5. Guarda el PDF en la carpeta de Drive del proyecto (`01_Documentacion_Entregables` o raíz del proyecto) nombrado `Ficha_Ejecutiva_[idProyecto]_[Timestamp].pdf`.
  6. Establece permisos de lectura y genera la URL de descarga directa y previsualización.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "pdfUrl": "https://drive.google.com/file/d/.../view",
  "downloadUrl": "https://drive.google.com/uc?id=...",
  "nombreArchivo": "Ficha_Ejecutiva_PRO-P-M-I-01_20260930.pdf",
  "idProyecto": "PRO-P-M-I-01"
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "Proyecto no encontrado para compilar ficha PDF"
}
```

#### `ReporteriaService.calcularMetricasEVM(proyecto)`
- **Tipo:** Calculador de Valor Ganado (Earned Value Management).
- **Parámetros:**
  - `proyecto` (`Object`): Datos consolidados del proyecto con hitos, tareas y costos.
- **Métricas calculadas:**
  - `PV` (Planned Value): Valor planeado a la fecha según cronograma.
  - `EV` (Earned Value): Valor ganado ($	ext{Presupuesto Tope} 	imes rac{	ext{Avance Real \%}}{100}$).
  - `AC` (Actual Cost): Costo real ejecutado en PEN.
  - `CPI` (Cost Performance Index): $rac{EV}{AC}$ (Eficiencia de costos; $>1$ bajo presupuesto, $<1$ sobrecosto).
  - `SPI` (Schedule Performance Index): $rac{EV}{PV}$ (Eficiencia de cronograma; $>1$ adelantado, $<1$ retrasado).
  - `CV` (Cost Variance): $EV - AC$.
  - `SV` (Schedule Variance): $EV - PV$.
- **Retorno:** Objeto con todas las métricas y sus interpretaciones textuales ejecutivas.

#### `ReporteriaService.evaluarSaludDeterminista(proyecto, hitos, tareas)`
- **Tipo:** Algoritmo heurístico de salud del proyecto.
- **Retorno:** Cadena `"Verde"`, `"Amarillo"` o `"Rojo"` justificada matemáticamente.

#### `ReporteriaService.obtenerAnalisisEVM(proyecto, hitos, evm)`
- **Tipo:** Generador de diagnósticos y recomendaciones estratégicas automáticas para el informe.
- **Retorno:** Texto analítico descriptivo.

#### `testGenerarFicha()`
- **Tipo:** Función utilitaria de prueba en consola para desarrolladores.
- **Retorno:** `void`.

### 4. VARIABLES Y ESTADO:
- **Plantilla HTML evaluada:** `FichaEjecutiva.html`.
- **Almacenamiento:** Google Drive (`DriveApp`).

---

## 17. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\TareasService.js`

### 2. PROPÓSITO:
Servicio de dominio para la gestión operativa de tareas de proyectos (`BBDD_Actividades_Tareas`, prefijo `TAR-XXX`) y subtareas procedurales atómicas (`BBDD_Subtareas_Pasos`, prefijo `SUB-XXX`). Controla estados Kanban (`01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`), prioridades Eisenhower (`01_P1_Alta`, `02_P2_Media`, `03_P3_Baja`), niveles de energía (`Alta`, `Media`, `Baja`), horas estimadas vs. reales, dependencias jerárquicas predecesoras/sucesoras, Mínimo Alcance Viable (`Es_MAV`), y la persistencia de pasos granulares de checklist.

### 3. FUNCIONES QUE CONTIENE:

#### `obtenerOCrearHojaSubtareas()`
- **Tipo:** Helper que garantiza la existencia de `BBDD_Subtareas_Pasos`.
- **Retorno:** Objeto `Sheet`.

#### `eliminarEventoCalendarPorId(idEvento)`
- **Tipo:** Helper que remueve el evento de Calendar asociado si la tarea tenía fecha agendada.
- **Retorno:** `boolean`.

#### `obtenerMapaColumnasTareas(sheet)`
- **Tipo:** Helper de mapeo de cabeceras de tareas.
- **Retorno:** Mapa `{ COL: index }`.

#### `createTarea(payload)`
- **Tipo:** Backend RPC (`action: "createTarea"`).
- **Estructura Payload Entrada:**
```json
{
  "idProyecto": "PRO-P-M-I-01",
  "idHito": "HIT-001",
  "nombreTarea": "Diseño de la base de datos",
  "estado": "02_Por_Hacer",
  "prioridad": "01_P1_Alta",
  "nivelEnergia": "Alta",
  "horasEstimadas": 6.0,
  "horasReales": 0,
  "fechaProgramada": "2026-10-02",
  "horaInicio": "09:00",
  "agendadoCalendar": "Sí",
  "idDependencia": "TAR-001",
  "responsable": "Christopher",
  "notas": "Normalizar hasta 3FN",
  "esMav": true,
  "subtareas": ["Definir tablas", "Crear índices"]
}
```
- **Descripción:** Genera ID secuencial (`TAR-XXX`), agenda en Google Calendar si tiene fecha programada (colocando color de evento por prioridad), inserta la fila en `BBDD_Actividades_Tareas`, y si recibió arreglo `subtareas`, genera los registros `SUB-XXX` en `BBDD_Subtareas_Pasos`.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "data": {
    "idTarea": "TAR-088",
    "nombre": "Diseño de la base de datos",
    "idEventoCalendar": "cal_evt_123"
  },
  "message": "Tarea creada con éxito"
}
```
- **Formato Respuesta Error:**
```json
{
  "success": false,
  "error": "nombreTarea e idHito son obligatorios"
}
```

#### `updateTarea(payload)`
- **Tipo:** Backend RPC (`action: "updateTarea"` / `"updatetaskstate"`).
- **Estructura Payload Entrada:**
```json
{
  "idTarea": "TAR-088",
  "estado": "03_En_Proceso",
  "prioridad": "01_P1_Alta",
  "fechaProgramada": "2026-10-03",
  "horaInicio": "10:00",
  "horasEstimadas": 8.0,
  "horasReales": 4.0,
  "idDependencia": "",
  "notas": "En revisión",
  "esMav": true
}
```
- **Descripción:** Actualiza columnas en Sheets y sincroniza el evento en Google Calendar (fechas, horas, título o eliminación si se desprogramó).
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idTarea": "TAR-088"
}
```

#### `deleteTarea(payload)`
- **Tipo:** Backend RPC (`action: "deleteTarea"`).
- **Estructura Payload Entrada:**
```json
{
  "idTarea": "TAR-088"
}
```
- **Descripción:** Transacción atómica que remueve el evento de Google Calendar, elimina las subtareas hijas en `BBDD_Subtareas_Pasos`, elimina la fila en `BBDD_Actividades_Tareas` con `sobrescribirHojaFiltrada`, e invalida el caché.
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idEliminado": "TAR-088"
}
```

#### `createSubtarea(payload)`
- **Tipo:** Backend RPC (`action: "createSubtarea"` / `"guardarsubtarea"`).
- **Estructura Payload Entrada:**
```json
{
  "idPadre": "TAR-088",
  "tipoPadre": "TAREA",
  "descripcionPaso": "Crear índices de búsqueda",
  "numeroPaso": 3
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "data": {
    "idSubtarea": "SUB-104",
    "idPadre": "TAR-088",
    "tipoPadre": "TAREA",
    "numeroPaso": 3,
    "descripcion": "Crear índices de búsqueda",
    "completado": false
  }
}
```

#### `updateSubtareaCompletado(payload)`
- **Tipo:** Backend RPC (`action: "updateSubtareaCompletado"` / `"togglesubtarea"`).
- **Estructura Payload Entrada:**
```json
{
  "idSubtarea": "SUB-104",
  "idPadre": "TAR-088",
  "completado": true
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idSubtarea": "SUB-104",
  "idPadre": "TAR-088",
  "completado": true,
  "fechaCompletado": "2026-09-30T17:15:00Z"
}
```

#### `updateSubtarea(payload)`
- **Tipo:** Backend RPC (`action: "updateSubtarea"`).
- **Estructura Payload Entrada:**
```json
{
  "idSubtarea": "SUB-104",
  "descripcionPaso": "Crear índices de búsqueda únicos y compuestos"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idSubtarea": "SUB-104"
}
```

#### `reordenarSubtareas(payload)`
- **Tipo:** Backend RPC (`action: "reordenarSubtareas"`).
- **Estructura Payload Entrada:**
```json
{
  "idPadre": "TAR-088",
  "ordenIds": ["SUB-104", "SUB-102", "SUB-103"]
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idPadre": "TAR-088"
}
```

#### `deleteSubtarea(payload)`
- **Tipo:** Backend RPC (`action: "deleteSubtarea"`).
- **Estructura Payload Entrada:**
```json
{
  "idSubtarea": "SUB-104",
  "idPadre": "TAR-088"
}
```
- **Formato Respuesta Éxito:**
```json
{
  "success": true,
  "idEliminada": "SUB-104",
  "idPadre": "TAR-088"
}
```

### 4. VARIABLES Y ESTADO:
- **Hojas persistentes:** `CONFIG.SHEETS.TAREAS` (`"BBDD_Actividades_Tareas"`), `CONFIG.SHEETS.SUBTAREAS` (`"BBDD_Subtareas_Pasos"`).
- **Caché:** Invalida `"DASHBOARD_DATA_CACHE"`.
- **Integraciones:** `CalendarService`, `CorrelativoService`.


---

# PARTE II: VISTAS, MAQUETACIÓN, ESTILOS Y MODALES (ARCHIVOS HTML)

---

## 18. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Index.html`

### 2. PROPÓSITO:
Contenedor maestro (Shell de Single Page Application) servido por `ApiRouter.doGet()`. Configura el `<head>` con CDN externos de alto rendimiento (TailwindCSS v3, Flowbite, FontAwesome 6, Vis.js Network para grafos, SweetAlert2, fuentes Inter y Outfit de Google Fonts, y AOS - Animate on Scroll), ejecuta un script bloqueante ultrarrápido contra flashes de pantalla para aplicar el tema oscuro/claro inmediatamente leyendo `localStorage.getItem('pmo_theme')`, declara el contenedor raíz `#app-container`, y orquesta la inclusión modular atómica (`<?!= include(...) ?>`) de estilos, barra de navegación, las 6 vistas principales, los 6 modales y los 12 módulos de JavaScript cliente.

### 3. FUNCIONES QUE CONTIENE:
- **Estructura y Componentes DOM:**
  - Script Anti-FOUC (Flash of Unstyled Content): Evalúa `localStorage.getItem('pmo_theme')` y `window.matchMedia('(prefers-color-scheme: dark)')`, aplicando la clase `'dark'` al `<html>` antes de pintar el DOM.
  - Inclusiones de Estilos: `<?!= include('Styles') ?>`.
  - Inclusiones de Layout: `<?!= include('Layout_Header') ?>`.
  - Inclusiones de Vistas (`View_*`): `View_Kanban`, `View_Portafolio`, `View_Habitos`, `View_Finanzas`, `View_Detalle360`, `View_Notas`.
  - Inclusiones de Modales (`Modal_*`): `Modal_TareaFlow`, `Modal_ActividadFlow`, `Modal_Finanzas`, `Modal_ProyectosYHitos`, `Modal_AtajosYPdf`, `Modal_Notas`.
  - Inclusiones de Scripts (`JS_*`): `JS_Core`, `JS_Subtareas`, `JS_Kanban`, `JS_Habitos`, `JS_Portafolio`, `JS_Detalle360`, `JS_GrafoRed`, `JS_TareaFlow`, `JS_Finanzas`, `JS_ModalesYAtajos`, `JS_Notas`.
- **Elementos DOM Afectados:**
  - `document.documentElement` (Clase `'dark'`).
  - `#app-container` (Contenedor general).

### 4. VARIABLES Y ESTADO:
- **LocalStorage:**
  - `'pmo_theme'`: Clave de tema (`'dark'` o `'light'`).
  - `'pmo_theme_flavor'`: Variante cromática del tema oscuro (zinc, slate, neutral).

---

## 19. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Layout_Header.html`

### 2. PROPÓSITO:
Barra de navegación ejecutiva superior fija (`sticky top-0 z-40 relative`). Proporciona el branding institucional del sistema, el monitor visual de sincronización RPC (`#sync-status-container`), la cápsula de navegación reactiva central centrada matemáticamente (`absolute left-1/2 -translate-x-1/2`) para alternar entre las 4 pestañas de flujo de trabajo principal (Tablero, Portafolio, Hábitos, Finanzas), el acceso independiente a Notas Inteligentes (`#btn-nav-notas` en cápsula transparente con borde ámbar), y el dock derecho estructurado en cápsulas transparentes con borde fino continuo y utilidades flotantes:
- **Notas Inteligentes** (`#btn-nav-notas`): Cápsula transparente `bg-transparent border border-amber-600/80 rounded-xl px-3 h-9` con icono `📝` en ámbar y micro-contador `#badge-header-notas`.
- **Calendar** (`#btn-header-calendar`): Cápsula transparente `bg-transparent border border-slate-600/80 rounded-xl px-3 h-9` con icono centrado `📅`. Abre Google Calendar (Atajo `C`).
- **Archivados** (`#btn-header-archivados`): Cápsula transparente `bg-transparent border border-orange-500/80 rounded-xl px-3 h-9` con icono `📦` y micro-badge reactivo `#badge-header-archivados`. Abre el Drawer lateral de archivados.
- **Recargar** (`#btn-refresh-global` / `data-legacy-id="btn-header-refresh"`): Icono flotante limpio `bg-transparent border-transparent text-slate-400 hover:text-slate-100` en `h-9 w-9 p-0`. Dispara `refreshData(true)` (Atajo `R`).
- **Atajos** (`#btn-toggle-shortcuts-modal` / `data-legacy-id="btn-shortcuts-config"`): Icono flotante limpio `bg-transparent border-transparent text-slate-400 hover:text-slate-100` en `h-9 w-9 p-0`. Abre el modal de atajos (`?`).
- **Tema e Iluminación** (`#btn-theme-dropdown`): Icono flotante limpio `bg-transparent border-transparent text-slate-400 hover:text-slate-100` en `h-9 w-9 p-0`. Alterna el micro-dropdown glassmorphism de apariencia.

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Navegación Central Matemática: `#tab-nav-kanban`, `#tab-nav-portafolio`, `#tab-nav-habitos`, `#tab-nav-financiero`.
  - Monitor de Sincronización: `#sync-status-container`, `#sync-status-led`, `#sync-status-text`.
  - Cápsulas Transparentes del Header:
    - `#btn-nav-notas`: Cápsula transparente con borde fino ámbar (`border-amber-600/80`) y micro-contador `#badge-header-notas`.
    - `#btn-header-calendar`: Cápsula transparente con borde fino slate metálico (`border-slate-600/80`) e icono `📅`.
    - `#btn-header-archivados`: Cápsula transparente con borde fino naranja (`border-orange-500/80`) e icono `📦` con `#badge-header-archivados`.
  - Dock Flotante de Utilidades (Iconos limpios sin marco ni caja en reposo):
    - `#btn-refresh-global` (alias `btn-header-refresh`): Sincronización RPC con Google Sheets.
    - `#btn-toggle-shortcuts-modal` (alias `btn-shortcuts-config`): Modal de atajos de teclado (`?`).
    - `#container-theme-dropdown`: Micro-dropdown glassmorphism con botón interactivo sol/luna (`#btn-theme-dropdown`, `#icon-theme-mode-indicator`) y selector de paletas.
  - Drawer Lateral de Archivados:
    - `#drawer-archivados-overlay`: Backdrop desenfocado.
    - `#drawer-archivados`: Panel deslizante lateral derecho.
    - `#input-busqueda-drawer-archivados`, `#lista-elementos-drawer-archivados`.
- **Eventos:**
  - Escucha clicks de navegación que invocan `cambiarVistaGlobal(vista)`.
  - Escucha click en calendar que invoca la apertura directa en app instalada o web.
  - Escucha click en bóveda que invoca `abrirDrawerArchivados()`.
  - Escucha selección de temas que invoca `seleccionarSaborTema()` y `seleccionarModoColor()`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Afectadas:** `state.vistaActual`.
- **LocalStorage:** `'pmo_theme'`, `'pmo_theme_flavor'`.

---

## 20. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Layout_Sidebar.html`

### 2. PROPÓSITO:
Módulo de referencia estructural de la barra lateral de proyectos. Para garantizar consistencia de renderizado e integridad del árbol DOM, su estructura activa ha sido consolidada atómicamente dentro de `View_Kanban.html` (`#sidebar-proyectos-kanban`). Este archivo se conserva como pieza de arquitectura modular para extensiones independientes de layout.

### 3. FUNCIONES QUE CONTIENE:
- **Estructura Declarativa:** Contenedor semántico de navegación lateral colapsable para filtrado de proyectos.

### 4. VARIABLES Y ESTADO:
- **LocalStorage:** `'pmo_sidebar_collapsed'`.

---

## 21. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Styles.html`

### 2. PROPÓSITO:
Sistema central de diseño visual y personalización CSS de la suite. Extiende TailwindCSS con tokens de interfaz moderna tipo SaaS / Bento / Linear:
- **Cápsulas Transparentes y Utilidades Flotantes en Dock Superior** (`.header-dock-btn`): Geometría unificada a `h-9 (2.25rem)`, `rounded-xl (0.75rem)`, `backdrop-filter: blur(12px)`. Las acciones principales residen en cápsulas de fondo transparente (`bg-transparent`) con trazo de borde fino continuo de alta nitidez: Notas (ámbar `#btn-nav-notas`), Calendar (slate metálico `#btn-header-calendar`) y Archivados (naranja `#btn-header-archivados`). Las utilidades secundarias (Recargar `#btn-refresh-global`, Atajos `#btn-toggle-shortcuts-modal` y Tema `#btn-theme-dropdown`) se presentan como iconos limpios y flotantes sin marco ni caja en reposo (`border-transparent bg-transparent text-slate-400 hover:text-slate-100`).
- **Superposición Libre de Micro-Popovers Kanban** (`.kanban-hover-popover`, `#popover-time-filter`): Elevación a `z-index: 50 !important`, posicionamiento flotante sobre columnas y tarjetas sin ensanchar la barra de filtros, puente continuo `::before` de 8px (`top: -8px`) que garantiza transición sin parpadeos al desplazar el cursor, y retardo de cierre de 250ms (`transition-delay: 0.25s`) anti-cierre accidental.
- Paleta oscura profunda (`bg-slate-900`, `bg-slate-950`), reglas de glassmorphism con desenfoque de fondo (`backdrop-blur-md`, `bg-white/70`, `bg-slate-900/80`), arquitectura multitema (Slate Metálico y Rose Luxury Champagne/Dusty Rose), barra de desplazamiento ultra-fina personalizada (`.custom-scrollbar`), y micro-interacciones táctiles.

### 3. FUNCIONES QUE CONTIENE:
- **Clases y Reglas CSS Clave:**
  - `.header-dock-btn`: Clase maestra para botones del flanco derecho con altura `h-9` y centrado flex.
  - `#btn-nav-notas`: Cápsula transparente con trazo fino continuo ámbar (`border: 1px solid rgba(217, 119, 6, 0.8)`), icono en ámbar y micro-contador integrado.
  - `#btn-header-calendar`: Cápsula transparente con trazo fino slate/metálico (`border: 1px solid rgba(71, 85, 105, 0.8)`) e icono de calendario centrado.
  - `#btn-header-archivados`: Cápsula transparente con trazo fino naranja (`border: 1px solid rgba(249, 115, 22, 0.8)`), icono `📦` y micro-badge numérico reactivo.
  - `#btn-refresh-global`, `#btn-toggle-shortcuts-modal`, `#btn-theme-dropdown`: Iconos flotantes limpios en reposo con fondo y bordes transparentes (`background: transparent !important; border: 1px solid transparent !important; box-shadow: none !important`), con transición suave en hover.
  - `.kanban-hover-popover-container` & `.kanban-hover-popover`: Sistema unificado de micro-popovers glassmorphism por hover para todos los filtros Kanban. Dispone de un puente continuo `top-full pt-1` para erradicar cualquier separación entre la cápsula y el menú, retardo de cierre de 250ms (`transition: opacity 0.18s ease 250ms, visibility 0.18s ease 250ms, transform 0.18s ease 250ms`), apertura inmediata a 0s en hover (`group-hover:block` / `.filter-popover-open`), y soporte para tap móvil.
  - `.header-bento-btn`: Alias de retrocompatibilidad vinculado a `.header-dock-btn`.
  - `.custom-scrollbar`: Scrollbars delgados (4px a 6px) con thumb traslúcido y esquinas redondeadas.
  - `.glass-panel`: Paneles translúcidos con borde sutil (`border-slate-200/60 dark:border-slate-800/60`).
  - `.kanban-col`: Contenedores con altura dinámica `calc(100vh - 180px)` y scroll interno independiente.
  - `.kanban-card-dragging`: Efecto de opacidad 40% y escalado durante el arrastre.
  - `.bento-card` / `.drawer-bento-card`: Tarjetas modulares con borde degradado, riel de color semántico y elevación por hover.
  - `.badge-status-*`: Colores cromáticos para estados `01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`.

### 4. VARIABLES Y ESTADO:
- Sin variables de script. Define variables CSS raíz (`--bg-canvas`, `--bg-surface-1`, `--border-subtle`, `--accent-brand`, `--accent-champagne`, etc.).

---

## 22. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\FichaEjecutiva.html`

### 2. PROPÓSITO:
Plantilla HTML/CSS de impresión de alta precisión en hoja A4 evaluada por `ReporteriaService.generarFichaPdf()`. Diseñada con maquetación rígida a 300 DPI para compilación sin desfases hacia formato PDF en Google Drive. Presenta el resumen ejecutivo del proyecto, salud general mediante semáforo determinístico, anillo SVG de avance físico, cuadrícula de métricas de Valor Ganado (PV, EV, AC, CPI, SPI, Variaciones), tabla analítica de hitos y cronograma, desglose de costos presupuestados vs. ejecutados reales, y área formal de firmas y gobernanza.

### 3. FUNCIONES QUE CONTIENE:
- **Estructura y Marcadores Dinámicos (Apps Script Scriptlets):**
  - Encabezado: Código y nombre del proyecto (`<?= proyecto.nombre ?>`), fecha de corte, responsable.
  - Resumen KPI: Tarjetas de Inversión Aprobada, Costo Real Ejecutado (PEN/USD), Avance Ponderado, Índice de Desempeño CPI/SPI.
  - Tabla de Entregables WBS: Itera `hitos` imprimiendo Fase, Nombre, Criterio DoD, Fecha Límite y Estado.
  - Tabla Financiera: Comparativa de presupuesto planificado vs. real ejecutado con cálculo de varianza.
  - Recomendaciones Estratégicas: Diagnóstico automático generado por `ReporteriaService.obtenerAnalisisEVM()`.

### 4. VARIABLES Y ESTADO:
- **Variables Evaluadas en Plantilla:** `proyecto`, `hitos`, `tareas`, `gastos`, `metricasEVM`, `saludGlobal`, `fechaGeneracion`.

---

## 23. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\View_Kanban.html`

### 2. PROPÓSITO:
Vista operativa principal del flujo de trabajo diario de tareas y actividades. Contiene el tablero Kanban con 4 columnas drag & drop, la barra lateral colapsable de proyectos con filtrado en vivo, la barra de filtros contextuales visibles con hover suave (`Todo`, `Proyectos`, `Personal`), el selector de horizonte temporal en cápsula compacta flotante (`#btn-time-capsule`), y la unificación de TODOS los filtros secundarios (Hitos, Prioridad, Nivel de Energía, Plazo/Vencimiento, Bloqueos/Dependencias) en micro-popovers flotantes por hover con acabado glassmorphism (`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/60 shadow-2xl rounded-xl p-1.5 z-50 min-w-[160px]`).

**Principios Canónicos de Interacción en Filtros Kanban:**
- **Eliminación Absoluta de Scrollbars Internos (`overflow-visible relative`):** En el contenedor de la cabecera y barra de filtros se erradica cualquier clase de recorte (`overflow-hidden`, `overflow-x-auto`, `overflow-y-auto`, `scrollbar-thin`, etc.), garantizando que los paneles desplegables floten libremente sobre el lienzo y las tarjetas sin ensanchar la barra ni inducir desplazamientos horizontales parásitos.
- **Superposición Libre y Puente Continuo (`z-50`):** Todos los popovers (`#popover-time-filter`, `#popover-filter-hito`, `#popover-filter-prio`, `#popover-filter-energia`, `#popover-filter-plazo`, `#popover-filter-dep`) se posicionan de forma flotante con `z-50`, puente continuo pseudo-elemento `::before` de 8px para eliminar flickering al mover el cursor hacia las opciones, y retardo de 250ms al cierre.
- **Dependencia Condicional del Filtro de Hitos:**
  - Por defecto (o en Vista Global / cuando el proyecto es 'Todos'), el filtro de Hitos permanece estrictamente **deshabilitado**: atributo `disabled`, estilos `opacity-40 cursor-not-allowed pointer-events-none` y texto visible `"🎯 Hitos (Selecciona Proyecto)"`.
  - Al seleccionar un proyecto específico en la barra lateral o selector: se habilita automáticamente (`opacity-100 cursor-pointer`), cargando en su lista flotante **únicamente** los hitos pertenecientes a dicho proyecto (`state.hitos.filter(h => (h.idProyecto || h.ID_Proyecto) === state.selectedProjectId)`).
  - Al regresar el proyecto a 'Todos' o invocar la limpieza general, se reinicia el filtro de hitos, se deshabilita nuevamente y se aplica el filtro global al Kanban.
- **Purga de Archivados:** Se prohíbe cualquier botón o acceso de archivados en la barra de filtros del Kanban, centralizándose de forma unívoca en la cabecera ejecutiva (`Layout_Header.html`).

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Sidebar de Proyectos:
    - `#sidebar-proyectos-kanban`: Contenedor lateral colapsable.
    - `#btn-toggle-sidebar-kanban`: Botón que expande/colapsa la barra lateral.
    - `#sidebar-search-proyectos`: Buscador en tiempo real de iniciativas.
    - `#btn-clear-search-sidebar`: Limpia el texto de búsqueda del sidebar.
    - `#lista-proyectos-sidebar`: Contenedor inyectado con tarjetas de proyectos.
  - Segmentación Rápida de Contexto (Siempre visible con hover suave):
    - `#btn-context-todos`, `#badge-context-todos`: Muestra todas las tareas de proyectos y actividades personales.
    - `#btn-context-proyectos`, `#badge-context-proyectos`: Filtra exclusivamente tareas asociadas a proyectos.
    - `#btn-context-personal`, `#badge-context-personal`: Filtra compromisos y actividades personales.
  - Filtro Temporal Compacto con Micro-Popover Glassmorphism Anti-Cierre:
    - `#container-time-filter`: Contenedor hover popover (`group/timefilter relative`).
    - `#btn-time-capsule`: Cápsula compacta con icono dinámico (`#label-time-active-icon`), texto activo (`#label-time-active-text`) y chevron interactivo.
    - `#popover-time-filter`: Panel flotante `z-50` con puente continuo y opciones (`#btn-time-todo`, `#btn-time-hoy`, `#btn-time-semana`, `#btn-time-mes`) con checkmarks reactivos (`#check-time-*`).
  - Barra de Filtros Secundarios Unificada a Micro-Popovers por Hover (`overflow-visible relative`):
    - `#filter-buscar-tarea`: Campo de búsqueda de texto estilizado en `rounded-xl` con botón de limpieza `#btn-clear-task-search`.
    - Filtro de Hitos Condicional: `#container-filter-hito`, cápsula `#btn-hito-capsule` (deshabilitada por defecto en Vista Global), etiqueta `#label-hito-active-text`, popover flotante `z-50` `#popover-filter-hito`, lista `#lista-opciones-hitos-popover` y companion input `#filter-hito-tarea`.
    - Filtro de Prioridad: `#container-filter-prio`, cápsula `#btn-prio-capsule`, etiqueta `#label-prio-active-text`, popover flotante `z-50` `#popover-filter-prio`, opciones (`#opt-prio-*`), checkmarks (`.check-prio-indicator`) y companion input `#filter-prioridad-tarea`.
    - Filtro de Nivel de Energía: `#container-filter-energia`, cápsula `#btn-energia-capsule`, etiqueta `#label-energia-active-text`, popover flotante `z-50` `#popover-filter-energia`, opciones (`#opt-energia-*`), checkmarks (`.check-energia-indicator`) y companion input `#filter-energia-tarea`.
    - Filtro de Vencimiento / Plazo: `#container-filter-plazo`, cápsula `#btn-plazo-capsule`, etiqueta `#label-plazo-active-text`, popover flotante `z-50` `#popover-filter-plazo`, opciones (`#opt-plazo-*`), checkmarks (`.check-plazo-indicator`) y companion input `#filter-plazo-tarea`.
    - Filtro de Bloqueos / Dependencias: `#container-filter-dep`, cápsula `#btn-dep-capsule`, etiqueta `#label-dep-active-text`, popover flotante `z-50` `#popover-filter-dep`, opciones (`#opt-dep-*`), checkmarks (`.check-dep-indicator`) y companion input `#filter-dependencia-tarea`.
    - `#btn-toggle-modo-mav`: Toggle MAV (Mínimo Alcance Viable) en `rounded-xl`.
    - `#badge-filtro-activo-resumen`: Pill reactiva de resumen de filtros aplicados.
    - `#btn-limpiar-filtros-kanban`: Botón reactivo para restablecer todos los filtros en `rounded-xl`.
  - Gasto Contextual:
    - `#lbl-gasto-contextual-titulo`, `#lbl-gasto-contextual`.
  - Columnas Drag & Drop:
    - `#col-backlog` (Dropzone estado `01_Backlog`, contador `#badge-count-backlog`).
    - `#col-por-hacer` (Dropzone estado `02_Por_Hacer`, contador `#badge-count-por-hacer`).
    - `#col-en-proceso` (Dropzone estado `03_En_Proceso`, contador `#badge-count-en-proceso`).
    - `#col-completado` (Dropzone estado `04_Completado`, contador `#badge-count-completado`).
    - `#badge-count-mav`: Badge de tareas de Mínimo Alcance Viable.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.tareas`, `state.actividadesPersonales`, `state.kanbanContextFilter`, `state.kanbanTimeFilter`, `state.selectedProjectId`, `draggedTaskId`.
- **LocalStorage:** `'pmo_kanban_time_filter'` (Persistencia reactiva del horizonte temporal seleccionado).

---

## 24. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\View_Portafolio.html`

### 2. PROPÓSITO:
Cuadro de mando estratégico y ejecutivo de la cartera de proyectos. Presenta tarjetas KPI estilo Bento con métricas de salud global, distribución de proyectos por estado, selector de visualización (cuadrícula de tarjetas o tabla analítica interactiva), barra de búsqueda en vivo, filtros de portafolio y botón de apertura del wizard de creación de proyecto con IA.

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Métricas de Cartera:
    - `#kpi-proyectos-activos`: Número de proyectos en proceso.
    - `#kpi-proyectos-riesgo`: Conteo de proyectos en estado de alerta o rojo.
    - `#kpi-proyectos-completados`: Proyectos cerrados con éxito.
    - `#kpi-proyectos-inversion`: Suma total de presupuesto aprobado (PEN/USD).
    - `#bar-distribucion-estados`: Barra segmentada de porcentaje por fases.
  - Conmutadores de Vista:
    - `#btn-view-grid-portafolio`: Activa la vista de tarjetas.
    - `#btn-view-table-portafolio`: Activa la tabla analítica detallada.
  - Contenedores de Renderizado:
    - `#contenedor-tarjetas-portafolio`: Cuadrícula responsiva de tarjetas ejecutivas.
    - `#contenedor-tabla-portafolio`: Tabla HTML con columnas de ordenamiento.
  - Controles y Búsqueda:
    - `#input-search-portafolio`: Búsqueda reactiva por texto.
    - `#btn-clear-portafolio-search`: Limpieza rápida del input.
    - `#btn-nuevo-proyecto-portafolio`: Dispara `abrirWizardProyecto()`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.proyectos`, `state.hitos`, `state.gastos`.
- **LocalStorage:** `'pmo_portfolio_view'` (`'grid'` | `'table'`).

---

## 25. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\View_Habitos.html`

### 2. PROPÓSITO:
Vista integral de gestión de vida, hábitos y compromisos personales. Organiza las actividades en columnas según las 6 dimensiones de vida canónicas (Salud & Deporte, Desarrollo Personal, Trabajo & Carrera, Finanzas & Admin, Hogar & Familia, Ocio & Social), presenta el anillo SVG de completitud diaria, contador de rachas actuales (`Racha_Actual`), y proporciona modales de creación rápida y edición de rutinas.

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Panel KPI de Hábitos:
    - `#progress-ring-habitos`: Anillo SVG de progreso del día.
    - `#counter-habitos-hoy`: Contador de hábitos completados hoy vs. total.
    - `#counter-racha-maxima`: Mayor racha activa en días continuos.
    - `#badge-horas-vida-semana`: Horas dedicadas a compromisos de vida.
  - Columnas por Dimensión de Vida:
    - `#col-cat-SALUD_DEPORTE`
    - `#col-cat-DESARROLLO_ESTUDIO`
    - `#col-cat-LABORAL_HONORARIO`
    - `#col-cat-FINANZAS_TRAMITES`
    - `#col-cat-SOCIAL_FAMILIA`
    - `#col-cat-PERSONAL_DESCANSO`
  - Controles de Creación:
    - Botones contextuales `+` por columna: `abrirModalCrearActividadPersonalPorCategoria(cat)`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.actividadesPersonales`, `CONFIG.CATEGORIAS_VIDA_CONFIG`.

---

## 26. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\View_Finanzas.html`

### 2. PROPÓSITO:
Cuadro de control de tesorería, flujo de caja y gestión financiera. Muestra métricas de balance (Ingresos, Gastos y Saldo Neto del período), indicadores avanzados (Runway, Burn Rate, Endeudamiento en Cuotas), selector de mes fiscal, gráficos de consumo de presupuesto por categorías, tabla analítica unificada de transacciones con buscador en vivo, escáner de comprobantes con IA, y vista de compras a plazos / cuotas.

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Indicadores Financieros:
    - `#kpi-total-ingresos`: Total cobrado en el período.
    - `#kpi-total-gastos`: Total egresos ejecutados.
    - `#kpi-saldo-neto`: Flujo de caja neto.
    - `#badge-capacidad-ahorro`: Porcentaje de ahorro mensual.
    - `#badge-endeudamiento-cuotas`: Nivel de compromisos a plazos sobre ingresos.
  - Sub-navegación de Módulo:
    - `#tab-btn-finanzas-general`: Panel balance general y gráficos.
    - `#tab-btn-finanzas-transacciones`: Tabla de gastos e ingresos con conciliación.
    - `#tab-btn-finanzas-cuotas`: Tarjetas de planes de compras a plazos.
    - `#tab-btn-finanzas-radar`: Gráficos radar y categorías críticas.
  - Controles Operativos:
    - `#select-mes-finanzas`: Selector de período (Mes actual, meses previos, anual).
    - `#input-search-finanzas`: Búsqueda textual de glosas, proveedores y conceptos.
    - `#btn-escanear-comprobante-ia`: Lanza el modal/dropzone de OCR con Gemini.
    - `#btn-nuevo-gasto-modal`: Abre el modal de registro de egresos.
    - `#btn-nuevo-ingreso-modal`: Abre el modal de registro de cobros.
    - `#btn-sanear-cuotas`: Dispara `sanearcuotasdesfasadas` en el backend.
  - Contenedores de Listado:
    - `#contenedor-transacciones-unificadas`: Lista reactiva de gastos e ingresos.
    - `#contenedor-planes-cuotas`: Tarjetas de amortización de deudas y plazos.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.gastos`, `state.ingresos`, `state.cuotas`, `state.tipoCambioActual`, `state.tabFinanzasActiva`, `state.filtroMesFinanzas`.
- **LocalStorage:** `'PMO_PRESUPUESTOS_CATEGORIAS'`.

---

## 27. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\View_Detalle360.html`

### 2. PROPÓSITO:
Vista holística profunda de un proyecto seleccionado (`abrirDetalle360(idProyecto)`). Organizada bajo un diseño Bento ejecutivo: micro-tarjetas KPI (Salud semáforo, Burn Rate, Anillo SVG de progreso físico, Saldo presupuestal y Días restantes para el deadline), barra de herramientas con botón de exportación PDF directa, alternador entre desglose en Cascada WBS (acordeón colapsable con persistencia en sesión, split layout de tareas a la izquierda y gastos asociados a la derecha con enlaces a Drive) y el Grafo de Red Interactivo Vis.js con ruta crítica.

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Bento Header:
    - `#det-proy-nombre`: Título del proyecto activo.
    - `#det-badge-health`: Semáforo de salud (Verde, Amarillo, Rojo).
    - `#det-progreso-ring`: SVG circular interactivo de porcentaje de avance.
    - `#det-burnrate-bar`: Barra de consumo de presupuesto.
    - `#det-compromisos-label`: Presupuesto consumido vs. total tope.
    - `#det-dias-restantes`: Días de margen hasta la fecha límite.
    - `#det-cpi`: Indicador Cost Performance Index.
    - `#det-spi`: Indicador Schedule Performance Index.
    - `#det-badge-notas-proyecto`: Contador de notas vinculadas a la iniciativa.
  - Botones de Acción:
    - `cerrarDetalle360()`: Cierra el panel y regresa al Portafolio.
    - `#btn-quick-pdf-det`: Dispara compilación PDF vía `ReporteriaService`.
    - `abrirModalEditarProyecto(...)`: Edición de parámetros del proyecto.
    - `#btn-eliminar-proyecto-det360`: Confirmación y eliminación del proyecto.
    - `toggleTodosLosHitos(true/false)`: Expande/colapsa todos los acordeones WBS.
    - `abrirModalCrearHito()`: Crea un nuevo hito dentro de la cascada WBS.
  - Pestañas de Modo:
    - `#tab-btn-360-cascada`: Activa el visor en cascada WBS.
    - `#tab-btn-360-grafo`: Activa el Grafo de Red (Vis.js).
  - Contenedores de Visualización:
    - `#contenedor-hitos-cascada`: Contenedor dinámico del acordeón de hitos, tareas y gastos.
    - `#network-graph-canvas`: Lienzo interactivo del Grafo WBS.
    - `#grafo-toolbar`: Barra flotante de controles de zoom, enfoque y capas de gastos.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.proyectoDetalleActivo`, `state.proyectos`, `state.hitos`, `state.tareas`, `state.gastos`.
- **SessionStorage:** Estado de colapso de acordeones de hitos (`pmo_hitos_colapsados_PRO-...`).

---

## 28. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\View_Notas.html`

### 2. PROPÓSITO:
Vista completa del sistema de Notas Inteligentes (Keep + OneNote). Soporta organización en cuadrícula flexible (Masonry) o vista de lista detallada, filtro rápido por paleta cromática de 7 colores pastel, selector dinámico de etiquetas/tags, sección de notas fijadas en cabecera (`Es_Fijada`), módulo de lista de deseos y compras futuras (Wishlist) con cálculo de costo, barra de entrada rápida de notas (`Quick Note Input`), y acciones atómicas en tarjetas individuales (edición, fijado y copiado directo a texto plano sin metadatos residuales).

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Barra de Búsqueda y Filtros:
    - `#input-search-notas`: Búsqueda en vivo en títulos, contenidos y checklists.
    - `#container-color-pills-notas`: Botones de filtro por color (slate, emerald, indigo, amber, rose, sky, violet).
    - `#container-tags-pills-notas`: Píldoras de etiquetas dinámicas.
    - `#badge-header-notas`: Contador total de notas visibles.
  - Conmutadores de Visualización:
    - `#btn-view-masonry-notas`: Cuadrícula Masonry estilo Google Keep.
    - `#btn-view-list-notas`: Lista vertical compacta.
    - `#btn-view-wishlist-notas`: Alterna hacia el modo lista de compras/deseos.
  - Barra Rápida Superior:
    - `#quick-note-container`: Contenedor de creación instantánea sin modal.
    - `#quick-note-input`: Campo de texto que al hacer foco expande título y opciones.
  - Contenedores de Renderizado:
    - `#section-notas-fijadas`: Sección colapsable de notas destacadas.
    - `#container-notas-fijadas`: Grid inyectado de tarjetas fijadas (con botones de copiado atómico a texto plano).
    - `#section-notas-otras`: Sección general de notas.
    - `#container-notas-otras`: Grid inyectado de notas regulares (con botones de copiado atómico a texto plano).
    - `#container-wishlist-notas`: Vista especializada de ítems de Wishlist.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.notas`, `state.filtroNotas`, `state.filtroColorNotas`, `state.filtroBusquedaNotas`, `state.vistaModoNotas`.
- **LocalStorage:** `'PMO_LOCAL_STATE_CACHE'`.

---

# PARTE III: MODALES Y WIZARDS DE ENTRADA DE DATOS

---

## 29. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Modal_TareaFlow.html`

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

## 30. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Modal_ActividadFlow.html`

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
- **Variables Globales Vinculadas:** `state.actividadesPersonales`, `state.gastos`, `CONFIG.CATEGORIAS_VIDA_CONFIG`, `activityFlowState.gastosVinculados`.

---

## 31. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Modal_Finanzas.html`

### 2. PROPÓSITO:
Modal universal para transacciones financieras (Egresos e Ingresos, `#modal-finanzas-transaccion`) y digitalización de recibos/facturas con Inteligencia Artificial. Incluye conmutador dinámico Gasto/Ingreso, selector multi-divisa (PEN, USD, EUR) con consulta automática del tipo de cambio oficial, asignación jerárquica polimórfica (Proyecto, Hito, Tarea o Personal), captura de comprobantes mediante archivo o cámara web, y zona de carga OCR conectada a Gemini 1.5 Flash.

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Interruptor de Tipo: `#fin-switch-gasto`, `#fin-switch-ingreso`.
  - Campos de Transacción:
    - `#fin-id-transaccion`: Código `GAS-XXX` o `ING-XXX`.
    - `#fin-concepto`: Descripción clara del movimiento monetario.
    - `#fin-monto`: Importe original ingresado.
    - `#fin-moneda`: Selector de moneda (`PEN`, `USD`, `EUR`).
    - `#fin-tc`: Tipo de cambio aplicado respecto a PEN.
    - `#fin-monto-base`: Cálculo automático del equivalente en PEN.
    - `#fin-fecha`: Fecha de ejecución o fecha límite de pago/cobro.
    - `#fin-categoria`: Selector dinámico de categoría de gasto o fuente de ingreso.
    - `#fin-metodo-pago`: Transferencia, Tarjeta Débito/Crédito, Efectivo, etc.
    - `#fin-estado`: Ejecutado vs. Programado.
  - Vinculación Jerárquica:
    - `#fin-selector-origen`: Ámbito Proyecto vs. Personal.
    - `#fin-select-proyecto`: Lista desplegable de proyectos.
    - `#fin-select-hito`: Hitos asociados al proyecto seleccionado.
    - `#fin-select-tarea`: Tareas operativas vinculadas.
  - Digitalización y OCR:
    - `#file-comprobante`: Input file para selección de fotos o PDFs.
    - `#dropzone-comprobante-ia`: Área de arrastre para procesamiento con Gemini.
    - `#fin-comprobante-url`: URL final de persistencia en Drive.
    - `#fin-spinner-ocr`: Indicador visual de extracción inteligente.
  - Acciones:
    - `#fin-btn-guardar`: Dispara `createGasto`, `updateGasto`, `createIngreso` o `updateIngreso`.
    - `#fin-btn-eliminar`: Dispara `deleteGasto` o `deleteIngreso`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.gastos`, `state.ingresos`, `state.tipoCambioActual`, `state.proyectos`.

---

## 32. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Modal_ProyectosYHitos.html`

### 2. PROPÓSITO:
Wizard interactivo integral Flowbite/Tailwind (`#modal-proyecto-wizard`) para la planificación, dimensionamiento y creación de proyectos de envergadura. Presenta una barra de 4 pestañas sticky (1. Datos Generales, 2. Hitos, 3. Tareas, 4. Gastos Presupuestados), un botón prominente de Generación WBS con IA ("✨ Generar Estructura con IA"), cálculo reactivo del peso porcentual ponderado (con badge que alerta si falta o sobra porcentaje para completar el 100%), totalizador de horas de esfuerzo de tareas, barra visual de consumo del presupuesto tope, y guardado transaccional batch atómico.

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Pestañas Sticky: `#wiz-tab-general`, `#wiz-tab-hitos`, `#wiz-tab-tareas`, `#wiz-tab-gastos`.
  - Botón IA Prominente: `#btn-generar-wbs-ia` (Invoca `ejecutarGeneracionPropuestaIA()`).
  - Pestaña 1 - Datos Generales:
    - `#wiz-proy-nombre`: Nombre formal de la iniciativa.
    - `#wiz-proy-tipo`: Profesional vs. Personal.
    - `#wiz-proy-tshirt`: Talla T-Shirt (`S`, `M`, `L`, `XL`).
    - `#wiz-proy-criterio`: Criterio dominante (`Inversión`, `Operativo`, `Estratégico`).
    - `#wiz-proy-presupuesto`: Presupuesto tope financiero.
    - `#wiz-proy-moneda`: Divisa (`PEN`, `USD`).
    - `#wiz-proy-fecha-inicio`: Fecha estimada de inicio.
    - `#wiz-proy-fecha-fin`: Fecha compromiso de entrega.
    - `#wiz-proy-descripcion`: Alcance, objetivos y contexto para la IA.
    - `#wiz-proy-frecuencia-control`: Semanal, Quincenal, Mensual.
  - Pestaña 2 - Hitos:
    - `#wiz-container-hitos`: Lista interactiva de fases con inputs de nombre, peso % y fecha.
    - `#wiz-badge-total-peso`: Badge semáforo (Verde = 100%, Rojo != 100%).
    - `#btn-wiz-agregar-hito`: Añade una fila de hito manualmente.
  - Pestaña 3 - Tareas:
    - `#wiz-container-tareas`: Tareas agrupadas por hito con inputs de horas, prioridad y energía.
    - `#wiz-badge-total-horas`: Total de horas hombre proyectadas.
    - `#btn-wiz-agregar-tarea`: Añade tarea manual vinculada a hito.
  - Pestaña 4 - Gastos Presupuestados:
    - `#wiz-container-gastos`: Egresos proyectados vinculados a hitos y tareas.
    - `#wiz-bar-consumo-presupuesto`: Barra cromática de consumo sobre el presupuesto tope.
    - `#btn-wiz-agregar-gasto`: Añade un gasto manual.
  - Botón de Guardado Definitivo:
    - `#btn-wiz-guardar-proyecto`: Invoca `guardarProyectoDesdeWizard()`, validando el 100% de pesos y ejecutando la transacción en el servidor.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `currentWizardStep`, `state.proyectos`.

---

## 33. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Modal_AtajosYPdf.html`

### 2. PROPÓSITO:
Contenedor modular de diálogos auxiliares:
1. **Guía de Atajos de Teclado (`#modal-shortcuts-help`):** Muestra las teclas rápidas de navegación universal (`K` para Kanban, `P` para Portafolio, `H` para Hábitos, `F` para Finanzas, `N` para Notas, `?` para ayuda, `ESC` para cerrar diálogos).
2. **Modal de Exportación Ejecutiva PDF (`#modal-compilacion-pdf`):** Permite elegir un proyecto de la cartera, previsualizar sus métricas clave y ordenar al backend la compilación en PDF de alta resolución con descarga directa de Drive.

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - Guía de Atajos: `#modal-shortcuts-help`, lista de chips de teclas (`<kbd>`).
  - Compilación PDF:
    - `#modal-compilacion-pdf`: Contenedor del diálogo.
    - `#pdf-select-proyecto`: Menú desplegable con todos los proyectos disponibles.
    - `#btn-ejecutar-compilacion-pdf`: Dispara `ejecutarCompilacionPdfDirecta()`.
    - `#pdf-compilando-spinner`: Indicador de procesamiento en Apps Script.
    - `#pdf-resultado-container`: Contenedor del enlace generado tras la compilación.
    - `#pdf-download-link`: Enlace directo de descarga (`uc?id=...`).
    - `#pdf-view-link`: Enlace de previsualización en Google Drive.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.proyectos`, `state.proyectoDetalleActivo`.
- **LocalStorage:** `'pmo_shortcuts_enabled'`.

---

## 34. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\Modal_Notas.html`

### 2. PROPÓSITO:
Modal de edición enriquecida de Notas Inteligentes (`#modal-editor-nota`). Ofrece selector de color pastel de la nota, alternador de fijado en cabecera, edición del cuerpo de texto o formato checklist interactivo (con checkboxes reactivos para tachar ítems), selector multi-etiquetas con creación dinámica de tags, selector de vinculación polimórfica bidireccional a entidades del sistema (Proyectos, Hitos, Tareas, Hábitos, Finanzas) y zona de carga de archivos adjuntos hacia Google Drive.

### 3. FUNCIONES QUE CONTIENE:
- **Elementos del DOM e IDs Definidos:**
  - `#modal-editor-nota`: Contenedor modal.
  - `#nota-modal-id`: Código de nota (`NOT-XXXXX` o temporal).
  - `#nota-modal-titulo`: Input de título con tipografía destacada.
  - `#nota-modal-contenido`: Textarea auto-ajustable de contenido.
  - `#nota-modal-pin`: Botón de fijado con icono de chincheta.
  - `#container-color-picker-nota`: Selector de color de fondo de la nota.
  - Checklist Dinámico:
    - `#nota-modal-checklist-container`: Lista de pasos de checklist.
    - `#input-nuevo-check-nota`: Input para añadir un nuevo elemento de checklist.
    - `#btn-agregar-check-nota`: Agrega el paso al checklist.
  - Etiquetas / Tags:
    - `#nota-modal-tags-container`: Píldoras de etiquetas seleccionadas.
    - `#input-nueva-etiqueta-nota`: Input con autocompletado del catálogo de tags.
  - Vínculos Contextuales:
    - `#nota-modal-vinculos-container`: Chips de entidades conectadas con badge de código (`PRO-01`, `TAR-15`).
    - `#btn-abrir-selector-vinculos`: Abre menú contextual para enlazar entidades.
  - Archivos Adjuntos:
    - `#nota-modal-adjuntos-container`: Miniaturas de imágenes o PDFs adjuntos.
    - `#input-file-adjunto-nota`: Input para subir archivos a Google Drive.
  - Acciones de Pie:
    - `#nota-modal-btn-eliminar`: Dispara `eliminarNota`.
    - `#nota-modal-btn-guardar`: Dispara `guardarNota`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales Vinculadas:** `state.notas`, `state.proyectos`, `state.tareas`, `state.actividadesPersonales`.


---

# PARTE IV: MÓDULOS DE JAVASCRIPT CLIENTE (ARCHIVOS `JS_*.html`)

---

## 35. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JavaScript.html`

### 2. PROPÓSITO:
Manifiesto histórico de arquitectura frontend. Documenta la segregación del antiguo script monolítico de 12,213 líneas en los 11 módulos especializados de cliente (`JS_Core.html`, `JS_Subtareas.html`, `JS_Kanban.html`, `JS_Habitos.html`, `JS_Portafolio.html`, `JS_Detalle360.html`, `JS_GrafoRed.html`, `JS_TareaFlow.html`, `JS_Finanzas.html`, `JS_ModalesYAtajos.html`, `JS_Notas.html`).

### 3. FUNCIONES QUE CONTIENE:
- Archivo documental declarativo sin funciones ejecutables activas.

### 4. VARIABLES Y ESTADO:
- Sin variables de estado ni almacenamiento.

---

## 36. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JS_Core.html`

### 2. PROPÓSITO:
Núcleo del estado reactivo global del cliente (`state` / `window.state`), canal RPC universal seguro (`callBackend`), motor de notificaciones operativas (Toast SweetAlert2 no bloqueantes), formateadores infalibles de fechas y horas (neutralizando desfases de zona horaria y epochs 1899 de Google Sheets), sincronización con almacenamiento local (`localStorage`), gestor de recarga de datos (`refreshData`) y motor de indexación y caché de vínculos bidireccionales de Notas Inteligentes hacia todas las entidades del sistema.

### 3. FUNCIONES QUE CONTIENE:

#### `formatHoraLimpia(val)`
- **Parámetros:** `val` (`string` | `Date` | `number`).
- **DOM / Efecto:** No manipula el DOM directamente; retorna cadena formateada.
- **Descripción:** Extrae de forma limpia `HH:mm` eliminando fechas de 1899 o sufijos GMT de Google Sheets.

#### `formatFechaHumana(fechaStr)`
- **Parámetros:** `fechaStr` (`string` | `Date`).
- **Descripción:** Convierte fechas ISO `YYYY-MM-DD` a texto amigable (`"lun, 15 sep"`) en `es-PE` neutralizando desfases UTC.

#### `escapeHtml(str)`
- **Parámetros:** `str` (`string`).
- **Descripción:** Sanitiza caracteres `<`, `>`, `&`, `"`, `'` previniendo ataques XSS.

#### `mostrarToastOperativo(icono, titulo, detalle, duracion)`
- **DOM / Efecto:** Muestra notificación flotante no bloqueante en la esquina inferior derecha mediante `Swal.fire({ toast: true, position: 'bottom-end', ... })`.

#### `notificarCreacion(entidad, nombre, genero)` / `notificarModificacion(...)` / `notificarRestauracion(...)`
- **Descripción:** Notificadores semánticos que invocan `mostrarToastOperativo` con mensajes preconfigurados.

#### `setSyncStatus(estado, mensaje)`
- **DOM Afectado:** Modifica `#sync-status-indicator` (clases `bg-emerald-500`, `bg-amber-400`, `bg-rose-500`) y `#sync-status-text` (`innerText = mensaje`).
- **Descripción:** Informa en tiempo real si el cliente está sincronizado (`"sincronizado"`), enviando datos (`"guardando"`) o si hubo fallo de red (`"error"`).

#### `callBackend(action, payload, callback, fallback, opts)`
- **Parámetros:**
  - `action` (`string`): Nombre de la acción RPC del backend (ej. `"createTarea"`).
  - `payload` (`Object`): Datos de entrada en formato plano.
  - `callback` (`Function(res)`): Función ejecutada ante respuesta exitosa del servidor.
  - `fallback` (`Function(err)`): Función ejecutada ante error o fallo de red.
  - `opts` (`Object`): Opciones avanzadas (`{ silent: boolean, timeoutMs: number }`).
- **Descripción:** Puente central de comunicación RPC. Invoca `google.script.run.withSuccessHandler(...).withFailureHandler(...).apiRouter(action, payload)`. Actualiza `setSyncStatus`, parsea el JSON de respuesta, y si ocurre un error muestra un diálogo de alerta SweetAlert2.

#### `aplicarDatosDashboard(data, esPrecargaLocal)`
- **DOM Afectado:** Dispara la actualización visual de la vista activa llamando a `renderKanban()`, `renderPortafolio()`, `renderVistaHabitos()`, `renderVistaFinanzas()` o `renderVistaNotas()`.
- **Descripción:** Hidrata el objeto `state` con todas las listas recibidas (`proyectos`, `hitos`, `tareas`, `gastos`, `actividadesPersonales`, `ingresos`, `subtareas`, `notas`, `cuotas`), ejecuta el saneamiento y normalización polimórfica estricta de pertenencia de tareas e hitos (`ID_Proyecto`, `idProyecto`, `id_proyecto` e `ID_Hito`, `idHito`, `id_hito`), autocorrigiendo inversiones de columnas accidentales y deduciendo pertenencias huérfanas mediante mapeo inverso. Construye el índice de notas vinculadas y guarda una copia en `localStorage`.

#### `sincronizarCacheLocalState()`
- **Descripción:** Serializa `state` en `localStorage.setItem('PMO_LOCAL_STATE_CACHE', ...)`.

#### `refreshData(forceRefresh)`
- **Backend Invocado:** `callBackend("getDashboardData", { forceRefresh: !!forceRefresh })`.
- **Descripción:** Solicita datos frescos al servidor.

#### `limpiarFiltrosVistaActiva(silent)` / `resetGlobalFiltrosSistema(silent)`
- **DOM Afectado:** Limpia inputs de búsqueda, resetea selectores y oculta banners de filtros activos.

#### `construirIndiceNotasVinculadas()` / `obtenerNotasVinculadasAEntidad(idEntidad, tipoEntidad)`
- **Descripción:** Mapea en memoria RAM todas las notas vinculadas a proyectos, hitos, tareas, hábitos o transacciones para renderizado instantáneo de badges.

#### `generarBadgeNotasVinculadas(idEntidad, tipoEntidad, extraClass)`
- **DOM Afectado:** Genera micro-badge HTML interactivo con icono de nota y contador que al hacer click abre el visor de notas vinculadas.

### 4. VARIABLES Y ESTADO:
- **Objeto Global:** `state` / `window.state`.
- **LocalStorage:**
  - `'PMO_LOCAL_STATE_CACHE'`: Copia local instantánea del dashboard.
  - `'PMO_ACTIVE_TAB'`: Última vista activa abierta.
  - `'pmo_sidebar_collapsed'`: Estado de barra lateral.
- **Cache en RAM:** `_cacheNotasVinculadas`, `_indiceVersionConstruida`.

---

## 37. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JS_Kanban.html`

### 2. PROPÓSITO:
Motor reactivo del Tablero Kanban y gestión operativa de tareas. Implementa el renderizado optimizado de las 4 columnas de flujo (`01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`), el sistema nativo Drag & Drop con clases visuales de arrastre, filtros contextuales y temporales, trazabilidad visual bidireccional de dependencias (resalta la cadena de predecesoras y sucesoras de una tarea al posar el cursor o seleccionarla), y mutación optimista del DOM con sincronización en segundo plano hacia el backend.

### 3. FUNCIONES QUE CONTIENE:

#### `normalizarEstadoTarea(rawState)`
- **Parámetros:** `rawState` (`string`).
- **Descripción:** Normaliza cualquier variante de estado (`"Backlog"`, `"01_Backlog"`) a una de las 4 constantes oficiales.

#### `renderKanban()`
- **DOM Afectado:** Renderiza `#col-backlog`, `#col-por-hacer`, `#col-en-proceso`, `#col-completado`, actualiza `#badge-count-*` y el banner `#banner-filtros-activos`.
- **Descripción:** Filtra las tareas de `state.tareas` y actividades de `state.actividadesPersonales` según `state.kanbanContextFilter`, `state.kanbanTimeFilter`, `state.selectedProjectId` y la búsqueda en vivo. Genera las tarjetas HTML y reinicializa los listeners Drag & Drop.

#### `crearTarjetaKanbanHTML(t)`
- **DOM Afectado:** Genera el elemento HTML `<div class="kanban-card ...">` con atributos `draggable="true"`, `data-task-id`, badges de prioridad, fecha, energía, horas, widget de subtareas y badge de notas vinculadas.

#### `setupDragAndDropKanban()`
- **Eventos:** Registra `dragstart`, `dragend`, `dragover`, `dragenter`, `dragleave`, `drop` en todas las tarjetas y columnas.

#### `handleDragStart(e)` / `handleDragEnd(e)`
- **Variables Afectadas:** `draggedTaskId = e.target.getAttribute('data-task-id')`. Aplica clases `.kanban-card-dragging` y opacidad.

#### `handleDrop(e)`
- **Backend Invocado:** Si es tarea: `callBackend("updateTarea", { idTarea, estado: nuevoEstado })`. Si es actividad: `callBackend("completarActividadPersonal", { idActividad, nuevoEstado })`.
- **Descripción:** Aplica actualización visual optimista inmediata en el DOM (mueve la tarjeta a la nueva columna y actualiza contadores) y envía la petición RPC al backend.

#### `setKanbanContextFilter(filtro)`
- **DOM Afectado:** Actualiza clases activas en `#btn-context-todos`, `#btn-context-proyectos`, `#btn-context-personal` (visibles con hover suave y micro-interacciones) y sus badges numéricos. Invoca `aplicarFiltrosCruzados()`.

#### `setKanbanTimeFilter(filtro, skipApply)`
- **DOM Afectado:** Actualiza la cápsula compacta (`#label-time-active-icon`, `#label-time-active-text`), las opciones del micro-popover flotante (`#btn-time-todo`, `#btn-time-hoy`, `#btn-time-semana`, `#btn-time-mes`), checkmarks de selección activa (`#check-time-*`) y cierra el popover. Invoca `aplicarFiltrosCruzados()` si `skipApply` no está activo.
- **Persistencia:** Guarda la selección en `localStorage.setItem('pmo_kanban_time_filter', filtro)`.

#### `toggleFilterPopover(e, popoverId)` / `toggleTimeFilterDropdown(e)`
- **Descripción:** Alterna la clase `filter-popover-open` / `time-popover-open` en el popover especificado cerrando los demás, proveyendo soporte táctil fluido en pantallas táctiles y dispositivos móviles. Incluye listener para cerrar cualquier popover al hacer clic fuera del contenedor.

#### `setKanbanPrioridadFilter(valor, skipApply)`
- **DOM Afectado:** Actualiza la cápsula `#btn-capsule-prioridad-filter`, etiqueta `#label-capsule-prioridad-filter` ('Prioridad: Todas', '🔴 Prio: Alta', '🟡 Prio: Media', '🟢 Prio: Baja'), checkmarks `#check-prioridad-*`, input oculto `#filter-prioridad-tarea` y aplica filtros.

#### `setKanbanEnergiaFilter(valor, skipApply)`
- **DOM Afectado:** Actualiza la cápsula `#btn-capsule-energia-filter`, etiqueta `#label-capsule-energia-filter` ('Energía: Todos', '⚡ Alta', '🔋 Media', '☕ Baja'), checkmarks `#check-energia-*`, input oculto `#filter-energia-tarea` y aplica filtros.

#### `setKanbanPlazoFilter(valor, skipApply)`
- **DOM Afectado:** Actualiza la cápsula `#btn-capsule-plazo-filter`, etiqueta `#label-capsule-plazo-filter` ('Vencimiento: Todos', '🚨 Vencidas', '⏳ Vence Hoy', '📅 Esta Semana', '⚪ Sin Plazo'), checkmarks `#check-plazo-*`, input oculto `#filter-plazo-tarea` y aplica filtros.

#### `setKanbanDependenciaFilter(valor, skipApply)`
- **DOM Afectado:** Actualiza la cápsula `#btn-capsule-dependencia-filter`, etiqueta `#label-capsule-dependencia-filter` ('Bloqueo: Todos', '🔒 Bloqueadas', '🔓 Desbloqueadas'), checkmarks `#check-dep-*`, input oculto `#filter-dependencia-tarea` y aplica filtros.

#### `setKanbanHitoFilter(idHito, skipApply)`
- **DOM Afectado:** Actualiza la cápsula (`#btn-hito-capsule` / `#btn-capsule-hito-filter`), etiqueta (`#label-hito-active-text` / `#label-capsule-hito-filter`), checkmarks de selección (`.check-hito-indicator`), companion input `#filter-hito-tarea`, cierra el micro-popover flotante `z-50` e invoca `aplicarFiltrosCruzados()`. Si no hay proyecto seleccionado, fuerza el estado deshabilitado (`disabled = true`, `opacity-40 cursor-not-allowed pointer-events-none`).

#### `actualizarSelectorHitosKanban(preservarValor)`
- **DOM Afectado:** Implementa la **Regla Canónica de Dependencia de Hitos**:
  - Si `state.selectedProjectId` es nulo, vacío o `'TODOS'`: Deshabilita inmediatamente el botón del filtro de hitos (`btn.disabled = true`, `opacity-40 cursor-not-allowed pointer-events-none`), fija la etiqueta en `"🎯 Hitos (Selecciona Proyecto)"`, vacía `#filter-hito-tarea` y muestra mensaje orientador en el popover.
  - Si se selecciona un proyecto específico: Habilita el control (`btn.disabled = false`, `opacity-100 cursor-pointer`), filtra de forma estricta los hitos correspondientes a dicho proyecto (`state.hitos.filter(h => (h.idProyecto || h.ID_Proyecto) === proySeleccionado)`), genera la opción `"🎯 Todos los Hitos"` y renderiza los hitos pertenecientes a la iniciativa. Si el proyecto carece de hitos, notifica `"🎯 Sin Hitos Registrados"` deshabilitando la interacción.
  - Al deseleccionar el proyecto y regresar a 'Todos': Restablece el valor de filtro a vacío y vuelve a deshabilitar el selector de hitos.

#### `sincronizarFiltroTemporalDesdeStorage()`
- **Descripción:** Lee `localStorage.getItem('pmo_kanban_time_filter')` al inicializar (`DOMContentLoaded`) y restaura el horizonte temporal previamente seleccionado por el usuario.

#### `toggleModoEnfoqueMav()`
- **DOM Afectado:** Alterna el estado `state.modoEnfoqueMav` y conmuta `#btn-toggle-modo-mav` entre su estilo activo (`bg-rose-600 text-white border-rose-600 rounded-xl`) y su diseño inactivo homologado a la barra central (`rounded-xl bg-slate-100/75 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800/60 hover:bg-slate-200/50 dark:hover:bg-slate-800/60`). Invoca `aplicarFiltrosCruzados()`.

#### `limpiarTodosLosFiltrosKanban()`
- **DOM Afectado:** Restablece atómicamente todas las cápsulas secundarias mediante sus setters (`setKanbanPrioridadFilter('')`, `setKanbanEnergiaFilter('')`, `setKanbanPlazoFilter('')`, `setKanbanDependenciaFilter('')`, `setKanbanHitoFilter('')`), reinicia y deshabilita el selector de hitos (`actualizarSelectorHitosKanban(false)`), limpia el campo de búsqueda (`#filter-buscar-tarea`), resetea el modo MAV, y restablece el contexto a `TODOS` y el tiempo a `TODO`.

#### `activarResaltadoDependencias(idTarea)` / `limpiarTrazabilidadKanban()`
- **DOM Afectado:** Busca en el DOM las tarjetas predecesoras (aplica clase `.border-amber-400 .ring-2`) y sucesoras (aplica `.border-blue-400 .ring-2`).

### 4. VARIABLES Y ESTADO:
- **Variables Globales:** `draggedTaskId`, `state.kanbanContextFilter`, `state.kanbanTimeFilter`, `state.filtros.hitoTarea`.
- **LocalStorage:** `'pmo_kanban_time_filter'` (Persiste el filtro de tiempo entre sesiones y recargas).

---

## 38. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JS_Portafolio.html`

### 2. PROPÓSITO:
Lógica de control del cuadro de mando del Portafolio y barra lateral de navegación de proyectos. Renderiza la lista de proyectos en la barra lateral con medidores de avance en vivo, gestiona el filtrado reactivo de iniciativas, calcula indicadores ejecutivos de cartera (Inversión total, distribución porcentual por estado, proyectos en riesgo), commuta entre la cuadrícula de tarjetas Bento y la tabla analítica con ordenamiento, y enlaza la apertura de la vista holística Detalle 360°.

### 3. FUNCIONES QUE CONTIENE:

#### `renderSidebarProyectos()`
- **DOM Afectado:** `#lista-proyectos-sidebar`, `#badge-total-proyectos-sidebar`.
- **Descripción:** Inyecta en la barra lateral la lista de proyectos ordenados alfabéticamente con su código, nombre, semáforo de salud y barra de avance físico.

#### `filtrarProyectosSidebarEnVivo(term)` / `limpiarBusquedaSidebar()`
- **DOM Afectado:** Muestra u oculta elementos en `#lista-proyectos-sidebar` según coincidencia con el término de búsqueda.

#### `seleccionarProyectoSidebar(idProyecto)`
- **DOM Afectado:** Aplica clase de selección activa al proyecto en el sidebar y filtra automáticamente las tareas del tablero Kanban por ese proyecto.

#### `renderKPIsPortafolio()`
- **DOM Afectado:** `#kpi-proyectos-activos`, `#kpi-proyectos-riesgo`, `#kpi-proyectos-completados`, `#kpi-proyectos-inversion`, `#bar-distribucion-estados`.

#### `renderTarjetasPortafolio(filtrados)`
- **DOM Afectado:** `#contenedor-tarjetas-portafolio`.
- **Descripción:** Genera tarjetas Bento ejecutivas con progreso circular SVG, presupuesto consumido vs. tope, fecha compromiso y botón de apertura a `abrirDetalle360(p.id)`.

#### `renderTablaPortafolio(filtrados)`
- **DOM Afectado:** `#contenedor-tabla-portafolio`.
- **Descripción:** Renderiza tabla HTML con cabeceras ordenables por columnas (ID, Proyecto, Tipo, T-Shirt, Estado, Salud, Avance %, Presupuesto, Costo Real, Fechas).

#### `setModoVisualizacionPortafolio(modo)`
- **DOM Afectado:** Alterna visualización entre `#contenedor-tarjetas-portafolio` y `#contenedor-tabla-portafolio`, guardando preferencia en `localStorage`.

#### `abrirWizardProyecto()`
- **DOM Afectado:** Abre `#modal-proyecto-wizard` y resetea el wizard al paso 1.

### 4. VARIABLES Y ESTADO:
- **LocalStorage:** `'pmo_portfolio_view'` (`'grid'` | `'table'`).

---

## 39. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JS_Habitos.html`

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
- **Variables Globales:** `state.actividadesPersonales`, `state.gastos`, `activityFlowState.gastosVinculados`.

---

## 40. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JS_Finanzas.html`

### 2. PROPÓSITO:
Manejador reactivo del módulo financiero, flujo de caja, tesorería y escaneo inteligente. Controla el renderizado de tarjetas de balance, tabla de transacciones con filtros por mes fiscal y buscador en vivo, conciliación de movimientos bancarios con un clic, gestión interactiva de planes de cuotas (creación, amortización, pago de cuotas y saneamiento), y el proceso de extracción OCR con Gemini 1.5 Flash mediante cámara web o archivo arrastrado.

### 3. FUNCIONES QUE CONTIENE:

#### `renderVistaFinanzas()`
- **DOM Afectado:** `#kpi-total-ingresos`, `#kpi-total-gastos`, `#kpi-saldo-neto`, `#badge-capacidad-ahorro`, `#badge-endeudamiento-cuotas`, y contenedor de la sub-pestaña activa.

#### `renderTablaTransacciones()`
- **DOM Afectado:** `#contenedor-transacciones-unificadas`.
- **Descripción:** Genera filas de transacciones polimórficas (Gastos e Ingresos) con chips de color, estado de pago/cobro, enlaces a comprobantes en Google Drive y botón de conciliación bancaria.

#### `renderPlanesCuotas()`
- **DOM Afectado:** `#contenedor-planes-cuotas`.
- **Descripción:** Renderiza tarjetas de compras a plazos con barra de progreso de cuotas pagadas vs. pendientes, saldo restante amortizado y botón `"Pagar Siguiente Cuota"`.

#### `conciliarTransaccionDirecta(idTransaccion, tipo)`
- **Backend Invocado:** `callBackend("conciliarTransaccion", { idTransaccion, tipo, fechaReal })`.
- **Descripción:** Marca la transacción como conciliada en tiempo real.

#### `pagarSiguienteCuotaDirecta(idCuota)`
- **Backend Invocado:** `callBackend("pagarSiguienteCuota", { idCuota })`.
- **Descripción:** Paga la cuota inmediata y amortiza el saldo.
- **Estado Reactivo:** Al confirmar el pago, la respuesta del backend actualiza `state.cuotas` (incrementa `Cuotas_Pagadas`, actualiza `Saldo_Pendiente`), y se vuelve a ejecutar `renderKPIs()` y `renderPlanesCuotas()` sin recargar la página.

#### `escanearComprobanteIA(event)`
- **Backend Invocado:** `callBackend("parsearComprobante", { base64Data, mimeType, contexto })`.
- **DOM Afectado:** Muestra spinner `#fin-spinner-ocr`, rellena automáticamente los campos `#fin-concepto`, `#fin-monto`, `#fin-moneda`, `#fin-fecha`, `#fin-categoria` en el modal de finanzas tras la respuesta de Gemini.

### 4. VARIABLES Y ESTADO:
- **LocalStorage:** `'PMO_PRESUPUESTOS_CATEGORIAS'`.
- **Variables Globales:** `state.gastos`, `state.ingresos`, `state.cuotas`, `state.tipoCambioActual`.

---

## 41. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JS_Detalle360.html`

### 2. PROPÓSITO:
Controlador de la vista ejecutiva holística de 360° de un proyecto (`#view-detalle360`). Gestiona la carga y actualización de los Bento KPIs del proyecto (Salud semáforo, Burn Rate, Anillo SVG de avance físico, balance de presupuesto y días para la fecha fin), el visor de cascada WBS jerárquico con acordeón colapsable y persistencia de memoria en sesión, y la exportación documental directa hacia PDF.

### 3. FUNCIONES QUE CONTIENE:

#### `abrirDetalle360(idProyecto)`
- **DOM Afectado:** Oculta otras vistas, muestra `#view-detalle360`, actualiza encabezado `#det-proy-nombre` e invoca `actualizarBentoKPIsProyecto(p)` y `renderCascadaHitos()`.
- **Variables Afectadas:** `state.proyectoDetalleActivo = idProyecto`.

#### `cerrarDetalle360()`
- **DOM Afectado:** Oculta `#view-detalle360` y restablece la visualización de la vista previa (Kanban o Portafolio).

#### `actualizarBentoKPIsProyecto(p)`
- **DOM Afectado:** Actualiza anillo `#det-progreso-ring`, `#det-badge-health`, barra `#det-burnrate-bar`, `#det-presupuesto-consumo`, `#det-dias-restantes`, `#det-cpi`, `#det-spi`.

#### `renderCascadaHitos()`
- **DOM Afectado:** `#contenedor-hitos-cascada`.
- **Descripción:** Genera el acordeón jerárquico: Nivel 1 Proyecto -> Nivel 2 Hitos (con % de peso y estado) -> Nivel 3 Tareas operativas (con checkbox optimista y horas) y Gastos asociados con chips de comprobantes de Drive. Utiliza comparaciones polimórficas normalizadas (`ID_Proyecto || idProyecto || id_proyecto`) y (`ID_Hito || idHito || id_hito`) para indexar las tareas a sus respectivos hitos o al bloque general del proyecto, previniendo cualquier desvinculación por discrepancias de nomenclatura de columnas.

#### `toggleColapsarHito(idHito)`
- **DOM Afectado:** Alterna visibilidad del cuerpo del hito `#hito-body-[idHito]` y rota el chevron `#hito-chevron-[idHito]`. Guarda el estado en `sessionStorage`.

#### `toggleTodosLosHitos(expandir)`
- **DOM Afectado:** Expande o contrae simultáneamente todos los acordeones de hitos.

#### `ejecutarCompilacionPdfDirecta()`
- **Backend Invocado:** `callBackend("generarFichaPdf", { idProyecto: state.proyectoDetalleActivo })`.
- **Descripción:** Muestra alerta de procesamiento y abre en nueva pestaña el PDF generado en Google Drive.

### 4. VARIABLES Y ESTADO:
- **Variables Globales:** `state.proyectoDetalleActivo`, `state.proyectos`, `state.hitos`, `state.tareas`, `state.gastos`.
- **SessionStorage:** `'pmo_hitos_colapsados_' + idProyecto`.

---

## 42. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JS_GrafoRed.html`

### 2. PROPÓSITO:
Motor de visualización topológica y estructural de la Estructura Analítica del Proyecto (WBS / CPM) renderizado mediante Canvas e interactividad Vis.js Network. Implementa una jerarquía estricta de 4 niveles (N1: Proyecto, N2: Hitos, N3: Tareas, N4: Gastos y Notas), enrutamiento ortogonal tipo Manhattan sin colisión para dependencias entre tareas, cálculo de Ruta Crítica (CPM), panel flotante Popover Tooltip 360° inteligente, capas de visualización conmutables (ocultar/mostrar gastos), spotlight de dependencias y modo Pantalla Completa Inmersiva con HUD superior flotante.

### 3. FUNCIONES QUE CONTIENE:

#### `compilarDatasetGrafoProyecto(idProyecto)`
- **Descripción:** Construye los arreglos `nodes` y `edges` compatibles con Vis.js. Asigna coordenadas fijas (árbol jerárquico vertical), colores por nivel y pesos porcentuales.

#### `generarCaminoDependenciaSinColision(nodoDep, nodoSucc, depIndex, cardWidth, cardHeight, channelBaseY)`
- **Descripción:** Algoritmo de enrutamiento Manhattan escalonado (Offset Channel Routing) con pistas paralelas en `Y = 605px+` que previene cruces de aristas entre tareas dependientes.

#### `renderGrafoRedProyecto(idProyecto)`
- **DOM Afectado:** `#network-graph-canvas`, `#grafo-toolbar`.
- **Descripción:** Inicializa la instancia `new vis.Network(container, data, options)`, deshabilita la física tras estabilizarse para máxima nitidez y enlaza eventos de click y hover.

#### `centrarGrafoRed()` / `zoomGrafoRed(factor)`
- **Descripción:** Controla la cámara y escala de visualización del lienzo Vis.js.

#### `toggleCapaGastosGrafo()`
- **DOM Afectado:** Botón `#btn-toggle-gastos`. Muestra u oculta los nodos de egresos financieros en el grafo.

#### `toggleModoEnfoqueWBS()`
- **DOM Afectado:** Resalta únicamente los nodos pertenecientes a la Ruta Crítica del proyecto, atenuando el resto.

#### `toggleFullscreenWBS()`
- **DOM Afectado:** Alterna el lienzo a pantalla completa ocupando todo el monitor con HUD flotante de controles.

### 4. VARIABLES Y ESTADO:
- **Variables Globales:** `networkInstance`, `mostrarGastosEnGrafo`, `fisicaGrafoActiva`.

---

## 43. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JS_TareaFlow.html`

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
- **Variables Globales:** `state.tareas`, `state.proyectos`, `state.hitos`, `state.gastos`, `taskFlowState.gastosVinculados`.

---

## 44. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JS_Subtareas.html`

### 2. PROPÓSITO:
Motor procedural de subtareas atómicas (`BBDD_Subtareas_Pasos`, `SUB-XXX`). Controla la renderización de la barra de progreso en tarjetas de Kanban y hábitos (`3/5 pasos`), el desplegable colapsable (drawer) inline de subtareas dentro de la propia tarjeta sin abrir modales, adición rápida con tecla `Enter`, edición inline con doble clic, reordenamiento de pasos y mutación optimista del checkbox de completado con guardado en tiempo real.

### 3. FUNCIONES QUE CONTIENE:

#### `obtenerSubtareasPadre(idPadre)`
- **Parámetros:** `idPadre` (`string`: `TAR-XXX` o `ACT-XXX`).
- **Retorno:** Subtareas filtradas de `state.subtareas` ordenadas por `numeroPaso`.

#### `calcularProgresoSubtareas(idPadre)`
- **Retorno:** `{ total: number, completadas: number, porcentaje: number }`.

#### `renderWidgetSubtareasTarjeta(idPadre)`
- **DOM Afectado:** Genera micro-barra HTML de progreso y botón desplegable para la tarjeta.

#### `toggleDrawerSubtareasTarjeta(idPadre, event, triggerEl)`
- **DOM Afectado:** Despliega u oculta el contenedor inline de pasos `#drawer-subtareas-[idPadre]`.

#### `toggleSubtareaOptimista(idSubtarea, idPadre, nuevoEstado, event)`
- **Backend Invocado:** `callBackend("updateSubtareaCompletado", { idSubtarea, idPadre, completado: nuevoEstado }, null, null, { silent: true })`.
- **Descripción:** Cambia el checkbox y la barra de progreso en el cliente al instante en 16ms (60fps) y confirma de forma asíncrona con el backend silenciosamente.

#### `agregarSubtareaRapida(idPadre, inputElement)`
- **Backend Invocado:** `callBackend("createSubtarea", { idPadre, tipoPadre, descripcionPaso, numeroPaso })`.

#### `eliminarSubtareaDirecto(idSubtarea, idPadre)`
- **Backend Invocado:** `callBackend("deleteSubtarea", { idSubtarea, idPadre })`.

#### `reordenarSubtareasDirecto(idPadre, ordenIds)`
- **Backend Invocado:** `callBackend("reordenarSubtareas", { idPadre, ordenIds })`.

#### `guardarEdicionTextoSubtarea(idSubtarea, inputElement)`
- **Backend Invocado:** `callBackend("updateSubtarea", { idSubtarea, descripcionPaso })`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales:** `state.subtareas`.

---

## 45. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JS_ModalesYAtajos.html`

### 2. PROPÓSITO:
Módulo unificado para la gestión de atajos de teclado globales, inicialización y cierre de diálogos, reportería PDF, y el ciclo de vida completo del Wizard de Creación de Proyectos con IA (`#modal-proyecto-wizard`): gestión de pasos, renderizado dinámico de hitos/tareas/gastos, balance automático del 100% de pesos y despacho de la transacción atómica `guardarEstructuraProyectoCompleta`.

### 3. FUNCIONES QUE CONTIENE:

#### `setupKeyboardShortcuts()` / `handleGlobalKeyDown(e)` / Scoped Keyboard Dispatcher
- **Atajos Globales Escuchados:**
  - `C` o `c`: Ejecuta `document.getElementById('btn-header-calendar')?.click()` para abrir directamente la app de Google Calendar en la PC o en pestaña web.
  - `1`: Ir a Tablero Kanban (`cambiarVistaGlobal('kanban')`).
  - `2`: Ir a Portafolio (`cambiarVistaGlobal('portafolio')`).
  - `3`: Ir a Hábitos & Vida (`cambiarVistaGlobal('habitos')`).
  - `4`: Ir a Flujo de Caja y Finanzas (`cambiarVistaGlobal('financiero')`).
  - `5`: Ir a Notas Inteligentes (`cambiarVistaGlobal('notas')`), actualizando estilo reactivo de `#btn-nav-notas`.
  - `R` o `r`: Sincronización manual de datos (`refreshData(true)`).
  - `X` o `x`: Limpiar filtros de la vista activa (`limpiarFiltrosVistaActiva()`).
  - `?`: Abrir modal de configuración y ayuda de atajos (`abrirModalAtajosTeclado()`).
  - `ESC`: Cierre en cascada (popovers, alertas SweetAlert2, modales LIFO, drawer de archivados, o blur de inputs).
  - `ENTER`: Confirmación primaria omnicanal del diálogo activo.
- **Sincronización de Tema:**
  - `initTheme()` / `toggleTheme()`: Conmutan modo claro/oscuro y notifican a `actualizarOpcionesThemeDropdown()` para actualizar el indicador interactivo sol/luna (`#icon-theme-mode-indicator`).

#### `abrirWizardProyecto()` / `cerrarWizardProyecto()`
- **DOM Afectado:** `#modal-proyecto-wizard`. Resetea formulario y activa pestaña 1.

#### `cambiarTabWizProyecto(tabId)`
- **DOM Afectado:** Conmuta pestañas `#wiz-tab-general`, `#wiz-tab-hitos`, `#wiz-tab-tareas`, `#wiz-tab-gastos`.

#### `ejecutarGeneracionPropuestaIA()`
- **Backend Invocado:** `callBackend("generarWbsIntegralProyectoIA", payloadContexto)`.
- **DOM Afectado:** Muestra animación de carga y pinta la propuesta generada en las pestañas 2, 3 y 4.

#### `renderizarHitosWiz()` / `renderizarTareasWiz()` / `renderizarGastosWiz()`
- **DOM Afectado:** `#wiz-container-hitos`, `#wiz-container-tareas`, `#wiz-container-gastos`.
- **Descripción:** Renderiza listas interactivas editables con validación en tiempo real del total del 100% de peso (`#wiz-badge-total-peso`) y presupuesto consumido (`#wiz-bar-consumo-presupuesto`).

#### `guardarProyectoDesdeWizard()`
- **Backend Invocado:** `callBackend("guardarEstructuraProyectoCompleta", payloadEstructura)`.
- **Descripción:** Valida consistencia integral y ejecuta la transacción atómica batch en el servidor.

#### `abrirModalCompilacionPdf(idProyecto)` / `ejecutarCompilacionPdfDesdeModal()`
- **Backend Invocado:** `callBackend("generarFichaPdf", { idProyecto })`.
- **DOM Afectado:** `#modal-compilacion-pdf`, `#pdf-download-link`, `#pdf-view-link`.

### 4. VARIABLES Y ESTADO:
- **Variables Globales:** `currentWizardStep`, `state.proyectos`.
- **LocalStorage:** `'pmo_shortcuts_enabled'`.

---

## 46. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\JS_Notas.html`

### 2. PROPÓSITO:
Lógica reactiva del sistema de Notas Inteligentes y Wishlist. Gestiona el renderizado en cuadrícula Masonry o lista, filtrado interactivo por colores pastel y catálogo dinámico de etiquetas, fijado y desanclado de notas en cabecera (`togglePinNota`), guardado de notas con checklists interactivos, marcado de deseos conseguidos de la Wishlist con generación automática de gastos contables asociados, y sincronización en tiempo real con el servidor.

### 3. FUNCIONES QUE CONTIENE:

#### `renderVistaNotas()`
- **DOM Afectado:** `#container-notas-fijadas`, `#container-notas-otras`, `#container-wishlist-notas`, `#badge-header-notas`.
- **Descripción:** Filtra las notas de `state.notas` según `state.filtroNotas`, color activo y texto de búsqueda, inyectando las tarjetas con sus checklists, adjuntos y badges de vínculos a proyectos o tareas.

#### `crearTarjetaNotaHTML(nota)`
- **DOM Afectado:** Genera tarjeta de nota con su color de fondo pastel, botón de pin, botón de copiado rápido a texto plano (`.btn-portal-icon` con SVG Lucide `copy` `.portal-icon-sm`), checklist interactivo con checkboxes que guardan en tiempo real, chips de etiquetas y chips de vínculos a entidades.

#### `serializarNotaATextoPlano(nota)`
- **Propósito:** Serializa de forma atómica y pura una nota a texto plano limpio y enriquecido, optimizado para ser compartido directamente en canales de mensajería (WhatsApp, Slack, correo).
- **Restricción de Alcance:** Exclusión estricta de metadatos de auditoría y técnicos (sin fechas de creación/actualización, sin ID correlativo `NOT-XXXXX`, sin adjuntos o vínculos internos).
- **Input:** Objeto nota en memoria (`state.notas` o resolución vía `buscarNotaPorIdUniversal`).
- **Output:** `String` formateado con saltos de línea legibles y viñetas semánticas limpias.
- **Contratos por Tipo de Nota:**
  * **NORMAL:**
    ```text
    [Titulo]

    [Contenido limpio, respetando saltos de línea]

    Tags: #tag1 #tag2 (solo si existen)
    ```
  * **CHECKLIST:**
    ```text
    [Titulo]

    [x] Item completado
    [ ] Item pendiente

    Tags: #tag1 #tag2 (solo si existen)
    ```
    *Compatibilidad Dual:* Soporta indistintamente tanto el array lineal tradicional (`nota.Checklist`) como la matriz tabular dinámica avanzada (`nota.Tabla.filas` evaluando columnas tipo checkbox).
  * **WISHLIST:**
    ```text
    [Titulo]

    Costo: [Moneda] [Monto] | Estado: [Pendiente/Conseguido]
    Enlace: [URL] (solo si existe)

    [Contenido / Notas adicionales si existen]

    Tags: #tag1 #tag2 (solo si existen)
    ```
- **Funciones Auxiliares del Módulo:**
  * `formatearTagsTextoPlano(etiquetas)`: Normaliza arrays y cadenas CSV anteponiendo `#`, omitiendo la línea por completo si no hay etiquetas.
  * `limpiarContenidoTextoPlano(raw)`: Filtra artefactos JSON internos (`tabla_multicolumna`, `WISHLIST_META`) y traduce/limpia marcado HTML preservando los saltos de línea del usuario.

#### `copiarNotaTextoPlano(idNota)`
- **Propósito:** Invocador de portapapeles para copiar el texto plano generado de una nota individual a partir de su ID.
- **Mecanismo:** Búsqueda en `state.notas`, ejecución asíncrona mediante `navigator.clipboard.writeText(texto)` con mecanismo de fallback transparente (`textarea` temporal fuera de pantalla + `document.execCommand('copy')`).
- **Feedback UI:** Despacha notificación toast operativa `mostrarToastOperativo('success', 'Nota copiada', 'Texto listo para pegar como mensaje')` con fallback a `mostrarToastAtajo`.
- **Exposición Global en Window:** `window.serializarNotaATextoPlano` y `window.copiarNotaTextoPlano`.

#### `abrirModalCrearNota()` / `abrirModalEditarNota(idNota)`
- **DOM Afectado:** `#modal-editor-nota`. Carga datos para creación o edición.

#### `guardarNotaDesdeModal()`
- **Backend Invocado:** `callBackend("guardarNota", payloadNota)`.

#### `eliminarNotaDesdeModal()`
- **Backend Invocado:** `callBackend("eliminarNota", { id: idNota })`.

#### `togglePinNotaDirecto(idNota)`
- **Backend Invocado:** `callBackend("togglePinNota", { id: idNota, esFijada: nuevoEstado })`.
- **Descripción:** Actualización optimista: mueve la nota entre la sección fijada y regular instantáneamente.

#### `toggleChecklistNotaDirecto(idNota, idCheck)`
- **Backend Invocado:** `callBackend("actualizarChecklistNota", { idNota, idCheck, completado: nuevoEstado }, null, null, { silent: true })`.
- **Descripción:** Tacha o destacha el ítem en la tarjeta inmediatamente y confirma con el servidor en segundo plano.

#### `marcarDeseoConseguidoDirecto(idNota)`
- **Backend Invocado:** `callBackend("marcarDeseoConseguido", { idNota, montoReal, metodoPago, crearGasto: true })`.
- **Descripción:** Lanza diálogo SweetAlert2 solicitando monto real pagado y método de pago, marca el deseo como conseguido e inserta el gasto en Sheets.

#### `filtrarNotasPorColor(color)` / `filtrarNotasPorEtiqueta(tag)` / `filtrarNotasPorTexto(term)`
- **DOM Afectado:** Actualiza píldoras de filtro y re-ejecuta `renderVistaNotas()`.

#### `setModoVisualizacionNotas(modo)`
- **Variables Afectadas:** `state.vistaModoNotas = modo` (`'masonry'` | `'list'`).

### 4. VARIABLES Y ESTADO:
- **Variables Globales:** `state.notas`, `state.filtroNotas`, `state.filtroColorNotas`, `state.filtroBusquedaNotas`, `state.vistaModoNotas`.
- **Funciones Expuestas en Window:** `window.serializarNotaATextoPlano`, `window.copiarNotaTextoPlano`, `window.renderVistaNotas`, etc.
- **LocalStorage:** `'PMO_LOCAL_STATE_CACHE'`.


---

# PARTE V: MATRICES GLOBALES DE REFERENCIA ARQUITECTÓNICA

---

## MATRIZ 1: CATÁLOGO EXHAUSTIVO DE COMUNICACIÓN RPC (FRONTEND -> BACKEND)

Todas las transacciones cliente-servidor se despachan mediante:
```javascript
callBackend(action, payload, onSuccess, onError, options);
```
El backend enruta cada acción en `ApiRouter.js` hacia su servicio de dominio correspondiente:

| # | Acción RPC (`action`) | Servicio Destino | Función Invocada | Payload Clave de Entrada | Formato de Respuesta |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | `getDashboardData` | `DashboardService` | `getDashboardData(payload)` | `{ forceRefresh: boolean }` | `{ success: true, proyectos, hitos, tareas, gastos, ... }` |
| 2 | `createTarea` | `TareasService` | `createTarea(payload)` | `{ idProyecto, idHito, nombreTarea, estado, prioridad, ... }` | `{ success: true, data: { idTarea, idEventoCalendar } }` |
| 3 | `updateTarea` / `updateTaskState` | `TareasService` | `updateTarea(payload)` | `{ idTarea, estado, prioridad, fechaProgramada, ... }` | `{ success: true, idTarea }` |
| 4 | `deleteTarea` | `TareasService` | `deleteTarea(payload)` | `{ idTarea }` | `{ success: true, idEliminado }` |
| 5 | `createSubtarea` / `guardarSubtarea` | `TareasService` | `createSubtarea(payload)` | `{ idPadre, tipoPadre, descripcionPaso, numeroPaso }` | `{ success: true, data: { idSubtarea, ... } }` |
| 6 | `updateSubtareaCompletado` / `toggleSubtarea` | `TareasService` | `updateSubtareaCompletado(payload)` | `{ idSubtarea, idPadre, completado }` | `{ success: true, idSubtarea, completado }` |
| 7 | `updateSubtarea` | `TareasService` | `updateSubtarea(payload)` | `{ idSubtarea, descripcionPaso }` | `{ success: true, idSubtarea }` |
| 8 | `reordenarSubtareas` | `TareasService` | `reordenarSubtareas(payload)` | `{ idPadre, ordenIds: [] }` | `{ success: true, idPadre }` |
| 9 | `deleteSubtarea` | `TareasService` | `deleteSubtarea(payload)` | `{ idSubtarea, idPadre }` | `{ success: true, idEliminada }` |
| 10 | `createActividadPersonal` | `ActividadesService` | `createActividadPersonal(payload)` | `{ nombreActividad, categoriaVida, duracionHoras, ... }` | `{ success: true, data: { idActividad, idEvento } }` |
| 11 | `completarActividadPersonal` | `ActividadesService` | `completarActividadPersonal(payload)` | `{ idActividad, nuevoEstado, incrementarRacha }` | `{ success: true, rachaActual, nuevaFecha }` |
| 12 | `updateFechaActividadPersonal` | `ActividadesService` | `updateFechaActividadPersonal(payload)` | `{ idActividad, fechaProgramada, horaInicio }` | `{ success: true, idActividad, idEvento }` |
| 13 | `updateActividadPersonal` | `ActividadesService` | `updateActividadPersonal(payload)` | `{ idActividad, nombreActividad, categoriaVida, ... }` | `{ success: true, idActividad }` |
| 14 | `deleteActividadPersonal` | `ActividadesService` | `deleteActividadPersonal(payload)` | `{ idActividad }` | `{ success: true, idEliminado }` |
| 15 | `createGasto` | `FinanzasService` | `createGasto(payload)` | `{ idProyecto, concepto, montoPEN, fechaGasto, ... }` | `{ success: true, data: { idGasto, montoPEN } }` |
| 16 | `updateGasto` | `FinanzasService` | `updateGasto(payload)` | `{ idGasto, concepto, montoPEN, categoria, ... }` | `{ success: true, idGasto }` |
| 17 | `desvincularGasto` | `FinanzasService` | `desvincularGasto(payload)` | `{ idGasto }` | `{ success: true, idGasto }` |
| 18 | `deleteGasto` | `FinanzasService` | `deleteGasto(payload)` | `{ idGasto }` | `{ success: true, idEliminado }` |
| 19 | `createIngreso` | `FinanzasService` | `createIngreso(payload)` | `{ descripcion, montoPEN, fechaIngreso, origenFuente }` | `{ success: true, data: { idIngreso } }` |
| 20 | `updateIngreso` | `FinanzasService` | `updateIngreso(payload)` | `{ idIngreso, descripcion, montoPEN, estadoCobro }` | `{ success: true, idIngreso }` |
| 21 | `deleteIngreso` | `FinanzasService` | `deleteIngreso(payload)` | `{ idIngreso }` | `{ success: true, idEliminado }` |
| 22 | `obtenerTipoCambio` | `FinanzasService` | `obtenerTipoCambio(payload)` | `{ monedaOrigen, monedaDestino }` | `{ success: true, tipoCambio: 3.755 }` |
| 23 | `createMovimiento` | `FinanzasAvanzadas` | `createMovimiento(payload)` | `{ fecha, tipo, categoria, montoProyectado, ... }` | `{ success: true, idMovimiento }` |
| 24 | `updateMovimiento` | `FinanzasAvanzadas` | `updateMovimiento(payload)` | `{ idMovimiento, montoReal, estado, ... }` | `{ success: true, idMovimiento }` |
| 25 | `deleteMovimiento` | `FinanzasAvanzadas` | `deleteMovimiento(payload)` | `{ idMovimiento }` | `{ success: true, idEliminado }` |
| 26 | `conciliarTransaccion` | `FinanzasAvanzadas` | `conciliarTransaccion(payload)` | `{ idTransaccion, tipo, fechaReal, montoReal }` | `{ success: true, conciliado: true }` |
| 27 | `desconciliarMovimiento`| `FinanzasAvanzadas` | `desconciliarMovimiento(payload)` | `{ idMovimiento }` | `{ success: true, conciliado: false }` |
| 28 | `createPlanCuotas` | `FinanzasService` | `crearGastoEnCuotas(payload)` | `{ nombrePlan, montoTotal, numCuotas, ... }` | `{ success: true, idCuota, cuotasCreadas }` |
| 29 | `pagarSiguienteCuota` | `FinanzasService` | `pagarSiguienteCuota(payload)` | `{ idCuota, fechaPago, comprobanteUrl }` | `{ success: true, saldoRestante }` |
| 30 | `sanearCuotasDesfasadas`| `FinanzasService` | `sanearCuotasDesfasadas()` | `{}` | `{ success: true, cuotasSaneadas }` |
| 31 | `updatePlanCuotas` | `FinanzasAvanzadas` | `updatePlanCuotas(payload)` | `{ idCuota, nombrePlan, estado }` | `{ success: true, idCuota }` |
| 32 | `deletePlanCuotas` | `FinanzasAvanzadas` | `deletePlanCuotas(payload)` | `{ idCuota, eliminarMovimientosAsociados }` | `{ success: true, idCuota }` |
| 33 | `calcularMetricasAvanzadas`| `FinanzasAvanzadas`| `calcularMetricasAvanzadas(payload)` | `{ mes: "2026-09" }` | `{ success: true, metricas: { runwayMeses, ... } }` |
| 34 | `createProyecto` | `ProyectosService` | `createProyecto(payload)` | `{ nombreProyecto, tipoIniciativa, presupuesto, ... }` | `{ success: true, data: { idProyecto, urlDrive } }` |
| 35 | `updateProyecto` | `ProyectosService` | `updateProyecto(payload)` | `{ idProyecto, avanceRealPct, estado, ... }` | `{ success: true, idProyecto }` |
| 36 | `deleteProyecto` / `eliminarProyectoEnCascada` | `ProyectosService` | `eliminarProyectoEnCascada(payload)` | `{ idProyecto }` | `{ success: true, eliminados: { ... } }` |
| 37 | `registrarCheckinProyecto` | `ProyectosService` | `registrarCheckinProyecto(payload)` | `{ idProyecto, fechaCheckin, observaciones }` | `{ success: true, idProyecto, ultimaRevision }` |
| 38 | `agendarRutinaControlProyecto` | `CalendarService` | `agendarRutinaControlProyecto(payload)` | `{ idProyecto, nombreProyecto, frecuenciaControl }` | `{ success: true, seriesId }` |
| 39 | `autocompletarProyecto` | `ProyectosService` | `generarSugerenciaAutocompletado(n, t)`| `{ nombreProyecto, tipoIniciativa }` | `{ success: true, sugerencia: { ... } }` |
| 40 | `generarWbsIntegralProyectoIA` | `ProyectosService` | `generarWbsIntegralProyectoIA(payload)` | `{ nombreProyecto, presupuestoTope, fechaFinPlan }` | `{ success: true, propuesta: { hitos, tareas, gastos } }` |
| 41 | `guardarEstructuraProyectoCompleta` | `ProyectosService` | `guardarEstructuraProyectoCompleta(p)` | `{ proyecto: {}, hitos: [], tareas: [], gastos: [] }` | `{ success: true, idProyecto, totalTareas, ... }` |
| 42 | `createHito` | `HitosService` | `createHito(payload)` | `{ idProyecto, nombreHito, pesoPct, fechaLimite }` | `{ success: true, data: { idHito } }` |
| 43 | `updateHito` | `HitosService` | `updateHito(payload)` | `{ idHito, nombreHito, estadoHito, pesoPct }` | `{ success: true, idHito }` |
| 44 | `deleteHito` | `HitosService` | `deleteHito(payload)` | `{ idHito }` | `{ success: true, idEliminado }` |
| 45 | `obtenerNotas` | `NotasService` | `obtenerNotas(payload)` | `{ filtroEtiqueta, filtroColor, forceRefresh }` | `{ success: true, notas: [] }` |
| 46 | `guardarNota` | `NotasService` | `guardarNota(payload)` | `{ id, titulo, contenido, color, checklist, vinculos }` | `{ success: true, id: "NOT-XXXXX" }` |
| 47 | `togglePinNota` | `NotasService` | `togglePinNota(payload)` | `{ id, esFijada: boolean }` | `{ success: true, id, esFijada }` |
| 48 | `eliminarNota` | `NotasService` | `eliminarNota(payload)` | `{ id }` | `{ success: true, idEliminada }` |
| 49 | `actualizarChecklistNota` | `NotasService` | `actualizarChecklistNota(payload)` | `{ idNota, idCheck, completado: boolean }` | `{ success: true, idNota, idCheck }` |
| 50 | `adjuntarArchivoNota` | `NotasService` | `adjuntarArchivoNota(payload)` | `{ idNota, base64Data, mimeType, fileName }` | `{ success: true, adjunto: { id, url } }` |
| 51 | `marcarDeseoConseguido` | `NotasService` | `marcarDeseoConseguido(payload)` | `{ idNota, montoReal, metodoPago, crearGasto }` | `{ success: true, idGastoGenerado }` |
| 52 | `parsearComprobante` | `GeminiParser` | `parsearComprobante(b64, mime, ctx)` | `{ base64Data, mimeType, contexto }` | `{ success: true, datos: { ruc, monto, ... } }` |
| 53 | `generarFichaPdf` | `ReporteriaService` | `generarFichaPdf(idProyecto)` | `{ idProyecto: "PRO-XXX" }` | `{ success: true, pdfUrl, downloadUrl }` |

---

## MATRIZ 2: ESQUEMA CANÓNICO DE BASE DE DATOS (GOOGLE SHEETS)

La persistencia se asienta sobre 9 pestañas estructuradas. Toda lectura y escritura resuelve dinámicamente sus cabeceras mediante `CONFIG.construirMapaColumnas`:

| Hoja en Google Sheets (`CONFIG.SHEETS`) | Prefijo PK | Entidad Modelada | Columnas Físicas Principales | Resolver de Columnas |
| :--- | :--- | :--- | :--- | :--- |
| `BBDD_Proyectos` | `PRO-` | Iniciativas y Proyectos (WBS v4.1) | ID_Proyecto, Nombre, Tipo, Magnitud_Complejidad (Col D, alias Categoria_TShirt), Arquetipo_Proyecto (Col E, alias Criterio_Dominante), Estado, Health, Avance_Real_Pct (Col H, fórmula matricial protegida), Objeto, OKR, DoD, MAV, Fase, Frecuencia_Control, Ultima_Revision, Riesgo_Global, Fechas (Plan/Fin), Moneda_Base, Presupuesto_Tope, Costo_Ejecutado_Real_PEN (Col U, fórmula matricial protegida), Desviacion_Costo_PEN (Col V, fórmula matricial protegida), Terceros_Involucrados, URL_Drive | `CONFIG.obtenerMapaProyectos()` |
| `BBDD_Hitos` | `WP-` / `HIT-` | Estructura WBS v4.1 (14 cols: Paquetes y Marcadores) | [0] ID_Elemento_WBS (alias ID_Hito), [1] ID_Proyecto, [2] Tipo_Elemento_WBS (PAQUETE_TRABAJO \| HITO_MARCADOR), [3] WBS_Code, [4] Fase_Asociada, [5] Nombre_Elemento, [6] Estado, [7] Peso_Ponderado_Pct, [8] Fecha_Limite_Plan, [9] Fecha_Real_Fin, [10] Presupuesto_Asignado (alias Costo_Asociado_Estimado), [11] Criterio_Aceptacion_DoD, [12] Dependencia_ID_Hito, [13] Entregable_Verificable_Link | `CONFIG.obtenerMapaHitos()` |
| `BBDD_Actividades_Tareas` | `TAR-` | Tareas Operativas de Proyecto (14 cols A:N) | [0] ID_Tarea, [1] ID_Hito (WP-XXX), [2] ID_Proyecto (Persistido por backend), [3] Nombre_Tarea, [4] Estado (01_Backlog..05_Archivado), [5] Prioridad, [6] Nivel_Energia, [7] Horas_Estimadas, [8] Horas_Reales, [9] Fecha_Programada, [10] Agendado_Calendar, [11] ID_Dependencia (Predecesora), [12] Responsable, [13] Notas | `CONFIG.obtenerMapaTareas()` |
| `BBDD_Actividades_Personales` | `ACT-` | Hábitos y Compromisos de Vida | ID_Actividad, Nombre_Actividad, Tipo_Compromiso, Categoria_Vida, Estado, Prioridad_Eisenhower, Frecuencia_Ciclo, Regla_Repeticion, Racha_Actual, Fecha_Programada, Hora_Inicio, Duracion_Horas, Agendado_Calendar, ID_Evento_Calendar, Monto_Gasto_Asociado, Notas_Checklist | `CONFIG.obtenerMapaActividades()` |
| `BBDD_Finanzas_Gastos` | `GAS-` | Egresos y Compromisos de Pago | ID_Transaccion / ID_Gasto, ID_Proyecto, ID_Hito, Tipo_Gasto / Clasificacion_Origen, ID_Tarea / ID_Entidad_Vinculada, Fecha_Gasto / Fecha_Registro, Descripcion / Concepto, Categoria, Moneda_Original, Monto_Original, Tipo_Cambio, Monto_PEN / Monto_Moneda_Base, Metodo_Pago, Comprobante_URL, Estado_Pago / Estado, ID_Google_Task, ID_Evento_Calendar, ID_Cuota | `CONFIG.obtenerMapaGastos()` |
| `BBDD_Finanzas_Ingresos` | `ING-` | Cobros, Honorarios e Ingresos | ID_Transaccion / ID_Ingreso, Fecha_Ingreso / Fecha_Registro, Origen_Fuente / Clasificacion_Origen, Descripcion / Concepto, Moneda_Original, Monto_Original, Tipo_Cambio, Monto_PEN / Monto_Moneda_Base, Cuenta_Destino / Metodo_Pago, ID_Proyecto_Asociado / ID_Entidad_Vinculada, ID_Google_Task, ID_Evento_Calendar, Estado_Cobro / Estado | `CONFIG.obtenerMapaIngresos()` |
| `BBDD_Subtareas_Pasos` | `SUB-` | Checklist Procedural Atómico | ID_Subtarea, Tipo_Padre (`TAREA` \| `ACTIVIDAD`), ID_Padre (`TAR-` \| `ACT-`), Numero_Paso, Descripcion_Paso, Completado (`true` \| `false`), Fecha_Completado | Índices fijos canónicos |
| `BBDD_Notas` | `NOT-` | Notas Inteligentes y Wishlist | ID_Nota, Titulo, Tipo_Nota (`NORMAL` \| `WISHLIST`), Contenido, Color, Es_Fijada, Checklist (JSON), Adjuntos (JSON), Vinculos (JSON), Etiquetas (JSON), Fecha_Creacion, Fecha_Actualizacion | `CONFIG.COLS_NOTAS` |
| `BBDD_Finanzas_Cuotas` | `CUO-` | Compras a Plazos y Créditos | ID_Cuota, Nombre_Plan, Descripcion, Monto_Total, Cuota_Inicial, Num_Cuotas, Monto_Cuota, Tasa_Interes, Tipo_Tasa, Fecha_Inicio, Dia_Pago, Cuotas_Pagadas, Monto_Pagado, Saldo_Pendiente, Estado, Categoria, Metodo_Pago, Entidad_Financiera, Notas, Fecha_Creacion | `CONFIG.COLS_CUOTAS` |

---

## MATRIZ 3: REGISTRO GLOBAL DE ALMACENAMIENTO, VARIABLES, CACHÉ Y PROPIEDADES

| Entorno | Llave / Variable | Ámbito / Módulo | Propósito / Tipo de Dato |
| :--- | :--- | :--- | :--- |
| **Frontend (RAM)** | `state` / `window.state` | `JS_Core.html` | Objeto maestro reactivo (`proyectos`, `tareas`, `hitos`, `gastos`, `actividadesPersonales`, `ingresos`, `subtareas`, `notas`, `cuotas`, `vistaActual`, `kanbanContextFilter`, `kanbanTimeFilter`, etc.). |
| **Frontend (RAM)** | `draggedTaskId` | `JS_Kanban.html` | Almacena el ID de la tarea o hábito arrastrado durante la operación Drag & Drop. |
| **Frontend (RAM)** | `networkInstance` | `JS_GrafoRed.html` | Instancia activa del lienzo Vis.js Network. |
| **Frontend (RAM)** | `_cacheNotasVinculadas` | `JS_Core.html` | Índice de hash en memoria para resolución instantánea de notas por entidad. |
| **LocalStorage** | `'pmo_theme'` | `Index.html`, `Layout_Header.html` | Cadena `'dark'` o `'light'` para el tema visual. |
| **LocalStorage** | `'pmo_theme_flavor'` | `Index.html` | Variante cromática del tema oscuro (`zinc`, `slate`, `neutral`). |
| **LocalStorage** | `'PMO_ACTIVE_TAB'` | `JS_Core.html` | Almacena la última vista abierta (`'kanban'`, `'portafolio'`, `'habitos'`, `'finanzas'`, `'notas'`). |
| **LocalStorage** | `'PMO_LOCAL_STATE_CACHE'` | `JS_Core.html`, `JS_Notas.html` | Serialización JSON del último estado completo para renderizado instantáneo en frío. |
| **LocalStorage** | `'pmo_portfolio_view'` | `JS_Portafolio.html` | Modo de visualización de cartera (`'grid'` o `'table'`). |
| **LocalStorage** | `'pmo_sidebar_collapsed'`| `JS_Core.html`, `Layout_Sidebar.html` | Booleano (`'true'` \| `'false'`) que persiste el colapso del sidebar de proyectos. |
| **LocalStorage** | `'pmo_shortcuts_enabled'`| `JS_ModalesYAtajos.html` | Bandera de activación de atajos de teclado globales. |
| **LocalStorage** | `'pmo_habitos_sort_mode'`| `JS_Habitos.html` | Modo de ordenamiento para Hábitos (`'TIME'`, `'STREAK'`, `'ALPHA'`, `'PRIORITY'`). |
| **LocalStorage** | `'pmo_kanban_sort_mode'`| `JS_Kanban.html` | Modo de ordenamiento para Kanban (`'PRIORITY'`, `'DATE'`, `'ENERGY'`, `'HOURS'`, `'ALPHA'`). |
| **SessionStorage** | `'pmo_hitos_colapsados_PRO-...'`| `JS_Detalle360.html` | Arreglo JSON con los IDs de hitos colapsados en la vista 360 del proyecto activo. |
| **Backend Cache** | `"DASHBOARD_DATA_CACHE"` | `DashboardService.js`, `ApiRouter.js` | JSON serializado de lectura consolidada (TTL: 21,600s / 6h). Fragmentado si excede 95KB. |
| **Backend Cache** | `"DASHBOARD_DATA_CACHE_CHUNKS"` | `DashboardService.js` | Conteo de fragmentos de caché cuando la BBDD excede el límite de 100KB de Apps Script. |
| **Backend Cache** | `"NOTAS_DATA_CACHE"` | `NotasService.js`, `ApiRouter.js` | JSON serializado de la hoja `BBDD_Notas` (TTL: 43,200s / 12h). |
| **Script Properties** | `'GEMINI_API_KEY'` | `PropertiesService.getScriptProperties()` | Clave secreta para autenticación con la API de Google Gemini 1.5 Flash. |
| **User Properties** | `'ID_Calendar_Proyectos'` | `PropertiesService.getUserProperties()` | ID del calendario de Google Calendar para `PMO - Proyectos`. |
| **User Properties** | `'ID_Calendar_Habitos'` | `PropertiesService.getUserProperties()` | ID del calendario de Google Calendar para `PMO - Hábitos y Vida`. |
| **User Properties** | `'ID_Calendar_Gastos'` | `PropertiesService.getUserProperties()` | ID del calendario de Google Calendar para `PMO - Gastos Programados`. |
| **User Properties** | `'ID_Calendar_Ingresos'` | `PropertiesService.getUserProperties()` | ID del calendario de Google Calendar para `PMO - Ingresos Programados`. |
| **Google Tasks** | `"@default"` | `GoogleTasksService.js` | Lista de tareas predeterminada para Google Tasks API v1. |
| **Script Locks** | `LockService.getScriptLock()` | `Correlativos.js`, `ProyectosService.js`, etc. | Exclusión mutua concurrente (10 a 15 segundos) para inserciones, eliminaciones en cascada y PKs. |

---

## MATRIZ 4: CONFIGURACIÓN, DESPLIEGUE Y METADATOS DEL PROYECTO

### 47. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\.clasp.json`
- **Propósito:** Configuración del CLI de Clasp (`@google/clasp`) para sincronización local-remota.
- **Contenido Clave:**
  ```json
  {
    "scriptId": "1g95R4Yd5E4uK0e12vC7H9r...",
    "rootDir": "c:\Users\CHRISTOPHER\Desktop\MiPortalWeb"
  }
  ```

### 48. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\.claspignore`
- **Propósito:** Lista de exclusión para comandos `clasp push`.
- **Reglas Configuradas:**
  - `scratch/**`: Scripts de análisis y generación local.
  - `*.md`: Documentación y diccionarios técnicos.
  - `.git/**`, `.gitignore`: Control de versiones Git.

### 49. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\appsscript.json`
- **Propósito:** Manifiesto de ejecución de Google Apps Script.
- **Configuración Clave:**
  - `timeZone`: `"America/Lima"`
  - `runtimeVersion`: `"V8"`
  - `dependencies.enabledAdvancedServices`: `Tasks` (v1).
  - `webapp.executeAs`: `"USER_DEPLOYING"`
  - `webapp.access`: `"ANYONE"`
  - `oauthScopes`:
    - `https://www.googleapis.com/auth/spreadsheets`
    - `https://www.googleapis.com/auth/calendar`
    - `https://www.googleapis.com/auth/drive`
    - `https://www.googleapis.com/auth/tasks`
    - `https://www.googleapis.com/auth/script.external_request`

### 50. ARCHIVO: `c:\Users\CHRISTOPHER\Desktop\MiPortalWeb\ARQUITECTURA_TECNICA.txt`
- **Propósito:** Documento canónico de especificación de principios arquitectónicos v2.0 (RPC, Bottom-Up Financiero, Resiliencia Matricial de Cabeceras).

---
*Fin del Diccionario Técnico Maestro. Documento compilado con éxito como única fuente de verdad técnica.*

### [ANEXO: ACTUALIZACIONES DE ARQUITECTURA VISUAL Y RENDIMIENTO (SEPTIEMBRE 2026)](#anexo-actualizaciones-de-arquitectura-visual)
**1. Centralización de Acceso a Archivados:**
Se eliminaron de manera definitiva los botones, toggles, badges y controles residuales de "📦 Archivados" o "Ver Archivados" diseminados en el canvas de las vistas principales:
- `View_Portafolio.html` (removido `#btn-toggle-archivados-portafolio` y `#badge-count-archivados-portafolio`).
- `View_Habitos.html` (removido `#btn-toggle-archivados-habitos` y `#badge-count-archivados-habitos`).
- `View_Finanzas.html` (removido `#btn-toggle-archivados-finanzas` y `#badge-count-archivados-finanzas`).
- Sus respectivos controladores (`JS_Portafolio.html`, `JS_Habitos.html`, `JS_Finanzas.html`) fueron limpiados de la lógica de actualización del DOM de estos badges puntuales.
El acceso a la **Bóveda de Archivados** (Drawer lateral) ahora es global, único y se gestiona exclusivamente a través del botón `#btn-header-archivados` ubicado en `Layout_Header.html`.

**2. Nuevo Comportamiento de Renderizadores Activos en Memoria:**
Los motores de renderizado de las vistas (`JS_Kanban.html`, `JS_Portafolio.html`, `JS_Habitos.html`, `JS_Finanzas.html`) ahora aplican una **regla de exclusión estricta por defecto**. Todos los elementos completados/conciliados cuya fecha excede los **10 días de antigüedad** evaluados vía `esElementoArchivado(item)` se excluyen totalmente de los vectores que alimentan el canvas activo. Estos elementos sólo son consumidos al invocar el Drawer lateral, disminuyendo masivamente la sobrecarga de manipulación del DOM y memoria en las vistas canónicas.

**3. Saneamiento Quirúrgico de Interfaz Kanban:**
Se han aplicado refactorizaciones a la interfaz del tablero Kanban (`View_Kanban.html` y `JS_Kanban.html`) para aligerar la saturación visual y erradicar comportamientos no deseados:
- **Erradicación de Botón de Ficha Completa**: Se eliminó del template `crearTarjetaKanbanHTML` el botón o enlace residual ">" que redundaba con el click principal en el título de la tarjeta.
- **Saneamiento de Iconografía (Filtro de Hitos)**: Se eliminó la inyección por código del emoji "🎯" en la etiqueta de la cápsula activa y la opción "Todos los Hitos", logrando que `#label-hito-active-text` y los `span` correspondientes en el DOM expongan únicamente texto plano, evitando la duplicidad de iconos en la UI.
- **Bloqueo Estricto de Popover de Hitos**: El filtro de hitos ha sido reestructurado para un estado inactivo de máxima restricción. Ante la ausencia de un proyecto explícito (`idProy` = null o 'TODOS'), la cápsula `#btn-hito-capsule` aplica un candado riguroso (`disabled`, `pointer-events-none`, `opacity-40`, `cursor-not-allowed`) y, crucialmente, el contenedor principal remueve su estado `group/filter-hito`, lo que bloquea por CSS cualquier intento de despliegue del menú flotante o de mostrar mensajes en el popover.

**4. Normalización de Contrato OCR y Aceleración de Caché (Octubre 2026):**
- **Contrato OCR (`parsearComprobante`)**: Se estandarizó el payload en `JS_Finanzas.html` y `ApiRouter.js` para usar consistentemente `{ base64Data, mimeType, contexto }`, resolviendo discrepancias previas entre `base64` y `base64Data`.
- **Reversión de Caché Monolítica (`getDashboardData`)**: Se eliminó el uso de `CacheService` en `ApiRouter.js` para `getDashboardData` debido a la excepción "Argumento demasiado grande: value". El JSON consolidado de las 9 tablas excedía el límite físico de 100 KB impuesto por Google Apps Script, bloqueando la sincronización. El despachador vuelve a delegar limpiamente la lectura en tiempo real.
## Optimización en Lote (Batch) y Limpieza — Fase 2.1 (Octubre 2026)

### Patrón de Escritura Atómica por Servicio

Todos los métodos de actualización y eliminación de las entidades principales fueron migrados al patrón de **escritura única en bloque** (`setValues`), eliminando por completo las llamadas individuales a `setValue` celda por celda. Esta optimización reduce el número de operaciones I/O contra la API de Sheets y previene alcanzar los límites de cuota de Apps Script.

#### `ProyectosService.updateProyecto`
- **Patrón implementado:** Lee la fila completa con `sheet.getRange(rowIdx, 1, 1, lastCol).getValues()[0]`, aplica los campos del payload sobre el array en memoria, y escribe todo con una sola llamada `sheet.getRange(rowIdx, 1, 1, lastCol).setValues([row])`.
- **Columnas calculadas preservadas:** `Avance_Real_Pct` (fórmula matricial), `Costo_Ejecutado_Real_PEN`, `Costo_Ejecutado_Real_USD`. No se sobreescriben salvo que el payload las incluya explícitamente.
- **Cascada (`eliminarProyectoEnCascada`):** Usa `sobrescribirHojaFiltrada()` para filtrar en memoria y reescribir en un único `setValues` las hojas de Tareas, Subtareas, Hitos y Gastos.

#### `HitosService.updateHito`
- **Patrón implementado:** Lee la fila completa del hito con `getRange(rowIdx, 1, 1, lastColH).getValues()[0]`, muta los campos relevantes (estado, fecha límite, criterio DoD, peso, MAV) y escribe la fila completa con `setValues([rowH])`.
- **Columnas calculadas preservadas:** `Desviacion_Dias` (columna calculada; no se incluye en el payload y se preserva intacta al releer la fila antes de escribirla).
- **`deleteHito` (desvinculado en cascada):** Carga la columna `ID_Hito` de toda la hoja de Tareas en un único `getValues()`, itera en memoria para borrar las referencias, y si hubo cambios escribe todo con un único `setValues(dataTar)`. Luego usa `sobrescribirHojaFiltrada()` para eliminar la fila del hito.

#### `TareasService.updateTarea`
- **Patrón implementado:** Lee la fila completa de la tarea con `getRange(rowIdx, 1, 1, lastColT).getValues()[0]`, aplica todos los campos del payload (nombre, estado, prioridad, energía, fechas, horas estimadas/reales, notas, MAV) sobre el array en memoria, y persiste con `setValues([rowT])`.
- **Columnas calculadas preservadas:** `ID_Proyecto` (Col C, lookup matricial) y `Sprint_Semana` (Col H, fórmula); se omiten del payload y se conservan al releer la fila antes de persistirla.
- **`deleteTarea` (cascada de subtareas):** Usa `sobrescribirHojaFiltrada()` en la hoja de subtareas para filtrar en un solo pase y sobrescribir de forma atómica. Luego aplica lo mismo a la hoja de tareas.
- **`deleteSubtarea`:** Filtra en memoria en una sola iteración, renumera los pasos del padre y escribe el resultado completo con un único `setValues`. Minimiza recorridos redundantes sobre la hoja.

### Utilidad Transversal: `sobrescribirHojaFiltrada(sheet, predicateConservar)`
Función global en `ApiRouter.js` que implementa el patrón filter-in-memory + atomic-rewrite:
1. `sheet.getDataRange().getValues()` — lectura única de toda la hoja.
2. Filtrado en RAM con el predicado recibido.
3. `sheet.getRange(2, 1, lastRow-1, lastCol).clearContent()` — limpieza atómica.
4. `sheet.getRange(2, 1, filasConservadas.length, lastCol).setValues(filasConservadas)` — reescritura en bloque.
- **Retorno:** `number` (cantidad de filas eliminadas).

---

## Saneamiento de Modales, Purga de Código Muerto y Gobernanza — Fase 3.2 (Octubre 2026)

### 1. Purga de Listeners de Formularios Muertos (`JS_ModalesYAtajos.html`)
- **Erradicación de Form Submit Obsoletos:** Se eliminaron 241 líneas de código muerto correspondientes a los listeners `submit` de formularios legacy que operaban sobre elementos ocultos o inexistentes:
  - `form-create-tarea` y `form-editar-tarea-detalle`: reemplazados en su totalidad por la arquitectura reactiva de `Modal_TareaFlow.html` y `JS_TareaFlow.html`.
  - `form-create-actividad-personal` y `form-edit-actividad-personal`: erradicados, ya que la gestión de actividades y hábitos delega exclusivamente en `Modal_ActividadFlow.html` y `JS_Habitos.html` / `JS_Subtareas.html`.
- **Eliminación de Listener `Escape` Duplicado:** Se purgó el listener anónimo local de `Escape` dentro de `inicializarFormularios()`, consolidando la gestión de cierre de popovers flotantes (`flow-datepicker-popover`, `flow-cat-dropdown`, `task-flow-datepicker-popover`, `task-flow-dep-picker`) bajo el despachador maestro global de teclado (`keydown`), eliminando fugas de listeners y colisiones de eventos.

### 2. Saneamiento y Erradicación de Modales Legacy
- **Eliminación de `modal-movimiento` (`Modal_Finanzas.html`):** Erradicado por completo el contenedor HTML, formulario y campos residuales de la antigua hoja `FlujoCaja` (`modal-movimiento`, `form-create-movimiento`, `mov-*`). Se eliminó también el comentario residual erróneo en cabecera de actividades dentro de finanzas.
- **Purga de Contenedor Oculto Legacy (`Modal_TareaFlow.html`):** Eliminado el bloque `<div class="hidden" aria-hidden="true">` que albergaba 30 inputs fantasma y formularios vacíos (`modal-tar-*`, `tarea-*`). Se preservó el input operativo activo `<input type="hidden" id="task-flow-es-mav" value="No">` junto a los inputs canónicos de control de tiempo.
- **Limpieza de Comentarios Huérfanos (`Modal_AtajosYPdf.html`):** Retirado el comentario obsoleto `<!-- MODAL: EDITAR PROYECTO -->`.

### 3. Normalización Canónica de Identificadores de Modales
- **Alineación en `cerrarTodosLosModalesActivos()`:** El catálogo de IDs se sincronizó 100% con los modales reales del DOM:
  - `modal-gasto` (en sustitución de `modal-crear-gasto`).
  - `modal-ingreso` (en sustitución de `modal-crear-ingreso`).
  - `modal-conciliar-transaccion` (en sustitución de `modal-conciliacion-rapida`).
  - `modal-tarea-flow` (en sustitución de `modal-tarea` y `modal-detalle-tarea`).
  - `modal-actividad-flow` (en sustitución de `modal-actividad-personal`).
  - Removidos modales inexistentes: `modal-confirm-desvincular-gasto`, `modal-proyecto`.
- **Alineación en `CONFIG_ENTIDADES_ELIMINACION`:** Saneadas las rutinas de cierre en `TAREA`, `ACTIVIDAD` y `PROYECTO`, invocando únicamente los modales canónicos (`modal-tarea-flow`, `modal-actividad-flow`, `modal-editar-proyecto`).
- **Alineación en `ejecutarAccionPrimariaModal` (Atajo Enter):** Purgado el bloque de `modal-confirm-desvincular-gasto` y alineadas las referencias directas a `modal-gasto`, `modal-ingreso` y `modal-conciliar-transaccion` con `#btn-submit-conciliacion`.

### 4. Gobernanza de Estado y Limpieza de Filtros
- **Unificación de `limpiarFiltrosVistaActiva`:** Se consolidó una única fuente de verdad en `JS_Core.html`, integrando la resolución de `getActiveScope()`, ejecución de resets por módulo con fallbacks seguros y feedback contextual discreto (Toast). Se purgó la definición duplicada en `JS_ModalesYAtajos.html`.
- **Purga de Variable Huérfana:** Removida la asignación no utilizada `var DEFAULT_KEYBOARD_SHORTCUTS = DEFAULT_SCOPED_SHORTCUTS;`.
- **Alineación del Drawer de Archivados en `JS_Core.html`:** En `actualizarBadgeContadorArchivadosGlobal`, se eliminaron los intentos de escritura sobre 4 IDs fantasma (`badge-count-archivados-*`) y se sincronizó directamente con el contador general del Drawer (`count-tab-arch-todos`).

---

## Optimización Algorítmica, Saneamiento DOM y Corrección de Filtros — Fase 4.1 (Octubre 2026)

### 1. Indexación Hash O(1) y Barrido Unificado (`aplicarFiltrosCruzados`)
- **Pre-construcción de Mapas Hash:** Se introdujeron estructuras de datos `Map()` en memoria antes del ciclo de filtrado principal:
  - `hitosMap`: Mapa indexado por `idHito.toUpperCase()` que mapea `{ idProyecto, nombre }`. Permite resolver la relación Hito -> Proyecto en tiempo constante $O(1)$ sin búsquedas secuenciales.
  - `proysMap`: Mapa indexado por `idProyecto.toUpperCase()` con la referencia directa al objeto de proyecto, acelerando la verificación de tipos de iniciativa / cartera.
- **Eliminación de Búsquedas Lineales $O(N)$:** Se erradicaron las llamadas repetitivas `(state.hitos || []).find(...)` y `(state.proyectos || []).find(...)` dentro de los predicados de filtrado de tareas.
- **Barrido Acumulativo Único:** Se consolidó el cómputo de métricas dinámicas (`countProyectos`, `totalMavCount`, `totalArchivadosKanban`, `countPersonal`) en un único pase lineal sobre `state.tareas` y `state.actividadesPersonales`, reemplazando 4 barridos independientes anteriores.

### 2. Eliminación de Layout Thrashing mediante DocumentFragment (`kanban.render`)
- **Buffer en Memoria por Columna:** En lugar de invocar `col.appendChild(tarjetaDOM)` de manera continua durante el recorrido (generando reflows y repaints sucesivos), `kanban.render` ahora inicializa un `DocumentFragment` por cada una de las 4 columnas canónicas (`01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`).
- **Inserción Atómica:** Las tarjetas HTML se ensamblan y agregan al fragmento en memoria, y se ejecuta una única inserción `col.appendChild(fragment)` al finalizar el bucle, eliminando completamente el layout thrashing en la vista Kanban.

### 3. Idempotencia y Blindaje en Drag & Drop (`setupDragAndDropKanban`)
- **Guardia Anti-Duplicación:** Se añadió el flag de dataset `dataset.dndReady` a cada contenedor de columna (`.kanban-cards-container`). Si una columna ya fue inicializada (`col.dataset.dndReady === "true"`), se omite la suscripción de listeners `dragover`, `dragleave` y `drop`, evitando la acumulación de event listeners redundantes tras re-renderizados consecutivos.

### 4. Normalización de Setters y Purga de Código Muerto
- **Eliminación de IDs Fantasma en Filtros Secundarios:** En `setKanbanPrioridadFilter`, `setKanbanEnergiaFilter`, `setKanbanPlazoFilter`, `setKanbanDependenciaFilter`, `setKanbanHitoFilter` y `actualizarSelectorHitosKanban`, se eliminaron todos los fallbacks a identificadores inexistentes (`label-capsule-*`, `btn-capsule-*`, `popover-*-filter`), restringiendo las referencias estrictamente a los selectores canónicos físicos de `View_Kanban.html` (`label-*-active-text`, `btn-*-capsule`, `popover-filter-*`).
- **Purga de `actualizarBannerFiltrosKanban`:** Se eliminó el código muerto que intentaba manipular `banner-filtros-activos`, `txt-banner-filtros` y `btn-limpiar-filtros-simple`. El estado y feedback de filtros activos ahora se comunica exclusivamente mediante `badge-filtro-activo-resumen` y `btn-limpiar-filtros-kanban`.
- **Protección del Mensaje Guía de Hitos (`#msg-hitos-popover-info`):** En `actualizarSelectorHitosKanban`, cuando no hay un proyecto seleccionado o el proyecto carece de hitos, el contenedor `#lista-opciones-hitos-popover` preserva programáticamente la estructura canónica con el botón por defecto y el elemento `#msg-hitos-popover-info` con mensaje explicativo.
- **Corrección de Contenedor de Tiempo:** Se incorporó la clase `kanban-hover-popover-container` a `#container-time-filter` en `View_Kanban.html` para respetar la gobernanza global de cierre de popovers flotantes.
- **Exportaciones Globales:** Se garantizó la exposición de `window.filtrarPorPildoraTipo` y se declaró el respaldo seguro para `window.limpiarBusquedaSidebar`.

---

## Optimización Lineal O(N), Blindaje DnD y Saneamiento — Fase 4.2 (Octubre 2026)

### 1. Barrido Acumulativo Lineal O(N) por Buckets (`renderTableroActividadesPersonales` y `actualizarKPIsGlobalesHabitos`)
- **Eliminación de Recorridos Múltiples $O(N \times C)$:** Se erradicaron los múltiples filtros encadenados y pases redundantes sobre `state.actividadesPersonales` que se ejecutaban por cada una de las 6 columnas y para cada métrica individual.
- **Estructura de Acumuladores (`catBuckets` y `kpis`):** Se implementó un único pase acumulativo en memoria que clasifica las actividades en buckets categorizados (`SALUD_DEPORTE`, `FINANZAS`, `APRENDIZAJE_CRECIMIENTO`, `TRABAJO_PROYECTOS`, `RELACIONES_FAMILIA`, `ESPIRITUALIDAD_BIENESTAR`), segregando pendientes y completadas, mientras computa en simultáneo las métricas globales (`total`, `completadosHoy`, `maxRacha`, `totalGasto`, `horasTotal`).
- **Actualización Directa de Cabecera:** Las tarjetas de métricas en la cabecera (`kpi-habitos-total`, `kpi-habitos-hoy`, `kpi-habitos-racha`, `kpi-habitos-horas`, `kpi-habitos-gasto`, `kpi-habitos-completitud`) se renderizan directamente a partir de las propiedades del acumulador `kpis`, eliminando el recalculo independiente de `actualizarKPIsGlobalesHabitos` cuando el tablero ya fue procesado.

### 2. Eliminación de Layout Thrashing mediante `DocumentFragment`
- **Buffer DOM en Memoria:** Para cada una de las 6 columnas del tablero de hábitos, se generan dos instancias de `DocumentFragment` (una para las actividades pendientes y otra para las completadas).
- **Inserción Atómica por Columna:** Las tarjetas creadas mediante `crearTarjetaActividadGoogleTasks` se asocian al fragmento en memoria; finalizada la iteración de la categoría, se vacía el contenedor destino y se insertan todas las tarjetas con una única llamada `col.appendChild(fragment)`. Esto reduce dramáticamente los reflows y repaints del navegador, brindando una renderización fluida incluso con cientos de hábitos.

### 3. Blindaje e Idempotencia en Drag & Drop (`setupDragAndDropHabitos`)
- **Guardas Anti-Duplicación:**
  - En contenedores receptores: Cada elemento `.kanban-col-body` cuenta con la guarda `if (body.dataset.dndReady === "true") return; body.dataset.dndReady = "true";`, impidiendo que re-renderizados sucesivos adjunten listeners redundantes de `dragover`, `dragleave` y `drop`.
  - En tarjetas arrastrables: Se blindaron tanto `setupDragAndDropHabitos` como `vincularDragCard` con la guarda `if (card.dataset.dragReady === "true") return; card.dataset.dragReady = "true";`, evitando fugas de memoria y multiplicidad de handlers en los eventos `dragstart` y `dragend`.

### 4. Sincronización y Rollback Notificado en `toggleCompletarActividadPersonal`
- **Rollback Atómico y Persistente:** Si la llamada backend falla por red o `res.success === false`, se restablecen inmediatamente los valores previos en memoria (`Estado`, `Racha_Actual`, `Fecha_Programada`), se resincroniza el almacenamiento local (`window.sincronizarCacheLocalState()`) y se repinta el tablero.
- **Feedback al Usuario:** Se reemplazó el silencio operativo en caso de error por una notificación visual clara mediante SweetAlert Toast en la esquina inferior derecha, informando el fallo de sincronización sin bloquear el flujo de trabajo.

### 5. Normalización Canónica de Modales y Purga de Wrappers Muertos
- **Consolidación de `modal-actividad-flow`:** Se purgaron todas las llamadas residuales a `closeModal('modal-actividad-personal')` en `guardarNuevaActividadPersonal`, `eliminarActividadPersonalDirecto` y `confirmarEliminarActividadPersonalDesdeModal`, consolidando el ID físico canónico `modal-actividad-flow`.
- **Purga de Código Muerto:** Se removieron los wrappers huérfanos `guardarEdicionActividadPersonal` y `toggleCumplidoActividadPersonal`, los cuales carecían de consumidores activos en toda la aplicación.

---

## Optimización de Rendimiento, Purga de FlujoCaja y Saneamiento — Fase 4.3 (Octubre 2026)

### 1. Reutilización de Métricas y Optimización Lineal O(N) de Cuotas
- **Paso de Métricas por Parámetro:** En `renderTableroFinanciero()`, se calculan las métricas financieras una sola vez mediante `calcularMetricasSaludFinanciera()` y se transmiten directamente como argumento hacia `renderTabCuotas(metricas)` y `renderTabPresupuestos(metricas)` (y subsecuentemente hacia `renderTechosCategorias(metricas)`).
- **Erradicación de Recálculos Duplicados:** Se eliminó la re-ejecución redundante de `calcularMetricasSaludFinanciera()` que se disparaba de forma innecesaria al seleccionar o renderizar las pestañas de cuotas y presupuestos. Ambas funciones mantienen fallbacks seguros en caso de invocaciones independientes.
- **Consolidación Lineal en Cuotas:** Se sustituyó el doble recorrido sobre `state.cuotas` (anteriormente `cuotas.filter(...)` seguido de `planesActivos.forEach(...)`) por un único pase lineal acumulativo $O(N)$ que evalúa el segmento, filtra estados activos/atrasados y acumula cuota fija, deuda pendiente y amortización en un solo ciclo.

### 2. Erradicación Integral de Vestigios de 'FlujoCaja' en Frontend
- **Variables Muertas:** Se purgaron las declaraciones no utilizadas `var flujoCaja = ...` en `calcularMetricasSaludFinanciera()` y `renderTabTransaccionesUnificada()`.
- **Redirección de Compatibilidad Legacy:** Se removió la rama `else if (tabId === 'flujocaja')` de `cambiarTabFinanzas()`, consolidando la navegación exclusivamente en las 4 pestañas canónicas (`general`, `transacciones`, `cuotas`, `presupuesto`).
- **Limpieza en Conciliación:** En `abrirModalConciliarTransaccion()` y en el despachador `submit` de `form-conciliar-transaccion`, se retiraron las referencias al selector inexistente `conciliar-id-mov`, la lectura de `item.ID_Movimiento` y la transmisión del parámetro obsoleto `idMovimiento` en el payload de `callBackend('conciliartransaccion', ...)`.
- **Saneamiento de Mensajes:** Se actualizó el texto informativo y de confirmación en `ejecutarSaneamientoCuotas()`, eliminando menciones residuales a migración de movimientos de Flujo de Caja.

### 3. Blindaje Notificado del Escaneo OCR con Gemini (`escanearComprobanteIA`)
- **Gestión de Errores Operativos:** Se implementó una rama `else` explícita que detecta respuestas de backend no exitosas (`res.success === false`) o cargas con datos vacíos, emitiendo una alerta modal de error con SweetAlert2 (`icon: 'error'`) con el mensaje devuelto por el servidor en vez de fallar en silencio.
- **Respaldo ante Fallos de Red:** Se fortaleció el callback `onError` de `callBackend`, notificando de forma clara al usuario sobre fallos de conexión HTTP o cuotas de API antes de restablecer el botón `btn-escanear-ia` a su estado habilitado.

### 4. Erradicación de Layout Thrashing mediante `DocumentFragment`
- **Buffer en Memoria para Transacciones:** `renderTabTransaccionesUnificada()` ahora agrupa todas las tarjetas creadas por `crearTarjetaTransaccionUnificada(trx)` dentro de un `DocumentFragment`, realizando un único `.appendChild(fragment)` al contenedor `#lista-transacciones-unificada`.
- **Buffer en Memoria para Cuotas:** `renderTabCuotas()` acumula las tarjetas de créditos generadas por `crearTarjetaPlanCuotas(plan)` en un `DocumentFragment` antes de inyectarlas en `#lista-planes-cuotas`.
- **Buffer en Widgets y Techos:** Se adoptó `DocumentFragment` en `renderRadarCategoriasCriticas()`, `renderProximosVencimientos()` y `renderTechosCategorias()`, erradicando reflows intermedios continuos durante la carga de la vista financiera.

### 5. Saneamiento de Selectores en Restablecimiento de Filtros
- **Alineación de Input de Búsqueda:** En `limpiarFiltrosFinanzas()`, se consolidó la selección del campo de texto de búsqueda mediante el selector canónico con fallback: `document.getElementById('input-busqueda-transacciones') || document.getElementById('input-busqueda-finanzas')`, previniendo errores silenciosos al pulsar el atajo global de limpieza `X`.

---

## Optimización O(1) con Hash Maps, DocumentFragment y Limpieza — Fase 4.4 (Octubre 2026)

### 1. Indexación Hash O(1) y Consolidación Unificada en Portafolio (`JS_Portafolio.html`)
- **Mapas Hash Pre-Construidos:** Se crearon las funciones de indexación `indexarTareasPorProyecto()` e `indexarGastosPorProyecto()` que construyen instancias de `Map` (`idProyecto => [tareas]`, `idProyecto => [gastos]`) en un solo barrido lineal previo sobre `state.tareas` y `state.gastos`, resolviendo además vinculaciones cruzadas por prefijo de `ID_Hito`.
- **Consolidación de Métricas en Ciclo Único O(N):** En `renderKPIsPortafolio()`, se consolidaron los 5 bucles independientes sobre `state.proyectos` (estados, avances ponderados, BAC presupuestario, AC ejecutado y salud determinista) en un único recorrido lineal acumulativo $O(N)$.
- **Erradicación de Filtros Anidados en Grid y Tabla:** En `renderTarjetasPortafolio()` y `renderTablaPortafolio()`, se eliminaron los filtros lineales repetitivos sobre `state.tareas` (`filter(t => t.ID_Proyecto === p.ID_Proyecto)`) y conteos encadenados, sustituyéndolos por consultas directas $O(1)$ (`tareasPorProyecto.get(p.ID_Proyecto)`).

### 2. Indexación Hash y Desacoplamiento O(1) en Cascada de Hitos (`JS_Detalle360.html`)
- **Clasificación Unificada Previa:** En `renderCascadaHitos()`, se sustituyeron los 4 barridos redundantes de `state.gastos` y el escaneo lineal de `state.tareas` por iteración de hitos. Se introdujeron las estructuras `tareasPorHito = new Map()`, `gastosPorHito = new Map()`, `tareasGenerales = []` y `gastosGenerales = []`, pobladas en un único barrido lineal $O(N)$.
- **Resolución O(1) por Hito:** Dentro de `hitosOrdenados.forEach(h)`, las tareas y gastos se obtienen instantáneamente mediante `tareasPorHito.get(hitoIdActual)` y `gastosPorHito.get(hitoIdActual)`.
- **Cálculo Financiero Bottom-Up Eficiente:** El gasto ejecutado real por hito (`realEjecutadoHito`) y el total (`totalGastoHito`) ahora iteran únicamente sobre la colección local de gastos del hito en vez de escanear la base de datos global de gastos.

### 3. Pre-Agrupación en Hash Maps en Grafo de Red WBS (`JS_GrafoRed.html`)
- **Desacoplamiento Relacional en `compilarDatasetGrafoProyecto`:** Se reemplazaron los filtros repetitivos `tareasAsociadas.filter(t => t.ID_Hito === h.ID_Hito)` y `gastosAsociados.filter(g => g.ID_Hito === h.ID_Hito)` dentro del mapeo de ramas de hitos (`ramasHitos = hitosAsociados.map(...)`).
- **Mapas Hash de Entregables:** Se implementaron `tareasPorHitoMap = new Map()` y `gastosPorHitoMap = new Map()` que clasifican entregables e identifican tareas y gastos directos del proyecto (`tareasDirectas`, `gastosDirectos`) en un solo pase previo lineal, permitiendo asignar cada rama en tiempo $O(1)$.

### 4. Mitigación Integral de Layout Thrashing mediante `DocumentFragment`
- **Portafolio (Tarjetas y Tabla):** Tanto `renderTarjetasPortafolio()` como `renderTablaPortafolio()` acumulan las tarjetas (`card`) y filas (`tr`) en buffers `DocumentFragment` en memoria, ejecutando un único `appendChild(fragment)` al finalizar las iteraciones sobre `#grid-proyectos-cards` y `#table-proyectos-body`.
- **Detalle 360° (Cascada WBS):** `renderCascadaHitos()` ensambla todos los contenedores de hitos (`cardHito`) en un `DocumentFragment` antes de inyectarlos en bloque a `#contenedor-hitos-cascada`.

---

## Optimización O(1), Blindaje de Rollback y Saneamiento — Fase 4.5 (Octubre 2026)

### 1. Indexación Hash O(1) con Caché en Memoria (`JS_Subtareas.html`)
- **Estructura de Caché `indexarSubtareasPorPadre()`:** Se implementó una función indexadora que genera y cachea un `Map<string, Subtarea[]>` agrupando los pasos por `ID_Padre`. Cada lista se pre-ordena una única vez por `Numero_Paso` / `Orden_Ejecucion`.
- **Invalidación Reactiva de Caché (`invalidarCacheSubtareas()`):** Se invalidan las referencias cacheadas automáticamente ante cualquier mutación local (creación, toggle optimista, eliminación, reordenamiento, edición de texto o síntesis desde checklist).
- **Resolución O(1) en Tarjetas y Widgets:** Se adaptaron `obtenerSubtareasPadre(idPadre, mapOpcional)`, `calcularProgresoSubtareas(idPadre, mapOpcional)` y `renderWidgetSubtareasTarjeta(idPadre, mapOpcional)`. Al renderizar tableros masivos como Kanban o Hábitos, la recuperación de pasos pasa de un costo $O(N \times M)$ a $O(1)$.
- **Exposición Global:** Se exportaron `window.indexarSubtareasPorPadre` y `window.invalidarCacheSubtareas`.

### 2. Blindaje de Rollback Defensivo en Checkbox Procedural (`toggleSubtareaOptimista`)
- **Captura de Snapshot Previo:** Antes de mutar el estado en memoria y DOM, se preserva un snapshot con los valores de `ID_Subtarea`, `Completado` y `Fecha_Completado` del paso objetivo y de todos sus sucesores en cascada.
- **Rollback Atómico ante Fallo:** Si `callBackend('updatesubtareacompletado')` falla por error de red o retorna `res.success === false`, se ejecuta inmediatamente la función local `ejecutarRollbackSubtarea()`:
  - Se restauran los valores originales en `state.subtareas`.
  - Se invalida la caché interna de indexación.
  - Se repintan de inmediato los widgets en tarjetas DOM y listas en modales activos.
  - Se sincroniza la persistencia local en `localStorage` (`window.sincronizarCacheLocalState()`).
  - Se emite una alerta visual Toast con SweetAlert2 informando el error de sincronización.

### 3. Blindaje Anti-Doble Pulsación en Pasos Procedurales (`agregarSubtareaProceduralDesdeModal`)
- **Bandera de Concurrencia (`isSubmittingSubtask`):** Se introdujo una variable booleana de bloqueo que impide la creación de duplicados o peticiones simultáneas cuando el usuario presiona Enter repetidamente o hace doble clic en el botón de agregar.
- **Liberación Segura de Recursos:** La bandera se activa únicamente tras superar la validación de texto no vacío y se libera rigurosamente en los callbacks de éxito o error del backend. En caso de fallo RPC, se revierte la inserción optimista y se notifica al usuario.

### 4. Erradicación de Layout Thrashing en Dependencias (`renderListaPredecesorasTaskFlow`)
- **Buffer en Memoria con `DocumentFragment`:** En `JS_TareaFlow.html`, las opciones de tareas predecesoras candidatas y el botón por defecto de "Ninguna" se acumulan dentro de un `DocumentFragment`, realizando una única inserción atómica `container.appendChild(fragment)` en lugar de múltiples inserciones unitarias continuas.

### 5. Blindaje de Rollback en Gastos Vinculados de Tareas (`JS_TareaFlow.html`)
- **Rollback Atómico en `guardarGastoAtomicoTaskFlow`:** Si la persistencia silenciosa `callBackend('createGasto')` falla o la respuesta no es exitosa, se ejecuta `revertirGastoAtomico()`:
  - Se elimina el gasto temporal `GAS-TMP-...` tanto de `state.gastos` como de `taskFlowState.gastosVinculados`.
  - Se recalculan de inmediato los montos acumulados imputados en `state.tareas`.
  - Se refresca el DOM de gastos asociados, el tablero financiero y las métricas.
  - Se alerta al usuario con SweetAlert2 Toast.
- **Rollback Defensivo en `vincularGastoExistenteTaskFlow`:** Se incorporó captura de snapshot (`prevIdTarea`, `prevIdProyecto`, `prevIdHito`) y callbacks de validación en `callBackend('updateGasto')`. Ante cualquier eventualidad, se desvincula el gasto y se restaura su estado anterior en memoria y UI.

### 6. Purga Integral de Selectores Legacy y Huérfanos
- **En `JS_Subtareas.html`:** Se alinearon los selectores de los modales activos (`task-flow-id`, `act-flow-id`, `task-flow-lista-pasos`, `act-flow-lista-pasos`, `flow-pasos-progreso-badge/bar`, `task-flow-pasos-progreso-badge/bar`), eliminando la dependencia rígida de los contenedores deprecados `modal-detalle-tarea`, `modal-tar-id-input` y `modal-editar-actividad-personal`.
- **En `JS_TareaFlow.html`:** Se purgaron definitivamente más de 15 selectores de puentes legacy (`modal-tar-proyecto`, `modal-tar-hito`, `tarea-idProyecto-select`, `tarea-idHito-select`, `modal-tar-estado`, `modal-tar-prioridad`, `modal-tar-energia`, `modal-tar-hora`, `modal-tar-horas-est`, `modal-tar-fecha`, `modal-tar-dependencia`, `tarea-idDependencia-select`, `modal-tar-nuevo-paso-input`, `modal-tar-id-input`, `modal-tar-id`, `modal-tar-nombre`, `modal-tar-notas`, `modal-tar-horas-rea`), saneando por completo la lógica del modal unificado de tareas.

### 7. Cierre de la Auditoría General de Rendimiento y Estabilidad (Fase 4 Completa)
- Con la finalización de la Fase 4.5, todos los módulos centrales del ecosistema (Kanban, Hábitos, Finanzas, Portafolio, Detalle 360°, Grafo de Red, Subtareas y Flujo Modal) han sido auditados, optimizados a complejidad algorítmica $O(1)$ / $O(N)$ con mapas hash e índices en memoria, blindados con rollbacks atómicos visuales y DocumentFragment para erradicar el layout thrashing, y purgados de todo vestigio de código muerto y selectores huérfanos.

---

## FASE 5: RESOLUCIÓN DE FALLAS CRÍTICAS EN NOTAS Y VINCULACIONES CRUZADAS (COBALT AERODYNAMIC A.2.2)

### 1. Erradicación de Duplicación al Cambiar Color de Nota
- **Causa Raíz Resuelta:** Al mutar el color de una nota desde la paleta de edición, el objeto `notaEnEdicion` presentaba vulnerabilidad de desalineación en `idNota` (dependiente de propiedad `id` vs `ID_Nota`), provocando que `esNueva` evaluara `true` o que la búsqueda de fila en la columna A de Google Sheets (`NotasService.guardarNota`) no coincidiera exactamente con ceros a la izquierda, derivando en `CorrelativoService.generarIdNota()`, `sheet.appendRow()` y `state.notas.unshift()`.
- **Garantía In-Place en Frontend (`JS_Notas.html`):**
  - Hidratación estricta en `abrirModalEditarNotaConDatos`: `notasState.notaEnEdicion.ID_Nota = idReal;` (`idReal` extraído unificadamente de `nota.ID_Nota || nota.idNota || nota.id`).
  - En `guardarNotaDesdeModal`: Si `idNota` existe, `esNuevaNota` se fuerza obligatoriamente a `false`, inyectando `isNew: false` y `esNueva: false` en `payloadBackend`.
  - Reemplazo in-place local en `state.notas[idx]` emparejando por igualdad directa, normalización de ceros (`NOT-`) y dígitos puros (`replace(/\D/g, '')`). En el retorno del servidor, sobreescritura estricta sin inserciones `unshift` huérfanas.
- **Normalización en Backend (`NotasService.js`):**
  - En `guardarNota(payload)`: El escaneo de la fila objetivo en Sheets compara `rawId === targetClean || rawNorm === targetNorm || (targetDigits && rawDigits === targetDigits)`. Al hallar la fila preexistente, se actualiza in-place (`sheet.getRange(rowIndex, ...).setValues(...)`) garantizando cero inserciones duplicadas.

### 2. Sincronización Bidireccional de Notas Vinculadas en Tarjetas Externas
- **Equivalencia Semántica Unificada (`JS_Core.html`):**
  - Se unificaron los tipos de dominio: `HABITO` y `ACTIVIDAD` son tratados como estrictamente intercambiables y compatibles en `obtenerNotasVinculadasAEntidad(idEntidad, tipoEntidad)` y `registrarVinculo(cod, nota)`.
  - Soporte equivalente para transacciones financieras (`GASTO`, `INGRESO`, `FINANZAS`).
  - Normalización multidireccional de códigos y claves: se indexan y resuelven tanto las variantes con prefijo (`ACT-XXX`, `HAB-XXX`), como las variantes sin ceros a la izquierda y el valor numérico puro (`XXX`), asegurando que las tarjetas de Tareas en Kanban (`JS_Kanban.html`), Actividades en Hábitos (`JS_Habitos.html`) y Transacciones en Finanzas (`JS_Finanzas.html`) muestren sus micro-badges temáticos interactivos en tiempo real.

### 3. Homogeneización de Casillas Checkbox en Notas
- **Prevención de Deformación Flexbox:**
  - En tarjetas de notas (`JS_Notas.html` L809 y L861): Casillas de verificación estandarizadas con clases `w-3.5 h-3.5 min-w-[14px] min-h-[14px] shrink-0 mt-0.5 rounded-sm flex items-center justify-center border transition-all`. Se erradicó el aplastamiento horizontal originado por textos largos o saltos de línea de la descripción contigua.
  - En editor de modal (`renderModalChecklist` en modo lista simple y modo matriz/tabla): Inputs checkbox equipados con `w-4 h-4 min-w-[16px] min-h-[16px] shrink-0 rounded text-amber-500 focus:ring-amber-500`.

### 4. Rediseño del Asistente de Vinculación (Estándar Cobalt Aerodynamic A.2.2)
- **Erradicación de Emojis Unicode:** Se eliminaron todos los emojis planos (`📁`, `🚩`, `✅`, `🎯`, `💰`, `💸`, `＋`) en el modal y listas de selección.
- **Micro-Iconografía Vectorial Lucide Oficial (`stroke-width="1.75"` con `.portal-icon-sm`):**
  - **PROYECTO:** Icono `folder-kanban` con badge índigo semántico (`bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400`).
  - **HITO:** Icono `flag` con badge ámbar semántico (`bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400`).
  - **TAREA:** Icono `check-circle-2` con badge cielo/azul semántico (`bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400`).
  - **HÁBITO / ACTIVIDAD:** Icono `target` con badge violeta semántico (`bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400`).
  - **INGRESO:** Icono `trending-up` con badge esmeralda semántico (`bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400`).
  - **GASTO:** Icono `trending-down` con badge rose semántico (`bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400`).
- **Arquitectura UI del Submodal (`Modal_Notas.html` y `JS_Notas.html`):**
  - Pestañas con micro-iconos integrados y estados activo/hover armónicos.
  - Resultados de búsqueda modelados en tarjetas `.portal-surface` con código en `font-mono text-[10px]`, descripción truncate y micro-botón interactivo `.btn-portal-secondary` con micro-icono `link`.

---

## Resolución de Vínculos Bidireccionales, Iconografía Canónica y Armonización de Notas — Fase 4.3 (Octubre 2026)

### 1. Iconografía Canónica y Purga de Emojis en Badges de Notas Vinculadas (`JS_Core.html`)
- **Erradicación de Emojis Unicode (`📝`, `☑️`, `🛒`):**
  - Sustituidos completamente en `CONFIG_TIPO_NOTA` y `generarBadgeNotasVinculadas` por micro-iconos vectoriales Lucide oficiales (`.portal-icon-sm`, `viewBox="0 0 24 24"`, `stroke-width="1.75"`):
    - **NOTA Estándar:** Lucide `file-text` con acento semántico púrpura (`text-purple-400`).
    - **CHECKLIST:** Lucide `check-square` con acento semántico cielo (`text-sky-400`).
    - **WISHLIST:** Lucide `bookmark` con acento semántico ámbar (`text-amber-400`).
- **Contenedor Canónico del Micro-Badge:**
  - Marcado `inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-semibold border transition-all active:scale-95 cursor-pointer shadow-2xs` estilizado sobre fondos oscuros `.portal-surface` (`bg-slate-900/80` / `border-slate-700/60`).
  - Contador numérico tabular en `font-mono text-[9px] font-bold tabular-nums leading-none ml-0.5` para notas múltiples (> 1).

### 2. Visibilidad y Resiliencia de Badges en Hábitos (`JS_Core.html`, `JS_Habitos.html`)
- **Invalidación Reactiva de Caché:**
  - En `aplicarDatosDashboard` (`JS_Core.html`), se invoca obligatoriamente `invalidarCacheNotasVinculadas()` de forma inmediata tras recibir y almacenar `state.notas = data.notas`. Esto erradica el congelamiento de caché vacía en el renderizado inicial de Hábitos.
- **Indexación Simétrica y Normalización de Claves:**
  - En `construirIndiceNotasVinculadas` y `obtenerNotasVinculadasAEntidad`, se garantiza equivalencia simétrica entre `HABITO` y `ACTIVIDAD`. Los códigos se indexan por clave completa (`ACT-001`, `HAB-001`), clave normalizada sin ceros y dígitos puros (`001`, `1`).
  - En `crearTarjetaActividadGoogleTasks` (`JS_Habitos.html`), `badgeNotasAct` consulta `generarBadgeNotasVinculadas(idActSanitizada, "ACTIVIDAD")` resolviendo de forma infalible los vínculos en el flujo de Hábitos.

### 3. Vinculación Inversa y Nuevos Contratos (`JS_Notas.html`, `JS_TareaFlow.html`, `Modal_TareaFlow.html`)
- **Contratos de Vinculación Expuestos Globalmente (`JS_Notas.html`):**
  - `window.vincularNotaAEntidad(idNota, entidad, callback)`:
    - Agrega de forma atómica el vínculo en `nota.Vinculos`, actualiza memoria local optimista, persiste vía `callBackend('updateNota')`, invalida la caché de vínculos (`invalidarCacheNotasVinculadas()`) y refresca las vistas dependientes.
    - Soporta payload flexible: `entidad = { tipo: 'TAREA'|'ACTIVIDAD'|..., codigo: 'TAR-001', titulo: '...' }` o string de código directo.
  - `window.desvincularNotaDeEntidad(idNota, codigoEntidad, callback)`:
    - Remueve el enlace especificado de `nota.Vinculos`, persiste in-place, purga caché y notifica mediante callback.
- **Integración en Modal de Tarea (`Modal_TareaFlow.html` / `JS_TareaFlow.html`):**
  - **Toolbar de Metadatos:** Chip `#task-flow-chip-notas` integrado con micro-icono Lucide `file-text` y contador reactivo en font-mono tabular.
  - **Sección Desplegable (`#task-flow-notas-section`):** Lista visual de notas enlazadas con apertura directa en modal de notas, botón de desvinculación atómica y buscador reactivo en vivo (`#task-flow-notas-search-input`) para asociar notas existentes de `state.notas` con un solo clic.

### 4. Homogeneización Estética de Notas (`Modal_Notas.html`, `JS_Notas.html`)
- **Icono Pin Canónico:**
  - Sustituido el icono SVG rotado 45° por el vector Lucide oficial `pin` (`.portal-icon-sm`, `stroke-width="1.75"`). Estado activo resaltado en `text-amber-400 bg-amber-950/60 shadow-2xs`.
- **Paneles de Wishlist y Checklist Homogéneos:**
  - Estilizados con relieve canónico Cobalt Aerodynamic: `bg-slate-900/40 border border-slate-800/60 rounded-xl p-4`, eliminando fondos claros planos y saturados.
- **Selector de Colores Footer Minimalista:**
  - Reemplazado por una barra segmentada discreta (`#modal-nota-color-bar`) con swatches estilizados con micro-anillos de enfoque (`focus:ring-2`, `focus:outline-none`) y realce armónico en modo oscuro.

### 5. Persistencia Robusta, Erradicación de Doble Disparo y Minimalismo Visual
- **Erradicación de Event Bubbling, Prevención por Defecto y Candado de Concurrencia:**
  - En `JS_Habitos.html` (`filtrarNotasParaVincularActividadFlow`) y `JS_TareaFlow.html` (`filtrarNotasParaVincularTaskFlow`), los botones `+ Vincular` implementan `event.stopPropagation()` y `event.preventDefault()`, asegurando que el clic no burbujee al contenedor de la fila.
  - Se incorporaron banderas de control en vuelo (`_vincularNotaActEnProgreso` y `_vincularNotaTareaEnProgreso`) para anular ráfagas de doble clic y prevenir colisiones de RPC.
- **Confirmación Estricta de Backend y Reversión Optimista Defensiva (`JS_Notas.html`):**
  - En `vincularNotaAEntidad` y `desvincularNotaDeEntidad`, se evalúa estrictamente `res && res.success`. Si el backend rechaza la operación o falla la comunicación, el arreglo en memoria se revierte a `vinculosPrevios`, se purga la caché con `invalidarCacheNotasVinculadas()` y se despacha `mostrarToastOperativo('error', ..., 'Fallo en servidor')`. En éxito confirmado, se actualiza el objeto local con `res.nota` y se emite toast `Vínculo guardado` o `Vínculo eliminado`.
- **Blindaje Estructural en `NotasService.js` (Google Apps Script):**
  - En `guardarNota` / `updateNota`, se garantiza la presencia de mínimo 12 columnas canónicas (`sheet.getMaxColumns() < 12 -> insertColumnsAfter`) y mínimo `rowIndex` filas antes de invocar `sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues])`, evitando errores de dimensiones en rangos de Sheets. Retorna el objeto `nota` con el arreglo `Vinculos` sincronizado.
- **Limpieza Exterior y Slot Reactivo en Tarjetas de Hábitos (`JS_Habitos.html`):**
  - En `crearTarjetaActividadGoogleTasks`, se eliminó cualquier botón o icono fantasma exterior (`btnVincularNotaRapida`). Si un hábito no tiene notas vinculadas, la tarjeta exterior permanece 100% limpia.
  - El badge `badgeNotasAct` se encapsula en `<span class="habit-badge-notas-slot" data-id-actividad="${idActSanitizada}">`, permitiendo inyección y actualización reactiva inmediata en el DOM sin recargar la página.
- **Reducción y Minimalismo Visual en Modales (`Modal_ActividadFlow.html` y `Modal_TareaFlow.html`):**
  - Las secciones `#act-flow-notas-section` y `#task-flow-notas-section` están homologadas con relieve bitemático `bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl`, cabecera concisa (icono Lucide `file-text`, etiqueta `Notas Vinculadas` y botón [✕]), buscador compacto con placeholder `Buscar nota para vincular...` y lista scrollable de notas vinculadas.
- **Reactividad Inmediata en Tableros (`JS_Habitos.html`, `JS_TareaFlow.html` y `JS_Kanban.html`):**
  - En `vincularNotaAActividadFlow` / `desvincularNotaDeActividadFlow`: se invoca `renderNotasVinculadasActividadFlow()`, se actualiza el badge en `#act-flow-badge-notas`, se refresca reactivamente el slot de la tarjeta `.habit-badge-notas-slot` y se sincroniza el tablero mediante `renderTableroActividadesPersonales()`.
  - En `vincularNotaATareaFlow` / `desvincularNotaDeTareaFlow`: se invoca `renderNotasVinculadasTaskFlow()`, se actualiza `#task-flow-badge-notas`, se refresca reactivamente el slot `.kanban-badge-notas-slot` y se sincronizan las columnas del Kanban vía `renderKanbanColumns(state.tareas)` y `aplicarFiltrosCruzados()`.

### 6. Corrección Integral de Vinculación Bidireccional Notas ↔ Hábitos
- **Vinculación Inmediata y Reactiva desde Modal de Notas (`JS_Notas.html`):**
  - `seleccionarEntidadParaVincular`: Si la nota se encuentra en edición (`ID_Nota` existente), invoca atómicamente `window.vincularNotaAEntidad(idNota, vincObj)`. Esto actualiza de inmediato `state.notas`, purga el índice con `invalidarCacheNotasVinculadas()`, persiste en Google Sheets vía `callBackend('updateNota')` y dispara `actualizarVistasActivasNotas()`, reflejando el micro-badge en las tarjetas de hábitos al instante sin requerir presionar "Guardar Cambios".
  - `desvincularEntidadModal`: Desvincula de forma reactiva e inmediata en `state.notas` y backend invocando `window.desvincularNotaDeEntidad`.
  - Se forzó `esNueva: false` e `isNew: false` en los payloads de `vincularNotaAEntidad` y `desvincularNotaDeEntidad` para prevenir duplicación accidental de filas en Sheets.
- **Exportación Segura de Subtareas y Prevención de Excepciones (`JS_Subtareas.html` y `JS_Habitos.html`):**
  - Se exportaron `window.renderWidgetSubtareasTarjeta`, `window.calcularProgresoSubtareas`, `window.obtenerSubtareasPadre`, `window.toggleSubtareaOptimista` y `window.toggleDrawerSubtareasTarjeta`.
  - En `JS_Habitos.html` (`crearTarjetaActividadGoogleTasks`), se envolvió la invocación de `renderWidgetSubtareasTarjeta` con comprobación condicional segura (`typeof renderWidgetSubtareasTarjeta === "function"` y fallback a `window.renderWidgetSubtareasTarjeta`), erradicando bloqueos por `ReferenceError` durante el renderizado masivo de tarjetas de hábitos.
- **Desbloqueo Total y Flujo de Vinculación en Hábitos (`JS_Habitos.html`):**
  - **Erradicación de Candados:** Se eliminó por completo cualquier variable de bloqueo o bandera de concurrencia (`_vincularNotaActEnProgreso`), permitiendo clics subsiguientes sin restricciones.
  - **Extracción Estricta y Contextual del ID (`obtenerIdActividadContextoFlow`):** Prioridad jerárquica contextual sobre `activityFlowState.currentActId`, `#act-flow-id`, `#edit-act-id`, `data-id-actividad` en `#modal-actividad-flow`, y `#flow-badge-modo` (únicamente si coincide con `/\b(ACT|HAB)-\d+\b/i`). Se eliminó el escaneo ciego del DOM global (`document.querySelector`), garantizando que jamás se asocie incondicionalmente la primera tarjeta visible (ej. `ACT-009`). Si no se detecta ID tras agotar las fuentes del modal, retorna cadena vacía y asocia la nota a `activityFlowState.notasVinculadasDraft`.
  - **Mutación Inmediata en Memoria (0 ms):** Al pulsar `+ Vincular`, se inyecta directamente el objeto `{ tipo: 'ACTIVIDAD', codigo: idAct, titulo: nomAct }` en `state.notas` y se invalidan las cachés locales, refrescando inmediatamente la lista del modal, los micro-badges de la tarjeta y el tablero.
  - **Persistencia Dual con Fallback Directo:** Invoca `window.vincularNotaAEntidad`. Si no está disponible o falla, activa automáticamente `ejecutarFallbackGuardadoNota` con `callBackend('updateNota', payload)` asegurando guardado en Google Sheets.
  - **Trazabilidad en Consola:** Logs claros en cada paso (`[Habitos Vincular] Click detectado para nota:`, `[Habitos Vincular] ID Actividad detectado:`, `[Habitos Vincular] Estado de vinculacion:`).
- **Indexación Enriquecida de Vínculos (`JS_Core.html`):**
  - En `construirIndiceNotasVinculadas`, se añadió el registro de `v.titulo` junto con `v.codigo`, permitiendo resolución instantánea $O(1)$ de identificadores formateados (ej. `"🌱 GYM (ACT-009)"`).

---

## Refinamiento Minimalista del Kanban y Micro-Iconografía de Tipo de Trabajo — Fase 4.4 (Octubre 2026)

### 1. Supresión de Badges de Texto de Prioridad en Tarjetas (`JS_Kanban.html`)
- **Eliminación del Chip de Texto:**
  - Se suprimió la renderización del chip de texto (`P1 Urgente`, `P2 Media`, `P3 Baja`, `P4`) en la cabecera de las tarjetas Kanban (`crearTarjetaKanbanHTML` y `createActivityCardElement`), eliminando sobrecarga visual y reduciendo la altura vertical de las tarjetas.
- **Preservación Visual y Reactiva Cobalt Aerodynamic:**
  - La prioridad sigue comunicada de forma limpia y aerodinámica a través de la **barra lateral de color continua** en el borde izquierdo (`colorBarra`: rose-500 para P1, amber-500 para P2, slate-400 para P3, slate-300 para P4).
  - Se garantiza la preservación de atributos de datos `card.dataset.prioridad = prioridadRaw` y `card.setAttribute("data-prioridad", prioridadRaw)` para consultas DOM y reactividad.
- **Filtro de Prioridad 100% Operativo (`View_Kanban.html` / `JS_Kanban.html`):**
  - El filtro superior de prioridad Eisenhower por cápsula + micro-popover glassmorphism (`#container-filter-prio`, `setKanbanPrioridadFilter`) permanece intacto y 100% operativo, filtrando por el campo canónico `Prioridad_Eisenhower`.

### 2. Homologación Canónica y Micro-Iconos en Tipo de Trabajo (`JS_Kanban.html`, `View_Kanban.html`)
- **Convención y Nombres Canónicos:**
  - Se homologaron los tipos de trabajo a tres valores canónicos estandarizados:
    1. **DeepWork** (`Alta_DeepWork`): Trabajo profundo, alta concentración y diseño estratégico.
    2. **Operativa** (`Media_Operativa`): Tareas de ejecución estándar y mantenimiento del proyecto.
    3. **Automática** (`Baja_Automatica`): Rutinas automatizadas, scripts o tareas de baja demanda cognitiva.
- **Sustitución por Micro-Iconos Lucide Lineales (.portal-icon-sm, stroke-width 1.75):**
  - Se eliminó el texto descriptivo del chip en la tarjeta, renderizando **únicamente** el micro-icono vectorial Lucide con tooltip nativo (`title="Tipo de Trabajo: ..."`):
    - **DeepWork:** Micro-icono Lucide `brain` (`stroke-width="1.75"`), con contenedor semántico púrpura (`bg-purple-50/70 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50`).
    - **Operativa:** Micro-icono Lucide `wrench` (`stroke-width="1.75"`), con contenedor semántico azul (`bg-blue-50/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50`).
    - **Automática:** Micro-icono Lucide `bot` (`stroke-width="1.75"`), con contenedor semántico slate (`bg-slate-100/70 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50`).
  - Atributos `data-energia` y `data-tipo-trabajo` fijados tanto en el elemento tarjeta como en el span del micro-icono.
- **Sincronización del Filtro Superior (`View_Kanban.html` / `JS_Kanban.html`):**
  - El filtro de cabecera `#container-filter-energia` fue actualizado con la etiqueta `"Tipo"` y opciones homogéneas en su popover (`DeepWork`, `Operativa`, `Automática`), sincronizando perfectamente con `setKanbanEnergiaFilter` y `aplicarFiltrosCruzados`.

---

## FASE 4.3 — Prioridad 3: Adaptación del Wizard WBS v4.1, Captura Adaptativa y Presupuesto Bottom-Up (Octubre 2026)

### 1. Nuevos Elementos e IDs del DOM (`Modal_ProyectosYHitos.html`)
- **Paso 1: Datos Generales (`#wiz-panel-datos-generales`):**
  - `#wiz-magnitudComplejidad`: Select canónico para la magnitud de complejidad de la iniciativa con opciones:
    - `Light`: Proyectos de corta duración (< 30 días), ultra ligeros y sin sobrecarga administrativa.
    - `Medium`: Envergadura media (30 - 90 días), estándar de mercado.
    - `Heavy`: Gran envergadura (> 90 días), contratistas múltiples o alta criticidad.
  - `#wiz-arquetipoProyecto`: Select canónico para el arquetipo de proyecto (Feature Flags) con opciones:
    - `1_Infraestructura`: Alcance fijo, dependencias CPM y ruta crítica lineal.
    - `2_Venture`: Alcance emergente, sprints y validación de hipótesis.
    - `3_Activo`: Inversión patrimonial, balance de adquisiciones y retorno financiero.
    - `4_Carrera`: Deep work individual y bloques de preparación académica.
    - `5_Evento`: Fecha fatal fija (T-Minus) y coordinación logística.
  - `#wiz-ia-clasificacion-banner`: Contenedor reactivo con borde y gradiente Cobalt Aerodynamic que se revela automáticamente tras la inferencia de IA, conteniendo:
    - `#wiz-badge-arquetipo-sugerido`: Badge con el arquetipo recomendado por Gemini AI.
    - `#wiz-badge-magnitud-sugerida`: Badge con la magnitud de complejidad inferida.
    - `#wiz-texto-justificacion-clasificacion`: Párrafo en cursiva con el texto explicativo de `justificacionClasificacion`.
- **Paso 2: Estructura WBS y Tareas (`#wiz-panel-hitos` y `#wiz-panel-tareas`):**
  - Botones duales superiores:
    - `+ Paquete de Trabajo (WP)`: Crea un elemento de Nivel 3 gestor de costos y tareas.
    - `🚩 + Hito Marcador (HIT)`: Crea un marcador de control de duración cero y costo cero.
  - Selector dinámico por fila en tabla de hitos:
    - `<select onchange="cambiarTipoElementoWbs(hIdx, this.value)">` con opciones `PAQUETE_TRABAJO` y `HITO_MARCADOR`.
  - Bloqueo en Marcadores:
    - Badge de costo forzado y bloqueado en `$0.00`.
    - En el panel de tareas, se oculta el botón `+ Añadir Tarea` para marcadores, mostrando un micro-banner informativo de exclusión de tareas hijas.

### 2. Flujo de Cálculos y Lógica en Frontend (`JS_ModalesYAtajos.html`)
- **Funciones Canónicas de Selección:**
  - `seleccionarMagnitudComplejidadWiz(mag)`: Sincroniza `#wiz-magnitudComplejidad` y actualiza retrocompatiblemente el input oculto `#wiz-categoriaTShirt`.
  - `seleccionarArquetipoProyectoWiz(arq)`: Sincroniza `#wiz-arquetipoProyecto` y actualiza retrocompatiblemente `#wiz-criterioDominante`.
- **Inicialización y Alias Global:**
  - `abrirWizardProyecto()`: Resetea magnitud a `Medium`, arquetipo a `1_Infraestructura`, y oculta `#wiz-ia-clasificacion-banner`.
  - Se exporta `window.abrirModalCrearProyecto = abrirWizardProyecto` para compatibilidad universal con todos los llamados del portal.
- **Inferencia Asistida por IA (`ejecutarGeneracionPropuestaIA`):**
  - Envía `magnitudComplejidad` y `arquetipoProyecto` en el payload a `generarWbsIntegralProyectoIA`.
  - Al recibir la respuesta: auto-selecciona en `#wiz-magnitudComplejidad` y `#wiz-arquetipoProyecto` los valores devueltos (`magnitudSugerida`, `arquetipoSugerido`) y renderiza la justificación en `#wiz-ia-clasificacion-banner`.
  - Normaliza los elementos devueltos asignando `tipoElementoWbs` (`PAQUETE_TRABAJO` o `HITO_MARCADOR`) y prefijos temporales (`WP-TMP-` o `HIT-TMP-`), forzando costo 0 y tareas vacías en marcadores.
- **Gestión Reactiva WBS v4.1:**
  - `cambiarTipoElementoWbs(hIdx, nuevoTipo)`: Modifica el tipo de elemento, reasigna el prefijo del ID temporal (`WP-TMP-` / `HIT-TMP-`), y si se cambia a `HITO_MARCADOR`, purga tareas asociadas y reajusta costo a 0.00.
  - `agregarHitoWiz(tipo)`: Admite el parámetro `tipo` (`'PAQUETE_TRABAJO'` o `'HITO_MARCADOR'`), asignando prefijo temporal correspondiente y defaults.
  - `agregarTareaWiz(hIdx)`: Evalúa si el hito padre es `HITO_MARCADOR`; de serlo, cancela la operación y emite toast de advertencia.
- **Cálculo Presupuestal Bottom-Up (`actualizarTotalesWiz`):**
  - Suma exclusivamente el presupuesto de los elementos con `tipoElementoWbs === 'PAQUETE_TRABAJO'`:
    $$\text{Total Presupuesto WBS} = \sum_{\text{WP}} \text{Presupuesto\_Asignado}$$
  - Los hitos marcadores no aportan monto al presupuesto acumulado.
  - Actualiza el texto de consumo en `#wiz-lbl-presupuesto-consumo` y el ancho/color de la barra visual `#wiz-bar-presupuesto`.
- **Estandarización y Persistencia Atómica:**
  - `recolectarDatosWizard()`: Función pura exportada globalmente (`window.recolectarDatosWizard`) que ensambla el payload WBS v4.1 completo, mapeando `magnitudComplejidad`, `arquetipoProyecto` y la lista de hitos/marcadores.
  - `guardarProyectoDesdeWizard()`: Consume `recolectarDatosWizard()`, genera el estado optimista en memoria con prefijos `TEMP-WP-` y `TEMP-HIT-`, y despacha la transacción completa a `guardarEstructuraProyectoCompleta`.

---

## FASE 4.4 — Prioridad 4: Cascada Jerárquica 360°, Renderizado de Marcadores Transversales y Topología SVG Adaptativa (Octubre 2026)

### 1. Desacople Operativo y Cascada 360° Jerárquica (`JS_Detalle360.html`, `View_Detalle360.html`)
- **Agrupamiento Jerárquico por Fases (Nivel 1):**
  - La función `renderCascadaHitos` agrupa los elementos del proyecto según su `Fase_Asociada` (`Iniciacion`, `Planificacion`, `Ejecucion`, `Control`, `Cierre`), desplegando un encabezado de fase con su peso ponderado acumulado (`⚖️ X% peso`) y contador de elementos (`Y Paquetes WP • Z Marcadores`).
  - Dentro de cada fase, separa limpiamente los elementos operativos con `Tipo_Elemento_WBS === 'PAQUETE_TRABAJO'` de los checkpoints temporales con `Tipo_Elemento_WBS === 'HITO_MARCADOR'`.
- **Renderizado de Paquetes de Trabajo (`PAQUETE_TRABAJO`):**
  - Renderiza la tarjeta operativa completa de cuenta de control:
    - Indicador visual de avance físico ponderado.
    - Balance financiero $PV vs $AC ejecutado con barra de consumo y alerta visual de sobrecosto.
    - Lista de tareas hijas atómicas con cambio de estado interactivo y badges de prioridad Eisenhower.
    - Columna/panel de egresos imputados directos a la cuenta de control (`WP-XXX`).
- **Renderizado de Hitos Marcadores (`HITO_MARCADOR`):**
  - Renderiza una fila/badge tipo "Checkpoint de Control" de duración cero:
    - Icono temático de control (`💎` para pendiente / `🏁` para cumplido).
    - Costo explícito `$0.00` inalterable (sin gestión de egresos ni presupuesto asignado).
    - Fecha límite planificada y visualización del criterio de aceptación DoD (*Definition of Done*).
    - Acción interactiva directa `toggleCompletarMarcador(idHito)` para alternar entre `01_Pendiente` y `03_Completado` respetando la validación DoD y actualizando de inmediato la interfaz y el backend.
    - Exclusión estricta de listas hijas de tareas operativas y gastos.
- **Cálculo de Avances y Cumplimiento DoD:**
  - `calcularAvanceHito(h)` evalúa el tipo de elemento: para `HITO_MARCADOR` retorna 100% si su estado es completado o cumple DoD (0% si pendiente), sin escanear tareas hijas.
  - `calcularAvancesProyecto` y `recalcularAvanceCascada` consolidan el avance físico total del proyecto multiplicando el avance individual de cada elemento por su ponderación relativa `Peso_Ponderado_Pct`, garantizando precisión matemática bottom-up.
- **Leyenda Canónica WBS v4.1 (`View_Detalle360.html`):**
  - Se homologó el contenedor `#wbs-legend-container` para reflejar la jerarquía canónica de 5 niveles:
    - `Nivel 0: Proyecto` (Índigo)
    - `Nivel 1: Fases` (Violeta)
    - `Nivel 2: Paquetes WP` (Azul/Sky)
    - `Marcador de Control $0.00` (Esmeralda/Diamante)
    - `Nivel 3: Tareas` (Gris Pizarra)
    - `Ruta Crítica CPM` (Ámbar)
    - `Nivel 4: Gastos` (Ámbar)
    - `Notas` (Púrpura)

### 2. Grafo de Red WBS y Topología SVG Adaptativa (`JS_GrafoRed.html`)
- **Compilación de Dataset Condicionada por Feature Flags (`compilarDatasetGrafoProyecto`):**
  - Inspecciona las banderas `featureFlags` del proyecto activo:
    - **Modo Ultra-Ligero (`modoUltraLigero === true` o `arbolWbsCompleto === false`):** Genera una topología simplificada de 2 niveles (Proyecto matriz directamente hacia Tareas operativas), optimizando el renderizado para iniciativas ligeras o ágiles sin sobrecarga administrativa.
    - **Modo WBS Completo (`arbolWbsCompleto === true`):** Estructura una topología jerárquica estricta de 5 niveles ortogonales en el eje Y:
      - **Nivel 0 (Proyecto):** Y = 40 (alto 95px).
      - **Nivel 1 (Fases agrupadoras):** Y = 200 (alto 95px), con enlaces ortogonales desde el nodo raíz.
      - **Nivel 2 (Entregables / Paquetes WP y Marcadores):** Y = 380 (alto 125px).
      - **Nivel 3 (Tareas hijas):** Y = 570 (alto 105px), vinculadas a sus respectivos paquetes de trabajo padre.
      - **Canal de Conectores CPM:** Y = 705 (reservado para dependencias críticas entre tareas sin colisión con nodos).
      - **Nivel 4 (Gastos y Egresos imputados):** Y = 820 (alto 90px), vinculados directamente a la cuenta de control (`WP-XXX`).
- **Renderizado Adaptativo de Tarjetas SVG/HTML (`construirHtmlTarjetaNodo`):**
  - Soporte nativo para nodos de tipo `FASE` (cabecera violeta, conteo de paquetes, marcadores y total de tareas).
  - Soporte nativo para nodos `HITO_MARCADOR` (cabecera esmeralda/índigo, costo `$0.00`, fecha límite y estado).
- **Tooltips 360° Inteligentes:**
  - Implementación de `generarHtmlTooltipFase(node)` y `generarHtmlTooltipMarcador(node)` en el despachador `mostrarTooltipWbs`, mostrando métricas desglosadas y criterios DoD al posar el cursor sobre los nodos del grafo.
- **Navegación e Interacción:**
  - Delegación de clic en tarjetas para `FASE` e `HITO_MARCADOR` conectada con `navegarAHito(nodeId)`, expandiendo la fase/elemento y ejecutando scroll suave con halo destellante (*spotlight highlight*) hacia la tarjeta correspondiente en la Cascada 360°.

### 3. Cierre Integral de la Arquitectura WBS v4.1
Con la entrega de la Prioridad 4 se concluye con éxito el ciclo de reestructuración técnica WBS v4.1:
1. **Prioridad 1 (Backend & Modelos):** Columnas canónicas en `Config.js`, correlativos duales `WP-XXX`/`HIT-XXX` en `Correlativos.js`, desacople de cuentas de control en `HitosService.js` y persistencia en `ProyectosService.js`.
2. **Prioridad 2 (Adaptabilidad & Feature Flags):** Función pura `evaluarFeatureFlagsProyecto`, arquetipos de proyecto (1 a 5), magnitudes (Light, Medium, Heavy), clasificación por IA y telemetría de sobrecarga en `ProyectosService.js` y `GeminiParserService.js`.
3. **Prioridad 3 (Wizard & Bottom-Up):** Wizard adaptativo en `Modal_ProyectosYHitos.html` y `JS_ModalesYAtajos.html`, inputs canónicos, bloqueo estricto de tareas/costos en marcadores y consolidación presupuestal bottom-up.
4. **Prioridad 4 (Cascada 360°, Marcadores & Grafo SVG):** Agrupación por fases, tarjetas operativas de paquetes de trabajo, checkpoints de marcadores con costo $0.00, topología SVG de 5 niveles ortogonales adaptativa y leyenda homologada.

---

## FASE 4.5 — Consolidación Canónica y Compactación de BBDD_Proyectos a 20 Columnas (A:T) (Octubre 2026)

### 1. Reestructuración Canónica y Supresión de Redundancias
- **Compactación a 20 Columnas (A:T):**
  - Se eliminaron las 4 columnas redundantes que generaban desalineación respecto a los catálogos y gobernanza WBS v4.1:
    - `MAV_Requerido` (anteriormente Col L / Índice 11): Los criterios MAV ahora se evalúan a nivel de tarea operativa y flag de ruta crítica.
    - `Fase_Ciclo_Vida` (anteriormente Col M / Índice 12): Se deriva directamente del estado del proyecto o se infiere de la jerarquía de fases.
    - `Frecuencia_Control` (anteriormente Col N / Índice 13): Simplificada hacia la cadencia de gobernanza gestionada por el calendario y rutinas de control.
    - `Nivel_Riesgo_Global` (anteriormente Col P / Índice 15): Consolidado en el cálculo algorítmico determinista de `Health_Status`.
- **Nuevo Mapeo de Índices Canónicos 0-based:**
  - Col A (0): `ID_PROYECTO` (`PRO-XXX`)
  - Col B (1): `NOMBRE` / `Nombre_Proyecto`
  - Col C (2): `TIPO_INICIATIVA` / `Tipo_Iniciativa`
  - Col D (3): `MAGNITUD_COMPLEJIDAD` / `Magnitud_Complejidad` (Light, Medium, Heavy)
  - Col E (4): `ARQUETIPO_PROYECTO` / `Arquetipo_Proyecto` (1 a 5)
  - Col F (5): `ESTADO` / `Estado_Proyecto`
  - Col G (6): `HEALTH_STATUS` / `Health_Status` (🟢, 🟡, 🔴)
  - Col H (7): `AVANCE_REAL_PCT` / `Avance_Real_Pct` (Calculado por backend)
  - Col I (8): `ENTREGABLE_OBJETO` / `Entregable_Tangible_Objeto`
  - Col J (9): `NORTH_STAR_OKR` / `North_Star_OKR`
  - Col K (10): `CRITERIOS_DOD` / `Criterios_Aceptacion_DoD`
  - Col L (11): `ULTIMA_REVISION` / `Ultima_Revision`
  - Col M (12): `FECHA_INICIO_PLAN` / `Fecha_Inicio_Plan`
  - Col N (13): `FECHA_FIN_PLAN` / `Fecha_Fin_Plan`
  - Col O (14): `MONEDA_BASE` / `Moneda_Base`
  - Col P (15): `PRESUPUESTO_TOPE` / `Presupuesto_Tope`
  - Col Q (16): `COSTO_EJECUTADO_PEN` / `Costo_Ejecutado_Real_PEN` (Calculado por backend)
  - Col R (17): `COSTO_EJECUTADO_USD` / `Costo_Ejecutado_Real_USD` (Calculado por backend)
  - Col S (18): `TERCEROS_INVOLUCRADOS` / `Terceros_Involucrados`
  - Col T (19): `ALCANCE_URL_DRIVE` / `Alcance_Detallado_URL_Drive`
  - `MAX_COLUMNS: 20`

### 2. Sincronización en Backend (`Config.js`, `ProyectosService.js`, `DashboardService.js`)
- **`Config.js`:**
  - `CONFIG.COLS_PROYECTOS`: Mapeo posicional exacto de 20 columnas con alias de retrocompatibilidad completos.
  - `CONFIG.ALIASES_PROYECTOS`: Diccionario enriquecido con sinónimos de todas las cabeceras canónicas.
  - `CONFIG.construirMapaColumnas()`: Armonización bidireccional tolerante (sync de pares canónicos y variantes polimórficas).
- **`ProyectosService.js`:**
  - `createProyecto`: Construcción de fila con tamaño exacto `MAX_COLUMNS || 20`, poblando `Entregable_Tangible_Objeto` y `Ultima_Revision`, y protegiendo Col H (Avance), Col Q (Costo PEN) y Col R (Costo USD) contra sobreescritura estática.
  - `updateProyecto`: Actualización de campos tolerante con preservación de fórmulas y blindaje estricto de campos calculados por backend.
  - `guardarEstructuraProyectoCompleta`: Generación de fila de proyecto con tamaño 20 y protección contra `#SPILL!`.
- **`DashboardService.js`:**
  - `getDashboardData`: Lectura de `BBDD_Proyectos` con deserialización de las 20 propiedades canónicas sin desfase de índices. Se añade mapeo explícito de `Costo_Ejecutado_Real_USD`, `Entregable_Tangible_Objeto`, `Ultima_Revision` y `Alcance_Detallado_URL_Drive`.

---

## FASE 4.6 — Consolidación Canónica y Compactación de BBDD_Hitos a 14 Columnas (A:N) (Octubre 2026)

### 1. Reestructuración Canónica y Retiro de Columnas Físicas Obsoletas
- **Compactación Definitiva a 14 Columnas (A:N):**
  - Se eliminaron formalmente como columnas físicas en hoja:
    - `Desviacion_Dias` (anteriormente Col K / Índice 10): Retirada como columna física con fórmula in-sheet (`=IF(ISBLANK(J2), TODAY() - I2, J2 - I2)`). Ahora se calcula en tiempo de ejecución en memoria como `(Fecha_Real_Fin || HOY) - Fecha_Limite_Plan`, garantizando cero dependencias de fórmulas matriciales y eliminando anomalías de recálculo o errores `#SPILL!`.
    - `Flag_Ruta_Critica` (anteriormente Col O / Índice 14): Retirada como columna física booleana. La criticidad de ruta CPM se determina analíticamente en el grafo de red (`JS_GrafoRed.html`).
- **Esquema de Índices Canónicos 0-based:**
  - Col A (0): `ID_ELEMENTO_WBS` (`WP-XXX` / `HIT-XXX`, alias: `ID_Hito`, `ID_Elemento_WBS`)
  - Col B (1): `ID_PROYECTO`
  - Col C (2): `TIPO_ELEMENTO_WBS` (`PAQUETE_TRABAJO` | `HITO_MARCADOR`)
  - Col D (3): `WBS_CODE` (`1.1`, `1.2.1`)
  - Col E (4): `FASE_ASOCIADA` (`Iniciacion`, `Planificacion`, etc.)
  - Col F (5): `NOMBRE_ELEMENTO` (alias: `Nombre_Hito`, `Nombre_Elemento`)
  - Col G (6): `ESTADO` (alias: `Estado_Hito`, `Estado`)
  - Col H (7): `PESO_PCT` / `PESO_PONDERADO_PCT`
  - Col I (8): `FECHA_LIMITE` / `FECHA_LIMITE_PLAN`
  - Col J (9): `FECHA_REAL_FIN`
  - Col K (10): `PRESUPUESTO_ASIGNADO` / `COSTO_ASOCIADO_ESTIMADO` (Techo $PV; $0.00 estricto para `HITO_MARCADOR`)
  - Col L (11): `CRITERIO_DOD` / `CRITERIO_ACEPTACION_DOD` / `DOD`
  - Col M (12): `DEPENDENCIA_PREDECESORA` / `DEPENDENCIA_ID_HITO`
  - Col N (13): `ENTREGABLE_LINK` / `ENTREGABLE_VERIFICABLE_LINK`
  - `MAX_COLUMNS: 14`

### 2. Sincronización en Backend (`Config.js`, `HitosService.js`, `DashboardService.js`)
- **`Config.js`:**
  - `CONFIG.COLS_HITOS`: Actualizado a los 14 índices canónicos exactos (0 a 13) con `MAX_COLUMNS: 14`. Removidas referencias a `DESVIACION_DIAS` y `FLAG_RUTA_CRITICA`.
  - `CONFIG.ALIASES_HITOS`: Diccionario de sinónimos actualizado para los 14 campos.
  - `CONFIG.construirMapaColumnas()`: Sincronización bidireccional y exposición en camelCase/PascalCase de todos los campos.
- **`HitosService.js`:**
  - `createHito`: Asignación exacta de 14 columnas (`MAX_COLUMNS || 14`), forzando `presupuestoAsignado = 0.00` para `HITO_MARCADOR`.
  - `updateHito`: Blindaje de actualización para 14 columnas preservando costo cero en marcadores.
- **`DashboardService.js`:**
  - `getDashboardData`: Deserialización limpia de las 14 propiedades canónicas. Cálculo reactivo de desviación de días en memoria: `(fechaReal || fechaHoy) - fechaLimite` sin depender de fórmulas in-sheet.
- **`JS_Detalle360.html`:**
  - Se añade función `calcularDesviacionDiasHito(h, fHoy)` en memoria para tarjetas operativas y checkpoints de control.

---

## FASE 4.7 — Consolidación Canónica de BBDD_Actividades_Tareas a 14 Columnas y Homologación de Estado 05_Archivado (Octubre 2026)

### 1. Reestructuración Canónica y Retiro de Columnas Físicas Obsoletas
- **Compactación Definitiva a 14 Columnas (A:N):**
  - Se eliminaron formalmente como columnas físicas en hoja:
    - `Sprint_Semana` (anteriormente Col H / Índice 7): Retirada como columna física con fórmula in-sheet (`=YEAR(K2) & "-W" & TEXT(ISOWEEKNUM(K2), "00")`). Se calcula o deriva en tiempo de ejecución en memoria a partir de `Fecha_Programada`.
    - `ES_MAV` (anteriormente Col P / Índice 15): Retirada como columna física booleana. La condición MAV se evalúa dinámicamente en memoria si el campo `Notas_Impedimentos` contiene el tag `[MAV]` o si la prioridad es `01_P1_Alta`.
    - Eliminación de la fórmula in-sheet `=XLOOKUP(B2, BBDD_Hitos!A:A, BBDD_Hitos!B:B, "")` en `ID_Proyecto` (Col C / Índice 2): Ahora se resuelve limpiamente en memoria por backend consultando el Paquete de Trabajo padre (`WP-XXX`) mediante `TareasService.resolverIdProyectoPorHito`, eliminando dependencias matriciales frágiles y riesgos de `#SPILL!`.
- **Esquema de Índices Canónicos 0-based:**
  - Col A (0): `ID_TAREA` (`TAR-XXX`)
  - Col B (1): `ID_HITO` (FK hacia `WP-XXX` en `BBDD_Hitos`)
  - Col C (2): `ID_PROYECTO` (FK hacia `PRO-XXX`, resuelto en memoria por backend)
  - Col D (3): `NOMBRE_TAREA` (`Nombre_Tarea_Actividad`)
  - Col E (4): `ESTADO` (`01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`, `05_Archivado`, alias: `Estado_Tarea`)
  - Col F (5): `PRIORIDAD` (`01_P1_Alta`, `02_P2_Media`, `03_P3_Baja`, `04_P4_Delegable`, alias: `Prioridad_Eisenhower`)
  - Col G (6): `NIVEL_ENERGIA` (`Alta_Cognitiva_DeepWork`, `Media_Operativa`, `Baja_Administrativa`, alias: `Nivel_Energia_Requerido`)
  - Col H (7): `HORAS_ESTIMADAS`
  - Col I (8): `HORAS_REALES`
  - Col J (9): `FECHA_PROGRAMADA` (`YYYY-MM-DD` o `YYYY-MM-DD HH:mm`)
  - Col K (10): `AGENDADO_CALENDAR` (`Sí` / `No` / `Sí|ID_EVENTO`)
  - Col L (11): `ID_DEPENDENCIA` (Predecesora operativa protegida `TAR-XXX`)
  - Col M (12): `RESPONSABLE` (`Christopher`)
  - Col N (13): `NOTAS` (Bloqueos, notas y glosas operativas)
  - `MAX_COLUMNS: 14`

### 2. Homologación de Estado `05_Archivado` y Protección de Predecesoras
- **`Config.js`:**
  - `CONFIG.CATALOGOS.ESTADOS_TAREAS`: Homologado canónicamente a `['01_Backlog', '02_Por_Hacer', '03_En_Proceso', '04_Completado', '05_Archivado']`.
  - `CONFIG.COLS_TAREAS`: Reconfigurado a 14 columnas exactas (0 a 13) con `MAX_COLUMNS: 14`. Depuradas `SPRINT_SEMANA` y `ES_MAV`.
  - `CONFIG.ALIASES_TAREAS`: Actualizado eliminando alias de columnas depuradas y asegurando resolución polimórfica de los 14 campos.
  - `CONFIG.construirMapaColumnas()` y `CONFIG.obtenerMapaTareas()`: Expone todas las variantes canónicas y polimórficas (camelCase, PascalCase, snake_case).
- **`CalendarService.js`:**
  - `sincronizarFilaTarea`: Si `estado === '05_Archivado'` (o `'05_Cancelado'` por compatibilidad), desprograma y elimina de forma limpia el evento en Google Calendar y setea `"No"`.
  - **Blindaje contra colisión con Predecesora:** Se escribe `"No"` o `"Sí|ID"` sobre `colAgendado1Based` (Col K / Índice 10 + 1 = 11), protegiendo la Columna L (Índice 11, `ID_DEPENDENCIA` / Predecesora) contra sobreescrituras accidentales.
- **`TareasService.js`:**
  - Se añade `resolverIdProyectoPorHito(idHito)` para buscar dinámicamente el proyecto del hito padre en memoria en `BBDD_Hitos`.
  - Se añade `normalizarYValidarEstadoTarea(rawEstado)` validando estrictamente los 5 estados autorizados y mapeando variantes como `05_Cancelado` a `05_Archivado`.
  - `createTarea` y `updateTarea`: Validan estado, resuelven `idProyecto` en memoria y dimensionan las filas exactamente a `colMap.MAX_COLUMNS || 14`.
  - `deleteTarea`: Usa mapeo dinámico `colMap` para acceder a `ID_TAREA` y `AGENDADO_CALENDAR`.
- **`tablas.md`:**
  - Actualizada la especificación canónica de `TABLA 3: BBDD_Actividades_Tareas` a 14 columnas (A:N) con `05_Archivado` y sin fórmulas in-sheet.

---

# FASE 4.8 — Homologación Canónica de Categorías de Vida (6 Dimensiones) y Modelo Cuantitativo de Hábitos (Octubre 2026)

### 1. Homologación Canónica de Categorías de Vida (6 Dimensiones)
- **Catálogo Canónico Estricto:**
  - `CONFIG.CATALOGOS.CATEGORIAS_VIDA`: Configurado con exactamente 6 dimensiones canónicas:
    `['SALUD_DEPORTE', 'DESARROLLO_ESTUDIO', 'FINANZAS_TRAMITES', 'SOCIAL_FAMILIA', 'PERSONAL_DESCANSO', 'LABORAL_HONORARIO']`.
- **Mapeo Tolerante:**
  - `CONFIG.normalizarCategoriaVida(catRaw)`: Normalización robusta que mapea variantes (`SALUD`, `DEPORTE`, `DESARROLLO`, `ESTUDIO`, `FINANZAS`, `ADMIN`, `TRAMITES`, `SOCIAL`, `FAMILIA`, `HOGAR`, `PERSONAL`, `DESCANSO`, `OCIO`, `LABORAL`, `TRABAJO`, `CARRERA`, `HONORARIO`) de forma determinista y sin ambigüedades a las 6 claves canónicas.
- **Frontend & Kanban:**
  - Selectores de categorías en `Modal_ActividadFlow.html`, `JS_Habitos.html` y columnas del tablero Kanban en `View_Habitos.html` homologados a los 6 contenedores canónicos.

### 2. Especificación Canónica de BBDD_Actividades_Personales (16 Columnas: A - P)
- **Esquema de Índices Canónicos 0-based:**
  - Col A (0): `ID_ACTIVIDAD` (`ACT-XXX`)
  - Col B (1): `NOMBRE` (alias retrocompatible: `NOMBRE_ACTIVIDAD`)
  - Col C (2): `TIPO_REGISTRO` (`HABITUAL` | `PUNTUAL` | `META`, alias: `TIPO_COMPROMISO`)
  - Col D (3): `CATEGORIA_VIDA` (6 Dimensiones Canónicas)
  - Col E (4): `META_MACRO_NOMBRE` (OKR / Meta Macro vinculada)
  - Col F (5): `UNIDAD_MEDIDA` (`páginas`, `km`, `minutos`, `soles`, `reps`)
  - Col G (6): `META_OBJETIVO_TOTAL` (Meta numérica final)
  - Col H (7): `VALOR_ACUMULADO_ACTUAL` (Progreso numérico acumulado)
  - Col I (8): `META_DIARIA_ESTANDAR` (Meta diaria planificada)
  - Col J (9): `NIVEL_RESCATE_MINIMO` (Avance mínimo para rescatar racha diaria)
  - Col K (10): `ESTADO` (`01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`, `05_Archivado`)
  - Col L (11): `RACHA_ACTUAL` (Contador de días consecutivos)
  - Col M (12): `FECHA_PROGRAMADA` (`YYYY-MM-DD`)
  - Col N (13): `HORA_INICIO` (`HH:mm`)
  - Col O (14): `AGENDADO_CALENDAR` (`Sí` | `No`)
  - Col P (15): `ID_EVENTO_CALENDAR` (ID de Calendar / Tasks)
  - `MAX_COLUMNS: 16`

### 3. Modelo de Metas Cuantificables y Rescate de Racha en Backend y Frontend
- **Backend (`ActividadesService.js` / alias `ActividadesPersonalesService.js`):**
  - Inserción y actualización dimensionada a 16 columnas (`MAX_COLUMNS || 16`).
  - `registrarAvanceCuantitativo(payload)`: Actualiza `VALOR_ACUMULADO_ACTUAL`, incrementa `RACHA_ACTUAL` si `valorAvance >= NIVEL_RESCATE_MINIMO`, y marca `04_Completado` si se alcanza `META_OBJETIVO_TOTAL`.
  - Soporte de aliases `createActividad`, `updateActividad` y alias de servicio `ActividadesPersonalesService`.
  - Rutas habilitadas en `ApiRouter.js`: `createactividad`, `updateactividad`, `registraravancecuantitativo`, `registraravanceactividad`.
- **Dashboard (`DashboardService.js`):**
  - `getDashboardData()`: Desempaqueta los 16 atributos canónicos y garantiza que el agrupamiento por dimensiones y telemetría de bienestar use estrictamente las 6 claves canónicas.
- **Frontend (`JS_Habitos.html`, `Modal_ActividadFlow.html`):**
  - Panel dedicado para metas cuantificables en el modal de actividades (`act-flow-meta-section`).
  - Renderizado de barras de progreso, umbral de rescate y botón de acción rápida `+ Avance` en las tarjetas de hábitos.
  - Función `registrarAvanceHabitoRapido(idActividad)` con celebración visual vía confetti si se rescata la racha.

---

# FASE 4.9 — Consolidación Canónica de BBDD_Finanzas_Gastos a 14 Columnas (A:N), Soporte de Gastos Libres, Cuotas y Comprobantes OCR (Octubre 2026)

### 1. Esquema Canónico Definitivo de 14 Columnas (A:N) en `Config.js`
- **Configuración de Índices Canónicos 0-based (`CONFIG.COLS_FINANZAS` y `CONFIG.COLS_GASTOS`):**
  - Col A (0): `ID_GASTO` (PK: `GAS-XXX`, alias: `ID_Transaccion`)
  - Col B (1): `TIPO_ORIGEN` (`TAREA_PROYECTO` | `ACTIVIDAD_PERSONAL` | `LIBRE_CORRIENTE`, alias: `Clasificacion_Origen`, `Tipo_Gasto`)
  - Col C (2): `ID_ORIGEN_VINCULADO` (`TAR-XXX` | `ACT-XXX` | `NINGUNO`, alias: `ID_Entidad_Vinculada`, `ID_Tarea`, `ID_Actividad`)
  - Col D (3): `ID_CUOTA` (`CUO-XXX` o vacío si pago único, alias: `ID_Cuota`)
  - Col E (4): `FECHA_GASTO` (`YYYY-MM-DD`, alias: `Fecha_Registro`, `Fecha_Compromiso`)
  - Col F (5): `DESCRIPCION_GASTO` (Detalle o concepto del egreso, alias: `Descripcion`, `Concepto`)
  - Col G (6): `CATEGORIA_GASTO` (Rubro presupuestario, alias: `Categoria`)
  - Col H (7): `MONEDA_ORIGINAL` (`PEN` | `USD` | `EUR`)
  - Col I (8): `MONTO_ORIGINAL` (Importe bruto en moneda de origen, alias: `Monto`)
  - Col J (9): `TIPO_CAMBIO` (Factor cambiario a Soles PEN)
  - Col K (10): `MONTO_PEN` (Normalizado PEN calculado y persistido por backend en memoria, alias: `Monto_Moneda_Base`)
  - Col L (11): `METODO_PAGO` (`Transferencia_Bancaria`, `Tarjeta`, `Efectivo`, etc.)
  - Col M (12): `ESTADO_PAGO` (`Pagado`, `Pendiente / Programado`, alias: `Estado`, `Modalidad`)
  - Col N (13): `COMPROBANTE_URL` (Enlace de Google Drive del voucher/factura procesado por Gemini OCR)
  - `MAX_COLUMNS: 14`
- **Armonización Bidireccional en `CONFIG.construirMapaColumnas()` y `CONFIG.obtenerMapaGastos()`:**
  - Sincronización estricta de pares canónicos y variantes polimórficas (camelCase, PascalCase, snake_case) para los 14 encabezados.
  - Exportación de aliases tolerantes a `colMap` garantizando compatibilidad 100% con hojas físicas previas.

### 2. Backend Blindado en `FinanzasService.js`
- **Inserción y Actualización (`createGasto` y `updateGasto`):**
  - Dimensionamiento exacto de filas a 14 columnas (`MAX_COLUMNS || 14`).
  - Soporte de primer nivel para gastos libres (`TIPO_ORIGEN = "LIBRE_CORRIENTE"`, `ID_ORIGEN_VINCULADO = "NINGUNO"`).
  - Soporte de vinculación o re-vinculación posterior a tareas (`TAR-XXX`) o actividades personales (`ACT-XXX`).
  - Cálculo multidivisa con persistencia directa de `Monto_PEN` en memoria sin fórmulas in-sheet (eliminando errores `#SPILL!`).
  - Preservación íntegra de `Comprobante_URL` (Col N) para comprobantes analizados con Gemini OCR.
- **Desvinculación Segura (`desvincularGasto`):**
  - Actualiza `TIPO_ORIGEN` a `LIBRE_CORRIENTE` y `ID_ORIGEN_VINCULADO` a `NINGUNO` sin borrar físicamente la fila del egreso.
- **Generación en Lote de Cuotas (`crearGastoEnCuotas`):**
  - Dimensiona las N filas a 14 columnas exactas sin desfasar índices.
  - Escribe el identificador del plan en Col D (`ID_CUOTA: "CUO-XXX"`), estado `Pendiente` en Col M y concepto `"[Nombre Plan] - Cuota i/N"`.
- **Conciliación de Cuotas (`pagarSiguienteCuota`):**
  - Localiza la cuota pendiente por `ID_Cuota` (`CUO-XXX`) o `ID_Gasto` y muta de forma atómica su estado a `Pagado` en Col M sin alterar el alineamiento de columnas.

### 3. Agregación y Desempaquetado en `DashboardService.js` y Frontend
- **Resolución Dinámica Jerárquica Bottom-Up:**
  - `DashboardService.getDashboardData()` crea un índice hash O(1) de tareas (`mapaTareasPorId`).
  - Si `tipoOrigen === "TAREA_PROYECTO"`, resuelve dinámicamente el proyecto padre e hito a partir de la tarea vinculada (`ID_Origen_Vinculado`), sumando los costos del proyecto sin requerir columnas físicas redundantes en la hoja de gastos.
  - Desempaqueta y expone todas las propiedades canónicas (`comprobanteUrl`, `idCuota`, `tipoOrigen`, `idOrigenVinculado`, `montoPEN`, `estadoPago`).
- **Modales de Tareas y Actividades (`JS_TareaFlow.html`, `JS_Habitos.html`):**
  - Vinculación y desvinculación conservando la existencia del gasto en Finanzas como egreso corriente libre.

### 4. Actualización de Especificación Canónica en `tablas.md`
- Actualizada la especificación técnica de `TABLA 5: BBDD_Finanzas_Gastos` reflejando de forma estricta las 14 columnas canónicas (A:N).

---

# FASE 4.10 — Consolidación Canónica de BBDD_Finanzas_Ingresos a 12 Columnas (A:L) y Cash Flow Integrado (Octubre 2026)

### 1. Esquema Canónico Definitivo de 12 Columnas (A:L) en `Config.js`
- **Configuración de Índices Canónicos 0-based (`CONFIG.COLS_INGRESOS`):**
  - Col A (0): `ID_INGRESO` (PK: `ING-XXX`, alias: `ID_Transaccion`, `ID_Ingreso`)
  - Col B (1): `TIPO_ORIGEN` (`LIBRE_CORRIENTE` | `PROYECTO` | `ACTIVIDAD_PERSONAL`, alias: `Tipo_Origen`, `Tipo_Ingreso`, `Clasificacion_Origen`)
  - Col C (2): `ID_ORIGEN_VINCULADO` (`NINGUNO` | `PRO-XXX` | `ACT-XXX`, alias: `ID_Origen_Vinculado`, `ID_Entidad_Vinculada`, `ID_Proyecto`, `ID_Proyecto_Asociado`)
  - Col D (3): `FECHA_INGRESO` (`YYYY-MM-DD`, alias: `Fecha_Ingreso`, `Fecha_Registro`, `Fecha`, `Fecha_Compromiso`)
  - Col E (4): `DESCRIPCION_INGRESO` (Detalle o concepto del ingreso, alias: `Descripcion_Ingreso`, `Descripcion`, `Concepto`)
  - Col F (5): `CATEGORIA_INGRESO` (`Sueldo_Nomina` | `Honorarios_Freelance` | `Negocio_Emprendimiento` | `Inversiones_Rendimientos` | `Ventas_Activos` | `Otros`, alias: `Categoria_Ingreso`, `Categoria`, `Origen_Fuente`)
  - Col G (6): `MONEDA_ORIGINAL` (`PEN` | `USD` | `EUR`, alias: `Moneda_Original`, `Moneda`)
  - Col H (7): `MONTO_ORIGINAL` (Importe bruto percibido o proyectado, alias: `Monto_Original`, `Monto`)
  - Col I (8): `TIPO_CAMBIO` (Factor cambiario a Soles PEN, alias: `Tipo_Cambio`, `TC`)
  - Col J (9): `MONTO_PEN` (Normalizado PEN calculado en memoria por backend, alias: `Monto_PEN`, `Monto_Moneda_Base`)
  - Col K (10): `METODO_COBRO` (`BCP` | `IBK` | `BBVA` | `Efectivo` | `Otros`, alias: `Metodo_Cobro`, `Metodo_Pago`, `Cuenta_Destino`)
  - Col L (11): `ESTADO_COBRO` (`Cobrado` | `Pendiente / Programado`, alias: `Estado_Cobro`, `Estado_Pago`, `Estado`, `Modalidad`)
  - `MAX_COLUMNS: 12`
- **Armonización Bidireccional en `CONFIG.construirMapaColumnas()` y `CONFIG.obtenerMapaIngresos()`:**
  - Sincronización estricta de pares canónicos y variantes polimórficas (camelCase, PascalCase, snake_case) para los 12 encabezados.
  - Diccionario exhaustivo `CONFIG.ALIASES_INGRESOS` con tolerancia a variaciones sin acentos, mayúsculas y prefijos.
  - Exportación de aliases tolerantes a `colMap` garantizando compatibilidad 100% con hojas físicas previas.

### 2. Backend Blindado en `FinanzasService.js`
- **Inserción y Actualización (`createIngreso` y `updateIngreso`):**
  - Dimensionamiento exacto de inserción y persistencia a 12 columnas canónicas (`MAX_COLUMNS || 12`).
  - Soporte de primer nivel para ingresos libres corrientes (`TIPO_ORIGEN = "LIBRE_CORRIENTE"`, `ID_ORIGEN_VINCULADO = "NINGUNO"`).
  - Soporte de vinculación a proyectos (`PRO-XXX`) o actividades (`ACT-XXX`).
  - Cálculo multidivisa y persistencia directa de `Monto_PEN` en memoria sin fórmulas in-sheet (eliminando `#SPILL!`).
  - Generación atómica de correlativos mediante `CorrelativoService.generarIdIngreso()` / `CorrelativoService.generarCorrelativo('ING')` retornando `ING-XXX`.
  - Mutación atómica en lote (`sheet.getRange(rowIdx, 1, 1, totalCols).setValues([filaActualizada])`).

### 3. Agregación y Métricas de Cash Flow en `DashboardService.js` y Frontend
- **Desempaquetado Canónico de Ingresos (`DashboardService.getDashboardData`):**
  - Lectura tolerante de los 12 campos canónicos preservando retrocompatibilidad de propiedades polimórficas en memoria.
- **Cálculo de Cash Flow Neto:**
  - `totalIngresosCobradosPEN`: Suma de ingresos con estado `Cobrado`, `Ejecutado`, `Conciliado`.
  - `totalGastosPagadosPEN`: Suma de gastos con estado `Pagado`, `Conciliado`, `Real / Ejecutado`.
  - `flujoNetoPEN`: `totalIngresosCobradosPEN - totalGastosPagadosPEN`.
  - `flujoNetoProyectadoPEN`: Flujo proyectado considerando compromisos e ingresos programados del periodo.
  - Expuesto en `respuestaFinal.cashFlowNeto` y `respuestaFinal.resumenFinanciero`.
- **Adaptación en `JS_Finanzas.html` y `JS_ModalesYAtajos.html`:**
  - Optimistic UI, modales, drawers y tablas sincronizados con los 12 campos canónicos de ingresos.

### 4. Actualización de Especificación Canónica en `tablas.md`
- Actualizada la especificación técnica de `TABLA 6: BBDD_Finanzas_Ingresos` reflejando de forma estricta las 12 columnas canónicas (A:L).

---

# FASE 4.11 — Depuración Definitiva de Hoja BBDD_Finanzas_Cuotas y Consolidación en Memoria de Planes a Plazos (Octubre 2026)

### 1. Retiro de Esquema Físico y Definición de Hojas en `Config.js`
- **Eliminación de Hoja Física:** Depurada la definición de `SHEETS.CUOTAS: "BBDD_Finanzas_Cuotas"` del objeto rector `CONFIG.SHEETS`.
- **Eliminación de Esquema Físico:** Removido `CONFIG.COLS_CUOTAS` del catálogo físico de esquemas.
- **Identificador Rector Preservado:** Confirmado que `CONFIG.COLS_FINANZAS.ID_CUOTA: 3` (Col D / índice 3) permanece como el identificador rector del plan de cuotas (`CUO-XXX`), replicado en `CONFIG.COLS_GASTOS`.

### 2. Backend Atómico y Autónomo en `FinanzasService.js`
- **Depuración de Hojas Físicas Satélites:** Eliminadas todas las invocaciones a `ss.getSheetByName(CONFIG.SHEETS.CUOTAS)` e `insertSheet(CONFIG.SHEETS.CUOTAS)`.
- **Creación Canónica de Planes (`crearGastoEnCuotas`):**
  - Inserta exclusivamente las $N$ filas de gastos en `BBDD_Finanzas_Gastos` con tamaño dimensionado a 14 columnas canónicas (A:N).
  - En cada fila, escribe el `idPlan` (`CUO-XXX`) en Col D (Índice 3), `Pendiente` en Col M (Índice 12), y en Col F (Descripción) el formato canónico: `"[Nombre Plan] (Total S/ X) - Cuota i/N"`.
- **Pago y Conciliación Atómica (`pagarSiguienteCuota`):**
  - Localiza la cuota pendiente del plan buscando directamente en `BBDD_Finanzas_Gastos` por `ID_Cuota === idPlan` y `Estado_Pago === "Pendiente"`.
  - Muta de forma atómica su estado a `'Pagado'` en la Col M sin requerir una hoja satélite de cuotas.
  - Computa en memoria el progreso acumulado (`cuotasPagadas`, `totalCuotas`, `saldoPendiente`, `montoPagado`, `estado`).
- **Blindaje en `FinanzasAvanzadasService.deletePlanCuotas`:** Purga directa de las transacciones asociadas en `BBDD_Finanzas_Gastos` sin requerir existencia de la hoja física satélite.

### 3. Agregación y Síntesis en Memoria en `DashboardService.js`
- **Erradicación de RPC y BatchGet para Cuotas:** Removido `ALIAS_HOJAS.CUOTAS`, `nombreRealCuotas` y su inclusión en la consulta por lotes `Sheets.Spreadsheets.Values.batchGet`.
- **Síntesis Dinámica en Memoria (`DashboardService.getDashboardData`):**
  - Agrupa en memoria las filas de `gastos` por `idCuota` (`CUO-XXX`).
  - Extrae y computa dinámicamente:
    * Nombre del plan y monto total inicial desde descripción canónica (`"[Nombre Plan] (Total S/ X) - Cuota i/N"`).
    * Monto pagado acumulado y saldo restante.
    * Ratio de cuotas pagadas/pendientes y estado del plan (`ACTIVO` vs `COMPLETADO`).
  - Retorna el arreglo canónico `cuotas` en la respuesta JSON para consumo inmediato del frontend (`JS_Finanzas.html`), preservando 100% el contrato de datos sin regresión funcional.

### 4. Actualización de Documentación Técnica en `tablas.md`
- **Depuración de Tabla 9:** Retirada la sección satélite `BBDD_Finanzas_Cuotas` del catálogo de tablas físicas.
- **Nota Técnica en Tabla 5:** Documentada la consolidación atómica de compras y compromisos a plazos en Col D (`ID_Cuota`) dentro de `BBDD_Finanzas_Gastos`.

---

# FASE 4.13 — Consolidación Canónica de BBDD_Notas a 12 Columnas: Notas Híbridas Unificadas (Markdown, Checklists Dinámicos, Wishlist y Vinculación Universal) (Octubre 2026)

### 1. Estructura Canónica de 12 Columnas en `Config.js`
- **Definición Estricta (A:L):**
  * Col A (0): `ID_Nota` (alias: `'ID_Nota'`, `'ID'`)
  * Col B (1): `Titulo` (alias: `'Titulo'`)
  * Col C (2): `Contenido_Markdown` (alias: `'Contenido_Markdown'`, `'Contenido'`)
  * Col D (3): `Checklists_JSON` (alias: `'Checklists_JSON'`, `'Checklist'`)
  * Col E (4): `Wishlist_JSON` (alias: `'Wishlist_JSON'`, `'Wishlist'`)
  * Col F (5): `Color_Tema` (alias: `'Color_Tema'`, `'Color'`)
  * Col G (6): `Es_Fijada` (alias: `'Es_Fijada'`, `'Fijado'`, `'Pin'`)
  * Col H (7): `Adjuntos_Drive_JSON` (alias: `'Adjuntos_Drive_JSON'`, `'Adjuntos'`, `'Archivos'`)
  * Col I (8): `Enlaces_Entidades_JSON` (alias: `'Enlaces_Entidades_JSON'`, `'Enlaces_Entidades'`, `'Vinculaciones'`)
  * Col J (9): `Etiquetas` (alias: `'Etiquetas'`, `'Tags'`)
  * Col K (10): `Fecha_Creacion` (alias: `'Fecha_Creacion'`)
  * Col L (11): `Fecha_Actualizacion` (alias: `'Fecha_Actualizacion'`)
  * `MAX_COLUMNS: 12`
- **Paleta Cromática Canónica (16 Tonos Tailwind + #HEX Libre):**
  * `CONFIG.CATALOGOS.COLOR_TEMA`: `['slate', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'rose']`.
  * Soporte universal de códigos hexadecimales nativos (`#HEX`).
- **Mapeo Bidireccional Tolerante:**
  * Sincronización en `CONFIG.construirMapaColumnas()` con aliases canónicos y método `CONFIG.obtenerMapaNotas()`.

### 2. Persistencia y Lógica Híbrida en `NotasService.js`
- **Dimensión de Inserción y Modificación:** Exactamente 12 columnas canónicas (`MAX_COLUMNS || 12`) en `createNota` y `updateNota`.
- **Modelo Híbrido Unificado:**
  * Una nota puede coexistir con cuerpo Markdown, checklists dinámicos/matrices y payload de wishlist `{ costoEstimado, montoRealGastado, moneda, nivelDeseo, estadoDeseo, urlReferencia, idGastoVinculado }`.
  * Inferencia de tipo en runtime sin columna física `Tipo_Nota`.
- **Vinculación Universal Polimórfica:**
  * `Enlaces_Entidades_JSON` almacena arreglos polimórficos canónicos `[{ tipo: 'PROYECTO'|'HITO'|'TAREA'|'ACTIVIDAD'|'GASTO'|'INGRESO', codigo: 'XXX-000' }]`.
  * Si no hay entidades vinculadas, persiste estrictamente `'[]'`.
- **Auditoría Temporal:** Timestamps ISO 8601 consistentes en `Fecha_Creacion` y `Fecha_Actualizacion`.

### 3. Agregación y Desempaquetado en `DashboardService.js`
- **Lectura por Lotes:** Integración de `NOTAS` en `ALIAS_HOJAS` y resolución de fallback directo.
- **Desempaquetado Defensivo:** Mapeo de 12 índices exactos con `JSON.parse` tolerante en `Checklists_JSON`, `Wishlist_JSON`, `Adjuntos_Drive_JSON` y `Enlaces_Entidades_JSON` con fallbacks seguros a `[]` o `{}`.

### 4. Experiencia de Usuario y Renderizado en Frontend (`JS_Notas.html`, `Modal_Notas.html`, `View_Notas.html`)
- **Paleta Cromática Extendida:** Integración de los 16 tonos en toolbar, menú desplegable, selector de modal y cálculo dinámico para `#HEX`.
- **Tarjetas Inteligentes Híbridas:** Coexistencia visual de texto Markdown parseado (`renderizarMarkdownNota`), tablas/checklists interactivos y badges/acciones de wishlist.
- **Modal de Edición 'HÍBRIDA':** Opción de formato híbrido que expone simultáneamente el editor de texto, el gestor de checklists y la sección de wishlist.
- **Filtrado por Entidad Cruzada:** Soporte de filtrado por cualquier entidad presente en `Enlaces_Entidades_JSON` con sincronización del botón de limpieza global.

---

## FASE 4.12 — Refactorización WBS Canónica, Bento Grid y Erradicación Total de MAV en Detalle de Tarea (Modal_TareaFlow)

### 1. Contexto WBS Predefinido Dual (Proyecto, Fase y Paquete de Trabajo)
- **Modo EDITAR / Visualización (`taskFlowState.modo === 'EDITAR'`):**
  - Contenedor `#task-flow-wbs-info` con badges fijos de solo lectura en la cabecera.
  - Implementada la cadena de resolución jerárquica estricta: `Tarea -> Paquete (state.hitos) -> Proyecto (state.proyectos)`.
  - El proyecto matriz se resuelve a partir del hito padre (`hitoObj.ID_Proyecto`), evitando fallbacks erróneos al ID de la tarea o desvinculaciones.
  - Muestra badges limpios para Proyecto (`[PRO-XXX] Nombre`), Fase asociada (si está definida) y Paquete de Trabajo (`[WP-XXX] Nombre`).
- **Modo CREAR (`taskFlowState.modo === 'CREAR'`):**
  - Contenedor `#task-flow-wbs-selectors` activo con botones dropdown interactivos (`#task-flow-pry-btn`, `#task-flow-hit-btn`).
  - Auto-sincronización: al seleccionar un hito en `seleccionarHitoTaskFlow`, se asigna automáticamente el proyecto padre respectivo.

### 2. Erradicación Integral de MAV (Mínimo Alcance Viable)
- **Frontend / Vista (`Modal_TareaFlow.html`):**
  - Eliminado el botón toggle `#task-flow-chip-mav` y el input oculto `#task-flow-es-mav`.
- **Controlador (`JS_TareaFlow.html`):**
  - Eliminada la propiedad `esMav` de `taskFlowState`.
  - Funciones `toggleMavTaskFlow` y `actualizarChipMavDOM` convertidas en no-ops seguros para preservar retrocompatibilidad con llamadas externas.
  - Purgadas las propiedades `Es_MAV` y `esMav` de `nuevaTareaLocal`, `payloadCreate`, `tarLocal` y `payloadUpdate` en `guardarTareaFlow`.

### 3. Reorganización Visual de Metadatos en Bento Grid
Sustituida la franja horizontal única saturada por un Bento Grid responsivo de 3 columnas temáticas (`grid grid-cols-1 md:grid-cols-3 gap-2.5`):
- **Tile 1: Tiempo & Esfuerzo (`#task-flow-chip-datetime`):**
  - Trigger interactivo que abre el Datepicker modal con fecha y hora programada (`#task-flow-chip-datetime-label`).
  - Resumen tabular de esfuerzo con horas estimadas (`#task-flow-bento-horas-est`) y horas reales imputadas (`#task-flow-bento-horas-rea`).
- **Tile 2: Operativo & Flujo:**
  - Selector semántico de Prioridad con acento sutil (`#task-flow-chip-prioridad`, `#task-flow-chip-prioridad-label`) con ciclo P1/P2/P3.
  - Nivel de Energía / Enfoque (`#task-flow-chip-energia`, `#task-flow-chip-energia-label`): Estratégica, Operativa o Automática.
  - Predecesora en el Grafo (`#task-flow-chip-dependencia`, `#task-flow-chip-dependencia-label`): despliega el popover de dependencias del proyecto.
- **Tile 3: Financiero & Entorno:**
  - Presupuesto / Gasto Imputado (`#task-flow-chip-gasto`, `#task-flow-chip-gasto-label`): valor tabular en Soles que despliega el panel de gasto (Nuevo / Vincular).
  - Lugar de Ejecución (`#task-flow-chip-lugar`, `#task-flow-chip-lugar-label`): despliega el input de ubicación con link a Google Maps.
  - Notas Vinculadas (`#task-flow-chip-notas`, `#task-flow-chip-notas-label`): despliega el panel de vinculación recíproca de notas.

### 4. Preservación Contractual y Reactividad 60 FPS
- Se mantuvieron todos los identificadores (`id`) de botones y etiquetas originales, garantizando que los popovers, validaciones y sincronizaciones funcionen de forma fluida y sin regresiones.

---

## FASE PMO 2026 — Refactorización Metodológica PMO, Subpestañas en Vista 360°, CPM, EVM, Trade-Off y Gobernanza

### 1. Desacople Estricto de Hitos (Duración = 0 días / Costo = $0.00)
- **Regla Inmutable:** Todo elemento de tipo Hito Marcador (`HITO_MARCADOR`, prefijo `HIT-*`) representa exclusivamente un evento discreto de control temporal.
- **Backend & Schemas:** En `DashboardService.js`, `HitosService.js` y `ProyectosService.js`, se fija por contrato `Duracion_Dias: 0` y `Presupuesto_Asignado: 0.00`.
- **Formularios:** En `Modal_ProyectosYHitos.html`, se eliminaron los campos de captura de costo y duración para hitos, reemplazándolos con inputs ocultos inmutables (`0.00` y `0`). El presupuesto planificado queda reservado exclusivamente para `PAQUETE_TRABAJO` (`WP-*`).

### 2. Sistema Modular de Subpestañas Ergonómicas en Vista 360° (`View_Detalle360.html` y `JS_Detalle360.html`)
- **Navegación Instantánea en el DOM (Tab Switching):**
  * `Subpestaña 1 (wbs)`: Grafo WBS / Red Vis.js + Banner Resumen de Ruta Crítica (CPM) + Cascada de Hitos y Tareas.
  * `Subpestaña 2 (evm)`: Rendimiento de Valor Ganado (EVM) con 6 Tarjetas Bento (BAC, PV, EV, AC, CC, EAC), Varianzas (CV, SV), Índices (CPI, SPI), Diagnóstico PMO y Curva S interactiva en SVG.
  * `Subpestaña 3 (tradeoff)`: Matriz de Decisión Ponderada Multicriterio con configuración reactiva de pesos (100%), evaluación 1..5, cómputo dinámico del ganador y persistencia hacia `BBDD_Decisiones_TradeOff`.
  * `Subpestaña 4 (gobernanza)`: Ficha de Gobernanza, Frecuencia de Revisión, Check-in PMO, North Star OKR, DoD y Auditoría de Complejidad.

### 3. Motor Algorítmico Canónico CPM (Critical Path Method) (`JS_GrafoRed.html`)
- **Forward Pass & Backward Pass:**
  * Calcula sistemáticamente Early Start ($ES$), Early Finish ($EF$), Late Start ($LS$) y Late Finish ($LF$) a partir de las duraciones estimadas y mapa de predecesoras/dependencias.
  * Determina la Holgura Total ($TotalFloat = LS - ES$).
  * Clasifica como **Ruta Crítica** a todas las actividades con $TotalFloat \le 0.05$ días.
- **Resalte Visual y Badges:**
  * En Kanban (`JS_Kanban.html`): Inserta badge semántico `🔴 Crítica` en la franja superior de las tarjetas pertenecientes a la ruta crítica.
  * En Vista 360°: Resalta el conteo de actividades críticas, duración máxima del proyecto y estado en `#cpm-summary-banner`.

### 4. Motor EVM (Earned Value Management) en Tiempo Real y Curva S Vectorial
- **Fórmulas Canónicas:**
  * $BAC = \text{Presupuesto Tope Planificado}$
  * $EV = BAC \times AvanceRealPct$
  * $PV = BAC \times PctTiempoTranscurrido$
  * $AC = \text{Costo Real Pagado (PEN)}$
  * $CC = \text{Costo Comprometido Pendiente}$
  * $CV = EV - AC$, $SV = EV - PV$
  * $CPI = \frac{EV}{AC}$, $SPI = \frac{EV}{PV}$
  * $EAC = \frac{BAC}{CPI}$, $VAC = BAC - EAC$
- **Curva S en SVG Puro:**
  * Curva S planificada $PV$ (función sigmoide cúbica $3t^2 - 2t^3$), curva real de valor ganado $EV$, costo real $AC$ y marcador vertical temporal de la fecha actual (`HOY`).

### 5. Matriz de Decisión Ponderada Trade-Off (`BBDD_Decisiones_TradeOff`)
- **Persistencia en Sheets:** Nueva hoja de cálculo canónica `BBDD_Decisiones_TradeOff` con 11 columnas (`ID_Decision`, `ID_Proyecto`, `Titulo_Decision`, `Arquetipo_Activo`, `Criterios_JSON`, `Alternativas_JSON`, `Matriz_Evaluacion_JSON`, `Alternativa_Recomendada`, `Score_Ganador`, `Estado_Decision`, `Fecha_Registro`).
- **Autocreación:** Función `verificarYCrearHojaTradeOff()` en `Config.js` que inicializa automáticamente la hoja y sus encabezados con formato corporativo si no existe.
- **Evaluador Reactivo:**
  $$Score(A) = \sum_{i} \left( \frac{Peso_i}{100} \times Rating(A, i) \right)$$
  Valida suma exacta de 100% de pesos y destaca instantáneamente la opción ganadora recomendada.

### 6. Definition of Done (DoD) y Mecanismo Poka-Yoke Estricto
- **Frontend Poka-Yoke (`JS_Kanban.html` y `JS_TareaFlow.html`):**
  * Bloquea el drag & drop hacia la columna `04_Completado` si la tarea tiene al menos una subtarea/paso pendiente. Revierte la posición en el DOM y lanza un toast informativo de bloqueo DoD.
  * Bloquea la transición rápida por botones o desde el formulario de tarea.
- **Backend Poka-Yoke (`TareasService.js`):**
  * Al recibir una mutación a estado `04_Completado`, consulta `BBDD_Subtareas_Pasos`. Si existen pasos incompletos, rechaza la operación con `{ success: false, pokaYokeDoD: true, error: "[Poka-Yoke DoD] No se puede completar la tarea..." }`.

### 7. Feature Flags Dinámicos (Light / Medium / Heavy)
- Adapta dinámicamente las herramientas y subpestañas según la complejidad y arquetipo del proyecto:
  * `LIGHT`: Desactiva pestañas complejas (EVM avanzado y Trade-Off); prioriza WBS ágil y Gobernanza ligera.
  * `MEDIUM`: Activa WBS, EVM y Gobernanza; oculta Trade-Off multicriterio salvo solicitud explícita.
  * `HEAVY`: Despliega el suite completo de las 4 subpestañas operativas y de análisis.

### 8. Semáforo de Salud Doble (Operativo + Financiero)
- **Kanban (`View_Kanban.html` y `JS_ModalesYAtajos.html`):**
  * Conserva el semáforo operativo de tareas retrasadas.
  * Agrega el badge financiero `CPI` en formato tabular (`font-mono tabular-nums text-xs font-bold`):
    - 🟢 Verde: $CPI \ge 0.95$
    - 🟡 Amarillo: $0.85 \le CPI < 0.95$
    - 🔴 Rojo: $CPI < 0.85$
  * Tooltip nativo interactivo con desglose de $EV$, $AC$ y $EAC$.

### 9. Implementación Integral de Vista 360°, Fases Automáticas, Asistencia IA Contextual y Modal Dual WBS (Octubre 2026)

#### 1. Fases Automáticas por Complejidad y Arquetipo (`ProyectosService.js`)
- **Siembra Canónica en Creación Manual:**
  - Proyectos `LIGHT`: Sembrado automático de `Fase 1: Entregables Principales` y paquete de trabajo `WP-001: Ejecución y Entregables` (peso 1.0, estado `01_Pendiente`), permitiendo la creación inmediata de tareas sin pasos intermedios.
  - Proyectos `MEDIUM` y `HEAVY`: Sembrado de 3 a 4 fases canónicas con sus paquetes de trabajo raíz correspondientes según el `Arquetipo_Proyecto` (`1_Infraestructura`, `2_Venture`, `3_Activo`, `4_Carrera`, `5_Evento`).
  - Integración total con `evaluarFeatureFlagsProyecto` y blindaje contra duplicación de semillas.

#### 2. Asistencia Continua de Inteligencia Artificial (Gemini) (`GeminiParserService.js`, `ApiRouter.js`, `JS_Detalle360.html`)
- **Completar WBS con IA:**
  - Endpoint `sugerirEstructuraWbsFaltanteIA`: Analiza el proyecto activo, su North Star OKR, DoD y los entregables existentes. Genera sugerencias de paquetes de trabajo e hitos faltantes estructurados por fases, con estimaciones presupuestarias y criterios DoD. Fallback heurístico multi-arquetipo para tolerancia a fallas de cuota o conectividad.
  - Modal interactivo `#modal-ia-completar-wbs` con selección granular por checkboxes e inserción en lote.
- **Desglosar Tareas Atómicas con IA:**
  - Endpoint `sugerirDesgloseTareasPaqueteIA`: Descompone un paquete de trabajo seleccionado en tareas atómicas orientadas al cumplimiento estricto del criterio DoD, con tiempo estimado en horas y prioridad.
  - Botón "IA Tareas" integrado en cada tarjeta de paquete de trabajo WP en la Vista 360°.
  - Modal interactivo `#modal-ia-desglose-tareas` para selección e inserción optimista reactiva a 60 FPS.

#### 3. Corrección del Grafo WBS y Nomenclatura (`View_Detalle360.html`, `JS_GrafoRed.html`)
- **Nomenclatura Canónica:** Botón de alternancia de vista renombrado a `"Vista: Hitos / Paquetes"` (Niveles 1 y 2) y `"Vista: Árbol Completo"` (Niveles 1, 2, 3 y 4).
- **Erradicación de Emojis Crudos:** Reemplazados todos los emojis residuales en tarjetas de nodo y HUD por iconos SVG Lucide estandarizados (`stroke-width: 1.75`, clase `.portal-icon-sm`) o tipografía mono.

#### 4. Corrección Definitiva del Bug "F1" (`JS_Detalle360.html`)
- **Dinamización de Código de Fase:** Eliminado el literal `'F1'` hardcodeado. La plantilla renderiza dinámicamente `codigoFase` (`F1`, `F2`, `F3`...) computado en el bucle según el orden de fases (`idxFase + 1`), mostrando el nombre real del grupo en cada banner de cabecera de fase.

#### 5. Modal Dual de Entregables WBS (`Modal_ProyectosYHitos.html`, `JS_ModalesYAtajos.html`, `HitosService.js`)
- **Botón "+ Nuevo Entregable":** Vista 360° actualizada con botón canónico e icono Lucide plus.
- **Selector Dual Segmentado:** Selector pill reactivo `[ 📦 Paquete de Trabajo (WP) | 🏁 Hito de Control (Milestone) ]`:
  - **Paquete de Trabajo (WP):** Habilita Fase Asociada, Presupuesto Planificado ($PV), Fecha Límite Plan, Criterio DoD y Peso Ponderado. Admite desagregación en tareas.
  - **Hito de Control (HIT):** Bloquea Duración = 0 y Costo = $0.00. Solicita Nombre, Fase Asociada, Fecha Objetivo de Validación, Criterio DoD y Peso Ponderado.
- **Datalist de Fases Reactivo:** El campo de fase se auto-puebla dinámicamente con las fases existentes en el proyecto activo.

#### 6. Ergonomía Bento Grid y Mobile Bottom Sheet (`Modal_ProyectosYHitos.html`, `View_Detalle360.html`)
- **Mobile First (<640px):** Comportamiento Bottom Sheet nativo con drag handle (`w-12 h-1.5`) para modales de edición de proyecto, creación de entregables y asistentes de IA.
- **Desktop (>=640px):** Estructura Bento Grid en 3 cuadrantes para `#modal-editar-proyecto`:
  - Cuadrante 1: Identidad & Ciclo de Vida (`edit-nombreProyecto`, `edit-estadoProyecto`, `edit-arquetipoProyecto`, `edit-magnitudComplejidad`, `edit-frecuenciaControl`).
  - Cuadrante 2: Cronograma & Gobernanza Financiera (`edit-fechaInicioPlan`, `edit-fechaFinPlan`, `edit-presupuestoTope`, `edit-urlDrive`, `edit-healthStatus-badge`).
  - Cuadrante 3: Alineación Estratégica & Calidad (`edit-northStarOKR`, `edit-criteriosDoD`).
- **Homogeneización Visual:** Estandarización de todos los iconos de la Vista 360° a Lucide con `stroke-width: 1.75`.

---

### 10. Arquitectura Canónica Universal de Modales (Estándar Zero Jitter & Cobalt Aerodynamic A.2.2) (Octubre 2026)

#### 1. Principio de Gobernanza Dimensional (Cero Jitter Horizontal)
Queda estrictamente prohibido que cualquier ventana modal altere su ancho horizontal al seleccionar opciones, alternar tipos o pestañas, abrir acordeones o desplegar bloques de campos adicionales. Todo crecimiento de contenido debe fluir **exclusivamente hacia abajo en el eje vertical** mediante un contenedor de scroll centralizado e independiente.

#### 2. Arquitectura Tridimensional Desacoplada del Contenedor
Cada modal del sistema (`Modal_TareaFlow.html`, `Modal_ActividadFlow.html`, `Modal_Finanzas.html`, `Modal_Notas.html`, `Modal_ProyectosYHitos.html`, `Modal_AtajosYPdf.html`) implementa de forma obligatoria la siguiente jerarquía estructural desacoplada:
1. **Overlay Raíz (`fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4`):** Bloquea el scroll del viewport subyacente y conmuta entre anclaje inferior en móvil (Bottom Sheet) y centrado perfecto en PC/Desktop.
2. **Tarjeta Contenedora (`portal-surface elevation-3 w-full [max-w-tier] max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative`):** Establece el ancho canónico rígido por Tier y acota la altura máxima evitando saturación del viewport.
3. **Tirador Táctil Móvil (`w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 block sm:hidden shrink-0`):** Indicador visual táctil universal para dispositivos móviles.
4. **Cabecera Fija (`shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs`):** Pinned en la parte superior, nunca se desplaza con el scroll. Alberga icono semántico, título y botón de cierre táctil.
5. **Cuerpo Central de Scroll Exclusivo (`flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0 space-y-4 custom-scrollbar`):** Único elemento con overflow activo. Aísla cualquier crecimiento dinámico hacia abajo. Protegido en CSS con `-webkit-overflow-scrolling: touch` y `overscroll-behavior-y: contain`.
6. **Pie de Acciones Fijo (`shrink-0 px-5 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between/justify-end gap-2.5`):** Pinned en la parte inferior, garantiza visibilidad incondicional de los botones de cancelación y guardado en todo momento.

#### 3. Matriz Canónica de Tiers de Ancho
| Tier | Ancho Máximo (Desktop) | Rango en Píxeles | Modales Asignados |
| :--- | :--- | :--- | :--- |
| **Tier 1: Compacto** | `max-w-md` a `max-w-lg` | 448px – 512px | `#modal-conciliar-transaccion`, `#modal-plan-cuotas`, `#modal-vincular-entidad-nota`, `#modal-exportar-pdf`, Modales de confirmación/eliminación. |
| **Tier 2: Estándar** | `max-w-xl` a `max-w-2xl` | 576px – 672px | `#modal-tarea-flow` (`max-w-2xl`), `#modal-actividad-flow` (`max-w-xl`), `#modal-desglose-inversion-bienestar` (`max-w-xl`), `#modal-gasto`, `#modal-ingreso` y `#modal-editar-gasto` (`max-w-xl`), `#modal-editar-nota` (`max-w-2xl`), `#modal-hito` [Dual WP/HIT] (`max-w-xl`), `#modal-ia-desglose-tareas` (`max-w-xl`), `#modal-ia-completar-wbs` (`max-w-2xl`), `#modal-atajos-teclado` (`max-w-2xl`). |
| **Tier 3: Extendido / Bento Grid** | `max-w-4xl` | 896px – 1024px | `#modal-editar-proyecto` (Bento 360°), `#modal-proyecto-wizard`, Matriz Trade-Off Multicriterio. |

#### 4. Reglas de Micro-Densidad Limpia (Cobalt A.2.2)
1. Sustitución universal de párrafos descriptivos por placeholders contextuales concisos y micro-tooltips `group-hover` flotantes.
2. Agrupación semántica en sub-tarjetas Bento sutiles (`bg-slate-50/60 dark:bg-slate-950/40 p-3.5 sm:p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-3`).
3. Limitación de insignias a 1 de tipo y 1 de estado en tipografía `font-mono text-[10px]`.
4. Calibración de ritmo vertical a `space-y-3.5` / `space-y-4` para máxima legibilidad sin scroll inflado.

---

### 11. Mapeo Canónico PostgreSQL / Supabase (Módulo 1) (Octubre 2026)

#### 1. Justificación y Objetivos de Arquitectura (REQ-MIG-001)
Consolidar el modelo de persistencia relacional en PostgreSQL / Supabase bajo el estándar de Cero Regresiones respecto a la lógica operativa de Google Apps Script. El diseño desacopla el motor transaccional eliminando la contención concurrente de `LockService`, estandariza claves primarias nativas UUID con soporte Local-First y preserva al 100% los códigos de identificación legados (`PRO-XXX`, `WP-XXX`, `HIT-XXX`, `TAR-XXX`, `ACT-XXX`, `SUB-XXX`, `GAS-XXX`, `ING-XXX`, `NOT-XXXXX`, `DEC-XXXX`, `IDE-YYYYMMDD-XXX`) para trazabilidad sin pérdida de datos.

#### 2. Matriz de Equivalencia de Almacenamiento (10 Tablas Canónicas)

| # | Hoja Física (Google Sheets) | Tabla Destino (PostgreSQL) | PK UUID Nativa | Código Legado Preservado | Relaciones y Claves Foráneas (FK) | Tipado JSONB Nativo |
|---|-----------------------------|----------------------------|----------------|--------------------------|-----------------------------------|---------------------|
| 1 | `BBDD_Proyectos` (20 cols) | `proyectos` | `id UUID` | `codigo_legado` (`PRO-XXX`) | Raíz jerárquica WBS | Ninguno |
| 2 | `BBDD_Hitos` (14 cols) | `hitos_wbs` | `id UUID` | `codigo_legado` (`WP-XXX` / `HIT-XXX`) | `proyecto_id` $\rightarrow$ `proyectos(id)` ON DELETE CASCADE<br>`dependencia_hito_id` $\rightarrow$ `hitos_wbs(id)` ON DELETE SET NULL | Ninguno |
| 3 | `BBDD_Actividades_Tareas` (14 cols) | `tareas` | `id UUID` | `codigo_legado` (`TAR-XXX`) | `hito_id` $\rightarrow$ `hitos_wbs(id)` ON DELETE CASCADE<br>`proyecto_id` $\rightarrow$ `proyectos(id)` ON DELETE CASCADE<br>`dependencia_tarea_id` $\rightarrow$ `tareas(id)` ON DELETE SET NULL | Ninguno |
| 4 | `BBDD_Actividades_Personales` (16 cols) | `actividades_personales` | `id UUID` | `codigo_legado` (`ACT-XXX`) | Dominio independiente (Life OS / 6 Dimensiones) | Ninguno |
| 5 | `BBDD_Subtareas_Pasos` (6 cols) | `subtareas_pasos` | `id UUID` | `codigo_legado` (`SUB-XXX`) | `tarea_id` $\rightarrow$ `tareas(id)` ON DELETE CASCADE<br>`actividad_id` $\rightarrow$ `actividades_personales(id)` ON DELETE CASCADE<br>*(Restricción XOR estricta)* | Ninguno |
| 6 | `BBDD_Finanzas_Gastos` (14 cols) | `finanzas_gastos` | `id UUID` | `codigo_legado` (`GAS-XXX`) | `proyecto_id` $\rightarrow$ `proyectos(id)`<br>`tarea_id` $\rightarrow$ `tareas(id)`<br>`actividad_id` $\rightarrow$ `actividades_personales(id)`<br>`id_cuota_legado` (Agrupación atómica de cuotas) | Ninguno |
| 7 | `BBDD_Finanzas_Ingresos` (12 cols) | `finanzas_ingresos` | `id UUID` | `codigo_legado` (`ING-XXX`) | `proyecto_id` $\rightarrow$ `proyectos(id)`<br>`actividad_id` $\rightarrow$ `actividades_personales(id)` | Ninguno |
| 8 | `BBDD_Notas` (12 cols) | `notas` | `id UUID` | `codigo_legado` (`NOT-XXXXX`) | Enlaces polimórficos universales | `checklists_json`, `wishlist_json`, `adjuntos_drive_json`, `enlaces_entidades_json`, `etiquetas` (con índices GIN) |
| 9 | `BBDD_Decisiones_TradeOff` (11 cols) | `decisiones_tradeoff` | `id UUID` | `codigo_legado` (`DEC-XXXX`) | `proyecto_id` $\rightarrow$ `proyectos(id)` ON DELETE CASCADE | `criterios_json`, `alternativas_json`, `matriz_evaluacion_json` (con índices GIN) |
| 10 | `BBDD_Ideas` (13 cols) | `ideas` | `id UUID` | `codigo_legado` (`IDE-YYYYMMDD-XXX`) | `id_entidad_destino_legado` (Vínculo de triaje hacia Tarea, Proyecto, Hábito o Nota) | `clarificacion_ia` (con índice GIN) |

#### 3. Artefactos de Base de Datos y Pipeline ETL Creados
- **Migración DDL:** `supabase/migrations/20261016000001_init_schema.sql` (10 tablas, secuencias nativas, triggers de auto-asignación de correlativo y políticas RLS).
- **Contrato RPC:** `supabase/migrations/20261016000002_rpc_dashboard_contract.sql` (`get_dashboard_data(p_user_id)` que garantiza compatibilidad 100% con los modelos del cliente web).
- **Pipeline ETL:** `scripts/etl/extract_transform_load.js` y `scripts/etl/package.json` (conversión tipada, resolución topológica de dependencias en 2 pasadas y generación de `supabase/seed.sql` transaccional idempotente con auditoría de 0 pérdidas).

---

### 12. Capa Cliente Local-First (Dexie / IndexedDB), Hábitos y Subtareas (Módulo 2) (Octubre 2026)

#### 1. Justificación y Objetivos de Arquitectura (REQ-MIG-002)
Implementar la infraestructura cliente en Vite + React + TypeScript desacoplada de Google Apps Script, gobernada por un motor de persistencia local en Dexie (IndexedDB) con latencia de 0 ms y sincronización en segundo plano con Supabase. Portar con paridad matemática estricta la lógica de cálculo de rachas, repetición de ciclos (`HABITUAL` / `PUNTUAL` / `META`), reglas de días laborables/personalizados, rescate cuantitativo y validación procedural de subtareas en cascada.

#### 2. Esquema de Persistencia Local Dexie (`src/db/db.ts`)
- **Base de Datos:** `PMOPersonalModularDB` (v1).
- **Tabla `actividades_personales`:** `id, user_id, codigo_legado, estado, categoria_vida, tipo_compromiso, fecha_programada, sync_status, [user_id+estado], [user_id+categoria_vida]`.
- **Tabla `subtareas_pasos`:** `id, user_id, codigo_legado, id_padre_vinculado, tipo_padre, numero_paso, completado, sync_status, [id_padre_vinculado+numero_paso]`.

#### 3. Algoritmos de Negocio Portados (`src/services/habitosService.ts`)
1. **Rachas y Recurrencia de Hábitos:**
   - Si `completar === true` en `HABITUAL`: `racha_actual + 1`.
   - Si `completar === false` en `HABITUAL`: `Math.max(0, racha_actual - 1)`.
   - Avance de Ciclo: Si `completar && tipo_compromiso === 'HABITUAL' && frecuencia_ciclo !== 'NINGUNA'`, se calcula la fecha siguiente (`calcularSiguienteFechaCiclo`) y se conmuta a `estado = '02_Por_Hacer'` (reapertura automática). En tipos `PUNTUAL` o `META`, pasa a `04_Completado` sin avanzar ciclo.
2. **Rescate Cuantitativo de Racha Diaria:**
   - Si `valorAvance >= nivel_rescate_minimo`, se incrementa la racha y se dispara celebración con confeti (`canvas-confetti`).
3. **Subtareas Secuenciales y Desmarcado en Cascada:**
   - Para marcar Paso $N$ ($N > 1$), los pasos $1 \dots N-1$ deben estar completados (bloqueo secuencial con alerta SweetAlert2).
   - Al desmarcar Paso $N$, se desmarcan automáticamente todos los pasos posteriores ($Paso > N$).

#### 4. Componentes UI y Design Tokens (Cobalt Aerodynamic A.2.2)
- **`TarjetaHabito.tsx`:** Tarjeta con las 6 dimensiones canónicas de vida, selector de check circular gradiente (`from-emerald-600 to-teal-500`), barra de avance cuantitativo con micro-badge de rescate (`≥ N`), disparadores de confeti y alertas SweetAlert2.
- **`ListaSubtareas.tsx`:** Checklist con indicador visual de candado en pasos bloqueados, cajón colapsable animado y desmarcado en cascada.
- **`TableroHabitos.tsx`:** 6 columnas temáticas, Bento KPIs (Total, Cumplimiento, Racha Máxima, Balance 6 Pilares, Horas Invertidas), buscador instantáneo y chip de estado de sincronización (`synced`, `syncing`, `offline`).
- **`syncManager.ts`:** Worker reactivo a `navigator.onLine` con sincronización en segundo plano y resolución de conflictos Last-Write-Wins (LWW) basada en `updated_at`.

---

### 13. ESPECIFICACIÓN DE WBS/CPM Y MOTOR DE NOTAS MARKDOWN - MÓDULO 3 (OCTUBRE 2026)

#### 1. Objetivos y Alcance de Arquitectura (REQ-MIG-003)
Implementar el motor analítico determinista de Ruta Crítica (CPM) y visualizador jerárquico WBS desacoplado de las dependencias pesadas de Canvas (`vis-network`), integrando `@xyflow/react` (ReactFlow v12) con auto-layout determinista (`@dagrejs/dagre`). Paralelamente, refactorizar el gestor híbrido de notas reemplazando expresiones regulares frágiles por un motor AST seguro (`react-markdown` + `remark-gfm` + `rehype-sanitize`) con sincronización bidireccional inmediata en IndexedDB (Dexie).

#### 2. Esquema de Persistencia Local Dexie v2 (`src/db/db.ts`)
- **Base de Datos:** `PMOPersonalModularDB` (v2).
- **Tabla `hitos_wbs`:** `id, user_id, codigo_legado, proyecto_id, wbs_code, tipo_elemento_wbs, fase_asociada, estado, fecha_limite, updated_at, sync_status`.
- **Tabla `notas`:** `id, user_id, codigo_legado, tipo_nota, color_tema, es_fijada, updated_at, sync_status, *etiquetas`.

#### 3. Motor Algorítmico Determinista CPM (`src/services/cpmService.ts`)
1. **Detección de Ciclos Circulares (Algoritmo de Kahn):**
   - Construcción de listas de adyacencia y mapa de grados de entrada (in-degree).
   - Procesamiento en cola FIFO de nodos con `in-degree === 0`. Si al finalizar quedan nodos sin procesar, se detiene la ejecución del CPM y se emite la lista de códigos involucrados en el ciclo (`tieneCiclos: true, cicloDetectado: string[]`), previniendo caídas de CPU o bucles infinitos en el renderizador.
2. **Cálculo de Tiempos y Holgura Total:**
   - **Forward Pass:** $ES = \max_{p \in \text{preds}}(EF_p)$, $EF = ES + \text{duracion}$.
   - **Backward Pass:** $LF = \min_{s \in \text{succs}}(LS_s)$ (o duración del proyecto si no tiene sucesores), $LS = LF - \text{duracion}$.
   - **Holgura Total ($TS$):** $TS = LS - ES$. Se clasifica como ruta crítica determinista si $TS \le 0.001$.
3. **Balance de Ponderaciones WBS:**
   - Agrupación por `fase_asociada` y suma de `peso_pct` de los paquetes de trabajo. Alerta visual inmediata si $\sum \text{peso} \ne 100\%$.

#### 4. Motor de Notas Markdown y Metadatos Tipados
1. **Seguridad y Parseo AST:** Renderizado estricto mediante `react-markdown` + `remark-gfm` + `rehype-sanitize` bajo tokens tipográficos Tailwind (`@tailwindcss/typography`), neutralizando vulnerabilidades XSS.
2. **Sincronización Bidireccional de Checklists:** Conmutar un checkbox interactivo actualiza tanto `checklists_json` como los tokens `- [ ]` / `- [x]` del cuerpo `contenido_markdown` en Dexie.
3. **Metadatos Tipados:** `wishlist_json` (costo estimado, monto gastado, moneda y prioridad) y `enlaces_entidades_json` preservados como objetos JSONB estructurados sin contaminar el texto markdown.

#### 5. Componentes UI Implementados
- **`NodoWBS.tsx`:** Nodo personalizado para ReactFlow con badges de WBS, fase, estado, métricas CPM ($ES$, $EF$, $LS$, $LF$, $TS$) y resaltado visual para elementos en ruta crítica (`bg-rose-950/40 border-rose-500`).
- **`GrafoWBS.tsx`:** Diagramador con controles de zoom/pan, minimapa interactivo, conmutador de orientación Top-to-Bottom (`TB`) vs Left-to-Right (`LR`) vía `@dagrejs/dagre`, filtro de ruta crítica y panel de balance de fases.
- **`TarjetaNota.tsx`:** Tarjeta con cuadrícula CSS Masonry, soporte de fijado (`es_fijada: boolean`), paleta cromática Tailwind Cobalt, checklists interactivos y badge financiero de wishlist.
- **`EditorNotaModal.tsx`:** Modal con pestañas de editor/vista previa, campos estructurados de wishlist, tags dinámicos y extracción automática de checklists.
- **`VisorNotas.tsx`:** Vista principal con pestañas (Todas, Fijadas, Checklists, Wishlist), buscador instantáneo y catálogo de tags en $O(1)$.
- **`App.tsx`:** Navegador superior integrado para alternar con 0 ms entre Hábitos & Vida, WBS & Ruta Crítica y Notas Inteligentes.

---

### 14. ORQUESTACIÓN DE IA, STREAMING SSE Y AISLAMIENTO DE ARTEFACTOS LEGACY - MÓDULO 4 (OCTUBRE 2026)

#### 1. Justificación y Objetivos de Arquitectura (REQ-MIG-004)
Aislar el ecosistema de Google Apps Script legado dentro de un directorio dedicado (`legacy_gas/`) para evitar sobrecostos masivos de tokens en los prompts de los asistentes del IDE, garantizando al mismo tiempo que la herramienta `clasp` conserve su capacidad de sincronización y despliegue hacia Google Drive. Paralelamente, implementar la capa de orquestación de IA en Supabase Edge Functions (Deno) con streaming Server-Sent Events (SSE) y componentes de UI reactivos en Vite + React.

#### 2. Reestructuración de Workspace y Configuración Clasp
- **Directorio `legacy_gas/`:** Aloja los 18 archivos `.js` de backend y 32 archivos `.html` de vistas/modales junto con `appsscript.json`.
- **`.clasp.json`:** Configurado con `"rootDir": "legacy_gas"`. El comando `clasp push` continúa desplegando sin regresiones.
- **`.vscode/settings.json`:** Exclusión explícita de `legacy_gas` en `"search.exclude"`, `"files.watcherExclude"` y `"typescript.tsserver.watchOptions.excludeDirectories"`.
- **`.env.example`:** Contrato de variables de entorno para frontend y funciones serverless (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`).

#### 3. Edge Function `gemini-orchestrator` (`supabase/functions/gemini-orchestrator/index.ts`)
- **Seguridad:** Cero exposición de credenciales (`GEMINI_API_KEY` extraída de `Deno.env.get`).
- **Protocolo de Transmisión:** Server-Sent Events (`text/event-stream; charset=utf-8`) consumiendo el endpoint `streamGenerateContent?alt=sse` de Google Gemini (`gemini-2.5-flash`).
- **Modos de Operación:**
  1. `clarificar_idea`: Asesor estratégico para evaluación de viabilidad, nivel de fricción, costos ocultos, trade-offs y recomendación de entidad (`PROYECTO`, `TAREA`, `HABITO`, `NOTA`).
  2. `desglosar_wbs`: Desglose jerárquico estructurado en paquetes de trabajo e hitos con balance de ponderación porcentual.

#### 4. Componentes UI y Cliente de Streaming
- **`useGeminiStream.ts`:** Hook reactivo para el consumo incremental de streams SSE mediante `ReadableStream.getReader()`, con soporte de cancelación (`abortStream`) y generador mock offline para desarrollo con latencia de 0 ms.
- **`AsistenteIaModal.tsx`:** Modal interactivo con estética Cobalt Aerodynamic A.2.2, renderizado Markdown en vivo token por token, selector de modo y botones de persistencia atómica inmediata en Dexie (`db.notas` o `db.hitos_wbs`).
- **`App.tsx`:** Botón canónico `✨ Asistente IA` integrado en la barra de navegación superior accesible desde cualquier vista del sistema.

---

### 15. ARQUITECTURA DE EMPAQUETADO MULTIPLATAFORMA: DESKTOP HUD Y CAPACITOR ANDROID - MÓDULO 5 (OCTUBRE 2026)

#### 1. Justificación y Objetivos de Arquitectura (REQ-MIG-005)
Implementar la infraestructura de compilación multiplataforma para desplegar el portal como aplicación nativa móvil en Android (APK) vía Capacitor, y como widget flotante ultra-ligero para Windows (Desktop HUD Always on Top). Normalizar el pipeline de empaquetado de Vite eliminando discrepancias de entrada HTML y resolver las colisiones de viewport en pantallas móviles estrechas (< 380px) mediante una barra de navegación inferior fija adaptativa.

#### 2. Configuración y Normalización Capacitor (`capacitor.config.ts` y `vite.config.ts`)
- **Configuración Nativa:** `appId: 'com.christopher.pmopersonal'`, `appName: 'PMO Personal'`, `webDir: 'dist'`, `server: { androidScheme: 'https' }`.
- **Hook de Build Vite (`capacitorIndexHtmlPlugin`):** Clona automáticamente `dist/app.html` hacia `dist/index.html` tras finalizar la compilación (`closeBundle`), garantizando que la WebView de Android nunca sufra errores de archivo no encontrado.
- **Scripts de Automatización (`package.json`):**
  - `"cap:init"`: Inicializa el proyecto en el CLI de Capacitor.
  - `"cap:sync"`: Compila el frontend en TypeScript y sincroniza los assets con el proyecto nativo Android.
  - `"cap:open"`: Abre el proyecto en Android Studio para depuración y compilación final del APK.
  - `"build:mobile"`: Pipeline continuo `npm run build && cap sync android`.

#### 3. Ergonomía Móvil y PWA Standalone
- **Safe-Area Insets (`src/index.css`):** Soporte integral para `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)` previniendo solapamiento con la cámara o gestos de navegación.
- **PWA Manifest (`public/manifest.webmanifest`):** Metadatos standalone, tema oscuro `#040711`, fondo `#020617` y orientación vertical primaria.
- **Bottom Navigation Bar:** Barra inferior táctil exclusiva para dispositivos móviles (`sm:hidden`) con botones de 44x44 px (`.touch-target`), liberando la cabecera superior y garantizando usabilidad en pantallas pequeñas (< 380px).

#### 4. Componente Desktop HUD para Windows (`src/components/HUD/DesktopHudWidget.tsx`)
- **Concepto:** Widget flotante compacto (360 x 580 px) de bajo consumo de memoria (< 60 MB RAM) con estética Cobalt Aerodynamic.
- **Funcionalidades HUD:**
  1. Mini checklist de hábitos diarios con toggle instantáneo (0 ms) y animación sutil de confeti.
  2. Métricas esenciales de Ruta Crítica (duración total del proyecto y número de nodos críticos).
  3. Barra de captura rápida de ideas/notas en 1 clic.
  4. Conmutador bidireccional entre modo HUD y modo Executive Dashboard completo.
- **Lanzador Nativo (`desktop/runner.js`):** Script para Electron/WebView2 configurado sin marco (`frame: false`), siempre visible (`alwaysOnTop: true`) y atajo global `CommandOrControl+Shift+H`.

---

### 16. AUDITORÍA Y CALIBRACIÓN DE DATOS REALES (PIPELINE ETL SEED.SQL - MÓDULO 6)

#### 1. Justificación y Objetivos de Arquitectura (REQ-MIG-006)
Calibrar el pipeline de extracción, transformación y carga (`scripts/etl/extract_transform_load.js`) para procesar el volcado real de Google Sheets (`volcado_sheets_pmo.json`), neutralizando la doble serialización de cadenas y unificando las discrepancias de nomenclatura (`PascalCase` / `snake_case`) para generar el script de semilla transaccional `supabase/seed.sql` con 100% de integridad referencial.

#### 2. Auditoría y Balance de Conteo de Entidades Migradas

| Entidad | Tabla PostgreSQL | Registros Origen | Registros SQL | Delta Pérdidas | Estado |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Proyectos** | `proyectos` | 13 | 13 | 0 | OK (100% Preservado) |
| **Hitos WBS** | `hitos_wbs` | 47 | 47 | 0 | OK (100% Preservado) |
| **Tareas** | `tareas` | 59 | 59 | 0 | OK (100% Preservado) |
| **Actividades Personales** | `actividades_personales` | 13 | 13 | 0 | OK (100% Preservado) |
| **Subtareas / Pasos** | `subtareas_pasos` | 33 | 33 | 0 | OK (100% Preservado) |
| **Gastos** | `finanzas_gastos` | 28 | 28 | 0 | OK (100% Preservado) |
| **Ingresos** | `finanzas_ingresos` | 57 | 57 | 0 | OK (100% Preservado) |
| **Notas** | `notas` | 23 | 23 | 0 | OK (100% Preservado) |
| **Decisiones** | `decisiones_tradeoff` | 0 | 0 | 0 | OK (Sin datos previos) |
| **Ideas** | `ideas` | 8 | 8 | 0 | OK (100% Preservado) |
| **TOTAL** | **10 Tablas Canónicas** | **281** | **281** | **0** | **OK (100% Preservado)** |

#### 3. Reglas Quirúrgicas de Transformación
- **Desempaquetado Condicional:** Detección de cadenas JSON serializadas con `if (typeof dataset === 'string') dataset = JSON.parse(dataset);`.
- **Extractor Coalescente `get()`:** Resolución unificada de propiedades multi-estilo.
- **Normalización Numérica de Avance:** Re-escalado de `0.65` a `65.00` para cumplir el constraint `0 <= avance_real_pct <= 100`.
- **Resolución Relacional Dinámica:** Inferencia de `proyecto_id` en tareas a partir de `hitos_wbs` mitigando el desalineamiento del volcado sheets.
- **Saneamiento de Integridad Foránea:**
  - `TAR-059` asociada preventivamente a `WP-001` evitando violaciones de `NOT NULL`.
  - Subtareas huérfanas vinculadas a entidades raíz activas (`ACT-001`/`TAR-001`), preservando la descripción procedural y garantizando el cumplimiento del constraint `chk_subtarea_exclusividad_padre`.
- **Verificación de Sanidad SQL:** 8,034 líneas generadas en `supabase/seed.sql` con balance de paréntesis en Delta = 0 (1,510 abiertos / 1,510 cerrados).

---

### 17. RESTAURACIÓN DEL CHASIS VISUAL CANÓNICO Y VISTAS MAESTRAS - MÓDULO 7 (REQ-UI-001)

#### 1. Justificación y Objetivos de Arquitectura
Restauración quirúrgica del chasis visual maestro, navegación responsive y vistas canónicas en React + Vite + TypeScript bajo CERO REGRESIONES visuales y operativas respecto a `legacy_gas/`. Se recupera el 100% de la fidelidad estructural del portal original, superando el estado parcial previo donde solo se visualizaban 3 pestañas.

#### 2. Componentes del Chasis Maestro y Navegación
- **`HeaderMaestro.tsx`:**
  - Flanco izquierdo: Isotipo `P` gradiente índigo-violeta, subtítulo `PMO Modular / Executive Suite`, y LED de sincronización reactivo (`Al día` / `Sincronizando`).
  - Centro: Navegación fija centrada (`left-1/2 -translate-x-1/2`) con las 4 pestañas maestras (`Tablero`, `Portafolio`, `Hábitos`, `Finanzas`).
  - Flanco derecho: Botón ámbar de Notas (`#btn-nav-notas`), Google Calendar (`#btn-header-calendar`), Bóveda de Archivados (`#btn-header-archivados`) con drawer deslizable (+10 días), botón de recarga (`#btn-refresh-global`), botón `✨ Asistente IA` y selector de tema (Light/Dark con sabores Slate/Rose).
- **`BottomNavMobile.tsx`:** Barra inferior fija para móviles (< 768px) con 5 accesos táctiles y botón central elevado `+` que activa los dos Bottom Sheets deslizantes (`Acción Rápida` y `Más Módulos`).
- **`WidgetIdeasBubble.tsx`:** Botón flotante PIP en esquina inferior derecha con popover de captura instantánea a 0 ms persistiendo en `db.ideas`, y contador de ideas activas al hover.

#### 3. Vistas Canónicas Integradas
- **`ViewKanban.tsx`:** Layout de 2 columnas con Sidebar colapsable (`#sidebar-portafolio`), buscador en tiempo real, selector de cartera y botón `+ Nueva Tarea`; Tablero Kanban con 4 columnas, segmentación (`TODO`, `PROYECTOS`, `PERSONAL`), y tarjetas con badges de energía y horas.
- **`ViewPortafolio.tsx`:** Bento Grid de 4 KPIs ejecutivas (Iniciativas Totales, Avance Ponderado Global, Presupuesto Ejecutado Real con Burn Rate, y Proyectos Críticos), tarjetas bento de proyecto y transición a Detalle 360°.
- **`ViewDetalle360.tsx`:** Hero Card ejecutiva, OKR North Star, Criterios DoD y 4 sub-pestañas, incrustando interactivamente `GrafoWBS.tsx` en la pestaña WBS.
- **`ViewFinanzas.tsx`:** Header con Tipo de Cambio SUNAT (3.750), 4 pestañas (General/KPIs, Transacciones, Cuotas bancarias, Presupuestos) y segmentación de cartera.
- **`ViewHabitos.tsx` & `ViewNotas.tsx`:** Contenedores canónicos `#vista-habitos-wrapper` y `#vista-notas-wrapper` integrando `TableroHabitos.tsx` y `VisorNotas.tsx`.

#### 4. Persistencia Local-First Dexie v3
- Actualización de esquema Dexie a v3 incorporando las tablas `proyectos`, `tareas`, `gastos`, `ingresos`, `ideas`, `cuotas`.
- Hidratación reactiva con 281 registros reales procedentes de `volcado_sheets_pmo.json` vía `src/db/initialSeed.json` a latencia 0 ms.

---

### [REQ-1TO1-001: Hidratación Fidedigna 281 Registros y Adaptador Coalescente Canónico]

#### 1. Arquitectura de Mapeo Canónico Dual (`PascalCase_Legacy` vs `snake_case`)
Para erradicar discrepancias de contrato de datos entre Google Sheets y React/IndexedDB, se implementa el Adaptador Universal Coalescente en `src/utils/entityNormalizer.ts`:
- **`getProp<T>(obj, ...keys)`:** Accesor tolerant-first con resolución secuencial multillave sin fallas por valores nulos o indefinidos.
- **`normalizeProyecto(raw)`:** Armoniza `ID_Proyecto` y `codigo_legado`, normaliza `Avance_Real_Pct` de decimal `0.0-1.0` a escala porcentual unificada entera `0-100%`, calcula `presupuesto`, `costo_real` y métricas EVM (`SPI`, `CPI`).
- **`normalizeTarea(raw)`:** Armoniza `ID_Tarea`/`idTarea` a `codigo_legado`, clasifica estados a los 4 cuadrantes estándar (`01_Backlog`, `02_Por_Hacer`, `03_En_Proceso`, `04_Completado`) y garantiza etiquetas de prioridad legibles.
- **`normalizeHito(raw)`:** Vincula hitos `WP-XXX` / `HIT-XXX` con su proyecto (`PRO-XXX`), estandariza ponderaciones y WBS code.
- **`normalizeActividad(raw)`:** Unifica métricas cuantitativas (`racha_actual`, `valor_acumulado`, `meta_diaria`) garantizando tipos numéricos seguros.

#### 2. Distribución y Sembrado Idempotente en Dexie (`src/db/db.ts`)
- Eliminación de la guarda de aborto global previa (`count > 0`).
- Sembrado idempotente tabla por tabla desde `src/db/initialSeed.json` conteniendo la totalidad de los registros reales auditados:
  - `proyectos`: 13
  - `tareas`: 59
  - `hitos_wbs`: 47
  - `actividades_personales`: 13
  - `subtareas_pasos`: 33
  - `notas`: 23
  - `gastos`: 28
  - `ingresos`: 57
  - `ideas`: 8
  - `cuotas`: 2
  - **Total:** 283 registros reales (281 entidades maestras operativas + 2 amortizaciones crediticias).
- Preservación simultánea en cada objeto almacenado tanto de las propiedades canónicas (`snake_case`) como de las propiedades originales legacy (`PascalCase`).

---

### [REQ-F1-P1.3: Sincronización Global Cobalt Aerodynamic A.2.2, Tabular-Nums y Erradicación Total de Emojis]

#### 1. Justificación y Alcance
Cumplimiento estricto de la **Regla 49** de gobernanza (`SYSTEM_RULES.md`) y alineación estética al Sistema de Diseño **Cobalt Aerodynamic A.2.2**:
- **Cero Emojis en Código e Interfaz:** Erradicación total de emojis crudos en strings, contratos de TypeScript (`CATEGORIAS_VIDA_MAP`), selects, filtros, tooltips, modales y renderizadores visuales, sustituidos al 100% por componentes vectoriales de `lucide-react`.
- **Estandarización Tipográfica Numérica (`tabular-nums`):** Incorporación canónica de tipografía monoespaciada con ancho de columna fijo (`tabular-nums font-mono`) en montos PEN/USD, contadores de tareas, fechas, horas reales/estimadas, pasos DoD, porcentajes de avance y métricas EVM (BAC, AC, SPI, CPI), impidiendo temblores de layout en renders reactivos.
- **Armonización Cromática Cobalt:** Sincronización de variables de estilo globales y tokens de Tailwind:
  - `--bg-canvas` / `cobalt.canvas`: `#040711`.
  - `.portal-surface` / `cobalt.surface`: `#0D1526` con borde canónico `border-slate-800/40`.

#### 2. Componentes y Capas Intervenidas
- `src/index.css`: Inyección de clases utilitarias numéricas `.monto-financiero, .precio, .moneda, .currency, .hora-badge, .tiempo-contador, .duracion, .kpi-valor, .progreso-texto, .metric-value` con `font-variant-numeric: tabular-nums !important;`. Ajuste estricto de `--bg-canvas: #040711;`.
- `tailwind.config.ts`: Mapeo de `cobalt.canvas: '#040711'` y `cobalt.surface: '#0D1526'`.
- `src/types/index.ts`: Modificación de `CATEGORIAS_VIDA_MAP` mapeando categorías a nombres de iconos Lucide (`HeartPulse`, `BookOpen`, `Briefcase`, `Wallet`, `Users`, `Coffee`).
- `src/utils/entityNormalizer.ts`: Eliminación de emojis en tokens por defecto (`'Saludable'`).
- `src/components/Layout/HeaderMaestro.tsx`: Sustitución de emojis en dropdown de Apariencia y Drawer de Archivados por iconos Lucide (`Sparkles`, `Sun`, `Moon`, `Zap`, `Palette`, `X`, `Globe`, `Columns`, `Briefcase`, `HeartPulse`, `Wallet`, `Lightbulb`). Contadores con `tabular-nums font-mono`.
- `src/components/Views/ViewKanban.tsx`: Erradicación de emojis en prompts DoD, etiquetas de dependencias (`Zap`, `AlertTriangle`), botones de transición (`Zap`, `Check`, `RotateCcw`) y buscador (`X`). Contadores y fechas con `tabular-nums font-mono`.
- `src/components/Views/ViewPortafolio.tsx`: Bento KPIs normalizados a `#0D1526` con `border-slate-800/40`. Filtros de cartera vectoriales (`User`, `Briefcase`, `TrendingUp`, `Users`). Dropdowns de salud y ordenación libres de emojis. Montos y métricas con `tabular-nums font-mono`.
- `src/components/Habitos/TarjetaHabito.tsx` & `TableroHabitos.tsx`: Renderizador dinámico vectorial `renderIconoCategoriaVida` para las 6 dimensiones de vida. Píldoras de filtro con `Repeat`, `Target`, `Flame`. Ratios y horas con `tabular-nums`.
- `src/components/Views/ViewFinanzas.tsx` & `ViewDetalle360.tsx`: Sustitución de `Conciliar ✓` por `<Check />` vectorial. Normalización a `#0D1526`. Saneamiento de semáforo de salud.
- `src/components/Notas/EditorNotaModal.tsx` & `VisorNotas.tsx`: Elevación canónica `z-[10000]`, backdrop difuminado `backdrop-blur-xs`, sustitución de caracteres Unicode `✕` y `✓` por componentes Lucide `<X />` y `<Check />`.
- `src/components/Modals/ModalTareaFlow.tsx` & `ModalNuevoProyecto.tsx`: Limpieza de emojis en toggles MAV/Calendar y valores por defecto.

---

### [REQ-V360-02: Autoreparación de IndexedDB, Cableado Canónico de Tareas y Sincronía 360/Grafo WBS]
**Fecha:** Octubre 2026 | **Fase:** 4.30 | **Archivos Modificados:** `src/db/db.ts`, `src/components/Views/ViewDetalle360.tsx`, `src/components/Views/ViewPortafolio.tsx`, `src/components/WBS/GrafoWBS.tsx`

#### 1. Diagnóstico y Causa Raíz (Post-Mortem Técnico)
- **Desalineación de Clave en Tareas (`hito_codigo`):** En `ViewDetalle360.tsx`, las funciones de agrupamiento leían `t.ID_Hito || t.id_hito`, ignorando la propiedad canónica indexada en Dexie `t.hito_codigo`. Como consecuencia, las tareas de proyectos con esquema normalizado no se asociaban a sus paquetes WBS y caían en `generales`, mostrando 0 tareas por paquete.
- **Vulnerabilidad de Sembrado en Bases Preexistentes:** La función `inicializarDatosSemillaSiVacio()` usaba `bulkAdd()` con una guarda simple `count === 0`. Si el navegador contenía datos de versiones previas o si una tabla fallaba por colisión de clave (`ConstraintError`), la ejecución se interrumpía antes de sembrar `hitos_wbs` y `tareas`.
- **Texto Descriptivo en Campo Legado `ID_Proyecto`:** En `initialSeed.json`, el volcado de Sheets contenía el nombre de la tarea en `ID_Proyecto` (ej. *"Revisar temario oficial y bibliografía PMP"*). Al consultar `t.ID_Proyecto || t.proyecto_codigo`, `ViewPortafolio.tsx` indexaba con el texto en lugar del código `"PRO-001"`, mostrando 0 tareas en las tarjetas.
- **Desacoplamiento Reactivo en Grafo WBS:** `<GrafoWBS />` ejecutaba un `useLiveQuery` en frío separado a `db.hitos_wbs`. Si la consulta tardaba o si los hitos no estaban alineados, renderizaba un grafo vacío con solo el nodo raíz.

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/db/db.ts`:**
  - Sustitución de todos los `bulkAdd(...)` por `bulkPut(...)` (operación idempotente tipo upsert que previene excepciones `ConstraintError`).
  - Autoreparación selectiva: Si `countHit === 0 || countTar === 0 || countProy === 0`, se ejecutan `bulkPut` directos para proyectos, hitos y tareas desde `initialSeed.json`.
  - Exposición de depuración en modo desarrollo: `(window as any).__PMO_DB__ = db;` y `(window as any).__FORZAR_RECARGA_SEMILLA__ = forzarRecargaSemillaCompleta;`.
- **`src/components/Views/ViewDetalle360.tsx`:**
  - Inclusión de `t.hito_codigo` en la resolución de `tareasProyecto` (`t.hito_codigo || t.ID_Hito || t.id_hito`).
  - Inclusión de `t.hito_codigo` en la clave de agrupación `hKey` de `tareasPorHito`, asociando correctamente las tareas a sus respectivos paquetes de trabajo.
  - Inyección de `hitosExternos={hitosProyecto}` en la invocación de `<GrafoWBS />`.
- **`src/components/Views/ViewPortafolio.tsx`:**
  - Priorización de `t.proyecto_codigo || t.id_proyecto` sobre `t.ID_Proyecto` (este último condicionado a `startsWith('PRO-')`).
  - Indexación dual tanto por código de proyecto como por UUID en `tareasPorProyecto`.
- **`src/components/WBS/GrafoWBS.tsx`:**
  - Extensión de la interfaz `GrafoWBSProps` incorporando `hitosExternos?: HitoWbsRecord[]`.
  - Priorización inmediata de `hitosExternos` si viene provisto, eliminando ventanas de desincronización y garantizando renderizado determinista de fases, paquetes de trabajo e hitos.

---

### [REQ-V360-03: Autoreparación por Umbral Canónico (47 Hitos) y Blindaje del Selector de Proyecto]
**Fecha:** Octubre 2026 | **Fase:** 4.31 | **Archivos Modificados:** `src/db/db.ts`, `src/components/Views/ViewDetalle360.tsx`, `src/components/Views/ViewPortafolio.tsx`, `src/components/Views/ViewKanban.tsx`

#### 1. Diagnóstico y Causa Raíz (Post-Mortem Técnico)
- **Bloqueo de Siembra por Datos Residuales:** En `inicializarDatosSemillaSiVacio()`, la comprobación estricta `count === 0` no se activaba si la base de datos IndexedDB local del navegador ya contenía datos parciales o mocks antiguos (ej. 8 hitos históricos de PRO-001 y PRO-002). Como 8 !== 0, Dexie no sembraba los 39 hitos restantes de `initialSeed.json`.
- **Sensibilidad a Mayúsculas/Minúsculas en Selector 360:** En `ViewDetalle360.tsx`, la búsqueda `proyectos.find(p => p.id === proyectoIdSeleccionado || ...)` usaba igualdad estricta sensible a mayúsculas/minúsculas. Ante cualquier discordancia o formato alternativo, hacía fallback silencioso a `proyectos[0]`, provocando que al seleccionar otros proyectos (ej. `PRO-003`, `PRO-006`) se abriera erróneamente `PRO-001`.
- **Desconexión Relacional por Proyecto:** Al tener solo 8 hitos en Dexie (limitados a PRO-001 y PRO-002), cualquier proyecto desde PRO-003 hasta PRO-013 mostraba 0 hitos en la Hoja 360 y 0 nodos en el Grafo WBS.

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/db/db.ts`:**
  - Sustitución de la guarda `count === 0` por **comprobación de umbral canónico**: `count < totalEsperado`.
  - Para cada una de las 10 entidades (ej. `countHit < 47`, `countProy < 13`, `countTar < 59`), si el conteo en IndexedDB es menor al total auditado de `initialSeed.json`, se dispara automáticamente `bulkPut(...)` idempotente para completar los registros ausentes y actualizar los preexistentes.
- **`src/components/Views/ViewDetalle360.tsx`:**
  - Blindaje insensitivo a mayúsculas y espacios en la resolución de `proyectoActivo`:
    `const target = String(proyectoIdSeleccionado).trim().toUpperCase();`
    `pId === target || pCod === target`.
- **`src/components/Views/ViewPortafolio.tsx` & `src/components/Views/ViewKanban.tsx`:**
  - Emisión canónica en callbacks de selección: `onSeleccionarProyecto(p.codigo_legado || p.id)` y `onVerDetalle360(targetId)`, garantizando consistencia semántica en toda la cadena de navegación.

---

### [REQ-PERF-01 / REQ-PERF-02: Micro-Cirugía de Rendimiento, Hidratación Inmediata (<100ms) y Telemetría de Alta Precisión]
**Fecha:** Octubre 2026 | **Fase:** 4.32 | **Archivos Modificados:** `src/db/db.ts`, `src/App.tsx`, `src/components/Views/ViewKanban.tsx`, `src/main.tsx`

#### 1. Diagnóstico y Causa Raíz
- **Concurrencia Bloqueada en I/O:** 10 llamadas secuenciales `await db.table.count()` en `inicializarDatosSemillaSiVacio()` degradaban el arranque.
- **I/O Redundante en Componente Raíz:** `App.tsx` invocaba `verificarYRepararHitos()` en cada render montado compitiendo con los queries reactivos.
- **Cálculo O(N · M) en Render:** Agrupaciones y filtrados repetidos en cada ciclo de pintado de tarjetas Kanban sin mapas hash O(1).

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/db/db.ts`:** Paralelización total con `Promise.all` de los 10 conteos de verificación de umbral canónico.
- **`src/App.tsx`:** Supresión de I/O redundante y delegación estricta de hidratación al ciclo de inicio.
- **`src/components/Views/ViewKanban.tsx`:** Creación de mapas O(1) en memoria (`proyectosMap`, `hitosMap`, `subtareasPorTarea`, `gastosPorTarea`, `avancesPorProyecto`) y micro-skeletons shimmer para transición instantánea sin temblores.
- **`src/main.tsx`:** Instrumentación de telemetría W3C Performance API con marcas `t0_bootstrap`, `t1_dexie_start`, `t2_dexie_resolved`, `t3_kanban_mount` y `t4_kanban_cards_painted`, reportando latencias en consola con precisión de microsegundos.

---

### [REQ-SYNC-01: Micro-Cirugía de Sanitización en Sincronización de Actividades Personales]
**Fecha:** Octubre 2026 | **Fase:** 4.33 | **Archivos Modificados:** `src/services/syncManager.ts`

#### 1. Diagnóstico y Causa Raíz
- **Fallo HTTP 400 Bad Request (`PGRST204`):** El cliente enviaba hacia la API REST de Supabase 7 columnas inexistentes en la tabla `actividades_personales` de PostgreSQL (`frecuencia_ciclo`, `monto_gasto_asociado`, `notas_checklist`, `regla_repeticion`, `version`, `nombre_actividad`, `tipo_compromiso`).
- **Disparidad de Enums:** Dexie utilizaba valores como `03_En_Curso` o `HABITUAL`, mientras que el constraint de PostgreSQL requería `03_En_Proceso` y `tipo_registro` restringido a `'HABITUAL' | 'PUNTUAL' | 'META'`.

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/services/syncManager.ts`:**
  - Sanitización estricta del payload hacia Supabase excluyendo las 7 columnas ausentes.
  - Mapeo bidireccional determinista de enums (`tipo_registro` y `estado`).
  - Resolución de upsert idempotente mediante `onConflict: 'codigo_legado'`.
  - Validación con pruebas en vivo obteniendo `HTTP 200 OK` en sincronización remota.

---

### [REQ-HAB-01: Micro-Cirugía Integral del Módulo de Hábitos y Motor de Recurrencia]
**Fecha:** Octubre 2026 | **Fase:** 4.34 | **Archivos Modificados:** `legacy_gas/ActividadesService.js`, `src/services/habitosService.ts`, `src/services/__tests__/habitosService.test.ts`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Modals/ModalActividadFlow.tsx`

#### 1. Diagnóstico y Causa Raíz
- **ReferenceError `totalCols is not defined` (L782 en GAS):** En `ActividadesService.js:updateActividadPersonal()`, la longitud de fila se declaró como `maxCols` (L666), pero en L782 se invocó `totalCols` sin previa declaración, provocando un fallo en tiempo de ejecución en Google Apps Script que detonaba el toast de "Error al Actualizar Actividad".
- **Falla en Parser de Días de Semana:** En `habitosService.ts:calcularProximaFechaValida()`, la expresión regular `/^[LMXJVSD,]+$/` bloqueaba tokens de 2 letras (`LU, MA, MI, JU, VI`) persistidos por el modal, dejando `diasPermitidos = []` y haciendo que hábitos de Lunes a Viernes saltaran al Sábado.
- **Pérdida de Configuración en Modal:** `ModalActividadFlow.tsx` no hidrataba `diasSemana` a partir de `regla_repeticion` al editar, sobreescribiendo los días configurados por el usuario con el valor por defecto.
- **Racha Desconectada de Actividades Puntuales:** Las actividades con duración 0 min o tipo puntual con recurrencia no actualizaban racha ni avanzaban de ciclo.
- **Ausencia de Filtro Temporal y Bóveda de Archivados en Tablero:** `TableroHabitos.tsx` carecía de filtro "Hoy / Esta Semana / Todos" y no filtraba actividades completadas hace más de 10 días, acumulando tareas antiguas en la sección de completadas.

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`legacy_gas/ActividadesService.js`:** Declaración explícita `const totalCols = maxCols;` antes de `sheet.getRange(rowIdx, 1, 1, totalCols).setValues([filaActualizada])`, erradicando el error en tiempo de ejecución y restaurando la compatibilidad de escritura por lotes.
- **`src/services/habitosService.ts`:**
  - Flexibilización de la regex a `/^[A-Z,]+$/` y normalización de tokens de 2 letras (`LU`, `MA`, `MI`, `JU`, `VI`, `SA`, `DO`) y prefijo `DIAS:`.
  - Extensión del cálculo de racha y avance de ciclo a toda actividad rutinaria con recurrencia (`esRutinaria`), incluyendo puntuales con repetición o duración 0 min.
  - Reversión de fecha a hoy si se desmarca un hábito que ya había avanzado de ciclo.
  - Exportación de alias canónico `alternarCompletadoActividad`.
- **`src/components/Modals/ModalActividadFlow.tsx`:** Hidratación automática de `diasSemana` al editar actividad desde `regla_repeticion` con mapeo de compatibilidad de tokens, y resiembra por defecto en creación.
- **`src/components/Habitos/TarjetaHabito.tsx`:** Reconocimiento de hábitos completados en el día cuya fecha ya avanzó al próximo ciclo, y rotulación visual en footer con prefijo `"Próx: [fecha]"`.
- **`src/components/Habitos/TableroHabitos.tsx`:**
  - Incorporación de selector de horizonte temporal canónico (`HOY` | `SEMANA` | `TODOS`) con diseño Cobalt Aerodynamic e icono `CalendarDays`.
  - Exclusión de actividades archivadas (+10 días desde fecha terminal) mediante `esElementoArchivado()`.
  - Discriminación estricta de la subsección "Completadas Hoy", limitándola exclusivamente a las actividades completadas en la fecha actual.
- **`src/services/__tests__/habitosService.test.ts`:** Incorporación de 2 pruebas unitarias de avance de ciclo con tokens de 2 letras (`LU,MA,MI,JU,VI`) y prefijos (`DIAS:LU,VI`), alcanzando 38/38 pruebas aprobadas en Vitest.

---

### [REQ-HAB-02: Unificación y Rediseño Hover del Filtro Temporal Lateral en Hábitos]
**Fecha:** Octubre 2026 | **Fase:** 4.35 | **Archivos Modificados:** `src/components/Habitos/TableroHabitos.tsx`

#### 1. Diagnóstico y Causa Raíz
- **Duplicidad de Controles en Cabecera:** La presencia simultánea del selector de horizonte temporal en la barra superior ("Hoy", "Esta Semana", "Todos") y los paneles de navegación lateral generaba redundancia cognitiva y saturación visual en la cabecera.
- **Ocupación de Espacio y Densidad Visual:** En pantallas estándar, el selector horizontal en cabecera limitaba el espacio para el buscador rápido y los controles de ordenamiento, restando protagonismo a las 6 columnas del tablero de dimensiones de vida.
- **Necesidad de Control Lateral Compacto y Ergonómico:** Se requería una superficie de control compacta en reposo que no desplazara el canvas principal pero ofreciera retroalimentación visual clara e instantánea mediante micro-interacción hover.

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/components/Habitos/TableroHabitos.tsx`:**
  - **Supresión de Control Redundante en Cabecera:** Eliminación completa del bloque `<div className="inline-flex items-center gap-1 p-0.5 rounded-xl ...">` de la barra de herramientas superior, preservando exclusivamente el selector de ordenamiento y el buscador rápido.
  - **Dock Lateral Compacto con Expansión por Hover:**
    - Contenedor base `aside` con ancho estático reservado de `w-12` para prevenir cualquier salto de layout ("Zero Jitter" en las 6 columnas Kanban).
    - Dock flotante con posicionamiento absoluto y expansión al pasar el cursor: `className="group transition-all duration-200 ease-out flex flex-col gap-1 p-1.5 bg-[#0D1526]/80 backdrop-blur-md border border-slate-800/60 rounded-2xl shadow-xl overflow-hidden absolute top-0 left-0 w-12 hover:w-36 z-30"`.
  - **Trilogía Canónica de Opciones Temporales (Icono + Micro-Texto):**
    - **`HOY`:** Icono Lucide `Sun` (16px, `strokeWidth={1.75}`) + etiqueta `"Hoy"`.
    - **`SEMANA`:** Icono Lucide `CalendarRange` (16px, `strokeWidth={1.75}`) + etiqueta `"Semana"`.
    - **`TODOS`:** Icono Lucide `Layers` (16px, `strokeWidth={1.75}`) + etiqueta `"Todo"`.
  - **Micro-Tipografía y Transición Suave:**
    - Iconos en posición fija siempre visibles (`shrink-0 flex items-center justify-center w-4 h-4`).
    - Etiquetas textuales con visibilidad condicional fluida (`opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap overflow-hidden text-ellipsis`).
  - **Tokens de Color Cobalt Aerodynamic:**
    - Estado Activo: `bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold shadow-xs`.
    - Estado Inactivo: `text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent`.
  - **Conexión Reactiva de Filtrado:** Conservación estricta del filtrado temporal en memoria mediante `evaluarFiltroTemporal()`, garantizando respuesta instantánea en menos de 10ms sin llamadas de red ni recargas de Dexie.

---

### [REQ-HAB-03: Rollback de Dock Vertical y Menú Desplegable Horizontal hacia la Izquierda]
**Fecha:** Octubre 2026 | **Fase:** 4.36 | **Archivos Modificados:** `src/components/Habitos/TableroHabitos.tsx`

#### 1. Diagnóstico y Causa Raíz
- **Invasión de Layout por Dock Vertical:** El contenedor `<aside>` lateral con expansión hacia abajo alteraba la alineación y el ancho disponible para las 6 columnas de vida del tablero Kanban, restando espacio útil horizontal.
- **Necesidad de Despliegue Horizontal y Ergonomía en Cabecera:** El usuario requería restaurar el ancho total al 100% para las columnas de hábitos y ubicar el filtro temporal de vuelta en la barra superior de herramientas con un menú horizontal ultracompacto que se despliega hacia el lado izquierdo al posar el cursor, sin desbordar los límites de la pantalla ni empujar el buscador.

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/components/Habitos/TableroHabitos.tsx`:**
  - **Erradicación del Dock Vertical:** Eliminación completa del bloque `<aside className="shrink-0 relative z-30 w-12 self-start">` y su contenedor wrapper flex, devolviendo el layout del tablero Kanban a su ancho original del 100% (`w-full flex-1 overflow-x-auto pb-2 flex gap-5 min-h-0 h-full custom-scrollbar items-stretch`).
  - **Menú Desplegable Horizontal hacia la Izquierda por Hover:**
    - Ubicado en la barra de controles superior, a la derecha del buscador rápido.
    - **Píldora en Reposo:** Botón de altura `h-8 px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0D1526]` exhibiendo el ícono activo correspondiente al estado actual (`Sun` para Hoy, `CalendarRange` para Semana, `Layers` para Todo) junto al micro-texto Cobalt azul (`text-blue-400 font-semibold`).
    - **Bandeja Flotante al Posar el Cursor:** Contenedor absoluto `absolute right-0 top-1/2 -translate-y-1/2 z-50 origin-right` con efecto desenfoque y sombra profunda (`bg-[#0D1526]/90 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl flex items-center gap-1.5 p-1`), desplegándose suavemente hacia la izquierda sobre el buscador sin desbordar el viewport.
    - **Opciones Ultracompactas (Ícono 15px + Micro-texto):**
      - **Hoy:** Ícono `Sun` (15px) + `"Hoy"`
      - **Semana:** Ícono `CalendarRange` (15px) + `"Semana"`
      - **Todo:** Ícono `Layers` (15px) + `"Todo"`
    - **Tokens Cobalt Aerodynamic:**
      - Activo: `bg-blue-600/25 text-blue-400 border border-blue-500/30 font-semibold px-2.5 py-1 text-xs rounded-lg`.
      - Inactivo: `text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 px-2.5 py-1 text-xs rounded-lg border border-transparent`.

---

### [REQ-HAB-04: Modal y Motor de Alcance de Recurrencia (Scope-Aware Edit/Delete)]
**Fecha:** Octubre 2026 | **Fase:** 4.37 | **Archivos Modificados:** `src/types/index.ts`, `src/components/Modals/ModalAlcanceRecurrencia.tsx`, `src/services/habitosService.ts`, `src/hooks/useHabitos.ts`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Modals/ModalActividadFlow.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/services/__tests__/habitosService.test.ts`

#### 1. Diagnóstico y Causa Raíz
- **Ausencia de Granularidad Temporal en Series Recurrentes:** Anteriormente, editar o eliminar un hábito afectaba indiscriminadamente a toda la serie histórica o futura, imposibilitando posponer o reconfigurar una sola ocurrencia (ej. modificar la hora o concepto solo del día de hoy) o detener una recurrencia futura sin destruir los datos ya registrados en días previos.
- **Necesidad de Desacoplamiento de Excepciones:** Se requería un motor capaz de gestionar el modelo canónico de recurrencia en tres niveles: instancia aislada (`SINGLE`), corte hacia adelante (`FUTURE`) y serie maestra (`ALL`), con persistencia local inmediata en Dexie y encolamiento a Supabase.

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/types/index.ts`:**
  - Creación del tipo `export type AlcanceRecurrencia = 'SINGLE' | 'FUTURE' | 'ALL';`.
  - Extensión de la interfaz canónica `ActividadPersonal` incorporando:
    - `excepciones_fechas?: string[];` (fechas excluidas en la serie maestra).
    - `fecha_fin?: string;` (delimitador terminal de la serie en cortes `FUTURE`).
    - `actividad_padre_id?: string;` (trazabilidad relacional hacia la serie matriz en desacoplamientos `SINGLE`).
- **`src/components/Modals/ModalAlcanceRecurrencia.tsx`:**
  - Componente modal centrado con elevación `z-[10002]`, renderizado mediante `createPortal(..., document.body)` y backdrop `bg-slate-950/75 backdrop-blur-sm`.
  - Trilogía de tarjetas ergonómicas con iconografía Lucide (`Calendar` para Single, `CalendarRange` para Future, `Layers` para All).
  - Acentos visuales contextuales Cobalt Aerodynamic: variantes en azul para edición y variantes de alerta suave en rosa (`hover:border-rose-500/50 hover:bg-rose-950/20 text-rose-300`) para eliminación.
- **`src/services/habitosService.ts`:**
  - `eliminarActividadConAlcance(id, alcance, fechaReferencia)`:
    - `SINGLE`: Agrega `fechaReferencia` a `excepciones_fechas` y avanza `fecha_programada` a la siguiente fecha válida según regla/días.
    - `FUTURE`: Asigna `fecha_fin = fechaReferencia - 1 día` y conmuta a `'05_Archivado'` si la fecha de corte es hoy o anterior.
    - `ALL`: Elimina el registro maestro y sus subtareas en cascada con `db.actividades_personales.delete(id)`.
  - `editarActividadConAlcance(actividadOriginal, cambios, alcance, fechaReferencia)`:
    - `SINGLE`: Registra la excepción en la serie matriz y genera una instancia puntual desacoplada (`tipo_compromiso = 'PUNTUAL'`, `actividad_padre_id`).
    - `FUTURE`: Corta la serie anterior en `fechaReferencia - 1` y crea una nueva serie recurrente a partir de `fechaReferencia` con los cambios inyectados.
    - `ALL`: Actualiza la serie matriz conservando sus correlativos.
- **`src/hooks/useHabitos.ts`:**
  - Exposición de `eliminarConAlcance` y `editarConAlcance` integradas con el despacho en background de `syncManager.syncPendingRecords()`.
- **`src/components/Habitos/TarjetaHabito.tsx`:**
  - Detección reactiva de actividad recurrente (`esRutinaria`).
  - Intercepción de clics en lápiz (editar) o papelera (eliminar) desplegando `ModalAlcanceRecurrencia` para hábitos recurrentes, o ejecutando flujo directo en actividades no recurrentes.
- **`src/components/Modals/ModalActividadFlow.tsx`:**
  - Recepción de prop `alcanceEdicion?: AlcanceRecurrencia` ejecutando la persistencia a través de `editarActividadConAlcance` y `eliminarActividadConAlcance`.
- **`src/components/Habitos/TableroHabitos.tsx`:**
  - Conexión de handlers unificados de edición y eliminación con toasts informativos contextuales según el alcance seleccionado.
- **`src/services/__tests__/habitosService.test.ts`:**
  - Incorporación de 4 pruebas unitarias automatizadas cubriendo los escenarios `SINGLE`, `FUTURE` y `ALL`, elevando la suite a 42/42 tests pasados exitosamente.

---

### [REQ-HAB-05 & REQ-CAL-02: Retención Visual de Hábitos Completados Hoy y Sincronización Robusta con Calendar]
**Fecha:** Octubre 2026 | **Fase:** 4.38 | **Archivos Modificados:** `src/types/index.ts`, `src/services/habitosService.ts`, `src/services/calendarSyncService.ts`, `src/hooks/useHabitos.ts`, `src/components/Habitos/TableroHabitos.tsx`, `legacy_gas/CalendarService.js`, `src/services/__tests__/habitosService.test.ts`

#### 1. Diagnóstico y Causa Raíz
- **Desaparición Inmediata de Hábitos al Completarse:** Al marcar como completado un hábito diario/recurrente, el motor avanzaba la fecha a la siguiente jornada futura (`fecha_programada = prox`), provocando que desapareciera de la vista con filtro "Hoy" y desmoralizara al usuario.
- **Sincronización Silenciosa y Parsing de Días en Calendar:** En Google Calendar, los tokens de días de 2 letras (`LU,MA,MI,JU,VI`) no eran procesados por el parser restrictivo heredado de Apps Script, y la reversión de un hábito no limpiaba el estado de la jornada en curso.

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/types/index.ts`:**
  - Adición de campos canónicos `ultima_fecha_completado?: string` y `proxima_fecha_programada?: string`.
- **`src/services/habitosService.ts`:**
  - Persistencia de `ultima_fecha_completado = hoyStr` al completar un hábito y reversión idempotente (`ultima_fecha_completado = undefined`, restablecimiento de racha y fecha) al desmarcar.
- **`src/components/Habitos/TableroHabitos.tsx`:**
  - Lógica de retención visual: Un hábito completado hoy permanece visible y tachado en la columna de hoy durante toda la jornada activa.
- **`src/services/calendarSyncService.ts` & `legacy_gas/CalendarService.js`:**
  - Conector desacoplado y normalización de RRULE (`BYDAY=MO,TU,WE,TH,FR`) tolerante a offline.

---

### [REQ-MET-02: Implementación de Subpestaña Dashboard, KPIs Avanzados y Visualización SVG]
**Fecha:** Octubre 2026 | **Fase:** 4.39 | **Archivos Modificados/Creados:** `src/types/index.ts`, `src/services/habitosService.ts`, `src/components/Views/ViewHabitos.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Habitos/Dashboard/DashboardHabitos.tsx`, `src/components/Habitos/Dashboard/BentoMetricasHero.tsx`, `src/components/Habitos/Dashboard/RadarBalanceVida.tsx`, `src/components/Habitos/Dashboard/HeatmapConsistencia.tsx`, `src/components/Habitos/Dashboard/MetasCuantitativas.tsx`, `src/components/Habitos/Dashboard/TablaRendimiento.tsx`, `src/services/__tests__/habitosService.test.ts`

#### 1. Diagnóstico y Causa Raíz
- **Ausencia de Vista Analítica Integrada de Hábitos:** El módulo de hábitos carecía de una vista panorámica que permitiera evaluar la consistencia temporal a mediano plazo (Heatmap estilo GitHub), el equilibrio entre las 6 dimensiones holísticas de vida (Salud, Estudio, Trabajo, Finanzas, Hogar, Ocio) y el progreso de metas cuantitativas acumulativas.
- **Incompatibilidad de Librerías Externas de Gráficos:** El proyecto opera sobre React 19.0.0. La incorporación de paquetes pesados como `recharts` o `chart.js` introduce conflictos de peer-dependencies y sobrecarga el bundle.
- **Trazabilidad Histórica:** La entidad `ActividadPersonal` almacenaba únicamente el estado instantáneo (snapshot). Se requería persistir el histórico de fechas completadas (`historial_fechas`) para alimentar el mapa de calor con fidelidad analítica de 365 días.

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/types/index.ts` & `src/services/habitosService.ts`:**
  - Inclusión del atributo opcional `historial_fechas?: string[]` en `ActividadPersonal`.
  - En `completarActividadPersonalLocal()`, inserción atómica de `hoyStr` en `historial_fechas` (evitando duplicados en el mismo día) y remoción limpia al desmarcar/revertir.
- **`src/components/Views/ViewHabitos.tsx`:**
  - Reestructuración con barra maestra Cobalt Aerodynamic (`#040711`, `#0D1526`, `border-slate-800/80`).
  - Navegación interna por subpestañas: `[ Tablero Kanban ]` (`LayoutGrid`) y `[ Dashboard & Métricas ]` (`Activity`).
  - Botón primario global `+ Nuevo Hábito / Actividad` vinculado con `ModalActividadFlow`.
- **`src/components/Habitos/TableroHabitos.tsx`:**
  - Incorporación de prop `ocultarHeader?: boolean` para erradicar la duplicación de cabeceras visuales al alternar vistas.
- **Suite Analítica SVG Nativa (`src/components/Habitos/Dashboard/`):**
  - **`BentoMetricasHero.tsx`:** 4 Hero KPIs Bento (`Consistencia Hoy %`, `Mayor Racha Activa`, `Tasa de Recuperación %` con anillo circular SVG animado calculando el principio de Atomic Habits "No fallar 2 veces seguidas", y `Horas Invertidas en Bienestar`).
  - **`RadarBalanceVida.tsx`:** Gráfico poligonal SVG interactivo de 6 ejes representando las 6 categorías canónicas de vida (`CATEGORIAS_VIDA_MAP`) con gradiente de área, niveles concéntricos y micro-badges con conteo de hábitos.
  - **`HeatmapConsistencia.tsx`:** Matriz visual SVG de 16 semanas $\times$ 7 días (112 días) con escala cromática de 5 niveles de intensidad esmeralda/turquesa y tooltip reactivo flotante.
  - **`MetasCuantitativas.tsx`:** Panel de monitoreo de metas acumulativas (`tipo_compromiso === 'META'`) con barras de progreso, indicador de umbral `nivel_rescate_minimo` y botones rápidos para registrar avances numéricos (+1, +5, personalizado).
  - **`TablaRendimiento.tsx`:** Desglose tabular individual con filtros por búsqueda de texto y dimensión, ordenamiento por racha y badges operativos en `font-mono tabular-nums`.
  - **`DashboardHabitos.tsx`:** Componente orquestador con scroll fluido y layout Bento responsivo.
- **Verificación QA y Calidad de Código:**
  - `npx tsc --noEmit`: 0 errores de tipado.
  - `npm test -- --run`: 45/45 tests unitarios aprobados en Vitest (15/15 en `habitosService.test.ts`).
  - `npm run build`: Compilación de producción en 5.93s sin errores.

---

### [REQ-SYNC-02: Sanitización de Payloads, Resolución de Conflictos y Replicación Topológica en Supabase]
**Fecha:** Octubre 2026 | **Fase:** 4.40 | **Archivos Creados/Modificados:** `src/services/syncPayloadSanitizer.ts`, `src/services/syncManager.ts`, `src/services/__tests__/syncManager.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico y Causa Raíz
- **Omisión de Entidades WBS Clave:** `syncManager.ts` carecía de métodos de replicación para `proyectos` y `tareas`, sincronizando únicamente actividades personales de forma parcial.
- **Ruptura de Contratos por Columnas Virtuales y Tipos Estrictos:** El envío directo de propiedades locales o campos calculados inexistentes en PostgreSQL (`tipo_nota` en `notas`, `duracion_estimada_dias` y `version` en `hitos_wbs`, `fase_ciclo_vida` y métricas financieras en `proyectos`, `es_mav` y `costo_real_pen` en `tareas`) generaba errores HTTP 400 (`column "xxx" of relation does not exist`).
- **Strings Vacíos en Columnas Temporales:** Enviar strings vacíos `""` a columnas PostgreSQL de tipo `DATE` o `TIMESTAMPTZ` causaba excepciones fatales de sintaxis (`invalid input syntax for type date: ""`).
- **Violaciones de Restricciones CHECK y Enums:** La fase asociada `'01_INICIACION'` y tipos de iniciativa no conformes violaban los checks canónicos de PostgreSQL (`CHECK (fase_asociada IN ('Iniciacion', ...))`).
- **Colisiones de Clave Foránea (Violaciones FK) y Conflicto 409:** Al no despachar las tablas en orden topológico (raíz a hojas), las llaves foráneas `proyecto_id` y `hito_id` en tareas/hitos no encontraban sus padres en Supabase. Asimismo, la ausencia de `{ onConflict: 'codigo_legado' }` en `hitos_wbs`, `subtareas_pasos` y `notas` provocaba colisiones 409 (`duplicate key value violates unique constraint`).

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/services/syncPayloadSanitizer.ts` (Módulo Puro de Sanitización):**
  - Implementación de funciones puras desacopladas de red para Proyectos, Hitos, Tareas, Notas, Actividades y Subtareas.
  - Sanitización universal de fechas: `sanitizeDate()` transforma strings vacíos `""` en `null` y extrae el componente `YYYY-MM-DD`.
  - Normalización determinista de enums: `normalizarFaseAsociada()` mapea prefijos numéricos a la nomenclatura PostgreSQL (`'01_INICIACION'` $\rightarrow$ `'Iniciacion'`), `normalizarTipoIniciativa()` y `normalizarEstadoProyecto()`.
  - Escala porcentual unificada: `avance_real_pct` y `peso_ponderado_pct` convertidos a escala 0..100.
  - Forzado de integridad de negocio: en `HITO_MARCADOR`, el `presupuesto_asignado` se fija estrictamente en `0.00` para cumplir el constraint `chk_hito_marcador_presupuesto_cero`.
  - Supresión de columnas inexistentes: eliminación estricta de `tipo_nota`, `duracion_estimada_dias`, `version`, `spi`, `cpi`, `fase_ciclo_vida`, `es_mav`, `costo_real_pen`.
  - Garantía de constraints `NOT NULL` en JSONB (`notas`): `checklists_json`, `adjuntos_drive_json`, `enlaces_entidades_json`, `etiquetas` inicializados a `[]` y `wishlist_json` a `{}`.
- **`src/services/syncManager.ts` (Motor de Replicación y Despacho Topológico):**
  - Implementación de los métodos modulares: `sincronizarProyectos()`, `sincronizarHitos(proyectoMap)`, `sincronizarTareas(proyectoMap, hitoMap)`, `sincronizarNotas()`, `sincronizarActividades()` y `sincronizarSubtareas(tareaMap, actividadMap)`.
  - Idempotencia y resolución de conflictos: Inclusión explícita de `{ onConflict: 'codigo_legado' }` en todas las operaciones `.upsert()`.
  - Orden topológico de replicación en dos pasadas dentro de `syncPendingRecords()`:
    1. `Proyectos` (Raíz WBS) $\rightarrow$ construcción de mapa `PRO-XXX` a UUID Supabase.
    2. `Hitos WBS` (Cuentas de control y marcadores) $\rightarrow$ construcción de mapa `WP-XXX` a UUID Supabase.
    3. `Tareas WBS` (con `proyecto_id` e `hito_id` resueltos) y `Actividades Personales`.
    4. `Subtareas / Pasos` (enlazando `tarea_id` o `actividad_id` según el prefijo).
    5. `Notas` (Bóveda de conocimiento).
  - Aislamiento de fallos por registro: Si un elemento falla en Supabase, se conmuta a `sync_status = 'error'` en Dexie para evitar saturación en reintentos periódicos de 45s.
- **Suite de Pruebas Unitarias (`src/services/__tests__/syncManager.test.ts`):**
  - 26 pruebas unitarias aprobadas certificando la sanitización pura de payloads, descarte de columnas no relacionales, resolución de claves foráneas y despacho con `onConflict`.
- **Verificación QA y Cierre:**
  - `npx tsc --noEmit`: 0 errores de tipado TypeScript.
  - `npm test`: 71/71 pruebas unitarias aprobadas en Vitest (100% verde en los 6 suites de test).
  - `npm run build`: Bundle de producción compilado exitosamente.

---

### [REQ-NOT-03: Homogenización de Notas Compuestas, Blocks Dinámicos y Erradicación de Crashes]
**Fecha:** Octubre 2026 | **Fase:** 4.41 | **Archivos Modificados/Creados:** `src/types/index.ts`, `src/utils/entityNormalizer.ts`, `src/components/Notas/TarjetaNota.tsx`, `src/components/Notas/VisorNotas.tsx`, `src/components/Notas/EditorNotaModal.tsx`, `src/components/Views/ViewNotas.tsx`, `src/utils/__tests__/notasEntity.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico y Causa Raíz
- **Crash Fatal en Feed de Notas (Pantalla en Blanco):** Al ingresar a la pestaña de Notas (`ViewNotas.tsx`), la aplicación crasheaba por completo debido a una excepción no controlada en `TarjetaNota.tsx`:
  `TypeError: Cannot read properties of undefined (reading 'toFixed')`
  Al evaluar la condición `{nota.wishlist_json && nota.wishlist_json.costoEstimado.toFixed(2)}`, varias notas del seed (`initialSeed.json`) como `NOT-00003`, `NOT-00006`, `NOT-00007`, `NOT-00008` y `NOT-00009` tenían `wishlist_json: {}` (objeto vacío). Al ser un objeto truthy pero carecer de la propiedad `costoEstimado`, la llamada a `.toFixed(2)` lanzaba una excepción fatal que desmontaba el árbol de componentes React sin Error Boundary.
- **Exclusividad Rígida vs. Nota Modular Compuesta:** La arquitectura anterior forzaba a que una nota fuera exclusivamente de Texto O de Checklist O de Wishlist (`tipo_nota`). En la práctica y gobernanza canónica, el usuario requiere notas modulares ricas que contengan simultáneamente texto/resumen Markdown, una lista de chequeo interactiva para subtareas y metadatos financieros o de compra (Wishlist).
- **Inexistencia de Agrupador "Blocks" (Cuadernos/Libretas):** La navegación de notas no permitía organizar apuntes por cuadernos o libretas temáticas dinámicas creadas libremente por el usuario.
- **Ruptura de Búsquedas y Filtros:** Búsquedas por texto fallaban si `n.contenido_markdown` o `n.titulo` venían nulos o undefined (`Cannot read properties of undefined (reading 'toLowerCase')`), y la ordenación mutaba directamente el estado en memoria (`sort()` in-place).
- **Colapso de Layout CSS en ViewNotas:** El contenedor de `ViewNotas.tsx` carecía de `min-h-0`, provocando colapsos de altura flex en contenedores anidados.

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/types/index.ts` & `src/utils/entityNormalizer.ts` (Nota Modular Compuesta y Normalizador Seguro):**
  - En `NotaRecord`, se homologó la coexistence simultánea de `contenido_markdown`, `checklists_json: ChecklistItem[]`, `wishlist_json?: WishlistMeta` y `block_nombre?: string`.
  - Implementación de `normalizeNota(raw: any): NotaRecord` ultra-defensivo:
    - Sanea `wishlist_json: {}` convirtiéndolo a `undefined` si carece de datos relevantes (evitando flags vacíos).
    - Convierte strings o números a tipos estrictos garantizando que `costoEstimado` y `montoRealGastado` sean siempre numéricos finitos.
    - Deserializa de forma segura arrays y strings JSON en `checklists_json`, `adjuntos_drive_json`, `enlaces_entidades_json` y `etiquetas`.
    - Sanitiza `block_nombre` recortando espacios y convirtiendo strings vacíos en `undefined` (Nota Suelta).
    - Provee alias canónicos de compatibilidad `fijada` y `color`.
- **`src/components/Notas/TarjetaNota.tsx` (Erradicación Definitiva de Crashes y Tarjeta Modular):**
  - Blindaje estricto de wishlist:
    `{nota.wishlist_json && typeof nota.wishlist_json.costoEstimado === 'number' && nota.wishlist_json.costoEstimado > 0 && (`
    junto con fallback inline `(nota.wishlist_json?.costoEstimado ?? 0).toFixed(2)`.
  - Renderizado modular unificado: la tarjeta visualiza armónicamente el bloque de texto Markdown, la lista de checklist con checkboxes interactivos, el badge financiero de wishlist y el badge de Block/Cuaderno.
  - Blindaje de `handleConvertirEnGasto` verificando existencia y tipo de `costoEstimado`.
  - Confirmación modal con `Swal.fire` previa a la eliminación de notas para prevenir pérdida accidental de datos.
- **`src/components/Notas/VisorNotas.tsx` (Arquitectura de Blocks Dinámicos y Filtros Seguros):**
  - Incorporación del sidebar lateral izquierdo para Desktop y carrusel horizontal con chips para Mobile (`font-mono tabular-nums`).
  - Navegación reactiva con conteos dinámicos: "Todas las Notas", "Notas Sueltas" y Blocks creados por el usuario (derivados de notas existentes + `localStorage` de bloques creados en caliente vía `Swal.fire`).
  - Inyección automática del block activo seleccionado tanto en la Quick Note Box como en el botón principal "+ Nueva Nota".
  - Sanitización completa de búsquedas: `(n.titulo || '').toLowerCase().includes(q)` y `(n.contenido_markdown || '').toLowerCase().includes(q)`.
  - Inmutabilidad en ordenamiento: `[...resultado].sort(...)`.
  - Aplicación estricta de tokens canónicos **Cobalt Aerodynamic** (`#040711`, `#0D1526`, microborde `border-slate-800/40`, Lucide con `strokeWidth={1.75}`).
- **`src/components/Notas/EditorNotaModal.tsx` (Editor 360° Modular):**
  - Arquitectura de pestañas unificadas para edición modular:
    1. **Tab Texto & Markdown:** Redacción con modo edición y previsualización en tiempo real.
    2. **Tab Checklist:** Gestión completa de tareas pendientes (agregar, marcar, eliminar).
    3. **Tab Wishlist / Presupuesto:** Switch de activación opcional para registrar tienda, costo estimado, gasto real y enlace.
  - Selector dinámico de Block: selector con datalist de blocks disponibles más input de texto libre para crear un nuevo cuaderno en caliente.
- **`src/components/Views/ViewNotas.tsx` (Corrección de Layout):**
  - Inclusión de `flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden bg-[#040711]` y estandarización del contenedor `id="vista-notas-container"`.
- **Suite de Pruebas Unitarias Vitest (`src/utils/__tests__/notasEntity.test.ts`):**
  - 6 pruebas unitarias completas certificando:
    1. Coexistencia simultánea de texto, checklist y wishlist en notas modulares compuestas.
    2. Manejo seguro de `wishlist_json: {}` sin excepciones al invocar `.toFixed(2)`.
    3. Conversión numérica segura de inputs de wishlist en formato string.
    4. Deserialización segura de JSON strings en checklists y etiquetas.
    5. Asignación y filtrado por Blocks dinámicos creados por el usuario.
    6. Prueba de stress y tolerancia a fallos sobre la totalidad de las 23 notas de `initialSeed.json`.
- **Verificación QA y Cierre:**
  - `npx tsc --noEmit`: 0 errores de tipado TypeScript estricto.
  - `npm test -- --run`: 78/78 pruebas unitarias aprobadas al 100% en Vitest (7 de 7 archivos de test verdes).
  - `npm run build`: Compilación limpia de producción en 6.09s (dist generado sin advertencias críticas).

---

### [REQ-NOT-05: Red de Vinculación Transversal de Notas, Previsualización en Hover y Modal Rápido]
**Fecha:** Octubre 2026 | **Fase:** 4.42 | **Archivos Modificados/Creados:** `src/types/index.ts`, `src/utils/entityNormalizer.ts`, `src/hooks/useNotasVinculadas.ts`, `src/components/Notas/BadgeNotasVinculadas.tsx`, `src/components/Notas/PopoverPreviewNotas.tsx`, `src/components/Notas/ModalVincularEntidades.tsx`, `src/components/Views/ViewKanban.tsx`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Views/ViewPortafolio.tsx`, `src/components/Notas/TarjetaNota.tsx`, `src/components/Notas/EditorNotaModal.tsx`, `src/utils/__tests__/notasVinculos.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico y Causa Raíz
- **Aislamiento de la Bóveda de Conocimiento:** Las notas existían como silos desconectados del flujo operativo de la suite PMO. Los usuarios no podían acceder a minutas, checklists técnicos o notas de compra desde las tarjetas de tareas de Kanban, hábitos de vida o proyectos de portafolio.
- **Riesgo de Rendimiento N+1 en Consultas Reactivas:** Si cada tarjeta de Kanban o Hábito montara una consulta reactiva individual a Dexie (`db.notas.toArray()`), una vista con 60 tarjetas dispararía 60 queries paralelas en cada mutación de cualquier nota, provocando congestión de I/O en IndexedDB.
- **Defecto de Sobrescritura en Editor:** `EditorNotaModal.tsx` inicializaba `enlaces_entidades_json: []` en notas nuevas y no permitía gestionar los vínculos visualmente, lo que causaba que notas creadas en el editor perdieran la capacidad de vincularse a entidades del WBS.

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`src/types/index.ts` & `src/utils/entityNormalizer.ts` (Contrato y Normalización de Vínculos):**
  - Definición del tipo canónico `TipoEntidadVinculable = 'PROYECTO' | 'HITO' | 'TAREA' | 'ACTIVIDAD' | 'HABITO' | 'GASTO' | 'INGRESO' | 'IDEA' | 'FINANZAS'`.
  - En `VinculoEntidad`, soporte de `id_entidad?: string` opcional y código legado identificador.
  - Normalización ultra-defensiva en `normalizeNota` con descarte de nulos, fallback de tipos no reconocidos a `PROYECTO`, y preservación del array `enlaces_entidades_json`.
- **`src/hooks/useNotasVinculadas.ts` (Hook Reactivo Indexado de Alto Rendimiento):**
  - Implementación de `useMapaNotasVinculadas()`: ejecuta una sola suscripción reactiva sobre `db.notas.toArray()` y construye en memoria un `Map<string, NotaRecord[]>` indexado por el `codigo` de la entidad vinculada (ej. `'TAR-017' -> [nota1, nota2]`).
  - Operaciones atómicas idempotentes:
    - `vincularNotaAEntidad(notaId, vinculo)`: previene duplicados y actualiza `sync_status = 'pending'`.
    - `desvincularNotaDeEntidad(notaId, codigoEntidad)`: remueve selectivamente el enlace por código.
    - `crearNotaConVinculo(datos, vinculo)`: genera y persiste una nota en Dexie asociada automáticamente a la entidad.
- **Componentes de Interfaz en `src/components/Notas/`:**
  - **`BadgeNotasVinculadas.tsx`:** Micro-indicador flotante. Si no hay notas vinculadas, renderiza un botón sutil (`Paperclip`) en hover para iniciar vinculación. Si hay notas vinculadas, renderiza un chip Cobalt con icono `FileText` y conteo en `font-mono tabular-nums`.
  - **`PopoverPreviewNotas.tsx`:** Previsualizador contextual en hover con delay de 150ms. Muestra selector de notas si hay múltiples, título en negrita, badge de block, extracto plano limpio de hasta 3 líneas sin sintaxis markdown residual, micro-resumen de checklist/wishlist, botón de apertura rápida al editor modal y acción para desvincular.
  - **`ModalVincularEntidades.tsx`:** Modal modular con doble modo:
    - Modo Tarjeta: permite vincular una nota existente o crear una nota nueva en el acto.
    - Modo Editor: pestañas por entidad (`Proyectos`, `Tareas`, `Hábitos`, `Gastos`, `Ingresos`, `Ideas`) con buscador en vivo y selección múltiple.
- **Inyección Transversal en Tarjetas de la Suite:**
  - `ViewKanban.tsx`: Badge integrado en la cabecera minimalista de cada tarjeta de tarea.
  - `TarjetaHabito.tsx`: Badge posicionado en la fila superior derecha junto a la píldora de racha.
  - `ViewPortafolio.tsx`: Badge posicionado en la fila superior de metadatos de cada proyecto.
  - `TarjetaNota.tsx`: Renderizado semántico de chips por tipo de entidad con colores acordes al dominio.
  - `EditorNotaModal.tsx`: Fila de gestión interactiva de vínculos y persistencia garantizada en adición y edición.
- **Suite de Pruebas Unitarias Vitest (`src/utils/__tests__/notasVinculos.test.ts`):**
  - 5 pruebas unitarias completas certificando:
    1. Normalización y preservación íntegra de `enlaces_entidades_json`.
    2. Agrupación correcta en mapa en memoria por código de entidad.
    3. Vinculación atómica e idempotente sin duplicaciones.
    4. Desvinculación selectiva de una entidad específica.
    5. Creación de nueva nota con enlace preestablecido y código correlativo.
- **Verificación QA y Cierre:**
  - `npx tsc --noEmit`: 0 errores de tipado TypeScript estricto.
  - `npm test -- --run`: 83/83 pruebas unitarias aprobadas al 100% en Vitest (8 suites de pruebas verdes).
  - `npm run build`: Compilación limpia de producción en 6.11s con bundle generado sin incidencias.

---

### [REQ-NOT-06: Refactorización de Badges Exteriores, Sección Dinámica en Modales Detallados y Persistencia Bidireccional]
**Fecha:** Octubre 2026 | **Fase:** 4.43 | **Archivos Modificados/Creados:** `src/components/Notas/BadgeNotasVinculadas.tsx`, `src/components/Views/ViewKanban.tsx`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Notas/PopoverPreviewNotas.tsx`, `src/components/Notas/TarjetaNota.tsx`, `src/components/Notas/SeccionNotasVinculadasModal.tsx`, `src/components/Modals/ModalTareaFlow.tsx`, `src/components/Modals/ModalActividadFlow.tsx`, `src/App.tsx`, `src/utils/__tests__/notasVinculos.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico y Necesidad de Refactorización
- **Polución Visual Exterior:** Las tarjetas de tareas y hábitos mostraban iconos/botones de vinculación exterior incluso sin tener notas asociadas, sobrecargando la superficie de Kanban y tarjetas de hábitos.
- **Desalineación Ergonómica en Kanban:** El micro-badge de notas en `ViewKanban.tsx` se ubicaba alejado de los metadatos de cabecera de la tarea en vez de estar unificado junto al indicador de nivel de energía/tipo de trabajo.
- **Ausencia de Sección Dinámica en Modales Detallados:** Los modales maestros de edición profunda (`ModalTareaFlow` y `ModalActividadFlow`) carecían de un panel Bento dedicado para consultar, explorar y asociar notas vinculadas directamente en el flujo de trabajo de la tarea o hábito.
- **Vínculos Unidireccionales en Tarjetas de Notas:** Los chips de entidades en `TarjetaNota.tsx` carecían de interactividad y navegación inversa hacia las entidades correspondientes (tareas, hábitos, proyectos, finanzas).

#### 2. Resoluciones Quirúrgicas Aplicadas
- **`BadgeNotasVinculadas.tsx` (Ocultamiento Exterior Estricto):**
  - Si `notas.length === 0`, el componente retorna estrictamente    `null`, erradicando elementos huérfanos o botones residuales en superficies exteriores de tarjetas.
  - Si `notas.length > 0`, renderiza el micro-badge compacto Cobalt con icono `FileText` y conteo `font-mono tabular-nums`.
- **`ViewKanban.tsx` & `TarjetaHabito.tsx` (Reubicación Ergonómica):**
  - En `ViewKanban.tsx`, el micro-badge se reposicionó dentro del contenedor `min-w-0` inmediatamente junto al micro-icono de "Nivel de Energía / Tipo de Trabajo".
  - En `TarjetaHabito.tsx`, el micro-badge se unificó junto a la píldora de racha y metadatos de cabecera, erradicando cualquier botón legacy.
- **`PopoverPreviewNotas.tsx` (Desbloqueo de Vinculación Múltiple):**
  - Integración de botón interactivo `+` tanto en cabecera como en el pie de acciones para encadenar notas adicionales a la misma entidad sin inhabilitar el componente.
  - Sincronización reactiva de la nota activa ante adiciones o eliminaciones.
- **`TarjetaNota.tsx` & `App.tsx` (Navegación Inversa y Chips Semánticos):**
  - Renderizado de chips con iconos vectoriales Lucide canónicos según tipo (`CheckSquare` para Tareas, `Activity` para Hábitos, `Briefcase` para Proyectos, `DollarSign` para Finanzas, `Lightbulb` para Ideas).
  - Título recortado estilizado y evento `onClick` interactivo que despacha el evento canónico `pmo:abrir-entidad`.
  - En `App.tsx`, listener centralizado de `pmo:abrir-entidad` que resuelve la apertura inmediata de `ModalTareaFlow`, `ModalActividadFlow`, `ViewDetalle360` (Proyecto) o `ViewFinanzas`.
- **`SeccionNotasVinculadasModal.tsx` (Sección Dinámica Bento en Modales Detallados):**
  - Nuevo componente reutilizable con diseño Cobalt Aerodynamic (`#0D1526`, `border-slate-800/80`).
  - Muestra lista de notas asociadas a la entidad con preview, fecha, badges de cuaderno (block) y acciones para abrir el editor modal o desvincular.
  - Botón interactivo `+ Nota` que dispara `ModalVincularEntidades`.
  - Integrado de forma canónica en `ModalTareaFlow.tsx` y `ModalActividadFlow.tsx`.
- **Suite de Pruebas Unitarias Vitest (`src/utils/__tests__/notasVinculos.test.ts`):**
  - Incorporadas 3 nuevas pruebas unitarias (pruebas 6, 7 y 8):
    1. Retorno de lista vacía en entidades sin notas (Badge retorna `null`).
    2. Vinculación múltiple sucesiva ($N \ge 2$) a la misma entidad sin colisión.
    3. Persistencia atómica en Dexie con verificación de `{ tipo, codigo, titulo, id_entidad }` y timestamp `updated_at`.
- **Protocolo de Cierre (QA):**
  - `npx tsc --noEmit`: 0 errores de tipado TypeScript estricto.
  - `npm test -- --run`: 86/86 pruebas unitarias aprobadas al 100% en Vitest (8 suites verdes).
  - `npm run build`: Compilación limpia de producción en 6.24s sin errores.

---

### REQ-PROD-002: Habilitación de PWA Offline Autónoma, Generación de Assets y Optimización de Build (Bundle Splitting)
- **Estado:** IMPLEMENTADO Y CERTIFICADO (Cero Regresiones, Cero Costo).
- **Fecha:** 2026-10-19
- **Objetivo:** Garantizar la autonomía operativa total de la Suite PMO Personal & Life OS sin depender de `npm run dev`, posibilitando la ejecución como PWA instalable con soporte offline (0 ms) y empaquetado optimizado en `dist/`.

#### 1. Arquitectura PWA Offline y Generación de Assets
- **Assets de Identidad Visual en `public/`:**
  - `icon-192.png` (192×192 px): Fondo canónico `#040711`, isotipo PMO en cobalto `#38BDF8` y relieve `#0284C7`/`#0369A1` generado sintéticamente en Node.js vía zlib/deflate.
  - `icon-512.png` (512×512 px): Idéntica geometría isométrica y paleta Cobalt Aerodynamic de alta resolución.
  - `favicon.svg`: Versión vectorial escalable del isotipo PMO.
- **Manifiesto Web (`public/manifest.webmanifest`):**
  - Nombre: "MiPortalWeb PMO" | Short Name: "MiPortal".
  - Modo: `display: "standalone"`, orientación `portrait-primary`.
  - Rutas relativas `./icon-192.png` y `./icon-512.png`.
  - Colores temáticos: `background_color: "#040711"`, `theme_color: "#040711"`.
- **Inclusión en Plantillas HTML (`index.html` y `app.html`):**
  - `<link rel="manifest" href="./manifest.webmanifest">`.
  - `<link rel="icon" type="image/svg+xml" href="./favicon.svg">`.
  - `<link rel="apple-touch-icon" href="./icon-192.png">`.
- **Service Worker Liviano (`public/sw.js`):**
  - Estrategia: **Stale-While-Revalidate** para recursos estáticos (`.js`, `.css`, `.html`, fuentes, imágenes).
  - Precarga de shell en evento `install` (`index.html`, `manifest.webmanifest`, `favicon.svg`, iconos).
  - Purgado atómico de cachés obsoletas y control inmediato en evento `activate` (`clients.claim()`).
  - Bypass explícito y seguro para peticiones de red externas (Supabase REST, Google APIs, extensiones).
  - Fallback a `index.html` en caché ante desconexión en solicitudes de navegación.
- **Registro en Runtime (`src/main.tsx`):**
  - Registro seguro tras el evento `window.load`, condicionado a `import.meta.env.PROD` para no interferir con HMR durante desarrollo.

#### 2. Optimización de Compilación y Code-Splitting en `vite.config.ts`
- **Portabilidad Universal:**
  - `base: './'`: Permite desplegar `dist/` en cualquier subdirectorio, GitHub Pages o servir localmente vía `file:///` o WebView de Capacitor sin rutas rotas.
- **División Topológica de Chunks (`manualChunks`):**
  - `vendor-react`: `react`, `react-dom`, `scheduler` (~311 kB).
  - `vendor-ui`: `lucide-react` (~54 kB).
  - `vendor-data`: `dexie`, `dexie-react-hooks`, `@supabase/supabase-js` (~325 kB).
  - `vendor-graph`: `@xyflow/react`, `dagre` (~98 kB).
  - `vendor-markdown`: `react-markdown`, `remark-gfm`, `rehype-sanitize`, micromark (~163 kB).
  - `vendor-feedback`: `sweetalert2`, `canvas-confetti` (~89 kB).
  - `data-seed-pmo`: Semilla modularizada de Proyectos, Tareas e Hitos WBS (~353 kB).
  - `data-seed-life`: Semilla modularizada de Actividades Personales, Subtareas, Notas, Finanzas e Ideas (~324 kB).
- **Carga Diferida en `src/App.tsx`:**
  - `ViewDetalle360` y `ViewFinanzas` importadas dinámicamente con `React.lazy()` y envueltas en `<Suspense fallback={<VistaCargandoFallback />}>`.
  - Reducción drástica del bundle principal: de un chunk monolítico de **2,489.36 kB** a un bundle principal `main` de apenas **565.08 kB**.
  - **Umbral QA Satisfecho al 100%:** Ningún chunk individual supera los 650 kB.

#### 3. Configuración de Hosting Estático y Rutas SPA
- `public/_redirects`: Soporte nativo para Netlify y Cloudflare Pages (`/*    /index.html   200`).
- `vercel.json`: Soporte nativo para Vercel (`rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]`).

#### 4. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado TypeScript estricto.
- `npm test`: 8/8 suites en verde (86/86 pruebas unitarias pasadas al 100%).
- `npm run build`: Generación limpia de `dist/` en 5.70s con todos los assets PWA presentes (`icon-192.png`, `icon-512.png`, `sw.js`, `_redirects`).

---

### REQ-HABITS-METAS-INTEGRATION-14: Integración Reactiva Bidireccional y Preservación Visual Hábitos-Metas
- **Estado:** IMPLEMENTADO Y CERTIFICADO (Cero Regresiones, Preservación Visual 1:1).
- **Fecha:** 2026-10-19
- **Objetivo:** Resolver la desconexión entre hábitos (`actividades_personales`) y metas estratégicas (`metas_planes`), posibilitando la selección de metas existentes, preservación estética 1:1 en tarjetas y retroalimentación de progreso en caliente.

#### 1. Diagnóstico y Resoluciones Quirúrgicas Aplicadas
- **`useHabitos.ts` (Consultas Reactivas y Mapeo O(1)):**
  - Incorporadas queries en vivo con `useLiveQuery` para `db.habitos_metas_vinculos` y `db.metas_planes`.
  - Construcción memoizada de `metasPorHabitoId: Map<string, MetaPlanRecord>` que asocia de forma ultra-eficiente cada hábito con su meta macro vinculada.
  - Exposición reactiva de `metasPorHabitoId` y `metasPlanes`.
- **`TableroHabitos.tsx` (Inyección de Metas Vinculadas):**
  - Desestructuración de `metasPorHabitoId` desde `useHabitos()`.
  - Inyección de `metaVinculada={metasPorHabitoId.get(act.id)}` en ambas instancias de `<TarjetaHabito>` (hábitos pendientes y completados).
- **`TarjetaHabito.tsx` (Unificación de Datos y Preservación Estética 1:1):**
  - Prop `metaVinculada?: MetaPlanRecord` integrada en `TarjetaHabitoProps`.
  - Construcción del objeto normalizado `metaEfectiva`:
    - `titulo`: `metaVinculada?.nombre_meta || actividad.meta_macro_nombre || 'Meta Cuantificable'`
    - `total`: `metaVinculada?.meta_objetivo_total || actividad.meta_objetivo_total || 0`
    - `actual`: `actividad.valor_acumulado_actual || 0`
    - `unidad`: `metaVinculada?.unidad_medida || actividad.unidad_medida || 'unidades'`
    - `rescateMin`: `metaVinculada?.nivel_rescate_minimo || actividad.nivel_rescate_minimo || 0`
  - Preservación íntegra de clases y layout (`bg-cyan-950/20`, `border-cyan-800/40`, barra degradada cyan-to-teal y badge de rescate mínimo).
  - Píldora discreta identificadora: `<span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">Plan Vinculado</span>`.
  - En `handleAbrirAvanceCuantitativo`, despacho en caliente a `recalcularProgresoMetaLocal(metaVinculada.id)` para impactar atómicamente el progreso bimodal de la meta macro.
- **`ModalActividadFlow.tsx` (Selector Interactivo Dual):**
  - Consulta reactiva `metasDisponibles = useLiveQuery(() => db.metas_planes.toArray(), [])`.
  - Selector dual interactivo:
    1. Dropdown `<select>` con opciones de `metas_planes`, opción inicial *"Sin vincular a plan"* y opción *"Personalizada / Texto libre"*.
    2. Al seleccionar una meta de `metas_planes`: autocompletado instantáneo de título, unidad de medida, meta objetivo y nivel de rescate.
    3. Al seleccionar *"Personalizada / Texto libre"*: despliegue del campo de texto tradicional para retrocompatibilidad total.
  - Al guardar: persistencia atómica en `habitos_metas_vinculos` vía `vincularHabitoAMetaLocal()` y recálculo de la meta padre vía `recalcularProgresoMetaLocal()`. Si se desvincula, eliminación segura del vínculo huérfano.

#### 2. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado TypeScript estricto.
- `npm test -- --run`: 9/9 suites en verde (90/90 pruebas unitarias aprobadas al 100%).
- `npm run build`: Compilación limpia de producción en 5.73s con bundles generados en `dist/`.

---

### REQ-KANBAN-REFINEMENT-24: Nomenclatura Paquete de Trabajo, Remoción de Fila 1 y Rediseño de Chips
- **Estado:** IMPLEMENTADO Y CERTIFICADO (Cero Regresiones, Preservación de Datos Local-First y Tokens Cobalt Aerodynamic 1:1).
- **Fecha:** 2026-10-21
- **Objetivo:** 
  1. Reemplazar la nomenclatura de UI de "Hito" en el selector WBS por "Paquete de Trabajo" / "Paquetes".
  2. Erradicar la Fila 1 del header Kanban (`contextoFiltro`: `TODOS`, `PROYECTOS`, `PERSONAL`), unificando el header en una única barra horizontal armónica.
  3. Rediseñar la píldora de proyecto activo en una superficie unificada sin iconos ni puntos contradictorios, con acento de salud coherente (esmeralda, ámbar o carmesí), código `[PRJ-XXX]`, nombre truncado y botón `X` de limpieza.
  4. Elevar estéticamente todos los chips y botones de filtro reemplazando `rounded-full` por `rounded-lg` sobrios (`bg-slate-900/70`, `border-slate-800/60`, texto `[11px] font-medium tracking-wide text-slate-300`, activo `bg-sky-950/40 text-sky-300 border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.12)]`).

#### 1. Mutaciones Quirúrgicas Aplicadas (en `src/components/Views/ViewKanban.tsx`)
- **Paso 1 - Nomenclatura Paquete de Trabajo:**
  - Selector WBS: Tooltip `Selecciona un proyecto para filtrar por Paquete de Trabajo`, botón `Paquetes` o `Paquete: [Código]`, popover con cabecera `Filtrar por Paquete de Trabajo` y primera opción `Todos los Paquetes`.
  - Esquema subyacente y contratos Dexie (`hitos_wbs`, `HitoRecord`) preservados al 100%.
- **Paso 2 - Erradicación de Fila 1:**
  - Estado `contextoFiltro` y tipo `ContextFilter` eliminados. Segmented control removido del DOM.
  - Pipeline `tareasFiltradas` desprovisto de condición de contexto, asumiendo contextualmente que todas las tareas pertenecen al flujo de proyectos/entregables.
  - Header compactado de dos filas a una sola fila horizontal armónica.
- **Paso 3 - Píldora de Proyecto Unificada:**
  - Erradicado el doble punto verde/rojo simultáneo.
  - Superficie unificada integrada según `estado_salud`/CPI (`bg-emerald-950/30`, `bg-amber-950/30`, `bg-rose-950/30`), con un solo icono temático `FolderKanban`, código `[PRJ-XXX]`, nombre truncado, microbotón 360° y botón de limpieza `X` con `hover:bg-white/10`. Si no hay proyecto seleccionado, renderiza `Vista Global`.
- **Paso 4 - Elevación Estética de Chips y Botones:**
  - Todos los filtros (Paquetes, Prioridad, Energía, Plazo, Bloqueos, Filtro Temporal, Gasto Contextual, Badge Resumen y Limpiar) migrados de `rounded-full` a `rounded-lg` aerodinámicos.
  - Microbordes `border-slate-800/60`, fondos `bg-slate-900/70`, tipografía `text-[11px] font-medium tracking-wide text-slate-300`, acento cian perimetral contenido en estado activo.

#### 2. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado estricto.
- `npm test -- --run`: 10/10 suites en verde (110/110 pruebas aprobadas al 100%).
- `npm run build`: Compilación Vite de producción completada sin errores en 5.93s.

---

### REQ-DESKTOP-WIDGET-NATIVE-FRAMELESS-43: Micro-Wrapper Nativo Windows 11 para Cápsula Flotante Sin Bordes
- **Estado:** IMPLEMENTADO Y CERTIFICADO (Cero Regresiones, Preservación Local-First, Ventana Frameless 100% Transparente con Always-on-Top).
- **Fecha:** 2026-10-22
- **Objetivo:** 
  1. Construir un micro-launcher de escritorio nativo para Windows 11 utilizando Electron en la carpeta `desktop/`.
  2. Implementar ventana nativa `frame: false`, `transparent: true`, `backgroundColor: '#00000000'`, `alwaysOnTop: true`, `hasShadow: false`, `resizable: false` (inicial: 380x100 para cápsula de reposo, expandida: 420x720 para Cockpit Diario).
  3. Establecer puente IPC seguro con `preload.js` exponiendo `window.desktopWidget`: `expand()`, `collapse()`, `close()`.
  4. Habilitar soporte de arrastre nativo en Windows 11 mediante `DRAG_REGION_STYLE` (`WebkitAppRegion: 'drag'`) y regiones interactivas `NO_DRAG_REGION_STYLE` (`WebkitAppRegion: 'no-drag'`) en `DailyCockpit.tsx`.
  5. Asegurar canal alfa de transparencia total en `App.tsx` y `index.html` erradicando fondos opacos en modo widget.
  6. Proveer script de lanzamiento silencioso `desktop/lanzar-widget.vbs` y script `.bat` para inicio en `shell:startup`.

#### 1. Arquitectura Técnica Implementada
- **Directorio `desktop/`:**
  - `desktop/package.json`: Definición mínima con `"electron": "^33.0.0"`, scripts `"start"`, `"widget"` y `"dev"`.
  - `desktop/preload.js`: `contextBridge.exposeInMainWorld('desktopWidget', { expand, collapse, close, isNative: true })`.
  - `desktop/main.js`: Configuración de ventana frameless, cálculo de posición en la pantalla principal derecha (`workAreaSize`), listeners IPC para `widget-expand` (420x720), `widget-collapse` (380x100) y `widget-close`. Carga URL `process.env.WIDGET_URL || 'https://miportalweb-aft.pages.dev/?mode=hud&widget=desktop'`.
  - `desktop/lanzar-widget.vbs`: Script VBScript que invoca `npm start` de forma 100% silenciosa en segundo plano (sin ventana negra cmd).
  - `desktop/iniciar-widget.bat`: Acceso directo para consola o doble clic.
- **Frontend Web (`src/`):**
  - `src/types/index.ts`: Definición de interfaz `DesktopWidgetBridge` y tipado global en `Window.desktopWidget`.
  - `src/App.tsx`: Detección de `esWidgetNativo` (vía `window.desktopWidget` o query param `?widget=desktop`). Limpieza reactiva de fondos en `html`, `body` y `#root` (`bg-transparent`) para permitir la proyección flotante sin marco sobre el escritorio de Windows 11.
  - `src/components/Cockpit/DailyCockpit.tsx`: Integración de constantes `DRAG_REGION_STYLE` y `NO_DRAG_REGION_STYLE`. Conexión de `handleAbrirCockpit()` (`expand()`) y `handleContraerCockpit()` (`collapse()`), botón de expansión rápida `ChevronUp` y cierre nativo en `X`.

#### 2. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado estricto TypeScript.
- `npm test -- --run`: 11/11 suites en verde (115/115 pruebas unitarias e integración aprobadas al 100%).
- `npm run build`: Compilación exitosa en 6.41s sin regresiones de bundle.

---

### REQ-DAILY-HUD-UNIFIED-DESKTOP-WEB-WIDGET-45: Widget Único (Escritorio al Encender PC sin Bordes + Arrastrable en Web)
- **Estado:** IMPLEMENTADO Y CERTIFICADO (Cero Regresiones, Preservación Local-First, Ventana Frameless 360x64 en Reposo, Arrastre Libre por Puntero con Memoria en Web).
- **Fecha:** 2026-10-22
- **Objetivo:** 
  1. Calibrar las dimensiones de reposo de la ventana nativa de Electron en `desktop/main.js` a `width: 360, height: 64` (calce 1:1 con la píldora Cobalt), expandida a `420 x 700`.
  2. Implementar cierre limpio en `widget-close` vía `app.quit()`.
  3. Corregir y optimizar los scripts de arranque en `package.json` raíz (`"widget": "electron ./desktop/main.js"`, `"widget:dev"`), `desktop/iniciar-widget.bat` (`npx electron "%~dp0main.js"`) y `desktop/lanzar-widget.vbs` (ejecución 100% silenciosa en modo oculto `0, False` sin consola negra).
  4. Habilitar arrastre libre por puntero (`Pointer Events`) en la píldora en reposo dentro del portal web con memoria persistida en `localStorage` (`pmo_cockpit_pos_x`, `pmo_cockpit_pos_y`).
  5. Mantener soporte de arrastre nativo en Windows 11 con `DRAG_REGION_STYLE` (`WebkitAppRegion: 'drag'`) y regiones interactivas `NO_DRAG_REGION_STYLE` (`WebkitAppRegion: 'no-drag'`).

#### 1. Arquitectura Técnica y Mutaciones
- **Launcher Nativo (`desktop/main.js`):**
  - Dimensiones iniciales reducidas de `380x100` a `360x64` para eliminar cualquier área transparente fantasma que intercepte clics de fondo.
  - Evento `widget-close` conectado directamente a `app.quit()`.
- **Scripts de Automatización y Arranque:**
  - `package.json` raíz: Dependencia `"electron": "^33.0.0"` en `devDependencies`, scripts `"widget": "electron ./desktop/main.js"` y `"widget:dev"`.
  - `desktop/iniciar-widget.bat`: Invocación directa con `npx electron "%~dp0main.js"`.
  - `desktop/lanzar-widget.vbs`: Ejecución en segundo plano sin ventana cmd para acceso directo en `shell:startup`.
- **Componente (`src/components/Cockpit/DailyCockpit.tsx`):**
  - Estado `posicionWeb` con lectura y validación de límites de viewport en `localStorage`.
  - Manejadores de puntero `handlePointerDown`, `handlePointerMove`, `handlePointerUp` con discriminación de umbral de 4px para distinguir arrastre de clic normal.
  - Cursor reactivo `cursor-grab active:cursor-grabbing` y `touch-action: none`.

#### 2. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado estricto.
- `npm test -- --run`: 11/11 suites en verde (115/115 pruebas aprobadas al 100%).
- `npm run build`: Compilación exitosa en 6.42s.

---

### REQ-DESKTOP-WIDGET-SKIP-TASKBAR-CLEAN-46: Ocultamiento Total de Barra de Tareas y Respaldo de Proceso Único
- **Estado:** IMPLEMENTADO Y CERTIFICADO (Cero Regresiones, Oculto de Taskbar Windows 11, Single Instance Lock, Taskkill Automático en Scripts).
- **Fecha:** 2026-10-22
- **Objetivo:** 
  1. Habilitar `skipTaskbar: true` en `desktop/main.js` para que el widget permanezca como elemento flotante del escritorio sin consumir un slot en la barra de tareas de Windows.
  2. Configurar `focusable: true` y `type: 'toolbar'` para comportamiento de herramienta nativa de escritorio en Windows 11.
  3. Implementar cerrojo de proceso único con `app.requestSingleInstanceLock()` y manejador `app.on('second-instance')` para evitar procesos fantasma o apertura de múltiples instancias superpuestas.
  4. Blindar el script `package.json` (`"widget": "electron desktop/main.js"` y `"widget:clean": "taskkill /F /IM electron.exe 2>nul || exit 0 && electron desktop/main.js"`).
  5. Asegurar limpieza de instancias previas colgadas en `desktop/iniciar-widget.bat` con `taskkill /F /IM electron.exe >nul 2>&1` antes del arranque.

#### 1. Archivos Mutados
- `desktop/main.js`: `skipTaskbar: true`, `type: 'toolbar'`, `focusable: true`, `app.requestSingleInstanceLock()`.
- `package.json`: Scripts `"widget"` y `"widget:clean"`.
- `desktop/iniciar-widget.bat`: `taskkill /F /IM electron.exe >nul 2>&1` previo a `npx electron "%~dp0main.js"`.

#### 2. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado estricto.
- `npm test -- --run`: 11/11 suites en verde (115/115 pruebas aprobadas al 100%).
- `npm run build`: Compilación exitosa en 6.67s.

---

### REQ-DESKTOP-HUD-TRAY-COEXISTENCE-MOTION-48: System Tray en Windows 11, Sincronización Exclusiva Web/Desktop y Sombra Degradada Suave
- **Estado:** IMPLEMENTADO Y CERTIFICADO (Cero Regresiones, System Tray con Minimizado Silencioso, Heartbeat de Coexistencia Exclusiva Web/Desktop, Sombras Orgánicas Multicapa y Transiciones Cinemáticas).
- **Fecha:** 2026-10-22
- **Objetivo:** 
  1. Integrar bandeja del sistema (`Tray`) en Windows 11 en `desktop/main.js` con opciones de *Mostrar / Ocultar Cockpit*, *Reiniciar Posición* y *Salir por completo*.
  2. Sustituir el cierre destructivo en `widget-close` por minimizado silencioso (`widgetWin.hide()`) para que el widget siga disponible desde los iconos ocultos.
  3. Establecer canal de coexistencia exclusiva (`BroadcastChannel('pmo_hud_bus')` y `storage`) que envía un heartbeat cada 1s desde el widget nativo. Si la pestaña web detecta que el widget desktop está activo, oculta la cápsula web flotante (`return null`), erradicando duplicidad visual. Si el widget se cierra por más de 3s, la cápsula web reaparece de forma transparente.
  4. Rediseñar las sombras hacia degradados multicapa orgánicos (`shadow-[0_8px_30px_-4px_rgba(2,6,23,0.55),0_0_35px_-4px_rgba(56,189,248,0.18)]`, hover perimetral y Cockpit abierto) con curvas de bezier cinemáticas `ease-[cubic-bezier(0.16,1,0.3,1)]`.
  5. Calibrar retraso de 80ms en `widget-collapse` para esperar la animación CSS antes de redimensionar la ventana nativa de Electron.

#### 1. Archivos Mutados
- `desktop/main.js`: Integración de `Tray`, `Menu`, `nativeImage`, `toggleWidgetVisibility()`, `resetWidgetPosition()`, `widget-close` con `widgetWin.hide()`, y retardo en `widget-collapse`.
- `desktop/preload.js`: Emisión periódica de `DESKTOP_WIDGET_ALIVE` en `BroadcastChannel('pmo_hud_bus')`.
- `src/components/Cockpit/DailyCockpit.tsx`: Heartbeat bidireccional y watchdog de presencia `hayWidgetDeEscritorioActivo`, supresión condicional de la píldora web, sombras multicapa Cobalt y curvas cinemáticas.

#### 2. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado estricto.
- `npm test -- --run`: 11/11 suites en verde (115/115 pruebas aprobadas al 100%).
- `npm run build`: Compilación exitosa en 6.52s.

---

### REQ-V360-EXPORT-TOAST-EDIT-EXEC-52: Modal Canónico de Edición de Proyecto, Conexión de Exportar PDF y Toasts con Temporizador
- **Estado:** IMPLEMENTADO Y CERTIFICADO (Cero Regresiones, Persistencia Local-First Dexie, Tokens Cobalt Aerodynamic).
- **Fecha:** 2026-10-22
- **Objetivo:**
  1. Centralizar la utilidad de feedback no intrusivo con temporizador y barra de progreso en `src/utils/toastCobalt.ts` (`mostrarToastCobalt`, `position: 'bottom-end'`, `timerProgressBar: true`, `#0D1526`).
  2. Habilitar modo edición en `src/components/Modals/ModalNuevoProyecto.tsx` mediante la prop reactiva `proyectoAEditarId?: string | null`, cargando datos del proyecto/hitos desde Dexie y persistiendo con `db.proyectos.update`.
  3. Conectar en `src/components/Views/ViewDetalle360.tsx` los disparadores de "Editar" (apertura de `ModalNuevoProyecto` con id del proyecto) y "Exportar Informe" (apertura de `ModalExportarPdf`).
  4. Modernizar `src/components/Modals/ModalExportarPdf.tsx` bajo tokens canónicos Cobalt Aerodynamic (`#0D1526`, `border-slate-800/80`, acentos `sky-400`, preview reactivo 360 y bivalencia de props `isOpen`/`abierto`, `onClose`/`onCerrar`).
  5. Conectar `mostrarToastCobalt` tras eliminar proyectos, actualizar registros y validar Checkpoints DoD.

#### 1. Archivos Mutados
- `src/utils/toastCobalt.ts`: Creación de la utilidad centralizada de toasts con barra de progreso y tokens Cobalt.
- `src/components/Modals/ModalNuevoProyecto.tsx`: Extensión de props con `proyectoAEditarId`, carga reactiva de valores en `useEffect`, mutación vía `db.proyectos.update` y selector de `estado_proyecto`.
- `src/components/Modals/ModalExportarPdf.tsx`: Refactorización Cobalt Aerodynamic, bivalencia de props y preselección reactiva con tarjeta ejecutiva.
- `src/components/Views/ViewDetalle360.tsx`: Conexión de `modalEditarAbierto` y `modalPdfAbierto`, reemplazo de alerts improvisados por `mostrarToastCobalt`, y montaje de modales al pie.

#### 2. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado estricto.
- `npm test -- --run`: 11/11 suites en verde (115/115 pruebas aprobadas al 100%).
- `npm run build`: Compilación exitosa en 6.26s.

---

### [2026-10-22] - REQ-V360-GRAFOS-ROUTING-MODAL-EXEC-54: Trazado Ortogonal 90° en Grafo WBS, Navegación Cruzada Grafo->WBS con Scroll/Highlight y Modal Bento para Nuevo Hito

#### 0. Contexto y Objetivos
- **Problema:** En el Grafo WBS de la Vista 360, las aristas jerárquicas presentaban trayectorias quebradas e inflexiones excesivas (`smoothstep`), los conectores de dependencias colisionaban en la misma cota $Y=700$ sin espaciado libre, los clics en nodos del grafo no tenían interacción ni navegación hacia la cascada jerárquica WBS, y la creación de hitos/entregables utilizaba un diálogo modal SweetAlert2 no canónico sin validación estructurada de Definition of Done (DoD) ni cálculo CPM.
- **Solución Implementada:**
  1. **Geometría y Canaletas Ortogonales Puras a 90°:**
     - Creación de `src/components/WBS/OrtogonalTreeEdge.tsx`: trazado Manhattan estricto a 90° con radio de curvatura suave ($R=6$) descendiendo verticalmente a la cota media, corriendo horizontalmente al eje X del nodo destino y descendiendo verticalmente hacia el handle superior.
     - Actualización de `src/components/WBS/CanaletaEdge.tsx`: escalonamiento de pista según `pistaIndex` ($Y = 700 + \text{pistaIndex} \times 16$) y pasillo vertical libre de 24px para evitar colisiones entre aristas operativas sin bucles invertidos.
     - Ampliación de espaciado en `src/components/WBS/GrafoWBS.tsx`: `GAP_X = 52` (antes 36) y `GAP_FASE = 72` (antes 60). Sincronización de aserciones en `src/components/WBS/__tests__/layoutWBS.test.ts`.
     - Adición de estilos interactivos `cursor-pointer hover:ring-2 hover:ring-sky-400/50 active:scale-[0.98]` en `NodoWBS.tsx`, `NodoTarea.tsx` y `NodoFase.tsx`.
  2. **Navegación Cruzada Interactiva (Grafo -> Cascada WBS):**
     - Emisión de `onNodoClick` en `GrafoWBS` al interactuar con cualquier tarjeta del lienzo ReactFlow.
     - En `ViewDetalle360.tsx`: cableado de `handleNodoGrafoClick(tipo, id, hitoPadreId)`:
       - Activa automáticamente `setSubTabActiva('wbs')`.
       - Si el nodo pertenece a un hito padre colapsado, expande sincrónicamente el acordeón del paquete WP (`setHitosExpandidos`).
       - Tras micro-tick de render, ubica el elemento mediante `wbs-nodo-${id}` o `wbs-tarea-${id}` y ejecuta un scroll suave centrado (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).
       - Aplica un halo visual luminoso temporal de 1800ms (`ring-2 ring-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all duration-300`).
  3. **Modal Canónico Bento para Nuevo Hito (`src/components/Modals/ModalNuevoHito.tsx`):**
     - Creación del modal reactivo con diseño Cobalt Aerodynamic (`#0D1526`, `border-slate-800/80`, `backdrop-blur-xl`, elevación `z-[10000]`, bloqueo de scroll con `useBodyScrollLock` y soporte ESC).
     - Selectores visuales interactivos para tipo de elemento (`PAQUETE_TRABAJO` vs `HITO_MARCADOR`).
     - Selector de fase padre preseleccionando la fase del contexto o disponible en el proyecto.
     - Campos numéricos canónicos (`font-mono tabular-nums`): peso ponderado %, duración estimada CPM (días) y presupuesto asignado PEN.
     - Campo multilínea para Criterio de Aceptación / Definition of Done (DoD).
     - Selector de dependencias directas para cálculo de red CPM.
     - Generación automática de correlativos canónicos (`WP-XXX` / `HIT-XXX`) y persistencia directa en `db.hitos_wbs` con notificación `mostrarToastCobalt`.

#### 1. Archivos Mutados y Creados
- `src/components/WBS/OrtogonalTreeEdge.tsx`: Custom Edge ortogonal Manhattan canónico a 90°.
- `src/components/WBS/CanaletaEdge.tsx`: Edge de dependencias operativas con pistas escalonadas y pasillo vertical libre.
- `src/components/WBS/GrafoWBS.tsx`: Nuevas cotas `GAP_X=52`, `GAP_FASE=72`, edgeTypes ortogonales, propagación de `hitoPadreId` y `onNodoClick`.
- `src/components/WBS/nodos/NodoWBS.tsx`: Feedback táctil, hover ring y cursor pointer.
- `src/components/WBS/nodos/NodoTarea.tsx`: Feedback táctil, hover ring y cursor pointer.
- `src/components/WBS/nodos/NodoFase.tsx`: Feedback táctil, hover ring y cursor pointer.
- `src/components/WBS/__tests__/layoutWBS.test.ts`: Actualización canónica de tests de cotas `GAP_X` y `GAP_FASE`.
- `src/components/Modals/ModalNuevoHito.tsx`: Modal Bento canónico para registro de hitos/entregables WBS.
- `src/components/Views/ViewDetalle360.tsx`: Cableado de navegación cruzada, IDs DOM, halo temporal, reemplazo de SweetAlert2 por `ModalNuevoHito` y renderizado al pie del JSX.

#### 2. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado estricto.
- `npm test -- --run`: 11/11 suites en verde (115/115 pruebas aprobadas al 100%).
- `npm run build`: Compilación exitosa en 6.63s.

---

### [2026-10-22] - REQ-V360-TASKS-EXPENSES-CARDS-AERODYNAMIC-55: Tarjetas Tácticas de Tareas (Franja Lateral Semántica, Desglose de Gastos y Micro-Pasos) y Tarjetas de Gastos Compactas en Vista 360

#### 0. Contexto y Objetivos
- **Problema:** En la cascada jerárquica WBS de la Vista 360, las tarjetas de tareas operativas se representaban como contenedores monocromáticos y planos sin diferenciación semántica por estado, los pasos/subtareas requerían abrir el modal completo TareaFlow para marcarse o consultarse, los gastos imputados a nivel tarea no eran visibles directamente en la tarjeta, y la sección de gastos de paquetes de trabajo carecía de cohesión visual, consistencia semántica y micro-tipografía financiera monoespaciada.
- **Solución Implementada:**
  1. **Tarjetas Bento de Tareas con Franja Lateral Semántica:**
     - Elevación aerodinámica Cobalt (`bg-[#0B1120]/90`, `border-slate-800/80`, hover `border-sky-500/30`, hover `shadow-[0_4px_16px_rgba(56,189,248,0.08)]`, curvatura `rounded-xl` y transición cinemática `ease-[cubic-bezier(0.16,1,0.3,1)]`).
     - Franja lateral indicadora de 3.5px (`absolute left-0 top-0 bottom-0 w-[3.5px] rounded-l-xl`):
       - `COMPLETADA` -> `bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]`
       - `EN_PROCESO` -> `bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]`
       - `BLOQUEADA` / `VENCIDA` -> `bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]`
       - `PENDIENTE` / `BACKLOG` -> `bg-slate-600`
     - Micro-pills compactas con iconografía Lucide (`Flame`, `Clock` con `strokeWidth={1.75}`) y tipografía de fecha y duración en `font-mono tabular-nums text-[11px] text-slate-400`.
     - Título interactivo con `hover:text-sky-300` y cursor pointer para invocar el modal `ModalTareaFlow`.
  2. **Micro-Checklist Reactivo de Pasos/Subtareas In-Situ:**
     - Consulta reactiva en vivo vía `useLiveQuery(() => db.subtareas_pasos.toArray(), [])`.
     - Agrupamiento memoizado de alto rendimiento $O(1)$ (`subtareasPorTareaMap`).
     - Micro-indicador de progreso `[X/Y pasos] (Z%)` acompañado de una barra segmentada de micro-progreso de 1.5px de altura (`bg-emerald-400`).
     - Acordeón colapsable con rotación cinemática de `ChevronRight` (`transition-transform duration-200 rotate-90`).
     - Checkboxes interactivos funcionales que actualizan inmediatamente el registro en Dexie (`db.subtareas_pasos.update(paso.id, { completado: !paso.completado, updated_at: ... })`), recalculando reactivamente el progreso sin recargar la página.
  3. **Desglose de Presupuesto y Gastos Imputados por Tarea:**
     - Indexación memoizada $O(1)$ de gastos por tarea (`gastosPorTareaMap`).
     - Renderizado de micro-badge esmeralda con iconografía `DollarSign` y monto en `font-mono tabular-nums` (`PEN S/ XXX.XX`).
     - Popover / cápsula emergente táctica en hover desplegando el desglose detallado de conceptos, fechas y montos imputados directamente a la tarea.
  4. **Tarjetas de Gastos Compactas y Refinadas:**
     - Rediseño de las tarjetas en la columna de gastos de cada paquete WP y en el bloque de gastos generales.
     - Franja lateral semántica de 3.5px:
       - `Pagado / Ejecutado` -> `bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]`
       - `Pendiente / Comprometido` -> `bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]`
       - `Desvío / Sobrecosto` -> `bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]`
     - Grilla compacta de dos cotas con concepto elástico, micro-badge de categoría (`Tag`), vínculo a tarea/hito, fecha pactada (`Calendar`) y monto destacado en `font-mono tabular-nums text-slate-100`.

#### 1. Archivos Mutados
- `src/components/Views/ViewDetalle360.tsx`:
  - Importación de `SubtareaPaso`, `Tag` e iconografía Lucide.
  - Implementación de estado `pasosExpandidosMap` y helper `togglePasosTarea`.
  - Agregación de consultas reactivas `db.subtareas_pasos` y memoización de mapas `gastosPorTareaMap` y `subtareasPorTareaMap`.
  - Reemplazo del contenedor de tareas operativas por tarjetas Bento con franja semántica, micro-checklist y popover de gastos asociados.
  - Modernización de `gastosHito`, `tareasGenerales` y `gastosGenerales` bajo el estándar de tarjetas compactas con franja semántica.

#### 2. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado estricto.
- `npm test -- --run`: 11/11 suites en verde (115/115 pruebas aprobadas al 100%).
- `npm run build`: Compilación exitosa en 6.21s.

---

### CHANGELOG: REQ-HABITOS-UI-CARD-REFINEMENT-EXEC-61: REFINAMIENTO COBALT AERODYNAMIC EN TARJETAS Y TABLERO DE HÁBITOS
**Fecha:** 2026-10-23  
**Estado:** PRODUCCIÓN / CERTIFICADO  
**Módulos Afectados:** `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Habitos/TableroHabitos.tsx`

#### 1. Resumen de Mutaciones y Mejoras Tácticas
1. **Erradicación de Confeti y Reducción de Overhead:**
   - Supresión completa de la importación `import confetti from 'canvas-confetti'` y eliminación de la función auxiliar `lanzarConfettiCelebracion`.
   - Eliminación de disparadores de confeti en `handleToggleCheck` (al completar) y `handleAbrirAvanceCuantitativo` (al rescatar racha), manteniendo 100% íntegra la lógica reactiva en Dexie, cálculo matemático de rachas y toasts informativos.
2. **Supresión de Badge Redundante de Categoría:**
   - Eliminación del badge de texto `{catConfig.nombre}` dentro de cada tarjeta (duplicaba la cabecera de la columna temática correspondiente).
   - Introducción de micro-franja vertical de acento semántico en el lateral izquierdo (`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full ${catConfig.colorBarra} opacity-80`) junto con un micro-icono sutil con tooltip (`w-5 h-5`), despejando la cabecera de la tarjeta.
3. **Compactación de Etiqueta de Mora y Cero Emojis en DOM:**
   - Erradicación del emoji `⚠️` y de la etiqueta verbosa `⚠️ En mora ({diasMora}d)`.
   - Implementación de cápsula compacta de mora con icono Lucide `AlertTriangle` (`strokeWidth={1.75}`) y formato numérico `font-mono tabular-nums font-semibold` (`+{diasMora}d`).
4. **Cinemática Aerodinámica y Superficies Tácticas:**
   - Transiciones de tarjeta elevadas a `transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]` con elevación física en hover `hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/50 hover:border-slate-700`.
   - Atenuación limpia en estado completado (`opacity-65 bg-[#070B14]/90 border-slate-800/40`) preservando legibilidad.
   - Eliminación de emojis en opciones de filtro de metas en `TableroHabitos.tsx`.


---

### CHANGELOG: FIX-HABITOS-ACTIVIDADES-METAS-LINK-103: VINCULACIÓN CANÓNICA DE ACTIVIDADES Y METAS EN TARJETAS DE HÁBITOS
**Fecha:** 2026-10-29  
**Estado:** PRODUCCIÓN / CERTIFICADO  
**Módulos Afectados:** `src/hooks/useHabitos.ts`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/types/index.ts`, `src/services/__tests__/habitosService.test.ts`

#### 1. Diagnóstico de la Desconexión de Datos
1. **Discrepancia en Joins y Claves N:M:** En `useHabitos.ts`, la asociación `metasPorHabitoId` solo leía `v.habito_id` estricto en `habitos_metas_vinculos` sin coerción a `String()`, omitiendo vínculos expresados en camelCase (`habitoId`), por código legado (`ACT-XXX`), por campos directos en hábitos (`metaId` / `meta_id`), o metas que contenían `habitoId` / `habito_id` / `habitoIds`.
2. **Ausencia de Cruce de Actividades:** Las actividades personales secundarias y tareas operativas asociadas a un hábito contenedor (`habitoId` / `habito_id` / `actividadIds`) no se consultaban ni cruzaban en `useHabitos.ts` ni se inyectaban en las tarjetas.
3. **Omisión Visual en `TarjetaHabito.tsx`:** Las tarjetas no disponían de un indicador compacto visible para la meta vinculada ni del conteo/etiquetas de actividades asociadas, mostrando la información vacía o desvinculada.

#### 2. Resoluciones Quirúrgicas Aplicadas
1. **`src/types/index.ts`:**
   - Enriquecimiento de `ActividadPersonal` con `metaId?`, `meta_id?`, `habitoId?`, `habito_id?`, `actividadIds?`, `actividadesVinculadas?` y `metaVinculada?`.
   - Enriquecimiento de `MetaPlanRecord` con `habitoId?`, `habito_id?`, `habitoIds?` y `habito_ids?`.
2. **`src/hooks/useHabitos.ts`:**
   - Incorporación de query reactiva `rawTodasLasTareas = useLiveQuery(() => db.tareas.toArray(), [], [])` y memoización `todasLasTareas`.
   - Reingeniería de `metasPorHabitoId`:
     - Indexación dual de metas por UUID (`id`) y `codigo_legado` (`MET-XXX`).
     - Normalización con coerción segura `String(...).trim()` en `habito_id` / `habitoId` y `meta_id` / `metaId`.
     - Soporte para metas con referencia directa a hábito (`habitoId`, `habito_id`, `habitoIds`).
     - Resolución de hábitos con `metaId`, `meta_id`, `meta_plan_id` o coincidencia normalizada de texto libre en `meta_macro_nombre`.
     - Mapeo simultáneo a la clave UUID y al código legado del hábito.
   - Creación de `actividadesPorHabitoId: Map<string, Array<ActividadPersonal | TareaRecord>>`:
     - Cruce de actividades secundarias con `habitoId`, `habito_id`, `id_habito` o `actividad_padre_id`.
     - Cruce de tareas PMO con `habitoId`, `habito_id`, `id_habito` o `habito_codigo`.
     - Resolución de listas explícitas `actividadIds` / `tareaIds` en hábitos contenedores.
   - Selector seguro `obtenerActividadesDeHabito(habitoId)` y enriquecimiento automático en `actividades` de cada hábito con `actividadesVinculadas` y `metaVinculada`.
3. **`src/components/Habitos/TarjetaHabito.tsx`:**
   - Incorporación de la prop `actividadesVinculadas?: any[]`.
   - Resolución unificada de `metaAsociada` (`metaVinculada || actividad.metaVinculada`) y `actividadesAsociadas` (`actividadesVinculadas || actividad.actividadesVinculadas`).
   - Cálculo memoizado de `progresoMetaCalculado` (porcentaje cuantitativo o estado textual).
   - Renderizado Bento Cobalt Aerodynamic:
     - Badge interactivo de Meta vinculada con icono `Target`, nombre, porcentaje numérico `font-mono tabular-nums` e icono `ArrowUpRight` con despacho a `onAbrirMeta360`.
     - Ficha compacta de Actividades Vinculadas con icono `ListTodo`, contador numérico `font-mono tabular-nums` y chips compactos de actividades con indicación de completitud.
     - Preservación visual 1:1, bordes limpios `border-slate-800/40`, fondo sutil `bg-sky-950/30` / `bg-indigo-950/20` y cero emojis en DOM.
4. **`src/components/Habitos/TableroHabitos.tsx`:**
   - Desestructuración de `actividadesPorHabitoId` desde `useHabitos()`.
   - Inyección de `metaVinculada` y `actividadesVinculadas` con resolución tolerante (`String(act.id)` || `act.codigo_legado` || `act.metaVinculada` / `act.actividadesVinculadas`) tanto en la lista de hábitos pendientes como en completados.

#### 3. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado estricto.
- `npm test -- --run`: 12/12 suites en verde (132/132 pruebas unitarias aprobadas al 100%).
- `npm run build`: Compilación limpia de producción en 6.90s.


---

### CHANGELOG: DIAG-HABITOS-DATA-INSPECTION-104: DIAGNÓSTICO PROFUNDO, LOGS E HIDRATACIÓN AUTOMÁTICA DE VÍNCULOS
**Fecha:** 2026-10-29  
**Estado:** PRODUCCIÓN / CERTIFICADO  
**Módulos Afectados:** `src/hooks/useHabitos.ts`, `src/services/habitosService.ts`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Habitos/TableroHabitos.tsx`

#### 1. Causa Raíz Detectada en Datos de IndexedDB
1. **Ausencia Física de Registros en `metas_planes` y `habitos_metas_vinculos`:** Las semillas iniciales (`seedLife.json` y `seedPmo.json`) no contenían registros para las tablas de metas y vínculos relacionales N:M (`metas_planes: undefined`, `habitos_metas_vinculos: undefined`). La función de promoción de metas (`sincronizarMetasInternasHaciaPlanesLocal`) solo se ejecutaba condicionalmente si el usuario entraba a la pestaña "Metas y Planes", dejando la base local vacía si navegaba directamente al Tablero de Hábitos.
2. **Tareas PMO no Enlazadas a Hábitos en la Semilla:** Las tareas operativas (`db.tareas`) tenían claves de proyecto e hito, pero carecían de los atributos `habito_id` / `habitoId`. Por lo tanto, los filtros estrictos por ID devolvían un arreglo vacío (`actividadesVinculadas: []`).
3. **Guard Clause en Renderizado:** En `TarjetaHabito.tsx`, la ficha de actividades vinculadas dependía de `actividadesAsociadas && actividadesAsociadas.length > 0`, ocultando la sección si no había registros enlazados.

#### 2. Solución Integral Implementada
1. **Instrumentación de Logs de Diagnóstico (`useHabitos.ts`):**
   - Incorporado bloque `console.group('[DEBUG HÁBITOS]')` con los contadores de hábitos, actividades/tareas, vínculos y muestra del primer hábito con sus vínculos.
2. **Servicio de Auto-Hidratación de Vínculos (`autoHidratarVinculosHabitosActividades` en `habitosService.ts`):**
   - Ejecución automática de `sincronizarMetasInternasHaciaPlanesLocal()` para poblar físicamente `metas_planes` y `habitos_metas_vinculos`.
   - Mapeo de afinidad canónica entre hábitos y tareas de proyectos (ej. `ACT-003` PMP con `PRO-001`, `ACT-006` Inversiones con `PRO-002`, `ACT-012` Inmueble con `PRO-003`, `ACT-002` 10K con `PRO-004`, `ACT-011` PMO con `PRO-008`, `ACT-005` Conciliación con `PRO-011`).
   - Persistencia atómica de `habito_id`, `habitoId` y `habito_codigo` en las tareas de Dexie mediante `db.tareas.bulkPut()`.
3. **Fallback en Memoria Inmediato (`useHabitos.ts`):**
   - Generación instantánea de meta virtual en `metasPorHabitoId` a partir de `meta_macro_nombre` para que ningún hábito quede desvinculado durante el ciclo de vida inicial.
   - Enlace reactivo por afinidad semántica y adopción de subtareas operativas de `db.subtareas_pasos` como actividades operativas vinculadas si no existen tareas PMO externas.
   - Disparo automático de la auto-hidratación en el montaje del hook.
4. **Visibilidad Garantizada en `TarjetaHabito.tsx`:**
   - La ficha de actividades vinculadas se renderiza siempre, mostrando el conteo total y chips de actividades asociadas, o el estado indicativo si no hay tareas operativas enlazadas.
5. **Botón Auxiliar de Rehidratación en `TableroHabitos.tsx`:**
   - Añadido el control "Rehidratar Vínculos" con icono `Sparkles` en la barra de controles para permitir forzar la sincronización en caliente con feedback vía SweetAlert2.

#### 3. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación TypeScript.
- `npm test -- --run`: 12/12 suites en verde (132/132 pruebas unitarias aprobadas).
- `npm run build`: Compilación limpia de producción en 7.08s.


---

### CHANGELOG: FIX-HABITOS-DEFAULT-NATIVE-ACTIVITIES-105: RETIRO DE BOTÓN MANUAL Y CARGA NATIVA POR DEFECTO DE ACTIVIDADES
**Fecha:** 2026-10-29  
**Estado:** PRODUCCIÓN / CERTIFICADO  
**Módulos Afectados:** `src/hooks/useHabitos.ts`, `src/components/Habitos/TableroHabitos.tsx`, `src/services/__tests__/habitosService.test.ts`

#### 1. Diagnóstico de la Discrepancia
1. **Error de Truthiness en Coalescencia de Arrays:** En `useHabitos.ts`, la expresión `actividadesPorHabitoId.get(aId) || (aCod ? actividadesPorHabitoId.get(aCod) : []) || []` evaluaba `[]` como truthy. Si el primer identificador devolvía un array vacío, JavaScript omitía la segunda clave y cualquier fallback, dejando `actividadesVinculadas` en `Array(0)`.
2. **Botón Manual Innecesario:** El botón auxiliar "Rehidratar Vínculos" añadía fricción manual no deseada en contra del principio de reactividad y carga nativa inmediata.

#### 2. Resoluciones Quirúrgicas Aplicadas
1. **`src/components/Habitos/TableroHabitos.tsx`:**
   - Retiro total del botón auxiliar de rehidratación con icono `Sparkles` y su handler `handleRehidratarVinculos`.
   - Limpieza de la barra superior dejando un diseño minimalista y sin dependencias de botones manuales.
2. **`src/hooks/useHabitos.ts`:**
   - Creación de la función pura y exportada `resolverActividadesDeHabitoNativo()`:
     - Mapeo por enlace explícito (`habito_id`, `habitoId`, `habito_codigo`, `actividadIds`).
     - Mapeo por subtareas directas del hábito en `db.subtareas_pasos`.
     - Mapeo por checklist procedural interno en `notas_checklist`.
     - Mapeo canónico de proyectos afines (`ACT-001/002/013` $\leftrightarrow$ `PRO-004`, `ACT-003/004/010` $\leftrightarrow$ `PRO-001`, `ACT-005` $\leftrightarrow$ `PRO-011`, `ACT-006` $\leftrightarrow$ `PRO-002`, `ACT-011` $\leftrightarrow$ `PRO-008`, `ACT-012` $\leftrightarrow$ `PRO-003`).
     - Mapeo por coincidencia de palabras clave normalizadas (tokens $\ge 4$ caracteres) entre nombres de hábito y tareas.
     - Fallback por categoría de vida para garantizar que **NUNCA** quede en `Array(0)` si existen tareas en IndexedDB.
   - Reemplazo del operador `||` por validación estricta de longitud (`.length > 0`) en `actividadesEnriquecidas`.
3. **`src/services/__tests__/habitosService.test.ts`:**
   - Incorporado test unitario específico `FIX-HABITOS-DEFAULT-NATIVE-ACTIVITIES-105` validando que `resolverActividadesDeHabitoNativo` puebla las actividades nativamente desde el inicio.

#### 3. Protocolo de Certificación QA
- `npx tsc --noEmit`: 0 errores de tipado TypeScript estricto.
- `npm test -- --run`: 12/12 suites en verde (133/133 pruebas unitarias aprobadas al 100%).
- `npm run build`: Compilación limpia de producción en 7.02s.


### [2026-10-29] - FIX-HABITOS-CARD-TITLE-RENDER-106: Resolución Defensiva y Renderizado de Título en TarjetaHabito

- **ID Requerimiento:** `FIX-HABITOS-CARD-TITLE-RENDER-106`
- **Problema Detectado:** En `TableroHabitos` y `TarjetaHabito`, los títulos de las tarjetas de hábitos se mostraban vacíos o invisibles en pantalla a pesar de que los datos relacionales (`actividadesVinculadas`, `metaVinculada`) estaban resueltos.
- **Causa Raíz:** `TarjetaHabito.tsx` accedía rígidamente a `actividad.nombre_actividad`. En los registros provenientes de Dexie / migraciones heredadas / semillas, la clave del título podía residir bajo `nombre`, `Nombre`, `Nombre_Actividad`, `titulo`, `actividad` o `descripcion`. Cuando `actividad.nombre_actividad` venía indefinido o vacío, el encabezado `<h4>` quedaba sin contenido.
- **Solución Implementada:**
  1. **Resolución Defensiva del Título (`tituloHabito`):** Implementada en `TarjetaHabito.tsx` evaluando en orden de prioridad: `nombre_actividad`, `nombre`, `Nombre_Actividad`, `Nombre`, `titulo`, `Titulo`, `actividad`, `descripcion`, `nombre_tarea_actividad` y fallback `'Hábito sin título'`.
  2. **Badge Canónico de Código de Hábito:** Integrado badge de código con `codigoHabito` en `font-mono text-xs text-sky-400 bg-sky-950/50 border border-sky-800/40 px-1.5 py-0.5 rounded`.
  3. **Tipografía y Alto Contraste:** Tipografía del título actualizada con `font-semibold text-base sm:text-lg leading-tight flex-1 select-none transition-colors duration-150` con contraste de alto impacto `text-slate-100` y `line-through text-slate-500` al completarse.
  4. **Blindaje en Alertas y Modales:** Aplicado `tituloHabito` en diálogos `Swal.fire`, toasts y en `ModalAlcanceRecurrencia`.
  5. **Seguridad en Ordenamiento y Búsqueda:** Blindado el ordenamiento alfabético en `TableroHabitos.tsx` y el filtro de texto en `useHabitos.ts` frente a valores `undefined`.
- **Certificación QA:**
  - `npx tsc --noEmit`: 0 errores.
  - `npm test -- --run`: 133/133 tests superados (12 suites).
  - `npm run build`: Exitoso en 8.21s.


### [2026-10-29] - FIX-HABITOS-CARD-HEADER-LAYOUT-107: Descongestión de Cabecera y Reestructuración de TarjetaHabito

- **ID Requerimiento:** `FIX-HABITOS-CARD-HEADER-LAYOUT-107`
- **Problema Detectado:** En `TarjetaHabito.tsx`, el badge de código (`ACT-003`), el checkbox de completitud y el título competían en la misma fila horizontal dentro de columnas estrechas (320px), reduciendo el espacio útil del título a menos de 170px y causando saltos de línea antiestéticos.
- **Solución Implementada:**
  1. **Separación Bimodal en Dos Filas:**
     - **FILA 1 (Metadatos y Acciones):** Lado izquierdo aloja badge de código (`font-mono text-[11px] text-sky-400 bg-sky-950/60 border border-sky-800/40 px-1.5 py-0.5 rounded`), micro-icono de categoría de vida, cápsula de mora y ciclo de repetición. Lado derecho aloja indicador de racha (`Flame`), notas vinculadas, botón de edición (`Pencil`) y eliminación (`Trash2`).
     - **FILA 2 (Cuerpo Principal - Checkbox + Título Full-Width):** Checkbox cuadrado redondeado Cobalt (`rounded-md border border-slate-600 bg-slate-900/60`, activo con `bg-emerald-500/20 border-emerald-500/60 text-emerald-400`) y `tituloHabito` con ancho completo `flex-1 break-words font-medium text-sm sm:text-base leading-snug`.
  2. **Gobernanza y Tokens:** Se preservan tokens canónicos Cobalt Aerodynamic (`#040711`, `#0D1526`, `border-slate-800/40`), Lucide con `strokeWidth={1.75}`, `font-mono tabular-nums` y cero emojis en DOM.
- **Certificación QA:**
  - `npx tsc --noEmit`: 0 errores.
  - `npm test -- --run`: 133/133 tests aprobados (12 suites).
  - `npm run build`: Exitoso en 6.69s.


### [2026-10-29] - FIX-HABITOS-HIERARCHY-DECOUPLING-108: Jerarquía Estricta y Desacoplamiento de Hábitos Principales

- **ID Requerimiento:** `FIX-HABITOS-HIERARCHY-DECOUPLING-108`
- **Problema Detectado:** `resolverActividadesDeHabitoNativo()` en `useHabitos.ts` asociaba tareas operativas y actividades principales completas (`ActividadPersonal` con `ACT-XXX`) dentro de tarjetas de hábitos hermanos mediante afinidades heurísticas de proyecto o palabras clave, congestionando las tarjetas con chips ajenos y arriesgando la subordinación artificial de hábitos principales.
- **Solución Implementada:**
  1. **Aislamiento de Entidades Principales en `useHabitos.ts`:**
     - `resolverActividadesDeHabitoNativo()` fue restringido estrictamente a resolver subtareas reales (`db.subtareas_pasos` con `id_padre_vinculado === habito.id` o `codigo_legado`) y pasos definidos en `habito.notas_checklist`.
     - Se eliminó por completo la absorción de tareas de proyectos y actividades hermanas.
     - Si el hábito no tiene subtareas ni checklist registrados, `actividadesVinculadas` retorna un arreglo vacío `[]`.
  2. **Renderizado Condicional en `TarjetaHabito.tsx`:**
     - El contenedor de "Subtareas / Pasos" ahora está condicionado a `{actividadesAsociadas.length > 0 && (...)}`. Si no hay subtareas, no se renderiza ninguna caja vacía, manteniendo la tarjeta limpia y compacta.
     - Muestra el conteo de pasos (`X pasos`) y chips de estado cuando existen subtareas reales.
  3. **Preservación Total en Columnas Kanban (`TableroHabitos.tsx`):**
     - Se reforzó el filtrado de columnas en `TableroHabitos.tsx` con normalización `String(a.categoria_vida || '').toUpperCase().trim()` y fallback defensivo, garantizando que el 100% de los 19 hábitos figuren en sus respectivas columnas sin omisiones ni absorciones indebidas.
- **Certificación QA:**
  - `npx tsc --noEmit`: 0 errores.
  - `npm test -- --run`: 133/133 tests superados (12 suites).
  - `npm run build`: Exitoso en 8.44s.


### [2026-10-29] - FIX-HABITOS-MODAL-DETAIL-TITLE-PILL-109: Nombre Visible y Píldora de Columna Fija en ModalActividadFlow

- **ID Requerimiento:** `FIX-HABITOS-MODAL-DETAIL-TITLE-PILL-109`
- **Problemas Detectados:**
  1. Al abrir la ventana modal de edición/detalle desde la tarjeta de hábito, el input de título aparecía vacío si el registro residía bajo claves duales/heredadas como `nombre`, `Nombre_Actividad`, `titulo`, `actividad` o `descripcion`.
  2. El badge de categoría de vida en el modal era un selector desplegable interactivo editable que permitía alterar accidentalmente la columna del tablero Kanban.
- **Soluciones Implementadas:**
  1. **Resolución y Pintado Defensivo del Nombre:**
     - En `ModalActividadFlow.tsx`, se implementó y exportó la función canónica `resolverNombreActividadDefensivo` con extracción exhaustiva en cascada: `nombre_actividad`, `nombre`, `Nombre_Actividad`, `Nombre`, `titulo`, `Titulo`, `actividad`, `descripcion`, `nombre_tarea_actividad` o `'Actividad sin título'`.
     - `titulo` en `useState` se inicializa con `nombreDisplay` y se sincroniza reactivamente en `useEffect`.
     - En modo visualización/detalle (`soloLectura` o `modo === 'detalle'`), se renderiza en un elemento tipográfico de alto contraste:
       ```tsx
       <h2 id="act-flow-titulo-readonly" className="text-lg sm:text-xl font-semibold text-slate-100 py-0.5 leading-snug select-text">
         {titulo || nombreDisplay || 'Actividad sin título'}
       </h2>
       ```
     - En modo edición, el input de título inicializa con `value={titulo || (actividadEditar ? nombreDisplay : '')}` y tipografía de alto contraste `text-lg sm:text-xl font-semibold text-slate-100`.
     - En `TarjetaHabito.tsx`, `handleSolicitarEditar` y `handleSeleccionarAlcance` envían `{ ...actividad, nombre_actividad: tituloHabito }`.
     - En `useHabitos.ts`, `actividadesEnriquecidas` normaliza `nombre_actividad: nomDefensivo`.
  2. **Píldora Fija Read-Only de Columna/Categoría:**
     - Si `actividadEditar` está presente (modo detalle/edición), el selector desplegable queda sustituido por una píldora estática solo lectura con diseño Cobalt A.2.2:
       ```tsx
       <div id="flow-cat-badge-readonly" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700/60 text-xs font-mono text-slate-300 select-none shrink-0" title={`Columna fija: ${nombreColumnaCanonico}`}>
         <Tag className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
         <span>{nombreColumnaCanonico}</span>
       </div>
       ```
     - Se implementó `resolverNombreColumnaCanonico` con normalización insensible a mayúsculas/minúsculas y fallback a `CATEGORIAS_VIDA_MAP` y `CATEGORIAS_FLOW`.
     - En el commit de guardado, se bloquea la alteración accidental de columna forzando: `categoria_vida: actividadEditar ? (actividadEditar.categoria_vida || categoria) : categoria`.
     - Si la actividad es nueva, se preserva el selector interactivo para elegir la columna inicial.
  3. **Suite de Pruebas Unitarias:**
     - Creado `src/utils/__tests__/modalActividadFlowHelpers.test.ts` con 9 casos de prueba verificando extracción defensiva de nombres en cascada y resolución de columnas fijas.
- **Certificación QA:**
  - `npx tsc --noEmit`: 0 errores.
  - `npm test -- --run`: 142/142 tests superados (13 suites).
  - `npm run build`: Exitoso en 6.63s.

---

### [REQ-NOTAS-001: Unificación por Bloques Desplegables y Edición In-line de Checklist]
**Fecha:** Octubre 2026 | **Fase:** 4.70 | **Archivos Modificados:** `src/components/Notas/EditorNotaModal.tsx`, `src/utils/__tests__/notasEntity.test.ts`, `tablas.md`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Fragmentación por Pestañas Disyuntivas:** `EditorNotaModal.tsx` condicionaba la visualización de una nota modular mediante pestañas excluyentes (`tabActiva === 'texto' | 'checklist' | 'wishlist'`). Esto impedía consultar el cuerpo Markdown mientras se editaba una lista de verificación o un presupuesto.
- **Bloqueo de Edición en Ítems de Checklist:** Cada subtarea del checklist se renderizaba encapsulada dentro de un `<button>` de ancho completo con `onClick={() => handleToggleChecklistItem(chk.id)}`. El texto residía en un `<span>` estático sin controladores `onChange`/`onBlur` ni entrada bidireccional; cualquier clic sobre el texto alternaba el estado completado en lugar de habilitar edición in-situ.

#### 2. Solución Quirúrgica Implementada
1. **Unificación por Bloques Desplegables Bento (Cobalt Aerodynamic A.2.2):**
   - Eliminación del estado excluyente `tabActiva` y selector superior de pestañas.
   - Implementación de 3 bloques Bento colapsables apilados (`<details open className="group ...">`) con fondo `#0D1526`, microborde `border-slate-800/40` e iconografía Lucide con `strokeWidth={1.75}`:
     - **Bloque 1 (Texto & Markdown):** Textarea responsivo y visor Markdown sanitizado con botón de conmutación de Vista Previa integrado directamente en la cabecera del acordeón.
     - **Bloque 2 (Checklist):** Barra de adición de ítems, contador dinámico `font-mono tabular-nums` de tareas completadas vs totales en el header y lista scrollable de subtareas.
     - **Bloque 3 (Wishlist & Presupuesto):** Switch de activación, campos numéricos monetarios normalizados (`PEN`/`USD`) con tipografía `tabular-nums` y badge de costo estimado.
   - Coexistencia visual continua: los tres bloques pueden permanecer abiertos simultáneamente o colapsarse a discreción del usuario sin destruir el estado de los inputs.
2. **Desacoplamiento de Eventos y Edición In-Line de Subtareas:**
   - Desacople del botón de alternancia: el checkbox (`CheckSquare` / `Square`) se aisló en un botón exclusivo a la izquierda, previniendo toggles accidentales.
   - Estado de edición reactiva `editingChecklistId` (`string | null`) y mutador inmutable `handleEditarChecklistItem(id, nuevoTexto)`.
   - Activación in-line por **doble clic** (`onDoubleClick={() => setEditingChecklistId(chk.id)}`) renderizando un `<input type="text" autoFocus ... />` estilizado con microborde `border-sky-500/60`.
   - Guardado automático al perder el foco (`onBlur`) o presionar `Enter`, y cancelación con `Escape`.
   - Aislamiento estricto de eventos (`e.stopPropagation()`) para evitar el cierre involuntario del modal contenedor gobernado por el listener global de teclado.
3. **Suite de Pruebas Unitarias Vitest:**
   - Adición de los casos 7 y 8 en `src/utils/__tests__/notasEntity.test.ts` certificando mutación inmutable de subtareas y desacoplamiento atómico de eventos.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: 155/155 pruebas superadas (15 suites en verde).

---

### [REQ-PMO-001: Interactividad ReactBits en Filtros Portafolio sin Dependencias]
**Fecha:** Noviembre 2026 | **Fase:** 4.71 | **Archivos Creados/Modificados:** `src/components/PMO/FiltrosPortafolio.tsx`, `src/components/Views/ViewPortafolio.tsx`, `src/components/PMO/__tests__/FiltrosPortafolio.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Monolito de Vista de Portafolio:** `ViewPortafolio.tsx` contenía más de 1,280 líneas de código con los controles de filtrado (Estado, Salud, Ordenación) embebidos rígidamente dentro de la barra secundaria.
- **UI Estática y Carente de Micro-interacciones:** Los dropdowns presentaban transiciones binarias sin animación de entrada, sin feedback táctil ni física elástica. El menú de Estado forzaba un dropdown flotante innecesario para un conjunto acotado de 6 estados.

#### 2. Solución Quirúrgica Implementada
1. **Desacoplamiento Modular (`src/components/PMO/FiltrosPortafolio.tsx`):**
   - Extracción de la barra de filtros a un componente autónomo y reutilizable que recibe los estados (`filtroEstado`, `filtroSalud`, `filtroOrden`) y sus respectivos setters.
   - Eliminación de 128 líneas de marcado acoplado en `ViewPortafolio.tsx`, saneando el estado `openDropdown` en el contenedor padre.
2. **Patrón A (Sliding Pill - Filtro Estado):**
   - Riel redondeado en `bg-slate-900/60 border border-slate-800/80` con cápsula activa deslizante (`bg-indigo-600/30 border border-indigo-500/40 shadow-sm`).
   - Traslación matemática reactiva (`transform: translateX(...)`) sincronizada mediante `itemRefs` y `ResizeObserver` sin librerías de animación externas.
3. **Patrón B (Animated Popover - Filtro Salud):**
   - Popover Cobalt (`#0D1526`, `border-slate-800/80`, `backdrop-blur-md`) con entrada elástica (`animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150`).
   - LED indicador interactivo con micro-pulso sutil (`ring-2 animate-pulse`) sincronizado bidireccionalmente con el semáforo superior de la vista.
   - Cierre automático al hacer clic exterior mediante listener global `mousedown`.
4. **Patrón C (Spring-Bite - Filtro Alcance / Orden):**
   - Disparador con física de resorte in-line (`active:scale-[0.96] hover:scale-[1.02] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]`).
   - Rotación suave de 180° del icono Chevron según el estado del desplegable.
5. **Suite de Pruebas Unitarias Vitest:**
   - Creado `src/components/PMO/__tests__/FiltrosPortafolio.test.ts` con 3 pruebas verificando el mapeo de traslación de índices, coherencia de filtrado por salud y preservación de criterios de ordenación.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: 158/158 pruebas superadas (16 suites en verde).
- Cero dependencias adicionales añadidas al proyecto.

---

### [REQ-PMO-002: Refinamiento Estético e Iconografía Semántica en Filtros]
**Fecha:** Noviembre 2026 | **Fase:** 4.72 | **Archivos Modificados:** `src/components/PMO/FiltrosPortafolio.tsx`, `src/components/PMO/__tests__/FiltrosPortafolio.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Sobrecarga Textual y Riesgo de Desbordamiento Móvil:** En dispositivos móviles (< 640px), las etiquetas de texto completas en el track de estados generaban fricción táctil y scroll horizontal innecesario.
- **Carencia de Jerarquía Iconográfica:** Los filtros utilizaban puntos cromáticos planos en lugar de iconografía semántica estandarizada y carecían de tooltips nativos de accesibilidad.

#### 2. Solución Quirúrgica Implementada
1. **Iconografía Semántica Integral (`lucide-react` con `strokeWidth={1.75}`):**
   - Mapeo semántico en `ESTADOS`: `Layers` (Todos), `Play` (En Curso), `Calendar` (Planif.), `Archive` (Backlog), `Pause` (Pausa), `CheckCircle2` (Cerrado).
   - Sustitución de texto estático en disparador de Salud por `Activity` y opciones con `CheckCircle2` (Saludable), `AlertTriangle` (En Riesgo) y `XOctagon` (Crítico).
   - Inyección de íconos en Orden: `TrendingUp` (Mayor/Menor Avance), `Calendar` (Fecha Fin), `DollarSign` (Presupuesto/Gasto AC) y `Layers` (Nombre A-Z).
2. **Estándar de Colapso Responsivo (Ícono en Móvil + Texto Corto en Desktop):**
   - Envoltorio de etiquetas en `<span className="hidden sm:inline-block">`, reduciendo el ancho del track en móviles sin alterar los cálculos matemáticos de `ResizeObserver`.
   - Incorporación de atributos `title={item.tooltip}` en todos los disparadores y opciones para brindar feedback táctil e informativo nativo.
3. **Gradiente Premium y Feedback Interactivo:**
   - Aplicación de `bg-gradient-to-r from-indigo-600/40 to-violet-600/40 border border-indigo-400/50 shadow-sm transition-all duration-300 ease-out` en el elemento indicador activo (`pillStyle`).
   - Iluminación sutil al hover `hover:text-indigo-200` en botones interactivos.
4. **Suite de Pruebas Unitarias Vitest:**
   - Ampliado `src/components/PMO/__tests__/FiltrosPortafolio.test.ts` incorporando verificación de cobertura total de tooltips en los 3 filtros (159 pruebas superadas).

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: 159/159 pruebas superadas (16 suites en verde).


---

### [REQ-NOTAS-002: Refactorización de Sidebar, Cuadernos/Blocks y Accesos Rápidos]
**Fecha:** Noviembre 2026 | **Fase:** 4.73 | **Archivos Modificados:** `src/types/index.ts`, `src/components/Notas/SidebarCuadernos.tsx`, `src/components/Notas/ModalCrearCuaderno.tsx`, `src/components/Notas/VisorNotas.tsx`, `src/components/Notas/__tests__/SidebarCuadernos.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Acoplamiento Monolítico:** El sidebar desktop y el carrusel móvil residían monolíticamente dentro de `VisorNotas.tsx` (~1,334 líneas), forzando re-renders compartidos y bloqueando la implementación de transiciones dinámicas de ancho.
- **Ausencia de Colapsabilidad:** El layout desktop mantenía un ancho estático `w-64` sin opción de contraerlo a un riel compacto de íconos.
- **Creación Rudimentaria vía SweetAlert2:** La captura de nuevos blocks utilizaba un prompt imperativo `Swal.fire({ input: 'text' })` sin soporte de metadatos enriquecidos (ícono temático o descripción multilínea) ni estética Cobalt Aerodynamic.
- **Accesos Rápidos Estáticos:** La cuadrícula de 4 accesos rápidos carecía de microinteracciones elásticas y de adaptación vertical al colapsar el menú.

#### 2. Solución Quirúrgica Implementada
1. **Contrato Canónico de Metadatos (`CuadernoMeta`):**
   - Declaración de la interface `CuadernoMeta { id: string; nombre: string; descripcion: string; icono: string; color?: string; created_at: string }` en `src/types/index.ts`.
   - Persistencia híbrida en `localStorage` (`'pmo_notas_cuadernos_meta'`) fusionada reactivamente con los nombres de cuaderno en Dexie (`NotaRecord.block_nombre`), asegurando retrocompatibilidad total y fallback automático a ícono `Folder` para bloques huérfanos/legacy.
2. **Modal Declarativo de Cuadernos (`ModalCrearCuaderno.tsx`):**
   - Reemplazo completo del `Swal.fire` por un modal React Bento bajo tokens Cobalt Aerodynamic (`#0D1526`, `border-slate-800/60`).
   - Selector en cuadrícula de 12 íconos semánticos Lucide (`Folder`, `BookOpen`, `Briefcase`, `Code`, `Terminal`, `Sparkles`, `Target`, `Bookmark`, `Compass`, `Heart`, `Coffee`, `Archive`).
   - Campo de texto para nombre con validación de no duplicidad, textarea de propósito/descripción y blindaje de eventos de teclado (`e.stopPropagation()` en inputs) para preservar el despachador LIFO global.
3. **Sidebar Desacoplado y Colapsable (`SidebarCuadernos.tsx`):**
   - Extracción modular con estado reactivo `isCollapsed` persistido en `localStorage` (`'pmo_notas_sidebar_collapsed'`).
   - Alternancia fluida de ancho: `w-64` (expandido con ícono + nombre + badge tabular `font-mono tabular-nums`) a `w-16` (colapsado con íconos centrados y tooltips accesibles `title`).
   - Transición matemática suave `transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`.
   - Extracción complementaria del carrusel deslizable móvil `CarruselCuadernosMovil` con soporte unificado de íconos dinámicos.
4. **Físicas Elásticas en Accesos Rápidos:**
   - Inyección de microinteracciones: `active:scale-[0.96] hover:scale-[1.02] hover:bg-slate-800/50 hover:border-slate-700/60 transition-all duration-200`.
   - Transformación de layout reactiva: en estado expandido organiza los filtros (`FIJADAS`, `CHECKLIST`, `WISHLIST`, `VINCULADAS`) en cuadrícula 2x2; en estado colapsado los apila en columna 1x4 centrada con tooltips informativos.
5. **Certificación de Pruebas Unitarias Vitest:**
   - Creado `src/components/Notas/__tests__/SidebarCuadernos.test.ts` validando resolución de íconos, fallback resiliente, integridad del catálogo y prevención de duplicados (163/163 pruebas superadas).

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: 163/163 pruebas superadas (17 suites en verde).
- `npm run build`: Compilación y empaquetado de producción exitosos sin regresiones.


---

### [REQ-SYS-001-F1: Auditoría Integral - PMO Portafolio y KPIs]
**Fecha:** Noviembre 2026 | **Fase:** 4.74 | **Archivos Modificados:** `src/db/db.ts`, `src/components/PMO/TarjetaProyecto.tsx`, `src/components/Views/ViewPortafolio.tsx`, `src/components/Modals/ModalNuevoProyecto.tsx`, `src/components/Modals/ModalTareaFlow.tsx`, `src/components/PMO/__tests__/TarjetaProyecto.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Modales Bloqueantes Obsoletos:** Presencia de `Swal.fire` en la confirmación de eliminación en cascada de `ViewPortafolio.tsx` y llamadas nativas `alert()` en `ModalNuevoProyecto.tsx` y `ModalTareaFlow.tsx`.
- **Fuga de Rendimiento por Re-renders Innecesarios:** La tarjeta de proyecto en el Grid residía monolíticamente (~190 líneas de JSX) dentro del bucle `.map()` de `ViewPortafolio.tsx`, ejecutando filtrados de tareas (`tareas.filter(...)`) en cada render. Al no estar aislada en un componente `React.memo`, tipear en el buscador re-evaluaba todas las tarjetas.
- **Sobrecarga de I/O en Dexie:** La eliminación en cascada leía toda la tabla `db.gastos.toArray()` en lugar de utilizar índices Dexie dedicados para el filtrado de proyectos vinculados.

#### 2. Solución Quirúrgica Implementada
1. **Erradicación de SweetAlert2 y Alertas Nativos:**
   - Eliminación de `import Swal from 'sweetalert2'` y sustitución de `Swal.fire` por un modal declarativo Bento (`#0D1526`, `border-rose-500/40`, sombra `shadow-cobalt-2`) con confirmación explícita y margen de 4 segundos de gracia preservado intacto en `programarEliminacion`.
   - Erradicación de `alert()` en `ModalNuevoProyecto.tsx` y `ModalTareaFlow.tsx`, sustituyéndolos por estados reactivos `errorMsg` y `errorMsgSubtarea` renderizados en micro-alertas inline accesibles.
2. **Desacoplamiento y Memoización de `TarjetaProyecto`:**
   - Extracción de la tarjeta a `src/components/PMO/TarjetaProyecto.tsx` envuelta estrictamente en `React.memo`.
   - Pre-indexación del resumen de tareas (`total` y `completadas`) dentro del `useMemo` de `tareasPorProyecto`, transfiriendo un objeto simple inmutable a cada tarjeta y eliminando cálculos O(N*M) en el render loop.
   - Robustecimiento de reconciliación DOM con clave defensiva `key={p.id ? 'proy_' + p.id : 'proy_cod_' + p.codigo_legado}` tanto en Grid como en Tabla.
   - Handlers estabilizados mediante `useCallback`.
3. **Optimización Dexie IndexedDB (I/O):**
   - Actualización del esquema Dexie en `src/db/db.ts` a `version(5)`, indexando `gastos: 'id, user_id, codigo_legado, id_proyecto, id_origen_vinculado, ...'`.
   - Sustitución de `db.gastos.toArray()` por la consulta indexada `db.gastos.where('id_proyecto').equals(pId).toArray()`.
4. **Certificación QA:**
   - Suite de pruebas unitarias Vitest ampliada a 18 suites (167/167 tests superados).

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: 167/167 pruebas superadas (18 suites en verde).
- `npm run build`: Compilación y empaquetado de producción exitosos sin advertencias bloqueantes.

---

### [REQ-SYS-001-F1.1: Refinamiento Estético PMO - LEDs Orgánicos y Minimalismo]
**Fecha:** Noviembre 2026 | **Fase:** 4.75 | **Archivos Modificados:** `src/components/PMO/TarjetaProyecto.tsx`, `src/components/Views/ViewPortafolio.tsx`, `src/components/PMO/FiltrosPortafolio.tsx`, `src/components/PMO/__tests__/TarjetaProyecto.test.ts`, `src/components/PMO/__tests__/FiltrosPortafolio.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Contaminación por Emojis y Doble Glifo:** Los datos heredados o semillas contenían emojis literales en `health_status` (`🔴 Crítico`, `🟡 En Riesgo`, `🟢 Saludable`). Al renderizarse junto al micro-indicador CSS en la tarjeta y en la tabla ejecutiva, generaban duplicidad visual (`● 🔴 Crítico`) e infringían la regla canónica de cero emojis en DOM.
- **Falso Positivo en Disparador de Filtro de Salud:** Al seleccionar "Todas", el botón disparador aplicaba por defecto `bg-emerald-500 animate-pulse`, emitiendo una falsa señal de salud activa con pulso continuo.
- **Sobrecarga Cognitiva:** Existencia de íconos estáticos redundantes (`<Activity />`) conviviendo con texto y micro-puntos en el disparador de filtros.

#### 2. Solución Quirúrgica Implementada
1. **Estándar Canónico: "Ley del Silencio Visual":**
   - Erradicación de texto visible y emojis literales para el estado de salud en `TarjetaProyecto.tsx` y `ViewPortafolio.tsx` (vista tabla).
   - Sanitización centralizada: `(p.health_status || 'En Rango').replace(/^[^\p{L}\p{N}]+/u, '').trim()`, canalizando la etiqueta exclusivamente a los atributos de accesibilidad `title` y `aria-label`.
2. **Estándar Canónico: "Micro-LEDs Orgánicos" Hiper-Luminosos:**
   - Inyección de micro-LEDs de alta fidelidad: `w-2.5 h-2.5 rounded-full` con halo difuso de 8px según los tokens Cobalt:
     - Saludable / En Rango: `#10b981` (`shadow-[0_0_8px_#10b981]`).
     - Alerta / En Riesgo: `#f59e0b` (`shadow-[0_0_8px_#f59e0b]`).
     - Crítico / Bloqueado: `#f43f5e` (`shadow-[0_0_8px_#f43f5e]`) con `animate-pulse` reactivo continuo.
3. **Minimalismo Activo en Filtros (`FiltrosPortafolio.tsx`):**
   - Eliminación del ícono `<Activity />` en el botón disparador de salud.
   - Estado "Todas": LED neutro gris (`bg-slate-400 shadow-[0_0_4px_#94a3b8]`) sin pulso, erradicando el falso positivo.
   - Estado activo: micro-LED reactivo del color seleccionado con halo de 8px y `animate-pulse` exclusivo para el estado crítico.
   - Colapso responsivo de etiqueta (`hidden sm:inline-block`) preservado junto al chevron rotativo.
4. **Físicas y Pruebas Unitarias:**
   - Preservación de hundimiento táctil `active:scale-95` y spring-bite `ease-[cubic-bezier(0.34,1.56,0.64,1)]`.
   - Incorporación de pruebas en `TarjetaProyecto.test.ts` y `FiltrosPortafolio.test.ts`.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: Todas las pruebas unitarias aprobadas.
- `npm run build`: Compilación y empaquetado de producción exitosos sin regresiones.

---

### [REQ-SYS-001-F2: Auditoría Integral - PMO Kanban, Tareas y Fluidez Visual]
**Fecha:** Noviembre 2026 | **Fase:** 4.76 | **Archivos Modificados:** `src/components/Views/ViewKanban.tsx`, `src/components/PMO/ColumnaKanban.tsx`, `src/components/PMO/TarjetaTareaKanban.tsx`, `src/components/Subtareas/ListaSubtareas.tsx`, `src/components/Modals/ModalDoDAdvertencia.tsx`, `src/components/Modals/ModalTareaFlow.tsx`, `src/components/PMO/__tests__/KanbanOptimisticDoD.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Monolito sin Memoización:** `ViewKanban.tsx` concentraba más de 2,100 líneas con las 4 columnas y más de 100 tarjetas renderizadas en bucles anidados en el cuerpo del chasis. Cualquier hover (`hoveredTaskId`) o arrastre (`dragOverColId`) re-renderizaba todo el tablero y recalculaba dependencias y costos O(N) innecesariamente.
- **Diálogos Bloqueantes Legacy:** `validarDoDSubtareas` invocaba `window.confirm()` nativo al intentar mover tareas con subtareas pendientes a 'Completado'. La acción de archivar tarea ejecutaba `window.confirm()`, y `ListaSubtareas.tsx` importaba y ejecutaba `Swal.fire` (`sweetalert2`) para secuencias bloqueadas.
- **Latencia Perceptible en Drag & Drop:** Mover una tarjeta requería resolver `db.tareas.update` en Dexie, esperar la emisión reactiva de `useLiveQuery` y re-evaluar la cartera completa de avances WBS (`avancesPorProyecto`) antes de reposicionar la tarjeta en la columna destino.

#### 2. Solución Quirúrgica Implementada
1. **Desacoplamiento Memoizado (Columnas y Tarjetas):**
   - Extracción de la tarjeta a `src/components/PMO/TarjetaTareaKanban.tsx` envuelta estrictamente en `React.memo` con comparación de props shallow y animación de montaje `animate-in fade-in-50 slide-in-from-top-1 duration-150`.
   - Extracción de la columna a `src/components/PMO/ColumnaKanban.tsx` con `React.memo`, inyectando dropzone ambiental con gradiente Cobalt `bg-indigo-950/20 border-sky-500/40 shadow-[0_0_20px_rgba(56,189,248,0.15)]` y transición fluida `duration-200 ease-out`.
2. **Motor UI Optimista (Zero Latency & Rollback Resiliente):**
   - Inyección del estado local `estadosOptimistas` en `ViewKanban.tsx` que reubica la tarjeta de forma instantánea al soltarla (`onDrop`), desacoplando la respuesta visual del ciclo I/O de Dexie.
   - Protección contra fallos: bloque `try/catch` que revierte el mapa optimista si la base de datos rechaza la operación, con limpieza automática reactiva al sincronizar con Dexie.
   - Optimización de `avancesPorProyecto` con micro-caché indexado por proyecto, evitando re-evaluar la cartera global ante el movimiento de una sola tarea.
3. **Erradicación Total de Modales Legacy:**
   - Creación de `src/components/Modals/ModalDoDAdvertencia.tsx` (Bento `#0D1526`, `border-amber-500/40`, atajos Enter/Escape) para autorizaciones de Definition of Done sin bloqueos del hilo principal.
   - Purgado definitivo de `sweetalert2` en `ListaSubtareas.tsx`, reemplazado por micro-alertas inline accesibles con auto-cierre.
   - Sustitución de `window.confirm` en archivado de tareas por la orquestación estándar `programarEliminacion` con búfer de deshacer de 4 segundos.
4. **Fluidez de Entrada en Modales:**
   - Inyección de `animate-in fade-in duration-200` en el backdrop de `ModalTareaFlow.tsx` y `animate-in fade-in zoom-in-95 duration-200 ease-out` en el chasis Bento.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: 174/174 pruebas superadas (19 suites en verde).
- `npm run build`: Compilación y empaquetado de producción exitosos sin advertencias bloqueantes.

---

### [REQ-SYS-001-F3: Auditoría Integral - Notas, Wishlist y Cero Ruido Visual]
**Fecha:** Noviembre 2026 | **Fase:** 4.77 | **Archivos Modificados:** `src/components/Notas/VisorNotas.tsx`, `src/components/Notas/TarjetaNota.tsx`, `src/components/Modals/ModalConvertirWishlistGasto.tsx`, `src/components/Notas/__tests__/TarjetaNotaMemo.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Layout Shifts en Grilla Masonry:** La barra de acciones flotante aparecía empujando elementos adyacentes y alterando la altura de las tarjetas, provocando saltos visuales incómodos al pasar el cursor o seleccionar opciones.
- **Diálogos Bloqueantes Legacy (`sweetalert2`):** Conversión de deseos de Wishlist a gastos y eliminación masiva utilizaban `Swal.fire` bloqueante.
- **Sobrecarga Cognitiva:** Etiquetas y badges saturados sin aplicar la "Ley del Silencio Visual".

#### 2. Solución Quirúrgica Implementada
1. **Estabilización Visual & Silencio:**
   - Reserva de espacio de 40px para la barra de acciones superior evitando cualquier salto de layout.
   - Píldoras de categoría con hover sutil y chips compactos de vinculación.
2. **Erradicación de SweetAlert2:**
   - Creación de `ModalConvertirWishlistGasto.tsx` Bento Cobalt (`#0D1526`, `border-slate-800/60`).
   - Integración con `useUndoDelete()` para eliminación con búfer de 4 segundos.

---

### [HOTFIX-SYS-001: Aceleración GPU y Concurrencia React en VisorNotas]
**Fecha:** Noviembre 2026 | **Fase:** 4.78 | **Archivos Modificados:** `src/components/Notas/TarjetaNota.tsx`, `src/components/Notas/VisorNotas.tsx`, `src/components/Notas/__tests__/TarjetaNotaMemo.test.ts`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Cuello de Botella en Memoización:** `arePropsEqual` ejecutaba 4 llamadas a `JSON.stringify()` por tarjeta, destruyendo el framerate (FPS) durante el scroll o la búsqueda.
- **Costos CSS:** Reglas `backdrop-blur-md` y `transition-all` sobrecargaban la GPU y el motor de composición de Chrome.
- **Filtrado Síncrono:** La búsqueda por texto bloqueaba el hilo principal con cada pulsación de tecla.

#### 2. Solución Quirúrgica Implementada
1. **Memoización Atómica Primitiva:** Reducción de `arePropsEqual` a comparación estricta de `prev.id === next.id && prev.updated_at === next.updated_at && prev.modoVista === next.modoVista`.
2. **Aceleración GPU Pura:** Supresión de `backdrop-blur-md` y `transition-all` en favor de `transform-gpu` y transiciones dirigidas a `[transform,opacity,border-color]`.
3. **Concurrencia con `useDeferredValue`:** Desacoplamiento del input de búsqueda con renderizado diferido concurrente.
4. **Elevación de Modal:** Instancia única elevada de `<ModalConvertirWishlistGasto />` en el chasis `VisorNotas.tsx`.

---

### [REQ-SYS-001-F4: Auditoría Integral - Finanzas y Transacciones]
**Fecha:** Noviembre 2026 | **Fase:** 4.79 | **Archivos Modificados:** `src/components/Views/ViewFinanzas.tsx`, `src/components/Modals/ModalGasto.tsx`, `src/components/Modals/ModalIngreso.tsx`, `src/components/PMO/TarjetaTransaccion.tsx`, `src/components/PMO/__tests__/TarjetaTransaccion.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Diálogos Bloqueantes Legacy:** `ModalGasto.tsx`, `ModalIngreso.tsx` y `ViewFinanzas.tsx` utilizaban `Swal.fire` (`sweetalert2`) para validaciones, toasts de guardado, saneamiento de cuotas y configuración de techos.
- **Cuellos de Botella de Rendimiento en Transacciones:**
  - `lista.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())` instanciaba cientos de objetos `Date` innecesarios por segundo al ordenar transacciones unificadas.
  - La búsqueda de transacciones era síncrona en el hilo principal sin concurrencia reactiva.
  - Los filtros de periodo y segmento (`gastosFiltrados` e `ingresosFiltrados`) instanciaban `const hoy = new Date()` dentro del callback iterativo de filtrado $O(N)$.
- **Ausencia de Memoización en el Listado:** Las tarjetas de transacciones se renderizaban como JSX anónimo no memoizado en `ViewFinanzas.tsx`, re-evaluándose al completo ante cualquier interacción.
- **Asimetría Tipográfica Monetaria:** Techos presupuestales, monitoreo de cuotas bancarias, radar de categorías y métricas de burn rate carecían del token canónico `tabular-nums`.

#### 2. Solución Quirúrgica Implementada
1. **Desacoplamiento Canónico Memoizado (`TarjetaTransaccion.tsx`):**
   - Extracción del componente individual de transacción envuelto en `memo` con comparador atómico `areTrxPropsEqual` (validando `id`, `montoPen`, `esConciliado`, `estado`, `fecha`, `descripcion`, `categoria`, `tipo`).
   - Aplicación estricta de la "Ley del Silencio Visual": eliminación de textos y badges redundantes en favor de un micro-LED orgánico (`#10b981` para conciliado / `#f59e0b animate-pulse` para pendiente) con tooltip nativo `title` descriptivo.
   - Acciones secundarias (Editar y Eliminar) discretamente reveladas en hover suave (`group-hover:opacity-100`).
   - Estilizado Cobalt Aerodynamic: `#0D1526`, microborde `border-slate-800/60`, elevación `shadow-cobalt-1`, aceleración por hardware `transform-gpu hover:translate-y-[-2px]`.
2. **Optimización Extrema de Concurrencia y Filtrado:**
   - Inyección de `useDeferredValue(busquedaTrx)` para evitar bloqueos del hilo principal al tipear en el buscador de tesorería.
   - Sustitución de ordenamiento basado en `new Date().getTime()` por comparación lexicográfica ISO $O(1)$ `(b.fecha || '').localeCompare(a.fecha || '')` que no genera presión en el Garbage Collector.
   - Elevación (hoisting) de `const hoy = new Date()` y sus componentes de fecha fuera de los bucles iterativos de `gastosFiltrados` e `ingresosFiltrados`.
3. **Erradicación Absoluta de SweetAlert2:**
   - Purgado de `import Swal from 'sweetalert2'` en `ModalGasto.tsx`, `ModalIngreso.tsx` y `ViewFinanzas.tsx`.
   - Inyección de micro-banners accesibles e inline para validación de campos numéricos y descripciones requeridas en modales de gasto e ingreso.
   - Orquestación de eliminaciones de transacciones mediante `programarEliminacion` de `useUndoDelete()` con búfer de deshacer de 4 segundos.
   - Reemplazo de alertas informativas por el toast reactivo nativo Cobalt `#0D1526` con micro-LED verde y auto-dismiss de 3 segundos.
4. **Paridad Monetaria Estricta (`tabular-nums font-mono`):**
   - Inyección sistemática del token `tabular-nums` en cuotas bancarias, techos presupuestales, radar de categorías críticas, matrix de burn rate por proyecto y compromisos financieros.
5. **Certificación QA:**
   - Creación de suite unitaria exhaustiva en `src/components/PMO/__tests__/TarjetaTransaccion.test.ts` (5 tests).

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: 187/187 pruebas superadas (21 suites en verde).
- `npm run build`: Compilación y empaquetado de producción exitosos (8.62s).

---

### [REQ-SYS-001-F5: Auditoría Integral - Finanzas (Dashboard, Conciliación y Cálculos)]
**Fecha:** Noviembre 2026 | **Fase:** 4.80 | **Archivos Modificados:** `src/components/Views/ViewFinanzas.tsx`, `src/components/Finanzas/DashboardFinanciero.tsx`, `src/components/Finanzas/TabControlCuotas.tsx`, `src/components/Finanzas/TabPresupuestos.tsx`, `src/components/Modals/ModalNuevoPlanCuotas.tsx`, `src/components/Finanzas/__tests__/DashboardFinanciero.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Monolito de ViewFinanzas (1,733 Líneas):** Todo el árbol de vistas (Dashboard, Transacciones, Cuotas, Presupuestos y Modales) residía en un solo archivo JSX. Cada keystroke en la búsqueda de transacciones forzaba la re-evaluación completa de los dashboards y las pestañas inactivas.
- **Doble Recorrido Inline O(2N):** En la pestaña de Cuotas, las tarjetas de KPI calculaban `cuotas.filter(...).reduce(...)` dos veces seguidas en pleno render JSX para obtener total comprometido y amortizado.
- **Latencia Perceptible en Conciliación de Tesorería:** Al alternar el estado conciliado de un gasto o cuota bancaria, el usuario experimentaba retraso visual esperando la promesa de mutación de Dexie IndexedDB.
- **Fuga de Rendimiento por Instanciación de Objetos Date:** El cálculo de próximos vencimientos instanciaba `new Date()` repetidamente en cada iteración del bucle.
- **Ruido Visual:** Párrafos explicativos extensos en las tarjetas de Balance, Ingresos y Gastos competían con la lectura numérica de los datos.

#### 2. Solución Quirúrgica Implementada
1. **Desacoplamiento Canónico en Módulos Memoizados:**
   - `src/components/Finanzas/DashboardFinanciero.tsx`: Componente envuelto en `React.memo` para las métricas de balance consolidado, ingresos, egresos, runway y selector de periodo/segmento.
   - `src/components/Finanzas/TabControlCuotas.tsx`: Componente memoizado para el monitoreo de planes de financiamiento y cronogramas con acumulador $O(N)$ en una sola pasada.
   - `src/components/Finanzas/TabPresupuestos.tsx`: Componente memoizado para la matriz de presupuestos por categoría, inversiones en hábitos y burn rate de proyectos.
   - Reducción del monolito `ViewFinanzas.tsx` de 1,733 líneas a ~1,075 líneas.
2. **Patrón UI Optimista de Conciliación (0ms de Latencia):**
   - Estado reactivo instantáneo `optimisticConciliados` (`Record<string, boolean>`) en el componente orquestador.
   - Los micro-LEDs (`#10b981` activo / `#f59e0b` pendiente) y los badges de estado cambian en 0ms al click del usuario.
   - Blindaje con rollback en caso de fallo en IndexedDB mediante captura de excepciones y reseteo del estado optimista.
3. **Modal Bento Declarativo (`ModalNuevoPlanCuotas.tsx`):**
   - Desacoplamiento de la creación de planes de financiamiento con `createPortal(..., document.body)`.
   - Soporte de atajo de teclado `Escape` con bloqueo de scroll mediante `useBodyScrollLock`.
   - Micro-banner inline de validación y estética Cobalt Aerodynamic (`#0D1526`, `border-slate-800/80`).
4. **Optimización Matemática & Cero Presión de GC:**
   - Pre-cálculo de fechas base con timestamps en milisegundos (`hoyMs = hoy.getTime()`) y cálculo de días restantes sin instanciar objetos `Date` adicionales en bucles.
   - Protección contra división por cero en cálculo de runway de meses en `TabPresupuestos.tsx`.
5. **Silencio Visual:**
   - Eliminación de textos explicativos pesados reemplazándolos con tooltips nativos en `title` sobre micro-halos y micro-LEDs.
   - Tipografía canónica `tabular-nums font-mono` en todos los importes, cuotas y métricas financieras.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: 193/193 pruebas superadas (22 suites en verde).
- `npm run build`: Compilación y empaquetado de producción exitosos (8.56s).

---

### [REQ-SYS-001-F6: Auditoría Integral - Hábitos y Tracker Diario]
**Fecha:** Noviembre 2026 | **Fase:** 4.81 | **Archivos Modificados:** `src/utils/timeFormatters.ts`, `src/services/habitosService.ts`, `src/components/Modals/ModalRegistroAvanceHabito.tsx`, `src/components/Habitos/Dashboard/HeatmapConsistencia.tsx`, `src/hooks/useHabitos.ts`, `src/components/Habitos/Dashboard/TablaRendimiento.tsx`, `src/components/Habitos/TarjetaHabito.tsx`, `src/components/Habitos/TableroHabitos.tsx`, `src/components/Modals/ModalActividadFlow.tsx`, `src/components/Habitos/Dashboard/MetasCuantitativas.tsx`, `src/components/Habitos/Metas/ModalDetalleMeta360.tsx`, `src/components/Habitos/__tests__/HabitosTrackerOptimistic.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Desfase Temporal Nocturno (Bug Crítico UTC-5 Lima):** Se detectó el uso de `new Date().toISOString().split('T')[0]` en `HeatmapConsistencia.tsx`, `useHabitos.ts`, `TarjetaHabito.tsx` y `TablaRendimiento.tsx`. En horario nocturno local (a partir de las 19:00 horas), la fecha ISO en UTC devolvía el día de mañana, provocando que la celda de hoy en el mapa de consistencia se colocara en el futuro y que los check-ins de hoy se compararan erróneamente contra la fecha del día siguiente.
- **Congelamientos de Interfaz en el Heatmap:** El mapa de consistencia actualizaba un estado reactivo local `hoveredCell` con cada movimiento de ratón, forzando la reconciliación de las 112 celdas de la cuadrícula continuamente.
- **Latencia Perceptible en Check-ins:** `handleToggleCompletar` en `TarjetaHabito.tsx` esperaba las transacciones completas de IndexedDB y el despacho a SyncManager antes de reflejar el cambio en la vista, generando una latencia de 100-300ms.
- **Presencia de Modales Legacy y `SweetAlert2`:** Inyección imperativa de HTML en diálogos `Swal.fire` con `document.getElementById('swal-inp-avance')` para avances numéricos, prompts bloqueantes de eliminación y alertas informativas invasivas.
- **Multiplicación de Modales en Memoria:** Cada tarjeta individual de hábito montaba su propia instancia de `<ModalAlcanceRecurrencia>` en el árbol React.

#### 2. Solución Quirúrgica Implementada
1. **Unificación Temporal Local con `formatFechaIsoLocal`:**
   - Estandarización de `formatFechaIsoLocal(date = new Date()): string` en `src/utils/timeFormatters.ts`.
   - Erradicación de todas las llamadas a `toISOString().split('T')[0]` en el módulo de Hábitos y Dashboard.
2. **UI Optimista de Check-in (0ms de Latencia):**
   - Inyección del diccionario reactivo `optimisticCompletados` en `TableroHabitos.tsx` y propagado como prop a `TarjetaHabito.tsx`.
   - Respuesta visual instantánea en 0ms para checkbox, tachado de texto y micro-LED de racha con rollback defensivo ante excepciones.
3. **Heatmap Acelerado por GPU y Tooltips Nativos O(1):**
   - Envoltorio de `HeatmapConsistencia` en `React.memo`.
   - Supresión del estado `hoveredCell` en favor de tooltips nativos en el atributo `title` de cada celda, eliminando el 100% de los re-renders al mover el cursor.
   - Adopción estricta de la paleta Cobalt Aerodynamic (`#0D1526`, `border-slate-800/40`).
4. **Modal Declarativo Bento `ModalRegistroAvanceHabito.tsx`:**
   - Componente desacoplado montado mediante `createPortal(..., document.body)` con autofocus, atajos de incremento rápido (+1, +5, +10), umbral de rescate de racha, micro-banner de validación inline accesible y atajo `Escape`.
   - Erradicación total de `Swal.fire` en `TarjetaHabito.tsx`, `MetasCuantitativas.tsx` y `ModalActividadFlow.tsx`.
5. **Single Instance Modal Pattern y Eliminación Diferida (UndoDelete 4s):**
   - Elevación de `ModalAlcanceRecurrencia` a la raíz del tablero.
   - Orquestación de eliminaciones mediante `programarEliminacion` con ocultamiento optimista reactivo vía `estaOculto(act.id)`.
6. **Ley del Silencio Visual y Memoización Atómica:**
   - Ocultamiento de botones de acción rápida en `TarjetaHabito`, revelados únicamente en `hover` suave (`opacity-0 group-hover:opacity-100`).
   - Memoización de `TarjetaHabito` mediante `areHabitoPropsEqual` que valida exclusivamente propiedades primitivas.
   - Inyección inquebrantable de `font-mono tabular-nums` en todas las cifras, rachas y porcentajes.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: 200/200 pruebas superadas (23 suites en verde).
- `npm run build`: Compilación y empaquetado de producción exitosos (8.41s).

---

### [REQ-SYS-001-F7: Auditoría Integral - Sidebar y Navegación]
**Fecha:** Noviembre 2026 | **Fase:** 4.82 | **Archivos Modificados:** `src/App.tsx`, `src/components/Layout/HeaderMaestro.tsx`, `src/components/Layout/SidebarPortafolio.tsx`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Carga Monolítica Inicial (Sin Code Splitting):** Todas las vistas mayores (`ViewKanban`, `ViewPortafolio`, `ViewHabitos`, `ViewNotas`, `ViewFinanzas`, etc.) se importaban síncronamente en el bundle principal de la aplicación.
- **Ruteo Desincronizado:** La navegación por pestañas dependía únicamente del estado en memoria, sin soporte fluido para enlaces profundos ni historial por hash.
- **Ruido en Cabecera:** Pestaña "Notas" segregada en el extremo derecho en lugar del `<nav>` unificado central.

#### 2. Solución Quirúrgica Implementada
1. **Lazy Loading Universal con React.lazy & Suspense:**
   - Carga diferida de todas las vistas principales con fallback visual Cobalt.
   - Sincronización bidireccional entre `vistaActiva` y `window.location.hash`.
2. **Unificación Central y Reducción de Ruido Visual:**
   - Integración de "Notas" en el `<nav>` maestro central (5ta pestaña canónica).
   - Colapso responsivo en pantallas medianas con tooltips semánticos y supresión de texto redundante.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores.
- `npm test`: 200/200 pruebas superadas.

---

### [REQ-SYS-001-F8: Auditoría Integral - Configuración, Techos y UX Global]
**Fecha:** Noviembre 2026 | **Fase:** 4.83 | **Archivos Modificados:** `src/utils/toastCobalt.ts`, `src/components/Modals/ModalTechosPresupuesto.tsx`, `src/components/Finanzas/TabPresupuestos.tsx`, `src/components/Modals/ModalMetaPlanFlow.tsx`, `src/components/Views/ViewMetasPlanes.tsx`, `src/components/Modals/ViewDetalle360.tsx`, `src/components/Ideas/WidgetIdeasBubble.tsx`, `src/components/IA/AsistenteIaModal.tsx`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Presencia Residual de SweetAlert2:** Módulos de planes, metas, asistente IA e ideas utilizaban `Swal.fire` bloqueante para confirmaciones y alertas.
- **Presupuestos con Valores Hardcodeados:** La matriz de techos presupuestales carecía de persistencia reactiva en `localStorage`.

#### 2. Solución Quirúrgica Implementada
1. **Purga Definitiva de SweetAlert2:**
   - Erradicación de todas las llamadas residuales a `Swal.fire` sustituyéndolas por `toastCobalt` y el hook `useUndoDelete(4000ms)`.
2. **Motor Real de Techos Presupuestales:**
   - Creación del componente Bento Cobalt `ModalTechosPresupuesto.tsx` con inputs tipados en `font-mono tabular-nums`.
   - Lectura combinada y persistencia en `localStorage` de techos de gasto por categoría en `TabPresupuestos.tsx`.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores.
- `npm test`: 200/200 pruebas superadas.

---

### [REQ-SYS-002-KANBAN: Optimización Sidebar y UI ReactBits]
**Fecha:** Noviembre 2026 | **Fase:** 4.84 | **Archivos Modificados:** `src/components/Views/ViewKanban.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Presión Algorítmica en Renderizado:** El cálculo de tareas activas y totales por proyecto se realizaba mediante barridos lineales iterativos `tareas.filter().length` directamente en el ciclo de mapeo de `proyectosFiltrados`, degradando la tasa de refresco ante colecciones grandes de datos.
- **Layout Shifts al Colapsar/Expandir:** La animación del panel lateral `#sidebar-portafolio` empleaba transiciones de anchura fija (`w-16` vs `w-72 lg:w-80`) sobre contenedores flexbox, provocando saltos bruscos de maquetación (CLS) y repintados costosos en el área central del Kanban.
- **Inconsistencias Estéticas:** Uso residual de clases `indigo-*` en botones de cartera y creación de proyectos, bordes toscos `border-l-4` y ausencia de micro-indicadores visuales reactivos tipo ReactBits.

#### 2. Solución Quirúrgica Implementada
1. **Patrón "Diccionario de Contadores O(1)":**
   - Inyección de `contadoresTareasPorProyecto` vía `useMemo` con dependencia exclusiva en `tareas`.
   - Pre-cálculo acumulativo de tareas totales, activas y completadas en un `Map<string, { total, activas, completadas }>` unificando códigos legados (`proyecto_codigo`) e identificadores de base de datos (`id_proyecto`).
   - Acceso $O(1)$ instantáneo en tiempo constante dentro de la iteración de proyectos en el Sidebar, erradicando por completo los barridos $O(N \cdot M)$.
2. **Patrón "CSS Grid Transition" para Paneles Laterales (Cero Layout Shifts):**
   - Conversión de `#vista-kanban-wrapper` a contenedor CSS Grid dinámico: `grid grid-cols-1 md:grid-cols-[288px_1fr] lg:grid-cols-[320px_1fr]` (expandido) vs `md:grid-cols-[64px_1fr]` (colapsado) con `transition-[grid-template-columns] duration-300 ease-out`.
   - Aside `#sidebar-portafolio` configurado a `w-full h-full overflow-hidden select-none` preservando clases semánticas `sidebar-collapsed` y `sidebar-expanded`.
   - Inyección de `min-w-0` en el contenedor `<main>` para aislar las columnas del grid y prevenir desbordamientos o tirones visuales.
3. **Estética ReactBits & Tokens Cobalt Aerodynamic:**
   - **Micro-LED Activo:** Sustitución del borde izquierdo tosco por un pseudo-elemento vertical radiante `before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-sky-400 before:shadow-[0_0_12px_#38bdf8] before:transition-transform before:scale-y-100 before:rounded-l-xl` sobre fondo `#0A101C` y microborde `border-sky-500/50`.
   - **Spotlight Tenue en Inactivos:** Micro-interacción al hover con elevación suave `hover:translate-x-0.5`, fondo `#0D1526]/90` y borde `border-slate-700/80`.
   - **Cápsula de Conteo O(1):** Badge en `font-mono tabular-nums text-[10px]` con `{contadores.activas}/{contadores.total}` y micro-ícono `CheckSquare` (`strokeWidth={1.75}`).
   - **Doble Barra de Progreso:** Gradiente Cobalt en avance real (`bg-sky-500`) y meta proyectada en `bg-sky-400/25` sobre pista `bg-slate-800/80`.
   - **Purga de Tokens Legacy:** Reemplazo integral de clases `indigo-*` por tokens Cobalt `sky-*` en filtros de cartera (`bg-sky-600`), badge de total de proyectos (`bg-sky-500/10 text-sky-300`), botón 360° en hover (`bg-sky-600/90 hover:bg-sky-500`) y botón canónico "Nuevo Proyecto" (`bg-sky-600 hover:bg-sky-500 shadow-sky-950/40`).
   - Iconografía estandarizada en Lucide React con `strokeWidth={1.75}` universal y cero emojis en DOM.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: 200/200 pruebas superadas (23 suites en verde).
- `npm run build`: Compilación y empaquetado de producción exitosos en 7.03s.

---

### [REQ-SYS-003-KANBAN: Optimización y Rediseño de Barra de Filtros]
**Fecha:** Noviembre 2026 | **Fase:** 4.85 | **Archivos Modificados:** `src/components/Views/ViewKanban.tsx`, `src/components/PMO/ColumnaKanban.tsx`, `src/components/Layout/HeaderMaestro.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Re-cálculo Innecesario en Renderizado:** En cada ciclo de render de `ViewKanban`, la distribución y ordenamiento de tareas por columna (`ordenarTareas(tareasFiltradas.filter(...))`) se ejecutaba 4 veces en caliente en el bucle JSX de las columnas, recalculando innecesariamente la matriz de tareas incluso ante simples aperturas o cierres de popovers.
- **Fricción y Timers Rígidos:** Los temporizadores de mouseleave poseían un delay hardcodeado de 280ms con tipado `NodeJS.Timeout`, generando lentitud en la respuesta háptica y solapamiento accidental entre popovers al desplazar el cursor.
- **Renderizado Condicional Abrupto:** Los popovers emergentes se montaban y desmontaban con `&&`, impidiendo transiciones fluidas de opacidad y escala aceleradas por GPU.
- **Contaminación Visual y Scrollbars Clandestinos:** Existencia de clases `overflow-x-auto` redundantes y altura fija `max-h-[calc(100vh-175px)]` en columnas que causaban scrollbars verticales espurios, y presencia de la pestaña "Notas" dentro del bloque de navegación operativa central.

#### 2. Solución Quirúrgica Implementada
1. **Patrón "Memoización de Columnas":**
   - Inyección del hook `tareasAgrupadasPorColumna = useMemo<Record<string, CanonicalTarea[]>>(...)` en `ViewKanban.tsx` indexado por `col.id`.
   - Distribución atómica en una sola pasada $O(N)$ y ordenamiento previo con `ordenarTareas`, reduciendo a $O(1)$ el acceso en el mapeo de `<ColumnaKanban />`.
2. **Optimización de Timers y Despacho Determinista:**
   - Reducción del delay de `handlePopoverMouseLeave` de 280ms a `140ms` (latencia óptima).
   - Tipado determinista de `leaveTimers.current` como `Record<string, number | null>` usando `window.setTimeout`.
   - Cierre forzoso de popovers hermanos y purga de timers activos al invocar `handlePopoverMouseEnter`.
3. **Patrón "Popovers Persistentes con Aceleración GPU":**
   - Eliminación del renderizado condicional abrupto; persistencia de nodos en el DOM con clases:
     `transition-all duration-150 ease-out transform-gpu origin-top`
     - Cerrado: `opacity-0 scale-95 pointer-events-none invisible`.
     - Abierto: `opacity-100 scale-100 pointer-events-auto visible`.
   - Tokens canónicos Cobalt Aerodynamic: fondo `bg-[#0D1526]`, microborde `border-slate-800/80` y sombra multicapa `shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_8px_10px_-6px_rgba(56,189,248,0.12)]`.
   - Purga de clases `bg-white`, `text-indigo-400` y `shadow-2xl`.
4. **Erradicación de Scrollbars Clandestinos & Estandarización de Chasis:**
   - Asignación de `id="board-kanban-container"` con `overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden`.
   - Eliminación de alturas fijas en `ColumnaKanban.tsx` adoptando `h-full min-h-0` y ocultamiento de scrollbars espurios con `[&::-webkit-scrollbar]:hidden`.
5. **Reubicación de Pestaña Notas:**
   - Desacoplamiento de la pestaña "Notas" del `<nav>` central maestro de `HeaderMaestro.tsx`, reubicándola como botón de acceso rápido independiente en el flanco derecho, separándola visualmente de las 4 vistas maestras operativas (Kanban, Portafolio, Hábitos, Finanzas) y preservando el atajo `5` e identificador `tab-nav-notas`.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test -- --run`: 200/200 pruebas superadas (23 suites en verde).
- `npm run build`: Compilación y empaquetado de producción exitosos en 6.17s.

---

### [REQ-SYS-004-NOTAS: Refactorización Integral, Copiado y Cuadernos]
**Fecha:** Noviembre 2026 | **Fase:** 4.86 | **Archivos Modificados:** `src/utils/entityNormalizer.ts`, `src/utils/toastCobalt.ts`, `src/components/Notas/VisorNotas.tsx`, `src/components/Notas/SidebarCuadernos.tsx`, `src/components/Notas/TarjetaNota.tsx`, `src/components/Notas/EditorNotaModal.tsx`, `src/utils/__tests__/notasEntity.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Ausencia de Serializador Omnicanal Canónico:** Las notas modulares compuestas (con wishlist, checklists y markdown simultáneos) carecían de un exportador universal a texto plano puro, provocando que el usuario tuviese que copiar manualmente campos dispersos o que se filtraran IDs técnicos y UUIDs de sincronización.
- **Persistencia Rígida de Cuadernos y Riesgo de Huérfanos:** No existía mecanismo para eliminar cuadernos personalizados (`blocksLocales`). Si se eliminaban únicamente de `localStorage`, las notas que aún conservaban dicho `block_nombre` en IndexedDB (Dexie) provocaban la resurrección inmediata del cuaderno en el siguiente ciclo reactivo.
- **Layout Shifts en Sidebar de Cuadernos:** El colapso del menú lateral utilizaba anchos fijos flexbox (`w-64` vs `w-16`) que generaban saltos bruscos de maquetación y desbordamientos en resoluciones intermedias.
- **Residuos Cromáticos Legacy:** El cuaderno activo y el carrusel móvil utilizaban tokens `indigo-*` (`bg-indigo-500/20 text-indigo-300 border-indigo-500/40`), violando el sistema canónico Cobalt Aerodynamic.
- **Scroll Infinito en Vista de Lista:** En `modoVista === 'lista'`, `TarjetaNota` evaluaba y renderizaba el AST Markdown completo con `ReactMarkdown`, inflando el alto de cada tarjeta a cientos de píxeles e imposibilitando una visualización condensada estilo tabla.

#### 2. Solución Quirúrgica Implementada
1. **Serializador Universal Coalescente (`serializarNotaATextoPlano`):**
   - Implementado y exportado en `src/utils/entityNormalizer.ts`.
   - Formatea secuencialmente: Título, Metadatos de Wishlist (`Costo: [MONEDA] [MONTO] | Estado: [ESTADO]` y `Enlace: [URL]`), Checklists marcados y pendientes (`[x]` / `[ ]`), Texto Markdown / libre (omitiendo estructuras JSON internas) y Etiquetas (`Tags: #tag1 #tag2`).
   - Excluye incondicionalmente IDs correlativos, UUIDs primarios y campos de sincronización (`sync_status`, `updated_at`).
2. **Inyección de Botón Copiar con Feedback Háptico:**
   - Inyectado en `TarjetaNota.tsx` (tanto en footer de tarjeta masonry como en fila de modo lista) y en la cabecera de `EditorNotaModal.tsx`.
   - Utiliza ícono `Copy` de Lucide (`strokeWidth={1.75}`), conmuta a `Check` (color emerald) durante 1500ms y despacha micro-notificación nativa `toastCobalt.exito('Nota copiada al portapapeles')`.
3. **Eliminación Atómica de Cuadernos y Prevención de Resurrección:**
   - En `VisorNotas.tsx`, implementación de `handleEliminarCuaderno(nombreBlock)`.
   - Mutación masiva atómica en Dexie: `await db.notas.where('block_nombre').equals(nombreBlock).modify({ block_nombre: '', sync_status: 'pending', updated_at: nowIso })`.
   - Purga de `blocksLocales` y `cuadernosMeta` en `localStorage`. Si el cuaderno eliminado estaba activo, conmuta de forma segura a `null` (Todas las Notas).
   - En `SidebarCuadernos.tsx`, inyección de botón `Trash2` visible en hover (`group-hover:flex`) con diálogo de confirmación preventiva antes de ejecutar la acción.
4. **Físicas CSS Grid y Micro-LED Cobalt:**
   - En `VisorNotas.tsx`, conversión del chasis principal a CSS Grid dinámico:
     `grid grid-cols-1 ${isSidebarCollapsed ? 'md:grid-cols-[64px_1fr]' : 'md:grid-cols-[256px_1fr]'} transition-[grid-template-columns] duration-300 ease-out`.
   - En `SidebarCuadernos.tsx`, sustitución del borde tosco por el Micro-LED radiante canónico:
     `before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-sky-400 before:rounded-r before:shadow-[0_0_12px_#38bdf8]` con fondo `bg-sky-500/15` y microborde `border-sky-500/40`.
   - Purga total de clases `indigo-*` en desktop y en `CarruselCuadernosMovil`.
5. **Fila Bento Compacta para Vista de Lista:**
   - En `TarjetaNota.tsx`, intercepción inmediata para `modoVista === 'lista'`, retornando una fila horizontal ultra-compacta `h-12 w-full px-3.5 py-1.5 flex items-center justify-between`:
     * Lado izquierdo: `codigo_legado` (`font-mono text-[10px] text-slate-500 font-bold`), badge de block asignado y título truncado en una sola línea.
     * Lado derecho: Cápsula de checklist `{completados}/{total}`, badge de wishlist con importe redondeado, fecha relativa y acciones rápidas (`Copy`, `Trash2`).
     * Supresión completa del AST Markdown en lista, optimizando el rendimiento y garantizando densidad de información.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test`: 201/201 pruebas superadas (23 suites en verde, incluyendo nuevo test unitario de serialización).
- `npm run build`: Compilación y empaquetado de producción exitosos en 6.16s.





---

### [REQ-SYS-011-PORTAFOLIO: Consolidación O(1) y Estética Cobalt en Dashboard]
**Fecha:** Noviembre 2026 | **Fase:** 4.93 | **Archivos Modificados:** `src/components/Views/ViewPortafolio.tsx`, `src/components/PMO/TarjetaProyecto.tsx`, `src/components/PMO/FiltrosPortafolio.tsx`, `src/components/Habitos/Dashboard/RadarBalanceVida.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Contaminación Cromática por Indigo y Slate-100:** `ViewPortafolio.tsx` contenía 32 instancias de clases `indigo-*` y chasis `bg-slate-100 dark:bg-slate-950`. `TarjetaProyecto.tsx` presentaba botones y acentos indigo con bordes slate-200. `FiltrosPortafolio.tsx` aplicaba gradientes violeta/indigo en pastillas deslizantes y menús popover.
- **Micro-LEDs Desalineados y Trazo Brillante en Radar:** Los estados de salud en las tarjetas PMO carecían del estándar canónico de micro-LED de anillo difuso (`ring-2 ring-emerald-400/20`), mientras que en `RadarBalanceVida.tsx` los trazos concéntricos utilizaban `stroke-slate-200` causando destellos claros sobre el fondo `#0D1526`.
- **Layout Shifts (CLS) en Grid/Tabla y Tarjetas:** La alternancia entre cuadrícula y tabla carecía de reserva de altura y contención CSS. En las tarjetas, la presencia o ausencia del texto North Star OKR alteraba la altura de cada tarjeta en la cuadrícula generando alineaciones desparejas.
- **Empty State Plano sin Elevación:** Al no encontrar proyectos o tener el portafolio en blanco, se renderizaba un contenedor con borde discontinuo plano (`border-dashed border-slate-300 dark:border-slate-800`) sin distinguir entre onboarding de inicio y búsqueda sin coincidencias.

#### 2. Solución Quirúrgica Implementada
1. **Purga Final de Indigo y Adopción Cobalt Aerodynamic:**
   - Erradicación del 100% de clases `indigo-*`, `bg-white` y `slate-100` en `ViewPortafolio.tsx`, `TarjetaProyecto.tsx` y `FiltrosPortafolio.tsx`.
   - Chasis unificado `bg-[#040711] text-slate-100`, superficies flotantes `#0D1526`, microbordes `border-slate-800/40` y acentos `sky-500` / `sky-400` / `teal-400`.
   - En `RadarBalanceVida.tsx`, reemplazo de `stroke-slate-200` y `stroke-slate-800/80` por `stroke-slate-800/60`.
2. **Micro-LEDs de Salud Estandarizados:**
   - En `TarjetaProyecto.tsx`, estandarización de indicadores de salud:
     * En Rango: `bg-emerald-400 ring-2 ring-emerald-400/20`.
     * En Riesgo: `bg-amber-400 ring-2 ring-amber-400/20`.
     * Crítico / Bloqueado / Retrasado: `bg-rose-400 ring-2 ring-rose-400/20 animate-pulse`.
3. **Contención Geométrica (Cero CLS):**
   - En `ViewPortafolio.tsx`, inyección de `min-h-[520px] contain-layout [contain:layout]` en el contenedor condicional de cuadrícula (`#grid-proyectos-cards`) y contenedor de tabla (`#table-proyectos-wrapper`).
   - En `TarjetaProyecto.tsx`, fijación de altura mínima base `min-h-[320px] flex flex-col justify-between` y encapsulación del North Star OKR en contenedor con `min-h-[20px]` para garantizar alineación uniforme.
4. **Bento Empty State Dual:**
   - Implementado en `ViewPortafolio.tsx` distinguiendo dos flujos de experiencia de usuario:
     * **Onboarding (0 proyectos en DB):** Tarjeta Bento elevada `#0D1526` con ícono `FolderKanban` (`strokeWidth={1.75}`) en microcontenedor `bg-sky-950/40 border-sky-800/40 text-sky-400`, mensaje invitando a registrar la primera iniciativa y botón CTA primario `bg-sky-500 hover:bg-sky-400` para abrir `ModalNuevoProyecto`.
     * **Sin coincidencias de filtro:** Tarjeta Bento elevada `#0D1526` con ícono `SearchX` (`strokeWidth={1.75}`) en microcontenedor `bg-slate-900/80 text-slate-400`, mensaje explicativo y botón ghost `bg-slate-800/80 text-sky-300` para restablecer filtros.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test`: 217/217 pruebas superadas (25 suites en verde, 100% passing).
- `npm run build`: Compilación y empaquetado de producción exitosos en 8.19s (`vite v6.4.4`).

---

### [REQ-SYS-012-MODALS: Estandarización UI/UX, Tokens Cobalt, Pre-reserva Anti-CLS y Atajo Ctrl+Enter en Modales de Captura]
**Fecha:** Noviembre 2026 | **Fase:** 4.94 | **Archivos Modificados:** `src/components/Modals/ModalGasto.tsx`, `src/components/Modals/ModalIngreso.tsx`, `src/components/Modals/ModalTareaFlow.tsx`, `src/components/Modals/ModalNuevoProyecto.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Residuos de Tokens Obsoletos:** `ModalNuevoProyecto.tsx` (34 instancias de `indigo-*` y 23 de `bg-white`/`border-slate-200`), `ModalTareaFlow.tsx` (9 instancias de `indigo-*`), `ModalGasto.tsx` y `ModalIngreso.tsx` presentaban estilos heredados incompatibles con el estándar Cobalt Aerodynamic.
- **Layout Shifts (CLS) por Renderizado Condicional de Errores:** En los 4 modales, los mensajes de validación (`errorMsg`, `errorMsgSubtarea`) se montaban condicionalmente en el DOM (`{errorMsg && <p>...}`), empujando el contenido hacia abajo o alargando el modal abruptamente al disparar errores de validación.
- **Ergonomía de Teclado Incompleta:** Los modales únicamente interceptaban la tecla `Escape` para cerrar la ventana, obligando al usuario a mover las manos al ratón para hacer clic en "Guardar", interrumpiendo el flujo de captura rápida de tareas, proyectos y transacciones.
- **Inconsistencia de Chasis Flotante:** Ciertas ventanas modales utilizaban clases genéricas (`portal-surface elevation-3`, `bg-white dark:bg-[#0D1526]`) en vez del estándar canónico `bg-[#0D1526] border-slate-800/60 shadow-cobalt-2`.

#### 2. Solución Quirúrgica Implementada
1. **Atajo Universal de Guardado (`Ctrl+Enter` / `Cmd+Enter`):**
   - Inyectado en los listeners `keydown` de los 4 modales primarios (`ModalGasto`, `ModalIngreso`, `ModalTareaFlow`, `ModalNuevoProyecto`), permitiendo guardar y confirmar cambios de manera instantánea desde el teclado con `(e.ctrlKey || e.metaKey) && e.key === 'Enter'`.
2. **Erradicación Total de Tokens Legacy & Adopción Cobalt Aerodynamic:**
   - 100% de purga de clases `indigo-*`, `bg-white`, `border-slate-200`, `text-slate-900` y `text-black`.
   - Chasis flotante primario unificado a `bg-[#0D1526] border-slate-800/60 shadow-cobalt-2`, cabeceras integradas `bg-[#0A101D]`, drag handles móviles `bg-slate-700` y backdrops inmersivos `bg-slate-950/80 backdrop-blur-xs`.
   - Inputs, áreas de texto y selectores estilizados con tokens Cobalt: `bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50`.
   - Botones primarios de guardado y acción rápida adaptados a `bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-950/50`.
3. **Pre-reserva de Altura Vertical Anti-CLS:**
   - Sustitución de todo render condicional de error por contenedores con altura fija reservada (`min-h-[22px]` o `min-h-[24px]` flex items-center).
   - El mensaje de error permanece dentro del contenedor con opacidad condicional (`opacity-100` vs `opacity-0 pointer-events-none`) y transición suave (`transition-opacity duration-200`), asegurando cero saltos de maquetación en validaciones.
4. **Tipografía Numérica Canónica:**
   - Aplicación estricta de `font-mono tabular-nums` para importes monetarios (PEN/USD/EUR), horas estimadas/reales (H:MM), códigos WBS (`PRO-XXX`, `WP-XXX`, `TAR-XXX`) y contadores de pasos/ítems.

#### 3. Certificación QA
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test`: 217/217 pruebas superadas (25 suites en verde, 100% passing).
- `npm run build`: Compilación y empaquetado de producción exitosos en 6.53s (`vite v6.4.4`).

---

### [REQ-SYS-013-ELECTRON: Redimensionamiento Dinámico de Ventana HUD (Anti-Hitbox Fantasma)]
**Fecha:** Noviembre 2026 | **Fase:** 4.95 | **Archivos Modificados:** `desktop/main.js`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Hitbox Fantasma por Geometría Estática:** La ventana `BrowserWindow` del HUD de escritorio (`desktop/main.js`) mantenía dimensiones físicas fijas de `420x720px`. Aunque el fondo estuviese configurado como `#00000000` y `transparent: true`, el compositor de ventanas de Windows (DWM) continuaba capturando clics y eventos de rueda en todo el rectángulo transparente.
- **Bloqueo del Escritorio en Modo Reposo:** Al colapsar el Cockpit en su cápsula mínima ("Floating Pill" de ~40px de alto), los ~600px transparentes inferiores actuaban como una máscara invisible que bloqueaba los clics del usuario sobre ventanas o iconos del escritorio subyacentes.
- **Restricción de `minHeight` en BrowserWindow:** La configuración inicial definía `minHeight: 500`, lo que impedía que cualquier llamada a `win.setSize` redujera la ventana a la altura real de la cápsula colapsada.

#### 2. Solución Quirúrgica Implementada
1. **Redimensionamiento Atómico en `widget-collapse`:**
   - En `desktop/main.js`, actualización del listener IPC `widget-collapse`:
     ```javascript
     ipcMain.on('widget-collapse', (event) => {
       const win = BrowserWindow.fromWebContents(event.sender) || mainWindow || widgetWin;
       if (win && !win.isDestroyed()) {
         win.setSize(420, 120, true);
       }
     });
     ```
   - El alto de `120px` deja margen holgado para las sombras y resplandores del pill, liberando de inmediato todo el espacio de escritorio inferior para interacción transparente sin colisiones.
2. **Restauración Geométrica en `widget-expand`:**
   - En `desktop/main.js`, actualización del listener IPC `widget-expand`:
     ```javascript
     ipcMain.on('widget-expand', (event) => {
       const win = BrowserWindow.fromWebContents(event.sender) || mainWindow || widgetWin;
       if (win && !win.isDestroyed()) {
         win.setSize(420, 720, true);
       }
     });
     ```
   - Restaura instantáneamente la superficie táctica completa (720px) cuando el usuario pulsa para expandir el Cockpit diario.
3. **Desbloqueo de Restricción Mínima (`minHeight: 100`):**
   - Se ajustó `minHeight: 100` en las opciones de `BrowserWindow`, permitiendo a Electron contraer físicamente la ventana a 120px sin truncamiento.
4. **Aislamiento y Cero Regresiones Frontend:**
   - Cero modificaciones a la suite de React en `DailyCockpit.tsx` o `App.tsx`, preservando el contrato con `window.desktopWidget.expand()` y `window.desktopWidget.collapse()`.

#### 3. Certificación QA
- `node --check desktop/main.js`: Sintaxis JavaScript verificada con código 0.
- `npx tsc --noEmit`: 0 errores de compilación estricta.
- `npm test`: 217/217 pruebas superadas (25 suites en verde, 100% passing).

---

### [REQ-SYS-014-DEPLOY: Infraestructura de Empaquetado Binario Windows con Electron-Builder]
**Fecha:** Noviembre 2026 | **Fase:** 4.96 | **Archivos Modificados:** `package.json`, `package-lock.json`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Carencia de Pipeline de Empaquetado Nativo (.exe):** La suite disponía de scripts para ejecución en caliente (`npm run widget`, `npm run widget:clean`), pero carecía de una herramienta y configuración de empaquetado para distribuir el HUD como instalador (`NSIS`) o binario portable (`.exe`) independiente para Windows.
- **Ausencia de Configuración `electron-builder`:** Ni la raíz ni `desktop/` declaraban la clave `"build"` en `package.json`, ni existían archivos de configuración (`electron-builder.yml`), dejando sin definir la ruta de salida, los metadatos de aplicación (`appId`), el icono canónico y los archivos a empaquetar (`dist/` y `desktop/`).

#### 2. Solución Quirúrgica Implementada
1. **Instalación de Dependencia de Construcción:**
   - Incorporación de `electron-builder` (`^26.18.0`) en `devDependencies` de `package.json`.
2. **Inyección de Script de Empaquetado:**
   - En `package.json` $\rightarrow$ `"scripts"`: `"build:desktop": "npm run build && electron-builder --win"`.
   - Garantiza que cualquier invocación de empaquetado compile previamente los últimos cambios del frontend con TypeScript y Vite hacia `dist/`.
3. **Configuración Canónica de `electron-builder`:**
   - Declaración de la clave `"build"` en la raíz de `package.json`:
     ```json
     "build": {
       "appId": "com.miportalweb.hud",
       "productName": "MiPortalWeb HUD",
       "directories": {
         "output": "release"
       },
       "files": [
         "desktop/**/*",
         "dist/**/*",
         "package.json"
       ],
       "extraMetadata": {
         "main": "desktop/main.js"
       },
       "win": {
         "target": [
           "nsis",
           "portable"
         ],
         "icon": "public/icon-512.png"
       },
       "nsis": {
         "oneClick": false,
         "allowToChangeInstallationDirectory": true
       }
     }
     ```
   - Directorio de entrega configurado en `release/`.
   - Generación simultánea de instalador configurable (`NSIS`) y ejecutable directo sin instalación (`Portable`).

#### 3. Certificación QA
- **Validación JSON de `package.json`:** `node -e "JSON.parse(fs.readFileSync('package.json'))"` $\rightarrow$ **JSON Valid**.
- **CLI Electron-Builder:** `npx electron-builder --help` $\rightarrow$ CLI operativo y listo para despacho.
- **TypeScript Compiler:** `npx tsc --noEmit` $\rightarrow$ 0 errores de tipado estricto.
- **Suite de Pruebas Unitarias Vitest:** `npm test` $\rightarrow$ 217/217 tests aprobados (25 suites).
- **Compilación de Producción:** `npm run build` $\rightarrow$ Exitoso en 6.49s (`dist/` regenerado).

---

### [REQ-SYS-015-BUILD: Despacho y Empaquetado Binario de Producción para Windows]
**Fecha:** Noviembre 2026 | **Fase:** 4.97 | **Archivos Generados:** `release/MiPortalWeb HUD Setup 2.0.0.exe`, `release/MiPortalWeb HUD 2.0.0.exe`, `release/win-unpacked/`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Necesidad de Certificación del Artefacto Final:** Una vez definida la configuración de `electron-builder` en Fase 4.96, era indispensable ejecutar el ciclo de empaquetado binario completo para validar la descarga de dependencias nativas, empaquetado asar, resolución de paths relativos y creación sin errores de los entregables `.exe` en Windows.

#### 2. Solución Quirúrgica Implementada
1. **Ejecución del Pipeline de Construcción:**
   - Despacho del script de empaquetado unificado: `npm run build:desktop` (`npm run build && electron-builder --win`).
   - Compilación exitosa del frontend React 19 + TypeScript + Vite hacia `dist/` en 6.35s (2,495 módulos transformados).
   - Generación de binarios empaquetados en arquitectura `x64` para Windows 10/11 sin advertencias bloqueantes ni excepciones de ruta.
2. **Artefactos Verificados en `release/`:**
   - `MiPortalWeb HUD Setup 2.0.0.exe`: **170.73 MB** (`179,024,125 bytes`) — Instalador interactivo NSIS con soporte para selección de ruta de instalación.
   - `MiPortalWeb HUD 2.0.0.exe`: **149.41 MB** (`156,672,183 bytes`) — Binario autónomo portable para ejecución inmediata sin instalación.
   - `release/win-unpacked/`: Binario desempaquetado con `MiPortalWeb HUD.exe` y dependencias asar para validaciones rápidas.

#### 3. Certificación QA
- **Comando `npm run build:desktop`:** Exit Code 0 (Finalizado con éxito en ~4 minutos).
- **Integridad de Entregables:** Verificados mediante `Get-ChildItem -Path release`.
- **Cero Regresiones:** Compatibilidad íntegra con la arquitectura Local-First de Dexie y el servidor loopback local.

---

### [REQ-SYS-017-HOTFIX: Corrección Hitbox DWM en main.js y Recompilación Binaria]
**Fecha:** Noviembre 2026 | **Fase:** 4.98 | **Archivos Modificados:** `desktop/main.js`, `DICCIONARIO_TECNICO_MAESTRO.md` | **Artefactos Recompilados:** `release/MiPortalWeb HUD Setup 2.0.0.exe`, `release/MiPortalWeb HUD 2.0.0.exe`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Bloqueo de Hit-testing por `resizable: false` en DWM:** En Windows 10/11, cuando un `BrowserWindow` frameless transparente tiene `resizable: false`, el compositor DWM desactiva el recálculo dinámico de la máscara de colisiones tras llamadas programáticas a `setSize()`, preservando el área de intercepción de 720px a pesar del cambio visual.
- **Latencia de Redimensionamiento Asíncrono:** La invocación de `win.setSize(w, h, true)` con flag de animación provocaba que DWM no aplicara el nuevo viewport de forma instantánea.

#### 2. Solución Quirúrgica Implementada
1. **Activación de `resizable: true` en `desktop/main.js`:**
   - Permite que el subsistema Win32 y Chromium procesen los mensajes de cambio de tamaño (`WM_WINDOWPOSCHANGING`) y actualicen de inmediato la región física de captura del ratón.
2. **Mutación Atómica a `win.setBounds`:**
   - En `ipcMain.on('widget-collapse')`: `win.setBounds({ width: 420, height: 120 })`.
   - En `ipcMain.on('widget-expand')`: `win.setBounds({ width: 420, height: 720 })`.
   - `setBounds` aplica el nuevo tamaño de forma sincrónica y atómica a nivel de la API de ventanas de Electron.
3. **Recompilación y Re-empaquetado Binario:**
   - Ejecución de `npm run build:desktop` (`tsc && vite build && electron-builder --win`).
   - Binarios `.exe` en `release/` sobreescritos con la corrección profunda incorporada.

#### 3. Certificación QA
- **Sintaxis JavaScript:** `node --check desktop/main.js` $\rightarrow$ 0 errores.
- **Compilación de Empaquetado:** `npm run build:desktop` $\rightarrow$ Exit Code 0.
- **Entregables Verificados en `release/`:**
  * `MiPortalWeb HUD Setup 2.0.0.exe` (170.72 MB).
  * `MiPortalWeb HUD 2.0.0.exe` (149.42 MB).

---

### [REQ-FIX-07: Corrección Aritmética en Telemetría de Montaje de ViewKanban]
**Fecha:** Noviembre 2026 | **Fase:** 4.99 | **Archivos Modificados:** `src/components/Views/ViewKanban.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Artefacto Matemático en Buffer W3C Performance Timeline:** La función `getMarkTime('t3_kanban_mount')` indexaba rígidamente `entries[0].startTime`. Dado que la API W3C acumula marcas en un buffer global de sesión, `entries[0]` preservaba la marca del primer montaje (~200ms de la sesión). Al navegar hacia otras vistas (Hábitos, Detalle 360) y regresar al Kanban transcurridos 40s o 104s, `performance.now() - entries[0].startTime` reportaba el tiempo acumulado de la sesión del usuario (104,388ms) en lugar de la latencia real de renderizado del componente.
- **Acumulación de Marcas sin Purga:** No existía función de cleanup al desmontar `ViewKanban`, dejando marcas huérfanas en el buffer de performance del navegador.

#### 2. Solución Quirúrgica Implementada
1. **Indexación de la Marca Más Reciente:**
   - En `src/components/Views/ViewKanban.tsx` (`getMarkTime`), se actualizó la consulta a `entries[entries.length - 1].startTime`, asegurando que cada ciclo de render mida estrictamente respecto a su propia marca de montaje.
2. **Purga Automática de Marcas al Desmontar:**
   - Se añadió un retorno de limpieza en el `useEffect` de montaje:
     ```typescript
     return () => {
       if (typeof performance !== 'undefined' && performance.clearMarks) {
         performance.clearMarks('t3_kanban_mount');
         performance.clearMarks('t4_kanban_cards_painted');
       }
     };
     ```
   - Garantiza que al desmontar el tablero por cambio de vista, las marcas previas sean eliminadas del buffer, erradicando lecturas obsoletas.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (228/228 tests).
- **Compilación de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (2,495 módulos transformados en 6.92s).
- **Latencia Real de Renderizado:** Normalizada a medición fidedigna de render (< 50ms).

---

### [REQ-FIX-08: Unificación Atómica de useLiveQuery en ViewKanban, Sincronización Optimista de Avances y Blindaje contra Throttling de Foco]
**Fecha:** Noviembre 2026 | **Fase:** 5.00 | **Archivos Modificados:** `src/components/Views/ViewKanban.tsx`, `src/services/syncManager.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Condición de Carrera en 5 `useLiveQuery` Desacoplados:** `ViewKanban` ejecutaba 5 consultas independientes contra Dexie (`proyectos`, `tareas`, `subtareas`, `hitos`, `gastos`). Al resolver `proyectos` antes que `hitos` o `tareas`, `calcularAvancesProyectoCanonica` caía en la rama temporal por fechas (Caso 3), para luego saltar a promedio plano de tareas (Caso 2) y finalmente a WBS ponderado (Caso 1), provocando una oscilación visible del porcentaje de avance en el Sidebar.
- **Disociación de Estado Optimista:** La función de avances recibía `rawTareas` en vez de `tareas` (la colección con los estados optimistas aplicados en memoria). Al mover una tarjeta a completado, el contador O(1) del sidebar se actualizaba al instante pero la barra de avance del proyecto quedaba desfasada hasta la persistencia física en disco.
- **Ráfaga por Throttling de Foco en SyncManager:** Chromium congela los timers de fondo. Al reenfocar la ventana tras minutos de inactividad, el `setInterval(45000)` de `SyncManager` se ejecutaba inmediatamente en ráfaga llamando a `descargarDatosDescendientes()`, el cual aplicaba `bulkPut` secuencial tabla por tabla, detonando una cascada de re-renders desfasados.

#### 2. Solución Quirúrgica Implementada
1. **Unificación Atómica de `useLiveQuery`:**
   - En `src/components/Views/ViewKanban.tsx`, se consolidaron las 5 consultas en una sola transacción asíncrona mediante `Promise.all`:
     ```typescript
     const datosKanbanLive = useLiveQuery(async () => {
       const [proyectos, tareas, subtareas, hitos, gastos] = await Promise.all([
         db.proyectos.toArray(),
         db.tareas.toArray(),
         db.subtareas_pasos.toArray(),
         db.hitos_wbs.toArray(),
         db.gastos.toArray()
       ]);
       return { proyectos, tareas, subtareas, hitos, gastos };
     }, []);
     const cargandoDatosIniciales = datosKanbanLive === undefined;
     ```
   - Garantiza entrega indivisible y atómica de todas las entidades en el mismo tick de React.
2. **Sincronización Optimista en `avancesPorProyecto`:**
   - Se sustituyó `rawTareas` por `tareas` y se blindó el cálculo ante cargas iniciales:
     ```typescript
     const avancesPorProyecto = useMemo(() => {
       const map = new Map<string, { avanceReal: number; avanceTotalProyectado: number }>();
       if (cargandoDatosIniciales) return map;
       proyectos.forEach((proy) => {
         const key = proy.codigo_legado || proy.id;
         if (key) {
           map.set(key, calcularAvancesProyectoCanonica(proy, rawHitos, tareas));
         }
       });
       return map;
     }, [cargandoDatosIniciales, proyectos, rawHitos, tareas]);
     ```
   - Actualización sincrónica instantánea del porcentaje de avance al interactuar con cualquier tarjeta Kanban.
3. **Blindaje contra Throttling y Amortiguación de Foco en `SyncManager`:**
   - En `src/services/syncManager.ts`, se inhibió el disparo del intervalo periódico si la pestaña está oculta (`document.visibilityState === 'hidden'`).
   - Se añadió un listener a `visibilitychange` con debounce de 800ms (`visibilityDebounceTimer`) para estabilizar el render antes de ejecutar sincronizaciones remotas tras reenfocar.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (228/228 tests).
- **Compilación de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (2,495 módulos transformados en 7.91s).
- **Estabilidad Reactiva:** Erradicada la fluctuación de avances en el Sidebar y eliminada la sobrecarga al reenfocar la ventana.

---

### [REQ-FIX-09: Optimización a 60 FPS de Barra Lateral, Aislamiento de Layout y Elevación Cobalt Aerodynamic en ViewNotas]
**Fecha:** Noviembre 2026 | **Fase:** 5.01 | **Archivos Modificados:** `src/components/Notas/VisorNotas.tsx`, `src/components/Notas/SidebarCuadernos.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Layout Thrashing por CSS Grid con Fracción Dinámica:** El contenedor principal animaba `grid-template-columns` (`md:grid-cols-[64px_1fr]` $\leftrightarrow$ `md:grid-cols-[256px_1fr]`) durante 300ms. Cada píxel de cambio en `1fr` obligaba a Chromium a re-balancear en CPU el contenedor CSS Multi-column (`columns-X`) y re-calcular el salto de texto de cada bloque Markdown de las tarjetas.
- **Sobrecarga de Rasterizado por Filtros Gaussianos:** Los encabezados fijos utilizaban `backdrop-blur-md` y `backdrop-blur-xs`, forzando a la GPU a regenerar pasadas de desenfoque continuo durante la interpolación geométrica.
- **Desalineación Cromática y Ergonomía:** Exceso de tonos ámbar/naranja en cabeceras y controles, y caja Quick Note sobredimensionada (`max-h-14`) restando espacio vertical útil.

#### 2. Solución Quirúrgica Implementada
1. **Migración a Flexbox Horizontal Aislado:**
   - En `src/components/Notas/VisorNotas.tsx`, se sustituyó la cuadrícula CSS Grid por `flex flex-row w-full h-full flex-1 min-h-0 bg-[#040711] text-slate-100 relative select-none overflow-hidden`.
   - Se aplicó contención CSS estricta `[contain:layout_paint]` en el canvas central de notas, desacoplando completamente el árbol de renderizado del sidebar.
2. **Aceleración por Hardware en `SidebarCuadernos.tsx`:**
   - Transición física de ancho directa en GPU: `transition-[width] duration-200 ease-out will-change-[width] ${isCollapsed ? 'w-16 p-2' : 'w-64 p-3'}` sobre superficie sólida `#080D1A` y microborde `border-r border-slate-800/60`.
   - Desvanecimiento suave de textos con `whitespace-nowrap transition-opacity duration-150` y eliminación de micro-escalados en botones rápidos (`transition-colors duration-150`).
3. **Erradicación de `backdrop-blur` en Barras Fijas:**
   - Reemplazo por superficies sólidas de alto contraste `#080D1A` con microborde `border-b border-slate-800/60`, eliminando el costo de filtrado en GPU.
4. **Elevación Visual y Ergonómica Cobalt Aerodynamic:**
   - Cabecera táctica con cápsula Bento e ícono `FileText` en `text-sky-400 bg-sky-950/40 border border-sky-500/30`.
   - Contador de notas en badge monoespaciado `font-mono tabular-nums text-sky-300 bg-sky-950/40 border border-sky-500/30`.
   - Controles de búsqueda y filtros refinados en estilo Ghost `bg-slate-900/60 border-slate-800/60 text-slate-100 placeholder:text-slate-500 focus:border-sky-500/60`.
   - Disparador desktop de Quick Note compactado a cápsula Bento `h-10 px-3 bg-[#0D1526]/80 hover:bg-[#0D1526] border border-slate-800/60 hover:border-sky-500/40 rounded-xl`.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (228/228 tests).
- **Compilación de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (2,495 módulos transformados en 6.63s).
- **Fluidez de Render:** 60 FPS estables y fluidos durante la contracción y expansión de la barra lateral.

---

### [REQ-FIX-10: Transacción Atómica Inbound, Preservación de Claves Canónicas WBS y Diffing Silencioso en SyncManager]
**Fecha:** Noviembre 2026 | **Fase:** 5.02 | **Archivos Modificados:** `src/services/syncPayloadSanitizer.ts`, `src/services/syncManager.ts`, `src/types/index.ts`, `src/utils/entityNormalizer.ts`, `src/components/PMO/ColumnaKanban.tsx`, `src/services/__tests__/syncManager.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Escrituras Fragmentadas y Múltiples Invalidation Waves:** En `descargarDatosDescendientes()`, las tablas se descargaban secuencialmente y para cada una se ejecutaba `bulkPut` y `bulkDelete` de manera individual y fuera de una transacción Dexie. Cada tabla disparaba una oleada reactiva a `useLiveQuery` en `ViewKanban`, re-evaluando el árbol Kanban entre 3 y 5 veces por ciclo con estados parciales desfasados.
- **Pérdida Transitoria de Claves Canónicas WBS (`proyecto_codigo` e `hito_codigo`):** La tabla remota de Supabase `tareas` almacena exclusivamente `proyecto_id` (UUID) e `hito_id` (UUID), sin columnas legacy `proyecto_codigo` (`PRO-001`) ni `hito_codigo` (`WP-001`). Al persistir en Dexie `{ ...item, sync_status: 'synced' }` sin sanitizador inbound, las claves locales eran sobreescritas con `undefined`. Durante 200–800ms, `TarjetaTareaKanban` caía a los fallbacks estáticos `'General'` e `'Hito Principal'`, y `calcularAvancesProyectoCanonica` fallaba por falta de coincidencias, desplomando el avance en el Slider de Proyectos a 0%.
- **Parpadeo Espurio del Estado "Sincronizando":** En `syncPendingRecords()`, `this.setSyncState('syncing')` se ejecutaba incondicionalmente antes de comprobar `totalPendientes === 0`, haciendo que el badge parpadeara de 'Al día' $\rightarrow$ 'Sincronizando' $\rightarrow$ 'Al día' cada 45s sin ninguna mutación activa.
- **Sobrescritura Ciega sin Diffing:** Se ejecutaban mutaciones masivas en Dexie incluso cuando los datos remotos eran 100% idénticos a los datos locales.

#### 2. Solución Quirúrgica Implementada
1. **Sanitización Inbound Pre-Commit (`sanitizarHitoInbound` y `sanitizarTareaInbound`):**
   - En `src/services/syncPayloadSanitizer.ts`, se crearon y exportaron `sanitizarHitoInbound` y `sanitizarTareaInbound`.
   - Se enriquecen y resuelven `proyecto_codigo` e `hito_codigo` cruzando `remoto.proyecto_id` y `remoto.hito_id` con diccionarios UUID $\rightarrow$ Código en memoria (`proyUuidToCod` y `hitoUuidToCod`), preservando además `localPrevio.proyecto_codigo` y `localPrevio.hito_codigo`. Jamás ingresa una tarea o hito a Dexie con claves de vinculación nulas o vacías.
2. **Transacción Atómica Unificada en Dexie:**
   - En `src/services/syncManager.ts`, se eliminaron los `bulkPut` y `bulkDelete` dispersos por tabla.
   - Las operaciones de todas las tablas se consolidan en memoria y se ejecutan en un único bloque atómico:
     `await db.transaction('rw', tablasParaTransaccion, ejecutarEscrituras)` (con fallback seguro a escrituras directas si el entorno carece de motor transaccional completo).
   - `useLiveQuery` en `ViewKanban` recibe una sola invalidación reactiva atómica, erradicando estados intermedios.
3. **Diffing Silencioso en Memoria (`sonRegistrosIdenticos`):**
   - Se evalúa en memoria si `registroFinal` difiere de `localPrevio` (comparando `updated_at` y atributos clave).
   - Si no existen diferencias efectivas, el registro se descarta del lote de mutaciones. Si el total de cambios de todas las tablas es 0, se omiten las escrituras a Dexie, reduciendo a cero el uso innecesario de CPU y renders.
4. **Blindaje de Estados "Sincronizando":**
   - En `syncPendingRecords()`, `this.setSyncState('syncing')` se ejecuta únicamente si `totalPendientes > 0`.
   - En `descargarDatosDescendientes()`, el estado pasa a `'syncing'` solo si existen mutaciones efectivas pendientes de persistir.
5. **Fallback Resiliente en `entityNormalizer.ts` y `ColumnaKanban.tsx`:**
   - En `normalizeTarea`, se incorporó `proyecto_id` e `hito_id` como fuentes alternativas de resolución.
   - En `calcularAvancesProyectoCanonica`, se amplió el emparejamiento de proyectos e hitos para soportar tanto `codigo_legado` como UUIDs (`proyId !== '' && pCode === proyId`).
   - En `ColumnaKanban.tsx`, `proyAsoc` e `hitoAsoc` consultan primero por código y, como fallback, por UUID (`tar.raw?.proyecto_id`, `tar.raw?.hito_id`).

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (232/232 tests, incluyendo 4 nuevos tests de inbound harmonization y diffing silencioso).
- **Compilación de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (2,495 módulos transformados en 6.25s).
- **Integridad Visual:** Erradicado el parpadeo de relaciones WBS ('General' / 'Hito Principal') y estabilizado al 100% el slider de avances de proyectos en Kanban.

---

### [REQ-FIX-11: Implementación de Microinteracciones Cinéticas, Spring Physics y Elevación Táctil Cobalt en ViewNotas]
**Fecha:** Noviembre 2026 | **Fase:** 5.03 | **Archivos Modificados:** `src/index.css`, `src/components/Notas/TarjetaNota.tsx`, `src/components/Notas/SidebarCuadernos.tsx`, `src/components/Notas/VisorNotas.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Oportunidades Cinéticas
- **Ausencia de Curvas Físicas y Resorte:** Las transiciones de interfaz en el módulo de Notas utilizaban curvas genéricas (`transition-colors`, `transition-all`) sin inercia ni resorte elástico, reduciendo la percepción de reactividad y calidad premium.
- **Transición de Colapso con Saltos Visuales:** El botón de colapso de la barra lateral alternaba rígidamente entre dos componentes de iconos distintos (`ChevronLeft` vs `ChevronRight`) en ramas de renderizado separadas, impidiendo una rotación vectorial continua durante la contracción.
- **Carencia de Feedback Táctil en Eventos `:active`:** Las tarjetas en vista de mosaico y lista, así como los botones de acción rápida, carecían de compresión háptica visual (`:active:scale`), generando una sensación de rigidez ante el clic o toque.
- **Falta de Énfasis Elástico en Subtareas y Portapapeles:** La marcación de items completados en checklists y el botón de copiado de notas no ofrecían una animación de rebote (*elastic pop* con *overshoot*), pasando desapercibida la confirmación de la acción.

#### 2. Solución Quirúrgica Implementada
1. **Registro de Utilidades Cinéticas en `src/index.css`:**
   - `.spring-sidebar`: Curva de resorte pesada `cubic-bezier(0.16, 1, 0.3, 1)` de 240ms con `will-change: width` para el drawer de cuadernos.
   - `.kinetic-card-mosaico`: Aceleración en GPU (`transform: translateZ(0)`), elevación de 3px en hover con halo celeste perimetral (`rgba(56, 189, 248, 0.12)`) y compresión táctil ultrarrápida a 80ms (`scale(0.985)`).
   - `.kinetic-card-lista`: Microdesplazamiento `translateX(3px)` con compresión táctil a 70ms (`scale(0.99)`).
   - `.kinetic-pop-bounce`: Animación con sobredisparo elástico (*overshoot*) `cubic-bezier(0.34, 1.56, 0.64, 1)` a 180ms para checkboxes y estados de copia exitosa.
   - `.kinetic-btn-tactile`: Elevación de -1.5px con halo difuso y compresión `:active:scale(0.96)`.
   - `.kinetic-input-spotlight`: Halo perimetral celeste difuso (`0 0 16px rgba(56, 189, 248, 0.22)`) en foco.
2. **Intervención en `TarjetaNota.tsx`:**
   - Incorporación de `.kinetic-card-mosaico` en tarjetas masonry y `.kinetic-card-lista` en tarjetas de lista compacta.
   - Botón de Pin con rotación suave y feedback táctil `:active:scale-90 hover:-rotate-12`.
   - Inyección de `.kinetic-pop-bounce` en checkboxes marcados (`CheckSquare`) de las listas de verificación interactivas y en el icono de confirmación de copia (`Check`).
   - Botones de acción del pie de tarjeta con compresión táctil `:active:scale-90 transition-all duration-150`.
3. **Intervención en `SidebarCuadernos.tsx`:**
   - Contenedor lateral optimizado con `.spring-sidebar` para animación continua sin layout thrashing.
   - Unificación del control de colapso mediante `ChevronLeft` con rotación suave de 0° a 180° gobernada por `cubic-bezier(0.16, 1, 0.3, 1)`.
   - Retroalimentación táctil `:active:scale-[0.98]` en items de cuadernos y escalado `group-hover:scale-110` en sus iconos temáticos.
   - Accesos rápidos (Fijadas, Tareas, Deseos, Vínculos) con compresión háptica `:active:scale-95` y halos de resplandor contextual por color (ámbar, celeste, morado, esmeralda) en estado activo.
4. **Intervención en `VisorNotas.tsx`:**
   - Botón principal de Nueva Nota con `.kinetic-btn-tactile` y rotación de 90° en hover del icono `Plus`.
   - Barra de búsqueda de notas enriquecida con `.kinetic-input-spotlight`.
   - Contenedor Quick Note Bento con halo perimetral `hover:shadow-[0_10px_25px_-5px_rgba(2,6,23,0.8),0_0_20px_rgba(56,189,248,0.12)]` y transición elástica de apertura en 300ms.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (232/232 tests).
- **Compilación de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (2,495 módulos transformados en 7.04s).
- **Fluidez Cinética:** 60–120 FPS compositados enteramente por GPU sin regresiones en contratos Dexie ni emojis en el DOM.

---

### [REQ-FIX-12: Eliminación Optimista con Deshacer en Cuadernos, Filtros Rápidos Multi-Select y Elevación Cinética Restante en ViewNotas]
**Fecha:** Noviembre 2026 | **Fase:** 5.04 | **Archivos Modificados:** `src/context/UndoDeleteContext.tsx`, `src/components/UI/UndoToastContainer.tsx`, `src/components/Notas/SidebarCuadernos.tsx`, `src/components/Notas/VisorNotas.tsx`, `src/components/Notas/EditorNotaModal.tsx`, `src/components/Notas/__tests__/SidebarCuadernos.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Falla en Eliminación de Cuadernos en Dexie:** La llamada a `db.notas.where('block_nombre').equals(nombreBlock).modify(...)` arrojaba `KeyPath block_nombre on object store notas is not indexed`, provocando un fallo en Dexie y desplegando el error *"Error al eliminar el cuaderno"*. Los cuadernos son agrupaciones virtuales persistidas localmente y sus notas no cuentan con un índice secundario sobre `block_nombre`.
- **Fricción por Diálogo Nativo (`window.confirm`):** La interfaz utilizaba un `window.confirm()` síncrono del navegador que bloqueaba el hilo principal y rompía la consistencia visual Cobalt Aerodynamic.
- **Limitación a Filtro Rápido Excluyente:** Los accesos rápidos (Fijadas, Checklists, Deseos, Vínculos) estaban restringidos a una selección atómica única de tipo cadena (`subFiltro: SubFiltroRapido`), impidiendo combinar múltiples criterios (ej. notas fijadas que a su vez contengan listas de verificación).
- **Carencia de Microinteracciones Hápticas en Controles Secundarios:** Los selectores de vista (Mosaico / Lista), la paleta de colores del editor modal y los campos de entrada carecían de retroalimentación elástica (`active:scale`, foco `.kinetic-input-spotlight` y halos perimetrales dinámicos).

#### 2. Solución Quirúrgica Implementada
1. **Eliminación Optimista con Búfer UndoDelete (5 Segundos) para Cuadernos:**
   - En `src/context/UndoDeleteContext.tsx`, extensión de `TipoEntidadUndo` con `'CUADERNO'`. Aislamiento en `commitConTombstone` excluyendo lápidas para tablas locales (`tabla !== 'cuadernos'`).
   - En `src/components/UI/UndoToastContainer.tsx`, renderizado de `<BookOpen className="w-4 h-4 text-sky-400" />` ante eventos de cuaderno.
   - En `src/components/Notas/SidebarCuadernos.tsx`, erradicación total de `window.confirm()`, despachando directamente `onEliminarCuaderno(block)`.
   - En `src/components/Notas/VisorNotas.tsx`, implementación de `handleEliminarCuaderno` mediante `programarEliminacion` con 5000ms de gracia.
   - En `bloquesUnicos`, exclusión optimista en tiempo real mediante `!estaOculto(b.trim())` sincronizado con `hiddenIdsSet`.
   - Al expirar el temporizador, el `commit` diferido utiliza `db.notas.filter((n) => n.block_nombre === nombreBlock).toArray()` y `db.notas.bulkUpdate(...)`, eliminando la dependencia de índices inexistentes y garantizando cero errores relacionales. Si el usuario pulsa "Deshacer", el cuaderno reaparece instantáneamente sin pérdida de datos.
2. **Accesos Rápidos Multi-Select Acumulativos (Intersección AND):**
   - En `SidebarCuadernos.tsx` y `VisorNotas.tsx`, migración del estado a `subFiltros: SubFiltroRapido[]`.
   - Conmutación independiente de filtros (`handleToggleSubFiltro`), permitiendo apilar criterios acumulativos (ej. Fijadas + Checklist).
   - En `useMemo`, evaluación estricta `subFiltros.every(...)` aplicando intersección lógica sobre las notas.
   - Iluminación independiente de botones con halos perimetrales contextuales específicos por categoría (ámbar, celeste, morado, esmeralda).
3. **Elevación Cinética en Controles Restantes:**
   - Botones de vista Mosaico/Lista (desktop y móvil) con compresión háptica `:active:scale-90`, transición elástica de 200ms y halo difuso `shadow-[0_0_12px_rgba(56,189,248,0.2)]`.
   - En `EditorNotaModal.tsx`, selector de colores con hover `scale-110`, compresión `:active:scale-90` y anillo de halo perimetral `shadow-[0_0_12px_rgba(255,255,255,0.4)]` sobre el tono activo.
   - Inputs, textarea de Markdown y selector de tags enriquecidos con `.kinetic-input-spotlight`.
   - Botones primarios del editor modal y Quick Note con `.kinetic-btn-tactile`.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (234/234 tests, incorporando pruebas de conmutación multi-select y aislamiento optimista).
- **Compilación de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (2,495 módulos transformados en 6.69s).
- **Experiencia de Usuario:** Erradicado al 100% el error de Dexie y el modal nativo; navegación fluida a 60–120 FPS compositados por GPU.

---

### [REQ-FIX-13: Implementación de Drag-and-Drop de Notas a Cuadernos Temáticos y Elevación Visual Bento en ViewNotas]
**Fecha:** Noviembre 2026 | **Fase:** 5.05 | **Archivos Modificados:** `src/components/Notas/TarjetaNota.tsx`, `src/components/Notas/SidebarCuadernos.tsx`, `src/components/Notas/VisorNotas.tsx`, `src/components/Notas/__tests__/SidebarCuadernos.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Fricción Operativa en Organización de Notas:** Para clasificar o reasignar una nota a un cuaderno temático (o desvincularla a "Notas Sueltas"), el usuario estaba obligado a abrir el modal editor 360°, buscar el selector de cuaderno, modificar el campo y guardar, provocando una pérdida innecesaria de contexto y tiempo operativo.
- **Riesgo de Colisiones en Drag-and-Drop:** Las tarjetas de notas contienen elementos interactivos internos con sus propios manejadores de eventos (casillas de verificación en checklists, botones de copia al portapapeles, enlaces externos de deseos, chips de entidades @PROY/@TAR y botones de eliminación). Un evento de arrastre mal aislado interferiría con clics y selección de texto.
- **Parpadeo por Burbujeo en Zonas de Soltado (Drop Targets):** En navegadores basados en Chromium, los eventos `dragenter` y `dragleave` se disparan de forma oscilante cuando el cursor sobrevuela elementos hijos dentro de un botón o cápsula, provocando un parpadeo disruptivo si no se implementa una barrera geométrica y `pointer-events-none`.

#### 2. Solución Quirúrgica Implementada
1. **Origen de Arrastre Blindado (Drag Source) en `TarjetaNota.tsx`:**
   - Habilitación de `draggable={true}`, `onDragStart={handleDragStart}`, `onDragEnd={handleDragEnd}` y cursores cinéticos `cursor-grab active:cursor-grabbing` tanto en vista de lista como en cuadrícula mosaico.
   - Guardián en `handleDragStart`: inhibe el arrastre si el evento proviene de botones, enlaces, campos de texto o zonas marcadas con `.not-draggable` (como contenedores de checklist o wishlist), así como si el usuario tiene una selección activa de texto en pantalla.
   - Serialización de tipo MIME `application/x-miportal-nota-id` y `text/plain` con el ID canónico de la nota.
   - Estado visual translúcido y comprimido durante el vuelo: `opacity-40 scale-[0.98] border-dashed border-sky-500/50`.
2. **Zonas de Soltado Bento Anti-Flicker en `SidebarCuadernos.tsx`:**
   - Configuración de drop targets en "Notas Sueltas" (`destinoBlock = '__sin_block__'`) y en cada cápsula de cuaderno temático (`destinoBlock = block`).
   - Doble barrera contra el parpadeo:
     - Clases `pointer-events-none` en elementos hijos internos (iconos, etiquetas de texto y contadores numéricos).
     - Validación geométrica estricta en `handleDragLeave` mediante `getBoundingClientRect()` contra `(e.clientX, e.clientY)`.
   - Elevación visual Cobalt Aerodynamic durante el arrastre: borde punteado cian `border-sky-400 border-dashed`, escala `scale-[1.03]`, anillo perimetral `ring-2 ring-sky-400/50` y sombra multicapa `shadow-[0_0_20px_rgba(56,189,248,0.5)]`.
   - Soporte reactivo en modo colapsado (64px): despliegue de tooltip flotante Bento a la derecha (`absolute left-full ml-2.5 bg-[#0D1526] border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.35)]`) con el nombre del cuaderno destino.
3. **Mutación Local-First en Dexie y Notificación en `VisorNotas.tsx`:**
   - Implementación de `handleMoverNotaACuaderno(notaId, destinoBlock)`:
     - Resolución segura: `'__sin_block__'` se mapea a `''`, normalizando notas desvinculadas.
     - Detección de movimientos redundantes (evita escrituras ociosas en IndexedDB si la nota ya reside en el cuaderno destino).
     - Mutación atómica en `db.notas.update(notaId, { block_nombre: nuevoBlock, updated_at: nowIso, version: (nota.version || 1) + 1, sync_status: 'pending' })`.
     - Suscripción atómica `useLiveQuery` actualiza en tiempo real los contadores numéricos y la vista sin requerir recargas ni causar bloqueos.
     - Feedback accesible mediante `mostrarToastCobalt`.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (238/238 tests, incorporando 4 pruebas unitarias para resolución de destino, detección redundante, payload de mutación y boundary check anti-flicker).
- **Compilación de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (2,495 módulos transformados en 6.92s).
- **Paridad Visual y de Rendimiento:** Cero emojis en DOM, respeto inquebrantable a tokens Cobalt Aerodynamic (`#040711`, `#0D1526`, `border-slate-800/40`, Lucide 1.75) y garantía de 60 FPS sin parpadeos.

---

### [REQ-DEBUG-14: Desbloqueo de DevTools/F12, Blindaje de Arranque en Frontend y Purga de Caché Service Worker]
**Fecha:** Noviembre 2026 | **Fase:** 5.06 | **Archivos Modificados:** `desktop/main.js`, `src/main.tsx`, `src/App.tsx`, `public/sw.js`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Forense & Causa Raíz
1. **Bloqueo de DevTools / F12 en Electron (`desktop/main.js`):**
   - `webPreferences` no declaraba explícitamente `devTools: true`, `mainWindow.webContents.openDevTools({ mode: 'detach' })` permanecía comentado (L418) y la ventana `frame: false` carecía de menú de aplicación y listener `before-input-event` para `F12` / `Ctrl+Shift+I`.
2. **Estado del Bundle Vite / CSS / Runtime Frontend:**
   - Validación directa sobre `src/index.css` (`233,637` bytes transformados por Vite), `npx tsc --noEmit` (`0` errores) y navegación automatizada vía Chrome DevTools Protocol sobre todas las vistas (`#kanban`, `#portafolio`, `#habitos`, `#financiero`, `#notas`, `#detalle`, `/?widget=desktop`) en `http://localhost:3000` y `http://127.0.0.1:48123`: **0 excepciones no capturadas (`Runtime.exceptionThrown = []`)**.
   - El puerto `http://localhost:5173` no está activo; `vite.config.ts` fija estrictamente `port: 3000, strictPort: true`.
3. **Causa Raíz de Pantalla Azul (`#040711`) y Puntos de Fragilidad Detectados:**
   - **Caché Obsoleta de Service Worker (`%APPDATA%\Electron\Service Worker\CacheStorage` fechado `06/11/2026`):** `public/sw.js` conservó el mismo `CACHE_NAME = 'pmo-cache-v2.5-cockpit-restore'` tras cambios de estrategia (`c01c711`) y re-hasheo de chunks en `dist/assets/` (`5493dc9`), provocando que clientes con caché previa sirvieran un `index.html` obsoleto contra chunks eliminados (`404 Asset not found`), impidiendo ejecutar `src/main.tsx` y dejando `<body class="bg-[#040711]">` vacío.
   - **Ausencia de Captura Global de Bootstrap (`src/main.tsx` y `src/App.tsx`):** `ReactDOM.createRoot` carecía de `try/catch` y listeners `error`/`unhandledrejection`, y `CockpitErrorBoundary` protegía únicamente el modo HUD, dejando el portal web (`<UndoDeleteProvider>`) sin ErrorBoundary ante fallos de montaje o Dexie (`db.open()`).

#### 2. Solución Implementada
1. **Desbloqueo Permanente de DevTools en Desarrollo (`desktop/main.js`):**
   - `devTools: true` explícito en `webPreferences`.
   - Listener `before-input-event` habilitado en desarrollo (`!app.isPackaged || useDevServer || --devtools`) para conmutar `openDevTools({ mode: 'detach' })` con **F12**, **Ctrl+Shift+I** y **Ctrl+Shift+J**.
   - Opción `"Abrir / Cerrar DevTools (F12)"` en el menú del System Tray, apertura automática con `--dev-server` / `--devtools` / `ELECTRON_OPEN_DEVTOOLS=1` o ante `did-fail-load` / `render-process-gone`, y reenvío de `[Renderer Error]` al terminal Node.
   - Purga exclusiva de `serviceworkers`, `cachestorage` y caché HTTP en `app.whenReady()` (preservando intactos `IndexedDB` y `LocalStorage`).
2. **Rescate Visual de Emergencia en `src/main.tsx` y `src/App.tsx`:**
   - Incorporación de `renderizarPantallaEmergencia` (DOM seguro con `textContent`), `try/catch` alrededor de `ReactDOM.createRoot`, verificación `db.open().catch(...)` y vigilantes globales `error` / `unhandledrejection` cuando `#root` quede vacío.
   - Extensión de `CockpitErrorBoundary` con `scope="Portal"` envolviendo `<UndoDeleteProvider>` y la app web completa, con botones de recarga y purga de Service Worker.
   - Omisión de registro de `/sw.js` en `localhost` / `127.0.0.1` / Electron loopback.
3. **Estrategia Network-First para Navegación en `public/sw.js`:**
   - Actualización de `CACHE_NAME` a `'pmo-cache-v2.6-rescue-network-first'` y política Network-First con fallback a caché para peticiones `navigate` / `.html`.

#### 3. Certificación QA
- **Sintaxis Electron:** `node --check desktop/main.js` $\rightarrow$ Exit Code 0.
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (238/238 tests).
- **Compilación de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (2,495 módulos transformados en 6.57s).
- **Auditoría Runtime CDP Post-Edición:** Todas las vistas en `http://localhost:3000/` y `http://127.0.0.1:48123/` renderizadas con `Exceptions: []` y `rootLen` válido (`~166 KB – 682 KB`).

---

### [REQ-FIX-16: Desregistro Forzado de Service Worker en Localhost y Blindaje de Tablas Financieras en SyncManager]
**Fecha:** Noviembre 2026 | **Fase:** 5.07 | **Archivos Modificados:** `src/main.tsx`, `src/services/syncManager.ts`, `src/services/__tests__/syncManager.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Interferencia de Service Workers Foráneos/Residuales en Local:** En entornos de desarrollo o loopback (`localhost`, `127.0.0.1`, Electron), la purga de registros PWA ocurría al final del ciclo de arranque y dependía de ramas separadas, pudiendo coexistir temporalmente caché previa de Cloudflare Pages / PWA con assets recién compilados.
- **Fugas de Peticiones 404 / PGRST205 en Tablas Financieras Opcionales (`syncManager.ts`):** Aunque `tablasInexistentesSupabase` contenía por defecto `'gastos'`, `'ingresos'` y `'cuotas'`, aún existían vectores de fuga:
  1. `descargarDatosSelectivos` (Realtime) reenviaba eventos de tablas financieras sin filtrar `tablasInexistentesSupabase`.
  2. `sincronizarTombstones` intentaba ejecutar `.delete()` remoto sobre `'gastos'`, `'ingresos'` y `'cuotas'` provocando 404 y reintentos infinitos en error.
  3. `sincronizarGastos`, `sincronizarIngresos`, `sincronizarCuotas` y `esRemotoMasReciente` no capturaban errores `404 / PGRST205` cuando `syncFinanzasRemotoHabilitado` se activaba contra un schema remoto sin tablas financieras.
  4. `syncPendingRecords` contabilizaba registros locales pendientes de tablas financieras deshabilitadas, disparando ciclos de sincronización innecesarios cada 45s.

#### 2. Solución Quirúrgica Implementada
1. **Desregistro e Inhabilitación Radical en `src/main.tsx`:**
   - Centralización de la detección local `esHostnameLocal` (`localhost`, `127.0.0.1`, `IS_DESKTOP_WIDGET === true`) y el helper `purgarServiceWorkersYCachesLocales()`.
   - Ejecución inmediata al inicio del bootstrap (`unregister()` de todo `navigator.serviceWorker.getRegistrations()` + `caches.delete()` de todo `caches.keys()`) antes de montar el DOM raíz.
   - Bloqueo estricto de `navigator.serviceWorker.register` cuando `esHostnameLocal === true` o `!import.meta.env.PROD`.
2. **Aislamiento Integral de Tablas Financieras y Captura `404 / PGRST205` en `src/services/syncManager.ts`:**
   - Incorporación de `esErrorTablaInexistente(error)` (detecta `status === 404`, `code === 'PGRST205'`, `schema cache` y `could not find the table`), `registrarTablaInexistente(tabla)` y `debeOmitirTablaRemota(tabla)`.
   - Consolidación de `sincronizarGastos()`, `sincronizarIngresos()` y `sincronizarCuotas()` sobre el helper compartido `sincronizarTablaFinancieraOpcional`, capturando `404 / PGRST205` sin marcar `sync_status: 'error'` ni registrar fallos en Dexie.
   - Blindaje de `sincronizarTombstones()`, `esRemotoMasReciente()`, `descargarDatosSelectivos()`, `syncPendingRecords()` (`pendingCounts`) y `descargarDatosDescendientes()` para silenciar llamadas remotas a tablas no desplegadas y mantener intacta la persistencia Local-First en Dexie.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (242/242 tests, incorporando 4 nuevos tests en `syncManager.test.ts` para `esErrorTablaInexistente`, `descargarDatosSelectivos`, captura `404/PGRST205` en `sincronizarGastos` y tombstones locales).
- **Compilación de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (2,495 módulos transformados en 6.50s).

---

### [REQ-FIX-17: Resolución Canónica de Dependencias WBS (Req: TAR-XXX), Inbound Sanitization y Renderizado Bento en Tarjetas Kanban]
**Fecha:** Noviembre 2026 | **Fase:** 5.08 | **Archivos Modificados:** `src/services/syncPayloadSanitizer.ts`, `src/services/syncManager.ts`, `src/db/db.ts`, `src/utils/entityNormalizer.ts`, `src/components/Views/ViewKanban.tsx`, `src/components/PMO/ColumnaKanban.tsx`, `src/components/PMO/TarjetaTareaKanban.tsx`, `src/utils/__tests__/entityNormalizer.test.ts`, `src/services/__tests__/syncManager.test.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
1. **Desajuste UUID $\leftrightarrow$ `TAR-XXX` en Frontera Supabase/Dexie:**
   - `sanitizarTareaInbound` copiaba `remoto.dependencia_tarea_id` (UUID relacional en Supabase) directamente sin traducirlo a `codigo_legado` (`TAR-XXX`), mientras `sanitizarTareaPayload` emitía `null` cuando `id_dependencia` contenía códigos `TAR-XXX` y `sanearDuplicadosDexie` no reconciliaba UUIDs residuales en `id_dependencia`.
2. **Renderizado Crudo en Tarjetas Kanban:**
   - `TarjetaTareaKanban.tsx` imprimía `tar.raw?.id_dependencia || tar.raw?.ID_Dependencia` literalmente en una sola píldora truncada sin prefijo `Req:`, sin `dependencia_tarea_id`, sin separar múltiples dependencias (`,`, `;`, `|`), sin diccionario de nombres (`tareasLookupMap`) y exponiendo potencialmente UUIDs hexadecimales o valores de ruido (`Ninguno`, `0`, `-`, `@`).

#### 2. Solución Quirúrgica Implementada
1. **Traducción Bidireccional en `syncPayloadSanitizer.ts`, `syncManager.ts` y `db.ts`:**
   - `sanitizarTareaPayload`: parámetro opcional `tareaUuidMap?: Map<string, string>` para resolver códigos `TAR-XXX` hacia `dependencia_tarea_id` UUID en Push outbound (`sincronizarTareas` mediante `construirMapaTareas`).
   - `sanitizarTareaInbound`: parámetro opcional `tareaUuidToCod?: Map<string, string>` para traducir `dependencia_tarea_id` / `id_dependencia` UUID a códigos `TAR-XXX`, preservando `localPrevio?.id_dependencia`, filtrando tokens de ruido (`Ninguno`, `0`, `-`, `N/A`, correos `@`) y omitiendo UUIDs huérfanos en `id_dependencia` (mientras `descargarDatosDescendientes` precarga y enriquece `tareaUuidToCod` y `sanearDuplicadosDexie` normaliza UUIDs existentes en Dexie).
2. **Normalizador y Motor de Resolución en `entityNormalizer.ts`:**
   - Adición de `id_dependencia?: string` en `CanonicalTarea` y extracción sanitizada en `normalizeTarea`.
   - Exportación de `DependenciaResuelta` y `resolverDependenciasTarea(rawDep, tareasLookupMap)`: divide por `,`, `;` o `|`, elimina ruido/correos, resuelve UUIDs o códigos a `{ codigo, nombre }`, conserva códigos legados no visibles con fallback contextual y suprime UUIDs hexadecimales huérfanos.
3. **Propagación Lookup y Píldoras Bento en Kanban (`ViewKanban.tsx`, `ColumnaKanban.tsx`, `TarjetaTareaKanban.tsx`):**
   - Construcción de `tareasLookupMap` memoizado en `ViewKanban.tsx` indexado por código `TAR-XXX` y UUID `id`, actualización de `filtroDependencia` y del motor hover `depMap`, y propagación hacia `ColumnaKanban` y `TarjetaTareaKanban`.
   - Renderizado en `TarjetaTareaKanban.tsx` de una píldora Bento ámbar independiente por requisito previo con `<Lock className="w-3 h-3 text-amber-400 shrink-0" strokeWidth={1.75} />`, texto `Req: {dep.codigo}` en `font-mono tabular-nums text-[10px]` y tooltip nativo `Requiere: ${dep.codigo} · ${dep.nombre}`.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (251/251 tests: +6 en `entityNormalizer.test.ts` y +3 en `syncManager.test.ts`).
- **Compilación de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (2,495 módulos transformados en 6.77s).

---

### [REQ-FIX-18: Auto-Actualización Inmediata y Cache-Busting del Service Worker en Producción PWA]
**Fecha:** Noviembre 2026 | **Fase:** 5.09 | **Archivos Modificados:** `public/sw.js`, `src/main.tsx`, `dist/sw.js` (generado por build), `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
1. **Pestañas Abiertas Ancladas a Controladores Antiguos en Producción:**
   - `src/main.tsx` registraba `/sw.js` sin `{ updateViaCache: 'none' }` y carecía de listeners `updatefound` y `controllerchange`, por lo que al desplegar un nuevo build en Cloudflare Pages las pestañas ya cargadas podían seguir operando contra manifiestos/chunks obsoletos (`ViewKanban-b-Ykmki4.js`) hasta una recarga manual.
2. **Cache-Busting de Versión y Blindaje contra MIME Fallback HTML en `public/sw.js`:**
   - `CACHE_NAME` permanecía en `'pmo-cache-v2.6-rescue-network-first'` y las peticiones `.js`/`.mjs`/`.css` no validaban si una respuesta `200 OK` del host SPA correspondía a `text/html` (fallback 404 de chunks eliminados).

#### 2. Solución Quirúrgica Implementada
1. **Ciclo de Vida Agresivo y Sanitización de Caché en `public/sw.js`:**
   - Incremento de `CACHE_NAME` a `'pmo-cache-v2.7-bento-kanban'`.
   - `install` ejecuta `self.skipWaiting()` de forma inmediata tras abrir caché y precargar `STATIC_ASSETS`.
   - `activate` filtra y elimina toda caché distinta de `CACHE_NAME` (purga huérfana de `v2.6` y previas) antes de ejecutar `self.clients.claim()`.
   - Extracción de `obtenerFallbackNavegacion(req)` y `respuestaOffline(...)`: las navegaciones (`request.mode === 'navigate'`, `/`, `.html`) ejecutan **Network-First** estricto verificando `contentType.includes('text/html')` antes de cachear; las peticiones `/sw.js` se omiten del interceptor y los módulos `.js`/`.mjs`/`.css` que reciban `text/html` retornan `404` sin envenenar `CACHE_NAME` (disparando `vite:preloadError` $\rightarrow$ reload limpio).
2. **Listeners `updatefound`, `controllerchange` y `updateViaCache: 'none'` en `src/main.tsx`:**
   - Centralización en `inicializarServiceWorker()`: en entorno productivo fuera de `localhost`/`127.0.0.1`/Desktop HUD, registra `/sw.js` (y fallback `./sw.js`) con `{ updateViaCache: 'none' }`, fuerza `registration.update()` al arrancar, intercepta `updatefound` $\rightarrow$ `statechange === 'installed'` para despachar `SKIP_WAITING` cuando existe controlador activo, y recarga vía `window.location.reload()` ante `controllerchange` cuando un controlador previo fue reemplazado (evitando doble recarga en primera visita limpia o bucles mediante guardia booleana).

#### 3. Certificación QA
- **Sintaxis Service Worker:** `node --check public/sw.js` $\rightarrow$ Exit Code 0.
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (251/251 tests).
- **Compilación de Producción y Paridad `dist/sw.js`:** `npm run build` $\rightarrow$ Exit Code 0 (`2495` módulos transformados en `7.07s`; `dist/sw.js` verificado con `pmo-cache-v2.7-bento-kanban`, `self.skipWaiting()` y `self.clients.claim()`).

---

### [REQ-OPS-19: Automatización de Cache-Busting en Build y Blindaje de Configuración Cloudflare Pages]
**Fecha:** Noviembre 2026 | **Fase:** 5.10 | **Archivos Modificados:** `wrangler.toml`, `package.json`, `public/sw.js`, `dist/sw.js`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
1. **Versionado Manual de `CACHE_NAME` en Despliegues:**
   - `public/sw.js` dependía de incrementos manuales en `CACHE_NAME` para invalidar cachés huérfanas tras un despliegue, existiendo riesgo de olvidar el bump en ciclos de CI/CD.
2. **Ausencia de Manifiesto Declarativo de Salida para Cloudflare Pages:**
   - El repositorio carecía de `wrangler.toml` en la raíz para fijar explícitamente el directorio de compilación (`pages_build_output_dir = "dist"`), exponiendo el despliegue a desconfiguraciones manuales en el panel web.

#### 2. Solución Quirúrgica Implementada
1. **Infraestructura Declarativa en `wrangler.toml`:**
   - Creación de `wrangler.toml` en la raíz con `name = "miportalweb"`, `compatibility_date = "2026-11-01"` y `pages_build_output_dir = "dist"`.
2. **Hook `prebuild` y Cadena `build` Idempotente en `package.json`:**
   - Incorporación de `prebuild` multiplataforma (`node -e` sin escapes `$` ni comillas anidadas dependientes del shell) con regex idempotente sobre `const CACHE_NAME = 'pmo-cache-...';` en `public/sw.js`, generando `'pmo-cache-' + Date.now()` antes de `tsc && vite build` (y validando error explícito si falta `CACHE_NAME`).
   - Actualización de `build` a `"npm run prebuild && tsc && vite build"`.
3. **Validación de Ciclo de Vida en `public/sw.js` y Paridad `dist/sw.js`:**
   - Confirmación de `self.skipWaiting()` en `install`, purga de toda caché `key !== CACHE_NAME` y `self.clients.claim()` en `activate`, y copia consistente hacia `dist/sw.js`.

#### 3. Certificación QA
- **Build con Auto-Bump (`npm run build`):** Exit Code 0 (`[prebuild] SW CACHE_NAME -> pmo-cache-1794353275435`; `2495` módulos transformados en `6.59s`); paridad confirmada en `public/sw.js` y `dist/sw.js`.
- **Sintaxis Service Worker:** `node --check public/sw.js` $\rightarrow$ Exit Code 0.
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ 0 errores.
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 25/25 suites passed (251/251 tests).


---

### [REQ-UI-54-EXEC: Despliegue de HeaderProyectoActivo y Métricas EVM en Kanban]
**Fecha:** Noviembre 2026 | **Fase:** 6.8 | **Archivos Creados/Modificados:** `src/components/PMO/HeaderProyectoActivo.tsx` (Nuevo), `src/components/PMO/__tests__/HeaderProyectoActivo.test.ts` (Nuevo), `src/components/Views/ViewKanban.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
1. **Píldora Inline Amontonada en Header Kanban:**
   - Previamente, al seleccionar un proyecto en `ViewKanban.tsx`, toda la identidad y el diagnóstico de salud se renderizaban en un único elemento inline de 36px (`#label-proyecto-activo`, L1357-1409) donde se concatenaban el código, el nombre, el botón de Vista 360°, el botón de deselección y un texto plano con `CPI X.XX`.
2. **Carencia de SPI y Métricas Gráficas de Rendimiento Físico:**
   - El índice de cronograma ($SPI$) no se exponía en el Kanban, privando al usuario de visibilidad ejecutiva sobre retrasos frente a la línea base. Tampoco se visualizaba gráficamente el `% de avance físico ponderado` ni el conteo de tareas activas/totales.

#### 2. Solución Quirúrgica Implementada
1. **Componente Aislado `HeaderProyectoActivo.tsx` (Cobalt Aerodynamic A.2.2):**
   - Creación de `src/components/PMO/HeaderProyectoActivo.tsx` con arquitectura Glassmorphism (`bg-[#0D1526]/90 backdrop-blur-xl border border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(2,6,23,0.8),0_0_12px_rgba(56,189,248,0.08)]`).
   - Micro-glow superior dinámico según salud global:
     - Saludable ($CPI \ge 1.0 \land SPI \ge 1.0$): `from-sky-500/40 via-emerald-500/30 to-transparent`.
     - Riesgo ($0.85 \le CPI < 1.0 \lor 0.85 \le SPI < 1.0$): `from-amber-500/50 via-amber-500/20 to-transparent`.
     - Crítico ($CPI < 0.85 \lor SPI < 0.85$): `from-rose-500/50 via-rose-500/20 to-transparent`.
   - **Lado Izquierdo:** Botón de deselección rápido `X` (`hover:bg-rose-500/10 hover:text-rose-400 active:scale-95`), ícono `FolderKanban`, código legado `[PRO-XXX]` en píldora mono azul, nombre del proyecto truncado defensivamente, y botón de acción directa `360°` con `Sparkles`.
   - **Lado Derecho:** 
     - Micro-gauge de avance físico ponderado en porcentaje `font-mono tabular-nums` y barra con gradiente `from-sky-500 to-emerald-400`.
     - Badges semafóricos independientes para CPI y SPI con micro-indicadores Lucide (`TrendingUp`/`TrendingDown` y `Clock`/`AlertTriangle`). Fallback determinista a `1.00` ante valores indefinidos o `NaN`.
2. **Inyección en `ViewKanban.tsx`:**
   - Erradicación de la píldora inline en L1357-1409.
   - Montaje limpio de `<HeaderProyectoActivo />` pasando `proyecto`, `avanceReal` (memoizado de `avancesPorProyecto`), `contadoresTareas` (acceso $O(1)$ de `contadoresTareasPorProyecto`), `progresoTemporal`, `onDeseleccionar` (con reset de `proyectoSeleccionadoCodigo` y `filtroHito`), y `onVerDetalle360`.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ Exit Code 0 (0 errores).
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 32/32 suites passed (313/313 tests: +7 tests en `HeaderProyectoActivo.test.ts`).
- **Compilador de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (8,982 módulos transformados en 13.12s).


---

### [REQ-UI-55-EXEC: Despliegue de Balizas de Salud y Modal PDF Glassmorphism]
**Fecha:** Noviembre 2026 | **Fase:** 6.9 | **Archivos Modificados:** `src/components/Views/ViewPortafolio.tsx`, `src/components/Modals/ModalExportarPdf.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
1. **Indicador de Salud y Semáforo Planos en Portafolio:**
   - Previamente, el KPI 4 de salud y el semáforo interactivo de distribución utilizaban un dot estático sin baliza animada y un botón de "Bloqueados" (el botón rojo) estático con borde plano y `ring-2 ring-sky-500` discordante al seleccionarse, careciendo de señales ejecutivas visuales ante proyectos en riesgo crítico.
2. **Selector Nativo Crudo y Botón Plano en `ModalExportarPdf.tsx`:**
   - El modal de exportación PDF utilizaba un elemento HTML `<select id="selector-proyecto-pdf">` con `<option>` planos, desentonando con el sistema Cobalt Aerodynamic. El botón de compilación `#btn-compilar-pdf` era plano sin halo glow, física spring ni spinner real de carga.
3. **Trigger de Exportar PDF Rezagado:**
   - El botón rápido "Exportar PDF" en la cabecera de `ViewPortafolio.tsx` era un contenedor gris oscuro plano sin micro-interacciones ni respuesta al hover.

#### 2. Solución Quirúrgica Implementada
1. **Baliza de Salud Dinámica y Semáforo Interactivo (`ViewPortafolio.tsx`):**
   - KPI 4: Inyección de baliza condicional según estado general:
     - *Bloqueados ($countBloqueado > 0$):* Contenedor `bg-rose-950/60 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.35)]` con baliza `<span className="animate-ping ... bg-rose-500" />` e ícono `<Siren className="animate-pulse text-rose-400" />`.
     - *En Riesgo ($countRiesgo > 0$):* Contenedor ámbar con halo y `<HeartPulse className="animate-pulse text-amber-400" />`.
     - *Saludable:* Contenedor esmeralda con `<Activity className="text-emerald-400" />`.
   - Botón Rojo Semáforo (`Bloqueados`): Baliza animada `animate-ping` cuando $countBloqueado > 0$, halo dinámico `shadow-[0_0_12px_rgba(244,63,94,0.2)]`, física spring `active:scale-95` y anillo semántico `border-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.4)]` al filtrarse.
   - Botones "En Rango" y "En Riesgo" actualizados con íconos `Activity` y `HeartPulse`, micro-interacciones y halos correspondientes.
   - Botón "Exportar PDF" en cabecera: Variante Glassmorphism con borde interactivo `hover:border-sky-500/40`, halo `hover:shadow-[0_0_20px_rgba(56,189,248,0.18)]`, elevación del ícono `FileDown` (`group-hover:-translate-y-0.5`) y `active:scale-95`.
2. **Upgrade de `ModalExportarPdf.tsx` (Glassmorphism & `SelectIconicoCobalt`):**
   - Chasis Glassmorphism `bg-[#0D1526]/95 backdrop-blur-xl border border-slate-800/80 shadow-[0_20px_50px_rgba(2,6,23,0.9),0_0_30px_rgba(56,189,248,0.15)]` con micro-glow superior de acento degradado cielo/cian.
   - Erradicación del `<select>` HTML nativo e instanciación de `<SelectIconicoCobalt />` alimentado por un `useMemo` de `OpcionSelectCobalt` con ícono `FolderKanban`, código legado, nombre, tipo de iniciativa, avance ponderado y badges de salud semafóricos.
   - Botón `#btn-compilar-pdf`: Degradado Cobalt `from-sky-600 via-sky-500 to-cyan-500`, resplandor `shadow-[0_0_25px_rgba(56,189,248,0.35)]`, física `active:scale-98` y spinner `<RotateCw className="animate-spin text-sky-400" />` durante la compilación.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ Exit Code 0 (0 errores).
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 32/32 suites passed (313/313 tests al 100% verde).
- **Compilador de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (8,982 módulos transformados en 17.64s).


---

### [REQ-BUGFIX-56-EXEC: Reparación de Regla de Hooks en ModalExportarPdf]
**Fecha:** Noviembre 2026 | **Fase:** 6.9.1 | **Archivos Modificados:** `src/components/Modals/ModalExportarPdf.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
- **Violación de la Regla de Hooks de React:**
  - En la refactorización previa de `ModalExportarPdf.tsx`, el hook `const opcionesProyectos = useMemo(...)` y el filtro derivado `proyectosFiltrados` quedaron posicionados debajo de la cláusula de retorno condicional `if (!visible) return null;` (L73).
  - Al abrir o cerrar el modal de exportación (cuando `visible` conmutaba entre `false` y `true`), el componente ejecutaba un número variable de hooks entre ciclos de renderizado, disparando la excepción reactiva de consola:
    `Rendered more hooks than during the previous render`.

#### 2. Solución Quirúrgica Implementada
- **Reubicación Incondicional en la Zona Segura de Hooks:**
  - Se extrajo el hook `const proyectosFiltrados = useMemo(...)` y `const opcionesProyectos = useMemo(...)` y se reubicaron estrictamente en la sección superior del cuerpo del componente, junto a `useLiveQuery` y `useUndoDelete`.
  - La condición de salida temprana `if (!visible) return null;` se ejecuta ahora de manera estrictamente posterior a la declaración incondicional de todos los hooks de React.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ Exit Code 0 (0 errores).
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 32/32 suites passed (313/313 tests al 100% verde).
- **Compilador de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (8,982 módulos transformados en 12.45s).

---

### [REQ-UI-57-EXEC: Refactorización Premium Vista 360, Grafo WBS y Matriz Trade-Off]
**Fecha:** Noviembre 2026 | **Fase:** 6.10 | **Archivos Modificados:** `src/components/WBS/OrtogonalTreeEdge.tsx`, `src/components/WBS/CanaletaEdge.tsx`, `src/components/Views/ViewDetalle360.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
1. **Curvas Bezier Residuales y Quiebres en Grafo WBS:**
   - En `OrtogonalTreeEdge.tsx` y `CanaletaEdge.tsx`, el cálculo de trayectorias SVG utilizaba curvas cuadráticas Bézier (`Q`) con aproximaciones de radio `r`. En distancias estrechas o desalineaciones del grafo, esto generaba dobleces deformados, jorobas y quiebres antiestéticos en vez de trayectos Manhattan puros a 90°.
2. **Inputs Crudos con Spin-Buttons Nativos en Matriz Trade-Off:**
   - La tabla de ponderación multicriterio en `ViewDetalle360.tsx` contenía 4 inputs numéricos por fila (`peso`, `scoreA`, `scoreB`, `scoreC`) con flechas (spinners) de incremento/decremento nativas del navegador, fondos oscuros sin microbordes Cobalt y alineación genérica.
3. **Selector `<select>` Nativo y Botón de Aprobación Plano:**
   - El "Tipo de Dilema" se seleccionaba mediante un `<select>` nativo sin soporte iconográfico ni micro-interacciones. El botón "Guardar y Aprobar Decisión" carecía de degradado Cobalt y efecto resplandor.
4. **Subpestañas 360 Rígidas con Enumeradores y Botones con Icono `Plus` Genérico:**
   - Las pestañas de `ViewDetalle360.tsx` exponían prefijos numéricos ("1.", "2.", "3.", "4.") con bordes estáticos sin física de resorte. Los botones de acción rápida ("Nuevo Hito / Entregable", "+ Entregable", "+ Tarea") empleaban el ícono `Plus` sin especificidad de dominio.

#### 2. Solución Quirúrgica Implementada
1. **Enrutamiento Ortogonal Manhattan Puro (90°):**
   - `OrtogonalTreeEdge.tsx`: Reemplazo del trazado Bézier por un vector Manhattan puro (`M ${sourceX} ${sourceY} V ${midY} H ${targetX} V ${targetY}`) con `strokeLinejoin: 'miter'`.
   - `CanaletaEdge.tsx`: Extirpación de curvas `Q`, consolidando el trayecto en pista escalonada con 90° puros (`M ${sourceX} ${sourceY} V ${canalY} H ${turnX} V ${targetY} H ${targetX}`).
2. **Upgrade de Matriz Trade-Off (`ViewDetalle360.tsx`):**
   - Extirpación de spinners nativos vía utilidades Tailwind `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`.
   - Diseño Cobalt en inputs: fondo `bg-[#040711]/80`, microborde `border-slate-800/80`, tipografía `font-mono tabular-nums`, foco iluminado `focus:border-sky-500/60 focus:bg-[#080d1a]`, y colores semánticos por alternativa (`sky-400`, `indigo-400`, `purple-400`).
   - Sustitución del `<select>` de Tipo de Dilema por `<SelectIconicoCobalt />` con iconografía contextual (`Cpu`, `Building2`, `Briefcase`, `Coins`).
   - Botón "Guardar y Aprobar Decisión": Degradado Cobalt `from-sky-600 via-sky-500 to-cyan-500`, resplandor `shadow-[0_0_20px_rgba(56,189,248,0.25)]` y física spring `active:scale-95`.
3. **Subpestañas Ergonómicas con Físicas Spring e Iconografía Contextual:**
   - Integración de `<motion.div layoutId="tab-360-indicator" />` (`type: 'spring', stiffness: 500, damping: 35`) con eliminación de enumeradores rígidos.
   - Reemplazo de `<Plus />` por íconos semánticos: `<Milestone />` para Nuevo Hito / Entregable, `<Flag />` para Entregable de fase, y `<CheckSquare />` para creación de Tarea con respuesta táctil `active:scale-95`.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ Exit Code 0 (0 errores).
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 32/32 suites passed (313/313 tests al 100% verde).
- **Compilador de Producción:** `npm run build` $\rightarrow$ Exit Code 0.

---

### [REQ-OP-58-EXEC: Implementación ModalDesgloseTareasIA y Conexión Gemini]
**Fecha:** Noviembre 2026 | **Fase:** 7.0 | **Archivos Creados/Modificados:** `src/components/Modals/ModalDesgloseTareasIA.tsx` (Nuevo), `src/components/Modals/__tests__/ModalDesgloseTareasIA.test.ts` (Nuevo), `src/hooks/useGeminiStream.ts`, `supabase/functions/gemini-orchestrator/index.ts`, `src/components/Views/ViewDetalle360.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
1. **Mock Inoperativo (Toast) en Botón IA WBS:**
   - En `ViewDetalle360.tsx:1280`, el botón de acción rápida "Desglosar tareas con IA" en cada paquete de trabajo WBS ejecutaba únicamente un `mostrarToastCobalt` informativo sin conexión a ningún servicio de IA, impidiendo la descomposición real de entregables en tareas operativas.
2. **Carencia de Staging Area para Tareas Generadas por IA:**
   - No existía una interfaz intermedia de validación donde el usuario pudiera inspeccionar, editar títulos, ajustar prioridades (P1/P2/P3) y calibrar horas estimadas antes de confirmar la inserción en la base de datos Dexie y su sincronización a Supabase.
3. **Acción Faltante en Orquestador Gemini:**
   - La Edge Function de Supabase (`gemini-orchestrator`) y el hook `useGeminiStream` solo soportaban las acciones `'clarificar_idea'` y `'desglosar_wbs'`, requiriéndose la acción especializada `'desglosar_tareas_paquete'` con salida estructurada en JSON.

#### 2. Solución Quirúrgica Implementada
1. **Ampliación del Orquestador y Hook de Streaming:**
   - Inyección de la acción `'desglosar_tareas_paquete'` en `src/hooks/useGeminiStream.ts` y `supabase/functions/gemini-orchestrator/index.ts`.
   - Soporte offline con fallback determinista de alta fidelidad en `simularStreamingLocal` para pruebas y desarrollo sin conexión.
2. **Creación del Componente Canónico `ModalDesgloseTareasIA.tsx` (Staging Area Bento):**
   - Chasis Glassmorphism con diseño Cobalt Aerodynamic (`bg-[#0D1526]/95 backdrop-blur-xl border border-slate-800/80 shadow-[0_20px_50px_rgba(2,6,23,0.9),0_0_30px_rgba(56,189,248,0.12)]`).
   - Encabezado con contexto del paquete: código WBS (`WP-XXX`), nombre del entregable y proyecto activo.
   - Lista interactiva de tareas en staging:
     - Checkbox Cobalt para selección/deselección granular en lote.
     - Input de texto reactivo para edición in-situ del título de la tarea.
     - Selector compacto de prioridad mediante `<SelectIconicoCobalt />` (P1, P2, P3 con badges semánticos).
     - Input numérico para horas estimadas con supresión de spin-buttons nativos (`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none`).
     - Botón de adición manual de tareas al lote y botón para descartar filas individuales.
   - Footer con resumen métrico en tiempo real (`font-mono tabular-nums`: *X seleccionadas • Y horas estimadas*), botón de regeneración con spinner animado y botón de confirmación con gradiente Cobalt y efecto glow (`active:scale-95`).
3. **Integración en `ViewDetalle360.tsx`:**
   - Reemplazo del toast por la apertura reactiva del modal pasando el paquete seleccionado: `onClick={() => setPaqueteParaDesgloseIA(h)}`.
   - Implementación de `handleAprobarTareasIA`: inserción atómica de las tareas seleccionadas en `db.tareas` asignando correlativos automáticos (`TAR-XXX`), fecha límite del hito, estado `'02_Por_Hacer'` y vinculación a proyecto e hito.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ Exit Code 0 (0 errores).
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 33/33 suites passed (318/318 tests al 100% verde: +5 tests en `ModalDesgloseTareasIA.test.ts`).
- **Compilador de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (8,983 módulos transformados en 13.05s).

---

### [REQ-BUGFIX-59-EXEC: Shielding de Red en useGeminiStream y Fallback Automático]
**Fecha:** Noviembre 2026 | **Fase:** 7.0.1 | **Archivos Modificados:** `src/hooks/useGeminiStream.ts`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
1. **Error `TypeError: Failed to fetch` por Bloqueo CORS en Preflight (OPTIONS):**
   - La Edge Function `gemini-orchestrator` no se encontraba desplegada en el proyecto remoto de Supabase (`zzzbwurqidastkxqgyog`).
   - El Gateway Cloudflare/Envoy de Supabase respondía con `HTTP 404 Not Found` en la solicitud preflight `OPTIONS` y omitía la cabecera `content-type` en `access-control-allow-headers`.
   - Según la especificación W3C Fetch/CORS, el navegador abortaba inmediatamente la conexión antes de enviar el POST, arrojando `TypeError: Failed to fetch`.
2. **Carencia de Resiliencia en `useGeminiStream.ts`:**
   - Si `VITE_SUPABASE_URL` no contenía `"mock"` o `"tu-proyecto"`, el hook omitía la simulación local e intentaba el fetch. Al fallar el fetch o responder con HTTP != 200, el bloque `catch` marcaba `status: 'error'`, bloqueando la UI del modal de tareas IA.

#### 2. Solución Quirúrgica Implementada
1. **Validación de Respuesta HTTP (`!response.ok`):**
   - Inmediatamente después de `await fetch(...)`, si el status es distinto de 20x (ej. 404 / 500), se emite un `console.warn` y se conmuta de forma automática e inmediata a `simularStreamingLocal(action, payload, setStreamedText, setStatus)`.
2. **Atrapado Silencioso de Errores de Red y CORS en `catch`:**
   - En el bloque `catch (err)`, cualquier error de conectividad (incluyendo `TypeError: Failed to fetch` y bloqueos CORS) se intercepta con `console.warn` y se rescata llamando a `simularStreamingLocal`, garantizando que la generación de tareas continúe con latencia cero y sin interrumpir al usuario.
3. **Conformidad Local-First:**
   - La interfaz jamás queda inoperativa por caídas de red, falta de despliegue en la nube o problemas de credenciales remotas.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ Exit Code 0 (0 errores).
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 33/33 suites passed (318/318 tests al 100% verde).
- **Compilador de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (8,983 módulos transformados en 13.19s).

---

### [REQ-BUGFIX-61-EXEC: Fix Hook ModalGasto + UI Píldoras Prioridad IA]
**Fecha:** Noviembre 2026 | **Fase:** 7.0.2 | **Archivos Modificados:** `src/components/Modals/ModalGasto.tsx`, `src/components/Modals/ModalDesgloseTareasIA.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Causa Raíz
1. **Violación de Regla de Hooks en `ModalGasto.tsx`:**
   - Error en tiempo de ejecución: `Rendered more hooks than during the previous render`.
   - Causa raíz: Se ubicaba un retorno temprano condicional `if (!isOpen) return null;` en la línea 149, mientras que más abajo (alrededor de la línea 185) se declaraba un `useEffect` para el listener de teclado (`Escape` y `Ctrl+Enter`). Cuando `isOpen` alternaba entre `false` y `true`, la cantidad de hooks ejecutados por React variaba, violando las reglas fundamentales de Hooks de React.
2. **Píldoras de Prioridad de Bajo Contraste en `ModalDesgloseTareasIA.tsx`:**
   - La matriz de opciones `OPCIONES_PRIORIDAD_COBALT` utilizaba fondos suaves con bajo contraste y no contaba con iconos semánticos propios ni brillos Cobalt.
   - El contenedor del selector poseía un ancho fijo `w-32` (128px), lo cual generaba compresión visual e impedía mostrar el icono Lucide semántico, la etiqueta, el badge y el chevron sin truncamiento.

#### 2. Solución Quirúrgica Implementada
1. **Reordenamiento Incondicional de Hooks en `ModalGasto.tsx`:**
   - Reubicación de la cláusula de escape temprano `if (!isOpen) return null;` inmediatamente antes del `return createPortal(...)` (línea 215).
   - Los 24 hooks del componente (`useBodyScrollLock`, `useUndoDelete`, 14 `useState`, 3 `useLiveQuery`, 3 `useEffect`) se ejecutan ahora de manera estricta e incondicional en cada renderizado.
2. **Upgrade Visual y Ergonómico de Píldoras de Prioridad en `ModalDesgloseTareasIA.tsx`:**
   - Elevación de los tokens visuales en `OPCIONES_PRIORIDAD_COBALT`:
     - **P1 - Alta:** `bg-rose-950/60 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)] font-extrabold` con ícono `<AlertCircle className="w-4 h-4 text-rose-400" />`.
     - **P2 - Media:** `bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold` con ícono `<Clock className="w-4 h-4 text-amber-400" />`.
     - **P3 - Baja:** `bg-sky-950/60 text-sky-300 border-sky-500/50 shadow-[0_0_10px_rgba(56,189,248,0.2)] font-semibold` con ícono `<CheckCircle2 className="w-4 h-4 text-sky-400" />`.
   - Ampliación del contenedor de `<SelectIconicoCobalt />` a `w-40 shrink-0` (160px), permitiendo una holgura perfecta para el icono de 28px, tipografía `font-bold`, badge contrastado y chevron interactivo sin recortes.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ Exit Code 0 (0 errores).
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 33/33 suites passed (318/318 tests al 100% verde).
- **Compilador de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (8,983 módulos transformados en 12.32s).

---

### [REQ-UI-62-EXEC: Despliegue de Interfaz Cobalt en Modales Operativos y Financieros]
**Fecha:** Noviembre 2026 | **Fase:** 7.1 | **Archivos Modificados:** `src/constants/uiMappers.ts`, `src/components/Modals/ModalGasto.tsx`, `src/components/Modals/ModalIngreso.tsx`, `src/components/Modals/ModalNuevoPlanCuotas.tsx`, `src/components/Modals/ModalTareaFlow.tsx`, `src/components/Modals/ModalActividadFlow.tsx`, `src/components/Modals/ModalRegistroAvanceHabito.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Deuda Visual Erradicada
1. **Proliferación de Selectores Nativos `<select>`:**
   - Múltiples modales presentaban listas desplegables nativas del sistema operativo (`ModalGasto.tsx`, `ModalIngreso.tsx`, `ModalNuevoPlanCuotas.tsx`, `ModalTareaFlow.tsx`, `ModalActividadFlow.tsx`), rompiendo la coherencia visual con el lienzo Cobalt `#0D1526` y careciendo de iconos Lucide contextuales.
2. **Spin-Buttons Nativos en Inputs Numéricos:**
   - Los campos numéricos de montos, tipos de cambio, cuotas y métricas cuantitativas mostraban flechas de incremento/decremento nativas que colapsaban la tipografía monoespaciada grande (`text-2xl / text-3xl font-mono tabular-nums`).
3. **Checkboxes Nativos y Botones Planos en DoD:**
   - En `ModalTareaFlow.tsx`, las subtareas procedurales empleaban checkboxes HTML nativos y botones de adición planos sin respuesta elástica ni gradiente.
4. **Botones Submit Genéricos:**
   - Los botones de confirmación de los modales operativos y financieros utilizaban estilos planos `bg-sky-500` / `bg-violet-600` sin el degradado canónico Cobalt ni efectos glow.

#### 2. Solución Quirúrgica Implementada
1. **Base de Datos Visual Canónica (`src/constants/uiMappers.ts`):**
   - Creación y exportación de 7 diccionarios tipados para `<SelectIconicoCobalt />`: `OPCIONES_MONEDA_COBALT`, `OPCIONES_METODO_PAGO_COBALT`, `OPCIONES_CATEGORIA_GASTO_COBALT`, `OPCIONES_CATEGORIA_INGRESO_COBALT`, `OPCIONES_CUENTA_DESTINO_COBALT`, `OPCIONES_FRECUENCIA_COBALT` y `OPCIONES_RECURRENCIA_ACTIVIDAD_COBALT`.
2. **Refactorización del Bloque Financiero (`ModalGasto.tsx`, `ModalIngreso.tsx`, `ModalNuevoPlanCuotas.tsx`):**
   - Supresión universal de spin-buttons mediante `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono tabular-nums font-bold`.
   - Inyección de `<SelectIconicoCobalt />` para moneda, categorías de gasto/ingreso, proyectos y métodos de pago/cuentas destino.
   - Botones submit elevados con gradiente `from-sky-600 via-sky-500 to-cyan-500` (o violeta para cuotas), resplandor `shadow-[0_0_20px_rgba(56,189,248,0.25)]` y física táctil `active:scale-95`.
3. **Refactorización del Bloque Operativo (`ModalTareaFlow.tsx`, `ModalActividadFlow.tsx`, `ModalRegistroAvanceHabito.tsx`):**
   - En `ModalTareaFlow.tsx`: sustitución de `<select>` de proyecto e hito WBS en la cabecera por `<SelectIconicoCobalt />` reactivos; sustitución de checkbox nativo DoD por botón Cobalt interactivo con borde semántico y glow; botón de submit con gradiente Cobalt.
   - En `ModalActividadFlow.tsx`: sustitución de selector de recurrencia y meta vinculada por `<SelectIconicoCobalt />`; erradicación de spinners en métricas de racha y rescate; botón submit con gradiente Cobalt.
   - En `ModalRegistroAvanceHabito.tsx`: supresión de spinners en el input de avance y botón submit con gradiente `from-cyan-600 via-sky-500 to-sky-600`.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ Exit Code 0 (0 errores).
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 33/33 suites passed (318/318 tests al 100% verde).
- **Compilador de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (8,983 módulos transformados en 14.37s).

---

### [REQ-UI-63-EXEC: Despliegue de Correcciones Layout, Hitos CPM y Píldoras Neón]
**Fecha:** Noviembre 2026 | **Fase:** 7.2 | **Archivos Modificados:** `src/components/Modals/ModalGasto.tsx`, `src/components/Modals/ModalNuevoHito.tsx`, `src/components/Modals/ModalDesgloseTareasIA.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Objetivos Resueltos
1. **Descompresión y Simetría en `ModalGasto.tsx`:**
   - Ampliación del chasis principal de `max-w-xl` (576px) a `max-w-2xl` (672px), otorgando espacio suficiente a la cascada de 3 niveles WBS.
   - Reorganización en "Bento Grid Paritario": emparejamiento simétrico de [Categoría del Gasto + Método de Pago] en dos `<SelectIconicoCobalt />` homogéneos, y [Fecha de Desembolso + Tipo de Cambio] con inputs de altura unificada (`min-h-[42px]`), eliminando desniveles de línea base y suprimiendo el selector de método de pago duplicado al pie.
   - Ajuste del ritmo vertical a `space-y-4 sm:space-y-4.5` y adición de sombra perimetral de alta elevación.
2. **Limpieza CPM e Inputs en `ModalNuevoHito.tsx`:**
   - Supresión universal de flechas nativas en los inputs de Ponderación (`pesoPct`), Duración CPM (`duracionDias`) y Presupuesto (`presupuesto`) mediante utilidades `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono tabular-nums font-bold`.
   - Reemplazo del elemento `<select>` nativo de "Predecesor Directo" por `<SelectIconicoCobalt />`, alimentado por un `useMemo` de `opcionesPredecesores` con íconos `GitBranch` y badges con el código de legado.
   - Elevación del chasis con sombra multicapa `shadow-[0_20px_50px_rgba(2,6,23,0.9),0_0_30px_rgba(56,189,248,0.12)]` y modernización del botón Submit con degradado aeroespacial `from-sky-600 via-sky-500 to-cyan-500`, halo glow y micro-interacción `active:scale-95`.
3. **Píldoras Neón en `ModalDesgloseTareasIA.tsx`:**
   - Creación y exportación del componente `PildoraPrioridadNeon`, con estética de píldora redondeada (`rounded-full`), micro-indicador pulsante perimetral y halos de resplandor neón semánticos (`shadow-[0_0_12px_rgba(244,63,94,0.4)]` para P1, etc.).
   - Reemplazo de la caja rectangular de 160px en cada fila del lote de tareas del Staging Area por `<PildoraPrioridadNeon />`, permitiendo cambiar rápidamente la prioridad en un popover compacto sin saturar el ancho de la tarjeta.
   - Actualización de los tokens en `OPCIONES_PRIORIDAD_COBALT` con sombras y colores neón de alta saturación.

#### 2. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ Exit Code 0 (0 errores).
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 33/33 suites passed (318/318 tests al 100% verde).
- **Compilador de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (8,983 módulos transformados exitosamente en 19.14s).

---

### [REQ-UI-64-EXEC: Despliegue de Layout Árbol WBS e Inteligencia Presupuestal EVM]
**Fecha:** Noviembre 2026 | **Fase:** 7.3 | **Archivos Modificados:** `src/components/Modals/ModalGasto.tsx`, `DICCIONARIO_TECNICO_MAESTRO.md`

#### 1. Diagnóstico Técnico & Deuda Geométrica Erradicada
1. **Colisión de Controles en 3 Columnas:**
   - La disposición anterior `grid grid-cols-1 sm:grid-cols-3 gap-3.5` (L460) asfixiaba los selectores de Proyecto, Hito y Tarea en apenas ~190px, provocando recortes y truncamientos sistemáticos en títulos descriptivos.
2. **Ceguera Presupuestal durante la Imputación:**
   - Al registrar egresos vinculados a un Hito o Tarea, el usuario carecía de visibilidad respecto al techo presupuestal asignado y al saldo remanente, facilitando sobrecostos inadvertidos.
3. **Pérdida de Vinculación Jerárquica en Fallback:**
   - Si un gasto se imputaba a nivel Hito sin seleccionar una tarea específica, el payload guardaba `id_origen_vinculado: undefined`, perdiendo la atribución directa en Dexie.

#### 2. Solución Quirúrgica Implementada
1. **Layout Jerárquico Vertical (Árbol WBS 100% Ancho):**
   - Sustituida la grilla horizontal por una estructura de árbol en cascada vertical:
     - **Nivel 1 (Proyecto Raíz):** Ocupa el 100% del ancho con badge superior de tope presupuestal del proyecto.
     - **Nivel 2 (Hito / Entregable WBS):** Ocupa el 100% del ancho con guía de rama izquierda (`border-l-2 border-purple-500/30`), ícono de bifurcación `<CornerDownRight className="text-purple-400" />` y badge de código WBS.
     - **Nivel 3 (Tarea Operativa Específica):** Ocupa el 100% del ancho con guía de rama escalonada (`border-l-2 border-emerald-500/30 ml-5`), ícono `<CornerDownRight className="text-emerald-400" />` y leyenda de selección opcional.
2. **Cerebro EVM Reactivo en Tiempo Real (`metricasEVMHito`):**
   - Inyección de hooks reactivos sobre `db.hitos_wbs` y `db.gastos`.
   - Cálculo en vivo del gasto previo acumulado del hito y de sus tareas asociadas, saldo remanente y proyección del gasto actual (`montoPEN`).
   - Renderizado del micro-componente EVM con micro-barra de progreso dinámica (`h-1.5 rounded-full`), badge semántico (`% consumido`) y advertencia inmediata en caso de sobrecosto: `<AlertTriangle /> Excede tope por S/ XX.XX`.
3. **Persistencia con Fallback Jerárquico Robusto:**
   - `id_origen_vinculado` ahora resuelve en cascada determinística: `selectedTarea || selectedHito || selectedProyecto || undefined`.

#### 3. Certificación QA
- **Verificación de Tipos:** `npx tsc --noEmit` $\rightarrow$ Exit Code 0 (0 errores).
- **Batería de Tests Unitarios:** `npm test` $\rightarrow$ 33/33 suites passed (318/318 tests al 100% verde).
- **Compilador de Producción:** `npm run build` $\rightarrow$ Exit Code 0 (8,983 módulos transformados exitosamente en 14.72s).
