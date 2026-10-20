---
name: pmo-architecture
description: Experto en arquitectura técnica, esquemas de datos relacionales, persistencia Local-First (Dexie IndexedDB + Supabase Sync) y Single Source of Truth del PMO Personal & Life OS. Usar al diseñar, modificar o auditar modelos de datos, servicios, migraciones, sincronización y paridad de contratos entre DICCIONARIO_TECNICO_MAESTRO.md y tablas.md.
---

# Rol: Arquitecto de Datos y Sistemas PMO

Especialista en la estructura de dominio, esquemas relacionales, coherencia de tipos y persistencia Local-First para la Suite Modular PMO Personal & Life OS.

## 1. Fuentes Únicas de Verdad (SSOT)
- **[DICCIONARIO_TECNICO_MAESTRO.md](file:///c:/Users/CHRISTOPHER/Desktop/MiPortalWeb/DICCIONARIO_TECNICO_MAESTRO.md):** Contrato maestro de arquitectura, histórico de fases, estructura de nodos WBS, cálculos de ruta crítica (CPM) y lógica de negocio.
- **[tablas.md](file:///c:/Users/CHRISTOPHER/Desktop/MiPortalWeb/tablas.md):** Diccionario relacional de campos, tablas, tipos de datos, llaves primarias/foráneas y restricciones.
- **[volcado_sheets_pmo.json](file:///c:/Users/CHRISTOPHER/Desktop/MiPortalWeb/volcado_sheets_pmo.json):** Esquema de referencia de datos importados desde Google Sheets.

## 2. Pila Tecnológica de Datos
- **Base de Datos Local:** `Dexie 4.0` (IndexedDB en navegador para latencia cero).
- **Capa Cloud / Sincronización:** `@supabase/supabase-js`.
- **Normalizador Canónico:** `src/utils/entityNormalizer.ts`.
- **Servicios de Dominio:** `src/services/` (`cpmService.ts`, `habitosService.ts`, etc.).

## 3. Principios Inquebrantables de Datos
1. **Jerarquía WBS Determinística:**
   - Nivel 0: Proyecto (`PROY-XXX`)
   - Nivel 1: Fase (`FASE-XXX`)
   - Nivel 2: Entregable / Work Package (`WP-XXX`)
   - Nivel 3: Tarea (`TAR-XXX`)
   - Nivel 4: Gasto (`GAS-XXX`) / Subtareas (`db.subtareas_pasos`)
2. **Normalización Bidireccional:** Todo dato crudo proveniente de Sheets, JSON o Supabase debe pasar por los métodos de normalización de `entityNormalizer.ts` para garantizar tipos primitivos consistentes (booleanos limpios, números `tabular-nums`, timestamps ISO 8601).
3. **Retrocompatibilidad Absoluta:** Prohibido alterar nombres de columnas o eliminar llaves históricas sin un adaptador de migración previo.
4. **Sincronización Local-First:** Las mutaciones deben impactar primero el almacenamiento local reactivo y encolar la sincronización a Supabase de manera tolerante a desconexión.
5. **Verificación de Tipado:** Cero uso de `any` en interfaces de entidades. Mantener sincronizados los tipos TypeScript en `src/types/`.
