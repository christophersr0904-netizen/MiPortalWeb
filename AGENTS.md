# AGENTS.md - GOBERNANZA CANÓNICA DEL PMO PERSONAL & LIFE OS

Este archivo establece las directrices maestras y reglas inquebrantables de ejecución para cualquier agente de inteligencia artificial en este proyecto.

---

## 1. PIPELINE DE ROLES Y SUBAGENTES (REGLA MANDATORIA)
Toda solicitud técnica debe respetar estrictamente los roles convocados en `.antigravity/rules/01_subagents_pipeline.md`:
- **ROL 1 (Inspector Técnico):** Solo lectura (`view_file`, `grep_search`). Cero escrituras. Emite tablas de diagnóstico y evaluación de riesgos.
- **ROL 2 (Maquetador UI/UX):** Intervenciones en `src/components/`, modales y vistas. Aplica estrictamente los tokens **Cobalt Aerodynamic** (`#040711`, `#0D1526`, microborde `border-slate-800/40`, Lucide React con `strokeWidth={1.75}`). Cero emojis en DOM.
- **ROL 3 (Arquitecto de Datos):** Mantenimiento de esquemas en `DICCIONARIO_TECNICO_MAESTRO.md`, `tablas.md`, Dexie (IndexedDB) y Supabase. Normalización con `entityNormalizer.ts`.
- **ROL 4 (Cirujano de Código):** Lógica de negocio, conexión de estado, servicios y hooks. Diffs quirúrgicos mínimos. Cero regresiones.
- **ROL 5 (Auditor QA y Deployer):** Verificación obligatoria al cierre con `npx tsc --noEmit` y `npm test` (Vitest). Si hay fallas, se revierte de inmediato.

---

## 2. ARQUITECTURA TÉCNICA Y CONFINAMIENTO
- **Stack Moderno Activo:** React 19 + TypeScript (estricto) + Vite + Tailwind CSS + Dexie + Supabase.
  - Uso mandatorio de `import` / `export` ES Modules.
  - Tipado TypeScript verificado sin `any` elusivo.
- **Confinamiento `legacy_gas/`:** Todo el código heredado de Google Apps Script (`.html`, `.gs`) está confinado en `legacy_gas/`. No aplicar restricciones de Apps Script al frontend moderno.

---

## 3. SISTEMA DE DISEÑO CANÓNICO: COBALT AERODYNAMIC (A.2.2)
- **Lienzo Base:** `bg-[#040711]`.
- **Superficie Flotante Primaria:** `#0D1526` con `border border-slate-800/40` y sombra multicapa `box-shadow: 0 10px 25px -5px rgba(2, 6, 23, 0.8), 0 8px 10px -6px rgba(30, 58, 138, 0.18);`. Hover: `translate-y-[-2px]`.
- **Filtros / Ghost Controls:** Sin marcos toscos. Texto inactivo `text-slate-400 hover:text-sky-300`, activo `text-sky-300 bg-sky-950/30` con microindicador inferior.
- **Iconografía:** Lucide React con `strokeWidth={1.75}`, sin cajas pesadas de fondo.
- **Tipografía Numérica:** Inquebrantablemente `font-mono tabular-nums` para toda cifra, importe, hora, fecha o porcentaje.

---

## 4. REGLAS TRANSVERSALES DE NEGOCIO
- **Blindaje de Atajos y Despacho LIFO:** Inhibición en `INPUT`, `TEXTAREA`, `SELECT` y contenedores editables. `Escape` cierra en orden LIFO de z-index. Atajos numéricos 1..5 para vistas principales.
- **Bóveda de Archivados (+10 Días):** Umbral temporal estricto (`diffDias > 10`). Reactivación con `_desarchivado === true`.
- **Tablero Kanban y DoD:** Validación mandatoria de `validarDoDSubtareas()` antes de completar tareas. Modal TareaFlow Bento con 3 tarjetas maestras elevadas.
- **Serialización de Notas:** Exclusivamente vía `serializarNotaATextoPlano(nota)`.

---

## 5. DOCUMENTACIÓN DE REFERENCIA (SINGLE SOURCE OF TRUTH)
- `DICCIONARIO_TECNICO_MAESTRO.md`: Especificación técnica exhaustiva de arquitectura, componentes y changelog.
- `tablas.md`: Diccionario de esquemas y campos relacionales.
- `.antigravity/rules/`: Reglas detalladas de subagentes, arquitectura y tokens.
