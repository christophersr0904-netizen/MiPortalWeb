# CANONICAL DESIGN TOKENS: COBALT AERODYNAMIC (A.2.2)
## Estándar Visual y Sistema de Diseño Inquebrantable para PMO

---

### 1. PALETA CROMÁTICA Y SUPERFICIES MULTICAPA

#### A. Canvas y Lienzo Base:
- **Modo Oscuro Canónico:** `bg-[#040711]` (Cobalt Deep Space).
- **Modo Claro (si aplica):** `bg-slate-50`.

#### B. Superficie Flotante Primaria (`.portal-surface`):
- **Color de Fondo:** `#0D1526` (Slate oscuro con matiz azul noche profundo).
- **Microborde Perimetral:** `border border-slate-800/40` (Sin marcos duros ni trazos gruesos; micropenumbra sutil).
- **Relieve / Sombra Canónica:**
  ```css
  box-shadow: 0 10px 25px -5px rgba(2, 6, 23, 0.8), 0 8px 10px -6px rgba(30, 58, 138, 0.18);
  ```
- **Dinámica Hover:**
  ```css
  hover:translate-y-[-2px] hover:shadow-[0_15px_30px_-5px_rgba(2,6,23,0.9),0_10px_15px_-3px_rgba(30,58,138,0.28)]
  transition: all 0.15s ease-out;
  ```

---

### 2. CONTROLES FANTASMA Y FILTROS (GHOST CONTROLS)

- **Regla Estricta:** PROHIBIDO colocar marcos o recuadros toscos alrededor de filtros de cabecera o botones secundarios.
- **Filtros Inactivos:**
  ```html
  text-slate-400 font-medium text-xs hover:text-sky-300 transition-colors bg-transparent border-0 px-2 py-1
  ```
- **Filtros Activos:**
  ```html
  text-sky-300 font-semibold text-xs bg-sky-950/30 rounded-md px-2 py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-[2px] after:bg-sky-400
  ```

---

### 3. ICONOGRAFÍA UNIVERSAL (LUCIDE LINEAL)

- **Librería Obligatoria:** `lucide-react`.
- **Propiedades Estrictas:**
  - `strokeWidth={1.75}`
  - `fill="none"`
  - `stroke="currentColor"`
- **Dimensiones Canónicas:**
  - `.portal-icon-sm`: `12px × 12px` (`w-3 h-3`)
  - `.portal-icon`: `16px × 16px` (`w-4 h-4`)
  - `.portal-icon-lg`: `20px × 20px` (`w-5 h-5`)
- **Prohibiciones:** Sin cajas de fondo ni círculos pesados salvo botones circulares explícitos de acción. Prohibido insertar emojis crudos como iconos en el DOM.

---

### 4. BADGES SEMÁNTICOS Y TIPOGRAFÍA NUMÉRICA

#### A. Badges Semánticos:
- **Éxito / Completado:** `.badge-sem-emerald` (`text-emerald-400 bg-emerald-950/40 border border-emerald-800/40`).
- **Advertencia / Ruta Crítica / En Riesgo:** `.badge-sem-amber` (`text-amber-400 bg-amber-950/40 border border-amber-800/40`).
- **Peligro / Vencido / Bloqueado:** `.badge-sem-rose` (`text-rose-400 bg-rose-950/40 border border-rose-800/40`).
- **Neutro / Backlog / Pendiente:** `.badge-sem-slate` (`text-slate-400 bg-slate-900/60 border border-slate-800/40`).

#### B. Tipografía Numérica Obligatoria:
- Toda cifra, porcentaje, importe financiero (PEN / USD), fecha, hora, contador de tiempo estimado vs real o porcentaje de avance DEBE llevar de forma inquebrantable:
  ```html
  font-mono tabular-nums
  ```

---

### 5. GEOMETRÍA WBS & BENTO CARDS

- **Dimensiones Fijas de Tarjetas WBS:**
  - `NodoProyecto`: `w-[320px]`, `h-[120px]`.
  - `NodoFase`: `w-[220px]`, `h-[80px]`.
  - `NodoWBS`: `w-[240px]`, `h-[120px]`.
  - `NodoTarea`: `w-[210px]`, `h-[90px]`.
  - `NodoGasto`: `w-[180px]`, `h-[60px]`.
- **Enrutamiento Manhattan Colector:** Conexiones jerárquicas ortogonales a 90° (`type: 'step'`), canaleta despejada para dependencias inter-tareas sin atravesar cuerpos de nodos.
