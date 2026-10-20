/**
 * ============================================================================
 * ARCHIVO: ApiRouter.js
 * SISTEMA: PMO Personal Modular & Gestión Integral de Vida
 * VERSION: Modular v2.0 - 1790199514214
 * ROL: Enrutador Maestro HTTP, Triggers de Hoja, Caché y Despachador Transaccional
 * ============================================================================
 */

// ============================================================================
// SECCIÓN 1: DISPARADORES DE HOJA (TRIGGERS)
// ============================================================================

/**
 * 1.1. Trigger onEdit para sincronización en tiempo real hacia Google Calendar
 */
function onEditTrigger(e) {
  try {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();
    const sheetName = sheet.getName();
    const row = e.range.getRow();
    const col = e.range.getColumn();
    if (row <= 1) return;

    // Invalida caché al detectar edición manual directa en Sheets
    invalidarCacheDashboard();

    // Sincronización en Tareas de Proyecto (Cols E=5, G=7, I=9, K=11)
    if (sheetName === CONFIG.SHEETS.TAREAS && [5, 7, 9, 11].includes(col)) {
      if (typeof CalendarService !== "undefined" && CalendarService.sincronizarFilaTarea) {
        CalendarService.sincronizarFilaTarea(row);
      }
    }

    // Sincronización en Actividades Personales (Col J=10, K=11, L=12)
    if (sheetName === CONFIG.SHEETS.ACTIVIDADES_PERSONALES && [10, 11, 12].includes(col)) {
      if (typeof CalendarService !== "undefined" && CalendarService.sincronizarFilaActividadPersonal) {
        CalendarService.sincronizarFilaActividadPersonal(row);
      }
    }
  } catch (err) {
    Logger.log("[onEditTrigger Error]: " + err.message);
  }
}

// ============================================================================
// SECCIÓN 2: PUNTOS DE ENTRADA HTTP (doGet / doPost)
// ============================================================================

/**
 * 2.1. Endpoint GET: Sirve la Web App nativa o entrega JSON REST
 */
