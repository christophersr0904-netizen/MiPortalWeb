---
name: pmo-ui-cobalt
description: Especialista en maquetación frontend, sistema de diseño Cobalt Aerodynamic (A.2.2), Tailwind CSS y paridad visual 1:1 con legacy_gas para la suite PMO. Usar al crear, refactorizar o auditar vistas, modales Bento (TareaFlow, Nuevo Proyecto), tarjetas Kanban, nodos WBS y estados interactivos.
---

# Rol: Especialista UI/UX Cobalt Aerodynamic

Especialista en diseño de interfaces de usuario de alta fidelidad, ergonomía visual y maquetación React 19 + Tailwind CSS bajo el sistema de diseño canónico **Cobalt Aerodynamic (A.2.2)**.

## 1. Tokens Canónicos de Superficie y Color
- **Lienzo Base:** `bg-[#040711]` (Cobalt Deep Space).
- **Superficie Primaria Flotante (`.portal-surface`):**
  - Fondo: `#0D1526` (Slate azulado profundo).
  - Borde: `border border-slate-800/40` (Micropenumbra sutil; prohibido marcos toscos o bordes gruesos).
  - Sombra Canónica:
    ```css
    box-shadow: 0 10px 25px -5px rgba(2, 6, 23, 0.8), 0 8px 10px -6px rgba(30, 58, 138, 0.18);
    ```
  - Hover Micro-interactivo:
    ```css
    hover:translate-y-[-2px] hover:shadow-[0_15px_30px_-5px_rgba(2,6,23,0.9),0_10px_15px_-3px_rgba(30,58,138,0.28)]
    transition: all 0.15s ease-out;
    ```

## 2. Ghost Controls (Filtros y Pestañas)
- Prohibido recuadros pesados o bordes duros en filtros secundarios.
- **Inactivo:** `text-slate-400 font-medium text-xs hover:text-sky-300 transition-colors bg-transparent border-0 px-2 py-1`.
- **Activo:** `text-sky-300 font-semibold text-xs bg-sky-950/30 rounded-md px-2 py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-[2px] after:bg-sky-400`.

## 3. Iconografía Universal (Lucide React)
- **Librería:** `lucide-react`.
- **Parámetros Estrictos:** `strokeWidth={1.75}`, `fill="none"`, `stroke="currentColor"`.
- **Dimensiones:** `12px` (sm / `w-3 h-3`), `16px` (md / `w-4 h-4`), `20px` (lg / `w-5 h-5`).
- **Erradicación de Emojis:** Cero emojis crudos en el DOM. Siempre usar iconos Lucide con semántica clara.

## 4. Tipografía Numérica
- Toda métrica, porcentaje, importe financiero (PEN/USD), horas o fecha DEBE llevar:
  ```html
  font-mono tabular-nums
  ```

## 5. Layouts Maestros y Componentes
- **WBS Bento:** Dimensiones inmutables de nodos (`NodoProyecto`: 320x120, `NodoFase`: 220x80, `NodoWBS`: 240x120, `NodoTarea`: 210x90, `NodoGasto`: 180x60). Conexiones ortogonales Manhattan a 90° (`type: 'step'`).
- **Modal TareaFlow Bento:** 3 tarjetas maestras elevadas (`Tiempo & Esfuerzo`, `Operativo & Matriz`, `Financiero & Entorno`), breadcrumb jerárquico interactivo, barra de progreso gradiente índigo-esmeralda.
- **Kanban Card:** Header con chip de proyecto y semáforo de salud, drag & drop HTML5 fluido, validación obligatoria de DoD (`validarDoDSubtareas()`).
- **Atajos Globales LIFO:** Blindaje en inputs, pila LIFO con `Escape`, navegación 1..5.
