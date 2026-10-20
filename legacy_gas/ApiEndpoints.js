/**
 * ============================================================================
 * ARCHIVO: ApiEndpoints.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * NOTA DE REFACTORIZACIÓN MODULAR:
 * ============================================================================
 * Este archivo monolítico ha sido segregado con éxito en servicios de dominio:
 *  - ApiRouter.js         -> Enrutador maestro HTTP, doGet, doPost, onEditTrigger, include()
 *  - DashboardService.js  -> Extracción agregada y caché del dashboard
 *  - ProyectosService.js  -> CRUD, salud y autocompletado de iniciativas
 *  - HitosService.js      -> Gestión de hitos y dependencias cronológicas
 *  - TareasService.js     -> Tareas operativas y subtareas procedurales (SUB-XXX)
 *  - FinanzasService.js   -> Gastos, ingresos y tipo de cambio
 *  - ActividadesService.js-> Hábitos personales, ciclos y rachas
 * ============================================================================
 */