function doGet(e) {
  const params = e ? (e.parameter || {}) : {};
  const action = params.action;

  if (action) {
    let responseData = {};
    try {
      responseData = procesarLecturaBackend(action);
    } catch (error) {
      responseData = { success: false, error: error.message };
    }

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle("PMO Personal & Vida Modular")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/**
 * 2.2. Endpoint POST: Ejecución de transacciones seguras
 */
function doPost(e) {
  let result = {};
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Cuerpo de solicitud POST no encontrado.");
    }
    const postData = JSON.parse(e.postData.contents);
    result = procesarAccionBackend(postData.action, postData.payload || {});
  } catch (error) {
    result = { success: false, error: error.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// SECCIÓN 3: ENRUTADOR INTERNO (apiRouter)
// ============================================================================

/**
 * 3.1. Router interno con serialización universal blindada
 */
function apiRouter(action, payload) {
  try {
    var res = procesarAccionBackend(action, payload || {});
    
    var act = String(action || "").trim().toLowerCase();
    if (/^(create|update|delete|completar|conciliar|desvincular|guardar|eliminar|sanear|pagar|toggle|reordenar|adjuntar|marcar)/.test(act)) {
      invalidarCacheDashboard();
    }

    if (res === null || res === undefined) {
      return JSON.stringify({ success: false, error: "El backend devolvió un valor nulo" });
    }
    return JSON.stringify(res);
  } catch (err) {
    Logger.log("[apiRouter Fatal Error]: " + err.message);
    return JSON.stringify({ success: false, error: "Error en el servidor: " + err.message });
  }
}

/**
 * Invalida el caché global del dashboard y de notas para sincronización inmediata
 */
function invalidarCacheDashboard() {
  try {
    const cache = CacheService.getScriptCache();
    cache.removeAll([
      "DASHBOARD_DATA_CACHE",
      "NOTAS_DATA_CACHE",
      "IDEAS_DATA_CACHE",
      "DASHBOARD_CACHE",
      "PORTAFOLIO_DATA_CACHE",
      "KANBAN_DATA_CACHE"
    ]);
  } catch (e) {
    Logger.log("[Cache Remove Error]: " + e.message);
  }
}

/**
 * Sobrescribe de forma atómica una hoja de cálculo filtrando filas en memoria.
 * Evita bloqueos concurrentes y demoras por bucles de deleteRow().
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Hoja de cálculo a modificar.
 * @param {Function} predicateConservar - Función (row, index) => boolean que retorna true para conservar la fila.
 * @returns {number} Número de filas eliminadas.
 */
function sobrescribirHojaFiltrada(sheet, predicateConservar) {
  if (!sheet) return 0;
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return 0;

  const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  const data = dataRange.getValues();
  const filasConservadas = [];
  let eliminadas = 0;

  for (let i = 0; i < data.length; i++) {
    if (predicateConservar(data[i], i)) {
      filasConservadas.push(data[i]);
    } else {
      eliminadas++;
    }
  }

  if (eliminadas === 0) return 0;

  // 1. Limpiar el contenido de datos existente desde la fila 2
  dataRange.clearContent();

  // 2. Si quedan filas conservadas, reescribirlas en un único lote continuo
  if (filasConservadas.length > 0) {
    sheet.getRange(2, 1, filasConservadas.length, lastCol).setValues(filasConservadas);
  }

  return eliminadas;
}

// ============================================================================
// SECCIÓN 4: MOTOR CENTRAL TRANSACCIONAL (DESPACHADOR POR DOMINIO)
// ============================================================================

/**
 * 4.1. Despachador maestro de acciones operativas hacia servicios de dominio
 */
function procesarAccionBackend(action, payload) {
  const act = String(action || "").trim().toLowerCase();

  // 1. Lectura agregada con caché inteligente
  if (act === "getdashboarddata") {
    return DashboardService.getDashboardData(payload);
  }

  // 2. Dominio: Tareas y Subtareas (SUB-XXX)
  if (act === "createtarea") return TareasService.createTarea(payload);
  if (act === "updatetarea" || act === "updatetaskstate") return TareasService.updateTarea(payload);
  if (act === "deletetarea") return TareasService.deleteTarea(payload);
  if (act === "createsubtarea" || act === "guardarsubtarea" || act === "guardarpaso") return TareasService.createSubtarea(payload);
  if (act === "updatesubtareacompletado" || act === "togglesubtarea" || act === "togglepaso") return TareasService.updateSubtareaCompletado(payload);
  if (act === "updatesubtarea") return TareasService.updateSubtarea(payload);
  if (act === "reordenarsubtareas") return TareasService.reordenarSubtareas(payload);
  if (act === "deletesubtarea") return TareasService.deleteSubtarea(payload);

  // 3. Dominio: Actividades Personales / Vida / Hábitos
  if (act === "createactividadpersonal" || act === "createactividad") return ActividadesService.createActividadPersonal(payload);
  if (act === "completaractividadpersonal") return ActividadesService.completarActividadPersonal(payload);
  if (act === "updateestadoactividadpersonal") return ActividadesService.completarActividadPersonal(payload);
  if (act === "updatefechaactividadpersonal") return ActividadesService.updateFechaActividadPersonal(payload);
  if (act === "updateactividadpersonal" || act === "updateactividad") return ActividadesService.updateActividadPersonal(payload);
  if (act === "deleteactividadpersonal" || act === "deleteactividad") return ActividadesService.deleteActividadPersonal(payload);
  if (act === "registraravancecuantitativo" || act === "registraravanceactividad") return ActividadesService.registrarAvanceCuantitativo(payload);

  // 4. Dominio: Finanzas (Gastos e Ingresos)
  if (act === "creategasto") return FinanzasService.createGasto(payload);
  if (act === "updategasto") {
  const res = FinanzasService.updateGasto(payload);
  // Persist calculated amounts if montoOriginal / tipoCambio / monedaOriginal changed
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = FinanzasService.obtenerHojaGastos(ss);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const id = payload.idGasto || payload.ID_GASTO || "";
      let rowIdx = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][CONFIG.COLS_FINANZAS.ID_GASTO]).trim() === String(id).trim()) {
          rowIdx = i + 1;
          break;
        }
      }
      if (rowIdx !== -1) {
        const mOrig = payload.montoOriginal !== undefined ? parseFloat(payload.montoOriginal) : parseFloat(data[rowIdx - 1][CONFIG.COLS_FINANZAS.MONTO_ORIGINAL] || 0);
        const tc = payload.tipoCambio !== undefined ? parseFloat(payload.tipoCambio) : parseFloat(data[rowIdx - 1][CONFIG.COLS_FINANZAS.TIPO_CAMBIO] || 1);
        const mon = payload.monedaOriginal || String(data[rowIdx - 1][CONFIG.COLS_FINANZAS.MONEDA_ORIGINAL] || "PEN").trim();
        const mPen = (mon === "PEN") ? mOrig : (mOrig * tc);
        const mUsd = (mon === "USD") ? mOrig : (tc > 0 ? (mPen / tc) : 0);
        if (CONFIG.COLS_FINANZAS.MONTO_PEN !== undefined) {
          sheet.getRange(rowIdx, CONFIG.COLS_FINANZAS.MONTO_PEN + 1).setValue(mPen);
        }
        if (CONFIG.COLS_FINANZAS.MONTO_USD !== undefined) {
          sheet.getRange(rowIdx, CONFIG.COLS_FINANZAS.MONTO_USD + 1).setValue(mUsd);
        }
      }
    }
  } catch (e) {
    Logger.log("[ApiRouter updategasto persistence error]: " + e.message);
  }
  return res;
}
  if (act === "desvinculargasto") return FinanzasService.desvincularGasto(payload);
  if (act === "deletegasto") return FinanzasService.deleteGasto(payload);
  if (act === "createingreso") return FinanzasService.createIngreso(payload);
  if (act === "updateingreso") return FinanzasService.updateIngreso(payload);
  if (act === "deleteingreso") return FinanzasService.deleteIngreso(payload);
  if (act === "obtenertipocambio") return FinanzasService.obtenerTipoCambio(payload);

  // 4b. Dominio: Finanzas Avanzadas (Flujo de Caja, Cuotas, Conciliación, Métricas)
  if (act === "createmovimiento" || act === "crearmovimientoflujocaja") return FinanzasAvanzadasService.createMovimiento(payload);
  if (act === "updatemovimiento") return FinanzasAvanzadasService.updateMovimiento(payload);
  if (act === "deletemovimiento") return FinanzasAvanzadasService.deleteMovimiento(payload);
  if (act === "conciliarmovimiento" || act === "conciliartransaccion") return FinanzasAvanzadasService.conciliarTransaccion(payload);
  if (act === "desconciliarmovimiento") return FinanzasAvanzadasService.desconciliarMovimiento(payload);
  if (act === "createplancuotas" || act === "crearplancuotas" || act === "creargastoencuotas") return FinanzasService.crearGastoEnCuotas(payload);
  if (act === "pagarsiguientecuota" || act === "pagarcuota") return FinanzasService.pagarSiguienteCuota(payload);
  if (act === "sanearcuotasdesfasadas" || act === "sanearcuotas") return FinanzasService.sanearCuotasDesfasadas(payload);
  if (act === "updateplancuotas") return FinanzasAvanzadasService.updatePlanCuotas(payload);
  if (act === "deleteplancuotas") return FinanzasAvanzadasService.deletePlanCuotas(payload);
  if (act === "calcularmetricasavanzadas" || act === "getmetricasfinanzas") return FinanzasAvanzadasService.calcularMetricasAvanzadas(payload);

  // 5. Dominio: Proyectos e Hitos
  if (act === "createproyecto") return ProyectosService.createProyecto(payload);
  if (act === "updateproyecto") return ProyectosService.updateProyecto(payload);
  if (act === "deleteproyecto" || act === "eliminarproyectoencascada") return ProyectosService.eliminarProyectoEnCascada(payload);
  if (act === "registrarcheckinproyecto") return ProyectosService.registrarCheckinProyecto(payload);
  if (act === "agendarrutinacontrolproyecto") {
    return (typeof CalendarService !== "undefined" && CalendarService.agendarRutinaControlProyecto)
      ? CalendarService.agendarRutinaControlProyecto(payload)
      : { success: false, error: "Servicio CalendarService no disponible" };
  }
  if (act === "autocompletarproyecto") return ProyectosService.generarSugerenciaAutocompletado(payload.nombreProyecto, payload.tipoIniciativa);
  if (act === "generarwbsintegralproyectoia") return ProyectosService.generarWbsIntegralProyectoIA(payload);
  if (act === "sugerirdesglosetareaspaqueteia" || act === "desglosartareasia") return ProyectosService.sugerirDesgloseTareasPaqueteIA(payload);
  if (act === "sugerirestructurawbsfaltanteia" || act === "completarwbsia") return ProyectosService.sugerirEstructuraWbsFaltanteIA(payload);
  if (act === "guardarestructuraproyectocompleta") return ProyectosService.guardarEstructuraProyectoCompleta(payload);
  if (act === "createhito") return HitosService.createHito(payload);
  if (act === "updatehito") return HitosService.updateHito(payload);
  if (act === "deletehito") return HitosService.deleteHito(payload);
  if (act === "guardardecisiontradeoff" || act === "createdecisiontradeoff") return ProyectosService.guardarDecisionTradeOff(payload);
  if (act === "obtenerdecisionestradeoff" || act === "getdecisionestradeoff") return ProyectosService.obtenerDecisionesTradeOff(payload);

  // 6. Dominio: Notas Inteligentes (Keep + OneNote)
  if (act === "obtenernotas" || act === "getnotas") return NotasService.obtenerNotas(payload);
  if (act === "guardarnota" || act === "crearnota" || act === "updatenota") return NotasService.guardarNota(payload);
  if (act === "togglepinnota" || act === "pinnote") return NotasService.togglePinNota(payload);
  if (act === "eliminarnota" || act === "deletenota") return NotasService.eliminarNota(payload);
  if (act === "actualizarchecklistnota" || act === "togglechecklistnota") return NotasService.actualizarChecklistNota(payload);
  if (act === "adjuntararchivonota" || act === "uploadadjuntonota") return NotasService.adjuntarArchivoNota(payload);
  if (act === "marcardeseoconseguido" || act === "wishlistconseguido") return NotasService.marcarDeseoConseguido(payload);
  if (act === "invalidarcachedashboard" || act === "invalidarcache" || act === "purgarcache") {
    invalidarCacheDashboard();
    return { success: true, timestamp: new Date().toISOString() };
  }

  // 6b. Dominio: Ideas Rápidas, Captura Multimodal y Triaje
  if (act === "obtenerideas" || act === "getideas") return IdeasService.obtenerIdeas(payload);
  if (act === "crearidea" || act === "createidea") return IdeasService.crearIdea(payload);
  if (act === "actualizaridea" || act === "updateidea") return IdeasService.actualizarIdea(payload);
  if (act === "moverideaincubacion" || act === "incubaridea") return IdeasService.moverIdeaIncubacion(payload);
  if (act === "marcarideaprocesada" || act === "procesaridea") return IdeasService.marcarIdeaProcesada(payload);
  if (act === "eliminaridea" || act === "deleteidea") return IdeasService.eliminarIdea(payload);
  if (act === "archivarideasvencidas" || act === "archivarideas") return IdeasService.archivarIdeasVencidas();
  if (act === "guardaradjuntoidea" || act === "adjuntararchivoidea") {
    const b64 = payload.base64Data || payload.base64;
    return DriveService.guardarArchivoAdjuntoIdea(payload.idIdea, b64, payload.mimeType, payload.fileName);
  }
  if (act === "transcribiraudioidea" || act === "transcribiridea") {
    return GeminiParserService.transcribirAudioIdea(payload);
  }
  if (act === "clarificarideaia" || act === "clarificaridea") {
    return GeminiParserService.clarificarIdeaIA(payload);
  }











  // 7. Servicios Externos Especializados (Calendar, Gemini, PDF)
  // NOTA: La sincronización batch de calendarios fue ELIMINADA.
  // La sincronización es ahora REACTIVA (al crear/editar cada registro individual).
  // La ruta 'migrarysincronizarcalendariosdedicados' ya no existe.
  if (act === "parsearcomprobante") {
    const b64 = payload.base64Data || payload.base64;
    return (typeof GeminiParserService !== "undefined" && GeminiParserService.parsearComprobante)
      ? GeminiParserService.parsearComprobante(b64, payload.mimeType, payload.contexto)
      : { success: false, error: "Servicio GeminiParserService no disponible" };
  }
  if (act === "generarfichapdf") {
    return (typeof ReporteriaService !== "undefined" && ReporteriaService.generarFichaPdf)
      ? ReporteriaService.generarFichaPdf(payload.idProyecto)
      : { success: false, error: "Servicio ReporteriaService no disponible" };
  }

  return { success: false, error: "Acción no reconocida: " + action };
}

function procesarLecturaBackend(tipo) {
  return { success: true, message: "PMO API Activa con Soporte Modular", timestamp: new Date() };
}

// ELIMINADO: ejecutarSincronizacionTotal() — la sincronización batch fue suprimida.
// ELIMINADO: migrarYSincronizarCalendariosDedicados() — la migración batch fue suprimida.
// La gobernanza ahora es REACTIVA: cada registro se sincroniza individualmente
// al momento de su creación o edición, respetando la regla estricta:
//   Duración > 0h → Google Calendar (Evento)
//   Duración = 0h → Google Tasks (Task)
//   Ingresos/Gastos/Cuotas → Google Tasks

/**
 * Inclusión modular canónica para plantillas de Google Apps Script HtmlService
 */
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

/**
 * Función transaccional global expuesta para Google Apps Script
 * Elimina un proyecto y todas sus dependencias en cascada
 */
function eliminarProyectoEnCascada(idProyecto) {
  return ProyectosService.eliminarProyectoEnCascada(idProyecto);
}

